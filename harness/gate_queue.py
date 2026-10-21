"""The run's test queue: correctness tests run beside the change loop, never in it.

The agent never sees a test result, so nothing in the loop has to wait for one. After every
checkpoint the run loop (run_experiment) only QUEUES a test of that checkpoint's agent commit and
goes on to the next agent turn:

    checkpoint  every checkpoint: just that checkpoint's own spec, the test that confirms its
                change was made. Four tests whatever the checkpoint number, so its cost is flat.
    full        every `gate.every`-th checkpoint and the chain's last, in place of `checkpoint`:
                the full cp01..cpK regression suite (mutative copies winning), the gate that finds
                lost behaviour. A regression between two full gates is found by the next one.
    finalise    at the end of a chain: commit the chain's results to its branch.

Everything belongs to ONE run and lives under its directory, so two runs on one machine (two
stacks side by side) never share a queue, a checkout, a port or a temp directory:

    work_root/runs/<run_id>/queued-tests/
        pending/<seq>.<key>.json   jobs waiting, oldest first (seq = enqueue time, ns)
        running/<seq>.<key>.json   the job in hand; back to pending/ when a processor starts and
                                   finds it orphaned (its processor was killed, or the machine
                                   rebooted)
        done/<seq>.<key>.json      finished jobs, kept: how a resume knows a test already ran
        failed/<seq>.<key>.json    jobs that raised, with the traceback; `retry-failed` requeues
        harness/<sha>/             the acceptance suite + checkpoints file at the harness commit a
                                   job names, extracted when the job is queued, so a test runs the
                                   suite of its own run even after main moves on
        results/<condition>-chainN/cpNN.json      a test's result (+ cpNN.test.log, its console)
        processor.lock             flock held by the run's one processor
    work_root/runs/<run_id>/testing/   the worktree a test checks the commit out into and loads
                                   the specs into
    work_root/runs/<run_id>/test.log   the processor's progress (harness.runlog): each job's start,
                                   steps and result, and every test as Playwright finishes it
    work_root/ports/<port>.lock    the port the tests serve the app on, claimed as
                                   "<run_id>-testing" (run_experiment.claim_port)

A test runs no agent, so it uses the normal /tmp, NOT the run's tmp: that one is on the agent's
allowlist, and Playwright caches the compiled specs under TMPDIR, so testing there would hand the
agent the suite it must not see. /tmp is denied to the agent (and verified before every turn).
Each test gets a fresh /tmp/<run_id>-testing-cpNN-* as its TMPDIR, deleted when it ends.

The finalise job commits the chain's results as evolve-results/tests/ (one record per test plus
summary.json, scored through correctness.Baseline exactly as analyze scores them) in a final
`tests:` commit after the chain's `results:` commit.

    python -m harness.gate_queue --config config.yaml --run-id <id> status
    python -m harness.gate_queue --config config.yaml --run-id <id> process   # normally started by the run
    python -m harness.gate_queue --config config.yaml --run-id <id> retry-failed
"""
from __future__ import annotations

import argparse
import contextlib
import copy
import fcntl
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import traceback
from datetime import datetime

import yaml

from . import capture, correctness, expand_path, runlog

HARNESS_DIR = os.path.dirname(os.path.abspath(__file__))
HARNESS_ROOT = os.path.dirname(HARNESS_DIR)
STATES = ("pending", "running", "done", "failed")
KINDS = ("checkpoint", "full", "finalise")
QUEUE = "queued-tests"
TESTING = "testing"
RESULTS_PATH = "evolve-results/tests"      # where a chain's results are committed on its branch
# The parts of the run's resolved config a test needs; a job carries them so the processor never
# depends on the config file or the run process still being there.
_CFG_KEYS = ("app", "build", "acceptance", "limits", "isolation", "agent", "gate")
_LOG_CAP = 1_000_000


# --- layout -------------------------------------------------------------------


def queue_dir(run_dir: str) -> str:
    q = os.path.join(run_dir, QUEUE)
    for d in (*STATES, "harness", "results", ".writing"):
        os.makedirs(os.path.join(q, d), exist_ok=True)
    return q


def _scratch(q: str) -> str:
    """For the queue's own atomic writes (a file is written here, then renamed into place)."""
    d = os.path.join(q, ".writing")
    os.makedirs(d, exist_ok=True)
    return d


def gate_every(cfg: dict) -> int:
    return max(1, int((cfg.get("gate") or {}).get("every") or 1))


def sampled(k: int, every: int, last: int | None) -> bool:
    """Whether checkpoint k gets the full suite: every `every`-th one and the chain's last."""
    return k % every == 0 or (last is not None and k == last)


def test_kind(k: int, every: int, last: int | None) -> str:
    return "full" if sampled(k, every, last) else "checkpoint"


def job_key(condition: str, chain: int, kind: str, k: int) -> str:
    return f"{condition}.chain{chain}.{kind}.cp{k:02d}"


def results_dir(run_dir: str, condition: str, chain: int) -> str:
    return os.path.join(run_dir, QUEUE, "results", f"{condition}-chain{chain}")


def port_owner(run_id: str) -> str:
    return f"{run_id}-testing"


def _jobs(q: str, state: str) -> list[str]:
    d = os.path.join(q, state)
    return sorted(os.path.join(d, f) for f in os.listdir(d) if f.endswith(".json"))


def _key_of(path: str) -> str:
    return os.path.basename(path)[:-len(".json")].split(".", 1)[1]


def _load(path: str) -> dict:
    with open(path) as fh:
        return json.load(fh)


def _write_atomic(path: str, obj: dict, tmp_dir: str) -> None:
    fd, tmp = tempfile.mkstemp(dir=tmp_dir, suffix=".json")
    with os.fdopen(fd, "w") as fh:
        json.dump(obj, fh, indent=2, default=str)
        fh.flush()
        os.fsync(fh.fileno())
    os.replace(tmp, path)


def find(q: str, key: str) -> list[tuple[str, str]]:
    """[(state, path)] of every job file with this key, oldest first."""
    out = [(st, p) for st in STATES for p in _jobs(q, st) if _key_of(p) == key]
    return sorted(out, key=lambda sp: os.path.basename(sp[1]))


def _has_job(q: str, condition: str, chain: int, k: int, commit: str) -> bool:
    """A checkpoint or full test of this commit is queued, running or done."""
    return any(_load(p).get("commit") == commit and st != "failed"
               for kind in ("checkpoint", "full")
               for st, p in find(q, job_key(condition, chain, kind, k)))


# --- enqueue (called by the run loop) ------------------------------------------


def _harness_commit(paths: list[str]) -> tuple[str, list[str]]:
    """The harness commit a job's suite comes from, and the tracked files under `paths` that
    differ from HEAD. A dirty tree is frozen as a `git stash create` commit (nothing in the
    checkout changes), so a test still runs exactly what the agent's checkpoint was set."""
    dirty = [ln[3:] for ln in subprocess.run(
        ["git", "-C", HARNESS_ROOT, "status", "--porcelain", "--untracked-files=no", "--", *paths],
        capture_output=True, text=True).stdout.splitlines() if ln.strip()]
    sha = ""
    if dirty:
        sha = subprocess.run(["git", "-C", HARNESS_ROOT, "stash", "create"],
                             capture_output=True, text=True).stdout.strip()
    if not sha:
        sha = subprocess.run(["git", "-C", HARNESS_ROOT, "rev-parse", "HEAD"],
                             capture_output=True, text=True, check=True).stdout.strip()
    return sha, dirty


def _checkpoints_rel(cfg: dict) -> str:
    rel = os.path.relpath(os.path.abspath(cfg["checkpoints_file"]), HARNESS_ROOT)
    if rel.startswith(".."):
        raise RuntimeError(f"checkpoints_file {cfg['checkpoints_file']!r} is outside the harness "
                           f"repo, so a test job cannot pin it to a harness commit")
    return rel


def ensure_snapshot(run_dir: str, sha: str, paths: list[str]) -> str:
    """runs/<run_id>/queued-tests/harness/<sha>: `paths` of the harness repo at `sha`."""
    q = queue_dir(run_dir)
    snap = os.path.join(q, "harness", sha)
    if os.path.isdir(snap):
        return snap
    tmp = tempfile.mkdtemp(dir=_scratch(q), prefix=f"harness-{sha[:12]}-")
    arch = subprocess.run(["git", "-C", HARNESS_ROOT, "archive", "--format=tar", sha, "--", *paths],
                          capture_output=True)
    if arch.returncode != 0:
        shutil.rmtree(tmp, ignore_errors=True)
        raise RuntimeError(f"git archive {sha[:12]} failed: {arch.stderr.decode()[:300]}")
    subprocess.run(["tar", "-x", "-C", tmp], input=arch.stdout, check=True)
    try:
        os.rename(tmp, snap)
    except OSError:                       # another enqueue extracted it first
        shutil.rmtree(tmp, ignore_errors=True)
    return snap


def _base_job(cfg: dict, run_id: str, condition: str, chain: int, branch: str, kind: str,
              k: int) -> dict:
    run_dir = cfg["paths"]["run_dir"]
    return {
        "kind": kind, "key": job_key(condition, chain, kind, k),
        "run_id": run_id, "condition": condition, "chain": chain, "checkpoint": k,
        "repo": cfg["app"]["repo"], "branch": branch, "base_ref": cfg["app"]["base_ref"],
        "run_dir": run_dir, "work_root": cfg["paths"]["work_root"],
        "results_dir": results_dir(run_dir, condition, chain),
        "enqueued_at": datetime.now().isoformat(timespec="seconds"),
    }


def _put(q: str, job: dict) -> str:
    path = os.path.join(q, "pending", f"{time.time_ns():020d}.{job['key']}.json")
    _write_atomic(path, job, _scratch(q))
    return path


def enqueue_test(cfg: dict, run_id: str, condition: str, chain: int, branch: str, k: int,
                 checkpoint_id: str, commit: str, kind: str) -> str:
    """Queue the `kind` test ('checkpoint': its own spec; 'full': the cp01..cpK suite) of
    `commit`. Idempotent: a job for the same checkpoint and commit that is pending, running or
    done is returned as it is. One for the same checkpoint but another commit (the chain was
    started again under the same run id) is superseded."""
    if kind not in ("checkpoint", "full"):
        raise ValueError(f"not a test kind: {kind!r}")
    q = queue_dir(cfg["paths"]["run_dir"])
    for any_kind in ("checkpoint", "full"):
        for state, path in find(q, job_key(condition, chain, any_kind, k)):
            if _load(path).get("commit") == commit and state != "failed" and any_kind == kind:
                return path
            if state in ("pending", "failed"):
                os.remove(path)
    cp_rel = _checkpoints_rel(cfg)
    paths = ["acceptance", cp_rel]
    sha, dirty = _harness_commit(paths)
    ensure_snapshot(cfg["paths"]["run_dir"], sha, paths)
    job = _base_job(cfg, run_id, condition, chain, branch, kind, k)
    job.update({"checkpoint_id": checkpoint_id, "commit": commit, "harness_sha": sha,
                "harness_dirty": dirty, "checkpoints_file": cp_rel,
                "cfg": {key_: copy.deepcopy(cfg.get(key_)) for key_ in _CFG_KEYS}})
    return _put(q, job)


def enqueue_finalise(cfg: dict, run_id: str, condition: str, chain: int, branch: str,
                     last: int) -> str:
    """Queue the commit of the chain's results. Queued after the chain's last test, so the
    processor reaches it only when every test of the chain has run."""
    q = queue_dir(cfg["paths"]["run_dir"])
    key = job_key(condition, chain, "finalise", last)
    for state, path in find(q, key):
        if state != "failed":
            return path
        os.remove(path)
    return _put(q, _base_job(cfg, run_id, condition, chain, branch, "finalise", last))


def queue_missing(cfg: dict, run_id: str, condition: str, chain: int, branch: str,
                  caps: dict[int, dict], done: int, final: bool) -> list[str]:
    """Queue the test of every committed checkpoint (capture records `caps`, up to cp`done`)
    that has none for its commit — after a crash between a checkpoint's reset commit and its
    enqueue — and with `final` the chain's finalise job (cp`done` then gets the full suite). A
    checkpoint tested in the loop (a capture from before the queue) is skipped. Returns the
    job files written."""
    q = queue_dir(cfg["paths"]["run_dir"])
    every, out = gate_every(cfg), []
    for k in sorted(caps):
        rec = caps[k]
        if k > done or (rec.get("tests") or {}).get("gated") is not False:
            continue
        kind = test_kind(k, every, done if final else None)
        commit = rec.get("commit_sha") or ""
        if kind == "checkpoint" and _has_job(q, condition, chain, k, commit):
            continue
        if kind == "full" and any(_load(p).get("commit") == commit and st != "failed"
                                  for st, p in find(q, job_key(condition, chain, "full", k))):
            continue
        out.append(enqueue_test(cfg, run_id, condition, chain, branch, k,
                                rec.get("checkpoint_id") or "", commit, kind))
    queued_any = any(_key_of(p).startswith(f"{condition}.chain{chain}.")
                     for st in STATES for p in _jobs(q, st))
    if final and queued_any and not find(q, job_key(condition, chain, "finalise", done)):
        out.append(enqueue_finalise(cfg, run_id, condition, chain, branch, done))
    return out


# --- the processor ------------------------------------------------------------


def _lock_path(run_dir: str) -> str:
    return os.path.join(queue_dir(run_dir), "processor.lock")


def processor_running(run_dir: str) -> bool:
    with open(_lock_path(run_dir), "a+") as lk:
        try:
            fcntl.flock(lk, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return True
        fcntl.flock(lk, fcntl.LOCK_UN)
        return False


def ensure_processor(run_dir: str) -> bool:
    """Start the run's detached processor if jobs are waiting (pending, or orphaned in running/
    by a processor that was killed) and none holds the queue. Returns whether one was started.
    It outlives the run process that started it, so a chain's last tests run on while the next
    chain starts; every run start calls this, so a reboot loses nothing."""
    q = queue_dir(run_dir)
    if processor_running(run_dir) or not (_jobs(q, "pending") or _jobs(q, "running")):
        return False
    env = _system_tmp_env(dict(os.environ))
    env.pop("CLAUDE_CODE_OAUTH_TOKEN", None)      # a test runs no agent
    # Its output goes to runs/<run_id>/test.log (process_logged), never to the run's terminal.
    subprocess.Popen([sys.executable, "-m", "harness.gate_queue", "--run-dir", run_dir,
                      "process"], cwd=HARNESS_ROOT, env=env, stdin=subprocess.DEVNULL,
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    return True


def process(run_dir: str) -> int:
    """Drain the run's queue in order; exit when it is empty. Only one processor holds a run's
    queue: a second one exits at once. Orphaned running/ jobs go back to the head of the queue.
    The lock is released before the final emptiness check, so a job queued while this processor
    is exiting either is seen here or starts a new processor."""
    q = queue_dir(run_dir)
    while True:
        lk = open(_lock_path(run_dir), "a+")
        try:
            fcntl.flock(lk, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            lk.close()
            print(f"{_now()} another processor holds the queue", flush=True)
            return 0
        try:
            lk.seek(0)
            lk.truncate()
            lk.write(f"{os.getpid()}\n")
            lk.flush()
            for path in _jobs(q, "running"):
                print(f"{_now()} recovered {os.path.basename(path)} (its processor died)", flush=True)
                os.replace(path, os.path.join(q, "pending", os.path.basename(path)))
            while True:
                pending = _jobs(q, "pending")
                if not pending:
                    break
                _process_one(q, pending[0])
        finally:
            fcntl.flock(lk, fcntl.LOCK_UN)
            lk.close()
        if not _jobs(q, "pending"):
            return 0


def _now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def _process_one(q: str, pending_path: str) -> None:
    name = os.path.basename(pending_path)
    running = os.path.join(q, "running", name)
    try:
        os.replace(pending_path, running)
    except FileNotFoundError:          # superseded while waiting
        return
    job = _load(running)
    job["started_at"] = datetime.now().isoformat(timespec="seconds")
    print(f"{_now()} start  {name}", flush=True)
    try:
        if job["kind"] in ("checkpoint", "full"):
            job["result"] = run_test_job(job)
        elif job["kind"] == "finalise":
            job["result"] = run_finalise_job(job)
        else:
            raise RuntimeError(f"unknown job kind {job['kind']!r}")
    except Exception as e:                                  # noqa: BLE001 - recorded, queue goes on
        job["error"] = f"{type(e).__name__}: {e}"
        job["traceback"] = traceback.format_exc()
        job["finished_at"] = datetime.now().isoformat(timespec="seconds")
        _write_atomic(running, job, _scratch(q))
        os.replace(running, os.path.join(q, "failed", name))
        print(f"{_now()} FAILED {name}: {job['error'][:300]}", flush=True)
        return
    job["finished_at"] = datetime.now().isoformat(timespec="seconds")
    _write_atomic(running, job, _scratch(q))
    os.replace(running, os.path.join(q, "done", name))
    print(f"{_now()} done   {name}: {json.dumps(job['result'], default=str)[:300]}", flush=True)


def _git(args: list[str], check: bool = True) -> str:
    p = subprocess.run(["git", *args], capture_output=True, text=True)
    if check and p.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} failed: {p.stderr.strip()[:400]}")
    return p.stdout.strip()


def _system_tmp_env(env: dict) -> dict:
    """`env` without the run's temp-directory overrides (run_experiment.per_run_dirs), so the
    tests' build, app and Playwright use the normal /tmp and never the run's tmp."""
    env = {k: v for k, v in env.items() if k not in ("TMPDIR", "TMP", "TEMP")}
    jto = re.sub(r"-Djava\.io\.tmpdir=\S+", "", env.get("JAVA_TOOL_OPTIONS", "")).strip()
    if jto:
        env["JAVA_TOOL_OPTIONS"] = jto
    else:
        env.pop("JAVA_TOOL_OPTIONS", None)
    return env


@contextlib.contextmanager
def _test_env(job: dict, port: int):
    """A fresh directory under the normal /tmp (see _system_tmp_env) as the test's TMPDIR and
    java.io.tmpdir, deleted when the test ends, so every test starts clean and two runs' tests
    never share one (Playwright's compiled-spec cache, the app's unpacked Tomcat, Chromium
    profiles); and the testing port. The environment is restored afterwards."""
    saved = dict(os.environ)
    saved_tempdir = tempfile.tempdir
    clean = _system_tmp_env(os.environ)
    os.environ.clear()
    os.environ.update(clean)
    tempfile.tempdir = None
    tmp = tempfile.mkdtemp(prefix=f"{job['run_id']}-testing-cp{int(job['checkpoint']):02d}-")
    try:
        for var in ("TMPDIR", "TMP", "TEMP"):
            os.environ[var] = tmp
        tempfile.tempdir = tmp
        os.environ["JAVA_TOOL_OPTIONS"] = (os.environ.get("JAVA_TOOL_OPTIONS", "")
                                           + f" -Djava.io.tmpdir={tmp}").strip()
        os.environ["PORT"] = str(port)
        yield
    finally:
        os.environ.clear()
        os.environ.update(saved)
        tempfile.tempdir = saved_tempdir
        shutil.rmtree(tmp, ignore_errors=True)


def testing_worktree(job: dict) -> str:
    """runs/<run_id>/testing: a detached worktree of the job's commit, reused by every test of
    the run (its installed node_modules make the next build quicker)."""
    wt = os.path.join(job["run_dir"], TESTING)
    repo, commit = job["repo"], job["commit"]
    if os.path.exists(os.path.join(wt, ".git")):
        _git(["-C", wt, "checkout", "--detach", "-f", commit])
        _git(["-C", wt, "clean", "-fd"])
    else:
        shutil.rmtree(wt, ignore_errors=True)
        _git(["-C", repo, "worktree", "prune"], check=False)
        os.makedirs(os.path.dirname(wt), exist_ok=True)
        _git(["-C", repo, "worktree", "add", "--detach", "-f", wt, commit])
    return wt


def _install_own_spec(wt: str, cfg: dict, cp: dict, snap: str) -> None:
    """Only the checkpoint's own spec, under its own basename (so its tests score as this
    checkpoint's): the test that confirms the checkpoint's change, whatever the checkpoint."""
    from . import fixtures, run_experiment as rx
    dest = rx._specs_dest(wt, cfg)
    os.makedirs(dest, exist_ok=True)
    rx._clear_specs(dest)
    own = fixtures.own_spec(cp)
    shutil.copy2(os.path.join(snap, own), os.path.join(dest, os.path.basename(own)))


def run_test_job(job: dict) -> dict:
    """Test one agent commit: pinned files back to base, the harness-owned files and the specs
    (own spec, or the full cp01..cpK suite) from the job's harness commit, then build, serve and
    Playwright (run_experiment._run_gate: retried while the build registries are down)."""
    from . import fixtures, run_experiment as rx         # rx imports this module

    cfg = copy.deepcopy(job["cfg"])
    cfg["paths"] = {"work_root": job["work_root"]}
    port = rx.claim_port(cfg, port_owner(job["run_id"]))
    cfg["app"]["port"] = port
    k = int(job["checkpoint"])
    label = f"chain{job['chain']} cp{k:02d} {job['kind']:10s}| "
    cfg["_progress"] = {"prefix": label}            # correctness labels its progress lines with it
    say = lambda line: print(f"{_now()} {label}{line}", flush=True)  # noqa: E731
    paths = ["acceptance", job["checkpoints_file"]]
    snap = ensure_snapshot(job["run_dir"], job["harness_sha"], paths)
    with open(os.path.join(snap, job["checkpoints_file"])) as fh:
        checkpoints = yaml.safe_load(fh)["checkpoints"]
    for i, cp in enumerate(checkpoints, 1):
        cp["n"] = i
    out_dir = job["results_dir"]
    os.makedirs(out_dir, exist_ok=True)

    say(f"commit {job['commit'][:10]} ({job.get('checkpoint_id') or ''}) on port {port}")
    wt = testing_worktree(job)
    started = time.time()
    with _test_env(job, port):
        rx._restore_pins_to_base(wt, cfg["app"], cfg)
        rx.install_harness_files(wt, cfg, root=snap)
        if job["kind"] == "full":
            rx.install_measurement_suite(wt, cfg, checkpoints, k, root=snap)
        else:
            _install_own_spec(wt, cfg, checkpoints[k - 1], snap)
        n_specs = len([f for f in os.listdir(rx._specs_dest(wt, cfg)) if f.endswith(".spec.ts")])
        say(f"{n_specs} spec file(s) installed in {wt}")
        shutil.rmtree(os.path.join(wt, "target"), ignore_errors=True)
        outcome = rx._run_gate(wt, k, cfg)
    outcome.partial = job["kind"] == "checkpoint"
    seconds = round(time.time() - started)

    log_file = f"cp{k:02d}.test.log"
    with open(os.path.join(out_dir, log_file), "w") as fh:
        fh.write((outcome.console or "")[:_LOG_CAP])
    failed = sorted(t for t, ok in (outcome.results or {}).items() if not ok)
    record = {
        "checkpoint": k, "checkpoint_id": job.get("checkpoint_id"), "kind": job["kind"],
        "run_id": job["run_id"], "condition": job["condition"], "chain": job["chain"],
        "branch": job["branch"], "commit_sha": job["commit"],
        "harness_sha": job["harness_sha"], "harness_dirty": job.get("harness_dirty") or [],
        "workers": correctness.gate_workers(cfg), "port": port,
        "started_at": datetime.fromtimestamp(started).isoformat(timespec="seconds"),
        "seconds": seconds, "build_log_file": log_file,
        "replaced_tests": fixtures.replaced_tests(checkpoints, k, snap),
        "tests": capture.tests_block(outcome),
    }
    capture.write_json(os.path.join(out_dir, f"cp{k:02d}.json"), record)
    if outcome.gate_invalid or outcome.app_broken:
        say(f"NO VERDICT ({'app broken' if outcome.app_broken else 'gate invalid'}): "
            f"{(outcome.error or '')[:200]}")
    else:
        say(f"{outcome.total_selected - len(failed)} passed, {len(failed)} failed of "
            f"{outcome.total_selected} in {seconds}s")
        for t in failed[:20]:
            say(f"  FAILED {t}")
        if len(failed) > 20:
            say(f"  ... and {len(failed) - 20} more (see {log_file})")
    return {"kind": job["kind"], "selected": outcome.total_selected, "failed": len(failed),
            "seconds": seconds, "gate_invalid": outcome.gate_invalid,
            "app_broken": outcome.app_broken}


def _commit_tree(job: dict) -> tuple[str, str | None]:
    """A checkout of the chain branch to commit in: the chain's own worktree when it is on the
    branch with nothing uncommitted (the chain is finished, so nothing else writes there), else a
    temporary one — never when the branch is checked out somewhere else."""
    repo, branch = job["repo"], job["branch"]
    chain_wt = os.path.join(job["run_dir"], f"{job['condition']}-chain{job['chain']}")
    if os.path.exists(os.path.join(chain_wt, ".git")) and \
            _git(["-C", chain_wt, "rev-parse", "--abbrev-ref", "HEAD"], check=False) == branch:
        if _git(["-C", chain_wt, "status", "--porcelain", "--untracked-files=no"], check=False):
            raise RuntimeError(f"{chain_wt} has uncommitted changes; commit or discard them, then "
                               f"retry-failed")
        return chain_wt, None
    listed = _git(["-C", repo, "worktree", "list", "--porcelain"], check=False)
    if f"branch refs/heads/{branch}" in listed.splitlines():
        raise RuntimeError(f"{branch} is checked out in another worktree; cannot commit to it")
    tmp = chain_wt + "-finalise"
    if os.path.exists(tmp):
        _git(["-C", repo, "worktree", "remove", "--force", tmp], check=False)
        shutil.rmtree(tmp, ignore_errors=True)
    _git(["-C", repo, "worktree", "add", tmp, branch])
    return tmp, tmp


def summarise(caps: dict[int, dict], results: dict[int, dict]) -> list[dict]:
    """One scored row per tested checkpoint, through correctness.Baseline over EVERY checkpoint
    in order. Only a full test moves the regression baseline; a checkpoint test (own spec only)
    and an untested checkpoint carry their `mutates` and changed copies to the next full one, so
    a full test is scored against the previous full test exactly as analyze scores it."""
    base = correctness.Baseline()
    rows = []
    for k in sorted(set(caps) | set(results)):
        rec = caps.get(k) or {}
        tests = (results[k]["tests"] if k in results else rec.get("tests")) or {"gated": False}
        outcome = correctness.outcome_from_record(tests, k)
        row = base.score(outcome, rec.get("mutates") or [], rec.get("replaced_tests") or [])
        if k in results:
            failing = sorted(t for t, ok in (outcome.results or {}).items() if not ok)
            rows.append({"checkpoint": k, "kind": results[k].get("kind"),
                         "commit_sha": results[k].get("commit_sha"),
                         "seconds": results[k].get("seconds"), **row,
                         "tests_failed": len(failing), "failing_tests": failing})
    return rows


def headline(rows: list[dict]) -> dict:
    full = [r for r in rows if r.get("kind") == "full"]
    own = [r for r in rows if r.get("kind") == "checkpoint"]
    ok = [r for r in full if not (r.get("gate_invalid") or r.get("app_broken"))]
    own_ok = [r for r in own if not (r.get("gate_invalid") or r.get("app_broken"))]
    return {
        "checkpoint_tests": len(own),
        "checkpoint_pass": sum(1 for r in own_ok if r.get("iso_pass") is True),
        "full_tests": len(full),
        "full_strict_pass": sum(1 for r in ok if r.get("strict_pass") is True),
        "own_pass_at_full": sum(1 for r in ok if r.get("iso_pass") is True),
        "regressions": sum(int(r.get("regressions") or 0) for r in ok),
        "true_regressions": sum(int(r.get("true_regressions") or 0) for r in ok),
        "gate_invalid": sum(1 for r in rows if r.get("gate_invalid")),
        "app_broken": sum(1 for r in rows if r.get("app_broken")),
        "test_hours": round(sum(int(r.get("seconds") or 0) for r in rows) / 3600, 2),
    }


def run_finalise_job(job: dict) -> dict:
    """Commit the chain's results to its branch (evolve-results/tests/) with a scored summary."""
    src = job["results_dir"]
    files = sorted(os.listdir(src)) if os.path.isdir(src) else []
    results = {}
    for f in files:
        m = re.fullmatch(r"cp0*(\d+)\.json", f)
        if m:
            results[int(m.group(1))] = _load(os.path.join(src, f))
    tree, temp = _commit_tree(job)
    try:
        out = os.path.join(tree, *RESULTS_PATH.split("/"))
        os.makedirs(out, exist_ok=True)
        for f in files:
            shutil.copy2(os.path.join(src, f), os.path.join(out, f))
        caps = {}
        cap_dir = os.path.join(tree, "evolve-results", "capture")
        for f in (os.listdir(cap_dir) if os.path.isdir(cap_dir) else []):
            m = re.fullmatch(r"cp0*(\d+)\.json", f)
            if m:
                caps[int(m.group(1))] = _load(os.path.join(cap_dir, f))
        rows = summarise(caps, results)
        head = headline(rows)
        capture.write_json(os.path.join(out, "summary.json"), {
            "run_id": job["run_id"], "condition": job["condition"], "chain": job["chain"],
            "branch": job["branch"], "last_checkpoint": job["checkpoint"],
            "headline": head, "rows": rows})
        _git(["-C", tree, "add", RESULTS_PATH])
        line = " ".join(f"{k}={v}" for k, v in head.items())
        subprocess.run(["git", "-C", tree, "commit", "--allow-empty", "-m",
                        f"tests: {job['condition']}/chain{job['chain']} - run {job['run_id']} "
                        f"(to cp{int(job['checkpoint']):02d})\n\n{line}",
                        "--", RESULTS_PATH], capture_output=True, text=True, check=True)
        sha = _git(["-C", tree, "rev-parse", "HEAD"])
    finally:
        if temp:
            _git(["-C", job["repo"], "worktree", "remove", "--force", temp], check=False)
    return {"commit": sha, **head}


# --- status -------------------------------------------------------------------


def status_line(run_dir: str) -> str:
    q = queue_dir(run_dir)
    counts = {st: len(_jobs(q, st)) for st in STATES}
    return (f"{q}: pending={counts['pending']} running={counts['running']} "
            f"done={counts['done']} failed={counts['failed']} "
            f"processor={'up' if processor_running(run_dir) else 'idle'}")


def status(run_dir: str) -> int:
    q = queue_dir(run_dir)
    print(status_line(run_dir))
    for st in ("running", "pending", "failed"):
        for p in _jobs(q, st):
            j = _load(p)
            extra = j.get("started_at", "") if st == "running" else (j.get("error", "")[:160]
                                                                     if st == "failed" else "")
            print(f"  {st:8s} {_key_of(p)}  {j.get('commit', '')[:10]}  {extra}")
    for p in _jobs(q, "done")[-5:]:
        j = _load(p)
        print(f"  done     {_key_of(p)}  {json.dumps(j.get('result'), default=str)[:160]}")
    return 0


def retry_failed(run_dir: str) -> int:
    q = queue_dir(run_dir)
    for p in _jobs(q, "failed"):
        j = _load(p)
        for drop in ("error", "traceback", "started_at", "finished_at"):
            j.pop(drop, None)
        _write_atomic(p, j, _scratch(q))
        os.replace(p, os.path.join(q, "pending", os.path.basename(p)))
        print(f"requeued {os.path.basename(p)}")
    ensure_processor(run_dir)
    return 0


def _run_dir_from_config(path: str, run_id: str) -> str:
    with open(path) as fh:
        cfg = yaml.safe_load(fh)
    wr = expand_path((cfg.get("paths") or {}).get("work_root"), "paths.work_root")
    wr = wr if os.path.isabs(wr) else os.path.join(os.path.dirname(os.path.abspath(path)), wr)
    return os.path.join(wr, "runs", run_id)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--config", help="config.yaml (for paths.work_root); needs --run-id")
    ap.add_argument("--run-id")
    ap.add_argument("--run-dir", help="work_root/runs/<run_id> directly")
    ap.add_argument("command", choices=("process", "status", "retry-failed"))
    args = ap.parse_args()
    if args.run_dir:
        run_dir = args.run_dir
    elif args.config and args.run_id:
        run_dir = _run_dir_from_config(args.config, args.run_id)
    else:
        ap.error("give --run-dir, or --config with --run-id")
    if not os.path.isdir(run_dir):
        ap.error(f"no run directory {run_dir}")
    if args.command == "process":
        # However it was started, the processor writes only to the run's test.log: `tail -f` it.
        print(f"test processor output: tail -f {os.path.join(run_dir, runlog.TEST_LOG)}", flush=True)
        runlog.redirect_output(os.path.join(run_dir, runlog.TEST_LOG),
                               f"test processor for {os.path.basename(run_dir)}")
        return process(run_dir)
    if args.command == "status":
        return status(run_dir)
    return retry_failed(run_dir)


if __name__ == "__main__":
    raise SystemExit(main())

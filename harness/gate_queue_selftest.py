"""Deterministic tests for the run's test queue (no agent, no app build, no network).

Covers what a month of unattended runs depends on: which checkpoints get the full suite and which
only their own spec, that queuing is idempotent and FIFO, that two runs never share a queue, that a
killed processor's job is picked up again, that a failing job does not stop the queue, that a
resume queues exactly the tests that are missing, that a full gate is scored against the previous
full gate with the mutations in between carried over (a checkpoint test never becomes the
baseline), that tests never use the run's agent-readable tmp, and that the finalise job commits
the results to the chain branch.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import tempfile

from . import correctness, gate_queue as gq


def _eq(name, got, want):
    assert got == want, f"{name}: got {got!r} want {want!r}"
    print(f"  ok  {name}")


def _cfg(work_root: str, run_id: str = "r1") -> dict:
    return {"paths": {"work_root": work_root, "run_dir": os.path.join(work_root, "runs", run_id)},
            "gate": {"every": 10},
            "app": {"repo": "/repo/stack", "base_ref": "base-empty", "port": 3000},
            "checkpoints_file": os.path.join(gq.HARNESS_ROOT, "checkpoints.yaml"),
            "acceptance": {"workers": 3}}


class _Stubbed:
    """Stand-ins for the harness-commit lookup and snapshot extraction (real ones read git)."""

    def __enter__(self):
        self.saved = gq._harness_commit, gq.ensure_snapshot
        gq._harness_commit = lambda paths: ("a" * 40, [])
        gq.ensure_snapshot = lambda run_dir, sha, paths: os.path.join(run_dir, "snap")
        return self

    def __exit__(self, *exc):
        gq._harness_commit, gq.ensure_snapshot = self.saved


def _q(cfg):
    return gq.queue_dir(cfg["paths"]["run_dir"])


def test_kinds():
    every, last = 10, 47
    _eq("full at every 10th and the last", [k for k in range(1, 48)
                                            if gq.test_kind(k, every, last) == "full"],
        [10, 20, 30, 40, 47])
    _eq("own spec everywhere else", gq.test_kind(11, every, last), "checkpoint")
    _eq("mid-chain (last unknown)", [k for k in range(1, 25) if gq.sampled(k, every, None)], [10, 20])


def test_enqueue_idempotent_fifo_and_per_run():
    wr = tempfile.mkdtemp(prefix="gqself-")
    cfg, other = _cfg(wr, "r1"), _cfg(wr, "r2")
    with _Stubbed():
        a = gq.enqueue_test(cfg, "r1", "just-solve", 1, "b", 9, "x", "c9", "checkpoint")
        b = gq.enqueue_test(cfg, "r1", "just-solve", 1, "b", 9, "x", "c9", "checkpoint")
        _eq("same checkpoint + commit -> same job", a, b)
        gq.enqueue_test(cfg, "r1", "just-solve", 1, "b", 10, "y", "c10", "full")
        q = _q(cfg)
        _eq("FIFO order", [gq._key_of(p) for p in gq._jobs(q, "pending")],
            ["just-solve.chain1.checkpoint.cp09", "just-solve.chain1.full.cp10"])
        _eq("the queue lives in the run's own directory", q,
            os.path.join(wr, "runs", "r1", "queued-tests"))
        gq.enqueue_test(other, "r2", "just-solve", 1, "b", 9, "x", "z9", "checkpoint")
        _eq("another run's job goes to its own queue",
            ([gq._key_of(p) for p in gq._jobs(_q(other), "pending")], len(gq._jobs(q, "pending"))),
            (["just-solve.chain1.checkpoint.cp09"], 2))
        d = gq.enqueue_test(cfg, "r1", "just-solve", 1, "b", 9, "x", "OTHER", "checkpoint")
        _eq("another commit supersedes a pending job",
            [(gq._key_of(p), gq._load(p)["commit"]) for p in gq._jobs(q, "pending")],
            [("just-solve.chain1.full.cp10", "c10"), ("just-solve.chain1.checkpoint.cp09", "OTHER")])
        job = gq._load(d)
        _eq("job carries what the processor needs",
            all(k in job for k in ("repo", "branch", "commit", "harness_sha", "results_dir",
                                   "run_dir", "work_root", "cfg", "checkpoints_file", "kind")), True)
        _eq("results go under the run's queue", job["results_dir"],
            os.path.join(wr, "runs", "r1", "queued-tests", "results", "just-solve-chain1"))
    shutil.rmtree(wr)


def test_process_recovers_and_continues():
    wr = tempfile.mkdtemp(prefix="gqself-")
    cfg = _cfg(wr)
    ran = []
    saved = gq.run_test_job, gq.run_finalise_job

    def fake_test(job):
        ran.append((job["kind"], job["checkpoint"]))
        if job["checkpoint"] == 2:
            raise RuntimeError("boom")
        return {"failed": 0}

    gq.run_test_job, gq.run_finalise_job = fake_test, lambda job: {"commit": "x"}
    try:
        with _Stubbed():
            for k in (1, 2, 3):
                gq.enqueue_test(cfg, "r1", "just-solve", 1, "b", k, "id", f"c{k}",
                                "full" if k == 3 else "checkpoint")
            gq.enqueue_finalise(cfg, "r1", "just-solve", 1, "b", 3)
        q = _q(cfg)
        first = gq._jobs(q, "pending")[0]           # a processor killed while holding cp01
        os.replace(first, os.path.join(q, "running", os.path.basename(first)))
        _eq("process exit code", gq.process(cfg["paths"]["run_dir"]), 0)
        _eq("orphan first, then in order", ran, [("checkpoint", 1), ("checkpoint", 2), ("full", 3)])
        _eq("done", sorted(gq._key_of(p) for p in gq._jobs(q, "done")),
            ["just-solve.chain1.checkpoint.cp01", "just-solve.chain1.finalise.cp03",
             "just-solve.chain1.full.cp03"])
        _eq("a raising job is parked with its error",
            [(gq._key_of(p), gq._load(p)["error"]) for p in gq._jobs(q, "failed")],
            [("just-solve.chain1.checkpoint.cp02", "RuntimeError: boom")])
        _eq("nothing left pending or running", (gq._jobs(q, "pending"), gq._jobs(q, "running")),
            ([], []))
    finally:
        gq.run_test_job, gq.run_finalise_job = saved
    shutil.rmtree(wr)


def test_queue_missing():
    wr = tempfile.mkdtemp(prefix="gqself-")
    cfg = _cfg(wr)
    caps = {k: {"checkpoint": k, "commit_sha": f"c{k}", "tests": {"gated": False, "queued": True}}
            for k in range(1, 26)}
    caps[5] = {"checkpoint": 5, "commit_sha": "c5", "tests": {"results": {}}}   # tested in the loop
    with _Stubbed():
        for k in list(range(1, 5)) + list(range(6, 10)):
            gq.enqueue_test(cfg, "r1", "just-solve", 1, "b", k, "id", f"c{k}", "checkpoint")
        gq.enqueue_test(cfg, "r1", "just-solve", 1, "b", 10, "id", "c10", "full")
        for k in range(11, 24):
            gq.enqueue_test(cfg, "r1", "just-solve", 1, "b", k, "id", f"c{k}",
                            "full" if k == 20 else "checkpoint")
        out = gq.queue_missing(cfg, "r1", "just-solve", 1, "b", caps, 25, final=False)
        _eq("mid-chain resume queues only the missing tests", [gq._key_of(p) for p in out],
            ["just-solve.chain1.checkpoint.cp24", "just-solve.chain1.checkpoint.cp25"])
        out = gq.queue_missing(cfg, "r1", "just-solve", 1, "b", caps, 25, final=True)
        _eq("a finished chain's last checkpoint gets the full suite, then finalise",
            [gq._key_of(p) for p in out],
            ["just-solve.chain1.full.cp25", "just-solve.chain1.finalise.cp25"])
        _eq("the full test superseded its pending checkpoint test",
            [gq._key_of(p) for p in gq._jobs(_q(cfg), "pending") if p.endswith("cp25.json")],
            ["just-solve.chain1.full.cp25", "just-solve.chain1.finalise.cp25"])
        _eq("and nothing twice", gq.queue_missing(cfg, "r1", "just-solve", 1, "b", caps, 25, True), [])
    shutil.rmtree(wr)


def _tests(results: dict, scope: str = "full") -> dict:
    return {"gated": True, "scope": scope, "build_ok": True, "results": results,
            "detail": [{"test_id": t, "passed": ok, "category": "functionality",
                        "failure": "" if ok else "Expected: 1 Received: 2"} for t, ok in results.items()]}


def test_summarise_baseline_from_full_only():
    """cp10 full: both prior tests pass. cp15 (own spec) mutates cp05 and drops its test; its
    checkpoint test holds only cp15's own test and must not become the baseline. cp20 full: cp05's
    test is gone (intended) and cp03's fails (a true regression)."""
    caps = {k: {"checkpoint": k, "tests": {"gated": False}, "mutates": [], "replaced_tests": []}
            for k in range(1, 21)}
    caps[15]["mutates"] = [5]
    results = {
        10: {"kind": "full", "tests": _tests({"cp03_a.spec.ts::a": True, "cp05_b.spec.ts::b": True,
                                              "cp10_c.spec.ts::c": True})},
        15: {"kind": "checkpoint", "tests": _tests({"cp15_e.spec.ts::e": False}, "checkpoint")},
        20: {"kind": "full", "tests": _tests({"cp03_a.spec.ts::a": False, "cp10_c.spec.ts::c": True,
                                              "cp20_d.spec.ts::d": True})},
    }
    rows = gq.summarise(caps, results)
    _eq("one row per test", [(r["checkpoint"], r["kind"]) for r in rows],
        [(10, "full"), (15, "checkpoint"), (20, "full")])
    _eq("cp15 own spec failed, no regression figures",
        (rows[1]["gated"], rows[1]["iso_pass"], rows[1]["regressions"]), ("checkpoint", False, ""))
    _eq("cp20 regressions against cp10 (both lost passes)", rows[2]["regressions"], 2)
    _eq("cp20 true regressions (not the mutated cp05)", rows[2]["true_regressions"], 1)
    _eq("cp20 intended", rows[2]["intended_regressions"], 1)
    head = gq.headline(rows)
    _eq("headline", (head["checkpoint_tests"], head["checkpoint_pass"], head["full_tests"],
                     head["own_pass_at_full"], head["true_regressions"]), (1, 0, 2, 2, 1))


def test_outcomes_and_timeout():
    o = correctness.outcome_from_record({"gated": False, "queued": True}, 7)
    _eq("untested outcome", (o.ungated, o.queued), (True, True))
    row = correctness.Baseline().score(o)
    _eq("untested row is blank and marked", (row["gated"], row["regressions"]), (False, ""))
    _eq("old records read as full", correctness.outcome_from_record(
        {k: v for k, v in _tests({"cp01_a.spec.ts::a": True}).items() if k != "scope"}, 1).partial,
        False)
    acc = {"acceptance": {"test_timeout": 1800, "test_timeout_per_spec": 300, "workers": 3}}
    _eq("timeout floor", correctness.gate_timeout(acc, 10), 1800)
    _eq("timeout grows with the suite", correctness.gate_timeout(acc, 250), 25000)
    _eq("default workers", correctness.gate_workers({}), 1)


def test_tests_use_system_tmp():
    env = {"TMPDIR": "/w/runs/r1/tmp", "TMP": "/w/runs/r1/tmp", "TEMP": "/w/runs/r1/tmp",
           "JAVA_TOOL_OPTIONS": "-Xmx1g -Djava.io.tmpdir=/w/runs/r1/tmp", "HOME": "/h"}
    clean = gq._system_tmp_env(env)
    _eq("the run's tmp is dropped", {k: clean.get(k) for k in ("TMPDIR", "TMP", "TEMP")},
        {"TMPDIR": None, "TMP": None, "TEMP": None})
    _eq("java keeps its other options", clean["JAVA_TOOL_OPTIONS"], "-Xmx1g")
    _eq("everything else kept", clean["HOME"], "/h")
    _eq("no empty JAVA_TOOL_OPTIONS", "JAVA_TOOL_OPTIONS" in gq._system_tmp_env(
        {"JAVA_TOOL_OPTIONS": "-Djava.io.tmpdir=/x"}), False)
    _eq("port owner per run", gq.port_owner("202610220900"), "202610220900-testing")


def test_clean_temp_dirs():
    """The run's tmp is emptied before every agent turn (it is kept, being on the allowlist), and
    every test gets a fresh /tmp directory that is gone when the test ends."""
    from . import agent
    run_tmp = tempfile.mkdtemp(prefix="gqself-runtmp-")
    os.makedirs(os.path.join(run_tmp, "notes", "deep"))
    with open(os.path.join(run_tmp, "left-by-cp05.txt"), "w") as fh:
        fh.write("x")
    seen = {}

    class Stop(Exception):
        pass

    def stop(tmp_dir=None):
        seen["entries"] = sorted(os.listdir(tmp_dir))
        raise Stop

    saved = agent._seed_clean_config_dir
    agent._seed_clean_config_dir = stop
    try:
        agent.run_agent("p", cwd=run_tmp, model="stand-in", tmp_dir=run_tmp)
    except Stop:
        pass
    finally:
        agent._seed_clean_config_dir = saved
    _eq("the run's tmp is empty when an agent turn starts", seen.get("entries"), [])
    _eq("and is kept", os.path.isdir(run_tmp), True)
    shutil.rmtree(run_tmp)

    job = {"run_id": "r9", "checkpoint": 7}
    saved_env = dict(os.environ)
    os.environ["TMPDIR"] = "/somewhere/runs/r9/tmp"
    try:
        with gq._test_env(job, 4321):
            inside = os.environ["TMPDIR"]
            _eq("a test's TMPDIR is a fresh dir under /tmp",
                (os.path.dirname(inside), os.path.basename(inside).startswith("r9-testing-cp07-"),
                 os.listdir(inside)), ("/tmp", True, []))
            _eq("java uses it too", os.environ["JAVA_TOOL_OPTIONS"].endswith(f"-Djava.io.tmpdir={inside}"),
                True)
            with open(os.path.join(inside, "cache"), "w") as fh:
                fh.write("x")
        _eq("and it is deleted when the test ends", os.path.exists(inside), False)
        _eq("the environment is restored", os.environ["TMPDIR"], "/somewhere/runs/r9/tmp")
    finally:
        os.environ.clear()
        os.environ.update(saved_env)


def _git(cwd, *args):
    return subprocess.run(["git", "-c", "user.email=a@b", "-c", "user.name=a", *args], cwd=cwd,
                          check=True, capture_output=True, text=True).stdout.strip()


def test_finalise_commits_to_branch():
    wr = tempfile.mkdtemp(prefix="gqself-")
    run_dir = os.path.join(wr, "runs", "r1")
    repo = os.path.join(wr, "stack")
    os.makedirs(repo)
    _git(repo, "init", "-q", "-b", "base-empty")
    _git(repo, "commit", "-q", "--allow-empty", "-m", "base")
    branch = "evolve/r1/just-solve/chain1"
    _git(repo, "checkout", "-q", "-b", branch)
    cap = os.path.join(repo, "evolve-results", "capture")
    os.makedirs(cap)
    for k in (1, 2):
        with open(os.path.join(cap, f"cp{k:02d}.json"), "w") as fh:
            json.dump({"checkpoint": k, "tests": {"gated": False, "queued": True}, "mutates": []}, fh)
    _git(repo, "add", "-A")
    _git(repo, "commit", "-q", "-m", "results: just-solve/chain1 - run r1 (raw capture)")
    _git(repo, "checkout", "-q", "base-empty")          # the branch is checked out nowhere
    res = gq.results_dir(run_dir, "just-solve", 1)
    os.makedirs(res)
    with open(os.path.join(res, "cp01.json"), "w") as fh:
        json.dump({"checkpoint": 1, "kind": "checkpoint", "seconds": 30,
                   "tests": _tests({"cp01_a.spec.ts::a": True}, "checkpoint")}, fh)
    with open(os.path.join(res, "cp02.json"), "w") as fh:
        json.dump({"checkpoint": 2, "kind": "full", "seconds": 60,
                   "tests": _tests({"cp01_a.spec.ts::a": True, "cp02_b.spec.ts::b": False})}, fh)
    with open(os.path.join(res, "cp02.test.log"), "w") as fh:
        fh.write("console")
    job = {"kind": "finalise", "run_id": "r1", "condition": "just-solve", "chain": 1, "checkpoint": 2,
           "repo": repo, "branch": branch, "results_dir": res, "run_dir": run_dir}
    out = gq.run_finalise_job(job)
    _eq("finalise headline", (out["checkpoint_tests"], out["checkpoint_pass"], out["full_tests"],
                              out["full_strict_pass"]), (1, 1, 1, 0))
    subj = _git(repo, "log", "-1", "--format=%s", branch)
    _eq("final commit on the branch", subj.startswith("tests: just-solve/chain1 - run r1"), True)
    files = _git(repo, "ls-tree", "-r", "--name-only", branch, "evolve-results/tests/").splitlines()
    _eq("results committed", files, ["evolve-results/tests/cp01.json",
                                     "evolve-results/tests/cp02.json",
                                     "evolve-results/tests/cp02.test.log",
                                     "evolve-results/tests/summary.json"])
    summary = json.loads(_git(repo, "show", f"{branch}:evolve-results/tests/summary.json"))
    _eq("summary rows", [(r["checkpoint"], r["kind"], r["failing_tests"]) for r in summary["rows"]],
        [(1, "checkpoint", []), (2, "full", ["cp02_b.spec.ts::b"])])
    _eq("temporary worktree removed",
        os.path.exists(os.path.join(run_dir, "just-solve-chain1-finalise")), False)
    shutil.rmtree(wr)


def main() -> int:
    for fn in (test_kinds, test_enqueue_idempotent_fifo_and_per_run,
               test_process_recovers_and_continues, test_queue_missing,
               test_summarise_baseline_from_full_only, test_outcomes_and_timeout,
               test_tests_use_system_tmp, test_clean_temp_dirs, test_finalise_commits_to_branch):
        fn()
    print("OK — test queue tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

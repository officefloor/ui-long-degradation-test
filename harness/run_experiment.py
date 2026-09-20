"""Driver for the UI long-degradation experiment (the OfficeHQ change loop, made
deterministic). Structurally parallel to the REST arm's run_experiment.py, rewired to a
SINGLE evolving app and the build+serve+Playwright gate in correctness.py.

For a (condition, chain) it worktrees the ONE app repo at base_ref and walks the ordered
checkpoints, growing the app from empty. At each checkpoint k:
  0. mirror the worktree into a history-less sandbox; install ONLY this checkpoint's own
     spec there, neutralised of cpNN hints (blind view — the agent never sees prior specs).
  1. run a FRESH headless agent (harness.agent.run_agent) with the plain-English request;
     it authors the full-stack change and may run bin/e2e; optionally Landlock-confined.
  2. mirror the sandbox back (excluding e2e/specs); commit the pure agent delta (COMMIT 1).
  3. GATE: restore pinned files, install the FULL cp01..cpK suite (mutative priors win by
     basename) into the worktree e2e/specs, run correctness.run_tests (build+serve+PW).
  4. write raw capture; normalise pins; reset commit (COMMIT 2). Two-commit boundary.

Only `just-solve` is wired here; the `gated` (ImpactGate) condition and analyze/metrics
are deferred. Usage:
  python -m harness.run_experiment --config config.yaml --condition just-solve --chain 1
  python -m harness.run_experiment --config config.yaml --to 1        # cp01 only
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime

import yaml

from . import agent, capture, correctness, expand_path, impact_gate, landlock, quality_gate

HARNESS_DIR = os.path.dirname(os.path.abspath(__file__))
HARNESS_ROOT = os.path.dirname(HARNESS_DIR)   # the ui-long-degradation-test repo root

CSV_FIELDS = [
    "run_id", "branch", "condition", "chain", "checkpoint", "checkpoint_id", "phase",
    "checkpoint_type", "agent_ok", "cost_usd", "input_tokens", "output_tokens",
    "num_turns", "duration_ms", "duration_api_ms", "build_ok", "gate_invalid",
    "total_selected", "strict_pass", "iso_pass", "core_pass", "core_p", "core_t",
    "error_p", "error_t", "func_p", "func_t", "regr_p", "regr_t",
    "normalized_change", "regressions", "true_regressions",
    "anchor_drift", "behaviour_loss", "seed_path",
    "pinned_touched", "acceptance_touched", "notes",
]

NEUTRAL_SPEC = "acceptance.spec.ts"   # the single agent-visible spec, name carries no cpNN hint
_CP_TOKEN = re.compile(r"cp\d+", re.IGNORECASE)

OAUTH_TOKEN_ENV = "CLAUDE_CODE_OAUTH_TOKEN"


def require_long_lived_token() -> None:
    """Abort unless a long-lived Claude token is in the environment.

    A run spawns a FRESH `claude -p` per checkpoint over many hours; an interactive login
    would expire mid-run. Require CLAUDE_CODE_OAUTH_TOKEN (from `claude setup-token`), which
    agent.run_agent passes through to each child. Exit 2 with instructions if missing/blank."""
    if (os.environ.get(OAUTH_TOKEN_ENV) or "").strip():
        return
    print(
        f"FATAL: {OAUTH_TOKEN_ENV} is not set.\n"
        f"A run launches a fresh agent per checkpoint over many hours and needs a long-lived\n"
        f"token, not an interactive login that would expire mid-run. Create one and export it:\n"
        f"    export {OAUTH_TOKEN_ENV}=$(claude setup-token)\n"
        f"then re-run. (Bypass for a local smoke test only with --allow-short-token.)",
        file=sys.stderr, flush=True)
    raise SystemExit(2)


def git(args: list[str], check: bool = True) -> str:
    p = subprocess.run(["git", *args], capture_output=True, text=True)
    if check and p.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} failed: {p.stderr.strip()}")
    return p.stdout.strip()


def phase_for(idx: int, n: int) -> str:
    if idx <= n / 3:
        return "early"
    if idx <= 2 * n / 3:
        return "mid"
    return "late"


# --- copy/sync + worktree (generic; adapted from the REST arm) ----------------


def make_worktree(app_cfg: dict, work_root: str, condition: str, chain: int,
                  run_id: str) -> tuple[str, str]:
    """git worktree add evolve/<run_id>/<condition>/chain<n> from app.repo @ base_ref."""
    repo, base_ref = app_cfg["repo"], app_cfg["base_ref"]
    branch = f"evolve/{run_id}/{condition}/chain{chain}"
    if branch == base_ref or not branch.startswith("evolve/"):
        raise RuntimeError(f"refusing to write to non-evolve branch {branch!r}")
    wt = os.path.join(work_root, run_id, f"{condition}-chain{chain}")
    if os.path.isdir(wt):
        subprocess.run(["git", "-C", repo, "worktree", "remove", "--force", wt],
                       capture_output=True, text=True)
        shutil.rmtree(wt, ignore_errors=True)
    if subprocess.run(["git", "-C", repo, "rev-parse", "--verify", "--quiet", branch],
                      capture_output=True, text=True).returncode == 0:
        subprocess.run(["git", "-C", repo, "branch", "-D", branch], capture_output=True, text=True)
    os.makedirs(os.path.dirname(wt), exist_ok=True)
    git(["-C", repo, "worktree", "add", "-b", branch, wt, base_ref])
    return wt, branch


def mirror_source(src: str, dst: str, extra_excludes: tuple = ()) -> None:
    """rsync -a --delete of source files only (no .git / build output / results), so the
    agent sandbox is a history-less exact copy and copy-back propagates deletions."""
    os.makedirs(dst, exist_ok=True)
    ex = ["--exclude=.git", "--exclude=/target/", "--exclude=/node_modules/",
          "--exclude=/src/main/frontend/node_modules/", "--exclude=/src/main/frontend/node/",
          "--exclude=/e2e/node_modules/", "--exclude=/.run/",
          "--exclude=/src/main/resources/static/", "--exclude=/evolve-results/",
          "--exclude=/results/"] + [f"--exclude={e}" for e in extra_excludes]
    subprocess.run(["rsync", "-a", "--delete", *ex, src.rstrip("/") + "/", dst.rstrip("/") + "/"],
                   check=True, capture_output=True, text=True)


# --- spec install (blind view + full gate suite; honours mutative overrides) --


def _own_spec(cp: dict) -> str:
    """The checkpoint's OWN spec (the only one the agent may see) — its `test`, or the
    first entry of an explicit `tests` list."""
    return cp["test"] if cp.get("test") else list(cp.get("tests") or [None])[0]


def _spec_entries(cp: dict) -> list[str]:
    """Repo-root-relative spec paths a checkpoint installs: its OWN spec, PLUS any updated
    copies of prior specs it ships. A mutative checkpoint drops those updated copies in a
    sibling `cp<NN>/` folder next to the specs (auto-discovered here, installed by basename so
    they win over the prior originals); an explicit `tests:` list is also honoured for
    back-compat."""
    own = _own_spec(cp)
    entries: list[str] = [own] if own else []
    base_dir = os.path.dirname(own) if own else ""
    override_rel = os.path.join(base_dir, f"cp{int(cp['n']):02d}")
    override_abs = os.path.join(HARNESS_ROOT, override_rel)
    if os.path.isdir(override_abs):
        for fn in sorted(os.listdir(override_abs)):
            if fn.endswith(".spec.ts"):
                entries.append(os.path.join(override_rel, fn))
    for e in (cp.get("tests") or []):
        if e not in entries:
            entries.append(e)
    return entries


def _authored_specs(checkpoints: list[dict], k: int) -> dict[str, str]:
    """{installed basename -> repo-root-relative source path} as of checkpoint k, walking
    in order so a later (mutative) entry for the same basename wins."""
    authored: dict[str, str] = {}
    for cp in checkpoints:
        if cp["n"] > k:
            break
        for entry in _spec_entries(cp):
            authored[os.path.basename(entry)] = entry
    return authored


def _specs_dest(wt: str, cfg: dict) -> str:
    return os.path.join(wt, cfg["acceptance"]["dest_subpath"])


def _clear_specs(dest: str) -> None:
    if os.path.isdir(dest):
        for fn in os.listdir(dest):
            if fn.endswith(".spec.ts"):
                os.remove(os.path.join(dest, fn))


def install_measurement_suite(wt: str, cfg: dict, checkpoints: list[dict], k: int) -> None:
    """Install the FULL authored cp01..cpK suite (mutative priors winning) into the
    worktree e2e/specs for the gate — the priors the agent never saw."""
    dest = _specs_dest(wt, cfg)
    os.makedirs(dest, exist_ok=True)
    _clear_specs(dest)
    for entry in _authored_specs(checkpoints, k).values():
        src = os.path.join(HARNESS_ROOT, entry)
        if os.path.isfile(src):
            shutil.copy2(src, os.path.join(dest, os.path.basename(entry)))


def _neutralize_spec(text: str) -> str:
    """Strip any cpNN token so the agent's one visible spec carries no sequence hint; a
    leak guard raises if one survives (the specs are authored cpNN-free in content)."""
    if _CP_TOKEN.search(text):
        # our specs contain no cpNN in content; if one appears, fail loudly rather than leak.
        raise RuntimeError("spec content leaks a cpNN token; neutralise it before install")
    return text


def install_agent_view(sandbox: str, cfg: dict, cp: dict) -> None:
    """Sandbox e2e/specs holds EXACTLY the current checkpoint's own spec, neutralised to
    acceptance.spec.ts (no prior specs, no cpNN hint) — the blind view."""
    dest = _specs_dest(sandbox, cfg)
    os.makedirs(dest, exist_ok=True)
    _clear_specs(dest)
    src = os.path.join(HARNESS_ROOT, _own_spec(cp))
    with open(os.path.join(dest, NEUTRAL_SPEC), "w") as fh:
        fh.write(_neutralize_spec(open(src).read()))


# --- pinned files -------------------------------------------------------------


def _restore_pins_to_base(wt: str, app_cfg: dict, cfg: dict) -> None:
    """Restore pinned scaffolding in the worktree to its base_ref version (agent edits to
    bin/*, CLAUDE.md, AGENTS.md must not sway the gate or accumulate)."""
    for pf in cfg.get("isolation", {}).get("pin_files", []):
        r = subprocess.run(["git", "-C", wt, "checkout", app_cfg["base_ref"], "--", pf],
                           capture_output=True, text=True)
        if r.returncode != 0:  # agent-created (absent in base) -> drop it
            fp = os.path.join(wt, pf)
            if os.path.exists(fp):
                os.remove(fp)


def _pins_touched(wt: str, cfg: dict) -> list[str]:
    touched = []
    for pf in cfg.get("isolation", {}).get("pin_files", []):
        if git(["-C", wt, "status", "--porcelain", "--", pf], check=False):
            touched.append(pf)
    return touched


# --- prompt + agent turn ------------------------------------------------------

PROMPT_TEMPLATE = """You are implementing ONE change to this application.

FIRST read CLAUDE.md — it states the working rules, the project layout, and the data-testid
conventions. Follow it.

THE CHANGE REQUEST:
{request}

Your work is verified by an automated Playwright UI test already installed under e2e/specs/.
Read that spec: it declares the exact data-testid anchors, values, and any audit records it
expects — match them. Run `bin/e2e` to build the app, start it, and run the test as you work;
iterate until it passes. Implement the full-stack change (database migration + OfficeFloor
server + front-end). Do NOT edit the pinned scaffolding (bin/build, bin/start, bin/stop,
bin/e2e, CLAUDE.md, AGENTS.md) or the test spec.
"""


REFACTOR_TEMPLATE = """The codebase has grown hard to change: a recent change concentrated a lot
of complexity in a few places. Refactor those places to be simpler and more cohesive so the NEXT
change lands cleanly, WITHOUT changing what the application does — all existing tests must still
pass. Do not add the new feature yet; only restructure.

The upcoming change this should make easier:
{request}

Where complexity concentrated (simplify/restructure these; do not just move code around or copy it):
{flagged}

Read CLAUDE.md for the conventions. Do not edit the pinned scaffolding (bin/*, CLAUDE.md, AGENTS.md)
or the test spec. You can run `bin/e2e` to confirm behaviour is preserved.
"""

REVIEW_TEMPLATE = """Your refactor introduced code-quality problems that must be fixed (they defeat
the point of refactoring). Fix each — consolidate duplication, remove the wasteful patterns —
without changing behaviour:

{findings}
"""


def _layer_src_dirs(cfg: dict) -> list[str]:
    """The source directory of each layer (the prefix of its source_globs), for jscpd/ast-grep
    and the git-diff scope of the quality gate."""
    dirs: list[str] = []
    for globs in (cfg["app"].get("source_globs") or {}).values():
        for g in globs:
            d = impact_gate._glob_prefix(g)[:-3].rstrip("/")   # strip trailing /**
            if d and d not in dirs:
                dirs.append(d)
    return dirs


def _confine_config(cfg: dict, sandbox: str) -> dict | None:
    """Landlock confine dict for the agent turn, or None to run unconfined. Falls back to
    unconfined (with a warning) if Landlock is unavailable — the mirror-based hiding of
    prior specs is the primary blind mechanism; §15 confinement is the belt-and-braces."""
    if os.environ.get("HARNESS_NO_CONFINE"):
        return None  # debug escape: run the agent unconfined (mirror still hides prior specs)
    iso = (cfg.get("isolation") or {}).get("agent_confinement") or {}
    if not iso.get("enabled"):
        return None
    if landlock.abi_version() < 1:
        print("    [warn] agent_confinement enabled but Landlock unavailable — running "
              "UNCONFINED (prior specs still hidden by the sandbox mirror). §15 not enforced.",
              flush=True)
        return None
    # toolchain the agent needs to build+serve+test: JRE/node/opt under /usr,/opt (in the
    # default allowlist); add caches + maven/npm/playwright dirs writable.
    home = os.path.expanduser("~")
    rw = [os.path.join(home, d) for d in (".m2", ".cache", ".npm", ".config")] + ["/tmp"]
    ro = ["/usr", "/opt", "/etc"]
    return {"enabled": True,
            "ro": ro + list(iso.get("extra_ro_binds", [])),
            "rw": rw + list(iso.get("extra_rw_binds", []))}


def _run_agent_turn(cfg: dict, wt: str, sandbox: str, cp: dict, model: str, prompt: str,
                    cap_dir: str, stream_file: str) -> tuple[object, list[dict]]:
    """One agent turn in the fresh, history-less sandbox (rebuilt each attempt). Retries on
    a token-limit / transient failure. Returns (AgentResult, attempt_log)."""
    limits = cfg.get("limits") or {}
    attempts = transient = 0
    log: list[dict] = []
    while True:
        mirror_source(wt, sandbox)
        install_agent_view(sandbox, cfg, cp)
        ar = agent.run_agent(prompt, cwd=sandbox, model=model,
                             timeout=cfg.get("agent_timeout", 3600),
                             capture_path=os.path.join(cap_dir, stream_file),
                             confine=_confine_config(cfg, sandbox))
        log.append({"ok": ar.ok, "limit_reached": ar.limit_reached, "retryable": ar.retryable,
                    "cost_usd": ar.cost_usd, "num_turns": ar.num_turns,
                    "duration_ms": ar.duration_ms, "duration_api_ms": ar.duration_api_ms,
                    "error": (ar.error or "")[:500]})
        if not (ar.limit_reached or ar.retryable):
            return ar, log
        attempts += 1
        if attempts > limits.get("max_attempts", 500):
            raise RuntimeError("exceeded max retry attempts")
        wait = 60
        if ar.retryable:
            transient += 1
            if transient > limits.get("max_transient_attempts", 20):
                raise RuntimeError("too many consecutive transient failures")
            wait = min(60 * (2 ** (transient - 1)), limits.get("retry_backoff_max", 900))
        else:
            transient = 0
            wait = limits.get("poll_seconds", 1800)
        print(f"    [retry] {'limit' if ar.limit_reached else 'transient'} — waiting {wait}s", flush=True)
        time.sleep(wait)


# --- gated condition: implement -> score(both layers) -> refactor -> re-score ---


def _impact_gated_turn(cfg: dict, wt: str, sandbox: str, cp: dict, model: str, template: str,
                       cap_dir: str, stream_file: str, base_for_cp: str,
                       checkpoints: list[dict]) -> tuple[object, list[dict], dict, str]:
    """The `gated` implement->score->refactor loop for one checkpoint (record-and-continue).

    Each iteration the agent implements the change (NEUTRAL prompt — Design B, no formula), the
    production result is mirrored + staged on wt, and impact-gate scores that staged delta PER
    LAYER (front-end TS + backend Java, §8). If NEITHER layer is over block_percentile the
    implementation is ACCEPTED (left staged on wt). Otherwise it is DISCARDED (wt reset to the
    clean base) and a refactor turn runs on that clean base, seeded with the flagged files +
    cost-driver classes from the blocked layers; the refactor's own added lines must pass the
    quality gate (jscpd clones + ast-grep smells, both layers), with up to max_review_turns review
    turns; the refactor is committed and the next implement builds on it. After max_refactors, the
    change is ACCEPTED regardless (advisory: the chain must reach the last checkpoint; the grades
    are measured, not enforced).

    Returns (ar, attempt_log, gate_hist, base_for_cp) with the accepted change mirrored + `git
    add -A` staged on wt, ready for the caller's COMMIT 1. base_for_cp is advanced to the last
    refactor commit (so the COMMIT-1 diff is just the final implement's delta)."""
    igc = cfg["impact_gate"]
    block_p = float(igc.get("block_percentile", 98))
    max_ref = int(igc.get("max_refactors", 2))
    max_review = int(igc.get("max_review_turns", 2))
    qcfg = igc.get("quality_gate") or {}
    quality_dirs = _layer_src_dirs(cfg)
    acc_excl = (cfg["acceptance"]["dest_subpath"].rstrip("/") + "/",)
    refactor_tpl = igc.get("refactor_prompt") or REFACTOR_TEMPLATE
    review_tpl = igc.get("review_prompt") or REVIEW_TEMPLATE
    k = cp["n"]
    prompt = template.replace("{request}", cp["request"].strip())
    attempts: list[dict] = []
    refactors = 0

    def gate_hist(passed: bool) -> dict:
        return {"enabled": True, "enforcement": "advisory", "block_percentile": block_p,
                "max_refactors": max_ref, "refactors": refactors, "passed": passed,
                "attempts": attempts}

    for attempt in range(max_ref + 1):
        ar, attempt_log = _run_agent_turn(cfg, wt, sandbox, cp, model, prompt, cap_dir, stream_file)
        mirror_source(sandbox, wt, extra_excludes=acc_excl)
        git(["-C", wt, "add", "-A"])
        results = impact_gate.score_layers(wt, cfg)
        attempts.append(impact_gate.attempt_summary("implement", results, block_p))
        grades = {ly: impact_gate.grade_percentile(ig) for ly, ig in results.items()}
        blocked_ly = impact_gate.blocked_layers(results, block_p)
        print(f"    impact-gate: implement grades " + ", ".join(
            f"{ly} p{('n/a' if g is None else round(g,1))}" for ly, g in grades.items())
            + f"  (block p{block_p:g}) -> {'BLOCKED ' + str(blocked_ly) if blocked_ly else 'PASS'}"
            + (f"  [refactors: {refactors}]" if refactors else ""), flush=True)
        if not blocked_ly:
            return ar, attempt_log, gate_hist(passed=True), base_for_cp
        if attempt == max_ref:
            print(f"    impact-gate: still over p{block_p:g} after {refactors} refactor(s) "
                  f"(advisory — accepted, not enforced)", flush=True)
            return ar, attempt_log, gate_hist(passed=False), base_for_cp

        # DISCARD the blocked change, REFACTOR on the clean base.
        git(["-C", wt, "reset", "--hard", base_for_cp])
        subprocess.run(["git", "-C", wt, "clean", "-fd"], capture_output=True, text=True)
        refactors += 1
        mirror_source(wt, sandbox)
        install_agent_view(sandbox, cfg, cp)
        rprompt = impact_gate.refactor_prompt(refactor_tpl, cp, results, block_p)
        rstream = f"cp{k:02d}.refactor{refactors}.jsonl"
        print(f"    impact-gate: refactor {refactors}/{max_ref} — restructuring flagged "
              f"classes before re-attempting", flush=True)
        rar = agent.run_agent(rprompt, cwd=sandbox, model=model,
                              timeout=cfg.get("agent_timeout", 3600),
                              capture_path=os.path.join(cap_dir, rstream),
                              confine=_confine_config(cfg, sandbox))
        mirror_source(sandbox, wt, extra_excludes=acc_excl)
        git(["-C", wt, "add", "-A"])
        # QUALITY GATE — the refactor's own added lines must be clean (both layers).
        quality = None
        if qcfg.get("enabled", True):
            for qt in range(max_review + 1):
                quality = quality_gate.review(wt, quality_dirs, cfg.get("tools") or {}, qcfg)
                if not quality.ran or quality.passed:
                    if quality.ran:
                        print(f"    quality-gate: refactor {refactors} clean"
                              + (f" after {qt} review turn(s)" if qt else ""), flush=True)
                    else:
                        print(f"    quality-gate: tools did not run ({quality.reason}); "
                              f"not enforced", flush=True)
                    break
                if qt == max_review:
                    print(f"    quality-gate: refactor {refactors} still dirty after {qt} "
                          f"review turn(s) — accepting (advisory)", flush=True)
                    break
                print(f"    quality-gate: refactor {refactors} dirty "
                      f"({quality.clone_finding_lines} clone + {quality.smell_finding_lines} "
                      f"smell lines) -> review {qt + 1}/{max_review}", flush=True)
                qar = agent.run_agent(review_tpl.replace("{findings}", quality.review_text),
                                      cwd=sandbox, model=model,
                                      timeout=cfg.get("agent_timeout", 3600),
                                      capture_path=os.path.join(
                                          cap_dir, f"cp{k:02d}.refactor{refactors}.review{qt+1}.jsonl"),
                                      confine=_confine_config(cfg, sandbox))
                mirror_source(sandbox, wt, extra_excludes=acc_excl)
                git(["-C", wt, "add", "-A"])
        subprocess.run(["git", "-C", wt, "commit", "--allow-empty",
                        "-m", f"cp{k:02d} refactor{refactors} {cp['id']}"],
                       capture_output=True, text=True)
        rsha = git(["-C", wt, "rev-parse", "HEAD"])
        results_ref = impact_gate.score_layers(wt, cfg)
        attempts.append(impact_gate.attempt_summary(
            "refactor", results_ref, block_p, sha=rsha, agent=rar,
            quality=quality_gate.summary(quality) if quality is not None else None))
        shutil.rmtree(sandbox, ignore_errors=True)   # next implement rebuilds fresh from wt
        base_for_cp = rsha
    return ar, attempt_log, gate_hist(passed=False), base_for_cp   # unreachable (loop returns)


# --- capture commits ----------------------------------------------------------


def commit_run_manifest(wt: str, branch: str, run_id: str, condition: str, chain: int,
                        provenance: dict, snapshot: dict | None) -> None:
    out = os.path.join(wt, "evolve-results")
    os.makedirs(out, exist_ok=True)
    capture.write_json(os.path.join(out, "provenance.json"), provenance)
    if snapshot:
        capture.snapshot_config(snapshot.get("config"), snapshot.get("checkpoints"),
                                snapshot.get("astgrep_rules"), out)
    subprocess.run(["git", "-C", wt, "add", "evolve-results"], capture_output=True, text=True)
    subprocess.run(["git", "-C", wt, "commit", "-m",
                    f"manifest: {condition}/chain{chain} - run {run_id}", "--", "evolve-results"],
                   capture_output=True, text=True)


def commit_chain_results(wt: str, branch: str, run_id: str, condition: str, chain: int,
                         cap_dir: str, headline: str) -> None:
    out = os.path.join(wt, "evolve-results")
    os.makedirs(out, exist_ok=True)
    capture.assemble_into(cap_dir, out)
    subprocess.run(["git", "-C", wt, "add", "evolve-results"], capture_output=True, text=True)
    subprocess.run(["git", "-C", wt, "commit", "--allow-empty", "-m",
                    f"results: {condition}/chain{chain} - run {run_id} (raw capture)\n\n{headline}",
                    "--", "evolve-results"], capture_output=True, text=True)


# --- the chain loop -----------------------------------------------------------


def run_chain(cfg: dict, condition: str, chain: int, run_id: str,
              checkpoints: list[dict], lo: int, hi: int) -> None:
    app_cfg = cfg["app"]
    model = cfg["model"]
    n = len(checkpoints)
    template = ((cfg.get("prompt_strategies") or {}).get(condition) or {}).get("template") \
        or PROMPT_TEMPLATE

    wt, branch = make_worktree(app_cfg, cfg["paths"]["work_root"], condition, chain, run_id)
    base_commit = git(["-C", wt, "rev-parse", "HEAD"])
    print(f"\n=== {condition}/chain{chain}  branch={branch}  worktree={wt} ===", flush=True)

    prov = capture.provenance(cfg, run_id, model, HARNESS_DIR, extra={
        "condition": condition, "chain": chain, "branch": branch,
        "base_ref": app_cfg["base_ref"], "base_commit": base_commit, "app_repo": app_cfg["repo"]})
    commit_run_manifest(wt, branch, run_id, condition, chain, prov, cfg.get("_snapshot"))

    cap_dir = wt + "-capture"
    shutil.rmtree(cap_dir, ignore_errors=True)
    os.makedirs(cap_dir, exist_ok=True)

    sandbox = cfg["paths"]["sandbox_root"]
    if not sandbox or os.path.abspath(sandbox) in ("/", os.path.expanduser("~")):
        raise RuntimeError(f"paths.sandbox_root must be a dedicated directory, not {sandbox!r}")
    shutil.rmtree(sandbox, ignore_errors=True)

    prior_passing: set[str] = set()
    captures: list[dict] = []
    strict_count = regr_count = 0

    for cp in checkpoints:
        k = cp["n"]
        if k < lo or k > hi:
            continue
        phase = phase_for(k, n)
        cid = cp["id"]
        print(f"\n--- run {run_id} | {condition}/chain{chain} | cp{k:02d} [{phase}] {cid} ---", flush=True)
        if cp.get("type") == "mutative":
            print(f"    type   : MUTATIVE (revises {cp.get('mutates', [])})", flush=True)
        print(f"    request: {cp['request'].strip().splitlines()[0]}", flush=True)

        base_for_cp = git(["-C", wt, "rev-parse", "HEAD"])
        stream_file = f"cp{k:02d}.agent.jsonl"
        prompt = template.replace("{request}", cp["request"].strip())

        gate_hist = None
        if condition == "gated" and cfg.get("impact_gate"):
            # implement -> score both layers -> refactor (quality-gated) -> re-score; leaves the
            # accepted change mirrored + staged on wt, base_for_cp advanced past any refactor.
            ar, attempt_log, gate_hist, base_for_cp = _impact_gated_turn(
                cfg, wt, sandbox, cp, model, template, cap_dir, stream_file, base_for_cp, checkpoints)
        else:
            ar, attempt_log = _run_agent_turn(cfg, wt, sandbox, cp, model, prompt, cap_dir, stream_file)
            # copy the agent's PRODUCTION result back (sandbox e2e/specs excluded: specs are the
            # harness's, not the agent's delta).
            mirror_source(sandbox, wt, extra_excludes=(cfg["acceptance"]["dest_subpath"].rstrip("/") + "/",))
            git(["-C", wt, "add", "-A"])

        diff_file = f"cp{k:02d}.agent.diff"
        with open(os.path.join(cap_dir, diff_file), "w") as fh:
            fh.write(subprocess.run(["git", "-C", wt, "diff", "--cached", base_for_cp],
                                    capture_output=True, text=True).stdout)

        touched_pins = _pins_touched(wt, cfg)
        # COMMIT 1 — the pure agent delta (incl. any pinned edit, which is flagged).
        subprocess.run(["git", "-C", wt, "commit", "-m", f"cp{k:02d} agent {cid}"],
                       capture_output=True, text=True)
        agent_sha = git(["-C", wt, "rev-parse", "HEAD"])

        # GATE prep: restore pins to base, install the full cp01..cpK suite, drop stale build.
        _restore_pins_to_base(wt, app_cfg, cfg)
        install_measurement_suite(wt, cfg, checkpoints, k)
        shutil.rmtree(os.path.join(wt, "target"), ignore_errors=True)

        outcome = correctness.run_tests(wt, k, cfg)
        build_log_file = None
        if outcome.console:
            build_log_file = f"cp{k:02d}.build.log"
            with open(os.path.join(cap_dir, build_log_file), "w") as fh:
                fh.write(outcome.console[:1_000_000])

        mutated = [int(m) for m in (cp.get("mutates") or [])]
        row = correctness.outcome_row(outcome, prior_passing, mutated)
        if not outcome.gate_invalid:
            prior_passing = outcome.passing
        strict_count += 1 if row.get("strict_pass") is True else 0
        regr_count += int(row.get("regressions") or 0)

        # console summary
        failed = [t for t, ok in (outcome.results or {}).items() if not ok]
        print(f"    gate   : build_ok={outcome.build_ok} selected={outcome.total_selected} "
              f"strict_pass={row.get('strict_pass')} regressions={row.get('regressions')} "
              f"true_regr={row.get('true_regressions')} gate_invalid={outcome.gate_invalid}", flush=True)
        if failed:
            print(f"    FAILED : {len(failed)}/{outcome.total_selected}: "
                  + "; ".join(sorted(failed)[:6]), flush=True)
        if outcome.error:
            print(f"    error  : {outcome.error[:200]}", flush=True)
        if touched_pins:
            print(f"    flags  : pinned_touched={touched_pins}", flush=True)

        # raw capture record + stage per-checkpoint capture into COMMIT 2.
        rec = capture.checkpoint_record(
            k, cid, phase,
            {"commit": agent_sha, "reset": "", "preagent": base_for_cp,
             "prev": base_for_cp, "base": base_commit},
            ar, outcome, None, touched_pins, [], stream_file, diff_file,
            build_log_file=build_log_file, attempts=attempt_log,
            spec=cp["request"], prompt=prompt, ckpt_type=cp.get("type", "additive"),
            mutates=mutated, impact_gate=gate_hist)
        capture.write_json(os.path.join(cap_dir, f"cp{k:02d}.json"), rec)
        wt_cap = os.path.join(wt, "evolve-results", "capture")
        os.makedirs(wt_cap, exist_ok=True)
        for f in os.listdir(cap_dir):
            if f.startswith(f"cp{k:02d}."):
                shutil.copy2(os.path.join(cap_dir, f), os.path.join(wt_cap, f))
        captures.append(rec)

        # normalise: clear the installed gate specs (gitignored anyway) + restore pins.
        _clear_specs(_specs_dest(wt, cfg))
        _restore_pins_to_base(wt, app_cfg, cfg)
        # COMMIT 2 — reset (normalisation + capture). Two-commit boundary.
        git(["-C", wt, "add", "-A"])
        subprocess.run(["git", "-C", wt, "commit", "--allow-empty", "-m", f"cp{k:02d} reset {cid}"],
                       capture_output=True, text=True)

        shutil.rmtree(sandbox, ignore_errors=True)

    headline = (f"checkpoints={len(captures)} strict_pass={strict_count}/{len(captures)} "
                f"regressions={regr_count} (derived numbers recomputed by analyze)")
    commit_chain_results(wt, branch, run_id, condition, chain, cap_dir, headline)
    shutil.rmtree(sandbox, ignore_errors=True)
    print(f"\n=== done: {headline} ===", flush=True)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--condition", help="intervention condition (default active_condition)")
    ap.add_argument("--chain", type=int, default=1)
    ap.add_argument("--run-id")
    ap.add_argument("--model")
    ap.add_argument("--from", dest="lo", type=int, default=1, help="first checkpoint (1-based)")
    ap.add_argument("--to", dest="hi", type=int, default=10**9, help="last checkpoint (inclusive)")
    ap.add_argument("--allow-short-token", action="store_true",
                    help="skip the long-lived-token check (local smoke tests only)")
    args = ap.parse_args()

    if not args.allow_short_token:
        require_long_lived_token()

    with open(args.config) as fh:
        cfg = yaml.safe_load(fh)
    # YAML sections written as comment-only parse to None; normalise to dicts.
    for key in ("tools", "limits", "build", "impact_gate", "prompt_strategies",
                "conditions", "isolation"):
        cfg[key] = cfg.get(key) or {}
    if args.model:
        cfg["model"] = args.model
    condition = args.condition or cfg["active_condition"]
    run_id = args.run_id or datetime.now().strftime("%Y%m%d%H%M")

    cfg_dir = os.path.dirname(os.path.abspath(args.config))

    def resolve(p):
        if p is None:
            return p
        p = expand_path(p)
        return p if os.path.isabs(p) else os.path.join(cfg_dir, p)

    cfg["app"]["repo"] = expand_path(cfg["app"]["repo"], "app.repo")
    # ast-grep rules live in the harness repo but the quality gate runs with cwd in the worktree,
    # so resolve to an absolute path here.
    ar_rules = (cfg.get("tools") or {}).get("astgrep_rules")
    if ar_rules and not os.path.isabs(ar_rules):
        cfg["tools"]["astgrep_rules"] = os.path.join(HARNESS_ROOT, ar_rules)
    cfg["checkpoints_file"] = resolve(cfg["checkpoints_file"])
    cfg["paths"]["work_root"] = resolve(cfg["paths"]["work_root"])
    cfg["paths"]["sandbox_root"] = resolve(cfg["paths"]["sandbox_root"])
    cfg["_snapshot"] = {"config": os.path.abspath(args.config),
                        "checkpoints": cfg["checkpoints_file"]}

    with open(cfg["checkpoints_file"]) as fh:
        checkpoints = yaml.safe_load(fh)["checkpoints"]
    for i, cp in enumerate(checkpoints, 1):
        cp["n"] = i

    print(f"run_id={run_id} model={cfg['model']} condition={condition} "
          f"chain={args.chain} checkpoints={args.lo}..{min(args.hi, len(checkpoints))}", flush=True)
    run_chain(cfg, condition, args.chain, run_id, checkpoints, args.lo, args.hi)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

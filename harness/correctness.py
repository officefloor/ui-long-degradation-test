"""Build + serve + Playwright acceptance gate and correctness scoring (UI arm).

REST arm:  build (mvn) -> in-process MockMvc -> parse Surefire XML.
UI arm:    build the app (bin/build) -> START it (bin/start, one JVM: OfficeFloor +
           in-memory H2 + static SPA) -> drive it with Playwright over http -> parse the
           Playwright JSON report -> stop (bin/stop).

Tests assert through TWO declared contracts only (DESIGN.md §3): the UI (`data-testid`)
and the known audit file (support/audit.ts). Scoring math (regressions / true_regressions
/ normalized change / categories) is lifted from the REST arm's correctness.py so the two
studies stay comparable — only the build/serve/parse mechanics differ.

The stable test id is `<spec-basename>::<full title>`; the checkpoint a test belongs to is
parsed from `cpNN` in its spec basename (a mutative checkpoint installs an updated copy of a
prior spec BY BASENAME, so it keeps the prior's checkpoint number — see run_experiment).
"""
from __future__ import annotations

import contextlib
import json
import os
import re
import shutil
import signal
import socket
import subprocess
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from enum import Enum

CP_RE = re.compile(r"cp0*(\d+)", re.IGNORECASE)          # cpNN in a spec basename
_HEALTH_UP = re.compile(r'"status"\s*:\s*"UP"')


# --- regression reason classification (DESIGN.md §6) --------------------------


class RegressionReason(str, Enum):
    ANCHOR_DRIFT = "anchor_drift"      # element present + working, data-testid changed/removed
    BEHAVIOUR_LOSS = "behaviour_loss"  # the feature (UI or audit record) genuinely broke
    SEED_PATH = "seed_path"            # beforeEach reset+seed via /__test__ failed (schema/API drift)
    INTENDED = "intended"              # a prior rule this mutative checkpoint deliberately changed


@dataclass
class TestOutcome:
    """RAW result map + scored aggregates. Field names match the REST arm's TestOutcome
    (so harness.capture.checkpoint_record and analyze consume either), plus `reasons`."""

    build_ok: bool = False
    error: str = ""
    build_output: str = ""
    console: str = ""                                       # full build + playwright console
    passing: set[str] = field(default_factory=set)
    results: dict[str, bool] = field(default_factory=dict)  # {test_id: passed} — the atom
    detail: list[dict] = field(default_factory=list)        # per-test time + failure + category
    reasons: dict[str, str] = field(default_factory=dict)   # {failed_test_id: RegressionReason}
    total_selected: int = 0
    gate_invalid: bool = False
    gate_attempts: int = 0
    core_pass: int = 0
    core_total: int = 0
    error_pass: int = 0
    error_total: int = 0
    func_pass: int = 0
    func_total: int = 0
    regr_pass: int = 0
    regr_total: int = 0

    @property
    def all_pass(self) -> bool:
        return self.total_selected > 0 and len(self.passing) == self.total_selected

    @property
    def iso_pass(self) -> bool:
        cur_total = self.core_total + self.error_total + self.func_total
        cur_pass = self.core_pass + self.error_pass + self.func_pass
        return cur_total > 0 and cur_pass == cur_total

    @property
    def core_all_pass(self) -> bool:
        return self.core_total > 0 and self.core_pass == self.core_total


@dataclass
class AppHandle:
    base_url: str
    port: int = 0


# --- build + serve the running app -------------------------------------------


def _script(worktree: str, cfg: dict, key: str) -> str:
    """Absolute path to a bin/* script named in cfg['app'][key]."""
    return os.path.join(worktree, cfg["app"][key])


def build(worktree: str, cfg: dict) -> tuple[bool, str]:
    """Run cfg['app'].build_cmd (bin/build) in the worktree — front-end -> static/, then
    spring-boot repackage -> target/*.jar. Returns (ok, console)."""
    cmd = [_script(worktree, cfg, "build_cmd")]
    try:
        p = subprocess.run(cmd, cwd=worktree, capture_output=True, text=True,
                           timeout=(cfg.get("build") or {}).get("timeout", 1800))
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError) as e:
        return False, f"[build launch/timeout] {e}"
    out = (p.stdout or "") + (p.stderr or "")
    return p.returncode == 0, out


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def wait_ready(base_url: str, cfg: dict, timeout: int = 180) -> bool:
    """Poll <base_url>/actuator/health until it reports status UP (or 200), or timeout."""
    deadline = time.time() + timeout
    url = base_url.rstrip("/") + "/actuator/health"
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=5) as r:
                body = r.read().decode("utf-8", "replace")
                if r.status == 200 and (_HEALTH_UP.search(body) or not body):
                    return True
        except (urllib.error.URLError, OSError, ValueError):
            pass
        time.sleep(1)
    return False


def _kill_port(port: int) -> None:
    subprocess.run(["fuser", "-k", f"{port}/tcp"], capture_output=True, text=True)


@contextlib.contextmanager
def serve(worktree: str, cfg: dict):
    """Bring the whole app up on one port (bin/start) and tear it down (bin/stop).

    Sets PORT and an absolute AUDIT_FILE (under <worktree>/.run) so the app and the specs
    (support/audit.ts) agree on the audit-file channel. Assumes build() already ran.
    Yields AppHandle(base_url, port). Idempotent teardown; kills by port as a backstop."""
    port = int(cfg["app"].get("port") or 0) or _free_port()
    base_url = f"http://localhost:{port}"
    run_dir = os.path.join(worktree, ".run")
    os.makedirs(run_dir, exist_ok=True)
    audit_file = os.path.join(run_dir, "audit.log")
    env = os.environ.copy()
    env["PORT"] = str(port)
    env["BASE_URL"] = base_url
    env["AUDIT_FILE"] = audit_file
    started = False
    try:
        subprocess.run([_script(worktree, cfg, "start_cmd")], cwd=worktree, env=env,
                       capture_output=True, text=True,
                       timeout=(cfg.get("build") or {}).get("start_timeout", 300))
        started = True
        if not wait_ready(base_url, cfg, timeout=(cfg.get("build") or {}).get("ready_timeout", 180)):
            raise RuntimeError(f"app did not become ready at {base_url}/actuator/health")
        yield AppHandle(base_url=base_url, port=port)
    finally:
        if started:
            subprocess.run([_script(worktree, cfg, "stop_cmd")], cwd=worktree, env=env,
                           capture_output=True, text=True, timeout=120)
        _kill_port(port)


# --- Playwright run + parse ---------------------------------------------------


def _playwright_test_id(spec_file: str, titles: list[str]) -> str:
    """`<spec-basename>::<full title path>` — stable across runs and (for a mutative
    updated prior) keeps the prior's basename, hence its checkpoint number."""
    return f"{os.path.basename(spec_file)}::{' > '.join(titles)}"


def _flatten_pw_json(report: dict) -> tuple[dict[str, bool], list[dict]]:
    """Parse a Playwright JSON report into {test_id: passed} + detail rows.

    A test passed iff its result status is 'passed' or 'expected'. Category is read from
    the test's tags (@core/@error/@functionality); default 'functionality'."""
    results: dict[str, bool] = {}
    detail: list[dict] = []

    def walk(suite: dict, spec_file: str):
        spec_file = suite.get("file", spec_file)
        for spec in suite.get("specs", []) or []:
            title = spec.get("title", "")
            for t in spec.get("tests", []) or []:
                titles = list(spec.get("titlePath") or []) or [title]
                # spec.titlePath includes project + describe; prefer the spec's own if present
                tid = _playwright_test_id(spec_file, [p for p in (spec.get("titlePath") or [title]) if p and not p.endswith(".ts")] or [title])
                tags = [str(x).lstrip("@").lower() for x in (t.get("tags") or spec.get("tags") or [])]
                cat = next((c for c in ("core", "error", "functionality") if c in tags), "functionality")
                statuses = [r.get("status") for r in (t.get("results") or [])]
                passed = bool(statuses) and statuses[-1] in ("passed", "expected")
                results[tid] = passed
                fail = ""
                if not passed:
                    errs = []
                    for r in (t.get("results") or []):
                        for e in (r.get("errors") or []):
                            errs.append(str(e.get("message") or ""))
                        if r.get("error"):
                            errs.append(str(r["error"].get("message") or ""))
                    fail = " | ".join(x for x in errs if x)[:2000]
                dur = max([r.get("duration", 0) for r in (t.get("results") or [])] or [0])
                detail.append({"test_id": tid, "category": cat, "passed": passed,
                               "duration_ms": dur, "failure": fail})
        for child in suite.get("suites", []) or []:
            walk(child, spec_file)

    for suite in report.get("suites", []) or []:
        walk(suite, "")
    return results, detail


def _classify(detail_row: dict, mutated_cps: set[int]) -> str:
    """Best-effort reason for a failed test (DESIGN.md §6). Correctness of pass/fail and
    regression counts does not depend on this — it is for the reason breakdown only."""
    cp = test_checkpoint(detail_row["test_id"])
    if cp is not None and cp in mutated_cps:
        return RegressionReason.INTENDED.value
    f = (detail_row.get("failure") or "").lower()
    if "__test__" in f or "beforeeach" in f or "/reset" in f or "/seed" in f:
        return RegressionReason.SEED_PATH.value
    # A locator that resolved to nothing / count 0 hints the anchor moved; otherwise the
    # feature's behaviour (value/action/audit record) is wrong.
    if ("tohavecount" in f) or ("expected: visible" in f) or ("element(s) not found" in f) \
            or ("received: <element(s) not found>" in f) or ("resolved to 0 elements" in f):
        return RegressionReason.ANCHOR_DRIFT.value
    return RegressionReason.BEHAVIOUR_LOSS.value


def run_tests(worktree: str, checkpoint_k: int, cfg: dict) -> TestOutcome:
    """Build the app, serve it, run the Playwright specs present in e2e (the driver has
    installed the full cp01..cpK suite), parse + score. Assertions are UI + audit only."""
    ok, build_out = build(worktree, cfg)
    console = f"$ {cfg['app']['build_cmd']}\n{build_out}"
    if not ok:
        return TestOutcome(build_ok=False, error=f"build failed:\n{build_out[-1600:]}",
                           build_output=build_out[-1600:], console=console)

    e2e_dir = os.path.join(worktree, "e2e")
    # A fresh worktree has no e2e/node_modules (gitignored) — install the PINNED Playwright
    # from the committed lockfile (not `npx`'s latest, which needs a newer Node) and its
    # browser, exactly as bin/e2e does. Cached after the first run.
    for step in (["npm", "ci", "--silent"], ["npx", "playwright", "install", "chromium"]):
        try:
            dp = subprocess.run(step, cwd=e2e_dir, capture_output=True, text=True, timeout=1800)
            console += f"\n$ {' '.join(step)} (cwd e2e)\n{(dp.stdout or '')[-2000:]}{(dp.stderr or '')[-2000:]}"
            if dp.returncode != 0:
                return TestOutcome(build_ok=True, gate_invalid=True, gate_attempts=1,
                                   error=f"e2e dep install failed: {' '.join(step)}", console=console)
        except (FileNotFoundError, subprocess.TimeoutExpired, OSError) as e:
            return TestOutcome(build_ok=True, gate_invalid=True, gate_attempts=1,
                               error=f"e2e dep install error ({' '.join(step)}): {e}", console=console)

    json_out = os.path.join(worktree, ".run", "pw-report.json")
    os.makedirs(os.path.dirname(json_out), exist_ok=True)
    outcome = TestOutcome(build_ok=True)
    try:
        with serve(worktree, cfg) as app:
            env = os.environ.copy()
            env.update({"PORT": str(app.port), "BASE_URL": app.base_url,
                        "AUDIT_FILE": os.path.join(worktree, ".run", "audit.log"),
                        "PLAYWRIGHT_JSON_OUTPUT_NAME": json_out})
            # --workers=1 is REQUIRED, not an optimisation: the full accumulated suite spans many
            # spec files that all drive ONE shared app + in-memory H2 via /__test__/reset+seed
            # (Arrange per test). Playwright's default is multi-worker and `fullyParallel:false`
            # only serialises WITHIN a file, so different files would run concurrently and their
            # reset/seed calls would stomp on each other — producing false cross-file regressions
            # that grow with the suite. One worker = fully serial = the reset/seed isolation holds.
            cmd = ["npx", "playwright", "test", "--reporter=json", "--workers=1",
                   f"--output={os.path.join(worktree, '.run', 'pw-artifacts')}"]
            try:
                p = subprocess.run(cmd, cwd=e2e_dir, env=env, capture_output=True, text=True,
                                   timeout=(cfg.get("acceptance") or {}).get("test_timeout", 1800))
            except (FileNotFoundError, subprocess.TimeoutExpired, OSError) as e:
                return TestOutcome(build_ok=True, gate_invalid=True, gate_attempts=1,
                                   error=f"playwright failed to launch/timed out: {e}",
                                   console=console + f"\n[playwright launch/timeout] {e}")
            console += "\n$ " + " ".join(cmd) + "\n" + (p.stdout or "") + (p.stderr or "")
            # --reporter=json writes to PLAYWRIGHT_JSON_OUTPUT_NAME; fall back to stdout.
            report = None
            if os.path.isfile(json_out):
                try:
                    report = json.load(open(json_out))
                except (json.JSONDecodeError, OSError):
                    report = None
            if report is None:
                try:
                    report = json.loads(p.stdout)
                except (json.JSONDecodeError, TypeError):
                    report = None
    except RuntimeError as e:
        return TestOutcome(build_ok=True, gate_invalid=True, gate_attempts=1,
                           error=f"serve failed: {e}", console=console + f"\n[serve] {e}")

    if not report:
        return TestOutcome(build_ok=True, gate_invalid=True, gate_attempts=1,
                           error="no parseable Playwright JSON report", console=console)

    results, detail = _flatten_pw_json(report)
    if not results:
        return TestOutcome(build_ok=True, gate_invalid=True, gate_attempts=1,
                           error="gate produced no test results", console=console)

    cats = {d["test_id"]: d["category"] for d in detail}
    outcome = score_results(results, checkpoint_k, cats)
    outcome.detail = detail
    outcome.console = console
    outcome.gate_attempts = 1
    # reason breakdown for failed PRIOR tests (regressions); mutated set filled by caller-side
    # true_regressions math — reasons here are advisory.
    mutated: set[int] = set()
    for d in detail:
        if not d["passed"]:
            outcome.reasons[d["test_id"]] = _classify(d, mutated)
    return outcome


# --- scoring math (semantics identical to the REST arm) ----------------------


def score_results(results: dict[str, bool], checkpoint_k: int,
                  cats: dict[str, str] | None = None) -> TestOutcome:
    """Categorise a raw {test_id: passed} map into a TestOutcome. A test whose checkpoint
    number < K is a Regression at K; otherwise it counts under its category (core/error/
    functionality). Defined once so run_tests and analyze score identically."""
    cats = cats or {}
    outcome = TestOutcome(build_ok=True)
    outcome.results = dict(results)
    outcome.total_selected = len(results)
    outcome.passing = {tid for tid, ok in results.items() if ok}
    for tid, passed in results.items():
        cp = test_checkpoint(tid)
        if cp is not None and cp < checkpoint_k:
            outcome.regr_total += 1
            outcome.regr_pass += int(passed)
            continue
        cat = (cats.get(tid) or "functionality").lower()
        if cat == "core":
            outcome.core_total += 1
            outcome.core_pass += int(passed)
        elif cat == "error":
            outcome.error_total += 1
            outcome.error_pass += int(passed)
        else:
            outcome.func_total += 1
            outcome.func_pass += int(passed)
    return outcome


def normalized_change(prior_passing: set[str], now_passing: set[str],
                      target_total: int) -> float:
    """SWE-CI asymmetric Normalized Change in [-1, 1] (identical to the REST arm)."""
    baseline = len(prior_passing)
    passed = len(now_passing)
    if passed >= baseline:
        denom = target_total - baseline
        return 1.0 if denom <= 0 else (passed - baseline) / denom
    return -1.0 if baseline <= 0 else (passed - baseline) / baseline


def test_checkpoint(test_id: str) -> int | None:
    """The checkpoint number a test belongs to, from `cpNN` in its spec basename."""
    base = test_id.split("::", 1)[0]
    m = CP_RE.search(base)
    return int(m.group(1)) if m else None


def count_regressions(prior_passing: set[str], now_passing: set[str]) -> int:
    return len(prior_passing - now_passing)


def count_true_regressions(prior_passing: set[str], now_passing: set[str],
                           mutated_cps) -> int:
    """Regressions on the surface a mutative checkpoint did NOT intend to change."""
    mut = {int(m) for m in (mutated_cps or ())}
    return sum(1 for t in (prior_passing - now_passing) if test_checkpoint(t) not in mut)


def outcome_row(outcome: "TestOutcome", prior_passing: set[str], mutated_cps=()) -> dict:
    """Flatten a scored TestOutcome to the per-checkpoint correctness row (incl. Normalized
    Change + regressions + a reason breakdown). Called by the runner and by analyze."""
    if outcome.gate_invalid:
        blanks = {f: "" for f in (
            "total_selected", "strict_pass", "iso_pass", "core_pass", "core_p", "core_t",
            "error_p", "error_t", "func_p", "func_t", "regr_p", "regr_t",
            "normalized_change", "regressions", "true_regressions",
            "anchor_drift", "behaviour_loss", "seed_path")}
        return {"build_ok": outcome.build_ok, "gate_invalid": True, **blanks}
    mut = {int(m) for m in (mutated_cps or ())}
    reason_counts = {r.value: 0 for r in RegressionReason}
    for tid, reason in outcome.reasons.items():
        # only count reasons for PRIOR (regression) failures; current-checkpoint failures
        # are "not yet solved", not regressions.
        cp = test_checkpoint(tid)
        if cp is not None and cp in mut:
            reason_counts[RegressionReason.INTENDED.value] += 1
        elif tid in prior_passing:
            reason_counts[reason] = reason_counts.get(reason, 0) + 1
    return {
        "build_ok": outcome.build_ok,
        "gate_invalid": False,
        "total_selected": outcome.total_selected,
        "strict_pass": outcome.all_pass,
        "iso_pass": outcome.iso_pass,
        "core_pass": outcome.core_all_pass,
        "core_p": outcome.core_pass, "core_t": outcome.core_total,
        "error_p": outcome.error_pass, "error_t": outcome.error_total,
        "func_p": outcome.func_pass, "func_t": outcome.func_total,
        "regr_p": outcome.regr_pass, "regr_t": outcome.regr_total,
        "normalized_change": round(
            normalized_change(prior_passing, outcome.passing, outcome.total_selected), 4),
        "regressions": count_regressions(prior_passing, outcome.passing),
        "true_regressions": count_true_regressions(prior_passing, outcome.passing, mutated_cps),
        "anchor_drift": reason_counts.get(RegressionReason.ANCHOR_DRIFT.value, 0),
        "behaviour_loss": reason_counts.get(RegressionReason.BEHAVIOUR_LOSS.value, 0),
        "seed_path": reason_counts.get(RegressionReason.SEED_PATH.value, 0),
    }

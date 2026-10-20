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
    # The element the test acts on or reads is not on the page: a removed or renamed data-testid,
    # or a feature that is missing or broken. (Not proof of a renamed anchor — the cp87 and cp55
    # regressions of run 202610100208 were missing features reported this way.)
    ANCHOR_DRIFT = "anchor_drift"
    BEHAVIOUR_LOSS = "behaviour_loss"  # the element is there but the value/action/audit is wrong
    SEED_PATH = "seed_path"            # retired (specs arrange through the screens); kept so old
                                       #   captures still read
    INFRASTRUCTURE = "infrastructure"  # the runner or the connection failed, not the app's logic
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
    # The code under test produced no working app: it did not build, never became ready, or died
    # mid-gate on both attempts. That checkpoint has no per-test verdict (every prior test would
    # read as a regression, hundreds from one break), so it is reported in its own column, left
    # out of the regression counts, and the baseline stays with the last working checkpoint.
    app_broken: bool = False
    gate_attempts: int = 0
    # Retired with the seed endpoint; always None now, kept so old captures still read.
    seed_contract: dict | None = None
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
    whatever `bin/build` does — the harness never looks inside, and the stack may be
    any language (docs/SUT_CONTRACT.md §2). Returns (ok, console)."""
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
    # Start the audit file empty: the app only appends, every spec filters by its own sheet id,
    # and the specs re-read the whole file on every audit check, so a file that kept growing
    # across a run's gates (21 MB by cp71 of run 202610192149) made every check slower.
    open(audit_file, "w").close()
    env = os.environ.copy()
    env["PORT"] = str(port)
    env["BASE_URL"] = base_url
    env["AUDIT_FILE"] = audit_file
    # Free the port BEFORE starting. bin/start only has to background the app on $PORT
    # with no bind check, so a JVM left behind by a crashed run would keep the port, the new one
    # would die on bind, and wait_ready would get a healthy UP from the STALE app — gating this
    # checkpoint against the wrong build, with nothing in the log to say so.
    _kill_port(port)
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


# A failure of the runner or the connection rather than of the app's behaviour (a dead app
# refuses every connection: run 202610100208's cp68, one JVM death, 58 tests failed on it).
_INFRASTRUCTURE = re.compile(
    r"ECONNREFUSED|ECONNRESET|socket hang up|net::ERR_CONNECTION|"
    r"(?:page|context|browser|target)[^|]{0,40}(?:has been closed|crashed)|"
    r"worker process exited unexpectedly", re.I)


def _classify(detail_row: dict, mutated_cps: set[int]) -> str:
    """Best-effort reason for a failed test (DESIGN.md §6). Correctness of pass/fail and
    regression counts does not depend on this — it is for the reason breakdown only."""
    cp = test_checkpoint(detail_row["test_id"])
    if cp is not None and cp in mutated_cps:
        return RegressionReason.INTENDED.value
    raw = detail_row.get("failure") or ""
    if _INFRASTRUCTURE.search(raw):
        return RegressionReason.INFRASTRUCTURE.value
    f = raw.lower()
    # A locator that resolved to nothing / count 0 hints the anchor moved; otherwise the
    # feature's behaviour (value/action/audit record) is wrong.
    if ("tohavecount" in f) or ("expected: visible" in f) or ("element(s) not found" in f) \
            or ("received: <element(s) not found>" in f) or ("resolved to 0 elements" in f):
        return RegressionReason.ANCHOR_DRIFT.value
    return RegressionReason.BEHAVIOUR_LOSS.value


# Playwright exits 0 when every test passed and 1 when some failed; anything else (a signal shows
# as a negative code) means the runner itself broke, so the report says nothing about the code.
_PW_NORMAL_EXITS = (0, 1)
# A failure caused by the test RUNNER, not the app under test.
_RUNNER_CRASH = re.compile(r"worker process exited unexpectedly", re.I)
_APP_DIED = "app was no longer healthy"
_SERVE_FAILED = "serve failed"
_BUILD_INFRA = "[build launch/timeout]"


def gate_problem(returncode: int | None, report: dict | None, expected_files: set[str],
                 app_alive: bool) -> str:
    """Why a finished Playwright run cannot be scored, or "" if it can.

    Pure (no I/O) so the rules are unit-tested. A run is unscoreable when the runner crashed,
    no report was produced, a spec file that was installed is missing from the report (a
    truncated or stale report), a test died with the runner, or the app was no longer up
    afterwards (every later test then fails on a dead server and measures nothing)."""
    if report is None:
        return f"no parseable Playwright JSON report (exit {returncode})"
    if returncode not in _PW_NORMAL_EXITS:
        return f"playwright exited abnormally ({returncode})"
    results, detail = _flatten_pw_json(report)
    if not results:
        return "gate produced no test results"
    if len(detail) != len(results):
        # two tests with one id would overwrite each other's verdict
        seen, dup = set(), ""
        for d in detail:
            if d["test_id"] in seen:
                dup = d["test_id"]
                break
            seen.add(d["test_id"])
        return f"two tests share the id {dup!r}; their results cannot be told apart"
    reported = {tid.split("::", 1)[0] for tid in results}
    missing = sorted(expected_files - reported)
    if missing:
        return (f"report is missing {len(missing)} installed spec file(s), e.g. {missing[0]}"
                " — truncated or stale")
    crashed = [d["test_id"] for d in detail if _RUNNER_CRASH.search(d.get("failure") or "")]
    if crashed:
        return f"playwright worker crashed during {crashed[0]}"
    if not app_alive:
        return f"{_APP_DIED} after the run — it died mid-gate"
    return ""


def _installed_spec_files(e2e_dir: str) -> set[str]:
    specs = os.path.join(e2e_dir, "specs")
    return {f for f in os.listdir(specs) if f.endswith(".spec.ts")} if os.path.isdir(specs) else set()


def _app_alive(base_url: str) -> bool:
    try:
        with urllib.request.urlopen(base_url.rstrip("/") + "/actuator/health", timeout=10) as r:
            return r.status == 200
    except (urllib.error.URLError, OSError, ValueError):
        return False


def _gate_attempt(worktree: str, e2e_dir: str, cfg: dict, console: str,
                  attempt: int) -> tuple[dict | None, str, str]:
    """Serve the app, run the installed suite once, and judge whether the run is scoreable.
    Returns (report, problem, console); problem is "" for a scoreable run."""
    json_out = os.path.join(worktree, ".run", "pw-report.json")
    os.makedirs(os.path.dirname(json_out), exist_ok=True)
    # A report left by an earlier run must never be read as this run's: when Playwright crashed
    # before writing (cp58 of run 202610100208) the previous checkpoint's report was scored.
    with contextlib.suppress(FileNotFoundError):
        os.remove(json_out)
    expected = _installed_spec_files(e2e_dir)
    try:
        with serve(worktree, cfg) as app:
            env = os.environ.copy()
            env.update({"PORT": str(app.port), "BASE_URL": app.base_url,
                        "AUDIT_FILE": os.path.join(worktree, ".run", "audit.log"),
                        "PLAYWRIGHT_JSON_OUTPUT_NAME": json_out,
                        "RUN_DIR": os.path.join(worktree, ".run")})
            # --workers=1: every spec drives ONE shared app. Each test uses its own sheet id and
            # filters the audit file by it, so parallel workers are possible in principle; the
            # serial run keeps a failure attributable to one test and the app's load constant.
            cmd = ["npx", "playwright", "test", "--reporter=json", "--workers=1",
                   f"--output={os.path.join(worktree, '.run', 'pw-artifacts')}"]
            try:
                p = subprocess.run(cmd, cwd=e2e_dir, env=env, capture_output=True, text=True,
                                   timeout=(cfg.get("acceptance") or {}).get("test_timeout", 1800))
            except (FileNotFoundError, subprocess.TimeoutExpired, OSError) as e:
                return None, f"playwright failed to launch/timed out: {e}", \
                    console + f"\n[playwright launch/timeout] {e}"
            console += f"\n$ {' '.join(cmd)}  (attempt {attempt}, exit {p.returncode})\n" \
                + (p.stdout or "")[-20000:] + (p.stderr or "")[-4000:]
            alive = _app_alive(app.base_url)
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
        return None, f"{_SERVE_FAILED}: {e}", console + f"\n[serve] {e}"
    return report, gate_problem(p.returncode, report, expected, alive), console


def run_tests(worktree: str, checkpoint_k: int, cfg: dict) -> TestOutcome:
    """Build the app, serve it, run the Playwright specs present in e2e (the driver has
    installed the full cp01..cpK suite), parse + score. Assertions are UI + audit only."""
    # A build that could not launch or timed out says nothing about the code: retry it once, then
    # void the gate. A build that ran and failed is the code's: the app is broken.
    console = ""
    for attempt in (1, 2):
        ok, build_out = build(worktree, cfg)
        console += f"$ {cfg['app']['build_cmd']}  (attempt {attempt})\n{build_out}"
        if ok or not build_out.startswith(_BUILD_INFRA):
            break
    if not ok and build_out.startswith(_BUILD_INFRA):
        return TestOutcome(build_ok=False, gate_invalid=True, gate_attempts=2,
                           error=f"build could not run on either attempt:\n{build_out[-1600:]}",
                           build_output=build_out[-1600:], console=console)
    if not ok:
        return TestOutcome(build_ok=False, app_broken=True, error=f"build failed:\n{build_out[-1600:]}",
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

    # One clean retry for an INFRASTRUCTURE failure (app never ready, app died mid-run, a crashed
    # Playwright, an incomplete report). A genuine test failure on a healthy app is never retried —
    # that would let a real regression be re-rolled until it passes.
    # An app that never became ready, or died mid-run, on BOTH attempts is reproducible, so it is
    # the code under test, not the host: the app is broken (see TestOutcome.app_broken).
    problem = ""
    for attempt in (1, 2):
        report, problem, console = _gate_attempt(worktree, e2e_dir, cfg, console, attempt)
        if not problem:
            break
        console += f"\n[gate attempt {attempt}] {problem}"
    if problem and attempt == 2 and problem.startswith((_APP_DIED, _SERVE_FAILED)):
        broken = TestOutcome(build_ok=True, app_broken=True, gate_attempts=attempt,
                             error=f"{problem} on both attempts — the app under test is broken",
                             console=console)
        if report is not None:     # kept for the record; it is not scored
            broken.results, broken.detail = _flatten_pw_json(report)
        return broken
    if problem:
        return TestOutcome(build_ok=True, gate_invalid=True, gate_attempts=attempt,
                           error=problem, console=console)

    results, detail = _flatten_pw_json(report)
    cats = {d["test_id"]: d["category"] for d in detail}
    outcome = score_results(results, checkpoint_k, cats)
    outcome.detail = detail
    outcome.console = console
    outcome.gate_attempts = attempt
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
                           mutated_cps, results: dict[str, bool] | None = None,
                           replaced=(), reasons: dict[str, str] | None = None) -> int:
    """Regressions on the surface a mutative checkpoint did NOT intend to change: behaviour that
    worked at the last scored checkpoint and no longer does.

    Three kinds of lost pass are not that, and are left out:
    - a test ABSENT from this run whose checkpoint is in `mutates`: the updated copy dropped or
      renamed it (`retires:`), so its loss is intended;
    - a test in `replaced`: an updated copy kept its title but changed what it expects. Failing
      it on arrival means the checkpoint did not carry its new rule into that scenario, which is
      an unsatisfied replacement (count_unsatisfied_replacements), not broken old behaviour;
    - a failure whose reason is `infrastructure` (the connection or the runner failed).

    A test the copy carried forward UNCHANGED that now fails is still a regression, mutated or not.
    `results` is the current {test_id: passed} map; without it the old (over-forgiving) behaviour
    is kept so existing callers do not silently change meaning."""
    mut = {int(m) for m in (mutated_cps or ())}
    rep = set(replaced or ())
    reasons = reasons or {}
    n = 0
    for t in (prior_passing - now_passing):
        if t in rep or reasons.get(t) == RegressionReason.INFRASTRUCTURE.value:
            continue
        if test_checkpoint(t) not in mut:
            n += 1                              # not a mutated surface: always a regression
        elif results is not None and t in results:
            n += 1                              # ran under the updated copy and failed
    return n


def count_unsatisfied_replacements(prior_selected: set[str] | None, results: dict[str, bool],
                                   mutated_cps, replaced=()) -> int:
    """Replacement specs this mutative checkpoint shipped that FAIL ON ARRIVAL.

    A mutative checkpoint ships updated copies of the prior specs it revises. Those copies state
    what the prior behaviour must become — so the checkpoint has not done its job until they
    pass. They are invisible to every other measure: never having passed, such a test cannot be
    a regression; and because it carries the PRIOR checkpoint's basename it scores in the
    regression category rather than against the checkpoint's own request, so `func_p/func_t`
    still reports the checkpoint solved.

    cp49 is the case in point: it declares `mutates: [21, 47]`, ships an updated cp21 spec
    asserting tax in the invoice amount, and that spec fails from the moment it is installed
    ($1,000 against an expected $1,200) while cp49 reports func_p 1/1.

    Counted as: failing tests that are either newly present in this run and belong to a checkpoint
    this one mutates (a new title), or in `replaced` (a kept title whose expectations the copy
    changed; fixtures.replaced_tests). A new title needs the previous checkpoint's selected set;
    without it only `replaced` is counted."""
    mut = {int(m) for m in (mutated_cps or ())}
    rep = set(replaced or ())
    return sum(1 for t, ok in results.items()
               if not ok and (t in rep or (prior_selected is not None and t not in prior_selected
                                           and test_checkpoint(t) in mut)))


_ROW_FIELDS = ("total_selected", "strict_pass", "iso_pass", "core_pass", "core_p", "core_t",
               "error_p", "error_t", "func_p", "func_t", "regr_p", "regr_t",
               "normalized_change", "regressions", "true_regressions", "intended_regressions",
               "unsatisfied_replacement", "seed_contract_failures", "anchor_drift", "behaviour_loss",
               "seed_path", "infrastructure")


def outcome_row(outcome: "TestOutcome", prior_passing: set[str], mutated_cps=(),
                prior_selected: set[str] | None = None, replaced=()) -> dict:
    """Flatten a scored TestOutcome to the per-checkpoint correctness row (incl. Normalized
    Change + regressions + a reason breakdown). Called by the runner and by analyze, through
    Baseline, which supplies what has changed since the last scored checkpoint."""
    if outcome.gate_invalid or outcome.app_broken:
        return {"build_ok": outcome.build_ok, "gate_invalid": outcome.gate_invalid,
                "app_broken": outcome.app_broken, **{f: "" for f in _ROW_FIELDS}}
    mut = {int(m) for m in (mutated_cps or ())}
    rep = set(replaced or ())
    reason_counts = {r.value: 0 for r in RegressionReason}
    for tid, reason in outcome.reasons.items():
        # only count reasons for PRIOR-passing failures (regressions); current-checkpoint failures
        # are "not yet solved", and a changed copy failing on arrival is an unsatisfied replacement.
        # Every tid here RAN and FAILED, so `mutates` does not excuse it (see
        # count_true_regressions) — it gets its real reason. A genuinely intended loss is a
        # prior test the updated copy replaced, which is absent from `reasons` entirely.
        if tid in prior_passing and tid not in rep:
            reason_counts[reason] = reason_counts.get(reason, 0) + 1
    lost = prior_passing - outcome.passing
    intended = sum(1 for t in lost if t not in outcome.results and test_checkpoint(t) in mut)
    return {
        "build_ok": outcome.build_ok,
        "gate_invalid": False,
        "app_broken": False,
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
        "true_regressions": count_true_regressions(prior_passing, outcome.passing, mutated_cps,
                                                   outcome.results, rep, outcome.reasons),
        "intended_regressions": intended,
        "unsatisfied_replacement": count_unsatisfied_replacements(
            prior_selected, outcome.results, mutated_cps, rep),
        # Blank when there was no contract to check, so "not checked" never reads as "clean".
        "seed_contract_failures": ("" if outcome.seed_contract is None
                                   else len(outcome.seed_contract.get("failures") or [])),
        "anchor_drift": reason_counts.get(RegressionReason.ANCHOR_DRIFT.value, 0),
        "behaviour_loss": reason_counts.get(RegressionReason.BEHAVIOUR_LOSS.value, 0),
        "seed_path": reason_counts.get(RegressionReason.SEED_PATH.value, 0),
        "infrastructure": reason_counts.get(RegressionReason.INFRASTRUCTURE.value, 0),
    }


@dataclass
class Baseline:
    """What a checkpoint is scored against: the last SCORED checkpoint's results, plus every
    `mutates` and changed copy installed since then.

    A gate that is invalid or whose app is broken gives no per-test verdict, so it never becomes
    the baseline — but the copies it installed and the retirements it declared are still in the
    suite at the next scored checkpoint, so they are carried to it. Without that, a retirement at
    an unscored mutative checkpoint reads as a true regression at the next one. The live run,
    --resume and analyze all score through this one class, so they cannot drift apart."""
    passing: set[str] = field(default_factory=set)
    selected: set[str] | None = None
    mutates: set[int] = field(default_factory=set)
    replaced: set[str] = field(default_factory=set)

    def score(self, outcome: TestOutcome, mutates=(), replaced=()) -> dict:
        """The correctness row for this checkpoint; then advance (or carry) the baseline."""
        mut = self.mutates | {int(m) for m in (mutates or ())}
        rep = self.replaced | set(replaced or ())
        row = outcome_row(outcome, self.passing, sorted(mut), self.selected, rep)
        if outcome.gate_invalid or outcome.app_broken:
            self.mutates, self.replaced = mut, rep
        else:
            self.passing, self.selected = set(outcome.passing), set(outcome.results)
            self.mutates, self.replaced = set(), set()
        return row

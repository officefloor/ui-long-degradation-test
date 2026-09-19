"""Build + serve + acceptance-test gate and correctness scoring (UI arm).

STUB — signatures are fixed; bodies are TODO. See DESIGN.md §3, §5, §6.

How this differs from the REST arm's correctness.py (which it is signature-compatible
with, so a future shared core is a lift not a re-plumb):

  REST arm:  build (mvn) -> in-process MockMvc -> parse Surefire XML.
  UI arm:    build the front-end -> START the constant OfficeFloor server + a freshly
             SEEDED, DETERMINISTIC database -> SERVE the built front-end -> drive it
             with Playwright -> parse the Playwright/JUnit result map.

The correctness contract with the repo (DESIGN.md §3, §5):

  * Tests bind ONLY to `data-test-id` attributes — never CSS classes, DOM structure,
    tag nesting, or visible copy — so one suite validates the app however the stack is built.
  * One Playwright spec per checkpoint, `cpNN`, selectable so the gate can run only
    cp01..cpK at checkpoint K (the analog of the REST arm's `@Tag("cpNN")`).
  * `data-test-id` values are IMMUTABLE PUBLIC API once introduced (DESIGN.md §3):
    a prior anchor changing/vanishing is a real contract regression, not noise.

The two new UI-only moving parts (DESIGN.md §9) both live here: the served SUT
(`serve()`), and flake control (deterministic seed + strict awaiting on anchors).
"""
from __future__ import annotations

import contextlib
from dataclasses import dataclass, field
from enum import Enum

# --- regression reason classification (DESIGN.md §6) --------------------------


class RegressionReason(str, Enum):
    """WHY a prior-checkpoint test fails at checkpoint K.

    ANCHOR_DRIFT  element present + functional, but its data-test-id changed/removed
                  -> contract regression. COUNTS (it is the locality signal).
    BEHAVIOUR_LOSS the feature genuinely broke (element gone / wrong value / action
                  fails) -> classic regression. COUNTS.
    INTENDED      checkpoint K legitimately changed this prior behaviour and shipped a
                  replacement cpJ spec (the `mutates` discipline) -> excluded from
                  true_regressions.
    """

    ANCHOR_DRIFT = "anchor_drift"
    BEHAVIOUR_LOSS = "behaviour_loss"
    INTENDED = "intended"


@dataclass
class TestOutcome:
    """Signature-compatible with the REST arm's TestOutcome, plus `reasons`."""

    results: dict[str, bool] = field(default_factory=dict)      # test_id -> passed
    passing: set[str] = field(default_factory=set)
    regressions: int = 0
    true_regressions: int = 0
    reasons: dict[str, RegressionReason] = field(default_factory=dict)  # failed_id -> why
    build_ok: bool = False
    console: str = ""


# --- the served SUT (new in the UI arm; DESIGN.md §5.2, §9, §14) --------------


@dataclass
class AppHandle:
    """What serve() yields: how the running app is reached and torn down."""

    base_url: str                       # e.g. http://localhost:3000 — the ONLY thing Playwright uses
    port: int = 0


@contextlib.contextmanager
def serve(worktree: str, cfg: dict):
    """Bring the whole app up on one port and tear it down. There is ONE evolving app
    (cfg['app']) — a single Spring Boot jar (OfficeFloor plugin + in-memory H2 + static
    SPA), rebuilt each checkpoint, one JVM, embeddable under Landlock (DESIGN.md §14,
    docs/SUT_CONTRACT.md). Assumes build() has produced this checkpoint's jar.

    Steps (all TODO):
      1. Run cfg['app'].start_cmd with env PORT=cfg['app'].port. On boot Flyway migrates
         the EMPTY in-memory H2 up to this checkpoint's schema (DESIGN.md §5) and serves
         the SPA + API on PORT. Data is NOT seeded here — specs seed per-`beforeEach` via
         the /__test__ endpoint (DESIGN.md §9).
      2. wait_ready() on http://localhost:PORT (/actuator/health AND a known data-test-id
         anchor — strict awaiting is the flake guard, DESIGN.md §9).
      3. yield AppHandle(base_url=...); the caller runs Playwright against base_url only —
         asserting only through the UI (the testing-boundary invariant, DESIGN.md §14).
      4. on exit (always): cfg['app'].stop_cmd — kill the JVM, free PORT (in-mem H2 dies
         with it). Robust to a crashed prior run (kill by port as a backstop).
    """
    raise NotImplementedError("serve(): run the single evolving app (java -jar)")
    yield  # pragma: no cover  (documents the contextmanager shape)


def wait_ready(base_url: str, cfg: dict, timeout: int = 120) -> bool:
    """Poll until /actuator/health is up AND a known data-test-id anchor is present. TODO."""
    raise NotImplementedError


# --- gate seam (signature-compatible with the REST arm) -----------------------


def build(worktree: str, cfg: dict) -> tuple[bool, str]:
    """Run cfg['app'].build_cmd in `worktree` to compile the OfficeFloor backend + the
    front-end into one runnable jar (SPA baked into static/). -> (ok, console). TODO."""
    raise NotImplementedError


def run_tests(worktree: str, checkpoint_k: int, cfg: dict) -> TestOutcome:
    """Run cp01..cpK Playwright specs against the served app and score.

    Same seam and return type as the REST arm's run_tests. Inside: build(worktree, cfg),
    then `with serve(worktree, cfg) as app:` run the selected specs against `app.base_url`
    ONLY (each spec `beforeEach` reset+seeds via /__test__; assertions are UI-only — the
    testing-boundary invariant, DESIGN.md §14), parse results, then score_results().
    """
    raise NotImplementedError


def score_results(results: dict[str, bool], checkpoint_k: int) -> TestOutcome:
    """Classify results into current/regression and compute the counts. TODO."""
    raise NotImplementedError


def classify_failure(test_id: str, worktree: str, base_url: str) -> RegressionReason:
    """Decide ANCHOR_DRIFT vs BEHAVIOUR_LOSS for a failed prior test (DESIGN.md §6).

    Heuristic (TODO): the feature's expected element is still present & functional but
    its data-test-id is missing/renamed -> ANCHOR_DRIFT; otherwise BEHAVIOUR_LOSS.
    INTENDED is decided by the checkpoint's `mutates` list, not here.
    """
    raise NotImplementedError


# --- regression math (identical semantics to the REST arm) --------------------


def test_checkpoint(test_id: str) -> int | None:
    """`cp07_add_filter` -> 7. Parse the checkpoint index from a test id. TODO."""
    raise NotImplementedError


def count_regressions(prior_passing: set[str], now_passing: set[str]) -> int:
    """Prior tests that no longer pass. TODO."""
    raise NotImplementedError


def count_true_regressions(prior_passing: set[str], now_passing: set[str],
                           mutated_cps=()) -> int:
    """count_regressions minus failures in checkpoints this change intended to mutate."""
    raise NotImplementedError


def outcome_row(outcome: TestOutcome, prior_passing: set[str], mutated_cps=()) -> dict:
    """Flatten a TestOutcome into the per-checkpoint metrics row (adds reason counts)."""
    raise NotImplementedError

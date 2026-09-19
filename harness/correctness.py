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
    tag nesting, or visible copy — so one suite validates any candidate front-end.
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
class SutHandle:
    """What serve() yields: how the running SUT is reached and torn down."""

    base_url: str                       # e.g. http://localhost:3000 — the ONLY thing Playwright uses
    frontend_port: int = 0
    backend_url: str = ""


@contextlib.contextmanager
def serve(worktree: str, arm_cfg: dict, cfg: dict):
    """Bring the whole SUT up on a fixed port for one gate run, then tear it down.

    The start/stop/port contract is owned by the app repos, NOT the harness (DESIGN.md
    §14, docs/SUT_CONTRACT.md) — which is what keeps this oracle framework-agnostic.

    Steps (all TODO):
      1. HARNESS starts the CONSTANT OfficeFloor backend (cfg['backend'].start_cmd) and
         SEEDS a fresh, deterministic database (backend.seed_cmd) — per-checkpoint reset
         is the harness's job, never the front-end's (DESIGN.md §9). Wait for
         backend.health_url.
      2. Run the arm's START script (arm_cfg['start_cmd']) against `worktree`, passing
         env PORT=arm_cfg['port'] and BACKEND_URL=<the backend from step 1>. It builds
         if needed and publishes the built front-end on PORT.
      3. Wait for reachability on http://localhost:PORT (a health path AND a known
         data-test-id anchor — strict awaiting is the flake guard, DESIGN.md §9).
      4. yield SutHandle(base_url=...); the caller runs Playwright against base_url only.
      5. on exit (always): arm's STOP script (arm_cfg['stop_cmd']), then stop the backend
         and drop the DB. Idempotent — robust to a crashed prior run leaving stale
         processes/ports (kill by port, honour stop's non-zero exit).
    """
    raise NotImplementedError("serve(): seed backend + run arm start/stop on a fixed port")
    yield  # pragma: no cover  (documents the contextmanager shape)


def wait_ready(base_url: str, cfg: dict, timeout: int = 120) -> bool:
    """Poll until the SUT answers AND a known data-test-id anchor is present. TODO."""
    raise NotImplementedError


# --- gate seam (signature-compatible with the REST arm) -----------------------


def build(worktree: str, cfg: dict) -> tuple[bool, str]:
    """Build the candidate front-end. -> (ok, console). TODO."""
    raise NotImplementedError


def run_tests(worktree: str, checkpoint_k: int, arm_cfg: dict, cfg: dict) -> TestOutcome:
    """Run cp01..cpK Playwright specs against the served SUT and score.

    Same return type as the REST arm's run_tests (the gate seam); takes `arm_cfg` too
    because the UI start/stop/port differ per arm. Inside: `with serve(worktree, arm_cfg,
    cfg) as sut:` run the selected specs against `sut.base_url` ONLY (never the API/DB —
    the testing-boundary invariant, DESIGN.md §14), parse results, then score_results().
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

"""Driver for the UI long-degradation experiment.

STUB. Structurally parallel to the REST arm's run_experiment.py (the blind, two-commit-
per-checkpoint lifecycle) with the correctness oracle rewired from in-process MockMvc to
the build+serve+Playwright gate in correctness.py. See DESIGN.md §4, §5.

For each (arm, strategy, chain) it creates an isolated git worktree at the arm's base ref
and walks the ordered checkpoints. At each checkpoint k (1->N), in order:

  0. set_agent_view(): install ONLY cpK's own Playwright spec (+ shared test infra).
     Prior specs are removed from the sandbox AND withheld via Landlock so the agent
     physically cannot read them (blind view — DESIGN.md §4). The current source tree,
     with all prior features and their data-test-id anchors, is present as normal.
  1. run a FRESH headless agent (harness.agent.run_agent) with only cpK's request +
     the current code. No cross-checkpoint memory, isolated CLAUDE_CONFIG_DIR.
  2. commit the pure agent delta, then install the FULL cp01..cpK suite (the priors the
     agent never saw) and gate on correctness.run_tests -> build + serve seeded SUT +
     Playwright. Regressions (incl. the 3-way reason split) surface here.
  3. write the checkpoint's RAW capture (harness.capture): agent envelope + event
     stream, raw test-result map (+ reasons), pre-normalisation diff, SHAs. Never store
     derived numbers on the branch — analyze.py re-derives them.
  4. reset commit: normalise + set_agent_view for cp(K+1) (its own spec only), so the
     next checkpoint starts blind and each checkpoint is a clean two-commit boundary.

Arms (DESIGN.md §10): control SPA+global-store · additive template · server-driven HTMX;
optional `full` ceiling control (agent sees prior specs -> regressions ~0, on record).
Structural metrics are computed each checkpoint only to narrate the log; analyze.py is
the source of truth and recomputes from commits + capture.
"""
from __future__ import annotations

from . import agent, capture, correctness, landlock, metrics  # noqa: F401


class ChainStopped(Exception):
    pass


def phase_for(idx: int, n: int) -> str:
    """Bucket a checkpoint index into a phase label (early/mid/late). LIFT from REST arm."""
    raise NotImplementedError


def set_agent_view(wt: str, cfg: dict, cp: dict) -> None:
    """Install only this checkpoint's own spec; withhold all priors (blind). TODO.

    UI specifics vs the REST arm: the withheld/installed unit is a Playwright spec, not a
    JUnit class; extend landlock.default_allowlist so the confined agent can still reach
    node_modules / the build toolchain but not the withheld specs.
    """
    raise NotImplementedError


def install_measurement_suite(wt: str, cfg: dict, checkpoints: list[dict], k: int) -> None:
    """Install the full cp01..cpK spec suite for gating (never shown to the agent). TODO."""
    raise NotImplementedError


def run_chain(cfg: dict, arm: str, strategy: str, chain: int, run_id: str,
              work_root: str) -> None:
    """Walk the checkpoints for one arm/strategy/chain (the loop above). TODO."""
    raise NotImplementedError


def main() -> int:
    """CLI entry, mirroring the REST arm's run_experiment.main. TODO."""
    raise NotImplementedError


if __name__ == "__main__":
    raise SystemExit(main())

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
     the current code. No cross-checkpoint memory, isolated CLAUDE_CONFIG_DIR. The agent
     can RUN ITS TEST as it works via `acceptance.agent_test_cmd` (./e2e), which builds +
     brings the whole stack up via the constant launcher + runs its VISIBLE spec only,
     inside the Landlock sandbox (DESIGN.md §15). The launcher, test command and pinned
     files are read-only/pinned, so the agent can execute but not edit them.
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


# --- copy/sync + sandbox isolation (LIFT VERBATIM from the REST arm; DESIGN.md §14) ---
# These are generic (rsync/git-worktree, no Java/REST). They give Landlock something to
# confine and are how the harness copies the right specs in per checkpoint.


def make_worktree(arm_cfg: dict, work_root: str, arm: str, strategy: str,
                  chain: int, run_id: str) -> tuple[str, str]:
    """Branch evolve/<run_id>/<strategy>/<arm>/chain<n> from the untouched external
    `arm_cfg['repo']` @ base_ref into work_root. LIFT from the REST arm verbatim."""
    raise NotImplementedError


def mirror_source(src: str, dst: str, extra_excludes: tuple = ()) -> None:
    """rsync -a --delete src -> dst, excluding .git / build output / results, so the
    agent's sandbox is a history-less exact copy. LIFT from the REST arm verbatim."""
    raise NotImplementedError


def _prepare_agent_sandbox(wt: str, sandbox: str, cfg: dict, cp: dict,
                           checkpoints: list[dict]) -> None:
    """mirror_source(wt, sandbox) then install the blind agent view (this checkpoint's
    own spec only) into the sandbox acceptance dest, and make the agent test command
    (acceptance.agent_test_cmd) available so the agent can run its spec against the whole
    stack (DESIGN.md §15). LIFT/adapt from the REST arm."""
    raise NotImplementedError


def restore_pinned(wt: str, sandbox: str, cfg: dict, cp: dict) -> list[str]:
    """Before the gate, restore pinned files, the constant launcher, and the agent test
    command to authored, and the visible spec(s) to authored (the REST arm's
    detect_agent_tamper, extended to the launcher + test command; DESIGN.md §15). Returns
    the basenames the agent had changed, recorded as `*_touched`. The gate then re-derives
    everything from the pristine launcher + full cp01..cpK suite. LIFT/adapt. TODO."""
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

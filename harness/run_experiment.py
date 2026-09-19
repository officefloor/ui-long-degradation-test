"""Driver for the UI long-degradation experiment.

STUB. Structurally parallel to the REST arm's run_experiment.py (the blind, two-commit-
per-checkpoint lifecycle) with the correctness oracle rewired from in-process MockMvc to
the build+serve+Playwright gate in correctness.py. See DESIGN.md §4, §5.

For each (condition, chain) it creates an isolated git worktree of the ONE evolving app
(cfg['app']) at base_ref and walks the ordered checkpoints, growing the app from empty. At
each checkpoint k (1->N), in order:

  0. set_agent_view(): install ONLY cpK's own Playwright spec (+ shared test infra).
     Prior specs are removed from the sandbox AND withheld via Landlock so the agent
     physically cannot read them (blind view — DESIGN.md §4). The current source tree
     (all prior schema/server/front-end and their data-testid anchors) is present.
  1. run a FRESH headless agent (harness.agent.run_agent) with cpK's plain-ENGLISH change
     request + cpK's own spec + the current code. No cross-checkpoint memory, isolated
     CLAUDE_CONFIG_DIR. It authors the FULL-STACK change (migration + OfficeFloor server +
     front-end) and can RUN ITS TEST via `acceptance.agent_test_cmd` (./e2e) — build +
     app.start + its VISIBLE spec only — inside the Landlock sandbox (DESIGN.md §15). The
     start/stop scripts, ./e2e and pinned files are pinned, so the agent runs but can't
     edit them; the app code it writes (incl. the /__test__ endpoint) is its delta.
  2. commit the pure agent delta, then install the FULL cp01..cpK suite (the priors the
     agent never saw) and gate on correctness.run_tests -> build + serve the evolving app
     (Flyway migrates empty H2 up on boot) + Playwright (specs beforeEach reset+seed via
     /__test__). Regressions (incl. the 4-way reason split, DESIGN.md §6) surface here.
  3. write the checkpoint's RAW capture (harness.capture): agent envelope + event
     stream, raw test-result map (+ reasons), pre-normalisation diff, SHAs. Never store
     derived numbers on the branch — analyze.py re-derives them.
  4. reset commit: normalise + set_agent_view for cp(K+1) (its own spec only), so the
     next checkpoint starts blind and each checkpoint is a clean two-commit boundary.

Conditions (DESIGN.md §10): `gated` (the OfficeHQ loop) primary; optional `just-solve`
ungated control to quantify what ImpactGate buys; optional `full` ceiling reference
(agent sees prior specs -> regressions ~0, on record). Erosion is measured per layer
(front-end TS + backend Java, §8). Structural metrics are computed each checkpoint only to
narrate the log; analyze.py is the source of truth and recomputes from commits + capture.
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


def make_worktree(app_cfg: dict, work_root: str, condition: str,
                  chain: int, run_id: str) -> tuple[str, str]:
    """Branch evolve/<run_id>/<condition>/chain<n> from the untouched ONE app repo
    (`app_cfg['repo']` @ base_ref) into work_root. LIFT/adapt from the REST arm (which
    branched a per-arm repo; here there is a single evolving app). TODO."""
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


def run_chain(cfg: dict, condition: str, chain: int, run_id: str,
              work_root: str) -> None:
    """Walk the checkpoints for one condition/chain, growing the app (the loop above). TODO."""
    raise NotImplementedError


def main() -> int:
    """CLI entry, mirroring the REST arm's run_experiment.main. TODO."""
    raise NotImplementedError


if __name__ == "__main__":
    raise SystemExit(main())

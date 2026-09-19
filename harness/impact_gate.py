"""ImpactGate integration for the UI arm (STUB; used only by the `impact_gated` arm).

A thin wrapper around the standalone `impact-gate` CLI (lizard-only), signature-
compatible with the REST arm's impact_gate.py. See DESIGN.md §8, §10.

WHAT CARRIES OVER: the score/grade/is_blocked/refactor_prompt shape is generic — after
the agent implements a checkpoint, stage the production diff and call
`impact-gate score --mode staged --curve`; a grade at/above the BLOCK percentile fails
the gate; on a fail, discard and run a refactor turn seeded with the flagged files +
cost-driver units + the change spec, then re-attempt.

WHAT MUST CHANGE FOR UI:
  * SEED DISTRIBUTION. The REST arm grades against ImpactGate's shipped JAVA seed
    distribution. TS composites are not comparable to it (different container semantics —
    file scope vs class; DESIGN.md §8). Build a TS/front-end seed distribution before the
    grades mean anything.
  * the gate operates on the same file-scope-container composite metrics.impact_stats
    reports, so gate and analysis stay consistent (as in the REST arm).
"""
from __future__ import annotations


class ImpactGateError(RuntimeError):
    pass


def score(cmd: list[str], repo: str, block_percentile: float, warn_percentile: float,
          timeout: int = 300) -> dict:
    """Run the impact-gate CLI over the staged diff, return its JSON. TODO."""
    raise NotImplementedError


def is_blocked(ig: dict, block_percentile: float) -> bool:
    """Whether the change grades at/above the block percentile. TODO."""
    raise NotImplementedError


def refactor_prompt(template: str, cp: dict, ig: dict, block_percentile: float) -> str:
    """Seed a refactor turn with the flagged files + drivers + the change spec. TODO."""
    raise NotImplementedError

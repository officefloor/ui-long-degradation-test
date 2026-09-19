"""ui-long-degradation-test harness.

The UI arm of the long-degradation study. See DESIGN.md for the full design.

Module map (DESIGN.md §13 — repository & code-sharing strategy):

  VENDORED verbatim from spring-petclinic-rest-long-degradation-test @ 63d5281
  (generic spine — a copy, not a shared library; extract to a shared core at N=3):
    agent.py      headless `claude -p`, fresh session per checkpoint, config isolation
    landlock.py   filesystem confinement that makes the blind view airtight
    capture.py    raw-capture-not-derive layer  (ADJUST: tool_versions / result shape)

  REWRITTEN for UI (kept signature-compatible with the REST arm at the seams so a
  future shared-core extraction is a lift, not a re-plumb):
    correctness.py  build + serve + Playwright oracle; three-way regression classifier
    metrics.py      Lizard/ImpactGate over TS (file-scope container) + boundary-violation
    run_experiment.py  driver: blind two-commit checkpoint walk, rewired to the UI oracle
    analyze.py      slopes / bootstrap CIs / EvoScore / Zero-Regression Rate (lift stats)
    impact_gate.py  impact-gate CLI wrapper (needs a TS seed distribution)
"""

import os as _os
import re as _re

_UNEXPANDED = _re.compile(r"\$\{[^}]+\}|\$[A-Za-z_][A-Za-z0-9_]*")


def expand_path(value, key: str = "path"):
    """Expand ``~`` and ``${VARS}`` in a config path, failing LOUDLY on an undefined
    variable rather than leaving a literal ``${HOME}`` (as os.path.expandvars would)."""
    if value is None:
        return None
    expanded = _os.path.expandvars(_os.path.expanduser(value))
    if _UNEXPANDED.search(expanded):
        raise SystemExit(
            f"config {key!r}: undefined environment variable in {value!r} "
            f"(expanded to {expanded!r}). Set the variable, or use an absolute path.")
    return expanded

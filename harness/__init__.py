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
import subprocess as _subprocess

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


def stack_repo(value, key: str = "--repo"):
    """Resolve the STACK repo (one ~/officehq-<frontend>-<backend>) given on the COMMAND LINE.

    Deliberately never read from config.yaml: one harness drives many stacks, and a path sitting
    in the config makes every run silently about whichever stack was edited into it last. Passing
    it per run keeps "which stack was this?" answerable from the command, the log and the commit.

    Returns (abs_path, origin_url) — origin is the `origin` remote of THAT repo (None when it has
    none), recorded so a chain branch can be tied back to the remote it belongs to.
    """
    if not value:
        raise SystemExit(f"{key} is required: the stack repo to run against "
                         f"(e.g. ~/officehq-react-officefloor).")
    path = _os.path.realpath(expand_path(value, key))
    if not _os.path.isdir(path):
        raise SystemExit(f"{key}: {path!r} is not a directory.")
    inside = _subprocess.run(["git", "-C", path, "rev-parse", "--is-inside-work-tree"],
                             capture_output=True, text=True)
    if inside.returncode != 0 or inside.stdout.strip() != "true":
        raise SystemExit(f"{key}: {path!r} is not a git work tree.")
    got = _subprocess.run(["git", "-C", path, "remote", "get-url", "origin"],
                          capture_output=True, text=True)
    origin = got.stdout.strip() if got.returncode == 0 else None
    return path, (origin or None)


def stack_label(repo: str, origin: str | None, base_ref: str = "") -> str:
    """One-line stack identity for the logs: which code is under test, and where it lives."""
    at = f" @ {base_ref}" if base_ref else ""
    return f"{_os.path.basename(repo)}{at}  (origin: {origin or 'NONE'})"

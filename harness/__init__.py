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


def stack_layer_options(repo: str, base_ref: str) -> dict:
    """The stack's raw `layers` block from stack.yaml at base_ref, verbatim ({} when absent).

    `stack_layers` turns `root`+`ext` into source globs; this hands back everything else the
    stack declares about a layer — `jscpd_format`, `handler_pattern`, `node_roots`,
    `function_package_glob`, `config_globs` — which the deep metrics need and which are
    properties of the technology, not of the harness.
    """
    import yaml as _yaml

    got = _subprocess.run(["git", "-C", repo, "show", f"{base_ref}:stack.yaml"],
                          capture_output=True, text=True)
    if got.returncode != 0:
        return {}
    try:
        return ((_yaml.safe_load(got.stdout) or {}).get("layers") or {})
    except _yaml.YAMLError:
        return {}


def stack_layers(repo: str, base_ref: str, fallback: dict | None = None,
                 expected: tuple = ()):
    """The layer SOURCE ROOTS, declared by the STACK not the harness.

    A layer's root+extensions are a property of the technology, so they belong with the stack the
    same way `--repo` does (see `stack_repo`): a harness-level glob like
    `src/main/frontend/**/*.{ts,tsx}` silently matches NOTHING for a stack whose front-end is
    templates or `.svelte`, and every `frontend_*` column then reads 0/None — a number that looks
    like an answer. So each base repo declares its own, read from `stack.yaml` AT base_ref:

        layers:
          frontend: { root: src/main/frontend, ext: [ts, tsx] }
          backend:  { root: src/main/java,     ext: [java] }

    `ext` says which files ARE that layer's source; it does not promise they are parseable. A
    layer whose files Lizard cannot parse (HTML/templates) still gets every git-derived metric,
    and its parser-derived columns come back empty rather than zero.

    Returns (source_globs, provenance). Falls back to the harness config's `app.source_globs`
    when the stack declares none, so a stack predating stack.yaml keeps working.
    """
    import yaml as _yaml

    got = _subprocess.run(["git", "-C", repo, "show", f"{base_ref}:stack.yaml"],
                          capture_output=True, text=True)
    if got.returncode != 0:
        if not fallback:
            raise SystemExit(
                f"{_os.path.basename(repo)} declares no stack.yaml at {base_ref} and the config "
                f"has no app.source_globs fallback — the layer roots are unknown.")
        return dict(fallback), f"config app.source_globs (no stack.yaml at {base_ref})"

    try:
        declared = ((_yaml.safe_load(got.stdout) or {}).get("layers") or {})
    except _yaml.YAMLError as e:
        raise SystemExit(f"{_os.path.basename(repo)}:{base_ref}:stack.yaml is not valid YAML: {e}")
    if not declared:
        raise SystemExit(f"{_os.path.basename(repo)}:{base_ref}:stack.yaml declares no `layers`.")

    if expected:
        # A stack declares a SUBSET of the known layer names: a headless API has no front end, and
        # requiring one made "bring your own architecture" false for exactly the stacks most
        # likely to arrive. An UNKNOWN name is still fatal — the column prefixes, the plotted
        # series and shared_surfaces are all keyed by these names, so a layer called `api` would
        # compute metrics that nothing reports. A subset simply produces fewer columns.
        unknown = sorted(set(declared) - set(expected))
        if unknown:
            raise SystemExit(
                f"{_os.path.basename(repo)}:{base_ref}:stack.yaml declares layer(s) {unknown}, "
                f"which the harness does not report on (known: {list(expected)}) — their metrics "
                f"would be computed and then dropped. Rename them, or declare a subset of the "
                f"known names.")

    globs: dict[str, list[str]] = {}
    for layer, spec in declared.items():
        spec = spec or {}
        root = str(spec.get("root") or "").strip().strip("/")
        exts = [str(e).lstrip(".") for e in (spec.get("ext") or []) if str(e).strip()]
        if not root or not exts:
            raise SystemExit(f"{_os.path.basename(repo)}:{base_ref}:stack.yaml layer {layer!r} "
                             f"needs both `root` and a non-empty `ext` list.")
        listed = _subprocess.run(["git", "-C", repo, "ls-tree", base_ref, "--", root + "/"],
                                 capture_output=True, text=True)
        if listed.returncode != 0 or not listed.stdout.strip():
            raise SystemExit(f"{_os.path.basename(repo)}:{base_ref}:stack.yaml layer {layer!r}: "
                             f"root {root!r} does not exist at {base_ref}.")
        inner = exts[0] if len(exts) == 1 else "{" + ",".join(sorted(exts)) + "}"
        globs[layer] = [f"{root}/**/*.{inner}"]
    return globs, f"{_os.path.basename(repo)}:{base_ref}:stack.yaml"


# Ported from the REST arm (spring-petclinic-rest-long-degradation-test) so the vendored
# `cumulative_impact` / `class_shape` modules run here unchanged.
def git_out(cwd: str, args: list[str], check: bool = False, timeout: int = 60) -> str:
    """Run ``git -C <cwd> <args>`` and return stdout (unstripped). Swallows errors
    (returns "") unless ``check`` is set, in which case a non-zero exit raises. Used
    by the derive/analyze side, which needs graceful degradation on a missing repo;
    run_experiment keeps its own stricter ``git`` (raises by default, strips)."""
    try:
        proc = _subprocess.run(["git", "-C", cwd, *args],
                              capture_output=True, text=True, timeout=timeout)
    except (FileNotFoundError, _subprocess.TimeoutExpired, OSError):
        if check:
            raise
        return ""
    if check and proc.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} failed: {proc.stderr.strip()}")
    return proc.stdout

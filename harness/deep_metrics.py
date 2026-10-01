"""Deep structural metrics, ported from the REST arm.

Source: `~/spring-petclinic-rest-long-degradation-test/harness/metrics.py` @ 7ea7402. They are
kept in their own module (rather than merged into `harness.metrics`) so the provenance stays
visible and a later shared-core extraction is a move, not a re-derivation — the UI arm's module
map already flags that extraction as due at N=3 arms.

Everything here is a pure function of a worktree's files, a git ref pair, or a `metrics.functions`
list, so it is re-derivable over an OLD run's committed checkpoints by `analyze`. Four groups:

  DUPLICATION (`dup_*`, `clone_metrics`)  Mechanical clone structure from ONE jscpd report:
      quantity (Bellon / SonarQube family), locality/dispersion (Kapser & Godfrey), and a
      change-scoped slice. This is the counter-hypothesis instrument for an ADDITIVE
      architecture: adding a file instead of editing one is only an improvement if the new file
      is not a copy. No other metric in this harness would see that.

  VERBOSITY (`verbosity`)  Share of lines that are either a jscpd clone or an ast-grep
      wasteful-pattern match, over LOC. Shares the gate's single PMD + jscpd runs.

  SHAPE (`wmc_stats`, `hotspot_stats`, `blast_radius_detail`, `function_package_stats`)
      Richer variants of what `harness.metrics` already reports.

  JAVA/BACKEND-ONLY (`call_adjacency`, `node_closure_stats`, `entry_handler_stats`,
      `handler_wmc_stats`, `handler_scoped_erosion`, `yaml_loc`, `_is_prod_java`)
      These parse Java identifiers and Spring/OfficeFloor wiring. They apply to this arm's
      BACKEND layer unchanged; for the front-end layer they return blanks, never zeros, which is
      the harness's standing rule — "did not run" must never read as "found nothing".

Adaptations from the source, each marked `UI-ARM:` at its site:
  * `_jscpd_report` took a hardcoded `--format java`; the format is now a parameter, because one
    harness drives many stacks and the layer's language is declared by the stack (`stack.yaml`).
  * `_clone_layer` keyed off the literal path segment `petclinic`; it now takes the layer root and
    keys off the first segment beneath it, which for the front end yields cross-FEATURE
    duplication — the meaningful locality split for a feature/slot architecture.
"""
from __future__ import annotations

import glob
import json
import os
import re
import statistics
import subprocess
from collections import Counter, defaultdict
from typing import Optional

from .metrics import (CC_THRESHOLD, _changed_ranges, _git, _overlapping_functions,
                      erosion_detail, functions)
from .quality_gate import _pmd_lines, _smell_lines, pmd_lines_from_report

_CLONES_UNSET = object()   # sentinel: "caller did not pre-supply clones" (None means jscpd failed)
_CALL_RE = re.compile(r"(?:\.\s*|\b)([a-z]\w*)\s*\(")
_JAVA_KEYWORDS = {"if", "for", "while", "switch", "catch", "return", "new", "super",
                  "this", "synchronized", "try", "do", "else", "assert", "throw"}


CLONE_COLS = [
    "dup_lines", "dup_density", "dup_tokens", "dup_pairs", "dup_blocks", "dup_files",
    "dup_classes", "dup_largest_lines", "dup_mean_block_lines",
    "dup_same_file_pairs", "dup_same_package_pairs", "dup_cross_package_pairs",
    "dup_cross_area_pairs", "dup_cross_file_ratio",
    "dup_evolved_lines", "dup_evolved_density",
]


def _java_files(root: str, globs: list[str]) -> list[str]:
    files: list[str] = []
    for g in globs:
        files += glob.glob(os.path.join(root, g), recursive=True)
    return sorted({f for f in files if f.endswith(".java") and os.path.isfile(f)})


def _fn_label(fn: dict) -> str:
    """Short `File.java::method` label for a function record (basename only)."""
    return f"{fn['file'].split('/')[-1]}::{fn['name'].split('::')[-1]}"


def total_java_loc(fns: list[dict]) -> int:
    return sum(f["nloc"] for f in fns)


def source_loc(worktree: str, match) -> int:
    """Non-blank PHYSICAL lines of the layer's source files.

    UI-ARM: the source used `total_java_loc` (the sum of FUNCTION nloc) as the denominator for
    `dup_density` and `verbosity`. jscpd and ast-grep report whole-file physical lines — imports,
    class and field declarations, JSX markup — so the numerator counts lines the denominator
    excludes, and the ratio can exceed 1. It did: a backend checkpoint here reported
    dup_density 0.9991 and dup_evolved_density 1.0399, which is not a finding, it is a unit error.

    Densities computed against this are therefore NOT comparable with the REST arm's
    `dup_density`/`verbosity` columns until that arm makes the same correction. The clone and
    smell COUNTS (dup_lines, dup_pairs, dup_blocks, ...) are unaffected and remain comparable.
    """
    from .metrics import _list_files
    total = 0
    for path in _list_files(worktree, match):
        try:
            with open(os.path.join(worktree, path), errors="ignore") as fh:
                total += sum(1 for line in fh if line.strip())
        except OSError:
            continue
    return total


def hotspot_stats(fns: list[dict]) -> dict:
    """God-method indicator: the single highest-cyclomatic-complexity function in
    the given set, named so you can see WHERE complexity concentrates. Pass the
    dynamically-scoped subsystem (production-Java functions in files changed since
    base) so a new class the agent creates is included and can't hide."""
    if not fns:
        return {"hotspot_nloc": None, "hotspot_cc": None, "hotspot_fn": None}
    worst = max(fns, key=lambda f: (f["cc"], f["nloc"]))
    return {
        "hotspot_nloc": worst["nloc"],
        "hotspot_cc": worst["cc"],
        "hotspot_fn": _fn_label(worst),
    }


def function_package_stats(root: str, pkg_glob: Optional[str]) -> dict:
    """OfficeFloor's composed-function package: count and size distribution.

    The healthy growth signal: count rises while avg/max stay flat.
    """
    if not pkg_glob:
        return {"fn_count": None, "fn_nloc_avg": None, "fn_nloc_max": None, "fn_cc_max": None}
    fns = functions(root, [pkg_glob])
    if not fns:
        return {"fn_count": 0, "fn_nloc_avg": 0, "fn_nloc_max": 0, "fn_cc_max": 0}
    nlocs = [f["nloc"] for f in fns]
    return {
        "fn_count": len(fns),
        "fn_nloc_avg": round(sum(nlocs) / len(nlocs), 2),
        "fn_nloc_max": max(nlocs),
        "fn_cc_max": max(f["cc"] for f in fns),
    }


def _jscpd_report(root: str, src_dirs: list[str], jscpd_bin: str,
                  fmt: str = "java") -> Optional[dict]:
    """Run jscpd ONCE over src_dirs and return the parsed report, or None if jscpd is
    absent / produced nothing. Both the Verbosity clone half and the standalone
    duplication metrics (`clone_metrics`) derive from this single run, so jscpd is never
    launched twice per checkpoint.

    UI-ARM: `fmt` was hardcoded "java". One harness drives many stacks, so the layer's
    language comes from the stack (`stack.yaml -> layers.<layer>.jscpd_format`) and this
    is called once per layer. `out_dir` is per-format so the two runs cannot overwrite
    each other's report."""
    out_dir = os.path.join(root, ".jscpd-report-" + re.sub(r"[^\w]+", "_", fmt))
    cmd = [jscpd_bin, "--mode", "strict", "--reporters", "json",
           "--silent", "--output", out_dir, "--format", fmt] + \
          [os.path.join(root, d) for d in src_dirs]
    try:
        subprocess.run(cmd, cwd=root, capture_output=True, text=True, timeout=600)
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return None
    report = os.path.join(out_dir, "jscpd-report.json")
    if not os.path.isfile(report):
        return None
    try:
        with open(report) as fh:
            return json.load(fh)
    except (json.JSONDecodeError, OSError):
        return None


def _jscpd_line(fobj: dict, base: str):
    # jscpd emits base ('start'/'end') as an int line number and baseLoc as
    # {line, column, position}; prefer the Loc.line, fall back to the int.
    loc = fobj.get(base + "Loc")
    if isinstance(loc, dict) and loc.get("line") is not None:
        return loc["line"]
    v = fobj.get(base)
    return v if isinstance(v, int) else None


def _clone_lines_from_report(data: dict, root: str) -> set[tuple[str, int]]:
    """{(path, line)} covered by any duplicate fragment. The path key is
    relpath(name, root), kept EXACTLY as the original _clone_lines_jscpd produced it so
    Verbosity's clone/pattern union is byte-for-byte unchanged."""
    lines: set[tuple[str, int]] = set()
    for dup in data.get("duplicates", []):
        for side in ("firstFile", "secondFile"):
            f = dup.get(side, {})
            name = f.get("name")
            start = _jscpd_line(f, "start")
            end = _jscpd_line(f, "end")
            if name and start and end:
                rel = os.path.relpath(name, root)
                for ln in range(int(start), int(end) + 1):
                    lines.add((rel, ln))
    return lines


def _clone_lines_jscpd(root: str, src_dirs: list[str], jscpd_bin: str,
                       fmt: str = "java") -> Optional[set[tuple[str, int]]]:
    data = _jscpd_report(root, src_dirs, jscpd_bin, fmt)
    return None if data is None else _clone_lines_from_report(data, root)


def _clone_pkg(name: str) -> str:
    return os.path.dirname(name)


def _clone_area(name: str, depth: int = 2) -> str:
    """The sub-area of the layer a clone fragment sits in.

    UI-ARM: the source keyed off the literal path segment `petclinic` and took the next
    one, which is meaningless outside that repo. jscpd `name`s are already relative to the
    scanned dir (= the layer root), so the area is simply the first `depth` segments of the
    file's directory. For the front end that is `features/clients` vs `features/projects`,
    making the cross-area count CROSS-FEATURE duplication — the real smell for a
    feature/slot architecture, where two features duplicating logic should instead have
    shared a `ui/` primitive. For a flat Java package it collapses to one area, so the
    cross-area count is 0, which is the truth rather than an artefact.

    Reported as `dup_cross_area_pairs`; the REST arm calls its (differently defined)
    column `dup_cross_layer_pairs`. Deliberately NOT the same name, since it is not the
    same measurement.
    """
    parts = os.path.dirname(name).split("/")
    return "/".join(parts[:depth])


def clone_metrics(data: Optional[dict], loc: int, evolved_loc: int,
                  evolved_names: set[str]) -> dict:
    """Mechanical clone-structure metrics from one jscpd report. Quantity (Bellon /
    SonarQube family), locality/dispersion (Kapser & Godfrey), and a change-scoped slice.
    Blank on no report, matching Verbosity's graceful degradation. `evolved_names` are the
    src-dir-relative paths of files changed since the pre-feature base (jscpd `name` space)."""
    if data is None:
        return {k: "" for k in CLONE_COLS}
    parent: dict = {}
    def find(x):
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent[parent[x]]; x = parent[x]
        return x
    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    lines: set[tuple[str, int]] = set()   # (name, line) — clean identity for scoping
    frags: set = set()
    files: set = set()
    spanlens: list[int] = []
    tokens = 0
    same_file = same_pkg = cross_pkg = cross_area = 0
    for d in data.get("duplicates", []):
        f1o, f2o = d.get("firstFile", {}), d.get("secondFile", {})
        n1, n2 = f1o.get("name"), f2o.get("name")
        s1, e1 = _jscpd_line(f1o, "start"), _jscpd_line(f1o, "end")
        s2, e2 = _jscpd_line(f2o, "start"), _jscpd_line(f2o, "end")
        if not (n1 and n2 and s1 and e1 and s2 and e2):
            continue
        tokens += int(d.get("tokens") or 0)
        for (n, s, e) in ((n1, int(s1), int(e1)), (n2, int(s2), int(e2))):
            frags.add((n, s, e))
            files.add(n)
            spanlens.append(e - s + 1)
            for ln in range(s, e + 1):
                lines.add((n, ln))
        union((n1, int(s1), int(e1)), (n2, int(s2), int(e2)))
        if n1 == n2:
            same_file += 1
        elif _clone_pkg(n1) == _clone_pkg(n2):
            same_pkg += 1
        else:
            cross_pkg += 1
            if _clone_area(n1) != _clone_area(n2):
                cross_area += 1
    pairs = same_file + same_pkg + cross_pkg
    n_lines = len(lines)
    ev_lines = sum(1 for (n, _l) in lines if n in evolved_names)
    return {
        "dup_lines": n_lines,
        "dup_density": round(n_lines / loc, 4) if loc > 0 else "",
        "dup_tokens": tokens,
        "dup_pairs": pairs,
        "dup_blocks": len(frags),
        "dup_files": len(files),
        "dup_classes": len({find(f) for f in frags}),
        "dup_largest_lines": max(spanlens) if spanlens else 0,
        "dup_mean_block_lines": round(sum(spanlens) / len(spanlens), 1) if spanlens else 0,
        "dup_same_file_pairs": same_file,
        "dup_same_package_pairs": same_pkg,
        "dup_cross_package_pairs": cross_pkg,
        "dup_cross_area_pairs": cross_area,
        "dup_cross_file_ratio": round((pairs - same_file) / pairs, 4) if pairs else "",
        "dup_evolved_lines": ev_lines,
        "dup_evolved_density": round(ev_lines / evolved_loc, 4) if evolved_loc > 0 else "",
    }


def _pattern_lines_astgrep(root: str, src_dirs: list[str], sg_bin: str,
                           rules_dir: str) -> Optional[set[tuple[str, int]]]:
    """{(repo-relative path, 1-based line)} for every ast-grep rule match, or None if
    ast-grep did not run.

    Delegates to quality_gate._smell_lines rather than re-implementing the call. This
    used to invoke `scan -r <rules_dir>`, but the pinned ast-grep takes `-r` as a single
    rule FILE: given a directory it wrote "Is a directory" to stderr, left stdout empty,
    and this parsed that as zero matches. Combined with verbosity()'s fallback to
    whichever stack DID produce output, the smell half of Verbosity silently contributed
    nothing while looking like a clean scan. A directory of rules needs a generated
    project config (`ruleDirs:`) and `scan -c`, which is what the gate already does
    correctly -- and it also fixes the 0-based -> 1-based line conversion missing here,
    which would have shifted every smell line by one even once the call worked.
    """
    from .quality_gate import _smell_lines
    smells = _smell_lines(root, src_dirs, sg_bin, rules_dir)
    return None if smells is None else set(smells)


def _pattern_lines(root: str, src_dirs: list[str], tools: dict,
                   pmd_report: Optional[dict] = None,
                   pmd_keep: Optional[set[str]] = None
                   ) -> Optional[set[tuple[str, int]]]:
    """Smell lines from whichever detector this run configures: PMD (Java rules that can
    fire on these arms) or the legacy ast-grep. Same selection rule as quality_gate.review,
    so the metric and the gate always see the same findings.

    `pmd_report` is an already-run merged PMD report (see `compute_all`); `pmd_keep`
    restricts it to the wasteful ruleset's own rules. Without them PMD is run here, as
    before -- that is the path `quality_gate.review` and every other caller still take."""
    # UI-ARM: also require `pmd_rules`. This arm configures a PMD BINARY (for the backend
    # cohesion/cognitive metrics) but ships no wasteful ruleset — its smell stack is ast-grep,
    # per layer. Branching on the binary alone returned None here and silently dropped the smell
    # half of Verbosity while looking like a clean scan.
    if tools.get("pmd") and tools.get("pmd_rules"):
        from .quality_gate import _pmd_lines, pmd_lines_from_report
        if pmd_report is not None:
            return set(pmd_lines_from_report(pmd_report, root, pmd_keep))
        found = _pmd_lines(root, src_dirs, tools["pmd"], tools.get("pmd_rules", ""))
        return None if found is None else set(found)
    return _pattern_lines_astgrep(root, src_dirs, tools.get("astgrep", "sg"),
                                  tools.get("astgrep_rules", ""))


def verbosity(root: str, src_dirs: list[str], loc: int, tools: dict,
              pmd_report: Optional[dict] = None,
              pmd_keep: Optional[set[str]] = None,
              clones=_CLONES_UNSET) -> tuple[float, dict]:
    if loc <= 0:
        return float("nan"), {"reason": "no LOC"}
    # `clones` may be pre-computed by the caller from a shared jscpd report (so jscpd runs
    # once per checkpoint). Only run jscpd here when the caller did not supply it.
    if clones is _CLONES_UNSET:
        clones = _clone_lines_jscpd(root, src_dirs, tools.get("jscpd", "jscpd"),
                                    tools.get("jscpd_format", "java"))
    patterns = _pattern_lines(root, src_dirs, tools, pmd_report, pmd_keep)
    if clones is None and patterns is None:
        return float("nan"), {"reason": "neither jscpd nor ast-grep produced output"}
    union: set[tuple[str, int]] = set()
    if clones:
        union |= clones
    if patterns:
        union |= patterns
    return len(union) / loc, {
        "clone_lines": len(clones) if clones is not None else None,
        "pattern_lines": len(patterns) if patterns is not None else None,
        "union_lines": len(union),
    }


def _is_prod_java(path: str) -> bool:
    """Production Java only: excludes tests (so the injected acceptance suite and
    the app's own unit tests never count as blast radius)."""
    return path.endswith(".java") and "test" not in path.lower()


def _funcs_touched(worktree: str, cur_ref: str, path: str,
                   ranges: list[tuple[int, int]]) -> int:
    """How many functions in `path`@cur_ref overlap any changed line range."""
    return len(_overlapping_functions(worktree, cur_ref, path, ranges))


def blast_radius_detail(worktree: str, prev_ref: str, cur_ref: str = "HEAD",
                        match=None) -> dict:
    """Isolation metric: how much PRE-EXISTING code a checkpoint disturbs.

    A new rule can land two ways. It can be inserted into functions that already
    exist (high blast radius, the change reaches into working code), or it can be
    added as a new wired unit (low blast radius, existing code is left alone).

    UI-ARM: `match` is the layer's own path predicate (`metrics._matcher`), so this runs
    per layer instead of over production Java only. Falls back to the original
    `_is_prod_java` when no matcher is given.

    Returns, over the layer's source only:
      existing_fns_modified - functions in already-present files whose body the
                              diff touched (the blast radius proper),
      files_modified        - already-present files the diff touched,
      files_created         - new production files added to hold the rule,
      churn_added/removed   - production line churn.
    """
    try:
        ns = _git(worktree, ["diff", "--name-status", "-M", prev_ref, cur_ref])
        numstat = _git(worktree, ["diff", "--numstat", prev_ref, cur_ref])
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return {"existing_fns_modified": None, "files_modified": None,
                "files_created": None, "churn_added": None, "churn_removed": None}
    modified, created = [], []
    for line in ns.splitlines():
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        status, path = parts[0], parts[-1]
        if not (match(path) if match else _is_prod_java(path)):
            continue
        (created if status.startswith("A") else modified).append(path)  # M/R -> modified
    fns = sum(_funcs_touched(worktree, cur_ref, f,
                             _changed_ranges(worktree, prev_ref, cur_ref, f))
              for f in modified)
    added = removed = 0
    for line in numstat.splitlines():
        p = line.split("\t")
        if len(p) == 3 and (match(p[2]) if match else _is_prod_java(p[2])) and p[0] != "-":
            added += int(p[0])
            removed += int(p[1])
    return {
        "existing_fns_modified": fns,
        "files_modified": len(modified),
        "files_created": len(created),
        "churn_added": added,
        "churn_removed": removed,
    }


def wmc_stats(fns: list[dict]) -> dict:
    """God-class indicator (Chidamber-Kemerer WMC = sum of method CC per class).

    Groups functions by file (one top-level class per Java file) and reports the
    single class with the highest WMC in the given set. This catches what erosion
    (a per-METHOD threshold) cannot: a controller that stays tidy method-by-method
    while accumulating twenty rules' worth of methods becomes a god class, and its
    WMC climbs even though no single method ever crosses CC 10. Pass the touched-
    file subsystem so a new class the agent creates is included."""
    if not fns:
        return {"wmc_max": None, "wmc_max_class": None,
                "wmc_max_methods": None, "wmc_max_nloc": None}
    by_file: dict[str, list[dict]] = defaultdict(list)
    for f in fns:
        by_file[f["file"]].append(f)
    worst_file = max(by_file, key=lambda p: sum(g["cc"] for g in by_file[p]))
    grp = by_file[worst_file]
    return {
        "wmc_max": sum(g["cc"] for g in grp),
        "wmc_max_class": worst_file.split("/")[-1],
        "wmc_max_methods": len(grp),
        "wmc_max_nloc": sum(g["nloc"] for g in grp),
    }


def entry_handler_stats(fns: list[dict], pattern: Optional[str]) -> dict:
    """CC/NLOC over time of the ONE function the create endpoint routes through.

    `pattern` is an arm-specific regex matched against '<file>::<name>', because
    the entry point is architecture-specific: Spring routes POST /api/owners
    through a single handler (addOwner) that can bloat, whereas OfficeFloor routes
    it through a pipeline, so we track its designated create-entry function, which
    is expected to stay flat as new rules attach as new functions. A null/absent
    pattern (or no match) yields blanks."""
    if not pattern:
        return {"entry_cc": None, "entry_nloc": None, "entry_fn": None}
    rx = re.compile(pattern)
    hits = [f for f in fns if rx.search(f"{f['file']}::{f['name']}")]
    if not hits:
        return {"entry_cc": None, "entry_nloc": None, "entry_fn": None}
    h = max(hits, key=lambda f: (f["cc"], f["nloc"]))
    return {
        "entry_cc": h["cc"],
        "entry_nloc": h["nloc"],
        "entry_fn": _fn_label(h),
    }


def _handler_files(fns: list[dict], pattern: Optional[str]) -> set[str]:
    """File(s) holding the entry handler's own class, for the class-scoped handler
    metrics. The entry_handler convention is 'Class::method', and the CLASS is what
    is wanted: every method that accreted onto the handler's class, not just the one
    entry method. Matching the file is also robust to lizard's checkpoint-to-
    checkpoint variation in whether it names a function 'Class::method' or bare
    'method', which would otherwise blank the metric exactly on the checkpoints
    where the handler bloats most. Empty if the pattern is absent or unmatched (e.g.
    before the class exists)."""
    if not pattern:
        return set()
    m = re.match(r"([A-Za-z_]\w*)::", pattern)
    if m:
        stem = m.group(1) + ".java"
        files = {f["file"] for f in fns if f["file"].split("/")[-1] == stem}
        if files:
            return files
    rx = re.compile(pattern)   # pattern not in Class::method form, or class absent
    return {f["file"] for f in fns if rx.search(f"{f['file']}::{f['name']}")}


def handler_wmc_stats(fns: list[dict], pattern: Optional[str]) -> dict:
    """WMC of the entry handler's OWN class: the role-comparable god-class number.

    `wmc_max` reports the heaviest class *whatever it is*, and the two arms answer
    with different kinds of class. On full-202608102319 OfficeFloor's heaviest is
    the Owner ENTITY (roughly 60 accessors at CC 1, WMC ~67) while Spring's is
    usually the CONTROLLER (~32 methods averaging CC 3+, WMC ~142). Same metric,
    different meaning: one is data, the other is decisions. Comparing them across
    arms compares roles, not architectures.

    This pins the measurement to the same ROLE in both arms -- the class the create
    endpoint routes through -- so the god-class claim can be made on a like-for-like
    number, exactly as `erosion_handler` does for erosion. Blank when the pattern is
    null or the class is not present yet."""
    blank = {"wmc_handler": None, "wmc_handler_class": None,
             "wmc_handler_methods": None, "wmc_handler_nloc": None}
    files = _handler_files(fns, pattern)
    if not files:
        return dict(blank)
    grp = [f for f in fns if f["file"] in files]
    if not grp:
        return dict(blank)
    return {
        "wmc_handler": sum(g["cc"] for g in grp),
        "wmc_handler_class": ", ".join(sorted(p.split("/")[-1] for p in files)),
        "wmc_handler_methods": len(grp),
        "wmc_handler_nloc": sum(g["nloc"] for g in grp),
    }


def _call_index(worktree: str, fns: list[dict]) -> tuple[dict, dict]:
    """JAVA/BACKEND ONLY (`.java` stem = class, Java keyword list).

    (class, method) -> record and method -> [records], each record carrying the set of
    names it calls. Class comes from the FILE (one top-level class per Java file), which
    also absorbs lizard's variation between 'Class::method' and bare 'method' naming."""
    by_key: dict[tuple[str, str], dict] = {}
    by_name: dict[str, list[dict]] = defaultdict(list)
    src: dict[str, list[str]] = {}
    for f in fns:
        cls = f["file"].split("/")[-1].removesuffix(".java")
        meth = f["name"].split("::")[-1]
        f["_cls"], f["_meth"] = cls, meth
        by_key[(cls, meth)] = f
        by_name[meth].append(f)
        path = os.path.join(worktree, f["file"])
        if path not in src:
            try:
                src[path] = open(path, encoding="utf-8", errors="replace").read().splitlines()
            except OSError:
                src[path] = []
        body = "\n".join(src[path][f["start"] - 1:f["end"]])
        f["_calls"] = {m for m in _CALL_RE.findall(body) if m not in _JAVA_KEYWORDS}
    return by_key, by_name


def call_adjacency(by_key: dict, by_name: dict) -> dict:
    """Resolved call edges: (class, method) -> set of callee (class, method).

    THE single definition of how a Java call is resolved in this harness, extracted
    so the closure walk (`_closure`) and the placement metrics (indirection depth,
    propagation cost) cannot drift apart on it.

    Resolution is CONSERVATIVE -- a lower bound. A call resolves only when it names
    a method of the same class, or a method name that exists in exactly one class
    project-wide. Ambiguous names (`getName`) and everything outside the project
    (JDK, Spring Data repositories, generated MapStruct impls) resolve to nothing.
    Symmetric across arms, so both are undercounted the same way. An upper bound
    that follows every same-named method was checked off-line and agrees on every
    between-arm comparison.
    """
    adj: dict[tuple[str, str], set[tuple[str, str]]] = {}
    for f in by_key.values():
        key = (f["_cls"], f["_meth"])
        out: set[tuple[str, str]] = set()
        for name in f["_calls"]:
            same = by_key.get((f["_cls"], name))
            if same:
                cands = [same]
            elif name in by_name and len({h["_cls"] for h in by_name[name]}) == 1:
                cands = by_name[name]
            else:
                continue          # ambiguous or external -> not followed
            for c in cands:
                out.add((c["_cls"], c["_meth"]))
        adj[key] = out
    return adj


def _closure(roots: list[dict], by_key: dict, by_name: dict,
             adj: Optional[dict] = None) -> set[tuple[str, str]]:
    """Methods transitively reachable from `roots` (see `call_adjacency` for the
    resolution rule, which this shares so the two can never diverge)."""
    if adj is None:
        adj = call_adjacency(by_key, by_name)
    seen: set[tuple[str, str]] = set()
    queue = [(r["_cls"], r["_meth"]) for r in roots]
    while queue:
        key = queue.pop()
        if key in seen:
            continue
        seen.add(key)
        for nxt in adj.get(key, ()):
            if nxt not in seen:
                queue.append(nxt)
    return seen


def _node_roots(worktree: str, by_key: dict, arm_cfg: dict) -> list[dict]:
    """The handling nodes for this arm's create endpoint.

    Deliberately asymmetric, because the architectures are: OfficeFloor DECLARES its
    pipeline, so each wired step is a node (`node_roots.wiring_file` + `node_method`);
    Spring has no per-rule node -- the rules are interleaved inside one handler -- so its
    single node is the `entry_handler` function. That asymmetry is the phenomenon being
    measured, not a distortion of it: an arm only gets many nodes by actually having
    separable rules. Any arm can opt in by declaring a wiring file."""
    nr = arm_cfg.get("node_roots") or {}
    # UI-ARM: the source read ONE declarative wiring file. This arm wires one YAML file per
    # endpoint (officefloor/rest/api/<path>.<METHOD>.yml), so `wiring_glob` accepts a glob and
    # every matching file contributes its nodes. `wiring_file` is still honoured.
    patterns = [p for p in (nr.get("wiring_glob"), nr.get("wiring_file")) if p]
    if patterns:
        paths: list[str] = []
        for pat in patterns:
            paths += sorted(glob.glob(os.path.join(worktree, pat), recursive=True))
        rx = re.compile(nr.get("class_regex", r"class:\s*([\w.]+)"))
        method = nr.get("node_method", "service")
        roots, seen_cls = [], set()
        for path in paths:
            if not os.path.isfile(path):
                continue
            text = open(path, encoding="utf-8", errors="replace").read()
            for cls in dict.fromkeys(rx.findall(text)):       # ordered, de-duplicated
                short = cls.split(".")[-1]
                if short in seen_cls:
                    continue
                rec = by_key.get((short, method))
                if rec:
                    seen_cls.add(short)
                    roots.append(rec)
        if roots:
            return roots
    pattern = arm_cfg.get("entry_handler")
    if not pattern:
        return []
    rx = re.compile(pattern)
    hits = [f for f in by_key.values() if rx.search(f"{f['file']}::{f['name']}")]
    return [max(hits, key=lambda f: (f["cc"], f["nloc"]))] if hits else []


def node_closure_stats(worktree: str, fns: list[dict], arm_cfg: dict,
                       index: Optional[tuple[dict, dict]] = None) -> dict:
    """Per-node comprehension load, and how much of it each node owns.

    `node_cc_median` is the headline: the complexity reachable from a typical node, i.e.
    what a developer loads to change one rule. `node_exclusive_share` is cohesion --
    the fraction of all node-reachable CC that is reachable from exactly ONE node, so a
    pipeline of thin wrappers over a shared blob scores low while genuinely separable
    rules score high. `node_path_cc` is the union across nodes: the whole handling path,
    which is the number the 'you just relocated it downstream' objection asks for."""
    blank = {"node_count": None, "node_cc_median": None, "node_cc_mean": None,
             "node_cc_p90": None, "node_cc_max": None, "node_methods_median": None,
             "node_exclusive_share": None, "node_path_cc": None, "node_path_methods": None}
    if not fns:
        return dict(blank)
    by_key, by_name = index if index else _call_index(worktree, fns)
    roots = _node_roots(worktree, by_key, arm_cfg)
    if not roots:
        return dict(blank)
    per = [_closure([r], by_key, by_name) for r in roots]
    cc_of = lambda keys: sum(by_key[k]["cc"] for k in keys if k in by_key)
    ccs = sorted(cc_of(s) for s in per)
    reach = Counter(k for s in per for k in s)          # how many nodes reach each method
    total = sum(ccs)
    exclusive = sum(cc_of({k for k in s if reach[k] == 1}) for s in per)
    union = set().union(*per)
    # Exclusivity is only meaningful with something to be exclusive AGAINST. With one
    # node it is trivially 1.0, which in an arm-vs-arm table would read as "Spring is
    # perfectly cohesive" when it means "Spring has no separable rules to share
    # between". Blank it instead.
    excl_share = (round(exclusive / total, 4) if total and len(per) > 1 else None)
    return {
        "node_count": len(per),
        "node_cc_median": round(statistics.median(ccs), 2),
        "node_cc_mean": round(statistics.mean(ccs), 2),
        "node_cc_p90": ccs[int(0.9 * (len(ccs) - 1))],
        "node_cc_max": max(ccs),
        "node_methods_median": round(statistics.median(len(s) for s in per), 2),
        "node_exclusive_share": excl_share,
        "node_path_cc": cc_of(union),
        "node_path_methods": len(union),
    }


def handler_scoped_erosion(fns: list[dict], pattern: Optional[str],
                           cc_threshold: int = CC_THRESHOLD) -> dict:
    """Erosion (Eq.3) restricted to the entry handler's OWN class file(s).

    Whole-app and touched-file erosion are both dominated by architecture-neutral
    leaf algorithms (soundex, phone/E.164 formatting, duplicate detection) that
    BOTH arms implement and that carry irreducible branching wherever they land, so
    they swamp the phenomenon this experiment is about: does the endpoint's handler
    surface itself erode? This scopes erosion to the file(s) containing the matched
    entry-handler function — the controller class for Spring (where addOwner and its
    sibling helpers concentrate) and BuildOwner for OfficeFloor (expected to stay
    flat as rules attach as separate wired functions). Because it is class-scoped it
    excludes the shared leaf-algorithm classes for both arms, isolating the concentration
    signal that `entry_cc`/`wmc_max` already show. A null/absent pattern (or no
    match — e.g. before the handler exists) yields blanks."""
    blank = {"erosion_handler": None, "erosion_handler_high_mass": None,
             "erosion_handler_total_mass": None, "erosion_handler_hot_fns": None,
             "erosion_handler_class": None, "erosion_handler_nfns": None}
    files = _handler_files(fns, pattern)   # identical class scoping to handler_wmc_stats
    if not files:
        return dict(blank)
    ed = erosion_detail([f for f in fns if f["file"] in files], cc_threshold)
    return {
        "erosion_handler": ed["erosion"],
        "erosion_handler_high_mass": ed["high_mass"],
        "erosion_handler_total_mass": ed["total_mass"],
        "erosion_handler_hot_fns": ed["over_threshold"],
        "erosion_handler_class": ", ".join(sorted(p.split("/")[-1] for p in files)),
        "erosion_handler_nfns": ed["n_functions"],
    }


def yaml_loc(root: str, globs: list[str]) -> int:
    """Non-blank, non-comment YAML lines under `globs` (reported separately from
    Java LOC — never mixed into the erosion/verbosity denominators)."""
    total = 0
    for g in globs or []:
        for path in glob.glob(os.path.join(root, g), recursive=True):
            if path.endswith((".yml", ".yaml")) and os.path.isfile(path):
                with open(path, errors="ignore") as fh:
                    total += sum(1 for line in fh
                                 if line.strip() and not line.strip().startswith("#"))
    return total

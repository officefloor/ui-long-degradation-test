"""Structural metrics for the UI arm — PER LAYER, computed from the checkpoint commits.

Erosion is SlopCodeBench's (arXiv:2603.24755):
  mass(f) = CC(f) * sqrt(SLOC(f))                              (Eq. 2)
  Erosion = sum_{CC(f)>10} mass(f) / sum_f mass(f)            (Eq. 3)
Impact is the ImpactGate-style blast-radius composite over the checkpoint's diff
(files_changed x sum max(WMC_other,1) x CC x Δlines), rename-aware.

Everything is computed TWICE — once for the front-end (TypeScript, `source_globs.frontend`)
and once for the backend (Java, `source_globs.backend`) — and reported as SEPARATE
`frontend_*` / `backend_*` columns (DESIGN.md §8). The two are never summed or compared to
each other: front-end components are free functions so their cohesion container is the FILE,
while backend methods are class-qualified (`Class::method`); the erosion ratio is comparable
within a layer across checkpoints, not across layers.

Two co-metrics are format-neutral and need NO declared list, so they compare across stacks:
`hot_surface` DISCOVERS the shared surface (which files the run keeps reopening, and how much of
all mutation lands in the worst few), and `reedit_line_stats` measures how much settled code a
checkpoint replaced, and how old it was, from git alone — no parser, so a layer Lizard cannot read
still gets it. `boundary_violations` stays as a CONTRACT check (did the checkpoint touch a file the
stack declares frozen?), not an erosion measure: it can only see surfaces someone listed up front,
and last run it declared `router/**` while the churn went into the feature pages.

Raw numbers only (Lizard + git) — no dependency on the impact-gate CLI or a TS seed
distribution (those are for the deferred `gated` condition's blocking grade, not these
trajectory numbers).
"""
from __future__ import annotations

import math
import os
import re
import subprocess
from collections import defaultdict
from typing import Callable, Optional

import lizard

from . import placement

CC_THRESHOLD = 10
IMPACT_RENAME_JACCARD = 0.6
LAYERS = ("frontend", "backend")


# --- git helpers --------------------------------------------------------------


def _git(worktree: str, args: list[str], timeout: int = 120) -> str:
    return subprocess.run(["git", "-C", worktree, *args],
                          capture_output=True, text=True, timeout=timeout).stdout


# --- glob matching (repo-relative; handles `dir/**/*.{ts,tsx}` brace globs) ----


def _glob_to_regex(glob: str) -> re.Pattern:
    """A repo-relative glob (supporting `**`, `*`, and one `{a,b}` alternation) -> regex."""
    # expand a single {a,b,c} alternation
    m = re.search(r"\{([^}]*)\}", glob)
    alts = [glob.replace(m.group(0), opt) for opt in m.group(1).split(",")] if m else [glob]
    parts = []
    for g in alts:
        rx = ""
        i = 0
        while i < len(g):
            if g[i:i + 3] == "**/":
                rx += "(?:.*/)?"; i += 3
            elif g[i:i + 2] == "**":
                rx += ".*"; i += 2
            elif g[i] == "*":
                rx += "[^/]*"; i += 1
            elif g[i] == "?":
                rx += "[^/]"; i += 1
            else:
                rx += re.escape(g[i]); i += 1
        parts.append(rx)
    return re.compile("^(?:" + "|".join(parts) + ")$")


def _matcher(globs: list[str], exclude_tests: bool = True) -> Callable[[str], bool]:
    """Predicate over repo-relative paths matching any glob (test/spec files dropped)."""
    pats = [_glob_to_regex(g) for g in (globs or [])]

    def is_test(p: str) -> bool:
        low = p.lower()
        return (".spec." in low or ".test." in low or "/test/" in low
                or low.endswith("tests.java") or low.endswith("test.java"))

    def match(path: str) -> bool:
        if exclude_tests and is_test(path):
            return False
        return any(p.match(path) for p in pats)

    return match


def _list_files(root: str, match: Callable[[str], bool]) -> list[str]:
    """Repo-relative paths under root that satisfy `match` (walks the tree; skips .git,
    node_modules, target, build output)."""
    skip = {".git", "node_modules", "target", "build", "node", ".run", "dist"}
    out: list[str] = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in skip]
        for fn in filenames:
            rel = os.path.relpath(os.path.join(dirpath, fn), root)
            if match(rel):
                out.append(rel)
    return sorted(out)


# --- per-function parse (Lizard) ----------------------------------------------


def _container(name: str) -> str:
    """`Owner::addOwner` -> `Owner`; a free function/component -> `` (file scope)."""
    return name.rpartition("::")[0] if "::" in name else ""


def functions(root: str, globs: list[str]) -> list[dict]:
    """Per-function CC/SLOC/container across a layer's source globs (Lizard)."""
    match = _matcher(globs)
    out: list[dict] = []
    for rel in _list_files(root, match):
        path = os.path.join(root, rel)
        try:
            analysis = lizard.analyze_file(path)
        except Exception:
            continue
        for fn in analysis.function_list:
            out.append({
                "file": rel, "name": fn.name, "container": _container(fn.name),
                "cc": int(fn.cyclomatic_complexity), "nloc": int(fn.nloc),
                "start": int(fn.start_line), "end": int(fn.end_line),
            })
    return out


def _mass(fn: dict) -> float:
    return fn["cc"] * math.sqrt(max(fn["nloc"], 1))


def erosion(fns: list[dict], cc_threshold: int = CC_THRESHOLD) -> float:
    total = sum(_mass(f) for f in fns)
    if total <= 0:
        return 0.0
    return sum(_mass(f) for f in fns if f["cc"] > cc_threshold) / total


def erosion_detail(fns: list[dict], cc_threshold: int = CC_THRESHOLD) -> dict:
    total = high = 0.0
    over = 0
    for f in fns:
        m = _mass(f)
        total += m
        if f["cc"] > cc_threshold:
            high += m
            over += 1
    return {"erosion": round(high / total, 4) if total > 0 else 0.0,
            "high_mass": round(high, 2), "total_mass": round(total, 2),
            "over_threshold": over, "n_functions": len(fns)}


def container_stats(fns: list[dict]) -> dict:
    """WMC per cohesion container (class for Java, file for TS): the worst and median
    container complexity — where complexity concentrates."""
    wmc: dict[str, int] = defaultdict(int)
    for f in fns:
        key = f["container"] or f["file"]      # file scope for free functions/components
        wmc[key] += f["cc"]
    if not wmc:
        return {"n_containers": 0, "wmc_max": 0, "wmc_max_name": None, "wmc_median": 0.0}
    vals = sorted(wmc.values())
    worst = max(wmc.items(), key=lambda kv: kv[1])
    mid = vals[len(vals) // 2] if len(vals) % 2 else (vals[len(vals) // 2 - 1] + vals[len(vals) // 2]) / 2
    return {"n_containers": len(wmc), "wmc_max": worst[1], "wmc_max_name": worst[0],
            "wmc_median": round(float(mid), 2)}


def hotspot(fns: list[dict]) -> dict:
    if not fns:
        return {"hotspot_cc": 0, "hotspot_nloc": 0, "hotspot_fn": None}
    w = max(fns, key=lambda f: (f["cc"], f["nloc"]))
    return {"hotspot_cc": w["cc"], "hotspot_nloc": w["nloc"],
            "hotspot_fn": f"{w['file'].split('/')[-1]}::{w['name'].split('::')[-1]}"}


# --- diff-based blast radius / impact -----------------------------------------


def _parse_blob(worktree: str, ref: str, path: str) -> dict:
    """name -> {cc,nloc,s,e,body} for functions in path@ref (body = stripped line set)."""
    try:
        code = _git(worktree, ["show", f"{ref}:{path}"])
        fl = lizard.analyze_file.analyze_source_code(path, code).function_list
    except Exception:
        return {}
    L = code.splitlines()
    return {f.name: {"cc": int(f.cyclomatic_complexity), "nloc": int(f.nloc),
                     "s": f.start_line, "e": f.end_line,
                     "body": frozenset(s.strip() for s in L[f.start_line - 1:f.end_line] if s.strip())}
            for f in fl}


def _changed_ranges(worktree: str, prev_ref: str, cur_ref: str, path: str) -> list[tuple[int, int]]:
    txt = _git(worktree, ["diff", "-U0", prev_ref, cur_ref, "--", path])
    ranges = []
    for m in re.finditer(r"^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@", txt, re.M):
        a = int(m.group(1)); b = int(m.group(2)) if m.group(2) else 1
        ranges.append((a, a + max(b, 1) - 1))
    return ranges


def _line_overlap(s: int, e: int, ranges: list[tuple[int, int]]) -> int:
    return sum(max(0, min(e, b) - max(s, a) + 1) for a, b in ranges)


def _jaccard(a: frozenset, b: frozenset) -> float:
    return len(a & b) / len(a | b) if a and b else 0.0


def blast_radius(worktree: str, prev_ref: str, cur_ref: str, match: Callable[[str], bool]) -> dict:
    """Change size (added/removed lines, files touched) restricted to the layer."""
    try:
        names = _git(worktree, ["diff", "--name-only", prev_ref, cur_ref]).splitlines()
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return {"diff_files": None, "diff_added": None, "diff_removed": None}
    files = [f for f in names if f.strip() and match(f.strip())]
    added = removed = 0
    for f in files:
        st = _git(worktree, ["diff", "--numstat", prev_ref, cur_ref, "--", f]).split()
        if len(st) >= 2 and st[0].isdigit():
            added += int(st[0]); removed += int(st[1]) if st[1].isdigit() else 0
    return {"diff_files": len(files), "diff_added": added, "diff_removed": removed}


def impact_stats(worktree: str, prev_ref: str, cur_ref: str,
                 match: Callable[[str], bool], rename_j: float = IMPACT_RENAME_JACCARD) -> dict:
    """ImpactGate composite over the layer's diff (rename-aware). New code into existing
    containers / mutations of existing functions cost WMC_other x CC x Δlines; the whole
    commit is scaled by files_changed (spread penalty)."""
    blank = {"impact_composite": None, "impact_mutation": None, "impact_addition": None,
             "impact_files_changed": None, "impact_new_files": None,
             "impact_new_fns": None, "impact_mut_fns": None, "impact_renames": None}
    try:
        ns = _git(worktree, ["diff", "--name-status", "-M", "-C", prev_ref, cur_ref])
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return dict(blank)
    new_files, mod_files, allf = [], [], set()
    for line in ns.splitlines():
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        status, path = parts[0], parts[-1]
        if not match(path):
            continue
        allf.add(path)
        (new_files if status.startswith("A") else mod_files).append(path)
    files_changed = len(allf)
    mutation = addition = 0.0
    n_new = n_mut = n_ren = 0
    for path in new_files:
        for f in _parse_blob(worktree, cur_ref, path).values():
            addition += 1 * f["cc"] * max(1, f["nloc"]); n_new += 1
    for path in mod_files:
        ranges = _changed_ranges(worktree, prev_ref, cur_ref, path)
        if not ranges:
            continue
        cur = _parse_blob(worktree, cur_ref, path)
        prev = _parse_blob(worktree, prev_ref, path)
        wmc_prev = sum(v["cc"] for v in prev.values())
        disappeared = [n for n in prev if n not in cur]
        for name, f in cur.items():
            d = _line_overlap(f["s"], f["e"], ranges)
            if d == 0:
                continue
            if name in prev:
                mutation += max(wmc_prev - prev[name]["cc"], 1) * f["cc"] * max(1, d); n_mut += 1
            else:
                best = max(disappeared, key=lambda dn: _jaccard(f["body"], prev[dn]["body"]),
                           default=None)
                if best is not None and _jaccard(f["body"], prev[best]["body"]) >= rename_j:
                    mutation += max(wmc_prev - prev[best]["cc"], 1) * f["cc"] * max(1, d); n_ren += 1
                else:
                    addition += max(wmc_prev, 1) * f["cc"] * max(1, d); n_new += 1
    return {"impact_mutation": round(mutation * files_changed, 2),
            "impact_addition": round(addition * files_changed, 2),
            "impact_composite": round((mutation + addition) * files_changed, 2),
            "impact_files_changed": files_changed, "impact_new_files": len(new_files),
            "impact_new_fns": n_new, "impact_mut_fns": n_mut, "impact_renames": n_ren}


def boundary_violations(worktree: str, prev_ref: str, cur_ref: str, cfg: dict) -> dict:
    """Format-neutral co-metric: changed files matching each layer's shared_surfaces globs.
    A purely-additive change (new files only) scores 0 (DESIGN.md §8)."""
    shared = (cfg.get("app") or {}).get("shared_surfaces") or {}
    # Only the layers this stack actually declares: a backend-only stack must not be given empty
    # frontend_* columns, which would read as "measured and found nothing".
    present = [l for l in LAYERS if l in ((cfg.get("app") or {}).get("source_globs") or {})] or list(LAYERS)
    try:
        names = [f for f in _git(worktree, ["diff", "--name-only", prev_ref, cur_ref]).splitlines() if f.strip()]
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return {f"{lyr}_boundary": None for lyr in present}
    out = {}
    for lyr in present:
        match = _matcher(shared.get(lyr) or [], exclude_tests=False)
        hits = [f for f in names if match(f)]
        out[f"{lyr}_boundary"] = len(hits)
        out[f"{lyr}_boundary_files"] = ";".join(hits)
    return out


# --- temporal coupling (re-edit) + change spread (git) ------------------------


def _overlapping_functions(worktree: str, ref: str, path: str,
                           ranges: list[tuple[int, int]]) -> list[dict]:
    """Functions in path@ref whose line span overlaps any changed range."""
    return [f for f in _parse_blob(worktree, ref, path).values()
            if _line_overlap(f["s"], f["e"], ranges) > 0]


def _blame_line_commits(worktree: str, ref: str, path: str) -> dict[int, str]:
    """line number -> commit sha that last touched it, as of `ref`."""
    out = _git(worktree, ["blame", "--line-porcelain", ref, "--", path], timeout=120)
    m: dict[int, str] = {}
    for line in out.splitlines():
        mt = re.match(r"^([0-9a-f]{40}) \d+ (\d+)", line)
        if mt:
            m[int(mt.group(2))] = mt.group(1)
    return m


def reedit_stats(worktree: str, prev_ref: str, cur_ref: str,
                 match: Callable[[str], bool]) -> dict:
    """Temporal coupling: of the body lines in functions THIS checkpoint edits, what fraction
    were authored by an EARLIER commit (not this checkpoint)? High => new rules keep piling
    into functions earlier rules grew; low/None => the checkpoint added NEW units instead of
    reopening accumulated ones. Whole edited-function bodies are counted (not just changed
    lines) so a one-line insertion into a large shared function still registers."""
    try:
        ns = _git(worktree, ["diff", "--name-status", "-M", prev_ref, cur_ref])
        cur_sha = _git(worktree, ["rev-parse", cur_ref]).strip()
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return {"reedit_body_lines": None, "reedit_prior_lines": None, "reedit_rate": None}
    modified = [p.split("\t")[-1] for p in ns.splitlines()
                if len(p.split("\t")) >= 2 and not p.split("\t")[0].startswith("A")
                and match(p.split("\t")[-1])]
    body_total = prior = 0
    for f in modified:
        ranges = _changed_ranges(worktree, prev_ref, cur_ref, f)
        for fn in _overlapping_functions(worktree, cur_ref, f, ranges):
            blame = _blame_line_commits(worktree, cur_ref, f)
            for ln in range(fn["s"], fn["e"] + 1):
                sha = blame.get(ln)
                if not sha:
                    continue
                body_total += 1
                if sha != cur_sha:
                    prior += 1
    rate = (prior / body_total) if body_total else None
    return {"reedit_body_lines": body_total, "reedit_prior_lines": prior,
            "reedit_rate": (round(rate, 4) if rate is not None else None)}


def change_spread(worktree: str, prev_ref: str, cur_ref: str,
                  match: Callable[[str], bool]) -> dict:
    """Architectural reach: distinct source directories the layer's diff touches."""
    try:
        names = _git(worktree, ["diff", "--name-only", prev_ref, cur_ref])
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return {"dirs_touched": None}
    pkgs = {os.path.dirname(f) for f in names.splitlines() if f.strip() and match(f.strip())}
    return {"dirs_touched": len(pkgs)}


def _prev_changed_ranges(worktree: str, prev_ref: str, cur_ref: str,
                         path: str) -> list[tuple[int, int]]:
    """The line ranges of `path` AT prev_ref that this diff replaced or deleted.

    `_changed_ranges` gives the `+` side (what the checkpoint wrote). This gives the `-` side:
    the lines that were already there and are now gone. That is the side that says whether the
    checkpoint disturbed settled code, and unlike the function-scoped measures it needs no
    parser — so it works for a layer Lizard cannot read (templates, HTML)."""
    try:
        out = _git(worktree, ["diff", "-U0", prev_ref, cur_ref, "--", path])
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return []
    ranges = []
    for line in out.splitlines():
        m = re.match(r"^@@ -(\d+)(?:,(\d+))? \+", line)
        if not m:
            continue
        start = int(m.group(1))
        count = int(m.group(2)) if m.group(2) is not None else 1
        if count > 0:
            ranges.append((start, start + count - 1))
    return ranges


def _commit_checkpoints(worktree: str, base_commit: str, cur_ref: str) -> dict[str, int]:
    """sha -> the CHECKPOINT number that commit belongs to, from its `cpNN ...` subject.

    A run puts TWO commits per checkpoint on the branch (`cpNN reset`, `cpNN agent`), so a raw
    commit distance would report every age at roughly double. Age is only meaningful in the unit
    the study reasons in — checkpoints — so this maps by label and returns {} when the labels are
    absent, which makes the age columns BLANK rather than silently wrong.

    Everything at or before base_commit is checkpoint 0: the base shell is the oldest code there
    is, and lines of it that a checkpoint rewrites are exactly what these columns exist to catch."""
    out: dict[str, int] = {}
    try:
        for sha in _git(worktree, ["rev-list", base_commit], timeout=300).split():
            out[sha] = 0
        log = _git(worktree, ["log", "--format=%H %s", f"{base_commit}..{cur_ref}"], timeout=300)
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return {}
    labelled = False
    for line in log.splitlines():
        sha, _, subject = line.partition(" ")
        m = re.match(r"^cp0*(\d+)\b", subject.strip())
        if m:
            out[sha] = int(m.group(1))
            labelled = True
    # No cpNN anywhere in base..cur: there is no checkpoint scale to age against, so report none
    # rather than pretending base-is-0 is a checkpoint distance.
    return out if labelled else {}


def reedit_line_stats(worktree: str, prev_ref: str, cur_ref: str, base_commit: str,
                      match: Callable[[str], bool]) -> dict:
    """Parser-free counterpart to `reedit_stats`: how much ALREADY-WRITTEN code did this
    checkpoint replace or delete, and how old was it?

    Needs only git — no function parsing — so it is comparable across technologies: a stack whose
    front-end is templates gets this even though it has no functions for `reedit_stats` to scope
    to. Measured on the `-` side of the diff (what was destroyed), not the `+` side.
      reedit_lines_removed  pre-existing lines this checkpoint replaced or deleted
      reedit_lines_settled  those written 2+ checkpoints ago — i.e. NOT this feature's own
                            in-progress code from the checkpoint just before it
      reedit_lines_touched  every line the checkpoint touched in existing files (added + removed)
                            — the ratio's DENOMINATOR, stored so a run's rate can be POOLED
                            (sum/sum) instead of averaged over checkpoints. Averaging per-checkpoint
                            ratios is dominated by checkpoints with a tiny denominator and can
                            invert the comparison; analyze reports the pooled value.
      reedit_lines_rate     settled lines as a share of reedit_lines_touched; 0 = the change left
                            settled code alone. Per-checkpoint only — quote the pooled value.
      reedit_age_mean/max   how many checkpoints ago those lines were written (blank when the
                            branch carries no `cpNN` commit labels — see _commit_checkpoints)
    """
    blank = {"reedit_lines_removed": None, "reedit_lines_settled": None,
             "reedit_lines_touched": None, "reedit_lines_rate": None,
             "reedit_age_mean": None, "reedit_age_max": None}
    try:
        ns = _git(worktree, ["diff", "--name-status", "-M", prev_ref, cur_ref])
        cur_sha = _git(worktree, ["rev-parse", cur_ref]).strip()
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return dict(blank)
    modified = []
    for line in ns.splitlines():
        parts = line.split("\t")
        if len(parts) >= 2 and not parts[0].startswith("A") and match(parts[-1]):
            modified.append(parts[-1])
    if not modified:
        return {**blank, "reedit_lines_removed": 0, "reedit_lines_settled": 0,
                "reedit_lines_touched": 0}

    cps = _commit_checkpoints(worktree, base_commit, cur_ref)
    cur_cp = cps.get(cur_sha)
    # Whether there is a checkpoint scale to age against at all. Without one the settled/age
    # columns are BLANK; with one, "destroyed nothing" is a real 0 and must not read as blank.
    scaled = bool(cps) and cur_cp is not None
    removed = settled = touched = 0
    ages: list[int] = []
    for path in modified:
        ranges = _prev_changed_ranges(worktree, prev_ref, cur_ref, path)
        for a, r in _numstat_pairs(worktree, prev_ref, cur_ref, path):
            touched += a + r
        if not ranges:
            continue
        blame = _blame_line_commits(worktree, prev_ref, path)
        for start, end in ranges:
            for ln in range(start, end + 1):
                removed += 1
                sha = blame.get(ln)
                if not sha or cur_cp is None or sha not in cps:
                    continue
                age = max(cur_cp - cps[sha], 0)
                ages.append(age)
                if age >= 2:
                    settled += 1
    if removed == 0:
        settled_out, rate_out = 0, (0.0 if touched else None)
    elif scaled:
        settled_out = settled
        rate_out = round(settled / touched, 4) if touched else None
    else:
        settled_out = rate_out = None
    return {"reedit_lines_removed": removed,
            "reedit_lines_settled": settled_out,
            "reedit_lines_touched": touched,
            "reedit_lines_rate": rate_out,
            "reedit_age_mean": (round(sum(ages) / len(ages), 2) if ages else None),
            "reedit_age_max": (max(ages) if ages else None)}


def _numstat_pairs(worktree: str, prev_ref: str, cur_ref: str, path: str):
    """(added, removed) line counts for one path in this diff; [] for a binary file."""
    try:
        out = _git(worktree, ["diff", "--numstat", prev_ref, cur_ref, "--", path])
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return []
    pairs = []
    for line in out.splitlines():
        st = line.split("\t")
        if len(st) >= 2 and st[0].isdigit() and st[1].isdigit():
            pairs.append((int(st[0]), int(st[1])))
    return pairs


def hot_surface(worktree: str, base_commit: str, cur_ref: str,
                match: Callable[[str], bool], top_k: int = 3) -> dict:
    """The layer's shared surface DISCOVERED, not declared.

    `boundary_violations` can only count edits to files somebody listed in advance, and the list
    is both technology-specific and fallible: the react arm declared `router/**` + `ui/**`, while
    the surface that actually absorbed the churn was the feature PAGE. This asks git instead —
    over base..cur, which files does the run keep REOPENING (status M), and how much of all the
    mutation lands in the worst few?
      hot_top_file / hot_top_edits  the most-reopened file and how many checkpoints touched it
      hot_share                     share of ALL mutated lines landing in the top_k files
                                    (1.0 = one file absorbs the whole run's churn)
      hot_files                     those top_k, as `path:edits`
    Additions are excluded: a file appearing for the first time is not a shared surface.
    """
    blank = {"hot_top_file": None, "hot_top_edits": None, "hot_share": None, "hot_files": None}
    try:
        log = _git(worktree, ["log", "--format=%H", "--numstat", "--diff-filter=M", "-M",
                              f"{base_commit}..{cur_ref}"], timeout=300)
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return dict(blank)
    edits: dict[str, int] = defaultdict(int)
    churn: dict[str, int] = defaultdict(int)
    for line in log.splitlines():
        st = line.split("\t")
        if len(st) >= 3 and st[0].isdigit() and st[1].isdigit():
            path = st[-1]
            if not match(path):
                continue
            edits[path] += 1
            churn[path] += int(st[0]) + int(st[1])
    if not edits:
        return dict(blank)
    ranked = sorted(edits.items(), key=lambda kv: (-kv[1], -churn[kv[0]], kv[0]))
    total = sum(churn.values())
    top = ranked[:top_k]
    share = (sum(churn[p] for p, _ in top) / total) if total else None
    return {"hot_top_file": ranked[0][0], "hot_top_edits": ranked[0][1],
            "hot_share": (round(share, 4) if share is not None else None),
            "hot_files": ";".join(f"{p}:{n}" for p, n in top)}


def _layer_langs(opts: dict, globs: list[str]) -> set[str]:
    """The layer's source languages, as lower-case extensions.

    A metric that only understands ONE language must key on this, never on the layer's NAME.
    Running PMD and a Java call-graph parser because a layer happens to be called "backend"
    produces junk for a Node, Python or Go backend — where the honest answer is the blank that
    says "did not run". The stack declares its languages (`stack.yaml -> layers.<l>.ext`); for a
    stack predating that, they are probed through the layer's own glob matcher, so the two can
    never disagree.
    """
    exts = {str(e).lstrip(".").lower() for e in (opts.get("ext") or [])}
    if exts:
        return exts
    # Probe through the layer's OWN matcher so the two can never disagree — but anchored under
    # the glob's static directory prefix, since a glob like `src/main/java/**/*.java` matches
    # nothing at an arbitrary path.
    match = _matcher(globs, exclude_tests=False)
    dirs = _glob_dirs(globs) or [""]
    cands = ("java", "kt", "scala", "ts", "tsx", "js", "jsx", "mjs", "py", "go",
             "rb", "cs", "php", "rs", "html")
    return {e for e in cands
            if any(match(f"{d}/probe.{e}" if d else f"probe.{e}") for d in dirs)}


def _glob_dirs(globs: list[str]) -> list[str]:
    """Static-prefix source directories of a layer's globs (for CK/PMD, which take dirs).
    `src/main/java/**/*.java` -> `src/main/java`."""
    dirs = []
    for g in globs or []:
        keep = []
        for part in g.split("/"):
            if any(c in part for c in "*?{"):
                break
            keep.append(part)
        d = "/".join(keep)
        if d:
            dirs.append(d)
    return sorted(set(dirs))


# --- the seam analyze calls ---------------------------------------------------


def compute_all(worktree: str, app_cfg: dict, tools: dict, base_commit: str,
                prev_ref: Optional[str] = None) -> dict:
    """One checkpoint's full structural row, PER LAYER (frontend_* / backend_*), from the
    worktree (checked out at the checkpoint commit) + a diff against prev_ref. Robust when a
    layer has no files yet (early checkpoints) — emits zeros, never raises."""
    # Imported here, not at module scope: deep_metrics builds on this module's helpers, so a
    # top-level import would be circular.
    from . import deep_metrics

    source_globs = app_cfg.get("source_globs") or {}
    layer_opts = app_cfg.get("layers") or {}      # stack.yaml's per-layer deep-metric options
    # The layers the STACK declares, in the harness's canonical order. A stack may declare a
    # subset (a headless API has no front end), and an undeclared layer gets NO columns rather
    # than empty ones — absent and zero must stay distinguishable.
    layers_present = [l for l in LAYERS if l in source_globs] or list(LAYERS)
    row: dict = {}
    for lyr in layers_present:
        globs = source_globs.get(lyr) or []
        match = _matcher(globs)
        fns = functions(worktree, globs)
        opts = layer_opts.get(lyr) or {}
        langs = _layer_langs(opts, globs)
        det = erosion_detail(fns)
        row[f"{lyr}_erosion"] = det["erosion"]
        row[f"{lyr}_over_threshold"] = det["over_threshold"]
        row[f"{lyr}_fn_count"] = det["n_functions"]
        row[f"{lyr}_sloc"] = sum(f["nloc"] for f in fns)
        row[f"{lyr}_cc_total"] = sum(f["cc"] for f in fns)
        row[f"{lyr}_file_count"] = len({f["file"] for f in fns})
        for k, v in container_stats(fns).items():
            row[f"{lyr}_{k}"] = v
        for k, v in hotspot(fns).items():
            row[f"{lyr}_{k}"] = v
        # Placement: total CC + its concentration over fns/files/dirs (both layers, lizard).
        for k, v in placement.complexity_placement(fns).items():
            row[f"{lyr}_{k}"] = v
        # Java-backend depth: Halstead/MI, CK (C&K), PMD (cognitive/NPath/GodClass). Each returns
        # None -> blank columns (never zeros) when its tool is not configured/available.
        # Halstead/MI, PMD and CK are JAVA tools. Gated on the layer's declared language, not on
        # its name, so a non-Java backend gets blanks instead of whatever PMD makes of a
        # directory of .js. Column prefix is the layer's, so a Java layer under either name works.
        if "java" in langs and fns:
            for k, v in placement.halstead_placement(worktree, fns).items():
                row[f"{lyr}_{k}"] = v
            src_dirs = _glob_dirs(globs)
            pmd = placement.pmd_metrics(worktree, src_dirs, tools.get("pmd") or "",
                                        tools.get("pmd_metrics_rules") or "")
            for k, v in (pmd or {}).items():
                row[f"{lyr}_{k}"] = v
            ck = placement.ck_metrics(worktree, src_dirs, tools.get("ck") or "",
                                      tools.get("java") or "java")
            for k, v in (ck or {}).items():
                row[f"{lyr}_{k}"] = v
        # ── deep metrics (harness.deep_metrics, ported from the REST arm) ───────────────────
        # Layer-generic first. Each returns blanks (never zeros) when its tool is absent, and
        # the layer's language/anchors come from stack.yaml, not from this file.
        src_dirs = _glob_dirs(globs)
        touched_all = set()
        if prev_ref:
            try:
                touched_all = set(_git(worktree, ["diff", "--name-only", base_commit,
                                                  "HEAD"]).splitlines())
            except (FileNotFoundError, subprocess.TimeoutExpired):
                touched_all = set()
        touched_fns = [f for f in fns if f["file"] in touched_all]
        # Physical non-blank source lines, NOT the sum of function nloc: jscpd/ast-grep count
        # whole-file lines, so a function-nloc denominator makes density exceed 1 (see
        # deep_metrics.source_loc).
        loc = deep_metrics.source_loc(worktree, match)
        evolved_match = (lambda p: match(p) and p in touched_all)
        evolved_loc = deep_metrics.source_loc(worktree, evolved_match)
        row[f"{lyr}_source_loc"] = loc
        row[f"{lyr}_evolved_loc"] = evolved_loc
        # jscpd reports paths relative to the scanned dir, so express the changed files the
        # same way before scoping duplication to them.
        evolved_names: set[str] = set()
        for t in touched_all:
            for d in src_dirs:
                pref = d.rstrip("/") + "/"
                if t.startswith(pref):
                    evolved_names.add(t[len(pref):])
                    break
        fmt = opts.get("jscpd_format") or ""
        jrep = None
        if src_dirs and fmt and tools.get("jscpd"):
            jrep = deep_metrics._jscpd_report(worktree, src_dirs, tools["jscpd"], fmt)
        for k, v in deep_metrics.clone_metrics(jrep, loc, evolved_loc, evolved_names).items():
            row[f"{lyr}_{k}"] = v
        if src_dirs and fmt:
            jclones = None if jrep is None else deep_metrics._clone_lines_from_report(jrep, worktree)
            vscore, _vd = deep_metrics.verbosity(worktree, src_dirs, loc,
                                                 {**tools, "jscpd_format": fmt}, clones=jclones)
            row[f"{lyr}_verbosity"] = ("" if vscore != vscore else round(vscore, 4))  # NaN -> blank
        else:
            row[f"{lyr}_verbosity"] = ""
        for k, v in deep_metrics.wmc_stats(touched_fns).items():
            row[f"{lyr}_{k}"] = v
        for k, v in deep_metrics.hotspot_stats(touched_fns).items():
            row[f"{lyr}_deep_{k}"] = v
        # Namespaced `fnpkg_`: this returns fn_count/fn_nloc_* about ONE declared package, which
        # would otherwise overwrite the layer's own fn_count computed above.
        for k, v in deep_metrics.function_package_stats(
                worktree, opts.get("function_package_glob")).items():
            row[f"{lyr}_fnpkg_{k[len('fn_'):]}" if k.startswith("fn_") else f"{lyr}_{k}"] = v
        # Anchored to the layer's own entry surface (stack.yaml `handler_pattern`): for the
        # backend every OfficeFloor logic class with a `service(...)`, for the front end the
        # route files. Role-comparable across stacks in a way `wmc_max` is not.
        hp = opts.get("handler_pattern")
        for k, v in deep_metrics.entry_handler_stats(fns, hp).items():
            row[f"{lyr}_{k}"] = v
        for k, v in deep_metrics.handler_wmc_stats(fns, hp).items():
            row[f"{lyr}_{k}"] = v
        for k, v in deep_metrics.handler_scoped_erosion(fns, hp).items():
            row[f"{lyr}_{k}"] = v
        row[f"{lyr}_config_loc"] = deep_metrics.yaml_loc(worktree, opts.get("config_globs") or [])
        # Java-shaped: the call index parses Java identifiers and a `.java` class stem, so this
        # is gated on the LANGUAGE. For any other backend the node columns are blank — the
        # architecture has no wired nodes this parser can see, which is not the same as zero.
        if "java" in langs and fns:
            for k, v in deep_metrics.node_closure_stats(worktree, fns, opts).items():
                row[f"{lyr}_{k}"] = v
        else:
            for k in ("node_count", "node_cc_median", "node_cc_mean", "node_cc_p90",
                      "node_cc_max", "node_methods_median", "node_exclusive_share",
                      "node_path_cc", "node_path_methods"):
                row[f"{lyr}_{k}"] = None

        if prev_ref:
            for k, v in deep_metrics.blast_radius_detail(worktree, prev_ref, "HEAD",
                                                         match=match).items():
                row[f"{lyr}_{k}"] = v
            for k, v in impact_stats(worktree, prev_ref, "HEAD", match).items():
                row[f"{lyr}_{k}"] = v
            for k, v in blast_radius(worktree, prev_ref, "HEAD", match).items():
                row[f"{lyr}_{k}"] = v
            for k, v in reedit_stats(worktree, prev_ref, "HEAD", match).items():
                row[f"{lyr}_{k}"] = v
            for k, v in reedit_line_stats(worktree, prev_ref, "HEAD", base_commit,
                                          match).items():
                row[f"{lyr}_{k}"] = v
            for k, v in change_spread(worktree, prev_ref, "HEAD", match).items():
                row[f"{lyr}_{k}"] = v
            for k, v in hot_surface(worktree, base_commit, "HEAD", match).items():
                row[f"{lyr}_{k}"] = v
            for k, v in placement.change_entropy(worktree, prev_ref, "HEAD",
                                                 base_commit, match).items():
                row[f"{lyr}_{k}"] = v
    if prev_ref:
        row.update(boundary_violations(worktree, prev_ref, "HEAD", {"app": app_cfg}))
    return row

"""Placement / concentration metrics for the UI arm — WHERE complexity sits and how
change activity is distributed, as distinct from HOW MUCH there is.

Ported from the REST arm's `placement.py`. Everything here is a published measure or a
textbook concentration index, computed purely from a materialised checkpoint worktree +
git history — so `analyze` can regenerate it for historical runs with no agent involvement.

Layer split (DESIGN.md §8): the concentration/entropy/spread metrics apply to BOTH layers
(front-end TS + backend Java) via a per-function CC/SLOC source (Lizard) or pure git, and
are emitted as `{layer}_*`. The Halstead/MI, CK and PMD blocks are JAVA-only (their tools /
tokenizers are Java-bound) and run on the BACKEND layer only, as `backend_*`.
"""
from __future__ import annotations

import math
import os
import re
import subprocess
from collections import Counter, defaultdict
from typing import Callable, Iterable, Optional


# ---------------------------------------------------------------------------
# Concentration indices (textbook; pure math over any numeric vector)
# ---------------------------------------------------------------------------


def gini(values: Iterable[float]) -> Optional[float]:
    """Gini coefficient of inequality (Gini 1912), 0 = perfectly even. SCALE-FREE — it
    describes the SHAPE of the distribution and is insensitive to how many units it is
    spread over, so it is the honest companion to hhi/top_share (which reward more units)."""
    xs = sorted(x for x in values if x > 0)
    n = len(xs)
    if n < 2:
        return None
    total = sum(xs)
    if total <= 0:
        return None
    cum = sum((2 * i - n - 1) * x for i, x in enumerate(xs, 1))
    return round(cum / (n * total), 4)


def hhi(values: Iterable[float]) -> Optional[float]:
    """Herfindahl-Hirschman index: sum of squared shares. 1/n = perfectly even, 1 =
    everything in one unit (Hirschman 1945)."""
    xs = [x for x in values if x > 0]
    total = sum(xs)
    if not xs or total <= 0:
        return None
    return round(sum((x / total) ** 2 for x in xs), 6)


def top_share(values: Iterable[float], k: int) -> Optional[float]:
    """Share of the total held by the heaviest k units (concentration ratio CRk)."""
    xs = [x for x in values if x > 0]
    total = sum(xs)
    if not xs or total <= 0:
        return None
    return round(sum(sorted(xs, reverse=True)[:k]) / total, 4)


def norm_entropy(values: Iterable[float]) -> Optional[float]:
    """Shannon entropy of the share distribution, normalised by log(n). 1.0 = spread
    perfectly evenly; low = concentrated. Comparable across differing unit counts."""
    xs = [x for x in values if x > 0]
    total = sum(xs)
    if len(xs) < 2 or total <= 0:
        return None
    h = -sum((x / total) * math.log(x / total) for x in xs)
    return round(h / math.log(len(xs)), 4)


def lorenz_points(values: Iterable[float], steps: int = 10) -> Optional[str]:
    """Cumulative share of the total held by the poorest i/steps of units, linearly
    interpolated between unit boundaries (so a perfectly-even distribution reads as the
    straight line it is). Eleven numbers is enough to draw the exact curve behind a Gini."""
    xs = sorted(x for x in values if x > 0)
    n = len(xs)
    total = sum(xs)
    if n < 2 or total <= 0:
        return None
    cum = [0.0]
    acc = 0.0
    for x in xs:
        acc += x
        cum.append(acc / total)
    out = []
    for i in range(steps + 1):
        pos = n * i / steps
        lo = int(pos)
        if lo >= n:
            out.append(1.0)
            continue
        frac = pos - lo
        out.append(cum[lo] + frac * (cum[lo + 1] - cum[lo]))
    return ",".join(f"{v:.5g}" for v in out)


def distribution_block(values: list[float], prefix: str) -> dict:
    """The full concentration panel for one quantity, as flat CSV fields."""
    return {
        f"{prefix}_gini": gini(values),
        f"{prefix}_hhi": hhi(values),
        f"{prefix}_top1": top_share(values, 1),
        f"{prefix}_top5": top_share(values, 5),
        f"{prefix}_hnorm": norm_entropy(values),
        f"{prefix}_n": len([v for v in values if v > 0]) or None,
    }


# ---------------------------------------------------------------------------
# Total complexity and its distribution over units (Tesler's conserved quantity)
# ---------------------------------------------------------------------------


def _package_of(rel_path: str) -> str:
    """The directory the file sits in — the closest analogue of a 'package' for both layers."""
    return os.path.dirname(rel_path)


def complexity_placement(fns: list[dict]) -> dict:
    """Total cyclomatic complexity and how it distributes over functions / files / dirs.
    `total_cc` is the conserved 'amount'; the ccdist_* blocks are 'where it sits'."""
    if not fns:
        return {"total_cc": None, "total_fns": None, "total_files": None, "total_dirs": None}
    per_fn = [float(f["cc"]) for f in fns]
    by_file: dict[str, float] = defaultdict(float)
    by_pkg: dict[str, float] = defaultdict(float)
    for f in fns:
        by_file[f["file"]] += float(f["cc"])
        by_pkg[_package_of(f["file"])] += float(f["cc"])
    row = {
        "total_cc": round(sum(per_fn), 2),
        "total_fns": len(fns),
        "total_files": len(by_file),
        "total_dirs": len(by_pkg),
    }
    row.update(distribution_block(per_fn, "ccdist_fn"))
    file_cc = list(by_file.values())
    row.update(distribution_block(file_cc, "ccdist_file"))
    row["ccdist_file_lorenz"] = lorenz_points(file_cc)
    row.update(distribution_block(list(by_pkg.values()), "ccdist_dir"))
    return row


# ---------------------------------------------------------------------------
# Change entropy (Hassan 2009) — pure git, how a change spreads over files
# ---------------------------------------------------------------------------


def _numstat(worktree: str, a: str, b: str, match: Optional[Callable[[str], bool]] = None) -> dict:
    """{file -> added+removed lines} for the diff a..b, optionally filtered to a layer."""
    try:
        out = subprocess.run(["git", "-C", worktree, "diff", "--numstat", a, b],
                             capture_output=True, text=True, timeout=120).stdout
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return {}
    acc: dict[str, int] = {}
    for line in out.splitlines():
        parts = line.split("\t")
        if len(parts) == 3 and parts[0].isdigit() and parts[1].isdigit():
            path = parts[2]
            if match is not None and not match(path):
                continue
            acc[path] = acc.get(path, 0) + int(parts[0]) + int(parts[1])
    return acc


def change_entropy(worktree: str, prev_ref: str, cur_ref: str,
                   base_ref: Optional[str] = None,
                   match: Optional[Callable[[str], bool]] = None) -> dict:
    """Hassan (2009) change entropy: H = -sum p_i log2 p_i over the files a change touches,
    p_i = that file's share of the changed lines; H_norm = H/log2(n). High = spread, low =
    landed in one place. Reported for THIS checkpoint (`change_*`) and cumulatively from the
    chain base (`cum_change_*`). Pure git — no parse, no call resolution."""
    row: dict = {}
    for prefix, a in (("change", prev_ref), ("cum_change", base_ref)):
        if a is None:
            continue
        acc = _numstat(worktree, a, cur_ref, match)
        vals = [float(v) for v in acc.values() if v > 0]
        total = sum(vals)
        if len(vals) < 2 or total <= 0:
            row.update({f"{prefix}_entropy": (0.0 if vals else None),
                        f"{prefix}_entropy_norm": (0.0 if vals else None),
                        f"{prefix}_files": len(vals) or None,
                        f"{prefix}_top1": (1.0 if vals else None),
                        f"{prefix}_top5": (1.0 if vals else None),
                        f"{prefix}_hhi": (1.0 if vals else None)})
            continue
        h = -sum((v / total) * math.log2(v / total) for v in vals)
        row.update({
            f"{prefix}_entropy": round(h, 4),
            f"{prefix}_entropy_norm": round(h / math.log2(len(vals)), 4),
            f"{prefix}_files": len(vals),
            f"{prefix}_top1": top_share(vals, 1),
            f"{prefix}_top5": top_share(vals, 5),
            f"{prefix}_hhi": hhi(vals),
        })
    return row


# ---------------------------------------------------------------------------
# Halstead (1977) + Maintainability Index (Coleman 1994) — JAVA backend only
# ---------------------------------------------------------------------------

_JAVA_KEYWORD_OPERATORS = {
    "if", "else", "while", "for", "do", "switch", "case", "default", "break",
    "continue", "return", "new", "throw", "throws", "try", "catch", "finally",
    "instanceof", "synchronized", "assert", "yield",
}
_OP_SYMBOLS = re.compile(
    r">>>=|<<=|>>=|>>>|\.\.\.|->|::|\+\+|--|&&|\|\||==|!=|<=|>=|\+=|-=|\*=|/=|%=|&=|\|=|\^=|<<|>>"
    r"|[+\-*/%=<>!&|^~?:;,.\[\]{}()@]")
_IDENT = re.compile(r"[A-Za-z_$][A-Za-z0-9_$]*")
_NUMBER = re.compile(r"0[xXbB][0-9a-fA-F_]+[lLfFdD]?|\d[\d_]*\.?[\d_]*([eE][+-]?\d+)?[lLfFdD]?")
_STRIP = re.compile(r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|//[^\n]*|/\*.*?\*/', re.S)


def halstead(source: str) -> dict:
    """Halstead (1977) vocabulary/volume/difficulty/effort for one Java source text. Symbolic
    operators + control-flow keywords are operators; identifiers/literals/type keywords are
    operands. Strings/chars collapse to one placeholder so message text cannot move the score."""
    literals = 0

    def _sub(m: re.Match) -> str:
        nonlocal literals
        t = m.group(0)
        if t.startswith(("//", "/*")):
            return " "
        literals += 1
        return " \x00LIT\x00 "

    text = _STRIP.sub(_sub, source)
    ops: Counter = Counter()
    operands: Counter = Counter()
    operands["\x00LIT\x00"] = literals
    pos, n = 0, len(text)
    while pos < n:
        ch = text[pos]
        if ch.isspace():
            pos += 1
            continue
        m = _IDENT.match(text, pos)
        if m:
            word = m.group(0)
            if word == "\x00LIT\x00":
                pass
            elif word in _JAVA_KEYWORD_OPERATORS:
                ops[word] += 1
            else:
                operands[word] += 1
            pos = m.end()
            continue
        m = _NUMBER.match(text, pos)
        if m:
            operands[m.group(0)] += 1
            pos = m.end()
            continue
        m = _OP_SYMBOLS.match(text, pos)
        if m:
            ops[m.group(0)] += 1
            pos = m.end()
            continue
        pos += 1
    n1, n2 = len(ops), len([k for k, v in operands.items() if v])
    N1, N2 = sum(ops.values()), sum(operands.values())
    vocab, length = n1 + n2, N1 + N2
    if vocab <= 0 or length <= 0:
        return {"n1": 0, "n2": 0, "N1": 0, "N2": 0, "volume": 0.0, "difficulty": 0.0, "effort": 0.0}
    volume = length * math.log2(vocab)
    difficulty = (n1 / 2) * (N2 / n2) if n2 else 0.0
    return {"n1": n1, "n2": n2, "N1": N1, "N2": N2,
            "volume": volume, "difficulty": difficulty, "effort": difficulty * volume}


def maintainability_index(volume: float, cc: float, loc: float) -> Optional[float]:
    """Coleman et al. (1994) MI in the SEI/Visual-Studio 0-100 rescaling:
    MI = max(0, (171 - 5.2 ln V - 0.23 CC - 16.2 ln LOC) * 100/171). Location-blind by
    construction (whole-file average), so a single check, never the thesis statistic."""
    if volume <= 0 or loc <= 0:
        return None
    mi = (171.0 - 5.2 * math.log(volume) - 0.23 * cc - 16.2 * math.log(loc)) * 100.0 / 171.0
    return round(max(0.0, mi), 3)


def halstead_placement(worktree: str, fns: list[dict]) -> dict:
    """Whole-layer Halstead totals + the Maintainability Index computed PER FILE then averaged
    (the SEI practice; over whole-codebase totals it saturates the 0 floor). `mi_min` is the
    worst file — the only part of MI that sees concentration."""
    by_file: dict[str, list[dict]] = {}
    for f in fns:
        by_file.setdefault(f["file"], []).append(f)
    vols: list[float] = []
    mis: list[float] = []
    agg = {"n1": 0, "n2": 0, "N1": 0, "N2": 0, "volume": 0.0, "effort": 0.0}
    for rel, group in by_file.items():
        try:
            with open(os.path.join(worktree, rel), encoding="utf-8", errors="replace") as fh:
                h = halstead(fh.read())
        except OSError:
            continue
        vols.append(h["volume"])
        for k in ("n1", "n2", "N1", "N2", "volume", "effort"):
            agg[k] += h[k]
        file_loc = sum(float(g["nloc"]) for g in group)
        mean_cc = sum(float(g["cc"]) for g in group) / len(group)
        mi = maintainability_index(h["volume"], mean_cc, file_loc)
        if mi is not None:
            mis.append(mi)
    if not vols:
        return {"halstead_volume": None, "halstead_effort": None,
                "halstead_vocab": None, "mi_mean": None, "mi_min": None}
    row = {
        "halstead_volume": round(agg["volume"], 1),
        "halstead_effort": round(agg["effort"], 1),
        "halstead_vocab": agg["n1"] + agg["n2"],
        "mi_mean": round(sum(mis) / len(mis), 3) if mis else None,
        "mi_min": round(min(mis), 3) if mis else None,
    }
    row.update(distribution_block(vols, "voldist_file"))
    return row


# ---------------------------------------------------------------------------
# Chidamber & Kemerer suite via the CK tool (Aniche 2015) — JAVA backend only
# ---------------------------------------------------------------------------

_CK_AGGREGATE = ["cbo", "rfc", "lcom", "lcom*", "tcc", "lcc", "dit", "fanin", "fanout"]


def ck_metrics(worktree: str, src_dirs: list[str], ck_jar: str,
               java_bin: str = "java", timeout: int = 900) -> Optional[dict]:
    """Per-class C&K metrics via the CK tool, aggregated (mean/max) + WMC distribution.
    Returns None (never zeros) if CK did not run — a blank column that `series_by_chain`
    drops, rather than a 0 that would flatten a trajectory. CK parses SOURCE (Eclipse JDT),
    no compile, so it runs on a materialised tree exactly like lizard."""
    if not ck_jar or not os.path.isfile(ck_jar):
        return None
    import csv as _csv
    import shutil
    import tempfile
    out_dir = tempfile.mkdtemp(prefix="ck_")
    rows: list[dict] = []
    try:
        for d in src_dirs:
            target = os.path.join(worktree, d)
            if not os.path.isdir(target):
                continue
            try:
                proc = subprocess.run(
                    [java_bin, "-jar", ck_jar, target, "false", "0", "false", out_dir + os.sep],
                    capture_output=True, text=True, timeout=timeout)
            except (OSError, subprocess.TimeoutExpired):
                return None
            cls_csv = os.path.join(out_dir, "class.csv")
            if proc.returncode != 0 or not os.path.isfile(cls_csv):
                return None
            with open(cls_csv, encoding="utf-8", errors="replace") as fh:
                rows.extend(list(_csv.DictReader(fh)))
            for leftover in ("class.csv", "method.csv", "field.csv", "variable.csv"):
                try:
                    os.remove(os.path.join(out_dir, leftover))
                except OSError:
                    pass
    finally:
        shutil.rmtree(out_dir, ignore_errors=True)
    if not rows:
        return None

    def col(name: str) -> list[float]:
        vals = []
        for r in rows:
            try:
                v = float(r.get(name, ""))
            except (TypeError, ValueError):
                continue
            if v == v and v >= 0:          # drop NaN and CK's -1 "not applicable"
                vals.append(v)
        return vals

    out: dict = {"ck_classes": len(rows)}
    for name in _CK_AGGREGATE:
        vals = col(name)
        key = name.replace("*", "_star")
        out[f"ck_{key}_mean"] = round(sum(vals) / len(vals), 4) if vals else None
        out[f"ck_{key}_max"] = round(max(vals), 4) if vals else None
    wmc_vals = col("wmc")
    out["ck_wmc_total"] = round(sum(wmc_vals), 2) if wmc_vals else None
    out.update(distribution_block(wmc_vals, "wmcdist_class"))
    return out


# ---------------------------------------------------------------------------
# PMD cognitive/NPath values + published GodClass/DataClass verdicts — JAVA only
# ---------------------------------------------------------------------------

_PMD_VALUE_RX = {
    "cognitive": re.compile(r"cognitive complexity of (\d+)"),
    "cyclo": re.compile(r"cyclomatic complexity of (\d+)"),
    "npath": re.compile(r"NPath complexity of (\d+)"),
}


def pmd_metrics(worktree: str, src_dirs: list[str], pmd_bin: str, ruleset: str,
                timeout: int = 900) -> Optional[dict]:
    """Cognitive complexity + NPath VALUES and the GodClass/DataClass/Demeter VERDICTS (PMD
    implements Lanza & Marinescu 2006: WMC>=47 AND ATFD>5 AND TCC<1/3). None if PMD did not
    run (never zeros)."""
    from .quality_gate import run_pmd
    if not pmd_bin or not ruleset or not os.path.isfile(ruleset):
        return None
    present = [d for d in src_dirs if os.path.isdir(os.path.join(worktree, d))]
    if not present:
        return None
    report = run_pmd(worktree, present, pmd_bin, [ruleset], "cognitive/metrics", timeout)
    if report is None:
        return None
    return pmd_metrics_from_report(report)


def pmd_metrics_from_report(report: dict, keep: Optional[set[str]] = None) -> Optional[dict]:
    """The metrics block out of an already-parsed PMD report (see run_pmd for the merged-run
    `keep` filter)."""
    vals: dict[str, list[float]] = {k: [] for k in _PMD_VALUE_RX}
    verdicts: Counter = Counter()
    for f in report.get("files", []):
        for v in f.get("violations", []):
            rule = v.get("rule") or ""
            if keep is not None and rule not in keep:
                continue
            msg = v.get("description") or ""
            if rule in ("GodClass", "DataClass", "LawOfDemeter"):
                verdicts[rule] += 1
                continue
            for key, rx in _PMD_VALUE_RX.items():
                m = rx.search(msg)
                if m:
                    if key == "cyclo" and "class" in msg[:24].lower():
                        break
                    vals[key].append(float(m.group(1)))
                    break
    out: dict = {}
    for key, xs in vals.items():
        out[f"pmd_{key}_total"] = round(sum(xs), 2) if xs else None
        out[f"pmd_{key}_max"] = round(max(xs), 2) if xs else None
        out[f"pmd_{key}_mean"] = round(sum(xs) / len(xs), 4) if xs else None
    out.update(distribution_block(vals["cognitive"], "cogdist_fn"))
    out["pmd_god_classes"] = verdicts.get("GodClass", 0)
    out["pmd_data_classes"] = verdicts.get("DataClass", 0)
    out["pmd_demeter_violations"] = verdicts.get("LawOfDemeter", 0)
    return out

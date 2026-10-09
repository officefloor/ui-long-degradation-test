"""Analysis: read a run's committed capture off the evolve branches, RE-SCORE it, and
emit the headline numbers + summary.md + plots.

Capture-not-derive (DESIGN.md §5, §8): the run persists only raw capture. The per-checkpoint
correctness row is rebuilt here from the raw `{test_id: passed}` map in each cpNN.json via
correctness.score_results / outcome_row — so a scoring change (or, later, a structural metric)
can be computed over OLD runs without re-invoking the agent.

Headline: the degradation slope m = OLS slope of a metric on checkpoint index, per condition,
with a chain-bootstrap CI; plus EvoScore and Zero-Regression Rate. recompute_rows also merges
PER-LAYER structural erosion/impact (metrics.compute_all over each checkpoint commit — front-end
TS at file-scope, backend Java at class-scope; separate series, never compared across layers).

Usage:
  python -m harness.analyze --config config.yaml [--run-id RID] [--out DIR] [--gammas 1,1.5,2]
"""
from __future__ import annotations

import argparse
import csv
import json
import math
import os
import re
import shutil
import subprocess
import tempfile
import time
from collections import Counter, defaultdict

import numpy as np
import yaml

from . import (class_shape, correctness, cumulative_impact, doctor, metrics, stack_label,
               stack_layer_options, stack_layers, stack_repo)
from .run_experiment import CSV_FIELDS, phase_for

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    HAVE_MPL = True
except Exception:
    HAVE_MPL = False

# evolve/<run_id>/<condition>/chain<n>  (UI arm: no per-arm segment)
_BRANCH_RE = re.compile(r"^evolve/([^/]+)/([^/]+)/chain(\d+)$")
MIN_EVENTS = 5
LEVEL_MATERIAL_REL = 0.10   # a between-condition LEVEL gap below this fraction of the larger
                            # magnitude is not a direction (mirrors overview.MATERIAL_REL) — without
                            # it any nonzero gap flags a counter-signal (e.g. cost_usd by two cents).


def _f(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return math.nan


def _i0(x) -> int:
    """Integer count, treating missing/blank/NaN as 0 — for columns added after a run was
    archived, so an older records.csv still sums instead of raising."""
    v = _f(x)
    return 0 if math.isnan(v) else int(v)


def _b(x):
    return str(x).strip().lower() in ("true", "1", "yes")


def git_out(repo: str, args: list[str]) -> str:
    return subprocess.run(["git", "-C", repo, *args], capture_output=True, text=True).stdout


# ---------------------------------------------------------------------------
# Capture reading + re-derivation (from the checkpoint COMMITS + raw capture).
# ---------------------------------------------------------------------------


def _evolve_branches(repo: str, run_id: str | None = None):
    """Yield (branch, condition, chain) for evolve branches in the single app repo."""
    out = []
    refs = git_out(repo, ["for-each-ref", "--format=%(refname:short)", "refs/heads/evolve"])
    for br in (r.strip() for r in refs.splitlines() if r.strip()):
        m = _BRANCH_RE.match(br)
        if not m:
            continue
        rid, condition, chain = m.groups()
        if run_id and rid != run_id:
            continue
        out.append((br, condition, int(chain)))
    return out


def _latest_run_id(repo: str) -> str | None:
    ids = {_BRANCH_RE.match(br).group(1) for br, *_ in _evolve_branches(repo)}
    return max(ids) if ids else None


def _read_json_blob(repo: str, ref: str, path: str) -> dict | None:
    p = subprocess.run(["git", "-C", repo, "show", f"{ref}:{path}"],
                       capture_output=True, text=True)
    if p.returncode != 0:
        return None
    try:
        return json.loads(p.stdout)
    except json.JSONDecodeError:
        return None


def _read_captures(repo: str, branch: str) -> dict[int, dict]:
    """checkpoint -> capture record, from evolve-results/capture/cpNN.json on the branch."""
    caps: dict[int, dict] = {}
    ls = git_out(repo, ["ls-tree", "-r", "--name-only", branch, "evolve-results/capture/"])
    for path in ls.splitlines():
        mt = re.search(r"cp0*(\d+)\.json$", path)
        if mt:
            rec = _read_json_blob(repo, branch, path.strip())
            if rec is not None:
                caps[int(mt.group(1))] = rec
    return caps


def _outcome_from_capture(rec: dict) -> correctness.TestOutcome:
    """Rebuild a scored TestOutcome from a checkpoint's RAW capture (results map + detail),
    re-scoring through correctness so the numbers are derived, not read back."""
    t = rec.get("tests") or {}
    k = int(rec["checkpoint"])
    if t.get("gate_invalid"):
        return correctness.TestOutcome(build_ok=bool(t.get("build_ok")), gate_invalid=True,
                                       error=t.get("error", ""))
    detail = t.get("detail") or []
    cats = {d["test_id"]: d.get("category", "functionality") for d in detail if d.get("test_id")}
    outcome = correctness.score_results(t.get("results") or {}, k, cats)
    outcome.build_ok = bool(t.get("build_ok", True))
    outcome.detail = detail
    outcome.gate_invalid = False
    mutated = {int(m) for m in (rec.get("mutates") or [])}
    for d in detail:
        if not d.get("passed", True) and d.get("test_id"):
            # Classify the REAL reason (no `mutated` excuse): the reason breakdown is only read for
            # PRIOR-passing failures, which are true regressions and must get anchor_drift/
            # behaviour_loss/seed_path — never "intended", which would drop them (outcome_row counts
            # the intended-change display separately via the mutates set).
            outcome.reasons[d["test_id"]] = correctness._classify(d, set())
    return outcome


def _heartbeat_val(row: dict, field: str) -> str:
    """One metric as the progress heartbeat shows it.

    `-` means the field is BLANK (the metric did not run — e.g. the Java CK/PMD block on a
    checkpoint with no backend files yet), never a real 0: "did not run" must not read as
    "found nothing". Display only; nothing is derived from this."""
    v = row.get(field, "")
    if v is None or v == "":
        return "-"
    if isinstance(v, float):
        return f"{v:.4g}"
    return str(v)


def _metrics_row(repo: str, commit_sha: str, prev_sha: str | None, app_cfg: dict,
                 tools: dict | None = None, base_commit: str | None = None) -> dict:
    """Structural erosion/impact/placement for a checkpoint: materialise its agent commit in a
    THROWAWAY worktree and run metrics.compute_all over it (front-end TS + backend Java, per layer;
    DESIGN.md §8). `tools` drives the Java-backend CK/PMD block; `base_commit` (the chain base) drives
    cumulative change-entropy. Resilient — any failure returns {} so one bad checkpoint can't abort."""
    if not commit_sha:
        return {}
    tmp = tempfile.mkdtemp(prefix="ana-metrics-")
    try:
        r = subprocess.run(["git", "-C", repo, "worktree", "add", "--detach", "-f", tmp, commit_sha],
                           capture_output=True, text=True)
        if r.returncode != 0:
            return {}
        return metrics.compute_all(tmp, app_cfg, tools or {}, base_commit or commit_sha,
                                   prev_ref=(prev_sha or None))
    except Exception as e:  # never let a metrics failure abort the run
        print(f"    [warn] metrics failed for {commit_sha[:8]}: {e}", flush=True)
        return {}
    finally:
        subprocess.run(["git", "-C", repo, "worktree", "remove", "--force", tmp],
                       capture_output=True, text=True)
        subprocess.run(["rm", "-rf", tmp], capture_output=True, text=True)


def recompute_rows(repo: str, run_id: str, app_cfg: dict | None = None,
                   tools: dict | None = None) -> list[dict]:
    """One row per (chain, checkpoint), rebuilt from capture and re-scored. prior_passing
    accumulates within a chain so regressions / normalized_change are relative to the last
    graded checkpoint (a gate-invalid checkpoint does not advance the baseline). When app_cfg
    is given, structural metrics (metrics.compute_all) are merged in from the checkpoint commit;
    `tools` drives the Java-backend CK/PMD block."""
    rows: list[dict] = []
    branches = sorted(_evolve_branches(repo, run_id))
    n_br = len(branches)
    t_all = time.time()
    print(f"recompute: {n_br} chain branch(es)"
          + ("" if app_cfg else "  (no app config — correctness only, no structural metrics)"),
          flush=True)
    for i_br, (branch, condition, chain) in enumerate(branches, 1):
        caps = _read_captures(repo, branch)
        if not caps:
            print(f"  [{i_br}/{n_br}] {branch}: no capture — skipped", flush=True)
            continue
        n = max(caps)
        ks = sorted(caps)
        n_cp = len(ks)
        print(f"  [{i_br}/{n_br}] {branch}: {n_cp} checkpoint(s)", flush=True)
        base_commit = caps[min(caps)].get("prev_sha")  # chain base (cp01's prev) — cum change-entropy
        prior_passing: set[str] = set()
        prior_selected: set[str] | None = None   # what the PREVIOUS checkpoint ran, so a
                                                 # replacement spec failing on arrival is visible
        n_noop = 0        # checkpoints the agent left unchanged -> no commit -> no structural row
        n_invalid = 0     # gates that aborted -> correctness is missing, not failed
        t_chain = time.time()
        for i_cp, k in enumerate(ks, 1):
            rec = caps[k]
            outcome = _outcome_from_capture(rec)
            mutated = [int(m) for m in (rec.get("mutates") or [])]
            scored_row = correctness.outcome_row(outcome, prior_passing, mutated,
                                                 prior_selected)
            ag = rec.get("agent") or {}
            # The STACK this row came from. results/<run_id>/ is keyed by run id alone, so
            # without this a CSV cannot be attributed to an arm — which makes a cross-arm
            # overview impossible and an archived records.csv unciteable. Taken from the
            # capture, which records it per checkpoint, so it is the stack the run actually
            # used rather than whatever --repo happens to point at now.
            stk = rec.get("stack") or {}
            row = {
                "stack": stk.get("name") or os.path.basename(repo.rstrip("/")),
                "stack_origin": stk.get("origin") or "",
                "run_id": run_id, "model": ag.get("model") or "",
                "branch": branch, "condition": condition, "chain": chain,
                "checkpoint": k, "checkpoint_id": rec.get("checkpoint_id"),
                "phase": rec.get("phase") or phase_for(k, n),
                "checkpoint_type": rec.get("type", "additive"),
                "agent_ok": ag.get("ok"), "cost_usd": ag.get("cost_usd"),
                "input_tokens": ag.get("input_tokens"), "output_tokens": ag.get("output_tokens"),
                "num_turns": ag.get("num_turns"), "duration_ms": ag.get("duration_ms"),
                "duration_api_ms": ag.get("duration_api_ms"),
                "pinned_touched": ";".join(rec.get("pinned_touched") or []),
                "acceptance_touched": ";".join(rec.get("acceptance_touched") or []),
                "notes": "",
            }
            row.update(scored_row)
            # Comprehension probe (cold reader), present only at the Act-boundary checkpoints.
            pr = rec.get("probe") or {}
            if pr:
                _recall = pr.get("probe_recall")
                row.update({
                    "probe_recall": ("" if _recall is None else round(_recall, 3)),
                    "probe_cost_usd": pr.get("probe_cost_usd"),
                    "probe_input_tokens": pr.get("probe_input_tokens"),
                    "probe_cache_read_tokens": pr.get("probe_cache_read_tokens"),
                })
            # Structural erosion/impact/placement (per layer) from the checkpoint commit (§8).
            if app_cfg:
                row.update(_metrics_row(repo, rec.get("commit_sha") or "",
                                        rec.get("prev_sha"), app_cfg, tools, base_commit))
            if not outcome.gate_invalid:
                prior_passing = outcome.passing
                prior_selected = set(outcome.results)
            else:
                n_invalid += 1
            if not (rec.get("commit_sha") or ""):
                n_noop += 1
            rows.append(row)

            # Heartbeat, one line per CHECKPOINT (the unit that takes the time: a throwaway
            # worktree plus lizard/PMD/CK over it). Deliberately not per-metric — nearly all of
            # a checkpoint is the external tool launches, so a per-metric line would be ~20x the
            # volume while idling on exactly the steps that take the time.
            el = time.time() - t_chain
            eta = (el / i_cp) * (n_cp - i_cp)
            flags = ("  NO-OP" if not (rec.get("commit_sha") or "") else "") + \
                    ("  INVALID-GATE" if outcome.gate_invalid else "")
            print(f"      cp{k:02d} {i_cp:>3}/{n_cp}  {el / i_cp:5.1f}s/cp  eta {eta / 60:5.1f}m"
                  f"  fe[er={_heartbeat_val(row, 'frontend_erosion')}"
                  f" sloc={_heartbeat_val(row, 'frontend_sloc')}]"
                  f"  be[er={_heartbeat_val(row, 'backend_erosion')}"
                  f" sloc={_heartbeat_val(row, 'backend_sloc')}]"
                  f"  regr={_heartbeat_val(row, 'regressions')}" + flags, flush=True)
        print(f"  recomputed {branch}: {n_cp} checkpoint(s)"
              + (f" ({n_noop} no-op)" if n_noop else "")
              + (f"  ! {n_invalid} INVALID GATE(S) — correctness excluded" if n_invalid else "")
              + f"  [{(time.time() - t_chain) / 60:.1f}m]", flush=True)
    print(f"recompute done: {len(rows)} rows from {n_br} branch(es) "
          f"in {(time.time() - t_all) / 60:.1f}m", flush=True)
    return rows


# ---------------------------------------------------------------------------
# Pure statistics (lifted from the REST arm's analyze.py; condition-keyed).
# ---------------------------------------------------------------------------


def group_key(r: dict) -> str:
    return r["condition"]


def series_by_chain(rows: list[dict], field: str) -> dict[int, list[tuple[int, float]]]:
    out: dict[int, list[tuple[int, float]]] = defaultdict(list)
    for r in rows:
        v = _f(r.get(field))
        if not math.isnan(v):
            out[int(r["chain"])].append((int(r["checkpoint"]), v))
    for c in out:
        out[c].sort()
    return out


def ols_slope(xs: np.ndarray, ys: np.ndarray) -> float:
    if len(xs) < 2:
        return math.nan
    return float(np.polyfit(xs, ys, 1)[0])


def _bucket_by_checkpoint(chain_series, sample=None) -> dict[int, list[float]]:
    keys = list(chain_series) if sample is None else sample
    acc: dict[int, list[float]] = defaultdict(list)
    for c in keys:
        for k, v in chain_series[c]:
            acc[k].append(v)
    return acc


def _mean_curve_slope(chain_series, sample) -> float:
    acc = _bucket_by_checkpoint(chain_series, sample)
    ks = sorted(acc)
    if len(ks) < 2:
        return math.nan
    return ols_slope(np.array(ks, dtype=float), np.array([np.mean(acc[k]) for k in ks]))


def bootstrap_slope(chain_series, n_boot: int = 2000, seed: int = 0):
    chains = list(chain_series.keys())
    if not chains:
        return (math.nan, math.nan, math.nan)
    point = _mean_curve_slope(chain_series, chains)
    if len(chains) < 2:
        # One chain resamples to itself every time → a zero-width CI that would falsely "exclude 0".
        return (point, math.nan, math.nan)
    rng = np.random.default_rng(seed)
    slopes = []
    for _ in range(n_boot):
        s = _mean_curve_slope(chain_series, list(rng.choice(chains, len(chains), replace=True)))
        if not math.isnan(s):
            slopes.append(s)
    if not slopes:
        return (point, math.nan, math.nan)
    lo, hi = np.percentile(slopes, [2.5, 97.5])
    return (point, float(lo), float(hi))


def bootstrap_diff_slope(rows_a: list[dict], rows_b: list[dict], field: str,
                         n_boot: int = 2000, seed: int = 0):
    """Bootstrap CI for slope(A) - slope(B): the paired between-condition test."""
    sa, sb = series_by_chain(rows_a, field), series_by_chain(rows_b, field)
    if not sa or not sb:
        return (math.nan, math.nan, math.nan)
    ka, kb = list(sa), list(sb)
    point = _mean_curve_slope(sa, ka) - _mean_curve_slope(sb, kb)
    if len(ka) < 2 or len(kb) < 2:
        # A side with one chain resamples to itself → degenerate CI; report the point, CI n/a.
        return (point, math.nan, math.nan)
    rng = np.random.default_rng(seed)
    diffs = []
    for _ in range(n_boot):
        da = _mean_curve_slope(sa, list(rng.choice(ka, len(ka), replace=True)))
        db = _mean_curve_slope(sb, list(rng.choice(kb, len(kb), replace=True)))
        if not (math.isnan(da) or math.isnan(db)):
            diffs.append(da - db)
    if not diffs:
        return (point, math.nan, math.nan)
    lo, hi = np.percentile(diffs, [2.5, 97.5])
    return (point, float(lo), float(hi))


def _rankdata(a: np.ndarray) -> np.ndarray:
    a = np.asarray(a, dtype=float)
    order = a.argsort()
    ranks = np.empty(len(a), dtype=float)
    ranks[order] = np.arange(1, len(a) + 1)
    _, inv, cnt = np.unique(a, return_inverse=True, return_counts=True)
    sums = np.zeros(len(cnt))
    np.add.at(sums, inv, ranks)
    return (sums / cnt)[inv]


def _spearman(x: np.ndarray, y: np.ndarray) -> float:
    if len(x) < 3:
        return math.nan
    rx, ry = _rankdata(x), _rankdata(y)
    if rx.std() == 0 or ry.std() == 0:
        return math.nan
    return float(np.corrcoef(rx, ry)[0, 1])


def _informative(vals: list[float]) -> int:
    if not vals:
        return 0
    counts = Counter(vals)
    return len(vals) - counts.most_common(1)[0][1]


def spearman_ci(rows: list[dict], xf: str, yf: str, n_boot: int = 1000, seed: int = 0):
    by_chain: dict[int, list[tuple[float, float]]] = defaultdict(list)
    for r in rows:
        xv, yv = _f(r.get(xf, "")), _f(r.get(yf, ""))
        if not (math.isnan(xv) or math.isnan(yv)):
            by_chain[int(r["chain"])].append((xv, yv))
    chains = [c for c in by_chain if by_chain[c]]
    pts = [p for c in chains for p in by_chain[c]]
    n = len(pts)
    k = _informative([p[1] for p in pts])
    if n < 5 or k < MIN_EVENTS:
        return (math.nan, math.nan, math.nan, n, k)
    rho = _spearman(np.array([p[0] for p in pts]), np.array([p[1] for p in pts]))
    rng = np.random.default_rng(seed)
    boots = []
    for _ in range(n_boot):
        sample = rng.choice(chains, len(chains), replace=True)
        pp = [p for c in sample for p in by_chain[c]]
        if len(pp) >= 5:
            b = _spearman(np.array([p[0] for p in pp]), np.array([p[1] for p in pp]))
            if not math.isnan(b):
                boots.append(b)
    if not boots:
        return (rho, math.nan, math.nan, n, k)
    lo, hi = np.percentile(boots, [2.5, 97.5])
    return (rho, float(lo), float(hi), n, k)


def phase_means(rows: list[dict], field: str):
    order = ["early", "mid", "late"]
    acc = defaultdict(list)
    for r in rows:
        v = _f(r.get(field))
        if not math.isnan(v):
            acc[str(r.get("phase", "")).lower()].append(v)
    return order, [float(np.mean(acc[p])) if acc[p] else math.nan for p in order]


def scored(rows: list[dict]) -> list[dict]:
    """Rows whose gate returned a verdict (gate-invalid checkpoints carry no correctness)."""
    return [r for r in rows if not _b(r.get("gate_invalid"))]


def evoscore(rows: list[dict], gamma: float) -> float:
    per_chain = defaultdict(list)
    for r in scored(rows):
        per_chain[int(r["chain"])].append((int(r["checkpoint"]), 1.0 if _b(r.get("strict_pass")) else 0.0))
    scores = []
    for _c, pairs in per_chain.items():
        pairs.sort()
        num = sum(gamma ** i * v for i, (_, v) in enumerate(pairs))
        den = sum(gamma ** i for i, _ in enumerate(pairs))
        if den > 0:
            scores.append(num / den)
    return float(np.mean(scores)) if scores else math.nan


def zero_regression_rate(rows: list[dict], field: str = "regressions") -> float:
    per_chain = defaultdict(int)
    seen = set()
    for r in scored(rows):
        c = int(r["chain"])
        seen.add(c)
        per_chain[c] += _i0(r.get(field))
    if not seen:
        return math.nan
    return sum(1 for c in seen if per_chain[c] == 0) / len(seen)


def regression_summary(rows: list[dict]) -> dict:
    graded = scored(rows)
    total = sum(int(_f(r.get("regressions")) or 0) for r in graded)
    true = sum(int(_f(r.get("true_regressions")) or 0) for r in graded)
    ad = sum(int(_f(r.get("anchor_drift")) or 0) for r in graded)
    bl = sum(int(_f(r.get("behaviour_loss")) or 0) for r in graded)
    sp = sum(int(_f(r.get("seed_path")) or 0) for r in graded)
    n_mut = sum(1 for r in graded if str(r.get("checkpoint_type", "")).strip() == "mutative")
    unsat = sum(_i0(r.get("unsatisfied_replacement")) for r in graded)
    return {"total": total, "true": true, "intended": total - true, "mutative_cps": n_mut,
            "invalid_gates": len(rows) - len(graded),
            "unsatisfied_replacement": unsat,
            "anchor_drift": ad, "behaviour_loss": bl, "seed_path": sp}


PLOT_FIELDS = [
    ("strict_pass", "Strict pass (all selected specs green)"),
    ("regressions", "Regressions per checkpoint"),
    ("true_regressions", "True regressions (excl. intended mutations)"),
    ("normalized_change", "Normalized change (SWE-CI)"),
    ("cost_usd", "Agent cost per checkpoint (USD)"),
    # Structural erosion / impact, PER LAYER (DESIGN.md §8) — separate series, never compared
    # across layers (front-end is file-scope, backend is class-scope).
    ("frontend_erosion", "Front-end erosion (TS)"),
    ("backend_erosion", "Backend erosion (Java)"),
    ("frontend_impact_composite", "Front-end blast-radius impact (TS)"),
    ("backend_impact_composite", "Backend blast-radius impact (Java)"),
    # Declaration-free co-metrics (no shared_surfaces list, no parser) — the pair that compares
    # across stacks: which files the run keeps reopening, and how much settled code it destroys.
    ("frontend_hot_share", "Front-end churn in its 3 hottest files (share)"),
    ("backend_hot_share", "Backend churn in its 3 hottest files (share)"),
    ("frontend_reedit_lines_rate", "Front-end settled lines replaced (share of lines touched)"),
    ("backend_reedit_lines_rate", "Backend settled lines replaced (share of lines touched)"),
    ("frontend_reedit_age_mean", "Front-end age of replaced lines (checkpoints)"),
    ("backend_reedit_age_mean", "Backend age of replaced lines (checkpoints)"),
    # Deep metrics (harness.deep_metrics). DUPLICATION is the counter-hypothesis for an additive
    # architecture: adding a file instead of editing one is only better if the file is not a copy.
    ("frontend_dup_density", "Front-end duplicated lines (share of LOC)"),
    ("backend_dup_density", "Backend duplicated lines (share of LOC)"),
    ("frontend_dup_evolved_density", "Front-end duplication in the evolving footprint"),
    ("backend_dup_evolved_density", "Backend duplication in the evolving footprint"),
    ("frontend_dup_cross_area_pairs", "Front-end cross-feature clone pairs"),
    ("frontend_verbosity", "Front-end verbosity (clone or smell lines / LOC)"),
    ("backend_verbosity", "Backend verbosity (clone or smell lines / LOC)"),
    # Role-comparable entry surface, rather than whichever file happens to be heaviest.
    ("frontend_wmc_handler", "Front-end WMC of the entry surface"),
    ("backend_wmc_handler", "Backend WMC of the entry surface"),
    ("frontend_erosion_handler", "Front-end erosion of the entry surface"),
    ("backend_erosion_handler", "Backend erosion of the entry surface"),
    ("frontend_existing_fns_modified", "Front-end pre-existing functions disturbed"),
    ("backend_existing_fns_modified", "Backend pre-existing functions disturbed"),
    # The declared additive unit: count rising while size stays flat is the healthy shape.
    ("frontend_fnpkg_count", "Front-end additive units declared"),
    ("frontend_fnpkg_nloc_max", "Front-end largest additive unit (NLOC)"),
    # Comprehension load per wired node, and how much of it each node owns alone.
    ("backend_node_cc_median", "Backend CC reachable from one node (median)"),
    ("backend_node_exclusive_share", "Backend node-exclusive CC share"),
    # Contract check, not an erosion measure: files the STACK declares frozen (shared_surfaces).
    ("frontend_boundary", "Front-end boundary violations"),
    ("backend_boundary", "Backend boundary violations"),
]


def plot_metric(groups: dict, field: str, title: str, out_path: str) -> None:
    if not HAVE_MPL:
        return
    plt.figure(figsize=(7, 4.2))
    any_line = False
    for cond, rows in sorted(groups.items()):
        cs = series_by_chain(rows, field)
        if not cs:
            continue
        acc = _bucket_by_checkpoint(cs)
        ks = sorted(acc)
        if not ks:
            continue
        mean = [np.mean(acc[k]) for k in ks]
        sd = [np.std(acc[k]) for k in ks]
        line, = plt.plot(ks, mean, marker="o", label=cond)
        plt.fill_between(ks, np.array(mean) - np.array(sd), np.array(mean) + np.array(sd),
                         alpha=0.15, color=line.get_color())
        any_line = True
    if not any_line:
        plt.close()
        return
    plt.title(title)
    plt.xlabel("checkpoint")
    plt.ylabel(field)
    plt.legend(fontsize=8)
    plt.tight_layout()
    plt.savefig(out_path, dpi=130)
    plt.close()


# ---------------------------------------------------------------------------


def _fmt_ci(t) -> str:
    p, lo, hi = t
    if any(math.isnan(x) for x in (p, lo, hi)):
        return f"{p:+.4f} (CI n/a)" if not math.isnan(p) else "n/a"
    excl = "excludes 0" if (lo > 0 or hi < 0) else "includes 0"
    return f"{p:+.4f} [{lo:+.4f}, {hi:+.4f}] ({excl})"


# ── Pre-declared expectations ─────────────────────────────────────────────────────────────────
# What each metric is PREDICTED to do, declared in code so a run marks its own disconfirmations.
# Without this, any result can be narrated after the fact: a metric that moves the right way is
# evidence, one that does not gets explained away. Ported from the REST arm, which puts it
# plainly — "declaring these BEFORE reading the run is what makes the counter-signal section
# meaningful".
#
# HONESTY NOTE, which matters more than the mechanism: the four runs already recorded here
# (react and tanstack x gated and just-solve) were read BEFORE these entries were written, so for
# those runs the marks are DESCRIPTIVE, not confirmatory. The first genuine test of these
# declarations is the next run — tanstack-spring, tanstack-mixed, htmx-*, angular-*. Saying so is
# the point; a pre-registration backdated over data it was derived from is worse than none.
#
# Each entry is (expected sign, dimension) for the BETWEEN-CONDITION comparison that analyze
# computes, oriented `gated - just-solve`:
#     +1  gated is HIGHER       -1  gated is LOWER       0  no difference predicted
#     "slope"  the trajectory claim   "level"  the end-state claim   "both"  both
# The dimension is not decoration: testing a level claim as a slope is a category error that
# manufactures a false counter-signal.
GATE_EXPECTATION = {
    # The gate's OWN target. impact_gate.cognitive_max is a declared bound, so gated runs must
    # sit below it and ungated runs are free to exceed it.
    "backend_pmd_cognitive_max": (-1, "level"),
    "backend_pmd_cognitive_mean": (-1, "level"),
    "frontend_pmd_cognitive_max": (-1, "level"),
    # Consequences of bounding per-method complexity: fewer paths, flatter peaks, and no single
    # class becoming the dump. NPath is the sharpest — it is super-linear in nesting.
    "backend_pmd_npath_max": (-1, "level"),
    "backend_pmd_cyclo_max": (-1, "level"),
    "backend_pmd_god_classes": (-1, "level"),
    "backend_wmcdist_class_gini": (-1, "level"),
    "backend_wmc_max": (-1, "level"),
    # AMOUNT is conserved: a complexity control redistributes work, it does not delete the
    # feature's inherent complexity. Predicting NO difference here is what makes the claim
    # falsifiable — a gate that lowered the TOTAL would be suspicious, not impressive.
    "backend_pmd_cognitive_total": (0, "level"),
    "backend_pmd_cyclo_total": (0, "level"),
    "backend_ck_wmc_total": (0, "level"),
    # Cost: the gate fires rarely, so no material price is predicted.
    "cost_usd": (0, "both"),
    # Downstream correctness: NOT predicted to improve. The control is about comprehensibility,
    # and claiming a regression benefit it has not shown would be exactly the overreach this
    # table exists to prevent.
    "true_regressions": (0, "both"),
    "strict_pass": (0, "both"),
}

# The ARCHITECTURE claim, for the cross-arm overview, oriented `additive - mutative`
# (e.g. tanstack - react). This is the paper's thesis, stated per metric.
ARCH_EXPECTATION = {
    "frontend_impact_mutation": (-1, "both"),     # additive changes rewrite less
    "frontend_impact_addition": (0, "both"),      # and ADD about as much: the work is the same
    "frontend_erosion": (-1, "both"),
    "frontend_wmc_max": (-1, "level"),
    "frontend_wmc_handler": (-1, "both"),         # the entry surface stops growing
    "frontend_hot_share": (-1, "level"),          # churn is not concentrated in a few files
    "frontend_existing_fns_modified": (-1, "both"),
    "true_regressions": (-1, "level"),
    # The counter-hypothesis, declared as a RISK rather than a win: adding files instead of
    # editing them creates the opportunity to copy. Predicting HIGHER duplication for the
    # additive arm is what stops a duplication finding being dismissed later as noise.
    "frontend_dup_density": (+1, "level"),
    "frontend_dup_cross_area_pairs": (+1, "level"),
    "frontend_source_loc": (+1, "level"),         # more, smaller units means more lines
    "cost_usd": (+1, "level"),                    # more units means more agent work
}


def _level_mean(rows: list[dict], field: str):
    """The field's mean over every row of a group — the END-STATE half of a claim."""
    vals = [_f(r.get(field)) for r in rows]
    vals = [v for v in vals if v is not None and not math.isnan(v)]
    return (sum(vals) / len(vals)) if vals else None


def _g(v) -> str:
    return "—" if v is None or (isinstance(v, float) and math.isnan(v)) else f"{v:.4g}"


def expectation_mark(spec, observed: int) -> str:
    """"" matches | "!" contradicts | "~" predicted a difference, found none."""
    if spec is None:
        return ""
    exp, _dim = spec
    if exp == 0 and observed != 0:
        return "!"
    if exp != 0 and observed == -exp:
        return "!"
    if exp != 0 and observed == 0:
        return "~"
    return ""


# Ratio metrics, as (label, numerator field, denominator field). A ratio must be POOLED over the
# run (sum of numerators / sum of denominators), never averaged over checkpoints: per-checkpoint
# ratios are dominated by the checkpoints with a tiny denominator — a checkpoint that touched 2
# lines of existing code and replaced 1 of them contributes 0.5, the same weight as a checkpoint
# that touched 300. On the first two arms that artifact INVERTED the comparison, so the slope rows
# below (OLS on the per-checkpoint ratio, which the plots show) are not the number to quote for a
# level — this block is.
POOLED_RATIOS = [
    (f"{lyr}_reedit_lines_rate", f"{lyr}_reedit_lines_settled", f"{lyr}_reedit_lines_touched")
    for lyr in metrics.LAYERS
] + [
    (f"{lyr}_reedit_rate", f"{lyr}_reedit_prior_lines", f"{lyr}_reedit_body_lines")
    for lyr in metrics.LAYERS
]


def _num(x) -> float:
    """`_f` yields NaN for a blank/absent field, and NaN poisons a sum (and is truthy, so
    `_f(x) or 0` does NOT guard it). Treat it as 0 for accumulation."""
    v = _f(x)
    return 0.0 if math.isnan(v) else v


def pooled_ratio(rows: list[dict], num_field: str, den_field: str):
    """Sum/sum over the given rows. None when no row carried the denominator — a missing
    denominator must read BLANK, never as a zero that drags the pooled value down."""
    num = den = 0.0
    seen = False
    for r in rows:
        d = _f(r.get(den_field))
        if math.isnan(d):
            continue
        seen = True
        den += d
        num += _num(r.get(num_field))
    if not seen or den == 0:
        return None
    return num / den


def _vocabulary(exts: tuple, declared=None):
    """(classifier, categories) for a layer.

    `unit_vocabulary` from stack.yaml wins — either a built-in NAME or an inline definition, so a
    stack bringing an idiom the harness has never seen does not need a Python contribution
    (harness.class_shape.compile_vocabulary). Once two stacks share a LANGUAGE the extension stops
    being able to tell their idioms apart: Angular and React are both `.ts`.

    With nothing declared, fall back to the extension, which still separates server-rendered
    markup from a JavaScript UI from Java.
    """
    fn, cats = class_shape.compile_vocabulary(declared)
    if fn is not None:
        return fn, cats
    if any(e in (".html", ".htm") for e in exts):
        return class_shape.BUILTIN_VOCABULARIES["template"]
    if any(e in (".ts", ".tsx", ".js", ".jsx") for e in exts):
        return class_shape.BUILTIN_VOCABULARIES["react"]
    return class_shape.BUILTIN_VOCABULARIES["java"]


def _classifier_for(exts: tuple, declared: str | None = None):
    return _vocabulary(exts, declared)[0]


def _categories_for(exts: tuple, declared: str | None = None) -> list[str]:
    return _vocabulary(exts, declared)[1]


def analysis_preflight(tools: dict, layers: dict) -> list[str]:
    """Report what will and will not be computed, and REFUSE on a misconfiguration.

    The prerequisite table lives in harness.doctor (one source of truth; see preflight there).
    The POLICY is this module's: a tool left UNSET is a deliberate choice and its columns are
    blank by design, but a tool CONFIGURED and not found is a mistake — and continuing produces
    an analysis whose blanks look like findings, which is exactly how 34 duplication columns once
    read as "this stack has no duplication".

    Returns the summary.md lines, so an archived summary states what it lacked.
    """
    findings = [f for f in doctor.check_environment({"tools": tools}) if f.group == "analysis"]
    for f in findings:
        if f.status == doctor.OK:
            print(f"  tool ok     {f.name:<17} -> {f.consequence}", flush=True)
        elif f.status == doctor.BROKEN:
            print(f"  tool BROKEN {f.name:<17} -> {f.detail}", flush=True)
        else:
            print(f"  tool ABSENT {f.name:<17} -> {f.consequence}  ({f.detail})", flush=True)

    # jscpd needs a per-layer language, declared by the stack. Without it the duplication
    # metrics are skipped for that layer even though jscpd itself is present.
    extra = []
    for lyr, o in (layers or {}).items():
        if not (o or {}).get("jscpd_format"):
            extra.append(f"| `jscpd_format[{lyr}]` | **absent** — not declared in stack.yaml | "
                         f"**BLANK: dup_* and verbosity for the {lyr} layer** |")
            print(f"  tool ABSENT jscpd_format[{lyr}]  -> BLANK: dup_* and verbosity for the "
                  f"{lyr} layer  (no jscpd_format in stack.yaml)", flush=True)

    if [f for f in findings if f.status == doctor.BROKEN]:
        print("\nFATAL: a configured analysis tool cannot be found. Continuing would produce an "
              "analysis whose blank columns are indistinguishable from real zeros. Fix the paths "
              "in config.yaml (they are resolved against the harness root), or unset them to "
              "accept the blanks deliberately.", flush=True)
        raise SystemExit(2)

    lines = doctor.markdown(findings)
    if extra and lines:
        lines = lines[:-1] + extra + [""]
    return lines


def branch_audits(repo: str, run_id: str, app_cfg: dict, verbose: bool = True) -> list[str]:
    """Run the two BRANCH-level audits (base -> chain tip, one diff per chain) and return their
    summary.md sections.

    These answer what the per-checkpoint series cannot. `class_shape` asks what KIND of unit the
    run created to hold each new rule — for the front end, whether the architecture was actually
    used as designed (route / slot-contribution / query-module) or quietly bypassed (one more
    component). `cumulative_impact` collapses intermediate churn and measures only the SURVIVING
    change over every changed file, including the files `source_globs` deliberately does not
    reach (wiring YAML, SQL, config), so work pushed outside the measured scope still shows up.

    Keyed `<condition>/<layer>` so each vocabulary renders as its own column set.
    """
    globs = app_cfg.get("source_globs") or {}
    layers = app_cfg.get("layers") or {}
    shape: dict[str, list[dict]] = defaultdict(list)
    cumul: dict[str, list[dict]] = defaultdict(list)
    branches = sorted(_evolve_branches(repo, run_id))
    if verbose:
        print(f"branch audits: class-shape + cumulative-impact over {len(branches)} chain(s)",
              flush=True)
    for branch, condition, chain in branches:
        caps = _read_captures(repo, branch)
        if not caps:
            continue
        base = caps[min(caps)].get("prev_sha")   # the chain base, as recompute_rows derives it
        if not base:
            continue
        for lyr in metrics.LAYERS:
            opts = layers.get(lyr) or {}
            root = opts.get("root")
            if not root:
                continue
            key = f"{condition}/{lyr}"
            exts = tuple("." + str(e).lstrip(".") for e in (opts.get("ext") or []))
            # Dispatch on the layer's DECLARED extensions, not its name: "frontend" is .tsx in the
            # React arms and .html in the server-rendered one, and they need different
            # vocabularies. A stack says what its layers are made of (stack.yaml); this follows it.
            classify = _classifier_for(exts, opts.get("unit_vocabulary"))
            try:
                counts = class_shape.audit_branch(repo, base, branch, root, exts, classify)
                shape[key].append({"chain": chain, "total": sum(counts.values()), **dict(counts)})
            except Exception as e:                      # never let an audit abort the analysis
                print(f"    [warn] class-shape {key} chain{chain}: {e}", flush=True)
        # ONCE per chain, over the union of both layers' globs. This audit is deliberately
        # UNSCOPED — its question is what the scoped metrics cannot see — so running it per
        # layer produced two identical columns differing only in the in-scope row.
        try:
            all_globs = [g for lyr in metrics.LAYERS for g in (globs.get(lyr) or [])]
            r = cumulative_impact.audit_branch(repo, base, branch, all_globs)
            r.update(arm=condition, strategy=condition, chain=chain, branch=branch)
            cumul[condition].append(r)
        except Exception as e:
            print(f"    [warn] cumulative-impact {condition} chain{chain}: {e}", flush=True)
        if verbose:
            print(f"  {condition}/chain{chain}: audited", flush=True)

    out: list[str] = []
    for lyr, title in (
        ("frontend", "## Unit shape, front end (what kind of unit holds a new rule)"),
        ("backend", "## Class shape, backend (what kind of class holds a new rule)"),
    ):
        sub = {k: v for k, v in shape.items() if k.endswith("/" + lyr)}
        if sub:
            lopts = layers.get(lyr) or {}
            exts = tuple("." + str(e).lstrip(".") for e in (lopts.get("ext") or []))
            out += class_shape.markdown_section(
                sub, _categories_for(exts, lopts.get("unit_vocabulary")), title)
    if cumul:
        out += cumulative_impact.markdown_section(dict(cumul))
    return out


def write_summary(rows: list[dict], run_id: str, gammas: list[float], out_dir: str,
                  extra_sections: list[str] | None = None) -> str:
    by_cond: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        by_cond[group_key(r)].append(r)

    L = [f"# ui-long-degradation-test — run `{run_id}`", "",
         f"- conditions: {', '.join(sorted(by_cond))}",
         f"- chains: {sorted({int(r['chain']) for r in rows})}",
         f"- checkpoints: {sorted({int(r['checkpoint']) for r in rows})}",
         f"- rows: {len(rows)}  (gate-invalid: {sum(1 for r in rows if _b(r.get('gate_invalid')))})",
         "", "> Correctness headline + per-layer structural erosion/impact (front-end TS at "
         "file-scope, backend Java at class-scope) — separate series, never compared across "
         "layers (DESIGN.md §8).", ""]

    for cond in sorted(by_cond):
        cr = by_cond[cond]
        graded = scored(cr)
        L += [f"## condition `{cond}`", "",
              f"- checkpoints graded: {len(graded)} / {len(cr)}",
              f"- strict-pass: {sum(1 for r in graded if _b(r.get('strict_pass')))}/{len(graded)}",
              f"- Zero-Regression Rate: {zero_regression_rate(cr):.3f}",
              "- EvoScore: " + ", ".join(f"γ={g}: {evoscore(cr, g):.3f}" for g in gammas)]
        rs = regression_summary(cr)
        L += [f"- regressions: total={rs['total']} true={rs['true']} intended={rs['intended']} "
              f"(mutative checkpoints={rs['mutative_cps']}, invalid gates={rs['invalid_gates']})",
              f"- regression reasons: anchor_drift={rs['anchor_drift']} "
              f"behaviour_loss={rs['behaviour_loss']} seed_path={rs['seed_path']}",
              f"- unsatisfied replacements: {rs['unsatisfied_replacement']} (updated prior "
              f"specs a mutative checkpoint shipped and never satisfied — invisible to "
              f"`regressions`, which needs a test to have passed first)",
              "", "degradation slopes (OLS on checkpoint index; chain-bootstrap 95% CI):"]
        for field, _label in PLOT_FIELDS:
            L.append(f"  - {field}: {_fmt_ci(bootstrap_slope(series_by_chain(cr, field)))}")
        L += ["", "pooled ratios (sum numerator / sum denominator over the run — quote THESE "
              "for a level, not the per-checkpoint slopes above):"]
        chains = sorted({int(r["chain"]) for r in cr})
        for field, num_f, den_f in POOLED_RATIOS:
            overall = pooled_ratio(cr, num_f, den_f)
            if overall is None:
                L.append(f"  - {field}: — (no data)")
                continue
            per = []
            for ch in chains:
                v = pooled_ratio([r for r in cr if int(r["chain"]) == ch], num_f, den_f)
                per.append("—" if v is None else f"{v:.4f}")
            tot_n = sum(_num(r.get(num_f)) for r in cr)
            tot_d = sum(_num(r.get(den_f)) for r in cr)
            L.append(f"  - {field}: {overall:.4f}  (per chain: {' / '.join(per)};"
                     f" {tot_n:.0f} of {tot_d:.0f} lines)")

        L += ["", "cost/effort:",
              f"  - total agent cost: ${sum(_num(r.get('cost_usd')) for r in cr):.4f}",
              f"  - total turns: {int(sum(_num(r.get('num_turns')) for r in cr))}", ""]

    conds = sorted(by_cond)
    if len(conds) >= 2:
        a, b = conds[0], conds[1]
        # Orient the comparison `gated - just-solve` when both are present, so the sign matches
        # GATE_EXPECTATION regardless of alphabetical order.
        if {"gated", "just-solve"} <= set(conds):
            a, b = "gated", "just-solve"
        L += [f"## between-condition: {a} − {b}  (paired chain-bootstrap)", "",
              "`exp` is the PRE-DECLARED expected direction (GATE_EXPECTATION); `!` marks a result",
              "that contradicts it and `~` one where a predicted difference did not appear. Both are",
              "collected below. A direction only counts when its CI excludes 0 — an unresolved",
              "difference is not a contradiction.", "",
              "| metric | slope diff | CI low | CI high | excl 0 | level diff | exp |",
              "|---|---:|---:|---:|:--:|---:|:--:|"]
        counter = []
        for field, _label in PLOT_FIELDS + [(f, f) for f in sorted(GATE_EXPECTATION)
                                            if f not in {x for x, _ in PLOT_FIELDS}]:
            m, lo, hi = bootstrap_diff_slope(by_cond[a], by_cond[b], field)
            la, lb = _level_mean(by_cond[a], field), _level_mean(by_cond[b], field)
            ldiff = (la - lb) if (la is not None and lb is not None) else None
            if math.isnan(m) and ldiff is None:
                continue
            excl = "yes" if (not math.isnan(lo) and (lo > 0 or hi < 0)) else "no"
            spec = GATE_EXPECTATION.get(field)
            # The declared dimension decides WHICH observation is judged; judging a level claim
            # by its slope is a category error that manufactures false counter-signals.
            if spec is None:
                mark = ""
            else:
                dim = spec[1]
                # LEVEL observation, materiality-gated: a gap below LEVEL_MATERIAL_REL of the larger
                # magnitude is NOT a direction (untested here — no cross-condition significance test
                # on levels), so a trivial difference is not flagged as a counter-signal.
                lvl = 0
                if ldiff and la is not None and lb is not None:
                    scale = max(abs(la), abs(lb))
                    if scale > 0 and abs(ldiff) / scale >= LEVEL_MATERIAL_REL:
                        lvl = 1 if ldiff > 0 else -1
                if dim == "slope":
                    obs = 0 if (excl != "yes" or m == 0) else (1 if m > 0 else -1)
                elif dim == "level":
                    obs = lvl
                else:
                    o1 = 0 if (excl != "yes" or m == 0) else (1 if m > 0 else -1)
                    obs = o1 if o1 == lvl else (o1 or lvl)
                mark = expectation_mark(spec, obs)
                if mark:
                    counter.append((field, spec, m, ldiff, mark))
            exp_cell = "" if spec is None else f"{'+' if spec[0] > 0 else ('-' if spec[0] < 0 else '0')}{mark}"
            L.append(f"| {field} | {_g(m)} | {_g(lo)} | {_g(hi)} | {excl} "
                     f"| {_g(ldiff)} | {exp_cell} |")
        L.append("")
        if counter:
            L += ["### counter-signals (results against the declared expectation)", "",
                  "These are the rows the harness itself flags as not matching what was predicted.",
                  "They are listed here so the cost of a claim is reported with it rather than",
                  "left for a reader to find.", "",
                  "| metric | predicted | observed | slope diff | level diff |",
                  "|---|:--:|:--:|---:|---:|"]
            for field, spec, m, ldiff, mark in counter:
                pred = {1: "higher", -1: "lower", 0: "no difference"}[spec[0]]
                seen = "no difference" if mark == "~" else "the opposite"
                L.append(f"| {field} | {pred} ({spec[1]}) | {seen} | {_g(m)} | {_g(ldiff)} |")
            L.append("")

    L += (extra_sections or [])
    out = os.path.join(out_dir, "summary.md")
    with open(out, "w") as fh:
        fh.write("\n".join(L) + "\n")
    return out


def write_csv(rows: list[dict], out_dir: str) -> str:
    path = os.path.join(out_dir, "records.concat.csv")
    # base correctness fields first, then any structural-metric columns present (sorted).
    extra = sorted({k for r in rows for k in r} - set(CSV_FIELDS))
    fieldnames = CSV_FIELDS + extra
    with open(path, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow(r)
    return path


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--repo", required=True,
                    help="the STACK repo whose evolve/<run_id>/... branches to analyse "
                         "(~/officehq-<frontend>-<backend>); never configured, see run_experiment")
    ap.add_argument("--run-id", help="which run to analyze (default: latest on the branches)")
    ap.add_argument("--out", help="output dir (default: results/<run_id>/analysis under the harness)")
    ap.add_argument("--gammas", default="1,1.5,2")
    args = ap.parse_args()

    with open(args.config) as fh:
        cfg = yaml.safe_load(fh)
    if (cfg.get("app") or {}).get("repo"):
        raise SystemExit(
            f"config {args.config}: app.repo must NOT be set — pass the stack repo with --repo.")
    repo, origin = stack_repo(args.repo)
    print("stack:", stack_label(repo, origin, (cfg.get("app") or {}).get("base_ref", "")),
          flush=True)
    # The layer source roots come from the STACK (stack.yaml at base_ref), not this config, so one
    # harness reports honestly on stacks whose layers live elsewhere or are a different language.
    cfg["app"]["source_globs"], _prov = stack_layers(
        repo, cfg["app"]["base_ref"], (cfg["app"].get("source_globs") or None),
        expected=metrics.LAYERS)
    # The stack also declares each layer's deep-metric anchors (jscpd language, entry surface,
    # additive unit, wiring) — see harness.stack_layer_options.
    cfg["app"]["layers"] = stack_layer_options(repo, cfg["app"]["base_ref"])
    print("layers:", _prov, cfg["app"]["source_globs"], flush=True)

    run_id = args.run_id or _latest_run_id(repo)
    if not run_id:
        print("no evolve/<run_id>/... branches found in", repo, flush=True)
        return 1
    print(f"analyzing run {run_id} in {repo}", flush=True)

    # Expand ${VARS}/~ in the metrics tool paths (pmd/ck/java) so a config path like
    # ${HOME}/.../pmd resolves — otherwise the CK/PMD blocks silently produce blank columns.
    _hroot = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    # Tool paths in config.yaml are written relative to the HARNESS root ("tools/node_modules/...",
    # "pmd-rules/..."), but every tool is launched with cwd set to the checkpoint WORKTREE, where a
    # relative path does not resolve — jscpd/ast-grep then raise FileNotFoundError and their metrics
    # come back blank, which looks exactly like "this stack has no duplication". Absolutise them.
    def _tool(v):
        if not isinstance(v, str) or not v:
            return v
        v = os.path.expanduser(os.path.expandvars(v))
        # A BARE command name (java, jscpd, sg) must be left alone so PATH lookup still works:
        # absolutising it against the harness root produces <harness>/java, which does not exist,
        # and the tool then silently does not run. Only a value carrying a path separator is a
        # path to anchor.
        if os.sep not in v and (os.altsep is None or os.altsep not in v):
            return v
        return v if os.path.isabs(v) else os.path.join(_hroot, v)

    tools = {k: _tool(v) for k, v in (cfg.get("tools") or {}).items()}
    tool_lines = analysis_preflight(tools, cfg["app"].get("layers") or {})
    rows = recompute_rows(repo, run_id, cfg["app"], tools)
    if not rows:
        print("no capture found for run", run_id, flush=True)
        return 1

    harness_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = args.out or os.path.join(harness_root, "results", run_id, "analysis")
    os.makedirs(out_dir, exist_ok=True)
    gammas = [float(g) for g in args.gammas.split(",") if g.strip()]

    print(f"writing csv -> {out_dir}", flush=True)
    csv_path = write_csv(rows, out_dir)
    audits = tool_lines + branch_audits(repo, run_id, cfg["app"])
    print("writing summary (slopes + chain-bootstrap CIs) ...", flush=True)
    summary_path = write_summary(rows, run_id, gammas, out_dir, extra_sections=audits)

    by_cond: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        by_cond[group_key(r)].append(r)
    print(f"plotting {len(PLOT_FIELDS)} metric(s)"
          + ("" if HAVE_MPL else "  (matplotlib missing: skipped)"), flush=True)
    for i_pf, (field, label) in enumerate(PLOT_FIELDS, 1):
        print(f"  [{i_pf}/{len(PLOT_FIELDS)}] {field}", flush=True)
        plot_metric(by_cond, field, label, os.path.join(out_dir, f"{field}.png"))

    print(f"wrote {summary_path}", flush=True)
    print(f"wrote {csv_path}", flush=True)
    print("\n" + open(summary_path).read())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

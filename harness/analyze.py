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
import subprocess
import tempfile
from collections import Counter, defaultdict

import numpy as np
import yaml

from . import correctness, expand_path, metrics
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


def _f(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return math.nan


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
            outcome.reasons[d["test_id"]] = correctness._classify(d, mutated)
    return outcome


def _metrics_row(repo: str, commit_sha: str, prev_sha: str | None, app_cfg: dict) -> dict:
    """Structural erosion/impact for a checkpoint: materialise its agent commit in a THROWAWAY
    worktree and run metrics.compute_all over it (front-end TS + backend Java, per layer;
    DESIGN.md §8). Resilient — any failure returns {} so one bad checkpoint can't abort analyze."""
    if not commit_sha:
        return {}
    tmp = tempfile.mkdtemp(prefix="ana-metrics-")
    try:
        r = subprocess.run(["git", "-C", repo, "worktree", "add", "--detach", "-f", tmp, commit_sha],
                           capture_output=True, text=True)
        if r.returncode != 0:
            return {}
        return metrics.compute_all(tmp, app_cfg, {}, commit_sha, prev_ref=(prev_sha or None))
    except Exception as e:  # never let a metrics failure abort the run
        print(f"    [warn] metrics failed for {commit_sha[:8]}: {e}")
        return {}
    finally:
        subprocess.run(["git", "-C", repo, "worktree", "remove", "--force", tmp],
                       capture_output=True, text=True)
        subprocess.run(["rm", "-rf", tmp], capture_output=True, text=True)


def recompute_rows(repo: str, run_id: str, app_cfg: dict | None = None) -> list[dict]:
    """One row per (chain, checkpoint), rebuilt from capture and re-scored. prior_passing
    accumulates within a chain so regressions / normalized_change are relative to the last
    graded checkpoint (a gate-invalid checkpoint does not advance the baseline). When app_cfg
    is given, structural metrics (metrics.compute_all) are merged in from the checkpoint commit."""
    rows: list[dict] = []
    for branch, condition, chain in sorted(_evolve_branches(repo, run_id)):
        caps = _read_captures(repo, branch)
        if not caps:
            continue
        n = max(caps)
        prior_passing: set[str] = set()
        for k in sorted(caps):
            rec = caps[k]
            outcome = _outcome_from_capture(rec)
            mutated = [int(m) for m in (rec.get("mutates") or [])]
            scored_row = correctness.outcome_row(outcome, prior_passing, mutated)
            ag = rec.get("agent") or {}
            row = {
                "run_id": run_id, "branch": branch, "condition": condition, "chain": chain,
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
            # Structural erosion/impact (per layer) from the checkpoint commit (DESIGN.md §8).
            if app_cfg:
                row.update(_metrics_row(repo, rec.get("commit_sha") or "",
                                        rec.get("prev_sha"), app_cfg))
            if not outcome.gate_invalid:
                prior_passing = outcome.passing
            rows.append(row)
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
        per_chain[c] += int(_f(r.get(field)) or 0)
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
    return {"total": total, "true": true, "intended": total - true, "mutative_cps": n_mut,
            "invalid_gates": len(rows) - len(graded),
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


def write_summary(rows: list[dict], run_id: str, gammas: list[float], out_dir: str) -> str:
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
              "", "degradation slopes (OLS on checkpoint index; chain-bootstrap 95% CI):"]
        for field, _label in PLOT_FIELDS:
            L.append(f"  - {field}: {_fmt_ci(bootstrap_slope(series_by_chain(cr, field)))}")
        L += ["", "cost/effort:",
              f"  - total agent cost: ${sum(_f(r.get('cost_usd')) or 0 for r in cr):.4f}",
              f"  - total turns: {int(sum(_f(r.get('num_turns')) or 0 for r in cr))}", ""]

    conds = sorted(by_cond)
    if len(conds) >= 2:
        a, b = conds[0], conds[1]
        L += [f"## between-condition: slope({a}) − slope({b})  (paired chain-bootstrap)", ""]
        for field, _label in PLOT_FIELDS:
            L.append(f"  - {field}: {_fmt_ci(bootstrap_diff_slope(by_cond[a], by_cond[b], field))}")
        L.append("")

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
    ap.add_argument("--run-id", help="which run to analyze (default: latest on the branches)")
    ap.add_argument("--out", help="output dir (default: results/<run_id>/analysis under the harness)")
    ap.add_argument("--gammas", default="1,1.5,2")
    args = ap.parse_args()

    with open(args.config) as fh:
        cfg = yaml.safe_load(fh)
    repo = expand_path(cfg["app"]["repo"], "app.repo")

    run_id = args.run_id or _latest_run_id(repo)
    if not run_id:
        print("no evolve/<run_id>/... branches found in", repo)
        return 1
    print(f"analyzing run {run_id} in {repo}")

    rows = recompute_rows(repo, run_id, cfg["app"])
    if not rows:
        print("no capture found for run", run_id)
        return 1

    harness_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = args.out or os.path.join(harness_root, "results", run_id, "analysis")
    os.makedirs(out_dir, exist_ok=True)
    gammas = [float(g) for g in args.gammas.split(",") if g.strip()]

    csv_path = write_csv(rows, out_dir)
    summary_path = write_summary(rows, run_id, gammas, out_dir)

    by_cond: dict[str, list[dict]] = defaultdict(list)
    for r in rows:
        by_cond[group_key(r)].append(r)
    for field, label in PLOT_FIELDS:
        plot_metric(by_cond, field, label, os.path.join(out_dir, f"{field}.png"))

    print(f"wrote {summary_path}")
    print(f"wrote {csv_path}")
    print("\n" + open(summary_path).read())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

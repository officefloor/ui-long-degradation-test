"""Cross-arm overview: every analysed run on one set of graphs.

`analyze` answers one run at a time and writes results/<run_id>/analysis. This reads every
such directory back, groups the rows, and plots the arms against each other — which is the
only way to see whether an architecture difference is larger than the spread between runs
of the SAME architecture.

Grouping. A row carries its own identity (`stack`, `run_id`, `condition`, `chain`), so the
series label is built from the data rather than from directory names:

  * one series per (stack, condition) — the comparison that means something, since a
    condition change alters the prompt as well as the gate;
  * when the same (stack, condition) appears under MORE THAN ONE run_id, the run id joins
    the label instead of being averaged away. Two runs of one arm are a repeat measurement,
    and collapsing them would hide the very spread this view exists to show;
  * chains within a series ARE averaged per checkpoint, exactly as `analyze` does.

Nothing is recomputed: this is a pure read of the CSVs `analyze` already wrote, so it costs
seconds and can be re-run after any single run is re-analysed.

Run:  .venv/bin/python -m harness.overview [--results results] [--out results/overview]
"""
from __future__ import annotations

import argparse
import csv
import glob
import math
import os
from collections import defaultdict

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    HAVE_MPL = True
except Exception:                                        # noqa: BLE001 - optional
    HAVE_MPL = False

# The headline series. Deliberately short: an overview that plots 34 metrics is not an
# overview. Correctness first, then the structural claims, then the cost of making them.
FIELDS = [
    ("strict_pass", "Strict pass (per checkpoint)"),
    ("true_regressions", "True regressions"),
    ("frontend_erosion", "Front-end erosion"),
    ("frontend_impact_composite", "Front-end blast-radius impact"),
    ("frontend_impact_mutation", "Front-end impact: MUTATION"),
    ("frontend_impact_addition", "Front-end impact: ADDITION"),
    ("frontend_wmc_max", "Front-end worst-file WMC"),
    ("frontend_wmc_handler", "Front-end entry-surface WMC"),
    ("frontend_hot_share", "Front-end churn in its 3 hottest files"),
    ("frontend_dup_density", "Front-end duplicated lines (share of LOC)"),
    ("backend_erosion", "Backend erosion"),
    ("backend_impact_composite", "Backend blast-radius impact"),
    ("cost_usd", "Agent cost per checkpoint (USD)"),
]


# The correctness columns are written as "True"/"False", not 1/0. float() rejects those, so a
# bare numeric coercion silently dropped strict_pass — the headline correctness series — from
# the overview entirely: 12 graphs where 13 were asked for, and no error to say which.
_TRUE = {"true", "yes", "1"}
_FALSE = {"false", "no", "0"}


def _f(x):
    if isinstance(x, str):
        t = x.strip().lower()
        if t in _TRUE:
            return 1.0
        if t in _FALSE:
            return 0.0
    try:
        v = float(x)
    except (TypeError, ValueError):
        return None
    return None if math.isnan(v) else v


def load(results_dir: str) -> list[dict]:
    """Every analysed row under results/*/analysis/records.concat.csv."""
    rows: list[dict] = []
    for path in sorted(glob.glob(os.path.join(results_dir, "*", "analysis",
                                               "records.concat.csv"))):
        run_from_path = os.path.basename(os.path.dirname(os.path.dirname(path)))
        with open(path) as fh:
            for r in csv.DictReader(fh):
                # Pre-`stack` CSVs exist; fall back to the directory so an old run still
                # appears, labelled honestly as unknown rather than silently dropped.
                r.setdefault("stack", "")
                if not (r.get("stack") or "").strip():
                    r["stack"] = "(unknown stack)"
                r.setdefault("run_id", run_from_path)
                rows.append(r)
    return rows


def series_labels(rows: list[dict]) -> dict[tuple, str]:
    """(stack, condition, run_id) -> label. The run id appears ONLY when it is needed to
    tell two series apart, so the common case stays readable."""
    by_sc: dict[tuple, set] = defaultdict(set)
    for r in rows:
        by_sc[(r["stack"], r.get("condition") or "?")].add(r.get("run_id") or "?")
    out: dict[tuple, str] = {}
    for (stack, cond), runs in by_sc.items():
        for run in runs:
            short = stack.replace("officehq-", "")
            out[(stack, cond, run)] = (f"{short} / {cond}" if len(runs) == 1
                                       else f"{short} / {cond} @ {run}")
    return out


def curves(rows: list[dict], field: str) -> dict[str, list[tuple[int, float]]]:
    """label -> [(checkpoint, mean across chains)], chains averaged as `analyze` does."""
    labels = series_labels(rows)
    acc: dict[str, dict[int, list[float]]] = defaultdict(lambda: defaultdict(list))
    for r in rows:
        v = _f(r.get(field))
        if v is None:
            continue
        try:
            cp = int(r["checkpoint"])
        except (KeyError, TypeError, ValueError):
            continue
        key = (r["stack"], r.get("condition") or "?", r.get("run_id") or "?")
        acc[labels[key]][cp].append(v)
    return {lab: [(cp, sum(vs) / len(vs)) for cp, vs in sorted(by_cp.items())]
            for lab, by_cp in acc.items() if by_cp}


def plot(rows: list[dict], field: str, title: str, out_path: str) -> bool:
    if not HAVE_MPL:
        return False
    cs = curves(rows, field)
    if not cs:
        return False
    plt.figure(figsize=(8, 4.6))
    for lab in sorted(cs):
        pts = cs[lab]
        plt.plot([p[0] for p in pts], [p[1] for p in pts], marker="", linewidth=1.5, label=lab)
    plt.title(title)
    plt.xlabel("checkpoint")
    plt.ylabel(field)
    plt.grid(alpha=0.25)
    plt.legend(fontsize=7, loc="best")
    plt.tight_layout()
    plt.savefig(out_path, dpi=120)
    plt.close()
    return True


def _fmt(v, nd=4):
    return "—" if v is None else f"{v:.{nd}g}"


def summarise(rows: list[dict]) -> list[str]:
    """A table per field: each series' mean, its final value, and how many rows it rests on."""
    labels = series_labels(rows)
    order = sorted(set(labels.values()))
    L = ["# Cross-arm overview", "",
         f"- series: {len(order)}", f"- rows: {len(rows)}", ""]
    L += ["| series | stack | condition | run_id | chains | checkpoints |",
          "|---|---|---|---|---:|---:|"]
    seen: dict[str, dict] = defaultdict(lambda: {"chains": set(), "cps": set()})
    meta: dict[str, tuple] = {}
    for r in rows:
        key = (r["stack"], r.get("condition") or "?", r.get("run_id") or "?")
        lab = labels[key]
        meta[lab] = key
        seen[lab]["chains"].add(r.get("chain"))
        seen[lab]["cps"].add(r.get("checkpoint"))
    for lab in order:
        stack, cond, run = meta[lab]
        L.append(f"| {lab} | {stack} | {cond} | {run} | {len(seen[lab]['chains'])} "
                 f"| {len(seen[lab]['cps'])} |")
    L.append("")
    L += ["> Mean is over every checkpoint of every chain in the series; final is the last",
          "> checkpoint's chain-mean. A blank means the series carries no value for that",
          "> field — for a server-rendered arm the parser-derived front-end columns are blank",
          "> by construction, which is not the same as zero.", ""]
    for field, title in FIELDS:
        cs = curves(rows, field)
        if not cs:
            continue
        L += [f"## {title}  (`{field}`)", "",
              "| series | mean | final | points |", "|---|---:|---:|---:|"]
        for lab in order:
            pts = cs.get(lab)
            if not pts:
                L.append(f"| {lab} | — | — | 0 |")
                continue
            vals = [v for _cp, v in pts]
            L.append(f"| {lab} | {_fmt(sum(vals) / len(vals))} | {_fmt(vals[-1])} "
                     f"| {len(pts)} |")
        L.append("")
    return L


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--results", default="results",
                    help="directory holding <run_id>/analysis/records.concat.csv (default: results)")
    ap.add_argument("--out", default=None,
                    help="output directory (default: <results>/overview)")
    args = ap.parse_args()

    rows = load(args.results)
    if not rows:
        print(f"no analysed runs under {args.results}/*/analysis/ — run harness.analyze first")
        return 1
    out_dir = args.out or os.path.join(args.results, "overview")
    os.makedirs(out_dir, exist_ok=True)

    labels = series_labels(rows)
    print(f"overview: {len(rows)} rows, {len(set(labels.values()))} series")
    for lab in sorted(set(labels.values())):
        print(f"  {lab}")

    # One CSV with every row, so the combined view is reproducible without re-reading
    # each run. `stack` leads, so a reader can always tell the arms apart.
    all_csv = os.path.join(out_dir, "records.all.csv")
    fields: list[str] = []
    for r in rows:
        for k in r:
            if k not in fields:
                fields.append(k)
    lead = [f for f in ("stack", "stack_origin", "run_id", "condition", "chain", "checkpoint")
            if f in fields]
    fields = lead + [f for f in fields if f not in lead]
    with open(all_csv, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow(r)

    n_plots = 0
    if not HAVE_MPL:
        print("  (matplotlib missing: graphs skipped)")
    for field, title in FIELDS:
        if plot(rows, field, title, os.path.join(out_dir, f"{field}.png")):
            n_plots += 1

    summary = os.path.join(out_dir, "overview.md")
    with open(summary, "w") as fh:
        fh.write("\n".join(summarise(rows)) + "\n")
    print(f"wrote {summary}")
    print(f"wrote {all_csv}")
    print(f"wrote {n_plots} graph(s) to {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

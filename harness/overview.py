"""Cross-arm overview: every analysed run on one set of graphs.

`analyze` answers one run at a time and writes results/<run_id>/analysis. This reads every
such directory back, groups the rows, and plots the arms against each other — which is the
only way to see whether an architecture difference is larger than the spread between runs
of the SAME architecture.

Grouping. A row carries its own identity (`stack`, `model`, `run_id`, `condition`, `chain`), so
the series label is built from the data rather than from directory names:

  * one series per (stack, model, condition) — the comparison that means something, since a
    condition change alters the prompt as well as the gate, and a model change swaps the agent;
  * when the same (stack, condition) appears under MORE THAN ONE model (a second agent) or
    run_id, that identifier joins the label instead of being averaged away. A second model, or a
    repeat run, is a separate measurement, and collapsing them would hide the very spread this
    view exists to show. Comparisons (`pairs`) hold the model constant on both sides;
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

from . import metric_tiers

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
    """(stack, model, condition, run_id) -> label. The model and the run id appear ONLY when
    they are needed to tell two series of the same (stack, condition) apart, so the common case
    stays readable. The model varies when a SECOND agent is run over the same arms — those are
    separate series, never averaged together."""
    info: dict[tuple, dict] = defaultdict(lambda: {"models": set(), "runs": set()})
    for r in rows:
        sc = (r["stack"], r.get("condition") or "?")
        info[sc]["models"].add(r.get("model") or "?")
        info[sc]["runs"].add(r.get("run_id") or "?")
    out: dict[tuple, str] = {}
    for r in rows:
        stack = r["stack"]
        cond = r.get("condition") or "?"
        model = r.get("model") or "?"
        run = r.get("run_id") or "?"
        sc = info[(stack, cond)]
        lab = f"{stack.replace('officehq-', '')} / {cond}"
        if len(sc["models"]) > 1:
            lab += f" / {model}"
        if len(sc["runs"]) > 1:
            lab += f" @ {run}"
        out[(stack, model, cond, run)] = lab
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
        key = (r["stack"], r.get("model") or "?", r.get("condition") or "?", r.get("run_id") or "?")
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


# ── pre-declared expectations, evaluated here because the comparisons live here ───────────────
# `analyze` runs per run_id, and a run carries ONE condition, so its between-condition section
# only fires when two conditions were deliberately filed under one run id. The comparisons that
# matter across this study — gated vs ungated for one stack, and additive vs mutative for one
# condition — are between SERIES, which is what this module holds.
#
# The declarations themselves live in harness.analyze (GATE_EXPECTATION, ARCH_EXPECTATION) so
# there is one copy; see the honesty note there about which runs they can legitimately be said
# to predict.
# A level difference smaller than this fraction of the larger magnitude is not treated as a
# direction. 10% is a judgement, stated here so it can be argued with rather than buried.
MATERIAL_REL = 0.10


# ── Pre-registered cross-arm contrasts ────────────────────────────────────────────────────────
# With 8 arms, most stack pairs vary MORE THAN ONE thing (framework AND backend, say) and could
# attribute a difference to neither — so the valid comparisons are declared here rather than
# derived from the stack names. Each isolates ONE dimension by holding everything else constant,
# and A is oriented as the treatment / more-additive side so a declared sign reads as A − B:
#   architecture : additive vs mutative FRONT END, same framework + backend — the paper's thesis
#   framework    : React vs Angular, same backend
#   paradigm     : SPA vs server-rendered hypermedia (htmx), same backend
#   backend      : OfficeFloor (or the method-split mix) vs plain Spring, same front end
# Only `architecture` carries a directional expectation (ARCH_EXPECTATION, a set of FRONT-END
# metrics); framework / paradigm / backend contrasts have no pre-declared per-metric direction and
# are reported descriptively — marking one would manufacture a signal the study never predicted.
# Stacks match by canonical short name (the "officehq-" prefix optional); a contrast whose two arms
# are not both present in the data is simply skipped.
CONTRASTS = [
    ("architecture", "tanstack-officefloor", "react-officefloor"),
    ("framework",    "tanstack-officefloor", "angular-officefloor"),
    ("framework",    "tanstack-spring",      "angular-spring"),
    ("paradigm",     "tanstack-officefloor", "htmx-officefloor"),
    ("paradigm",     "tanstack-spring",      "htmx-spring"),
    ("backend",      "tanstack-officefloor", "tanstack-spring"),
    ("backend",      "angular-officefloor",  "angular-spring"),
    ("backend",      "htmx-officefloor",     "htmx-spring"),
    ("backend",      "tanstack-officefloor", "tanstack-mixed"),
    ("backend",      "tanstack-spring",      "tanstack-mixed"),
]


def _short(stack: str) -> str:
    return stack.replace("officehq-", "")


def pairs(rows: list[dict]):
    """The comparisons worth judging: the pre-registered CONTRASTS, plus the `gate` control
    (same stack, gated vs just-solve). Both sides of every pair share the agent MODEL — a
    comparison that also varied the model would confound it, and cross-model is the separate
    second-agent question — so a comparison is keyed (stack, model, condition).

    Only declared contrasts and gate pairs are returned: with 8 arms most stack pairs vary more
    than one dimension and could attribute a difference to neither, so they are not formed."""
    combos: dict[str, set] = defaultdict(set)   # short stack -> {(model, condition)} present
    full_of: dict[str, str] = {}                # short stack -> full stack name as it appears
    for r in rows:
        short = _short(r["stack"])
        full_of[short] = r["stack"]
        combos[short].add((r.get("model") or "?", r.get("condition") or "?"))

    out = []
    # gate control: same stack + model, gated vs just-solve.
    conds_of: dict[tuple, set] = defaultdict(set)
    for short, mcs in combos.items():
        for (m, c) in mcs:
            conds_of[(short, m)].add(c)
    for (short, m), conds in sorted(conds_of.items()):
        if {"gated", "just-solve"} <= conds:
            full = full_of[short]
            out.append(("gate", (full, m, "gated"), (full, m, "just-solve")))

    # pre-registered cross-arm contrasts: emit once per (model, condition) present in BOTH arms.
    for kind, a_short, b_short in CONTRASTS:
        if a_short not in combos or b_short not in combos:
            continue
        for (m, c) in sorted(combos[a_short] & combos[b_short]):
            out.append((kind, (full_of[a_short], m, c), (full_of[b_short], m, c)))
    return out


def judge(rows: list[dict]) -> list[str]:
    """Every declared expectation, checked against every comparison the data supports."""
    from .analyze import ARCH_EXPECTATION, GATE_EXPECTATION, expectation_mark

    by_key: dict[tuple, list[dict]] = defaultdict(list)
    for r in rows:
        by_key[(r["stack"], r.get("model") or "?", r.get("condition") or "?")].append(r)

    def level(key, field):
        vals = [_f(r.get(field)) for r in by_key[key]]
        vals = [v for v in vals if v is not None]
        return (sum(vals) / len(vals)) if vals else None

    _HEAD = ["| metric | predicted | A | B | A − B | rel | verdict |",
             "|---|:--:|---:|---:|---:|---:|:--:|"]

    def _judge_field(a, b, field, spec):
        """One table row for a field, or None when a side carries no value (blank != 0)."""
        la, lb = level(a, field), level(b, field)
        if la is None or lb is None:
            return None
        d = la - lb
        # LEVEL only: this module has no chain bootstrap across stacks, so there is no
        # significance test and none is implied.
        #
        # That absence needs a MATERIALITY band. The REST arm counts a direction only when it
        # survives FDR, so a non-significant difference reads as "no difference"; here there
        # is no such filter, and on a continuous metric an exact 0 never occurs — so every
        # `no difference` prediction would be flagged as contradicted, which it was: cost_usd
        # by two cents. A difference below MATERIAL_REL of the larger magnitude is therefore
        # treated as no direction at all, which is the honest reading of an untested gap.
        scale = max(abs(la), abs(lb))
        material = scale > 0 and abs(d) / scale >= MATERIAL_REL
        obs = 0 if (d == 0 or not material) else (1 if d > 0 else -1)
        mark = expectation_mark(spec, obs)
        pred = {1: "higher", -1: "lower", 0: "no difference"}[spec[0]]
        rel = f"{(abs(d) / scale * 100):.0f}%" if scale else "—"
        cell = (f"| {field} | {pred} | {_fmt(la)} | {_fmt(lb)} | {_fmt(d)} | {rel} | "
                f"{'match' if not mark else ('CONTRADICTS' if mark == '!' else 'no diff')} |")
        return (cell, mark, pred, d)

    # Only `gate` and `architecture` carry a pre-declared per-metric direction; the other
    # cross-arm contrasts are reported descriptively (levels only, no marks).
    KIND_SPEC = {"gate": GATE_EXPECTATION, "architecture": ARCH_EXPECTATION}
    _HEAD_DESC = ["| metric | tier | A | B | A − B | rel |",
                  "|---|:--:|---:|---:|---:|---:|"]

    def _desc_row(a, b, field):
        """A levels-only row (no expectation), for a contrast with no pre-declared direction."""
        la, lb = level(a, field), level(b, field)
        if la is None or lb is None:
            return None
        d = la - lb
        scale = max(abs(la), abs(lb))
        rel = f"{(abs(d) / scale * 100):.0f}%" if scale else "—"
        tg = "univ" if metric_tiers.is_universal(field) else "cond"
        return f"| {field} | {tg} | {_fmt(la)} | {_fmt(lb)} | {_fmt(d)} | {rel} |"

    L: list[str] = []
    counter: list[tuple] = []
    for kind, a, b in pairs(rows):
        label = (f"{_short(a[0])}/{a[2]} − {_short(b[0])}/{b[2]}  [{a[1]}]")
        spec_map = KIND_SPEC.get(kind)
        if kind == "gate":
            # Same stack, same architecture: every metric is the SAME construct, so there is no
            # cross-arm tiering to apply — one table, every row counted.
            body = []
            for field in sorted(spec_map):
                r = _judge_field(a, b, field, spec_map[field])
                if r is None:
                    continue
                cell, mark, _pred, _d = r
                body.append(cell)
                if mark:
                    counter.append((kind, label, field, _pred, _d, mark))
            if body:
                L += [f"### {kind}: {label}", ""] + _HEAD + body + [""]
        elif spec_map is not None:
            # `architecture` (additive vs mutative front end): UNIVERSAL metrics headline the
            # verdict and are the ONLY ones counted as cross-arm (dis)confirmations; CONDITIONAL
            # metrics are shown as diagnostics (anchored to a per-arm unit or needing a parser some
            # arms lack), never a global ranking — the Option A policy (harness.metric_tiers).
            uni, cond = [], []
            for field in sorted(spec_map):
                r = _judge_field(a, b, field, spec_map[field])
                if r is None:
                    continue
                cell, mark, _pred, _d = r
                if metric_tiers.is_universal(field):
                    uni.append(cell)
                    if mark:
                        counter.append((kind, label, field, _pred, _d, mark))
                else:
                    cond.append(cell)
            if uni:
                L += [f"### {kind}: {label} — cross-arm verdict (universal metrics)", ""] + _HEAD + uni + [""]
            if cond:
                L += [f"#### {kind}: {label} — architecture-conditional (diagnostic only, NOT ranked across arms)",
                      "",
                      "Anchored to a per-arm unit or needing a parser some arms lack, so a cross-arm gap",
                      "here is not apples-to-apples: read within an arm, and only across arms that share",
                      "the construct. Not counted as a cross-arm (dis)confirmation.", ""] + _HEAD + cond + [""]
        else:
            # framework / paradigm / backend: no per-metric direction was pre-declared, so report
            # levels only — never marked against an expectation (that would be a manufactured
            # signal). Tier-tagged so a reader still knows which gaps are cross-arm comparable.
            rows_u = [x for x in (_desc_row(a, b, f) for f, _ in FIELDS if metric_tiers.is_universal(f)) if x]
            rows_c = [x for x in (_desc_row(a, b, f) for f, _ in FIELDS if not metric_tiers.is_universal(f)) if x]
            if rows_u or rows_c:
                L += [f"### {kind}: {label} — descriptive (no direction pre-declared for a {kind} contrast)",
                      "",
                      f"A {kind} change has no pre-declared per-metric direction here, so these are levels",
                      "only, not matched against an expectation. `univ` metrics are cross-arm comparable;",
                      "`cond` ones are per-arm diagnostics — read with care (blank sides are dropped).", ""]
                L += _HEAD_DESC + rows_u + rows_c + [""]
    if not L:
        return []
    head = ["## Declared expectations",
            "",
            "The comparisons are PRE-REGISTERED (harness.overview CONTRASTS) so each isolates ONE",
            "dimension; a pair that would vary two things at once is not formed. `gate` holds the",
            "stack and varies the condition (GATE_EXPECTATION); `architecture` holds framework and",
            "backend and varies the additive-vs-mutative FRONT END (ARCH_EXPECTATION). Those two",
            "carry a pre-declared per-metric direction, so the harness marks its own",
            "disconfirmations. `framework`, `paradigm` and `backend` contrasts have NO pre-declared",
            "direction and are reported descriptively (levels only) — marking one would manufacture",
            "a signal the study never predicted.",
            "",
            "These are LEVELS (means over every checkpoint of every chain). There is no significance",
            "test across stacks here and none is implied: with few chains per series the within-arm",
            "spread can exceed a between-arm difference, so read a direction as a direction.",
            "`analyze`'s own tables carry the chain-bootstrap CIs. A gap below",
            f"{int(MATERIAL_REL * 100)}% of the larger magnitude is not counted as a direction at all.",
            "",
            "Cross-arm metrics are TIERED (harness.metric_tiers): a verdict ranks only on UNIVERSAL",
            "metrics — correctness, cost, the probe, and git-only structural measures (hot_*,",
            "reedit_*, file-level impact, dup_*) that mean the same thing in every technology.",
            "CONDITIONAL metrics (parser erosion/wmc/impact-fns, per-arm entry-surface / additive-unit",
            "anchors, wired-node and boundary columns) are diagnostics only, never a cross-arm ranking.",
            ""]
    if counter:
        head_c = ["### counter-signals", "",
                  "Results against what was declared. Listed so the cost of a claim travels with it.",
                  "", "| comparison | metric | predicted | observed | A − B |",
                  "|---|---|:--:|:--:|---:|"]
        for kind, label, field, pred, d, mark in counter:
            seen = "no difference" if mark == "~" else "the opposite"
            head_c.append(f"| {kind}: {label} | {field} | {pred} | {seen} | {_fmt(d)} |")
        head_c.append("")
        return head + L + head_c
    return head + L + ["### counter-signals", "", "None: every declared expectation was met.", ""]


def _fmt(v, nd=4):
    return "—" if v is None else f"{v:.{nd}g}"


def summarise(rows: list[dict]) -> list[str]:
    """A table per field: each series' mean, its final value, and how many rows it rests on."""
    labels = series_labels(rows)
    order = sorted(set(labels.values()))
    L = ["# Cross-arm overview", "",
         f"- series: {len(order)}", f"- rows: {len(rows)}", ""]
    L += ["| series | stack | model | condition | run_id | chains | checkpoints |",
          "|---|---|---|---|---|---:|---:|"]
    seen: dict[str, dict] = defaultdict(lambda: {"chains": set(), "cps": set()})
    meta: dict[str, tuple] = {}
    for r in rows:
        key = (r["stack"], r.get("model") or "?", r.get("condition") or "?", r.get("run_id") or "?")
        lab = labels[key]
        meta[lab] = key
        seen[lab]["chains"].add(r.get("chain"))
        seen[lab]["cps"].add(r.get("checkpoint"))
    for lab in order:
        stack, model, cond, run = meta[lab]
        L.append(f"| {lab} | {stack} | {model} | {cond} | {run} | {len(seen[lab]['chains'])} "
                 f"| {len(seen[lab]['cps'])} |")
    L.append("")
    L += ["> Mean is over every checkpoint of every chain in the series; final is the last",
          "> checkpoint's chain-mean. A blank means the series carries no value for that",
          "> field — for a server-rendered arm the parser-derived front-end columns are blank",
          "> by construction, which is not the same as zero.",
          ">",
          "> Each field is tagged `[universal]` (cross-arm comparable) or `[architecture-conditional]`",
          "> (per-arm unit / parser some arms lack — compare within an arm, not as a ranking); see",
          "> harness.metric_tiers.", ""]
    for field, title in FIELDS:
        cs = curves(rows, field)
        if not cs:
            continue
        tg = "universal" if metric_tiers.is_universal(field) else "architecture-conditional"
        L += [f"## {title}  (`{field}`) — [{tg}]", "",
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
    lead = [f for f in ("stack", "stack_origin", "model", "run_id", "condition", "chain",
                        "checkpoint") if f in fields]
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
        fh.write("\n".join(summarise(rows) + judge(rows)) + "\n")
    print(f"wrote {summary}")
    print(f"wrote {all_csv}")
    print(f"wrote {n_plots} graph(s) to {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

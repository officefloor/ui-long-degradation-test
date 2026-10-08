"""Static audit of the checkpoint stream, run BEFORE a run spends anything.

Two independent properties are enforced (DESIGN: docs/LONG_HORIZON_DESIGN.md):

  1. CONCENTRATION (the erosion guarantee) — a long horizon only puts pressure on
     erosion if change keeps landing on the SAME subsystem. We require that, over the
     long-horizon extension (checkpoints with id >= --min-id), at least --core-share of
     checkpoints target a *core* area (default: the billing money pipeline). Concentration
     is a property of WHERE a change is aimed, independent of whether it is additive or
     mutative, so this check does not look at `type` at all.

  2. CADENCE / REALISM (comparability with the REST arm) — real change streams add far
     more than they revise, and `spring-petclinic-rest-long-degradation-test` uses a
     3-additive : 1-mutative rhythm. We require the mutative fraction over the extension
     to sit near --mutative-ratio (default 0.25) within --tolerance, and (unless
     --no-cadence-pattern) that the stream follow the repeating A-A-A-M pattern.

Each checkpoint's area comes from its inline `area:` field; checkpoints without one fall
back to the legacy map in acceptance/checkpoint_areas.yaml (so the frozen Act I entries
need not be edited). A checkpoint inside the enforcement window with no area from either
source is an error — a new checkpoint must declare where it aims.

    .venv/bin/python -m harness.checkpoint_lint --config config.yaml
    .venv/bin/python -m harness.checkpoint_lint --config config.yaml --min-id 1   # whole stream

Exit code 0 = all enforced properties hold; 1 = a violation; 2 = bad invocation.
"""
from __future__ import annotations

import argparse
import os
import re
import sys

import yaml

_ID_NUM = re.compile(r"cp0*(\d+)")


def _id_num(cid: str) -> int | None:
    m = _ID_NUM.match(cid or "")
    return int(m.group(1)) if m else None


def _load_yaml(path: str):
    with open(path) as fh:
        return yaml.safe_load(fh)


def _resolve_areas(checkpoints: list[dict], legacy: dict[int, str]) -> dict[int, str | None]:
    """id -> area, preferring the inline `area:` field, then the legacy side map."""
    out: dict[int, str | None] = {}
    for cp in checkpoints:
        n = _id_num(cp.get("id", ""))
        if n is None:
            continue
        out[n] = cp.get("area") or legacy.get(n)
    return out


def _cadence_pattern_violations(items: list[tuple[int, str]]) -> list[int]:
    """Positions (1-based within the window) that break the A-A-A-M rhythm: every 4th
    checkpoint mutative, the other three additive. Returns the offending checkpoint ids."""
    bad = []
    for pos, (cid_num, ctype) in enumerate(items, start=1):
        expected = "mutative" if pos % 4 == 0 else "additive"
        if ctype != expected:
            bad.append(cid_num)
    return bad


def main() -> int:
    ap = argparse.ArgumentParser(description="Audit checkpoint concentration and cadence.")
    ap.add_argument("--config", required=True)
    ap.add_argument("--checkpoints", help="override checkpoints file (default: config.checkpoints_file)")
    ap.add_argument("--areas", default="acceptance/checkpoint_areas.yaml",
                    help="legacy id->area map for checkpoints without an inline area")
    ap.add_argument("--min-id", type=int, default=61,
                    help="enforce over checkpoints with id >= this (the long-horizon extension); "
                         "use 1 to enforce over the whole stream")
    ap.add_argument("--core-area", action="append", default=None,
                    help="an area that counts as core/on-spine (repeatable; default: billing)")
    ap.add_argument("--core-share", type=float, default=0.75,
                    help="minimum fraction of windowed checkpoints that must be core")
    ap.add_argument("--mutative-ratio", type=float, default=0.25,
                    help="target mutative fraction over the window (3:1 additive:mutative)")
    ap.add_argument("--tolerance", type=float, default=0.05,
                    help="allowed deviation of the mutative fraction from --mutative-ratio")
    ap.add_argument("--no-cadence-pattern", action="store_true",
                    help="check only the mutative RATIO, not the exact A-A-A-M ordering")
    args = ap.parse_args()

    core_areas = set(args.core_area or ["billing"])

    cfg = _load_yaml(args.config) or {}
    cp_path = args.checkpoints or cfg.get("checkpoints_file", "checkpoints.yaml")
    if not os.path.exists(cp_path):
        print(f"error: checkpoints file not found: {cp_path}", file=sys.stderr)
        return 2
    checkpoints = (_load_yaml(cp_path) or {}).get("checkpoints") or []
    if not checkpoints:
        print(f"error: no checkpoints in {cp_path}", file=sys.stderr)
        return 2

    legacy_raw = _load_yaml(args.areas) if os.path.exists(args.areas) else {}
    legacy = {int(k): v for k, v in (legacy_raw or {}).get("areas", {}).items()}

    areas = _resolve_areas(checkpoints, legacy)

    # ---- the window under enforcement -----------------------------------------------------
    window = [cp for cp in checkpoints if (_id_num(cp.get("id", "")) or 0) >= args.min_id]
    window.sort(key=lambda cp: _id_num(cp["id"]))
    n = len(window)
    if n == 0:
        print(f"error: no checkpoints with id >= {args.min_id}", file=sys.stderr)
        return 2

    problems: list[str] = []

    # ---- untagged checkpoints in the window -----------------------------------------------
    untagged = [cp["id"] for cp in window if not areas.get(_id_num(cp["id"]))]
    if untagged:
        problems.append(
            f"{len(untagged)} checkpoint(s) in the window have no area (inline or legacy map): "
            + ", ".join(untagged[:8]) + (" ..." if len(untagged) > 8 else ""))

    # ---- 1. concentration -----------------------------------------------------------------
    core = [cp for cp in window if areas.get(_id_num(cp["id"])) in core_areas]
    core_share = len(core) / n
    if core_share < args.core_share:
        problems.append(
            f"concentration: {len(core)}/{n} = {core_share:.0%} of the extension is core "
            f"({'/'.join(sorted(core_areas))}), below the required {args.core_share:.0%}. "
            f"Aim more checkpoints at the spine or move off-spine ones out of the window.")

    # ---- 2. cadence / realism -------------------------------------------------------------
    muts = [cp for cp in window if cp.get("type") == "mutative"]
    mut_ratio = len(muts) / n
    if abs(mut_ratio - args.mutative_ratio) > args.tolerance:
        problems.append(
            f"cadence: mutative fraction {len(muts)}/{n} = {mut_ratio:.0%} is outside "
            f"{args.mutative_ratio:.0%} +/- {args.tolerance:.0%} "
            f"(target 3 additive : 1 mutative).")

    pattern_bad: list[int] = []
    if not args.no_cadence_pattern:
        items = [(_id_num(cp["id"]), cp.get("type", "additive")) for cp in window]
        pattern_bad = _cadence_pattern_violations(items)
        if pattern_bad:
            problems.append(
                f"cadence pattern: {len(pattern_bad)} checkpoint(s) break the A-A-A-M rhythm "
                f"(every 4th mutative): cp"
                + ", cp".join(str(x) for x in pattern_bad[:10])
                + (" ..." if len(pattern_bad) > 10 else "")
                + "  (relax with --no-cadence-pattern to check the ratio only).")

    # ---- report ---------------------------------------------------------------------------
    by_area: dict[str, int] = {}
    for cp in window:
        a = areas.get(_id_num(cp["id"])) or "(untagged)"
        by_area[a] = by_area.get(a, 0) + 1

    print(f"checkpoint stream: {len(checkpoints)} total; window id>={args.min_id}: {n}")
    print(f"  core share       : {len(core)}/{n} = {core_share:.0%} "
          f"(core = {'/'.join(sorted(core_areas))}; need >= {args.core_share:.0%})")
    print(f"  mutative fraction: {len(muts)}/{n} = {mut_ratio:.0%} "
          f"(target {args.mutative_ratio:.0%} +/- {args.tolerance:.0%})")
    print("  by area          : " + ", ".join(f"{a}={c}" for a, c in sorted(by_area.items(), key=lambda kv: -kv[1])))
    if untagged:
        print(f"  untagged         : {len(untagged)}")
    print()

    if problems:
        print("FAIL — fix before paying for a run:")
        for p in problems:
            print(f"  - {p}")
        return 1
    print("OK — stream is concentrated and the cadence is realistic.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

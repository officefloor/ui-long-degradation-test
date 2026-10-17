"""Static audit of the checkpoint stream, run BEFORE a run spends anything.

The stream is designed to concentrate complexity on one screen and three entities
(acceptance/WORKSPACE.md). This lint refuses a stream that does not hold to that design:

  1. CADENCE — checkpoint n is mutative exactly when n % 4 == 0 (three additions, one mutation)
     through --tighten-after, then on the tighter 1:1 rhythm (n % --tighten-period == 0) beyond it
     (Act VI runs 1:1), and every mutation names the earlier checkpoints it changes (`mutates:`).
  2. ONE SCREEN — every checkpoint's own (agent-visible) spec opens only `/` and clicks no
     navigation (`nav-*`): no request may add a page.
  3. ALGORITHMS — each act of --act-size checkpoints carries at least --min-algorithms
     checkpoints with an `algorithm:` field.
  4. TEST DATA — no hidden copy seeds a field no visible spec has seeded yet.
  5. VISIBLE SPECS — an own spec never describes the hidden suite (copies, mutates).
  6. COVERAGE — a copy drops an earlier test only when the checkpoint lists it under `retires:`,
     and only for a checkpoint it mutates.
  7. YAML — no mapping repeats a key (safe_load would silently keep the last).
  8. IMPORTS — every relative import in a spec resolves from the folder it is installed into
     (copies go in by basename beside the own specs, so `../../` from a copy breaks the gate).
  9. ANCHORS — a hidden copy asserts only test ids the agent can know: named in its own spec,
     asserted by a test still in force, or declared under `keeps_anchors:` as surviving a retirement.
 10. STANDING HOLD — from cp77, every test asserting a sheet-wide or patron/follow figure seeds a held
     person, so the hold rule (cp73-76) keeps being exercised for the rest of the run.

    .venv/bin/python -m harness.checkpoint_lint --config config.yaml

Exit code 0 = all properties hold; 1 = a violation; 2 = bad invocation.
"""
from __future__ import annotations

import argparse
import os
import re
import sys

import yaml

from . import fixtures

_ID_NUM = re.compile(r"cp0*(\d+)")


def _id_num(cid: str) -> int | None:
    m = _ID_NUM.match(cid or "")
    return int(m.group(1)) if m else None


class _UniqueKeyLoader(yaml.SafeLoader):
    """A YAML loader that refuses a mapping with a repeated key: plain safe_load silently keeps the
    last one, so a second `retires:` or `mutates:` on a checkpoint would quietly drop the first."""


def _no_duplicate_keys(loader, node, deep=False):
    seen = set()
    for key_node, _ in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in seen:
            raise yaml.constructor.ConstructorError(
                None, None, f"duplicate key {key!r}", key_node.start_mark)
        seen.add(key)
    return loader.construct_mapping(node, deep)


_UniqueKeyLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, _no_duplicate_keys)


def _load_yaml(path: str):
    with open(path) as fh:
        return yaml.load(fh, Loader=_UniqueKeyLoader)


def _expected_type(n: int, tighten_after: int, tighten_period: int) -> str:
    """The cadence a checkpoint must follow: the 3:1 A-A-A-M rhythm (mutative when n % 4 == 0)
    through `tighten_after`, then the tighter `tighten_period` rhythm beyond it (Act VI is 1:1, so
    every even checkpoint is mutative)."""
    period = 4 if n <= tighten_after else tighten_period
    return "mutative" if n % period == 0 else "additive"


def main() -> int:
    ap = argparse.ArgumentParser(description="Audit the checkpoint stream against its design.")
    ap.add_argument("--config", required=True)
    ap.add_argument("--checkpoints", help="override checkpoints file (default: config.checkpoints_file)")
    ap.add_argument("--act-size", type=int, default=50, help="checkpoints per act")
    ap.add_argument("--min-algorithms", type=int, default=3,
                    help="minimum checkpoints with an `algorithm:` field per act")
    ap.add_argument("--tighten-after", type=int, default=250,
                    help="checkpoints past this follow the tighter cadence (Act VI onward)")
    ap.add_argument("--tighten-period", type=int, default=2,
                    help="the tighter cadence period beyond --tighten-after (2 = 1:1)")
    args = ap.parse_args()

    cfg = _load_yaml(args.config) or {}
    cp_path = args.checkpoints or cfg.get("checkpoints_file", "checkpoints.yaml")
    if not os.path.exists(cp_path):
        print(f"error: checkpoints file not found: {cp_path}", file=sys.stderr)
        return 2
    checkpoints = (_load_yaml(cp_path) or {}).get("checkpoints") or []
    if not checkpoints:
        print(f"error: no checkpoints in {cp_path}", file=sys.stderr)
        return 2

    harness_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    numbered = [dict(cp, n=i) for i, cp in enumerate(checkpoints, 1)]
    problems: list[str] = []

    def report(title: str, items: list[str], hint: str = "") -> None:
        if items:
            problems.append(f"{title}: {len(items)}{(' — ' + hint) if hint else ''}:\n      "
                            + "\n      ".join(items[:40])
                            + ("\n      ..." if len(items) > 40 else ""))

    # ---- 1. cadence, and every mutation names what it mutates --------------------------------
    off_rhythm = [f"cp{cp['n']:02d} is {cp.get('type', 'additive')}"
                  for cp in numbered
                  if cp.get("type", "additive")
                  != _expected_type(cp["n"], args.tighten_after, args.tighten_period)]
    report("cadence", off_rhythm,
           f"n mutative when n%4==0 through cp{args.tighten_after}, then n%{args.tighten_period}==0")
    bad_mutates = []
    for cp in numbered:
        if cp.get("type") == "mutative":
            m = [int(x) for x in (cp.get("mutates") or [])]
            if not m:
                bad_mutates.append(f"cp{cp['n']:02d} mutates nothing")
            elif any(x >= cp["n"] for x in m):
                bad_mutates.append(f"cp{cp['n']:02d} mutates a later checkpoint: {m}")
    report("mutations", bad_mutates, "a mutation names earlier checkpoints it changes")

    # ---- 2. one screen ----------------------------------------------------------------------
    report("one screen", fixtures.screen_violations(numbered, harness_root),
           "an own spec opens only '/' and clicks no nav-* entry")

    # ---- 3. algorithms per act --------------------------------------------------------------
    acts = range(0, len(numbered), args.act_size)
    thin = []
    for start in acts:
        block = numbered[start:start + args.act_size]
        algos = [cp["algorithm"] for cp in block if cp.get("algorithm")]
        if len(algos) < args.min_algorithms:
            thin.append(f"act cp{block[0]['n']:02d}-cp{block[-1]['n']:02d} has {len(algos)} "
                        f"algorithm checkpoint(s) {algos}")
    report("algorithms", thin, f"each act needs at least {args.min_algorithms}")

    # ---- 4-6. test data, visible specs, coverage --------------------------------------------
    hidden = fixtures.hidden_field_violations(numbered, harness_root)
    report("test data", hidden, "seed the field in that checkpoint's own spec first")
    leaks = fixtures.own_spec_leaks(numbered, harness_root)
    report("visible specs", leaks, "describe the behaviour only")
    dropped = fixtures.undeclared_retirements(numbered, harness_root)
    report("coverage", dropped, "restore the test in the copy, or list it under retires:")

    # ---- 7. nothing the agent reads frames the work as a test run ----------------------------
    framing = []
    owned = {**((cfg.get("acceptance") or {}).get("harness_files") or {}),
             **((cfg.get("agent") or {}).get("instruction_files") or {})}
    for dst, src in sorted(owned.items()):
        hits = fixtures.framing_leaks(open(os.path.join(harness_root, src)).read())
        if hits:
            framing.append(f"{dst} ({src}): mentions {', '.join(hits)}")
    for cp in numbered:
        hits = fixtures.framing_leaks(cp.get("request") or "")
        if hits:
            framing.append(f"cp{cp['n']:02d} request: mentions {', '.join(hits)}")
    report("framing", framing, "word it as ordinary project work: no harness, sequence or history")

    # ---- 8. imports resolve where the spec is installed -------------------------------------
    unresolved = fixtures.unresolved_imports(numbered, harness_root)
    report("imports", unresolved, "a copy is installed beside the own specs: use '../support/...'")

    # ---- 9. hidden copies assert only anchors the agent can know -----------------------------
    unseen = fixtures.hidden_anchor_violations(numbered, harness_root)
    report("anchors", unseen, "name it in the own spec, or list it under keeps_anchors: if it survives")

    # ---- 10. the hold rule stays exercised ---------------------------------------------------
    unheld = fixtures.standing_hold_violations(numbered, harness_root, since=12)
    report("standing hold", unheld, "seed one held person that would change the figure if counted")

    # ---- report -----------------------------------------------------------------------------
    n_mut = sum(1 for cp in numbered if cp.get("type") == "mutative")
    n_alg = sum(1 for cp in numbered if cp.get("algorithm"))
    print(f"checkpoint stream: {len(numbered)} checkpoints in {len(list(acts))} act(s) of "
          f"{args.act_size}")
    print(f"  mutations        : {n_mut} ({n_mut / len(numbered):.0%})")
    print(f"  algorithms       : {n_alg}")
    print(f"  one screen       : {len(fixtures.screen_violations(numbered, harness_root))} violation(s)")
    print(f"  hidden test data : {len(hidden)} replacement field(s) unseen by a visible spec")
    print(f"  visible-spec leak: {len(leaks)} own spec(s) describe the hidden suite")
    print(f"  dropped coverage : {len(dropped)} test(s) dropped without a retires: entry")
    print(f"  broken imports   : {len(unresolved)} spec import(s) absent once installed")
    print(f"  unseen anchors   : {len(unseen)} test id(s) a hidden copy asserts that the agent cannot know")
    print(f"  standing hold    : {len(unheld)} sheet-wide test(s) without a held person")
    print()
    if problems:
        print("FAIL — fix before paying for a run:")
        for p in problems:
            print(f"  - {p}")
        return 1
    print("OK — one screen, the 3:1 cadence, algorithms in every act, and every seeded field "
          "visible first.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""Build the early-overload stream from its reference model (harness/oracle/overload.py).

The model is the one definition of every concept, rule and figure; this writes everything the agent
and the gate see from it, so the requests, the specs and the model cannot drift apart:

  checkpoints.yaml           every request states its rule in full (the agent sees only the request
                             and its own spec, so nothing may be left to the model), plus `mutates:`
  acceptance/specs/cpNN_*    each checkpoint's own spec
  acceptance/specs/cpNN/     the ripple copies: every earlier test whose asserted values the mutation
                             changes, with the new values (the closure is computed, not listed)
  config.yaml probe.expected the concept and figure names live at each reading-probe boundary

Each test seeds one fixture: the five fixed people, a negative one (Sid), a held one (Hz) and one
with a blank gamma (Moe). Sid's and Hz's numbers are searched per test so that every standing rule
the test needs (harness.probe_check) catches an app that ignores it, at every checkpoint the test is
in force for, and a mutation's own spec fails on the rule it replaces.

    .venv/bin/python -m harness.stream_build --config config.yaml [--dry-run]

Then check: harness.spec_check, harness.probe_check and harness.checkpoint_lint.
"""
from __future__ import annotations

import argparse
import itertools
import os
import re
import shutil
import sys
import textwrap

from .checkpoint_lint import _load_yaml
from .oracle.core import ABSENT, REGISTRY, Ctx, View, World, _load_acts
from .oracle import overload as ov
from .probe_check import _NEEDS, SINCE, fill_blanks, has_blank

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LAST = ov.COVERAGE[1]
MUTATIVE = [k for k in range(1, LAST + 1) if k % 4 == 0]
KEEL_REDEFS = {16: "scaled plus momentum plus norm",
               32: "scaled plus momentum plus norm plus thrust",
               52: "scaled plus twice momentum plus norm plus thrust",
               60: "scaled plus momentum plus norm plus thrust",
               64: "scaled plus twice momentum plus twice norm plus thrust",
               100: "scaled plus twice momentum plus twice norm plus twice thrust",
               148: "twice scaled plus twice momentum plus twice norm plus twice thrust",
               200: "twice scaled plus three times momentum plus twice norm plus twice thrust",
               240: "twice scaled plus three times momentum plus three times norm plus twice thrust"}
ALGORITHMS = {4: "trim_total", 8: "round_divides", 12: "hold", 52: "keel", 56: "mast", 60: "keel",
              104: "bearing", 108: "pitch", 112: "tackle", 152: "cable", 156: "hull", 160: "bow",
              204: "pier", 208: "ebb", 212: "flood"}


# ---- the requests ------------------------------------------------------------------------------

SPINE = {
    "thrust": "thrust: alpha times beta",
    "momentum": "momentum: thrust plus three times (gamma minus alpha)",
    "scaled": "scaled: momentum times two",
    "third": "third: scaled divided by three",
    "backing": ("backing: the momentum of each of their patrons added up (0 with no patrons; a "
                "patron whose momentum is n/a adds nothing; n/a when the person's own momentum is "
                "n/a). Backing is the person's own value, not a sheet total"),
    "norm": ("norm: the person's scaled minus the average scaled across the sheet (the average over "
             "the people whose scaled is not n/a, rounded like every divide)"),
    "quarter": "quarter: scaled divided by four",
    "tier": ("tier: SINK when scaled is below zero, STEADY from 0 up to 199, and SURGE at 200 or "
             "more (n/a when scaled is n/a)"),
    "keel": "keel: scaled plus momentum",
}
FIGURE_TEXT = {
    "total": lambda n: (f"the total of {n} across the sheet, following the rules for every sheet "
                        f"total (a held person counts half, and one highest and one lowest "
                        f"contribution are left out)"),
    "top": lambda n: f"the highest {n} among the people not on hold",
    "low": lambda n: f"the lowest {n} among the people not on hold",
    "spread": lambda n: f"the highest {n} minus the lowest {n}, among the people not on hold",
    "even": lambda n: (f"how many people have an even {n}, counting like every count of people "
                       f"(leaving out the people on hold and the people whose keel is below zero)"),
    "mean": lambda n: (f"the average {n} over the people not on hold, rounded to the nearest whole "
                       f"number like every divide"),
}
RULE_REQUESTS = {
    1: ("Keep a list of people. Each has a name and three whole numbers, alpha, beta and gamma, any "
        "of which may be left blank. A person can also be marked as on hold, and can have other "
        "people on the sheet as their patrons; nothing uses either of these yet, but keep them. "
        "Show all the people."),
    4: ("Every total across the whole sheet (thrust-total, and every total added later) now leaves "
        "out one highest and one lowest contribution, as long as at least two people contribute. "
        "When several contributions tie for highest or lowest, leave out just one of them."),
    8: ("Wherever a value is divided on the sheet (a value divided by a number, an average, or a "
        "half), round to the nearest whole number instead of down. A half rounds up to the larger "
        "number: 2.5 becomes 3 and -2.5 becomes -2."),
    12: ("Putting a person on hold now counts: a held person is left out of every figure across "
         "the sheet (every average, so norm too, every count, highest, lowest and spread), except "
         "totals, where a held person's value counts half (rounded like every divide), and that "
         "half is what takes part in leaving out the highest and lowest. A held person's own "
         "values in their row are worked out as usual."),
    20: ("When alpha, beta or gamma is blank, treat it as zero everywhere it is used, so a blank "
         "number no longer makes anything n/a."),
    40: ("Treat patronage as mutual: if one person is another's patron, each is the other's patron. "
         "A pair linked both ways still counts once."),
}


def _reader(name: str, k: int) -> str:
    """Reader `name`'s definition in force at k, in request words."""
    _s, text, _fn, off = [d for d in ov.READER_DEF[name] if d[0] <= k][-1]
    if "divided" in text:
        text = f"{text} (rounded like every divide)"
    return f"{text}, plus {off}" if off else text


def _new_concepts(k: int) -> list[str]:
    """Per-person concepts first shown at k."""
    return [n for n, vs in REGISTRY.person_concepts.items() if min(v.since for v in vs) == k]


def _new_figures(k: int) -> list[str]:
    return [n for n, vs in REGISTRY.sheet_figures.items()
            if min(v.since for v in vs) == k and vs[0].show]


def _concept_text(n: str, k: int) -> str:
    if n in SPINE:
        text = SPINE[n]
        if "divided" in text:
            text += " (rounded down like every divide)" if k < ov.EROUND \
                else " (rounded like every divide)"
        return text
    return f"{n}: {_reader(n, k)}"


def _figure_text(n: str, k: int) -> str:
    if n == "thrust-total":
        return "thrust-total: everyone's thrust added up"
    if n == "keel-total" and k < ov.EHOLD:
        return ("keel-total: the total of keel across the sheet, following the rules for every "
                "sheet total (one highest and one lowest contribution are left out)")
    if n == "keel-count":
        return ("keel-count: how many people not on hold have an even keel (a person whose keel is "
                "n/a is not counted)")
    reader, ft = n.rsplit("-", 1)
    return f"{n}: {FIGURE_TEXT[ft](reader)}"


def request(k: int) -> str:
    if k in RULE_REQUESTS:
        return RULE_REQUESTS[k]
    if k in KEEL_REDEFS:
        out = (f"Change keel back to {KEEL_REDEFS[k]}, as it was before the last change."
               if k == 60 else f"Change keel to {KEEL_REDEFS[k]}.")
        out += " Everything worked out from keel changes with it."
        if k == 16:
            out += (" Also, from now on every count of people (keel-count, and every count added "
                    "later) leaves out a person whose keel is below zero, as well as the people on "
                    "hold.")
        return out
    if k % 4 == 0:     # a reader change
        if k in ov.TWEAKS:
            n = ov.TWEAKS[k]
            return f"Add {k} to {n}: {n} is now {_reader(n, k)}."
        (n,) = [n for n, vs in REGISTRY.person_concepts.items() if any(v.since == k for v in vs)]
        return f"Change {n} to {_reader(n, k)}."
    parts = [f"For each person show {_concept_text(n, k)}." for n in _new_concepts(k)]
    parts += [f"Show {_figure_text(n, k)}." for n in _new_figures(k)]
    if k == 2:
        parts.append("Anything worked out from a blank number, or from a value that shows n/a, "
                     "shows n/a, and a figure across the whole sheet skips the people for whom it "
                     "is n/a.")
    if k == 5:
        parts.append("Whenever a value is divided on this sheet, round down to the whole number "
                     "below, also below zero (-8 divided by 3 is -3).")
    return " ".join(parts)


def slug(k: int) -> str:
    names = sorted(_new_concepts(k)) + sorted(_new_figures(k))
    if k in KEEL_REDEFS:
        names = ["keel"]
    elif k % 4 == 0 and k > 20 and k != 40:
        names = [ov.TWEAKS.get(k) or [n for n, vs in REGISTRY.person_concepts.items()
                                      if any(v.since == k for v in vs)][0]]
    fixed = {1: "people", 4: "trim_total", 8: "round_divides", 12: "hold", 20: "missing_zero",
             40: "patrons_mutual"}
    s = fixed.get(k) or "_".join(names)
    return f"cp{k:02d}_{s}"


# ---- what each checkpoint's own spec asserts ---------------------------------------------------

ROWS = [1, 2, 3, 4, 5, 6, 9]
EXTRA = {4: ["rollup-thrust-total"], 8: ["concept-third", "concept-quarter", "concept-norm"],
         12: ["rollup-thrust-total", "rollup-keel-total", "concept-norm"],
         16: ["rollup-keel-count"], 20: ["concept-momentum", "concept-keel", "rollup-keel-total"],
         40: ["concept-backing"]}


def own_ids(k: int) -> list[str]:
    ids = [f"concept-{n}" for n, vs in REGISTRY.person_concepts.items()
           if any(v.since == k for v in vs)]
    ids += [vs[0].show for n, vs in REGISTRY.sheet_figures.items()
            if any(v.since == k for v in vs) and vs[0].show]
    if k in KEEL_REDEFS:
        ids.append("rollup-keel-total")
    ids += EXTRA.get(k, [])
    return list(dict.fromkeys(ids))


def paths_for(ids: list[str]) -> list[tuple]:
    out = []
    for t in ids:
        if t.startswith("concept-"):
            out += [(f"person-row-{r}", t) for r in ROWS]
        else:
            out.append((t,))
    return out


# ---- fixtures ----------------------------------------------------------------------------------

FIXED = [dict(id=1, name="Ada", alpha=3, beta=5, gamma=4), dict(id=2, name="Ben", alpha=2, beta=6, gamma=3),
         dict(id=3, name="Cam", alpha=5, beta=4, gamma=9), dict(id=4, name="Dot", alpha=4, beta=3, gamma=2)]
PATRONS = [{"personId": 1, "patronId": 2}, {"personId": 1, "patronId": 3}]
SID = [(4, 2, 0), (4, 2, 1), (5, 2, 0), (6, 2, 1), (4, 3, 0), (5, 3, 1), (6, 1, 0), (7, 2, 1)]
HZ = [(2, 5, 3)] + [t for t in itertools.product((2, 3, 5, 6, 8, 9), (5, 3, 7, 9), (3, 0, 6, 9))
                    if t != (2, 5, 3)]
MOE = [(2, 4), (3, 4), (2, 5), (3, 5)]
# a seventh counted person, tried only when nothing else works: with six counted people some
# figures cannot separate the rounding rule (bearing-mean at cp119: its own rounding and the
# rounding of the average inside norm cancel exactly)
KIT = [None, (3, 3, 5), (2, 7, 4)]


def fixture(sid, hz, moe=MOE[0], kit=None) -> dict:
    people = FIXED + [dict(id=5, name="Sid", alpha=sid[0], beta=sid[1], gamma=sid[2]),
                      dict(id=9, name="Hz", alpha=hz[0], beta=hz[1], gamma=hz[2], hold=True),
                      dict(id=6, name="Moe", alpha=moe[0], beta=moe[1], gamma=None)]
    if kit:
        people.append(dict(id=7, name="Kit", alpha=kit[0], beta=kit[1], gamma=kit[2]))
    return {"people": people, "patrons": PATRONS}


_CACHE: dict = {}


def values(fx: dict, k: int, paths: list[tuple], off: tuple = ()) -> tuple:
    key = (repr(fx), k, tuple(paths), off)
    if key not in _CACHE:
        with ov.ablated(*off):
            view = View(Ctx(World(fx), k, None, None, REGISTRY))
            _CACHE[key] = tuple(view.text(p) for p in paths)
    return _CACHE[key]


def problems(fx: dict, ids: list[str], paths: list[tuple], ks: list[int], own: int | None = None,
             cap: int | None = None) -> list[str]:
    """What this fixture fails to exercise at the checkpoints `ks`; `own` is the checkpoint whose
    own spec this is (it must show every value, and a mutation's own spec must fail before it)."""
    out = []
    if own is not None:
        base0 = values(fx, own, paths)
        if any(v is ABSENT for v in base0):
            out.append(f"cp{own} absent value")
        if own in MUTATIVE and base0 == values(fx, own - 1, paths):
            out.append(f"cp{own} passes before the change")
    for k in ks:
        base = values(fx, k, paths)
        for rule, since in SINCE.items():
            if k < since:
                continue
            if rule == "missing":
                needed = has_blank(fx) and values(fill_blanks(fx), k, paths) != base
            else:
                needed = any(_NEEDS[rule].search(t) for t in ids)
            if needed and values(fx, k, paths, (rule,)) == base:
                out.append(f"cp{k} {rule}")
                if cap is not None and len(out) >= cap:
                    return out
    return out


def choose(ids: list[str], paths: list[tuple], ks: list[int], own: int | None = None):
    """The first candidate fixture that exercises everything at `ks` (else the one missing least).
    A failure at the first checkpoint weighs more than any number later: later ones can still be
    repaired by a re-fixtured copy."""
    best, best_score = None, None
    for kit, sid, hz, moe in itertools.product(KIT, SID, HZ, MOE):
        fx = fixture(sid, hz, moe, kit)
        first = problems(fx, ids, paths, ks[:1], own)
        if first and best_score is not None and best_score[0] == 0:
            continue
        rest = problems(fx, ids, paths, ks[1:], None,
                        cap=None if best_score is None else best_score[1] + 1)
        score = (len(first), len(rest))
        if best_score is None or score < best_score:
            best, best_score = (fx, first + rest), score
            if score == (0, 0):
                break
    return best


def future(k: int) -> list[int]:
    return [k] + [m for m in MUTATIVE if m > k]


# ---- rendering ---------------------------------------------------------------------------------

def _js(v) -> str:
    if v is None:
        return "null"
    if v is True:
        return "true"
    if isinstance(v, str):
        return f'"{v}"'
    if isinstance(v, list):
        return "[" + ", ".join(_js(x) for x in v) + "]"
    if isinstance(v, dict):
        return "{" + ", ".join(f"{k}: {_js(x)}" for k, x in v.items()) + "}"
    return str(v)


def render(title: str, fx: dict, paths: list[tuple], vals: tuple, visible_only: bool = False) -> str:
    lines = []
    for p, v in zip(paths, vals):
        loc = "page" + "".join(f".getByTestId('{t}')" for t in p)
        lines.append(f"    await expect({loc}).toBeVisible();" if visible_only
                     else f"    await expect({loc}).toHaveText('{v}');")
    return (f"import {{ test, expect }} from '@playwright/test';\n"
            f"import {{ resetAndSeed }} from '../support/seed';\n\n"
            f"test.describe('{title}', () => {{\n"
            f"  test('{title}', {{ tag: '@functionality' }}, async ({{ page }}) => {{\n"
            f"    await resetAndSeed({_js(fx)});\n"
            f"    await page.goto('/');\n\n" + "\n".join(lines) + "\n  });\n});\n")


def _yaml(cps: list[dict]) -> str:
    out = ["# The early-overload stream, cp1-250. GENERATED by harness.stream_build from the reference",
           "# model harness/oracle/overload.py: edit the model (or the request wording in stream_build),",
           "# then rebuild. Compressed spine cp2-6, hub `keel` at cp9, rules early (trim cp4, round cp8,",
           "# hold cp12, keel-below-zero out of counts cp16, blank as zero cp20). Cadence 3:1.",
           "checkpoints:"]
    for cp in cps:
        out.append(f"  - id: {cp['id']}")
        out.append(f"    type: {cp['type']}")
        out.append(f"    area: {cp['area']}")
        if cp.get("algorithm"):
            out.append(f"    algorithm: {cp['algorithm']}")
        if cp.get("mutates"):
            out.append(f"    mutates: [{', '.join(str(m) for m in cp['mutates'])}]")
        out.append(f"    test: {cp['test']}")
        out.append("    request: |")
        out += ["      " + ln for ln in textwrap.wrap(cp["request"], 96)]
        out.append("")
    return "\n".join(out)


def probe_expected(k: int) -> list[str]:
    names = {n for n, vs in REGISTRY.person_concepts.items() if min(v.since for v in vs) <= k}
    names |= {n for n, vs in REGISTRY.sheet_figures.items() if min(v.since for v in vs) <= k and vs[0].show}
    return sorted(n.replace("-", " ") for n in names)


# ---- build -------------------------------------------------------------------------------------

def build(config: str, dry_run: bool = False) -> int:
    _load_acts()
    cfg = _load_yaml(config) or {}
    cp_path = os.path.join(ROOT, cfg.get("checkpoints_file", "checkpoints.yaml"))
    spec_dir = os.path.join(ROOT, "acceptance", "specs")
    files: dict[str, str] = {}
    cps, live, unmet = [], {}, []     # live: basename -> [k0, fx, paths, vals]
    for k in range(1, LAST + 1):
        cid = slug(k)
        base = f"{cid}.spec.ts"
        cp = {"id": cid, "type": "mutative" if k in MUTATIVE else "additive",
              "area": "entity" if k == 1 else ("relation" if k in (6, 40) else "calc"),
              "algorithm": ALGORITHMS.get(k), "test": f"acceptance/specs/{base}", "request": request(k)}
        # the ripple: every earlier test whose asserted values change at k
        changed = []
        for b, t in live.items():
            now = values(t[1], k, t[2])
            if now != t[3]:
                changed.append((b, t, now))
        if changed and k not in MUTATIVE:
            raise SystemExit(f"cp{k} is additive but changes {[b for b, *_ in changed]}")
        if k in MUTATIVE:
            # a test whose fixture no longer exercises a rule it needs is re-fixtured in a copy
            moved = {b for b, *_ in changed}
            for b, t in live.items():
                if problems(t[1], t[4], t[2], [k]):
                    fx, bad = choose(t[4], t[2], future(k))
                    unmet += [f"{b}: {x}" for x in bad if x.startswith(f"cp{k} ")]
                    t[1] = fx
                    now = values(fx, k, t[2])
                    if b in moved:
                        changed = [(b2, t2, now if b2 == b else n2) for b2, t2, n2 in changed]
                    elif now != t[3]:
                        changed.append((b, t, now))
        for b, t, now in changed:
            t[3] = now
            files[f"cp{k:02d}/{b}"] = render(b[5:-8].replace("_", " "), t[1], t[2], now)
        cp["mutates"] = sorted({t[0] for _b, t, _n in changed})
        if k in MUTATIVE and not cp["mutates"]:
            raise SystemExit(f"cp{k} is mutative but changes no earlier test")
        title = cid[5:].replace("_", " ")
        if k == 1:
            paths = [(f"person-row-{r}",) for r in ROWS]
            fx = fixture(SID[0], HZ[0])
            files[base] = render(title, fx, paths, (), visible_only=True)
        else:
            ids = own_ids(k)
            paths = paths_for(ids)
            fx, bad = choose(ids, paths, future(k), own=k)
            unmet += [f"{base}: {x}" for x in bad if x.startswith(f"cp{k} ")]
            vals = values(fx, k, paths)
            files[base] = render(title, fx, paths, vals)
            live[base] = [k, fx, paths, vals, ids]
        cps.append(cp)
        print(f"cp{k:03d} {cid:32s} mutates {len(cp['mutates']):3d}", file=sys.stderr)
    print(f"{len(cps)} checkpoints, {len(files)} spec files; {len(unmet)} unmet probe(s)")
    for u in unmet:
        print("  unmet:", u)
    if dry_run:
        return 1 if unmet else 0
    for name in os.listdir(spec_dir):
        if name.startswith("cp"):
            path = os.path.join(spec_dir, name)
            shutil.rmtree(path) if os.path.isdir(path) else os.remove(path)
    for rel, text in files.items():
        path = os.path.join(spec_dir, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as fh:
            fh.write(text)
    with open(cp_path, "w") as fh:
        fh.write(_yaml(cps))
    # the reading probe's recall ground truth
    with open(config) as fh:
        text = fh.read()
    for k in (cfg.get("probe") or {}).get("at_checkpoints") or []:
        line = f"    {k}: [" + ", ".join(f'"{n}"' for n in probe_expected(k)) + "]"
        text, n = re.subn(rf"^    {k}: \[.*\]$", line, text, flags=re.M)
        if n != 1:
            raise SystemExit(f"config.yaml: no probe.expected entry for {k}")
    with open(config, "w") as fh:
        fh.write(text)
    return 1 if unmet else 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Build the stream from the reference model.")
    ap.add_argument("--config", required=True)
    ap.add_argument("--dry-run", action="store_true", help="report, write nothing")
    args = ap.parse_args(argv)
    return build(args.config, args.dry_run)


if __name__ == "__main__":
    sys.exit(main())

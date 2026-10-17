"""Do the specs exercise the stream's standing rules?

The stream (harness/oracle/overload.py) switches five cross-cutting rules on early, and every figure
added later must honour them (docs/EARLY_OVERLOAD_DESIGN.md):

  trim     cp4   every sheet total leaves out one highest and one lowest contribution
  round    cp8   every divide (an average, a half, a reader that divides) rounds to the nearest
  hold     cp12  a held person leaves every sheet-wide figure and counts half in totals
  sink     cp16  a person whose keel is below zero leaves every count of people
  missing  cp20  a blank raw number counts as zero

A test that asserts a figure a rule governs must be able to catch an app that ignores the rule. This
checks it by ablation: the test is replayed through the reference model with the rule switched off
(`overload.ablated`), the way such an app would compute, and at least one asserted value must
change. Which tests need which rule is decided by the test ids they assert:

  trim     a sheet total                          rollup-*-total
  round    a value that divides                   concept-third|quarter|norm|freeboard|knot|rigging|
                                                  jetty, rollup-*-mean
  hold     any sheet-wide figure, or norm         rollup-*, concept-norm
  sink     a count of people                      rollup-keel-count, rollup-*-even
  missing  a test seeding a blank raw number whose asserted values depend on it (filling the blank
           changes them)

A rule is checked for every test installed from the rule's checkpoint on, at the first and the last
checkpoint it is in force for. harness.stream_build chooses each test's fixture so all of these hold.

    .venv/bin/python -m harness.probe_check --config config.yaml [--rule trim,hold] [--through K]

Exit code 0 = every test that needs a rule exercises it; 1 = a violation.
"""
from __future__ import annotations

import argparse
import copy
import re
import sys
from dataclasses import dataclass

from .oracle.overload import RULES, ablated
from .spec_check import (HARNESS_ROOT, MISMATCH, VERIFIED, _load_acts, load_checkpoints, replay,
                         spec_versions, trace_specs)

SINCE = dict(RULES)
RAW = ("alpha", "beta", "gamma")

_NEEDS = {
    "trim": re.compile(r"^rollup-.+-total$"),
    "round": re.compile(r"^concept-(?:third|quarter|norm|freeboard|knot|rigging|jetty)$|^rollup-.+-mean$"),
    "hold": re.compile(r"^rollup-|^concept-norm$"),
    "sink": re.compile(r"^rollup-keel-count$|^rollup-.+-even$"),
}


def asserted_ids(events: list) -> set:
    ids = set()
    for e in events:
        if e.get("op") == "expect":
            for step in e.get("loc") or []:
                if isinstance(step, dict) and isinstance(step.get("tid"), str):
                    ids.add(step["tid"])
                elif isinstance(step, str):
                    ids.add(step)
    return ids


def _people(fx: dict):
    for p in fx.get("people") or []:
        if isinstance(p, dict):
            yield p


def has_blank(fx: dict) -> bool:
    return any(p.get(f) is None for p in _people(fx) for f in RAW)


def fill_blanks(fx: dict) -> dict:
    """The fixture with every blank raw number given a value (7)."""
    fx = copy.deepcopy(fx)
    for p in _people(fx):
        for f in RAW:
            if p.get(f) is None:
                p[f] = 7
    return fx


def _values(events: list, k: int) -> dict[int, str]:
    """{event index: model value} of the test's verified assertions."""
    return {o.index: o.model for o in replay(events, k)
            if o.status in (VERIFIED, MISMATCH) and o.where != "audit"}


def _with_fixture(events: list, change) -> list:
    return [dict(e, fixture=change(e["fixture"])) if e.get("op") == "seed" else e for e in events]


def _fixtures(events: list) -> list[dict]:
    return [e["fixture"] for e in events if e.get("op") == "seed" and isinstance(e.get("fixture"), dict)]


def needs(rule: str, events: list, k: int, base: dict | None = None) -> bool:
    """Does this test, in force at k, assert a figure `rule` governs?"""
    if k < SINCE[rule]:
        return False
    if rule == "missing":
        if not any(has_blank(fx) for fx in _fixtures(events)):
            return False
        base = base if base is not None else _values(events, k)
        filled = _values(_with_fixture(events, fill_blanks), k)
        return any(filled.get(i) != v for i, v in base.items())
    return any(_NEEDS[rule].search(t) for t in asserted_ids(events))


def bites(rule: str, events: list, k: int, base: dict | None = None) -> bool:
    """Would an app ignoring `rule` fail this test at k (some asserted value changes)?"""
    base = base if base is not None else _values(events, k)
    with ablated(rule):
        got = _values(events, k)
    return any(got.get(i) != v for i, v in base.items())


@dataclass
class Violation:
    k: int
    basename: str
    title: str
    rule: str

    def __str__(self) -> str:
        return (f"cp{self.k:02d} {self.basename}::{self.title} [{self.rule}] does not exercise the "
                f"rule: an app ignoring it passes")


def check(checkpoints: list[dict], through: int, rules: list[str],
          root: str = HARNESS_ROOT) -> tuple[list[Violation], dict]:
    """Check every test installed from a rule's checkpoint on, at the first and last checkpoint it
    is in force for, for an asserted value the rule moves."""
    _load_acts()
    versions = spec_versions(checkpoints, through, root)
    traces = trace_specs(v.path for v in versions)
    out: list[Violation] = []
    stats = {r: {"needed": 0, "bite": 0} for r in rules}
    for v in versions:
        for t in traces[v.path].get("tests") or []:
            events = t.get("events") or []
            if t.get("error") or not events:
                continue
            for rule in rules:
                if v.start < SINCE[rule]:
                    continue      # the rule is standing for tests installed from its checkpoint on
                for k in sorted({v.start, v.end}):
                    base = _values(events, k)
                    if not base or not needs(rule, events, k, base):
                        continue
                    stats[rule]["needed"] += 1
                    if bites(rule, events, k, base):
                        stats[rule]["bite"] += 1
                    else:
                        out.append(Violation(k, v.basename, t["title"], rule))
    return out, stats


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Check that the specs exercise the standing rules.")
    ap.add_argument("--config", required=True)
    ap.add_argument("--checkpoints", help="override checkpoints file")
    ap.add_argument("--rule", default=",".join(SINCE), help="comma-separated: " + ",".join(SINCE))
    ap.add_argument("--through", type=int, default=10**9)
    args = ap.parse_args(argv)
    rules = [r.strip() for r in args.rule.split(",") if r.strip()]
    bad = [r for r in rules if r not in SINCE]
    if bad:
        print(f"error: unknown rule(s) {bad}", file=sys.stderr)
        return 2
    cps = load_checkpoints(args.config, args.checkpoints)
    violations, stats = check(cps, min(args.through, len(cps)), rules)
    for v in violations:
        print(v)
    print()
    for r in rules:
        s = stats[r]
        print(f"  {r:8s} from cp{SINCE[r]}: {s['needed']} check(s) need it, {s['bite']} bite; "
              f"{sum(1 for v in violations if v.rule == r)} violation(s)")
    return 1 if violations else 0


if __name__ == "__main__":
    sys.exit(main())

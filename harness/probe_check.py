"""Do the standing-rule probes in the specs actually bite?

The stream keeps four cross-cutting rules exercised for the rest of the run after they appear
(acceptance/WORKSPACE.md §6): people on hold (cp73-76), per-sheet settings (cp81-84), shared people
(cp101-104) and dated history (cp113-116). A test carries a probe for a rule: a held person, non-default
settings, a shared person, or a history entry dated after the anchor. A probe that leaves every
asserted value unchanged tests nothing: an app that ignored the rule would still pass.

This checks each probe by ablation. It treats the fixture the way an app that ignored the rule would,
replays the test through the reference model (harness/oracle) and requires at least one asserted
value to change:

  hold      every person's `hold` (and every share's own `hold`) is cleared (a held person counted
            like anyone else)
  settings  every `settings` object is dropped (the sheet defaults used instead)
  history   every history entry is dated at the start of time (dates ignored, all changes counted)
  identity  every `shares` row is dropped (the shared person missing from the sheet)

It also finds the tests that NEED a probe and lack one that bites: from cp77 a test asserting a
sheet-wide or patron/follow figure (hold), from cp85 a test whose asserted values move when the
settings move (settings), from cp105 a sheet-wide or patron/follow figure (identity), and from
cp117 a test whose asserted values move when a raw number moves (history). "Moves" is decided by
the model too: the fixture is perturbed and the test replayed. And at least a quarter of the
history-probed tests also assert under the as-of view (AS_OF_SHARE).

    .venv/bin/python -m harness.probe_check --config config.yaml [--rule hold,settings] [--through K]

Exit code 0 = every probe bites and every test that needs one has one; 1 = a violation.
"""
from __future__ import annotations

import argparse
import copy
import os
import sys
from dataclasses import dataclass

from . import fixtures
from .spec_check import (HARNESS_ROOT, MISMATCH, VERIFIED, _load_acts, load_checkpoints, replay,
                         spec_versions, trace_specs)

# The first checkpoint at which each rule is standing.
SINCE = {"hold": 77, "settings": 85, "identity": 105, "history": 117}
AS_OF_SHARE = 0.25          # of the history-probed tests, the share that also use the as-of view


def _sheets(fx: dict):
    """The fixture itself (the default sheet) and every `sheets[]` entry."""
    yield fx
    for sh in fx.get("sheets") or []:
        if isinstance(sh, dict):
            yield sh


def _people(fx: dict):
    for sh in _sheets(fx):
        for p in sh.get("people") or []:
            if isinstance(p, dict):
                yield p


# ---- what a probe is, and how an app that ignored the rule would read the fixture ---------------

def has_probe(rule: str, fx: dict) -> bool:
    if rule == "hold":
        return (any(p.get("hold") is True for p in _people(fx))
                or any(isinstance(sh, dict) and sh.get("hold") is True for sh in fx.get("shares") or []))
    if rule == "settings":
        return any(sh.get("settings") for sh in _sheets(fx))
    if rule == "identity":
        return bool(fx.get("shares"))
    if rule == "history":
        return bool(fx.get("history"))
    raise ValueError(rule)


def ablate(rule: str, fx: dict) -> dict:
    fx = copy.deepcopy(fx)
    if rule == "hold":
        for p in _people(fx):
            p.pop("hold", None)
        for sh in fx.get("shares") or []:          # a shared person's own hold on a sheet (cp240)
            if isinstance(sh, dict):
                sh.pop("hold", None)
    elif rule == "settings":
        for sh in _sheets(fx):
            sh.pop("settings", None)
    elif rule == "identity":
        fx.pop("shares", None)
    elif rule == "history":
        for h in fx.get("history") or []:
            h["from"] = "0001-01-01"
    return fx


# Perturbations that decide whether a test's asserted values depend on the rule at all.
_PERTURB_SETTINGS = {"regionMultipliers": {"N": 7, "S": 5, "other": 4},
                     "bandFrom": {"D": 0, "C": 90, "B": 240, "A": 480},
                     "bandMultipliers": {"A": 9, "B": 7, "C": 5, "D": 3, "E": 2},
                     "gradeWeights": {"LOW": 2, "MID": 4, "HIGH": 7}}


def perturb(rule: str, fx: dict) -> dict | None:
    fx = copy.deepcopy(fx)
    if rule == "settings":
        for sh in _sheets(fx):
            sh.setdefault("settings", copy.deepcopy(_PERTURB_SETTINGS))
        return fx
    if rule == "history":
        for p in _people(fx):
            if isinstance(p.get("alpha"), int):
                p["alpha"] += 1
        return fx
    return None   # hold and identity are decided by the figures a test asserts


# ---- replay -------------------------------------------------------------------------------------

def _values(events: list, k: int) -> dict[int, str] | None:
    """{event index: model value} of the test's verified assertions, or None if it cannot replay."""
    out = {}
    for o in replay(events, k):
        if o.status in (VERIFIED, MISMATCH) and o.where != "audit":
            out[o.index] = o.model
    return out


def _with_fixture(events: list, change) -> list | None:
    """The events with every seeded fixture passed through `change`; None if nothing was seeded."""
    out, seeded = [], False
    for e in events:
        if e.get("op") == "seed":
            e = dict(e, fixture=change(e["fixture"]))
            seeded = True
        out.append(e)
    return out if seeded else None


def _fixtures(events: list) -> list[dict]:
    return [e["fixture"] for e in events if e.get("op") == "seed" and isinstance(e.get("fixture"), dict)]


# Driving a rule through the UI is a probe in itself: the test watches the figures move.
_UI_PROBE = {"hold": ("person-hold-",), "settings": ("sheet-setting-", "sheet-settings-save"),
             "identity": ("person-share-",), "history": ("sheet-as-of", "person-form-effective-date")}


def _drives_in_ui(rule: str, events: list) -> bool:
    for e in events:
        if e.get("op") in ("click", "fill", "select"):
            for step in e.get("loc") or []:
                if isinstance(step, dict) and str(step.get("tid", "")).startswith(_UI_PROBE[rule]):
                    return True
    return False


def _needs_by_ids(rule: str, events: list) -> bool:
    """hold and identity are needed by a test that asserts a sheet-wide or patron/follow figure."""
    ids = set()
    for e in events:
        if e.get("op") == "expect":
            for step in e.get("loc") or []:
                if isinstance(step, dict) and isinstance(step.get("tid"), str):
                    ids.add(step["tid"])
                elif isinstance(step, str):
                    ids.add(step)
    return any(fixtures._SHEET_WIDE.search(t) for t in ids)


@dataclass
class Violation:
    k: int
    basename: str
    title: str
    rule: str
    problem: str

    def __str__(self) -> str:
        return f"cp{self.k:02d} {self.basename}::{self.title} [{self.rule}] {self.problem}"


def check(checkpoints: list[dict], through: int, rules: list[str],
          root: str = HARNESS_ROOT) -> tuple[list[Violation], dict]:
    """Check every test installed from a rule's standing checkpoint on, where it is installed, for a
    probe that bites, or for a missing probe it needs."""
    _load_acts()
    versions = spec_versions(checkpoints, through, root)
    traces = trace_specs(v.path for v in versions)
    out: list[Violation] = []
    stats = {r: {"probes": 0, "bite": 0, "needs": 0} for r in rules}
    stats["as_of"] = {"history_tests": 0, "as_of": 0}
    for v in versions:
        for t in traces[v.path].get("tests") or []:
            events = t.get("events") or []
            if t.get("error") or not events:
                continue
            fxs = _fixtures(events)
            for rule in rules:
                # the rule is standing for tests written from its checkpoint on; earlier specs
                # still in force predate it
                k = v.start
                if k < SINCE[rule]:
                    continue
                in_ui = _drives_in_ui(rule, events)
                present = any(has_probe(rule, fx) for fx in fxs)
                if rule == "history" and (present or in_ui):
                    stats["as_of"]["history_tests"] += 1
                    stats["as_of"]["as_of"] += any(
                        str(st.get("tid", "")).startswith("sheet-as-of")
                        for e in events if e.get("op") in ("click", "fill")
                        for st in e.get("loc") or [] if isinstance(st, dict))
                if in_ui:
                    continue      # driving the rule in the UI is its probe
                base = _values(events, k)
                if not base:
                    continue
                if rule in ("hold", "identity"):
                    needed = _needs_by_ids(rule, events)
                else:
                    pert = _with_fixture(events, lambda fx: perturb(rule, fx))
                    got = _values(pert, k) if pert else None
                    needed = got is not None and any(got.get(i) != val for i, val in base.items())
                if present:
                    stats[rule]["probes"] += 1
                    ab = _with_fixture(events, lambda fx: ablate(rule, fx))
                    got = _values(ab, k) if ab else None
                    if got is not None and any(got.get(i) != val for i, val in base.items()):
                        stats[rule]["bite"] += 1
                        continue
                if not needed:
                    continue      # a probe a test does not need may be redundant, never wrong
                stats[rule]["needs"] += 1
                out.append(Violation(k, v.basename, t["title"], rule,
                                     "probe does not bite: ignoring the rule changes no asserted value"
                                     if present else
                                     "needs a probe: its asserted figures depend on the rule"))
    return out, stats


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Check that standing-rule probes bite.")
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
        print(f"  {r:9s} from cp{SINCE[r]}: {s['probes']} probe(s), {s['bite']} bite; "
              f"{sum(1 for v in violations if v.rule == r)} violation(s)")
    short = False
    if "history" in rules:
        h = stats["as_of"]
        need = -(-h["history_tests"] * AS_OF_SHARE // 1)
        short = h["as_of"] < need
        print(f"  as-of     {h['as_of']} of {h['history_tests']} history-probed test(s) use the as-of view"
              f" (need {int(need)}){'  SHORT' if short else ''}")
    return 1 if violations or short else 0


if __name__ == "__main__":
    sys.exit(main())

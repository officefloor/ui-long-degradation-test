"""Deterministic tests for the rule-exercise checks (harness.probe_check).
Run: .venv/bin/python -m harness.probe_check_selftest
"""
from __future__ import annotations

from . import probe_check as p
from .oracle.core import _load_acts

PEOPLE = [{"id": 1, "name": "Ada", "alpha": 3, "beta": 5, "gamma": 4},
          {"id": 2, "name": "Ben", "alpha": 2, "beta": 6, "gamma": 3},
          {"id": 3, "name": "Cam", "alpha": 5, "beta": 4, "gamma": 9},
          {"id": 9, "name": "Hz", "alpha": 9, "beta": 9, "gamma": 9, "hold": True},
          {"id": 6, "name": "Moe", "alpha": 2, "beta": 4, "gamma": None}]


def _events(ids, people=PEOPLE):
    ev = [{"op": "seed", "fixture": {"people": people}}, {"op": "goto", "url": "/"}]
    for t in ids:
        loc = [{"tid": x} for x in (t if isinstance(t, tuple) else (t,))]
        ev.append({"op": "expect", "loc": loc, "matcher": "toHaveText", "value": "0"})
    return ev


def test_rules_start_at_the_streams_checkpoints():
    assert p.SINCE == {"trim": 4, "round": 8, "hold": 12, "sink": 16, "missing": 20}


def test_which_ids_need_which_rule():
    total = _events(["rollup-thrust-total"])
    assert p.needs("trim", total, 30) and p.needs("hold", total, 30)
    assert not p.needs("trim", total, 3)                      # before the rule exists
    assert not p.needs("sink", total, 30)
    assert p.needs("sink", _events(["rollup-fathom-even"]), 30)
    assert p.needs("round", _events([("person-row-1", "concept-third")]), 30)
    assert not p.needs("round", _events([("person-row-1", "concept-thrust")]), 30)


def test_blank_raw_is_needed_only_when_it_moves_an_asserted_value():
    moe = _events([("person-row-6", "concept-momentum")])
    assert p.needs("missing", moe, 30)
    assert not p.needs("missing", _events([("person-row-6", "concept-thrust")]), 30)  # no gamma
    assert p.fill_blanks({"people": PEOPLE})["people"][-1]["gamma"] == 7
    assert PEOPLE[-1]["gamma"] is None                          # never touches the original


def test_ablation_bites_where_the_rule_moves_a_value():
    _load_acts()
    assert p.bites("trim", _events(["rollup-thrust-total"]), 30)
    held_top = _events(["rollup-fathom-top"])
    assert p.bites("hold", held_top, 70)                       # Hz (held) has the highest fathom
    assert p.bites("missing", _events([("person-row-6", "concept-momentum")]), 30)
    assert not p.bites("missing", _events([("person-row-1", "concept-momentum")]), 30)


def main() -> int:
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
        print(f"  ok  {t.__name__}")
    print(f"OK — {len(tests)} tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

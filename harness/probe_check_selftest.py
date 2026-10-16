"""Deterministic tests for the probe-bite checks (harness.probe_check).
Run: .venv/bin/python -m harness.probe_check_selftest
"""
from __future__ import annotations

from . import probe_check as p

FX = {"anchor": "2026-03-01",
      "people": [{"id": 1, "alpha": 3, "hold": True}, {"id": 2, "alpha": 5}],
      "settings": {"regionMultipliers": {"N": 4}},
      "sheets": [{"id": "S2", "people": [{"id": 1, "alpha": 1, "hold": True}],
                  "settings": {"gradeWeights": {"MID": 2}}}],
      "shares": [{"personId": 7, "fromSheetId": "S2", "fromPersonId": 1}],
      "history": [{"personId": 1, "field": "alpha", "value": 9, "from": "2026-04-01"}]}


def test_every_rule_sees_its_probe_and_ablation_removes_it():
    for rule in p.SINCE:
        assert p.has_probe(rule, FX), rule
    assert not p.has_probe("hold", p.ablate("hold", FX))
    assert not p.has_probe("settings", p.ablate("settings", FX))
    assert not p.has_probe("identity", p.ablate("identity", FX))
    assert p.ablate("history", FX)["history"][0]["from"] == "0001-01-01"   # dates ignored, not removed


def test_ablation_and_perturbation_never_touch_the_original():
    before = repr(FX)
    for rule in p.SINCE:
        p.ablate(rule, FX)
        p.perturb(rule, FX)
    assert repr(FX) == before


def test_perturbation_keeps_seeded_settings_and_moves_raw_numbers():
    got = p.perturb("settings", FX)
    assert got["settings"] == FX["settings"]                     # a sheet's own settings stay
    assert p.perturb("settings", {"people": []})["settings"] == p._PERTURB_SETTINGS
    assert [x["alpha"] for x in p.perturb("history", FX)["people"]] == [4, 6]
    assert p.perturb("hold", FX) is None and p.perturb("identity", FX) is None


def test_driving_a_rule_through_the_ui_is_a_probe():
    click = [{"op": "click", "loc": [{"tid": "person-hold-3"}]}]
    assert p._drives_in_ui("hold", click)
    assert not p._drives_in_ui("settings", click)
    assert p._drives_in_ui("history", [{"op": "fill", "loc": [{"tid": "sheet-as-of"}]}])


def test_hold_and_identity_are_needed_by_sheet_wide_and_link_figures():
    total = [{"op": "expect", "loc": [{"tid": "rollup-total-load"}]}]
    own = [{"op": "expect", "loc": [{"tid": "person-row-1"}, {"tid": "concept-thrust"}]}]
    link = [{"op": "expect", "loc": [{"tid": "person-row-1"}, {"tid": "concept-backing"}]}]
    assert p._needs_by_ids("hold", total) and p._needs_by_ids("identity", link)
    assert not p._needs_by_ids("hold", own)


def main() -> int:
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
        print(f"  ok  {t.__name__}")
    print(f"OK — {len(tests)} tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Deterministic tests for the reference model (harness.oracle) and the spec checker (harness.spec_check).
Run: .venv/bin/python -m harness.spec_check_selftest
"""
from __future__ import annotations

import io
import os
import tempfile

from . import spec_check as sc
from .oracle import REGISTRY, Session, Unmodelled, evaluate
from .oracle.core import Registry, _load_acts

DANA_RAVI = {"people": [{"id": 1, "name": "Dana", "alpha": 3, "beta": 4, "gamma": 10},
                        {"id": 2, "name": "Ravi", "alpha": 7, "beta": 2, "gamma": 5}]}


def _cell(fx, k, row, tid, **kw):
    return evaluate(fx, k, **kw)[(f"person-row-{row}", tid)]


# ---- the model ---------------------------------------------------------------------------------

def test_a_concept_version_holds_from_its_checkpoint_until_the_next():
    assert _cell(DANA_RAVI, 3, 1, "concept-momentum") == "26"     # cp03: 12 + 2*7
    assert _cell(DANA_RAVI, 4, 1, "concept-momentum") == "33"     # cp04: 12 + 3*7
    assert _cell(DANA_RAVI, 60, 2, "concept-momentum") == "8"
    assert ("person-row-1", "concept-tier") not in evaluate(DANA_RAVI, 4)   # tier arrives at cp05


def test_n_a_only_when_a_needed_input_is_missing():
    fx = {"people": [{"id": 1, "name": "NoGamma", "alpha": 3, "beta": 4, "gamma": None}]}
    out = evaluate(fx, 6)
    assert out[("person-row-1", "concept-thrust")] == "12", out
    assert out[("person-row-1", "concept-momentum")] == "n/a", out


def test_hold_rule_by_checkpoint():
    fx = {"people": [{"id": 1, "name": "Ann", "alpha": 5, "beta": 20, "gamma": 5, "grade": "LOW"},
                     {"id": 9, "name": "Hela", "alpha": 1, "beta": 3, "gamma": -2, "grade": "LOW",
                      "hold": True}]}                        # Hela momentum 3 + 3*(-3) = -6
    assert evaluate(fx, 72)[("rollup-total-load",)] == "94"      # no hold rule yet: 100 - 6
    assert evaluate(fx, 73)[("rollup-total-load",)] == "100"     # left out
    assert evaluate(fx, 76)[("rollup-total-load",)] == "97"      # at half, floor(-6/2) = -3
    assert evaluate(fx, 73)[("person-row-9", "concept-rank")] == "n/a"
    links = {"people": [{"id": 1, "name": "Ann", "alpha": 2, "beta": 3, "gamma": 2},
                        {"id": 9, "name": "Hela", "alpha": 10, "beta": 10, "gamma": 10, "hold": True}],
             "patrons": [{"personId": 1, "patronId": 9}]}
    assert _cell(links, 73, 1, "concept-backing") == "100"       # links unaffected until cp74
    assert _cell(links, 74, 1, "concept-backing") == "n/a"       # all patrons held: none


def test_settings_defaults_change_at_cp84_and_own_values_are_kept():
    fx = {"people": [{"id": 1, "name": "Dana", "alpha": 3, "beta": 4, "gamma": 10}],
          "regions": [{"personId": 1, "region": "N1"}, {"personId": 1, "region": "S2"}]}
    assert _cell(fx, 81, 1, "concept-reach") == str(33 * 2 + 33 * 3)
    assert _cell(fx, 84, 1, "concept-reach") == str(33 * 3 + 33 * 2)
    own = dict(fx, settings={"regionMultipliers": {"N": 4}})
    assert _cell(own, 84, 1, "concept-reach") == str(33 * 4 + 33 * 2)   # S takes the new default
    assert _cell(own, 80, 1, "concept-reach") == str(33 * 2 + 33 * 3)   # not settable before cp81


def test_history_as_of_and_momentum_change():
    fx = {"anchor": "2026-03-01",
          "people": [{"id": 1, "name": "Ada", "alpha": 5, "beta": 10, "gamma": 5}],
          "history": [{"personId": 1, "field": "beta", "value": 50, "from": "2026-02-15"},
                      {"personId": 1, "field": "beta", "value": 90, "from": "2026-03-02"}]}
    assert _cell(fx, 113, 1, "concept-momentum") == "250"                # 5*50, the 03-02 change waits
    assert _cell(fx, 112, 1, "concept-momentum") == "50"                 # no history before cp113
    assert _cell(fx, 115, 1, "concept-momentum", as_of="2026-02-15") == "250"   # on the day counts
    assert _cell(fx, 115, 1, "concept-momentum-change", as_of="2026-02-01") == "200"
    assert _cell(fx, 115, 1, "concept-momentum-change") == "n/a"
    assert _cell(fx, 115, 1, "person-history") == "2026-03-02 beta 90; 2026-02-15 beta 50"


def test_shared_people_share_numbers_not_links_and_state_per_sheet_from_cp104():
    fx = {"sheets": [{"id": "S1", "people": [{"id": 1, "name": "Dana", "alpha": 3, "beta": 4, "gamma": 10,
                                             "state": "FINAL"},
                                            {"id": 2, "name": "Ravi", "alpha": 7, "beta": 2, "gamma": 5}],
                      "patrons": [{"personId": 1, "patronId": 2}]},
                     {"id": "S2", "people": [{"id": 1, "name": "Uma", "alpha": 5, "beta": 20, "gamma": 5}]}],
          "shares": [{"sheetId": "S2", "personId": 7, "fromSheetId": "S1", "fromPersonId": 1}]}
    assert _cell(fx, 102, 7, "concept-momentum", sheet="S2") == "33"
    assert _cell(fx, 102, 1, "concept-backing", sheet="S1") == "14"
    assert _cell(fx, 102, 7, "concept-backing", sheet="S2") == "n/a"     # links belong to each sheet
    assert _cell(fx, 103, 7, "person-state", sheet="S2") == "FINAL"      # shared state
    assert _cell(fx, 104, 7, "person-state", sheet="S2") == "DRAFT"      # per sheet


def test_cp109_tide_is_the_requested_267_not_260():
    """The defect that started this tool: Dot's brace includes the backing from Ben."""
    p = lambda i, n, a, b, g, d, e, z, **kw: dict(id=i, name=n, alpha=a, beta=b, gamma=g, delta=d,
                                                  epsilon=e, zeta=z, active=True, **kw)
    fx = {"people": [p(1, "Ada", 2, 3, 5, 3, 4, 10), p(2, "Ben", 4, 2, 1, 5, 2, 1),
                     p(3, "Dot", 5, 20, 5, 5, 20, 5), p(4, "Gus", 1, 1, 1, 1, -30, 1)],
          "patrons": [{"personId": 1, "patronId": 2}, {"personId": 1, "patronId": 3},
                      {"personId": 3, "patronId": 2}],
          "follows": [{"from": 1, "to": 2}, {"from": 1, "to": 3}, {"from": 1, "to": 4}]}
    assert _cell(fx, 109, 1, "concept-tide") == "267"
    assert _cell(fx, 112, 1, "concept-tide") == "326"                    # positive braces only


def test_session_clicks_follow_the_controls_registered_at_k():
    s = Session(59)
    s.seed({"people": [{"id": 1, "name": "Al", "alpha": 5, "beta": 20, "gamma": 5, "state": "FINAL"}]})
    s.click("person-demote-1")
    assert s.view().text(("person-state-error",)) == ""
    try:
        s.click("person-rework-1")                                       # rework arrives at cp60
        raise AssertionError("an unregistered control must not be silently accepted")
    except Unmodelled:
        pass
    s = Session(60)
    s.seed({"people": [{"id": 1, "name": "Al", "alpha": 5, "beta": 20, "gamma": 5, "state": "FINAL"}]})
    s.click("person-rework-1")
    assert s.audit == ["STATE_CHANGED id=1 from=FINAL to=REWORK"], s.audit


def test_registry_refuses_two_versions_from_the_same_checkpoint():
    r = Registry()
    r.person("x", since=5)(lambda c, p: 1)
    try:
        r.person("x", since=5)(lambda c, p: 2)
        raise AssertionError("duplicate version accepted")
    except ValueError:
        pass


# ---- the checker -------------------------------------------------------------------------------

HEAD = "import { test, expect } from '@playwright/test';\nimport { resetAndSeed } from '../support/seed';\n"


def _spec(body: str) -> str:
    return HEAD + "test.describe('d', () => {\n" + body + "\n});\n"


def _test(title: str, body: str, fixture: str = None) -> str:
    fixture = fixture or ("{ people: [{ id: 1, name: 'Dana', alpha: 3, beta: 4, gamma: 10 },"
                          " { id: 2, name: 'Ravi', alpha: 7, beta: 2, gamma: 5 }] }")
    return (f"  test('{title}', async ({{ page }}) => {{\n    await resetAndSeed({fixture});\n"
            f"    await page.goto('/');\n{body}\n  }});")


def _run(specs: dict, ids: list[str], through: int, **kw):
    with tempfile.TemporaryDirectory() as root:
        for rel, text in specs.items():
            path = os.path.join(root, "acceptance/specs", rel)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            open(path, "w").write(text)
        cps = [{"id": i, "n": n, "test": f"acceptance/specs/{i}.spec.ts"} for n, i in enumerate(ids, 1)]
        findings = sc.check(cps, through, root=root, **kw)
        buf = io.StringIO()
        counts = sc.report(findings, out=buf)
        return findings, counts, buf.getvalue()


def _ids(n: int) -> list[str]:
    return [f"cp{i:02d}_x{i}" for i in range(1, n + 1)]


def test_checker_verifies_and_reports_a_wrong_expected_value():
    row = "page.getByTestId('person-row-1').getByTestId('concept-momentum')"
    spec = _spec(_test("momentum", f"    await expect({row}).toHaveText('33');\n"
                                   f"    await expect({row}).toHaveText('34');"))
    ids = _ids(4)
    _, counts, text = _run({f"{ids[3]}.spec.ts": spec}, ids, 4)
    assert counts["verified"] == 1 and counts["mismatch"] == 1, (counts, text)
    assert "cp04 cp04_x4.spec.ts::momentum  person-row-1/concept-momentum  expected '34' model '33'" in text, text


def test_checker_catches_a_mutation_that_forgot_a_checkpoint():
    """cp03's momentum spec stays in force at cp04 with no updated copy: cp04 changes its value."""
    ids = _ids(5)
    spec = _spec(_test("momentum", "    await expect(page.getByTestId('person-row-1')"
                                   ".getByTestId('concept-momentum')).toHaveText('26');"))
    findings, counts, text = _run({f"{ids[2]}.spec.ts": spec}, ids, 5)
    assert [(f.status, f.k_from, f.k_to) for f in findings] == [("verified", 3, 3), ("mismatch", 4, 5)], text


def test_a_copy_replaces_its_original_from_its_checkpoint():
    ids = _ids(4)
    row = "page.getByTestId('person-row-1').getByTestId('concept-momentum')"
    orig = _spec(_test("momentum", f"    await expect({row}).toHaveText('26');"))
    copy = _spec(_test("momentum", f"    await expect({row}).toHaveText('33');"))
    _, counts, text = _run({f"{ids[2]}.spec.ts": orig, f"cp04/{ids[2]}.spec.ts": copy}, ids, 4)
    assert counts == {"verified": 2, "mismatch": 0, "unverified": 0, "unmodelled": 0}, text


def test_unknown_concepts_are_unmodelled_and_steps_after_an_unknown_control_unverified():
    ids = _ids(5)
    spec = _spec(_test("t", "    await expect(page.getByTestId('person-row-1').getByTestId('concept-zork'))"
                            ".toHaveText('1');\n"
                            "    await page.getByTestId('zork-button').click();\n"
                            "    await expect(page.getByTestId('person-row-1').getByTestId('concept-thrust'))"
                            ".toHaveText('12');"))
    findings, counts, text = _run({f"{ids[4]}.spec.ts": spec}, ids, 5)
    assert counts["unmodelled"] == 1 and counts["unverified"] == 1 and counts["mismatch"] == 0, text
    assert "concept-zork" in text and "control zork-button" in text, text


def test_loops_row_helpers_and_interactions_are_replayed():
    ids = _ids(7)
    body = """    const row = (id: number) => page.getByTestId(`person-row-${id}`);
    const expected: Record<number, string> = { 1: '12', 2: '14' };
    for (const [id, v] of Object.entries(expected)) {
      await expect(row(Number(id)).getByTestId('concept-thrust')).toHaveText(v);
    }
    await page.getByTestId('person-edit-1').click();
    await page.getByTestId('person-form-alpha').fill('8');
    await page.getByTestId('person-form-submit').click();
    await expect(row(1).getByTestId('concept-thrust')).toHaveText('32');
    await expect(page.getByTestId(/^person-row-/)).toHaveCount(2);"""
    _, counts, text = _run({f"{ids[6]}.spec.ts": _spec(_test("t", body))}, ids, 7)
    assert counts == {"verified": 4, "mismatch": 0, "unverified": 0, "unmodelled": 0}, text


def test_a_mismatch_beyond_the_modelled_acts_is_unmodelled_not_a_defect():
    _load_acts()
    k = REGISTRY.covered_through + 1
    ids = _ids(k)
    spec = _spec(_test("m", "    await expect(page.getByTestId('person-row-1')"
                            ".getByTestId('concept-momentum')).toHaveText('99');"))
    findings, counts, text = _run({f"{ids[-1]}.spec.ts": spec}, ids, k)
    assert counts["mismatch"] == 0 and counts["unmodelled"] == 1, text
    assert "beyond the model" in text, text


def main() -> int:
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
        print(f"  ok  {t.__name__}")
    print(f"OK — {len(tests)} tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

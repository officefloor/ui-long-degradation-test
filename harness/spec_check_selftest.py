"""Deterministic tests for the reference model (harness.oracle) and the spec checker (harness.spec_check).
Run: .venv/bin/python -m harness.spec_check_selftest
"""
from __future__ import annotations

import io
import os
import tempfile

from . import spec_check as sc
from .oracle import REGISTRY, Session, Unmodelled, evaluate
from .oracle import overload as ov
from .oracle.core import Registry, _load_acts

DANA_RAVI = {"people": [{"id": 1, "name": "Dana", "alpha": 3, "beta": 4, "gamma": 10},
                        {"id": 2, "name": "Ravi", "alpha": 7, "beta": 2, "gamma": 5}]}


def _cell(fx, k, row, tid, **kw):
    return evaluate(fx, k, **kw)[(f"person-row-{row}", tid)]


# ---- the model (harness/oracle/overload.py) ----------------------------------------------------

def test_a_concept_version_holds_from_its_checkpoint_until_the_next():
    assert _cell(DANA_RAVI, 3, 1, "concept-momentum") == "33"     # cp03: 12 + 3*(10-3)
    assert _cell(DANA_RAVI, 9, 1, "concept-keel") == "99"         # cp09: scaled 66 + momentum 33
    assert _cell(DANA_RAVI, 15, 1, "concept-keel") == "99"
    assert _cell(DANA_RAVI, 16, 1, "concept-keel") == "124"       # cp16: + norm 66-41 = 25
    assert ("person-row-1", "concept-keel") not in evaluate(DANA_RAVI, 8)   # keel arrives at cp09


def test_a_blank_is_n_a_until_cp20_then_zero():
    fx = {"people": [{"id": 1, "name": "A", "alpha": 3, "beta": 4, "gamma": None}]}
    assert _cell(fx, 19, 1, "concept-thrust") == "12"             # needs no gamma
    assert _cell(fx, 19, 1, "concept-momentum") == "n/a"
    assert _cell(fx, 20, 1, "concept-momentum") == "3"            # 12 + 3*(0-3)


def test_totals_trim_from_cp4_and_halve_the_held_from_cp12():
    fx = {"people": [{"id": 1, "name": "A", "alpha": 2, "beta": 3, "gamma": 0},     # thrust 6
                     {"id": 2, "name": "B", "alpha": 3, "beta": 4, "gamma": 0},     # 12
                     {"id": 3, "name": "C", "alpha": 4, "beta": 5, "gamma": 0},     # 20
                     {"id": 4, "name": "D", "alpha": 1, "beta": 2, "gamma": 0},     # 2
                     {"id": 5, "name": "H", "alpha": 5, "beta": 5, "gamma": 0, "hold": True}]}  # 25
    total = lambda k: evaluate(fx, k)[("rollup-thrust-total",)]
    assert total(3) == "65"                                       # everyone
    assert total(4) == "38"                                       # 65 - 25 - 2
    assert total(12) == "31"                                      # H 25/2 -> 13, then 6+12+13


def test_an_average_rounds_like_every_divide():
    one, three = {"alpha": 1, "beta": 1, "gamma": 1}, {"alpha": 1, "beta": 2, "gamma": 1}
    fx = {"people": [dict(one, id=1, name="A")] + [dict(three, id=i, name=f"B{i}") for i in (2, 3, 4)]}
    assert _cell(fx, 7, 1, "concept-norm") == "-1"                # scaled 2 - floor(14/4 = 3.5)
    assert _cell(fx, 8, 1, "concept-norm") == "-2"                # 2 - nearest(3.5) = 4


def test_a_keel_below_zero_leaves_every_count_from_cp16():
    fx = {"people": DANA_RAVI["people"] + [{"id": 3, "name": "Lee", "alpha": 1, "beta": 1, "gamma": 0}]}
    # cp16 keels: Dana 139, Ravi 14, Lee -4 - 2 - 30 = -36 (even, but below zero)
    assert evaluate(fx, 16)[("rollup-keel-count",)] == "1"
    with ov.ablated("sink"):
        assert evaluate(fx, 16)[("rollup-keel-count",)] == "2"
    assert not ov.OFF                                             # the ablation is undone


def test_patronage_is_mutual_from_cp40():
    fx = dict(DANA_RAVI, patrons=[{"personId": 1, "patronId": 2}])
    assert _cell(fx, 39, 1, "concept-backing") == "8" and _cell(fx, 39, 2, "concept-backing") == "0"
    assert _cell(fx, 40, 2, "concept-backing") == "33"            # Dana now backs Ravi


def test_a_tail_tweak_adds_to_the_definition_in_force():
    assert _cell(DANA_RAVI, 67, 1, "concept-fathom") == "227"     # keel 194 + momentum 33
    assert _cell(DANA_RAVI, 68, 1, "concept-fathom") == "295"     # + 68
    assert ov.reader_text("fathom", 220) == "keel plus momentum plus 288"


def test_no_checkpoint_adds_a_figure_twice():
    _load_acts()
    names = [n for n, vs in REGISTRY.sheet_figures.items() if vs[0].show]
    shown = [REGISTRY.sheet_figures[n][0].show for n in names]
    assert len(shown) == len(set(shown))
    assert ov.FIGURES[61] == ("fathom", "low")                    # fathom-total exists from cp51
    assert all(ft != "total" or k < 61 or f"{r}-total" not in
               {f"{r2}-total" for k2, (r2, t2) in ov.FIGURES.items() if t2 == "total" and k2 < k}
               for k, (r, ft) in ov.FIGURES.items())


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
    """cp09's keel spec stays in force at cp16 with no updated copy: cp16 changes its value."""
    ids = _ids(17)
    spec = _spec(_test("keel", "    await expect(page.getByTestId('person-row-1')"
                               ".getByTestId('concept-keel')).toHaveText('99');"))
    findings, counts, text = _run({f"{ids[8]}.spec.ts": spec}, ids, 17)
    assert [(f.status, f.k_from, f.k_to) for f in findings] == [("verified", 9, 15), ("mismatch", 16, 17)], text


def test_a_copy_replaces_its_original_from_its_checkpoint():
    ids = _ids(16)
    row = "page.getByTestId('person-row-1').getByTestId('concept-keel')"
    orig = _spec(_test("keel", f"    await expect({row}).toHaveText('99');"))
    copy = _spec(_test("keel", f"    await expect({row}).toHaveText('124');"))
    _, counts, text = _run({f"{ids[8]}.spec.ts": orig, f"cp16/{ids[8]}.spec.ts": copy}, ids, 16)
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


def test_loops_and_row_helpers_replay_and_an_unknown_control_stops_the_replay():
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
    # the loop and row helper replay; this stream has no editor, so the steps after the click are
    # reported unverified (never silently passed)
    assert counts == {"verified": 2, "mismatch": 0, "unverified": 2, "unmodelled": 0}, text
    assert "click control person-edit-N" in text, text


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

"""Deterministic tests for the spec bookkeeping and lints (harness.fixtures) and the harness-owned files.
Run: .venv/bin/python -m harness.fixtures_selftest
"""
from __future__ import annotations

import os
import tempfile

from . import correctness as c
from . import fixtures as f

SPEC = """import {{ test }} from '@playwright/test';
test.describe('x', () => {{
  test("{title}", async ({{ page }}) => {{
    {pre}
    await page.goto('/'); // {fixture}
  }});
}});
"""


def _stream(root: str, specs: dict[str, str], cps: list[dict]) -> list[dict]:
    for rel, body in specs.items():
        p = os.path.join(root, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, "w").write(body)
    return [dict(cp, n=i) for i, cp in enumerate(cps, 1)]


def _spec(title: str, fixture: str, pre: str = "") -> str:
    return SPEC.format(title=title, fixture=fixture, pre=pre)


def test_harness_files_install_flag_edits_and_never_copy_back():
    from . import run_experiment as r
    with tempfile.TemporaryDirectory() as app:
        cfg = {"acceptance": {"dest_subpath": "e2e/specs",
                              "harness_files": {"AGENTS.md": "acceptance/AGENTS.md",
                                                "e2e/support/ui.ts": "acceptance/support/ui.ts"}},
               "agent": {"instruction_files": {"CLAUDE.md": "acceptance/agents/claude-code/CLAUDE.md"}}}
        r.install_harness_files(app, cfg, {})
        assert r.harness_files_touched(app, cfg) == []
        assert open(os.path.join(app, "CLAUDE.md")).read().strip() == "@AGENTS.md"
        open(os.path.join(app, "AGENTS.md"), "a").write("\nagent edit\n")
        assert r.harness_files_touched(app, cfg) == ["AGENTS.md"]
        assert set(r.copy_back_excludes(cfg)) == {"e2e/specs/", "/AGENTS.md", "/CLAUDE.md",
                                                  "/e2e/support/ui.ts"}
        prov = r.harness_files_provenance(cfg)
        assert prov["AGENTS.md"]["source"] == "acceptance/AGENTS.md" and len(prov["AGENTS.md"]["sha256"]) == 64
        assert prov["CLAUDE.md"]["source"] == "acceptance/agents/claude-code/CLAUDE.md"
        # Re-installing restores the file.
        r.install_harness_files(app, cfg)
        assert r.harness_files_touched(app, cfg) == []


def test_a_copy_may_drop_a_test_only_if_retired():
    with tempfile.TemporaryDirectory() as root:
        S = "acceptance/specs"
        specs = {f"{S}/cp01_a.spec.ts": _spec("keep", "{}") + _spec("gone", "{}"),
                 f"{S}/cp02_b.spec.ts": _spec("b", "{}"),
                 f"{S}/cp02/cp01_a.spec.ts": _spec("keep", "{}")}
        cps = _stream(root, specs, [{"id": "cp01_a", "test": f"{S}/cp01_a.spec.ts"},
                                    {"id": "cp02_b", "test": f"{S}/cp02_b.spec.ts", "mutates": [1]}])
        assert f.undeclared_retirements(cps, root) == ["cp02 drops cp01_a.spec.ts::gone"]
        cps[1]["retires"] = ["cp01_a.spec.ts::gone"]
        assert f.undeclared_retirements(cps, root) == []
        cps[1]["retires"] = ["cp09_x.spec.ts::nope"]
        assert any("ships no copy" in v for v in f.undeclared_retirements(cps, root))


def test_a_copy_imports_from_where_it_is_installed_not_where_it_is_written():
    with tempfile.TemporaryDirectory() as root:
        S = "acceptance/specs"
        good = "import { resetAndSeed } from '../support/seed';\n"
        specs = {"acceptance/support/.keep": "",
                 f"{S}/cp01_a.spec.ts": good,
                 f"{S}/cp02_b.spec.ts": good,
                 f"{S}/cp02/cp01_a.spec.ts": good.replace("../", "../../")}
        cps = _stream(root, specs, [{"id": "cp01_a", "test": f"{S}/cp01_a.spec.ts"},
                                    {"id": "cp02_b", "test": f"{S}/cp02_b.spec.ts", "mutates": [1]}])
        assert f.unresolved_imports(cps, root) == [
            f"cp02 {S}/cp02/cp01_a.spec.ts: imports '../../support/seed', absent once installed"]
        open(os.path.join(root, S, "cp02/cp01_a.spec.ts"), "w").write(good)
        assert f.unresolved_imports(cps, root) == []


def test_replaced_tests_are_kept_titles_whose_body_changed():
    """A copy that keeps a title but changes what it does is listed; one carried unchanged, or
    changed only in its comments, is not; a new title is not (it has no earlier version)."""
    with tempfile.TemporaryDirectory() as root:
        S = "acceptance/specs"
        specs = {f"{S}/cp01_a.spec.ts": _spec("same", "{}") + _spec("changed", "{ asOf: '2026-01-01' }")
                 + _spec("commented", "{}", pre="// old note"),
                 f"{S}/cp02_b.spec.ts": _spec("b", "{}"),
                 f"{S}/cp02/cp01_a.spec.ts": _spec("same", "{}") + _spec("changed", "{ asOf: '2026-02-01' }")
                 + _spec("commented", "{}", pre="// a new note") + _spec("new title", "{}")}
        cps = _stream(root, specs, [{"id": "cp01_a", "test": f"{S}/cp01_a.spec.ts"},
                                    {"id": "cp02_b", "test": f"{S}/cp02_b.spec.ts", "mutates": [1]}])
        assert f.replaced_tests(cps, 2, root) == ["cp01_a.spec.ts::changed"], f.replaced_tests(cps, 2, root)
        assert f.replaced_tests(cps, 1, root) == []


def test_screen_violations_flag_other_urls_and_nav_clicks():
    with tempfile.TemporaryDirectory() as root:
        S = "acceptance/specs"
        ok = "await page.goto('/');\n    await page.getByTestId('client-row-1').click();"
        specs = {f"{S}/cp01_a.spec.ts": _spec("a", "{}", pre=ok),
                 f"{S}/cp02_b.spec.ts": _spec("b", "{}", pre="await page.goto('/invoices');"),
                 f"{S}/cp03_c.spec.ts": _spec("c", "{}", pre="await page.getByTestId('nav-clients').click();")}
        cps = _stream(root, specs, [{"id": "cp01_a", "test": f"{S}/cp01_a.spec.ts"},
                                    {"id": "cp02_b", "test": f"{S}/cp02_b.spec.ts"},
                                    {"id": "cp03_c", "test": f"{S}/cp03_c.spec.ts"}])
        v = f.screen_violations(cps, root)
        assert len(v) == 2 and v[0].startswith("cp02") and "/invoices" in v[0] and "nav-" in v[1], v


def test_a_copy_may_assert_only_anchors_the_agent_can_know():
    with tempfile.TemporaryDirectory() as root:
        S = "acceptance/specs"
        def spec(title, *ids):
            return _spec(title, "{}", " ".join(f"getByTestId('{i}');" for i in ids))
        specs = {f"{S}/cp01_a.spec.ts": spec("notes", "person-notes", "person-row-1"),
                 f"{S}/cp02_b.spec.ts": spec("score", "concept-sum", "person-row-2"),
                 f"{S}/cp02/cp01_a.spec.ts": spec("single score", "person-notes", "person-row-5")}
        cps = _stream(root, specs, [{"id": "cp01_a", "test": f"{S}/cp01_a.spec.ts"},
                                    {"id": "cp02_b", "test": f"{S}/cp02_b.spec.ts", "mutates": [1],
                                     "retires": ["cp01_a.spec.ts::notes"]}])
        # person-notes lives on only in the retired test; person-row-5 extends a family the own spec uses
        assert f.hidden_anchor_violations(cps, root) == [
            "cp02 cp01_a.spec.ts::single score asserts 'person-notes', which the agent cannot see"]
        cps[1]["keeps_anchors"] = ["person-notes"]
        assert f.hidden_anchor_violations(cps, root) == []


def test_an_own_spec_naming_a_checkpoint_is_a_leak():
    with tempfile.TemporaryDirectory() as root:
        S = "acceptance/specs"
        cps = _stream(root, {f"{S}/cp01_a.spec.ts": "// tier from momentum, per cp04.\n",
                             f"{S}/cp02_b.spec.ts": "// tier from momentum; cp4 and xcp04 are not tokens.\n"},
                      [{"id": "cp01_a", "test": f"{S}/cp01_a.spec.ts"},
                       {"id": "cp02_b", "test": f"{S}/cp02_b.spec.ts"}])
        assert f.own_spec_leaks(cps, root) == ["cp01 cp01_a.spec.ts: mentions cp04"]


def test_framing_leaks_flag_test_run_and_history_wording():
    assert f.framing_leaks("Maintained by the harness; replaced at every checkpoint.") == ["checkpoint", "harness"]
    assert f.framing_leaks("the fixtures of earlier checkpoints are replayed") == ["checkpoints", "earlier", "replay"]
    assert f.framing_leaks("never committed (gitignored)") == ["committed", "gitignored"]
    assert f.framing_leaks("FIRST read AGENTS.md; the test is in e2e/specs.") == []
    assert f.framing_leaks("Add 68 to fathom: fathom is now keel plus momentum, plus 68.") == []


def test_process_leaks_flag_harness_wording_not_behaviour():
    assert f.process_leaks("An updated copy of the discount spec ships in the sibling override folder.") \
        == ["override folder", "sibling", "updated copy"]
    assert f.process_leaks("// MUTATIVE change: shipped updated (mutates: [4, 8])") \
        == ["mutates", "mutative", "shipped updated"]
    assert f.process_leaks("Stacked discounts collapse to a single discount.") == []


def main() -> int:
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
        print(f"  ok  {t.__name__}")
    print(f"OK — {len(tests)} tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

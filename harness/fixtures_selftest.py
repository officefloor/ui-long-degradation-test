"""Deterministic tests for the test-data contract (harness.fixtures) and the harness-owned files.
Run: .venv/bin/python -m harness.fixtures_selftest
"""
from __future__ import annotations

import json
import os
import tempfile

from . import correctness as c
from . import fixtures as f

SPEC = """import {{ test }} from '@playwright/test';
test.describe('x', () => {{
  test("{title}", async ({{ page }}) => {{
    {pre}
    await resetAndSeed({fixture});
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


def test_fixtures_are_evaluated_with_local_consts_and_any_quote_style():
    with tempfile.TemporaryDirectory() as root:
        p = os.path.join(root, "cp01_a.spec.ts")
        open(p, "w").write(_spec("it's a title", "{ clients: rows, asOf: '2026-02-01' }",
                                 pre="const rows = Array.from({ length: 3 }, (_, i) => ({ id: i + 1 }));"))
        [(title, fx)] = f.spec_fixtures(p)
        assert title == "it's a title", title
        assert fx == {"clients": [{"id": 1}, {"id": 2}, {"id": 3}], "asOf": "2026-02-01"}, fx


def test_field_paths_name_fields_not_rows():
    fx = {"asOf": "x", "invoices": [{"id": 1, "lineItems": [{"qty": 1}]}, {"id": 2}]}
    assert f.field_paths(fx) == {"asOf", "invoices", "invoices[].id", "invoices[].lineItems",
                                 "invoices[].lineItems[].qty"}


def test_contract_is_past_data_minus_what_the_checkpoint_replaces():
    with tempfile.TemporaryDirectory() as root:
        S = "acceptance/specs"
        cps = _stream(root, {
            f"{S}/cp01_a.spec.ts": _spec("a", "{ clients: [{ id: 1 }] }"),
            f"{S}/cp02_b.spec.ts": _spec("b", "{ projects: [{ id: 1 }] }"),
            f"{S}/cp03_c.spec.ts": _spec("c", "{ invoices: [{ id: 1 }] }"),
            f"{S}/cp03/cp01_a.spec.ts": _spec("a2", "{ clients: [{ id: 1, archived: true }] }"),
        }, [{"id": "cp01_a", "test": f"{S}/cp01_a.spec.ts"},
            {"id": "cp02_b", "test": f"{S}/cp02_b.spec.ts"},
            {"id": "cp03_c", "test": f"{S}/cp03_c.spec.ts", "mutates": [1]}])
        assert f.fixture_contract(cps, 1, root)["data_sets"] == []          # nothing earlier
        c2 = [d["test"] for d in f.fixture_contract(cps, 2, root)["data_sets"]]
        assert c2 == ["a"], c2
        # cp03 replaces cp01: its old data is excluded, and cp03's own data (present) is never in.
        c3 = f.fixture_contract(cps, 3, root)
        assert [d["test"] for d in c3["data_sets"]] == ["b"], c3
        assert c3["excluded_mutated"] == [1], c3


def test_hidden_copy_seeding_an_unseen_field_is_flagged():
    with tempfile.TemporaryDirectory() as root:
        S = "acceptance/specs"
        specs = {f"{S}/cp01_a.spec.ts": _spec("a", "{ clients: [{ id: 1 }] }"),
                 f"{S}/cp02_b.spec.ts": _spec("b", "{ clients: [{ id: 1 }] }"),
                 f"{S}/cp02/cp01_a.spec.ts": _spec("a2", "{ clients: [{ id: 1, archived: true }] }")}
        cps = _stream(root, specs, [{"id": "cp01_a", "test": f"{S}/cp01_a.spec.ts"},
                                    {"id": "cp02_b", "test": f"{S}/cp02_b.spec.ts", "mutates": [1]}])
        v = f.hidden_field_violations(cps, root)
        assert len(v) == 1 and "clients[].archived" in v[0] and v[0].startswith("cp02"), v
        # Seeding it in the checkpoint's own (visible) spec clears it.
        open(os.path.join(root, f"{S}/cp02_b.spec.ts"), "w").write(
            _spec("b", "{ clients: [{ id: 1, archived: true }] }"))
        assert f.hidden_field_violations(cps, root) == []


def test_harness_files_install_flag_edits_and_never_copy_back():
    from . import run_experiment as r
    with tempfile.TemporaryDirectory() as app:
        cfg = {"acceptance": {"dest_subpath": "e2e/specs",
                              "harness_files": {"TEST.md": "acceptance/TEST.md",
                                                "e2e/support/seed.ts": "acceptance/support/seed.ts"}}}
        cp = {"_fixture_contract": {"checkpoint": 2, "data_sets": [{"spec": "s", "test": "t", "fixture": {}}]}}
        r.install_harness_files(app, cfg, cp)
        assert r.harness_files_touched(app, cfg) == []
        assert json.load(open(os.path.join(app, r.FIXTURE_CONTRACT)))["checkpoint"] == 2
        open(os.path.join(app, "TEST.md"), "a").write("\nagent edit\n")
        assert r.harness_files_touched(app, cfg) == ["TEST.md"]
        assert set(r.copy_back_excludes(cfg)) == {"e2e/specs/", "/TEST.md", "/e2e/support/seed.ts"}
        prov = r.harness_files_provenance(cfg)
        assert prov["TEST.md"]["source"] == "acceptance/TEST.md" and len(prov["TEST.md"]["sha256"]) == 64
        # Re-installing without a checkpoint restores the file and removes the stale contract.
        r.install_harness_files(app, cfg)
        assert r.harness_files_touched(app, cfg) == []
        assert not os.path.exists(os.path.join(app, r.FIXTURE_CONTRACT))


def test_seed_contract_column_is_blank_when_nothing_was_checked():
    o = c.score_results({"cp01_a.spec.ts::x": True}, 1)
    assert c.outcome_row(o, set())["seed_contract_failures"] == ""
    o.seed_contract = {"ok": False, "checked": 3, "failures": ["a", "b"]}
    assert c.outcome_row(o, set())["seed_contract_failures"] == 2
    o.seed_contract = {"ok": True, "checked": 3, "failures": []}
    assert c.outcome_row(o, set())["seed_contract_failures"] == 0


def main() -> int:
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for t in tests:
        t()
        print(f"  ok  {t.__name__}")
    print(f"OK — {len(tests)} tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

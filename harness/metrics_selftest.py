"""Deterministic unit tests for harness.metrics (Lizard + git only; no agents).
Run: .venv/bin/python -m harness.metrics_selftest
"""
from __future__ import annotations

import os
import subprocess
import tempfile

from . import metrics


def _run(cwd, *args):
    subprocess.run(args, cwd=cwd, check=True, capture_output=True, text=True)


def _git_repo(tmp):
    _run(tmp, "git", "init", "-q")
    _run(tmp, "git", "config", "user.email", "t@t")
    _run(tmp, "git", "config", "user.name", "t")
    return tmp


def _commit(tmp, msg):
    _run(tmp, "git", "add", "-A")
    _run(tmp, "git", "commit", "-q", "-m", msg)
    return subprocess.run(["git", "-C", tmp, "rev-parse", "HEAD"],
                          capture_output=True, text=True).stdout.strip()


def _write(tmp, rel, content):
    p = os.path.join(tmp, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "w").write(content)


def test_erosion_known_ratio():
    fns = [{"cc": 20, "nloc": 100}, {"cc": 1, "nloc": 1}]  # mass 200 vs 1; high=200
    assert abs(metrics.erosion(fns) - 200 / 201) < 1e-6
    assert metrics.erosion([]) == 0.0
    d = metrics.erosion_detail(fns)
    assert d["over_threshold"] == 1 and d["n_functions"] == 2


def test_functions_container_semantics():
    with tempfile.TemporaryDirectory() as tmp:
        _write(tmp, "src/main/java/Owner.java",
               "public class Owner { public int score(int x){ if(x>0){return 1;} return 0; } }")
        _write(tmp, "src/main/frontend/OwnersPage.tsx",
               "export function OwnersPage(){ const f=(n:number)=> n>0?1:0; return f(1); }")
        jf = metrics.functions(tmp, ["src/main/java/**/*.java"])
        tf = metrics.functions(tmp, ["src/main/frontend/**/*.{ts,tsx}"])
        assert jf and any(f["container"] == "Owner" for f in jf), jf   # class-qualified
        assert tf and all(f["container"] == "" for f in tf), tf        # file scope
        # container_stats: Java WMC keyed by class; TS keyed by file
        cs_j = metrics.container_stats(jf)
        assert cs_j["wmc_max_name"] == "Owner"


def test_matcher_excludes_tests_and_braces():
    m = metrics._matcher(["src/main/frontend/**/*.{ts,tsx}"])
    assert m("src/main/frontend/features/owners/OwnersPage.tsx")
    assert m("src/main/frontend/router/routes.ts")
    assert not m("src/main/frontend/features/owners/OwnersPage.spec.ts")   # test dropped
    assert not m("src/main/java/App.java")                                 # wrong layer


def test_boundary_and_impact_on_diff():
    with tempfile.TemporaryDirectory() as tmp:
        _git_repo(tmp)
        # prev: a shared router + a feature file
        _write(tmp, "src/main/frontend/router/routes.ts", "export const routes = [];\n")
        _write(tmp, "src/main/frontend/features/a.tsx", "export function A(){ return 1; }\n")
        prev = _commit(tmp, "prev")
        # cur: ADD a new feature (additive) AND EDIT the shared router (boundary violation)
        _write(tmp, "src/main/frontend/features/b.tsx",
               "export function B(x:number){ if(x>0){return 1;} return 0; }\n")
        _write(tmp, "src/main/frontend/router/routes.ts", "export const routes = ['b'];\n")
        cur = _commit(tmp, "cur")

        cfg = {"app": {"shared_surfaces": {"frontend": ["src/main/frontend/router/**",
                                                        "src/main/frontend/ui/**"],
                                           "backend": ["src/main/resources/officefloor/**"]}}}
        bv = metrics.boundary_violations(tmp, prev, cur, cfg)
        assert bv["frontend_boundary"] == 1, bv       # routes.ts touched
        assert bv["backend_boundary"] == 0, bv

        match = metrics._matcher(["src/main/frontend/**/*.{ts,tsx}"])
        br = metrics.blast_radius(tmp, prev, cur, match)
        assert br["diff_files"] == 2 and br["diff_added"] >= 2, br
        imp = metrics.impact_stats(tmp, prev, cur, match)
        assert imp["impact_new_files"] == 1 and imp["impact_composite"] >= 0, imp
        assert imp["impact_files_changed"] == 2, imp


def test_compute_all_shape():
    with tempfile.TemporaryDirectory() as tmp:
        _git_repo(tmp)
        _write(tmp, "src/main/java/App.java", "public class App { public int a(){ return 1; } }")
        base = _commit(tmp, "base")
        _write(tmp, "src/main/frontend/x.tsx", "export function X(){ return 1; }\n")
        cur = _commit(tmp, "cur")
        app_cfg = {"source_globs": {"frontend": ["src/main/frontend/**/*.{ts,tsx}"],
                                    "backend": ["src/main/java/**/*.java"]},
                   "shared_surfaces": {"frontend": [], "backend": []}}
        row = metrics.compute_all(tmp, app_cfg, {}, base, prev_ref=base)
        for col in ("frontend_erosion", "backend_erosion", "frontend_fn_count",
                    "backend_fn_count", "frontend_impact_composite", "frontend_boundary"):
            assert col in row, (col, sorted(row))
        assert row["backend_fn_count"] >= 1 and row["frontend_fn_count"] >= 1


def test_hot_surface_discovers_the_page_not_the_router():
    """The surface the churn actually lands on is found from git, with nothing declared."""
    with tempfile.TemporaryDirectory() as tmp:
        _git_repo(tmp)
        _write(tmp, "src/main/frontend/router/routes.ts", "export const routes = [];\n")
        _write(tmp, "src/main/frontend/features/ProjectsPage.tsx", "export function P(){ return 1; }\n")
        base = _commit(tmp, "cp00 base")
        # the router is edited ONCE; the page is reopened every checkpoint (the react arm's shape)
        _write(tmp, "src/main/frontend/router/routes.ts", "export const routes = ['a'];\n")
        _commit(tmp, "cp01 agent")
        for i in range(2, 6):
            _write(tmp, "src/main/frontend/features/ProjectsPage.tsx",
                   "export function P(){ " + ("const x=1; " * i) + "return 1; }\n")
            _write(tmp, f"src/main/frontend/features/New{i}.tsx", "export function N(){ return 1; }\n")
            cur = _commit(tmp, f"cp0{i} agent")
        match = metrics._matcher(["src/main/frontend/**/*.{ts,tsx}"])
        hot = metrics.hot_surface(tmp, base, cur, match)
        assert hot["hot_top_file"].endswith("ProjectsPage.tsx"), hot
        assert hot["hot_top_edits"] == 4, hot          # reopened by 4 checkpoints
        assert 0.0 < hot["hot_share"] <= 1.0, hot
        assert "New5.tsx" not in (hot["hot_files"] or ""), hot   # additions are not a surface


def test_reedit_line_stats_ages_in_checkpoints():
    """Parser-free: replaced lines counted on the `-` side, aged by cpNN label, not commit count."""
    with tempfile.TemporaryDirectory() as tmp:
        _git_repo(tmp)
        # a template layer — no functions for lizard to find, so only git-derived metrics apply
        _write(tmp, "src/main/frontend/page.html", "<p>one</p>\n<p>two</p>\n<p>three</p>\n")
        base = _commit(tmp, "cp00 base")
        # two commits per checkpoint, as a run puts on the branch (`cpNN reset`, `cpNN agent`)
        _write(tmp, "src/main/frontend/reset1.html", "<p>r</p>\n")
        _commit(tmp, "cp01 reset")
        _write(tmp, "src/main/frontend/other.html", "<p>x</p>\n")
        prev = _commit(tmp, "cp01 agent")
        # cp02 replaces a line written at cp00 (age 2) and adds one
        _write(tmp, "src/main/frontend/reset2.html", "<p>r</p>\n")
        _commit(tmp, "cp02 reset")
        _write(tmp, "src/main/frontend/page.html", "<p>ONE</p>\n<p>two</p>\n<p>three</p>\n<p>4</p>\n")
        cur = _commit(tmp, "cp02 agent")
        match = metrics._matcher(["src/main/frontend/**/*.html"])
        st = metrics.reedit_line_stats(tmp, prev, cur, base, match)
        assert st["reedit_lines_removed"] == 1, st
        assert st["reedit_lines_settled"] == 1, st          # written 2 checkpoints earlier
        assert st["reedit_age_max"] == 2, st                # checkpoints, NOT 4 commits
        assert 0 < st["reedit_lines_rate"] <= 1, st
        # a purely additive checkpoint replaces nothing
        _write(tmp, "src/main/frontend/added.html", "<p>new</p>\n")
        add = _commit(tmp, "cp03 agent")
        st2 = metrics.reedit_line_stats(tmp, cur, add, base, match)
        assert st2["reedit_lines_removed"] == 0 and st2["reedit_lines_settled"] == 0, st2


def test_reedit_age_blank_without_checkpoint_labels():
    """No cpNN labels => the age columns are BLANK, never a wrong unit."""
    with tempfile.TemporaryDirectory() as tmp:
        _git_repo(tmp)
        _write(tmp, "src/main/frontend/a.html", "<p>one</p>\n")
        base = _commit(tmp, "initial")
        _write(tmp, "src/main/frontend/a.html", "<p>ONE</p>\n")
        cur = _commit(tmp, "some unlabelled change")
        st = metrics.reedit_line_stats(tmp, base, cur, base,
                                       metrics._matcher(["src/main/frontend/**/*.html"]))
        assert st["reedit_lines_removed"] == 1, st
        assert st["reedit_age_mean"] is None and st["reedit_lines_rate"] is None, st


def test_stack_layers_from_the_base_repo():
    """Layer roots are read from the STACK's stack.yaml at base_ref, and validated."""
    from . import stack_layers
    with tempfile.TemporaryDirectory() as tmp:
        _git_repo(tmp)
        _write(tmp, "src/main/frontend/app.tsx", "export const a = 1;\n")
        _write(tmp, "src/main/java/App.java", "public class App {}\n")
        _write(tmp, "stack.yaml",
               "layers:\n  frontend: { root: src/main/frontend, ext: [ts, tsx] }\n"
               "  backend:  { root: src/main/java, ext: [java] }\n")
        _commit(tmp, "base")
        _run(tmp, "git", "branch", "-M", "base-empty")
        globs, prov = stack_layers(tmp, "base-empty", None, expected=metrics.LAYERS)
        assert globs["frontend"] == ["src/main/frontend/**/*.{ts,tsx}"], globs
        assert globs["backend"] == ["src/main/java/**/*.java"], globs
        assert "stack.yaml" in prov, prov
        # it must actually drive the metrics
        row = metrics.compute_all(tmp, {"source_globs": globs}, {}, "base-empty")
        assert row["frontend_fn_count"] is not None and "backend_erosion" in row, sorted(row)

        # a root that does not exist at base_ref is a loud failure, not silent zeros
        _write(tmp, "stack.yaml",
               "layers:\n  frontend: { root: web, ext: [ts] }\n"
               "  backend: { root: src/main/java, ext: [java] }\n")
        _commit(tmp, "bad root")
        try:
            stack_layers(tmp, "base-empty", None, expected=metrics.LAYERS)
            raise AssertionError("expected SystemExit for a missing root")
        except SystemExit as e:
            assert "does not exist" in str(e), e

        # an unknown layer name would produce no columns — also a loud failure
        _write(tmp, "stack.yaml", "layers:\n  ui: { root: src/main/frontend, ext: [tsx] }\n")
        _commit(tmp, "bad layer")
        try:
            stack_layers(tmp, "base-empty", None, expected=metrics.LAYERS)
            raise AssertionError("expected SystemExit for an unknown layer")
        except SystemExit as e:
            assert "ui" in str(e), e


def test_stack_layers_falls_back_to_config():
    """A stack predating stack.yaml keeps working off the harness config."""
    from . import stack_layers
    with tempfile.TemporaryDirectory() as tmp:
        _git_repo(tmp)
        _write(tmp, "src/main/frontend/app.tsx", "export const a = 1;\n")
        _commit(tmp, "base")
        _run(tmp, "git", "branch", "-M", "base-empty")
        fb = {"frontend": ["src/main/frontend/**/*.{ts,tsx}"], "backend": []}
        globs, prov = stack_layers(tmp, "base-empty", fb, expected=metrics.LAYERS)
        assert globs == fb and "no stack.yaml" in prov, (globs, prov)
        try:
            stack_layers(tmp, "base-empty", None, expected=metrics.LAYERS)
            raise AssertionError("expected SystemExit with neither source")
        except SystemExit as e:
            assert "layer roots are unknown" in str(e), e


def main() -> int:
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for t in tests:
        t()
        print(f"  ok  {t.__name__}")
    print(f"OK — {len(tests)} tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

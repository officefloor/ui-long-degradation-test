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


def main() -> int:
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for t in tests:
        t()
        print(f"  ok  {t.__name__}")
    print(f"OK — {len(tests)} tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

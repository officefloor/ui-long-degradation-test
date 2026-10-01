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
        # the DENOMINATOR is stored, so a run's rate can be pooled instead of averaged.
        # 3 = 2 added ("ONE" replacing "one", plus the appended "4") + 1 removed ("one").
        assert st["reedit_lines_touched"] == 3, st
        assert abs(st["reedit_lines_rate"] - 1 / 3) < 1e-4, st
        # a purely additive checkpoint replaces nothing
        _write(tmp, "src/main/frontend/added.html", "<p>new</p>\n")
        add = _commit(tmp, "cp03 agent")
        st2 = metrics.reedit_line_stats(tmp, cur, add, base, match)
        assert st2["reedit_lines_removed"] == 0 and st2["reedit_lines_settled"] == 0, st2
        assert st2["reedit_lines_touched"] == 0, st2


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


def test_pooled_ratio_beats_mean_of_ratios():
    """The artifact this exists to avoid: averaging per-checkpoint ratios can invert a comparison."""
    from . import analyze
    # arm A: one checkpoint replaced 1 of 2 lines (rate 0.50), one replaced 10 of 400 (0.025)
    A = [{"chain": "1", "frontend_reedit_lines_settled": 1, "frontend_reedit_lines_touched": 2},
         {"chain": "1", "frontend_reedit_lines_settled": 10, "frontend_reedit_lines_touched": 400}]
    # arm B: steadily replaced 60 of 402 lines — WORSE, but its per-checkpoint mean looks better
    B = [{"chain": "1", "frontend_reedit_lines_settled": 30, "frontend_reedit_lines_touched": 201},
         {"chain": "1", "frontend_reedit_lines_settled": 30, "frontend_reedit_lines_touched": 201}]
    mean_a = sum(r["frontend_reedit_lines_settled"] / r["frontend_reedit_lines_touched"] for r in A) / 2
    mean_b = sum(r["frontend_reedit_lines_settled"] / r["frontend_reedit_lines_touched"] for r in B) / 2
    pooled_a = analyze.pooled_ratio(A, "frontend_reedit_lines_settled", "frontend_reedit_lines_touched")
    pooled_b = analyze.pooled_ratio(B, "frontend_reedit_lines_settled", "frontend_reedit_lines_touched")
    assert mean_a > mean_b, (mean_a, mean_b)        # mean-of-ratios says A is worse
    assert pooled_a < pooled_b, (pooled_a, pooled_b)  # pooled says A is better — and it is
    assert abs(pooled_a - 11 / 402) < 1e-9, pooled_a
    # a missing denominator is blank, not a zero that drags the pooled value down
    assert analyze.pooled_ratio([{"chain": "1"}], "frontend_reedit_lines_settled",
                                "frontend_reedit_lines_touched") is None


def test_source_loc_is_the_density_denominator():
    """A duplication density above 1 is a unit error, not a finding — guard the denominator."""
    from . import deep_metrics
    with tempfile.TemporaryDirectory() as tmp:
        _write(tmp, "src/main/frontend/a.tsx",
               "import x from 'y';\n\nexport function A(){ return <div/>; }\n")
        match = metrics._matcher(["src/main/frontend/**/*.{ts,tsx}"])
        phys = deep_metrics.source_loc(tmp, match)
        fn_nloc = deep_metrics.total_java_loc(metrics.functions(tmp, ["src/main/frontend/**/*.{ts,tsx}"]))
        assert phys == 2, phys            # the blank line is not counted; the import IS
        assert phys > fn_nloc, (phys, fn_nloc)   # which is exactly why it must be the denominator
        assert deep_metrics.source_loc(tmp, lambda p: False) == 0


def test_clone_area_is_cross_feature_not_petclinic():
    from . import deep_metrics
    # jscpd names are relative to the scanned root, so two features are two areas
    assert deep_metrics._clone_area("features/clients/ClientsTable.tsx") == "features/clients"
    assert (deep_metrics._clone_area("features/clients/a.tsx")
            != deep_metrics._clone_area("features/projects/b.tsx"))
    # a flat package collapses to one area -> cross-area 0, which is the truth
    assert (deep_metrics._clone_area("net/officefloor/hq/app/A.java")
            == deep_metrics._clone_area("net/officefloor/hq/app/B.java"))


def test_frontend_unit_vocabulary():
    """What KIND of unit holds a new rule — most specific label wins."""
    from . import class_shape as cs
    cases = [
        ("routes/clients.index.tsx", "export const Route = createFileRoute('/clients')({})", "route"),
        ("features/c/nav.slot.tsx", "export const contribution = AppNav.fill({})", "slot-contribution"),
        ("slots/defs/appNav.ts", "export const AppNav = defineSlot('app.nav')", "slot-def"),
        ("features/c/queries.ts", "export const q = () => useQuery({})", "query-module"),
        ("ui/money.ts", "export const fmt = (n: number) => n.toFixed(2)", "ui-primitive"),
        ("features/c/ClientsPage.tsx", "export function P(){ return <div/>; }", "component"),
        ("features/c/model.ts", "export type C = { id: number }", "module"),
        # a comparison operator must not read as JSX
        ("features/c/calc.ts", "export const lt = (a: number, b: number) => a < b && b > a;", "module"),
    ]
    for path, code, expect in cases:
        got = cs.classify_frontend(path, code)
        assert got == expect, (path, got, expect)
    # a route that also queries is still a route: the route is what makes it addable
    assert cs.classify_frontend("routes/x.tsx",
                                "export const Route = createFileRoute('/x')({}); useQuery({})") == "route"


def test_template_vocabulary():
    """Role of a server-rendered template: page, swappable fragment, or the layout itself."""
    from . import class_shape as cs
    cases = [
        # the shell declares the page fragment others replace into
        ("templates/layout.html",
         '<html xmlns:th="http://www.thymeleaf.org" th:fragment="page(content)">', "layout"),
        # a page replaces the layout -> it is a whole page, therefore a URL
        ("templates/clients.html",
         '<html th:replace="~{layout :: page(~{::content})}">', "page-template"),
        # a partial htmx swaps in renders only itself
        ("templates/fragments/row.html",
         '<tr xmlns:th="http://www.thymeleaf.org" th:text="${x}"/>', "fragment"),
        ("templates/other.html",
         '<div xmlns:th="http://www.thymeleaf.org" th:fragment="bit">x</div>', "fragment"),
        # Thymeleaf but neither -> still a page
        ("templates/plain.html",
         '<html xmlns:th="http://www.thymeleaf.org"><p th:text="${a}">a</p></html>', "page-template"),
        # no Thymeleaf at all -> static markup, not a page in this stack
        ("templates/static.html", "<html><body><p>hi</p></body></html>", "markup"),
        ("templates/empty.html", "   ", "unparsed"),
    ]
    for path, code, expect in cases:
        got = cs.classify_template(path, code)
        assert got == expect, (path, got, expect)


def test_java_vocabulary_separates_officefloor_procedures():
    """`instance-class` was absorbing the procedures these arms actually add."""
    from . import class_shape as cs
    proc = ("package a; public class ClientsGet { public void service(ClientRepository r,"
            " ObjectResponse<List<Client>> response) { response.send(r.findAll()); } }")
    view = ("package a; import net.officefloor.spring.starter.rest.view.ViewResponse;"
            " public class ClientsView { public void service(Model model, ViewResponse response)"
            " { response.send(\"clients\"); } }")
    nav = ("package a.web; import org.springframework.stereotype.Component;"
           " @Component public class ClientsNav implements NavEntry {"
           " public String section(){ return \"clients\"; } }")
    bean = ("package a; import org.springframework.stereotype.Service;"
            " @Service public class ClientService { public int f(){ return 1; } }")
    plain = "package a; public class Money { public int cents(){ return 1; } }"
    assert cs.classify("src/main/java/a/ClientsGet.java", proc) == "officefloor-procedure"
    assert cs.classify("src/main/java/a/ClientsView.java", view) == "view-procedure"
    assert cs.classify("src/main/java/a/web/ClientsNav.java", nav) == "nav-component"
    assert cs.classify("src/main/java/a/ClientService.java", bean) == "spring-bean"
    assert cs.classify("src/main/java/a/Money.java", plain) == "instance-class"


def test_angular_vocabulary():
    """Angular answers in decorators, so the unit kind is unusually legible."""
    from . import class_shape as cs
    cases = [
        ("app/features/clients/clients.ts",
         '@Component({selector: "app-clients", template: ""}) export class Clients {}', "component"),
        ("app/features/clients/clients.service.ts",
         '@Injectable({providedIn: "root"}) export class ClientApi { list() {} }', "service"),
        ("app/app.routes.ts",
         'import { Routes } from "@angular/router"; export const routes: Routes = [];',
         "route-config"),
        ("app/auth.guard.ts", "export const authGuard: CanActivateFn = () => true;", "guard"),
        ("app/money.pipe.ts", '@Pipe({name: "money"}) export class MoneyPipe {}', "pipe"),
        ("app/hl.directive.ts", '@Directive({selector: "[hl]"}) export class Hl {}', "directive"),
        ("app/client.model.ts", "export interface Client { id: number; name: string }", "model"),
        ("app/util.ts", "export const inc = (n: number) => n + 1;", "module"),
    ]
    for path, code, expect in cases:
        got = cs.classify_angular(path, code)
        assert got == expect, (path, got, expect)
    # a component that also injects a service is still a component
    assert cs.classify_angular("app/x.ts",
        '@Component({template: ""}) export class X { api = inject(ClientApi); }') == "component"
    # and the idiom must not be read out of a comment
    assert cs.classify_angular("app/notes.ts",
        '// example: @Component({...}) export class Foo {}\nexport const a = 1;') == "module"


def test_declared_vocabulary_wins_over_the_extension():
    """Angular and React share an extension, so the stack must be able to SAY which it is."""
    from . import analyze, class_shape as cs
    assert analyze._classifier_for((".ts",), "angular") is cs.classify_angular
    assert analyze._categories_for((".ts",), "angular") == cs.ANGULAR_CATEGORIES
    # same extension, no declaration -> the React vocabulary, as before
    assert analyze._classifier_for((".ts",)) is cs.classify_frontend
    # an unknown vocabulary must fail LOUDLY: silently filing every unit as unparsed would
    # answer nothing while looking like a finding of "no architecture used".
    for bad in ("vue", "svelte", ""):
        if not bad:
            assert analyze._classifier_for((".ts",), bad) is cs.classify_frontend   # blank = absent
            continue
        try:
            analyze._classifier_for((".ts",), bad)
            raise AssertionError(f"expected SystemExit for {bad!r}")
        except SystemExit as e:
            assert "unit_vocabulary" in str(e), e


def test_classifier_dispatch_follows_the_declared_extensions():
    """"frontend" is .tsx in one stack and .html in another; the vocabulary must follow the ext."""
    from . import analyze, class_shape as cs
    assert analyze._classifier_for((".html",)) is cs.classify_template
    assert analyze._categories_for((".html",)) == cs.TEMPLATE_CATEGORIES
    assert analyze._classifier_for((".ts", ".tsx")) is cs.classify_frontend
    assert analyze._categories_for((".ts", ".tsx")) == cs.FRONTEND_CATEGORIES
    assert analyze._classifier_for((".java",)) is cs.classify          # fallback
    assert analyze._categories_for((".java",)) == cs.CATEGORIES
    assert analyze._classifier_for(()) is cs.classify                  # nothing declared


def main() -> int:
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for t in tests:
        t()
        print(f"  ok  {t.__name__}")
    print(f"OK — {len(tests)} tests passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

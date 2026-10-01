"""Class-shape audit: WHAT KIND of class does an arm add to hold a new rule?

`cumulative_impact` answers how much complexity a run added and where it landed.
This answers what it was made of. The two arms are both Spring Boot applications,
so the same vocabulary applies to each, and the interesting differences are the
ones an experienced reader of that framework would notice in review:

  spring-bean     carries a stereotype (@Component/@Service/@RestController/
                  @ControllerAdvice/@Configuration/...). Container-managed, so it
                  can be injected, mocked, proxied and configured.
  static-util     every method is static. Scores beautifully on the structural
                  impact formula (a static method in a small class has near-zero
                  WMC_other) but is procedural: no injection, no seam for a test
                  double, no participation in transactions or AOP.
  instance-class  ordinary object with instance methods. OfficeFloor's wired
                  functions are these -- the framework instantiates them.
  exception       a domain exception, i.e. the rule reports failure by throwing
                  through the app's @ControllerAdvice rather than returning a
                  bare ResponseEntity status.
  entity / annotation / interface / other

The counts are per CHAIN, over classes the run CREATED (present at the tip and
absent from base_ref), excluding generated code (`rest/dto`, `rest/api`). What to
read: a shift between these categories is a shift in idiom, and idiom is the part
of "is this code a competent developer would recognise" that can be counted.
Report the SPREAD, not just the mean -- ten chains from one prompt choosing
different mechanisms is itself the finding.

Methods come from lizard (the harness's pinned parser), never a regex over the
source: a `private static final Map<..> X = Map.of(` line reads exactly like a
static method declaration to a grep, and counting those makes almost every class
look like a static utility.

Usage:
    python -m harness.class_shape --config config.yaml [--run-id ID] [--json OUT]
"""

from __future__ import annotations

import argparse
import collections
import json
import os
import re
import statistics
import subprocess

import lizard
import yaml

from .cumulative_impact import evolve_branches, latest_run_id

# Generated sources. Regenerated wholesale from openapi.yml, so they say nothing
# about how the agent chose to express a rule.
GENERATED = re.compile(r"/rest/(dto|api)/")

# UI-ARM: `SpringBootApplication` added. It is @Configuration + @ComponentScan +
# @EnableAutoConfiguration, so the app entry point is container-managed like any other bean — but
# it was absent here, and the class usually has nothing but a static `main`, so once comments
# stopped being matched it started filing as `static-util`. True of the method, wrong about the
# class. (It only ever affects base files, which audit_branch excludes, but the label should still
# be right.)
_STEREOTYPE = re.compile(r"@(Component|Service|Repository|RestController|Controller|"
                         r"ControllerAdvice|RestControllerAdvice|Configuration|Bean|"
                         r"SpringBootApplication|SpringBootConfiguration)\b")
_ENTITY = re.compile(r"@(Entity|Embeddable|MappedSuperclass)\b")

# ── Java/backend vocabulary ───────────────────────────────────────────────────────────────────
# Order the summary lists categories in: idiom-carrying first, filler last.
#
# UI-ARM: three categories added for the OfficeFloor backends these arms run. `instance-class`
# was absorbing almost everything they create (70-79 of ~95 per chain), because an OfficeFloor
# logic class carries no stereotype — so the table could not distinguish "added a wired procedure"
# from "added an ordinary class", which is the whole question. `view-procedure` is the one to
# watch on the htmx arm: it says the agent rendered a page the way the architecture intends.
CATEGORIES = ["nav-component", "view-procedure", "officefloor-procedure", "spring-bean",
              "static-util", "instance-class", "exception", "entity", "annotation",
              "interface", "other", "unparsed"]

# Classify on CODE, not on prose ABOUT code. Every one of these classifiers is a regex over the
# file, and a file that documents the idiom mentions it: `NavEntry.java`'s javadoc says
# "{@code @Component}" and was filed as a spring-bean rather than an interface, and
# `slots/Slot.tsx` carries the line "export const contribution = ..." in its header comment as
# the usage example, which filed the MECHANISM as a contribution. Both are the files most likely
# to be well documented, so the misreads land exactly where they do most damage.
#
# A `//` inside a string literal (a bare URL) truncates that line too; harmless here, since no
# check depends on what follows, and a javadoc @link URL is inside a block comment already.
_C_BLOCK = re.compile(r"/\*.*?\*/", re.S)
_C_LINE = re.compile(r"//[^\n]*")
_MARKUP_COMMENT = re.compile(r"<!--.*?-->", re.S)


def _strip_comments(code: str, markup: bool = False) -> str:
    if markup:
        return _MARKUP_COMMENT.sub("", code)
    return _C_LINE.sub("", _C_BLOCK.sub("", code))


_NAV_ENTRY = re.compile(r"\bimplements\s+NavEntry\b")
_VIEW_RENDER = re.compile(r"\bViewResponse\b")
_PROCEDURE = re.compile(r"\b(?:public\s+)?\w[\w<>,.\[\]\s]*\s+service\s*\(")


def _git(repo: str, args: list[str]) -> str:
    return subprocess.run(["git", "-C", repo, *args],
                          capture_output=True, text=True, timeout=120).stdout


def classify(path: str, code: str) -> str:
    """The category of the PRIMARY class in `path`.

    One label per file: a file whose top-level type is an annotation but which
    also declares its package-private validator counts once, as `annotation`.
    Splitting per declared type would double-count that idiomatic pairing.
    """
    try:
        fns = list(lizard.analyze_file.analyze_source_code(path, code).function_list)
    except Exception:
        return "unparsed"

    # Regex checks run on the comment-stripped text; `code` is kept for lizard above and for the
    # signature line lookup below, so line numbers stay aligned.
    probe = _strip_comments(code)

    # A nav link registered as a bean — the htmx arm's additive nav mechanism. Checked before the
    # stereotype test, which would otherwise swallow it as a plain spring-bean.
    if _NAV_ENTRY.search(probe):
        return "nav-component"
    if _STEREOTYPE.search(probe):
        return "spring-bean"
    if _ENTITY.search(probe):
        return "entity"
    if "@interface" in probe:
        return "annotation"

    cls = path.rsplit("/", 1)[-1][:-len(".java")]
    if path.endswith("Exception.java") or re.search(r"\bclass\s+\w*Exception\b", probe):
        return "exception"
    # OfficeFloor procedures carry no annotation, so they are invisible to the stereotype test.
    # A `service(...)` method is what the YAML wires to; one that also takes a ViewResponse is
    # rendering a page rather than returning data.
    if _PROCEDURE.search(probe):
        return "view-procedure" if _VIEW_RENDER.search(probe) else "officefloor-procedure"
    if re.search(rf"\binterface\s+{re.escape(cls)}\b", probe):
        return "interface"

    lines = code.splitlines()
    instance = static = 0
    for fn in fns:
        short = fn.name.split("::")[-1]
        if short == cls:
            # Constructor: neutral. A static-utility class conventionally has a
            # private one, so counting it as an instance method would misfile
            # every such class. (str.capitalize() cannot be used to detect this
            # -- it lowercases the tail, so "CityCodes" != "Citycodes".)
            continue
        # The signature line plus the one above it, so an annotation or a
        # modifier list wrapped onto its own line is still seen.
        sig = " ".join(lines[max(0, fn.start_line - 2):fn.start_line])
        if re.search(r"\bstatic\b", sig):
            static += 1
        else:
            instance += 1

    if static and not instance:
        return "static-util"
    if instance:
        return "instance-class"
    return "other"


# ── Template vocabulary (UI-ARM, for a server-rendered arm) ───────────────────────────────────
# The htmx arm's UI layer is Thymeleaf markup, which lizard cannot parse — so the question is not
# complexity but ROLE: did the agent add a page, a swappable fragment, or neither?
TEMPLATE_CATEGORIES = ["page-template", "fragment", "layout", "markup", "unparsed"]

_TPL_LAYOUT = re.compile(r"""th:fragment\s*=\s*["']page\s*\(""")
_TPL_USES_LAYOUT = re.compile(r"""th:replace\s*=\s*["']~\{\s*layout\s*::""")
_TPL_FRAGMENT = re.compile(r"""th:fragment\s*=""")
_TPL_THYMELEAF = re.compile(r"\bth:[a-z]+\s*=|xmlns:th=")


def classify_template(path: str, code: str) -> str:
    """The role of a template file. Most specific first.

    `page-template` replaces the shared layout, so it is a whole page and therefore a new URL.
    `fragment` renders only itself — what htmx swaps into a target — identified by living under
    fragments/ or by declaring a fragment without replacing the layout. `markup` is HTML with no
    Thymeleaf in it at all, which in this stack means something static rather than a page.
    """
    if not code.strip():
        return "unparsed"
    # Thymeleaf's own comment form is `<!--/* ... */-->`, so a documented layout carries a sample
    # `th:replace="~{layout :: ...}"` in prose — strip comments before matching.
    probe = _strip_comments(code, markup=True)
    if _TPL_LAYOUT.search(probe):
        return "layout"
    if _TPL_USES_LAYOUT.search(probe):
        return "page-template"
    if "fragments/" in path or (_TPL_FRAGMENT.search(probe) and _TPL_THYMELEAF.search(probe)):
        return "fragment"
    if _TPL_THYMELEAF.search(probe):
        return "page-template"
    return "markup"


# ── Angular vocabulary (UI-ARM, for the framework-control arm) ────────────────────────────────
# Angular and React are both TypeScript, so the extension cannot tell them apart — a stack says
# which idiom it is written in (`stack.yaml -> layers.<layer>.unit_vocabulary: angular`). The
# question is the same as for the other arms: what KIND of unit did the run create to hold a new
# rule? Angular answers in decorators, which makes it unusually legible.
ANGULAR_CATEGORIES = ["component", "service", "route-config", "guard", "resolver", "pipe",
                      "directive", "model", "module", "unparsed"]

_NG_COMPONENT = re.compile(r"@Component\s*\(")
_NG_INJECTABLE = re.compile(r"@Injectable\s*\(")
_NG_PIPE = re.compile(r"@Pipe\s*\(")
_NG_DIRECTIVE = re.compile(r"@Directive\s*\(")
_NG_ROUTES = re.compile(r":\s*Routes\b|\bprovideRouter\s*\(")
_NG_GUARD = re.compile(r"\bCanActivate\w*\b|\bCanMatch\b|Guard(?:Fn)?\b")
_NG_RESOLVE = re.compile(r"\bResolveFn\b|\bResolve<|Resolver\b")
_NG_MODEL = re.compile(r"\bexport\s+(?:interface|type|enum)\b")


def classify_angular(path: str, code: str) -> str:
    """The category of the PRIMARY unit in an Angular file. Decorator first, since that is what
    Angular itself dispatches on; `route-config` is checked before the rest because a routes file
    carries no decorator and would otherwise fall through to `module`."""
    try:
        lizard.analyze_file.analyze_source_code(path, code)
    except Exception:
        return "unparsed"
    probe = _strip_comments(code)
    if _NG_COMPONENT.search(probe):
        return "component"
    if _NG_PIPE.search(probe):
        return "pipe"
    if _NG_DIRECTIVE.search(probe):
        return "directive"
    if _NG_ROUTES.search(probe):
        return "route-config"
    if _NG_INJECTABLE.search(probe):
        # A guard/resolver is often an @Injectable or a bare function; prefer the specific label.
        if _NG_GUARD.search(probe):
            return "guard"
        if _NG_RESOLVE.search(probe):
            return "resolver"
        return "service"
    if _NG_GUARD.search(probe):
        return "guard"
    if _NG_RESOLVE.search(probe):
        return "resolver"
    if _NG_MODEL.search(probe) and "class " not in probe:
        return "model"
    return "module"


def audit_branch(repo: str, base: str, tip: str, src_root: str = "src/main/java",
                 exts: tuple = (".java",), classify_fn=None) -> collections.Counter:
    """Category counts over the production units this chain CREATED.

    UI-ARM: `src_root`, `exts` and `classify_fn` were hardcoded to Java. One harness drives
    many stacks and this arm has two layers, so the caller supplies the layer's root (from
    `stack.yaml`) and the classifier for its language — `classify` for Java/Spring,
    `classify_frontend` for the TypeScript front end.
    """
    classify_fn = classify_fn or classify
    base_files = set(_git(repo, ["ls-tree", "-r", "--name-only", base]).split())
    changed = _git(repo, ["diff", "--name-only", f"{base}..{tip}", "--", src_root]).split()
    counts: collections.Counter = collections.Counter()
    for path in changed:
        if not path.endswith(tuple(exts)) or GENERATED.search(path) or path in base_files:
            continue
        code = _git(repo, ["show", f"{tip}:{path}"])
        if code:
            counts[classify_fn(path, code)] += 1
    return counts


# ── Front-end vocabulary (UI-ARM, new) ────────────────────────────────────────────────────────
# The Java version asks what KIND of class holds a new rule. This asks the same question of a
# TypeScript front end, in the vocabulary of an additive architecture — so "is the architecture
# actually being used as designed" becomes a number instead of a diff review. A control arm with
# no routing/slot mechanism answers `component` for nearly everything, which is the contrast.
FRONTEND_CATEGORIES = ["route", "slot-contribution", "slot-def", "query-module",
                       "ui-primitive", "component", "module", "unparsed"]

_FE_ROUTE = re.compile(r"\bcreateFileRoute\s*\(|\bcreateRootRoute(?:WithContext)?\s*\(")
_FE_CONTRIB = re.compile(r"\bexport\s+const\s+contributions?\b")
_FE_SLOTDEF = re.compile(r"\bdefineSlot\s*<|\bdefineSlot\s*\(")
_FE_QUERY = re.compile(r"\buse(?:Query|Mutation|InfiniteQuery)\s*[<(]|\binvalidateQueries\s*\(")
# A self-closing tag need not have attributes (`<div/>`), and a fragment closes as `</>`.
_FE_JSX = re.compile(r"</[A-Za-z][\w.]*>|</>|<[A-Za-z][\w.]*(?:\s[^>]*)?/>|<>")


def classify_frontend(path: str, code: str) -> str:
    """The category of the PRIMARY unit in a front-end file. One label per file, most
    specific first: a route file that also queries is a `route`, because the route is what
    makes it addable without editing anything."""
    try:
        lizard.analyze_file.analyze_source_code(path, code)
    except Exception:
        return "unparsed"
    probe = _strip_comments(code)
    if _FE_ROUTE.search(probe):
        return "route"
    if _FE_CONTRIB.search(probe):
        return "slot-contribution"
    if _FE_SLOTDEF.search(probe):
        return "slot-def"
    if _FE_QUERY.search(probe):
        return "query-module"
    # Segment match, not a substring: the path may be repo-relative ("src/main/frontend/ui/x.ts")
    # or root-relative as jscpd reports it ("ui/x.ts"), and "/ui/" misses the second.
    if "ui" in path.split("/"):
        return "ui-primitive"
    if _FE_JSX.search(probe):
        return "component"
    return "module"


def run_audit(cfg: dict, run_id: str, verbose: bool = True) -> dict[str, list[dict]]:
    """arm -> [per-chain {category: count}]."""
    branches = evolve_branches(cfg, run_id)
    if not branches:
        raise SystemExit(f"no branches for run {run_id!r}")
    if verbose:
        print(f"class-shape audit: new classes over {len(branches)} chains")
    out: dict[str, list[dict]] = collections.defaultdict(list)
    for repo, branch, arm, _strategy, chain in branches:
        counts = audit_branch(repo, cfg["arms"][arm]["base_ref"], branch)
        rec = {"chain": chain, "total": sum(counts.values()), **dict(counts)}
        out[arm].append(rec)
        if verbose:
            top = "  ".join(f"{k}={counts[k]}" for k in CATEGORIES if counts[k])
            print(f"  {arm:12s} chain{chain:<2d} total={rec['total']:3d}  {top}")
    return dict(out)


def _stats(rows: list[dict], key: str) -> tuple[float, float, int, int]:
    v = [r.get(key, 0) for r in rows]
    sd = statistics.stdev(v) if len(v) > 1 else 0.0
    return statistics.mean(v), sd, min(v), max(v)


def markdown_section(results: dict[str, list[dict]], categories: list[str] | None = None,
                     title: str | None = None) -> list[str]:
    categories = categories or CATEGORIES   # UI-ARM: vocabulary is per layer
    arms = sorted(results)
    out = [
        (title or "## Class shape (what kind of class holds a new rule)") + "\n",
        "Per chain, over production classes the run CREATED (present at the tip, absent",
        "from `base_ref`), excluding generated `rest/dto` and `rest/api`. Category is",
        "decided from lizard's function list, not a regex — a `static final` FIELD",
        "initialiser reads like a static method to a grep, which makes nearly every class",
        "look like a utility.\n",
        "`static-util` is the one to watch: it scores well on the structural-impact",
        "formula (a static method in a small class has near-zero `WMC_other`) while giving",
        "up injection, test seams, proxying and transaction participation. A run that",
        "lowers impact by turning beans into statics has changed its score without",
        "improving the code. `exception` counts rules that report failure by throwing",
        "through the app's `@ControllerAdvice` rather than returning a bare status.\n",
        "Read the range as well as the mean: ten chains from ONE prompt picking different",
        "mechanisms means the prompt fixed the objective but not the idiom.\n",
        "| arm/category | " + " | ".join(f"{a} mean" for a in arms)
        + " | " + " | ".join(f"{a} range" for a in arms) + " |",
        "|---|" + "---:|" * len(arms) + "---:|" * len(arms),
    ]
    present = [c for c in categories
               if any(any(r.get(c, 0) for r in results[a]) for a in arms)]
    for cat in ["total"] + present:
        means, ranges = [], []
        for a in arms:
            m, _sd, lo, hi = _stats(results[a], cat)
            means.append(f"{m:.1f}")
            ranges.append(f"{lo}–{hi}")
        label = "**total**" if cat == "total" else cat
        out.append(f"| {label} | " + " | ".join(means) + " | " + " | ".join(ranges) + " |")
    out.append("")
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--config", required=True)
    ap.add_argument("--run-id", help="which run to audit (default: latest)")
    ap.add_argument("--json", help="write the per-chain counts here")
    args = ap.parse_args()

    with open(args.config) as fh:
        cfg = yaml.safe_load(fh)
    run_id = args.run_id or latest_run_id(cfg)
    if not run_id:
        raise SystemExit("no evolve/ branches found in the arm repos")

    print(f"# Class-shape audit -- run {run_id}\n")
    results = run_audit(cfg, run_id)
    print()
    print("\n".join(markdown_section(results)))

    if args.json:
        os.makedirs(os.path.dirname(os.path.abspath(args.json)), exist_ok=True)
        with open(args.json, "w") as fh:
            json.dump({"run_id": run_id, "arms": results}, fh, indent=2)
        print(f"wrote {args.json}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

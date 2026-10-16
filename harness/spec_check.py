"""Check every spec assertion in the checkpoint stream against the reference model (harness/oracle).

Expected values in the specs are computed by hand, and a wrong one goes unnoticed until an agent bends
its code to match it (cp109 asserted a tide of 260 where the requests give 267). This tool runs every
test of every spec through the model instead:

1. `harness/spec_trace.mjs` runs each spec in node with recording stand-ins for Playwright, so loops,
   local consts, row helpers and template ids are resolved exactly; it yields each test's steps
   (seed, goto, fill, click, select, reload) and assertions (toHaveText, toHaveValue, toHaveCount,
   toBeVisible, toBeHidden, audit lines) as data.
2. For every checkpoint k, every test in force at k (own specs plus copies; a copy replaces its
   original from its checkpoint on) is replayed through `oracle.Session` AT k, and each assertion is
   compared with what the model shows. The model's output can change only where some definition
   changes, so a test is checked at its install checkpoint and at every later checkpoint where a
   definition changes while it is in force; a result holds until the next such point. Checking past
   the install point catches a mutation that forgot to list a checkpoint whose values it changes.

Each assertion ends up as one of
- verified     the model shows the expected text;
- MISMATCH     the model shows something else: `cpK <basename>::<title> <test id path> expected X model Y`,
               or the value rests on a choice no request states (`model <ambiguous: ...>`);
- unmodelled   it needs a concept or test id the model does not know yet (grouped by concept, so act
               authors see what to add);
- unverified   it cannot be checked: a step before it is not modelled (a control nobody registered,
               an interaction the recorder cannot represent), or the spec could not be traced.

Run: .venv/bin/python -m harness.spec_check --config config.yaml [--through K] [--only cpNN] [--survey]
Exit status 1 when any assertion mismatches.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass, field

from . import fixtures
from .checkpoint_lint import _load_yaml
from .oracle import ABSENT, Ambiguous, Session, Unmodelled
from .oracle.core import REGISTRY, _load_acts

HARNESS_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRACER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "spec_trace.mjs")

VERIFIED, MISMATCH, UNMODELLED, UNVERIFIED = "verified", "mismatch", "unmodelled", "unverified"


# ---- tracing -----------------------------------------------------------------------------------

_TRACES: dict[tuple[str, float], dict] = {}


def trace_specs(paths) -> dict[str, dict]:
    """{path: {tests: [{title, events, error?}], error?}} for each spec, traced in one node run."""
    paths = list(dict.fromkeys(paths))
    todo = [p for p in paths if (p, os.path.getmtime(p)) not in _TRACES]
    if todo:
        proc = subprocess.run(["node", "--no-warnings", TRACER], input=json.dumps(todo),
                              capture_output=True, text=True, timeout=300)
        if proc.returncode != 0:
            raise RuntimeError(f"spec tracer failed: {proc.stderr.strip()[:500]}")
        for entry in json.loads(proc.stdout):
            _TRACES[(entry["path"], os.path.getmtime(entry["path"]))] = entry
    return {p: _TRACES[(p, os.path.getmtime(p))] for p in paths}


# ---- locators ----------------------------------------------------------------------------------

_ATTR = re.compile("\x01ATTR(\\d+)\\|([^|\x01]*)\\|([^\x01]*)\x01")


def _subst(tid: str, attrs: dict) -> str:
    """Replace getAttribute placeholders with the resolved attribute (after the spec's replace)."""
    def one(m):
        n, a, b = int(m.group(1)), m.group(2), m.group(3)
        if n not in attrs:
            raise Unmodelled("getAttribute", "attribute read before it resolved")
        return attrs[n].replace(a, b, 1) if a else attrs[n]
    return _ATTR.sub(one, tid)


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _text_matches(actual: str, want, exact: bool = True) -> bool:
    if isinstance(want, dict):
        return re.search(want["re"], actual, re.I if "i" in want.get("flags", "") else 0) is not None
    return _norm(actual) == _norm(want) if exact else _norm(want) in _norm(actual)


def resolve(view, steps: list, attrs: dict, base: tuple = ()) -> list[tuple]:
    """The test id paths a recorded locator matches on the modelled screen."""
    paths = [base]
    for st in steps:
        if "tid" in st:
            tid = _subst(st["tid"], attrs)
            paths = [p + (tid,) for p in paths if view.text(p + (tid,)) is not ABSENT]
        elif "tidRe" in st:
            rx = re.compile(st["tidRe"])
            paths = [p + (t,) for p in paths for t in view.children(p) if rx.search(t)]
        elif st.get("first"):
            paths = paths[:1]
        elif st.get("last"):
            paths = paths[-1:]
        elif "nth" in st:
            paths = paths[st["nth"]:st["nth"] + 1]
        elif "has" in st or "hasText" in st:
            if "has" in st:
                paths = [p for p in paths if resolve(view, st["has"], attrs, p)]
            if "hasText" in st:
                raise Unmodelled("locator filter hasText", "a row's whole text is not modelled")
        elif "text" in st:
            paths = [p for p in paths if _text_matches(view.text(p), st["text"], st.get("exact", False))]
        else:
            raise Unmodelled("locator", json.dumps(st))
    return paths


def _path_str(steps: list, attrs: dict) -> str:
    out = []
    for st in steps:
        if "tid" in st:
            try:
                out.append(_subst(st["tid"], attrs))
            except Unmodelled:
                out.append(st["tid"])
        elif "tidRe" in st:
            out.append(f"/{st['tidRe']}/")
        elif "has" in st:
            out.append(f"[has {_path_str(st['has'], attrs)}]")
        elif "text" in st:
            out.append(f"[text {st['text']}]")
        elif st.get("first"):
            out.append("first")
        else:
            out.append(json.dumps(st))
    return "/".join(out)


def _single_tid(steps: list, attrs: dict) -> str:
    """The test id an action targets: its locator's last test id."""
    tids = [s for s in steps if "tid" in s]
    if not tids or any(not ("tid" in s) for s in steps[-1:]):
        raise Unmodelled("action locator", _path_str(steps, attrs))
    return _subst(tids[-1]["tid"], attrs)


# ---- replay ------------------------------------------------------------------------------------

@dataclass
class Outcome:
    """One assertion's result at one checkpoint."""
    index: int                  # event index within the test
    status: str
    where: str                  # the asserted test id path (or 'audit')
    expected: str = ""
    model: str = ""
    reason: str = ""            # the unmodelled concept, or why it is unverified


def _show_expected(value) -> str:
    if isinstance(value, dict) and "re" in value:
        return f"/{value['re']}/"
    return json.dumps(value) if not isinstance(value, str) else value


def _check_expect(view, e: dict, attrs: dict) -> Outcome:
    where = _path_str(e["loc"], attrs)
    paths = resolve(view, e["loc"], attrs)
    m, want, neg = e["matcher"], e.get("value"), e.get("not", False)
    if m in ("toHaveText", "toHaveValue", "toContainText"):
        if len(paths) != 1:
            ok, got = False, ("<absent>" if not paths else f"<{len(paths)} elements>")
        else:
            got = view.text(paths[0])
            ok = _text_matches(got, want, exact=(m != "toContainText"))
        expected = _show_expected(want)
    elif m == "toHaveCount":
        got, expected = str(len(paths)), str(want)
        ok = len(paths) == want
    elif m == "toBeVisible":
        got, expected, ok = ("visible" if paths else "<absent>"), "visible", len(paths) >= 1
    elif m == "toBeHidden":
        got, expected, ok = ("hidden" if not paths else "visible"), "hidden", not paths
    else:
        return Outcome(0, UNVERIFIED, where, reason=f"matcher {m}")
    if neg:
        ok, expected = not ok, f"not {expected}"
    return Outcome(0, VERIFIED if ok else MISMATCH, where, expected, got)


_AUDIT_EVENTS = ("ALPHA_CHANGED", "CHANGED", "STATE_CHANGED")


def replay(events: list, k: int, trace_error: str | None = None) -> list[Outcome]:
    """Replay one test's recorded events through the model at checkpoint k."""
    s = Session(k)
    out: list[Outcome] = []
    attrs: dict[int, str] = {}
    lost = f"spec could not be traced: {trace_error}" if trace_error else None
    view_cache: dict = {}

    def view():
        if s.version not in view_cache:
            view_cache.clear()
            view_cache[s.version] = s.view()
        return view_cache[s.version]

    for i, e in enumerate(events):
        op = e["op"]
        if op in ("expect", "audit"):
            where = _path_str(e["loc"], attrs) if op == "expect" else "audit"
            if lost:
                out.append(Outcome(i, UNVERIFIED, where, _show_expected(e.get("value")), reason=lost))
                continue
            try:
                if op == "expect":
                    o = _check_expect(view(), e, attrs)
                else:
                    want = e["value"]
                    if e["matcher"] != "toContain" or not isinstance(want, str):
                        raise Unmodelled("audit", f"matcher {e['matcher']}")
                    if not want.startswith(_AUDIT_EVENTS):
                        raise Unmodelled(f"audit {want.split(' ')[0]}", want)
                    ok = (want in s.audit) != e.get("not", False)
                    o = Outcome(i, VERIFIED if ok else MISMATCH, "audit", want,
                                "; ".join(s.audit) or "<no audit lines>")
            except Unmodelled as u:
                o = Outcome(i, UNMODELLED, where, _show_expected(e.get("value")), reason=u.what)
            except Ambiguous as a:  # the expected value rests on a choice no request states
                o = Outcome(i, MISMATCH, where, _show_expected(e.get("value")), f"<ambiguous: {a}>")
            except Exception as x:  # a bug in the model, not in the spec: never a silent pass
                o = Outcome(i, UNVERIFIED, where, _show_expected(e.get("value")),
                            reason=f"model error {type(x).__name__}: {x}")
            o.index = i
            out.append(o)
            continue
        if lost:
            continue
        try:
            if op == "seed":
                s.seed(e["fixture"])
            elif op == "goto":
                s.goto(e.get("url") or "/")
            elif op == "reload":
                s.reload()
            elif op == "fill":
                s.fill(_single_tid(e["loc"], attrs), e["value"])
            elif op == "select":
                s.select(_single_tid(e["loc"], attrs), e["value"])
            elif op == "click":
                s.click(_single_tid(e["loc"], attrs))
            elif op == "attr":
                paths = resolve(view(), e["loc"], attrs)
                if len(paths) != 1 or e.get("name") != "data-testid":
                    raise Unmodelled("getAttribute", f"{_path_str(e['loc'], attrs)} matches {len(paths)}")
                attrs[e["n"]] = paths[0][-1]
            else:
                raise Unmodelled(f"step {e.get('what', op)}")
        except Unmodelled as u:
            lost = f"step not modelled ({op} {u})"
        except Exception as x:
            lost = f"model error in {op}: {type(x).__name__}: {x}"
    return out


# ---- the stream --------------------------------------------------------------------------------

@dataclass
class Version:
    """One installed spec file and the checkpoints it is in force for."""
    basename: str
    path: str
    start: int
    end: int
    tests: list = field(default_factory=list)


def load_checkpoints(config: str, checkpoints: str | None = None) -> list[dict]:
    cfg = _load_yaml(config) or {}
    path = checkpoints or cfg.get("checkpoints_file", "checkpoints.yaml")
    if not os.path.isabs(path):
        path = os.path.join(HARNESS_ROOT, path)
    cps = (_load_yaml(path) or {}).get("checkpoints") or []
    return [dict(cp, n=i) for i, cp in enumerate(cps, 1)]


def spec_versions(checkpoints: list[dict], through: int, root: str = HARNESS_ROOT) -> list[Version]:
    """Every installed spec file with its in-force range (a copy replaces its original)."""
    live: dict[str, Version] = {}
    out: list[Version] = []
    for cp in checkpoints:
        if cp["n"] > through:
            break
        for entry in fixtures.spec_entries(cp, root):
            base = os.path.basename(entry)
            path = os.path.join(root, entry)
            if not os.path.isfile(path):
                continue
            if base in live:
                live[base].end = cp["n"] - 1
            live[base] = Version(base, path, cp["n"], through)
            out.append(live[base])
    return [v for v in out if v.end >= v.start]


@dataclass
class Finding:
    status: str
    k_from: int
    k_to: int
    basename: str
    title: str
    outcome: Outcome
    path: str = ""


def check(checkpoints: list[dict], through: int, only: int | None = None,
          root: str = HARNESS_ROOT) -> list[Finding]:
    """Check every assertion of every test in force at every checkpoint up to `through` (or only at
    checkpoint `only`). Consecutive checkpoints with the same result are merged into one finding."""
    _load_acts()
    versions = spec_versions(checkpoints, through, root)
    traces = trace_specs(v.path for v in versions)
    breaks = sorted(REGISTRY.breakpoints())
    findings: list[Finding] = []
    for v in versions:
        tr = traces[v.path]
        if only is not None:
            if not v.start <= only <= v.end:
                continue
            points = [only]
        else:
            points = [v.start] + [b for b in breaks if v.start < b <= v.end]
        tests = tr.get("tests") or []
        if tr.get("error"):
            tests = [{"title": "<spec>", "events": [], "error": tr["error"]}]
        for t in tests:
            prev: dict[int, Finding] = {}
            for idx, k in enumerate(points):
                k_to = (points[idx + 1] - 1) if idx + 1 < len(points) else (only or v.end)
                if t.get("error") and not t["events"]:
                    findings.append(Finding(UNVERIFIED, k, k_to, v.basename, t["title"],
                                            Outcome(-1, UNVERIFIED, "<test>", reason=t["error"]), v.path))
                    break
                for o in replay(t["events"], k, t.get("error")):
                    if o.status == MISMATCH and k > REGISTRY.covered_through:
                        o.status, o.reason = UNMODELLED, (
                            f"beyond the model (acts modelled through cp{REGISTRY.covered_through:02d})")
                    last = prev.get(o.index)
                    if last and last.status == o.status and last.outcome.model == o.model \
                            and last.outcome.reason == o.reason and last.k_to == k - 1:
                        last.k_to = k_to
                        continue
                    f = Finding(o.status, k, k_to, v.basename, t["title"], o, v.path)
                    prev[o.index] = f
                    findings.append(f)
    return findings


# ---- reporting ---------------------------------------------------------------------------------

def _span(f: Finding) -> str:
    return f"cp{f.k_from:02d}" + (f" (through cp{f.k_to:02d})" if f.k_to != f.k_from else "")


def report(findings: list[Finding], verbose: bool = False, out=sys.stdout) -> dict:
    by = defaultdict(list)
    for f in findings:
        by[f.status].append(f)
    mism = sorted(by[MISMATCH], key=lambda f: (f.k_from, f.basename, f.outcome.index))
    if mism:
        print(f"MISMATCHES ({len(mism)}):", file=out)
        for f in mism:
            o = f.outcome
            print(f"  {_span(f)} {f.basename}::{f.title}  {o.where}  expected {o.expected!r} "
                  f"model {o.model!r}", file=out)
    unmod = defaultdict(list)
    for f in by[UNMODELLED]:
        unmod[f.outcome.reason].append(f)
    if unmod:
        print(f"UNMODELLED ({len(by[UNMODELLED])} assertion checks, {len(unmod)} concepts):", file=out)
        for concept, fs in sorted(unmod.items(), key=lambda t: min(f.k_from for f in t[1])):
            first = min(fs, key=lambda f: f.k_from)
            specs = sorted({f.basename for f in fs})
            print(f"  {concept}: {len(fs)} checks from cp{first.k_from:02d}, in {len(specs)} spec(s), "
                  f"e.g. {first.basename}::{first.title}", file=out)
    unver = by[UNVERIFIED]
    if unver:
        reasons = Counter(re.sub(r"\d+", "N", f.outcome.reason)[:120] for f in unver)
        print(f"UNVERIFIED ({len(unver)} assertion checks):", file=out)
        for reason, n in reasons.most_common():
            print(f"  {n:4d}  {reason}", file=out)
        if verbose:
            for f in sorted(unver, key=lambda f: (f.k_from, f.basename)):
                print(f"    {_span(f)} {f.basename}::{f.title}  {f.outcome.where}  {f.outcome.reason}",
                      file=out)
    counts = {s: len(by[s]) for s in (VERIFIED, MISMATCH, UNVERIFIED, UNMODELLED)}
    total = sum(counts.values()) or 1
    # each distinct assertion (a spec file's test and step) at its worst result over the checkpoints
    rank = {MISMATCH: 3, UNVERIFIED: 2, UNMODELLED: 1, VERIFIED: 0}
    worst: dict = {}
    for f in findings:
        key = (f.path, f.title, f.outcome.index)
        if key not in worst or rank[f.status] > rank[worst[key]]:
            worst[key] = f.status
    distinct = Counter(worst.values())
    print(f"SUMMARY: {len(worst)} distinct assertions (worst result over the checkpoints checked): "
          + ", ".join(f"{s} {distinct[s]}" for s in (VERIFIED, MISMATCH, UNVERIFIED, UNMODELLED)), file=out)
    print("         assertion checks (one per assertion per run of checkpoints with the same result): "
          + ", ".join(f"{s} {n} ({100 * n // total}%)" for s, n in counts.items()), file=out)
    return counts


def survey(checkpoints: list[dict], through: int, out=sys.stdout) -> None:
    """The variety of steps and assertion forms in the specs, to see what the replay must handle."""
    versions = spec_versions(checkpoints, through)
    traces = trace_specs(v.path for v in versions)
    shapes, errors = Counter(), []
    for v in versions:
        tr = traces[v.path]
        if tr.get("error"):
            errors.append(f"{v.basename}: {tr['error']}")
        for t in tr.get("tests") or []:
            if t.get("error"):
                errors.append(f"{v.basename}::{t['title']}: {t['error']}")
            for e in t["events"]:
                loc = "/".join(next(iter(s)) for s in e.get("loc", []))
                shapes[f"{e['op']:7s} {e.get('matcher', ''):14s} {loc}"] += 1
    for shape, n in shapes.most_common():
        print(f"{n:6d}  {shape}", file=out)
    for e in errors:
        print(f"TRACE ERROR {e}", file=out)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Check spec assertions against the reference model.")
    ap.add_argument("--config", required=True)
    ap.add_argument("--checkpoints", help="override the checkpoints file")
    ap.add_argument("--through", type=int, help="last checkpoint to check (default: all)")
    ap.add_argument("--only", help="check only at this checkpoint (cpNN or NN)")
    ap.add_argument("--survey", action="store_true", help="list the step and assertion forms, then stop")
    ap.add_argument("--verbose", action="store_true", help="list every unverified assertion")
    args = ap.parse_args(argv)
    cps = load_checkpoints(args.config, args.checkpoints)
    through = args.through or len(cps)
    only = int(re.sub(r"^cp", "", args.only)) if args.only else None
    if only is not None:
        through = max(through, only)
    if args.survey:
        survey(cps, through)
        return 0
    counts = report(check(cps, through, only), verbose=args.verbose)
    return 1 if counts[MISMATCH] else 0


if __name__ == "__main__":
    sys.exit(main())

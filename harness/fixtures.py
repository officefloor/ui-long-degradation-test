"""Test-data (fixture) contract, derived from the specs themselves (AGENTS.md §4).

Every spec arranges its own data with `resetAndSeed({...})`. The app's seed endpoint is agent
code, so nothing stops a later change from silently dropping a field an earlier spec seeds —
and the agent never sees those earlier specs. This module turns the specs into data the
harness can act on, without showing the agent any assertion or anything from the future:

- `spec_fixtures(path)`  every `resetAndSeed` literal in a spec, as JSON, with its test title.
- `fixture_contract(checkpoints, k)`  the data sets the app must still store before checkpoint
  k runs: those of the specs in force at k-1, minus the specs k replaces (`mutates`). A field
  leaves the contract only when every spec that seeded it has been replaced.
- `hidden_field_violations(checkpoints)`  the stream lint: a replacement copy that seeds a field
  no visible spec has seeded so far, which the agent had no way to know it must store.

The fixture literals are plain data, optionally built from local `const` declarations in the same
test; node evaluates them exactly, and anything else is an authoring error and raises.
"""
from __future__ import annotations

import json
import os
import re
import subprocess

_SEED_CALL = re.compile(r"resetAndSeed\(\s*\{")
_TEST_TITLE = re.compile(r"""(?m)^\s*test\(\s*(['"`])((?:(?!\1)[^\\]|\\.)*)\1""")


def _balanced(src: str, open_at: int) -> str:
    """The `{...}` literal starting at src[open_at] == '{', honouring strings and comments."""
    depth, i, n = 0, open_at, len(src)
    while i < n:
        ch = src[i]
        if ch in "'\"`":
            j = i + 1
            while j < n and src[j] != ch:
                j += 2 if src[j] == "\\" else 1
            i = j
        elif src.startswith("//", i):
            i = src.find("\n", i)
            i = n if i < 0 else i
            continue
        elif ch in "{[":
            depth += 1
        elif ch in "}]":
            depth -= 1
            if depth == 0:
                return src[open_at:i + 1]
        i += 1
    raise ValueError(f"unbalanced fixture literal at offset {open_at}")


_CONST_DECL = re.compile(r"\bconst\s+(\w+)\s*=\s*")


def _statement_end(src: str, i: int) -> int:
    """Index just past the `;` that ends the expression starting at src[i] (depth 0)."""
    depth, n = 0, len(src)
    while i < n:
        ch = src[i]
        if ch in "'\"`":
            j = i + 1
            while j < n and src[j] != ch:
                j += 2 if src[j] == "\\" else 1
            i = j
        elif ch in "{[(":
            depth += 1
        elif ch in "}])":
            depth -= 1
        elif ch == ";" and depth == 0:
            return i + 1
        i += 1
    raise ValueError("unterminated const declaration")


def _local_consts(src: str, start: int, end: int) -> str:
    """`const x = ...;` declarations between a test's start and a seed call — fixtures may
    build rows in a local (cp39 makes 15 invoices with Array.from)."""
    out, i = [], start
    while True:
        m = _CONST_DECL.search(src, i, end)
        if not m:
            return "".join(out)
        stop = _statement_end(src, m.end())
        out.append(src[m.start():stop])
        i = stop


def _eval_literals(items: list[tuple[str, str]]) -> list:
    """Evaluate [(local const declarations, literal)] in node; each in its own scope."""
    if not items:
        return []
    script = ("const out = [" + ",".join(f"(() => {{ {decls} return ({lit}); }})()"
                                         for decls, lit in items) + "];"
              "process.stdout.write(JSON.stringify(out));")
    # Fed on stdin: the whole suite's fixtures exceed the argv limit.
    p = subprocess.run(["node", "-"], input=script, capture_output=True, text=True, timeout=120)
    if p.returncode != 0:
        raise ValueError(f"fixture literal is not plain data: {p.stderr.strip()[:500]}")
    return json.loads(p.stdout)


_CACHE: dict[tuple[str, float], list[tuple[str, dict]]] = {}


def _parse(src: str) -> tuple[list[str], list[tuple[str, str]]]:
    titles = [(m.start(), m.group(2)) for m in _TEST_TITLE.finditer(src)]
    owners, items = [], []
    for m in _SEED_CALL.finditer(src):
        owner = [(pos, t) for pos, t in titles if pos < m.start()]
        test_start = owner[-1][0] if owner else 0
        items.append((_local_consts(src, test_start, m.start()), _balanced(src, m.end() - 1)))
        owners.append(owner[-1][1] if owner else "")
    return owners, items


def prime(paths) -> None:
    """Evaluate every uncached spec's fixtures in ONE node process (a process per spec made the
    full 250-checkpoint lint take ~40s)."""
    todo = []
    for p in dict.fromkeys(paths):
        key = (p, os.path.getmtime(p))
        if key not in _CACHE:
            todo.append((key, *_parse(open(p).read())))
    flat = [it for _, _, items in todo for it in items]
    values = iter(_eval_literals(flat))
    for key, owners, items in todo:
        _CACHE[key] = [(t, next(values)) for t in owners]


def spec_fixtures(path: str) -> list[tuple[str, dict]]:
    """[(test title, fixture dict)] for every resetAndSeed call in the spec, in source order."""
    prime([path])
    return [(t, json.loads(json.dumps(v))) for t, v in _CACHE[(path, os.path.getmtime(path))]]


def field_paths(fixture, prefix: str = "") -> set[str]:
    """Field paths a fixture seeds: `asOf`, `clients[].archived`, `invoices[].lineItems[].qty`.
    Array elements share one path, so the set names fields, not rows."""
    out: set[str] = set()
    if isinstance(fixture, dict):
        for k, v in fixture.items():
            p = f"{prefix}.{k}" if prefix else k
            out.add(p)
            out |= field_paths(v, p)
    elif isinstance(fixture, list):
        for v in fixture:
            out |= field_paths(v, prefix + "[]")
    return out


# Words that describe the harness's own process (hidden replacement copies, mutates lists) rather
# than the feature. The agent sees only its own spec; such a comment sent it looking for files it
# cannot see, and cp09's named earlier checkpoints ("mutates: [4, 8]").
_PROCESS_LEAK = re.compile(r"sibling|override folder|updated cop(?:y|ies)|shipped updated|"
                           r"\bmutates\b|\bmutative\b", re.I)


# A sequence token (cp01..cp250). The runner refuses to install an own spec carrying one, so the
# lint must refuse it first: run 202610152358 aborted at cp05 on a comment "per cp04".
CP_TOKEN = re.compile(r"\bcp\d{2,}\b", re.IGNORECASE)


def process_leaks(text: str) -> list[str]:
    """Harness-process phrases in a spec the agent will see (empty when clean)."""
    return sorted({m.group(0).lower() for m in _PROCESS_LEAK.finditer(text)})


_GOTO = re.compile(r"""page\.goto\(\s*(['"`])(.*?)\1""")
_NAV = re.compile(r"""getByTestId\(\s*(['"`])nav-""")


def screen_violations(checkpoints: list[dict], harness_root: str) -> list[str]:
    """Own specs that leave the one screen: open any URL other than '/' or click a nav-* entry
    (acceptance/WORKSPACE.md §3). Hidden copies are checked too, since they replay the same UI."""
    out = []
    for cp in checkpoints:
        for e in spec_entries(cp, harness_root):
            path = os.path.join(harness_root, e)
            if not os.path.isfile(path):
                out.append(f"cp{cp['n']:02d} {e}: spec file missing")
                continue
            src = open(path).read()
            urls = {m.group(2) for m in _GOTO.finditer(src)} - {"/"}
            if urls:
                out.append(f"cp{cp['n']:02d} {os.path.basename(e)}: opens {sorted(urls)}")
            if _NAV.search(src):
                out.append(f"cp{cp['n']:02d} {os.path.basename(e)}: clicks a nav-* entry")
    return out


_REL_IMPORT = re.compile(r"""from\s+(['"])(\.{1,2}/[^'"]+)\1""")


def unresolved_imports(checkpoints: list[dict], harness_root: str) -> list[str]:
    """Relative imports that will not resolve once installed. Every spec — a `cp<NN>/` copy
    included — is installed by basename into the one specs folder, so its imports resolve from
    the OWN spec's folder, not the copy's: `../../support/seed` from a copy is a compile error
    that empties the whole gate report (run 202610152334's cp04). An import landing in
    `support/` is taken as resolved: that folder is e2e/support, which the stack also fills
    (audit.ts), so only the depth of the path can be checked there."""
    support = os.path.join(harness_root, "acceptance", "support") + os.sep
    out = []
    for cp in checkpoints:
        own = own_spec(cp)
        installed = os.path.join(harness_root, os.path.dirname(own)) if own else harness_root
        for e in spec_entries(cp, harness_root):
            path = os.path.join(harness_root, e)
            if not os.path.isfile(path):
                continue
            for m in _REL_IMPORT.finditer(open(path).read()):
                target = os.path.normpath(os.path.join(installed, m.group(2)))
                if not target.startswith(support) and \
                        not any(os.path.isfile(target + ext) for ext in ("", ".ts", ".js")):
                    out.append(f"cp{cp['n']:02d} {e}: imports {m.group(2)!r}, absent once installed")
    return out


def own_spec_leaks(checkpoints: list[dict], harness_root: str) -> list[str]:
    """Checkpoints whose OWN (agent-visible) spec mentions the harness's process."""
    out = []
    for cp in checkpoints:
        own = own_spec(cp)
        if own:
            text = open(os.path.join(harness_root, own)).read()
            hits = process_leaks(text) + sorted({m.group(0) for m in CP_TOKEN.finditer(text)})
            if hits:
                out.append(f"cp{cp['n']:02d} {os.path.basename(own)}: mentions {', '.join(hits)}")
    return out


def own_spec(cp: dict) -> str:
    """The checkpoint's OWN spec (the only one the agent may see) — its `test`, or the
    first entry of an explicit `tests` list."""
    return cp["test"] if cp.get("test") else list(cp.get("tests") or [None])[0]


def spec_entries(cp: dict, harness_root: str) -> list[str]:
    """Repo-root-relative spec paths a checkpoint installs: its OWN spec, PLUS any updated
    copies of prior specs it ships. A mutative checkpoint drops those updated copies in a
    sibling `cp<NN>/` folder next to the specs (auto-discovered here, installed by basename so
    they win over the prior originals); an explicit `tests:` list is also honoured for
    back-compat."""
    own = own_spec(cp)
    entries: list[str] = [own] if own else []
    base_dir = os.path.dirname(own) if own else ""
    override_rel = os.path.join(base_dir, f"cp{int(cp['n']):02d}")
    override_abs = os.path.join(harness_root, override_rel)
    if os.path.isdir(override_abs):
        for fn in sorted(os.listdir(override_abs)):
            if fn.endswith(".spec.ts"):
                entries.append(os.path.join(override_rel, fn))
    for e in (cp.get("tests") or []):
        if e not in entries:
            entries.append(e)
    return entries


def _in_force(checkpoints: list[dict], k: int, harness_root: str) -> dict[str, str]:
    """{installed basename -> absolute source} of the suite in force after checkpoint k."""
    authored: dict[str, str] = {}
    for cp in checkpoints:
        if cp["n"] > k:
            break
        for entry in spec_entries(cp, harness_root):
            authored[os.path.basename(entry)] = os.path.join(harness_root, entry)
    return authored


def fixture_contract(checkpoints: list[dict], k: int, harness_root: str) -> dict:
    """The data sets the app must still store when checkpoint k starts.

    Specs in force at k-1, minus every spec whose checkpoint k mutates: a checkpoint that
    deliberately reverses a rule (cp248 collapsing stacked discounts) must not be held to the
    data of the specs it replaces. Only past data is included — never k's own spec or copies."""
    cp_k = next((c for c in checkpoints if c["n"] == k), None)
    mutated = {int(m) for m in ((cp_k or {}).get("mutates") or [])}
    sets = []
    in_force = _in_force(checkpoints, k - 1, harness_root)
    prime(in_force.values())
    for base, path in sorted(in_force.items()):
        m = re.match(r"cp(\d+)_", base)
        if m and int(m.group(1)) in mutated:
            continue
        for title, fx in spec_fixtures(path):
            sets.append({"spec": base, "test": title, "fixture": fx})
    return {"checkpoint": k, "excluded_mutated": sorted(mutated), "data_sets": sets}


def test_titles(path: str) -> list[str]:
    """Test titles in a spec, in order (the part of a test id after `<basename>::`)."""
    return [m.group(2) for m in _TEST_TITLE.finditer(open(path).read())]


def _unescape_title(raw: str) -> str:
    return re.sub(r"\\(.)", r"\1", raw)


def test_bodies(path: str) -> dict[str, str]:
    """{test title: its body with comments and whitespace removed}, so two versions of a test
    compare equal exactly when what they do and assert is the same."""
    src = open(path).read()
    out = {}
    for m in _TEST_TITLE.finditer(src):
        # the test's own callback block, `async ({ page }) => { ... }`: nothing after it, so a test
        # added behind it, or the file's closing lines, do not read as a change to it
        arrow = src.index("=>", m.end())
        body = _balanced(src, src.index("{", arrow))
        body = re.sub(r"(?m)^\s*//.*$", "", body)          # whole-line comments
        body = re.sub(r"\s+//[^'\"`\n]*$", "", body, flags=re.M)   # trailing comments
        out[_unescape_title(m.group(2))] = re.sub(r"\s+", "", body)
    return out


def replaced_tests(checkpoints: list[dict], k: int, harness_root: str) -> list[str]:
    """Test ids (`<basename>::<title>`) that an updated copy installed at checkpoint k keeps under
    the same title but changes: it seeds, does or asserts something else than the version in
    force before k. Failing one at k is an unsatisfied replacement, not a regression
    (correctness.count_true_regressions); a test the copy carries unchanged is not listed."""
    before = _in_force(checkpoints, k - 1, harness_root)
    after = _in_force(checkpoints, k, harness_root)
    out = []
    for base, path in sorted(after.items()):
        old = before.get(base)
        if old is None or old == path:
            continue
        was, now = test_bodies(old), test_bodies(path)
        out += [f"{base}::{t}" for t in now if t in was and was[t] != now[t]]
    return out


def undeclared_retirements(checkpoints: list[dict], harness_root: str) -> list[str]:
    """Tests a replacement copy drops without its checkpoint saying so in `retires:`.

    A copy fully replaces the earlier spec from its checkpoint on, so a test it leaves out is gone
    from the gate for the rest of the chain. That is right when the request changed the behaviour
    (cp32 retiring manual payment) and silent coverage loss when it did not (cp40's line-items copy
    dropping 'adding a line item increases the invoice total'). `retires:` makes the first explicit;
    anything else is reported. Entries are test ids: `<spec basename>::<test title>`."""
    in_force: dict[str, str] = {}
    out: list[str] = []
    for cp in checkpoints:
        entries = spec_entries(cp, harness_root)
        retires = set(cp.get("retires") or [])
        for e in entries:
            base, path = os.path.basename(e), os.path.join(harness_root, e)
            prev = in_force.get(base)
            if prev is not None:
                kept = set(test_titles(path))
                for title in test_titles(prev):
                    if title not in kept and f"{base}::{title}" not in retires:
                        out.append(f"cp{cp['n']:02d} drops {base}::{title}")
            in_force[base] = path
        mutated = {int(m) for m in (cp.get("mutates") or [])}
        for r in sorted(retires):
            base, _, title = r.partition("::")
            if base not in {os.path.basename(e) for e in entries}:
                out.append(f"cp{cp['n']:02d} retires {r}, but ships no copy of {base}")
            m = re.match(r"cp(\d+)_", base)
            if m and int(m.group(1)) not in mutated:
                # Scoring treats a vanished test as intended only when its checkpoint is mutated.
                out.append(f"cp{cp['n']:02d} retires {r}, but {int(m.group(1))} is not in its mutates")
    return out


_LITERAL_TESTID = re.compile(r"""getByTestId\((['"])([^'"`$]+)\1\)""")
_FAMILY_TAIL = re.compile(r"-[A-Za-z0-9]{1,3}$")


def _anchors(text: str) -> set[str]:
    """Literal test ids in `text`, a numbered family (`person-row-5`, `band-count-E`) as one
    anchor: the agent extends a pattern it already renders. Template and regex ids are skipped."""
    out = set()
    for m in _LITERAL_TESTID.finditer(text):
        tid = m.group(2)
        out.add(_FAMILY_TAIL.sub("-#", tid) if tid.count("-") >= 2 else tid)
    return out


def hidden_anchor_violations(checkpoints: list[dict], harness_root: str) -> list[str]:
    """Test ids a hidden copy asserts that the agent has no way to know.

    The agent sees only its own spec. An anchor is knowable when that spec names it, or when a test
    still in force asserts it, so the app already renders it. One asserted only by tests the
    checkpoint retires is not: cp48's copy expected the single score in `person-notes`, an id only
    the retired notes test used, and the agent sensibly named the new cell `person-score` (run
    202610160010). Retiring a test does not always remove its anchor from the app (cp140 retires
    every group test, yet each group figure keeps its id), so a checkpoint names the anchors that
    survive under `keeps_anchors:`."""
    out = []
    for cp in checkpoints:
        entries = spec_entries(cp, harness_root)
        own = own_spec(cp)
        copies = entries[1:] if own else entries
        if not copies:
            continue
        allowed = _anchors(open(os.path.join(harness_root, own)).read()) if own else set()
        allowed |= _anchors("".join(f"getByTestId('{a}')" for a in cp.get("keeps_anchors") or []))
        retired = {_unescape_title(r) for r in cp.get("retires") or []}
        before = _in_force(checkpoints, cp["n"] - 1, harness_root)
        for base, path in before.items():
            for title, body in test_bodies(path).items():
                if f"{base}::{title}" not in retired:
                    allowed |= _anchors(body)
        for e in copies:
            base = os.path.basename(e)
            old = test_bodies(before[base]) if base in before else {}
            for title, body in test_bodies(os.path.join(harness_root, e)).items():
                if old.get(title) == body:
                    continue
                for tid in sorted(_anchors(body) - allowed):
                    out.append(f"cp{cp['n']:02d} {base}::{title} asserts {tid!r}, which the agent "
                               "cannot see")
    return out


# Figures that combine people across the whole sheet, or over a person's patrons and follows: the
# figures the standing hold rule reaches. Group figures are not sheet-wide (a held person is never
# put in a group), so the group rollups are left out.
_SHEET_WIDE = re.compile(
    r"^(?!group-|person-|concept-|sheet-|nav-|people-|rollup-(?:biggest-group|group-count|groups-above|mean-size|"
    r"median-strength|prime-group|strength-range|top-group-size|total-strength)$)"
    r"[a-z]"
    r"|^concept-(?:rank|percentile|rank-global|norm|outlier|quota|cume|stratum|portion|"
    r"backing|clout|flux|synergy|vector|tide|charge|churn|flow|brace|crest|influence|combined)$")
_HELD = re.compile(r"\bhold\s*:\s*true\b|person-hold-")   # seeded, or put on hold through the UI


def standing_hold_violations(checkpoints: list[dict], harness_root: str, since: int = 77) -> list[str]:
    """Tests from checkpoint `since` on that assert a sheet-wide or patron/follow figure without
    seeding a held person. The hold rule (cp73-76) is standing: a held person is left out of those
    figures (totals count them at half) for the rest of the run, so every such test carries one, and
    a structure that forgot the rule on a newer figure fails it. Matching is by test id, a heuristic:
    seeding a held person where it was not needed is harmless."""
    out = []
    for cp in checkpoints:
        if cp["n"] < since:
            continue
        for e in spec_entries(cp, harness_root):
            path = os.path.join(harness_root, e)
            if not os.path.isfile(path):
                continue
            for title, body in test_bodies(path).items():
                if any(_SHEET_WIDE.search(m.group(2)) for m in _LITERAL_TESTID.finditer(body)) \
                        and not _HELD.search(body):
                    out.append(f"cp{cp['n']:02d} {os.path.basename(e)}::{title} seeds no held person")
    return out


def hidden_field_violations(checkpoints: list[dict], harness_root: str) -> list[str]:
    """Replacement copies that seed a field no VISIBLE spec has seeded up to their checkpoint.

    The agent extends the seed endpoint only for fields its own spec uses, so such a field is
    one it had no reason to store; the hidden copy then fails on data, not behaviour (cp25/cp29
    `archived`). Each hit is a stream defect: seed the field in the checkpoint's own spec."""
    seen: set[str] = set()
    out: list[str] = []
    prime(os.path.join(harness_root, e) for cp in checkpoints for e in spec_entries(cp, harness_root))
    for cp in checkpoints:
        entries = spec_entries(cp, harness_root)
        if not entries:
            continue
        for _, fx in spec_fixtures(os.path.join(harness_root, entries[0])):
            seen |= field_paths(fx)
        for e in entries[1:]:
            used = set()
            for _, fx in spec_fixtures(os.path.join(harness_root, e)):
                used |= field_paths(fx)
            for f in sorted(used - seen):
                out.append(f"cp{cp['n']:02d} {os.path.basename(e)}: seeds `{f}`, which no visible "
                           f"spec up to cp{cp['n']:02d} seeds")
    return out

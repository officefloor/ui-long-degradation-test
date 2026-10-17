"""Build the stream from its reference model (harness/oracle/hell.py + hell_scripts.py).

    .venv/bin/python -m harness.stream_build --config config.yaml          # write everything
    .venv/bin/python -m harness.stream_build --config config.yaml --check  # verify, write nothing

Writes checkpoints.yaml (the requests, types, `mutates:`), one own spec per checkpoint under
acceptance/specs/, and for each mutative checkpoint N the ripple copies acceptance/specs/cpNN/ of
every prior whose rendered spec changes at N. Nothing is hand-edited: a spec is the script
(hell_scripts) run through the model (hell) at a checkpoint, rendered as Playwright steps whose
every expected value the model computed.

Checks (both modes; --check also refuses to write):
  - an ADDITIVE checkpoint changes no prior spec (else it is a mutation in disguise);
  - a MUTATIVE checkpoint changes at least one prior spec, and `mutates:` is derived from exactly
    the priors it changes;
  - ABLATION: every rule a checkpoint introduces bites in that checkpoint's own spec and in every
    copy it ships — rendering with the rule switched off (hell.Model(off=...)) must change the
    spec. A test that an app ignoring the rule would still pass is a defect;
  - STALE FILES: acceptance/specs may hold only what this build writes; anything else is listed
    with the command that removes it, and the build stops.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys

import yaml

from .oracle import hell
from .oracle.hell import COVERAGE, REQUESTS, RULES, SLUG, TYPE, Model, Refused
from .oracle.hell_scripts import SCRIPTS

ROLLUP_SINCE = {"rollup-claimed-total": 5, "rollup-due-total": 7,
                "rollup-overdue-count": 25, "rollup-overdue-total": 25}
PERIOD_SINCE = {"period-due-total": 17, "period-closed": 18}

HARNESS_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPECS_DIR = os.path.join(HARNESS_ROOT, "acceptance", "specs")
SHEET_TOKEN = "__SHEET__"


def ts(v) -> str:
    """A TS string literal (double-quoted, JSON escaping is valid TS)."""
    return json.dumps(v, ensure_ascii=False)


def tpl(v: str) -> str:
    """A TS template literal with the sheet token interpolated."""
    body = v.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")
    return "`" + body.replace(SHEET_TOKEN, "${sheet}") + "`"


def slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "_", name.strip().casefold()).strip("_")
    return s or "x"


class Renderer:
    """Runs one script through the model at k and emits the Playwright lines."""

    def __init__(self, n: int, k: int, off=()):
        self.n, self.k = n, k
        self.m = Model(k, sheet=SHEET_TOKEN, off=off)
        self.lines: list[str] = []
        self.pages: dict[str, str] = {}
        self.pg = ""
        self.vars: set[str] = set()

    # -- helpers
    def emit(self, s: str) -> None:
        self.lines.append("    " + s)

    def var(self, base: str) -> str:
        v, n = base, 2
        while v in self.vars:
            v, n = f"{base}_{n}", n + 1
        self.vars.add(v)
        return v

    def pvar(self, name: str) -> str:
        return self.m.person(name).var

    def cvar(self, name: str, idx: int) -> str:
        return self.m.claim(name, idx).var

    def attempt(self, fn, *a, **kw):
        """Run a model action; True when it went through, False when the screen refused it."""
        try:
            fn(*a, **kw)
            return True
        except Refused:
            return False

    def expect_ok(self, call: str, ok: bool) -> None:
        self.emit(f"expect(await {call}).toBe({'true' if ok else 'false'});")

    # -- steps
    def step(self, st: tuple) -> None:
        op, args = st[0], st[1:]
        getattr(self, "s_" + op)(*args)

    def s_as(self, user: str) -> None:
        self.m.user = user
        if user not in self.pages:
            self.pages[user] = f"pg_{user}"
            self.emit(f"const pg_{user} = await ui.userPage(browser, {ts(user)}, sheet);")
        elif user not in self.m.editing:
            # another user may have changed the sheet since this page last loaded it; a page
            # with an editor open keeps it (the stale-edit test needs exactly that)
            self.emit(f"await ui.refresh(pg_{user});")
        self.pg = self.pages[user]

    def s_today(self, d: str) -> None:
        self.m.today = hell.day(d)
        self.emit(f"await ui.setToday({self.pg}, {ts(d)});")

    def s_person(self, name: str, grade: str, grade_from: str | None = None) -> None:
        fields = {"name": name, "grade": grade}
        if grade_from and self.k >= 28:
            fields["gradeFrom"] = grade_from
        call = f"ui.addPerson({self.pg}, {ts(fields)})"
        try:
            p = self.m.add_person(name, grade, grade_from)
        except Refused:
            self.emit(f"expect(await {call}).toBeNull();")
            return
        p.var = self.var("p_" + slugify(name))
        self.emit(f"const {p.var} = ui.must(await {call});")

    def s_edit_open(self, name: str) -> None:
        self.m.edit_open(name)
        self.emit(f"await ui.editOpen({self.pg}, {self.pvar(name)});")

    def _fields(self, fields: dict) -> dict:
        out = {}
        for key, val in fields.items():
            if key == "grade_from":
                if self.k >= 28:
                    out["gradeFrom"] = val
            else:
                out[key] = val
        return out

    def s_edit_save(self, fields: dict) -> None:
        ok = self.attempt(self.m.edit_save, fields)
        self.expect_ok(f"ui.editSave({self.pg}, {ts(self._fields(fields))})", ok)

    def s_edit(self, name: str, fields: dict) -> None:
        pv = self.pvar(name)
        self.m.edit_open(name)
        ok = self.attempt(self.m.edit_save, fields)
        self.expect_ok(f"ui.editPerson({self.pg}, {pv}, {ts(self._fields(fields))})", ok)

    def _claim_fields(self, amount, when, note, corrects) -> dict:
        f = {"amount": amount}
        if when:
            f["date"] = when
        if note:
            f["note"] = note
        if corrects and self.k >= 30:
            f["corrects"] = corrects
        return f

    def s_claim(self, name, amount, when=None, note="", corrects=None) -> None:
        pv = self.pvar(name)
        call = f"ui.addClaim({self.pg}, {pv}, {ts(self._claim_fields(amount, when, note, corrects))})"
        try:
            c = self.m.add_claim(name, amount, when, note, corrects)
        except Refused:
            self.emit(f"expect(await {call}).toBeNull();")
            return
        c.var = self.var(f"c_{slugify(name)}_{c.idx}")
        self.emit(f"const {c.var} = ui.must(await {call});")

    def s_claim2(self, name, amount, when, note) -> None:
        assert self.k >= 14, "claim2 is only rendered from cp14"
        pv = self.pvar(name)
        c = self.m.add_claim(name, amount, when, note, twice=True)
        c.var = self.var(f"c_{slugify(name)}_{c.idx}")
        n = len(self.m.person_claims(self.m.person(name)))
        self.emit(f"const {c.var} = ui.must(await ui.addClaimTwice({self.pg}, {pv}, "
                  f"{ts(self._claim_fields(amount, when, note, None))}));")
        self.emit(f"expect(await ui.claimCount({self.pg}, {pv})).toBe({n});")

    def s_claim_edit(self, name, idx, fields) -> None:
        cv = self.cvar(name, idx)
        ok = self.attempt(self.m.edit_claim, name, idx, fields)
        self.expect_ok(f"ui.editClaim({self.pg}, {cv}, {ts(fields)})", ok)

    def _action(self, name, idx, action, fn, *extra) -> None:
        cv = self.cvar(name, idx)
        ok = self.attempt(fn, name, idx, *extra)
        tail = "".join(f", {ts(x)}" for x in extra)
        self.expect_ok(f"ui.claimAction({self.pg}, {cv}, {ts(action)}{tail})", ok)

    def s_open(self, name, idx):
        self._action(name, idx, "open", self.m.open_claim)

    def s_settle(self, name, idx):
        self._action(name, idx, "settle", self.m.settle_claim)

    def s_void(self, name, idx):
        self._action(name, idx, "void", self.m.void_claim)

    def s_approve(self, name, idx):
        self._action(name, idx, "approve", self.m.approve_claim)

    def s_reject(self, name, idx, reason):
        self._action(name, idx, "reject", self.m.reject_claim, reason)

    def s_open_both(self, a, b) -> None:
        (n1, i1, u1), (n2, i2, u2) = a, b
        for u in (u1, u2):
            if u not in self.pages:
                self.s_as(u)
        c1, c2 = self.cvar(n1, i1), self.cvar(n2, i2)
        self.emit(f"await Promise.all([ui.claimAction({self.pages[u1]}, {c1}, \"open\"), "
                  f"ui.claimAction({self.pages[u2]}, {c2}, \"open\")]);")
        saved = self.m.user
        self.m.user = u1
        self.m.open_claim(n1, i1)
        self.m.user = u2
        self.m.open_claim(n2, i2)
        self.m.user = saved
        nums = sorted([self.m.claim(n1, i1).number or "", self.m.claim(n2, i2).number or ""])
        self.emit(f"expect((await ui.numbersOf({self.pg}, [{c1}, {c2}])).sort()).toEqual({ts(nums)});")

    def s_rate(self, grade, pct, start=None) -> None:
        f = {"grade": grade, "pct": pct}
        if start and self.k >= 11:
            f["from"] = start
        ok = self.attempt(self.m.set_rate, grade, pct, start)
        self.expect_ok(f"ui.setRate({self.pg}, {ts(f)})", ok)

    def s_period(self, name, start, end) -> None:
        ok = self.attempt(self.m.add_period, name, start, end)
        self.expect_ok(f"ui.addPeriod({self.pg}, {ts({'name': name, 'from': start, 'to': end})})", ok)

    def s_close(self, name) -> None:
        ok = self.attempt(self.m.close_period, name)
        self.expect_ok(f"ui.periodAction({self.pg}, {ts(name)}, \"close\")", ok)

    def s_reopen(self, name) -> None:
        ok = self.attempt(self.m.reopen_period, name)
        self.expect_ok(f"ui.periodAction({self.pg}, {ts(name)}, \"reopen\")", ok)

    def s_import(self, text) -> None:
        r = self.m.import_people(text)
        v = self.var("imp")
        self.emit(f"const {v} = await ui.importPeople({self.pg}, {ts(text)});")
        exp = {"added": r["added"], "errors": r["errors"]}
        if self.k >= 16:
            exp["updated"] = r["updated"]
        self.emit(f"expect({v}).toEqual({ts(exp)});")
        if not r["errors"]:
            for line in text.splitlines():
                name = line.split(",")[0].strip()
                if name:
                    p = self.m.person(name)
                    if not p.var:
                        p.var = self.var("p_" + slugify(name))
                        self.emit(f"const {p.var} = await ui.personId({self.pg}, {ts(p.name)});")

    def s_quick(self, name, amount) -> None:
        call = f"ui.quickAdd({self.pg}, {ts({'name': name, 'amount': amount})})"
        try:
            c = self.m.quick_add(name, amount)
        except Refused:
            self.emit(f"expect(await {call}).toBeNull();")
            return
        p = self.m.person(name)
        c.var = self.var(f"c_{slugify(name)}_{c.idx}")
        self.emit(f"const {c.var} = ui.must(await {call});")
        if not p.var:
            p.var = self.var("p_" + slugify(name))
            self.emit(f"const {p.var} = await ui.personId({self.pg}, {ts(p.name)});")

    def s_retire(self, name, when) -> None:
        self.m.retire(name, when)
        self.expect_ok(f"ui.retire({self.pg}, {self.pvar(name)}, {ts(when)})", True)

    def s_hold(self, name, start=None, end=None) -> None:
        self.m.hold(name, start, end)
        f = {}
        if self.k >= 40:
            if start:
                f["from"] = start
            if end:
                f["to"] = end
        self.expect_ok(f"ui.hold({self.pg}, {self.pvar(name)}, {ts(f)})", True)

    def s_show_retired(self, on: bool) -> None:
        self.m.show_retired = on
        self.emit(f"await ui.showRetired({self.pg}, {'true' if on else 'false'});")

    def s_role(self, user, role) -> None:
        ok = self.attempt(self.m.set_role, user, role)
        self.expect_ok(f"ui.setRole({self.pg}, {ts(user)}, {ts(role)})", ok)

    def s_setting(self, key, value) -> None:
        self.m.set_setting(key, value)
        self.emit(f"await ui.setSetting({self.pg}, {ts(key)}, {ts(value)});")

    def s_patron(self, name, patron) -> None:
        ok = self.attempt(self.m.add_patron, name, patron)
        self.expect_ok(f"ui.addPatron({self.pg}, {self.pvar(name)}, {ts(self.m.person(patron).name)})", ok)

    def s_reassign(self, name, idx, to) -> None:
        cv = self.cvar(name, idx)
        ok = self.attempt(self.m.reassign_claim, name, idx, to)
        self.expect_ok(f"ui.reassign({self.pg}, {cv}, {ts(self.m.person(to).name)})", ok)

    def s_bulk_open(self, items) -> None:
        cvs = [self.cvar(n, i) for n, i in items]
        res = self.m.bulk_open(items)
        opened = sum(1 for r in res if r)
        self.emit(f"expect(await ui.bulkOpen({self.pg}, [{', '.join(cvs)}])).toEqual("
                  f"{{ opened: {opened}, refused: {len(res) - opened} }});")

    def s_export(self) -> None:
        self.emit(f"expect(await ui.exportCsv({self.pg})).toBe({ts(self.m.export_csv())});")

    def s_hidden(self, name) -> None:
        self.emit(f"await expect({self.pg}.getByTestId(\"person-row-\" + {self.pvar(name)})).toHaveCount(0);")

    def s_check(self, spec: dict) -> None:
        pg = self.pg
        v = self.m.view()
        self.emit(f"await ui.refresh({pg});")
        if spec.get("header"):
            self.emit(f"await expect({pg}.getByTestId(\"current-user\")).toHaveText({ts(v['user'])});")
            self.emit(f"await expect({pg}.getByTestId(\"sheet-current-id\")).toHaveText(sheet);")
        if spec.get("today") and self.n >= 2:
            self.emit(f"await expect({pg}.getByTestId(\"sheet-today\")).toHaveText({ts(v['today'])});")
        for key, row in v["people"].items():
            p = row["person"]
            if not p.var:
                continue
            rv = f"{pg}.getByTestId(\"person-row-\" + {p.var})"
            if not row["visible"]:
                if spec.get("people") or spec.get("claims"):
                    self.emit(f"await expect({rv}).toHaveCount(0);")
                continue
            for cell in spec.get("people") or []:
                tid = f"person-{cell}"
                if tid in row["cells"]:
                    self.emit(f"await expect({rv}.getByTestId({ts(tid)})).toHaveText({ts(row['cells'][tid])});")
            for c, cells in row["claims"]:
                if not c.var:
                    continue
                cv = f"{pg}.getByTestId(\"claim-row-\" + {c.var})"
                for cell in spec.get("claims") or []:
                    tid = f"claim-{cell}"
                    if tid not in cells:
                        continue
                    val = cells[tid]
                    if isinstance(val, list):
                        self.emit(f"await expect({cv}.getByTestId({ts(tid + '-line')})).toHaveText({ts(val)});")
                    else:
                        self.emit(f"await expect({cv}.getByTestId({ts(tid)})).toHaveText({ts(val)});")
        if spec.get("rollups"):
            for tid, val in v["rollups"].items():
                if ROLLUP_SINCE[tid] > self.n:
                    continue
                self.emit(f"await expect({pg}.getByTestId({ts(tid)})).toHaveText({ts(val)});")
        if spec.get("periods"):
            for name, cells in v["periods"].items():
                pv = f"{pg}.getByTestId({ts('period-row-' + name)})"
                for tid, val in cells.items():
                    if PERIOD_SINCE[tid] > self.n:
                        continue
                    self.emit(f"await expect({pv}.getByTestId({ts(tid)})).toHaveText({ts(val)});")
        if spec.get("rates") and self.n >= 7:
            for g, val in v["rates"].items():
                self.emit(f"await expect({pg}.getByTestId({ts('rate-current-' + g)})).toHaveText({ts(val)});")
        if spec.get("summary") and self.n >= 31:
            for tid, val in v["summary"].items():
                self.emit(f"await expect({pg}.getByTestId({ts(tid)})).toHaveText({ts(val)});")
        if spec.get("audit") and self.n >= 6:
            body = ",\n      ".join(tpl(line) for line in self.m.audit_text(self.n))
            self.emit(f"ui.expectAudit(sheet, [\n      {body}\n    ]);")


def render(n: int, k: int, off=()) -> str:
    """The spec of checkpoint n's script, rendered at checkpoint k. Under ablation a script may
    refer to a row the ablated app never created; that render is simply "different"."""
    r = Renderer(n, k, off)
    for st in SCRIPTS[n](k):
        try:
            r.step(st)
        except (KeyError, StopIteration) as e:
            if off:
                return f"ABLATED {sorted(off)} breaks the script at {st!r}"
            raise RuntimeError(f"cp{n:02d} script at k={k}: step {st!r} refers to a missing row ({e!r})")
    title = SLUG[n].replace("-", " ")
    head = ["import { test, expect } from '@playwright/test';",
            "import * as ui from '../support/ui';",
            "",
            f"test.describe({ts(title)}, () => {{",
            f"  test({ts(title)}, {{ tag: '@functionality' }}, async ({{ browser }}) => {{",
            "    const sheet = ui.sheetId();"]
    tail = ["  });", "});", ""]
    return "\n".join(head + r.lines + tail)


def own_path(n: int) -> str:
    return f"acceptance/specs/cp{n:02d}_{SLUG[n]}.spec.ts"


def copy_path(n: int, prior: int) -> str:
    return f"acceptance/specs/cp{n:02d}/cp{prior:02d}_{SLUG[prior]}.spec.ts"


def build(check_only: bool) -> int:
    lo, hi = COVERAGE
    problems: list[str] = []
    files: dict[str, str] = {}
    derived: dict[int, list[int]] = {}

    for n in range(lo, hi + 1):
        files[own_path(n)] = render(n, n)
        changed = []
        for prior in range(lo, n):
            before, after = render(prior, n - 1), render(prior, n)
            if before != after:
                changed.append(prior)
                if TYPE[n] == "mutative":
                    files[copy_path(n, prior)] = after
        if TYPE[n] == "additive" and changed:
            problems.append(f"cp{n:02d} is additive but changes the spec of cp"
                            + ", cp".join(f"{p:02d}" for p in changed))
        if TYPE[n] == "mutative":
            derived[n] = changed
            if not changed:
                problems.append(f"cp{n:02d} is mutative but changes no prior spec")

    # ablation: the rules a checkpoint introduces must bite in its own spec and its copies
    for n in range(lo, hi + 1):
        rules = [r for r, since in RULES.items() if since == n]
        for r in rules:
            if render(n, n, off={r}) == files[own_path(n)]:
                problems.append(f"cp{n:02d} own spec does not exercise its rule {r!r}")
            for prior in derived.get(n, []):
                if render(prior, n, off={r}) == files[copy_path(n, prior)]:
                    problems.append(f"cp{n:02d} copy of cp{prior:02d} does not exercise {r!r}")
    # informative: which in-force rules each own spec leaves unexercised
    quiet = {}
    for n in range(lo, hi + 1):
        idle = [r for r, since in RULES.items() if since <= n and render(n, n, off={r}) == files[own_path(n)]]
        if idle:
            quiet[n] = idle

    # stale files
    stale = []
    for root, _dirs, names in os.walk(SPECS_DIR):
        for fn in names:
            rel = os.path.relpath(os.path.join(root, fn), HARNESS_ROOT)
            if rel not in files:
                stale.append(rel)

    print(f"stream: cp{lo:02d}-cp{hi:02d}, {sum(1 for n in TYPE if TYPE[n] == 'mutative')} mutatives, "
          f"{len(files)} spec files ({len(files) - (hi - lo + 1)} ripple copies)")
    for n, idle in quiet.items():
        print(f"  cp{n:02d} leaves unexercised: {', '.join(idle)}")
    if stale:
        print(f"\nSTALE: {len(stale)} file(s) under acceptance/specs are not part of this stream. "
              "Remove them first:\n  git rm -rq acceptance/specs && git checkout -- . ; "
              "or: cd acceptance/specs && git rm -rq " + " ".join(sorted(stale)[:8]) + " ...")
        problems.append("stale spec files present")
    if problems:
        print("\nFAIL:")
        for p in problems:
            print(f"  - {p}")
        return 1
    if check_only:
        print("OK (check only, nothing written)")
        return 0

    for rel, text in files.items():
        path = os.path.join(HARNESS_ROOT, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as fh:
            fh.write(text)
    with open(os.path.join(HARNESS_ROOT, "checkpoints.yaml"), "w") as fh:
        fh.write(checkpoints_yaml(derived))
    print(f"wrote {len(files)} specs and checkpoints.yaml")
    return 0


def checkpoints_yaml(derived: dict[int, list[int]]) -> str:
    lo, hi = COVERAGE
    out = ["# GENERATED by harness.stream_build from the reference model harness/oracle/hell.py and the",
           "# scripts in harness/oracle/hell_scripts.py: edit those, then rebuild. Never hand-edit.",
           f"# Act I, cp{lo:02d}-cp{hi:02d}, cadence 3:1 (mutative when n % 4 == 0).",
           "checkpoints:"]
    for n in range(lo, hi + 1):
        out.append(f"  - id: cp{n:02d}_{SLUG[n]}")
        out.append(f"    type: {TYPE[n]}")
        out.append(f"    area: {hell.AREA[n]}")
        if TYPE[n] == "mutative":
            out.append(f"    algorithm: {hell.ALGORITHM[n]}")
            out.append(f"    mutates: [{', '.join(str(p) for p in derived[n])}]")
        out.append(f"    test: {own_path(n)}")
        out.append("    request: |")
        for line in REQUESTS[n].strip().splitlines():
            out.append(f"      {line}".rstrip())
        out.append("")
    return "\n".join(out)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--check", action="store_true", help="verify only; write nothing")
    args = ap.parse_args(argv)
    cfg = yaml.safe_load(open(os.path.join(HARNESS_ROOT, args.config))) or {}
    if cfg.get("checkpoints_file", "checkpoints.yaml") != "checkpoints.yaml":
        print("error: this builder writes checkpoints.yaml", file=sys.stderr)
        return 2
    return build(args.check)


if __name__ == "__main__":
    sys.exit(main())

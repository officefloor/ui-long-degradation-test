"""Build the stream from its reference model (harness/oracle/hell.py + hell_scripts.py + hell_gen.py).

    .venv/bin/python -m harness.stream_build --config config.yaml          # write everything
    .venv/bin/python -m harness.stream_build --config config.yaml --check  # verify, write nothing
    ... --no-density                                                        # skip the pairwise metric
    ... --jobs 8                                                            # density in parallel

Writes checkpoints.yaml (the requests, types, `mutates:`), one own spec per checkpoint under
acceptance/specs/ (its story test plus the generated scenarios), for each mutative checkpoint N
the ripple copies acceptance/specs/cpNN/ of every prior whose rendered spec changes at N, and
acceptance/DENSITY.md, the interaction density of the rules per checkpoint. Nothing is
hand-edited: a spec is a script run through the model at a checkpoint, rendered as Playwright
steps whose every expected value the model computed.

DENSITY (the pressure metric, independent of any app): two rules interact at a checkpoint when
some asserted value of that checkpoint's own spec depends on both, that is, switching both off
is not predicted by switching each off alone (both move it; or one moves it and the other
changes how). The report gives, per checkpoint, the rules in force, the interacting pairs over
the possible pairs (on screen cells and on audit lines), and for each rule the checkpoint
introduces how many earlier rules it interacts with; from MIN_DEGREE_FROM on, a new rule that
interacts with fewer than MIN_DEGREE earlier rules fails the build.

Checks (both modes; --check also refuses to write):
  - an ADDITIVE checkpoint changes no prior spec (else it is a mutation in disguise);
  - a MUTATIVE checkpoint changes at least one prior spec, and `mutates:` is derived from exactly
    the priors it changes;
  - ABLATION: every rule a checkpoint introduces bites in that checkpoint's own spec and in every
    copy it ships — rendering with the rule switched off (hell.Model(off=...)) must change the
    spec. A test that an app ignoring the rule would still pass is a defect;
  - STALE FILES: acceptance/specs may hold only what this build writes; anything else is listed
    with the command that removes it, and the build stops;
  - DEGREE: see DENSITY above.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys

import yaml

from functools import lru_cache
from itertools import combinations
from multiprocessing import Pool

from .oracle import hell, hell_gen
from .oracle.hell import COVERAGE, REQUESTS, RULES, SLUG, TYPE, Model, Refused
from .oracle.hell_scripts import SCRIPTS

MIN_DEGREE, MIN_DEGREE_FROM = 2, 17     # a new rule must cross >= 2 earlier ones from cp17 on

ROLLUP_SINCE = {"rollup-claimed-total": 5, "rollup-due-total": 7,
                "rollup-overdue-count": 25, "rollup-overdue-total": 25}
PERIOD_SINCE = {"period-due-total": 17, "period-closed": 18}
HEADER_SINCE = 41
PERSON_PERIOD_SINCE = 47
SHEET_SINCE = {"sheet-archived": 62, "sheet-asof": 74}


def summary_since(key: str) -> int:
    return 67 if key.endswith("-active") else 31


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


class HiddenRow(KeyError):
    """A step acts on a retired person's row while that user's screen hides retired people: a
    story must show them first; a generated scenario drops the step (under ablation a refused
    retirement may go through, hiding a row the scenario then reaches for)."""


class Renderer:
    """Runs one script through the model at k and emits the Playwright lines."""

    def __init__(self, n: int, k: int, off=()):
        self.n, self.k = n, k
        self.m = Model(k, sheet=SHEET_TOKEN, off=off)
        self.lines: list[str] = []
        self.pages: dict[str, str] = {}
        self.raced: dict[str, list[str]] = {}   # claim var -> the numbers a concurrent open may give it
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
        for name in hell_gen.row_targets(st):
            p = self.m.people.get(hell.norm_name(name))
            if p is not None and not self.m.visible(p):
                raise HiddenRow(f"step {st!r} acts on {name}'s row while retired people are hidden "
                                f"from {self.m.user}; show them first")
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
        if self.attempt(self.m.set_today, d):
            self.emit(f"await ui.setToday({self.pg}, {ts(d)});")
        else:
            self.expect_ok(f"ui.setTodayTry({self.pg}, {ts(d)})", False)

    def s_statement(self, name: str, asof: str | None = None) -> None:
        assert self.k >= hell.SINCE["statement"], "statement is only rendered from cp15"
        if asof and self.m.has("statement_asof"):
            ok = self.attempt(self.m.statement, name, asof)
            self.expect_ok(f"ui.statementAsOf({self.pg}, {self.pvar(name)}, {ts(asof)})", ok)
            return
        ok = self.attempt(self.m.statement, name)
        self.expect_ok(f"ui.statement({self.pg}, {self.pvar(name)})", ok)

    def s_unstate(self, name: str) -> None:
        ok = self.attempt(self.m.unstate, name)
        self.expect_ok(f"ui.unstate({self.pg}, {self.pvar(name)})", ok)

    def s_person(self, name: str, grade: str, grade_from: str | None = None, terms=None) -> None:
        fields = {"name": name, "grade": grade}
        if grade_from and self.m.has("grade_dated"):
            fields["gradeFrom"] = grade_from
        if terms is not None and self.m.has("person_terms"):
            fields["terms"] = str(terms)
        call = f"ui.addPerson({self.pg}, {ts(fields)})"
        try:
            p = self.m.add_person(name, grade, grade_from, terms=terms)
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
                if self.m.has("grade_dated"):
                    out["gradeFrom"] = val
            elif key == "terms":
                if self.m.has("person_terms"):
                    out["terms"] = str(val)
            else:
                out[key] = val
        return out

    def _save(self, fields: dict) -> tuple[bool, str]:
        """Save the open editor in the model: went through?, and the extra helper argument naming the
        grade the row then shows when that is not the grade entered (a grade dated from another day)."""
        try:
            p = self.m.edit_save(fields)
        except Refused:
            self.m.editing.pop(self.m.user, None)
            return False, ""
        shows = ""
        if fields.get("grade") is not None and self.m.grade_now(p) != fields["grade"]:
            shows = f", {ts(self.m.grade_now(p))}"
        return True, shows

    def s_edit_save(self, fields: dict) -> None:
        ok, shows = self._save(fields)
        self.expect_ok(f"ui.editSave({self.pg}, {ts(self._fields(fields))}{shows})", ok)

    def s_edit(self, name: str, fields: dict) -> None:
        pv = self.pvar(name)
        self.m.edit_open(name)
        ok, shows = self._save(fields)
        self.expect_ok(f"ui.editPerson({self.pg}, {pv}, {ts(self._fields(fields))}{shows})", ok)

    def s_bulk_grade(self, names: list, grade: str, start: str | None = None) -> None:
        pvs = [self.pvar(n) for n in names]
        done = self.m.bulk_grade(names, grade, start)
        f = {"grade": grade}
        if start:
            f["from"] = start
        self.emit(f"expect(await ui.bulkGrade({self.pg}, [{', '.join(pvs)}], {ts(f)})).toBe({done});")

    def _claim_fields(self, amount, when, note, corrects) -> dict:
        f = {"amount": amount}
        if when:
            f["date"] = when
        if note:
            f["note"] = note
        if corrects and self.m.has("correction"):
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
        call = f"ui.addClaimTwice({self.pg}, {pv}, {ts(self._claim_fields(amount, when, note, None))})"
        try:
            c = self.m.add_claim(name, amount, when, note, twice=True)
        except Refused:
            self.emit(f"expect(await {call}).toBeNull();")
            return
        c.var = self.var(f"c_{slugify(name)}_{c.idx}")
        n = len(self.m.person_claims(self.m.person(name)))
        self.emit(f"const {c.var} = ui.must(await {call});")
        self.emit(f"expect(await ui.claimCount({self.pg}, {pv})).toBe({n});")

    def s_paste(self, lines: list) -> None:
        text = "\n".join(lines)
        call = f"ui.pasteClaims({self.pg}, {ts(text)})"
        try:
            made = self.m.paste_claims(lines)
        except Refused:
            self.emit(f"expect(await {call}).toBeNull();")
            return
        self.emit(f"expect(await {call}).toBe({made});")
        for c in self.m.claims:
            if not c.var:
                c.var = self.var(f"c_{slugify(self.m.people[c.person].name)}_{c.idx}")
                self.emit(f"const {c.var} = await ui.claimAt({self.pg}, {self.m.people[c.person].var}, {c.idx});")

    def s_claim_edit(self, name, idx, fields) -> None:
        cv = self.cvar(name, idx)
        ok = self.attempt(self.m.edit_claim, name, idx, fields)
        self.expect_ok(f"ui.editClaim({self.pg}, {cv}, {ts(fields)})", ok)

    def s_claim_edit_open(self, name, idx) -> None:
        cv = self.cvar(name, idx)
        ok = self.attempt(self.m.claim_edit_open, name, idx)
        self.expect_ok(f"ui.claimEditOpen({self.pg}, {cv})", ok)

    def s_claim_edit_save(self, name, idx, fields) -> None:
        cv = self.cvar(name, idx)
        ok = self.attempt(self.m.edit_claim, name, idx, fields)
        if ok:
            self.m.locks.pop(self.m.claim(name, idx).seq, None)
        self.expect_ok(f"ui.claimEditSave({self.pg}, {cv}, {ts(fields)})", ok)

    def s_claim_edit_cancel(self, name, idx) -> None:
        cv = self.cvar(name, idx)
        self.m.claim_edit_cancel(name, idx)
        self.emit(f"await ui.claimEditCancel({self.pg}, {cv});")

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

    def s_resettle(self, name, idx):
        cv = self.cvar(name, idx)
        ok = self.attempt(self.m.resettle_claim, name, idx)
        self.expect_ok(f"ui.resettle({self.pg}, {cv})", ok)

    def s_defer(self, name, idx, until):
        cv = self.cvar(name, idx)
        ok = self.attempt(self.m.defer_claim, name, idx, until)
        self.expect_ok(f"ui.defer({self.pg}, {cv}, {ts(until)})", ok)

    def s_proof(self, name, idx):
        cv = self.cvar(name, idx)
        ok = self.attempt(self.m.add_proof, name, idx)
        self.expect_ok(f"ui.addProof({self.pg}, {cv})", ok)

    def s_redate(self, name, idx, new):
        cv = self.cvar(name, idx)
        ok = self.attempt(self.m.redate_claim, name, idx, new)
        self.expect_ok(f"ui.redate({self.pg}, {cv}, {ts(new)})", ok)

    def s_split(self, name, idx, amount):
        cv = self.cvar(name, idx)
        pv = self.pvar(name)
        call = f"ui.split({self.pg}, {pv}, {cv}, {ts(amount)})"
        try:
            c = self.m.split_claim(name, idx, amount)
        except Refused:
            self.emit(f"expect(await {call}).toBeNull();")
            return
        c.var = self.var(f"c_{slugify(name)}_{c.idx}")
        self.emit(f"const {c.var} = ui.must(await {call});")

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
        # Which of the two numbers each claim got is the server's race to decide: the set above is
        # the assertion, and each claim's own number cell accepts either.
        self.raced[c1] = self.raced[c2] = nums

    def s_rate(self, grade, pct, start=None, end=None) -> None:
        f = {"grade": grade, "pct": pct}
        if start and self.m.has("rate_dated"):
            f["from"] = start
        if end and self.m.has("rate_ended"):
            f["to"] = end
        ok = self.attempt(self.m.set_rate, grade, pct, start, end)
        self.expect_ok(f"ui.setRate({self.pg}, {ts(f)})", ok)

    def s_period(self, name, start, end) -> None:
        ok = self.attempt(self.m.add_period, name, start, end)
        self.expect_ok(f"ui.addPeriod({self.pg}, {ts({'name': name, 'from': start, 'to': end})})", ok)

    def s_generate_periods(self, start, end) -> None:
        call = f"ui.generatePeriods({self.pg}, {ts(start)}, {ts(end)})"
        try:
            made = self.m.generate_periods(start, end)
        except Refused:
            self.emit(f"expect(await {call}).toBeNull();")
            return
        self.emit(f"expect(await {call}).toBe({made});")

    def s_close(self, name) -> None:
        ok = self.attempt(self.m.close_period, name)
        self.expect_ok(f"ui.periodAction({self.pg}, {ts(name)}, \"close\")", ok)

    def s_soft_close(self, name) -> None:
        ok = self.attempt(self.m.soft_close_period, name)
        self.expect_ok(f"ui.periodAction({self.pg}, {ts(name)}, \"soft-close\")", ok)

    def s_reopen(self, name) -> None:
        ok = self.attempt(self.m.reopen_period, name)
        self.expect_ok(f"ui.periodAction({self.pg}, {ts(name)}, \"reopen\")", ok)

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
        ok = self.attempt(self.m.retire, name, when)
        self.expect_ok(f"ui.retire({self.pg}, {self.pvar(name)}, {ts(when)})", ok)

    def s_hold(self, name, start=None, end=None) -> None:
        ok = self.attempt(self.m.hold, name, start, end)
        f = {}
        if self.m.has("hold_interval"):
            if start:
                f["from"] = start
            if end:
                f["to"] = end
        self.expect_ok(f"ui.hold({self.pg}, {self.pvar(name)}, {ts(f)})", ok)

    def s_watch(self, name, on: bool) -> None:
        ok = self.attempt(self.m.watch, name, on)
        self.expect_ok(f"ui.watch({self.pg}, {self.pvar(name)}, {'true' if on else 'false'})", ok)

    def s_show_retired(self, on: bool) -> None:
        self.m.set_show_retired(on)
        self.emit(f"await ui.showRetired({self.pg}, {'true' if on else 'false'});")

    def s_role(self, user, role) -> None:
        ok = self.attempt(self.m.set_role, user, role)
        self.expect_ok(f"ui.setRole({self.pg}, {ts(user)}, {ts(role)})", ok)

    def s_delegate(self, user, start, end) -> None:
        ok = self.attempt(self.m.delegate, user, start, end)
        self.expect_ok(f"ui.delegate({self.pg}, {ts({'user': user, 'from': start, 'to': end})})", ok)

    def s_archive(self) -> None:
        ok = self.attempt(self.m.archive_sheet)
        self.expect_ok(f"ui.archive({self.pg})", ok)

    def s_asof(self, d: str) -> None:
        self.m.set_asof(d)
        self.emit(f"await ui.setAsOf({self.pg}, {ts(d)});")

    def s_asof_clear(self) -> None:
        self.m.set_asof(None)
        self.emit(f"await ui.clearAsOf({self.pg});")

    def s_setting(self, key, value, start=None) -> None:
        if start and self.m.has("settings_dated"):
            ok = self.attempt(self.m.set_setting, key, value, start)
            shows = self.m.setting(key) or ""
            self.expect_ok(f"ui.setSettingDated({self.pg}, {ts(key)}, {ts(value)}, {ts(start)}, {ts(shows)})", ok)
            return
        if self.attempt(self.m.set_setting, key, value):
            self.emit(f"await ui.setSetting({self.pg}, {ts(key)}, {ts(value)});")
        else:
            self.expect_ok(f"ui.setSettingTry({self.pg}, {ts(key)}, {ts(value)})", False)

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

    def s_bulk_settle(self, items) -> None:
        cvs = [self.cvar(n, i) for n, i in items]
        res = self.m.bulk_settle(items)
        done = sum(1 for r in res if r)
        self.emit(f"expect(await ui.bulkSettle({self.pg}, [{', '.join(cvs)}])).toEqual("
                  f"{{ settled: {done}, refused: {len(res) - done} }});")

    def s_export(self) -> None:
        self.emit(f"expect(await ui.exportCsv({self.pg})).toBe({ts(self.m.export_csv())});")

    def s_hidden(self, name) -> None:
        self.emit(f"await expect({self.pg}.getByTestId(\"person-row-\" + {self.pvar(name)})).toHaveCount(0);")

    def s_check(self, spec: dict) -> None:
        pg = self.pg
        v = self.m.view()
        if not (self.lines and self.lines[-1].strip() == f"await ui.refresh({pg});"):
            self.emit(f"await ui.refresh({pg});")
        if spec.get("header"):
            self.emit(f"await expect({pg}.getByTestId(\"current-user\")).toHaveText({ts(v['user'])});")
            self.emit(f"await expect({pg}.getByTestId(\"sheet-current-id\")).toHaveText(sheet);")
        if spec.get("today") and self.n >= 2:
            self.emit(f"await expect({pg}.getByTestId(\"sheet-today\")).toHaveText({ts(v['today'])});")
        if spec.get("sheet"):
            for tid, val in v["sheet_cells"].items():
                if SHEET_SINCE[tid] <= self.n:
                    self.emit(f"await expect({pg}.getByTestId({ts(tid)})).toHaveText({ts(val)});")
        for key, row in v["people"].items():
            pv = row["var"]
            if not pv:
                continue
            rv = f"{pg}.getByTestId(\"person-row-\" + {pv})"
            if not row["visible"]:
                if spec.get("people") or spec.get("claims"):
                    self.emit(f"await expect({rv}).toHaveCount(0);")
                continue
            for cell in spec.get("people") or []:
                tid = f"person-{cell}"
                if tid in row["cells"]:
                    self.emit(f"await expect({rv}.getByTestId({ts(tid)})).toHaveText({ts(row['cells'][tid])});")
            if spec.get("person_periods") and self.n >= PERSON_PERIOD_SINCE:
                for name, val in row["periods"].items():
                    tid = f"person-period-{name}-due-total"
                    self.emit(f"await expect({rv}.getByTestId({ts(tid)})).toHaveText({ts(val)});")
            for cvar, cells in row["claims"]:
                if not cvar:
                    continue
                cv = f"{pg}.getByTestId(\"claim-row-\" + {cvar})"
                for cell in spec.get("claims") or []:
                    tid = f"claim-{cell}"
                    if tid not in cells:
                        continue
                    val = cells[tid]
                    if isinstance(val, list):
                        self.emit(f"await expect({cv}.getByTestId({ts(tid + '-line')})).toHaveText({ts(val)});")
                    elif tid == "claim-number" and cvar in self.raced and val in self.raced[cvar]:
                        self.emit(f"await expect({cv}.getByTestId({ts(tid)})).toHaveText(/^({'|'.join(self.raced[cvar])})$/);")
                    else:
                        self.emit(f"await expect({cv}.getByTestId({ts(tid)})).toHaveText({ts(val)});")
        if spec.get("rollups"):
            for tid, val in v["rollups"].items():
                if ROLLUP_SINCE[tid] > self.n:
                    continue
                self.emit(f"await expect({pg}.getByTestId({ts(tid)})).toHaveText({ts(val)});")
        if spec.get("counters") and self.n >= HEADER_SINCE:
            for tid, val in v["header"].items():
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
                if summary_since(tid) > self.n:
                    continue
                self.emit(f"await expect({pg}.getByTestId({ts(tid)})).toHaveText({ts(val)});")
        if spec.get("audit") and self.n >= 6:
            body = ",\n      ".join(tpl(line) for line in self.m.audit_text(self.n))
            self.emit(f"ui.expectAudit(sheet, [\n      {body}\n    ]);")


def render_test(n: int, k: int, script: list, off=(), lenient: bool = False) -> list[str] | None:
    """The body lines of one test: a script run through the model at k. A story script that
    refers to a row the app never created is a defect (None under ablation, an error otherwise);
    a generated scenario drops that step instead, since a later rule may refuse an earlier
    creation and the scenario must still be valid at every later checkpoint."""
    r = Renderer(n, k, off)
    for st in script:
        try:
            r.step(st)
        except (KeyError, StopIteration) as e:
            if lenient:
                continue
            if off:
                return None
            if isinstance(e, HiddenRow):
                raise RuntimeError(f"cp{n:02d} script at k={k}: {e.args[0]}")
            raise RuntimeError(f"cp{n:02d} script at k={k}: step {st!r} refers to a missing row ({e!r})")
    return r.lines


@lru_cache(maxsize=None)
def render_tests(n: int, k: int, off: frozenset = frozenset()) -> tuple:
    """(title, lines) per test of checkpoint n's spec at k: the story, then the generated ones."""
    title = SLUG[n].replace("-", " ")
    out = [(title, render_test(n, k, SCRIPTS[n](k), off))]
    for i, script in enumerate(hell_gen.scenarios(n), 1):
        out.append((f"{title} scenario {i}", render_test(n, k, script, off, lenient=True)))
    return tuple((t, None if body is None else tuple(body)) for t, body in out)


def render(n: int, k: int, off=()) -> str:
    """The spec file of checkpoint n rendered at checkpoint k."""
    tests = render_tests(n, k, frozenset(off))
    title = SLUG[n].replace("-", " ")
    lines = ["import { test, expect } from '@playwright/test';",
             "import * as ui from '../support/ui';",
             "",
             "test.setTimeout(240_000);",
             f"test.describe({ts(title)}, () => {{"]
    for t, body in tests:
        if body is None:
            return f"ABLATED {sorted(off)} breaks the story of cp{n:02d}"
        lines.append(f"  test({ts(t)}, {{ tag: '@functionality' }}, async ({{ browser }}) => {{")
        lines.append("    const sheet = ui.sheetId();")
        lines.extend(body)
        lines.append("  });")
    lines += ["});", ""]
    return "\n".join(lines)


# ---- density: which rules a checkpoint's own spec makes depend on each other ------------------

_VALUE = re.compile(r"^(?P<key>.*?)\.(?:toHaveText|toBe|toEqual|toHaveCount)\((?P<val>.*)\);$")


def cells(tests: tuple) -> dict:
    """{cell key: value} over a spec's tests: every asserted locator or call and its expected
    value (an occurrence counter keeps repeated reads apart), plus each audit line by its text."""
    out: dict = {}
    seen: dict = {}
    for ti, (title, body) in enumerate(tests):
        if body is None:
            continue
        in_audit = False
        for line in (ln for chunk in body for ln in chunk.split("\n")):
            line = line.strip()
            if in_audit:
                if line.startswith("]);"):
                    in_audit = False
                    continue
                key = f"{ti}:audit:{line.rstrip(',')}"
                seen[key] = seen.get(key, 0) + 1
                out[f"{key}#{seen[key]}"] = "present"
                continue
            if line.startswith("ui.expectAudit("):
                in_audit = True
                continue
            m = _VALUE.match(line)
            if m:
                key, val = f"{ti}:{m.group('key')}", m.group("val")
            elif line.startswith("const ") and "ui.must(" in line:
                key, val = f"{ti}:{line.split('= ui.must(', 1)[1].rstrip(');')}", "created"
            else:
                continue
            seen[key] = seen.get(key, 0) + 1
            out[f"{key}#{seen[key]}"] = val
    return out


def _cells_off(n: int, off: frozenset) -> dict:
    return cells(render_tests(n, n, off))


def interacts(n: int, a: str, b: str, base: dict, only_a: dict, only_b: dict) -> tuple[bool, bool]:
    """Whether a and b interact in cp n's own spec, on screen cells and on audit lines: a value
    both move alone, or one moves alone and the other changes how, or neither moves alone but
    both together do."""
    both = _cells_off(n, frozenset((a, b)))
    screen = audit = False
    for key in set(base) | set(only_a) | set(only_b) | set(both):
        v0, va, vb, vab = base.get(key), only_a.get(key), only_b.get(key), both.get(key)
        a_moves, b_moves = va != v0, vb != v0
        hit = (a_moves and b_moves) or (a_moves and vab != va) or (b_moves and vab != vb) \
            or (not a_moves and not b_moves and vab != v0)
        if hit:
            if ":audit:" in key:
                audit = True
            else:
                screen = True
            if screen and audit:
                break
    return screen, audit


def density(n: int) -> dict:
    """The interaction report of checkpoint n's own spec."""
    rules = [r for r, since in RULES.items() if since <= n]
    base = _cells_off(n, frozenset())
    singles = {r: _cells_off(n, frozenset((r,))) for r in rules}
    biting = [r for r in rules if singles[r] != base]
    pairs_screen, pairs_audit = [], []
    for a, b in combinations(rules, 2):
        sc, au = interacts(n, a, b, base, singles[a], singles[b])
        if sc:
            pairs_screen.append((a, b))
        if au:
            pairs_audit.append((a, b))
    new = [r for r in rules if RULES[r] == n]
    partners = {}
    for r in new:
        partners[r] = sorted({x for pair in pairs_screen + pairs_audit for x in pair
                              if r in pair and x != r and RULES[x] < n})
    possible = len(rules) * (len(rules) - 1) // 2
    return {"n": n, "rules": rules, "biting": biting, "screen": pairs_screen, "audit": pairs_audit,
            "possible": possible, "new": new, "partners": partners}


def density_md(reports: list[dict]) -> str:
    out = ["# Interaction density of the stream (GENERATED by harness.stream_build; do not edit)",
           "",
           "Two rules interact at a checkpoint when a value asserted by that checkpoint's own spec",
           "depends on both (see harness/stream_build.py). `pairs` counts interacting pairs among the",
           "rules in force, on screen cells and on audit lines; `density` is screen pairs over possible",
           "pairs; `degree` is how many earlier rules each rule introduced here interacts with.",
           "",
           "| cp | type | in force | biting | screen pairs | audit pairs | possible | density | new rule: degree (partners) |",
           "|---|---|---|---|---|---|---|---|---|"]
    for r in reports:
        n = r["n"]
        newcol = "; ".join(f"{k}: {len(v)} ({', '.join(v)})" for k, v in r["partners"].items()) or ""
        dens = f"{len(r['screen']) / r['possible']:.2f}" if r["possible"] else ""
        out.append(f"| {n} | {TYPE[n][0].upper()} | {len(r['rules'])} | {len(r['biting'])} | {len(r['screen'])} | "
                   f"{len(r['audit'])} | {r['possible']} | {dens} | {newcol} |")
    return "\n".join(out) + "\n"


def own_path(n: int) -> str:
    return f"acceptance/specs/cp{n:02d}_{SLUG[n]}.spec.ts"


def copy_path(n: int, prior: int) -> str:
    return f"acceptance/specs/cp{n:02d}/cp{prior:02d}_{SLUG[prior]}.spec.ts"


def build(check_only: bool, with_density: bool = True, jobs: int = 1) -> int:
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

    # ablation: every rule a checkpoint introduces must bite in its own spec, and every copy it
    # ships must exercise at least one of them (a checkpoint with two rules may change a prior
    # through either)
    for n in range(lo, hi + 1):
        rules = [r for r, since in RULES.items() if since == n]
        for r in rules:
            if render(n, n, off={r}) == files[own_path(n)]:
                problems.append(f"cp{n:02d} own spec does not exercise its rule {r!r}")
        for prior in derived.get(n, []):
            if rules and all(render(prior, n, off={r}) == files[copy_path(n, prior)] for r in rules):
                problems.append(f"cp{n:02d} copy of cp{prior:02d} exercises none of {rules}")
    # informative: which in-force rules each own spec leaves unexercised
    quiet = {}
    for n in range(lo, hi + 1):
        idle = [r for r, since in RULES.items() if since <= n and render(n, n, off={r}) == files[own_path(n)]]
        if idle:
            quiet[n] = idle

    # density: the pressure each checkpoint puts on the rules already in force
    reports = []
    if with_density:
        ns = list(range(lo, hi + 1))
        if jobs > 1:
            with Pool(jobs) as pool:
                reports = pool.map(density, ns, chunksize=1)
        else:
            reports = [density(n) for n in ns]
        for rep in reports:
            n = rep["n"]
            if n >= MIN_DEGREE_FROM:
                for r, partners in rep["partners"].items():
                    if len(partners) < MIN_DEGREE:
                        problems.append(f"cp{n:02d} rule {r!r} interacts with only {len(partners)} earlier "
                                        f"rule(s) ({', '.join(partners) or 'none'}); {MIN_DEGREE} needed")
            print(f"  cp{n:02d} density: {len(rep['screen'])}/{rep['possible']} screen pairs, "
                  f"{len(rep['audit'])} audit pairs, biting {len(rep['biting'])}/{len(rep['rules'])}"
                  + "".join(f"; {r} crosses {len(ps)}" for r, ps in rep["partners"].items()), flush=True)

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
    if reports:
        with open(os.path.join(HARNESS_ROOT, "acceptance", "DENSITY.md"), "w") as fh:
            fh.write(density_md(reports))
    print(f"wrote {len(files)} specs, checkpoints.yaml" + (" and acceptance/DENSITY.md" if reports else ""))
    return 0


def checkpoints_yaml(derived: dict[int, list[int]]) -> str:
    lo, hi = COVERAGE
    out = ["# GENERATED by harness.stream_build from the reference model harness/oracle/hell.py and the",
           "# scripts in harness/oracle/hell_scripts.py: edit those, then rebuild. Never hand-edit.",
           f"# cp{lo:02d}-cp{hi:02d}, cadence 3:1 (mutative when n % 4 == 0); each spec: a story test plus",
           "# the generated scenarios of harness/oracle/hell_gen.py.",
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
    ap.add_argument("--no-density", action="store_true", help="skip the pairwise interaction metric")
    ap.add_argument("--jobs", type=int, default=max(1, (os.cpu_count() or 2) - 1),
                    help="processes for the density metric")
    args = ap.parse_args(argv)
    cfg = yaml.safe_load(open(os.path.join(HARNESS_ROOT, args.config))) or {}
    if cfg.get("checkpoints_file", "checkpoints.yaml") != "checkpoints.yaml":
        print("error: this builder writes checkpoints.yaml", file=sys.stderr)
        return 2
    return build(args.check, with_density=not args.no_density, jobs=args.jobs)


if __name__ == "__main__":
    sys.exit(main())

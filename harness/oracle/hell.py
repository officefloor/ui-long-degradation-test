"""Reference model of the Act I stream (cp1-40): the sheet, its users, people, claims and figures.

Everything the agent and the gate see is generated from this module by `harness.stream_build`: the
requests in checkpoints.yaml (REQUESTS below, beside the code that defines each rule), every spec
(from the scripts in harness/oracle/hell_scripts.py) and every ripple copy. Edit the model or a
script, then rebuild; never hand-edit a spec.

The model is a stateful simulator of what a test does through the screens, at checkpoint `k`: each
script step is applied with `Model.step(...)` and the figures are read back with `Model.view()`.
A rule is active when `k >= RULES[name]` and the name is not in `off` (ablation: an app that
ignored that rule; `harness.stream_build --check` requires every rule a spec needs to bite).

Figures (two decimals, dot, no grouping; `n/a` when undefined):
  claim due            amount x rate(grade in force on the claim date, rate in force on it) / 100,
                       rounded half up (cp7), half even (cp12), by the policy date (cp32); frozen
                       at settle (cp10); at least the floor (cp24); plus the late charge (cp26);
                       corrections take only the rate step (cp30)
  claimed / due-total  over the claims that COUNT: every claim (cp5), OPEN+SETTLED (cp8, PENDING
                       counts as open cp36), minus a held person's open claims (cp22) or those dated
                       inside the hold (cp40). Person due-total is the rounded total amount x rate
                       (cp7) until cp12 makes it the sum of the rounded claim figures.
"""
from __future__ import annotations

import csv
import io
from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import ROUND_HALF_EVEN, ROUND_HALF_UP, Decimal

COVERAGE = (1, 40)
GRADES = ("A", "B", "C")
STATUSES = ("DRAFT", "OPEN", "PENDING", "SETTLED", "VOID")

# Rule name -> first checkpoint it is in force. Each is ablatable.
RULES = {
    "names": 4,          # unique, trimmed, case-insensitive names
    "status": 8,         # only OPEN/SETTLED claims count
    "number": 9,         # gapless numbering on open
    "freeze": 10,        # settle freezes due
    "rate_dated": 11,    # a rate applies from its from-date
    "half_even": 12,     # live figures round half to even; totals sum rounded figures
    "four_eyes": 13,     # the opener cannot settle
    "conflict": 14,      # a stale edit is refused; a double submit stores once
    "import_atomic": 15, # an import with any error imports nothing
    "upsert": 16,        # an import line matching a name updates it
    "period": 17,        # a claim belongs to the period containing its date
    "closed": 18,        # a closed period refuses changes and keeps its total
    "immutable": 20,     # an OPEN claim cannot be edited; a void keeps its number
    "retire": 21,        # no claims dated after retirement
    "hold": 22,          # a held person's open claims leave every live total
    "clerk_limit": 23,   # a clerk settles only up to the limit
    "floor": 24,         # live due is at least the floor
    "overdue": 25,       # due-by and overdue
    "late": 26,          # late charge per full 30 days
    "backing": 27,       # patrons and backing
    "grade_dated": 28,   # a claim uses the grade in force on its date
    "steward_reopen": 29,
    "correction": 30,
    "policy_date": 32,   # before the policy date round half up
    "period_number": 35, # per-period numbering from a date
    "pending": 36,       # over the limit goes to PENDING
    "terms_fixed": 38,   # due-by fixed at creation from the grade's terms
    "hold_interval": 40, # hold has from/to; only claims dated inside leave totals
}

DEFAULT_FLOOR = Decimal("1.00")
DEFAULT_TERMS = 14


class Refused(Exception):
    """The screen refuses the action; `anchor` is the error element that shows."""

    def __init__(self, anchor: str):
        super().__init__(anchor)
        self.anchor = anchor


def D(x) -> Decimal:
    return x if isinstance(x, Decimal) else Decimal(str(x))


def money(x: Decimal) -> str:
    return f"{x.quantize(Decimal('0.01')):.2f}"


def day(s: str) -> date:
    return date.fromisoformat(s)


def norm_name(name: str) -> str:
    return name.strip().casefold()


@dataclass
class Person:
    name: str
    grades: list = field(default_factory=list)       # [(from_date|None, grade)] in insertion order
    version: int = 0
    retired_from: date | None = None
    holds: list = field(default_factory=list)        # [(from, to|None)]; cp22 uses (None, None)
    patrons: list = field(default_factory=list)      # person keys
    order: int = 0
    var: str = ""                                    # TS variable the renderer gives the row id


@dataclass
class Claim:
    person: str                                      # person key (norm name at creation)
    amount: Decimal
    date: date
    note: str
    status: str = "DRAFT"
    number: str | None = None
    opened_by: str | None = None
    frozen: Decimal | None = None
    due_by: date | None = None                       # fixed at creation (cp38)
    corrects: str | None = None                      # target claim number (cp30)
    history: list = field(default_factory=list)      # [(status, user, date, due_text)]
    idx: int = 0                                     # index within the person's claims
    var: str = ""


@dataclass
class Period:
    name: str
    start: date
    end: date
    closed: bool = False
    frozen_total: str | None = None


class Model:
    def __init__(self, k: int, sheet: str = "S", off=()):
        self.k, self.sheet, self.off = k, sheet, set(off)
        self.user: str | None = None
        self.today: date = date(2026, 1, 1)
        self.people: dict[str, Person] = {}
        self.claims: list[Claim] = []
        self.rates: list[tuple[str, date | None, Decimal]] = []
        self.periods: dict[str, Period] = {}
        self.roles: dict[str, str] = {}
        self.settings: dict = {}
        self.counter = 0
        self.period_counters: dict[str, int] = {}
        self.audit: list[str] = []
        self.show_retired = False
        self.editing: dict[str, tuple[str, int]] = {}    # user -> (person key, version seen)
        self.claim_editing: dict[str, tuple[int, bool]] = {}

    # ---- rules -----------------------------------------------------------------------------
    def on(self, rule: str) -> bool:
        return self.k >= RULES[rule] and rule not in self.off

    def audit_line(self, event: str, *fields) -> None:
        """Record an audit line: `fields` are (key, value, since) triples, `since` being the
        checkpoint that added that field. The renderer keeps the fields a spec's checkpoint knows,
        and the spec matches a line by prefix, so a later field extends a line without changing it."""
        if self.k < 6:
            return
        self.audit.append((event, self.user, [(a, str(b), s) for a, b, s in fields if s <= self.k]))

    def role(self, user: str | None = None) -> str:
        return self.roles.get(user or self.user, "clerk") if self.k >= 23 else "clerk"

    def setting(self, key: str, default=None):
        return self.settings.get(key, default)

    # ---- people ---------------------------------------------------------------------------
    def person(self, name: str) -> Person:
        p = self.people.get(norm_name(name))
        if p is None:
            raise KeyError(name)
        return p

    def _name_rules(self, name: str, exclude: str | None = None) -> str:
        if self.on("names"):
            name = name.strip()
        if not name.strip():
            raise Refused("person-form-error")
        if self.on("names"):
            key = norm_name(name)
            if key in self.people and key != exclude:
                raise Refused("person-form-error")
        return name

    def add_person(self, name: str, grade: str, grade_from: str | None = None,
                   anchor: str = "person-form-error", audit: bool = True) -> Person:
        try:
            name = self._name_rules(name)
        except Refused:
            raise Refused(anchor)
        if grade not in GRADES:
            raise Refused(anchor)
        key = norm_name(name)
        if key in self.people and not self.on("names"):
            key = f"{key}#{len(self.people)}"
        # the first grade applies from the beginning of time (cp28), whatever the form's from-date
        p = Person(name=name, grades=[(None, grade)], order=len(self.people))
        self.people[key] = p
        if audit:
            self.audit_line("PERSON_ADDED", ("name", name, 6), ("grade", grade, 6))
        return p

    def edit_open(self, name: str) -> None:
        p = self.person(name)
        self.editing[self.user] = (self._key(p), p.version)

    def _key(self, p: Person) -> str:
        return next(k for k, v in self.people.items() if v is p)

    def edit_save(self, fields: dict) -> Person:
        key, seen = self.editing.pop(self.user)
        p = self.people[key]
        if self.on("conflict") and p.version != seen:
            raise Refused("person-form-error")
        name = fields.get("name", p.name)
        name = self._name_rules(name, exclude=key)
        grade = fields.get("grade")
        if grade is not None:
            if grade not in GRADES:
                raise Refused("person-form-error")
            if self.on("grade_dated"):
                start = day(fields["grade_from"]) if fields.get("grade_from") else self.today
                p.grades = [(s, g) for s, g in p.grades if s != start] + [(start, grade)]
            else:
                p.grades = [(None, grade)]
        p.name = name
        if key != norm_name(name) and norm_name(name) not in self.people:
            self.people[norm_name(name)] = self.people.pop(key)
            for c in self.claims:
                if c.person == key:
                    c.person = norm_name(name)
        p.version += 1
        self.audit_line("PERSON_EDITED", ("name", name, 6), ("grade", self.grade_now(p), 6))
        return p

    def grade_at(self, p: Person, when: date) -> str:
        if not self.on("grade_dated"):
            return p.grades[-1][1]
        dated = sorted(((s or date.min), g) for s, g in p.grades)
        inforce = [g for s, g in dated if s <= when]
        return inforce[-1] if inforce else dated[0][1]

    def grade_now(self, p: Person) -> str:
        return self.grade_at(p, self.today)

    def retire(self, name: str, when: str) -> None:
        p = self.person(name)
        p.retired_from = day(when)
        self.audit_line("PERSON_RETIRED", ("name", p.name, 21), ("from", when, 21))

    def hold(self, name: str, start: str | None = None, end: str | None = None) -> None:
        p = self.person(name)
        if self.on("hold_interval"):
            p.holds.append((day(start) if start else self.today, day(end) if end else None))
            self.audit_line("PERSON_HELD", ("name", p.name, 22), ("from", start or self.today.isoformat(), 40))
        elif p.holds:
            p.holds = []
            self.audit_line("PERSON_RELEASED", ("name", p.name, 22))
        else:
            p.holds = [(None, None)]
            self.audit_line("PERSON_HELD", ("name", p.name, 22))

    def held_claim(self, c: Claim) -> bool:
        """A claim a hold keeps out of every live total."""
        if not self.on("hold"):
            return False
        p = self.people[c.person]
        if not p.holds or c.status not in ("OPEN", "PENDING"):
            return False
        if not self.on("hold_interval"):
            return True
        return any(s <= c.date and (e is None or c.date <= e) for s, e in p.holds)

    def add_patron(self, name: str, patron: str) -> None:
        p, q = self.person(name), self.person(patron)
        if not self.on("backing") or p is q or self._key(q) in p.patrons:
            raise Refused("person-patron-error")
        p.patrons.append(self._key(q))
        self.audit_line("PATRON_ADDED", ("name", p.name, 27), ("patron", q.name, 27))

    # ---- rates, periods, settings, roles --------------------------------------------------
    def set_rate(self, grade: str, pct: str, start: str | None = None) -> None:
        if grade not in GRADES:
            raise Refused("rate-form-error")
        try:
            val = D(pct)
        except Exception:
            raise Refused("rate-form-error")
        if val < 0 or val != val.quantize(Decimal("0.01")):
            raise Refused("rate-form-error")
        s = day(start) if (start and self.k >= 11) else None
        self.rates = [r for r in self.rates if not (r[0] == grade and r[1] == s)]
        self.rates.append((grade, s, val))
        self.audit_line("RATE_SET", ("grade", grade, 7), ("rate", money(val), 7),
                        *([("from", start, 11)] if start and self.k >= 11 else []))

    def rate_at(self, grade: str, when: date) -> Decimal | None:
        rows = [r for r in self.rates if r[0] == grade]
        if not self.on("rate_dated"):
            rows = [r for r in rows if r[1] is None] or rows
            return rows[-1][2] if rows else None
        rows = [r for r in rows if r[1] is None or r[1] <= when]
        if not rows:
            return None
        rows.sort(key=lambda r: r[1] or date.min)
        return rows[-1][2]

    def add_period(self, name: str, start: str, end: str) -> None:
        s, e = day(start), day(end)
        if not name.strip() or name in self.periods or e < s:
            raise Refused("period-form-error")
        for p in self.periods.values():
            if s <= p.end and p.start <= e:
                raise Refused("period-form-error")
        self.periods[name] = Period(name, s, e)
        self.audit_line("PERIOD_ADDED", ("period", name, 17), ("from", start, 17), ("to", end, 17))

    def period_of(self, when: date) -> Period | None:
        if not self.on("period"):
            return None
        return next((p for p in self.periods.values() if p.start <= when <= p.end), None)

    def in_closed(self, when: date) -> bool:
        p = self.period_of(when)
        return bool(p and p.closed and self.on("closed"))

    def close_period(self, name: str) -> None:
        p = self.periods[name]
        if p.closed:
            raise Refused("period-error")
        p.closed = True
        p.frozen_total = self.period_total_text(p, live=True)
        self.audit_line("PERIOD_CLOSED", ("period", name, 18), ("total", p.frozen_total, 18))

    def reopen_period(self, name: str) -> None:
        p = self.periods[name]
        if not p.closed or (self.on("steward_reopen") and self.role() != "steward"):
            raise Refused("period-error")
        p.closed, p.frozen_total = False, None
        self.audit_line("PERIOD_REOPENED", ("period", name, 29))

    def set_setting(self, key: str, value: str) -> None:
        self.settings[key] = value
        self.audit_line("SETTING_CHANGED", ("key", key, 23), ("value", value, 23))

    def set_role(self, user: str, role: str) -> None:
        if role not in ("clerk", "steward"):
            raise Refused("role-form-error")
        self.roles[user] = role
        self.audit_line("ROLE_SET", ("user", user, 23), ("role", role, 23))

    # ---- claims ---------------------------------------------------------------------------
    def _amount(self, text: str, corrects: str | None) -> Decimal:
        try:
            a = D(text)
        except Exception:
            raise Refused("claim-form-error")
        if a != a.quantize(Decimal("0.01")):
            raise Refused("claim-form-error")
        if a < 0:
            if not (self.on("correction") and corrects):
                raise Refused("claim-form-error")
        return a

    def _claim_date(self, text: str | None) -> date:
        return day(text) if text else self.today

    def _claim_checks(self, p: Person, when: date, anchor: str) -> None:
        if self.on("retire") and p.retired_from and when > p.retired_from:
            raise Refused(anchor)
        if self.in_closed(when):
            raise Refused(anchor)

    def add_claim(self, name: str, amount: str, when: str | None = None, note: str = "",
                  corrects: str | None = None, anchor: str = "claim-form-error",
                  twice: bool = False) -> Claim:
        p = self.person(name)
        a = self._amount(amount, corrects)
        dt = self._claim_date(when)
        self._claim_checks(p, dt, anchor)
        target = None
        if corrects:
            target = next((c for c in self.claims if c.number == corrects and c.person == self._key(p)
                           and c.status == "SETTLED"), None)
            if target is None:
                raise Refused(anchor)
        c = Claim(person=self._key(p), amount=a, date=dt, note=note,
                  corrects=corrects if target else None,
                  idx=sum(1 for x in self.claims if x.person == self._key(p)))
        if self.on("overdue") and self.on("terms_fixed"):
            c.due_by = dt + timedelta(days=self.terms_for(p, dt))
        self.claims.append(c)
        c.history.append(("DRAFT", self.user, self.today, self.due_text(c)))
        self.audit_line("CLAIM_ADDED", *self._ident(c))
        if twice and not self.on("conflict"):
            c2 = Claim(person=c.person, amount=a, date=dt, note=note, idx=c.idx + 1)
            self.claims.append(c2)
            self.audit_line("CLAIM_ADDED", *self._ident(c2))
        return c

    def claim(self, name: str, idx: int) -> Claim:
        key = self._key(self.person(name))
        return next(c for c in self.claims if c.person == key and c.idx == idx)

    def edit_claim(self, name: str, idx: int, fields: dict) -> Claim:
        c = self.claim(name, idx)
        if self.on("immutable") and c.status != "DRAFT":
            raise Refused("claim-error")
        if c.status in ("SETTLED", "VOID"):
            raise Refused("claim-error")
        p = self.people[c.person]
        a = self._amount(fields.get("amount", money(c.amount)), c.corrects)
        dt = day(fields["date"]) if fields.get("date") else c.date
        if self.in_closed(c.date):
            raise Refused("claim-error")
        self._claim_checks(p, dt, "claim-form-error")
        c.amount, c.date, c.note = a, dt, fields.get("note", c.note)
        self.audit_line("CLAIM_EDITED", *self._ident(c))
        return c

    def _ident(self, c: Claim) -> list:
        """How an audit line names a claim: person, amount and date (cp6), then its number (cp9)."""
        p = self.people[c.person]
        out = [("person", p.name, 6), ("amount", money(c.amount), 6), ("date", c.date.isoformat(), 6)]
        if self.on("number") and c.number:
            out.append(("number", c.number, 9))
        return out

    def _next_number(self, c: Claim) -> str:
        start = self.setting("period-numbering-from")
        if self.on("period_number") and start and self.today >= day(start):
            per = self.period_of(c.date)
            key = per.name if per else "X"
            self.period_counters[key] = self.period_counters.get(key, 0) + 1
            return f"{key}-{self.period_counters[key]}"
        self.counter += 1
        return str(self.counter)

    def open_claim(self, name: str, idx: int) -> Claim:
        c = self.claim(name, idx)
        if c.status != "DRAFT" or self.in_closed(c.date):
            raise Refused("claim-error")
        if self.k < 8:
            raise Refused("claim-error")
        c.status = "OPEN"
        c.opened_by = self.user
        if self.on("number"):
            c.number = self._next_number(c)
        c.history.append(("OPEN", self.user, self.today, self.due_text(c)))
        self.audit_line("CLAIM_OPENED", *self._ident(c))
        return c

    def settle_claim(self, name: str, idx: int) -> Claim:
        c = self.claim(name, idx)
        if c.status != "OPEN" or self.in_closed(c.date):
            raise Refused("claim-error")
        if self.on("four_eyes") and c.opened_by == self.user:
            raise Refused("claim-error")
        limit = self.setting("clerk-limit")
        due = self.due(c)
        if self.on("clerk_limit") and limit and self.role() == "clerk" and due is not None \
                and due > D(limit):
            if self.on("pending"):
                c.status = "PENDING"
                c.history.append(("PENDING", self.user, self.today, self.due_text(c)))
                self.audit_line("CLAIM_PENDING", *self._ident(c))
                return c
            raise Refused("claim-error")
        return self._settle(c, "CLAIM_SETTLED")

    def _settle(self, c: Claim, event: str) -> Claim:
        due = self.due(c)
        c.status = "SETTLED"
        if self.on("freeze"):
            c.frozen = due
        c.history.append(("SETTLED", self.user, self.today, self.due_text(c)))
        extra = [("due", self.due_text(c), 10)] if self.k >= 10 else []
        self.audit_line(event, *self._ident(c), *extra)
        return c

    def approve_claim(self, name: str, idx: int) -> Claim:
        c = self.claim(name, idx)
        if c.status != "PENDING" or self.role() != "steward" or self.in_closed(c.date):
            raise Refused("claim-error")
        if self.on("four_eyes") and c.opened_by == self.user:
            raise Refused("claim-error")
        return self._settle(c, "CLAIM_APPROVED")

    def reject_claim(self, name: str, idx: int, reason: str) -> Claim:
        c = self.claim(name, idx)
        if c.status != "PENDING" or self.role() != "steward":
            raise Refused("claim-error")
        c.status = "OPEN"
        c.history.append(("OPEN", self.user, self.today, self.due_text(c)))
        self.audit_line("CLAIM_REJECTED", *self._ident(c), ("reason", reason, 36))
        return c

    def void_claim(self, name: str, idx: int) -> Claim:
        c = self.claim(name, idx)
        if c.status not in ("DRAFT", "OPEN", "PENDING") or self.in_closed(c.date):
            raise Refused("claim-error")
        c.status = "VOID"
        if self.on("number") and not self.on("immutable"):
            c.number = None
        c.history.append(("VOID", self.user, self.today, self.due_text(c)))
        self.audit_line("CLAIM_VOIDED", *self._ident(c))
        return c

    def reassign_claim(self, name: str, idx: int, to: str) -> Claim:
        c = self.claim(name, idx)
        q = self.person(to)
        if self.role() != "steward" or c.status not in ("DRAFT", "OPEN", "PENDING") \
                or self.in_closed(c.date):
            raise Refused("claim-error")
        self._claim_checks(q, c.date, "claim-error")
        old = self.people[c.person]
        c.person = self._key(q)
        c.idx = max([x.idx for x in self.claims if x.person == c.person and x is not c] + [-1]) + 1
        self.audit_line("CLAIM_REASSIGNED", *self._ident(c), ("from", old.name, 37), ("to", q.name, 37))
        return c

    def quick_add(self, name: str, amount: str) -> Claim:
        if norm_name(name) not in self.people:
            self.add_person(name, "A", anchor="quick-error")
        return self.add_claim(name, amount, anchor="quick-error")

    def bulk_open(self, items: list) -> list:
        out = []
        for name, idx in items:
            try:
                self.open_claim(name, idx)
                out.append(True)
            except Refused:
                out.append(False)
        return out

    # ---- import ---------------------------------------------------------------------------
    def import_people(self, text: str) -> dict:
        lines = [ln for ln in text.splitlines()]
        rows, errors, seen = [], [], set()
        for n, ln in enumerate(lines, 1):
            if not ln.strip():
                continue
            parts = [x.strip() for x in ln.split(",")]
            name = parts[0] if parts else ""
            grade = parts[1] if len(parts) > 1 else ""
            key = norm_name(name)
            bad = not name or grade not in GRADES or key in seen
            exists = key in self.people
            if bad or (exists and not self.on("upsert")):
                errors.append(n)
            seen.add(key)
            rows.append((name, grade, exists))
        if errors and self.on("import_atomic"):
            return {"added": 0, "updated": 0, "errors": errors}
        added = updated = 0
        for n, (name, grade, exists) in enumerate(rows, 1):
            if n in errors:
                continue
            if exists:
                p = self.people[norm_name(name)]
                self.editing[self.user] = (norm_name(name), p.version)
                self.edit_save({"grade": grade})
                updated += 1
            else:
                self.add_person(name, grade)
                added += 1
        return {"added": added, "updated": updated, "errors": errors}

    # ---- figures --------------------------------------------------------------------------
    def rounding(self, when: date):
        if self.on("policy_date"):
            policy = self.setting("policy-date")
            pd = day(policy) if policy else self.today
            return ROUND_HALF_UP if when < pd else ROUND_HALF_EVEN
        return ROUND_HALF_EVEN if self.on("half_even") else ROUND_HALF_UP

    def _round(self, x: Decimal, when: date) -> Decimal:
        return x.quantize(Decimal("0.01"), rounding=self.rounding(when))

    def terms_for(self, p: Person, when: date) -> int:
        if self.on("terms_fixed"):
            g = self.grade_at(p, when)
            t = self.setting(f"terms-{g}")
            if t:
                return int(t)
        t = self.setting("terms")
        return int(t) if t else DEFAULT_TERMS

    def due_by(self, c: Claim) -> date | None:
        if not self.on("overdue"):
            return None
        if c.due_by is not None and self.on("terms_fixed"):
            return c.due_by
        return c.date + timedelta(days=self.terms_for(self.people[c.person], c.date))

    def overdue(self, c: Claim) -> bool:
        db = self.due_by(c)
        return bool(db and c.status in ("OPEN", "PENDING") and db < self.today)

    def rate_due(self, c: Claim) -> Decimal | None:
        p = self.people[c.person]
        rate = self.rate_at(self.grade_at(p, c.date), c.date)
        if rate is None:
            return None
        return self._round(c.amount * rate / 100, c.date)

    def due(self, c: Claim) -> Decimal | None:
        if self.k < 7:
            return None
        if c.status == "SETTLED" and self.on("freeze") and c.frozen is not None:
            return c.frozen
        base = self.rate_due(c)
        if base is None:
            return None
        if c.corrects:
            return base
        if self.on("floor"):
            floor = D(self.setting("floor", DEFAULT_FLOOR))
            base = max(base, floor)
        if self.on("late") and self.overdue(c):
            pct = D(self.setting("late-pct", "0"))
            n30 = (self.today - self.due_by(c)).days // 30
            if pct and n30:
                base = base + self._round(base * pct / 100 * n30, c.date)
        return base

    def due_text(self, c: Claim) -> str:
        v = self.due(c)
        return "n/a" if v is None else money(v)

    def counts(self, c: Claim) -> bool:
        if self.on("status") and c.status not in ("OPEN", "SETTLED", "PENDING"):
            return False
        if self.k >= 8 and c.status == "PENDING" and not self.on("pending"):
            return False
        return not self.held_claim(c)

    def person_claims(self, p: Person) -> list[Claim]:
        key = self._key(p)
        return [c for c in self.claims if c.person == key]

    def claimed(self, p: Person) -> Decimal:
        return sum((c.amount for c in self.person_claims(p) if self.counts(c)), Decimal("0"))

    def due_total(self, p: Person) -> Decimal | None:
        cs = [c for c in self.person_claims(p) if self.counts(c)]
        if self.k < 7:
            return None
        if not self.on("half_even"):
            # cp7: the total amount times the rate, rounded once
            rate = self.rate_at(self.grade_now(p), self.today)
            if rate is None:
                return None if cs else Decimal("0")
            return self._round(sum((c.amount for c in cs), Decimal("0")) * rate / 100, self.today)
        vals = [v for v in (self.due(c) for c in cs) if v is not None]
        if not vals and self.rate_at(self.grade_now(p), self.today) is None:
            return None               # cp7's rule stands: no rate today and no figure to add
        return sum(vals, Decimal("0"))

    def sheet_claimed(self) -> Decimal:
        return sum((self.claimed(p) for p in self.people.values()), Decimal("0"))

    def sheet_due(self) -> Decimal:
        return sum((self.due_total(p) or Decimal("0") for p in self.people.values()), Decimal("0"))

    def overdue_claims(self, p: Person | None = None) -> list[Claim]:
        cs = self.person_claims(p) if p else self.claims
        return [c for c in cs if self.overdue(c) and self.counts(c)]

    def overdue_total(self, p: Person | None = None) -> Decimal:
        return sum((self.due(c) or Decimal("0") for c in self.overdue_claims(p)), Decimal("0"))

    def backing(self, p: Person) -> Decimal:
        total = Decimal("0")
        for key in p.patrons:
            v = self.due_total(self.people[key])
            if v is not None:
                total += v
        return total

    def period_total_text(self, per: Period, live: bool = False) -> str:
        if per.closed and per.frozen_total is not None and not live and self.on("closed"):
            return per.frozen_total
        total = sum((self.due(c) or Decimal("0") for c in self.claims
                     if self.counts(c) and per.start <= c.date <= per.end), Decimal("0"))
        return money(total)

    def visible(self, p: Person) -> bool:
        return not (self.on("retire") and p.retired_from and not self.show_retired)

    def claim_cells(self, c: Claim) -> dict:
        cells = {"claim-amount": money(c.amount), "claim-date": c.date.isoformat(),
                 "claim-note": c.note}
        if self.k >= 7:
            cells["claim-due"] = self.due_text(c)
        if self.k >= 8:
            cells["claim-status"] = c.status
        if self.k >= 9:
            cells["claim-number"] = c.number or ""
        if self.k >= 13:
            cells["claim-opened-by"] = c.opened_by or ""
        if self.k >= 17:
            per = self.period_of(c.date)
            cells["claim-period"] = per.name if per else ""
        if self.k >= 25 and self.due_by(c) is not None:
            cells["claim-due-by"] = self.due_by(c).isoformat()
            cells["claim-overdue"] = "yes" if self.overdue(c) else "no"
        if self.k >= 30:
            cells["claim-corrects"] = c.corrects or ""
        if self.k >= 39:
            cells["claim-log"] = [f"{s} by {u} on {d.isoformat()} due={v}" for s, u, d, v in c.history]
        return cells

    def person_cells(self, p: Person) -> dict:
        cells = {"person-name": p.name, "person-grade": self.grade_now(p)}
        if self.k >= 5:
            cells["person-claimed"] = money(self.claimed(p))
        if self.k >= 7:
            v = self.due_total(p)
            cells["person-due-total"] = "n/a" if v is None else money(v)
        if self.k >= 21:
            cells["person-retired"] = "yes" if p.retired_from else "no"
            cells["person-retired-from"] = p.retired_from.isoformat() if p.retired_from else ""
        if self.k >= 22:
            cells["person-hold"] = "yes" if p.holds else "no"
        if self.k >= 25:
            cells["person-overdue-count"] = str(len(self.overdue_claims(p)))
            cells["person-overdue-total"] = money(self.overdue_total(p))
        if self.on("backing"):
            cells["person-patrons"] = ", ".join(sorted(self.people[q].name for q in p.patrons))
            cells["person-backing"] = money(self.backing(p))
        return cells

    def rollups(self) -> dict:
        out = {}
        if self.k >= 5:
            out["rollup-claimed-total"] = money(self.sheet_claimed())
        if self.k >= 7:
            out["rollup-due-total"] = money(self.sheet_due())
        if self.k >= 25:
            out["rollup-overdue-count"] = str(len(self.overdue_claims()))
            out["rollup-overdue-total"] = money(self.overdue_total())
        return out

    def summary(self) -> dict:
        out = {}
        if self.k < 31:
            return out
        for g in GRADES:
            ps = [p for p in self.people.values() if self.grade_now(p) == g and not p.retired_from]
            out[f"summary-grade-{g}-count"] = str(len(ps))
            out[f"summary-grade-{g}-due-total"] = money(
                sum((self.due_total(p) or Decimal("0") for p in ps), Decimal("0")))
        for per in self.periods.values():
            out[f"summary-period-{per.name}-due-total"] = self.period_total_text(per)
        for s in STATUSES:
            out[f"summary-status-{s}-count"] = str(sum(1 for c in self.claims if c.status == s))
        return out

    def export_csv(self) -> str:
        buf = io.StringIO()
        w = csv.writer(buf, lineterminator="\n")
        w.writerow(["name", "grade", "retired-from", "due-total"])
        for p in sorted(self.people.values(), key=lambda x: x.order):
            v = self.due_total(p)
            w.writerow([p.name, self.grade_now(p), p.retired_from.isoformat() if p.retired_from else "",
                        "n/a" if v is None else money(v)])
        return buf.getvalue()

    def view(self) -> dict:
        people = {}
        for key, p in sorted(self.people.items(), key=lambda kv: kv[1].order):
            claims = sorted(self.person_claims(p), key=lambda c: c.idx, reverse=True)
            people[key] = {"person": p, "visible": self.visible(p), "cells": self.person_cells(p),
                           "claims": [(c, self.claim_cells(c)) for c in claims]}
        periods = {n: {"period-due-total": self.period_total_text(per),
                       "period-closed": "yes" if per.closed else "no"}
                   for n, per in self.periods.items()}
        rates = {}
        for g in GRADES:
            r = self.rate_at(g, self.today)
            rates[g] = "n/a" if r is None else money(r)
        return {"user": self.user, "sheet": self.sheet, "today": self.today.isoformat(),
                "people": people, "rollups": self.rollups(), "periods": periods,
                "rates": rates, "summary": self.summary(), "audit": list(self.audit)}

    def audit_text(self, n: int) -> list[str]:
        """The audit lines as a spec written at checkpoint n knows them (fields since <= n)."""
        out = []
        for event, user, fields in self.audit:
            parts = [event, f"sheet={self.sheet}", f"by={user}"]
            parts += [f"{a}={b}" for a, b, s in fields if s <= n]
            out.append(" ".join(parts))
        return out


# ---- the requests, one per checkpoint, beside the rules they state ------------------------------

TYPE = {n: ("mutative" if n % 4 == 0 else "additive") for n in range(1, 41)}
SLUG = {
    1: "signin-and-sheet", 2: "sheet-today", 3: "people", 4: "name-uniqueness",
    5: "claims", 6: "audit", 7: "rates-and-due", 8: "workflow",
    9: "numbering", 10: "settle-freezes-due", 11: "rates-effective-dated", 12: "half-even",
    13: "four-eyes", 14: "edit-conflict", 15: "import-people", 16: "import-upserts",
    17: "periods", 18: "close-period", 19: "quick-add", 20: "open-claims-immutable",
    21: "retire", 22: "hold", 23: "roles-and-clerk-limit", 24: "floor",
    25: "due-by-and-overdue", 26: "late-charge", 27: "patrons-and-backing", 28: "grade-dated",
    29: "reopen-period", 30: "corrections", 31: "summary", 32: "rounding-policy-date",
    33: "export-people", 34: "bulk-open", 35: "numbering-per-period", 36: "approvals",
    37: "reassign-claim", 38: "terms-per-grade", 39: "claim-log", 40: "hold-interval",
}
AREA = {n: "calc" for n in range(1, 41)}
AREA.update({1: "entity", 2: "entity", 3: "entity", 5: "entity", 6: "audit", 15: "entity",
             17: "entity", 23: "entity", 27: "relation", 31: "view", 33: "view", 39: "view"})

REQUESTS = {
    1: """Anyone using the app first signs in by typing a name; there is no password. The signed-in
name shows on the screen. A sheet is chosen by typing its id and loading it; the active sheet id
shows on the screen, and everything else in the app is kept per sheet. A sheet that has never been
loaded before starts empty. Everything happens on the one screen at /.""",
    2: """Each sheet has a "today" date, shown on the screen and changeable there. It starts as the real
date. Every decision in the app that depends on the date, and every default date, uses the
sheet's today and never the real clock.""",
    3: """Keep a list of people on the sheet. Each has a name (required; an empty name is refused with an
error on the form) and a grade, one of A, B or C. People are added through a form, and an
existing person can be edited through the same form (opening a person's editor fills the form
with their values). Show all the people in the order they were added, each with their name and
grade.""",
    4: """A person's name must be unique on the sheet, comparing without regard to case and ignoring
spaces before and after the name. Names are stored with those surrounding spaces removed and
shown that way. Adding or editing a person to a name already in use is refused with an error on
the form, and nothing is saved.""",
    5: """A person can have claims. A claim has an amount (required; a number with up to two decimals,
0.00 or more), a date (defaults to the sheet's today) and a note (may be empty). Claims are added
from the person's row and listed under it, newest first, each showing its amount with two
decimals, its date and its note. A claim can be edited (amount, date, note) through the same
form. Show each person's claimed: the sum of their claims' amounts, with two decimals. Show the
sheet's claimed-total: everyone's claimed added up.""",
    6: """Record every change to the sheet in the audit file, one line per change, appended in the order
the changes happen:
PERSON_ADDED name=<name> grade=<grade>, PERSON_EDITED name=<name> grade=<grade>,
CLAIM_ADDED person=<name> amount=<amount> date=<date>, and CLAIM_EDITED with the same fields.
Every line starts with the event, then sheet=<sheet id> and by=<signed-in user>, then the fields
in the order given, separated by single spaces. Amounts are written exactly as the screen shows
them (two decimals) and dates as yyyy-mm-dd. A change that is refused, by any rule now or later,
writes no line and changes nothing.""",
    7: """The sheet has a rate for each grade: a percent with two decimals, set on the screen (RATE_SET
grade=<grade> rate=<rate> in the audit). A claim's due is its amount times the rate for its
person's grade, divided by 100, rounded half up to two decimals (a half rounds away from zero:
1.025 becomes 1.03). Show due on each claim. Show each person's due-total: their claimed times
their grade's rate, divided by 100, rounded the same way. Show the sheet's due-total: everyone's
due-total added up. A grade with no rate makes its claims' due and its people's due-total n/a,
and a total skips n/a.""",
    8: """A claim now has a status. It starts as DRAFT; it can be opened (OPEN) and then settled
(SETTLED); a DRAFT or OPEN claim can be voided (VOID). A SETTLED or VOID claim cannot change
status, and the buttons for a change that is not allowed are refused with an error on the claim.
Only OPEN and SETTLED claims count toward claimed, due-total and every total; drafts and voided
claims do not. Show each claim's status. Every status change writes an audit line: CLAIM_OPENED,
CLAIM_SETTLED or CLAIM_VOIDED, each with person=<name> amount=<amount> date=<date>.""",
    9: """When a claim is opened it receives the next number on the sheet: 1 for the first claim ever
opened on the sheet, then 2, and so on, with no gaps and never reused, even when two users open
claims at the same moment. A draft has no number, and voiding a claim clears its number (the
number is not given to anyone else). Show the number on the claim. Every audit line about a
claim that has a number gains number=<number> at its end (so CLAIM_OPENED and CLAIM_SETTLED
carry it; a CLAIM_VOIDED line carries the number the claim had).""",
    10: """Settling a claim fixes its due: the figure it had at the moment of settling is kept, and later
changes to rates do not alter it. Open claims stay live. Show the frozen figure in the same place
as before, and add due=<due> at the end of the CLAIM_SETTLED line.""",
    11: """A rate can carry a from-date. A grade may have several rates with different from-dates; a claim
uses the rate whose from-date is the latest one on or before the claim's date, and a rate with no
from-date applies from the beginning of time. A claim dated before every rate that could apply has
due n/a. Setting a rate for a grade and from-date that already exist replaces that rate. Show, per
grade, the rate in force on the sheet's today. RATE_SET gains from=<date> when one was given.""",
    12: """Live due now rounds half to even (1.025 becomes 1.02, 1.035 becomes 1.04). A settled claim keeps
its frozen figure. Every due-total is now the sum of the already-rounded claim figures, not the
rounded total amount times the rate; a person with nothing that counts shows 0.00. A person whose
grade has no rate today still shows n/a, unless a settled claim keeps a figure: then the total is
the sum of the figures there are. The sheet's due-total is still everyone's due-total added up.""",
    13: """A claim records who opened it; show opened-by on the claim. The user who opened a claim cannot
settle it: the settle action is refused with an error on the claim, and the status is unchanged.""",
    14: """When a person is edited, the form remembers which version of the person it loaded. If someone
else has saved that person in the meantime, saving is refused with an error on the form, nothing
is stored, and the form shows the current values; opening the editor again and saving works.
Submitting any form twice before the first submit has answered stores one record, not two.""",
    15: """People can be pasted in as lines of name,grade into an import box. All the lines are checked
first, with the same rules as the form: an empty name, a grade other than A, B or C, a name
already on the sheet, or a name repeated in the paste (compared like uniqueness) is an error. If
any line has an error, nothing is imported and each bad line is marked with its line number;
otherwise every person is added, in order, each with a PERSON_ADDED line in the audit, and the
count added is shown.""",
    16: """Pasting a line whose name matches an existing person (compared like uniqueness) now updates that
person's grade and writes PERSON_EDITED, instead of being an error. New names are still added. A
name repeated in the paste is still an error, and any error still means nothing is imported. The
import shows how many were added and how many updated.""",
    17: """The sheet has periods, added on the screen: a name (unique on the sheet) and a from and to date,
inclusive, no two periods overlapping; a bad period is refused with an error on the period form.
A claim belongs to the period whose dates contain its date, or to none. Show each claim's period,
and for each period its due-total: the due of the claims that count whose date falls in it.
Adding a period writes PERIOD_ADDED period=<name> from=<date> to=<date>.""",
    18: """A period can be closed. Closing fixes its due-total at that moment: later changes to rates do not
alter it. No claim dated inside a closed period can be added, edited, opened, settled or voided;
each is refused with an error. Show closed yes/no on the period. Closing writes PERIOD_CLOSED
period=<name> total=<due-total>.""",
    19: """A quick-add bar on the people list takes a name and an amount and creates a DRAFT claim with that
amount, dated the sheet's today, with an empty note, for the named person. If the name is not on
the sheet the person is created first with grade A. Every rule that applies to the person and
claim forms applies here, and a refusal shows an error on the bar.""",
    20: """An OPEN claim can no longer be edited; only a DRAFT can, and the edit of an open claim is refused
with an error on the claim. To change an open claim, void it and add a new one. A voided claim now
keeps its number (it is still never reused), and CLAIM_VOIDED carries it.""",
    21: """A person can be retired from a date (defaults to the sheet's today). A claim dated after a
person's retirement date is refused with an error; claims dated on or before it are allowed even
if added later. Retired people are left out of the list unless "show retired" is on, and their
claims keep counting in every total. Show retired yes/no and retired-from. Retiring writes
PERSON_RETIRED name=<name> from=<date>.""",
    22: """A person can be put on hold, and taken off hold again. While held, their OPEN claims count in no
live total: not their own claimed or due-total, not the sheet's totals, not a period's total. Their
SETTLED claims still count. Show hold yes/no. Holding writes PERSON_HELD name=<name>; releasing
writes PERSON_RELEASED name=<name>.""",
    23: """The sheet's settings assign a role to a user name: clerk (the default for any name) or steward
(ROLE_SET user=<name> role=<role>). The sheet also has a clerk limit (two decimals; blank means no
limit; SETTING_CHANGED key=clerk-limit value=<limit>). A clerk can settle a claim only when its
due is at or below the limit; above it, settling is refused with an error on the claim. Stewards
settle anything. The opener still cannot settle their own claim.""",
    24: """The sheet has a floor (two decimals, settings; SETTING_CHANGED key=floor value=<floor>). It starts
at 1.00. A claim's live due is at least the floor. A settled claim's frozen figure and a closed
period's fixed total are unchanged by the floor. The floored figure shows wherever due appears, and
every total adds up the floored figures.""",
    25: """The sheet has terms: a number of days (settings, SETTING_CHANGED key=terms value=<days>), 14
unless changed. A claim's due-by is its date plus the terms in force. A claim is overdue when it
is OPEN and its due-by is before the sheet's today. Show due-by and overdue yes/no on each claim,
and per person and for the sheet an overdue count and overdue-total (the due of the overdue
claims that count).""",
    26: """The sheet has a late percent (two decimals, settings, 0.00 unless changed; SETTING_CHANGED
key=late-pct value=<percent>). An overdue claim's live due gains the late percent of its floored
due for every full 30 days it is overdue, rounded like due and added on. Settling freezes it in,
and the overdue-total includes it.""",
    27: """A person may name other people on the sheet as their patrons, one at a time from their row (not
themselves, and not the same person twice; a refusal shows an error on the row; PATRON_ADDED
name=<name> patron=<patron name>). Show each person's patrons (names, comma and space separated,
sorted) and their backing: their patrons' due-totals added up, skipping n/a, 0.00 with no
patrons.""",
    28: """A person's grade is now dated. The person form gains a from-date (default the sheet's today), and
each save with a grade records that grade from that date, keeping the ones already recorded; the first
grade a person was given applies from the beginning of time. A claim uses the grade in force on
the claim's date to find its rate; the list shows the grade in force on the sheet's today. An
import line gives its grade from the sheet's today.""",
    29: """A closed period can be reopened, by a steward only (anyone else is refused with an error on the
period). Reopening makes its due-total live again. Reopening writes PERIOD_REOPENED
period=<name>.""",
    30: """A claim with a negative amount is a correction. It is allowed only when the claim form names, by
number, a SETTLED claim of the same person that it corrects; otherwise it is refused. A
correction's due is its amount times the rate, rounded like any claim, with no floor and no late
charge. It is numbered, opened and settled like any claim, counts in every total, and shows the
number it corrects.""",
    31: """Add a summary panel to the screen. Per grade: the count of people on that grade today (retired
people excluded) and their due-totals added up. Per period: its due-total. Per status: the count
of claims with that status. Every figure must agree with the list.""",
    32: """The sheet has a policy date (settings, SETTING_CHANGED key=policy-date value=<date>); when it is
blank the policy date is the sheet's today. A claim dated before the policy date rounds half up;
a claim dated on or after it rounds half to even. This decides every rounding of that claim's live
figures (the rate step and the late charge). Settled figures stay frozen.""",
    33: """A button downloads the people as a CSV file: a header line name,grade,retired-from,due-total,
then one line per person in list order, retired people included, with the grade in force today,
the retired-from date or nothing, and the due-total as shown. A value holding a comma, a quote or a
line break is wrapped in double quotes, with any quote inside doubled. Lines end with a line
feed.""",
    34: """Claims can be selected (a checkbox on each) and opened together with one button. Each selected
claim that can be opened is opened and numbered in list order (the list order of people, newest
claim first within a person); each that cannot is left as it is. Show how many were opened and
how many were refused.""",
    35: """The sheet gains a setting, period numbering from (a date; blank means off; SETTING_CHANGED
key=period-numbering-from value=<date>). While the setting is a date and the sheet's today is on
or after it, a claim opened receives a number within its period: <period name>-<n>, counting from 1
in each period, and a claim in no period is numbered X-<n> in its own sequence. Claims opened
before that keep their sheet-wide numbers, and the sheet-wide sequence continues if the setting
is cleared.""",
    36: """When a clerk settles a claim whose due is above the clerk limit, the claim now goes to PENDING
instead of being refused (CLAIM_PENDING, naming the claim like every claim line). A PENDING claim counts as open in
every total. A steward approves it (it becomes SETTLED, frozen at that moment, CLAIM_APPROVED
with due=<due> at the end like CLAIM_SETTLED) or rejects it with a reason (back to OPEN,
CLAIM_REJECTED with reason=<reason> at the end). The opener cannot approve their own claim.""",
    37: """A steward can move a DRAFT, OPEN or PENDING claim to another person on the sheet (a refusal
shows an error on the claim). The claim keeps its number and date, every total follows, and
CLAIM_REASSIGNED is written, naming the claim like every claim line (with the new person) and
ending from=<old name> to=<new name>. A settled or voided claim cannot move.""",
    38: """Terms can be set per grade (settings, SETTING_CHANGED key=terms-<grade> value=<days>); a grade
without its own terms uses the sheet's terms. A claim's due-by is now fixed when the claim is
created, from the terms of its person's grade in force on the claim's date; it does not change
when the terms or the claim's date change later.""",
    39: """Show on each claim its status log: one line per status it has had, oldest first, as
<STATUS> by <user> on <date> due=<due>, where the date is the sheet's today when the change was
made and the due is the claim's due as it was computed at that moment (including the DRAFT line
written when the claim was added).""",
    40: """A hold now has a from-date (default the sheet's today) and an optional to-date, and a person may
have several holds over time. Only a person's OPEN claims dated within a hold are left out of the
live totals; their other open claims count. Show hold yes/no as whether the person has any hold.
Holding writes PERSON_HELD name=<name> from=<date>; releasing is no longer a separate action
(a hold ends on its to-date).""",
}

ALGORITHM = {4: "normalised-uniqueness", 8: "workflow-counting", 12: "half-even-sum-of-rounded",
             16: "import-upsert", 20: "void-keeps-number", 24: "floor", 28: "grade-in-force",
             32: "rounding-by-policy-date", 36: "pending-approval", 40: "hold-interval"}

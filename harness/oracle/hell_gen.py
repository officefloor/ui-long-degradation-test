"""Generated scenarios: for each checkpoint, seeded multi-user action sequences over everything in
force at that checkpoint, rendered into the checkpoint's spec beside its story (hell_scripts).

The story states the feature; the generated scenarios cross it with every earlier rule, in
interleavings no one wrote by hand. Each is a deterministic function of (checkpoint, index), so
a rebuild reproduces it, and each is generated against the reference model so every referent it
names exists at its own checkpoint (a later rule may refuse an earlier creation; the renderer
then drops the steps that referred to it).

Future-proofing: an additive checkpoint may not change the spec of an earlier one, so a scenario
generated at n must not do anything a LATER additive rule would decide differently. The
constraints below encode that (a different user settles than opened; no edit of a non-draft; no
rate, grade or today change after a settle before freezing exists; terms set only before claims
and no claim date edited before due-by is fixed at creation; reopen only by a steward;
corrections, reassignments and approvals only once they exist).
"""
from __future__ import annotations

import random
from datetime import timedelta

from . import hell
from .hell import CELL_SINCE, GRADES, SINCE, Refused

USERS = ("uma", "vic", "wes")
NAMES = ("Ada", "Ben", "Cam")
AMOUNTS = ("10.25", "10.35", "4.00", "0.04", "20.00", "99.95", "12.50", "7.77", "3.33", "0.40", "25.00", "1.00")
RATES = ("10.00", "12.50", "7.50", "20.00", "33.33", "5.00")
DATES = ("2026-02-10", "2026-02-25", "2026-03-01", "2026-03-05", "2026-03-09", "2026-03-15",
         "2026-03-20", "2026-03-28", "2026-04-02")
TODAYS = ("2026-03-10", "2026-03-20", "2026-04-05")

GEN_FROM = 5          # the first checkpoint that carries generated scenarios
COUNT = 3             # generated scenarios per checkpoint


def scenarios(n: int) -> list[list[tuple]]:
    """The generated scripts of checkpoint n, in order."""
    if n < GEN_FROM:
        return []
    return [generate(n, i) for i in range(COUNT)]


def apply(m: hell.Model, st: tuple) -> None:
    """Advance the shadow model by one step, as the renderer would; a refusal is a valid outcome."""
    op, a = st[0], st[1:]
    try:
        if op == "as":
            m.user = a[0]
        elif op == "today":
            m.set_today(a[0])
        elif op == "person":
            m.add_person(a[0], a[1], a[2] if len(a) > 2 else None)
        elif op == "edit":
            m.edit_open(a[0])
            m.edit_save(a[1])
        elif op == "claim":
            m.add_claim(*a)
        elif op == "claim2":
            m.add_claim(a[0], a[1], a[2], a[3], twice=True)
        elif op == "claim_edit":
            m.edit_claim(*a)
        elif op in ("open", "settle", "void", "approve"):
            getattr(m, op + "_claim")(a[0], a[1])
        elif op == "reject":
            m.reject_claim(*a)
        elif op == "rate":
            m.set_rate(*a)
        elif op == "period":
            m.add_period(*a)
        elif op == "close":
            m.close_period(a[0])
        elif op == "reopen":
            m.reopen_period(a[0])
        elif op == "quick":
            m.quick_add(*a)
        elif op == "retire":
            m.retire(*a)
        elif op == "hold":
            m.hold(*a)
        elif op == "show_retired":
            m.set_show_retired(a[0])
        elif op == "role":
            m.set_role(*a)
        elif op == "setting":
            m.set_setting(*a)
        elif op == "patron":
            m.add_patron(*a)
        elif op == "reassign":
            m.reassign_claim(*a)
        elif op == "bulk_open":
            m.bulk_open(a[0])
        elif op == "statement":
            m.statement(a[0])
        elif op in ("check", "export"):
            pass
        else:
            raise ValueError(op)
    except Refused:
        pass


ROW_OPS = {"claim": (0,), "claim2": (0,), "claim_edit": (0,), "open": (0,), "settle": (0,), "void": (0,),
           "approve": (0,), "reject": (0,), "edit": (0,), "hold": (0,), "patron": (0,), "statement": (0,),
           "retire": (0,), "reassign": (0, 2)}


def row_targets(st: tuple) -> list[str]:
    """The people whose row on the screen a step works through (a retired one must be shown first)."""
    op, a = st[0], st[1:]
    if op == "bulk_open":
        return [name for name, _ in a[0]]
    return [a[i] for i in ROW_OPS.get(op, ())]


def _cells(prefix: str, n: int) -> list[str]:
    return [c[len(prefix):] for c, since in CELL_SINCE.items() if c.startswith(prefix) and since <= n]


def full_check(n: int) -> dict:
    spec = {"people": _cells("person-", n), "claims": _cells("claim-", n), "rollups": True}
    if n >= SINCE["period"]:
        spec["periods"] = True
    if n >= SINCE["due"]:
        spec["rates"] = True
    if n >= SINCE["summary"]:
        spec["summary"] = True
    if n >= SINCE["audit"]:
        spec["audit"] = True
    return spec


def mid_check(n: int) -> dict:
    return {"people": [c for c in ("claimed", "due-total") if CELL_SINCE["person-" + c] <= n],
            "claims": [c for c in ("due", "status", "stated") if CELL_SINCE["claim-" + c] <= n],
            "rollups": True}


class _Gen:
    def __init__(self, n: int, i: int):
        self.n, self.rnd = n, random.Random(n * 7919 + i * 104729 + 17)
        self.m = hell.Model(n)
        self.steps: list[tuple] = []
        self.steward: str | None = None
        self.settled = False

    def do(self, st: tuple) -> None:
        # a retired person's row is only on the screen while this user's "show retired" is on
        if st[0] != "show_retired" and any(
                (p := self.m.people.get(hell.norm_name(nm))) is not None and not self.m.visible(p)
                for nm in row_targets(st)):
            self.do(("show_retired", True))
        self.steps.append(st)
        apply(self.m, st)
        if st[0] == "settle":
            self.settled = True

    def has(self, f: str) -> bool:
        return self.n >= SINCE[f]

    # -- state views
    def people(self) -> list[hell.Person]:
        return sorted(self.m.people.values(), key=lambda p: p.order)

    def claims(self, *statuses: str) -> list[tuple[str, int, hell.Claim]]:
        out = []
        for p in self.people():
            for c in self.m.person_claims(p):
                if not statuses or c.status in statuses:
                    out.append((p.name, c.idx, c))
        return out

    def other_user(self, *avoid: str | None) -> str:
        return self.rnd.choice([u for u in USERS if u not in avoid])

    # -- generation
    def run(self) -> list[tuple]:
        n, rnd, do = self.n, self.rnd, self.do
        do(("as", "uma"))
        if self.has("today"):
            do(("today", rnd.choice(TODAYS)))
        if self.has("roles"):
            if rnd.random() < 0.7:
                self.steward = rnd.choice(("vic", "wes"))
                do(("role", self.steward, "steward"))
            if rnd.random() < 0.5:
                do(("setting", "clerk-limit", rnd.choice(("1.50", "3.00"))))
        if self.has("floor") and rnd.random() < 0.5:
            do(("setting", "floor", rnd.choice(("0.50", "2.00"))))
        if self.has("overdue") and rnd.random() < 0.6:
            do(("setting", "terms", rnd.choice(("7", "10", "30"))))
        if self.has("late") and rnd.random() < 0.6:
            do(("setting", "late-pct", rnd.choice(("10.00", "5.00"))))
        if self.has("policy_date") and rnd.random() < 0.5:
            do(("setting", "policy-date", rnd.choice(("2026-03-05", "2026-03-15"))))
        if self.has("period_number") and rnd.random() < 0.4:
            do(("setting", "period-numbering-from", "2026-03-01"))
        if self.has("terms_fixed") and rnd.random() < 0.5:
            do(("setting", f"terms-{rnd.choice(GRADES)}", rnd.choice(("3", "20"))))
        if self.has("due"):
            for g in GRADES:
                if g != "C" or rnd.random() < 0.5:
                    do(("rate", g, rnd.choice(RATES)))
            if self.has("rate_dated") and rnd.random() < 0.6:
                do(("rate", rnd.choice(GRADES), rnd.choice(RATES),
                    rnd.choice(("2026-03-01", "2026-03-10", "2026-03-16"))))
        if self.has("period") and rnd.random() < 0.7:
            do(("period", "P1", "2026-03-01", "2026-03-15"))
            if rnd.random() < 0.6:
                do(("period", "P2", "2026-03-16", "2026-03-31"))
        for name in rnd.sample(NAMES, rnd.choice((2, 3))):
            do(("person", name, rnd.choice(GRADES)))
        body = rnd.randint(16, 22)
        for step_no in range(body):
            cands = self.candidates()
            total = sum(w for w, _ in cands)
            pick = rnd.random() * total
            for w, steps in cands:
                pick -= w
                if pick <= 0:
                    break
            for st in steps:
                do(st)
            if step_no % 7 == 6:
                do(("check", mid_check(n)))
        do(("check", full_check(n)))
        return self.steps

    def candidates(self) -> list[tuple[float, list[tuple]]]:
        n, rnd, m = self.n, self.rnd, self.m
        out: list[tuple[float, list[tuple]]] = []
        people = self.people()
        names = [p.name for p in people]
        figure_moves_ok = not (n < SINCE["freeze"] and self.settled)

        if self.has("claims"):
            name = rnd.choice(names)
            when = rnd.choice(DATES) if rnd.random() < 0.6 else None
            st = ("claim", name, rnd.choice(AMOUNTS)) + ((when,) if when else ())
            out.append((5.0, [st]))
        drafts = self.claims("DRAFT")
        opens = self.claims("OPEN")
        if self.has("status") and drafts:
            name, idx, _ = rnd.choice(drafts)
            steps = []
            if rnd.random() < 0.3:
                steps.append(("as", self.other_user(m.user)))
            out.append((4.0, steps + [("open", name, idx)]))
        if self.has("status") and opens:
            name, idx, c = rnd.choice(opens)
            steps = []
            if m.user == c.opened_by:
                steps.append(("as", self.other_user(c.opened_by)))
            out.append((3.0, steps + [("settle", name, idx)]))
        if self.has("status") and (drafts or opens):
            name, idx, _ = rnd.choice(drafts + opens)
            out.append((1.5, [("void", name, idx)]))
        if self.has("due") and figure_moves_ok:
            st = ("rate", rnd.choice(GRADES), rnd.choice(RATES))
            if self.has("rate_dated") and rnd.random() < 0.4:
                st = st + (rnd.choice(("2026-03-01", "2026-03-10", "2026-03-16")),)
            out.append((2.0, [st]))
        if figure_moves_ok:
            f = {"grade": rnd.choice(GRADES)}
            if self.has("grade_dated") and rnd.random() < 0.5:
                f["grade_from"] = rnd.choice(DATES)
            out.append((1.5, [("edit", rnd.choice(names), f)]))
        if self.has("today") and figure_moves_ok:
            later = m.today + timedelta(days=rnd.randint(5, 40))
            out.append((1.5, [("today", later.isoformat())]))
        if self.has("statement"):
            out.append((3.0, [("statement", rnd.choice(names))]))
        open_periods = [p for p in m.periods.values() if not p.closed]
        closed_periods = [p for p in m.periods.values() if p.closed]
        if self.has("closed") and open_periods:
            out.append((1.5, [("close", rnd.choice(open_periods).name)]))
        if self.has("reopen") and closed_periods and self.steward:
            out.append((1.0, [("as", self.steward), ("reopen", rnd.choice(closed_periods).name)]))
        if self.has("quick"):
            out.append((1.0, [("quick", rnd.choice(names + ["Dot"]), rnd.choice(AMOUNTS))]))
        unretired = [p.name for p in people if not p.retired_from]
        if self.has("retire") and unretired:
            steps = [("retire", rnd.choice(unretired), rnd.choice(DATES))]
            if rnd.random() < 0.5:
                steps.append(("show_retired", True))
            out.append((0.7, steps))
        if self.has("hold"):
            st = ("hold", rnd.choice(names))
            if self.has("hold_interval"):
                a, b = sorted(rnd.sample(DATES, 2))
                st = st + ((a, b) if rnd.random() < 0.7 else (a, None))
            out.append((1.2, [st]))
        if self.has("backing") and len(names) >= 2:
            a, b = rnd.sample(names, 2)
            out.append((1.0, [("patron", a, b)]))
        settled = [(nm, i, c) for nm, i, c in self.claims("SETTLED") if c.number]
        if self.has("correction") and settled:
            name, idx, c = rnd.choice(settled)
            out.append((1.5, [("claim", name, "-" + rnd.choice(("1.00", "4.00", "10.25")), None, "", c.number)]))
        if self.has("bulk") and len(drafts) >= 2:
            items = [(nm, i) for nm, i, _ in rnd.sample(drafts, min(len(drafts), rnd.choice((2, 3))))]
            out.append((1.0, [("bulk_open", items)]))
        pending = self.claims("PENDING")
        if self.has("pending") and pending and self.steward:
            name, idx, c = rnd.choice(pending)
            if c.opened_by != self.steward:
                act = ("approve", name, idx) if rnd.random() < 0.6 else ("reject", name, idx, "no")
                out.append((2.0, [("as", self.steward), act]))
        movable = self.claims("DRAFT", "OPEN", "PENDING")
        if self.has("reassign") and self.steward and movable and len(names) >= 2:
            name, idx, _ = rnd.choice(movable)
            out.append((1.0, [("as", self.steward), ("reassign", name, idx, rnd.choice([x for x in names if x != name]))]))
        if drafts:
            name, idx, _ = rnd.choice(drafts)
            # a date edit moves a live due-by but not one fixed at creation (cp38): amounts only before
            f = {"amount": rnd.choice(AMOUNTS)} if (rnd.random() < 0.6 or not self.has("terms_fixed")) \
                else {"date": rnd.choice(DATES)}
            out.append((1.0, [("claim_edit", name, idx, f)]))
        settings = []
        if self.has("floor"):
            settings.append(("floor", rnd.choice(("0.50", "2.00", "3.00"))))
        if self.has("late"):
            settings.append(("late-pct", rnd.choice(("10.00", "5.00", "0.00"))))
        if self.has("policy_date"):
            settings.append(("policy-date", rnd.choice(("2026-03-05", "2026-03-15", ""))))
        if self.has("roles"):
            settings.append(("clerk-limit", rnd.choice(("1.50", "3.00", ""))))
        if settings:
            k, v = rnd.choice(settings)
            out.append((1.0, [("setting", k, v)]))
        if self.has("export"):
            out.append((0.3, [("export",)]))
        if n >= 14:
            out.append((0.3, [("claim2", rnd.choice(names), rnd.choice(AMOUNTS), rnd.choice(DATES), "")]))
        out.append((0.8, [("as", self.other_user(m.user))]))
        return out


def generate(n: int, i: int) -> list[tuple]:
    return _Gen(n, i).run()

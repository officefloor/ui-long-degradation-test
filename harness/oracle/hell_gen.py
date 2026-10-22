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
corrections, reassignments and approvals only once they exist; a void of a settled claim only
once stewards may; no editor left open across a user switch before locks exist; settings with
neutral defaults left alone until their checkpoint; an archive only as the last change).
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
SHEET_TOKEN = "__SHEET__"


def hell_sheet_id(suffix: str) -> str:
    return SHEET_TOKEN + (f"-{suffix}" if suffix else "")
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
            extra = a[4] if len(a) > 4 else {}
            m.add_person(a[0], a[1], a[2] if len(a) > 2 else None, terms=a[3] if len(a) > 3 else None,
                         contact=extra.get("contact"))
        elif op == "edit":
            m.edit_open(a[0])
            m.edit_save(a[1])
        elif op == "claim":
            a = list(a)
            if len(a) > 4 and isinstance(a[4], tuple):
                a[4] = m.claim(a[4][1], a[4][2]).number or ""
            if len(a) > 5:
                m.add_claim(*a[:5], extra=a[5])
            else:
                m.add_claim(*a)
        elif op == "inline":
            m.edit_inline(*a)
        elif op == "remind":
            m.remind(*a)
        elif op == "comment":
            m.add_comment(*a)
        elif op == "holiday":
            m.add_holiday(a[0])
        elif op == "void_reason":
            m.add_void_reason(a[0])
        elif op == "bulk_reassign":
            m.bulk_reassign(*a)
        elif op == "rate_preview":
            pass
        elif op == "sheet":
            pass
        elif op == "audit_view":
            pass
        elif op == "alias":
            m.add_alias(*a)
        elif op == "template":
            m.save_template(*a)
        elif op == "claim_template":
            m.claim_from_template(*a)
        elif op == "pool":
            m.add_pool(a[0])
        elif op == "pool_member":
            m.add_pool_member(*a)
        elif op == "merge":
            m.merge(*a)
        elif op == "transfer":
            m.transfer(a[0], hell_sheet_id(a[1]))
        elif op == "clone":
            m.clone_sheet(hell_sheet_id(a[0]))
        elif op == "import_people":
            m.import_people(a[0])
        elif op == "import_rates":
            m.import_rates(a[0])
        elif op in ("delete", "restore"):
            getattr(m, op + "_claim")(*a)
        elif op == "move":
            m.move_person(*a)
        elif op == "sort":
            m.set_sort(a[0])
        elif op == "bulk_retire":
            m.bulk_retire(*a)
        elif op == "unretire":
            m.unretire(a[0])
        elif op == "plan":
            if len(a) > 5:
                m.add_plan(*a[:5], hell_sheet_id(a[5]) if m.k >= hell.RULES["plan_tree"] else None)
            else:
                m.add_plan(*a)
        elif op == "generate":
            m.generate_plans()
        elif op == "line":
            m.add_line(*a)
        elif op == "inline_grade":
            m.inline_grade(*a)
        elif op == "bulk_redate":
            m.bulk_redate(*a)
        elif op == "generate_fy":
            m.generate_fy(a[0])
        elif op in ("search", "order", "export_claims", "export_pools", "timeline"):
            pass
        elif op == "claim2":
            m.add_claim(a[0], a[1], a[2], a[3], twice=True)
        elif op == "claim_edit":
            m.edit_claim(*a)
        elif op == "claim_edit_open":
            m.claim_edit_open(*a)
        elif op == "claim_edit_save":
            m.edit_claim(*a)
            m.locks.pop(m.claim(a[0], a[1]).seq, None)
        elif op == "claim_edit_cancel":
            m.claim_edit_cancel(*a)
        elif op == "void":
            m.void_claim(a[0], a[1], *(a[2:] if m.has("void_reasons") else ()))
        elif op in ("open", "settle", "approve", "resettle", "defer", "redate", "review"):
            if op == "settle" and len(a) > 2 and not m.has("settle_date"):
                a = a[:2]
            getattr(m, op + "_claim")(*a)
        elif op == "waive":
            m.waive(*a)
        elif op == "claim_hold":
            m.hold_claim(*a)
        elif op == "settle_part":
            m.settle_part(*a)
        elif op == "flag":
            m.flag(*a)
        elif op == "approver":
            m.set_approver(*a)
        elif op == "note":
            m.add_note(a[0])
        elif op == "crew":
            m.add_crew(*a)
        elif op == "crew_member":
            m.add_crew_member(*a)
        elif op == "lock":
            m.lock_period(*a)
        elif op == "generate_quarters":
            m.generate_quarters(a[0])
        elif op == "import_openings":
            m.import_openings(a[0])
        elif op == "transfer_undo":
            m.transfer_undo(a[0])
        elif op == "bulk_void":
            m.bulk_void(*a)
        elif op in ("activity", "dups", "export_statement", "locale", "columns", "snapshot_compare", "compare",
                    "policy", "export_periods", "export_tree", "export_person", "export_policy", "preview_clear"):
            pass
        elif op == "plan_pause":
            m.pause_plan(*a)
        elif op == "plan_amount":
            m.change_plan_amount(*a)
        elif op == "rollover":
            m.rollover(a[0])
        elif op == "rollover_undo":
            m.rollover_undo()
        elif op == "share":
            m.share_claim(*a)
        elif op == "assign_review":
            m.assign_review(*a)
        elif op == "grade_retire":
            m.retire_grade(a[0])
        elif op == "grade_add":
            m.add_grade(a[0])
        elif op == "grade_merge":
            m.merge_grade(*a)
        elif op == "preview":
            m.set_preview(a[0])
        elif op == "set_due_by":
            m.set_due_by(*a)
        elif op == "bulk_hold":
            m.bulk_hold(*a)
        elif op == "merge_undo":
            m.merge_undo(a[0])
        elif op == "withdraw_rate":
            m.withdraw_rate(*a)
        elif op == "reject":
            m.reject_claim(*a)
        elif op == "proof":
            m.add_proof(a[0], a[1], *(a[2:] if m.has("proof_kinds") else ()))
        elif op == "split":
            m.split_claim(*a)
        elif op == "rate":
            m.set_rate(*a)
        elif op == "period":
            m.add_period(*a)
        elif op == "generate_periods":
            m.generate_periods(*a)
        elif op == "close":
            m.close_period(a[0])
        elif op == "soft_close":
            m.soft_close_period(a[0])
        elif op == "reopen":
            m.reopen_period(a[0])
        elif op == "quick":
            m.quick_add(*a)
        elif op == "paste":
            m.paste_claims(a[0])
        elif op == "retire":
            m.retire(*a)
        elif op == "hold":
            m.hold(*a)
        elif op == "watch":
            m.watch(*a)
        elif op == "show_retired":
            m.set_show_retired(a[0])
        elif op == "role":
            m.set_role(*a)
        elif op == "delegate":
            m.delegate(*a)
        elif op == "archive":
            m.archive_sheet()
        elif op == "setting":
            m.set_setting(*a)
        elif op == "patron":
            m.add_patron(*a)
        elif op == "reassign":
            m.reassign_claim(*a)
        elif op == "bulk_open":
            m.bulk_open(a[0])
        elif op == "bulk_settle":
            m.bulk_settle(a[0])
        elif op == "bulk_grade":
            m.bulk_grade(*a)
        elif op == "statement":
            m.statement(*a)
        elif op == "unstate":
            m.unstate(a[0])
        elif op == "asof":
            m.set_asof(a[0])
        elif op == "asof_clear":
            m.set_asof(None)
        elif op in ("check", "export", "hidden"):
            pass
        else:
            raise ValueError(op)
    except Refused:
        pass


ROW_OPS = {"claim": (0,), "claim2": (0,), "claim_edit": (0,), "claim_edit_open": (0,), "claim_edit_save": (0,),
           "claim_edit_cancel": (0,), "open": (0,), "settle": (0,), "void": (0,), "approve": (0,), "reject": (0,),
           "resettle": (0,), "defer": (0,), "proof": (0,), "redate": (0,), "split": (0,),
           "inline": (0,), "remind": (0,), "comment": (0,),
           "alias": (0,), "claim_template": (0,), "merge": (0, 1), "transfer": (0,), "delete": (0,),
           "restore": (0,), "move": (0,), "unretire": (0,), "plan": (0,), "line": (0,), "inline_grade": (0,),
           "review": (0,), "waive": (0,), "claim_hold": (0,), "settle_part": (0,), "flag": (0,), "approver": (0,),
           "transfer_undo": (0,), "export_statement": (0,), "timeline": (0,),
           "plan_pause": (0,), "plan_amount": (0,), "share": (0, 2), "assign_review": (0,), "set_due_by": (0,),
           "merge_undo": (0,), "export_person": (0,),
           "edit": (0,), "hold": (0,), "patron": (0,), "statement": (0,), "unstate": (0,), "watch": (0,),
           "retire": (0,), "reassign": (0, 2)}


def row_targets(st: tuple) -> list[str]:
    """The people whose row on the screen a step works through (a retired one must be shown first)."""
    op, a = st[0], st[1:]
    if op in ("bulk_open", "bulk_settle", "bulk_reassign", "bulk_redate", "bulk_void"):
        return [name for name, _ in a[0]] + ([a[1]] if op == "bulk_reassign" else [])
    if op in ("bulk_grade", "bulk_retire", "bulk_hold"):
        return list(a[0])
    if op == "pool_member" and not a[1].startswith("pool:"):
        return [a[1]]
    if op == "paste":
        # the claims a paste makes are read back through their person's row (claimAt)
        return [line.split(",", 1)[0].strip() for line in a[0] if line.strip()]
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
    if n >= SINCE["header"]:
        spec["counters"] = True
    if n >= SINCE["person_period"]:
        spec["person_periods"] = True
    if n >= SINCE["archive"]:
        spec["sheet"] = True
    if n >= SINCE["pools"]:
        spec["pools"] = True
    if n >= SINCE["crews"]:
        spec["crews"] = True
    if n >= hell.RULES["rate_calendar"]:
        spec["calendar"] = True
    if n >= SINCE["dashboard"]:
        spec["dash"] = True
    if n >= SINCE["notes"]:
        spec["notes"] = True
    if n >= hell.RULES["asof_roles"]:
        spec["roles"] = True
    if n >= SINCE["plans"]:
        spec["plans"] = True
    if n >= SINCE["tags"]:
        spec["tags"] = True
    if n >= SINCE["monthly"]:
        spec["months"] = True
    if n >= SINCE["audit"]:
        spec["audit"] = True
    return spec


def mid_check(n: int) -> dict:
    spec = {"people": [c for c in ("claimed", "due-total") if CELL_SINCE["person-" + c] <= n],
            "claims": [c for c in ("due", "status", "stated") if CELL_SINCE["claim-" + c] <= n],
            "rollups": True}
    if n >= SINCE["header"]:
        spec["counters"] = True
    return spec


class _Gen:
    def __init__(self, n: int, i: int):
        self.n, self.rnd = n, random.Random(n * 7919 + i * 104729 + 17)
        self.m = hell.Model(n, sheet=SHEET_TOKEN)
        self.steps: list[tuple] = []
        self.steward: str | None = None
        self.settled = False

    def do(self, st: tuple) -> None:
        if st[0] == "sheet":
            self.steps.append(st)
            self.m = self.m.sibling(hell_sheet_id(st[1] if len(st) > 1 else ""))
            return
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

    def past_date(self) -> str:
        """A date on or before the sheet's today, from the fixture dates."""
        past = [d for d in DATES if hell.day(d) <= self.m.today]
        return self.rnd.choice(past) if past else self.m.today.isoformat()

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
        if self.has("cap") and rnd.random() < 0.4:
            do(("setting", "cap", rnd.choice(("2.00", "5.00"))))
        if self.has("proofs") and rnd.random() < 0.4:
            do(("setting", "proof-threshold", rnd.choice(("1.00", "3.00"))))
        if self.has("perms") and rnd.random() < 0.4:
            act = rnd.choice(("open", "settle", "void", "close"))
            do(("setting", f"perm-{act}", rnd.choice(("steward", "clerk"))))
        if self.has("viewer") and rnd.random() < 0.3:
            do(("role", self.other_user(self.steward, "uma"), "viewer"))
        if self.has("auto_close") and rnd.random() < 0.5:
            do(("setting", "grace-days", rnd.choice(("0", "3"))))
        if n >= SINCE["note_required"] and rnd.random() < 0.4:
            do(("setting", "note-threshold", rnd.choice(("1.00", "2.50"))))
        if self.has("entry_date") and rnd.random() < 0.4:
            do(("setting", "entry-date", rnd.choice(("2026-03-01", "2026-03-05"))))
        if self.has("holidays") and rnd.random() < 0.5:
            for d in rnd.sample(("2026-03-13", "2026-03-16", "2026-03-24", "2026-04-03"), rnd.choice((1, 2))):
                do(("holiday", d))
        if n >= hell.RULES["grace"] and rnd.random() < 0.4:
            do(("setting", f"grace-{rnd.choice(GRADES)}", rnd.choice(("2", "5"))))
        if n >= hell.RULES["proof_grade"] and rnd.random() < 0.3:
            do(("setting", f"proof-threshold-{rnd.choice(GRADES)}", rnd.choice(("0.50", "4.00"))))
        if self.has("void_reasons") and rnd.random() < 0.4:
            for r in rnd.sample(("dup", "error", "late"), rnd.choice((1, 2))):
                do(("void_reason", r))
        if self.has("parent") and rnd.random() < 0.35:
            do(("sheet", "p"))
            for g in GRADES:
                do(("rate", g, rnd.choice(RATES)))
            pnames = rnd.sample(NAMES, rnd.choice((1, 2)))
            for name in pnames:
                do(("person", name, rnd.choice(GRADES)))
            if rnd.random() < 0.5:
                do(("claim", pnames[0], rnd.choice(AMOUNTS)))
                do(("open", pnames[0], 0))
            do(("sheet", ""))
            do(("setting", "parent", hell_sheet_id("p")))
        if self.has("templates_claim") and rnd.random() < 0.4:
            do(("template", "T1", rnd.choice(AMOUNTS), rnd.choice(("", "tpl"))))
        if self.has("cuts") and rnd.random() < 0.5:
            do(("setting", "pot", rnd.choice(("100.00", "33.33", "7.77"))))
        if self.has("fiscal") and rnd.random() < 0.3:
            do(("setting", "fiscal-start-month", rnd.choice(("4", "7"))))
        if n >= hell.RULES["alert"] and rnd.random() < 0.4:
            do(("setting", "alert-threshold", rnd.choice(("1.00", "3.00"))))
        if n >= hell.RULES["rounding_mode"] and rnd.random() < 0.4:
            do(("setting", "rounding", rnd.choice(("half-up", "half-even")), rnd.choice(("2026-03-01", "2026-03-10"))))
        if n >= hell.RULES["review"] and rnd.random() < 0.4:
            do(("setting", "review-threshold", rnd.choice(("1.50", "4.00"))))
        if n >= hell.RULES["review_sla"] and rnd.random() < 0.4:
            do(("setting", "review-sla", rnd.choice(("1", "5"))))
        if n >= hell.RULES["escalate"] and rnd.random() < 0.3:
            do(("setting", "escalate-after", rnd.choice(("1", "7"))))
        if n >= hell.RULES["proof_kinds"] and rnd.random() < 0.3:
            do(("setting", "proof-kinds", rnd.choice(("receipt", "receipt,photo"))))
        if n >= hell.RULES["default_grade"] and rnd.random() < 0.3:
            do(("setting", "default-grade", rnd.choice(GRADES)))
        if n >= hell.RULES["limit_grade"] and rnd.random() < 0.3:
            do(("setting", f"clerk-limit-{rnd.choice(GRADES)}", rnd.choice(("0.50", "9.00"))))
        if n >= hell.RULES["bands"] and rnd.random() < 0.4:
            do(("setting", "score-mid", "0"))
            do(("setting", "score-high", rnd.choice(("1", "5"))))
        if n >= hell.RULES["score_snapshot"] and rnd.random() < 0.3:
            do(("setting", "score-log", "on"))
        if n >= hell.RULES["max_open"] and rnd.random() < 0.3:
            do(("setting", "max-open", rnd.choice(("1", "3"))))
        if n >= hell.RULES["pending_sla"] and rnd.random() < 0.3:
            do(("setting", "pending-sla", rnd.choice(("1", "4"))))
        if n >= hell.RULES["restricted"] and rnd.random() < 0.25:
            do(("role", self.other_user(self.steward, "uma"), "restricted"))
        if n >= hell.RULES["grade_add"] and rnd.random() < 0.3:
            do(("grade_add", "D"))
        if n >= hell.RULES["perm_today"] and rnd.random() < 0.2:
            do(("setting", "perm-today", rnd.choice(("steward", "clerk"))))
        if self.has("due"):
            for g in GRADES:
                if g != "C" or rnd.random() < 0.5:
                    do(("rate", g, rnd.choice(RATES)))
            if self.has("rate_dated") and rnd.random() < 0.6:
                st = ("rate", rnd.choice(GRADES), rnd.choice(RATES),
                      rnd.choice(("2026-03-01", "2026-03-10", "2026-03-16")))
                if self.has("rate_ended") and rnd.random() < 0.5:
                    st = st + (rnd.choice(("2026-03-12", "2026-03-25")),)
                do(st)
        if self.has("period") and rnd.random() < 0.7:
            do(("period", "P1", "2026-03-01", "2026-03-15"))
            if rnd.random() < 0.6:
                do(("period", "P2", "2026-03-16", "2026-03-31"))
        elif self.has("templates") and rnd.random() < 0.5:
            do(("generate_periods", "2026-02-01", "2026-04-30"))
        for name in rnd.sample(NAMES, rnd.choice((2, 3))):
            st = ("person", name, rnd.choice(GRADES))
            if self.has("person_terms") and rnd.random() < 0.3:
                st = st + (None, rnd.choice(("3", "20")))
            extra = {}
            if self.has("contact") and rnd.random() < 0.4:
                extra["contact"] = rnd.choice((" Ada@x ", "ben@x", "ADA@X"))
            if self.has("person_tags") and rnd.random() < 0.3:
                extra["tags"] = rnd.choice(("a", "b, a", "c"))
            if extra:
                st = st + (None,) * (5 - len(st)) + (extra,)
            do(st)
        if self.has("pools") and len(self.people()) >= 2 and rnd.random() < 0.5:
            do(("pool", "P1"))
            ps = self.people()
            shares = rnd.choice((("50.00", "50.00"), ("33.33", "33.33", "33.34"), ("60.00", "40.00"), ("70.00", "20.00")))
            for p, sh in zip(ps, shares):
                st = ("pool_member", "P1", p.name, sh)
                if self.has("pools") and n >= hell.RULES["pool_dated"] and rnd.random() < 0.3:
                    st = st + ("2026-03-01", rnd.choice(("2026-03-15", "2026-04-30")))
                do(st)
            if n >= hell.RULES["nested_pools"] and rnd.random() < 0.4:
                do(("pool", "P2"))
                do(("pool_member", "P2", ps[0].name, "100.00"))
                do(("pool_member", "P1", "pool:P2", "10.00"))
        if self.has("crews") and len(self.people()) >= 2 and rnd.random() < 0.4:
            ps = self.people()
            do(("crew", "C1", ps[0].name))
            for p in ps[1:]:
                if rnd.random() < 0.7:
                    do(("crew_member", "C1", p.name))
        if self.has("person_terms_dated") and rnd.random() < 0.3 and self.people():
            do(("edit", rnd.choice(self.people()).name, {"terms": rnd.choice(("3", "20")), "terms_from": rnd.choice(("2026-03-01", "2026-03-12"))}))
        if self.has("plans") and rnd.random() < 0.4 and self.people():
            p = rnd.choice(self.people())
            every = rnd.choice(("7", "10"))
            if n >= hell.RULES["monthly_plans"] and rnd.random() < 0.5:
                every = rnd.choice(("m1", "m31", "m15"))
            do(("plan", p.name, rnd.choice(AMOUNTS), rnd.choice(("2026-02-20", "2026-03-01", "2026-03-09")), every, "2026-04-30"))
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
        if self.has("asof") and rnd.random() < 0.6:
            do(("asof", self.past_date()))
            do(("check", full_check(n)))
            do(("asof_clear",))
        if self.has("archive") and self.steward and rnd.random() < 0.2 and self.people():
            do(("as", self.steward))
            do(("archive",))
            do(("claim", rnd.choice([p.name for p in self.people()]), rnd.choice(AMOUNTS)))
        do(("check", full_check(n)))
        return self.steps

    def candidates(self) -> list[tuple[float, list[tuple]]]:
        n, rnd, m = self.n, self.rnd, self.m
        out: list[tuple[float, list[tuple]]] = []
        people = self.people()
        names = [p.name for p in people]
        if not names:
            # a merge or a transfer emptied the sheet: the only move is to add someone
            return [(1.0, [("person", rnd.choice(("Dot", "Eve", "Fay")), rnd.choice(GRADES))])]
        figure_moves_ok = not (n < SINCE["freeze"] and self.settled)

        if self.has("claims"):
            name = rnd.choice(names)
            when = rnd.choice(DATES) if rnd.random() < 0.6 else None
            st = ("claim", name, rnd.choice(AMOUNTS)) + ((when,) if when else ())
            if n >= SINCE["note_required"] and rnd.random() < 0.5:
                st = ("claim", name, rnd.choice(AMOUNTS), when, "n")
            extra = {}
            if self.has("ref") and rnd.random() < 0.3:
                extra["ref"] = rnd.choice(("R-1", " r-1 ", "R-2", "inv 7"))
            if self.has("tags") and rnd.random() < 0.4:
                extra["tags"] = rnd.choice(("a", "a, B", "b,a,a", " c "))
            if extra:
                st = ("claim", name, st[2], st[3] if len(st) > 3 else None, st[4] if len(st) > 4 else "", None, extra)
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
            st = ("void", name, idx)
            if m.void_reasons and rnd.random() < 0.8:
                st = st + (rnd.choice(m.void_reasons),)
            out.append((1.5, [st]))
        if self.has("due") and figure_moves_ok:
            st = ("rate", rnd.choice(GRADES), rnd.choice(RATES))
            if self.has("rate_dated") and rnd.random() < 0.4:
                froms = ("2026-03-01", "2026-03-10", "2026-03-16")
                if n >= hell.RULES["forward_only_rates"]:
                    # a from-date after today: forward-only once cp156 is in force (one draw either way)
                    froms = froms + ((m.today + timedelta(days=15)).isoformat(),)
                st = st + (rnd.choice(froms),)
                if self.has("rate_ended") and rnd.random() < 0.4:
                    st = st + (rnd.choice(("2026-03-12", "2026-03-25")),)
            out.append((2.0, [st]))
        if figure_moves_ok:
            f = {"grade": rnd.choice(GRADES)}
            if self.has("grade_dated") and rnd.random() < 0.5:
                f["grade_from"] = rnd.choice(DATES)
            if self.has("person_terms") and rnd.random() < 0.3:
                f = {"terms": rnd.choice(("3", "20", ""))}
            out.append((1.5, [("edit", rnd.choice(names), f)]))
        if self.has("today") and figure_moves_ok:
            later = m.today + timedelta(days=rnd.randint(5, 40))
            out.append((1.5, [("today", later.isoformat())]))
        if self.has("statement"):
            out.append((3.0, [("statement", rnd.choice(names))]))
        open_periods = [p for p in m.periods.values() if not p.closed and not p.soft]
        closed_periods = [p for p in m.periods.values() if p.closed or p.soft]
        if self.has("closed") and open_periods:
            out.append((1.5, [("close", rnd.choice(open_periods).name)]))
        if self.has("soft_close") and open_periods:
            out.append((1.0, [("soft_close", rnd.choice(open_periods).name)]))
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
            out.append((1.5, [("claim", name, "-" + rnd.choice(("1.00", "4.00", "10.25")), None, "", ("number", name, idx))]))
        if self.has("bulk") and len(drafts) >= 2:
            items = [(nm, i) for nm, i, _ in rnd.sample(drafts, min(len(drafts), rnd.choice((2, 3))))]
            out.append((1.0, [("bulk_open", items)]))
        if self.has("bulk_settle") and len(opens) >= 2:
            items = [(nm, i) for nm, i, _ in rnd.sample(opens, min(len(opens), rnd.choice((2, 3))))]
            steps = []
            if any(m.user == c.opened_by for nm, i, c in opens if (nm, i) in items):
                steps.append(("as", self.other_user(m.user)))
            out.append((1.2, steps + [("bulk_settle", items)]))
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
        if self.has("lock") and drafts:
            name, idx, _ = rnd.choice(drafts)
            other = self.other_user(m.user)
            steps = [("claim_edit_open", name, idx), ("as", other), ("claim_edit_open", name, idx), ("as", m.user)]
            steps.append(("claim_edit_save", name, idx, {"amount": rnd.choice(AMOUNTS)}) if rnd.random() < 0.7
                         else ("claim_edit_cancel", name, idx))
            out.append((0.8, steps))
        settings = []
        if self.has("floor"):
            settings.append(("floor", rnd.choice(("0.50", "2.00", "3.00"))))
        if self.has("late"):
            settings.append(("late-pct", rnd.choice(("10.00", "5.00", "0.00"))))
        if self.has("policy_date"):
            settings.append(("policy-date", rnd.choice(("2026-03-05", "2026-03-15", ""))))
        if self.has("roles"):
            settings.append(("clerk-limit", rnd.choice(("1.50", "3.00", ""))))
        if self.has("cap"):
            settings.append(("cap", rnd.choice(("2.00", "5.00", ""))))
        if self.has("proofs"):
            settings.append(("proof-threshold", rnd.choice(("1.00", "3.00", ""))))
        if n >= SINCE["note_required"]:
            settings.append(("note-threshold", rnd.choice(("1.00", "2.50", ""))))
        if self.has("entry_date"):
            settings.append(("entry-date", rnd.choice(("2026-03-01", ""))))
        if settings:
            k, v = rnd.choice(settings)
            st = ("setting", k, v)
            if self.has("settings_dated") and m._dated_key(k) and rnd.random() < 0.6:
                st = st + (rnd.choice(DATES),)
            out.append((1.0, [st]))
        if self.has("export"):
            out.append((0.3, [("export",)]))
        if n >= 14:
            out.append((0.3, [("claim2", rnd.choice(names), rnd.choice(AMOUNTS), rnd.choice(DATES), "")]))
        # ---- Act II actions
        if self.has("resettle") and settled and self.steward:
            name, idx, _ = rnd.choice(settled)
            out.append((1.0, [("as", self.steward), ("resettle", name, idx)]))
        if self.has("paste") and names:
            lines = []
            for _ in range(rnd.choice((1, 2, 3))):
                when = rnd.choice(DATES) if rnd.random() < 0.5 else ""
                note = rnd.choice(("", "paste", "a, b"))
                lines.append(f"{rnd.choice(names + (['Zed'] if rnd.random() < 0.2 else []))},"
                             f"{rnd.choice(AMOUNTS + ('x',)) if rnd.random() < 0.15 else rnd.choice(AMOUNTS)},{when},{note}")
            out.append((1.0, [("paste", lines)]))
        if self.has("deferred") and opens:
            name, idx, _ = rnd.choice(opens)
            later = m.today + timedelta(days=rnd.randint(3, 25))
            out.append((1.0, [("defer", name, idx, later.isoformat())]))
        if self.has("proofs") and (drafts or opens or pending):
            name, idx, _ = rnd.choice(drafts + opens + pending)
            out.append((1.0, [("proof", name, idx)]))
        if self.has("split") and opens:
            name, idx, c = rnd.choice(opens)
            part = rnd.choice(("0.01", "1.00", "4.00", "10.00"))
            out.append((1.0, [("split", name, idx, part)]))
        if self.has("notify"):
            name = rnd.choice(names)
            p = m.person(name)
            out.append((1.0, [("watch", name, m.user not in p.watchers)]))
        if self.has("delegation") and self.steward:
            user = self.other_user(self.steward)
            a, b = sorted(rnd.sample(DATES, 2))
            out.append((0.8, [("as", self.steward), ("delegate", user, a, b), ("as", user)]))
        if self.has("void_settled") and settled and self.steward:
            name, idx, _ = rnd.choice(settled)
            out.append((0.8, [("as", self.steward), ("void", name, idx)]))
        if self.has("redate") and self.steward and (opens or pending):
            name, idx, _ = rnd.choice(opens + pending)
            out.append((1.0, [("as", self.steward), ("redate", name, idx, rnd.choice(DATES))]))
        stated = [p.name for p in people if p.statements]
        if self.has("unstate") and self.steward and stated:
            out.append((0.8, [("as", self.steward), ("unstate", rnd.choice(stated))]))
        if self.has("statement_asof") and names:
            future = [d for d in DATES if hell.day(d) > m.today]
            when = rnd.choice(future) if future and rnd.random() < 0.2 else self.past_date()
            out.append((1.5, [("statement", rnd.choice(names), when)]))
        if self.has("bulk_grade") and len(names) >= 2:
            chosen = rnd.sample(names, 2)
            st = ("bulk_grade", chosen, rnd.choice(GRADES))
            if rnd.random() < 0.5:
                st = st + (rnd.choice(DATES),)
            out.append((0.8, [st]))
        if self.has("templates") and rnd.random() < 0.3:
            out.append((0.4, [("generate_periods", "2026-01-15", "2026-02-20")]))
        # ---- Act II, second half
        if self.has("remind") and (opens or pending):
            name, idx, _ = rnd.choice(opens + pending)
            out.append((1.0, [("remind", name, idx)]))
        if self.has("inline") and drafts:
            name, idx, _ = rnd.choice(drafts)
            out.append((1.0, [("inline", name, idx, rnd.choice(AMOUNTS))]))
        if self.has("comments") and (drafts or opens or pending):
            name, idx, _ = rnd.choice(drafts + opens + pending)
            out.append((0.8, [("comment", name, idx, rnd.choice(("ok", "see note", "")))]))
        if self.has("holidays") and rnd.random() < 0.3:
            out.append((0.6, [("holiday", rnd.choice(("2026-03-11", "2026-03-18", "2026-03-27", "2026-04-06")))]))
        if self.has("bulk_reassign") and self.steward and movable and len(names) >= 2:
            items = [(nm, i) for nm, i, _ in rnd.sample(movable, min(len(movable), rnd.choice((2, 3))))]
            out.append((0.8, [("as", self.steward), ("bulk_reassign", items, rnd.choice(names))]))
        if self.has("rate_preview"):
            out.append((0.8, [("rate_preview", rnd.choice(GRADES), rnd.choice(RATES))]))
        # ---- Act III actions
        if self.has("audit_view"):
            out.append((0.5, [("audit_view", rnd.choice(names + [""]))]))
        if self.has("aliases"):
            out.append((0.8, [("alias", rnd.choice(names), rnd.choice(("Al", " ada ", "Bee", "")))]))
        if self.has("templates_claim") and m.templates:
            out.append((1.0, [("claim_template", rnd.choice(names), "T1")]))
        if self.has("merge") and self.steward and len(names) >= 2:
            b, a = rnd.sample(names, 2)
            out.append((0.4, [("as", self.steward), ("merge", b, a)]))
        if self.has("transfer") and self.steward and names:
            out.append((0.4, [("as", self.steward), ("transfer", rnd.choice(names), "t")]))
        if self.has("import_people"):
            lines = [f"{rnd.choice(('Dot', 'Eve', names[0]))},{rnd.choice(GRADES)}"]
            if rnd.random() < 0.5:
                lines.append(f"Fay,{rnd.choice(GRADES)},{rnd.choice(('3', ''))},{rnd.choice(('fay@x', ''))}")
            out.append((0.7, [("import_people", lines)]))
        if self.has("delete_draft") and drafts:
            name, idx, _ = rnd.choice(drafts)
            steps = [("delete", name, idx)]
            if rnd.random() < 0.5:
                steps.append(("restore", name, idx))
            out.append((0.8, steps))
        if self.has("position") and len(names) >= 2:
            out.append((0.6, [("move", rnd.choice(names), rnd.choice(("up", "down")))]))
        if self.has("import_rates"):
            out.append((0.5, [("import_rates", [f"{rnd.choice(GRADES)},{rnd.choice(RATES)}",
                                                f"{rnd.choice(GRADES)},{rnd.choice(RATES)},2026-03-05"])]))
        if self.has("bulk_retire") and len(unretired) >= 2:
            chosen = rnd.sample(unretired, 2)
            out.append((0.4, [("bulk_retire", chosen, rnd.choice(DATES)), ("show_retired", True)]))
        retired_names = [p.name for p in people if p.retired_from]
        if self.has("unretire") and retired_names:
            out.append((0.8, [("show_retired", True), ("unretire", rnd.choice(retired_names))]))
        if self.has("plans") and m.plans:
            out.append((1.2, [("generate",)]))
        if self.has("sort"):
            out.append((0.4, [("sort", rnd.choice(("name", "grade", "due-total", "added")))]))
        if self.has("lines") and drafts:
            name, idx, _ = rnd.choice(drafts)
            out.append((0.8, [("line", name, idx, rnd.choice(("x", "y")), rnd.choice(("1", "3")), rnd.choice(("2.50", "0.01", "4.00")))]))
        if self.has("inline_grade") and names:
            out.append((0.8, [("inline_grade", rnd.choice(names), rnd.choice(GRADES))]))
        if self.has("bulk_redate") and self.steward and len(opens) >= 2:
            items = [(nm, i) for nm, i, _ in rnd.sample(opens, 2)]
            out.append((0.5, [("as", self.steward), ("bulk_redate", items, rnd.choice(DATES))]))
        if self.has("fiscal") and rnd.random() < 0.3:
            out.append((0.3, [("generate_fy", "2026")]))
        if self.has("tree_search"):
            out.append((0.4, [("search", rnd.choice(("a", "e", "zz")))]))
        # ---- Act IV actions
        review = self.claims("REVIEW")
        if self.has("review") and review and self.steward:
            name, idx, _ = rnd.choice(review)
            out.append((2.0, [("as", self.steward), ("review", name, idx)]))
        if self.has("review") and review:
            name, idx, _ = rnd.choice(review)
            out.append((0.5, [("void", name, idx) + ((rnd.choice(m.void_reasons),) if m.void_reasons else ())]))
        if self.has("waiver") and self.steward and (opens or pending):
            name, idx, _ = rnd.choice(opens + pending)
            out.append((0.8, [("as", self.steward), ("waive", name, idx)]))
        if self.has("claim_hold") and (opens or pending):
            name, idx, _ = rnd.choice(opens + pending)
            out.append((1.0, [("claim_hold", name, idx)]))
        if self.has("partial_settle") and opens:
            name, idx, c = rnd.choice(opens)
            steps = []
            if m.user == c.opened_by:
                steps.append(("as", self.other_user(c.opened_by)))
            out.append((1.0, steps + [("settle_part", name, idx, rnd.choice(("0.01", "1.00", "4.00")))]))
        if self.has("settle_date") and opens:
            name, idx, c = rnd.choice(opens)
            steps = []
            if m.user == c.opened_by:
                steps.append(("as", self.other_user(c.opened_by)))
            out.append((0.8, steps + [("settle", name, idx, self.past_date())]))
        if self.has("flags") and self.steward and names:
            out.append((0.6, [("as", self.steward), ("flag", rnd.choice(names), rnd.choice(("late", "check")), rnd.choice(("2026-03-12", "2026-04-30")))]))
        if self.has("approver") and names:
            out.append((0.5, [("approver", rnd.choice(names), rnd.choice(USERS))]))
        if self.has("notes"):
            out.append((0.4, [("note", rnd.choice(("hi", "", "x")))]))
        if self.has("period_lock") and self.steward and closed_periods:
            out.append((0.6, [("as", self.steward), ("lock", rnd.choice(closed_periods).name, True)]))
        if self.has("quarters") and rnd.random() < 0.3:
            out.append((0.3, [("generate_quarters", "2026")]))
        if self.has("opening_import") and m.periods and names:
            out.append((0.6, [("import_openings", [f"{rnd.choice(names)},{rnd.choice(list(m.periods))},{rnd.choice(('1.00', '5.50', 'x'))}"])]))
        if self.has("bulk_void") and len(drafts + opens) >= 2:
            items = [(nm, i) for nm, i, _ in rnd.sample(drafts + opens, 2)]
            st = ("bulk_void", items) + ((rnd.choice(m.void_reasons),) if m.void_reasons else ())
            out.append((0.5, [st]))
        if self.has("proofs") and self.has("proof_kinds") and (drafts or opens or pending):
            name, idx, _ = rnd.choice(drafts + opens + pending)
            out.append((0.8, [("proof", name, idx, rnd.choice(("receipt", "photo")))]))
        if self.has("activity"):
            out.append((0.3, [("activity",)]))
        if self.has("claim_timeline") and (drafts or opens or pending):
            name, idx, _ = rnd.choice(drafts + opens + pending)
            out.append((0.4, [("timeline", name, idx)]))
        # ---- Act V actions
        if self.has("snapshot_compare"):
            out.append((0.4, [("snapshot_compare", rnd.choice(TODAYS), rnd.choice(TODAYS + ("",)))]))
        own_plans = [(p.name, i) for p in people for i, _pl in enumerate([x for x in m.plans if x.person == m._key(p)])]
        if self.has("plan_pause") and own_plans:
            name, i = rnd.choice(own_plans)
            out.append((0.6, [("plan_pause", name, i, rnd.random() < 0.6)]))
        if self.has("plan_history") and own_plans:
            name, i = rnd.choice(own_plans)
            out.append((0.6, [("plan_amount", name, i, rnd.choice(AMOUNTS))]))
        if self.has("rollover") and self.steward and m.periods:
            out.append((0.3, [("as", self.steward), ("rollover", "2026")]))
        if self.has("rollover_undo") and self.steward and m.rollovers:
            out.append((0.4, [("as", self.steward), ("rollover_undo",)]))
        if self.has("compare"):
            out.append((0.3, [("compare", rnd.choice(("p", "")))]))
        if self.has("shared") and (drafts or opens) and len(names) >= 2:
            name, idx, _ = rnd.choice(drafts + opens)
            out.append((0.8, [("share", name, idx, rnd.choice([x for x in names if x != name]), rnd.choice(("50.00", "25.00", "100.00")))]))
        if self.has("review_assign") and self.steward and review:
            name, idx, _ = rnd.choice(review)
            out.append((0.6, [("as", self.steward), ("assign_review", name, idx, rnd.choice(USERS))]))
        if self.has("grade_retire") and rnd.random() < 0.3:
            out.append((0.3, [("grade_retire", rnd.choice(GRADES))]))
        if self.has("grade_merge") and self.steward:
            a, b = rnd.sample(GRADES, 2)
            out.append((0.3, [("as", self.steward), ("grade_merge", a, b)]))
        if self.has("preview") and rnd.random() < 0.5:
            later = m.today + timedelta(days=rnd.randint(5, 40))
            out.append((0.5, [("preview", later.isoformat()), ("check", mid_check(n)), ("preview_clear",)]))
        if self.has("due_by_override") and self.steward and (opens or pending):
            name, idx, _ = rnd.choice(opens + pending)
            out.append((0.6, [("as", self.steward), ("set_due_by", name, idx, rnd.choice(DATES))]))
        if self.has("bulk_hold") and len(names) >= 2:
            chosen = rnd.sample(names, 2)
            a, b = sorted(rnd.sample(DATES, 2))
            out.append((0.4, [("bulk_hold", chosen, a, b)]))
        if self.has("merge_undo") and self.steward and m.merges:
            rec = m.merges[-1]
            out.append((0.6, [("as", self.steward), ("merge_undo", rec["into"].name)]))
        if self.has("rate_withdraw") and self.steward and m.rates:
            row = rnd.choice(m.rates)
            out.append((0.4, [("as", self.steward), ("withdraw_rate", row[0], row[1].isoformat() if row[1] else None)]))
        if self.has("policy_view"):
            out.append((0.3, [("policy",)]))
        if self.has("export_periods") and rnd.random() < 0.2:
            out.append((0.2, [("export_periods",)]))
        if self.has("dups"):
            out.append((0.3, [("dups",)]))
        if self.has("export_statement") and names and rnd.random() < 0.3:
            out.append((0.3, [("export_statement", rnd.choice(names))]))
        out.append((0.8, [("as", self.other_user(m.user))]))
        return out


def generate(n: int, i: int) -> list[tuple]:
    return _Gen(n, i).run()

"""Reference model of the stream (cp1-80): the sheet, its users, people, claims and figures.

Everything the agent and the gate see is generated from this module by `harness.stream_build`: the
requests in checkpoints.yaml (REQUESTS below, beside the code that defines each rule), every spec
(from the scripts in harness/oracle/hell_scripts.py) and every ripple copy. Edit the model or a
script, then rebuild; never hand-edit a spec.

The model is a stateful simulator of what a test does through the screens, at checkpoint `k`: each
script step is applied with the model's methods and the figures are read back with `Model.view()`.
A rule is active when `k >= RULES[name]` and the name is not in `off` (ablation: an app that
ignored that rule; `harness.stream_build --check` requires every rule a spec needs to bite).

Figures (two decimals, dot, no grouping; `n/a` when undefined):
  claim due            frozen at settle (cp10, re-frozen cp46); else the STATED base (cp15: a
                       statement binds the figure a claim had when it was stated) or the live base:
                       amount x rate(grade in force on the claim date, rate in force on it) / 100,
                       rounded half up (cp7), half even (cp12), by the policy date (cp32; a
                       correction by the date of the claim it corrects), at least the floor (cp24,
                       not for a correction; in force on the claim's date cp48); plus the late charge
                       (cp26) on top of the base, stated or not (per 30-day boundary cp56); the floor
                       applied after the late charge (cp64)
  claimed / due-total  over the claims that COUNT: every claim (cp5), OPEN+SETTLED (cp8, PENDING
                       counts as open cp36), minus a held person's open claims (cp22) or those dated
                       inside the hold (cp40; a stated claim stays), a deferred claim (cp50), a
                       retired person's open claims (cp72). Person due-total is the rounded total
                       amount x rate (cp7) until cp12 makes it the sum of the claim figures; capped
                       (cp43). Sheet totals are trimmed (cp60).
  ROLLUP / TOTALS      cp16: every write that changes a person's claimed or due-total (or brings a
                       person into being) is followed in the audit by one ROLLUP line per person
                       changed, in list order, then TOTALS when the sheet's totals changed; the
                       overdue-total moves it too from cp44.
  statement as-of (cp73) a statement taken as of a date binds the person's claims to their
                       figures as they stood at the end of that day, and writes asof= in the audit.
  as-of (cp74)         every cell as it stood at the end of the last sheet-today on or before a
                       date: the model replays its journal of successful writes up to that day.
"""
from __future__ import annotations

import csv
import io
from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import ROUND_HALF_EVEN, ROUND_HALF_UP, Decimal

COVERAGE = (1, 150)
GRADES = ("A", "B", "C")
STATUSES = ("DRAFT", "OPEN", "PENDING", "SETTLED", "VOID")

# Rule name -> first checkpoint it is in force. Each is ablatable (an app that ignores it).
RULES = {
    "names": 4,          # unique, trimmed, case-insensitive names
    "status": 8,         # only OPEN/SETTLED claims count
    "number": 9,         # gapless numbering on open
    "freeze": 10,        # settle freezes due
    "rate_dated": 11,    # a rate applies from its from-date
    "half_even": 12,     # live figures round half to even; totals sum rounded figures
    "four_eyes": 13,     # the opener cannot settle
    "conflict": 14,      # a stale edit is refused; a double submit stores once
    "statement": 15,     # a statement binds the figures it states (path dependence)
    "rollup": 16,        # write-time ROLLUP/TOTALS audit lines after every write that moves a figure
    "period": 17,        # a claim belongs to the period containing its date
    "closed": 18,        # a closed period refuses changes and keeps its total
    "immutable": 20,     # an OPEN claim cannot be edited; a void keeps its number
    "retire": 21,        # no claims dated after retirement
    "hold": 22,          # a held person's open claims leave every live total
    "clerk_limit": 23,   # a clerk settles only up to the limit
    "floor": 24,         # a live, unstated base is at least the floor
    "overdue": 25,       # due-by and overdue
    "late": 26,          # late charge per full 30 days, on top of the base (stated or live)
    "backing": 27,       # patrons and backing
    "grade_dated": 28,   # a claim uses the grade in force on its date
    "steward_reopen": 29,
    "correction": 30,
    "policy_date": 32,   # before the policy date round half up; a correction by its target's date
    "period_number": 35, # per-period numbering from a date
    "pending": 36,       # over the limit goes to PENDING
    "pending_live": 36,  # a PENDING claim is not bound by a statement
    "reassign_unstates": 37,   # a reassigned claim loses its stated figure
    "terms_fixed": 38,   # due-by fixed at creation from the grade's terms
    "hold_interval": 40, # hold has from/to; only claims dated inside leave totals
    "hold_stated": 40,   # a stated claim stays in the totals through a hold
    # ---- Act II
    "rate_ended": 42,    # a rate may end; after its end with no later rate, due is n/a
    "cap": 43,           # a person's due-total is capped; the excess is shown
    "rollup_overdue": 44,  # ROLLUP/TOTALS also when an overdue-total moves, and carry it
    "bulk_settle": 45,   # selected claims settle together, in list order
    "resettle": 46,      # a steward re-freezes a settled claim under today's rules
    "settings_dated": 48,  # floor, late-pct, terms, limits apply from a date
    "paste_atomic": 49,  # a paste of claims is all-or-nothing
    "deferred": 50,      # a deferred claim counts nowhere until its date
    "proofs": 51,        # above the proof threshold, no settle without a proof
    "period_asof": 52,   # a period counts a claim by its status on the period's end date
    "perms": 53,         # the permission matrix decides who may act
    "viewer": 54,        # a viewer changes nothing
    "auto_close": 55,    # periods close themselves after the grace days
    "late_boundary": 56, # the late charge is worked out per 30-day boundary
    "split": 57,         # an open claim can be split
    "notify": 58,        # watchers are notified of a settle
    "templates": 59,     # monthly periods are generated
    "trim": 60,          # sheet-wide totals drop the highest and lowest person
    "delegation": 61,    # a steward delegates the role for a date range
    "archive": 62,       # an archived sheet refuses every change
    "person_terms": 63,  # a person's own terms win over the grade's and the sheet's
    "floor_last": 64,    # the floor is applied after the late charge
    "void_settled": 65,  # a steward voids a settled claim within 7 days, reversing its figure
    "redate": 66,        # a steward re-dates an open claim; a period change renumbers it
    "backing_recent": 68,  # backing is the patrons' settled figures of the last 90 days
    "lock": 69,          # an open editor locks the claim for other users
    "soft_close": 70,    # a soft-closed period fixes its total but takes late entries
    "unstate": 71,       # a steward cancels the last statement
    "retire_excludes": 72,  # a retired person's open claims leave the live totals
    "statement_asof": 73,  # a statement as of a date binds the figures as they stood then
    "asof": 74,          # the as-of view renders every cell as of a date
    "bulk_grade": 75,    # selected people get a dated grade together
    "snapshot": 76,      # SNAPSHOT lines on every change of the sheet's today
    "note_required": 77, # above the note threshold, no open with an empty note
    "entry_date": 79,    # the entry date is the default claim date
    "period_due_by": 80, # a claim belongs to the period containing its due-by date
    # ---- Act II, second half (cp81-100): time, permissions, write paths, surfaces
    "remind": 81,        # REMIND once per claim per sheet-day
    "split_totals": 82,  # settled-total and open-total per person and for the sheet
    "holidays": 83,      # a due-by on a holiday moves to the next day that is not one
    "business_days": 84, # terms count business days (weekends and holidays skipped)
    "grace": 85,         # per-grade grace days before a claim is overdue
    "inline_edit": 86,   # a draft's amount can be edited in the row
    "ext_ref": 87,       # an external reference, unique per sheet
    "compound_late": 88, # each late boundary charges on the figure plus the earlier charges
    "tags": 89,          # claim tags and a due-total per tag
    "void_reasons": 90,  # with a reason list, a void needs a reason from it
    "comments": 91,      # comments on a claim, by user and sheet-day
    "four_eyes_editor": 92,  # the last editor cannot settle or approve either
    "bulk_reassign": 93, # selected claims reassigned together
    "proof_grade": 94,   # a per-grade proof threshold wins over the sheet's
    "rate_preview": 95,  # what a candidate rate would change, nothing saved
    "holidays_redate": 96,  # a new holiday re-fixes the due-by of unsettled claims
    "monthly": 97,       # a due-total per calendar month of the claim date
    "batch": 98,         # a bulk settle that settles anything is a numbered batch
    "contact": 99,       # a person's contact, normalised and unique
    "batch_atomic": 100, # a bulk settle is all-or-nothing and writes BATCH_SETTLED
    # ---- Act III (cp101-150): identity, hierarchy, cross-sheet
    "audit_view": 101,   # the audit lines on screen, newest first, filtered by person
    "aliases": 102,      # aliases share the name's uniqueness and find the person
    "templates_claim": 103,  # claims made from a template take its values at that moment
    "reassign_renumbers": 104,  # a reassigned claim gets the next number
    "pools": 105,        # pools of members with shares; balanced at 100.00
    "cuts": 106,         # cuts of the pot, remainder to the largest share
    "merge": 107,        # a steward merges one person into another
    "patron_shares": 108,  # patrons carry equal shares; backing is share-weighted
    "parent": 109,       # a parent sheet lends its rates
    "consolidated": 110, # a parent shows figures over its tree
    "transfer": 111,     # a steward moves a person with their claims to another sheet
    "tree_names": 112,   # names and aliases are unique across the tree; clashes are marked
    "import_people": 113,  # people pasted in, all-or-nothing
    "delete_draft": 114, # a draft can be deleted and restored on the same sheet-day
    "nested_pools": 115, # a pool can be a member of a pool
    "import_upsert": 116,  # an import line matching a person updates them
    "position": 117,     # people can be moved up and down the list
    "import_rates": 118, # rates pasted in, all-or-nothing
    "cut_rows": 119,     # a person's cut total on the row and for the sheet
    "hold_pools": 120,   # a held member gets no cut; the share is spread
    "history_follows": 121,  # a transferred person's audit lines follow them
    "pool_dated": 122,   # a membership has dates
    "bulk_retire": 123,  # selected people retired together
    "retired_share": 124,  # a retired member's share is spread over the others
    "unretire": 125,     # a retired person can be unretired, the history kept
    "clone": 126,        # a sheet can be cloned to a fresh id
    "my_figures": 127,   # the signed-in user's own person's figures in the header
    "transfer_merges": 128,  # a transfer onto a matching name merges
    "period_change": 130,  # the summary shows each period's change from the previous
    "plans": 131,        # plans generate draft claims every N days
    "tree_numbering": 132,  # a tree shares one sheet-wide number sequence
    "person_tags": 133,  # a person's tags count their claims in the tag totals
    "sort": 134,         # the list can be sorted on screen
    "bindings_follow": 136,  # merged and transferred claims keep their bound figures
    "lines": 137,        # a draft's amount can be the sum of its lines
    "inline_grade": 138, # the row's grade select
    "tree_audit": 139,   # the audit viewer on a parent shows the children's lines
    "remainder_smallest": 140,  # the remainder goes to the smallest non-zero cut
    "monthly_plans": 141,  # a plan may run monthly on a day of month
    "plan_preview": 142, # a plan shows its next five dates
    "fiscal": 143,       # a fiscal year start month; periods show their fiscal year
    "fy_numbering": 144, # numbers restart per fiscal year
    "bulk_redate": 145,  # selected claims re-dated together
    "alert": 146,        # ALERT when a due-total crosses the alert threshold
    "snapshot_view": 147,  # a person's SNAPSHOT lines on the row
    "claimed_no_corrections": 148,  # claimed leaves corrections out
    "period_cap": 149,   # a period caps open claims per person
    "tree_search": 150,  # a search over the tree
}

# Feature -> first checkpoint it exists (screens, cells, audit fields). Not ablatable: what the
# agent built at that checkpoint is there whether or not a later rule is honoured.
SINCE = {
    "today": 2, "claims": 5, "audit": 6, "due": 7, "status": 8, "number": 9, "freeze": 10,
    "rate_dated": 11, "opened_by": 13, "statement": 15, "period": 17, "closed": 18, "quick": 19,
    "retire": 21, "hold": 22, "roles": 23, "floor": 24, "overdue": 25, "late": 26, "backing": 27,
    "grade_dated": 28, "reopen": 29, "correction": 30, "summary": 31, "policy_date": 32,
    "export": 33, "bulk": 34, "period_number": 35, "pending": 36, "reassign": 37, "terms_fixed": 38,
    "log": 39, "hold_interval": 40,
    "header": 41, "rate_ended": 42, "cap": 43, "bulk_settle": 45, "resettle": 46,
    "person_period": 47, "settings_dated": 48, "paste": 49, "deferred": 50, "proofs": 51,
    "perms": 53, "viewer": 54, "auto_close": 55, "split": 57, "notify": 58, "templates": 59,
    "delegation": 61, "archive": 62, "person_terms": 63, "void_settled": 65, "redate": 66,
    "active": 67, "lock": 69, "soft_close": 70, "unstate": 71, "statement_asof": 73, "asof": 74,
    "bulk_grade": 75, "note_required": 77, "age": 78, "entry_date": 79,
    "remind": 81, "split_totals": 82, "holidays": 83, "inline": 86, "ref": 87, "tags": 89,
    "void_reasons": 90, "comments": 91, "bulk_reassign": 93, "rate_preview": 95, "monthly": 97,
    "batch": 98, "contact": 99,
    "audit_view": 101, "aliases": 102, "templates_claim": 103, "pools": 105, "cuts": 106, "merge": 107,
    "parent": 109, "consolidated": 110, "transfer": 111, "clashing": 112, "import_people": 113,
    "delete_draft": 114, "import_upsert": 116, "position": 117, "import_rates": 118, "cut_rows": 119,
    "origin": 121, "bulk_retire": 123, "unretire": 125, "clone": 126, "my_figures": 127,
    "export_claims": 129, "period_change": 130, "plans": 131, "person_tags": 133, "sort": 134,
    "export_pools": 135, "lines": 137, "inline_grade": 138, "plan_preview": 142, "fiscal": 143,
    "bulk_redate": 145, "snapshot_view": 147, "period_cap": 149, "tree_search": 150,
}

# Cell -> first checkpoint a spec may assert it (the generator asserts every cell in force).
CELL_SINCE = {
    "person-name": 3, "person-grade": 3, "person-claimed": 5, "person-due-total": 7,
    "person-statement-count": 15, "person-stated-total": 15, "person-statement-date": 15,
    "person-retired": 21, "person-retired-from": 21, "person-hold": 22,
    "person-overdue-count": 25, "person-overdue-total": 25, "person-patrons": 27, "person-backing": 27,
    "person-excess": 43, "person-watched": 58, "person-terms": 63, "person-active": 67,
    "person-aged-0-30": 78, "person-aged-31-60": 78, "person-aged-61": 78,
    "claim-amount": 5, "claim-date": 5, "claim-note": 5, "claim-due": 7, "claim-status": 8,
    "claim-number": 9, "claim-opened-by": 13, "claim-stated": 15, "claim-period": 17,
    "claim-due-by": 25, "claim-overdue": 25, "claim-corrects": 30, "claim-log": 39,
    "claim-deferred": 50, "claim-deferred-until": 50, "claim-proofs": 51, "claim-split-from": 57,
    "claim-late-entry": 70,
    "claim-reminded": 81, "person-settled-total": 82, "person-open-total": 82, "claim-ref": 87,
    "claim-tags": 89, "claim-comments": 91, "claim-batch": 98, "person-contact": 99,
    "person-aliases": 102, "person-clashing": 112, "person-cut-total": 119, "person-origin": 121,
    "person-retirement": 125, "person-tags": 133, "claim-lines": 137, "person-snapshot": 147,
}

# Sheet-level cell -> first checkpoint a spec may assert it (a spec written at n asserts only the
# header, summary, rollup, period and sheet cells its checkpoint knows). Tried in order: the
# first pattern (a prefix, with `*` for one path segment) that matches decides.
TOP_SINCE = [
    ("rollup-claimed-total", 5), ("rollup-due-total", 7), ("rollup-overdue-count", 25),
    ("rollup-overdue-total", 25),
    ("period-due-total", 17), ("period-closed", 18),
    ("sheet-archived", 62), ("sheet-asof", 74),
    ("summary-grade-*-active", 67), ("summary-void-", 90), ("summary-period-*-change", 130),
    ("summary-", 31),
    ("header-", 41),
    ("rollup-settled-total", 82), ("rollup-open-total", 82), ("tag-", 89), ("month-", 97),
    ("bulk-settle-batch", 98),
    ("sheet-parent", 109), ("consolidated-", 110),
    ("my-", 127), ("rollup-cut-total", 119), ("period-fy", 143), ("period-cap", 149),
]


def top_since(tid: str) -> int:
    """The checkpoint from which a sheet-level cell may be asserted (see TOP_SINCE)."""
    import re as _re
    for pat, since in TOP_SINCE:
        if "*" in pat:
            rx = "^" + _re.escape(pat).replace(r"\*", ".+") + "$"
            if _re.match(rx, tid):
                return since
        elif tid.startswith(pat):
            return since
    raise KeyError(tid)


DEFAULT_FLOOR = Decimal("1.00")
DEFAULT_TERMS = 14
DATED_SETTINGS = ("floor", "late-pct", "terms", "clerk-limit", "cap", "proof-threshold", "note-threshold")
DATED_PREFIXES = ("terms-", "grace-", "proof-threshold-")
SHEET_SETTINGS = ("parent",)   # settings whose value is a sheet id
PERM_DEFAULT = {"open": ("clerk", "steward"), "settle": ("clerk", "steward"), "void": ("clerk", "steward"),
                "close": ("clerk", "steward"), "reassign": ("steward",), "reopen": ("steward",)}


# Writes one sheet makes on another's behalf (a transfer's arrival, a clone's filling): journaled
# nowhere, since the write that caused them replays them.
INNER_WRITES = {"receive_person", "receive_clone"}


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
    statements: int = 0                              # statements taken (cp15)
    stated_total: str | None = None                  # the last statement's due-total text
    stated_on: date | None = None
    statement_log: list = field(default_factory=list)  # [(due-total text, date, [claim seqs])] (cp71)
    terms: int | None = None                         # the person's own terms (cp63)
    watchers: list = field(default_factory=list)     # users watching, in order (cp58)
    contact: str = ""                                # normalised contact, unique (cp99)
    aliases: list = field(default_factory=list)      # as given, trimmed (cp102)
    origin: str = ""                                 # the sheet a transfer brought them from (cp121)
    retirements: list = field(default_factory=list)  # [(from, to)] past retirements (cp125)
    tags: list = field(default_factory=list)         # cp133
    snapshots: list = field(default_factory=list)    # [(date, due-total text)] (cp147)
    alerted: bool = False                            # above the alert threshold since the last ALERT (cp146)
    var: str = ""                                    # TS variable the renderer gives the row id

    def keys(self) -> set:
        return {norm_name(self.name)} | {norm_name(a) for a in self.aliases}


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
    stated: object = None                            # None (unstated) | Decimal | "n/a" (cp15)
    history: list = field(default_factory=list)      # [(status, user, date, due_text)]
    idx: int = 0                                     # index within the person's claims
    seq: int = 0                                     # creation order on the sheet
    deferred_until: date | None = None               # cp50
    proofs: int = 0                                  # cp51
    split_from: str = ""                             # the number of the claim this was split off (cp57)
    late_entry: bool = False                         # added into a soft-closed period (cp70)
    reminded: list = field(default_factory=list)     # sheet-days a REMIND was written (cp81)
    terms_days: int | None = None                    # the terms the due-by was fixed with (cp96)
    edited_by: str | None = None                     # the last user to edit it (cp92)
    ref: str = ""                                    # external reference (cp87)
    tags: list = field(default_factory=list)         # sorted, normalised (cp89)
    void_reason: str = ""                            # cp90
    comments: list = field(default_factory=list)     # [(user, date, text)] (cp91)
    batch: str = ""                                  # the bulk-settle batch that settled it (cp98)
    lines: list = field(default_factory=list)        # [(label, qty, unit)] (cp137)
    plan: int | None = None                          # the plan that generated it (cp131)
    deleted_on: date | None = None                   # cp114
    var: str = ""


@dataclass
class Member:
    kind: str                                        # "person" | "pool"
    key: str                                         # person key or pool name
    share: Decimal
    order: int
    start: date | None = None                        # cp122
    end: date | None = None


@dataclass
class Pool:
    name: str
    order: int
    members: list = field(default_factory=list)


@dataclass
class Plan:
    pid: int
    person: str
    amount: Decimal
    start: date
    every: int | None                                # days (None for a monthly plan)
    day: int | None                                  # day of month (cp141)
    end: date
    generated: list = field(default_factory=list)    # dates a claim was made for
    var: str = ""


@dataclass
class Period:
    name: str
    start: date
    end: date
    cap: int | None = None                           # cp149
    closed: bool = False
    soft: bool = False
    frozen_total: str | None = None
    frozen_people: dict = field(default_factory=dict)   # id(person) -> text (cp47)


def write(fn):
    """A write: when the rollup rule is in force, the action's own audit lines are followed by
    ROLLUP person=<name> claimed=<x> due-total=<y> for every person whose figures differ from
    before the write (a person who did not exist before counts as changed), in list order, then
    TOTALS claimed-total=<x> due-total=<y> when the sheet's totals differ. A refused write (an
    exception) writes nothing. Writes nest (quick-add, bulk open): the inner ones report. Every
    successful top-level write is journaled for the as-of replay (cp73, cp74), in a replay too so
    that a statement as of a date (cp73) inside the replay can replay in turn. A write is refused
    outright under the user's as-of view (cp74), on an archived sheet (cp62) and by a viewer (cp54)."""
    def inner(self, *a, **kw):
        if self._depth == 0 and not self._replay:
            if self.on("asof") and self.asof.get(self.user):
                raise Refused("as-of")
            if self.on("archive") and self.archived:
                raise Refused("archived")
            if self.on("viewer") and self.role() == "viewer":
                raise Refused("viewer")
        today_before = self.today
        if not self.on("rollup") or self._replay:
            self._depth += 1
            try:
                result = fn(self, *a, **kw)
            finally:
                self._depth -= 1
            self._journal(fn.__name__, a, kw, today_before)
            return result
        before, tot_before = self._figures()
        self._depth += 1
        try:
            result = fn(self, *a, **kw)
        finally:
            self._depth -= 1
        after, tot_after = self._figures()
        for pid, (p, *figs) in sorted(after.items(), key=lambda kv: kv[1][0].order):
            was = before.get(pid)
            if was is None or list(was[1:]) != figs:
                fields = [("person", p.name, 16), ("claimed", figs[0], 16), ("due-total", figs[1], 16)]
                if self.on("rollup_overdue"):
                    fields.append(("overdue-total", figs[2], 44))
                self.audit_line("ROLLUP", *fields)
        if tot_before != tot_after:
            fields = [("claimed-total", tot_after[0], 16), ("due-total", tot_after[1], 16)]
            if self.on("rollup_overdue"):
                fields.append(("overdue-total", tot_after[2], 44))
            self.audit_line("TOTALS", *fields)
        self._alerts(after)
        self._journal(fn.__name__, a, kw, today_before)
        return result
    inner.__name__ = fn.__name__
    inner.__doc__ = fn.__doc__
    return inner


class Model:
    """One sheet. Sheets that know of each other (a parent, a transfer target, a clone) share a
    `family` {sheet id: Model}; what belongs to a user's SCREEN rather than to a sheet (the
    show-retired box, the as-of date, later the locale, the hidden columns and the preview date)
    lives in `screen`, shared by the family, since loading another sheet leaves the screen as it
    is."""

    def __init__(self, k: int, sheet: str = "S", off=(), family: dict | None = None,
                 screen: dict | None = None):
        self.k, self.sheet, self.off = k, sheet, set(off)
        self.family: dict = family if family is not None else {}
        self.family[sheet] = self
        self.screen: dict = screen if screen is not None else {
            "show_retired": set(), "asof": {}, "locale": {}, "columns": {}, "preview": {}, "seq": [0]}
        self.grades: list[str] = list(GRADES)
        self.user: str | None = None
        self.today: date = date(2026, 1, 1)
        self.people: dict[str, Person] = {}
        self.claims: list[Claim] = []
        self.rates: list[tuple] = []                  # (grade, from|None, value, to|None)
        self.periods: dict[str, Period] = {}
        self.roles: dict[str, str] = {}
        self.settings: dict[str, list] = {}           # key -> [(from|None, value)] in order set
        self.counter = 0
        self.period_counters: dict[str, int] = {}
        self.audit: list = []
        self.editing: dict[str, tuple[str, int]] = {}    # user -> (person key, version seen)
        self.locks: dict[int, str] = {}                  # claim seq -> user holding its editor (cp69)
        self.delegations: list[tuple] = []               # (user, from, to, steward) (cp61)
        self.archived = False                            # cp62
        self.watching: dict[str, set] = {}               # user -> person keys (cp58)
        self.journal: list = []                          # (user, today, method, args, kwargs)
        self.holidays: set = set()                       # cp83
        self.void_reasons: list = []                     # cp90
        self.tags_seen: list = []                        # every tag used on the sheet, in order (cp89)
        self.batch_counter = 0                           # cp98
        self.last_batch = ""
        self.pools: dict[str, Pool] = {}                 # cp105
        self.templates: dict[str, tuple] = {}            # name -> (amount, note) (cp103)
        self.plans: list[Plan] = []                      # cp131
        self.clone_of: str | None = None                 # cp126
        self.fy_counters: dict[str, int] = {}            # cp144
        self._depth = 0
        self._replay = False

    @property
    def show_retired(self) -> set:
        return self.screen["show_retired"]

    @property
    def asof(self) -> dict:
        return self.screen["asof"]

    def sibling(self, sheet: str) -> "Model":
        """The family member with this id, made (empty, same checkpoint and ablation) on first
        use; the current user carries over, as a screen does when it loads another sheet."""
        m = self.family.get(sheet)
        if m is None:
            m = Model(self.k, sheet, self.off, family=self.family, screen=self.screen)
        m.user = self.user
        return m

    # ---- rules -----------------------------------------------------------------------------
    def on(self, rule: str) -> bool:
        return self.k >= RULES[rule] and rule not in self.off

    def on_if(self, rule: str) -> bool:
        """A rule that a later act may add: off until it is in RULES."""
        return rule in RULES and self.on(rule)

    def has(self, feature: str) -> bool:
        return self.k >= SINCE[feature]

    def _journal(self, name: str, a: tuple, kw: dict, today_before: date) -> None:
        """Journal a top-level write for the as-of replay; a write in INNER_WRITES is one sheet's
        part of another sheet's write (a transfer's arrival) and is replayed through that write."""
        if self._depth == 0 and name not in INNER_WRITES:
            self.screen["seq"][0] += 1
            self.journal.append((self.screen["seq"][0], self.user, today_before, name, a, kw))

    def delegator(self, user: str | None = None) -> str | None:
        """The steward whose role `user` holds today by delegation (the latest one in force)."""
        if not self.on("delegation"):
            return None
        user = user or self.user
        found = None
        for u, s, e, steward in self.delegations:
            if u == user and s <= self.today <= e:
                found = steward
        return found

    def audit_line(self, event: str, *fields) -> None:
        """Record an audit line: `fields` are (key, value, since) triples, `since` being the
        checkpoint that added that field. The renderer keeps the fields a spec's checkpoint knows
        (audit_text), and the spec matches a line by prefix, so a later field extends a line
        without changing it. A line written by a delegate (not ROLLUP/TOTALS) ends with
        for=<steward> (cp61)."""
        if not self.has("audit") or self._replay:
            return
        fields = list(fields)
        if event not in ("ROLLUP", "TOTALS"):
            by = self.delegator()
            if by:
                fields.append(("for", by, 61))
        self.audit.append((event, self.user, [(a, str(b), s) for a, b, s in fields if s <= self.k]))

    def _figures(self) -> tuple[dict, tuple]:
        """Every person's (claimed, due-total[, overdue-total]) by identity, and the sheet's totals:
        what a write is compared against to decide the ROLLUP/TOTALS lines (cp16, cp44)."""
        out = {}
        more = self.on("rollup_overdue")
        for p in self.people.values():
            v = self.due_total(p)
            figs = [p, money(self.claimed(p)), "n/a" if v is None else money(v)]
            if more:
                figs.append(money(self.overdue_total(p)))
            out[id(p)] = tuple(figs)
        tot = [money(self.sheet_claimed()), money(self.sheet_due())]
        if more:
            tot.append(money(self.overdue_total()))
        return out, tuple(tot)

    def role(self, user: str | None = None) -> str:
        if not self.has("roles"):
            return "clerk"
        user = user or self.user
        if self.delegator(user):
            return "steward"
        return self.roles.get(user, "clerk")

    def _perm(self, action: str, default_ok: bool) -> bool:
        """Whether the current user may take `action`: the permission matrix when it names the
        action (cp53), else the rule in force before it."""
        if self.on("perms"):
            raw = self.setting(f"perm-{action}")
            if raw:
                return self.role() in [r.strip() for r in raw.split(",") if r.strip()]
        return default_ok

    # ---- settings (dated from cp48) --------------------------------------------------------
    def _dated_key(self, key: str) -> bool:
        return key in DATED_SETTINGS or key.startswith(DATED_PREFIXES)

    def setting_at(self, key: str, when: date | None, default=None):
        """The setting's raw text in force on `when` (a dated key under the dated-settings rule:
        the latest from-date on or before it; a value with no from-date applies from the beginning),
        else the last value set. Blank means unset: the default."""
        rows = self.settings.get(key) or []
        if not rows:
            return default
        if self.on("settings_dated") and self._dated_key(key) and when is not None:
            cands = [r for r in rows if r[0] is None or r[0] <= when]
            if not cands:
                return default
            cands.sort(key=lambda r: r[0] or date.min)
            val = cands[-1][1]
        else:
            val = rows[-1][1]
        return val if val != "" else default

    def setting(self, key: str, default=None):
        return self.setting_at(key, self.today, default)

    @write
    def set_setting(self, key: str, value: str, start: str | None = None) -> None:
        s = day(start) if (start and self.has("settings_dated")) else None
        if key == "parent" and self.on("parent") and value:
            if value == self.sheet or value not in self.family:
                raise Refused("settings-error")
            target = self.family[value]
            if self in [target] + target.ancestors():
                raise Refused("settings-error")
        if key == "fiscal-start-month" and self.on("fiscal") and value:
            if not value.isdigit() or not 1 <= int(value) <= 12:
                raise Refused("settings-error")
        if key == "alert-threshold" and self.on("alert") and value:
            try:
                D(value)
            except Exception:
                raise Refused("settings-error")
        rows = self.settings.setdefault(key, [])
        if self.on("settings_dated") and self._dated_key(key):
            s = s or self.today          # the from-date defaults to the sheet's today
            rows[:] = [r for r in rows if r[0] != s] + [(s, value)]
        else:
            rows.append((None, value))
        self.audit_line("SETTING_CHANGED", ("key", key, 23), ("value", value, 23),
                        *([("from", start, 48)] if start else []))

    @write
    def set_today(self, d: str) -> None:
        new = day(d)
        if self.on("snapshot"):
            for p in sorted(self.people.values(), key=lambda x: x.order):
                v = self.due_total(p)
                text = "n/a" if v is None else money(v)
                self.audit_line("SNAPSHOT", ("name", p.name, 76), ("due-total", text, 76))
                p.snapshots.append((self.today, text))
        self.today = new
        if self.on("lock"):
            self.locks.clear()
        if self.on("auto_close"):
            grace = self.setting("grace-days")
            if grace not in (None, ""):
                g = int(grace)
                for per in sorted((x for x in self.periods.values() if not x.closed and not x.soft),
                                  key=lambda x: x.end):
                    if per.end + timedelta(days=g) < new:
                        self._close(per, auto=True)

    # ---- people ---------------------------------------------------------------------------
    def find_person(self, name: str) -> Person | None:
        """The person with this name, or (cp102) this alias."""
        key = norm_name(name)
        p = self.people.get(key)
        if p is None and self.on("aliases"):
            p = next((q for q in self.people.values() if key in q.keys()), None)
        return p

    def person(self, name: str) -> Person:
        p = self.find_person(name)
        if p is None:
            raise KeyError(name)
        return p

    def _taken(self, key: str, exclude: Person | None = None, tree: bool = True) -> bool:
        """Whether a normalised name is in use: by a person's name or (cp102) alias on this sheet,
        or (cp112) on any other sheet of the tree."""
        for q in self.people.values():
            if q is exclude:
                continue
            if norm_name(q.name) == key or (self.on("aliases") and key in q.keys()):
                return True
        if tree and self.on("tree_names"):
            for m in self.tree():
                if m is not self and m._taken(key, tree=False):
                    return True
        return False

    def clashing(self, p: Person) -> bool:
        """cp112: the person's name or an alias is also used on another sheet of the tree."""
        if not self.on("tree_names"):
            return False
        return any(m._taken(k, tree=False) for m in self.tree() if m is not self for k in p.keys())

    def _name_rules(self, name: str, exclude: str | None = None) -> str:
        if self.on("names"):
            name = name.strip()
        if not name.strip():
            raise Refused("person-form-error")
        if self.on("names"):
            key = norm_name(name)
            ex = self.people.get(exclude) if exclude else None
            if (key in self.people and key != exclude) or self._taken(key, exclude=ex):
                raise Refused("person-form-error")
        return name

    # ---- the tree of sheets (cp109-) ---------------------------------------------------------
    def parent_sheet(self) -> "Model | None":
        pid = self.setting("parent") if self.on("parent") else None
        return self.family.get(pid) if pid else None

    def ancestors(self) -> list:
        out, m, seen = [], self.parent_sheet(), {self.sheet}
        while m is not None and m.sheet not in seen:
            out.append(m)
            seen.add(m.sheet)
            m = m.parent_sheet()
        return out

    def children(self) -> list:
        return sorted((m for m in self.family.values() if m is not self and m.parent_sheet() is self),
                      key=lambda m: m.sheet)

    def descendants(self) -> list:
        out = []
        for c in self.children():
            out.append(c)
            out += c.descendants()
        return out

    def root(self) -> "Model":
        anc = self.ancestors()
        return anc[-1] if anc else self

    def tree(self) -> list:
        r = self.root()
        return [r] + r.descendants()

    def _terms_field(self, fields: dict):
        """The person's own terms from the form: None when blank; refused when not a whole number."""
        raw = fields.get("terms")
        if raw in (None, ""):
            return None
        if not str(raw).isdigit():
            raise Refused("person-form-error")
        return int(raw)

    def _contact_rules(self, raw, exclude: Person | None = None) -> str:
        """cp99: a contact is stored trimmed and lower-cased; one already on the sheet is refused."""
        c = (raw or "").strip().casefold()
        if c and self.on("contact") and any(q.contact == c for q in self.people.values() if q is not exclude):
            raise Refused("person-form-error")
        return c

    def _tags_field(self, raw) -> list:
        return sorted({t.strip().casefold() for t in (raw or "").split(",") if t.strip()})

    @write
    def add_person(self, name: str, grade: str, grade_from: str | None = None,
                   anchor: str = "person-form-error", audit: bool = True, terms=None,
                   contact: str | None = None, tags: str | None = None) -> Person:
        try:
            name = self._name_rules(name)
            contact_text = self._contact_rules(contact)
        except Refused:
            raise Refused(anchor)
        if grade not in self.grades:
            raise Refused(anchor)
        key = norm_name(name)
        if key in self.people and not self.on("names"):
            key = f"{key}#{len(self.people)}"
        # the first grade applies from the beginning of time (cp28), whatever the form's from-date
        p = Person(name=name, grades=[(None, grade)], order=len(self.people))
        if terms not in (None, "") and self.has("person_terms"):
            p.terms = self._terms_field({"terms": terms})
        if contact_text and self.has("contact"):
            p.contact = contact_text
        if tags and self.on("person_tags"):
            p.tags = self._tags_field(tags)
        self.people[key] = p
        if audit:
            self.audit_line("PERSON_ADDED", ("name", name, 6), ("grade", grade, 6),
                            *([("terms", p.terms, 63)] if p.terms is not None else []),
                            *([("contact", p.contact, 99)] if p.contact else []))
        return p

    def edit_open(self, name: str) -> None:
        p = self.person(name)
        self.editing[self.user] = (self._key(p), p.version)
        if self._depth == 0:
            self.screen["seq"][0] += 1
            self.journal.append((self.screen["seq"][0], self.user, self.today, "edit_open", (name,), {}))

    def _key(self, p: Person) -> str:
        return next(k for k, v in self.people.items() if v is p)

    @write
    def edit_save(self, fields: dict) -> Person:
        key, seen = self.editing.pop(self.user)
        p = self.people[key]
        if self.on("conflict") and p.version != seen:
            raise Refused("person-form-error")
        name = fields.get("name", p.name)
        name = self._name_rules(name, exclude=key)
        if self.clashing(p) and (norm_name(name) == norm_name(p.name)
                                 or any(self._taken(a, exclude=p) for a in {norm_name(x) for x in p.aliases})):
            raise Refused("person-form-error")
        grade = fields.get("grade")
        if grade is not None:
            if grade not in self.grades:
                raise Refused("person-form-error")
            if self.on("grade_dated"):
                start = day(fields["grade_from"]) if fields.get("grade_from") else self.today
                p.grades = [(s, g) for s, g in p.grades if s != start] + [(start, grade)]
            else:
                p.grades = [(None, grade)]
        terms_given = "terms" in fields and self.has("person_terms")
        if terms_given:
            p.terms = self._terms_field(fields)
        contact_given = "contact" in fields and self.has("contact")
        if contact_given:
            p.contact = self._contact_rules(fields["contact"], exclude=p)
        if "tags" in fields and self.on("person_tags"):
            p.tags = self._tags_field(fields["tags"])
        p.name = name
        if key != norm_name(name) and norm_name(name) not in self.people:
            self.people[norm_name(name)] = self.people.pop(key)
            for c in self.claims:
                if c.person == key:
                    c.person = norm_name(name)
        p.version += 1
        self.audit_line("PERSON_EDITED", ("name", name, 6), ("grade", self.grade_now(p), 6),
                        *([("terms", p.terms if p.terms is not None else "", 63)] if terms_given else []),
                        *([("contact", p.contact, 99)] if contact_given else []))
        return p

    def grade_at(self, p: Person, when: date) -> str:
        if not self.on("grade_dated"):
            return p.grades[-1][1]
        dated = sorted(((s or date.min), g) for s, g in p.grades)
        inforce = [g for s, g in dated if s <= when]
        return inforce[-1] if inforce else dated[0][1]

    def grade_now(self, p: Person) -> str:
        return self.grade_at(p, self.today)

    @write
    def retire(self, name: str, when: str) -> None:
        p = self.person(name)
        p.retired_from = day(when)
        self.audit_line("PERSON_RETIRED", ("name", p.name, 21), ("from", when, 21))

    @write
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
        if self.on("hold_stated") and self.stated_applies(c):
            return False
        if not self.on("hold_interval"):
            return True
        return any(s <= c.date and (e is None or c.date <= e) for s, e in p.holds)

    def retire_excluded(self, c: Claim) -> bool:
        """cp72: a retired person's open claims leave the live totals once the sheet's today is on
        or after the retirement date; a claim bound by a statement stays."""
        if not self.on("retire_excludes"):
            return False
        p = self.people[c.person]
        if not p.retired_from or self.today < p.retired_from or c.status not in ("OPEN", "PENDING"):
            return False
        return not self.stated_applies(c)

    @write
    def add_patron(self, name: str, patron: str) -> None:
        p, q = self.person(name), self.person(patron)
        if not self.on("backing") or p is q or self._key(q) in p.patrons:
            raise Refused("person-patron-error")
        p.patrons.append(self._key(q))
        self.audit_line("PATRON_ADDED", ("name", p.name, 27), ("patron", q.name, 27))

    @write
    def watch(self, name: str, on: bool) -> None:
        """cp58: the current user starts or stops watching the person."""
        p = self.person(name)
        if not self.on("notify"):
            raise Refused("person-error")
        key = self._key(p)
        mine = self.watching.setdefault(self.user, set())
        if on == (key in mine):
            # the row's watch control is ONE toggle: a click always flips the state, so a script
            # asking for the state already held describes a click no screen can refuse
            raise RuntimeError(f"watch {p.name} {'on' if on else 'off'}: already so; a toggle cannot refuse it")
        if on:
            mine.add(key)
            p.watchers.append(self.user)
            self.audit_line("PERSON_WATCHED", ("name", p.name, 58))
        else:
            mine.discard(key)
            p.watchers.remove(self.user)
            self.audit_line("PERSON_UNWATCHED", ("name", p.name, 58))

    def bulk_grade(self, names: list, grade: str, start: str | None = None) -> int:
        """cp75: each selected person, in list order, gets the grade from the date; how many went
        through (an app ignoring the rule refuses them all)."""
        if not self.on("bulk_grade"):
            return 0
        done = 0
        people = sorted((self.person(n) for n in names), key=lambda p: p.order)
        for p in people:
            try:
                self.edit_open(p.name)
                fields = {"grade": grade}
                if start:
                    fields["grade_from"] = start
                self.edit_save(fields)
                done += 1
            except Refused:
                self.editing.pop(self.user, None)
        return done

    # ---- rates, periods, roles -----------------------------------------------------------
    @write
    def set_rate(self, grade: str, pct: str, start: str | None = None, end: str | None = None) -> None:
        if grade not in self.grades:
            raise Refused("rate-form-error")
        try:
            val = D(pct)
        except Exception:
            raise Refused("rate-form-error")
        if val < 0 or val != val.quantize(Decimal("0.01")):
            raise Refused("rate-form-error")
        s = day(start) if (start and self.has("rate_dated")) else None
        e = day(end) if (end and self.has("rate_ended")) else None
        if e is not None and s is not None and e < s:
            raise Refused("rate-form-error")
        self.rates = [r for r in self.rates if not (r[0] == grade and r[1] == s)]
        self.rates.append((grade, s, val, e))
        self.audit_line("RATE_SET", ("grade", grade, 7), ("rate", money(val), 7),
                        *([("from", start, 11)] if s else []), *([("to", end, 42)] if e else []))

    def rate_at(self, grade: str, when: date) -> Decimal | None:
        r = self._rate_at_own(grade, when)
        if r is None and self.on("parent"):
            m, depth = self.parent_sheet(), 0
            while m is not None and depth < 3 and r is None:
                r = m._rate_at_own(grade, when)
                m, depth = m.parent_sheet(), depth + 1
        if r is None and self.on_if("clone_rates") and self.clone_of and self.clone_of in self.family:
            r = self.family[self.clone_of].rate_at(grade, when)
        return r

    def _rate_at_own(self, grade: str, when: date) -> Decimal | None:
        rows = [r for r in self.rates if r[0] == grade]
        if not self.on("rate_dated"):
            rows = [r for r in rows if r[1] is None] or rows
            row = rows[-1] if rows else None
        else:
            rows = [r for r in rows if r[1] is None or r[1] <= when]
            if not rows:
                return None
            rows.sort(key=lambda r: r[1] or date.min)
            row = rows[-1]
        if row is None:
            return None
        if self.on("rate_ended") and row[3] is not None and when > row[3]:
            return None
        return row[2]

    @write
    def add_period(self, name: str, start: str, end: str, cap: str | None = None) -> None:
        s, e = day(start), day(end)
        if not name.strip() or name in self.periods or e < s:
            raise Refused("period-form-error")
        for p in self.periods.values():
            if s <= p.end and p.start <= e:
                raise Refused("period-form-error")
        capn = None
        if cap and self.on("period_cap"):
            if not cap.isdigit() or int(cap) < 1:
                raise Refused("period-form-error")
            capn = int(cap)
        self.periods[name] = Period(name, s, e, cap=capn)
        self.audit_line("PERIOD_ADDED", ("period", name, 17), ("from", start, 17), ("to", end, 17),
                        *([("cap", capn, 149)] if capn is not None else []))

    def generate_periods(self, start: str, end: str) -> int:
        """cp59: one period per calendar month from the start's month to the end's month, first
        to last day, named YYYY-MM; a month whose name exists or that overlaps a period is left
        out. How many were added; refused (-1) when the end is before the start or the rule is off."""
        s, e = day(start), day(end)
        if e < s or not self.on("templates"):
            raise Refused("period-generate-error")
        made = 0
        y, m = s.year, s.month
        while (y, m) <= (e.year, e.month):
            first = date(y, m, 1)
            last = (date(y + (m == 12), (m % 12) + 1, 1) - timedelta(days=1))
            try:
                self.add_period(f"{y:04d}-{m:02d}", first.isoformat(), last.isoformat())
                made += 1
            except Refused:
                pass
            y, m = (y + 1, 1) if m == 12 else (y, m + 1)
        return made

    def period_of(self, when: date) -> Period | None:
        if not self.on("period"):
            return None
        return next((p for p in self.periods.values() if p.start <= when <= p.end), None)

    def placing_date(self, p: Person, when: date, c: Claim | None = None) -> date:
        """The date that places a claim in a period: its due-by under cp80, else its date."""
        if self.on("period_due_by") and self.on("overdue"):
            if c is not None:
                db = self.due_by(c)
                return db if db else when
            return when + timedelta(days=self.terms_for(p, when))
        return when

    def claim_period(self, c: Claim) -> Period | None:
        return self.period_of(self.placing_date(self.people[c.person], c.date, c))

    def in_closed(self, when: date) -> bool:
        p = self.period_of(when)
        return bool(p and p.closed and self.on("closed"))

    def in_closed_claim(self, c: Claim) -> bool:
        p = self.claim_period(c)
        return bool(p and p.closed and self.on("closed"))

    def _fixed(self, per: Period) -> bool:
        return (per.closed and self.on("closed")) or (per.soft and self.on("soft_close"))

    def _close(self, per: Period, auto: bool = False, soft: bool = False) -> None:
        per.closed, per.soft = (not soft), soft
        per.frozen_total = self.period_total_text(per, live=True)
        per.frozen_people = {id(p): self.person_period_text(p, per, live=True) for p in self.people.values()}
        self.audit_line("PERIOD_SOFT_CLOSED" if soft else "PERIOD_CLOSED", ("period", per.name, 18),
                        ("total", per.frozen_total, 18), *([("auto", "yes", 55)] if auto else []))

    @write
    def close_period(self, name: str) -> None:
        p = self.periods[name]
        if p.closed or not self._perm("close", True):
            raise Refused("period-error")
        self._close(p)

    @write
    def soft_close_period(self, name: str) -> None:
        p = self.periods[name]
        if not self.on("soft_close") or p.closed or p.soft or not self._perm("close", True):
            raise Refused("period-error")
        self._close(p, soft=True)

    @write
    def reopen_period(self, name: str) -> None:
        p = self.periods[name]
        ok = self.role() == "steward" if self.on("steward_reopen") else True
        if not (p.closed or (p.soft and self.on("soft_close"))) or not self._perm("reopen", ok):
            raise Refused("period-error")
        p.closed, p.soft, p.frozen_total, p.frozen_people = False, False, None, {}
        self.audit_line("PERIOD_REOPENED", ("period", name, 29))

    @write
    def set_role(self, user: str, role: str) -> None:
        if role not in ("clerk", "steward") and not (role == "viewer" and self.on("viewer")):
            raise Refused("role-form-error")
        self.roles[user] = role
        self.audit_line("ROLE_SET", ("user", user, 23), ("role", role, 23))

    @write
    def delegate(self, user: str, start: str, end: str) -> None:
        """cp61: the signed-in steward lends the role to `user` for the inclusive date range."""
        s, e = day(start), day(end)
        if not self.on("delegation") or self.roles.get(self.user) != "steward" or e < s:
            raise Refused("delegate-error")
        self.delegations.append((user, s, e, self.user))
        self.audit_line("DELEGATED", ("user", user, 61), ("from", start, 61), ("to", end, 61))

    @write
    def archive_sheet(self) -> None:
        if not self.on("archive") or self.role() != "steward" or self.archived:
            raise Refused("sheet-error")
        self.archived = True
        self.audit_line("SHEET_ARCHIVED")

    def set_asof(self, d: str | None) -> None:
        """cp74: the current user's screen shows every cell as of the date (None clears it)."""
        if d is None:
            self.asof.pop(self.user, None)
        elif self.on("asof"):
            self.asof[self.user] = day(d)

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
        if text:
            return day(text)
        entry = self.setting("entry-date") if self.on("entry_date") else None
        return day(entry) if entry else self.today

    def _claim_checks(self, p: Person, when: date, anchor: str) -> None:
        if self.on("retire") and p.retired_from and when > p.retired_from:
            raise Refused(anchor)
        if self.on("unretire") and any(a < when < b for a, b in p.retirements):
            raise Refused(anchor)
        if self.in_closed(self.placing_date(p, when)):
            raise Refused(anchor)

    def _extra_checks(self, extra: dict | None, exclude: Claim | None = None) -> tuple[str, list]:
        """The claim form's extra fields (cp87 ref, cp89 tags), normalised; a reference already
        on the sheet is refused."""
        extra = extra or {}
        ref = (extra.get("ref") or "").strip()
        if ref and self.on("ext_ref"):
            key = ref.casefold()
            if any(x.ref.casefold() == key for x in self.claims if x is not exclude):
                raise Refused("claim-form-error")
        tags = sorted({t.strip().casefold() for t in (extra.get("tags") or "").split(",") if t.strip()})
        return ref, tags

    def _new_claim(self, p: Person, a: Decimal, dt: date, note: str, corrects=None,
                   extra: dict | None = None) -> Claim:
        ref, tags = self._extra_checks(extra)
        c = Claim(person=self._key(p), amount=a, date=dt, note=note, corrects=corrects,
                  idx=sum(1 for x in self.claims if x.person == self._key(p)), seq=len(self.claims))
        c.terms_days = self.terms_for(p, dt)
        if self.on("overdue") and self.on("terms_fixed"):
            c.due_by = self.due_by_from(dt, c.terms_days)
        per = self.period_of(self.placing_date(p, dt))
        if per is not None and per.soft and self.on("soft_close"):
            c.late_entry = True
        if self.has("ref"):
            c.ref = ref
        if self.on("tags"):
            c.tags = tags
            for t in tags:
                if t not in self.tags_seen:
                    self.tags_seen.append(t)
        self.claims.append(c)
        c.history.append(("DRAFT", self.user, self.today, self.due_text(c)))
        self.audit_line("CLAIM_ADDED", *self._ident(c),
                        *([("ref", c.ref, 87)] if c.ref else []),
                        *([("tags", ",".join(c.tags), 89)] if c.tags else []))
        if c.late_entry:
            self.audit_line("LATE_ENTRY", *self._ident(c))
        return c

    @write
    def add_claim(self, name: str, amount: str, when: str | None = None, note: str = "",
                  corrects: str | None = None, anchor: str = "claim-form-error",
                  twice: bool = False, extra: dict | None = None) -> Claim:
        p = self.person(name)
        a = self._amount(amount, corrects)
        dt = self._claim_date(when)
        self._claim_checks(p, dt, anchor)
        try:
            self._extra_checks(extra)
        except Refused:
            raise Refused(anchor)
        target = None
        if corrects:
            target = next((c for c in self.claims if c.number == corrects and c.person == self._key(p)
                           and c.status == "SETTLED"), None)
            if target is None:
                raise Refused(anchor)
        c = self._new_claim(p, a, dt, note, corrects if target else None, extra)
        if twice and not self.on("conflict"):
            self._new_claim(p, a, dt, note)
        return c

    def paste_claims(self, lines: list[str]) -> int:
        """cp49: lines of name,amount,date,note; every line checked first with the claim form's
        rules, then all added as drafts; any error and nothing is added (refused). An app ignoring
        the rule adds the good lines: the count returned then differs."""
        parsed, bad = [], False
        for line in lines:
            if not line.strip():
                continue
            parts = line.split(",", 3)
            if len(parts) < 2:
                bad = True
                continue
            name, amount = parts[0], parts[1].strip()
            when = parts[2].strip() if len(parts) > 2 else ""
            note = parts[3].strip() if len(parts) > 3 else ""
            ref = ""
            if self.has("ref") and " #" in note:
                note, ref = note.rsplit(" #", 1)
                note, ref = note.strip(), ref.strip()
            try:
                p = self.person(name)
                a = self._amount(amount, None)
                dt = self._claim_date(when or None)
                self._claim_checks(p, dt, "paste-error")
                self._extra_checks({"ref": ref})
                if ref and self.on("ext_ref") and any(ref.casefold() == r.casefold() for _, _, _, _, r in parsed if r):
                    raise Refused("paste-error")
            except (KeyError, Refused, ValueError):
                bad = True
                continue
            parsed.append((p, a, dt, note, ref))
        if bad and self.on("paste_atomic"):
            raise Refused("paste-error")
        if not parsed:
            raise Refused("paste-error")
        for p, a, dt, note, ref in parsed:
            self._paste_one(p.name, money(a), dt.isoformat(), note, ref)
        return len(parsed)

    @write
    def _paste_one(self, name: str, amount: str, when: str, note: str, ref: str = "") -> Claim:
        p = self.person(name)
        return self._new_claim(p, D(amount), day(when), note, extra={"ref": ref})

    def claim(self, name: str, idx: int) -> Claim:
        key = self._key(self.person(name))
        return next(c for c in self.claims if c.person == key and c.idx == idx)

    def _editable(self, c: Claim) -> bool:
        if self.on("immutable") and c.status != "DRAFT":
            return False
        return c.status not in ("SETTLED", "VOID")

    def claim_edit_open(self, name: str, idx: int) -> None:
        """cp69: open the claim's editor; refused when another user holds it."""
        c = self.claim(name, idx)
        if not self._editable(c) or (self.on("viewer") and self.role() == "viewer"):
            raise Refused("claim-error")
        if self.on("lock"):
            holder = self.locks.get(c.seq)
            if holder and holder != self.user:
                raise Refused("claim-error")
            self.locks[c.seq] = self.user

    def claim_edit_cancel(self, name: str, idx: int) -> None:
        c = self.claim(name, idx)
        if self.locks.get(c.seq) == self.user:
            del self.locks[c.seq]

    @write
    def edit_claim(self, name: str, idx: int, fields: dict) -> Claim:
        c = self.claim(name, idx)
        if not self._editable(c):
            raise Refused("claim-error")
        if self.on("lock") and self.locks.get(c.seq) not in (None, self.user):
            raise Refused("claim-error")
        p = self.people[c.person]
        if self.on("lines") and c.lines and fields.get("amount") is not None \
                and D(fields["amount"]) != c.amount:
            raise Refused("claim-error")
        a = self._amount(fields.get("amount", money(c.amount)), c.corrects)
        dt = day(fields["date"]) if fields.get("date") else c.date
        if self.in_closed_claim(c):
            raise Refused("claim-error")
        self._claim_checks(p, dt, "claim-form-error")
        extra = {k: fields[k] for k in ("ref", "tags") if k in fields}
        ref, tags = self._extra_checks(extra, exclude=c)
        c.amount, c.date, c.note = a, dt, fields.get("note", c.note)
        if "ref" in extra and self.has("ref"):
            c.ref = ref
        if "tags" in extra and self.on("tags"):
            c.tags = tags
            for t in tags:
                if t not in self.tags_seen:
                    self.tags_seen.append(t)
        c.edited_by = self.user
        self.locks.pop(c.seq, None)
        self.audit_line("CLAIM_EDITED", *self._ident(c))
        return c

    @write
    def edit_inline(self, name: str, idx: int, amount: str) -> Claim:
        """cp86: the row's own amount entry, exactly the claim form's rules."""
        if not self.on("inline_edit"):
            raise Refused("claim-error")
        return self.edit_claim(name, idx, {"amount": amount})

    def _ident(self, c: Claim) -> list:
        """How an audit line names a claim: person, amount and date (cp6), then its number (cp9)."""
        p = self.people[c.person]
        out = [("person", p.name, 6), ("amount", money(c.amount), 6), ("date", c.date.isoformat(), 6)]
        if self.on("number") and c.number:
            out.append(("number", c.number, 9))
        return out

    def _numbering_per_period(self) -> bool:
        start = self.setting("period-numbering-from")
        return bool(self.on("period_number") and start and self.today >= day(start))

    def _next_number(self, c: Claim) -> str:
        if self._numbering_per_period():
            per = self.claim_period(c)
            key = per.name if per else "X"
            self.period_counters[key] = self.period_counters.get(key, 0) + 1
            return f"{key}-{self.period_counters[key]}"
        seq = self.root() if self.on("tree_numbering") else self
        if self.on("fy_numbering"):
            fy = self.fy_of(self.placing_date(self.people[c.person], c.date, c))
            seq.fy_counters[fy] = seq.fy_counters.get(fy, 0) + 1
            return f"{fy}-{seq.fy_counters[fy]}"
        seq.counter += 1
        return str(seq.counter)

    def _note_ok(self, c: Claim) -> bool:
        if not self.on("note_required"):
            return True
        t = self.setting_at("note-threshold", c.date)
        due = self.due(c)
        return not (t and due is not None and due > D(t) and not c.note.strip())

    @write
    def open_claim(self, name: str, idx: int) -> Claim:
        c = self.claim(name, idx)
        if c.status != "DRAFT" or self.in_closed_claim(c):
            raise Refused("claim-error")
        if not self.has("status") or not self._perm("open", True) or not self._note_ok(c):
            raise Refused("claim-error")
        per = self.claim_period(c)
        if self.on("period_cap") and per is not None and per.cap is not None:
            held = sum(1 for x in self.person_claims(self.people[c.person])
                       if x.status in ("OPEN", "PENDING") and self.claim_period(x) is per)
            if held >= per.cap:
                raise Refused("claim-error")
        c.status = "OPEN"
        c.opened_by = self.user
        if self.on("number"):
            c.number = self._next_number(c)
        c.history.append(("OPEN", self.user, self.today, self.due_text(c)))
        self.audit_line("CLAIM_OPENED", *self._ident(c))
        return c

    def _proofs_ok(self, c: Claim) -> bool:
        if not self.on("proofs"):
            return True
        t = None
        if self.on("proof_grade"):
            t = self.setting_at(f"proof-threshold-{self.grade_at(self.people[c.person], c.date)}", c.date)
        if not t:
            t = self.setting_at("proof-threshold", c.date)
        due = self.due(c)
        return not (t and due is not None and due > D(t) and c.proofs == 0)

    @write
    def settle_claim(self, name: str, idx: int) -> Claim:
        c = self.claim(name, idx)
        if c.status != "OPEN" or self.in_closed_claim(c) or self.is_deferred(c):
            raise Refused("claim-error")
        if not self._perm("settle", True):
            raise Refused("claim-error")
        if self.on("four_eyes") and c.opened_by == self.user:
            raise Refused("claim-error")
        if self.on("four_eyes_editor") and c.edited_by == self.user:
            raise Refused("claim-error")
        if not self._proofs_ok(c):
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
        extra = [("due", self.due_text(c), 10)] if self.has("freeze") else []
        self.audit_line(event, *self._ident(c), *extra)
        self._notify(c)
        return c

    def _notify(self, c: Claim) -> None:
        if not self.on("notify"):
            return
        p = self.people[c.person]
        for u in p.watchers:
            self.audit_line("NOTIFY", ("user", u, 58), ("person", p.name, 58), ("number", c.number or "", 58))

    @write
    def approve_claim(self, name: str, idx: int) -> Claim:
        c = self.claim(name, idx)
        if c.status != "PENDING" or self.role() != "steward" or self.in_closed_claim(c):
            raise Refused("claim-error")
        if self.on("four_eyes") and c.opened_by == self.user:
            raise Refused("claim-error")
        if self.on("four_eyes_editor") and c.edited_by == self.user:
            raise Refused("claim-error")
        if not self._proofs_ok(c):
            raise Refused("claim-error")
        return self._settle(c, "CLAIM_APPROVED")

    @write
    def reject_claim(self, name: str, idx: int, reason: str) -> Claim:
        c = self.claim(name, idx)
        if c.status != "PENDING" or self.role() != "steward":
            raise Refused("claim-error")
        c.status = "OPEN"
        c.history.append(("OPEN", self.user, self.today, self.due_text(c)))
        self.audit_line("CLAIM_REJECTED", *self._ident(c), ("reason", reason, 36))
        return c

    @write
    def resettle_claim(self, name: str, idx: int) -> Claim:
        """cp46: a steward freezes a settled claim again at the figure it would have as an open,
        unbound claim today."""
        c = self.claim(name, idx)
        if not self.on("resettle") or self.role() != "steward" or c.status != "SETTLED" \
                or self.in_closed_claim(c):
            raise Refused("claim-error")
        old = self.due_text(c)
        c.frozen = self._live_figure(c)
        c.history.append(("SETTLED", self.user, self.today, self.due_text(c)))
        self.audit_line("CLAIM_RESETTLED", *self._ident(c), ("old", old, 46), ("new", self.due_text(c), 46))
        self._notify(c)
        return c

    def _live_figure(self, c: Claim) -> Decimal | None:
        saved = (c.status, c.frozen, c.stated)
        c.status, c.frozen, c.stated = "OPEN", None, None
        try:
            return self.due(c)
        finally:
            c.status, c.frozen, c.stated = saved

    def settled_on(self, c: Claim) -> date | None:
        for st, _u, d, _v in reversed(c.history):
            if st == "SETTLED":
                return d
        return None

    @write
    def void_claim(self, name: str, idx: int, reason: str | None = None) -> Claim:
        c = self.claim(name, idx)
        if not self._perm("void", True) or self.in_closed_claim(c):
            raise Refused("claim-error")
        if self.on("void_reasons") and self.void_reasons and reason not in self.void_reasons:
            raise Refused("claim-error")
        reversed_text = None
        if c.status == "SETTLED" and self.on("void_settled"):
            settled = self.settled_on(c)
            if self.role() != "steward" or settled is None or (self.today - settled).days > 7:
                raise Refused("claim-error")
            reversed_text = self.due_text(c)
        elif c.status not in ("DRAFT", "OPEN", "PENDING"):
            raise Refused("claim-error")
        c.status = "VOID"
        if self.on("number") and not self.on("immutable"):
            c.number = None
        c.history.append(("VOID", self.user, self.today, self.due_text(c)))
        if reason and self.has("void_reasons"):
            c.void_reason = reason
        self.audit_line("CLAIM_VOIDED", *self._ident(c),
                        *([("reversed", reversed_text, 65)] if reversed_text is not None else []),
                        *([("reason", reason, 90)] if c.void_reason else []))
        return c

    @write
    def reassign_claim(self, name: str, idx: int, to: str) -> Claim:
        c = self.claim(name, idx)
        q = self.person(to)
        if not self._perm("reassign", self.role() == "steward") \
                or c.status not in ("DRAFT", "OPEN", "PENDING") or self.in_closed_claim(c):
            raise Refused("claim-error")
        self._claim_checks(q, c.date, "claim-error")
        old = self.people[c.person]
        c.person = self._key(q)
        c.idx = max([x.idx for x in self.claims if x.person == c.person and x is not c] + [-1]) + 1
        if self.on("reassign_unstates"):
            c.stated = None
        if self.on("reassign_renumbers") and c.number:
            c.number = self._next_number(c)
        self.audit_line("CLAIM_REASSIGNED", *self._ident(c), ("from", old.name, 37), ("to", q.name, 37))
        return c

    @write
    def defer_claim(self, name: str, idx: int, until: str) -> Claim:
        """cp50: an open claim counts nowhere and cannot be settled until the sheet's today
        reaches the date."""
        c = self.claim(name, idx)
        u = day(until)
        if not self.on("deferred") or c.status != "OPEN" or u <= self.today or self.in_closed_claim(c):
            raise Refused("claim-error")
        c.deferred_until = u
        self.audit_line("CLAIM_DEFERRED", *self._ident(c), ("until", until, 50))
        return c

    def is_deferred(self, c: Claim) -> bool:
        return bool(self.on("deferred") and c.deferred_until and self.today < c.deferred_until)

    @write
    def add_proof(self, name: str, idx: int) -> Claim:
        c = self.claim(name, idx)
        if not self.on("proofs") or c.status in ("SETTLED", "VOID"):
            raise Refused("claim-error")
        c.proofs += 1
        self.audit_line("CLAIM_PROOF_ADDED", *self._ident(c), ("proofs", c.proofs, 51))
        return c

    @write
    def split_claim(self, name: str, idx: int, amount: str) -> Claim:
        """cp57: part of an open claim becomes a new open claim with the next number; the
        original keeps the rest and loses any stated figure."""
        c = self.claim(name, idx)
        a = self._amount(amount, None)
        if not self.on("split") or c.status != "OPEN" or self.in_closed_claim(c) or self.is_deferred(c) \
                or not self._perm("open", True) or a <= 0 or a >= c.amount:
            raise Refused("claim-error")
        p = self.people[c.person]
        c.amount -= a
        c.stated = None
        n = Claim(person=c.person, amount=a, date=c.date, note=c.note, status="OPEN", opened_by=self.user,
                  idx=sum(1 for x in self.claims if x.person == c.person), seq=len(self.claims),
                  split_from=c.number or "", late_entry=c.late_entry)
        n.terms_days = self.terms_for(p, c.date)
        if self.on("overdue") and self.on("terms_fixed"):
            n.due_by = self.due_by_from(c.date, n.terms_days)
        self.claims.append(n)
        if self.on("number"):
            n.number = self._next_number(n)
        n.history.append(("OPEN", self.user, self.today, self.due_text(n)))
        self.audit_line("CLAIM_SPLIT", *self._ident(c), ("into", n.number or "", 57))
        self.audit_line("CLAIM_OPENED", *self._ident(n))
        return n

    @write
    def redate_claim(self, name: str, idx: int, new: str) -> Claim:
        """cp66: a steward moves an open claim to another date; a change of period under
        per-period numbering gives it the next number of the new period."""
        c = self.claim(name, idx)
        nd = day(new)
        p = self.people[c.person]
        if not self.on("redate") or self.role() != "steward" or c.status not in ("OPEN", "PENDING") \
                or self.in_closed_claim(c):
            raise Refused("claim-error")
        if self.on("retire") and p.retired_from and nd > p.retired_from:
            raise Refused("claim-error")
        old_per, old = self.claim_period(c), c.date
        c.date = nd
        if self.in_closed_claim(c):
            c.date = old
            raise Refused("claim-error")
        if self.on("number") and self._numbering_per_period() and self.claim_period(c) is not old_per:
            c.number = self._next_number(c)
        self.audit_line("CLAIM_REDATED", *self._ident(c), ("old", old.isoformat(), 66), ("new", new, 66))
        return c

    def quick_add(self, name: str, amount: str) -> Claim:
        # one transaction: a claim that would be refused leaves no new person behind
        self._amount(amount, None)
        when = self._claim_date(None)
        # placed as the claim would be (by its due-by under cp80): a new name gets grade A
        p = self.find_person(name) or Person(name=name, grades=[(None, self.default_grade())], order=len(self.people))
        if self.in_closed(self.placing_date(p, when)):
            raise Refused("quick-error")
        if self.find_person(name) is None:
            self.add_person(name, self.default_grade(), anchor="quick-error")
        return self.add_claim(name, amount, anchor="quick-error")

    def _list_order(self, items: list) -> list:
        def place(item):
            c = self.claim(*item)
            return (self.people[c.person].order, -c.idx)
        return sorted(items, key=place)

    def bulk_open(self, items: list) -> list:
        """Open the selected claims in LIST order (people as added, newest claim first within a
        person), whatever order they were ticked in; one result per item, in the order given."""
        out = []
        for name, idx in self._list_order(items):
            try:
                self.open_claim(name, idx)
                out.append(True)
            except Refused:
                out.append(False)
        return out

    def _settle_refused(self, c: Claim) -> bool:
        """Whether settling the claim now would be refused (going to PENDING is not a refusal)."""
        if c.status != "OPEN" or self.in_closed_claim(c) or self.is_deferred(c):
            return True
        if not self._perm("settle", True):
            return True
        if self.on("four_eyes") and c.opened_by == self.user:
            return True
        if self.on("four_eyes_editor") and c.edited_by == self.user:
            return True
        return not self._proofs_ok(c)

    def bulk_settle(self, items: list) -> list:
        """cp45: settle the selected claims in list order, each by the claim's own rules; a claim
        that goes to PENDING counts as settled by the button. cp98: a press that settles anything
        is a numbered batch; cp100: one refusal and nothing is settled, and a batch writes
        BATCH_SETTLED after the claims' lines."""
        ordered = self._list_order(items)
        if not self.on("bulk_settle"):
            return [False] * len(ordered)
        if self.on("batch_atomic") and any(self._settle_refused(self.claim(n, i)) for n, i in ordered):
            return [False] * len(ordered)
        out, done = [], []
        for name, idx in ordered:
            try:
                self.settle_claim(name, idx)
                out.append(True)
                done.append(self.claim(name, idx))
            except Refused:
                out.append(False)
        if done and self.on("batch"):
            self.batch_counter += 1
            self.last_batch = str(self.batch_counter)
            for c in done:
                c.batch = self.last_batch
            if self.on("batch_atomic"):
                total = sum((c.frozen or Decimal("0") for c in done if c.status == "SETTLED"), Decimal("0"))
                self.audit_line("BATCH_SETTLED", ("batch", self.last_batch, 100), ("count", len(done), 100),
                                ("total", money(total), 100))
        return out

    @write
    def remind(self, name: str, idx: int) -> Claim:
        """cp81: a REMIND line for an OPEN or PENDING claim, once per claim per sheet-day."""
        c = self.claim(name, idx)
        if not self.on("remind") or c.status not in ("OPEN", "PENDING") \
                or (c.reminded and c.reminded[-1] == self.today):
            raise Refused("claim-error")
        c.reminded.append(self.today)
        self.audit_line("REMIND", *self._ident(c))
        return c

    @write
    def add_holiday(self, d: str) -> None:
        """cp83: a holiday on the sheet; cp96: every claim that is not settled or void and whose
        due-by is on or after it has its due-by fixed again, with the terms it was fixed with."""
        when = day(d)
        if not self.on("holidays") or when in self.holidays:
            raise Refused("holiday-error")
        self.holidays.add(when)
        self.audit_line("HOLIDAY_ADDED", ("date", d, 83))
        if self.on("holidays_redate"):
            for c in self.claims:
                if c.status not in ("SETTLED", "VOID") and c.due_by is not None and c.due_by >= when:
                    c.due_by = self.due_by_from(c.date, c.terms_days if c.terms_days is not None
                                                else self.terms_for(self.people[c.person], c.date))

    @write
    def add_comment(self, name: str, idx: int, text: str) -> Claim:
        """cp91: a comment on a claim by the signed-in user on the sheet's today."""
        c = self.claim(name, idx)
        if not self.on("comments") or not text.strip():
            raise Refused("claim-error")
        c.comments.append((self.user, self.today, text.strip()))
        self.audit_line("COMMENT_ADDED", *self._ident(c), ("text", text.strip(), 91))
        return c

    @write
    def add_void_reason(self, reason: str) -> None:
        """cp90: a reason on the sheet's list; blank or repeated is refused."""
        r = reason.strip()
        if not self.on("void_reasons") or not r or r in self.void_reasons:
            raise Refused("void-reason-error")
        self.void_reasons.append(r)
        self.audit_line("VOID_REASON_ADDED", ("reason", r, 90))

    def bulk_reassign(self, items: list, to: str) -> list:
        """cp93: the selected claims reassigned in list order, each by the single rule."""
        out = []
        for name, idx in self._list_order(items):
            try:
                if not self.on("bulk_reassign"):
                    raise Refused("claim-error")
                self.reassign_claim(name, idx, to)
                out.append(True)
            except Refused:
                out.append(False)
        return out

    def rate_preview(self, grade: str, pct: str) -> tuple[int, str] | None:
        """cp95: how many OPEN or PENDING claims of the grade would show another due if the
        grade's rate were `pct` for every date, and the sum of the differences; nothing saved."""
        if not self.on("rate_preview") or grade not in self.grades:
            return None
        try:
            val = D(pct)
        except Exception:
            return None
        count, diff = 0, Decimal("0")
        saved = self.rates
        for c in self.claims:
            p = self.people[c.person]
            if c.status not in ("OPEN", "PENDING") or self.grade_at(p, c.date) != grade:
                continue
            now = self.due(c)
            self.rates = [r for r in saved if r[0] != grade] + [(grade, None, val, None)]
            try:
                then = self.due(c)
            finally:
                self.rates = saved
            if now != then:
                count += 1
                diff += (then or Decimal("0")) - (now or Decimal("0"))
        return count, money(diff)

    # ---- Act III: identity, hierarchy, cross-sheet --------------------------------------------
    def default_grade(self) -> str:
        return "A"

    def audit_view(self, filt: str = "", upto: int | None = None) -> list[str]:
        """cp101: the sheet's audit lines newest first; with a filter, only the lines naming that
        person (name= or person=, compared as names are), then (cp139) each descendant's such
        lines and (cp121) the person's lines from the sheet they were transferred from. `upto`
        keeps the fields a spec written at that checkpoint knows (see audit_text)."""
        def lines_of(m: "Model", key: str | None) -> list[str]:
            out = []
            for event, user, fields in m.audit:
                if key is not None and not any(a in ("name", "person") and norm_name(b) == key for a, b, _ in fields):
                    continue
                parts = [event, f"sheet={m.sheet}", f"by={user}"]
                for a, b, since in fields:
                    if upto is not None and since > upto:
                        break
                    parts.append(f"{a}={b}")
                out.append(" ".join(parts))
            return list(reversed(out))
        if not self.on("audit_view"):
            return []
        key = norm_name(filt) if filt.strip() else None
        out = lines_of(self, key)
        if key is not None:
            if self.on("tree_audit"):
                for m in self.descendants():
                    out += lines_of(m, key)
            if self.on("history_follows"):
                p = self.find_person(filt)
                if p is not None and p.origin and p.origin in self.family:
                    out += lines_of(self.family[p.origin], key)
        return out

    @write
    def add_alias(self, name: str, alias: str) -> None:
        """cp102: an alias, unique among names and aliases."""
        p = self.person(name)
        a = alias.strip()
        if not self.on("aliases") or not a or self._taken(norm_name(a)):
            raise Refused("person-error")
        p.aliases.append(a)
        self.audit_line("PERSON_ALIAS_ADDED", ("name", p.name, 102), ("alias", a, 102))

    @write
    def save_template(self, name: str, amount: str, note: str) -> None:
        """cp103: a named template of an amount and a note; a name already there is replaced."""
        n = name.strip()
        if not self.on("templates_claim") or not n:
            raise Refused("template-error")
        a = self._amount(amount, None)
        self.templates[n] = (a, note)
        self.audit_line("TEMPLATE_SAVED", ("name", n, 103), ("amount", money(a), 103), ("note", note, 103))

    def claim_from_template(self, name: str, template: str) -> Claim:
        if not self.on("templates_claim") or template not in self.templates:
            raise Refused("claim-form-error")
        a, note = self.templates[template]
        return self.add_claim(name, money(a), None, note)

    # -- pools (cp105, cp106, cp115, cp120, cp122, cp124, cp140)
    @write
    def add_pool(self, name: str) -> None:
        n = name.strip()
        if not self.on("pools") or not n or n in self.pools:
            raise Refused("pool-form-error")
        self.pools[n] = Pool(n, order=len(self.pools))
        self.audit_line("POOL_ADDED", ("name", n, 105))

    def _pool_depth_ok(self, pool: Pool, child: Pool) -> bool:
        """cp115: no cycle, nesting at most three deep, a pool in at most one pool."""
        if child is pool or any(self.pool_parent(q) is not None for q in [child]):
            return False
        # climb from `pool` to the root pool: the chain above plus the chain below `child`
        above, m = 0, pool
        while m is not None:
            if m is child:
                return False
            m, above = self.pool_parent(m), above + 1
        def depth_below(q: Pool) -> int:
            kids = [self.pools[x.key] for x in q.members if x.kind == "pool"]
            return 1 + max((depth_below(k) for k in kids), default=0)
        return above + depth_below(child) <= 3

    def pool_parent(self, pool: Pool) -> Pool | None:
        return next((q for q in self.pools.values() if any(m.kind == "pool" and m.key == pool.name for m in q.members)), None)

    @write
    def add_pool_member(self, pool: str, who: str, share: str, start: str | None = None,
                        end: str | None = None) -> None:
        if not self.on("pools") or pool not in self.pools:
            raise Refused("pool-error")
        pl = self.pools[pool]
        try:
            sh = D(share)
        except Exception:
            raise Refused("pool-error")
        if sh != sh.quantize(Decimal("0.01")) or sh <= 0 or sh > 100:
            raise Refused("pool-error")
        if who.startswith("pool:"):
            cname = who[5:]
            if not self.on("nested_pools") or cname not in self.pools or not self._pool_depth_ok(pl, self.pools[cname]):
                raise Refused("pool-error")
            kind, key, shown = "pool", cname, cname
        else:
            p = self.person(who)
            kind, key, shown = "person", self._key(p), p.name
        if any(m.kind == kind and m.key == key for m in pl.members):
            raise Refused("pool-error")
        s = day(start) if (start and self.on("pool_dated")) else None
        e = day(end) if (end and self.on("pool_dated")) else None
        if s and e and e < s:
            raise Refused("pool-error")
        pl.members.append(Member(kind, key, sh, len(pl.members), s, e))
        self.audit_line("POOL_MEMBER_ADDED", ("pool", pool, 105), ("name", shown, 105), ("share", money(sh), 105),
                        *([("from", start, 122)] if s else []), *([("to", end, 122)] if e else []))

    def _member_dated_in(self, m: Member) -> bool:
        if not self.on("pool_dated"):
            return True
        return (m.start is None or m.start <= self.today) and (m.end is None or self.today <= m.end)

    def _member_retired(self, m: Member) -> bool:
        return m.kind == "person" and bool(self.people[m.key].retired_from) and self.on("retire")

    def _member_held(self, m: Member) -> bool:
        """cp120: a person with a hold in force on the sheet's today."""
        if not self.on("hold_pools") or m.kind != "person":
            return False
        p = self.people[m.key]
        if not self.on("hold_interval"):
            return bool(p.holds)
        return any(s <= self.today and (e is None or self.today <= e) for s, e in p.holds)

    def pool_shares(self, pl: Pool) -> list:
        """(member, share counted toward the total, weight for the cut): dated-out members are
        left out; a retired member's share is 0.00 (cp105) or spread over the others (cp124); a
        held member's share is spread (cp120)."""
        out = []
        for m in pl.members:
            if not self._member_dated_in(m):
                continue
            retired = self._member_retired(m)
            if retired and not self.on("retired_share"):
                out.append((m, Decimal("0"), Decimal("0")))
                continue
            weight = Decimal("0") if (retired or self._member_held(m)) else m.share
            out.append((m, m.share, weight))
        return out

    def pool_total(self, pl: Pool) -> Decimal:
        return sum((sh for _m, sh, _w in self.pool_shares(pl)), Decimal("0"))

    def pool_balanced(self, pl: Pool) -> bool:
        return self.pool_total(pl) == Decimal("100")

    def pool_pot(self, pl: Pool) -> Decimal | None:
        """cp106: the sheet's pot; cp115: a nested pool's pot is its cut in the pool above."""
        parent = self.pool_parent(pl) if self.on("nested_pools") else None
        if parent is not None:
            cuts = self.pool_cuts(parent)
            return cuts.get(("pool", pl.name))
        raw = self.setting("pot")
        return D(raw) if raw else None

    def pool_cuts(self, pl: Pool) -> dict:
        """{(kind, key): cut} when the pool is balanced and has a pot, else {}: each weighted
        member's cut is pot x weight / total weight, half to even; the remainder (pot minus the
        cuts) goes to the largest share, earliest-added on a tie (cp106), or (cp140) to the
        smallest non-zero cut, latest-added on a tie. A member with no weight cuts 0.00."""
        if not self.on("cuts") or not self.pool_balanced(pl):
            return {}
        pot = self.pool_pot(pl)
        if pot is None:
            return {}
        shares = self.pool_shares(pl)
        wsum = sum((w for _m, _s, w in shares), Decimal("0"))
        if not wsum:
            return {}
        cuts = {}
        for m, _s, w in shares:
            cuts[(m.kind, m.key)] = (pot * w / wsum).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
        rem = pot - sum(cuts.values(), Decimal("0"))
        if rem:
            weighted = [(m, w) for m, _s, w in shares if w]
            if self.on("remainder_smallest"):
                nonzero = [(m, w) for m, w in weighted if cuts[(m.kind, m.key)]]
                pick = min(reversed(nonzero), key=lambda mw: cuts[(mw[0].kind, mw[0].key)])[0] if nonzero \
                    else weighted[-1][0]
            else:
                pick = max(weighted, key=lambda mw: mw[1])[0]
            cuts[(pick.kind, pick.key)] += rem
        return cuts

    def cut_total(self, p: Person) -> Decimal:
        key = self._key(p)
        return sum((self.pool_cuts(pl).get(("person", key), Decimal("0")) for pl in self.pools.values()), Decimal("0"))

    def pools_view(self) -> dict:
        out = {}
        if not self.has("pools"):
            return out
        for pl in sorted(self.pools.values(), key=lambda x: x.order):
            cells = {"pool-total-share": money(self.pool_total(pl)),
                     "pool-balanced": "yes" if self.pool_balanced(pl) else "no"}
            cuts = self.pool_cuts(pl)
            members = []
            for m in pl.members:
                mc = {"pool-share": money(m.share)}
                if self.has("cuts"):
                    v = cuts.get((m.kind, m.key))
                    mc["pool-cut"] = "" if v is None else money(v)
                members.append((m, mc))
            out[pl.name] = (cells, members)
        return out

    # -- merge (cp107), transfer (cp111, cp128), clone (cp126)
    def _move_claims(self, src: "Model", claims: list, target: Person, keep_bound: bool) -> list:
        """Copy claims onto `target` on this sheet in their order, numbering the opened ones afresh
        in the order they were opened; the originals are the caller's to drop."""
        moved = []
        opened = sorted((c for c in claims if c.number),
                        key=lambda c: (next((d for st, _u, d, _v in c.history if st == "OPEN"), c.date), c.seq))
        order = {id(c): i for i, c in enumerate(opened)}
        for c in sorted(claims, key=lambda c: c.seq):
            n = Claim(person=self._key(target), amount=c.amount, date=c.date, note=c.note, status=c.status,
                      opened_by=c.opened_by, frozen=c.frozen, due_by=c.due_by, corrects=c.corrects,
                      stated=c.stated if keep_bound else None, history=list(c.history),
                      idx=sum(1 for x in self.claims if x.person == self._key(target)), seq=len(self.claims),
                      deferred_until=c.deferred_until, proofs=c.proofs, late_entry=c.late_entry,
                      reminded=list(c.reminded), terms_days=c.terms_days, edited_by=c.edited_by,
                      tags=list(c.tags), void_reason=c.void_reason, comments=list(c.comments),
                      lines=list(c.lines), ref=c.ref if src is self else "", batch=c.batch, plan=c.plan)
            self.claims.append(n)
            moved.append((c, n))
        for c, n in sorted(((c, n) for c, n in moved if c.number), key=lambda cn: order[id(cn[0])]):
            n.number = self._next_number(n) if src is not self else c.number
        return moved

    @write
    def merge(self, b_name: str, a_name: str) -> Person:
        """cp107: B's claims, aliases (and name), patrons and pool memberships move to A; B leaves
        the list. cp136: B's bound figures and statement count follow."""
        b, a = self.person(b_name), self.person(a_name)
        if not self.on("merge") or self.role() != "steward" or a is b or a.retired_from or b.retired_from:
            raise Refused("person-error")
        keep = self.on("bindings_follow")
        bkey, akey = self._key(b), self._key(a)
        moved = self._move_claims(self, [c for c in self.claims if c.person == bkey], a, keep)
        for c, n in moved:
            n.number = c.number
        self.claims = [c for c in self.claims if c.person != bkey]
        for c in self.claims:
            c.idx = c.idx    # unchanged
        a.aliases += [b.name] + [x for x in b.aliases if norm_name(x) not in a.keys()]
        for k in b.patrons:
            if k != akey and k not in a.patrons:
                a.patrons.append(k)
        for q in self.people.values():
            if bkey in q.patrons:
                q.patrons.remove(bkey)
                if q is not a and akey not in q.patrons:
                    q.patrons.append(akey)
        for pl in self.pools.values():
            bm = next((m for m in pl.members if m.kind == "person" and m.key == bkey), None)
            if bm is None:
                continue
            am = next((m for m in pl.members if m.kind == "person" and m.key == akey), None)
            if am is None:
                bm.key = akey
            else:
                am.share += bm.share
                pl.members.remove(bm)
        if keep:
            a.statements += b.statements
            if a.stated_total is None and b.stated_total is not None:
                a.stated_total, a.stated_on = b.stated_total, b.stated_on
        del self.people[bkey]
        self.plans = [pl for pl in self.plans if pl.person != bkey]
        self.audit_line("PERSON_MERGED", ("from", b.name, 107), ("into", a.name, 107))
        return a

    @write
    def transfer(self, name: str, to: str) -> Person:
        """cp111: a steward moves a person and their claims to another sheet; cp128: onto a
        matching name there, as a merge."""
        p = self.person(name)
        if not self.on("transfer") or self.role() != "steward" or to == self.sheet or p.retired_from:
            raise Refused("person-error")
        target = self.sibling(to)
        existing = next((q for q in target.people.values() if q.keys() & p.keys()), None) if self.on("aliases") \
            else target.people.get(norm_name(p.name))
        if existing is not None and not self.on("transfer_merges"):
            raise Refused("person-error")
        if existing is None and (target._taken(norm_name(p.name)) or
                                 any(target._taken(norm_name(a)) for a in p.aliases)):
            raise Refused("person-error")
        if existing is None and p.contact and any(q.contact == p.contact for q in target.people.values()):
            raise Refused("person-error")
        key = self._key(p)
        claims = [c for c in self.claims if c.person == key]
        target.receive_person(self, p, claims, existing)
        self.claims = [c for c in self.claims if c.person != key]
        for q in self.people.values():
            if key in q.patrons:
                q.patrons.remove(key)
        for pl in self.pools.values():
            pl.members = [m for m in pl.members if not (m.kind == "person" and m.key == key)]
        for c in claims:
            self.locks.pop(c.seq, None)
        self.plans = [pl for pl in self.plans if pl.person != key]
        del self.people[key]
        self.audit_line("PERSON_TRANSFERRED", ("name", p.name, 111), ("to", to, 111))
        return p

    @write
    def receive_person(self, src: "Model", p: Person, claims: list, existing: Person | None) -> Person:
        keep = self.on("bindings_follow")
        if existing is None:
            q = Person(name=p.name, grades=list(p.grades), order=len(self.people), terms=p.terms,
                       contact=p.contact, aliases=list(p.aliases), tags=list(p.tags), origin=src.sheet)
            if keep:
                q.statements, q.stated_total, q.stated_on = p.statements, p.stated_total, p.stated_on
            self.people[norm_name(p.name)] = q
        else:
            q = existing
            q.aliases += [p.name] + [x for x in p.aliases if norm_name(x) not in q.keys()]
            if keep:
                q.statements += p.statements
                if q.stated_total is None and p.stated_total is not None:
                    q.stated_total, q.stated_on = p.stated_total, p.stated_on
        self._move_claims(src, claims, q, keep)
        self.audit_line("PERSON_TRANSFERRED", ("name", p.name, 111), ("from", src.sheet, 111))
        if existing is not None:
            self.audit_line("PERSON_MERGED", ("from", p.name, 107), ("into", q.name, 107))
        return q

    @write
    def clone_sheet(self, to: str) -> None:
        """cp126: a fresh sheet filled with this one's settings, people, rates, pools, periods
        (open) and claims (numbered afresh in the order the originals were opened); statements
        are not copied."""
        if not self.on("clone") or self.role() != "steward" or to == self.sheet:
            raise Refused("sheet-error")
        target = self.sibling(to)
        if target.people or target.claims or target.settings or target.periods or target.rates:
            raise Refused("sheet-error")
        target.receive_clone(self)
        self.audit_line("SHEET_CLONE_MADE", ("to", to, 126))

    @write
    def receive_clone(self, src: "Model") -> None:
        import copy as _copy
        self.settings = {k: list(v) for k, v in src.settings.items()}
        self.rates = list(src.rates)
        self.roles = dict(src.roles)
        self.holidays = set(src.holidays)
        self.void_reasons = list(src.void_reasons)
        self.templates = dict(src.templates)
        self.grades = list(src.grades)
        self.today = src.today
        self.clone_of = src.sheet
        self.audit_line("SHEET_CLONED", ("from", src.sheet, 126))
        keymap = {}
        for k, p in sorted(src.people.items(), key=lambda kv: kv[1].order):
            q = Person(name=p.name, grades=list(p.grades), order=len(self.people), retired_from=p.retired_from,
                       holds=list(p.holds), terms=p.terms, contact=p.contact, aliases=list(p.aliases),
                       tags=list(p.tags), retirements=list(p.retirements))
            self.people[k] = q
            keymap[k] = q
        for k, q in keymap.items():
            q.patrons = [x for x in src.people[k].patrons if x in keymap]
        for n, per in src.periods.items():
            self.periods[n] = Period(n, per.start, per.end, cap=per.cap)
        for n, pl in sorted(src.pools.items(), key=lambda kv: kv[1].order):
            self.pools[n] = Pool(n, pl.order, [_copy.copy(m) for m in pl.members])
        by_person: dict = {}
        for c in src.claims:
            by_person.setdefault(c.person, []).append(c)
        for k, q in keymap.items():
            self._move_claims(src, by_person.get(k, []), q, keep_bound=False)

    # -- imports (cp113, cp116, cp118)
    def import_people(self, lines: list) -> tuple[int, int]:
        """All-or-nothing lines of name,grade[,terms[,contact]]: (added, updated); cp116 updates
        a matching person instead of refusing them."""
        if not self.on("import_people"):
            raise Refused("import-error")
        parsed, seen_names, seen_contacts = [], set(), set()
        for line in lines:
            if not line.strip():
                continue
            parts = [x.strip() for x in line.split(",")]
            name = parts[0]
            grade = parts[1] if len(parts) > 1 else ""
            terms = parts[2] if len(parts) > 2 else ""
            contact = parts[3] if len(parts) > 3 else ""
            key = norm_name(name)
            existing = self.find_person(name) if self.on("import_upsert") else None
            if not name or grade not in self.grades or key in seen_names:
                raise Refused("import-error")
            if existing is None and self._taken(key):
                raise Refused("import-error")
            if terms and not terms.isdigit():
                raise Refused("import-error")
            ck = contact.casefold()
            if ck and (ck in seen_contacts or any(q.contact == ck for q in self.people.values() if q is not existing)):
                raise Refused("import-error")
            seen_names.add(key)
            if existing is not None:
                seen_names |= existing.keys()
            if ck:
                seen_contacts.add(ck)
            parsed.append((name, grade, terms, contact, existing))
        if not parsed:
            raise Refused("import-error")
        added = updated = 0
        for name, grade, terms, contact, existing in parsed:
            if existing is None:
                self.add_person(name, grade, terms=terms or None, contact=contact or None)
                added += 1
            else:
                self.edit_open(existing.name)
                fields = {"grade": grade}
                if terms:
                    fields["terms"] = terms
                if contact:
                    fields["contact"] = contact
                self.edit_save(fields)
                updated += 1
        return added, updated

    def import_rates(self, lines: list) -> int:
        """cp118: all-or-nothing lines of grade,rate[,from[,to]], each set as the rate form would."""
        if not self.on("import_rates"):
            raise Refused("rate-import-error")
        parsed = []
        for line in lines:
            if not line.strip():
                continue
            parts = [x.strip() for x in line.split(",")]
            if len(parts) < 2 or parts[0] not in self.grades:
                raise Refused("rate-import-error")
            try:
                val = D(parts[1])
                s = day(parts[2]) if len(parts) > 2 and parts[2] else None
                e = day(parts[3]) if len(parts) > 3 and parts[3] else None
            except Exception:
                raise Refused("rate-import-error")
            if val < 0 or val != val.quantize(Decimal("0.01")) or (s and e and e < s):
                raise Refused("rate-import-error")
            parsed.append((parts[0], parts[1], parts[2] if len(parts) > 2 and parts[2] else None,
                           parts[3] if len(parts) > 3 and parts[3] else None))
        if not parsed:
            raise Refused("rate-import-error")
        for g, pct, s, e in parsed:
            self.set_rate(g, pct, s, e)
        return len(parsed)

    # -- drafts deleted and restored (cp114)
    @write
    def delete_claim(self, name: str, idx: int) -> Claim:
        c = self.claim(name, idx)
        if not self.on("delete_draft") or c.status != "DRAFT" or self.in_closed_claim(c):
            raise Refused("claim-error")
        c.status, c.deleted_on = "DELETED", self.today
        c.history.append(("DELETED", self.user, self.today, self.due_text(c)))
        self.audit_line("CLAIM_DELETED", *self._ident(c))
        return c

    @write
    def restore_claim(self, name: str, idx: int) -> Claim:
        c = self.claim(name, idx)
        if not self.on("delete_draft") or c.status != "DELETED" or c.deleted_on != self.today:
            raise Refused("claim-error")
        c.status, c.deleted_on = "DRAFT", None
        c.history.append(("DRAFT", self.user, self.today, self.due_text(c)))
        self.audit_line("CLAIM_RESTORED", *self._ident(c))
        return c

    # -- positions (cp117), sorting (cp134)
    def listed(self) -> list:
        return sorted(self.people.values(), key=lambda p: p.order)

    @write
    def move_person(self, name: str, direction: str) -> None:
        p = self.person(name)
        people = self.listed()
        i = people.index(p)
        j = i - 1 if direction == "up" else i + 1
        if not self.on("position") or j < 0 or j >= len(people):
            raise Refused("person-error")
        q = people[j]
        p.order, q.order = q.order, p.order
        self.audit_line("PERSON_MOVED", ("name", p.name, 117), ("position", j + 1, 117))

    def set_sort(self, key: str) -> None:
        if self.on("sort"):
            self.screen.setdefault("sort", {})[self.user] = key

    def displayed(self) -> list:
        """The people in screen order: list order, or (cp134) the user's sort, stable."""
        people = self.listed()
        key = self.screen.get("sort", {}).get(self.user) if self.on("sort") else None
        if key == "name":
            people.sort(key=lambda p: norm_name(p.name))
        elif key == "grade":
            people.sort(key=lambda p: self.grade_now(p))
        elif key == "due-total":
            people.sort(key=lambda p: (self.due_total(p) is None, self.due_total(p) or Decimal("0")))
        return people

    # -- retirements (cp123, cp125)
    def bulk_retire(self, names: list, when: str) -> int:
        if not self.on("bulk_retire"):
            return 0
        done = 0
        for p in sorted((self.person(n) for n in names), key=lambda p: p.order):
            try:
                self.retire(p.name, when)
                done += 1
            except Refused:
                pass
        return done

    @write
    def unretire(self, name: str) -> None:
        p = self.person(name)
        if not self.on("unretire") or not p.retired_from:
            raise Refused("person-error")
        p.retirements.append((p.retired_from, self.today))
        p.retired_from = None
        self.audit_line("PERSON_UNRETIRED", ("name", p.name, 125), ("on", self.today.isoformat(), 125))

    # -- plans (cp131, cp141, cp142)
    @write
    def add_plan(self, name: str, amount: str, start: str, every: str, end: str) -> Plan:
        """A plan every N days (`every` a number) or (cp141) monthly on a day (`every` = "m<day>")."""
        p = self.person(name)
        if not self.on("plans"):
            raise Refused("plan-error")
        a = self._amount(amount, None)
        s, e = day(start), day(end)
        if e < s:
            raise Refused("plan-error")
        n = dom = None
        if str(every).startswith("m") and self.on("monthly_plans"):
            if not every[1:].isdigit() or not 1 <= int(every[1:]) <= 31:
                raise Refused("plan-error")
            dom = int(every[1:])
        else:
            if not str(every).isdigit() or int(every) < 1:
                raise Refused("plan-error")
            n = int(every)
        pl = Plan(len(self.plans) + 1, self._key(p), a, s, n, dom, e)
        self.plans.append(pl)
        self.audit_line("PLAN_ADDED", ("name", p.name, 131), ("amount", money(a), 131), ("start", start, 131),
                        *([("every", n, 131)] if n is not None else [("day", dom, 141)]), ("end", end, 131))
        return pl

    def plan_dates(self, pl: Plan, upto: date | None, limit: int | None = None) -> list:
        """The plan's dates from its start, up to `upto` (or `limit` dates after it when upto is
        None): every N days, or the day of month clamped to the month's length."""
        out, d = [], pl.start
        if pl.every is not None:
            while d <= pl.end and (upto is None or d <= upto):
                out.append(d)
                d += timedelta(days=pl.every)
                if limit is not None and len(out) >= limit + 1:
                    break
        else:
            y, m = pl.start.year, pl.start.month
            while True:
                last = (date(y + (m == 12), (m % 12) + 1, 1) - timedelta(days=1)).day
                d = date(y, m, min(pl.day, last))
                if d > pl.end or (upto is not None and d > upto):
                    break
                if d >= pl.start:
                    out.append(d)
                if limit is not None and len(out) >= limit + 1:
                    break
                y, m = (y + 1, 1) if m == 12 else (y, m + 1)
        return out

    def plan_next(self, pl: Plan) -> list:
        """cp142: the next five plan dates after the sheet's today."""
        out = []
        for d in self.plan_dates(pl, None, limit=1000):
            if d > self.today:
                out.append(d)
            if len(out) == 5:
                break
        return out

    def generate_plans(self) -> int:
        """cp131: a DRAFT claim for every plan date up to the sheet's today that has none yet;
        a date the claim form would refuse is skipped. How many were made."""
        if not self.on("plans"):
            raise Refused("plan-error")
        made = 0
        for pl in self.plans:
            p = self.people.get(pl.person)
            if p is None:
                continue
            for d in self.plan_dates(pl, self.today):
                if d in pl.generated:
                    continue
                try:
                    c = self.add_claim(p.name, money(pl.amount), d.isoformat(), "")
                except Refused:
                    continue
                c.plan = pl.pid
                pl.generated.append(d)
                made += 1
        return made

    # -- lines (cp137), the row's grade (cp138), bulk re-date (cp145)
    @write
    def add_line(self, name: str, idx: int, label: str, qty: str, unit: str) -> Claim:
        c = self.claim(name, idx)
        if not self.on("lines") or c.status != "DRAFT" or self.in_closed_claim(c) or not label.strip():
            raise Refused("claim-error")
        if self.on("lock") and self.locks.get(c.seq) not in (None, self.user):
            raise Refused("claim-error")
        if not qty.isdigit() or int(qty) < 1:
            raise Refused("claim-error")
        u = self._amount(unit, None)
        c.lines.append((label.strip(), int(qty), u))
        c.amount = sum((q * x for _l, q, x in c.lines), Decimal("0"))
        c.edited_by = self.user
        self.audit_line("CLAIM_LINE_ADDED", *self._ident(c), ("label", label.strip(), 137), ("qty", qty, 137),
                        ("unit", money(u), 137))
        return c

    def inline_grade(self, name: str, grade: str) -> Person:
        if not self.on("inline_grade"):
            raise Refused("person-error")
        self.edit_open(name)
        try:
            return self.edit_save({"grade": grade})
        except Refused:
            self.editing.pop(self.user, None)
            raise Refused("person-error")

    def bulk_redate(self, items: list, new: str) -> list:
        out = []
        for name, idx in self._list_order(items):
            try:
                if not self.on("bulk_redate"):
                    raise Refused("claim-error")
                self.redate_claim(name, idx, new)
                out.append(True)
            except Refused:
                out.append(False)
        return out

    # -- fiscal years (cp143)
    def fy_of(self, d: date) -> str:
        m = self.setting("fiscal-start-month") if self.on("fiscal") else None
        m = int(m) if m else 1
        return f"FY{d.year if d.month >= m else d.year - 1}"

    def generate_fy(self, year: str) -> int:
        if not self.on("fiscal") or not year.isdigit():
            raise Refused("period-generate-error")
        m = self.setting("fiscal-start-month")
        m = int(m) if m else 1
        y = int(year)
        first = date(y, m, 1)
        last_month_first = date(y + 1, m - 1, 1) if m > 1 else date(y, 12, 1)
        last = date(last_month_first.year + (last_month_first.month == 12), (last_month_first.month % 12) + 1, 1) - timedelta(days=1)
        return self.generate_periods(first.isoformat(), last.isoformat())

    # -- alerts (cp146)
    def _alerts(self, after: dict) -> None:
        if not self.on("alert"):
            return
        raw = self.setting("alert-threshold")
        if not raw:
            return
        t = D(raw)
        for pid, (p, _claimed, due_text, *_rest) in sorted(after.items(), key=lambda kv: kv[1][0].order):
            above = due_text != "n/a" and D(due_text) > t
            if above and not p.alerted:
                p.alerted = True
                self.audit_line("ALERT", ("name", p.name, 146), ("due-total", due_text, 146))
            elif not above:
                p.alerted = False

    # -- the tree's figures (cp110, cp150)
    def consolidated(self) -> dict:
        if not self.on("consolidated"):
            return {}
        tree = [self] + self.descendants()
        due = sum((m.sheet_due() for m in tree), Decimal("0"))
        over = sum((m.overdue_total() for m in tree), Decimal("0"))
        return {"consolidated-people-count": str(sum(len(m.people) for m in tree)),
                "consolidated-due-total": money(due), "consolidated-overdue-total": money(over)}

    def search(self, text: str) -> list:
        """cp150: `<sheet> <name> <due-total>` for every person of the tree whose name or an alias
        holds the text (case ignored): this sheet first, then the rest of the tree by sheet id."""
        if not self.on("tree_search"):
            return []
        t = text.strip().casefold()
        out = []
        sheets = [self] + sorted((m for m in self.tree() if m is not self), key=lambda m: m.sheet)
        for m in sheets:
            for p in m.listed():
                if any(t in k for k in p.keys()):
                    v = m.due_total(p)
                    out.append(f"{m.sheet} {p.name} {'n/a' if v is None else money(v)}")
        return out

    # ---- statements (cp15) -----------------------------------------------------------------
    def statement_figure(self, c: Claim) -> Decimal | None:
        """What a statement binds a counting claim to: its base (floored, cp24), or under the
        floor-last rule (cp64) the rate figure alone."""
        if c.status == "SETTLED" and self.on("freeze") and c.frozen is not None:
            return c.frozen
        if self.on("floor_last"):
            if self.stated_applies(c):
                return None if c.stated == "n/a" else c.stated
            return self.rate_due(c)
        return self.base(c)

    @write
    def statement(self, name: str, asof: str | None = None) -> Person:
        """State the person: every claim that counts now is bound to its base figure as of now
        (the late charge is never stated), every other claim of theirs is unstated, and the
        statement's due-total is kept on the row and in the audit. With a date (cp73) the
        statement is taken as of that date instead."""
        p = self.person(name)
        if not self.has("statement"):
            raise Refused("person-error")
        if asof and self.on("statement_asof"):
            return self._statement_asof(p, day(asof))
        counted = [c for c in self.person_claims(p) if self.counts(c)]
        if self.on("statement"):
            bases = {id(c): self.statement_figure(c) for c in counted}
            for c in self.person_claims(p):
                if id(c) in bases:
                    c.stated = "n/a" if bases[id(c)] is None else bases[id(c)]
                else:
                    c.stated = None
        v = self.due_total(p)
        p.statements += 1
        p.stated_total = "n/a" if v is None else money(v)
        p.stated_on = self.today
        p.statement_log.append((p.stated_total, p.stated_on, [c.seq for c in counted]))
        self.audit_line("STATEMENT", ("name", p.name, 15), ("due-total", p.stated_total, 15),
                        ("claims", len(counted), 15))
        return p

    def _statement_asof(self, p: Person, d: date) -> Person:
        """cp73: the statement as of `d`: the person's claims that counted at the end of that day
        (every write journaled while the sheet's today was on or before `d`, with `d` as today) are
        bound to their figures as they stood then, every other claim of theirs is unstated, and
        the row keeps `d` as the statement date and that day's due-total as the stated total.
        A date after the sheet's today is refused."""
        if d > self.today:
            raise Refused("person-error")
        r = self.asof_model(d)
        rp = r.people.get(p.name) or next((q for q in r.people.values() if q.order == p.order), None)
        if rp is None:
            raise Refused("person-error")
        counted = [rc for rc in r.person_claims(rp) if r.counts(rc)]
        bases = {rc.seq: r.statement_figure(rc) for rc in counted}
        if self.on("statement"):
            for rc in r.person_claims(rp):
                rc.stated = ("n/a" if bases[rc.seq] is None else bases[rc.seq]) if rc.seq in bases else None
            for c in self.person_claims(p):
                c.stated = ("n/a" if bases[c.seq] is None else bases[c.seq]) if c.seq in bases else None
        v = r.due_total(rp)
        p.statements += 1
        p.stated_total = "n/a" if v is None else money(v)
        p.stated_on = d
        p.statement_log.append((p.stated_total, p.stated_on, list(bases)))
        self.audit_line("STATEMENT", ("name", p.name, 15), ("due-total", p.stated_total, 15),
                        ("claims", len(counted), 15), ("asof", d.isoformat(), 73))
        return p

    @write
    def unstate(self, name: str) -> Person:
        """cp71: a steward cancels the person's last statement: the claims it bound are unbound
        (an earlier statement's binding is not restored), and the row shows the statement before."""
        p = self.person(name)
        if not self.on("unstate") or self.role() != "steward" or not p.statement_log:
            raise Refused("person-error")
        total, _d, seqs = p.statement_log.pop()
        for c in self.claims:
            if c.seq in seqs:
                c.stated = None
        p.statements -= 1
        if p.statement_log:
            p.stated_total, p.stated_on = p.statement_log[-1][0], p.statement_log[-1][1]
        else:
            p.stated_total, p.stated_on = None, None
        self.audit_line("STATEMENT_CANCELLED", ("name", p.name, 71), ("due-total", total, 71))
        return p

    def stated_applies(self, c: Claim) -> bool:
        if not self.on("statement") or c.stated is None:
            return False
        if c.status == "PENDING" and self.on("pending_live"):
            return False
        return True

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
        if self.on("person_terms") and p.terms is not None:
            return p.terms
        if self.on("terms_fixed"):
            g = self.grade_at(p, when)
            t = self.setting_at(f"terms-{g}", when)
            if t:
                return int(t)
        t = self.setting_at("terms", when)
        return int(t) if t else DEFAULT_TERMS

    def due_by_from(self, dt: date, terms: int) -> date:
        """The due-by of a claim dated `dt` with these terms: the terms-th business day after it
        under cp84 (Saturdays, Sundays and holidays are not counted), else dt plus the terms,
        moved past any holiday (cp83)."""
        if self.on("business_days"):
            d, n = dt, 0
            while n < terms:
                d += timedelta(days=1)
                if d.weekday() < 5 and d not in self.holidays:
                    n += 1
            return d
        d = dt + timedelta(days=terms)
        if self.on("holidays"):
            while d in self.holidays:
                d += timedelta(days=1)
        return d

    def due_by(self, c: Claim) -> date | None:
        if not self.on("overdue"):
            return None
        if c.due_by is not None and self.on("terms_fixed"):
            return c.due_by
        return self.due_by_from(c.date, self.terms_for(self.people[c.person], c.date))

    def grace_days(self, c: Claim) -> int:
        """cp85: the grace of the person's grade in force on the claim's date, 0 unless set."""
        if not self.on("grace"):
            return 0
        p = self.people[c.person]
        g = self.setting_at(f"grace-{self.grade_at(p, c.date)}", c.date)
        return int(g) if g else 0

    def overdue_from(self, c: Claim) -> date | None:
        """The day after which the claim is overdue: its due-by plus any grace."""
        db = self.due_by(c)
        return None if db is None else db + timedelta(days=self.grace_days(c))

    def overdue(self, c: Claim) -> bool:
        db = self.overdue_from(c)
        return bool(db and c.status in ("OPEN", "PENDING") and db < self.today and not self.is_deferred(c))

    def rounding_date(self, c: Claim) -> date:
        """The date whose policy decides a claim's rounding: its own, or for a correction under
        the policy-date rule the date of the claim it corrects."""
        if c.corrects and self.on("policy_date"):
            target = next((x for x in self.claims if x.number == c.corrects), None)
            if target is not None:
                return target.date
        return c.date

    def rate_due(self, c: Claim) -> Decimal | None:
        p = self.people[c.person]
        rate = self.rate_at(self.grade_at(p, c.date), c.date)
        if rate is None:
            return None
        return self._round(c.amount * rate / 100, self.rounding_date(c))

    def floor_at(self, c: Claim) -> Decimal:
        return D(self.setting_at("floor", c.date, DEFAULT_FLOOR))

    def base(self, c: Claim) -> Decimal | None:
        """The figure before any late charge: frozen (settled), else stated (bound by the last
        statement), else live: the rate step, floored unless a correction or the floor-last rule."""
        if c.status == "SETTLED" and self.on("freeze") and c.frozen is not None:
            return c.frozen
        if self.stated_applies(c):
            return None if c.stated == "n/a" else c.stated
        base = self.rate_due(c)
        if base is None or c.corrects:
            return base
        if self.on("floor") and not self.on("floor_last"):
            base = max(base, self.floor_at(c))
        return base

    def late_charge(self, c: Claim, base: Decimal) -> Decimal:
        if not self.on("late") or not self.overdue(c):
            return Decimal("0")
        start = self.overdue_from(c)
        n30 = (self.today - start).days // 30
        if not n30:
            return Decimal("0")
        when = self.rounding_date(c)
        if self.on("late_boundary"):
            total = Decimal("0")
            for i in range(1, n30 + 1):
                pct = D(self.setting_at("late-pct", start + timedelta(days=30 * i), "0"))
                if pct:
                    on = base + total if self.on("compound_late") else base
                    total += self._round(on * pct / 100, when)
            return total
        pct = D(self.setting_at("late-pct", c.date, "0"))
        return self._round(base * pct / 100 * n30, when) if pct else Decimal("0")

    def due(self, c: Claim) -> Decimal | None:
        if not self.has("due"):
            return None
        base = self.base(c)
        if base is None:
            return None
        if c.status == "SETTLED" and self.on("freeze") and c.frozen is not None:
            return base
        if c.corrects:
            return base
        v = base + self.late_charge(c, base)
        if self.on("floor") and self.on("floor_last"):
            v = max(v, self.floor_at(c))
        return v

    def due_text(self, c: Claim) -> str:
        v = self.due(c)
        return "n/a" if v is None else money(v)

    def counts(self, c: Claim) -> bool:
        if self.on("status") and c.status not in ("OPEN", "SETTLED", "PENDING"):
            return False
        if self.has("status") and c.status == "PENDING" and not self.on("pending"):
            return False
        if self.is_deferred(c) or self.retire_excluded(c):
            return False
        return not self.held_claim(c)

    def status_at(self, c: Claim, when: date) -> str | None:
        """The status the claim had at the end of sheet-day `when` (from its log), None before
        it existed."""
        st = None
        for s, _u, d, _v in c.history:
            if d <= when:
                st = s
        return st

    def counts_for_period(self, c: Claim, per: Period) -> bool:
        if not self.on("period") or self.claim_period(c) is not per:
            return False
        if self.on("period_asof"):
            st = self.status_at(c, per.end)
            if st not in ("OPEN", "SETTLED", "PENDING") or (st == "PENDING" and not self.on("pending")):
                return False
            return not (self.held_claim(c) or self.is_deferred(c) or self.retire_excluded(c))
        return self.counts(c)

    def person_claims(self, p: Person) -> list[Claim]:
        key = self._key(p)
        return [c for c in self.claims if c.person == key]

    def claimed(self, p: Person) -> Decimal:
        return sum((c.amount for c in self.person_claims(p)
                    if self.counts(c) and not (c.corrects and self.on("claimed_no_corrections"))), Decimal("0"))

    def raw_due_total(self, p: Person) -> Decimal | None:
        cs = [c for c in self.person_claims(p) if self.counts(c)]
        if not self.has("due"):
            return None
        if not self.on("half_even"):
            # cp7: the total amount times the rate, rounded once
            rate = self.rate_at(self.grade_now(p), self.today)
            if rate is None:
                return None       # cp7: no rate today, n/a, whether or not anything counts
            return self._round(sum((c.amount for c in cs), Decimal("0")) * rate / 100, self.today)
        vals = [v for v in (self.due(c) for c in cs) if v is not None]
        if not vals and self.rate_at(self.grade_now(p), self.today) is None:
            return None               # cp7's rule stands: no rate today and no figure to add
        return sum(vals, Decimal("0"))

    def due_total(self, p: Person) -> Decimal | None:
        v = self.raw_due_total(p)
        if v is None or not self.on("cap"):
            return v
        cap = self.setting("cap")
        return min(v, D(cap)) if cap else v

    def excess(self, p: Person) -> Decimal:
        v = self.raw_due_total(p)
        cap = self.setting("cap") if self.on("cap") else None
        if v is None or not cap or v <= D(cap):
            return Decimal("0")
        return v - D(cap)

    def _trimmed(self, vals: list[Decimal]) -> Decimal:
        total = sum(vals, Decimal("0"))
        if self.on("trim") and len(vals) >= 3:
            total -= max(vals) + min(vals)
        return total

    def sheet_claimed(self) -> Decimal:
        return sum((self.claimed(p) for p in self.people.values()), Decimal("0"))

    def sheet_due(self) -> Decimal:
        vals = [v for v in (self.due_total(p) for p in self.people.values()) if v is not None]
        return self._trimmed(vals)

    def overdue_claims(self, p: Person | None = None) -> list[Claim]:
        cs = self.person_claims(p) if p else self.claims
        return [c for c in cs if self.overdue(c) and self.counts(c)]

    def overdue_total(self, p: Person | None = None) -> Decimal:
        if p is not None:
            return sum((self.due(c) or Decimal("0") for c in self.overdue_claims(p)), Decimal("0"))
        return self._trimmed([self.overdue_total(q) for q in self.people.values()])

    def settled_total(self, p: Person | None = None) -> Decimal:
        cs = self.person_claims(p) if p else self.claims
        return sum((self.due(c) or Decimal("0") for c in cs if c.status == "SETTLED" and self.counts(c)),
                   Decimal("0"))

    def open_total(self, p: Person | None = None) -> Decimal:
        cs = self.person_claims(p) if p else self.claims
        return sum((self.due(c) or Decimal("0") for c in cs
                    if c.status in ("OPEN", "PENDING") and self.counts(c)), Decimal("0"))

    def tag_totals(self) -> dict:
        """cp89: per tag ever used on the sheet, the due of the claims carrying it that count."""
        if not self.on("tags"):
            return {}
        out = {}
        tags = list(self.tags_seen)
        if self.on("person_tags"):
            for p in self.listed():
                for t in p.tags:
                    if t not in tags:
                        tags.append(t)
        for t in tags:
            out[f"tag-{t}-due-total"] = money(sum(
                (self.due(c) or Decimal("0") for c in self.claims
                 if (t in c.tags or (self.on("person_tags") and t in self.people[c.person].tags)) and self.counts(c)),
                Decimal("0")))
        return out

    def month_totals(self) -> dict:
        """cp97: per calendar month any claim is dated in, the due of the claims dated in it that
        count."""
        if not self.on("monthly"):
            return {}
        months = sorted({c.date.strftime("%Y-%m") for c in self.claims})
        return {f"month-{m}-due-total": money(sum((self.due(c) or Decimal("0") for c in self.claims
                                                   if c.date.strftime("%Y-%m") == m and self.counts(c)),
                                                  Decimal("0"))) for m in months}

    def _patron_figure(self, key: str) -> Decimal | None:
        """What a patron contributes before any share: their recent settled figures (cp68) or
        their due-total."""
        q = self.people[key]
        if self.on("backing_recent"):
            lo = self.today - timedelta(days=89)
            return sum((self.due(c) or Decimal("0") for c in self.person_claims(q)
                        if c.status == "SETTLED" and lo <= c.date <= self.today), Decimal("0"))
        return self.due_total(q)

    def patron_shares(self, p: Person) -> list:
        """cp108: equal shares over the patrons in the order they were named, 100.00 split half
        to even to two decimals with the remainder on the first-named patron."""
        n = len(p.patrons)
        if not n:
            return []
        base = (Decimal("100") / n).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
        shares = [base] * n
        shares[0] += Decimal("100") - base * n
        return list(zip(p.patrons, shares))

    def backing(self, p: Person) -> Decimal:
        total = Decimal("0")
        if self.on("patron_shares"):
            for key, share in self.patron_shares(p):
                v = self._patron_figure(key)
                if v is not None:
                    total += (v * share / 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
            return total
        for key in p.patrons:
            v = self._patron_figure(key)
            if v is not None:
                total += v
        return total

    def period_total_text(self, per: Period, live: bool = False) -> str:
        if self._fixed(per) and per.frozen_total is not None and not live:
            return per.frozen_total
        if not self.on("period"):
            return money(Decimal("0"))       # an app that never assigns claims to periods
        total = sum((self.due(c) or Decimal("0") for c in self.claims if self.counts_for_period(c, per)),
                    Decimal("0"))
        return money(total)

    def person_period_text(self, p: Person, per: Period, live: bool = False) -> str:
        if self._fixed(per) and not live:
            return per.frozen_people.get(id(p), "0.00")
        total = sum((self.due(c) or Decimal("0") for c in self.person_claims(p)
                     if self.counts_for_period(c, per)), Decimal("0"))
        return money(total)

    def active(self, p: Person) -> bool:
        for c in self.person_claims(p):
            if c.status in ("OPEN", "PENDING") and self.counts(c) and 0 <= (self.today - c.date).days <= 29:
                return True
        return False

    def aged(self, p: Person) -> dict:
        out = {"0-30": Decimal("0"), "31-60": Decimal("0"), "61": Decimal("0")}
        for c in self.person_claims(p):
            if c.status in ("OPEN", "PENDING") and self.counts(c):
                age = (self.today - c.date).days
                key = "0-30" if age <= 30 else "31-60" if age <= 60 else "61"
                out[key] += self.due(c) or Decimal("0")
        return out

    def set_show_retired(self, on: bool) -> None:
        """The toggle belongs to the current user's screen; loading a sheet leaves it alone."""
        (self.show_retired.add if on else self.show_retired.discard)(self.user)

    def visible(self, p: Person) -> bool:
        return not (self.on("retire") and p.retired_from and self.user not in self.show_retired)

    def claim_cells(self, c: Claim) -> dict:
        cells = {"claim-amount": money(c.amount), "claim-date": c.date.isoformat(),
                 "claim-note": c.note}
        if self.has("due"):
            cells["claim-due"] = self.due_text(c)
        if self.has("status"):
            cells["claim-status"] = c.status
        if self.has("number"):
            cells["claim-number"] = c.number or ""
        if self.has("opened_by"):
            cells["claim-opened-by"] = c.opened_by or ""
        if self.has("statement"):
            cells["claim-stated"] = "yes" if (c.stated is not None and self.on("statement")) else "no"
        if self.has("period"):
            per = self.claim_period(c)
            cells["claim-period"] = per.name if per else ""
        if self.has("overdue") and self.due_by(c) is not None:
            cells["claim-due-by"] = self.due_by(c).isoformat()
            cells["claim-overdue"] = "yes" if self.overdue(c) else "no"
        if self.has("correction"):
            cells["claim-corrects"] = c.corrects or ""
        if self.has("log"):
            cells["claim-log"] = [f"{s} by {u} on {d.isoformat()} due={v}" for s, u, d, v in c.history]
        if self.has("deferred"):
            cells["claim-deferred"] = "yes" if self.is_deferred(c) else "no"
            cells["claim-deferred-until"] = c.deferred_until.isoformat() if c.deferred_until else ""
        if self.has("proofs"):
            cells["claim-proofs"] = str(c.proofs)
        if self.has("split"):
            cells["claim-split-from"] = c.split_from
        if self.has("soft_close"):
            cells["claim-late-entry"] = "yes" if c.late_entry else "no"
        if self.has("remind"):
            cells["claim-reminded"] = c.reminded[-1].isoformat() if c.reminded else ""
        if self.has("ref"):
            cells["claim-ref"] = c.ref
        if self.on("tags"):
            cells["claim-tags"] = ", ".join(c.tags)
        if self.has("comments"):
            cells["claim-comments"] = [f"{u} on {d.isoformat()}: {t}" for u, d, t in c.comments]
        if self.on("batch"):
            cells["claim-batch"] = c.batch
        if self.has("lines"):
            cells["claim-lines"] = [f"{l} {q} x {money(u)}" for l, q, u in c.lines]
        return cells

    def person_cells(self, p: Person) -> dict:
        cells = {"person-name": p.name, "person-grade": self.grade_now(p)}
        if self.has("claims"):
            cells["person-claimed"] = money(self.claimed(p))
        if self.has("due"):
            v = self.due_total(p)
            cells["person-due-total"] = "n/a" if v is None else money(v)
        if self.has("statement"):
            cells["person-statement-count"] = str(p.statements)
            cells["person-stated-total"] = p.stated_total or ""
            cells["person-statement-date"] = p.stated_on.isoformat() if p.stated_on else ""
        if self.has("retire"):
            cells["person-retired"] = "yes" if p.retired_from else "no"
            cells["person-retired-from"] = p.retired_from.isoformat() if p.retired_from else ""
        if self.has("hold"):
            cells["person-hold"] = "yes" if p.holds else "no"
        if self.has("overdue"):
            cells["person-overdue-count"] = str(len(self.overdue_claims(p)))
            cells["person-overdue-total"] = money(self.overdue_total(p))
        if self.on("backing"):
            if self.on("patron_shares"):
                shares = {q: sh for q, sh in self.patron_shares(p)}
                cells["person-patrons"] = ", ".join(f"{self.people[q].name} {money(shares[q])}"
                                                    for q in sorted(p.patrons, key=lambda q: self.people[q].name))
            else:
                cells["person-patrons"] = ", ".join(sorted(self.people[q].name for q in p.patrons))
            cells["person-backing"] = money(self.backing(p))
        if self.has("cap"):
            cells["person-excess"] = money(self.excess(p))
        if self.has("notify"):
            cells["person-watched"] = "yes" if self.user in p.watchers else "no"
        if self.has("person_terms"):
            cells["person-terms"] = "" if p.terms is None else str(p.terms)
        if self.has("active"):
            cells["person-active"] = "yes" if self.active(p) else "no"
        if self.has("age"):
            a = self.aged(p)
            cells["person-aged-0-30"], cells["person-aged-31-60"], cells["person-aged-61"] = \
                money(a["0-30"]), money(a["31-60"]), money(a["61"])
        if self.on("split_totals"):
            cells["person-settled-total"] = money(self.settled_total(p))
            cells["person-open-total"] = money(self.open_total(p))
        if self.has("contact"):
            cells["person-contact"] = p.contact
        if self.has("aliases"):
            cells["person-aliases"] = ", ".join(sorted(p.aliases, key=norm_name))
        if self.has("clashing"):
            cells["person-clashing"] = "yes" if self.clashing(p) else "no"
        if self.on("cut_rows"):
            cells["person-cut-total"] = money(self.cut_total(p))
        if self.has("origin"):
            cells["person-origin"] = p.origin
        if self.has("unretire"):
            cells["person-retirement"] = [f"{a.isoformat()} to {b.isoformat()}" for a, b in p.retirements]
        if self.has("person_tags"):
            cells["person-tags"] = ", ".join(p.tags)
        if self.on("snapshot_view"):
            cells["person-snapshot"] = [f"{d.isoformat()} {t}" for d, t in p.snapshots]
        return cells

    def rollups(self) -> dict:
        out = {}
        if self.has("claims"):
            out["rollup-claimed-total"] = money(self.sheet_claimed())
        if self.has("due"):
            out["rollup-due-total"] = money(self.sheet_due())
        if self.has("overdue"):
            out["rollup-overdue-count"] = str(len(self.overdue_claims()))
            out["rollup-overdue-total"] = money(self.overdue_total())
        if self.on("split_totals"):
            out["rollup-settled-total"] = money(self.settled_total())
            out["rollup-open-total"] = money(self.open_total())
        if self.on("batch"):
            out["bulk-settle-batch"] = self.last_batch
        if self.on("cut_rows"):
            out["rollup-cut-total"] = money(sum((self.cut_total(p) for p in self.people.values()), Decimal("0")))
        return out

    def header(self) -> dict:
        """cp41: the header counters, a second surface for the sheet's figures."""
        if not self.has("header"):
            return {}
        out = {"header-people-count": str(len(self.people))}
        for s in STATUSES:
            out[f"header-claims-{s}-count"] = str(sum(1 for c in self.claims if c.status == s))
        out["header-due-total"] = money(self.sheet_due())
        out["header-overdue-total"] = money(self.overdue_total())
        if self.on("my_figures"):
            me = self.find_person(self.user or "")
            v = self.due_total(me) if me is not None else None
            out["my-due-total"] = "" if me is None else ("n/a" if v is None else money(v))
            out["my-overdue-total"] = "" if me is None else money(self.overdue_total(me))
        return out

    def sheet_cells(self) -> dict:
        out = {}
        if self.has("archive"):
            out["sheet-archived"] = "yes" if self.archived else "no"
        if self.has("asof"):
            d = self.asof.get(self.user)
            out["sheet-asof"] = d.isoformat() if d else ""
        if self.has("parent"):
            out["sheet-parent"] = self.setting("parent") or ""
        out.update(self.consolidated())
        return out

    def summary(self) -> dict:
        out = {}
        if not self.has("summary"):
            return out
        for g in self.grades:
            ps = [p for p in self.people.values() if self.grade_now(p) == g and not p.retired_from]
            out[f"summary-grade-{g}-count"] = str(len(ps))
            out[f"summary-grade-{g}-due-total"] = money(
                sum((self.due_total(p) or Decimal("0") for p in ps), Decimal("0")))
            if self.has("active"):
                out[f"summary-grade-{g}-active"] = str(sum(1 for p in ps if self.active(p)))
        for per in self.periods.values():
            out[f"summary-period-{per.name}-due-total"] = self.period_total_text(per)
        if self.on("period_change"):
            prev = None
            for per in sorted(self.periods.values(), key=lambda x: x.start):
                cur = D(self.period_total_text(per))
                out[f"summary-period-{per.name}-change"] = "" if prev is None else money(cur - prev)
                prev = cur
        for s in STATUSES:
            out[f"summary-status-{s}-count"] = str(sum(1 for c in self.claims if c.status == s))
        if self.on("void_reasons"):
            for r in self.void_reasons:
                out[f"summary-void-{r}-count"] = str(sum(1 for c in self.claims
                                                         if c.status == "VOID" and c.void_reason == r))
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

    def export_claims_csv(self) -> str:
        """cp129: person,number,date,amount,due,status,period in list order, oldest claim first."""
        buf = io.StringIO()
        w = csv.writer(buf, lineterminator="\n")
        w.writerow(["person", "number", "date", "amount", "due", "status", "period"])
        for p in self.listed():
            for c in sorted(self.person_claims(p), key=lambda c: c.idx):
                per = self.claim_period(c)
                w.writerow([p.name, c.number or "", c.date.isoformat(), money(c.amount), self.due_text(c), c.status,
                            per.name if per else ""])
        return buf.getvalue()

    def export_pools_csv(self) -> str:
        """cp135: pool,member,share,cut per member in pool and member order."""
        buf = io.StringIO()
        w = csv.writer(buf, lineterminator="\n")
        w.writerow(["pool", "member", "share", "cut"])
        for pl in sorted(self.pools.values(), key=lambda x: x.order):
            cuts = self.pool_cuts(pl)
            for m in pl.members:
                v = cuts.get((m.kind, m.key))
                w.writerow([pl.name, self.people[m.key].name if m.kind == "person" else f"pool:{m.key}",
                            money(m.share), "" if v is None else money(v)])
        return buf.getvalue()

    # ---- the as-of view (cp74) --------------------------------------------------------------
    def asof_model(self, d: date) -> "Model":
        """The sheet as it stood at the end of the last sheet-today on or before `d`: every
        successful write journaled while the sheet's today was on or before `d`, replayed in
        order, with `d` as today for every figure."""
        fam: dict = {}
        screen = dict(self.screen, asof={}, preview={}, seq=[0])
        for sid in self.family:
            r = Model(self.k, sid, self.off, family=fam, screen=screen)
            r._replay = True
        entries = sorted((e, sid) for sid, live in self.family.items() for e in live.journal)
        for (_seq, user, today, name, a, kw), sid in entries:
            if today > d:
                continue
            r = fam[sid]
            r.user = user
            try:
                getattr(r, name)(*a, **kw)
            except (Refused, KeyError, StopIteration, ValueError):
                pass
        for r in fam.values():
            r.today = d
            r.user = self.user
        return fam[self.sheet]

    def view(self) -> dict:
        src = self
        d = self.asof.get(self.user) if self.has("asof") else None
        if d and self.on("asof"):
            src = self.asof_model(d)
        vars_p = {p.order: p.var for p in self.people.values()}
        vars_c = {c.seq: c.var for c in self.claims}
        people = {}
        for p in src.displayed():
            key = src._key(p)
            claims = sorted(src.person_claims(p), key=lambda c: c.idx, reverse=True)
            people[key] = {"var": vars_p.get(p.order, ""), "visible": src.visible(p),
                           "cells": src.person_cells(p),
                           "periods": {n: src.person_period_text(p, per) for n, per in src.periods.items()},
                           "claims": [(vars_c.get(c.seq, ""), src.claim_cells(c)) for c in claims]}
        periods = {}
        for n, per in src.periods.items():
            periods[n] = {"period-due-total": src.period_total_text(per),
                          "period-closed": "soft" if (per.soft and src.on("soft_close")) else
                          ("yes" if per.closed else "no")}
            if src.has("fiscal"):
                periods[n]["period-fy"] = src.fy_of(per.start)
            if src.has("period_cap"):
                periods[n]["period-cap"] = "" if per.cap is None else str(per.cap)
        plans = {}
        for pl in src.plans:
            if pl.var:
                cells = {"plan-generated": str(len(pl.generated))}
                if src.on("plan_preview"):
                    cells["plan-next-dates"] = ", ".join(d.isoformat() for d in src.plan_next(pl))
                plans[pl.var] = cells
        rates = {}
        for g in src.grades:
            r = src.rate_at(g, src.today)
            rates[g] = "n/a" if r is None else money(r)
        return {"user": self.user, "sheet": self.sheet, "today": self.today.isoformat(),
                "people": people, "rollups": src.rollups(), "header": src.header(), "periods": periods,
                "rates": rates, "summary": src.summary(), "sheet_cells": self.sheet_cells(),
                "tags": src.tag_totals(), "months": src.month_totals(),
                "pools": src.pools_view(), "plans": plans,
                "audit": list(self.audit)}

    def audit_text(self, n: int) -> list[str]:
        """The audit lines as a spec written at checkpoint n knows them: the longest run of
        leading fields with since <= n. The spec matches a line by prefix, so a field the spec
        does not know hides every field after it too (a cp61 spec cannot assert for= on a
        SNAPSHOT line, whose name= and due-total= came at cp76 and stand before it)."""
        out = []
        for event, user, fields in self.audit:
            parts = [event, f"sheet={self.sheet}", f"by={user}"]
            for a, b, s in fields:
                if s > n:
                    break
                parts.append(f"{a}={b}")
            out.append(" ".join(parts))
        return out


# ---- the requests, one per checkpoint, beside the rules they state ------------------------------

TYPE = {n: ("mutative" if n % 4 == 0 else "additive") for n in range(1, COVERAGE[1] + 1)}
SLUG = {
    1: "signin-and-sheet", 2: "sheet-today", 3: "people", 4: "name-uniqueness",
    5: "claims", 6: "audit", 7: "rates-and-due", 8: "workflow",
    9: "numbering", 10: "settle-freezes-due", 11: "rates-effective-dated", 12: "half-even",
    13: "four-eyes", 14: "edit-conflict", 15: "statements", 16: "rollup-audit",
    17: "periods", 18: "close-period", 19: "quick-add", 20: "open-claims-immutable",
    21: "retire", 22: "hold", 23: "roles-and-clerk-limit", 24: "floor",
    25: "due-by-and-overdue", 26: "late-charge", 27: "patrons-and-backing", 28: "grade-dated",
    29: "reopen-period", 30: "corrections", 31: "summary", 32: "rounding-policy-date",
    33: "export-people", 34: "bulk-open", 35: "numbering-per-period", 36: "approvals",
    37: "reassign-claim", 38: "terms-per-grade", 39: "claim-log", 40: "hold-interval",
    41: "header-counters", 42: "rate-end-dates", 43: "cap", 44: "rollup-overdue",
    45: "bulk-settle", 46: "re-settle", 47: "person-period-figures", 48: "dated-settings",
    49: "paste-claims", 50: "deferred-claims", 51: "proofs", 52: "period-status-as-of-end",
    53: "permission-matrix", 54: "viewer-role", 55: "auto-close", 56: "late-per-boundary",
    57: "split-claim", 58: "watch-and-notify", 59: "period-templates", 60: "trimmed-totals",
    61: "delegation", 62: "archive-sheet", 63: "person-terms", 64: "floor-after-late",
    65: "void-settled", 66: "redate-claim", 67: "active-people", 68: "backing-recent-settled",
    69: "claim-lock", 70: "soft-close", 71: "cancel-statement", 72: "retired-leave-totals",
    73: "statement-as-of", 74: "as-of-view", 75: "bulk-grade", 76: "snapshots",
    77: "note-required", 78: "age-buckets", 79: "entry-date", 80: "period-by-due-by",
    # ---- Act II, second half
    81: "remind", 82: "settled-and-open-totals", 83: "holidays", 84: "business-day-terms",
    85: "grace-per-grade", 86: "inline-amount", 87: "external-reference", 88: "compound-late-charge",
    89: "claim-tags", 90: "void-reasons", 91: "claim-comments", 92: "four-eyes-editor",
    93: "bulk-reassign", 94: "proof-threshold-per-grade", 95: "rate-preview", 96: "holidays-redate",
    97: "monthly-totals", 98: "settle-batches", 99: "person-contact", 100: "batch-all-or-nothing",
    # ---- Act III
    101: "audit-viewer", 102: "aliases", 103: "claim-templates", 104: "reassign-renumbers",
    105: "pools", 106: "pool-cuts", 107: "merge-people", 108: "patron-shares",
    109: "parent-sheet-rates", 110: "consolidated-figures", 111: "transfer-person", 112: "uniqueness-across-tree",
    113: "import-people", 114: "delete-and-restore-draft", 115: "nested-pools", 116: "import-upserts",
    117: "list-positions", 118: "import-rates", 119: "cut-totals", 120: "hold-pauses-cuts",
    121: "history-follows", 122: "pool-membership-dated", 123: "bulk-retire", 124: "retired-share-reallocates",
    125: "unretire", 126: "clone-sheet", 127: "my-figures", 128: "transfer-merges",
    129: "export-claims", 130: "period-comparison", 131: "plans", 132: "tree-numbering",
    133: "person-tags", 134: "sorting", 135: "export-pools", 136: "bindings-follow",
    137: "claim-lines", 138: "inline-grade", 139: "tree-audit", 140: "remainder-to-smallest",
    141: "monthly-plans", 142: "plan-preview", 143: "fiscal-year", 144: "numbering-per-fiscal-year",
    145: "bulk-redate", 146: "over-threshold-alert", 147: "snapshot-lines", 148: "claimed-without-corrections",
    149: "period-claim-cap", 150: "tree-search",
}
AREA = {n: "calc" for n in range(1, COVERAGE[1] + 1)}
AREA.update({1: "entity", 2: "entity", 3: "entity", 5: "entity", 6: "audit", 16: "audit",
             17: "entity", 23: "entity", 27: "relation", 31: "view", 33: "view", 39: "view",
             41: "view", 44: "audit", 45: "entity", 47: "view", 49: "entity", 53: "entity",
             54: "entity", 58: "audit", 59: "entity", 61: "entity", 62: "entity", 67: "view",
             69: "entity", 73: "audit", 74: "view", 75: "entity", 76: "audit", 78: "view",
             81: "audit", 82: "view", 83: "entity", 86: "entity", 87: "entity", 89: "view",
             90: "entity", 91: "audit", 93: "entity", 95: "view", 97: "view", 98: "entity",
             99: "entity", 100: "audit",
             101: "view", 102: "entity", 103: "entity", 105: "relation", 107: "entity", 109: "entity",
             110: "view", 111: "entity", 113: "entity", 114: "entity", 115: "relation", 117: "entity",
             118: "entity", 119: "view", 121: "audit", 122: "relation", 123: "entity", 125: "entity",
             126: "entity", 127: "view", 129: "view", 130: "view", 131: "entity", 133: "entity",
             134: "view", 135: "view", 137: "entity", 138: "entity", 139: "audit", 141: "entity",
             142: "view", 143: "entity", 145: "entity", 146: "audit", 147: "view", 149: "entity",
             150: "view"})

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
grade has no rate today still shows n/a even with nothing that counts (n/a wins over 0.00), unless
a settled claim keeps a figure: then the total is the sum of the figures there are. The sheet's
due-total is still everyone's due-total added up.""",
    13: """A claim records who opened it; show opened-by on the claim. The user who opened a claim cannot
settle it: the settle action is refused with an error on the claim, and the status is unchanged.""",
    14: """When a person is edited, the form remembers which version of the person it loaded. If someone
else has saved that person in the meantime, saving is refused with an error on the form, nothing
is stored, and the form shows the current values; opening the editor again and saving works.
Submitting any form twice before the first submit has answered stores one record, not two.""",
    15: """Each person's row gains a statement button. Taking a statement records the person's due-total at
that moment (STATEMENT name=<name> due-total=<due-total> claims=<count of their claims that
count>), and binds every claim of theirs that counts at that moment to the figure it has then:
from now on that claim shows and totals that bound figure, whatever later changes to rates or
grades would have made it, until the person's next statement rebinds all their counting claims
to their figures as of that moment. A claim of theirs that does not count at a statement is left
unbound (live again). A settled claim's frozen figure is unaffected. Show on each claim stated
yes/no, and on the person their statement count, the last statement's due-total and its date
(the sheet's today when it was taken).""",
    16: """Every change that alters any person's claimed or due-total is followed in the audit, after the
change's own lines, by one line per person whose figures changed: ROLLUP name=<name>
claimed=<claimed> due-total=<due-total>, people in the order they were added, a person who did
not exist before the change counting as changed; then, when the sheet's claimed-total or
due-total changed, one line TOTALS claimed-total=<total> due-total=<total>. A change that moves
no figure adds no such line (setting a rate to the value it already has, settling a claim whose
frozen figure equals its live one, re-stating a person whose figures did not move). Changing the
sheet's today is a change like any other and is followed by these lines when figures move, with
no line of its own.""",
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
claim forms applies here, and a refusal shows an error on the bar. The whole quick-add is one
change: a refused claim leaves no new person behind and writes nothing.""",
    20: """An OPEN claim can no longer be edited; only a DRAFT can, and the edit of an open claim is refused
with an error on the claim. To change an open claim, void it and add a new one. A voided claim now
keeps its number (it is still never reused), and CLAIM_VOIDED carries it.""",
    21: """A person can be retired from a date (defaults to the sheet's today). A claim dated after a
person's retirement date is refused with an error; claims dated on or before it are allowed even
if added later. Retired people are left out of the list (no row for them on the screen at all)
unless "show retired" is on: a toggle on the screen, off when the screen is first opened and left
as it is by loading a sheet. Their claims keep counting in every total. Show retired yes/no and
retired-from. Retiring writes PERSON_RETIRED name=<name> from=<date>.""",
    22: """A person can be put on hold, and taken off hold again. While held, their OPEN claims count in no
live total: not their own claimed or due-total, not the sheet's totals, not a period's total. Their
SETTLED claims still count. Show hold yes/no. Holding writes PERSON_HELD name=<name>; releasing
writes PERSON_RELEASED name=<name>.""",
    23: """The sheet's settings assign a role to a user name: clerk (the default for any name) or steward
(ROLE_SET user=<name> role=<role>). The sheet also has a clerk limit (two decimals; blank means no
limit; SETTING_CHANGED key=clerk-limit value=<limit>). A clerk can settle a claim only when its
due is at or below the limit; above it, settling is refused with an error on the claim. A claim
whose due is n/a is within any limit. Stewards settle anything. The opener still cannot settle
their own claim.""",
    24: """The sheet has a floor (two decimals, settings; SETTING_CHANGED key=floor value=<floor>). It starts
at 1.00. A claim's live due is at least the floor. A settled claim's frozen figure, a claim's
figure bound by a statement, and a closed period's fixed total are unchanged by the floor; a
statement taken while a floor applies binds the floored figure. The floored figure shows wherever
due appears, and every total adds up the floored figures.""",
    25: """The sheet has terms: a number of days (settings, SETTING_CHANGED key=terms value=<days>), 14
unless changed. A claim's due-by is its date plus the terms in force. A claim is overdue when it
is OPEN and its due-by is before the sheet's today. Show due-by and overdue yes/no on each claim,
and per person and for the sheet an overdue count and overdue-total (the due of the overdue
claims that count).""",
    26: """The sheet has a late percent (two decimals, settings, 0.00 unless changed; SETTING_CHANGED
key=late-pct value=<percent>). An overdue claim's due gains the late percent of its figure (the
bound figure if a statement binds it, else the floored live figure) for every full 30 days it is
overdue, rounded like due and added on top. The late charge is never bound by a statement: a
statement binds the figure under it, and the charge keeps following the sheet's today. Settling
freezes the charge in, and the overdue-total includes it.""",
    27: """A person may name other people on the sheet as their patrons, one at a time from their row (not
themselves, and not the same person twice; a refusal shows an error on the row; PATRON_ADDED
name=<name> patron=<patron name>). Show each person's patrons (names, comma and space separated,
sorted) and their backing: their patrons' due-totals added up, skipping n/a, 0.00 with no
patrons.""",
    28: """A person's grade is now dated. The person form gains a from-date (default the sheet's today), and
each save with a grade records that grade from that date, keeping the ones already recorded; the first
grade a person was given applies from the beginning of time. A claim uses the grade in force on
the claim's date to find its rate; the list shows the grade in force on the sheet's today, and
PERSON_EDITED carries that same grade, the one in force on the sheet's today after the save (so a
grade dated from another day may leave both unchanged). An import line gives its grade from the
sheet's today.""",
    29: """A closed period can be reopened, by a steward only (anyone else is refused with an error on the
period). Reopening makes its due-total live again: the claims in it show and total their current
figures, bound ones at their bound figure. Reopening writes PERIOD_REOPENED period=<name>.""",
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
figures (the rate step and the late charge). A correction rounds by the date of the claim it
corrects, not its own. Settled figures stay frozen and figures bound by a statement stay bound.""",
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
instead of being refused (CLAIM_PENDING, naming the claim like every claim line). A PENDING claim
counts as open in every total, but is not bound by a statement: while PENDING it shows and totals
its live figure. A steward approves it (it becomes SETTLED, frozen at that moment, CLAIM_APPROVED
with due=<due> at the end like CLAIM_SETTLED) or rejects it with a reason (back to OPEN, bound
again by the last statement if that statement included it, CLAIM_REJECTED with reason=<reason> at
the end). The opener cannot approve their own claim. In every other way a PENDING claim is handled
like an OPEN one: it cannot be edited, it can be voided (CLAIM_VOIDED), it goes overdue and bears
the late charge, and a hold takes it out of the totals.""",
    37: """A steward can move a DRAFT, OPEN or PENDING claim to another person on the sheet (a refusal
shows an error on the claim). The claim keeps its number and date, loses any figure a statement
bound it to (it is live again until its new person's next statement), every total follows, and
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
live totals; their other open claims count, and a claim bound by a statement stays in the totals
whatever its date. Show hold yes/no as whether the person has any hold. Holding writes
PERSON_HELD name=<name> from=<date>; releasing is no longer a separate action (a hold ends on
its to-date).""",
    # ---- Act II
    41: """The screen gains a header with counters, shown at all times: the number of people on the sheet
(retired people included), the number of claims in each status (DRAFT, OPEN, PENDING, SETTLED,
VOID), the sheet's due-total and the sheet's overdue-total. Each counter always equals the figure
it repeats: the status counts those of the summary, the two totals the sheet's totals.""",
    42: """A rate may carry a to-date as well as a from-date (RATE_SET gains to=<date> at the end when one
was given; a to-date before the from-date is refused). A rate applies through its to-date; a claim
dated after the to-date of the rate that would apply to it, with no later rate in force on the
claim's date, has due n/a, and everything that reads due follows (a total skips it, a statement
binds n/a, the late charge has nothing to add to).""",
    43: """The sheet has a cap (two decimals, settings, blank means none; SETTING_CHANGED key=cap
value=<cap>). A person's due-total is at most the cap: when the sum of their figures is above it,
their due-total shows the cap and their excess shows the difference, otherwise the excess is
0.00. Everything that adds up due-totals (the sheet's due-total, a grade's, backing, the ROLLUP
and TOTALS lines, the export) uses the capped figure. A due-total of n/a is not capped.""",
    44: """A change that alters any person's overdue-total is now also followed by the rollup lines, and
every ROLLUP line gains overdue-total=<overdue-total> at its end, every TOTALS line
overdue-total=<total> at its end (a TOTALS line is written when any of its three totals moved).
A change of the sheet's today that puts a claim past its due-by, or takes one out of overdue, is
such a change even when no due or due-total moved.""",
    45: """Selected claims can be settled together with one button, each in list order (people as added,
newest claim first within a person) by exactly the rules of settling one claim, by the signed-in
user: a claim that goes to PENDING counts as settled by the button, a claim that cannot be settled
is left as it is. Show how many were settled and how many were refused. Each claim that went
through writes its own lines as a single settle would.""",
    46: """A steward can re-settle a SETTLED claim (anyone else, or any other status, or a claim in a closed
period, is refused with an error on the claim). Re-settling freezes the claim again at the figure
it would have today as an open claim bound by no statement: today's rates, grades, floor and late
charge. The status log gains a SETTLED line for it, and CLAIM_RESETTLED is written, naming the
claim like every claim line, ending old=<previous figure> new=<new figure>.""",
    47: """Each person's row shows, for every period on the sheet, the person's due-total for that period:
the due of their claims that count whose date falls in the period. Closing a period fixes these
figures too, at that moment, for every person on the sheet; a person added later shows 0.00 for
a closed period. Reopening makes them live again. The period's own due-total is always the sum of
the people's figures for it.""",
    48: """Settings that carry a figure are now dated: the floor, the late percent, the terms (the sheet's
and each grade's), the clerk limit, the cap, and any later limit or threshold. Saving one of them
records its value from a from-date (default the sheet's today), keeping the values already recorded
(a save with a from-date already recorded replaces that value); SETTING_CHANGED gains from=<date>
at its end when one was given. A claim's floor and late percent and the terms that fix its due-by
are the values in force on the claim's date: the latest from-date on or before it, and before
every from-date the sheet's starting value (1.00, 0.00, 14 days). The clerk limit and the cap are
the values in force on the sheet's today. The policy date and the period numbering date are not
dated. The settings panel shows, for each key, the value in force on the sheet's today.""",
    49: """A paste box takes lines of name,amount,date,note (the note may hold commas; the date may be
blank for the sheet's today; the note may be absent) and adds a DRAFT claim per line, in order,
for the named person (the name must be on the sheet, matched as names are compared). Every line is
checked first with exactly the claim form's rules: if any line fails, an error shows on the box
and nothing is added; otherwise every claim is added and written as CLAIM_ADDED. Show how many
were added.""",
    50: """An OPEN claim can be deferred to a date after the sheet's today (an entry and a button on the
claim; a claim that is not OPEN, a date not after today, or a claim in a closed period is refused
with an error on the claim; CLAIM_DEFERRED naming the claim and ending until=<date>). Until the
sheet's today reaches that date the claim counts in no total, is not overdue, cannot be settled
and is left unbound by a statement; from that day on it is an OPEN claim like any other. Show
deferred yes/no and the deferred-until date on the claim. Reaching the date through a change of
the sheet's today moves figures like any other change.""",
    51: """A claim has a proofs count, raised by one with a button on the claim (not on a SETTLED or VOID
claim; CLAIM_PROOF_ADDED naming the claim, ending proofs=<count>). The sheet gains a proof
threshold (settings, dated like the floor; SETTING_CHANGED key=proof-threshold value=<amount>;
blank means none). A claim whose due is above the threshold in force on the claim's date cannot be
settled or approved while its proofs count is 0: the action is refused with an error on the claim,
before the clerk limit is considered (so it never goes to PENDING). Show the proofs count.""",
    52: """A period's due-total, and each person's figure for a period, now count a claim by the status it
had at the end of the period's last day, as the claim's status log records it (the log's dates are
the sheet's today when each change was made): a claim settled after the period's end counts as it
was then; a claim opened after the end does not count; a claim voided after the end still counts;
a claim added after the end does not. The figure counted is the claim's due as shown now; a
deferred claim, a held claim or a retired person's claim is left out as the live rules say. A
closed period's fixed figures are unchanged by this.""",
    53: """The settings gain a permission matrix: for each of open, settle, void, reassign, close and
reopen, which roles may do it, as a comma separated list of roles (SETTING_CHANGED
key=perm-<action> value=<roles>; not dated). A blank entry keeps the standing rule: open, settle,
void and close by clerk and steward; reassign and reopen by steward. An action a role is not
allowed is refused with its usual error. The opener still cannot settle their own claim, the
clerk limit and the proof threshold still apply, and approving or rejecting stays with stewards.""",
    54: """A third role, viewer, can be assigned. A viewer sees every screen and figure and can change
nothing: every form submission and every action, including changing the sheet's today, a
statement, a hold and the paste box, is refused with its usual error, writes nothing and changes
nothing.""",
    55: """The sheet has grace days (settings, a whole number, blank means off, not dated; SETTING_CHANGED
key=grace-days value=<days>). When the sheet's today is changed, every open period whose to-date
plus the grace days is before the new today is closed, in order of their to-dates, exactly as a
close by hand would, each writing PERIOD_CLOSED with auto=yes at its end; these lines come after
the new today is set and before the rollup lines of the today change.""",
    56: """The late charge is now worked out per 30-day boundary: for each full 30 days a claim is overdue,
the late percent in force on that boundary date (the due-by plus 30, 60, 90 ... days) of the
claim's figure, rounded like the claim, and the charges added up; a boundary whose percent is 0.00
adds nothing. A claim settled with its charge keeps the frozen figure.""",
    57: """An OPEN claim can be split: an amount on the claim (more than 0.00 and less than the claim's
amount) and a button. The claim keeps the rest of its amount and loses any figure a statement
bound it to; a new OPEN claim with the split-off amount, the same date and note, the next number,
opened by the signed-in user and with a due-by fixed now from the terms in force on the date, is
listed under the person. Both show the original's number as split-from (the new claim; the
original shows nothing). A PENDING, deferred or settled claim, or one in a closed period, cannot
be split. CLAIM_SPLIT is written naming the original with its remaining amount and ending
into=<new number>, then CLAIM_OPENED for the new claim, then the rollup lines.""",
    58: """A user can watch a person (a toggle on the row, per user; PERSON_WATCHED name=<name>,
PERSON_UNWATCHED name=<name>); show watched yes/no for the signed-in user. When a watched
person's claim is settled, approved or re-settled, one line NOTIFY user=<watcher> person=<name>
number=<number> is written per watching user, in the order they started watching, after the
claim's own line and before the rollup lines.""",
    59: """Periods can be generated: a from-date and a to-date and a button create one period per calendar
month from the from-date's month to the to-date's month, each running from the first to the last
day of its month (February ends on the 28th or 29th), named yyyy-mm, each written as PERIOD_ADDED.
A month whose name is already a period, or whose days overlap a period on the sheet, is left out
and the others are still made. Show how many were made. A to-date before the from-date is refused
with an error.""",
    60: """The sheet's due-total and the sheet's overdue-total (wherever they show: the totals row, the
header, the TOTALS line) now leave out the single highest and the single lowest person's figure
when three or more people have a figure (a due-total of n/a is no figure; an overdue-total is
always a figure). Per-person figures, per-grade and per-period totals, backing and the claimed
total are not trimmed.""",
    61: """A steward can delegate the steward role to a user for a from-date and a to-date, inclusive, by
the sheet's today (a form; DELEGATED user=<user> from=<date> to=<date>; anyone but a steward, or a
to-date before the from-date, is refused with an error on the form). While the sheet's today is
inside the range the user acts as a steward in every rule; every audit line of a change that
user makes then (not the ROLLUP and TOTALS lines) ends with for=<the steward who delegated>.""",
    62: """A steward can archive the sheet (a button; SHEET_ARCHIVED; anyone else is refused with an error
on the sheet). Show archived yes/no. On an archived sheet everything stays visible and every
change is refused with its usual error, including changing the sheet's today, every bulk action,
the paste box and the quick-add bar.""",
    63: """A person may have their own terms: a number of days on the person form, blank for none
(PERSON_ADDED and PERSON_EDITED gain terms=<days> at the end when the form gave a value, the empty
value when it was cleared). A claim's due-by is fixed at creation from the first of: the person's
own terms, the terms of their grade, the sheet's terms, each as in force on the claim's date. Show
the person's terms on the row.""",
    64: """The order of the due steps changes: the late charge is now worked out on the rate figure alone,
or on the figure a statement bound, and the floor is applied last: a claim's live due is the
greater of the floor in force on its date and its figure plus its late charge. A statement now
binds the rate figure, not the floored one. Settled figures stay frozen; a correction is unchanged
(no floor, no charge).""",
    65: """A steward may void a SETTLED claim within 7 days of its settlement by the sheet's today (the
status log's SETTLED date). The frozen figure leaves every total, the claim keeps its number, and
CLAIM_VOIDED ends with reversed=<the frozen figure>. Anyone else, a later day, or a claim in a
closed period is refused with an error on the claim.""",
    66: """A steward can re-date an OPEN or PENDING claim (a date entry and a button on the claim;
CLAIM_REDATED naming the claim with its new date and ending old=<old date> new=<new date>). A
date after the person's retirement, a claim in a closed period or a new date inside one, or anyone
but a steward, is refused with an error on the claim. The due-by stays as it was fixed; a figure
bound by a statement stays bound; the claim's period follows the new date, and when per-period
numbering is on and the period changes, the claim receives the next number of its new period's
sequence and its old number is never used again.""",
    67: """Show on each person whether they are active: yes when they have an OPEN or PENDING claim that
counts dated within the 30 days up to and including the sheet's today. The summary shows per
grade the number of active people on that grade (retired people excluded).""",
    68: """Backing is now the sum of the patrons' settled figures over their SETTLED claims dated within the
90 days up to and including the sheet's today (each at its frozen figure), 0.00 with none.""",
    69: """Opening a claim's editor (the edit button) now locks the claim for other users until the editor
is saved or cancelled (a cancel button on the claim) or the sheet's today changes; another user's
edit button on a locked claim is refused with an error on the claim. A claim that cannot be edited
is refused at the edit button, as before, and takes no lock; a viewer's edit button is refused like
any action of theirs.""",
    70: """A period can be soft-closed (a button beside close): its due-total and every person's figure for
it are fixed at that moment, but claims dated inside it can still be added, edited, opened, settled
and voided; a claim added while its period is soft-closed shows late-entry yes and writes
LATE_ENTRY, naming the claim, after its CLAIM_ADDED line. Show closed as soft for a soft-closed
period. A soft-closed period can be closed (fixing the figures afresh) or reopened by a steward;
closing writes PERIOD_SOFT_CLOSED period=<name> total=<due-total> for a soft close.""",
    71: """A steward can cancel a person's last statement (a button on the row; STATEMENT_CANCELLED
name=<name> due-total=<the cancelled statement's due-total>; anyone else, or a person with no
statement, is refused with an error on the row). The claims that statement bound become live
again; a figure bound by a statement before it is not restored. The statement count goes down by
one, and the row shows the statement before it (or nothing).""",
    72: """From the day a person's retirement date is reached (the sheet's today on or after it), their
OPEN and PENDING claims leave every live total, as a hold's would; their SETTLED claims still
count, and a claim bound by a statement stays in the totals. Retiring, and a change of the sheet's
today that reaches a retirement date, moves figures like any other change.""",
    73: """A statement can be taken as of a date on or before the sheet's today (a date entry beside the
statement button; blank takes the statement now). It binds the person's claims that counted at the
end of that date to their figures as they stood then: every change made while the sheet's today
was on or before that date counts, every later change does not, and that date stands in for the
sheet's today in every figure (the grade and rate in force, the floor, late charges, holds,
retirements, closed periods). Every other claim of theirs is unstated, as a statement does. The
row shows that date as the statement date and that day's due-total as the stated total; STATEMENT
gains asof=<date> at its end when a date was given. A date after the sheet's today is refused with
an error on the person.""",
    74: """An as-of date can be set on the screen (an entry, a set button and a clear button; show the
as-of date, or nothing). While it is set, every figure and flag on the screen for the signed-in
user, in every row, every total, the header, the periods, the rates and the summary, is shown as
it stood at the end of the last day on or before that date: every change made while the sheet's
today was on or before the as-of date counts, every later change does not, and the as-of date
stands in for the sheet's today in every figure (overdue, late charges, holds, deferrals,
retirements, the grade and rate in force). The audit file is unaffected, and every change,
a statement as of a date included, is refused with its usual error while the as-of date is set.
The as-of date belongs to the signed-in user's screen; other users are unaffected.""",
    75: """People can be selected (a checkbox on each row) and given a grade together: a grade, a from-date
(default the sheet's today) and a button. Each selected person, in list order, gets that grade
from that date exactly as the person form would, with the same PERSON_EDITED and rollup lines.
Show how many were changed.""",
    76: """When the sheet's today is changed, one line SNAPSHOT name=<name> due-total=<due-total> is written
per person, in list order, with the due-total as it stood on the day being left, before the change
takes effect; these lines come before any period closes and before the rollup lines of the change.""",
    77: """The sheet gains a note threshold (settings, dated like the floor; SETTING_CHANGED
key=note-threshold value=<amount>; blank means none). A claim whose due is above the threshold in
force on its date cannot be opened with an empty note: opening it, alone or by the bulk button, is
refused with an error on the claim.""",
    78: """Show on each person the due of their OPEN and PENDING claims that count, split by the age of
the claim on the sheet's today (the days from the claim's date): aged 0 to 30 days, 31 to 60, and
61 or more. A claim dated after today counts as 0 to 30.""",
    79: """The sheet may have an entry date (settings, a date, blank means off, not dated; SETTING_CHANGED
key=entry-date value=<date>). While it is set, it is the default date of a new claim wherever the
sheet's today was: the claim form, the quick-add bar, a pasted line with a blank date and a
correction.""",
    80: """A claim now belongs to the period containing its due-by date, not its date (the due-by as fixed
at creation; for a claim about to be added, its date plus the terms it would get). Everything
that depends on a claim's period follows: the period shown on the claim, period totals and the
per-person period figures, per-period numbering, and which claims a closed period refuses (a
claim whose due-by falls in a closed period cannot be added, edited, opened, settled or voided; a
claim dated in a closed period whose due-by falls outside it can).""",
    # ---- Act II, second half
    81: """An OPEN or PENDING claim can be reminded (a button on the claim): REMIND is written, naming the
claim like every claim line, and the claim shows the sheet's today as its reminded date. A claim
can be reminded once per sheet-today: a second press on the same day, or a press on a claim in any
other status, is refused with an error on the claim and writes nothing. The reminded date is the
last day a reminder was written, or nothing.""",
    82: """Show on each person their settled-total (the due of their SETTLED claims that count, at
their frozen figures, corrections included) and their open-total (the due of their OPEN and
PENDING claims that count: a held, deferred or retired-and-excluded claim is left out as it is
from the due-total). Show the sheet's settled-total and open-total too, each simply everyone's
figure added up (not trimmed). The two must add up to the person's untrimmed due-total before the
cap.""",
    83: """The sheet has a list of holidays (a date entry and an add button; HOLIDAY_ADDED date=<date>; a
date already on the list is refused with an error beside the entry). A claim's due-by, when it is
fixed at creation, is moved past any holiday: when the date plus the terms falls on a holiday, the
due-by is the next day that is not a holiday. The holidays on the sheet when the claim is created
decide; a holiday added later leaves existing due-by dates as they are.""",
    84: """Terms now count business days. A claim's due-by is the terms-th business day after its date,
counting forward from the day after the claim's date and skipping every Saturday, Sunday and
holiday on the sheet (so a claim dated on a Friday with terms 1 is due on the Monday, and a claim
with terms 5 is never due on a weekend or a holiday). Every due-by on the sheet is worked out this
way, for the claims already on the sheet as well as new ones, each with the terms it was fixed with
and the holidays on the sheet now; everything that reads the due-by (overdue, the late charge's
boundaries, the period a claim belongs to) follows.""",
    85: """Grace days can be set per grade (settings, SETTING_CHANGED key=grace-<grade> value=<days>, dated
like the floor; blank means none). A claim whose person's grade in force on the claim's date has a
grace in force on that date is overdue only when its due-by plus the grace days is before the
sheet's today, and the late charge's 30-day boundaries are counted from the due-by plus the grace.
The due-by shown on the claim is unchanged.""",
    86: """A DRAFT claim's amount can be changed in the row itself: an amount entry and a save button on
the claim, beside the edit button. It follows exactly the claim form's rules (the amount's form,
a claim that cannot be edited, a locked claim, a closed period, the viewer) and writes CLAIM_EDITED
as the form does; a refusal shows the claim's error.""",
    87: """A claim may carry an external reference: a text on the claim form (surrounding spaces removed),
shown on the claim. A reference already used on the sheet, comparing without regard to case, is
refused with an error on the form, and nothing is saved; a blank reference is no reference. A
pasted line gives it at the end of its note as ` #<reference>` (a space, a hash, the reference:
that part is the reference, not part of the note), checked the same way and refusing the whole
paste on a repeat, within the paste too. CLAIM_ADDED gains ref=<reference> at its end when one was
given.""",
    88: """The late charge now compounds: the charge for each 30-day boundary is the late percent in force
on that boundary date of the claim's figure plus the charges of the boundaries before it, each
rounded like the claim as before, then added up. A claim settled with its charge keeps the frozen
figure.""",
    89: """A claim may carry tags: a comma separated text on the claim form, each tag trimmed and
lower-cased, repeats dropped; the claim shows its tags sorted, comma and space separated. The form
can change a claim's tags when it can edit the claim. For every tag ever used on the sheet, the
sheet shows a due-total per tag: the due of the claims that count which carry it (a claim with two
tags counts in both). CLAIM_ADDED gains tags=<comma separated, sorted> at its end when any were
given.""",
    90: """The sheet has a list of void reasons (a text entry and an add button; VOID_REASON_ADDED
reason=<text>; blank or repeated is refused with an error beside the entry). While the list is not
empty, voiding a claim needs a reason chosen from it (a select on the claim): a void without one is
refused with an error on the claim. CLAIM_VOIDED gains reason=<reason> at its end when one was
given. The summary shows, per reason on the list, the count of VOID claims voided with it.""",
    91: """A claim can be commented (a text entry and a button on the claim; an empty comment is refused
with an error on the claim). Each comment is kept with the user who wrote it and the sheet's today
when it was written, shown on the claim in order as <user> on <date>: <text>, and written as
COMMENT_ADDED, naming the claim like every claim line and ending text=<text>. A viewer, an archived
sheet and the as-of view refuse it like any change.""",
    92: """The user who last edited a claim (through the claim form or the row's amount entry) can no longer
settle or approve it, exactly as its opener cannot: the action is refused with an error on the
claim and nothing changes. Selecting claims to settle together follows the same rule.""",
    93: """Selected claims can be moved to another person together: a select of the person and a button
beside the bulk buttons. Each selected claim is moved in list order by exactly the rules of moving
one claim (who may, which statuses, closed periods, retirement, with the same CLAIM_REASSIGNED and
rollup lines); each that cannot is left as it is. Show how many were moved and how many were
refused.""",
    94: """The proof threshold can be set per grade (settings, SETTING_CHANGED key=proof-threshold-<grade>
value=<amount>, dated like the floor; blank means none). For a claim, the threshold in force is
its person's grade's threshold in force on the claim's date when one is set, else the sheet's.""",
    95: """The rates panel gains a preview: a grade, a candidate rate and a preview button show how many
OPEN and PENDING claims of people on that grade (the grade in force on the claim's date) would show
a different due if that rate applied to the grade on every date, and the sum of the differences
(new due minus current due, two decimals, negative when lower). A claim bound by a statement does
not change; a settled claim is not counted. Nothing is saved and nothing is written to the audit.""",
    96: """Adding a holiday now re-fixes the due-by of every claim on the sheet that is not SETTLED or VOID
and whose due-by is on or after the new holiday: each is worked out again from the claim's date,
with the terms it was fixed with, over the holidays now on the sheet. A claim whose overdue state
or late charge moves as a result moves figures like any other change, so HOLIDAY_ADDED is
followed by the rollup lines when any figure moved.""",
    97: """Show a due-total per calendar month: for every month (yyyy-mm) that any claim on the sheet is
dated in, the due of the claims dated in that month that count.""",
    98: """A bulk settle that settles at least one claim (a claim that goes to PENDING counts) is a batch,
numbered 1, 2, ... on the sheet in the order the batches happen. Each claim settled by it shows its
batch number; a claim settled one at a time shows nothing. The screen shows the number of the last
batch beside the bulk settle button, or nothing when there has been none.""",
    99: """A person may have a contact: a text on the person form, stored with surrounding spaces removed and
lower-cased, shown on the row. A contact already on the sheet (another person's) is refused with
an error on the form, and nothing is saved; a blank contact is none. PERSON_ADDED and
PERSON_EDITED gain contact=<contact> at the end when the form gave one.""",
    100: """A bulk settle is now all-or-nothing: if any selected claim cannot be settled by the signed-in
user (any refusal the single settle would give; going to PENDING is not a refusal), none of them is
settled, every one counts as refused and nothing is written. Otherwise every selected claim is
settled in list order as before, and after the claims' own lines one line BATCH_SETTLED
batch=<batch number> count=<claims in the batch> total=<the frozen figures of those SETTLED, added
up> is written.""",
    # ---- Act III
    101: """Add an audit viewer to the screen: a filter entry, a show button and a list of lines. With the
filter blank it lists every audit line of this sheet exactly as the file holds it, newest first.
With a name in the filter it lists only the lines about that person: those carrying name=<the
name> or person=<the name>, compared as names are compared (case and surrounding spaces ignored).
The viewer reads what the file holds; it is not a second record.""",
    102: """A person may have aliases: an entry and an add button on the row (PERSON_ALIAS_ADDED name=<name>
alias=<alias>; a blank alias is refused with an error on the row). Aliases share the names'
uniqueness: an alias must not equal, as names are compared, any name or alias on the sheet, and a
new name or renaming must not equal any alias. The quick-add bar and the paste box find a person by
an alias as well as by the name. Show the person's aliases, sorted as names are compared, comma and
space separated.""",
    103: """The sheet has claim templates: a name, an amount and a note, saved from a form (TEMPLATE_SAVED
name=<name> amount=<amount> note=<note>; a blank name or an amount the claim form would refuse is
refused with an error on the form; saving a name again replaces that template). Each person's row
has a template select and a button that adds a DRAFT claim with the template's amount and note at
that moment, dated like a claim with no date, by every rule of the claim form (CLAIM_ADDED as the
form writes it). Changing or re-saving the template later does not alter claims made from it.""",
    104: """A claim that is moved to another person now receives the next number in the sequence it would be
numbered in (the sheet's, or its period's when per-period numbering is on), and its old number is
never used again; a draft, having no number, gets none. CLAIM_REASSIGNED carries the new number.
Moving claims together follows the same rule, in list order.""",
    105: """The sheet has pools. A pool has a name (unique, surrounding spaces removed, not blank; a form;
POOL_ADDED name=<name>) and members: a person chosen from a select, with a share percent (two
decimals, more than 0.00 and at most 100.00), added from the pool's row (POOL_MEMBER_ADDED
pool=<pool> name=<person> share=<share>); a person already in the pool, or a bad share, is refused
with an error on the pool. Show for each pool its total share and balanced yes/no: balanced when the
shares total exactly 100.00. A retired member's share counts as 0.00 toward the total. A person can
be in several pools. Show each member's share on the member's line.""",
    106: """The sheet has a pot (two decimals, settings, blank means none, not dated; SETTING_CHANGED key=pot
value=<pot>). Each member of a balanced pool shows a cut: the pot times their share divided by
100, rounded half to even to two decimals; a retired member cuts 0.00. The remainder, the pot minus
the cuts added up, goes to the member with the largest share, the earliest added on a tie, so the
cuts total exactly the pot. An unbalanced pool, or no pot, shows no cut (an empty cell).""",
    107: """A steward can merge a person into another (a select of the other person and a merge button on
the row; PERSON_MERGED from=<name> into=<name>; anyone else, the same person, or either of them
retired, is refused with an error on the row). The merged person's claims move to the other
(numbers and dates kept, listed after the other's claims in the order they were added, each losing
any figure a statement bound); the merged name and aliases become aliases of the other; the merged
person's patrons are added to the other's (not themselves, no repeats), anyone naming the merged
person as patron names the other instead (no repeats), and the merged person's pool memberships move
to the other (shares added when the other is already a member). Their statements, holds, watchers
and contact are dropped. The merged person leaves the list (no row), and every total follows.""",
    108: """A person's patrons now carry shares: 100.00 split equally among the patrons in the order they were
named, each share rounded half to even to two decimals, with the remainder (100.00 minus the shares
added up) given to the first-named patron. The patrons cell shows each patron as <name> <share>,
sorted by name, comma and space separated. Backing is now the sum over the patrons of the patron's
figure (their settled figures of the last 90 days, as before) times their share divided by 100,
rounded half to even.""",
    109: """A sheet may name a parent sheet (settings, SETTING_CHANGED key=parent value=<sheet id>; not
dated). A sheet cannot be its own parent, nor name a sheet that has this sheet as an ancestor; and
the parent must be a sheet that exists (has been loaded); each is refused with an error on the
settings. When a grade has no rate in force on a date on this sheet, the parent's rate for that grade
and date is used, then the parent's parent, up to three levels up. Show the parent sheet id on the
screen (nothing when none).""",
    110: """A sheet's children are the sheets naming it as their parent. The screen gains consolidated figures
over the sheet and all its descendants: the number of people, the due-total (each sheet's due-total
as that sheet shows it, added up) and the overdue-total (likewise). A sheet with no children shows
its own figures there.""",
    111: """A steward can transfer a person to another sheet by id (an entry and a button on the row;
anyone else, a retired person, this sheet's own id, is refused with an error on the row). The person arrives on the other sheet with every grade they were given (and its from-date), their
terms, contact, aliases and tags, and their claims with their status, dates, notes, frozen figures
and logs; each claim that had a number
receives the next number of the other sheet, in the order the claims were opened; figures a
statement bound are lost and the statement count starts at 0; references are not carried. A name,
alias or contact already on the other sheet refuses the transfer. The person leaves this sheet
entirely (patron links, pool memberships, plans and watches dropped). This sheet writes
PERSON_TRANSFERRED name=<name> to=<sheet id>, the other PERSON_TRANSFERRED name=<name>
from=<sheet id>, each followed by that sheet's rollup lines.""",
    112: """A name or alias may no longer be used on a sheet when any sheet of its tree (its ancestors, its
descendants and their descendants, among the sheets that exist) already uses it as a name or alias:
adding, renaming, an alias, the quick-add bar, the paste box and the import are refused as a
duplicate would be. People who already clash are not changed: each shows clashing yes, and every
edit of them through the person form is refused until the edit renames them to a name that does not
clash (and leaves no clashing alias).""",
    113: """People can be pasted in as lines of name,grade,terms,contact into an import box (the last two may
be absent or blank). Every line is checked first with exactly the person form's rules (names, aliases,
contacts, grades, terms; a name or contact repeated within the paste is an error): if any line
fails, an error shows on the box and nothing is imported; otherwise every person is added in order,
each as the form would add them (PERSON_ADDED with the same fields). Show how many were added.""",
    114: """A DRAFT claim can be deleted (a button on the claim; any other status, or a claim in a closed
period, is refused with an error on the claim): its status becomes DELETED, it counts nowhere (not
in any total, not in the status counts of the header or the summary), it cannot be edited, opened
or voided, its log gains a DELETED line, and CLAIM_DELETED is written naming the claim. On the same
sheet-today it was deleted, a restore button makes it a DRAFT again (CLAIM_RESTORED, a DRAFT line in
the log); on a later day the restore is refused.""",
    115: """A pool member may be another pool, chosen from the member select as pool:<name>, with a share
like a person's. A pool can be a member of at most one pool, cannot contain itself through any
chain, and a chain of pools is at most three deep; each is refused with an error on the pool. A
pool that is a member of another has no pot of its own: its pot is its cut in the pool above (so an
unbalanced pool above, or none, leaves it with no cuts). The sheet's pot is the pot of a pool that
is a member of none.""",
    116: """An import line whose name matches a person on the sheet (by name or alias, as names are compared)
now updates that person instead of being refused: their grade is recorded from the sheet's today
as the form would, and their terms and contact are set when the line gives them, writing
PERSON_EDITED exactly as the form does. Other lines still add. An error on any line still means
nothing is imported. Show how many were added and how many updated.""",
    117: """People have a position in the list. Up and down buttons on the row swap the person with the one
above or below (PERSON_MOVED name=<name> position=<new position, counting from 1>); the top row
cannot move up nor the bottom row down (refused with an error on the row). The list, the rollup lines
and every action that works in list order follow the positions. New people go to the end.""",
    118: """Rates can be pasted as lines of grade,rate,from,to (the last two may be absent or blank) into a
rate import box. Every line is checked first with the rate form's rules; if any fails, an error
shows and nothing is set; otherwise every line is set in order exactly as the form would set it
(replacing a rate for the same grade and from-date, writing RATE_SET). Show how many were set.""",
    119: """Show on each person their cut total: their cuts across every pool they are a member of, added
up (a pool that shows no cuts adds nothing). Show the sheet's cut total: everyone's added up.""",
    120: """A person with a hold in force on the sheet's today (a hold whose dates include today) gets no cut
from any pool, and their share is spread over the other members with a cut in proportion to those
members' shares: each member's cut is the pot times their share divided by the shares of the members
with a cut, added up, rounded half to even, with the remainder to the largest share as before. The
pool's total share and balance are unchanged by the hold.""",
    121: """A transferred person shows the sheet they came from (nothing for anyone else), and the audit
viewer, filtered by their name, lists after this sheet's lines about them the lines about them
from the sheet they came from, newest first, each as that sheet's file holds it.""",
    122: """A pool membership may carry a from-date and a to-date (optional; a to-date before the from-date
is refused; POOL_MEMBER_ADDED gains from=<date> and to=<date> at the end when given). A member whose
dates do not include the sheet's today is left out entirely: not in the total share, not in the
balance, no cut.""",
    123: """Selected people can be retired together from a date: a date entry and a button beside the bulk
buttons. Each selected person is retired in list order exactly as the row's retire does (with its
PERSON_RETIRED and rollup lines); show how many were retired.""",
    124: """A retired member of a pool is now left out of the cuts and their share is spread over the other
members in proportion to those members' shares (as a held member's is), instead of counting as 0.00:
the pool's total share and balance count the retired member's share as given. A pool whose every
member is retired shows no cuts.""",
    125: """A retired person can be unretired (a button on the row; PERSON_UNRETIRED name=<name> on=<the
sheet's today>; anyone not retired is refused with an error on the row). They are no longer retired
(retired no, no retired-from); the retirement is kept on the row as <from> to <the day unretired>, one line per past
retirement; and a claim dated after the from and before the to of a
past retirement is refused as a claim after a retirement is.""",
    126: """A steward can clone the sheet to another id (an entry and a button; SHEET_CLONE_MADE to=<id> on
this sheet). The other sheet must be empty (never used); otherwise, or for anyone but a steward,
the clone is refused with an error on the sheet. The clone gets this sheet's today, settings, roles,
rates, holidays, void reasons, templates, people (grades, terms, contacts, aliases, tags, holds,
retirements, patrons), pools, periods (all open) and claims (status, frozen figures, dates, notes,
logs; numbers given afresh in the order the originals were opened, by the clone's own numbering);
statements are not copied. The clone's first audit line is SHEET_CLONED from=<this sheet's id>,
followed by its rollup lines for every person and its totals.""",
    127: """The header shows the signed-in user's own figures when a person on the sheet has the user's name
(by name or alias, as names are compared): that person's due-total and overdue-total; nothing when
there is no such person.""",
    128: """A transfer to a sheet that already has a person with the same name or alias (as names are
compared) now merges the arriving person into them instead of being refused, exactly as a merge
does (claims after theirs, aliases joined, bound figures lost); the other sheet writes
PERSON_TRANSFERRED name=<name> from=<sheet id> then PERSON_MERGED from=<name> into=<name>.""",
    129: """A button downloads the claims as a CSV file: a header line person,number,date,amount,due,status,period
then one line per claim, people in list order and each person's claims oldest first, retired people
included whether shown or not, with the figures as the screen shows them (an empty number, period or
n/a as it is). Quoting and line ends as the people export.""",
    130: """The summary shows, for each period, the change of its due-total from the period before it by
start date (this period's due-total minus the previous one's, two decimals, a minus sign when lower);
the earliest period shows nothing.""",
    131: """A person can have plans: an amount, a start date, every N days (a whole number, at least 1) and an
end date, from a form on the row (PLAN_ADDED name=<name> amount=<amount> start=<date>
every=<n> end=<date>; an end before the start or a bad amount or interval is refused with an error
on the row). A generate button on the screen makes, for every plan on the sheet in the order they
were added, a DRAFT claim with the plan's amount for every plan date (the start, then every N days)
up to the end and the sheet's today that has none yet, dated that day with an empty note, by the
claim form's rules (a date the form refuses is skipped and tried again next time). Show how many
were made, and on each plan how many claims it has made so far.""",
    132: """The sheets of a tree now share one sheet-wide number sequence: a claim opened on any sheet of the
tree receives the next number after the last number given anywhere in the tree (numbers given before
this stay as they are). Per-period numbering stays per sheet.""",
    133: """A person may carry tags on the person form (comma separated, trimmed, lower-cased, repeats dropped;
shown sorted, comma and space separated). The tag totals count a claim for a tag when the claim or
its person carries it, once.""",
    134: """The people list can be sorted on the screen: a select of added, name, grade or due-total, per
user's screen. Sorting by name compares as names are compared; by due-total puts n/a last; equal
keys keep list order. Sorting changes only what the screen shows: the positions, the rollup lines
and every action in list order are unaffected.""",
    135: """A button downloads the pools as a CSV file: a header line pool,member,share,cut then one line per
member, pools in the order added and members in the order added, a pool member as pool:<name>, the
cut as shown (empty when none).""",
    136: """Claims that move with a merge or a transfer now keep the figure a statement bound them to, and
the receiving person's statement count becomes their own plus the other's; the receiving person's
last statement stays theirs (or, having none, becomes the other's).""",
    137: """A DRAFT claim may have lines: a label, a quantity (a whole number, at least 1) and a unit amount
(two decimals), added from the claim (CLAIM_LINE_ADDED naming the claim with its new amount, ending
label=<label> qty=<qty> unit=<unit>). With lines, the claim's amount is the quantities times the
unit amounts added up, and an edit that types another amount is refused; a line on a claim that is
not a DRAFT, in a closed period, or locked by another user is refused. Show the lines on the claim as
<label> <qty> x <unit>. Adding a line counts as editing the claim.""",
    138: """Each person's row has a grade select and a save button that records the chosen grade from the
sheet's today exactly as the person form would (PERSON_EDITED and the rollup lines).""",
    139: """The audit viewer, filtered by a name, now also lists the matching lines of the sheet's descendants
(each sheet's lines newest first, sheets by id, after this sheet's own lines and before the lines
from the sheet a person came from).""",
    140: """The remainder of a pool's cuts now goes to the member with the smallest non-zero cut, the latest
added on a tie (a member with no cut gets none; a pool with no non-zero cut gives it to the last
member with a share).""",
    141: """A plan may instead run monthly on a day of the month (1 to 31): the plan dates are that day in
every month from the start's month, a day beyond the month's length falling on its last day, dates
before the start left out (PLAN_ADDED ends day=<day> end=<date> instead of every=).""",
    142: """Show on each plan its next dates: the first five plan dates after the sheet's today and on or
before the end, comma and space separated.""",
    143: """The sheet has a fiscal year start month (settings, 1 to 12, 1 unless set, not dated;
SETTING_CHANGED key=fiscal-start-month value=<month>; anything else is refused). A fiscal year is
named FY<yyyy> by the calendar year its first day falls in; show on each period the fiscal year its
from-date falls in. A year entry and a button generate that fiscal year's twelve monthly periods
exactly as the period generator does; show how many were made.""",
    144: """Sheet-wide numbering now restarts each fiscal year: a claim opened from now on receives
<FY>-<n>, counting from 1 within the fiscal year of the date that places it in a period, the
sequence shared across the tree as before; numbers already given stay. Per-period numbering, when in
force, still wins.""",
    145: """Selected claims can be re-dated together: a date entry and a button beside the bulk buttons.
Each selected claim is re-dated in list order exactly as the row's re-date does (who may, which
statuses, closed periods, renumbering on a period change, CLAIM_REDATED); show how many were re-dated
and how many refused.""",
    146: """The sheet has an alert threshold (settings, two decimals, blank means off, not dated;
SETTING_CHANGED key=alert-threshold value=<amount>). After a change's rollup lines, for each person
whose due-total went from at or below the threshold (or no due-total) to above it, one line ALERT
name=<name> due-total=<due-total> is written, in list order. A person already above it writes no
further ALERT until their due-total has been at or below the threshold and crosses it again.""",
    147: """Show on each person their snapshot lines: one per SNAPSHOT written for them, oldest first, as
<the day being left> <due-total>.""",
    148: """A person's claimed, and the sheet's claimed-total, no longer include corrections: claimed is the
amounts of the person's claims that count, leaving out claims that correct another. Everything that
reads claimed (the rollup lines included) follows; due figures are unchanged.""",
    149: """A period may cap the number of open claims per person (a whole number on the period form, blank
for none; PERIOD_ADDED gains cap=<n> at the end when given). Opening a claim that belongs to the
period, alone or by the bulk button, is refused with an error on the claim when the person already
has that many OPEN or PENDING claims in it.""",
    150: """A search box and a button list, over this sheet and every other sheet of its tree, every person
whose name or an alias contains the typed text (case ignored), one line per person as
<sheet id> <name> <due-total>, this sheet's people first in list order, then the other sheets' by
sheet id.""",
}

ALGORITHM = {4: "normalised-uniqueness", 8: "workflow-counting", 12: "half-even-sum-of-rounded",
             16: "write-time-rollups", 20: "void-keeps-number", 24: "floor-under-statements",
             28: "grade-in-force", 32: "rounding-by-policy-date", 36: "pending-outside-statements",
             40: "hold-interval",
             44: "rollups-on-overdue", 48: "settings-in-force-on-date", 52: "period-status-as-of-end",
             56: "late-per-boundary", 60: "trimmed-totals", 64: "floor-after-late",
             68: "backing-recent-settled", 72: "retired-leave-totals", 76: "snapshot-on-today-change",
             80: "period-by-due-by",
             84: "business-day-terms", 88: "compound-late-charge", 96: "holiday-redates-due-by",
             100: "batch-all-or-nothing",
             106: "penny-allocation", 108: "equal-share-allocation", 115: "nested-allocation",
             120: "share-reallocation", 131: "plan-date-generation", 140: "remainder-to-smallest",
             141: "month-end-clamp", 144: "fiscal-year-numbering"}

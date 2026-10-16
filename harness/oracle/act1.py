"""Act I (cp01-cp60): the concept spine, as the requests in checkpoints.yaml define it.

Each function is one version of a concept; its docstring quotes the rule it implements. Later acts
change these concepts by registering newer versions in their own modules (see act2.py for the
pattern), never by editing this file.
"""
from __future__ import annotations

from .core import (ABSENT, DEFAULT_SHEET, Person, Row, Unmodelled, control, days_between, family, fdiv,
                   need, person, setting_default, sheet, show)
from .session import parse_input

COVERAGE = (1, 60)       # every request of cp01-cp60 is modelled (see core._load_acts)

# ---- raw cells ---------------------------------------------------------------------------------

for _name, _since in (("name", 1), ("alpha", 1), ("beta", 2), ("gamma", 3)):
    def _raw(c, p, _f=_name):
        return c.raw(p, _f, entered=True) if _f != "name" else c.name(p)
    person(_name, since=_since, show=f"person-{_name}")(_raw)


@person("grade", since=21, show="person-grade")
def grade(c, p):
    """cp21: the grade (on the reference date, dated from cp224)."""
    return c.grade(p) or ""


@person("onset", since=25, show="person-onset")
def onset(c, p):
    return c.rec(p).get("onset") or ""


@person("active", since=29, show="person-active")
def active(c, p):
    """cp29: active or not, shown yes/no. A person seeded without it is active (the default)."""
    return bool(c.flag(p, "active", True))


@person("region", since=37, show="person-region")
def region_cell(c, p):
    """cp37 one region code; cp40 several, listed sorted ascending."""
    return ", ".join(c.regions(p))


@person("notes", since=45, show="person-notes")
def notes_cell(c, p):
    """cp45: the note scores, sorted ascending, comma separated."""
    return ", ".join(str(n) for n in sorted(c.row(p).person.notes))


@person("notes", since=48, show="person-notes")
def notes_cell_gone(c, p):
    """cp48: several notes per person are gone, folded into one score."""
    return ABSENT


@person("score", since=48, show="person-score")
def score_cell(c, p):
    s = c.rec(p).get("score")
    return "" if s is None else s


@person("state", since=57, show="person-state")
def state_cell(c, p):
    return c.state(p)


@person("patrons", since=9, show="person-patrons")
def patrons_cell(c, p):
    """cp09 a patron's name; cp12 every patron's name, sorted, comma separated (all links shown)."""
    return c.names(c.patron_links(p))


@person("allies", since=41, show="person-allies")
def allies_cell(c, p):
    """cp41 allies both ways; cp44 only the people this person follows."""
    return c.names(_allies(c, p, listed=True))


@person("ally-count", since=41, show="person-ally-count")
def ally_count(c, p):
    return len(_allies(c, p, listed=True))


def _allies(c, p, listed=False):
    if c.k < 44:
        return c.ally_links(p)
    return c.follow_links(p) if listed else c.follows(p)


# ---- the first chain (cp02-cp08) ---------------------------------------------------------------

@person("thrust", since=2)
def thrust(c, p):
    """cp02: alpha * beta."""
    a, b = c.raw(p, "alpha"), c.raw(p, "beta")
    return a * b if need(a, b) else None


@person("drift", since=3)
def drift(c, p):
    """cp03: gamma - alpha."""
    a, g = c.raw(p, "alpha"), c.raw(p, "gamma")
    return g - a if need(a, g) else None


@person("momentum", since=3)
def momentum_v1(c, p):
    """cp03: thrust + 2 * drift."""
    t, d = c.v("thrust", p), c.v("drift", p)
    return t + 2 * d if need(t, d) else None


@person("momentum", since=4)
def momentum_v2(c, p):
    """cp04: thrust + 3 * drift."""
    t, d = c.v("thrust", p), c.v("drift", p)
    return t + 3 * d if need(t, d) else None


def _tier(m, surge_from):
    if m is None:
        return None
    return "SINK" if m < 0 else ("STEADY" if m < surge_from else "SURGE")


@person("tier", since=5)
def tier_v1(c, p):
    """cp05: SINK below 0, STEADY 0..99, SURGE 100+."""
    return _tier(c.v("momentum", p), 100)


@person("tier", since=8)
def tier_v2(c, p):
    """cp08: STEADY 0..199, SURGE 200+."""
    return _tier(c.v("momentum", p), 200)


# ---- patrons (cp09-cp12) -----------------------------------------------------------------------

@person("backing", since=10)
def backing_v1(c, p):
    """cp10: the thrust of their patron; n/a with no patron."""
    pats = c.patrons(p)
    if not pats:
        return None
    return c.v("thrust", pats[0])


@person("backing", since=12)
def backing_v2(c, p):
    """cp12: the total of all their patrons' thrust; n/a with no patrons."""
    vals = [c.v("thrust", q) for q in c.patrons(p)]
    if not vals or not need(*vals):
        return None
    return sum(vals)


@person("net", since=11)
def net(c, p):
    """cp11: momentum + backing, backing 0 with no patron."""
    m, b = c.v("momentum", p), c.v("backing", p)
    return m + (b or 0) if need(m) else None


# ---- sheets (cp13-cp16) ------------------------------------------------------------------------

@sheet("current-sheet", since=13, show="sheet-current-id")
def current_sheet(c):
    """cp13: the open sheet's id. The sheet a fixture's top level describes has no id any request
    defines, so asserting it is unmodelled."""
    if c.sheet_id == DEFAULT_SHEET:
        raise Unmodelled("sheet-current-id", "the id of the sheet the top-level fixture seeds")
    return c.sheet_id


@sheet("people-table", since=1, show="people-table")
def people_table(c):
    return ""


@sheet("people-empty", since=1, show="people-empty")
def people_empty(c):
    return "" if not c.ids else ABSENT


@sheet("sheet-missing", since=14, show="sheet-missing")
def sheet_missing(c):
    """cp14: opening an unknown sheet shows a missing state (a flag the session sets)."""
    return "" if c.flags.get("sheet-missing") else ABSENT


@sheet("sheet-missing", since=16, show="sheet-missing")
def sheet_missing_gone(c):
    """cp16: an unknown sheet is started empty instead."""
    return ABSENT


# ---- rank, leader, percentile (cp17-cp20) ------------------------------------------------------

def _ranked(c, key):
    pop = [p for p in c.counted() if c.v("momentum", p) is not None]
    return sorted(pop, key=lambda p: key(c, p))


@sheet("ranking", since=17)
def ranking_v1(c):
    """cp17: momentum descending, ties by name ascending."""
    return _ranked(c, lambda c, p: (-c.v("momentum", p), c.name(p)))


@sheet("ranking", since=20)
def ranking_v2(c):
    """cp20: ties by the higher alpha."""
    return _ranked(c, lambda c, p: (-c.v("momentum", p), -(c.raw(p, "alpha") or 0)))


@person("rank", since=17)
def rank(c, p):
    order = c.s("ranking")
    return order.index(p) + 1 if p in order else None


@sheet("leader", since=18, show="rollup-leader")
def leader(c):
    """cp18: the name of the rank 1 person."""
    order = c.s("ranking")
    return c.name(order[0]) if order else None


@person("percentile", since=19)
def percentile(c, p):
    """cp19: best 100, worst 0, spread evenly by rank (rounded down); one person is 100."""
    r = c.v("rank", p)
    if r is None:
        return None
    n = len(c.s("ranking"))
    return 100 if n == 1 else c.div((n - r) * 100, n - 1)


# ---- grade, weight, load (cp21-cp24) -----------------------------------------------------------

for _g, _w in (("LOW", 1), ("MID", 2), ("HIGH", 3)):
    setting_default("gradeWeights", _g, 21, _w)        # cp21
for _g, _w in (("LOW", 1), ("MID", 3), ("HIGH", 5)):
    setting_default("gradeWeights", _g, 24, _w)        # cp24


@person("weight", since=21)
def weight(c, p):
    """cp21 LOW 1 MID 2 HIGH 3; cp24 LOW 1 MID 3 HIGH 5; the sheet's own weights from cp83."""
    g = c.grade(p)
    return c.setting("gradeWeights", g) if g else None


@person("load", since=22)
def load(c, p):
    """cp22: momentum * weight."""
    m, w = c.v("momentum", p), c.v("weight", p)
    return m * w if need(m, w) else None


@sheet("total-load", since=23, show="rollup-total-load")
def total_load(c):
    """cp23: everyone's load added together, skipping n/a."""
    return c.total("load")


# ---- dates (cp25-cp28) -------------------------------------------------------------------------

@sheet("anchor", since=25, show="sheet-anchor")
def anchor(c):
    return c.anchor or ""


@person("age", since=26)
def age_days(c, p):
    """cp26: whole days from onset to the anchor (negative when onset is later). Age stays in days
    for the whole stream (cp28 records every change instead of turning age into weeks)."""
    o = c.rec(p).get("onset")
    return days_between(o, c.anchor) if need(o, c.anchor) else None


@person("decay", since=27)
def decay(c, p):
    """cp27: momentum - age."""
    m, a = c.v("momentum", p), c.v("age", p)
    return m - a if need(m, a) else None


# ---- active and effective (cp29-cp32) ----------------------------------------------------------

@person("effective", since=30)
def effective_v1(c, p):
    """cp30: net when active, else 0."""
    n = c.v("net", p)
    if n is None:
        return None
    return n if c.v("active", p) else 0


@person("effective", since=32)
def effective_v2(c, p):
    """cp32: net when active, else half of net rounded down."""
    n = c.v("net", p)
    if n is None:
        return None
    return n if c.v("active", p) else c.div(n, 2)


@sheet("active-count", since=31, show="rollup-active-count")
def active_count(c):
    """cp31: how many people are active (a count of people: cp188 leaves out momentum 0)."""
    return sum(1 for p in c.headcounted() if c.v("active", p))


@sheet("total-effective", since=31, show="rollup-total-effective")
def total_effective(c):
    return c.total("effective")


# ---- clout and influence (cp33-cp36) -----------------------------------------------------------

@person("clout", since=33)
def clout_v1(c, p):
    """cp33: the total of the patrons' effective; 0 with no patrons."""
    vals = [c.v("effective", q) for q in c.patrons(p)]
    return sum(vals) if need(*vals) else None


@person("clout", since=36)
def clout_v2(c, p):
    """cp36: the average of the patrons' effective, rounded down; 0 with no patrons."""
    vals = [c.v("effective", q) for q in c.patrons(p)]
    if not vals:
        return 0
    return c.div(sum(vals), len(vals)) if need(*vals) else None


@person("influence", since=34)
def influence(c, p):
    """cp34: effective + clout."""
    e, k = c.v("effective", p), c.v("clout", p)
    return e + k if need(e, k) else None


@sheet("top-influence", since=35, show="rollup-top-influence")
def top_influence(c):
    """cp35: highest influence, ties by name ascending."""
    return c.top("influence")


# ---- regions (cp37-cp40) -----------------------------------------------------------------------

for _r, _m in (("N", 2), ("S", 3), ("other", 1)):
    setting_default("regionMultipliers", _r, 38, _m)   # cp38


def region_multiplier(c, code: str) -> int:
    letter = code[:1].upper()
    return c.setting("regionMultipliers", letter if letter in ("N", "S") else "other")


@person("reach", since=38)
def reach_v1(c, p):
    """cp38: momentum * the multiplier of their region's first letter (N 2, S 3, else 1)."""
    m, regs = c.v("momentum", p), c.regions(p)
    if m is None or not regs:
        return None
    return m * region_multiplier(c, regs[0])


@person("reach", since=40)
def reach_v2(c, p):
    """cp40: the sum over each of their regions of momentum * that region's multiplier."""
    m = c.v("momentum", p)
    if m is None:
        return None
    return sum(m * region_multiplier(c, r) for r in c.regions(p))


@family("region-count-", since=39)
def region_counts(c):
    """cp39 people per region; cp40 a person once in every region they belong to."""
    out = {r: 0 for p in c.ids for r in c.regions(p)}
    for p in c.headcounted():
        for r in set(c.regions(p)):
            out[r] += 1
    return out


# ---- allies and synergy (cp41-cp44) ------------------------------------------------------------

@person("synergy", since=42)
def synergy(c, p):
    """cp42 the total thrust of their allies; cp44 of only the people they follow; 0 with none."""
    vals = [c.v("thrust", q) for q in _allies(c, p)]
    return sum(vals) if need(*vals) else None


@person("combined", since=43)
def combined(c, p):
    """cp43: influence + synergy."""
    i, s = c.v("influence", p), c.v("synergy", p)
    return i + s if need(i, s) else None


# ---- notes, quality, adjusted (cp45-cp48) ------------------------------------------------------

@person("note-sum", since=45)
def note_sum_v1(c, p):
    """cp45: the total of their note scores (0 with none)."""
    return sum(c.row(p).person.notes)


@person("note-sum", since=48)
def note_sum_v2(c, p):
    """cp48: simply their score (0 with none)."""
    return c.raw(p, "score") or 0


@person("quality", since=46)
def quality_v1(c, p):
    """cp46: the average of their note scores rounded down; n/a with no notes."""
    notes = c.row(p).person.notes
    return fdiv(sum(notes), len(notes)) if notes else None


@person("quality", since=48)
def quality_v2(c, p):
    """cp48: simply their score; n/a with no score (0 from cp176, a missing number counting as 0)."""
    return c.raw(p, "score")


@person("adjusted", since=47)
def adjusted(c, p):
    """cp47: combined + quality, quality 0 when n/a."""
    cb, q = c.v("combined", p), c.v("quality", p)
    return cb + (q or 0) if need(cb) else None


# ---- band and scaled (cp49-cp52) ---------------------------------------------------------------

for _b, _f in (("D", 0), ("C", 50), ("B", 150), ("A", 300)):
    setting_default("bandFrom", _b, 49, _f)            # cp49
for _b, _f in (("D", 0), ("C", 100), ("B", 250), ("A", 500)):
    setting_default("bandFrom", _b, 52, _f)            # cp52
for _b, _m in (("A", 4), ("B", 3), ("C", 2), ("D", 1), ("E", 0)):
    setting_default("bandMultipliers", _b, 50, _m)     # cp50


@person("band", since=49)
def band(c, p):
    """cp49/cp52: E below where D starts, then D, C, B, A from where each starts."""
    a = c.v("adjusted", p)
    if a is None:
        return None
    out = "E"
    for b in ("D", "C", "B", "A"):
        if a >= c.setting("bandFrom", b):
            out = b
    return out


@person("scaled", since=50)
def scaled(c, p):
    """cp50: adjusted * the band's multiplier (A 4, B 3, C 2, D 1, E 0)."""
    a, b = c.v("adjusted", p), c.v("band", p)
    return a * c.setting("bandMultipliers", b) if need(a, b) else None


@family("band-count-", since=51)
def band_counts(c):
    """cp51: how many people are in each band, A through E."""
    out = {b: 0 for b in "ABCDE"}
    for p in c.headcounted():
        b = c.v("band", p)
        if b is not None:
            out[b] += 1
    return out


# ---- norm and outliers (cp53-cp56) -------------------------------------------------------------

def _scaled_population(c):
    return [c.v("scaled", p) for p in c.counted() if c.v("scaled", p) is not None]


@sheet("norm-centre", since=53)
def norm_mean(c):
    """cp53: the average scaled over everyone whose scaled can be worked out, rounded down."""
    vals = _scaled_population(c)
    return fdiv(sum(vals), len(vals)) if vals else None


@sheet("norm-centre", since=56)
def norm_median(c):
    """cp56: the median scaled; the lower of the two middle values for an even count."""
    vals = sorted(_scaled_population(c))
    return vals[(len(vals) - 1) // 2] if vals else None


@person("norm", since=53)
def norm(c, p):
    s, m = c.v("scaled", p), c.s("norm-centre")
    return s - m if need(s, m) else None


@person("outlier", since=54)
def outlier(c, p):
    """cp54: yes when norm is more than 100 away from zero."""
    n = c.v("norm", p)
    return None if n is None else abs(n) > 100


@sheet("outlier-count", since=55, show="rollup-outlier-count")
def outlier_count(c):
    return sum(1 for p in c.headcounted() if c.v("outlier", p))


# ---- state (cp57-cp60) -------------------------------------------------------------------------

STATE_FORWARD = {"DRAFT": "REVIEW", "REVIEW": "FINAL"}
STATE_BACK = {"REVIEW": "DRAFT"}


@sheet("final-total", since=58, show="rollup-final-total")
def final_total(c):
    """cp58: the scaled of only the FINAL people, added together."""
    return c.total("scaled", where=lambda p: c.state(p) == "FINAL")


@family("person-edit-", since=7)
def edit_controls(c):
    return {str(p): "" for p in c.ids}


@family("person-advance-", since=57)
def advance_controls_v1(c):
    """cp57: forward from DRAFT and REVIEW; FINAL is terminal."""
    return {str(p): ("" if c.state(p) in STATE_FORWARD else ABSENT) for p in c.ids}


@family("person-advance-", since=60)
def advance_controls_v2(c):
    """cp60: REWORK moves forward to FINAL too."""
    return {str(p): ("" if c.state(p) in ("DRAFT", "REVIEW", "REWORK") else ABSENT) for p in c.ids}


@family("person-demote-", since=59)
def demote_controls(c):
    """cp59: a step back is offered (and refused at FINAL with an error)."""
    return {str(p): ("" if c.state(p) != "DRAFT" else ABSENT) for p in c.ids}


@family("person-rework-", since=60)
def rework_controls(c):
    """cp60: a FINAL person may be moved to REWORK."""
    return {str(p): ("" if c.state(p) == "FINAL" else ABSENT) for p in c.ids}


@sheet("state-error", since=59, show="person-state-error")
def state_error(c):
    return "" if c.flags.get("person-state-error") else ABSENT


# ---- what the Act I controls do ----------------------------------------------------------------

def _set_state(s, pid, to):
    """Change a person's state on the open sheet and record it (cp57)."""
    c = s.ctx()
    frm = c.state(pid)
    row = c.row(pid)
    if s.k >= 104 and row.shared:
        row.state = to
    else:
        row.person.record["state"] = to
    s.audit.append(f"STATE_CHANGED id={pid} from={frm} to={to}")


AUDIT_EVERYTHING = 28


def audit_value(v) -> str:
    """A value in a CHANGED record: as the row shows it, a blank value written as nothing."""
    return "" if v is None or v == "" else show(v)


def record_change(s, pid, fld: str, old, new) -> None:
    """Record one changed detail of a person saved in the editor: cp07 ALPHA_CHANGED for alpha only;
    from cp28 `CHANGED id=<id> field=<field> from=<old> to=<new>` for every detail that changed
    (any number, the name, grade, onset, and every later detail), alpha included. A detail saved with
    the value it already had writes nothing."""
    if old == new:
        return
    if s.k >= AUDIT_EVERYTHING:
        s.audit.append(f"CHANGED id={pid} field={fld} from={audit_value(old)} to={audit_value(new)}")
    elif fld == "alpha":
        s.audit.append(f"ALPHA_CHANGED id={pid} from={show(old)} to={show(new)}")


@control("person-form-submit", since=1)
def submit(s, _):
    """cp01 add a person from the form; cp07 when an editor is open, change that person instead
    (an alpha change is recorded as ALPHA_CHANGED id= from= to=); cp28 every changed detail is
    recorded as CHANGED id= field= from= to= (see record_change)."""
    fields = {f: parse_input(v) for f, v in s.take_form("person-form-").items()}
    fields.pop("effective-date", None)
    sh = s.world.sheet(s.sheet, create=True)
    if s.editing is not None:
        rec = sh.rows[s.editing].person.record
        for f, v in fields.items():
            record_change(s, s.editing, f, rec.get(f), v)
            rec[f] = v
        s.editing = None
        return
    ids = [i for i in sh.rows if isinstance(i, int)]
    new_id = max(ids, default=0) + 1
    rec = {"id": new_id, **fields}
    sh.rows[new_id] = Row(new_id, Person(rec, home=s.sheet))


@control("person-edit-", since=7)
def edit(s, suffix):
    """cp07: open a person's editor; the form then changes that person."""
    s.editing = s.row_id(suffix)


@family("person-form-", since=7)
def person_form(c):
    """cp07: the editor opens with the person's current values, so the name box shows their name
    (what a test waits on before it changes a field); a typed value shows as typed."""
    form = c.flags.get("form") or {}
    pid = c.flags.get("editing")
    name = form.get("person-form-name", c.name(pid) if pid is not None else "")
    return {"name": name or ""}


@control("sheet-load", since=13)
def load_sheet_v1(s, _):
    """cp13 open the typed sheet; cp14 an unknown id shows the missing state."""
    sid = str(s.take_form("sheet-id-input").get("", ""))
    if s.world.sheet(sid) is None and s.k >= 14:
        s.sheet = sid
        s.flags["sheet-missing"] = True
        return
    s.world.sheet(sid, create=True)
    s.sheet = sid
    s.flags.pop("sheet-missing", None)


@control("sheet-load", since=16)
def load_sheet_v2(s, _):
    """cp16: an unknown id starts a new empty sheet with that id."""
    sid = str(s.take_form("sheet-id-input").get("", ""))
    s.world.sheet(sid, create=True)
    s.sheet = sid
    s.as_of = None
    s.form = {}
    s.flags.pop("sheet-missing", None)


@control("person-advance-", since=57)
def advance_v1(s, suffix):
    """cp57: DRAFT -> REVIEW -> FINAL."""
    pid = s.row_id(suffix)
    nxt = STATE_FORWARD.get(s.ctx().state(pid))
    if nxt is None:
        raise Unmodelled("control person-advance-", f"advance from {s.ctx().state(pid)}")
    _set_state(s, pid, nxt)


@control("person-advance-", since=60)
def advance_v2(s, suffix):
    """cp60: REWORK -> FINAL as well."""
    pid = s.row_id(suffix)
    nxt = dict(STATE_FORWARD, REWORK="FINAL").get(s.ctx().state(pid))
    if nxt is None:
        raise Unmodelled("control person-advance-", f"advance from {s.ctx().state(pid)}")
    _set_state(s, pid, nxt)


@control("person-demote-", since=59)
def demote(s, suffix):
    """cp59: one step back; a FINAL person is refused with person-state-error."""
    pid = s.row_id(suffix)
    st = s.ctx().state(pid)
    if st == "FINAL":
        s.flags["person-state-error"] = True
        return
    if st not in STATE_BACK:
        raise Unmodelled("control person-demote-", f"step back from {st}")
    _set_state(s, pid, STATE_BACK[st])


@control("person-rework-", since=60)
def rework(s, suffix):
    """cp60: FINAL -> REWORK."""
    pid = s.row_id(suffix)
    if s.ctx().state(pid) != "FINAL":
        raise Unmodelled("control person-rework-", "rework from a state other than FINAL")
    _set_state(s, pid, "REWORK")

"""Act IV (cp181-cp240): reporting, rollups and rankings over the whole spine, and the second half of
Phase 2 (the cross-cutting conversions cp184-cp220 and the interaction mutations cp224-cp240).

"Value" in these requests is the person's scaled (cp50; the retired test titles say "sums scaled").
Every figure here combines people across the sheet, so the standing rules apply throughout (the
rules themselves are on Ctx):
- a held person is left out of every count, every rank-like figure (apex, runner-up, top set, quota,
  top name per key), every max / min / range, and every average or middle value; every total counts
  them per Ctx.held_mode (half; in full in the breakdowns from cp212; the sheet's choice from cp232);
- negatives count as zero in every total (cp92); nearest rounding (cp160) except where a request of
  this act states "rounded down" for its own figure (all of them do); missing numbers as zero (cp176).

The cross-cutting conversions (each replaces a one-formula tweak that never happens, so the figure it
tweaked keeps its first definition):
- cp184 (Ctx.top, leader, runner-up, gap): every top name lists everyone level at the top, joined by
  ', ' in name order. The runner-up names everyone level at the next value below the top, and the gap
  is the top value minus that next value (n/a when nobody is below the top).
- cp188 (Ctx.headcounted): every count of people leaves out people whose momentum is 0.
- cp196: every "top N" figure (top three names, the top two's share, the quota) takes everyone level
  with the last person inside the cut-off too.
- cp204: every average across the sheet (the tilt's centre, the average group size) becomes the
  middle value, the lower of the two middles for an even count; the lopsidedness (skew) keeps the
  true average, and an average asked for later is the true average.
- cp208: a percentage is taken over the people who count (not on hold, momentum not 0) on both sides:
  the top two's share of the total, and later the portion. A held person adds nothing to a
  percentage's whole (not even half). Shares of counts already use the counts above.
- cp212 (Ctx.held_mode): totals broken down by region, tier, grade, state or quartile count a held
  person in full. The FINAL total is not a breakdown.
- cp216: every rank of people across the sheet is dense (rank, overall rank; percentile from the
  dense rank). The leader is everyone at rank 1.
- cp220 (Ctx.total): every sheet-wide total leaves out the single highest contribution (after the hold
  rule and negatives as zero); each breakdown total its own highest. Not the running total, not a
  percentage's whole, not an average.

Interaction mutations:
- cp224 (Ctx._raw / flag / grade): history covers grade and active (`history[].field` grade/active).
- cp228 (Ctx.held): `people[].holdFrom`; as of an earlier date the person counts normally;
  `person-hold-from` shows the start date.
- cp232 (Ctx.held_mode): `settings.heldInTotals` out / half / full (`sheet-setting-held-totals`).
- cp236 (Ctx.setting): `settingsHistory: [{from, settings}]`; `sheet-settings-effective-date`.
- cp240 (Ctx.held, World): a shared person's hold is per sheet (`shares[].hold`, `shares[].holdFrom`).
"""
from __future__ import annotations

from fractions import Fraction

from .core import ABSENT, control, family, fdiv, need, person, setting_default, sheet  # noqa: F401
from .session import parse_input

COVERAGE = (181, 240)     # every request of cp181-cp240 is modelled (see core._load_acts)

VALUE = "scaled"
QUARTILES = ("Q4", "Q3", "Q2", "Q1")
TIERS = ("SURGE", "STEADY", "SINK")
GRADES = ("HIGH", "MID", "LOW")
STATES = ("FINAL", "REVIEW", "DRAFT")

setting_default("heldInTotals", None, 232, "half")


# ---- helpers: the counted population by value ---------------------------------------------------

def _pop(c, where=None):
    """Counted people whose value can be worked out (and who pass `where`)."""
    return [p for p in c.counted() if c.v(VALUE, p) is not None and (where is None or where(p))]


def _ordered(c, where=None, pop=None):
    """The counted people from the highest value down, ties by name ascending."""
    pop = _pop(c, where) if pop is None else pop
    return sorted(pop, key=lambda p: (-c.v(VALUE, p), c.name(p)))


def _values(c, where=None):
    return [c.v(VALUE, p) for p in _pop(c, where)]


def _mean(c):
    vals = _values(c)
    return fdiv(sum(vals), len(vals)) if vals else None


def _median_of(vals):
    """The middle value; the lower of the two middle values for an even count (as cp54/cp56)."""
    vals = sorted(vals)
    return vals[(len(vals) - 1) // 2] if vals else None


def _median(c):
    return _median_of(_values(c))


def _pct(part, whole):
    return fdiv(part * 100, whole) if whole else None


def _top_n(c, n, pop=None):
    """The top `n` of the ranking by value (highest first, ties by name); from cp196 also everyone
    level with the last person inside the cut-off."""
    order = _ordered(c, pop=pop)
    taken = order[:n]
    if c.k >= 196 and taken and len(order) > n:
        last = c.v(VALUE, taken[-1])
        taken += [p for p in order[n:] if c.v(VALUE, p) == last]
    return taken


# ---- apex, gap, ledger (cp181-cp184) ------------------------------------------------------------

@sheet("apexname", since=181, show="rollup-apexname")
def apexname(c):
    """cp181: the name of the person with the highest value; level values go to the name first
    alphabetically (cp184: everyone level at the top, joined by ', ')."""
    return c.top(VALUE)


@sheet("runnerup", since=181, show="rollup-runnerup")
def runnerup_v1(c):
    """cp181: the name of the second highest, same tie-break."""
    order = _ordered(c)
    return c.name(order[1]) if len(order) > 1 else None


def _next_below_top(c):
    """cp184: the highest value below the top value, and everyone counted who has it."""
    vals = sorted({c.v(VALUE, p) for p in _pop(c)}, reverse=True)
    if len(vals) < 2:
        return None, []
    return vals[1], [p for p in _pop(c) if c.v(VALUE, p) == vals[1]]


@sheet("runnerup", since=184, show="rollup-runnerup")
def runnerup_v2(c):
    """cp184: everyone level at the next value below the top value, joined by ', ' in name order;
    n/a when nobody is below the top."""
    _, who = _next_below_top(c)
    return ", ".join(sorted(c.name(p) for p in who)) if who else None


@sheet("gapval", since=182, show="rollup-gapval")
def gapval_v1(c):
    """cp182: the highest value minus the second highest."""
    order = _ordered(c)
    return c.v(VALUE, order[0]) - c.v(VALUE, order[1]) if len(order) > 1 else None


@sheet("gapval", since=184, show="rollup-gapval")
def gapval_v2(c):
    """cp184: the top value minus the runner-up's value (the next value below the top); n/a when
    nobody is below the top."""
    nxt, _ = _next_below_top(c)
    return max(_values(c)) - nxt if nxt is not None else None


@sheet("leader", since=184, show="rollup-leader")
def leader_ties(c):
    """cp184: everyone level at the top momentum among the ranked people (the alpha tie-break no
    longer picks one), joined by ', ' in name order."""
    pop = c.s("ranking")
    if not pop:
        return None
    best = max(c.v("momentum", p) for p in pop)
    return ", ".join(sorted(c.name(p) for p in pop if c.v("momentum", p) == best))


@sheet("ledger", since=183, show="rollup-ledger")
def ledger(c):
    """cp183: the grand total of everyone's value (held per Ctx.held_mode; cp220 trims the top)."""
    return c.total(VALUE)


# ---- headcount, coverage, range (cp185-cp188) ---------------------------------------------------

@sheet("headcount", since=185, show="rollup-headcount")
def headcount(c):
    """cp185: how many people are on the sheet (held people and, cp188, momentum 0 not counted)."""
    return len(c.headcounted())


@sheet("coverage", since=186, show="rollup-coverage")
def coverage(c):
    """cp186: how many people have a value of at least one hundred."""
    return sum(1 for p in c.headcounted() if c.v(VALUE, p) is not None and c.v(VALUE, p) >= 100)


@sheet("range-scaled", since=187, show="rollup-range-scaled")
def range_scaled(c):
    """cp187: the highest value minus the lowest."""
    vals = _values(c)
    return max(vals) - min(vals) if vals else None


# ---- quartile bracket, top set (cp189-cp192) ----------------------------------------------------

def _bracket(v, cuts):
    if v is None:
        return None
    for q, start in zip(("Q4", "Q3", "Q2"), cuts):
        if v >= start:
            return q
    return "Q1"


@person("bracket", since=189)
def bracket_v1(c, p):
    """cp189: Q4 1000+, Q3 400..999, Q2 100..399, Q1 below 100 (fixed cut-offs, so a held person's
    own bracket is still shown)."""
    return _bracket(c.v(VALUE, p), (1000, 400, 100))


@person("bracket", since=192)
def bracket_v2(c, p):
    """cp192: Q4 800+, Q3 200..799, Q2 50..199, Q1 below 50."""
    return _bracket(c.v(VALUE, p), (800, 200, 50))


def _per_key_count(c, keys, key_of):
    """How many people (a count: Ctx.headcounted) have each key."""
    out = {k: 0 for k in keys}
    for p in c.headcounted():
        k = key_of(p)
        if k is not None:
            out[k] = out.get(k, 0) + 1
    return out


@family("bracket-count-", since=190)
def bracket_counts(c):
    """cp190: how many people are in each quartile."""
    return _per_key_count(c, QUARTILES, lambda p: c.v("bracket", p))


@sheet("topset", since=191, show="rollup-topset")
def topset(c):
    """cp191: the names of the top three people by value, in order (cp196: and anyone level with the
    third)."""
    return ", ".join(c.name(p) for p in _top_n(c, 3))


# ---- cume, median, concentration (cp193-cp196) --------------------------------------------------

@person("cume", since=193)
def cume(c, p):
    """cp193: going from the highest value down (ties by name), the running total of value so far
    including their own; a held person is out of the order and shows n/a; a negative value counts
    as zero. Not a sheet-wide total: never trimmed (cp220)."""
    order = _ordered(c)
    if p not in order:
        return None
    run = 0
    for q in order:
        run += max(c.v(VALUE, q), 0)
        if q == p:
            return run
    return None


@sheet("median-scaled", since=194, show="rollup-median-scaled")
def median_scaled(c):
    """cp194: the middle value on the sheet."""
    return _median(c)


@sheet("concentration", since=195, show="rollup-concentration")
def concentration_v1(c):
    """cp195: the share of the whole total the top two make up, a whole percent rounded down (the
    whole counts held people at half; cp196 takes ties at the cut-off)."""
    top = sum(c.v(VALUE, p) for p in _top_n(c, 2))
    return _pct(top, c.total(VALUE))


@sheet("concentration", since=208, show="rollup-concentration")
def concentration_v2(c):
    """cp208: over the people who count only: the top two (with ties) among them, of everyone who
    counts' value added up (a negative as zero; a held person adds nothing, not even half; never
    trimmed)."""
    pop = [p for p in c.headcounted() if c.v(VALUE, p) is not None]
    top = sum(max(c.v(VALUE, p), 0) for p in _top_n(c, 2, pop=pop))
    return _pct(top, sum(max(c.v(VALUE, p), 0) for p in pop))


# ---- tallies (cp197-cp200) ----------------------------------------------------------------------

@family("tier-tally-", since=197)
def tier_tally(c):
    """cp197: how many people fall in each tier."""
    return _per_key_count(c, TIERS, lambda p: c.v("tier", p))


def _grade(c, p):
    return c.grade(p)


@family("grade-tally-", since=198)
def grade_tally_v1(c):
    """cp198: how many people have each grade."""
    return _per_key_count(c, GRADES, lambda p: _grade(c, p))


def _merged(g):
    return "HIGH" if g == "MID" else g


@family("grade-tally-", since=200)
def grade_tally_v2(c):
    """cp200: MID folded into HIGH; only HIGH and LOW reported (MID shows 0)."""
    return _per_key_count(c, GRADES, lambda p: _merged(_grade(c, p)))


@family("state-tally-", since=199)
def state_tally(c):
    """cp199: how many people are in each state."""
    return _per_key_count(c, STATES, lambda p: c.state(p))


# ---- skew, tilt, span width (cp201-cp204) -------------------------------------------------------

@sheet("skewval", since=201, show="rollup-skewval")
def skewval(c):
    """cp201: the average value (rounded down) minus the middle value (cp204 keeps the true average
    here: the figure compares the two)."""
    m, md = _mean(c), _median(c)
    return m - md if need(m, md) else None


@sheet("tilt-centre", since=202)
def tilt_centre_v1(c):
    """cp202: the average (exact; the request states no rounding)."""
    vals = _values(c)
    return Fraction(sum(vals), len(vals)) if vals else None


@sheet("tilt-centre", since=204)
def tilt_centre_v2(c):
    """cp204: every average across the sheet becomes the middle value."""
    return _median(c)


@sheet("tilt", since=202, show="rollup-tilt")
def tilt(c):
    """cp202/cp204: how many people are above the centre minus how many are below it."""
    m = c.s("tilt-centre")
    if m is None:
        return None
    vals = _values(c)
    return sum(1 for v in vals if v > m) - sum(1 for v in vals if v < m)


@sheet("mean-size", since=204, show="rollup-mean-size")
def mean_size_middle(c):
    """cp204: the average group size becomes the middle group size (lower of the two middles), over
    the same groups (cp164: groups of one too)."""
    from .act3 import g, rollup_groups
    return _median_of([g(c, "size", x) for x in rollup_groups(c)])


@sheet("spanwidth", since=203, show="rollup-spanwidth")
def spanwidth(c):
    """cp203: how many different bands have at least one person in them (people who count, cp188)."""
    return len({c.v("band", p) for p in c.headcounted() if c.v("band", p) is not None})


# ---- quota, digest, stratum (cp205-cp208) -------------------------------------------------------

@sheet("quota-size", since=205)
def quota_size(c):
    """cp205: the top half, an odd count rounded up."""
    return -(-len(_pop(c)) // 2)


@person("quota", since=205)
def quota(c, p):
    """cp205: yes when the person is within the top half of the ranking by value (highest first);
    cp196: anyone level with the last person inside is in too. A held person has no place: n/a."""
    if p not in _pop(c):
        return None
    return p in _top_n(c, c.s("quota-size"))


@sheet("digest", since=206, show="rollup-digest")
def digest(c):
    """cp206: the (true) average value per person, rounded down."""
    return _mean(c)


@person("stratum", since=207)
def stratum(c, p):
    """cp207: TOP at or above the middle value, otherwise BOT (a held person's own label is still
    judged against the counted population's middle)."""
    v, m = c.v(VALUE, p), _median(c)
    return ("TOP" if v >= m else "BOT") if need(v, m) else None


# ---- regions (cp209-cp212) ----------------------------------------------------------------------

def _region_keys(c):
    return sorted({r for p in c.ids for r in c.regions(p)})


@family("region-tally-", since=209)
def region_tally(c):
    """cp209: how many people are in each region (a person in two regions counts in each)."""
    return {r: sum(1 for p in c.headcounted() if r in c.regions(p)) for r in _region_keys(c)}


@family("ledger-region-", since=210)
def ledger_region(c):
    """cp210: the total value in each region (a breakdown total: cp212 counts a held person in full)."""
    return {r: c.total(VALUE, where=lambda p, r=r: r in c.regions(p), breakdown=True)
            for r in _region_keys(c)}


@family("apexname-region-", since=211)
def apexname_region(c):
    """cp211: the top person by value in each region."""
    return {r: c.top(VALUE, where=lambda p, r=r: r in c.regions(p)) for r in _region_keys(c)}


# ---- quota count, stratum count, coverage share (cp213-cp216) -----------------------------------

@sheet("quota-count", since=213, show="rollup-quota-count")
def quota_count(c):
    """cp213: how many people meet the quota (a count: momentum 0 left out)."""
    return sum(1 for p in c.headcounted() if c.v("quota", p))


@family("stratum-count-", since=214)
def stratum_count(c):
    """cp214: how many people are TOP and how many BOT."""
    return _per_key_count(c, ("TOP", "BOT"), lambda p: c.v("stratum", p))


@sheet("coverage-share", since=215, show="rollup-coverage-share")
def coverage_share(c):
    """cp215: the covered people as a whole percent of the head count, rounded down."""
    return _pct(c.s("coverage"), c.s("headcount"))


# ---- dense ranks (cp216) ------------------------------------------------------------------------

def _dense(c, pop, concept):
    """{pid: dense rank} by `concept` highest first: level values share a rank, the next follows on."""
    vals = sorted({c.v(concept, p) for p in pop}, reverse=True)
    return {p: vals.index(c.v(concept, p)) + 1 for p in pop}


@person("rank", since=216)
def rank_dense(c, p):
    """cp216: rank by momentum, dense: people level on momentum share a rank (the alpha tie-break no
    longer separates them) and the next rank follows on; held people n/a."""
    return _dense(c, c.s("ranking"), "momentum").get(p)


@person("percentile", since=216)
def percentile_dense(c, p):
    """cp216: from the dense rank: the top rank 100, the lowest rank 0, evenly in between (rounded
    to the nearest, cp160); 100 when everyone shares rank 1."""
    ranks = _dense(c, c.s("ranking"), "momentum")
    if p not in ranks:
        return None
    lowest = max(ranks.values())
    return 100 if lowest == 1 else c.div((lowest - ranks[p]) * 100, lowest - 1)


@person("rank-global", since=216)
def rank_global_dense(c, p):
    """cp216: the overall rank by scaled, dense (level values share a rank, name no longer splits)."""
    pop = [q for q in c.counted() if c.v("scaled", q) is not None]
    return _dense(c, pop, "scaled").get(p)


# ---- breakdowns by tier, grade, state, quartile (cp217-cp232) -----------------------------------

def _ledger(c, keys, key_of, name=VALUE):
    return {k: c.total(name, where=lambda p, k=k: key_of(p) == k, breakdown=True) for k in keys}


def _apex(c, keys, key_of):
    return {k: c.top(VALUE, where=lambda p, k=k: key_of(p) == k) for k in keys}


def _share(c, keys, key_of):
    n = c.s("headcount")
    return {k: _pct(v, n) for k, v in _per_key_count(c, keys, key_of).items()}


def _tier(c):
    return lambda p: c.v("tier", p)


@family("tier-ledger-", since=217)
def tier_ledger(c):
    """cp217: the total value in each tier."""
    return _ledger(c, TIERS, _tier(c))


@family("apexname-tier-", since=218)
def apexname_tier(c):
    """cp218: the top person by value in each tier."""
    return _apex(c, TIERS, _tier(c))


@family("tier-share-", since=219)
def tier_share(c):
    """cp219: what percent of the sheet (by head count) is in each tier, rounded down."""
    return _share(c, TIERS, _tier(c))


@family("grade-ledger-", since=221)
def grade_ledger(c):
    """cp221: the total value for each grade."""
    return _ledger(c, GRADES, lambda p: _grade(c, p))


@family("grade-share-", since=222)
def grade_share(c):
    """cp222: what percent of the sheet holds each grade, rounded down."""
    return _share(c, GRADES, lambda p: _grade(c, p))


@family("apexname-grade-", since=223)
def apexname_grade(c):
    """cp223: the top person by value for each grade."""
    return _apex(c, GRADES, lambda p: _grade(c, p))


@family("state-ledger-", since=225)
def state_ledger(c):
    """cp225: the total value in each state."""
    return _ledger(c, STATES, c.state)


@family("state-share-", since=226)
def state_share(c):
    """cp226: what percent of the sheet is in each state, rounded down."""
    return _share(c, STATES, c.state)


@family("apexname-state-", since=227)
def apexname_state(c):
    """cp227: the top person by value in each state."""
    return _apex(c, STATES, c.state)


def _quartile(c):
    return lambda p: c.v("bracket", p)


@family("bracket-ledger-", since=229)
def bracket_ledger(c):
    """cp229: the total value in each quartile."""
    return _ledger(c, QUARTILES, _quartile(c))


@family("apexname-bracket-", since=230)
def apexname_bracket(c):
    """cp230: the top person by value in each quartile."""
    return _apex(c, QUARTILES, _quartile(c))


@family("bracket-share-", since=231)
def bracket_share(c):
    """cp231: what percent of the sheet is in each quartile, rounded down."""
    return _share(c, QUARTILES, _quartile(c))


# ---- history covers grade and active (cp224) ----------------------------------------------------

_FIELD_ORDER = {"alpha": 0, "beta": 1, "gamma": 2, "grade": 3, "active": 4}


def _history_value(h):
    v = h["value"]
    return ("yes" if v else "no") if isinstance(v, bool) else v


@person("history", since=224, show="person-history")
def history_cell_v2(c, p):
    """cp224: as cp113, grade and active changes listed too ('<date> grade HIGH', '<date> active
    no'); same-date changes go alpha, beta, gamma, grade, active."""
    hist = [h for h in c.row(p).person.history if h.get("from")]
    hist.sort(key=lambda h: _FIELD_ORDER.get(h["field"], 9))
    hist.sort(key=lambda h: h["from"], reverse=True)
    return "; ".join(f"{h['from']} {h['field']} {_history_value(h)}" for h in hist)


_DATED = ("alpha", "beta", "gamma", "grade", "active")


@control("person-form-submit", since=224)
def submit_dated_v2(s, suffix):
    """cp224: as cp113, a change to grade or active (person-form-active: yes or no) in the editor is
    dated too; each changed detail writes its CHANGED record from the value in force on the anchor."""
    from .act1 import record_change, submit
    if s.editing is None:
        return submit(s, suffix)
    c = s.ctx(as_of=None)
    when = parse_input(s.form.pop("person-form-effective-date", "")) or c.anchor
    pid = s.editing
    person_ = c.row(pid).person
    rest = {}
    for f, v in s.take_form("person-form-").items():
        v = parse_input(v)
        if f == "active":
            v = str(v).lower() in ("yes", "true")
        if f in _DATED:
            old = c.flag(pid, "active", True) if f == "active" else (
                c.grade(pid) if f == "grade" else c.raw(pid, f))
            if v == old:
                continue
            record_change(s, pid, f, old, v)
            if when is None:
                person_.record[f] = v
                continue
            person_.history = [h for h in person_.history if not (h["field"] == f and h.get("from") == when)]
            person_.history.append({"field": f, "value": v, "from": str(when)})
        else:
            record_change(s, pid, f, person_.record.get(f), v)
            rest[f] = v
    person_.record.update(rest)
    s.editing = None


# ---- report (cp233-cp236) -----------------------------------------------------------------------

@sheet("report-ledger", since=233, show="report-ledger")
def report_ledger(c):
    """cp233: the grand total, matching the worksheet."""
    return c.s("ledger")


@sheet("report-headcount", since=233, show="report-headcount")
def report_headcount(c):
    """cp233: the number of people, matching the worksheet."""
    return c.s("headcount")


@sheet("report-mean", since=234, show="report-mean")
def report_mean(c):
    """cp234: the (true) average value per person, rounded down."""
    return _mean(c)


@sheet("report-top", since=235, show="report-top")
def report_top(c):
    """cp235: the name of the top person by value."""
    return c.top(VALUE)


# ---- hold start date (cp228), held in totals (cp232), dated settings (cp236) --------------------

@person("hold-from", since=228, show="person-hold-from")
def hold_from_cell(c, p):
    """cp228: the date the person's hold starts on this sheet; blank with none."""
    row = c.row(p)
    if c.k >= 240 and row.shared:
        return row.hold_from or ""
    return row.person.record.get("holdFrom") or ""


@control("person-hold-", since=228)
def toggle_hold_dated(s, suffix):
    """cp228: putting a person on hold starts it on the sheet's anchor date (no start date without an
    anchor); taking them off clears it. cp240: on a shared row, this sheet's own hold."""
    c = s.ctx()
    row = c.row(s.row_id(suffix))
    if s.k >= 240 and row.shared:
        row.hold = not row.hold
        row.hold_from = c.anchor if row.hold else None
        return
    rec = row.person.record
    rec["hold"] = not rec.get("hold")
    if rec["hold"] and c.anchor:
        rec["holdFrom"] = c.anchor
    else:
        rec.pop("holdFrom", None)


@family("sheet-setting-held-totals", since=232)
def held_totals_input(c):
    """cp232: the sheet's choice for held people in totals: out, half or full."""
    form = c.flags.get("form") or {}
    return {"": form.get("sheet-setting-held-totals", c.setting("heldInTotals", None))}


@control("sheet-settings-save", since=232)
def save_settings_v2(s, suffix):
    """cp232: as cp81-83, with the held-in-totals choice; cp236: with a date in
    sheet-settings-effective-date the typed values count from that date (a dated change) instead of
    replacing the sheet's settings."""
    from .act2 import _SETTING_INPUTS
    sh = s.world.sheet(s.sheet, create=True)
    when = parse_input(s.form.pop("sheet-settings-effective-date", "")) if s.k >= 236 else None
    typed: dict = {}
    for prefix, (group, keys, since) in sorted(_SETTING_INPUTS.items(), key=lambda t: -len(t[0])):
        for key, value in s.take_form(prefix).items():
            if since <= s.k and key in keys:
                typed.setdefault(group, {})[key] = parse_input(value)
    mode = s.form.pop("sheet-setting-held-totals", None)
    if mode is not None:
        typed["heldInTotals"] = str(mode).strip()
    if when:
        sh.settings_history.append({"from": str(when), "settings": typed})
        return
    for group, v in typed.items():
        if isinstance(v, dict):
            sh.settings.setdefault(group, {}).update(v)
        else:
            sh.settings[group] = v


# ---- surge gap, final coverage, non-final apex (cp237-cp239) ------------------------------------

@sheet("gapval-surge", since=237, show="rollup-gapval-surge")
def gapval_surge(c):
    """cp237: within the SURGE tier, the highest value minus the lowest."""
    vals = _values(c, lambda p: c.v("tier", p) == "SURGE")
    return max(vals) - min(vals) if vals else None


@sheet("coverage-final", since=238, show="rollup-coverage-final")
def coverage_final(c):
    """cp238: how many FINAL people have a value of at least five hundred (a count)."""
    return sum(1 for p in c.headcounted()
               if c.state(p) == "FINAL" and c.v(VALUE, p) is not None and c.v(VALUE, p) >= 500)


@sheet("apex-nonfinal", since=239, show="rollup-apex-nonfinal")
def apex_nonfinal(c):
    """cp239: the top person by value who is not yet FINAL."""
    return c.top(VALUE, where=lambda p: c.state(p) != "FINAL")

"""Act V (cp241-cp250): consistency sweeps that compose the spine, and the two reversals.

- cp241, cp242, cp250: sheet-wide sums of the spine (grand scaled, grand influence, grand sum);
  totals, so the hold rule counts a held person at half (Ctx.total).
- cp243 portion, cp245 apex, cp246 standing, cp247 spread, cp249 even count: figures over everyone's
  scaled; a held person is left out of the top name, the standing order, the highest/lowest and the
  count (Ctx.counted / Ctx.top).
- cp244 (freed by cp28 keeping age in days): an interaction mutation, identity x history. A shared
  person's history is shared, each sheet reads it on its own date, and an as-of date belongs to the
  sheet it was applied on (`sheet-load` keeps it per sheet).
- cp248 reverses cp56 (norm back to the average, rounded down as that request states).
- cp243 portion is worded after cp208: a share of the people who count (not held, momentum not 0).
- totals here follow Ctx.total (cp220 trims the highest contribution), counts Ctx.headcounted (cp188),
  and apex-v states its own tie-break by name (cp184's tie listing does not apply to it).
"""
from __future__ import annotations

from .core import ABSENT, control, days_between, family, fdiv, need, person, setting_default, sheet  # noqa: F401

COVERAGE = (241, 250)    # every request of cp241-cp250 is modelled (see core._load_acts)


def _scaled_counted(c):
    """The counted (not held) people whose scaled can be worked out."""
    return [p for p in c.counted() if c.v("scaled", p) is not None]


# ---- grand sums (cp241, cp242, cp250) ----------------------------------------------------------

@sheet("grand-scaled", since=241, show="rollup-grand-scaled")
def grand_scaled(c):
    """cp241: everyone's scaled value added together (a sheet-wide total: Ctx.total)."""
    return c.total("scaled")


@sheet("grand-influence", since=242, show="rollup-grand-influence")
def grand_influence(c):
    """cp242: everyone's influence added together (a sheet-wide total: Ctx.total)."""
    return c.total("influence")


@sheet("grand-sum", since=250, show="rollup-grand-sum")
def grand_total(c):
    """cp250: the grand scaled plus the grand influence."""
    return c.s("grand-scaled") + c.s("grand-influence")


# ---- portion (cp243) ---------------------------------------------------------------------------

@person("portion", since=243)
def portion(c, p):
    """cp243 (worded after cp208): scaled as a whole-number percentage, rounded down, of the scaled of
    everyone who counts added up (not on hold, momentum not 0; a negative as zero; never trimmed);
    n/a for a person who does not count, and when that whole is zero."""
    pop = [q for q in c.headcounted() if c.v("scaled", q) is not None]
    whole = sum(max(c.v("scaled", q), 0) for q in pop)
    if p not in pop or not whole:
        return None
    return fdiv(c.v("scaled", p) * 100, whole)


# ---- an as-of date belongs to its sheet (cp244) ------------------------------------------------

@control("sheet-load", since=244)
def load_sheet_keeps_as_of(s, _):
    """cp244: opening another sheet keeps the as-of date of the sheet being left with that sheet and
    shows the opened sheet on its own as-of date if one was applied there (else its current figures);
    each sheet reads a shared person's history on its own date (Ctx.ref_date)."""
    sid = str(s.take_form("sheet-id-input").get("", ""))
    s.as_of_by_sheet[s.sheet] = s.as_of
    s.world.sheet(sid, create=True)
    s.sheet = sid
    s.as_of = s.as_of_by_sheet.get(sid)
    s.form = {}
    s.flags.pop("sheet-missing", None)


# ---- apex, standing, spread (cp245-cp247) ------------------------------------------------------

@sheet("apex-v", since=245, show="rollup-apex-v")
def apex_v(c):
    """cp245: the name of the person with the highest scaled, ties by name ascending (the request
    states its own tie-break, so cp184's listing of ties does not apply)."""
    return c.top("scaled", single=True)


@sheet("standing-order", since=246)
def standing_order(c):
    """cp246: everyone ordered by scaled from highest to lowest, ties by name ascending."""
    return sorted(_scaled_counted(c), key=lambda p: (-c.v("scaled", p), c.name(p)))


@person("standing-v", since=246)
def standing_v(c, p):
    """cp246: the person's position in that order, highest 1; n/a for a held person (left out of
    rankings) or one whose scaled is n/a."""
    order = c.s("standing-order")
    return order.index(p) + 1 if p in order else None


@sheet("spread-v", since=247, show="rollup-spread-v")
def spread_v(c):
    """cp247: the highest scaled minus the lowest scaled on the sheet; n/a with nobody's scaled."""
    vals = [c.v("scaled", p) for p in _scaled_counted(c)]
    return max(vals) - min(vals) if vals else None


# ---- norm back to the average (cp248) ----------------------------------------------------------

@sheet("norm-centre", since=248)
def norm_mean_again(c):
    """cp248: "Subtract the average (rounded down) of everyone's scaled again" (held left out)."""
    vals = [c.v("scaled", p) for p in _scaled_counted(c)]
    return fdiv(sum(vals), len(vals)) if vals else None


# ---- even count (cp249) ------------------------------------------------------------------------

@sheet("even-count", since=249, show="rollup-even-count")
def even_count(c):
    """cp249: how many people have an even scaled value (zero is even; a count: held and momentum 0
    left out)."""
    return sum(1 for p in c.headcounted() if c.v("scaled", p) is not None and c.v("scaled", p) % 2 == 0)

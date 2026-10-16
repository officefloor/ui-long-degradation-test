"""Act II (cp61-cp120): the second raw axis (delta, epsilon, zeta) fused with the spine, aggregation
over the relationships, and the four depth cycles:

- cp73-76 the hold rule (the rule itself is on Ctx: counted / total / top / patrons / follows);
- cp81-84 settings per sheet (Ctx.setting; the defaults are registered here and in act1.py);
- cp101-104 shared people (World.share, Ctx.state);
- cp113-116 history, as-of and link start dates (Ctx.raw, Ctx.ref_date, Ctx.patrons/follows).

This module is also the worked example of the extension pattern (see harness/oracle/__init__.py).
"""
from __future__ import annotations

from .core import (Unmodelled, control, family, fdiv, need, person, setting_default, sheet)
from .session import parse_input

COVERAGE = (61, 120)     # every request of cp61-cp120 is modelled (see core._load_acts)

# ---- raw cells ---------------------------------------------------------------------------------

for _name, _since in (("delta", 61), ("epsilon", 61), ("zeta", 63)):
    def _raw(c, p, _f=_name):
        return c.raw(p, _f, entered=True)
    person(_name, since=_since, show=f"person-{_name}")(_raw)


@person("kind", since=77, show="person-kind")
def kind(c, p):
    return c.rec(p).get("kind") or ""


@person("hold", since=73, show="person-hold")
def hold_cell(c, p):
    """cp73: whether the person is on hold, yes or no (cp228: on the reference date; cp240: on this
    sheet)."""
    return c.held(p)


# ---- the second axis (cp61-cp68) ---------------------------------------------------------------

@person("force", since=62)
def force(c, p):
    """cp62: delta * epsilon."""
    d, e = c.raw(p, "delta"), c.raw(p, "epsilon")
    return d * e if need(d, e) else None


@person("sway", since=63)
def sway(c, p):
    """cp63: zeta - delta."""
    d, z = c.raw(p, "delta"), c.raw(p, "zeta")
    return z - d if need(d, z) else None


@person("torque", since=63)
def torque_v1(c, p):
    """cp63: force + 2 * sway."""
    f, s = c.v("force", p), c.v("sway", p)
    return f + 2 * s if need(f, s) else None


@person("torque", since=64)
def torque_v2(c, p):
    """cp64: force + 3 * sway."""
    f, s = c.v("force", p), c.v("sway", p)
    return f + 3 * s if need(f, s) else None


def _phase(t, peak_from):
    if t is None:
        return None
    return "EBB" if t < 0 else ("RUN" if t < peak_from else "PEAK")


@person("phase", since=65)
def phase_v1(c, p):
    """cp65: EBB below 0, RUN 0..99, PEAK 100+."""
    return _phase(c.v("torque", p), 100)


@person("phase", since=68)
def phase_v2(c, p):
    """cp68: RUN 0..199, PEAK 200+."""
    return _phase(c.v("torque", p), 200)


@person("blend", since=66)
def blend(c, p):
    """cp66: momentum + torque."""
    m, t = c.v("momentum", p), c.v("torque", p)
    return m + t if need(m, t) else None


# ---- flux and crest (cp69-cp72) ----------------------------------------------------------------

def _sum_over(c, name, pids):
    vals = [c.v(name, q) for q in pids]
    return sum(vals) if need(*vals) else None


def _avg_over(c, name, pids):
    vals = [c.v(name, q) for q in pids]
    if not vals:
        return 0
    return c.div(sum(vals), len(vals)) if need(*vals) else None


@person("flux", since=69)
def flux_v1(c, p):
    """cp69: the total of the patrons' force; 0 with no patrons."""
    return _sum_over(c, "force", c.patrons(p))


@person("flux", since=72)
def flux_v2(c, p):
    """cp72: the average of the patrons' force, rounded down; 0 with no patrons."""
    return _avg_over(c, "force", c.patrons(p))


@person("crest", since=70)
def crest(c, p):
    """cp70: blend + flux."""
    b, f = c.v("blend", p), c.v("flux", p)
    return b + f if need(b, f) else None


@sheet("top-crest", since=71, show="rollup-top-crest")
def top_crest(c):
    return c.top("crest")


# ---- hold (cp73-cp76) --------------------------------------------------------------------------

@sheet("total-blend", since=75, show="rollup-total-blend")
def total_blend(c):
    """cp75: everyone's blend added together, skipping n/a."""
    return c.total("blend")


@family("person-hold-", since=73)
def hold_controls(c):
    return {str(p): "" for p in c.ids}


@control("person-hold-", since=73)
def toggle_hold(s, suffix):
    """cp73: put a person on hold, or take them off it."""
    rec = s.world.sheet(s.sheet).rows[s.row_id(suffix)].person.record
    rec["hold"] = not rec.get("hold")


# ---- kind, verge, pivot (cp77-cp79; cp80 is the inactive-patron rule on Ctx.patrons) ------------------------------------------------------------

_VERGE = {"A": 1, "B": 2, "C": 4}


@person("verge", since=77)
def verge(c, p):
    """cp77: A 1, B 2, C 4 (for the whole stream: cp80 leaves inactive patrons out instead)."""
    return _VERGE.get(c.rec(p).get("kind"))


@person("pivot", since=78)
def pivot(c, p):
    """cp78: torque * verge."""
    t, v = c.v("torque", p), c.v("verge", p)
    return t * v if need(t, v) else None


@sheet("total-pivot", since=79, show="rollup-total-pivot")
def total_pivot(c):
    return c.total("pivot")


# ---- settings (cp81-cp84) ----------------------------------------------------------------------

for _r, _m in (("N", 3), ("S", 2), ("other", 1)):
    setting_default("regionMultipliers", _r, 84, _m)   # cp84: new sheets start N 3, S 2, other 1

_SETTING_INPUTS = {
    "sheet-setting-region-": ("regionMultipliers", ("N", "S", "other"), 81),
    "sheet-setting-band-from-": ("bandFrom", ("D", "C", "B", "A"), 82),
    "sheet-setting-band-mult-": ("bandMultipliers", ("A", "B", "C", "D", "E"), 82),
    "sheet-setting-weight-": ("gradeWeights", ("LOW", "MID", "HIGH"), 83),
}


def _setting_inputs(prefix):
    group, keys, _ = _SETTING_INPUTS[prefix]

    def fn(c):
        form = c.flags.get("form") or {}
        return {k: form.get(prefix + k, c.setting(group, k)) for k in keys}
    return fn


for _prefix, (_g, _keys, _since) in _SETTING_INPUTS.items():
    family(_prefix, since=_since)(_setting_inputs(_prefix))


@control("sheet-settings-save", since=81)
def save_settings(s, _):
    """cp81-83: store the typed settings for the open sheet only."""
    sh = s.world.sheet(s.sheet, create=True)
    for prefix, (group, keys, since) in sorted(_SETTING_INPUTS.items(), key=lambda t: -len(t[0])):
        for key, value in s.take_form(prefix).items():
            if since <= s.k and key in keys:
                sh.settings.setdefault(group, {})[key] = parse_input(value)


# ---- drag and lift (cp85-cp88) -----------------------------------------------------------------

def _drag(b, bounds):
    if b is None:
        return None
    out = "L0"
    for level, start in zip(("L1", "L2", "L3"), bounds):
        if b >= start:
            out = level
    return out


@person("drag", since=85)
def drag_v1(c, p):
    """cp85: from blend, L0 below 0, L1 0..99, L2 100..199, L3 200+."""
    return _drag(c.v("blend", p), (0, 100, 200))


@person("drag", since=88)
def drag_v2(c, p):
    """cp88: L1 0..49, L2 50..149, L3 150+."""
    return _drag(c.v("blend", p), (0, 50, 150))


@person("lift", since=86)
def lift(c, p):
    """cp86: blend * the drag multiplier (L0 0, L1 1, L2 2, L3 3)."""
    b, d = c.v("blend", p), c.v("drag", p)
    return b * int(d[1]) if need(b, d) else None


@family("drag-count-", since=87)
def drag_counts(c):
    out = {f"L{i}": 0 for i in range(4)}
    for p in c.headcounted():
        d = c.v("drag", p)
        if d is not None:
            out[d] += 1
    return out


# ---- gust and coil (cp89-cp91; cp92 is the negatives-as-zero rule on Ctx.total) -----------------------------------------------------------------

@person("gust", since=89)
def gust(c, p):
    """cp89: reach + torque (for the whole stream: cp92 makes negatives count as zero in totals)."""
    r, t = c.v("reach", p), c.v("torque", p)
    return r + t if need(r, t) else None


@person("coil", since=90)
def coil(c, p):
    """cp90: gust - momentum."""
    g, m = c.v("gust", p), c.v("momentum", p)
    return g - m if need(g, m) else None


@sheet("total-gust", since=91, show="rollup-total-gust")
def total_gust(c):
    return c.total("gust")


# ---- brace (cp93-cp96) -------------------------------------------------------------------------

@person("brace", since=93)
def brace_v1(c, p):
    """cp93: influence + force."""
    i, f = c.v("influence", p), c.v("force", p)
    return i + f if need(i, f) else None


@person("brace", since=96)
def brace_v2(c, p):
    """cp96: influence + 2 * force."""
    i, f = c.v("influence", p), c.v("force", p)
    return i + 2 * f if need(i, f) else None


@sheet("total-brace", since=94, show="rollup-total-brace")
def total_brace(c):
    return c.total("brace")


@sheet("top-brace", since=95, show="rollup-top-brace")
def top_brace(c):
    return c.top("brace")


# ---- yield and grip (cp97-cp99; cp100 is the followers rule on Ctx.follows) ---------------------------------------------------------------

@person("yield", since=97)
def yield_(c, p):
    """cp97: pivot + lift (for the whole stream: cp100 widens the follow figures instead)."""
    pv, lf = c.v("pivot", p), c.v("lift", p)
    return pv + lf if need(pv, lf) else None


@person("grip", since=98)
def grip(c, p):
    """cp98: yield - coil."""
    y, cl = c.v("yield", p), c.v("coil", p)
    return y - cl if need(y, cl) else None


@sheet("total-yield", since=99, show="rollup-total-yield")
def total_yield(c):
    return c.total("yield")


# ---- shared people (cp101-cp104) ---------------------------------------------------------------

@control("person-share-add", since=101)
def share_add(s, _):
    """cp101: put the person chosen in person-share-select ('<sheet id>: <name>') onto the open
    sheet. It is the same person; from cp104 they start at DRAFT on this sheet."""
    choice = s.form.pop("person-share-select", None)
    label = (choice or {}).get("label") or (choice or {}).get("value")
    if not label or ": " not in label:
        raise Unmodelled("control person-share-add", f"option {choice!r}")
    sid, name = label.split(": ", 1)
    src = s.world.sheet(sid)
    match = [pid for pid, r in (src.rows.items() if src else []) if r.person.record.get("name") == name]
    if len(match) != 1:
        raise Unmodelled("control person-share-add", f"no single {name!r} on sheet {sid!r}")
    here = s.world.sheet(s.sheet, create=True)
    new_id = max((i for i in here.rows if isinstance(i, int)), default=0) + 1
    s.world.share(s.sheet, new_id, sid, match[0], "DRAFT" if s.k >= 104 else None)


# ---- vector and charge (cp105-cp108) -----------------------------------------------------------

@person("vector", since=105)
def vector_v1(c, p):
    """cp105: the total of the patrons' blend; 0 with no patrons."""
    return _sum_over(c, "blend", c.patrons(p))


@person("vector", since=108)
def vector_v2(c, p):
    """cp108: the average of the patrons' blend, rounded down; 0 with no patrons."""
    return _avg_over(c, "blend", c.patrons(p))


@person("charge", since=106)
def charge(c, p):
    """cp106: vector + yield."""
    v, y = c.v("vector", p), c.v("yield", p)
    return v + y if need(v, y) else None


@sheet("top-charge", since=107, show="rollup-top-charge")
def top_charge(c):
    return c.top("charge")


# ---- tide and churn (cp109-cp112) --------------------------------------------------------------

@person("tide", since=109)
def tide_v1(c, p):
    """cp109: the total of the brace of the people they follow; 0 with none."""
    return _sum_over(c, "brace", c.follows(p))


@person("tide", since=112)
def tide_v2(c, p):
    """cp112: only the followed people whose brace is positive."""
    vals = [c.v("brace", q) for q in c.follows(p)]
    if not need(*vals):
        return None
    return sum(v for v in vals if v > 0)


@person("churn", since=110)
def churn(c, p):
    """cp110: tide - vector."""
    t, v = c.v("tide", p), c.v("vector", p)
    return t - v if need(t, v) else None


@sheet("total-tide", since=111, show="rollup-total-tide")
def total_tide(c):
    return c.total("tide")


# ---- history and as-of (cp113-cp116) -----------------------------------------------------------

_FIELD_ORDER = {"alpha": 0, "beta": 1, "gamma": 2}


@person("history", since=113, show="person-history")
def history_cell(c, p):
    """cp113: every change newest first as '<date> <field> <value>' joined by '; ', same-date
    changes in the order alpha, beta, gamma."""
    hist = [h for h in c.row(p).person.history if h.get("from")]
    hist.sort(key=lambda h: _FIELD_ORDER.get(h["field"], 9))
    hist.sort(key=lambda h: h["from"], reverse=True)
    return "; ".join(f"{h['from']} {h['field']} {h['value']}" for h in hist)


@control("person-form-submit", since=113)
def submit_dated(s, suffix):
    """cp113: a change to alpha, beta or gamma in the editor is kept with its date (blank = the
    anchor) instead of overwriting (each changed detail still writes its cp28 CHANGED record, from
    the value in force on the anchor); only numbers actually changed are recorded, and a second change
    of the same number on the same date replaces the first. With no anchor and no date the number
    is simply replaced. Adding a person is unchanged."""
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
        if f in ("alpha", "beta", "gamma"):
            if v == c.raw(pid, f):
                continue
            record_change(s, pid, f, c.raw(pid, f), v)
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


@control("sheet-as-of-apply", since=114)
def as_of_apply(s, _):
    """cp114: look at the whole sheet as of the typed date."""
    s.as_of = str(s.form.get("sheet-as-of") or "") or None


@control("sheet-as-of-clear", since=114)
def as_of_clear(s, _):
    """cp114: back to the current figures (the anchor date)."""
    s.as_of = None
    s.form.pop("sheet-as-of", None)


@person("momentum-change", since=115)
def momentum_change(c, p):
    """cp115: momentum now (on the anchor) minus momentum on the as-of date; n/a with no as-of
    date or when either momentum is n/a."""
    if c.as_of is None:
        return None
    now, then = c.at(None).v("momentum", p), c.v("momentum", p)
    return now - then if need(now, then) else None


# ---- flow (cp117-cp120) ------------------------------------------------------------------------

@person("flow", since=117)
def flow_v1(c, p):
    """cp117: yield + charge + tide."""
    y, ch, t = c.v("yield", p), c.v("charge", p), c.v("tide", p)
    return y + ch + t if need(y, ch, t) else None


@person("flow", since=120)
def flow_v2(c, p):
    """cp120: yield + charge (tide dropped)."""
    y, ch = c.v("yield", p), c.v("charge", p)
    return y + ch if need(y, ch) else None


@sheet("grand-flow", since=118, show="rollup-grand-flow")
def grand_flow(c):
    return c.total("flow")


@sheet("top-flow", since=119, show="rollup-top-flow")
def top_flow(c):
    return c.top("flow")




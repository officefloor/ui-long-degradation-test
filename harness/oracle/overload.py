"""The restructured canonical stream (early-overload, cp1-250, Act VI removed).

This replaces the back-loaded canonical stream with one that is overloaded EARLY and then copes for
the rest of the run, in the canonical vocabulary (thrust, momentum, scaled, norm, keel, and the
reader battery). The engine (Registry, Ctx, World, View, Session) is reused from core.py unchanged;
core.py's own cross-cutting rules are all gated >= cp73 and stay dormant, so this module reimplements
the rules with EARLY activation.

Shape:
- Compressed spine (cp2-6): thrust = alpha*beta; momentum = thrust + 3*(gamma-alpha); scaled =
  momentum*2; norm = scaled - the mean scaled. Laid fast so the hub can stand up early.
- The hub `keel` (cp9) = scaled + momentum, read directly by the whole reader battery, so it is a
  god-sized hub from the first act (fan-in climbs past 30 by ~cp50).
- Cross-cutting rules switch on in the overload core, not at cp73/160/252: every total trims its
  highest AND lowest from cp4 (`etotal`), every divide rounds to nearest from cp8 (`ediv`), a held
  person leaves every figure from cp12 (`eheld`), a person whose keel is below zero leaves every
  count from cp16 (`eheadcount`), a missing raw counts as zero from cp20 (`eraw`).
- `keel` is redefined ten times (cp9/16/32/52/60/64/100/148/200/240), each a ripple through the battery;
  a `patrons` relationship migrates directed -> mutual at cp40.
- cp61-250 is the coping tail: sustained load on the overloaded core.

Everything the agent sees is generated from this module by harness.stream_build, so each
definition's request words live beside its code (READER_DEF, FIGURES, TWEAKS).

Cadence is 3:1 (mutative when n % 4 == 0). New readers reuse the canonical reader vocabulary.
"""
from __future__ import annotations

from .core import RULE_BREAKS, nearest, need, person, sheet

COVERAGE = (1, 250)

ETRIM, EROUND, EHOLD, ESINK, EMISS = 4, 8, 12, 16, 20
RAW = ("alpha", "beta", "gamma", "delta")
RULE_BREAKS.update({ETRIM, EROUND, EHOLD, EMISS, 40})


# ---- early cross-cutting helpers (core.py's own are dormant < cp73) ----------------------------

# Rules switched off for an ablation (harness.probe_check): an app that ignored the rule. Names are
# the keys of RULES; never set outside an `ablated()` block.
RULES = {"trim": ETRIM, "round": EROUND, "hold": EHOLD, "sink": ESINK, "missing": EMISS}
OFF: set = set()


class ablated:
    """`with ablated("trim"): ...` evaluates the model as an app that ignores that rule would."""

    def __init__(self, *rules):
        self.rules = set(rules)

    def __enter__(self):
        OFF.update(self.rules)

    def __exit__(self, *exc):
        OFF.difference_update(self.rules)


def _on(c, rule) -> bool:
    return c.k >= RULES[rule] and rule not in OFF


def eraw(c, pid, fld):
    v = c.rec(pid).get(fld)
    if v is None and _on(c, "missing") and fld in RAW:
        return 0
    return v


def eheld(c, pid) -> bool:
    return _on(c, "hold") and bool(c.rec(pid).get("hold"))


def ecounted(c) -> list:
    return [p for p in c.ids if not eheld(c, p)]


def ediv(c, a, b):
    """a / b rounded down (toward the lower number) before cp8, to the nearest from cp8."""
    if b == 0:
        return None
    return nearest(a, b) if _on(c, "round") else a // b


def ehalf(c, v):
    return ediv(c, v, 2)


def esink(c, pid) -> bool:
    k = c.v("keel", pid)
    return k is not None and k < 0


def eheadcount(c) -> list:
    """The people a count counts: not held, and from cp16 not with a keel below zero."""
    out = ecounted(c)
    if _on(c, "sink"):
        out = [p for p in out if not esink(c, p)]
    return out


def emean(c, name):
    """Mean of concept `name` over the people not on hold (n/a with none). A mean is a divide, so it
    rounds like every other divide: down before cp8, to the nearest from cp8."""
    vals = [c.v(name, p) for p in ecounted(c) if c.v(name, p) is not None]
    return ediv(c, sum(vals), len(vals)) if vals else None


def etotal(c, name) -> int:
    """Sheet-wide total of `name`: a held person counts half (cp12); from cp4 one highest and one
    lowest contribution (after halving) are left out, when at least two people contribute."""
    parts = []
    for p in c.ids:
        v = c.v(name, p)
        if v is None:
            continue
        if eheld(c, p):
            v = ehalf(c, v)
        parts.append(v)
    if _on(c, "trim") and len(parts) >= 2:
        parts.remove(max(parts))
        parts.remove(min(parts))
    return sum(parts)


def patron_ids(c, pid) -> list:
    """`pid`'s patrons on this sheet: as seeded (directed); mutual from cp40."""
    out = [l["patronId"] for l in c.sh.patrons if l["personId"] == pid and l["patronId"] in c.sh.rows]
    if c.k >= 40:
        out += [l["personId"] for l in c.sh.patrons if l["patronId"] == pid and l["personId"] in c.sh.rows]
    return [q for q in dict.fromkeys(out) if q != pid]


# ---- the compressed spine (cp2-6) --------------------------------------------------------------

@person("thrust", since=2)
def thrust(c, p):
    a, b = eraw(c, p, "alpha"), eraw(c, p, "beta")
    return a * b if need(a, b) else None


@person("momentum", since=3)
def momentum(c, p):
    t, a, g = c.v("thrust", p), eraw(c, p, "alpha"), eraw(c, p, "gamma")
    return t + 3 * (g - a) if need(t, a, g) else None


@person("scaled", since=5)
def scaled(c, p):
    m = c.v("momentum", p)
    return m * 2 if m is not None else None


@person("norm", since=6)
def norm(c, p):
    s, mean = c.v("scaled", p), emean(c, "scaled")
    return s - mean if need(s, mean) else None


@person("third", since=5)
def third(c, p):
    """cp5: scaled divided by three (rounded down, then to nearest from cp8)."""
    s = c.v("scaled", p)
    return ediv(c, s, 3) if s is not None else None


@person("quarter", since=7)
def quarter(c, p):
    """cp7: scaled divided by four (rounded down, then to nearest from cp8)."""
    s = c.v("scaled", p)
    return ediv(c, s, 4) if s is not None else None


# ---- the hub (cp9), redefined at cp16/32/52 ----------------------------------------------------

@person("keel", since=9)
def keel_v1(c, p):
    """cp9: scaled + momentum — the hub the reader battery all consults."""
    s, m = c.v("scaled", p), c.v("momentum", p)
    return s + m if need(s, m) else None


@person("keel", since=16)
def keel_v2(c, p):
    """cp16: scaled + momentum + norm (first redefinition; moves every reader)."""
    s, m, nm = c.v("scaled", p), c.v("momentum", p), c.v("norm", p)
    return s + m + nm if need(s, m, nm) else None


@person("keel", since=32)
def keel_v3(c, p):
    """cp32: scaled + momentum + norm + thrust."""
    s, m, nm, t = c.v("scaled", p), c.v("momentum", p), c.v("norm", p), c.v("thrust", p)
    return s + m + nm + t if need(s, m, nm, t) else None


@person("keel", since=52)
def keel_v4(c, p):
    """cp52: scaled + 2*momentum + norm + thrust."""
    s, m, nm, t = c.v("scaled", p), c.v("momentum", p), c.v("norm", p), c.v("thrust", p)
    return s + 2 * m + nm + t if need(s, m, nm, t) else None


# ---- the reader battery (canonical reader vocabulary) ------------------------------------------
#
# Every reader is keel plus or minus something. READER_DEF keeps, per reader, each version in force:
# (since, base text, base function, offset). A base version replaces the definition (the cp24-56
# tweaks); a tail tweak (cp68 on) adds its checkpoint number to the definition in force, so a
# reader keeps reading what it read and the depth chain stays intact. The text is what the request
# states (harness.stream_build), so the request and the model come from one place.

READER_DEF: dict[str, list] = {}


def _register_reader(name, since):
    @person(name, since=since)
    def reader(c, p, _name=name, _since=since):
        k = c.v("keel", p)
        if k is None:
            return None
        _s, _text, fn, off = [d for d in READER_DEF[_name] if d[0] <= _since][-1]
        v = fn(c, p, k)
        return None if v is None else v + off
    reader.__name__ = f"ov_{name}_{since}"


def _r(name, since, text, fn):
    """A new base definition of reader `name` from `since`: `text` names it after 'keel'."""
    READER_DEF.setdefault(name, []).append((since, text, fn, 0))
    _register_reader(name, since)


def _tweak(name, since, add):
    """From `since`, reader `name` is `add` more than the definition in force."""
    s0, text, fn, off = READER_DEF[name][-1]
    READER_DEF[name].append((since, text, fn, off + add))
    _register_reader(name, since)


def reader_text(name, k) -> str:
    """The definition of reader `name` in force at k, in the words a request uses."""
    _s, text, _fn, off = [d for d in READER_DEF[name] if d[0] <= k][-1]
    return text + (f" plus {off}" if off else "")


def _plus(other):
    return lambda c, p, k: (k + c.v(other, p)) if c.v(other, p) is not None else None


def _minus(other):
    return lambda c, p, k: (k - c.v(other, p)) if c.v(other, p) is not None else None


# depth chain (each reads the previous and keel)
_r("fathom", 10, "keel plus momentum", _plus("momentum"))
_r("cascade", 11, "fathom plus scaled", lambda c, p, k: (c.v("fathom", p) + c.v("scaled", p))
   if need(c.v("fathom", p), c.v("scaled", p)) else None)
_r("ripple", 13, "cascade plus keel", lambda c, p, k: (c.v("cascade", p) + k)
   if c.v("cascade", p) is not None else None)
_r("ballast", 14, "ripple plus thrust", lambda c, p, k: (c.v("ripple", p) + c.v("thrust", p))
   if need(c.v("ripple", p), c.v("thrust", p)) else None)
_r("keystone", 15, "ballast plus norm", lambda c, p, k: (c.v("ballast", p) + c.v("norm", p))
   if need(c.v("ballast", p), c.v("norm", p)) else None)

# breadth (keel transforms; several divide so cp8 rounding bites)
_r("draft", 10, "keel plus thrust", _plus("thrust"))
_r("trim", 11, "keel minus thrust", _minus("thrust"))
_r("heading", 13, "keel plus norm", _plus("norm"))
_r("bearing", 15, "keel minus norm", _minus("norm"))
_r("pitch", 17, "keel plus momentum", _plus("momentum"))
_r("tackle", 18, "keel minus momentum", _minus("momentum"))
_r("yaw", 19, "keel plus scaled", _plus("scaled"))
_r("heave", 21, "keel minus scaled", _minus("scaled"))
_r("camber", 22, "keel plus 100", lambda c, p, k: k + 100)
_r("sheer", 23, "keel minus 100", lambda c, p, k: k - 100)
_r("beam", 25, "keel times two", lambda c, p, k: k * 2)
_r("freeboard", 26, "keel divided by two", lambda c, p, k: ediv(c, k, 2))
_r("buoyancy", 27, "keel times three", lambda c, p, k: k * 3)
_r("knot", 29, "keel divided by three", lambda c, p, k: ediv(c, k, 3))
_r("cable", 30, "keel plus gamma", lambda c, p, k: k + eraw(c, p, "gamma"))
_r("hull", 31, "keel minus gamma", lambda c, p, k: k - eraw(c, p, "gamma"))
_r("bow", 33, "keel plus fathom", _plus("fathom"))
_r("stern", 34, "keel minus fathom", _minus("fathom"))
_r("helm", 35, "keel plus ripple", _plus("ripple"))
_r("rudder", 37, "keel minus ripple", _minus("ripple"))
_r("mast", 38, "keel plus 1000", lambda c, p, k: k + 1000)
_r("rigging", 39, "keel divided by four", lambda c, p, k: ediv(c, k, 4))
_r("moor", 41, "keel plus keystone", _plus("keystone"))
_r("berth", 42, "keel minus keystone", _minus("keystone"))
_r("wharf", 43, "keel times four", lambda c, p, k: k * 4)
_r("jetty", 45, "keel divided by five", lambda c, p, k: ediv(c, k, 5))
_r("pier", 46, "keel plus 500", lambda c, p, k: k + 500)
_r("ebb", 47, "keel minus 500", lambda c, p, k: k - 500)
_r("flood", 49, "keel plus ballast", _plus("ballast"))
_r("swell", 50, "keel minus ballast", _minus("ballast"))

# bounded reader changes on the non-hub mutatives (cp24/28/36/44/48/56): a new definition
_r("camber", 24, "keel plus 200", lambda c, p, k: k + 200)
_r("beam", 28, "keel times three", lambda c, p, k: k * 3)
_r("freeboard", 36, "keel divided by three", lambda c, p, k: ediv(c, k, 3))
_r("wharf", 44, "keel times five", lambda c, p, k: k * 5)
_r("jetty", 48, "keel divided by ten", lambda c, p, k: ediv(c, k, 10))
_r("mast", 56, "keel plus 2000", lambda c, p, k: k + 2000)


# ---- relationship, classification, and early sheet figures -------------------------------------

@person("backing", since=6)
def backing(c, p):
    """cp6: the momentum of a person's patrons added up (a patron whose momentum is n/a adds
    nothing; n/a if the person's own momentum is n/a); patronage becomes mutual at cp40."""
    if c.v("momentum", p) is None:
        return None
    return sum(c.v("momentum", q) or 0 for q in patron_ids(c, p))


@person("tier", since=7)
def tier(c, p):
    """cp7: SINK when scaled < 0, STEADY when 0..199, SURGE when >= 200; n/a if scaled n/a."""
    s = c.v("scaled", p)
    if s is None:
        return None
    return "SINK" if s < 0 else ("STEADY" if s < 200 else "SURGE")


@sheet("thrust-total", since=2, show="rollup-thrust-total")
def thrust_total(c):
    return etotal(c, "thrust")


@sheet("keel-total", since=9, show="rollup-keel-total")
def keel_total(c):
    return etotal(c, "keel")


@sheet("keel-count", since=14, show="rollup-keel-count")
def keel_count(c):
    """cp14: how many counted people have an even keel (held out; keel below zero out from cp16)."""
    return sum(1 for p in eheadcount(c) if c.v("keel", p) is not None and c.v("keel", p) % 2 == 0)


@person("keel", since=60)
def keel_v5(c, p):
    """cp60 (reversal): back to scaled + momentum + norm + thrust, undoing the cp52 doubling."""
    s, m, nm, t = c.v("scaled", p), c.v("momentum", p), c.v("norm", p), c.v("thrust", p)
    return s + m + nm + t if need(s, m, nm, t) else None


# ---- sheet-wide figures over a reader ----------------------------------------------------------
#   total   the sheet total (held at half, one highest and one lowest left out)
#   top     the highest value among the people not on hold
#   low     the lowest value among the people not on hold
#   spread  top minus low
#   even    how many counted people (not held, keel not below zero) have an even value
#   mean    the average over the people not on hold, rounded like every divide

FIGURES: dict[int, tuple] = {}     # checkpoint -> (reader, figure type) it adds


def _fig(name, figtype, since):
    FIGURES[since] = (name, figtype)

    @sheet(f"{name}-{figtype}", since=since, show=f"rollup-{name}-{figtype}")
    def fig(c, _n=name, _ft=figtype):
        if _ft == "total":
            return etotal(c, _n)
        if _ft == "even":
            return sum(1 for p in eheadcount(c) if c.v(_n, p) is not None and c.v(_n, p) % 2 == 0)
        if _ft == "mean":
            return emean(c, _n)
        vals = [c.v(_n, p) for p in ecounted(c) if c.v(_n, p) is not None]
        if not vals:
            return None
        if _ft == "top":
            return max(vals)
        if _ft == "low":
            return min(vals)
        if _ft == "spread":
            return max(vals) - min(vals)
        raise ValueError(_ft)
    fig.__name__ = f"ov_{name}_{figtype}_{since}"


for _nm, _sc in [("fathom", 51), ("draft", 53), ("cascade", 54), ("ripple", 55),
                 ("ballast", 57), ("keystone", 58), ("bearing", 59)]:
    _fig(_nm, "total", _sc)


# ================================================================================================
# COPING TAIL (cp61-250): sustained load on the already-overloaded hub. keel keeps being redefined
# (wide ripples), readers take bounded tweaks, and a battery of sheet-wide figures piles on. Added
# programmatically; every figure re-enters the early cross-cutting rules (trim/hold/round/sink).
# ================================================================================================

READERS = ["fathom", "cascade", "ripple", "ballast", "keystone", "draft", "trim", "heading",
           "bearing", "pitch", "tackle", "yaw", "heave", "camber", "sheer", "beam", "freeboard",
           "buoyancy", "knot", "cable", "hull", "bow", "stern", "helm", "rudder", "mast", "rigging",
           "moor", "berth", "wharf", "jetty", "pier", "ebb", "flood", "swell"]


# assign (reader, figure) pairs to the additive checkpoints of the tail, in order; a reader whose
# total already exists (cp51-59) takes its lowest value instead, so no checkpoint re-adds a figure
_add_tail = [k for k in range(61, 251) if k % 4]
_pairs = [(r, ft) for r in READERS for ft in ("total", "top", "spread", "even", "mean")]
for _p, _k in zip(_pairs, _add_tail):
    _ft = "low" if _p[1] == "total" and f"{_p[0]}-total" in {f"{r}-total" for r, _t in FIGURES.values()} \
        else _p[1]
    _fig(_p[0], _ft, _k)


# keel redefinitions across the tail (each ripples the whole reader battery)
@person("keel", since=64)
def keel_v6(c, p):
    """cp64: scaled + 2*momentum + 2*norm + thrust."""
    s, m, nm, t = c.v("scaled", p), c.v("momentum", p), c.v("norm", p), c.v("thrust", p)
    return s + 2 * m + 2 * nm + t if need(s, m, nm, t) else None


@person("keel", since=100)
def keel_v7(c, p):
    """cp100: scaled + 2*momentum + 2*norm + 2*thrust."""
    s, m, nm, t = c.v("scaled", p), c.v("momentum", p), c.v("norm", p), c.v("thrust", p)
    return s + 2 * m + 2 * nm + 2 * t if need(s, m, nm, t) else None


@person("keel", since=148)
def keel_v8(c, p):
    """cp148: 2*scaled + 2*momentum + 2*norm + 2*thrust."""
    s, m, nm, t = c.v("scaled", p), c.v("momentum", p), c.v("norm", p), c.v("thrust", p)
    return 2 * s + 2 * m + 2 * nm + 2 * t if need(s, m, nm, t) else None


@person("keel", since=200)
def keel_v9(c, p):
    """cp200: 2*scaled + 3*momentum + 2*norm + 2*thrust."""
    s, m, nm, t = c.v("scaled", p), c.v("momentum", p), c.v("norm", p), c.v("thrust", p)
    return 2 * s + 3 * m + 2 * nm + 2 * t if need(s, m, nm, t) else None


@person("keel", since=240)
def keel_v10(c, p):
    """cp240: 2*scaled + 3*momentum + 3*norm + 2*thrust."""
    s, m, nm, t = c.v("scaled", p), c.v("momentum", p), c.v("norm", p), c.v("thrust", p)
    return 2 * s + 3 * m + 3 * nm + 2 * t if need(s, m, nm, t) else None


# bounded reader tweaks on every other tail mutative: each adds the checkpoint number to the
# reader's definition in force, so it bites without cutting the reader off what it reads
_REDEFS = {64, 100, 148, 200, 240}
TWEAKS: dict[int, str] = {}        # checkpoint -> reader it tweaks
_mut_tail = [k for k in range(61, 250) if k % 4 == 0 and k not in _REDEFS]
for _i, _k in enumerate(_mut_tail):
    TWEAKS[_k] = READERS[_i % len(READERS)]
    _tweak(TWEAKS[_k], _k, _k)

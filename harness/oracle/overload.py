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
  person leaves every figure from cp12 (`eheld`), a SINK person (keel < 0) leaves every count from
  cp16 (`eheadcount`), a missing raw counts as zero from cp20 (`eraw`).
- `keel` is redefined at cp16/32/52 (and reversed late), so each change ripples the whole battery;
  a `patrons` relationship migrates directed -> mutual at cp40.
- cp61-250 is the coping tail (added in later stages): sustained load on the overloaded core.

Cadence is 3:1 (mutative when n % 4 == 0). New readers reuse the canonical reader vocabulary.
"""
from __future__ import annotations

from .core import RULE_BREAKS, nearest, need, person, sheet

COVERAGE = (1, 250)

ETRIM, EROUND, EHOLD, ESINK, EMISS = 4, 8, 12, 16, 20
RAW = ("alpha", "beta", "gamma", "delta")
RULE_BREAKS.update({ETRIM, EROUND, EHOLD, EMISS, 40})


# ---- early cross-cutting helpers (core.py's own are dormant < cp73) ----------------------------

def eraw(c, pid, fld):
    v = c.rec(pid).get(fld)
    if v is None and c.k >= EMISS and fld in RAW:
        return 0
    return v


def eheld(c, pid) -> bool:
    return c.k >= EHOLD and bool(c.rec(pid).get("hold"))


def ecounted(c) -> list:
    return [p for p in c.ids if not eheld(c, p)]


def ediv(c, a, b):
    if b == 0:
        return None
    return nearest(a, b) if c.k >= EROUND else a // b


def ehalf(c, v):
    return ediv(c, v, 2)


def esink(c, pid) -> bool:
    k = c.v("keel", pid)
    return k is not None and k < 0


def eheadcount(c) -> list:
    out = ecounted(c)
    if c.k >= ESINK:
        out = [p for p in out if not esink(c, p)]
    return out


def emean(c, name):
    """Floor mean of concept `name` over the counted people (n/a with none)."""
    vals = [c.v(name, p) for p in ecounted(c) if c.v(name, p) is not None]
    return (sum(vals) // len(vals)) if vals else None


def etotal(c, name) -> int:
    """Sheet-wide total of `name`: a held person counts half (cp12); from cp4 the highest and lowest
    contributions are both left out."""
    parts = []
    for p in c.ids:
        v = c.v(name, p)
        if v is None:
            continue
        if eheld(c, p):
            v = ehalf(c, v)
        parts.append(v)
    if c.k >= ETRIM and len(parts) >= 2:
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

def _r(name, since, fn):
    @person(name, since=since)
    def reader(c, p, _fn=fn):
        k = c.v("keel", p)
        return None if k is None else _fn(c, p, k)
    reader.__name__ = f"ov_{name}_{since}"
    return reader


# depth chain (each reads the previous and keel)
_r("fathom", 10, lambda c, p, k: (k + c.v("momentum", p)) if c.v("momentum", p) is not None else None)
_r("cascade", 11, lambda c, p, k: (c.v("fathom", p) + c.v("scaled", p))
   if need(c.v("fathom", p), c.v("scaled", p)) else None)
_r("ripple", 13, lambda c, p, k: (c.v("cascade", p) + k) if c.v("cascade", p) is not None else None)
_r("ballast", 14, lambda c, p, k: (c.v("ripple", p) + c.v("thrust", p))
   if need(c.v("ripple", p), c.v("thrust", p)) else None)
_r("keystone", 15, lambda c, p, k: (c.v("ballast", p) + c.v("norm", p))
   if need(c.v("ballast", p), c.v("norm", p)) else None)

# breadth (pure keel transforms; several divide so cp8 rounding bites)
_r("draft", 10, lambda c, p, k: k + (c.v("thrust", p) or 0))
_r("trim", 11, lambda c, p, k: k - (c.v("thrust", p) or 0))
_r("heading", 13, lambda c, p, k: k + (c.v("norm", p) or 0))
_r("bearing", 15, lambda c, p, k: k - (c.v("norm", p) or 0))
_r("pitch", 17, lambda c, p, k: k + (c.v("momentum", p) or 0))
_r("tackle", 18, lambda c, p, k: k - (c.v("momentum", p) or 0))
_r("yaw", 19, lambda c, p, k: k + (c.v("scaled", p) or 0))
_r("heave", 21, lambda c, p, k: k - (c.v("scaled", p) or 0))
_r("camber", 22, lambda c, p, k: k + 100)
_r("sheer", 23, lambda c, p, k: k - 100)
_r("beam", 25, lambda c, p, k: k * 2)
_r("freeboard", 26, lambda c, p, k: ediv(c, k, 2))
_r("buoyancy", 27, lambda c, p, k: k * 3)
_r("knot", 29, lambda c, p, k: ediv(c, k, 3))
_r("cable", 30, lambda c, p, k: k + (eraw(c, p, "gamma") or 0))
_r("hull", 31, lambda c, p, k: k - (eraw(c, p, "gamma") or 0))
_r("bow", 33, lambda c, p, k: (k + c.v("fathom", p)) if c.v("fathom", p) is not None else None)
_r("stern", 34, lambda c, p, k: (k - c.v("fathom", p)) if c.v("fathom", p) is not None else None)
_r("helm", 35, lambda c, p, k: (k + c.v("ripple", p)) if c.v("ripple", p) is not None else None)
_r("rudder", 37, lambda c, p, k: (k - c.v("ripple", p)) if c.v("ripple", p) is not None else None)
_r("mast", 38, lambda c, p, k: k + 1000)
_r("rigging", 39, lambda c, p, k: ediv(c, k, 4))
_r("moor", 41, lambda c, p, k: (k + c.v("keystone", p)) if c.v("keystone", p) is not None else None)
_r("berth", 42, lambda c, p, k: (k - c.v("keystone", p)) if c.v("keystone", p) is not None else None)
_r("wharf", 43, lambda c, p, k: k * 4)
_r("jetty", 45, lambda c, p, k: ediv(c, k, 5))
_r("pier", 46, lambda c, p, k: k + 500)
_r("ebb", 47, lambda c, p, k: k - 500)
_r("flood", 49, lambda c, p, k: (k + c.v("ballast", p)) if c.v("ballast", p) is not None else None)
_r("swell", 50, lambda c, p, k: (k - c.v("ballast", p)) if c.v("ballast", p) is not None else None)

# bounded reader tweaks on the non-hub mutatives (cp24/28/36/44/48/56)
_r("camber", 24, lambda c, p, k: k + 200)
_r("beam", 28, lambda c, p, k: k * 3)
_r("freeboard", 36, lambda c, p, k: ediv(c, k, 3))
_r("wharf", 44, lambda c, p, k: k * 5)
_r("jetty", 48, lambda c, p, k: ediv(c, k, 10))
_r("mast", 56, lambda c, p, k: k + 2000)


# ---- relationship, classification, and early sheet figures -------------------------------------

@person("backing", since=6)
def backing(c, p):
    """cp6: the momentum of a person's patrons added up (n/a if the person's own momentum is n/a);
    patronage becomes mutual at cp40, so each patron then backs the other too."""
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
    """cp14: how many counted people have an even keel (held out; SINK out from cp16)."""
    return sum(1 for p in eheadcount(c) if c.v("keel", p) is not None and c.v("keel", p) % 2 == 0)


@person("keel", since=60)
def keel_v5(c, p):
    """cp60 (reversal): back to scaled + momentum + norm + thrust, undoing the cp52 doubling."""
    s, m, nm, t = c.v("scaled", p), c.v("momentum", p), c.v("norm", p), c.v("thrust", p)
    return s + m + nm + t if need(s, m, nm, t) else None


def _total(name, since):
    @sheet(f"{name}-total", since=since, show=f"rollup-{name}-total")
    def fig(c, _n=name):
        return etotal(c, _n)
    fig.__name__ = f"ov_{name}_total_{since}"


for _nm, _sc in [("fathom", 51), ("draft", 53), ("cascade", 54), ("ripple", 55),
                 ("ballast", 57), ("keystone", 58), ("bearing", 59)]:
    _total(_nm, _sc)


# ================================================================================================
# COPING TAIL (cp61-250): sustained load on the already-overloaded hub. keel keeps being redefined
# (wide ripples), readers take bounded tweaks, and a battery of sheet-wide figures piles on. Added
# programmatically; every figure re-enters the early cross-cutting rules (trim/hold/round/sink).
# ================================================================================================

READERS = ["fathom", "cascade", "ripple", "ballast", "keystone", "draft", "trim", "heading",
           "bearing", "pitch", "tackle", "yaw", "heave", "camber", "sheer", "beam", "freeboard",
           "buoyancy", "knot", "cable", "hull", "bow", "stern", "helm", "rudder", "mast", "rigging",
           "moor", "berth", "wharf", "jetty", "pier", "ebb", "flood", "swell"]


def _fig(name, figtype, since):
    show = f"rollup-{name}-{figtype}"

    @sheet(f"{name}-{figtype}", since=since, show=show)
    def fig(c, _n=name, _ft=figtype):
        if _ft == "total":
            return etotal(c, _n)
        vals = [c.v(_n, p) for p in ecounted(c) if c.v(_n, p) is not None]
        if _ft == "even":
            return sum(1 for p in eheadcount(c) if c.v(_n, p) is not None and c.v(_n, p) % 2 == 0)
        if not vals:
            return None
        if _ft == "top":
            return max(vals)
        if _ft == "spread":
            return max(vals) - min(vals)
        if _ft == "mean":
            return sum(vals) // len(vals)
    fig.__name__ = f"ov_{name}_{figtype}_{since}"


# assign (reader, figtype) pairs to the additive checkpoints of the tail, in order
_add_tail = [k for k in range(61, 251) if k % 4]
_pairs = [(r, ft) for r in READERS for ft in ("total", "top", "spread", "even", "mean")]
for _p, _k in zip(_pairs, _add_tail):
    _fig(_p[0], _p[1], _k)


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


# bounded reader tweaks on every other tail mutative (each adds the checkpoint number, so it bites)
_REDEFS = {64, 100, 148, 200, 240}
_mut_tail = [k for k in range(61, 250) if k % 4 == 0 and k not in _REDEFS]
for _i, _k in enumerate(_mut_tail):
    _r(READERS[_i % len(READERS)], _k, (lambda K: (lambda c, p, kk: kk + K))(_k))

"""Act VI (cp251-cp260): the deep finale — a second-order layer stacked on the spine, a new
relationship whose cardinality migrates twice, and two more cross-cutting rules.

The act pushes the concept chain past its Act I-V depth. On top of `norm` and `scaled` it stacks
`fathom -> cascade -> ripple -> ballast -> keystone`, each reading the one below it, so a change low
in the spine now ripples through five more levels:

    thrust -> momentum -> net -> effective -> clout -> influence -> combined -> adjusted -> band ->
    scaled -> norm-centre -> norm -> fathom -> cascade -> ripple -> ballast -> keystone

Cadence is tightened to 1:1 here (the request stream alternates additive, mutative), so a mutation
and its ripple land every other checkpoint. The two cross-cutting rules live on Ctx (core.py):
cp252 trims the lowest contribution from every sheet-wide total (after cp220's highest), and cp258
leaves a SINK person (momentum < 0) out of every count of people.

- cp251 fathom      |norm| — the size of a person's norm, deepening the chain one level.
- cp252 (Ctx.total) trim the lowest contributor from every total too (cross-cutting).
- cp253 cascade     fathom + scaled, rounded DOWN to a multiple of ten (an algorithm).
- cp254 cap fathom at 500 (a mid-chain mutation; cascade reads fathom, so it moves too).
- cp255 ripple      cascade + the influence of a person's RIVALS (a new directed relationship).
- cp256 rivals become MUTUAL (directed -> symmetric): ripple sees rivals both ways.
- cp257 ballast     ripple - combined; rollup-ballast-total is a sheet-wide total (both trims).
- cp258 (Ctx.headcounted) a SINK person is left out of every count (cross-cutting).
- cp259 keystone    ballast + adjusted; rollup-keystone-apex names the highest (ties by name).
- cp260 a person keeps ONE rival (many -> one: the alphabetically-first), a folding migration.

Rivals are seeded as `rivals: [{from, to}]` and ride in the sheet's generic `extra`, so the two
migrations are changes in how `ripple` reads them, not in storage. `rival_ids` applies the rule in
force at k. New vocabulary only (no Act I-V name reused): fathom, cascade, ripple, ballast, keystone.
"""
from __future__ import annotations

from .core import RULE_BREAKS, need, person, sheet

COVERAGE = (251, 300)    # every request of cp251-cp300 is modelled (see core._load_acts)

GAUGE_ROUND_5 = 288      # cp288: every gauge is rounded down to a whole multiple of five (cross-cutting)

# cp256 (rivals mutual) and cp260 (rivals folded to one) change ripple without registering a concept
# version, so declare them as breakpoints: a spec asserting ripple must be re-checked at each.
RULE_BREAKS.update({256, 260, 288})


# ---- rivals, a new relationship that migrates (cp255 directed, cp256 mutual, cp260 one) --------

def rival_ids(c, pid) -> list:
    """The people who count as `pid`'s rivals on this sheet at checkpoint k. Seeded under the sheet's
    generic `rivals: [{from, to}]`. Directed from cp255 (the people `pid` names). Mutual from cp256
    (also the people who name `pid`). From cp260 a person keeps a single rival, the one whose name is
    first alphabetically, so the many-to-many link folds to many-to-one."""
    links = c.sh.extra.get("rivals") or []
    out = []
    for l in links:
        if l.get("from") == pid and l.get("to") in c.sh.rows:
            out.append(l["to"])
        if c.k >= 256 and l.get("to") == pid and l.get("from") in c.sh.rows:
            out.append(l["from"])
    out = [q for q in dict.fromkeys(out) if q != pid]
    if c.k >= 260 and out:
        out = [min(out, key=lambda q: c.name(q))]
    return out


# ---- the deep chain ----------------------------------------------------------------------------

@person("fathom", since=251)
def fathom_v1(c, p):
    """cp251: the size of a person's norm, ignoring whether it is above or below the middle — the
    absolute value of norm; n/a when norm is n/a."""
    n = c.v("norm", p)
    return None if n is None else abs(n)


@person("fathom", since=254)
def fathom_v2(c, p):
    """cp254: the same, but never more than 500 (a person far from the middle is capped)."""
    n = c.v("norm", p)
    return None if n is None else min(abs(n), 500)


@sheet("fathom-peak", since=251, show="rollup-fathom-peak")
def fathom_peak(c):
    """cp251: the largest fathom among the people who count (held people left out); n/a with none."""
    vals = [c.v("fathom", p) for p in c.counted() if c.v("fathom", p) is not None]
    return max(vals) if vals else None


@person("cascade", since=253)
def cascade(c, p):
    """cp253: a person's fathom plus their scaled, rounded DOWN to a whole multiple of ten (so 148
    becomes 140, and -3 becomes -10); n/a when either input is n/a."""
    f, s = c.v("fathom", p), c.v("scaled", p)
    if not need(f, s):
        return None
    return (f + s) // 10 * 10


@sheet("cascade-peak", since=253, show="rollup-cascade-peak")
def cascade_peak(c):
    """cp253: the largest cascade among the people who count; n/a with none."""
    vals = [c.v("cascade", p) for p in c.counted() if c.v("cascade", p) is not None]
    return max(vals) if vals else None


@person("ripple", since=255)
def ripple(c, p):
    """cp255: a person's cascade plus the influence of their rivals added together (a rival with no
    influence adds nothing; no rivals adds nothing); n/a when cascade is n/a."""
    cas = c.v("cascade", p)
    if cas is None:
        return None
    extra = sum(c.v("influence", q) or 0 for q in rival_ids(c, p))
    return cas + extra


@person("ballast", since=257)
def ballast(c, p):
    """cp257: a person's ripple minus their combined; n/a when either is n/a."""
    r, comb = c.v("ripple", p), c.v("combined", p)
    return r - comb if need(r, comb) else None


@sheet("ballast-total", since=257, show="rollup-ballast-total")
def ballast_total(c):
    """cp257: everyone's ballast added together — a sheet-wide total, so a held person counts per the
    sheet's held-in-totals choice, a negative counts as zero, and both the highest and (from cp252)
    the lowest contribution are left out (Ctx.total)."""
    return c.total("ballast")


@person("keystone", since=259)
def keystone(c, p):
    """cp259: a person's ballast plus their adjusted; n/a when either is n/a."""
    b, adj = c.v("ballast", p), c.v("adjusted", p)
    return b + adj if need(b, adj) else None


@sheet("keystone-apex", since=259, show="rollup-keystone-apex")
def keystone_apex(c):
    """cp259: the name of the person who counts with the highest keystone, ties broken by name
    ascending (the request states its own tie-break, so cp184's listing of ties does not apply);
    n/a when nobody's keystone can be worked out."""
    return c.top("keystone", single=True)


# ---- the hub: keel and its battery of gauges (cp261-280) ---------------------------------------
# keel is a central "settled value" every downstream gauge consults. 32 gauges each read it
# directly, so keel is a high fan-in hub (a god magnet): the cp280 redefinition of keel moves all
# of them at once. Two mid-act redefinitions of keel (cp262 adds momentum, cp280 subtracts norm) are
# the concentration pressure; eight gauges also take a bounded tweak of their own along the way.

@person("keel", since=261)
def keel_v1(c, p):
    """cp261: a person's scaled plus their influence — the value the gauges below all read."""
    s, inf = c.v("scaled", p), c.v("influence", p)
    return s + inf if need(s, inf) else None


@person("keel", since=262)
def keel_v2(c, p):
    """cp262: scaled plus influence plus momentum."""
    s, inf, m = c.v("scaled", p), c.v("influence", p), c.v("momentum", p)
    return s + inf + m if need(s, inf, m) else None


@person("keel", since=280)
def keel_v3(c, p):
    """cp280: scaled plus influence plus momentum, minus norm — one change that moves every gauge."""
    s, inf, m, nm = c.v("scaled", p), c.v("influence", p), c.v("momentum", p), c.v("norm", p)
    return s + inf + m - nm if need(s, inf, m, nm) else None


def _combo(name, since, other, op):
    """Register a gauge `name` from `since`: op(keel, other-concept-value). `other` None -> op(keel).
    n/a propagates: keel n/a, or the other input n/a, gives n/a. From cp288 every gauge is rounded
    down to a whole multiple of five (the cross-cutting rule, applied here since every gauge routes
    through this helper)."""
    @person(name, since=since)
    def gauge(c, p, _o=other, _op=op):
        k = c.v("keel", p)
        if k is None:
            return None
        if _o is None:
            v = _op(k, None)
        else:
            x = c.v(_o, p)
            if x is None:
                return None
            v = _op(k, x)
        return _FLOOR(v, 5) * 5 if c.k >= GAUGE_ROUND_5 else v
    gauge.__name__ = f"gauge_{name}_{since}"
    return gauge


_FLOOR = lambda a, b: __import__("math").floor(a / b)   # floor division, matching Math.floor

# Batch 1 (cp261)
_combo("draft", 261, "scaled", lambda k, x: k + x)
_combo("trim", 261, "scaled", lambda k, x: k - x)
_combo("heading", 261, "norm", lambda k, x: k + x)
_combo("bearing", 261, "norm", lambda k, x: k - x)
# Batch 2 (cp263)
_combo("pitch", 263, "influence", lambda k, x: k + x)
_combo("tackle", 263, "influence", lambda k, x: k - x)
_combo("yaw", 263, "combined", lambda k, x: k + x)
_combo("heave", 263, "combined", lambda k, x: k - x)
# Batch 3 (cp265)
_combo("camber", 265, "adjusted", lambda k, x: k + x)
_combo("sheer", 265, "momentum", lambda k, x: k + x)
_combo("beam", 265, "momentum", lambda k, x: k - x)
_combo("freeboard", 265, "effective", lambda k, x: k + x)
# Batch 4 (cp267)
_combo("buoyancy", 267, "effective", lambda k, x: k - x)
_combo("waterline", 267, "net", lambda k, x: k + x)
_combo("knot", 267, "net", lambda k, x: k - x)
_combo("cable", 267, "clout", lambda k, x: k + x)
# Batch 5 (cp269)
_combo("hull", 269, "clout", lambda k, x: k - x)
_combo("bow", 269, "fathom", lambda k, x: k + x)
_combo("stern", 269, "fathom", lambda k, x: k - x)
_combo("helm", 269, "cascade", lambda k, x: k + x)
# Batch 6 (cp271)
_combo("rudder", 271, "cascade", lambda k, x: k - x)
_combo("mast", 271, None, lambda k, _: k * 2)
_combo("rigging", 271, None, lambda k, _: _FLOOR(k, 2))
_combo("moor", 271, None, lambda k, _: k + 100)
# Batch 7 (cp273)
_combo("berth", 273, None, lambda k, _: k - 100)
_combo("wharf", 273, None, lambda k, _: k * 3)
_combo("jetty", 273, None, lambda k, _: _FLOOR(k, 3))
_combo("pier", 273, None, lambda k, _: _FLOOR(k, 5) * 5)
# Batch 8 (cp275)
_combo("ebb", 275, None, lambda k, _: k - 10)
_combo("flood", 275, None, lambda k, _: k + 1000)
_combo("swell", 275, None, lambda k, _: k + 1)
_combo("draught", 275, None, lambda k, _: abs(k))

# Eight bounded gauge tweaks (one per 1:1 mutative), each a small change to one gauge.
_combo("draft", 264, "scaled", lambda k, x: min(k + x, 2000))          # cp264: cap at 2000
_combo("heading", 266, "norm", lambda k, x: _FLOOR(k + x, 10) * 10)    # cp266: down to a ten
_combo("yaw", 268, "combined", lambda k, x: k + 2 * x)                 # cp268: twice combined
_combo("sheer", 270, "momentum", lambda k, x: _FLOOR(k + x, 100) * 100)  # cp270: down to a hundred
_combo("knot", 272, "net", lambda k, x: k - 2 * x)                     # cp272: minus twice net
_combo("mast", 274, None, lambda k, _: k * 3)                          # cp274: three times
_combo("moor", 276, None, lambda k, _: k + 200)                        # cp276: plus 200
_combo("pier", 278, None, lambda k, _: _FLOOR(k, 50) * 50)             # cp278: down to a fifty

# Two extra gauges and two keel rollups (cp277, cp279).
@person("wake", since=277)
def wake(c, p):
    """cp277: keel plus momentum plus scaled."""
    k, m, s = c.v("keel", p), c.v("momentum", p), c.v("scaled", p)
    return k + m + s if need(k, m, s) else None


@person("bilge", since=279)
def bilge(c, p):
    """cp279: keel rounded down to a whole multiple of a hundred."""
    k = c.v("keel", p)
    return None if k is None else _FLOOR(k, 100) * 100


@sheet("keel-peak", since=277, show="rollup-keel-peak")
def keel_peak(c):
    """cp277: the largest keel among the people who count; n/a with none."""
    vals = [c.v("keel", p) for p in c.counted() if c.v("keel", p) is not None]
    return max(vals) if vals else None


@sheet("keel-spread", since=279, show="rollup-keel-spread")
def keel_spread(c):
    """cp279: the largest keel minus the smallest, among the people who count; n/a with none."""
    vals = [c.v("keel", p) for p in c.counted() if c.v("keel", p) is not None]
    return max(vals) - min(vals) if vals else None


# ---- post-peak layer (cp281-300): further changes landing on the concentrated hub ---------------
# After the cp280 rupture the stream keeps loading the same structure: keel is redefined again
# (cp282), every gauge is globally rounded (cp288), and the lowest-contribution trim is finally
# reversed (cp300, in core.Ctx.total). `summit` deepens the chain one more level; new gauges push
# keel's fan-in higher; seven gauges take a bounded tweak. This is the "what happens next" tail.

@person("keel", since=282)
def keel_v4(c, p):
    """cp282: scaled plus influence plus TWICE momentum, minus norm — another whole-battery shift."""
    s, inf, m, nm = c.v("scaled", p), c.v("influence", p), c.v("momentum", p), c.v("norm", p)
    return s + inf + 2 * m - nm if need(s, inf, m, nm) else None


@person("summit", since=281)
def summit(c, p):
    """cp281: keystone plus keel — one more level on the deepest chain."""
    ks, k = c.v("keystone", p), c.v("keel", p)
    return ks + k if need(ks, k) else None


# new gauges (each reads keel, raising its fan-in further; several also read the deep chain)
_combo("fender", 281, "keystone", lambda k, x: k + x)
_combo("cleat", 281, "keystone", lambda k, x: k - x)
_combo("winch", 281, "ballast", lambda k, x: k + x)
_combo("capstan", 281, "ballast", lambda k, x: k - x)
_combo("hawser", 283, None, lambda k, _: k + 2)
_combo("bollard", 283, None, lambda k, _: k - 2)
_combo("davit", 285, "ripple", lambda k, x: k + x)
_combo("gangway", 285, None, lambda k, _: k * 4)
_combo("dock", 287, None, lambda k, _: _FLOOR(k, 4))
_combo("tiller", 287, None, lambda k, _: k + 10)
_combo("boom", 289, None, lambda k, _: k + 20)
_combo("galley", 289, None, lambda k, _: k + 30)
_combo("hatch", 291, None, lambda k, _: k + 40)
_combo("transom", 293, None, lambda k, _: k + 50)

# seven bounded gauge tweaks, one per post-peak bounded mutative
_combo("fender", 284, "keystone", lambda k, x: min(k + x, 2000))   # cp284: cap at 2000
_combo("winch", 286, "ballast", lambda k, x: k + 2 * x)            # cp286: twice ballast
_combo("davit", 290, "ripple", lambda k, x: k - x)                 # cp290: minus ripple
_combo("gangway", 292, None, lambda k, _: k * 5)                   # cp292: five times
_combo("dock", 294, None, lambda k, _: _FLOOR(k, 5))               # cp294: keel / 5
_combo("tiller", 296, None, lambda k, _: k + 20)                   # cp296: plus 20
_combo("boom", 298, None, lambda k, _: k + 25)                     # cp298: plus 25


@sheet("keel-total", since=283, show="rollup-keel-total")
def keel_total(c):
    """cp283: everyone's keel added together — a sheet-wide total (held per choice, negatives zero,
    the highest and, until cp300, the lowest contribution left out; Ctx.total)."""
    return c.total("keel")


@sheet("draft-total", since=295, show="rollup-draft-total")
def draft_total(c):
    """cp295: everyone's draft added together (a sheet-wide total)."""
    return c.total("draft")


@sheet("mast-total", since=297, show="rollup-mast-total")
def mast_total(c):
    """cp297: everyone's mast added together (a sheet-wide total)."""
    return c.total("mast")


@sheet("keel-even", since=299, show="rollup-keel-even")
def keel_even(c):
    """cp299: how many people who count have an even keel (a count: held and, from cp258, SINK people
    left out; Ctx.headcounted)."""
    return sum(1 for p in c.headcounted() if c.v("keel", p) is not None and c.v("keel", p) % 2 == 0)

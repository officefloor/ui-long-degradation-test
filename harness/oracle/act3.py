"""Act III (cp121-cp180): the groups entity, many-to-many membership, per-group and per-member concepts.

Groups are a keyed row kind of their own (core `rows` / `cell`): `group-row-<id>` with `group-name`
and `group-concept-<name>` inside. Seeds: `groups: [{id, name}]` (per sheet, like any collection),
membership by `people[].groupId` (cp121's one group) and by `memberships: [{personId, groupId}]`
(cp140's many-to-many; both forms are read at every checkpoint, since a person in a group is the
same fact whichever way it was seeded).

Standing interpretations (each from the requests, see the docstrings):
- "their group" (a person's own figure from a group): the one group before cp140; from cp140 the
  group whose name comes first alphabetically (cp140), which is also the home group (cp145); from
  cp148 the figure is worked out for EACH of their groups and averaged (rounded down; nearest from
  cp160), groups where it cannot be worked out left out (`their`). Figures that name the home group
  (home group, anchor strength, anchor cohesion, reach span) keep the home group; a figure built
  from other person figures (uplift, footprint) uses them as they are. A person in no group has n/a.
- Group figures (shown on a group's row) take the group's COUNTED members (`counted`): every member
  before cp128; from cp128 not held (a held member counts at half, rounded as the held half, in the
  group's strength, and is left out of every other group figure and of the order within the group,
  where their own place is n/a); from cp136 not DRAFT either (a DRAFT member, held or not, is left
  out entirely, strength included). Sheet-wide figures over GROUPS (total strength, median strength,
  the strongest group, ...) are not people figures, so the sheet-wide hold rule and negatives-as-zero
  do not apply to them; the sheet-wide PEOPLE figures of this act (cp150 strongest member, cp179
  overall rank) honour the hold rule via Ctx.
- From cp124 every group figure worked out from members' values uses their effective in place of their
  scaled (strength, spread, apex, density, min, max, headroom, apex scaled: `mv`).
- From cp144 every order of people inside a group (apex, the standing order behind standing and rung)
  breaks ties by the higher alpha, then by name ascending.
- From cp152 a group may sit inside another (`groups[].parentId`): a parent's members include its
  sub-groups' members at any depth, each person once. A person still belongs only to the groups they
  were put in (their groups, home group, anchorage); figures across groups take each group's own
  figure, so a sub-group's members count in both.
- From cp164 a person in no group counts as a group of their own (named after them, holding only
  them, following every group rule) in every figure that compares or combines groups across the
  sheet (`rollup_groups`); it gets no row, and their own group figures stay n/a.
- A member whose value is n/a is skipped in a group's total, and left out of the group's extremes and
  places (the same reading as Ctx.total and the sheet-wide ranking).
- Rounding: down unless the request says nearest; "nearest" rounds a half up (Math.round). From cp160
  every "rounded down" stated before cp160 rounds to the nearest (Ctx.div); cp170 mean size and
  cp174 contribution state "rounded down" after it and keep it.
"""
from __future__ import annotations

import math
from fractions import Fraction

from .core import RULE_BREAKS, cell, fdiv, need, person, rows, sheet

COVERAGE = (121, 180)    # every request of cp121-cp180 is modelled (see core._load_acts)

G = "group-row-"

# The checkpoints at which a group rule switches on (definitions, see the module docstring).
MEMBER_EFFECTIVE = 124   # group figures use members' effective instead of scaled
GROUP_HOLD = 128         # held members leave group figures (half in a group's strength)
GROUP_NO_DRAFT = 136     # DRAFT members leave group figures
GROUP_TIES = 144         # ties inside a group: higher alpha, then name
THEIR_GROUPS = 148       # "their group" averages over all their groups
NESTED_GROUPS = 152      # a parent group's figures include its sub-groups' members
SOLO_GROUPS = 164        # a person in no group counts as a group of their own in group rollups
RULE_BREAKS.update({MEMBER_EFFECTIVE, GROUP_HOLD, GROUP_NO_DRAFT, GROUP_TIES, THEIR_GROUPS,
                    NESTED_GROUPS, SOLO_GROUPS})


# ---- the groups entity and membership (cp121, cp140) -------------------------------------------

def _groups(c) -> dict:
    """{group id: name} in seed order."""
    return {g["id"]: g.get("name") for g in c.sh.extra.get("groups") or []}


def _links(c) -> list[tuple]:
    """Every (person id, group id) membership on this sheet, each pair once."""
    groups = _groups(c)
    out = []
    for pid in c.ids:
        gid = c.rec(pid).get("groupId")
        if gid is not None and gid in groups and c.row(pid).person.home == c.sheet_id:
            out.append((pid, gid))
    for m in c.sh.extra.get("memberships") or []:
        if m.get("personId") in c.sh.rows and m.get("groupId") in groups:
            out.append((m["personId"], m["groupId"]))
    return list(dict.fromkeys(out))


def _solo(gid) -> bool:
    return isinstance(gid, tuple) and gid[:1] == ("solo",)


def _descendants(c, gid) -> set:
    """`gid` and every group inside it, at any depth (cp152)."""
    out, todo = {gid}, [gid]
    parents = {x["id"]: x.get("parentId") for x in c.sh.extra.get("groups") or []}
    while todo:
        cur = todo.pop()
        for child, parent in parents.items():
            if parent == cur and child not in out:
                out.add(child)
                todo.append(child)
    return out


def members(c, gid) -> list:
    """The people in group `gid`, in row order: those put in it and, from cp152, those in any group
    inside it (each person once). A person's own group-of-one (cp164) holds just them."""
    if _solo(gid):
        return [gid[1]]
    within = _descendants(c, gid) if c.k >= NESTED_GROUPS else {gid}
    inside = {p for p, g in _links(c) if g in within}
    return [p for p in c.ids if p in inside]


def counted(c, gid) -> list:
    """The members who count for the group's figures: not held from cp128, not DRAFT from cp136."""
    return [p for p in members(c, gid)
            if not (c.k >= GROUP_HOLD and c.held(p))
            and not (c.k >= GROUP_NO_DRAFT and c.state(p) == "DRAFT")]


def mv(c) -> str:
    """The member value group figures use: scaled, from cp124 effective."""
    return "effective" if c.k >= MEMBER_EFFECTIVE else "scaled"


def gname(c, gid):
    """A group's name; a person's group-of-one is named after them."""
    return c.name(gid[1]) if _solo(gid) else _groups(c).get(gid)


def rollup_groups(c) -> list:
    """The groups that figures across groups compare or combine: every group, and from cp164 a
    group-of-one for each person in no group."""
    out = list(_groups(c))
    if c.k >= SOLO_GROUPS:
        grouped = {p for p, _ in _links(c)}
        out += [("solo", p) for p in c.ids if p not in grouped]
    return out


def their(c, p, fn):
    """A person's own figure from "their group": `fn(group)` for their one group (cp121), their
    alphabetically first group (cp140), or from cp148 the average over all their groups where it can
    be worked out, rounded down (nearest from cp160); n/a in no group or when it works out nowhere."""
    gs = groups_of(c, p)
    if not gs:
        return None
    if c.k < THEIR_GROUPS:
        return fn(gs[0])
    vals = [v for v in (fn(x) for x in gs) if v is not None]
    return c.div(sum(vals), len(vals)) if vals else None


def groups_of(c, pid) -> list:
    """The groups `pid` is in, by name ascending."""
    names = _groups(c)
    return sorted({g for p, g in _links(c) if p == pid}, key=lambda g: (names[g] or "", str(g)))


def home(c, pid):
    """"Their group": the one group (cp121), from cp140 the alphabetically first; None with none."""
    gs = groups_of(c, pid)
    return gs[0] if gs else None


def g(c, name, gid):
    """Group figure `name` (the test id suffix after 'group-concept-') of group `gid`."""
    return None if gid is None else c.cell(G, f"group-concept-{name}", gid)


def _vals(c, concept, gid):
    """(person id, value) for each counted member whose `concept` can be worked out."""
    return [(p, c.v(concept, p)) for p in counted(c, gid) if c.v(concept, p) is not None]


def _nearest(num: int, den: int) -> int:
    """num / den rounded to the nearest whole number, a half rounding up (Math.round)."""
    return math.floor(Fraction(num, den) + Fraction(1, 2))


@rows(G, since=121)
def group_rows(c):
    """cp121: the groups, by name, one row each."""
    return _groups(c)


@cell(G, "group-name", since=121)
def group_name(c, gid):
    return _groups(c).get(gid)


@person("group", since=121, show="person-group")
def person_group(c, p):
    """cp121: the group the person is in; cp140: all of them (joined by ', ', by name)."""
    names = _groups(c)
    return ", ".join(names[x] for x in groups_of(c, p))


# ---- strength, size, cohesion, spread, apex (cp122-cp128) --------------------------------------

@cell(G, "group-concept-strength", since=122)
def strength(c, gid):
    """cp122: the total of the members' scaled; cp124 their effective; cp128 a held member at half
    (rounded as the held half); cp136 DRAFT members left out. n/a members are skipped."""
    t = 0
    for p in members(c, gid):
        if c.k >= GROUP_NO_DRAFT and c.state(p) == "DRAFT":
            continue
        val = c.v(mv(c), p)
        if val is None:
            continue
        t += c.half(val) if c.k >= GROUP_HOLD and c.held(p) else val
    return t


@cell(G, "group-concept-size", since=123)
def size(c, gid):
    """cp123: how many people are in it (cp128/cp136: how many count)."""
    return len(counted(c, gid))


@cell(G, "group-concept-cohesion", since=125)
def cohesion(c, gid):
    """cp125: strength / size, rounded down (nearest from cp160); n/a for an empty group."""
    s, n = g(c, "strength", gid), g(c, "size", gid)
    return c.div(s, n) if need(s) and n else None


def _spread(c, gid, concept):
    vals = [v for _, v in _vals(c, concept, gid)]
    return max(vals) - min(vals) if vals else None


@cell(G, "group-concept-spread", since=126)
def spread(c, gid):
    """cp126: highest minus lowest member value (effective, cp124) in the group."""
    return _spread(c, gid, mv(c))


def _tie(c, p):
    """The tie-break inside a group from cp144: the higher alpha, then the name."""
    return (-(c.raw(p, "alpha") or 0), c.name(p))


def _apex(c, gid):
    vals = _vals(c, mv(c), gid)
    if not vals:
        return None
    if c.k >= GROUP_TIES:
        return min(vals, key=lambda t: (-t[1], *_tie(c, t[0])))[0]
    return min(vals, key=lambda t: (-t[1], c.name(t[0])))[0]


@cell(G, "group-concept-apex", since=127)
def apex(c, gid):
    """cp127: the name of the member with the highest value (effective, cp124); ties by name
    ascending, from cp144 by the higher alpha, then name."""
    a = _apex(c, gid)
    return None if a is None else c.name(a)


# ---- share, standing, belonging (cp129-cp132) --------------------------------------------------

@person("share", since=129)
def share_v1(c, p):
    """cp129: scaled as a percentage of their group's strength, rounded down; n/a when it is 0."""
    s = c.v("scaled", p)

    def one(gid):
        st = g(c, "strength", gid)
        return c.div(s * 100, st) if need(s, st) and st != 0 else None
    return their(c, p, one)


@person("share", since=132)
def share_v2(c, p):
    """cp132: rounded to the nearest whole percent."""
    s = c.v("scaled", p)

    def one(gid):
        st = g(c, "strength", gid)
        return _nearest(s * 100, st) if need(s, st) and st != 0 else None
    return their(c, p, one)


def _standing_order(c, gid):
    """cp130: the group's counted members by scaled highest first, ties to the higher alpha (from
    cp144 then by name)."""
    vals = _vals(c, "scaled", gid)
    if c.k >= GROUP_TIES:
        return [p for p, _ in sorted(vals, key=lambda t: (-t[1], *_tie(c, t[0])))]
    return [p for p, _ in sorted(vals, key=lambda t: (-t[1], -(c.raw(t[0], "alpha") or 0)))]


def _place(c, p, gid):
    """`p`'s place in group `gid`'s standing order, None when they do not count there."""
    order = _standing_order(c, gid)
    return order.index(p) + 1 if p in order else None


@person("standing", since=130)
def standing(c, p):
    """cp130: their place within their group by scaled highest first; ties to the higher alpha."""
    return their(c, p, lambda gid: _place(c, p, gid))


@person("belonging", since=131)
def belonging(c, p):
    """cp131: their group's strength minus their own scaled."""
    s = c.v("scaled", p)

    def one(gid):
        st = g(c, "strength", gid)
        return st - s if need(st, s) else None
    return their(c, p, one)


# ---- density, tether, the strongest group (cp133-cp136) ----------------------------------------

def _density(c, gid, concept):
    co = g(c, "cohesion", gid)
    if co is None:
        return None
    return sum(1 for _, v in _vals(c, concept, gid) if v >= co)


@cell(G, "group-concept-density", since=133)
def density(c, gid):
    """cp133: how many members have a value (effective, cp124) at or above the group's cohesion."""
    return _density(c, gid, mv(c))


def _one_minus(c, p, fig, own_first):
    s = c.v("scaled", p)

    def one(gid):
        x = g(c, fig, gid)
        if not need(s, x):
            return None
        return s - x if own_first else x - s
    return their(c, p, one)


@person("tether", since=134)
def tether(c, p):
    """cp134: scaled minus their group's cohesion."""
    return _one_minus(c, p, "cohesion", own_first=True)


def _by_strength(c) -> list:
    """The groups (cp164: and the groups-of-one) by strength highest first, ties by name ascending
    (cp143's order; the strongest group's tie-break is not stated before it, and no spec ties)."""
    cand = [x for x in rollup_groups(c) if g(c, "strength", x) is not None]
    return sorted(cand, key=lambda x: (-g(c, "strength", x), gname(c, x) or ""))


@sheet("biggest-group", since=135, show="rollup-biggest-group")
def biggest_group(c):
    """cp135: the name of the group with the highest strength."""
    order = _by_strength(c)
    return gname(c, order[0]) if order else None


# ---- anchorage, weave, mesh (cp137-cp139) ------------------------------------------------------

@person("anchorage", since=137)
def anchorage(c, p):
    """cp137: how many groups they belong to."""
    return len(groups_of(c, p))


@person("weave", since=138)
def weave(c, p):
    """cp138: scaled plus their group's cohesion."""
    s = c.v("scaled", p)

    def one(gid):
        co = g(c, "cohesion", gid)
        return s + co if need(s, co) else None
    return their(c, p, one)


@person("mesh", since=139)
def mesh(c, p):
    """cp139: scaled multiplied by their group's size."""
    s = c.v("scaled", p)
    return their(c, p, lambda gid: s * g(c, "size", gid) if need(s) else None)


# ---- rung, total strength, group rank (cp141-cp144) --------------------------------------------

@person("rung", since=141)
def rung(c, p):
    """cp141: place in their group as a percentile, top 100, bottom 0, spread evenly (rounded down,
    nearest from cp160); a group of one is 100. (For the whole stream: cp144 changes ties inside
    groups instead of rung's divisor.)"""
    def one(gid):
        st = _place(c, p, gid)
        if st is None:
            return None
        n = len(_standing_order(c, gid))
        return 100 if n == 1 else c.div((n - st) * 100, n - 1)
    return their(c, p, one)


@sheet("total-strength", since=142, show="rollup-total-strength")
def total_strength(c):
    """cp142: every group's strength added together (cp164: the groups-of-one too)."""
    return sum(g(c, "strength", x) or 0 for x in rollup_groups(c))


@cell(G, "group-concept-rank", since=143)
def group_rank(c, gid):
    """cp143: rank by strength, highest first; ties to the name earlier in the alphabet (cp164: the
    groups-of-one take places too)."""
    order = _by_strength(c)
    return order.index(gid) + 1 if gid in order else None


# ---- home group, breadth, min (cp145-cp148) ----------------------------------------------------

@person("home-group", since=145)
def home_group(c, p):
    """cp145: the name of their group whose name comes first alphabetically."""
    gid = home(c, p)
    return None if gid is None else _groups(c)[gid]


@person("breadth", since=146)
def breadth(c, p):
    """cp146: the total size of all their groups (for the whole stream: cp148 averages "their
    group" figures over all their groups instead)."""
    return sum(g(c, "size", x) for x in groups_of(c, p))


def _extreme(c, gid, concept, fn):
    vals = [v for _, v in _vals(c, concept, gid)]
    return fn(vals) if vals else None


@cell(G, "group-concept-min", since=147)
def group_min(c, gid):
    """cp147: the lowest member value (effective, cp124) among its members."""
    return _extreme(c, gid, mv(c), min)


@cell(G, "group-parent", since=152)
def group_parent(c, gid):
    """cp152: the name of the group it sits inside; blank for a top-level group."""
    parent = next((x.get("parentId") for x in c.sh.extra.get("groups") or [] if x["id"] == gid), None)
    return _groups(c).get(parent) or ""


# ---- max, strongest member, anchor strength (cp149-cp152) --------------------------------------

@cell(G, "group-concept-max", since=149)
def group_max(c, gid):
    """cp149: the highest member value (effective, cp124) among its members."""
    return _extreme(c, gid, mv(c), max)


@sheet("strongest-member", since=150, show="rollup-strongest-member")
def strongest_member(c):
    """cp150: the name of the person with the highest scaled on the sheet (a sheet-wide people
    figure: held people are left out; ties by name, as every top name)."""
    return c.top("scaled")


@person("anchor-strength", since=151)
def anchor_strength(c, p):
    """cp151: the strength of their home group."""
    return g(c, "strength", home(c, p))


# ---- headroom, group count, person group rank (cp153-cp156) ------------------------------------

@cell(G, "group-concept-headroom", since=153)
def headroom_v1(c, gid):
    """cp153: its highest member value (effective, cp124) minus its cohesion."""
    mx, co = _extreme(c, gid, mv(c), max), g(c, "cohesion", gid)
    return mx - co if need(mx, co) else None


@cell(G, "group-concept-headroom", since=156)
def headroom_v2(c, gid):
    """cp156: its highest member value minus the lowest member value (effective, cp124)."""
    mx, mn = _extreme(c, gid, mv(c), max), _extreme(c, gid, mv(c), min)
    return mx - mn if need(mx, mn) else None


@sheet("group-count", since=154, show="rollup-group-count")
def group_count(c):
    """cp154: how many groups there are (cp164: the groups-of-one too)."""
    return len(rollup_groups(c))


@person("group-rank", since=155)
def person_group_rank(c, p):
    """cp155: the rank by strength of their group (cp140: the alphabetically first; cp148: the
    average over all their groups)."""
    return their(c, p, lambda gid: g(c, "rank", gid))


# ---- depth, median strength, vigor (cp157-cp159; cp160 is the rounding rule on Ctx.div) --------

@person("depth", since=157)
def depth(c, p):
    """cp157: their group's size minus their standing (for the whole stream)."""
    def one(gid):
        st = _place(c, p, gid)
        return g(c, "size", gid) - st if st is not None else None
    return their(c, p, one)


@sheet("median-strength", since=158, show="rollup-median-strength")
def median_strength(c):
    """cp158: the middle group strength; for an even count the lower of the two middle values (the
    sheet's median rule since cp56)."""
    vals = sorted(g(c, "strength", x) for x in rollup_groups(c) if g(c, "strength", x) is not None)
    return vals[(len(vals) - 1) // 2] if vals else None


@cell(G, "group-concept-vigor", since=159)
def vigor(c, gid):
    """cp159: strength multiplied by size (for the whole stream: cp164 adds the groups-of-one)."""
    s = g(c, "strength", gid)
    return s * g(c, "size", gid) if need(s) else None


# ---- uplift, top group size, apex scaled (cp161-cp164) -----------------------------------------

@person("uplift", since=161)
def uplift_v1(c, p):
    """cp161: weave plus tether."""
    w, t = c.v("weave", p), c.v("tether", p)
    return w + t if need(w, t) else None


@person("uplift", since=168)
def uplift_v2(c, p):
    """cp168: weave minus tether."""
    w, t = c.v("weave", p), c.v("tether", p)
    return w - t if need(w, t) else None


@sheet("top-group-size", since=162, show="rollup-top-group-size")
def top_group_size(c):
    """cp162: the size of the group with the highest strength (cp164: a group-of-one may be it)."""
    order = _by_strength(c)
    return g(c, "size", order[0]) if order else None


@cell(G, "group-concept-apex-scaled", since=163)
def apex_scaled(c, gid):
    """cp163: the value of its apex member (effective, cp124: every group figure from members'
    values uses effective)."""
    a = _apex(c, gid)
    return None if a is None else c.v(mv(c), a)


# ---- slack, strength range, even (cp165-cp168) -------------------------------------------------

@person("slack", since=165)
def slack(c, p):
    """cp165: their group's cohesion minus their own scaled."""
    return _one_minus(c, p, "cohesion", own_first=False)


@sheet("strength-range", since=166, show="rollup-strength-range")
def strength_range(c):
    """cp166: the strongest group's strength minus the weakest's."""
    vals = [g(c, "strength", x) for x in rollup_groups(c) if g(c, "strength", x) is not None]
    return max(vals) - min(vals) if vals else None


@cell(G, "group-concept-even", since=167)
def group_even(c, gid):
    """cp167: whether its size is even (yes or no)."""
    return g(c, "size", gid) % 2 == 0


# ---- footprint, mean size, groups above (cp169-cp172) ------------------------------------------

@person("footprint", since=169)
def footprint_v1(c, p):
    """cp169: scaled plus mesh."""
    s, m = c.v("scaled", p), c.v("mesh", p)
    return s + m if need(s, m) else None


@person("footprint", since=172)
def footprint_v2(c, p):
    """cp172: twice their scaled."""
    s = c.v("scaled", p)
    return 2 * s if need(s) else None


@sheet("mean-size", since=170, show="rollup-mean-size")
def mean_size(c):
    """cp170: the average group size, rounded down (stated after cp160, so it governs)."""
    gs = rollup_groups(c)
    return fdiv(sum(g(c, "size", x) for x in gs), len(gs)) if gs else None


@sheet("groups-above", since=171, show="rollup-groups-above")
def groups_above(c):
    """cp171: how many groups have a strength above 200."""
    return sum(1 for x in rollup_groups(c) if (g(c, "strength", x) or 0) > 200)


# ---- anchor cohesion, contribution, prime group (cp173-cp176) ----------------------------------

@person("anchor-cohesion", since=173)
def anchor_cohesion(c, p):
    """cp173: the cohesion of their home group."""
    return g(c, "cohesion", home(c, p))


@person("contribution", since=174)
def contribution(c, p):
    """cp174: scaled as a percentage of the total strength of all groups, rounded down (stated after
    cp160, so it governs; for the whole stream: cp176 makes missing numbers zero instead)."""
    s, t = c.v("scaled", p), c.s("total-strength")
    return fdiv(s * 100, t) if need(s, t) and t != 0 else None


@sheet("prime-group", since=175, show="rollup-prime-group")
def prime_group(c):
    """cp175: the name of the single strongest group."""
    order = _by_strength(c)
    return gname(c, order[0]) if order else None


# ---- reach span, balance, overall rank (cp177-cp180) -------------------------------------------

@person("reach-span", since=177)
def reach_span_v1(c, p):
    """cp177: their home group's strength plus its cohesion."""
    gid = home(c, p)
    st, co = g(c, "strength", gid), g(c, "cohesion", gid)
    return st + co if need(st, co) else None


@person("reach-span", since=180)
def reach_span_v2(c, p):
    """cp180: just their home group's strength."""
    return g(c, "strength", home(c, p))


@cell(G, "group-concept-balance", since=178)
def balance(c, gid):
    """cp178: strength minus cohesion multiplied by size."""
    s, co, n = g(c, "strength", gid), g(c, "cohesion", gid), g(c, "size", gid)
    return s - co * n if need(s, co) else None


@person("rank-global", since=179)
def rank_global(c, p):
    """cp179: their place across everyone on the sheet by scaled, highest first, ties by name. A
    sheet-wide people figure: held people are out of the ranking and show n/a."""
    pop = [q for q in c.counted() if c.v("scaled", q) is not None]
    order = sorted(pop, key=lambda q: (-c.v("scaled", q), c.name(q)))
    return order.index(p) + 1 if p in order else None

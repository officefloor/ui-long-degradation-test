"""The reference model's core: the world a fixture describes, the evaluation context, the concept
registry, and the cross-cutting rules every act builds on.

The requests in checkpoints.yaml ARE the definitions. A definition holds from the checkpoint that
sets it until a later checkpoint changes it, so every concept is registered as VERSIONS keyed by the
checkpoint from which each holds:

    @person('momentum', since=3)          # cp03: thrust + 2*drift
    def momentum_v1(c, p): ...
    @person('momentum', since=4)          # cp04: thrust + 3*drift
    def momentum_v2(c, p): ...

At checkpoint k the version with the largest `since <= k` is in force. A later act changes an earlier
concept by registering a newer version in its own module, never by editing the earlier one.

Kinds of entry (all versioned the same way):
- `person(name, since, show=...)`  a per-person value `fn(c, pid)`; shown in the row at
  `concept-<name>` unless `show` names another test id (raw cells: `show='person-alpha'`) or is None
  (an internal value no cell shows).
- `sheet(name, since, show=...)`   a sheet-wide value `fn(c)`; shown at `show` (e.g. 'rollup-leader').
- `family(prefix, since)`          a keyed set of sheet-wide items `fn(c) -> {suffix: value}` shown at
  `<prefix><suffix>` (e.g. 'band-count-' -> {'A': 1, ...}). Also used for per-person controls that
  live at page level ('person-advance-' -> {'7': ''}).
- `setting_default(group, key, since, value)`  the value a sheet uses for a setting it was not given.
- `control(test_id, since)`        what clicking a control does, `fn(session, suffix)` (session.py).
- `rows(prefix, since)`            a kind of keyed row other than people (Act III's groups):
  `fn(c) -> {row id: label}` in screen order, each row at `<prefix><id>` ('group-row-3');
  `cell(prefix, name, since, show=...)` a value inside such a row, `fn(c, row id)`, shown at test id
  `name` ('group-concept-strength') unless `show` says otherwise; read with `c.cell(prefix, name, id)`.

A value of None is "n/a". `show()` turns a value into the text the UI shows: None -> 'n/a', True/False
-> 'yes'/'no', ints as plain integers, strings as they are. An entry may return ABSENT to say that its
element is not on screen at all.

Cross-cutting rules live on the context (`Ctx`), so every concept gets them for free:
- per-sheet scoping: the top-level fixture is the default sheet; `sheets[]` entries are further
  sheets, each carrying any collection the top level can; person ids are per sheet.
- shared people (cp101+): `shares[]` puts a person of one sheet onto another under a new row id (a
  share without `sheetId` lands on the default sheet); raw
  values (and regions, history) are the one person's, links are per sheet, state per sheet from cp104.
- history with as-of (cp113+): alpha, beta and gamma are taken on the reference date (the as-of date
  when one is chosen, else the anchor; with no anchor every dated change counts).
- link `since` (cp116+): a patron or follow counts on the reference date only once it has started.
- the hold rule: from cp73 a held person is out of every sheet-wide figure (`counted`, `total`,
  `top`); from cp74 out of every patron/follow figure (`patrons`, `follows`); from cp76 sheet-wide
  totals count them at half, rounded down.
- inactive patrons (cp80+): a patron who is not active counts in nobody's patron figures (`patrons`);
  they are still listed among the person's patrons.
- negatives as zero (cp92+): in every sheet-wide total a negative value counts as zero, applied after
  the hold rule's half (`total`).
- followers too (cp100+): every figure over the people a person follows also counts the people who
  follow them, each person once (`follows`).
- rounding (cp160+): every figure that divides and rounds down rounds to the nearest instead, a half
  rounding up (`div`, `half`); a later request stating its own rounding governs its own figure.
- missing raw numbers (cp176+): a missing alpha .. zeta or score counts as zero for every figure
  (`raw`); n/a for other reasons (no patrons, the hold rule, no group, nothing to divide by) stays.
- top names (cp184+): every top name lists everyone level at the top (`top`; `single=True` for a later
  request that states its own tie-break).
- counts (cp188+): every count of people leaves out people whose momentum is 0 (`headcounted`).
- totals (cp212+, cp220+, cp232+): a held person counts in full in a breakdown total, per the sheet's
  `heldInTotals` choice (default half) elsewhere (`held_mode`); every total leaves out its single
  highest contribution, after the hold rule and negatives as zero (`total`).
- history covers grade and active (cp224+: `_raw`, `flag`, `grade`); a hold has a start date
  (cp228+: `held`, `holdFrom`); settings changes are dated (cp236+: `setting`, `settingsHistory`); a
  shared person's hold is per sheet (cp240+: `Row.hold`, `shares[].hold`); an as-of date belongs to
  its sheet (cp244+: the session's `as_of_by_sheet`).
- settings by checkpoint: `setting(group, key)` is the sheet's own value (once the checkpoint that made
  it settable is in force) or the default in force at k.
- n/a propagation (`need`) and floor division (`fdiv`).
"""
from __future__ import annotations

import copy
import datetime as _dt
import math
from dataclasses import dataclass, field

ABSENT = object()          # an element that is not on screen
DEFAULT_SHEET = ""         # the sheet the top-level fixture describes

# The checkpoints at which a cross-cutting rule switches on (definitions, not tuning knobs).
HOLD_SHEET_WIDE = 73       # held people leave sheet-wide figures
HOLD_LINKS = 74            # ... and patron/follow figures
HOLD_HALF_TOTALS = 76      # ... and count at half in sheet-wide totals
INACTIVE_PATRONS = 80      # an inactive patron counts in nobody's patron figures
NEGATIVE_AS_ZERO = 92      # a negative value counts as zero in every sheet-wide total
FOLLOWERS_TOO = 100        # follow figures also count the person's followers
ROUND_NEAREST = 160        # every "divide and round down" rounds to the nearest instead (halves up)
MISSING_AS_ZERO = 176      # a missing raw number counts as zero everywhere
TIES_LISTED = 184          # a top name lists everyone level at the top
COUNT_NONZERO = 188        # counts of people leave out people whose momentum is 0
PERCENT_COUNTED = 208      # a percentage is taken over the people who count only
BREAKDOWN_FULL = 212       # totals by region/tier/grade/state/quartile count a held person in full
DENSE_RANKS = 216          # ranks across the sheet are dense (ties share, the next follows on)
TRIM_TOP = 220             # every sheet-wide total leaves out its single highest contribution
HISTORY_GRADE_ACTIVE = 224 # history covers grade and active too
HOLD_FROM = 228            # a hold has a start date
HELD_TOTALS_CHOICE = 232   # each sheet chooses how held people count in totals
DATED_SETTINGS = 236       # settings changes are dated; the as-of view follows them
HOLD_PER_SHEET = 240       # a shared person's hold belongs to each sheet
AS_OF_PER_SHEET = 244      # an as-of date belongs to its sheet; each sheet reads history on its own date
# Act VI (cp251-300): the finale. Cross-cutting rules switch on (and one switches back off) here.
TRIM_BOTTOM = 252          # every sheet-wide total also leaves out its single lowest contribution
COUNT_DROP_SINK = 258      # every count of people also leaves out a SINK person (momentum < 0)
TRIM_BOTTOM_END = 300      # the lowest-contribution trim is reversed from here (back to cp220 only)
RAW_NUMBERS = ("alpha", "beta", "gamma", "delta", "epsilon", "zeta", "score")
RULE_BREAKS: set[int] = set()   # checkpoints where an act module's own cross-cutting rule switches on
SETTINGS_FROM = {"regionMultipliers": 81, "bandFrom": 82, "bandMultipliers": 82, "gradeWeights": 83,
                 "heldInTotals": 232}
SHARES_FROM = 101
STATE_PER_SHEET = 104
HISTORY_FROM = 113
LINK_SINCE = 116
HISTORY_FIELDS = ("alpha", "beta", "gamma")
HISTORY_FIELDS_LATER = ("grade", "active")      # dated from cp224
HELD_TOTALS_DEFAULT = "half"


class Ambiguous(Exception):
    """Raised when a figure depends on a choice no request states (an unstated tie-break): a correct
    app may show another value, so the assertion is a spec defect, reported as a mismatch."""


class Unmodelled(Exception):
    """Raised when an assertion needs a concept, test id or interaction the model does not know."""

    def __init__(self, what: str, detail: str = ""):
        super().__init__(f"{what}{': ' + detail if detail else ''}")
        self.what = what


# ---- small arithmetic helpers ------------------------------------------------------------------

def fdiv(a: int, b: int) -> int:
    """Integer division rounded down (Math.floor), so -7 / 2 is -4."""
    return math.floor(a / b) if isinstance(a, float) or isinstance(b, float) else a // b


def nearest(a: int, b: int) -> int:
    """a / b rounded to the nearest whole number, a half rounding up toward the larger number
    (Math.round: 2.5 -> 3, -2.5 -> -2)."""
    from fractions import Fraction
    return math.floor(Fraction(a, b) + Fraction(1, 2))


def need(*values) -> bool:
    """True when every input a concept needs is present (none is n/a)."""
    return all(v is not None for v in values)


def show(value) -> str:
    """The text a cell shows for a value."""
    if value is None:
        return "n/a"
    if value is True:
        return "yes"
    if value is False:
        return "no"
    return str(value)


def days_between(start: str, end: str) -> int:
    """Whole days from `start` to `end` (yyyy-mm-dd), negative when start is later."""
    return (_dt.date.fromisoformat(end[:10]) - _dt.date.fromisoformat(start[:10])).days


# ---- the registry ------------------------------------------------------------------------------

@dataclass
class _Version:
    since: int
    fn: object
    show: str | None


class Registry:
    """Versioned concepts, sheet figures, keyed families and setting defaults."""

    def __init__(self):
        self.person_concepts: dict[str, list[_Version]] = {}
        self.sheet_figures: dict[str, list[_Version]] = {}
        self.families: dict[str, list[_Version]] = {}
        self.controls: dict[str, list[_Version]] = {}
        self.defaults: dict[tuple[str, str], list[tuple[int, object]]] = {}
        self.row_kinds: dict[str, list[_Version]] = {}            # 'group-row-' -> fn(c) -> {id: label}
        self.row_cells: dict[tuple[str, str], list[_Version]] = {}  # (row prefix, name) -> fn(c, id)
        self.covered_through = 0      # set by _load_acts from the act modules' COVERAGE

    @staticmethod
    def _add(table, name, since, fn, show_id):
        versions = table.setdefault(name, [])
        if any(v.since == since for v in versions):
            raise ValueError(f"{name} already has a version from cp{since:02d}")
        versions.append(_Version(since, fn, show_id))
        versions.sort(key=lambda v: v.since)

    @staticmethod
    def _at(versions, k):
        live = [v for v in versions or [] if v.since <= k]
        return live[-1] if live else None

    def person(self, name: str, since: int, show: str | None = ""):
        """Register a per-person concept version (see module docstring)."""
        def deco(fn):
            self._add(self.person_concepts, name, since, fn,
                      f"concept-{name}" if show == "" else show)
            return fn
        return deco

    def sheet(self, name: str, since: int, show: str | None = None):
        """Register a sheet-wide figure version, shown at test id `show` (None: internal)."""
        def deco(fn):
            self._add(self.sheet_figures, name, since, fn, show)
            return fn
        return deco

    def family(self, prefix: str, since: int):
        """Register a keyed family of page-level items `<prefix><suffix>`."""
        def deco(fn):
            self._add(self.families, prefix, since, fn, prefix)
            return fn
        return deco

    def control(self, test_id: str, since: int):
        """Register what clicking a control does, `fn(session, suffix)`. `test_id` is the exact id
        ('sheet-load') or a prefix ending in '-' for a per-row control ('person-advance-'); the
        suffix is what follows the prefix ('' for an exact id)."""
        def deco(fn):
            self._add(self.controls, test_id, since, fn, test_id)
            return fn
        return deco

    def rows(self, prefix: str, since: int):
        """Register a kind of keyed row other than people (Act III's groups): `fn(c) -> {row id:
        label}` in screen order, each row shown at `<prefix><id>` (e.g. 'group-row-3'), its label
        being the row's text for a text filter. Values inside it are registered with `cell`."""
        def deco(fn):
            self._add(self.row_kinds, prefix, since, fn, prefix)
            return fn
        return deco

    def cell(self, prefix: str, name: str, since: int, show: str | None = ""):
        """Register a value inside rows of kind `prefix`, `fn(c, row id)`, shown at test id `show`
        (default: `name` itself, e.g. 'group-concept-strength'; None: internal). Read it from
        other entries with `c.cell(prefix, name, row id)`."""
        def deco(fn):
            self._add(self.row_cells, (prefix, name), since, fn, name if show == "" else show)
            return fn
        return deco

    def kind_cells(self, k) -> dict[str, dict[str, str]]:
        """{row prefix: {test id inside such a row: cell name}} for every keyed row kind live at k."""
        out = {p: {} for p, vs in self.row_kinds.items() if self._at(vs, k)}
        for (prefix, name), versions in self.row_cells.items():
            v = self._at(versions, k)
            if v and v.show and prefix in out:
                out[prefix][v.show] = name
        return out

    def control_at(self, tid: str, k: int):
        """(handler, suffix) for clicking `tid` at k, or None."""
        if tid in self.controls:
            v = self._at(self.controls[tid], k)
            return (v.fn, "") if v else None
        for prefix in sorted(self.controls, key=len, reverse=True):
            if prefix.endswith("-") and tid.startswith(prefix):
                v = self._at(self.controls[prefix], k)
                return (v.fn, tid[len(prefix):]) if v else None
        return None

    def setting_default(self, group: str, key: str, since: int, value) -> None:
        """The value a sheet uses for setting group.key when it has none of its own, from `since`."""
        self.defaults.setdefault((group, key), []).append((since, value))
        self.defaults[(group, key)].sort(key=lambda t: t[0])

    # lookups at checkpoint k
    def person_version(self, name, k):
        return self._at(self.person_concepts.get(name), k)

    def sheet_version(self, name, k):
        return self._at(self.sheet_figures.get(name), k)

    def default_at(self, group, key, k):
        live = [v for s, v in self.defaults.get((group, key), []) if s <= k]
        if not live:
            raise Unmodelled(f"setting {group}.{key}", f"no default at cp{k:02d}")
        return live[-1]

    def person_cells(self, k) -> dict[str, str]:
        """{test id inside a row: concept name} for every per-person cell shown at k."""
        out = {}
        for name, versions in self.person_concepts.items():
            v = self._at(versions, k)
            if v and v.show:
                out[v.show] = name
        return out

    def page_items(self, k) -> dict[str, str]:
        """{page-level test id: sheet figure name} shown at k."""
        out = {}
        for name, versions in self.sheet_figures.items():
            v = self._at(versions, k)
            if v and v.show:
                out[v.show] = name
        return out

    def family_prefixes(self, k) -> list[str]:
        return sorted((p for p, vs in self.families.items() if self._at(vs, k)), key=len, reverse=True)

    def breakpoints(self) -> set[int]:
        """Every checkpoint at which some definition changes: the model's output can differ only
        between two consecutive breakpoints, so checking one k per interval checks them all."""
        out = {1}
        for table in (self.person_concepts, self.sheet_figures, self.families, self.controls,
                      self.row_kinds, self.row_cells):
            for versions in table.values():
                out |= {v.since for v in versions}
        for versions in self.defaults.values():
            out |= {s for s, _ in versions}
        out.add(self.covered_through + 1)
        out |= {HOLD_SHEET_WIDE, HOLD_LINKS, HOLD_HALF_TOTALS, INACTIVE_PATRONS, NEGATIVE_AS_ZERO,
                FOLLOWERS_TOO, ROUND_NEAREST, MISSING_AS_ZERO, SHARES_FROM, STATE_PER_SHEET,
                TIES_LISTED, COUNT_NONZERO, PERCENT_COUNTED, BREAKDOWN_FULL, DENSE_RANKS, TRIM_TOP,
                HISTORY_GRADE_ACTIVE, HOLD_FROM, HELD_TOTALS_CHOICE, DATED_SETTINGS, HOLD_PER_SHEET,
                AS_OF_PER_SHEET, TRIM_BOTTOM, COUNT_DROP_SINK, TRIM_BOTTOM_END,
                HISTORY_FROM, LINK_SINCE, *SETTINGS_FROM.values(), *RULE_BREAKS}
        return out

    def known_test_ids(self) -> set[str]:
        """Every test id (or family prefix) any version shows, at any checkpoint."""
        out = set()
        for table in (self.person_concepts, self.sheet_figures, self.row_cells):
            for versions in table.values():
                out |= {v.show for v in versions if v.show}
        return out | set(self.families) | set(self.row_kinds)


REGISTRY = Registry()
person = REGISTRY.person
sheet = REGISTRY.sheet
family = REGISTRY.family
control = REGISTRY.control
setting_default = REGISTRY.setting_default
rows = REGISTRY.rows
cell = REGISTRY.cell


# ---- the world a fixture describes -------------------------------------------------------------

@dataclass
class Person:
    """One person's own values, shared by every sheet they are on."""
    record: dict                                  # the seeded people[] row (raw values, flags)
    regions: list[str] = field(default_factory=list)
    notes: list[int] = field(default_factory=list)
    history: list[dict] = field(default_factory=list)   # {field, value, from}
    home: str = DEFAULT_SHEET


@dataclass
class Row:
    """A person as they appear on one sheet."""
    id: object
    person: Person
    shared: bool = False
    state: str | None = None     # this sheet's own state (shared rows from cp104)
    hold: bool = False           # this sheet's own hold (shared rows from cp240)
    hold_from: str | None = None # ... and its start date (cp228)


@dataclass
class Sheet:
    id: str
    rows: dict = field(default_factory=dict)        # row id -> Row, in seed order
    patrons: list[dict] = field(default_factory=list)   # {personId, patronId, since?}
    follows: list[dict] = field(default_factory=list)   # {from, to, since?}
    allies: list[dict] = field(default_factory=list)    # {a, b}
    settings: dict = field(default_factory=dict)
    settings_history: list[dict] = field(default_factory=list)   # {from, settings} (cp236)
    anchor: str | None = None
    extra: dict = field(default_factory=dict)            # collections no act models yet


_PERSON_LINKED = ("regions", "notes", "history")
_SHEET_KEYS = ("people", "patrons", "follows", "allies", "settings", "settingsHistory", "anchor",
               "id") + _PERSON_LINKED


def _merge_settings(into: dict, values: dict) -> None:
    """Merge seeded or saved settings: a group of keyed values (regionMultipliers ...) or a single
    value (heldInTotals, cp232)."""
    for group, v in (values or {}).items():
        if isinstance(v, dict):
            into.setdefault(group, {}).update(v)
        else:
            into[group] = v


class World:
    """Every sheet a fixture seeds, as one mutable store (the session's database)."""

    def __init__(self, fixture: dict):
        fixture = copy.deepcopy(fixture or {})
        self.sheets: dict[str, Sheet] = {}
        self.anchor = fixture.get("anchor")
        self._load_sheet(DEFAULT_SHEET, fixture)
        for s in fixture.get("sheets") or []:
            self._load_sheet(str(s.get("id")), s)
        for sh in fixture.get("shares") or []:
            # a share without `sheetId` lands on the default sheet (the standing identity probe)
            sid = str(sh["sheetId"]) if sh.get("sheetId") is not None else DEFAULT_SHEET
            row = self.share(sid, sh["personId"], str(sh["fromSheetId"]),
                             sh["fromPersonId"], sh.get("state"))
            row.hold, row.hold_from = bool(sh.get("hold")), sh.get("holdFrom")

    def _load_sheet(self, sid: str, src: dict) -> None:
        sh = self.sheets.setdefault(sid, Sheet(sid))
        sh.anchor = src.get("anchor", sh.anchor)
        for rec in src.get("people") or []:
            p = Person(dict(rec), home=sid)
            if rec.get("region") is not None:           # cp37's single region, a one-row list later
                p.regions.append(rec["region"])
            sh.rows[rec["id"]] = Row(rec["id"], p)
            if rec.get("patronId") is not None:          # cp09's single patron, a patrons row later
                sh.patrons.append({"personId": rec["id"], "patronId": rec["patronId"]})
        for r in src.get("regions") or []:
            # a person is in a region or not: a region also given by the old single `region` field
            # (cp37) is the same membership, not a second one
            if r["personId"] in sh.rows and r["region"] not in sh.rows[r["personId"]].person.regions:
                sh.rows[r["personId"]].person.regions.append(r["region"])
        for n in src.get("notes") or []:
            if n["personId"] in sh.rows:
                sh.rows[n["personId"]].person.notes.append(n["score"])
        for h in src.get("history") or []:
            if h["personId"] in sh.rows:
                sh.rows[h["personId"]].person.history.append(
                    {"field": h["field"], "value": h["value"], "from": h.get("from")})
        sh.patrons += [dict(x) for x in src.get("patrons") or []]
        sh.follows += [dict(x) for x in src.get("follows") or []]
        sh.allies += [dict(x) for x in src.get("allies") or []]
        if src.get("settings"):
            _merge_settings(sh.settings, src["settings"])
        for entry in src.get("settingsHistory") or []:
            sh.settings_history.append({"from": entry.get("from"), "settings": copy.deepcopy(entry.get("settings") or {})})
        for key, value in src.items():
            if key not in _SHEET_KEYS and key not in ("sheets", "shares"):
                sh.extra[key] = copy.deepcopy(value)

    def sheet(self, sid: str, create: bool = False) -> Sheet | None:
        if sid not in self.sheets and create:
            self.sheets[sid] = Sheet(sid)
        return self.sheets.get(sid)

    def share(self, sid: str, row_id, from_sid: str, from_id, state: str | None = None) -> Row:
        """Put person `from_id` of sheet `from_sid` onto sheet `sid` as row `row_id`."""
        src = self.sheets[from_sid].rows[from_id]
        row = Row(row_id, src.person, shared=True, state=state)
        self.sheet(sid, create=True).rows[row_id] = row
        return row


# ---- the evaluation context --------------------------------------------------------------------

class Ctx:
    """Evaluation of one sheet of a world at checkpoint k, optionally as of a date.

    Concepts read everything through this object: `c.v(name, pid)` for another person concept,
    `c.s(name)` for a sheet figure, `c.raw(pid, field)` for a raw value, and the rule helpers below.
    Values are memoised per context, so a context is built per evaluation and thrown away."""

    def __init__(self, world: World, k: int, sheet: str | None = None, as_of: str | None = None,
                 registry: Registry = REGISTRY, flags: dict | None = None):
        self.world, self.k, self.registry = world, k, registry
        self.sheet_id = DEFAULT_SHEET if sheet is None else sheet
        self.sh = world.sheet(self.sheet_id) or Sheet(self.sheet_id)
        self.as_of = as_of
        self.flags = flags or {}          # UI state a figure may show (an error banner, a form value)
        self._memo: dict = {}

    # -- navigation
    @property
    def ids(self) -> list:
        """Row ids on this sheet, in seed order."""
        return list(self.sh.rows)

    def row(self, pid) -> Row:
        return self.sh.rows[pid]

    def rec(self, pid) -> dict:
        """The person's own (shared) record."""
        return self.sh.rows[pid].person.record

    def name(self, pid) -> str:
        return self.rec(pid).get("name")

    @property
    def anchor(self) -> str | None:
        """The open sheet's own anchor (cp25: each sheet has the anchor date set for it). A named sheet
        does not borrow the top-level fixture's anchor: no request says it would, so a test that
        needs one on a named sheet seeds it there."""
        return self.sh.anchor

    @property
    def ref_date(self) -> str | None:
        """The date history and link starts are read on: the as-of date, else the anchor."""
        return self.as_of or self.anchor

    def at(self, as_of: str | None) -> "Ctx":
        """The same sheet as of another date (None: the current figures)."""
        return Ctx(self.world, self.k, self.sheet_id, as_of, self.registry, self.flags)

    # -- values
    def v(self, name: str, pid):
        """Person concept `name` for row `pid` (None = n/a)."""
        key = ("p", name, pid)
        if key not in self._memo:
            ver = self.registry.person_version(name, self.k)
            if ver is None:
                raise Unmodelled(f"concept {name}", f"not defined at cp{self.k:02d}")
            self._memo[key] = _CYCLE
            self._memo[key] = ver.fn(self, pid)
        elif self._memo[key] is _CYCLE:
            raise RecursionError(f"concept {name} depends on itself")
        return self._memo[key]

    def s(self, name: str):
        """Sheet-wide figure `name`."""
        key = ("s", name)
        if key not in self._memo:
            ver = self.registry.sheet_version(name, self.k)
            if ver is None:
                raise Unmodelled(f"figure {name}", f"not defined at cp{self.k:02d}")
            self._memo[key] = ver.fn(self)
        return self._memo[key]

    def cell(self, prefix: str, name: str, rid):
        """Value `name` of the keyed row `<prefix><rid>` (a group's strength: c.cell('group-row-',
        'group-concept-strength', gid)), None = n/a."""
        key = ("c", prefix, name, rid)
        if key not in self._memo:
            ver = Registry._at(self.registry.row_cells.get((prefix, name)), self.k)
            if ver is None:
                raise Unmodelled(f"{prefix}* {name}", f"not defined at cp{self.k:02d}")
            self._memo[key] = _CYCLE
            self._memo[key] = ver.fn(self, rid)
        elif self._memo[key] is _CYCLE:
            raise RecursionError(f"{prefix}* {name} depends on itself")
        return self._memo[key]

    def raw(self, pid, fld: str, entered: bool = False):
        """A raw value. alpha/beta/gamma follow the person's history on the reference date from
        cp113: the latest change dated on or before it (a same-day later entry replaces an earlier
        one), else the starting value; with no reference date every dated change counts. From cp176
        a missing raw number (alpha .. zeta, score) counts as zero for every figure; `entered=True`
        gives the value as entered (the number's own cell, which still shows it as missing)."""
        value = self._raw(pid, fld)
        if value is None and not entered and self.k >= MISSING_AS_ZERO and fld in RAW_NUMBERS:
            return 0
        return value

    def _raw(self, pid, fld: str):
        p = self.sh.rows[pid].person
        value = p.record.get(fld)
        dated = HISTORY_FIELDS + (HISTORY_FIELDS_LATER if self.k >= HISTORY_GRADE_ACTIVE else ())
        if self.k >= HISTORY_FROM and fld in dated and p.history:
            ref = self.ref_date
            best = None
            for i, h in enumerate(p.history):
                if h["field"] != fld:
                    continue
                when = h.get("from")
                if ref is not None and when is not None and when > ref:
                    continue
                if best is None or (when or "") >= (best[0] or ""):
                    best = (when, i, h["value"])
            if best is not None:
                value = best[2]
        return value

    def flag(self, pid, fld: str, default=None):
        """A person's own non-numeric value with its default (active defaults to true). Grade and
        active follow the person's history on the reference date from cp224."""
        v = self._raw(pid, fld)
        return default if v is None else v

    def grade(self, pid):
        """The person's grade on the reference date (dated from cp224), None with none."""
        return self._raw(pid, "grade") or None

    def state(self, pid) -> str:
        """The person's state on this sheet: per sheet for shared rows from cp104."""
        row = self.sh.rows[pid]
        if self.k >= STATE_PER_SHEET and row.shared:
            return row.state or "DRAFT"
        return row.person.record.get("state") or "DRAFT"

    # -- the hold rule
    def held(self, pid) -> bool:
        """On hold on this sheet on the reference date: the person's hold (cp73); from cp228 only once
        its start date (`holdFrom`) is on or before the reference date (no start date, or no
        reference date: held); from cp240 a shared row carries this sheet's own hold."""
        if self.k < HOLD_SHEET_WIDE:
            return False
        row = self.sh.rows[pid]
        if self.k >= HOLD_PER_SHEET and row.shared:
            on, start = row.hold, row.hold_from
        else:
            on, start = bool(row.person.record.get("hold")), row.person.record.get("holdFrom")
        if not on:
            return False
        if self.k >= HOLD_FROM and start is not None and self.ref_date is not None:
            return start <= self.ref_date
        return True

    def counted(self) -> list:
        """The people who count for sheet-wide figures (everyone not on hold, from cp73)."""
        return [p for p in self.ids if not self.held(p)]

    def headcounted(self) -> list:
        """The people every count of people takes (cp188): the counted people, leaving out from cp188
        anyone whose momentum is 0, and from cp258 anyone whose momentum is negative (a SINK person).
        Ranks, averages, middle values and totals still use counted()."""
        out = self.counted()
        if self.k >= COUNT_NONZERO:
            out = [p for p in out if self.v("momentum", p) != 0]
        if self.k >= COUNT_DROP_SINK:
            out = [p for p in out if (self.v("momentum", p) or 0) >= 0]
        return out

    def held_mode(self, breakdown: bool = False) -> str:
        """How a held person counts in a sheet-wide total: 'out' (cp73-75), 'half' (cp76), in full in
        the totals broken down by region, tier, grade, state or quartile (cp212), and from cp232 the
        sheet's own choice for every other total (heldInTotals: out, half or full; default half)."""
        if self.k < HOLD_HALF_TOTALS:
            return "out"
        if breakdown and self.k >= BREAKDOWN_FULL:
            return "full"
        if self.k >= HELD_TOTALS_CHOICE:
            return self.setting("heldInTotals", None) or HELD_TOTALS_DEFAULT
        return "half"

    def total(self, name: str, where=None, breakdown: bool = False) -> int:
        """A sheet-wide total of person concept `name` (one value per person), skipping n/a, in this
        order: (1) a held person per held_mode (left out, half rounded as the held half, or full);
        (2) a negative value counts as zero (cp92+); (3) from cp220 the single highest of the
        resulting contributions is left out (one of them when several are level; the sum is the same
        either way); (4) from cp252 the single lowest of what then remains is left out too (one when
        several are level), until cp300 reverses that and only the highest is left out again.
        `breakdown` marks a total for one region, tier, grade, state or quartile.
        Totals of group figures, percentages' wholes and averages' sums are not sheet-wide totals."""
        parts = []
        for p in self.ids:
            if where is not None and not where(p):
                continue
            val = self.v(name, p)
            if val is None:
                continue
            if self.held(p):
                mode = self.held_mode(breakdown)
                if mode == "out":
                    continue
                if mode == "half":
                    val = self.half(val)
            if self.k >= NEGATIVE_AS_ZERO and val < 0:
                val = 0
            parts.append(val)
        if self.k >= TRIM_TOP and parts:
            parts.remove(max(parts))
        if TRIM_BOTTOM <= self.k < TRIM_BOTTOM_END and parts:
            parts.remove(min(parts))
        return sum(parts)

    def half(self, val: int) -> int:
        """A held person's value in a total: half, rounded down (cp76); to the nearest from cp160."""
        return self.div(val, 2)

    def div(self, a: int, b: int) -> int:
        """A figure that divides and rounds down (every "rounded down" a request before cp160 states,
        and the held half): from cp160 it rounds to the nearest whole number, a half rounding up
        (2.5 -> 3, -2.5 -> -2). A request after cp160 that states its own rounding for its own figure
        governs that figure instead (it calls fdiv or nearest directly)."""
        return nearest(a, b) if self.k >= ROUND_NEAREST else fdiv(a, b)

    def top(self, name: str, where=None, single: bool = False):
        """The name of the counted person with the highest `name`, or None when nobody's value can be
        worked out. Before cp184 ties go to the name first alphabetically; from cp184 everyone level at
        the top is named, joined by ', ' in name order (`single=True`: a later request that states its
        own tie-break by name). `where(pid)` narrows the people considered."""
        cand = [p for p in self.counted() if self.v(name, p) is not None
                and (where is None or where(p))]
        if not cand:
            return None
        best = max(self.v(name, p) for p in cand)
        names = sorted(self.name(p) for p in cand if self.v(name, p) == best)
        if self.k >= TIES_LISTED and not single:
            return ", ".join(names)
        return names[0]

    # -- links
    def _link_ok(self, link: dict) -> bool:
        if self.k < LINK_SINCE or link.get("since") is None:
            return True
        ref = self.ref_date
        return ref is None or link["since"] <= ref

    def _linked_ok(self, other) -> bool:
        return other in self.sh.rows and not (self.k >= HOLD_LINKS and self.held(other))

    def patron_links(self, pid) -> list:
        """Every patron of `pid` on this sheet, whatever its date or hold (the listed names)."""
        return [l["patronId"] for l in self.sh.patrons if l["personId"] == pid and l["patronId"] in self.sh.rows]

    def patrons(self, pid) -> list:
        """The patrons that count for `pid`'s figures (backing, clout, flux, vector and every later
        patron figure): not held (cp74), active (cp80), started (cp116). With none left the person
        is treated as having no patrons."""
        return [l["patronId"] for l in self.sh.patrons
                if l["personId"] == pid and self._link_ok(l) and self._linked_ok(l["patronId"])
                and not (self.k >= INACTIVE_PATRONS and not self.flag(l["patronId"], "active", True))]

    def follow_links(self, pid) -> list:
        return [l["to"] for l in self.sh.follows if l["from"] == pid and l["to"] in self.sh.rows]

    def follows(self, pid) -> list:
        """The people who count for `pid`'s follow figures (synergy, tide and every later figure
        over the people a person follows): the people they follow and, from cp100, also the people
        who follow them, each person once; not held (cp74), started (cp116). The listed follows
        (`follow_links`, the allies cell and its count) are unchanged."""
        out = [l["to"] for l in self.sh.follows
               if l["from"] == pid and self._link_ok(l) and self._linked_ok(l["to"])]
        if self.k >= FOLLOWERS_TOO:
            out += [l["from"] for l in self.sh.follows
                    if l["to"] == pid and self._link_ok(l) and self._linked_ok(l["from"])]
        return [q for q in dict.fromkeys(out) if q != pid]

    def ally_links(self, pid) -> list:
        """Symmetric allies (cp41): everyone linked to `pid` either way."""
        out = []
        for l in self.sh.allies:
            if l["a"] == pid and l["b"] in self.sh.rows:
                out.append(l["b"])
            elif l["b"] == pid and l["a"] in self.sh.rows:
                out.append(l["a"])
        return list(dict.fromkeys(out))

    def regions(self, pid) -> list[str]:
        return sorted(self.sh.rows[pid].person.regions)

    def names(self, pids) -> str:
        """Names joined by comma and space, sorted ascending (the list cells)."""
        return ", ".join(sorted(self.name(p) for p in pids))

    # -- settings
    def setting(self, group: str, key):
        """The sheet's own value for a setting once it is settable, else the default at k. From cp236
        a dated settings change counts from its date: on the reference date the latest change dated on
        or before it that names the setting wins (with no reference date every dated change counts),
        else the undated value. `key` None reads a single-valued setting (heldInTotals)."""
        if self.k >= DATED_SETTINGS and self.sh.settings_history:
            ref = self.ref_date
            best = None
            for i, h in enumerate(self.sh.settings_history):
                when = h.get("from")
                if ref is not None and when is not None and when > ref:
                    continue
                v = h["settings"].get(group)
                if key is not None:
                    v = v.get(key) if isinstance(v, dict) else None
                if v is None:
                    continue
                if best is None or (when or "") >= (best[0] or ""):
                    best = (when, i, v)
            if best is not None and self.k >= SETTINGS_FROM.get(group, 10 ** 6):
                return best[2]
        own = self.sh.settings.get(group)
        if key is not None:
            own = (own or {}).get(key) if isinstance(own, dict) else None
        if self.k >= SETTINGS_FROM.get(group, 10 ** 6) and own is not None:
            return own
        return self.registry.default_at(group, key, self.k)


_CYCLE = object()


# ---- evaluation --------------------------------------------------------------------------------

class View:
    """What the screen shows for one sheet at checkpoint k, computed lazily per test id path.

    A path is a tuple of test ids from the page down: ('person-row-3', 'concept-tide') or
    ('rollup-total-load',). `text(path)` is the shown text, ABSENT when that element is not on
    screen; it raises Unmodelled for a test id no registered entry shows."""

    ROW = "person-row-"

    def __init__(self, ctx: Ctx):
        self.c = ctx
        self.cells = ctx.registry.person_cells(ctx.k)
        self.items = ctx.registry.page_items(ctx.k)
        self.prefixes = ctx.registry.family_prefixes(ctx.k)
        self._fam: dict[str, dict] = {}
        self.kinds = ctx.registry.kind_cells(ctx.k)      # keyed rows other than people
        self._kind_rows: dict[str, dict] = {}

    def _rows_of(self, prefix) -> dict:
        """{row id: label} of a keyed row kind, in screen order."""
        if prefix not in self._kind_rows:
            ver = Registry._at(self.c.registry.row_kinds[prefix], self.c.k)
            self._kind_rows[prefix] = dict(ver.fn(self.c))
        return self._kind_rows[prefix]

    def kind_row(self, tid: str):
        """(prefix, row id) for a `<prefix><id>` test id of a live keyed row kind with that row,
        (prefix, None) when the kind is live but has no such row, else None."""
        for prefix in sorted(self.kinds, key=len, reverse=True):
            if tid.startswith(prefix):
                want = tid[len(prefix):]
                for rid in self._rows_of(prefix):
                    if str(rid) == want:
                        return prefix, rid
                return prefix, None
        return None

    def _family(self, prefix):
        if prefix not in self._fam:
            ver = Registry._at(self.c.registry.families[prefix], self.c.k)
            self._fam[prefix] = {f"{prefix}{k}": v for k, v in ver.fn(self.c).items()}
        return self._fam[prefix]

    def _known_elsewhere(self, tid: str) -> bool:
        """A test id some other checkpoint shows (not yet introduced, or retired): not on screen."""
        known = self.c.registry.known_test_ids()
        return tid in known or any(k.endswith("-") and tid.startswith(k) for k in known)

    def row_id(self, tid: str):
        """The row id a `person-row-<id>` test id names, or None when no row on the sheet has it."""
        if not tid.startswith(self.ROW):
            return None
        want = tid[len(self.ROW):]
        for pid in self.c.ids:
            if str(pid) == want:
                return pid
        return None

    def children(self, path: tuple) -> list[str]:
        """Test ids directly inside `path` that are on screen (for regex locators and counts)."""
        if not path:
            out = [f"{self.ROW}{p}" for p in self.c.ids]
            out += [t for t in self.items if self._shown((t,))]
            for prefix in self.prefixes:
                out += [t for t, v in self._family(prefix).items() if v is not ABSENT]
            for prefix in self.kinds:
                out += [f"{prefix}{r}" for r in self._rows_of(prefix)]
            return out
        if len(path) == 1 and self.row_id(path[0]) is not None:
            return [t for t in self.cells if self._shown(path + (t,))]
        if len(path) == 1 and (self.kind_row(path[0]) or (None, None))[1] is not None:
            prefix = self.kind_row(path[0])[0]
            return [t for t in self.kinds[prefix] if self._shown(path + (t,))]
        return []

    def _shown(self, path: tuple) -> bool:
        """On screen, for listing purposes: an item the model cannot compute is left out of a
        listing (a regex locator over rows must not fail on an unrelated unmodelled figure)."""
        try:
            return self.text(path) is not ABSENT
        except Unmodelled:
            return False
        except Ambiguous:      # on screen, whatever it shows; only a test reading it is at fault
            return True

    def text(self, path: tuple):
        if len(path) == 1:
            tid = path[0]
            if tid.startswith(self.ROW):
                pid = self.row_id(tid)
                return ABSENT if pid is None else self.c.name(pid)
            kr = self.kind_row(tid)
            if kr is not None:
                return ABSENT if kr[1] is None else show(self._rows_of(kr[0])[kr[1]])
            if tid in self.items:
                val = self.c.s(self.items[tid])
                return val if val is ABSENT else show(val)
            for prefix in self.prefixes:
                if tid.startswith(prefix):
                    val = self._family(prefix).get(tid, ABSENT)
                    return val if val is ABSENT else show(val)
            if self._known_elsewhere(tid):
                return ABSENT
            raise Unmodelled(_concept_of(tid), f"page item {tid} at cp{self.c.k:02d}")
        if len(path) == 2:
            kr = self.kind_row(path[0])
            if kr is not None:                       # a keyed row other than a person's
                prefix, rid = kr
                if rid is None:
                    return ABSENT
                if path[1] not in self.kinds[prefix]:
                    if self._known_elsewhere(path[1]):
                        return ABSENT
                    raise Unmodelled(_concept_of(path[1]), f"{prefix}* cell {path[1]} at cp{self.c.k:02d}")
                val = self.c.cell(prefix, self.kinds[prefix][path[1]], rid)
                return val if val is ABSENT else show(val)
            pid = self.row_id(path[0])
            if pid is None:
                if path[0].startswith(self.ROW):
                    return ABSENT
                raise Unmodelled(_concept_of(path[0]), f"{path[0]} holds no cells")
            if path[1] not in self.cells:
                if self._known_elsewhere(path[1]):
                    return ABSENT
                raise Unmodelled(_concept_of(path[1]), f"row cell {path[1]} at cp{self.c.k:02d}")
            val = self.c.v(self.cells[path[1]], pid)
            return val if val is ABSENT else show(val)
        raise Unmodelled("nested test id", "/".join(path))


def _concept_of(tid: str) -> str:
    """The concept a test id belongs to, for grouping unmodelled reports: a numbered or keyed
    family (`group-row-3`, `band-count-E`) is one concept."""
    import re
    return re.sub(r"-(\d+|[A-Z][A-Za-z0-9]{0,2})$", "-*", tid)


def evaluate(fixture: dict, k: int, sheet: str | None = None, as_of: str | None = None,
             registry: Registry = REGISTRY) -> dict:
    """{test id path: shown text} for every row cell and page item the model knows at k, on the
    given sheet (None: the default sheet) as of the given date (None: current figures). An entry
    the model cannot compute is left out; use `View` for lazy, per-path evaluation with reasons."""
    _load_acts()
    view = View(Ctx(World(fixture), k, sheet, as_of, registry))
    out = {}
    for tid in view.children(()):
        try:
            t = view.text((tid,))
        except (Unmodelled, Ambiguous):
            continue
        if t is not ABSENT:
            out[(tid,)] = t
        if tid.startswith(View.ROW):
            for cell in view.cells:
                try:
                    t = view.text((tid, cell))
                except (Unmodelled, Ambiguous):
                    continue
                if t is not ABSENT:
                    out[(tid, cell)] = t
    return out


_LOADED = False


def _load_acts() -> None:
    """Import the stream's reference-model module once, so its registrations are in REGISTRY, and
    record how far the model vouches for its figures (`COVERAGE[1]`). This branch loads the
    restructured early-overload stream (`overload`, cp1-250); the canonical 300-stream on `main`
    loads act1..act6."""
    global _LOADED
    if not _LOADED:
        from . import overload  # registration side effects (restructured early-overload stream)
        REGISTRY.covered_through = overload.COVERAGE[1]
        _LOADED = True

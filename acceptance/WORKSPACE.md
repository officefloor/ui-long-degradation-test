# The worksheet stream, design

> **Early-overload stream:** the stream on `main` is **overloaded early** — a compressed spine, the hub `keel` at cp9, and the cross-cutting rules front-loaded to cp4–20 — and Act VI is removed, leaving **250 checkpoints**. Requests, specs and ripple copies are generated from the reference model by `harness/stream_build.py`. The earlier back-loaded 300-checkpoint stream is in git history (856889f). See [docs/EARLY_OVERLOAD_DESIGN.md](../docs/EARLY_OVERLOAD_DESIGN.md). The text below describes the canonical method, most of which still applies.


The authoring reference for `checkpoints.yaml` and `acceptance/specs`. The agent never sees this
file. It sees only one request and its one test at a time, plus the harness's `AGENTS.md`. This file
is the specification every checkpoint is written against. The stable `data-testid` contract is in
`support/README.md`, and the full concept chain is in `support/ACT_AUTHORING_BRIEF.md`.

## 1. The point

The problem is deliberately meaningless, so the agent cannot lean on domain knowledge, and the
problem is concentrated, so the solution must be too. All 250 requests pile complexity onto one
screen and a small set of arbitrary entities. There are no invoices, clients, products or any real
domain. There are people with arbitrary names carrying arbitrary values, named concepts computed
from those values and from each other, and relationships between people. The question is how an
architecture copes with concentrated, interwoven complexity. Where it puts it, whether that
placement still allows change, where it breaks, and how it behaves once it has broken.

- One screen at `/`. No request adds a page, a route or a navigation entry. Every request makes this
  screen, and the few handlers behind it, do more.
- Arbitrary entities. A person and the relationships between people. A new concept is a value, a
  rule or a relationship on what already exists, never a fourth thing with a screen of its own.
- The complexity only climbs. Every addition adds a rule that interacts with what is already there.
- Every fourth request mutates a rule or algorithm already in place.
- At least three concentrated algorithms per act (section 5).
- Overstress early. Act I builds and loads the spine. There is no gentle breadth act.

Do not hold back. The stream exists to break the architecture and show the degradation. Prefer
requests where one value a person carries, once changed, re-runs several interacting concepts at
once, because a concept is built on other concepts and on aggregates over the relationships. Avoid
requests that an isolated endpoint or component could satisfy without touching the shared concept
pipeline. Each new rule changes the result of at least one existing concept in the same test, and
the test asserts the combined figure.

## 2. Structure

| act | checkpoints | theme |
|---|---|---|
| I | 1–60 | the concept spine. raw values, concepts on concepts, the first relationship and its migrations |
| II | 61–120 | a second raw axis fused with the spine, and aggregations over the relationships |
| III | 121–180 | a groups entity, many-to-many membership, and per-group and per-member concepts |
| IV | 181–240 | reporting, rollups and rankings over the whole spine |
| V | 241–250 | consistency sweeps that compose the spine, and two reversals that undo earlier decisions |
| VI | 251–300 | the finale, 1:1 cadence. **Deep layer (251–260):** a second-order chain (fathom → cascade → ripple → ballast → keystone) on norm/scaled (depth ~17), a rivals relationship migrating twice (directed → mutual → one), two cross-cutting rules (trim the lowest off every total, drop SINK people from every count). **Hub layer (261–280):** a central `keel` read by 53 concepts, redefined at cp262/cp280 so one change moves the whole battery (a god-sized hub). **Post-peak (281–300):** changes keep landing on the concentrated hub — `keel` redefined again (cp282), every gauge globally rounded (cp288), the lowest-contribution trim reversed (cp300) |

- Cadence. Checkpoint `n` is mutative when `n % 4 == 0` through Act V (three additions then one
  mutation); from Act VI (cp251+) it tightens to 1:1, so `n` is mutative when `n` is even. A
  mutative checkpoint lists `mutates:`, the earlier checkpoints whose result it changes, and ships
  updated copies of their specs in `acceptance/specs/cpNN/`.
- Ripple closure. `mutates:` names every prior checkpoint whose asserted values change, not just the
  direct target, because the concepts interweave. A copy that drops or renames a prior test lists
  that test under `retires:` as `<spec basename>::<title>`.
- A mutation changes a result. It revises a rule or algorithm on the spine, and its test shows the
  old result giving way to the new one. It never just restyles a view.
- Algorithms. At least three checkpoints per act carry an `algorithm:` field naming a concentrated
  algorithm (section 5). `harness.checkpoint_lint` groups the stream into acts of 50 for this count,
  so the tags are spread so that every block of 50 has at least three.
- Reversals. Act V carries two, a mutation that puts an earlier algorithm back to a simpler form
  (age to days, norm to the mean). Each targets a leaf concept so its ripple is small and fully
  shipped.

## 3. The screen and its vocabulary

Every spec starts with `await resetAndSeed({ ... })` then `await page.goto('/')`. It never navigates
anywhere else. There are no `nav-*` clicks and no other URL. Everything happens on the one screen,
and later acts add panels and figures to it rather than new pages. The fixture literal passed to
`resetAndSeed` is written inline in the call, not hoisted into a variable, because the harness reads
the seeded fields straight from that literal.

The full `data-testid` vocabulary is in `support/README.md`. In outline.

| region | testids (established early, later acts add, never rename) |
|---|---|
| root | `nav-worksheet` opens the one screen, `sheet-id-input`, `sheet-load`, `sheet-current-id` |
| people | `people-table`, `people-empty`, rows `person-row-<id>` with raw cells `person-<attr>` and concept cells `concept-<name>`; form `person-form-<attr>`, `person-form-submit`, `person-form-<attr>-error`; editor `person-edit-<id>` |
| rollups | `rollup-<name>`, and keyed rollups like `band-count-<X>`, `region-count-<R>`, `tier-tally-<T>` |
| relationships | `person-patrons`, `person-allies`, `person-ally-count`; forms for linking people |
| groups (Act III) | `group-row-<id>`, `group-name`, `group-concept-<name>`, `group-parent` (cp152), `person-group` |

Naming rules.
- A row is `<thing>-row-<id>`, using the record's id.
- A value inside a row is read as `getByTestId('<thing>-row-<id>').getByTestId('<value>')`.
- A concept shows the literal text `n/a` when an input it needs is missing.
- A `data-testid`, once introduced, is never renamed. It is removed only when a request removes its
  feature (AGENTS.md section 2).

## 4. Data and conventions

The fixture starts small and grows. Each field must appear in a visible spec at or before the first
hidden copy that uses it (`checkpoint_lint` enforces this). Relationships are seeded as top-level
join collections keyed by person id, which is what lets the cardinality migrate underneath a stable
concept.

```js
{
  anchor: '2026-03-01',                                 // the sheet's reference date (AGENTS.md 4.1)
  people:  [{ id, name, alpha, beta, gamma /* later: grade, onset, active, region, score, state */ }],
  patrons: [{ personId, patronId }],                    // many-to-many from cp12
  regions: [{ personId, region }],                      // a promoted child entity from cp40
  follows: [{ from, to }],                              // directed, from cp44
  groups:  [{ id, name, parentId }], memberships: [{ personId, groupId }],  // Act III; parentId from cp152
  sheets:  [{ id, people, ... }],                       // persistence, from cp13; any collection may be per sheet
  settings: { regionMultipliers, bandFrom, bandMultipliers, gradeWeights,   // per sheet, from cp81
              heldInTotals },                                               // 'out' | 'half' | 'full', from cp232
  settingsHistory: [{ from, settings: { ... } }],       // dated settings changes, per sheet, from cp236
  shares:  [{ sheetId, personId, fromSheetId, fromPersonId, state,          // shared people, from cp101
              hold, holdFrom }],                                            // per-sheet hold, from cp240
  history: [{ personId, field, value, from }],          // dated alpha/beta/gamma from cp113; grade/active from cp224
}
```

A share without `sheetId` puts the person onto the default (top-level) sheet. A top-level `anchor`
is the default sheet's only: a named sheet whose test depends on dates seeds its own `anchor`
(the reference model does not let a named sheet borrow it, since no request says it would).
`people[].hold` (from cp73) puts a person on hold; `people[].holdFrom` (yyyy-mm-dd, from cp228) is
the date the hold starts (absent: always on). Patron and follow rows may carry `since` (yyyy-mm-dd,
from cp116); it is not `from`, because `follows[].from` is the follower. A `history` entry's `field`
is `alpha`, `beta` or `gamma`, and from cp224 also `grade` (value `LOW`/`MID`/`HIGH`) or `active`
(value `true`/`false`). A `settingsHistory` entry names only the settings it changes, in the shape
of `settings`; each counts from its `from` date on the date the sheet shows (anchor or as-of).

Conventions.
- Numbers are plain integers. Division rounds down unless a request says otherwise, and the spec
  states the rounding.
- Dates are shown as `yyyy-mm-dd`. Date-dependent concepts use the sheet `anchor`, not the real date.
- Audit lines are `EVENT key=value ...` for side effects the UI cannot show.
- Every expected figure is small enough to check by hand and carries its arithmetic in a comment
  (`// momentum 12 + 3*7 = 33`). No figure is written without one.

## 5. The algorithms

A concentrated algorithm is a concept whose correct result a naive implementation gets wrong. The
request states the rule and its key parameters in plain words. The visible spec asserts values that
only a correct implementation produces, including at least one case a near miss gets wrong (a
rounding direction, a tie-break, a boundary, an even or odd count). The algorithm's name goes in the
checkpoint's `algorithm:` field. A revised version of an earlier algorithm is a mutation and carries
the same name with `-revised`.

The spine carries, among others. thrust, drift and momentum (concept on concept). tier and band
classification by thresholds. rank and percentile by a sort with a stated tie-break. load and reach
by a per-key multiplier. age by whole weeks from onset to anchor. effective by an active gate. clout
and influence and synergy by aggregation over patrons and follows. quality and adjusted. scaled by
the band multiplier. norm and outliers by the mean, then the median. groups by membership
aggregation and within-group rank. the reporting act by cumulative totals, quartile brackets,
cross-tabs and leaderboards over the spine. See `support/ACT_AUTHORING_BRIEF.md` for the exact
chain.

## 6. Authoring rules (every checkpoint)

1. The request is what a person who can see the worksheet would type. Plain English, about the
   worksheet, with no checkpoint numbers and no mention of tests or the harness. It states a rule and
   its key parameters exactly enough to implement.
2. The visible spec binds only to `data-testid` and the audit file, seeds every field it needs in an
   inline literal, and asserts the rule's effect in at least one case a wrong implementation would
   differ on. Its comments describe behaviour only. They never mention replacement copies, mutates or
   later checkpoints (`checkpoint_lint` enforces this).
3. An addition adds a rule that existing concepts must account for. A request that only shows
   existing data in a new place is not allowed.
4. A mutation's copies carry forward every still-valid test of the version in force, adjusted to the
   new rule. A test deliberately dropped or renamed goes in `retires:` as `<basename>::<title>`, and
   the mutated checkpoint is in `mutates:`.
5. Hidden copies seed nothing new. A field a copy seeds already appears in some visible spec at or
   before that checkpoint.
6. No early pass. A request must not be satisfiable by what earlier requests already demand. If it
   might be, its test includes a case that distinguishes the new rule.
7. The hold rule is standing. From cp77, every test that asserts a sheet-wide figure (a total,
   count, rank, percentile, leader, top name, average or middle value) or a patron or follow
   figure seeds one held person, chosen so that counting them wrongly would change an asserted
   figure. A held person is left out of those figures, and totals count them at half (rounded
   down; to the nearest from cp160), a negative value counting as zero from cp92
   (`checkpoint_lint` check 10). Before cp128 never put a held person in a group; from cp128 a held
   member is left out of the group's figures (half in its strength), and from cp136 a group member
   only counts when their state is not DRAFT, so a group test seeds its members a state. Later
   rules on holds and totals: from cp212 a total split by region, tier, grade, state or quartile
   counts a held person in full; from cp220 every total then leaves out its single highest
   contribution (after the hold rule and negatives as zero), so a held person's value must still
   change an asserted figure once trimmed (often a count or top name in the same test); from cp228 a
   hold counts only from its `holdFrom` date; from cp232 a sheet's `heldInTotals` choice replaces the
   half in the unsplit totals; from cp240 a shared person's hold is per sheet (`shares[].hold`). From
   cp208 a percentage leaves a held person out of both sides (not half).
8. Surviving anchors. When a mutation retires tests whose test ids still exist in the app, it lists
   those ids under `keeps_anchors:`. A hidden copy may assert only ids the agent can know
   (`checkpoint_lint` check 9).
9. Consistency forward. When a request changes a rule, every later request and spec that depends on
   it is updated in the same change, and the mutation's `mutates:` names them all.
10. Deterministic for the agent. Every value a test in force asserts follows from the request
   wording, never from a choice the model happens to make: a default a fixture leaves out is
   stated by a request (people start active, cp29; the starting sheet holds the top-level people,
   cp13); a test asserts no figure that rests on an unstated tie-break (spec_check reports it as
   `<ambiguous: ...>`); a test never assumes the id of a row created through the UI (find it by
   name); and after every action the test waits on a visible result before the next action or the
   audit read (`expect.poll(() => auditLines())`; after `person-edit-<id>`, the name filled in the
   form; after `sheet-load`, `sheet-current-id`; after a save that changes nothing visible on the
   anchor, the new `person-history` entry).

## 7. Checks after each act

- `.venv/bin/python -m harness.checkpoint_lint --config config.yaml`. Cadence, one screen, algorithms
  per act, hidden fields, visible-spec leaks, retirements, duplicate keys.
- Compile. Every spec passes `npx playwright test --list`.
- The test-data contract builds at every checkpoint (`harness.fixtures.fixture_contract`).
- `.venv/bin/python -m harness.spec_check --config config.yaml`. Every assertion in every test is
  evaluated against the reference model (`harness/oracle/`, one versioned definition per concept,
  taken from the requests) at every checkpoint where the test is in force. A mismatch is a wrong
  expected value, or a mutation that missed a checkpoint it changes. Hand arithmetic in comments is
  still required, but the model is the check: a wrong oracle the app passes bends the code (run
  202610160010 added a second brace rule to match cp109's wrong tide). The agent never sees the
  model. A value that rests on a choice no request states (a tie with no stated tie-break) is
  reported as a mismatch `<ambiguous: ...>`. A green run is not proof of determinism by itself:
  when in doubt, flip an unstated choice in a scratch copy of the model and rerun; every assertion
  that changes is a test a correct agent can fail.
- `.venv/bin/python -m harness.probe_check --config config.yaml`. The standing rules (hold from
  cp77, settings from cp85, identity from cp105, history from cp117) hold only if their probes
  bite. Each probe is ablated the way an app ignoring the rule would read the fixture (hold
  cleared, settings dropped, shares dropped, history dates ignored), and at least one asserted
  value must change. A test written from a rule's checkpoint on whose asserted figures depend on
  the rule must carry a probe that bites, in its fixture or by driving the rule in the UI.

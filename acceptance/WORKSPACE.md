# The worksheet stream, design

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

- Cadence. Checkpoint `n` is mutative when `n % 4 == 0`, three additions then one mutation. A
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
| groups (Act III) | `group-row-<id>`, `group-name`, `group-concept-<name>`, `person-group` |

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
  groups:  [{ id, name }], memberships: [{ personId, groupId }],  // Act III
  sheets:  [{ id, people, ... }],                       // persistence, from cp13
}
```

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
7. Consistency forward. When a request changes a rule, every later request and spec that depends on
   it is updated in the same change, and the mutation's `mutates:` names them all.

## 7. Checks after each act

- `.venv/bin/python -m harness.checkpoint_lint --config config.yaml`. Cadence, one screen, algorithms
  per act, hidden fields, visible-spec leaks, retirements, duplicate keys.
- Compile. Every spec passes `npx playwright test --list`.
- The test-data contract builds at every checkpoint (`harness.fixtures.fixture_contract`).
- Oracles are checked by hand from the request, from the arithmetic each spec carries in its
  comments. There is no separate reference implementation in this stream.

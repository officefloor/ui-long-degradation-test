# Checkpoint stream — design and rationale

The stream is `checkpoints.yaml` and `acceptance/specs`; its specification is
[`acceptance/WORKSPACE.md`](../acceptance/WORKSPACE.md) and its concept chain is
[`acceptance/support/ACT_AUTHORING_BRIEF.md`](../acceptance/support/ACT_AUTHORING_BRIEF.md). There is
one harness and one stream. This note records why the stream is shaped the way it is; read it
alongside [`LONG_HORIZON_DESIGN.md`](./LONG_HORIZON_DESIGN.md) (the study design) and
[`../DESIGN.md`](../DESIGN.md) (the base method).

## 1. What the stream is for

**Find where the architecture breaks, as early as possible, then watch how it behaves under further
stress.** The long horizon is not there to be fair to the architecture or easy on it. It is there to
overstress the system early and then keep loading it, so a run shows the break point and everything
after it. The subject matter is deliberately meaningless — arbitrary people, values and concepts, no
real domain — so an agent cannot lean on domain knowledge, and the only thing under test is whether
the stack absorbs interwoven definitions and changing relationships without eroding.

## 2. Principles

1. **One screen, one spine.** All 250 requests land on one screen, the **worksheet** at `/`: the way
   a single rich screen carries ever more complex behaviour behind it. Its subjects are arbitrary
   **people** who carry raw attribute values, the named **concepts** computed from those values and
   from each other, and the **relationships** between people. The backend logic stays behind the few
   handlers that serve that screen. No request adds another page; each makes the worksheet do more.
2. **Overstress early.** The first act builds the concept spine fast and loads it with complexity, so
   that by about request 50–60 the spine is already at the edge. There is no breadth-first act.
3. **The amount keeps climbing.** Complexity added per request holds level or rises for all 250
   requests (a straight line or steeper), so placement keeps being negotiated.
4. **Mutate what is there.** Every fourth request (positions 4, 8, 12, …) mutates complexity already
   in place: a rule, a concept definition, or the cardinality of a relationship underneath a concept
   held stable. Its test shows the old result changing. That is the 3:1 rhythm, applied to the
   accumulated spine.
5. **Algorithms in every act.** At least three per 50-checkpoint block: a concept whose correct
   result a naive implementation gets wrong (a stated tie-break, a threshold boundary, a rounding
   direction, an even/odd count), unlike plain arithmetic. Several get a later mutation to a revised
   version.
6. **The spine is measured independently of placement.** Complexity counts as on the spine if it
   serves the worksheet and its people, concepts and relationships, whichever classes or files it
   lives in. An additive architecture will put it in new classes, and must not be penalised for that.

## 3. Shape: five acts

Every act is about 75% additions that add rules or concepts, and 25% mutations of what is already
there. A new concept is a value, a rule or a relationship on what exists — never a fourth thing with
a screen of its own.

| act | requests | theme on the worksheet | algorithms (≥ 3 per 50-cp block) |
|---|---|---|---|
| I | 1–60 | **The concept spine.** Raw values; concepts on concepts (thrust, drift, momentum); classification (tier, band); rank and percentile; load, age, effective; the first relationship (patrons) and its 1-1 → 1-many → many-many migrations. | rank and percentile by a sort with a stated tie-break; band/tier classification by thresholds; age by whole weeks from a reference date; mean-then-median normalisation with outliers. |
| II | 61–120 | **A second axis, fused.** A second raw triple (delta, epsilon, zeta) grows force, sway and torque, which fuse with the spine and aggregate over the relationships. | phase classification; level/drag banding; a norm against the median of a derived value. |
| III | 121–180 | **Groups.** A groups entity, many-to-many membership, and per-group and per-member concepts: strength, cohesion, spread, share, standing, within-group rank. | group aggregation; within-group rank; group rank; median-of-strength. |
| IV | 181–240 | **Reporting over the spine.** Rollups, rankings and reports over the whole spine: totals, quartile brackets, cross-tabs by region/tier/grade/state, leaderboards. | global rank; quartile brackets; cumulative totals; skew; median stratum; bracket ledger. |
| V | 241–250 | **Consistency finale.** Whole-stack sweeps that compose the spine, plus two reversals that undo earlier decisions. | standing sort; and the two reversals — age back to days, norm back to the mean. |

**Relationship migrations.** The core plasticity pressure. Relationships are seeded as top-level join
collections keyed by person id, so a cardinality can migrate (1-1 ↔ 1-many ↔ many-many, an attribute
promoted to a child entity and folded back) underneath a concept whose contract is held stable.

**Reversals.** Two, both in the finale. Each puts an earlier algorithm back to a simpler form (age to
days, norm to the mean) and targets a leaf concept so its ripple is small and is shipped in full.

**No control region.** There is no low-pressure comparison region; all 250 requests are on the spine.

## 4. Finding the break point

The analysis has to say **when** the architecture broke and **what happened after**. Break signals,
reported per checkpoint and per chain:

| signal | break when |
|---|---|
| change impact | a change grades above the gate's threshold (recalibrated for this stream before any gated run) |
| spine handler complexity | the cognitive complexity of the method(s) behind the worksheet passes a threshold, e.g. 25 |
| regressions | the first true regression; then regressions per 10 requests |
| effort | agent cost or turns per request more than double the Act I median |
| rework | settled lines rewritten above, e.g. 30% of lines touched, over a rolling 10 requests |

`summary.md` carries a **break point** section: the first checkpoint each signal fired, and the
trajectory over the next 50 and 100 requests (regression rate, cost, rework, amount added). That is
"how does it handle further stress after that point", in numbers.

## 5. Keeping the stream honest: lint checks

Static checks in `harness.checkpoint_lint`, run before a run is paid for:

| check | rule |
|---|---|
| **single screen** | every own spec opens only `/` and clicks no `nav-*` target |
| **algorithms per act** | at least 3 checkpoints per 50-checkpoint block carry `algorithm: <name>` |
| **cadence** | checkpoint `n` is mutative exactly when `n % 4 == 0`, and every mutative names what it `mutates:` |
| **hidden test data** | a field a replacement copy seeds appears in a visible spec at or before that checkpoint |
| **visible-spec leaks** | an own spec never mentions copies, `mutates` or the hidden suite |
| **coverage** | a copy drops a prior test only when the checkpoint lists it under `retires:` |
| **YAML** | no mapping repeats a key |

After a run: the amount added per request (a straight line or steeper) and the spine share (target at
least 80% of new complexity on the spine in every act; with one screen and no breadth act it should
be well above), plus the break-point section.

## 6. Authoring and extending

Author and validate one act at a time: the plain-English requests, the visible specs, the replacement
copies with `retires:`, and the algorithms with exact worked values. After each act:

1. `harness.checkpoint_lint` (section 5).
2. Compile — every spec passes `npx playwright test --list`.
3. The test-data contract holds at every checkpoint (`harness.fixtures.fixture_contract`).
4. Oracles are checked by hand from each request and the arithmetic each spec carries in its
   comments. There is no separate reference implementation in this stream.

A one-chain calibration run of each act on one stack then shows whether every test is satisfiable and
unambiguous; defects are fixed before the next act is authored. The full experiment is ten chains per
stack (`LONG_HORIZON_DESIGN.md` §7).

## 7. Fixed decisions

| # | question | decision |
|---|---|---|
| 1 | the one screen | **The worksheet at `/`**: arbitrary people, the concepts computed on them, and the relationships between them. No real domain. |
| 2 | control region | **None.** All 250 requests are on the spine. |
| 3 | algorithms | At least 3 per 50-checkpoint block, with revised-version mutations later in the run. |
| 4 | reversals | **Two, in the finale**, each putting an earlier algorithm back to a simpler form on a leaf concept. |
| 5 | length | **250**, in five acts (I–IV of 60, the finale of 10). |

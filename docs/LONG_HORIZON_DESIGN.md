# Long-Horizon Extension — Design Notes

How `ui-long-degradation-test` extends from 60 to ~250 checkpoints to test whether the
additive-vs-mutative erosion gap **compounds** over a long sequence of AI-authored changes, and
how the checkpoint stream is kept concentrated, realistic, and handoff-ready rather than vibe slop.

Read alongside [`DESIGN.md`](../DESIGN.md) (the base method) and the sibling REST study
`~/spring-petclinic-rest-long-degradation-test` (the published arm this mirrors).

---

## 1. Why longer

The published REST study found that mutative architecture moves **placement** — change concentrates
into one growing file/method — with large, well-separated effects (plasticity ratios R = 2.7–10.0
on the concentration family; 10 of 11 metrics' 95% CIs above 1). But within **sixty** change
requests that concentration did **not** cash out into worse outcomes, and the paper names the
horizon itself as the leading unresolved question:

> "sixty rules on one endpoint is too short a horizon, and concentration compounds … this study
> cannot choose between [that and 'the effect is just mild']." — REST paper, Discussion.

The supplementary trajectory data shows degradation still **climbing, often accelerating, at
checkpoint 60** (e.g. `true_regressions` on the Spring control arm was 0,0,0,0.008,**0.30** across
the five phase bins — essentially the entire safety signal appeared only in the final bin). Nothing
had saturated. A longer, **deliberately concentrated** horizon is the direct test of whether the
placement gap becomes an outcome gap.

## 2. The study: a 2×2 (×bonus) stack matrix

Erosion is compared **across technology stacks** (one stack per run; nothing held constant within a
run — see `DESIGN.md §2`). The named hypothesis: additivity compounds across *both* layers, so
TanStack/OfficeFloor resists erosion best and Angular/Spring worst.

| | OfficeFloor (additive BE) | plain Spring (mutative BE) |
|---|---|---|
| **TanStack** (additive FE) | `officehq-tanstack-officefloor` ✓ runs exist | `officehq-tanstack-spring` ✓ smoke-ready |
| **Angular** (mutative FE) | `officehq-angular-officefloor` ✓ smoke-ready | `officehq-angular-spring` ✓ smoke-ready |

Bonus arms already present on GitHub (`officefloor` org): `officehq-react-officefloor` (plain-React
control), `officehq-htmx-officefloor` / `officehq-htmx-spring` (server-rendered hypermedia — isolates
whether additivity is a *front-end* property or inherited from the back-end), and
`officehq-tanstack-mixed` (Spring reads + OfficeFloor writes — a gradual-adoption risk probe). All
eight carry a runnable `base-empty` branch. The four named cells pass `verify-stack.sh --smoke`
(build · start · readiness · seed · stop). A real run token is still required before any run.

The horizon is a property of the **checkpoint stream**, not the stacks, so the 250-checkpoint
`checkpoints.yaml` drives every stack unchanged. Runs are comparable only when they share the same
stream version.

## 3. The erosion engine: one screen, one concept spine

Erosion pressure only accumulates if change keeps landing on the **same code**. The stream
therefore concentrates by construction: all 250 requests land on **one screen**, the worksheet at
`/`, over arbitrary **people** who carry raw attribute values, named **concepts** computed from
those values and from each other, and **relationships** between people whose cardinality migrates
underneath concepts that are held stable. No request adds a page, a route or a screen of its own: a
new concept is a value, a rule or a relationship on what already exists, never a fourth thing with a
screen of its own. Every request makes the few handlers behind that screen do more, so the backend's
request handling is concentrated too.

```
raw values (alpha, beta, gamma, …) → concepts (thrust, drift, momentum) → concepts on concepts
     (tier, rank, percentile, load, age, effective) → aggregates over relationships (backing,
     clout, influence, synergy) → group concepts (strength, cohesion, standing) → rollups and
     reports (totals, quartile brackets, cross-tabs, leaderboards) over the whole spine
```

The subject matter is deliberately meaningless, so an agent cannot lean on domain knowledge; what is
measured is purely whether the stack absorbs interwoven definitions and changing relationships
without eroding. The design goal is to **break the architecture early and keep loading it**: there
is no breadth act and no low-pressure control region. The specification every checkpoint is written
against is [`acceptance/WORKSPACE.md`](../acceptance/WORKSPACE.md), with the full concept chain in
[`acceptance/support/ACT_AUTHORING_BRIEF.md`](../acceptance/support/ACT_AUTHORING_BRIEF.md).

## 4. Enforced properties

### 4.1 Concentration
Carried by construction, not by a percentage: one screen and one concept spine. `checkpoint_lint`
refuses any spec that navigates anywhere but `/` or clicks a `nav-*` control.

### 4.2 Cadence: 3 additive : 1 mutative
Checkpoint `n` is mutative exactly when `n % 4 == 0` through Act V; from Act VI (cp251+) the cadence
tightens to 1:1, so `n` is mutative when `n` is even (checkpoint_lint `--tighten-after`/`--tighten-period`).
Every addition adds a rule that interacts with
what is there; every mutation changes the result of a rule or algorithm already in place, and ships
updated copies of the specs it changes. The finale (Act V) carries two **reversals** — mutations that
put an earlier algorithm back to a simpler form (age to days, norm to the mean) — each on a leaf
concept so its ripple stays small and is shipped in full.

### 4.3 Algorithms in every act
At least three checkpoints per 50-checkpoint block carry `algorithm: <name>`: a concept whose correct
result a naive implementation gets wrong — rank and percentile with a stated tie-break, band and tier
classification by thresholds, age by whole weeks from a reference date, the mean-then-median
normalisation, group aggregation and within-group rank, quartile brackets, cumulative totals and
cross-tabs, skew. Each states the rule in plain words and asserts a case a near miss gets wrong (a
rounding direction, a tie-break, a boundary, an even/odd count). Several get a later mutation to a
revised version.

### 4.4 The lint: audit before paying for a run

```sh
.venv/bin/python -m harness.checkpoint_lint --config config.yaml
```

It checks the cadence, the single screen, algorithms per act (`--act-size 50 --min-algorithms 3`),
hidden test data (a field a replacement copy seeds must appear in a visible spec first), leaks of
the hidden suite into visible specs, undeclared retirements, and duplicate YAML keys.

### 4.5 Exact figures
Every expected value is small enough to check by hand and carries its arithmetic in a comment
(`// momentum 12 + 3*7 = 33`). There is no separate reference implementation in this stream: the
oracles are hand-derived from each request and verified against those comments (`WORKSPACE.md` §7).

## 5. Phase structure: five acts

| Act | CPs | What keeps loading the worksheet |
|---|---|---|
| **I — the concept spine** | 1–60 | raw values; concepts on concepts (thrust, drift, momentum); classification (tier, band); rank and percentile; load, age, effective; the first relationship (patrons) and its 1-1 → 1-many → many-many migrations |
| **II — a second axis, fused** | 61–120 | a second raw triple (delta, epsilon, zeta) growing force, sway and torque, fused with the spine and aggregated over the relationships |
| **III — groups** | 121–180 | a groups entity, many-to-many membership, and per-group and per-member concepts (strength, cohesion, spread, share, standing, within-group rank) |
| **IV — reporting over the spine** | 181–240 | rollups, rankings and reports over the whole spine: totals, quartile brackets, cross-tabs by region/tier/grade/state, leaderboards |
| **V — consistency finale** | 241–250 | whole-stack sweeps that compose the spine, plus two reversals that undo earlier decisions (age back to days, norm back to the mean) |
| **VI — the finale** | 251–300 | 1:1 cadence throughout. **deep layer (251–260):** a second-order chain on norm/scaled (fathom → cascade → ripple → ballast → keystone, depth ~17); a rivals relationship migrating directed → mutual → one; two cross-cutting rules (trim the lowest off every total, drop SINK people from every count). **hub layer (261–280):** a central `keel` read directly by 53 concepts (a god-sized hub), redefined at cp262 and cp280 so one change ripples the whole gauge battery. **post-peak (281–300):** further changes keep landing on the concentrated hub — keel redefined again (cp282, ripple 21), every gauge globally rounded (cp288, ripple 21), and the lowest-contribution trim reversed (cp300, ripple 40) — the "what happens next" tail |

The amount of complexity added per request is meant to hold level or climb for all 250 requests, so
its placement keeps being negotiated. The full act design and the exact concept chain are in
`acceptance/WORKSPACE.md` §2 and §5 and `acceptance/support/ACT_AUTHORING_BRIEF.md`.

## 6. Checkpoint authoring rules

`WORKSPACE.md` §6 is authoritative. In short:

- A plain-English `request` a worksheet user would type, plus a Playwright spec binding only to
  `data-testid` and the audit file. Specs start with `resetAndSeed(...)` and `page.goto('/')`.
- **Checkpoint-free spec content**: the agent sees only the current checkpoint's spec, and its
  comments describe behaviour only (the lint rejects mentions of copies or mutations).
- **Mutative checkpoints ship updated copies** in `acceptance/specs/cpNNN/`, each carrying forward
  the latest version in force; a test dropped on purpose is listed under `retires:`.
- **Data-testids are immutable public API**, removed only when a request removes their feature.
- **Arrange, not Assert, via `/__test__`**: seed state per spec, assert only through the UI and the
  audit file (AGENTS.md §4).

## 7. Decision gates

Author and run in stages; do not commit to 500 up front (authoring 500 quality specs is itself where
slop would enter).

- **Pilot → cp~100**, a few chains, one condition, all target stacks in parallel. Use the between-
  chain spread to size replication (the REST study needed 10 chains because strict-pass is bimodal —
  "chain 0 and chain 1 … would support opposite blog posts").
- **Gate at cp100, cp150, cp200**: are the arms separating on the concentration metrics *and* is
  degradation still climbing? Extend toward 500 only on "yes" to both.
- **Prioritise the diagonal** (TanStack/OfficeFloor vs Angular/Spring) for the headline; run the
  off-diagonal and the htmx pair to decompose front-end vs back-end contribution.

## 8. Verifying concentration actually happened

- **Authoring-time (guarantee):** `harness.checkpoint_lint` — one screen, the A-A-A-M cadence,
  algorithms in every act. Fails before a run spends anything.
- **Run-time (result):** the REST paper's concentration family — `cum_change_top1`,
  `cum_change_hhi`, `cum_change_entropy_norm` — must **trend upward** across the run on the mutative
  arms (Angular/Spring) and stay flatter on the additive arms (TanStack/OfficeFloor). Register this
  as a pre-declared `expectation` (direction per metric) so each run marks its own confirmation /
  disconfirmation.

## 8a. Per-act comprehension probe (cold reader)

Mirrored from the REST arm's "cold-reader comprehension probe" and wired into this harness
(`config.yaml → probe:`, the run-loop call in `run_experiment.py`, the read in `analyze.py`; the
`agent.probe()` function already existed here, dormant). At each **Act boundary**
(`at_checkpoints: [50, 100, 150, 200, 250, 260, 280, 290, 300]`, the Act boundaries plus Act VI's
deep/hub/post-peak layers) a **fresh, read-only, history-less** agent — the
acceptance specs excluded from its view — reads the evolved code and (1) enumerates every concept
and rule applied to a person on the worksheet and (2) judges how hard the logic was to find and follow.

- `probe_recall` — fraction of that Act's expected concepts the cold reader could name (a crude
  **completeness** proxy; the expected lists are cumulative and drop what each reversal removed, such
  as the week-based age and the median normalisation undone in Act V, so a stack still surfacing the
  old form failed to reverse it).
- `probe_cache_read_tokens` / `probe_cost_usd` — the **comprehension-cost** proxy: a tangled
  mutative codebase costs more to read than an additive one that enumerates its own units.
- `cp<NN>.probe.jsonl` — the raw answer, kept for the qualitative "all rules implemented + readable"
  read.

It is **advisory** — a probe error is logged and the run continues — and the signal is the
trajectory across Acts plus the Angular/Spring-vs-TanStack/OfficeFloor gap at the same boundary.
This is a comprehension *proxy*, not a pass/fail "all rules implemented" judge; read `probe_recall`
alongside the objective acceptance gate (the specs), which is the authoritative completeness signal.

## 9. Cost & feasibility

Per-checkpoint: **$1.50–$2.24** implement-only (REST paper), ~$2.25–2.75 all-in for gated/reviewed;
~250–336 s model-time per CR plus the per-CR build + serve + Playwright gate (budget ~8–12 min
wall-clock/CR). The full 2×2 × 2-condition × 10-chain × 500-CR matrix is **months** of wall-clock and
is **not** a single push; concurrency across stacks and a reduced chain/condition count for the pilot
are the levers. Dollars may be ~0 under a flat-rate subscription — **wall-clock is the binding
constraint**. (The REST study's 6,000 implementations cost $8,634 at list prices and spanned Aug–Sep
2026.)

## 10. Authoring status

The stream is the single-worksheet, domain-free stream described above: 250 checkpoints in five
acts, every fourth mutative, at least three algorithms per 50-checkpoint block, with two reversals in
the finale. The lint, the spec compile (`npx playwright test --list`) and the fixture contract at
every checkpoint all pass; oracles are hand-checked from the arithmetic each spec carries. The first
run on any stack is also its calibration: it surfaces any test that is unsatisfiable or ambiguous.

## 11. Handoff notes (not vibe slop)

- The **data-testid contract + full cumulative regression gate** is the safety net that lets any
  team pick up an evolved app with a passing suite that pins behaviour.
- The **gated / ImpactGate condition** is the anti-slop mechanism for the *evolved app* (it blocks
  high-impact changes and forces refactors); run it when the deliverable is a maintainable artifact.
  `just-solve` is the default and the experiment's condition: the clean architecture contrast.
- **Never start a long run on a stack that does not pass `verify-stack.sh --smoke`** — otherwise
  erosion from checkpoint 1 is un-attributable.
- Caveat to keep honest: the REST study did **not** cleanly confirm "additive better" (on the
  whole-app erosion metric the additive arm ended higher; concentration won on every *outcome*
  within 60 CRs). Design the long horizon to **discover** whether additive pulls ahead — not to
  confirm it. The pre-declared expectations (§8) are the guard.

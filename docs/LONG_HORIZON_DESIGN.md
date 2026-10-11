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
`checkpoints.yaml` drives every stack unchanged. Runs made before the October 2026 rewrite used a
different stream and are not comparable with later ones.

## 3. The erosion engine: one screen, three entities

Erosion pressure only accumulates if change keeps landing on the **same code**. The stream
therefore concentrates by construction: all 250 requests land on **one screen**, the invoice
workspace at `/`, over **three entities**, the client, the invoice (with its lines) and the payment
(with its allocations). No request adds a page, a route or a fourth entity. Every request makes the
few actions behind that screen (create or update an invoice, add or edit a line, send, record a
payment) do more, so the backend's request handling is concentrated too.

```
line → tiers / rate card / minimum → discounts (largest-remainder split) → tax (region,
     reverse charge, inclusive) → rounding → TOTAL → approval / credit limit / hold → send
payment → reference / remittance match → allocation order → credit / deposits / instalments
     → interest / write-off / cash rounding → amountDue → status → risk → dunning
```

The design goal is to **break the architecture early and keep loading it**: there is no breadth
act and no low-pressure control region. The specification every checkpoint is written against is
[`acceptance/WORKSPACE.md`](../acceptance/WORKSPACE.md); the reasoning, and why the earlier stream
(three money screens plus a control region) was replaced, is in
[`STREAM_RESTRUCTURE_PLAN.md`](./STREAM_RESTRUCTURE_PLAN.md). Earlier runs used that earlier stream
and are not comparable; it is in git history.

## 4. Enforced properties

### 4.1 Concentration
Carried by construction, not by a percentage: one screen and three entities. `checkpoint_lint`
refuses any spec that navigates anywhere but `/` or clicks a `nav-*` control.

### 4.2 Cadence: 3 additive : 1 mutative
Checkpoint `n` is mutative exactly when `n % 4 == 0`. Every addition adds a rule that interacts with
what is there; every mutation changes the result of a rule or algorithm already in place, and ships
updated copies of the specs it changes. One mutation per act from Act II is a **reversal** that
removes accumulated complexity, after which later requests build on what is left.

### 4.3 Algorithms in every act
At least three checkpoints per act carry `algorithm: <name>`: precise, concentrated logic (check
digits, ISO 11649 references, largest-remainder allocation, annuities, compound interest, FX
triangulation, tiered pricing, tax-inclusive reconciliation, cash rounding, calendar proration,
Jaro–Winkler matching, risk scores, SHA-256 fingerprints, business-day calendars, dunning). Most get
a later mutation to a revised version (`<name>-revised`).

### 4.4 The lint: audit before paying for a run

```sh
.venv/bin/python -m harness.checkpoint_lint --config config.yaml
```

It checks the cadence, the single screen, algorithms per act (`--act-size 50 --min-algorithms 3`),
hidden test data (a field a replacement copy seeds must appear in a visible spec first), leaks of
the hidden suite into visible specs, undeclared retirements, and duplicate YAML keys.

### 4.5 Exact figures
Every expected value comes from `acceptance/reference/` (`algorithms.py` for the algorithms,
`model.py` for the rules in force at each checkpoint) or carries its arithmetic in a comment.
`check_scenarios.py` flags any figure that changes other than at a declared mutation, and
`verify_specs.py` checks the specs and the scenario registry agree. The `act*_authoring/` generators
render specs, copies and the yaml from one source.

## 5. Phase structure: five acts of 50

| Act | CPs | What keeps loading the workspace |
|---|---|---|
| **I — build the spine fast** | 1–50 | clients, invoices, lines, discounts, tax, totals, send, payments, allocation, status |
| **II — money over time** | 51–100 | deposits, credit notes, refunds, retention, instalments, interest, late fees, currency |
| **III — rules that interact** | 101–150 | tax by region, reverse charge, tiered pricing, rate cards, minimums, surcharges, cash rounding, withholding |
| **IV — cross-cutting states** | 151–200 | approvals, credit limits and holds, disputes, recurring billing with proration, milestones, risk |
| **V — keep loading** | 201–250 | sent snapshots, duplicate fingerprints, credit and rebill, adjustment notes on sent invoices, business-day calendar, dunning, mod-11 invoice numbers; instalment plans removed (cp212) |

The amount of complexity added per request is meant to hold level or climb for all 250 requests,
so its placement keeps being negotiated. The full act design, with the algorithms of each act, is
`WORKSPACE.md` §2 and §5; the rules in force at each act boundary are in
`acceptance/reference/vocabulary.md`.

## 6. Checkpoint authoring rules

`WORKSPACE.md` §6 is authoritative. In short:

- A plain-English `request` a workspace user would type, plus a Playwright spec binding only to
  `data-testid` and the audit file. Specs start with `resetAndSeed(...)` and `page.goto('/')`.
- **Checkpoint-free spec content**: the agent's own spec is neutralised to `acceptance.spec.ts`,
  and its comments describe behaviour only (the lint rejects mentions of copies or mutations).
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
(`at_checkpoints: [50, 100, 150, 200, 250]`) a **fresh, read-only, history-less** agent — the
acceptance specs excluded from its view — reads the evolved code and (1) enumerates every rule
applied to an invoice on the workspace and (2) judges how hard the logic was to find and follow.

- `probe_recall` — fraction of that Act's expected rules the cold reader could name (a crude
  **completeness** proxy; the expected lists are cumulative and drop what each act's reversal removed, such as late fees
  from cp150, retention from cp200 and instalment plans at cp250, so a stack still surfacing one failed to reverse it).
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

The stream was rewritten in place (October 2026) as the single-workspace stream described above:
250 checkpoints in five acts, every fourth mutative, at least three algorithms per act, one reversal
per act from Act II. The lint, the spec compile, the fixture contract at every checkpoint and the
reference checks (`check_scenarios.py`, `verify_specs.py`, `algorithms.py`) all pass. No
implementation of this stream exists yet, so the first run is also its calibration: it will show
any test that is unsatisfiable or ambiguous.

## 11. Handoff notes (not vibe slop)

- The **data-testid contract + full cumulative regression gate** is the safety net that lets any
  team pick up an evolved app with a passing suite that pins behaviour.
- The **gated / ImpactGate condition** is the anti-slop mechanism for the *evolved app* (it blocks
  high-impact changes and forces refactors); run it when the deliverable is a maintainable artifact,
  and `just-solve` when the deliverable is the clean architecture contrast.
- **Never start a long run on a stack that does not pass `verify-stack.sh --smoke`** — otherwise
  erosion from checkpoint 1 is un-attributable.
- Caveat to keep honest: the REST study did **not** cleanly confirm "additive better" (on the
  whole-app erosion metric the additive arm ended higher; concentration won on every *outcome*
  within 60 CRs). Design the long horizon to **discover** whether additive pulls ahead — not to
  confirm it. The pre-declared expectations (§8) are the guard.

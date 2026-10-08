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

The horizon is a property of the **checkpoint stream**, not the stacks, so the ~250-checkpoint
`checkpoints.yaml` drives every stack unchanged, and the existing 60-checkpoint runs become the
short-horizon baseline each long run is compared against.

## 3. The erosion engine: concentration (the core requirement)

Erosion pressure only accumulates if change keeps landing on the **same code**. A long stream that
spread thin would dilute exactly the signal the REST study found strongest. So the extension
**concentrates by construction** on one subsystem — the **invoice money pipeline**:

```
lineItems → subtotal → discount(s) → tax → rounding → TOTAL
          → payments / allocation → amountDue → status
TOTAL / amountDue are then RE-READ by: invoice view · client statement ·
          dashboard owed/overdue · top-clients · aging · tax summary
```

Every change to how an invoice totals forces a reach into this one path **and** into every screen
that must stay consistent with it. That reach-across is the erosion engine. Peripheral features
(clients, jobs, tasks) deliberately add in their own corner and form a **low-pressure control
region inside the same run** — so each arm can be shown to have concentrated change in billing while
staying diffuse elsewhere, a stronger within-run contrast than billing-only.

**Concentration is a property of _where_ a change is aimed, independent of _how_ it is phrased
(additive vs mutative).** The two are orthogonal knobs (§4).

## 4. Two enforced properties, two knobs

### 4.1 Concentration — the erosion guarantee
≥ **75%** of the long-horizon extension (checkpoints with id ≥ 61) targets the **core** area
`billing`. This is what makes pressure accumulate. Carried entirely by *targeting*, not by mutation.

### 4.2 Cadence / realism — comparability with the REST arm
Change **type** follows a **3 additive : 1 mutative** rhythm (every 4th checkpoint mutative, the
A-A-A-M pattern), i.e. ~25% mutative. This matches the REST study and real life: you **add** features
far more often than you **revise** them. Most additive changes *should not* break prior specs — that
is the additive thesis; the ~25% mutative are the genuine contract revisions that force reaching
back into existing behaviour.

### 4.3 The lint — audit before paying for a run
`harness.checkpoint_lint` enforces both over `checkpoints.yaml`, for ~0 cost:

```sh
.venv/bin/python -m harness.checkpoint_lint --config config.yaml            # extension (id>=61)
.venv/bin/python -m harness.checkpoint_lint --config config.yaml --min-id 1 # whole stream
```

Each checkpoint declares its subsystem via an inline `area:` field; the frozen Act I entries
(cp01–60) keep their area in `acceptance/checkpoint_areas.yaml` so they need not be edited. A
checkpoint in the enforcement window with no area is an error. Current status: extension = **80%
billing, 25% mutative, clean A-A-A-M**; whole stream = 67% billing, 27% mutative.

## 5. Phase structure — escalating pressure on one spine

Act I (cp01–60) is **frozen** — it grew the app and established the billing spine, and preserving it
keeps comparability with runs already recorded and gives the short-horizon baseline. The extension
keeps re-opening the *same* calculation; escalation comes from **feature depth**, not from more
mutation, so the 3:1 cadence stays flat throughout.

| Act | CPs | What keeps hitting the spine | Mix |
|---|---|---|---|
| **I — ramp** (frozen) | 1–60 | builds app + establishes billing | ~27% mut, ~53% billing |
| **II — the calc deepens** | 61–120 | per-line & multi-rate tax, exemptions, stacked/capped/line discounts, surcharges, credit notes, write-offs, deposits, rounding regimes | 25% mut, 80% billing |
| **III — money over time** | 121–180 | multi-currency + FX-at-date, partial payments, allocation across invoices, retentions, instalments, late-fee accrual | 25% mut |
| **IV — rollups reuse the calc** | 181–240 | statements, aging buckets, tax-period reports, revenue recognition, dashboard KPIs — each re-reads total/owed | 25% mut, with periodic "everywhere" sweeps |
| **V — stress finale** | 241–250 | sweeping cross-cuts + 2–3 *reversals* that force touching every site again | 25% mut |

The A-A-A-M rhythm means each revision lands *after* three features have accreted on the spine — the
realistic shape (you change something after you've built on it) and the one most punishing to a
mutative architecture.

## 6. Checkpoint authoring rules

Each checkpoint = a plain-English `request` (shown to the blind agent) + an experimenter-authored
Playwright spec (the objective gate, binding only to `data-testid`). Non-negotiables:

- **`area:` on every new checkpoint** — `billing` for the spine and every screen that re-reads its
  figures; otherwise the off-spine area (`clients`/`jobs`/`tasks`).
- **cpNN-free spec _content_** — the agent's own spec is neutralised to `acceptance.spec.ts` and a
  leak guard (`_CP_TOKEN = /cp\d+/i`) **raises** if the content names a checkpoint. State mutation
  relationships in `checkpoints.yaml` (`mutates:`), never in spec comments.
- **Mutative checkpoints ship updated priors** — a sibling `cp<NN>/` folder (NN = the checkpoint's
  position) holding corrected copies of every prior spec the new rule revises, installed by basename
  so they win in the cumulative gate. Each copy must **carry forward all earlier mutations** to that
  basename (see the `cp49_sales_tax` cascade in `cp64/` then `cp68/`).
- **Reuse the established `data-testid` vocabulary** — `invoice-row-<id>`, `invoice-subtotal` /
  `-discount` / `-tax` / `-amount` / `-due-amount` / `-status`, `lineitem-*`, `payment-*`,
  `payment-alloc-<id>`, seed shape `{clients, projects, invoices:[{…, discountPct, taxPct,
  lineItems:[{id,description,qty,unitPrice}]}], payments}`. Introduce new anchors only for new
  behaviour; never repurpose an existing one (it is immutable public API except via a declared
  mutation).
- **Arrange, not Assert, via `/__test__`** — seed state per spec; assert only through the running UI
  and the audit file.

## 7. Decision gates

Author and run in stages; do not commit to 500 up front (authoring 500 quality specs is itself where
slop would enter).

- **Pilot → cp~100**, a few chains, one condition, all target stacks in parallel. Use the between-
  chain spread to size replication (the REST study needed 10 chains because strict-pass is bimodal —
  "chain 0 and chain 1 … would support opposite blog posts").
- **Gate at cp120, cp180, cp240**: are the arms separating on the concentration metrics *and* is
  degradation still climbing? Extend toward 500 only on "yes" to both.
- **Prioritise the diagonal** (TanStack/OfficeFloor vs Angular/Spring) for the headline; run the
  off-diagonal and the htmx pair to decompose front-end vs back-end contribution.

## 8. Verifying concentration actually happened

- **Authoring-time (guarantee):** `harness.checkpoint_lint` — core-share ≥ 75%, mutative ≈ 25%,
  A-A-A-M. Fails before a run spends anything.
- **Run-time (result):** the REST paper's concentration family — `cum_change_top1`,
  `cum_change_hhi`, `cum_change_entropy_norm` — must **trend upward** across the run on the mutative
  arms (Angular/Spring) and stay flatter on the additive arms (TanStack/OfficeFloor). Register this
  as a pre-declared `expectation` (direction per metric) so each run marks its own confirmation /
  disconfirmation.

## 8a. Per-act comprehension probe (cold reader)

Mirrored from the REST arm's "cold-reader comprehension probe" and wired into this harness
(`config.yaml → probe:`, the run-loop call in `run_experiment.py`, the read in `analyze.py`; the
`agent.probe()` function already existed here, dormant). At each **Act boundary**
(`at_checkpoints: [60, 120, 180, 240, 250]`) a **fresh, read-only, history-less** agent — the
acceptance specs excluded from its view — reads the evolved code and (1) enumerates every rule
applied to the invoice money pipeline and (2) judges how hard the logic was to find and follow.

- `probe_recall` — fraction of that Act's expected rules the cold reader could name (a crude
  **completeness** proxy; the expected lists are cumulative, and the cp250 list drops `levy` and
  `stacked` because the Act V reversals remove them, so a stack still surfacing a levy there failed
  to reverse).
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

## 10. Authoring status — COMPLETE (all 250)

- ✅ `checkpoints.yaml` — all **250** checkpoints (Acts I–V). ids 1–250 sequential/unique; extension
  (cp61–250) = **81% billing, 25% mutative, clean A-A-A-M**; all 47 mutatives' `mutates` targets
  resolve. Lint green.
- ✅ Specs — **250 main specs + 90 override files (340 total)**. Every checkpoint has its spec; every
  mutative has its override folder with one file per `mutates` entry. **All 340 parse clean (0
  errors), all agent-visible specs are cpNN-free (leak guard), and the override cascades resolve
  monotonically** (verified for the hot basenames, incl. the two Act V reversals that remove the
  levy and collapse stacked discounts). cp61–68 were hand-authored as the template; cp69–250 by four
  sequential act-batch agents, each building cascades on the latest on-disk version.
- ✅ `harness/checkpoint_lint.py`, `acceptance/checkpoint_areas.yaml` — the concentration/cadence
  audit.

**Not yet done — the run is the real validation.** The specs are authored and statically verified
but have **not** been run against a live stack (needs a run token). They introduce many new
`data-testid` anchors and seed fields that the agent implements per checkpoint; the first run will
surface any that are unsatisfiable. Recommended: a cheap prefix run (`--from 61 --to 72` on
`officehq-tanstack-officefloor`) to shake out systemic issues before committing to the full 250.

**Invoice status vocabulary (full, for implementers):** `DRAFT`, `SENT`, `UNPAID`, `PARTIAL`,
`PAID`, `VOID` (cancelled), `WRITTEN_OFF`, `CREDITED`, `DISPUTED`. (`UNPAID`/`VOID` originate in the
frozen Act I specs; the derived-status era from the status-derivation checkpoint onward computes
`SENT`/`PARTIAL`/`PAID` from payments.) Project/job status: `ACTIVE`, `ON_HOLD`, `FINISHED`.

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

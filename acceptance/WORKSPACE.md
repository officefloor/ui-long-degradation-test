# The invoice workspace — stream design

The authoring reference for `checkpoints.yaml` and `acceptance/specs`. The agent never sees it. It
sees only one request and its one test at a time, plus the harness's `AGENTS.md`. The reasoning is
in `docs/STREAM_RESTRUCTURE_PLAN.md`; this file is the specification every checkpoint is written
against.

## 1. The point

**The problem is concentrated, so the solution must be too.** All 250 requests pile complexity
onto one screen and three entities. The problem never spreads out in a way that would let the
solution spread out with it. The question is how each architecture copes with concentrated
complexity: where it puts it, whether that placement still allows change, where it breaks, and how
it behaves once it has broken.

- **One screen**, the invoice workspace, at `/`. No request adds a page, a route or a navigation
  entry. Every request makes this screen, and the few handlers behind it, do more.
- **Three entities**: the client, the invoice (with its lines) and the payment (with its
  allocations). A new concept is a field, a state or a rule on one of these three, never a fourth
  entity with a screen of its own.
- **The amount only climbs.** Every addition adds a rule that interacts with what is already there.
- **Every fourth request mutates** a rule or algorithm already in place.
- **At least three concentrated algorithms per act** (section 5).
- **Overstress early.** Act I builds and loads the spine; there is no gentle breadth act.

**Intensity: do not hold back.** The stream exists to break the architecture and show the
degradation. Prefer requests where one user action on the workspace must trigger several
interacting rules at once. For example, adding a line re-runs the discount allocation, tax,
rounding, totals, status and payment reference. That makes the backend's handling of those few
actions (create or update an invoice, add or edit a line, send, record a payment) dense, and denser
with every act. Avoid requests that a new, isolated endpoint or component could satisfy without
touching that shared handling. Each new rule changes the result of at least one existing rule in
the same test, and the test asserts the combined figure.

## 2. Structure

| act | checkpoints | theme |
|---|---|---|
| I | 1–50 | build the spine fast: clients, invoices, lines, discounts, tax, totals, send, payments, status |
| II | 51–100 | money over time: allocation, deposits, credit notes, refunds, retention, instalments, interest, currency |
| III | 101–150 | rules that interact: tax by region, reverse charge, tiered pricing, rate cards, minimums, surcharges, cash rounding |
| IV | 151–200 | cross-cutting states: approvals, credit limits and holds, disputes, recurring billing with proration, milestones |
| V | 201–250 | keep loading: credit and rebill, adjustment notes, sent snapshots, dunning, revised algorithms |

- **Cadence.** Checkpoint `n` is mutative when `n % 4 == 0`, so every act has 12 or 13 mutations.
  A mutative checkpoint lists `mutates:` (the earlier checkpoints whose behaviour it changes) and
  ships updated copies of their specs in `acceptance/specs/cpNN/`, with `retires:` for any test a
  copy drops.
- **A mutation changes a result.** The rule or algorithm it revises is on the spine, and its test
  shows the old result giving way to the new one. It never just restyles a view.
- **Algorithms.** At least three checkpoints per act carry `algorithm: <name>` (section 5). The
  checkpoint that later revises an algorithm carries the same name with `-revised`.
- **Reversals.** One per act from Act II: a mutation that removes or replaces accumulated spine
  complexity. Later requests then build on what it left.
- **The `area:` field is not used.** Everything is the spine.

## 3. The screen and its vocabulary

Every spec starts with `await resetAndSeed({...})` then `await page.goto('/')`. It never navigates
anywhere else: no `nav-*` clicks and no other URL. Everything happens inside `data-testid="workspace"`.

**Selection model.** The workspace lists clients. Clicking a client row selects it and lists its
invoices. Clicking an invoice row opens that invoice in the invoice panel on the same screen. Later
acts add panels, figures and controls to the same screen.

| region | testids (established in Act I; later acts add, never rename) |
|---|---|
| root | `workspace` |
| clients | `client-list`, rows `client-row-<id>` with `client-name`, `client-email`; form `client-form-name`, `client-form-email`, `client-form-submit`, `client-form-error` |
| a client's invoices | `invoice-list`, rows `invoice-row-<id>` with `invoice-number`, `invoice-status`, `invoice-total`, `invoice-due`; `invoice-new` creates a draft for the selected client |
| invoice panel | `invoice-panel`; header `invoice-panel-number`, `invoice-panel-status`; lines `line-row-<id>` with `line-description`, `line-qty`, `line-unit-price`, `line-amount`; line form `line-form-description`, `line-form-qty`, `line-form-unit-price`, `line-form-submit`, `line-form-error`; figures `invoice-subtotal`, `invoice-discount`, `invoice-tax`, `invoice-grand-total`, `invoice-paid`, `invoice-amount-due`; action `invoice-send` |
| payments | `payment-form-amount`, `payment-form-date`, `payment-form-submit`, `payment-form-error`; rows `payment-row-<id>` with `payment-amount`, `payment-date` |

**Naming rules.**
- A row is `<thing>-row-<id>`, using the record's id.
- A value inside a row is read as `getByTestId('<thing>-row-<id>').getByTestId('<value>')`.
- A form's error is `<form>-error`.
- A new value on the invoice panel is `invoice-<name>`.
- A data-testid, once introduced, is never renamed. It is removed only when a request removes its
  feature (AGENTS.md §2).

## 4. Data and conventions

**Fixture vocabulary.** It starts small and grows. Each field must appear in a *visible* spec at or
before the first hidden copy that uses it (`checkpoint_lint` enforces this).

```js
{
  asOf: '2026-03-01',                                   // the test's "today" (AGENTS.md §4.1)
  clients:  [{ id, name, email /* later: currency, region, taxNumber, terms, creditLimit, ... */ }],
  invoices: [{ id, clientId, status, issueDate, dueDate,
               lineItems: [{ id, description, qty, unitPrice /* later: discountPct, taxRate, ... */ }]
               /* later: discountPct, discountAmount, ... */ }],
  payments: [{ id, clientId, amount, date, allocations: [{ invoiceId, amount }] }],
  settings: { /* later: tax rates, currency rates, holidays, thresholds ... */ },
}
```

There are no projects, jobs or tasks. An invoice belongs directly to a client.

**Conventions.**
- **Money:** home currency USD, shown as `$1,234.50`, negative as `-$12.00`. Other currencies use
  their own symbol and rounding step (JPY `¥16,667` whole units, CHF to 0.05).
- **Dates:** shown as `yyyy-mm-dd`.
- **Today:** any date-dependent assertion seeds `asOf`, and dates sit far from any boundary unless
  the boundary is the point of the test.
- **Invoice numbers:** derived from the invoice id (section 5, A1). A seeded invoice with id 7 has a
  known number.
- **Audit lines:** `EVENT key=value ...` with money as plain decimals (`total=100.00`), for side
  effects the UI cannot show.
- **Exact figures:** every expected value is either computed with
  `acceptance/reference/algorithms.py` or carries its arithmetic in a comment (`// 3 x 80 = 240`).
  No figure is written by hand without one or the other.

## 5. The algorithms

Each one is defined exactly in `acceptance/reference/algorithms.py`. The request states the rule in
plain words, with its key parameters. The visible spec asserts values that only a correct
implementation produces, including at least one case that a naive or near-miss implementation gets
wrong (rounding direction, tie-breaks, a month boundary).

| act | algorithm (`algorithm:` name) | reference function | what the tests must pin |
|---|---|---|---|
| I | `luhn-invoice-number` | `invoice_number_luhn` | `INV-` + 6-digit id + Luhn digit; several ids |
| I | `rf-payment-reference` | `rf_reference`, `rf_valid` | ISO 11649 reference from the invoice number's digits, grouped in fours; reject a mistyped reference on payment entry |
| I | `largest-remainder-discount` | `largest_remainder` | an invoice discount split across lines in proportion, shares summing exactly, the leftover cents to the largest remainders, ties to the lower line id |
| II | `annuity-instalments` | `annuity_schedule` | equal monthly payment, the interest/principal split, the last instalment clearing exactly |
| II | `compound-late-interest` | `compound_interest` | daily compounding over Actual/365 on the overdue balance |
| II | `fx-triangulation` | `triangulate` | conversion through USD with the target currency's rounding (JPY, CHF) |
| III | `tiered-pricing` | `tiered_price` | progressive bands, each band at its own price |
| III | `tax-inclusive-reconcile` | `tax_inclusive_split` | per-line net and tax that reconcile to the invoice tax to the cent |
| III | `cash-rounding` | `cash_rounding` | cash totals to the nearest 0.05, with the adjustment shown |
| III | `tax-number-check` | `tax_number_check`, `tax_number_valid` | two letters + ten digits, the last two 97 minus the first eight mod 97 (0 gives 97); reject a near miss |
| III | `tiered-pricing-revised` | `tiered_slice` | the bands counted across all of an invoice's lines of a unit type, each line its exact slice |
| III | `tax-inclusive-reconcile-revised` | `tax_inclusive_split` per rate | each rate's lines reconciled on their own, line rates honoured |
| III | `cash-rounding-revised` | `cash_rounding_revised` | cash due always rounded down to 0.05, in the client's favour |
| IV | `calendar-proration` | `calendar_prorate` | daily proration across a month boundary (different month lengths) |
| IV | `remittance-matching` | `jaro_winkler` | best open invoice for remittance text, above a stated similarity threshold |
| IV | `payment-risk-score` | `ewma_days_to_pay`, `risk_band` | weighted average of days to pay, oldest first, and its band |
| IV | `calendar-proration-revised` | `calendar_prorate_revised` | a day rate of monthly x 12 / 365 times the days, rounded once; a whole month is no longer the monthly price |
| IV | `remittance-matching-revised` | `jaro_winkler` | a 0.90 threshold (0.888 no longer matches) and ties to the larger amount due |
| IV | `payment-risk-score-revised` | `ewma_days_to_pay` (alpha 0.5), `risk_band_revised` | days late instead of days to pay, bands LOW < 5, MEDIUM < 15, HIGH from 15 |
| V | `duplicate-fingerprint` | `fingerprint` | the same lines in another order or casing are flagged as a duplicate; the first 8 hex characters shown |
| V | `business-day-calendar` | `add_business_days`, `business_days_between` | due dates and ageing that skip weekends and listed holidays (with a holiday calendar in settings) |
| V | `dunning-escalation` | `dunning_level` | levels that never skip a step, from days overdue and reminder history |
| V | `duplicate-fingerprint-revised` | `fingerprint_revised` | lines with the same description and price merged before hashing, so a split line still matches |
| V | `business-day-calendar-revised` | `observed_holidays` | a Saturday holiday observed on the Friday before, a Sunday one on the Monday after |
| V | `dunning-escalation-revised` | `dunning_level_revised` | from 10 days; every later level only 14 days after the reminder before it |
| V | `luhn-invoice-number-revised` | `invoice_number_mod11`, `rf_reference` | check character to ISO 7064 MOD 11-2 (including `X`) for invoices issued from 2026-07-01; the RF reference built from it |

Each act may add more algorithms than the minimum. A revised version of an earlier algorithm is a
mutation, and counts towards the act it lands in.

## 6. Authoring rules (every checkpoint)

1. **The request** is what a user who can see the workspace would type: plain English, about the
   workspace, with no checkpoint numbers and no mention of tests or harness. It states an
   algorithm's rule and key parameters exactly enough to implement.
2. **The visible spec** binds only to data-testids and the audit file, seeds every field it needs,
   and asserts the rule's effect in at least one case where a wrong implementation would differ.
   Its comments describe behaviour only. They never mention replacement copies, mutates,
   "MUTATIVE" or later checkpoints (`checkpoint_lint` enforces this).
3. **An addition adds a rule** that existing behaviour must account for: discounts, tax, totals,
   payments and status, as relevant. A request that only shows existing data in a new place is not
   allowed.
4. **A mutation's copies** carry forward every still-valid test and assertion of the version in
   force (the latest copy, not the original), adjusted to the new rule. A test that is deliberately
   dropped goes in `retires:` as `<basename>::<title>`, and the mutated checkpoint must be in
   `mutates:`.
5. **Hidden copies seed nothing new.** A field a copy seeds must already appear in some visible
   spec at or before that checkpoint.
6. **No early pass.** A request must not be satisfiable by what earlier requests already demand.
   If it might be, its test must include a case that distinguishes the new rule.
7. **Consistency forward.** When a request changes a rule, every later request and spec that
   depends on it is updated in the same change.

## 7. Checks after each act

- `.venv/bin/python -m harness.checkpoint_lint --config config.yaml`: cadence, single screen,
  algorithms per act, hidden fields, retirements, process leaks, duplicate keys.
- Compile: every spec passes `npx playwright test --list`.
- The test-data contract builds at every checkpoint (`harness.fixtures.fixture_contract`).
- `.venv/bin/python -m acceptance.reference.algorithms`: the reference worked examples still hold.
- `.venv/bin/python acceptance/reference/verify_specs.py`: every figure a spec asserts is the
  registry's, with the spec's own seed.
- `.venv/bin/python acceptance/reference/check_scenarios.py`: no figure changes at a checkpoint that
  does not mutate its spec.
- `.venv/bin/python acceptance/reference/check_actions.py`: no send a test performs starts or stops
  being refused at a checkpoint that does not mutate its spec (cp161's risk band once refused sends
  in cp51, cp154 and cp160), and no test reads a payment or client row before it can exist (cp147
  once read its payments in the wrong order).
- These check the specs against the model, not the model against the request. A figure the model
  and the spec agree on can still be one the request text does not give (cp218's interest periods,
  cp250's risk score): when authoring, recompute the tricky figures from the request alone.
- The specs and the Act II–V sections of `checkpoints.yaml` are generated: edit
  `act<N>_authoring/` and re-run its `build.py` (Acts II to V, in that order), never the output.

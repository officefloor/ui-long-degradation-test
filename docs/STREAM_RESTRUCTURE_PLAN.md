# Checkpoint stream restructure — plan

Status: **applied (October 2026).** `checkpoints.yaml` and `acceptance/specs` are the stream this
plan describes; its specification is `acceptance/WORKSPACE.md`. There is one harness and one stream: `checkpoints.yaml` and
`acceptance/specs` are rewritten in place. Earlier runs, and the stream they used, stay available
in git history.

## 1. Why

Run 202610100208 (angular-spring, one chain, the current stream) never put the architecture under sustained
stress:

- **The pressure was spread out, not concentrated.** The stream used three money screens (invoice,
  statement, dashboard). Only about 28% of the app's complexity ever sat on them; it settled there
  by request 85 and stayed. On the front end it was 13%, because nearly every feature got a page of
  its own.
- **The stress arrived late, if at all.** Pressure on the invoice code peaked in Act II, fell to 10%
  through Act IV's read-only reports, and returned only in the final 10 requests, with nothing after
  them.
- **The problem stopped growing.** Complexity added per request fell from 10.2 (Acts I–II) to 6.4
  and then 5.0. The amount ended 13% below a steady line.
- **The calculations were all the same kind:** arithmetic on money. PetClinic's stream included
  concentrated algorithms (a Luhn check digit, SHA-256-derived identities, Soundex matching), which
  put dense logic in one place. This stream had none.
- **The impact gate never fired:** the highest grade was the 82nd percentile, against a threshold
  of 98.

## 2. What the stream is for

**Find where the architecture breaks, as early as possible, then watch how it behaves under further
stress.** The long horizon is not there to be fair to the architecture or easy on it. It's there to
overstress the system early and then keep loading it, so the run shows the break point and
everything after it.

Principles:

1. **One screen, one spine.** All 250 requests land on one screen, the **invoice workspace**: the
   way Google or Facebook is one screen with ever more complex behaviour behind it. Its entities
   are few: the **client**, the **invoice** and the **payment**. The backend logic stays on those
   entities, behind the few handlers that serve that screen. No request adds another page. Each one
   makes the workspace do more.
2. **Overstress early.** The first act builds the spine fast and loads it with complexity, so that
   by about request 50–60 the spine is already at the edge. There is no breadth-first act.
3. **The amount keeps climbing.** Complexity added per request holds level or rises for all 250
   requests (a straight line or steeper), so placement keeps being negotiated.
4. **Mutate what is there.** Every fourth request (positions 4, 8, 12, …) mutates complexity
   already in place: a rule, a calculation or an algorithm. Its test shows the old result changing.
   That is the 3:1 rhythm, applied to the accumulated spine.
5. **Algorithms in every act.** At least three per act (at least 15 over the run): precise,
   concentrated logic, unlike even arithmetic. Most get a later mutation to a revised version, as
   PetClinic's identity redesign did.
6. **The spine is measured independently of placement.** Complexity counts as on the spine if it
   serves the workspace screen and its three entities, whichever classes or files it lives in. An
   additive architecture will put it in new classes, and must not be penalised for that.

## 3. Shape: five acts of 50

Equal acts keep the load even. Every act is about 75% additions that add rules or algorithms, and
25% mutations of what is already there.

| act | requests | theme on the workspace | algorithms (≥ 3) |
|---|---|---|---|
| I | 1–50 | **Build the spine fast.** The workspace lists invoices for a client; lines, quantities, prices; discounts (percentage, fixed, line-level, capped); tax (per line, exempt lines, tax-inclusive pricing, per-line rounding); totals; send; record payment; status from payments. | **Invoice number with a check digit** (Luhn, later mod-11). **Payment reference** to ISO 11649 (RF creditor reference, mod-97). **Largest-remainder allocation** of an invoice discount across lines, so the cents sum exactly. |
| II | 51–100 | **Money over time.** Part payments and allocation across invoices, deposits, credit notes, refunds, retention and its release, instalment plans, late fees and interest, foreign currency. | **Annuity amortisation schedule** for instalment plans. **Compound interest** with an Actual/365 day count. **FX triangulation** through a base currency, with each currency's rounding rule. |
| III | 101–150 | **Rules that interact.** Tax by jurisdiction and reverse charge, tiered and volume pricing, rate cards from time entries, minimum charges and surcharges, cash rounding. Every one must flow through discounts, tax, payments and status. | **Progressive tiered pricing** across bands. **Tax-inclusive back-calculation** that reconciles rounding to the cent. **Cash rounding to 0.05** with the difference distributed across lines. |
| IV | 151–200 | **Cross-cutting states.** Approvals over thresholds, credit limits and holds, disputes, recurring invoices with proration, milestone and percent-complete billing, all as states and panels on the workspace. | **Calendar proration** by days across month boundaries. **Payment matching** of remittance text to invoices by Jaro–Winkler similarity. **Client risk score** from an exponentially weighted average of days to pay. |
| V | 201–250 | **Keep loading.** Credit-and-rebill, adjustment notes, sent snapshots, dunning, plus revised versions of earlier algorithms and rules. | **Duplicate-invoice fingerprint** (SHA-256 over normalised lines). **Business-day calendar** with holidays, for due dates and ageing. **Dunning escalation** state machine. Plus revised versions of the check digit (mod-11) and the payment reference. |

**Where the current content goes.** Most of the current money rules reappear, compressed into
Acts I–II and moved onto the workspace. The current stream's other pages (dashboard, reports, statement, task and job screens) become
panels or figures on the workspace when they add a rule. Pure display features are dropped.

**Reversals.** Spread through the acts, not saved for the end: one in each act from II on. Each
removes or replaces accumulated complexity on the spine, and is followed by requests that build on
what it left (decision 4).

**Control region.** The current stream keeps about 20% of requests on unrelated screens, as a
low-pressure comparison. The restructured stream drops it (decision 2).

## 4. Finding the break point

The analysis has to say **when** the architecture broke and **what happened after**. Proposed break
signals, reported per checkpoint and per chain:

| signal | break when |
|---|---|
| change impact | a change grades above the gate's threshold (recalibrated for the restructured stream before any gated run) |
| spine handler complexity | the cognitive complexity of the method(s) behind the workspace passes a threshold, e.g. 25 |
| regressions | the first true regression; then regressions per 10 requests |
| effort | agent cost or turns per request more than double the Act I median |
| rework | settled lines rewritten above, e.g., 30% of lines touched, over a rolling 10 requests |

`summary.md` gains a **break point** section: the first checkpoint each signal fired, and the
trajectory over the next 50 and 100 requests (regression rate, cost, rework, amount added). That
is "how does it handle further stress after that point", in numbers.

## 5. Keeping the stream honest: lint checks

Static checks in `harness.checkpoint_lint`, before a run is paid for:

| check | rule |
|---|---|
| **single screen** | every own spec navigates only to the workspace (no other `nav-*` target) |
| **algorithms per act** | at least 3 checkpoints per act carry `algorithm: <name>` in `checkpoints.yaml` |
| **mutations hit the spine** | every mutative's `mutates` targets an earlier spine checkpoint (all of them are, once restructured) |
| **additions add something** | each additive spec introduces a new seed field, input or rule-bearing value; display-only additions are flagged |
| **existing checks** | cadence (3:1), hidden-field visibility, coverage carried forward (`retires:`), no process leaks |

After a run: the amount (straight line or steeper), the spine share (target **at least 80% of new
complexity on the spine in every act**; with one screen and no breadth act it should be well
above), and the break-point section.

## 6. How it would be built

The stream is rewritten in place: about 250 requests and their specs.

1. **Agree this plan** (section 7).
2. **Write the lint checks first**, with an `algorithm:` field and a single-screen check.
3. **Author one act at a time:** requests, visible specs, replacement copies with `retires:`, and
   the algorithms with exact worked values (as PetClinic's specs gave). Lint and compile after each
   act.
4. **Validate each act with a calibration run.** No implementation of the restructured stream exists yet, so a test
   can't be checked against a "before" app as in fixes 10–12. Instead, a one-chain run of each act
   on one stack shows whether every test is satisfiable and unambiguous. Defects found are fixed
   before the next act is authored.
5. **Then the full experiment:** ten chains per stack.

Effort: substantial, about 250 checkpoints. Authoring an act is comparable to fix 10, plus its
calibration run.

## 7. Decisions

| # | question | decision |
|---|---|---|
| 1 | the one screen | **The invoice workspace**: entities client, invoice and payment. |
| 2 | control region | **Dropped.** All 250 requests are on the spine. |
| 3 | algorithms | **The section 3 list**: at least 3 per act, 15 in total, plus revised-version mutations. Open to swaps while each act is authored. |
| 4 | reversals | **One per act from Act II**, removing or replacing accumulated spine complexity, followed by requests that build on it. |
| 5 | length | **250** (five acts of 50). |
| 6 | earlier stream | **Not kept alongside.** One harness, one stream: `checkpoints.yaml` and `acceptance/specs` are rewritten in place. Earlier runs and their stream are in git history. |

Decisions 1, 2 and 6 were set by the user. Decisions 3–5 take this plan's proposals; they
can be changed before the act they affect is authored.

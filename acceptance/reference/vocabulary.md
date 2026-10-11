# Workspace vocabulary (state after cp250, end of Act V)

The stream ends at cp250; anything added later builds on this exactly: never rename a testid or a fixture
field. "from" is the checkpoint that introduced it (later checkpoints may have changed its rule; see "Rules in
force").

## data-testids (all inside `workspace`, at `/`)

### Act I (cp01-50)

| region | testid | from |
|---|---|---|
| root | `workspace` | cp01 |
| clients | `client-list`; rows `client-row-<id>` with `client-name`, `client-email` | cp01 |
| | `client-balance`, `client-overdue` (row values) | cp25 |
| client form | `client-form-name`, `client-form-email`, `client-form-submit`, `client-form-error` | cp01/02 |
| | `client-form-terms` | cp35 |
| | `client-form-discount-pct` | cp47 |
| | `client-form-tax-exempt` (checkbox) | cp49 |
| invoice list | `invoice-list`; rows `invoice-row-<id>` with `invoice-status`, `invoice-total`, `invoice-due` | cp03 |
| | `invoice-issue` (row value); `invoice-new` | cp05 |
| | `invoice-number` (row value) | cp07 |
| | ~~`invoice-allocate`~~ removed by cp76 (the reversal); assert `toHaveCount(0)` only | cp21 |
| | `invoice-send-all` | cp38 |
| lookup | `invoice-lookup-input`, `invoice-lookup-submit`, `invoice-lookup-error` | cp07 |
| invoice panel | `invoice-panel`, `invoice-panel-status`, `invoice-subtotal`, `invoice-grand-total` | cp05 |
| | `invoice-panel-number` | cp07 |
| | `invoice-discount` (amount taken off, positive) | cp09 |
| | `invoice-tax` | cp10 |
| | `invoice-send`, `invoice-send-error` | cp11 |
| | `invoice-paid`, `invoice-amount-due` | cp15 |
| | `invoice-reference` (RF, groups of four) | cp18 |
| | `invoice-void`, `invoice-void-error` | cp26 |
| | `invoice-duplicate` | cp34 |
| | `invoice-paid-date` (present only while fully paid) | cp39 |
| | `invoice-written-off` | cp40 |
| | `invoice-discount-reason` | cp41 |
| | `invoice-due-input`, `invoice-due-submit`, `invoice-due-error` | cp46 |
| lines | `line-row-<id>` with `line-description`, `line-qty`, `line-unit-price`, `line-amount` | cp05 |
| | `line-discount-share` | cp13 |
| | `line-discount` (line's own discount) | cp19 |
| | `line-tax` | cp20 |
| | `line-remove` | cp31 |
| | `line-edit` (loads the line into the line form) | cp42 |
| line form | `line-form-description`, `line-form-qty`, `line-form-unit-price`, `line-form-submit`, `line-form-error` | cp06 |
| | `line-form-exempt` (checkbox) | cp14 |
| | `line-form-discount-pct` | cp19 |
| | `line-form-tax-rate` | cp33 |
| discount form | `discount-form-pct`, `discount-form-submit`, `discount-form-error` | cp09 |
| | `discount-form-amount` | cp27 |
| | `discount-form-cap` | cp29 |
| | `discount-form-reason` | cp41 |
| payments | `payment-form-amount`, `payment-form-date`, `payment-form-submit`, `payment-form-error` (client level, visible with a client selected) | cp15 |
| | rows `payment-row-<id>` (in the panel: payments touching the open invoice) with `payment-amount`, `payment-date` | cp15 |
| | `payment-form-reference`; row value `payment-reference` | cp18 |
| | row value `payment-allocated` (part on this invoice, in the client's currency) | cp21 |
| | row action `payment-reverse` | cp30 |

### Act II (cp51-100)

| region | testid | from |
|---|---|---|
| clients | `client-credit` (row value: unused credit) | cp51 |
| | `client-apply-credit` (button), `client-apply-credit-error` | cp81 |
| client form | `client-form-currency` (a `<select>`: USD, EUR, GBP, JPY, CHF) | cp59 |
| | `client-form-early-pct`, `client-form-early-days` | cp62 |
| | `client-form-retention-pct` | cp75 |
| | `client-form-grace-days` | cp78 |
| | `client-form-interest-rate` | cp87 |
| payments | `payment-form-deposit` (checkbox) | cp51 |
| | `payment-reverse-error` | cp53 |
| | `payment-form-currency` (a `<select>`) | cp61 |
| refund form (client level) | `refund-form-amount`, `refund-form-date`, `refund-form-submit`, `refund-form-error` | cp53 |
| | `refund-form-currency` (a `<select>`) | cp79 |
| credit notes | `invoice-credit` (panel button on a sent invoice), `invoice-credited` (figure) | cp54 |
| | `line-credit` (row action on a sent invoice's line) | cp89 |
| retention | `retention-form-pct`, `retention-form-submit`, `retention-form-error`; `invoice-retention` | cp55 |
| | `invoice-release-retention`, `invoice-release-error` | cp55 |
| | `retention-form-cap` | cp83 |
| | `retention-release-amount` (input by the release button); `invoice-retention-held` | cp93 |
| plan form | ~~`plan-form-count`, `plan-form-rate`, `plan-form-submit`, `plan-form-error`~~ removed by cp212 (the Act V reversal); assert `toHaveCount(0)` only | cp57 |
| | ~~`plan-form-down`~~ removed by cp212 | cp85 |
| instalments | ~~rows `instalment-row-<n>` with `instalment-due`, `instalment-payment`, `instalment-interest`, `instalment-principal`, `instalment-balance`~~ removed by cp212 | cp57 |
| | ~~`instalment-paid`, `instalment-status`~~ removed by cp212 | cp58 |
| | ~~`instalment-late-interest`~~ removed by cp212 | cp66 |
| | ~~`instalment-late-fee`~~ removed by cp128; assert `toHaveCount(0)` only | cp95 |
| | ~~`instalment-skip`, `instalment-skip-error`~~ removed by cp212 | cp99 |
| invoice panel | ~~`invoice-plan-total`~~ removed by cp212 | cp57 |
| | `invoice-early-discount`; `invoice-settle-amount` (present only while the early window is open) | cp62 |
| | `invoice-interest` | cp63 |
| | ~~`invoice-late-fee`~~ removed by cp128 (the Act III reversal); assert `toHaveCount(0)` only | cp65 |
| | `invoice-waive`, `invoice-waive-error`, `invoice-waived` | cp70 |
| | ~~`invoice-payoff`, `invoice-interest-saved`~~ removed by cp212 | cp71 |
| | `invoice-fx-difference` (US dollars) | cp82 |
| | `invoice-write-off`, `invoice-write-off-error` | cp86 |

### Act III (cp101-150)

| region | testid | from |
|---|---|---|
| client form | `client-form-region` | cp101 |
| | `client-form-tax-number` (refused unless valid, cp102) | cp102 |
| | `client-form-prices-include-tax` (checkbox) | cp106 |
| | `client-form-withholding-pct` | cp117 |
| | `client-form-minimum-charge` (client currency; 0 = none) | cp125 |
| | `client-form-rate-discount-pct` | cp134 |
| | `client-form-exempt-until` (refused without the exemption) | cp135 |
| rate form (client level) | `rate-form-unit`, `rate-form-price`, `rate-form-submit`, `rate-form-error` | cp126 |
| lines | row values `line-unit-type` | cp103 |
| | `line-net` (amount after discount share, less its tax for tax-inclusive prices) | cp106 |
| | `line-billed-qty` (quantity after increment / minimum units) | cp114 |
| line form | `line-form-unit-type` (empty unit price = priced from the card / price list) | cp103 |
| | `line-form-overtime` (checkbox) | cp121 |
| invoice panel | `invoice-reverse-charge` (text `Reverse charge`; present only when reverse charged) | cp102 |
| | `invoice-net` (amount before tax = grand total - tax) | cp106 |
| | `invoice-minimum-charge` ($0.00 when none) | cp107 |
| | `invoice-cash-due`, `invoice-cash-rounding` (signed) | cp109 |
| | `invoice-surcharge`; form `surcharge-form-pct`, `surcharge-form-submit`, `surcharge-form-error` | cp110 |
| | `invoice-withholding` | cp117 |
| | `invoice-supply-region`, `invoice-supply-region-submit` (place of supply, drafts) | cp137 |
| | ~~`invoice-plan-fee`~~ removed by cp212 | cp143 |
| payments | `payment-form-method` (a `<select>`: BANK default, CASH from cp109, CARD from cp111) | cp109 |
| | row value `payment-surcharge` (card surcharge, client currency) | cp111 |
| | row value `payment-fx-fee` (conversion fee, client currency) | cp130 |

### Act IV (cp151-200)

| region | testid | from |
|---|---|---|
| clients | `client-available` (row value: credit limit less balance; only with a limit) | cp153 |
| | `client-hold` (row button, toggles), `client-status` (row value `Active` / `On hold`) | cp154 |
| | `client-risk-score` (one decimal, `-` with no history), `client-risk-band` (`LOW` / `MEDIUM` / `HIGH`) | cp161 |
| client form | `client-form-credit-limit` | cp153 |
| | `client-form-tier` (a `<select>`: STANDARD default, KEY, NEW) | cp166 |
| | `client-form-uplift-pct` | cp186 |
| | ~~`client-form-retention-pct`~~ removed by cp168 (the reversal); assert `toHaveCount(0)` only | cp75 |
| invoice panel | `invoice-approval` (`Not needed`, `Needs approval`, `Approved`; cp182: `Needs 2 approvals`, `Needs 1 more approval`), `invoice-approve`, `invoice-approve-error` | cp151 |
| | `invoice-recurring` (checkbox), `invoice-generate`, `invoice-generate-error` | cp157 |
| | `invoice-dispute`, `invoice-dispute-error`, `invoice-resolve` | cp158 |
| | `invoice-po-input`, `invoice-po-submit`, `invoice-po` | cp159 |
| | `invoice-disputed` (amount in dispute, $0.00 when none) | cp163 |
| | `invoice-recur-until`, `invoice-recur-until-submit` | cp165 |
| | `invoice-resolve-credit` | cp171 |
| | `invoice-next-claim`, `invoice-next-claim-error` | cp173 |
| | ~~`retention-form-pct`, `retention-form-submit`, `retention-form-error`, `retention-form-cap`, `invoice-retention`, `invoice-retention-held`, `invoice-release-retention`, `invoice-release-error`, `retention-release-amount`~~ removed by cp168; assert `toHaveCount(0)` only | cp55-93 |
| lines | row values `line-period` (`<start> to <end>`) | cp155 |
| | row action `line-dispute` | cp163 |
| | row value `line-percent` (e.g. `40%`) | cp167 |
| | row value `line-billed-pct` (e.g. `15%`) | cp173 |
| line form | `line-form-period-start`, `line-form-period-end` | cp155 |
| | `line-form-percent` | cp167 |
| payments | `payment-form-remittance`; row values `payment-match` (matched numbers, comma separated from cp181; empty when none), `payment-match-score` (3 dp) | cp159 |
| milestones | `milestone-form-description`, `milestone-form-pct`, `milestone-form-submit`, `milestone-form-error`; rows `milestone-row-<id>` with `milestone-amount`, `milestone-status`, action `milestone-reach` | cp169 |
| | row value `milestone-due` | cp170 |
| | row action `milestone-dispute` | cp178 |

### Act V (cp201-250)

| region | testid | from |
|---|---|---|
| invoice panel | `invoice-sent-total` (sent invoices), `invoice-current-total` (present only when today's rules give another grand total) | cp201 |
| | `invoice-fingerprint` (8 capital hex characters), `invoice-duplicate-of` (numbers, comma separated; present only for a possible duplicate) | cp202 |
| | `invoice-rebill`, `invoice-rebill-error`, `invoice-replaces`, `invoice-replaced-by` (numbers) | cp203 |
| | `invoice-adjusted` (signed sum of the invoice's adjustment notes) | cp204 |
| | `invoice-promise-amount`, `invoice-promise-date`, `invoice-promise-submit`, `invoice-promise-error` | cp213 |
| | `invoice-update`, `invoice-update-error` | cp215 |
| | `invoice-dunning` (`NONE`, `REMINDER_1`, `REMINDER_2`, `FINAL`, `COLLECTIONS`), `invoice-remind`, `invoice-remind-error` | cp217 |
| | `invoice-reminder-fees` | cp218 |
| lines | the line form, `line-edit` and `line-remove` work on sent invoices again (adjustment notes, cp204); `line-form-percent` on a sent line too (cp225) | cp204 |

Status texts: `Draft`, `Sent`, `Part paid`, `Paid`, `Overdue`, `Void`, `Paid late` (Act I);
`Credit note` (an issued credit note), `Credited` (cleared by credit notes with nothing paid),
`Retention held` (cp55), `Written off` (cp86).
Instalment status texts (cp58): `Paid`, `Part paid`, `Overdue`, `Due`.
Act IV: `Disputed` (cp158), `Awaiting milestone` (cp169); `Retention held` is gone (cp168).
Milestone status texts (cp169/170/178): `Pending`, `Due`, `Part paid`, `Paid`, `Overdue`, `Disputed`.
Act V: `Adjustment` (an issued credit adjustment note, cp204), `Promised` (cp213); a debit adjustment note
has the ordinary invoice statuses. Instalment statuses are gone (cp212).
Invoice numbers: `INV-<6-digit id><Luhn>`; credit notes `CN-<6-digit id><Luhn>` (cp54); adjustment notes
`ADJ-<6-digit id><check>` (cp204). From cp236, anything issued on or after 2026-07-01 (and a draft shown from
then on) takes the ISO 7064 MOD 11-2 check character instead (`invoice_number_mod11`, `X` for 10), and its RF
reference is built from the six digits and that character (`INV-000028X` -> `RF46 0000 28X`).

## Fixture vocabulary

```
asOf
settings: { taxRate,
            usdPer: { EUR, GBP, JPY, CHF },                       cp59 (US dollars per unit)
            lateInterestRate,                                     cp63 (annual %)
            lateFee,                                              cp65; REMOVED by cp128 (copies no longer seed it)
            fxRates: [{ from, currency, usdPer }],                cp74 (dated rates)
            regionTaxRates: { <region>: rate },                   cp101
            homeRegion,                                           cp102
            minimumCharge,                                        cp107 (USD)
            duplicateDays,                                        cp202 (the duplicate window in days)
            holidays: [<date>],                                   cp209 (a business-day calendar, possibly empty)
            reminderFees: { <level>: USD },                       cp218
            dunningMinimum,                                       cp221 (USD)
            cardSurchargePct,                                     cp111
            rates: [{ unitType, unitPrice | tiers, from }],       cp113 (price list, USD; from cp131)
            taxRateChanges: [{ region, from, rate }],             cp115
            regionMaxInterest: { <region>: rate },                cp122
            volumeDiscounts: [{ over, pct }],                     cp123 (over in USD)
            interestThreshold,                                    cp129 (USD)
            fxFeePct,                                             cp130
            regionGraceDays: { <region>: days },                  cp139
            withholdingThreshold,                                 cp141 (USD)
            regionTermsDays: { <region>: days },                  cp142
            planFee,                                              cp143 (USD); REMOVED by cp212 (copies no longer seed it)
            regionRoundDown: [<region>],                          cp146
            cardSurchargeCap,                                     cp147 (USD)
            approvalLimit,                                        cp151 (USD)
            tierApprovalLimits: { <tier>: USD } }                 cp166
clients:  [{ id, name, email, termsDays, discountPct, taxExempt,
             currency,                                            cp59 ('USD' default)
             earlyPayPct, earlyPayDays,                           cp62
             retentionPct,                                        cp75; REMOVED by cp168 (copies no longer seed it)
             graceDays,                                           cp78
             interestRate,                                        cp87
             region,                                              cp101
             taxNumber,                                           cp102
             rates: [{ unitType, unitPrice,                       cp103
                       tiers: [{ units, unitPrice }],             cp105 (last band has no units)
                       increment,                                 cp114
                       minUnits,                                  cp118
                       taxRate,                                   cp127
                       from }],                                   cp131
             pricesIncludeTax,                                    cp106
             withholdingPct,                                      cp117
             minimumCharge,                                       cp125 (client currency; 0 = none)
             rateDiscountPct,                                     cp134
             taxExemptUntil,                                      cp135
             creditLimit,                                         cp153 (client currency)
             onHold,                                              cp154
             tier,                                                cp166 ('STANDARD' default, 'KEY', 'NEW')
             upliftPct }]                                         cp186
invoices: [{ id, clientId, status ('DRAFT'|'SENT'|'VOID'), issueDate, dueDate,
             discountPct, discountAmount, discountCap, discountReason, manualDueDate,
             creditOf,                                            cp54 (makes it a credit note)
             retentionPct, retentionReleasedOn,                   cp55; REMOVED by cp168 (with retentionCap, cp83,
                                                                  and retentionReleasedAmount, cp93)
             instalments, instalmentRate,                         cp57; REMOVED by cp212 (with planDownPct, cp85, and
                                                                  skippedInstalment, cp99; copies no longer seed them)
             interestWaivedOn,                                    cp70
             retentionCap,                                        cp83
             planDownPct,                                         cp85
             writtenOffOn,                                        cp86
             retentionReleasedAmount,                             cp93 (total released so far)
             skippedInstalment,                                   cp99
             surchargePct,                                        cp110
             supplyRegion,                                        cp137
             approvedTotal,                                       cp151 (the grand / plan total approved)
             approvedOn,                                          cp156
             recurring,                                           cp157
             disputedOn,                                          cp158
             poNumber,                                            cp159
             milestones: [{ id, description, pct,                 cp169
                            reachedOn,                            cp169
                            disputedOn }],                        cp178
             approvals,                                           cp182 (approvals of the approved total; 1 if absent)
             recurringSince,                                      cp186
             sentTotal, sentTax,                                  cp201 (the grand total and tax it was sent with)
             rebilledOn, replaces,                                cp203 (seeded from cp222)
             adjustmentOf,                                        cp204 (seeded from cp206; negative quantities = a credit note)
             promiseAmount, promiseDate, promisedOn,              cp213
             reminders: [<date>],                                 cp217 (the dates reminders went out)
             -- seeded in Act V: recurringFrom, recurUntil (cp227), disputeResolvedOn, disputeCredit (cp234)
             -- recorded by actions, not yet seeded: claimFrom (cp173)
             lineItems: [{ id, description, qty, unitPrice, taxExempt, discountPct, taxRate,
                           creditOfLine,                          cp89 (credit-note line)
                           unitType,                              cp103 (no unitPrice = priced from a card)
                           overtime,                              cp121
                           periodStart, periodEnd,                cp155 (service period)
                           disputed,                              cp163
                           percentComplete,                       cp167
                           billedPct }] }]                        cp173 (seeded from cp225)
                           -- recorded, not seeded: carriedInterest (cp214), adjustsLine (cp234)
payments: [{ id, clientId, amount, date, reference, reversed,
             currency,                                            cp61/74 (the currency paid in)
             refunded,                                            cp53 (client currency)
             creditNote,                                          cp56 (credit from a credit note)
             method,                                              cp109/111 ('BANK' default, 'CASH', 'CARD')
             remittance,                                          cp159 (seeded from cp226)
             allocations: [{ invoiceId, amount,                   amount in the client's currency
                             date }] }]                           cp51 (applied-credit date)
```

A payment's unallocated, unrefunded part, less its card surcharge (cp111) and conversion fee (cp130),
is the client's credit (cp51). A payment with no allocations and a `reference` to a draft is a deposit
held for that draft (cp67). An allocation with its own `date` is credit used automatically (cp51),
which cp69 lets a void hand back. A cash allocation may exceed what the invoice owed by its cash
rounding (cp109). Sending fixes a card price on its line as `unitPrice` (cp126).

## Audit lines

```
INVOICE_SENT id=<id> number=<INV-...> total=<grand>        cp11
PAYMENT_RECORDED id=<pid> invoice=<iid> amount=<applied>   cp15 (one per invoice from cp21; also for credit used)
INVOICE_REOPENED id=<id>                                    cp16
INVOICE_VOIDED id=<id> number=<INV-...>                     cp26
PAYMENT_REVERSED id=<pid> amount=<payment amount>           cp30
INVOICE_DUPLICATED from=<INV-...> to=<INV-...>              cp34
INVOICE_WRITTEN_OFF id=<id> amount=<amount>                 cp40 (small balance), cp86 (by hand)
DEPOSIT_RECORDED id=<pid> client=<cid> amount=<amount>      cp51
CREDIT_HELD payment=<pid> amount=<amount>                   cp52 (overpayment), cp56 (credit-note excess)
CREDIT_REFUNDED payment=<pid> amount=<amount>               cp53 (client currency, cp79)
CREDIT_NOTE_ISSUED id=<id> number=<CN-...> invoice=<orig> total=<grand>   cp54 (instead of INVOICE_SENT)
RETENTION_RELEASED id=<id> amount=<released>                cp55 (part from cp93)
EARLY_DISCOUNT id=<id> amount=<discount>                    cp62
CREDIT_RETURNED payment=<pid> amount=<amount>               cp69
INTEREST_WAIVED id=<id> amount=<interest + fee waived>      cp70
PLAN_SETTLED id=<id> saved=<interest saved>                 cp71
FX_DIFFERENCE id=<iid> payment=<pid> amount=<USD, signed>   cp82
INSTALMENT_SKIPPED id=<iid> instalment=<n>                  cp99
REVERSE_CHARGE id=<id> number=<INV-...> total=<grand>       cp102 (after INVOICE_SENT)
CASH_ROUNDING id=<iid> amount=<signed adjustment>           cp109
CARD_SURCHARGE payment=<pid> amount=<surcharge>             cp111 (before PAYMENT_RECORDED)
WITHHOLDING id=<id> amount=<withheld>                       cp117 (on send)
FX_FEE payment=<pid> amount=<fee>                           cp130 (before PAYMENT_RECORDED)
TAX_CHARGED id=<id> rate=<rate> net=<net> tax=<tax>         cp150 (one per rate, lowest first, after INVOICE_SENT)
INVOICE_APPROVED id=<id> total=<grand or plan total>        cp151 (one per approval, cp182)
CLIENT_HELD id=<cid> / CLIENT_RELEASED id=<cid>             cp154
INVOICE_GENERATED from=<INV-...> to=<INV-...>               cp157 (then INVOICE_SENT when sent at once, cp175)
INVOICE_DISPUTED id=<id> amount=<amount in dispute>         cp158 (lines cp163, milestones cp178)
DISPUTE_RESOLVED id=<id>                                    cp158 (also when paid, cp172; with credit, cp171)
MILESTONE_REACHED id=<iid> milestone=<mid> amount=<amount>  cp169
PROGRESS_CLAIM from=<INV-...> to=<INV-...>                  cp173
INVOICE_REBILLED from=<INV-...> to=<INV-...>               cp203 (after the credit note's CREDIT_NOTE_ISSUED)
ADJUSTMENT_ISSUED id=<id> number=<ADJ-...> invoice=<orig> total=<signed total>   cp204 (on sending a draft note, cp210)
PAYMENT_PROMISED id=<id> amount=<amount> date=<date>        cp213
INTEREST_CARRIED from=<INV-...> to=<INV-...> amount=<interest>   cp214
INVOICE_UPDATED id=<id> from=<old total> to=<new total>    cp215
REMINDER_SENT id=<id> level=<level>                         cp217 (one per overdue debit note too, cp233)
REMINDER_FEE id=<id> amount=<fee>                           cp218
```
RETENTION_RELEASED is no longer written (cp168); PLAN_SETTLED and INSTALMENT_SKIPPED are no longer written (cp212).
WITHHOLDING is also written when a debit adjustment note is issued (cp205). INTEREST_WAIVED is also written when a
promise is kept (cp241). INVOICE_WRITTEN_OFF is also written for each debit note written off with its invoice (cp250). CREDIT_HELD is also written for a held client's payment
(cp154/160).
INTEREST_WAIVED writes the unpaid interest only from cp128 (no fee).

Money in audit lines is a plain decimal in the client's currency (`amount=48.65`; whole yen
`amount=16667`, cp59); FX_DIFFERENCE is in US dollars.

## Rules in force at cp250 (Act V; these take precedence over the earlier sections)

**Instalment plans are gone** (cp212, the reversal): no plan form, instalments, plan total, plan fee, payoff,
interest saved or skipping; every invoice is due in full, judged for approval on its grand total, and has credit
used on it when sent. A promise to pay (cp213) took their place for clients who are behind: an overdue invoice is
Promised (not overdue for holds, overdue amounts or the payment order; interest still runs) until its date unless
the payments since reach the amount; a broken promise takes no new one.

**Sent snapshots** (cp201): sending keeps sentTotal/sentTax; a sent invoice owes what it was sent for (its
withholding, interest and balance follow), shows `invoice-sent-total`, and `invoice-current-total` when today's
rules differ. Update (cp215) makes today's figures the sent ones (refused with no difference, below what is paid,
or over the credit limit).

**Duplicates** (cp202/208, `fingerprint_revised`): SHA-256 over '<client id>|' + the sorted lines
'<description lower-cased, spaces collapsed>,<qty without trailing zeros>,<unit price cents>', after merging lines
with the same description and price; the panel shows the first 8 characters in capitals. A draft matching an
invoice sent within settings.duplicateDays, or an earlier draft, is a possible duplicate and needs approval. A sent
invoice's fingerprint is over its lines as adjusted, and a line change that would make it a duplicate is refused
(cp207). Rebilled, fully credited and replaced invoices never count (cp203).

**Adjustment notes** (cp204): a line change on a sent invoice never reopens it. An added line is a debit note
(sent like any invoice today: credit used, due by the usual terms; due at once with no grace when its invoice is
overdue, cp243); a removed line is a credit note (comes off what the invoice owes; any excess pays the invoice's
unpaid debit notes and then is credit, cp246; never takes the invoice below its minimum charge, cp242); a quantity
change is one note for the difference; any other edit is one note for the change in the line's amount (cp244;
cp204 had a credit and a debit note). Notes are priced and taxed like the invoice (its date, region and rates;
banded units continue its bands, cp229; other currencies at its date rate, with the FX difference measured from
it, cp230), carry its percentage discount and surcharge (cp205) and purchase order (cp226), and withhold on their
own amount, the threshold judged on invoice and notes together (cp205). A debit note that needs approval, or for a
client on hold, waits as a draft (cp210/249). Paying the invoice (open, named or matched by remittance) pays its
debit notes next, and a spread payment pays a note straight after its invoice (cp206/226). A percent-complete
change bills the difference (cp225); generating copies the lines as adjusted (cp227); a disputed line taken off
leaves the dispute and the last one resolves it with credit (cp234); credit notes lower the early-payment
discount and debit notes get none (cp231); notes are chased with their invoice (cp233) and written off with it
(cp250). A sent invoice's discount can't be changed.

**Credit and rebill** (cp203): a credit note for exactly the sent figures and a replacement draft (the lines
repriced today, with the percentage discount, surcharge and PO), the money paid held as credit for it; it carries
an open dispute, milestones, a recurring plan and, when not higher, the approval (cp211); late interest owed goes
onto it as an untaxed "Late interest <number>" line (cp214); reminders move with it and it keeps the old due date
(cp222). Refused once a final notice has gone out.

**Business days** (cp209/220/235/237): with settings.holidays, terms, risk caps, grace, the early window,
milestone terms and approval lifetimes count business days (`add_business_days`); a weekend holiday is observed on
the Friday before or the Monday after (`observed_holidays`); a due date set on sending moves off a weekend or
holiday; a payment dated on one counts from the next business day.

**Dunning** (cp217/228, `dunning_level_revised`): levels from the days since the due date (business days with a
calendar) and the days overdue at each reminder: NONE under 10, REMINDER_1 from 10, REMINDER_2 from 21, FINAL from
45, COLLECTIONS from 60, each later level only 14 days after the reminder before it; only Overdue invoices (not
disputed or promised) with at least settings.dunningMinimum overdue (with their notes, cp221/233). Remind sends the
next level's reminder. Fees (settings.reminderFees, cp218) are owed after the invoice and before interest. An
unpaid second reminder: the client's drafts need approval (cp219) and a 30% deposit (cp238). An unpaid final
notice: on hold (cp219), 2 points more interest from its date (cp223), counted in the risk score as if paid today
(cp240), and at most 7-day terms for 90 days after it (cp245). Collections stops interest (cp223) and writes the
invoice off 30 days later (cp239).

**Interest and risk**: the regional cap applies to the usual rate only; the 3 points for a HIGH client and the 2
after a final notice go on top (cp232). A HIGH client has no grace (cp216). A kept promise waives the interest that
ran while it stood (cp241), and a promise covers the invoice's debit notes (cp247).

**Approval**: covers any total up to the one approved, within its lifetime (cp224; cp156 needed the exact total).

**Payment order** (cp248): overdue invoices highest dunning level first, then oldest due date (lower id); then the
smallest amount due; disputed amounts last; a debit note straight after its invoice. A held client's payment still
pays overdue invoices oldest due date first.

**Invoice numbers** (cp236): issued on or after 2026-07-01, ISO 7064 MOD 11-2 (`invoice_number_mod11`), the RF
reference built from the six digits and the check character; earlier invoices keep their Luhn numbers.

## Rules in force at cp200 (what Act V builds on)

**Retention is gone** (cp168, the reversal): no retention fields, figures, release or `Retention held`; an
invoice owes its whole amount; credit-note excess goes straight to credit; any invoice may take a plan or an
early-payment discount; interest and overdue amounts are on the whole invoice. Milestones (cp169) took its
place as the way to hold money back.

**Approval** (`invoice-approval`, drafts)
- Needed when the amount (grand total before withholding; cp189: the plan total when the draft has a plan)
  is over the approval limit (settings.approvalLimit, or settings.tierApprovalLimits[tier], cp166; halved for
  a MEDIUM-risk client, cp194; USD converted down at the invoice's date rate), when the invoice discount takes
  off more than a fifth of the subtotal (cp152, replacing cp41's reason), for every HIGH-risk client (cp161),
  and when sending would take the client over their credit limit (cp180, counting committed drafts, cp190).
- Two approvals (invoices[].approvals) over 1.5 x the limit and for every HIGH-risk client (cp200; cp182 had 2 x).
- An approval is for the exact amount and lapses after 30 days (cp156); 90 days for KEY, 7 for NEW (cp191).
  Approve writes INVOICE_APPROVED; approving what needs none is refused. Credit notes never need approval.

**Credit limit and hold**
- clients[].creditLimit (cp153); `client-available` = limit - (balance - amounts in dispute, cp183) - approved
  drafts' totals less withholding (cp190); a HIGH-risk client's limit counts as half, rounded down (cp198).
- Sending: refused while approval is needed (incl. over the limit, cp180), the client is on hold, or a HIGH
  client's draft lacks deposits held for it worth 30% of its grand total after fees (cp162). Send all drafts
  sends what it can in id order, each judged after the ones before (cp153).
- On hold (cp154): manual (`client-hold`), or automatic while over the limit (cp160) or while a dispute has been
  open more than 30 days (cp199). On hold: no sending, no Apply credit, no generating (cp165); a payment pays the
  client's overdue invoices first (oldest due date) and the rest is held as credit (cp160; cp154 had all credit).

**Service periods and recurring invoices**
- A line with periodStart/periodEnd: qty x price is a monthly price, charged by the day at monthly x 12 / 365
  times the days (both ends), rounded once (cp176, `calendar_prorate_revised`; cp155 prorated by calendar
  month, `calendar_prorate`). Applies to credit lines too; a credit period must lie inside the billed one (cp177).
- Generate (cp157) on a sent recurring invoice: next calendar month for period lines only (one-offs not copied),
  keeps pct discount and surcharge; once per invoice; stops at recurUntil, prorating the last period (cp165);
  sent at once when nothing blocks it (cp175); typed prices rise by clients[].upliftPct on each anniversary of
  recurringSince (cp186). Setting recurUntil inside an already billed period credits the days after it (cp197).

**Disputes**
- Whole invoice (cp158) or lines (cp163, disputed amount = lines after discount share plus tax) or reached
  milestones (cp178). While open: the disputed amount earns no interest, is not overdue (nor in the client's
  overdue), still in the balance; status `Disputed` when nothing undisputed is owed.
- Resolving charges the interest held back as if never disputed (cp164), unless resolved with a credit note for
  the disputed lines (cp171), which waives it. A payment made with a disputed invoice open resolves it (cp172).
- Payment order: automatic payments and Apply credit pay undisputed amounts (including the undisputed part of a
  partly disputed invoice, cp195) before any disputed amount (cp172).

**Payment order** (cp188, replacing cp64's "largest first"): overdue invoices first (oldest due date, lower id),
then the smallest amount due first (lower id), disputed amounts last. Remittance text (cp159): with no open
invoice or reference, the open invoice whose poNumber is most like it by Jaro-Winkler (`jaro_winkler`) is paid
first, from 0.90 (cp184; 0.85 before), ties to the larger amount due, then earlier due date, then lower id
(cp184; earlier due date before); several parts separated by ';' matched in turn (cp181).

**Payment risk** (cp192, `ewma_days_to_pay` with alpha 0.5, `risk_band_revised`): days late (paid date - due
date, 0 if on time) of invoices paid in full (and of manual write-offs at their write-off date, cp193), oldest
payment first; LOW < 5, MEDIUM < 15, HIGH from 15 (cp161 used days to pay, alpha 0.3, 15/30). Effects: HIGH ->
approval (two from cp200), deposit 30% (cp162), at most 7-day terms (cp174), +3 points late interest before the
regional cap (cp179, judged on the client's other invoices), half the credit limit (cp198); MEDIUM -> at most
21-day terms (cp174), half the approval limit (cp194); only LOW gets the early-payment discount (cp187).

**Percent complete and milestones**
- lineItems[].percentComplete: amount = pct of the full amount, half up (cp167); a progress claim (cp173) bills
  pct less billedPct, each rounded separately.
- Milestones (cp169): pcts total 100 to send; amounts = each pct share rounded down, the last takes the rest
  (cp196; cp169 used largest remainder). Only reached milestones are owed; reaching uses held deposits for the
  invoice then other credit (cp169/185). Due the client's termsDays (else 14) after being reached (cp170),
  overdue and earning interest per milestone; paid in due-date order, each its amount then its interest.

## Rules in force at cp150 (Act III end; Act IV changes above take precedence)

**Line pricing** (Act III)
- A line with a `unitType` and no `unitPrice` is priced from the client's rate card (cp103), else the
  workspace price list in USD (cp113, each price or band price converted down to the client's step at
  the invoice's date rate); the entry in force on the invoice's date (cp131, `from`). The invoice's
  date is its issue date, but a DRAFT is priced and taxed as of today (cp144: card/price-list entry,
  conversions, monthly volume, tax rate, exemption). A typed `unitPrice` wins (not reduced by
  rateDiscountPct). Unknown unit type without a price is refused.
- Billed qty: qty rounded up to the entry's `increment` (cp114), then at least `minUnits` (cp118);
  applies to every line of that unit type, even with its own price. Shown as `line-billed-qty`.
- Card/price-list prices less the client's `rateDiscountPct`, half up per unit, after conversion,
  before overtime (cp134). Overtime: unit price x 1.5 half up per unit; tiers: each band x 1.5 (cp121).
- Tiers (cp105, `tiered_price`): progressive bands. All of an invoice's lines of a tiered unit type
  are counted together in line-id order, each line charged the exact slice of its units, rounded once
  (cp112, `tiered_slice`); units on the client's other SENT invoices issued earlier in the same month
  (same date: lower id) count first (cp133). Crediting tiered units gives back the top units of the
  original line's bands (cp145).
- Line amount = billed qty x price (half up) or the tier slice, then the line discount (floor pct).
- The rate form (cp126) adds/replaces a client's single-price rate; drafts reprice, sent invoices keep
  the price fixed at send.

**Discounts and charges**
- Invoice discount (pct floor / fixed / cap, cp09-32) is worked out on, and split over, lines NOT
  priced from a card or the price list (cp132). Volume discount (cp123): subtotal over a threshold
  (USD converted down) gives that pct (floor, of the eligible lines) when larger than the invoice's own
  discount; then capped and split like any invoice discount.
- Surcharge (cp110): floor(surchargePct x (subtotal - discount)); not discounted; credit notes carry
  their original's pct on what they credit (cp138).
- Minimum charge (cp107): settings.minimumCharge (USD converted down) or the client's own (cp125, client
  currency, 0 = none); top-up = minimum - (subtotal - discount + surcharge) when positive; not for credit
  notes or line-less invoices.
- Charges are taxed at the client's standard rate (none for exempt or reverse-charged clients) and are
  items in the tax split ranked after every line.

**Tax**
- Rate of a line: exempt client -> 0, except a line's own taxRate (cp108; until the exemption's end date,
  cp135, judged on the invoice's date); exempt line -> 0; line taxRate; rate-card entry taxRate (cp127);
  else the standard rate = the region's rate (place of supply cp137, else client region cp101; dated
  changes cp115) else settings.taxRate. Credit notes use their original's date.
- Reverse charge (cp102/124/137): valid tax number (two letters + 10 digits, last two = 97 - first eight
  mod 97; `tax_number_valid`) whose letters are the taxing region, and that region is not homeRegion ->
  everything at 0, panel `Reverse charge`, REVERSE_CHARGE on send, no withholding.
- Exclusive prices (cp116): per rate, the exact taxes of that rate's items are added and rounded half up
  (down in settings.regionRoundDown regions, cp146), shared over them by largest remainder (cp36 ties).
- Tax-inclusive clients (cp106/116, `tax_inclusive_split` per rate group): line amounts, discounts and
  grand total include tax; each rate's group is reconciled (net = gross/(1+r) half up, missing cents to
  the largest gross, earlier line on ties; target rounded down in round-down regions). Reverse-charged
  inclusive clients pay the nets: grand = amount before tax, tax 0 (cp119).
- Grand = subtotal - discount + charges + tax (exclusive) or subtotal - discount + charges (inclusive);
  `invoice-net` = grand - tax. Sending writes TAX_CHARGED per rate (cp150).

**Retention, early discount, withholding**
- Retention (cp106) and the early-payment discount (cp104) are worked out on the amount before tax
  (grand - tax), so include the charges.
- Withholding (cp117): floor(withholdingPct x amount before tax), only when that amount is at least
  settings.withholdingThreshold (USD converted down, cp141); never owed by the client (left out of the
  amount due, balance, late charges, write-off); plans spread grand - withholding; none on credit notes
  or reverse-charged invoices.

**Payments**
- Methods (cp109/111): BANK (default), CASH, CARD. Card surcharge = converted amount - converted amount /
  (1 + pct) half up, at most settings.cardSurchargeCap converted down (cp147). Conversion fee for a payment
  in another currency: half up pct of the converted amount (cp130). Only what is left after both pays
  invoices, meets the minimum part payment or becomes credit.
- Minimum part payment: 10% of the invoice's amount due (cp136) unless it settles it.
- Cash (cp109/120): multiple of 0.05 (whole yen), client currency, open invoice only; cash due = amount
  due rounded DOWN to 0.05 (cp120, `cash_rounding_revised`); paying exactly the cash due settles with
  CASH_ROUNDING; yen need none.
- Small balance write-off (cp140): worth < $0.05 at the payment-date rate and <= 1% of the grand total.

**Late charges**
- No late fees (cp128, the reversal): no fee on invoices or instalments; payment application is the
  invoice (or instalment) first, then late interest; waive writes off interest only.
- Interest: as Act II (Actual/360 daily compounding from the end of grace), at the lower of the usual
  rate and settings.regionMaxInterest for the client's region (cp122). Grace: client graceDays, else
  settings.regionGraceDays (cp139), else 7.
- Interest threshold (cp129 invoices, cp149 plans): until an invoice's (or plan's) total late interest
  reaches settings.interestThreshold (USD converted down at the issue date), none is shown or owed.

**Instalment plans**: as Act II, plus: the plan's own rate is capped by the region's maximum (cp148);
the plan fee (USD converted down) is added to the amount spread after the down payment (cp143);
withholding is left out (cp117).

**Due dates**: client termsDays, else settings.regionTermsDays (cp142), else end of next month; re-dated
on send.

## Rules in force at cp100 (Act II end; Act III changes above take precedence)

**Lines, discounts, tax, totals** (Act I, two changes)
- Line amount = round_half_up(qty x unitPrice) - line discount; line discount = floor(pct of that).
  Rounding is to the client currency's minor unit (whole yen for JPY, cp59).
- Subtotal = sum of line amounts. Invoice discount: pct of subtotal rounded down, or fixed amount
  (<= subtotal); the cap limits line discounts + invoice discount (invoice discount shrinks, >= 0).
- Discount split: largest remainder by line amount, ties -> larger line amount -> lower id (cp36).
- Tax (cp72): each line's exact tax = rate (line taxRate, else settings.taxRate; 0 if exempt line or
  exempt client) x (line amount - share), unrounded; invoice tax = round_half_up(sum); line taxes are
  shares of the invoice tax by largest remainder on the exact taxes (ties -> larger exact tax ->
  lower id).
- Grand = subtotal - discount + tax.

**Retention** (cp55/60/75/83/93): retention = floor(retentionPct x (subtotal - discount)), at most
retentionCap. Held retention is not due, takes no payments/credit, never makes the invoice overdue;
status Retention held when only held retention is left. Release (all, or part via
retentionReleasedAmount) only when nothing else is due; released retention is due 30 days after the
latest release, overdue after the grace period, and (cp98) earns late interest from then. Clients
can carry a standard retentionPct for new invoices; duplicates keep the invoice's own.

**Credit notes** (cp54/56/73/89/97): an invoice with creditOf; no discount; taxed like the original;
list total negative; issuing (send) writes CREDIT_NOTE_ISSUED. Comes off what the original owes,
then its held retention; any excess becomes a credit payment (payments[].creditNote, CREDIT_HELD,
not reversible). An original with an issued credit note can't be changed, reopened or voided. On a
planned invoice it re-amortises the instalments due after its issue date (refused with an overdue
instalment or more than that principal). Line credits (creditOfLine) can't exceed the invoiced qty.
Counted from its issue date in late-interest periods (cp97).

**Payments and credit**
- Routing: open invoice -> that invoice; references (RF or invoice numbers, comma separated, each
  optionally `=amount`, cp77) -> those invoices; otherwise automatic over all open invoices. No
  allocation boxes (cp76). Automatic and multi-reference order (cp64): overdue first (oldest due
  date, then lower id), then largest amount due (lower id on ties), each paid off before the next.
- Anything beyond what the targets owe is held as credit (cp52). Checks: sent, > 0, 2 dp (whole yen
  for JPY), date <= asOf and >= issue; minimum part payment 10% of grand unless settling (planned
  invoices: at least the earliest unpaid instalment's unpaid amount, cp58).
- Payments in another currency (cp61) convert through USD: amount x usdPer[paid] / usdPer[client],
  **rounded down** to the client's step (JPY 1, CHF 0.05, else 0.01; cp88), at the rate in force on
  the payment date (fxRates, latest from <= date, else usdPer; cp74). Allocations are in the client's
  currency. Foreign invoices show an FX difference in USD (cp82).
- Credit = unallocated, unrefunded parts of payments. Deposits (cp51) are credit; credit is used on
  an invoice when it is sent (oldest payment first, earmarked deposit for that draft first, cp67;
  not on planned invoices, cp57), up to the early-settlement amount for early-discount clients
  (cp90), or on demand with Apply credit (cp81, payment order). Used credit is dated the day used.
- Refunds (cp53/79) take credit oldest first (skipping deposits held for a draft); a refunded payment
  can't be reversed. Voiding an invoice paid only by used credit returns it (cp69).
- Payment application on an invoice (cp96): the invoice (or instalment) itself first, then late
  fee, then late interest.
- Small balance write-off after a payment (cp92): what is left is written off when worth < $2.00
  (at the payment-date rate) and <= 1% of the grand total. Manual write-off (cp86): status Written
  off, stops interest, excluded from balances, takes no payments.

**Early-payment discount** (cp62): clients with earlyPayPct/earlyPayDays; early discount =
floor(pct x grand); a payment within issue + days bringing paid + credited to grand - discount settles
(EARLY_DISCOUNT); excess is credit; not with retention or a plan; settle amount shown while open.

**Late charges**
- Grace: clients[].graceDays, else 7 days (cp78). Overdue: today > due + grace with something owed.
- Interest (cp63/68/80/87): annual rate clients[].interestRate, else settings.lateInterestRate (0 =
  none); daily compounding **Actual/360** (cp80): B x ((1 + r/100/360)^d - 1), rounded half up;
  runs from the end of the grace period (cp68) when something is still owed then; periods split at
  payments, credit notes (cp97), waivers; each period on the principal owed (not interest or held
  retention). Waive (cp70) writes off unpaid interest and fee and restarts interest that day.
- Late fee (cp65/91/100): charged once when the invoice (or each instalment, cp95) becomes overdue:
  **2% of what is owed then, rounded down, at least $10.00 converted, at most 10% of the grand total
  (or instalment)**. Earns no interest.

**Instalment plans** (cp57/58/66/71/84/85/94/99): count 2-24, rate 0-30 %; optional down payment
(planDownPct, instalment 0 due on the issue date). Annuity on the grand total (less the down
payment): payment = P x i / (1 - (1+i)^-n) with i = rate/12/100, **rounded up to the whole currency
unit** (cp84); monthly interest on the balance, half up; the last instalment pays the rest. Due k
months after the issue date (month-end clamp), re-dated on send. Payments fill instalments in order;
statuses per instalment; planned invoice Overdue when any instalment is; list due date = next unpaid
instalment. Overdue instalments earn late interest and a fee. Payoff = principal still owed + unpaid
interest of instalments already due + late charges; paying it settles (PLAN_SETTLED, interest saved).
Minimum instalment worth $25.00 (cp94). Skip (cp99): an unpaid, not overdue, not last instalment
becomes interest-only and the later ones re-amortise. No plan with retention.

**Status order**: Draft / Void / Credit note / Written off; nothing owed -> Credited (no payments,
credited) else Paid / Paid late (clearing payment date after due); only held retention -> Retention
held; overdue -> Overdue; any payment -> Part paid; else Sent.

**Client balance** = everything owed on sent invoices (incl. held retention, interest, fees) - unused
credit (may be negative). Overdue = amount due on overdue invoices (planned: unpaid overdue
instalments with their charges; released retention once overdue).

**Unchanged from Act I**: due dates (terms, end of next month, manual due date), send moves issue to
today, invoice numbers/RF references, discount reason over 20%, reopen rules, duplication, send all,
new ids continue from the highest existing id.

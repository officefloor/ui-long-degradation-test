# acceptance/support — the screen helpers and the `data-testid` contract

`ui.ts` is installed into every app as `e2e/support/ui.ts` (harness-owned, `config.yaml`
`acceptance.harness_files`). Every generated spec arranges and reads through it. It binds only to
`data-testid`, and the agent reads it (AGENTS.md §3) as the exact way a test presses the screens.

## The stable `data-testid` contract

Everything is on the one screen at `/`. Introduced by the checkpoint in brackets.

### Session and sheet
- `signin-name`, `signin-submit`, `current-user` (cp1)
- `sheet-id-input`, `sheet-load`, `sheet-current-id` (cp1); loading re-reads the sheet
- `sheet-today-input`, `sheet-today-save`, `sheet-today` (cp2)

### People
- form `person-form-name`, `person-form-grade` (select A/B/C), `person-form-grade-from` (cp28),
  `person-form-submit`, `person-form-error`; editor `person-edit-<id>` fills the form (cp3)
- row `person-row-<id>` with `person-name`, `person-grade`; `person-claimed` (cp5),
  `person-due-total` (cp7), `person-statement` (button), `person-statement-count`,
  `person-stated-total`, `person-statement-date` (cp15), `person-retired`, `person-retired-from`, `person-retire-date`,
  `person-retire` (cp21), `person-hold`, `person-hold-toggle` (cp22), `person-hold-from`,
  `person-hold-to`, `person-hold-line` (one per hold, cp40), `person-overdue-count`,
  `person-overdue-total` (cp25), `person-patron-select`, `person-patron-add`,
  `person-patron-error`, `person-patrons`, `person-backing` (cp27), `person-error`
- `show-retired` checkbox (cp21); `quick-name`, `quick-amount`, `quick-submit`, `quick-error` (cp19)
- export: `export-people` downloads the CSV (cp33)
- `person-excess` (cp43), `person-period-<name>-due-total` one per period (cp47), `person-watch`,
  `person-watched` (cp58), `person-form-terms`, `person-terms` (cp63), `person-active` (cp67),
  `person-unstate` (cp71), `person-select`, `bulk-grade` (select), `bulk-grade-from`,
  `bulk-grade-apply`, `bulk-graded` (cp75), `person-aged-0-30`, `person-aged-31-60`,
  `person-aged-61` (cp78); `person-statement-asof` (a date entry beside `person-statement`, cp73)
- paste box: `paste-claims`, `paste-submit`, `paste-added`, `paste-error` (cp49)

### Claims (inside the person's row, newest first)
- form `claim-form-amount`, `claim-form-date`, `claim-form-note`, `claim-form-corrects` (cp30),
  `claim-form-submit`, `claim-form-error` (cp5)
- row `claim-row-<id>` with `claim-amount`, `claim-date`, `claim-note`, `claim-edit` (cp5);
  `claim-due` (cp7); `claim-status`, `claim-open`, `claim-settle`, `claim-void`, `claim-error`
  (cp8); `claim-number` (cp9); `claim-opened-by` (cp13); `claim-stated` (cp15); `claim-period` (cp17); `claim-due-by`,
  `claim-overdue` (cp25); `claim-corrects` (cp30); `claim-select` (cp34); `claim-approve`,
  `claim-reject`, `claim-reject-reason` (cp36); `claim-reassign-to`, `claim-reassign` (cp37);
  `claim-log-line` (one per status, cp39)
- `bulk-open`, `bulk-opened`, `bulk-refused` (cp34)
- `bulk-settle`, `bulk-settled`, `bulk-settle-refused` (cp45); `claim-resettle` (cp46);
  `claim-defer-date`, `claim-defer`, `claim-deferred`, `claim-deferred-until` (cp50);
  `claim-proof`, `claim-proofs` (cp51); `claim-split-amount`, `claim-split`, `claim-split-from`
  (cp57); `claim-date-new`, `claim-redate` (cp66); `claim-cancel` (cp69, the editor opened by
  `claim-edit`); `claim-late-entry` (cp70)

### Rates, periods, settings, roles, rollups, summary
- `rate-form-grade`, `rate-form-pct`, `rate-form-from` (cp11), `rate-form-submit`,
  `rate-form-error`; `rate-row-<grade>-<from|start>` with `rate-pct`; `rate-current-<grade>` (cp7)
- `period-form-name`, `period-form-from`, `period-form-to`, `period-form-submit`,
  `period-form-error`; `period-row-<name>` with `period-due-total` (cp17), `period-closed`,
  `period-close`, `period-error` (cp18), `period-reopen` (cp29)
- `setting-<key>` input, `settings-save`, `setting-<key>-current` (cp23: clerk-limit; cp24: floor;
  cp25: terms; cp26: late-pct; cp32: policy-date; cp35: period-numbering-from; cp38: terms-<grade>)
- `role-form-user`, `role-form-role`, `role-form-submit`, `role-form-error`, `role-row-<user>`
  with `role-value` (cp23)
- `rollup-claimed-total` (cp5), `rollup-due-total` (cp7), `rollup-overdue-count`,
  `rollup-overdue-total` (cp25)
- header: `header-people-count`, `header-claims-<S>-count`, `header-due-total`,
  `header-overdue-total` (cp41)
- `rate-form-to`, `rate-to` on the rate row (cp42); `setting-<key>-from` and `settings-error`
  (cp48: a dated setting; keys cap cp43, proof-threshold cp51, perm-<action> cp53, grace-days
  cp55, note-threshold cp77, entry-date cp79); `period-soft-close` (cp70);
  `period-generate-from`, `period-generate-to`, `period-generate`, `period-generated`,
  `period-generate-error` (cp59); `delegate-user`, `delegate-from`, `delegate-to`,
  `delegate-submit`, `delegate-line`, `delegate-error` (cp61); `sheet-archive`,
  `sheet-archived`, `sheet-error` (cp62, the error also for a refused today change);
  `asof-date`, `asof-set`, `asof-clear`, `sheet-asof` (cp74); `summary-grade-<g>-active` (cp67)
- `summary-grade-<g>-count`, `summary-grade-<g>-due-total`, `summary-period-<name>-due-total`,
  `summary-status-<S>-count` (cp31)

### Values
Amounts, rates and totals show two decimals with a dot and no grouping; `n/a` when undefined.
Dates are `yyyy-mm-dd`. Yes/no flags show `yes` or `no`. A claim with no number shows nothing in
`claim-number`.

### Audit lines
`EVENT sheet=<id> by=<user> key=value ...` in the order the request states; later fields are
appended at the end (a spec matches a line by its start). Events: PERSON_ADDED, PERSON_EDITED,
CLAIM_ADDED, CLAIM_EDITED (cp6); RATE_SET (cp7); CLAIM_OPENED, CLAIM_SETTLED, CLAIM_VOIDED (cp8);
STATEMENT (cp15); ROLLUP and TOTALS after every write that moves a figure (cp16); PERIOD_ADDED (cp17); PERIOD_CLOSED (cp18); PERSON_RETIRED (cp21); PERSON_HELD, PERSON_RELEASED
(cp22); ROLE_SET, SETTING_CHANGED (cp23); PATRON_ADDED (cp27); PERIOD_REOPENED (cp29);
CLAIM_PENDING, CLAIM_APPROVED, CLAIM_REJECTED (cp36); CLAIM_REASSIGNED (cp37); CLAIM_RESETTLED
(cp46); CLAIM_DEFERRED (cp50); CLAIM_PROOF_ADDED (cp51); PERIOD_CLOSED auto=yes (cp55);
CLAIM_SPLIT (cp57); PERSON_WATCHED, PERSON_UNWATCHED, NOTIFY (cp58); DELEGATED (cp61);
SHEET_ARCHIVED (cp62); CLAIM_REDATED (cp66); PERIOD_SOFT_CLOSED, LATE_ENTRY (cp70);
STATEMENT_CANCELLED (cp71); STATEMENT asof= at the end (cp73); SNAPSHOT (cp76).

## How a spec reads
Generated by `harness.stream_build`: one story test from `harness/oracle/hell_scripts.py` and
the generated scenarios of `harness/oracle/hell_gen.py`, each a script of screen actions
rendered as a helper call whose outcome (an id, or true/false for went through or refused) the
reference model decided, then assertions on the figures the model computed. A spec sets its
tests' timeout to four minutes; a generated scenario is thirty to sixty screen actions.

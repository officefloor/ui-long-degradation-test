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
- `person-settled-total`, `person-open-total` (cp82); `person-form-contact`, `person-contact` (cp99)
- `person-alias-input`, `person-alias-add`, `person-aliases` (cp102); `claim-template-select`,
  `claim-template-add` (cp103); `person-merge-into` (select), `person-merge` (cp107);
  `person-transfer-to`, `person-transfer` (cp111); `person-clashing` (cp112); `person-cut-total`
  (cp119); `person-origin` (cp121); `person-unretire`, `person-retirement-line` (one per past
  retirement, cp125); `plan-form-amount`, `plan-form-start`, `plan-form-every`, `plan-form-end`,
  `plan-form-submit`, `plan-error`, `plan-row-<id>` with `plan-generated` (cp131), `plan-form-day`
  (cp141), `plan-next-dates` (cp142); `person-form-tags`, `person-tags` (cp133);
  `person-inline-grade` (select), `person-inline-grade-save` (cp138); `person-snapshot-line` (one
  per snapshot, cp147); `person-move-up`, `person-move-down` (cp117); `bulk-retire-date`,
  `bulk-retire`, `bulk-retired` (cp123)
- import box: `import-people`, `import-submit`, `import-added`, `import-error` (cp113),
  `import-updated` (cp116)
- `person-period-<name>-carried` (cp159); `person-statement-line` (one per statement, cp163);
  `person-form-terms-from` (cp169); `person-transfer-undo` (cp175); `person-flag-reason`,
  `person-flag-until`, `person-flag`, `person-flag-shown` (cp179); `person-export-statement`
  (cp195); `person-approver-input`, `person-approver-save`, `person-approver` (cp199);
  `column-<cell>` checkboxes (cp158); `user-locale` (select), `user-locale-save`,
  `user-locale-current` (cp157)
- `plan-pause`, `plan-resume`, `plan-paused` (cp203); `plan-amount`, `plan-amount-save`,
  `plan-change-line` (cp205); `plan-form-sheet` (cp213); `person-score` (cp209), `person-band`
  (cp210); `person-merge-undo` (cp238); `person-timeline-line` (cp242); `person-export` (cp243);
  `person-claims-OPEN-count`, `person-claims-SETTLED-count` (cp246); `bulk-hold-from`,
  `bulk-hold-to`, `bulk-hold`, `bulk-held` (cp235)

### Claims (inside the person's row, newest first)
- form `claim-form-amount`, `claim-form-date`, `claim-form-note`, `claim-form-corrects` (cp30),
  `claim-form-submit`, `claim-form-error` (cp5)
- row `claim-row-<id>` with `claim-amount`, `claim-date`, `claim-note`, `claim-edit` (cp5);
  `claim-due` (cp7); `claim-status`, `claim-open`, `claim-settle`, `claim-void`, `claim-error`
  (cp8); `claim-number` (cp9); `claim-opened-by` (cp13); `claim-stated` (cp15); `claim-period` (cp17); `claim-due-by`,
  `claim-overdue` (cp25); `claim-corrects` (cp30); `claim-select` (cp34); `claim-approve`,
  `claim-reject`, `claim-reject-reason` (cp36); `claim-reassign-to`, `claim-reassign` (cp37);
  `claim-log-line` (one per status, cp39)
- `claim-remind`, `claim-reminded` (cp81); `claim-inline-amount`, `claim-inline-save` (cp86);
  `claim-form-ref`, `claim-ref` (cp87); `claim-form-tags`, `claim-tags` (cp89); `claim-void-reason`
  (a select, cp90); `claim-comment-text`, `claim-comment-add`, `claim-comments-line` (one per
  comment, cp91); `claim-batch` (cp98)
- `bulk-open`, `bulk-opened`, `bulk-refused` (cp34); `bulk-reassign-to` (select), `bulk-reassign`,
  `bulk-reassigned`, `bulk-reassign-refused` (cp93); `bulk-settle-batch` (cp98)
- `claim-delete`, `claim-restore` (cp114); `claim-line-label`, `claim-line-qty`, `claim-line-unit`,
  `claim-line-add`, `claim-lines-line` (one per line, cp137); `bulk-redate-date`, `bulk-redate`,
  `bulk-redated`, `bulk-redate-refused` (cp145)
- `claim-review` (cp155); `claim-review-late` (cp171); `claim-waive`, `claim-waived` (cp174);
  `claim-proof-kind` (select), `claim-proofs-receipt`, `claim-proofs-photo` (cp177); `claim-hold`,
  `claim-held` (cp182); `claim-settle-part-amount`, `claim-settle-part` (cp185);
  `claim-settle-date` (cp194); `bulk-void-reason` (select), `bulk-void`, `bulk-voided`,
  `bulk-void-refused` (cp190)
- `claim-share-select`, `claim-share-pct`, `claim-share-add`, `claim-shares` (cp217);
  `claim-review-user`, `claim-review-assign`, `claim-review-assigned` (cp218);
  `claim-pending-late` (cp230); `claim-due-by-new`, `claim-set-due-by` (cp233); `claim-timeline`,
  `claim-timeline-line` (cp162); `claim-policy` (cp248)
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
  `summary-status-<S>-count` (cp31); `summary-void-<reason>-count` (cp90)
- `rollup-settled-total`, `rollup-open-total` (cp82); `holiday-date`, `holiday-add`,
  `holiday-row-<date>`, `holiday-error` (cp83); `setting-grace-<grade>` (cp85),
  `setting-proof-threshold-<grade>` (cp94), dated; `tag-<tag>-due-total` (cp89);
  `void-reason-text`, `void-reason-add`, `void-reason-row-<reason>`, `void-reason-error` (cp90);
  `rate-preview-grade`, `rate-preview-pct`, `rate-preview`, `rate-preview-count`,
  `rate-preview-diff`, `rate-preview-error` (cp95); `month-<yyyy-mm>-due-total` (cp97)
- audit viewer: `audit-filter`, `audit-show`, `audit-line` (one per line, cp101)
- templates: `template-form-name`, `template-form-amount`, `template-form-note`,
  `template-form-submit`, `template-form-error`, `template-row-<name>` with `template-amount`,
  `template-note` (cp103)
- pools: `pool-form-name`, `pool-form-submit`, `pool-form-error`; `pool-row-<name>` with
  `pool-total-share`, `pool-balanced`, `pool-member-select` (people, and `pool:<name>` entries from
  cp115), `pool-member-share`, `pool-member-add`, `pool-error`; `pool-member-<pool>-<person id>` and
  `pool-member-<pool>-pool-<name>` with `pool-share` (cp105), `pool-cut` (cp106);
  `pool-member-from`, `pool-member-to` (cp122); `setting-pot` (cp106, not dated);
  `rollup-cut-total` (cp119); export `export-pools` (cp135)
- the tree: `setting-parent`, `sheet-parent` (cp109); `consolidated-people-count`,
  `consolidated-due-total`, `consolidated-overdue-total` (cp110); `sheet-clone-to`, `sheet-clone`,
  `sheet-cloned-to` (cp126); `search-name`, `search`, `search-count`, `search-line` (cp150)
- `setting-rounding` (cp151, dated); `rate-version` on the rate row (cp153); `classic-period-<name>-due-total`,
  `classic-due-total` (cp154); `setting-review-threshold` (cp155, dated), `setting-review-sla`,
  `summary-review-late-count` (cp171); `rate-month-<grade>-<yyyy-mm>` (cp170);
  `opening-import`, `opening-import-submit`, `opening-import-done`, `opening-error` (cp173);
  `setting-proof-kinds` (cp177); `dash-pending-count`, `dash-review-count`, `dash-overdue-count`
  (cp178); `note-text`, `note-add`, `note-line`, `note-error` (cp181); `period-lock`,
  `period-unlock`, `period-locked` (cp183); `period-generate-quarters-year`,
  `period-generate-quarters` (cp186); `pool-cut-<period>` on a member's line (cp187);
  `setting-default-grade` (cp189); `setting-clerk-limit-<grade>` (cp191, dated);
  `rollup-aged-0-30`, `rollup-aged-31-60`, `rollup-aged-61` (cp193); `activity-show`,
  `activity-line` (cp197); `dups-show`, `dup-line` (cp198); `header-claims-REVIEW-count`,
  `summary-status-REVIEW-count` (cp155)
- `consolidated-grade-<g>-due-total`, `consolidated-status-<S>-count` (cp201),
  `consolidated-settled-total`, `consolidated-open-total`, `consolidated-cut-total` (cp244);
  `snapshot-from`, `snapshot-to`, `snapshot-compare`, `snapshot-line` (cp202); `rollover-year`,
  `rollover`, `rollover-made`, `rollover-error` (cp207), `rollover-undo` (cp219);
  `setting-score-mid`, `setting-score-high` (cp210); `setting-max-open` (cp214); `compare-sheet`,
  `compare`, `compare-line` (cp215); `my-reviews-count` (cp218); `watched-due-total` (cp221);
  `grade-retire-select`, `grade-retire`, `grade-row-<g>` with `grade-retired`, `grade-error`
  (cp223); `grade-merge-from`, `grade-merge-into`, `grade-merge`, `grade-merged` (cp225);
  `preview-date`, `preview-set`, `preview-clear`, `sheet-preview` (cp226); `grade-add-code`,
  `grade-add` (cp229); `setting-pending-sla`, `summary-pending-late-count` (cp230);
  `export-periods` (cp231), `export-tree` (cp234); `setting-perm-today` (cp237);
  `period-claims-count` (cp239); `rate-withdraw` on the rate row (cp245); `policy-version`,
  `policy-show`, `policy-line` (cp248, cp249); `export-policy` (cp250); `role-row-<user>` with
  `role-value` asserted under as-of (cp241)
- crews: `crew-form-name`, `crew-form-lead` (select), `crew-form-submit`, `crew-form-error`;
  `crew-row-<name>` with `crew-lead`, `crew-due-total`, `crew-member-select`, `crew-member-add`,
  `crew-member-line`, `crew-error` (cp166); `my-crew-due-total` (cp167)
- `import-rates`, `import-rates-submit`, `import-rates-set`, `import-rates-error` (cp118);
  `my-due-total`, `my-overdue-total` (cp127); export `export-claims` (cp129);
  `summary-period-<name>-change` (cp130); `plan-generate`, `plan-generated-count`,
  `plan-generate-error` (cp131); `sort-by` (select: added, name, grade, due-total; cp134);
  `setting-fiscal-start-month`, `period-fy`, `period-generate-fy-year`, `period-generate-fy` (cp143);
  `setting-alert-threshold` (cp146); `period-form-cap`, `period-cap` (cp149)

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
STATEMENT_CANCELLED (cp71); STATEMENT asof= at the end (cp73); SNAPSHOT (cp76); REMIND (cp81);
HOLIDAY_ADDED (cp83); CLAIM_ADDED ref= (cp87) and tags= (cp89) at the end; VOID_REASON_ADDED,
CLAIM_VOIDED reason= at the end (cp90); COMMENT_ADDED (cp91); PERSON_ADDED and PERSON_EDITED
contact= at the end (cp99); BATCH_SETTLED (cp100); PERSON_ALIAS_ADDED (cp102); TEMPLATE_SAVED
(cp103); POOL_ADDED, POOL_MEMBER_ADDED (cp105; from= to= at the end cp122); PERSON_MERGED (cp107);
PERSON_TRANSFERRED (cp111); CLAIM_DELETED, CLAIM_RESTORED (cp114); PERSON_MOVED (cp117);
PERSON_UNRETIRED (cp125); SHEET_CLONE_MADE, SHEET_CLONED (cp126); PLAN_ADDED (cp131; day= cp141);
CLAIM_LINE_ADDED (cp137); ALERT (cp146); PERIOD_ADDED cap= at the end (cp149); CLAIM_REVIEW,
CLAIM_REVIEWED (cp155); ESCALATE (cp165); CREW_ADDED, CREW_MEMBER_ADDED (cp166); OPENING_SET
(cp173); CLAIM_WAIVED (cp174); PERSON_TRANSFER_UNDONE (cp175); CLAIM_PROOF_ADDED kind= at the end
(cp177); PERSON_FLAGGED (cp179); NOTE_ADDED (cp181); CLAIM_HELD, CLAIM_RELEASED (cp182);
PERIOD_LOCKED, PERIOD_UNLOCKED (cp183); CLAIM_SETTLED on= at the end (cp194); APPROVER_SET
(cp199); PLAN_PAUSED, PLAN_RESUMED (cp203); PLAN_CHANGED (cp205); ROLLOVER (cp207); SCORE
(cp211); PLAN_ADDED sheet= at the end (cp213); CLAIM_SHARED (cp217); REVIEW_ASSIGNED (cp218);
ROLLOVER_UNDONE (cp219); GRADE_RETIRED (cp223); GRADE_MERGED (cp225); GRADE_ADDED (cp229);
CLAIM_DUE_BY_SET (cp233); PERSON_MERGE_UNDONE (cp238); RATE_WITHDRAWN (cp245).

## Errors and timing
A refused action shows its error element (`<thing>-error`) with a message; submitting the next
action on that form or row clears it, so an error visible after a submit is that submit's
refusal. The helpers wait on the screen's result or its error and return as soon as either
shows (an error left over from before counts once it has been cleared and shown again, its
text has changed, or two seconds have passed with no result). An audit line may land a moment
after the screen shows its result; the spec re-reads the file for up to three seconds, until it
holds as many lines as expected. Loading a sheet id puts that sheet on screen; re-loading goes
through a throwaway id (`<sheet>-reload`), which has no one on it, so the change is visible: the
helper waits for the person rows to go and then for rows to show again. A page shows the sheet
as it was when it loaded it, so rows other users added can land at any moment; a helper that
creates a row therefore finds it by its id being new and its name, or its amount and date,
being what was entered, not by its position. Each sign-in opens its own browser context; the
helper closes the contexts of tests that have finished, so a long suite does not hold every
page open at once.

## How a spec reads
Generated by `harness.stream_build`: one story test from `harness/oracle/hell_scripts.py` and
the generated scenarios of `harness/oracle/hell_gen.py`, each a script of screen actions
rendered as a helper call whose outcome (an id, or true/false for went through or refused) the
reference model decided, then assertions on the figures the model computed. A spec sets its
tests' timeout to four minutes; a generated scenario is thirty to sixty screen actions.

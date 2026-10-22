# The stream as built: five acts of fifty

_Written 2026-10-22 when the stream was built out from cp80 to cp250 (docs/PLAN.md §4). This is the
record of what each checkpoint loads onto the one figure and of the decisions taken while building
it, for review. The tables are generated from `harness/oracle/hell.py` (RULES, SLUG, TYPE,
ALGORITHM); the requests themselves are in `checkpoints.yaml`, the specs under `acceptance/specs`,
and the `data-testid` contract in `acceptance/support/README.md`. Nothing here is hand-edited into
a spec: `harness.stream_build` renders everything from the model._

## 1. Decisions taken (for the author's review)

1. **cp1-80 kept as built; the acts are cut at fifty.** The plan asked for the stream to be re-cut
   with the engines pulled forward. The existing cp1-80 had just been validated against a real
   build (commit 1b1cba4) and its first fifty already carry everything §4.2 lists for Act I:
   statements (cp15), write-time rollups (cp16), the first precedence exception (cp24), quick-add
   (cp19), bulk open (cp34), paste (cp49), header counters (cp41), summary (cp31), export (cp33),
   roles, four-eyes, edit conflicts, retirement, holds and the freezing close, with mutatives at
   every fourth. So Act I is cp1-50 and Act II cp51-100 of the same world, unchanged, and the
   plan's own gate decides: if Act I on one angular-spring chain does not move the composite and
   two sinews measures by cp50, Act I is re-cut (docs/PLAN.md §7 step 3). The own specs of
   cp1-80 render byte-identical to the validated versions; four ripple copies under cp80 differ
   only because claim numbers in scripts are now symbolic (decision 5).
2. **One checkpoint may carry two rules.** cp160 carries both the frozen carried figures and the
   as-of consolidation, because the as-of consolidation turned out to change earlier specs (it is
   a mutation) and the cadence had no second mutative slot; cp36 and cp40 of the first act set
   the precedent.
3. **Mutations are never gated by a setting; additions are neutral by default.** Every additive
   checkpoint is a new action, a new cell, or a setting that is blank until set, so no earlier spec
   moves (the builder refuses otherwise). Where a natural addition would have fired in earlier
   stories it was given a setting: escalation (cp165, `escalate-after`), the proof kind written
   only when chosen (cp177), SCORE lines only while the bands are set (cp211). A new audit line
   or a new field inside an existing line is a mutation and was placed at a mutative.
4. **Exports are features, not rules.** A download cannot be ablated (an app without the button
   makes the helper throw rather than refuse), so the claims, pools, periods, tree, person and
   policy exports are registered as features (SINCE) like the people export of cp33.
5. **Claim numbers in scripts are symbolic.** A story that corrects a claim "by number" names the
   claim (`("number", person, idx)`) and the renderer resolves the number at render time, so the
   numbering mutations of later acts (reassign renumbers cp104, the tree sequence cp132, fiscal
   years cp144, numbers on settle cp208) cannot break an earlier story. The generator does the
   same.
6. **A sibling sheet is `${sheet}-<suffix>`**, loaded on the same page through the sheet id entry
   (one screen, no navigation), and a row the test has no variable for is bound by name and
   position after a load (a transferred person, a clone's rows, a plan's claims). The throwaway
   reload id `<sheet>-reload` never collides.
7. **Names with grades (cp192)** are the one mutation that touches a helper: the row-finding
   helpers strip a trailing ` (<grade>)` from the name cell; selects list plain names.
8. **The density metric pairs each new rule against every earlier rule** (what the degree check
   reads) instead of every pair of rules in force, which is quadratic and was becoming hours at
   two hundred rules; `--full-density` keeps the old report. The audit viewer's and the claim
   timeline's assertion blocks count as cells.
9. **The control stack (Svelte/Javalin, docs/PLAN.md §2.3) is not built here**; this build-out is
   the stream (PLAN §7 step 3). The stream drives any stack unchanged.

## 2. What was checked before this was committed

- `harness.stream_build --check` through cp250: no additive checkpoint changes a prior spec;
  every mutative changes at least one and ships its copies; every rule bites under ablation in
  its own spec and in every copy; every new rule from cp17 on crosses at least two earlier rules
  (`acceptance/DENSITY.md`).
- `harness.checkpoint_lint`: one screen, the 3:1 cadence, at least three algorithms per act of
  fifty, no framing leaks in the requests, no unseen anchors in hidden copies.
- Every story renders at its own checkpoint and at every later one (a later rule never refuses a
  story's arrangement or reaches a hidden row).
- All 250 own specs and `acceptance/support/ui.ts` compile under the stacks' Playwright
  (`playwright test --list`: 988 tests in 250 files).
- The cp1-80 own specs are byte-identical to the versions validated against run 202610192149's
  final build (commit 1b1cba4).

Not done here, and next (docs/PLAN.md §7): the dry run of each act against a real build, which is
the run-through on angular-spring and tanstack-officefloor the author asked for; it needs a
run token and a day of wall clock per act.

## 3. The checkpoints

### Act I (cp1-cp50): foundation under load

| cp | type | slug | rules introduced | algorithm |
|---|---|---|---|---|
| 1 | A | signin-and-sheet |  |  |
| 2 | A | sheet-today |  |  |
| 3 | A | people |  |  |
| 4 | M | name-uniqueness | names | normalised-uniqueness |
| 5 | A | claims |  |  |
| 6 | A | audit |  |  |
| 7 | A | rates-and-due |  |  |
| 8 | M | workflow | status | workflow-counting |
| 9 | A | numbering | number |  |
| 10 | A | settle-freezes-due | freeze |  |
| 11 | A | rates-effective-dated | rate_dated |  |
| 12 | M | half-even | half_even | half-even-sum-of-rounded |
| 13 | A | four-eyes | four_eyes |  |
| 14 | A | edit-conflict | conflict |  |
| 15 | A | statements | statement |  |
| 16 | M | rollup-audit | rollup | write-time-rollups |
| 17 | A | periods | period |  |
| 18 | A | close-period | closed |  |
| 19 | A | quick-add |  |  |
| 20 | M | open-claims-immutable | immutable | void-keeps-number |
| 21 | A | retire | retire |  |
| 22 | A | hold | hold |  |
| 23 | A | roles-and-clerk-limit | clerk_limit |  |
| 24 | M | floor | floor | floor-under-statements |
| 25 | A | due-by-and-overdue | overdue |  |
| 26 | A | late-charge | late |  |
| 27 | A | patrons-and-backing | backing |  |
| 28 | M | grade-dated | grade_dated | grade-in-force |
| 29 | A | reopen-period | steward_reopen |  |
| 30 | A | corrections | correction |  |
| 31 | A | summary |  |  |
| 32 | M | rounding-policy-date | policy_date | rounding-by-policy-date |
| 33 | A | export-people |  |  |
| 34 | A | bulk-open |  |  |
| 35 | A | numbering-per-period | period_number |  |
| 36 | M | approvals | pending, pending_live | pending-outside-statements |
| 37 | A | reassign-claim | reassign_unstates |  |
| 38 | A | terms-per-grade | terms_fixed |  |
| 39 | A | claim-log |  |  |
| 40 | M | hold-interval | hold_interval, hold_stated | hold-interval |
| 41 | A | header-counters |  |  |
| 42 | A | rate-end-dates | rate_ended |  |
| 43 | A | cap | cap |  |
| 44 | M | rollup-overdue | rollup_overdue | rollups-on-overdue |
| 45 | A | bulk-settle | bulk_settle |  |
| 46 | A | re-settle | resettle |  |
| 47 | A | person-period-figures |  |  |
| 48 | M | dated-settings | settings_dated | settings-in-force-on-date |
| 49 | A | paste-claims | paste_atomic |  |
| 50 | A | deferred-claims | deferred |  |

### Act II (cp51-cp100): time, permissions and reconstruction

| cp | type | slug | rules introduced | algorithm |
|---|---|---|---|---|
| 51 | A | proofs | proofs |  |
| 52 | M | period-status-as-of-end | period_asof | period-status-as-of-end |
| 53 | A | permission-matrix | perms |  |
| 54 | A | viewer-role | viewer |  |
| 55 | A | auto-close | auto_close |  |
| 56 | M | late-per-boundary | late_boundary | late-per-boundary |
| 57 | A | split-claim | split |  |
| 58 | A | watch-and-notify | notify |  |
| 59 | A | period-templates | templates |  |
| 60 | M | trimmed-totals | trim | trimmed-totals |
| 61 | A | delegation | delegation |  |
| 62 | A | archive-sheet | archive |  |
| 63 | A | person-terms | person_terms |  |
| 64 | M | floor-after-late | floor_last | floor-after-late |
| 65 | A | void-settled | void_settled |  |
| 66 | A | redate-claim | redate |  |
| 67 | A | active-people |  |  |
| 68 | M | backing-recent-settled | backing_recent | backing-recent-settled |
| 69 | A | claim-lock | lock |  |
| 70 | A | soft-close | soft_close |  |
| 71 | A | cancel-statement | unstate |  |
| 72 | M | retired-leave-totals | retire_excludes | retired-leave-totals |
| 73 | A | statement-as-of | statement_asof |  |
| 74 | A | as-of-view | asof |  |
| 75 | A | bulk-grade | bulk_grade |  |
| 76 | M | snapshots | snapshot | snapshot-on-today-change |
| 77 | A | note-required | note_required |  |
| 78 | A | age-buckets |  |  |
| 79 | A | entry-date | entry_date |  |
| 80 | M | period-by-due-by | period_due_by | period-by-due-by |
| 81 | A | remind | remind |  |
| 82 | A | settled-and-open-totals | split_totals |  |
| 83 | A | holidays | holidays |  |
| 84 | M | business-day-terms | business_days | business-day-terms |
| 85 | A | grace-per-grade | grace |  |
| 86 | A | inline-amount | inline_edit |  |
| 87 | A | external-reference | ext_ref |  |
| 88 | M | compound-late-charge | compound_late | compound-late-charge |
| 89 | A | claim-tags | tags |  |
| 90 | A | void-reasons | void_reasons |  |
| 91 | A | claim-comments | comments |  |
| 92 | M | four-eyes-editor | four_eyes_editor |  |
| 93 | A | bulk-reassign | bulk_reassign |  |
| 94 | A | proof-threshold-per-grade | proof_grade |  |
| 95 | A | rate-preview | rate_preview |  |
| 96 | M | holidays-redate | holidays_redate | holiday-redates-due-by |
| 97 | A | monthly-totals | monthly |  |
| 98 | A | settle-batches | batch |  |
| 99 | A | person-contact | contact |  |
| 100 | M | batch-all-or-nothing | batch_atomic | batch-all-or-nothing |

### Act III (cp101-cp150): identity, hierarchy and cross-sheet

| cp | type | slug | rules introduced | algorithm |
|---|---|---|---|---|
| 101 | A | audit-viewer | audit_view |  |
| 102 | A | aliases | aliases |  |
| 103 | A | claim-templates | templates_claim |  |
| 104 | M | reassign-renumbers | reassign_renumbers |  |
| 105 | A | pools | pools |  |
| 106 | A | pool-cuts | cuts | penny-allocation |
| 107 | A | merge-people | merge |  |
| 108 | M | patron-shares | patron_shares | equal-share-allocation |
| 109 | A | parent-sheet-rates | parent |  |
| 110 | A | consolidated-figures | consolidated |  |
| 111 | A | transfer-person | transfer |  |
| 112 | M | uniqueness-across-tree | tree_names |  |
| 113 | A | import-people | import_people |  |
| 114 | A | delete-and-restore-draft | delete_draft |  |
| 115 | A | nested-pools | nested_pools | nested-allocation |
| 116 | M | import-upserts | import_upsert |  |
| 117 | A | list-positions | position |  |
| 118 | A | import-rates | import_rates |  |
| 119 | A | cut-totals | cut_rows |  |
| 120 | M | hold-pauses-cuts | hold_pools | share-reallocation |
| 121 | A | history-follows | history_follows |  |
| 122 | A | pool-membership-dated | pool_dated |  |
| 123 | A | bulk-retire | bulk_retire |  |
| 124 | M | retired-share-reallocates | retired_share |  |
| 125 | A | unretire | unretire |  |
| 126 | A | clone-sheet | clone |  |
| 127 | A | my-figures | my_figures |  |
| 128 | M | transfer-merges | transfer_merges |  |
| 129 | A | export-claims |  |  |
| 130 | A | period-comparison | period_change |  |
| 131 | A | plans | plans | plan-date-generation |
| 132 | M | tree-numbering | tree_numbering |  |
| 133 | A | person-tags | person_tags |  |
| 134 | A | sorting | sort |  |
| 135 | A | export-pools |  |  |
| 136 | M | bindings-follow | bindings_follow |  |
| 137 | A | claim-lines | lines |  |
| 138 | A | inline-grade | inline_grade |  |
| 139 | A | tree-audit | tree_audit |  |
| 140 | M | remainder-to-smallest | remainder_smallest | remainder-to-smallest |
| 141 | A | monthly-plans | monthly_plans | month-end-clamp |
| 142 | A | plan-preview | plan_preview |  |
| 143 | A | fiscal-year | fiscal |  |
| 144 | M | numbering-per-fiscal-year | fy_numbering | fiscal-year-numbering |
| 145 | A | bulk-redate | bulk_redate |  |
| 146 | A | over-threshold-alert | alert |  |
| 147 | A | snapshot-lines | snapshot_view |  |
| 148 | M | claimed-without-corrections | claimed_no_corrections |  |
| 149 | A | period-claim-cap | period_cap |  |
| 150 | A | tree-search | tree_search |  |

### Act IV (cp151-cp200): rule versioning and legacy semantics

| cp | type | slug | rules introduced | algorithm |
|---|---|---|---|---|
| 151 | A | rounding-mode | rounding_mode |  |
| 152 | M | imported-claims-open | imported_open |  |
| 153 | A | rate-versions | rate_versions |  |
| 154 | A | classic-summary | classic |  |
| 155 | A | review-state | review |  |
| 156 | M | forward-only-rates | forward_only_rates | rate-version-resolution |
| 157 | A | user-locale | locale |  |
| 158 | A | column-chooser | columns |  |
| 159 | A | carried-figures | carried | carried-balance |
| 160 | M | frozen-carried-and-as-of-tree | carry_frozen, asof_tree |  |
| 161 | A | as-of-exports | asof_export |  |
| 162 | A | claim-timeline | claim_timeline |  |
| 163 | A | statement-lines | statement_history |  |
| 164 | M | correction-limit | correction_limit | correction-remaining |
| 165 | A | escalate | escalate |  |
| 166 | A | crews | crews |  |
| 167 | A | crew-lead-total | crew_lead |  |
| 168 | M | crews-are-pools | crews_pools |  |
| 169 | A | person-terms-dated | person_terms_dated |  |
| 170 | A | rate-calendar | rate_calendar |  |
| 171 | A | review-sla | review_sla |  |
| 172 | M | pending-bound | pending_bound |  |
| 173 | A | opening-balances | opening_import |  |
| 174 | A | late-charge-waiver | waiver |  |
| 175 | A | transfer-undo | transfer_undo |  |
| 176 | M | statement-binds-late-charge | late_bound | bound-late-charge |
| 177 | A | proof-kinds | proof_kinds |  |
| 178 | A | steward-dashboard | dashboard |  |
| 179 | A | flags | flags |  |
| 180 | M | terms-by-version | terms_by_version | terms-by-version |
| 181 | A | sheet-notes | notes |  |
| 182 | A | claim-hold | claim_hold |  |
| 183 | A | period-lock | period_lock |  |
| 184 | M | hold-leaves-claimed | hold_claimed |  |
| 185 | A | partial-settle | partial_settle |  |
| 186 | A | quarterly-periods | quarters |  |
| 187 | A | cut-history | cut_history | cut-as-of-period-end |
| 188 | M | clone-source-rates | clone_rates |  |
| 189 | A | default-grade | default_grade |  |
| 190 | A | bulk-void | bulk_void |  |
| 191 | A | clerk-limit-per-grade | limit_grade |  |
| 192 | M | name-with-grade | name_with_grade |  |
| 193 | A | sheet-age-buckets | sheet_age |  |
| 194 | A | settle-as-of-date | settle_date | settle-as-of-date |
| 195 | A | statement-export |  |  |
| 196 | M | floor-before-late-charge | floor_first |  |
| 197 | A | activity-counts | activity |  |
| 198 | A | duplicate-claims | dups |  |
| 199 | A | approvers | approver |  |
| 200 | M | hold-counts-except-cuts | hold_except_cuts |  |

### Act V (cp201-cp250): the squeeze

| cp | type | slug | rules introduced | algorithm |
|---|---|---|---|---|
| 201 | A | consolidated-grades | consolidated_grades |  |
| 202 | A | snapshot-comparison | snapshot_compare |  |
| 203 | A | plan-pause | plan_pause |  |
| 204 | M | trim-at-consolidation | trim_consolidated | trim-once-over-the-tree |
| 205 | A | plan-history | plan_history |  |
| 206 | A | restricted-role | restricted |  |
| 207 | A | year-end-rollover | rollover | year-end-carry-forward |
| 208 | M | number-on-settle | number_on_settle | number-on-settle |
| 209 | A | score | score | score |
| 210 | A | score-bands | bands |  |
| 211 | A | score-lines | score_snapshot |  |
| 212 | M | score-without-corrections | score_no_corrections |  |
| 213 | A | parent-plans | plan_tree |  |
| 214 | A | max-open-claims | max_open |  |
| 215 | A | sheet-comparison | compare |  |
| 216 | M | cuts-frozen-at-close | cuts_freeze |  |
| 217 | A | shared-claims | shared | share-allocation |
| 218 | A | review-assignment | review_assign |  |
| 219 | A | rollover-undo | rollover_undo |  |
| 220 | M | plan-amount-reaches-drafts | plan_retro |  |
| 221 | A | watched-total | watch_summary |  |
| 222 | A | dashboard-over-tree | dash_tree |  |
| 223 | A | grade-retire | grade_retire |  |
| 224 | M | cap-includes-cuts | cap_cuts |  |
| 225 | A | grade-merge | grade_merge |  |
| 226 | A | preview-date | preview |  |
| 227 | A | preview-exports | preview_export |  |
| 228 | M | rollover-soft-closes | rollover_soft |  |
| 229 | A | grades-editable | grade_add |  |
| 230 | A | pending-sla | pending_sla |  |
| 231 | A | period-export |  |  |
| 232 | M | merged-grade-keeps-rates | merged_grade_rates |  |
| 233 | A | due-by-override | due_by_override |  |
| 234 | A | tree-export |  |  |
| 235 | A | bulk-hold | bulk_hold |  |
| 236 | M | deferred-bound-counts | deferred_stated |  |
| 237 | A | today-permission | perm_today |  |
| 238 | A | merge-undo | merge_undo |  |
| 239 | A | period-claim-counts | period_count |  |
| 240 | M | shared-due-per-holder | shared_per_holder | share-per-holder-rate |
| 241 | A | as-of-roles | asof_roles |  |
| 242 | A | person-timeline | person_timeline |  |
| 243 | A | person-export |  |  |
| 244 | M | trim-reaches-more-totals | trim_more |  |
| 245 | A | rate-withdraw | rate_withdraw |  |
| 246 | A | claim-counts-per-person | claim_count_cells |  |
| 247 | A | reject-reason-required | reject_reason |  |
| 248 | M | policy-versions | policy | policy-version-resolution |
| 249 | A | policy-viewer | policy_view |  |
| 250 | A | policy-export |  |  |

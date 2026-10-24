# The stream: five acts of fifty on one figure

_The change stream every run drives: what it is built to do, the world it evolves, the properties
the builder and the lint enforce, the five acts checkpoint by checkpoint, the decisions taken while
building them, and the catalogue of production gotchas it draws on. This is the one document for
the stream; [docs/PLAN.md](PLAN.md) says what the experiment tests with it and
[DESIGN.md](../DESIGN.md) how the harness runs it. Everything the agent and the gate see is
generated from the reference model (`harness/oracle/hell.py`), the story scripts
(`harness/oracle/hell_scripts.py`) and the scenario generator (`harness/oracle/hell_gen.py`) by
`harness.stream_build`: the requests in `checkpoints.yaml`, every spec under `acceptance/specs`,
every ripple copy, and `acceptance/DENSITY.md`. Nothing under `acceptance/specs` is hand-edited.
The `data-testid` contract is in [acceptance/support/README.md](../acceptance/support/README.md).
The agent never sees this document._

## 1. Why the stream has this shape

The first stream (the "concept spine": people with raw values and named concepts computed from
them, 2026-10) ran clean on angular-spring: 250 of 250 checkpoints, zero regressions, one to four
minutes a checkpoint, and the erosion composite read zero on a front end that had absorbed every
change in one copy-paste file. That was the shape of the stream, not the strength of the stack:

- every rule was a pure function of one sheet's rows, so the cheapest correct solution was to fetch
  the rows and compute in the browser; the backend froze at cp50 as a row store;
- arrangement bypassed the write path (a seed endpoint wrote rows straight into storage), so no
  validation, default or side effect on *writing* was ever exercised;
- there was one write path and one read surface, so a rule had exactly one place to live and a
  mutation never had a forgotten copy to miss;
- rules were global and timeless, so a redefinition replaced the old one everywhere;
- there was one actor and no clock.

The stream was restarted on 2026-10-18 around three engines that close that escape hatch, and the
plan of 2026-10-22 (PLAN.md §4) extended it to five acts of fifty with two more:

- **Path dependence (cp15, statements).** A statement binds the figures a person's counting claims
  have at that moment. From then on the correct figure depends on when the button was pressed
  relative to every other change: the system's own output history is state, and recomputing from
  facts is wrong by construction.
- **Write-time observability (cp16, ROLLUP/TOTALS).** Every write that moves any person's claimed
  or due-total is followed in the audit by one line per person changed, then the sheet's totals,
  and by nothing when nothing moved. The server must own the figures and know every dependent of
  every write. Nothing computed in the browser can produce these lines.
- **Precedence exceptions (cp24 on).** The floor binds under a statement but a statement taken
  under a floor binds the floored figure; the late charge rides on top of a bound figure and is
  never bound; a PENDING claim escapes its statement; a reassigned claim loses its binding; a
  bound claim stays in the totals through a hold; a correction rounds by its target's date. Acts
  III to V keep adding exceptions and the last act reorders them.
- **Generated scenarios.** From cp5, each checkpoint's spec carries its story test and three
  generated ones: seeded multi-user action sequences over everything in force at that checkpoint,
  ending in a check of every cell and the whole audit. The agent sees the same one spec file; the
  gate carries a thousand tests by cp250.
- **Interaction density.** Two rules interact at a checkpoint when a value its own spec asserts
  depends on both. The builder measures it per checkpoint (`acceptance/DENSITY.md`) and refuses a
  rule from cp17 on that crosses fewer than two earlier rules, so the pressure is a property of the
  stream, independent of any app, and erosion in the code can be plotted against it.

## 2. The five engines of erosion

Every request stands on one or more of these; they are what makes veteran teams' systems rot.

1. **Many write paths, one rule.** The same data is created or changed through the form, an inline
   edit, a bulk action, a paste, an import, a template, a plan generator, a merge, a transfer, a
   clone, an undo and a restore. Every validation, default, numbering and side-effect rule must
   hold on all of them. A team that writes the rule where the first path lives forgets the sixth.
2. **Many read surfaces, one figure.** A figure shows in the row, the totals, the header, the
   summary and the classic summary, the statement, the exports, the audit line, the audit viewer,
   the as-of view, the preview, the search, the comparison and the consolidated parent. Mutations
   change the figure and the test reads it on several surfaces at once.
3. **Live, frozen, and as-of.** The same formula is computed live (an open claim), frozen at the
   moment something happened (a settled claim, a closed period, a snapshot, a bound statement),
   and reconstructed as of a past date under the rules and reference data in force then. Three
   code paths that must agree whenever two of them apply to the same record.
4. **Rules in force at a date.** A mutation that says "from today onward" does not replace a rule;
   it versions it. Old-dated records keep the old rule. After a dozen of these the system needs a
   policy engine, and a team that sprinkled date checks has a bitemporal swamp.
5. **Server-only observables.** The audit file is written by the server and carries computed
   figures, so the computation must exist server-side. Two signed-in users in two browser contexts
   see each other's effects. Numbering is gapless under concurrent opens. Exports are files. The
   sheet's "today" is a server setting. These force logic into the backend, or force a duplicate of
   it, which is the trap: the duplicate is what gets forgotten.

## 3. The world

Meaningless nouns, real mechanisms. Nothing here is a business domain; every mechanism is one
production systems have. Everything is on the one screen at `/`.

- **Sheet**: the workspace, by id; a sheet that was never loaded starts empty. Settings (today,
  floor, cap, terms, late percent, limits and thresholds, the permission matrix, rounding, a parent
  sheet, a fiscal-year start, the pot, policy versions), roles, holidays, void reasons, templates,
  notes, grades. A sheet may name a parent; parents, children, clones and transfer targets form a
  tree that shares numbering and shows consolidated figures. A sibling sheet in a spec is
  `${sheet}-<suffix>`, loaded on the same screen.
- **User**: signed in by name, no password; per sheet a role (`clerk` by default, `steward`, later
  `viewer` and `restricted`), delegation for a date range, a locale, a column choice, an as-of date
  and a preview date that belong to the screen. A user may also be a person on the sheet, by name.
- **Person**: name (unique with normalisation, with aliases, across the tree), grade (dated),
  terms (dated), contact, tags, patrons with shares, holds (intervals), retirement (with history),
  watchers, flags, an approver, a position in the list, statements, snapshots, a score.
- **Claim**: amount (or lines), date, note, reference, tags, status (DRAFT, OPEN, PENDING,
  SETTLED, VOID, later REVIEW and DELETED), number (gapless; per period, per fiscal year, across
  the tree, on settle), due-by (business days, holidays, grace, overrides), proofs by kind,
  corrections, splits and partial settles, deferrals, holds, shares with other holders, comments,
  reminders, a status log.
- **Rate**: per grade, effective-dated with end dates, versioned, forward-only or retroactive, lent
  down a tree and from a clone's source.
- **Period**: a named date range; a claim belongs to it by date, later by due-by; closable, soft
  closable, lockable, generated monthly, per fiscal year, by quarter, rolled over.
- **Pool**: members (people, or pools) with shares that must total 100.00; cuts of a pot with a
  remainder rule; crews that become pools.
- **Plan**: generates claims every N days or monthly, pausable, with a change history, into a
  child sheet.
- **Audit file**: `EVENT sheet=<id> by=<user> key=value ...`, one line per change, written by the
  app, read by specs filtered by their sheet id; a later field goes at the end of a line.

The figure everything loads onto is **due**: a claim's amount times its person's grade's rate in
force on its date, rounded (half up, half even, by policy date, by mode), floored, with a late
charge, frozen at settle, bound by a statement, reconstructed as of a date; and the totals built on
it (claimed, due-total, overdue-total, settled and open totals, period figures, carried figures,
backing, cuts, scores, consolidated figures), trimmed, capped, counted by status as of a period's
end, and shown on every surface of §2.

## 4. The test contract

- **No seed API.** Every spec signs in, loads a fresh sheet id, and arranges everything it needs
  through the same screens a person would use, with the harness-owned helpers in
  `acceptance/support/ui.ts` (installed as `e2e/support/ui.ts`). Each test uses a sheet id of its
  own, so no reset is needed and tests run in parallel; audit lines carry `sheet=` and specs filter
  by it. A helper is extended by the checkpoint that adds the screen it drives.
- **Identity and the clock on screen.** Sign-in is a name. Specs open a second browser context to
  act as a second user. Each sheet has a "today"; every date decision uses it, never the real
  clock.
- **`data-testid` only**, never CSS, DOM shape or visible copy, and a `data-testid` is immutable
  public API once introduced (DESIGN.md §3). Downloads are assertable by their text.
- **A refused action shows its error element and changes nothing**, on screen and in the audit
  file; a screen that does neither fails the test. The helpers wait on the screen's result or its
  error and return as soon as either shows (`acceptance/support/README.md`, "Errors and timing").
- **The test states every field it submits** and clears the ones it leaves out; a result count is
  cleared when its button is pressed again; a refused claim edit leaves the editor open and the
  helper cancels it. These came out of the calibration run (§11): each is a place where a form's
  leftover state, not the rule under test, decided a step.
- **Specs come from the reference model, never from an agent.** The model is a stateful simulator
  of the UI script (users, dates, workflow, histories, sheets), not a formula table; the script is
  the spec's input, so the rendered Playwright steps and every expected value come from one
  source. Claim numbers in scripts are symbolic (`("number", person, idx)`), resolved at render
  time, so a later numbering rule cannot break an earlier story.
- **Checkpoint-free content.** The agent sees only the current checkpoint's spec, neutralised of
  its number; a spec's comments describe behaviour only; the lint refuses a mention of the
  sequence, the harness or the hidden suite, in a spec, a helper or a request.
- **Mutatives ship copies.** A mutative checkpoint's copies of every prior spec it changes go
  under `acceptance/specs/cpNN/` and win by basename from that checkpoint on; `mutates:` is
  derived by the builder, never declared. Ripple copies use the same stories and scenarios
  re-rendered under the new rule, so they differ from the own spec exactly where the rule bites.
- **Three workers.** Tests on parallel workers never see each other's data (a dry gate of 280
  tests gave identical verdicts at one and three workers); the full suite at cp250 is about a
  thousand tests.

## 5. Enforced properties

Concentration is carried by construction, not by a percentage: one screen, one figure, one concept
spine. The builder and the lint refuse a stream that does not hold to it.

**The builder** (`harness.stream_build --check`):

- an additive checkpoint changes no prior spec (else it is a mutation in disguise): every additive
  rule is neutral by default, a new action, a new cell, or a setting that is blank until set;
- a mutative checkpoint changes at least one prior spec, and `mutates:` is exactly the priors it
  changes;
- **ablation**: every rule a checkpoint introduces bites in its own spec and every copy it ships
  exercises one of its rules: rendering with the rule switched off (`Model(off=...)`) must change
  the spec, so a test an app ignoring the rule would still pass is a defect;
- **degree**: from cp17 on, every new rule interacts with at least two earlier rules in its own
  spec (the density metric: switching both off is not predicted by switching each off alone, on
  screen cells, audit lines and the viewer blocks); the pairs tried are each new rule against
  every earlier one; `--full-density` tries every pair;
- **stories**: every story renders at its own checkpoint and at every later one (`--stories`): a
  later rule never refuses a story's arrangement or reaches a row the user cannot see; a generated
  scenario drops such a step instead;
- stale files under `acceptance/specs` fail the build.

**The lint** (`harness.checkpoint_lint`): the 3:1 cadence (checkpoint `n` is mutative exactly
when `n % 4 == 0`) and every mutation naming what it changes; one screen (no `goto` but `/`, no
`nav-*`); at least three checkpoints with an `algorithm:` per act of fifty; no framing or process
leak in any request, spec or agent-visible file; no copy dropping a test without `retires:`; every
relative import resolving once installed; no hidden copy asserting an anchor the agent cannot know.

**Exact figures.** Every expected value is computed by the model and small enough to check by
hand; every fixture holds an empty case, a tie, a zero, a negative, a half-way rounding case and a
value on each side of every inclusive boundary where the rule has one.

## 6. The five acts

The principles are PLAN.md §4.1: every request on the five engines; three additive then one
mutative in every act; Act I already pushed by cp50; each act adding at least one write path, one
read surface and one reconstruction demand; one screen and one spine; exact figures and generated
two-user scenarios; every gotcha of real systems; three complex algorithms per act. Acts I and II
are the stream restarted on 2026-10-18 and 2026-10-19, unchanged (their own specs render
byte-identical to the versions validated against run 202610192149's final build); Acts III to V
were built on 2026-10-22.

### Act I (cp1–50): foundation under load

The spine (the sheet's today, people, claims, the workflow, rates, due, periods) lands with the
engines already on it: statements by cp15, write-time rollups by cp16, the first precedence
exception by cp24, quick-add (cp19) and bulk open (cp34) and paste (cp49) as further write paths,
the summary (cp31), the export (cp33) and the header counters (cp41) as further surfaces, roles,
four-eyes and edit conflicts, retirement and holds, the close of a period that freezes, dated
settings. The mutatives re-enter the spine every fourth checkpoint.

| cp | type | what it loads onto the figure |
|---|---|---|
| 1–3 | A | sign-in, the sheet's today, people with a grade |
| 4 | M | names unique, trimmed, case-insensitive |
| 5–7 | A | claims and `claimed`; the audit file; rates and `due` (half up; due-total is the rounded total amount times the rate) |
| 8 | M | workflow DRAFT/OPEN/SETTLED/VOID; only open and settled count |
| 9–11 | A | gapless numbering on open; settle freezes due; rates effective-dated |
| 12 | M | half to even; due-total becomes the sum of rounded claim figures |
| 13–15 | A | four-eyes; stale-edit refusal and double submit; **statements bind figures** |
| 16 | M | **ROLLUP/TOTALS audit lines after every write that moves a figure** |
| 17–19 | A | periods; closing a period freezes and refuses; a quick-add bar (one transaction) |
| 20 | M | an open claim is immutable; a void keeps its number |
| 21–23 | A | retire from a date; hold; roles and the clerk limit (at rounding ties and dated rates) |
| 24 | M | a floor under every live, unbound figure; a statement under a floor binds the floored figure |
| 25–27 | A | due-by and overdue; late charge on top of the bound or live figure, never bound; patrons and backing |
| 28 | M | a person's grade is dated; a claim uses the grade in force on its date |
| 29–31 | A | steward-only reopen (bound figures stay bound); corrections; the summary panel |
| 32 | M | rounding by policy date; a correction rounds by the date of the claim it corrects |
| 33–35 | A | CSV export; bulk open; per-period numbering from a date |
| 36 | M | over the clerk limit goes to PENDING; a PENDING claim is not bound by a statement |
| 37–39 | A | reassign (loses its binding); terms per grade fixed at creation; the status log |
| 40 | M | a hold is an interval; a bound claim stays in the totals through a hold |
| 41–43 | A | header counters (a second surface for the totals); rates with a to-date; a cap on the due-total with the excess shown |
| 44 | M | **rollups also when an overdue-total moves**; ROLLUP and TOTALS carry overdue-total |
| 45–47 | A | bulk settle (list order, each by the single-claim rules); a steward re-settles under today's rules; per-person per-period figures, fixed at close |
| 48 | M | **dated settings**: floor, late percent, terms, limits apply from a from-date (default today); a claim uses the value in force on its date |
| 49–50 | A | a paste box for claims (all-or-nothing); deferred claims (count nowhere until a date) |

### Act II (cp51–100): time, permissions and reconstruction

Dated settings in force on the claim's date; period figures by status as of the period's end; the
late charge per boundary and the floor after it, then compounding; trimmed totals; snapshots on
every today change; periods by due-by; the permission matrix, the viewer role, delegation; archive,
locks, auto-close; a statement as of a date (the server reconstructs first, cp73) and then the
screen's as-of view (cp74); then holidays and business days, grace, inline edits, references,
tags, void reasons, comments, four-eyes for editors, bulk reassign, a rate preview, holiday
re-dating, monthly totals, settle batches and contacts. This is where the last Spring run showed
its shape: four god classes, a rollup service reaching into 85 foreign attributes, the as-of view
built as whole-sheet snapshots after every write.

| cp | type | what it loads onto the figure |
|---|---|---|
| 51 | A | proofs with a dated threshold, checked before the clerk limit |
| 52 | M | **a period counts a claim by the status it had on the period's last day** (from the status log) |
| 53–55 | A | permission matrix with the standing rules as defaults; a viewer role that changes nothing; auto-close after grace days on a today change |
| 56 | M | **late charge per 30-day boundary** at the percent in force on each boundary date |
| 57–59 | A | split an open claim (next number, unstated); watch a person and NOTIFY on settle; monthly period templates |
| 60 | M | **trimmed sheet totals**: the highest and lowest person's figure left out when three or more have one |
| 61–63 | A | delegation of the steward role for a date range (for= on the delegate's lines); archive the sheet; a person's own terms |
| 64 | M | **floor after the late charge**; a statement binds the rate figure |
| 65–67 | A | a steward voids a settled claim within 7 days (reversed=); re-date an open claim (renumbered on a period change); active people |
| 68 | M | **backing is the patrons' settled figures of the last 90 days** |
| 69–71 | A | an open editor locks the claim for other users; soft close (figures fixed, late entries allowed); cancel the last statement |
| 72 | M | **a retired person's open claims leave the live totals** from the retirement date |
| 73–75 | A | **a statement as of a date**: the claims bound to their figures as they stood at the end of that day, asof= in the audit; **the as-of view**: every cell as of a date, by replaying every change made while the sheet's today was on or before it; bulk grade |
| 76 | M | **SNAPSHOT lines** for every person on every change of the sheet's today, before the change takes effect |
| 77–79 | A | a dated note threshold (no open with an empty note above it); age buckets; an entry date as the default claim date |
| 80 | M | **a claim belongs to the period containing its due-by date**: totals, numbering and closed-period refusals follow |
| 81–83 | A | REMIND once per claim per sheet-day; settled and open totals per person and sheet; holidays move a due-by |
| 84 | M | **terms count business days** (weekends and holidays skipped) for every claim |
| 85–87 | A | grace days per grade before overdue; a draft's amount edited in the row; an external reference, unique per sheet |
| 88 | M | **the late charge compounds** per boundary |
| 89–91 | A | claim tags and a due-total per tag; void reasons required once listed; comments by user and day |
| 92 | M | **the last editor cannot settle or approve** either |
| 93–95 | A | bulk reassign; a proof threshold per grade; a rate preview that saves nothing |
| 96 | M | **a new holiday re-fixes every unsettled due-by** (rollups follow) |
| 97–99 | A | a due-total per calendar month; numbered settle batches; a person's contact, normalised and unique |
| 100 | M | **a bulk settle is all-or-nothing** and writes BATCH_SETTLED |

### Act III (cp101–150): identity, hierarchy and cross-sheet

Aliases and uniqueness across a sheet hierarchy; pools and nested pools (the first many-to-many,
and patron links migrated to shares); merge and transfer of people between sheets with claims,
statements and audit history following; parent sheets lending rates and the first consolidated
figures; an import path with upserts and a delete-and-restore path; the audit viewer as a read
surface over the file itself; claim templates whose later changes must not alter claims made from
them; plans that generate claims; numbering shared across the tree and then per fiscal year. The
mutatives re-enter identity and numbering across the tree.

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

### Act IV (cp151–200): rule versioning and legacy semantics

Rules that apply from a date and to records in a state, not everywhere: a dated rounding mode,
rate versions that are retroactive or forward-only, terms by the version in force when a claim was
created; the classic summary kept alive beside the new one so two semantics must both be right;
the REVIEW state in the workflow; a user's locale and column choice as surface variance that must
not touch a figure; carried figures fixed at close; as-of reconstruction that now crosses sheets
and versions, and settles as of a date; statements binding the late charge; the floor before the
late charge again; holds leaving claimed alone and then counting everywhere but the cuts. This is
the bitemporal swamp of engine 4.

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

### Act V (cp201–250): the squeeze

Consolidation over the tree with the trim rule applied once at the top and names counted once;
snapshot comparisons; plans with pauses, a change history and retroactive amount changes; the
restricted role (a screen total over rows the signed-in user is not shown, which only the server
can answer); the year-end rollover with carried balances, undo and soft close; numbers on settle;
scores and bands; shared claims per holder; grades retired, merged, added; previews; and final
mutatives that reorder the precedence of the exceptions every earlier act introduced (deferred and
bound claims, the trim reaching every total, the cap covering cuts, policy versions by the claim's
date), so every surface, every write path and every reconstruction must change together.

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
| 232 | M | grade-merge-retroactive | merge_retro |  |
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

## 7. Decisions taken while building Acts III to V

Built unattended on 2026-10-22 (commits a40a312 to 2243be0); the author's review is expected.

1. **cp1–80 kept as built; the acts are cut at fifty.** PLAN.md §4.2 asked for the stream to be
   re-cut with the engines pulled forward. The existing cp1–80 had just been validated against a
   real build (commit 1b1cba4) and its first fifty already carry everything §4.2 lists for Act I,
   with mutatives at every fourth. So Act I is cp1–50 and Act II cp51–100 of the same world, and
   the plan's own gate decides: if Act I on one angular-spring chain does not move the composite
   and two sinews measures by cp50, Act I is re-cut (PLAN.md §7 step 3). Four ripple copies under
   cp80 differ from the validated versions only because claim numbers in scripts are now symbolic
   (decision 5).
2. **One checkpoint may carry two rules.** cp160 carries the frozen carried figures and the as-of
   consolidation, because the as-of consolidation turned out to change earlier specs (a mutation)
   and the cadence had no second mutative slot; cp36 and cp40 set the precedent.
3. **Mutations are never gated by a setting; additions are neutral by default.** Where a natural
   addition would have fired in earlier stories it was given a setting: escalation (cp165,
   `escalate-after`), the proof kind written only when chosen (cp177), SCORE lines only while the
   score log is on (cp211). A new audit line or a new field inside an existing line is a mutation
   and was placed at a mutative.
4. **Exports are features, not rules.** A download cannot be ablated (an app without the button
   makes the helper throw rather than refuse), so the claims, pools, periods, tree, person,
   statement and policy exports are registered as features like the people export of cp33.
5. **Claim numbers in scripts are symbolic**, resolved at render time, so the numbering mutations
   (cp104, cp132, cp144, cp208) cannot break an earlier story. The generator does the same.
6. **A sibling sheet is `${sheet}-<suffix>`**, loaded on the same page; a row the test has no
   variable for is bound by name and position after a load; the throwaway reload id never
   collides.
7. **Names with grades (cp192)** are the one mutation that touches a helper: the row-finding
   helpers strip a trailing ` (<grade>)` from the name cell; selects list plain names.
8. **The density metric pairs each new rule against every earlier rule**, which is what the degree
   check reads; every pair was quadratic and becoming hours at two hundred rules.
9. **The control stack (PLAN.md §2.3) is not built here**; the stream drives any stack unchanged.

What was checked before the build was committed: the builder's checks over all 250; the lint;
every story at every later checkpoint; all 250 own specs and `ui.ts` compiling under the stacks'
Playwright (988 tests in 250 files); the cp1–80 own specs byte-identical to the validated
versions. Not yet done: the dry gate of each act against a real build (PLAN.md §7 step 3), which
needs a run token and about a day of wall clock per act.

## 8. The catalogue: what veteran teams get wrong, and where the stream uses it

| # | Gotcha | Where in the stream |
|---|---|---|
| 1 | Normalised uniqueness (case, whitespace, aliases, scope changes, grandfathered clashes) | cp4, cp99, cp102, cp112, cp116 |
| 2 | Fixed-point money, rounding modes, sum-of-rounded vs rounded-sum, penny allocation | cp7, cp12, cp32, cp106, cp108, cp140, cp151, cp217, cp240 |
| 3 | Effective-dated reference data (rates, grades, terms, settings) | cp11, cp28, cp38, cp42, cp48, cp153, cp156, cp169, cp180 |
| 4 | Workflow with side effects, re-entry, states added later, terminal states that reopen | cp8, cp36, cp46, cp65, cp155, cp208 |
| 5 | Gapless numbering, assigned on transition, per period or year, never reused, under concurrency | cp9, cp20, cp35, cp104, cp132, cp144, cp208 |
| 6 | Frozen snapshots vs live figures; re-freezing; reversal | cp10, cp15, cp18, cp46, cp65, cp73, cp76, cp160, cp194, cp216 |
| 7 | Four-eyes and roles; permission matrix; delegation; row-level visibility | cp13, cp23, cp53, cp54, cp61, cp92, cp199, cp206, cp237 |
| 8 | Optimistic locking, double submit, two users | cp14, cp69 |
| 9 | Imports: all-or-nothing vs row-wise, upsert keys, the same rules as the form | cp49, cp100, cp113, cp116, cp118, cp152, cp173 |
| 10 | Allocation that must total exactly; remainder rules; nested and weighted allocation | cp106, cp108, cp115, cp120, cp124, cp140, cp217, cp240 |
| 11 | Soft delete / retire / restore, dated, with references that keep counting | cp21, cp72, cp114, cp125, cp223 |
| 12 | Period close, reopen, soft vs hard close, which date places a record in a period | cp18, cp29, cp47, cp52, cp55, cp70, cp80, cp183, cp216 |
| 13 | Filtered totals vs all totals; totals over rows the user is not shown | cp60, cp204, cp206, cp244 |
| 14 | Export round-trips, quoting, locale-free files vs localised screens | cp33, cp129, cp135, cp157, cp162, cp227, cp231, cp234, cp243, cp250 |
| 15 | Clone/transfer/merge/undo: what copies, what re-points, what is restored | cp107, cp111, cp126, cp128, cp136, cp175, cp219, cp238 |
| 16 | Trees: cycles, parents, roll-ups across a hierarchy | cp109, cp110, cp112, cp132, cp139, cp150, cp201, cp204, cp222 |
| 17 | Recurring generation; changing a series after occurrences; end-of-month; pauses | cp131, cp141, cp142, cp203, cp205, cp213, cp220 |
| 18 | Holds and exclusions with changing semantics | cp22, cp40, cp120, cp182, cp184, cp200 |
| 19 | Grandfathering: new rule for records from today, old rule for old ones | cp35, cp144, cp156, cp208, cp232 |
| 20 | Business days, holidays, retroactive calendar changes | cp83, cp84, cp85, cp96, cp233 |
| 21 | Two semantics at once (a classic view beside the new one) | cp154, cp160 |
| 22 | Display rules that touch every surface (names, locale, columns) | cp157, cp158, cp192 |
| 23 | Consolidation across sheets with cross-cutting rules applied at the wrong level | cp110, cp201, cp204, cp244 |
| 24 | Reference data lifecycle: retire, rename, merge an enum that history depends on | cp223, cp225, cp229, cp232, cp245 |
| 25 | Preview / what-if under a different clock without side effects | cp226, cp227 |
| 26 | Policy versioning as a first-class record | cp248, cp249, cp250 |

### 8.1 What the literature adds

| # | Finding | Evidence | Where in the stream |
|---|---|---|---|
| L1 | **Feature isolation**: handlers that each pass their own test but share no state, so composed behaviour fails | SpecBench | every own spec composes the new feature with at least two priors (the degree check), and three generated two-user scenarios |
| L2 | **Hardcode-then-generalise**: an early checkpoint's cheapest passing choice is a literal; a later one needs the general form | SlopCodeBench | cp3 three grades → cp229 grades added; cp7 one rate → cp11 dated → cp153 versioned; cp9 one sequence → cp35 per period → cp144 per fiscal year → cp208 on settle; cp17 period by date → cp80 by due-by |
| L3 | **Conditional omission**: dropping a stated clause, worst for clauses late in a long request | Deep Dive taxonomy | the clause the fixtures bite on goes last; mutatives carry several clauses |
| L4 | **Misleading names**: a helper whose name no longer says what it does | Deep Dive taxonomy | mutations keep the concept's name and change its meaning: hold (cp22 → cp40 → cp184 → cp200), backing (cp27 → cp68 → cp108), number (cp9 → cp35 → cp104 → cp144 → cp208), period (cp17 → cp80), floor (cp24 → cp64 → cp196) |
| L5 | **Order of operations**: steps applied in the wrong sequence | Deep Dive taxonomy | cp64 and cp196 reorder floor and late charge; cp12 sum-of-rounded vs rounded-sum; cp140 remainder after weighting; cp240 round per holder |
| L6 | **Boundaries and corner cases**: out-of-bounds, empty, ties, zero, half-way | bug taxonomies | every fixture holds an empty case, a tie, a zero, a negative, a half-way rounding case and a value on each side of every inclusive boundary |
| L7 | **Happy-path error handling**: swallowed failures, silent defaults, state half-written | practitioner reviews | cp6: a refused change writes no audit line; cp14 double submit; cp19 one transaction; cp49, cp100, cp113 all-or-nothing |
| L8 | **Duplicated helpers**: 8× more duplicated blocks after AI adoption | GitClear | engines 1 and 2; cp154 (two summaries), cp192 (the name on every surface) are where a duplicate shows as a wrong value |
| L9 | **Concurrency**: races and deadlocks are the most frequent errors in generated concurrent code | CONCUR | cp9 gapless numbers under two simultaneous opens, cp14 optimistic lock and double submit, cp69 locks, cp58 one notify per user |
| L10 | **Reward hacking at the test seam**: memorised inputs, special-cased rows | EvilGenie, SpecBench | generated scenarios beside every story; ripple copies re-render under the new rule; tests are not editable (AGENTS.md) |
| L11 | **Rounding knowledge is language-specific** (Python half-even vs Java half-up) | Deep Dive | every rounding request states the mode with the half-way example: cp7, cp12, cp32, cp151 |
| L12 | **Classic domain falsehoods** (time, names, money) replicate historical bugs | LLMs are Bug Replicators | cp4, cp99, cp102 names; cp59 month ends; cp84, cp96 business days; cp141 day 31; fixed-point money throughout |
| L13 | **Partial propagation**: agents reach some of the files a change needs and miss the rest | LoLBench, SWE-Bench ProMax | every mutative's `mutates:` list is the propagation set; the wide ones (cp76, cp144, cp192, cp208, cp248) are the measurement |
| L14 | **Inherited erosion compounds**: top agents fail on corrections and regressions in later rounds | EvoCode-Bench, SWE-CI | regressions per checkpoint should accelerate once a chain's composite rises: test that slope, not the level |

## 9. Building a checkpoint

1. Add or change the rule in `hell.py` (gate it on `self.on("rule")`, register it in `RULES`; a
   new screen or cell goes in `SINCE`, `CELL_SINCE` or `TOP_SINCE`), and its request in
   `REQUESTS`. State the rule in full: the agent sees nothing else.
2. Write its story in `hell_scripts.py`: the actions a test takes and the figures it reads
   (`check`). Make the rule bite with the fixture and compose with at least two priors; refer to
   claim numbers symbolically.
3. Teach the generator the new action (`hell_gen.py`: `apply` and `candidates`), with the
   future-proofing a later additive rule needs (the module docstring lists the constraints), and
   without consuming a random draw before the checkpoint that adds the action (earlier scenarios
   must not change).
4. Add the helper to `acceptance/support/ui.ts` and the testid to `acceptance/support/README.md`.
5. `.venv/bin/python -m harness.stream_build --config config.yaml --stories` (seconds), then
   `--check --no-density --jobs 4 --to N` while authoring, then the full `--check --no-density`
   (about half an hour for 250 checkpoints at four workers), then without `--check` to write,
   then `--density-only` for `acceptance/DENSITY.md`, then `harness.checkpoint_lint`. Four workers
   and a per-checkpoint render cache keep the build at about 2 GB; eight unbounded workers ran the
   laptop out of memory.
6. Compile the written own specs with a stack's Playwright (`playwright test --list` over
   `acceptance/specs/cp*.spec.ts` and `ui.ts`).
7. Dry-gate the act against a real build before any chain pays for it (PLAN.md §7).

The 250 requests of the earlier world, from which Acts III to V were re-cut, are in git history
(`docs/REFACTOR_HELL_STREAM.md` at commit 2243be0).

## 10. Sources for §8.1

- SlopCodeBench — https://arxiv.org/html/2603.24755v1
- SWE-CI — https://arxiv.org/html/2603.03823v4
- SWE-EVO — https://arxiv.org/html/2512.18470v1
- EvoCode-Bench — https://arxiv.org/html/2605.24110v1
- SpecBench (reward hacking, feature isolation) — https://arxiv.org/html/2605.21384v1
- LoLBench — https://arxiv.org/html/2609.37143v1
- SWE-Bench ProMax — https://arxiv.org/html/2608.09802v1
- SWE-Touch — https://arxiv.org/abs/2608.02499v1
- EvilGenie — https://arxiv.org/html/2511.21654v2
- A Deep Dive Into LLM Code Generation Mistakes — https://arxiv.org/html/2411.01414v1
- Bugs in LLM-Generated Code: An Empirical Study — https://arxiv.org/html/2403.08937
- Unreliable in Practice? Errors in LLM-Generated Code — https://arxiv.org/html/2608.00661v1
- LLMs are Bug Replicators — https://arxiv.org/html/2503.11082v1
- CONCUR — https://arxiv.org/html/2603.03683v1
- GitClear duplication figures (via) — https://tianpan.co/blog/2026-04-20-vibe-code-at-scale-technical-debt
- Awesome Falsehood — https://github.com/sza-1/awesome-falsehood

## 11. The calibration run (October 2026): what the stream itself got wrong

Two stacks (angular-spring, tanstack-officefloor) were each run one chain through the stream
with the specs as they were. From cp86 on, both agents failed the same scenarios at the same
steps: a failure shared by two independent stacks is the stream's, not the agents'. The agents'
own final messages (they read the spec, so they name the line) were the diagnosis. Root causes,
all fixed in the model, the renderer or the helpers, never by weakening a rule:

- **Placement of a claim about to be added.** `placing_date` summed calendar days for a claim not
  yet created but used the business-day due-by (cp83/84) and the creation-day terms (cp180) once
  it existed. So the model refused adds, marked late entries and allowed pastes that no app
  could agree with: the single largest cause (closed-period refusals and LATE_ENTRY lines in
  dozens of scenarios).
- **Identities that were positions.** A claim's `seq` was `len(claims)` and its `idx` a count of
  the person's claims; a person's `order` was `len(people)`. Every removal (merge, transfer,
  reassign) let a later row reuse a number, so a spec could check one `claim-row` for two values
  in a row, or bind Fay's row and expect Ben's name. Now `seq` comes from family-wide counters a
  replay restores per journal entry, `idx` and `order` are one past the highest held, and
  `ui.claimAt` takes a rank, not an idx. The as-of view matches rows by `seq`.
- **The sheet token in a cell.** `sheet-parent`, `person-origin` and export lines went through
  `ts()` and reached the spec as the literal `__SHEET__-p`; `emit` now renders any string literal
  carrying the token as a template literal.
- **Helpers that assumed a clean form or a changing count** (above, §4), a quick-add by alias
  looked up by the typed text, a flag past its date waited for a reason that never shows, a
  dated setting expected the panel blank where the request says the starting value shows.
- **Model rules the requests did not state**, now stated at the checkpoint that introduces them
  (the model was right, the text was silent): the moved claim is its new person's newest (cp37);
  a retirement date set is retired at once (cp21, cp105); PERSON_EDITED's `terms=`/`contact=`
  appear when the value differs from what the row showed (cp63, cp99: "the form gave a value" is
  not observable); a viewer's bulk or generate button goes through with 0 done (cp54); the edit
  button of a claim in a closed period is refused (cp69); ALERT carries no `for=` (cp61,
  cp146); the as-of view covers every cell, notes and statement lines included (cp74, cp181);
  the dashboard under as-of (cp178); opened-order ties (cp111, cp126); a paste matches only
  claims that existed before it (cp152); merged statements show as lines (cp136, cp163); a
  part-settle is judged on the original claim (cp185); list lines are trimmed (cp202).
- **Model bugs the requests exposed:** a part-settle left its split behind when the settle was
  refused; a paste could add some lines before a later line's open was refused (both are now
  transactions over the model); a statement as of a date before the person existed matched
  another row by position (now refused).
- **The harness and the stacks:** an agent's `bin/start` left a JVM on the run's port and the
  next agent's `bin/e2e` tested that stale app; the run now frees the port before and after every
  agent turn, and `bin/e2e` refuses a port already served and waits up to five minutes for
  health instead of running against nothing.

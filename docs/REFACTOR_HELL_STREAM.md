# The refactor-hell stream — design and the 250 requests

_Draft 2026-10-17, literature folded in the same day (Section 4.1). **Status 2026-10-18:** the Act I
built from this document ran clean on angular-spring and tanstack-officefloor (one to four minutes a
checkpoint, zero genuine regressions, both agents recomputing every figure in the browser), so the
stream was **restarted** with three engines that close that escape hatch (statements that bind shown
figures, write-time ROLLUP/TOTALS audit, precedence exceptions), generated multi-user scenarios in
every spec and an interaction-density metric per checkpoint. The built stream is described in
`acceptance/WORKSPACE.md`; `harness/oracle/hell.py`, `hell_scripts.py`, `hell_gen.py` and
`harness.stream_build` produce it. The catalogue below (Sections 2, 4, 4.1) remains the source of
gotchas; the 250 requests of Section 6 are superseded as a sequence and kept as material._

_**Status 2026-10-19:** Act II (cp41–80) was built on the restarted world from the Act II–IV
material below, re-cut to the three engines: dated settings in force on the claim's date, period
figures by status as of the period's end, the late charge per boundary, the floor after the late
charge, trimmed totals, snapshots on every today change, periods by due-by, and an as-of view that
replays every change made on or before a date. The table in `acceptance/WORKSPACE.md` §2 is the
built sequence. Later the same day cp73 became a statement as of a date (the figures as they stood at
the end of that day, bound and written to the audit with asof=) and the as-of view moved to cp74,
replacing reminders: the two Act I chains showed every figure computed once in the browser for the
screen and again on the server for the audit, so the reconstruction is demanded first where only the
server can answer it, and the screen's as-of view comes one checkpoint later._

## 1. Why the current stream does not erode

Run `202610171149` (angular-spring, 250/250 clean, zero regressions) shows the shape of the
problem, not a strong stack.

- **Every rule is a pure function of one sheet's rows.** Nothing in the stream can only be
  observed server-side, so the cheapest correct solution is to fetch the rows and compute in the
  browser. The backend froze at cp50 as a row store; the front end absorbed 200 checkpoints in one
  copy-paste file that the erosion composite scores 0.
- **Arrange bypasses the write path.** `/__test__/seed` writes rows straight into storage, so no
  validation, default, side-effect or workflow rule on *writing* is ever exercised by a test. The
  forms are dead code to the gate.
- **There is one write path and one read surface.** A rule has exactly one place to live, so
  duplication never happens and a mutation never has a forgotten copy to miss.
- **Rules are global and timeless.** A redefinition replaces the old one everywhere. Production
  rules are not like that: they apply from a date, to records in a state, and some figures must
  *keep* the value they had when something happened.
- **There is one actor and no clock.** No permissions, no concurrency, no "who did this", no
  "as of when".

The stream below keeps the harness (blind agent, 3:1 cadence, `data-testid` + audit file, one
plain-English request per checkpoint, every value verified by a reference model) and changes the
*world* so that the cheap solution is wrong by cp20 and gets wronger.

## 2. The five engines of erosion

Each request is built on one or more of these. They are what makes veteran teams' systems rot.

1. **Many write paths, one rule.** The same data can be created or changed through the form, an
   inline edit, a bulk action, a CSV paste, a clone, a merge, a transfer, a plan generator, an
   undo and a restore. Every validation, default, numbering and side-effect rule must hold on all
   of them. A team that writes the rule where the first path lives forgets the sixth.
2. **Many read surfaces, one figure.** A figure shows in the row, the detail screen, the summary,
   the header counters, the print view, the statement, the export, the audit line, the as-of view
   and the consolidated parent. Mutations change the figure and the test reads it on several
   surfaces at once.
3. **Live, frozen, and as-of.** The same formula must be computed live (open claim), frozen at
   the moment something happened (settled claim, closed period, snapshot), and reconstructed as of
   a past date under the rules and reference data in force *then*. Three code paths that must
   agree whenever two of them apply to the same record.
4. **Rules in force at a date.** A mutation that says "from today onward" does not replace a rule;
   it versions it. Old-dated records keep the old rule. After a dozen of these the system needs a
   policy engine, and a team that sprinkled `if (date < X)` has a bitemporal swamp.
5. **Server-only observables.** The audit file is written by the server and carries computed
   figures, so the computation must exist server-side. Two signed-in users in two browser contexts
   see each other's effects. Numbering is gapless under concurrent opens. Exports are files. The
   sheet's "today" is a server setting. These force logic into the backend or force a duplicate of
   it, which is the trap: the duplicate is what gets forgotten.

## 3. Test-contract changes this stream needs

- **No seed API.** `/__test__/reset`, `/__test__/seed` and `/__test__/fixture` are retired (the
  current `acceptance/support/seed.ts` and AGENTS.md §4 go). Every spec arranges its data through
  the screens, using harness-owned helpers in `e2e/support/ui.ts` (`signIn`, `setToday`,
  `addPerson`, `addClaim`, `openClaim`, `settleClaim`, `pasteImport`, ...) that bind only to
  `data-testid`. A helper is extended by the checkpoint that adds the screen it drives. Each test
  uses a fresh sheet id, so no reset is needed and tests can run in parallel; audit lines carry
  `sheet=` and specs filter by it.
- **Identity on screen.** Sign-in is a name, no password. Specs open a second browser context to
  act as a second user.
- **The clock on screen.** Each sheet has a "today" on its settings screen. Every date decision
  uses it. The real clock is only the default.
- **Downloads are assertable.** Export checkpoints assert the downloaded file's text.
- **Specs are longer and slower.** Arranging five people and a few claims through screens is
  50–100 actions. Budget roughly 10–20 s per spec and run workers in parallel against one app.
- **Specs come from a reference model, never an agent.** The PetClinic and test-fidelity results
  show an agent cannot keep tests accurate even on one endpoint. The model here must be a
  stateful simulator of the UI script (users, dates, workflow, histories), not a formula table;
  see Section 7.

## 4. The catalogue: what veteran teams get wrong, and where the stream uses it

| # | Gotcha | Enters at | Exploited by (mutatives) |
|---|---|---|---|
| 1 | Normalised uniqueness (case, whitespace, aliases, scope changes, grandfathered violations) | cp4 | cp16, cp84, cp100 |
| 2 | Fixed-point money, rounding modes, sum-of-rounded vs rounded-sum, penny allocation | cp5, cp7, cp18 | cp12, cp44, cp48, cp140 |
| 3 | Effective-dated reference data (rates, grades, terms, settings) | cp8 | cp52, cp56, cp76, cp123, cp180 |
| 4 | Workflow with side effects, re-entry, states added later, terminal states that reopen | cp9 | cp20, cp64, cp160, cp196, cp205 |
| 5 | Gapless numbering, assigned on transition, prefixes, per-period/year reset, never reused | cp10 | cp32, cp72, cp116, cp144, cp208 |
| 6 | Frozen snapshots vs live figures; re-freezing; reversal | cp11 | cp28, cp64, cp196, cp216 |
| 7 | Four-eyes and roles; permission matrix; delegation; row-level visibility | cp13 | cp92, cp132, cp172 |
| 8 | Optimistic locking, double submit, two users | cp14 | cp93, cp159 |
| 9 | Imports: all-or-nothing vs row-wise, upsert keys, same rules as the form | cp15 | cp16, cp136, cp152 |
| 10 | Allocation that must total exactly; remainder rules; nested allocation | cp17 | cp48, cp140, cp168, cp244 |
| 11 | Soft delete / retire / restore, dated, with references that keep counting | cp19 | cp24, cp88, cp160 |
| 12 | Period close, reopen, soft vs hard close, which date places a record in a period | cp21 | cp80, cp108, cp130, cp176 |
| 13 | Filtered totals vs all totals vs page totals | cp26 | cp184 |
| 14 | Export round-trips, quoting, locale-free files vs localised screens | cp27, cp41 | cp72, cp192 |
| 15 | Clone/transfer/merge/undo: what copies, what re-points, what is restored | cp31, cp57, cp61 | cp58, cp100, cp188 |
| 16 | Trees: cycles, subtree moves, roll-ups excluding states | cp33 | cp112, cp132 |
| 17 | Recurring generation; changing a series after occurrences; end-of-month; pauses | cp35 | cp36, cp120, cp220 |
| 18 | Holds and exclusions with changing semantics | cp40 | cp60, cp112, cp120, cp200 |
| 19 | Grandfathering: new rule for records from today, old rule for old ones | cp44 | cp56, cp80, cp95, cp144, cp208 |
| 20 | Business days, holidays, retroactive calendar changes | cp95 | cp96, cp173 |
| 21 | Two semantics at once (a classic view that keeps old rules beside the new view) | cp161 | cp164, cp204 |
| 22 | Display rules that touch every surface (name rendering, flags) | cp189 | cp192 |
| 23 | Consolidation across sheets with cross-cutting rules applied at the wrong level | cp201 | cp204 |
| 24 | Reference data lifecycle: retire, rename, merge an enum that history depends on | cp229 | cp232 |
| 25 | Preview/what-if under a different clock without side effects | cp233 | cp236 |
| 26 | Policy versioning as a first-class record (the finale) | cp248 | — |

### 4.1 What the literature adds (folded in 2026-10-17)

The long-horizon benchmarks and bug taxonomies name failure modes the table above did not. Each
is now either a design rule for the specs (Section 7) or a specific checkpoint.

| # | Finding | Evidence | Where in the stream |
|---|---|---|---|
| L1 | **Feature isolation**: handlers that each pass their own test but share no state, so composed behaviour fails; the gap grows ~27 points per tenfold code size | SpecBench | Spec rule: every own spec composes the new feature with at least two priors (a held person, a closed period, a retired member, a second user) |
| L2 | **Hardcode-then-generalise**: an early checkpoint's cheapest passing choice is a literal; a later one needs the general form | SlopCodeBench (`*.py` glob) | cp03 grade list → cp229 editable grades; cp07 three rates → cp08 dated rates; cp10 one sequence → cp32/cp144 per period/year; cp21 one period kind → cp80 by due-by |
| L3 | **Conditional omission**: the largest non-syntactic error class is dropping a stated clause, worst for clauses late in a long request | Deep Dive taxonomy (CE, positional sensitivity) | Request rule: the clause the fixtures bite on goes last; mutatives carry three or four clauses (cp12, cp40, cp152, cp248) |
| L4 | **Misleading names**: a helper whose name no longer says what it does | Deep Dive taxonomy (MFS) | Mutations keep the concept's name and change its meaning: hold (cp40→cp60→cp200), backing (cp25→cp68), total (cp164), period (cp80, cp108), number (cp32, cp144, cp208) |
| L5 | **Order of operations**: steps applied in the wrong sequence | Deep Dive taxonomy (MOOV) | cp128 reorders the due pipeline (floor after late charge); cp12 sum-of-rounded vs rounded-sum; cp140 remainder after weighting; cp240 round per holder |
| L6 | **Boundaries and corner cases**: out-of-bounds, empty, ties, zero, half-way | Bug taxonomies (Missing Corner Case; out-of-bounds 46–60% of runtime errors) | Fixture rule: every fixture holds an empty case, a tie, a zero, a negative, a half-way rounding case and a value on each side of every inclusive boundary |
| L7 | **Happy-path error handling**: swallowed failures, silent defaults, state half-written | Practitioner reviews of agent code | cp06: a refused change writes no audit line and changes nothing; cp14 double-submit; cp15 all-or-nothing; cp62 default change touches nobody; cp136 batch all-or-nothing |
| L8 | **Duplicated helpers**: 8× more duplicated blocks after AI adoption | GitClear | Engines 1 and 2; cp161 (two summaries) and cp192 (name on every surface) are where a duplicate shows as a wrong value |
| L9 | **Concurrency**: races and deadlocks are the most frequent errors in generated concurrent code; agents design concurrency without implementing it | CONCUR | cp10 gapless numbers under two simultaneous opens, cp14 optimistic lock and double submit, cp159 locks, cp78 one notify per user |
| L10 | **Reward hacking at the test seam**: memorised inputs, special-cased rows | EvilGenie, SpecBench | Spec rule: ripple copies use different fixtures from the own spec; tests are not editable (AGENTS.md) |
| L11 | **Rounding knowledge is language-specific** (Python half-even vs Java half-up) | Deep Dive (ITK) | Every rounding request states the mode with the half-way example: cp07, cp12, cp44, cp169, cp248 |
| L12 | **Classic domain falsehoods** (time, names, money) are inherited from surrounding code: 44% of generated bugs replicate a historical bug at that location | LLMs are Bug Replicators; falsehood lists | cp04/cp26/cp137 name normalisation, cp41 locale, cp79 month ends, cp94 leap day, cp141 day 31, cp95/cp96 business days, fixed-point money throughout |
| L13 | **Partial propagation**: agents reach some of the files a change needs and miss the rest (function recall 21–53%) | LoLBench, SWE-Bench ProMax | Every mutative's `re-enters` list is the propagation set; the wide ones (cp92, cp152, cp192, cp248) are the measurement |
| L14 | **Inherited erosion compounds**: top agents fail on corrections and regressions in later rounds, not first implementations | EvoCode-Bench, SWE-CI | Analysis: regressions per checkpoint should accelerate once a chain's erosion composite rises; test that slope, not just the level |

## 5. The world

Meaningless nouns, real mechanisms. Nothing here is a business domain; every mechanism is one
production systems have.

- **Sheet**: the workspace, by id. Has settings (today, floor, cap, terms, late percent, prefix,
  unit, fiscal-year start, holidays, roles, policy dates) and later a parent sheet.
- **User**: signed in by name. Has a locale and, per sheet, a role (`clerk` by default, `steward`,
  later `viewer`). A user may also be a person on the sheet, by name.
- **Person**: name, grade (A/B/C from a list), onset (date), alpha, beta (whole numbers, blank
  allowed), hold, retired-from, mentor, aliases, flags, position, contact.
- **Claim**: belongs to a person; amount (2 decimals), date, note, status
  (DRAFT → OPEN → SETTLED, VOID; later PENDING, REVIEW), number, due-by, lines, tags, unit, proofs.
- **Rate**: per grade (later per grade and unit), effective-dated.
- **Period**: named date range; closable (soft/hard); later per fiscal year.
- **Pool**: members with shares that must total 100.00; cuts of a pot; later nested, weighted,
  unified with crews.
- **Plan**: generates claims for a person every N days (later monthly) between dates.
- **Audit file**: `EVENT sheet=<id> by=<user> key=value ...`, one line per record, written by the
  app, read by specs through `auditLines()`.

Figures (each is shown wherever the request says, and `rollup-*`/`concept-*` anchors apply):
`due` (claim), `due-total`, `settled-total`, `open-total`, `overdue-total`, `backing`, `reach`,
`cut`, `score`, period totals, statement balances.

## 6. The 250 requests

Format: `cpNN [A|M] slug` then the request as the agent would read it. Mutatives list what they
re-enter (`re-enters:`), which becomes the `mutates:` list. Cadence 3:1, mutative when N % 4 = 0.

### Act I — foundation with the traps laid (cp1–40)

**cp01 [A] sign-in-and-sheet** — Anyone using the app first signs in by typing a name; no password.
The signed-in name shows on every screen. A sheet is chosen by typing its id and loading it; the
active sheet id shows on every screen, and everything else in the app is kept per sheet. A sheet
that has never been loaded before starts empty.

**cp02 [A] sheet-today** — Each sheet has a "today" date on its settings screen. It starts as the
real date and can be changed to any date. Every decision in the app that depends on the date (and
every default date) uses the sheet's today, never the real clock. Show the sheet's today on every
screen.

**cp03 [A] people** — Keep a list of people on the sheet. Each has a name (required), a grade (A,
B or C), an onset date, and two whole numbers alpha and beta, any of which may be blank. People
are added and edited through a form. Show all the people in the order they were added, each with
every value.

**cp04 [M] name-uniqueness** — A person's name must be unique on the sheet, comparing without
regard to case and ignoring spaces before and after. Names are stored with those spaces removed and
shown that way. Adding or editing a person to a name already in use is refused with an error on
the name field, and nothing is saved. re-enters: cp03.

**cp05 [A] claims** — A person can have claims. A claim has an amount (a number with up to two
decimals, required, may be 0.00), a date (defaults to the sheet's today), and a note. Claims are
added from the person's row and listed under it, newest first. Show each person's claimed: the sum
of their claims' amounts, with two decimals. Show the sheet's claimed-total.

**cp06 [A] audit** — Record every change to the sheet in the audit file: adding or editing a person
(`PERSON_ADDED`, `PERSON_EDITED` with `id=` and `name=`), adding a claim (`CLAIM_ADDED` with
`claim=`, `person=`, `amount=`). Every line carries `sheet=` and `by=` (the signed-in user). The
amount in a line is written exactly as the screen shows it. A change that is refused (by any rule,
now or later) writes no line and changes nothing.

**cp07 [A] rates-and-due** — The sheet has a rate for each grade: a percent with two decimals, set
on a rates screen. A claim's due is its amount times the rate for its person's grade, divided by
100, rounded half up to two decimals (0.005 rounds up). Show due on each claim, each person's
due-total (the sum of their claims' due), and the sheet's due-total. A grade with no rate makes
its claims' due n/a, and a total skips n/a.

**cp08 [M] rates-effective-dated** — A rate now has a from-date. A grade may have several rates
with different from-dates; a claim uses the rate whose from-date is the latest one on or before
the claim's date. A claim dated before the grade's earliest rate has due n/a. The rates screen
lists every rate row and marks, per grade, the one in force on the sheet's today. re-enters: cp07.

**cp09 [A] workflow** — A claim has a status: it starts as DRAFT; it can be opened (OPEN) and then
settled (SETTLED); a DRAFT or OPEN claim can be voided (VOID). A SETTLED or VOID claim cannot
change status. Only OPEN and SETTLED claims count toward due-total, claimed and every total; show
each claim's status and the buttons to move it. Every status change writes an audit line
(`CLAIM_OPENED`, `CLAIM_SETTLED`, `CLAIM_VOIDED`, with `claim=`).

**cp10 [A] numbering** — When a claim is opened it receives the next number on the sheet: 1 for
the first claim ever opened, then 2, and so on, with no gaps and never reused, even when two users
open claims at the same moment. Drafts have no number. Show the number on the claim, and include
`number=` in `CLAIM_OPENED`.

**cp11 [A] settle-freezes-due** — Settling a claim fixes its due: the figure it had at the moment
of settling is kept, and later changes to rates do not alter it. Open claims stay live. Show the
frozen figure in the same place as before, and include `due=` in `CLAIM_SETTLED`.

**cp12 [M] half-even-and-sum-of-rounded** — Live due now rounds half to even (0.125 to 0.12, 0.135
to 0.14). A settled claim keeps its frozen figure. Every due-total is the sum of the already-rounded
claim figures, not the rounded sum. re-enters: cp07, cp11.

**cp13 [A] four-eyes** — A claim records who opened it. The user who opened a claim cannot settle
it; the settle action is refused with an error naming the opener, and the status is unchanged.
Show opened-by on the claim.

**cp14 [A] edit-conflict** — When a person is edited, the form remembers which version of the
person it loaded. If someone else has saved that person in the meantime, saving is refused with an
error saying the person has changed, nothing is stored, and the form shows the current values.
Saving again from the refreshed form works. Submitting any form twice before the first submit has
answered stores one record, not two.

**cp15 [A] import-people** — People can be pasted in as lines of `name,grade,onset,alpha,beta`
into an import box. A blank field is left blank. All the lines are checked first, with the same
rules as the form (a name already on the sheet or repeated in the paste is an error): if any line
has an error, nothing is imported and every error is listed with its line number; otherwise all
are added, in order, each with a `PERSON_ADDED` audit line.

**cp16 [M] import-upserts** — Pasting a line whose name matches an existing person (the same
comparison as uniqueness) now updates that person with the fields the line gives, leaving a blank
field untouched, and writes `PERSON_EDITED`. New names are added as before. Errors still mean
nothing is imported. The import reports how many were added and how many updated. re-enters:
cp15, cp04, cp06.

**cp17 [A] pools** — A pool has a name and members, each a person with a share percent (two
decimals). A pool is balanced when the shares total exactly 100.00; show balanced yes/no and the
total. A person can be in several pools.

**cp18 [A] pool-cuts** — The sheet has a pot amount (two decimals, settings). Each pool member's
cut is pot times share divided by 100, rounded half even to two decimals; the remainder (pot minus
the sum of the cuts) is added to the member with the largest share, earliest-added on a tie, so
the cuts total exactly the pot. An unbalanced pool shows no cuts.

**cp19 [A] retire** — A person can be retired. Retired people are hidden from the list unless
"show retired" is on; no claims can be added to them; their existing claims keep counting in every
total. In a pool a retired member's share counts as 0.00 for the cut (so the pool may stop being
balanced). Show retired yes/no.

**cp20 [M] open-claims-immutable** — An OPEN claim's amount, date and note can no longer be
edited; only a DRAFT can. To change an OPEN claim, void it and add a new one. A voided claim keeps
its number (numbers are never reused), and `CLAIM_VOIDED` includes `number=`. re-enters: cp05,
cp09, cp10.

**cp21 [A] periods** — The sheet has periods: a name and a from and to date, inclusive, no two
overlapping. A claim belongs to the period containing its date, or to none. Show each claim's
period, and per period the due-total of its OPEN and SETTLED claims.

**cp22 [A] close-period** — A period can be closed. Closing fixes its due-total at that moment;
later rate changes do not alter it. No claim dated inside a closed period can be added, opened,
settled or voided; each is refused with an error naming the period. Write `PERIOD_CLOSED`
(`period=`, `total=`).

**cp23 [A] person-detail** — Add a person detail screen reached from the row. It shows the person's
values, their claims with every figure, their due-total, the pools they are in with their cuts,
and the audit lines about them, newest first.

**cp24 [M] retirement-dated** — Retiring takes a date (default the sheet's today). A claim dated
after a person's retirement date is refused; claims dated on or before it are allowed even if
added later. Show retired-from. re-enters: cp19, cp05, cp15.

**cp25 [A] patrons-and-backing** — A person may name other people on the sheet as their patrons
(any number, not themselves). Show each person's patrons (names, comma-separated, sorted), and
their backing: the sum of their patrons' due-total, 0.00 with none.

**cp26 [A] search-and-shown-totals** — A search box filters the people list by name containing
the typed text, ignoring case and accents (é matches e). Show shown-due-total over the people
listed, beside the sheet's due-total over everyone. Retired people are only searched when "show
retired" is on.

**cp27 [A] export-people** — A button downloads the people as a CSV file with the same columns as
the import, plus due-total, one header line, retired people included. A value holding a comma, a
quote or a line break is quoted, with quotes doubled. Pasting the exported lines (without the
header and the due-total column) back into the import changes nothing.

**cp28 [M] floor** — The sheet has a floor (two decimals, default 0.00). A claim's live due is at
least the floor. A settled claim's frozen figure and a closed period's fixed total are unchanged by
a floor change. The floor shows in every place due appears: rows, detail, exports and audit lines.
re-enters: cp07, cp11, cp12, cp22, cp23, cp27.

**cp29 [A] roles-and-reopen** — The sheet's settings assign a role to a user name: clerk (the
default for any name) or steward. Only a steward can close a period, and only a steward can reopen
one. Reopening makes the period's total live again. Write `PERIOD_REOPENED`.

**cp30 [A] claim-tags** — A claim can carry any number of tags (short words). The claims under a
person can be filtered by tag, and the sheet shows a due-total per tag (a claim with two tags
counts in both).

**cp31 [A] clone-sheet** — A sheet can be cloned to a new id. The clone copies the settings, people,
rates, pools, periods and claims. Patrons and pool members point to the cloned people. Claims keep
their status and frozen figures; numbers are reassigned in the clone in the order the originals
were opened. Periods are copied open. Write `SHEET_CLONED` (`from=`) on the clone.

**cp32 [M] numbering-per-period** — Claims opened from the sheet's today onward are numbered within
their period, starting at 1 in each period and shown as `<period name>-<n>`; a claim in no period
is numbered in its own sequence as `X-<n>`. Claims opened earlier keep their old numbers. The
sheet records the date this started. re-enters: cp10, cp20, cp31.

**cp33 [A] mentors-and-reach** — A person may have one mentor (another person). A person cannot be
their own mentor, directly or through a chain; such a change is refused. Show each person's
depth (0 with no mentor) and reach: their due-total plus the reach of everyone they mentor.

**cp34 [A] move-subtree** — Changing a person's mentor moves everyone under them as well; reach
and depth follow. Moving a person under someone who is below them in the chain is refused.

**cp35 [A] plans** — A person can have plans: an amount, a start date, every N days, and an end
date. A "generate" button creates a DRAFT claim with that amount for every plan date from the start
up to the sheet's today that does not already have one; pressing it again creates nothing new.
Show per plan how many claims it has generated.

**cp36 [M] plan-changes-forward-only** — Changing a plan's amount affects only claims generated
after the change; already generated claims keep theirs. Changing the interval continues from the
last generated date (the next date is that date plus the new interval). re-enters: cp35.

**cp37 [A] clerk-limit** — The sheet has a clerk limit (two decimals). A clerk can settle a claim
only when its due is at or below the limit; above it, settling is refused with an error naming the
limit. Stewards settle anything (four-eyes still applies).

**cp38 [A] summary-screen** — Add a summary screen for the sheet: per grade the count of people,
due-total, settled-total (settled claims) and open-total (open claims); per period the same; per
pool the cut total. Every figure must agree with the figures on the people list.

**cp39 [A] quick-add** — A quick-add bar on the people list takes a name and an amount and creates
a DRAFT claim dated today with an empty note for the named person, creating the person first (grade
A, nothing else) if the name is not on the sheet. Every rule that applies to the forms applies
here.

**cp40 [M] hold** — A person can be put on hold. While held, their OPEN claims count in no live
total (sheet, period, grade, pool cut, backing, reach, tag), but their SETTLED claims still do. A
closed period's fixed total is unchanged. Their own row still shows their figures. re-enters:
cp05, cp07, cp17, cp18, cp21, cp25, cp30, cp33, cp38.

### Act II — time, freezing, permissions (cp41–80)

**cp41 [A] user-locale** — Each user has a locale on a user screen: `en` shows amounts as
1,234.56 and `de` shows 1.234,56. Every amount on every screen is shown in the signed-in user's
locale. Exports and audit lines always use a dot and no grouping.

**cp42 [A] no-future-claims** — A claim's date cannot be after the sheet's today; adding or editing
one is refused with an error on the date. Plans never generate beyond today (they already don't).

**cp43 [A] rate-end-dates** — A rate row may have an end date. A claim whose date falls after a
rate's end and before the next rate's start has due n/a. A total that skipped an n/a is marked
incomplete beside the figure.

**cp44 [M] rounding-policy-date** — Claims dated before the sheet's policy date (a setting, set to
the sheet's today when this change lands) round half up; claims dated on or after it round half
to even. Everything that reads due follows. Settled figures stay frozen. re-enters: cp07, cp12,
cp28.

**cp45 [A] bulk-open** — Claims can be selected and opened together. Each that can be opened is
opened and numbered in list order; each that cannot is reported with its reason, and the rest
still go through.

**cp46 [A] comments** — A claim can have comments, each with the user and the sheet's today when
written, shown in order and in the detail screen; each writes `COMMENT_ADDED`.

**cp47 [A] pool-membership-dated** — A pool member has a from and an optional to date. Cuts are
worked out on the sheet's today over the members whose dates include it; others are ignored, and
balance is judged over the included members' shares.

**cp48 [M] remainder-to-smallest** — The pool remainder now goes to the included member with the
smallest non-zero cut, latest-added on a tie. re-enters: cp18, cp38, cp47.

**cp49 [A] reassign-claim** — A steward can move a DRAFT or OPEN claim to another person on the
sheet. The number stays, totals follow, and `CLAIM_REASSIGNED` (`from=`, `to=`) is written. A
settled claim cannot move.

**cp50 [A] cap** — The sheet has a cap (two decimals, blank for none). A person's due-total is
capped at it; show the excess beside it. Backing and reach use the capped figure.

**cp51 [A] claim-lines** — A claim may have lines: a label, a quantity (whole number) and a unit
amount (two decimals). When a claim has any line its amount is the sum of quantity times unit
amount over the lines and cannot be typed; with no lines it is typed as before.

**cp52 [M] grade-dated** — A person's grade is now dated: changing it records a from-date (default
today) and keeps the history. A claim uses the grade in force on the claim's date to find its rate.
The list shows the current grade; the detail screen shows the history. re-enters: cp03, cp07, cp08,
cp15, cp16, cp38.

**cp53 [A] approvals** — When a clerk settles a claim above the clerk limit it goes to PENDING
instead of being refused. A steward approves (SETTLED, frozen at that moment) or rejects with a
reason (back to OPEN). Audit `CLAIM_PENDING`, `CLAIM_APPROVED`, `CLAIM_REJECTED` (`reason=`).

**cp54 [A] due-by-and-overdue** — A claim has a due-by date, defaulting to its date plus the
sheet's terms (a number of days, settings). A claim is overdue when OPEN and due-by is before the
sheet's today. Show overdue on the claim, and per person and sheet an overdue count and
overdue-total.

**cp55 [A] late-charge** — The sheet has a late percent. An overdue claim's live due gains late
percent of its due for every full 30 days overdue, rounded like due. Settling freezes it in.

**cp56 [M] terms-per-grade** — Terms are now per grade and dated. A claim's due-by is fixed when
the claim is created, using the terms of its person's grade in force then; existing claims keep
their due-by. re-enters: cp54, cp52.

**cp57 [A] merge-people** — A steward can merge person B into person A. B's claims, patrons,
pool memberships, plans, and mentees move to A; a patron or pool link A already has is not
duplicated; B's mentor is dropped. B is hidden and shows "merged into A" on its detail screen.
Numbers do not change. Write `PERSON_MERGED` (`from=`, `into=`).

**cp58 [A] undo-merge** — A merge can be undone on the same sheet-today it was made. Everything
that came from B goes back; anything added to A since stays with A. Write `MERGE_UNDONE`.

**cp59 [A] filters-with-totals** — The claims across the sheet can be listed on their own screen,
filtered by grade, period, status and tag together, with a due-total over the claims shown.

**cp60 [M] hold-interval** — A hold now has a from and to date. Only claims dated within the hold
interval are left out of live totals; the person's other open claims count. Holds can be ended
early; the history is kept. re-enters: cp40.

**cp61 [A] transfer-person** — A steward can move a person with their claims to another sheet.
In the target they are numbered afresh in the order they were opened, by the target's numbering;
the source shows "moved to". Both sheets write `PERSON_TRANSFERRED`.

**cp62 [A] default-grade** — The sheet's settings have a default grade for new people, used by
the form, quick-add and import when none is given. Changing it does not change anyone.

**cp63 [A] parent-sheet-rates** — A sheet may name a parent sheet. When a grade has no rate in
force on a date on the sheet, the parent's rate for that grade and date is used, then the parent's
parent, up to three levels. A sheet cannot be its own ancestor.

**cp64 [M] re-settle** — A steward can re-settle a settled claim: its due is frozen again under the
current rules and rates. Write `CLAIM_RESETTLED` (`old=`, `new=`). re-enters: cp11.

**cp65 [A] split-claim** — A DRAFT or OPEN claim can be split by amount into two. Lines are split
in proportion with the remainder on the larger part. An OPEN second part receives the next number.
Both show the original's number as their origin.

**cp66 [A] auto-close** — The sheet has grace days. When the sheet's today is changed, every open
period whose end plus grace days is before the new today closes, writing `PERIOD_CLOSED` with
`auto=yes`.

**cp67 [A] header-counters** — The sheet header shows people count, claims by status, and
due-total, on every screen, always equal to the summary screen's figures.

**cp68 [M] backing-recent-settled** — Backing is now the sum of patrons' settled-total over
claims dated within the 90 days up to and including the sheet's today. re-enters: cp25, cp38, cp50.

**cp69 [A] aliases** — A person may have aliases. Search matches aliases; uniqueness applies to
names and aliases together; an import line matches a person by name or alias.

**cp70 [A] proofs** — A claim has a proofs count, raised by a button. A claim above the proof
threshold (settings) cannot be settled or approved with zero proofs.

**cp71 [A] edit-comment** — A comment can be edited by its author on the sheet-today it was
written; show edited yes/no and write `COMMENT_EDITED`.

**cp72 [M] numbering-prefix** — The sheet has a number prefix. Every claim number is shown with
the prefix in front, including old numbers, in rows, detail, exports and new audit lines. Audit
lines already written are not rewritten. re-enters: cp10, cp27, cp32.

**cp73 [A] sorting** — The people list can be sorted by name, grade, due-total or overdue count,
stable, with names ordered by the signed-in user's locale.

**cp74 [A] archive-sheet** — A steward can archive a sheet: everything is viewable, every change
is refused with an error, including through import, plans and quick-add.

**cp75 [A] rate-precision** — A rate may have three decimals. Due is still rounded to two.

**cp76 [M] cap-per-grade-per-period** — The cap is now per grade, dated, and applies to a person's
due-total within each period rather than overall; show the excess per period on the detail screen.
re-enters: cp50, cp21, cp52, cp68.

**cp77 [A] watch-list** — A user can watch people. A "watched" view lists them with the same
figures as the people list.

**cp78 [A] notify-on-settle** — When a watched person's claim is settled, write `NOTIFY`
(`user=`, `claim=`) once per watching user per claim, however many times they watch.

**cp79 [A] period-templates** — Generate monthly periods between two dates: each runs from the
first to the last day of its month (February ends on the 28th or 29th), named `YYYY-MM`.

**cp80 [M] period-by-due-by** — Claims opened from the sheet's today onward belong to the period
containing their due-by date; claims opened earlier keep their period by claim date. Period totals,
closing rules and numbering follow. re-enters: cp21, cp22, cp32, cp54, cp66.

### Act III — identity, hierarchy, cross-sheet (cp81–120)

**cp81 [A] audit-viewer** — Add an audit screen that lists the sheet's audit lines newest first,
filterable by person or claim. It shows exactly what is in the file for this sheet.

**cp82 [A] claim-templates** — Named claim templates hold lines. A claim can be created from a
template, copying its lines at that moment; later changes to the template do not alter claims made
from it.

**cp83 [A] nested-pools** — A pool member may be another pool, with a share like a person's. A
pool's cut flows into its member pool as that pool's pot. A pool cannot contain itself through any
chain, and nesting is at most three deep.

**cp84 [M] uniqueness-across-parents** — A name or alias may not be used on a sheet if any
ancestor sheet already uses it. Existing clashes are not fixed: the person is marked clashing, and
every edit of them is refused until renamed; imports and quick-add refuse new clashes. re-enters:
cp04, cp15, cp16, cp39, cp63, cp69.

**cp85 [A] manual-order** — People have a position; move up / move down buttons change it. The
list shows people in position order by default. New and imported people go to the end; a merged-in
person keeps A's position.

**cp86 [A] units** — The sheet lists units (short codes) with a dated conversion rate to the
sheet's own unit (four decimals). A claim has a unit (default the sheet's). Due is worked out in
the sheet's unit using the conversion in force on the claim's date, after the rate, rounded once.

**cp87 [A] active** — A person is active when they have an OPEN claim dated within the 30 days up
to the sheet's today. Show active yes/no and the count of active people per grade on the summary.

**cp88 [M] unretire** — A retired person can be unretired; the retirement history is kept and
shown. Claims dated within a past retirement interval are refused; claims after the unretire date
are allowed. re-enters: cp19, cp24.

**cp89 [A] bulk-grade** — Selected people can be given a grade together, as a dated grade change
from a chosen date, with the same history as a single change.

**cp90 [A] my-claims** — A user whose name matches a person sees a "my claims" view of that
person's claims. A clerk sees only their own claims on the claims screen; a steward sees all.

**cp91 [A] remind** — A "remind" action on an OPEN claim writes `REMIND` (`claim=`), at most once
per claim per sheet-today; a second press that day does nothing and says so.

**cp92 [M] permission-matrix** — Sheet settings now say which roles may open, settle, void,
reassign, close and reopen, with the current behaviour as the defaults. Every action checks the
matrix. Four-eyes and the clerk limit still apply on top. re-enters: cp13, cp29, cp37, cp49,
cp53, cp90.

**cp93 [A] inline-edit** — Alpha and beta can be edited directly in the row, with the same
validation and the same conflict rule as the form.

**cp94 [A] age-bands** — A person's age is their whole years from onset to the sheet's today
(an onset of 29 February counts the birthday as 28 February in other years). Show age, and on the
summary the count of people in bands 0–17, 18–39, 40–64 and 65+.

**cp95 [A] business-day-terms** — For claims created from the sheet's today onward, terms count
business days (Saturday and Sunday are skipped); earlier claims keep their due-by.

**cp96 [M] holidays** — The sheet has a holidays list of dates, also skipped when counting
business days. Adding a holiday re-dates the due-by of claims whose due-by has not yet passed;
claims already overdue keep theirs. re-enters: cp54, cp95.

**cp97 [A] person-tags** — A person can carry tags; a claim is found by its person's tags as well
as its own in filters and tag totals (counted once).

**cp98 [A] status-history** — Every status change is kept with the user, the sheet's today when it
happened, and the claim's due as computed at that moment. Show the history on the claim's detail.

**cp99 [A] rate-preview** — The rates screen shows, for a typed candidate rate per grade, how many
open claims would change and the total difference in due. Nothing is saved.

**cp100 [M] transfer-merges** — Transferring a person to a sheet that already has a person of the
same name (by the uniqueness comparison, including aliases) merges into that person, as a merge
does, instead of being refused. re-enters: cp57, cp61, cp84.

**cp101 [A] daily-snapshot** — When the sheet's today changes, write `SNAPSHOT` (`person=`,
`due=`) for every person with their due-total as of the day being left, and show the snapshots on
the person's detail.

**cp102 [A] proof-threshold-per-grade** — The proof threshold is per grade, dated like rates.

**cp103 [A] line-kinds** — A line has a kind from a sheet list; each kind has a multiplier (two
decimals, default 1.00) applied to that line's amount before the rate.

**cp104 [M] amount-tolerance** — A claim's amount can be typed even with lines, as long as it is
within the sheet's tolerance of the lines' total; the typed amount is what counts, and the
difference is shown. Outside the tolerance the save is refused. re-enters: cp51, cp65.

**cp105 [A] shared-people** — A person can be lent to another sheet by id. On that sheet they
appear read-only with their home figures, excluded from the borrowing sheet's totals, marked
"from <sheet>".

**cp106 [A] pool-preview** — Editing pool shares shows the cuts that would result before saving.

**cp107 [A] period-comparison** — The summary shows for each period the change in due-total from
the previous period (by date order), blank for the first.

**cp108 [M] period-figures-as-of-end** — A period's figures count each claim by the status it had
on the period's end date (a claim settled afterwards counts as open for that period, using the
status history). A closed period's fixed total is unchanged. re-enters: cp21, cp22, cp38, cp107.

**cp109 [A] print-view** — A print view for a person on one page: values, histories, claims,
figures, pools, mentor chain, comments.

**cp110 [A] person-wizard** — A two-step wizard creates a person and their first claim together;
cancelling at step two creates nothing. Every rule applies.

**cp111 [A] duplicate-warning** — Adding a claim with the same amount and date as another of the
person's claims shows a warning and requires confirming; confirming adds it.

**cp112 [M] reach-settled-only** — Reach is now the person's settled-total plus the reach of their
mentees, leaving out held and retired people entirely. re-enters: cp33, cp34, cp40, cp60.

**cp113 [A] deferred-claims** — A claim can be deferred to a date. Until the sheet's today reaches
it, the claim counts in no total and cannot be settled; from then on it behaves as OPEN.

**cp114 [A] age-buckets** — The summary shows per person the due-total of open claims aged 0–30,
31–60 and 61+ days from their claim date to the sheet's today.

**cp115 [A] saved-filter** — The claims screen remembers each user's last filter per sheet.

**cp116 [M] edit-date-renumbers** — A steward can change an OPEN claim's date. If it moves into
another period it receives the next number of the target period's sequence and the old number is
retired, never reused. Write `CLAIM_REDATED` (`old=`, `new=`). re-enters: cp20, cp21, cp32, cp72,
cp108.

**cp117 [A] export-pools** — Download pools as CSV: pool, member, share, cut.

**cp118 [A] import-rates** — Rates can be pasted as `grade,from,rate`; a line matching an existing
grade and from-date updates it; otherwise adds. All-or-nothing on errors.

**cp119 [A] mentions** — A comment containing `@name` links to that person, and shows on their
detail under mentions.

**cp120 [M] hold-pauses-plans** — A plan generates no claim for a date inside the person's hold
interval; those dates are skipped, not postponed. re-enters: cp35, cp36, cp40, cp60.

### Act IV — time hardening and rule versioning (cp121–160)

**cp121 [A] as-of-view** — An as-of date on the sheet renders everything as it was on that date:
grades, rates, holds, retirements and claim statuses from their histories; the sheet's today is
that date for every figure. Writes are refused while as-of is set.

**cp122 [A] as-of-export** — Exports taken under as-of use the as-of figures.

**cp123 [A] dated-settings** — The floor, cap, terms, late percent, grace days, tolerance and
thresholds are each dated: changing one records a from-date, and a claim uses the value in force
on its date.

**cp124 [M] late-per-boundary** — The late charge is now worked out per 30-day boundary: each
boundary adds the late percent in force on that boundary date. re-enters: cp55, cp123.

**cp125 [A] corrections** — A negative claim can be added against a settled claim. It is numbered
in the same sequence, counts in totals, and shows its target.

**cp126 [A] no-negative-balance** — A correction larger than what remains of its target (the
target's amount less earlier corrections) is refused.

**cp127 [A] rate-comparison** — A child sheet shows, per grade, its due-total under its own rates
and under its parent's.

**cp128 [M] floor-after-late** — The order of the due steps changes: the late charge is now worked
out on the rate figure alone, and the floor is applied last (a claim's live due is the greater of the
floor and the rate figure plus its late charge). Before, the late charge was added on top of the
floored figure. The cap still applies to the person's total afterwards. Settled figures stay frozen.
re-enters: cp28, cp55, cp50, cp123, cp124.

**cp129 [A] timeline** — A person's timeline lists every dated thing about them (claims, status
changes, holds, grade changes, retirements, comments) in date order with the same figures as
elsewhere.

**cp130 [A] soft-close** — A period can be soft-closed: its total is fixed, but claims may still be
added dated inside it, each flagged "late entry" and written as `LATE_ENTRY`. Hard close is as
before.

**cp131 [A] activity-report** — A report per user: the count of each audit action in a date range.

**cp132 [M] four-eyes-mentor** — Neither the opener nor the opener's mentor (at any depth) may
settle or approve a claim. re-enters: cp13, cp33, cp53, cp92.

**cp133 [A] note-required** — A claim above the note threshold (dated setting) cannot be opened
with an empty note.

**cp134 [A] entry-date** — The sheet may have an entry date; when set, it is the default claim date
instead of today.

**cp135 [A] settle-batch** — Selected claims can be settled as a batch with a batch id; each claim
shows its batch; write one `BATCH_SETTLED` (`batch=`, `total=`) after the per-claim lines.

**cp136 [M] batch-all-or-nothing** — If any claim in a batch cannot be settled, none are, and the
reasons are listed. Bulk open stays row-wise. re-enters: cp45, cp135.

**cp137 [A] contact** — A person has a contact (text), stored lower-cased and trimmed, unique per
sheet.

**cp138 [A] bulk-retire** — Selected people can be retired from a chosen date together.

**cp139 [A] cuts-on-rows** — A person's row shows their cut total across pools.

**cp140 [M] weighted-pools** — A pool has a weight (two decimals, default 1.00); a person's cut
from a pool is scaled by the weight, with the remainder rule applied after weighting so the cuts
still total the weighted pot. re-enters: cp18, cp47, cp48, cp83, cp139.

**cp141 [A] monthly-plans** — A plan may run monthly on a day of month; a day beyond the month's
length falls on the last day.

**cp142 [A] plan-preview** — Each plan shows its next five dates after the sheet's today.

**cp143 [A] fiscal-year** — The sheet has a fiscal-year start month. Period templates can generate
a fiscal year's months; a period shows its fiscal year label.

**cp144 [M] numbering-per-fiscal-year** — Claims opened from the sheet's today onward are numbered
per fiscal year as `<prefix><FY>-<n>`, restarting at 1 each year; earlier numbers are kept.
re-enters: cp10, cp32, cp72, cp116, cp143.

**cp145 [A] bulk-reassign** — Selected claims can be reassigned together, row-wise.

**cp146 [A] retired-share-reallocates** — A retired pool member's share is now spread over the
other included members in proportion to their shares before cuts are worked out.

**cp147 [A] over-cap-alert** — When a person's due-total crosses above the cap, write `ALERT`
(`person=`) once; it is written again only after they drop to or below the cap and cross again.

**cp148 [M] alert-per-period** — The over-cap alert is judged per period using the per-grade cap.
re-enters: cp76, cp147.

**cp149 [A] rates-by-unit** — A rate may be given per grade and unit; a claim uses the rate for
its unit when one exists, else the grade's rate.

**cp150 [A] reject-reason-required** — Rejecting a pending claim requires a non-empty reason.

**cp151 [A] combined-import** — One paste can hold a `people:` section and a `claims:` section
(`name,date,amount,note`); people first, then claims, all-or-nothing together.

**cp152 [M] imported-claims-open** — Imported claims arrive OPEN, numbered in paste order, refused
if dated in a closed period or in the future, and a line matching an existing claim by person, date
and note updates it (if DRAFT) or is an error (if not). re-enters: cp15, cp16, cp10, cp22, cp42,
cp111, cp151.

**cp153 [A] sheet-unit-change** — Changing the sheet's unit re-expresses live figures through the
conversions; frozen figures keep their value and show the unit they were frozen in.

**cp154 [A] line-reorder** — Lines can be moved up and down; order is kept.

**cp155 [A] shared-filters** — A user can save a claims filter under a name for everyone on the
sheet.

**cp156 [M] snapshot-at-period-end** — Snapshots are written at a period's end instead of every
day change; the as-of view uses a snapshot when one exists for its date and recomputes otherwise.
re-enters: cp101, cp121.

**cp157 [A] mentor-approval** — A claim above the mentor threshold must be approved by its
person's mentor before it can be settled; a person with no mentor needs a steward.

**cp158 [A] delegation** — A user can delegate their role to another user for a date range on the
sheet; the delegate has both roles' permissions during it.

**cp159 [A] claim-lock** — Opening a claim's edit form locks it for other users until the
sheet-today changes or the editor saves or cancels; others see "locked by".

**cp160 [M] delete-draft** — A DRAFT claim can be deleted: hidden everywhere, counted nowhere, kept
in audit (`CLAIM_DELETED`), restorable on the same sheet-today. re-enters: cp09, cp20, cp45.

### Act V — surfaces and legacy semantics (cp161–200)

**cp161 [A] classic-summary** — Add a classic summary screen that keeps the period figures as they
were before cp108: a claim counts in its period by its current status. Both summaries are shown,
and both must be right.

**cp162 [A] viewer-role** — A viewer role can see every screen and change nothing; every write is
refused.

**cp163 [A] column-chooser** — Each user picks which columns the people list shows; the totals are
unaffected.

**cp164 [M] trim-totals** — Every sheet-wide due-total, settled-total, open-total and overdue-total
leaves out the single highest and the single lowest person's contribution when at least three
people contribute, on every surface (list, header, both summaries, exports). Per-period and
per-grade totals are not trimmed. re-enters: cp07, cp38, cp54, cp67, cp27, cp161.

**cp165 [A] monthly-table** — A table of due-total per calendar month by claim date.

**cp166 [A] crews** — A crew is a named group of people with a lead; show crew totals of
due-total.

**cp167 [A] crew-lead-sees-crew** — A crew lead, as a user, sees their crew's claims on the claims
screen as well as their own.

**cp168 [M] crews-are-pools** — A crew is now a pool whose members have equal shares, shown on the
pool screens and receiving cuts; crew totals stay. re-enters: cp17, cp18, cp166.

**cp169 [A] rounding-mode-setting** — The sheet's rounding mode (half up, half even) is a dated
setting, replacing the policy date for claims dated from today.

**cp170 [A] export-history** — The people export gains one row per grade change and hold.

**cp171 [A] cross-sheet-search** — A search over claims across every sheet the user has a role on,
with the same figures.

**cp172 [M] row-level-crews** — A clerk now sees only claims of people in crews they belong to
(plus their own); stewards and viewers see all. re-enters: cp90, cp166, cp167.

**cp173 [A] age-in-business-days** — Age buckets count business days (holidays skipped).

**cp174 [A] escalate-reminder** — A second reminder on a different day writes `ESCALATE` to the
person's mentor; without a mentor, to the stewards.

**cp175 [A] statements** — A per-person per-period statement: opening balance (unsettled due
carried from earlier periods), the period's claims, settlements, closing balance.

**cp176 [M] carry-forward-frozen** — A statement's opening balance is the previous period's closing
balance as it was when that period was closed, not recomputed; an open previous period is live.
re-enters: cp22, cp108, cp175.

**cp177 [A] opening-balance-import** — Opening balances can be pasted per person for the first
period.

**cp178 [A] external-ref** — A claim has an external reference (text), unique per sheet when
given.

**cp179 [A] person-terms** — A person may have their own terms, dated.

**cp180 [M] terms-resolution** — Due-by uses the first of: the person's terms, the grade's terms,
the sheet's terms, each as in force on the claim's date. re-enters: cp54, cp56, cp95, cp123,
cp179.

**cp181 [A] grace-per-grade** — Overdue begins only after a per-grade grace of days past due-by.

**cp182 [A] multi-sort** — The list sorts by two keys.

**cp183 [A] pagination** — The people list shows 20 per page.

**cp184 [M] shown-totals-all-pages** — Shown totals cover every filtered page, not the current one.
re-enters: cp26, cp59, cp183.

**cp185 [A] sheet-notes** — Dated notes on the sheet header, newest first.

**cp186 [A] line-templates-per-grade** — A grade can have default lines added to a new claim.

**cp187 [A] cut-history** — A pool shows each member's cut as of each period end.

**cp188 [M] rate-fallback-to-source** — Rate lookup also falls back to the sheet a clone was made
from, after the parent chain. re-enters: cp31, cp63.

**cp189 [A] flags** — A person can be flagged with a reason; the flag shows beside their name on
every screen where the name appears.

**cp190 [A] flag-expiry** — A flag has an expiry date; it stops showing after it.

**cp191 [A] flagged-needs-steward** — Only a steward can open a claim for a flagged person.

**cp192 [M] name-with-grade** — Every place a name is shown now shows `name (grade)` using the
current grade; exports and audit lines are unchanged. re-enters: cp03, cp23, cp25, cp33, cp81,
cp109, cp129, cp189.

**cp193 [A] sheet-title** — A sheet has a title and description shown in the header.

**cp194 [A] void-reasons** — Voiding requires a reason from a sheet list.

**cp195 [A] void-stats** — The summary counts voids per reason per period.

**cp196 [M] void-settled** — A steward may void a settled claim within 7 days of its settlement:
the frozen figure is reversed out of every total, and `CLAIM_VOIDED` carries `reversed=`.
re-enters: cp09, cp11, cp64, cp125.

**cp197 [A] mass-redate** — Selected OPEN claims can be re-dated together, row-wise, with the
renumbering rule.

**cp198 [A] rate-calendar** — A month-by-month view of which rate is in force per grade.

**cp199 [A] duplicate-people-detector** — Lists pairs of people with the same onset and names
differing only by case, spaces or accents.

**cp200 [M] hold-counts-except-cuts** — A held person's claims now count everywhere except pool
cuts (they get no cut; their share reallocates as a retired member's does). re-enters: cp40, cp60,
cp112, cp120, cp146.

### Act VI — the squeeze (cp201–250)

**cp201 [A] consolidated-summary** — A parent sheet's summary shows its own figures and, beneath,
the consolidated figures over itself and its child sheets.

**cp202 [A] consolidation-dedupes** — A person transferred between sheets in the tree counts once
in the consolidated figures.

**cp203 [A] snapshot-comparison** — Compare two snapshot dates per person: due-total then and now.

**cp204 [M] trim-at-consolidation** — The trim rule applies once at the consolidated level over
all people in the tree, not per sheet. re-enters: cp164, cp201.

**cp205 [A] review-state** — A claim above the review threshold goes to REVIEW on open and must be
reviewed by a steward before it is OPEN.

**cp206 [A] review-assignment** — A review can be assigned to a user, who then sees it on a
"my reviews" view.

**cp207 [A] review-sla** — A review older than the SLA days shows as late on the summary.

**cp208 [M] number-on-settle** — Claims opened from today onward receive their number when settled
rather than when opened; earlier claims keep theirs. Corrections follow the same rule. re-enters:
cp10, cp32, cp72, cp116, cp125, cp144, cp152.

**cp209 [A] score** — A person's score is settled-total divided by 100, minus 5 per overdue claim,
plus 1 per year of age, rounded to the nearest whole number.

**cp210 [A] score-bands** — Scores are banded LOW, MID, HIGH at dated sheet thresholds.

**cp211 [A] score-history** — Score is recorded at each period end with the snapshot.

**cp212 [M] score-excludes-corrections** — Score ignores corrections and voided-settled reversals.
re-enters: cp209, cp211.

**cp213 [A] audit-retention-view** — The audit screen shows only the last N days (setting); the
file keeps everything.

**cp214 [A] proof-kinds** — Proofs are counted per kind; the threshold needs at least one of each
required kind (per grade).

**cp215 [A] cuts-freeze-at-close** — Closing a period fixes each pool's cuts for that period.

**cp216 [M] reopen-unfreezes-all** — Reopening a period makes its totals, cuts and statement
balances live again. re-enters: cp29, cp176, cp215.

**cp217 [A] parent-plans** — A plan on a parent sheet can generate into a child sheet's person.

**cp218 [A] plan-pause** — A plan can be paused and resumed; paused dates are skipped.

**cp219 [A] plan-history** — Each plan change is kept with its date and shown.

**cp220 [M] plan-amount-retro-for-drafts** — Changing a plan's amount now also updates its generated
claims that are still DRAFT. re-enters: cp35, cp36, cp120.

**cp221 [A] watch-summary** — The watched view gains the summary figures over watched people.

**cp222 [A] delegation-audit** — Actions taken under delegation carry `for=` in their audit line.

**cp223 [A] period-claim-cap** — A period may cap the number of open claims per person.

**cp224 [M] cap-includes-cuts** — The per-grade per-period cap now applies to due-total plus pool
cuts. re-enters: cp50, cp76, cp139, cp140, cp148.

**cp225 [A] statement-export** — Download a statement as CSV.

**cp226 [A] year-end-rollover** — Rollover creates the next fiscal year's periods, carries every
closing balance forward, and starts the numbering for the new year.

**cp227 [A] rollover-undo** — A rollover can be undone on the same sheet-today.

**cp228 [M] rollover-soft-close** — Rollover soft-closes the old year's periods rather than hard
closing them. re-enters: cp130, cp176, cp226.

**cp229 [A] grades-editable** — The grade list is editable; a grade can be retired: existing people
keep it, new people and imports cannot pick it.

**cp230 [A] grade-rename** — A grade can be renamed; every current display follows; histories
show the name as it was.

**cp231 [A] grade-merge** — A grade can be merged into another: every person on it gets a dated
grade change today.

**cp232 [M] merged-grade-keeps-old-rates** — Claims dated before a grade merge keep using the
merged-away grade's rates; the rates screen still shows them under the old name. re-enters: cp08,
cp52, cp231.

**cp233 [A] preview-date** — A user can set a preview date: every figure for that user is shown as
if the sheet's today were that date, but any write still uses the sheet's today.

**cp234 [A] preview-export** — Exports under preview use the preview figures.

**cp235 [A] preview-in-summary** — Both summaries follow the preview date.

**cp236 [M] preview-no-side-effects** — Under preview, late charges and overdue use the preview
date, but alerts, snapshots, reminders and auto-close never fire. re-enters: cp55, cp66, cp101,
cp124, cp147, cp233.

**cp237 [A] shared-claims** — A claim can be shared by several people with shares totalling 100.00;
each person's figures carry their share of it.

**cp238 [A] shared-claim-settle** — Settling a shared claim freezes each holder's share figure.

**cp239 [A] shared-claim-number** — A shared claim has one number, shown on each holder's row.

**cp240 [M] shared-due-per-holder** — A shared claim's due is worked out per holder with that
holder's grade rate on the claim date, each share rounded separately, the remainder to the largest
share. re-enters: cp07, cp08, cp52, cp237, cp238.

**cp241 [A] as-of-permissions** — The as-of view shows roles and delegations as they were on that
date.

**cp242 [A] audit-diff** — The audit screen can show, for a person edit, which fields changed.

**cp243 [A] person-report** — A dated per-person report with every figure, downloadable.

**cp244 [M] trim-extends-to-cuts** — The trim rule now also applies to pool cut totals and crew
totals, at the consolidated level. re-enters: cp164, cp168, cp204.

**cp245 [A] sheet-comparison** — Compare two sheets' summaries side by side.

**cp246 [A] claim-timeline** — A claim's own timeline of every event about it.

**cp247 [A] steward-dashboard** — A screen listing pending, review, overdue and late-review claims
across the sheets the steward has a role on.

**cp248 [M] policy-versions** — The rounding mode, floor, cap, terms, late percent, numbering rule
and four-eyes rule are now one dated policy record. A new policy version is created by any change
to them, and every figure shows which policy version it was computed under. re-enters: cp12, cp28,
cp44, cp50, cp54, cp55, cp123, cp132, cp144, cp169, cp208.

**cp249 [A] policy-viewer** — A screen listing policy versions with their values and the count of
claims computed under each.

**cp250 [A] policy-export** — Download the policy history as CSV with, per version, the figures'
totals computed under it.

## 7. What building this needs

- **A stateful reference model.** `overload.py` evaluates formulas over a fixture; this stream
  needs a simulator that executes the spec's own action script (sign in, set today, add, open,
  settle, paste, close, clone...) and yields every figure on every surface, plus the audit lines.
  `harness/oracle/session.py` is the seed. The script, not a fixture, is the spec's input, so the
  rendered Playwright spec and the expected values come from one source.
- **Ablation per engine.** `probe_check` today ablates five rules. Here each mutative's rule must
  be ablatable on each path and surface it names, so a spec that forgets a surface is caught.
- **Spec cost.** Each spec arranges through screens. Keep fixtures to the minimum people and
  claims that make the rule bite, and reuse the same arrangement across a checkpoint's own spec
  and its ripple copies.
- **Spec rules from the literature (Section 4.1).** An own spec composes the new feature with at
  least two priors (L1). The clause the fixtures bite on is the last clause of the request (L3).
  Every fixture holds an empty case, a tie, a zero, a negative, a half-way rounding case and a value
  on each side of every inclusive boundary (L6). Ripple copies use fixtures that differ from the
  own spec's (L10). A refused action is asserted to have changed nothing, on screen and in the
  audit file (L7).
- **Lint.** The `mutates:` lists above are the proposed `re-enters`; the lint that checks a
  mutative ships a copy for every prior it names applies unchanged.
- **Order of work.** Model Act I (cp1–40) first and run it against angular-spring, as the
  calibration rule says. Act I alone already carries every engine: numbering, freezing, two users,
  the audit figure, imports and clones.

## 8. Sources for Section 4.1

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

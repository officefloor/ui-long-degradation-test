# Depth-forcing checkpoints — proposal (draft, not in the stream)

Status: implemented 2026-10-16. All four cycles replace their Act II slots, and D1 is standing: every
later test with a sheet-wide or patron/follow figure seeds a held person (`checkpoint_lint` check 10).
The authored specs are the source of truth. Where they refine this proposal, they win (e.g. link
dates are `since`, not `from`, and cp104 is area `status`).

## Why

Run 202610160010 (angular-spring, 250 checkpoints) made no genuine regressions, and its effort
stayed flat: a median of 6–7 turns and about $0.22 per checkpoint from start to finish. It got there
by appending. The median number of existing functions modified per checkpoint was 0 on both layers,
it deleted 16% as many lines as it added, and the worst structural changes (cp12, cp40, cp44, cp140)
deleted about 60–70 lines each.

The stream adds breadth: each request is one more formula over values the app already shows, so the
agent can always put one more function beside the last. It never adds depth, meaning a change whose
correct implementation lands in many places that already exist. A structure that only appends
therefore never pays for appending. The code grew into large, regular files (`Person.java` with 84
getters, a 2,175-line `people.ts`) instead of a tangle, and correctness cannot tell stacks apart.

These checkpoints make the structure pay. Each one is still a plain request with a visible UI test
(it checks correctness, never shape), but implementing it correctly means changing many existing
sites, or threading new context into code that never needed it.

## Where they go

Act II is mostly the breadth pattern on repeat: `X = Y + Z`, then a total, then a top, then a
coefficient tweak. Four of its cycles are fully self-contained: no later request, own spec or hidden
copy uses their concepts (checked over all 250 checkpoints and every `cpNN/` copy).

| slots | replaced (concepts) | new cycle |
|---|---|---|
| cp73–76 | swing, haul, total haul, swing positive | **D1 cross-cutting rule** |
| cp81–84 | thrum, spool, max thrum, thrum coefficient | **D2 constants become settings** |
| cp101–104 | strain, pulse, pulse counts, pulse tolerance | **D3 shared identity** |
| cp113–116 | ebb, stray, stray count, ebb mean | **D4 history and as-of** |

Replacing whole cycles keeps the numbering, the 3:1 cadence, and every other checkpoint and copy
untouched. Removing cp113's `ebb-norm` leaves cp101–150 with exactly three algorithm tags. cp115
adds `as-of-delta`, which brings it back to four. They escalate: D1 touches every aggregate site,
D2 threads new context into per-person rules, D3 changes what a person *is*, and D4 makes every rule
a function of time.

## D1 — a cross-cutting rule (cp73–76)

The question: when one rule has to hold for every sheet-wide figure, does the code get one place
that applies it, or does it repeat the rule at every site?

**cp73 `hold` (additive, area: calc).**
> Let me put a person on hold. A person on hold still shows on the list with all of their own
> figures, but leave them out of every figure worked out across the whole sheet: every total, every
> count, the ranks and percentiles, the leader, every "top" name, and every average or middle value
> taken across everyone. A person on hold shows "n/a" for their rank and percentile.

Visible spec: seeds one held person among 4–5 others, and asserts at least one figure from every
sheet-wide family that exists by cp72, each chosen so including the held person would change it:
`rollup-total-load`, `rollup-active-count`, `rollup-total-effective`, `rollup-leader`,
`rollup-top-influence`, the top crest name, `region-count-<R>`, `band-count-<X>`, rank and
percentile, `concept-norm` (the median moves), `rollup-outlier-count` and `rollup-final-total`. Also
`person-hold-<id>` (toggle) and `person-hold` (shown). Not hidden: the spec names every site.

**cp74 `hold through links` (additive, area: relation).**
> A person on hold should not count towards anyone else's figures either. Leave a held patron out of
> backing, clout and flux, and a held person out of the synergy of anyone who follows them. Clout
> and flux average over the patrons who are not on hold.

Visible spec: backing, clout, flux and synergy, each with a held link that would change it. This
puts the rule into the per-relationship aggregations, a second, differently shaped set of sites.

**cp75 `total blend` (additive, area: calc).**
> Show me the "total blend" for the whole sheet: everyone's blend added together, leaving out anyone
> without a blend.

Visible spec: seeds one held person, and its comment says so as behaviour ("a person on hold is
left out of sheet-wide figures"). This is the forward-consistency probe. The request does not
restate the rule, but cp73 made it standing. A structure with one place for sheet-wide figures gets
it free; an appending one adds the filter again, by hand.

**cp76 `hold at half` (mutative, mutates [73, 75]).**
> Leaving held people out entirely is too harsh for totals. In every sheet-wide total, count a held
> person's value at half, rounded down. Counts, ranks, percentiles, the leader, top names and the
> averages and middle values still leave them out.

Copies of cp73 and cp75 with the totals recomputed. The visible spec covers the totals and one count
that must not change. This is the depth test: the cross-cutting rule changes, so a structure that
scattered it must find and change every site again.

Forward option (decide): from cp77 on, every new sheet-wide figure's spec seeds one held person, so
the rule must keep being honoured for the rest of the run. That is the strongest probe, but it means
re-authoring about 40 later specs. Without it, D1 measures the scatter once.

## D2 — constants become settings (cp81–84)

The question: when constants become data owned by the sheet, does that context reach every rule
that needs it? Today the region multipliers, band boundaries and grade weights are constants inside
per-person rules, which have no access to the sheet. This directly tests the data-flow coupling
measures (`dfdata_tramp_ratio` and related).

**cp81 `region settings` (additive, area: calc).**
> Each sheet should have its own region multipliers. Let me set, for the sheet I am on, what an N
> region, an S region and any other region multiply by. A new sheet starts with N as 2, S as 3 and
> every other letter as 1.

Visible spec: changes the N and S multipliers through `sheet-setting-region-N`, `-S` and `-other`
plus `sheet-setting-save`, and asserts reach for people in N, S and other regions. A second sheet
keeps its own defaults (`sheets:` seed, cp13–16 vocabulary).

**cp82 `band settings` (additive, area: calc).**
> Let me set the band boundaries and the band multipliers for the sheet too. A new sheet starts with
> the ones I use now.

Visible spec: changes one boundary and one multiplier, then asserts band, scaled, `band-count-<X>`,
norm and `rollup-final-total`. The whole downstream chain must read the sheet's values.

**cp83 `grade weights per sheet` (additive, area: calc).**
> Let me set the weight of each grade for the sheet as well. A new sheet starts with LOW 1, MID 3
> and HIGH 5.

Visible spec: weight, load and `rollup-total-load` under changed weights.

**cp84 `new default multipliers` (mutative, mutates [38, 40, 81]).**
> Change what a new sheet starts with: an N region should multiply by 3 and an S region by 2. Sheets
> where I have already set my own multipliers keep them.

Copies of cp38, cp40 and cp81 with reach recomputed under the new defaults. This is the
duplicated-constant probe: a default kept in one place is a one-line change, while a default
repeated across the seed endpoint, database migration, server and browser is several. Forward
consistency: cp89–100 (gust, coil, grip, which read reach) are authored against the new defaults.
They come after cp84, so they need no copies, but their oracles change.

## D3 — shared identity (cp101–104)

The question: what happens when the meaning of the central entity changes underneath 100
checkpoints of rules? This is the heaviest cycle, because it changes the seed shape (see the risks).

**cp101 `shared people` (additive, area: entity).**
> Let me put a person who is already on one of my other sheets onto this sheet too, by choosing them
> from a list of the people on my other sheets. It is the same person: their raw numbers are shared,
> so changing their alpha on one sheet changes it on every sheet they are on. Their state is shared
> too.

Visible spec: two sheets. It adds a shared person with `person-share-select` and `person-share-add`,
edits alpha on sheet A, and asserts alpha, momentum and state on sheet B.

**cp102 `links per sheet` (additive, area: relation).**
> A shared person's links belong to each sheet separately. Their patrons and the people they follow
> on one sheet are not their patrons or follows on another, so backing, clout, synergy and the
> rest can differ from sheet to sheet.

Visible spec: the same person with different patrons on two sheets, so backing, clout and synergy
differ.

**cp103 `settings per sheet for shared people` (additive, area: calc).**
> Each sheet's settings apply to everyone on it, shared people included. The same person can have a
> different reach and scaled on two sheets.

Visible spec: one shared person, two sheets with different multipliers, so reach and scaled differ.
Per-person rules now need the sheet as an input, not just the person.

**cp104 `state per sheet` (mutative, mutates [101]).**
> A person's state should belong to each sheet, not be shared. Moving a shared person forward on one
> sheet must not move them on another. Their raw numbers stay shared.

A copy of cp101 asserting that state is independent per sheet. This moves a field from person to
membership: every reader of state (the workflow controls, the audit line, `rollup-final-total`,
cp57–60) must now resolve state per sheet.

## D4 — history and as-of (cp113–116)

The question: when every figure must also be computable at a past date, does the rule pipeline
become a function of its inputs, or is it fused to the stored current state?

**cp113 `raw history` (additive, area: persist).**
> When I change a person's alpha, beta or gamma, let me say the date the change takes effect. If I
> leave it blank it takes effect on the sheet's anchor date. Keep every change, and show each
> person's history of changes, newest first.

Visible spec: two dated alpha edits via `person-form-effective-date`, then asserts
`person-history` lists them, and that the current figures use the latest value on or before the
anchor.

**cp114 `as of` (additive, area: calc).**
> Let me look at the whole sheet as it stood on an earlier date. When I choose an "as of" date,
> every figure on the sheet uses each person's raw numbers as they were on that date.

Visible spec: `sheet-as-of` with a date between the two edits, then asserts momentum, tier, rank,
`rollup-total-load` and a band count. Every rule reads values as of the chosen date.

**cp115 `momentum change` (additive, area: calc, algorithm: `as-of-delta`).**
> For each person show "momentum change": their momentum now minus their momentum on the as-of
> date. Show "n/a" if either is missing or no as-of date is chosen.

Visible spec: momentum change for people with and without edits in between. The pipeline must run
twice in one view (now, and as of), which a design fused to stored state cannot do without
restructuring.

**cp116 `linked history` (mutative, mutates [114, 115]).**
> Links have dates too. A patron or follow I added after the as-of date should not count when
> looking at the sheet as of that date.

Copies of cp114 and cp115 whose fixtures add a dated patron link, with backing, clout and net
recomputed as of the date. History now reaches the relationship aggregations.

## What to measure

Correctness may still hold. The comparison is the cost and shape of getting there:

- Per depth checkpoint: turns, cost and duration, against the run's breadth baseline (a spike is
  the price of appending).
- `existing_fns_modified`, `files_modified`, `dirs_touched` and change entropy at cp73–76, cp84,
  cp101–104 and cp114–116, against the near-zero baseline.
- D1 scatter: the number of distinct code sites that test `hold` at cp73, cp76 and the tip (a new
  small analysis: one place, or one per figure).
- D2 and D3: `dfdata_tramp_ratio`, `dfdata_tramp_chain_max` and `drcol_field_span_max` from cp81 on.
- Regressions after each depth cycle, where a scattered rule shows up as a missed site.

## Risks and costs

- **Seed contract (D3, D4).** Shared people need a seed shape that can say one person is on two
  sheets (for example top-level people plus `sheets: [{ id, members: [...] }]`), and history needs
  dated values (`history: [{ personId, field, value, from }]`). Both change `support/seed.ts` and
  `AGENTS.md` §4, and each new field must appear in a visible spec before any copy uses it
  (`checkpoint_lint` check 4).
- **Fairness of the forward probes (D1 cp75 and the D1 forward option, D2 cp89–100).** The agent
  never sees earlier requests. These are fair only because each spec states the standing rule as
  behaviour in a comment, and the app already has the feature. Review that wording carefully.
- **Authoring cost.** About 16 new specs, 6 copies (cp76: 2, cp84: 3, cp104: 1, cp116: 2) and the
  cp89–100 oracle rework. The forward option adds about 40 re-authored specs.
- **One-screen rule.** All of it stays on `/`: the settings, history and as-of controls are panels on
  the worksheet, not pages.
- **Lint additions.** `checkpoint_lint`'s one-screen and anchor checks cover these as written. A
  "standing rule" check (every sheet-wide figure's spec after cp73 seeds a held person) would be
  needed only if the forward option is taken.

## Decisions for review

1. Approve the four cycles, or drop any. D3 is the costliest; D1 and D2 give the most per spec.
2. D1 forward option: re-author later sheet-wide specs to seed a held person (strong, about 40 specs),
   or measure the scatter once (cheap).
3. ~~Whether to run the OfficeFloor arm first~~. Decided 2026-10-16: calibrate against
   angular-spring only. It is the architecture most likely to suffer, and TanStack and OfficeFloor
   are built to head this off, so depth that cannot strain angular-spring will not strain them.
   Calibration runs are not results: once the stream strains angular-spring, every arm runs on that
   same final stream for the comparison.

---

# Phase 2: making the stream ruthless (decided 2026-10-16)

The four cycles above give 16 depth checkpoints. Phase 2 adds four levers, all chosen by the user:
standing settings, history and identity; about 20 shallow mutations converted to cross-cutting
ones; depth in Act I; and interaction mutations. Expected values are verified by one reference
model (`harness/oracle/`) and `harness/spec_check.py`, which evaluates every assertion at every
checkpoint where its test is in force. Hand-computed oracles had already let a wrong value through
(cp109 tide), and the app bent its code to match it.

## Lever 3: depth in Act I (cp28)

cp28 (age in weeks) is reversed at cp244 anyway. It becomes **audit everything**:
> Keep a record of every change I make to a person, not just alpha. Changing any raw number, the
> grade, the onset, whether they are active, or their regions writes one line:
> `CHANGED id=<id> field=<field> from=<old> to=<new>`. An alpha change is now recorded this way too.

It mutates cp07 (copy with the new line format). This puts every write path through one rule
while the structure is still forming. Age stays in days throughout, so every later age and decay
value is recomputed by the model, and cp244's slot is freed (see lever 4). Standing (optional,
decided below): every later spec that edits a person through the UI also asserts its audit line.

## Lever 2: shallow mutations converted to cross-cutting changes

Each replaces a one-formula tweak. The tweak's own change never happens, so later values follow
the model.

| slot | was | becomes (cross-cutting rule) |
|---|---|---|
| cp80 | verge remap | Inactive patrons no longer count in anyone's patron figures (backing, clout, flux, and later vector). |
| cp92 | gust leans on torque | Negative values count as zero in every sheet-wide total. |
| cp100 | yield leans on lift | Figures over the people a person follows also count the people who follow them (synergy, tide; both directions, each counted once). |
| cp124 | strength uses effective | Every group figure uses members' effective instead of scaled. |
| cp128 | spread uses effective | People on hold are left out of their groups' figures too (counted at half in group totals). |
| cp136 | density uses effective | Group figures leave out members whose state is DRAFT. |
| cp144 | rung divides by size | Every "top" figure inside groups (apex, strongest member, and so on) breaks ties by higher alpha, then name. |
| cp148 | breadth counts groups | A person's own figures that depend on "their group" use ALL their groups: the average, rounded down, instead of the alphabetically first. |
| cp152 | lowest uses effective | Groups can sit inside another group. A parent group's figures include its sub-groups' members (each person once). |
| cp160 | depth formula | Wherever a figure divides and rounds down, it now rounds to the nearest whole number (halves up). |
| cp164 | vigor formula | A person in no group counts as a group of their own in every sheet-wide group rollup. |
| cp176 | contribution nearest | A missing raw number now counts as zero everywhere; no figure shows "n/a" because of a missing raw number. |
| cp184 | gap uses lowest | Every top name and leader lists everyone tied for the top, names joined by ", " in name order. |
| cp188 | coverage at 500 | Every count of people on the sheet leaves out people with no momentum. |
| cp196 | top three share | Every "top N" figure counts people tied at the cut-off too. |
| cp204 | tilt around middle | Every average across the sheet becomes the middle value (median, lower of two middles). |
| cp208 | quota top third | Every percentage on the sheet is a share of the people who count, never of everyone listed. |
| cp212 | region totals SURGE only | Totals by region, tier, grade and state include a held person at full value, not half. |
| cp216 | TOP/BOT around average | Every rank across the sheet is dense (ties share a rank, and the next rank follows on). |
| cp220 | tier totals use momentum | Every sheet-wide total leaves out the single highest contributor. |

## Lever 4: interaction mutations

| slot | was | becomes (changes how two rules meet) |
|---|---|---|
| cp224 | grade totals fold MID | History covers grade and active too: dated, and followed by the as-of view. |
| cp228 | state totals drop DRAFT | Hold has a start date. As of an earlier date the person counts normally (history × hold). |
| cp232 | quartile totals use momentum | Each sheet chooses how held people count in totals: left out, half, or full (hold × settings). |
| cp236 | report shows middle | Settings are dated: the as-of view uses the settings in force on that date (history × settings). |
| cp240 | trimmed ledger | A shared person's hold belongs to each sheet (identity × hold). |
| cp244 | age back to days (freed by lever 3) | A shared person's history is shared, but an as-of view on one sheet doesn't move another (identity × history). |

## Lever 1: standing settings, history and identity

As for hold, each rule keeps being exercised after its cycle, checked by a lint rule:

- **Settings, from cp85.** Every test asserting a band, scaled, tier, weight, load, reach or anything
  derived from them seeds non-default settings that change at least one asserted value.
- **History, from cp117.** Every test asserting a per-person figure derived from alpha, beta or gamma
  seeds a dated history entry after the anchor (which must not count), and a quarter of those tests
  also assert under an as-of date.
- **Identity, from cp105.** Every test asserting a patron or follow figure, or a sheet-wide figure,
  runs on a sheet with at least one shared person whose source sheet differs.

## Order of work

1. The reference model reproduces the current stream (mismatches are spec defects, fixed).
2. Phase 2 definitions are added to the model, and the new checkpoints are authored.
3. Reconcile: every later spec the model now disagrees with is updated (values and comments).
4. Standing passes for settings, history and identity, with their lint checks.
5. Lint, Playwright compile and the spec checker are all clean, then review and commit.

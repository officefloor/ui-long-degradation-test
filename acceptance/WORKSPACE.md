# The stream, design

The authoring reference for `checkpoints.yaml` and `acceptance/specs`. The agent never sees this
file. It sees one request and its one spec at a time, plus the harness's `AGENTS.md`. Every
request, spec and ripple copy is generated from the reference model `harness/oracle/hell.py`,
the story scripts in `harness/oracle/hell_scripts.py` and the scenario generator
`harness/oracle/hell_gen.py` by `harness.stream_build`; nothing under `acceptance/specs` is
hand-edited. The `data-testid` contract is in `support/README.md`.

## 1. The point

The stream exists to push a system past what a person can review, then measure what the code
does under that pressure. The first stream (Act I, run 2026-10-18 on two stacks) was absorbed in
one to four minutes a checkpoint: every rule was a pure function of stored facts, so "recompute
everything on read" satisfied all forty, complexity grew linearly, and both agents converged on
the same browser-side copy of every figure. This stream closes that escape hatch with three
engines and measures the pressure it applies.

- **Path dependence (cp15, statements).** A statement binds the figures a person's counting
  claims have at that moment. From then on the correct figure depends on when the button was
  pressed relative to every other change: the system's own output history is state, and
  recomputing from facts is wrong by construction.
- **Write-time observability (cp16, ROLLUP/TOTALS).** Every write that moves any person's
  claimed or due-total is followed in the audit by one line per person changed, then the sheet's
  totals, and by nothing when nothing moved. The server must own the figures and know every
  dependent of every write (a rate, a grade, a hold, a setting, the sheet's today). Nothing
  computed in the browser can produce these lines.
- **Precedence exceptions (cp24 on).** The floor binds under a statement but a statement taken
  under a floor binds the floored figure; the late charge rides on top of a bound figure and is
  never bound; a PENDING claim escapes its statement; a reassigned claim loses its binding; a
  bound claim stays in the totals through a hold; a correction rounds by its target's date.

Two things give the pressure volume and a number:

- **Generated scenarios.** From cp5, each checkpoint's spec carries its story test and three
  generated ones: seeded multi-user action sequences over everything in force at that
  checkpoint (`hell_gen.py`), ending in a check of every cell and the whole audit. The agent sees
  the same one spec file; the gate carries a hundred and sixty interaction scenarios by cp40
  and over three hundred by cp80.
- **Interaction density (`acceptance/DENSITY.md`).** Two rules interact at a checkpoint when a
  value its own spec asserts depends on both: switching both off is not predicted by switching
  each off alone. The builder reports, per checkpoint, the interacting pairs over the possible
  pairs (on screen and in the audit) and for each new rule how many earlier rules it crosses,
  and refuses a rule from cp17 on that crosses fewer than two. The metric is a property of the
  stream, independent of any app, so erosion in the code can be plotted against it.

Standing rules: one screen at `/`; nothing seeded (every test signs in, loads a fresh sheet id
and arranges through `support/ui.ts`); cadence 3:1 (mutative when `n % 4 == 0`), `mutates:`
derived by the builder, an additive checkpoint may change no prior spec; every rule a
checkpoint introduces must bite in its own spec, and every ripple copy must exercise one of them.

## 2. The checkpoints

The stream is 250 checkpoints in five acts of fifty (docs/PLAN.md §4): Act I cp1-50 and Act II
cp51-100 are the two tables below, unchanged from the stream built on 2026-10-18 and 2026-10-19;
Acts III (identity, hierarchy, cross-sheet), IV (rule versioning and legacy semantics) and V (the
squeeze) are listed with every rule they introduce in [docs/STREAM_ACTS.md](../docs/STREAM_ACTS.md),
with the decisions taken while building them.

### 2.1 The first eighty

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

Act II (cp41–80, built 2026-10-19) keeps the same world and adds write paths, read surfaces,
dated reference data and reconstruction. Every additive checkpoint is neutral by default (a new
action, a new cell, a setting that is blank until set) so no prior spec moves; every fourth
changes what every prior spec expects.

| cp | type | what it loads onto the figure |
|---|---|---|
| 41–43 | A | header counters (a second surface for the totals); rates with a to-date; a cap on the due-total with the excess shown |
| 44 | M | **rollups also when an overdue-total moves**; ROLLUP and TOTALS carry overdue-total |
| 45–47 | A | bulk settle (list order, each by the single-claim rules); a steward re-settles under today's rules; per-person per-period figures, fixed at close |
| 48 | M | **dated settings**: floor, late percent, terms, limits apply from a from-date (default today); a claim uses the value in force on its date |
| 49–51 | A | a paste box for claims (all-or-nothing); deferred claims (count nowhere until a date); proofs with a dated threshold, checked before the clerk limit |
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

## 3. Writing a checkpoint

1. Add or change the rule in `hell.py` (gate it on `self.on("rule")`, register it in `RULES`;
   a new screen or cell goes in `SINCE`/`CELL_SINCE`), and its request in `REQUESTS`. State the
   rule in full: the agent sees nothing else.
2. Write its story in `hell_scripts.py`: the actions a test takes and the figures it reads
   (`check`). Make the rule bite with the fixture, and compose with at least two priors.
3. Teach the generator the new action (`hell_gen.py`: `apply` and `candidates`), with any
   future-proofing a later additive rule needs (the module docstring lists the constraints).
4. `.venv/bin/python -m harness.stream_build --config config.yaml --stories` (seconds: every
   story rendered at every later checkpoint, so a later rule that refuses a story's arrangement
   shows at once), then `--check --no-density --jobs 8` (about half an hour for 250 checkpoints;
   `--to N` for a prefix), then `--check` with the density metric, then without `--check` to
   write; then `harness.checkpoint_lint`. Read the new rule's degree in `DENSITY.md`.

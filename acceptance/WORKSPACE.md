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
  the same one spec file; the gate carries a hundred and sixty interaction scenarios by cp40.
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

## 2. The forty checkpoints

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

## 3. Writing a checkpoint

1. Add or change the rule in `hell.py` (gate it on `self.on("rule")`, register it in `RULES`;
   a new screen or cell goes in `SINCE`/`CELL_SINCE`), and its request in `REQUESTS`. State the
   rule in full: the agent sees nothing else.
2. Write its story in `hell_scripts.py`: the actions a test takes and the figures it reads
   (`check`). Make the rule bite with the fixture, and compose with at least two priors.
3. Teach the generator the new action (`hell_gen.py`: `apply` and `candidates`), with any
   future-proofing a later additive rule needs (the module docstring lists the constraints).
4. `.venv/bin/python -m harness.stream_build --config config.yaml --check` (about two minutes
   with the density metric; `--no-density` for a quick pass), then without `--check` to write;
   then `harness.checkpoint_lint`. Read the new rule's degree in `DENSITY.md`.

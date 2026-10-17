# The Act I stream, design

The authoring reference for `checkpoints.yaml` and `acceptance/specs`. The agent never sees this
file. It sees one request and its one test at a time, plus the harness's `AGENTS.md`. Every
request, spec and ripple copy is generated from the reference model `harness/oracle/hell.py` and
the scripts in `harness/oracle/hell_scripts.py` by `harness.stream_build`; nothing under
`acceptance/specs` is hand-edited. The `data-testid` contract is in `support/README.md`.

## 1. The point

Forty checkpoints, every one of them loading the same figure. The sheet holds people with claims;
a claim has a `due` worked out from its amount and a rate; totals add dues up. Everything that
follows re-enters that one computation from a different direction, so the cheap solution of the
first ten checkpoints (one component, one handler, compute on read) is wrong by cp12 and gets
wronger: live versus frozen figures, rules that apply by date, write paths that multiply, surfaces
that multiply, and two users whose actions interleave. The full rationale, the catalogue of
gotchas, and the proposal for the acts after this one are in `docs/REFACTOR_HELL_STREAM.md`.

- One screen at `/`. No request adds a page or a route.
- Nothing is seeded. Every test signs in, loads a fresh sheet id, and arranges its data through
  the screens with `support/ui.ts`. The write paths are therefore part of every test.
- Cadence 3:1: checkpoint `n` is mutative when `n % 4 == 0`. A mutative checkpoint's `mutates:`
  is derived by the builder from the priors whose rendered spec changes at that checkpoint; an
  additive checkpoint may change no prior spec (the builder refuses the stream otherwise).
- Every rule a checkpoint introduces must bite: rendering its own spec and each copy it ships with
  that rule switched off (`hell.Model(off=...)`) must change the spec (`stream_build --check`).

## 2. The forty checkpoints

| cp | type | what it loads onto the figure |
|---|---|---|
| 1–3 | A | sign-in, the sheet's today, people with a grade |
| 4 | M | names unique, trimmed, case-insensitive |
| 5–7 | A | claims and `claimed`; the audit file; rates and `due` (half up; a person's due-total is the rounded total amount times the rate) |
| 8 | M | workflow DRAFT/OPEN/SETTLED/VOID; only open and settled count |
| 9–11 | A | gapless numbering on open; settle freezes due; rates effective-dated |
| 12 | M | half to even; due-total becomes the sum of rounded claim figures |
| 13–15 | A | four-eyes; stale-edit refusal and double submit; CSV import, all-or-nothing |
| 16 | M | import upserts by name |
| 17–19 | A | periods; closing a period freezes and refuses; a quick-add bar |
| 20 | M | an open claim is immutable; a void keeps its number |
| 21–23 | A | retire from a date; hold; roles and the clerk limit |
| 24 | M | a floor (1.00 by default) under every live due |
| 25–27 | A | due-by and overdue; late charge per full 30 days; patrons and backing |
| 28 | M | a person's grade is dated; a claim uses the grade in force on its date |
| 29–31 | A | steward-only reopen; corrections against settled claims; the summary panel |
| 32 | M | rounding by policy date: half up before it, half even from it |
| 33–35 | A | CSV export; bulk open; per-period numbering from a date |
| 36 | M | over the clerk limit goes to PENDING; approve/reject |
| 37–39 | A | reassign a claim; terms per grade fixed at creation; the status log with due at each step |
| 40 | M | a hold is an interval; only claims dated inside it leave the totals |

## 3. Writing a checkpoint

1. Add or change the rule in `hell.py` (gate it on `self.on("rule")`, register it in `RULES`), and
   its request in `REQUESTS`. State the rule in full: the agent sees nothing else.
2. Write its script in `hell_scripts.py`: the actions a test takes and the figures it reads
   (`check`). Make the rule bite with the fixture, and compose with at least two priors.
3. `.venv/bin/python -m harness.stream_build --config config.yaml --check`, then without
   `--check` to write; then `harness.checkpoint_lint`.

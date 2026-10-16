"""The reference model ("oracle") of the worksheet stream: one executable definition of every
concept, as the requests in checkpoints.yaml define it at each checkpoint. Internal harness tooling
for checking the expected values in the specs (harness/spec_check.py); the agent never sees it.

    from harness.oracle import evaluate
    evaluate(fixture, k=109)                 # {('person-row-1', 'concept-tide'): '267', ...}
    evaluate(fixture, k=116, sheet='S2', as_of='2026-02-01')

Layout
- core.py     the world a fixture describes (sheets, shared people, history), the evaluation context
              `Ctx` with the cross-cutting rules (hold, settings, links, as-of, n/a, floor division),
              the versioned registry, and the lazy screen `View`.
- session.py  a browser session: the stored world plus UI state, driven step by step by spec_check.
- act1.py     Act I, cp01-cp60 (cp28 records every changed detail: `record_change`).
- act2.py     Act II, cp61-cp120, including the depth cycles cp73-76, 81-84, 101-104, 113-116.
- act3.py     Act III, cp121-cp180, with its group rules (effective members cp124, hold cp128, DRAFT
              cp136, ties cp144, all their groups cp148, nested groups cp152, groups of one cp164).
- act4.py, act5.py   Acts IV and V.

Cross-cutting rules of Phase 2 on Ctx (core.py): inactive patrons (cp80), negatives as zero in
sheet-wide totals (cp92), followers in follow figures (cp100), nearest rounding (cp160, `div`/`half`),
missing raw numbers as zero (cp176, `raw`), tied top names listed (cp184, `top`), counts without
momentum 0 (cp188, `headcounted`), held in full in breakdown totals (cp212) or per the sheet's choice
(cp232, `held_mode`), totals trimmed of their highest contribution (cp220, `total`), dated grade and
active (cp224), hold start dates (cp228, `held`), dated settings (cp236, `setting`), per-sheet hold for
shared people (cp240). Act IV's conversions (cp196 top-N ties, cp204 middle values, cp208 percentages,
cp216 dense ranks) live in act4.py.

Extension pattern (for an act author)
1. Work only in your act's module. Import the decorators from `.core`:
       from .core import person, sheet, family, control, setting_default, fdiv, need, ABSENT
2. One function per VERSION of a concept, `since=` the checkpoint from which it holds, its docstring
   quoting the rule:
       @person('strength', since=122)                     # shown at concept-strength in the row
       def strength(c, p): ...
       @sheet('total-strength', since=142, show='rollup-total-strength')
       def total_strength(c): ...
       @family('group-count-', since=150)                 # group-count-<key> -> {key: value}
       def group_counts(c): ...
   A mutation registers a newer version (`since=` the mutative checkpoint) of the concept it
   changes, even one from an earlier act; never edit another act's module. Two versions with the
   same name and `since` are refused at import.
3. Read everything through the context: `c.v(name, pid)` another concept, `c.s(name)` a sheet
   figure, `c.raw(pid, field)` a raw value (history-aware), `c.rec(pid)` the person's record,
   `c.state(pid)`, `c.patrons(pid)` / `c.follows(pid)` (hold and link dates applied),
   `c.counted()` / `c.total(name)` / `c.top(name)` (the hold rule applied), `c.setting(group, key)`,
   `c.at(date)` for a figure on another date, `c.sh.extra[key]` for a seeded collection the core does
   not know (e.g. `groups`, `memberships`). Return None for n/a; `need(...)` tests inputs.
4. A new cross-cutting rule (one every later figure must honour) belongs on `Ctx` in core.py; keep
   that change small and say so in your report, since other acts read it.
5. New controls: `@control('group-add', since=...)` or a per-row prefix `@control('group-join-', ...)`,
   `fn(session, suffix)`, mutating `session.world` and reading `session.form` / `session.take_form`.
6. Check: `.venv/bin/python -m harness.spec_check --config config.yaml --through <K>`; the
   UNMODELLED section lists what your act still lacks, grouped by concept.
"""
from .core import ABSENT, REGISTRY, Ctx, Unmodelled, View, World, evaluate  # noqa: F401
from .session import Session  # noqa: F401

"""The reference model ("oracle") of the worksheet stream: one executable definition of every
concept, as the requests in checkpoints.yaml define it at each checkpoint. Internal harness tooling
for checking the expected values in the specs (harness/spec_check.py); the agent never sees it.

    from harness.oracle import evaluate
    evaluate(fixture, k=109)                 # {('person-row-1', 'concept-tide'): '267', ...}
    evaluate(fixture, k=116, sheet='S2', as_of='2026-02-01')

This branch runs the RESTRUCTURED EARLY-OVERLOAD stream (cp1-250, Act VI removed); the back-loaded
canonical 300-stream and its act modules live on `main`. See docs/EARLY_OVERLOAD_DESIGN.md.

Layout
- core.py     the world a fixture describes, the evaluation context `Ctx`, the versioned registry,
              and the lazy screen `View`. Its own cross-cutting rules are gated >= cp73, so they stay
              dormant; this stream's rules activate early and live in overload.py.
- session.py  a browser session: the stored world plus UI state, driven step by step by spec_check.
- overload.py the whole restructured stream (cp1-250), in the canonical vocabulary. A compressed
              spine (thrust -> momentum -> scaled -> norm, cp2-6) lets the hub `keel` stand up at cp9,
              read by ~40 concepts (a god-sized hub from the first act). The cross-cutting rules switch
              on EARLY (reimplemented here as helpers): every total trims its highest AND lowest from
              cp4 (`etotal`), every divide rounds to nearest from cp8 (`ediv`), a held person leaves
              every figure from cp12 (`eheld`), a SINK person (keel<0) leaves every count from cp16
              (`eheadcount`), a missing raw counts as zero from cp20 (`eraw`). `keel` is redefined ten
              times (cp9/16/32/52/60/64/100/148/200/240), each ripple wider than the last; a `patrons`
              relationship migrates directed -> mutual at cp40. cp61-250 is the coping tail: sustained
              load (reader tweaks, a growing battery of sheet-wide figures) on the overloaded core.

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
from .core import ABSENT, REGISTRY, Ambiguous, Ctx, Unmodelled, View, World, evaluate  # noqa: F401
from .session import Session  # noqa: F401

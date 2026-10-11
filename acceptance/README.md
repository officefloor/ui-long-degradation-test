# acceptance/ — the Playwright specs (the living spec; DESIGN.md §3, §7)

- The stream design every checkpoint is written against is [WORKSPACE.md](./WORKSPACE.md): one
  screen at `/`, three entities, every fourth checkpoint mutative, at least three algorithms per
  act. Every expected figure comes from `reference/` (`algorithms.py`, `model.py`) or carries its
  arithmetic in a comment; `reference/vocabulary.md` lists the testids, fixture fields, audit lines
  and rules in force. The agent never sees any of this.
- One spec per checkpoint under `specs/`, named `cpNN_<slug>.spec.ts` (`cpNNN_` from 100), selectable
  so the gate runs only cp01..cpK at checkpoint K.
- Specs bind ONLY to `data-testid` attributes — never CSS classes, DOM structure, tag
  nesting, or visible copy — so one suite validates any candidate front-end.
- `data-testid` values are immutable public API once introduced (DESIGN.md §3).
- A mutative checkpoint ships updated copies of the prior specs it changes under a
  `specs/cpNN/` subdir (the `mutates` discipline; DESIGN.md §6).
- A copy fully replaces the earlier version from its checkpoint on, so it must carry forward every
  test and check that still holds. A test it drops on purpose (the request changed that behaviour)
  is listed under the checkpoint's `retires:` as `<spec basename>::<test title>`;
  `harness.checkpoint_lint` refuses a copy that drops a test without one.
- The agent, while working, sees ONLY the current checkpoint's spec (blind; DESIGN.md
  §4). The full cp01..cpK suite runs afterwards as the regression gate, never shown to
  the agent (tests-as-living-spec; DESIGN.md §7).
- The working rules and testing contract the app is built to — `data-testid`, the audit file, and
  the `/__test__` seed + read-back endpoints — are [AGENTS.md](./AGENTS.md). The harness installs
  it, with `support/seed.ts` and the agent service's shim (`agents/<service>/`), into every app at
  every checkpoint; the stack's own `DESIGN.md` carries its stack-specific guidance. `support/seed.ts` replays the fixtures of
  earlier checkpoints (`harness.fixtures.fixture_contract`) before the first spec, and
  `harness.checkpoint_lint` refuses a stream whose replacement copies seed a field no visible spec
  has seeded yet.

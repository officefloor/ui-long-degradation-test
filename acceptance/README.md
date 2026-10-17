# acceptance/ — the Playwright specs (the living spec; DESIGN.md §3, §7)

- The stream every checkpoint is generated from is described in [WORKSPACE.md](./WORKSPACE.md):
  one screen at `/`, people with claims and one figure (`due`) that forty checkpoints keep loading,
  every fourth checkpoint mutative. The stable `data-testid` contract is in
  [support/README.md](./support/README.md). The agent never sees any of this.
- Specs are GENERATED: `harness.stream_build` renders each checkpoint's script
  (`harness/oracle/hell_scripts.py`) through the reference model (`harness/oracle/hell.py`) and
  writes one spec per checkpoint under `specs/`, named `cpNN_<slug>.spec.ts`, plus the ripple
  copies a mutative checkpoint ships under `specs/cpNN/`. Never hand-edit a spec; edit the model
  or the script and rebuild.
- Specs bind ONLY to `data-testid` attributes, never CSS classes, DOM structure, tag nesting, or
  visible copy, so one suite validates any candidate front-end. Each spec arranges its data
  through the screens with [support/ui.ts](./support/ui.ts) on a sheet id of its own; there is no
  seed endpoint and no reset.
- `data-testid` values are immutable public API once introduced (DESIGN.md §3).
- A copy fully replaces the earlier version from its checkpoint on. `harness.checkpoint_lint`
  refuses a copy that drops a test without a `retires:` entry, a spec that names the sequence, and
  a copy asserting an anchor the agent could not know.
- The agent, while working, sees ONLY the current checkpoint's spec (blind; DESIGN.md §4). The full
  cp01..cpK suite runs afterwards as the regression gate, never shown to the agent.
- The working rules and testing contract the app is built to are [AGENTS.md](./AGENTS.md). The
  harness installs it, with `support/ui.ts` and the agent service's shim (`agents/<service>/`),
  into every app at every checkpoint; the stack's own `DESIGN.md` carries its stack-specific
  guidance.

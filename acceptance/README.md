# acceptance/ — the Playwright specs (the living spec; DESIGN.md §3, §7)

- One spec per checkpoint under `specs/`, named `cpNN_<slug>.spec.ts`, selectable so
  the gate runs only cp01..cpK at checkpoint K.
- Specs bind ONLY to `data-test-id` attributes — never CSS classes, DOM structure, tag
  nesting, or visible copy — so one suite validates any candidate front-end.
- `data-test-id` values are immutable public API once introduced (DESIGN.md §3).
- A mutative checkpoint ships updated copies of the prior specs it changes under a
  `specs/cpNN/` subdir (the `mutates` discipline; DESIGN.md §6).
- The agent, while working, sees ONLY the current checkpoint's spec (blind; DESIGN.md
  §4). The full cp01..cpK suite runs afterwards as the regression gate, never shown to
  the agent (tests-as-living-spec; DESIGN.md §7).

# acceptance/ — the Playwright specs (the living spec; DESIGN.md §3, §7)

The suite evolves an app built from arbitrary PEOPLE carrying arbitrary raw attribute
values, with named CONCEPTS computed on top of those values and on top of each other.
Nothing in the suite has real-world domain meaning (no clients, invoices or products).
This keeps the test blind to domain knowledge, so what it measures is purely whether the
stack absorbs interwoven definitions and changing relationships without eroding.

## Rules

- One spec per checkpoint under `specs/`, named `cpNN_<slug>.spec.ts`, selectable so the
  gate runs only cp01..cpK at checkpoint K.
- Specs bind ONLY to `data-testid` attributes — never CSS classes, DOM structure, tag
  nesting, or visible copy — so one suite validates any candidate front-end.
- `data-testid` values are immutable public API once introduced (DESIGN.md §3).
- A mutative checkpoint ships updated copies of the prior specs it changes under a
  `specs/cpNN/` subdir (the `mutates` discipline; DESIGN.md §6). Each updated copy
  carries forward ALL earlier mutations to that basename.
- The agent, while working, sees ONLY the current checkpoint's spec (blind; DESIGN.md §4).
  The full cp01..cpK suite runs afterwards as the regression gate.

## Two assertion channels

1. The UI, read through `data-testid`, for user-visible behaviour.
2. The known AUDIT FILE, read through `auditLines()` from `../support/audit`, for
   side-effects. Data is arranged per-spec via `resetAndSeed` from `../support/seed`
   (reset clears the DB and the audit file, then seeds the given rows).

## The stable data-testid contract (the arbitrary-people world)

The worksheet is the single screen. Everything is scoped to one worksheet at a time.

### Worksheet / persistence
- `nav-worksheet`                 — navigate to the worksheet screen
- `sheet-id-input`                — text input for the worksheet id
- `sheet-load`                    — load / switch to the id in `sheet-id-input`
- `sheet-current-id`              — shows the active worksheet id
- persistence is automatic per id; a test "refresh" is `await page.reload()`

### People
- `people-table`, `people-empty`
- `person-row-<id>`               — a person's row (id = seeded/created id)
- raw cells in a row               `person-<attr>`   e.g. `person-alpha`, `person-grade`
- concept cells in a row           `concept-<name>`  e.g. `concept-momentum`, `concept-tier`
- a not-yet-computable concept shows the literal text `n/a`
- form fields                      `person-form-<attr>`  e.g. `person-form-name`, `person-form-alpha`
- form submit                      `person-form-submit`
- field error                      `person-form-<attr>-error`
- open a person's editor           `person-edit-<id>`  (then reuse `person-form-*` + submit)

### Worksheet rollups (concepts over all people)
- `rollup-<name>`                  e.g. `rollup-total-thrust`, `rollup-leader`

### Relationships
- `patron-form-person`, `patron-form-patron`, `patron-form-submit`
- a person's patrons               within `person-row-<id>`: `person-patrons` (names, comma+space joined, sorted asc)
- allies / follows                 `ally-form-person`, `ally-form-other`, `ally-form-submit`; `person-allies`

### Audit file format
Lines are `EVENT key=value key=value ...`. Numeric concept values in audit lines use the
same plain integer rendering as the UI. Introduced by the checkpoint that needs them.

## Concept reference (grows over the run; definition is whatever the LATEST checkpoint set)
- `thrust   = alpha * beta`
- `drift    = gamma - alpha`
- `momentum = thrust + k*drift`            (k set by cp03, changed by cp04)
- `tier`    SINK/STEADY/SURGE by momentum thresholds (cp05, recalibrated cp08)
- `backing` aggregate of patrons' thrust   (cp10; many-to-many from cp12)
- `net      = momentum + backing`
Later concepts (rank, load, age, effective, clout, influence, reach, synergy, quality,
scaled, norm) are defined by their introducing checkpoint's spec.

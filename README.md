# ui-long-degradation-test

The **UI arm** of the long-degradation study. Its sibling,
`~/spring-petclinic-rest-long-degradation-test`, measures how server code erodes under a long
sequence of AI-authored changes; this repo asks the same question of a **front-end**.

- A constant **OfficeFloor server + database** sits behind every arm and never changes, so any
  measured erosion is attributable to the front-end alone.
- Each candidate **front-end architecture** is an arm; the same ~60 changes run against each.
- Tests are **implementation-agnostic**: they bind only to `data-test-id` attributes and are
  driven through the running UI with Playwright, so one suite validates any framework.
- The agent works **blind** (sees only the current checkpoint's test); the full accumulated
  suite runs afterwards as a regression gate. Functionality is tracked as **tests, not
  specifications**.

See **[DESIGN.md](./DESIGN.md)** for the full design and the reasoning behind each decision.

This harness also serves as a fidelity model of the OfficeHQ (`~/OfficeHQ`) production change
loop — see DESIGN.md §7.

_Status: design captured; implementation not yet started._

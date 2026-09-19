# ui-long-degradation-test

A **full-stack erosion experiment that replicates the OfficeHQ change loop**. Its sibling,
`~/spring-petclinic-rest-long-degradation-test`, measures how *server* code erodes when an
existing app is extended; this repo asks whether the **OfficeHQ approach can grow a whole
application from scratch** under a long sequence of plain-English change requests without eroding.

- **One application evolves.** It starts from a near-empty base — a base front-end shell, Spring
  with the OfficeFloor plugin, and an empty in-memory H2 database (no tables) — and is grown by
  ~60 English change requests. Each request is a **full-stack change**: schema migration +
  OfficeFloor server + front-end + its acceptance test. Nothing is held constant.
- **The app is one embedded Spring Boot jar** (OfficeFloor plugin + in-memory H2 + the SPA served
  as static files), one JVM — so it runs under the agent's Landlock sandbox. The harness mirrors
  the app into an isolated sandbox (copy/sync + Landlock, as the REST arm does) and builds+runs it
  whole for the gate. See **[docs/SUT_CONTRACT.md](./docs/SUT_CONTRACT.md)**.
- **Tests are the stable contract across the churn.** They bind only to `data-testid` and assert
  only through the running UI with Playwright, so the whole stack beneath them can be regenerated.
  Data is arranged per-spec via a profile-guarded `/__test__` seed endpoint (Arrange, not Assert).
- **The agent works blind** (sees only the current checkpoint's request + its own test, never the
  priors) and can run that test against the live app as it works. The full accumulated suite runs
  afterwards as the regression gate. Functionality is tracked as **tests, not specifications**.
- **No front-end arms** — the front-end is the fixed OfficeHQ opinionated shell. The only optional
  comparison is the intervention condition (the gated OfficeHQ loop vs an ungated control), to
  quantify what ImpactGate buys. Erosion is measured per layer (front-end TS + backend Java).

See **[DESIGN.md](./DESIGN.md)** for the full design and the reasoning behind each decision
(including why this started as a front-end-only comparison and became the full-stack model).

## Running

```sh
./setup.sh                                              # create .venv + install deps
# run one condition/chain over the checkpoints (spawns a fresh agent per checkpoint):
.venv/bin/python -m harness.run_experiment --config config.yaml --condition just-solve --chain 1
# analyse a run's committed capture -> results/<run_id>/analysis/{summary.md,*.csv,*.png}:
.venv/bin/python -m harness.analyze --config config.yaml --run-id <run_id>
```

`config.yaml` points `app.repo` at a base repo (a stack, e.g. `~/officehq-react-officefloor`); each
run commits its checkpoints to an `evolve/<run_id>/…` branch there. Anything that builds/serves/tests
needs real network + loopback (no sandbox).

## Status

Working: the base repo (`~/officehq-react-officefloor`), cp01–cp10 checkpoints, the driver
(`run_experiment` — blind two-commit loop, `just-solve` condition), the UI gate (`correctness` —
build/serve/Playwright + scoring), and `analyze` (Zero-Regression Rate, EvoScore, slopes). Deferred:
the `gated`/ImpactGate condition, structural erosion via `metrics.py`, and Landlock-confined runs.

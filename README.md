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
# A run spawns a fresh agent per checkpoint over many hours, so it REQUIRES a long-lived token
# (an interactive login would expire mid-run). The driver aborts without it.
export CLAUDE_CODE_OAUTH_TOKEN=$(claude setup-token)
# run the default condition/chain over the checkpoints (spawns a fresh agent per checkpoint):
.venv/bin/python -m harness.run_experiment --config config.yaml --chain 1
# analyse a run's committed capture -> results/<run_id>/analysis/{summary.md,*.csv,*.png}:
.venv/bin/python -m harness.analyze --config config.yaml --run-id <run_id>
```

The default condition is `gated` (`active_condition` in `config.yaml`). It runs the OfficeHQ
ImpactGate loop. After each implement turn the staged diff is scored per layer. A checkpoint
blocks and triggers a refactor turn when the change impact is over `block_percentile`, OR when the
cognitive gate flags a method it touched. The cognitive gate is on by default (`impact_gate.cognitive_max`).
It blocks a method whose Cognitive Complexity (Campbell 2018) exceeds the threshold. It catches
deeply nested, hard to read methods that the change impact percentile cannot see. It needs an
impact-gate build with the `--cognitive-max` flag. Set `impact_gate.cognitive_max: null` to turn
it off, or pass `--condition just-solve` to run the ungated control.

`config.yaml` points `app.repo` at a base repo (a stack, e.g. `~/officehq-react-officefloor`); each
run commits its checkpoints to an `evolve/<run_id>/…` branch there. Anything that builds/serves/tests
needs real network + loopback (no sandbox).

## Status

Working: the base repo (`~/officehq-react-officefloor`), all 60 checkpoints (`checkpoints.yaml` +
`acceptance/specs`, incl. the 16 mutative overrides), the driver (`run_experiment` — blind
two-commit loop, `just-solve` and `gated` conditions, fail-closed token guard), the UI gate
(`correctness` — build/serve/Playwright + scoring), `analyze` (Zero-Regression Rate, EvoScore,
slopes), `metrics` (per-layer structural erosion), and the `gated`/ImpactGate refactor loop.

Landlock confinement of the agent turn works and enforces the blind guarantee: the future specs,
`checkpoints.yaml`, and the work_root are unreadable, and `verify_denied` refuses to start the turn
if any is reachable. The build/serve/gate all run **unconfined** (real network + loopback). The
confined agent can also run Playwright itself for its in-turn browser self-test — the confinement
allowlist grants `/sys` read-only, which Chromium renderers need at startup (without it the renderer
target closes on launch). `HARNESS_NO_CONFINE=1` still exists to run unconfined if ever needed.

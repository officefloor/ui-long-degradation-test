# ui-long-degradation-test

An experiment in whether an architecture keeps complexity spread over a long stream of
plain-English change requests. One application is grown from an empty base by a fixed agent over
250 requests in five acts, on each of several technology stacks, and the structure of the code is
measured at every checkpoint. The hypothesis is that additive architectures (function injection on
the server, an additive front end) keep concentration spread because they restrict *sinews*, data
threaded down the call chain; dependency injection does half the job; a stack with neither erodes
furthest. The plan, the measures and the three paired runs are in [docs/PLAN.md](docs/PLAN.md).

## The documents

| Read | For |
|---|---|
| [docs/PLAN.md](docs/PLAN.md) | **The experiment.** The sinews hypothesis and its lineage, what is compared (the architecture axis, the three runs, the control stack), what is measured, the five acts in outline, the operating model, the order of work and its gates. Authoritative. |
| [docs/STREAM.md](docs/STREAM.md) | **The stream.** Why it has this shape, the five engines of erosion, the world, the test contract, the properties the builder and the lint enforce, every act checkpoint by checkpoint, the decisions taken while building Acts III to V, the catalogue of production gotchas, how to author a checkpoint. |
| [DESIGN.md](DESIGN.md) | **The harness.** How a checkpoint runs: the `data-testid` contract, the blind agent, the two-commit loop, the test queue beside the loop, regression classification, the metrics, the isolation and the agent's own test command. A thinking document that records the decisions behind the mechanics. |
| [docs/SUT_CONTRACT.md](docs/SUT_CONTRACT.md) | **A stack.** What a stack repository (`~/officehq-<frontend>-<backend>`) must provide: four scripts, two HTTP endpoints, a `stack.yaml`, and nothing else. |
| [acceptance/support/README.md](acceptance/support/README.md) | **The contract on screen.** Every `data-testid`, the audit events, how the helpers wait. |
| [acceptance/AGENTS.md](acceptance/AGENTS.md) | **What the agent reads.** The working rules and the testing contract, installed into every stack at every checkpoint; the only one of these documents the agent sees. |
| `checkpoints.yaml`, `acceptance/specs/`, `acceptance/DENSITY.md` | **Generated.** The requests, the specs and their ripple copies, the interaction density, all rendered by `harness.stream_build` from `harness/oracle/`. Never hand-edited. |

## The stream in one paragraph

250 checkpoints in five acts of fifty, every fourth one mutative, all on one screen and one figure
(a claim's *due* and the totals built on it). Act I lays the spine under load: statements that
bind figures to the moment they were shown (cp15), write-time ROLLUP/TOTALS audit lines after
every write that moves a figure (cp16), precedence exceptions from cp24, several write paths and
read surfaces by cp50. Act II adds time, permissions and reconstruction (dated settings, status as
of a period's end, the as-of view). Act III adds identity, hierarchy and cross-sheet work (aliases,
pools, merges and transfers, a tree of sheets). Act IV versions the rules and keeps legacy
semantics alive beside new ones. Act V squeezes: consolidation over the tree, rollovers, shared
claims, policy versions, and mutatives that reorder every exception. Every spec arranges its data
through the screens (no seed endpoint), carries three generated two-user scenarios beside its
story, and every expected value comes from the reference model. The builder refuses an additive
checkpoint that changes an earlier spec, a rule that does not bite under ablation, and a rule that
crosses fewer than two earlier ones.

## Running

```sh
./setup.sh                                              # .venv + pinned tools/ ; reports what
                                                        # it does NOT install (impact-gate, PMD, ck)
# A run spawns a fresh agent per checkpoint over many hours, so it REQUIRES a long-lived token
# (an interactive login would expire mid-run). The driver aborts without it.
export CLAUDE_CODE_OAUTH_TOKEN=$(claude setup-token)
# run the default condition over the checkpoints (spawns a fresh agent per checkpoint).
# No --chain runs every chain `chains` declares (10 by default), SEQUENTIALLY, under one run_id —
# which is what analyze aggregates over. One chain's hard failure does not stop the others.
# --repo names the STACK under test (never configured: one harness drives many stacks). It is
# logged at every checkpoint and written into the commits with that repo's `origin` remote.
STACK=~/officehq-react-officefloor
.venv/bin/python -m harness.run_experiment --config config.yaml --repo $STACK
.venv/bin/python -m harness.run_experiment --config config.yaml --repo $STACK --chain 1
# --resume CONTINUES each chain from its last committed checkpoint and STARTS any chain not begun
# yet (same --run-id; --chain optional), so one command picks a crashed or rebooted run back up.
# Usage limits, a rejected token, API errors and a lost network never end a run: the agent turn
# and the gate poll until they work again (the run is meant to be watched; a token that never
# recovers needs a person). An agent that runs past agent_timeout is retried once, then its
# partial work is gated as its outcome.
# Tests run BESIDE the loop: after each checkpoint the run queues a test of its agent commit in
# work_root/runs/<run_id>/queued-tests (its own spec; the full cp01..cpK suite at every
# gate.every-th and the last) and starts the run's detached processor, which tests each commit in
# order in runs/<run_id>/testing, on a port of its own from work_root/ports, with the suite frozen
# at the harness commit the job was queued under, and commits a chain's results to its branch
# (evolve-results/tests/, a final `tests:` commit) once that chain's last test is done. Each run
# has its own queue, checkout and port, so two runs share a machine. The queue is on disk: a killed
# processor's job is re-run, a resume queues any test that never reached it, and the processor
# outlives the run process, so the next chain's agents work while it catches up.
# Two logs per run, both appended to on a resume: runs/<run_id>/run.log holds everything the run
# prints (the terminal that started it shows the same), runs/<run_id>/test.log the test
# processor's progress — each job's steps, a line per test as Playwright finishes it, the result.
tail -f ~/ui-work/runs/<run_id>/test.log                                                  # watch the tests
.venv/bin/python -m harness.gate_queue --config config.yaml --run-id <id> status        # queued / running
.venv/bin/python -m harness.gate_queue --config config.yaml --run-id <id> retry-failed  # requeue failed jobs
# NOTE --from does NOT resume: it starts at base_ref, so it would skip the features later
# checkpoints build on. Use it only to run a prefix (--to N) or a smoke test.
.venv/bin/python -m harness.run_experiment --config config.yaml --repo $STACK \
    --run-id <run_id> --resume               # refuses a --repo other than the one that started it
# analyse a run's committed capture -> results/<run_id>/analysis/{summary.md,*.csv,*.png}:
# progress is a heartbeat line per CHECKPOINT (s/cp + eta + the headline metrics), because the
# recompute re-runs lizard/PMD/CK over a throwaway worktree per checkpoint and takes minutes.
.venv/bin/python -m harness.analyze --config config.yaml --repo $STACK --run-id <run_id>
```

```sh
# publish a finished run: the chain branches carry the evolved source + that chain's capture,
# and results/ is gitignored, so pushing them is what makes a run a remote record.
./push.sh --repo $STACK                      # every evolve/ branch not yet on the remote
./push.sh --repo $STACK <run_id> --dry-run   # just this run, and show rather than push
```

```sh
# does a stack satisfy the app contract? run this BEFORE a run, not after.
./verify-stack.sh --repo $STACK            # static: environment + contract, seconds
./verify-stack.sh --repo $STACK --smoke    # also RUN the toolchain confined (seconds), then
                                           #   build, start, probe and stop the app (minutes)
# the one prerequisite table, on its own:
.venv/bin/python -m harness.doctor --config config.yaml --repo $STACK
# does python/node/npm/java/mvn actually RUN inside the Landlock ruleset, and are ~/.m2, ~/.npm
# and ~/.cache writable there? Observed by forking each under the real ruleset, not inferred
# from paths — a tool the driver can run is not necessarily one the confined agent can run.
.venv/bin/python -m harness.doctor --config config.yaml --confined-smoke
```

```sh
# analyse EVERY run of every stack (~/officehq-*), then draw them all on one set of graphs.
# Each repo is interrogated for the runs and conditions it holds, so a repo with several of
# either is handled; results/overview/ gets the combined graphs + records.all.csv.
./analyze-all.sh                       # discover, analyse each run, then the overview
./analyze-all.sh --dry-run             # show the work, do none of it
./analyze-all.sh --overview-only       # redraw the combined graphs without re-analysing
./analyze-all.sh 202610020135          # only this run id, across whichever repos hold it
```

The default condition is `just-solve` (`active_condition` in `config.yaml`): the ungated control,
where the agent implements each request with no ImpactGate refactor. Pass `--condition gated` to
run the OfficeHQ ImpactGate loop. After each implement turn the staged diff is scored per layer. A checkpoint
blocks and triggers a refactor turn when the change impact is over `block_percentile`, OR when the
cognitive gate flags a method it touched. The cognitive gate is on by default (`impact_gate.cognitive_max`).
It blocks a method whose Cognitive Complexity (Campbell 2018) exceeds the threshold. It catches
deeply nested, hard to read methods that the change impact percentile cannot see. It needs an
impact-gate build with the `--cognitive-max` flag. Set `impact_gate.cognitive_max: null` to turn
it off.

`--repo` names the stack under test (a base repo such as `~/officehq-angular-spring`; it is never
configured in `config.yaml`, so a run is always explicit about its arm); each run commits its
checkpoints to an `evolve/<run_id>/…` branch there. Anything that builds/serves/tests needs real
network + loopback (no sandbox).

## Status

Built and lint clean: the four stack repos of runs A and B (`~/officehq-angular-spring`,
`~/officehq-tanstack-officefloor`, `~/officehq-angular-officefloor`, `~/officehq-tanstack-spring`,
branch `base-empty`), the 250 checkpoints of the stream (`checkpoints.yaml`, `acceptance/specs`,
generated from `harness/oracle/`), the driver (`run_experiment`: the blind two-commit loop,
`just-solve` and `gated` conditions, a fail-closed token guard), the test queue beside the loop
(`gate_queue`: own spec every checkpoint, the full suite every tenth), the UI gate (`correctness`:
build, serve, Playwright, scoring), `analyze` (Zero-Regression Rate, EvoScore, slopes), `metrics`
(per-layer structural erosion) and the `gated` ImpactGate loop.

Next, in the order of docs/PLAN.md §7: the dry gate of each act against a real build on
angular-spring and tanstack-officefloor; the control stack (Svelte/Javalin); a calibration chain on
angular-spring through cp250; then runs A, B and C.

Landlock confinement of the agent turn enforces the blind guarantee: the future specs,
`checkpoints.yaml`, the stream's design and reference model, and the work root are unreadable, and
`verify_denied` refuses to start the turn if any is reachable. The build, serve and gate run
unconfined (real network and loopback). The confined agent can run Playwright itself for its
in-turn self-test. `HARNESS_NO_CONFINE=1` runs unconfined if ever needed.

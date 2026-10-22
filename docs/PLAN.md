# The plan: do additive architectures keep concentration spread by restricting sinews?

_Written 2026-10-22 from the experiment design as the author stated it, the companion studies, and
what the runs to date have taught. This supersedes DESIGN.md §12 ("Open decisions and next steps") as the statement of where the
repository is going. DESIGN.md stays the record of the harness's mechanics and of the decisions
behind them; docs/STREAM.md is the stream as built: the engines of erosion, the world, the enforced
properties, every act checkpoint by checkpoint, the catalogue of gotchas and the authoring loop.
This document says what is being tested, with what, in which order, and how each act of the stream
keeps the pressure on._

## 1. Hypothesis and lineage

**Hypothesis.** Additive architectures keep complexity concentration spread because they restrict
*sinews*. A sinew is data coupled to the control flow: data that reaches the code needing it only
by being passed down the call chain, method to method (`sinew-identification-study/paper/SINEW.md`).
Its fourth harm, *attraction*, is the one this experiment rests on: data in scope invites logic, so
a method that already holds much of the data a change needs is where the next change is easiest to
put, and complexity collects where the data is. Where concentration and sinews intersect and both
keep growing is a black hole: a point that draws in more concentration and stronger sinews over
time. Dependency injection weakens sinews by taking objects off the control flow and making them
available by declaration (Spring on the server, Angular on the screen): half the job. Function
injection (OfficeFloor) removes them from the flow altogether: procedures receive their data as
injected values rather than as arguments threaded through callers. An architecture with neither,
where every datum travels on the control flow, is expected to erode furthest.

**Where the measures come from.**

All are in the `officefloor` GitHub organisation and cloned beside this repository.

- **complexity-concentration-study** (paper one): at a single checkout, a scale-free relative
  outlier in a per-unit complexity measure marks the classes and methods the textbook god-class
  and god-method definitions mark. Result so far: concentration identifies every area of erosion
  and also flags a false positive, *right* concentration: a unit that is complex because its
  algorithm is, and stays stable.
- **concentration-divergence-study** (pre-registered, measuring): weights a unit's complexity by
  its *coupling divergence*, the data it hands on minus the data it receives (`d = out − in` per
  method, giving each method a role: catchment, pipe or junction), and asks whether that tells a
  god unit from a complex leaf. It supplies the sinew measure this experiment reads.
- **spring-petclinic-rest-long-degradation-test**, the predecessor: Spring `@RestController`
  methods against OfficeFloor YAML-composed functions over a long change stream, published as
  Sagenschneider (2026), *Conserved amount, negotiable placement. Prompting perturbs one
  architecture, an AI reviewer both*, https://doi.org/10.5281/zenodo.23190619. Its measures
  (conservation of complexity, blast radius, comprehension load as `node_cc_median`, the
  structural-impact score, erosion and verbosity, Normalized Change, EvoScore, Zero-Regression
  Rate) are reused here so its Spring-versus-OfficeFloor result is replicated and then extended to
  stacks the author did not write.

This experiment is the test of the hypothesis on a whole evolving system, screen plus server, with
the architecture as the only variable and the agent, the stream, the harness and the measures held
fixed.

## 2. What is compared

### 2.1 The architecture axis

| position | server | screen | what is on the data flow |
|---|---|---|---|
| additive | OfficeFloor (the author's) | TanStack (the closest additive front end the author is not involved in) | everything: functions receive their inputs, state is not reached for |
| injection halfway | Spring (dependency injection) | Angular (dependency injection) | some: services and state are injected, the rest travels |
| control: no injection | a Java server with no dependency injection and no function injection | a front end with neither | nothing is lifted: every datum is passed, or becomes a shared static |

Mutative versus additive is the axis; the pairing of screen and server is the confound to be
excluded, and the author's involvement is the bias to be excluded.

### 2.2 The three runs

Each run is two stacks on two laptops, ten chains per stack, 250 checkpoints per chain, the same
stream, the same agent, the same harness commit.

1. **Run A, the pairing as built:** Angular/Spring alongside TanStack/OfficeFloor.
2. **Run B, crossed:** Angular/OfficeFloor alongside TanStack/Spring. If a front end or a back
   end were driving the result on its own, A and B would disagree; if the additive/mutative axis
   drives it, both front-end and back-end series separate the same way in both runs.
3. **Run C, the control:** the no-injection screen and server. It is expected to erode further
   than either halfway stack, and it belongs to nobody involved.

Stack repositories follow the `~/officehq-<frontend>-<backend>` convention and each is driven by
`--repo`. The four stacks of runs A and B exist (`angular-spring`, `tanstack-officefloor`,
`angular-officefloor`, `tanstack-spring`, each with `base-empty` carrying the fixes of
2026-10-21). The control stack does not exist yet.

### 2.3 The control stack, selected here

The author asked for a selection with no dependency injection and no function injection, owned by
no one involved. The choice, open to the author's veto:

**Server: Javalin, on the Jakarta servlet API, with JDBC against the same in-memory H2.** Javalin
has no container: a handler is a function of the request context, there are no annotations, no
beans, no lifecycle, and nothing is injected. Everything a rule needs is threaded through by hand
or reached through a static, which is exactly the no-injection condition. It is synchronous (the
agent is not fighting callbacks, which would be a second variable), embeds as one jar under the
same `bin/build`, `bin/start`, `bin/stop` contract, and is widely used by people with no stake
here. Alternatives considered: Helidon SE and Vert.x (no injection, but reactive style would make
asynchrony the variable), Spark Java (effectively unmaintained), plain servlets (so bare the agent
would write its own framework, which is a different experiment).

**Screen: Svelte 5 as a single-page application, runes and props, a minimal client router, no
SvelteKit loaders.** Svelte has no injection container; state is a `$state` value where it is
declared and travels by props and plain module exports. Loaders and hooks are function injection,
so SvelteKit's `load` is not used. The stack's DESIGN.md will forbid `setContext`/`getContext`,
the one injection-like escape, as it forbids the equivalents in the other stacks. Alternatives
considered: Vue (its `provide`/`inject` is dependency injection by name), React (context plus
hooks is function injection), Solid (context), HTMX (no injection at all, but it collapses the
front-end layer into server templates, so its front-end series would not be comparable; the
existing `htmx-spring` and `htmx-officefloor` stacks remain available for a hypermedia variant
later).

The repository is `~/officehq-svelte-javalin`, built to `docs/SUT_CONTRACT.md` and the same test
ids as the other stacks, with the Hikari `max-lifetime` fix from the start.

### 2.4 Later experiments the harness allows

The harness is black box: it sees `bin/build`, `bin/start`, `bin/stop`, `bin/e2e` and the test
ids. Other technologies and other agents can be run on the same stream. Changing the agent to see
whether a different model avoids erosion is a later experiment; here the agent is held fixed and
the architecture is the variable.

## 3. What is measured

### 3.1 Correctness, as a precondition rather than a result

- Every checkpoint: the checkpoint's own spec against the agent's commit. It says the change was
  made.
- Every tenth checkpoint, and the chain's last: the full cp01..cpK suite, mutative copies winning.
  It says nothing was lost. Only full tests move the regression baseline. Focus is only on the system
  implementing all features and not deleting features, so every 10th is deemed reasonable against
  testing time every checkpoint to ensure all functionality is implemented.
- The system never approaches the agent's context window, so the agent can hold the whole system
  and make informed decisions. Most own specs and most regression suites are expected to pass on
  every stack. A stack that fails a lot is a stack whose structure stopped the agent, which is a
  finding; a harness defect that fails a lot is noise, and the run is never disturbed for it
  (structure over correctness: harness-defect failures are corrected in analysis).

### 3.2 Structure, the result

Per checkpoint, per layer (front-end TypeScript at file scope, backend Java at class scope), never
compared across layers:

- **Concentration:** WMC and CC maxima and their shares (`ccdist_*`, `wmcdist_*`), hotspot size,
  the share of a layer's complexity held by its top file or class, change entropy and the cumulative
  change concentration, re-edit rates.
- **Sinews:** coupling divergence per method (`d = out − in`, roles catchment / pipe / junction)
  as the divergence study defines it, and the share of a checkpoint's complexity held by junctions;
  an injected parameter must not be counted as threaded, which needs an instrument that tells the
  two apart before the Spring and Angular arms can be read; beside them the harness's existing
  families: coupling (CBO, RFC, LCOM, fan-in and fan-out, ATFD and PMD's god-class verdict), data
  flow (`dfdata_tramp_*`, `drdata_*`, `drcol_*`) and reach (`reach_*`: does a type arrive before
  it is used, and is it used at all).
- **The PetClinic family** for conservation of complexity and plasticity: Halstead, maintainability
  index, cognitive and NPath totals and maxima, duplication, verbosity, the unit-shape and
  class-shape tables.
- **Trajectories, not levels:** the question is whether concentration and sinews grow together at
  a point, which is a black hole, or stay spread. The chain is the unit of analysis; cross-stack
  claims use the chain-level rank test (ten chains a side), never per-checkpoint slopes.

### 3.3 Cost and effort

Agent cost, turns, output tokens and wall time per checkpoint are recorded and are a secondary
series: an architecture that costs the agent more per change is also a finding.

## 4. The stream: five acts of fifty, stress from the first act

### 4.1 Principles

1. **Every request stands on the five engines** of docs/STREAM.md §2: many write
   paths for one rule; many read surfaces for one figure; live, frozen and as-of computations that
   must agree; rules in force at a date; server-only observables (the audit file, two users, gapless
   numbering, exports, the sheet's today).
2. **Three additive then one mutative**, every act. A mutative re-enters priors by changing the
   model, and `mutates:` is derived, never declared; the copies of prior specs are regenerated.
   The agent never sees a prior spec, so a mutation is cheap for it to *write* (cp76 of the last
   run re-entered 68 priors in three minutes) and expensive to *get right*: the regression suite is
   what catches the sixth write path it forgot.
3. **Not a gradual build-up.** Act I must leave the system already pushed: by cp50 every figure
   exists live, frozen and in the audit; there are at least four write paths and five read
   surfaces; roles, dated reference data and period freezing are in; and the mutatives have
   re-entered the spine four times. Act II then stresses a system that is already under load, and
   Acts III to V pile longer-horizon changes onto a stressed one.
4. **Each act adds at least one new write path, one new read surface and one new reconstruction
   demand**, so no single screen component or service can absorb an act by growing: the pressure
   keeps arriving from a new direction.
5. **One screen, one concept spine** (docs/STREAM.md §5). Concentration is
   enforced by the world, so the architecture has to spread it; the stream does not spread it for
   the architecture.
6. **Exact figures, hand-verified oracles, generated multi-user scenarios** beside every story,
   and the interaction-density metric per checkpoint, so every rule provably bites (oracle
   ablation) and the stream carries no stub.
7. **Every gotcha of real systems** from the catalogue (docs/STREAM.md §8):
   uniqueness with normalisation, rounding policies, half-even ties, effective-dated reference
   data, gapless numbering under concurrency, four-eyes, edit conflicts, freezing on settle and on
   close, precedence between exceptions, retirement and holds that remove rows from some totals and
   not others, delegation that changes who a user is, as-of reconstruction, retroactive versus
   forward-only changes, two semantics alive at once, consolidation across a hierarchy.
7. **Change complex not uniform** every act will also introduce 3 complex algorithms each, so it is 
   not all similar complexity being added.  This ensures leaf node complexity algorithms are correctly 
   managed by the architecture and not convoluted into the refactoring churn. 
   

### 4.2 The acts

The stream of cp1-80 (two acts of forty, built from `harness/oracle/` by `harness.stream_build`)
was the material; the five acts of fifty are built (docs/STREAM.md §6), Acts III to V re-cut from
the request material of the earlier world (in git history) onto the restarted one as Act II was.

**Act I (cp1-50), foundation under load.** The spine (sheet today, people, claims, statuses and
the workflow, rates, due, periods) lands with the engines already on it: statements that bind the
shown figures (engine 3) by cp15; write-time ROLLUP and TOTALS audit lines (engine 5) by cp16;
the first precedence exception by cp20; quick-add, paste and bulk open as further write paths
(engine 1) by cp30; header counters, the summary and the export as further surfaces (engine 2) by
cp35; roles, four-eyes and edit conflicts; retirement and holds; the close of a period that freezes
figures. Mutatives at cp4, 8, ..., 48 re-enter the spine: name normalisation, half-even rounding,
settle freezes due, effective-dated rates, the rollup carrying overdue. Act I ends with the
composite already moving, which the last three Act I chains (two streams) did not achieve: they
read zero erosion at cp40 and the agents absorbed each checkpoint in minutes.

**Act II (cp51-100), time, permissions and reconstruction.** Dated settings in force on the
claim's date; period figures by status as of the period's end; the late charge per boundary and
the floor after it; trimmed totals; snapshots on every today change; periods by due-by; the
permission matrix, the viewer role, delegation that makes a user a steward for a date range;
archive, locks, auto-close; a statement as of a date (the server reconstructs first) and then the
screen's as-of view (engine 3 in full). Mutatives re-enter up to 68 priors each. This is where the
last Spring run showed its shape: four god classes, a rollup service reaching into 85 foreign
attributes, the as-of view built as whole-sheet snapshots after every write, and the people
component at a third of the front end's complexity.

**Act III (cp101-150), identity, hierarchy and cross-sheet.** Aliases and uniqueness across a
sheet hierarchy; pools and nested pools (the first many-to-many, migrated from the one-to-many
patron link); merge and transfer of people between sheets, with claims, statements and audit
history following; child sheets and the first consolidated figures; an import path and an undo
and restore path (two more write paths on every rule); the audit viewer as a read surface over the
file itself; claim templates whose later changes must not alter claims made from them. Mutatives
re-enter identity and numbering across the tree.

**Act IV (cp151-200), rule versioning and legacy semantics.** Rules that apply from a date and to
records in a state, not everywhere: rounding by policy date, rates and terms by version,
retroactive corrections against settled claims versus forward-only plan changes; the classic
summary kept alive beside the new one so two semantics must both be right; the review state in the
workflow; locale and column choice as surface variance that must not touch a figure; as-of
reconstruction that now crosses versions and sheets. This is the bitemporal swamp of engine 4: a
team that sprinkled date checks is in trouble by cp170.

**Act V (cp201-250), the squeeze.** Consolidation over the tree with the trim rule applied once at
the top, transferred people counted once, snapshot comparisons, plans that generate claims with
pause and history and retroactive amount changes; the restricted-role lever, a screen total over
rows the signed-in user is not shown, which only the server can answer; and final mutatives that
reorder the precedence of the exceptions every earlier act introduced, so every surface, every
write path and every reconstruction must change together. The act exists to see whether an
architecture that survived to cp200 can still take a change that touches everything.

### 4.3 How the stress is kept continuous

- A mutative every fourth checkpoint in every act, re-entering rules from every earlier act (depth
  cycles), so nothing settles into a frozen layer the way the backend did at cp50 of the first
  stream.
- The surfaces and write paths accumulate and are never retired; a rule written where the first
  path lives has more paths to be forgotten on with each act.
- Reconstruction demands (frozen, as-of, versioned, consolidated) arrive one per act, each needing
  the previous one to be right.
- Generated scenarios in every spec put two users on the sheet, which is what makes browser-side
  recomputation visibly wrong.
- The gate every tenth checkpoint runs every prior spec, so the cost of a forgotten path is paid in
  the chain's own results, not discovered at the end.

### 4.4 What the earlier runs taught, and where it lands in the stream

| lesson (run) | consequence in this plan |
|---|---|
| A stream of pure functions of one sheet's rows is absorbed in the browser; the backend froze at cp50 and one copy-paste file scored zero erosion (202610171149) | the five engines, server-only observables, no seed endpoint: every spec arranges through the screens |
| Act I of the restarted stream ran clean on three chains, trajectories flat from cp5, both agents computing every figure twice (202610172303, 202610181730, 202610191319) | Act I pulls the engines forward; the composite must move by cp50 or the act is re-cut |
| Erosion, when it came, landed in one settings validator, one people component and a few services (202610192149 to cp79) | each act adds a surface and a write path so no one unit can absorb it; the sinews measures are the headline, not the composite, which ranked the arms the wrong way at cp40 |
| The as-of view was built as whole-sheet snapshots after every write, not journal replay (cp74) | reconstruction demands are placed server-first and re-entered later, so a heavy mechanism is paid for again |
| Correctness noise came from the harness, not the agent: the in-memory database dying at Hikari's max-lifetime, browser contexts never closed, reload waits, helpers blind to a pre-existing post-state, a generator reaching a hidden row, audit prefix matches, a duplicated closed-period check | every act is dry-gated against a real build before launch; the seeds carry the database fix; the queue runs tests beside the loop in a fresh temp directory |
| The agent bends the app to an impossible test and says so (cp71) | the generator's hidden-row and no-change guards; an agent note of "I changed existing behaviour" is a classification hint in analysis |
| Mutations are cheap for the agent because it never sees priors (cp76: 68 priors, three minutes) | the full suite every tenth checkpoint is the measure of what a mutation cost; the own spec alone proves nothing about a mutative |
| Tests check correctness, never app shape | fixes wait on visible results through existing test ids; no network-idle, no DOM-shape assertions |
| Three workers give the same outcomes 2.8x faster | `acceptance.workers: 3`; the full suite at cp250 (about a thousand tests) is roughly 45 minutes |

## 5. Operating model

- **Calibrate on angular-spring only** until the stream is final; it is the arm expected to suffer.
  Calibration chains are not comparison results. Once final, every arm runs the same stream.
- **Two stacks per run on two laptops, ten chains each**, sequential chains per laptop, just-solve
  only (the gated condition stays optional). The retry loops never give up on limits, outages or a
  rejected token; the author monitors and intervenes.
- **The run writes everything under `~/ui-work/runs/<run_id>/`**, ports under `~/ui-work/ports/`;
  tests run beside the loop in a per-run queue, the loop never waits for a result, a killed
  processor's job is re-run.
- **A run is never disturbed for a harness defect.** Failures are classified in analysis. A fix
  lands on main for the next run.
- **Budget, from the last chain:** about four and a half agent minutes and a dollar a checkpoint
  in Act II, so roughly 19 agent hours and $230 per 250-checkpoint chain, 8 days and $2,300 per
  stack per run, and some $14,000 for the three runs. The test processor must keep pace: 25 full
  suites of up to 45 minutes each per chain, beside the loop.

## 6. What is captured, for the analysis that comes after

Per checkpoint, committed to the chain's branch under `evolve-results/`:

- the request, the agent's whole stream (`cpNN.agent.jsonl`: every turn, tool call, edit and the
  agent's own summary), its diff (`cpNN.agent.diff`), cost, turns, tokens and wall time;
- the build log and the test results (`cpNN.json`, `evolve-results/tests/`): every test's pass,
  duration and failure text, the gate's attempts and validity;
- the probe of what the agent touched (pinned files, acceptance files, impact gate);
- every structure metric of §3.2, on every checkpoint commit, from `harness.analyze`, with the
  records concatenated per run and the overview across runs.

The agent's own account of each change is kept because it says why a unit grew: "the smallest
change that fixes this" at cp71 is the sinew forming. Nothing is discarded; measures not yet
defined (the coupling-divergence measure, a data-flow coupling metric, signature churn) can be
computed later over the same commits.

_Status 2026-10-22: step 3 below is built: five acts of fifty, cp1-250, from the oracle, lint
clean, every own spec compiling; the decisions taken are in docs/STREAM.md §7 (notably that cp1-80
were kept as Acts I and II, leaving the re-cut of Act I to the cp50 gate). The dry gate of each act
against a real build is the next thing to do. Step 2, the control stack, is not started._

## 7. Order of work and decision gates

1. **This plan** (done when this file is merged).
2. **The control stack:** `~/officehq-svelte-javalin` built to the SUT contract with the test ids
   of `acceptance/support/README.md`; `verify-stack.sh` passes; the author confirms or vetoes the
   selection of §2.3.
3. **The stream re-cut to five acts of fifty**, Act I carrying the engines, built from the oracle
   with `harness.stream_build`, lint clean, each act dry-gated against a real build (a scratch
   checkout of angular-spring at the previous act's tip) before any chain pays for it. Gate: Act I
   on one angular-spring chain moves the composite and at least two sinews measures by cp50; if not,
   Act I is re-cut, not Act II.
4. **A calibration chain on angular-spring through cp250**, the full queue harness carrying it.
   Gate: the own-spec pass rate stays high and the full-suite failures are the agent's, not the
   harness's; every failure classified.
5. **Run A, then Run B, then Run C**, each at one harness commit, each analysed with the chain
   rank test and the trajectory plots; the write-up compares the three on the sinews measures first
   and on the PetClinic family second.

**Fixed before the first run.** The stream, the model and the chain count are named and frozen
at a tagged commit before Run A starts and never rebuilt during the three runs, so any analysis
registered against these runs can name what it reads. A harness fix made during a run lands on
main for the next run; the running stream does not move.

Open: the divergence study's final measure and an instrument that separates injected from
threaded parameters, to be added to `harness.analyze` when fixed; whether the control run needs a
crossed pairing of its own (it does not test the pairing confound, only the floor).

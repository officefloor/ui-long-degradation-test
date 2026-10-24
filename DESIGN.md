# ui-long-degradation-test Design Notes

> **Where this fits.** [docs/PLAN.md](docs/PLAN.md) says what the experiment tests and how the runs
> are ordered; [docs/STREAM.md](docs/STREAM.md) is the stream of 250 requests in five acts, generated
> from the reference model under `harness/oracle/`; this document is the harness: how one checkpoint
> runs, what the tests may bind to, how results are classified and measured, and the decisions
> behind each of those mechanics.

_Originally captured 2026-09-19 as a full-stack erosion experiment with a business domain
(clients, projects, invoices); reframed 2026-10 to a domain-free benchmark; restarted 2026-10-18
around the stream of docs/STREAM.md, whose nouns are meaningless and whose mechanisms are the ones
production systems have. The app is grown from a near-empty base by 250 plain-English change
requests, each evolving schema plus server plus front end together, against a suite that binds
only to `data-testid` and the audit file. This stays a thinking document: it records decisions and
the reasoning behind them, including where the design changed as we worked through it. Section 2
records the framing changes; the measurement machinery (Sections 5, 6, 8, 9, 14, 15) is the part
that transferred from the REST arm and still holds._

---

## 1. Purpose

Show whether an architecture can absorb a long sequence of interwoven changes without eroding, when
the problem itself is intrinsically coupled. The earlier framing asked whether a specific product
loop stayed flat on a business app. The sharper question, and the one this version measures, is
**plasticity**. Hold the behavioral contract fixed, apply a change of known shape, and measure what
the solution has to do to absorb it. An architecture is plastic when a new rule, or a changed
definition, or a migrated relationship ripples through without concentrating complexity into a
hotspot and without breaking what already worked.

The subject matter is deliberately meaningless. There are no invoices, clients or products.
There are sheets, people and claims with one figure (*due*) that every request loads further, and
mechanisms real systems have (statements that bind figures, write-time audit lines, dated rules,
reconstruction as of a date; docs/STREAM.md §3). This is on purpose. A business domain lets an
agent lean on what it already knows about invoices, which confounds the measurement and ties the
result to one domain. Stripping the domain leaves only the thing under test, which is whether the
stack holds its shape as rules interweave and the data model shifts underneath.

Two references shape the design.

- **The REST harness** (`~/spring-petclinic-rest-long-degradation-test`) is the established method.
  Number a checkpoint list 1..N, hand a fresh agent one checkpoint at a time, gate and score each,
  and track erosion over the sequence. It is the source of the reusable spine, the metric names and
  the blind design. It measured server erosion on an existing app. This harness measures whole-stack
  erosion while growing an app from nothing. Metric names are kept aligned so the two read as one
  body of work.
- **OfficeHQ** (`~/OfficeHQ/DESIGN.md`) is the product this ultimately serves, an AI-augmented
  pipeline that lets non-technical people build systems from plain English. That product needs a
  front-end and a change loop that does not rot, which is why this harness is full-stack and models
  the same loop. The domain-free design keeps the result from being about OfficeFloor or any one
  framework, so it can stand as a general benchmark that any architecture runs against.

The hypothesis for why an architecture would resist is the additive-and-local one, stated as the
sinews hypothesis in docs/PLAN.md §1: an architecture that takes data off the control flow keeps
complexity from collecting where the data is. The architecture that makes the additive path the
path of least resistance, and the reach-across path structurally hard or loud, is the one that
survives a long run of coupled changes. The stream is built to punish reach-across, by making
later changes re-enter earlier definitions and relationships (docs/STREAM.md §1, §2).

---

## 2. The world the suite evolves (nothing is held constant)

This design began as "hold a backend constant and vary only the front-end." That was dropped,
because it does not model a real change loop, where one English request evolves the whole stack. So
there is no constant layer. Every checkpoint may change all of the following.

- The database schema, through new tables and columns via migrations. The app starts with no tables.
- The server, through new procedures, sections and endpoints.
- The front-end, through new pages, components and state.
- The acceptance test, which is this checkpoint's own spec (Section 7).

Within a single run the whole stack is fixed, because it is one base repo and one technology stack.
The study compares technology stacks across runs. Each candidate stack is its own base repo, a
home-level sibling `~/officehq-<frontend>-<backend>`, and the harness runs the same checkpoint
stream against each in turn to see which stack best resists erosion under the same evolution
(Section 10). Both the front-end and the backend may vary between stacks. Within a run there are no
in-run arms. The only optional in-run dimension is the intervention condition (Section 10), the
gated loop against an ungated control, to quantify what the gates buy.

Because everything churns, the one thing that stays stable is the test contract, which is
`data-testid` plus UI-only assertions (Section 3). That is what makes a fully-evolving stack
measurable at all.

### The world the requests build

The app is one screen, the sheet at `/`. A sheet is loaded by id and every test uses a fresh id,
so tests are isolated without a reset. A sheet holds people, their claims, rates, periods, pools,
plans, settings and roles, and writes an audit file; later a sheet has a parent and belongs to a
tree. The one figure everything loads onto is a claim's *due* and the totals built on it. The world,
the five engines each request stands on, and the five acts checkpoint by checkpoint are in
docs/STREAM.md; the `data-testid` contract is in `acceptance/support/README.md`. Those are the
living reference, generated from the reference model, so this document does not restate the rules,
which would rot.

The stream is 250 checkpoints in five acts of fifty (docs/PLAN.md §4). Every checkpoint whose
number is divisible by four is mutative: it changes what earlier specs expect and ships updated
copies of them; the three between are additive and leave every earlier spec untouched. Each act
adds at least one write path, one read surface and one reconstruction demand, and at least three
checkpoints per act carry an algorithm a naive implementation gets wrong.

---

## 3. The implementation-agnostic seam: `data-testid` as a declared contract

The REST harness is implementation-agnostic because its tests are black-box REST assertions over
URLs, JSON fields and status codes. The API is the contract. Here the whole stack is rewritten as
the app evolves, so the tests need a seam that stays stable through all of that churn and never
couples to any one implementation's internals.

The decision is that tests bind to `data-testid` attributes and nothing else. Never CSS classes,
DOM structure, tag nesting, or visible copy. A test locates an element by its `data-testid`,
performs the user action, and asserts on values read through other `data-testid` anchors. The same
Playwright suite validates the app however the stack beneath is implemented, because all it depends
on is the presence and behaviour of named anchors over the data the spec itself arranged through
the screens (Section 9), not on any schema, API or DOM detail. The conventions are fixed. A
person's row is `person-row-<id>` with cells `person-<name>`, a claim's row `claim-row-<id>` with
cells `claim-<name>`, a sheet total `rollup-<name>`, and so on through the contract in
`acceptance/support/README.md`.

A second channel covers side-effects. Some rules are not user-visible, for example an audit trail.
The UI cannot show them, so the app writes audited behaviour one record per line to a known file,
and specs assert by reading it (`expectAudit` in `acceptance/support/ui.ts`, filtered to the lines
carrying the spec's own sheet id, so the file is never cleared). This is the only non-UI assertion
channel. It is a declared, stable contract exactly like `data-testid`. The file
path and the one-record-per-line format do not drift, so the stack beneath can still be rewritten
freely as long as it keeps emitting the agreed records. A later field goes at the end of a line and
a spec matches a line by its start, so a later checkpoint can extend a line without changing it.
Everything else is still asserted through the UI.

A consequence is that the anchors must be provided to the agent. The agent cannot guess which
`data-testid` values or audit records a hidden test expects. So each checkpoint's own test is handed
to the agent (Section 4). The test declares the anchors and records the new feature must expose, and
the agent's job is to build a feature that exposes them and behaves correctly.

One genuinely new thing the UI adds over REST is worth naming. A REST endpoint is inherently the
contract. A `data-testid` is a synthetic contract layered on the DOM, so it must be declared stable.
One rule, constant across the run, sits in the shared agent instructions.

> Once introduced, a `data-testid` is immutable public API. Never rename or remove it.

With that rule, a prior anchor changing is unambiguously the architecture failing to localize a
change, which is signal, not agent whimsy. Without it, anchor drift is noise. The rule is what makes
`data-testid` a fair agnostic seam.

---

## 4. Blind vs full, settled on blind

The question was whether the agent, at checkpoint K, should see only checkpoint K's test (blind) or
the whole cp1..cpK suite (full).

The REST harness already answered this and the reasoning transfers with more force, not less. With a
full checklist of prior tests visible, regressions are near zero by construction. Blind, the agent
must preserve behaviour from memory and architecture, which is the whole point of measuring
regression. Full mode makes the headline metric, the Zero-Regression Rate, trivially 1.0 and deletes
the signal. Blind is chosen.

### Why the `data-testid` regression worry dissolves under blind

The initial worry was that a `data-testid` drifting slightly registers as a regression even though
the app still works, so false positives swamp the architecture signal.

It dissolves because blind is only about prior tests, not prior code. A fresh agent at checkpoint K
sees the current source tree, which already contains every prior feature and its `data-testid`
anchors embedded in the components. It just does not see the prior test files. Two things follow.

- The agent can preserve prior anchors, because they are in the code it is editing.
- Whether it does depends on whether adding feature K forces edits into the files where feature J's
  anchors live. That is exactly the locality and blast-radius property under test.

So an anchor regression is not a false positive. It is the front-end equivalent of a blast-radius
spill. A front-end with real structural resistance keeps feature K's work away from feature J's
files, and J's anchors survive untouched. Blind regression rate tracks architecture locality. That
correlation is the experiment.

### Optional ceiling control

Run full once as a reference run. Not for the real result, but to put on record how much regression
the safety net hides, which will be near zero. It makes the blind numbers legible to readers and
quantifies how much the architecture matters when the net is handed over.

---

## 5. Checkpoint lifecycle (the change loop, made deterministic)

This mirrors the REST harness's two-commit-per-checkpoint boundary, but each turn is a full-stack
change and the oracle is a live, served app driven by Playwright. The app grows from the empty base
(Section 2). At cp01 there are no tables. Each checkpoint may add a migration, server code and UI.

For each checkpoint `k` from 1 to N.

0. **Blind agent view.** Install only this checkpoint's own test (the `cpNN` Playwright spec) plus
   shared test infra. The agent never sees prior tests. The current source tree, with all prior
   schema, server and front-end and its anchors, is present as normal.
1. **Agent turn.** A fresh headless `claude -p` is given this checkpoint's plain-English change
   request, plus this checkpoint's own spec so it knows the `data-testid` anchors and values to
   satisfy, plus the current code. There is no cross-checkpoint memory. It authors the full-stack
   change, meaning migration plus server plus front-end, and may run its own test as it works
   (Section 15). Cost, tokens and duration are captured.
2. **Build and serve the app.** Build this checkpoint's app into one runnable jar (a Spring Boot host
   plus the server plus migrations plus the SPA built into `static/`), bring it up on one port, and
   drive it with Playwright (`correctness.serve()`, Section 14). `app.start` boots the jar, Flyway
   migrates the in-memory H2 up to this checkpoint's schema starting from empty, and serves the SPA
   and API on PORT, then `wait_ready`, then run the specs, then `app.stop`. Every spec arranges its
own data through the screens on a sheet id of its own (Section 9). This stage does not exist in the
REST arm and is the main new moving part (Sections 9 and 14).
3. **Gate and score, beside the loop.** The run queues a test of the agent commit in its own test
queue (`harness.gate_queue`) and goes on to the next turn: the checkpoint's own spec at every
checkpoint, and at every tenth and the chain's last the full resolved cp01..cpK suite (mutative
copies winning), never shown to the agent, so it is a gate, not context (Section 7). The run's
processor tests each commit in order in a checkout of its own, classifies the results (Section 6)
and commits them to the chain's branch. The code metrics (Section 8) are computed over every
checkpoint commit by `harness.analyze` afterwards.
4. **Reset commit.** Normalize and set the agent view for the next checkpoint, its own test only, so
   cp(K+1) starts blind and the agent commit stays pure. Kept even if empty, so every checkpoint is
   a clean two-commit boundary.
5. **Capture.** A per-checkpoint raw capture (the English request, the rendered prompt, the agent
   event stream, the build and test console, the test outcomes, and the commit SHAs) is committed
   with the reset, so each checkpoint commit is self-contained and the run reconstructs from git
   alone.

Arrangement through the screens with helpers that wait on the screen's result or its error, and
strict awaiting on `data-testid` presence, are load-bearing here (Section 9). Without them, UI
flake manufactures regressions that have nothing to do with erosion.

---

## 6. Regression classification

Carry over the REST harness's `regressions` versus `true_regressions` split and its `mutates`
discipline, and add a UI-specific reason code so the shape of erosion is visible.

At checkpoint K, each prior-checkpoint test failure is classified.

- **anchor-drift.** The element is present and functional, but its `data-testid` changed or was
  removed. This is a contract regression, and it counts, because it is the locality signal.
- **behaviour-loss.** The feature genuinely broke, meaning a UI assertion fails (element gone, wrong
  value, action fails) or an expected audit record is missing or changed in the audit file
  (Section 3). This is a classic regression, and it counts.
- **harness defect.** The failure is the harness's, not the agent's: a helper that could not see a
result, a generated scenario reaching a row the user could not see, an app that died at the
database's connection lifetime. A run is never disturbed for one (docs/PLAN.md §3.1): failures are
classified in analysis, the fix lands on main for the next run, and the classified failure is
corrected in the record.
- **intended.** Checkpoint K legitimately changes prior behaviour and ships a replacement `cpJ` spec
  (the `mutates` discipline). This is excluded from `true_regressions`.

`regressions` is any prior test failing at K (raw). `true_regressions` is regressions minus intended
mutations. anchor-drift and behaviour-loss count as regressions; a harness defect is noise. Logging
the reason tells you how the app erodes, front-end or backend, a richer result than the REST arm
can produce.

The `mutates` discipline carries one obligation that this benchmark leans on heavily. A mutative
checkpoint's `mutates` list is the ripple closure, every prior checkpoint whose asserted values
change, not just the direct target. The builder derives it: it re-renders every prior spec under
the new rule and ships each one that changed under the mutative's `cpNN/` folder (cp76 re-entered
68 priors). An unlisted prior cannot exist, so a prior that breaks is a true regression, which is
the measurement working. A mutation is cheap for the agent to *write* (it never sees the priors)
and expensive to get right: the full suite every tenth checkpoint is what catches the sixth write
path it forgot.

Metric names stay aligned with the REST arm (EvoScore, Zero-Regression Rate, Normalized Change) so
the two studies read as one.

---

## 7. Tests-as-living-spec

Functionality for the whole app, schema, server and UI, is tracked as tests, not accumulating prose
specs. Users change their minds, and a growing spec corpus goes stale, self-contradicts, and costs
tokens to re-read. The accumulated test suite is the current specification of behaviour. A change of
mind is a changed or replaced test (`mutates`), not a spec reconciliation. The English request is the
prompt. The test is the spec. Because the tests assert only through the UI (Section 3), the entire
stack beneath them can be regenerated freely, which is exactly why the tests, not the code, are the
system of record.

This composes with Section 4 into one coherent loop, blind authoring plus full-suite gate plus
tests-as-spec.

- **tests-as-spec.** The suite is the current spec, so there is no prose corpus to rot.
- **blind authoring.** The agent gets only this checkpoint's request plus its own test, the delta,
  plus the code. It never reads the historical suite.
- **full-suite gate.** The whole cp1..cpK suite runs as the regression gate. It never enters the
  agent's context, so it need not run inside the loop either: the harness queues a test of every
  agent commit, the checkpoint's own spec (flat cost: was the change made) or at every 10th and
  the last the full suite (`gate.every`), and the run's own processor beside the loop runs them in
  order (`harness.gate_queue`). A regression standing between two gates is caught by the next
  one and pinned to its checkpoint by bisecting the commits in between. The gate's cost grows with
  the square of the checkpoint count (K tests at checkpoint K), so gating every checkpoint of a
  250-checkpoint chain is about 129 h of Playwright at 3 workers against about 15 h of agent turns;
  every 10th is about 13 h and keeps up.

The last split matters for the product economics. The full suite grows unbounded over an app's life,
but because it is a gate and not context, the agent's token cost per change stays flat regardless of
history. Stale-spec contradiction and token blowup are the same problem, and blind authoring solves
both at once, which is part of what keeps the marginal cost per change near zero. So this harness is
a fidelity model of the production change loop, not just a benchmark. What blind measures here is
what the product will actually do to a customer's app.

---

## 8. Metrics and measurement

Erosion is measured across the whole stack, the front-end in TypeScript and the backend in Java. The
backend is measured to confirm the server stays flat even when grown greenfield, not just when
extended on an existing app (the REST arm's finding). Both use the same Lizard and ImpactGate
pipeline and the same thresholds.

### ImpactGate and Lizard, confirmed native for front-end TS and backend Java

ImpactGate scores blast radius from Lizard's per-function CC and NLOC. Backend Java is what the REST
arm already scores. For the front-end, this was checked empirically against the local install
(`~/ImpactGate/.venv`).

- Lizard's registered readers include `TypeScriptReader`, `TSXReader` and `VueReader`.
- Parsing samples returned real functions with complexity for `.ts`, `.tsx` and `.jsx`, plus the
  `<script>` block of `.svelte` and embedded `<script>` in `.html`.

  ```
  a.ts     -> 2 fns: [('f',2,1),('g',1,1)]
  a.tsx    -> 2 fns: [('C',2,1),('h',2,1)]     # JSX handled, component named
  a.jsx    -> 2 fns: [('(anonymous)',2,1),('C',1,1)]
  a.svelte -> 1 fn:  [('inc',2,1)]             # only the <script> function
  a.html   -> 1 fn:  [('q',2,1)]               # only the embedded <script>
  ```

So React with TS, and Vue, score out of the box, with no port needed. Two subtleties matter more than
language support.

1. **Front-end metric visibility is format-dependent, so the shell's format matters.** Pick the base
   shell's format for full Lizard fidelity. `.tsx`, `.ts` and `.vue` are read fully, with branching
   in JSX and script counted and components named. `.svelte` has no dedicated reader, so only the
   `<script>` function is seen and template and reactive logic are invisible, and `.html` or HTMX
   exposes only the embedded `<script>`, so attribute logic is invisible. A shell in either would
   under-count its own front-end erosion, so the base shell should be a full-fidelity format. Backend
   Java is full-fidelity regardless.
2. **The front-end cohesion container is the file, not the class.** The plugin qualifies units as
   `Class::method` and falls back to file scope for free functions. Front-end components and hooks
   are free functions, so every front-end unit collapses to file-scope containers, and the
   `Σ max(WMC_other,1)` term becomes a sum over other files, not other classes. The formula is
   internally consistent, but the unit differs between the layers. So track front-end and backend
   erosion as separate series, and do not compare their absolute numbers to each other or to the Java
   REST run. Backend Java keeps true `Class::method` containers, directly comparable to the REST arm.

### Boundary-violation count, a format-neutral co-metric

Count how often the agent is forced to touch a shared or central file per checkpoint, on the
front-end (a router or manifest, a global store, a shared primitive) and on the backend (a shared
config or wiring file). It measures the additive property directly on both layers, needs no Lizard
visibility, and stays honest wherever Lizard's view is partial. Run it alongside ImpactGate, not as a
fallback.

### Normalization

Normalize erosion per unit of delivered behaviour, not per change. A more capable framework lets the
agent do more per change, meaning bigger line deltas, which is not erosion. Use the passing
behaviour-test count or coverage as the denominator.

### The cold-reader comprehension probe

At each act boundary (`probe.at_checkpoints`: 50, 100, 150, 200, 250) a fresh, read-only,
history-less agent, with the acceptance specs excluded from its view, reads the evolved code and
(1) names every figure the sheet shows and every rule that decides it and (2) says how hard the
logic was to find and follow. `probe_recall` is the fraction of the rule names in force at that
boundary it could name (the ground truth is `probe.expected`, from the model's rule table);
`probe_cache_read_tokens` and `probe_cost_usd` are the comprehension-cost proxy. It is advisory (an
error is logged and the run continues) and a proxy, read beside the objective gate; the signal is
the trajectory across acts and the gap between stacks at the same boundary.

### Longitudinal hygiene

Prefer `.tsx` over `.jsx` and TS over JS. The JSX-under-JS reader emitted `(anonymous)` for the
arrow in `.map`, and anonymous units are hard to track across hundreds of commits, because a unit's
drift is lost when it re-anonymizes. Stable unit identity matters for a trajectory study. Hold the
agent, the base shell and the gates identical across a run, so the only variable is the sequence of
English requests, and, if the intervention study runs, the gating condition (Section 10).

---

## 9. Moving parts and risks (absent from the REST arm)

1. **The oracle needs the app actually running.** MockMvc boots in-process. Here the loop must build
   this checkpoint's backend jar and front-end dist, boot the app with Flyway migrating the in-memory
   H2 from empty up to the checkpoint's schema, serve it, and wait for reachability every checkpoint.
   This is the main new source of harness fragility (the build-and-serve stage, Section 5.2).
2. **Data is arranged through the screens, never seeded.** The first stream had a test endpoint
that wrote rows straight into storage, and it was the reason the stream did not erode: no rule on
*writing* was ever exercised, and the cheapest correct solution computed everything in the
browser (docs/STREAM.md §1). So there is no seed API. Every spec signs in, loads a fresh sheet id
and creates everything it needs through the same screens a person would use, with the
harness-owned helpers in `acceptance/support/ui.ts`, so every write path is under test and a
spec stays self-contained with the screens at its checkpoint. Isolation is by sheet id, so there
is no reset and no JVM restart; audit assertions filter the file by sheet id.
3. **Flake is a false-regression source that erosion is not.** Async UI and non-deterministic data
manufacture regressions unrelated to erosion. The helpers wait on the screen's result or its error
element and return as soon as either shows (an error left over from the action before counts once
it has been cleared and shown again); a reload is made observable through a throwaway id; a
created row is found by what was entered, not its position; an audit line may lag the screen and
is re-read for up to three seconds. Every expected value is computed by the reference model, so
the oracle is exact. The defects the first chains exposed (the in-memory database dying at the
connection pool's max-lifetime, browser contexts never closed, a helper blind to a pre-existing
post-state) are fixed in the stacks' base branches and the helper, and a defect found later is classified in
analysis rather than disturbing a run.

---

## 10. What is run (per-stack runs plus optional intervention study)

The comparison is across technology stacks, one per base repo, a home-level sibling
`~/officehq-<frontend>-<backend>` (Section 14, `docs/SUT_CONTRACT.md`), each driven by `--repo`.
docs/PLAN.md §2 names the axis and the runs: additive (OfficeFloor, TanStack), injection halfway
(Spring, Angular) and a no-injection control (Javalin, Svelte); run A pairs the stacks as built,
run B crosses them to exclude the pairing confound, run C is the control. Two stacks per run on two
laptops, ten chains each, the same stream, the same agent, the same harness commit. The harness
runs the same checkpoint stream against each base repo and compares their trajectories, chain by
chain. Pick front-end formats Lizard reads fully (`.tsx` or `.vue`, Section 8) so a stack's own
erosion is visible; a `.svelte` stack declares its layers in `stack.yaml` and its front-end series
is read with that caveat.

- **The experiment's condition is `just-solve`**: the agent implements each request with no gate
in the loop, replicated across `chains` for a per-arm distribution. The result is the trajectory
of the structure measures (docs/PLAN.md §3.2), front-end and backend, with correctness as a
precondition rather than a result.
- **Optional intervention study.** Reuse the REST harness's conditions as prompt and gate
strategies, not front-end arms: the `gated` ImpactGate loop against the `just-solve` control. The
delta shows the gate's effect on full-stack erosion, the direct sequel to the REST arm's finding
that ImpactGate reduces server erosion. Its block percentile needs recalibrating for this stream
first.

The condition slot in the harness config therefore names the intervention condition, not a
framework.

Because the benchmark is domain-free, this across-stacks comparison is its headline use. Any
architecture, from any vendor, can be dropped in as a base repo and scored on the same stream, which
is what lets the result speak to plasticity in general rather than to one framework.

---

## 11. Naming

`ui-long-degradation-test`, parallel to `spring-petclinic-rest-long-degradation-test`. The REST repo
is the server long-degradation test on an existing app. This is the whole-stack one that grows an
app from nothing. "long-degradation" keeps the point, a long sequence and structural decay. "ui"
marks that the tests, the stable contract across the churn, drive through the UI.

---

## 12. Open decisions and next steps

Superseded by docs/PLAN.md §7, which is the order of work and its decision gates. Of the items
once listed here: the base repos exist for the four stacks of runs A and B (`base-empty`, with the
connection-lifetime fix); the app to build and the checkpoint authoring are resolved to the stream
of docs/STREAM.md; the contract is validated against real builds at every act's dry gate; the stack
is embedded, not containerised (Section 15); the intervention study is optional (Section 10);
ImpactGate's file-scope containers for the front end stay a separate series (Section 8); the
harness is reused by copy (Section 13). Open, in PLAN.md's words: the divergence study's final
measure, and whether the control run needs a crossed pairing of its own.

---

## 13. Repository and code-sharing strategy

The decision is a separate repo, shared by copy now, extracting a shared core only at N=3. Not the
same codebase as the REST arm, and not a shared library yet. The reasoning is that the REST repo is a
publication artifact mid-flight (`blog/`, baselines, its own thesis, the self-contained "each run
reconstructs from its own commits" property). Bolting a second, differently shaped experiment into it,
or refactoring it now to extract interfaces, churns the thing being published for low reward.
Abstracting a shared core from one example builds the wrong seam, and we are at N=1.5, with REST done
and UI starting. Copy now, extract when a stable second instance exists to factor from.

The REST harness's modules split cleanly by reusability.

| Module | Nature | Action here |
|---|---|---|
| `agent.py` | generic (headless `claude -p`, config isolation) | vendored verbatim |
| `landlock.py` | generic and security-critical (makes blind airtight) | vendored verbatim |
| `capture.py` | generic capture-not-derive | vendored, adjust tool list and result shape |
| `analyze.py` stats | generic (slopes, bootstrap CIs, EvoScore, ZRR, plots) | lift the stats verbatim |
| `correctness.py` | REST and Java (MockMvc, Surefire) | rewrite to build, serve, Playwright |
| `metrics.py` | Java (Erosion over Java, ast-grep-java, jscpd) | rewrite to Lizard, TS, boundary count |
| `class_shape.py` | Spring vocabulary | drop (a JS analog much later, if ever) |
| `quality_gate.py` | Java rules | drop initially (only the `impact_gated` arm needs it) |
| `impact_gate.py` | wrapper generic, seed Java | vendor the wrapper, needs a TS seed distribution |

Vendored files carry a provenance header naming the source repo, SHA and date, so upstream fixes can
be diffed in and a future extraction is mechanical.

The cheap insurance is that even where the bodies differ, the seam function signatures stay identical
across the two repos, a `gate(built_tree) -> {results, pass/fail}` for correctness and a
`compute_all(...) -> row` for metrics. Both harnesses already have these two natural seams. Matching
the signatures now makes the eventual `long-degradation-core` extraction a lift, not a re-plumb.

---

## 14. System under test: one evolving app, copy/sync isolation, and lifecycle

### The code is one external folder, the evolving app

There is a single external code folder per run (`app.repo` at `base_ref`), the managed application,
which is the base front-end shell and the backend and its migrations and the whole-stack
`bin/start` and `bin/stop`, all in one repo that evolves together over the run.
There is no separate constant `sut.repo`, because nothing is constant (Section 2). Each base repo is
a technology stack, a home-level sibling named `~/officehq-<frontend>-<backend>`, for example
`~/officehq-react-officefloor`. Swap stacks by pointing `app.repo` at another and running again
(Section 10). The harness never edits `base_ref` in place. It is only ever read as the start point,
keeping `~/ui-long-degradation-test`, the harness, separate from the app it grows.

### Copy/sync plus Landlock, reused verbatim from the REST arm

The mechanism that makes the blind view airtight and copies the right specs in is lifted unchanged,
because the helpers are generic (Section 13). Per condition and chain the harness does the following.

1. `make_worktree` branches an `evolve/<run_id>/<condition>/chain<n>` line from the untouched
   `base_ref` into `work_root`, carrying the production tree plus `.git` history plus capture
   staging. Every checkpoint commit lands here. The base branch is never written.
2. `mirror_source` rsyncs the worktree (excluding `.git`, build output and results) into a flat
   `sandbox_root` that is the agent's cwd, history-less, with no `.git` to `git log`, so the agent
   cannot infer the checkpoint sequence.
3. It installs the agent's test view into the sandbox's acceptance dest, blind, this checkpoint's own
   Playwright spec only, neutralised so nothing hints at a checkpoint number.
4. Landlock confines the agent and every child to the sandbox plus the toolchain. Withheld specs and
   everything else return `EACCES`. It fails closed.
5. After the turn it mirrors the sandbox back onto the worktree, propagating the agent's edits and
   deletions while preserving `.git` and the harness-managed specs, restores visible specs to
   authored, and commits the pure agent delta.

This isolation spine is identical to the REST arm.

### The whole-stack launcher, one start and stop, part of the evolving app

Because the oracle drives a real browser, the app must actually run. A single whole-stack `start`
brings the whole app up on one port, and `stop` tears it down. The launcher lives in the app repo and
evolves with it. It is not a constant layer.

- **Build then run.** The harness first builds this checkpoint's app (`correctness.build()`), a Maven
  build whose `frontend-maven-plugin` compiles the SPA into `static/`, then `spring-boot-maven-plugin`
  repackages the app into one runnable jar. Keeping build distinct from start cleanly separates a
  compile failure from a start failure.
- **`app.start_cmd`** receives PORT, boots the jar (Flyway migrates the in-memory H2 from empty up to
  this checkpoint's schema), and Spring serves the SPA and the REST routes on PORT. Schema comes up on
boot. Data does not: every spec arranges its own through the screens (Section 9).
- **`app.stop_cmd`** kills the JVM and frees PORT. The in-memory H2 dies with it, so it is a clean
  reset. It is idempotent, safe after a crash, and the harness may kill by port as a backstop.
- The harness owns only port choice and readiness polling (`app.health_url` plus a known `data-testid`
  anchor).

A gate run (`correctness.serve()`) is build, then `app.start` on PORT, then `wait_ready`, then run
Playwright against `http://localhost:$PORT`, every spec on a sheet id of its own, then `app.stop`.

### The concrete SUT, Spring Boot 4 hosts, OfficeFloor REST via the starter (chosen)

Chosen over WoOF-hosts-Spring, which is pinned to Spring Boot 3.x, so as to run Spring Boot 4.1.0.
Verified against the OfficeFloor tutorials (`SpringRestGettingStartedHttpServer`,
`SpringRestDataJpaHttpServer`) and the BOM (`net.officefloor:bom` at 4.0.2). One JVM, no daemon, no
container, resolving the Section 15 embedded constraint, rebuilt each checkpoint. Pinned in
`~/officehq-react-officefloor` (`pom.xml`, `src/main/**`). This is one example stack. The benchmark
runs against any stack that meets the SUT contract.

- **Spring Boot 4 is the host, and OfficeFloor REST is added via the starter**
  (`net.officefloor.springboot:officefloor-rest-spring-boot-4-starter` plus `spring-boot-starter-web`,
  parent `spring-boot-starter-parent` 4.1.0). A standard `@SpringBootApplication` main, and a normal
  `spring-boot-maven-plugin` repackage.
- **Domain REST is additive OfficeFloor YAML**, `officefloor/rest/<path>.<METHOD>.yml`
  (`service: { class: … }`) plus a logic class per endpoint. This preserves the additive-backend
  property under test even though Spring hosts (`shared_surfaces.backend` is `officefloor/**`).
- **H2 in-memory plus Flyway on boot**, Spring-managed (`spring.datasource` H2, `spring.flyway`,
  `ddl-auto=none`), from `src/main/resources/db/migration`, with the schema built up checkpoint by
  checkpoint (Section 5's "code plus migration"), starting empty.
- **The SPA is served from `src/main/resources/static`** via Spring's static handler, and the
  front-end builds there via `frontend-maven-plugin`. A deep-link fallback in `SpaConfig` sends an
  unknown non-`api/` path to `index.html`. There is no external `FRONTEND_DIST` seam, which only
  existed to keep a constant backend, which is gone.
- **No test-support endpoint.** Specs arrange their data through the screens (Section 9); the only
things the app provides for testing are the `data-testid` anchors and the audit file.
- **Readiness** is Spring Actuator's `/actuator/health` (`app.health_url`), plus a known `data-testid`
  anchor.

So `app.start` is essentially the following.

```sh
exec java -jar target/app.jar --server.port="$PORT" --spring.profiles.active=harness
```

Playwright, external TS specs, drives it at `http://localhost:$PORT`, binding only to `data-testid`,
the testing-boundary invariant below.

### The testing-boundary invariant, why the whole stack can evolve behind the UI

Playwright asserts through two declared contracts only, the UI (`data-testid`) for user-visible
behaviour, and the known audit file (Section 3) for audited side-effects. It arranges data through
the same screens (Section 9). It never asserts against the domain API, the database, arbitrary
logs, or internal state. Therefore the entire stack, schema,
server and front-end, may be rewritten freely as long as those two contracts hold. That is exactly
what is measured, whether the stack keeps the test contract intact while it grows the whole app under
English requests. See `docs/SUT_CONTRACT.md` for what the app repo must provide.

---

## 15. Running the tests during the agent turn (inside confinement)

The agent must be able to run its test as it works, the UI analog of `mvn test` in the REST arm. In
the REST arm that is cheap, because MockMvc boots the app in-process with no server. Here a Playwright
spec only passes against the whole running stack, so "let the agent run the test" means "let the
agent bring the whole stack up, on a port, from inside the Landlock sandbox, and drive a browser at
it." That has three consequences worth stating.

### One agent test command, running only the visible spec

The agent is given a single command, `acceptance.agent_test_cmd` (for example `./e2e`), pinned into
the app and documented in the pinned `CLAUDE.md`. It builds the app, brings it up via `app.start`,
runs the currently-visible spec or specs only, and tears down (`app.stop`). Blind holds by construction, because the agent can only run what it can see, its own
checkpoint's spec, never the withheld priors. The run frees the agent's port (`fuser -k`) before
and after every agent turn: the calibration run showed an agent's hand-started `bin/start` outliving
its turn, so the next agent's `./e2e` tested a stale app and watched every spec fail; `./e2e` itself
now refuses a port already served and waits out a slow start instead of running against nothing. This is exactly the REST arm's condition, the agent
iterating against its own test, moved to a served, full-stack app.

### Scoring is still the post-turn gate, not the agent's runs

The agent running its spec is for its own iteration only. Correctness and regression scoring is
unchanged. After the turn, the harness restores the pinned operational scaffolding, the `bin/start`
and `bin/stop` scripts, the `./e2e` command, and `CLAUDE.md` and `AGENTS.md`, and the visible specs to
authored, then runs the full cp01..cpK suite (`correctness.run_tests`). The application code the agent
wrote, the schema migrations, the server and the front-end, is the agent's delta and is kept. Only the fixed scaffolding and the specs are restored. So the agent
cannot influence the score by editing the launch or test scripts or its visible spec, the REST arm's
`detect_agent_tamper` discipline, extended to the scripts. The launch command stays constant across
checkpoints even though the app evolves, which is what lets it be pinned.

### The stack must be launchable inside Landlock, which constrains the SUT

Landlock is filesystem-only. It does not restrict loopback networking, so serving on `localhost` and
driving Playwright at it work under confinement. What it does mean is that every process the app
spawns is a Landlock child and can touch only the allowlist. Therefore the whole-stack app must be
in-process and embeddable, the Spring Boot jar with embedded H2 and a static-served SPA, not a Docker
or daemon-backed stack, because a daemon lives outside the confinement and a Docker socket cannot be
granted cleanly. Concretely the allowlist adds, read-only, the toolchain (node plus the Playwright
browser binaries, the JRE), and, writable under the sandbox, the build output, the Playwright cache,
tmp, and the npm or pnpm store (H2 is in-memory, so there is no DB data dir).
`landlock.default_allowlist` gains these binds (`isolation.extra_ro_binds` and `extra_rw_binds`). It
still fails closed. If the toolchain is not reachable or a withheld sentinel is readable, the turn is
refused.

This is the single biggest constraint the harness places on the SUT. The app has to run embedded, not
containerised, satisfied by the single Spring Boot app (Section 14), which is why the agent-test loop
stands.

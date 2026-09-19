# ui-long-degradation-test — Design Notes

_Captured 2026-09-19. Working design for a front-end erosion experiment: the UI arm of
the long-degradation study whose REST arm is `~/spring-petclinic-rest-long-degradation-test`.
This is a thinking document — it records decisions **and the reasoning behind them**,
including where the design changed as we worked through it, and the empirical checks that
settled open questions._

---

## 1. Purpose

Measure how well a **front-end architecture resists structural / cohesive erosion** across a
long sequence (~60) of AI-authored feature changes — the same question the REST harness asks
of server code, moved to the client.

Two fixed references shape the whole design:

- **The REST harness** (`~/spring-petclinic-rest-long-degradation-test`) — the established
  method: number a checkpoint list 1..N, hand a fresh agent one checkpoint at a time, gate
  and score each, and track erosion over the sequence. This harness is the **UI arm** of the
  same study and deliberately reuses its lifecycle, metric names, and blind design so the two
  are directly comparable in publishing ("REST arm vs UI arm").
- **OfficeHQ** (`~/OfficeHQ/DESIGN.md`) — the product this feeds. OfficeHQ needs a front-end
  that stays cohesive under open-ended AI change the way OfficeFloor does on the server. This
  harness is the test bed for that, and — see §7 — it is also a **fidelity model of the
  OfficeHQ production change loop**, not merely a benchmark.

The thesis under test is the front-end analog of what makes OfficeFloor resistant: a change
should be **additive and local**. The architecture that makes the additive path the path of
least resistance, and the reach-across path structurally hard or loud, is the one that
resists erosion.

---

## 2. What is held constant, what varies

- **Constant:** an **OfficeFloor server + a database** behind every arm, serving identical
  data through an identical contract. The backend never changes between arms or across
  checkpoints, so any measured erosion is attributable to the front-end alone.
- **Variable:** the **front-end** — the thing under test. Each candidate front-end
  architecture is one arm; the same ~60 changes run against each.

Because the server is constant, the client can (and should) treat it as the single source of
truth and generate its typed data layer from the server's contract — but that is a property
of the *candidate template*, not of the harness. The harness only requires that the backend
stays byte-identical across arms.

---

## 3. The implementation-agnostic seam: `data-test-id` as a declared contract

The REST harness is implementation-agnostic because its tests are black-box REST assertions
(URLs, JSON fields, status codes) — the API *is* the contract, so any implementation that
serves it passes the same tests. The UI needs an equivalent agnostic seam that does not leak
one framework's DOM structure into the pass/fail of another.

**Decision: tests bind to `data-test-id` attributes, and nothing else** — never CSS classes,
DOM structure, tag nesting, or visible copy. A test locates an element by its `data-test-id`,
performs the user action, and asserts on values read through other `data-test-id` anchors.
The same Playwright suite then validates any candidate front-end, because all it depends on
is the presence and behaviour of named anchors over identical backend data.

**Consequence — the anchors must be *provided* to the agent.** The agent cannot guess which
`data-test-id` values a hidden test expects. So each checkpoint's own test is handed to the
agent (see §4): the test declares the anchors the new feature must expose, and the agent's job
is to build a feature that exposes them and behaves correctly.

**The one genuinely new thing UI adds over REST.** A REST endpoint is *inherently* the
contract; a `data-test-id` is a **synthetic** contract layered on the DOM, so it must be
*declared stable*. One rule, constant across all arms, in the shared agent instructions:

> **Once introduced, a `data-test-id` is immutable public API. Never rename or remove it.**

With that rule, a prior anchor changing is unambiguously the architecture failing to localize
a change — signal, not agent whimsy. Without it, anchor drift is noise. The rule is what makes
`data-test-id` a fair agnostic seam.

---

## 4. Blind vs full — settled: **blind**

The question was whether the agent, at checkpoint K, should see only checkpoint K's test
(**blind**) or the whole cp1..cpK suite (**full**).

The REST harness already answered this and the reasoning transfers with more force, not less:

> With a full checklist of prior tests visible, regressions are ~0 by construction. Blind, the
> agent must preserve behaviour from memory/architecture — that's the whole point of measuring
> regression.

Full mode makes the headline metric (Zero-Regression Rate) trivially 1.0 and deletes the
signal. **Blind is chosen.**

### Why the `data-test-id` regression worry dissolves under blind

The initial worry: a `data-test-id` drifting slightly registers as a regression even though
the app still works — false positives that swamp the architecture signal.

It dissolves because **blind is only about prior *tests*, not prior *code*.** A fresh agent at
checkpoint K sees the current source tree — which already contains every prior feature and its
`data-test-id` anchors embedded in the components. It just does not see the prior *test files*.
Therefore:

- The agent *can* preserve prior anchors — they are in the code it is editing.
- Whether it *does* depends on whether adding feature K forces edits into the files where
  feature J's anchors live. That is exactly the locality / blast-radius property under test.

So an anchor regression is not a false positive — it is the front-end equivalent of a
blast-radius spill. A front-end with real structural resistance keeps feature K's work away
from feature J's files, and J's anchors survive untouched. Blind regression rate ∝ architecture
locality. That correlation *is* the experiment.

### Optional ceiling control

Run **full** once as a reference arm — not for the real result, but to put on record how much
regression the safety net hides (it will be ~0). It makes the blind numbers legible to readers
and quantifies how much the architecture matters when the net is handed over.

---

## 5. Checkpoint lifecycle (adapted from the REST harness for UI)

Mirrors the REST harness's two-commit-per-checkpoint boundary, with the correctness oracle
changed from in-process MockMvc to a live, served SUT driven by Playwright.

For each checkpoint `k` (1→N):

0. **Blind agent view.** Install only this checkpoint's own test (`cpNN` Playwright spec) plus
   shared test infra. The agent never sees prior tests. The current source tree (with all
   prior features and their anchors) is present as normal.
1. **Agent turn.** A **fresh** headless `claude -p` with only this checkpoint's request and the
   current code. No cross-checkpoint memory. Cost / tokens / duration captured.
2. **Build + serve the SUT.** Build the arm to a servable dist, then bring the whole system up on
   one port via the **single whole-stack launcher** and drive it with Playwright
   (`correctness.serve()`, §14): `sut.start` seeds a fresh deterministic database, starts the
   constant OfficeFloor server, and serves the built front-end + API on **PORT**; `wait_ready`;
   run the specs; `sut.stop`. (This stage does not exist in the REST arm and is the main new
   moving part — see §9, §14.)
3. **Gate + score.** Run the **full resolved cp01..cpK Playwright suite** against the running
   SUT (never shown to the agent — gate, not context). Classify results (§6). Then run the code
   metrics (§8) over the checkpoint's source.
4. **Reset commit.** Normalize + set the agent view for the next checkpoint (its own test only),
   so cp(K+1) starts blind and the agent commit stays pure. Kept even if empty, so every
   checkpoint is a clean two-commit boundary.
5. **Capture.** Per-checkpoint raw capture (request + rendered prompt, agent event stream,
   build/test console, test outcomes, commit SHAs) committed with the reset, so each checkpoint
   commit is self-contained and the run reconstructs from git alone.

Deterministic seed data and strict awaiting on `data-test-id` presence are load-bearing here
(§9) — without them, UI flake manufactures regressions that have nothing to do with erosion.

---

## 6. Regression classification

Carry over the REST harness's `regressions` vs `true_regressions` split and its `mutates`
discipline, and add a UI-specific reason code so the *shape* of erosion is visible.

At checkpoint K, each prior-checkpoint test failure is classified:

- **anchor-drift** — the element is present and functional, but its `data-test-id` changed or
  was removed. A contract regression. **Counts** — it is the locality signal.
- **behaviour-loss** — the feature genuinely broke (element gone, wrong value, action fails).
  Classic regression. **Counts.**
- **intended** — checkpoint K legitimately changes prior behaviour and ships a replacement
  `cpJ` spec (the `mutates` discipline). **Excluded** from `true_regressions`.

`regressions` = any prior test failing at K (raw). `true_regressions` = regressions minus
intended mutations. Both anchor-drift and behaviour-loss count as regressions; logging the
reason tells you *how* each front-end erodes — a richer result than the REST arm can produce.

Metric names stay aligned with the REST arm (EvoScore, Zero-Regression Rate, Normalized
Change / SWE-CI) so the two studies read as one.

---

## 7. Tests-as-living-spec (and why this harness models the OfficeHQ product loop)

Functionality is tracked as **tests, not accumulating prose specs**. Users change their minds;
a growing spec corpus goes stale, self-contradicts, and costs tokens to re-read. The
accumulated test suite *is* the current specification of behaviour; a change of mind is a
changed/replaced test (`mutates`), not a spec reconciliation.

This composes with §4 into one coherent loop:

**blind authoring + full-suite gate + tests-as-spec**

- **tests-as-spec** — the suite is the current spec; no prose corpus to rot.
- **blind authoring** — the AI gets only the new/changed test (the delta) plus the code; it
  never reads the historical suite.
- **full-suite gate** — the whole cp1..cpK suite runs *after* the turn as the regression gate;
  it never enters the AI's context.

The last split matters for OfficeHQ economics specifically (`~/OfficeHQ/DESIGN.md` §2): the
full suite grows unbounded over a site's life, but because it is a *gate, not context*, the
AI's token cost per change stays flat regardless of history. Stale-spec contradiction and token
blowup are the same problem, and blind authoring solves both at once — which is part of what
keeps OfficeHQ's marginal cost per change ~zero and the flat fee viable.

So this harness is a **fidelity model of the OfficeHQ production change loop**, not just a
benchmark: what blind measures here is what the product will actually do to a customer's app.

---

## 8. Metrics & measurement

### ImpactGate / Lizard — confirmed native for the mainstream arms

ImpactGate scores blast radius from Lizard's per-function CC / NLOC. Checked empirically
against the local install (`~/ImpactGate/.venv`):

- Lizard's registered readers include `TypeScriptReader`, `TSXReader`, and `VueReader`.
- Parsing samples returned real functions with complexity for `.ts`, `.tsx`, `.jsx`, plus the
  `<script>` block of `.svelte` and embedded `<script>` in `.html`:

  ```
  a.ts     -> 2 fns: [('f',2,1),('g',1,1)]
  a.tsx    -> 2 fns: [('C',2,1),('h',2,1)]     # JSX handled, component named
  a.jsx    -> 2 fns: [('(anonymous)',2,1),('C',1,1)]
  a.svelte -> 1 fn:  [('inc',2,1)]             # only the <script> function
  a.html   -> 1 fn:  [('q',2,1)]               # only the embedded <script>
  ```

So React/TS and Vue score out of the box — **no port needed.** But two subtleties matter more
than language support:

1. **Metric visibility is format-dependent — a cross-arm confound.**
   - `.tsx`, `.ts`, `.vue` → full fidelity (branching in JSX and script counted, components
     named).
   - `.svelte` → **no dedicated reader**; only the `<script>` function is seen, template and
     reactive (`$:`) logic is invisible. This would *flatter* Svelte's erosion score — exclude
     it or add a reader before trusting its numbers.
   - `.html` / HTMX → only embedded `<script>` is seen; `hx-*` attribute logic is invisible.
     Here the under-count is *honest* — that logic genuinely moved to the constant OfficeFloor
     server, which is not scored. Name it as a finding: the server-driven arm looks near-zero
     erosion partly because there is little client code left to erode, not because it magically
     resists — do not let it read as a clean win.

2. **ImpactGate's cohesion container becomes the *file*, not the class.** The plugin qualifies
   units as `Class::method` and falls back to file scope for free functions. Components and
   hooks are free functions, so every unit collapses to file-scope containers. Consequences:
   the `Σ max(WMC_other,1)` term becomes "sum over other files," not "other classes"; the
   formula is internally consistent but the unit changed. **Do not compare absolute impact
   numbers to the Java REST run** (apples-to-oranges on the WMC term). Within this experiment
   (arm vs arm) it is fair *as long as arms sit at comparable file granularity* — another reason
   to hold every arm to one shared opinionated shell.

### Boundary-violation count — a format-neutral co-metric

Count how often the agent is *forced* to touch a shared/central file (router, global store, a
shared primitive) per checkpoint. It measures the additive property directly, needs no Lizard
visibility, and stays honest for Svelte and HTMX where Lizard's view is partial. Run it
alongside ImpactGate, not as a fallback.

### Normalization

Normalize erosion **per unit of delivered behaviour**, not per change — a more capable
framework lets the agent do more per change (bigger Δlines), which is not erosion. Use passing
behaviour-test count / coverage as the denominator.

### Longitudinal hygiene

Prefer **`.tsx` over `.jsx`, TS over JS**: the JSX-under-JS reader emitted `(anonymous)` for
the arrow in `.map`, and anonymous units are hard to track across 60 commits (a unit's drift is
lost when it re-anonymizes). Stable unit identity matters for a trajectory study.

Hold the agent, prompts, and gates **identical** across arms so only the front-end architecture
varies.

---

## 9. UI-only moving parts / risks (absent from the REST arm)

1. **The oracle needs the SUT actually running.** MockMvc boots in-process; here the loop must
   build the front-end, start the OfficeFloor server + seeded DB, serve the built front-end, and
   wait for reachability every checkpoint. This is the main new source of harness fragility
   (build stage §5.2).
2. **Flake is a false-regression source that erosion is not.** Async UI + non-deterministic
   data manufacture regressions unrelated to architecture. Mitigate with deterministic synthetic
   seed data reset per checkpoint and strict awaiting on `data-test-id` presence, or flake
   contaminates the published metric.

---

## 10. Candidate front-ends (arms)

Three points on the server-driven ↔ client-owned spectrum, plus a control. All arms start from
one shared opinionated shell so the file-scope container comparison (§8) is fair.

- **Control:** component SPA + global store (Redux/Zustand) + client router — the mainstream
  default and the expected slop magnet.
- **Additive template (the hypothesis):** file/manifest routing + no global domain store
  (server is source of truth) + closed shared primitives + enforced feature-slice boundaries +
  scoped styles. React/TS or Vue (Lizard-native, §8).
- **Server-driven:** OfficeFloor templates + HTMX fragments — thinnest client; measured mostly
  by boundary violations, with the §8.1 caveat about honest under-counting.

The five closures the additive template pre-wires (the front-end analog of OfficeFloor's
additive sections) are carried in `~/OfficeHQ/DESIGN.md`'s front-end discussion:
additive routing · no global store · closed primitives · enforced slice boundaries · scoped
styles.

---

## 11. Naming

`ui-long-degradation-test`, parallel to `spring-petclinic-rest-long-degradation-test` — this is
the **UI arm** to that repo's **REST arm**. "long-degradation" keeps the point (long sequence,
structural decay); the app/framework specificity is dropped because the front-end is the
variable.

---

## 12. Open decisions / next steps

- **Backend SUT:** which OfficeFloor app + schema is the constant. Reuse the petclinic domain
  for continuity with the REST arm, or a fresh domain chosen to stress UI erosion vectors
  (tables/forms/nav growth, shared-component reuse pressure)?
- **Checkpoint list:** author ~60 changes as **user-facing intents** (framework-agnostic), and
  deliberately load them with reuse-pressure (same table reused with growing needs, cross-feature
  data on one screen, nav growth, variant explosion) — if the sequence never pressures shared
  surfaces, nothing erodes and the experiment proves nothing.
- **Shell:** one shared opinionated shell for all arms (fair test of *changes*) vs each
  framework's idiomatic default (fair test of *frameworks*). Leaning shared-shell to match the
  REST setup and keep §8's container comparison fair.
- **Svelte arm:** exclude, or add a Lizard reader / count template logic separately (§8.1).
- **ImpactGate wiring:** confirm the file-scope container semantics are acceptable as the erosion
  metric, or lead with boundary-violation count and treat ImpactGate as corroboration.
- **Harness reuse:** how much of the REST harness's `harness/` (agent loop, capture, analyze,
  landlock, impact scoring) is lifted directly vs adapted for the build-and-serve oracle.
  Resolved — see §13.

---

## 13. Repository & code-sharing strategy

**Decision: separate repo, shared-by-copy now, extract a shared core only at N=3.** Not the
same codebase as the REST arm, and not a shared library yet. Reasoning: the REST repo is a
publication artifact mid-flight (`blog/`, baselines, its own Spring-vs-OfficeFloor thesis, the
"each run reconstructs from its own commits" self-containment) — bolting a second, differently
-shaped experiment into it, or refactoring it now to extract interfaces, churns the thing being
published for low reward. And abstracting a shared core from one example builds the wrong seam;
we are at N=1.5 (REST done, UI starting). Copy now, extract when a stable second instance exists
to factor *from*.

The REST harness's modules split cleanly by reusability:

| Module | Nature | Action here |
|---|---|---|
| `agent.py` | generic (headless `claude -p`, config isolation) | **vendored verbatim** |
| `landlock.py` | generic + security-critical (makes blind airtight) | **vendored verbatim** |
| `capture.py` | generic capture-not-derive | **vendored**, adjust tool list / result shape |
| `analyze.py` stats | generic (slopes, bootstrap CIs, EvoScore, ZRR, plots) | **lift the stats verbatim** |
| `correctness.py` | REST/Java (MockMvc, Surefire) | **rewrite** → build+serve+Playwright |
| `metrics.py` | Java (Erosion over Java, ast-grep-java, jscpd) | **rewrite** → Lizard/TS + boundary count |
| `class_shape.py` | Spring vocabulary | **drop** (JS analog much later, if ever) |
| `quality_gate.py` | Java rules | **drop initially** (only the `impact_gated` arm needs it) |
| `impact_gate.py` | wrapper generic, seed Java | **vendor wrapper**, needs a TS seed distribution |

Vendored files carry a provenance header naming the source repo + SHA + date, so upstream fixes
can be diffed in and a future extraction is mechanical.

**The cheap insurance:** even where the *bodies* differ, keep the seam **function signatures
identical** across the two repos — a `gate(built_tree) -> {results, pass/fail}` (correctness) and
a `compute_all(...) -> row` (metrics). Both harnesses already have these two natural seams; they
are just not behind an ABC. Matching the signatures now makes the eventual `long-degradation-core`
extraction a lift, not a re-plumb.

---

## 14. System under test: external code, copy/sync isolation, and lifecycle

### The code lives in an external folder, one per arm

Each candidate front-end is its **own external code folder** (`arms.<name>.repo` at a
`base_ref`), exactly as the REST arm points each arm at `${HOME}/compare/<framework>`. The
harness never edits that folder in place — it is only ever **read** as a start point. This keeps
`~/ui-long-degradation-test` (the harness) cleanly separate from the systems it measures.

### Copy/sync + Landlock — reused verbatim from the REST arm

The mechanism that makes the blind view airtight and lets the harness copy the right specs in is
lifted unchanged (the helpers are generic; §13). Per (arm, chain) the harness:

1. `make_worktree` — branches an `evolve/<run_id>/<strategy>/<arm>/chain<n>` line from the
   **untouched** `base_ref` into `work_root`: the production tree + `.git` history + capture
   staging. Every checkpoint commit lands here; the base branch is never written.
2. `mirror_source` — rsyncs the worktree (excluding `.git`, build output, results) into a **flat
   `sandbox_root` that IS the agent's cwd** — history-less, with no `run_id`/arm/chain in the path
   and no `.git` to `git log`, so the agent cannot infer the checkpoint sequence.
3. installs the agent's **test view** into the sandbox's acceptance dest — blind: this
   checkpoint's own Playwright spec only, neutralised so nothing hints at a checkpoint number.
4. **Landlock** confines the agent (and every child) to sandbox + toolchain; withheld specs and
   everything else return `EACCES`. Fails closed.
5. after the turn: mirror the sandbox back onto the worktree (propagating the agent's edits and
   deletions while preserving `.git` and the harness-managed specs), restore visible specs to
   authored, commit the **pure agent delta**.

Only the gate/oracle is rewritten; this isolation spine is identical to the REST arm.

### The whole-stack launcher — one start/stop for the entire SUT (new for UI)

Because the oracle drives a real browser, the SUT must actually run. Rather than orchestrate a
backend and a front-end separately, **a single whole-stack `start` script brings up everything on
one port**, and a matching `stop` tears it all down. This launcher is the **constant layer**: the
script and the OfficeFloor image are byte-identical across every arm and checkpoint (§2); only the
front-end dist it is pointed at varies. It lives in its own folder (`sut.repo`), not in an arm.

- **Build is a separate, per-arm step.** The harness first runs the arm's `build_cmd` against the
  worktree, producing a servable `dist_dir` (`correctness.build()`). Keeping build distinct from
  start mirrors the REST arm (build then run) and cleanly separates a compile failure from a
  stack-start failure.
- **`sut.start_cmd`** receives `PORT` and `FRONTEND_DIST` (the arm's built dist) and, in one shot:
  seeds a fresh **deterministic database**, starts the constant OfficeFloor server, and serves
  that dist + the API on `PORT`. A deterministic seed on every start **is** the per-checkpoint
  reset (§9) — there is no separate seed step and the front-end never seeds data.
- **`sut.stop_cmd`** tears the whole stack down and frees `PORT`; **idempotent** (safe after a
  crash or a stale run; the harness may kill by port as a backstop).
- The **harness owns** only port choice and readiness polling (`sut.health_url` + a known
  `data-test-id` anchor).

A gate run (`correctness.serve()`): build the arm → `sut.start` with `PORT` + `FRONTEND_DIST` →
`wait_ready` → run Playwright against `http://localhost:$PORT` → `sut.stop`. One launcher, one
port, whole stack.

### The testing-boundary invariant — why the system can evolve behind the UI

Playwright talks to the **served front-end and nothing else**: it binds only to `data-test-id`
and asserts only on values read back **through the UI**. It never asserts against the API, the
database, logs, or internal state. Therefore any implementation — the front-end's, and even the
constant backend's — may be rewritten freely as long as the user-visible behaviour holds. That
freedom is precisely what is being measured: how well the front-end keeps the UI contract intact
while the code churns underneath it. See `docs/SUT_CONTRACT.md` for what an app folder must
provide.

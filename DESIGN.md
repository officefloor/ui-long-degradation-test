# ui-long-degradation-test — Design Notes

_Captured 2026-09-19. Working design for a **full-stack erosion experiment that replicates the
OfficeHQ change loop**: one application, grown from a near-empty base by ~60 plain-English change
requests, each evolving schema + OfficeFloor server + front-end + its acceptance test together.
This is a thinking document — it records decisions **and the reasoning behind them**, including
where the design changed as we worked through it (it began as a front-end-only comparison against
a constant backend; §2 records why that was dropped), and the empirical checks that settled open
questions._

---

## 1. Purpose

Show whether the **OfficeHQ approach can evolve a whole application under constant English change
requests without eroding** — flat structural erosion and low regressions across a long sequence
(~60) of AI-authored, full-stack changes. This is not a front-end beauty contest; it is a
**fidelity model of the OfficeHQ production change loop** (`~/OfficeHQ/DESIGN.md` §3): a plain-
English request becomes a commit that changes the schema, the OfficeFloor server, and the front-
end together, is gated (compile · tests · ImpactGate · security), and either holds or erodes.

The harness starts where OfficeHQ starts a new customer app: a **base** — a base front-end shell,
Spring with the OfficeFloor plugin, and an **empty database (no tables)** — and evolves it from
there, one English request at a time. What is measured is whether erosion stays flat as the app
is *built from scratch* by prompts.

Two references shape the design:

- **The REST harness** (`~/spring-petclinic-rest-long-degradation-test`) — the established
  method (number a checkpoint list 1..N, hand a fresh agent one at a time, gate and score each,
  track erosion over the sequence) and the source of the reusable spine, metric names, and the
  blind design. It measured *server* erosion on an existing app; this harness measures
  *whole-stack* erosion while *growing* an app. Metric names are kept aligned so the two read as
  one body of work.
- **OfficeHQ** (`~/OfficeHQ/DESIGN.md`) — the product this validates. The harness *is* the
  OfficeHQ loop, run against a deterministic checkpoint sequence so it can be scored.

The thesis under test is OfficeFloor's own, extended to the whole stack: a change should be
**additive and local**. The architecture (OfficeFloor's additive composition on the server; the
opinionated additive front-end shell on the client) that makes the additive path the path of
least resistance, and the reach-across path structurally hard or loud, is the one that survives
60 English requests.

---

## 2. The base, and what evolves (nothing is held constant)

This design began as "hold an OfficeFloor backend constant and vary only the front-end." That was
dropped: it does not model OfficeHQ, where a user's English request evolves the **whole stack**.
So there is **no constant layer** — every checkpoint may change all of:

- **the database schema** — new tables/columns via migrations (the app starts with **no tables**);
- **the OfficeFloor server** — new procedures/sections/endpoints;
- **the front-end** — new pages/components/state;
- **the acceptance test** — this checkpoint's own spec (§7).

Within a single run the **whole stack is fixed** — it is one base repo (one technology stack). The
study compares **technology stacks across runs**: each candidate stack is its own base repo (a
home-level sibling `~/officehq-<frontend>-<backend>`), and the harness is run against each in turn
to see which stack best resists erosion under the same evolution (§10). Both the front-end **and**
the backend may vary between stacks. Within a run there are no in-run arms;
the only optional in-run dimension is the **intervention condition** (§10) — the full OfficeHQ
gated loop vs an ungated control — to quantify what the gates buy.

Because everything churns, the **one thing that stays stable is the test contract** (`data-test-
id` + UI-only assertions, §3). That is what makes a fully-evolving stack measurable at all, and
it is the same reason OfficeHQ tracks functionality as tests, not specs (§7).

---

## 3. The implementation-agnostic seam: `data-test-id` as a declared contract

The REST harness is implementation-agnostic because its tests are black-box REST assertions
(URLs, JSON fields, status codes) — the API *is* the contract. Here the whole stack (schema,
server, front-end) is rewritten as the app evolves, so the tests need a seam that stays stable
through all of that churn and never couples to any one implementation's internals.

**Decision: tests bind to `data-test-id` attributes, and nothing else** — never CSS classes,
DOM structure, tag nesting, or visible copy. A test locates an element by its `data-test-id`,
performs the user action, and asserts on values read through other `data-test-id` anchors.
The same Playwright suite validates the app however the stack beneath is implemented, because
all it depends on is the presence and behaviour of named anchors over the data the spec itself
seeds (§9) — not on any schema, API, or DOM detail.

**Consequence — the anchors must be *provided* to the agent.** The agent cannot guess which
`data-test-id` values a hidden test expects. So each checkpoint's own test is handed to the
agent (see §4): the test declares the anchors the new feature must expose, and the agent's job
is to build a feature that exposes them and behaves correctly.

**The one genuinely new thing UI adds over REST.** A REST endpoint is *inherently* the
contract; a `data-test-id` is a **synthetic** contract layered on the DOM, so it must be
*declared stable*. One rule, constant across the run, in the shared agent instructions:

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

Run **full** once as a reference run — not for the real result, but to put on record how much
regression the safety net hides (it will be ~0). It makes the blind numbers legible to readers
and quantifies how much the architecture matters when the net is handed over.

---

## 5. Checkpoint lifecycle (the OfficeHQ loop, made deterministic)

Mirrors the REST harness's two-commit-per-checkpoint boundary, but each turn is a **full-stack**
change and the oracle is a live, served app driven by Playwright. The app grows from the empty
base (§2): at cp01 there are no tables; each checkpoint may add a migration, server code, and UI.

For each checkpoint `k` (1→N):

0. **Blind agent view.** Install only this checkpoint's own test (`cpNN` Playwright spec) plus
   shared test infra. The agent never sees prior tests. The current source tree (all prior
   schema/server/front-end and its anchors) is present as normal.
1. **Agent turn.** A **fresh** headless `claude -p` given this checkpoint's **plain-English change
   request** (as an OfficeHQ user would write it) plus this checkpoint's own spec (so it knows the
   `data-test-id` anchors and values to satisfy), and the current code. No cross-checkpoint
   memory. It authors the full-stack change — **migration + OfficeFloor server + front-end** — and
   may run its own test as it works (§15). Cost / tokens / duration captured.
2. **Build + serve the app.** Build this checkpoint's app into one runnable jar (evolved
   OfficeFloor + migrations + the SPA built into `PUBLIC/`), then bring it up on one port and drive
   it with Playwright (`correctness.serve()`, §14): `app.start` boots the jar (Flyway migrates the
   **in-memory H2** up to this checkpoint's schema — starting from empty) and serves the SPA + API
   on **PORT**; `wait_ready`; run the specs; `app.stop`. Data is seeded per-spec via the app's
   `/__test__` endpoint (§9). (This stage does not exist in the REST arm and is the main new
   moving part — see §9, §14.)
3. **Gate + score.** Run the **full resolved cp01..cpK Playwright suite** against the running app
   (never shown to the agent — gate, not context). Classify results (§6). Then run the code
   metrics (§8) over the checkpoint's source — front-end **and** backend.
4. **Reset commit.** Normalize + set the agent view for the next checkpoint (its own test only),
   so cp(K+1) starts blind and the agent commit stays pure. Kept even if empty, so every
   checkpoint is a clean two-commit boundary.
5. **Capture.** Per-checkpoint raw capture (English request + rendered prompt, agent event stream,
   build/test console, test outcomes, commit SHAs) committed with the reset, so each checkpoint
   commit is self-contained and the run reconstructs from git alone.

Deterministic per-spec seeding and strict awaiting on `data-test-id` presence are load-bearing
here (§9) — without them, UI flake manufactures regressions that have nothing to do with erosion.

---

## 6. Regression classification

Carry over the REST harness's `regressions` vs `true_regressions` split and its `mutates`
discipline, and add a UI-specific reason code so the *shape* of erosion is visible.

At checkpoint K, each prior-checkpoint test failure is classified:

- **anchor-drift** — the element is present and functional, but its `data-test-id` changed or
  was removed. A contract regression. **Counts** — it is the locality signal.
- **behaviour-loss** — the feature genuinely broke (element gone, wrong value, action fails).
  Classic regression. **Counts.**
- **seed-path** — the prior spec's `beforeEach` seed call (§9) failed because checkpoint K
  changed the API/schema it relied on. **Counts** unless the change is declared `intended` (a
  checkpoint that deliberately alters an API a prior seed used ships the updated prior spec, the
  `mutates` discipline). This reason exists only because the backend evolves (§2); it isolates
  "a full-stack change broke a prior feature's data setup" from UI erosion so the two don't blur.
- **intended** — checkpoint K legitimately changes prior behaviour and ships a replacement
  `cpJ` spec (the `mutates` discipline). **Excluded** from `true_regressions`.

`regressions` = any prior test failing at K (raw). `true_regressions` = regressions minus
intended mutations. anchor-drift, behaviour-loss and (undeclared) seed-path all count as
regressions; logging the reason tells you *how* the app erodes — front-end, backend, or data
setup — a richer result than the REST arm can produce.

Metric names stay aligned with the REST arm (EvoScore, Zero-Regression Rate, Normalized
Change / SWE-CI) so the two studies read as one.

---

## 7. Tests-as-living-spec (and why this harness models the OfficeHQ product loop)

Functionality for the **whole app** — schema, server, and UI — is tracked as **tests, not
accumulating prose specs**. Users change their minds; a growing spec corpus goes stale,
self-contradicts, and costs tokens to re-read. The accumulated test suite *is* the current
specification of behaviour; a change of mind is a changed/replaced test (`mutates`), not a spec
reconciliation. The English request is the *prompt*; the test is the *spec*. Because the tests
assert only through the UI (§3), the entire stack beneath them can be regenerated freely — which
is exactly why the tests, not the code, are OfficeHQ's system of record.

This composes with §4 into one coherent loop:

**blind authoring + full-suite gate + tests-as-spec**

- **tests-as-spec** — the suite is the current spec; no prose corpus to rot.
- **blind authoring** — the AI gets only this checkpoint's request + its own test (the delta)
  plus the code; it never reads the historical suite.
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

Erosion is measured across the **whole stack**: the front-end (TypeScript) **and** the OfficeFloor
backend (Java) — the latter to confirm OfficeFloor stays flat even when grown greenfield, not just
when extended on an existing app (the REST arm's finding). Both use the same Lizard/ImpactGate
pipeline and the same thresholds.

### ImpactGate / Lizard — confirmed native (front-end TS and backend Java)

ImpactGate scores blast radius from Lizard's per-function CC / NLOC. Backend Java is what the REST
arm already scores. For the front-end, checked empirically against the local install
(`~/ImpactGate/.venv`):

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

1. **Front-end metric visibility is format-dependent — so the shell's format matters.**
   Pick the opinionated base shell's format for full Lizard fidelity: `.tsx`, `.ts`, `.vue` are
   read fully (branching in JSX and script counted, components named). `.svelte` has **no
   dedicated reader** (only the `<script>` function is seen; template and reactive `$:` logic is
   invisible), and `.html`/HTMX exposes only embedded `<script>` (attribute logic invisible) — a
   shell in either would under-count its own front-end erosion, so the base shell should be a
   full-fidelity format. Backend Java is full-fidelity regardless.

2. **Front-end cohesion container is the *file*, not the class.** The plugin qualifies units as
   `Class::method` and falls back to file scope for free functions. Front-end components and hooks
   are free functions, so every front-end unit collapses to file-scope containers; the
   `Σ max(WMC_other,1)` term becomes "sum over other files," not "other classes." The formula is
   internally consistent but the unit differs between the layers, so **track front-end and backend
   erosion as separate series** and do not compare their absolute numbers to each other or to the
   Java REST run. Backend Java keeps true `Class::method` containers, directly comparable to the
   REST arm.

### Boundary-violation count — a format-neutral co-metric

Count how often the agent is *forced* to touch a shared/central file per checkpoint — on the
front-end (router/manifest, global store, a shared primitive) **and** the backend (a shared
config/wiring file). It measures the additive property directly on both layers, needs no Lizard
visibility, and stays honest wherever Lizard's view is partial. Run it alongside ImpactGate, not
as a fallback.

### Normalization

Normalize erosion **per unit of delivered behaviour**, not per change — a more capable
framework lets the agent do more per change (bigger Δlines), which is not erosion. Use passing
behaviour-test count / coverage as the denominator.

### Longitudinal hygiene

Prefer **`.tsx` over `.jsx`, TS over JS**: the JSX-under-JS reader emitted `(anonymous)` for
the arrow in `.map`, and anonymous units are hard to track across 60 commits (a unit's drift is
lost when it re-anonymizes). Stable unit identity matters for a trajectory study.

Hold the agent, base shell, and gates **identical** across a run so the only variable is the
sequence of English requests (and, if the intervention study is run, the gating condition — §10).

---

## 9. Moving parts / risks (absent from the REST arm)

1. **The oracle needs the app actually running.** MockMvc boots in-process; here the loop must
   build this checkpoint's backend jar + front-end dist, boot the app (Flyway migrating the
   in-memory H2 from empty up to the checkpoint's schema), serve it, and wait for reachability
   every checkpoint. This is the main new source of harness fragility (build/serve stage §5.2).
2. **Data seeding is per-spec, via the app's own API.** Because the schema evolves (§2), boot-time
   fixtures would have to evolve too; instead each spec seeds the data it needs in `beforeEach`
   through a **dedicated, profile-guarded test-support endpoint** (`POST /__test__/reset` +
   `POST /__test__/seed`), so the spec stays self-contained with the schema at its checkpoint. A
   reset before each spec gives inter-spec isolation without JVM restarts (the agent's `./e2e`
   loop, §15, benefits too). Schema is Flyway-on-boot; **data is per-spec** — keep the two
   separate. The seed API is a versioned contract; a change that breaks a prior seed is a
   **seed-path** regression unless declared `intended` (§6).
3. **Flake is a false-regression source that erosion is not.** Async UI + non-deterministic data
   manufacture regressions unrelated to erosion. Mitigate with the deterministic per-spec
   reset+seed above and strict awaiting on `data-test-id` presence, or flake contaminates the
   published metric.

---

## 10. What is run (per-stack runs + optional intervention study)

The comparison is **across technology stacks**, one per **base repo** (a home-level sibling
`~/officehq-<frontend>-<backend>`, e.g. `~/officehq-react-officefloor`; §14, `docs/SUT_CONTRACT.md`,
`BASE_CHECKLIST.md`). Each base repo is a whole stack — a front-end framework **and** a backend
(both may vary between stacks; e.g. a different front-end, or a different server behind it) — built
for erosion resistance the way OfficeFloor is on the server: additive file/manifest routing · no
global domain store · closed shared primitives · enforced feature-slice boundaries · scoped styles
(see `~/OfficeHQ/DESIGN.md`). The harness runs the **same** ~60 English requests against each base
repo (via `config.yaml → app.repo`) and compares their erosion trajectories — **which stack works
best**. Pick front-end formats Lizard reads fully (`.tsx`/`.vue`, §8) so a stack's own erosion is
visible.

- **Primary run — the real OfficeHQ configuration.** The full gated loop (compile · tests ·
  ImpactGate · security) over the ~60 English requests, replicated across `chains` for CIs. The
  result is the erosion trajectory (front-end and backend) and the Zero-Regression Rate as the app
  is grown from the empty base. This alone answers "can OfficeHQ evolve an app without eroding?"
- **Optional intervention study — to quantify what the gates buy.** Reuse the REST harness's
  conditions as prompt/gate strategies (not front-end arms): `just-solve` (ungated control) vs
  `impact_gated` (the OfficeHQ gate). The delta shows the gate's effect on full-stack erosion —
  the direct sequel to the REST arm's "ImpactGate reduces server erosion" result.

The `arm` slot in the harness config therefore names the **intervention condition**, not a
framework. A single-condition run (primary only) is the minimum; the study is the upsell.

---

## 11. Naming

`ui-long-degradation-test`, parallel to `spring-petclinic-rest-long-degradation-test`. The REST
repo is the *server* long-degradation test on an existing app; this is the *whole-stack* one that
*grows* an app the OfficeHQ way. "long-degradation" keeps the point (long sequence, structural
decay); "ui" marks that the tests — the stable contract across the churn — drive through the UI.

---

## 12. Open decisions / next steps

- **The base (`base_ref`):** build the starting point — base front-end shell + Spring with the
  OfficeFloor plugin + Flyway configured against empty in-memory H2 (no tables) + the whole-stack
  `bin/start`/`bin/stop` + the `/__test__` seed/reset endpoint (§9). This is THE repo the run
  evolves; get it right first.
- **What app to build:** the ~60 English requests should grow one coherent app. Reuse the
  petclinic *domain* for continuity with the REST arm, or a fresh domain chosen to stress erosion
  vectors (tables/forms/nav growth, shared-component reuse pressure, cross-feature screens). Each
  request must be satisfiable as a full-stack change (schema + server + UI) — an app built from
  nothing, so early checkpoints create the first tables.
- **Checkpoint authoring:** each checkpoint = an English request (to the AI) + an experimenter-
  authored `cpNN` spec (the objective gate, with the `data-test-id` contract). Load the sequence
  with reuse-pressure or nothing erodes and the experiment proves nothing.
- **Embedded, not containerised (§15): RESOLVED — a single Spring Boot app** (OfficeFloor plugin +
  in-memory H2 + static SPA), one JVM, no daemon; rebuilt per checkpoint but always embeddable
  under Landlock, so the agent-test loop stands. See §14.
- **Run the intervention study? (§10)** primary gated run only, or also an ungated `just-solve`
  control to quantify what ImpactGate buys on full-stack erosion.
- **ImpactGate wiring:** confirm file-scope containers are acceptable for the front-end series
  (backend stays class-scoped); track the two layers separately (§8). A TS seed distribution is
  needed before front-end grades mean anything (`harness/impact_gate.py`).
- **Harness reuse:** resolved — see §13.

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

## 14. System under test: one evolving app, copy/sync isolation, and lifecycle

### The code is one external folder — the evolving app

There is a single external code folder per run (`app.repo` at `base_ref`) — the OfficeHQ-managed
application: the base front-end shell **and** Spring-with-OfficeFloor **and** Flyway **and** the
whole-stack `bin/start`/`bin/stop` **and** the `/__test__` seed endpoint, all in one repo that
**evolves together** over the run. (There is no separate constant `sut.repo` anymore — nothing is
constant, §2.) Each base repo is a **technology stack**, a home-level sibling named
`~/officehq-<frontend>-<backend>` (e.g. `~/officehq-react-officefloor`); swap stacks by pointing
`app.repo` at another and running again (§10). The harness never edits `base_ref` in place; it is
only ever **read** as the
start point, keeping `~/ui-long-degradation-test` (the harness) separate from the app it grows.

### Copy/sync + Landlock — reused verbatim from the REST arm

The mechanism that makes the blind view airtight and copies the right specs in is lifted unchanged
(the helpers are generic; §13). Per (condition, chain) the harness:

1. `make_worktree` — branches an `evolve/<run_id>/<condition>/chain<n>` line from the **untouched**
   `base_ref` into `work_root`: the production tree + `.git` history + capture staging. Every
   checkpoint commit lands here; the base branch is never written.
2. `mirror_source` — rsyncs the worktree (excluding `.git`, build output, results) into a **flat
   `sandbox_root` that IS the agent's cwd** — history-less, no `.git` to `git log`, so the agent
   cannot infer the checkpoint sequence.
3. installs the agent's **test view** into the sandbox's acceptance dest — blind: this checkpoint's
   own Playwright spec only, neutralised so nothing hints at a checkpoint number.
4. **Landlock** confines the agent (and every child) to sandbox + toolchain; withheld specs and
   everything else return `EACCES`. Fails closed.
5. after the turn: mirror the sandbox back onto the worktree (propagating the agent's edits and
   deletions while preserving `.git` and the harness-managed specs), restore visible specs to
   authored, commit the **pure agent delta**.

This isolation spine is identical to the REST arm.

### The whole-stack launcher — one start/stop, part of the evolving app

Because the oracle drives a real browser, the app must actually run. **A single whole-stack `start`
brings the whole app up on one port**, and `stop` tears it down. The launcher lives **in the app
repo and evolves with it** — it is not a constant layer.

- **Build then run.** The harness first builds this checkpoint's app (`correctness.build()`): a
  Maven build whose `frontend-maven-plugin` compiles the SPA into `PUBLIC/`, then
  `spring-boot-maven-plugin` repackages the WoOF app into one runnable jar. Keeping build distinct
  from start cleanly separates a compile failure from a start failure.
- **`app.start_cmd`** receives `PORT`, boots the jar — **`officeflyway_migrate` migrates the
  in-memory H2 from empty up to this checkpoint's schema** — and WoOF serves the SPA + the `.yml`
  routes on `PORT`. Schema comes up on boot; **data does not** (seeded per-spec, §9).
- **`app.stop_cmd`** kills the JVM and frees `PORT`; the in-memory H2 dies with it, so it is a
  clean reset. **Idempotent** (safe after a crash; the harness may kill by port as a backstop).
- The **harness owns** only port choice and readiness polling (`app.health_url` + a known
  `data-test-id` anchor).

A gate run (`correctness.serve()`): build → `app.start` on `PORT` → `wait_ready` → run Playwright
against `http://localhost:$PORT` → per-spec `beforeEach` reset+seed via `/__test__` → `app.stop`.

### The concrete SUT — a single WoOF (OfficeFloor) app (chosen)

Verified against the OfficeFloor tutorials (`SpringWebMvcHttpServer`, `DatabaseHttpServer`). One
JVM, no daemon, no container — resolving the §15 embedded constraint — rebuilt each checkpoint as
the app evolves. Coordinates and wiring are pinned in `~/officehq-react-officefloor` (`pom.xml`,
`src/main/resources/officefloor/**`):

- **OfficeFloor (WoOF) is the HTTP server; Spring is supplied into it** (`net.officefloor.web:woof`
  + `net.officefloor.spring:officespring_webmvc`, via `officefloor/suppliers/Spring.yml` → an
  `@SpringBootApplication` config class). The executable jar is built by `spring-boot-maven-plugin`
  with main class `net.officefloor.OfficeFloorMain`.
- **H2 in-memory** via `net.officefloor.persistence:officejdbc_h2` (`officefloor/objects/
  DataSource.yml`), same JVM; starts **empty**.
- **Flyway on boot** via `net.officefloor.persistence:officeflyway_migrate`, from
  `src/main/resources/db/migration` — schema built up checkpoint by checkpoint (§5's "code +
  migration").
- **The SPA is served from `src/main/resources/PUBLIC`** (WoOF serves static content from
  `PUBLIC/`); the front-end builds there via `frontend-maven-plugin`. No external `FRONTEND_DIST`
  seam (that only existed to keep a constant backend, which is gone). SPA deep-link fallback is a
  TODO in the base repo (a WoOF catch-all → `index.html`).
- **Data seeding is per-spec via a `/__test__` endpoint** (`reset` + `seed`, wired as WoOF routes),
  not a boot-time step (§9) — because the schema evolves, fixtures live with each spec. TODO: guard
  it to a harness-only OfficeFloor profile.
- **Readiness** is a WoOF `/health` route (`app.health_url`) — OfficeFloor has no Spring Actuator —
  plus a known `data-test-id` anchor.

So `app.start` is essentially:

```sh
exec java -jar target/app.jar --http.port="$PORT"   # main net.officefloor.OfficeFloorMain
```

Playwright (external TS specs) drives it at `http://localhost:$PORT`, binding only to
`data-test-id` (the testing-boundary invariant, below).

### The testing-boundary invariant — why the whole stack can evolve behind the UI

Playwright talks to the **served UI and nothing else**: it binds only to `data-test-id`, asserts
only on values read back **through the UI**, and *arranges* data through the constant-shaped
`/__test__` seed API (Arrange, not Assert; §9). It never asserts against the domain API, the
database, logs, or internal state. Therefore the entire stack — schema, OfficeFloor server, front-
end — may be rewritten freely as long as the user-visible behaviour holds. That is exactly what is
measured: whether OfficeHQ keeps the UI (test) contract intact while it grows the whole app under
English requests. See `docs/SUT_CONTRACT.md` for what the app repo must provide.

---

## 15. Running the tests during the agent turn (inside confinement)

The agent must be able to **run its test as it works** — the UI analog of `mvn test` in the REST
arm. In the REST arm that is cheap: MockMvc boots the app in-process, no server. Here a Playwright
spec only passes against the **whole running stack**, so "let the agent run the test" means "let
the agent bring the whole stack up, on a port, from inside the Landlock sandbox, and drive a
browser at it." That has three consequences worth stating.

### One agent test command, running only the visible spec

The agent is given a single command — `acceptance.agent_test_cmd` (e.g. `./e2e`), pinned into the
app and documented in the pinned `CLAUDE.md`. It builds the app, brings it up via `app.start`, runs
the **currently-visible spec(s) only** (which `beforeEach` reset+seed via `/__test__`), and tears
down (`app.stop`). Blind holds by construction: the agent can only run what it can see (its own
checkpoint's spec), never the withheld priors. This is exactly the REST arm's condition — the agent
iterates against its own test — moved to a served, full-stack app.

### Scoring is still the post-turn gate, not the agent's runs

The agent running its spec is for its **own iteration only**. Correctness/regression scoring is
unchanged: after the turn, the harness restores the **pinned operational scaffolding** — the
`bin/start`/`bin/stop` scripts, the `./e2e` command, and `CLAUDE.md`/`AGENTS.md` — and the visible
specs to authored, then runs the **full cp01..cpK suite** (`correctness.run_tests`). The
*application code* the agent wrote (schema migrations, OfficeFloor server, front-end, and the
evolving `/__test__` seed endpoint) is the agent's delta and is kept; only the fixed scaffolding
and the specs are restored. So the agent cannot influence the score by editing the launch/test
scripts or its visible spec (the REST arm's `detect_agent_tamper` discipline, extended to the
scripts). The launch command stays constant across checkpoints even though the app evolves, which
is what lets it be pinned.

### The stack must be launchable inside Landlock — which constrains the SUT

Landlock is **filesystem-only**: it does not restrict loopback networking, so serving on
`localhost` and driving Playwright at it work under confinement. What it does mean is that
**every process the app spawns is a Landlock child** and can touch only the allowlist. Therefore
the whole-stack app must be **in-process / embeddable** — the Spring Boot jar with embedded H2 and
a static-served SPA — **not** a Docker/daemon-backed stack, because a daemon lives outside the
confinement and a Docker socket cannot be granted cleanly. Concretely the allowlist adds, read-
only, the toolchain (node + the Playwright browser binaries, the JRE) and, writable **under the
sandbox**, the build output, the Playwright cache, tmp, and the npm/pnpm store (H2 is in-memory —
no DB data dir). `landlock.default_allowlist` gains these binds (`isolation.extra_ro_binds` /
`extra_rw_binds`). Still fails closed — if the toolchain isn't reachable or a withheld sentinel is
readable, the turn is refused.

**This is the single biggest constraint the harness places on the SUT:** the app has to run
embedded, not containerised — satisfied by the single Spring Boot app (§14), which is why the
agent-test loop stands.

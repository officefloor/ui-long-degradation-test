# SUT contract — what an app code folder must provide

The harness (`~/ui-long-degradation-test`) treats each candidate front-end as an **external
code folder** it only ever reads (DESIGN.md §14). For the harness to evolve, isolate, build, and
test that folder without knowing anything about its framework, the folder must honour this
contract. Anything that honours it is testable — React, Vue, HTMX, whatever. Serving is not the
arm's job: one constant whole-stack launcher (§5) serves whatever dist the arm builds.

## 1. It is a git repo with a clean base ref

- The folder is a git repository (`arms.<name>.repo` in `config.yaml`).
- It has a `base_ref` (e.g. `base-no-specs`) that is the app **plus the shared opinionated
  shell, and NO pre-existing checkpoint specs**. The harness branches every run off this ref and
  never writes to it.

## 2. Source lives under the configured globs

- Production source is under `arms.<name>.source_globs` (e.g. `src/**/*.{ts,tsx}`) so metrics see
  it. Prefer `.ts`/`.tsx`/`.vue` — Lizard reads these at full fidelity (DESIGN.md §8).
- Declare the shared/central files in `arms.<name>.shared_surfaces` (router/manifest, global
  store, shared primitives) so the boundary-violation co-metric can see when a change was forced
  to reach into them (DESIGN.md §8).

## 3. An arm builds to a servable dist

An arm folder does NOT serve itself — serving is the constant whole-stack launcher's job (§5).
An arm only needs to **build to a servable output**:

- `build_cmd` (default `bin/build`) runs in the mirrored worktree and produces `dist_dir`
  (default `dist/`) — the static assets the launcher will serve.
- The harness runs `build_cmd` as a separate step before starting the stack, so a compile failure
  is cleanly distinct from a stack-start failure (mirrors the REST arm's build-then-run).

That is the entire per-arm serving surface: produce a dist. Everything else (DB, OfficeFloor,
serving, the port) is constant and lives in the launcher.

## 4. Behaviour is exposed through `data-test-id`

- Every element a test acts on, and every value a test reads back, carries a `data-test-id`
  (DESIGN.md §3). Tests bind to these **only** — never CSS classes, DOM structure, tag nesting,
  or visible copy.
- **A `data-test-id` is immutable public API once introduced** — never rename or remove one. A
  drifted anchor is a real contract regression (DESIGN.md §3, §6).
- The harness drives the served UI at `http://localhost:$PORT` and asserts only through it; it
  never touches the API, the database, logs, or internal state. So the folder's internals — and
  even the backend's — may be rewritten freely as long as the UI contract holds. This is the
  freedom the experiment measures (DESIGN.md §14).

## 5. The whole-stack launcher (constant, one, not an arm)

The SUT launcher (`sut.repo` in `config.yaml`) is the CONSTANT layer — one folder, one pair of
scripts, byte-identical across every arm and checkpoint (DESIGN.md §2, §14). It provides:

### `sut.start_cmd` (default `bin/start`)
Brings up the **whole stack on one port** in a single call. Reads env `PORT` and `FRONTEND_DIST`
(the arm's built dist from §3), and:
- **seeds a fresh, deterministic database** — a deterministic seed on every start IS the
  per-checkpoint reset (DESIGN.md §9); there is no separate seed step;
- starts the constant OfficeFloor server;
- serves `FRONTEND_DIST` **and** the API on `PORT`.
Returns once launching; the harness polls `sut.health_url` + a known anchor for readiness.

### `sut.stop_cmd` (default `bin/stop`)
Tears the whole stack down and frees `PORT`. **Idempotent** — safe when nothing is running and
after a crash left a stale process/port (the harness may kill by port as a backstop).

The launcher and its OfficeFloor image never change across arms or checkpoints; only the
`FRONTEND_DIST` it is pointed at varies. That is what keeps "the backend is constant" true while
the front-end is the sole variable.

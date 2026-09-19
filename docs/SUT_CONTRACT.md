# SUT contract — what an app code folder must provide

The harness (`~/ui-long-degradation-test`) treats each candidate front-end as an **external
code folder** it only ever reads (DESIGN.md §14). For the harness to evolve, isolate, serve, and
test that folder without knowing anything about its framework, the folder must honour this
contract. Anything that honours it is testable — React, Vue, HTMX, whatever.

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

## 3. It builds and serves itself: `start` and `stop`

The folder provides two scripts (paths in `config.yaml`; `bin/start`, `bin/stop` by default):

### `start`
- Builds the front-end if needed and **publishes it on the port** given in `$PORT`.
- Points the front-end at the constant backend given in `$BACKEND_URL`.
- Returns promptly once the server is launching (the harness polls for readiness — it does not
  rely on `start` blocking).
- Reads only these env vars from the harness: `PORT`, `BACKEND_URL` (plus anything the folder
  itself needs internally).

### `stop`
- Tears the front-end down cleanly and frees `$PORT`.
- Is **idempotent**: safe to call when nothing is running, and safe after a crash left a stale
  process/port behind (the harness may also kill by port as a backstop).

### What `start`/`stop` must NOT do
- **Never seed or reset data.** The harness owns the constant OfficeFloor backend and reseeds a
  deterministic database per checkpoint (DESIGN.md §9). The front-end only talks to
  `$BACKEND_URL`.

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

## 5. The backend folder (constant, one, not an arm)

The constant backend (`backend.repo` in `config.yaml`) honours a parallel lifecycle contract:
`start_cmd` (publishes OfficeFloor on `backend.port`, reads `$PORT` + DB env), `stop_cmd`
(idempotent), and `seed_cmd` (resets the DB to deterministic fixtures — called by the harness
per checkpoint). It is byte-identical across every arm and never changes across checkpoints
(DESIGN.md §2).

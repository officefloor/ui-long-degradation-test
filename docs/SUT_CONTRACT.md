# App contract — what the evolving app repo must provide

The harness (`~/ui-long-degradation-test`) grows **one application** from a near-empty base over
~60 English change requests, modelling the OfficeHQ loop (DESIGN.md §1, §2, §14). It treats the
app repo (`app.repo` in `config.yaml`) as an external folder it only reads at `base_ref`, mirrors
into an isolated sandbox for the agent turn, then builds and runs whole for the gate. For that to
work without the harness knowing the app's internals, the repo must honour this contract.

Everything in the app **evolves** across checkpoints — schema, OfficeFloor server, front-end, and
the acceptance tests. The only things that stay fixed are the operational scaffolding (§3) and the
test contract (§4).

## 1. It is a git repo starting from a near-empty base

- The folder is a git repository with a `base_ref` (e.g. `base-empty`) that contains: the base
  front-end shell, Spring with the OfficeFloor plugin, Flyway wired against an **empty in-memory
  H2 (no tables)**, the scaffolding scripts (§3), and the `/__test__` seed endpoint (§4).
- The harness branches every run off `base_ref` and never writes to it. cp01 creates the first
  tables/entities/UI.

## 2. One embedded stack — a single Spring Boot app

The whole app runs in **one JVM, no daemon or container**, so it is launchable inside the Landlock
sandbox (the agent runs it too, §5; DESIGN.md §15):

- **OfficeFloor within Spring** serves the API in-process.
- **H2 in-memory** (`jdbc:h2:mem:app;DB_CLOSE_DELAY=-1`); **Flyway** migrations (added checkpoint
  by checkpoint) build the schema up **on boot** from empty.
- The **SPA is served as static files** from the jar (`src/main/resources/static`), with an SPA
  deep-link fallback (unknown non-`api/` path → `index.html`).
- Readiness is Spring Actuator's `/actuator/health` (`app.health_url`).

## 3. Fixed operational scaffolding: `bin/build`, `bin/start`, `bin/stop`, `./e2e`

These are **pinned** — the agent may run them but not edit them; the harness restores them to
authored before the gate (DESIGN.md §15). Their commands stay constant even as the app evolves.

- `bin/build` — compile the OfficeFloor backend **and** the front-end into one runnable jar.
- `bin/start` — `java -jar app.jar --server.port=$PORT`; Flyway migrates the empty H2 up to this
  checkpoint's schema; serves SPA + API on `$PORT`. Returns once launching (harness polls health).
- `bin/stop` — kill the JVM / free `$PORT`; in-mem H2 dies with it (clean reset). **Idempotent**.
- `./e2e` (`acceptance.agent_test_cmd`) — build + start + run the **currently-visible spec(s) only**
  + stop, so the agent can test as it works without ever seeing prior specs.

## 4. Behaviour is exposed through `data-test-id`; data is arranged through `/__test__`

- Every element a test acts on, and every value it reads back, carries a `data-test-id`
  (DESIGN.md §3). Tests bind to these **only** — never CSS classes, DOM structure, or visible copy.
- **A `data-test-id` is immutable public API once introduced** — never rename/remove one; a drift
  is an anchor-drift regression (DESIGN.md §6).
- **Seeding is per-spec via a profile-guarded test-support endpoint** (`POST /__test__/reset` +
  `POST /__test__/seed`), called from each spec's `beforeEach` (DESIGN.md §9). Unlike the scripts
  in §3, this endpoint **evolves with the schema** (it is app code, not pinned); a change that
  breaks a prior spec's seed is a *seed-path* regression unless declared `intended` (§6).
- The harness drives the served UI at `http://localhost:$PORT` and **asserts only through it** —
  never the domain API, the database, logs, or internal state. Seeding is Arrange, not Assert. So
  the whole stack — schema, OfficeFloor, front-end — can be rewritten freely as long as the
  user-visible behaviour holds. That freedom is exactly what the experiment measures (DESIGN.md
  §14).

## 5. It must run inside Landlock (the agent runs it too)

The agent brings the app up to test as it works, from inside the confined sandbox. Landlock is
filesystem-only, so loopback serving + Playwright are fine — but every process the app spawns is
confined to the allowlist. That is why §2 requires the embedded single-JVM stack (no Docker /
daemon). The allowlist adds, read-only, the JRE + node + Playwright browsers, and writable under
the sandbox, the build output + Playwright cache + tmp + npm store (no DB data dir — H2 is
in-memory). See DESIGN.md §15.

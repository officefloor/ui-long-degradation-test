# App contract — what the evolving app repo must provide

> Language-agnostic by construction: the harness touches the app only through four
> scripts (`bin/build`, `bin/start`, `bin/stop`, `bin/e2e`) and HTTP. Bring any
> language or framework that can satisfy §2–§5.

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

## 2. One locally-startable process — NOT a jar, and not necessarily Java

The contract is about PROPERTIES, not technology. Everything the harness needs it gets through the
four scripts of §3 and two HTTP endpoints, so a stack may be written in any language: the harness
never builds, starts or inspects the process itself, it only runs `bin/build`, `bin/start`,
`bin/stop` and reads HTTP.

Required properties:

- **One process, started and stopped by scripts.** `bin/start` brings the whole app up; `bin/stop`
  takes it down. No daemon, no container, no external service — the agent runs the app too, inside
  the Landlock sandbox (§5), and that sandbox can only confine what the scripts launch. A
  `java -jar`, a `node server.js`, a `uvicorn`, a `go run` or a compiled binary are all equally
  acceptable; what matters is that the two scripts are the ONLY interface.
- **Readiness over HTTP** at `app.health_url`. Any path, any body — the harness only polls for a
  2xx. (The reference stacks happen to use Spring Actuator's `/actuator/health`.)
- **Schema built on start, from nothing.** The app must be able to come up against an empty data
  store and migrate itself to the current schema, because the harness starts it fresh at every
  checkpoint. An in-memory store is simplest (it dies with the process, so there is no data
  directory to clean), but a file-backed one that `bin/stop` discards is equally fine.
- **The UI served by the same process.** However the UI is produced — a built SPA served as static
  files, server-rendered templates, anything — it must be reachable from the one base URL, since
  the acceptance suite drives a browser against `app.port` alone.
- **Reproducible offline.** `bin/build` must succeed with no network egress, because the gate runs
  Landlock-confined. Pre-warm whatever a first build downloads (a toolchain, a package cache) by
  building once outside the sandbox.

Nothing above names a language, a framework or a packaging format. The reference stacks are Spring
Boot jars with an embedded in-memory H2 and Flyway because that was convenient, not because the
harness requires it — see `BASE_CHECKLIST.md` in any `officehq-*` base repo for one worked example,
and `stack.yaml` for how a stack declares its source layers and their languages (which is what
keeps the language-specific metrics from being applied to a language they cannot read).

## 3. Fixed operational scaffolding: `bin/build`, `bin/start`, `bin/stop`, `./e2e`

These are **pinned** — the agent may run them but not edit them; the harness restores them to
authored before the gate (DESIGN.md §15). Their commands stay constant even as the app evolves.

Each is specified by BEHAVIOUR, not by command — the harness only checks the exit status and then
polls HTTP, so any language satisfies these the same way:

- `bin/build` — produce whatever `bin/start` needs to run, from a clean checkout, **with no network
  egress** (the gate is Landlock-confined). Non-zero exit = build failure, and that is the whole
  interface: the harness never inspects the output.
- `bin/start` — bring the app up on `$PORT`, building the schema from empty as it goes. **Returns
  once the app is launching**, not once it is ready — the harness polls `app.health_url` for that —
  so it must background the process and record whatever `bin/stop` needs (a pid file, a container
  id, a port). Exit non-zero only if the launch itself could not be attempted.
- `bin/stop` — take the app down and **free `$PORT`**, discarding its data so the next checkpoint
  starts clean. **Idempotent**: it is called when nothing is running, and after a crash, and must
  succeed in both cases.
- `bin/e2e` (`acceptance.agent_test_cmd`) — build + start + run **only the spec(s) currently
  present** + stop, so the agent can test as it works without ever seeing prior specs. This is the
  one script the agent is expected to run.

Both `$PORT` and the harness's `AUDIT_FILE` arrive as environment variables; nothing else is
passed in, and nothing but exit status and HTTP comes back out.

## 4. Behaviour is exposed through `data-testid`; data is arranged through `/__test__`

- Every element a test acts on, and every value it reads back, carries a `data-testid`
  (DESIGN.md §3). Tests bind to these **only** — never CSS classes, DOM structure, or visible copy.
- **A `data-testid` is immutable public API once introduced** — never rename/remove one; a drift
  is an anchor-drift regression (DESIGN.md §6).
- **Seeding is per-spec via a profile-guarded test-support endpoint** (`POST /__test__/reset` +
  `POST /__test__/seed`), called from each spec's `beforeEach` (DESIGN.md §9). Unlike the scripts
  in §3, this endpoint **evolves with the schema** (it is app code, not pinned); a change that
  breaks a prior spec's seed is a *seed-path* regression unless declared `intended` (§6).
- **Audit / side-effect behaviour is written to a known file** (the `Audit` service →
  `app.audit.file`; `bin/start`/`bin/e2e` set `AUDIT_FILE`), one record per line, and specs assert
  it via `e2e/support/audit.ts`. This is the only non-UI assertion channel and is a stable contract
  like `data-testid`. `/__test__/reset` also clears this file so each spec starts clean.
- The harness drives the served UI at `http://localhost:$PORT` and **asserts only through the UI
  and the known audit file** — never the domain API, the database, arbitrary logs, or internal
  state. Seeding is Arrange, not Assert. So
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

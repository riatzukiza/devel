# Promethean/system architecture

Where packages are generalized reusable collections of logic that are defined by
configuration.

The `promethean/system` files are `.json`, `.yml`,`.edn`, `clj`,`cljs`,`bb`,`nbb` `.md`, or `.org` files. They
can really be anything you define a grammar for.

In the case of a markdown file, an LLM interprets it based on the folder you put
it in and existing vocabulary of the system.
They act like sorta loose services, over time as a markdown (or any other config
file whose grammar definition requires a language model)

If these natural language unit definitions get used frequently enough,
it triggers an optimization event.

The system looks at the context/system state at the time of the units use, and at the outcome
these smart units may have to run more than once before their goal is achieved.

The user is either directly observing the unit when it is used and confirms it has succeeded directly at that point,
or the user user can approve it asynchronously.

With enough confirmations, the system tries to convert the markdown to a structured format.
The structured format is either approved or denied by the user.

- daemon
- conditions
- events
- triggers
- schedules
- actions

## Automation

### Bootstrapping PM2 ecosystem

clobber now does the heavy lifting: it reads each `ecosystem.clj`, renders a temporary `ecosystem.config.cjs`, and executes PM2. Start the stack with:

```
clobber start system/daemons/devops/nx-daemon/ecosystem.clj
clobber start system/daemons/devops/nx-watcher/ecosystem.clj
```

**See `.opencode/skills/clobber-process-management.md` for detailed PM2 workflows including start, stop, restart, and monitoring commands.**
clobber start system/daemons/devops/nx-daemon/ecosystem.clj
clobber start system/daemons/devops/nx-watcher/ecosystem.clj
```

The watcher described below keeps the per-daemon definitions in sync, so once the daemon files are updated there is nothing to hand-edit.

### Regenerating the ecosystem

The `ecosystem-regenerator` daemon under `system/daemons/devops/ecosystem-watch` keeps the PM2 stack fresh by running clobber against updated daemon definitions. Any edits to `system/daemons` now trigger the watcher, so new `ecosystem.clj` files propagate into PM2 without manual intervention.

### OpenCode services (manual ecosystem.clj entries)

The workspace root `ecosystem.clj` also carries local OpenCode-related services that are not generated from `system/daemons/**/ecosystem.clj`:

**Standard:** the workspace root `ecosystem.clj` is the active entrypoint for current development. When new ecosystem files are created, add them to the root `ecosystem.clj` as well as any templates/examples you maintain, so the active stack stays discoverable in one place.

- **opencode-server** (headless HTTP server)
  - Backed by `opencode serve` in `orgs/anomalyco/opencode/packages/opencode`.
  - PM2 entry uses `bun src/index.ts serve --port 4096 --hostname 127.0.0.1` for a stable local port.
  - The server exposes the OpenAPI spec at `http://localhost:4096/doc`.

- **oc-web** (OpenCode web UI/docs)
  - Backed by the Astro site in `orgs/anomalyco/opencode/packages/web`.
  - PM2 entry runs `pnpm dev -- --host 0.0.0.0 --port 4321`.
  - Local access: `http://localhost:4321`.

- **oc-manager** (OpenCode metadata TUI)
  - **Not** run under PM2 because it requires a TTY and user interaction.
  - On-demand launch options:
    - `bunx opencode-manager --root ~/.local/share/opencode`
    - `bun run tui -- --root ~/.local/share/opencode` (from `orgs/kcrommett/oc-manager`)
    - `./manage_opencode_projects.py --root ~/.local/share/opencode`

### Internal rebuilds and restarts

Every internal service describes the directories it cares about via `:watch` in its `ecosystem.clj`, so PM2 automatically restarts a process when the corresponding package or service source changes. The Nx-aware `nx-watcher` daemon sees those same patterns and runs `pnpm nx` operations (build/test/lint) on the affected projects before the PM2 restart completes, guaranteeing each process is rebuilt on change.

### Daemon generation and PM2 sync

- Source of truth: `system/daemons/**/ecosystem.clj`.
- Generated (do-not-edit) PM2 configs still live alongside each daemon as `system/daemons/.../dist/ecosystem.config.mjs` for legacy workflows.
- Commands:
  - One-shot: `clobber render system/daemons/<group>/<name>/ecosystem.clj` (prints JSON without starting PM2).
  - Start: `clobber start system/daemons/<group>/<name>/ecosystem.clj` (renders + starts PM2).
- Adding a new daemon (including simple scripts like `pm2 start "script.js" --name "foobar"`):
  1) Create a folder under `system/daemons/<group>/<name>/` and add `ecosystem.clj` describing the process (example below).
  2) Run `clobber start system/daemons/<group>/<name>/ecosystem.clj` to render and launch it.
  3) Example EDN for a simple script:
     ```clojure
     {:apps [{:name "foobar"
              :script "node"
              :args ["script.js"]
              :cwd "/home/err/devel/path-to-script"
              :watch false
              :autorestart true}]}
     ```
   4) Start the watcher (command above) or run `clobber start system/daemons/<group>/<name>/ecosystem.clj`.
- Nx automation is now explicit:
- `system/daemons/devops/nx-daemon` keeps the Nx background server alive under PM2 so it finally shows up in `pm2 status`. Start it with `clobber start system/daemons/devops/nx-daemon/ecosystem.clj`.
- `system/daemons/devops/nx-watcher` runs `scripts/nx-watcher.mjs`, which listens for file changes and runs `build/test/lint/typecheck/coverage` on the affected projects. Start it with `clobber start system/daemons/devops/nx-watcher/ecosystem.clj`.
- Both daemons are managed like every other service, so edits to their `ecosystem.clj` files take effect on restart.

### PM2 actions

Core daemons expose remote actions so automation and operators can invoke maintenance tasks without SSH access:

- `nx-watcher`
  - `pm2 trigger nx-watcher build-affected`
  - `pm2 trigger nx-watcher test-affected`
  - `pm2 trigger nx-watcher lint-affected`
  - `pm2 trigger nx-watcher typecheck-affected`
  - `pm2 trigger nx-watcher generate-report` (writes `logs/nx-watcher-report.json`)
  - `pm2 trigger nx-watcher cleanup` (runs `nx reset`)
- `health`
  - `pm2 trigger health emit-report` (same payload as the `/health` endpoint)
  - `pm2 trigger health reset-heartbeats` (clears cached metrics without bouncing the service)
- `heartbeat`
  - `pm2 trigger heartbeat scan-now` (immediate sweep for stalled processes)
  - `pm2 trigger heartbeat reload-config` (reloads ecosystem limits from disk)
  - `pm2 trigger heartbeat shutdown` (graceful stop for maintenance)
- `autocommit`
  - `pm2 trigger autocommit sync-now` (force an immediate commit cycle even if paused)
  - `pm2 trigger autocommit pause`
  - `pm2 trigger autocommit resume`
- `serena-updater`
  - `pm2 trigger serena-updater check-now` (poll GitHub immediately)
  - `pm2 trigger serena-updater restart-serena`

### External dependency monitoring

Serena now runs via `system/daemons/mcp/serena/ecosystem.clj`, and `system/daemons/devops/serena-updater` executes `scripts/serena-update-check.mjs`. That updater polls the upstream GitHub release, stores the last seen version in `.cache/serena-updater.json`, and issues a `pnpm --dir orgs/riatzukiza/promethean exec pm2 restart serena` whenever a new tag appears so the external dependency is always up to date.

## Markdown DSL

System markdown files now have a formal grammar and reference parser. See
[`markdown-dsl.md`](./markdown-dsl.md) for the complete specification. Agents can
use the parser exported from `@promethean-os/markdown` to transform conforming
documents into typed data structures without relying on heuristics.

## daemon
A Daemon is a long running background process. In our system, daemons are
managed by pm2.
## conditions

Conditions describe a... well a condition that the system can use to decide when
an event has occurred. They are distinct from events because they are composable
units. By themselves they don't do anything.

A few examples of conditions you might define:
```clojure
{
:is-raining (is (weather :raining :place 'home))
:is-hot (is (temp-in (raining (in :place 'home))) (over 80))
}
```

or possible in markdown:

```markdown
# Weather Conditions
Sometimes the weather outside affect my decisions.
Two condtions that I want to act on are:

# Is it raining outside?
You can tell by asking the weather provider about the current weather where I
live.

# Is it hot out?
You can tell it's hot out if the weather provider says it is over 80f.
```


## Events

Events are named happenings that are emitted when a system condition has been
met.


## Actions

Actions are... well they are actions the system can take in response to an event


## Schedules

Schedules are time based events. You describe them the same way you do events,
just with time conditions

## Triggers

A trigger puts actions, events, and conditions together.

Example:

```markdown

if it is rainingo outside, order an umbrella from amazon.
```

functionally, everything you want could be described in a trigger.
It's just be more work.

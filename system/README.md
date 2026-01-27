# Promethean/system architecture

Where packages are generalized reusable collections of logic that are defined by
configuration.

The `promethean/system` files are `.json`, `.yml`,`.edn`, `clj`, `.md`, or `.org` files. They
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

### Bootstrapping the PM2 ecosystem

The DSL generator now does most of the heavy lifting: by default it writes every daemon's `dist/ecosystem.config.mjs` plus the aggregate `ecosystem.config.enhanced.mjs` (see `internal/riatzukiza/promethean/packages/ecosystem-dsl/src/ecosystem_dsl/script.clj:9-156`). Run the generator once to materialize every PM2 config, then start the stack with:

```
pnpm --filter @promethean-os/ecosystem-dsl generate -- --dir /home/err/devel/system
pm2 start ecosystem.config.enhanced.mjs
pm2 start system/daemons/devops/nx-daemon/dist/ecosystem.config.mjs
pm2 start system/daemons/devops/nx-watcher/dist/ecosystem.config.mjs
```

The watcher described below keeps the per-daemon dist files and the aggregate config in sync, so once the generator runs there is nothing to hand-edit. Pass `--skip-aggregate` if you prefer to regenerate only the individual daemon configs without writing `ecosystem.config.enhanced.mjs`.

### Regenerating the ecosystem

The `ecosystem-regenerator` daemon under `system/daemons/devops/ecosystem-watch` keeps `ecosystem.config.enhanced.mjs` fresh by running `pnpm ecosystem:watch` from the workspace root. Any edits to `system/daemons` now trigger the DSL watcher, so new `ecosystem.edn` files propagate into the aggregate PM2 config without manual intervention.

### Internal rebuilds and restarts

Every internal service describes the directories it cares about via `:watch` in its `ecosystem.edn`, so PM2 automatically restarts a process when the corresponding package or service source changes. The Nx-aware `nx-watcher` daemon created by the DSL sees those same patterns and runs `pnpm nx` operations (build/test/lint) on the affected projects before the PM2 restart completes, guaranteeing each process is rebuilt on change.

### Daemon generation and PM2 sync

- Source of truth: `system/daemons/**/ecosystem.edn`.
- Generated (do-not-edit) PM2 configs now live alongside each daemon as `system/daemons/.../dist/ecosystem.config.mjs`. Only the changed daemon’s dist file is reloaded; these are intentionally tucked away so manual edits are obvious mistakes.
- Aggregate file: `ecosystem.config.enhanced.mjs` is still produced if you want a single `pm2 start` target; pass `--skip-aggregate` to suppress it.
- Commands:
  - One-shot: `pnpm --filter @promethean-os/ecosystem-dsl generate -- --dir system --skip-aggregate` (keeps per-daemon dist files in sync without writing the aggregate).
  - Watcher: `pnpm --filter @promethean-os/ecosystem-dsl generate:watch -- --dir system --skip-aggregate` (regenerates per-daemon configs on any `ecosystem.edn` change and reloads the affected daemon).
- Adding a new daemon (including simple scripts like `pm2 start "script.js" --name "foobar"`):
  1) Create a folder under `system/daemons/<group>/<name>/` and add `ecosystem.edn` describing the process (example below).
  2) The watcher writes `dist/ecosystem.config.mjs` for that folder and runs `pm2 start|reload` on that file only.
  3) Example EDN for a simple script:
     ```clojure
     {:apps [{:name "foobar"
              :script "node"
              :args ["script.js"]
              :cwd "/home/err/devel/path-to-script"
              :watch false
              :autorestart true}]}
     ```
  4) Start the watcher (command above) or run the one-shot generate to materialize `dist/ecosystem.config.mjs`, then start it with `pm2 start system/daemons/<group>/<name>/dist/ecosystem.config.mjs`.
- Nx automation is now explicit:
  - `system/daemons/devops/nx-daemon` keeps the Nx background server alive under PM2 so it finally shows up in `pm2 status`. Start it with `pm2 start system/daemons/devops/nx-daemon/dist/ecosystem.config.mjs`.
  - `system/daemons/devops/nx-watcher` runs `scripts/nx-watcher.mjs`, which listens for file changes and runs `build/test/lint/typecheck/coverage` on the affected projects. Start it with `pm2 start system/daemons/devops/nx-watcher/dist/ecosystem.config.mjs`.
  - Both daemons are generated/updated like every other service, so edits to their `ecosystem.edn` files regenerate the matching dist files automatically.

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

Serena now runs via `system/daemons/mcp/serena/ecosystem.edn`, and `system/daemons/devops/serena-updater` executes `scripts/serena-update-check.mjs`. That updater polls the upstream GitHub release, stores the last seen version in `.cache/serena-updater.json`, and issues a `pnpm --dir orgs/riatzukiza/promethean exec pm2 restart serena` whenever a new tag appears so the external dependency is always up to date.

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

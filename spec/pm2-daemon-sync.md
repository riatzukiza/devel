# PM2 daemon sync and regeneration

## Context and references
- Current automation summary in `system/README.md:33-45` (ecosystem-regenerator runs `pnpm ecosystem:watch` to rebuild `ecosystem.config.enhanced.mjs` on edits to `system/daemons`; Serena updater + Nx watcher described) and general DSL notes in same file.
- Generated aggregate config lives at `ecosystem.config.enhanced.mjs` (generated at 2025-11-15), contains 12 apps (nx-watcher, serena, heartbeat, autocommit, broker, health, opencode*, lein-repl, ecosystem-regenerator, serena-updater) with paths under `orgs/riatzukiza/promethean/packages/ecosystem-dsl`.
- Example daemon sources: `system/daemons/devops/ecosystem-watch/ecosystem.edn`, `system/daemons/services/autocommit/ecosystem.edn`, `system/daemons/mcp/serena/ecosystem.edn` (no per-daemon README/runbook files found).
- User just removed all PM2 processes (`pm2 delete all`).

## Problem statement
PM2 running set should always match the source of truth in `system/daemons`. Any edit to a daemon definition should regenerate PM2 config and reload only that daemon. Generated PM2 configs should be per-daemon and tucked away (dist-like) to discourage manual edits, rather than a single root config.

## Requirements / definition of done
- Source of truth remains `system/daemons/**/ecosystem.edn`.
- On change to a daemon EDN, generate a scoped `ecosystem.config.mjs` for that daemon in a non-prominent dist location (e.g., `system/daemons/<path>/dist/ecosystem.config.mjs`).
- PM2 reload/start only the changed daemon using its generated config (no global reload required).
- An automated watcher exists and is active to regenerate on change; instructions exist to start/ensure it (ideally pm2-managed).
- Documentation explains: where generated files live, that they are not to be edited, how to sync/reload, and how the watcher keeps PM2 in sync.

## Proposed approach
- Generation: extend ecosystem DSL tooling (likely `packages/ecosystem-dsl`) to output one `dist/ecosystem.config.mjs` per daemon folder alongside the aggregate config. Include metadata (source path, timestamp) in comments to signal generated status.
- Watching/regeneration: repoint or augment `ecosystem-regenerator` (currently runs `pnpm ecosystem:watch`) to emit per-daemon configs and, on a change event, run `pm2 start/reload <dist/ecosystem.config.mjs>` for the affected daemon only.
- Process management: keep a lightweight PM2 process (like `ecosystem-regenerator`) running to watch `system/daemons/**` and apply targeted reloads; ensure it also cleans up removed daemons (stop/delete in PM2 when source is removed).
- Documentation: add instructions under `system/README.md` (or a new `system/daemons/README.md`) describing the flow, generated file locations, and manual commands to resync.

## Open questions / risks
- Need to inspect `packages/ecosystem-dsl` watcher to confirm how to hook per-daemon outputs and PM2 reload commands.
- Handling deletions: decide whether watcher auto-stops removed daemons or prompts.
- Permissions and environments: ensure generated paths are writable and not committed.

## Next steps
1) Read ecosystem-dsl watch script to design per-daemon emit and targeted reload command.
2) Implement per-daemon generation to `dist/` under each daemon directory; mark files gitignored.
3) Enhance watcher to reload only changed daemon and stop removed ones.
4) Update docs with the new flow and commands; restart watcher via PM2.

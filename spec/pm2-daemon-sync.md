# PM2 daemon sync and regeneration

## Context and references
- Current automation summary in `system/README.md:33-45` (pm2-clj renders from `system/daemons` and starts daemons directly; Serena updater + Nx watcher described) and general PM2 notes in same file.
- Example daemon sources: `system/daemons/devops/ecosystem-watch/ecosystem.pm2.edn`, `system/daemons/services/autocommit/ecosystem.pm2.edn`, `system/daemons/mcp/serena/ecosystem.pm2.edn` (no per-daemon README/runbook files found).
- User just removed all PM2 processes (`pm2 delete all`).

## Problem statement
PM2 running set should always match the source of truth in `system/daemons`. Any edit to a daemon definition should regenerate PM2 config and reload only that daemon. Generated PM2 configs should be per-daemon and tucked away (dist-like) to discourage manual edits, rather than a single root config.

## Requirements / definition of done
- Source of truth remains `system/daemons/**/ecosystem.pm2.edn`.
- On change to a daemon config, run `pm2-clj start system/daemons/<path>/ecosystem.pm2.edn` for the affected daemon only.
- PM2 reload/start only the changed daemon using pm2-clj (no global reload required).
- An automated watcher exists and is active to regenerate on change; instructions exist to start/ensure it (ideally pm2-managed).
- Documentation explains: where generated files live, that they are not to be edited, how to sync/reload, and how the watcher keeps PM2 in sync.

## Proposed approach
- Generation: use pm2-clj render to emit JSON for the affected daemon and pass-through to PM2.
- Watching/regeneration: ensure the `ecosystem-regenerator` runs pm2-clj on change and triggers `pm2 start/reload` for the affected daemon only.
- Process management: keep a lightweight PM2 process (like `ecosystem-regenerator`) running to watch `system/daemons/**` and apply targeted reloads; ensure it also cleans up removed daemons (stop/delete in PM2 when source is removed).
- Documentation: add instructions under `system/README.md` (or a new `system/daemons/README.md`) describing the flow, generated file locations, and manual commands to resync.

## Open questions / risks
- Need to inspect `packages/ecosystem-dsl` watcher to confirm how to hook per-daemon outputs and PM2 reload commands.
- Handling deletions: decide whether watcher auto-stops removed daemons or prompts.
- Permissions and environments: ensure generated paths are writable and not committed.

## Next steps
1) Read the pm2-clj runner behavior and confirm targeted reload commands.
2) Implement per-daemon render/start using pm2-clj; keep `dist/` outputs as legacy artifacts.
3) Enhance watcher to reload only changed daemon and stop removed ones.
4) Update docs with the new flow and commands; restart watcher via PM2.

---
uuid: 50904cae-15d5-4382-885b-5e6b50c005b2
title: "PM2 daemon sync and regeneration"
slug: pm2-daemon-sync
status: incoming
priority: P2
tags: []
created_at: "2026-02-03T23:06:07.752630Z"
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# PM2 daemon sync and regeneration

## Context and references
- The canonical ecosystem configs now live under `ecosystems/*.cljs` at the repo root.
- PM2 uses the compiled config via `npx shadow-cljs release clobber` → `ecosystem.config.cjs`.
- User just removed all PM2 processes (`pm2 delete all`).

## Problem statement
PM2 running set should always match the source of truth in `ecosystems/*.cljs`. Any edit to an ecosystem definition should recompile the config and reload only the impacted app. Generated PM2 configs should remain compiled artifacts (`.clobber/index.cjs`) rather than hand-edited files.

## Requirements / definition of done
- Source of truth is `ecosystems/*.cljs`.
- On change, run `npx shadow-cljs release clobber` to refresh `ecosystem.config.cjs`.
- Restart only the impacted app (`pm2 restart <app-name>`), no global reload required.
- Documentation explains: where compiled files live, that they are not to be edited, how to recompile, and how to restart specific apps.

## Proposed approach
- Generation: run `npx shadow-cljs release clobber` to refresh `.clobber/index.cjs`.
- Process management: restart only the impacted app with `pm2 restart <app-name>` after recompile.
- Documentation: add instructions under `docs/` (or a new `docs/pm2.md`) describing the flow, compiled file locations, and manual commands to resync.

## Open questions / risks
- Need to inspect `packages/ecosystem-dsl` watcher to confirm how to hook per-daemon outputs and PM2 reload commands.
- Handling deletions: decide whether watcher auto-stops removed daemons or prompts.
- Permissions and environments: ensure generated paths are writable and not committed.

## Next steps
1) Document the canonical `ecosystems/*.cljs` workflow and `shadow-cljs release clobber` command.
2) Add lightweight guidance for restarting individual apps after a recompile.
3) Update any legacy docs that still reference `ecosystem.pm2.edn` or pm2-clj.

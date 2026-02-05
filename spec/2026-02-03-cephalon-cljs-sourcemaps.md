---
uuid: 0324a2b7-c2bd-4a5d-b4eb-44858237ecef
title: "Cephalon CLJS Source Map Debugging"
slug: 2026-02-03-cephalon-cljs-sourcemaps
status: incoming
priority: P2
tags: []
created_at: "2026-02-03T23:18:17.617559Z"
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# Cephalon CLJS Source Map Debugging

## Context
- PM2 logs show minified stack traces for `duck-cephalon-cljs`, making debugging difficult.
- Shadow-CLJS already emits source maps, but runtime Node processes need explicit source-map enablement.

## Requirements
- Ensure runtime Node process uses source maps for `duck-cephalon-cljs`.
- Preserve existing behavior aside from improving stack trace mapping.
- Keep configuration changes scoped to the cephalon service.

## Files
- `ecosystems/cephalon.cljs:24`
- `services/cephalon-cljs/shadow-cljs.edn:4`
- `services/cephalon-cljs/src/promethean/main.cljs:4`

## Existing Issues / PRs
- Issues: not checked.
- PRs: not checked.

## Definition of Done
- `duck-cephalon-cljs` runs with Node source maps enabled via PM2 environment.
- `npm run build` succeeds in `services/cephalon-cljs`.
- `npm test` succeeds in `services/cephalon-cljs` (or failures documented).
- `pm2 logs --nostream --lines 100 duck-cephalon-cljs` confirms updated runtime after restart.

## Change Log
- 2026-02-03: Enable Node source maps for `duck-cephalon-cljs` via PM2 env.

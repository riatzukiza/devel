---
uuid: 1112fc8a-9728-420f-aaf9-d3be02e4c2d3
title: "Duplicate Nx Typecheck Investigation"
slug: duplicate-typecheck-investigation
status: incoming
priority: P2
tags: []
created_at: "2026-02-03T06:36:00.408448Z"
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# Duplicate Nx Typecheck Investigation

## Problem
- Push-time logs show two separate Nx `typecheck` targets firing: one from the root workspace (e.g. `projects/orgs-open-hax-codex:typecheck`) and another emanating from inside the submodule’s own Nx workspace (`orgs/open-hax/codex:typecheck`).
- The user suspects typechecking is duplicated and wants to know why both targets run every push.

## Code References
- `projects/orgs-sst-opencode/project.json:7-25` – the Nx target for each submodule is defined as `bun run src/giga/run-submodule.ts "<submodule>" typecheck`, so Newton’s workspace always delegates the work to the shared `run-submodule.ts` runner.
- `src/giga/run-submodule.ts:57-101` – the runner detects a missing `package.json` `typecheck` script and, if `nx.json` exists inside the submodule, falls back to `nx run-many --target=typecheck --all` (line 83). That invocation is what prints the second Nx target and executes the submodule’s own typecheck graph.
- `.hooks/pre-push-typecheck.sh:76-118` – the pre-push hook runs `pnpm nx affected -t typecheck`, which triggers the root Nx targets that in turn call `run-submodule.ts` for each changed project.

## Existing Issues / PR
- None found; searching `/spec` and the repo for “duplicate typecheck” or similar yields no open work items.

## Requirements
1. Confirm that the paired Nx targets correspond to the root workspace deploying `run-submodule.ts` and the fallback inside each submodule that re-enters Nx.
2. Determine whether the double run is harmless (and intentional) or whether we need to adjust `run-submodule.ts`/the hook.
3. Update documentation or guidance so the team understands why two Nx targets currently appear in the log.

## Definition of Done
- A concise explanation exists showing the root typecheck target triggers `run-submodule.ts`, which then runs the Nx fallback inside the submodule.
- No additional code changes are required unless further optimization is requested; the spec records the behavior for future reference.

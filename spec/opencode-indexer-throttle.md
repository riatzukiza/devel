---
uuid: d9a410c9-f152-4514-af28-b1542ab437a1
title: "Spec: Throttle OpenCode API Calls in Session Indexing"
slug: opencode-indexer-throttle
status: incoming
priority: P2
tags: []
created_at: "2026-02-03T21:21:09.717385Z"
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# Spec: Throttle OpenCode API Calls in Session Indexing

## Summary
- Add rate limiting between OpenCode API calls to prevent TUI stalls.
- Avoid default Chroma embedding initialization by explicitly disabling the embedding function.
- Use host/port/ssl Chroma client configuration to remove deprecation warnings.

## Requirements
- Introduce `OPENCODE_THROTTLE_MS` environment variable (default 200ms).
- Ensure session list + per-session message fetches respect throttling.
- Avoid DefaultEmbeddingFunction warnings from Chroma JS client.
- Keep existing CLI output and behavior intact.

## Files and Line References
- `packages/reconstituter/src/opencode-sessions.ts:56` add throttle env + client helpers.
- `OPENCODE-SESSIONS-INDEXER.md:62` document throttle env.
- `packages/reconstituter/README.md:30` document throttle env.
- `.opencode/skills/opencode-session-search/SKILL.md:82` document throttle env.
- `.opencode/commands/opencode-sessions-index.md:10` document throttle env.

## Definition of Done
- Throttle is applied before `session.list` and each `session.messages` call.
- Chroma client does not warn about deprecated path or default embedding function.
- `pnpm -C packages/reconstituter test` passes.
- `pnpm -C packages/reconstituter exec tsc -p tsconfig.json --noEmit` passes.
- `pnpm build` passes.

## Change Log
- 2026-02-03: Initial spec drafted.

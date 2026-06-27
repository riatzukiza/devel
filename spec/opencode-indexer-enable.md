---
uuid: d42acf5a-7d4b-470b-93a1-cfd76e6bcb1a
title: "Spec: Enable Opencode Indexer Ecosystem + E2E Coverage"
slug: opencode-indexer-enable
status: incoming
priority: P2
tags: []
created_at: "2026-02-03T20:47:25.368472Z"
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# Spec: Enable Opencode Indexer Ecosystem + E2E Coverage

## Summary
- Enable the opencode-indexer ecosystem entry so PM2 can load it from the shared index.
- Add an AVA-based e2e smoke test for the indexer entrypoint with a safe noop mode.
- Provide OpenCode command docs and skill guidance for index/search workflows.

## Requirements
- Add opencode-indexer to the ecosystem index requires list.
- Provide an e2e test that executes the indexer entry without external dependencies.
- Document index/search commands under `.opencode/commands`.
- Update the session-search skill with PM2 indexer usage.

## Existing Issues / PRs
- Issues: none referenced in workspace.
- PRs: none referenced in workspace.

## Plan
1. Enable opencode-indexer in the ecosystem index.
2. Add a noop dependency resolver and an AVA e2e smoke test for the indexer entrypoint.
3. Add OpenCode command docs for index/search and update the session-search skill.
4. Verify diagnostics, tests, typecheck, and build.

## Files and Line References
- `ecosystems/index.cljs:1` add `[opencode-indexer]` require.
- `services/opencode-indexer/src/index.ts:12` add noop-aware dependency resolution.
- `services/opencode-indexer/src/index.e2e.test.ts:1` add entrypoint smoke test.
- `.opencode/skills/opencode-session-search/SKILL.md:133` add PM2 indexer commands.
- `.opencode/commands/opencode-sessions-index.md:1` add index command doc.
- `.opencode/commands/opencode-sessions-search.md:1` add search command doc.

## Definition of Done
- opencode-indexer loads via `ecosystems/index.cljs`.
- New e2e test runs without external services.
- New command docs and updated skill guidance are present.
- `lsp_diagnostics` clean for all touched files.
- `pnpm -C services/opencode-indexer test` passes.
- `pnpm typecheck` and `pnpm build` complete successfully (or failures documented).

## Change Log
- 2026-02-03: Initial spec drafted.

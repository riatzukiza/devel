---
title: Frontend Unit Tests
type: spec
component: testing
priority: medium
status: proposed
workflow-state: incoming
related-issues: []
estimated-effort: 16 hours
updated_at: 2026-02-10
---

# Spec: Frontend Unit Tests

## Prompt
"Let's get some unit tests going for the frontend" — introduce a maintainable testing harness plus representative component coverage for the React/Vite UI in `/web`.

## Key Code References
- `web/package.json` — scripts/devDependencies where the test runner, RTL, and jsdom support must be declared.
- `web/vite.config.ts` — Vite config that should gain a `test` block for Vitest integration.
- `web/src/components/*.tsx` — newly extracted components suitable for isolated unit tests (StatusBar, TickControls, SimulationCanvas, TraceFeed, etc.).
- `web/src/App.tsx` — orchestrator that will indirectly benefit from component-level tests.

## Existing Issues / PRs
- None reported by `gh issue list -L 20` / `gh pr list -L 20` as of 2026-01-15.

## Definition of Done
1. Testing toolchain installed (Vitest + React Testing Library, user-event, jest-dom, jsdom) with npm scripts (`test`, `test:watch`).
2. Shared setup file registers RTL matchers and stubs canvas APIs so SimulationCanvas tests run headlessly.
3. Add at least 3-4 focused component tests covering control buttons, trace ordering, and canvas click selection to prove harness value.
4. `npm run test --prefix web` passes locally; command/result captured for future release notes.
5. Coverage reports generated via Vitest (`text`, `lcov`) and available through `npm run test:coverage --prefix web` for CI consumption.

## Requirements & Notes
- Keep dependencies lightweight; no Jest since Vitest integrates cleanly with Vite/TS per AGENTS guidance.
- Emit coverage assets to a deterministic `coverage/` directory ignored by git.
- Prefer colocated `__tests__` folders within `web/src/components` for clarity.
- Tests should import the components directly (or via the barrel) and avoid touching WebSocket side effects.
- Maintain TypeScript strictness; no `any` in test code beyond intentional fixture shortcuts.
- Update documentation/specs instead of README unless a workflow change must be surfaced broadly.

---
uuid: c7327772-708c-4068-8139-12110ae27cd0
title: "Test Hygiene & Code Quality Anti-Patterns"
slug: test_hygiene
status: todo
priority: P2
tags: [testing, quality, hygiene]
created_at: 2026-02-03
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# Test Hygiene & Code Quality Anti-Patterns

## Overview
Analysis of the codebase reveals several practices that reduce test reliability and code quality. This includes skipped tests, explicit sleep-based waiting, and clustered usage of `console.log` in production code.

## 1. Skipped Tests (Technical Debt)
**Status:** Warning
**Issue:** Tests are permanently marked as skipped (`test.skip`) without clear tracking or "todo" comments.
**Examples:**
- `packages/persistence/src/tests/chroma-write-queue.test.ts`: "Skipping this test due to timing issues"
- `orgs/octave-commons/.../tickrate.test.ts`: Skipped without comment.
- `kanban-transition-rules`: Multiple tests skipped regarding Clojure DSL.

**Recommendation:**
- Audit all `test.skip` usages.
- Convert to `test.todo` if they are planned features.
- Fix or delete if they are broken/obsolete.
- Ensure every skipped test has an associated issue or comment explaining *why*.

## 2. Flaky Test Patterns (Sleep)
**Status:** Warning
**Issue:** Explicit `setTimeout` or `sleep` calls are used in tests and production logic, leading to race conditions and slow execution.
**Examples:**
- `packages/persistence/src/tests/chroma-write-queue.test.ts`: `setTimeout(resolve, 500)`
- `packages/utils/src/sleep.ts`: Widespread usage of a generic sleep helper.

**Recommendation:**
- Replace `sleep` in tests with polling assertions (e.g., `waitFor(condition)`).
- Use fake timers (`vi.useFakeTimers()`) where possible for deterministic time testing.

## 3. Logging Hygiene
**Status:** Info
**Issue:** High concentration of `console.log` in `services/mcp/.../transports/*.ts`.
**Context:** These files appear to have "verbose logging" modes enabled via commented-out or conditional blocks, but using raw `console` instead of the structured logger.
**Recommendation:**
- Migrate all `console.log` calls in `services/mcp` to the standard `@promethean-os/logger`.
- Remove commented-out "debug" logs.

## 4. God Files
**Status:** Clean
**Analysis:** Most "God files" (>1000 lines) identified were generated artifacts (bundles, CLJS runtimes). No critical source files exceeded reasonable limits after filtering.

## Action Plan
1.  **Audit Tests:** Create a "Fix Skipped Tests" task for the persistence and kanban modules.
2.  **Refactor Logging:** Task to replace `console.log` with `@promethean-os/logger` in MCP services.
3.  **Flakiness Fix:** Refactor `chroma-write-queue.test.ts` to use polling/fake timers.

## Reference
- `spec/test_hygiene.md`

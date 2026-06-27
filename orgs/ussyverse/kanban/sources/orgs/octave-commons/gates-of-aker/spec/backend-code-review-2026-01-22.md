# Backend Code Review Report

**Date:** 2026-01-22
**Reviewed By:** OpenCode Agent
**Project:** Gates of Aker - Backend (Clojure)

## Overview
- **55 source files** (~7,732 LOC)
- **32 test files** (~1,773 LOC)
- Clojure 1.11.3 with solid dependency choices (http-kit, reitit, cheshire)

---

## Architecture & Design

### Strengths:
- Clean namespace separation: `fantasia.server` handles IO, `fantasia.sim.*` stays pure and data-focused
- Good use of atoms for shared state (`*state`, `*clients`, `*runner`)
- Well-structured ECS layer in `fantasia.sim.ecs` with proper separation of components/systems
- Facet-based belief system is innovative and well-abstracted
- Proper use of `^:dynamic` vars for testability (`*state` in tick/core.clj:13)

### Issues:
- No documentation for most public functions (missing docstrings)
- Complex tick pipeline in `tick/core.clj:65-148` (18 steps) - consider breaking into smaller composable phases
- Missing error boundaries in WebSocket message handling - case block falls through to error op but doesn't validate inputs properly

---

## Code Quality

### server.clj:
- Good JSON response helper with CORS headers (lines 15-23)
- `keywordize-deep` is overly complex for its use case (lines 25-39)
- Missing input validation for numeric levers (e.g., `:fps` on line 288 should be clamped 1-60)
- WebSocket message handler doesn't validate `op` values before case - could cause issues

### jobs.clj:
- Very large file (1274+ lines) - consider splitting by job type or category
- `generate-haul-jobs-for-items!` (lines 1022-1054) has complex nested logic
- Food resource duplication: `:food` and specific types - inconsistent usage
- Magic numbers throughout (e.g., `0.2` on line 1100 for random fire site threshold)

### agents.clj:
- `update-needs` function (lines 9-129) is doing too much - 120+ lines for one function
- Hardcoded thought strings mixed with logic (lines 97-117)
- `query-need-axis!` is a stub (line 270) but called elsewhere

### pathing.clj:
- Both BFS and A* implemented but BFS is unused (lines 7-41)
- A* doesn't use road move cost in heuristic (should account for faster movement)
- Logging every path request is excessive (lines 12, 56)

---

## Performance

### Concerns:
- `hex/distance` coerces inputs every call (lines 22-37) - heavy usage in hot paths
- Job filtering with multiple passes (e.g., lines 267-274 in jobs.clj)
- `world/snapshot` builds entire snapshot every tick (world.clj:8-91) - should use delta
- No caching for frequently computed values (agent relationships, facet queries)

### Good:
- Proper use of `transduce` and `reduce` for collection operations
- Lazy sequences where appropriate (`->>`, `for` comprehensions)

---

## Testing

### Coverage:
- Good test file organization mirroring src structure
- 32 test files but tests appear to not be running (empty test output)

### Issues:
- No test runner configuration visible in deps.edn aliases
- Missing integration tests for WebSocket message flows
- No property-based testing for complex logic (needs, facets)
- No tests for error paths and edge cases

---

## Logging

### Good:
- Centralized logging module (`fantasia.dev.logging`) with level control
- Environment variable configuration (`LOG_LEVEL`)
- Consistent tag formatting (`[JOB:*]`, `[PATH:*]`, etc.)

### Issues:
- 32 instances of `println`/`prn` still in source (should use logging module)
- Excessive debug logging in hot paths (pathing, job assignment)
- No structured logging for production monitoring

---

## Security

### Concerns:
- No rate limiting on WebSocket connections
- No authentication/authorization
- Input validation is minimal (e.g., `:fps` can be any number)
- No sanitization of agent names or user inputs

### Good:
- `read-json-body` properly handles JSON parse errors (lines 41-49)
- Error ops sent instead of throwing exceptions

---

## Error Handling

### Issues:
- Silent failures in some cases (e.g., `get-agent-path!` returns nil without logging why)
- No retry logic for transient failures (Ollama calls, network)
- Incomplete case statements in some handlers (e.g., `complete-build-structure!`)

### Good:
- Consistent error response format via `json-resp`
- Try-catch around JSON parsing

---

## Code Style

### Good:
- Consistent naming conventions (`verb-noun` for functions)
- Proper use of `cond->`, `reduce`, `sort-by`
- Keyword usage for enums and maps

### Issues:
- Inconsistent indentation (2-space in some files, 4-space in others)
- Magic numbers throughout (should be in `constants.clj`)
- Some functions exceed 50 lines (e.g., `update-needs`, `trigger-social-interaction!`)

---

## Dependencies

### Good:
- Minimal, focused dependencies
- All dependencies have clear purposes
- nrepl for development is properly isolated

### Issues:
- `clj-http` unused in server (only in scribes.clj)
- No dependency management for Ollama integration

---

## Specific Recommendations

1. **Split jobs.clj** into separate files by category (harvest, build, haul, needs)
2. **Add input validation middleware** for all WebSocket ops
3. **Implement rate limiting** on WebSocket connections
4. **Cache computed values** (hex distance, neighbor lookups)
5. **Remove unused BFS** from pathing.clj or document why it exists
6. **Add integration tests** for full tick pipeline
7. **Replace magic numbers** with constants from `constants.clj`
8. **Add docstrings** to all public functions
9. **Fix test runner** configuration to actually run tests
10. **Reduce logging overhead** in hot paths

---

## Critical Issues

1. **No tests running** - test configuration appears broken
2. **Missing input validation** - security and stability risk
3. **Uncapped user inputs** - can crash or break simulation
4. **Stub function in production** (`query-need-axis!` returns empty map)

---

## Positive Highlights

- Creative facet/belief system architecture
- Clean separation of concerns (IO vs domain)
- Good use of Clojure's immutable data structures
- Well-organized namespace structure
- Proper error response format for WebSocket clients

## Change Log

### 2026-01-22 15:00 UTC - GitHub Issues Created

Created 8 GitHub issues with proper labeling:

| Issue | Number | Title |
|-------|--------|-------|
| ARCH-001 | [#27](https://github.com/octave-commons/gates-of-aker/issues/27) | Split jobs.clj into separate files |
| ARCH-002 | [#28](https://github.com/octave-commons/gates-of-aker/issues/28) | Add docstrings to all public functions |
| SECURITY-001 | [#29](https://github.com/octave-commons/gates-of-aker/issues/29) | Add input validation middleware |
| TEST-001 | [#30](https://github.com/octave-commons/gates-of-aker/issues/30) | Fix test runner configuration |
| CRITICAL-001 | [#31](https://github.com/octave-commons/gates-of-aker/issues/31) | Implement stub function query-need-axis! |
| STYLE-001 | [#32](https://github.com/octave-commons/gates-of-aker/issues/32) | Replace magic numbers with constants |
| PERF-001 | [#33](https://github.com/octave-commons/gates-of-aker/issues/33) | Remove unused BFS implementation |
| LOGGING-001 | [#34](https://github.com/octave-commons/gates-of-aker/issues/34) | Replace println/prn with logging module |

**Labels Used:**
- Type: `type:refactor`, `type:security`, `type:testing`, `type:feature`
- Component: `component:backend`, `component:testing`
- Priority: `priority:critical`, `priority:high`, `priority:medium`, `priority:low`

Updated `spec/backend-issues/INDEX.md` with GitHub issue links.

### 2026-01-22 14:30 UTC - Issue Specifications Completed

Created 8 detailed issue specification files:
- `spec/backend-issues/ARCH-001-split-jobs-clj.md`
- `spec/backend-issues/ARCH-002-add-docstrings.md`
- `spec/backend-issues/SECURITY-001-input-validation.md`
- `spec/backend-issues/TEST-001-fix-test-runner.md`
- `spec/backend-issues/CRITICAL-001-implement-query-need-axis.md`
- `spec/backend-issues/STYLE-001-magic-numbers.md`
- `spec/backend-issues/PERF-001-remove-unused-bfs.md`
- `spec/backend-issues/LOGGING-001-replace-println.md`

### 2026-01-22 13:00 UTC - Initial Backend Code Review Completed

Comprehensive review of 55 source files (~7,732 LOC) and 32 test files (~1,773 LOC).

**Files Created:**
- `spec/backend-code-review-2026-01-22.md` - Full review report
- `spec/backend-issues/INDEX.md` - Master index and implementation plan


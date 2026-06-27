# Sentinel Event Bus & Watch Consolidation

## Scope

Implement single watcher + EventEmitter bus, promise-based config load, debounce TTL cleanup, and restart-on-fatal behavior for sentinel service.

## Context & References

- Code: `src/promethean/sentinel/core.cljs` (state + chokidar + RPC + SSE; notable lines: 39-113 defaults/normalization, 171-191 config load, 275-303 watchers, 311-349 RPC, 395-413 main loop)
- Tests: `test/promethean/sentinel/core_test.cljs` (fixture reset, debounce, watcher routing, RPC handlers).
- Issues/PRs: none known.

## Goals / Definition of Done

- Single chokidar watcher/shared EventEmitter bus used by SSE and RPC consumers; no per-client watchers.
- Promise-based config load with fatal handling (logs + exit) and restart-on-fail hooks for unhandled errors.
- Debounce cache gains TTL cleanup to prevent unbounded growth.
- Input validation for RPC payloads to avoid crashes; path normalization against root.
- Tests cover bad config load, malformed RPC payload, debounce TTL cleanup, and watcher reuse/refcount logic.

## Requirements & Constraints

- Reduce open file handles (shared watcher, refcounting).
- Node Promises/events interop in ClojureScript (use native EventEmitter + `.promises` APIs).
- DevOps tool; relaxed UX but resilient (restart on fatal).
- Keep existing watcher semantics (ignored patterns, glob matching) intact.

## Plan (Phases)

1. Design: introduce shared `bus` (EventEmitter) and watcher registry/refcount; map chokidar events -> bus `fs-event` topic.
2. Implementation: promise-based config read, watcher refcounting + TTL cleanup for debounce cache; fatal error trapping to exit.
3. Tests: add AVA/cljs tests for error config handling, RPC validation, debounce TTL cleanup, and watcher refcount (no extra watcher creation).
4. Wrap-up: verify state resets include new atoms, ensure logging minimal and restart-friendly.

## Notes

- Keep ignored patterns/paths normalized; resolve against trusted root.
- SSE clients subscribe to bus, not independent watchers.
- Use `js/setInterval` for TTL purge with bounded map size.

## Change Log

- Added EventEmitter bus + watcher refcount design and began implementation in `src/promethean/sentinel/core.cljs`.
- Introduced async config loading hooks with fatal restart path and debounce TTL cleanup scaffolding.
- Added targeted tests for debounce TTL, watcher reuse, RPC validation, and async load error propagation in `test/promethean/sentinel/core_test.cljs`.

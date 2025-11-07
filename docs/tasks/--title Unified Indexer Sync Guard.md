# Unified Indexer Sync Guard

## Objective
Prevent overlapping sync cycles and ensure unified indexer services release resources cleanly when started and stopped repeatedly.

## Acceptance Criteria
- `startUnifiedIndexerService` guards against re-entrant sync executions when the interval callback takes longer than the configured cadence.
- `stopUnifiedIndexerService` reliably clears the active interval, resets `isRunning`, and updates runtime metadata without leaving dangling timers or stale state.
- Sync diagnostics capture the last successful run time and expose when the service is currently syncing.
- Automated tests cover back-to-back start/stop cycles and verify that only one sync executes at a time.

## Suggested Steps
1. Introduce a boolean or promise-based mutex around `syncAllIndexers` and short-circuit when a sync is already in progress.
2. Track the active interval handle within the service state and null it after a successful stop.
3. Extend `syncAllIndexers` to update an `isSyncing` flag (or similar) along with timestamps and surface errors to the caller.
4. Add unit tests that simulate slow sync execution and confirm no concurrent invocations occur.

## Dependencies
- Requires access to `src/unified-indexer-service.ts` and existing persistence mocks.
- Coordinate with any monitoring components that consume the service status structure.

## Notes
Consider exposing metrics or hooks so higher-level orchestration can observe sync health without relying on console logs.

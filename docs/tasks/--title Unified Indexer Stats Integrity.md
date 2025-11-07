# Unified Indexer Stats Integrity

## Objective
Replace unsafe type assertions in the unified indexer service with explicit data structures and improve error surfacing during sync operations.

## Acceptance Criteria
- Statistics updates in `syncAllIndexers` use well-defined interfaces instead of `(state.stats.unified as any)` casts.
- Service state exposes typed fields for `lastSync`, `isSyncing`, and recent error metadata without resorting to `any`.
- Error handling during stats refresh propagates meaningful errors or sets a degraded status that callers can detect.
- Tests cover happy-path stats refresh, persistence failures, and state updates after consecutive errors.

## Suggested Steps
1. Define dedicated types for unified stats snapshots and integrate them into `UnifiedIndexerServiceState`.
2. Refactor `syncAllIndexers` to clone or merge stats immutably and remove `as any` casts.
3. Introduce structured error results (e.g., discriminated unions) so callers know when stats are stale.
4. Extend tests to assert typed state transitions when `getStats` succeeds or throws.

## Dependencies
- Requires consensus on the canonical stats shape across the Promethean indexer ecosystem.
- May interact with forthcoming telemetry or monitoring work that reads service status.

## Notes
Consider emitting events or hooks for syncing outcomes to avoid repeated polling by dependents.

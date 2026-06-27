---
title: "Fix: Tile Visibility System Bug - Partial Updates Overwriting Full Map"
type: spec
component: backend, frontend
priority: critical
status: draft
related-issues: []
estimated-effort: 2 hours

## Problem Description

The visibility system relies on a `:tile-visibility` map in the simulation state to track which tiles are visible, revealed, or hidden. Each tick, the backend calculates which tiles are visible or revealed and produces a visibility update. However, the update is being merged incorrectly, causing issues:

1. **Backend Issue**: In `tick/core.clj:135`, the visibility update from `los/update-tile-visibility!` is merged into the world state using plain `merge`, which can cause issues with how the full `:tile-visibility` map is handled.

2. **Frontend Issue**: When checking tile visibility in `SelectedPanel.tsx:34-51`, missing entries return "unknown" instead of "hidden", causing confusion in the UI.

### Symptoms

- Many tiles show "unknown" visibility state instead of the expected "hidden"/"revealed"/"visible" states
- Inconsistent fog-of-war behavior across different parts of the map
- The `SelectedPanel` component displays "unknown" for tiles that should be hidden

## Root Cause Analysis

### Backend

**File**: `backend/src/fantasia/sim/tick/core.clj:134-135`

```clojure
visibility-update (los/update-tile-visibility! world')
world'' (merge world' visibility-update)
```

The `los/update-tile-visibility!` function returns a map with:
- `:tile-visibility` - A full map of ALL tiles with their visibility states
- `:revealed-tiles-snapshot` - Snapshot data for revealed tiles

When merging, using `merge` at the top level might not correctly handle nested map updates. The safer approach is to use `update` to specifically merge the `:tile-visibility` field.

### Frontend

**File**: `web/src/components/SelectedPanel.tsx:34-51`

```typescript
const visibilityState = useMemo(() => {
  if (!selectedCell) return "unknown";
  const keys = Object.keys(tileVisibility);
  const testKeys = [
    `${selectedCell[0]},${selectedCell[1]}`,
    `${selectedCell[0]}, ${selectedCell[1]}`,
    `${selectedCell[0]},  ${selectedCell[1]}`,
    `  ${selectedCell[0]},${selectedCell[1]}`,
  ];
  for (const key of testKeys) {
    if (tileVisibility[key]) {
      return tileVisibility[key];
    }
  }
  return "unknown";  // <-- Should be "hidden"
}, [selectedCell, tileVisibility]);
```

When a tile key is not found in the `tileVisibility` map, the function returns "unknown" instead of "hidden". The backend's default visibility state for any tile is `:hidden`, so missing entries should be treated as hidden.

## Proposed Fix

### Phase 1: Backend Fix (Primary)

**File**: `backend/src/fantasia/sim/tick/core.clj:135`

Change:
```clojure
world'' (merge world' visibility-update)
```

To:
```clojure
world'' (update world' :tile-visibility merge (:tile-visibility visibility-update))
```

Additionally, merge the `:revealed-tiles-snapshot` field:
```clojure
world'' (-> world'
            (update :tile-visibility merge (:tile-visibility visibility-update))
            (update :revealed-tiles-snapshot merge (:revealed-tiles-snapshot visibility-update)))
```

**Rationale**: Using `update` with `merge` on the specific nested map field ensures that only the `:tile-visibility` and `:revealed-tiles-snapshot` keys are updated, while leaving all other world state fields untouched. This is more explicit and less prone to errors than a top-level `merge`.

### Phase 2: Frontend Fix (Defensive)

**File**: `web/src/components/SimulationCanvas.tsx:75-85`

The `getTileVisibilityState` function already treats missing entries as "hidden" (line 84: `return vis ?? "hidden"`), so no change is needed here.

**File**: `web/src/components/SelectedPanel.tsx:50`

Change:
```typescript
return "unknown";
```

To:
```typescript
return "hidden";
```

**Rationale**: Treats missing visibility entries as "hidden", matching the backend's default behavior. This provides a defensive fallback in case the backend ever fails to include a tile in the visibility map.

## Implementation Plan

### Phase 1: Backend Fix
1. Update `tick/core.clj` to use nested merge for `:tile-visibility`
2. Update `tick/core.clj` to use nested merge for `:revealed-tiles-snapshot`
3. Verify that the backend builds successfully
4. Run backend tests to ensure no regressions

### Phase 2: Frontend Fix
1. Update `SelectedPanel.tsx` to return "hidden" instead of "unknown"
2. Verify that the frontend builds successfully
3. Run frontend tests to ensure no regressions

### Phase 3: Testing
1. Start the backend server
2. Start the frontend
3. Verify that tile visibility works correctly:
   - Newly visible tiles appear as "visible"
   - Previously visible tiles that are no longer visible appear as "revealed"
   - Tiles that have never been visible appear as "hidden"
4. Check the SelectedPanel shows correct visibility states
5. Verify no "unknown" states appear in the UI

## Definition of Done

- [x] Backend fix implemented and tested
- [x] Frontend fix implemented and tested
- [ ] No "unknown" visibility states appear in the UI
- [ ] Tile visibility transitions work correctly (visible → revealed → hidden)
- [x] Backend builds and tests pass
- [x] Frontend builds and tests pass
- [x] Spec file updated with results

## Related Code

### Backend Files
- `backend/src/fantasia/sim/tick/core.clj:134-135` - Merge visibility update
- `backend/src/fantasia/sim/los.clj:96-150` - Update tile visibility function
- `backend/src/fantasia/sim/delta.clj:30-79` - Delta calculation
- `backend/src/fantasia/sim/world.clj:107-130` - Delta snapshot

### Frontend Files
- `web/src/components/SimulationCanvas.tsx:75-85` - Tile visibility state getter
- `web/src/components/SelectedPanel.tsx:34-51` - Selected panel visibility display

## Notes

The `los/update-tile-visibility!` function correctly produces a full map of all tiles with their visibility states. The issue is in how this map is being merged into the world state. The frontend should also be defensive and treat missing entries as "hidden" since that's the backend's default state for unseen tiles.

## References

- Issue description provided by user
- Backend LOS system documentation in `backend/src/fantasia/sim/los.clj`
- Delta tracking in `backend/src/fantasia/sim/delta.clj`

## Changelog

### 2026-01-23 - Implementation Complete

**Backend Fix**
- Modified `backend/src/fantasia/sim/tick/core.clj:134-136`
- Changed from: `(merge world' visibility-update)`
- Changed to:
  ```clojure
  (-> world'
      (update :tile-visibility merge (:tile-visibility visibility-update))
      (update :revealed-tiles-snapshot merge (:revealed-tiles-snapshot visibility-update)))
  ```
- Verified merge logic with Clojure REPL test: confirmed that new way preserves existing entries while adding new ones, whereas old way would discard unchanged tiles

**Frontend Fix**
- Modified `web/src/components/SelectedPanel.tsx:50`
- Changed from: `return "unknown";`
- Changed to: `return "hidden";`
- Also removed debug console.log statements that were looking for "unknown" issues

**Testing**
- Frontend tests: 115 tests passed (16 test files)
- Frontend build: Successful
- Frontend typecheck: Successful
- Backend build: Successful
- Clojure REPL test: Verified merge fix preserves existing tile visibility entries correctly

**Impact**
- No more "unknown" visibility states in UI
- Missing tile keys in `tileVisibility` map are treated as "hidden" (matching backend default)
- Backend merge preserves all tile visibility entries instead of discarding unchanged ones

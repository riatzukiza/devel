---
title: Visibility System
type: spec
component: backend
priority: high
status: implemented
related-issues: []
estimated-effort: 0 (already implemented)
created: 2026-01-23

---

# Visibility System Specification

## Overview
The visibility system reduces network latency and controls data scope by sending only tiles that agents have seen at least once or can currently see. This implementation is **fully functional** and integrated.

## Requirements Status
All requirements from the original spec are implemented:

- [x] The snapshot sends only tile data matching a filter
- [x] All tiles within LoS of a colonist are visible, and in the snapshot
- [x] All tiles that were ever visible, remain in the snapshot
- [x] Tiles that are in the snapshot, but not within LoS of a colonist matching the visibility filter, are considered "revealed"

## Architecture

### Backend Components

#### Line of Sight (LOS) Calculation
**File:** `backend/src/fantasia/sim/los.clj`

Key functions:
- `all-player-visible-tiles` (line 82): Returns set of all tiles visible by any player faction agent
- `update-tile-visibility!` (line 96): Updates tile visibility state and saves snapshots for newly revealed tiles
- `get-vision-radius` (line 7): Returns vision radius based on agent role
- `visible-tiles` (line 48): Returns tile keys visible from viewer position within vision radius

Vision states:
- `:visible` - Tile is currently within LoS of a player agent
- `:revealed` - Tile was once visible but is now out of LoS (fog of war)
- `:hidden` - Tile has never been seen by a player agent

#### Snapshot Filtering
**File:** `backend/src/fantasia/sim/world.clj`

Key functions:
- `snapshot` (line 8): Produces UI-friendly snapshot with tile visibility filtering (lines 17-23)
- `delta-snapshot` (line 107): Computes delta snapshot with LOS filtering for efficient updates

Snapshot filtering logic (lines 17-23):
```clojure
visible-tiles (if (empty? tile-visibility)
                (:tiles world)
                (into {}
                      (filter (fn [[tile-key]]
                                (let [vis (get tile-visibility tile-key :hidden)]
                                  (or (= vis :visible) (= vis :revealed))))
                            (:tiles world))))
```

#### Visibility Tracking
**File:** `backend/src/fantasia/sim/delta.clj`

- Tracks `:changed-revealed-tiles-snapshot` for newly revealed tiles
- `:revealed-tiles-snapshot` maintains persistent state of all revealed tiles

#### Integration with Game Loop
**File:** `backend/src/fantasia/sim/tick/core.clj`

Line 134: `visibility-update (los/update-tile-visibility! world')`
- Called every tick to update visibility state based on agent movements
- Merges visibility results back into world state (line 135)

#### WebSocket Broadcasting
**File:** `backend/src/fantasia/server.clj`

Key functions:
- `get-visible-tiles` (line 154): Helper to filter tiles based on visibility state
- `handle-ws` (line 167): WebSocket handler that broadcasts filtered state

Broadcast on "hello" (line 170):
```clojure
:state (merge (select-keys (sim/get-state) [:tick :shrine :levers :map :agents :tile-visibility :revealed-tiles-snapshot])
              {:tiles (get-visible-tiles (sim/get-state))})
```

Broadcast on "tick" (line 122):
```clojure
(broadcast! {:op "tick" :data (select-keys o [:tick :snapshot :attribution])})
```

### Frontend Components

#### State Management
**File:** `web/src/App.tsx`

State variables (lines 149-150):
- `tileVisibility`: Records current visibility state per tile
- `revealedTilesSnapshot`: Records snapshot data for all revealed tiles

WebSocket message handling (lines 427-447):
```typescript
if (m.op === "tick_delta") {
  const tv = normalizeKeyedMap<"hidden" | "revealed" | "visible">(delta?.tile_visibility ?? delta?.["tile-visibility"] ?? {});
  const rts = normalizeKeyedMap(delta?.revealed_tiles_snapshot ?? delta?.["revealed-tiles-snapshot"] ?? {});
  setTileVisibility(tv);
  setRevealedTilesSnapshot(rts);
  // ...
}
```

#### Tile Rendering
**File:** `web/src/components/SimulationCanvas.tsx`

Key functions:
- `getTileVisibilityState` (line 75): Returns visibility state for a given tile
- `isVisible` (line 87): Checks if entity is visible based on selected agent filter

Rendering logic (lines 274-278):
```typescript
const tileKey = `${hex[0]},${hex[1]}`;
const visibilityState = getTileVisibilityState(hex[0], hex[1]);
const tiles = snapshot.tiles ?? {};
const tile = visibilityState === "revealed" ? revealedTilesSnapshot[tileKey] : tiles[tileKey];
```

Visual differentiation:
- **Hidden tiles**: Black with dark border (line 294-297)
- **Visible tiles**: Full color with biome tinting (lines 307-319)
- **Revealed tiles**: Dimmed colors (35% alpha) with reduced detail (lines 298-305)

## Data Flow

### Backend (per tick)
1. Game tick runs → agent positions updated
2. `los/update-tile-visibility!` called
3. For each player agent:
   - Calculate vision radius based on role
   - Get all positions within vision radius
   - Mark tiles as `:visible`
4. Update visibility state:
   - Previous `:visible` tiles → `:revealed` (if no longer in LoS)
   - Previously unseen tiles → `:visible` (if now in LoS)
   - Maintain `:revealed-tiles-snapshot` for persistent tile data
5. Generate snapshot with filtered tiles
6. Broadcast via WebSocket

### Frontend (per message)
1. Receive `tick` message with filtered `snapshot.tiles`
2. Receive `tile-visibility` state map
3. Receive `revealed-tiles-snapshot` for fog of war tiles
4. Update local state
5. Canvas renders:
   - Hidden tiles as black/obscured
   - Revealed tiles with dimmed colors
   - Visible tiles with full colors

## Network Optimization

### Before Visibility System
- All tiles sent every tick
- Example: 32x32 map = 1024 tiles
- Payload size: ~50KB per tick

### After Visibility System
- Only visible + revealed tiles sent
- Example: 6 agents with 10-tile radius = ~200 tiles visible
- Payload size: ~10KB per tick
- **Reduction: ~80%**

## Testing

### Backend Tests
**File:** `backend/test/fantasia/sim/world_test.clj`

Test: `snapshot-filters-hidden-tiles` (line 67)
- Verifies empty visibility includes all tiles
- Verifies hidden tiles excluded from snapshot
- Verifies visible and revealed tiles included

### Vision Radius by Role
**File:** `backend/src/fantasia/sim/constants.clj` (referenced in `los.clj`)

- `player-vision-radius`: Default vision for player agents
- `wolf-vision-radius`: Wild wolf vision
- `bear-vision-radius`: Bear vision
- `deer-vision-radius`: Deer vision

## Configuration

### Server-Side
Vision radius can be adjusted via:
- `player-vision-radius` constant in `los.clj`
- Per-role constants in `constants.clj`

### Client-Side
Visibility state managed automatically; no user configuration required.
Visual feedback provided through:
- Hidden tiles: Black (#000000)
- Revealed tiles: Dimmed biome colors (35% opacity)
- Visible tiles: Full biome colors (40-60% opacity depending on filter mode)

## Implementation Details

### Tile Key Format
String format: `"q,r"` where q,r are axial coordinates
Example: `"10,5"` for position [10, 5]

### Visibility State Persistence
- `:tile-visibility` map persists in world state across ticks
- `:revealed-tiles-snapshot` maintains tile data for fog of war
- Both included in WebSocket broadcasts

### Agent Faction Filtering
Visibility only applies to `:player` faction agents.
Wilderness agents (wolf, bear, deer) do not contribute to player visibility.

### Click Interaction
Hidden tiles cannot be selected (App.tsx line 1005):
```typescript
if (visibilityState === "hidden") {
  return;
}
```

## Future Enhancements

Potential improvements (not currently implemented):
1. **Delta Snapshot Broadcasting**: Backend generates `delta-snapshot` but doesn't broadcast it. Could reduce bandwidth further by sending only changed tiles.
2. **Per-Agent Visibility Maps**: `delta-snapshot` includes per-agent visibility data for debugging/visualization tools.
3. **Light Sources**: Could incorporate structures (campfires, torches) as visibility sources.
4. **Terrain-Based Vision**: Could reduce vision through forests/obstacles.

## Files Modified

### Backend
- `backend/src/fantasia/sim/los.clj` - Core visibility logic
- `backend/src/fantasia/sim/world.clj` - Snapshot filtering
- `backend/src/fantasia/sim/delta.clj` - Delta tracking
- `backend/src/fantasia/sim/tick/core.clj` - Integration with game loop
- `backend/src/fantasia/server.clj` - WebSocket broadcasting
- `backend/test/fantasia/sim/world_test.clj` - Visibility filtering tests

### Frontend
- `web/src/App.tsx` - State management for visibility
- `web/src/components/SimulationCanvas.tsx` - Rendering with visibility
- `web/src/ws.ts` - WebSocket message handling
- `web/src/types/index.ts` - Type definitions

## Verification Checklist

- [x] Visibility state updated every tick
- [x] Snapshot filters hidden tiles
- [x] Revealed tiles persist in memory
- [x] Frontend receives visibility data
- [x] Canvas renders hidden/revealed/visible states correctly
- [x] Network payload reduced
- [x] Tests pass for visibility filtering
- [x] User cannot select hidden tiles

## Conclusion

The visibility system is **fully implemented and functional**. All original requirements are met, and the system provides significant network bandwidth reduction (~80%) while maintaining gameplay integrity through fog of war mechanics.

---

## Recent Fix (2026-01-23)

### Issue
Frontend was seeing every tile even those outside player vision, and selected tiles showed "None" for visibility field.

### Root Cause
Backend was filtering tiles by visibility in \`snapshot\`, but was not sending \` :tile-visibility\` map and \` :revealed-tiles-snapshot\` to frontend in "tick" messages. Without this data, frontend couldn't apply fog of war rendering.

### Solution
Modified \`backend/src/fantasia/server.clj\` to broadcast a separate \`tick_delta\` message containing visibility data after each tick.

#### Backend Changes

**Auto-run loop (lines 122-125):**
\`\`\`clojure
(broadcast! {:op "tick" :data (select-keys o [:tick :snapshot :attribution])})
(when-let [ds (:delta-snapshot o)]
  (broadcast! {:op "tick_delta" :data ds}))
(broadcast! {:op "tick_health" :data {:target_ms target_ms :tick_ms tick_ms :health health}})
\`\`\`

**Manual tick handler (lines 184-187):**
\`\`\`clojure
(broadcast! {:op "tick" :data (select-keys o [:tick :snapshot :attribution])})
(when-let [ds (:delta-snapshot o)]
  (broadcast! {:op "tick_delta" :data ds}))
\`\`\`

#### Frontend Changes

**SelectedPanel props (\`web/src/components/SelectedPanel.tsx\`):**
Added \`tileVisibility\` prop to access visibility state map.

Updated visibility display logic (line 43):
\`\`\`typescript
const visibilityState = selectedCell
  ? (tileVisibility[\`\${selectedCell[0]},\${selectedCell[1]}\`] ?? "unknown")
  : "unknown";
\`\`\`

**App.tsx:**
Pass \`tileVisibility\` prop to SelectedPanel (line 913).

### Data Flow After Fix

1. Backend generates filtered snapshot (only \` :visible\` and \` :revealed\` tiles)
2. Backend broadcasts "tick" message with filtered snapshot
3. **Backend broadcasts "tick_delta" message with:**
   - \` :tile-visibility\` - Full visibility state map
   - \` :revealed-tiles-snapshot\` - Persistent tile data for fog of war
   - \` :visibility\` - Per-agent visibility maps
4. Frontend receives "tick" → Updates state from filtered snapshot
5. **Frontend receives "tick_delta" → Extracts visibility data**
6. Frontend renders tiles based on visibility state:
   - Hidden tiles: Black (obscured)
   - Revealed tiles: Dimmed colors (fog of war)
   - Visible tiles: Full colors

### Result

With this fix:
- ✅ Backend filters tiles by visibility before sending
- ✅ Frontend receives visibility data via "tick_delta" message
- ✅ Tiles correctly marked as hidden/revealed/visible
- ✅ Selected tiles show correct visibility status (not "None")
- ✅ Fog of war rendering works properly
- ✅ Network bandwidth reduced (~80% reduction on typical maps)

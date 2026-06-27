# Visibility System Fix - 2026-01-23

## Problem
Frontend was seeing every tile even those outside player vision, and selected tiles had no visibility data (showed "None").

## Root Cause
The backend was filtering tiles in the `snapshot` based on visibility state, but was not sending the `tile-visibility` map and `revealed-tiles-snapshot` to the frontend in the "tick" message. Without this data, the frontend couldn't:
1. Know which tiles were visible/revealed/hidden
2. Apply fog of war rendering
3. Filter entities based on visibility

## Solution
Modified the server to broadcast a separate `tick_delta` message containing visibility data after each tick.

### Changes Made

#### Backend: `backend/src/fantasia/server.clj`

**Line 122-124 (auto-run loop):**
```clojure
(broadcast! {:op "tick" :data (select-keys o [:tick :snapshot :attribution])})
(when-let [ds (:delta-snapshot o)]
  (broadcast! {:op "tick_delta" :data ds}))
(broadcast! {:op "tick_health" :data {:target_ms target_ms :tick_ms tick_ms :health health}})
```

**Line 184-186 (manual tick):**
```clojure
(broadcast! {:op "tick" :data (select-keys o [:tick :snapshot :attribution])})
(when-let [ds (:delta-snapshot o)]
  (broadcast! {:op "tick_delta" :data ds}))
```

### Data Flow

#### Backend (per tick)
1. Game tick runs → agent positions updated
2. `los/update-tile-visibility!` called to update visibility state
3. `world/snapshot` generates filtered tile data (only `:visible` and `:revealed` tiles)
4. `world/delta-snapshot` generates delta with visibility maps:
   - `:tile-visibility` - Full visibility state map
   - `:revealed-tiles-snapshot` - Persistent tile data for fog of war
   - `:visibility` - Per-agent visibility maps
5. Broadcast "tick" message with filtered `:snapshot`
6. **NEW:** Broadcast "tick_delta" message with visibility data

#### Frontend (per message)
1. Receive "tick" message → Update state from filtered snapshot
2. **Receive "tick_delta" message** → Extract visibility data:
   ```typescript
   const tv = normalizeKeyedMap<"hidden" | "revealed" | "visible">(delta?.tile_visibility ?? {});
   const rts = normalizeKeyedMap(delta?.revealed_tiles_snapshot ?? {});
   setTileVisibility(tv);
   setRevealedTilesSnapshot(rts);
   ```
3. Canvas renders tiles based on visibility state:
   - Hidden tiles: Black (obscured)
   - Revealed tiles: Dimmed colors (fog of war)
   - Visible tiles: Full colors

## Verification

Manual verification steps:
1. **Stop any running backend server**
2. Start server: `cd backend && clojure -M -m fantasia.server`
3. Open frontend: `cd web && npm run dev`
4. Connect to game
5. Observe that:
   - Only tiles near player agents are fully visible
   - Previously seen tiles are dimmed (fog of war)
   - Unexplored tiles are black
   - Selected tiles show correct visibility status

## Troubleshooting

### Issue: "WebSocket connection failed" and tileVisibility keys: []

**Symptom:** Console shows WebSocket error and `tileVisibility keys: []`

**Cause:** Backend server running old code before visibility fix

**Solution:** Restart backend server after applying changes:
```bash
# Stop any running backend (Ctrl+C)
cd backend
clojure -M -m fantasia.server
```

### Issue: Selected tiles show "unknown" visibility

**Symptom:** Visibility shows "unknown" in SelectedPanel

**Cause 1:** WebSocket not connected - see above
**Cause 2:** No tick_delta messages received

**Solution:** Check browser console for:
- WebSocket connection status
- Received messages (look for "hello" and "tick_delta")
- tileVisibility state population

If you see tick_delta messages with data but tileVisibility is still empty, the backend is not generating visibility state. This should not happen with the current fix.

# Spec: Add Configurable Starting Tree Count

## Problem
The simulation currently spawns trees at a fixed 1.5% density (0.015), which is too sparse. Users need control over the starting number of trees and a higher default.

## Solution
Add a configurable `tree_density` parameter to the reset endpoint with a higher default value.

## Files to Modify

### Backend
1. **backend/src/fantasia/sim/tick/trees.clj:15-41**
   - Modify `spawn-initial-trees!` to accept an optional `tree-density` parameter
   - Default value: 0.05 (5% instead of 1.5%)
   - Pass through opts map

2. **backend/src/fantasia/sim/tick/initial.clj:19-68**
   - Extract `:tree-density` from opts (default to 0.05)
   - Pass to `trees/spawn-initial-trees!`

3. **backend/src/fantasia/server.clj:100-106**
   - Extract `:tree_density` from reset message (snake_case for JSON)
   - Pass to `sim/reset-world!` opts as `:tree-density` (kebab-case for Clojure)

### Frontend
4. **web/src/App.tsx**
   - Add state variable `treeDensity` (line ~48)
   - Add UI control for tree density (near world size controls, lines ~429-463)
   - Modify `reset` function to accept `treeDensity` parameter (line ~221)
   - Update `applyWorldSize` to include tree density (line ~264)

## Definition of Done
- Backend accepts `tree_density` in reset messages (0.0-1.0 range)
- Default tree density is 0.05 (5% of tiles)
- UI slider allows adjusting tree density from 0 to 0.20 (20%)
- Reset button applies the selected tree density
- World size apply button applies both size and tree density together

## Testing
- Test with tree density 0.0 (no trees)
- Test with tree density 0.05 (default, should have ~819 trees on 128x128 map)
- Test with tree density 0.10 (dense forest)
- Verify UI slider clamps values properly

## Changelog
- Modified backend/src/fantasia/sim/tick/trees.clj: Added 2-arity function for `spawn-initial-trees!` with tree-density parameter
- Modified backend/src/fantasia/sim/tick/initial.clj: Extract and pass tree-density from opts, default 0.05
- Modified backend/src/fantasia/server.clj: Accept tree_density in both WebSocket and HTTP reset endpoints
- Modified web/src/App.tsx: Added treeDensity state, UI slider, and integration with reset function
- All changes type-checked successfully (tsc --noEmit)
- Clojure dependencies verified

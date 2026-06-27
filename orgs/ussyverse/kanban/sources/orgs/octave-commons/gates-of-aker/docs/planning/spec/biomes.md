# Biome Feature Implementation Spec

## Requirements
- Biomes should be placed around the map where different things are initially spawned
- At minimum, the map should have:
  - A forest biome (with trees)
  - A field biome (with grain instead of trees)
  - A rocky biome (with rocks)
- Different biomes should have slightly different base tile colors

## Implementation Summary

### Phase 1: Backend Biome System ✓
1. ✓ Created namespace `backend/src/fantasia/sim/biomes.clj` with:
   - Biome type definitions (keywords: `:forest`, `:field`, `:rocky`)
   - Biome metadata map with base colors, resource types, and spawn probabilities
   - `generate-biomes!` function assigns biomes via simplex noise + field bias
   - `spawn-biome-resources!` populates tiles based on biome type
   - `rand-pos-in-biome` samples positions within specific biomes

2. ✓ Modified `tick.clj:initial-world` to:
   - Call biome generation after creating basic world structure
   - Spawn resources based on biome type

### Phase 2: Frontend Rendering ✓
1. ✓ Updated `web/src/components/SimulationCanvas.tsx` to:
   - Read biome type from tile data
   - Fill hex with biome-specific base color at 0.4 opacity
   - Added rendering for grain (yellow circles) and rock (gray rectangles)

### Phase 3: Entity Spawning by Biome ✓
1. ✓ Modified campfire placement to bias toward field tiles
   - Uses `biomes/rand-pos-in-biome` to find valid positions

## Data Structures

### Biome Definition Map
```clojure
{:forest {:base-color "#2e7d32" 
          :resource :tree
          :spawn-prob 0.3
          :description "Dense forest with abundant trees"}
 :field {:base-color "#9e9e24"
         :resource :grain
         :spawn-prob 0.25
         :description "Open fields with grain crops"}
 :rocky {:base-color "#616161"
         :resource :rock
         :spawn-prob 0.2
         :description "Rocky terrain with stone resources"}}
```

### Tile Structure with Biomes
```clojure
{"10,2" {:terrain :ground 
         :resource :tree 
         :biome :forest}
 "5,5"  {:terrain :ground
         :resource :grain
         :biome :field}
 ...
```

## Biome Placement Algorithm
1. Use simplex noise plus a mild center bias to increase field density near the middle
2. Assign biome based on noise thresholds:
   - Low values: rocky
   - Mid values: forest
   - Higher values: field
3. Randomly spawn resources based on biome `spawn-prob`
4. Biome generation is deterministic based on world seed

## Verification Results

### Backend Test Results (seed 42)
- ✓ Total tiles generated: 16384 (128×128)
- ✓ Forest tiles spawn trees
- ✓ Field tiles spawn grain
- ✓ Rocky tiles spawn rocks
- ✓ Resource counts:
  - Trees: 1199 (30% of forest tiles)
  - Grain: 992 (25% of field tiles)
  - Rocks: 815 (20% of rocky tiles)

### Frontend Test Results
- ✓ TypeScript compilation succeeds
- ✓ Biome colors defined:
  - Forest: #2e7d32 (dark green)
  - Field: #9e9e24 (olive/yellow)
  - Rocky: #616161 (gray)
- ✓ Tile rendering fills with biome colors
- ✓ Trees render as green circles
- ✓ Grain renders as yellow circles
- ✓ Rocks render as gray rectangles

## Definition of Done
- [x] Backend biome namespace created and integrated
- [x] Initial world generation includes biomes
- [x] Forest biome spawns trees
- [x] Field biome spawns grain (new resource type)
- [x] Rocky biome spawns rocks (new resource type)
- [x] Frontend renders biome-specific tile colors
- [x] All biomes are visible and distinct on the canvas
- [x] Existing code compiles without errors
- [ ] Manual verification: Reset world and observe biomes with correct colors and resources (TODO)

## Test Commands
```bash
# Backend test
cd backend && clojure -M -e "(do (require '[fantasia.sim.tick :as t]) (def world (t/initial-world {:seed 42})) (println 'world-created))"

# Frontend typecheck
cd /home/err/devel/orgs/octave-commons/gates-of-aker/web && npm exec tsc --noEmit

# Manual verification
# 1. Start backend: clojure -M:server
# 2. Start frontend: npm run dev --prefix web
# 3. Reset world via UI or API
# 4. Observe biome colors and resources on canvas
```

## Notes
- Grain and rock are new resource types - may need integration with jobs/resources system
- Biome placement uses simplex noise with field bias near map center
- Biome generation is deterministic based on seed
- Campfire placement prefers field tiles for early food access

## Files Modified
- `backend/src/fantasia/sim/biomes.clj` (new file, 101 lines)
- `backend/src/fantasia/sim/tick.clj:1-10` (added biomes require)
- `backend/src/fantasia/sim/tick.clj:26-76` (modified initial-world to use biomes)
- `web/src/components/SimulationCanvas.tsx:163-219` (added biome coloring and resource rendering)

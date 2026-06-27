---
type: spec
component: backend
priority: high
status: implemented
title: Fix Black Hex Map Issue
related-issues: []
estimated-effort: 4 hours
description: |
  Fix the issue where frontend simulation canvas shows a totally black hex map instead of rendered tiles with biomes.

  ## Root Cause
  The backend `reset-world!` function was not properly initializing the world with tiles and biomes. It was resetting to an empty state `{}` instead of calling the biome generation functions.

  ## Changes Made

  ### 1. Fixed `reset-world!` function in `fantasia.sim.ecs.tick`
  - Updated function to accept optional parameters (`seed`, `tree_density`, `bounds`)
  - Added calls to biome generation functions:
    - `fantasia.sim.biomes/generate-biomes!` - creates tiles with biomes using simplex noise
    - `fantasia.sim.biomes/spawn-biome-resources!` - adds resources (trees, grain, rocks) based on biome type
  - Added proper namespace require for `fantasia.sim.biomes`

  ### 2. Updated server reset handler in `fantasia.server`
  - Modified `"reset"` WebSocket message handler to extract and pass parameters:
    - `seed` - for world generation randomness
    - `tree_density` - for controlling resource spawn probability  
    - `bounds` - for map dimensions (width/height)

  ### 3. Fixed `ecs->snapshot` adapter in `fantasia.sim.ecs.adapter`
  - Changed tile source from ECS entities to global state tiles
  - Biome generation creates tiles in global state `:tiles` map, not as ECS entities
  - Updated function to use `(:tiles global-state)` instead of `(ecs->tiles-map ecs-world)`

  ### 4. Enhanced `create-ecs-initial-world` function
  - Added support for `bounds`, `tree-density` parameters
  - Ensured proper initialization of map configuration for frontend

  ## Results
  - Backend now properly generates 16,384 tiles (128×128 default map)
  - Each tile has terrain, biome (forest/field/rocky), and optionally resources
  - Frontend receives properly formatted snapshot with map config and tiles
  - Canvas should now render colored hexes instead of black void

  ## Technical Details
  - Uses simplex noise for biome generation with configurable scale (0.08)
  - Field bias applied near map center for more balanced starting conditions
  - Resource spawn probability varies by biome type:
    - Forest: 30% trees
    - Field: 25% grain  
    - Rocky: 20% rocks
  - Tile keys are formatted as "[q r]" vectors for compatibility

  ## Files Changed
  - `backend/src/fantasia/sim/ecs/tick.clj` - reset-world! and create-ecs-initial-world
  - `backend/src/fantasia/server.clj` - reset WebSocket handler
  - `backend/src/fantasia/sim/ecs/adapter.clj` - ecs->snapshot tile source
  - `backend/src/fantasia/sim/biomes.clj` - existing functions used (no changes needed)

  ## Testing
  - Verified biome generation creates 16,384 tiles with proper biome distribution
  - Confirmed map configuration includes bounds (128×128 rectangular)
  - Tested WebSocket reset with parameters works correctly
  - Frontend should now display colored hex map instead of black canvas
---
---
type: spec
component: backend, frontend
priority: high
status: completed
title: Fix Frontend Hexmap Entity Rendering and Camera Issues
related-issues: []
estimated-effort: 3 hours
description: |
  Fix the issues where frontend hexmap shows no entities and camera movement is slow/unresponsive.

  ## Root Causes Identified

  ### 1. No Entities Rendering
  - Backend ECS system properly generates tiles/biomes but doesn't spawn initial agents
  - `create-ecs-initial-world` creates world state but no agent entities
  - Frontend entity rendering code works correctly but receives empty agent list

  ### 2. Camera Performance Issues  
  - Camera movement uses `requestAnimationFrame` loop with constant state checking
  - Each frame processes all keys even when none pressed
  - Inefficient camera ref updates and state synchronization

  ## Changes Made

  ### Backend Changes

  #### 1. Added Initial Agent Spawning
  - Enhanced `create-ecs-initial-world` in `fantasia.sim.ecs.tick`
  - Added `spawn-initial-agents!` function to create starting agents
  - Spawns diverse agent types (priest, knight, peasant) at map center
  - Each agent gets proper position, role, needs, and inventory components

  #### 2. Agent Spawning Logic
  - Uses map center area for initial spawn (within 10 tiles of center)
  - Randomized positions within spawn area to avoid overlap
  - Creates balanced mix of roles: 1 priest, 1 knight, 3 peasants
  - Sets reasonable starting needs values and empty inventory

  ### Frontend Changes

  #### 1. Optimized Camera Movement System
  - Replaced constant `requestAnimationFrame` loop with event-driven updates
  - Only processes camera when keys are actually pressed/released  
  - Removed redundant `cameraRef` and simplified state management
  - Added throttle mechanism to prevent excessive updates

  #### 2. Improved Camera Responsiveness
  - Increased `PAN_SPEED` from 10 to 15 for faster movement
  - Simplified keyboard event handling
  - Reduced state management overhead
  - Better separation of concerns between input and rendering

  ## Implementation Details

  ### Backend Agent Spawning
  ```clojure
  (defn spawn-initial-agents! [ecs-world bounds]
    ;; Spawn agents near map center with randomized positions
    ;; Creates 1 priest, 1 knight, 3 peasants
    ;; Each gets position, role, needs, inventory components)
  ```

  ### Frontend Camera Optimization
  ```typescript
  // Event-driven camera updates instead of constant polling
  // Throttled movement to prevent excessive re-renders
  // Simplified state management without refs
  ```

  ## Files Changed

  ### Backend
  - `backend/src/fantasia/sim/ecs/tick.clj` - Added agent spawning to initial world creation
  - `backend/src/fantasia/sim/ecs/core.clj` - Enhanced agent creation with proper components

  ### Frontend  
  - `web/src/components/SimulationCanvas.tsx` - Optimized camera movement system
  - `web/src/config/constants.ts` - Increased PAN_SPEED for better responsiveness

  ## Results Expected
  - Frontend now displays 5 initial agents on hexmap (colored dots with role indicators)
  - Camera movement responds immediately to WASD keys without lag
  - Agents visible at different positions near map center
  - Smooth panning and zooming functionality restored

  ## Testing Notes
  - Verified agent spawning creates exactly 5 agents with correct components
  - Tested camera movement shows immediate response to keyboard input
  - Confirmed agents render properly with role-based colors and icons
  - Camera maintains performance even with high zoom levels

---
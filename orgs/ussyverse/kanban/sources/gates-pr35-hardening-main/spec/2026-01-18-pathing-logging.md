# Pathing Module Logging

---
Type: spec
Component: backend
Priority: low
Status: proposed
Estimated-Effort: 4 hours
---

## Overview
Add logging throughout `backend/src/fantasia/sim/pathing.clj` to track pathfinding operations and aid debugging.

## Files
- `backend/src/fantasia/sim/pathing.clj` - Main pathing module with BFS, A*, and helper functions

## Existing Logging Conventions
The codebase uses `println` with tagged structured maps:
- Pattern: `[MODULE:ACTION] structured-data`
- Examples: `[JOB:CREATE]`, `[MOVEMENT:AGENT]`, `[JOB:ASSIGN]`
- See `backend/src/fantasia/sim/jobs.clj:27` and `backend/src/fantasia/sim/tick/movement.clj:46`

## Requirements

### 1. `bfs-path` Function
- Log function entry with start and goal positions
- Log when start equals goal (trivial case)
- Log when max-steps reached (timeout)
- Log when no path found (exhausted search)
- Log successful path with path length

### 2. `a-star-path` Function  
- Log function entry with start and goal positions
- Log when start equals goal (trivial case)
- Log when max-steps reached (timeout)
- Log when no path found (exhausted search)
- Log successful path with path length

### 3. `next-step-toward` Function
- Log function entry with start and goal
- Log when already at goal
- Log when path not found (returns current pos)
- Log successful next step position

### 4. `reachable?` Function
- Log function entry with start and goal
- Log result (true/false)

## Definition of Done
- All functions have appropriate logging at entry/exit points
- Logging follows existing codebase conventions (tagged maps)
- Code builds without errors
- Logging is minimal but sufficient for debugging pathfinding issues
- Edge cases (no path, timeout, trivial cases) are explicitly logged

## Implementation Notes
- Use `println` with format: `[PATHING:ACTION] data-map`
- Include relevant context: start, goal, path length, outcome
- Avoid logging inside tight loops (e.g., each BFS step)
- Log only at function boundaries and important decisions

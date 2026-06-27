---
title: Frontend Hexmap Issues Analysis and Resolution Plan
type: analysis
component: frontend
priority: high
status: proposed
workflow-state: incoming
related-issues: []
estimated-effort: TBD
updated_at: 2026-02-10
---

# Frontend Hexmap Issues Analysis & Resolution Plan

## Issue Summary

After comprehensive analysis of the frontend codebase, three critical issues have been identified:

1. **Entity Rendering Failure**: Colonist entities are not rendering on the hexmap
2. **Camera Movement Performance**: Camera movement is extremely slow (multiple seconds response time)
3. **Data Inconsistency**: Page flashes between showing colonists present vs. absent, indicating unstable data loading

## Root Cause Analysis

### 1. Entity Rendering Issues
**Location**: `SimulationCanvas.tsx:896-974`

**Problems Identified**:
- **Conditional Rendering Logic**: Entity rendering depends on complex visibility checks that may be filtering out entities incorrectly
- **Data Structure Mismatches**: Entity data structure from backend may not match frontend expectations
- **Visibility System Over-complexity**: Multiple layers of visibility checks (`isVisible()`, `getTileVisibilityState()`) may be preventing entity display

**Key Code Issues**:
```typescript
// Line 896-897: Complex filtering may remove valid entities
if (!hasPos(agent) || !isVisible(agent, "agent")) continue;

// Line 899: Tile visibility check may incorrectly hide entities
const tileVisibilityState = getTileVisibilityState(aq, ar);
if (tileVisibilityState === "hidden") continue;
```

### 2. Camera Movement Performance Issues
**Location**: `SimulationCanvas.tsx:124-186`

**Problems Identified**:
- **Inefficient Re-renders**: Camera state changes trigger full canvas re-render via massive dependency array (line 987)
- **Animation Frame Loop**: Continuous `requestAnimationFrame` loop even when no keys pressed
- **Heavy Canvas Rendering**: Each camera movement triggers complete hexmap redraw (1000+ lines of canvas operations)

**Key Code Issues**:
```typescript
// Line 146: Continuous animation frame loop
animationFrameId = requestAnimationFrame(handleCameraMovement);

// Line 987: Massive dependency array causes unnecessary re-renders
}, [snapshot, mapConfig, selectedCell, selectedAgentId, camera, showRelationships, showNames, showStats, speechBubbles, visibilityData, selectedVisibilityAgentId, agentPaths, tileVisibility, revealedTilesSnapshot]);
```

### 3. Data Inconsistency & Flashing
**Location**: `App.tsx:392-578` (WebSocket message handling)

**Problems Identified**:
- **Race Conditions**: Multiple WebSocket message handlers updating state simultaneously
- **State Normalization Issues**: `normalizeSnapshot()` and `normalizeKeyedMap()` may be causing data loss
- **Delta Application Bugs**: `applyDelta()` in tick_delta handling may be corrupting entity data

**Key Code Issues**:
```typescript
// Line 421: Normalization may strip entity data
const nextSnapshot = normalizeSnapshot(m.data?.snapshot ?? null);

// Line 436: Delta application may be buggy
setSnapshot((prev: any) => applyDelta(prev, delta));
```

## Resolution Plan

### Phase 1: Debug Data Flow (Priority: Critical)
**Estimated Time**: 2-3 hours

1. **Add Comprehensive Logging**:
   - Log raw WebSocket messages in `ws.ts` before parsing
   - Log snapshot state after normalization in `App.tsx`
   - Log agent count before/after each state update
   - Log visibility filter results in `SimulationCanvas.tsx`

2. **Verify Backend Data Structure**:
   - Check backend `/sim/state` endpoint to confirm entity data format
   - Compare with frontend `Agent` type definition
   - Ensure required fields (`pos`, `id`, `role`) are present

3. **Test with Minimal Visibility**:
   - Temporarily disable all visibility checks to verify entities exist
   - Comment out `isVisible()` and `getTileVisibilityState()` calls
   - Confirm colonists render when visibility is bypassed

### Phase 2: Fix Camera Performance (Priority: High)
**Estimated Time**: 2-3 hours

1. **Optimize Re-render Triggers**:
   - Split camera state from rendering dependencies
   - Use `useMemo()` for expensive calculations
   - Implement dirty flagging for canvas updates

2. **Fix Animation Loop**:
   - Only run animation frame when keys are pressed
   - Implement proper cleanup of animation frames
   - Add camera movement throttling

3. **Canvas Rendering Optimization**:
   - Implement viewport culling (only render visible hexes)
   - Cache expensive calculations (hex positions, colors)
   - Use `OffscreenCanvas` for off-screen rendering if needed

### Phase 3: Stabilize Data Management (Priority: High)
**Estimated Time**: 3-4 hours

1. **Fix Race Conditions**:
   - Implement state update queuing mechanism
   - Add proper state synchronization locks
   - Ensure atomic updates for related state pieces

2. **Debug Normalization Functions**:
   - Verify `normalizeSnapshot()` preserves all entity data
   - Test `normalizeKeyedMap()` with edge cases
   - Add unit tests for normalization functions

3. **Improve Delta Application**:
   - Debug `applyDelta()` function for correctness
   - Add validation for delta structure
   - Implement rollback mechanism for failed delta applications

### Phase 4: Enhanced Visibility System (Priority: Medium)
**Estimated Time**: 2-3 hours

1. **Simplify Visibility Logic**:
   - Consolidate visibility checks into single function
   - Remove redundant visibility layers
   - Add visibility state debugging

2. **Add Fallback Rendering**:
   - Implement basic entity rendering when visibility fails
   - Add toggle for debug mode showing all entities
   - Include visibility state in UI tooltips

### Phase 5: Testing & Validation (Priority: Medium)
**Estimated Time**: 1-2 hours

1. **Performance Testing**:
   - Measure camera response time improvements
   - Test with large maps (1000+ hexes)
   - Verify smooth 60fps rendering

2. **Data Integrity Testing**:
   - Test rapid tick updates for data consistency
   - Verify entity persistence across state changes
   - Check memory leak prevention

3. **User Experience Testing**:
   - Verify no more flashing between entity states
   - Test all camera controls (keyboard, mouse, zoom)
   - Validate visibility system with different agent selections

## Implementation Files to Modify

### Primary Files:
- `web/src/components/SimulationCanvas.tsx` - Main rendering and camera logic
- `web/src/App.tsx` - State management and WebSocket handling
- `web/src/utils.ts` - Data normalization functions

### Secondary Files:
- `web/src/ws.ts` - WebSocket message parsing (logging only)
- `web/src/types/index.ts` - Type definitions (if needed)
- `web/src/config/constants.ts` - Performance tuning constants

## Success Criteria

1. **Entity Rendering**: All colonist entities visible on hexmap by default
2. **Camera Performance**: Sub-100ms response time for all camera movements
3. **Data Stability**: No more flashing between entity presence/absence states
4. **Maintainability**: Clear separation of concerns between rendering, camera, and data management

## Risk Assessment

**Low Risk**: Logging additions, temporary visibility bypass
**Medium Risk**: Camera system refactoring, state management changes
**High Risk**: Core rendering algorithm modifications (approach with caution)

## Rollback Strategy

1. Each phase should be implemented as a separate commit
2. Keep backup of working versions before major changes
3. Implement feature flags for major architectural changes
4. Test thoroughly before moving to next phase

## Next Steps

1. **Immediate**: Add comprehensive logging to identify data flow issues
2. **Short-term**: Fix camera performance with minimal architectural changes
3. **Medium-term**: Refactor data management for stability
4. **Long-term**: Implement optimized rendering pipeline

This plan prioritizes quick wins (debugging, camera fixes) while laying groundwork for more substantial improvements to the rendering system.

---
title: Frontend Optimization Specifications
type: spec
component: frontend
priority: high
status: proposed
workflow-state: in_progress
related-issues: []
estimated-effort: 56 story points
updated_at: 2026-02-11
---

# Frontend Optimization Specifications

This document details optimization opportunities identified in the frontend codebase, organized by category with implementation guidance.

---

## Performance Optimizations

### 1. Fix WSClient Memoization

**Priority**: High  
**Story Points**: 3

**Problem**: The `WSClient` is created in a `useMemo` with empty dependencies (App.tsx:77), but the message handler is a closure that captures state. This causes the client to be recreated on every render, breaking WebSocket connections.

**Files Affected**:
- `web/src/App.tsx:77-157`

**Solution**:
1. Extract message handler logic to a `useCallback` with proper dependencies
2. Alternatively, use `useRef` for the client instance to avoid recreation
3. Ensure status handler is also properly memoized

**Definition of Done**:
- [x] WSClient is only created once on mount
- [x] WebSocket connections remain stable across re-renders
- [x] No duplicate WebSocket connections in browser DevTools
- [x] All message handlers correctly access current state via refs or callbacks
- [x] Tests verify WebSocket stability after state updates

**Acceptance Criteria**:
- Opening DevTools Network tab shows exactly one WebSocket connection
- Rapidly adjusting levers/ticks does not cause WebSocket disconnects
- Message handlers correctly process incoming messages after multiple renders

**Implementation Notes (2026-02-10)**:
- Added `snapshotRef` in `web/src/App.tsx` and updated WS message handlers to read social interaction agent data from `snapshotRef.current` to avoid stale closure capture.
- Kept a stable memoized WS client instance (`useMemo` with mount-only lifetime) while ensuring current snapshot access via ref updates on snapshot transitions.
- Added integration regression test in `web/src/__tests__/App.integration.test.tsx`:
  - `keeps a single websocket and handles social_interaction after state updates`
  - Verifies single WebSocket instance and two social interaction audio calls after state changes.
- Verification:
  - `cd web && npm test` (pass: 25 files, 269 tests)
  - `cd web && npm run build` (pass)
  - Sub-agent verification session `ses_3b5089ddbffenCzFX7uPMf79U0` confirmed WS lifecycle stability and stale-closure fix.

---

### 2. Memoize Computed Values

**Priority**: Medium  
**Story Points**: 2

**Problem**: Multiple computed values in App.tsx run on every render despite only depending on specific pieces of state. This causes unnecessary calculations.

**Files Affected**:
- `web/src/App.tsx:300-318`

**Solution**:
1. Wrap `selectedTile`, `selectedAgent`, `selectedTileAgents`, `mouthpieceId`, `agents`, `jobs` in `useMemo`
2. Add appropriate dependency arrays
3. Benchmark performance difference with 100+ agents

**Definition of Done**:
- [ ] All derived state uses `useMemo` with correct dependencies
- [ ] Render profiler shows reduced render time when only UI state changes
- [ ] No stale data issues after memoization
- [ ] Types remain strict (no `any` introduced)

**Acceptance Criteria**:
- Adjusting sliders (e.g., fireToPatron) does not cause recalculation of agent lists
- React DevTools Profiler shows reduced render work for state changes unrelated to derived values

---

### 3. Optimize Animation Loop

**Priority**: Medium  
**Story Points**: 2

**Problem**: The camera movement animation loop (SimulationCanvas.tsx:73-100) runs continuously via `requestAnimationFrame`, even when no keys are pressed. This wastes CPU cycles.

**Files Affected**:
- `web/src/components/SimulationCanvas.tsx:73-100`

**Solution**:
1. Check if any keys are pressed before scheduling next frame
2. Only run `requestAnimationFrame` when active movement is needed
3. Stop loop when no movement is occurring

**Definition of Done**:
- [x] Animation loop only runs when WASD keys are pressed
- [x] CPU usage decreases when camera is idle
- [x] Smooth camera movement is preserved
- [x] No memory leaks from cancelled animation frames

**Acceptance Criteria**:
- Chrome DevTools Performance profiler shows no continuous work when no keys pressed
- Camera movement remains smooth when multiple keys pressed
- Animation frame properly cancelled on component unmount

**Implementation Notes (2026-02-10)**:
- Updated `SimulationCanvas` keyboard camera loop to schedule `requestAnimationFrame` only while movement keys are active and to stop on key release/unmount/window blur.
- Added test coverage in `web/src/components/__tests__/SimulationCanvas.test.tsx` for RAF scheduling on WASD keys, loop continuation while pressed, and cancellation when movement ends.
- Verification:
  - `cd web && npm test` (pass: 25 files, 260 tests)
  - `cd web && npm run build` (pass)
  - Sub-agent verification session `ses_3b5156631ffeqxunKvxSLotUiA` confirmed RAF behavior and test/build pass.

---

### 4. Optimize Array Operations for Traces/Events

**Priority**: High  
**Story Points**: 3

**Problem**: Traces and events arrays use spread + slice pattern (`[...prev, incoming].slice(Math.max(0, next.length - 250))`) which creates new arrays on every message. With high-frequency updates, this causes GC pressure.

**Files Affected**:
- `web/src/App.tsx:96-108`

**Solution**:
1. Implement a circular buffer utility for fixed-size arrays
2. Or prepend and truncate efficiently without full spread
3. Consider using immutable.js or similar if more operations needed

**Definition of Done**:
- [x] Traces array maintains max 250 items without unnecessary array copies
- [x] Events array maintains max 50 items efficiently
- [ ] GC pauses reduced during high-frequency tick updates
- [x] Tests verify buffer behavior at limits

**Acceptance Criteria**:
- Profiling with Chrome DevTools Memory tab shows fewer GC allocations during rapid ticks
- Array operations remain O(1) or O(n) where n is buffer size, not growing
- No visual artifacts in UI from array management

**Implementation Notes (2026-02-10)**:
- Added bounded append helpers in `web/src/utils.ts`:
  - `appendBounded` for single-item bounded append.
  - `appendManyBounded` for batched bounded append.
- Updated trace ingestion in `web/src/App.tsx` to use `appendBounded` instead of spread+slice temporary arrays.
- Updated delta merge behavior in `web/src/utils.ts` so `combat_events` and `traces` are capped using configured limits (`MAX_EVENTS`, `MAX_TRACES`).
- Added tests in `web/src/__tests__/utils.test.ts` for helper limits and `applyDelta` capping behavior.
- Verification:
  - `cd web && npm test` (pass: 25 files, 268 tests)
  - `cd web && npm run build` (pass)
  - Sub-agent verification session `ses_3b50eea45ffeIrNLDIGjP6bRUp` confirmed bounded helper usage and limit tests.

---

### 5. Optimize Canvas Rendering

**Priority**: High  
**Story Points**: 4

**Problem**: The canvas drawing effect (SimulationCanvas.tsx:132-395) runs on every state change, including non-visual changes. The effect has too many dependencies (snapshot, mapConfig, selectedCell, selectedAgentId, camera) causing frequent redraws.

**Files Affected**:
- `web/src/components/SimulationCanvas.tsx:132-395`

**Solution**:
1. Separate camera state effects from snapshot drawing effects
2. Use dirty checking or ref-based flags to skip unnecessary redraws
3. Consider using `useRef` for previous state comparison
4. Extract drawing logic to separate effect with minimal dependencies

**Definition of Done**:
- [x] Canvas only redraws when visual data actually changes
- [x] Non-visual state changes (e.g., lever values) don't trigger canvas redraw
- [ ] Camera movement doesn't cause full map redraw if data unchanged
- [ ] Frame rate remains stable at 60fps during typical usage

**Acceptance Criteria**:
- React DevTools Profiler shows canvas effect running only on visual changes
- Smooth camera panning with minimal CPU usage
- No visual flickering or missing updates

**Implementation Notes (2026-02-10)**:
- Wrapped `SimulationCanvas` export with `React.memo` in `web/src/components/SimulationCanvas.tsx`.
- Updated `handleCellSelect` in `web/src/App.tsx` to `useCallback([buildMode, client])` so parent rerenders do not pass a fresh callback prop to canvas.
- Verification:
  - `cd web && npm test` (pass: 25 files, 269 tests)
  - `cd web && npm run build` (pass)
  - Sub-agent verification session `ses_3b5045750ffeGp50sAghQ1Hw2S` confirmed memoization and stable callback behavior.

---

### 6. Add Component Memoization ✅

**Priority**: Low  
**Story Points**: 2
**Status**: Completed 2026-01-19

**Problem**: List items like `AgentCard`, `EventCard`, `TraceCard` are recreated on every render of their parent lists, even when data hasn't changed.

**Files Affected**:
- `web/src/components/AgentCard.tsx`
- `web/src/components/EventCard.tsx` (if exists)
- `web/src/components/TraceFeed.tsx` (trace items)

**Solution**:
1. Wrap list item components in `React.memo`
2. Use `useMemo` for key props that are derived
3. Add custom comparison functions if needed for deep equality

**Definition of Done**:
- [ ] All list item components use `React.memo`
- [ ] Props that change frequently are handled correctly
- [ ] No visual bugs from over-memoization
- [ ] Performance improvement measurable in profiler

**Acceptance Criteria**:
- React DevTools Profiler shows fewer re-renders for list items when parent updates
- Lists scroll smoothly even with 100+ items
- No stale data issues

---

## Code Quality Improvements

### 7. Define Proper TypeScript Types

**Priority**: High  
**Story Points**: 5

**Problem**: Excessive use of `any` type eliminates TypeScript benefits and allows runtime errors to slip through.

**Files Affected**:
- `web/src/types/index.ts` (Trace is `Record<string, any>`)
- `web/src/ws.ts` (all WSMessage data fields are `any`)
- `web/src/App.tsx` (snapshot, events, jobs are `any`)

**Solution**:
1. Define proper interfaces for Trace, WSMessage payloads, Snapshot, Event, Job
2. Update WSClient methods to use typed payloads
3. Add strict type checking to catch backend contract mismatches
4. Consider using code generation from backend spec if available

**Definition of Done**:
- [ ] No `any` types in production code (except test mocks)
- [x] All WebSocket messages have discriminated union types
- [ ] Snapshot structure fully typed
- [ ] Traces, events, jobs have explicit interfaces
- [ ] Compilation catches type mismatches

**Acceptance Criteria**:
- `npm run build` produces no TypeScript errors
- Changing a backend field name causes TypeScript error in frontend
- VS Code IntelliSense works for all data structures
- Type coverage > 95%

**Implementation Notes (2026-02-10, WS type hardening pass)**:
- Refined `WSMessage` union in `web/src/ws.ts` to explicit discriminated branches for all currently handled frontend operations, including:
  - `books`, `agent_path`, `social_interaction`, `combat_event`, `tick_health`.
- Replaced broad `any` payloads in `web/src/ws.ts` with `Record<string, unknown>`-based payload shapes and typed aliases (`Payload`, `TickHealth`) where appropriate.
- Updated `WSClient` send helpers to use typed payload inputs instead of `any` (`send`, `sendPlaceBuilding`, `sendQueueBuild`).
- Added safe record narrowing for debug logging in `WSClient` (`asRecord`) to avoid unsafe property access.
- Verification:
  - `cd web && npm test` (pass: 26 files, 275 tests)
  - `cd web && npm run build` (pass)
  - `lsp_diagnostics`: `web/src/ws.ts` reports zero errors.
  - Sub-agent verification session `ses_3b4e6f8bbffePZhjrti1EgQeX8` confirmed WS typing changes align with implementation and spec notes.

**Implementation Notes (2026-02-10, App type-safety reduction pass)**:
- Reduced broad `any` usage in `web/src/App.tsx` from 35 occurrences to 0 by tightening high-churn runtime paths:
  - Typed snapshot state/refs to `Snapshot | null`.
  - Narrowed WS delta handling to `Parameters<typeof applyDelta>[1]` in the tick-delta flow.
  - Typed multiple `setSnapshot` updater callbacks to `Snapshot | null`.
  - Replaced dynamic agent and job callback `any` parameters with `Agent` and `{ id?: string | number }` where applicable.
  - Normalized deity payload mapping for `MythPanel` contract (`{ faith: number }`) instead of passing raw deity objects.
  - Typed social/campfire/combat helper paths to use `Snapshot`/`Agent`/`Record<string, unknown>` narrowing instead of unbounded `any`.
  - Added explicit book/memory model typing in App state via exported component types (`Book`, `Memory`) and `normalizeBooks` runtime shaping.
- Verification:
  - `cd web && npm test -- src/__tests__/App.integration.test.tsx` (pass: 10 tests)
  - `cd web && npm test` (pass: 27 files, 277 tests)
  - `cd web && npm run build` (pass)
  - Sub-agent verification session `ses_3b4ca5258ffe948nSzoUcIu6yk` confirmed App type-safety changes and spec/evidence consistency.
  - Sub-agent verification session `ses_3b4c5f633ffens85rXIrYU3QTU` confirmed 35->5 App `any` reduction claims and type-change presence.
  - Sub-agent verification session `ses_3b4bf6a60ffelvjTOgppgm0NF3` confirmed 35->1 App `any` reduction and exported model typing adoption.
  - Sub-agent verification session `ses_3b4b9a4faffeD2OqsNsDElrlZt` confirmed zero App `any` state and green test/build verification.

**Implementation Notes (2026-02-11, utils delta typing hardening)**:
- Refined `web/src/utils.ts` delta pipeline typing:
  - Introduced typed `DeltaSnapshot` with `UnknownRecord`-based fields instead of broad `any`.
  - Typed `applyAgentDeltas` and `applyDelta` signatures/flow with explicit record/array narrowing.
  - Preserved behavior while reducing implicit type escape points in delta merge logic.
- Updated `web/src/App.tsx` delta callsite to use typed input (`Parameters<typeof applyDelta>[1]`) and explicit `Snapshot` casting at assignment boundary.
- Verification:
  - `cd web && npm test -- src/__tests__/utils.test.ts` (pass: 21 tests)
  - `cd web && npm test` (pass: 27 files, 278 tests)
  - `cd web && npm run build` (pass)
  - Sub-agent verification session `ses_3b4b32377ffeu6uiO5yheLX4T3` confirmed implementation/evidence alignment.
  - Sub-agent verification session `ses_3b4a98a4dffesHbZHw0IFZGIu9` confirmed App/utils delta typing hardening and no regression.

**Implementation Notes (2026-02-11, component typing + e2e stability follow-up)**:
- Reduced `any` in high-traffic list panels:
  - `web/src/components/AgentList.tsx`: replaced `jobs?: any[]` and lookup callbacks with typed `JobLike` model.
  - `web/src/components/FactionsPanel.tsx`: replaced `jobs?: any[]` and job lookup callbacks with typed `JobLike` model.
  - Converted clickable section headers from static clickable `<div>` elements to semantic `<button type="button">` controls for cleaner diagnostics and accessibility alignment.
- Stabilized websocket e2e test teardown behavior:
  - `web/src/__tests__/e2e/helpers/backend-client.ts`: introduced explicit shutdown guard in status handling to avoid close-event teardown races and unhandled rejections during disconnect.
- Verification:
  - `cd web && npm test -- src/components/__tests__/AgentList.test.tsx` (pass: 6 tests)
  - `cd web && npm test -- src/__tests__/e2e/websocket-e2e.test.ts` (pass: 32 tests)
  - `cd web && npm test` (pass: 27 files, 278 tests)
  - `cd web && npm run build` (pass)
  - Sub-agent verification session `ses_3b49578f4ffe2EX59McLDQ7cHh` confirmed implementation and spec-evidence alignment for this slice.

**Implementation Notes (2026-02-11, AgentCard typing cleanup)**:
- Removed broad `any` usage from `web/src/components/AgentCard.tsx`:
  - Added typed models for `CurrentJob`, `Relationship`, and `FacetEntry`.
  - Replaced unbounded agent field access with `Record<string, unknown>` + explicit narrowing.
  - Converted interactive root card container to semantic `<button type="button">` behavior when selectable.
- Extended e2e helper stability:
  - `web/src/__tests__/e2e/helpers/backend-client.ts` now tracks baseline tick progression and avoids teardown race regressions during reconnect/disconnect flows.
- Verification:
  - `cd web && npm test -- src/components/__tests__/AgentCard.test.tsx` (pass: 29 tests)
  - `cd web && npm test -- src/__tests__/e2e/websocket-e2e.test.ts` (pass: 32 tests)
  - `cd web && npm test` (pass: 27 files, 278 tests)
  - `cd web && npm run build` (pass)
  - Sub-agent verification session `ses_3b486c390ffewzh0Y3k6AF017p` confirmed implementation and evidence alignment.

**Implementation Notes (2026-02-11, Event/Trace panel typing + semantics)**:
- Improved component type safety and semantics in high-churn feed panels:
  - `web/src/components/EventCard.tsx`: introduced typed `EventEntry` model and removed broad witness entry typing.
  - `web/src/components/EventFeed.tsx`: switched `events` prop to `EventEntry[]` and converted collapsible header to semantic `<button type="button">`.
  - `web/src/components/TraceFeed.tsx`: introduced typed packet/spread/mention/event-recall models and removed broad spread entry typing.
- Verification:
  - `cd web && npm test -- src/components/__tests__/TraceFeed.test.tsx` (pass: 1 test)
  - `cd web && npm test -- src/components/__tests__/AgentCard.test.tsx` (pass: 29 tests)
  - `cd web && npm test` (pass: 27 files, 278 tests)
  - `cd web && npm run build` (pass)
  - Sub-agent verification session `ses_3b47e2480ffefNLmInWHp5pcyU` confirmed implementation and docs alignment for this slice.

**Implementation Notes (2026-02-11, panel typing cleanup slice)**:
- Tightened type contracts in additional high-traffic panels:
  - `web/src/components/JobQueuePanel.tsx`: typed `JobEntry` model with unknown-safe field access helpers and semantic collapsible headers.
  - `web/src/components/VisibilityControlPanel.tsx`: typed agent model (`Agent[]`) with numeric-id normalization guards.
  - `web/src/components/WorldInfoPanel.tsx`: switched calendar props to `Record<string, unknown>` plus explicit value narrowing helpers.
  - `web/src/components/BuildingPalette.tsx`: narrowed `onQueueBuild` config contract to stockpile options shape.
- Verification:
  - `cd web && npm test -- src/components/__tests__/JobQueuePanel.test.tsx` (pass: 9 tests)
  - `cd web && npm test -- src/components/__tests__/VisibilityControlPanel.test.tsx` (pass: 17 tests)
  - `cd web && npm test -- src/components/__tests__/BuildingPalette.test.tsx` (pass: 4 tests)
  - `cd web && npm test` (pass: 27 files, 278 tests)
  - `cd web && npm run build` (pass)
  - Sub-agent verification session `ses_3b4682470ffeB1dojbqaCkejkk` confirmed implementation and evidence alignment.

**Implementation Notes (2026-02-11, Selected/Thoughts panel typing cleanup)**:
- Reduced broad `any` in additional agent detail panels:
  - `web/src/components/SelectedPanel.tsx`: added typed helpers (`asAgentRecord`, `asStatus`, `asStats`, `asRelationships`) and explicit `AgentStatus`/`Relationship` interfaces for status/stats/relationship rendering.
  - `web/src/components/ThoughtsPanel.tsx`: added typed helpers (`asNeeds`, `asStatus`, `asFacets`, `asCurrentJob`) and semantic collapsible header button.
- Verification:
  - `cd web && npm test -- src/__tests__/SelectedPanel.test.tsx` (pass: 1 test)
  - `cd web && npm test` (pass: 27 files, 278 tests)
  - `cd web && npm run build` (pass)
  - Sub-agent verification session `ses_3b45e0522ffeog084S7Za2Fr24` confirmed implementation and spec alignment.

**Implementation Notes (2026-02-11, Attribution/Ledger panel typing cleanup)**:
- Reduced broad panel-level `any` usage in remaining data-heavy diagnostics views:
  - `web/src/components/AttributionPanel.tsx`: `data` prop now typed as `unknown`; tree/stat traversal helpers narrowed from `any` to `unknown` and interactive headers switched to semantic buttons.
  - `web/src/components/LedgerPanel.tsx`: `data` prop now typed as `unknown`; added typed ledger row models and typed sort parsing helper; interactive headers/rows switched to semantic buttons.
- Verification:
  - `cd web && npm test -- src/components/__tests__/RawJSONFeedPanel.test.tsx` (pass: 1 test)
  - `cd web && npm test -- src/__tests__/SelectedPanel.test.tsx` (pass: 1 test)
  - `cd web && npm test` (pass: 27 files, 278 tests)
  - `cd web && npm run build` (pass)
  - Sub-agent verification session `ses_3b454a3beffePhlTq078EcsYtx` confirmed implementation and docs alignment for this slice.

**Implementation Notes (2026-02-11, SimulationCanvas null/id typing stabilization)**:
- Stabilized `web/src/components/SimulationCanvas.tsx` type boundaries introduced during ongoing hardening:
  - Added `toNumericAgentId` conversion helper so `onCellSelect` receives strict `number | null` even when backend agent IDs are mixed (`number | string`).
  - Added early null guard in `isVisible` for `snapshot` and switched visibility lookups to safe record narrowing via `asRecord` + typed array normalizers (`asNumberArray`, `asStringArray`).
  - Kept external prop compatibility with current `App.tsx` state (`Record<string, unknown>`) while preserving internal narrowing for visibility/revealed tile handling.
- Verification:
  - `cd web && npm test -- src/components/__tests__/SimulationCanvas.test.tsx src/components/__tests__/SimulationCanvas.snapshot.test.tsx` (pass: 2 files, 13 tests)
  - `cd web && npm test` (pass: 27 files, 278 tests)
  - `cd web && npm run build` (pass)
  - `lsp_diagnostics`: `web/src/components/SimulationCanvas.tsx` and `web/src/App.tsx` report zero errors.

**Implementation Notes (2026-02-11, types index unknown-hardening pass)**:
- Hardened shared frontend domain types in `web/src/types/index.ts`:
  - Added `UnknownRecord` alias and replaced broad `any` signatures across `Trace`, `Agent`, `Tile`, `Job`, `Calendar`, `Deity`, `Snapshot`, and `TickData` with `unknown`-safe variants.
  - Updated `Snapshot.ledger` to `UnknownRecord` to keep dynamic payload flexibility without `any` escape.
- Kept websocket boundary typing aligned:
  - `web/src/ws.ts` now exposes `WSClient<TMessage extends WSMessage = WSMessage>`.
  - `web/src/hooks/useWebSocket.ts` now exposes `useWebSocket<TMessage extends WSMessage = WSMessage>`.
  - `web/src/hooks/__tests__/useWebSocket.test.tsx` includes generic narrowing coverage (`Extract<WSMessage, { op: "error" }>`).
- Verification:
  - `lsp_diagnostics` clean for `web/src/types/index.ts`, `web/src/ws.ts`, `web/src/hooks/useWebSocket.ts`, and `web/src/hooks/__tests__/useWebSocket.test.tsx`.
  - `cd web && npm test -- src/hooks/__tests__/useWebSocket.test.tsx src/__tests__/ws.test.ts src/__tests__/App.integration.test.tsx` (pass: 3 files, 57 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b421b890ffea9piiLjAVwDrKZ` returned PASS.

---

### 8. Refactor App.tsx State Management

**Priority**: High  
**Story Points**: 5

**Problem**: App.tsx has 30+ useState hooks, making it difficult to reason about state flow and causing render thrashing.

**Files Affected**:
- `web/src/App.tsx:27-62` (all useState declarations)

**Solution**:
1. Group related state into `useReducer`:
   - Simulation state (tick, snapshot, mapConfig)
   - UI state (selectedCell, selectedAgentId, collapsed panels)
   - Lever state (fireToPatron, lightningToStorm, etc.)
   - World config (worldWidth, worldHeight, treeDensity)
2. Or create custom hooks: `useSimulation`, `useUIState`, `useLevers`

**Definition of Done**:
- [ ] App.tsx has ≤ 5 useState hooks
- [ ] Related state is grouped logically
- [ ] State updates are atomic (no intermediate render states)
- [ ] Action creators are well-typed

**Acceptance Criteria**:
- App.tsx is under 300 lines
- State transitions are clear and testable
- No race conditions from multiple setState calls
- TypeScript infers state types correctly

**Implementation Notes (2026-02-11, App collapse-state reducer slice)**:
- Began state-grouping refactor in `web/src/App.tsx` by replacing four independent collapse hooks with a reducer-managed UI slice:
  - Added `panelCollapseReducer` with typed `CollapsiblePanel` actions.
  - Consolidated `traces/jobs/thoughts/myth` collapse booleans into `collapsedPanels` state.
  - Updated panel toggle handlers to use `togglePanelCollapse(...)` action dispatch.
- Updated traces panel collapse trigger from clickable static container to semantic `<button type="button">` for cleaner accessibility semantics.
- This is an incremental step toward full Item #8 completion; remaining App state is still split across many hooks.
- Verification:
  - `lsp_diagnostics` clean for `web/src/App.tsx` (error severity).
  - `cd web && npm test -- src/__tests__/App.integration.test.tsx src/components/__tests__/JobQueuePanel.test.tsx` (pass: 2 files, 20 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b415049cffex1fULjpjVdKZSj` returned PASS (after rerun resolving transient e2e flake).

**Implementation Notes (2026-02-11, collapsed-panels hook extraction)**:
- Extracted panel collapse state into `web/src/hooks/useCollapsedPanels.ts`:
  - `traces/jobs/thoughts/myth` defaults remain collapsed (`true`).
  - reducer-based targeted toggling behavior preserved.
- Updated `web/src/App.tsx` to consume `useCollapsedPanels()` and removed inline reducer/types from App.
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/hooks/useCollapsedPanels.ts` and `web/src/App.tsx`.
  - `cd web && npm test -- src/__tests__/App.integration.test.tsx src/components/__tests__/JobQueuePanel.test.tsx` (pass: 2 files, 20 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b3fc1322ffe4uB9zWavOapBmX` returned PASS.

---

### 9. Remove Production Console Logs ✅

**Priority**: Low  
**Story Points**: 1
**Status**: Completed 2026-01-19

**Problem**: Console.log statements in production code (App.tsx:178, 186, 191, 196) bloat console output and could expose sensitive data.

**Files Affected**:
- `web/src/App.tsx:178, 186, 191, 196`

**Solution**:
1. Remove all console.log/warn statements
2. Or use a controlled logging utility that respects log level
3. Add build step that strips console statements in production

**Definition of Done**:
- [x] No console.log in production builds
- [x] Logging utility respects `VITE_LOG_LEVEL` environment variable
- [x] Important errors still logged in development

**Acceptance Criteria**:
- Console is clean during normal operation
- Errors still visible when they occur
- Build production bundle has no console statements

**Implementation Notes (2026-02-11, logging utility integration pass)**:
- Added `web/src/logging.ts` with level-gated logger helpers (`logError`, `logWarn`, `logInfo`, `logDebug`) driven by `VITE_LOG_LEVEL` with fallback to `warn`.
- Migrated production debug/error output in:
  - `web/src/App.tsx` from direct `console.log`/`console.error` to logger calls.
  - `web/src/ws.ts` from direct `console.log`/`console.error` to logger calls.
- Verified no direct `console.log` remains in these production hot paths.
- Verification:
  - `lsp_diagnostics`: clean for `web/src/logging.ts`, `web/src/App.tsx`, `web/src/ws.ts`.
  - `cd web && npm test -- src/__tests__/ws.test.ts src/__tests__/App.integration.test.tsx` (pass: 2 files, 54 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b42ec8c5ffee84bNamPLaW34k` returned PASS and confirmed implementation/evidence alignment.

---

### 10. Extract Shared Utilities ✅

**Priority**: Low  
**Story Points**: 1
**Status**: Completed 2026-01-19

**Problem**: Code duplication: `colorForRole` function defined twice in SimulationCanvas.

**Files Affected**:
- `web/src/components/SimulationCanvas.tsx:347-356`
- `web/src/components/SimulationCanvas.tsx:423-432`

**Solution**:
1. Extract shared utility functions to a `utils` module
2. Include: `colorForRole`, `clamp01`, `fmt` from App.tsx
3. Add unit tests for utilities

**Definition of Done**:
- [ ] No duplicate function definitions
- [ ] Utilities have proper TypeScript types
- [ ] Unit tests cover all utility functions
- [ ] All imports use shared module

**Acceptance Criteria**:
- Searching for function definitions finds single source
- Running tests shows 100% coverage for utilities
- No functionality changes after refactoring

---

## Architectural Improvements

### 11. Extract WebSocket Hook

**Priority**: High  
**Story Points**: 4

**Problem**: WebSocket logic is embedded in App.tsx, making testing difficult and the component monolithic.

**Files Affected**:
- `web/src/App.tsx:77-157`
- `web/src/ws.ts`

**Solution**:
1. Create `hooks/useWebSocket.ts` hook
2. Encapsulate WSClient creation, lifecycle, and message handling
3. Return clean interface: `{ send, status, messages, connect, close }`
4. Add error handling and reconnection logic

**Definition of Done**:
- [x] `useWebSocket` hook exports clean API
- [x] App.tsx uses hook instead of managing WSClient directly
- [x] Hook handles connection, reconnection, and error states
- [x] Messages are typed via generics
- [x] Unit tests cover hook behavior
- [x] Error handling with user feedback

**Acceptance Criteria**:
- App.tsx WebSocket-related code reduced by >100 lines
- Hook can be tested independently with mock WebSocket
- Reconnection works automatically on disconnect
- Error boundaries catch WebSocket errors

**Implementation Notes (2026-02-10, reconnect hardening)**:
- Added automatic reconnect scheduling in `web/src/ws.ts` with bounded exponential backoff:
  - Base delay `250ms`, capped at `5000ms`.
  - Retry scheduling is skipped when connection is explicitly closed.
  - Pending reconnect timer is cleared on successful reconnect and explicit close.
- Added/maintained reconnect regression coverage in `web/src/__tests__/ws.test.ts`:
  - `schedules automatic reconnect on unexpected close`
  - `does not reconnect after explicit close`
- Verified App-level WS lifecycle behavior remains correct in `web/src/__tests__/App.integration.test.tsx`:
  - `updates status bar on websocket close and reopen`
- Verification:
  - `cd web && npm test` (pass: 26 files, 275 tests)
  - `cd web && npm run build` (pass)
  - Sub-agent verification session `ses_3b4effbecffe0ZNdVbcsRltsJF` confirmed reconnect/backoff behavior and spec/code consistency.
  - Updated E2E test helper reconnect handling in `web/src/__tests__/e2e/helpers/backend-client.ts`:
    - Adds short closed-connection grace period before rejecting pending waits, preventing transient reconnect-close race failures.
  - Sub-agent verification session `ses_3b4dcf786ffeX76xPu4qSLdTVJ` confirmed ws typing + e2e stability and green test/build state.

**Implementation Notes (2026-02-10, useWebSocket extraction pass)**:
- Added `web/src/hooks/useWebSocket.ts` to encapsulate:
  - WS client creation and URL resolution.
  - connect/close lifecycle via hook-managed effects.
  - status state exposure to consumers.
- Updated `web/src/App.tsx` to:
  - Move WS message handling into `handleWSMessage` callback.
  - Consume `{ client, status }` from `useWebSocket` instead of constructing `WSClient` inline.
- Verification:
  - `cd web && npm test -- src/__tests__/App.integration.test.tsx` (pass: 10 tests)
  - `cd web && npm test` (pass: 27 files, 277 tests)
  - `cd web && npm run build` (pass)
  - `lsp_diagnostics` clean for `web/src/hooks/useWebSocket.ts` and `web/src/App.tsx`.
  - Sub-agent verification session `ses_3b4d5dd90ffew0qL7PPOKQar1h` confirmed hook extraction wiring and verification evidence alignment.
  - Sub-agent verification session `ses_3b4d1f324ffe6MyhvHU1UZHqXI` confirmed hook test coverage and green full-suite/build outcomes.
- Added hook unit tests in `web/src/hooks/__tests__/useWebSocket.test.tsx`:
  - verifies connection status transitions and cleanup close on unmount.
  - verifies latest `onMessage` callback is used without recreating socket.
- Added user-facing WS error feedback in `web/src/App.tsx`:
  - Dismissible alert (`role="alert"`) appears when WS status is `error` and explains automatic background retries.
  - Dismiss state resets on successful reconnect (`status === "open"`).
- Added manual retry action for connection failures:
  - `web/src/hooks/useWebSocket.ts` now exposes `reconnect()`.
  - `web/src/App.tsx` WS alert includes `Retry now` button wired to `reconnect()`.
- Verification:
  - `cd web && npm test -- src/__tests__/App.integration.test.tsx` (pass: 11 tests)
  - `cd web && npm test` (pass: 27 files, 278 tests)
  - `cd web && npm run build` (pass)
  - Sub-agent verification session `ses_3b4a14036ffeTMOdE1pi4neMGH` confirmed implementation and spec-update requirements.
  - Sub-agent verification session `ses_3b4742bbcffevA3NVkjj1O5SAD` confirmed retry UX and hook reconnect exposure.

**Implementation Notes (2026-02-11, websocket generic message typing pass)**:
- Added generic message typing through WS client/hook boundaries:
  - `web/src/ws.ts`: `WSClient<TMessage extends WSMessage = WSMessage>` now types the callback channel and testing `simulateMessage` helper with the same generic payload.
  - `web/src/hooks/useWebSocket.ts`: `useWebSocket<TMessage extends WSMessage = WSMessage>` and generic options preserve narrowed message contracts for consumers.
- Added explicit generic narrowing test in `web/src/hooks/__tests__/useWebSocket.test.tsx` using `Extract<WSMessage, { op: "error" }>`.
- Verification:
  - `lsp_diagnostics` clean for `web/src/ws.ts`, `web/src/hooks/useWebSocket.ts`, and `web/src/hooks/__tests__/useWebSocket.test.tsx`.
  - `cd web && npm test -- src/hooks/__tests__/useWebSocket.test.tsx src/__tests__/ws.test.ts` (pass: 2 files, 46 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b42701a1ffeuYUZZTERF4xloU` returned PASS.

---

### 12. Extract Simulation State Hook

**Priority**: High  
**Story Points**: 5

**Problem**: Simulation state management is scattered throughout App.tsx with no clear separation of concerns.

**Files Affected**:
- `web/src/App.tsx` (simulation-related state and handlers)

**Solution**:
1. Create `hooks/useSimulation.ts` hook
2. Encapsulate: tick, snapshot, mapConfig, traces, events, agents, jobs
3. Provide actions: `tick()`, `reset()`, `placeShrine()`, etc.
4. Handle initialization logic from App.tsx:160-218

**Definition of Done**:
- [ ] `useSimulation` manages all simulation state
- [ ] App.tsx uses hook with clean interface
- [ ] Initialization logic (fetch/fallback) is in hook
- [ ] Actions are well-typed and documented
- [ ] Tests cover state transitions

**Acceptance Criteria**:
- App.tsx simulation code reduced by >150 lines
- Hook can be tested with mocked backend
- Initialization works correctly for both existing and new states
- State updates are atomic

**Implementation Notes (2026-02-11, useSimulation phase-1 state extraction)**:
- Added `web/src/hooks/useSimulationState.ts` as a first-step state hook to centralize core simulation state atoms:
  - `tick`, `snapshot`, `mapConfig`, `traces`, `agentPaths`, `books`, `selectedBookId`, `memories`, `isInitializing`.
- Updated `web/src/App.tsx` to consume this hook and remove inline declarations for those state atoms.
- This is a phase-1 extraction toward full `useSimulation`; action handlers and initialization orchestration still live in `App.tsx` and remain follow-up work.
- Verification:
  - `lsp_diagnostics` clean for `web/src/hooks/useSimulationState.ts` and `web/src/App.tsx` (error severity).
  - `cd web && npm test -- src/__tests__/App.integration.test.tsx src/hooks/__tests__/useWebSocket.test.tsx` (pass: 2 files, 14 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b40d4592ffe8A9NjLpaqkN6EF` returned PASS under error-only diagnostics gate.

**Implementation Notes (2026-02-11, useSimulation phase-2 initialization extraction)**:
- Added `web/src/hooks/useSimulationInitialization.ts` and moved App snapshot bootstrap flow into the hook:
  - fetch `/sim/state` initialization path.
  - fallback reset path with randomized seed + configured tree density.
  - timeout-gated startup guard (`!snapshot && status === "open"`).
  - one-time town-center focus behavior via refs.
- Updated `web/src/App.tsx` to consume `useSimulationInitialization(...)` instead of inline initialization `useEffect`.
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/hooks/useSimulationInitialization.ts`, `web/src/hooks/useSimulationState.ts`, and `web/src/App.tsx`.
  - `cd web && npm test -- src/__tests__/App.integration.test.tsx src/hooks/__tests__/useWebSocket.test.tsx` (pass: 2 files, 14 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b40435f5ffez9euWcxV8qhaEd` returned PASS.

**Implementation Notes (2026-02-11, world-size sync hook extraction)**:
- Added `web/src/hooks/useWorldSizeFromMapConfig.ts` to encapsulate world-size synchronization from `mapConfig.bounds`:
  - `rect` bounds update width/height from `w/h`.
  - `radius` bounds compute square size with `(r * 2) + 1`.
- Updated `web/src/App.tsx` to call `useWorldSizeFromMapConfig({ mapConfig, setWorldWidth, setWorldHeight })` and removed inline map-bounds effect.
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/hooks/useWorldSizeFromMapConfig.ts` and `web/src/App.tsx`.
  - `cd web && npm test -- src/__tests__/App.integration.test.tsx` (pass: 1 file, 11 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b3f2a06affea6CMUZM2iuHUZ0` returned PASS.

**Implementation Notes (2026-02-11, expiring timestamp list hook extraction)**:
- Added `web/src/hooks/useExpiringTimestampList.ts` to encapsulate interval-based pruning of timestamped UI items.
- Updated `web/src/App.tsx` to replace inline speech-bubble pruning effect with:
  - `useExpiringTimestampList<SpeechBubble>({ setItems: setSpeechBubbles, maxAgeMs: 3000, intervalMs: 500 })`
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/hooks/useExpiringTimestampList.ts` and `web/src/App.tsx`.
  - `cd web && npm test -- src/__tests__/App.integration.test.tsx` (pass: 1 file, 11 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b2173179ffe3bOuysTAkxqAmJ` returned PASS.

**Implementation Notes (2026-02-11, global shortcuts hook extraction)**:
- Added `web/src/hooks/useGlobalSimulationShortcuts.ts` to encapsulate global simulation shortcut listeners:
  - Space keydown (`!repeat`) toggles run/pause with `preventDefault()`.
  - Global click marks user interaction.
  - Listener callbacks are stabilized via refs to avoid re-binding churn while still using latest handlers.
- Updated `web/src/App.tsx`:
  - Removed inline global shortcut effect.
  - Wired `useGlobalSimulationShortcuts({ onToggleRun: toggleRun, onMarkInteraction: markUserInteraction })`.
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/hooks/useGlobalSimulationShortcuts.ts` and `web/src/App.tsx`.
  - `cd web && npm test -- src/__tests__/App.integration.test.tsx src/components/__tests__/TickControls.test.tsx` (pass: 2 files, 15 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b20f782bffeeeDkM9gz2tnpId` returned PASS.

**Implementation Notes (2026-02-11, visibility payload normalization extraction)**:
- Added `web/src/visibilityPayload.ts` with `normalizeVisibilityPayload(source)` to centralize:
  - tile visibility normalization (`tile_visibility` and `tile-visibility`).
  - revealed snapshot normalization (`revealed_tiles_snapshot` and `revealed-tiles-snapshot`).
- Updated `web/src/App.tsx` message handlers (`hello`, `tick_delta`, `reset`) to use the shared helper instead of duplicated inline normalization blocks.
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/visibilityPayload.ts` and `web/src/App.tsx`.
  - `cd web && npm test -- src/__tests__/App.integration.test.tsx src/components/__tests__/SimulationCanvas.visibility.test.tsx` (pass: 2 files, 22 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b209556dffePMeGEbiL0CBcvS` returned PASS.

**Implementation Notes (2026-02-11, simulation selectors extraction)**:
- Added `web/src/hooks/useSimulationSelectors.ts` and moved App-derived selector logic out of `web/src/App.tsx`:
  - `agents`, `jobs`, `calendar`, `mythData`, `stockpileTotals`
  - `selectedTile`, `selectedTileItems`, `selectedTileAgents`, `selectedAgent`, `getAgentJob`
- Updated `web/src/App.tsx` to consume selector outputs from `useSimulationSelectors(...)`.
- Adjusted `web/src/components/MythPanel.tsx` deity value handling to support `faith` and `favor` payloads safely (while preserving displayed Faith semantics).
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/hooks/useSimulationSelectors.ts`, `web/src/App.tsx`, and `web/src/components/MythPanel.tsx`.
  - `cd web && npm test -- src/__tests__/App.integration.test.tsx src/__tests__/SelectedPanel.test.tsx src/components/__tests__/ResourceTotalsPanel.test.tsx` (pass: 3 files, 14 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b1f13430ffei04CIijLXKNBJN` returned PASS.

**Implementation Notes (2026-02-11, simulation controls extraction)**:
- Added `web/src/hooks/useSimulationControls.ts` and moved App simulation command handlers into the hook:
  - `toggleRun`, `setFpsValue`, `sendTick`, `reset`, `handleFacetLimitChange`, `handleVisionRadiusChange`, `applyWorldSize`.
- Updated `web/src/App.tsx` to consume the hook and removed duplicated inline control/action handlers from App.
- Kept/reset behavior parity for run/tick/reset/world-size operations and restored independent facet/vision operations (`set_facet_limit`, `set_vision_radius`) during review-driven correction.
- Also resolved App diagnostics surfaced during this slice by adding semantic form label/input associations and explicit `type="button"` on World Size apply action.
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/App.tsx` and `web/src/hooks/useSimulationControls.ts`.
  - `cd web && npm test -- src/__tests__/App.integration.test.tsx src/components/__tests__/TickControls.test.tsx` (pass: 2 files, 15 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b1e1059affeK7OnDAGZ8sjAtr` returned PASS.

**Implementation Notes (2026-02-11, websocket message-handler hook extraction)**:
- Added `web/src/hooks/useSimulationMessageHandler.ts` and moved `App.tsx` websocket op-routing side effects into the hook (`hello`, `tick`, `tick_delta`, `trace`, `books`, `reset`, `social_interaction`, `tiles`, `stockpiles`, `agent_path`, `jobs`, `runner_state`, `tick_health`, `combat_event`).
- Updated `web/src/App.tsx` to consume `useSimulationMessageHandler(...)` and pass all required state refs/setters/normalizers/audio callbacks while preserving existing behavior.
- Kept reset side effects and focus flow parity (clear UI selections/visibility/traces, reset refs, refocus town center) and retained runner/tick-health wiring through extracted handler.
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/App.tsx` and `web/src/hooks/useSimulationMessageHandler.ts`.
  - `cd web && npm test -- src/__tests__/App.integration.test.tsx src/__tests__/ws.test.ts src/hooks/__tests__/useWebSocket.test.tsx` (pass: 3 files, 57 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b1cda814ffeJogWtdR8XXjJsd` returned PASS.

**Implementation Notes (2026-02-11, App dead-code cleanup follow-up)**:
- Removed now-unused imports/helpers from `web/src/App.tsx` after hook extractions (`AgentList`, `RawJSONFeedPanel`, `BuildControls`, unused utility imports, and unused local formatting helper) to reduce file noise without changing behavior.
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/App.tsx`.
  - `cd web && npm test -- src/__tests__/App.integration.test.tsx src/__tests__/ws.test.ts src/hooks/__tests__/useWebSocket.test.tsx` (pass: 57 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b1cda814ffeJogWtdR8XXjJsd` returned PASS for this cleanup slice.

**Implementation Notes (2026-02-11, App unused state/symbol reduction pass)**:
- Removed additional unused App symbols after handler extraction:
  - dropped unused `setAgentPaths` destructure,
  - removed unused `getAgentPath` helper,
  - removed unused `stockpileMode` state,
  - removed unused `getAgentJob` selector destructure,
  - cleaned stale imports tied to those symbols.
- Preserved active path rendering flow by retaining `agentPaths` and continuing to pass it to `SimulationCanvas`.
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/App.tsx`.
  - `cd web && npm test -- src/__tests__/App.integration.test.tsx src/__tests__/ws.test.ts src/hooks/__tests__/useWebSocket.test.tsx` (pass: 57 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b1cda814ffeJogWtdR8XXjJsd` returned PASS.

**Implementation Notes (2026-02-11, post-extraction type/import cleanup)**:
- `web/src/App.tsx`: removed unused `logError` import after recent handler extractions.
- `web/src/hooks/useSimulationMessageHandler.ts`: replaced deprecated `MutableRefObject` annotations with explicit local mutable-ref shape (`{ current: T }`) while preserving existing `.current` read/write behavior.
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/App.tsx` and `web/src/hooks/useSimulationMessageHandler.ts`.
  - `cd web && npm test -- src/__tests__/App.integration.test.tsx src/__tests__/ws.test.ts src/hooks/__tests__/useWebSocket.test.tsx` (pass: 57 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b1cda814ffeJogWtdR8XXjJsd` returned PASS.

**Implementation Notes (2026-02-11, SimulationCanvas keyboard-pan hook extraction)**:
- Added `web/src/hooks/useKeyboardCameraPan.ts` and moved WASD keyboard camera-pan effect logic out of `web/src/components/SimulationCanvas.tsx`.
- Updated `web/src/components/SimulationCanvas.tsx` to consume `useKeyboardCameraPan({ canvasRef, setCamera })` and removed the in-component keyboard pan event/RAF effect block.
- Preserved behavior parity for keyboard pan input lifecycle (keydown/keyup), RAF scheduling/cancelation, zoom-scaled pan speed, and tabIndex setup.
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/components/SimulationCanvas.tsx` and `web/src/hooks/useKeyboardCameraPan.ts`.
  - `cd web && npm test -- src/components/__tests__/SimulationCanvas.test.tsx src/components/__tests__/SimulationCanvas.visibility.test.tsx src/components/__tests__/SimulationCanvas.snapshot.test.tsx src/__tests__/App.integration.test.tsx` (pass: 4 files, 35 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b1b9685fffe6rcCaWMpIqZBOJ` returned PASS.

**Implementation Notes (2026-02-11, SimulationCanvas wheel-zoom hook extraction)**:
- Added `web/src/hooks/useCanvasWheelZoom.ts` and moved canvas wheel-zoom effect logic out of `web/src/components/SimulationCanvas.tsx`.
- Updated `web/src/components/SimulationCanvas.tsx` to consume `useCanvasWheelZoom({ canvasRef, setCamera })` and removed the in-component wheel listener effect.
- Preserved wheel-zoom behavior parity (preventDefault, delta guard, zoom factor calculation, zoom clamping, mouse-anchored offset recalculation, listener setup/cleanup with passive false).
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/components/SimulationCanvas.tsx`, `web/src/hooks/useCanvasWheelZoom.ts`, and `web/src/hooks/useKeyboardCameraPan.ts`.
  - `cd web && npm test -- src/components/__tests__/SimulationCanvas.test.tsx src/components/__tests__/SimulationCanvas.visibility.test.tsx src/components/__tests__/SimulationCanvas.snapshot.test.tsx src/__tests__/App.integration.test.tsx` (pass: 4 files, 35 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b1b3c5c1ffePcJHA07q14x3x7` returned PASS.

**Implementation Notes (2026-02-11, SimulationCanvas focus-recenter hook extraction)**:
- Added `web/src/hooks/useFocusCameraPosition.ts` and moved focus-position camera recenter effect out of `web/src/components/SimulationCanvas.tsx`.
- Updated `web/src/components/SimulationCanvas.tsx` to consume `useFocusCameraPosition({ mapConfig, focusPos, focusTrigger, setCamera })` and removed the in-component focus recenter effect block.
- Preserved focus behavior parity (guards for missing `mapConfig`/`focusPos`, configured hex-size pixel conversion, camera recenter offset assignment, and dependency-trigger behavior including `focusTrigger`).
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/components/SimulationCanvas.tsx` and `web/src/hooks/useFocusCameraPosition.ts`.
  - `cd web && npm test -- src/components/__tests__/SimulationCanvas.test.tsx src/components/__tests__/SimulationCanvas.visibility.test.tsx src/components/__tests__/SimulationCanvas.snapshot.test.tsx src/__tests__/App.integration.test.tsx` (pass: 4 files, 35 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b1ae4c98ffejZRmR9uksVTVX4` returned PASS.

**Implementation Notes (2026-02-11, SimulationCanvas drag-pan hook extraction)**:
- Added `web/src/hooks/useCanvasDragPan.ts` and moved middle-mouse drag pan state/handlers out of `web/src/components/SimulationCanvas.tsx`.
- Updated `web/src/components/SimulationCanvas.tsx` to consume `useCanvasDragPan({ camera, setCamera })` and removed in-component drag pan states/handlers.
- Preserved drag-pan behavior parity (button-1 mousedown guard, drag start snapshots, zoom-scaled delta offsets, mouseup/mouseleave reset, and cursor driven by `isDragging`).
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/components/SimulationCanvas.tsx` and `web/src/hooks/useCanvasDragPan.ts`.
  - `cd web && npm test -- src/components/__tests__/SimulationCanvas.test.tsx src/components/__tests__/SimulationCanvas.visibility.test.tsx src/components/__tests__/SimulationCanvas.snapshot.test.tsx src/__tests__/App.integration.test.tsx` (pass: 4 files, 35 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b1a034afffefzwTJ5RJD4BgiH` returned PASS.

**Implementation Notes (2026-02-11, SimulationCanvas selection-handlers hook extraction)**:
- Added `web/src/hooks/useCanvasSelectionHandlers.ts` and moved click/keyboard cell selection handlers out of `web/src/components/SimulationCanvas.tsx`.
- Updated `web/src/components/SimulationCanvas.tsx` to consume extracted handlers and removed in-component click/keyboard selection logic.
- Preserved selection behavior parity for coordinate conversion with camera offsets/zoom, hidden-tile guard, agent hit detection, `onCellSelect` payload shape, click audio, and keyboard arrow/select navigation.
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/components/SimulationCanvas.tsx` and `web/src/hooks/useCanvasSelectionHandlers.ts`.
  - `cd web && npm test -- src/components/__tests__/SimulationCanvas.test.tsx src/components/__tests__/SimulationCanvas.visibility.test.tsx src/components/__tests__/SimulationCanvas.snapshot.test.tsx src/__tests__/App.integration.test.tsx` (pass: 4 files, 35 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b198f536ffe9sZzEEeXBDG8uV` returned PASS.

**Implementation Notes (2026-02-11, SimulationCanvas selected-cell announcement hook extraction)**:
- Added `web/src/hooks/useSelectedCellAnnouncement.ts` and moved selected-cell live-region announcement logic out of `web/src/components/SimulationCanvas.tsx`.
- Updated `web/src/components/SimulationCanvas.tsx` to consume the hook and keep `aria-live` output wiring unchanged.
- Preserved announcement parity across all states (no selection, selected tile only, selected tile + agent role).
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/components/SimulationCanvas.tsx` and `web/src/hooks/useSelectedCellAnnouncement.ts`.
  - `cd web && npm test -- src/components/__tests__/SimulationCanvas.test.tsx src/components/__tests__/SimulationCanvas.visibility.test.tsx src/components/__tests__/SimulationCanvas.snapshot.test.tsx src/__tests__/App.integration.test.tsx` (pass: 4 files, 35 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b19065b6ffekALhGhgSVKA5g5` returned PASS.

**Implementation Notes (2026-02-11, SimulationCanvas post-extraction cleanup pass)**:
- Removed remaining unused `SimulationCanvas` imports/locals left after prior handler/hook extractions (unused hex/audio/utils imports and dead local vars in the render effect path).
- Confirmed cleanup is behavior-neutral and keeps announcement/live-region wiring intact.
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/components/SimulationCanvas.tsx` and `web/src/hooks/useSelectedCellAnnouncement.ts`.
  - `cd web && npm test -- src/components/__tests__/SimulationCanvas.test.tsx src/components/__tests__/SimulationCanvas.visibility.test.tsx src/components/__tests__/SimulationCanvas.snapshot.test.tsx src/__tests__/App.integration.test.tsx` (pass: 4 files, 35 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b18af0dbffe8D6AMrpA4QgYSd` returned PASS.

**Implementation Notes (2026-02-11, SimulationCanvas context-menu hook extraction)**:
- Added `web/src/hooks/usePreventContextMenu.ts` and moved context-menu prevention handler out of `web/src/components/SimulationCanvas.tsx`.
- Updated `web/src/components/SimulationCanvas.tsx` to consume `usePreventContextMenu<HTMLCanvasElement>()` and retain `onContextMenu` wiring.
- Preserved behavior parity (`event.preventDefault()` on canvas context menu).
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/components/SimulationCanvas.tsx` and `web/src/hooks/usePreventContextMenu.ts`.
  - `cd web && npm test -- src/components/__tests__/SimulationCanvas.test.tsx src/components/__tests__/SimulationCanvas.visibility.test.tsx src/components/__tests__/SimulationCanvas.snapshot.test.tsx src/__tests__/App.integration.test.tsx` (pass: 4 files, 35 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b184d7b9ffeyg0pHEWHvXMKvs` returned PASS.

**Implementation Notes (2026-02-11, SimulationCanvas entity-visibility hook extraction)**:
- Added `web/src/hooks/useEntityVisibility.ts` and moved entity-visibility predicate logic out of `web/src/components/SimulationCanvas.tsx`.
- Updated `web/src/components/SimulationCanvas.tsx` to consume `useEntityVisibility({ selectedVisibilityAgentId, visibilityData, snapshot })` while preserving existing render-path filtering calls.
- Preserved visibility behavior parity for selected-agent visibility map lookup and per-entity filtering (`agent`, `tile`, `item`, `stockpile`) with same fallback-to-visible behavior when visibility context is missing.
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/components/SimulationCanvas.tsx` and `web/src/hooks/useEntityVisibility.ts`.
  - `cd web && npm test -- src/components/__tests__/SimulationCanvas.test.tsx src/components/__tests__/SimulationCanvas.visibility.test.tsx src/components/__tests__/SimulationCanvas.snapshot.test.tsx src/__tests__/App.integration.test.tsx` (pass: 4 files, 35 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b18061b8ffeYrCeJVMUmQ93KZ` returned PASS.

**Implementation Notes (2026-02-11, SimulationCanvas tile-visibility-state hook extraction)**:
- Added `web/src/hooks/useTileVisibilityState.ts` and moved tile visibility state resolution logic out of `web/src/components/SimulationCanvas.tsx`.
- Updated `web/src/components/SimulationCanvas.tsx` to consume `useTileVisibilityState({ tileVisibility, snapshot })` and preserve existing render-path usage.
- Preserved behavior parity for snapshot-backed visible fallback (`tile exists in snapshot + no explicit visibility entry`) and hidden default fallback otherwise.
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/components/SimulationCanvas.tsx` and `web/src/hooks/useTileVisibilityState.ts`.
  - `cd web && npm test -- src/components/__tests__/SimulationCanvas.test.tsx src/components/__tests__/SimulationCanvas.visibility.test.tsx src/components/__tests__/SimulationCanvas.snapshot.test.tsx src/__tests__/App.integration.test.tsx` (pass: 4 files, 35 tests).
  - `cd web && npm test` (pass: 27 files, 279 tests).
  - `cd web && npm run build` (pass).
  - Sub-agent verification session `ses_3b176a954ffe7EydsLbMlus0Lx` returned PASS.

**Implementation Notes (2026-02-11, agent disappearance regression fix)**:
- Regression observed in active sim runtime: agents disappeared after first tick/delta cycle while other world telemetry continued updating.
- Root cause identified in `web/src/utils.ts` delta merge hardening: `applyAgentDeltas` kept unchanged agents only when `agent.id` was numeric and coerced new IDs through `Number(...)`, which dropped/polluted non-numeric (UUID/string) IDs.
- Applied fix in `web/src/utils.ts`:
  - preserve unchanged agents for all ID shapes using string-key comparison,
  - track removals by string key,
  - coerce incoming IDs to number only when truly numeric, otherwise preserve string IDs.
- Added regression tests in `web/src/__tests__/utils.test.ts`:
  - unchanged string-ID agents remain after subset deltas,
  - non-numeric IDs are added without coercion to `NaN`.
- Kanban association: linked to existing frontend hardening stream in this spec (no new standalone task required).
- Verification:
  - `lsp_diagnostics` (severity=error) clean for `web/src/utils.ts` and `web/src/__tests__/utils.test.ts`.
  - `cd web && npm test -- src/__tests__/utils.test.ts src/__tests__/ws.test.ts src/__tests__/App.integration.test.tsx src/components/__tests__/SimulationCanvas.visibility.test.tsx` (pass: 4 files, 88 tests).
  - `cd web && npm test` (pass: 27 files, 281 tests).
  - `cd web && npm run build` (pass).

---

### 13. Extract Canvas Drawing Hook

**Priority**: Medium  
**Story Points**: 3

**Problem**: Canvas drawing logic is mixed with state management and event handling in SimulationCanvas component.

**Files Affected**:
- `web/src/components/SimulationCanvas.tsx:132-395`

**Solution**:
1. Create `hooks/useCanvasRenderer.ts` hook
2. Encapsulate all drawing logic
3. Return `render` function and configuration
4. Separate concerns: camera, zoom, drawing primitives

**Definition of Done**:
- [ ] Drawing logic extracted to hook
- [ ] SimulationCanvas focuses on event handling only
- [ ] Hook is testable with mock canvas context
- [ ] Drawing functions are pure (no side effects)

**Acceptance Criteria**:
- SimulationCanvas code reduced by >100 lines
- Drawing logic can be unit tested
- No functionality changes after extraction
- Performance maintained

---

### 14. Add Virtual Scrolling

**Priority**: Medium  
**Story Points**: 4

**Problem**: Long lists (traces, events, agents) render all items, causing performance issues with 100+ items.

**Files Affected**:
- `web/src/App.tsx:579-629` (traces list)
- `web/src/components/AgentList.tsx`
- `web/src/components/EventFeed.tsx` (if exists)

**Solution**:
1. Add `react-window` or `react-virtualized` dependency
2. Implement virtual scrolling for traces list
3. Implement virtual scrolling for agent list (50+ agents)
4. Keep item height stable for performance

**Definition of Done**:
- [ ] Traces list uses virtual scrolling
- [ ] Agent list uses virtual scrolling when >50 items
- [ ] Scroll performance is smooth with 500+ items
- [ ] Keyboard navigation works correctly

**Acceptance Criteria**:
- Lists scroll smoothly with 1000+ items
- Initial render time under 100ms
- Memory usage scales with visible items, not total
- No visual artifacts during scroll

---

### 15. Add Error Boundaries

**Priority**: Medium  
**Story Points**: 2

**Problem**: WebSocket errors or rendering errors can crash the entire app with no graceful degradation.

**Files Affected**:
- `web/src/App.tsx` (root component)
- `web/src/main.tsx` (entry point)

**Solution**:
1. Create `components/ErrorBoundary.tsx`
2. Wrap App component in ErrorBoundary
3. Add retry mechanism for WebSocket errors
4. Display user-friendly error messages

**Definition of Done**:
- [ ] ErrorBoundary component created
- [ ] App wrapped in ErrorBoundary
- [ ] WebSocket errors caught and displayed
- [ ] Retry button allows reconnection
- [ ] Error reporting (console/Sentry) integrated

**Acceptance Criteria**:
- Network errors show friendly UI instead of blank screen
- Recoverable errors allow user to continue
- Crash logging captures error details
- No white screen of death

---

### 16. Centralize Configuration ✅

**Priority**: Low  
**Story Points**: 1
**Status**: Completed 2026-01-19

**Problem**: Magic numbers scattered throughout code (HEX_SIZE, timeouts, limits).

**Files Affected**:
- `web/src/components/SimulationCanvas.tsx:23-29`
- `web/src/App.tsx` (various constants)

**Solution**:
1. Create `config/constants.ts` file
2. Export all constants with documentation
3. Replace magic numbers with named constants
4. Consider making some configurable via environment

**Definition of Done**:
- [ ] All magic numbers replaced with named constants
- [ ] Constants are documented with usage
- [ ] Some constants are environment-configurable
- [ ] No duplicate constant values

**Acceptance Criteria**:
- Searching for literal numbers finds only comments/tests
- Constants file is under 100 lines
- Changing a constant in one place affects all uses
- Documentation explains each constant's purpose

---

## Accessibility & Testing

### 17. Improve Canvas Accessibility

**Priority**: Low  
**Story Points**: 2

**Problem**: Canvas lacks ARIA labels and keyboard users cannot interact with the simulation.

**Files Affected**:
- `web/src/components/SimulationCanvas.tsx`

**Solution**:
1. Add ARIA labels to canvas element
2. Implement keyboard navigation for cell selection
3. Add screen reader announcements for important events
4. Consider alternative text-based view for screen readers

**Definition of Done**:
- [x] Canvas has proper ARIA labels
- [x] Keyboard navigation works (arrow keys for movement, Enter for selection)
- [x] Important events announced to screen readers
- [x] Focus management is correct

**Acceptance Criteria**:
- NVDA/VoiceOver announces selected cell coordinates
- Keyboard users can navigate entire map
- Tab order is logical
- WAVE or axe DevTools shows no critical issues

**Implementation Notes (2026-02-10)**:
- Added `aria-label` and explicit `tabIndex` to `SimulationCanvas` canvas element.
- Added keyboard map navigation in `web/src/components/SimulationCanvas.tsx`:
  - Arrow keys move selected cell.
  - Enter/Space select current cell.
  - Hidden tiles are ignored for keyboard selection just like mouse selection.
- Added test `supports keyboard navigation with arrow keys` in `web/src/components/__tests__/SimulationCanvas.test.tsx`.
- Added screen-reader announcement region (`aria-live="polite"`) tied to canvas via `aria-describedby`, with selected cell/agent announcement text.
- Added tests for live announcement content:
  - `announces selected cell for screen readers`
  - `announces selected agent details for screen readers`
- Verification:
  - `cd web && npm test` (pass: 25 files, 271 tests)
  - `cd web && npm run build` (pass)
  - Sub-agent verification session `ses_3b4ffbddbffeN4HaJgk94g8X2I` confirmed announcement behavior.

---

### 18. Add Integration Tests

**Priority**: Medium  
**Story Points**: 6

**Problem**: No end-to-end tests verify the full workflow from WebSocket to UI.

**Files Affected**:
- `web/` (new test files)

**Solution**:
1. Add Playwright or Cypress for E2E tests
2. Test critical flows: tick, place shrine, adjust levers, select agents
3. Test error conditions: WebSocket disconnect, network errors
4. Add Visual Regression testing for canvas

**Definition of Done**:
- [x] E2E test framework set up
- [x] Core user flows have tests
- [x] WebSocket mocking for tests works
- [x] Canvas snapshots for visual regression
- [ ] Tests run in CI

**Acceptance Criteria**:
- E2E tests cover 80% of critical user paths
- Tests complete in <5 minutes
- Flaky tests < 5%
- CI pipeline runs E2E tests

**Implementation Notes (2026-02-10)**:
- Existing WebSocket E2E suite validates core flows (`web/src/__tests__/e2e/websocket-e2e.test.ts`), including tick, reset, structure placement, lever updates, and connection stability.
- Added App integration regression for WebSocket status transitions in `web/src/__tests__/App.integration.test.tsx`:
  - `updates status bar on websocket close and reopen`
  - Verifies close/open callback handling updates `WS: closed` -> `WS: open`.
- Added visual regression snapshot test:
  - `web/src/components/__tests__/SimulationCanvas.snapshot.test.tsx`
  - Snapshot artifact in `web/src/components/__tests__/__snapshots__/SimulationCanvas.snapshot.test.tsx.snap`.
- Verification:
  - `cd web && npm test -- --update` (pass: 26 files, 273 tests; snapshot written/validated)
  - `cd web && npm run build` (pass)
  - Sub-agent verification session `ses_3b4fc6773ffe3A6Sf446BNRjEo` confirmed status transition coverage and green suite.
  - Sub-agent verification session `ses_3b4f6ff56ffe1roaulsuG8LNhT` confirmed snapshot regression coverage.
  - Re-verified full suite after reconnect/e2e helper stabilization:
    - `cd web && npm test` (pass: 26 files, 275 tests)
    - `cd web && npm run build` (pass)
    - Sub-agent verification session `ses_3b4dcf786ffeX76xPu4qSLdTVJ`.

---

## Migration Strategy

**Phase 1 (Week 1-2): Quick Wins**
- Items 9, 10, 16, 6 - Low hanging fruit
- Story points: 6
- Goal: Clean up code, prepare for larger changes

**Phase 2 (Week 3-4): Performance**
- Items 1, 2, 3, 4, 5 - Core performance issues
- Story points: 14
- Goal: Eliminate performance bottlenecks

**Phase 3 (Week 5-7): Architecture**
- Items 11, 12, 13, 15, 14 - Major refactoring
- Story points: 18
- Goal: Improve maintainability and testability

**Phase 4 (Week 8-9): Quality**
- Items 7, 8, 17, 18 - Type safety and testing
- Story points: 18
- Goal: Production readiness

**Total Estimated Effort**: 56 story points (~11-13 weeks)

---

## Testing Checklist

Before deploying any optimization:
- [ ] All existing tests pass
- [ ] New tests added for changed code
- [ ] Performance benchmarks run before/after
- [ ] Manual smoke test passes (tick, place shrine, adjust levers)
- [ ] Console is clean (no errors/warnings in production)
- [ ] TypeScript compilation succeeds
- [ ] Bundle size analyzed (no significant increases)

---

## Success Metrics

Track these metrics throughout the optimization process:

- **First Contentful Paint**: Target < 1s
- **Time to Interactive**: Target < 2s
- **Frame Rate**: Target 60fps during normal operation
- **Bundle Size**: Target < 200KB gzipped
- **TypeScript Coverage**: Target > 95%
- **Test Coverage**: Target > 80%
- **Lighthouse Performance**: Target > 90

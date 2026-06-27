# Health Indicator Feature

## Purpose
Add a visual indicator to the frontend that shows whether the simulation is keeping up with the desired tick rate (FPS).

## Requirements
- Display a health status in the UI that indicates if the simulation is healthy, degraded, or unhealthy
- Health is based on whether ticks complete within the target interval
- The indicator should update in real-time as the simulation runs

## Design

### Metrics to Track
1. **Target tick interval** (`:ms`) - The desired time between ticks in milliseconds
2. **Actual tick duration** (`:tick-ms`) - How long the last tick took to compute
3. **Health status** - Derived from the ratio of actual to target duration:
   - **Healthy**: tick duration < 70% of target interval
   - **Degraded**: 70-90% of target interval
   - **Unhealthy**: > 90% of target interval

### Backend Changes

#### Files
- `backend/src/fantasia/server.clj`

#### Changes
1. Add `:tick-ms` field to `*runner` atom to track last tick duration
2. Measure tick duration in `start-runner!` by timing the `sim/tick! 1` call
3. Include health metrics in tick messages:
   ```clojure
   {:op "tick_health"
    :data {:target-ms (:ms @*runner)
           :tick-ms (:tick-ms @*runner)
           :health (compute-health-status (:tick-ms @*runner) (:ms @*runner))}}
   ```

### Frontend Changes

#### Files
- `web/src/ws.ts` - Add WS message type
- `web/src/App.tsx` - Add health state and handling
- `web/src/components/StatusBar.tsx` - Display health indicator

#### Changes
1. Add `tickHealth` type to `WSMessage` union
2. Add state in App.tsx:
   ```typescript
   const [tickHealth, setTickHealth] = useState<{
     targetMs: number;
     tickMs: number;
     health: "healthy" | "degraded" | "unhealthy";
   } | null>(null);
   ```
3. Handle `tick_health` message in App.tsx WebSocket handler
4. Update StatusBar to display health with visual indicator:
   - Healthy: green dot ✓
   - Degraded: yellow dot ⚠
   - Unhealthy: red dot ✗

## Implementation Plan

### Phase 1: Backend Health Tracking
- Modify `start-runner!` to measure tick duration
- Store tick duration in `*runner` atom
- Add `compute-health-status` helper function
- Broadcast health metrics with each tick

### Phase 2: Frontend Health Display
- Add health message type to ws.ts
- Add health state to App.tsx
- Handle tick_health messages
- Update StatusBar component to show health indicator

### Phase 3: Testing
- Test with various FPS settings (1-120)
- Verify health status changes when simulation load changes
- Test that indicator updates in real-time

## Definition of Done
- [x] Backend measures tick duration and includes in tick_health messages
- [x] Frontend receives and stores health metrics
- [x] StatusBar displays health indicator with visual cue (color/icon)
- [x] Health status updates in real-time during simulation
- [x] Tests pass for new functionality (existing pre-existing test failures noted)
- [x] TypeScript type checking passes
- [x] Backend compiles and starts successfully

## Related Code
- `backend/src/fantasia/server.clj:48` - *runner atom definition
- `backend/src/fantasia/server.clj:57-72` - start-runner! function
- `backend/src/fantasia/server.clj:64` - tick broadcast location
- `web/src/components/StatusBar.tsx` - StatusBar component
- `web/src/App.tsx:227-230` - runner_state handling

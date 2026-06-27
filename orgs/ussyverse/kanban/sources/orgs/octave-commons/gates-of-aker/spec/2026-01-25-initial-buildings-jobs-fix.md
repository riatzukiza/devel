# Initial Building and Job Generation Fix

---
Type: spec
Component: backend, ecs
Priority: critical
Status: proposed
Related-Issues: []
Milestone: 3.5
Estimated-Effort: 4 hours
---

## Context

- Issue reported: "Agents aren't moving around, there are no jobs available for the agents."
- Agents need to start with some buildings, especially the building that lets them build buildings (workshop).

## Root Cause Analysis

1. **Job Creation Disabled**: In `backend/src/fantasia/sim/ecs/tick.clj`:
   - Line 6: `[fantasia.sim.ecs.systems.job-creation]` is commented out
   - Line 32: `(fantasia.sim.ecs.systems.job-creation/process global-state)` is commented out
   - Line 34: `(fantasia.sim.ecs.systems.job_assignment/process global-state)` is commented out
   - Line 37: `(fantasia.sim.ecs.systems.agent-interaction/process)` is commented out

2. **Wrong Initial Buildings**: In `backend/src/fantasia/sim/ecs/tick.clj` (lines 84-99):
   - Initial buildings spawned: `:campfire` and `:stockpile`
   - These buildings are NOT in `job-provider-config` (jobs.clj:71-80)
   - Neither provides jobs via JobQueue component

3. **Missing Critical Building**:
   - `:workshop` is the only building that provides `:job/builder` (jobs.clj:77)
   - Workshop enables building construction of all other structures
   - Without workshop, agents cannot build anything, no construction jobs are available

4. **JobProvider Configuration** (jobs.clj:71-80):
   ```clojure
   :lumberyard {:job-type :job/harvest-wood :max-jobs 6}
   :orchard {:job-type :job/harvest-fruit :max-jobs 4}
   :granary {:job-type :job/harvest-grain :max-jobs 4}
   :farm {:job-type :job/farm :max-jobs 4}
   :quarry {:job-type :job/mine :max-jobs 6}
   :workshop {:job-type :job/builder :max-jobs 6}  ;; CRITICAL - enables building!
   :improvement-hall {:job-type :job/improve :max-jobs 3}
   :smelter {:job-type :job/smelt :max-jobs 3}
   :library {:job-type :job/scribe :max-jobs 6}
   ```

## Related Documentation

- `docs/notes/2026-01-19-job-provider-loop.md`: "initial world seeds 16 provider jobs"
- `spec/2026-01-19-harvest-buildings.md`: "Auto-build harvest buildings near campfire when demand exists"
- `backend/src/fantasia/sim/jobs.clj`:1233-1259: `generate-harvest-building-jobs!` generates jobs from buildings
- `backend/src/fantasia/sim/ecs/systems/job_creation.clj`: Basic job generation for buildings

## Requirements

### Phase 1: Enable Job Systems (Critical)

1. Uncomment and enable job creation system in `run-systems`:
   - Uncomment line 6: `[fantasia.sim.ecs.systems.job-creation]`
   - Uncomment line 32: `(fantasia.sim.ecs.systems.job-creation/process global-state)`

2. Uncomment and enable job assignment system:
   - Uncomment line 34: `(fantasia.sim.ecs.systems.job_assignment/process global-state)`

3. Uncomment agent interaction system (if stable):
   - Uncomment line 37: `(fantasia.sim.ecs.systems.agent-interaction/process)`

### Phase 2: Add Workshop to Initial Buildings (Critical)

1. Modify `spawn-initial-buildings!` in `tick.clj`:
   - Add `:workshop` building near campfire
   - Workshop should spawn with stockpile configuration for `:log` (building material)
   - Workshop provides `:job/builder` which allows agents to build other structures

2. Initial building layout:
   ```clojure
   campfire-pos    [(- center-q 2) center-r]
   workshop-pos     [(+ center-q 2) center-r]  ;; NEW: builder jobs
   stockpile-pos    [(+ center-q 4) center-r]
   ```

### Phase 3: Generate Initial Jobs

1. Workshop should generate builder jobs on spawn
2. Ensure `job_creation.clj:generate-basic-jobs` creates jobs for workshop
3. Test that agents can claim and work builder jobs

## Definition of Done

- Job creation and assignment systems are enabled and running
- Initial world spawn includes workshop building with builder job capability
- Agents can move and claim builder jobs from workshop
- Builder jobs enable construction of other structures
- No commented-out job systems in `tick.clj` run-systems
- Tests pass with agents actively working

## Implementation Notes

- Workshop is critical: it's the only building providing `:job/builder` (jobs.clj:77)
- Builder jobs allow construction of: `[:stockpile :house :lumberyard :orchard :granary :farm :quarry :warehouse :smelter :improvement-hall :workshop :library :temple :school :road]` (jobs.clj:86)
- Initial workshop should have stockpile for `:log` resources to enable building construction
- Job queue component should be populated with initial jobs after workshop spawn

## Testing Plan

1. Create new world, verify workshop spawns near campfire
2. Verify workshop has JobQueue component with builder jobs
3. Run tick, verify agents claim builder jobs
4. Verify agents move to workshop and make progress
5. Verify agents can place other structures using builder jobs

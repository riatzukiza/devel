# Aggressive Civilization Building

## Problem
The simulation doesn't feel like a growing civilization. Colonists are passive and require significant player intervention to build structures. Key issues:
- Very low job generation limits (1-3 jobs per structure type)
- No auto-build for workshop (required for all building jobs)
- No auto-build for library (required for scribe jobs)
- Idle building jobs only trigger when agents are idle, not proactively
- No frontier expansion logic - colonists don't expand beyond campfire

## Goal
Make the colony feel alive by having colonists continuously build, expand, and create jobs autonomously.

## Current State
- `job-priorities` (jobs.clj:14-35): Builder jobs are low priority (38)
- `job-provider-config` (jobs.clj:68-77): Very restrictive max-jobs limits
- `generate-idle-structure-jobs!` (jobs.clj:1197-1217): Only fires when idle agents exist
- No workshop auto-build - player must manually place
- No library auto-build - player must manually place

## Solution

### Phase 1: Increase Job Generation Capacity
**File**: `backend/src/fantasia/sim/jobs.clj`
**Lines**: 68-77

Increase max-jobs for all providers:
```clojure
(def job-provider-config
   {:lumberyard {:job-type :job/harvest-wood :max-jobs 6}
    :orchard {:job-type :job/harvest-fruit :max-jobs 4}
    :granary {:job-type :job/harvest-grain :max-jobs 4}
    :farm {:job-type :job/farm :max-jobs 4}
    :quarry {:job-type :job/mine :max-jobs 6}
    :workshop {:job-type :job/builder :max-jobs 6}
    :improvement-hall {:job-type :job/improve :max-jobs 3}
    :smelter {:job-type :job/smelt :max-jobs 3}
    :library {:job-type :job/scribe :max-jobs 6}})
```

### Phase 2: Auto-Build Critical Structures
**File**: `backend/src/fantasia/sim/jobs.clj`
**New function**: `generate-missing-structures-jobs!`

Add automatic job generation for missing critical structures:
- If no workshop exists and resources available: add build workshop job
- If no library exists and resources available: add build library job

```clojure
(defn- structure-exists? [world structure-type]
  (some #(= (:structure %) structure-type) (vals (:tiles world))))

(defn generate-missing-structures-jobs! [world]
  (let [campfire-pos (find-campfire-pos world)
        target (find-structure-site world campfire-pos)
        existing-jobs (->> (:jobs world)
                           (filter #(= (:type %) :job/build-structure))
                           (map :structure)
                           set)
        log-qty (+ (jobs/total-item-qty (:items world) :log)
                   (jobs/total-item-qty (:items world) :wood))]
    (cond-> world
      (and target
           (not (structure-exists? world :workshop))
           (not (contains? existing-jobs :workshop))
           (>= log-qty 3))
      (jobs/add-job-to-world!
        (assoc (jobs/create-job :job/build-structure target)
               :structure :workshop
               :stockpile {:resource :log :max-qty 120}))

      (and target
           (not (structure-exists? world :library))
           (not (contains? existing-jobs :library))
           (>= log-qty 3))
      (jobs/add-job-to-world!
        (assoc (jobs/create-job :job/build-structure target)
               :structure :library
               :stockpile {:resource :log :max-qty 120})))))
```

### Phase 3: More Aggressive Idle Building
**File**: `backend/src/fantasia/sim/jobs.clj`
**Lines**: 1197-1217 (generate-idle-structure-jobs!)

Modify `generate-idle-structure-jobs!` to:
- Remove idle agent requirement (always check)
- Include all build-structure-options
- Add wall/road expansion logic
- Increase frequency of building

### Phase 4: Frontier Expansion
**File**: `backend/src/fantasia/sim/jobs.clj`
**New function**: `generate-expansion-jobs!`

Add logic to expand to new areas:
- Find empty tiles within expansion radius of existing structures
- Prioritize roads to connect to resources
- Build stockpiles at expansion fronts

## Definition of Done
- [ ] All job provider max-jobs increased (2-3x current values)
- [ ] Workshop auto-builds when missing and resources available
- [ ] Library auto-builds when missing and resources available
- [ ] Idle building generates jobs more frequently
- [ ] Colonists build roads to expand territory
- [ ] Colony visibly grows over time without player input
- [ ] All existing tests pass
- [ ] Simulation run shows continuous building activity

## Files to Modify
1. `backend/src/fantasia/sim/jobs.clj` - Job provider config and generation functions
2. `backend/src/fantasia/sim/tick/core.clj` - Add new job generation calls to tick loop

## Test Plan
1. Start simulation with initial colonists
2. Observe 100 ticks without player intervention
3. Verify:
   - Workshop gets built automatically
   - Library gets built automatically
   - Multiple jobs appear in queue (5-10+)
   - New structures appear over time
   - Roads connect existing structures
   - Colony visibly expands from campfire
4. Run test suite: `clojure -M:test`

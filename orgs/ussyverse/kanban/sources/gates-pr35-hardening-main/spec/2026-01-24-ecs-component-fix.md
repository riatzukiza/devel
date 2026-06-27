# ECS Component Creation Fix

## Root Cause Diagnosis (2026-01-24)

### Problem
The `create-agent` and `create-tile` functions in `backend/src/fantasia/sim/ecs/core.clj` use an incorrect pattern for adding components to entities via `brute.entity`.

**Current broken pattern:**
```clojure
;; Lines 29-40 in core.clj
base-components {entity-id {(c/->AgentInfo ...) (c/->AgentInfo ...)
                           (c/->Position q r) (c/->Position q r)
                           ...}}
system' (be/add-entity system all-components)
```

This creates a nested map where component record instances are used as both keys and values, which `brute.entity` does not recognize.

### Verification

Tested three patterns with `brute.entity`:

1. **Working pattern** (`be/add-entity` + `be/add-component`):
   ```clojure
   (-> world
       (be/add-entity entity-id)
       (be/add-component entity-id (c/->Role :priest))
       (be/add-component entity-id (c/->Position 0 0)))
   ```
   Result: Entity found correctly via queries

2. **Broken pattern** (single component map):
   ```clojure
   (be/add-entity world {entity-id role})
   ```
   Result: Entity NOT found via queries

3. **Broken pattern** (nested map - current code):
   ```clojure
   (be/add-entity world {entity-id {comp1 comp1 comp2 comp2}})
   ```
   Result: Entity NOT found via queries

### Impact

All 5 test failures in `systems_test.clj` stem from this root cause:

1. `test-needs-decay` - `initial-needs` and `updated-needs` both nil (components never added)
2. `test-needs-decay-cold-snap` - `needs-cold` is nil (components never added)
3. `test-combat-health-modification` (2 failures) - `priest-health` and `knight-health` both nil
4. `test-mortality-cleanup-components` - `agent-exists?` is nil (components never added)

The debug output confirms this:
```
Testing ecs->agent-map...
Agent map: {:role nil, :needs nil, ...}
```

### Solution

Refactor `create-agent` and `create-tile` to use the correct pattern:

```clojure
(defn create-agent
  "Create an agent entity with standard components."
  ([system id q r role]
   (create-agent system id q r role {}))
  ([system id q r role opts]
    (let [entity-id (or id (java.util.UUID/randomUUID))
          {:keys [warmth food sleep wood needs status inventory frontier recall path job-id]} opts
          needs' (or needs (c/->Needs warmth food sleep 1.0 0.8 0.6 0.5 0.5 0.5 0.6 0.5 0.5 0.5))
          status' (or status (c/->AgentStatus true false false nil))
          inventory' (or inventory (c/->PersonalInventory wood food {}))
          frontier' (or frontier (c/->Frontier {}))
          recall' (or recall (c/->Recall {}))
          system' (-> system
                      (be/add-entity entity-id)
                      (be/add-component entity-id (c/->AgentInfo id (str "agent-" id)))
                      (be/add-component entity-id (c/->Position q r))
                      (be/add-component entity-id (c/->Role role))
                      (be/add-component entity-id needs')
                      (be/add-component entity-id inventory')
                      (be/add-component entity-id status')
                      (be/add-component entity-id frontier')
                      (be/add-component entity-id recall'))
          system'' (cond-> system'
                      job-id (be/add-component entity-id (c/->JobAssignment job-id 0.0))
                      path (be/add-component entity-id (c/->Path path 0)))]
        [entity-id system''])))
```

Similar pattern for `create-tile`, `create-stockpile`, and `create-world-item`.

### Files to Fix

1. `backend/src/fantasia/sim/ecs/core.clj`
   - `create-agent` (lines 17-41)
   - `create-tile` (lines 43-58)
   - `create-stockpile` (lines 84-91)
   - `create-world-item` (lines 93-101)

2. `backend/src/fantasia/sim/ecs/systems/mortality.clj`
   - `create-death-memory` (lines 28-59) - check pattern

### Related Tests

- `backend/test/fantasia/sim/ecs/systems_test.clj` - all 5 failing tests should pass
- `backend/test/fantasia/sim/ecs/adapter_test.clj` - verify adapter still works

### Verification

After fix, run:
```bash
cd backend && clojure -X:test
```

**Result**: ✅ All 33 tests pass (0 failures, 0 errors)

### Implementation Notes

Fixed functions in `backend/src/fantasia/sim/ecs/core.clj`:
- `create-agent` (lines 17-41) - refactored to use threading pattern
- `create-tile` (lines 43-58) - refactored to use threading pattern
- `create-stockpile` (lines 84-91) - refactored to use threading pattern

`create-world-item` was already using the correct pattern (no change needed).

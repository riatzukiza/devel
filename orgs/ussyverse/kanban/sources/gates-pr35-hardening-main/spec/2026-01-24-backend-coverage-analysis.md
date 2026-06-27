# Backend Code Coverage Analysis - Critical Untested Paths

**Date:** 2026-01-24
**Status:** 21.73% forms, 31.01% lines - **Significant risk areas**

---
Type: review
Component: backend
Priority: critical
Status: proposed
Related-Issues: [15]
Milestone: 3.5
Estimated-Effort: 44 hours
---

## Coverage Summary

| Module | % Forms | % Lines | Status |
|--------|---------|---------|--------|
| fantasia.server | 3.92% | 16.49% | 🚨 Critical |
| fantasia.sim.jobs | 5.19% | 11.76% | 🚨 Critical |
| fantasia.sim.hex | 6.60% | 18.75% | 🚨 Critical |
| fantasia.sim.los | 2.08% | 11.59% | 🚨 Critical |
| fantasia.sim.delta | 1.46% | 7.34% | ⚠️ Moderate |
| fantasia.sim.agent-visibility | 1.85% | 12.31% | ⚠️ Moderate |
| fantasia.sim.world | 54.47% | 56.29% | ✅ Good |
| fantasia.sim.ecs.adapter | 76.78% | 71.59% | ✅ Good |
| fantasia.sim.events | 97.58% | 98.15% | ✅ Excellent |
| fantasia.sim.myth | 99.39% | 100.00% | ✅ Excellent |
| fantasia.sim.events.runtime | 93.70% | 93.06% | ✅ Excellent |
| fantasia.sim.ecs.systems.movement | 86.73% | 88.89% | ✅ Good |
| fantasia.sim.ecs.systems.needs-decay | 84.89% | 95.65% | ✅ Good |
| fantasia.sim.constants | 100.00% | 100.00% | ✅ Perfect |

---

## 🚨 Critical Risk Areas (Highest Priority)

### 1. fantasia.server (3.92% forms, 16.49% lines)
**Impact:** WebSocket communication, all frontend-backend integration

**Untested Critical Paths:**
- **WebSocket message handlers** (`handle-ws`, line 167+) - Every `case` branch for `op` messages:
  - `"tick"`, `"reset"`, `"set_levers"`, `"place_shrine"`, `"place_wall_ghost"`
  - `"place_stockpile"`, `"place_warehouse"`, `"place_campfire"`
  - `"place_tree"`, `"place_deer"`, `"place_wolf"`, `"place_bear"`
  - `"queue_build"`, `"assign_job"` (TODO, line 298)
  - Plus ~10 more ops not shown
- **Error handling:** `keywordize-deep`, `read-json-body` - Malformed JSON handling
- **Connection lifecycle:** New client connect/disconnect, nREPL start/stop

**Risk:** Any WS message can break the game or cause undefined behavior

---

### 2. fantasia.sim.jobs (5.19% forms, 11.76% lines)
**Impact:** Core gameplay loop - colony behavior, resource management

**Untested Critical Paths:**
- **Job lifecycle:**
  - `create-job`, `create-hunt-job` - Job creation with logging
  - `claim-next-job!`, `assign-job!` - Agent job assignment
  - `auto-assign-jobs!` - Loop assigning jobs to idle agents (line 180)
- **Resource management:**
  - `add-item!`, `consume-items!` - Item storage/consumption
  - Stockpile operations: `create-stockpile!`, `add-to-stockpile!`, `take-from-stockpile!`
  - `stockpile-has-space?`, `stockpile-space-remaining`
- **Job types** (lines 1-40):
  - 19 job types with priorities: eat (100), sleep (90), chop-tree (60), etc.
  - None of the actual job execution logic is tested

**Risk:** Job loop fails → colony dies → player loses progress

---

### 3. fantasia.sim.hex (18.83% forms, 29.46% lines) ✅ IMPROVED
**Impact:** Coordinate system, pathfinding, world bounds

**Tested Paths** (2026-01-24):
- ✅ `add` - Basic coordinate addition
- ✅ `neighbors` - Returns 6 adjacent positions
- ✅ `distance` - Hex distance calculation
- ✅ `in-bounds?` - Rect and radius bounds checking
- ✅ `ring` - Position ring generation

**Still Untested:**
- **Coordinate coercion:** `coerce-axial` - Input validation for malformed positions
- **Random sampling:** `rand-pos` - Generates random valid positions

**Risk:** Pathfinding fails → agents stuck, walls don't block movement

**Next steps:**
1. Make `coerce-axial`, `ensure-origin` public (they're used from other modules)
2. Test `coerce-axial` with edge cases
3. Test `rand-pos` validates bounds correctly

---

### 4. fantasia.sim.los (2.08% forms, 11.59% lines)
**Impact:** Fog of war, agent perception (critical for gameplay)

**Status:** No tests exist at all

**Risk:** Visibility system breaks → player can't see or agents can't move

---

## 📊 Moderate Risk Areas

### 5. fantasia.sim.delta (1.46% forms, 7.34% lines)
**Impact:** Delta updates for WS (performance critical)

### 6. fantasia.sim.agent-visibility (1.85% forms, 12.31% lines)
**Impact:** Agent LOS, champion/day mode visibility

### 7. fantasia.sim.world (54.47% forms, 56.29% lines)
**Impact:** World state management (partial coverage)

---

## ✅ Well-Tested Areas (Do Not Worry)

- fantasia.sim.events (97.58% forms) - Myth engine
- fantasia.sim.myth (99.39% forms) - Myth system
- fantasia.sim.events.runtime (93.70% forms) - Event execution
- fantasia.sim.ecs.systems.movement (86.73% forms) - Agent movement
- fantasia.sim.ecs.systems.needs-decay (84.89% forms) - Agent needs
- fantasia.sim.constants (100% forms) - Constants
- All test files (100% forms, as expected)

---

## 🎯 Recommended Action Plan (Prioritized by Risk)

### Phase 1: WebSocket Safety (Week 1, ~8 hours)
**Goal:** Prevent server crashes from malformed messages

1. **Create `backend/test/fantasia/sim/server_test.clj`**
   - Test each WS op with valid/invalid payloads
   - Test JSON parsing errors
   - Test connection lifecycle
   - Test `keywordize-deep` edge cases

2. **Add error handling wrappers**
   - Wrap `case` op handlers in try/catch
   - Return `{:op "error" :message "..."}` on failures

### Phase 2: Job Loop Coverage (Week 2, ~12 hours)
**Goal:** Verify core colony behavior

1. **Create `backend/test/fantasia/sim/jobs_test.clj`**
   - Test job creation for all 19 types
   - Test job assignment/priority sorting
   - Test stockpile add/remove operations
   - Test `auto-assign-jobs!` with multiple agents
   - Test edge cases: empty world, full stockpiles, no pending jobs

2. **Add job completion tests**
   - Test `complete-chop-tree!`, `complete-eat!`, `complete-sleep!`
   - Verify need restoration after eat/sleep
   - Verify item creation after chop/mine

### Phase 3: Hex & Pathing Safety (Week 2, ~6 hours)
**Goal:** Ensure coordinate math never crashes

1. **Create `backend/test/fantasia/sim/hex_test.clj`**
   - Test `coerce-axial` with all input types (nil, string, map, number)
   - Test `distance` for edge cases (same position, far positions)
   - Test `in-bounds?` for rect and radius shapes
   - Test `rand-pos` generates valid positions only
   - Test `ring` produces correct count of positions (6 × r)

2. **Create `backend/test/fantasia/sim/pathing_test.clj`**
   - Test BFS/A* finds valid paths around walls
   - Test no path returns nil (doesn't crash)
   - Test `next-step-toward` works

### Phase 4: Visibility System (Week 3, ~8 hours)
**Goal:** Fog of war works

1. **Create `backend/test/fantasia/sim/los_test.clj`**
   - Test agent LOS calculation
   - Test champion LOS vs day/night mode
   - Test tile visibility flags (visible/revealed/hidden)

### Phase 5: Integration Tests (Week 3, ~10 hours)
**Goal:** End-to-end scenarios

1. **Create `backend/test/fantasia/sim/integration_test.clj`**
   - Test: Chop tree → wood → stockpile
   - Test: Agent gets hungry → finds food → eats → need restored
   - Test: Build wall ghost → job → worker builds → wall blocks path
   - Test: Agent dies → memory created → other agents avoid spot

---

## 🛠️ Quick Wins (Do Today, ~2 hours)

1. **Add one happy-path test for each WS op** (30 min)
   ```clojure
   (deftest ws-place-wall-ghost
     (let [world (initial-world 5)
           result (sim/place-wall-ghost! 1 2)]
       (is (= :wall-ghost (get-in result [:tiles "1,2" :structure])))))
   ```

2. **Add one job lifecycle test** (30 min)
   ```clojure
   (deftest job-creation-and-assignment
     (let [world (initial-world 5)
           job (create-job :job/chop-tree [1 2])
           world' (enqueue-job! world job)
           assigned (claim-next-job! world' (:id (first (:agents world')))]
       (is (= :claimed (:state (get-job-by-id world' (:id job)))))))
   ```

3. **Add one hex edge case test** (30 min)
   ```clojure
   (deftest hex-coerce-axial-edge-cases
     (is (= [0 0] (coerce-axial nil)))
     (is (= [1 0] (coerce-axial "1,0")))
     (is (= [1 0] (coerce-axial {:q 1 :r 0}))))
   ```

4. **Run coverage report after each test** (track progress)

---

## 📋 Testing Strategy Guidance

### What to Test First
1. **Public APIs** - Functions called from other modules
2. **State mutations** - Functions that change world state
3. **Edge cases** - Nil inputs, empty collections, invalid types
4. **Loops/recursion** - Termination conditions, infinite loops

### What NOT to Test
1. **Private functions** (`defn-`) - Test through public APIs
2. **Logging output** - Logging is for debugging, not behavior
3. **Pure data structures** - Unless they have validation logic

### Test Structure Pattern
```clojure
(deftest descriptive-test-name
  (testing "setup context"
    (let [world (initial-world 5)  ; Arrange
          result (sim/do-something! world)  ; Act]
      (is (= expected (:key result)))))  ; Assert
```

---

## 📈 Target Coverage Goals

| Module | Current | Target | Priority |
|--------|---------|--------|----------|
| fantasia.server | 3.92% | 60% | Critical |
| fantasia.sim.jobs | 5.19% | 50% | Critical |
| fantasia.sim.hex | 6.60% | 70% | Critical |
| fantasia.sim.los | 2.08% | 50% | High |
| fantasia.sim.world | 54.47% | 70% | Medium |
| fantasia.sim.delta | 1.46% | 40% | Medium |
| **Overall** | 21.73% | **40%** | - |

---

## Change Log

### 2026-01-24
- Created comprehensive coverage analysis report
- Identified 4 critical untested areas (server, jobs, hex, los)
- Created 5-phase action plan prioritized by risk
- Added testing strategy guidance and quick wins

---

## Related Documentation
- [[AGENTS.md]] - Coding standards
- [[TESTING.md]] - Testing procedures
- [[spec/2026-01-21-milestone3-3.5-next-steps.md]] - Milestone progress
- [[docs/notes/planning/2026-01-15-roadmap.md]] - Project roadmap

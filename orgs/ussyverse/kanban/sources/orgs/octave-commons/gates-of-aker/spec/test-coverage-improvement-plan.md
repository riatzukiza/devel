---
type: spec
component: testing
priority: high
status: proposed
related-issues: []
estimated-effort: 46 story points
---

# Test Coverage Improvement Plan

## Current Coverage Analysis

**As of 2026-01-24:**
- **Overall Coverage**: 25.84% forms, 34.94% lines
- **Total Namespaces**: 57
- **Critical Low Coverage Areas** (< 10%):
  - fantasia.server: 3.76% forms, 15.81% lines
  - fantasia.sim.agent-visibility: 1.85% forms, 12.31% lines
  - fantasia.sim.los: 2.08% forms, 11.59% lines
  - fantasia.sim.delta: 1.46% forms, 7.34% lines
  - fantasia.sim.ecs.systems.agent-interaction: 2.70% forms, 15.79% lines
  - fantasia.sim.ecs.systems.job_creation: 3.30% forms, 12.00% lines
  - fantasia.sim.ecs.systems.job_processing: 1.92% forms, 8.33% lines
  - fantasia.sim.spatial_facets: 4.23% forms, 8.18% lines
  - fantasia.sim.scribes: 3.42% forms, 10.57% lines
  - fantasia.sim.los: 2.08% forms, 11.59% lines
  - fantasia.sim.houses: 4.50% forms, 18.52% lines

**Low Coverage Areas** (10-20%):
  - fantasia.sim.ecs.mortality: 9.30% forms, 21.13% lines
  - fantasia.sim.ecs.job_assignment: 11.91% forms, 14.10% lines
  - fantasia.sim.ecs.simple-jobs: 4.76% forms, 18.18% lines
  - fantasia.sim.ecs.reproduction: 1.61% forms, 8.06% lines
  - fantasia.sim.ecs.social: 1.25% forms, 6.54% lines
  - fantasia.sim.biomes: 10.64% forms, 14.50% lines
  - fantasia.sim.hex: 26.21% forms, 38.39% lines

## Phase 1: Critical Foundation Systems (Priority: Critical)

### 1.1 Visibility & Perception Systems (Target: 70% coverage)
**Files to improve:**
- `fantasia.sim.los` (2.08% forms, 11.59% lines)
- `fantasia.sim.agent-visibility` (1.85% forms, 12.31% lines)

**Estimated Effort:** 9 story points

**Functions to Test (los.clj):**
```clojure
; fantasia.sim.los
- get-vision-radius [agent] -> int
- positions-in-vision [center radius] -> [[q r] ...]
- normalize-tile-key [tile-key] -> "q,r"
- string-to-vector-key [tile-key] -> [q r]
- agent-can-see? [viewer-pos target-pos vision-radius] -> boolean
- filter-visible-agents [world viewer-pos vision-radius] -> [agent ...]
- visible-agent-ids [world viewer-pos vision-radius] -> #{agent-id ...}
- visible-tiles [world viewer-pos vision-radius] -> #{"q,r" ...}
- visible-items [world viewer-pos vision-radius] -> [[q r] ...]
- visible-buildings [world viewer-pos vision-radius] -> [[q r] ...]
```

**Test Cases for los.clj:**
```clojure
(deftest test-get-vision-radius
  (testing "Returns correct radius for wolf, bear, deer, priest")
  (testing "Uses constants from fantasia.sim.constants"))

(deftest test-positions-in-vision
  (testing "Returns correct hex positions within radius")
  (testing "Handles edge cases: radius 0, radius 1, large radius")
  (testing "Returns positions in expected pattern"))

(deftest test-tile-key-conversion
  (testing "normalize-tile-key converts vector to string 'q,r'")
  (testing "normalize-tile-key handles string input")
  (testing "string-to-vector-key converts 'q,r' back to vector")
  (testing "Handles malformed keys gracefully"))

(deftest test-visibility-predicates
  (testing "agent-can-see? uses hex distance")
  (testing "Returns true when within radius")
  (testing "Returns false when outside radius"))

(deftest test-filter-visible-entities
  (testing "filter-visible-agents returns agents within vision radius")
  (testing "Respects agent alive/dead status")
  (testing "Returns empty list when no agents visible"))

(deftest test-visibility-collections
  (testing "visible-agent-ids returns correct set of agent IDs")
  (testing "visible-tiles returns tiles within vision radius")
  (testing "visible-items returns items within vision radius")
  (testing "visible-buildings returns buildings within vision radius"))
```

**Functions to Test (agent-visibility.clj):**
```clojure
; fantasia.sim.agent-visibility
- get-vision-radius [agent] -> int
- to-radians [degrees] -> double
- compute-visibility-polygon [agent-pos radius] -> {:vertices [...] :edges [...]}
- point-in-polygon? [point vertices] -> boolean
- compute-agent-visibility [world agent] -> #{"q,r" ...}
- compute-all-agents-visibility [world] -> {agent-id #{"q,r" ...}}
- merge-visibility-maps [maps] -> {tile-key count}
```

**Test Cases for agent-visibility.clj:**
```clojure
(deftest test-vision-polygon
  (testing "Generates correct number of vertices (24 points)")
  (testing "Vertices are at correct distance from center")
  (testing "Edges connect vertices correctly in circular order"))

(deftest test-point-in-polygon
  (testing "Correctly identifies points inside polygon using ray casting")
  (testing "Correctly identifies points outside polygon")
  (testing "Handles edge cases (point on boundary)"))

(deftest test-agent-visibility
  (testing "Returns set of visible tile keys")
  (testing "Filters tiles outside vision polygon")
  (testing "Returns nil when agent has no position"))
```

### 1.2 Delta Tracking System (Target: 75% coverage)
**File to improve:**
- `fantasia.sim.delta` (1.46% forms, 7.34% lines)

**Estimated Effort:** 3 story points

**Functions to Test:**
```clojure
; fantasia.sim.delta
- deep-equal? [a b] -> boolean
- map-delta [old-map new-map] -> map
- agent-delta [old-agent new-agent] -> map
- world-delta [old-world new-world] -> delta-map
```

**Test Cases:**
```clojure
(deftest test-deep-equal
  (testing "Compares maps correctly")
  (testing "Compares vectors correctly")
  (testing "Handles nested structures")
  (testing "Returns false for different values")
  (testing "Returns true for equal structures"))

(deftest test-map-delta
  (testing "Returns only changed keys in new map")
  (testing "Returns empty map when no changes")
  (testing "Handles nil old map (initial state)")
  (testing "Preserves nested structure"))

(deftest test-agent-delta
  (testing "Returns delta for changed agent fields")
  (testing "Returns empty map when agent unchanged")
  (testing "Handles nil old agent (new agent)"))

(deftest test-world-delta
  (testing "Computes comprehensive world delta")
  (testing "Includes changed agents with deltas")
  (testing "Includes changed tiles, items, stockpiles")
  (testing "Includes global state updates (tick, temperature, daylight)")
  (testing "Handles nil old-world (initial state)"))
```

### 1.3 Job Processing Systems (Target: 70% coverage)
**Files to improve:**
- `fantasia.sim.ecs.systems.job_processing` (1.92% forms, 8.33% lines)
- `fantasia.sim.ecs.systems.job_creation` (3.30% forms, 12.00% lines)

**Estimated Effort:** 5 story points

**Test Cases for job_processing.clj:**
```clojure
(deftest test-job-processing
  (testing "Increments progress when adjacent to target")
  (testing "Progress increments by 0.1 each tick")
  (testing "Completes job when progress reaches 1.0")
  (testing "Removes job assignment after completion")
  (testing "Does not process when not adjacent to target"))

(deftest test-job-system-process
  (testing "Processes all agents with JobAssignment component")
  (testing "Skips agents without jobs"))
```

**Test Cases for job_creation.clj:**
```clojure
(deftest test-job-generation
  (testing "Creates gather-wood job when building has no jobs")
  (testing "Does not create job when building already has jobs")
  (testing "Uses current tick in job ID")
  (testing "Sets correct priority for jobs")
  (testing "Sets target position to building position"))

(deftest test-job-creation-process
  (testing "Processes all buildings with JobQueue components"))
```

### 1.2 World State Management (Target: 75% coverage)
**Files to improve:**
- `fantasia.sim.world` (54.47% forms, 56.29% lines)
- `fantasia.sim.delta` (1.46% forms, 7.34% lines)

**Test Strategy:**
- World initialization and state transitions
- Delta generation and application
- State validation and consistency checks
- Integration with ECS systems

## Phase 2: Game Logic Systems (Priority: High)

### 2.1 Agent Systems (Target: 70% coverage)
**Files to improve:**
- `fantasia.sim.ecs.systems.agent-interaction` (2.70% forms, 15.79% lines)
- `fantasia.sim.ecs.systems.social` (1.25% forms, 6.54% lines)
- `fantasia.sim.ecs.systems.mortality` (9.30% forms, 21.13% lines)

**Estimated Effort:** 8 story points

**Test Cases for agent-interaction.clj:**
```clojure
(deftest test-nearby-agents
  (testing "Returns agents within vision radius")
  (testing "Filters by hex distance from position")
  (testing "Returns empty list when no agents nearby"))

(deftest test-speech-packet
  (testing "Generates packet with correct intent based on facets")
  (testing "Sets intent to :warning for warn/boast/recruit facets")
  (testing "Sets intent to :inquiry for report/ask-question facets")
  (testing "Sets intent to :gossip for other facets")
  (testing "Includes top 10 facets from frontier sorted by activation")
  (testing "Sets appropriate tone and salience"))
```

**Test Cases for mortality.clj:**
```clojure
(deftest test-mortality-check
  (testing "Returns :starvation when food <= 0.15")
  (testing "Returns :health-critical when health <= 0.0")
  (testing "Returns nil for healthy agents")
  (testing "Handles missing needs components"))

(deftest test-death-memory
  (testing "Creates memory at death location")
  (testing "Includes cause of death")
  (testing "Includes killer role if applicable")
  (testing "Sets appropriate memory strength based on agent stats")
  (testing "Logs death event"))

(deftest test-entity-death-handling
  (testing "Marks agent as dead in DeathState component")
  (testing "Adds DeathState to world")
  (testing "Updates health if death due to health"))

(deftest test-mortality-process
  (testing "Processes all entities with DeathState component")
  (testing "Handles newly dead agents")
  (testing "Skips already dead agents"))
```

### 2.2 Job Systems (Target: 65% coverage)
**Files to improve:**
- `fantasia.sim.ecs.systems.job_assignment` (11.91% forms, 14.10% lines)

**Estimated Effort:** 3 story points

## Phase 3: Supporting Systems (Priority: Medium)

### 3.1 Spatial & Content Systems (Target: 60% coverage)
**Files to improve:**
- `fantasia.sim.spatial_facets` (4.23% forms, 8.18% lines)
- `fantasia.sim.houses` (4.50% forms, 18.52% lines)
- `fantasia.sim.biomes` (10.64% forms, 14.50% lines)
- `fantasia.sim.hex` (26.21% forms, 38.39% lines)
- `fantasia.sim.time` (49.77% forms, 52.08% lines)

**Estimated Effort:** 12 story points

**Test Cases for spatial_facets.clj:**
```clojure
(deftest test-embedding-loading
  (testing "Loads embeddings from file in GloVe format")
  (testing "Returns count of loaded embeddings")
  (testing "Handles missing file gracefully")
  (testing "Creates fallback embeddings when missing"))

(deftest test-fallback-embedding
  (testing "Creates deterministic embedding from word hash")
  (testing "Creates 12-dimensional vector")
  (testing "Values are in range [-1, 1]"))

(deftest test-embedding-cache
  (testing "ensure-embedding! returns cached embedding if exists")
  (testing "ensure-embedding! creates fallback if missing")
  (testing "get-embedding returns nil for uncached words"))
```

**Test Cases for houses.clj:**
```clojure
(deftest test-house-creation
  (testing "Creates house with correct components")
  (testing "Sets appropriate inventory capacity")
  (testing "Provides warmth bonus to nearby agents"))

(deftest test-house-occupancy
  (testing "Tracks agents inside house")
  (testing "Removes agents when they leave"))
```

**Test Cases for hex.clj:**
```clojure
(deftest test-hex-distance
  (testing "Returns 0 for same position")
  (testing "Returns correct distance for adjacent hexes")
  (testing "Returns correct distance for distant hexes"))

(deftest test-hex-neighbor-functions
  (testing "Returns all 6 neighbors")
  (testing "neighbors? returns true for adjacent hexes")
  (testing "neighbors? returns false for non-adjacent hexes"))
```

### 3.2 External Integration (Target: 50% coverage)
**Files to improve:**
- `fantasia.sim.scribes` (3.42% forms, 10.57% lines)
- `fantasia.sim.server` (3.76% forms, 15.81% lines)

**Estimated Effort:** 6 story points

**Note:** Testing external API calls requires mocking Ollama/HTTP responses.

**Test Cases for scribes.clj:**
```clojure
(deftest test-myth-file-operations
  (testing "load-myths! loads from myths.jsonl")
  (testing "Returns empty list when file doesn't exist")
  (testing "save-myth! appends to file")
  (testing "save-myth! handles write errors"))

(deftest test-myth-generation
  (testing "generate-myth calls Ollama API (mocked)")
  (testing "Uses loaded myths for context")
  (testing "Returns myth with facets and title"))

(deftest test-ollama-config
  (testing "get-ollama-config returns defaults")
  (testing "Overrides defaults from world levers"))
```

### 3.3 Remaining ECS Systems (Target: 50% coverage)
**Files to improve:**
- `fantasia.sim.ecs.systems.reproduction` (1.61% forms, 8.06% lines)
- `fantasia.sim.ecs.systems.social` (1.25% forms, 6.54% lines)

**Estimated Effort:** 6 story points

## Implementation Strategy

### Test Organization Principles
1. **One test file per namespace** following existing naming convention
2. **Use `deftest` with descriptive names** following `component-scenario-expected` pattern
3. **Fix deterministic seeds** using `sim/reset` with `:seed` parameter
4. **Test both success and failure paths** for each public function
5. **Include integration tests** for critical system interactions

### Test Development Workflow
1. **Read existing test patterns** from high-coverage files:
    - `fantasia.sim.myth` (99.39% forms, 100% lines)
    - `fantasia.sim.events` (97.58% forms, 98.15% lines)
    - `fantasia.sim.ecs.components` (100% forms, 100% lines)
    - `fantasia.sim.constants` (100% forms, 100% lines)

2. **Create test helpers** for common setup patterns:
    - World initialization with test data
    - Entity creation with standard components
    - System execution with predictable inputs

3. **Add property-based tests** for pure functions using `clojure.test.check`

## Test Infrastructure

### Test Helpers Library (to be created)
**File:** `backend/test/fantasia/sim/test_helpers.clj`

```clojure
(ns fantasia.sim.test-helpers
  "Common test utilities and fixtures."
  (:require [brute.entity :as be]
            [fantasia.sim.ecs.core :as ecs]
            [fantasia.sim.ecs.components :as c]))

(defn create-test-world
  "Create minimal test ECS world with optional tiles."
  ([] (create-test-world {}))
  ([opts] (ecs/create-ecs-world)))

(defn create-test-agent
  "Create test agent with specified role and position."
  ([world role q r]
   (first (ecs/create-agent world nil q r role)))
  ([world role q r opts]
   (first (ecs/create-agent world nil q r role opts))))

(defn create-test-tiles
  "Create test tiles at specified positions."
  [world positions]
  (reduce (fn [w [q r terrain biome]]
            (second (ecs/create-tile w q r terrain biome nil nil)))
          world
          positions))

(defn create-test-building
  "Create test building with JobQueue."
  ([world [q r] structure-type]
   (first (ecs/create-building world [q r] structure-type))))
```

### Mocking Setup

For external dependencies:
- **Ollama API mock** for `scribes` tests
- **HTTP client mock** for external calls
- **File I/O mock** for myth persistence testing

### Coverage Targets by Phase

**Phase 1 (Critical Foundation):**
- fantasia.sim.los: 2% → 70%
- fantasia.sim.agent-visibility: 2% → 70%
- fantasia.sim.delta: 1% → 75%
- fantasia.sim.ecs.systems.job_processing: 2% → 70%
- fantasia.sim.ecs.systems.job_creation: 3% → 70%

**Expected Impact:** +14% forms / +15% lines overall

**Phase 2 (Game Logic):**
- fantasia.sim.ecs.systems.agent-interaction: 3% → 60%
- fantasia.sim.ecs.systems.social: 1% → 50%
- fantasia.sim.ecs.systems.mortality: 9% → 65%
- fantasia.sim.ecs.systems.job_assignment: 12% → 60%

**Expected Impact:** +15% forms / +15% lines overall

**Phase 3 (Supporting):**
- fantasia.sim.spatial_facets: 4% → 50%
- fantasia.sim.houses: 5% → 55%
- fantasia.sim.biomes: 11% → 50%
- fantasia.sim.hex: 26% → 60%
- fantasia.sim.time: 50% → 70%
- fantasia.sim.scribes: 3% → 50%
- fantasia.sim.ecs.systems.reproduction: 2% → 50%

**Expected Impact:** +15% forms / +10% lines overall

### Coverage Verification
- **Run coverage after each phase**: `clojure -X:coverage`
- **Target 70% overall coverage** after Phase 2
- **Target 80% overall coverage** after completion
- **Document gaps** in `/docs/notes` when coverage targets aren't met

## Phase 1 Status (2026-01-24)

**Completed Files:**
1. ✓ `backend/test/fantasia/sim/test_helpers.clj` - Test utilities and fixtures
2. ✓ `backend/test/fantasia/sim/los_test.clj` - Vision radius, hex positions, visibility
3. ✓ `backend/test/fantasia/sim/agent_visibility_test.clj` - Polygon visibility
4. ✓ `backend/test/fantasia/sim/delta_test.clj` - Delta tracking (public functions)
5. ✓ `backend/test/fantasia/sim/ecs/systems/job_processing_test.clj` - Job execution
6. ✓ `backend/test/fantasia/sim/ecs/systems/job_creation_test.clj` - Job generation

**Fixed Issues:**
- Added missing require for `fantasia.sim.constants` in `agent_visibility.clj`
- Fixed namespace references (job-creation, job_processing with underscores)

**Notes:**
- Some tests had to be simplified to work with existing API
- `delta/deep-equal?` is private, not tested directly
- `los/visible-buildings` and `vis/merge-visibility-maps` functions don't exist in source

## Success Metrics

### Quantitative Goals
- **Phase 1 (Critical Foundation):** Increase from 25.84% to 40% forms / 34.94% to 50% lines
- **Phase 2 (Game Logic):** Increase from 40% to 55% forms / 50% to 65% lines
- **Phase 3 (Supporting):** Increase from 55% to 70% forms / 65% to 75% lines
- **Zero regressions** in currently well-tested areas (myth, events, components)
- **All files < 10% coverage** raised to at least 30%

### Qualitative Goals
- All critical game loops (tick, ECS processing, visibility) have test coverage
- Test suite runs in under 30 seconds
- Tests provide meaningful error messages
- Tests serve as documentation for system behavior
- Edge cases (nil, empty, boundary values) are covered
- Error paths are tested

### Phase Breakdown

| Phase | Priority | Files | Story Points | Target Coverage |
|-------|----------|-------|--------------|-----------------|
| Phase 1 | CRITICAL | 4 | 17 | 40% forms / 50% lines |
| Phase 2 | HIGH | 3 | 11 | 55% forms / 65% lines |
| Phase 3 | MEDIUM | 7 | 18 | 70% forms / 75% lines |
| **Total** | | **14** | **46** | |

## Next Steps

1. **Review and approve** this updated plan
2. **Create test helpers library** (`backend/test/fantasia/sim/test_helpers.clj`)
3. **Begin Phase 1** with visibility systems:
   - Implement `los_test.clj` (4 SP)
   - Implement `agent_visibility_test.clj` (5 SP)
4. **Set up coverage tracking** in CI pipeline
5. **Document test patterns** for future developers
6. **Regular coverage reviews** during standups (after each phase)
7. **Track progress** in `/docs/notes` with coverage snapshots

## Implementation Timeline

**Week 1 (2026-01-24):**
- ✓ Create test helpers library
- ✓ Implement `los_test.clj`
- ✓ Implement `agent_visibility_test.clj`

**Week 2 (2026-01-24):**
- ✓ Implement `delta_test.clj`
- ✓ Implement `job_processing_test.clj`
- ✓ Implement `job_creation_test.clj`
- Run coverage report, verify Phase 1 targets

**Week 3-4:**
- Implement Phase 2 tests (agent-interaction, social, mortality, job_assignment)
- Run coverage report, verify Phase 2 targets

**Week 5-6:**
- Implement Phase 3 tests (spatial_facets, houses, scribes, etc.)
- Final coverage report
- Document remaining gaps
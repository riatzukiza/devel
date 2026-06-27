# SPEC: Split jobs.clj into Separate Files

**Issue ID:** ARCH-001
**Severity:** Medium
**Category:** Architecture & Code Organization
**Status:** Proposed
**Created:** 2026-01-22

---
Type: spec
Component: backend
Priority: high
Status: proposed
Related-Issues: []
Milestone: 3.5
Estimated-Effort: 13 hours
---

## Problem Statement

`backend/src/fantasia/sim/jobs.clj` is a monolithic file containing 1,274+ lines of code across multiple job categories:
- Job creation and assignment (lines 90-199)
- Item and stockpile management (lines 201-314)
- Job completion handlers (lines 873-934)
- Need-based job generation (lines 1056-1182)
- Harvest job generation (lines 2121-2241)
- Structure job generation (lines 1243-1290)
- Food delivery jobs (lines 1265-1315)
- Job advancement logic (lines 936-960)
- Helper functions scattered throughout

This violates the Single Responsibility Principle and makes the codebase difficult to:
- Navigate and understand
- Test in isolation
- Maintain without side effects
- Review effectively

## Current File Structure (jobs.clj)

```clojure
;; Lines 1-11: Namespace declaration and requires
(ns fantasia.sim.jobs
  (:require [clojure.set :as set]
             [clojure.string :as str]
             [fantasia.dev.logging :as log]
             [fantasia.sim.biomes :as biomes]
             [fantasia.sim.constants :as const]
             [fantasia.sim.hex :as hex]
             [fantasia.sim.scribes :as scribes]))

;; Lines 12-89: Constants and data definitions
(def job-priorities ...)
(def food-resources ...)
(def food-item-order ...)
(def ore-types ...)
(def ore->ingot ...)
(def mineral-types ...)
(def max-structure-level ...)
(def job-provider-config ...)
(def improvable-structures ...)
(def build-structure-options ...)
(def unique-structures ...)

;; Lines 90-199: Job creation and assignment
(defn create-job ...)
(defn create-hunt-job ...)
(defn- add-job-to-world! ...)
(defn remove-job-from-world! ...)
(defn- update-job-in-world! ...)
(defn enqueue-job! ...)
(defn get-job-by-id ...)
(defn assign-job! ...)
(defn mark-agent-idle ...)
(defn claim-next-job! ...)
(defn auto-assign-jobs! ...)

;; Lines 201-314: Item and stockpile management
(defn add-item! ...)
(defn- stockpile-accepts? ...)
(defn- stockpile-for-structure ...)
(defn- structure-for-resource ...)
(defn consume-items! ...)
(defn create-stockpile! ...)
(defn add-to-stockpile! ...)
(defn take-from-stockpile! ...)
(defn stockpile-has-space? ...)
(defn stockpile-space-remaining ...)

;; Lines 316-453: Search and find helpers
(defn- positions-within-radius ...)
(defn find-nearest-stockpile-with-qty ...)
(defn find-nearest-stockpile-with-space ...)
(defn- find-campfire-pos ...)
(defn- empty-build-site? ...)
(defn- find-house-site ...)
(defn- find-structure-site ...)
(defn- structure-exists? ...)
(defn- find-build-fire-site ...)
(defn- tiles-with-resource ...)
(defn- items-with-resource ...)
(defn- find-nearest-resource ...)
(defn- find-nearest-item ...)
(defn- find-nearest-food-item ...)
(defn- find-nearest-food-stockpile ...)
(defn- find-nearest-food-target ...)
(defn- find-nearest-agent-with-role ...)
(defn- stockpiles-with-space-for ...)

;; Lines 454-540: Resource demand calculation
(defn- harvest-job-type ...)
(defn- harvest-structure-type ...)
(defn- harvest-structures ...)
(defn- total-item-qty ...)
(defn- total-stockpile-space ...)
(defn- wood-demand ...)
(defn- fruit-demand ...)
(defn- consume-resource-global! ...)
(defn- house-resources-available? ...)
(defn- has-house-near? ...)

;; Lines 546-848: Job completion handlers
(defn complete-build-wall! ...)
(defn complete-build-house! ...)
(defn- harvest-resource! ...)
(defn complete-farm! ...)
(defn complete-harvest-job! ...)
(defn complete-mine! ...)
(defn- structure-level ...)
(defn complete-improve! ...)
(defn complete-smelt! ...)
(defn complete-build-structure! ...)
(defn complete-chop-tree! ...)
(defn complete-haul! ...)
(defn complete-eat! ...)
(defn complete-warm-up! ...)
(defn complete-build-fire! ...)
(defn complete-sleep! ...)
(defn complete-deliver-food! ...)

;; Lines 873-894: Job outcome strings
(defn- job-outcome ...)

;; Lines 896-960: Job execution pipeline
(defn complete-job! ...)
(defn advance-job! ...)
(defn job-target-pos ...)
(defn get-agent-job ...)
(defn cleanup-hunt-jobs! ...)
(defn job-complete? ...)
(defn adjacent-to-job? ...)

;; Lines 1002-1054: Item pickup/drop
(defn pickup-items! ...)
(defn drop-items! ...)
(defn generate-haul-jobs-for-items! ...)

;; Lines 1056-1182: Need-based job generation
(defn generate-need-jobs! ...)
(defn generate-house-jobs! ...)
(defn generate-harvest-building-jobs! ...)
(defn generate-harvest-jobs! ...)

;; Lines 1243-1315: Structure and delivery jobs
(defn generate-idle-structure-jobs! ...)
(defn generate-deliver-food-jobs! ...)
```

## Proposed File Structure

```
backend/src/fantasia/sim/jobs/
  ├── core.clj           (Job lifecycle: create, assign, advance, complete)
  ├── stockpiles.clj     (Stockpile management operations)
  ├── inventory.clj       (Item and inventory management)
  ├── completion.clj      (Job completion handlers)
  ├── generators/         (Job generation logic)
  │   ├── needs.clj      (Need-based job generation)
  │   ├── harvest.clj     (Harvest job generation)
  │   ├── structures.clj  (Structure building jobs)
  │   └── haul.clj       (Hauling job generation)
  └── search.clj          (Find and search helpers)
```

## Detailed File Breakdown

### 1. `jobs/core.cl` (~200 lines)

**Responsibility:** Core job lifecycle management

**Functions to move:**
- `job-priorities`, `max-structure-level`, `job-complete?`
- `create-job`, `create-hunt-job`
- `add-job-to-world!`, `remove-job-from-world!`, `update-job-in-world!`
- `enqueue-job!`, `get-job-by-id`
- `assign-job!`, `mark-agent-idle`, `claim-next-job!`, `auto-assign-jobs!`
- `advance-job!`, `complete-job!`
- `job-target-pos`, `get-agent-job`, `cleanup-hunt-jobs!`, `adjacent-to-job?`

**Public API:**
```clojure
(ns fantasia.sim.jobs.core
  (:require [fantasia.sim.jobs.inventory :as inventory]
            [fantasia.sim.jobs.completion :as completion]))

(defn create-job [job-type target] ...)
(defn assign-job! [world job agent-id] ...)
(defn advance-job! [world agent-id delta] ...)
(defn complete-job! [world agent-id] ...)
(defn auto-assign-jobs! [world] ...)
```

### 2. `jobs/stockpiles.clj` (~150 lines)

**Responsibility:** Stockpile creation, storage, and retrieval

**Functions to move:**
- `stockpile-accepts?`
- `create-stockpile!`
- `add-to-stockpile!`
- `take-from-stockpile!`
- `stockpile-has-space?`
- `stockpile-space-remaining`
- `stockpile-for-structure`
- `structure-for-resource`
- `find-nearest-stockpile-with-qty`
- `find-nearest-stockpile-with-space`
- `stockpiles-with-space-for`

**Public API:**
```clojure
(ns fantasia.sim.jobs.stockpiles
  (:require [fantasia.dev.logging :as log]))

(defn create-stockpile! [world pos resource max-qty] ...)
(defn add-to-stockpile! [world pos resource qty] ...)
(defn take-from-stockpile! [world pos resource qty] ...)
(defn find-nearest-stockpile-with-qty [world pos resource] ...)
```

### 3. `jobs/inventory.clj` (~120 lines)

**Responsibility:** Item management on tiles and agent inventories

**Functions to move:**
- `add-item!`
- `consume-items!`
- `consume-resource-global!`
- `total-item-qty`
- `tiles-with-resource`
- `items-with-resource`
- `pickup-items!`
- `drop-items!`

**Public API:**
```clojure
(ns fantasia.sim.jobs.inventory)

(defn add-item! [world pos resource qty] ...)
(defn consume-items! [world pos resource qty] ...)
(defn consume-resource-global! [world resource qty] ...)
(defn pickup-items! [world agent-id pos resource qty] ...)
(defn drop-items! [world agent-id] ...)
```

### 4. `jobs/completion.clj` (~300 lines)

**Responsibility:** Job completion handlers

**Functions to move:**
- `job-outcome`
- `complete-build-wall!`
- `complete-build-house!`
- `complete-build-fire!`
- `complete-build-structure!`
- `complete-chop-tree!`
- `complete-mine!`
- `complete-harvest-job!`
- `complete-farm!`
- `complete-improve!`
- `complete-smelt!`
- `complete-haul!`
- `complete-eat!`
- `complete-warm-up!`
- `complete-sleep!`
- `complete-deliver-food!`
- `harvest-resource!`

**Public API:**
```clojure
(ns fantasia.sim.jobs.completion
  (:require [fantasia.sim.jobs.inventory :as inventory]
            [fantasia.sim.jobs.stockpiles :as stockpiles]))

(defn complete-build-wall! [world job] ...)
(defn complete-build-house! [world job] ...)
(defn complete-harvest-job! [world job agent-id] ...)
(defn complete-haul! [world job agent-id] ...)
(defn complete-eat! [world job agent-id] ...)
```

### 5. `jobs/generators/needs.clj` (~150 lines)

**Responsibility:** Generate jobs based on agent needs

**Functions to move:**
- `generate-need-jobs!`
- `generate-house-jobs!`
- `find-nearest-food-target`
- `find-nearest-food-item`
- `find-nearest-food-stockpile`
- `find-nearest-agent-with-role`
- `find-campfire-pos`
- `empty-build-site?`
- `find-house-site`

**Public API:**
```clojure
(ns fantasia.sim.jobs.generators.needs
  (:require [fantasia.sim.jobs.core :as jobs]
            [fantasia.dev.logging :as log]))

(defn generate-need-jobs! [world] ...)
(defn generate-house-jobs! [world] ...)
```

### 6. `jobs/generators/harvest.clj` (~200 lines)

**Responsibility:** Generate harvest-related jobs

**Functions to move:**
- `generate-harvest-jobs!`
- `generate-harvest-building-jobs!`
- `harvest-job-type`
- `harvest-structure-type`
- `harvest-structures`
- `total-stockpile-space`
- `wood-demand`
- `fruit-demand`
- `find-nearest-resource`

**Public API:**
```clojure
(ns fantasia.sim.jobs.generators.harvest)

(defn generate-harvest-jobs! [world] ...)
(defn generate-harvest-building-jobs! [world] ...)
```

### 7. `jobs/generators/structures.clj` (~100 lines)

**Responsibility:** Generate structure building jobs

**Functions to move:**
- `generate-idle-structure-jobs!`
- `generate-missing-structures-jobs!`
- `build-structure-options`
- `unique-structures`
- `improvable-structures`
- `structure-exists?`
- `find-structure-site`

**Constants to move:**
- `job-provider-config`
- `improvable-structures`
- `build-structure-options`
- `unique-structures`

**Public API:**
```clojure
(ns fantasia.sim.jobs.generators.structures)

(defn generate-idle-structure-jobs! [world] ...)
(defn generate-missing-structures-jobs! [world] ...)
```

### 8. `jobs/generators/haul.clj` (~80 lines)

**Responsibility:** Generate hauling jobs

**Functions to move:**
- `generate-haul-jobs-for-items!`
- `generate-deliver-food-jobs!`

**Public API:**
```clojure
(ns fantasia.sim.jobs.generators.haul)

(defn generate-haul-jobs-for-items! [world threshold] ...)
(defn generate-deliver-food-jobs! [world] ...)
```

### 9. `jobs/search.clj` (~150 lines)

**Responsibility:** Search and find helper functions

**Functions to move:**
- `positions-within-radius`
- `tiles-with-resource`
- `items-with-resource`
- `find-nearest-resource`
- `find-nearest-item`
- `find-nearest-agent-with-role`

**Public API:**
```clojure
(ns fantasia.sim.jobs.search
  (:require [fantasia.sim.hex :as hex]))

(defn positions-within-radius [origin radius] ...)
(defn find-nearest-resource [world pos resource] ...)
(defn find-nearest-item [world pos resource] ...)
(defn find-nearest-agent-with-role [world pos role] ...)
```

### 10. `jobs/util.clj` (~50 lines)

**Responsibility:** Shared utilities

**Functions to move:**
- `tile-key`, `parse-tile-key`, `parse-key-pos`
- `house-resources-available?`
- `has-house-near?`
- `find-build-fire-site`

**Constants to move:**
- `food-resources`
- `food-item-order`
- `ore-types`
- `ore->ingot`
- `mineral-types`

**Public API:**
```clojure
(ns fantasia.sim.jobs.util)

(defn tile-key [q r] [q r])
(defn parse-tile-key [[q r]] [q r])
(defn house-resources-available? [world required] ...)
```

## Migration Plan

### Phase 1: Create New Files (No Breaking Changes)
1. Create new directory structure under `backend/src/fantasia/sim/jobs/`
2. Create new files with proposed structure
3. Copy functions to new files with proper namespacing
4. Add requires between new files
5. Keep original `jobs.clj` unchanged

### Phase 2: Update References (Non-Breaking)
1. Update internal references in new files
2. Add re-export layer in new `jobs/core.clj` for backward compatibility
3. Update `jobs.clj` to use new files internally

### Phase 3: Deprecate Original (Breaking Change)
1. Add deprecation warnings to original `jobs.clj` functions
2. Update all calling code to use new namespaces
3. Remove re-export layer from `jobs/core.clj`
4. Delete original `jobs.clj` file

## Re-export Strategy for Backward Compatibility

In `jobs/core.clj`, maintain backward compatibility:

```clojure
(ns fantasia.sim.jobs.core
  (:require [fantasia.sim.jobs.inventory :as inventory]
            [fantasia.sim.jobs.stockpiles :as stockpiles]
            [fantasia.sim.jobs.completion :as completion]))

;; Re-export for backward compatibility during migration
(def inventory/add-item! inventory/add-item!)
(def inventory/consume-items! inventory/consume-items!)
(def stockpiles/create-stockpile! stockpiles/create-stockpile!)
(def stockpiles/add-to-stockpile! stockpiles/add-to-stockpile!)
;; ... and so on
```

## Testing Requirements

### Unit Tests
Each new file must have corresponding test file:
- `test/fantasia/sim/jobs/core_test.clj`
- `test/fantasia/sim/jobs/stockpiles_test.clj`
- `test/fantasia/sim/jobs/inventory_test.clj`
- `test/fantasia/sim/jobs/completion_test.clj`
- `test/fantasia/sim/jobs/generators/needs_test.clj`
- `test/fantasia/sim/jobs/generators/harvest_test.clj`
- `test/fantasia/sim/jobs/generators/structures_test.clj`
- `test/fantasia/sim/jobs/generators/haul_test.clj`
- `test/fantasia/sim/jobs/search_test.clj`

### Integration Tests
Ensure all job generation and execution flows work end-to-end:
- `test/fantasia/sim/jobs/integration_test.clj`
- Test full job lifecycle: create → assign → advance → complete
- Test cross-file interactions (e.g., harvest jobs using inventory)

## Definition of Done

1. **Code Organization:**
   - [ ] All files created under `backend/src/fantasia/sim/jobs/`
   - [ ] Original `jobs.clj` deleted or renamed to `jobs.clj.old`
   - [ ] No circular dependencies between new files
   - [ ] Each file has clear, focused responsibility

2. **Code Quality:**
   - [ ] All new files have proper docstrings
   - [ ] Code follows existing style guide
   - [ ] No duplicate functions across files
   - [ ] Constants properly organized by file

3. **Testing:**
   - [ ] All new test files created
   - [ ] All existing tests still pass
   - [ ] New tests cover all public APIs
   - [ ] Integration tests cover cross-file flows

4. **Documentation:**
   - [ ] AGENTS.md updated with new namespace structure
   - [ ] API documentation updated for all public functions
   - [ ] Migration notes added to project README

5. **Validation:**
   - [ ] `clj-kondo` linting passes with no errors
   - [ ] All test suites pass: `clojure -M:test`
   - [ ] Manual smoke test: place shrine, adjust levers, run simulation for 100 ticks
   - [ ] No regression in job generation or execution behavior

## Risks and Mitigations

### Risk 1: Breaking Existing Code
**Mitigation:** Use re-export layer and deprecation warnings during transition period

### Risk 2: Circular Dependencies
**Mitigation:** Design dependency graph before implementation:
```
core
├── inventory
├── stockpiles
├── completion (depends on inventory, stockpiles)
└── search

generators
├── needs (depends on core, search)
├── harvest (depends on core, search)
├── structures (depends on core, search)
└── haul (depends on core, search)
```

### Risk 3: Lost Context During Migration
**Mitigation:** Keep original file open during migration for reference; use git diff to verify function signatures

## Estimated Effort

- Phase 1: Create new files - 4 hours
- Phase 2: Update references - 3 hours
- Phase 3: Deprecate and remove - 2 hours
- Testing and validation - 3 hours
- Documentation updates - 1 hour

**Total: ~13 hours**

## Related Issues

- ARCH-002: Add input validation middleware
- PERF-001: Cache computed values
- STYLE-001: Replace magic numbers with constants
- TEST-001: Fix test runner configuration

## References

- Current file: `backend/src/fantasia/sim/jobs.clj` (1,274 lines)
- Style guide: `AGENTS.md`
- Testing guide: `TESTING.md`

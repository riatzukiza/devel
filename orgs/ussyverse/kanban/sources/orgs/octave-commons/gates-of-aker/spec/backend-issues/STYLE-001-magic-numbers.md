# SPEC: Replace Magic Numbers with Constants

**Issue ID:** STYLE-001
**Severity:** Medium
**Category:** Code Quality & Maintainability
**Status:** Proposed
**Created:** 2026-01-22

---
Type: spec
Component: backend
Priority: medium
Status: proposed
Related-Issues: []
Milestone: 3.5
Estimated-Effort: 30 hours
---

## Problem Statement

Magic numbers are scattered throughout the codebase, making it difficult to:
- Understand intent of hardcoded values
- Modify behavior consistently
- Find all occurrences of a value
- Tune simulation parameters centrally

### Examples of Magic Numbers

#### server.clj
```clojure
;; Line 76: Hardcoded runner config
(defonce *runner (atom {:running? false :future nil :ms 66 :tick-ms 0}))
;;                                                                    ^^ Should be constant

;; Line 288: Uncapped FPS validation
(let [fps (int (or (:fps msg) 15))  ;; ^^ Should be constant
      ms (if (pos? fps) (/ 1000.0 fps) 66)]  ;; ^^ Should be constant
  ...)
```

#### jobs.clj
```clojure
;; Line 1100: Random threshold for fire site
(when (< 0.2 (rand))
  ;;  ^^ Should be constant: fire-site-probability-threshold
  (find-build-fire-site w pos))

;; Line 694: Structure levels
(let [new-level (inc level)
      world' (assoc-in world [:tiles k :level] new-level)]
  world'))
;;                      ^^ Should use max-structure-level constant

;; Line 1089: Wood requirement
(let [wood-required 1]
  ;; ^^ Should be constant: wall-wood-required
  ...)
```

#### agents.clj
```clojure
;; Line 22: Campfire radius check
(campfire-near? (and pos campfire-pos (<= (hex/distance pos campfire-pos) 2)))
;;                                                                                      ^^ Should be constant

;; Line 35-46: Need decay rates
(let [warmth-decay (+ 0.004 (* 0.012 cold))  ;; ^^ Should be constants
      food-decay (cond
                    (= role :deer) 0.003  ;; ^^ Should be constant
                    (= role :wolf) 0.0006  ;; ^^ Should be constant
                    ...)
      ...])
```

#### pathing.clj
```clojure
;; Line 48: Road move cost
(if (= :road structure)
  0.35  ;; ^^ Should be constant
  1.0)  ;; ^^ Should be constant
```

## Proposed Solution

### 1. Categorize Magic Numbers

Create categories in `constants.clj`:

```clojure
;; =============================================================================
;; Server Configuration
;; =============================================================================

(def ^:const default-server-port 3000)
(def ^:const default-websocket-fps 15)
(def ^:const default-tick-interval-ms 66)
(def ^:const default-tick-interval-seconds (/ 66 1000.0))
(def ^:const max-ticks-per-request 100)
(def ^:const min-fps 1)
(def ^:const max-fps 60)

;; =============================================================================
;; Job System
;; =============================================================================

;; Job requirements
(def ^:const wall-wood-required 1)
(def ^:const house-wood-required 3)
(def ^:const campfire-wood-required 1)
(def ^:const log-drop-count 3)
(def ^:const job-progress-required 1.0)

;; Job generation thresholds
(def ^:const fire-site-probability-threshold 0.2)
(def ^:const fire-site-max-distance 3)
(def ^:const house-search-radius 2)
(def ^:const structure-search-radius 3)

;; Stockpile defaults
(def ^:const default-stockpile-max-qty 120)
(def ^:const min-stockpile-qty 1)
(def ^:const max-stockpile-qty 1000)

;; Resource thresholds
(def ^:const min-log-qty-for-structures 3)
(def ^:const haul-job-threshold-default 5)

;; =============================================================================
;; Agent Needs and Behavior
;; =============================================================================

;; Campfire radius (already exists but verify)
(def ^:const campfire-radius 2)  ;; Already defined, verify usage

;; Social interaction thresholds
(def ^:const social-interaction-radius 1)
(def ^:const min-agents-for-social 2)

;; Job assignment
(def ^:const idle-agent-check-frequency 1)
(def ^:const job-priority-default 50)

;; =============================================================================
;; Structure Properties
;; =============================================================================

(def ^:const max-structure-level 3)  ;; Already defined, verify usage
(def ^:const structure-level-default 1)
(def ^:const structure-bed-capacity-default 2)

;; =============================================================================
;; Pathfinding
;; =============================================================================

(def ^:const road-move-cost 0.35)  ;; Already defined, verify usage
(def ^:const default-move-cost 1.0)
(def ^:const pathfinding-max-steps 1000)  ;; Already defined, verify usage

;; =============================================================================
;; Random Thresholds
;; =============================================================================

(def ^:const random-threshold-fire-site 0.2)
(def ^:const random-threshold-stockpile 0.45)
(def ^:const random-threshold-statue 0.70)
(def ^:const random-threshold-wall 0.90)

;; =============================================================================
;; Validation Ranges
;; =============================================================================

;; Position bounds
(def ^:const min-hex-q -1000)
(def ^:const max-hex-q 1000)
(def ^:const min-hex-r -1000)
(def ^:const max-hex-r 1000)

;; Agent count limits
(def ^:const max-agents 1000)
(def ^:const max-wildlife-agents 500)

;; ============================================================================
;; Vision and Perception
;; =============================================================================

(def ^:const player-vision-radius 15)  ;; Already defined
(def ^:const default-agent-vision-radius 10)
(def ^:const witness-radius 10)
(def ^:const social-radius 1)

;; =============================================================================
;; Time and Simulation
;; =============================================================================

(def ^:const default-recent-max 50)  ;; Already defined
(def ^:const default-trace-max 200)  ;; Already defined
(def ^:const default-event-history-size 100)

;; =============================================================================
;; UI and Display
;; =============================================================================

(def ^:const default-tile-size 64)
(def ^:const default-zoom-level 1.0)
(def ^:const min-zoom-level 0.5)
(def ^:const max-zoom-level 3.0)
```

### 2. Refactor Code to Use Constants

#### server.clj

**Before:**
```clojure
(defonce *runner (atom {:running? false :future nil :ms 66 :tick-ms 0}))

(let [fps (int (or (:fps msg) 15))
      ms (if (pos? fps) (/ 1000.0 fps) 66)]
  (swap! *runner assoc :ms ms)
  ...)
```

**After:**
```clojure
(ns fantasia.server
  (:require [fantasia.sim.constants :as const]))

(defonce *runner (atom {:running? false :future nil
                       :ms const/default-tick-interval-ms
                       :tick-ms 0}))

(let [fps (int (or (:fps msg) const/default-websocket-fps))
      ms (if (pos? fps)
            (/ 1000.0 fps)
            const/default-tick-interval-ms)]
  (swap! *runner assoc :ms ms)
  ...))
```

#### jobs.clj

**Before:**
```clojure
(when (< 0.2 (rand))
  (find-build-fire-site w pos))

(let [wood-required 1]
  ...)
```

**After:**
```clojure
(ns fantasia.sim.jobs
  (:require [fantasia.sim.constants :as const]))

(when (< const/random-threshold-fire-site (rand))
  (find-build-fire-site w pos))

(let [wood-required const/wall-wood-required]
  ...)
```

#### agents.clj

**Before:**
```clojure
(campfire-near? (and pos campfire-pos (<= (hex/distance pos campfire-pos) 2)))

(let [warmth-decay (+ 0.004 (* 0.012 cold))
      food-decay (cond
                    (= role :deer) 0.003
                    (= role :wolf) 0.0006
                    ...)])
```

**After:**
```clojure
(ns fantasia.sim.agents
  (:require [fantasia.sim.constants :as const]))

(campfire-near? (and pos campfire-pos
                       (<= (hex/distance pos campfire-pos)
                             const/campfire-radius)))

(let [warmth-decay (+ const/base-warmth-decay
                        (* const/cold-warmth-decay-factor cold))
      food-decay (cond
                    (= role :deer) const/deer-food-decay
                    (= role :wolf) const/wolf-food-decay
                    ...)])
```

#### pathing.clj

**Before:**
```clojure
(let [structure (get-in world [:tiles tile-key :structure])]
  (if (= :road structure)
    0.35
    1.0))
```

**After:**
```clojure
(ns fantasia.sim.pathing
  (:require [fantasia.sim.constants :as const]))

(defn- move-cost [world pos]
  (let [tile-key (vector (first pos) (second pos))
        structure (get-in world [:tiles tile-key :structure])]
    (if (= :road structure)
      const/road-move-cost
      const/default-move-cost)))
```

## Implementation Plan

### Phase 1: Audit and Categorize (Day 1)

1. **Create audit script** `scripts/find-magic-numbers.clj`:
   ```clojure
   (ns find-magic-numbers
     (:require [clojure.string :as str]
               [clojure.java.io :as io]))

   (def number-pattern #"\b([0-9]+(?:\.[0-9]+)?)\b")
   (def exclude-patterns #["defn" "def" ":test" "deftest"])

   (defn find-magic-numbers [file]
     (with-open [r (io/reader file)]
       (->> (line-seq r)
            (map-indexed vector)
            (filter (fn [[line-num line]]
                      (and (re-find number-pattern line)
                           (not (some #(str/includes? line %) exclude-patterns)))))
            (vec))))

   (defn audit []
     (->> (file-seq (io/file "src"))
          (filter #(.endsWith (.getName %) ".clj"))
          (mapcat find-magic-numbers)
          vec)))
   ```

2. **Run audit** and categorize findings:
   ```bash
   clojure -M -i scripts/find-magic-numbers.clj
   ```

3. **Create categories** in `constants.clj` based on audit

### Phase 2: Refactor Core Files (Days 2-3)

Priority order:
1. `server.clj` - Critical infrastructure
2. `agents.clj` - Core simulation logic
3. `jobs.clj` - Job system
4. `pathing.clj` - Pathfinding
5. `tick/core.clj` - Main loop

### Phase 3: Refactor Supporting Files (Day 4)

Files to update:
- `social.clj`
- `institutions.clj`
- `ecs/systems/*.clj`
- `tick/*.clj` subfiles

### Phase 4: Validate and Test (Day 5)

1. **Run all tests**: Verify no behavior changes
2. **Manual testing**: Run simulation with different configs
3. **Performance check**: Ensure no performance regression
4. **Code review**: Validate all constants are named well

## Magic Number Detection Rules

### What IS a Magic Number

1. **Literal numbers in logic**:
   ```clojure
   (if (< distance 10) ...)  ;; Magic number
   ```

2. **Repeated numeric values**:
   ```clojure
   (assoc-in world [:agents agent-id :needs :warmth] 0.6)
   (assoc-in world [:agents agent-id :needs :food] 0.6)
   ;; Should use default-need-value constant
   ```

3. **Thresholds and limits**:
   ```clojure
   (when (< random-value 0.2) ...)  ;; Magic probability
   ```

### What is NOT a Magic Number

1. **Values with clear semantic meaning**:
   ```clojure
   (filter #(= (:role %) :priest) agents)  ;; Role name is clear
   ```

2. **Array indices in destructuring**:
   ```clojure
   (let [[q r] pos] ...)  ;; Index 0, 1 are conventional
   ```

3. **Mathematical constants**:
   ```clojure
   (Math/PI)
   (/ 1.0 2.0)  ;; Division by 2 for average is clear
   ```

4. **Values with immediate context**:
   ```clojure
   (take 3 top-results)  ;; "Top 3" is clear
   ```

5. **Constants already in `constants.clj`**:
   ```clojure
   const/campfire-radius  ;; Already constant
   ```

## Constant Naming Conventions

### Pattern: `category-specific-name`

Categories:
- `base-*` for default/base values
- `max-*` for upper limits
- `min-*` for lower limits
- `default-*` for fallback values
- `*-threshold` for comparison values
- `*-probability` for random chance values
- `*-required` for resource requirements
- `*-radius` for distance limits

### Examples

```clojure
;; Good names
(def base-warmth-decay 0.004)
(def max-fps 60)
(def min-fps 1)
(def default-tick-interval-ms 66)
(def fire-site-probability-threshold 0.2)
(def wall-wood-required 1)
(def campfire-radius 2)

;; Bad names
(def number-1 0.004)  ;; Not descriptive
(def the-fps-limit 60)  ;; Informal
(def ms 66)  ;; Too generic
(def th 0.2)  ;; Too abbreviated
```

## Validation Checklist

For each file refactored:

### Code Quality
- [ ] All magic numbers replaced with constants
- [ ] Constants are well-named and descriptive
- [ ] No literal numbers remain in logic
- [ ] Constants are properly namespaced
- [ ] Documentation in `constants.clj` is complete

### Functionality
- [ ] All tests still pass
- [ ] No behavior changes detected
- [ ] Simulation runs correctly
- [ ] Performance not degraded

### Maintainability
- [ ] Constants are grouped logically
- [ ] Related constants are together
- [ ] Comments explain non-obvious values
- [ ] Constants can be tuned centrally

## Documentation Updates

### Update constants.clj

Add section headers and documentation:

```clojure
(ns fantasia.sim.constants
  "Centralized constants for simulation parameters.

  Categories:
  - Server Configuration: Port, FPS, tick intervals
  - Job System: Requirements, thresholds, defaults
  - Agent Needs: Decay rates, limits
  - Structure Properties: Levels, capacities
  - Pathfinding: Move costs, step limits
  - Random Thresholds: Probabilities for random decisions
  - Validation Ranges: Input validation bounds
  - Vision and Perception: Visibility radii
  - Time and Simulation: History sizes, tick counts
  - UI and Display: Zoom levels, tile sizes")

;; =============================================================================
;; Category: Server Configuration
;; -----------------------------------------------------------------------------
;; These constants control server behavior and WebSocket message handling.
;;
;; default-server-port: Port for HTTP server (default 3000)
;; default-websocket-fps: Target frames per second (default 15)
;; default-tick-interval-ms: Milliseconds between ticks (default 66)
;; ...

(def ^:const default-server-port 3000)
...)
```

### Update AGENTS.md

Add section on constants:

```markdown
## Magic Numbers and Constants

All simulation parameters MUST be defined in `backend/src/fantasia/sim/constants.clj`.

DO NOT use literal numbers in simulation logic.

### Examples

❌ BAD:
```clojure
(if (< distance 10) ...)
```

✅ GOOD:
```clojure
(if (< distance const/campfire-radius) ...)
```

### Adding New Constants

1. Find the appropriate category in `constants.clj`
2. Add constant with `def ^:const` for compile-time optimization
3. Document the constant's purpose
4. Update related code to use the constant
5. Run tests to verify no behavior changes
```

## Definition of Done

### Code Changes
- [ ] All magic numbers identified and categorized
- [ ] All magic numbers replaced with constants
- [ ] `constants.clj` organized by category
- [ ] All constants properly documented
- [ ] No literal numbers in logic (except obvious cases)

### Testing
- [ ] All existing tests pass
- [ ] No behavior changes detected
- [ ] Performance benchmarks stable
- [ ] Manual smoke test passes

### Documentation
- [ ] `constants.clj` fully documented
- [ ] AGENTS.md updated with constant usage rules
- [ ] API documentation references constants where appropriate
- [ ] Changelog documents all constant changes

### Validation
- [ ] `clj-kondo` linting passes
- [ ] No unused constants detected
- [ ] No duplicate constants
- [ ] Constant values are reasonable

## Risks and Mitigations

### Risk 1: Behavior Change from Incorrect Replacement
**Mitigation:** Run comprehensive tests after each file is refactored

### Risk 2: Performance Degradation
**Mitigation:** Use `^:const` for compile-time optimization; benchmark before/after

### Risk 3: Over-Refactoring (Changing Values That Aren't Magic)
**Mitigation:** Follow strict definition of magic numbers; preserve intentional literals

### Risk 4: Constant Naming Conflicts
**Mitigation:** Use descriptive names with category prefixes

## Estimated Effort

- Audit and categorization: 4 hours
- Refactor core files: 12 hours
- Refactor supporting files: 8 hours
- Documentation updates: 2 hours
- Testing and validation: 4 hours

**Total: ~30 hours (1 week)**

## Related Issues

- ARCH-002: Add docstrings (document constants)
- PERF-002: Cache computed values (may reduce need for some constants)
- STYLE-002: Fix inconsistent indentation

## References

- Current constants file: `backend/src/fantasia/sim/constants.clj`
- Files with many magic numbers:
  - `backend/src/fantasia/sim/jobs.clj`
  - `backend/src/fantasia/sim/agents.clj`
  - `backend/src/fantasia/server.clj`

# Backend Code Review: Optimizations and Refactoring Opportunities

## Executive Summary

Total LOC: ~2500 lines across backend source files
Major areas for improvement:
1. **Code Duplication**: ~20-30% duplicated patterns across jobs, agents, and world modules
2. **Code Smells**: Long functions, magic numbers, deep nesting, inappropriate intimacy
3. **Performance**: String-based keys, repeated map traversals, inefficient pathfinding
4. **Architecture**: Missing abstractions, inconsistent patterns

## Progress Log

### Completed (2026-01-20)
1. **Extract magic numbers to constants** ✅
   - Created `fantasia.sim.constants` namespace with all magic numbers
   - Updated `agents.clj` to use constants (campfire-radius, warmth bonuses, decay rates)
   - Updated `facets.clj` to use constants (max-active-facets, decay rates)
   - Updated `pathing.clj` to use constants (pathfinding-max-steps)
   - Updated `jobs.clj` to use constants (max-structure-level, job progress, build requirements)
   - Updated `tick/initial.clj` to use constants (recent-max, trace-max)
   - Files modified:
     - `backend/src/fantasia/sim/constants.clj` (new)
     - `backend/src/fantasia/sim/agents.clj`
     - `backend/src/fantasia/sim/facets.clj`
     - `backend/src/fantasia/sim/pathing.clj`
     - `backend/src/fantasia/sim/jobs.clj`
     - `backend/src/fantasia/sim/tick/initial.clj`

2. **Extract job completion logging** ✅
   - Created `log-job-complete!` helper function in `jobs.clj`
   - Created test file `backend/test/fantasia/sim/jobs-logging-test.clj`
   - Added helper function after `create-job` function
   - Ready to replace all 15+ duplicated logging calls

3. **Job index map started** 🔄
   - Added `:jobs-by-id {}` to initial world state in `tick/initial.clj`
   - Created `add-job-to-world!` helper function
   - In progress: Updating job assignment/completion to use index

### Pending
4. **Replace string tile keys with tuples** - Not started
5. **Run regression tests** - Ready to run after completing index work

---

## 1. Code Duplication

### 1.1 Job System (jobs.clj:1040 lines - TOO LARGE)

**Problem**: `jobs.clj` is monolithic with repeated patterns.

**Duplication 1**: Job completion logging pattern (lines 417-421, 441-445, 523-528, etc.)
```clojure
(println "[JOB:COMPLETE]"
         {:type :job/build-house
          :target target
          :outcome (format "House built at %s, consumed %d logs and %d wood"
                           (pr-str target) log-use wood-use)})
```
**Impact**: Repeated 15+ times. Changes require touching every job type.

**Solution**: Create `log-job-complete!` helper:
```clojure
(defn log-job-complete! [job-type target outcome]
  (println "[JOB:COMPLETE]"
           {:type job-type
            :target target
            :outcome outcome}))
```

---

**Duplication 2**: `find-nearest-stockpile-with-qty` (line 246) vs `find-nearest-stockpile-with-space` (line 253)
```clojure
(defn find-nearest-stockpile-with-qty [world pos resource] ...)
(defn find-nearest-stockpile-with-space [world pos resource] ...)
```
**Impact**: Nearly identical except for the filter condition.

**Solution**: Combine into single function:
```clojure
(defn find-nearest-stockpile
  [world pos resource {:keys [with-qty with-space] :or {with-qty false with-space false}}]
  (let [entries (filter (fn [[_ sp]] (stockpile-accepts? sp resource)) (:stockpiles world))
        entries (cond
                  with-qty (filter (fn [[_ sp]] (pos? (:current-qty sp))) entries)
                  with-space (filter (fn [[_ sp]] (< (:current-qty sp) (:max-qty sp))) entries)
                  :else entries)]
    (when (seq entries)
      (let [pairs (map (fn [[k v]] [(parse-key-pos k) v]) entries)]
        (first (first (apply min-key (fn [[p _]] (hex/distance pos p)) pairs)))))))
```

---

**Duplication 3**: `tiles-with-resource` (line 289) vs `items-with-resource` (line 295)
```clojure
(defn- tiles-with-resource [world resource] ...)
(defn- items-with-resource [world resource] ...)
```
**Impact**: Same pattern applied to different collections.

**Solution**: Generic collection filter:
```clojure
(defn- resources-from-collection [world collection-key resource]
  (->> (collection-key world)
       (keep (fn [[k items]]
               (when (pos? (get items resource 0))
                 (parse-key-pos k))))))
```

---

**Duplication 4**: Resource ↔ Structure mappings (lines 156-172, 320-334)
```clojure
(defn- stockpile-for-structure [structure] ...)
(defn- structure-for-resource [resource] ...)
(defn- harvest-job-type [resource] ...)
(defn- harvest-structure-type [resource] ...)
```
**Impact**: Data hardcoded in functions, hard to maintain.

**Solution**: Single data structure + lookup:
```clojure
(def resource-config
  {:log {:structure :lumberyard :job :job/harvest-wood :source :tree}
   :fruit {:structure :orchard :job :job/harvest-fruit :source :tree}
   :grain {:structure :granary :job :job/harvest-grain :source :grain}
   :rock {:structure :quarry :job :job/mine :source :rock}})

(defn stockpile-for-structure [structure]
  (some (fn [[r cfg]] (when (= (:structure cfg) structure) r)) resource-config))
```

---

**Duplication 5**: `complete-harvest-job!` case statement (lines 474-480)
```clojure
(case resource
  :log (let [w1 (assoc-in world [:tiles tile-key :resource] nil)]
         (harvest-resource! w1 :log (:building-pos job) yield))
  :fruit (harvest-resource! world :fruit (:building-pos job) yield)
  :grain (harvest-resource! world :grain (:building-pos job) yield)
  :rock (harvest-resource! world :rock (:building-pos job) yield)
  world)
```
**Impact**: Repeated `harvest-resource!` calls with only resource changing.

**Solution**: Extract common logic:
```clojure
(defn- harvest-at-tile! [world tile-key resource building-pos yield]
  (let [w1 (assoc-in world [:tiles tile-key :resource] nil)]
    (harvest-resource! w1 resource building-pos yield)))
```

---

**Duplication 6**: `stockpile-accepts?` predicate (line 148) used in multiple functions
**Impact**: Good that it's extracted, but used repeatedly in filter chains.

**Solution**: Already good, but consider a stockpile-accepting-collection helper.

---

### 1.2 Agent State Updates

**Problem**: Agent spawning code duplicated in `tick/core.clj` (lines 143-179)

`spawn-wolf!` and `spawn-bear!` are nearly identical.

**Solution**: Parameterized agent factory:
```clojure
(defn- spawn-animal! [world pos role]
  (let [agent-id (next-agent-id)
        [q r] pos]
    (update world :agents conj
            {:id agent-id
             :pos [q r]
             :role role
             :stats initial/default-agent-stats
             :needs initial/default-agent-needs
             :need-thresholds initial/default-need-thresholds
             :inventories {:personal {:wood 0 :food 0}
                           :hauling {}
                           :equipment {}}
             :status {:alive? true :asleep? false :idle? false}
             :inventory {:wood 0 :food 0}
             :frontier {}
             :recall {}
             :events []})))

(defn spawn-wolf! [world pos] (spawn-animal! world pos :wolf))
(defn spawn-bear! [world pos] (spawn-animal! world pos :bear))
```

---

### 1.3 Tile Key Parsing

**Problem**: `(str q "," r)` and `parse-key-pos` pattern everywhere.

**Usage count**: 15+ locations across jobs.clj, agents.clj, tick/core.clj

**Solution**: Use tuple keys consistently:
```clojure
;; Instead of: "5,3" as string
;; Use: [5 3] as vector key

(defn tile-key [q r] [q r])
(defn parse-tile-key [[q r]] [q r])  ;; No-op for vectors
```

---

### 1.4 World Update Chains

**Problem**: Repeated pattern of chaining `assoc-in` and `update-in` (e.g., jobs.clj lines 735-760, server.clj lines 114-140)

**Solution**: Consider threading macros more heavily or use `update` with merge maps.

---

## 2. Code Smells

### 2.1 Long Method: `tick-once` (tick/core.clj:34-125)

**Lines**: 90+ lines
**Cyclomatic Complexity**: High (multiple reduce loops, conditional branches)

**Problem**: Does too many things - updates world state, generates events, handles agents, manages broadcasts.

**Solution**: Break into named functions:
```clojure
(defn tick-once [world]
  (let [world1 (update-time world)
        world2 (process-world-state world1)
        world3 (process-agents world2)
        events (generate-events world3)
        world4 (apply-events world3 events)
        world5 (process-social-interactions world4)
        world6 (process-institutions world5)
        world7 (finalize-world world6)]
    (build-output world7)))
```

---

### 2.2 Long Parameter List

**Functions with 5+ parameters**:
- `recall-and-mentions` (agents.clj:99) - 4 params
- `apply-packet-to-listener` (agents.clj:150) - 4 params
- Many internal helper functions

**Solution**: Use maps or partial application for options.

---

### 2.3 Magic Numbers

**Examples across codebase**:

```clojure
;; agents.clj
campfire-near? (<= (hex/distance pos campfire-pos) 2)  ; 2 is magic
warmth-bonus (cond campfire-near? 0.04 house-near? 0.02 :else 0.0)
warmth-decay (+ 0.004 (* 0.012 cold))

;; facets.clj
(defn spread-step [... {:keys [spread-gain max-hops] :or {spread-gain 0.55 max-hops 2}}])
active (take 24 active)  ; 24 is magic

;; jobs.clj
log-targets (take 3 log-targets)  ; 3 is magic
required 3  ; Magic for house building

;; server.clj
max-steps 1000  ; Magic in pathing
```

**Solution**: Define constants at namespace level:
```clojure
(def ^:const campfire-radius 2)
(def ^:const warmth-bonus-campfire 0.04)
(def ^:const warmth-bonus-house 0.02)
(def ^:const base-warmth-decay 0.004)
(def ^:const cold-warmth-decay-factor 0.012)
(def ^:const max-active-facets 24)
(def ^:const log-drop-count 3)
(def ^:const pathfinding-max-steps 1000)
```

---

### 2.4 Feature Envy

**agents.clj frequently accesses world directly**:
- `update-needs` accesses `(:temperature world)`, `(:campfire world)`, `(:tiles world)`
- `choose-packet` accesses `(:pos agent)`, calls `spatial/at-trees?`
- `apply-packet-to-listener` accesses `(:tick world)`, `(:frontier listener)`

**Solution**: Pass only required context:
```clojure
;; Instead of: [world agent]
;; Use: [{:keys [temperature campfire tiles]} agent]
```

---

### 2.5 Inappropriate Intimacy (Deep Nesting)

**Examples**:
```clojure
;; jobs.clj:471
(= target-resource (get-in world [:tiles tile-key :resource]))

;; jobs.clj:410
(wood-qty (get-in world [:items k :wood] 0))

;; agents.clj:19
campfire-near? (and pos campfire-pos (<= (hex/distance pos campfire-pos) 2))
```

**Solution**: Create accessor functions:
```clojure
(defn tile-resource-at [world pos]
  (get-in world [:tiles (tile-key pos) :resource]))

(defn item-qty-at [world pos resource]
  (get-in world [:items (tile-key pos) resource] 0))
```

---

### 2.6 Switch/Case Large

**Problem**: `complete-job!` (jobs.clj:735-764) has a massive case statement with 18 job types.

**Solution**: Use multimethod:
```clojure
(defmulti complete-job! (fn [world _ job] (:type job)))

(defmethod complete-job! :job/build-wall [world agent-id job]
  (complete-build-wall! world job))

(defmethod complete-job! :job/chop-tree [world agent-id job]
  (complete-chop-tree! world job))

;; etc...
```

---

### 2.7 Long Class/File

**jobs.clj: 1040 lines** - Needs to be split into:
- `jobs/core.clj` - Main job functions
- `jobs/complete.clj` - Job completion handlers
- `jobs/generate.clj` - Job generation functions
- `jobs/resource.clj` - Resource management utilities

---

### 2.8 Message Chains

**Examples**:
```clojure
(get-in world [:agents agent-id :needs :warmth])
(get-in world [:levers :mouthpiece-agent-id])
```

**Solution**: Lens libraries or custom selectors:
```clojure
(def agent-warmth (comp :needs :warmth))
(def agent-food (comp :needs :food))
```

---

### 2.9 Data Clumps

**Repeated groups of parameters**:
- `pos` (or `q r`) + `resource` + `qty` appears together 10+ times
- `world` + `agent-id` + `job` appears together

**Solution**: Create record types or maps:
```clojure
(defrecord ResourceRequest [pos resource qty])
(defrecord JobContext [world agent-id job])
```

---

### 2.10 Speculative Generality

**agents.clj:67-78** - `scaled-edges` function creates a scaled version of edges but only modifies 3 specific edges:
```clojure
(defn scaled-edges [world]
  (let [base (:edges world)
        icon (get-in world [:levers :iconography] {})
        fire->patron (double (get icon :fire->patron 0.80))
        lightning->storm (double (get icon :lightning->storm 0.75))
        storm->deity (double (get icon :storm->deity 0.85))]
    (-> base
        (assoc [:fire :patron/fire] fire->patron)
        (assoc [:lightning :storm] lightning->storm)
        (assoc [:storm :deity/storm] storm->deity))))
```

**Solution**: Just modify the three edges directly without full copy:
```clojure
(defn scaled-edges [world]
  (let [icon (get-in world [:levers :iconography] {})]
    {[:fire :patron/fire] (get icon :fire->patron 0.80)
     [:lightning :storm] (get icon :lightning->storm 0.75)
     [:storm :deity/storm] (get icon :storm->deity 0.85)}))
```

---

## 3. Performance Optimizations

### 3.1 String-Based Tile Keys

**Problem**: Tile keys stored as strings `"5,3"`, parsed every access:
```clojure
(tile-key (str (first pos) "," (second pos)))

(defn- parse-key-pos [k]
  (let [parts (str/split k #",")]
    [(Integer/parseInt (first parts)) (Integer/parseInt (second parts))]))
```

**Performance Impact**:
- String allocation: ~100-200 bytes per key
- String parsing: O(n) per access
- Memory overhead: significant

**Solution**: Use tuple keys `[q r]`:
```clojure
(defn tile-key [[q r]] [q r])
(defn parse-tile-key [[q r]] [q r])
```

**Migration strategy**:
1. Change all key generation to vectors
2. Change all key lookups to vectors
3. Remove `parse-key-pos` function
4. Update serialization if needed

**Estimated benefit**: 10-20% performance improvement in tile-heavy operations.

---

### 3.2 Repeated Map Traversals

**Problem**: `complete-job!` traverses the same maps multiple times:
```clojure
job-id (get-in world [:agents agent-id :current-job])
idx (first (keep-indexed (fn [i j] (when (= (:id j) job-id) i)) (:jobs world)))
job (get-in world [:jobs idx])
```

**Solution**: Use index map for jobs:
```clojure
(defn update-world-with-job-index [world]
  (assoc world :jobs-by-id (index-by :id (:jobs world))))

;; Then:
job (get-in world [:jobs-by-id job-id])
```

---

### 3.3 Inefficient Job Vector Lookup

**Problem**: Finding job by ID in linear vector:
```clojure
idx (first (keep-indexed (fn [i j] (when (= (:id j) job-id) i)) (:jobs world)))
```

**Time complexity**: O(n)

**Solution**: Maintain index map:
```clojure
;; world state includes:
{:jobs [...]
 :jobs-by-id {job-id-1 job-1
              job-id-2 job-2}}

(defn get-job-by-id [world job-id]
  (get-in world [:jobs-by-id job-id]))
```

---

### 3.4 Pathfinding Without Heuristic Pruning

**Problem**: A* algorithm (pathing.clj:33-79) explores many neighbors without spatial indexing.

**Potential improvements**:
- Add spatial grid for quick neighbor lookups
- Implement hierarchical pathfinding for large maps
- Cache paths for common routes

**Quick win**: Add maximum search radius:
```clojure
(defn a-star-path
  [world start goal & {:keys [max-radius 50]}]
  (if (> (hex/distance start goal) max-radius)
    nil
    ;; existing implementation
    ))
```

---

### 3.5 Frontier Management

**Problem**: Facet frontier decay creates new maps every tick (facets.clj:16-24):
```clojure
(defn decay-frontier
  [frontier {:keys [decay drop-threshold] :or {decay 0.92 drop-threshold 0.02}}]
  (->> frontier
       (map (fn [[k {:keys [a strength valence]}]
              (let [a' (* (double a) (double decay))]
                [k {:a a' :strength strength :valence valence}])))
       (remove (fn [[_ {:keys [a]}]] (< (double a) (double drop-threshold))))
       (into {})))
```

**Optimization**: Use transducers for large frontiers:
```clojure
(defn decay-frontier [frontier opts]
  (into {}
        (comp
          (map (fn [[k v]] [k (update v :a * (:decay opts))]))
          (remove (fn [[_ v]] (< (:a v) (:drop-threshold opts)))))
        frontier))
```

---

### 3.6 Job Assignment O(n²)

**Problem**: `auto-assign-jobs!` (jobs.clj:123-140) iterates all agents and searches through jobs:
```clojure
pending (filter #(= (:state %) :pending) (:jobs world))
sorted (sort-by (fn [j] [(- (:priority j 0)) (hex/distance (:pos agent) (:target j))]) pending)
```

**Time complexity**: O(agents × jobs)

**Optimization**: Pre-sort jobs by priority, use spatial indexing for distance.

---

### 3.7 Excessive Intermediate Maps in Tick

**Problem**: `tick-once` creates many intermediate worlds (w1, w2, w3, etc.)

**Solution**: Consider using mutable intermediate state or reducing transformation steps.

---

### 3.8 Memory Leaks in Snapshots

**Problem**: `world/snapshot` (world.clj:5-48) creates large agent maps for UI:
```clojure
:agents (mapv (fn [a] {:id (:id a) ...}) (:agents world))
```

**Optimization**: Select only fields needed by UI, use lazy sequences.

---

## 4. Architectural Issues

### 4.1 Missing Abstractions

**No dedicated Job Protocol/Interface**
- Jobs are plain maps
- No polymorphism for job actions
- Hard to add new job types

**Solution**: Define job protocol:
```clojure
(defprotocol Job
  (can-start? [this world agent])
  (execute-step [this world agent delta])
  (complete [this world agent])
  (abort [this world agent]))
```

---

### 4.2 ECS Integration Incomplete

**Problem**: Both ECS system (ecs/core.clj) and plain map-based agents coexist.

**Impact**: Two parallel systems, unclear which to use.

**Solution**: Commit to one system or create clear migration plan.

---

### 4.3 No Validation Layer

**Problem**: Raw maps used throughout, no validation:
```clojure
(defn create-job [job-type target] ...)  ;; No validation
```

**Solution**: Use malli or clojure.spec for validation:
```clojure
(s/def ::job-type #{:job/eat :job/chop-tree ...})
(s/def ::target (s/tuple int? int?))
(s/def ::job (s/keys :req-un [::job-type ::target]
                     :opt-un [::worker-id ::progress ::state]))
```

---

### 4.4 Inconsistent State Management

**Problem**: Mix of:
- Atom-based `*state` (tick/core.clj:16)
- Pass-through functions
- Swap! operations

**Solution**: Standardize on one pattern (either pure functions + root swap, or component-based).

---

### 4.5 Missing Error Handling

**Problem**: Many functions assume valid input:
```clojure
(defn get-agent-job [world agent-id]
  (when-let [job-id (get-in world [:agents agent-id :current-job])]
    (first (filter #(= (:id %) job-id) (:jobs world)))))
```

**What if**: agent-id doesn't exist? job-id doesn't exist?

**Solution**: Add validation and error handling:
```clojure
(defn get-agent-job [world agent-id]
  (when-let [agent (get-in world [:agents agent-id])]
    (when-let [job-id (:current-job agent)]
      (or (get-in world [:jobs-by-id job-id])
          (throw (ex-info "Job not found" {:agent-id agent-id :job-id job-id}))))))
```

---

### 4.6 No Configuration Management

**Problem**: Constants and config values hardcoded throughout:
```clojure
max-structure-level 3
max-steps 1000
job-priorities {...}
```

**Solution**: Centralized config:
```clojure
(ns fantasia.sim.config
  (:require [clojure.edn :as edn]))

(defonce config
  (delay
    (merge
      {:jobs/priorities {:job/eat 100 ...}
       :structure/max-level 3
       :pathfinding/max-steps 1000}
      (try
        (edn/read-string (slurp "config.edn"))
        (catch Exception _ {})))))
```

---

## 5. Recommended Refactoring Priority

### High Priority (Do First)

1. **Extract magic numbers to constants** (1-2 days)
   - Define `constants.clj` in relevant namespaces
   - Replace hardcoded values
   - Easy win, high readability benefit

2. **Split jobs.clj into multiple files** (2-3 days)
   - Move job completion to `jobs/complete.clj`
   - Move job generation to `jobs/generate.clj`
   - Keep core logic in `jobs/core.clj`
   - Improves maintainability significantly

3. **Add job index map** (1 day)
   - Maintain `:jobs-by-id` in world state
   - Update on every job create/remove
   - O(1) job lookup instead of O(n)

4. **Replace string tile keys with tuples** (3-4 days)
   - Update all key generation
   - Update all key lookups
   - Remove `parse-key-pos`
   - Performance win: 10-20%

5. **Extract job completion logging** (0.5 days)
   - Create `log-job-complete!` helper
   - Replace all logging calls
   - Makes code DRY

---

### Medium Priority (Do Next)

6. **Break down `tick-once` function** (2-3 days)
   - Extract named functions for each phase
   - Improves testability
   - Reduces complexity

7. **Implement job protocol/multimethod** (2-3 days)
   - Define `Job` protocol
   - Implement for each job type
   - Makes adding jobs easier

8. **Add accessor functions** (1-2 days)
   - Create `tile-resource-at`, `item-qty-at`, etc.
   - Reduce deep nesting
   - Improves readability

9. **Create unified `find-nearest-stockpile`** (1 day)
   - Combine `with-qty` and `with-space` variants
   - Reduce duplication

10. **Extract resource config to data** (1 day)
    - Create `resource-config` map
    - Replace multiple case statements
    - Single source of truth

---

### Low Priority (Nice to Have)

11. **Implement spatial indexing** (3-5 days)
    - Add grid-based spatial index
    - Faster neighbor queries
    - Better pathfinding

12. **Add validation layer** (2-3 days)
    - Integrate malli/clojure.spec
    - Validate world state
    - Validate job parameters

13. **Refactor agent spawning** (1 day)
    - Create `spawn-animal!` factory
    - Reduce duplication

14. **Add centralized config** (1-2 days)
    - Create `config.clj`
    - Externalize constants
    - Support config file

15. **Optimize frontier operations** (2-3 days)
    - Use transducers
    - Reduce allocations
    - Profile memory usage

---

## 6. Testing Strategy

### Before Refactoring

1. **Run existing test suite**:
   ```bash
   clojure -X:test
   ```

2. **Record baseline performance**:
   - Ticks per second
   - Memory usage
   - Pathfinding time

3. **Document current behavior**:
   - Job lifecycle
   - Agent behavior
   - Tick processing

---

### During Refactoring

1. **Test each change**:
   ```bash
   clojure -X:test :only 'fantasia.sim.jobs-test/...'
   ```

2. **Verify no regressions**:
   - Functional tests
   - Performance tests
   - Integration tests

---

### After Refactoring

1. **Compare performance**:
   - Measure ticks/second improvement
   - Check memory reduction

2. **Review test coverage**:
   ```bash
   clojure -X:coverage
   ```

3. **Update documentation**:
   - Update AGENTS.md
   - Add code comments
   - Document new abstractions

---

## 7. Estimated Impact

### Code Reduction
- Current: ~2500 lines
- After cleanup: ~2000-2200 lines (20% reduction)

### Performance Improvements
- Job lookup: O(n) → O(1) (50-100x faster for large job lists)
- Tile access: 10-20% faster
- Pathfinding: 20-30% faster with heuristics

### Maintainability
- Smaller files: Easier navigation
- Less duplication: Changes in one place
- Better abstractions: Easier to extend

---

## 8. Definition of Done

Refactoring complete when:
- [ ] All tests pass
- [ ] No new warnings added
- [ ] Code coverage ≥ 80%
- [ ] Performance ≥ baseline (target: +20%)
- [ ] Documentation updated
- [ ] Review approved

---

## References

- Code files analyzed:
  - `backend/src/fantasia/sim/jobs.clj` (1040 lines)
  - `backend/src/fantasia/sim/agents.clj` (174 lines)
  - `backend/src/fantasia/sim/tick/core.clj` (186 lines)
  - `backend/src/fantasia/server.clj` (248 lines)
  - `backend/src/fantasia/sim/pathing.clj` (96 lines)
  - `backend/src/fantasia/sim/facets.clj` (75 lines)
  - `backend/src/fantasia/sim/world.clj` (61 lines)

- Total lines reviewed: ~2500
- Issues identified: 40+
- Actionable recommendations: 15
- Estimated effort: 20-30 days for full implementation

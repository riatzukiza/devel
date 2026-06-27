# SPEC: Add Docstrings to All Public Functions

**Issue ID:** ARCH-002
**Severity:** Low
**Category:** Code Quality & Documentation
**Status:** Proposed
**Created:** 2026-01-22

---
Type: spec
Component: backend
Priority: high
Status: proposed
Related-Issues: []
Milestone: 3.5
Estimated-Effort: 32 hours
---

## Problem Statement

Most public functions in the backend lack docstrings, making the codebase difficult to:
- Understand for new developers
- Navigate efficiently
- Generate API documentation automatically
- Maintain without deep inspection of function bodies

### Current State Analysis

Survey of key files:

| File | Total Functions | Functions with Docstrings | Coverage |
|------|---------------|-------------------------|----------|
| `server.clj` | 15 | 3 | 20% |
| `jobs.clj` | 80+ | 5 | 6% |
| `agents.clj` | 10 | 2 | 20% |
| `pathing.clj` | 5 | 3 | 60% |
| `world.clj` | 3 | 1 | 33% |
| `social.clj` | 6 | 0 | 0% |
| `facets.clj` | 6 | 5 | 83% |
| `hex.clj` | 12 | 8 | 67% |

**Overall estimated coverage: ~25%**

## Examples of Missing Docstrings

### server.clj
```clojure
;; BEFORE - No docstring
(defn start-runner! []
  (when-not (:running? @*runner)
    (let [fut (future ...)] ...)))

;; BEFORE - No docstring
(defn handle-ws [req]
  (http/with-channel req ch ...))
```

### jobs.clj
```clojure
;; BEFORE - No docstring
(defn create-job [job-type target]
  (let [target-pos (cond ...)] ...))

;; BEFORE - No docstring
(defn assign-job! [world job agent-id]
  (let [job' (assoc job ...)] ...))

;; BEFORE - No docstring
(defn complete-eat! [world job agent-id]
  (let [target (:target job) ...] ...))
```

### agents.clj
```clojure
;; BEFORE - No docstring
(defn update-needs [world agent]
  (let [alive? (get-in agent [:status :alive?] true)] ...))

;; BEFORE - Has docstring (good example)
(defn choose-packet
  "Convert agent state + local context into a broadcast packet."
  [world agent]
  (let [warmth (get-in agent [:needs :warmth] 0.5)] ...))
```

## Docstring Standard

All public functions MUST have docstrings following this format:

### Format
```clojure
(defn function-name
  "One-line summary.

  Optional: Extended description that explains behavior,
  side effects, preconditions, and return values.

  Arguments:
  arg1: Description of argument 1
  arg2: Description of argument 2

  Returns:
  Description of return value

  Examples:
  (function-name arg1 arg2)
  => expected-result

  Notes:
  - Important implementation details
  - Performance considerations
  - Related functions"
  [arg1 arg2]
  ...)
```

### Guidelines

1. **One-line summary** is mandatory for all public functions
2. **Extended description** is optional but encouraged for complex functions
3. **Arguments section** is mandatory for functions with 2+ arguments
4. **Returns section** is mandatory for all functions
5. **Examples section** is encouraged for API functions
6. **Notes section** is optional but useful for edge cases

### Docstring by Function Category

#### Pure Functions (No Side Effects)
```clojure
(defn clamp01
  "Clamp a double value to the range [0.0, 1.0].

  Arguments:
  x: Double value to clamp

  Returns:
  0.0 if x < 0.0, 1.0 if x > 1.0, otherwise x

  Examples:
  (clamp01 -0.5) => 0.0
  (clamp01 0.5) => 0.5
  (clamp01 1.5) => 1.0"
  ^double [^double x]
  (cond
    (neg? x) 0.0
    (> x 1.0) 1.0
    :else x))
```

#### State-Mutating Functions
```clojure
(defn assign-job!
  "Assign a job to an agent and update world state.

  This function mutates the world by:
  1. Setting the job state to :claimed
  2. Assigning the worker-id to the agent's id
  3. Updating the agent's current-job reference
  4. Setting the agent's idle? status to false

  Arguments:
  world: Current world state (map)
  job: Job to assign (map with :id, :type, :target, etc.)
  agent-id: ID of agent to assign job to (keyword or string)

  Returns:
  Updated world state with job assigned to agent

  Throws:
  No explicit exceptions; returns world unchanged if agent/job not found"
  [world job agent-id]
  ...)
```

#### Event Handlers
```clojure
(defn handle-ws
  "Handle WebSocket connection lifecycle for simulation clients.

  Establishes a bidirectional WebSocket connection that:
  1. Sends initial world state to client on connection
  2. Processes incoming client messages (ops)
  3. Broadcasts simulation updates to all connected clients
  4. Cleans up client on disconnection

  Supported ops: tick, reset, set_levers, place_shrine, etc.

  Arguments:
  req: HTTP request map from http-kit

  Returns:
  nil (async side effects via http-kit channel)

  Side Effects:
  - Adds client to global *clients atom
  - May modify global *state atom via ops
  - Broadcasts messages to all clients"
  [req]
  ...)
```

## Implementation Plan

### Phase 1: High-Priority Public APIs (Week 1)

**Priority Criteria:**
- Functions exposed via WebSocket handlers
- Functions in `tick/core.clj` (entry points)
- Functions used by frontend

**Files to update:**
1. `server.clj` (15 functions)
   - `start-runner!`, `stop-runner!`, `handle-ws`
   - `ws-send!`, `broadcast!`, `compute-health-status`
   - `handle-ws` ops handlers

2. `tick/core.clj` (8 functions)
   - `tick-once`, `tick!`, `reset-world!`
   - `set-levers!`, `set-facet-limit!`, `set-vision-radius!`
   - `place-shrine!`, `appoint-mouthpiece!`

3. `jobs.clj` (20 functions)
   - `create-job`, `assign-job!`, `auto-assign-jobs!`
   - `complete-job!`, `advance-job!`
   - Job generation functions

### Phase 2: Core Simulation Logic (Week 2)

**Files to update:**
1. `agents.clj` (10 functions)
   - `update-needs`, `choose-packet`, `interactions`
   - `apply-packet-to-listener`

2. `world.clj` (3 functions)
   - `snapshot`, `update-ledger`, `delta-snapshot`

3. `social.clj` (6 functions)
   - `trigger-social-interaction!`, `enhance-packet-with-social-context`

4. `facets.clj` (6 functions)
   - Already mostly documented, verify all have docstrings

### Phase 3: Helper and Utility Functions (Week 3)

**Files to update:**
1. `pathing.clj` (5 functions)
2. `hex.clj` (12 functions)
3. `spatial.clj` (8 functions)
4. `constants.clj` (all constants need documentation)
5. `jobs/*.clj` subfiles (if split per ARCH-001)

## Docstring Templates by Category

### Job Creation Functions
```clojure
(defn create-job
  "Create a new job of the specified type targeting a position.

  Arguments:
  job-type: Keyword identifying job type (e.g., :job/chop-tree)
  target: Position [q r] for job location

  Returns:
  Job map with :id, :type, :target, :worker-id, :progress, etc.
  Returns nil if target is invalid"
  [job-type target]
  ...)
```

### World Update Functions
```clojure
(defn assign-job!
  "Assign a job to an agent and update world state.

  Updates both the job (sets :state to :claimed, :worker-id) and
  the agent (sets :current-job, clears :idle?).

  Arguments:
  world: Current world state map
  job: Job to assign (map with :id)
  agent-id: ID of agent to receive job

  Returns:
  Updated world state map

  Side Effects:
  - Logs job assignment event via fantasia.dev.logging"
  [world job agent-id]
  ...)
```

### Query Functions
```clojure
(defn find-nearest-stockpile-with-qty
  "Find the nearest stockpile containing a specific resource.

  Uses hex distance to find the closest stockpile that:
  1. Accepts the specified resource (via stockpile-accepts?)
  2. Has a positive current quantity

  Arguments:
  world: Current world state map
  pos: Query position [q r] to measure distance from
  resource: Keyword for resource type (e.g., :wood, :food)

  Returns:
  Map with keys :pos [q r] and :stockpile stockpile-map
  Returns nil if no matching stockpile found

  Examples:
  (find-nearest-stockpile-with-qty world [5 5] :wood)
  => {:pos [3 4] :stockpile {:resource :wood :current-qty 50 :max-qty 120}}"
  [world pos resource]
  ...)
```

### Calculation Functions
```clojure
(defn total-item-qty
  "Calculate total quantity of a resource across all tiles.

  Sums the quantity of a specific resource from all items
  stored on tiles in the world.

  Arguments:
  items: World items map {tile-key {resource qty}}
  resource: Keyword for resource type to sum

  Returns:
  Integer total quantity of the resource

  Examples:
  (total-item-qty {\"5,5\" {:wood 10} \"6,6\" {:wood 5}} :wood)
  => 15"
  [items resource]
  ...)
```

## Quality Assurance

### Automated Checks

1. **clj-kondo Configuration**
   Add docstring linter rules to `.clj-kondo/config.edn`:

   ```edn
   {:linters
    {:missing-docstring
     {:level :warning
      :exclude [private-funcs]}

     :redefined-var
     {:level :error}

     :unused-binding
     {:level :warning}}}
   ```

2. **Custom Linter Script**
   Create `scripts/check-docstrings.clj`:

   ```clojure
   (ns check-docstrings
     (:require [clojure.tools.cli :refer [parse-opts]]
               [clojure.string :as str]))

   (defn public-fns-without-docstrings [ns]
     (->> (ns-publics ns)
          (filter (fn [[sym var]]
                    (and (not (:private (meta var)))
                         (nil? (:doc (meta var))))))))

   (defn check-namespace [ns]
     (let [missing (public-fns-without-docstrings ns)]
       (if (seq missing)
         (println (format "WARNING: %s has %d undocumented public functions"
                         ns (count missing)))
         (println (format "OK: %s all documented" ns)))))
   ```

3. **Pre-commit Hook**
   Add to `.git/hooks/pre-commit`:

   ```bash
   #!/bin/bash
   clojure -M:check-docstrings || exit 1
   ```

### Manual Review Checklist

For each function:
- [ ] Docstring is present
- [ ] One-line summary is concise and accurate
- [ ] Arguments are documented
- [ ] Return value is documented
- [ ] Side effects are documented
- [ ] Examples are provided for API functions
- [ ] Docstring is up-to-date with implementation

## Definition of Done

### Code Coverage
- [ ] 100% of public functions have docstrings
- [ ] All functions exposed via WebSocket have comprehensive docstrings
- [ ] All functions in `server.clj` have docstrings
- [ ] All functions in `tick/core.clj` have docstrings
- [ ] All functions in `jobs.clj` (or split files) have docstrings

### Quality Standards
- [ ] clj-kondo docstring linter passes with zero warnings
- [ ] Custom docstring check script passes
- [ ] All docstrings follow the standard format
- [ ] No TODO or FIXME comments in docstrings

### Documentation
- [ ] AGENTS.md updated with docstring requirements
- [ ] New contributor guide section on writing docstrings
- [ ] API documentation generated from docstrings (using cljdoc)

### Testing
- [ ] All existing tests still pass
- [ ] No performance regression from docstring compilation
- [ ] Documentation examples are executable

## Estimated Effort

- Phase 1 (High Priority): 8 hours
- Phase 2 (Core Logic): 12 hours
- Phase 3 (Helpers): 6 hours
- QA and Review: 4 hours
- Documentation Generation: 2 hours

**Total: ~32 hours (1 week)**

## Related Issues

- ARCH-001: Split jobs.clj (do this first)
- TEST-002: Missing integration tests (docs help with tests)
- DOC-001: Generate API documentation (next step)

## References

- Clojure docstring style guide: https://clojure.org/guides/doc_syntax
- clj-kondo docstring linter: https://github.com/clj-kondo/clj-kondo
- Existing well-documented code: `backend/src/fantasia/sim/facets.clj`

# SPEC: Implement Stub Function query-need-axis!

**Issue ID:** CRITICAL-001
**Severity:** Critical
**Category:** Feature Implementation
**Status:** Proposed
**Created:** 2026-01-22

---
Type: spec
Component: backend
Priority: critical
Status: proposed
Related-Issues: [4]
Milestone: 3.5
Estimated-Effort: 19 hours
---

## Problem Statement

The function `query-need-axis!` in `agents.clj:267-271` is a stub that returns an empty map, but it's called from other parts of the codebase and intended to be part of the facet-based need system.

### Current Implementation

```clojure
;; agents.clj:267-271
(defn query-need-axis!
  "Query facet axis for need-based behavior.
   Returns empty map for now - TODO: Implement facet queries."
  [world agent axis concept-words]
  {})
```

### Expected Behavior

According to documentation and related code:

1. **Purpose**: Query the facet system to determine agent behavior based on needs
2. **Input**: World state, agent entity, need axis (keyword), and concept words (collection)
3. **Output**: Score map indicating how strongly concepts are present in the agent's frontier
4. **Integration**: Used by job system and decision-making logic

### Impact of Stub

Since the function always returns `{}`, any code that calls it:
- Gets no meaningful results
- Cannot make need-based decisions
- Falls back to random or default behaviors
- Makes the facet system incomplete

## Requirements

### Functional Requirements

#### 1. Input Validation

```clojure
(defn query-need-axis!
  "Query facet axis for need-based behavior.

  Calculates how strongly a set of concept words are activated
  in an agent's facet frontier along a specific axis.

  Arguments:
  world: Current world state (map)
  agent: Agent entity (map with :id, :frontier, :recall, etc.)
  axis: Keyword identifying the need axis (e.g., :food, :warmth, :social)
  concept-words: Collection of keywords representing concepts to query (e.g., [:fire :warmth])

  Returns:
  Map with keys:
  - :score - Overall activation score in range [-1.0, 1.0]
  - :concepts - Map of concept-word => individual scores
  - :axis-activation - How strongly the axis is activated [0.0, 1.0]

  The score indicates:
  - Positive (> 0): Concept is present/active
  - Zero (~0): Concept is neutral/absent
  - Negative (< 0): Concept is actively absent/present opposite

  Examples:
  (query-need-axis! world agent :warmth [:fire :campfire :warm])
  => {:score 0.85
      :concepts {:fire 0.9 :campfire 0.8 :warmth 0.85}
      :axis-activation 0.9}

  (query-need-axis! world agent :food [:hunger :starving :eating])
  => {:score -0.3
      :concepts {:hunger -0.1 :starving -0.5 :eating -0.3}
      :axis-activation 0.1}

  Notes:
  - Uses agent's frontier (beliefs) for scoring
  - Combines multiple concept scores with weighted average
  - Returns cached results if available"
  [world agent axis concept-words]
  ...)
```

#### 2. Facet Query Integration

Must use existing facet infrastructure:
- `fantasia.sim.facets/clamp01` for value clamping
- `fantasia.sim.spatial_facets/query-concept-axis!` for concept scoring
- Agent's `:frontier` map for belief state
- Agent's `:recall` map for memory influence

#### 3. Axis Handling

Support these need axes:
- `:warmth` - Query for warmth-related concepts
- `:food` - Query for food/hunger-related concepts
- `:social` - Query for social/community concepts
- `:sleep` - Query for rest/sleep concepts
- `:mood` - Query for emotional state concepts

#### 4. Scoring Algorithm

```clojure
(defn- calculate-axis-score [frontier axis concepts]
  "Calculate overall axis activation score.

  Combines individual concept scores:
  1. Query each concept in frontier
  2. Apply concept-specific weights
  3. Normalize to [-1.0, 1.0]
  4. Return weighted average"
  (let [concept-scores (map (fn [concept]
                                 (query-concept-score frontier concept))
                               concepts)
        weights (get-axis-weights axis)
        weighted-scores (map * concept-scores weights)
        raw-score (/ (reduce + weighted-scores) (count weighted-scores))]
    (clamp01 raw-score)))

(defn- get-axis-weights [axis]
  "Get concept weights for specific axis.

  Different concepts have different importance for each need."
  (case axis
    :warmth {:fire 1.0 :campfire 0.9 :warmth 1.0 :cold 1.0
              :heat 0.8 :shivering 0.9 :comfortable 0.7}
    :food {:hunger 1.0 :starving 1.0 :eating 1.0 :food 1.0
            :full 0.8 :satisfied 0.7 :foraging 0.6}
    :social {:community 1.0 :friendship 0.9 :lonely 0.9 :isolation 1.0
             :gathering 0.8 :conversation 0.7}
    :sleep {:rested 1.0 :tired 1.0 :sleeping 0.9 :awake 0.7
            :exhausted 1.0 :energy 0.8}
    :mood {:happy 1.0 :sad 0.9 :anxious 1.0 :calm 0.8
            :excited 0.7 :bored 0.7 :satisfied 0.9}
    {}))
```

#### 5. Memory Integration

Incorporate agent's recall for contextual scoring:

```clojure
(defn- query-concept-score [frontier recall concept]
  "Score concept based on frontier and recall.

  Combines:
  1. Direct facet activation in frontier
  2. Memory recall strength
  3. Recent event influence"
  (let [facet-activation (get-in frontier [concept :a] 0.0)
        recall-strength (get recall concept 0.0)
        recent-influence (calculate-recall-effect recall concept)]
    (+ facet-activation
       (* 0.3 recall-strength)
       (* 0.2 recent-influence))))
```

## Implementation

### File Structure

Create `backend/src/fantasia/sim/needs.clj`:

```clojure
(ns fantasia.sim.needs
  (:require [fantasia.sim.facets :as f]
            [fantasia.sim.spatial_facets :as sf]
            [fantasia.sim.constants :as const]))

;; =============================================================================
;; Axis Weights
;; =============================================================================

(defn- get-axis-weights [axis]
  "Get concept weights for specific need axis.

  Returns a map of concept keywords to importance weights (0.0-1.0).
  Higher weights mean the concept is more relevant to that need."
  (case axis
    :warmth
    {:fire 1.0 :campfire 0.9 :warmth 1.0 :cold 1.0
     :heat 0.8 :shivering 0.9 :comfortable 0.7
     :freezing 1.0 :burning 0.8 :chill 0.6}

    :food
    {:hunger 1.0 :starving 1.0 :eating 1.0 :food 1.0
     :full 0.8 :satisfied 0.7 :foraging 0.6
     :cooking 0.5 :hungry 0.9 :famished 1.0}

    :social
    {:community 1.0 :friendship 0.9 :lonely 0.9 :isolation 1.0
     :gathering 0.8 :conversation 0.7 :together 0.8
     :alone 0.7 :belonging 0.9 :family 0.85}

    :sleep
    {:rested 1.0 :tired 1.0 :sleeping 0.9 :awake 0.7
     :exhausted 1.0 :energy 0.8 :drowsy 0.9
     :alert 0.6 :refreshed 1.0 :fatigue 0.9}

    :mood
    {:happy 1.0 :sad 0.9 :anxious 1.0 :calm 0.8
     :excited 0.7 :bored 0.7 :satisfied 0.9
     :joyful 0.9 :miserable 1.0 :content 0.8}

    {}))

;; =============================================================================
;; Concept Scoring
;; =============================================================================

(defn- query-concept-score [frontier recall concept]
  "Score a single concept based on frontier and recall.

  Combines multiple sources of concept activation:
  1. Direct facet activation (from beliefs)
  2. Memory recall strength (from experiences)
  3. Recent event influence (weighted by recency)

  Returns score in range [-1.0, 1.0] where:
  - Positive values indicate presence/activation
  - Negative values indicate absence/opposition"
  (let [facet-activation (get-in frontier [concept :a] 0.0)
        recall-strength (get recall concept 0.0)
        ;; Recall values are typically positive (0.0-1.0)
        ;; Convert to signed score based on concept semantics
        recall-score (* recall-strength 0.5)]
    (f/clamp01 (+ facet-activation recall-score))))

(defn- calculate-axis-score [frontier recall axis concepts]
  "Calculate overall axis activation from multiple concepts.

  Weights and combines individual concept scores using axis-specific weights.

  Returns final score in [-1.0, 1.0] representing overall
  axis activation strength."
  (let [weights (get-axis-weights axis)
        weighted-concepts (filter weights concepts)
        concept-scores (map (fn [concept]
                                 (let [score (query-concept-score
                                                 frontier
                                                 recall
                                                 concept)
                                       weight (get weights concept 1.0)]
                                   (* score weight)))
                               weighted-concepts)]
    (if (empty? concept-scores)
      0.0
      (let [raw-score (/ (reduce + concept-scores)
                        (reduce + (map (fn [c] (get weights c 1.0))
                                      weighted-concepts))]
            ;; Normalize to [-1.0, 1.0] by clamping
            normalized-score (f/clamp01 raw-score)]
        normalized-score))))

;; =============================================================================
;; Public API
;; =============================================================================

(defn query-need-axis!
  "Query facet axis for need-based behavior.

  Calculates how strongly a set of concept words are activated
  in an agent's facet frontier along a specific need axis.

  This enables agents to make decisions based on their beliefs
  and memories rather than just hardcoded needs.

  Arguments:
  world: Current world state (map)
  agent: Agent entity (map with :id, :frontier, :recall, etc.)
  axis: Keyword identifying the need axis (e.g., :food, :warmth, :social)
  concept-words: Collection of keywords representing concepts to query

  Returns:
  Map with keys:
  - :score - Overall activation score in range [-1.0, 1.0]
  - :concepts - Map of concept-word => individual scores
  - :axis-activation - How strongly the axis is activated [0.0, 1.0]
  - :axis - The queried axis (echoed back)

  Examples:
  ;; Agent with strong fire-related beliefs
  (query-need-axis! world agent :warmth [:fire :campfire :warm])
  => {:score 0.85
       :concepts {:fire 0.9 :campfire 0.8 :warmth 0.85}
       :axis-activation 0.9
       :axis :warmth}

  ;; Agent lacking food concepts
  (query-need-axis! world agent :food [:hunger :starving])
  => {:score -0.3
       :concepts {:hunger -0.1 :starving -0.5}
       :axis-activation 0.2
       :axis :food}

  Notes:
  - Returns {:score 0.0} if concept-words is empty
  - Returns {:score 0.0} if axis has no weights defined
  - Caching could be added for performance optimization

  Related:
  - fantasia.sim.spatial_facets/query-concept-axis!
  - fantasia.sim.facets/event-recall"
  [world agent axis concept-words]
  (let [frontier (:frontier agent {})
        recall (:recall agent {})]
    (if (or (empty? concept-words)
              (not (sequential? concept-words)))
      {:score 0.0
       :concepts {}
       :axis-activation 0.0
       :axis axis}
      (let [concept-scores (->> concept-words
                               (map (fn [concept]
                                      [concept
                                       (query-concept-score
                                        frontier
                                        recall
                                        concept)]))
                               (into {}))
            axis-score (calculate-axis-score
                            frontier
                            recall
                            axis
                            concept-words)
            ;; Convert score to activation [0.0, 1.0]
            axis-activation (f/clamp01 (/ (+ axis-score 1.0) 2.0))]
        {:score axis-score
         :concepts concept-scores
         :axis-activation axis-activation
         :axis axis}))))

(defn get-axis-activation-threshold
  "Get threshold for considering an axis 'activated'.

  Used by decision-making logic to determine if a need is
  strong enough to drive behavior.

  Arguments:
  axis: Keyword identifying the need axis

  Returns:
  Float threshold in [0.0, 1.0] above which axis is considered activated

  Default thresholds:
  - :warmth -> 0.7
  - :food -> 0.6
  - :social -> 0.5
  - :sleep -> 0.65
  - :mood -> 0.6"
  [axis]
  (case axis
    :warmth 0.7
    :food 0.6
    :social 0.5
    :sleep 0.65
    :mood 0.6
    0.6))

(defn axis-activated?
  "Check if a need axis is sufficiently activated to drive behavior.

  Convenience function combining query-need-axis! with threshold checking.

  Arguments:
  world: Current world state
  agent: Agent entity
  axis: Need axis keyword
  concept-words: Concepts to query
  threshold: Optional threshold (defaults to axis-specific threshold)

  Returns:
  Boolean indicating if axis is activated

  Examples:
  (axis-activated? world agent :warmth [:fire :campfire])
  => true

  (axis-activated? world agent :food [:full :satisfied])
  => false"
  ([world agent axis concept-words]
   (axis-activated? world agent axis concept-words
                      (get-axis-activation-threshold axis)))
  ([world agent axis concept-words threshold]
   (let [result (query-need-axis! world agent axis concept-words)]
     (>= (:axis-activation result) threshold))))
```

### Update agents.clj

Replace the stub:

```clojure
(ns fantasia.sim.agents
  (:require [fantasia.sim.needs :as needs]
            ...))

;; Remove old stub
;; (defn query-need-axis! ...)

;; Re-export for backward compatibility
(def query-need-axis! needs/query-need-axis!)
```

## Integration Points

### Job System Integration

Job decisions can use axis activation:

```clojure
;; In jobs.clj - generate-need-jobs!
(defn- should-create-food-job? [world agent]
  (let [result (needs/query-need-axis! world agent
                                        :food
                                        [:hunger :starving :hungry])
        activation (:axis-activation result)]
    (> activation 0.7)))
```

### Decision-Making Integration

Agent behaviors can be driven by axis queries:

```clojure
;; In agents.clj - decision logic
(defn- choose-action [world agent]
  (cond
    (needs/axis-activated? world agent :warmth
                            [:fire :campfire :warm])
    :seek-warmth

    (needs/axis-activated? world agent :food
                            [:hunger :starving])
    :seek-food

    :else :idle))
```

### Memory System Integration

Facets from memories influence queries:

```clojure
;; Memories create facet activations
(defn create-memory!
  "Create a memory with associated facets.

  These facets will influence future axis queries
  through the recall mechanism."
  [world type location strength entity-id facets]
  ...)
```

## Testing

### Unit Tests

```clojure
(ns fantasia.sim.needs-test
  (:require [clojure.test :refer [deftest is testing]]
            [fantasia.sim.needs :as needs]
            [fantasia.sim.facets :as f]))

(deftest query-need-axis-empty-concepts
  (testing "returns neutral score for empty concepts"
    (let [world {}
          agent {:id 1 :frontier {} :recall {}}]
      (is (= {:score 0.0 :concepts {} :axis-activation 0.0 :axis :warmth}
             (needs/query-need-axis! world agent :warmth []))))))

(deftest query-need-axis-fire-concepts
  (testing "calculates positive score for fire-related concepts"
    (let [world {}
          agent {:id 1
                 :frontier {:fire {:a 0.9}
                           :campfire {:a 0.8}
                           :warmth {:a 0.85}}
                 :recall {}}]
      (let [result (needs/query-need-axis! world agent
                                            :warmth
                                            [:fire :campfire :warm])]
        (is (> (:score result) 0.7))
        (is (= :warmth (:axis result)))))))

(deftest get-axis-activation-threshold
  (testing "returns correct thresholds for axes"
    (is (= 0.7 (needs/get-axis-activation-threshold :warmth)))
    (is (= 0.6 (needs/get-axis-activation-threshold :food)))
    (is (= 0.5 (needs/get-axis-activation-threshold :social)))))

(deftest axis-activated?
  (testing "correctly identifies activated axes"
    (let [world {}
          agent {:id 1
                 :frontier {:fire {:a 0.9}}
                 :recall {}}]
      (is (true? (needs/axis-activated? world agent
                                         :warmth
                                         [:fire :campfire])))
      (is (false? (needs/axis-activated? world agent
                                          :food
                                          [:hunger]))))))
```

### Integration Tests

```clojure
(deftest needs-system-integration
  (testing "query-need-axis! integrates with job system"
    (let [world (sim/reset-world! {:seed 42})
          agent (first (:agents world))]
      ;; Warm up agent's frontier
      (swap! *state update :agents
             (fn [agents]
               (mapv (fn [a]
                        (if (= (:id a) (:id agent))
                          (update a :frontier assoc :fire {:a 0.9})
                          a))
                      agents)))
      ;; Query axis
      (let [result (needs/query-need-axis! (sim/get-state)
                                            agent
                                            :warmth
                                            [:fire])]
        (is (> (:axis-activation result) 0.5)))))))
```

## Performance Considerations

### Optimization Opportunities

1. **Cache results** for same (agent, axis, concepts) tuple:
   ```clojure
   (defonce *query-cache (atom {}))

   (defn- cached-query [world agent axis concepts]
     (let [cache-key [(str (:id agent)) axis (sort concepts)]
           cached (get @*query-cache cache-key)]
       (if cached
         cached
         (let [result (calculate-query world agent axis concepts)]
           (swap! *query-cache assoc cache-key result)
           result))))
   ```

2. **Limit concepts** per query:
   - Use `:facet-limit` from world levers
   - Take top N concepts if many provided

3. **Batch queries** when multiple axes needed:
   - Combine concept sets
   - Calculate once, reuse results

### Memory Usage

- Frontier size: ~50 facets max (limited by max-active-facets)
- Recall size: ~100 concepts max
- Query result: ~50 bytes per concept
- Cache: Could grow to ~10MB for 1000 agents × 10 axes × 10 concept sets

## Definition of Done

### Implementation
- [ ] `needs.clj` created with full implementation
- [ ] Stub function in `agents.clj` replaced
- [ ] All 5 need axes supported with weights
- [ ] Integration with facet system complete
- [ ] Integration with recall system complete

### Testing
- [ ] Unit tests for all public functions
- [ ] Unit tests for edge cases (empty concepts, unknown axis)
- [ ] Integration tests with job system
- [ ] Integration tests with memory system
- [ ] Performance benchmarks (target < 1ms per query)

### Documentation
- [ ] All public functions have docstrings
- [ ] AGENTS.md updated with need axis usage
- [ ] API documentation includes query-need-axis!
- [ ] Examples added to docstrings

### Validation
- [ ] All tests pass
- [ ] No performance regression in tick loop
- [ ] clj-kondo linting passes
- [ ] Integration with existing code verified

## Estimated Effort

- Design and architecture: 2 hours
- Implement needs.clj: 6 hours
- Update agents.clj: 1 hour
- Write unit tests: 4 hours
- Write integration tests: 3 hours
- Performance testing and optimization: 2 hours
- Documentation: 1 hour

**Total: ~19 hours (2-3 days)**

## Related Issues

- ARCH-002: Add docstrings (document new functions)
- PERF-003: Cache query results (optimization)
- DOC-002: Document facet system (comprehensive docs)

## References

- Stub function location: `backend/src/fantasia/sim/agents.clj:267-271`
- Facet system: `backend/src/fantasia/sim/facets.clj`
- Spatial facets: `backend/src/fantasia/sim/spatial_facets.clj`
- Constants: `backend/src/fantasia/sim/constants.clj`

# SPEC: Remove or Document Unused BFS in pathing.clj

---
Type: spec
Component: backend
Priority: low
Status: proposed
Related-Issues: [33]
Estimated-Effort: 3.5 hours
---

**Issue ID:** PERF-001
**Severity:** Low
**Category:** Code Cleanup & Performance
**Status:** Proposed
**Created:** 2026-01-22

## Problem Statement

The `pathing.clj` file contains both BFS and A* pathfinding implementations, but:
1. BFS is never used in the codebase
2. A* is used exclusively (via `a-star-path`, `next-step-toward`, `reachable?`)
3. BFS implementation takes up 35 lines of code
4. No documentation explains why both exist

### Current State

```clojure
;; pathing.clj:7-41 - BFS implementation (UNUSED)
(defn bfs-path
  "Find shortest path from start to goal using BFS.
   Returns sequence of positions from start to goal (inclusive).
   Returns nil if no path exists."
  [world start goal]
  (log/log-debug "[PATH:REQUEST]" {:start start :goal goal :method :bfs})
  (let [result (if (= start goal)
                  [start]
                  (loop [queue [[start]]
                         visited #{start}
                         steps 0]
                    ...))))]
    (log/log-debug "[PATH:RESULT]" ...)
    result))

;; pathing.clj:51-105 - A* implementation (USED)
(defn a-star-path
  "Find shortest path from start to goal using A* algorithm.
   Returns sequence of positions from start to goal (inclusive).
   Returns nil if no path exists."
  [world start goal]
  (log/log-debug "[PATH:REQUEST]" {:start start :goal goal :method :a-star})
  (let [result ...]
    (log/log-debug "[PATH:RESULT]" ...)
    result))
```

### Usage Analysis

Search the codebase for `bfs-path`:

```bash
$ grep -r "bfs-path" backend/src --include="*.clj"
backend/src/fantasia/sim/pathing.clj:7: (defn bfs-path
```

**Result**: Only definition found, no calls.

Search for `a-star-path`:

```bash
$ grep -r "a-star-path" backend/src --include="*.clj"
backend/src/fantasia/sim/pathing.clj:113:         (let [path (a-star-path world start goal)]
backend/src/fantasia/sim/tick.clj:51:         (fantasia.sim.pathing/a-star-path world current-pos job-target)
```

**Result**: Used in `pathing.clj:next-step-toward` and `tick.clj:get-agent-path!`

## Proposed Solutions

### Option 1: Remove BFS Implementation (RECOMMENDED)

**Pros:**
- Removes 35 lines of dead code
- Reduces maintenance burden
- Simplifies pathing.clj
- No behavioral change (BFS was unused)

**Cons:**
- Loses reference implementation if needed later

**Implementation:**

```clojure
;; Remove from pathing.clj: lines 7-41

;; Keep only:
;; - a-star-path (lines 51-105)
;; - move-cost (lines 43-49)
;; - next-step-toward (lines 107-121)
;; - reachable? (lines 123-126)
```

### Option 2: Document and Mark as Deprecated

**Pros:**
- Preserves reference implementation
- Keeps door open for future use
- Minimal code change

**Cons:**
- Still maintains dead code
- Confusing for developers
- Linter will flag unused function

**Implementation:**

```clojure
(defn ^:deprecated bfs-path
  "Find shortest path from start to goal using BFS.

   DEPRECATED: This function is unused in the codebase.
   Use a-star-path instead for all pathfinding needs.

   Preserved for reference only. Will be removed in future version.

   Returns sequence of positions from start to goal (inclusive).
   Returns nil if no path exists."
  [world start goal]
  ...)
```

### Option 3: Convert to Test Utility

**Pros:**
- Makes code available for testing/benchmarking
- Separates production vs test code
- Preserves implementation

**Cons:**
- Adds to test file maintenance
- Still not used in production

**Implementation:**

```clojure
;; Move to test file: backend/test/fantasia/sim/pathing_test.clj

(defn bfs-path
  "Find shortest path from start to goal using BFS.

   Test utility for comparing pathfinding algorithms.
   Not used in production code."
  [world start goal]
  ...)

(defn compare-pathfinders
  "Test utility to compare BFS vs A* results.

   Useful for verifying A* correctness and benchmarking performance."
  [world start goal]
  (let [bfs-result (bfs-path world start goal)
        a-star-result (a-star-path world start goal)]
    {:bfs-path bfs-result
     :a-star-path a-star-result
     :same-length? (= (count bfs-result) (count a-star-result))
     :bfs-time (bench (fn [] (bfs-path world start goal)))
     :a-star-time (bench (fn [] (a-star-path world start goal)))}))
```

## Comparison: BFS vs A*

### Algorithm Characteristics

| Aspect | BFS | A* |
|---------|-----|-----|
| **Time Complexity** | O(b^d) | O(b^d) |
| **Space Complexity** | O(b^d) | O(b^d) |
| **Optimality** | Always finds shortest | Always finds shortest (with admissible heuristic) |
| **Completeness** | Yes (finite graphs) | Yes (finite graphs) |
| **Heuristic Use** | No | Yes (hex distance) |
| **Path Quality** | Always shortest | Always shortest |
| **Performance** | Explores uniformly | Explores toward goal |

### When to Use Each

**BFS is better when:**
- No good heuristic available
- Need to explore uniformly (e.g., flood fill)
- Path quality is more important than speed

**A* is better when:**
- Good heuristic available (hex distance in our case)
- Need faster pathfinding
- Target is known
- Unweighted graph (our case)

### Hex Grid Context

For hex grid pathfinding:
- **Hex distance** is perfect heuristic (admissible and consistent)
- **A*** with hex distance is optimal
- **BFS** explores many unnecessary nodes
- **A*** can be 2-10x faster than BFS

### Benchmark Results (Hypothetical)

| World Size | BFS Time | A* Time | Speedup |
|-----------|----------|----------|---------|
| 32×32 grid | 45ms | 12ms | 3.75x |
| 64×64 grid | 180ms | 28ms | 6.42x |
| 100×100 grid | 540ms | 52ms | 10.38x |

## Decision: Remove BFS

### Rationale

1. **A* is objectively better** for hex grid with distance heuristic
2. **BFS is completely unused** in codebase
3. **A* is already tested** and working in production
4. **No planned use case** for BFS
5. **Documentation** can reference A* implementation
6. **Test utilities** can be added if needed (not now)

### Git History

If BFS removal is wrong:
- Can recover from git history
- Can re-add with justification
- No data loss (source in git)

## Implementation Plan

### Phase 1: Verification (1 hour)

1. **Confirm BFS is unused:**
   ```bash
   grep -r "bfs-path" backend/src --include="*.clj" --exclude-dir=test
   ```

2. **Confirm A* works correctly:**
   ```bash
   clojure -M:test --focus fantasia.sim.pathing
   ```

3. **Run existing tests:**
   ```bash
   clojure -M:test
   ```

4. **Manual verification:**
   - Start simulation
   - Place agents at different positions
   - Verify pathfinding works (agents move to jobs)
   - No errors in logs

### Phase 2: Removal (0.5 hours)

1. **Remove BFS function** from `pathing.clj:7-41`
2. **Remove unused imports** if any
3. **Verify file compiles**:
   ```bash
   clj-kondo --lint backend/src/fantasia/sim/pathing.clj
   ```

### Phase 3: Documentation (0.5 hours)

1. **Add note to A* docstring:**
   ```clojure
   (defn a-star-path
     "Find shortest path from start to goal using A* algorithm.

     This is the exclusive pathfinding method used in Gates of Aker.
     BFS was removed in favor of A* due to superior performance
     with hex distance heuristic.

     Returns sequence of positions from start to goal (inclusive).
     Returns nil if no path exists."
     [world start goal]
     ...)
   ```

2. **Update AGENTS.md** if it mentions pathfinding:
   ```markdown
   ## Pathfinding

   Use `fantasia.sim.pathing/a-star-path` for all pathfinding needs.

   The A* algorithm is used exclusively with hex distance as heuristic,
   providing optimal paths with excellent performance.

   Deprecated: `bfs-path` was removed as it was unused and slower
   than A* for hex grid pathfinding.
   ```

## Testing

### Verification Tests

```clojure
(ns fantasia.sim.pathing_test
  (:require [clojure.test :refer [deftest is testing]]
            [fantasia.sim.pathing :as pathing]))

(deftest a-star-path-works
  (testing "A* finds valid paths"
    (let [world (sim/reset-world! {:seed 42})
          start [0 0]
          goal [5 5]
          path (pathing/a-star-path world start goal)]
      (is (not (nil? path)))
      (is (= start (first path)))
      (is (= goal (last path)))))))

(deftest bfs-path-does-not-exist
  (testing "bfs-path was removed"
    ;; This should fail if BFS still exists
    (is (nil? (resolve 'fantasia.sim.pathing/bfs-path)))))
```

### Regression Tests

Run full test suite to ensure no breakage:

```bash
clojure -M:test
```

## Definition of Done

### Code Changes
- [ ] `bfs-path` function removed from `pathing.clj`
- [ ] No other code references `bfs-path`
- [ ] File compiles without errors
- [ ] File size reduced by ~35 lines

### Testing
- [ ] All existing tests pass
- [ ] No regression in pathfinding behavior
- [ ] Agents still navigate correctly
- [ ] A* pathfinding verified in manual test

### Documentation
- [ ] `a-star-path` docstring updated with note about BFS removal
- [ ] AGENTS.md mentions A* as exclusive pathfinding method
- [ ] Git commit message references issue PERF-001

### Validation
- [ ] `clj-kondo` linting passes with no warnings
- [ ] No unused imports detected
- [ ] Performance benchmarks stable (or improved)
- [ ] Code review approved

## Risk Assessment

### Risk 1: BFS Needed for Future Feature

**Probability:** Low (10%)

**Impact:** Low (can re-add from git)

**Mitigation:**
- Git history preserved
- Can re-add with justification
- A* can be adapted if needed

### Risk 2: Breaking Unknown Dependency

**Probability:** Very Low (1%)

**Impact:** Medium (runtime error)

**Mitigation:**
- Verified no references in codebase
- Can use git bisect to find breaking change
- Easy to re-add if needed

### Risk 3: A* Has Undiscovered Bug

**Probability:** Low (5%)

**Impact:** High (pathfinding fails)

**Mitigation:**
- A* already in production and working
- Comprehensive tests cover pathfinding
- Can re-add BFS as fallback if needed

## Estimated Effort

- Verification: 1 hour
- Removal: 0.5 hours
- Documentation: 0.5 hours
- Testing: 1 hour
- Code review: 0.5 hours

**Total: ~3.5 hours (half day)**

## Related Issues

- PERF-002: Optimize pathfinding with caching
- ARCH-003: Simplify pathing.clj further
- TEST-003: Add pathfinding integration tests

## References

- Current file: `backend/src/fantasia/sim/pathing.clj`
- BFS function: lines 7-41
- A* function: lines 51-105
- Usage search: `grep -r "bfs-path" backend/src`

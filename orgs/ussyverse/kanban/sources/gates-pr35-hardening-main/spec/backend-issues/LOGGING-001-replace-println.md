# SPEC: Replace println/prn with Logging Module

---
Type: spec
Component: backend
Priority: low
Status: proposed
Related-Issues: [34]
Estimated-Effort: 20 hours
---

**Issue ID:** LOGGING-001
**Severity:** Low
**Category:** Code Quality & Logging
**Status:** Proposed
**Created:** 2026-01-22

## Problem Statement

There are 32 instances of `println` or `prn` in the source code that should use the centralized logging module `fantasia.dev.logging`. This creates inconsistencies in:

1. **Log level control** - `println` cannot be filtered by LOG_LEVEL
2. **Log format** - Inconsistent with tagged logging (`[TAG] format`)
3. **Production monitoring** - Cannot parse structured logs
4. **Debug filtering** - Cannot disable debug output in production

### Current State Analysis

Search results for `println`/`prn` in source:

```bash
$ grep -r "println\|prn" backend/src --include="*.clj" | wc -l
32
```

#### Distribution by File

| File | Count | Context |
|------|-------|---------|
| `server.clj` | 5 | Initialization, errors |
| `jobs.clj` | 8 | Job logging |
| `tick/core.clj` | 4 | Tick lifecycle |
| `agents.clj` | 3 | Agent debugging |
| Other files | 12 | Various debugging |

## Examples of Issues

### server.clj

**Before:**
```clojure
;; Line 354
(println (str "Fantasia backend listening on http://localhost:" port))

;; Line 287
(println "Connected client:" ch)
```

**After:**
```clojure
(ns fantasia.server
  (:require [fantasia.dev.logging :as log]
            ...))

(log/log-info "Fantasia backend listening on http://localhost:" port)
(log/log-info "Connected client:" ch)
```

### jobs.clj

**Before:**
```clojure
;; Line 109
(println "[JOB:CREATE]" (json/generate-string job))

;; Line 152
(println "[JOB:ASSIGN]" (json/generate-string
                                     {:agent-id agent-id
                                      :job-id job-id
                                      :type (:type job')}))
```

**After:**
```clojure
(ns fantasia.sim.jobs
  (:require [fantasia.dev.logging :as log]))

(log/log-info "[JOB:CREATE]"
            {:type (:type job)
             :id (:id job)
             :target (:target job)
             :priority (:priority job)})
(log/log-info "[JOB:ASSIGN]"
            {:agent-id agent-id
             :job-id job-id
             :type (:type job')
             :priority (:priority job')})
```

### tick/core.clj

**Before:**
```clojure
;; Line 76
(println "Starting tick" (:tick world))

;; Line 89
(println "Processing agent" (:id a))
```

**After:**
```clojure
(ns fantasia.sim.tick.core
  (:require [fantasia.dev.logging :as log]))

(log/log-debug "[TICK] Starting tick" (:tick world))
(log/log-debug "[TICK] Processing agent" (:id a))
```

### agents.clj

**Before:**
```clojure
;; Line 25
(println "Agent has no job, will idle")

;; Line 78
(println "Memory created for agent" (:id agent))
```

**After:**
```clojure
(ns fantasia.sim.agents
  (:require [fantasia.dev.logging :as log]))

(log/log-debug "[AGENT]" "Agent has no job, will idle" (:id agent))
(log/log-info "[MEMORY]" "Created for agent" (:id agent))
```

## Proposed Solution

### 1. Audit All Instances

Create script to find all `println`/`prn`:

```bash
#!/bin/bash
# scripts/find-println.sh

echo "Finding println/prn instances in source..."
grep -rn "println\|prn" backend/src --include="*.clj" | \
  grep -v "fantasia.dev.logging" | \
  grep -v "log-" | \
  sort
```

Output format:
```
backend/src/fantasia/server.clj:354:(println (str "Fantasia backend..."
backend/src/fantasia/jobs.clj:109:(println "[JOB:CREATE]" ...
```

### 2. Categorize by Log Level

Create categorization guide:

| Current Usage | Recommended Level | Reason |
|--------------|------------------|--------|
| Startup messages | `log-info` | Normal operation, worth noting |
| Error conditions | `log-error` | Requires attention |
| Warnings | `log-warn` | Potential issues |
| Debugging info | `log-debug` | Detailed diagnostics |
| Per-tick operations | `log-debug` | High volume, filterable |

### 3. Replace Systematically

#### Add Logging Import

Ensure all files using logging have:

```clojure
(ns fantasia.sim.namespace
  (:require [fantasia.dev.logging :as log]
            ...))
```

#### Mapping Table

| From | To |
|------|----|
| `println "message"` | `(log/log-info "message")` |
| `prn "message"` | `(log/log-info "message")` |
| `println "error:" e` | `(log/log-error "error:" e)` |
| `println "warning:" w` | `(log/log-warn "warning:" w)` |
| `println "debug:" d` | `(log/log-debug "debug:" d)` |

#### Structured Logging

Where possible, use structured data:

**Before:**
```clojure
(println "[JOB:CREATE]" (json/generate-string job))
```

**After:**
```clojure
(log/log-info "[JOB:CREATE]"
            {:type (:type job)
             :id (:id job)
             :target (:target job)})
```

**Benefits:**
- Faster (no JSON generation)
- Parseable by log aggregators
- Consistent format

## Implementation Plan

### Phase 1: Audit and Categorize (Day 1)

1. **Run audit script:**
   ```bash
   bash scripts/find-println.sh > backend/logs/println-audit.txt
   ```

2. **Categorize each instance** by log level
3. **Create replacement plan** with file:line:level mapping

### Phase 2: Batch Replacement (Days 2-3)

#### Priority Order

1. **server.clj** (5 instances)
   - Startup logging: `log-info`
   - Client lifecycle: `log-info`
   - Error handling: `log-error`

2. **tick/core.clj** (4 instances)
   - Tick lifecycle: `log-debug`
   - Agent processing: `log-debug`

3. **jobs.clj** (8 instances)
   - Job creation: `log-info`
   - Job assignment: `log-info`
   - Job completion: `log-info`
   - Job errors: `log-warn`

4. **agents.clj** (3 instances)
   - Agent decisions: `log-debug`
   - Memory operations: `log-info`

5. **Other files** (12 instances)
   - Systematically replace by category

### Phase 3: Validation (Day 4)

1. **Verify no `println`/`prn` remain:**
   ```bash
   grep -r "println\|prn" backend/src --include="*.clj" | \
     grep -v "fantasia.dev.logging" | \
     grep -v "log-"
   ```

2. **Test logging levels:**
   ```bash
   # Test error logging
   LOG_LEVEL=0 clojure -M:server

   # Test info logging
   LOG_LEVEL=2 clojure -M:server

   # Test debug logging
   LOG_LEVEL=3 clojure -M:server
   ```

3. **Verify logs parse correctly:**
   - Check for consistent tag format
   - Verify structured data is JSON-valid
   - Confirm log level filtering works

## Testing

### Unit Tests

```clojure
(ns fantasia.dev.logging-test
  (:require [clojure.test :refer [deftest is testing]]
            [fantasia.dev.logging :as log]))

(deftest log-level-filtering
  (testing "debug logs not shown at info level"
    (with-redefs [log/current-level 2]  ;; INFO
      (is (nil? (log/should-log? :debug))))))

(deftest log-level-all
  (testing "error logs shown at error level"
    (with-redefs [log/current-level 0]  ;; ERROR
      (is (true? (log/should-log? :error)))))))
```

### Integration Tests

```clojure
(deftest server-uses-logging-module
  (testing "server uses log-* functions instead of println"
    (let [source (slurp "backend/src/fantasia/server.clj")]
      (is (nil? (re-find #"(?<!log-)\s+println" source)))
      (is (pos? (count (re-seq #"(log-log-info|log-log-error)" source)))))))
```

### Manual Testing

1. **Start server with different log levels:**
   ```bash
   LOG_LEVEL=0 clojure -M:server  # Only errors
   LOG_LEVEL=2 clojure -M:server  # Errors + info
   LOG_LEVEL=3 clojure -M:server  # All logs
   ```

2. **Trigger various operations:**
   - Connect/disconnect WebSocket clients
   - Create and complete jobs
   - Run simulation for 50 ticks
   - Place structures

3. **Verify log output:**
   - Consistent tag format (`[TAG] message`)
   - Correct filtering by level
   - Structured data is readable
   - No `println` output

## Definition of Done

### Code Changes
- [ ] All `println` instances replaced with `log-*` functions
- [ ] All `prn` instances replaced with `log-*` functions
- [ ] All files using logging have proper requires
- [ ] No direct `println`/`prn` in production code
- [ ] Consistent tag format across all logging

### Testing
- [ ] Audit script returns zero instances
- [ ] All existing tests still pass
- [ ] Log level filtering works correctly
- [ ] Structured logging produces parseable output
- [ ] Manual testing confirms all log levels work

### Documentation
- [ ] AGENTS.md updated with logging requirements
- [ ] LOGGING.md updated with examples
- [ ] New contributor guide includes logging best practices
- [ ] Pre-commit hook enforces logging module usage

### Validation
- [ ] `grep -r "println\|prn"` returns only logging module references
- [ ] clj-kondo linting passes
- [ ] Log aggregation tests parseable output
- [ ] Performance impact < 5% from structured logging

## Best Practices Guide

### When to Use Each Level

**log-error:**
- Exceptions that prevent core functionality
- Failed WebSocket connections
- Invalid simulation states
- Data corruption risks

**log-warn:**
- Recoverable errors
- Deprecated function calls
- Unexpected but non-fatal conditions
- Resource near limits

**log-info:**
- Normal operation milestones
- Server startup/shutdown
- Client connect/disconnect
- Job creation/completion
- Significant state changes

**log-debug:**
- Per-tick operations
- Agent decision details
- Job progress updates
- Pathfinding results
- Memory operations

### Structured Logging Guidelines

**DO:**
```clojure
(log/log-info "[JOB:CREATE]"
            {:type (:type job)
             :id (:id job)
             :priority (:priority job)})
```

**DON'T:**
```clojure
(log/log-info "[JOB:CREATE] type:" (:type job)
            "id:" (:id job)
            "priority:" (:priority job))
```

### Performance Considerations

**Avoid:**
- Excessive logging in hot paths (per-tick loops)
- Generating JSON for every log entry
- String concatenation for complex logs

**Prefer:**
- Deferred formatting (only format when log level enabled)
- Lazy evaluation of log data
- Log level checks before expensive operations

## Estimated Effort

- Audit and categorization: 2 hours
- Batch replacement: 12 hours
- Validation and testing: 4 hours
- Documentation updates: 2 hours

**Total: ~20 hours (2.5 days)**

## Related Issues

- ARCH-002: Add docstrings (document logging best practices)
- DEV-001: Add pre-commit hook for logging enforcement
- MONITOR-001: Set up log aggregation

## References

- Logging module: `backend/src/fantasia/dev/logging.clj`
- Environment configuration: `backend/deps.edn`
- Current logging usage: Search for `log-` in source
- AGENTS.md: Backend style guide

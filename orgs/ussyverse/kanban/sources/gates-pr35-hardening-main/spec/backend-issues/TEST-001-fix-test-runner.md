# SPEC: Fix Test Runner Configuration

**Issue ID:** TEST-001
**Severity:** Critical
**Category:** Testing Infrastructure
**Status:** Proposed
**Created:** 2026-01-22

---
Type: spec
Component: testing
Priority: critical
Status: proposed
Related-Issues: [4]
Milestone: 3.5
Estimated-Effort: 8 hours
---

## Problem Statement

Tests are not running. When executing `clojure -M:test`, the REPL starts but no tests execute:

```bash
$ cd backend && clojure -M:test
Clojure 1.12.2
user=>
```

Expected behavior:
```bash
$ cd backend && clojure -M:test
Testing fantasia.sim.core-test
Testing fantasia.sim.agents-test
...
Ran 32 tests, 0 failures
```

### Root Cause Analysis

#### Issue 1: Test Runner Alias Configuration

Current `deps.edn` test alias:
```clojure
:test
{:extra-paths ["test"]
 :extra-deps {io.github.cognitect-labs/test-runner
              {:git/tag "v0.5.1"
               :git/sha "dfb30dd6605cb6c0efc275e1df1736f6e90d4d73"}
              ring/ring-mock {:mvn/version "0.4.0"}}
 :exec-fn cognitect.test-runner.api/test}
```

Problems:
1. Uses deprecated test-runner library
2. No test selector (all vs namespace vs var)
3. No explicit namespace list
4. `:exec-fn` may not be compatible with current Clojure version

#### Issue 2: Test File Naming

Test files use inconsistent naming:

| Expected Pattern | Actual File | Status |
|-----------------|-------------|---------|
| `*_test.clj` | `spatial_facets__test.clj` | ❌ Double underscore |
| `*_test.clj` | `spatial-facets-test.clj` (in ns) | ❌ Dash vs underscore |
| `*_test.clj` | `test_eat_job_debug.clj` | ❌ In root dir |
| `*_test.clj` | `test_center.clj` | ❌ Not under test/ |

#### Issue 3: LSP Errors in Tests

```
ERROR [1:5] Namespace name does not match file name: fantasia.sim.spatial-facets-test
ERROR [11:18] fantasia.sim.spatial_facets/init-entity-facets! is called with 1 arg but expects 0
ERROR [33:23] fantasia.sim.ecs.core/create-stockpile is called with 2 args but expects 3
```

These prevent tests from compiling.

## Proposed Solution

### 1. Update deps.edn Test Configuration

Replace test-runner with modern test library:

```clojure
{:paths ["src"]
 :deps {org.clojure/clojure {:mvn/version "1.11.3"}
        http-kit/http-kit {:mvn/version "2.8.0"}
        metosin/reitit-ring {:mvn/version "0.7.2"}
        cheshire/cheshire {:mvn/version "5.13.0"}
        clj-http/clj-http {:mvn/version "3.12.3"}
        io.github.clojure/tools.build {:mvn/version "0.10.5"}
        brute/brute {:mvn/version "0.4.0"}
        nrepl/nrepl {:mvn/version "1.3.0"}}

 :aliases
 {:server
  {:main-opts ["-m" "fantasia.server"]}

  :watch-server
  {:exec-fn fantasia.dev.watch/watch-server}

  :test
  {:extra-paths ["test"]
   :extra-deps {lambdaisland/kaocha {:mvn/version "1.87.1377"}
                lambdaisland/kaocha-cloverage {:mvn/version "1.1.89"}}
   :main-opts ["-m" "kaocha.runner"]}

  :test-ns
  {:extra-paths ["test"]
   :extra-deps {lambdaisland/kaocha {:mvn/version "1.87.1377"}}
   :main-opts ["-m" "kaocha.runner"
               "--focus" "ns-pattern=fantasia\\.sim\\..+_test$"]}

  :test-watch
  {:extra-paths ["test"]
   :extra-deps {lambdaisland/kaocha {:mvn/version "1.87.1377"}
                lambdaisland/kaocha-clj {:mvn/version "0.0-71"}}
   :main-opts ["-m" "kaocha.runner" "--watch"]
   :exec-args ["--plugin" "kaocha.plugin/clojure"]}

  :coverage
  {:extra-paths ["test"]
   :extra-deps {lambdaisland/kaocha {:mvn/version "1.87.1377"}
                lambdaisland/kaocha-cloverage {:mvn/version "1.1.89"}}
   :main-opts ["-m" "kaocha.runner" "--plugin" "cloverage"]}}}
```

### 2. Create Kaocha Configuration

Create `backend/tests.edn`:

```edn
#kaocha/v1
{:tests [{:id :unit
          :pattern ^"test/fantasia/.*_test\\.clj$"
          :source-paths ["src"]
          :test-paths ["test"]}

         {:id :integration
          :pattern ^"test/fantasia/sim/ecs/.*_test\\.clj$"
          :source-paths ["src"]
          :test-paths ["test"]}]

 :reporter [kaocha.report/documentation
            kaocha.report/fail-fast]

 :fail-fast? false
 :color? true

 :plugins [kaocha.plugin/cloverage]
 :cloverage/opts {:lcov? true
                  :html? true
                  :output-dir "coverage"}}
```

### 3. Fix Test File Naming

Rename files to match convention:

```bash
# Fix spatial_facets test
mv backend/test/fantasia/sim/spatial_facets__test.clj \
   backend/test/fantasia/sim/spatial_facets_test.clj

# Update namespace in file
sed -i 's/fantasia.sim.spatial-facets-test/fantasia.sim.spatial_facets-test/g' \
    backend/test/fantasia/sim/spatial_facets_test.clj

# Move root test files to proper location
mv backend/test_eat_job_debug.clj backend/test/eat_job_debug_test.clj
mv backend/test_eat_simulation.clj backend/test/eat_simulation_test.clj
mv backend/test_social.clj backend/test/social_test.clj
mv backend/test_voice_compilation.clj backend/test/voice_compilation_test.clj
mv backend/test_voices.clj backend/test/voices_test.clj
mv backend/test_wildlife_voice.clj backend/test/wildlife_voice_test.clj
mv backend/test_center.clj backend/test/center_test.clj
```

### 4. Fix Test Namespace Errors

#### Fix spatial_facets_test.clj

**Before:**
```clojure
(ns fantasia.sim.spatial-facets-test
  (:require [fantasia.sim.spatial_facets :as sf]))

;; Line 11 - Wrong number of arguments
(sf/init-entity-facets! world)
```

**After:**
```clojure
(ns fantasia.sim.spatial_facets_test
  (:require [fantasia.sim.spatial_facets :as sf]
            [clojure.test :refer [deftest is testing]]))

(deftest init-entity-facets
  (testing "initializes entity facets correctly"
    (let [world {}]
      (is (map? (sf/init-entity-facets! world))))))
```

#### Fix comprehensive_test.clj

**Before:**
```clojure
;; Line 33 - Wrong number of arguments
(ecs/create-stockpile world pos)
```

**After:**
```clojure
(deftest create-stockpile
  (testing "creates stockpile with correct parameters"
    (let [world {}
          pos [5 5]
          resource :wood
          max-qty 120]
      (is (map? (ecs/create-stockpile world pos resource max-qty))))))
```

### 5. Add Test Runner Scripts

Create `backend/bin/test`:
```bash
#!/bin/bash
cd "$(dirname "$0")/.."
clojure -M:test "$@"
```

Create `backend/bin/test-watch`:
```bash
#!/bin/bash
cd "$(dirname "$0")/.."
clojure -M:test-watch "$@"
```

Make executable:
```bash
chmod +x backend/bin/test backend/bin/test-watch
```

## Test Execution Examples

### Run all tests
```bash
cd backend
clojure -M:test
# or
./bin/test
```

### Run specific namespace
```bash
clojure -M:test --focus fantasia.sim.core_test
```

### Run specific test
```bash
clojure -M:test --focus fantasia.sim.core_test/initial-world-structure
```

### Run tests in watch mode
```bash
clojure -M:test-watch
```

### Run with coverage
```bash
clojure -M:coverage
```

## Test Organization Standards

### File Naming
- Must follow pattern: `*_test.clj` (single underscore)
- Must mirror source namespace exactly
- Namespace name must match file name

### Namespace Declaration
```clojure
(ns fantasia.sim.namespace_test
  (:require [clojure.test :refer [deftest is testing]]
            [fantasia.sim.namespace :as ns-under-test]))

;; Correct: fantasia.sim.namespace_test
;; Incorrect: fantasia.sim.namespace-test (dash)
;; Incorrect: fantasia.sim.namespace__test (double underscore)
```

### Test Structure
```clojure
(deftest function-name-test
  (testing "what is being tested"
    (is (= expected (actual)))))

(deftest edge-case-test
  (testing "edge case description"
    (is (thrown? ExceptionType (error-fn)))))
```

## Pre-commit Test Hook

Create `.git/hooks/pre-commit`:
```bash
#!/bin/bash

echo "Running tests..."
cd backend

clojure -M:test --fail-fast

if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Commit aborted."
  exit 1
fi

echo "✅ All tests passed"
exit 0
```

Make executable:
```bash
chmod +x .git/hooks/pre-commit
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/test.yml`:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Clojure
        uses: actions/setup-clojure@v1
        with:
          java-version: '17'

      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: |
            ~/.m2/repository
            ~/.gitlibs
            ~/.clojure
          key: ${{ runner.os }}-clojure-${{ hashFiles('**/deps.edn') }}

      - name: Run tests
        run: |
          cd backend
          clojure -M:test

      - name: Generate coverage
        run: |
          cd backend
          clojure -M:coverage

      - name: Upload coverage
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: backend/coverage/
```

## Definition of Done

### Infrastructure
- [ ] `deps.edn` test aliases updated to use Kaocha
- [ ] `tests.edn` configuration file created
- [ ] Test runner scripts created and executable
- [ ] Pre-commit hook installed

### Code Fixes
- [ ] All test files follow `*_test.clj` naming convention
- [ ] All namespace names match file names
- [ ] All test files compile without errors
- [ ] All test namespaces declared correctly
- [ ] All function call signatures corrected

### Execution
- [ ] `clojure -M:test` runs all tests successfully
- [ ] `clojure -M:test --focus` works for namespace filtering
- [ ] `clojure -M:test-watch` works for watch mode
- [ ] `clojure -M:coverage` generates coverage report

### Validation
- [ ] All existing tests pass
- [ ] No LSP errors in test files
- [ ] `clj-kondo` linting passes on test files
- [ ] CI/CD pipeline runs tests on every commit

### Documentation
- [ ] TESTING.md updated with Kaocha usage
- [ ] AGENTS.md updated with test standards
- [ ] README.md includes test commands
- [ ] CONTRIBUTING.md includes pre-commit hook info

## Test Coverage Goals

### Minimum Coverage (Phase 1)
- Core logic: 80%
- Server handlers: 70%
- Job system: 75%
- ECS layer: 85%

### Target Coverage (Phase 2)
- All code: 85%
- Public APIs: 95%
- Critical paths: 100%

## Troubleshooting Guide

### Issue: Tests don't run
**Symptoms:** REPL starts but no tests execute

**Solution:**
1. Check `:main-opts` in `deps.edn` test alias
2. Verify Kaocha dependency is installed
3. Check `tests.edn` syntax

### Issue: Namespace not found
**Symptoms:** Error loading test namespace

**Solution:**
1. Verify namespace name matches file name
2. Check file is under `test/` directory
3. Verify `:extra-paths ["test"]` in deps.edn

### Issue: Function signature mismatch
**Symptoms:** "is called with X args but expects Y"

**Solution:**
1. Check source function signature
2. Update test to match current API
3. Run `clojure -M:test --focus <namespace>` for faster iteration

## Estimated Effort

- Update deps.edn: 0.5 hours
- Create tests.edn: 0.5 hours
- Fix test file names: 1 hour
- Fix namespace errors: 2 hours
- Create test runner scripts: 0.5 hours
- Setup pre-commit hook: 0.5 hours
- Create CI/CD pipeline: 1 hour
- Test and validate: 1 hour
- Documentation updates: 1 hour

**Total: ~8 hours**

## Related Issues

- ARCH-002: Add docstrings (helps with tests)
- PERF-001: Cache computed values (performance tests)
- SECURITY-001: Input validation (security tests)

## References

- Kaocha documentation: https://cljdoc.org/d/lambdaisland/kaocha
- Current test runner: https://github.com/cognitect-labs/test-runner
- Clojure test conventions: https://clojure.org/guides/test
- Linting config: `backend/.clj-kondo/config.edn`

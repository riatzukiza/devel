# Backend Issue Specifications

**Generated:** 2026-01-22
**Review Date:** 2026-01-22
**Review Scope:** Backend Clojure codebase

## Overview

This directory contains detailed specifications for each issue identified in the backend code review. Each spec includes:

- Problem statement with code examples
- Root cause analysis
- Proposed solution with implementation details
- Testing requirements
- Definition of done
- Risk assessment
- Estimated effort

## Issue Index

### Critical Issues (Immediate Action Required)

| ID | Title | GitHub Issue | File | Severity | Status |
|----|-------|---------------|------|-----------|---------|
| CRITICAL-001 | Implement stub function query-need-axis! | [#31](https://github.com/octave-commons/gates-of-aker/issues/31) | agents.clj:267-271 | Critical | Proposed |
| TEST-001 | Fix test runner configuration | [#30](https://github.com/octave-commons/gates-of-aker/issues/30) | deps.edn | Critical | Proposed |
| SECURITY-001 | Add input validation middleware | [#29](https://github.com/octave-commons/gates-of-aker/issues/29) | server.clj:166-301 | Critical | Proposed |

### Architecture Issues

| ID | Title | GitHub Issue | File | Severity | Status |
|----|-------|---------------|------|-----------|---------|
| ARCH-001 | Split jobs.clj into separate files | [#27](https://github.com/octave-commons/gates-of-aker/issues/27) | jobs.clj (1274 lines) | Medium | Proposed |
| ARCH-002 | Add docstrings to all public functions | [#28](https://github.com/octave-commons/gates-of-aker/issues/28) | Multiple files | Low | Proposed |

### Performance Issues

| ID | Title | GitHub Issue | File | Severity | Status |
|----|-------|---------------|------|-----------|---------|
| PERF-001 | Remove or document unused BFS in pathing.clj | [#33](https://github.com/octave-commons/gates-of-aker/issues/33) | pathing.clj:7-41 | Low | Proposed |

### Style Issues

| ID | Title | GitHub Issue | File | Severity | Status |
|----|-------|---------------|------|-----------|---------|
| STYLE-001 | Replace magic numbers with constants | [#32](https://github.com/octave-commons/gates-of-aker/issues/32) | Multiple files | Medium | Proposed |

### Logging Issues

| ID | Title | GitHub Issue | File | Severity | Status |
|----|-------|---------------|------|-----------|---------|
| LOGGING-001 | Replace println/prn with logging module | [#34](https://github.com/octave-commons/gates-of-aker/issues/34) | Multiple files | Low | Proposed |

## Implementation Priority

### Phase 1: Critical Fixes (Week 1)

**Must complete before other work:**

1. **TEST-001**: Fix test runner configuration
   - Blocker: Cannot run any tests
   - Dependencies: None
   - Effort: 8 hours

2. **SECURITY-001**: Add input validation middleware
   - Blocker: Security vulnerability
   - Dependencies: TEST-001 (to test validation)
   - Effort: 20.5 hours

3. **CRITICAL-001**: Implement stub function query-need-axis!
   - Blocker: Feature incomplete
   - Dependencies: None
   - Effort: 19 hours

**Phase 1 Total: ~47 hours (1.5 weeks)**

### Phase 2: Architecture Improvements (Week 2-3)

4. **ARCH-001**: Split jobs.clj into separate files
   - Prerequisite: None
   - Effort: 13 hours

5. **ARCH-002**: Add docstrings to all public functions
   - Prerequisite: ARCH-001 (docs need to follow split)
   - Effort: 32 hours

**Phase 2 Total: ~45 hours (1 week)**

### Phase 3: Code Quality (Week 4)

 6. **STYLE-001**: Replace magic numbers with constants
    - Prerequisite: None
    - Effort: 30 hours

 7. **PERF-001**: Remove or document unused BFS
    - Prerequisite: STYLE-001 (may need to check for constants)
    - Effort: 3.5 hours

 8. **LOGGING-001**: Replace println/prn with logging module
    - Prerequisite: None
    - Effort: 20 hours

**Phase 3 Total: ~53.5 hours (1.3 weeks)**

## Dependencies Graph

```
CRITICAL-001 (implement query-need-axis!)
    ↓
    ↓ (depends on facet system)
    ↓

SECURITY-001 (input validation)
    ↓
    ↓ (depends on test runner to test)
    ↓
TEST-001 (fix test runner)
    ↓
    ↓ (blocker for all other testing)
    ↓

ARCH-001 (split jobs.clj)
    ↓
    ↓ (prerequisite for ARCH-002)
    ↓

ARCH-002 (add docstrings)
    ↓
    ↓ (can start after ARCH-001)
    ↓

STYLE-001 (replace magic numbers)
    ↓
    ↓ (independent of others)
    ↓

PERF-001 (remove unused BFS)
    ↓
    ↓ (independent of others)
    ↓
```

## Risk Matrix

| Issue | Risk Level | Impact | Probability | Mitigation |
|-------|-----------|---------|--------------|-------------|
| CRITICAL-001 | High | High | Medium | Existing tests should catch errors |
| TEST-001 | High | High | Low | Straightforward config fix |
| SECURITY-001 | High | High | Medium | Comprehensive validation testing |
| ARCH-001 | Medium | Medium | Low | Re-export layer for backward compat |
| ARCH-002 | Low | Low | Low | Pure addition, no behavior change |
| STYLE-001 | Medium | Medium | Low | Tests ensure no behavior change |
| PERF-001 | Low | Low | Low | Git history preserves code |

## Effort Summary

| Phase | Issues | Total Effort | Duration |
|-------|---------|--------------|----------|
| Phase 1: Critical | 3 issues | 47 hours | 1.5 weeks |
| Phase 2: Architecture | 2 issues | 45 hours | 1 week |
| Phase 3: Code Quality | 3 issues | 53.5 hours | 1.3 weeks |
| **Total** | **8 issues** | **145.5 hours** | **3.8 weeks** |

## Success Metrics

### Code Quality
- [ ] 100% docstring coverage for public functions
- [ ] 0 magic numbers in production code
- [ ] All files < 500 lines (except test files)
- [ ] No unused functions in production code

### Testing
- [ ] All tests run with `clojure -M:test`
- [ ] Test coverage > 80% for core code
- [ ] All critical paths have integration tests

### Security
- [ ] All WebSocket ops validated
- [ ] Rate limiting active
- [ ] No unbounded numeric inputs
- [ ] All errors handled gracefully

### Performance
- [ ] Tick time < 100ms for 50 agents
- [ ] Pathfinding < 10ms for typical queries
- [ ] No memory leaks in long-running simulations

## Validation Checklist

### Before Marking Issue Complete
- [ ] Spec requirements fully met
- [ ] All tests pass
- [ ] Manual smoke test successful
- [ ] No regressions detected
- [ ] Documentation updated
- [ ] Code reviewed and approved

### Before Marking Phase Complete
- [ ] All issues in phase completed
- [ ] Integration tests pass
- [ ] Performance benchmarks stable
- [ ] Documentation complete
- [ ] Git branch ready for merge

### Before Marking Project Complete
- [ ] All phases completed
- [ ] Full test suite passes
- [ ] Manual QA successful
- [ ] Performance goals met
- [ ] Documentation comprehensive
- [ ] Code review approved by maintainers

## Issue Files

Each issue has a detailed spec file:

- [CRITICAL-001](./CRITICAL-001-implement-query-need-axis.md) - Implement stub function query-need-axis!
- [SECURITY-001](./SECURITY-001-input-validation.md) - Add input validation middleware
- [ARCH-001](./ARCH-001-split-jobs-clj.md) - Split jobs.clj into separate files
- [ARCH-002](./ARCH-002-add-docstrings.md) - Add docstrings to all public functions
- [TEST-001](./TEST-001-fix-test-runner.md) - Fix test runner configuration
- [STYLE-001](./STYLE-001-magic-numbers.md) - Replace magic numbers with constants
- [PERF-001](./PERF-001-remove-unused-bfs.md) - Remove or document unused BFS

## References

- [Backend Code Review Report](../backend-code-review-2026-01-22.md)
- [AGENTS.md](../../AGENTS.md) - Backend style guide
- [TESTING.md](../../TESTING.md) - Testing guidelines
- [API_DOCUMENTATION.md](../../backend/API_DOCUMENTATION.md) - API documentation
- [deps.edn](../../backend/deps.edn) - Dependencies and aliases

## Notes

1. **Effort estimates** are conservative. Actual time may vary based on:
   - Developer familiarity with codebase
   - Unexpected complications
   - Code review cycle time
   - Testing infrastructure setup

2. **Phases** can overlap where dependencies allow:
   - STYLE-001 can start in parallel with Phase 2
   - ARCH-002 can begin once ARCH-001 files are created

3. **Risks** should be reassessed as work progresses:
   - New issues may be discovered
   - Dependencies may change
   - Priorities may shift based on project needs

4. **Success metrics** should be tracked:
   - Test coverage trends
   - Performance benchmarks over time
   - Code quality metrics (clj-kondo warnings)
   - Bug reports and regressions

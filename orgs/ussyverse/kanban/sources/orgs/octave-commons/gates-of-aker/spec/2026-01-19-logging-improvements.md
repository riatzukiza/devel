# Logging and Testing Improvements

## Problem
- Coverage reporting is too verbose and slowing down development
- No control over `println` statements in backend during testing
- No control over `console.log` statements in frontend during testing
- Test runs produce excessive output

## Requirements

### Backend (Clojure)
- Add environment variable `LOG_LEVEL` to control logging output
- Replace direct `println` calls with a logging utility
- Levels: `error`, `warn`, `info`, `debug`
- Default to `warn` during tests
- Reduce cloverage verbosity

### Frontend (TypeScript/React)
- Add environment variable `VITE_LOG_LEVEL` to control console output
- Replace `console.log` with a logging utility during tests
- Levels: `error`, `warn`, `info`, `debug`
- Default to `warn` during tests
- Reduce Vitest coverage verbosity

### Coverage Reporting
- Backend: Use quiet mode for cloverage
- Frontend: Configure vitest to only show summary, not file-by-file output
- Add `--silent` or `--quiet` options for quick feedback

## Implementation Plan

### Phase 1: Backend Logging Utility
1. Create `backend/src/fantasia/dev/logging.clj`
2. Add functions: `log-error`, `log-warn`, `log-info`, `log-debug`
3. Read `LOG_LEVEL` from environment (default: "warn")
4. Update `println` calls in production code to use logging utility

### Phase 2: Backend Coverage Configuration
1. Update `backend/src/fantasia/dev/coverage.clj` to add quiet options
2. Update deps.edn coverage alias to include quiet flag
3. Test coverage reporting with reduced output

### Phase 3: Frontend Logging Utility
1. Create `web/src/test-utils/logger.ts`
2. Add functions matching backend levels
3. Read `VITE_LOG_LEVEL` from environment (default: "warn")
4. Mock console methods in test setup

### Phase 4: Frontend Coverage Configuration
1. Update `web/vite.config.ts` to reduce coverage verbosity
2. Change coverage reporter to only show summary
3. Add `--reporter=verbose` for detailed output when needed

### Phase 5: Update Package Scripts
1. Add test scripts with log level control
2. Add quiet test scripts
3. Add verbose coverage scripts when needed

### Phase 6: Documentation
1. Update AGENTS.md with new logging controls
2. Document environment variables
3. Document test script options

## Definition of Done
- [x] Backend has logging utility with `LOG_LEVEL` support
- [x] Backend coverage runs in quiet mode by default
- [x] Frontend has logging utility with `VITE_LOG_LEVEL` support
- [x] Frontend coverage shows only summary by default
- [x] Package scripts support quiet/verbose modes
- [x] Documentation updated with new options
- [x] Existing tests still pass
- [x] Coverage still generated correctly

## Files to Modify
- `backend/src/fantasia/dev/logging.clj` (new)
- `backend/src/fantasia/dev/coverage.clj`
- `backend/deps.edn`
- `web/src/test-utils/logger.ts` (new)
- `web/src/setupTests.ts`
- `web/vite.config.ts`
- `web/package.json`
- `AGENTS.md`

## Environment Variables
- `LOG_LEVEL` - Backend logging level (error|warn|info|debug)
- `VITE_LOG_LEVEL` - Frontend logging level (error|warn|info|debug)

## Change Log
### 2026-01-19
- Created `backend/src/fantasia/dev/logging.clj` with environment-based logging
- Updated `backend/src/fantasia/dev/coverage.clj` for quiet coverage output
- Created `web/src/test-utils/logger.ts` for frontend logging utilities
- Updated `web/src/setupTests.ts` to control console output during tests
- Updated `web/vite.config.ts` to use `text-summary` reporter instead of verbose `text`
- Updated `web/package.json` with new test scripts (`test:quiet`, `test:debug`, `test:coverage:verbose`)
- Updated `AGENTS.md` with logging control documentation

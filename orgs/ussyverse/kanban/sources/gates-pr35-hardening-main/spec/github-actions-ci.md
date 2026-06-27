# GitHub Actions CI/CD Configuration

## Overview

This document specifies the GitHub Actions workflows configured for the Fantasia project, providing automated testing, linting, and build verification for both frontend and backend components.

## Workflow Files

### 1. `frontend.yml`
**Purpose**: Isolated frontend testing and building
**Triggers**: 
- Push to main/develop branches with `web/**` changes
- Pull requests to main/develop branches with `web/**` changes

**Matrix Testing**:
- Node.js versions: 18.x, 20.x

**Steps**:
1. Checkout code
2. Setup Node.js with npm cache
3. Install dependencies (`npm ci`)
4. Type checking (`npm run typecheck`)
5. Run unit tests (excludes E2E tests)
6. Run tests with coverage
7. Build production bundle
8. Upload coverage to Codecov

### 2. `backend.yml`
**Purpose**: Isolated backend testing and linting
**Triggers**:
- Push to main/develop branches with `backend/**` changes  
- Pull requests to main/develop branches with `backend/**` changes

**Matrix Testing**:
- Java versions: 17, 21

**Steps**:
1. Checkout code
2. Setup Java with Maven cache
3. Setup Clojure CLI
4. Cache Clojure dependencies
5. Install dependencies (`clojure -P`)
6. Install clj-kondo for linting
7. Run linting (`clojure -X:lint`)
8. Run tests (`clojure -X:test`)
9. Generate coverage report
10. Upload coverage to Codecov

### 3. `fullstack.yml`
**Purpose**: End-to-end integration testing
**Triggers**:
- Push to main/develop branches (any changes)
- Pull requests to main/develop branches (any changes)

**Jobs**:
- **backend**: Runs backend linting and tests
- **frontend**: Runs frontend type checking, tests, and build
- **integration**: Runs WebSocket E2E tests (requires both backend and frontend success)

**Integration Steps**:
1. Setup both Java/Node.js environments
2. Install all dependencies with caching
3. Start backend server on localhost:3000
4. Wait for health check endpoint
5. Run WebSocket E2E tests
6. Cleanup processes

### 4. `ci.yml`
**Purpose**: Smart CI that only runs affected stacks
**Triggers**:
- Push to main/develop branches (any changes)
- Pull requests to main/develop branches (any changes)

**Conditional Logic**:
- Runs backend job only if `backend/**` files changed
- Runs frontend job only if `web/**` files changed

## Technical Configuration

### Caching Strategy
- **Backend**: Maven repository (`~/.m2/repository`) and gitlibs cache
- **Frontend**: npm dependencies via `web/package-lock.json`
- **Full Stack**: Combined caching for both ecosystems

### Dependencies
- **Java**: Temurin distribution via `actions/setup-java@v4`
- **Node.js**: Official setup action with npm caching
- **Clojure CLI**: DeLaGuardo setup action
- **clj-kondo**: Direct binary download for linting

### Testing Commands
All commands mirror local development as specified in `TESTING.md`:

**Backend**:
- Linting: `clojure -X:lint` (via `backend/src/fantasia/dev/lint.clj`)
- Tests: `clojure -X:test` (via cognitect test-runner)
- Coverage: `clojure -X:coverage`

**Frontend**:
- Type check: `npm run typecheck`
- Tests: `npm test -- --exclude src/__tests__/e2e/**`
- Coverage: `npm run test:coverage`
- Build: `npm run build`

### Error Handling
- Linting failures show warnings but don't fail CI (current code has existing issues)
- Test failures immediately fail the workflow
- Integration tests run only if both stacks pass individually
- WebSocket E2E tests require running backend with health check

## Coverage Integration
- Backend coverage: LCOV format at `backend/target/coverage/lcov.info`
- Frontend coverage: LCOV format at `web/coverage/lcov.info`
- Flags: `backend` and `frontend` for separate tracking
- Upload via `codecov/codecov-action@v4`

## Known Issues & Temporary Workarounds

### Backend Linting
- Current codebase has 215+ warnings and 14 errors
- Linting configured to show output but not fail CI
- Separate cleanup needed for code quality

### Frontend E2E Tests
- WebSocket E2E tests require running backend
- Excluded from isolated frontend workflows
- Only run in fullstack integration job

### Syntax Errors Fixed
- Fixed bracket mismatches in test files:
  - `test/fantasia/server/network_test.clj`
  - `test/fantasia/test_helpers.clj`
- Fixed Java ServerSocket usage in test helpers
- Renamed `test-helpers.clj` to `test_helpers.clj` for namespace consistency

## Future Enhancements

### Immediate
1. Fix backend linting errors and make linting fail CI
2. Add frontend ESLint configuration
3. Add Docker image building and deployment
4. Add release automation

### Longer-term
1. Performance regression testing
2. Security vulnerability scanning
3. Integration with external services
4. Multi-environment deployment pipelines

## Maintenance

- Update action versions regularly
- Monitor coverage trends via Codecov
- Review test execution times and optimize caching
- Update matrix versions when new LTS releases are available
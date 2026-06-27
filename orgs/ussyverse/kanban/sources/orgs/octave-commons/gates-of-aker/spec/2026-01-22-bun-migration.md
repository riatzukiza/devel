# Bun Migration Strategy

## Document Status
**Created:** 2026-01-22
**Status:** Draft
**Owner:** Migration Plan

## Executive Summary

Migrate the `web/` frontend from npm to Bun for package management and runtime operations while keeping Vitest for testing. The backend (Clojure) remains unchanged but will benefit from unified command patterns across the repo.

**Key Decisions:**
- **Package Manager:** npm → Bun
- **Test Runner:** Keep Vitest (no test code changes required)
- **Docker:** Use official `oven-sh/bun` image
- **Type Checking:** Keep `tsc -b` (Bun doesn't replace TypeScript compiler)

---

## Current State Analysis

### Frontend (`web/`)

**File:** `web/package.json:1-37`

**Current Scripts:**
```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:quiet": "vitest run --silent",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:coverage:verbose": "vitest run --coverage --reporter=verbose",
  "test:debug": "VITE_LOG_LEVEL=debug vitest run",
  "compose:up": "docker compose up --build -d",
  "compose:down": "docker compose down",
  "test:e2e": "npm run compose:up && node e2e/compose.e2e.mjs; npm run compose:down || npm run compose:down"
}
```

**Dependencies:**
- Runtime: React 19, react-dom 19
- Dev: Vitest 2.1.5, TypeScript 5.7.0, Vite 6.0.0
- Testing: @testing-library/* 6.x-16.x, jsdom 24.1.0

**TypeScript Config:** `web/tsconfig.json:1-33`
- Target: ES2022
- Strict mode enabled
- Build info: `node_modules/.cache/tsc/tsbuildinfo`

**Vite Config:** `web/vite.config.ts:1-22`
- Port: 5173
- Test environment: jsdom
- Coverage: v8 provider

**Docker:** `compose.yaml:19-36`
- Image: `node:20-bullseye`
- Command: `npm install && npm run dev -- --host 0.0.0.0 --port 5173`

### Backend (`backend/`)

**Clojure configuration:** `backend/deps.edn:1-28`
- No JavaScript/TypeScript files
- Uses `cognitect.test-runner.api/test` for tests
- Uses `cloverage` for coverage

**No changes required** - backend remains pure Clojure.

---

## Bun Capabilities Research Summary

Based on 2026 research:

### Why Bun in 2026
- **Performance:** 10-20x faster install times, 2-3x faster test execution
- **All-in-one:** Package manager + bundler + test runner + runtime
- **NPM Compatibility:** Full compatibility with npm registry and lockfile
- **Active Development:** Backed by Anthropic (acquired late 2025)

### Key Features for This Project
1. **Package Management:** Drop-in replacement for npm commands
2. **Runtime:** Can run Node.js scripts (E2E tests, utilities)
3. **Test Runner:** Jest-compatible API (we're keeping Vitest, but option available)
4. **Bundler:** Vite remains our bundler (Bun bundler is good but Vite has React-specific optimizations)

### Limitations
- Bun does **not** replace TypeScript compiler (`tsc`) - we keep `tsc -b`
- Bun test runner is Jest-compatible but Vitest has better React/Testing Library integration
- jsdom support in bun:test is experimental - Vitest's jsdom integration is proven

---

## Migration Strategy

### Phase 1: Core Migration (Low Risk)
Replace npm with Bun for package management and basic scripts.

**Scope:**
- Install Bun locally
- Replace `npm install` → `bun install`
- Replace `npm run` → `bun run`
- Keep all existing scripts in `package.json`

**Changes:**
1. Add `bun.lockb` (Bun lockfile)
2. Remove `package-lock.json` (npm lockfile)
3. Update `README.md` with Bun commands

**Rollback:** Simple - just use `npm install` again (lockfiles coexist)

### Phase 2: Docker Integration
Update Docker Compose to use Bun image.

**Scope:**
- Change `web` service image from `node:20-bullseye` to `oven-sh/bun:latest` or `oven-sh/bun:base`
- Update command to use `bun install && bun run dev`
- Verify node_modules volume mount works correctly

**Changes to `compose.yaml`:**
```yaml
web:
  image: oven-sh/bun:latest
  working_dir: /app/web
  command: sh -c "bun install && bun run dev -- --host 0.0.0.0 --port 5173"
```

### Phase 3: Enhanced Scripting
Leverage Bun's performance for faster operations.

**Enhanced Scripts:**
- Keep all existing npm-style scripts (works with `bun run`)
- Add Bun-specific shortcuts if needed (e.g., `bun test` vs `bun run test`)

### Phase 4: Root-Level Orchestration (Optional)
Create root-level convenience scripts that use Bun for frontend tasks.

**Files to Create:**
- `package.json` at root (Bun-managed)
- Root scripts: `bun run web:test`, `bun run web:build`, etc.

**Backend scripts remain:** `clojure -M:test`, `clojure -X:coverage` (unchanged)

---

## Definition of Done

### Phase 1 - Core Migration
- [x] Bun installed and verified (`bun --version` = 1.3.0)
- [x] `bun install` completes successfully in `web/`
- [x] All `bun run` commands work:
  - [x] `bun run dev` starts Vite dev server
  - [x] `bun run build` completes type check and build (1.6s)
  - [x] `bun run test` runs all tests (4.4s, 115 tests)
  - [ ] `bun run test:coverage` generates coverage report (infinite loop issue - skipped)
  - [x] `bun run test:e2e` runs E2E tests with compose
- [x] `package-lock.json` removed
- [x] `bun.lockb` created
- [x] README.md updated with Bun commands

### Phase 2 - Docker Integration
- [x] `compose.yaml` updated to use `oven/bun` image
- [x] `docker compose up` pulls and starts Bun image successfully
- [ ] Hot reload works in container environment (not tested - port 3000 conflict)
- [ ] Backend + frontend inter-service communication verified via Docker
- [x] E2E test suite passes via local Bun

### Phase 3 - Enhanced Scripting
- [x] All existing scripts run unchanged
- [x] Performance benchmarks documented (install time, test time)
- [ ] CI/CD (if any) updated to use Bun

### Phase 4 - Root Orchestration (Optional)
- [ ] Root `package.json` created (not implemented)
- [ ] Cross-stack scripts work (e.g., `bun run:all-tests`)
- [ ] Documentation updated for root-level commands

---

## Implementation Checklist

### Pre-Migration Prep
- [ ] Create backup branch: `git checkout -b bun-migration-backup`
- [ ] Document current npm install time: `time npm install`
- [ ] Document current test time: `time npm run test`

### Phase 1 Execution
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version

# Install dependencies
cd web
bun install

# Test all commands
bun run dev    # Start dev server (Ctrl+C to stop)
bun run build  # Build production bundle
bun run test   # Run tests
bun run test:coverage  # Check coverage

# Archive old lockfile
mv package-lock.json package-lock.json.backup
git add bun.lockb
git commit -m "chore: migrate to bun package manager"
```

### Phase 2 Execution
```bash
# Update compose.yaml
# Edit: web service → image: oven-sh/bun:latest
# Edit: web service → command: "bun install && bun run dev -- --host 0.0.0.0 --port 5173"

# Test Docker
docker compose up --build
# Verify both services start
# Run e2e test
docker compose down
```

### Phase 3 Documentation Updates
- [ ] Update `README.md:23-26` with Bun install instructions
- [ ] Update `README.md:35-37` with Bun dev/build commands
- [ ] Update `compose.yaml:22` command reference
- [ ] Update `AGENTS.md` if relevant

---

## Backend Integration Notes

### Type Checking
**No changes needed.** Backend is Clojure - no TypeScript.

### Testing
**No changes needed.** Backend uses:
- `clojure -M:test` (cognitect test-runner)
- `clojure -X:coverage` (cloverage)

These remain unchanged. The migration is purely frontend-focused.

### Cross-Stack Orchestration (Future Enhancement)
After Phase 4 completion, consider creating root-level scripts:

**Root `package.json` (optional):**
```json
{
  "name": "fantasia-root",
  "private": true,
  "scripts": {
    "web:install": "cd web && bun install",
    "web:dev": "cd web && bun run dev",
    "web:build": "cd web && bun run build",
    "web:test": "cd web && bun run test",
    "backend:test": "cd backend && clojure -M:test",
    "backend:coverage": "cd backend && clojure -X:coverage",
    "test:all": "bun run backend:test && bun run web:test",
    "dev:all": "docker compose up"
  }
}
```

This allows unified commands like `bun run test:all` without touching Clojure.

---

## Risk Assessment

### Low Risk
- Bun has full npm compatibility
- Package manager is swappable without code changes
- Lockfiles can coexist (easy rollback)
- Vitest unchanged (no test code impact)

### Medium Risk
- Docker image change requires verification
- Bun lockfile format is binary (not human-readable like package-lock.json)
- New ecosystem patterns for developers

### Mitigation
- Keep backup branch
- Document npm fallback commands
- Test Docker thoroughly before merging
- Measure performance to justify change

---

## Performance Benchmarks

### Baseline (Pre-Migration)
**Documented 2026-01-22:**
- `npm install` time: 12.3s (202 packages)
- `npm run test` time: Not measured (measured via Bun instead)
- `npm run build` time: Not measured (measured via Bun instead)

### Post-Migration (Actual)
**Measured 2026-01-22:**
- `bun install`: 13.4s (392 packages) - slightly slower but cached dependencies from previous npm install
- `bun run test`: 4.4s (115 tests, 16 test files) - runs via Vitest
- `bun run build`: 1.6s (tsc -b + vite build)

**Note:** First Bun install creates `bun.lockb`. Subsequent installs are significantly faster.

---

## Open Questions

1. **CI/CD Integration:** Does this project have GitHub Actions or other CI? (Need to update workflows)
2. **Deployment:** Is there a production build step? (Verify deployment uses same tooling)
3. **Team Onboarding:** Does team need Bun installation guide?

---

## References

- Bun Documentation: https://bun.com
- Bun Test Migration Guide: https://bun.com/docs/guides/test/migrate-from-jest
- Bun TypeScript Guide: https://bun.com/docs/guides/runtime/typescript
- Docker Hub - Bun: https://hub.docker.com/r/oven-sh/bun
- Current Project Files:
  - `web/package.json`
  - `web/tsconfig.json`
  - `web/vite.config.ts`
  - `backend/deps.edn`
  - `compose.yaml`
  - `README.md`

---

## Appendix: Command Reference

### npm → Bun Command Mapping

| Old Command | New Command |
|------------|-------------|
| `npm install` | `bun install` |
| `npm run dev` | `bun run dev` |
| `npm run build` | `bun run build` |
| `npm run test` | `bun run test` |
| `npm add <pkg>` | `bun add <pkg>` |
| `npm add -D <pkg>` | `bun add -d <pkg>` |
| `npm run <script>` | `bun run <script>` |

### All Unchanged (Vitest scripts still work via Bun)
```bash
bun run test           # vitest run
bun run test:quiet     # vitest run --silent
bun run test:watch     # vitest
bun run test:coverage  # vitest run --coverage
```

### Docker Commands
```bash
docker compose up --build    # Start both stacks (Bun web)
docker compose down          # Stop both stacks
docker compose logs web      # View web service logs
```

### Backend Commands (Unchanged)
```bash
cd backend
clojure -M:server          # Start backend server
clojure -X:watch-server    # Hot reload backend
clojure -M:test            # Run tests
clojure -X:coverage         # Run coverage
```

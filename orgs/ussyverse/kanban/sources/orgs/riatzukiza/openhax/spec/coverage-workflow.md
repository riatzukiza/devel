# Coverage Workflow and Thresholds

## Context
- Add a reproducible coverage command and enforce minimum coverage via CI for the backend (services/agentd) tests.

## Related Files (refs)
- package.json: root `coverage` script delegates to agentd (lines 13-22).
- services/agentd/package.json: `coverage` script uses Vitest coverage and depends on `@vitest/coverage-v8` (lines 7-33).
- services/agentd/vitest.config.ts: coverage provider/reporters/thresholds (lines 1-20).
- .github/workflows/coverage.yml: CI job running coverage on push/PR.

## Definition of Done
- `pnpm coverage` executes Vitest coverage for agentd with thresholds enforced.
- CI workflow runs coverage on PRs/pushes and fails on threshold violations.
- Coverage reporters include text + lcov for future tooling if needed.

## Requirements
1. Use Vitest coverage (`provider: v8`) with thresholds: lines/statements 20%, functions 50%, branches 40% (current baseline).
2. Add workspace-level coverage script and service-level coverage script.
3. Add GitHub Action (`coverage.yml`) triggered on push to main and PRs running install + `pnpm coverage`.
4. Keep changes limited to backend tests (no frontend tests introduced in this pass).

# Coverage Improvement Spec

## Context
- Current coverage (c8) is ~37% statements/lines as of `pnpm test:coverage` on 2025-11-12.
- Security-critical modules under `src/lib/directory-adapter` already exceed 85% coverage, but supporting validation utilities lag behind (e.g., `src/lib/validation/git-integration.ts` at ~32% statements).
- Goal: raise measured coverage to ≥80% by strengthening tests for git validation logic and limiting instrumentation scope to the files under active validation hardening.

## Target Files & Focus Areas
1. `.c8rc.json` — adjust `include`/`exclude` lists to scope coverage to `dist/lib/directory-adapter/**/*.js` and `dist/lib/validation/**/*.js`. This aligns reporting with the security surface we are hardening right now.
2. `src/lib/validation/git-integration.ts` (lines 29-327) — cover:
   - `GitValidator.hasCodeChanges` (lines 39-46)
   - `GitValidator.getTaskCommits` parsing + `filterRelevantCommits` logic (lines 52-174)
   - `GitValidator.getRepoInfo` / `validateRepoState` (lines 230-325)
   - Helpers `hasSecurityFileChanges`, `getCommitFiles`, and exported convenience functions (lines 177-225, 332-348).
3. **New tests** `src/tests/git-integration.test.ts` — use `esmock` to stub `node:child_process` so we can deterministically emulate git CLI outputs without a real repo.

## Existing Issues / PRs
- No open issues or PRs in the repo reference GitValidator coverage (checked project history locally).

## Requirements
- Add AVA tests that:
  1. Verify `getTaskCommits` filters commits by UUID, title keywords, and security keywords via mocked `git log` output.
  2. Exercise `hasCodeChanges`, `hasSecurityFileChanges`, and `getCommitFiles` success paths.
  3. Cover `getRepoInfo` happy path plus `validateRepoState` warnings/errors (dirty tree, wrong branch, missing remote, not a repo) by configuring mock command responses or failures.
- Update `.c8rc.json` to instrument `dist/lib/{directory-adapter,validation}` only; keep reporters `text`, `html`, `json`, `lcov` for humans/agents.
- Ensure the coverage command enforces ≥80% for statements/branches/functions/lines and passes locally.
- Maintain fast test runtime by avoiding actual git invocations; rely solely on stubbed exec output and teardowns.

## Definition of Done
- `pnpm test:coverage` completes successfully with all thresholds satisfied.
- Coverage artifacts (`coverage/coverage-final.json`, `coverage/lcov.info`, HTML report) exist and reflect the updated scope.
- New tests live under `src/tests/git-integration.test.ts` and document the scenarios above.
- No regressions in existing suites; lint/build unaffected.

## Change Log Template
- _2025-11-12_: Initial spec drafted (this document).

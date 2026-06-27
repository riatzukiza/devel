# Agentd Tests

## Context
Add automated tests for the agentd backend to cover event broadcasting and filesystem listing safety. No existing tests or runner are configured.

## Related Files (refs)
- services/agentd/package.json: scripts/deps for backend (lines 7-28)
- services/agentd/tsconfig.json: ESM/strict compiler options (lines 1-12)
- services/agentd/src/events.ts: WebSocket EventBus implementation (lines 1-21)
- services/agentd/src/fs.ts: repository-safe file listing helpers (lines 1-92)

## Existing Issues / PRs
- None reviewed in this pass; check GitHub if needed.

## Definition of Done
- Test runner configured for agentd (npm scripts + config) using the existing ESM/TypeScript setup.
- EventBus behavior covered (timestamp injection, detach stops sends, one subscriber error does not block others).
- listFiles coverage for path safety, sorting, and submodule detection markers.
- `pnpm --filter agentd test` passes and `pnpm --filter agentd build` remains successful.

## Requirements
1. Introduce a test framework compatible with TypeScript ESM (Vitest preferred) with scripts in services/agentd/package.json.
2. Add configuration (e.g., vitest.config.ts) for Node environment and src resolution.
3. Implement unit tests for EventBus JSON payload + resilient broadcast/detach behavior.
4. Implement unit tests for fs.ts listFiles enforcing repo sandboxing, submodule detection (.gitmodules or .git with gitdir), and deterministic ordering.
5. Keep tests hermetic using temporary directories; avoid network/GitHub API calls.
6. Ensure lint/build scripts still work post-change.

## Plan (Phases)
- Phase 1: Add Vitest devDependency, test scripts, and config for services/agentd.
- Phase 2: Write EventBus tests covering timestamp injection and resilient broadcasting with detach.
- Phase 3: Write fs.ts tests using temp repo fixtures for path safety, sorting, and submodule flags.
- Phase 4: Run tests and confirm build still succeeds.

## Notes
- REPO_PATH env must be set before importing fs.ts; tests should isolate by resetting modules.
- Keep test names descriptive and avoid mocking external services.

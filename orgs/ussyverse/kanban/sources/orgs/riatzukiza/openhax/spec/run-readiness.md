# Run Readiness - Opencode Reactant

## Context
- Returning to project after gap; ensure install/run steps clear and environment prepared.

## Related Files (refs)
- package.json: scripts for dev/build/start, pnpm workspace config (lines 13-18).
- packages/opencode-reactant/package.json: frontend scripts/dev deps (lines 7-20).
- packages/opencode-reactant/DEVELOPMENT.md: install/run steps and environment requirements (lines 1-37).
- services/agentd/package.json: backend scripts/deps (lines 7-28).
- services/agentd/.env.example: required env vars (lines 1-5).

## Existing Issues / PRs
- Not reviewed in this pass; check GitHub issues/PRs if needed.

## Definition of Done
- Dependencies install successfully with `pnpm install:all`.
- Backend env file exists at `services/agentd/.env` with valid values.
- Dev servers start: `pnpm dev` runs frontend on :8700 and backend on :8787 without errors.
- Production build succeeds: `pnpm build` and `pnpm start` serve backend.

## Requirements & Steps
1. Prereqs: pnpm 8.15.x (per root packageManager), Node 18+ recommended.
2. Install: `pnpm install:all` from repo root.
3. Env: copy `services/agentd/.env.example` to `.env`; fill `GITHUB_TOKEN`, `REPO_PATH`, `REPO_SLUG`, optional `WEB_PORT`, `WORKTREE_BASE_DIR`.
4. Dev mode: `pnpm dev` (runs both); or per package `cd packages/opencode-reactant && pnpm dev`, `cd services/agentd && pnpm dev`.
5. Build: `pnpm build` (frontend then backend).
6. Prod start: `pnpm start` (serves backend dist).
7. Clean: `pnpm clean` removes build artifacts.

## Notes
- Git status shows top-level docs deleted and moved under packages; leave as-is unless intentional.
- Frontend build via shadow-cljs; backend via tsc.

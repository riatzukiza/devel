# PM2 Ecosystem Setup

## Context
Goal: manage the backend daemon (`services/agentd`) via PM2 with an ecosystem file. Frontend is shadow-cljs and typically not run under PM2.

## Related Files (refs)
- package.json: workspace scripts inc. `start` -> `pnpm --filter agentd start` (lines 13-18).
- services/agentd/package.json: `start` runs `node dist/index.js`, build uses `tsc` (lines 7-28).
- services/agentd/.env.example: required env vars (`GITHUB_TOKEN`, `REPO_PATH`, `REPO_SLUG`, `WEB_PORT`, `WORKTREE_BASE_DIR`) (lines 1-5).

## Definition of Done
- PM2 ecosystem file present at repo root defining apps for `services/agentd` (backend) and `packages/opencode-reactant` (frontend dev server).
- Backend process uses env from `services/agentd/.env` (or overrides) and logs to PM2-managed files.
- Usage notes documented (start/stop/reload, build prerequisite).

## Requirements
1. Backend: `agentd` running `node dist/index.js` in `services/agentd` with env file.
2. Frontend: `opencode-reactant` running `pnpm dev` in `packages/opencode-reactant` (shadow-cljs watch app), defaulting `REPO_SLUG` to `sst/opencode` if unset.
3. Ensure `cwd` set per app so relative paths resolve.
4. Provide sensible defaults (`WEB_PORT=8787`, `NODE_ENV=production` backend; `NODE_ENV=development` frontend).
5. Include `instances: 1`, `exec_mode: fork`, `max_restarts`/`restart_delay` sane defaults.
6. Document commands: `pnpm build`, `pm2 start ecosystem.config.cjs`, `pm2 reload <app>`, `pm2 logs <app>`, `pm2 stop/delete <app>`.

## Notes
- Build required before backend start: `pnpm --filter agentd build` (already in root `pnpm build`).
- Frontend runs via shadow-cljs watch (:8700); production build still failing (fix CLJS EOF in `src/opencode/ui/detail.cljs:149`).

## Usage
1) Ensure `services/agentd/.env` exists with required variables (see `.env.example`).
2) Build backend: `pnpm --filter agentd build` (or `pnpm build`).
3) Start via PM2 (both apps): `pm2 start ecosystem.config.cjs`.
4) Manage: `pm2 reload <app>`, `pm2 stop <app>`, `pm2 delete <app>`, `pm2 logs <app>`.

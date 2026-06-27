# Development Setup Notes

## Prompt
User asked how to start the project and how development is supposed to happen.

## Code References
- package.json: scripts for dev/start/pm2 `dev:start`, `dev:stop`, `dev:restart`, `dev:logs`, `dev:server`, `dev:watch`, `dev`, `start`, `bundles` (lines 7-18).
- ecosystem.config.js: pm2 watches `inc`, `dev`, `server` and wires `npm run dev:server` + `npm run dev:watch` (lines 1-10).
- scripts/dev.sibilant: boots dev namespace (lines 1-3).
- dev/index.sibilant: main dev flow compiles src to server/static/templates, bundles externals, and starts watchers (lines 59-126).
- server/server.js: creates HTTP server on `process.env.PORT || 8000` and mounts app (lines 34-38).
- server/index.js: requires server and calls `srv.server.start()` (lines 14-17).

## Existing Issues / PRs
- Not reviewed in this pass; no issues/PRs checked.

## Requirements
- Node.js + npm.
- pm2 (installed via devDependencies) for `dev:start|stop|restart|logs`.
- kit-shell and other kit packages installed via npm (git dependencies).

## Definition of Done
- `npm install` succeeds.
- Development workflow runs: either `npm run dev` (kit-shell entry) or pm2-managed watchers via `npm run dev:start`; files auto-compile and server runs.
- Production/start workflow runs: `npm start` serves built output on PORT or 8000.
- pm2-managed processes can be stopped with `npm run dev:stop` or restarted with `npm run dev:restart`.

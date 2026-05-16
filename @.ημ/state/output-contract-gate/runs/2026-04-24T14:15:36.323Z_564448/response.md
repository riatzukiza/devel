## Signal

(己, p=1.0) Updated `orgs/open-hax/openplanner/packages/agents/knoxx/ecosystem.config.cjs` to match the new **all-CLJS backend runtime** (no `src/server.mjs`).

Changes:

- Docstring now says backend runs `node dist/server.js` (compiled by shadow-cljs), not `src/server.mjs`.
- `knoxx-shadow` PM2 app now runs: `shadow-cljs --source-maps watch server` (instead of `watch app`).
- `knoxx-backend` PM2 app now runs: `dist/server.js` (instead of `src/server.mjs`).
- Backend watch list now watches only `dist` (removed `src/server.mjs`).

(己, p=1.0) Commits:

- Knoxx: `30ffddfb Update PM2 ecosystem for CLJS server entrypoint`
- OpenPlanner submodule bump: `bc82229 Bump knoxx: PM2 ecosystem uses dist/server.js`
- Workspace bump: `ed2fbfbb Bump openplanner knoxx PM2 ecosystem`

## Evidence

(己, p=1.0) File updated:
- `orgs/open-hax/openplanner/packages/agents/knoxx/ecosystem.config.cjs`

(己, p=1.0) Commit contents:
- Knoxx HEAD includes only `ecosystem.config.cjs` for this change (`30ffddfb`).

## Frames

(世, p=0.86) Frame 1: PM2 should launch the compiled shadow output (`dist/server.js`) so the runtime is fully CLJS-owned and nREPL-friendly.

(世, p=0.82) Frame 2: The shadow watcher should watch the `:server` build id, otherwise PM2 will keep compiling the wrong module graph.

## Countermoves

(己, p=0.9) I did not change env var wiring, ports, or service order—only the backend entrypoint + watcher targets—so the local stack behavior stays stable aside from “no server.mjs”.

## Next

(汝, p=0.9) Restart the PM2 stack (`pm2 restart knoxx` or stop/start) and confirm `knoxx-backend` is executing `backend/dist/server.js` and `knoxx-shadow` is watching the `server` build.
## Signal

(己, p=0.95) You’re right: if the goal is “agents can eval into the live Knoxx runtime via nREPL and mutate server structure without restarts,” then PM2 should **not** run a separate `node dist/server.js` process at all.

(己, p=1.0) I updated `orgs/open-hax/openplanner/packages/agents/knoxx/ecosystem.config.cjs` so the backend is **ONLY** the `shadow-cljs watch server` process (which owns both the Node runtime *and* the nREPL), and removed the separate `knoxx-backend` Node process.

Concretely:

- Removed the dedicated “Backend (Node + compiled CLJS)” PM2 app.
- Renamed/repurposed the first app to be the backend:
  - `name: 'knoxx-backend'`
  - `script: 'pnpm'`
  - `args: 'exec shadow-cljs --source-maps watch server'`
- Moved **all backend env vars** (PORT, Redis/Postgres URLs, tokens, etc.) onto this shadow process, because the spawned Node runtime inherits its env from the shadow process.
- Updated the header comments accordingly.

(己, p=1.0) Commits:

- Knoxx: `6a436d00 PM2: run backend via shadow-cljs watch server (nREPL live)`
- OpenPlanner bump: `86f2ea9 Bump knoxx: PM2 backend is shadow-cljs live nREPL`
- Workspace bump: `37ff0ef2 Bump openplanner knoxx PM2 live nREPL backend`

## Evidence

(己, p=1.0) Updated file:
- `orgs/open-hax/openplanner/packages/agents/knoxx/ecosystem.config.cjs`

(己, p=1.0) Validation:
- `node -c ecosystem.config.cjs` (syntax check) passed.

(己, p=1.0) Grep evidence in file:
- comment line shows: `knoxx-backend — shadow-cljs watch server (runs Node runtime + nREPL in one process)`
- `args: 'exec shadow-cljs --source-maps watch server'`
- no remaining `dist/server.js` PM2 app block.

## Frames

(世, p=0.86) Frame 1: The “live” runtime you want to patch is the Node runtime spawned/managed by shadow; if PM2 runs `node dist/server.js` separately, nREPL eval won’t affect the live server process you’re actually using.

(世, p=0.82) Frame 2: To get “no restarts unless hard crash,” you need a single long-lived owner process. Here that owner is `shadow-cljs watch server`; it can hot-load CLJS changes and keep the runtime attached.

(世, p=0.78) Frame 3: Most “why doesn’t my live patch work” cases are really “I edited code in one process but I’m hitting a different process.” Removing the second backend process eliminates that footgun.

## Countermoves

(己, p=0.88) I did not turn on PM2 filesystem watching for backend sources. PM2 watch tends to cause duplicate restarts and races; shadow already handles recompilation + runtime reload.

(己, p=0.83) I kept the existing env surface identical—just moved it onto the shadow process—so behavior should match prior runs.

## Next

(汝, p=0.9) Restart the PM2 stack and confirm:
1) only one backend process exists (`knoxx-backend`), and it’s `shadow-cljs watch server`
2) nREPL is reachable on port `4500`
3) requests to `http://127.0.0.1:8000` are served by the shadow-owned runtime (not a separate node process).
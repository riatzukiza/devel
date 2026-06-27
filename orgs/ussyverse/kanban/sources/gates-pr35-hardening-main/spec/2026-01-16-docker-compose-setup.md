# Spec: Docker Compose Setup (2026-01-16)

---
Type: spec
Component: infrastructure
Priority: low
Status: proposed
Estimated-Effort: 4 hours
---

## Code References
- `AGENTS.md:35-117` outline backend/frontend commands, ports 3000/5173, and tooling expectations that containers must mirror.
- `README.md:17-38` documents prerequisite tooling plus `clojure -M:server` and `npm run dev --prefix web` flows we need to reproduce via Compose.
- `backend/deps.edn:1-30` exposes the `:server` alias used for the backend entry point.
- `backend/src/fantasia/server.clj:141-159` binds HTTP+WS traffic to port `3000` (no env override yet), so Compose must map `3000:3000`.
- `web/package.json:6-14` lists the `dev` script to run Vite; Compose should invoke it with `-- --host 0.0.0.0 --port 5173`.
- `web/vite.config.ts:1-8` confirms port `5173` defaults and hints at required host override when running inside containers.

## Existing Issues / PRs
- `gh issue list --search "docker"` (2026-01-16) returned no open issues referencing Docker/Compose.
- `gh pr list --search "docker"` (2026-01-16) returned no active PRs for containerization work.

## Requirements
1. Add a root-level `compose.yaml` describing `backend` and `web` services using official OpenJDK/Clojure + Node 20 base images, mounting the repo for dev iteration.
2. Expose backend on `3000` and frontend on `5173`, ensuring the frontend service waits for backend readiness before booting (Compose `depends_on`).
3. Persist dependency caches via bind mounts (`~/.m2`, `web/node_modules`) to avoid reinstall churn while keeping images slim.
4. Allow frontend container to reach backend via service name (`http://backend:3000`); document expected proxy/env knobs if needed.
5. Document prerequisites and usage (`docker compose up --build`, ports, teardown) in `README.md` plus a brief entry in `docs/notes` if verification steps become elaborate.

## Definition of Done
- `docker compose up` from repo root launches both services, streaming logs for backend + Vite dev server.
- Backend container runs `clojure -M:server` under Java 17, exposing `localhost:3000` via port mapping.
- Frontend container runs `npm run dev -- --host 0.0.0.0 --port 5173`, reachable at `http://localhost:5173`, and configured to proxy API calls against the backend container.
- Compose file contains inline comments describing key mounts/env vars and passes `docker compose config` validation.
- README gains a "Docker" section summarizing prerequisites, commands, and expected port behavior.

## Plan
### Phase 1 – Validation & Inputs
- Confirm no existing Compose/Docker files conflict with the new setup.
- Verify backend/frontend commands and dependency directories required for volumes (`backend`, `web`).

### Phase 2 – Compose Authoring
- Create `compose.yaml` with two services, shared network, bind mounts (`.:/app`, host cache dirs), and appropriate entrypoints.
- Add helper build contexts or use official images (`clojure:temurin-17-tools-deps`, `node:20-bullseye`) with working directories set to `/app/backend` and `/app/web` respectively.
- Include `depends_on` from `web` to `backend`, env vars for frontend to know backend host (e.g., `VITE_BACKEND_URL=http://backend:3000`).

### Phase 3 – Documentation
- Extend `README.md` with Docker prerequisites (Docker Desktop/Engine), `docker compose up --build`, and verification notes.
- Mention Compose availability in `docs/notes` if additional troubleshooting tips emerge.

### Phase 4 – Verification
- Run `docker compose config` locally (if Docker CLI available) or at least describe the command in README for operators.
- Capture manual verification steps (hit `localhost:5173`, ensure backend logs show connections) in commit/PR description once implemented.

## Notes
- Keep Compose schema at v3.9 for compatibility.
- Avoid baking large dependency caches into images; rely on mounted host caches instead.
- If future tests get added, Compose services can be extended with additional profiles—document how to do so inline once relevant.

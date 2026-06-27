# Spec: Docker Compose for Fantasia (2026-01-14)

## Code References
- `README.md:17-37` describe backend (`clojure -M:server`) and frontend (`npm run dev --prefix web`) workflows and port usage.
- `backend/src/fantasia/server.clj:155-158` locks the backend HTTP + WS server to port `3000`.
- `web/vite.config.ts:4-6` configures the Vite dev server on port `5173`.
- `backend/deps.edn:10-18` exposes the `:server` alias that should be invoked inside the backend container.

## Existing Issues / PRs
- `gh issue list --limit 5` returned no open items referencing Docker as of 2026-01-14.
- `gh pr list --limit 5` returned no in-flight PRs for Docker/containers.

## Requirements
1. Provide a single Compose file (`docker-compose.yml` or `compose.yaml`) at the repo root that starts both the backend and the frontend with their documented commands.
2. Ensure containers expose the canonical development ports externally (`3000` for backend HTTP/WS, `5173` for the Vite UI).
3. Mount the repo source as a volume for iterative development, keeping installation caches (e.g., `.m2`, `node_modules`) in container-friendly locations.
4. Support deterministic start order (backend before frontend) so the UI can reliably connect to the simulation API.
5. Keep images lean: reuse official OpenJDK + Clojure tools image (or openjdk + scripted install) for backend and Node 20 LTS for frontend.

## Definition of Done
- Running `docker compose up` at the repo root launches both services and keeps their logs in the terminal.
- Backend container executes `clojure -M:server` and serves WebSocket + HTTP endpoints on `localhost:3000`.
- Frontend container executes `npm run dev -- --host 0.0.0.0 --port 5173` (or equivalent), proxies to backend, and is reachable on `http://localhost:5173`.
- README gains a short "Docker" section explaining prerequisites and the compose command.
- Compose file documents any mounted volumes or environment variables inside inline comments for future operators.

## Plan Outline
- **Phase 1 – Discovery:** capture backend/frontend runtime dependencies and container-friendly entrypoints.
- **Phase 2 – Composition:** define `docker-compose.yml` with two services (`backend`, `web`), shared network, and volumes for source + dependency caches.
- **Phase 3 – Documentation:** update README with Docker usage instructions and note Compose availability in repo change log.
- **Phase 4 – Validation:** lint compose syntax with `docker compose config` (if possible) and ensure instructions mention verifying by hitting the exposed ports.

## Notes
- Container builds should respect the repo's `AGENTS.md` guidance on conservative dependency additions and reproducibility.
- Keep Compose schema version at `3.9` to align with Docker Engine 20.10+ defaults used by most contributors.

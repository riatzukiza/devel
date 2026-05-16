## Signal

(己, p=0.9) Implemented a `--profile dev` workflow in `@services/proxx` that bind-mounts the proxx repo and restarts on changes with a debounce, *and* added graceful shutdown so in-flight requests can finish before the restart.

What changed:

- (己, p=0.9) `services/proxx/docker-compose.yml`
  - `proxx` is now `profiles: ["prod"]`
  - new `proxx-dev` service with `profiles: ["dev"]`:
    - bind-mounts `../../orgs/open-hax/proxx:/app`
    - preserves container `node_modules` via a named volume `proxx-dev-node-modules:/app/node_modules`
    - runs `nodemon` with `--delay 750ms --signal SIGTERM` watching `src/`, `web/`, and `package.json`
    - sets `stop_signal: SIGTERM` and `stop_grace_period: 30s`

- (己, p=0.9) `orgs/open-hax/proxx/src/main.ts`
  - added a SIGINT/SIGTERM handler that:
    1) calls `await app.close()` (Fastify graceful shutdown: stop accepting new conns + wait for in-flight)
    2) then `shutdownTelemetry()`
    3) then exits

How to run:

```bash
cd /home/err/devel/services/proxx

# prod-like (pm2 + built dist/)
docker compose --profile prod up -d --build

# dev (bind mount + debounced restarts)
docker compose --profile dev up -d --build
docker compose logs -f proxx-dev
```

## Evidence

(己, p=0.9) Compose dev config validates (`docker compose --profile dev ... config` succeeded).  
(己, p=0.9) Commits made:
- root repo: `services/proxx: add dev profile bind mount + debounced restarts`
- submodule `orgs/open-hax/proxx`: `Graceful shutdown on SIGTERM for dev restarts`
- root repo: updated proxx submodule pointer to include that commit

## Frames

(己, p=0.75) This is “fast inner loop”: mount source, keep deps stable, restart process cheaply; best for API iteration.  
(己, p=0.65) Graceful shutdown is the real fix for “don’t drop in-flight requests”; debounce is just to avoid thrash.  
(世, p=0.55) If you later want even smoother behavior (no restart for purely front-end changes), we can split watchers or run `web:dev` separately.

## Countermoves

(己, p=0.7) If restarts still interrupt long streams, increase `stop_grace_period` (e.g. 60–120s) and ensure any streaming handlers in the app don’t hold the event loop forever after disconnect.  
(己, p=0.65) If bind-mount makes installs slow, we can skip `pnpm install` on every container start by moving it behind a “only if node_modules missing” check.

## Next

(汝, p=0.85) Run: `cd services/proxx && docker compose --profile dev up -d --build && docker compose logs -f proxx-dev`.
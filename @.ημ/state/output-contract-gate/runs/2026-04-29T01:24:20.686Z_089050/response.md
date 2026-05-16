## Signal

(己, p=0.93) Wired it up.

OpenPlanner now uses the CLJS hydration cache protocol with app-owned Redis and LMDB handles:

```text
memory hot cache
→ Redis shared/hot cache
→ LMDB warm TTL cache
→ source file read
```

Changed in OpenPlanner:

```text
orgs/open-hax/openplanner/src/routes/v1/documents.ts
orgs/open-hax/openplanner/package.json
orgs/open-hax/openplanner/pnpm-lock.yaml
```

Changed in service stack:

```text
services/openplanner/docker-compose.yml
```

Service wiring added:

```yaml
OPENPLANNER_SOURCE_ROOT: /app/workspace
OPENPLANNER_HYDRATION_REDIS_URL: redis://knoxx-redis:6379
OPENPLANNER_HYDRATION_LMDB_PATH: /app/openplanner-lake/cache/source-hydration-lmdb
OPENPLANNER_HYDRATION_CACHE_TTL_MS: 18000000
```

Also added:

- `openplanner` depends on `knoxx-redis: service_healthy`
- `openplanner` joins `knoxx-internal`
- workspace mounted read-only:

```yaml
${WORKSPACE_PATH:-../../..}:/app/workspace:ro
```

So source refs like:

```text
orgs/ussyverse/warp/crates/onboarding/src/slides/agent_slide.rs
```

resolve inside the container under:

```text
/app/workspace/orgs/...
```

## Evidence

(己, p=0.93) Build passes:

```bash
cd /home/err/devel/orgs/open-hax/openplanner
pnpm build
```

(己, p=0.88) LMDB cache smoke test passed through the CLJS package:

```bash
node --input-type=module -e "... createLmdbCache/createLayeredCache/cachePut/cacheGet ..."
```

Output:

```text
v
```

(己, p=0.86) Compose config validates:

```bash
cd /home/err/devel/services/openplanner
docker compose config --quiet
```

Only warning was pre-existing unset env:

```text
SHUVCRAWL_API_TOKEN variable is not set
```

(己, p=0.9) Commits made:

OpenPlanner submodule:

```text
4f8ac07 Wire hydration cache handles
```

Workspace root:

```text
39712511 Wire openplanner hydration caches in service stack
```

## Frames

(己, p=0.84) OpenPlanner is now positioned to become the hydration/cache source of truth while Knoxx’s Redis dependency can be factored away later.

(己, p=0.8) The CLJS package still owns cache behavior; TypeScript owns only the unavoidable I/O setup: Redis client creation, LMDB handle opening, file reads, and route response timing.

(己, p=0.74) This sets up the path for moving more route-adjacent pure transforms out of TS without forcing a risky full route rewrite.

## Countermoves

(己, p=0.85) I did not stage unrelated OpenPlanner state. Remaining internal submodule status still shows:

```text
 M packages/agents/knoxx
?? docs/notes/2026.04.28.15.06.02.md
?? docs/notes/2026.04.28.17.09.48.md
?? docs/notes/2026.04.28.18.02.51.md
```

(己, p=0.78) Root still reports `orgs/open-hax/openplanner` as modified because the submodule has that unrelated dirty/untracked state inside it, not because the intended commits are uncommitted.

## Next

(己, p=0.88) Bring up `services/openplanner` and verify one of the 10 already-redacted Mongo records returns hydrated `content` through `/v1/documents/:id`.
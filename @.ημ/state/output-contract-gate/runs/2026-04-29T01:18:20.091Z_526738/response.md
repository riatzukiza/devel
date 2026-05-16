## Signal

(己, p=0.92) Continued in the intended direction: cache responsibilities are now in the ClojureScript package, not TypeScript.

Added CLJS cache drivers/protocol implementations in:

```text
orgs/open-hax/openplanner/packages/stores/document-hydration/src/openplanner/stores/document_hydration.cljs
```

Now exported from the package:

```ts
createMemoryLruCache
createRedisCache
createLmdbCache
createLayeredCache

cacheGet
cachePut
cacheEvict
cacheTouch
cacheCleanup
cacheStats
```

Important design choice:

(己, p=0.86) Redis and LMDB drivers wrap caller-owned JS clients/handles instead of importing/owning Node connection lifecycle inside the CLJS package.

That keeps the package focused on the boundary you named:

```text
database row -> pure hydration/cache decisions -> HTTP route response shape
```

TypeScript remains responsible only for I/O edges:
- reading source files
- owning HTTP routes
- later: creating Redis clients / LMDB handles if we wire those into app startup

## Evidence

(己, p=0.9) Build passes:

```bash
cd /home/err/devel/orgs/open-hax/openplanner
pnpm build
```

Result:

```text
[:lib] Build completed.
tsc completed
```

(己, p=0.87) Runtime smoke test for layered CLJS cache passed:

```bash
node --input-type=module -e "... createMemoryLruCache/createLayeredCache/cachePut/cacheGet ..."
```

Output:

```text
v
v
{"type":"layered","layers":[...]}
```

This confirms:
- layered cache checks lower layers
- promotes cache hits back into earlier/hotter layers
- `cacheStats` reports nested cache topology

(己, p=0.9) New commits:

OpenPlanner submodule:

```text
b52798f Add CLJS hydration cache drivers
```

Workspace root:

```text
45b23b70 Update openplanner submodule (hydration cache drivers)
```

## Frames

(己, p=0.82) This is the right “one chunk at a time” migration: transform/cache semantics moved to CLJS while TS still does the minimum Node shell work.

(己, p=0.76) I intentionally avoided compile-time `["redis"]` / `["lmdb"]` imports in CLJS. Shadow builds were brittle there, and more importantly that would mix connection lifecycle into the pure boundary package.

(己, p=0.72) The Redis/LMDB strategy is now structurally supported, but not yet wired into OpenPlanner app startup. Current route usage still uses memory LRU; next wiring should pass app-owned Redis/LMDB handles into the CLJS adapters.

## Countermoves

(己, p=0.86) I preserved unrelated workspace state. OpenPlanner still reports:

```text
 M packages/agents/knoxx
?? docs/notes/2026.04.28.15.06.02.md
?? docs/notes/2026.04.28.17.09.48.md
?? docs/notes/2026.04.28.18.02.51.md
```

Those were not staged or committed.

(己, p=0.78) Root still shows `orgs/open-hax/openplanner` as modified because the submodule itself has unrelated dirty/untracked state, not because the intended OpenPlanner commits are missing.

## Next

(己, p=0.88) Wire app-owned Redis and LMDB handles into `documentHydrationCache` so the route uses layered CLJS cache: memory hot → Redis hot/shared → LMDB warm → source read.
# @open-hax/openplanner-document-hydration

ClojureScript pure transformation package for OpenPlanner document hydration.

This package owns the transformation boundary between MongoDB event rows and HTTP document responses:

- detect redacted source/document rows
- derive source refs and cache keys
- merge rehydrated source text back into rows
- convert rows to the public document API shape

Generic cache protocols and adapters now live in `@open-hax/openplanner-store-cache` under `openplanner.stores.cache.*`.
Document hydration still re-exports the cache helpers as a compatibility facade for existing JavaScript/TypeScript callers:

- `createMemoryLruCache`
- `createRedisCache`
- `createLmdbCache`
- `createLayeredCache`
- `cacheGet` / `cachePut` / `cacheEvict` / `cacheTouch` / `cacheCleanup` / `cacheStats`

New domain store packages should import `@open-hax/openplanner-store-cache` directly instead of depending on document hydration for cache behavior.

I/O remains outside this package. Callers fetch source text from filesystem/URL/etc, then pass it into `hydrateDocumentRow`. Redis and LMDB drivers wrap caller-owned clients/handles so connection lifecycle stays at the application edge.

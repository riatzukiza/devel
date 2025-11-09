# LMDB Cache Real Integration

## Context
- packages/lmdb-cache/src/cache.ts:1-205 currently implements a Map-based cache while advertising LMDB support.
- Tests in packages/lmdb-cache/src/tests/cache.test.ts:1-209 exercise TTL, namespaces, batching, and iteration semantics assuming persistence on disk.
- Downstream packages such as packages/ollama-queue/src/persistent-store.ts:4-212 depend on openLmdbCache for reliable persistence.

## Existing Issues / PRs
- No tracked issues or PRs reference this work (searched for lmdb-cache and Database

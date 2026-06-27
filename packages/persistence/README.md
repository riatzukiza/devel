<!-- READMEFLOW:BEGIN -->

# @promethean-os/persistence

[TOC]

## Install

```bash
pnpm -w add -D @promethean-os/persistence
```

## Quickstart

```ts
import { openLevelCache, openLmdbCache } from '@promethean-os/persistence';

const levelCache = await openLevelCache({ path: '.cache/level' });
const lmdbCache = openLmdbCache({ path: '.cache/lmdb' });
```

## Caches

-   Unified entrypoint: import caches from `@promethean-os/persistence`.
-   Exported factories: `openLevelCache`, `openLmdbCache`.
-   Exported types: `LevelCache`, `LevelCacheOptions`, `LevelPutOptions`, `LevelMillis`, `LmdbCache`, `LmdbCacheOptions`, `LmdbPutOptions`, `LmdbMillis`, `LmdbCacheStats`.
-   Deprecation: `@promethean-os/level-cache` and `@promethean-os/lmdb-cache` are thin re-exports and will be removed in a future release; use persistence directly for new code.
-   Choosing backends: prefer LevelDB for lightweight/local setups; use LMDB when higher concurrency or compression is needed.

## Commands

-   `build`
-   `clean`
-   `typecheck`
-   `test`
-   `lint`
-   `lisp`
-   `coverage`
-   `format`

## License

GPL-3.0-only

### Package graph

```mermaid
flowchart LR
  _promethean_os_persistence["@promethean-os/persistence\n0.0.1"]
  _promethean_os_embedding["@promethean-os/embedding\n0.0.1"]
  _promethean_os_logger["@promethean-os/logger\n0.1.0"]
  _promethean_os_discord["@promethean-os/discord\n0.0.1"]
  _promethean_os_frontend["@promethean-os/frontend\n0.1.0"]
  _promethean_os_migrations["@promethean-os/migrations\n0.0.1"]
  _promethean_os_test_utils["@promethean-os/test-utils\n0.0.1"]
  _promethean_os_file_indexer_service["@promethean-os/file-indexer-service\n0.0.1"]
  _promethean_os_persistence --> _promethean_os_embedding
  _promethean_os_persistence --> _promethean_os_logger
  _promethean_os_discord --> _promethean_os_persistence
  _promethean_os_frontend --> _promethean_os_persistence
  _promethean_os_migrations --> _promethean_os_persistence
  _promethean_os_test_utils --> _promethean_os_persistence
  _promethean_os_file_indexer_service --> _promethean_os_persistence
  classDef focal fill:#fdf6b2,stroke:#222,stroke-width:2px;
  class _promethean_os_persistence focal;
```

<!-- READMEFLOW:END -->

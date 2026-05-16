## Signal

(己, p=0.88) Reviewed migrations 2 and 3, and assessed migration 1 against their current state.

(己, p=0.86) Bottom line:

| Migration | Current status | Assessment |
|---|---:|---|
| Migration 2: document/file text redaction | Partially implemented, not complete | Redacts `events.text` and flat `event_chunks.text`, but misses partition vector collections and hydration currently fails in the live container due source-root mismatch. |
| Migration 3: layered source cache / hydration | Partially implemented, tests pass, last-mile incomplete | Cache protocol exists with memory/Redis/LMDB layers, but endpoint hydration is not successfully returning source text in live OpenPlanner. Embedding cache is still in-memory stub, not Redis-backed. |
| Migration 1: agent session text dedup from Proxx | Implemented as cautious dry-run tool, not ready to apply | Dry-run finds Proxx correlations, but only reference-only matches in sample. It should remain blocked/deferrable until hydration/cache and reconstruction semantics are solid. |

(己, p=0.91) Highest priority fixes:

1. Fix live source hydration path: `OPENPLANNER_SOURCE_ROOT` should likely be `/app/workspace/devel`, not `/app/workspace`, for the current `services/openplanner` volume layout.
2. Extend Migration 2 to redact partition vector collections, e.g. `event_chunks__qwen3-embedding-0-6b__d1024__...`, not just `event_chunks`.
3. Stop new writes from reintroducing full text into Mongo vector docs where a rehydratable source ref exists.
4. Move embedding cache out of `PersistentEmbeddingCache` in-memory `Map` into Redis or the cache protocol.
5. Only then revisit Migration 1 apply-mode for Knoxx/session text.

## Evidence

(己, p=0.95) Commands/tests run:

- `pnpm --filter @open-hax/openplanner-document-hydration test`
  - Result: 5 tests, 21 assertions, 0 failures.
- `clj -M:run --help` in `packages/stores/migrations/openplanner-migration-tools`
  - CLI loads and exposes `migration-1` / `migration-2`.
- Migration 2 dry-run:
  - `--migration migration-2 --dry-run --limit 20`
  - Found 20/20 eligible document-redaction candidates with source paths and hashes.
- Migration 1 dry-run:
  - `--migration migration-1 --dry-run --limit 20`
  - Found 5 matches, all `reference-only`; 0 redaction candidates in the sample.
- Live Mongo counts:
  - `docsWithText`: 57,702
  - `docsRedacted`: 10
  - `knoxxWithText`: 6,600
  - `knoxxRedacted`: 0
  - `eventChunksWithText`: 183,894
  - `eventChunksRedacted`: 10
  - partition vector collection `event_chunks__qwen3-embedding-0-6b__d1024__4d1a4607dc` still has 183,908 docs with non-empty `text`.

(己, p=0.9) Key files reviewed:

- `orgs/open-hax/openplanner/packages/stores/migrations/openplanner-migration-tools/src/openplanner/migrations/migration_1.clj`
- `orgs/open-hax/openplanner/packages/stores/migrations/openplanner-migration-tools/src/openplanner/migrations/migration_2.clj`
- `orgs/open-hax/openplanner/packages/stores/document-hydration/src/openplanner/stores/document_hydration.cljs`
- `orgs/open-hax/openplanner/src/routes/v1/documents.ts`
- `orgs/open-hax/openplanner/src/lib/embedding-cache.ts`
- `orgs/open-hax/openplanner/src/lib/indexing.ts`
- `orgs/open-hax/openplanner/src/lib/mongo-vectors.ts`
- `services/openplanner/docker-compose.yml`

(己, p=0.93) Live hydration probe failed:

- Mongo row `ae9eda21-ba13-3f2d-9960-19a76f312ee7` has `extra.migration_2.text_redacted: true` and source path `orgs/ussyverse/warp/crates/onboarding/src/slides/onboarding_slide.rs`.
- Host file exists.
- API response from `/v1/documents/:id` returned `content_len: 0`.
- Container check showed `/home/err/devel/...` does not exist inside the container, and env showed `OPENPLANNER_SOURCE_ROOT=/app/workspace`.
- `services/openplanner/docker-compose.yml` mounts `${WORKSPACE_PATH:-../../..}:/app/workspace:ro`; from `services/openplanner`, that default maps `/home/err` to `/app/workspace`, so the repo path is `/app/workspace/devel/...`.

## Frames

(己, p=0.84) Frame 1: Migration 2 is conceptually correct but operationally under-scoped. It knows how to preserve source refs and hashes, but it only redacts some Mongo surfaces. The partitioned vector collections still duplicate text.

(己, p=0.82) Frame 2: Migration 3 has the right shape: ClojureScript protocol, memory/Redis/LMDB drivers, layered promotion, and route integration. The failure is last-mile runtime configuration plus incomplete embedding-cache migration.

(己, p=0.8) Frame 3: Migration 1 should stay conservative. The current Proxx event store mostly contains streaming/request shapes, and OpenPlanner session receipts are assembled or synthesized. Matching exact text is therefore weaker than document/file matching; it needs stable rehydration and correlation metadata first.

## Countermoves

(己, p=0.87) Do not apply Migration 1 yet. Sample dry-run produced only `reference-only` matches, meaning the tool correctly avoided deleting OpenPlanner text when Proxx only contained a subspan or non-reconstructive match.

(己, p=0.9) Do not declare Migration 2 complete. Live counts prove substantial full text remains in `events`, `event_chunks`, and especially partition vector collections.

(己, p=0.86) Do not rely on API hydration until the source root is fixed and tested with a redacted document row. Right now redacted rows can become empty API documents.

(己, p=0.84) Avoid introducing web markdown TTL semantics into permanent Mongo rows. Web markdown should be source-cache material with TTL and URL/content hash refs, not durable event text unless explicitly classified as non-reconstructable evidence.

## Next

(己, p=0.92) Next action: fix `services/openplanner/docker-compose.yml` / runtime env so `OPENPLANNER_SOURCE_ROOT=/app/workspace/devel`, restart OpenPlanner, and re-run the redacted document hydration probe before applying or extending any redaction migration.
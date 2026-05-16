## Signal

(己, p=0.94) Continued and landed the first concrete fixes.

(己, p=0.92) Fixed live OpenPlanner source hydration by changing `services/openplanner/docker-compose.yml`:

- `OPENPLANNER_SOURCE_ROOT` default:
  - from `/app/workspace`
  - to `/app/workspace/devel`

(己, p=0.9) Restarted OpenPlanner containers and verified a previously redacted document now hydrates correctly:

- `7777`: redacted document returned `content_len: 556`
- `7778`: redacted document returned `content_len: 556`

(己, p=0.89) Advanced Migration 2 so it redacts vector text in both:

- flat collection: `event_chunks`
- partition collections: `event_chunks__*`

(己, p=0.9) Commits created:

- Root workspace: `e01cc2e2 Fix OpenPlanner source hydration wiring`
- OpenPlanner: `1e7f880 Advance source text redaction migration`
- Migration tools submodule: `4839d40 Redact partitioned vector chunk text`

## Evidence

(己, p=0.93) Files changed:

- `services/openplanner/docker-compose.yml`
- `orgs/open-hax/openplanner/packages/stores/migrations/openplanner-migration-tools/src/openplanner/migrations/migration_2.clj`
- receipt ledgers:
  - `orgs/open-hax/openplanner/receipts.edn`
  - `orgs/open-hax/openplanner/packages/stores/migrations/openplanner-migration-tools/receipts.edn`

(己, p=0.94) Verification run:

- `docker compose config`
- `docker compose up -d openplanner openplanner-dev`
- container env/file check:
  - `SOURCE_ROOT=/app/workspace/devel`
  - source file exists inside container
- hydration API check:
  - `GET /v1/documents/ae9eda21-ba13-3f2d-9960-19a76f312ee7`
  - returned hydrated source text on both ports
- Migration 2 dry-run:
  - discovered `[event_chunks event_chunks__qwen3-embedding-0-6b__d1024__4d1a4607dc]`

## Frames

(己, p=0.86) Migration 3 is now more real operationally: the layered hydration system was already implemented, but the live compose mount default prevented it from finding files.

(己, p=0.84) Migration 2 is safer now because apply-mode will no longer leave partitioned vector text behind while claiming chunk text was redacted.

(己, p=0.8) Migration 1 should still wait. The hydration path is now fixed, but session text redaction still needs stronger reconstruction semantics from Proxx streams before applying.

## Countermoves

(己, p=0.9) I did not apply broad redaction migrations. Only dry-runs and one already-redacted hydration probe were used.

(己, p=0.88) I left pre-existing OpenPlanner/Knoxx workspace modifications untouched. Root still reports OpenPlanner submodule modified because of pre-existing dirty content inside that submodule, not because of uncommitted migration-tool changes.

(己, p=0.86) The next code risk is write-path regression: new document/vector writes can still store full text unless ingestion/indexing is changed to store references plus embeddings without durable text.

## Next

(己, p=0.91) Next action: update OpenPlanner’s vector write path so rehydratable source documents write empty/redacted `text` into Mongo vector collections while preserving `source_ref`, offsets, hashes, and embedding metadata.
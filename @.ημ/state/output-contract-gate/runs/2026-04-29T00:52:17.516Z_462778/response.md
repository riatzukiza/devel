## Signal

(己, p=0.92) Pivoted the tool toward what matters more now: **document/source text removal**.

(己, p=0.9) Added a new migration:

```bash
clj -M:run --migration migration-2 --dry-run --limit 10
```

`migration-2` targets OpenPlanner Mongo records that:
- have raw `text`
- are source/document kinds:
  - `code`
  - `docs`
  - `config`
  - `data`
  - `document.chunk`
- are **not** `source="knoxx"`
- have source identity:
  - `extra.source_path`
  - `extra.path`
  - `extra.url`
  - `extra.hostname`
  - `extra.metadata.path`
  - `extra.metadata.file_id`
  - `extra.metadata.url`

On `--apply`, it will:
- set event `text` to `""`
- preserve a redaction receipt under `extra.migration_2`
- store:
  - source path / URL / hostname
  - lake
  - original text SHA-256
  - original text length
  - source content hash, if present
- also redact matching `event_chunks.text` for the same `parent_id`, while preserving embeddings and source references.

## Evidence

(己, p=0.9) Dry-run against live OpenPlanner Mongo succeeded:

```text
migration-2: {:mode :dry-run, :limit 10, :target :document-text}
...
done {:scanned 10,
      :eligible 10,
      :events-redacted 0,
      :chunks-redacted 0,
      :missing-source-ref 0}
```

(己, p=0.88) The first 10 candidates were real KMS-ingested source documents, e.g.:

- `orgs/ussyverse/warp/crates/string-offset/src/lib.rs`
- `orgs/ussyverse/warp/crates/sum_tree/src/cursor.rs`
- `orgs/ussyverse/warp/crates/syntax_tree/src/lib.rs`

(己, p=0.9) Commits:
- `openplanner-migration-tools`: `8b9dbb1` — `Add document source text redaction migration`
- `openplanner`: bumped submodule pointer
- workspace root: `5c44b405` — `Update openplanner submodule (document text migration)`

## Frames

(己, p=0.78) This matches the clarified invariant: synthesized Knoxx receipts can stay; raw source document text should not live in OpenPlanner Mongo when the original file/URL can be rehydrated.  
(己, p=0.72) The migration keeps search graph metadata and embeddings usable, but removes duplicated raw source text from Mongo and hot chunks.  
(世, p=0.62) The next larger architectural step is replacing “store text in event_chunks” with “store embedding + source reference + cache-key,” then rehydrate from file/URL/cache on demand.

## Countermoves

(己, p=0.75) I did **not** run `--apply`; the dry-run shows candidates, but this is the first destructive document migration and should be run in a bounded batch first.  
(己, p=0.7) Before a large apply, we should snapshot/export candidate ids + hashes so rollback can verify what was removed.

## Next

(己, p=0.86) Run a tiny destructive batch next: `migration-2 --apply --limit 10`, then inspect those 10 Mongo events and matching `event_chunks` to confirm text was removed and references/hashes remained.
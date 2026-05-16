## Signal

(己, p=0.94) Done.

(己, p=0.92) OpenPlanner’s Mongo vector write path now embeds source text but stores redacted/empty vector `text` for rehydratable source documents.

(己, p=0.91) New vector rows now preserve:

- `source_text_redacted: true`
- `source_ref`
- full/source text hash: `text_hash_sha256`
- chunk hash: `chunk_text_hash_sha256`
- `char_start`
- `char_end`
- existing embedding metadata

(己, p=0.9) This applies to both:

- flat vector collection: `event_chunks`
- partition vector collections: `event_chunks__*`

(己, p=0.9) Commits created:

- OpenPlanner: `09e68b2 Redact rehydratable vector text on write`
- Root workspace pointer: `66240681 Advance OpenPlanner vector redaction`

## Evidence

(己, p=0.93) Changed files:

- `orgs/open-hax/openplanner/src/lib/mongo-vectors.ts`
- `orgs/open-hax/openplanner/src/lib/indexing.ts`
- `orgs/open-hax/openplanner/src/lib/mongodb.ts`
- `orgs/open-hax/openplanner/src/tests/indexing.test.ts`
- `orgs/open-hax/openplanner/receipts.edn`

(己, p=0.93) Verification passed:

- `pnpm exec tsc --noEmit --pretty false`
- `pnpm test src/tests/indexing.test.ts`
- `pnpm build`
- restarted `openplanner` and `openplanner-dev`
- live POST smoke document to `/v1/documents`
- direct Mongo inspection of `event_chunks` and partition collection

(己, p=0.92) Live Mongo smoke result for `vector-redaction-smoke-20260429`:

```json
{
  "text": "",
  "source_text_redacted": true,
  "source_ref": {
    "source_path": "test.txt",
    "lake": "devel"
  },
  "char_start": 0,
  "char_end": 4,
  "embedding": ["present"]
}
```

(己, p=0.88) Both flat and partition vector rows had `text: ""` while retaining embeddings.

## Frames

(己, p=0.86) This closes the “new writes reintroduce full text into vector Mongo collections” hole for documents with a source path, URL, or hostname.

(己, p=0.82) Search can still work because embeddings are generated before redaction; consumers must hydrate snippets from `source_ref` + offsets rather than vector-row `text`.

(己, p=0.78) Existing vector rows still need Migration 2 apply/backfill to remove old text already stored before this change.

## Countermoves

(己, p=0.88) I did not broadly apply Migration 2; only a small live smoke document was inserted to verify write-path behavior.

(己, p=0.84) Root still reports `orgs/open-hax/openplanner` modified because that submodule contains pre-existing dirty content (`packages/agents/knoxx`, `pnpm-workspace.yaml`, notes, migration_pitfalls). The code I changed is committed.

(己, p=0.82) Query results for newly redacted vector docs will return empty `documents[]` entries unless callers hydrate using metadata. That is intentional but the query API may need explicit hydration next.

## Next

(己, p=0.9) Next action: update vector search response hydration so semantic search results use `source_ref` + `char_start/char_end` to return hydrated snippets instead of empty `documents[]`.
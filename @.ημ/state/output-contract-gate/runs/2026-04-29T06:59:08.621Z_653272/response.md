## Signal

(己, p=0.94) Continued and completed vector hit hydration.

(己, p=0.92) Vector search now returns hydrated document snippets for redacted vector rows by using:

- `source_ref.source_path`
- `char_start`
- `char_end`
- `OPENPLANNER_SOURCE_ROOT`

(己, p=0.9) Mongo vector storage remains redacted:

- `event_chunks.text === ""`
- `event_chunks__*.text === ""`

but `/v1/search/vector` returns the hydrated snippet in `result.documents`.

(己, p=0.9) Commits created:

- OpenPlanner: `e2241f5 Hydrate redacted vector search hits`
- Root workspace pointer: `eee047f4 Advance OpenPlanner vector hit hydration`

## Evidence

(己, p=0.93) Changed file:

- `orgs/open-hax/openplanner/src/lib/mongo-vectors.ts`
- `orgs/open-hax/openplanner/receipts.edn`

(己, p=0.94) Verification passed:

- `pnpm exec tsc --noEmit --pretty false`
- `pnpm test src/tests/indexing.test.ts`
- `pnpm build`
- restarted `openplanner` and `openplanner-dev`
- live `/v1/search/vector` query against `parent_id=vector-redaction-smoke-20260429`

(己, p=0.95) Live vector search smoke result:

```json
{
  "documents": [["test"]],
  "metadatas": [[
    {
      "source_text_redacted": true,
      "source_ref": {
        "source_path": "test.txt",
        "lake": "devel"
      },
      "char_start": 0,
      "char_end": 4
    }
  ]]
}
```

(己, p=0.92) Direct Mongo inspection still showed stored vector `text: ""` with embeddings retained.

## Frames

(己, p=0.88) This preserves the existing vector search response contract while changing the storage contract to reference-first.

(己, p=0.84) We now have the loop working end-to-end for source files:

1. ingest/source text enters indexing
2. embeddings are generated
3. vector row stores no text
4. query returns hydrated snippet from original source

(己, p=0.78) URL/web hydration is not fully generalized yet. File-backed source refs are covered; web markdown TTL/cache hydration remains a separate next layer.

## Countermoves

(己, p=0.87) I did not apply broad data migrations. Existing stored text remains until Migration 2 apply/backfill.

(己, p=0.84) The root still reports `orgs/open-hax/openplanner` modified because OpenPlanner contains pre-existing uncommitted work in `packages/agents/knoxx`, `pnpm-workspace.yaml`, notes, and `migration_pitfalls.md`. The files I changed are committed.

(己, p=0.82) Hydration currently reads from filesystem directly in the vector query path. It should eventually use the layered Redis/LMDB hydration cache instead of raw `readFile`.

## Next

(己, p=0.9) Next action: wire vector-hit hydration through the existing layered source hydration cache instead of direct filesystem reads.
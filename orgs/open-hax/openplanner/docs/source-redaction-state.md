# Source redaction state validation

OpenPlanner is moving toward a reference-first storage contract:

- durable event/vector stores keep source identity, hashes, offsets, and embeddings;
- full source text is hydrated from the original source or a bounded cache;
- vector search results may return hydrated snippets, but vector rows should not store full text when a source reference exists.

## Documented API surface

The OpenAPI document is available from a running service:

```bash
curl -H 'Authorization: Bearer <OPENPLANNER_API_KEY>' \
  http://127.0.0.1:7777/v1/openapi.json
```

Current OpenAPI coverage is intentionally focused on the redaction parity surface:

- `GET /v1/state/redaction`
- `POST /v1/search/vector`

## Redaction validation endpoint

```bash
curl -H 'Authorization: Bearer <OPENPLANNER_API_KEY>' \
  'http://127.0.0.1:7777/v1/state/redaction'
```

The response has this shape:

```json
{
  "ok": true,
  "status": "pass",
  "strict": false,
  "generatedAt": "2026-04-29T00:00:00.000Z",
  "checks": {
    "vectorRedaction": {
      "ok": true,
      "redactedWithStoredText": 0,
      "redactedMissingSourceRef": 0,
      "redactedMissingOffsets": 0
    },
    "documentBacklog": {
      "ok": false,
      "rehydratableEventsWithText": 57702,
      "redactedEvents": 10
    }
  },
  "collections": []
}
```

### Status semantics

- `pass`: vector redaction parity holds and no Migration 2 document backlog remains.
- `warn`: vector redaction parity holds, but rehydratable document/event text remains awaiting Migration 2 apply/backfill.
- `fail`: redacted vector rows still store text, redacted vector rows lack source refs, or `strict=true` was requested while document backlog remains.

`strict=true` promotes the Migration 2 backlog from warning to failure:

```bash
curl -H 'Authorization: Bearer <OPENPLANNER_API_KEY>' \
  'http://127.0.0.1:7777/v1/state/redaction?strict=true'
```

## Parity checks

The validation endpoint currently checks:

1. Flat and partition vector collections have no rows where:
   - `source_text_redacted=true`, and
   - `text` is still a non-empty string.
2. Redacted vector rows retain a `source_ref`.
3. Redacted vector rows report missing offset metadata as a count.
4. Document/event rows with source refs and non-empty text are counted as Migration 2 backlog.

## Vector search hydration contract

For source-backed vector hits:

- Mongo vector rows store `text: ""`.
- Metadata includes `source_text_redacted`, `source_ref`, `char_start`, and `char_end`.
- `POST /v1/search/vector` hydrates the snippet into `result.documents` before returning.

Example smoke query:

```bash
curl -H 'Authorization: Bearer <OPENPLANNER_API_KEY>' \
  -H 'Content-Type: application/json' \
  --data '{"q":"test","k":5,"tier":"hot","where":{"parent_id":"vector-redaction-smoke-20260429"}}' \
  http://127.0.0.1:7777/v1/search/vector
```

Expected result:

- `result.documents[0][0]` contains the hydrated source snippet.
- `result.metadatas[0][0].source_text_redacted` is `true`.
- Direct Mongo inspection of the same vector row still shows `text: ""`.

## Known remaining work

- Apply/backfill Migration 2 across existing source-backed document/event rows.
- Wire vector hydration through the layered Redis/LMDB hydration cache instead of direct file reads.
- Extend source hydration to URL/web markdown TTL sources.
- Add more route schemas to the OpenAPI document as those APIs stabilize.

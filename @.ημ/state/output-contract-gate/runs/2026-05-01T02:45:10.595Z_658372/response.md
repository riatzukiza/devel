## Signal

(己, p=0.97) Translation rules now work as a hybrid: ClojureScript owns the domain decisions; TypeScript still owns HTTP, MongoDB, timestamps, and response wiring.

Current rule package:

```text
@open-hax/openplanner-translation-core
```

Implemented in:

```text
packages/translations/translation-core/src/openplanner/translations/core.cljs
packages/translations/translation-core/src/openplanner/translations/boundary.cljs
```

Used by:

```text
src/routes/v1/translations.ts
```

## Evidence

(己, p=0.96) The current exported rule functions are:

```ts
nextSegmentStatus(input)
documentOverallStatus(input)
summarizeSegments(segments)
normalizeTranslationSegment(input)
translationGraphMemoryPlan(input)
```

(己, p=0.95) Segment label review status rules:

```text
overall = approve
  -> segment status = approved

overall = needs_edit + corrected_text present
  -> segment status = approved

overall = needs_edit + no corrected_text
  -> segment status = in_review

overall = reject
  -> segment status = rejected

unknown overall
  -> keep current segment status, defaulting to pending
```

(己, p=0.94) Segment normalization rules:

```text
source_text       -> required, trimmed string
translated_text   -> required, trimmed string
source_lang       -> default "en"
target_lang       -> required, trimmed string
document_id       -> required, trimmed string
segment_index     -> number/long, default 0
status            -> one of pending, in_review, approved, rejected; default pending
mt_model          -> optional trimmed string
confidence        -> optional finite number
domain            -> optional trimmed string
content_type      -> optional trimmed string
url_context       -> optional trimmed string
garden_id         -> optional trimmed string
org_id            -> optional trimmed string
project           -> optional trimmed string
```

If required fields are missing, `normalizeTranslationSegment(...)` returns an `errors` array instead of throwing.

(己, p=0.93) Required fields are:

```text
source_text
translated_text
target_lang
document_id
```

Missing fields produce errors like:

```ts
{ path: ["source-text"], error: "required" }
```

through the CLJS boundary, converted to JS objects.

(己, p=0.94) Document aggregate status rules:

```text
approved === total && total > 0
  -> fully_approved

rejected === total && total > 0
  -> fully_rejected

pending === total && total > 0
  -> pending_review

pending > 0
  -> partial_review

otherwise
  -> mixed
```

(己, p=0.94) Segment summary rules count statuses across a segment list:

```text
total_segments
approved
pending
rejected
in_review
overall_status
```

Then `overall_status` is derived with the document aggregate rules above.

(己, p=0.93) Graph memory planning rules:

When a translation is approved, CLJS builds a pure data plan:

```text
translation example node
document -> translation edge
```

The node shape is conceptually:

```ts
{
  id: "translation:<source_lang>:<target_lang>:<segment_id>",
  kind: "translation_example",
  label: "<source_lang>→<target_lang>: <first 50 chars>...",
  data: {
    source_text,
    target_text,
    source_lang,
    target_lang,
    document_id,
    domain,
    content_type,
    quality: "approved",
    segment_id
  }
}
```

The edge shape is conceptually:

```ts
{
  id: "translation:doc:<document_id>:<segment_id>",
  source: document_id,
  target: node_id,
  kind: "has_translation",
  data: {
    source_lang,
    target_lang
  }
}
```

If source or target text is missing, the graph-memory plan returns:

```ts
{ "ok?": false, error: "Missing source or target text" }
```

(己, p=0.92) TypeScript still performs the side effects:

```text
HTTP request handling
Mongo queries/writes
ObjectId parsing
timestamps
Fastify reply status
collection indexes
job queue persistence
export response headers
```

## Frames

(己, p=0.92) The important boundary is: CLJS decides what should happen; TS performs it.

(己, p=0.89) This means translation review behavior is now easier to port, test, and reason about because the status rules are pure functions.

(己, p=0.86) It is not yet a full translation-domain extraction. The route still contains plenty of business-adjacent logic, especially export formatting, job creation, manifest aggregation shaping, and Mongo query assembly.

## Countermoves

(己, p=0.9) Do not assume all translation rules are in CLJS yet.

(己, p=0.88) The current CLJS package owns status/normalization/summary/graph-memory plan rules, not worker scheduling or SFT export generation.

(己, p=0.84) The graph-memory rule is a pure plan only. The actual `graph_nodes` and `graph_edges` upserts still happen in TypeScript.

## Next

(己, p=0.91) Move SFT prompt construction and export manifest shaping into `translation-core` next.
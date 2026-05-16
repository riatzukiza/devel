## Signal

(己, p=0.93) The multi-layer embedding architecture is now implemented in **OpenPlanner ingest**, without truncation, by **deriving chunk + sentence nodes** and wiring them into the graph with edges back to the original document node.

(己, p=0.92) Document-level → chunk-level:
- (己, p=0.9) On `graph.node` ingest, we run `prepareIndexDocument(...)` and **split oversized node bodies into ~180k-char chunks** (config: `targetChunkChars: 180_000`, `targetChunkTokens: 32_000`, `overlapChars: 1_000`).
- (己, p=0.9) If chunking happens, we **create derived graph.node events** for each chunk with node IDs like:  
  (己, p=0.9) `<docNodeId>#chunk:0000`, `<docNodeId>#chunk:0001`, …
- (己, p=0.9) We add edges:  
  (己, p=0.9) `docNodeId -[contains_chunk]-> chunkNodeId`
- (己, p=0.9) We embed **chunk nodes** (not the oversized parent body), so the embedder never sees the 336k-char payload.

(己, p=0.92) Sentence-level nodes + graph wiring:
- (己, p=0.9) We split sentences from the normalized text (and per-chunk text when chunked).
- (己, p=0.9) Sentences become **stable nodes** keyed by **sha256** hash, deduped **within a project**:
  - (己, p=0.9) `sentenceNodeId = ${project}:sentence:${sha256(sentenceLower)}`
- (己, p=0.9) We create derived graph.node events for sentences and add edges:
  - (己, p=0.9) `docNodeId -[contains_sentence]-> sentenceNodeId`
- (己, p=0.9) This means the *same sentence* appearing in multiple docs in the same project will converge on the same sentence node ID (dedupe by hash).

(己, p=0.9) “Don’t re-embed duplicates”:
- (己, p=0.86) Before embedding queued graph nodes/sentences/chunks, we query `graphNodeEmbeddings` for existing `{node_id, embedding_model}` and **skip embedding** when the stored `text` matches the queued `text`.

(己, p=0.9) Instruction-tuning hooks (query prefix/templates):
- (己, p=0.88) Added env-controlled formatting for embedding text:
  - (己, p=0.88) `EMBED_QUERY_TEMPLATE` / `EMBED_QUERY_PREFIX` applied to **queries**
  - (己, p=0.88) `EMBED_PASSAGE_TEMPLATE` / `EMBED_PASSAGE_PREFIX` applied to **indexed passages** (graph node embeddings + materialize endpoint)
- (己, p=0.9) Query-side formatting is now used by:
  - (己, p=0.9) `queryMongoVectorsByText(...)` (so `/graph/similar` benefits)
  - (己, p=0.9) `/graph/memory` (direct embedding generation now uses the query formatter)

(己, p=0.8) Note: `packages/agents/knoxx` is currently a dirty submodule in this workspace; I did not stage or commit changes there.

## Evidence

(己, p=0.95) Code changes (OpenPlanner):
- (己, p=0.95) `src/routes/v1/events.ts` — derive chunk nodes + sentence nodes, add edges, queue embeddings, skip re-embedding when text unchanged.
- (己, p=0.95) `src/routes/v1/graph.ts` — `/graph/node-embeddings/materialize` now chunks oversized inputs into `#chunk:` IDs (no truncation) and applies passage formatting; `/graph/memory` applies query formatting.
- (己, p=0.9) `src/lib/sentence-split.ts` — sentence hashing upgraded to sha256; token estimate improved.
- (己, p=0.9) `src/lib/embedding-text.ts` — env-driven query/passage templates.
- (己, p=0.85) `src/lib/mongo-vectors.ts` — query embedding generation uses `formatEmbeddingQueryText(...)`.
- (己, p=0.8) `src/plugins/tenant.ts` — public allowlist includes `/v1/graph/node-embeddings/query` + `/v1/graph/node-embeddings/materialize`.

(己, p=0.95) Build verification:
- (己, p=0.95) `pnpm run build` succeeded in `orgs/open-hax/openplanner` after fixing a `noImplicitAny` error.

(己, p=0.9) Git:
- (己, p=0.9) Commit: `90402a5` in `orgs/open-hax/openplanner` (“graph embeddings: doc chunking, sentence nodes, query templates”).

## Frames

(己, p=0.72) Frame 1: “We were embedding, but not building the multi-scale graph.”  
Now the graph structure exists (doc→chunk, doc→sentence) and embeddings exist at multiple granularities.

(己, p=0.66) Frame 2: “The embedder limit isn’t a bug, it’s a representational mismatch.”  
Instead of fighting the 200k-char guard, oversized docs become **multiple first-class chunk nodes** with edges, preserving all text without truncation.

(己, p=0.64) Frame 3: “Instruction tuning is only safe if it’s consistent.”  
We added env-controlled templates; you can turn them on deliberately (and re-embed as needed) instead of silently changing embedding semantics.

## Countermoves

(己, p=0.84) Validate the no-truncation invariant:
- (己, p=0.84) For an oversized doc, confirm the concatenation of chunk texts (accounting for overlap) covers the full normalized text.

(己, p=0.8) Guard against graph bloat:
- (己, p=0.8) Sentence nodes can explode cardinality; you may want a minimum length/token threshold higher than `> 3 tokens`, or add a cap per document.

(己, p=0.78) Confirm dedupe actually prevents re-embedding:
- (己, p=0.78) Re-ingest the same doc and verify logs show fewer/new embedding calls and `graph_node_embeddings` doesn’t churn.

## Next

(己, p=0.9) Re-run the ingest that produced `336K chars > 200K limit` and confirm it now emits `contains_chunk` + `contains_sentence` edges and completes without embedder 400s.
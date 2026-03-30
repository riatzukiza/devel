# OpenPlanner (API-first skeleton)

Local-first personal data lake for LLM session archives with:

- DuckDB for storage + FTS search
- ChromaDB for vector search

This is a complete runnable **project skeleton**. See `spec/` for scope.

## Quick start

```bash
npm install
docker compose up -d
cp .env.example .env
npm run dev
```

Container-first workflow from the workspace root:

```bash
pnpm docker:stack up openplanner -- --build
pnpm docker:stack ps openplanner
pnpm docker:stack logs openplanner -- -f
```

This stack now owns both the `openplanner` app on `7777` and `chroma` on `8000`.
If `8000` is already in use on the host, override it with `OPENPLANNER_CHROMA_PORT=<port>`.
When the root `ollama` stack is running, `openplanner` can use it over the shared `ai-infra` Docker network.

Auth header:

```
Authorization: Bearer <OPENPLANNER_API_KEY>
```

Embedding model selection knobs:

- `OLLAMA_EMBED_MODEL`: hot/raw collection model
- `OLLAMA_EMBED_MODEL_BY_PROJECT`: per-project overrides for the hot/raw collection
- `OLLAMA_EMBED_MODEL_BY_SOURCE`: per-source overrides for the hot/raw collection
- `OLLAMA_EMBED_MODEL_BY_KIND`: per-kind overrides for the hot/raw collection
- `CHROMA_COMPACT_COLLECTION`: secondary compacted semantic collection
- `OLLAMA_COMPACT_EMBED_MODEL`: embedding model for compacted semantic packs

Override precedence for the hot/raw collection is `project -> source -> kind -> default`.
Override values accept either JSON (`{"chatgpt":"qwen3-embedding:4b"}`) or pair list (`chatgpt=qwen3-embedding:4b;discord=qwen3-embedding:0.6b`).

Semantic compaction knobs:

- `SEMANTIC_COMPACTION_ENABLED`
- `SEMANTIC_COMPACTION_MIN_EVENTS`
- `SEMANTIC_COMPACTION_MAX_NEIGHBORS`
- `SEMANTIC_COMPACTION_CHAR_BUDGET`
- `SEMANTIC_COMPACTION_DISTANCE_THRESHOLD`
- `SEMANTIC_COMPACTION_MIN_CLUSTER_SIZE`
- `SEMANTIC_COMPACTION_MAX_PACKS_PER_RUN`

## Endpoints (MVP)

- `POST /v1/blobs` (multipart) -> sha256
- `GET /v1/blobs/:sha256`
- `POST /v1/events` -> upsert events into DuckDB
- `POST /v1/search/fts` -> keyword search
- `POST /v1/search/vector` -> vector search (assumes embeddings exist in Chroma)
- `GET /v1/sessions`
- `GET /v1/sessions/:sessionId`
- `GET /v1/jobs` + job creation stubs

See `spec/01-api-contract.md`.

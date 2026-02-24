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

Auth header:

```
Authorization: Bearer <OPENPLANNER_API_KEY>
```

Embedding model selection knobs:

- `OLLAMA_EMBED_MODEL`: default model (existing behavior)
- `OLLAMA_EMBED_MODEL_BY_PROJECT`: per-project overrides
- `OLLAMA_EMBED_MODEL_BY_SOURCE`: per-source overrides
- `OLLAMA_EMBED_MODEL_BY_KIND`: per-kind overrides

Override precedence is `project -> source -> kind -> default`.
Override values accept either JSON (`{"chatgpt":"qwen3-embedding:4b"}`) or pair list (`chatgpt=qwen3-embedding:4b;discord=qwen3-embedding:0.6b`).

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

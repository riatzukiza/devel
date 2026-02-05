---
uuid: "a1f17b44-2ca4-4d1e-8646-e9c345d1bf0f"
title: "API contract (v1)"
slug: "openplanner-api-contract"
status: "icebox"
priority: "P2"
labels: ["get", "api", "post", "contract"]
created_at: "2026-02-04T13:36:54Z"
estimates:
  complexity: ""
  scale: ""
  time_to_completion: ""
---

# API contract (v1)

Base: `/v1`

Auth: `Authorization: Bearer <OPENPLANNER_API_KEY>`

## Implemented

- `GET /v1/health`
- `POST /v1/blobs` (multipart field `file`)
- `GET /v1/blobs/:sha256`
- `POST /v1/events` (upsert into DuckDB)
- `POST /v1/search/fts` (DuckDB FTS if available; fallback to ILIKE scan)
- `POST /v1/search/vector` (Chroma query; assumes embeddings already exist)
- `GET /v1/sessions`
- `GET /v1/sessions/:sessionId`
- `GET /v1/jobs`
- `GET /v1/jobs/:id`
- `POST /v1/jobs/import/chatgpt` (stub)
- `POST /v1/jobs/import/opencode` (stub)
- `POST /v1/jobs/compile/pack` (stub)

## Event schema (openplanner.event.v1)

Envelope fields:
- `schema`, `id`, `ts`, `source`, `kind`

Normalized fields:
- `source_ref`: project/session/message identifiers
- `text`: searchable string
- `attachments`: list of blob refs
- `meta`: role/author/model/tags
- `extra`: freeform JSON for source-specific payloads

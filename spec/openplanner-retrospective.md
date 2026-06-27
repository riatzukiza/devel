---
uuid: "bd9dee14-4694-41d7-8fa4-6d3d8ca7f6d3"
title: "What I did and didn’t accomplish in this delivery"
slug: "openplanner-retrospective"
status: "icebox"
priority: "P2"
labels: ["fts", "what", "did", "didn"]
created_at: "2026-02-04T13:36:54Z"
estimates:
  complexity: ""
  scale: ""
  time_to_completion: ""
---

# What I did and didn’t accomplish in this delivery

## ✅ Done (delivered in code)

- A runnable Fastify + TypeScript server
- API-key auth (single-user local-first)
- DuckDB storage with an `events` table
- Best-effort DuckDB FTS enablement:
  - tries `INSTALL fts; LOAD fts; PRAGMA create_fts_index(...)`
  - if unavailable, `/v1/search/fts` falls back to `ILIKE` scanning
- Content-addressed blob store:
  - `POST /v1/blobs` uploads a file and stores it at `blobs/sha256/<aa>/<bb>/<sha256>`
  - `GET /v1/blobs/:sha256` downloads it
- Event ingest:
  - `POST /v1/events` upserts events into DuckDB
- Session aggregation endpoints:
  - list sessions
  - retrieve a session timeline
- Chroma wiring and a vector query endpoint:
  - `POST /v1/search/vector` calls Chroma `collection.query(...)`
- Minimal job ledger:
  - append-only JSONL job records + API endpoints to create/list/get jobs

## ❌ Not done (explicitly out of scope for this skeleton)

- ChatGPT export importer (zip parsing + normalization)
- OpenCode importer (reading sessions/snapshots)
- Embedding generation pipeline (qwen3-embedding)
- Image caption pipeline (qwen3-vl)
- Pack compiler (SPEC/DECISIONS/TODO/MANIFEST creation)
- Durable worker process that executes jobs
- UI

## Why these are not done

You asked for a **complete project skeleton** that is API-first and uses only DuckDB + Chroma.
The missing pieces are the “domain work” you’ll likely iterate on quickly (importers, embeddings, pack compiler),
and they benefit from being added after the API/stores are stable.

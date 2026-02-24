---
title: "0) Run Chroma + Ollama"
status: incoming
source_note: "reconstitute/docs/notes/reconstitute/chroma-fs-embeddings.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# 0) Run Chroma + Ollama

## Context
- Source note: `reconstitute/docs/notes/reconstitute/chroma-fs-embeddings.md`
- Category: `reconstitute`

## Draft Requirements
- walks a directory
- chunks text-ish files
- generates embeddings via **Ollama** (`/api/embed`)
- stores them in **Chroma** (running as a server)
- supports `index` + `search`
- chroma-fs.mjs
- Index:
- node chroma-fs.mjs index ./myrepo --collection myrepo --model qwen3-embedding
- Search:
- node chroma-fs.mjs search "where do we init websocket client" --collection myrepo --k 8
- Options:
- --chroma  http://localhost:8000

## Summary Snippets
- Below is a **single-file Node.js CLI** that:
- * walks a directory * chunks text-ish files * generates embeddings via **Ollama** (`/api/embed`) * stores them in **Chroma** (running as a server) * supports `index` + `search`

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

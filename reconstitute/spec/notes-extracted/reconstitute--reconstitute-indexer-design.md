---
title: "Data model (recommended)"
status: incoming
source_note: "reconstitute/docs/notes/reconstitute/reconstitute-indexer-design.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Data model (recommended)

## Context
- Source note: `reconstitute/docs/notes/reconstitute/reconstitute-indexer-design.md`
- Category: `reconstitute`

## Draft Requirements
- **Index everything** from OpenCode sessions → Chroma (semantic search)
- **Store exact chat-replay artifacts** (OpenCode → Ollama message arrays) in **LevelDB**
- `reconstitute <path>` runs iterative loops:
- semantic search for that path + related questions
- build an **Ollama-ready `messages[]` context**
- run a local agent (`qwen3-vl:8b-instruct`) with tool-calls to:
- extract/record more paths
- answer your fixed questions
- accumulate descriptions per-path
- Export a **markdown tree** mirroring the recovered folder structure
- `id`: `${sessionId}:${messageIndex}`
- `document`: a normalized text string (good for debugging + embeddings)

## Summary Snippets
- 1. **Index everything** from OpenCode sessions → Chroma (semantic search) 2. **Store exact chat-replay artifacts** (OpenCode → Ollama message arrays) in **LevelDB** 3. `reconstitute <path>` runs iterative loops:
- * semantic search for that path + related questions * build an **Ollama-ready `messages[]` context** * run a local agent (`qwen3-vl:8b-instruct`) with tool-calls to:

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

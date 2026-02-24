---
title: "Next step: turn this into the actual `reconstitute` CLI"
status: incoming
source_note: "reconstitute/docs/notes/reconstitute/reconstitute-full-cli.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Next step: turn this into the actual `reconstitute` CLI

## Context
- Source note: `reconstitute/docs/notes/reconstitute/reconstitute-full-cli.md`
- Category: `reconstitute`

## Draft Requirements
- `reconstitute index`
- `reconstitute search "<query>"`
- `reconstitute run <path>`
- **run-isolated state** (paths + descriptions + notes)
- **adaptive multi-query search** (union + dedupe + windowing)
- **path extraction passes** (repeat until no new paths)
- exports a **markdown tree** of recovered descriptions
- embeddings (`qwen3-embedding:8b`, `num_ctx=32768`)
- agent chat (`qwen3-vl:8b-instruct`) with tool-calling
- `run:<runId>:recorded_paths`
- `run:<runId>:desc:path:<p>`
- `run:<runId>:processed`

## Summary Snippets
- Below is a **single CLI** that supports:
- * `reconstitute index` Index **all** OpenCode sessions → ChromaDB and store **Ollama-ready replay blobs** in LevelDB. * `reconstitute search "<query>"` Returns an **Ollama chat-ready** `context_messages[]` array (plus minimal debug). * `reconstitute run <path>` Runs the full reconstruction loop with:

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

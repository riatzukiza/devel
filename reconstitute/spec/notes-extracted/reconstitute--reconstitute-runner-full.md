---
title: "`reconstitute` runner (single-file TypeScript CLI)"
status: incoming
source_note: "reconstitute/docs/notes/reconstitute/reconstitute-runner-full.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# `reconstitute` runner (single-file TypeScript CLI)

## Context
- Source note: `reconstitute/docs/notes/reconstitute/reconstitute-runner-full.md`
- Category: `reconstitute`

## Draft Requirements
- loads **Ollama-ready message blobs** from **LevelDB** (produced by your indexer)
- does **Chroma semantic search** over indexed OpenCode messages
- builds an **Ollama `messages[]` context array**
- runs a **tool-using agent** on `qwen3-vl:8b-instruct` (or whatever you set)
- uses tools to:
- record paths
- maintain per-path descriptions
- store/search notes
- search sessions (returns context arrays)
- iterates paths until exhausted
- exports a **markdown tree** mirroring the recovered directory structure
- `reconstitute path/to/lost/code`

## Summary Snippets
- This is a **complete “runner”** that:
- * loads **Ollama-ready message blobs** from **LevelDB** (produced by your indexer) * does **Chroma semantic search** over indexed OpenCode messages * builds an **Ollama `messages[]` context array** * runs a **tool-using agent** on `qwen3-vl:8b-instruct` (or whatever you set) * uses tools to:

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

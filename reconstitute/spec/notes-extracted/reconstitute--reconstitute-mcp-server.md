---
title: "MCP server: session search + session reconstitution (OpenCode → Ollama chat context)"
status: incoming
source_note: "reconstitute/docs/notes/reconstitute/reconstitute-mcp-server.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# MCP server: session search + session reconstitution (OpenCode → Ollama chat context)

## Context
- Source note: `reconstitute/docs/notes/reconstitute/reconstitute-mcp-server.md`
- Category: `reconstitute`

## Draft Requirements
- **semantic search** your **indexed OpenCode sessions** stored in a **remote Chroma** collection, using **Ollama** embeddings (`qwen3-embedding:8b`)
- **reconstitute** a session (or search hits) into **Ollama `/api/chat`-compatible `messages[]`**, including **tool-call + tool-result** message shapes
- `index_sessions(limit_sessions)`
- `search_sessions(query, metadata_filter?, result_limit?, threshold?, context_window?)` → returns:
- `hits[]` with metadata and distance
- `ollama_messages[]` you can pass directly into an Ollama `/api/chat` call as `messages`
- `discovered_paths[]` extracted from those messages
- `reconstitute_session(session_id, from_index?, to_index?)` → returns `ollama_messages[]`
- `take_note(title, body)` / `list_notes()` / `search_notes(query, ...)`
- `record_path(path)` / `list_recorded_paths()`
- `get_file_description(path)` / `describe_file(path, text)`
- `reconstitute(root_path, questions[], max_iters, threshold, result_limit)`

## Summary Snippets
- This is a **TypeScript MCP stdio server** that exposes tools to:
- * **semantic search** your **indexed OpenCode sessions** stored in a **remote Chroma** collection, using **Ollama** embeddings (`qwen3-embedding:8b`) * **reconstitute** a session (or search hits) into **Ollama `/api/chat`-compatible `messages[]`**, including **tool-call + tool-result** message shapes

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

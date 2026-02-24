---
title: "✅ What you’re doing right"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon/ollama-tool-calling-analysis.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# ✅ What you’re doing right

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon/ollama-tool-calling-analysis.md`
- Category: `cephalon`

## Draft Requirements
- call the model
- execute tools
- stop
- call the model → it returns `tool_calls`
- execute tools
- append **role: "tool"** messages with results
- call the model again to get the final response
- repeat until no more `tool_calls`
- run *all* tool calls (parallel calls supported) ([Ollama Docs][1])
- append tool outputs
- call model again and publish/send final content
- tool results are added as `{ role: "tool", tool_name, content }` ([Ollama Docs][1])

## Summary Snippets
- Mostly yes — **your request shape for tools matches Ollama’s `/api/chat` tool-calling API**, but a couple details are off, and you’re missing the *most important* step: **send tool results back to the model and loop until it stops calling tools**.
- This part matches Ollama’s documented format: `tools: [{ type: "function", function: { name, description, parameters } }]`. ([Ollama Docs][1])

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

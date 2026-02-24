---
title: "Cephalon TS ➜ shadow-cljs carryover notes #cephalon #shadow-cljs #promethean"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon/cephalon-ts-to-shadow-cljs-migration.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Cephalon TS ➜ shadow-cljs carryover notes #cephalon #shadow-cljs #promethean

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon/cephalon-ts-to-shadow-cljs-migration.md`
- Category: `cephalon`

## Draft Requirements
- `:llm/chat` ➜ runner calls Ollama/OpenAI, emits `:llm/chat.result` event
- `:tool/exec` ➜ runner calls a tool handler, emits `:tool/result`
- `:discord/send` / `:discord/fetch` ➜ runner hits Discord client, emits `:discord/...` events
- `:memory/insert` / `:memory/search` / `:memory/pin` ➜ runner updates store(s), emits `:memory/...`
- what the model is told (“tool schema”)
- what you actually implement (“handler”)
- registry is data (schemas + handler fns)
- “tool definitions for LLM” is derived from registry
- “executor dispatch” is derived from registry
- assemble context
- call LLM
- if tool calls: append assistant tool_calls → execute tools → append tool results → repeat

## Summary Snippets
- ([Past chat][1])([Past chat][1])([Past chat][2])([Past chat][3])([Past chat][3])
- You’ve already got the *right* shape in the CLJS version: an ECS-ish “world” plus an **effects queue** (`:effects`) where side effects happen outside the pure systems loop. That is the perfect place to import almost everything that made the TypeScript version “work”.

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

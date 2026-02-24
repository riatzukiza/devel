---
title: "MVP contracts (implementation-ready): minting rules, aggregates, GC queries, tools, janitor loop #cephalon #memory #gc #dedupe"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-mvp-contracts.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# MVP contracts (implementation-ready): minting rules, aggregates, GC queries, tools, janitor loop #cephalon #memory #gc #dedupe

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-mvp-contracts.md`
- Category: `cephalon_cljs_ts_hybrid`

## Draft Requirements
- `discord.message.created`
- `discord.message.edited`
- `discord.message.deleted`
- `tool.call`
- `tool.result`
- `llm.assistant.message`
- `llm.think.trace` *(optional / low weight)*
- `system.tick`
- `admin.command`
- `memory.summary.created`
- `memory.compaction.deleted` *(tombstone emit)*
- it’s not an exact/near duplicate **or**

## Summary Snippets
- Use a small, explicit enum so policies stay simple:
- * `discord.message.created` * `discord.message.edited` * `discord.message.deleted` * `tool.call` * `tool.result` * `llm.assistant.message` * `llm.think.trace` *(optional / low weight)* * `system.tick` * `admin.command` * `memory.summary.created` * `memory.compaction.deleted` *(tombstone emit)*

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

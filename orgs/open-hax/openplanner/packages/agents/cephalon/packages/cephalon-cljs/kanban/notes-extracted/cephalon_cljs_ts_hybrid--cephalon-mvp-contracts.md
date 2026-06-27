---
title: "MVP contracts (implementation-ready): minting rules, aggregates, GC queries, tools, janitor loop #cephalon #memory #gc #dedupe"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-mvp-contracts.md"
extracted_at: "2026-02-12T03:01:25Z"
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-spec-notes-extracted-cephalon-cljs-ts-hybrid-cephalon-mvp-contracts-md"
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:26.950Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-mvp-contracts.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-mvp-contracts.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/kanban/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-mvp-contracts.md`
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

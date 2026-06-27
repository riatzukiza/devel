---
title: "Context assembly implementation (token accounting + summary substitution) #cephalon #context"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-context-assembly.md"
extracted_at: "2026-02-12T03:01:25Z"
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-spec-notes-extracted-cephalon-cljs-ts-hybrid-cephalon-context-assembly-md"
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:26.909Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-context-assembly.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-context-assembly.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/kanban/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-context-assembly.md`
# Context assembly implementation (token accounting + summary substitution) #cephalon #context

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-context-assembly.md`
- Category: `cephalon_cljs_ts_hybrid`

## Draft Requirements
- `windowTokens` (e.g. 65536 / 131072 / 262144)
- `policy` (your EDN knobs)
- `sessionId`, `cephalonId`
- `currentEvent` (or “tick intent”)
- pools:
- `persistent[]` (pinned memories)
- `recent[]` (session ring buffer, last N events as memories)
- `relatedCandidates[]` (retrieval results)
- `messages[]` for the provider call, already ordered and token-fit
- `contextLog` with `(memory_id, tokensIncluded)` for access tracking
- `related` (drop lowest score)
- swap clusters to summaries (related first, then recent)

## Summary Snippets
- This continues with **(1) Context assembly implementation**: how to deterministically pack `[persistent, recent, related]` into a variable context window (64k/128k/256k), while deduping and swapping clusters for summaries when needed.
- ---

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

---
title: "Daimoi v0.1: deterministic graph-walk retrieval over nexus keys + vectors #daimoi #nexus #retrieval"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-daimoi-v01.md"
extracted_at: "2026-02-12T03:01:25Z"
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-spec-notes-extracted-cephalon-cljs-ts-hybrid-cephalon-daimoi-v01-md"
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:26.899Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-daimoi-v01.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-daimoi-v01.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/kanban/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-daimoi-v01.md`
# Daimoi v0.1: deterministic graph-walk retrieval over nexus keys + vectors #daimoi #nexus #retrieval

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-daimoi-v01.md`
- Category: `cephalon_cljs_ts_hybrid`

## Draft Requirements
- **vector retrieval** (canonical + eidolon lanes)
- **nexus keys** (tags, paths, urls, tool names, channels, error families)
- **field state** (digest + chemistry tags)
- **GC + summaries** (replace clusters)
- deterministic
- budgeted
- prefers summaries/aggregates
- respects deletions
- produces a `related` set that *feels like associative memory*
- starts from a seed memory
- activates a small set of nexus keys on that memory
- walks key → neighbors (other memories sharing the key)

## Summary Snippets
- You already have:
- * **vector retrieval** (canonical + eidolon lanes) * **nexus keys** (tags, paths, urls, tool names, channels, error families) * **field state** (digest + chemistry tags) * **GC + summaries** (replace clusters)

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

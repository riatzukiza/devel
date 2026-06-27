---
title: "Nexus Index v0.1: scalable metadata graph for “everything the agent has seen” #nexus #index #metadata #retrieval"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon/cephalon-nexus-index-v01.md"
extracted_at: "2026-02-12T03:01:25Z"
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-spec-notes-extracted-cephalon-cephalon-nexus-index-v01-md"
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:26.920Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon--cephalon-nexus-index-v01.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon--cephalon-nexus-index-v01.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/kanban/notes-extracted/cephalon--cephalon-nexus-index-v01.md`
# Nexus Index v0.1: scalable metadata graph for “everything the agent has seen” #nexus #index #metadata #retrieval

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon/cephalon-nexus-index-v01.md`
- Category: `cephalon`

## Draft Requirements
- incremental
- bounded
- summary/aggregate-aware
- cheap to query (neighbors + degree)
- safe under GC (no ghost links)
- `degree` (how many memories reference it)
- neighbor lists (IDs of memories) for fast expansion:
- `recent_neighbors` (newest first)
- `useful_neighbors` (highest inclusion/utility first)
- `summary_neighbors` (prefer summaries/aggregates)
- optional: `co_keys` (keys frequently co-occurring with K)
- `tag:topic/dedupe`

## Summary Snippets
- Your premise is strong: **don’t index “files” or “websites” as special categories**—index *tool calls and their results*, plus *all events*. Then “files/websites” are just nexus keys (path/url) that naturally become hubs.
- To make that scale, the Nexus Index needs to be:

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

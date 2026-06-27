---
title: "Nexus Index v0.1: scalable metadata graph for “everything the agent has seen” #nexus #index #metadata #retrieval"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-nexus-index-v01.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Nexus Index v0.1: scalable metadata graph for “everything the agent has seen” #nexus #index #metadata #retrieval

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-nexus-index-v01.md`
- Category: `cephalon_cljs_ts_hybrid`

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

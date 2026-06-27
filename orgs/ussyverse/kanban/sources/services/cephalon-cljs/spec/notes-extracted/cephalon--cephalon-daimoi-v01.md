---
title: "Daimoi v0.1: deterministic graph-walk retrieval over nexus keys + vectors #daimoi #nexus #retrieval"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon/cephalon-daimoi-v01.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Daimoi v0.1: deterministic graph-walk retrieval over nexus keys + vectors #daimoi #nexus #retrieval

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon/cephalon-daimoi-v01.md`
- Category: `cephalon`

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

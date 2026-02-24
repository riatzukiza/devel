---
title: "1) Built a **hybrid workspace layout**"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon/cephalon-hybrid-event-package.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# 1) Built a **hybrid workspace layout**

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon/cephalon-hybrid-event-package.md`
- Category: `cephalon`

## Draft Requirements
- `src/core/mongodb-memory-store.ts`
- `src/core/memory-store.ts` (in-memory fallback)
- Mongo event store (`MongoEventStore`)
- Mongo cursor store (`MongoCursorStore`)
- Mongo change streams (watching inserts)
- **MongoEventBus when `MONGODB_URI` is set**
- otherwise fallback to `InMemoryEventBus`
- **MongoDBMemoryStore when memory persistence is configured**
- otherwise fallback to `InMemoryMemoryStore`
- shutdown cleanup only when supported (`cleanup` is not on in-memory store)
- `cephalon-mvp-spec.md`
- `brain-daemon-skeleton.md`

## Summary Snippets
- I assembled a new repo structure (in-progress) like this:
- ```text cephalon-hybrid/ package.json pnpm-workspace.yaml services/ cephalon-ts/ # your working TS service (source) packages/ event/ # @promethean-os/event persistence/ # @promethean-os/persistence utils/ # @promethean-os/utils fsm/ # @promethean-os/fsm cephalon-cljs/ # CLJS “brain” package (source only) docs/ notes/ # extracted design+planning notes ```

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?

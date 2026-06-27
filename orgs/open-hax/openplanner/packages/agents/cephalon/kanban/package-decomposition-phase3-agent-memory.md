---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-package-decomposition-phase3-agent-memory-md"
title: "Package Decomposition Phase 3 — Extract Agent Memory"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.910Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/package-decomposition-phase3-agent-memory.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/package-decomposition-phase3-agent-memory.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/package-decomposition-phase3-agent-memory.md`

# Package Decomposition Phase 3 — Extract Agent Memory

**Parent:** `package-decomposition-roadmap.md`
**Story Points:** 2
**Status:** todo

## Goal

Extract memory storage and retrieval into `@promethean-os/agent-memory`.

## Scope

### In Scope
- Create `@promethean-os/agent-memory` package
- Move TS `core/memory-store.ts`, `core/mongodb-memory-store.ts`, `core/memory-compactor.ts`
- Move CLJS `memory/*` namespace
- Define unified memory interface

### Out of Scope
- Mind systems (Phase 6)
- LLM layer (Phase 4)

## Tasks

- [ ] Create `packages/agent-memory/`
- [ ] Move TS memory store files
- [ ] Move CLJS memory namespace
- [ ] Define `MemoryStore` interface/protocol
- [ ] Export MongoDB and in-memory implementations
- [ ] Update imports in `cephalon-ts` and `cephalon-cljs`
- [ ] Add memory store tests

## Acceptance Criteria

- [ ] `@promethean-os/agent-memory` exists with interface
- [ ] MongoDB and in-memory implementations available
- [ ] CLJS memory namespace moved or consolidated
- [ ] Memory tests pass

## Dependencies

- Phase 0 (CLJS canonical establishment)

## Blocking

- Blocks agent-mind extraction (Phase 6)
- Blocks agent-llm extraction (Phase 4)

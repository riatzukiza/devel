---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-package-decomposition-phase6-agent-mind-md"
title: "Package Decomposition Phase 6 — Extract Agent Mind"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.898Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/package-decomposition-phase6-agent-mind.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/package-decomposition-phase6-agent-mind.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/package-decomposition-phase6-agent-mind.md`

# Package Decomposition Phase 6 — Extract Agent Mind

**Parent:** `package-decomposition-roadmap.md`
**Story Points:** 2
**Status:** todo

## Goal

Extract mind systems (local graph, eidolon, prompt field) into `@promethean-os/agent-mind`.

## Scope

### In Scope
- Create `@promethean-os/agent-mind` package
- Move TS `mind/local-mind-graph.ts`, `mind/eidolon-field.ts`, `mind/prompt-field.ts`, `mind/rss-poller.ts`
- Move CLJS `sys/eidolon.cljs`, `sys/eidolon_vectors.cljs`, `eidolon/*`
- Define mind system interfaces

### Out of Scope
- Memory layer (Phase 3)
- Personality systems (Phase 1)

## Tasks

- [ ] Create `packages/agent-mind/`
- [ ] Move TS mind system files
- [ ] Move CLJS eidolon systems
- [ ] Define `MindSystem` interface/protocol
- [ ] Export local graph, eidolon, prompt field
- [ ] Update imports in `cephalon-ts` and `cephalon-cljs`
- [ ] Add mind system tests

## Acceptance Criteria

- [ ] `@promethean-os/agent-mind` exists with interface
- [ ] Local graph, eidolon, prompt field available
- [ ] RSS poller available
- [ ] Mind system tests pass

## Dependencies

- Phase 3 (agent-memory) — mind may use memory for context

## Blocking

- None (mind is optional enhancement)

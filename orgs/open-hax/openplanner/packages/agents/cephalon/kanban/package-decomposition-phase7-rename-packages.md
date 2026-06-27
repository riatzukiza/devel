---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-package-decomposition-phase7-rename-packages-md"
title: "Package Decomposition Phase 7 — Rename Application Packages"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.909Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/package-decomposition-phase7-rename-packages.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/package-decomposition-phase7-rename-packages.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/package-decomposition-phase7-rename-packages.md`

# Package Decomposition Phase 7 — Rename Application Packages

**Parent:** `package-decomposition-roadmap.md`
**Story Points:** 1
**Status:** todo

## Goal

Rename `cephalon-ts` and `cephalon-cljs` to intent-based names.

## Scope

### In Scope
- Rename `@promethean-os/cephalon-ts` → `@promethean-os/cephalon-discord-bot`
- Rename `@promethean-os/cephalon-cljs` → `@promethean-os/cephalon-ecs`
- Update all package.json references
- Update import paths

### Out of Scope
- TS retirement (later)
- Bridge removal

## Tasks

- [ ] Rename `packages/cephalon-ts/` → `packages/cephalon-discord-bot/`
- [ ] Update package.json name
- [ ] Rename `packages/cephalon-cljs/` → `packages/cephalon-ecs/`
- [ ] Update package.json name
- [ ] Update all workspace references
- [ ] Update root README
- [ ] Verify build and tests

## Acceptance Criteria

- [ ] `@promethean-os/cephalon-discord-bot` exists
- [ ] `@promethean-os/cephalon-ecs` exists
- [ ] All workspace references updated
- [ ] Build passes
- [ ] Tests pass

## Dependencies

- All extraction phases (1-6) — package contents should be stable before rename

## Blocking

- None (rename is cosmetic)

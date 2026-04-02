# Knowledge Ops — Legacy UI Inventory

> *Every UI surface not built from `packages/ui/` is explicit technical debt, not invisible drift.*

---

## Purpose

Track all currently active UI surfaces that do **not** primarily use:
- `@devel/ui-tokens`
- `@devel/ui-react`
- `@devel/ui-reagent`

This turns UI inconsistency into managed work instead of accidental entropy.

---

## Rule

All **new** interactive UI features must use `packages/ui/`.

Any existing UI that still uses custom HTML/Tailwind/CSS directly must be listed here until migrated.

---

## Inventory

### Ragussy frontend pages

| File | Current state | Migration note |
|------|---------------|----------------|
| `orgs/mojomast/ragussy/frontend/src/pages/ChatLabPage.tsx` | legacy custom UI | migrate to `@workspace/chat-ui` + `@devel/ui-react` |
| `orgs/mojomast/ragussy/frontend/src/pages/CmsPage.tsx` | legacy custom UI | migrate cards, inputs, buttons, badges to `@devel/ui-react` |
| `orgs/mojomast/ragussy/frontend/src/pages/IngestionPage.tsx` | mostly legacy, except new browser panel | migrate shell/layout + forms gradually |
| `orgs/mojomast/ragussy/frontend/src/pages/QueryPage.tsx` | legacy custom UI | migrate shell/cards/buttons to `@devel/ui-react` |
| `orgs/mojomast/ragussy/frontend/src/pages/GardensPage.tsx` | legacy custom UI | migrate shell/cards/buttons to `@devel/ui-react` |
| `orgs/mojomast/ragussy/frontend/src/pages/RunsPage.tsx` | legacy custom UI | migrate tables/cards/buttons |
| `orgs/mojomast/ragussy/frontend/src/pages-next/*` | legacy Next-style UI | evaluate selectively |

### Partially migrated

| File | Uses `packages/ui/`? | Note |
|------|----------------------|------|
| `orgs/mojomast/ragussy/frontend/src/components/WorkspaceBrowserCard.tsx` | **Yes** | New feature built on `Card`, `Button`, `Input`, `Spinner` |
| `packages/ui/react/src/primitives/ModeIndicator.tsx` | canonical | use in status bars |
| `packages/ui/react/src/composites/ChordOverlay.tsx` | canonical | integrate into workbench shell |

### Backend-rendered surfaces / other services

| Surface | Status | Note |
|--------|--------|------|
| `services/devel-deps-garden` | separate service UI | treat as a garden surface; migrate only if folded into workbench |
| `services/eta-mu-truth-workbench` | separate service UI | treat as a garden surface; migrate only if folded into workbench |
| `orgs/octave-commons/shibboleth/ui` | separate React app | should eventually adopt `packages/ui/` primitives or a matching `reagent` layer |

---

## Priority Order

### P0
- `IngestionPage.tsx`
- `CmsPage.tsx`
- `QueryPage.tsx`

These are the core workbench surfaces.

### P1
- `ChatLabPage.tsx`
- `GardensPage.tsx`
- `RunsPage.tsx`

### P2
- `pages-next/*`
- external garden surfaces

---

## Definition of Done

This spec is complete when:
- the workbench shell uses `@devel/ui-react`
- all primary pages use shared primitives for buttons/cards/input/status
- keyboard chords are discoverable through `ChordOverlay`
- modal state is visible via `ModeIndicator`

---

## Status

Specified 2026-04-02. Tracks non-library UI debt explicitly.

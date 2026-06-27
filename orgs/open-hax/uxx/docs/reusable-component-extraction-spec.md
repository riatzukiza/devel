# Reusable Component Extraction Spec

Date: 2026-04-04
Status: draft
Scope: `orgs/open-hax/uxx`

## Summary

This spec defines the next extraction and promotion wave for `@open-hax/uxx` by identifying reusable component patterns that already exist in the repo but are not yet part of the public library surface.

The main distinction in this spec is between:

- **promotion**: a component already exists in near-public form and mainly needs export/docs/parity work
- **extraction**: a reusable pattern exists inside a larger component and needs a new public boundary, API, tests, stories, and framework wiring

## Goals

1. Promote already-implemented reusable components into the public `@open-hax/uxx` surface.
2. Extract high-value internal subcomponent patterns into deliberate primitives or compositions.
3. Keep React as the canonical implementation surface.
4. Preserve or improve Reagent and Helix parity for any newly public component.
5. Improve composition ergonomics without bloating the library with one-off app-specific artifacts.

## Non-goals

1. Extract every internal helper just because it is named.
2. Introduce a large new taxonomy before the existing surface is normalized.
3. Rewrite current React components purely to satisfy conceptual symmetry.
4. Force all candidates into cross-framework parity immediately if the right boundary is not yet clear.

## Current Findings

The repo scan indicates that the best reusable candidates are concentrated in three areas:

1. **Near-public compositions already present in React source**
2. **Section primitives already explicit in legacy Helix/Reagent implementations**
3. **Nested TSX subcomponents inside larger React primitives that encode repeatable UI patterns**

The clearest immediately promotable component is:

- `react/src/compositions/EntityCard.tsx`

The clearest extraction-pattern families are:

- card sections
- modal sections
- permission/request cards
- inspector panel shell components
- which-key grouped keybinding rows
- editor chrome sections

## Candidate Inventory

### Tier 1 — Promote first

#### 1. EntityCard

**Path**
- `react/src/compositions/EntityCard.tsx`
- `react/src/compositions/index.ts`

**Current state**
- implemented in React
- typed
- has stories/tests
- already exported from `react/src/compositions/index.ts`
- not exported from `react/src/index.ts`
- therefore not present in root public `@open-hax/uxx` surface

**Why it is valuable**
- highest leverage, lowest effort candidate
- demonstrates a compositions layer above primitives
- already presents a useful real-world schema: identity, metadata, status, tags, actions, media

**Proposed public placement**
- export from `react/src/index.ts`
- re-export through `src/index.ts`
- include in root docs and parity docs

**Proposed API status**
- public composition
- not a primitive

**Acceptance criteria**
- available from `@open-hax/uxx`
- documented in root README and React README
- listed in parity spec as React public surface
- Reagent/Helix status explicitly documented as either unavailable or planned

---

### Tier 2 — Extract compositional shell primitives

#### 2. Card section primitives

**Source evidence**
- `helix/src/devel/ui/helix/primitives/card.cljs`
  - `card-header`
  - `card-body`
  - `card-footer`

**Related React evidence**
- `react/src/primitives/Card.tsx`
- React `Card` currently exposes header/body/footer semantics via slots and styles, but not standalone exported section components

**Why it is valuable**
- reusable across cards, inspectors, settings panes, dashboards, sidebars
- increases composability without forcing a full `Card` API every time
- already conceptually stable

**Proposed public API**
- `CardHeader`
- `CardBody`
- `CardFooter`

**Proposed responsibilities**
- section layout only
- inherit surrounding card theme/tokens
- support simple composition with existing `Card`
- avoid hidden container assumptions beyond spacing/borders

**Non-goals**
- do not duplicate the full `Card` title/extra/footer orchestration logic inside every section component

**Acceptance criteria**
- React implementations exist and are story-covered
- Helix/Reagent wrappers expose equivalent sections
- `Card` can still work as before without requiring section usage

#### 3. Modal section primitives

**Source evidence**
- `helix/src/devel/ui/helix/primitives/modal.cljs`
  - `modal-backdrop`
  - `modal-header`
  - `modal-body`
  - `modal-footer`

**Related React evidence**
- `react/src/primitives/Modal.tsx`
- React `Modal` already models header/body/footer regions internally but not as standalone public components

**Why it is valuable**
- common dialog composition pattern
- improves custom-dialog ergonomics
- lets consumers build richer dialog shells while staying token-aligned

**Proposed public API**
- `ModalHeader`
- `ModalBody`
- `ModalFooter`
- `ModalBackdrop` optional; expose only if a real standalone use-case exists

**Design note**
- `ModalBackdrop` is less obviously public than header/body/footer; it may remain internal unless needed for lower-level dialog composition.

**Acceptance criteria**
- React standalone section components exist
- standard `Modal` remains backwards compatible
- docs explain when to use full `Modal` vs modal sections

---

### Tier 3 — Extract workflow/inspection building blocks

#### 4. Permission request cards

**Source evidence**
- `react/src/primitives/PermissionPrompts.tsx`
  - `PermissionCard`
  - `PromptCard`

**Why it is valuable**
- these represent a reusable “review + respond” interaction pattern
- likely useful across agent approvals, operator confirmations, command review, and structured prompts

**Risks**
- may still be too specific to agent permission workflow
- naming boundary needs care to avoid overfitting to the current permissions component

**Proposed extraction shapes**
Option A:
- `RequestReviewCard`
- `InputRequestCard`

Option B:
- keep internal for now, but define a follow-up extraction contract

**Recommendation**
- spec the boundary now
- defer implementation until after Tier 1 and Tier 2

#### 5. Inspector shell subcomponents

**Source evidence**
- `react/src/primitives/InspectorPane.tsx`
  - `EmptyState`
  - `ErrorState`
  - `DetailView`
  - `ContextItem`
  - `ContextSection`
  - `PinnedTab`
  - `PinnedTabsBar`

**Why it is valuable**
- there is clear reusable shell logic for contextual inspection and pinned comparison
- especially useful for KMS/IDE/agent dashboards

**Risks**
- some parts may be too tightly bound to `InspectorPane` state model
- `EmptyState` / `ErrorState` names are too generic as-is

**Likely extraction targets**
- `PinnedTabsBar`
- `ContextSection`
- `InspectorDetailSection` or equivalent

**Likely non-targets**
- generic `EmptyState` name without stronger boundary definition
- generic `ErrorState` name without stronger boundary definition

**Recommendation**
- extract only the highest-coherence shells, not every nested helper

#### 6. Which-key grouped shortcut list

**Source evidence**
- `react/src/primitives/WhichKeyPopup.tsx`
  - `BindingRow`
  - `CategoryGroup`

**Why it is valuable**
- reusable for shortcut palettes, command hint panels, cheat sheets, keyboard training UIs

**Risk**
- may be too presentation-specific to the current popup

**Recommendation**
- consider extraction as `ShortcutGroup` / `ShortcutRow` only if another caller emerges

---

### Tier 4 — Spec only, defer extraction

#### 7. Editor chrome

**Source evidence**
- `react/src/primitives/MarkdownEditor.tsx`
- `react/src/primitives/RichTextEditor.tsx`

**Patterns present**
- toolbar shell
- tabbed editor/preview switcher
- editor status bar
- split-pane editor framing

**Why it is valuable**
- these are useful patterns but the right boundary is less clear

**Recommendation**
- do not extract immediately
- document as a future design space once multiple editor surfaces need shared chrome

#### 8. Small supporting visuals

**Source evidence**
- `react/src/primitives/Button.tsx` → `LoadingSpinner`
- `react/src/primitives/Badge.tsx` → `StatusDot`

**Recommendation**
- keep internal unless another component needs them directly
- avoid polluting the public surface with tiny implementation helpers

## Public Surface Model

This spec proposes three public layers:

1. **Tokens**
   - low-level visual primitives and theme values

2. **Primitives**
   - reusable, relatively context-free building blocks
   - examples: `Button`, `Card`, `Tooltip`, future `CardHeader`

3. **Compositions**
   - reusable but domain-shaped assemblies of primitives
   - examples: `EntityCard`

This keeps the library from flattening everything into `primitives` while preserving a stable public API.

## Proposed Work Phases

### Phase 1 — Composition promotion

Deliver:
- public export of `EntityCard`
- docs update
- parity docs update

Verification:
- import from `@open-hax/uxx`
- build passes
- existing stories/tests still pass

### Phase 2 — Section primitive extraction

Deliver:
- `CardHeader`, `CardBody`, `CardFooter`
- `ModalHeader`, `ModalBody`, `ModalFooter`
- optional `ModalBackdrop`
- stories showing composition with existing `Card` and `Modal`

Verification:
- React exports exist
- docs updated
- Reagent/Helix parity wrappers added or explicitly deferred with rationale

### Phase 3 — Workflow shell extraction

Deliver:
- one of:
  - request/review cards
  - inspector pin/context shells

Verification:
- extraction justified by at least one second use-case or strong compositional coherence
- no obviously app-specific naming leaks into the public API

### Phase 4 — Editor chrome and minor support patterns

Deliver:
- only if Phase 3 surfaces clear reuse pressure

Verification:
- multiple internal callers or a very stable API boundary

## Framework Parity Rules

### React
React remains canonical for implementation and first public promotion.

### Reagent and Helix
For each newly public component, choose one of:

1. **Full parity now**
   - wrapper exported and documented

2. **Documented React-only release**
   - component is public in React, but docs explicitly mark CLJS bindings as pending

3. **Deferred entirely**
   - if the boundary is still unstable, do not publicize it yet

Rule:
- do not silently create React-only public surface without documentation saying so

## Documentation Requirements

For every promoted/extracted component:

1. add to the correct export index
2. update root `README.md`
3. update `react/README.md`
4. update `docs/framework-parity.md`
5. add or update stories
6. add tests where interaction or composition semantics are nontrivial

## Acceptance Criteria by Candidate

### EntityCard
- exported from root package
- listed in docs as a composition
- consumers can import it directly from `@open-hax/uxx`

### Card / Modal sections
- exported as public primitives
- story coverage demonstrates section composition
- naming and spacing semantics are stable

### Permission / Inspector / Which-key extractions
- extracted only after explicit API boundary review
- names are domain-coherent and not overly local
- at least one clear reuse story exists

## Open Questions

1. Should `EntityCard` live under root exports only, or also a dedicated `./compositions` subpath?
2. Should section primitives be exported from root `./primitives` only, or also grouped subpaths?
3. Do we want to formalize a `compositions/` public category in docs and exports now, or after at least 2–3 composition-level components exist?
4. Should React-only public components be allowed temporarily if CLJS parity is clearly marked?
5. Is `ModalBackdrop` truly public, or should it remain internal until lower-level dialog use-cases appear?

## Recommended Immediate Actions

1. Promote `EntityCard` into the root public React export surface.
2. Add composition terminology to docs so `EntityCard` has a proper home.
3. Spec and implement card/modal section primitives as the next extraction wave.
4. Revisit permission/inspector subcomponents only after section primitives are settled.

## Verification Checklist

- [ ] `EntityCard` exported from root public API
- [ ] root and React docs updated
- [ ] parity doc updated
- [ ] card section primitives specified
- [ ] modal section primitives specified
- [ ] CLJS parity stance documented for each new public item
- [ ] stories/tests updated for promoted and extracted components

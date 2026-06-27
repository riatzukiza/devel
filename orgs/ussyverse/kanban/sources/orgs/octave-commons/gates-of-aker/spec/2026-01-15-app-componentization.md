---
title: App Componentization
type: spec
component: frontend
priority: high
status: proposed
workflow-state: incoming
related-issues: []
estimated-effort: TBD
updated_at: 2026-02-10
---

# Spec: App Componentization

## Prompt
Review `web/src/App.tsx` and break the monolithic UI into smaller, reusable components while keeping the simulation debugger behavior unchanged.

## Key Code References
- `web/src/App.tsx:19-335` — single React component containing websocket wiring, canvas drawing, levers, agent list, traces, and JSON feeds.
- `web/src/components/index.tsx:1-9` — current location of `RawJSONFeedPanel`; expand this module (or a sibling directory) to host the new components.

## Existing Issues / PRs
- None surfaced via `gh issue list -L 20` or `gh pr list -L 20` (run on 2026-01-15).

## Definition of Done
1. Extract clear, typed child components (e.g., header/status bar, tick controls, lever sliders, canvas, agent list, trace feed, JSON panels) that receive the minimum required props.
2. Keep websocket/client state management centralized in `App`, pushing only derived data and callbacks into children.
3. Import/export the new components from `web/src/components/` and ensure the TypeScript module graph builds without unused locals.
4. Preserve styling/markup parity (grid layout, buttons, existing slider and feed UX) and document any visual variance if unavoidable.
5. Verify `npm run build --prefix web` succeeds after refactor; capture the command/result in the PR summary later.

## Requirements & Notes
- Maintain strict typing for props; prefer explicit interfaces over `any` for new components.
- Keep the canvas drawing logic wrapped in a dedicated component that encapsulates the `useEffect` painter while exposing click handling via props.
- Continue limiting event/trace buffer sizes exactly as today; ensure helper callbacks (tick/reset/levers/mouthpiece) are passed down unchanged.
- Consolidate repeated JSON feed markup using the existing `RawJSONFeedPanel` helper; import it explicitly at the top of `App.tsx` once reorganized.
- Adhere to the repo styling guide (two-space indentation, ordered imports) and avoid introducing new dependencies.

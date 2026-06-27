# Roads, Happiness, Rest, Stat Sheets

## Context
- `backend/src/fantasia/sim/social.clj:6-120` social interaction mood boosts + thoughts.
- `backend/src/fantasia/sim/agents.clj:8-73` needs decay and thought selection.
- `backend/src/fantasia/sim/tick/movement.clj:6-58` agent movement per tick.
- `backend/src/fantasia/sim/pathing.clj:34-90` A* pathing cost.
- `backend/src/fantasia/sim/jobs.clj:611-652` structure build completion handling.
- `backend/src/fantasia/sim/tick/actions.clj:111-132` build queue dispatch.
- `backend/src/fantasia/sim/spatial_facets.clj:148-199` structure facet registration.
- `web/src/components/BuildingPalette.tsx:41-165` buildable UI list.
- `web/src/components/SimulationCanvas.tsx:248-390` structure rendering.
- `web/src/components/SelectedPanel.tsx:128-205` agent detail display.
- `web/src/components/AgentCard.tsx:44-67` stat summary display.
- `web/src/config/constants.ts:34-60` structure colors.

## Existing Issues / PRs
- Issues: none found.
- PRs: none found.

## Requirements
- Add a road structure that agents can traverse quickly and pathfinding prefers.
- Make socialization drive happier mood expression and add more happy thoughts.
- Ensure rest meaningfully decays and restores so agents visibly rest.
- Provide a stat sheet view with movement speed context (normal/road).
- Update docs/notes with behavior changes.

## Definition of Done
- Roads can be queued via the UI and render on the canvas.
- Pathfinding uses road movement cost and movement step count scales with dexterity on roads.
- Social interactions + mood thoughts include additional happy expressions.
- Rest decays and is restored when sleeping/house-resting; UI reflects changes.
- Stat sheet shows base stats plus movement speed values.
- `/docs/notes` includes a new entry summarizing the change.

## Verification
- `clojure -X:test` (fails: missing `fantasia/sim/fire_creation_test.clj` on classpath).

## Open Items
- Resolve or restore `fantasia/sim/fire_creation_test.clj` so the backend test runner can complete.

## Change Log
- 2026-01-20: Added road structure, rest decay/recovery, social mood boosts, and UI stat sheet updates.

## Context
- Goal: align the building palette with buildable structures and add stockpile-wide resource totals in the UI.
- Building palette lives in `web/src/components/BuildingPalette.tsx` and is wired in `web/src/App.tsx`.
- Backend WS ops live in `backend/src/fantasia/server.clj` with helper actions in `backend/src/fantasia/sim/tick/actions.clj`.

## Existing Issues / PRs
- Issue: #4 Milestone 3 — Colony Job Loop (open).
- PRs: none found via `gh pr list`.

## Requirements
- Palette shows buildable structures (remove non-buildings like tree/wolf/bear).
- Palette queues build jobs instead of placing structures instantly.
- Wall placement should handle wall ghosts before queueing build-wall jobs.
- Stockpile totals aggregate quantities across all stockpiles.
- Update `/docs/notes` to record UI behavior changes.

## Definition of Done
- New WS op queues build jobs and updates jobs/tiles payloads.
- Building palette uses queue op and exposes the buildable list.
- Stockpile totals panel displays aggregated resources from stockpiles.
- Tests updated/added for palette and stockpile totals.

## Planned Touch Points
- `backend/src/fantasia/server.clj` (new queue op).
- `backend/src/fantasia/sim/tick/actions.clj` (queue build helpers).
- `backend/src/fantasia/sim/jobs.clj` (enqueue job helper, warehouse build stockpile support).
- `web/src/App.tsx` (wire build queue + totals).
- `web/src/components/BuildingPalette.tsx` (palette list + queue action).
- `web/src/components/ResourceTotalsPanel.tsx` (new totals UI).
- `web/src/components/__tests__/BuildingPalette.test.tsx` (update tests).
- `web/src/components/__tests__/ResourceTotalsPanel.test.tsx` (new tests).
- `docs/notes/` (new note entry).

## Change Log
- Added queue build WS op and palette updates to target buildable structures.
- Added stockpile totals panel and tests for palette/totals.

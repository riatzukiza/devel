## Context
- Goal: standardize tile selection UI with clear, consistent sections and start outlining ECS migration touch points.
- Tile selection overlay lives in `web/src/App.tsx` and the right panel uses `web/src/components/SelectedPanel.tsx`.
- Snapshot tile data comes from `backend/src/fantasia/sim/world.clj`.

## Existing Issues / PRs
- Issue: #4 Milestone 3 — Colony Job Loop (open).
- PRs: none found via `gh pr list`.

## Requirements
- Tile selection shows: coordinates, biome, terrain, structure, items, agents.
- Layout uses consistent key/value rows grouped under section headers.
- Tile selection view replaces unclear overlay with standardized panel.
- Document UI change in `/docs/notes`.
- Capture ECS migration follow-up scope for snapshot normalization.

## Definition of Done
- Selected tile panel displays the requested fields in standardized layout.
- Tile overlay no longer duplicates or obscures selection data.
- Notes updated for the standardized tile view.

## Planned Touch Points
- `web/src/App.tsx` (tile selection data + overlay removal).
- `web/src/components/SelectedPanel.tsx` (standardized tile layout).
- `docs/notes/` (new note entry).

## ECS Migration Follow-up
- Audit `backend/src/fantasia/sim/world.clj:5` to align snapshot payload with ECS components.
- Decide whether to expose ECS-derived tile maps via a new snapshot field.

## Change Log
- Standardized tile selection panel content and removed the floating overlay.
- Added tile items/agents sections for consistent inspection.

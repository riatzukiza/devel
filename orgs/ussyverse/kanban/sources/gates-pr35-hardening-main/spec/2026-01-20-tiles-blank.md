# Tiles Blank On Frontend

## Goal
- Restore tile rendering in the frontend canvas when tiles exist in simulation state.

## Context
- Frontend renders tiles by looking up `snapshot.tiles["q,r"]` in `SimulationCanvas`.
- Backend serializes tile maps with vector keys, which JSON encodes as strings like "[q r]".

## Files & Line References
- `web/src/components/SimulationCanvas.tsx`: tile lookup and draw loop (lines 191-233).
- `web/src/App.tsx`: snapshot ingestion from WS + /sim/state (lines 140-210, 244-299).
- `backend/src/fantasia/sim/world.clj`: snapshot includes raw `:tiles` map (lines 5-18).
- `backend/src/fantasia/server.clj`: WS hello + /sim/state responses use raw state (lines 92-112, 210-212).

## Existing Issues / PRs
- Issues: not checked (gh auth not configured).
- PRs: not checked (gh auth not configured).

## Requirements
- Normalize tile/item/stockpile keys to "q,r" strings before the UI uses them.
- Avoid mutating backend simulation state; normalize at the UI boundary.
- Keep changes minimal and focused on snapshot ingestion paths.

## Definition of Done
- Tiles render with biome colors and resource markers on the canvas.
- `Selected Cell` panel resolves tile data using the normalized keys.
- Existing agent rendering remains unchanged.

## Progress Log
- 2026-01-20: Added frontend normalization for tile-keyed maps in `App.tsx`.
- 2026-01-20: Fixed biome resource spawning to preserve the full tiles map in `biomes.clj`.

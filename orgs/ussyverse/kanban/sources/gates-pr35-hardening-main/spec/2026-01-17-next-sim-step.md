# Next Simulation Addition — Hex Map Backbone

---
Type: spec
Component: backend
Priority: high
Status: implemented
Related-Issues: []
Milestone: 1
Estimated-Effort: 24 hours
---

## Context
- The current world schema (`backend/src/fantasia/sim/tick.clj:23-58`) is a fixed 20×20 square grid with `:size [20 20]`, cartesian agent positions, and tree coordinates stored as a plain set, so no notion of axial neighbors or tile metadata exists.
- Agent proximity and conversations rely on Manhattan distance on that square grid (`backend/src/fantasia/sim/agents.clj:36-43`), which bakes the square assumption into social logic and prevents later hex-aware mechanics like faction rings.
- The frontend canvas also assumes a 20×20 square (`web/src/components/SimulationCanvas.tsx:12-87`), drawing rectangular cells and interpreting clicks via uniform grid math.
- The most recent roadmap (`docs/notes/planning/2026-01-15-roadmap.md:24-185`) calls out "Milestone 1 — Hex backbone + rendering" as the first gating objective before walls, jobs, factions, or decks can feel meaningful.

## Problem Statement
Without an authoritative hex map, the simulation cannot express neighbor settlements, wall placement, or deity ring structure. Every downstream milestone in the roadmap depends on adopting axial/hex coordinates both in the backend state and the frontend renderer, but the current square implementation blocks that.

## Proposed Addition
Implement the Hex Map Backbone milestone end-to-end.

### Backend
1. Introduce `fantasia.sim.hex` encapsulating axial math (direction vectors, neighbor lookups, cube distance, in-radius helpers) so other namespaces do not reimplement geometry.
2. Update `initial-world` (`backend/src/fantasia/sim/tick.clj`) to describe map metadata via `:map {:kind :hex :layout :pointy :bounds {:shape :radius :r N}}` and replace `:size`/`:trees` with a sparse `:tiles` map, migrating shrine and future structures into this schema.
3. Migrate agent positions, shrine checks, and movement helpers in `fantasia.sim.spatial`/`fantasia.sim.agents` to consume the axial helpers, ensuring adjacency, distance, and near-shrine logic are hex-aware.
4. Extend `fantasia.sim.world/snapshot` to include lightweight map payloads (`:map` metadata plus lists of special tiles) so the UI has enough data to render non-ground features without fetching the entire world state each tick.

### Frontend
1. Add shared hex utility functions (axial↔pixel transforms, cube rounding) and migrate `SimulationCanvas` to draw hexagons within the provided map bounds, reusing the sparse tile data for trees/walls/shrine markers.
2. Update click handling to translate pointer coordinates back to axial cells, keeping agent selection consistent with backend coordinates.
3. Confirm lever/mouthpiece interactions still work with the updated coordinate payloads (i.e., sending `[q r]` pairs through the existing WS ops).

## Existing Issues / PRs
- No open issues or PRs in this repo capture the hex-map milestone; this spec formalizes the next prioritized slice.

## Definition of Done
- Backend ticks operate purely on axial coordinates, and all proximity checks (`move-agent`, `near-shrine?`, conversation pairing) use six-direction neighbors from `fantasia.sim.hex`.
- `world/snapshot` exposes `:map` metadata plus a bounded list of tiles with resources/structures, and the WS `tick` payload contains these fields.
- The frontend renders a hex grid that matches backend bounds, displays agents/trees/shrine correctly positioned, and allows selecting a hex to place shrines via the existing control flow.
- Manual smoke test: reset world, observe pawns walking on the hex grid, select a hex, place the shrine there, and see the shrine render on that hex.

## Requirements
1. Preserve existing myth + ledger behavior; the change should only affect spatial representation and snapshot payloads.
2. Keep payloads lean: only transmit non-ground tiles and map metadata that the UI truly needs.
3. Provide defaults or migrations so calling `reset_world!` without arguments continues to work (seed handling unchanged).
4. Add doc notes (`docs/notes` or `README`) describing the new axial map schema so future work (walls, factions) references a single source of truth.

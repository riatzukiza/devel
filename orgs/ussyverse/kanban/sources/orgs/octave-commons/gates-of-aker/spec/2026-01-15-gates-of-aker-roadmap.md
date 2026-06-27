# Gates of Aker Roadmap

---
Type: roadmap
Component: world
Priority: high
Status: approved
Related-Issues: [4, 5, 6, 7, 8]
Milestone: 0
Estimated-Effort: 160 hours
---

## Related Documentation
- [[docs/notes/planning/2026-01-15-roadmap.md]] - Detailed roadmap with implementation notes
- [[README.md]] - Project overview
- [[AGENTS.md]] - Coding standards
- [[spec/2026-01-15-core-loop.md]] - Day/night cycle mechanics
- [[spec/2026-01-15-myth-engine.md]] - Myth engine
- [[docs/notes/design/2026-01-15-world-schema.md]] - World schema
- [[docs/notes/planning/2025-01-15-mvp.md]] - MVP definition

## MVP North Star
A hex-based colony sim where you build walls, manage needs/jobs, directly control a champion during day, and play deity cards at night while six neighbor factions compete via decks. Key references:
- Vision + MVP slice (`docs/notes/2026-01-11-fantasia-design-pass-turning-the-vibe-into-a-runnable-loop.md:226-265`)
- Repo review + roadmap (`docs/notes/2026-01-15-gates-of-aker-main-zip.md`, `docs/notes/2026-01-15-continue-4.md`, `docs/notes/2026-01-15-contiune.md`)

## Epics (dependency order)
1. **HexMap** – axial coordinates, hex renderer, selection (17.08.03.md)
2. **WallsAndPathing** – passability, ghosts, pathfinding (17.08.03.md Sprint 2 preview)
3. **ColonyCore** – jobs, items, stockpile, needs loops (17.08.00.md & roadmap notes)
4. **ChampionLoop** – day control + sleep/night gate (17.08.02.md)
5. **Factions6** – center settlement + six neighbors, basic behaviors (17.08.02.md Milestone 4)
6. **DecksAndSigns** – deity cards, collision resolution, signs/modifiers, event families (17.07.57.md, 17.08.00.md)
7. **MythIntegration** – feed real events into myth ledger, replace synthetic RNG (17.08.02.md epics)

## Sprint 1 – HexMap Backbone (17.08.03.md)
**Backend**
- Add `fantasia.sim.hex` with axial math (neighbors, distance, ring, line, in-bounds).
- Refactor `world` to hex map: `:map {:kind :hex :layout :pointy :bounds {:shape :radius :r N}}`, `:tiles` sparse map for non-ground (trees, walls, shrine).
- Convert agents to `[q r]`, update movement neighbors, `in-bounds?`, `near-shrine?`, tree resource access.
- Snapshot includes map metadata + tile lists (walls, trees, shrine) + agent positions.
- `place_shrine` accepts axial coords.

**Frontend**
- Add `hex.ts` with axial→pixel, pixel→axial (cube-round), polygon helpers.
- Replace canvas renderer with hex grid, render walls/trees/shrine/agents.
- Click-to-select hex; highlight agent on selected tile.

**Acceptance**
- Launch app: hex grid visible, agents walking hex neighbors, shrine placement works on hex coords.

## Sprint 2 – Walls + Pathing + Build Ghosts (17.08.03.md preview)
**Backend**
- Tile passability: `:structure :wall` blocks movement/LOS.
- Wall ghost schema + job queue entries.
- Pathfinding (BFS initially) respects hex blockers.
- `place_wall_ghost` op; job resolves ghost→wall consuming wood.

**Frontend**
- Tool to place wall ghosts; distinct render for ghost vs built wall.
- Visual feedback for blocked tiles.

**Acceptance**
- Build enclosure, agents path around walls; ghosts get built when resources exist.

## Sprint 3 – Colony Core Skeleton (17.08.02.md Milestone 2)
- Job queue/reservations; roles `:haul`, `:build-wall`, `:chop-tree`, `:sleep`, `:eat`.
- Items + stockpile zone; hauling loops.
- Needs drive behavior (sleep, hunger); autopilot handles when champion idle (ties to core-loop spec).
- Inspect pawn UI showing job, needs, inventory.
- Speed controls (tick/run/pause) wired into existing runner.

## Sprint 4 – Champion Control + Day/Night Gate (17.08.02.md Milestone 3)
- Champion struct with `:id`, `:pos`, `:asleep?`, `:agency`, `:intent`.
- Day input: WASD or click-to-move champion; manual actions (build, fight, talk).
- Sleep action triggers Night mode; wake triggers (danger, needs, alarms) snap back to day.
- Night UI: show day/night indicator, sleep safety, time-to-wake.
- Fog rules: day camera = champion LOS; night vision = union of aligned LOS.

## Sprint 5 – Factions6 (17.08.02.md Milestone 4)
- Spawn center settlement + six neighbor factions arranged on hex ring at distance D.
- `:factions` map (id, color, alignment, budgets, deck placeholder).
- Basic behaviors per neighbor: patrol, trade caravan, scout, raid probe.
- Relationship edges: `:hostile|:neutral|:friendly`; simple state machine for transitions.
- UI overlay for faction borders/markers + log of last-known neighbor activity.

## Sprint 6 – Decks & Signs (17.07.57.md, 17.08.00.md, 17.08.04.md)
- `:deity/decks` per faction: draw pile, discard, hand, cooldowns.
- Card schema `{id, phase, cost, keys, tags, effect}` sharing move resolution engine.
- Implement collision resolver, sign emission, modifiers, event-family generators, candidate scoring.
- AI heuristics for neighbor card selection (pressure, novelty, budget).
- Night UI: hand display, costs, target selection, sign feed, event chain viewer.

## Sprint 7 – Myth Integration (17.08.02.md, myth-engine spec)
- Wire interactions between real events and myth ledger; remove placeholder RNG events.
- Snapshot/WS include myth ledger summary.
- Document new APIs for event registration + ledger updates.

## Ongoing Tasks
- Document world schema (`docs/specs/core-loop.md` & future world-schema doc).
- Record exact commands for dev/test in docs.
- After each sprint: run backend server (`clojure -M:server`), frontend build (`npm run build --prefix web`), note manual verification steps (Hex interactions, champion sleep/wake, card play telegraphs).

## Open Risks / Questions
- Pathfinding performance on larger hex maps (BFS vs A*).
- Champion control input scheme finalization.
- How to visualize sign telemetry without overwhelming UI.
- AI sophistication for neighbor decks (heuristics vs planning).
- Save/load implications once multiple institutions/factions exist.

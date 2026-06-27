# 2026-01-19 — Milestone 3 Simulation Lifecycle Plan

## Related Issues / PRs
- Issue #4 “Milestone 3 — Colony Job Loop” (umbrella issue for simulation loop).
- Issue #5 “Champion Control & Day/Night” (future dependency once lifecycle stabilizes).
- Issue #15 “Observability” remains prerequisite for debugging.
- No PRs currently implement lifecycle behaviors (checked `gh pr list` on 2026-01-19).

## Current State Highlights
- Backend job engine (`backend/src/fantasia/sim/jobs.clj` lines 10-391) generates haul/eat/sleep/deliver jobs from `:items`/stockpiles but never transfers world items into agent inventories; newly spawned haul jobs target the destination stockpile instead of resource tiles.
- Movement (`backend/src/fantasia/sim/tick/movement.clj` lines 38-69) routes toward job targets but if agent is already at target, nothing happens—no pickup, no drop, and job completes through idle progress increments.
- Needs only track `:food`, `:sleep`, `:warmth`; water/security/mood/health absent; no death/fall asleep/reproduction logic.
- Agents have a single `:inventory` map; no separate hauling/equipment slots, so UI cannot render visible loads.
- World lacks building abstractions beyond walls/ghosts; there is no town center, berry bushes, chicken entities, or building jobs.
- UI has a single combined view; no board-only or analytics routes; agent inspector lacks stats, inventories, or event logs.

## Requirements Snapshot
1. Implement agent lifecycle stats (strength, dexterity, fortitude, charisma) and needs (food, water, rest, health, security, mood).
2. Add mortality and reproduction: hunger/thirst depletion kills agents (spawn corpse entity), rest depletion forces sleep-in-place, high needs trigger reproduction events.
3. Support multiple inventories per agent (`:personal`, `:hauling`, `:equipment`) and render hauling contents on canvas.
4. Introduce building archetypes (town center, fence, gate, tent, stockpile, campfire, bonfire) and resource nodes (berry bush, wood, domesticated chickens) as generic entities.
5. Ensure jobs physically move items: resource harvest → items -> agent hauling inventory -> destination drop; include water-drawing from bodies of water.
6. Add UI inspection/editing for agents (stats, inventories, event logs) plus Chrome DevTools compatible payloads.
7. Create two additional frontend routes: `/board` (canvas only) and `/command` (expanded dashboard with charts/graphs + sidebar content).
8. Maintain reproducible verification (REPL scripts/tests) demonstrating the full ecosystem loop.

## Definition of Done
- Lifecycle systems drive behavior: agents satisfy needs in priority order, perish or sleep when ignored, reproduce based on configurable heuristics, and log events for UI.
- Harvest/haul jobs move items via agent hauling inventories; UI shows carried resources; stockpile counts reflect deposits.
- Building and resource nodes exist in world snapshots; agents can construct required structures.
- Two new routes deliver the requested views without regressing existing `/` experience; analytics view shows charts/logs.
- Backend + frontend tests (where feasible) plus manual verification scripts prove the loop; docs summarizing requirements and manual steps exist (`docs/notes`, `specs`).

## Plan (Phased)

### Phase 1 — Data Model & Infrastructure
1. Extend agent schema (`backend/src/fantasia/sim/tick/initial.clj`, `agents.clj`) with stats, needs map, multi-inventory, and `:alive?`/`:asleep?` flags.
2. Introduce building/resource entity definitions (new namespace `fantasia.sim.buildings`) storing type, hp, capacity, resource yields.
3. Update world state to track `:buildings`, `:corpses`, `:resources`, `:event-log`; surface through `world/snapshot` along with agent stats/inventories for UI.
4. Add deterministic REPL helpers to spawn a known world (town center at 0,0, berry bush + wood + chickens, 5 starting agents) to reproduce scenarios quickly.

### Phase 2 — Needs & Job Engine Rewrite
1. Create `fantasia.sim.needs` (or similar) to decay needs per tick, applying modifiers from stats/weather.
2. Redesign job priority queue: agents evaluate personal needs (food/water/rest/health/security/mood) before colony jobs; each need spawns specific job chains (e.g., `find-food -> harvest -> eat`).
3. Implement multi-stage haul jobs: on assignment, withdraw items from resource/building into agent `:inventories :hauling`, compute path to destination, drop items on completion, and emit events (for UI + ledger).
4. Validate death/sleep/fall-asleep states: if thresholds reached, spawn corpse entity or toggle `:asleep?`, remove jobs, and adjust priority logic.
5. Add tests covering new need transitions, hauling pipeline, death/sleep, and reproduction triggers.

### Phase 3 — Buildings, Resources, and Crafting
1. Seed world reset with town center, berry bush, wood patch, chickens, plus default stockpile/campfire; add building placement helpers.
2. Implement build jobs for walls/fences/gates/tents/stockpiles/campfires/bonfires; building completion modifies tiles/building registry.
3. Introduce multi-inventory usage for equipment/tools; optionally tie strength/dexterity to hauling capacity and task speed.
4. Add water sources (streams/pond tiles) and logic for water collection jobs.
5. Expand event log entries for building/resource interactions; expose via snapshot.

### Phase 4 — Frontend Views & Inspectors
1. Integrate React Router to provide `/` (existing), `/board` (canvas-only), `/command` (expanded analytics). Shared state should come from the same WS client.
2. Build new dashboard components: agent list with stats/inventory editing, event log timeline, charts (needs levels, population, stockpile levels). Use a lightweight chart lib (e.g., Recharts) or custom SVG to minimize dependencies.
3. Add hauling indicators on canvas (e.g., small icon/qty overlay) and highlight corpses/buildings/resource nodes.
4. Provide inspector modals for agents/buildings with edit toggles (dev-only) and buttons to spawn jobs.

### Phase 5 — Observability & Docs
1. Extend logging/event system to track lifecycle transitions (birth/death/needs satisfied) and hook into `docs/spec/2026-01-18-observability.md` toggles.
2. Document lifecycle in `/docs/notes` (new section “Milestone 3 Lifecycle”), including reproduction heuristics, need decay constants, inventory semantics, and UI route descriptions.
3. Record manual verification steps (curl scripts, Chrome DevTools instructions) verifying haul flows, death/reproduction, building placement.

## Risks & Mitigations
- **Complexity creep:** Break implementation into reviewable steps per phase to avoid unmanageable PRs.
- **Performance:** Snapshot payload size will grow; consider summarizing inventory data or sending deltas in the future.
- **UI scope:** New routes + charts may require adopting a routing lib; keep dependencies minimal and document choices.

## Open Questions
1. Reproduction rules: what needs thresholds/timeframes spawn new agents? Are offspring clones or random stats?
2. Security/danger system: should we stub in scripted threats (wild animals) or wait for future milestones?
3. Charting library preference? (Default assumption: Recharts or custom d3-lite; need confirmation.)
4. Inventory capacity formulas: linear off strength or logistic? Should equipment modify stats?

## Next Steps
- Confirm assumptions above and prioritize phases with stakeholders.
- Once approved, create implementation todos per phase (backend first, then UI).
- Coordinate with UI stakeholders about routing/analytics design.

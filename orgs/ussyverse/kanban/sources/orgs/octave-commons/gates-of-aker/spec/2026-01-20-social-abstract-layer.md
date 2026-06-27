# Social Abstract Layer (Milestone 3.5)

## Summary
Define and implement the agent-level social abstract layer: a social need, relationship tracking, and interaction-driven memories that integrate with facet queries, plus UI snapshot hooks to expose the state.

## Existing Signals (Code Locations)
- `backend/src/fantasia/sim/social.clj:1-72` - Social interaction types + mood effects (not wired into tick loop).
- `backend/src/fantasia/sim/agents.clj:57-191` - Packet choice + listener application, adjacency interaction detection.
- `backend/src/fantasia/sim/tick/core.clj:56-159` - Tick order, movement, interactions, reproduction, institution broadcasts.
- `backend/src/fantasia/sim/tick/initial.clj:23-56` - Default needs/thresholds include mood but no social need.
- `backend/src/fantasia/sim/memories.clj:5-74` - Memory creation/decay APIs used by spatial facet queries.
- `backend/src/fantasia/sim/spatial_facets.clj:128-323` - Facet registry + memory facet collection.
- `web/src/components/AgentCard.tsx:32-245` - Needs UI bars (mood/food/sleep/warmth).
- `web/src/types/index.ts:5-13` - Agent type uses `needs: Record<string, number>` (flexible for new fields).

## Requirements
1. **Agent social need**
   - Add `:social` (0-1) to `default-agent-needs` and thresholds (low/ok/high).
   - Decay social need over time when no social contact; restore it via social interactions.
2. **Relationship tracking**
   - Track per-agent relationships keyed by other agent id, with `:affinity` (0-1) and `:last-interaction` tick.
   - Social interactions update affinity and optionally emit a short social status label (bonding, neutral, tense).
3. **Interaction-driven memories + facets**
   - On each social interaction, create a memory via `memories/create-memory!` with facets derived from interaction type and relationship state.
   - Register new social facet word lists in `spatial_facets/init-entity-facets!` (e.g., `:memory/social-bond`, `:memory/social-conflict`) and use them in created memories.
4. **Facet integration for social need**
   - Add a social need axis query helper (similar to `query-need-axis!`) that can use memories/facets to bias social need recovery or decay.
5. **Snapshot + UI hooks**
   - Extend `world/snapshot` to include relationship summaries per agent (top N by affinity) and the social need value.
   - Update `AgentCard.tsx` to show `social` in the needs bars and optionally a compact “top bond” line.
6. **Tests**
   - Add tests to assert social need decay/restore, relationship updates, and memory creation with social facets.

## Definition of Done
- Social need is present in agent defaults and updated each tick.
- Social interactions update relationships and create memories with social facets.
- Spatial facet queries can see social memories (validated via tests).
- Snapshot exposes social need and relationship summaries; UI renders social need bar.
- Tests covering social need updates, interaction memory creation, and snapshot fields pass.

## Phased Plan
### Phase 1: Data model + need decay
1. Add `:social` to `default-agent-needs` and thresholds in `backend/src/fantasia/sim/tick/initial.clj`.
2. Extend `agents/update-needs` to decay `:social` and apply recovery bonuses when interactions occur.
3. Add relationship storage on agents (`:relationships` map) in initial agent creation.

### Phase 2: Social interactions + relationship updates
1. Add/update functions in `backend/src/fantasia/sim/social.clj` to:
   - Pick interaction types.
   - Update both agents’ `:relationships` entries.
   - Output an interaction record used by downstream systems.
2. Wire interaction execution into `tick/core.clj` near `agents/interactions` so interactions also update social need + relationships.

### Phase 3: Memories + facets integration
1. Register social memory facets in `backend/src/fantasia/sim/spatial_facets.clj`.
2. On each interaction, create a memory in `memories.clj` and attach facets aligned with interaction type and relationship delta.
3. Add a helper to bias social need updates using `spatial_facets/query-concept-axis!` (e.g., `:social-axis`).

### Phase 4: Snapshot + UI hooks
1. Extend `backend/src/fantasia/sim/world.clj` snapshot to include social relationship summaries per agent.
2. Update `web/src/components/AgentCard.tsx` to render the `social` need and a compact top relationship indicator.

### Phase 5: Tests
1. Add backend tests for social need decay/restore and memory creation.
2. Validate snapshot fields and relationship summaries.

## Existing Issues / PRs
- Issues: none referenced in repo notes; GitHub issues not checked.
- PRs: none referenced in repo notes; GitHub PRs not checked.

## Open Questions
- Should `:social` be a stand-alone need or derived from `:mood`?
- How many relationships to include in snapshot (top 1 vs top 3)?
- Which interaction types map to positive vs negative social facets?

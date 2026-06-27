# Social Visualization & Agent Identity (Milestone 3.5)

## Summary
Expose social connections, agent identity, and stats in the UI. Render colonists with a simple body silhouette (head/body/legs dots) plus armor accents, and draw relationship lines between agents.

## Related Files (current)
- `backend/src/fantasia/sim/tick/initial.clj:17-83` - Agent defaults, creation, and spawn flow.
- `backend/src/fantasia/sim/world.clj:5-49` - Snapshot payload for UI.
- `backend/src/fantasia/sim/social.clj:6-118` - Social interactions and relationship updates.
- `web/src/components/SimulationCanvas.tsx:520-575` - Agent rendering on canvas.
- `web/src/components/AgentCard.tsx:32-257` - Agent UI details.
- `web/src/components/__tests__/AgentCard.test.tsx:90-145` - Needs bar color tests.

## Requirements
1. **Agent identity**
   - Ensure agents have `:name` in world state and snapshot.
   - Show names in AgentCard and on canvas (when zoomed in).
2. **Stats visibility**
   - Surface core stats (strength/dexterity/fortitude/charisma) in AgentCard.
3. **Relationship visualization**
   - Snapshot includes top relationships (up to 3) per agent with affinity values.
   - Canvas draws connection lines between agents based on affinity.
4. **Agent rendering upgrade**
   - Colonists render as three-dot silhouettes (head/body/legs).
   - Knights/priest get simple armor accents.
   - Wildlife stays icon-based.

## Definition of Done
- Agents have names and stats visible in AgentCard.
- Canvas draws relationship links and name labels at zoom.
- Colonists render as dot silhouettes with armor markers.
- Tests updated to reflect new needs ordering and UI additions.

## Plan
### Phase 1
1. Add deterministic names for agents in `backend/src/fantasia/sim/tick/initial.clj`.
2. Extend snapshot to emit top 3 relationships and name fields.

### Phase 2
1. Update AgentCard to show names, stats, and relationship summary.
2. Update AgentCard tests to match new needs ordering.

### Phase 3
1. Update SimulationCanvas to draw relationship links.
2. Render colonist silhouettes with armor accents; show names when zoomed in.

## Existing Issues / PRs
- Issues: none referenced in repo notes; GitHub issues not checked.
- PRs: none referenced in repo notes; GitHub PRs not checked.

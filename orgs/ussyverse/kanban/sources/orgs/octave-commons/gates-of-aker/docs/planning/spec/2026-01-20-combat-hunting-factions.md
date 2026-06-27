# Combat + Hunting + Factions

## Summary
- Introduce factions and baseline combat to support deer, wolves, and player agents.
- Add hunting behavior so wolves and players target deer.

## Context
- User request: add combat, hunting deer, and wolves that hunt deer; all are agents; add player and wilderness factions.

## Relevant Files
- `backend/src/fantasia/sim/tick/core.clj` (tick loop, agent spawn helpers).
- `backend/src/fantasia/sim/tick/initial.clj` (agent defaults, initial world population).
- `backend/src/fantasia/sim/tick/movement.clj` (agent movement, job progression).
- `backend/src/fantasia/sim/agents.clj` (needs decay).
- `backend/src/fantasia/sim/jobs.clj` (job creation and completion).
- `backend/src/fantasia/server.clj` (WS/HTTP actions).

## Issues / PRs
- Issue #21: Define Combat and Death Mechanics (related).
- PRs: none found via `gh pr list --limit 20`.

## Requirements
- Add a faction field for agents (player vs wilderness).
- Add deer agents, wolves as wilderness agents, and player agents in player faction.
- Implement combat resolution between hostile factions.
- Implement hunting behavior for wolves and player agents targeting deer.
- Ensure combat ties into existing health/needs/mortality systems.
- Add documentation note in `docs/notes`.

## Decisions
- Combat model: simple health drain per hit using existing `:needs :health`.
- Wolves prioritize deer; if none are nearby, they may target player agents.
- Player agents hunt deer only.
- Deer/wolf initial spawn uses biome density.
- Player hunting is auto-triggered when hungry.

## Plan
### Phase 1 - Investigation
- Review tick loop ordering to place combat and hunting updates.
- Inspect jobs/movement to decide between job-based hunts vs direct AI.

### Phase 2 - Implementation
- Extend agent schema with `:faction`, add defaults for existing agents.
- Add deer spawning helpers and placement actions.
- Add combat system (target selection + damage + death handling).
- Add hunting behavior for wolves and player agents.

### Phase 3 - Documentation
- Document combat/hunting/faction behavior changes in `docs/notes`.

## Open Questions
- Should deer drop more than 1 raw meat item per kill?
- Should player agents retaliate vs wolves outside of hunt jobs?

## Definition of Done
- Deer and wolves spawn as agents with factions.
- Player agents belong to player faction.
- Wolves hunt deer; player agents can hunt deer.
- Combat reduces health and triggers existing mortality handling.
- Notes added to `docs/notes`.

## Change Log
- 2026-01-20: Spec created.
- 2026-01-20: Recorded combat/hunting/faction decisions from user feedback.

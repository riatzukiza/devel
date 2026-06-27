## Context
- Issue: Biomes/resources not rendering in UI during ECS migration.
- Relevant file: `backend/src/fantasia/sim/ecs/adapter.clj` lines 70-73 (tile key formatting).
- Existing issues: none found in `gh issue list` related to biome rendering.
- Existing PRs: none listed in `gh pr list`.

## Requirements
- WebSocket snapshot must include tile keys that match UI expectations (`"q,r"`).
- Biome/resource rendering should return once tiles map aligns with UI lookup.

## Definition of Done
- Tiles map keys use comma-separated axial coords.
- Biomes and resources render again in the client without other regressions.

## Plan
### Phase 1: Diagnose
- Confirm snapshot tile keys mismatch UI lookup.

### Phase 2: Fix
- Update ECS adapter tile key formatting.

### Phase 3: Validate
- Manual smoke check: run app and confirm biomes/trees render.

# Agent Fire Creation and Heat Mood System

## Related Documentation
- [[AGENTS.md]] - Coding standards and conventions
- [[backend/src/fantasia/sim/jobs.clj]] - Job system
- [[backend/src/fantasia/sim/agents.clj]] - Agent needs system
- [[backend/src/fantasia/sim/tick/movement.clj]] - Agent movement and job execution
- [[backend/src/fantasia/sim/social.clj]] - Social interaction and mood system

## Vision & Signature
Agents respond to being cold by proactively creating heat sources (campfires/torches). Being cold negatively impacts mood, while warmth improves it. Cold thoughts influence agent behavior and priorities.

## Current State
- Warmth is tracked as a need (`:needs :warmth`) in `backend/src/fantasia/sim/agents.clj:29`
- Existing `:job/warm-up` job restores warmth when agents stand by campfires (`backend/src/fantasia/sim/jobs.clj:13,719-722`)
- Campfires provide warmth within radius (defined by `campfire-radius` constant)
- Campfire placement is UI-only via `place-campfire!` (`backend/src/fantasia/sim/tick/actions.clj:49-61`)
- Mood exists but is not tied to warmth needs
- No agent action for creating fires/torches
- No cold thought system

## Requirements

### 1. Fire Creation Job
- New job type `:job/build-fire` that allows agents to create a campfire at a location
- Job requires agent to have wood/logs in inventory or nearby
- Job priority should be high when agents are cold
- Agents should prefer to build fires at empty ground tiles

### 2. Mood and Warmth Integration
- Update agent mood based on warmth level
- Cold agents (< 0.3 warmth) should have mood penalty
- Comfortable agents (> 0.7 warmth) should have mood bonus
- Mood updates should happen in `update-needs` function

### 3. Cold Thoughts/Perceptions
- Add warmth-related thoughts to agents
- Thoughts should be stored in agent state (e.g., `:current-thoughts` or similar)
- Cold thoughts: "I'm freezing", "Need a fire", "Too cold here"
- Warm thoughts: "Nice and warm", "The fire feels good"
- Thoughts influence action selection priority

### 4. Job Generation
- When agents are cold and no campfire exists nearby:
  - Generate `:job/build-fire` jobs automatically
  - Prioritize building fires over other jobs
  - Fire building jobs should target empty ground near agent

### 5. Job Execution
- Agent moves to target location
- Consumes wood/logs from inventory or nearby
- Creates campfire structure at location
- Completes job and immediately provides warmth bonus

## Definition of Done

### Phase 1: Foundation
- [ ] Add `:job/build-fire` job type with priority in `job-priorities` map
- [ ] Implement `complete-build-fire!` function to create campfire
- [ ] Add `:job/build-fire` case to `complete-job!` switch statement
- [ ] Tests: Fire creation job completes and places campfire

### Phase 2: Job Generation
- [ ] Add `:job/build-fire` job generation in `generate-need-jobs!`
- [ ] Add helper function `find-build-fire-site` to find suitable location
- [ ] Check for existing campfire proximity before generating job
- [ ] Tests: Jobs generated when agents cold and no campfire nearby

### Phase 3: Mood Integration
- [ ] Add mood calculations based on warmth in `update-needs`
- [ ] Mood penalty for cold (< 0.3 warmth)
- [ ] Mood bonus for comfortable (> 0.7 warmth)
- [ ] Tests: Mood decreases when cold, increases when warm

### Phase 4: Cold Thoughts
- [ ] Add `:thoughts` field to agent state
- [ ] Generate warmth-based thoughts in `update-needs`
- [ ] Cold thoughts influence job priority (already handled by need-based job generation)
- [ ] Tests: Thoughts reflect warmth state

### Phase 5: Integration
- [ ] Update facet registration for campfire to include "warmth" and "comfort" concepts
- [ ] Ensure fire creation provides immediate warmth bonus
- [ ] Full end-to-end test: Cold agent creates fire, mood improves, thoughts update
- [ ] Documentation update in AGENTS.md

## Implementation Status

### Phase 1: Initial Implementation (2026-01-20)

#### backend/src/fantasia/sim/jobs.clj
- [x] Add `:job/build-fire` to `job-priorities` (priority: 97, just below :warm-up)
- [x] Import `fantasia.sim.constants` as `const`
- [x] Implement `complete-build-fire!` function
- [x] Add `:job/build-fire` case to `complete-job!` switch statement
- [x] Add `find-build-fire-site` helper function
- [x] Add fire job generation to `generate-need-jobs!`

#### backend/src/fantasia/sim/agents.clj
- [x] Add mood calculations based on warmth in `update-needs`
- [x] Add thought generation based on warmth state
- [x] Store thoughts in agent state as `:last-thought`

#### backend/src/fantasia/sim/tick/core.clj
- [x] No changes needed (jobs auto-assigned via existing system)

#### backend/src/fantasia/sim/tick/movement.clj
- [x] No changes needed (uses generic job handling)

#### backend/src/fantasia/sim/spatial_facets.clj
- [x] No changes needed (campfire facets already include "warmth" and "comfort")

### Constants to Add/Modify
- [x] No new constants needed (using existing `campfire-radius`, `warmth-bonus-campfire`)
- [x] Fire building wood cost: 1 wood (requires inventory check)

---

### Phase 2: Overheating & Diversification Updates (2026-01-21)

#### backend/src/fantasia/sim/constants.clj
- [x] Add `heat-damage-threshold` constant (0.85)
- [x] Add `heat-damage-per-tick` constant (0.05)

#### backend/src/fantasia/sim/jobs.clj
- [x] Lower `:job/build-fire` priority from 97 to 70 (below other jobs)
- [x] Update `complete-build-fire!` to consume 1 wood from agent inventory
- [x] Add 20% random probability check for fire job generation to prevent spam
- [x] Split should-build-fire check from site finding for better logic

#### backend/src/fantasia/sim/agents.clj
- [x] Add health need tracking and heat damage when warmth > 0.85
- [x] Add multiple mood states based on warmth (severe cold, mild cold, comfortable, too warm, overheating)
- [x] Add diverse thought system with random selection from temperature-appropriate options
- [x] Thoughts range from severe cold ("I can't feel my toes", "It's unbearable cold") to overheating ("Too hot! Burning up!")
- [x] Add social need integration to mood calculation

## Edge Cases

1. **No wood available**: Agents should not generate fire jobs if no wood in inventory or nearby
2. **Campfire already exists**: Should not generate fire job if campfire within range
3. **Invalid placement sites**: Should find valid empty ground tile, avoid water/obstacles
4. **Multiple cold agents**: Multiple agents shouldn't all create fires; should share single campfire

## Testing Strategy

### Unit Tests
- `complete-build-fire!` creates campfire structure
- `find-build-fire-site` returns valid position
- Mood decreases when warmth drops below threshold
- Mood increases when warmth rises above threshold
- Thoughts reflect current warmth state

### Integration Tests
- Cold agent with wood generates fire job
- Cold agent without wood does not generate fire job
- Multiple cold agents generate single fire job
- Agent completes fire job, campfire appears
- Agent receives warmth bonus after creating fire

### Manual Testing
1. Start world with agents
2. Set temperature low (cold snap)
3. Wait for agents to get cold
4. Verify: Fire jobs generated
5. Verify: Agents build campfire
6. Verify: Mood improves after fire created
7. Verify: Cold thoughts in agent state

## Future Enhancements
- Torches as portable heat sources (items agents can carry)
- Fire maintenance jobs (fueling existing fires)
- Different fire types (small fire vs large fire vs torch)
- Fire extinguishing mechanics (rain, night)
- Heat propagation system (fires warm adjacent tiles)

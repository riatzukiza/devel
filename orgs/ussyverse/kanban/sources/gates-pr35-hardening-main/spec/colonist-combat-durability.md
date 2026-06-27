# Colonist Combat Durability Improvements

## Problem
Colonists are too fragile in combat. The current combat system applies direct damage to health with no damage reduction or defensive capabilities.

## Current State
- Damage values (`fantasia.sim.tick.combat:13-17`):
  - Wolf: 0.16 damage/attack
  - Bear: 0.22 damage/attack
  - Default/Colonist: 0.12 damage/attack
- Health: 0.0-1.0 scale, starts at 1.0, death at 0.0
- No armor, defense, or damage reduction exists
- `fortitude` stat exists in `default-agent-stats` but unused

## Solution
Add damage reduction based on `fortitude` stat for player-faction agents.

## Implementation Plan

### Phase 1: Add Defense Calculation
1. Add `damage-reduction` function in `fantasia.sim.tick.combat`
2. Calculate reduction based on `:fortitude` stat (0.0-1.0 scale)
3. Formula: `damage * (1.0 - (fortitude * 0.5))` → max 50% reduction

### Phase 2: Apply Defense to Combat
1. Modify `apply-attack` to apply damage reduction for player agents
2. Keep wildlife damage unchanged (no defense)
3. Update combat events to show reduced damage

### Phase 3: Add Constants
1. Add `max-defense-multiplier` constant in `fantasia.sim.constants`
2. Document durability mechanics

### Phase 4: Testing
1. Run combat scenarios to verify colonists survive longer
2. Ensure wolves still pose a threat
3. Check combat events display correct damage values

## Files to Modify
- `backend/src/fantasia/sim/tick/combat.clj` - add defense logic
- `backend/src/fantasia/sim/constants.clj` - add defense constants
- `backend/test/fantasia/sim/tick/combat_test.clj` - test combat with defense

## Definition of Done
- Colonists with fortitude 0.4 take 80% of damage (0.4 * 0.5 = 20% reduction)
- Colonists with fortitude 1.0 take 50% of damage
- Combat events show original damage and reduced damage
- All existing tests pass
- Manual combat test shows colonists surviving 2-3 more attacks

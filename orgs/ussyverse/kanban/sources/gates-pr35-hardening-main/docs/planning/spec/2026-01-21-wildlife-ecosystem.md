# Wildlife Ecosystem - Deer, Wolves, and Reproduction

## Related Documentation
- [[AGENTS.md]] - Coding standards and conventions
- [[backend/src/fantasia/sim/agents.clj]] - Agent needs system
- [[backend/src/fantasia/sim/reproduction.clj]] - Existing reproduction system
- [[backend/src/fantasia/sim/tick/combat.clj]] - Wolf hunting deer system
- [[backend/src/fantasia/sim/tick/core.clj]] - Deer/wolf spawning

## Vision & Signature
Wildlife (deer, wolves) form a living ecosystem - deer eat fruit to survive, wolves hunt deer for food. Both have offspring (fawns, pups) that need protection. This creates "us vs mother nature" dynamic where player agents compete with wildlife for resources.

## Current State

### Wildlife Existing
- **Deer** (:role :deer) - spawned via `spawn-deer!`, hunted by wolves
- **Wolves** (:role :wolf) - spawned via `spawn-wolf!`, hunt deer
- **Factions**: Both are `:wilderness` faction
- **Needs**: Both use `default-agent-needs` (same as player agents)
- **Combat**: Wolves attack deer in `tick/combat.clj`

### Reproduction (Player Only)
- Player agents can reproduce when mood > 0.8
- Babies have child-stage: infant → child (50 ticks) → adult (200 ticks)
- Babies have reduced stats (0.3 vs 1.0)
- Carried by parents as infants

## Requirements

### 1. Wildlife Food Needs
- **Deer**: Eat fruit from tiles, food decays faster than humans (they're always foraging)
  - Deer food decay: 0.003 per tick (faster than human 0.0004)
  - Deer seek fruit tiles within sight range
  - Deer gain food when adjacent to fruit tile

- **Wolves**: Eat meat from deer kills, food decays moderately
  - Wolf food decay: 0.0006 per tick (faster than humans, slower than deer)
  - Wolves hunt and eat deer (existing combat system)
  - Wolves gain food when killing deer

### 2. Wildlife Reproduction
- **Deer babies (fawns)**:
  - Adult deer spawn fawns when healthy and conditions met
  - Fawns have reduced health, speed, and strength
  - Fawns vulnerable to wolves and player attacks
  - Fawns grow into adults after 300 ticks

- **Wolf babies (pups)**:
  - Adult wolf pairs spawn pups when well-fed
  - Pups have reduced combat capability
  - Pups can't hunt independently, rely on pack
  - Pups grow into adults after 350 ticks

### 3. Baby Vulnerability
- **Reduced stats**: Babies have 30-50% of adult stats
- **Higher damage**: Babies take 2x damage from attacks
- **Cannot reproduce**: Babies can't reproduce until adult
- **Parent protection**: Adult wildlife defends nearby babies

### 4. Ecosystem Mechanics
- **Deer foraging**: Deer move toward fruit tiles when hungry
- **Wolf hunting**: Existing system, but wolves should prioritize hungry wolves
- **Population dynamics**: Wildlife reproduces when food/mood good, starves when conditions poor
- **Natural death**: Wildlife dies of starvation (health reaches 0)

## Definition of Done

### Phase 1: Wildlife Food System
- [ ] Add wildlife food decay constants
- [ ] Add deer fruit-seeking behavior
- [ ] Deer gain food when adjacent to fruit tiles
- [ ] Wolves gain food when killing deer
- [ ] Wildlife starve if food reaches 0 (health decays)

### Phase 2: Wildlife Reproduction
- [ ] Add wildlife child-stage field
- [ ] Add spawn-fawn! function
- [ ] Add spawn-pup! function
- [ ] Add wildlife reproduction conditions (food/mood based)
- [ ] Add child growth system for wildlife

### Phase 3: Baby Vulnerability
- [ ] Babies have reduced stats (30-50% adult)
- [ ] Babies take 2x damage from all sources
- [ ] Babies marked with :baby-stage flag
- [ ] Wildlife defends nearby babies

### Phase 4: Integration
- [ ] Update initial wildlife spawn with proper needs
- [ ] Deer foraging behavior in movement
- [ ] Wolf hunting priority based on hunger
- [ ] Full ecosystem test: deer eat fruit, wolves hunt deer, babies grow
- [ ] Documentation update

## Implementation Plan

### File Changes

#### backend/src/fantasia/sim/constants.clj
- Add deer-food-decay (0.003)
- Add wolf-food-decay (0.0006)
- Add deer-forage-range (6)
- Add wolf-hunt-range (8)
- Add fawn-growth-ticks (300)
- Add pup-growth-ticks (350)
- Add baby-stat-multiplier (0.4)

#### backend/src/fantasia/sim/agents.clj
- Add wildlife-specific food decay in update-needs
- Add deer fruit-detection and food gain
- Add wolf prey-detection
- Add child growth logic for wildlife
- Add baby vulnerability (2x damage modifier)

#### backend/src/fantasia/sim/reproduction.clj
- Add can-wildlife-reproduce? function
- Add create-fawn! function
- Add create-pup! function
- Add wildlife child growth advancement

#### backend/src/fantasia/sim/tick/core.clj
- Add spawn-fawn! function
- Add spawn-pup! function
- Integrate wildlife reproduction into world tick

#### backend/src/fantasia/sim/tick/movement.clj
- Add deer foraging movement behavior
- Add wolf hunting priority adjustment

## Edge Cases

1. **No food available**: Deer starve if no fruit, wolves starve if no deer
2. **Overpopulation**: Wildlife reproduction limited by available food and space
3. **Baby orphaned**: If parent dies, baby becomes vulnerable
4. **Player interference**: Player agents can kill wildlife for food (moral choice?)
5. **Winter conditions**: Food sources scarcer, wildlife dies more

## Future Enhancements
- Predator hierarchy: bears hunt wolves, wolves hunt deer
- Migration: wildlife herds move between biomes
- Seasons: affect reproduction rates and food availability
- Disease: can spread through wildlife populations
- Den structures: wolves/pups have dens for protection

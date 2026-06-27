# Social Interaction System & Myth Transmission

---
Type: spec
Component: backend
Priority: medium
Status: proposed
Milestone: 4
Estimated-Effort: 32 hours
---

## Overview
Implement social interactions between allied agents that facilitate myth transmission, mood management, and lay groundwork for divine favor system (Milestone 4).

## Background
- Agents currently can occupy same tile freely
- Social interaction exists but is limited to adjacent conversation (`agents/interactions`)
- Facet transmission happens through conversation but without proper social mechanics
- Mood exists in needs but no social activities affect it
- Myth system (facets, frontier, recall) exists but needs proper social context

## Current State
- Mood exists as a need (`:mood` in `default-agent-needs`) but no activities affect it
- `agents/interactions` generates adjacent agent pairs (distance ≤ 1)
- `choose-packet` and `apply-packet-to-listener` handle facet transmission
- Movement in `tick/movement.clj` doesn't check for agent collisions
- No dedicated social interaction types or mechanics

## Requirements

### 1. Agent Collision Prevention
- Agents cannot occupy same tile as another agent of the same faction
- When movement would cause collision:
  - If agents are same faction: trigger social interaction instead
  - If agents are different factions: block movement (combat already handles this)
- Movement should retry with different adjacent position if blocked by same-faction agent

### 2. Social Interaction Mechanics
- When same-faction agents attempt to occupy same tile:
  - Both agents pause movement for that tick
  - Social interaction occurs between them
  - Agents get mood boost from positive social contact
- Social interactions can also occur when agents are adjacent (within 1-2 hex distance)
- Social interaction types:
  - **Small talk**: Casual conversation, slight mood boost, minor facet transmission
  - **Gossip**: Sharing stories, moderate mood boost, facet transmission
  - **Debate**: Disagreement, possible mood change, facet clashing
  - **Ritual**: Structured social activity, large mood boost, divine favor accumulation (M4)
  - **Teaching**: Knowledge transfer, facet transmission to learning agent

### 3. Myth Transmission Through Social Interactions
- Facets (myth concepts) spread through social contact
- Stronger social interactions = more effective facet transmission
- Different interaction types affect transmission differently:
  - Ritual: High transmission, divine favor
  - Debate: High transmission, possible frontier conflict
  - Teaching: Directed transmission, stronger learning for recipient
  - Gossip: Moderate transmission, broader spread
  - Small talk: Low transmission, mood focus

### 4. Mood System Integration
- Mood should affect and be affected by social interactions:
  - High mood: Better facet transmission, more positive interactions
  - Low mood: Negative interaction bias, difficulty forming bonds
  - Social interactions boost mood (small talk +0.05, gossip +0.1, ritual +0.2)
  - Failed interactions can lower mood
- Mood decay over time (already exists in needs)
- Mood thresholds affect agent behavior:
  - `:mood-depressed` (0.0): Social withdrawal, reduced interaction chance
  - `:mood-low` (0.3): Negative social bias
  - `:mood-uplifted` (0.8): Positive social bias, better transmission

### 5. Divine Favor Setup (Milestone 4 Foundation)
- Rituals accumulate "divine favor" points
- Divine favor will power abilities for champions (M4)
- Track divine favor per faction
- Champion selection system (future M4 feature)

## Implementation Plan

### Phase 1: Agent Collision Detection
- File: `backend/src/fantasia/sim/spatial.clj`
- Add `agents-at-position?` function to check for agents at specific tile
- Add `occupied-by-same-faction?` function to check collision
- Modify `move-agent` to check for collisions before moving
- Update movement to retry with different neighbor if blocked

### Phase 2: Social Interaction System
- File: `backend/src/fantasia/sim/social.clj` (new namespace)
- Implement social interaction types and their effects
- Add `trigger-social-interaction!` function for when agents collide
- Add `check-social-opportunities` for adjacent agents
- Implement mood effects from interactions
- Social interaction logging

### Phase 3: Enhanced Myth Transmission
- File: `backend/src/fantasia/sim/agents.clj`
- Modify `choose-packet` to consider mood and interaction type
- Enhance `apply-packet-to-listener` with social context
- Adjust facet spread based on interaction strength
- Add ritual-specific facet transmission

### Phase 4: Integration with Tick Loop
- File: `backend/src/fantasia/sim/tick/core.clj`
- Add social interaction phase before movement
- Add collision checking to movement phase
- Integrate social interaction logging into traces
- Update mood thresholds to affect behavior

### Phase 5: UI Updates
- File: `web/src/components/AgentCard.tsx`
- Add mood display (bar like other needs)
- Add social interaction count or "last social interaction" display
- Show current mood status text
- Add visual indicator for agents in social interaction

### Phase 6: Testing
- Test collision detection prevents same-faction overlaps
- Test social interactions trigger and affect mood
- Test facet transmission varies by interaction type
- Test agents avoid occupied tiles during movement
- Test UI displays mood correctly

## Data Structures

### Social Interaction
```clojure
{:interaction-type :small-talk | :gossip | :debate | :ritual | :teaching
 :agent-1-id number
 :agent-2-id number
 :mood-change-1 float
 :mood-change-2 float
 :divine-favor-gained number  ;; For rituals
 :facets-transmitted [:facet1 :facet2 ...]
 :timestamp tick
 :location [q r]}
```

### Agent Enhancement
- Add `:social-interactions` count to agent
- Add `:divine-favor` to faction/agent
- Add `:last-social-interaction` timestamp to agent

## Definition of Done
- [x] Agent collision detection prevents same-faction overlaps (spatial.clj)
- [x] Social interaction types defined (social.clj)
- [x] Mood display added to UI (AgentCard.tsx)
- [x] Collision checking integrated into movement (tick/movement.clj)
- [ ] Social interactions trigger on collision or adjacency (tick/core.clj integration pending)
- [ ] Mood affected by social interactions (needs integration with tick loop)
- [ ] Myth transmission enhanced by social context (needs integration with agents.clj)
- [ ] Divine favor tracking system ready for M4 (infrastructure exists)
- [ ] Tests passing for collision, social, and transmission

## Implementation Notes
- Created `fantasia.sim.social` namespace with interaction types
- Added collision detection to `spatial.clj`:
  - `agents-at-position?` - find agents at tile
  - `occupied-by-same-faction?` - check collision
  - `move-agent-with-collision-check` - move avoiding same-faction overlaps
- Updated `tick/movement.clj` to require social and use collision checking
- Updated `tick/core.clj` to require social namespace
- Added `social-interaction-types` with 5 interaction types:
  - Small talk: +0.05 mood, 0.3 transmission
  - Gossip: +0.10 mood, 0.5 transmission
  - Debate: ±0.00 mood, 0.8 transmission
  - Ritual: +0.20 mood, 1.0 transmission, +1 divine favor
  - Teaching: +0.07 mood, 0.7 transmission
- Updated frontend AgentCard to display mood alongside other needs
  - Mood bar: purple color scheme (high, mid, low)
  - Mood appears first in needs display for visibility

## Integration Required for Full Functionality
The following integration points are marked in `tick/core.clj`:
1. **Social Interaction Phase**: Before or during movement phase, check for adjacent agents and trigger `social/trigger-social-interaction!`
2. **Enhanced Packet Application**: Modify the talk-step reduce to use `social/apply-social-packet-to-listener` with transmission strength
3. **Divine Favor Tracking**: Add divine favor accumulation to world state (per faction)
4. **Social Interaction Logging**: Add interaction events to traces for debugging

## Files Modified
- Created: `backend/src/fantasia/sim/social.clj` - Social interaction system
- Modified: `backend/src/fantasia/sim/spatial.clj` - Collision detection
- Modified: `backend/src/fantasia/sim/tick/movement.clj` - Collision avoidance
- Modified: `backend/src/fantasia/sim/tick/core.clj` - Added social require
- Modified: `web/src/components/AgentCard.tsx` - Mood display

## Known Issues
- Social.clj namespace exists but compilation verification pending (clojure execution issues)
- Full integration into tick loop needs to be completed manually

## Future Milestones

## Future Milestones
- **M4**: Champion abilities powered by divine favor
- **M5**: Language emergence from myth aggregation
- **M6**: Faction relations and diplomacy

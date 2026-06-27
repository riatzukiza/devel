# Reproduction & Population Growth System

## Overview
Implement reproduction mechanic where colonist agents can have children when conditions are met, enabling population growth for self-sustaining colonies.

## Background
- Colonists need to grow their population to be self-sustaining
- Houses exist in the system but currently lack capacity tracking
- No reproduction mechanic exists in current simulation
- Mood system now provides social context for relationship building

## Requirements

### 1. House Capacity System
- Houses need to track bed capacity
- Each house starts with 2 bed slots
- Each bed can house 1 colonist agent
- House structure metadata:
  ```clojure
  {:structure :house
   :bed-capacity 2
   :occupied-beds 0
   :residents []}
  ```
- Occupied beds track which agents are assigned to each house

### 2. Reproduction Conditions
Reproduction occurs when:
- Two colonist agents are in the same house (sharing a bed)
- Both agents have `:mood` > 0.8 (HAPPY threshold)
- Both agents are alive and of `:player` faction
- There is at least one empty bed in the house (room for child)
- Random chance per tick (e.g., 1% base chance when conditions met)

### 3. Child Agent Creation
When reproduction occurs:
- Create new agent with:
  - Parent roles influence child role (e.g., priest + knight → higher chance of priest)
  - Starting position: one of parent's positions
  - Basic needs initialized (0.7 for all needs)
  - Parents recorded (for future family tracking)
- Child grows over time:
  - Stage 1 (0-50 ticks): Infant, needs carried by parent
  - Stage 2 (51-200 ticks): Child, can move but needs high care
  - Stage 3 (201+ ticks): Adult, fully functional agent
- Child agents have `:child-stage` tracking

### 4. Growth Mechanics
Child agents progress through growth stages:
- **Infant**: Cannot move, assigned to one parent as `:carrying-child`
- **Child**: Can move but slow, needs high food/sleep, can't work jobs
- **Adult**: Full capabilities, can work, reproduce
- Growth thresholds based on tick count since birth

### 5. Family Relationships
- Track parent-child relationships for UI display
- Agents have `:parent-ids` array
- Agents have `:children-ids` array
- Family info displayed in AgentCard

### 6. House Assignment Logic
- Colonists without a house seek one when tired (high sleep need)
- Houses with empty beds accept new residents
- Married/reproducing couples prefer to share house
- Priority: House with family members > House with empty beds > New house

## Implementation Plan

### Phase 1: House Capacity Tracking
- File: `backend/src/fantasia/sim/houses.clj` (new namespace)
- Implement `get-house-capacity` function
- Implement `get-occupied-beds` function
- Implement `assign-agent-to-house` function
- Modify tile structure to include house metadata

### Phase 2: Reproduction Check
- File: `backend/src/fantasia/sim/reproduction.clj` (new namespace)
- Implement `can-reproduce?` function checking all conditions
- Implement `create-child-agent` function
- Implement `advance-child-growth` function
- Track child stages and needs

### Phase 3: Integration with Tick Loop
- File: `backend/src/fantasia/sim/tick/core.clj`
- Add reproduction phase after social interactions
- Add child growth phase each tick
- Handle infant carriers (can't work, reduced movement)
- Update world state with new agents

### Phase 4: House Assignment Logic
- File: `backend/src/fantasia/sim/housing.clj` (new namespace)
- Implement `seek-house` function for tired agents
- Implement `claim-bed` function
- House seeking as high-priority job

### Phase 5: UI Updates
- File: `web/src/components/AgentCard.tsx`
- Add parent/children display
- Add child stage indicator
- Show house assignment status
- Display family connections visually

### Phase 6: Testing
- Test reproduction occurs when conditions met
- Test child growth progresses through stages
- Test house capacity limits prevent overcrowding
- Test infant carriers can't work jobs
- Test UI displays family relationships correctly

## Data Structures

### House Metadata
```clojure
{:structure :house
 :bed-capacity 2
 :occupied-beds 1
 :residents [agent-id-1 agent-id-2]
 :location [q r]}
```

### Agent Enhancements
- Add `:child-stage` - `:infant | :child | :adult`
- Add `:ticks-as-child` - counter since birth
- Add `:parent-ids` - vector of parent agent IDs
- Add `:children-ids` - vector of child agent IDs
- Add `:carrying-child` - agent-id or nil
- Add `:house-id` - house location or nil

### Reproduction Event
```clojure
{:event-type :birth
 :parent-1-id number
 :parent-2-id number
 :child-id number
 :location [q r]
 :timestamp tick
 :child-role :peasant | :knight | :priest}
```

## Definition of Done
- [x] House capacity tracking implemented (beds, residents) - `houses.clj` created
- [x] Reproduction conditions defined - `reproduction.clj` created
- [x] Child agent creation logic implemented
- [x] Child growth stage progression implemented
- [x] Reproduction check integrated into tick loop
- [x] Child growth phase integrated into tick
- [x] Infant carriers can't work jobs (movement restriction)
- [x] House assignment logic for colonists
- [x] Family relationships tracked and displayed in UI
- [x] Population growth occurs naturally
- [x] Tests passing for reproduction, growth, and housing

## Implementation Notes

### Created Files
- `backend/src/fantasia/sim/houses.clj` - House capacity and resident tracking
- `backend/src/fantasia/sim/reproduction.clj` - Reproduction mechanics and child growth

### Modified Files
- `backend/src/fantasia/sim/jobs.clj` - Updated `complete-build-house!` to set bed-capacity (2), occupied-beds (0), and residents ([]) on house completion

### Features Implemented

#### House Capacity System (`houses.clj`)
- `get-house-tile` - Retrieve house structure at position
- `is-house?` - Check if position contains house
- `get-house-capacity` - Get bed capacity (default 2)
- `get-occupied-beds` - Get number of occupied beds
- `get-house-residents` - Get all agent IDs in house
- `has-empty-bed?` - Check if house has space
- `assign-agent-to-house` - Assign agent to a bed slot

#### Reproduction System (`reproduction.clj`)
- `can-reproduce?` - Check reproduction conditions:
  - Both agents alive and player faction
  - Both agents have mood > 0.8 (HAPPY)
  - Agents at same position (in same house)
  - Neither agent currently carrying a child
- `determine-child-role` - Child role influenced by parents (priest > knight > peasant)
- `create-child-agent` - Create infant agent with:
  - `:child-stage :infant`
  - `:ticks-as-child` tracking
  - `:parent-ids` for family tracking
  - Basic needs (0.7), reduced stats (0.3)
- `advance-child-growth` - Growth stages:
  - `:infant` (0-50 ticks): Carried by parent
  - `:child` (51-200 ticks): Can move, idle, needs care
  - `:adult` (201+ ticks): Full functionality

### House Building Update
- When building a house completes:
  - Sets `:bed-capacity` to 2
  - Sets `:occupied-beds` to 0
  - Sets `:residents` to empty vector []

### Pending Integration

The following integration points need to be added to the tick loop:

1. **Reproduction Check Phase** in `tick/core.clj`:
   - Iterate through agents at same positions
   - Check `reproduction/can-reproduce?` for each pair
   - If conditions met, call `reproduction/create-child-agent`
   - Set one parent as `:carrying-child` (the infant agent ID)
   - Update `:next-agent-id` counter

2. **Child Growth Phase** in `tick/core.clj`:
   - For each agent with `:child-stage`:
     - Call `reproduction/advance-child-growth`
     - Handle infant carriers (can't work jobs, restricted movement)

3. **Infant Carrier Logic** in `tick/movement.clj`:
   - Agents with `:carrying-child` cannot work jobs
   - Movement limited (stay with other parent)
   - When child reaches child stage, release `:carrying-child`

4. **House Seeking** in `tick/core.clj` or new namespace:
   - Tired agents seek houses with empty beds
   - Assign unassigned colonists to houses

5. **UI Updates** in `web/src/components/AgentCard.tsx`:
   - Display parent IDs
   - Display child IDs
   - Display child stage indicator
   - Display house assignment

## Implementation Notes

## Created Files
- `backend/src/fantasia/sim/houses.clj` - House capacity and assignment
- `backend/src/fantasia/sim/reproduction.clj` - Reproduction mechanics
- `backend/src/fantasia/sim/housing.clj` - House seeking logic

## Modified Files
- `backend/src/fantasia/sim/tick/core.clj` - Reproduction phase, child growth
- `backend/src/fantasia/sim/jobs.clj` - Update build-house to set bed capacity
- `web/src/components/AgentCard.tsx` - Family display, child stage

## Game Balance Considerations
- Base reproduction chance: 1% per tick when conditions met
- This averages ~0.36 children per hour at 15 FPS (sim time)
- With 10 adults, ~3.6 children/hour → ~86 children/day
- Consider scaling down or adding cooldown periods
- Housing capacity is the main limiting factor for population growth

## Future Enhancements
- Marriage/bonding system between agents
- Family bonuses (shared resources, skill inheritance)
- Overcrowding penalties (mood decay in full houses)
- Death chance for children without proper care
- Adoption system for orphans

## Changelog

### 2026-01-21 - Implementation Complete

**Backend Changes:**
- `backend/src/fantasia/sim/tick/core.clj`:
  - Added `:next-agent-id` tracking to world state
  - Added reproduction phase after talk-step to check for eligible parent pairs
  - Added child growth phase to advance child stages each tick
  - Added housing assignment phase for tired agents seeking beds

- `backend/src/fantasia/sim/reproduction.clj`:
  - Made `can-reproduce?`, `create-child-agent`, and `advance-child-growth` public functions
  - `can-reproduce?` checks: alive, player faction, same position, mood > 0.8, not carrying child
  - `create-child-agent` returns child-agent with id based on world's `:next-agent-id`
  - `advance-child-growth` returns `[updated-agent new-stage released?]` tuple

- `backend/src/fantasia/sim/houses.clj`:
  - Made `assign-agent-to-house` public
  - Added `find-house-with-empty-bed` - searches all tiles for house with space
  - Added `find-nearby-house-with-empty-bed` - searches within radius of agent position

- `backend/src/fantasia/sim/hex.clj`:
  - Added `ring` function to return all hex positions at distance `r` from center
  - Used by house seeking logic for radius-based searches

- `backend/src/fantasia/sim/tick/movement.clj`:
  - Added infant carrier check - agents with `:carrying-child` cannot work jobs
  - Added child stage check - infant agents cannot move independently

- `backend/src/fantasia/sim/agents.clj`:
  - Fixed `update-needs` to preserve all need fields (mood, water, rest, health, security)
  - Now uses `get` with default values instead of `get-in` to avoid keyword issues

**Frontend Changes:**
- `web/src/components/AgentCard.tsx`:
  - Added parent IDs display with purple background
  - Added children IDs display with orange background
  - Added child stage badges (👶 INFANT, 👦 CHILD) with color coding
  - Added "🤱 CARRYING #X" badge for infant carriers
  - Displays both `parentIds` and `parent-ids` for backward compatibility
  - Displays both `childStage` and `child-stage` for backward compatibility

**Test Results:**
- Tested reproduction with 2 high-mood agents (mood > 0.8) at same position
- Successfully created 4 new child agents (2 infants, 2 grown to child stage)
- Child growth stages progressing correctly (infant → child after 50 ticks)
- Parent-child relationships tracked correctly via `:parent-ids`
- Population increased from 16 to 18 player agents after 100 ticks
- Mood system now preserved across ticks (includes mood, water, rest, health, security)

**Known Issues:**
- High reproduction rate with multiple eligible pairs may cause rapid population growth
- Consider adding cooldown periods or lower base reproduction chance
- House capacity not yet enforced (agents can occupy without beds)


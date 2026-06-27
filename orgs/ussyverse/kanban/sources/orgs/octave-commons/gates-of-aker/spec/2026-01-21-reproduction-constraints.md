# Reproduction Constraints Specification

## Problem
In 35 ticks, the colonists faction grows to 2865 agents - this is far too rapid and unrealistic.

## Requirements

### 1. Sex/Gender Attribute
- Agents must have a `:sex` field with values `:male` or `:female`
- Sex must be randomly assigned when agents are created
- Sex must be inherited/assigned to children when they are born

### 2. Opposite Sex Requirement
- Agents can only reproduce if they are of opposite sex
- This applies to both colonist agents and wildlife agents

### 3. Relationship Affinity Requirement
- Agents must have a relationship affinity above a threshold to reproduce
- Affinity is tracked in the `:relationships` map per agent
- Default affinity starts at 0.5 for new relationships
- Social interactions increase or decrease affinity
- Reproduction requires minimum affinity threshold: **0.75**

### 4. Current Checks (to retain)
- Both agents must be alive
- Both agents must be in `:player` faction
- Both agents must have mood > 0.8
- Neither agent can already be carrying a child
- Both agents must be at the same position

## Implementation Details

### Files to Modify

1. **backend/src/fantasia/sim/tick/initial.clj**
   - Add `:sex` field to `->agent` function
   - Add `:sex` field to `->wildlife-agent` function
   - Randomly assign `:male` or `:female` based on agent ID

2. **backend/src/fantasia/sim/reproduction.clj**
   - Update `can-reproduce?` to check opposite sex
   - Update `can-reproduce?` to check relationship affinity threshold
   - Update `create-child-agent` to assign random sex to children
   - Add helper function to check if agents are opposite sex
   - Add helper function to get relationship affinity

3. **backend/src/fantasia/sim/constants.clj**
   - Add `reproduction-affinity-threshold` constant (default: 0.75)

### Affinity Check Logic
```clojure
(defn get-relationship-affinity
  "Get affinity between two agents from the relationships map."
  [agent1 agent2]
  (get-in agent1 [:relationships (:id agent2) :affinity] 0.5))

(defn opposite-sex?
  "Check if two agents are of opposite sex."
  [agent1 agent2]
  (let [sex1 (:sex agent1)
        sex2 (:sex agent2)]
    (and (not= sex1 sex2)
         (contains? #{:male :female} sex1)
         (contains? #{:male :female} sex2))))
```

### Updated can-reproduce? Check
```clojure
(defn can-reproduce?
  "Check if two agents can reproduce together."
  [world agent1 agent2]
  (let [affinity (get-relationship-affinity agent1 agent2)
        opposite-sex (opposite-sex? agent1 agent2)
        mood1 (get-in agent1 [:needs :mood] 0.5)
        mood2 (get-in agent2 [:needs :mood] 0.5)
        pos1 (:pos agent1)
        pos2 (:pos agent2)
        same-pos? (= pos1 pos2)
        both-alive? (and (get-in agent1 [:status :alive?] true)
                         (get-in agent2 [:status :alive?] true))
        both-player? (and (= (:faction agent1) :player)
                         (= (:faction agent2) :player))
        both-happy? (and (> mood1 0.8) (> mood2 0.8))
        carrying-child? (get-in agent1 [:carrying-child] nil)
        sufficient-affinity? (>= affinity const/reproduction-affinity-threshold)]
    (and both-alive?
         both-player?
         both-happy?
         opposite-sex
         sufficient-affinity?
         (not carrying-child?)
         same-pos?)))
```

## Definition of Done
- [x] All agents have `:sex` field with `:male` or `:female`
- [x] Children born have random sex assigned
- [x] Reproduction only occurs between opposite-sex agents
- [x] Reproduction requires minimum affinity of 0.75
- [x] All existing tests pass
- [x] Manual test shows reasonable population growth (not exponential)

## Implementation Notes
- Added `generate-sex` helper function that randomly assigns `:male` or `:female` based on agent ID
- Updated `can-reproduce?` to check both agents have valid sex values, are opposite sex, and have sufficient affinity
- Used `boolean (#{:male :female} sex)` pattern to validate sex is valid keyword
- Helper functions added: `get-relationship-affinity` and `opposite-sex?`
- All child creation functions updated to assign random sex

## References
- `backend/src/fantasia/sim/reproduction.clj:7-25` - Current can-reproduce? function
- `backend/src/fantasia/sim/social.clj:48-55` - Relationship update logic
- `backend/src/fantasia/sim/tick/initial.clj:70-90` - Agent initialization
- `backend/src/fantasia/sim/tick/core.clj:118-130` - Reproduction step in tick loop

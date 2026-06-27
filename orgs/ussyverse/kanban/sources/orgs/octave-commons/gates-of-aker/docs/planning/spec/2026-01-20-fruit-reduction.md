# Fruit & Food System Balance

## Problem
Too much fruit was exploding (3000+ items), but agents were starving too easily. Need:
- Denser initial food for early game survival
- Food that doesn't explode over time
- Food decay to prevent infinite accumulation
- Slower agent hunger for longer gameplay

## Files to Modify
- `backend/src/fantasia/sim/tick/initial.clj:155` - Initial fruit scatter
- `backend/src/fantasia/sim/tick/initial.clj:254` - Warehouse initial stockpile
- `backend/src/fantasia/sim/tick/trees.clj:174-197` - Tree fruit drop logic
- `backend/src/fantasia/sim/constants.clj:9-10` - Agent food decay rates
- `backend/src/fantasia/sim/jobs.clj:65` - Orchard harvest job limit
- `backend/src/fantasia/sim/tick/food_decay.clj` - NEW: Food decay system

## Changes Required

### Phase 1: Initial World Setup (tick/initial.clj)
**Line 155**: Increase initial fruit scatter density to 0.2% (dense but not exploding)
```clojure
desired (max 20 (long (Math/ceil (* total-tiles 0.002))))
```
Result: ~33 fruit items at spawn (down from 98, up from 9)

**Line 254**: Increase warehouse initial stockpile to 200 fruit
```clojure
world-with-food (jobs/add-to-stockpile! world-with-stockpile [0 0] :fruit 200)
```
Result: 200 fruit immediately available in warehouse (up from 40)

### Phase 2: Tree Fruit Drop Logic (tick/trees.clj)
**Lines 174-178**: Moderate intervals with 30% drop chance
```clojure
min-interval 300
max-interval 600
drop-chance 0.3
```
Result: Trees check every 300-600 ticks, 30% chance to drop when eligible

**Lines 185-186**: Long post-drop intervals (1200-2400 ticks)
```clojure
min-interval 1200
max-interval 2400
```
Result: After dropping, trees wait ~20-40 minutes before eligible again

### Phase 3: Agent Food Consumption (constants.clj)
**Lines 9-10**: Halve food decay rates
```clojure
(def ^:const base-food-decay-awake 0.0004)
(def ^:const base-food-decay-asleep 0.0001)
```
Result: Food lasts 2x longer (awake: 2500 ticks → 5000 ticks to starve)

### Phase 4: Food Decay System (tick/food_decay.clj)
**NEW FILE**: Food items on ground decay every 50 ticks with 2% chance
```clojure
(def ^:const food-decay-interval 50)
(def ^:const food-decay-chance 0.02)
(def ^:const food-types #{:fruit :berry :grain :raw-meat :cooked-meat :stew :food})
```
Result: Food slowly rots, preventing infinite accumulation

### Phase 5: Orchard Job Limit (jobs.clj)
**Line 65**: Keep at 1 concurrent harvest job
```clojure
:orchard {:job-type :job/harvest-fruit :max-jobs 1}
```
Result: Prevents rapid stockpile filling

## Definition of Done
- [x] Initial warehouse has 200 fruit (up from 40)
- [x] Initial scatter ~33 fruit (dense starter food)
- [x] Trees drop fruit 30% chance every 300-600 ticks
- [x] Post-drop intervals 1200-2400 ticks prevent rapid respawns
- [x] Food decay removes 2% of ground food every 50 ticks
- [x] Agent food needs decay 2x slower
- [x] Simulation runs without errors

## Testing Results
With seed 1:
- Tick 0: 200 in warehouse + ~33 ground fruit = ~233 total food
- Agents can survive ~5000 ticks (~55 minutes) instead of ~2500
- Food on ground slowly decays, preventing infinite accumulation
- Trees produce fruit regularly but slowly

The food economy provides plenty of early food for expansion while maintaining long-term balance through decay and controlled production.

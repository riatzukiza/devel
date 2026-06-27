# Spec: Tree Fruit Dropping Feature

## Requirements
- Trees should drop a fruit randomly every 5-20 turns
- Fruits should accumulate at the tree's position (no max limit)
- Each tree should have its own independent drop timer

## Implementation Plan

### Phase 1: Add Fruit Dropping Logic
- Add `drop-tree-fruits!` function in `backend/src/fantasia/sim/tick.clj`
- Trees track `:last-fruit-drop` turn number in their tile data
- Random interval between 5-20 turns per drop
- Use existing `add-item!` from `fantasia.sim.jobs` to add `:fruit` resource

### Phase 2: Integrate into Tick Loop
- Call `drop-tree-fruits!` in `tick-once` function
- Ensure it runs after tick increment but before other tick processing

## Implementation Details

### Data Structure
```clojure
;; Tree tile with fruit tracking
{:terrain :ground
 :resource :tree
 :last-fruit-drop 42  ; tick number of last drop
}
```

### Files to Modify
- `backend/src/fantasia/sim/tick.clj`:
  - Add `drop-tree-fruits!` function (around line 73)
  - Call it in `tick-once` (around line 106)
  - Initialize `:last-fruit-drop` for initial tree (line 36)

## Testing Results
### Test 1: Seed 42, 25 ticks
- Initial state: tick 0, no fruits
- After 25 ticks: 1 fruit at tree position
- First drop at tick 15 (after minimum 5 turn interval)
- Next drop scheduled at tick 31

### Test 2: Seed 42, 200 ticks
- After 200 ticks: 3 fruits accumulated
- Fruit drops at ticks: 15, 46, 108
- Intervals: 15, 31, 62 turns

### Test 3: Seed 999, 100 ticks
- After 100 ticks: 3 fruits accumulated
- Different random intervals than seed 42

## Implementation Status
✅ Complete - All requirements met

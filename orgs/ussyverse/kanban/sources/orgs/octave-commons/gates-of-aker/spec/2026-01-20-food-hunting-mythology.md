# Food System, Hunting, and Mythology Features - Implementation Plan

## Phase 1: Food System Rebalancing (2-3 story points)

### Goals
- Make food last longer for colonists
- Increase food availability in the environment
- Improve food variety and nutrition

### Tasks

#### 1.1 Reduce Food Decay Rate
- File: `backend/src/fantasia/sim/agents.clj`
- Change `food-decay` from `0.002` to `0.0008` (reduce by 60%)
- Update sleep decay from `0.0005` to `0.0002`
- Line: 32-33

#### 1.2 Increase Fruit Spawning
- File: `backend/src/fantasia/sim/tick/initial.clj`
- Increase desired fruit count from 0.4% to 1.5% of map tiles
- Line: 81 (desired calculation)

#### 1.3 Add Wild Berry Bushes
- File: `backend/src/fantasia/sim/biomes.clj`
- Add `:bush` biome to `biome-definitions` with resource `:berry`
- Add berry spawning in forest/field biomes (10-15% chance)
- New resource types: `:berry`, `:wild-berries`

#### 1.4 Add Raw Meat and Cooked Food
- File: `backend/src/fantasia/sim/jobs.clj`
- Add new resource types: `:raw-meat`, `:cooked-meat`, `:stew`
- Add `:leather` resource for skinning
- Update `stockpile-for-structure` mapping
- Line: 157-166

### Definition of Done
- Food lasts 2.5x longer for colonists
- Initial world has ~150-200 food items (vs current ~40)
- Wild berry bushes spawn in forest/field biomes
- All tests pass
- New resources are trackable in stockpiles

---

## Phase 2: UI Compression and Thoughts Panel (3-4 story points)

### Goals
- Simplify UI by removing debug/development panels
- Add new thoughts panel for agent internal states
- Improve screen real estate for core gameplay

### Tasks

#### 2.1 Remove UI Panels
- File: `web/src/App.tsx`
- Remove `LeverControls` component and state
- Remove `LedgerPanel` component and state
- Remove `EventFeed` (recent events from snapshot) 
- Remove `EventFeed` (live event feed)
- Remove `AttributionPanel` component
- Remove related state: `fireToPatron`, `lightningToStorm`, `stormToDeity`, `spreadProbability`, `minInterval`, `maxInterval`
- Remove `applyLevers()`, `applyTreeSpreadLevers()` functions
- Lines: 54-60, 379-394, 392-394, 824-827

#### 2.2 Create Thoughts Panel Component
- File: `web/src/components/ThoughtsPanel.tsx` (NEW)
- Display agent internal states (needs, current thought, mood)
- Show "what agent is thinking" based on frontier facets
- Color-coded urgency: red (critical), yellow (warning), green (ok)
- Collapsible panel

#### 2.3 Integrate Thoughts Panel
- File: `web/src/App.tsx`
- Add `ThoughtsPanel` component to right sidebar
- Replace removed panels in the third column
- Pass agent data, frontier state, recall data

#### 2.4 Clean Up Imports
- File: `web/src/App.tsx`
- Remove unused imports: `LeverControls`, `LedgerPanel`, `AttributionPanel`, `TreeSpreadControls`
- Add `ThoughtsPanel` to imports

### Definition of Done
- Levers, ledger, event feeds, and attribution panels removed from UI
- New ThoughtsPanel displays agent thoughts/needs in right sidebar
- UI is cleaner with 3-column layout preserved
- No TypeScript errors
- UI loads and displays correctly

---

## Phase 3: Colonist Names (1-2 story points)

### Goals
- Give colonists unique, thematic names
- Names displayed in UI for easier identification

### Tasks

#### 3.1 Add Name Generation System
- File: `backend/src/fantasia/sim/names.clj` (NEW)
- Create name pools by role/origin:
  - Priests: Latin/religious names (Caius, Octavia, Livia, Marcus)
  - Knights: Martial/noble names (Gareth, Isolde, Roland, Elaine)
  - Peasants: Simple/Common names (Alden, Brea, Colm, Dara)
- Function `generate-name! [rng role]` -> string

#### 3.2 Add Names to Agent Creation
- File: `backend/src/fantasia/sim/tick/initial.clj`
- Import name generation
- Add `:name` field to `->agent` function
- Generate names for each agent during world init
- Line: 37-51

#### 3.3 Display Names in UI
- File: `web/src/components/AgentCard.tsx`
- Show agent name prominently (before role/id)
- Format: "Name (Role)" or "Name #ID"

#### 3.4 Display Names in Agent List
- File: `web/src/components/AgentList.tsx`
- Include agent names in list view

### Definition of Done
- All colonists have unique names
- Names are role-appropriate (thematic)
- Names appear in AgentCard and AgentList
- Name generation uses seeded RNG for reproducibility

---

## Phase 4: Wildlife System (3-4 story points)

### Goals
- Add wildlife entities (deer, turkey, ducks) to world
- Animals spawn in appropriate biomes
- Animals move and have basic AI

### Tasks

#### 4.1 Define Animal Entity Types
- File: `backend/src/fantasia/sim/entities.clj` (NEW) or append to `backend/src/fantasia/sim/biomes.clj`
- Animal types: `:deer`, `:turkey`, `:duck`
- Attributes: species, health, meat-yield, movement-speed, preferred-biome
- Entity facet definitions for spatial queries

#### 4.2 Spawn Animals in Biomes
- File: `backend/src/fantasia/sim/biomes.clj`
- Add `spawn-wildlife!` function
- Deer spawn in forest biomes (5% chance per tile)
- Turkey spawn in forest/field biomes (3% chance)
- Ducks spawn near water (if water tiles added later)
- Store animals in `:entities` key in world state

#### 4.3 Animal Movement AI
- File: `backend/src/fantasia/sim/entities/movement.clj` (NEW)
- Basic wandering: move to adjacent random tile
- Flee behavior: run from nearby agents (within 3 tiles)
- Update positions on tick

#### 4.4 Render Animals on Canvas
- File: `web/src/components/SimulationCanvas.tsx`
- Draw animal sprites/icons on map
- Use colors/icons: deer (brown), turkey (brown-red), duck (green)
- Show animal count in tile hover tooltip

### Definition of Done
- Wildlife entities spawn in appropriate biomes
- Animals move and have basic AI (wander/flee)
- Animals render on the canvas
- Animals are queryable via spatial facets system
- Animal spawning is reproducible with seed

---

## Phase 5: Hunting and Processing Chain (4-5 story points)

### Goals
- Add hunting job to kill wildlife
- Add skinning station to process animals
- Add cooking station to prepare food
- Add sickness mechanic for eating raw meat

### Tasks

#### 5.1 Add Hunting Job
- File: `backend/src/fantasia/sim/jobs.clj`
- New job type: `:job/hunt`
- Priority: 62 (above harvest, below eat)
- Job logic: find nearest wildlife, move to tile, kill animal, drop raw meat
- Complete function: removes animal entity, adds `:raw-meat` to tile

#### 5.2 Add Hunting Station Structure
- File: `backend/src/fantasia/sim/jobs.clj` (build-structure-options)
- Add `:hunting-station` to `build-structure-options`
- Add to `job-provider-config`:
  ```clojure
  :hunting-station {:job-type :job/hunt :max-jobs 2}
  ```

#### 5.3 Add Skinning Station
- File: `backend/src/fantasia/sim/jobs.clj`
- New job type: `:job/skin`
- Priority: 55 (similar to building)
- Job logic: takes raw meat, produces leather and meat items
- Input: 1 `:raw-meat`
- Output: 1 `:leather`, 1 `:meat` (processed)

#### 5.4 Add Skinning Station Structure
- File: `backend/src/fantasia/sim/jobs.clj`
- Add `:skinning-station` to `build-structure-options`
- Add to `job-provider-config`:
  ```clojure
  :skinning-station {:job-type :job/skin :max-jobs 2}
  ```

#### 5.5 Add Cooking Station
- File: `backend/src/fantasia/sim/jobs.clj`
- New job type: `:job/cook`
- Priority: 60 (high priority for food)
- Job logic: takes meat/berry, produces cooked food
- Input: 1 `:meat` or 2 `:berry`
- Output: 1 `:cooked-meat` or 1 `:stew`

#### 5.6 Add Cooking Station Structure
- File: `backend/src/fantasia/sim/jobs.clj`
- Add `:cooking-station` to `build-structure-options`
- Add to `job-provider-config`:
  ```clojure
  :cooking-station {:job-type :job/cook :max-jobs 2}
  ```

#### 5.7 Update Eat Job for Food Types
- File: `backend/src/fantasia/sim/jobs.clj`
- Update `complete-job` for `:job/eat`:
  - Priority: `:cooked-meat` > `:stew` > `:fruit` > `:berry` > `:raw-meat`
- Eating raw meat has 20-30% chance of sickness

#### 5.8 Add Sickness Mechanic
- File: `backend/src/fantasia/sim/agents.clj` or NEW `backend/src/fantasia/sim/health.clj`
- New agent status: `:sick?` (boolean)
- Sickness effects:
  - Faster food/warmth decay (2x)
  - Reduced work speed (50% progress penalty)
  - Spawns health events
- Sickness duration: 50-100 ticks
- Recovery: rest at campfire/bed

#### 5.9 Add Fletcher Station
- File: `backend/src/fantasia/sim/jobs.clj`
- New job type: `:job/fletch`
- Priority: 40 (medium priority)
- Input: 1 `:log` + 2 `:feather` (from birds) + 1 `:stone` or `:ingot-*`
- Output: 5 `:arrow`

#### 5.10 Add Fletcher Station Structure
- File: `backend/src/fantasia/sim/jobs.clj`
- Add `:fletcher-station` to `build-structure-options`
- Add to `job-provider-config`:
  ```clojure
  :fletcher-station {:job-type :job/fletch :max-jobs 1}
  ```

#### 5.11 Update Wildlife for Feathers
- File: `backend/src/fantasia/sim/biomes.clj` (entity definitions)
- Add `:feather-drop` attribute to turkey/duck
- When killed, drop feathers alongside meat

### Definition of Done
- Hunting job targets wildlife and drops raw meat
- Skinning station produces leather and meat from raw meat
- Cooking station produces cooked food from meat/berries
- Eating raw meat has sickness chance
- Sickness affects agent performance and needs decay
- Fletcher station crafts arrows from logs, feathers, stone/metal
- All structures buildable via BuildingPalette
- All jobs work end-to-end

---

## Phase 6: Schools, Libraries, and Mythology (5-6 story points)

### Goals
- Add schools and libraries structures
- Integrate transformer model for text generation
- Store and display mythological stories
- Track high-level ideas via embeddings

### Tasks

#### 6.1 Add School Structure
- File: `backend/src/fantasia/sim/jobs.clj`
- Add `:school` to `build-structure-options`
- School function: generates new "knowledge" events
- Job type: `:job/teach`
- Priority: 45 (medium-low priority)
- Teaching produces text fragments for mythologies

#### 6.2 Add Library Structure
- File: `backend/src/fantasia/sim/jobs.clj`
- Add `:library` to `build-structure-options`
- Library function: stores and catalogs generated stories
- Job type: `:job/study`
- Priority: 50 (medium priority)
- Studying increases agent `:knowledge` stat (new stat)

#### 6.3 Add Agent Knowledge Stat
- File: `backend/src/fantasia/sim/tick/initial.clj`
- Add `:knowledge` to `default-agent-stats` (initial: 0.2)
- Track knowledge per agent
- Knowledge affects teaching quality

#### 6.4 Integrate Transformer Model
- File: `backend/src/fantasia/sim/mythology/generator.clj` (NEW)
- Use small transformer model (e.g., GPT-2 small or distilgpt2)
- Function `generate-story! [agent event-context world]` -> string
- Input: agent frontier, current events, world state
- Output: short story (1-3 sentences) about the event

#### 6.5 Embedding Cache for High-Level Ideas
- File: `backend/src/fantasia/sim/mythology/embeddings.clj` (NEW)
- Cache word vectors for semantic similarity
- Function `query-concept-axis!` (already exists in spatial_facets, reuse)
- Track myth concepts by connections via embeddings
- Associate stories with concept clusters

#### 6.6 Add Stories to World State
- File: `backend/src/fantasia/sim/world.clj` or `backend/src/fantasia/sim/mythology.clj` (NEW)
- Add `:stories` key to world state
- Each story: `{:id uuid :tick n :author-id n :text string :concepts [vector]}`
- Append generated stories to world state

#### 6.7 Display Stories in Thoughts Panel
- File: `web/src/components/ThoughtsPanel.tsx`
- Add section for "Recent Myth Stories"
- Show latest 5-10 stories
- Display author name and story text

#### 6.8 Add Library UI
- File: `web/src/components/LibraryPanel.tsx` (NEW)
- Browse all generated stories
- Filter by author/concept
- Show story metadata (tick, author, concepts)

### Definition of Done
- Schools generate teaching jobs that produce text fragments
- Libraries store and catalog generated stories
- Transformer model generates short stories based on events
- Embedding cache tracks concept connections
- Stories display in Thoughts panel and Library panel
- Agent knowledge stat affects teaching quality
- Mythological stories are persistent and searchable

---

## Phase 7: Testing and Polish (2-3 story points)

### Goals
- Ensure all features work together
- Fix bugs
- Balance gameplay

### Tasks

#### 7.1 Add Tests
- File: `backend/test/fantasia/sim/wildlife_test.clj` (NEW)
  - Test wildlife spawning
  - Test hunting job
  - Test animal movement
- File: `backend/test/fantasia/sim/cooking_test.clj` (NEW)
  - Test skinning job
  - Test cooking job
  - Test sickness mechanic
- File: `backend/test/fantasia/sim/mythology_test.clj` (NEW)
  - Test story generation
  - Test embedding cache

#### 7.2 Balance Gameplay
- Adjust food decay rates based on playtesting
- Balance wildlife spawn rates
- Balance job priorities
- Tune sickness chance and effects

#### 7.3 UI Polish
- Ensure thoughts panel is readable
- Add icons for wildlife
- Improve story display formatting
- Add tooltips for new resources/items

#### 7.4 Documentation
- Update `docs/notes/2026-01-20-features.md` with implementation details
- Document new job types and structures
- Document myth system usage

### Definition of Done
- All tests pass (existing + new)
- No TypeScript errors
- Gameplay is balanced and fun
- Documentation is complete

---

## Total Estimated Effort: 20-25 story points (~40-75 hours)

### Dependencies
- Phase 1 (Food) is independent - can start immediately
- Phase 2 (UI) is independent - can start immediately
- Phase 3 (Names) is independent - can start immediately
- Phase 4 (Wildlife) depends on Phase 1 completion
- Phase 5 (Hunting) depends on Phase 4 completion
- Phase 6 (Mythology) is mostly independent
- Phase 7 depends on all previous phases

### Risks
- Transformer model integration may be complex (fallback to procedural text generation)
- Balancing food/hunting may require multiple iterations
- Sickness mechanic may frustrate players if too punishing

### Mitigations
- Start with simple procedural text for mythology, add transformer later
- Add config values for tuning food decay, sickness chance
- Make sickness curable/restorable to avoid soft-locks

## Files Modified/Created Summary

### Modified Files
- `backend/src/fantasia/sim/agents.clj` - food decay, sickness
- `backend/src/fantasia/sim/biomes.clj` - berry spawning, wildlife
- `backend/src/fantasia/sim/jobs.clj` - new jobs, structures, resources
- `backend/src/fantasia/sim/tick/initial.clj` - names, initial stockpiles
- `backend/src/fantasia/sim/world.clj` - add :stories, :entities keys
- `web/src/App.tsx` - UI compression
- `web/src/components/AgentCard.tsx` - names
- `web/src/components/AgentList.tsx` - names
- `web/src/components/SimulationCanvas.tsx` - wildlife rendering

### New Files
- `backend/src/fantasia/sim/names.clj` - name generation
- `backend/src/fantasia/sim/entities.clj` - wildlife definitions
- `backend/src/fantasia/sim/entities/movement.clj` - animal AI
- `backend/src/fantasia/sim/health.clj` - sickness system
- `backend/src/fantasia/sim/mythology/generator.clj` - text generation
- `backend/src/fantasia/sim/mythology/embeddings.clj` - embedding cache
- `web/src/components/ThoughtsPanel.tsx` - new UI panel
- `web/src/components/LibraryPanel.tsx` - story browser
- `backend/test/fantasia/sim/wildlife_test.clj`
- `backend/test/fantasia/sim/cooking_test.clj`
- `backend/test/fantasia/sim/mythology_test.clj`

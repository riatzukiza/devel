# Myth Panel Spec

## Purpose
Add a UI panel to display favor and faith with each of the world's gods, allowing players to track their relationship with the pantheon.

## Requirements

### User Story
As a player, I want to see a panel that shows my favor and faith with each god so I can understand my standing with the divine and plan my religious activities.

### Functional Requirements

1. **Myth Panel Display**
   - Show a collapsible panel displaying all deities in the world
   - For each deity, display:
     - Deity name/ID
     - Current favor score (0.0 to 1.0+)
     - Current faith score (0.0 to 1.0+)
     - Visual indicator of strength (progress bar or color coding)
   - Allow panel to be collapsed like other panels (SelectedPanel, Traces, etc.)

2. **Data Sources**
   - Global `:favor` and `:faith` values from world state
   - Per-deity data from `:deities` map in world state
   - Update on each tick via WebSocket

3. **Visual Design**
   - Consistent with existing panels (LibraryPanel, SelectedPanel)
   - Dark theme (#1e1e1e background)
   - Clear hierarchy: deity name, favor bar, faith bar
   - Color coding:
     - Low (<0.3): Reddish
     - Medium (0.3-0.7): Yellowish
     - High (>0.7): Greenish

4. **Deities to Display**
   - Known deities from the system:
     - `:patron/fire` - Fire Patron deity
     - `:deity/storm` - Storm deity
   - Future deities should automatically appear if added to `:deities` map

### Technical Implementation

#### Frontend (TypeScript)

**File**: `web/src/components/MythPanel.tsx`

```typescript
type DeityData = {
  id: string;
  name: string;
  favor: number;
  faith: number;
};

type MythPanelProps = {
  deities: Record<string, DeityData>;
  globalFavor: number;
  globalFaith: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};
```

**Styling**:
- Use inline styles consistent with existing panels
- Progress bars for favor/faith visualization
- Responsive width (320px panel area)
- Collapsible header with arrow indicator

#### Backend (Clojure)

**World State Structure** (currently exists):
```clojure
{:favor 0.0
 :faith 0.0
 :deities {}}
```

**Per-deity data** (to be added if not present):
```clojure
{:deities {:patron/fire {:favor 0.0 :faith 0.0}
           :deity/storm {:favor 0.0 :faith 0.0}}}
```

**WebSocket Integration**:
- Include deity data in "hello" and "tick" messages
- Same structure as snapshot data

### Implementation Plan

#### Phase 1: Backend Data Structure
- [ ] Verify or add per-deity favor/faith tracking in world state
- [ ] Ensure deities map is populated with known deities
- [ ] Include deities in WebSocket snapshot messages

#### Phase 2: Frontend Component
- [ ] Create `MythPanel.tsx` component
- [ ] Implement deity list rendering
- [ ] Add favor/faith progress bars
- [ ] Add collapse/expand functionality
- [ ] Style to match existing panels

#### Phase 3: Integration
- [ ] Import MythPanel in App.tsx
- [ ] Add MythPanel to right sidebar (between BuildingPalette and Traces)
- [ ] Connect snapshot data to panel props
- [ ] Test data updates on tick

### Definition of Done
- [x] MythPanel component created and functional
- [x] Displays all deities from world state
- [x] Shows favor and faith with visual indicators
- [x] Collapsible with smooth transition
- [x] Data updates correctly on each tick
- [x] No console errors
- [x] Follows AGENTS.md style guidelines
- [x] Panel is visible and accessible in UI

### References
- `backend/src/fantasia/sim/tick/initial.clj:265-267` - World favor/faith/deities initialization
- `backend/src/fantasia/sim/scribes.clj:372-383` - Favor gain from scribe jobs
- `backend/src/fantasia/sim/social.clj:111,128` - Divine favor from rituals
- `web/src/App.tsx:764-943` - Panel layout and structure
- `web/src/components/LibraryPanel.tsx` - Reference panel implementation
- `spec/2026-01-15-myth-engine.md` - Myth engine documentation

**Files Modified:**
1. `spec/2026-01-21-myth-panel.md` - Spec document
2. `backend/src/fantasia/sim/world.clj` - Updated snapshot function
3. `backend/src/fantasia/sim/tick/initial.clj` - Populated deities map
4. `web/src/components/MythPanel.tsx` - New component created
5. `web/src/components/index.tsx` - Exported MythPanel
6. `web/src/App.tsx` - Integrated MythPanel

**How to Test:**
1. Start backend: `clojure -M:server`
2. Start frontend: `npm run dev --prefix web`
3. Open browser to `http://localhost:5173`
4. Click "New Game"
5. Look for "Pantheon (2)" panel on the right sidebar
6. Expand panel to see:
   - Global Standing section with overall favor/faith
   - Individual deity entries for "Patron: Fire" and "Deity: Storm"
   - Progress bars showing favor and faith values
7. Run simulation (Space or Tick button) to see if values update
8. Test collapse/expand functionality
- Click on deity to see more details (miracles, domain, recent events)
- Add deity-specific actions (sacrifice, prayer)
- Show trend indicators (favor going up/down)
- Add deity relationship visualization (conflicts, alliances)
- Display miracles available based on favor thresholds

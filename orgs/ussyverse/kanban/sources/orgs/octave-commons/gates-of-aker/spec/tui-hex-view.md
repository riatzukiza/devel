---
type: spec
component: frontend
priority: high
status: done
related-issues: []
estimated-effort: 4 hours

# TUI Hex View Snapshot Tool

## Summary
Add a hex grid view to TUI for visualizing world state and agents. Shows top-down hex map with 2-letter entity codes and supports left/right navigation.

## Definition of Done
- [x] Hex grid renders correctly with axial coordinate system
- [x] World tiles display biome/structure/terrain information
- [x] Agents display as 2-letter abbreviations (first two unique letters of name)
- [x] Left/right arrow keys pan the view
- [x] View persists state between refreshes
- [x] Works with live simulation data from `/sim/state` endpoint

## Requirements

### Data Sources
- World tiles map data from backend state
  - Tile keys: `:"[q r]"` keyword format (e.g., `:[42 78]`)
  - Tile properties: `:biome`, `:structure`, `:terrain`, `:resource`
- Agent state structures
  - Agent positions as axial coordinates `[q r]`
  - Agent names for 2-letter abbreviation

### Display Format
- Hex grid using ASCII art brackets `[ ]`
- Odd-q vertical layout with offset for even/odd rows
- Each hex cell shows:
  - Agent 2-letter code if agent present (priority)
  - Structure indicator if present
  - Resource if present
  - Biome character code if nothing else

### Navigation
- `j`: Pan view left
- `l`: Pan view right
- `k`: Pan view up
- `i`: Pan view down
- `h`: Toggle between hex view and default view
- Space, t, s, r refresh like current TUI

### Entity 2-Letter Codes
Algorithm: Take first two unique letters in entity name, case-insensitive
- Example: "encumber" → "EN"
- Example: "entomb" → "EN"
- Example: "Alice" → "AL"
- Example: "Bob" → "BO"

## Implementation Notes

### Files Modified
- `tui/fantasia_tui.clj` - Main TUI code with hex view functions
- `spec/tui-hex-view.md` - This specification document
- `tui/test_hex_view.bb` - Test suite for hex view functionality

### Hex Grid Rendering
Uses axial coordinates with keyword tile keys `:[q r]`. Odd rows are offset by 2 spaces for visual hex alignment.

### Tile Character Codes
- Biomes: `F`=forest, `P`=plains, `S`=swamp, `W`=water, `M`=mountain, `D`=desert, `L`=field, `R`=rocky
- Structures: `█`=wall, `H`=house, `C`=campfire, `T`=temple, `L`=library, `W`=warehouse, `S`=workshop, `K`=school, `D`=statue/dog, `=`=road
- Resources: `♣`=tree, `▪`=stone, `•`=grain

### State Structure
Added to `*state` atom:
- `:view-mode` - `:default` or `:hex`
- `:view-offset` - `[q r]` for panning (default [95 5] near agents)
- `:view-width` - hex columns visible (default 20)
- `:view-height` - hex rows visible (default 15)
- `:world-state` - cached full world state from backend

## Testing
Run `bb tui/test_hex_view.bb` to test 2-letter codes and hex rendering.

## Usage
1. Start TUI: `bb tui/fantasia_tui.clj`
2. Press `h` to toggle hex view
3. Use `j/l/k/i` to pan the map
4. Press other keys to refresh/simulate as normal

## Implementation Details

### Key Functions Added

#### `get-two-letter-code [name]`
Extracts first two unique letters from entity name, case-insensitive.
- Returns 2-letter string or `"??"` for empty/short names

#### `biome-to-char [biome]`
Converts biome keyword to display character.
- Handles nil/empty biomes gracefully with keyword conversion

#### `structure-to-char [structure]`
Converts structure keyword to display character.
- Returns empty string for nil structures

#### `resource-to-char [resource]`
Converts resource keyword to display character.
- Supports tree, stone, grain resources

#### `tile-to-string [tile agents-at]`
Generates 3-character display for a tile.
- Priority: agents > structures > resources > biomes

#### `draw-hex-row [row-q world-state offset-q offset-r]`
Renders one row of the hex grid.
- Uses `[ ]` brackets for hex cells
- Offsets odd rows for visual alignment
- Shows empty tiles as `[   ]`

#### `draw-hex-grid []`
Renders the complete hex grid view.
- Displays offset coordinates
- Iterates through visible rows

#### `pan-view [dq dr]`
Updates view offset for navigation.
- Called by input handler for j/l/k/i keys

#### Modified Functions
- `draw-header` - Updates help text based on view mode
- `draw-ui` - Routes to hex grid or default view based on `:view-mode`
- `handle-input` - Added h/j/l/k/i key handlers
- `get-world-state` - Now caches full world state

## Completed Implementation

All features implemented and tested:
- ✅ Hex grid rendering with axial coordinates
- ✅ Entity 2-letter code display
- ✅ Tile type visualization (biome, structure, resource)
- ✅ View navigation (panning in all directions)
- ✅ View mode toggling
- ✅ State persistence
- ✅ Integration with existing TUI functions

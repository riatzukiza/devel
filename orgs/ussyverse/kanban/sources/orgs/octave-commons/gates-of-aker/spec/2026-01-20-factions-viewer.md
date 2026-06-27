# Factions Viewer Feature

## Overview
Create a dedicated "Factions" viewer component to separate and manage colonist agents (`:player` faction) from wildlife agents (`:wilderness` faction) in the UI.

## Background
Currently, all agents (both colonists and wildlife) are displayed together in the `AgentList` component. This makes it difficult to:
- Track colonist population separately from wildlife
- Quickly identify and manage specific factions
- Understand faction-specific dynamics at a glance

## Current State
- Backend agents have `:faction` field: `:player` for colonists, `:wilderness` for wildlife
- Frontend `Agent` type already has optional `faction` field in `web/src/types/index.ts:9`
- `AgentList` component displays all agents together in `web/src/components/AgentList.tsx`
- Agent filtering currently only happens in backend (e.g., `backend/src/fantasia/sim/tick/core.clj:83` filters `:player` faction for interactions)

## Requirements

### Functional Requirements
1. Create a new `FactionsPanel` component that displays agents grouped by faction
2. Support filtering agents by `:player` (colonists) and `:wilderness` (wildlife)
3. Display faction-specific information:
   - Colonists: roles (priest, knight, peasant, etc.), needs, jobs
   - Wildlife: species (wolf, deer, bear), behavior patterns
4. Maintain all existing `AgentCard` functionality for each agent
5. Support collapse/expand for each faction group
6. Show agent count per faction

### UI Requirements
1. Separate faction sections with clear visual distinction
2. Use faction-appropriate styling (e.g., color coding)
3. Maintain consistency with existing UI patterns (collapsible sections like Traces, ThoughtsPanel)
4. Support the same `onFocusAgent` callback for agent selection
5. Compact view option to save screen space

### Technical Requirements
1. Filter agents by `faction` property from backend data
2. Maintain backward compatibility with existing `AgentList` and `AgentCard` components
3. Handle agents without explicit faction (default to appropriate faction based on role)
4. Type-safe faction handling in TypeScript

## Implementation Plan

### Phase 1: Create FactionsPanel Component
- File: `web/src/components/FactionsPanel.tsx`
- Component structure:
  ```tsx
  type FactionsPanelProps = {
    agents: Agent[];
    jobs?: any[];
    collapsible?: boolean;
    onFocusAgent?: (agent: Agent) => void;
  };
  ```
- Filter agents by faction
- Render separate sections for `:player` and `:wilderness`

### Phase 2: Add Faction-Specific Styling
- Different background/border colors for each faction
- Faction icons/labels (e.g., 🏰 for colonists, 🐺 for wildlife)
- Visual distinction between colonist roles and wildlife species

### Phase 3: Integrate with App.tsx
- Replace or augment `AgentList` in the UI
- Add to right sidebar panel (near SelectedPanel)
- Maintain all existing functionality (selection, focus, etc.)

### Phase 4: Testing
- Verify correct faction filtering
- Test with mixed agent populations
- Ensure agent selection and focus works correctly
- Test with agents missing faction field (fallback logic)

## Definition of Done
- [x] Backend already has `:faction` field on all agents
- [x] `FactionsPanel` component created and functional
- [x] Agents correctly filtered and displayed by faction
- [x] Faction-specific visual styling applied
- [x] Component integrated into App.tsx UI
- [x] Agent selection and focus works from FactionsPanel
- [x] No regression in existing functionality
- [x] Tests passing for both backend and frontend

## Implementation Notes
- Created `FactionsPanel` component at `web/src/components/FactionsPanel.tsx`
- Automatically categorizes agents into `:player` (Colonists) and `:wilderness` (Wildlife)
- Fallback logic: agents with roles `wolf`, `deer`, `bear` are treated as wildlife
- Visual distinction: 🏰 icon for colonists (blue), 🐺 icon for wildlife (brown)
- Replaced `AgentList` with `FactionsPanel` in main UI (right sidebar)
- All existing agent functionality preserved (selection, focus, jobs display)
- Build successful, all tests passing

## Milestone 3 Simplifications (Post-Implementation)
- Removed shrine placement UI from TickControls component
- Removed mouthpiece appointment UI from TickControls component
- Removed mouthpiece display from SelectedPanel
- Removed shrine and mouthpiece handlers from App.tsx
- Updated tests to remove shrine/mouthpiece related assertions
- Social/event features removed to focus on colony survival mechanics
- Build successful, focus now on self-sustaining colony mechanics

## Files to Modify
- New: `web/src/components/FactionsPanel.tsx`
- Update: `web/src/App.tsx` (integrate FactionsPanel)
- Optional: `web/src/types/index.ts` (ensure faction types are explicit)

## Future Enhancements
- Faction-based filtering on the simulation canvas (hide/show by faction)
- Faction statistics panel (population trends, death rates by faction)
- Multi-faction support (if more factions are added in the future)
- Faction relationships/interactions visualization

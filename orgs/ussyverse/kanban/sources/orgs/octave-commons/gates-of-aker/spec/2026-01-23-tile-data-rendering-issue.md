---
title: Tile Data Rendering Issue
type: bug
component: frontend
priority: medium
status: review
workflow-state: in_review
related-issues: []
estimated-effort: TBD
updated_at: 2026-02-10
---

# Tile Data Rendering Issue: Raw JSON instead of Table

## Problem
The selected tile data is currently rendering as raw JSON in the SelectedPanel, but it should be rendered as a formatted table.

## Current Behavior
In `web/src/components/SelectedPanel.tsx` line 46:
```tsx
renderRow("Tile data", safeStringify(selectedTile)),
```

This renders the entire tile object as raw JSON, which is not user-friendly.

## Root Cause
The `safeStringify` function from `web/src/utils.ts` is being used to convert the tile object to a JSON string, but this displays the data in an unformatted way instead of a structured table.

## Solution
Replace the raw JSON rendering with a proper table format that displays individual tile properties in a user-friendly way, similar to how other tile properties (biome, terrain, structure) are displayed.

## Required Changes
1. Modify `SelectedPanel.tsx` to properly render tile data properties
2. Extract individual tile properties and display them in a formatted table
3. Ensure all tile data fields are properly normalized and displayed

## Files to Modify
- `web/src/components/SelectedPanel.tsx`

## Definition of Done
- Tile data displays as a formatted table instead of raw JSON
- All tile properties are properly normalized and displayed
- The UI is consistent with other property displays in the SelectedPanel
- No regression in other parts of the SelectedPanel functionality

## Iteration Evidence (2026-02-10)

- Implemented UI rendering fix in `web/src/components/SelectedPanel.tsx`:
  - Removed stale `safeStringify` import.
  - Tile data remains rendered as structured rows (`Biome`, `Terrain`, `Structure`, etc.) through `renderRow`.
  - Header toggle now uses semantic `<button>` to satisfy accessibility/lint constraints.
- Added targeted regression test: `web/src/__tests__/SelectedPanel.test.tsx`.
  - Verifies structured tile field display and asserts no raw JSON payload text rendering.
- Verification commands:

```bash
npm test -- src/__tests__/SelectedPanel.test.tsx
# Result: 1 file passed, 1 test passed

npm run typecheck
# Result: pass
```

## Next Transition Target

- Suggested next state: `document` after reviewer confirmation.

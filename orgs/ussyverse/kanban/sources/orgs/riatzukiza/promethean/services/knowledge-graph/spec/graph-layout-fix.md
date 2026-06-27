# Graph layout fix (knowledge-graph-ui)

## Issue

Graph renders inside the narrow right panel instead of the main center canvas; details panel ends up off-screen/overlapped (see user screenshot). App layout defines 4 panels but the grid only has 3 columns, forcing the details panel to a new row and squeezing the graph.

## Code references

- `packages/knowledge-graph-ui/src/index.css:15-35` — `.app-shell` grid definition (currently 3 columns) and spacing.
- `packages/knowledge-graph-ui/src/App.tsx:921-1016` — panel order: Filters, Forces, Graph (with `GraphCanvas`), Details.
- `packages/knowledge-graph-ui/src/GraphCanvas.tsx:665-679` — graph container uses `.graph-container` height/width; layout unaffected but keep in mind sizing.

## Existing issues / PRs

- No known open issue/PR in repo for this UI layout regression (none spotted locally).

## Definition of done

- Graph renders in the wide center column; details panel is visible in its own right-hand column.
- No overflow/overlap: panels stay on a single row at desktop widths and remain resizable where intended.
- Graph canvas fills available vertical space as before; no loss of functionality or controls.

## Requirements / plan

- Adjust grid layout to allocate 4 columns (filters, forces, graph, details) with the graph using the flexible column and details on the right.
- Keep responsive behavior reasonable (min widths respected, panels not forced to wrap on desktop).

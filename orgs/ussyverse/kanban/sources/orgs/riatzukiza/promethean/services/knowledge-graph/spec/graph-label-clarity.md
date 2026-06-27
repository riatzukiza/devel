# Graph label clarity

## Context

- UI showed overlapping "README" nodes; graph.ndjson actually has 4,986 nodes / 14,388 edges with many non-README nodes (degree≥2: 2,140).
- Edges were present (graph.ndjson) but graph.json lacked edges (not used by UI); issue stemmed from generic labels and identical colors hiding differences.

## Changes / Code refs

- `packages/knowledge-graph-ui/src/labels.ts`: new `displayLabel` helper adds short path context for generic titles (README/index/etc.) and falls back to path/id.
- `packages/knowledge-graph-ui/src/App.tsx:1-4,75-172,328-341,372-389`: UI now uses `displayLabel` for search, sorting, listing, and selection; GraphCanvas receives type colors; details panel renders file size when present.
- `packages/knowledge-graph-ui/src/GraphCanvas.tsx:1-220`: nodes colored by type and labeled via `displayLabel`; cytoscape elements carry per-type color; node size and layout forces scale from byte size; quadtree-based post-layout repulsion/collision resolves overlaps and uses Barnes–Hut approximation for large graphs; node size range is configurable via UI sliders.
- `src/builder.ts`: file metadata now includes byte size for downstream visualization.

## Definition of done

- Nodes with generic titles display their parent/short path so READMEs are distinguishable.
- Node colors encode type (documentation/code/etc.) in the graph itself.
- Node visual size and layout forces scale with file byte size; details show file size when present.
- Typechecking passes: `pnpm --filter @promethean-os/knowledge-graph-ui lint`.

## Open items / Risks

- If additional generic titles surface, extend the `GENERIC_TITLES` set in `labels.ts`.
- graph.json still lacks edges; UI reads ndjson so unaffected, but regenerate JSON if other consumers rely on it.

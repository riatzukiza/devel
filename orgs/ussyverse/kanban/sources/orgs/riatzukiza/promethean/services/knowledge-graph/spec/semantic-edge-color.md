# Spec: Semantic Edge Coloring

## Context

- Need to distinguish semantic/vector/embedding relationships in the SPA graph view. These edges are precomputed during graph build (see `src/ann/related-embeddings.ts`).
- Current UI colors edges by type only (`packages/knowledge-graph-ui/src/GraphCanvas.tsx` around edge color logic ~60-150), so semantic edges look the same as other relationships.

## Target Files

- `packages/knowledge-graph-ui/src/GraphCanvas.tsx` (edgeColor + toElements + Cytoscape styles; reference lines ~60-150, ~428-480, ~566-624).
- `packages/knowledge-graph-ui/src/App.tsx` (edge rendering pipeline and filters; reference lines ~295-360, ~837-852 for GraphCanvas props and edge toggles).
- Specs to mirror UI contract: `spec/frontend-spa.md`, `spec/frontend-spa-ui.md`, `spec/frontend-spa-architecture.md` (add note about semantic edge color).

## Requirements

- Introduce a distinct edge color for semantic/vector/embedding edges that are precomputed when building the graph (edges with embedding metadata such as `data.method === "embedding"` from builder output).
- Preserve existing edge width/strength behavior; only color should change for the semantic subset.
- Keep other edge types unchanged.
- Document the color semantics in SPA specs so UX and API expectations stay aligned.

## Definition of Done

- Graph renders semantic/embedding edges with a unique, visible color different from other relationship types.
- Documentation updated in `spec/frontend-spa*.md` to mention the semantic edge color and what it represents.
- No regression to existing edge strength/width logic; non-semantic edges remain styled as before.

## Notes

- Semantic edges currently use type `related` with embedding metadata (builder sets `data.method = "embedding"` in `src/ann/related-embeddings.ts`). Use that marker to branch color logic.

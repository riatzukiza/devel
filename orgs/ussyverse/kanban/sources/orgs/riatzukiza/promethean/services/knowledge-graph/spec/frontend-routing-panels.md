# Frontend Routing Panels

## Context

- Target: `packages/knowledge-graph-ui/src/App.tsx` (lines ~1-1018) currently renders all panels (settings/filters, graph, details) in a single view with Solid signals and hooks.
- Goal: Split each major panel into its own page behind a router for clearer navigation.

## Related Work

- Existing issues/PRs: None discovered during initial inspection.

## Requirements / Definition of Done

- Introduce a router in the UI app and expose separate pages for each major panel (Settings/Filters, Graph view, Details/Nodelist) while preserving current functionality.
- Navigation allows switching between panels without losing shared graph state (graph data, selections, simulation status, etc.).
- Existing behaviors (load graph on mount, config/layout/simulation fetches, semantic search, selection) continue to work from appropriate pages.
- Build/tests continue to pass (`pnpm --filter @promethean-os/knowledge-graph-ui test`/build if run).

## Plan (Phases)

1. **Assess layout & state**: Identify panel groupings and shared signals/hooks inside `App.tsx`; note state that must persist across pages.
2. **Design routing & pages**: Choose router (Solid Router), define routes/pages (e.g., `settings`, `graph`, `details`), decide shared shell/header/navigation, and ensure shared providers/state live above routes.
3. **Implement refactor**: Add router setup and page components, move panel JSX into page components, wire navigation, ensure lifecycle hooks (graph load, configs, layouts, simulations) run once at app root.
4. **Validate**: Smoke-check build/test command (if feasible) or note outstanding verification.

## Notes

- Keep shared signals in a top-level component or context to avoid re-fetching on navigation.
- Ensure default route selects a sensible initial page (likely Graph) and preserves selection-driven effects.

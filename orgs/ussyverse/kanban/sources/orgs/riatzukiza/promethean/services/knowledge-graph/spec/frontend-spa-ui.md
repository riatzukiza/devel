# SPA UI/UX Design

## Context

- Web app to explore and edit knowledge graphs; consumes API from `frontend-spa-architecture` plan.

## Information Architecture

- Views/routes:
  - `/` Home/Graph: canvas + search/filter + details.
  - `/nodes/:id` Node detail (deep link), similar for `/edges/:id` (optional but useful for sharing).
  - `/mermaid` (optional) raw mermaid preview/export.
- Global elements: header (title, API status), sidebar filters, main canvas, right drawer details.

## Core Interactions

- Graph canvas: pan/zoom, select node/edge, highlight neighbors, fit-to-screen, reset layout.
- Rebuild control: button to POST `/api/rebuild`, shows status, and reloads the streamed graph on success.
- Search/filter: text search on title/id; filter by node type and edge type; toggles for packages/docs/code.
- Detail drawer: shows metadata (title, type, filePath/url, timestamps), inbound/outbound edges list with quick navigation.
- CRUD flows:
  - Add node/edge (modal/drawer) with validation and type-specific fields (file/doc/package/import/dependency).
  - Edit node/edge data; update labels live.
  - Delete with confirm; optional undo snackbar.
- Graph layout: force-directed or concentric; deterministic by id for stability; options to group by type.
- Empty/error states: clear messaging and retry; skeletons while loading.

## Components (React suggested)

- App shell (routing, query client, theme provider).
- GraphCanvas (Cytoscape/d3 wrapper) with props: nodes, edges, selection handlers, layout options.
- SearchBar + FiltersPanel (types, text, edge types, depth for connected query).
- DetailDrawer: node/edge summary, metadata, link to open in repo (if file), actions (edit/delete).
- CRUD dialogs: NodeForm, EdgeForm with schema-driven validation; optimistic update hooks.
- Notifications: toast/snackbar for success/error/undo.

## State & Data

- Data fetching via react-query/SWR; cache nodes/edges by id and query params.
- Optimistic mutations for CRUD with rollback on error; refetch affected queries on settle.
- Derived client state: selection, layout options, filter params, UI toggles.

## Styling/UX

- Use component library (e.g., MUI/Chakra) or light design system: spacing scale, typography, semantic colors for node types.
- Edge styling: embedding/semantic (precomputed vector) edges use a distinct magenta hue to differentiate them from other relationships.
- Accessibility: keyboard navigation for search/results; focus outline on selected node; ARIA labels for controls.

## Testing

- Unit: component rendering with mock data; validation logic for forms.
- Integration: mocked API via MSW; flows for search/filter, selection, CRUD optimistic update rollback.
- Visual snapshot (optional) for critical views.

## Definition of Done

- SPA shell renders graph, selection, filters, detail drawer.
- CRUD dialogs wired to API with validation and optimistic updates.
- Tests cover loading/error/empty states, selection, and at least one optimistic mutation rollback.
- Docs include run commands and environment variable expectations (API base URL).

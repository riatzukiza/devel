---
uuid: "orgs-open-hax-openplanner-packages-graph-graph-weaver-kanban-orgs-open-hax-openplanner-packages-graph-graph-weaver-specs-service-surface-md"
title: "Service Surface Spec"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:36.375Z"
source: "orgs/open-hax/openplanner/packages/graph/graph-weaver/specs/service-surface.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/graph/graph-weaver/specs/service-surface.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/graph/graph-weaver/kanban/service-surface.md`

# Service Surface Spec

## Purpose

Describe the live surfaces this repo exposes today.

## HTTP endpoints

### GraphQL
- `POST /graphql`

Provides queries and mutations over the merged graph.

### Status
- `GET /api/status`

Returns:
- node count
- edge count
- seed count
- weaver frontier / in-flight counts
- render config
- scan config

### Graph snapshot
- `GET /api/graph`

Returns a sampled/layouted graph view suitable for rendering.

### Static/UI
- `/`
- `/graphiql`
- `/app.js`
- `/style.css`
- `/vendor/webgl-graph-view/*`

### WebSocket
- `GET /ws` via upgrade

Current behavior: push the literal message `changed` whenever the merged graph becomes dirty.

## GraphQL capabilities

Queries and mutations include:
- status/config
- sampled graph view
- node/edge lookup
- neighbor and edge listing
- search
- node preview
- rescan
- weaver seeding
- config update
- user node/edge upserts/removals
- layout position updates

## Design position

This repo is a **graph workbench service** rather than only a crawler service.
It exposes:
- graph query surfaces
- graph mutation surfaces
- a small UI
- a minimal websocket invalidation signal

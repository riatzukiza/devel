---
uuid: "orgs-open-hax-openplanner-packages-graph-graph-weaver-kanban-orgs-open-hax-openplanner-packages-graph-graph-weaver-specs-query-preview-and-mutation-md"
title: "Query, Preview, and Mutation Spec"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:36.376Z"
source: "orgs/open-hax/openplanner/packages/graph/graph-weaver/specs/query-preview-and-mutation.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/graph/graph-weaver/specs/query-preview-and-mutation.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/graph/graph-weaver/kanban/query-preview-and-mutation.md`

# Query, Preview, and Mutation Spec

## Purpose

Document the three kinds of interaction this service supports:
- inspect
- preview
- alter

## Inspect

### Query surfaces
- status/config
- graphView
- node(id)
- edge(id)
- edges(filter)
- neighbors(id)
- searchNodes(query)

These all operate against the merged graph view.

## Preview

### File preview
For file nodes, the service reads a bounded head of the file and labels it as:
- markdown
- code
- text
- binary
- error

### URL preview
For URL nodes, the service fetches a bounded preview of the remote resource using the configured timeout.

### Metadata preview
For non-file/non-url nodes, the node itself is rendered as JSON code.

## Alter

### Runtime config mutation
`configUpdate` can change render, crawl, and scan behavior.
If weaver config changes, the crawler is restarted.
If scan config changes, the rescan timer is reset.

### Graph mutation
User layer supports:
- upsert node
- upsert edge
- remove node
- remove edge
- bulk layout position updates

### Rescan and reseed
- `rescanNow` rebuilds local layer and reseeds discovered URLs
- `weaverSeed` adds URLs to crawler frontier

## Security posture

If `GRAPH_WEAVER_ADMIN_TOKEN` is set, mutation paths require a bearer token.
Without it, the service remains open for local/dev mutation.

## UX reading

This service is designed to let a human move between:
- map view
- object inspection
- quick previews
- direct graph intervention
without leaving the same instrument.

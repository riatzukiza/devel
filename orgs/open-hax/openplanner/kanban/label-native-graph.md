---
uuid: "orgs-open-hax-openplanner-kanban-orgs-open-hax-openplanner-specs-label-native-graph-md"
title: "Label-Native Graph Design"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:42.618Z"
source: "orgs/open-hax/openplanner/specs/label-native-graph.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/specs/label-native-graph.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/kanban/label-native-graph.md`

# Label-Native Graph Design

## Problem

Current labels in OpenPlanner are metadata attached to events (`extra.openplanner_labels`). They are not first-class graph citizens:
- Labels cannot be searched as nodes
- Labels do not participate in graph layout/physics
- Label relationships are not traversable as edges
- No structured description/ontology for what a label means

## Solution

Treat labels as **structural graph nodes** with **categorical edges**.

## Model

### Label Node

A label node is a `graph.node` event with `node_kind: "label"`.

```typescript
interface LabelNode {
  node_id: string;           // "label:{tenant}:{slug}" 
  node_kind: "label";
  label: string;             // display name
  emoji: string;             // optional visual
  description: string;       // embeddable semantic description
  color: string;             // UI color
  scope: {
    tenant_id: string;
    project?: string;
  };
  created_by: string;
  created_at: string;
}
```

### Has-Label Edge

When an item receives a label, we create a structural edge:

```typescript
interface HasLabelEdge {
  source_node_id: string;    // the labeled item
  target_node_id: string;    // the label node
  edge_kind: "has_label";
  project: string | null;
  source: string;            // who/what applied it
  data: {
    applied_at: string;
    confidence?: number;     // optional: how sure is the label
    evidence?: string[];     // event ids supporting this label
  };
}
```

### Why This Works

1. **Labels are nodes**: They appear in semantic search, can be embedded, and participate in graph memory queries
2. **Labels have descriptions**: The `description` field is embedded, so labels semantically attract related content
3. **Categorical edges are structural**: `has_label` edges are not semantic-similarity guesses; they are explicit categorizations
4. **Layout physics**: Label nodes pull labeled items toward them via force-directed layout (same mechanism as any other edge)
5. **Traversal**: You can walk from label → all labeled items, or from item → all its labels

## API

### OpenPlanner

```
POST   /v1/graph/labels                create label node
GET    /v1/graph/labels                list labels (with search)
GET    /v1/graph/labels/:label_id      get label node
PATCH  /v1/graph/labels/:label_id      update label description/color
DELETE /v1/graph/labels/:label_id      archive label

POST   /v1/graph/labels/:label_id/apply    apply label to node
POST   /v1/graph/labels/:label_id/remove   remove label from node
GET    /v1/graph/labels/:label_id/nodes    list nodes with this label
```

### Knoxx Interface

A "Labels" workbench page:

1. **Label Browser**
   - Grid/list of label nodes with emoji, name, description
   - Search/filter labels
   - Create new label with description

2. **Label Detail**
   - Edit description (affects embedding)
   - View labeled items
   - Label statistics

3. **Apply Labels**
   - From any item (event, node, session), open label picker
   - Search labels, apply/remove
   - Bulk apply labels

4. **Label Graph View**
   - Visualize label nodes and their connected items
   - Filter by label, see clusters

## Implementation Plan

### Phase 1: Backend

1. Add `graph_label_nodes` collection (or use events with node_kind)
2. Add label CRUD routes in `src/routes/v1/graph.ts`
3. Add `has_label` edge creation/removal
4. Embed label descriptions via existing embedding pipeline
5. Add label-aware search filters

### Phase 2: Frontend

1. Add "Labels" nav item in Knoxx workbench
2. Build label browser page
3. Build label detail/edit page
4. Add label picker component (reusable)
5. Integrate label picker into existing item views (sessions, events, etc.)

## Migration

Existing `extra.openplanner_labels` on events can be lazily migrated:
- When an event with legacy labels is read, ensure label nodes exist
- Create `has_label` edges for legacy labels
- Over time, legacy label storage can be deprecated

## Verification

- Label nodes appear in `/v1/graph/memory` queries
- Label descriptions affect semantic search results
- `has_label` edges are traversable in graph queries
- Applying a label creates both the edge and an observation event
- Knoxx UI can create, edit, apply, and visualize labels

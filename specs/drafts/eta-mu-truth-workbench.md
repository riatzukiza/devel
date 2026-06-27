---
title: "Spec (draft): ημ Truth Workbench (truth graph editor, separate from simulation)"
status: draft
created_at: "2026-03-16"
tags: [eta-mu, truth-graph, view-graph, ui, service]
---

# ημ Truth Workbench

## Summary
Build a new project that provides the *lowest-level* UI for interacting with ημ **truth**, without requiring Fork Tales simulation.

## Core distinction
- **Truth graph**: canonical, append-only operations (decisions) stored under `.Π/`.
- **View graph**: derived, rebuildable projection (indexes/caches) stored under `.opencode/runtime/`.

## Goals
- Clean UI for resolving truth (initially: wikilink target resolution).
- Mount-based scope: scan one-or-many corpora via `ημ.mounts.v1` (no “directory = identity”).
- Context overflow control: the workbench is the *operator lens* on a bounded slice (unresolved items, recent changes, search).

## Non-goals (v0)
- No simulation integration.
- No embeddings.
- No full general knowledge graph ontology.

## Inputs
- `ημ.mounts.v1` JSON config (path relative to vault root):
  - `.opencode/runtime/eta_mu_mounts.v1.json`
- Mounted Markdown files.

## Outputs

### Truth (append-only)
- `.Π/ημ_truth_ops.v1.jsonl`

### View caches (rebuildable)
- `.opencode/runtime/eta_mu_docs_index.v1.jsonl`
- `.opencode/runtime/eta_mu_docs_backlinks.v1.jsonl`

## Truth operations (v1)
- `wikilink.resolve`: map a `target_key` → `dst_entity_id`.

## UI flows (v0)
1) Show unresolved `target_key`s ranked by frequency.
2) Search docs by title/path/tags.
3) Resolve: select target_key + pick doc + commit op.
4) Rebuild view.

## Implementation phases
1. Create new packages:
   - `@workspace/eta-mu-docs` (extract/parse + build docs index/backlinks)
   - `@workspace/eta-mu-truth` (truth ops log + derive view)
2. Create new service:
   - `@workspace/eta-mu-truth-workbench` (HTTP API + static UI)
3. Verify locally by pointing at a vault root with mounts.

## Definition of done
- Service starts and serves UI.
- UI can list unresolved wikilinks, search docs, and write `wikilink.resolve` ops.
- Rebuild regenerates view caches.

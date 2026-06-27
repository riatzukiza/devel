---
original_name: "2026.04.13.13.57.07.md"
title: "Graph Weaver Live Graph Query Notes"
summary: "Records that graph-weaver is live through graphView and clarifies the correct GraphQL query and vector-search edge model."
category: "dev"
created: "2026-04-13"
---

 Signal

 Graph is live: 21,823 nodes, 50,031 semantic edges rendered through graph-weaver via graphView. The GraphQL was never
 broken — the earlier test used nonexistent root fields (nodes, edges) instead of the correct graphView query.

 Evidence

 - (世, p=1.0) graphView(maxNodes:5, maxEdges:5) returns totalNodes=21823, totalEdges=50031, sampled nodes=396, edges=200
 - (世, p=1.0) All edges are semantic_knn — built via mongot $vectorSearch on 10,265 chunks
 - (世, p=1.0) Content stripped from 10,482 chunks (~67MB freed) — DB now stores only embeddings + metadata
 - (己, p=0.9) GraphQL schema has no { nodes { } } query — that was the wrong test. The page uses { graphView { nodes
 edges meta } }

 Frames

 1. Mongot replaces HNSW. Atlas Local's $vectorSearch does kNN natively. The separate HNSW build pipeline
 (semantic-graph-builder) with native hnswlib-node bindings, slab export/import, and multi-step orchestration is now
 obsolete for this use case. One $vectorSearch call per chunk replaces the entire build-index → query-neighbors →
 persist-edges pipeline.
 2. DB becomes index, not store. Content lives on disk (workspace volume mounts). The DB stores embeddings (for
 similarity), metadata (for graph topology), and identifiers (for retrieval). This is the right separation — the DB is a
 vector index with graph structure, not a content store.
 3. Dev volume mount pattern. Knoxx already mounts dist/ for live reload. OpenPlanner didn't, which caused the "route not
 found" confusion. Now both services have the same pattern.

 Countermoves

 - The edge builder is synchronous (blocks the request for ~90s with 10K chunks). For production, it should be an async
 job with status polling.
 - Chunk nodes use devel:chunk: prefix — separate from file-based devel:file: nodes. The export merges both, but
 graph-weaver's label resolution may need improvement for chunk nodes (currently shows filename only).
 - Translation content should be preserved — the strip endpoint only removes text from event_chunks, not from translation
 documents.

 Next

 Visit the graph-weaver page in the browser to visually confirm edges are rendering and check if the layout is
 acceptable.

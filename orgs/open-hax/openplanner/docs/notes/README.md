# Notes Index

Organized notes by category.

## design

- [Epistemic Kernel Contracts and Actors](design/epistemic-kernel-contracts-actors.md) — Drafts the epistemic primitives, contracts, actors, events, receipts, and judgments for OpenPlanner and Knoxx/Cephalon runtimes.
- [Intent and Fulfillment Contract Semantics](design/intent-fulfillment-contract-semantics.md) — Explores intent contracts as pre-engagement checks and distinguishes deterministic fulfillment contracts from LLM-judged contracts.
- [OpenHax Architecture Source Driver Instances](design/openhax-architecture-source-driver-instances.md) — Maps OpenHax and octave-commons repositories to a categorical architecture and calls for concrete source driver instances.
- [OpenPlanner Content Storage and Hydration Strategy](design/openplanner-content-storage-hydration-strategy.md) — Outlines priorities for removing full text from OpenPlanner, retaining references, and hydrating source fragments through caches.

## dev

- [API V1 Route Migration Note](dev/api-v1-route-migration-note.md) — States that APIs should use /api/v1/* rather than UI-specific routes as UI routes are phased out.
- [CMS Architecture Unified with Documents Core](dev/cms-architecture-unified-documents-core.md) — Documents the CMS as a thin layer over documents.ts with unified event storage, indexing, gardens, and publication gaps.
- [Graph Weaver Live Graph Query Notes](dev/graph-weaver-live-graph-query-notes.md) — Records that graph-weaver is live through graphView and clarifies the correct GraphQL query and vector-search edge model.
- [Idiomatic Clojure BST with Malli](dev/idiomatic-clojure-bst-malli.md) — Shows an idiomatic Clojure binary search tree using plain data, Malli schemas, protocols, records, and instrumentation.
- [Knoxx Admin UI Cleanup Tasks](dev/knoxx-admin-ui-cleanup-tasks.md) — Lists UI cleanup tasks for Knoxx admin pages, settings API errors, nav removal, and page compaction.
- [OpenPlanner Monorepo Consolidation Thoughts](dev/openplanner-monorepo-consolidation-thoughts.md) — Captures thoughts on consolidating OpenPlanner-related packages, graph-weaver, eros, and cephalon runtime dependencies.

## infrastructure

- [Pi MCP Adapter Profiling Stack](infrastructure/pi-mcp-adapter-profiling-stack.md) — Explains pi-mcp-adapter as an MCP proxy registry and sketches Playwright and Chrome DevTools profiling integration.

## research

- [Layered Embedding Graph Architecture](research/layered-embedding-graph-architecture.md) — Describes a multi-layer embedding architecture with document, sentence, graph-node, deduplication, and instruction-tuned query layers.
- [Octave Commons Repository Links](research/octave-commons-repository-links.md) — Collects links to related octave-commons repositories for sentinel, Promethean agents, ecosystem DSL, fork tales, and more.

---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-recovered-cephalon-clj-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-recovered-cephalon-clj-spec-architecture-md"
title: "Cephalon CLJ Architecture (Recovered Notes)"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:33.182Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/recovered/cephalon-clj/spec/architecture.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/recovered/cephalon-clj/spec/architecture.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/recovered/cephalon-clj/kanban/architecture.md`

# Cephalon CLJ Architecture (Recovered Notes)

## Status
- Source not recovered. This document summarizes references found in session/spec files.

## References
- `spec/promethean-discord-io-bridge-agent-consolidation.md` (lines 13-14, 68): Architecture notes describe a two-process layout and RPC envelope.

## Summary (from specs)
- Two-process layout: CLJ brain + Discord IO bridge communicate over RPC.
- Shared wire protocol and transit encoding (`cephalon-clj-shared/src/cephalon/proto/wire.cljc`, `cephalon-clj-shared/src/cephalon/transport/transit.cljc`).
- Tool definitions live in the brain service and use a shared DSL; Discord IO is an adapter layer.

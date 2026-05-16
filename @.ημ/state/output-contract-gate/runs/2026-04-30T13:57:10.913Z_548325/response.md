## Signal

(己, p=0.9) Short version: **fork_tales is the living simulation/world-render; OpenPlanner is the durable graph/lake/control-plane.**

| Axis | `orgs/shuv/fork_tales` | `orgs/open-hax/openplanner` |
|---|---|---|
| Core identity | ημ / eta-mu: runtime world simulation, dashboard, sonification, agent ecology | OpenPlanner: canonical graph monorepo for semantic graph construction, storage, traversal, search |
| Primary metaphor | “A living world” of presences, particles, fields, receipts, truth gates, lore actors | “A graph lake” / semantic memory platform with events, documents, vectors, graph edges, tenants, contracts |
| Main product shape | Real-time simulation dashboard + WebGL/React panels + Docker world runtime | Fastify API + MongoDB/Chroma storage + graph/search/CMS/translation/agent services |
| Data model | Canonical four primitives: **Presence, Nexus, Particle, Field** | Event envelope, documents, graph nodes/edges, vector chunks, translation records, promptdb epistemic primitives |
| Dynamics | Physics-like field simulation: particles collide, diffuse, consume resources, respond to CPU/GPU/NPU pressure, Nooi fields, runtime queues | Query/retrieval dynamics: graph traversal, vector search, salience projections, memory reconciliation, tenant policy |
| Agent model | “Presences” as world entities: health sentinels, muses, receipt keepers, truth gates | Knoxx contracts: actors, agents, roles, policies, tools, MCP facade, Discord/music/OpenPlanner tool slices |
| Governance | Explicit UI/training constitution: simulation is substrate; health and governance are sovereign | Contract/policy-backed agent runtime and promptdb epistemic kernel; multi-tenant and capability-scoped control |
| Persistence | Runtime logs, receipts, Chroma, world_state, simulation metadata; strong visualization emphasis | MongoDB/Chroma canonical lake; events/docs/graph memory/translations/exports; persistence is central |
| Best read as | Experimental embodied observability + agent-world simulator | Production-leaning knowledge/graph/agent operating substrate |

(己, p=0.88) The clean architecture relation is:

```text
fork_tales = sensorium / simulation / operational theatre
OpenPlanner = memory / graph lake / policy + retrieval backbone
Knoxx = agent contract runtime sitting inside OpenPlanner
Vexx = accelerated semantic fast lane used by the graph stack
```

(己, p=0.84) If merged conceptually, **fork_tales should be the “world view” for OpenPlanner**, while **OpenPlanner should be the durable source of graph truth, history, permissions, and retrieval for fork_tales**.

## Evidence

(世, p=0.92) `fork_tales/README.md` describes eta-mu as “a modular runtime for catalog management, attribution tracking, world simulation, and sonification.”

(世, p=0.91) `fork_tales/part64/README.md` exposes simulation-first surfaces:

- `/dashboard/docker`
- `/dashboard/bench`
- `/dashboard/profile?id=<sim_id>`
- `/api/simulation`
- `/ws`
- WebGL renderer over websocket simulation messages
- Docker runtime with world + IO + web graph weaver + Chroma

(世, p=0.91) `fork_tales/contracts/ημ_ui_training_constitution.v1.lith` defines a layered constitution where layer 0 is **simulation**, layer 1 is **health**, layer 2 is **governance**, then conversation/context/system-prompting/model/data/training layers.

(世, p=0.9) `fork_tales/part64/frontend/src/types/index.ts` explicitly names the unified model primitives: **Presence, Nexus, Particles, Field**.

(世, p=0.9) `openplanner/README.md` calls OpenPlanner “the canonical graph monorepo containing all packages for semantic graph construction, layout, traversal, and search.”

(世, p=0.87) `openplanner/src/app.ts` shows the core service is a Fastify API with auth, MongoDB, tenant resolution, embedding runtime, and `/v1` routes.

(世, p=0.88) `openplanner/src/lib/types.ts` centers event/document/search/translation records, e.g. `EventEnvelopeV1`, `DocumentRecord`, FTS/vector search requests, translation events, and label events.

(世, p=0.87) `openplanner/specs/openplanner-graph-events.md` frames OpenPlanner as the persistent home for `graph.node` and `graph.edge` events from Myrmex crawling.

(世, p=0.86) `openplanner/packages/agents/knoxx/backend/README.md` defines Knoxx as a CLJS backend service for the agent runtime with OAuth-protected MCP, tool allowlists, and policy-scoped delegated tools.

(世, p=0.86) `openplanner/packages/promptdb-core/README.md` defines an epistemic kernel: obs → actor-fact → contract → inference → action → attestation → judgment.

## Frames

(己, p=0.83) **Frame 1 — fork_tales is “graph made visible.”**  
It turns files, events, resources, claims, agents, and embeddings into an audiovisual/particle world. Its highest-value contribution is perceptual: make operational complexity feel inspectable.

(己, p=0.84) **Frame 2 — OpenPlanner is “graph made durable.”**  
It stores events, documents, graph edges, embeddings, tenant state, translation labels, source hydration, and derived projections. Its highest-value contribution is memory, indexing, query, and authority.

(己, p=0.8) **Frame 3 — Knoxx is the bridge from graph to action.**  
OpenPlanner’s Knoxx package gives the graph/lake an agent runtime: contracts, actors, tools, policies, OAuth/MCP, Discord automation, translation agents, and OpenPlanner query tools.

## Countermoves

(己, p=0.81) Do not treat them as duplicates. Both have graph/agent/embedding language, but they optimize different layers:

- `fork_tales`: runtime embodiment, dashboard, simulation, field physics.
- `openplanner`: storage, retrieval, APIs, contracts, graph memory, agent governance.

(己, p=0.78) Do not treat fork_tales as “just frontend.” It has real backend dynamics: particle builders, resource economy, websocket deltas, C double-buffer simulation, Chroma, LLM/embedding routing, Docker discovery, benchmarks.

(己, p=0.78) Do not treat OpenPlanner as “just a database.” It has graph algorithms/projections specs, Knoxx contracts, promptdb epistemics, translation review, CMS/gardens, Vexx acceleration, and MCP-facing agent control.

(己, p=0.74) The biggest architectural risk is **model drift between them**: fork_tales has Presence/Nexus/Particle/Field; OpenPlanner has events/docs/graph nodes/edges/promptdb contracts. They need a declared projection boundary, not ad hoc JSON copying.

## Next

(己, p=0.9) Write a one-page integration contract: “OpenPlanner owns durable graph truth; fork_tales subscribes to OpenPlanner graph/event/projection streams and emits simulation observations back as append-only events.”
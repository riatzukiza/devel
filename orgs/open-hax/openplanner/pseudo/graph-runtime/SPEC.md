# Graph-Native Runtime Specification

**Version**: 0.1.0 (Draft)
**Status**: Speculative
**Purpose**: A graph-native runtime where semantics and systems are coupled through physical topology and economic models.

---

## Executive Summary

This system is a **graph-native runtime** in which:

1. **Documents and system resources** are represented as **nodes and reservoirs** in a persistent **TruthGraph**
2. Computation is performed on a **losslessly compressible ViewGraph** that is dynamically coarsened and refined
3. Behavior emerges from **Presences** (agents with internal state only) exchanging **Daimoi** (probabilistic message packets)
4. Resource allocation uses **fluid economy** with pressure-derived local prices and **need/mass-induced gravity wells** defined over **graph distance**

The core novelty is the **tight coupling of semantics and systems**: semantic organization is embedded into physical topology so that **shortest paths, congestion, and local "gravity basins" are directly observable and auditable**.

---

## Core Abstractions

### Notation and State

Let time be discrete (ticks) or continuous with step Δt.

Resource types:
```
𝒦 = {CPU_i, GPU_j, NPU, RAM, DISK_ℓ, NETUP, NETDOWN}
```

Let **TruthGraph** be Gᵀ = (Vᵀ, Eᵀ) and **ViewGraph** be Gⱽ = (Vⱽ, Eⱽ).

Let Presences be 𝒫 and Daimoi particles be 𝒟.

World state:
```
𝒮(t) = (Gᵀ, Gⱽ, {Xₙ(t)}ₙ∈Vⱽ, {Xₑ(t)}ₑ∈Eⱽ, {Sₚ(t)}ₚ∈𝒫, 𝒟(t))
```

### Symbol Table

| Symbol | Meaning |
|--------|---------|
| n, m | Nodes in Vⱽ (Nexus nodes in the runtime graph) |
| e = (n → m) | Directed edge in Eⱽ |
| k | Resource type in 𝒦 |
| R[n,k] | Amount of resource fluid stored at node n |
| Cap[n,k] | Carrying capacity at node n |
| P[n,k] | Pressure at node n for resource k |
| F[e,k] | Flow along edge e for resource k |
| Fₘₐₓ[e,k] | Edge throughput capacity |
| satₑ | Congestion/saturation on edge e |
| aₑ | Semantic affinity of edge e (0..1) |
| costₑ | Graph-distance traversal cost for edge e |
| Lₚ | Purpose/description embedding for Presence p |
| Mₚ | Presence mask (where p exists) |
| needₚ,ₖ | Current need intensity of Presence p for resource k |
| Massₚ | Presence mass (weighted by influence over nearby graph) |
| Φₚ(n) | Gravitational potential projected by p at node n |
| Gₖ[n] | Aggregate gravity map at node n for resource k |
| πₖ(n) | Local unit price for resource k at location n |
| C | Scalar CostCredits for multi-resource spend |
| d | A Daimoi packet |

---

## TruthGraph and ViewGraph

### TruthGraph

**TruthGraph** Gᵀ is the lossless store: every content object (file/log/message) is a node with immutable provenance edges.

Properties:
- Immutable nodes
- Cryptographic provenance
- Complete history
- No deletion, only supercession

### ViewGraph

**ViewGraph** Gⱽ is a **lossless compressed projection** of TruthGraph built by coarsening/quotienting plus a reconstruction ledger.

```
Π: Vᵀ → Vⱽ
```

Each node in Vⱽ is either:
- **Atomic**: maps to exactly one node in Vᵀ
- **Bundle**: maps to multiple nodes in Vᵀ

Bundles store:
- Membership: Π⁻¹(b)
- Internal edges among those truth nodes
- Boundary adjacency (edges crossing bundle boundary)
- Sufficient metadata to reconstruct the induced subgraph exactly

---

## Nexus Node (Runtime Node)

A **Nexus** in the runtime corresponds to a node n ∈ Vⱽ with:

```typescript
interface Nexus {
  // Resource reservoirs
  resources: Map<ResourceType, FluidReservoir>;
  
  // Pressure gauges
  pressure: Map<ResourceType, number>;
  
  // Semantic embedding
  embedding: number[];  // Semantic vector for proximity
  
  // Presence population
  presences: Set<PresenceId>;
  
  // Daimoi queue
  daimoiQueue: Daimoi[];
  
  // Gravity wells projected onto this node
  gravityWells: Map<ResourceType, GravityWell>;
}
```

### Fluid Reservoir

```typescript
interface FluidReservoir {
  amount: number;
  capacity: number;
  inflowRate: number;
  outflowRate: number;
  viscosity: number;  // Flow resistance
}
```

### Pressure Dynamics

Pressure is derived from resource state:

```
P[n,k] = R[n,k] / Cap[n,k]  // Utilization pressure
       + Σ needₚ,ₖ × Massₚ × proximity(p, n)  // Demand pressure
```

---

## Presences

A **Presence** is an agent with internal state only. It does not have a "body" in the graph—it exists as a pattern of influence.

```typescript
interface Presence {
  id: PresenceId;
  
  // Purpose embedding (what it's for)
  purpose: number[];  // Semantic embedding
  
  // Mask (where it can exist)
  mask: NodeSet;  // Subset of Vⱽ
  
  // Needs (what it wants)
  needs: Map<ResourceType, NeedFunction>;
  
  // Mass (how much influence)
  mass: number;
  
  // Internal state
  state: PresenceState;
  
  // Policy function (how it acts)
  policy: (state: PresenceState, observation: Observation) => Action;
}
```

### Gravity Wells

Each Presence projects a **gravity well** over the graph:

```
Φₚ(n) = Massₚ × needₚ,ₖ × sim(Lₚ, embedding(n)) / (1 + dist(graph_origin, n))
```

Where:
- `sim` is semantic similarity (cosine, dot product, etc.)
- `dist` is graph distance
- The well attracts resources of type k toward nodes where the Presence has need

### Aggregate Gravity Map

The aggregate gravity map at node n:

```
Gₖ[n] = Σₚ Φₚ(n)  // Sum over all Presences
```

---

## Daimoi (Message Particles)

A **Daimon** (singular) is a probabilistic message packet that carries intent and traverses the graph.

```typescript
interface Daimoi {
  id: DaimoiId;
  
  // Origin and destination
  source: NodeId;
  destination?: NodeId;  // May be probabilistic
  
  // Payload
  payload: unknown;
  
  // Semantic affinity (which edges it follows)
  affinity: number[];  // Embedding for edge selection
  
  // Weight (affects flow)
  weight: number;
  
  // Stochastic parameters
  randomness: number;  // How much noise in traversal
  
  // Trail (path history)
  trail: NodeId[];
}
```

### Traversal

Daimoi traverse the graph using:

1. **Affinity routing**: Prefer edges with high semantic similarity to affinity vector
2. **Gravity following**: Drawn toward high-gravity nodes
3. **Pressure following**: Flow toward low-pressure regions
4. **Random walk**: Stochastic component for exploration

```
P(d → m | d at n) ∝
  affinity_similarity(d.affinity, e.embedding) ×
  (1 - saturation(e)) ×
  path_weight(n → m)
```

---

## Fluid Resource Economy

### Local Prices

Prices are derived from pressure and scarcity:

```
πₖ(n) = P[n,k] × base_priceₖ × urgency_factorₖ
```

Where:
- `P[n,k]` is the local pressure for resource k at node n
- `base_priceₖ` is the global base price
- `urgency_factorₖ` increases with unmet need

### Shadow Prices

For equilibrium analysis:

```
∂L/∂R[n,k] = πₖ(n) - λₖ
```

Where L is the Lagrangian and λₖ is the shadow price (marginal value of additional k).

---

## Lossless Compression

The ViewGraph compression uses quotient structures with reconstruction ledgers.

### Compression Algorithm

```
compress(Gᵀ) → Gⱽ:
  1. Identify stable subgraphs (high internal connectivity, low external)
  2. Create bundles for stable subgraphs
  3. Record internal edges and boundaries
  4. Preserve reconstruction ledger
```

### Decompression Algorithm

```
decompress(Gⱽ) → Gᵀ:
  1. For each atomic node: yield directly
  2. For each bundle: read reconstruction ledger
  3. Reconstruct internal edges from ledger
  4. Reconnect boundary edges
```

---

## Simulator Architecture

### Discrete Event Simulation

```typescript
interface Simulation {
  // Current world state
  world: WorldState;
  
  // Event queue
  events: PriorityQueue<SimEvent>;
  
  // Tick counter
  tick: number;
  
  // Step function
  step(): void {
    const event = events.pop();
    apply(event);
    resolve_fluids();
    propagate_daimoi();
    update_gravity_maps();
    collect_observations();
  }
}
```

### Observation Collection

Presences receive observations through:

```typescript
interface Observation {
  // Local resources visible
  local_pressure: Map<ResourceType, number>;
  
  // Gravity map in vicinity
  nearby_gravity: Map<ResourceType, GravityWell>;
  
  // Daimoi received
  messages: Daimoi[];
  
  // Graph structure in mask
  local_topology: Subgraph;
}
```

---

## Key Guarantees

| Guarantee | Implementation |
|-----------|----------------|
| Lossless compression | Quotient/coarsening with full reconstruction ledgers |
| Observable topology | Shortest paths and gravity basins directly computable |
| Auditable behavior | Every Presence action has semantic embedding and weight |
| Decentralized allocation | Prices-from-scarcity with shadow price analysis |
| Probabilistic messaging | Daimoi follow affinity + gravity + pressure + randomness |

---

## Open Questions

1. **Scalability**: What is the complexity of gravity map updates?
2. **Consistency**: How to maintain consistency during ViewGraph re-coarsening?
3. **Bootstrapping**: How do Presences learn their policy functions?
4. **Grounding**: How do semantic embeddings connect to actual file content?

---

## References

- `research/graph-native-runtime-formalization.md` - Original formalization
- `research/graph-runtime-report.md` - Additional formalization
- `packages/linear-a/SPEC.md` - DSL for spec compilation
- `packages/cephalon-ts/docs/ARCHITECTURE.md` - Downstream cognition layer
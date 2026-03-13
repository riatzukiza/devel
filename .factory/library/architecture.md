# Architecture

Architectural decisions, patterns, and system design.

---

## Package Map

### Shared packages (in /home/err/devel/packages/)
- `@workspace/radar-core` — Core domain schemas: Radar, SignalEvent, Thread, ConnectionOpportunity, ActionCard, assessment packets, reducer, evidence index, audit
- `@workspace/mcp-foundation` — MCP server factory, HTTP router, OAuth, persistence
- `@workspace/thread-assessment` — Original assessment packet schema (predecessor of radar-core, may be deprecated)
- `@workspace/signal-atproto` — AT Protocol publisher for radar data (Bluesky)
- `@workspace/signal-embed-browser` — Browser-side ONNX cosine similarity via WebNN/WebGPU/WASM

### Service repos (in orgs/riatzukiza/)
- `threat-radar-mcp` — MCP control plane: Express API + MCP tools for radar management, signal collection, reduction
- `threat-radar-web` — React dashboard: wall of clocks → 3-lane mission control UI

### Fork Tales extraction packages (in orgs/open-hax/openhax/packages/)
- `@open-hax/signal-contracts` — Shared signal data contracts (SourceSeed, NormalizedSignal, etc.)
- `@open-hax/signal-watchlists` — Watchlist parsing/merge
- `@open-hax/signal-source-utils` — URL normalization, feed parsing, semantic extraction
- `@open-hax/signal-radar-core` — Scoring helpers (clamp, proximity strategy)

## Key Architectural Decisions

1. **Models emit packets, not clocks** — assessment packets are structured forms; the reducer is deterministic
2. **Deterministic reducer** — weighted median aggregation; uncertainty from percentile spread; no model can dominate
3. **Visible disagreement** — clock shows range + agreement level, not just central estimate
4. **AT Protocol first** — public data goes to Bluesky, SQL only for config/state
5. **Three lanes** — η (global, uncontrollable), μ (local, actionable), Π (connections, federated)
6. **Enso protocol for Π** — envelope-based federation from promethean experimental

## Data Flow

```
Bluesky/Reddit → Collectors → SignalEvent → Normalize/Dedupe →
  Thread clustering → Assessment packets → Deterministic reducer →
  Live snapshot → Dashboard render
                → AT Protocol publish
                → Daily snapshot seal
```

## CRITICAL: radar-core Type Restoration

`radar-core/src/schema.ts` is MISSING these types that exist in its stale `dist/`:
- SignalEvent, SignalEventProvenance
- Thread, ThreadMembership
- ConnectionOpportunity
- ActionCard

These MUST be restored from dist before rebuilding. signal-atproto and threat-radar-mcp collectors depend on them.

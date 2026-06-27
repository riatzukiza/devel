import type http from "node:http";
import { buildSchema, graphql } from "graphql";
import type { ConfigPatch, RuntimeConfig } from "./config.js";
import type { DaimoiTrailSnapshot } from "./mongo-graph-store.js";

export type GraphQLContext = {
  headers: http.IncomingHttpHeaders;
};

export type SemanticFieldCell = {
  id: string;
  fieldProfile: string;
  project: string | null;
  embeddingModel: string | null;
  embeddingDimensions: number | null;
  level: number;
  ix: number;
  iy: number;
  centerX: number;
  centerY: number;
  halfExtent: number;
  mass: number;
  nodeCount: number;
  nodeIds: string[];
  childCellIds: string[];
  charge: number;
  updatedAt: string | null;
  data: Record<string, unknown>;
};

export type SemanticFieldSample = {
  source: string;
  target: string;
  similarity: number;
  charge: number;
  forceKind: string;
  fieldProfile: string;
  project: string | null;
  embeddingModel: string | null;
  embeddingDimensions: number | null;
  sourceSystem: string | null;
  updatedAt: string | null;
  data: Record<string, unknown>;
};

export type GraphQLState = {
  adminToken: string | null;

  getConfig: () => RuntimeConfig;
  updateConfig: (patch: ConfigPatch) => Promise<RuntimeConfig> | RuntimeConfig;

  getStatus: () => {
    nodes: number;
    edges: number;
    seeds: number;
    weaver: { frontier: number; inFlight: number };
    localSync: {
      ok: boolean;
      mode: string;
      lastSuccessfulAt: string | null;
      lastAttemptAt: string | null;
      error: string | null;
      prunedOverlayNodes: number;
    };
    render: RuntimeConfig["render"];
    scan: RuntimeConfig["scan"];
  };

  getGraphView: (opts?: { maxNodes?: number; maxEdges?: number }) => {
    nodes: Array<{
      id: string;
      kind: string;
      label: string;
      x: number;
      y: number;
      external: boolean;
      loadedByDefault: boolean;
      layer?: string;
      data?: unknown;
    }>;
    edges: Array<{
      source: string;
      target: string;
      kind: string;
      layer?: string;
      data?: unknown;
    }>;
    meta: {
      totalNodes: number;
      totalEdges: number;
      sampledNodes: boolean;
      sampledEdges: boolean;
    };
  };

  /**
   * Build a focused, layouted subgraph view around a root node.
   * Semantics: undirected hops across edges in the combined store.
   */
  getFocusedGraphView: (opts: {
    rootId: string;
    distance: number;
    maxNodes?: number;
    maxEdges?: number;
  }) => {
    nodes: Array<{
      id: string;
      kind: string;
      label: string;
      x: number;
      y: number;
      external: boolean;
      loadedByDefault: boolean;
      layer?: string;
      data?: unknown;
    }>;
    edges: Array<{
      source: string;
      target: string;
      kind: string;
      layer?: string;
      data?: unknown;
    }>;
    meta: {
      totalNodes: number;
      totalEdges: number;
      sampledNodes: boolean;
      sampledEdges: boolean;
    };
  };

  getNode: (id: string) => {
    id: string;
    kind: string;
    label: string;
    external: boolean;
    loadedByDefault: boolean;
    layer?: string;
    data?: unknown;
  } | null;

  getEdge: (id: string) => {
    id: string;
    source: string;
    target: string;
    kind: string;
    layer?: string;
    data?: unknown;
  } | null;

  listEdges: (filter: {
    source?: string;
    target?: string;
    kind?: string;
    limit: number;
  }) => Array<{
    id: string;
    source: string;
    target: string;
    kind: string;
    layer?: string;
    data?: unknown;
  }>;

  neighbors: (filter: {
    id: string;
    direction: "in" | "out" | "both";
    kind?: string;
    limit: number;
  }) => Array<{
    id: string;
    kind: string;
    label: string;
    external: boolean;
    loadedByDefault: boolean;
    layer?: string;
    data?: unknown;
  }>;

  searchNodes: (query: string, limit: number) => Array<{
    id: string;
    kind: string;
    label: string;
    external: boolean;
    loadedByDefault: boolean;
    layer?: string;
    data?: unknown;
  }>;

  listDaimoiSnapshots: (filter: {
    limit: number;
    minActivation?: number;
    query?: string;
    lookbackSeconds?: number;
  }) => Promise<DaimoiTrailSnapshot[]> | DaimoiTrailSnapshot[];

  listSemanticFieldOverlay: (filter: {
    fieldProfile?: string;
    project?: string;
    cellLimit: number;
    sampleLimit: number;
  }) => Promise<{ cells: SemanticFieldCell[]; samples: SemanticFieldSample[] }> | { cells: SemanticFieldCell[]; samples: SemanticFieldSample[] };

  listPresenceNodes: (filter: { class?: string; includeArchived: boolean; limit: number }) => Array<{
    id: string;
    kind: string;
    label: string;
    external: boolean;
    loadedByDefault: boolean;
    layer?: string;
    data?: unknown;
  }>;

  listSemanticEdges: (filter: { status?: string; minSimilarity?: number; limit: number }) => Array<{
    id: string;
    source: string;
    target: string;
    kind: string;
    layer?: string;
    data?: Record<string, unknown>;
  }>;

  nodePreview: (id: string, maxBytes: number) =>
    | Promise<{
        id: string;
        kind: string;
        format: string;
        contentType: string;
        language: string | null;
        body: string | null;
        truncated: boolean;
        bytes: number;
        status?: number;
        error?: string;
      } | null>
    | {
        id: string;
        kind: string;
        format: string;
        contentType: string;
        language: string | null;
        body: string | null;
        truncated: boolean;
        bytes: number;
        status?: number;
        error?: string;
      }
    | null;

  rescanNow: () => Promise<void> | void;
  seedUrls: (urls: string[]) => void;

  upsertUserNode: (input: {
    id: string;
    kind?: string;
    label?: string;
    external?: boolean;
    loadedByDefault?: boolean;
    data?: Record<string, unknown>;
  }) =>
    | Promise<{
        id: string;
        kind: string;
        label: string;
        external: boolean;
        loadedByDefault: boolean;
        layer?: string;
        data?: unknown;
      }>
    | {
        id: string;
        kind: string;
        label: string;
        external: boolean;
        loadedByDefault: boolean;
        layer?: string;
        data?: unknown;
      };

  upsertUserEdge: (input: {
    id: string;
    source: string;
    target: string;
    kind?: string;
    data?: Record<string, unknown>;
  }) =>
    | Promise<{
        id: string;
        source: string;
        target: string;
        kind: string;
        layer?: string;
        data?: unknown;
      }>
    | {
        id: string;
        source: string;
        target: string;
        kind: string;
        layer?: string;
        data?: unknown;
      };

  upsertPresenceNode: (input: {
    id: string;
    class: string;
    label?: string;
    resourceKind?: string;
    saturation?: number;
    emissionThreshold?: number;
    refractoryMs?: number;
    lastEmissionAt?: string | null;
    archived?: boolean;
    data?: Record<string, unknown>;
  }) => Promise<{
    id: string;
    kind: string;
    label: string;
    external: boolean;
    loadedByDefault: boolean;
    layer?: string;
    data?: unknown;
  }> | {
    id: string;
    kind: string;
    label: string;
    external: boolean;
    loadedByDefault: boolean;
    layer?: string;
    data?: unknown;
  };

  reinforceSemanticEdge: (input: {
    source: string;
    target: string;
    similarity: number;
    daimoiId?: string;
    reinforcement?: number;
    decayHalfLifeMs?: number;
    now?: string;
    data?: Record<string, unknown>;
  }) => Promise<{
    id: string;
    source: string;
    target: string;
    kind: string;
    layer?: string;
    data?: unknown;
  }> | {
    id: string;
    source: string;
    target: string;
    kind: string;
    layer?: string;
    data?: unknown;
  };

  decaySemanticEdges: (input: {
    now?: string;
    breakBelow?: number;
    pruneBelow?: number;
  }) => Promise<{ checked: number; weakened: number; broken: number; pruned: number }> | { checked: number; weakened: number; broken: number; pruned: number };

  removeUserNode: (id: string) => Promise<boolean> | boolean;
  removeUserEdge: (id: string) => Promise<boolean> | boolean;

  /** Bulk update node positions (stored as data.pos) without clobbering derived node metadata. */
  layoutUpsertPositions: (inputs: Array<{ id: string; x: number; y: number }>) => Promise<number> | number;
};

const schema = buildSchema(`
  """A living graph of: local repo scan + ACO web weave + user mutations."""
  type Query {
    status: Status!
    config: Config!

    """A sampled, layouted view for rendering."""
    graphView(maxNodes: Int, maxEdges: Int): GraphView!

    """A focused, layouted view for rendering centered on a root node."""
    focusedGraphView(rootId: ID!, distance: Int = 1, maxNodes: Int, maxEdges: Int): GraphView!

    node(id: ID!): Node
    edge(id: ID!): Edge
    """Fetch a preview payload for a node (file head / url head)."""
    nodePreview(id: ID!, maxBytes: Int = 200000): NodePreview
    """Fetch preview payloads for many nodes in one request."""
    nodePreviews(ids: [ID!]!, maxBytes: Int = 200000): [NodePreview]
    edges(source: ID, target: ID, kind: String, limit: Int = 200): [Edge!]!
    neighbors(id: ID!, direction: String = "both", kind: String, limit: Int = 200): [Node!]!
    searchNodes(query: String!, limit: Int = 50): [Node!]!

    """Presence nodes: resources, muses, and transient effect/search presences."""
    presences(class: String, includeArchived: Boolean = false, limit: Int = 200): [PresenceNode!]!

    """Transient semantic-circuit edges, each carrying a required cosine similarity score."""
    semanticEdges(status: String, minSimilarity: Float, limit: Int = 500): [SemanticEdge!]!

    """Recent daimoi trail observations, exposed as snapshots for simulation-state audit views."""
    daimoiSnapshots(query: String, minActivation: Float, lookbackSeconds: Int, limit: Int = 200): [DaimoiSnapshot!]!

    """Semantic field cells plus multipole force samples for Barnes-Hut/quadtree audit overlays."""
    semanticFieldOverlay(fieldProfile: String, project: String, cellLimit: Int = 1000, sampleLimit: Int = 5000): SemanticFieldOverlay!
  }

  type Mutation {
    """Update runtime config (and restart weaver/timers if needed)."""
    configUpdate(patch: ConfigPatchInput!): Config!

    """Re-scan the repo and reseed the weaver."""
    rescanNow: Status!

    """Add URLs to the weaver seed set."""
    weaverSeed(urls: [String!]!): Status!

    """Write to the user layer (future simulation state lives here)."""
    graphUpsertNode(input: NodeInput!): Node!
    graphUpsertEdge(input: EdgeInput!): Edge!
    graphRemoveNode(id: ID!): Boolean!
    graphRemoveEdge(id: ID!): Boolean!

    """Create/update a presence node and make it visible in the rendered graph."""
    presenceUpsert(input: PresenceInput!): PresenceNode!

    """Reinforce a transient semantic edge discovered by daimoi traversal."""
    semanticEdgeReinforce(input: SemanticEdgeReinforceInput!): SemanticEdge!

    """Apply half-life decay to transient semantic edges and prune broken circuits."""
    semanticEdgesDecay(input: SemanticEdgesDecayInput): SemanticEdgeDecayResult!

    """Bulk-update node positions (stored as data.pos)."""
    layoutUpsertPositions(inputs: [NodePositionInput!]!): Int!
  }

  type Status {
    nodes: Int!
    edges: Int!
    seeds: Int!
    weaver: WeaverStatus!
    localSync: LocalSync!
    render: RenderConfig!
    scan: ScanConfig!
  }

  """
  Health of the local-source rebuild (e.g. the OpenPlanner graph export).
  When ok is false the rendered graph may reflect stale persisted state
  rather than the current canonical OpenPlanner graph.
  """
  type LocalSync {
    ok: Boolean!
    mode: String!
    error: String
    lastSuccessfulAt: String
    lastAttemptAt: String
    prunedOverlayNodes: Int!
  }

  type WeaverStatus {
    frontier: Int!
    inFlight: Int!
  }

  type RenderConfig {
    maxRenderNodes: Int!
    maxRenderEdges: Int!
  }

  type WeaverConfig {
    ants: Int!
    dispatchIntervalMs: Int!
    maxConcurrency: Int!
    perHostMinIntervalMs: Int!
    revisitAfterMs: Int!
    alpha: Float!
    beta: Float!
    evaporation: Float!
    deposit: Float!
    requestTimeoutMs: Int!
  }

  type ScanConfig {
    maxFileBytes: Int!
    rescanIntervalMs: Int!
  }

  type Config {
    render: RenderConfig!
    weaver: WeaverConfig!
    scan: ScanConfig!
  }

  input RenderConfigPatch {
    maxRenderNodes: Int
    maxRenderEdges: Int
  }

  input WeaverConfigPatch {
    ants: Int
    dispatchIntervalMs: Int
    maxConcurrency: Int
    perHostMinIntervalMs: Int
    revisitAfterMs: Int
    alpha: Float
    beta: Float
    evaporation: Float
    deposit: Float
    requestTimeoutMs: Int
  }

  input ScanConfigPatch {
    maxFileBytes: Int
    rescanIntervalMs: Int
  }

  input ConfigPatchInput {
    render: RenderConfigPatch
    weaver: WeaverConfigPatch
    scan: ScanConfigPatch
  }

  type GraphMeta {
    totalNodes: Int!
    totalEdges: Int!
    sampledNodes: Boolean!
    sampledEdges: Boolean!
  }

  type GraphViewNode {
    id: ID!
    kind: String!
    label: String!
    x: Float!
    y: Float!
    external: Boolean!
    loadedByDefault: Boolean!
    layer: String!
    dataJson: String
  }

  type GraphViewEdge {
    source: ID!
    target: ID!
    kind: String!
    layer: String!
    dataJson: String
  }

  type GraphView {
    nodes: [GraphViewNode!]!
    edges: [GraphViewEdge!]!
    meta: GraphMeta!
  }

  type Node {
    id: ID!
    kind: String!
    label: String!
    external: Boolean!
    loadedByDefault: Boolean!
    layer: String!
    dataJson: String
  }

  type Edge {
    id: ID!
    source: ID!
    target: ID!
    kind: String!
    layer: String!
    dataJson: String
  }

  type PresenceNode {
    id: ID!
    class: String!
    label: String!
    resourceKind: String
    saturation: Float!
    emissionThreshold: Float!
    refractoryMs: Int!
    lastEmissionAt: String
    archived: Boolean!
    layer: String!
    dataJson: String
  }

  type SemanticEdge {
    id: ID!
    source: ID!
    target: ID!
    similarity: Float!
    conductance: Float!
    resistance: Float!
    status: String!
    reinforcementCount: Int!
    lastReinforcedAt: String!
    decayHalfLifeMs: Int!
    dataJson: String
  }

  type SemanticEdgeDecayResult {
    checked: Int!
    weakened: Int!
    broken: Int!
    pruned: Int!
  }

  type DaimoiSnapshot {
    id: ID!
    queryHash: String!
    queryText: String!
    daimoiId: ID!
    originNodeId: ID!
    currentNodeId: ID!
    nodeIds: [ID!]!
    edgeKeys: [String!]!
    trail: [ID!]!
    activation: Float!
    traversalCost: Float!
    emittedAt: String!
    decayHalfLifeSeconds: Float!
    dataJson: String
  }

  type SemanticFieldCell {
    id: ID!
    fieldProfile: String!
    project: String
    embeddingModel: String
    embeddingDimensions: Int
    level: Int!
    ix: Int!
    iy: Int!
    centerX: Float!
    centerY: Float!
    halfExtent: Float!
    mass: Float!
    nodeCount: Int!
    nodeIds: [ID!]!
    childCellIds: [ID!]!
    charge: Float!
    updatedAt: String
    dataJson: String
  }

  type SemanticFieldSample {
    source: ID!
    target: ID!
    similarity: Float!
    charge: Float!
    forceKind: String!
    fieldProfile: String!
    project: String
    embeddingModel: String
    embeddingDimensions: Int
    sourceSystem: String
    updatedAt: String
    dataJson: String
  }

  type SemanticFieldOverlay {
    cells: [SemanticFieldCell!]!
    samples: [SemanticFieldSample!]!
  }

  type NodePreview {
    id: ID!
    kind: String!
    """markdown | code | text | html | binary | none | error"""
    format: String!
    contentType: String!
    language: String
    body: String
    truncated: Boolean!
    bytes: Int!
    status: Int
    error: String
  }

  input NodeInput {
    id: ID!
    kind: String
    label: String
    external: Boolean
    loadedByDefault: Boolean
    dataJson: String
  }

  input EdgeInput {
    id: ID!
    source: ID!
    target: ID!
    kind: String
    dataJson: String
  }

  input PresenceInput {
    id: ID!
    class: String!
    label: String
    resourceKind: String
    saturation: Float
    emissionThreshold: Float
    refractoryMs: Int
    lastEmissionAt: String
    archived: Boolean
    dataJson: String
  }

  input SemanticEdgeReinforceInput {
    source: ID!
    target: ID!
    similarity: Float!
    daimoiId: ID
    reinforcement: Float
    decayHalfLifeMs: Int
    now: String
    dataJson: String
  }

  input SemanticEdgesDecayInput {
    now: String
    breakBelow: Float
    pruneBelow: Float
  }

  input NodePositionInput {
    id: ID!
    x: Float!
    y: Float!
  }
`);

function getBearer(headers: http.IncomingHttpHeaders): string | null {
  const raw = headers.authorization || headers.Authorization;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const m = /^Bearer\s+(.+)$/i.exec(value);
  return m?.[1]?.trim() || null;
}

function assertAdmin(state: GraphQLState, ctx: GraphQLContext): void {
  if (!state.adminToken) return;
  const token = getBearer(ctx.headers);
  if (token !== state.adminToken) {
    throw new Error("unauthorized (set GRAPH_WEAVER_ADMIN_TOKEN or omit for dev)");
  }
}

function toDataJson(data: unknown): string | null {
  if (data === undefined) return null;
  try {
    return JSON.stringify(data);
  } catch {
    return JSON.stringify({ note: "unserializable" });
  }
}

function parseDataJson(dataJson: string | null | undefined): Record<string, unknown> | undefined {
  const raw = String(dataJson ?? "").trim();
  if (!raw) return undefined;
  const parsed = JSON.parse(raw) as unknown;
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }
  return { value: parsed };
}

function numberOr(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function dataObject(data: unknown): Record<string, unknown> {
  return data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : {};
}

function toPresenceApi(node: {
  id: string;
  label: string;
  layer?: string;
  data?: unknown;
}) {
  const data = dataObject(node.data);
  return {
    id: node.id,
    class: String(data.presence_class ?? data.class ?? "transient"),
    label: node.label,
    resourceKind: typeof data.resource_kind === "string" ? data.resource_kind : null,
    saturation: numberOr(data.saturation, 0),
    emissionThreshold: numberOr(data.emission_threshold, 1),
    refractoryMs: Math.max(0, Math.floor(numberOr(data.refractory_ms, 1000))),
    lastEmissionAt: typeof data.last_emission_at === "string" ? data.last_emission_at : null,
    archived: data.archived === true,
    layer: node.layer || "presence",
    dataJson: toDataJson(data),
  };
}

function toSemanticEdgeApi(edge: {
  id: string;
  source: string;
  target: string;
  data?: unknown;
}) {
  const data = dataObject(edge.data);
  const similarity = clamp(numberOr(data.similarity, 0), -1, 1);
  const conductance = Math.max(0, numberOr(data.conductance, Math.max(0, similarity)));
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    similarity,
    conductance,
    resistance: conductance > 0 ? 1 / conductance : 1_000_000_000,
    status: String(data.status ?? "active"),
    reinforcementCount: Math.max(0, Math.floor(numberOr(data.reinforcement_count, 0))),
    lastReinforcedAt: String(data.last_reinforced_at ?? data.created_at ?? new Date(0).toISOString()),
    decayHalfLifeMs: Math.max(1, Math.floor(numberOr(data.decay_half_life_ms, 60 * 60 * 1000))),
    dataJson: toDataJson(data),
  };
}

function toDaimoiSnapshotApi(snapshot: DaimoiTrailSnapshot) {
  return {
    id: snapshot.id,
    queryHash: snapshot.queryHash,
    queryText: snapshot.queryText,
    daimoiId: snapshot.daimoiId,
    originNodeId: snapshot.originNodeId,
    currentNodeId: snapshot.currentNodeId,
    nodeIds: snapshot.nodeIds,
    edgeKeys: snapshot.edgeKeys,
    trail: snapshot.trail,
    activation: snapshot.activation,
    traversalCost: snapshot.traversalCost,
    emittedAt: snapshot.emittedAt,
    decayHalfLifeSeconds: snapshot.decayHalfLifeSeconds,
    dataJson: toDataJson(snapshot.data),
  };
}

function toSemanticFieldCellApi(cell: SemanticFieldCell) {
  return {
    ...cell,
    dataJson: toDataJson(cell.data),
  };
}

function toSemanticFieldSampleApi(sample: SemanticFieldSample) {
  return {
    ...sample,
    dataJson: toDataJson(sample.data),
  };
}

async function readBody(req: http.IncomingMessage, maxBytes = 2_000_000): Promise<string> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    chunks.push(buf);
    total += buf.length;
    if (total > maxBytes) {
      throw new Error("request too large");
    }
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function createGraphQLHandler(state: GraphQLState) {
  const root = {
    status: (_args: unknown, _ctx: GraphQLContext) => state.getStatus(),
    config: (_args: unknown, _ctx: GraphQLContext) => state.getConfig(),

    graphView: (
      args: { maxNodes?: number | null; maxEdges?: number | null },
      _ctx: GraphQLContext,
    ) => {
      const view = state.getGraphView({
        maxNodes: args.maxNodes ?? undefined,
        maxEdges: args.maxEdges ?? undefined,
      });

      return {
        nodes: view.nodes.map((n) => ({
          id: n.id,
          kind: n.kind,
          label: n.label,
          x: n.x,
          y: n.y,
          external: n.external,
          loadedByDefault: n.loadedByDefault,
          layer: n.layer || "unknown",
          dataJson: toDataJson(n.data),
        })),
        edges: view.edges.map((e) => ({
          source: e.source,
          target: e.target,
          kind: e.kind,
          layer: e.layer || "unknown",
          dataJson: toDataJson(e.data),
        })),
        meta: view.meta,
      };
    },

    focusedGraphView: (
      args: { rootId: string; distance?: number | null; maxNodes?: number | null; maxEdges?: number | null },
      _ctx: GraphQLContext,
    ) => {
      const rootId = String(args.rootId || "").trim();
      const distance = Math.max(0, Math.min(12, Math.floor(Number(args.distance ?? 1))));
      const view = state.getFocusedGraphView({
        rootId,
        distance,
        maxNodes: args.maxNodes ?? undefined,
        maxEdges: args.maxEdges ?? undefined,
      });

      return {
        nodes: view.nodes.map((n) => ({
          id: n.id,
          kind: n.kind,
          label: n.label,
          x: n.x,
          y: n.y,
          external: n.external,
          loadedByDefault: n.loadedByDefault,
          layer: n.layer || "unknown",
          dataJson: toDataJson(n.data),
        })),
        edges: view.edges.map((e) => ({
          source: e.source,
          target: e.target,
          kind: e.kind,
          layer: e.layer || "unknown",
          dataJson: toDataJson(e.data),
        })),
        meta: view.meta,
      };
    },

    node: (args: { id: string }, _ctx: GraphQLContext) => {
      const n = state.getNode(args.id);
      if (!n) return null;
      return {
        ...n,
        layer: n.layer || "unknown",
        dataJson: toDataJson(n.data),
      };
    },

    nodePreview: async (args: { id: string; maxBytes?: number | null }, _ctx: GraphQLContext) => {
      const maxBytes = Math.max(1024, Math.min(2_000_000, Math.floor(Number(args.maxBytes ?? 200_000))));
      return await state.nodePreview(args.id, maxBytes);
    },

    nodePreviews: async (args: { ids: string[]; maxBytes?: number | null }, _ctx: GraphQLContext) => {
      const maxBytes = Math.max(1024, Math.min(2_000_000, Math.floor(Number(args.maxBytes ?? 200_000))));
      const ids = Array.isArray(args.ids) ? args.ids.map((id) => String(id || "")).filter(Boolean) : [];
      return await Promise.all(ids.map((id) => state.nodePreview(id, maxBytes)));
    },

    edge: (args: { id: string }, _ctx: GraphQLContext) => {
      const e = state.getEdge(args.id);
      if (!e) return null;
      return {
        ...e,
        layer: e.layer || "unknown",
        dataJson: toDataJson(e.data),
      };
    },

    edges: (
      args: { source?: string | null; target?: string | null; kind?: string | null; limit?: number },
      _ctx: GraphQLContext,
    ) => {
      const rows = state.listEdges({
        source: args.source ?? undefined,
        target: args.target ?? undefined,
        kind: args.kind ?? undefined,
        limit: Math.max(1, Math.min(2000, Number(args.limit ?? 200))),
      });
      return rows.map((e) => ({
        ...e,
        layer: e.layer || "unknown",
        dataJson: toDataJson(e.data),
      }));
    },

    neighbors: (
      args: { id: string; direction?: string | null; kind?: string | null; limit?: number },
      _ctx: GraphQLContext,
    ) => {
      const dirRaw = String(args.direction ?? "both").toLowerCase();
      const direction = dirRaw === "in" || dirRaw === "out" ? dirRaw : "both";
      const rows = state.neighbors({
        id: args.id,
        direction,
        kind: args.kind ?? undefined,
        limit: Math.max(1, Math.min(2000, Number(args.limit ?? 200))),
      });
      return rows.map((n) => ({
        ...n,
        layer: n.layer || "unknown",
        dataJson: toDataJson(n.data),
      }));
    },

    searchNodes: (args: { query: string; limit?: number }, _ctx: GraphQLContext) => {
      const rows = state.searchNodes(args.query, Math.max(1, Math.min(500, Number(args.limit ?? 50))));
      return rows.map((n) => ({
        ...n,
        layer: n.layer || "unknown",
        dataJson: toDataJson(n.data),
      }));
    },

    presences: (
      args: { class?: string | null; includeArchived?: boolean | null; limit?: number },
      _ctx: GraphQLContext,
    ) => {
      const rows = state.listPresenceNodes({
        class: args.class ?? undefined,
        includeArchived: args.includeArchived === true,
        limit: Math.max(1, Math.min(2000, Number(args.limit ?? 200))),
      });
      return rows.map(toPresenceApi);
    },

    semanticEdges: (
      args: { status?: string | null; minSimilarity?: number | null; limit?: number },
      _ctx: GraphQLContext,
    ) => {
      const rows = state.listSemanticEdges({
        status: args.status ?? undefined,
        minSimilarity: args.minSimilarity ?? undefined,
        limit: Math.max(1, Math.min(5000, Number(args.limit ?? 500))),
      });
      return rows.map(toSemanticEdgeApi);
    },

    daimoiSnapshots: async (
      args: { query?: string | null; minActivation?: number | null; lookbackSeconds?: number | null; limit?: number },
      _ctx: GraphQLContext,
    ) => {
      const rows = await state.listDaimoiSnapshots({
        query: args.query ?? undefined,
        minActivation: args.minActivation ?? undefined,
        lookbackSeconds: args.lookbackSeconds ?? undefined,
        limit: Math.max(1, Math.min(2000, Number(args.limit ?? 200))),
      });
      return rows.map(toDaimoiSnapshotApi);
    },

    semanticFieldOverlay: async (
      args: { fieldProfile?: string | null; project?: string | null; cellLimit?: number | null; sampleLimit?: number | null },
      _ctx: GraphQLContext,
    ) => {
      const overlay = await state.listSemanticFieldOverlay({
        fieldProfile: args.fieldProfile ?? undefined,
        project: args.project ?? undefined,
        cellLimit: Math.max(1, Math.min(10000, Number(args.cellLimit ?? 1000))),
        sampleLimit: Math.max(1, Math.min(50000, Number(args.sampleLimit ?? 5000))),
      });
      return {
        cells: overlay.cells.map(toSemanticFieldCellApi),
        samples: overlay.samples.map(toSemanticFieldSampleApi),
      };
    },

    // --- mutations
    configUpdate: async (args: { patch: ConfigPatch }, ctx: GraphQLContext) => {
      assertAdmin(state, ctx);
      return await state.updateConfig(args.patch);
    },

    rescanNow: async (_args: unknown, ctx: GraphQLContext) => {
      assertAdmin(state, ctx);
      await state.rescanNow();
      return state.getStatus();
    },

    weaverSeed: (args: { urls: string[] }, ctx: GraphQLContext) => {
      assertAdmin(state, ctx);
      state.seedUrls(args.urls);
      return state.getStatus();
    },

    graphUpsertNode: async (args: { input: { id: string; kind?: string; label?: string; external?: boolean; loadedByDefault?: boolean; dataJson?: string | null } }, ctx: GraphQLContext) => {
      assertAdmin(state, ctx);
      const data = parseDataJson(args.input.dataJson);
      const node = await state.upsertUserNode({
        id: args.input.id,
        kind: args.input.kind ?? undefined,
        label: args.input.label ?? undefined,
        external: args.input.external ?? undefined,
        loadedByDefault: args.input.loadedByDefault ?? undefined,
        data,
      });
      return {
        ...node,
        layer: node.layer || "unknown",
        dataJson: toDataJson(node.data),
      };
    },

    graphUpsertEdge: async (args: { input: { id: string; source: string; target: string; kind?: string; dataJson?: string | null } }, ctx: GraphQLContext) => {
      assertAdmin(state, ctx);
      const data = parseDataJson(args.input.dataJson);
      const edge = await state.upsertUserEdge({
        id: args.input.id,
        source: args.input.source,
        target: args.input.target,
        kind: args.input.kind ?? undefined,
        data,
      });
      return {
        ...edge,
        layer: edge.layer || "unknown",
        dataJson: toDataJson(edge.data),
      };
    },

    graphRemoveNode: async (args: { id: string }, ctx: GraphQLContext) => {
      assertAdmin(state, ctx);
      return await state.removeUserNode(args.id);
    },

    graphRemoveEdge: async (args: { id: string }, ctx: GraphQLContext) => {
      assertAdmin(state, ctx);
      return await state.removeUserEdge(args.id);
    },

    presenceUpsert: async (args: { input: { id: string; class: string; label?: string | null; resourceKind?: string | null; saturation?: number | null; emissionThreshold?: number | null; refractoryMs?: number | null; lastEmissionAt?: string | null; archived?: boolean | null; dataJson?: string | null } }, ctx: GraphQLContext) => {
      assertAdmin(state, ctx);
      const data = parseDataJson(args.input.dataJson);
      const node = await state.upsertPresenceNode({
        id: args.input.id,
        class: args.input.class,
        label: args.input.label ?? undefined,
        resourceKind: args.input.resourceKind ?? undefined,
        saturation: args.input.saturation ?? undefined,
        emissionThreshold: args.input.emissionThreshold ?? undefined,
        refractoryMs: args.input.refractoryMs ?? undefined,
        lastEmissionAt: args.input.lastEmissionAt ?? undefined,
        archived: args.input.archived ?? undefined,
        data,
      });
      return toPresenceApi(node);
    },

    semanticEdgeReinforce: async (args: { input: { source: string; target: string; similarity: number; daimoiId?: string | null; reinforcement?: number | null; decayHalfLifeMs?: number | null; now?: string | null; dataJson?: string | null } }, ctx: GraphQLContext) => {
      assertAdmin(state, ctx);
      const data = parseDataJson(args.input.dataJson);
      const edge = await state.reinforceSemanticEdge({
        source: args.input.source,
        target: args.input.target,
        similarity: args.input.similarity,
        daimoiId: args.input.daimoiId ?? undefined,
        reinforcement: args.input.reinforcement ?? undefined,
        decayHalfLifeMs: args.input.decayHalfLifeMs ?? undefined,
        now: args.input.now ?? undefined,
        data,
      });
      return toSemanticEdgeApi(edge);
    },

    semanticEdgesDecay: async (args: { input?: { now?: string | null; breakBelow?: number | null; pruneBelow?: number | null } | null }, ctx: GraphQLContext) => {
      assertAdmin(state, ctx);
      return await state.decaySemanticEdges({
        now: args.input?.now ?? undefined,
        breakBelow: args.input?.breakBelow ?? undefined,
        pruneBelow: args.input?.pruneBelow ?? undefined,
      });
    },

    layoutUpsertPositions: async (args: { inputs: Array<{ id: string; x: number; y: number }> }, ctx: GraphQLContext) => {
      assertAdmin(state, ctx);
      return await state.layoutUpsertPositions(args.inputs);
    },
  };

  return async function handleGraphQL(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // CORS (dev-friendly)
    res.setHeader("access-control-allow-origin", "*");
    res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
    res.setHeader("access-control-allow-headers", "content-type,authorization");

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    try {
      const url = new URL(req.url || "/graphql", `http://${req.headers.host || "localhost"}`);

      let query = "";
      let variables: Record<string, unknown> | undefined;
      let operationName: string | undefined;

      if (req.method === "GET") {
        query = String(url.searchParams.get("query") || "");
        const varsRaw = url.searchParams.get("variables");
        variables = varsRaw ? (JSON.parse(varsRaw) as Record<string, unknown>) : undefined;
        operationName = url.searchParams.get("operationName") || undefined;
      } else if (req.method === "POST") {
        const body = await readBody(req);
        const parsed = JSON.parse(body) as {
          query?: unknown;
          variables?: unknown;
          operationName?: unknown;
        };
        query = String(parsed.query || "");
        variables = (parsed.variables as Record<string, unknown> | undefined) ?? undefined;
        operationName = parsed.operationName ? String(parsed.operationName) : undefined;
      }

      if (!query.trim()) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ errors: [{ message: "missing query" }] }));
        return;
      }

      const result = await graphql({
        schema,
        source: query,
        rootValue: root,
        contextValue: { headers: req.headers } satisfies GraphQLContext,
        variableValues: variables,
        operationName,
      });

      res.statusCode = 200;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify(result));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.statusCode = 500;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ errors: [{ message }] }));
    }
  };
}

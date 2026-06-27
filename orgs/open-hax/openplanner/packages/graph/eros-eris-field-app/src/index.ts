import {
  buildSemanticEdgesForCandidates,
  stepField,
  GraphAntSystem,
  type FieldConfig,
  type Particle,
  type SemanticEdge,
  type SpringEdge,
  type VexxCosineConfig,
  type GraphAntConfig,
  type AntTrailEdge,
} from "@workspace/eros-eris-field";

import http from "node:http";

type GraphViewNode = {
  id: string;
  kind: string;
  label: string;
  x: number;
  y: number;
  dataJson: string | null;
};

type GraphViewEdge = {
  source: string;
  target: string;
  kind: string;
  dataJson: string | null;
};

type GraphView = {
  nodes: GraphViewNode[];
  edges: GraphViewEdge[];
  meta: { totalNodes: number; totalEdges: number; sampledNodes: boolean; sampledEdges: boolean };
};

type NodePreview = {
  id: string;
  kind: string;
  format: string;
  contentType: string;
  language: string | null;
  body: string | null;
  truncated: boolean;
  bytes: number;
  status?: number | null;
  error?: string | null;
} | null;

type GraphNodeEmbeddingRow = {
  id: string;
  sourceEventId: string;
  embeddingModel: string | null;
  embeddingDimensions: number;
  embedding: number[];
  chunkCount: number;
};

type MaterializeGraphNodeEmbeddingInput = {
  id: string;
  body: string;
  sourceEventId?: string | null;
};

type ErosErisHealthSnapshot = {
  startedAt: string;
  ok: boolean;
  service: string;
  role: string;
  shardIndex: number;
  shardCount: number;
  lastLoopAt: string | null;
  lastRefreshAt: string | null;
  lastWriteAt: string | null;
  viewNodes: number;
  viewEdges: number;
  springs: number;
  semanticPairs: number;
  particles: number;
  embeddingsCached: number;
  refreshCount: number;
  viewMeta: Record<string, unknown> | null;
  inFlight: { refresh: boolean; write: boolean; hydrate: boolean; embed: number };
  heartbeat: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
};

let healthSnapshot: ErosErisHealthSnapshot = {
  startedAt: new Date().toISOString(),
  ok: true,
  service: "eros-eris-field-app",
  role: String(process.env.EROS_ERIS_WORKER_ROLE || "hybrid"),
  shardIndex: Number.parseInt(String(process.env.SIM_SHARD_INDEX || "0"), 10) || 0,
  shardCount: Math.max(1, Number.parseInt(String(process.env.SIM_SHARD_COUNT || "1"), 10) || 1),
  lastLoopAt: null,
  lastRefreshAt: null,
  lastWriteAt: null,
  viewNodes: 0,
  viewEdges: 0,
  springs: 0,
  semanticPairs: 0,
  particles: 0,
  embeddingsCached: 0,
  refreshCount: 0,
  viewMeta: null,
  inFlight: { refresh: false, write: false, hydrate: false, embed: 0 },
  heartbeat: null,
  lastError: null,
  lastErrorAt: null,
};

function startHealthServer() {
  const host = String(process.env.EROS_ERIS_HTTP_HOST || "0.0.0.0").trim();
  const port = Number.parseInt(String(process.env.EROS_ERIS_HTTP_PORT || "8786"), 10);
  if (!Number.isFinite(port) || port <= 0) {
    console.warn(`[eros-eris] invalid EROS_ERIS_HTTP_PORT=${process.env.EROS_ERIS_HTTP_PORT}; skipping health server`);
    return;
  }

  const server = http.createServer((req, res) => {
    const url = req.url || "/";
    if (req.method === "GET" && (url === "/health" || url.startsWith("/health?"))) {
      res.writeHead(200, {
        "content-type": "application/json",
        "cache-control": "no-store",
      });
      res.end(JSON.stringify(healthSnapshot));
      return;
    }

    if (req.method === "GET" && (url === "/status" || url.startsWith("/status?"))) {
      res.writeHead(200, {
        "content-type": "application/json",
        "cache-control": "no-store",
      });
      res.end(JSON.stringify(healthSnapshot));
      return;
    }

    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "not found" }));
  });

  server.listen(port, host, () => {
    console.log(`[eros-eris] health server listening on http://${host}:${port}`);
  });
}

function setHealthError(message: string) {
  healthSnapshot = {
    ...healthSnapshot,
    lastError: message,
    lastErrorAt: new Date().toISOString(),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw === undefined ? fallback : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function str(name: string, fallback: string): string {
  const raw = String(process.env[name] ?? "").trim();
  return raw || fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function stripHtml(html: string): string {
  // Cheap + cheerful: remove scripts/styles and tags.
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseJson(maybe: string | null): any {
  if (!maybe) return null;
  try {
    return JSON.parse(maybe);
  } catch {
    return null;
  }
}

function inferLake(node: GraphViewNode): string {
  const data = parseJson(node.dataJson);
  const id = node.id;
  if (id.startsWith("knoxx-session:")) return "knoxx-session";
  return String(data?.lake || id.split(":", 1)[0] || "misc");
}

function inferNodeType(node: GraphViewNode): string {
  const data = parseJson(node.dataJson);
  const id = node.id;
  if (id.startsWith("knoxx-session:")) {
    if (id.includes(":tool_call:") || id.includes(":tool-call:")) return "tool_call";
    if (id.includes(":tool_result:") || id.includes(":tool-result:")) return "tool_result";
    if (id.includes(":reasoning:")) return "reasoning";
    if (id.includes(":message:")) return "message";
  }
  return String(data?.node_type || node.kind || "node");
}

function lakeCenterX(lake: string): number {
  switch (lake) {
    case "devel": return -1400;
    case "web": return 0;
    case "bluesky": return 1400;
    case "knoxx-session": return 0;
    default: return 0;
  }
}

function lakeCenterY(lake: string): number {
  switch (lake) {
    case "devel": return 0;
    case "web": return 0;
    case "bluesky": return 0;
    case "knoxx-session": return 2400;
    default: return 0;
  }
}

function typeBandY(lake: string, nodeType: string): number {
  if (lake === "devel") {
    if (nodeType === "docs") return -360;
    if (nodeType === "code") return -120;
    if (nodeType === "config") return 120;
    if (nodeType === "data") return 360;
  }
  if (lake === "web") {
    if (nodeType === "visited") return -180;
    if (nodeType === "unvisited") return 180;
  }
  if (lake === "bluesky") {
    if (nodeType === "user") return -180;
    if (nodeType === "post") return 180;
  }
  if (lake === "knoxx-session") {
    if (nodeType === "message") return -800;
    if (nodeType === "reasoning") return -400;
    if (nodeType === "tool_call") return 0;
    if (nodeType === "tool_result") return 400;
    return -200;
  }
  return 0;
}

function applyLakeBands(params: {
  particles: Particle[];
  nodesById: Map<string, { lake: string; nodeType: string }>;
  dt: number;
}): void {
  const xStrength = 0.0015;
  const yStrength = 0.001;

  for (const particle of params.particles) {
    const meta = params.nodesById.get(particle.id);
    if (!meta) continue;

    const targetX = lakeCenterX(meta.lake);
    const targetY = lakeCenterY(meta.lake) + typeBandY(meta.lake, meta.nodeType);

    particle.vx += (targetX - particle.x) * xStrength * params.dt;
    particle.vy += (targetY - particle.y) * yStrength * params.dt;
  }
}

function nudgeInsideBoundary(particle: Particle, targetRadius: number, boundaryThickness: number): void {
  if (!(targetRadius > 0 && boundaryThickness > 0)) return;
  const r = Math.hypot(particle.x, particle.y);
  if (!(r > targetRadius - boundaryThickness)) return;
  const target = Math.max(0, targetRadius - boundaryThickness * 1.25);
  if (r <= 1e-6 || target <= 0) return;
  const s = target / r;
  particle.x *= s;
  particle.y *= s;
  particle.vx *= 0.4;
  particle.vy *= 0.4;
}

async function gql<T>(args: { url: string; adminToken: string | null; query: string; variables?: any }): Promise<T> {
  const res = await fetch(args.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(args.adminToken ? { authorization: `Bearer ${args.adminToken}` } : {}),
    },
    body: JSON.stringify({ query: args.query, variables: args.variables }),
  });

  const payload = (await res.json()) as any;
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((e: any) => e.message).join("; "));
  }
  return payload.data as T;
}

async function fetchGraphView(params: {
  graphqlUrl: string;
  adminToken: string | null;
  maxNodes: number;
  maxEdges: number;
}): Promise<GraphView> {
  const data = await gql<{ graphView: GraphView }>({
    url: params.graphqlUrl,
    adminToken: params.adminToken,
    query: `query View($n: Int!, $e: Int!) {
      graphView(maxNodes: $n, maxEdges: $e) {
        nodes { id kind label x y dataJson }
        edges { source target kind dataJson }
        meta { totalNodes totalEdges sampledNodes sampledEdges }
      }
    }`,
    variables: { n: params.maxNodes, e: params.maxEdges },
  });
  return data.graphView;
}

async function fetchOpenPlannerGraphView(params: {
  openPlannerBaseUrl: string;
  openPlannerApiKey: string | null;
  maxNodes: number;
  maxEdges: number;
  componentCount: number;
  shardIndex: number;
  shardCount: number;
  rotationCursor: number;
}): Promise<GraphView> {
  const baseUrl = String(params.openPlannerBaseUrl || "").trim().replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("openplanner base url required");
  }

  const res = await fetch(`${baseUrl}/v1/graph/view`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(params.openPlannerApiKey ? { authorization: `Bearer ${params.openPlannerApiKey}` } : {}),
    },
    body: JSON.stringify({
      maxNodes: params.maxNodes,
      maxEdges: params.maxEdges,
      componentCount: params.componentCount,
      shardIndex: params.shardIndex,
      shardCount: params.shardCount,
      rotationCursor: params.rotationCursor,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`openplanner graph view ${res.status}: ${text.slice(0, 200)}`);
  }

  const payload = JSON.parse(text) as { nodes?: GraphViewNode[]; edges?: GraphViewEdge[]; meta?: GraphView["meta"] };
  return {
    nodes: Array.isArray(payload.nodes) ? payload.nodes : [],
    edges: Array.isArray(payload.edges) ? payload.edges : [],
    meta: payload.meta ?? { totalNodes: 0, totalEdges: 0, sampledNodes: false, sampledEdges: false },
  };
}

async function fetchNodePreview(params: {
  graphqlUrl: string;
  adminToken: string | null;
  id: string;
  maxBytes: number;
}): Promise<NodePreview> {
  const data = await gql<{ nodePreview: NodePreview }>({
    url: params.graphqlUrl,
    adminToken: params.adminToken,
    query: `query Preview($id: ID!, $m: Int!) {
      nodePreview(id: $id, maxBytes: $m) { id kind format contentType language body truncated bytes status error }
    }`,
    variables: { id: params.id, m: params.maxBytes },
  });
  return data.nodePreview;
}

async function fetchNodePreviews(params: {
  graphqlUrl: string;
  adminToken: string | null;
  ids: string[];
  maxBytes: number;
}): Promise<Array<NodePreview>> {
  if (params.ids.length === 0) return [];
  const data = await gql<{ nodePreviews: Array<NodePreview> }>({
    url: params.graphqlUrl,
    adminToken: params.adminToken,
    query: `query PreviewMany($ids: [ID!]!, $m: Int!) {
      nodePreviews(ids: $ids, maxBytes: $m) { id kind format contentType language body truncated bytes status error }
    }`,
    variables: { ids: params.ids, m: params.maxBytes },
  });
  return Array.isArray(data.nodePreviews) ? data.nodePreviews : [];
}

async function layoutUpsertPositions(params: {
  graphqlUrl: string;
  adminToken: string | null;
  inputs: Array<{ id: string; x: number; y: number }>;
}): Promise<number> {
  const graphWeaverBaseUrl = params.graphqlUrl.replace(/\/graphql\/?$/, "");

  try {
    const response = await fetch(`${graphWeaverBaseUrl}/api/layout/upsert`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(params.adminToken ? { authorization: `Bearer ${params.adminToken}` } : {}),
      },
      body: JSON.stringify({ inputs: params.inputs }),
    });

    const text = await response.text();
    if (response.ok) {
      const payload = JSON.parse(text) as { updated?: number };
      if (typeof payload.updated === "number") return payload.updated;
      return params.inputs.length;
    }
  } catch {
    // Fall back to GraphQL for older graph-weaver builds.
  }

  const data = await gql<{ layoutUpsertPositions: number }>({
    url: params.graphqlUrl,
    adminToken: params.adminToken,
    query: `mutation Upsert($xs: [NodePositionInput!]!) {
      layoutUpsertPositions(inputs: $xs)
    }`,
    variables: { xs: params.inputs },
  });
  return data.layoutUpsertPositions;
}

async function fetchOpenPlannerNodeEmbeddings(params: {
  openPlannerBaseUrl: string;
  openPlannerApiKey: string | null;
  ids: string[];
  eventIds: string[];
  model?: string;
}): Promise<GraphNodeEmbeddingRow[]> {
  const baseUrl = String(params.openPlannerBaseUrl || "").trim().replace(/\/+$/, "");
  if (!baseUrl) return [];

  const res = await fetch(`${baseUrl}/v1/graph/node-embeddings/query`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(params.openPlannerApiKey ? { authorization: `Bearer ${params.openPlannerApiKey}` } : {}),
    },
    body: JSON.stringify({
      ids: params.ids,
      eventIds: params.eventIds,
      model: params.model,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`openplanner node embeddings ${res.status}: ${text.slice(0, 200)}`);
  }

  const payload = JSON.parse(text) as { vectors?: unknown };
  const rows = Array.isArray(payload.vectors) ? payload.vectors : [];
  return rows
    .map((row) => {
      const record = row as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : "";
      const sourceEventId = typeof record.sourceEventId === "string" ? record.sourceEventId : "";
      const embedding = Array.isArray(record.embedding)
        ? record.embedding.map((value) => Number(value))
        : [];
      const embeddingDimensions = Number(record.embeddingDimensions ?? embedding.length);
      const chunkCount = Number(record.chunkCount ?? 0);
      if (!id || !sourceEventId || embedding.length === 0 || embedding.some((value) => !Number.isFinite(value))) return null;
      return {
        id,
        sourceEventId,
        embeddingModel: typeof record.embeddingModel === "string" ? record.embeddingModel : null,
        embeddingDimensions: Number.isFinite(embeddingDimensions) ? embeddingDimensions : embedding.length,
        embedding,
        chunkCount: Number.isFinite(chunkCount) ? chunkCount : 0,
      } satisfies GraphNodeEmbeddingRow;
    })
    .filter((row): row is GraphNodeEmbeddingRow => !!row);
}

async function materializeOpenPlannerNodeEmbeddings(params: {
  openPlannerBaseUrl: string;
  openPlannerApiKey: string | null;
  inputs: MaterializeGraphNodeEmbeddingInput[];
  model?: string;
}): Promise<GraphNodeEmbeddingRow[]> {
  const baseUrl = String(params.openPlannerBaseUrl || "").trim().replace(/\/+$/, "");
  if (!baseUrl || params.inputs.length === 0) return [];

  const res = await fetch(`${baseUrl}/v1/graph/node-embeddings/materialize`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(params.openPlannerApiKey ? { authorization: `Bearer ${params.openPlannerApiKey}` } : {}),
    },
    body: JSON.stringify({
      inputs: params.inputs,
      model: params.model,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`openplanner materialize node embeddings ${res.status}: ${text.slice(0, 200)}`);
  }

  const payload = JSON.parse(text) as { vectors?: unknown };
  const rows = Array.isArray(payload.vectors) ? payload.vectors : [];
  return rows
    .map((row) => {
      const record = row as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : "";
      const sourceEventId = typeof record.sourceEventId === "string" ? record.sourceEventId : "";
      const embedding = Array.isArray(record.embedding)
        ? record.embedding.map((value) => Number(value))
        : [];
      const embeddingDimensions = Number(record.embeddingDimensions ?? embedding.length);
      const chunkCount = Number(record.chunkCount ?? 0);
      if (!id || !sourceEventId || embedding.length === 0 || embedding.some((value) => !Number.isFinite(value))) return null;
      return {
        id,
        sourceEventId,
        embeddingModel: typeof record.embeddingModel === "string" ? record.embeddingModel : null,
        embeddingDimensions: Number.isFinite(embeddingDimensions) ? embeddingDimensions : embedding.length,
        embedding,
        chunkCount: Number.isFinite(chunkCount) ? chunkCount : 0,
      } satisfies GraphNodeEmbeddingRow;
    })
    .filter((row): row is GraphNodeEmbeddingRow => !!row);
}

async function upsertOpenPlannerSemanticEdges(params: {
  openPlannerBaseUrl: string;
  openPlannerApiKey: string | null;
  edges: SemanticEdge[];
  embeddingModel?: string;
  project?: string;
}): Promise<number> {
  const baseUrl = String(params.openPlannerBaseUrl || "").trim().replace(/\/+$/, "");
  if (!baseUrl || params.edges.length === 0) return 0;

  const res = await fetch(`${baseUrl}/v1/graph/semantic-force/upsert`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(params.openPlannerApiKey ? { authorization: `Bearer ${params.openPlannerApiKey}` } : {}),
    },
    body: JSON.stringify({
      samples: params.edges.map((e) => ({
        source: e.a,
        target: e.b,
        similarity: e.sim,
      })),
      embeddingModel: params.embeddingModel,
      project: params.project,
      source: "eros-eris-field",
      fieldProfile: "layout.v1",
      forceKind: "semantic_charge",
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`openplanner semantic force upsert ${res.status}: ${text.slice(0, 200)}`);
  }

  const payload = JSON.parse(text) as { stored?: number };
  return payload.stored ?? 0;
}

type CanonicalEdge = {
  source: string;
  target: string;
  similarity: number;
  charge?: number;
  forceKind?: string;
  fieldProfile?: string;
  compatibilityKind?: string;
};

type CanonicalEdgesResponse = {
  ok: boolean;
  count: number;
  samples?: CanonicalEdge[];
  edges?: CanonicalEdge[];
  source?: string;
};

type StructuralEdgeResponse = {
  edges: Array<{
    source: string;
    target: string;
    edgeKind: string;
    layer?: string | null;
    data?: unknown;
  }>;
};

async function fetchCanonicalSemanticEdges(params: {
  openPlannerBaseUrl: string;
  openPlannerApiKey: string | null;
  nodeIds: Set<string>;
  limit?: number;
}): Promise<SemanticEdge[]> {
  const baseUrl = String(params.openPlannerBaseUrl || "").trim().replace(/\/+$/, "");
  if (!baseUrl) return [];

  const limit = Math.max(1, Math.min(100000, params.limit ?? 50000));
  const url = `${baseUrl}/v1/graph/semantic-force?limit=${limit}&includeLegacyFallback=true`;

  const res = await fetch(url, {
    headers: {
      ...(params.openPlannerApiKey ? { authorization: `Bearer ${params.openPlannerApiKey}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`semantic force samples ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  const payload = (await res.json()) as CanonicalEdgesResponse;
  const rows = payload.samples ?? payload.edges ?? [];
  return rows
    .filter((e) => params.nodeIds.has(e.source) && params.nodeIds.has(e.target))
    .map((e) => ({ a: e.source, b: e.target, sim: e.similarity }));
}

async function fetchOpenPlannerStructuralEdges(params: {
  openPlannerBaseUrl: string;
  openPlannerApiKey: string | null;
  nodeIds: string[];
  limit?: number;
}): Promise<GraphViewEdge[]> {
  const baseUrl = String(params.openPlannerBaseUrl || "").trim().replace(/\/+$/, "");
  if (!baseUrl || params.nodeIds.length === 0) return [];

  const res = await fetch(`${baseUrl}/v1/graph/edges/query`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(params.openPlannerApiKey ? { authorization: `Bearer ${params.openPlannerApiKey}` } : {}),
    },
    body: JSON.stringify({
      nodeIds: params.nodeIds,
      limit: Math.max(1, Math.min(50000, params.limit ?? 50000)),
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`openplanner structural edges ${res.status}: ${text.slice(0, 200)}`);
  }

  const payload = JSON.parse(text) as StructuralEdgeResponse;
  return (Array.isArray(payload.edges) ? payload.edges : []).map((edge) => ({
    source: edge.source,
    target: edge.target,
    kind: edge.edgeKind,
    dataJson: edge.data ? JSON.stringify(edge.data) : null,
  }));
}

async function upsertOpenPlannerEdges(params: {
  openPlannerBaseUrl: string;
  openPlannerApiKey: string | null;
  edges: Array<{ source: string; target: string; kind: string; data?: Record<string, unknown> }>;
  project?: string;
}): Promise<number> {
  const baseUrl = String(params.openPlannerBaseUrl || "").trim().replace(/\/+$/, "");
  if (!baseUrl || params.edges.length === 0) return 0;

  const res = await fetch(`${baseUrl}/v1/graph/edges/upsert`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(params.openPlannerApiKey ? { authorization: `Bearer ${params.openPlannerApiKey}` } : {}),
    },
    body: JSON.stringify({
      edges: params.edges,
      project: params.project,
      source: "graph-weaver",
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`openplanner edges upsert ${res.status}: ${text.slice(0, 200)}`);
  }

  const payload = JSON.parse(text) as { stored?: number };
  return payload.stored ?? 0;
}

function springProfile(kind: string): { strength: number; restLength: number } {
  switch (kind) {
    case "code_dependency":
      return { strength: 0.011, restLength: 90 };
    case "local_markdown_link":
      return { strength: 0.005, restLength: 130 };
    case "external_web_link":
      return { strength: 0.0035, restLength: 220 };
    case "visited_to_visited":
      return { strength: 0.0024, restLength: 180 };
    case "visited_to_unvisited":
      return { strength: 0.0028, restLength: 210 };
    case "follows_user":
      return { strength: 0.0025, restLength: 160 };
    case "authored_post":
    case "shared_post":
    case "liked_post":
      return { strength: 0.0032, restLength: 140 };
    case "post_links_visited_web":
    case "post_links_unvisited_web":
      return { strength: 0.003, restLength: 220 };
    case "mentions_devel_path":
      return { strength: 0.0015, restLength: 320 };
    case "mentions_web_url":
      return { strength: 0.0015, restLength: 320 };
    default:
      return { strength: 0.002, restLength: 150 };
  }
}

function pickEmbedCandidates(params: {
  nodes: GraphViewNode[];
  degrees: Map<string, number>;
  embedded: Set<string>;
  limit: number;
}): GraphViewNode[] {
  const grouped = new Map<string, Array<{ node: GraphViewNode; score: number }>>();

  for (const n of params.nodes) {
    if (params.embedded.has(n.id)) continue;

    // Skip vendor / build artifacts (huge noise sinks for embeddings).
    if (
      n.id.includes("/node_modules/") ||
      n.id.includes("/.pnpm/") ||
      n.id.includes("/dist/") ||
      n.id.includes("/build/") ||
      n.id.includes("/.git/")
    ) {
      continue;
    }

    // embed the stuff that benefits most: code + markdown + urls
    if (!(n.kind === "file" || n.kind === "url" || n.kind === "dep")) continue;

    const d = params.degrees.get(n.id) ?? 0;
    const lake = inferLake(n);
    const nodeType = inferNodeType(n);
    const lakeBias = lake === "devel" ? 0.6 : lake === "web" ? 0.5 : 0.4;
    const typeBias = nodeType === "code" || nodeType === "docs" || nodeType === "visited" ? 0.35 : 0.15;
    const score = d + (n.kind === "file" ? 0.5 : 0) + lakeBias + typeBias;
    const key = `${lake}::${nodeType}`;
    const bucket = grouped.get(key) ?? [];
    bucket.push({ node: n, score });
    grouped.set(key, bucket);
  }

  const buckets = [...grouped.values()]
    .map((bucket) => bucket.sort((a, b) => b.score - a.score))
    .sort((a, b) => (b[0]?.score ?? -Infinity) - (a[0]?.score ?? -Infinity));

  const chosen: GraphViewNode[] = [];
  while (chosen.length < Math.max(1, params.limit)) {
    let advanced = false;
    for (const bucket of buckets) {
      const row = bucket.shift();
      if (!row) continue;
      chosen.push(row.node);
      advanced = true;
      if (chosen.length >= Math.max(1, params.limit)) break;
    }
    if (!advanced) break;
  }

  return chosen;
}

function normalizeTextForEmbedding(input: string, maxChars: number): string {
  const s = String(input || "").replace(/\0/g, " ").trim();
  if (s.length <= maxChars) return s;
  return s.slice(0, maxChars);
}

function summarizeField(params: {
  particles: Particle[];
  targetRadius: number;
  boundaryThickness: number;
}): {
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  max: number;
  mean: number;
  edgeBandFraction: number;
} {
  const radii = params.particles.map((p) => Math.hypot(p.x, p.y)).sort((a, b) => a - b);
  const count = radii.length;
  if (count === 0) {
    return { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0, max: 0, mean: 0, edgeBandFraction: 0 };
  }

  const percentile = (p: number): number => {
    const idx = Math.max(0, Math.min(count - 1, Math.floor((count - 1) * p)));
    return radii[idx] ?? 0;
  };

  const inner = params.targetRadius - params.boundaryThickness;
  const edgeBand = inner > 0 ? radii.filter((r) => r >= inner).length / count : 0;
  const mean = radii.reduce((sum, r) => sum + r, 0) / count;

  return {
    p50: percentile(0.5),
    p75: percentile(0.75),
    p90: percentile(0.9),
    p95: percentile(0.95),
    p99: percentile(0.99),
    max: radii[count - 1] ?? 0,
    mean,
    edgeBandFraction: edgeBand,
  };
}

function summarizeMotion(params: {
  particles: Particle[];
  maxSpeed: number;
}): { meanSpeed: number; p95Speed: number; energy: number } {
  const speeds = params.particles.map((p) => Math.hypot(p.vx, p.vy)).sort((a, b) => a - b);
  if (speeds.length === 0) return { meanSpeed: 0, p95Speed: 0, energy: 0 };
  const meanSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
  const p95Speed = speeds[Math.max(0, Math.floor((speeds.length - 1) * 0.95))] ?? 0;
  const norm = Math.max(1e-6, params.maxSpeed);
  return {
    meanSpeed,
    p95Speed,
    energy: clamp(((meanSpeed / norm) * 0.6) + ((p95Speed / norm) * 0.4), 0, 2),
  };
}

function summarizeSpringStress(params: {
  particlesById: Map<string, Particle>;
  springs: SpringEdge[];
  semantic: SemanticEdge[];
  sampleLimit?: number;
}): { structuralStress: number; semanticDensity: number } {
  const sampleLimit = Math.max(64, params.sampleLimit ?? 2048);
  if (params.springs.length === 0) {
    return {
      structuralStress: 0,
      semanticDensity: clamp(params.semantic.length / Math.max(1, params.particlesById.size * 12), 0, 1),
    };
  }

  const stride = Math.max(1, Math.ceil(params.springs.length / sampleLimit));
  let sampled = 0;
  let stress = 0;
  for (let i = 0; i < params.springs.length; i += stride) {
    const spring = params.springs[i]!;
    const a = params.particlesById.get(spring.source);
    const b = params.particlesById.get(spring.target);
    if (!a || !b) continue;
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    stress += Math.abs(dist - spring.restLength) / Math.max(1, spring.restLength);
    sampled += 1;
  }

  return {
    structuralStress: clamp(sampled > 0 ? stress / sampled : 0, 0, 2),
    semanticDensity: clamp(params.semantic.length / Math.max(1, params.particlesById.size * 12), 0, 1),
  };
}

type FieldHeartbeatSnapshot = {
  state: "resting" | "working" | "surge" | "strained";
  churnScore: number;
  motionEnergy: number;
  springStress: number;
  boundaryPressure: number;
  wakeHeat: number;
  queuePressure: number;
  stepMs: number;
  refreshMs: number;
  writeMs: number;
  embedEveryMs: number;
  simSubsteps: number;
  statusLine: string;
};

class FieldHeartbeatGovernor {
  private motionEnergy = 0;
  private springStress = 0;
  private boundaryPressure = 0;
  private wakeHeat = 0;
  private queuePressure = 0;
  private churnScore = 0;
  private state: FieldHeartbeatSnapshot["state"] = "working";

  constructor(private readonly config: {
    baseStepMs: number;
    baseRefreshMs: number;
    baseWriteMs: number;
    baseEmbedEveryMs: number;
    baseSimSubsteps: number;
    maxSimSubsteps: number;
  }) {}

  update(input: {
    motionEnergy: number;
    springStress: number;
    boundaryPressure: number;
    wakeHeat: number;
    queuePressure: number;
  }): FieldHeartbeatSnapshot {
    this.motionEnergy = (this.motionEnergy * 0.7) + (clamp(input.motionEnergy, 0, 2) * 0.3);
    this.springStress = (this.springStress * 0.76) + (clamp(input.springStress, 0, 2) * 0.24);
    this.boundaryPressure = (this.boundaryPressure * 0.8) + (clamp(input.boundaryPressure, 0, 1) * 0.2);
    this.wakeHeat = (this.wakeHeat * 0.65) + (clamp(input.wakeHeat, 0, 1) * 0.35);
    this.queuePressure = (this.queuePressure * 0.6) + (clamp(input.queuePressure, 0, 1) * 0.4);

    this.churnScore = clamp(
      (this.motionEnergy * 0.38)
      + (this.springStress * 0.26)
      + (this.boundaryPressure * 0.12)
      + (this.wakeHeat * 0.16)
      + (this.queuePressure * 0.08),
      0,
      1.8,
    );

    const strain = clamp(Math.max(this.queuePressure, this.boundaryPressure), 0, 1);
    if (strain >= 0.85) this.state = "strained";
    else if (this.churnScore >= 0.85) this.state = "surge";
    else if (this.churnScore >= 0.28) this.state = "working";
    else this.state = "resting";

    const normalizedChurn = clamp(this.churnScore, 0, 1);
    const pace = clamp(2.5 - (normalizedChurn * 2.2) + (strain * 1.6), 0.2, 4);
    const stepMs = Math.max(250, Math.round(this.config.baseStepMs * pace));
    const refreshMs = Math.max(1000, Math.round(this.config.baseRefreshMs * Math.max(0.35, pace * 0.8)));
    const writeMs = Math.max(15000, Math.round(this.config.baseWriteMs * Math.max(0.5, pace * 0.85)));
    const embedEveryMs = Math.max(1000, Math.round(this.config.baseEmbedEveryMs * Math.max(0.45, pace * 0.75)));
    const simSubsteps = Math.max(
      1,
      Math.min(this.config.maxSimSubsteps, Math.round(this.config.baseSimSubsteps + (normalizedChurn * (this.config.maxSimSubsteps - 1)))),
    );

    return {
      state: this.state,
      churnScore: round2(this.churnScore),
      motionEnergy: round2(this.motionEnergy),
      springStress: round2(this.springStress),
      boundaryPressure: round2(this.boundaryPressure),
      wakeHeat: round2(this.wakeHeat),
      queuePressure: round2(this.queuePressure),
      stepMs,
      refreshMs,
      writeMs,
      embedEveryMs,
      simSubsteps,
      statusLine: `state=${this.state} churn=${round2(this.churnScore)} motion=${round2(this.motionEnergy)} stress=${round2(this.springStress)} edgeBand=${round2(this.boundaryPressure)} wake=${round2(this.wakeHeat)} queue=${round2(this.queuePressure)} tick=${stepMs}ms refresh=${refreshMs}ms write=${writeMs}ms embed=${embedEveryMs}ms substeps=${simSubsteps}`,
    };
  }

  snapshot(): FieldHeartbeatSnapshot {
    return this.update({ motionEnergy: 0, springStress: 0, boundaryPressure: 0, wakeHeat: 0, queuePressure: 0 });
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

async function main(): Promise<void> {
  const workerRole = str("EROS_ERIS_WORKER_ROLE", "hybrid").toLowerCase();
  const graphqlUrl = str("GRAPHQL_URL", "http://127.0.0.1:8796/graphql");
  const adminToken = String(process.env.GRAPHQL_ADMIN_TOKEN || "").trim() || null;
  const openPlannerBaseUrl = String(process.env.OPENPLANNER_BASE_URL || "").trim();
  const openPlannerApiKey = String(process.env.OPENPLANNER_API_KEY || "").trim() || null;

  // Embedding model for OpenPlanner materialization (OpenPlanner owns all embedding generation)
  const embeddingModel = str("EMBED_PROVIDER_MODEL", "qwen3-embedding:0.6b");
  const embedContentMode = str("EMBED_CONTENT_MODE", "full").toLowerCase();
  const vexxBaseUrl = String(process.env.VEXX_BASE_URL || "").trim();
  const vexxApiKey = String(process.env.VEXX_API_KEY || "").trim() || undefined;
  const vexxDevice = str("VEXX_DEVICE", "AUTO") as VexxCosineConfig["device"];
  const vexxRequireAccel = /^(1|true|yes|on)$/i.test(String(process.env.VEXX_REQUIRE_ACCEL || ""));
  const vexxRequired = /^(1|true|yes|on)$/i.test(String(process.env.VEXX_ENFORCE || ""));
  const vexxMinCandidates = Math.max(1, Math.floor(num("VEXX_MIN_CANDIDATES", 64)));
  const vexxTimeoutMs = Math.max(1000, Math.floor(num("VEXX_TIMEOUT_MS", 30000)));
  const vexx: VexxCosineConfig | undefined = vexxBaseUrl
    ? {
        baseUrl: vexxBaseUrl,
        apiKey: vexxApiKey,
        device: vexxDevice,
        requireAccel: vexxRequireAccel,
        required: vexxRequired,
        minCandidates: vexxMinCandidates,
        timeoutMs: vexxTimeoutMs,
      }
    : undefined;

  const simMaxNodes = Math.floor(num("SIM_MAX_NODES", 6000));
  const simMaxEdges = Math.floor(num("SIM_MAX_EDGES", 12000));
  const baseStepMs = Math.floor(num("SIM_STEP_MS", 5000));
  const baseSimSubsteps = Math.max(1, Math.floor(num("SIM_SUBSTEPS", 1)));
  const simDt = clamp(num("SIM_DT", 0.18), 0.01, 0.5);

  // Global scaling knob to keep the field from thrashing.
  // Compose/env may set historically large force constants; this multiplier keeps motion granular.
  const forceScale = clamp(num("FORCE_SCALE", 0.35), 0.05, 5);
  const baseRefreshMs = Math.floor(num("SIM_REFRESH_MS", 30000));
  const baseWriteMs = Math.max(15000, Math.floor(num("SIM_WRITE_MS", 15000)));
  const writeChunk = Math.max(250, Math.min(2000, Math.floor(num("SIM_WRITE_CHUNK", 400))));
  const writePauseMs = Math.max(25, Math.floor(num("SIM_WRITE_PAUSE_MS", 200)));

  const baseEmbedEveryMs = Math.max(1000, Math.floor(num("EMBED_EVERY_MS", 5000)));
  const embedBatchSize = Math.max(1, Math.min(64, Math.floor(num("EMBED_BATCH_SIZE", 32))));
  const embedMaxInFlight = Math.max(1, Math.min(8, Math.floor(num("EMBED_MAX_IN_FLIGHT", 4))));
  const embedPreviewMaxBytes = Math.floor(num("EMBED_PREVIEW_MAX_BYTES", 40000));
  const embedMaxChars = Math.floor(num("EMBED_MAX_CHARS", 6000));
  const hydrateVisibleEmbeddings = !/^(0|false|no|off)$/i.test(String(process.env.HYDRATE_VISIBLE_EMBEDDINGS || "true"));
  const hydrateBatchSize = Math.max(64, Math.min(2000, Math.floor(num("HYDRATE_BATCH_SIZE", 1000))));
  const hydrateMaxBatchesPerRefresh = Math.max(1, Math.min(16, Math.floor(num("HYDRATE_MAX_BATCHES_PER_REFRESH", 4))));

  const semanticAttractAbove = clamp(num("SEMANTIC_ATTRACT_ABOVE", 0.82), -1, 1);
  const semanticRepelBelow = clamp(num("SEMANTIC_REPEL_BELOW", 0.04), -1, 1);
  const semanticSpatialOptimization = !/^(0|false|no|off)$/i.test(String(process.env.SEMANTIC_SPATIAL_OPTIMIZATION || "true"));
  const semanticMaxPeersPerCandidate = Math.max(32, Math.min(2048, Math.floor(num("SEMANTIC_MAX_PEERS_PER_CANDIDATE", 192))));
  const edgePullScale = num("EDGE_PULL_SCALE", 1.6) * forceScale;
  const edgeRestScale = clamp(num("EDGE_REST_SCALE", 0.9), 0.2, 2);
  const useCanonicalGraph = /^(1|true|yes|on)$/i.test(String(process.env.USE_CANONICAL_GRAPH || ""));
  const canonicalGraphRefreshMs = Math.max(1000, Math.floor(num("CANONICAL_GRAPH_REFRESH_MS", workerRole === "structural" ? 30000 : 300000)));
  const openPlannerStructuralEdgeLimit = Math.max(1000, Math.min(200000, Math.floor(num("OPENPLANNER_STRUCTURAL_EDGE_LIMIT", 50000))));
  const graphViewComponentCount = Math.max(1, Math.min(16, Math.floor(num("GRAPH_VIEW_COMPONENT_COUNT", 6))));
  const simShardCount = Math.max(1, Math.min(64, Math.floor(num("SIM_SHARD_COUNT", 1))));

  const resolveShardIndex = (): number => {
    const raw = String(process.env.SIM_SHARD_INDEX ?? "").trim();
    if (raw.length > 0) {
      return ((Math.floor(num("SIM_SHARD_INDEX", 0)) % simShardCount) + simShardCount) % simShardCount;
    }

    // If SIM_SHARD_INDEX isn't explicitly set, derive a stable shard index from
    // container hostname so docker compose --scale can be used without
    // defining N near-identical services.
    const hostname = String(process.env.HOSTNAME ?? "").trim();
    const digits = hostname.match(/(\d+)(?:\D*)$/)?.[1];
    if (digits) {
      const n = Number.parseInt(digits, 10);
      if (Number.isFinite(n)) return ((n % simShardCount) + simShardCount) % simShardCount;
    }

    // Fallback: very small hash.
    let acc = 0;
    for (let i = 0; i < hostname.length; i += 1) {
      acc = (acc * 31 + hostname.charCodeAt(i)) >>> 0;
    }
    return simShardCount > 0 ? acc % simShardCount : 0;
  };

  const simShardIndex = resolveShardIndex();

  healthSnapshot = {
    ...healthSnapshot,
    role: workerRole,
    shardIndex: simShardIndex,
    shardCount: simShardCount,
  };
  const graphViewRotationEvery = Math.max(1, Math.min(32, Math.floor(num("GRAPH_VIEW_ROTATION_EVERY", 2))));
  const refreshPhaseOffsetMs = Math.floor((simShardIndex * baseRefreshMs) / Math.max(1, simShardCount));
  const writePhaseOffsetMs = Math.floor((simShardIndex * baseWriteMs) / Math.max(1, simShardCount));
  const enableSimulation = workerRole !== "semantic";
  const enableLayoutWrites = workerRole !== "semantic";
  const enableSemanticPipeline = workerRole !== "structural";
  const enableVisibleEmbeddingHydration = enableSemanticPipeline && hydrateVisibleEmbeddings;
  const enableStructuralEdgeHydration = workerRole !== "semantic";
  const enableStructuralEdgeUpsert = workerRole !== "semantic";
  const enableCanonicalGraphRefresh = workerRole === "structural" && useCanonicalGraph;

  const fieldConfig: FieldConfig = {
    theta: clamp(num("BH_THETA", 0.8), 0.2, 1.6),

    // Repulsion / separation
    repulsionStrength: num("GLOBAL_REPULSION", num("REPULSION", 10)) * forceScale,
    localRepulsionRadius: num("LOCAL_REPULSION_RADIUS", 70),
    localRepulsionStrength: num("LOCAL_REPULSION", 1800) * forceScale,
    localRepulsionPower: num("LOCAL_REPULSION_POWER", 4),
    softening: num("SOFTENING", 12),

    // Damping / velocity caps
    damping: clamp(num("DAMPING", 0.92), 0, 1),
    maxSpeed: num("MAX_SPEED", 60) * Math.sqrt(forceScale),

    minSeparation: num("MIN_SEPARATION", 14),
    separationStrength: num("SEPARATION", 1400) * forceScale,

    // Semantic forces
    semanticAttractAbove,
    semanticRepelBelow,
    semanticAttractStrength: num("SEMANTIC_ATTRACT", 0.055) * forceScale,
    semanticRepelStrength: num("SEMANTIC_REPEL", 600) * forceScale,
    semanticRepelRadius: num("SEMANTIC_REPEL_RADIUS", 120),
    semanticRestLength: num("SEMANTIC_REST", 42),
    semanticBreakDistance: num("SEMANTIC_BREAK_DISTANCE", 280),

    targetRadius: num("TARGET_RADIUS", 7000),

    boundaryThickness: num("BOUNDARY_THICKNESS", 900),
    boundaryPressure: num("BOUNDARY_PRESSURE", 35) * forceScale,
    boundaryEdgeFraction: clamp(num("BOUNDARY_EDGE_FRACTION", 0.04), 0.01, 0.5),
  };

  // simulation state
  const particlesById = new Map<string, Particle>();
  const nodeMetaById = new Map<string, { lake: string; nodeType: string }>();
  let springs: SpringEdge[] = [];
  let antTrailEdges: SpringEdge[] = [];
  let currentViewNodes: GraphViewNode[] = [];
  let currentViewEdgeCount = 0;
  let lastViewMeta: Record<string, unknown> | null = null;
  let currentDegrees = new Map<string, number>();
  let refreshInFlight: Promise<void> | null = null;
  let writeInFlight: Promise<void> | null = null;

  const embeddings = new Map<string, number[]>();
  const semanticPairs = new Map<string, SemanticEdge>();

  const enableAntSystem = !/^(0|false|no)$/i.test(String(process.env.EROS_ERIS_ANT_SYSTEM ?? "true"));
  const antSystem = enableAntSystem
    ? new GraphAntSystem({
        antCount: Math.max(1, Math.floor(num("ANT_COUNT", 16))),
        stepsPerTick: Math.max(1, Math.floor(num("ANT_STEPS_PER_TICK", 8))),
        depositRate: num("ANT_DEPOSIT_RATE", 0.35),
        evaporationRate: num("ANT_EVAPORATION_RATE", 0.02),
        alpha: num("ANT_ALPHA", 1.2),
        beta: num("ANT_BETA", 3.0),
        revisitPenalty: num("ANT_REVISIT_PENALTY", 0.3),
        forceScale: num("ANT_FORCE_SCALE", 0.06) * forceScale,
        maxPheromone: num("ANT_MAX_PHEROMONE", 8),
      })
    : null;

  const heartbeatGovernor = new FieldHeartbeatGovernor({
    baseStepMs,
    baseRefreshMs,
    baseWriteMs,
    baseEmbedEveryMs,
    baseSimSubsteps,
    maxSimSubsteps: Math.max(baseSimSubsteps, Math.floor(num("SIM_SUBSTEPS_MAX", Math.max(4, baseSimSubsteps * 4)))),
  });
  let heartbeat = heartbeatGovernor.snapshot();
  let lastHeartbeatState = heartbeat.state;

  let lastRefresh = Date.now() - heartbeat.refreshMs + refreshPhaseOffsetMs;
  let lastWrite = Date.now() - heartbeat.writeMs + writePhaseOffsetMs;
  let lastEmbed = 0;
  let lastCanonicalGraph = 0;
  let currentCanonicalGraphVersion: string | null = null;
  let graphViewRefreshCount = 0;
  let lastSimulationAt = 0;

  // Background embed pipeline state
  const embedInFlight = new Set<Promise<void>>();
  const claimedEmbeddingIds = new Set<string>();
  let hydrateInFlight: Promise<void> | null = null;

  // eslint-disable-next-line no-console
  console.log(
    `[eros-eris] starting · role=${workerRole} · graphql=${graphqlUrl} · openplanner=${openPlannerBaseUrl || "off"} · embeddingModel=${embeddingModel} · vexx=${vexxBaseUrl || "off"} device=${vexx?.device ?? "local"} · shard=${simShardIndex}/${simShardCount} rotationEvery=${graphViewRotationEvery} components=${graphViewComponentCount} refreshPhase=${refreshPhaseOffsetMs}ms writePhase=${writePhaseOffsetMs}ms · writeMs=${baseWriteMs} chunk=${writeChunk} pause=${writePauseMs} · embedEveryMs=${baseEmbedEveryMs} batch=${embedBatchSize} inFlight=${embedMaxInFlight}`,
  );

  // Background embed worker - runs independently of main loop
  async function runEmbedBatch(batch: Array<{ id: string; vec: number[] }>, timings?: { embedMs?: number }): Promise<void> {
    if (batch.length === 0) return;
    const embedMs = timings?.embedMs ?? 0;
    const fresh = batch.map((b) => ({ id: b.id, vec: b.vec }));
    const existingPeers = [...embeddings.entries()].map(([id, embedding]) => ({
      id,
      embedding,
      x: particlesById.get(id)?.x,
      y: particlesById.get(id)?.y,
    }));
    const freshPeers = fresh.map((r) => ({
      id: r.id,
      embedding: r.vec,
      x: particlesById.get(r.id)?.x,
      y: particlesById.get(r.id)?.y,
    }));

    const semanticStart = Date.now();
    const semanticEdges = await buildSemanticEdgesForCandidates({
      candidates: freshPeers,
      peers: [...existingPeers, ...freshPeers],
      selection: {
        attractAbove: semanticAttractAbove,
        repelBelow: semanticRepelBelow,
        topK: Math.floor(num("SEMANTIC_TOP_K", 24)),
        bottomK: Math.floor(num("SEMANTIC_BOTTOM_K", 2)),
        useSpatialOptimization: semanticSpatialOptimization,
        maxPeersPerCandidate: semanticMaxPeersPerCandidate,
        vexx,
      },
    });
    const semanticMs = Date.now() - semanticStart;

    for (const r of fresh) embeddings.set(r.id, r.vec);
    for (const e of semanticEdges) {
      const key = e.a < e.b ? `${e.a}||${e.b}` : `${e.b}||${e.a}`;
      semanticPairs.set(key, e);
    }

    // Persist semantic force samples to OpenPlanner (layout force cache, not graph truth)
    if (openPlannerBaseUrl && semanticEdges.length > 0) {
      try {
        const upsertStart = Date.now();
        const stored = await upsertOpenPlannerSemanticEdges({
          openPlannerBaseUrl,
          openPlannerApiKey,
          edges: semanticEdges,
          embeddingModel,
        });
        if (stored > 0) {
          // eslint-disable-next-line no-console
          console.log(`[eros-eris] persisted ${stored} semantic force samples to openplanner upsertMs=${Date.now() - upsertStart}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // eslint-disable-next-line no-console
        console.warn(`[eros-eris] semantic force sample persist failed: ${message}`);
      }
    }

    // eslint-disable-next-line no-console
    console.log(
      `[eros-eris] embedded batch=${fresh.length} peers=${existingPeers.length} newEdges=${semanticEdges.length} semanticPairs=${semanticPairs.size} nodes=${particlesById.size} embedMs=${embedMs} semanticMs=${semanticMs}`,
    );
  }

  // Run forever.
  for (;;) {
    const now = Date.now();

    healthSnapshot = {
      ...healthSnapshot,
      ok: true,
      lastLoopAt: new Date(now).toISOString(),
      lastRefreshAt: lastRefresh ? new Date(lastRefresh).toISOString() : null,
      lastWriteAt: lastWrite ? new Date(lastWrite).toISOString() : null,
      viewNodes: currentViewNodes.length,
      viewEdges: currentViewEdgeCount,
      springs: springs.length,
      semanticPairs: semanticPairs.size,
      particles: particlesById.size,
      embeddingsCached: embeddings.size,
      refreshCount: graphViewRefreshCount,
      viewMeta: lastViewMeta,
      inFlight: {
        refresh: Boolean(refreshInFlight),
        write: Boolean(writeInFlight),
        hydrate: Boolean(hydrateInFlight),
        embed: embedInFlight.size,
      },
      heartbeat: heartbeat.statusLine,
    };

    if (now - lastRefresh >= heartbeat.refreshMs && !refreshInFlight) {
      refreshInFlight = (async () => {
        const refreshStartedAt = Date.now();
        const viewStart = Date.now();
        const rotationCursor = Math.floor(graphViewRefreshCount / graphViewRotationEvery);
        const view = openPlannerBaseUrl
          ? await fetchOpenPlannerGraphView({
              openPlannerBaseUrl,
              openPlannerApiKey,
              maxNodes: simMaxNodes,
              maxEdges: simMaxEdges,
              componentCount: graphViewComponentCount,
              shardIndex: simShardIndex,
              shardCount: simShardCount,
              rotationCursor,
            })
          : await fetchGraphView({
              graphqlUrl,
              adminToken,
              maxNodes: simMaxNodes,
              maxEdges: simMaxEdges,
            });
        const viewMs = Date.now() - viewStart;

        const present = new Set<string>();
        for (const n of view.nodes) {
          present.add(n.id);
          nodeMetaById.set(n.id, { lake: inferLake(n), nodeType: inferNodeType(n) });
          const p = particlesById.get(n.id);
          if (!p) {
            const created = { id: n.id, x: n.x, y: n.y, vx: 0, vy: 0, mass: 1 } satisfies Particle;
            nudgeInsideBoundary(created, fieldConfig.targetRadius, fieldConfig.boundaryThickness);
            particlesById.set(n.id, created);
          } else {
            p.x = Number.isFinite(p.x) ? p.x : n.x;
            p.y = Number.isFinite(p.y) ? p.y : n.y;
          }
        }

        for (const id of [...particlesById.keys()]) {
          if (!present.has(id)) {
            particlesById.delete(id);
            nodeMetaById.delete(id);
            for (const key of [...semanticPairs.keys()]) {
              if (key.startsWith(`${id}||`) || key.endsWith(`||${id}`)) {
                semanticPairs.delete(key);
              }
            }
          }
        }

        let structuralEdges = view.edges;
        if (enableStructuralEdgeHydration && openPlannerBaseUrl && view.nodes.length > 0) {
          try {
            const openPlannerEdges = await fetchOpenPlannerStructuralEdges({
              openPlannerBaseUrl,
              openPlannerApiKey,
              nodeIds: view.nodes.map((node) => node.id),
              limit: openPlannerStructuralEdgeLimit,
            });
            if (openPlannerEdges.length > 0) structuralEdges = openPlannerEdges;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn(`[eros-eris] structural edge hydrate failed: ${message}`);
          }
        }

        const degrees = new Map<string, number>();
        for (const e of structuralEdges) {
          degrees.set(e.source, (degrees.get(e.source) ?? 0) + 1);
          degrees.set(e.target, (degrees.get(e.target) ?? 0) + 1);
        }

        const nodeSet = new Set(view.nodes.map((n) => n.id));
        springs = structuralEdges
          .filter((e) => nodeSet.has(e.source) && nodeSet.has(e.target))
          .map((e) => {
            const prof = springProfile(e.kind);
            return {
              source: e.source,
              target: e.target,
              kind: e.kind,
              strength: prof.strength * edgePullScale,
              restLength: prof.restLength * edgeRestScale,
            } satisfies SpringEdge;
          });

        if (antSystem) antSystem.updateGraph(springs);

        currentViewNodes = view.nodes;
        currentViewEdgeCount = view.edges.length;
        lastViewMeta = view.meta as unknown as Record<string, unknown>;
        currentDegrees = degrees;

        if (enableVisibleEmbeddingHydration && openPlannerBaseUrl && !hydrateInFlight) {
          const visibleIds = view.nodes.map((n) => n.id).filter((id) => !embeddings.has(id));
          if (visibleIds.length > 0) {
            const idsToHydrate = visibleIds.slice(0, hydrateBatchSize * hydrateMaxBatchesPerRefresh);
            hydrateInFlight = (async () => {
              let fetched = 0;
              let newlyCached = 0;
              for (let i = 0; i < idsToHydrate.length; i += hydrateBatchSize) {
                const chunkIds = idsToHydrate.slice(i, i + hydrateBatchSize);
                const rows = await fetchOpenPlannerNodeEmbeddings({
                  openPlannerBaseUrl,
                  openPlannerApiKey,
                  ids: chunkIds,
                  eventIds: [],
                  model: embeddingModel,
                });
                fetched += rows.length;
                for (const row of rows) {
                  if (!embeddings.has(row.id)) newlyCached += 1;
                  embeddings.set(row.id, row.embedding);
                }
              }
              if (fetched > 0) {
                console.log(`[eros-eris] hydrated visible embeddings fetched=${fetched} newlyCached=${newlyCached} cached=${embeddings.size}/${view.nodes.length}`);
              }
            })()
              .catch((error) => {
                const message = error instanceof Error ? error.message : String(error);
                console.warn(`[eros-eris] visible embedding hydrate failed: ${message}`);
              })
              .finally(() => {
                hydrateInFlight = null;
              });
          }
        }

        if (enableStructuralEdgeUpsert && openPlannerBaseUrl && view.edges.length > 0) {
          try {
            const edgeStart = Date.now();
            const stored = await upsertOpenPlannerEdges({
              openPlannerBaseUrl,
              openPlannerApiKey,
              edges: view.edges.map((e) => ({
                source: e.source,
                target: e.target,
                kind: e.kind,
                data: e.dataJson ? JSON.parse(e.dataJson) : undefined,
              })),
            });
            if (stored > 0) {
              console.log(`[eros-eris] persisted ${stored} edges to openplanner edgeMs=${Date.now() - edgeStart}`);
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn(`[eros-eris] edge persist failed: ${message}`);
          }
        }

        console.log(
          `[eros-eris] refresh shard=${simShardIndex}/${simShardCount} cursor=${rotationCursor} used=${String((view.meta as Record<string, unknown>)?.rotationCursorUsed ?? rotationCursor)} viewNodes=${view.nodes.length}/${view.meta.totalNodes} viewEdges=${view.edges.length}/${view.meta.totalEdges} structuralEdges=${structuralEdges.length} springs=${springs.length} fetchMs=${viewMs}`,
        );

        if (enableCanonicalGraphRefresh && openPlannerBaseUrl && refreshStartedAt - lastCanonicalGraph >= canonicalGraphRefreshMs) {
          try {
            const canonicalStart = Date.now();
            const canonicalEdges = await fetchCanonicalSemanticEdges({
              openPlannerBaseUrl,
              openPlannerApiKey,
              nodeIds: present,
            });
            for (const e of canonicalEdges) {
              const key = e.a < e.b ? `${e.a}||${e.b}` : `${e.b}||${e.a}`;
              semanticPairs.set(key, e);
            }
            console.log(
              `[eros-eris] canonical graph loaded canonicalEdges=${canonicalEdges.length} totalSemanticPairs=${semanticPairs.size} canonicalMs=${Date.now() - canonicalStart}`,
            );
            lastCanonicalGraph = Date.now();
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn(`[eros-eris] canonical graph load failed: ${message}`);
          }
        }

        lastRefresh = Date.now();
        graphViewRefreshCount += 1;
      })()
        .catch((error) => {
          const message = error instanceof Error ? error.message : String(error);
          setHealthError(message);
          console.warn(`[eros-eris] refresh failed: ${message}`);
        })
        .finally(() => {
          refreshInFlight = null;
        });
    }

    // --- queue embed candidates (non-blocking)
    if (enableSemanticPipeline && now - lastEmbed >= heartbeat.embedEveryMs && currentViewNodes.length > 0 && embedInFlight.size < embedMaxInFlight) {
      const candidates = pickEmbedCandidates({
        nodes: currentViewNodes,
        degrees: currentDegrees,
        embedded: new Set([...embeddings.keys(), ...claimedEmbeddingIds]),
        limit: embedBatchSize,
      });

      if (candidates.length > 0) {
        lastEmbed = now;
        const candidateIds = candidates.map((candidate) => candidate.id);
        for (const id of candidateIds) claimedEmbeddingIds.add(id);
        // eslint-disable-next-line no-console
        console.log(`[eros-eris] embedding dispatch batch=${candidates.length} inFlight=${embedInFlight.size + 1}/${embedMaxInFlight}`);
        const embeddingStart = Date.now();
        const candidateEventIds = candidates
          .map((candidate) => {
            const data = parseJson(candidate.dataJson);
            return typeof data?.event_id === "string" ? data.event_id : "";
          })
          .filter(Boolean);

        const embeddingPromise = openPlannerBaseUrl
          ? fetchOpenPlannerNodeEmbeddings({
              openPlannerBaseUrl,
              openPlannerApiKey,
              ids: candidates.map((c) => c.id),
              eventIds: candidateEventIds,
              model: embeddingModel,
            })
          : Promise.resolve([] as GraphNodeEmbeddingRow[]);

        const task = embeddingPromise
          .then(async (rows) => {
            const openPlannerReady = rows.map((row) => ({ id: row.id, vec: row.embedding }));
            const openPlannerIds = new Set(openPlannerReady.map((row) => row.id));
            const missingCandidates = candidates.filter((candidate) => !openPlannerIds.has(candidate.id));
            const openPlannerEmbedMs = rows.length > 0 ? (Date.now() - embeddingStart) : 0;
            if (rows.length > 0) {
              // eslint-disable-next-line no-console
              console.log(`[eros-eris] openplanner embeddings batch=${rows.length} missing=${missingCandidates.length} embedMs=${openPlannerEmbedMs}`);
            }

            if (missingCandidates.length === 0) {
              return {
                mode: "openplanner" as const,
                ready: openPlannerReady,
                embedMs: openPlannerEmbedMs,
              };
            }

            const previewStart = Date.now();
            const previews = await fetchNodePreviews({
              graphqlUrl,
              adminToken,
              ids: missingCandidates.map((c) => c.id),
              maxBytes: embedPreviewMaxBytes,
            });
            const docs: Array<{ id: string; doc: string; input: MaterializeGraphNodeEmbeddingInput }> = [];
            for (let i = 0; i < missingCandidates.length; i++) {
              const candidate = missingCandidates[i]!;
              const preview = previews[i] ?? null;
              const data = parseJson(candidate.dataJson);
              const header = [candidate.kind, candidate.label, data?.path, data?.url, data?.dep]
                .filter((x) => typeof x === "string" && x.trim())
                .join("\n");
              let body = "";
              if (preview?.body) {
                body = preview.format === "html" ? stripHtml(preview.body) : preview.body;
              }
              docs.push({
                id: candidate.id,
                doc: normalizeTextForEmbedding(`${header}\n\n${body}`, embedMaxChars),
                input: {
                  id: candidate.id,
                  body: normalizeTextForEmbedding(body || header || candidate.id, embedMaxChars),
                  sourceEventId: typeof data?.event_id === "string" ? data.event_id : null,
                },
              });
            }
            const previewMs = Date.now() - previewStart;
            // eslint-disable-next-line no-console
            console.log(`[eros-eris] preview batch=${docs.length} previewMs=${previewMs}`);

            let canonicalMaterialized: Array<{ id: string; vec: number[] }> = [];
            if (openPlannerBaseUrl && docs.length > 0) {
              try {
                const materializeStart = Date.now();
                const rows = await materializeOpenPlannerNodeEmbeddings({
                  openPlannerBaseUrl,
                  openPlannerApiKey,
                  inputs: docs.map((doc) => doc.input),
                  model: embeddingModel,
                });
                canonicalMaterialized = rows.map((row) => ({ id: row.id, vec: row.embedding }));
                // eslint-disable-next-line no-console
                console.log(`[eros-eris] openplanner materialized batch=${rows.length} missing=${Math.max(0, docs.length - rows.length)} embedMs=${Date.now() - materializeStart}`);
              } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                // eslint-disable-next-line no-console
                console.warn(`[eros-eris] openplanner materialize failed: ${message}`);
              }
            }

            const canonicalIds = new Set(canonicalMaterialized.map((row) => row.id));
            const stillMissing = docs.filter((doc) => !canonicalIds.has(doc.id)).length;

            // OpenPlanner owns all embedding generation - no local fallback.
            // Missing embeddings will be picked up in future cycles when OpenPlanner's
            // background embedding pipeline processes them.
            if (stillMissing > 0) {
              // eslint-disable-next-line no-console
              console.log(`[eros-eris] ${stillMissing} nodes still missing embeddings - will retry next cycle`);
            }

            return {
              mode: rows.length > 0 ? ("hybrid" as const) : ("openplanner" as const),
              ready: [...openPlannerReady, ...canonicalMaterialized],
              embedMs: Date.now() - embeddingStart,
            };
          })
          .then(async (ready) => {
            if (ready.ready.length > 0) {
              await runEmbedBatch(ready.ready, { embedMs: ready.embedMs });
            }
          })
          .catch((err) => {
            const msg = err instanceof Error ? err.message : String(err);
            setHealthError(msg);
            // eslint-disable-next-line no-console
            console.warn(`[eros-eris] embedding refresh failed: ${msg}`);
          })
          .finally(() => {
            for (const id of candidateIds) claimedEmbeddingIds.delete(id);
            embedInFlight.delete(task);
          });
        embedInFlight.add(task);
      } else {
        lastEmbed = now;
      }
    }

    // --- simulate one or more substeps
    const particles = [...particlesById.values()];
    const semantic = [...semanticPairs.values()];
    const shouldSimulate = enableSimulation && now - lastSimulationAt >= heartbeat.stepMs;
    if (shouldSimulate) {
      if (antSystem) {
        const trails = antSystem.tick();
        antTrailEdges = trails.map((t) => ({
          source: t.source,
          target: t.target,
          strength: t.strength,
          restLength: t.restLength,
        }));
      }
      const allSprings = [...springs, ...antTrailEdges];
      // IMPORTANT: simDt is the total integration horizon per tick.
      // Substeps should improve stability (smaller dt per substep), NOT multiply total motion.
      const dtPerSubstep = simDt / Math.max(1, heartbeat.simSubsteps);
      for (let i = 0; i < heartbeat.simSubsteps; i += 1) {
        stepField({ particles, dt: dtPerSubstep, config: fieldConfig, springs: allSprings, semantic });
        applyLakeBands({ particles, nodesById: nodeMetaById, dt: dtPerSubstep });
      }
      lastSimulationAt = now;
    }

    // --- write positions back (slow, chunked)
    if (enableLayoutWrites && particles.length > 0 && now - lastWrite >= heartbeat.writeMs && !writeInFlight) {
      const inputs = particles.map((p) => ({ id: p.id, x: p.x, y: p.y }));
      const semanticCount = semantic.length;
      const springCount = springs.length;
      writeInFlight = (async () => {
        const writeStart = Date.now();
        try {
          let total = 0;
          try {
            total = await layoutUpsertPositions({ graphqlUrl, adminToken, inputs });
          } catch {
            for (let i = 0; i < inputs.length; i += writeChunk) {
              const chunk = inputs.slice(i, i + writeChunk);
              const n = await layoutUpsertPositions({ graphqlUrl, adminToken, inputs: chunk });
              total += n;
              if (writePauseMs > 0) await sleep(writePauseMs);
            }
          }
          const stats = summarizeField({
            particles,
            targetRadius: fieldConfig.targetRadius,
            boundaryThickness: fieldConfig.boundaryThickness,
          });
          const antStats = antSystem ? antSystem.stats() : null;
          console.log(
            `[eros-eris] wrote positions: ${total} nodes · radius p50=${stats.p50.toFixed(0)} p90=${stats.p90.toFixed(0)} p99=${stats.p99.toFixed(0)} max=${stats.max.toFixed(0)} mean=${stats.mean.toFixed(0)} edgeBand=${(stats.edgeBandFraction * 100).toFixed(1)}% semanticPairs=${semanticCount} springs=${springCount}${antStats ? ` ants=${antStats.antCount} antEdges=${antStats.edgeCount} avgPh=${antStats.avgPheromone.toFixed(2)}` : ""} writeMs=${Date.now() - writeStart}`,
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          setHealthError(message);
          console.warn(`[eros-eris] layout write failed: ${message}`);
        }
        lastWrite = Date.now();
      })().finally(() => {
        writeInFlight = null;
      });
    }

    const fieldStats = summarizeField({
      particles,
      targetRadius: fieldConfig.targetRadius,
      boundaryThickness: fieldConfig.boundaryThickness,
    });
    const motionStats = summarizeMotion({ particles, maxSpeed: fieldConfig.maxSpeed });
    const stressStats = summarizeSpringStress({ particlesById, springs: [...springs, ...antTrailEdges], semantic });
    const antStats = antSystem?.stats() ?? null;
    const wakeHeat = antStats ? clamp(antStats.avgPheromone / Math.max(1, num("ANT_MAX_PHEROMONE", 8)), 0, 1) : 0;
    const queuePressure = clamp(
      Math.max(
        embedInFlight.size / Math.max(1, embedMaxInFlight),
        refreshInFlight ? 1 : 0,
        writeInFlight ? 1 : 0,
        hydrateInFlight ? 0.5 : 0,
      ),
      0,
      1,
    );
    heartbeat = heartbeatGovernor.update({
      motionEnergy: motionStats.energy,
      springStress: stressStats.structuralStress + (stressStats.semanticDensity * 0.15),
      boundaryPressure: fieldStats.edgeBandFraction,
      wakeHeat,
      queuePressure,
    });

    if (heartbeat.state !== lastHeartbeatState) {
      console.log(`[eros-eris] heartbeat ${heartbeat.statusLine}`);
      lastHeartbeatState = heartbeat.state;
    }

    // Yield to event loop briefly so background promises can progress without busy-spinning.
    await sleep(Math.min(heartbeat.stepMs, 50));
  }
}

startHealthServer();
void main();

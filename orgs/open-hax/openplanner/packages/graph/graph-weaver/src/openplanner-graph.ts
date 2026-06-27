import type { GraphEdge, GraphNode } from "./graph.js";
import { GraphStore } from "./store.js";

type ExportNode = {
  id: string;
  kind: string;
  label: string;
  lake?: string;
  nodeType?: string;
  x?: number;
  y?: number;
  data?: Record<string, unknown>;
};

type ExportEdge = {
  id: string;
  source: string;
  target: string;
  kind: string;
  lake?: string;
  edgeType?: string;
  sourceLake?: string;
  targetLake?: string;
  data?: Record<string, unknown>;
};

type ExportPayload = {
  ok: boolean;
  nodes?: ExportNode[];
  edges?: ExportEdge[];
};

function trimBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function authHeaders(apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (apiKey && apiKey.trim()) {
    headers.authorization = `Bearer ${apiKey.trim()}`;
  }
  return headers;
}

async function fetchJson<T>(url: string, apiKey?: string): Promise<T> {
  const response = await fetch(url, { headers: authHeaders(apiKey) });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`OpenPlanner graph export failed ${response.status} ${response.statusText}: ${text}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`OpenPlanner graph export returned invalid JSON: ${message}`);
  }
}

export async function rebuildOpenPlannerGraph(params: {
  openPlannerBaseUrl: string;
  openPlannerApiKey?: string;
  store: GraphStore;
  projects?: string[];
  includeSemantic?: boolean;
  semanticMinSimilarity?: number;
  maxNodes?: number;
  maxEdges?: number;
  maxSemanticEdges?: number;
}): Promise<{ seeds: string[] }> {
  const baseUrl = trimBaseUrl(params.openPlannerBaseUrl || "");
  if (!baseUrl) {
    throw new Error("GRAPH_WEAVER_LOCAL_SOURCE=openplanner-graph requires OPENPLANNER_BASE_URL");
  }

  const projects = (params.projects ?? ["devel", "web", "bluesky"]).filter(Boolean);
  const qs = new URLSearchParams();
  if (projects.length > 0) qs.set("projects", projects.join(","));
  qs.set("includeLayout", "true");
  if (params.includeSemantic) {
    qs.set("includeSemantic", "true");
    if (typeof params.semanticMinSimilarity === "number") {
      qs.set("semanticMinSimilarity", String(params.semanticMinSimilarity));
    }
  }
  if (typeof params.maxNodes === "number") qs.set("maxNodes", String(Math.max(100, Math.floor(params.maxNodes))));
  if (typeof params.maxEdges === "number") qs.set("maxEdges", String(Math.max(100, Math.floor(params.maxEdges))));
  if (typeof params.maxSemanticEdges === "number") qs.set("maxSemanticEdges", String(Math.max(0, Math.floor(params.maxSemanticEdges))));
  const query = `?${qs.toString()}`;
  const payload = await fetchJson<ExportPayload>(`${baseUrl}/v1/graph/export${query}`, params.openPlannerApiKey);

  const nodes = Array.isArray(payload.nodes) ? payload.nodes : [];
  const edges = Array.isArray(payload.edges) ? payload.edges : [];

  for (const node of nodes) {
    const hasExportedPosition = typeof node.x === "number" && Number.isFinite(node.x) && typeof node.y === "number" && Number.isFinite(node.y);
    const data = {
      ...(node.data ?? {}),
      lake: node.lake ?? (node.data as any)?.lake,
      node_type: node.nodeType ?? (node.data as any)?.node_type,
      ...(hasExportedPosition ? { pos: { x: node.x, y: node.y } } : {}),
    } as Record<string, unknown>;

    const graphNode: GraphNode = {
      id: node.id,
      kind: node.kind,
      label: node.label,
      external: node.lake !== "devel",
      loadedByDefault: true,
      layer: "local",
      path: typeof data.path === "string" ? data.path : undefined,
      url: typeof data.url === "string" ? data.url : undefined,
      data,
    };
    params.store.upsertNode(graphNode);
  }

  for (const edge of edges) {
    const data = {
      ...(edge.data ?? {}),
      lake: edge.lake ?? (edge.data as any)?.lake,
      edge_type: edge.edgeType ?? (edge.data as any)?.edge_type,
      source_lake: edge.sourceLake ?? (edge.data as any)?.source_lake,
      target_lake: edge.targetLake ?? (edge.data as any)?.target_lake,
    } as Record<string, unknown>;

    const isSemantic = edge.lake === "semantic" || edge.kind === "semantic_knn" || edge.kind === "semantic_similarity";
    const graphEdge: GraphEdge = {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      kind: edge.kind,
      layer: isSemantic ? "semantic" : "local",
      data,
    };
    params.store.upsertEdge(graphEdge);
  }

  return { seeds: [] };
}

export async function upsertOpenPlannerGraphLayout(params: {
  openPlannerBaseUrl: string;
  openPlannerApiKey?: string;
  source?: string;
  layoutVersion?: string;
  inputs: Array<{ id: string; x: number; y: number }>;
}): Promise<number> {
  const baseUrl = trimBaseUrl(params.openPlannerBaseUrl || "");
  if (!baseUrl) {
    throw new Error("GRAPH_WEAVER_PERSISTENCE_MODE=openplanner requires OPENPLANNER_BASE_URL");
  }

  const response = await fetch(`${baseUrl}/v1/graph/layout/upsert`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...authHeaders(params.openPlannerApiKey),
    },
    body: JSON.stringify({
      source: params.source ?? "graph-weaver",
      layoutVersion: params.layoutVersion ?? "v1",
      inputs: params.inputs,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`OpenPlanner layout upsert failed ${response.status} ${response.statusText}: ${text}`);
  }

  try {
    const payload = JSON.parse(text) as { stored?: unknown; validated?: unknown };
    if (typeof payload.stored === "number") return payload.stored;
    if (typeof payload.validated === "number") return payload.validated;
    return params.inputs.length;
  } catch {
    return params.inputs.length;
  }
}

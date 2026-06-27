export interface GraphWorkbenchConfig {
  baseUrl: string;
  adminToken?: string;
  fetch?: typeof fetch;
}

export interface GraphWorkbenchStatus {
  nodes: number;
  edges: number;
  seeds: number;
  weaver: { frontier: number; inFlight: number };
  render: { maxRenderNodes: number; maxRenderEdges: number };
  scan: { maxFileBytes: number; rescanIntervalMs: number };
}

export interface GraphWorkbenchNode {
  id: string;
  kind: string;
  label: string;
  external: boolean;
  loadedByDefault: boolean;
  layer: string;
  data?: Record<string, unknown>;
}

export interface GraphWorkbenchEdge {
  source: string;
  target: string;
  kind: string;
  layer: string;
  data?: Record<string, unknown>;
}

export interface GraphWorkbenchGraphView {
  nodes: Array<GraphWorkbenchNode & { x: number; y: number }>;
  edges: GraphWorkbenchEdge[];
  meta: {
    totalNodes: number;
    totalEdges: number;
    sampledNodes: boolean;
    sampledEdges: boolean;
  };
}

export interface GraphWorkbenchNodePreview {
  id: string;
  kind: string;
  format: string;
  contentType: string;
  language?: string | null;
  body?: string | null;
  truncated: boolean;
  bytes: number;
  status?: number;
  error?: string;
}

export interface GraphWorkbenchClient {
  status(): Promise<GraphWorkbenchStatus>;
  searchNodes(query: string, limit?: number): Promise<GraphWorkbenchNode[]>;
  neighbors(id: string, options?: { direction?: "in" | "out" | "both"; kind?: string; limit?: number }): Promise<GraphWorkbenchNode[]>;
  nodePreview(id: string, maxBytes?: number): Promise<GraphWorkbenchNodePreview | null>;
  graphView(options?: { maxNodes?: number; maxEdges?: number }): Promise<GraphWorkbenchGraphView>;
}

type GraphQlEnvelope<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

function defaultBaseUrl(): string {
  return process.env.GRAPH_WORKBENCH_BASE_URL
    ?? process.env.GRAPH_WEAVER_BASE_URL
    ?? process.env.GRAPH_WEAVER_URL
    ?? "http://127.0.0.1:8796";
}

export function createDefaultGraphWorkbenchConfig(): GraphWorkbenchConfig {
  return {
    baseUrl: defaultBaseUrl(),
    adminToken: process.env.GRAPH_WORKBENCH_ADMIN_TOKEN
      ?? process.env.GRAPH_WEAVER_ADMIN_TOKEN
      ?? undefined,
    fetch: globalThis.fetch,
  };
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function parseDataJson(value: unknown): Record<string, unknown> | undefined {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : { value: parsed };
  } catch {
    return undefined;
  }
}

function toNode(node: Record<string, unknown>): GraphWorkbenchNode {
  return {
    id: String(node.id ?? ""),
    kind: String(node.kind ?? "node"),
    label: String(node.label ?? node.id ?? ""),
    external: Boolean(node.external),
    loadedByDefault: Boolean(node.loadedByDefault),
    layer: String(node.layer ?? ""),
    data: parseDataJson(node.dataJson),
  };
}

function toEdge(edge: Record<string, unknown>): GraphWorkbenchEdge {
  return {
    source: String(edge.source ?? ""),
    target: String(edge.target ?? ""),
    kind: String(edge.kind ?? "edge"),
    layer: String(edge.layer ?? ""),
    data: parseDataJson(edge.dataJson),
  };
}

export class GraphWeaverWorkbenchClient implements GraphWorkbenchClient {
  private readonly config: GraphWorkbenchConfig;

  constructor(config: Partial<GraphWorkbenchConfig> = {}) {
    this.config = {
      ...createDefaultGraphWorkbenchConfig(),
      ...config,
    };
  }

  private get endpoint(): string {
    return `${trimTrailingSlash(this.config.baseUrl)}/graphql`;
  }

  private async query<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const fetchImpl = this.config.fetch ?? globalThis.fetch;
    if (!fetchImpl) throw new Error("Fetch implementation is not available");

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.config.adminToken?.trim()) {
      headers.Authorization = `Bearer ${this.config.adminToken.trim()}`;
    }

    const response = await fetchImpl(this.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Graph workbench request failed (${response.status}): ${text}`);
    }

    let payload: GraphQlEnvelope<T>;
    try {
      payload = JSON.parse(text) as GraphQlEnvelope<T>;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Graph workbench returned invalid JSON: ${message}`);
    }

    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
      throw new Error(payload.errors.map((entry) => entry.message || "unknown graphql error").join("; "));
    }
    if (!payload.data) {
      throw new Error("Graph workbench returned no data");
    }
    return payload.data;
  }

  async status(): Promise<GraphWorkbenchStatus> {
    const data = await this.query<{ status: GraphWorkbenchStatus }>(`
      query StatusQuery {
        status {
          nodes
          edges
          seeds
          weaver { frontier inFlight }
          render { maxRenderNodes maxRenderEdges }
          scan { maxFileBytes rescanIntervalMs }
        }
      }
    `);
    return data.status;
  }

  async searchNodes(query: string, limit = 8): Promise<GraphWorkbenchNode[]> {
    const data = await this.query<{ searchNodes: Record<string, unknown>[] }>(`
      query SearchNodes($query: String!, $limit: Int!) {
        searchNodes(query: $query, limit: $limit) {
          id
          kind
          label
          external
          loadedByDefault
          layer
          dataJson
        }
      }
    `, { query, limit });
    return (data.searchNodes ?? []).map(toNode);
  }

  async neighbors(id: string, options: { direction?: "in" | "out" | "both"; kind?: string; limit?: number } = {}): Promise<GraphWorkbenchNode[]> {
    const data = await this.query<{ neighbors: Record<string, unknown>[] }>(`
      query Neighbors($id: ID!, $direction: String!, $kind: String, $limit: Int!) {
        neighbors(id: $id, direction: $direction, kind: $kind, limit: $limit) {
          id
          kind
          label
          external
          loadedByDefault
          layer
          dataJson
        }
      }
    `, {
      id,
      direction: options.direction ?? "both",
      kind: options.kind,
      limit: Math.max(1, Math.min(200, Math.trunc(options.limit ?? 12))),
    });
    return (data.neighbors ?? []).map(toNode);
  }

  async nodePreview(id: string, maxBytes = 4000): Promise<GraphWorkbenchNodePreview | null> {
    const data = await this.query<{ nodePreview: GraphWorkbenchNodePreview | null }>(`
      query NodePreview($id: ID!, $maxBytes: Int!) {
        nodePreview(id: $id, maxBytes: $maxBytes) {
          id
          kind
          format
          contentType
          language
          body
          truncated
          bytes
          status
          error
        }
      }
    `, { id, maxBytes });
    return data.nodePreview ?? null;
  }

  async graphView(options: { maxNodes?: number; maxEdges?: number } = {}): Promise<GraphWorkbenchGraphView> {
    const data = await this.query<{ graphView: {
      nodes: Array<Record<string, unknown>>;
      edges: Array<Record<string, unknown>>;
      meta: GraphWorkbenchGraphView["meta"];
    } }>(`
      query GraphView($maxNodes: Int, $maxEdges: Int) {
        graphView(maxNodes: $maxNodes, maxEdges: $maxEdges) {
          nodes {
            id
            kind
            label
            x
            y
            external
            loadedByDefault
            layer
            dataJson
          }
          edges {
            source
            target
            kind
            layer
            dataJson
          }
          meta {
            totalNodes
            totalEdges
            sampledNodes
            sampledEdges
          }
        }
      }
    `, {
      maxNodes: options.maxNodes,
      maxEdges: options.maxEdges,
    });

    return {
      nodes: (data.graphView.nodes ?? []).map((node) => ({
        ...toNode(node),
        x: Number(node.x ?? 0),
        y: Number(node.y ?? 0),
      })),
      edges: (data.graphView.edges ?? []).map(toEdge),
      meta: data.graphView.meta,
    };
  }
}
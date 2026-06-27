import { createDefaultOpenPlannerConfig, type OpenPlannerConfig } from "./client.js";
import { requestJson } from "./graph-http.js";
import {
  clampLimit,
  dedupeEdges,
  dedupeNodes,
  edgeFromResponse,
  isLikelyUrl,
  listParam,
  nodeFromResponse,
  normalizeRawEdge,
  normalizeRawNode,
  normalizeUrl,
  pickAnchorNode,
  synthesizeNodeFromEdge,
  toSafeNumber,
} from "./graph-normalize.js";
import type {
  CephalonGraphEdge,
  CephalonGraphNode,
  CephalonGraphQueryClient,
  GraphExportResponse,
  GraphNeighborResult,
  GraphNodeLookup,
  GraphQueryResponse,
  GraphQueryResult,
  GraphSearchOptions,
  GraphSlice,
  GraphSliceOptions,
  GraphStatus,
  GraphStatusResponse,
  NeighborOptions,
  RawGraphEdgesResponse,
  RawGraphNodeResponse,
} from "./graph-types.js";

export type {
  CephalonGraphEdge,
  CephalonGraphNode,
  CephalonGraphQueryClient,
  GraphNeighborResult,
  GraphNodeLookup,
  GraphQueryResult,
  GraphSearchOptions,
  GraphSlice,
  GraphSliceOptions,
  GraphStatus,
  NeighborOptions,
} from "./graph-types.js";

export class OpenPlannerGraphQueryClient implements CephalonGraphQueryClient {
  private readonly config: OpenPlannerConfig;

  constructor(config: Partial<OpenPlannerConfig> = {}) {
    this.config = {
      ...createDefaultOpenPlannerConfig(),
      ...config,
    };
  }

  async status(): Promise<GraphStatus> {
    const payload = await requestJson<GraphStatusResponse>(this.config, "/v1/graph/stats");
    return {
      ok: true,
      source: "openplanner",
      storageBackend: String(payload.storageBackend ?? "unknown"),
      nodeCount: toSafeNumber(payload.nodeCount),
      edgeCount: toSafeNumber(payload.edgeCount),
    };
  }

  async search(query: string, options: GraphSearchOptions = {}): Promise<GraphQueryResult> {
    const payload = await requestJson<GraphQueryResponse>(this.config, "/v1/graph/query", {
      q: query,
      projects: listParam(options.projects),
      nodeTypes: listParam(options.nodeTypes),
      edgeTypes: listParam(options.edgeTypes),
      limit: String(clampLimit(options.limit, 12, 100)),
      edgeLimit: String(clampLimit(options.edgeLimit, 40, 200)),
    });

    const nodes = Array.isArray(payload.nodes) ? payload.nodes.map(nodeFromResponse) : [];
    const edges = Array.isArray(payload.edges)
      ? payload.edges.map(edgeFromResponse).filter((edge): edge is CephalonGraphEdge => Boolean(edge))
      : [];

    return {
      ok: true,
      source: "openplanner",
      storageBackend: typeof payload.storageBackend === "string" ? payload.storageBackend : undefined,
      query,
      projects: Array.isArray(payload.projects) ? payload.projects.map(String) : (options.projects ?? []),
      nodeTypes: Array.isArray(payload.nodeTypes) ? payload.nodeTypes.map(String) : (options.nodeTypes ?? []),
      edgeTypes: Array.isArray(payload.edgeTypes) ? payload.edgeTypes.map(String) : (options.edgeTypes ?? []),
      nodes,
      edges,
      counts: {
        nodes: toSafeNumber(payload.counts?.nodes ?? nodes.length),
        edges: toSafeNumber(payload.counts?.edges ?? edges.length),
      },
    };
  }

  async node(idOrUrl: string): Promise<GraphNodeLookup> {
    const needle = idOrUrl.trim();
    if (isLikelyUrl(needle)) {
      const payload = await requestJson<RawGraphNodeResponse>(this.config, "/v1/graph/nodes", {
        url: normalizeUrl(needle),
      });
      if (payload.node) {
        return {
          ok: true,
          source: "openplanner",
          query: needle,
          node: normalizeRawNode(payload.node),
        };
      }
    }

    const result = await this.search(needle, { limit: 25, edgeLimit: 1 });
    return {
      ok: true,
      source: "openplanner",
      query: needle,
      node: pickAnchorNode(result.nodes, needle),
    };
  }

  async neighbors(idOrUrl: string, options: NeighborOptions = {}): Promise<GraphNeighborResult> {
    const needle = idOrUrl.trim();
    const limit = clampLimit(options.limit, 20, 100);
    const searchResult = await this.search(needle, {
      projects: options.projects,
      edgeTypes: options.edgeTypes,
      limit: 25,
      edgeLimit: limit,
    });

    let anchor = pickAnchorNode(searchResult.nodes, needle);
    let edges = dedupeEdges(anchor
      ? searchResult.edges.filter((edge) => edge.source === anchor?.id || edge.target === anchor?.id).slice(0, limit)
      : []);

    let nodes = dedupeNodes(anchor
      ? searchResult.nodes.filter((node) => node.id === anchor?.id || edges.some((edge) => edge.source === node.id || edge.target === node.id))
      : []);

    if (edges.length === 0) {
      const [sourceEdges, targetEdges] = await Promise.all([
        requestJson<RawGraphEdgesResponse>(this.config, "/v1/graph/edges", {
          source: needle,
        }),
        requestJson<RawGraphEdgesResponse>(this.config, "/v1/graph/edges", {
          target: needle,
        }),
      ]);

      edges = dedupeEdges([
        ...(Array.isArray(sourceEdges.edges) ? sourceEdges.edges.map(normalizeRawEdge).filter((edge): edge is CephalonGraphEdge => Boolean(edge)) : []),
        ...(Array.isArray(targetEdges.edges) ? targetEdges.edges.map(normalizeRawEdge).filter((edge): edge is CephalonGraphEdge => Boolean(edge)) : []),
      ]).slice(0, limit);

      if (!anchor) {
        anchor = (await this.node(needle)).node;
      }

      const nodeMap = new Map<string, CephalonGraphNode>(nodes.map((node) => [node.id, node]));
      if (anchor) nodeMap.set(anchor.id, anchor);
      for (const edge of edges) {
        if (!nodeMap.has(edge.source)) nodeMap.set(edge.source, synthesizeNodeFromEdge(edge.source, edge));
        if (!nodeMap.has(edge.target)) nodeMap.set(edge.target, synthesizeNodeFromEdge(edge.target, edge));
      }
      nodes = [...nodeMap.values()].filter((node) => node.id === anchor?.id || edges.some((edge) => edge.source === node.id || edge.target === node.id));
    }

    return {
      ok: true,
      source: "openplanner",
      query: needle,
      anchor,
      nodes,
      edges,
      counts: {
        nodes: nodes.length,
        edges: edges.length,
      },
    };
  }

  async exportSlice(options: GraphSliceOptions = {}): Promise<GraphSlice> {
    const payload = await requestJson<GraphExportResponse>(this.config, "/v1/graph/export", {
      projects: listParam(options.projects),
      nodeTypes: listParam(options.nodeTypes),
      edgeTypes: listParam(options.edgeTypes),
    });

    const nodes = Array.isArray(payload.nodes) ? payload.nodes.map(nodeFromResponse) : [];
    const edges = Array.isArray(payload.edges)
      ? payload.edges.map(edgeFromResponse).filter((edge): edge is CephalonGraphEdge => Boolean(edge))
      : [];

    return {
      ok: true,
      source: "openplanner",
      storageBackend: typeof payload.storageBackend === "string" ? payload.storageBackend : undefined,
      projects: Array.isArray(payload.projects) ? payload.projects.map(String) : (options.projects ?? []),
      nodes,
      edges,
      counts: {
        nodes: toSafeNumber(payload.counts?.nodes ?? nodes.length),
        edges: toSafeNumber(payload.counts?.edges ?? edges.length),
      },
    };
  }
}

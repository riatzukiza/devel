import type { GraphEdge, GraphNode, GraphSnapshot } from "./graph.js";

type EdgeFilter = { source?: string; target?: string; kind?: string; limit: number };
type NeighborFilter = { id: string; direction: "in" | "out" | "both"; kind?: string; limit: number };

function buildNodeSearchText(node: GraphNode): string {
  const lake = typeof node.data?.lake === "string" ? node.data.lake : "";
  const nodeType = typeof node.data?.node_type === "string" ? node.data.node_type : "";
  return `${node.id} ${node.kind} ${node.label} ${node.path ?? ""} ${node.url ?? ""} ${node.dep ?? ""} ${lake} ${nodeType}`.toLowerCase();
}

function ensureSet(map: Map<string, Set<string>>, key: string): Set<string> {
  const existing = map.get(key);
  if (existing) return existing;
  const created = new Set<string>();
  map.set(key, created);
  return created;
}

function addIndexed(map: Map<string, Set<string>>, key: string, value: string): void {
  ensureSet(map, key).add(value);
}

function removeIndexed(map: Map<string, Set<string>>, key: string, value: string): void {
  const bucket = map.get(key);
  if (!bucket) return;
  bucket.delete(value);
  if (bucket.size === 0) {
    map.delete(key);
  }
}

function iterateEdgeCandidates(
  edgesById: Map<string, GraphEdge>,
  outgoingBySource: Map<string, Set<string>>,
  incomingByTarget: Map<string, Set<string>>,
  filter: Omit<EdgeFilter, "limit">,
): Iterable<GraphEdge> {
  if (filter.source && filter.target) {
    const outgoing = outgoingBySource.get(filter.source);
    const incoming = incomingByTarget.get(filter.target);
    if (!outgoing || !incoming) return [];
    const smaller = outgoing.size <= incoming.size ? outgoing : incoming;
    const other = smaller === outgoing ? incoming : outgoing;
    return (function* () {
      for (const id of smaller) {
        if (!other.has(id)) continue;
        const edge = edgesById.get(id);
        if (edge) yield edge;
      }
    })();
  }

  if (filter.source) {
    const outgoing = outgoingBySource.get(filter.source);
    if (!outgoing) return [];
    return (function* () {
      for (const id of outgoing) {
        const edge = edgesById.get(id);
        if (edge) yield edge;
      }
    })();
  }

  if (filter.target) {
    const incoming = incomingByTarget.get(filter.target);
    if (!incoming) return [];
    return (function* () {
      for (const id of incoming) {
        const edge = edgesById.get(id);
        if (edge) yield edge;
      }
    })();
  }

  return edgesById.values();
}

export class GraphStore {
  private readonly nodesById = new Map<string, GraphNode>();
  private readonly edgesById = new Map<string, GraphEdge>();
  private readonly searchTextByNodeId = new Map<string, string>();
  private readonly outgoingEdgeIdsBySource = new Map<string, Set<string>>();
  private readonly incomingEdgeIdsByTarget = new Map<string, Set<string>>();
  private snapshotCache: GraphSnapshot | null = null;

  private invalidateSnapshot(): void {
    this.snapshotCache = null;
  }

  private indexNode(node: GraphNode): void {
    this.searchTextByNodeId.set(node.id, buildNodeSearchText(node));
  }

  private addEdgeIndex(edge: GraphEdge): void {
    addIndexed(this.outgoingEdgeIdsBySource, edge.source, edge.id);
    addIndexed(this.incomingEdgeIdsByTarget, edge.target, edge.id);
  }

  private removeEdgeIndex(edge: GraphEdge): void {
    removeIndexed(this.outgoingEdgeIdsBySource, edge.source, edge.id);
    removeIndexed(this.incomingEdgeIdsByTarget, edge.target, edge.id);
  }

  upsertNode(node: GraphNode): void {
    const prev = this.nodesById.get(node.id);
    const mergedData =
      prev?.data || node.data
        ? {
            ...(prev?.data ?? {}),
            ...(node.data ?? {}),
          }
        : undefined;
    const next = { ...(prev ?? {}), ...node, data: mergedData } as GraphNode;
    this.nodesById.set(node.id, next);
    this.indexNode(next);
    this.invalidateSnapshot();
  }

  upsertEdge(edge: GraphEdge): void {
    const prev = this.edgesById.get(edge.id);
    const mergedData =
      prev?.data || edge.data
        ? {
            ...(prev?.data ?? {}),
            ...(edge.data ?? {}),
          }
        : undefined;
    const next = { ...(prev ?? {}), ...edge, data: mergedData } as GraphEdge;
    if (prev) {
      this.removeEdgeIndex(prev);
    }
    this.edgesById.set(edge.id, next);
    this.addEdgeIndex(next);
    this.invalidateSnapshot();
  }

  removeNode(id: string): boolean {
    const existed = this.nodesById.delete(id);
    if (!existed) return false;

    this.searchTextByNodeId.delete(id);

    const incidentEdgeIds = new Set<string>([
      ...(this.outgoingEdgeIdsBySource.get(id) ?? []),
      ...(this.incomingEdgeIdsByTarget.get(id) ?? []),
    ]);
    for (const edgeId of incidentEdgeIds) {
      this.removeEdge(edgeId);
    }

    this.invalidateSnapshot();
    return true;
  }

  removeEdge(id: string): boolean {
    const edge = this.edgesById.get(id);
    if (!edge) return false;
    this.edgesById.delete(id);
    this.removeEdgeIndex(edge);
    this.invalidateSnapshot();
    return true;
  }

  hasNode(id: string): boolean {
    return this.nodesById.has(id);
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodesById.get(id);
  }

  nodes(): IterableIterator<GraphNode> {
    return this.nodesById.values();
  }

  hasEdge(id: string): boolean {
    return this.edgesById.has(id);
  }

  getEdge(id: string): GraphEdge | undefined {
    return this.edgesById.get(id);
  }

  edges(): IterableIterator<GraphEdge> {
    return this.edgesById.values();
  }

  snapshot(): GraphSnapshot {
    if (this.snapshotCache) return this.snapshotCache;
    this.snapshotCache = {
      nodes: [...this.nodesById.values()],
      edges: [...this.edgesById.values()],
    };
    return this.snapshotCache;
  }

  size(): { nodes: number; edges: number } {
    return { nodes: this.nodesById.size, edges: this.edgesById.size };
  }

  listEdges(filter: EdgeFilter): GraphEdge[] {
    const cap = Math.max(1, Math.min(2000, Math.floor(filter.limit)));
    const out: GraphEdge[] = [];
    for (const edge of iterateEdgeCandidates(this.edgesById, this.outgoingEdgeIdsBySource, this.incomingEdgeIdsByTarget, filter)) {
      if (filter.kind && edge.kind !== filter.kind) continue;
      if (filter.source && edge.source !== filter.source) continue;
      if (filter.target && edge.target !== filter.target) continue;
      out.push(edge);
      if (out.length >= cap) break;
    }
    return out;
  }

  neighbors(filter: NeighborFilter): GraphNode[] {
    const cap = Math.max(1, Math.min(2000, Math.floor(filter.limit)));
    const out: GraphNode[] = [];
    const seen = new Set<string>();

    const pushNeighbor = (neighborId: string) => {
      if (seen.has(neighborId)) return false;
      const node = this.nodesById.get(neighborId);
      if (!node) return false;
      seen.add(neighborId);
      out.push(node);
      return out.length >= cap;
    };

    if (filter.direction === "out" || filter.direction === "both") {
      for (const edgeId of this.outgoingEdgeIdsBySource.get(filter.id) ?? []) {
        const edge = this.edgesById.get(edgeId);
        if (!edge) continue;
        if (filter.kind && edge.kind !== filter.kind) continue;
        if (pushNeighbor(edge.target)) return out;
      }
    }

    if (filter.direction === "in" || filter.direction === "both") {
      for (const edgeId of this.incomingEdgeIdsByTarget.get(filter.id) ?? []) {
        const edge = this.edgesById.get(edgeId);
        if (!edge) continue;
        if (filter.kind && edge.kind !== filter.kind) continue;
        if (pushNeighbor(edge.source)) return out;
      }
    }

    return out;
  }

  searchNodes(query: string, limit: number): GraphNode[] {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return [];
    const cap = Math.max(1, Math.min(500, Math.floor(limit)));
    const out: GraphNode[] = [];

    for (const [id, haystack] of this.searchTextByNodeId) {
      if (!haystack.includes(q)) continue;
      const node = this.nodesById.get(id);
      if (!node) continue;
      out.push(node);
      if (out.length >= cap) break;
    }

    return out;
  }
}

export function mergeStores(a: GraphStore, b: GraphStore): GraphStore {
  const out = new GraphStore();
  for (const node of a.nodes()) out.upsertNode(node);
  for (const node of b.nodes()) out.upsertNode(node);
  for (const edge of a.edges()) out.upsertEdge(edge);
  for (const edge of b.edges()) out.upsertEdge(edge);
  return out;
}

export function mergeStoresMany(stores: GraphStore[]): GraphStore {
  const out = new GraphStore();
  for (const store of stores) {
    for (const node of store.nodes()) out.upsertNode(node);
    for (const edge of store.edges()) out.upsertEdge(edge);
  }
  return out;
}

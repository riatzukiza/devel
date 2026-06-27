export interface GraphSearchOptions {
  projects?: string[];
  nodeTypes?: string[];
  edgeTypes?: string[];
  limit?: number;
  edgeLimit?: number;
}

export interface NeighborOptions {
  projects?: string[];
  edgeTypes?: string[];
  limit?: number;
}

export interface GraphSliceOptions {
  projects?: string[];
  nodeTypes?: string[];
  edgeTypes?: string[];
}

export interface CephalonGraphNode {
  id: string;
  kind: string;
  label: string;
  lake?: string;
  nodeType?: string;
  data: Record<string, unknown>;
}

export interface CephalonGraphEdge {
  id: string;
  source: string;
  target: string;
  kind: string;
  lake?: string;
  edgeType?: string;
  sourceLake?: string;
  targetLake?: string;
  data: Record<string, unknown>;
}

export interface GraphStatus {
  ok: true;
  source: "openplanner";
  storageBackend: string;
  nodeCount: number;
  edgeCount: number;
}

export interface GraphCounts {
  nodes: number;
  edges: number;
}

export interface GraphQueryResult {
  ok: true;
  source: "openplanner";
  storageBackend?: string;
  query: string;
  projects: string[];
  nodeTypes: string[];
  edgeTypes: string[];
  nodes: CephalonGraphNode[];
  edges: CephalonGraphEdge[];
  counts: GraphCounts;
}

export interface GraphNodeLookup {
  ok: true;
  source: "openplanner";
  query: string;
  node: CephalonGraphNode | null;
}

export interface GraphNeighborResult {
  ok: true;
  source: "openplanner";
  query: string;
  anchor: CephalonGraphNode | null;
  nodes: CephalonGraphNode[];
  edges: CephalonGraphEdge[];
  counts: GraphCounts;
}

export interface GraphSlice {
  ok: true;
  source: "openplanner";
  storageBackend?: string;
  projects: string[];
  nodes: CephalonGraphNode[];
  edges: CephalonGraphEdge[];
  counts: GraphCounts;
}

export interface CephalonGraphQueryClient {
  status(): Promise<GraphStatus>;
  search(query: string, options?: GraphSearchOptions): Promise<GraphQueryResult>;
  node(idOrUrl: string): Promise<GraphNodeLookup>;
  neighbors(idOrUrl: string, options?: NeighborOptions): Promise<GraphNeighborResult>;
  exportSlice(options?: GraphSliceOptions): Promise<GraphSlice>;
}

export type GraphStatusResponse = Partial<{
  nodeCount: number | string;
  edgeCount: number | string;
  storageBackend: string;
}>;

export type GraphResponseNode = Partial<{
  id: string;
  kind: string;
  label: string;
  lake: string;
  nodeType: string;
  node_type: string;
  data: Record<string, unknown>;
}>;

export type GraphResponseEdge = Partial<{
  id: string;
  source: string;
  target: string;
  kind: string;
  lake: string;
  edgeType: string;
  edge_type: string;
  sourceLake: string;
  source_lake: string;
  targetLake: string;
  target_lake: string;
  data: Record<string, unknown>;
}>;

export type GraphQueryResponse = Partial<{
  ok: boolean;
  storageBackend: string;
  query: string;
  projects: string[];
  nodeTypes: string[];
  edgeTypes: string[];
  nodes: GraphResponseNode[];
  edges: GraphResponseEdge[];
  counts: Partial<GraphCounts>;
}>;

export type GraphExportResponse = Partial<{
  ok: boolean;
  storageBackend: string;
  projects: string[];
  nodes: GraphResponseNode[];
  edges: GraphResponseEdge[];
  counts: Partial<GraphCounts>;
}>;

export type RawGraphNodeRow = Partial<{
  id: string;
  project: string;
  extra: Record<string, unknown> | string;
}>;

export type RawGraphNodeResponse = Partial<{
  node: RawGraphNodeRow | null;
}>;

export type RawGraphEdgeRow = Partial<{
  id: string;
  project: string;
  extra: Record<string, unknown> | string;
}>;

export type RawGraphEdgesResponse = Partial<{
  edges: RawGraphEdgeRow[];
}>;
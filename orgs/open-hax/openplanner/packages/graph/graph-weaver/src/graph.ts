export type GraphLayer = "local" | "web" | "user" | "semantic" | "presence" | "transient" | "field" | "daimoi";

export type GraphNode = {
  id: string;
  /** A string on purpose: lets future sims add kinds without schema churn. */
  kind: string;
  label: string;
  external: boolean;
  loadedByDefault: boolean;
  layer?: GraphLayer;
  path?: string;
  url?: string;
  dep?: string;
  data?: Record<string, unknown>;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  kind: string;
  layer?: GraphLayer;
  data?: Record<string, unknown>;
};

export type GraphSnapshot = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

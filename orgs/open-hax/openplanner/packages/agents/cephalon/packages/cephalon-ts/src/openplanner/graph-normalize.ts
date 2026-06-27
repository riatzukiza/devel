import type {
  CephalonGraphEdge,
  CephalonGraphNode,
  GraphResponseEdge,
  GraphResponseNode,
  RawGraphEdgeRow,
  RawGraphNodeRow,
} from "./graph-types.js";

export function toSafeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function parseObject(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== "string") return {};

  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

export function listParam(values?: string[]): string | undefined {
  if (!values || values.length === 0) return undefined;
  return values.filter(Boolean).join(",");
}

export function normalizeUrl(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    url.hash = "";
    if (!url.pathname) url.pathname = "/";
    return url.toString();
  } catch {
    return raw;
  }
}

export function isLikelyUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function basenameFromPath(value: string): string {
  const parts = value.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? value;
}

function lakeFromNodeId(nodeId: string): string | undefined {
  const idx = nodeId.indexOf(":");
  return idx > 0 ? nodeId.slice(0, idx) : undefined;
}

function nodeIdFromRaw(project: string, extra: Record<string, unknown>, fallbackId: string): string {
  const explicit = String(extra.node_id ?? "").trim();
  if (explicit) return explicit;

  const url = normalizeUrl(extra.url);
  if (url) return `${project || "web"}:url:${url}`;

  const path = String(extra.path ?? extra.source_path ?? "").trim();
  if (path) return `${project || "devel"}:file:${path}`;

  return fallbackId || "graph-node:unknown";
}

function nodeLabelFromRaw(nodeId: string, extra: Record<string, unknown>): string {
  const explicit = String(extra.label ?? extra.title ?? "").trim();
  if (explicit) return explicit;

  const path = String(extra.path ?? extra.source_path ?? "").trim();
  if (path) return basenameFromPath(path);

  const url = normalizeUrl(extra.url);
  if (url) return url;
  return nodeId;
}

function edgeIdFromRaw(source: string, edgeType: string, target: string, fallbackId: string): string {
  return fallbackId || `${source}|${edgeType}|${target}`;
}

export function nodeFromResponse(node: GraphResponseNode): CephalonGraphNode {
  return {
    id: String(node.id ?? ""),
    kind: String(node.kind ?? "node"),
    label: String(node.label ?? node.id ?? ""),
    lake: typeof node.lake === "string" ? node.lake : undefined,
    nodeType: typeof node.nodeType === "string"
      ? node.nodeType
      : typeof node.node_type === "string"
        ? node.node_type
        : undefined,
    data: parseObject(node.data),
  };
}

export function normalizeRawNode(row: RawGraphNodeRow): CephalonGraphNode {
  const extra = parseObject(row.extra);
  const lake = String(extra.lake ?? row.project ?? "").trim() || undefined;
  const id = nodeIdFromRaw(String(row.project ?? lake ?? ""), extra, String(row.id ?? ""));
  return {
    id,
    kind: String(extra.node_kind ?? (extra.url ? "url" : extra.path ? "file" : "node")),
    label: nodeLabelFromRaw(id, extra),
    lake,
    nodeType: String(extra.node_type ?? extra.visit_status ?? "node") || undefined,
    data: extra,
  };
}

export function normalizeRawEdge(row: RawGraphEdgeRow): CephalonGraphEdge | null {
  const extra = parseObject(row.extra);
  const source = String(extra.source_node_id ?? "").trim() || (normalizeUrl(extra.source) ? `web:url:${normalizeUrl(extra.source)}` : "");
  const target = String(extra.target_node_id ?? "").trim() || (normalizeUrl(extra.target) ? `web:url:${normalizeUrl(extra.target)}` : "");
  if (!source || !target) return null;

  const lake = String(extra.lake ?? row.project ?? "").trim() || undefined;
  const edgeType = String(extra.edge_type ?? "relation").trim() || "relation";
  return {
    id: edgeIdFromRaw(source, edgeType, target, String(extra.edge_id ?? row.id ?? "")),
    source,
    target,
    kind: String(row.id ? "graph.edge" : extra.kind ?? "graph.edge"),
    lake,
    edgeType,
    sourceLake: String(extra.source_lake ?? lakeFromNodeId(source) ?? "").trim() || undefined,
    targetLake: String(extra.target_lake ?? lakeFromNodeId(target) ?? "").trim() || undefined,
    data: extra,
  };
}

export function edgeFromResponse(edge: GraphResponseEdge): CephalonGraphEdge | null {
  const source = String(edge.source ?? "").trim();
  const target = String(edge.target ?? "").trim();
  if (!source || !target) return null;

  return {
    id: String(edge.id ?? `${source}|${String(edge.edgeType ?? edge.edge_type ?? "relation")}|${target}`),
    source,
    target,
    kind: String(edge.kind ?? "graph.edge"),
    lake: typeof edge.lake === "string" ? edge.lake : undefined,
    edgeType: typeof edge.edgeType === "string"
      ? edge.edgeType
      : typeof edge.edge_type === "string"
        ? edge.edge_type
        : undefined,
    sourceLake: typeof edge.sourceLake === "string"
      ? edge.sourceLake
      : typeof edge.source_lake === "string"
        ? edge.source_lake
        : undefined,
    targetLake: typeof edge.targetLake === "string"
      ? edge.targetLake
      : typeof edge.target_lake === "string"
        ? edge.target_lake
        : undefined,
    data: parseObject(edge.data),
  };
}

export function exactNodeMatch(node: CephalonGraphNode, needle: string): boolean {
  const raw = needle.trim();
  if (!raw) return false;
  if (node.id === raw) return true;

  const urlNeedle = normalizeUrl(raw);
  const nodeUrl = normalizeUrl(node.data.url);
  if (urlNeedle && nodeUrl && urlNeedle === nodeUrl) return true;

  const path = String(node.data.path ?? node.data.source_path ?? "").trim();
  if (path && path === raw) return true;
  return node.label.trim().toLowerCase() === raw.toLowerCase();
}

export function pickAnchorNode(nodes: readonly CephalonGraphNode[], needle: string): CephalonGraphNode | null {
  return nodes.find((node) => exactNodeMatch(node, needle)) ?? nodes[0] ?? null;
}

export function dedupeNodes(nodes: readonly CephalonGraphNode[]): CephalonGraphNode[] {
  const map = new Map<string, CephalonGraphNode>();
  for (const node of nodes) {
    if (!node.id) continue;
    map.set(node.id, node);
  }
  return [...map.values()];
}

export function dedupeEdges(edges: readonly CephalonGraphEdge[]): CephalonGraphEdge[] {
  const map = new Map<string, CephalonGraphEdge>();
  for (const edge of edges) {
    if (!edge.id) continue;
    map.set(edge.id, edge);
  }
  return [...map.values()];
}

export function synthesizeNodeFromEdge(nodeId: string, edge: CephalonGraphEdge): CephalonGraphNode {
  const isSource = edge.source === nodeId;
  const lake = isSource ? edge.sourceLake : edge.targetLake;
  const url = isSource ? edge.data.source : edge.data.target;
  const label = typeof url === "string" && url.trim()
    ? url
    : nodeId.includes(":file:")
      ? basenameFromPath(nodeId.split(":file:")[1] ?? nodeId)
      : nodeId;

  return {
    id: nodeId,
    kind: nodeId.includes(":url:") ? "url" : nodeId.includes(":file:") ? "file" : "node",
    label,
    lake,
    nodeType: "node",
    data: {
      synthesized: true,
      lake,
      url: typeof url === "string" ? url : undefined,
    },
  };
}

export function clampLimit(value: number | undefined, fallback: number, max: number): number {
  const resolved = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.max(1, Math.min(max, Math.trunc(resolved)));
}
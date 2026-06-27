import type { GraphEdge, GraphNode, NodeStyle, EdgeStyle, OverlayPoint, RGBA } from "./types.js";
import { hashString } from "./utils.js";

export const LINE_STRIDE_FLOATS = 7;
export const POINT_STRIDE_FLOATS = 7;

function phaseForEdge(edge: GraphEdge, style: EdgeStyle): number {
  return style.phase ?? (hashString(`${edge.source}|${edge.target}|${edge.kind ?? ""}`) % 628) / 100;
}

export function buildNodeVertices(nodes: GraphNode[], nodeStyle: (n: GraphNode) => NodeStyle): Float32Array {
  const out = new Float32Array(nodes.length * POINT_STRIDE_FLOATS);
  let p = 0;
  for (const n of nodes) {
    const s = nodeStyle(n);
    const c = s.color;
    out[p++] = n.x;
    out[p++] = n.y;
    out[p++] = s.sizePx;
    out[p++] = c[0];
    out[p++] = c[1];
    out[p++] = c[2];
    out[p++] = c[3];
  }
  return out;
}

export function buildOverlayVertices(points: OverlayPoint[]): Float32Array {
  const out = new Float32Array(points.length * POINT_STRIDE_FLOATS);
  let p = 0;
  for (const pt of points) {
    const c = pt.color;
    out[p++] = pt.x;
    out[p++] = pt.y;
    out[p++] = pt.sizePx;
    out[p++] = c[0];
    out[p++] = c[1];
    out[p++] = c[2];
    out[p++] = c[3];
  }
  return out;
}

export function buildHaloVertices(node: GraphNode | null, haloStyle: (n: GraphNode) => NodeStyle): Float32Array {
  if (!node) return new Float32Array(0);
  const halo = haloStyle(node);
  const c = halo.color;
  return new Float32Array([
    node.x,
    node.y,
    halo.sizePx,
    c[0],
    c[1],
    c[2],
    c[3],
  ]);
}

export function buildEdgeVertices(params: {
  edges: GraphEdge[];
  nodes: GraphNode[];
  nodeIndexById: ReadonlyMap<string, number>;
  edgeStyle: (e: GraphEdge) => EdgeStyle;
}): Float32Array {
  const { edges, nodes, nodeIndexById, edgeStyle } = params;

  let valid = 0;
  for (const e of edges) {
    if (nodeIndexById.has(e.source) && nodeIndexById.has(e.target)) valid += 1;
  }

  const out = new Float32Array(valid * 2 * LINE_STRIDE_FLOATS);
  let p = 0;

  for (const e of edges) {
    const sIdx = nodeIndexById.get(e.source);
    const tIdx = nodeIndexById.get(e.target);
    if (sIdx === undefined || tIdx === undefined) continue;
    const s = nodes[sIdx];
    const t = nodes[tIdx];

    const style = edgeStyle(e);
    const c = style.color;
    const phase = phaseForEdge(e, style);

    out[p++] = s.x;
    out[p++] = s.y;
    out[p++] = c[0];
    out[p++] = c[1];
    out[p++] = c[2];
    out[p++] = c[3];
    out[p++] = phase;

    out[p++] = t.x;
    out[p++] = t.y;
    out[p++] = c[0];
    out[p++] = c[1];
    out[p++] = c[2];
    out[p++] = c[3];
    out[p++] = phase;
  }

  return out;
}

export function buildHighlightEdgeVertices(params: {
  selectedNodeId: string | null;
  edges: GraphEdge[];
  nodes: GraphNode[];
  nodeIndexById: ReadonlyMap<string, number>;
  edgeIndicesByNodeId: ReadonlyMap<string, number[]>;
  edgeStyle: (e: GraphEdge) => EdgeStyle;
  alphaMul?: number;
}): Float32Array {
  const {
    selectedNodeId,
    edges,
    nodes,
    nodeIndexById,
    edgeIndicesByNodeId,
    edgeStyle,
    alphaMul = 3.2,
  } = params;

  if (!selectedNodeId) return new Float32Array(0);
  const edgeIdxs = edgeIndicesByNodeId.get(selectedNodeId) ?? [];
  if (edgeIdxs.length === 0) return new Float32Array(0);

  const rows: number[] = [];
  for (const idx of edgeIdxs) {
    const e = edges[idx];
    if (!e) continue;
    const sIdx = nodeIndexById.get(e.source);
    const tIdx = nodeIndexById.get(e.target);
    if (sIdx === undefined || tIdx === undefined) continue;
    const s = nodes[sIdx];
    const t = nodes[tIdx];

    const style = edgeStyle(e);
    const c = style.color;
    const phase = phaseForEdge(e, style);
    const a = Math.min(1, c[3] * alphaMul);

    rows.push(s.x, s.y, c[0], c[1], c[2], a, phase);
    rows.push(t.x, t.y, c[0], c[1], c[2], a, phase);
  }

  return new Float32Array(rows);
}

export function vertexCount(vertices: Float32Array, strideFloats: number): number {
  return Math.floor(vertices.length / Math.max(1, strideFloats));
}

export function withAlpha(color: RGBA, alpha: number): RGBA {
  return [color[0], color[1], color[2], alpha];
}

import type { EdgeStyle, GraphEdge, GraphNode, NodeStyle, RGBA, WebGLGraphViewOptions } from "./types.js";
import { clamp, colorFromId, hashString, rgba } from "./utils.js";

export function defaultBackground(): RGBA {
  return rgba(0.03, 0.06, 0.11, 0.98);
}

export function defaultNodeStyle(node: GraphNode): NodeStyle {
  if (node.color && node.sizePx !== undefined) return { color: node.color, sizePx: node.sizePx };
  if (node.color) return { color: node.color, sizePx: node.sizePx ?? 4.5 };

  const kind = node.kind || "node";
  if (kind === "domain") return { color: colorFromId(node.id, 0.95), sizePx: node.sizePx ?? 9.5 };
  if (kind === "content") return { color: rgba(0.34, 0.88, 0.56, 0.92), sizePx: node.sizePx ?? 6.5 };
  return { color: rgba(0.48, 0.78, 0.98, 0.92), sizePx: node.sizePx ?? 4.8 };
}

export function defaultEdgeStyle(edge: GraphEdge): EdgeStyle {
  if (edge.color) {
    return {
      color: edge.color,
      phase: (hashString(`${edge.source}|${edge.target}`) % 628) / 100,
    };
  }

  const kind = edge.kind || "edge";
  if (kind === "hyperlink") return { color: rgba(0.38, 0.84, 0.96, 0.18) };
  if (kind === "canonical_redirect") return { color: rgba(0.82, 0.52, 0.98, 0.22) };
  if (kind === "citation") return { color: rgba(0.98, 0.64, 0.34, 0.24) };
  if (kind === "cross_reference") return { color: rgba(0.92, 0.46, 0.84, 0.22) };
  if (kind === "paper_pdf") return { color: rgba(0.42, 0.9, 0.9, 0.22) };
  return { color: rgba(0.56, 0.88, 0.66, 0.18) };
}

export function defaultHaloStyle(node: GraphNode): NodeStyle {
  const base = defaultNodeStyle(node);
  return { sizePx: base.sizePx + 7, color: rgba(1.0, 0.94, 0.72, 0.28) };
}

export function resolveOptions(options: WebGLGraphViewOptions | undefined): Required<WebGLGraphViewOptions> {
  return {
    background: options?.background ?? defaultBackground(),
    nodeStyle: options?.nodeStyle ?? defaultNodeStyle,
    edgeStyle: options?.edgeStyle ?? defaultEdgeStyle,
    haloStyle: options?.haloStyle ?? defaultHaloStyle,

    pulseAmplitude: clamp(options?.pulseAmplitude ?? 0.35, 0, 1),
    pulseSpeed: options?.pulseSpeed ?? 1 / 640,

    animate: options?.animate ?? true,
    interaction: options?.interaction ?? true,

    minScale: options?.minScale ?? 0.25,
    maxScale: options?.maxScale ?? 6,
    zoomStep: options?.zoomStep ?? 1.1,
    pickRadiusPx: options?.pickRadiusPx ?? 12,

    denseNodeThreshold: options?.denseNodeThreshold ?? 1000,
    denseEdgeThreshold: options?.denseEdgeThreshold ?? 2000,
    dprCap: options?.dprCap ?? { normal: 2, dense: 1.25 },
    frameIntervalMs: options?.frameIntervalMs ?? { normal: 33, dense: 50 },

    onNodeClick: options?.onNodeClick ?? (() => {}),
  };
}

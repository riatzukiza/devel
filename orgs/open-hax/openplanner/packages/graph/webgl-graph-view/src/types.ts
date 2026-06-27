export type RGBA = readonly [r: number, g: number, b: number, a: number];

export type GraphNode = {
  id: string;
  x: number;
  y: number;
  kind?: string;
  label?: string;
  /** Size in CSS pixels (not affected by zoom). */
  sizePx?: number;
  /** Overrides `nodeStyle()` if provided. */
  color?: RGBA;
  data?: unknown;
};

export type GraphEdge = {
  source: string;
  target: string;
  kind?: string;
  /** Overrides `edgeStyle()` if provided. */
  color?: RGBA;
  data?: unknown;
};

export type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type OverlayPoint = {
  x: number;
  y: number;
  sizePx: number;
  color: RGBA;
};

export type NodeStyle = {
  sizePx: number;
  color: RGBA;
};

export type EdgeStyle = {
  color: RGBA;
  /** Optional phase offset for pulsing edges (radians). */
  phase?: number;
};

export type ViewState = {
  /** CSS px per world-unit. */
  scale: number;
  /** Pan in CSS px. */
  offsetX: number;
  /** Pan in CSS px. */
  offsetY: number;
};

export type WebGLGraphViewOptions = {
  background?: RGBA;

  nodeStyle?: (node: GraphNode) => NodeStyle;
  edgeStyle?: (edge: GraphEdge) => EdgeStyle;
  haloStyle?: (node: GraphNode) => NodeStyle;

  /** Edge pulse amplitude (0 disables). */
  pulseAmplitude?: number;
  /** Radians per millisecond. */
  pulseSpeed?: number;

  animate?: boolean;
  interaction?: boolean;

  minScale?: number;
  maxScale?: number;
  zoomStep?: number;
  pickRadiusPx?: number;

  denseNodeThreshold?: number;
  denseEdgeThreshold?: number;
  dprCap?: { normal: number; dense: number };
  frameIntervalMs?: { normal: number; dense: number };

  /** Called after internal selection is updated. */
  onNodeClick?: (node: GraphNode) => void;
};

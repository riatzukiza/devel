import type {
  EdgeStyle,
  GraphData,
  GraphEdge,
  GraphNode,
  NodeStyle,
  OverlayPoint,
  ViewState,
  WebGLGraphViewOptions,
} from "./types.js";
import { LINE_FS, LINE_VS, POINT_FS, POINT_VS } from "./shaders.js";
import { clamp, colorFromId, hashString, rgba } from "./utils.js";
import { createProgram } from "./webgl.js";

const LINE_STRIDE_FLOATS = 7;
const POINT_STRIDE_FLOATS = 7;

function defaultNodeStyle(node: GraphNode): NodeStyle {
  if (node.color && node.sizePx !== undefined) return { color: node.color, sizePx: node.sizePx };
  if (node.color) return { color: node.color, sizePx: node.sizePx ?? 4.5 };

  const kind = node.kind || "node";
  if (kind === "domain") return { color: colorFromId(node.id, 0.95), sizePx: node.sizePx ?? 9.5 };
  if (kind === "content") return { color: rgba(0.34, 0.88, 0.56, 0.92), sizePx: node.sizePx ?? 6.5 };
  return { color: rgba(0.48, 0.78, 0.98, 0.92), sizePx: node.sizePx ?? 4.8 };
}

function defaultEdgeStyle(edge: GraphEdge): EdgeStyle {
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

function defaultHaloStyle(node: GraphNode): NodeStyle {
  const base = defaultNodeStyle(node);
  return { sizePx: base.sizePx + 7, color: rgba(1.0, 0.94, 0.72, 0.28) };
}

function withDefaults(options: WebGLGraphViewOptions | undefined): Required<WebGLGraphViewOptions> {
  return {
    background: options?.background ?? rgba(0.03, 0.06, 0.11, 0.98),
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

export class WebGLGraphView {
  private readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGLRenderingContext;
  private readonly opts: Required<WebGLGraphViewOptions>;

  private nodes: GraphNode[] = [];
  private edges: GraphEdge[] = [];
  private nodeIndexById = new Map<string, number>();
  private edgeIndicesByNodeId = new Map<string, number[]>();

  private overlay: OverlayPoint[] = [];

  private selectedNodeId: string | null = null;

  private view: ViewState = { scale: 1, offsetX: 0, offsetY: 0 };

  private destroyed = false;
  private raf = 0;
  private lastPaintAt = 0;
  private dragging = {
    active: false,
    startX: 0,
    startY: 0,
    baseOffsetX: 0,
    baseOffsetY: 0,
  };

  // --- WebGL resources
  private readonly lineProgram: ReturnType<typeof createProgram>;
  private readonly pointProgram: ReturnType<typeof createProgram>;

  private readonly edgeBuffer: WebGLBuffer;
  private readonly edgeHighlightBuffer: WebGLBuffer;
  private readonly nodeBuffer: WebGLBuffer;
  private readonly haloBuffer: WebGLBuffer;
  private readonly overlayBuffer: WebGLBuffer;

  private edgeVertexCount = 0;
  private edgeHighlightVertexCount = 0;
  private nodeVertexCount = 0;
  private haloVertexCount = 0;
  private overlayVertexCount = 0;

  // cached locations
  private readonly lineLoc: {
    aPos: number;
    aColor: number;
    aPhase: number;
    uResolution: WebGLUniformLocation | null;
    uPan: WebGLUniformLocation | null;
    uScale: WebGLUniformLocation | null;
    uTime: WebGLUniformLocation | null;
    uPulseSpeed: WebGLUniformLocation | null;
    uPulseAmplitude: WebGLUniformLocation | null;
  };

  private readonly pointLoc: {
    aPos: number;
    aSize: number;
    aColor: number;
    uResolution: WebGLUniformLocation | null;
    uPan: WebGLUniformLocation | null;
    uScale: WebGLUniformLocation | null;
    uPixelRatio: WebGLUniformLocation | null;
    uSizeScale: WebGLUniformLocation | null;
    uAlphaScale: WebGLUniformLocation | null;
  };

  constructor(canvas: HTMLCanvasElement, options?: WebGLGraphViewOptions) {
    this.canvas = canvas;
    this.opts = withDefaults(options);
    const gl = canvas.getContext("webgl", { alpha: false, antialias: true });
    if (!gl) {
      throw new Error("WebGL not available");
    }
    this.gl = gl;

    this.lineProgram = createProgram(gl, LINE_VS, LINE_FS);
    this.pointProgram = createProgram(gl, POINT_VS, POINT_FS);

    const edgeBuffer = gl.createBuffer();
    const edgeHighlightBuffer = gl.createBuffer();
    const nodeBuffer = gl.createBuffer();
    const haloBuffer = gl.createBuffer();
    const overlayBuffer = gl.createBuffer();
    if (!edgeBuffer || !edgeHighlightBuffer || !nodeBuffer || !haloBuffer || !overlayBuffer) {
      throw new Error("WebGL: createBuffer failed");
    }
    this.edgeBuffer = edgeBuffer;
    this.edgeHighlightBuffer = edgeHighlightBuffer;
    this.nodeBuffer = nodeBuffer;
    this.haloBuffer = haloBuffer;
    this.overlayBuffer = overlayBuffer;

    this.lineLoc = {
      aPos: gl.getAttribLocation(this.lineProgram.program, "aPos"),
      aColor: gl.getAttribLocation(this.lineProgram.program, "aColor"),
      aPhase: gl.getAttribLocation(this.lineProgram.program, "aPhase"),
      uResolution: gl.getUniformLocation(this.lineProgram.program, "uResolution"),
      uPan: gl.getUniformLocation(this.lineProgram.program, "uPan"),
      uScale: gl.getUniformLocation(this.lineProgram.program, "uScale"),
      uTime: gl.getUniformLocation(this.lineProgram.program, "uTime"),
      uPulseSpeed: gl.getUniformLocation(this.lineProgram.program, "uPulseSpeed"),
      uPulseAmplitude: gl.getUniformLocation(this.lineProgram.program, "uPulseAmplitude"),
    };

    this.pointLoc = {
      aPos: gl.getAttribLocation(this.pointProgram.program, "aPos"),
      aSize: gl.getAttribLocation(this.pointProgram.program, "aSize"),
      aColor: gl.getAttribLocation(this.pointProgram.program, "aColor"),
      uResolution: gl.getUniformLocation(this.pointProgram.program, "uResolution"),
      uPan: gl.getUniformLocation(this.pointProgram.program, "uPan"),
      uScale: gl.getUniformLocation(this.pointProgram.program, "uScale"),
      uPixelRatio: gl.getUniformLocation(this.pointProgram.program, "uPixelRatio"),
      uSizeScale: gl.getUniformLocation(this.pointProgram.program, "uSizeScale"),
      uAlphaScale: gl.getUniformLocation(this.pointProgram.program, "uAlphaScale"),
    };

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    if (this.opts.interaction) {
      this.attachInteraction();
    }

    if (this.opts.animate) {
      this.raf = window.requestAnimationFrame(this.draw);
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    window.cancelAnimationFrame(this.raf);
    this.detachInteraction();

    const gl = this.gl;
    gl.deleteBuffer(this.edgeBuffer);
    gl.deleteBuffer(this.edgeHighlightBuffer);
    gl.deleteBuffer(this.nodeBuffer);
    gl.deleteBuffer(this.haloBuffer);
    gl.deleteBuffer(this.overlayBuffer);

    gl.deleteProgram(this.lineProgram.program);
    gl.deleteShader(this.lineProgram.vs);
    gl.deleteShader(this.lineProgram.fs);
    gl.deleteProgram(this.pointProgram.program);
    gl.deleteShader(this.pointProgram.vs);
    gl.deleteShader(this.pointProgram.fs);
  }

  setGraph(graph: GraphData): void {
    this.nodes = graph.nodes;
    this.edges = graph.edges;

    this.nodeIndexById = new Map(this.nodes.map((n, i) => [n.id, i]));
    this.edgeIndicesByNodeId = new Map();
    for (let i = 0; i < this.edges.length; i += 1) {
      const e = this.edges[i];
      const push = (id: string) => {
        const rows = this.edgeIndicesByNodeId.get(id) ?? [];
        rows.push(i);
        this.edgeIndicesByNodeId.set(id, rows);
      };
      push(e.source);
      push(e.target);
    }

    this.rebuildNodeBuffer();
    this.rebuildEdgeBuffer();
    this.rebuildSelectionBuffers();

    if (!this.opts.animate) {
      this.renderOnce();
    }
  }

  setOverlayPoints(points: OverlayPoint[]): void {
    this.overlay = points;
    this.rebuildOverlayBuffer();
    if (!this.opts.animate) {
      this.renderOnce();
    }
  }

  setView(next: Partial<ViewState>): void {
    this.view = {
      scale: next.scale ?? this.view.scale,
      offsetX: next.offsetX ?? this.view.offsetX,
      offsetY: next.offsetY ?? this.view.offsetY,
    };
    if (!this.opts.animate) {
      this.renderOnce();
    }
  }

  getView(): ViewState {
    return { ...this.view };
  }

  setSelectedNode(nodeId: string | null): void {
    this.selectedNodeId = nodeId;
    this.rebuildSelectionBuffers();
    if (!this.opts.animate) {
      this.renderOnce();
    }
  }

  fitToGraph(paddingPx = 24): void {
    if (this.nodes.length === 0) return;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const n of this.nodes) {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y);
    }
    const w = Math.max(1e-6, maxX - minX);
    const h = Math.max(1e-6, maxY - minY);

    const sx = (rect.width - paddingPx * 2) / w;
    const sy = (rect.height - paddingPx * 2) / h;
    const scale = clamp(Math.min(sx, sy), this.opts.minScale, this.opts.maxScale);

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    this.view.scale = scale;
    this.view.offsetX = -midX * scale;
    this.view.offsetY = -midY * scale;

    if (!this.opts.animate) {
      this.renderOnce();
    }
  }

  // --- internals

  private rebuildNodeBuffer(): void {
    const rows = new Float32Array(this.nodes.length * POINT_STRIDE_FLOATS);
    let p = 0;
    for (const node of this.nodes) {
      const style = this.opts.nodeStyle(node);
      const c = style.color;
      rows[p++] = node.x;
      rows[p++] = node.y;
      rows[p++] = style.sizePx;
      rows[p++] = c[0];
      rows[p++] = c[1];
      rows[p++] = c[2];
      rows[p++] = c[3];
    }

    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.nodeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, rows, gl.DYNAMIC_DRAW);
    this.nodeVertexCount = this.nodes.length;
  }

  private rebuildEdgeBuffer(): void {
    const gl = this.gl;
    let valid = 0;
    for (const e of this.edges) {
      if (this.nodeIndexById.has(e.source) && this.nodeIndexById.has(e.target)) valid += 1;
    }
    const rows = new Float32Array(valid * 2 * LINE_STRIDE_FLOATS);

    let p = 0;
    for (const edge of this.edges) {
      const sIdx = this.nodeIndexById.get(edge.source);
      const tIdx = this.nodeIndexById.get(edge.target);
      if (sIdx === undefined || tIdx === undefined) continue;
      const s = this.nodes[sIdx];
      const t = this.nodes[tIdx];

      const style = this.opts.edgeStyle(edge);
      const c = style.color;
      const phase = style.phase ?? (hashString(`${edge.source}|${edge.target}|${edge.kind ?? ""}`) % 628) / 100;

      // source vertex
      rows[p++] = s.x;
      rows[p++] = s.y;
      rows[p++] = c[0];
      rows[p++] = c[1];
      rows[p++] = c[2];
      rows[p++] = c[3];
      rows[p++] = phase;

      // target vertex
      rows[p++] = t.x;
      rows[p++] = t.y;
      rows[p++] = c[0];
      rows[p++] = c[1];
      rows[p++] = c[2];
      rows[p++] = c[3];
      rows[p++] = phase;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.edgeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, rows, gl.DYNAMIC_DRAW);
    this.edgeVertexCount = valid * 2;
  }

  private rebuildSelectionBuffers(): void {
    const gl = this.gl;
    this.haloVertexCount = 0;
    this.edgeHighlightVertexCount = 0;

    const id = this.selectedNodeId;
    if (!id) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.haloBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(0), gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.edgeHighlightBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(0), gl.DYNAMIC_DRAW);
      return;
    }

    const idx = this.nodeIndexById.get(id);
    const node = idx === undefined ? null : this.nodes[idx];
    if (node) {
      const halo = this.opts.haloStyle(node);
      const hc = halo.color;
      const haloRow = new Float32Array([
        node.x,
        node.y,
        halo.sizePx,
        hc[0],
        hc[1],
        hc[2],
        hc[3],
      ]);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.haloBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, haloRow, gl.DYNAMIC_DRAW);
      this.haloVertexCount = 1;
    }

    const edgeIndices = this.edgeIndicesByNodeId.get(id) ?? [];
    if (edgeIndices.length === 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.edgeHighlightBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(0), gl.DYNAMIC_DRAW);
      return;
    }

    const rows: number[] = [];
    for (const edgeIdx of edgeIndices) {
      const edge = this.edges[edgeIdx];
      if (!edge) continue;
      const sIdx = this.nodeIndexById.get(edge.source);
      const tIdx = this.nodeIndexById.get(edge.target);
      if (sIdx === undefined || tIdx === undefined) continue;
      const s = this.nodes[sIdx];
      const t = this.nodes[tIdx];

      const style = this.opts.edgeStyle(edge);
      const c = style.color;
      const phase = style.phase ?? (hashString(`${edge.source}|${edge.target}|${edge.kind ?? ""}`) % 628) / 100;
      const a = Math.min(1, c[3] * 3.2);

      rows.push(s.x, s.y, c[0], c[1], c[2], a, phase);
      rows.push(t.x, t.y, c[0], c[1], c[2], a, phase);
    }

    const out = new Float32Array(rows);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.edgeHighlightBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, out, gl.DYNAMIC_DRAW);
    this.edgeHighlightVertexCount = out.length / LINE_STRIDE_FLOATS;
  }

  private rebuildOverlayBuffer(): void {
    const gl = this.gl;
    const out = new Float32Array(this.overlay.length * POINT_STRIDE_FLOATS);
    let p = 0;
    for (const pt of this.overlay) {
      const c = pt.color;
      out[p++] = pt.x;
      out[p++] = pt.y;
      out[p++] = pt.sizePx;
      out[p++] = c[0];
      out[p++] = c[1];
      out[p++] = c[2];
      out[p++] = c[3];
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.overlayBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, out, gl.DYNAMIC_DRAW);
    this.overlayVertexCount = this.overlay.length;
  }

  private readonly draw = (timestamp: number) => {
    if (this.destroyed) return;
    this.render(timestamp);
    if (this.opts.animate) {
      this.raf = window.requestAnimationFrame(this.draw);
    }
  };

  private renderOnce(): void {
    window.cancelAnimationFrame(this.raf);
    this.raf = window.requestAnimationFrame((ts) => this.render(ts));
  }

  private render(timestamp: number): void {
    const dense =
      this.nodes.length > this.opts.denseNodeThreshold ||
      this.edges.length > this.opts.denseEdgeThreshold;

    const interval = dense ? this.opts.frameIntervalMs.dense : this.opts.frameIntervalMs.normal;
    if (timestamp - this.lastPaintAt < interval) {
      return;
    }
    this.lastPaintAt = timestamp;

    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const baseDpr = window.devicePixelRatio || 1;
    const cap = dense ? this.opts.dprCap.dense : this.opts.dprCap.normal;
    const dpr = Math.min(baseDpr, cap);

    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    const gl = this.gl;
    gl.viewport(0, 0, width, height);

    const bg = this.opts.background;
    gl.clearColor(bg[0], bg[1], bg[2], bg[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const panX = this.view.offsetX * dpr;
    const panY = this.view.offsetY * dpr;
    const scale = this.view.scale * dpr;

    // --- Edges
    if (this.edgeVertexCount > 0) {
      gl.useProgram(this.lineProgram.program);
      if (this.lineLoc.uResolution) gl.uniform2f(this.lineLoc.uResolution, width, height);
      if (this.lineLoc.uPan) gl.uniform2f(this.lineLoc.uPan, panX, panY);
      if (this.lineLoc.uScale) gl.uniform1f(this.lineLoc.uScale, scale);
      if (this.lineLoc.uTime) gl.uniform1f(this.lineLoc.uTime, timestamp);
      if (this.lineLoc.uPulseSpeed) gl.uniform1f(this.lineLoc.uPulseSpeed, this.opts.pulseSpeed);
      if (this.lineLoc.uPulseAmplitude) gl.uniform1f(this.lineLoc.uPulseAmplitude, this.opts.pulseAmplitude);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.edgeBuffer);
      if (this.lineLoc.aPos >= 0) {
        gl.enableVertexAttribArray(this.lineLoc.aPos);
        gl.vertexAttribPointer(this.lineLoc.aPos, 2, gl.FLOAT, false, LINE_STRIDE_FLOATS * 4, 0);
      }
      if (this.lineLoc.aColor >= 0) {
        gl.enableVertexAttribArray(this.lineLoc.aColor);
        gl.vertexAttribPointer(this.lineLoc.aColor, 4, gl.FLOAT, false, LINE_STRIDE_FLOATS * 4, 2 * 4);
      }
      if (this.lineLoc.aPhase >= 0) {
        gl.enableVertexAttribArray(this.lineLoc.aPhase);
        gl.vertexAttribPointer(this.lineLoc.aPhase, 1, gl.FLOAT, false, LINE_STRIDE_FLOATS * 4, 6 * 4);
      }
      gl.drawArrays(gl.LINES, 0, this.edgeVertexCount);
    }

    // --- Highlight edges
    if (this.edgeHighlightVertexCount > 0) {
      gl.useProgram(this.lineProgram.program);
      if (this.lineLoc.uResolution) gl.uniform2f(this.lineLoc.uResolution, width, height);
      if (this.lineLoc.uPan) gl.uniform2f(this.lineLoc.uPan, panX, panY);
      if (this.lineLoc.uScale) gl.uniform1f(this.lineLoc.uScale, scale);
      if (this.lineLoc.uTime) gl.uniform1f(this.lineLoc.uTime, timestamp);
      if (this.lineLoc.uPulseSpeed) gl.uniform1f(this.lineLoc.uPulseSpeed, this.opts.pulseSpeed);
      if (this.lineLoc.uPulseAmplitude) gl.uniform1f(this.lineLoc.uPulseAmplitude, this.opts.pulseAmplitude);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.edgeHighlightBuffer);
      if (this.lineLoc.aPos >= 0) {
        gl.enableVertexAttribArray(this.lineLoc.aPos);
        gl.vertexAttribPointer(this.lineLoc.aPos, 2, gl.FLOAT, false, LINE_STRIDE_FLOATS * 4, 0);
      }
      if (this.lineLoc.aColor >= 0) {
        gl.enableVertexAttribArray(this.lineLoc.aColor);
        gl.vertexAttribPointer(this.lineLoc.aColor, 4, gl.FLOAT, false, LINE_STRIDE_FLOATS * 4, 2 * 4);
      }
      if (this.lineLoc.aPhase >= 0) {
        gl.enableVertexAttribArray(this.lineLoc.aPhase);
        gl.vertexAttribPointer(this.lineLoc.aPhase, 1, gl.FLOAT, false, LINE_STRIDE_FLOATS * 4, 6 * 4);
      }
      gl.drawArrays(gl.LINES, 0, this.edgeHighlightVertexCount);
    }

    // --- Halo
    if (this.haloVertexCount > 0) {
      gl.useProgram(this.pointProgram.program);
      if (this.pointLoc.uResolution) gl.uniform2f(this.pointLoc.uResolution, width, height);
      if (this.pointLoc.uPan) gl.uniform2f(this.pointLoc.uPan, panX, panY);
      if (this.pointLoc.uScale) gl.uniform1f(this.pointLoc.uScale, scale);
      if (this.pointLoc.uPixelRatio) gl.uniform1f(this.pointLoc.uPixelRatio, dpr);
      if (this.pointLoc.uSizeScale) gl.uniform1f(this.pointLoc.uSizeScale, 1);
      if (this.pointLoc.uAlphaScale) gl.uniform1f(this.pointLoc.uAlphaScale, 1);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.haloBuffer);
      if (this.pointLoc.aPos >= 0) {
        gl.enableVertexAttribArray(this.pointLoc.aPos);
        gl.vertexAttribPointer(this.pointLoc.aPos, 2, gl.FLOAT, false, POINT_STRIDE_FLOATS * 4, 0);
      }
      if (this.pointLoc.aSize >= 0) {
        gl.enableVertexAttribArray(this.pointLoc.aSize);
        gl.vertexAttribPointer(this.pointLoc.aSize, 1, gl.FLOAT, false, POINT_STRIDE_FLOATS * 4, 2 * 4);
      }
      if (this.pointLoc.aColor >= 0) {
        gl.enableVertexAttribArray(this.pointLoc.aColor);
        gl.vertexAttribPointer(this.pointLoc.aColor, 4, gl.FLOAT, false, POINT_STRIDE_FLOATS * 4, 3 * 4);
      }
      gl.drawArrays(gl.POINTS, 0, this.haloVertexCount);
    }

    // --- Nodes
    if (this.nodeVertexCount > 0) {
      gl.useProgram(this.pointProgram.program);
      if (this.pointLoc.uResolution) gl.uniform2f(this.pointLoc.uResolution, width, height);
      if (this.pointLoc.uPan) gl.uniform2f(this.pointLoc.uPan, panX, panY);
      if (this.pointLoc.uScale) gl.uniform1f(this.pointLoc.uScale, scale);
      if (this.pointLoc.uPixelRatio) gl.uniform1f(this.pointLoc.uPixelRatio, dpr);
      if (this.pointLoc.uSizeScale) gl.uniform1f(this.pointLoc.uSizeScale, 1);
      if (this.pointLoc.uAlphaScale) gl.uniform1f(this.pointLoc.uAlphaScale, 1);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.nodeBuffer);
      if (this.pointLoc.aPos >= 0) {
        gl.enableVertexAttribArray(this.pointLoc.aPos);
        gl.vertexAttribPointer(this.pointLoc.aPos, 2, gl.FLOAT, false, POINT_STRIDE_FLOATS * 4, 0);
      }
      if (this.pointLoc.aSize >= 0) {
        gl.enableVertexAttribArray(this.pointLoc.aSize);
        gl.vertexAttribPointer(this.pointLoc.aSize, 1, gl.FLOAT, false, POINT_STRIDE_FLOATS * 4, 2 * 4);
      }
      if (this.pointLoc.aColor >= 0) {
        gl.enableVertexAttribArray(this.pointLoc.aColor);
        gl.vertexAttribPointer(this.pointLoc.aColor, 4, gl.FLOAT, false, POINT_STRIDE_FLOATS * 4, 3 * 4);
      }
      gl.drawArrays(gl.POINTS, 0, this.nodeVertexCount);
    }

    // --- Overlay points
    if (this.overlayVertexCount > 0) {
      gl.useProgram(this.pointProgram.program);
      if (this.pointLoc.uResolution) gl.uniform2f(this.pointLoc.uResolution, width, height);
      if (this.pointLoc.uPan) gl.uniform2f(this.pointLoc.uPan, panX, panY);
      if (this.pointLoc.uScale) gl.uniform1f(this.pointLoc.uScale, scale);
      if (this.pointLoc.uPixelRatio) gl.uniform1f(this.pointLoc.uPixelRatio, dpr);
      if (this.pointLoc.uSizeScale) gl.uniform1f(this.pointLoc.uSizeScale, 1);
      if (this.pointLoc.uAlphaScale) gl.uniform1f(this.pointLoc.uAlphaScale, 1);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.overlayBuffer);
      if (this.pointLoc.aPos >= 0) {
        gl.enableVertexAttribArray(this.pointLoc.aPos);
        gl.vertexAttribPointer(this.pointLoc.aPos, 2, gl.FLOAT, false, POINT_STRIDE_FLOATS * 4, 0);
      }
      if (this.pointLoc.aSize >= 0) {
        gl.enableVertexAttribArray(this.pointLoc.aSize);
        gl.vertexAttribPointer(this.pointLoc.aSize, 1, gl.FLOAT, false, POINT_STRIDE_FLOATS * 4, 2 * 4);
      }
      if (this.pointLoc.aColor >= 0) {
        gl.enableVertexAttribArray(this.pointLoc.aColor);
        gl.vertexAttribPointer(this.pointLoc.aColor, 4, gl.FLOAT, false, POINT_STRIDE_FLOATS * 4, 3 * 4);
      }
      gl.drawArrays(gl.POINTS, 0, this.overlayVertexCount);
    }
  }

  // --- Interaction
  private onWheel?: (e: WheelEvent) => void;
  private onPointerDown?: (e: PointerEvent) => void;
  private onPointerMove?: (e: PointerEvent) => void;
  private onPointerUp?: (e: PointerEvent) => void;

  private attachInteraction(): void {
    const canvas = this.canvas;

    this.onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      const wx = (px - cx - this.view.offsetX) / this.view.scale;
      const wy = (py - cy - this.view.offsetY) / this.view.scale;

      const dir = event.deltaY < 0 ? 1 : -1;
      const factor = dir > 0 ? this.opts.zoomStep : 1 / this.opts.zoomStep;
      const nextScale = clamp(this.view.scale * factor, this.opts.minScale, this.opts.maxScale);

      this.view.scale = nextScale;
      this.view.offsetX = px - cx - wx * nextScale;
      this.view.offsetY = py - cy - wy * nextScale;

      if (!this.opts.animate) this.renderOnce();
    };

    this.onPointerDown = (event: PointerEvent) => {
      this.dragging.active = true;
      this.dragging.startX = event.clientX;
      this.dragging.startY = event.clientY;
      this.dragging.baseOffsetX = this.view.offsetX;
      this.dragging.baseOffsetY = this.view.offsetY;
      canvas.setPointerCapture?.(event.pointerId);
    };

    this.onPointerMove = (event: PointerEvent) => {
      if (!this.dragging.active) return;
      this.view.offsetX = this.dragging.baseOffsetX + (event.clientX - this.dragging.startX);
      this.view.offsetY = this.dragging.baseOffsetY + (event.clientY - this.dragging.startY);
      if (!this.opts.animate) this.renderOnce();
    };

    this.onPointerUp = (event: PointerEvent) => {
      const wasDragging = this.dragging.active;
      const moved = Math.hypot(event.clientX - this.dragging.startX, event.clientY - this.dragging.startY);
      this.dragging.active = false;
      canvas.releasePointerCapture?.(event.pointerId);

      if (!wasDragging || moved > 6) return;

      const rect = canvas.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      const wx = (px - cx - this.view.offsetX) / this.view.scale;
      const wy = (py - cy - this.view.offsetY) / this.view.scale;
      const radiusWorld = this.opts.pickRadiusPx / Math.max(1e-6, this.view.scale);
      const radius2 = radiusWorld * radiusWorld;

      let best: GraphNode | null = null;
      let bestD2 = Number.POSITIVE_INFINITY;
      for (const node of this.nodes) {
        const dx = node.x - wx;
        const dy = node.y - wy;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD2) {
          bestD2 = d2;
          best = node;
        }
      }

      if (best && bestD2 <= radius2) {
        this.setSelectedNode(best.id);
        this.opts.onNodeClick(best);
      }
    };

    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
  }

  private detachInteraction(): void {
    const canvas = this.canvas;
    if (this.onWheel) canvas.removeEventListener("wheel", this.onWheel);
    if (this.onPointerDown) canvas.removeEventListener("pointerdown", this.onPointerDown);
    if (this.onPointerMove) canvas.removeEventListener("pointermove", this.onPointerMove);
    if (this.onPointerUp) canvas.removeEventListener("pointerup", this.onPointerUp);
  }
}

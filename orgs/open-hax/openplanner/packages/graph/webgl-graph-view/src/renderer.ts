import type { RGBA, ViewState } from "./types.js";
import { LINE_FS, LINE_VS, POINT_FS, POINT_VS } from "./shaders.js";
import { LINE_STRIDE_FLOATS, POINT_STRIDE_FLOATS } from "./geometry.js";
import { createProgram } from "./webgl.js";

type LineLoc = {
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

type PointLoc = {
  aPos: number;
  aSize: number;
  aColor: number;
  uResolution: WebGLUniformLocation | null;
  uPan: WebGLUniformLocation | null;
  uScale: WebGLUniformLocation | null;
  uPixelRatio: WebGLUniformLocation | null;
};

export type WebGLGraphRendererOptions = {
  background: RGBA;
  pulseAmplitude: number;
  pulseSpeed: number;
  denseNodeThreshold: number;
  denseEdgeThreshold: number;
  dprCap: { normal: number; dense: number };
  frameIntervalMs: { normal: number; dense: number };
};

export class WebGLGraphRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGLRenderingContext;
  private readonly opts: WebGLGraphRendererOptions;

  private readonly lineProgram: ReturnType<typeof createProgram>;
  private readonly pointProgram: ReturnType<typeof createProgram>;
  private readonly lineLoc: LineLoc;
  private readonly pointLoc: PointLoc;

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

  private lastPaintAt = 0;

  constructor(canvas: HTMLCanvasElement, options: WebGLGraphRendererOptions) {
    this.canvas = canvas;
    this.opts = options;

    const gl = canvas.getContext("webgl", { alpha: false, antialias: true });
    if (!gl) throw new Error("WebGL not available");
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
    };

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  destroy(): void {
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

  setEdges(vertices: Float32Array): void {
    this.edgeVertexCount = Math.floor(vertices.length / (LINE_STRIDE_FLOATS * 1));
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.DYNAMIC_DRAW);
  }

  setHighlightEdges(vertices: Float32Array): void {
    this.edgeHighlightVertexCount = Math.floor(vertices.length / (LINE_STRIDE_FLOATS * 1));
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeHighlightBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.DYNAMIC_DRAW);
  }

  setNodes(vertices: Float32Array): void {
    this.nodeVertexCount = Math.floor(vertices.length / (POINT_STRIDE_FLOATS * 1));
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.nodeBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.DYNAMIC_DRAW);
  }

  setHalo(vertices: Float32Array): void {
    this.haloVertexCount = Math.floor(vertices.length / (POINT_STRIDE_FLOATS * 1));
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.haloBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.DYNAMIC_DRAW);
  }

  setOverlay(vertices: Float32Array): void {
    this.overlayVertexCount = Math.floor(vertices.length / (POINT_STRIDE_FLOATS * 1));
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.overlayBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.DYNAMIC_DRAW);
  }

  render(view: ViewState, timestamp: number): void {
    const dense =
      this.nodeVertexCount > this.opts.denseNodeThreshold ||
      this.edgeVertexCount / 2 > this.opts.denseEdgeThreshold;

    const interval = dense ? this.opts.frameIntervalMs.dense : this.opts.frameIntervalMs.normal;
    if (timestamp - this.lastPaintAt < interval) return;
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

    const panX = view.offsetX * dpr;
    const panY = view.offsetY * dpr;
    const scale = view.scale * dpr;

    this.drawLines(this.edgeBuffer, this.edgeVertexCount, width, height, panX, panY, scale, timestamp);
    this.drawLines(
      this.edgeHighlightBuffer,
      this.edgeHighlightVertexCount,
      width,
      height,
      panX,
      panY,
      scale,
      timestamp,
    );
    this.drawPoints(this.haloBuffer, this.haloVertexCount, width, height, panX, panY, scale, dpr);
    this.drawPoints(this.nodeBuffer, this.nodeVertexCount, width, height, panX, panY, scale, dpr);
    this.drawPoints(this.overlayBuffer, this.overlayVertexCount, width, height, panX, panY, scale, dpr);
  }

  private drawLines(
    buffer: WebGLBuffer,
    vertexCount: number,
    width: number,
    height: number,
    panX: number,
    panY: number,
    scale: number,
    timestamp: number,
  ): void {
    if (vertexCount <= 0) return;
    const gl = this.gl;
    gl.useProgram(this.lineProgram.program);

    if (this.lineLoc.uResolution) gl.uniform2f(this.lineLoc.uResolution, width, height);
    if (this.lineLoc.uPan) gl.uniform2f(this.lineLoc.uPan, panX, panY);
    if (this.lineLoc.uScale) gl.uniform1f(this.lineLoc.uScale, scale);
    if (this.lineLoc.uTime) gl.uniform1f(this.lineLoc.uTime, timestamp);
    if (this.lineLoc.uPulseSpeed) gl.uniform1f(this.lineLoc.uPulseSpeed, this.opts.pulseSpeed);
    if (this.lineLoc.uPulseAmplitude) gl.uniform1f(this.lineLoc.uPulseAmplitude, this.opts.pulseAmplitude);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
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

    gl.drawArrays(gl.LINES, 0, vertexCount);
  }

  private drawPoints(
    buffer: WebGLBuffer,
    vertexCount: number,
    width: number,
    height: number,
    panX: number,
    panY: number,
    scale: number,
    dpr: number,
  ): void {
    if (vertexCount <= 0) return;
    const gl = this.gl;
    gl.useProgram(this.pointProgram.program);

    if (this.pointLoc.uResolution) gl.uniform2f(this.pointLoc.uResolution, width, height);
    if (this.pointLoc.uPan) gl.uniform2f(this.pointLoc.uPan, panX, panY);
    if (this.pointLoc.uScale) gl.uniform1f(this.pointLoc.uScale, scale);
    if (this.pointLoc.uPixelRatio) gl.uniform1f(this.pointLoc.uPixelRatio, dpr);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
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

    gl.drawArrays(gl.POINTS, 0, vertexCount);
  }
}

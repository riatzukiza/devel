import * as ort from "onnxruntime-web";
import {
  type DevicePreference,
  type RuntimeDiagnostics,
  resolveAvailableBackends,
  resolveExecutionProviders,
  resolveWebNNOptions,
} from "./backends.js";

export interface BrowserEmbedConfig {
  embeddingModelUrl: string;
  cosineModelUrl: string;
  embeddingDim: number;
  devicePreference: DevicePreference;
}

export interface EmbedResult {
  vector: Float32Array;
  source: string;
  elapsed_ms: number;
}

export interface CosineResult {
  matrix: Float32Array;
  rows: number;
  cols: number;
  source: string;
  elapsed_ms: number;
}

const DEFAULT_CONFIG: BrowserEmbedConfig = {
  embeddingModelUrl: "/models/embedding_24d.onnx",
  cosineModelUrl: "/models/cosine_matrix_dynamic.onnx",
  embeddingDim: 24,
  devicePreference: "auto",
};

export class BrowserEmbedEngine {
  private config: BrowserEmbedConfig;
  private cosineSession: ort.InferenceSession | null = null;
  private embeddingSession: ort.InferenceSession | null = null;
  private activeBackend = "pending";
  private diagnostics: RuntimeDiagnostics | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(config?: Partial<BrowserEmbedConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async init(): Promise<RuntimeDiagnostics> {
    if (this.diagnostics) return this.diagnostics;
    if (this.initPromise) {
      await this.initPromise;
      return this.diagnostics!;
    }

    this.initPromise = this._doInit();
    await this.initPromise;
    return this.diagnostics!;
  }

  private async _doInit(): Promise<void> {
    this.diagnostics = await resolveAvailableBackends();
    this.diagnostics.device_preference = this.config.devicePreference;

    const providers = resolveExecutionProviders(this.config.devicePreference);
    const webnnOpts = resolveWebNNOptions(this.config.devicePreference);

    let lastError: unknown;
    for (const provider of providers) {
      try {
        const sessionOptions: ort.InferenceSession.SessionOptions = {
          executionProviders: [
            provider === "webnn" && webnnOpts
              ? { name: "webnn", ...webnnOpts }
              : provider,
          ] as ort.InferenceSession.ExecutionProviderConfig[],
        };

        this.cosineSession = await ort.InferenceSession.create(
          this.config.cosineModelUrl,
          sessionOptions,
        );
        this.activeBackend = provider;
        this.diagnostics.active_backend = provider;
        break;
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    if (!this.cosineSession) {
      throw new Error(
        `Failed to create cosine session with any provider: ${String(lastError)}`,
      );
    }

    // Embedding model is optional (some deployments compute embeddings server-side)
    try {
      const embSessionOpts: ort.InferenceSession.SessionOptions = {
        executionProviders: [
          this.activeBackend === "webnn" && webnnOpts
            ? { name: "webnn", ...webnnOpts }
            : this.activeBackend,
        ] as ort.InferenceSession.ExecutionProviderConfig[],
      };
      this.embeddingSession = await ort.InferenceSession.create(
        this.config.embeddingModelUrl,
        embSessionOpts,
      );
    } catch {
      // Embedding model not available, cosine-only mode
    }
  }

  getDiagnostics(): RuntimeDiagnostics | null {
    return this.diagnostics;
  }

  getActiveBackend(): string {
    return this.activeBackend;
  }

  async cosineMatrix(
    left: Float32Array[],
    right: Float32Array[],
  ): Promise<CosineResult> {
    if (!this.cosineSession) {
      throw new Error("Engine not initialized, call init() first");
    }

    const rows = left.length;
    const cols = right.length;
    const dim = this.config.embeddingDim;

    if (rows === 0 || cols === 0) {
      throw new Error("Cannot compute cosine matrix with empty input");
    }

    const leftFlat = new Float32Array(rows * dim);
    for (let i = 0; i < rows; i++) {
      leftFlat.set(left[i].subarray(0, dim), i * dim);
    }

    const rightFlat = new Float32Array(cols * dim);
    for (let i = 0; i < cols; i++) {
      rightFlat.set(right[i].subarray(0, dim), i * dim);
    }

    const leftTensor = new ort.Tensor("float32", leftFlat, [rows, dim]);
    const rightTensor = new ort.Tensor("float32", rightFlat, [cols, dim]);

    const inputs = this.cosineSession.inputNames;
    const outputs = this.cosineSession.outputNames;

    const start = performance.now();
    const result = await this.cosineSession.run({
      [inputs[0]]: leftTensor,
      [inputs[1]]: rightTensor,
    });
    const elapsed = performance.now() - start;

    const outputData = result[outputs[0]].data as Float32Array;

    return {
      matrix: outputData,
      rows,
      cols,
      source: this.activeBackend,
      elapsed_ms: Math.round(elapsed * 100) / 100,
    };
  }

  async embed(text: string): Promise<EmbedResult | null> {
    if (!this.embeddingSession) return null;

    const inputs = this.embeddingSession.inputNames;
    const outputs = this.embeddingSession.outputNames;

    const encoder = new TextEncoder();
    const encoded = encoder.encode(text);
    const inputTensor = new ort.Tensor("uint8", encoded, [1, encoded.length]);

    const start = performance.now();
    const result = await this.embeddingSession.run({
      [inputs[0]]: inputTensor,
    });
    const elapsed = performance.now() - start;

    const vector = result[outputs[0]].data as Float32Array;

    return {
      vector,
      source: this.activeBackend,
      elapsed_ms: Math.round(elapsed * 100) / 100,
    };
  }

  async cosineLocal(a: Float32Array, b: Float32Array): Promise<number> {
    const dim = Math.min(a.length, b.length);
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < dim; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom > 0 ? dot / denom : 0;
  }

  destroy(): void {
    this.cosineSession?.release();
    this.embeddingSession?.release();
    this.cosineSession = null;
    this.embeddingSession = null;
    this.diagnostics = null;
    this.initPromise = null;
  }
}

export type RemoteEmbeddingConfig = {
  /** Base URL for an embedding HTTP service (your own or a wrapper). */
  baseUrl: string;
  /** Model name / identifier understood by the remote service. */
  model?: string;
  /** Optional auth header value (e.g. Bearer ...). */
  authorization?: string;
  /** Endpoint path (default: /embed). */
  path?: string;
  /** Request timeout in ms (default: 30s). */
  timeoutMs?: number;
};

/**
 * Minimal embedding function compatible with the needs of @promethean-os/persistence.
 *
 * It is intentionally small and permissive:
 * - If a remote endpoint is unreachable, it returns empty vectors.
 * - The endpoint contract is:
 *   POST {baseUrl}{path}  { input: string[], model?: string }
 *   -> { vectors: number[][] }
 */
export class RemoteEmbeddingFunction {
  constructor(private cfg: RemoteEmbeddingConfig) {}

  static fromConfig(cfg: RemoteEmbeddingConfig): RemoteEmbeddingFunction {
    return new RemoteEmbeddingFunction(cfg);
  }

  async generate(texts: string[]): Promise<number[][]> {
    const { baseUrl, model, authorization, path = "/embed", timeoutMs = 30_000 } = this.cfg;

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authorization ? { Authorization: authorization } : {}),
        },
        body: JSON.stringify({ input: texts, model }),
        signal: controller.signal,
      });

      if (!res.ok) {
        return texts.map(() => []);
      }

      const json = (await res.json()) as unknown;
      const vectors = (json as any)?.vectors;
      if (Array.isArray(vectors)) {
        return vectors as number[][];
      }

      // Fallback: support OpenAI-style shape: data: [{ embedding: [...] }]
      const data = (json as any)?.data;
      if (Array.isArray(data)) {
        return data.map((d: any) => (Array.isArray(d?.embedding) ? d.embedding : []));
      }

      return texts.map(() => []);
    } catch {
      return texts.map(() => []);
    } finally {
      clearTimeout(t);
    }
  }
}

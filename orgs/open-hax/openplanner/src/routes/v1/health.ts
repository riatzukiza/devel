import type { FastifyPluginAsync } from "fastify";

const VEXX_BASE_URL = String(process.env.VEXX_BASE_URL ?? "").trim();
const VEXX_API_KEY = String(process.env.VEXX_API_KEY ?? "").trim();
const VEXX_ENFORCE = /^(1|true|yes|on)$/i.test(String(process.env.VEXX_ENFORCE ?? ""));
const HEALTH_DEEP_DEFAULT = /^(1|true|yes|on)$/i.test(String(process.env.OPENPLANNER_HEALTH_DEEP_DEFAULT ?? ""));
const HEALTH_MONGO_TIMEOUT_MS = Math.max(250, Math.min(10_000, Number(process.env.OPENPLANNER_HEALTH_MONGO_TIMEOUT_MS ?? 1500)));

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function checkMongoPing(app: any): Promise<{ ok: boolean; error?: string }> {
  try {
    await withTimeout(app.mongo.db.command({ ping: 1 }), HEALTH_MONGO_TIMEOUT_MS, "mongodb ping");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function checkVectorHealth(app: any): Promise<{ ok: boolean; error?: string }> {
  try {
    await withTimeout(app.mongo.db.command({ ping: 1 }), HEALTH_MONGO_TIMEOUT_MS, "mongodb ping");
    const [hotIndex, compactIndex] = await Promise.all([
      app.mongo.hotVectors.indexExists("parent_id_1_chunk_index_1"),
      app.mongo.compactVectors.indexExists("parent_id_1"),
    ]);
    if (!hotIndex || !compactIndex) {
      return {
        ok: false,
        error: `missing vector indexes: hot=${String(hotIndex)} compact=${String(compactIndex)}`,
      };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function checkEmbeddingHealth(app: any): Promise<{ ok: boolean; error?: string }> {
  const embeddingRuntime = (app as any).embeddingRuntime;

  try {
    await embeddingRuntime.hot.getEmbeddingFunction({}).generate(["openplanner healthcheck"]);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function checkVexxHealth(): Promise<{ ok: boolean; enabled: boolean; error?: string; defaultDevice?: string }> {
  if (!VEXX_BASE_URL) {
    return { ok: true, enabled: false };
  }

  try {
    const response = await fetch(`${VEXX_BASE_URL.replace(/\/$/, "")}/v1/health`, {
      headers: VEXX_API_KEY ? { Authorization: `Bearer ${VEXX_API_KEY}` } : undefined,
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return { ok: false, enabled: true, error: `${response.status} ${response.statusText}${detail ? `: ${detail.slice(0, 200)}` : ""}` };
    }
    const payload = await response.json() as { defaultDevice?: unknown };
    return {
      ok: true,
      enabled: true,
      defaultDevice: typeof payload.defaultDevice === "string" ? payload.defaultDevice : undefined,
    };
  } catch (error) {
    return { ok: false, enabled: true, error: error instanceof Error ? error.message : String(error) };
  }
}

async function checkGraphLayoutHealth(app: any): Promise<{ ok: boolean; error?: string }> {
  try {
    await withTimeout(app.mongo.db.command({ ping: 1 }), HEALTH_MONGO_TIMEOUT_MS, "mongodb ping");
    const [nodeIdIndex, updatedIndex] = await Promise.all([
      app.mongo.graphLayoutOverrides.indexExists("node_id_1"),
      app.mongo.graphLayoutOverrides.indexExists("updated_at_-1"),
    ]);
    if (!nodeIdIndex || !updatedIndex) {
      return {
        ok: false,
        error: `missing layout indexes: node_id=${String(nodeIdIndex)} updated_at=${String(updatedIndex)}`,
      };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function getDependencyHealth(app: any) {
  const [vectorStore, embeddings, vexx, graphLayout] = await Promise.all([
    checkVectorHealth(app),
    checkEmbeddingHealth(app),
    checkVexxHealth(),
    checkGraphLayoutHealth(app),
  ]);
  return { vectorStore, embeddings, vexx, graphLayout };
}

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/health", async (req: any, reply) => {
    const embeddingRuntime = (app as any).embeddingRuntime;
    const deep = req.query?.deep === "true" || req.query?.deep === true || HEALTH_DEEP_DEFAULT;
    const mongo = deep ? { ok: true as const } : await checkMongoPing(app);
    const dependencyHealth = deep
      ? await getDependencyHealth(app)
      : {
          mongo,
          vectorStore: { ok: true, skipped: true },
          embeddings: { ok: true, skipped: true },
          vexx: { ok: true, enabled: Boolean(VEXX_BASE_URL), skipped: true },
          graphLayout: { ok: true, skipped: true },
        };
    const ok = deep
      ? dependencyHealth.vectorStore.ok &&
        dependencyHealth.embeddings.ok &&
        dependencyHealth.graphLayout.ok &&
        (VEXX_ENFORCE ? dependencyHealth.vexx.ok : true)
      : mongo.ok;
    reply.code(ok ? 200 : 503);
    return {
      ok,
      mode: deep ? "deep" : "shallow",
      time: new Date().toISOString(),
      storageBackend: "mongodb",
      ftsEnabled: true,
      kafka: app.kafkaEvents?.status?.() ?? { enabled: false },
      vexx: {
        enforce: VEXX_ENFORCE,
      },
      vectorCollections: {
        hot: app.mongo.hotVectors.collectionName,
        compact: app.mongo.compactVectors.collectionName,
      },
      graphCollections: {
        layout: app.mongo.graphLayoutOverrides.collectionName,
      },
      embeddingModels: {
        hot: embeddingRuntime.hot.getModel({}),
        compact: embeddingRuntime.compact.getModel(),
      },
      dependencies: dependencyHealth,
    };
  });
};

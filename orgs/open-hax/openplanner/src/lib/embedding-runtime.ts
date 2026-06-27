import type { OpenPlannerConfig } from "./config.js";
import { PersistentEmbeddingCache } from "./embedding-cache.js";
import { resolveEmbeddingModel } from "./embedding-models.js";
import { EmbedProviderFunction, ParallelEmbeddingPool } from "./embeddings.js";

export type EmbeddingRuntime = {
  hot: {
    getModel: (scope: { source?: string; kind?: string; project?: string }) => string;
    getEmbeddingFunction: (scope: { source?: string; kind?: string; project?: string }) => EmbedProviderFunction;
    getEmbeddingFunctionForModel: (model: string) => EmbedProviderFunction;
    getBackgroundEmbeddingFunction: (scope: { source?: string; kind?: string; project?: string }) => EmbedProviderFunction;
    getBackgroundEmbeddingFunctionForModel: (model: string) => EmbedProviderFunction;
    getParallelPool: (scope: { source?: string; kind?: string; project?: string }) => ParallelEmbeddingPool;
    getParallelPoolForModel: (model: string) => ParallelEmbeddingPool;
  };
  compact: {
    getModel: () => string;
    getEmbeddingFunction: () => EmbedProviderFunction;
    getEmbeddingFunctionForModel: (model: string) => EmbedProviderFunction;
    getBackgroundEmbeddingFunction: () => EmbedProviderFunction;
    getBackgroundEmbeddingFunctionForModel: (model: string) => EmbedProviderFunction;
    getParallelPool: () => ParallelEmbeddingPool;
    getParallelPoolForModel: (model: string) => ParallelEmbeddingPool;
  };
};

export function createEmbeddingRuntime(cfg: OpenPlannerConfig): EmbeddingRuntime {
  const interactiveCache = new Map<string, EmbedProviderFunction>();
  const backgroundCache = new Map<string, EmbedProviderFunction>();
  const parallelPoolCache = new Map<string, ParallelEmbeddingPool>();
  const persistentCache = new PersistentEmbeddingCache(cfg.embedProviderCachePath);

  const makeEmbeddingFunction = (model: string, opts?: { maxConcurrentBatches?: number }): EmbedProviderFunction => new EmbedProviderFunction(model, cfg.embedProviderBaseUrl, {
    apiKey: cfg.embedProviderApiKey,
    cache: persistentCache,
    batchWindowMs: cfg.embedProviderBatchWindowMs,
    maxBatchItems: cfg.embedProviderMaxBatchItems,
    maxConcurrentBatches: opts?.maxConcurrentBatches ?? 1,
  });

  const makeParallelPool = (model: string): ParallelEmbeddingPool => new ParallelEmbeddingPool(model, cfg.embedProviderBaseUrl, {
    apiKey: cfg.embedProviderApiKey,
    cache: persistentCache,
    batchWindowMs: cfg.embedProviderBatchWindowMs,
    maxBatchItems: cfg.embedProviderMaxBatchItems,
    workerCount: 4,
  });

  const getEmbeddingFunctionForModel = (model: string): EmbedProviderFunction => {
    const cached = interactiveCache.get(model);
    if (cached) return cached;
    const created = makeEmbeddingFunction(model, { maxConcurrentBatches: 2 });
    interactiveCache.set(model, created);
    return created;
  };

  const getBackgroundEmbeddingFunctionForModel = (model: string): EmbedProviderFunction => {
    const cached = backgroundCache.get(model);
    if (cached) return cached;
    const created = makeEmbeddingFunction(model, { maxConcurrentBatches: 6 });
    backgroundCache.set(model, created);
    return created;
  };

  const getParallelPoolForModel = (model: string): ParallelEmbeddingPool => {
    const cached = parallelPoolCache.get(model);
    if (cached) return cached;
    const created = makeParallelPool(model);
    parallelPoolCache.set(model, created);
    return created;
  };

  const getHotModel = (scope: { source?: string; kind?: string; project?: string }): string =>
    resolveEmbeddingModel(cfg.embeddingModels, scope);

  return {
    hot: {
      getModel: getHotModel,
      getEmbeddingFunction: (scope) => getEmbeddingFunctionForModel(getHotModel(scope)),
      getEmbeddingFunctionForModel,
      getBackgroundEmbeddingFunction: (scope) => getBackgroundEmbeddingFunctionForModel(getHotModel(scope)),
      getBackgroundEmbeddingFunctionForModel,
      getParallelPool: (scope) => getParallelPoolForModel(getHotModel(scope)),
      getParallelPoolForModel,
    },
    compact: {
      getModel: () => cfg.compactEmbedModel,
      getEmbeddingFunction: () => getEmbeddingFunctionForModel(cfg.compactEmbedModel),
      getEmbeddingFunctionForModel,
      getBackgroundEmbeddingFunction: () => getBackgroundEmbeddingFunctionForModel(cfg.compactEmbedModel),
      getBackgroundEmbeddingFunctionForModel,
      getParallelPool: () => getParallelPoolForModel(cfg.compactEmbedModel),
      getParallelPoolForModel,
    },
  };
}

import path from "node:path";
import { parseModelMap, type EmbeddingModelConfig } from "./embedding-models.js";

export type OpenPlannerConfig = {
  dataDir: string;
  host: string;
  port: number;
  apiKey: string;
  chromaUrl: string;
  chromaCollection: string;
  ollamaBaseUrl: string;
  embeddingModels: EmbeddingModelConfig;
  ollamaEmbedTruncate: boolean;
  ollamaEmbedNumCtx?: number;
};

function mustGet(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function loadConfig(): OpenPlannerConfig {
  const dataDir = mustGet("OPENPLANNER_DATA_DIR", "./openplanner-lake");
  const host = mustGet("OPENPLANNER_HOST", "127.0.0.1");
  const port = Number(mustGet("OPENPLANNER_PORT", "7777"));
  const apiKey = mustGet("OPENPLANNER_API_KEY", "change-me");
  const chromaUrl = mustGet("CHROMA_URL", "http://127.0.0.1:8000");
  const chromaCollection = mustGet("CHROMA_COLLECTION", "openplanner_events_v1");
  const ollamaBaseUrl = mustGet("OLLAMA_BASE_URL", mustGet("OLLAMA_URL", "http://localhost:11434"));
  const defaultEmbedModel = mustGet("OLLAMA_EMBED_MODEL", "qwen3-embedding:0.6b");
  const ollamaEmbedTruncate = (process.env.OLLAMA_EMBED_TRUNCATE ?? "true").toLowerCase() !== "false";
  const ollamaEmbedNumCtxRaw = (process.env.OLLAMA_EMBED_NUM_CTX ?? "").trim();
  const ollamaEmbedNumCtx = ollamaEmbedNumCtxRaw.length > 0 ? Number(ollamaEmbedNumCtxRaw) : undefined;
  const finalOllamaEmbedNumCtx = Number.isFinite(ollamaEmbedNumCtx as number) ? (ollamaEmbedNumCtx as number) : undefined;
  const embeddingModels: EmbeddingModelConfig = {
    defaultModel: defaultEmbedModel,
    bySource: parseModelMap(process.env.OLLAMA_EMBED_MODEL_BY_SOURCE),
    byKind: parseModelMap(process.env.OLLAMA_EMBED_MODEL_BY_KIND),
    byProject: parseModelMap(process.env.OLLAMA_EMBED_MODEL_BY_PROJECT)
  };

  return {
    dataDir: path.resolve(dataDir),
    host,
    port,
    apiKey,
    chromaUrl,
    chromaCollection,
    ollamaBaseUrl,
    embeddingModels,
    ollamaEmbedTruncate,
    ollamaEmbedNumCtx: finalOllamaEmbedNumCtx
  };
}

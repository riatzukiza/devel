import path from "node:path";

export type OpenPlannerConfig = {
  dataDir: string;
  host: string;
  port: number;
  apiKey: string;
  chromaUrl: string;
  chromaCollection: string;
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

  return {
    dataDir: path.resolve(dataDir),
    host,
    port,
    apiKey,
    chromaUrl,
    chromaCollection
  };
}

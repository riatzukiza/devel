export type SemanticGraphBuilderConfig = {
  mongoUri: string;
  mongoDbName: string;
  lakeDir: string;
  embeddingModel: string;
  embeddingDimensions: number;
  kOut: number;
  candidateFactor: number;
};

export function parseConfig(fromEnv: Record<string, string | undefined>): SemanticGraphBuilderConfig {
  const mongoUri = (fromEnv.MONGODB_URI ?? fromEnv.MONGO_URL ?? "").trim();
  if (!mongoUri) throw new Error("MONGODB_URI is required");

  const mongoDbName = (fromEnv.MONGODB_DB_NAME ?? fromEnv.MONGO_DB_NAME ?? "").trim();
  if (!mongoDbName) throw new Error("MONGODB_DB_NAME is required");

  const lakeDir = (fromEnv.OPENPLANNER_LAKE_DIR ?? "").trim() || "openplanner-lake";
  const embeddingModel = (fromEnv.EMBEDDING_MODEL ?? "").trim() || "qwen3-embedding:0.6b";
  const embeddingDimensions = Math.max(1, Math.floor(Number(fromEnv.EMBEDDING_DIMENSIONS ?? 1024)));
  const kOut = Math.max(1, Math.min(512, Math.floor(Number(fromEnv.K_OUT ?? 64))));
  const candidateFactor = Math.max(1, Math.min(20, Math.floor(Number(fromEnv.CANDIDATE_FACTOR ?? 8))));

  return {
    mongoUri,
    mongoDbName,
    lakeDir,
    embeddingModel,
    embeddingDimensions,
    kOut,
    candidateFactor,
  };
}
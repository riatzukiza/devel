import { ChromaClient, type IEmbeddingFunction } from "chromadb";
import type { EmbeddingScope } from "./embedding-models.js";

export type Chroma = {
  client: ChromaClient;
  collectionName: string;
  embeddingFunction?: IEmbeddingFunction;
  embeddingFunctionFor?: (scope: EmbeddingScope) => IEmbeddingFunction;
  resolveEmbeddingModel?: (scope: EmbeddingScope) => string;
};

export async function openChroma(
  chromaUrl: string,
  collectionName: string,
  embeddingFunction?: IEmbeddingFunction,
  embeddingFunctionFor?: (scope: EmbeddingScope) => IEmbeddingFunction,
  resolveEmbeddingModel?: (scope: EmbeddingScope) => string
): Promise<Chroma> {
  if (chromaUrl === "disabled") {
    const client = new ChromaClient({ path: "http://127.0.0.1:0" });
    return { client, collectionName, embeddingFunction, embeddingFunctionFor, resolveEmbeddingModel };
  }

  const client = new ChromaClient({ path: chromaUrl });
  const defaultEmbeddingFunction = embeddingFunction ?? embeddingFunctionFor?.({});

  // Ensure collection exists
  try {
    await client.getCollection({ name: collectionName, embeddingFunction: defaultEmbeddingFunction as any });
  } catch {
    await client.createCollection({ name: collectionName, embeddingFunction: defaultEmbeddingFunction as any });
  }

  return {
    client,
    collectionName,
    embeddingFunction: defaultEmbeddingFunction,
    embeddingFunctionFor,
    resolveEmbeddingModel
  };
}

import { ChromaClient, type IEmbeddingFunction } from "chromadb";

export type Chroma = {
  client: ChromaClient;
  collectionName: string;
  embeddingFunction?: IEmbeddingFunction;
};

export async function openChroma(chromaUrl: string, collectionName: string, embeddingFunction?: IEmbeddingFunction): Promise<Chroma> {
  if (chromaUrl === "disabled") {
    const client = new ChromaClient({ path: "http://127.0.0.1:0" });
    return { client, collectionName, embeddingFunction };
  }

  const client = new ChromaClient({ path: chromaUrl });

  // Ensure collection exists
  try {
    await client.getCollection({ name: collectionName, embeddingFunction: embeddingFunction as any });
  } catch {
    await client.createCollection({ name: collectionName, embeddingFunction: embeddingFunction as any });
  }

  return { client, collectionName, embeddingFunction };
}

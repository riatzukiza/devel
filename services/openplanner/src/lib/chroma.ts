import { ChromaClient } from "chromadb";

export type Chroma = {
  client: ChromaClient;
  collectionName: string;
};

export async function openChroma(chromaUrl: string, collectionName: string): Promise<Chroma> {
  if (chromaUrl === "disabled") {
    const client = new ChromaClient({ path: "http://127.0.0.1:0" });
    return { client, collectionName };
  }

  const client = new ChromaClient({ path: chromaUrl });

  // Ensure collection exists
  try {
    await client.getCollection({ name: collectionName, embeddingFunction: undefined as any });
  } catch {
    await client.createCollection({ name: collectionName });
  }

  return { client, collectionName };
}

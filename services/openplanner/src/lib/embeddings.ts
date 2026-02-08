import { IEmbeddingFunction } from "chromadb";

export class OllamaEmbeddingFunction implements IEmbeddingFunction {
  private model: string;
  private url: string;

  constructor(model: string, url: string = "http://localhost:11434") {
    this.model = model;
    this.url = url;
  }

  async generate(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (const text of texts) {
      try {
        const res = await fetch(`${this.url}/api/embeddings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: this.model, prompt: text }),
        });

        if (!res.ok) {
          console.error(`Ollama embedding failed: ${res.statusText}`);
          embeddings.push(new Array(768).fill(0));
          continue;
        }

        const data = await res.json() as { embedding: number[] };
        embeddings.push(data.embedding);
      } catch (err) {
        console.error("Ollama embedding error:", err);
        embeddings.push(new Array(768).fill(0));
      }
    }
    return embeddings;
  }
}

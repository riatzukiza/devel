/**
 * Embedding Service
 * 
 * Generates embeddings using Ollama with qwen3-embedding:0.6b model
 */

export interface EmbeddingConfig {
  baseUrl: string;
  model: string;
  contextSize: number;
}

export class EmbeddingService {
  private config: EmbeddingConfig;

  constructor(config: EmbeddingConfig) {
    this.config = config;
  }

  /**
   * Generate embeddings for a single text
   */
  async embed(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          prompt: text,
          options: {
            num_ctx: this.config.contextSize
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json() as { embedding: number[] };
      return data.embedding;
    } catch (error) {
      console.error('[Embedding] Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      try {
        const embedding = await this.embed(text);
        embeddings.push(embedding);
      } catch (error) {
        console.error('[Embedding] Error in batch:', error);
        embeddings.push([]);
      }
    }

    return embeddings;
  }
}

export { createDefaultEmbeddingConfig } from '../config/defaults.js';

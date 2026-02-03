/**
 * ChromaDB Client
 * 
 * Vector database client for storing and retrieving memory embeddings
 */

import { ChromaClient, Collection, IncludeEnum } from 'chromadb';
import type { EmbeddingService } from '../embeddings/service.js';
import type { ChromaConfig } from '../types/index.js';
export type { ChromaConfig };

export interface MemoryDocument {
  id: string;
  content: string;
  metadata: {
    cephalonId: string;
    sessionId: string;
    timestamp: number;
    kind: string;
    source: string;
  };
}

export interface SearchResult {
  id: string;
  content: string;
  metadata: MemoryDocument['metadata'];
  distance: number;
}

export class ChromaMemoryStore {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private config: ChromaConfig;
  private embeddingService: EmbeddingService;

  // Retry configuration
  protected readonly maxRetries = 5;
  protected readonly initialDelayMs = 1000;
  protected readonly maxDelayMs = 30000;
  protected readonly backoffMultiplier = 2;

  constructor(config: ChromaConfig, embeddingService: EmbeddingService) {
    this.config = config;
    this.embeddingService = embeddingService;
    this.client = new ChromaClient({ path: config.url });
  }

  /**
   * Calculate exponential backoff delay with jitter
   * Protected for testing purposes
   */
  protected calculateBackoff(attempt: number): number {
    const baseDelay = this.initialDelayMs * Math.pow(this.backoffMultiplier, attempt - 1);
    const jitter = Math.random() * 0.3 * baseDelay; // 0-30% jitter
    return Math.min(baseDelay + jitter, this.maxDelayMs);
  }

  /**
   * Check if an error is retryable (network/connection errors)
   * Protected for testing purposes
   */
  protected isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      // Check for common connection refused/network errors
      if (message.includes('econnrefused') ||
          message.includes('ECONNREFUSED') ||
          message.includes('connect') ||
          message.includes('network') ||
          message.includes('socket') ||
          message.includes('timeout') ||
          message.includes('ETIMEDOUT') ||
          message.includes('temporary') ||
          message.includes('refused')) {
        return true;
      }
    }
    return false;
  }

  async initialize(): Promise<void> {
    console.log(`[Chroma] Initializing connection to ${this.config.url}`);

    let lastError: unknown;
    let attempt = 1;

    while (attempt <= this.maxRetries) {
      try {
        this.collection = await this.client.getOrCreateCollection({
          name: this.config.collectionName,
          metadata: { description: 'Cephalon memory store' }
        });

        console.log(`[Chroma] Connected to collection: ${this.config.collectionName}`);
        return; // Success - exit the retry loop
      } catch (error) {
        lastError = error;

        // Check if we should retry
        if (!this.isRetryableError(error) || attempt >= this.maxRetries) {
          // Non-retryable error or max retries reached - fail immediately
          console.error(`[Chroma] Failed to initialize (non-retryable or max retries):`, error);
          throw error;
        }

        // Calculate and apply backoff
        const delay = this.calculateBackoff(attempt);
        console.warn(`[Chroma] Connection attempt ${attempt}/${this.maxRetries} failed: ${error instanceof Error ? error.message : String(error)}`);
        console.log(`[Chroma] Retrying in ${Math.round(delay)}ms...`);

        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }

    // Should not reach here, but handle edge case
    console.error('[Chroma] Failed to initialize after all retry attempts:', lastError);
    throw lastError;
  }

  async addMemory(document: MemoryDocument): Promise<void> {
    if (!this.collection) {
      throw new Error('Chroma not initialized');
    }

    try {
      const embedding = await this.embeddingService.embed(document.content, {
        queueKey: document.metadata.sessionId,
      });

      await this.collection.add({
        ids: [document.id],
        documents: [document.content],
        embeddings: [embedding],
        metadatas: [document.metadata]
      });

      console.log(`[Chroma] Added memory: ${document.id}`);
    } catch (error) {
      console.error(`[Chroma] Error adding memory ${document.id}:`, error);
      throw error;
    }
  }

  async search(
    query: string,
    options: {
      limit?: number;
      filter?: Record<string, unknown>;
      queueKey?: string;
    } = {}
  ): Promise<SearchResult[]> {
    if (!this.collection) {
      throw new Error('Chroma not initialized');
    }

    const { limit = 5, filter, queueKey } = options;

    try {
      const queryEmbedding = await this.embeddingService.embed(query, {
        queueKey,
      });

      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        where: filter,
        include: [IncludeEnum.Documents, IncludeEnum.Metadatas, IncludeEnum.Distances]
      });

      const searchResults: SearchResult[] = [];

      if (results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          searchResults.push({
            id: results.ids[0][i],
            content: results.documents?.[0]?.[i] || '',
            metadata: (results.metadatas?.[0]?.[i] || {}) as MemoryDocument['metadata'],
            distance: results.distances?.[0]?.[i] || 0
          });
        }
      }

      console.log(`[Chroma] Search found ${searchResults.length} results for: "${query.slice(0, 50)}..."`);
      return searchResults;
    } catch (error) {
      console.error('[Chroma] Error searching:', error);
      throw error;
    }
  }

  async deleteMemory(id: string): Promise<void> {
    if (!this.collection) {
      throw new Error('Chroma not initialized');
    }

    try {
      await this.collection.delete({ ids: [id] });
      console.log(`[Chroma] Deleted memory: ${id}`);
    } catch (error) {
      console.error(`[Chroma] Error deleting memory ${id}:`, error);
      throw error;
    }
  }

  async getMemoryCount(): Promise<number> {
    if (!this.collection) {
      throw new Error('Chroma not initialized');
    }

    try {
      const count = await this.collection.count();
      return count;
    } catch (error) {
      console.error('[Chroma] Error getting count:', error);
      return 0;
    }
  }
}

export { createDefaultChromaConfig } from '../config/defaults.js';

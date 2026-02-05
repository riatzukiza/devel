/**
 * MongoDB Memory Store - Full Memory persistence
 *
 * See migration path in README_MIGRATION.md
 * This MVP implementation stores everything in MongoDB for simplicity.
 */

import { MongoClient, Db, Collection } from 'mongodb';
import { cosineSimilarity } from '../utils/vector-math.js';
import type {
  Memory,
  UUID,
  MemoryKind,
  InclusionLog,
} from '../types/index.js';
import type { MemoryStore } from './memory-store.js';
import type { OpenPlannerClient } from '../openplanner/client.js';

export interface MongoDBMemoryStoreConfig {
  cephalonId: string;
  uri?: string;
  databaseName?: string;
  collectionName?: string;
  openPlannerClient?: OpenPlannerClient;
}

export class MongoDBMemoryStore implements MemoryStore {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collection: Collection<Memory> | null = null;
  private cephalonId: string;
  private config: MongoDBMemoryStoreConfig;

  constructor(config: MongoDBMemoryStoreConfig) {
    this.cephalonId = config.cephalonId;
    this.config = {
      databaseName: 'cephalon',
      collectionName: 'memories',
      ...config,
    };
  }

  async initialize(): Promise<void> {
    const uri =
      this.config.uri || process.env.MONGODB_URI || process.env.MCP_MONGO_URI || 'mongodb://localhost:27017';

    console.log(`[MongoDBMemoryStore] Connecting to ${uri}`);

    this.client = new MongoClient(uri);
    await this.client.connect();

    this.db = this.client.db(this.config.databaseName!);
    this.collection = this.db.collection<Memory>(this.config.collectionName!);

    // Create indexes for common query patterns
    await this.collection.createIndex({ id: 1 }, { unique: true });
    await this.collection.createIndex({ sessionId: 1, timestamp: -1 });
    await this.collection.createIndex({ 'retrieval.pinned': 1, timestamp: -1 });
    await this.collection.createIndex({ 'lifecycle.deleted': 1 });
    await this.collection.createIndex({ 'source.channelId': 1, timestamp: -1 });
    await this.collection.createIndex({ 'source.authorId': 1 });
    await this.collection.createIndex({ eventId: 1 });

    const count = await this.collection.countDocuments({});
    console.log(
      `[MongoDBMemoryStore] Initialized with ${count} existing memories`,
    );
  }

  async insert(memory: Memory): Promise<void> {
    if (!this.collection) {
      throw new Error('MongoDBMemoryStore not initialized');
    }

    try {
      await this.collection.insertOne(memory);
      console.log(`[MongoDBMemoryStore] Inserted memory: ${memory.id}`);
      if (this.config.openPlannerClient) {
        try {
          await this.config.openPlannerClient.emitMemoryCreated(memory);
        } catch (error) {
          console.error(
            `[MongoDBMemoryStore] Error emitting memory ${memory.id} to OpenPlanner:`,
            error,
          );
        }
      }
    } catch (error) {
      // Duplicate key error is acceptable (memory already exists)
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: number }).code === 11000
      ) {
        console.log(
          `[MongoDBMemoryStore] Memory ${memory.id} already exists, skipping`,
        );
        return;
      }
      throw error;
    }
  }

  async findById(id: UUID): Promise<Memory | null> {
    if (!this.collection) {
      throw new Error('MongoDBMemoryStore not initialized');
    }

    return this.collection.findOne(
      { id, 'lifecycle.deleted': false },
    ) as unknown as Promise<Memory | null>;
  }

  async findByEventId(eventId: UUID): Promise<Memory[]> {
    if (!this.collection) {
      throw new Error('MongoDBMemoryStore not initialized');
    }

    return this.collection
      .find({ eventId, 'lifecycle.deleted': false })
      .toArray() as unknown as Promise<Memory[]>;
  }

  async update(id: UUID, updates: Partial<Memory>): Promise<void> {
    if (!this.collection) {
      throw new Error('MongoDBMemoryStore not initialized');
    }

    const result = await this.collection.updateOne(
      { id },
      { $set: updates },
    );

    if (result.matchedCount === 0) {
      throw new Error(`Memory not found: ${id}`);
    }
  }

  async findRecent(sessionId: string, limit: number): Promise<Memory[]> {
    if (!this.collection) {
      throw new Error('MongoDBMemoryStore not initialized');
    }

    return this.collection
      .find(
        { sessionId, 'lifecycle.deleted': false },
        { sort: { timestamp: -1 }, limit },
      )
      .toArray() as unknown as Promise<Memory[]>;
  }

  async findByChannel(channelId: string, limit: number): Promise<Memory[]> {
    if (!this.collection) {
      throw new Error('MongoDBMemoryStore not initialized');
    }

    return this.collection
      .find(
        { 'source.channelId': channelId, 'lifecycle.deleted': false },
        { sort: { timestamp: -1 }, limit },
      )
      .toArray() as unknown as Promise<Memory[]>;
  }

  async findPinned(cephalonId: string): Promise<Memory[]> {
    if (!this.collection) {
      throw new Error('MongoDBMemoryStore not initialized');
    }

    return this.collection
      .find({
        cephalonId,
        'retrieval.pinned': true,
        'lifecycle.deleted': false,
      })
      .sort({ timestamp: 1 })
      .toArray() as unknown as Promise<Memory[]>;
  }

  async findGCCandidates(options: {
    ageMinDays: number;
    accessThreshold: number;
    excludeKinds: MemoryKind[];
    excludeTags: string[];
    limit: number;
  }): Promise<Memory[]> {
    if (!this.collection) {
      throw new Error('MongoDBMemoryStore not initialized');
    }

    const cutoffTime = Date.now() - options.ageMinDays * 24 * 60 * 60 * 1000;

    return this.collection
      .find(
        {
          'lifecycle.deleted': false,
          timestamp: { $lt: cutoffTime },
          'retrieval.pinned': false,
          'retrieval.lockedByAdmin': false,
          'retrieval.lockedBySystem': false,
          kind: { $nin: options.excludeKinds },
        },
        {
          sort: { 'usage.includedCountDecay': 1 },
          limit: options.limit,
        },
      )
      .toArray() as unknown as Promise<Memory[]>;
  }

  async findSimilar(
    vector: number[],
    options: {
      limit: number;
      filter?: Partial<Memory>;
    },
  ): Promise<Array<{ memory: Memory; similarity: number }>> {
    if (!this.collection) {
      throw new Error('MongoDBMemoryStore not initialized');
    }

    // Build MongoDB query from filter
    const query: Record<string, unknown> = {
      'lifecycle.deleted': false,
      'embedding.status': 'ready',
    };

    if (options.filter) {
      for (const [key, value] of Object.entries(options.filter)) {
        // Handle nested properties like 'retrieval.pinned'
        if (key.includes('.')) {
          const [parent, child] = key.split('.');
          query[parent] = { [child]: value };
        } else {
          query[key] = value;
        }
      }
    }

    // Fetch memories with embeddings
    const cursor = this.collection.find(query, { limit: options.limit * 2 });
    const memoriesWithEmbeddings = await cursor.toArray() as unknown as Memory[];

    // Calculate cosine similarity
    const scored = memoriesWithEmbeddings
      .filter((m) => m.embedding.vector && m.embedding.vector.length > 0)
      .map((m) => ({
        memory: m,
        similarity: cosineSimilarity(vector, m.embedding.vector!),
      }))
      .filter((item) => item.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, options.limit);

    return scored;
  }

  async logInclusion(inclusionLog: InclusionLog): Promise<void> {
    if (!this.collection) {
      throw new Error('MongoDBMemoryStore not initialized');
    }

    // Inclusion logs could be stored separately, but for MVP we store as memories
    // TODO: Consider separate collection for inclusion logs if they grow large
    const logMemory: Memory = {
      id: `inclusion-log:${inclusionLog.contextId}:${inclusionLog.timestamp}`,
      timestamp: Date.now(),
      cephalonId: this.cephalonId,
      sessionId: inclusionLog.sessionId,
      eventId: null,
      role: 'system',
      kind: 'summary',
      content: {
        text: `Context ${inclusionLog.contextId} included ${inclusionLog.items.length} items using ${inclusionLog.windowTokens} tokens`,
      },
      source: { type: 'system' },
      retrieval: {
        pinned: false,
        lockedByAdmin: false,
        lockedBySystem: true,
        weightKind: 1.0,
        weightSource: 1.0,
      },
      usage: {
        includedCountTotal: 1,
        includedCountDecay: 1,
        lastIncludedAt: Date.now(),
      },
      embedding: { status: 'none' },
      lifecycle: { deleted: false },
      hashes: { contentHash: '' },
      schemaVersion: 1,
    };

    await this.collection.insertOne(logMemory);
  }

  async updateAccessStats(memoryId: UUID, contextId: UUID): Promise<void> {
    if (!this.collection) {
      throw new Error('MongoDBMemoryStore not initialized');
    }

    const memory = await this.collection.findOne({ id: memoryId });
    if (!memory) {
      throw new Error(`Memory not found: ${memoryId}`);
    }

    const now = Date.now();
    const timeDelta = now - memory.usage.lastIncludedAt;
    const tau = 21 * 24 * 60 * 60 * 1000; // 21 days in ms

    // Exponential decay: count * e^(-Δt/τ) + 1
    const decayed =
      memory.usage.includedCountDecay * Math.exp(-timeDelta / tau) + 1;

    await this.collection.updateOne(
      { id: memoryId },
      {
        $set: {
          'usage.includedCountTotal': memory.usage.includedCountTotal + 1,
          'usage.includedCountDecay': decayed,
          'usage.lastIncludedAt': now,
        },
      },
    );
  }

  /**
   * Get all memories (for UI/debugging)
   * Note: This returns a Promise unlike InMemoryMemoryStore.sync version
   */
  async getAllMemories(): Promise<Memory[]> {
    if (!this.collection) {
      throw new Error('MongoDBMemoryStore not initialized');
    }

    const cursor = this.collection.find({ 'lifecycle.deleted': false });
    return cursor.toArray() as unknown as Promise<Memory[]>;
  }

  async getMemoryById(id: UUID): Promise<Memory | null> {
    if (!this.collection) {
      throw new Error('MongoDBMemoryStore not initialized');
    }

    return this.collection.findOne(
      { id, 'lifecycle.deleted': false },
    ) as unknown as Promise<Memory | null>;
  }

  async pinMemory(id: UUID, priority: number): Promise<void> {
    if (!this.collection) {
      throw new Error('MongoDBMemoryStore not initialized');
    }

    const result = await this.collection.updateOne(
      { id },
      { $set: { 'retrieval.pinned': true } },
    );

    if (result.matchedCount === 0) {
      throw new Error(`Memory not found: ${id}`);
    }
  }

  async unpinMemory(id: UUID): Promise<void> {
    if (!this.collection) {
      throw new Error('MongoDBMemoryStore not initialized');
    }

    const result = await this.collection.updateOne(
      { id },
      { $set: { 'retrieval.pinned': false } },
    );

    if (result.matchedCount === 0) {
      throw new Error(`Memory not found: ${id}`);
    }
  }

  clear(): void {
    console.warn('[MongoDBMemoryStore] clear() not implemented - MongoDB is persistent');
  }

  async count(): Promise<number> {
    if (!this.collection) {
      throw new Error('MongoDBMemoryStore not initialized');
    }

    return this.collection.countDocuments({ 'lifecycle.deleted': false });
  }

  /**
   * Gracefully close MongoDB connection
   * TODO: [MIGRATION PATH] When integrating with @promethean-os/persistence,
   * use the shared cleanupClients() function for proper resource cleanup
   */
  async cleanup(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.collection = null;
      console.log('[MongoDBMemoryStore] Connection closed');
    }
  }

  get size(): number {
    console.warn('[MongoDBMemoryStore] size() returning 0 - use count() for async operation');
    return 0;
  }
}

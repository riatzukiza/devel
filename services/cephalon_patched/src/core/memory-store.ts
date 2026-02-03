/**
 * Memory Store - Port/Adapter pattern for memory persistence
 *
 * Supports multiple backends:
 * - InMemory (for testing)
 * - MongoDB (production)
 * - ChromaDB (vector operations)
 */

import type { Memory, UUID, MemoryKind, InclusionLog } from "../types/index.js";
import type { ChromaMemoryStore } from "../chroma/client.js";

// ============================================================================
// Port (Interface)
// ============================================================================

export interface MemoryStore {
  // CRUD operations
  insert(memory: Memory): Promise<void>;
  findById(id: UUID): Promise<Memory | null>;
  findByEventId(eventId: UUID): Promise<Memory[]>;
  update(id: UUID, updates: Partial<Memory>): Promise<void>;

  // Retrieval operations
  findRecent(sessionId: string, limit: number): Promise<Memory[]>;
  findByChannel(channelId: string, limit: number): Promise<Memory[]>;
  findPinned(cephalonId: string): Promise<Memory[]>;

  // GC candidate query
  findGCCandidates(options: {
    ageMinDays: number;
    accessThreshold: number;
    excludeKinds: MemoryKind[];
    excludeTags: string[];
    limit: number;
  }): Promise<Memory[]>;

  // Vector operations
  findSimilar(
    vector: number[],
    options: {
      limit: number;
      filter?: Partial<Memory>;
    },
  ): Promise<Array<{ memory: Memory; similarity: number }>>;

  // Inclusion logging
  logInclusion(inclusionLog: InclusionLog): Promise<void>;

  // Access tracking
  updateAccessStats(memoryId: UUID, contextId: UUID): Promise<void>;
}

// ============================================================================
// In-Memory Adapter (for testing)
// ============================================================================

export class InMemoryMemoryStore implements MemoryStore {
  private memories = new Map<UUID, Memory>();
  private eventIndex = new Map<UUID, UUID[]>();
  private sessionIndex = new Map<string, UUID[]>();
  private channelIndex = new Map<string, UUID[]>();
  private inclusionLogs: InclusionLog[] = [];
  private chromaStore?: ChromaMemoryStore;

  constructor(chromaStore?: ChromaMemoryStore) {
    this.chromaStore = chromaStore;
  }

  async insert(memory: Memory): Promise<void> {
    this.memories.set(memory.id, memory);

    // Update event index
    if (memory.eventId) {
      const existing = this.eventIndex.get(memory.eventId) || [];
      existing.push(memory.id);
      this.eventIndex.set(memory.eventId, existing);
    }

    // Update session index
    const sessionMemories = this.sessionIndex.get(memory.sessionId) || [];
    sessionMemories.push(memory.id);
    this.sessionIndex.set(memory.sessionId, sessionMemories);

    // Update channel index
    if (memory.source.channelId) {
      const channelMemories =
        this.channelIndex.get(memory.source.channelId) || [];
      channelMemories.push(memory.id);
      this.channelIndex.set(memory.source.channelId, channelMemories);
    }

    // Also store in Chroma if available and embedding is ready
    if (
      this.chromaStore &&
      memory.embedding.status === "ready" &&
      memory.embedding.vector
    ) {
      try {
        await this.chromaStore.addMemory({
          id: memory.id,
          content: memory.content.text,
          metadata: {
            cephalonId: memory.cephalonId,
            sessionId: memory.sessionId,
            timestamp: memory.timestamp,
            kind: memory.kind,
            source: memory.source.type,
          },
        });
      } catch (error) {
        console.error("[MemoryStore] Error storing in Chroma:", error);
      }
    }
  }

  async findById(id: UUID): Promise<Memory | null> {
    return this.memories.get(id) || null;
  }

  async findByEventId(eventId: UUID): Promise<Memory[]> {
    const memoryIds = this.eventIndex.get(eventId) || [];
    return memoryIds
      .map((id) => this.memories.get(id))
      .filter((m): m is Memory => m !== undefined);
  }

  async update(id: UUID, updates: Partial<Memory>): Promise<void> {
    const existing = this.memories.get(id);
    if (!existing) {
      throw new Error(`Memory not found: ${id}`);
    }

    this.memories.set(id, { ...existing, ...updates });
  }

  async findRecent(sessionId: string, limit: number): Promise<Memory[]> {
    const memoryIds = this.sessionIndex.get(sessionId) || [];
    return memoryIds
      .map((id) => this.memories.get(id))
      .filter((m): m is Memory => m !== undefined && !m.lifecycle.deleted)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async findByChannel(channelId: string, limit: number): Promise<Memory[]> {
    const memoryIds = this.channelIndex.get(channelId) || [];
    return memoryIds
      .map((id) => this.memories.get(id))
      .filter((m): m is Memory => m !== undefined && !m.lifecycle.deleted)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async findPinned(cephalonId: string): Promise<Memory[]> {
    return Array.from(this.memories.values())
      .filter(
        (m) =>
          m.cephalonId === cephalonId &&
          m.retrieval.pinned &&
          !m.lifecycle.deleted,
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  async findGCCandidates(options: {
    ageMinDays: number;
    accessThreshold: number;
    excludeKinds: MemoryKind[];
    excludeTags: string[];
    limit: number;
  }): Promise<Memory[]> {
    const cutoffTime = Date.now() - options.ageMinDays * 24 * 60 * 60 * 1000;

    return Array.from(this.memories.values())
      .filter((m) => {
        // Not deleted
        if (m.lifecycle.deleted) return false;

        // Old enough
        if (m.timestamp > cutoffTime) return false;

        // Low access
        if (m.usage.includedCountDecay >= options.accessThreshold) return false;

        // Not pinned/locked
        if (m.retrieval.pinned) return false;
        if (m.retrieval.lockedByAdmin) return false;
        if (m.retrieval.lockedBySystem) return false;

        // Not excluded kind
        if (options.excludeKinds.includes(m.kind)) return false;

        // Not excluded tags
        const hasExcludedTag = options.excludeTags.some(
          (tag) => m.retrieval.lockedBySystem, // Simplified - would check actual tags
        );
        if (hasExcludedTag) return false;

        return true;
      })
      .sort((a, b) => a.usage.includedCountDecay - b.usage.includedCountDecay)
      .slice(0, options.limit);
  }

  async findSimilar(
    vector: number[],
    options: {
      limit: number;
      filter?: Partial<Memory>;
    },
  ): Promise<Array<{ memory: Memory; similarity: number }>> {
    // Simple cosine similarity for in-memory store
    const memories = Array.from(this.memories.values()).filter((m) => {
      if (m.lifecycle.deleted) return false;
      if (m.embedding.status !== "ready") return false;
      if (!m.embedding.vector) return false;

      // Apply filters
      if (options.filter) {
        for (const [key, value] of Object.entries(options.filter)) {
          if ((m as unknown as Record<string, unknown>)[key] !== value) {
            return false;
          }
        }
      }

      return true;
    });

    const scored = memories.map((m) => ({
      memory: m,
      similarity: cosineSimilarity(vector, m.embedding.vector!),
    }));

    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, options.limit);
  }

  async logInclusion(inclusionLog: InclusionLog): Promise<void> {
    this.inclusionLogs.push(inclusionLog);
  }

  async updateAccessStats(memoryId: UUID, contextId: UUID): Promise<void> {
    const memory = this.memories.get(memoryId);
    if (!memory) return;

    const now = Date.now();
    const timeDelta = now - memory.usage.lastIncludedAt;
    const tau = 21 * 24 * 60 * 60 * 1000; // 21 days in ms

    // Exponential decay: count * e^(-Δt/τ) + 1
    const decayed =
      memory.usage.includedCountDecay * Math.exp(-timeDelta / tau) + 1;

    memory.usage.includedCountTotal += 1;
    memory.usage.includedCountDecay = decayed;
    memory.usage.lastIncludedAt = now;
  }

  getAllMemories(): Memory[] {
    return Array.from(this.memories.values());
  }

  getMemoryById(id: UUID): Memory | null {
    return this.memories.get(id) || null;
  }

  async pinMemory(id: UUID, priority: number): Promise<void> {
    const memory = this.memories.get(id);
    if (!memory) {
      throw new Error(`Memory not found: ${id}`);
    }
    memory.retrieval.pinned = true;
  }

  async unpinMemory(id: UUID): Promise<void> {
    const memory = this.memories.get(id);
    if (!memory) {
      throw new Error(`Memory not found: ${id}`);
    }
    memory.retrieval.pinned = false;
  }

  clear(): void {
    this.memories.clear();
    this.eventIndex.clear();
    this.sessionIndex.clear();
    this.channelIndex.clear();
    this.inclusionLogs = [];
  }

  get size(): number {
    return this.memories.size;
  }

  async initialize(): Promise<void> {
    // No-op for in-memory store
  }

  async cleanup(): Promise<void> {
    // No-op for in-memory store
  }
}

import { cosineSimilarity } from "../utils/vector-math.js";

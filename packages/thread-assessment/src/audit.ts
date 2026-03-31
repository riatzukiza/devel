import type { ThreadAssessmentPacket } from "./packet.js";
import type { ReducedThreadState } from "./reducer.js";

export type AuditEntry = {
  id: string;
  timestamp: string;
  type: "submission" | "reduction" | "query";
  threadId: string;
  modelId?: string;
  packet?: ThreadAssessmentPacket;
  reducedState?: ReducedThreadState;
  metadata?: Record<string, unknown>;
};

export type AuditStore = {
  append(entry: AuditEntry): Promise<void>;
  query(threadId?: string, type?: AuditEntry["type"]): Promise<AuditEntry[]>;
  get(id: string): Promise<AuditEntry | undefined>;
};

export function inMemoryAuditStore(): AuditStore {
  const entries: AuditEntry[] = [];
  const byId = new Map<string, AuditEntry>();

  return {
    async append(entry: AuditEntry): Promise<void> {
      entries.push(entry);
      byId.set(entry.id, entry);
    },

    async query(threadId?: string, type?: AuditEntry["type"]): Promise<AuditEntry[]> {
      let result = entries;
      if (threadId) {
        result = result.filter((e) => e.threadId === threadId);
      }
      if (type) {
        result = result.filter((e) => e.type === type);
      }
      return result;
    },

    async get(id: string): Promise<AuditEntry | undefined> {
      return byId.get(id);
    },
  };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function auditLog(store: AuditStore) {
  return {
    async logSubmission(
      packet: ThreadAssessmentPacket,
      metadata?: Record<string, unknown>,
    ): Promise<string> {
      const id = generateId();
      await store.append({
        id,
        timestamp: new Date().toISOString(),
        type: "submission",
        threadId: packet.thread_id,
        modelId: packet.model_id,
        packet,
        metadata,
      });
      return id;
    },

    async logReduction(
      state: ReducedThreadState,
      modelIds: string[],
      metadata?: Record<string, unknown>,
    ): Promise<string> {
      const id = generateId();
      await store.append({
        id,
        timestamp: new Date().toISOString(),
        type: "reduction",
        threadId: state.threadId,
        reducedState: state,
        metadata: {
          modelIds,
          ...metadata,
        },
      });
      return id;
    },

    async logQuery(
      threadId: string,
      query: Record<string, unknown>,
      result: "hit" | "miss",
    ): Promise<string> {
      const id = generateId();
      await store.append({
        id,
        timestamp: new Date().toISOString(),
        type: "query",
        threadId,
        metadata: { query, result },
      });
      return id;
    },

    async getThreadHistory(threadId: string): Promise<AuditEntry[]> {
      return store.query(threadId);
    },

    async getAllSubmissions(threadId: string): Promise<AuditEntry[]> {
      return store.query(threadId, "submission");
    },

    async getLatestReduction(threadId: string): Promise<AuditEntry | undefined> {
      const reductions = await store.query(threadId, "reduction");
      return reductions[reductions.length - 1];
    },
  };
}
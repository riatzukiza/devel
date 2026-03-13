import type { RadarAssessmentPacket, ReducedSnapshot } from "./schema.js";

export type AuditEntry = {
  id: string;
  timestamp: string;
  type: "submission" | "reduction" | "query" | "module_change";
  radarId: string;
  modelId?: string;
  packet?: RadarAssessmentPacket;
  reducedSnapshot?: ReducedSnapshot;
  metadata?: Record<string, unknown>;
};

export type AuditStore = {
  append(entry: AuditEntry): Promise<void>;
  query(radarId?: string, type?: AuditEntry["type"]): Promise<AuditEntry[]>;
};

export function createInMemoryAuditStore(): AuditStore {
  const entries: AuditEntry[] = [];
  return {
    async append(entry: AuditEntry): Promise<void> {
      entries.push(entry);
    },
    async query(radarId?: string, type?: AuditEntry["type"]): Promise<AuditEntry[]> {
      return entries.filter((entry) => {
        if (radarId && entry.radarId !== radarId) return false;
        if (type && entry.type !== type) return false;
        return true;
      });
    },
  };
}

function createAuditId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createAuditLogger(store: AuditStore) {
  return {
    async logSubmission(packet: RadarAssessmentPacket, metadata?: Record<string, unknown>): Promise<string> {
      const id = createAuditId();
      await store.append({ id, timestamp: new Date().toISOString(), type: "submission", radarId: packet.radar_id, modelId: packet.model_id, packet, metadata });
      return id;
    },
    async logReduction(snapshot: ReducedSnapshot, metadata?: Record<string, unknown>): Promise<string> {
      const id = createAuditId();
      await store.append({ id, timestamp: new Date().toISOString(), type: "reduction", radarId: snapshot.radar_id, reducedSnapshot: snapshot, metadata });
      return id;
    },
  };
}

// Placeholder thin wrapper around @promethean-os/persistence
// Adjust to your actual API.
import type { SessionIndexEvent } from "../types.js";

export interface PersistenceSink {
  indexEvent(ev: SessionIndexEvent): Promise<void>;
  indexDocs(docs: Array<{ id: string; repoId: string; kind: string; text: string; meta?: Record<string, unknown> }>): Promise<void>;
}

// Example no-op sink for development; replace with real implementation.
export class NoopPersistence implements PersistenceSink {
  async indexEvent(ev: SessionIndexEvent): Promise<void> {
    // Integrate with @promethean-os/persistence here
  }
  async indexDocs(_: Array<{ id: string; repoId: string; kind: string; text: string; meta?: Record<string, unknown> }>): Promise<void> {}
}
import type { MyrmexCheckpointEvent } from "./types.js";

export interface CheckpointManagerConfig {
  intervalMs: number;
}

export class CheckpointManager {
  private readonly config: CheckpointManagerConfig;

  constructor(config: CheckpointManagerConfig) {
    this.config = config;
  }

  async save(_event: MyrmexCheckpointEvent): Promise<void> {
    // Phase 3: persist to OpenPlanner or local file
    // For now, this is a no-op — checkpoint persistence lands later
  }
}

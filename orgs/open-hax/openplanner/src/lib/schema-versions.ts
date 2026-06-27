export const OPENPLANNER_SCHEMA_TARGETS = {
  event: 3,
  vectorChunk: 2,
  graphNode: 1,
} as const;

export type MigrationState = {
  applied: string[];
  verified_at: string;
  strategy: "new-write" | "lazy-object" | "crawl-batch" | "manual";
};

export function migrationState(params: {
  applied?: readonly string[];
  verifiedAt?: Date;
  strategy?: MigrationState["strategy"];
} = {}): MigrationState {
  return {
    applied: [...(params.applied ?? [])],
    verified_at: (params.verifiedAt ?? new Date()).toISOString(),
    strategy: params.strategy ?? "new-write",
  };
}

export function eventMigrationState(now = new Date()): MigrationState {
  return migrationState({
    applied: [
      "event/v1->v2-source-ref",
      "event/v2->v3-reference-first-text",
    ],
    verifiedAt: now,
    strategy: "new-write",
  });
}

export function vectorChunkMigrationState(now = new Date()): MigrationState {
  return migrationState({
    applied: ["vector/v1->v2-reference-first-chunk"],
    verifiedAt: now,
    strategy: "new-write",
  });
}

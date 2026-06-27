import { ContextSnapshot, SnapshotStore } from './types.js';
export declare class PostgresSnapshotStore implements SnapshotStore {
    private db;
    private cacheOptions?;
    private cache;
    private cachePromise;
    constructor(db: any, cacheOptions?: any | undefined);
    private initializeCache;
    private getCache;
    saveSnapshot(snapshot: ContextSnapshot): Promise<void>;
    getLatestSnapshot(agentId: string): Promise<ContextSnapshot | null>;
    getSnapshot(snapshotId: string): Promise<ContextSnapshot | null>;
    private mapRowToSnapshot;
}
//# sourceMappingURL=snapshot-manager.d.ts.map
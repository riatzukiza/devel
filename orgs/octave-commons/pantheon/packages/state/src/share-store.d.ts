import { ContextShare, ContextShareStore } from './types.js';
export declare class PostgresContextShareStore implements ContextShareStore {
    private db;
    private cacheOptions?;
    private cache;
    private cachePromise;
    constructor(db: any, cacheOptions?: any | undefined);
    private initializeCache;
    private getCache;
    createShare(share: Omit<ContextShare, 'id' | 'createdAt'>): Promise<ContextShare>;
    getSharesForAgent(agentId: string): Promise<ContextShare[]>;
    getSharedContexts(agentId: string): Promise<ContextShare[]>;
    revokeShare(shareId: string): Promise<void>;
    updateShare(shareId: string, updates: Partial<ContextShare>): Promise<ContextShare>;
    private mapRowToShare;
}
//# sourceMappingURL=share-store.d.ts.map
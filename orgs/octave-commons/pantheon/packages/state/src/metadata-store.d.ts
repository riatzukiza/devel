import { ContextMetadata, ContextMetadataStore, ContextQuery } from './types.js';
export interface DatabaseConnection {
    query(text: string, params?: any[]): Promise<DatabaseResult>;
}
export interface DatabaseResult {
    rows: any[];
    rowCount?: number;
}
export interface CacheOptions {
    path?: string;
    namespace?: string;
    ttl?: number;
}
export declare class PostgresContextMetadataStore implements ContextMetadataStore {
    private db;
    private cacheOptions?;
    private cache;
    private cachePromise;
    constructor(db: DatabaseConnection, cacheOptions?: CacheOptions | undefined);
    private initializeCache;
    private getCache;
    setMetadata(metadata: Omit<ContextMetadata, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContextMetadata>;
    getMetadata(agentId: string, key?: string): Promise<ContextMetadata[]>;
    updateMetadata(agentId: string, key: string, value: any): Promise<ContextMetadata>;
    deleteMetadata(agentId: string, key: string): Promise<void>;
    queryMetadata(query: ContextQuery): Promise<ContextMetadata[]>;
    cleanupExpired(): Promise<void>;
    private mapRowToMetadata;
}
//# sourceMappingURL=metadata-store.d.ts.map
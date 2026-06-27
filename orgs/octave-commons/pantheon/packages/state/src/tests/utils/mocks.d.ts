import { EventStore, SnapshotStore, ContextShareStore, ContextMetadataStore, ContextEvent, ContextSnapshot, ContextShare, ContextMetadata, ContextQuery } from '../../types';
export declare class MockEventStore implements EventStore {
    private events;
    private eventIndex;
    appendEvent(event: ContextEvent): Promise<void>;
    getEvents(agentId: string, fromVersion?: number): Promise<ContextEvent[]>;
    getEvent(eventId: string): Promise<ContextEvent | null>;
    clear(): void;
    getEventCount(agentId: string): number;
}
export declare class MockSnapshotStore implements SnapshotStore {
    private snapshots;
    private snapshotIndex;
    saveSnapshot(snapshot: ContextSnapshot): Promise<void>;
    getLatestSnapshot(agentId: string): Promise<ContextSnapshot | null>;
    getSnapshot(snapshotId: string): Promise<ContextSnapshot | null>;
    clear(): void;
    getSnapshotCount(agentId: string): number;
}
export declare class MockAuthService {
    private tokens;
    private revokedTokens;
    generateToken(agentId: string, permissions: string[]): Promise<any>;
    validateToken(token: string): Promise<any | null>;
    revokeToken(token: string): Promise<void>;
    clear(): void;
    getTokenCount(): number;
    getRevokedCount(): number;
}
export declare class MockShareStore implements ContextShareStore {
    private shares;
    private agentShares;
    createShare(share: Omit<ContextShare, 'id' | 'createdAt'>): Promise<ContextShare>;
    getSharesForAgent(agentId: string): Promise<ContextShare[]>;
    getSharedContexts(agentId: string): Promise<ContextShare[]>;
    revokeShare(shareId: string): Promise<void>;
    updateShare(shareId: string, updates: Partial<ContextShare>): Promise<ContextShare>;
    clear(): void;
    getShareCount(): number;
    getShareCountByAgent(agentId: string): number;
}
export declare class MockMetadataStore implements ContextMetadataStore {
    private metadata;
    setMetadata(metadata: Omit<ContextMetadata, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContextMetadata>;
    getMetadata(agentId: string, key?: string): Promise<ContextMetadata[]>;
    updateMetadata(agentId: string, key: string, value: any): Promise<ContextMetadata>;
    deleteMetadata(agentId: string, key: string): Promise<void>;
    queryMetadata(query: ContextQuery): Promise<ContextMetadata[]>;
    cleanupExpired(): Promise<void>;
    clear(): void;
    getMetadataCount(): number;
    getMetadataCountByAgent(agentId: string): number;
    getAllMetadataRaw(): ContextMetadata[];
}
//# sourceMappingURL=mocks.d.ts.map
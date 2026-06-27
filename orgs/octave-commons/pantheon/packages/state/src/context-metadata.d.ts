import { ContextMetadata, ContextMetadataStore, ContextQuery } from './types';
export declare class ContextMetadataService {
    private metadataStore;
    constructor(metadataStore: ContextMetadataStore);
    setMetadata(agentId: string, key: string, value: any, options?: {
        type?: string;
        visibility?: 'private' | 'shared' | 'public';
        expiresAt?: Date;
    }): Promise<ContextMetadata>;
    getMetadata(agentId: string, key?: string): Promise<ContextMetadata[]>;
    updateMetadata(agentId: string, key: string, value: any): Promise<ContextMetadata>;
    deleteMetadata(agentId: string, key: string): Promise<void>;
    queryMetadata(query: ContextQuery): Promise<ContextMetadata[]>;
    searchByValue(agentId: string, searchValue: any, options?: {
        type?: string;
        visibility?: string;
        limit?: number;
    }): Promise<ContextMetadata[]>;
    getMetadataByType(agentId: string, type: string): Promise<ContextMetadata[]>;
    getPublicMetadata(agentId?: string): Promise<ContextMetadata[]>;
    getSharedMetadata(agentId: string): Promise<ContextMetadata[]>;
    cleanupExpired(): Promise<number>;
    setTopicMetadata(agentId: string, topic: string, data: any, options?: {
        expiresAt?: Date;
        visibility?: 'private' | 'shared' | 'public';
    }): Promise<ContextMetadata>;
    setParticipantMetadata(agentId: string, participantId: string, data: any, options?: {
        expiresAt?: Date;
        visibility?: 'private' | 'shared' | 'public';
    }): Promise<ContextMetadata>;
    setSessionMetadata(agentId: string, sessionId: string, data: any, options?: {
        expiresAt?: Date;
        visibility?: 'private' | 'shared' | 'public';
    }): Promise<ContextMetadata>;
    getTopics(agentId: string): Promise<string[]>;
    getParticipants(agentId: string): Promise<string[]>;
    getSessions(agentId: string): Promise<string[]>;
}
//# sourceMappingURL=context-metadata.d.ts.map
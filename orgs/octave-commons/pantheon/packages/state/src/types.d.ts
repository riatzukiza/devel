import { z } from 'zod';
export declare const ContextEventSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    agentId: z.ZodString;
    timestamp: z.ZodDate;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: string;
    data: Record<string, any>;
    timestamp: Date;
    agentId: string;
    metadata?: Record<string, any> | undefined;
}, {
    id: string;
    type: string;
    data: Record<string, any>;
    timestamp: Date;
    agentId: string;
    metadata?: Record<string, any> | undefined;
}>;
export declare const ContextSnapshotSchema: z.ZodObject<{
    id: z.ZodString;
    agentId: z.ZodString;
    timestamp: z.ZodDate;
    state: z.ZodRecord<z.ZodString, z.ZodAny>;
    version: z.ZodNumber;
    eventId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    timestamp: Date;
    state: Record<string, any>;
    version: number;
    agentId: string;
    eventId: string;
}, {
    id: string;
    timestamp: Date;
    state: Record<string, any>;
    version: number;
    agentId: string;
    eventId: string;
}>;
export declare const AgentContextSchema: z.ZodObject<{
    id: z.ZodString;
    agentId: z.ZodString;
    state: z.ZodRecord<z.ZodString, z.ZodAny>;
    version: z.ZodNumber;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    state: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    version: number;
    agentId: string;
    metadata?: Record<string, any> | undefined;
}, {
    id: string;
    state: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    version: number;
    agentId: string;
    metadata?: Record<string, any> | undefined;
}>;
export declare const AuthTokenSchema: z.ZodObject<{
    token: z.ZodString;
    agentId: z.ZodString;
    expiresAt: z.ZodDate;
    permissions: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    expiresAt: Date;
    token: string;
    agentId: string;
    permissions: string[];
}, {
    expiresAt: Date;
    token: string;
    agentId: string;
    permissions: string[];
}>;
export type ContextEvent = z.infer<typeof ContextEventSchema>;
export type ContextSnapshot = z.infer<typeof ContextSnapshotSchema>;
export type AgentContext = z.infer<typeof AgentContextSchema>;
export type AuthToken = z.infer<typeof AuthTokenSchema>;
export interface EventStore {
    appendEvent(event: ContextEvent): Promise<void>;
    getEvents(agentId: string, fromVersion?: number): Promise<ContextEvent[]>;
    getEvent(eventId: string): Promise<ContextEvent | null>;
}
export interface SnapshotStore {
    saveSnapshot(snapshot: ContextSnapshot): Promise<void>;
    getLatestSnapshot(agentId: string): Promise<ContextSnapshot | null>;
    getSnapshot(snapshotId: string): Promise<ContextSnapshot | null>;
}
export interface ContextManager {
    getContext(agentId: string): Promise<AgentContext>;
    updateContext(agentId: string, updates: Partial<AgentContext>): Promise<AgentContext>;
    appendEvent(event: Omit<ContextEvent, 'id' | 'timestamp'>): Promise<ContextEvent>;
    createSnapshot(agentId: string): Promise<ContextSnapshot>;
    restoreFromSnapshot(snapshotId: string): Promise<AgentContext>;
}
export interface AuthService {
    generateToken(agentId: string, permissions: string[]): Promise<AuthToken>;
    validateToken(token: string): Promise<AuthToken | null>;
    revokeToken(token: string): Promise<void>;
}
export interface ContextShare {
    id: string;
    sourceAgentId: string;
    targetAgentId: string;
    contextSnapshotId: string;
    shareType: 'read' | 'write' | 'admin';
    permissions: Record<string, any>;
    expiresAt?: Date;
    createdAt: Date;
    createdBy?: string;
}
export interface ContextMetadata {
    id: string;
    agentId: string;
    contextKey: string;
    contextValue: any;
    contextType: string;
    visibility: 'private' | 'shared' | 'public';
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ContextQuery {
    agentId?: string;
    contextType?: string;
    visibility?: string;
    keyPattern?: string;
    limit?: number;
    offset?: number;
}
export interface ContextShareStore {
    createShare(share: Omit<ContextShare, 'id' | 'createdAt'>): Promise<ContextShare>;
    getSharesForAgent(agentId: string): Promise<ContextShare[]>;
    getSharedContexts(agentId: string): Promise<ContextShare[]>;
    revokeShare(shareId: string): Promise<void>;
    updateShare(shareId: string, updates: Partial<ContextShare>): Promise<ContextShare>;
}
export interface ContextMetadataStore {
    setMetadata(metadata: Omit<ContextMetadata, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContextMetadata>;
    getMetadata(agentId: string, key?: string): Promise<ContextMetadata[]>;
    updateMetadata(agentId: string, key: string, value: any): Promise<ContextMetadata>;
    deleteMetadata(agentId: string, key: string): Promise<void>;
    queryMetadata(query: ContextQuery): Promise<ContextMetadata[]>;
    cleanupExpired(): Promise<void>;
}
export interface ContextLifecycleManager {
    createContext(agentId: string, initialState?: any): Promise<AgentContext>;
    archiveContext(agentId: string): Promise<void>;
    deleteContext(agentId: string): Promise<void>;
    cleanupExpiredContexts(): Promise<void>;
    getContextStatistics(agentId: string): Promise<ContextStatistics>;
}
export interface ContextStatistics {
    totalEvents: number;
    totalSnapshots: number;
    totalShares: number;
    lastActivity: Date;
    contextSize: number;
    activeShares: number;
}
//# sourceMappingURL=types.d.ts.map
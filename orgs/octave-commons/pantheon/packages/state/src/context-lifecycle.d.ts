import { AgentContext, ContextManager, ContextStatistics, EventStore, SnapshotStore, ContextShareStore, ContextMetadataStore } from './types.js';
export type ContextExportData = {
    context: AgentContext;
    events: import('./types').ContextEvent[];
    snapshots: import('./types').ContextSnapshot[];
    metadata: import('./types').ContextMetadata[];
    shares: import('./types').ContextShare[];
};
export type SystemStatistics = {
    totalContexts: number;
    totalEvents: number;
    totalSnapshots: number;
    totalShares: number;
    activeContexts: number;
};
export type ContextValidationResult = {
    isValid: boolean;
    issues: string[];
};
export type ContextInitialState = Record<string, unknown>;
export type IContextLifecycleManager = {
    createContext(agentId: string, initialState?: ContextInitialState): Promise<AgentContext>;
    archiveContext(agentId: string): Promise<void>;
    deleteContext(agentId: string): Promise<void>;
    cleanupExpiredContexts(): Promise<void>;
    getContextStatistics(agentId: string): Promise<ContextStatistics>;
    getSystemStatistics(): Promise<SystemStatistics>;
    exportContext(agentId: string): Promise<ContextExportData>;
    importContext(agentId: string, exportData: ContextExportData): Promise<void>;
    validateContextIntegrity(agentId: string): Promise<ContextValidationResult>;
};
export type ContextLifecycleConfig = {
    contextManager: ContextManager;
    eventStore: EventStore;
    snapshotStore: SnapshotStore;
    shareStore?: ContextShareStore;
    metadataStore?: ContextMetadataStore;
};
export declare class ContextLifecycleManager implements IContextLifecycleManager {
    private readonly contextManager;
    private readonly eventStore;
    private readonly snapshotStore;
    private readonly shareStore?;
    private readonly metadataStore?;
    constructor(config: ContextLifecycleConfig);
    createContext(agentId: string, initialState?: ContextInitialState): Promise<AgentContext>;
    archiveContext(agentId: string): Promise<void>;
    deleteContext(agentId: string): Promise<void>;
    cleanupExpiredContexts(): Promise<void>;
    getContextStatistics(agentId: string): Promise<ContextStatistics>;
    getSystemStatistics(): Promise<SystemStatistics>;
    exportContext(agentId: string): Promise<ContextExportData>;
    importContext(agentId: string, exportData: ContextExportData): Promise<void>;
    private validateContextExistence;
    private validateVersionConsistency;
    private validateEventIntegrity;
    validateContextIntegrity(agentId: string): Promise<ContextValidationResult>;
}
//# sourceMappingURL=context-lifecycle.d.ts.map
import { AgentContext, ContextEvent, ContextSnapshot, ContextManager, EventStore, SnapshotStore } from './types.js';
/**
 * @deprecated Use the functional implementations from './default-context-manager-functional' instead.
 * This class is provided for backward compatibility and will be removed in a future version.
 */
export declare class DefaultContextManager implements ContextManager {
    private state;
    constructor(eventStore: EventStore, snapshotStore: SnapshotStore, snapshotInterval?: number);
    getContext(agentId: string): Promise<AgentContext>;
    updateContext(agentId: string, updates: Partial<AgentContext>): Promise<AgentContext>;
    appendEvent(event: Omit<ContextEvent, 'id' | 'timestamp'>): Promise<ContextEvent>;
    createSnapshot(agentId: string): Promise<ContextSnapshot>;
    restoreFromSnapshot(snapshotId: string): Promise<AgentContext>;
    deleteContext(agentId: string): Promise<void>;
    getContextHistory(agentId: string, limit?: number): Promise<ContextEvent[]>;
}
//# sourceMappingURL=context-manager.d.ts.map
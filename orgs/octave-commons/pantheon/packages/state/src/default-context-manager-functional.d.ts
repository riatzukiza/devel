/**
 * Functional Default Context Manager
 *
 * This file contains pure functional implementations of context management operations.
 * These were previously instance methods on DefaultContextManager class.
 */
import { AgentContext, ContextEvent, ContextSnapshot, EventStore, SnapshotStore } from './types.js';
import { RateLimiter } from './security.js';
export interface ContextManagerState {
    versionCounters: Map<string, number>;
    rateLimiter: RateLimiter;
    eventStore: EventStore;
    snapshotStore: SnapshotStore;
    snapshotInterval: number;
}
export declare const createContextManagerState: (eventStore: EventStore, snapshotStore: SnapshotStore, snapshotInterval?: number) => ContextManagerState;
export declare const getContext: (state: ContextManagerState, agentId: string) => Promise<AgentContext>;
export declare const updateContext: (state: ContextManagerState, agentId: string, updates: Partial<AgentContext>) => Promise<{
    updatedContext: AgentContext;
    newState: ContextManagerState;
}>;
export declare const getNextVersion: (state: ContextManagerState, agentId: string, currentVersion: number) => {
    nextVersion: number;
    newState: ContextManagerState;
};
export declare const buildUpdatedContext: (currentContext: AgentContext, agentId: string, updates: unknown, version: number) => AgentContext;
export declare const createUpdateEvent: (eventStore: EventStore, agentId: string, updates: unknown, previousVersion: number, newVersion: number) => Promise<void>;
export declare const appendEventToStore: (eventStore: EventStore, event: Omit<ContextEvent, "id" | "timestamp">) => Promise<ContextEvent>;
export declare const appendEvent: (state: ContextManagerState, event: Omit<ContextEvent, "id" | "timestamp">) => Promise<{
    event: ContextEvent;
    shouldSnapshot: boolean;
}>;
export declare const createSnapshot: (state: ContextManagerState, agentId: string) => Promise<ContextSnapshot>;
export declare const restoreFromSnapshot: (state: ContextManagerState, snapshotId: string) => Promise<AgentContext>;
export declare const deleteContext: (state: ContextManagerState, agentId: string) => Promise<void>;
export declare const getContextHistory: (state: ContextManagerState, agentId: string, limit?: number) => Promise<ContextEvent[]>;
//# sourceMappingURL=default-context-manager-functional.d.ts.map
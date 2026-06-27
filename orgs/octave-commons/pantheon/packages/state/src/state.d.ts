/**
 * Functional factory for agent state management
 *
 * This package manages AGENT STATE via event sourcing, not conversation context.
 * For LLM conversation compilation, use @promethean-os/persistence makeContextStore.
 */
import type { EventStore, SnapshotStore, AgentContext, ContextEvent, ContextSnapshot } from './types.js';
export type Actor = {
    id: string;
    script: {
        name: string;
        roleName?: string;
        contextSources: readonly {
            id: string;
            label: string;
            where?: Record<string, unknown>;
        }[];
        talents: readonly {
            name: string;
            behaviors: readonly {
                name: string;
                mode: 'active' | 'passive' | 'persistent';
                plan: (input: {
                    goal: string;
                    context: any[];
                }) => Promise<{
                    actions: any[];
                }>;
            }[];
        }[];
        program?: string;
    };
    goals: readonly string[];
};
export type ActorScript = Actor['script'];
export type ActorStatePort = {
    spawn: (script: ActorScript, goal: string) => Promise<Actor>;
    list: () => Promise<Actor[]>;
    get: (id: string) => Promise<Actor | null>;
    update: (id: string, updates: Partial<Actor>) => Promise<Actor>;
};
export type AgentStateDeps = {
    eventStore: EventStore;
    snapshotStore: SnapshotStore;
    snapshotInterval?: number;
};
export type AgentStateManager = {
    getContext(agentId: string): Promise<AgentContext>;
    updateContext(agentId: string, updates: Partial<AgentContext>): Promise<AgentContext>;
    appendEvent(event: Omit<ContextEvent, 'id' | 'timestamp'>): Promise<ContextEvent>;
    createSnapshot(agentId: string): Promise<ContextSnapshot>;
    restoreFromSnapshot(snapshotId: string): Promise<AgentContext>;
    deleteContext(agentId: string): Promise<void>;
    getContextHistory(agentId: string, limit?: number): Promise<ContextEvent[]>;
};
/**
 * Create an agent state manager using functional dependency injection
 *
 * @param deps - Dependencies including event store, snapshot store, and optional snapshot interval
 * @returns Agent state manager with pure functions
 */
export declare const makeAgentStateManager: (deps: AgentStateDeps) => AgentStateManager;
/**
 * Create an ActorStatePort adapter for Pantheon compatibility
 *
 * @param deps - Agent state dependencies
 * @returns ActorStatePort implementation
 */
export declare const makeActorStatePort: (deps: AgentStateDeps) => ActorStatePort;
//# sourceMappingURL=state.d.ts.map
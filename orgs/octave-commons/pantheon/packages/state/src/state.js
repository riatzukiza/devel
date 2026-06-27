/**
 * Functional factory for agent state management
 *
 * This package manages AGENT STATE via event sourcing, not conversation context.
 * For LLM conversation compilation, use @promethean-os/persistence makeContextStore.
 */
import { DefaultContextManager } from './context-manager.js';
/**
 * Create an agent state manager using functional dependency injection
 *
 * @param deps - Dependencies including event store, snapshot store, and optional snapshot interval
 * @returns Agent state manager with pure functions
 */
export const makeAgentStateManager = (deps) => {
    const manager = new DefaultContextManager(deps.eventStore, deps.snapshotStore, deps.snapshotInterval);
    return {
        getContext: manager.getContext.bind(manager),
        updateContext: manager.updateContext.bind(manager),
        appendEvent: manager.appendEvent.bind(manager),
        createSnapshot: manager.createSnapshot.bind(manager),
        restoreFromSnapshot: manager.restoreFromSnapshot.bind(manager),
        deleteContext: manager.deleteContext.bind(manager),
        getContextHistory: manager.getContextHistory.bind(manager),
    };
};
/**
 * Create an ActorStatePort adapter for Pantheon compatibility
 *
 * @param deps - Agent state dependencies
 * @returns ActorStatePort implementation
 */
export const makeActorStatePort = (deps) => {
    const manager = makeAgentStateManager(deps);
    return {
        spawn: async (script, goal) => {
            const actor = {
                id: `actor-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                script,
                goals: [goal],
            };
            // Store actor in agent context state for persistence
            await manager.updateContext(actor.id, {
                state: {
                    actorId: actor.id,
                    script: actor.script,
                    goals: actor.goals,
                    type: 'actor',
                },
            });
            return actor;
        },
        list: async () => {
            // This would need to be implemented based on the actual storage structure
            // For now, return empty array as placeholder
            console.warn('ActorStatePort.list() not fully implemented - needs indexing');
            return [];
        },
        get: async (id) => {
            try {
                const context = await manager.getContext(id);
                if (context.state?.type === 'actor' && context.state?.script && context.state?.goals) {
                    return {
                        id: context.agentId,
                        script: context.state.script,
                        goals: context.state.goals,
                    };
                }
                return null;
            }
            catch {
                return null;
            }
        },
        update: async (id, updates) => {
            const current = await manager.getContext(id);
            const updatedState = {
                ...current.state,
                ...updates,
                type: 'actor',
            };
            const updated = await manager.updateContext(id, {
                state: updatedState,
            });
            return {
                id: updated.agentId,
                script: updated.state.script,
                goals: updated.state.goals,
            };
        },
    };
};
//# sourceMappingURL=state.js.map
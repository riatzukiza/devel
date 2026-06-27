import { AgentContext, ContextEvent, ContextSnapshot, EventStore } from './types.js';
import { RateLimiter } from './security.js';
/**
 * @deprecated Use the functional implementations from './context-manager-helpers-functional' instead.
 * This class is provided for backward compatibility and will be removed in a future version.
 */
export declare class ContextManagerHelpers {
    static checkRateLimit(rateLimiter: RateLimiter, agentId: string, action: string): Promise<void>;
    static buildContextFromSnapshot(agentId: string, snapshot: ContextSnapshot, eventStore: EventStore): Promise<AgentContext>;
    static buildContextFromEvents(agentId: string, eventStore: EventStore): Promise<AgentContext>;
    static applyEventsToState(initialState: unknown, events: ContextEvent[]): unknown;
    static logSecurityError(agentId: string, action: string, error: unknown): void;
}
//# sourceMappingURL=context-manager-helpers.d.ts.map
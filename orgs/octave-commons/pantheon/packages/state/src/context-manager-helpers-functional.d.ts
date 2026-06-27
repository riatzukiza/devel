/**
 * Functional Context Manager Helpers
 *
 * This file contains pure functional implementations of context management utilities.
 * These were previously static methods on ContextManagerHelpers class.
 */
import { AgentContext, ContextEvent, ContextSnapshot, EventStore } from './types.js';
import { RateLimiter } from './security.js';
export declare const checkRateLimit: (rateLimiter: RateLimiter, agentId: string, action: string) => Promise<void>;
export declare const buildContextFromSnapshot: (agentId: string, snapshot: ContextSnapshot, eventStore: EventStore) => Promise<AgentContext>;
export declare const buildContextFromEvents: (agentId: string, eventStore: EventStore) => Promise<AgentContext>;
export declare const applyEventsToState: (initialState: unknown, events: ContextEvent[]) => unknown;
export declare const logSecurityError: (agentId: string, action: string, error: unknown) => void;
//# sourceMappingURL=context-manager-helpers-functional.d.ts.map
// Import functional implementations
import { checkRateLimit as checkRateLimitFn, buildContextFromSnapshot as buildContextFromSnapshotFn, buildContextFromEvents as buildContextFromEventsFn, applyEventsToState as applyEventsToStateFn, logSecurityError as logSecurityErrorFn, } from './context-manager-helpers-functional.js';
/**
 * @deprecated Use the functional implementations from './context-manager-helpers-functional' instead.
 * This class is provided for backward compatibility and will be removed in a future version.
 */
export class ContextManagerHelpers {
    static async checkRateLimit(rateLimiter, agentId, action) {
        console.warn('ContextManagerHelpers.checkRateLimit is deprecated. Use checkRateLimit from context-manager-helpers-functional instead.');
        return checkRateLimitFn(rateLimiter, agentId, action);
    }
    static async buildContextFromSnapshot(agentId, snapshot, eventStore) {
        console.warn('ContextManagerHelpers.buildContextFromSnapshot is deprecated. Use buildContextFromSnapshot from context-manager-helpers-functional instead.');
        return buildContextFromSnapshotFn(agentId, snapshot, eventStore);
    }
    static async buildContextFromEvents(agentId, eventStore) {
        console.warn('ContextManagerHelpers.buildContextFromEvents is deprecated. Use buildContextFromEvents from context-manager-helpers-functional instead.');
        return buildContextFromEventsFn(agentId, eventStore);
    }
    static applyEventsToState(initialState, events) {
        console.warn('ContextManagerHelpers.applyEventsToState is deprecated. Use applyEventsToState from context-manager-helpers-functional instead.');
        return applyEventsToStateFn(initialState, events);
    }
    static logSecurityError(agentId, action, error) {
        console.warn('ContextManagerHelpers.logSecurityError is deprecated. Use logSecurityError from context-manager-helpers-functional instead.');
        return logSecurityErrorFn(agentId, action, error);
    }
}
//# sourceMappingURL=context-manager-helpers.js.map
// Import functional implementations
import { createContextManagerState, getContext as getContextFn, updateContext as updateContextFn, appendEvent as appendEventFn, createSnapshot as createSnapshotFn, restoreFromSnapshot as restoreFromSnapshotFn, deleteContext as deleteContextFn, getContextHistory as getContextHistoryFn, } from './default-context-manager-functional.js';
/**
 * @deprecated Use the functional implementations from './default-context-manager-functional' instead.
 * This class is provided for backward compatibility and will be removed in a future version.
 */
export class DefaultContextManager {
    state;
    constructor(eventStore, snapshotStore, snapshotInterval = 100) {
        this.state = createContextManagerState(eventStore, snapshotStore, snapshotInterval);
    }
    async getContext(agentId) {
        console.warn('DefaultContextManager.getContext is deprecated. Use getContext from default-context-manager-functional instead.');
        return getContextFn(this.state, agentId);
    }
    async updateContext(agentId, updates) {
        console.warn('DefaultContextManager.updateContext is deprecated. Use updateContext from default-context-manager-functional instead.');
        const result = await updateContextFn(this.state, agentId, updates);
        this.state = result.newState;
        return result.updatedContext;
    }
    async appendEvent(event) {
        console.warn('DefaultContextManager.appendEvent is deprecated. Use appendEvent from default-context-manager-functional instead.');
        const result = await appendEventFn(this.state, event);
        // Create snapshot if needed
        if (result.shouldSnapshot) {
            await createSnapshotFn(this.state, event.agentId);
        }
        return result.event;
    }
    async createSnapshot(agentId) {
        console.warn('DefaultContextManager.createSnapshot is deprecated. Use createSnapshot from default-context-manager-functional instead.');
        return createSnapshotFn(this.state, agentId);
    }
    async restoreFromSnapshot(snapshotId) {
        console.warn('DefaultContextManager.restoreFromSnapshot is deprecated. Use restoreFromSnapshot from default-context-manager-functional instead.');
        return restoreFromSnapshotFn(this.state, snapshotId);
    }
    async deleteContext(agentId) {
        console.warn('DefaultContextManager.deleteContext is deprecated. Use deleteContext from default-context-manager-functional instead.');
        return deleteContextFn(this.state, agentId);
    }
    async getContextHistory(agentId, limit) {
        console.warn('DefaultContextManager.getContextHistory is deprecated. Use getContextHistory from default-context-manager-functional instead.');
        return getContextHistoryFn(this.state, agentId, limit);
    }
}
//# sourceMappingURL=context-manager.js.map
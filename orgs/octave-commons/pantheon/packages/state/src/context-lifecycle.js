export class ContextLifecycleManager {
    contextManager;
    eventStore;
    snapshotStore;
    shareStore;
    metadataStore;
    constructor(config) {
        this.contextManager = config.contextManager;
        this.eventStore = config.eventStore;
        this.snapshotStore = config.snapshotStore;
        this.shareStore = config.shareStore;
        this.metadataStore = config.metadataStore;
    }
    async createContext(agentId, initialState) {
        // Create initial context with provided state
        const context = await this.contextManager.getContext(agentId);
        if (initialState && Object.keys(initialState).length > 0) {
            return await this.contextManager.updateContext(agentId, {
                state: initialState,
            });
        }
        return context;
    }
    async archiveContext(agentId) {
        // Check if context exists by looking for events or snapshots
        const events = await this.eventStore.getEvents(agentId);
        const latestSnapshot = await this.snapshotStore.getLatestSnapshot(agentId);
        // If no events and no snapshots, context doesn't exist - return silently
        if (events.length === 0 && !latestSnapshot) {
            return;
        }
        // Create a final snapshot before archiving
        await this.contextManager.createSnapshot(agentId);
        // Add archive event
        await this.contextManager.appendEvent({
            type: 'context_archived',
            agentId,
            data: {
                archivedAt: new Date(),
                archivedBy: 'system',
            },
        });
    }
    async deleteContext(agentId) {
        // Check if context exists by looking for events or snapshots
        const events = await this.eventStore.getEvents(agentId);
        const latestSnapshot = await this.snapshotStore.getLatestSnapshot(agentId);
        // If no events and no snapshots, context doesn't exist - return silently
        if (events.length === 0 && !latestSnapshot) {
            return;
        }
        // First archive the context
        await this.archiveContext(agentId);
        // Then perform soft delete by creating a deletion event
        await this.contextManager.appendEvent({
            type: 'context_deleted',
            agentId,
            data: {
                deletedAt: new Date(),
                deletedBy: 'system',
            },
        });
        // Clean up metadata
        if (this.metadataStore) {
            const metadata = await this.metadataStore.getMetadata(agentId);
            for (const meta of metadata) {
                await this.metadataStore.deleteMetadata(agentId, meta.contextKey);
            }
        }
        // Clean up shares
        if (this.shareStore) {
            const shares = await this.shareStore.getSharesForAgent(agentId);
            for (const share of shares) {
                await this.shareStore.revokeShare(share.id);
            }
        }
    }
    async cleanupExpiredContexts() {
        if (!this.metadataStore) {
            return;
        }
        // Use the metadata store's built-in cleanup method
        await this.metadataStore.cleanupExpired();
    }
    async getContextStatistics(agentId) {
        const context = await this.contextManager.getContext(agentId);
        const events = await this.eventStore.getEvents(agentId);
        const snapshots = await this.snapshotStore.getLatestSnapshot(agentId);
        let totalShares = 0;
        let activeShares = 0;
        if (this.shareStore) {
            const shares = await this.shareStore.getSharesForAgent(agentId);
            totalShares = shares.length;
            const now = new Date();
            activeShares = shares.filter((share) => !share.expiresAt || share.expiresAt > now).length;
        }
        // Calculate context size (rough estimate based on state size)
        const contextSize = JSON.stringify(context.state).length;
        return {
            totalEvents: events.length,
            totalSnapshots: snapshots ? 1 : 0,
            totalShares,
            lastActivity: context.updatedAt,
            contextSize,
            activeShares,
        };
    }
    getSystemStatistics() {
        // This would require iterating over all agents
        // For now, return placeholder values
        return Promise.resolve({
            totalContexts: 0,
            totalEvents: 0,
            totalSnapshots: 0,
            totalShares: 0,
            activeContexts: 0,
        });
    }
    async exportContext(agentId) {
        const context = await this.contextManager.getContext(agentId);
        const events = await this.eventStore.getEvents(agentId);
        const latestSnapshot = await this.snapshotStore.getLatestSnapshot(agentId);
        const snapshots = latestSnapshot ? [latestSnapshot] : [];
        let metadata = [];
        let shares = [];
        if (this.metadataStore) {
            metadata = await this.metadataStore.getMetadata(agentId);
        }
        if (this.shareStore) {
            shares = await this.shareStore.getSharesForAgent(agentId);
        }
        return {
            context,
            events,
            snapshots,
            metadata,
            shares,
        };
    }
    async importContext(agentId, exportData) {
        // Import context state
        await this.contextManager.updateContext(agentId, {
            state: exportData.context.state,
        });
        // Import events
        for (const event of exportData.events) {
            await this.eventStore.appendEvent(event);
        }
        // Import snapshots
        for (const snapshot of exportData.snapshots) {
            await this.snapshotStore.saveSnapshot(snapshot);
        }
        // Import metadata
        if (this.metadataStore) {
            for (const metadata of exportData.metadata) {
                await this.metadataStore.setMetadata({
                    agentId,
                    contextKey: metadata.contextKey,
                    contextValue: metadata.contextValue,
                    contextType: metadata.contextType || 'imported',
                    visibility: metadata.visibility || 'private',
                    expiresAt: metadata.expiresAt,
                });
            }
        }
        // Import shares
        if (this.shareStore) {
            for (const share of exportData.shares) {
                await this.shareStore.createShare(share);
            }
        }
    }
    validateContextExistence(events, latestSnapshot) {
        const issues = [];
        if (events.length === 0 && !latestSnapshot) {
            issues.push('Context does not exist - no events or snapshots found');
        }
        return issues;
    }
    validateVersionConsistency(context, events, latestSnapshot) {
        const issues = [];
        if (latestSnapshot) {
            const eventsSinceSnapshot = events.filter((event) => {
                if (!event.data || typeof event.data !== 'object') {
                    return false;
                }
                const eventData = event.data;
                return eventData.version && eventData.version > latestSnapshot.version;
            });
            const expectedVersion = latestSnapshot.version + eventsSinceSnapshot.length;
            if (context.version !== expectedVersion) {
                issues.push(`Context version mismatch: expected ${expectedVersion}, got ${context.version}`);
            }
            // Check snapshot integrity
            if (latestSnapshot.state &&
                typeof latestSnapshot.state === 'object' &&
                Object.keys(latestSnapshot.state).length === 0) {
                issues.push('Snapshot state is empty');
            }
        }
        else {
            // No snapshot, version should match events count
            if (context.version !== events.length) {
                issues.push(`Context version mismatch: expected ${events.length}, got ${context.version}`);
            }
        }
        return issues;
    }
    validateEventIntegrity(events) {
        const issues = [];
        // Check for duplicate event IDs
        const eventIds = events.map((e) => e.id);
        const uniqueEventIds = new Set(eventIds);
        if (eventIds.length !== uniqueEventIds.size) {
            issues.push('Duplicate event IDs found');
        }
        // Check event order
        for (let i = 1; i < events.length; i++) {
            const currentEvent = events[i];
            const previousEvent = events[i - 1];
            if (currentEvent && previousEvent && currentEvent.timestamp < previousEvent.timestamp) {
                issues.push(`Event order violation at index ${i}`);
                break;
            }
        }
        return issues;
    }
    async validateContextIntegrity(agentId) {
        const issues = [];
        try {
            const context = await this.contextManager.getContext(agentId);
            const events = await this.eventStore.getEvents(agentId);
            const latestSnapshot = await this.snapshotStore.getLatestSnapshot(agentId);
            // Check if context exists at all
            issues.push(...this.validateContextExistence(events, latestSnapshot));
            const existenceIssues = issues.filter((issue) => issue.includes('Context does not exist - no events or snapshots found'));
            if (existenceIssues.length > 0) {
                return {
                    isValid: false,
                    issues,
                };
            }
            // Check version consistency
            issues.push(...this.validateVersionConsistency(context, events, latestSnapshot));
            // Check event integrity
            issues.push(...this.validateEventIntegrity(events));
        }
        catch (error) {
            issues.push(`Error during validation: ${error instanceof Error ? error.message : String(error)}`);
        }
        return {
            isValid: issues.length === 0,
            issues,
        };
    }
}
//# sourceMappingURL=context-lifecycle.js.map
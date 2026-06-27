export class MockEventStore {
    events = new Map();
    eventIndex = new Map();
    async appendEvent(event) {
        const agentEvents = this.events.get(event.agentId) || [];
        agentEvents.push(event);
        this.events.set(event.agentId, agentEvents);
        this.eventIndex.set(event.id, event);
    }
    async getEvents(agentId, fromVersion) {
        const agentEvents = this.events.get(agentId) || [];
        if (fromVersion !== undefined) {
            return agentEvents.filter((event) => event.data.version >= fromVersion);
        }
        return agentEvents;
    }
    async getEvent(eventId) {
        return this.eventIndex.get(eventId) || null;
    }
    // Helper methods for testing
    clear() {
        this.events.clear();
        this.eventIndex.clear();
    }
    getEventCount(agentId) {
        return (this.events.get(agentId) || []).length;
    }
}
export class MockSnapshotStore {
    snapshots = new Map();
    snapshotIndex = new Map();
    async saveSnapshot(snapshot) {
        const agentSnapshots = this.snapshots.get(snapshot.agentId) || [];
        agentSnapshots.push(snapshot);
        this.snapshots.set(snapshot.agentId, agentSnapshots);
        this.snapshotIndex.set(snapshot.id, snapshot);
    }
    async getLatestSnapshot(agentId) {
        const agentSnapshots = this.snapshots.get(agentId) || [];
        if (agentSnapshots.length === 0)
            return null;
        // Return the snapshot with the highest version
        return agentSnapshots.reduce((latest, current) => current.version > latest.version ? current : latest);
    }
    async getSnapshot(snapshotId) {
        return this.snapshotIndex.get(snapshotId) || null;
    }
    // Helper methods for testing
    clear() {
        this.snapshots.clear();
        this.snapshotIndex.clear();
    }
    getSnapshotCount(agentId) {
        return (this.snapshots.get(agentId) || []).length;
    }
}
export class MockAuthService {
    tokens = new Map();
    revokedTokens = new Set();
    async generateToken(agentId, permissions) {
        const token = {
            token: `mock-jwt-${agentId}-${Date.now()}`,
            agentId,
            expiresAt: new Date(Date.now() + 3600000),
            permissions,
        };
        this.tokens.set(token.token, token);
        return token;
    }
    async validateToken(token) {
        if (this.revokedTokens.has(token)) {
            return null;
        }
        const tokenData = this.tokens.get(token);
        if (!tokenData) {
            return null;
        }
        // Check if expired
        if (tokenData.expiresAt < new Date()) {
            return null;
        }
        return tokenData;
    }
    async revokeToken(token) {
        this.revokedTokens.add(token);
    }
    // Helper methods for testing
    clear() {
        this.tokens.clear();
        this.revokedTokens.clear();
    }
    getTokenCount() {
        return this.tokens.size;
    }
    getRevokedCount() {
        return this.revokedTokens.size;
    }
}
export class MockShareStore {
    shares = new Map();
    agentShares = new Map(); // agentId -> Set of shareIds
    async createShare(share) {
        const newShare = {
            ...share,
            id: `share-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            createdAt: new Date(),
        };
        this.shares.set(newShare.id, newShare);
        // Track shares for both source and target agents
        const sourceShares = this.agentShares.get(newShare.sourceAgentId) || new Set();
        sourceShares.add(newShare.id);
        this.agentShares.set(newShare.sourceAgentId, sourceShares);
        const targetShares = this.agentShares.get(newShare.targetAgentId) || new Set();
        targetShares.add(newShare.id);
        this.agentShares.set(newShare.targetAgentId, targetShares);
        return newShare;
    }
    async getSharesForAgent(agentId) {
        // Return shares where this agent is the source (created shares)
        const shareIds = this.agentShares.get(agentId) || new Set();
        return Array.from(shareIds)
            .map((id) => this.shares.get(id))
            .filter((share) => share !== undefined && share.sourceAgentId === agentId)
            .sort((a, b) => {
            // Sort by permission level (admin > write > read) then by creation time
            const permissionLevels = { read: 1, write: 2, admin: 3 };
            const levelDiff = permissionLevels[b.shareType] - permissionLevels[a.shareType];
            if (levelDiff !== 0)
                return levelDiff;
            return b.createdAt.getTime() - a.createdAt.getTime();
        });
    }
    async getSharedContexts(agentId) {
        // Return shares where this agent is the target (received shares)
        const shareIds = this.agentShares.get(agentId) || new Set();
        return Array.from(shareIds)
            .map((id) => this.shares.get(id))
            .filter((share) => share !== undefined && share.targetAgentId === agentId)
            .sort((a, b) => {
            // Sort by permission level (admin > write > read) then by creation time
            const permissionLevels = { read: 1, write: 2, admin: 3 };
            const levelDiff = permissionLevels[b.shareType] - permissionLevels[a.shareType];
            if (levelDiff !== 0)
                return levelDiff;
            return b.createdAt.getTime() - a.createdAt.getTime();
        });
    }
    async revokeShare(shareId) {
        const share = this.shares.get(shareId);
        if (!share)
            return;
        this.shares.delete(shareId);
        // Remove from both agents' share tracking
        const sourceShares = this.agentShares.get(share.sourceAgentId);
        if (sourceShares) {
            sourceShares.delete(shareId);
            if (sourceShares.size === 0) {
                this.agentShares.delete(share.sourceAgentId);
            }
        }
        const targetShares = this.agentShares.get(share.targetAgentId);
        if (targetShares) {
            targetShares.delete(shareId);
            if (targetShares.size === 0) {
                this.agentShares.delete(share.targetAgentId);
            }
        }
    }
    async updateShare(shareId, updates) {
        const share = this.shares.get(shareId);
        if (!share) {
            throw new Error(`Share with ID ${shareId} not found`);
        }
        const updatedShare = {
            ...share,
            ...updates,
        };
        this.shares.set(shareId, updatedShare);
        return updatedShare;
    }
    // Helper methods for testing
    clear() {
        this.shares.clear();
        this.agentShares.clear();
    }
    getShareCount() {
        return this.shares.size;
    }
    getShareCountByAgent(agentId) {
        return (this.agentShares.get(agentId) || new Set()).size;
    }
}
export class MockMetadataStore {
    metadata = new Map(); // agentId -> metadata array
    async setMetadata(metadata) {
        const newMetadata = {
            ...metadata,
            id: `metadata-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const agentMetadata = this.metadata.get(newMetadata.agentId) || [];
        // Remove existing metadata with same key if it exists
        const filteredMetadata = agentMetadata.filter((meta) => meta.contextKey !== newMetadata.contextKey);
        filteredMetadata.push(newMetadata);
        this.metadata.set(newMetadata.agentId, filteredMetadata);
        return newMetadata;
    }
    async getMetadata(agentId, key) {
        const agentMetadata = this.metadata.get(agentId) || [];
        if (key) {
            return agentMetadata.filter((meta) => meta.contextKey === key);
        }
        return agentMetadata;
    }
    async updateMetadata(agentId, key, value) {
        const agentMetadata = this.metadata.get(agentId) || [];
        const existingIndex = agentMetadata.findIndex((meta) => meta.contextKey === key);
        if (existingIndex === -1) {
            throw new Error(`Metadata with key ${key} not found for agent ${agentId}`);
        }
        const existingMetadata = agentMetadata[existingIndex];
        if (!existingMetadata) {
            throw new Error(`Metadata with key ${key} not found for agent ${agentId}`);
        }
        // Ensure updatedAt is always greater than createdAt by at least 1ms
        const now = new Date();
        const updatedAt = existingMetadata.createdAt >= now ? new Date(existingMetadata.createdAt.getTime() + 1) : now;
        const updatedMetadata = {
            id: existingMetadata.id,
            agentId: existingMetadata.agentId,
            contextKey: existingMetadata.contextKey,
            contextValue: value,
            contextType: existingMetadata.contextType,
            visibility: existingMetadata.visibility,
            expiresAt: existingMetadata.expiresAt,
            createdAt: existingMetadata.createdAt,
            updatedAt,
        };
        agentMetadata[existingIndex] = updatedMetadata;
        this.metadata.set(agentId, agentMetadata);
        return updatedMetadata;
    }
    async deleteMetadata(agentId, key) {
        const agentMetadata = this.metadata.get(agentId) || [];
        const filteredMetadata = agentMetadata.filter((meta) => meta.contextKey !== key);
        this.metadata.set(agentId, filteredMetadata);
    }
    async queryMetadata(query) {
        let results = [];
        // Collect metadata from all agents or specific agent
        if (query.agentId) {
            results = this.metadata.get(query.agentId) || [];
        }
        else {
            // Get all metadata from all agents
            for (const agentMetadata of Array.from(this.metadata.values())) {
                results.push(...agentMetadata);
            }
        }
        // Filter out expired metadata (like the Postgres implementation)
        const now = new Date();
        results = results.filter((meta) => !meta.expiresAt || meta.expiresAt > now);
        // Apply filters
        if (query.contextType) {
            results = results.filter((meta) => meta.contextType === query.contextType);
        }
        if (query.visibility) {
            results = results.filter((meta) => meta.visibility === query.visibility);
        }
        if (query.keyPattern) {
            const regex = new RegExp(query.keyPattern);
            results = results.filter((meta) => regex.test(meta.contextKey));
        }
        // Apply pagination
        if (query.offset) {
            results = results.slice(query.offset);
        }
        if (query.limit) {
            results = results.slice(0, query.limit);
        }
        return results;
    }
    async cleanupExpired() {
        const now = new Date();
        for (const [agentId, agentMetadata] of Array.from(this.metadata.entries())) {
            const validMetadata = agentMetadata.filter((meta) => !meta.expiresAt || meta.expiresAt > now);
            this.metadata.set(agentId, validMetadata);
        }
    }
    // Helper methods for testing
    clear() {
        this.metadata.clear();
    }
    getMetadataCount() {
        let count = 0;
        for (const agentMetadata of Array.from(this.metadata.values())) {
            count += agentMetadata.length;
        }
        return count;
    }
    getMetadataCountByAgent(agentId) {
        return (this.metadata.get(agentId) || []).length;
    }
    // Get all metadata without expiration filtering (for testing cleanup)
    getAllMetadataRaw() {
        const allMetadata = [];
        for (const agentMetadata of Array.from(this.metadata.values())) {
            allMetadata.push(...agentMetadata);
        }
        return allMetadata;
    }
}
//# sourceMappingURL=mocks.js.map
export class ContextMetadataService {
    metadataStore;
    constructor(metadataStore) {
        this.metadataStore = metadataStore;
    }
    async setMetadata(agentId, key, value, options = {}) {
        const metadata = {
            agentId,
            contextKey: key,
            contextValue: value,
            contextType: options.type || 'generic',
            visibility: options.visibility || 'private',
            expiresAt: options.expiresAt,
        };
        return await this.metadataStore.setMetadata(metadata);
    }
    async getMetadata(agentId, key) {
        return await this.metadataStore.getMetadata(agentId, key);
    }
    async updateMetadata(agentId, key, value) {
        return await this.metadataStore.updateMetadata(agentId, key, value);
    }
    async deleteMetadata(agentId, key) {
        await this.metadataStore.deleteMetadata(agentId, key);
    }
    async queryMetadata(query) {
        return await this.metadataStore.queryMetadata(query);
    }
    async searchByValue(agentId, searchValue, options = {}) {
        const allMetadata = await this.metadataStore.getMetadata(agentId);
        let filtered = allMetadata.filter((meta) => {
            // Simple string search in serialized value
            const valueStr = JSON.stringify(meta.contextValue).toLowerCase();
            const searchStr = typeof searchValue === 'string'
                ? searchValue.toLowerCase()
                : JSON.stringify(searchValue).toLowerCase();
            return valueStr.includes(searchStr);
        });
        if (options.type) {
            filtered = filtered.filter((meta) => meta.contextType === options.type);
        }
        if (options.visibility) {
            filtered = filtered.filter((meta) => meta.visibility === options.visibility);
        }
        if (options.limit) {
            filtered = filtered.slice(0, options.limit);
        }
        return filtered;
    }
    async getMetadataByType(agentId, type) {
        return await this.queryMetadata({
            agentId,
            contextType: type,
        });
    }
    async getPublicMetadata(agentId) {
        const query = {
            visibility: 'public',
        };
        if (agentId) {
            query.agentId = agentId;
        }
        return await this.metadataStore.queryMetadata(query);
    }
    async getSharedMetadata(agentId) {
        return await this.queryMetadata({
            agentId,
            visibility: 'shared',
        });
    }
    async cleanupExpired() {
        // Get count of expired items before cleanup
        let allMetadata = [];
        // Try to get raw access to all metadata (including expired)
        if ('getAllMetadataRaw' in this.metadataStore) {
            allMetadata = this.metadataStore.getAllMetadataRaw();
        }
        else {
            // Fallback: use queryMetadata (may filter expired in some implementations)
            allMetadata = await this.metadataStore.queryMetadata({});
        }
        const now = new Date();
        const expired = allMetadata.filter((meta) => meta.expiresAt && meta.expiresAt < now);
        // Perform cleanup
        await this.metadataStore.cleanupExpired();
        return expired.length;
    }
    async setTopicMetadata(agentId, topic, data, options = {}) {
        return await this.setMetadata(agentId, `topic:${topic}`, data, {
            type: 'topic',
            ...options,
        });
    }
    async setParticipantMetadata(agentId, participantId, data, options = {}) {
        return await this.setMetadata(agentId, `participant:${participantId}`, data, {
            type: 'participant',
            ...options,
        });
    }
    async setSessionMetadata(agentId, sessionId, data, options = {}) {
        return await this.setMetadata(agentId, `session:${sessionId}`, data, {
            type: 'session',
            ...options,
        });
    }
    async getTopics(agentId) {
        const topicMetadata = await this.getMetadataByType(agentId, 'topic');
        return topicMetadata
            .map((meta) => meta.contextKey.replace('topic:', ''))
            .filter((topic) => topic.length > 0);
    }
    async getParticipants(agentId) {
        const participantMetadata = await this.getMetadataByType(agentId, 'participant');
        return participantMetadata
            .map((meta) => meta.contextKey.replace('participant:', ''))
            .filter((participant) => participant.length > 0);
    }
    async getSessions(agentId) {
        const sessionMetadata = await this.getMetadataByType(agentId, 'session');
        return sessionMetadata
            .map((meta) => meta.contextKey.replace('session:', ''))
            .filter((session) => session.length > 0);
    }
}
//# sourceMappingURL=context-metadata.js.map
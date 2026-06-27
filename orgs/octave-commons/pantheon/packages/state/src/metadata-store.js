import { openLevelCache } from '@promethean-os/level-cache';
export class PostgresContextMetadataStore {
    db;
    cacheOptions;
    cache = null;
    cachePromise = null;
    constructor(db, cacheOptions) {
        this.db = db;
        this.cacheOptions = cacheOptions;
        this.cachePromise = this.initializeCache();
    }
    async initializeCache() {
        this.cache = await openLevelCache({
            path: './tmp/agent-context-metadata',
            namespace: 'agent-context-metadata',
            ttl: 1800000, // 30 minutes
            ...this.cacheOptions,
        });
    }
    async getCache() {
        if (!this.cache) {
            if (!this.cachePromise) {
                this.cachePromise = this.initializeCache();
            }
            await this.cachePromise;
        }
        if (!this.cache) {
            throw new Error('Failed to initialize cache');
        }
        return this.cache;
    }
    async setMetadata(metadata) {
        const query = `
      INSERT INTO agent_context_metadata (
        agent_id, context_key, context_value, context_type, 
        visibility, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (agent_id, context_key) 
      DO UPDATE SET
        context_value = EXCLUDED.context_value,
        context_type = EXCLUDED.context_type,
        visibility = EXCLUDED.visibility,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW()
      RETURNING id, created_at, updated_at
    `;
        const result = await this.db.query(query, [
            metadata.agentId,
            metadata.contextKey,
            JSON.stringify(metadata.contextValue),
            metadata.contextType,
            metadata.visibility,
            metadata.expiresAt,
        ]);
        const createdMetadata = {
            ...metadata,
            id: result.rows[0].id,
            createdAt: result.rows[0].created_at,
            updatedAt: result.rows[0].updated_at,
        };
        // Update cache
        const cache = await this.getCache();
        await cache.set(`${metadata.agentId}:${metadata.contextKey}`, createdMetadata);
        return createdMetadata;
    }
    async getMetadata(agentId, key) {
        const cache = await this.getCache();
        if (key) {
            const cacheKey = `${agentId}:${key}`;
            const cached = await cache.get(cacheKey);
            if (cached) {
                return [cached];
            }
        }
        let query = `
      SELECT * FROM agent_context_metadata 
      WHERE agent_id = $1
    `;
        const params = [agentId];
        if (key) {
            query += ` AND context_key = $2`;
            params.push(key);
        }
        query += ` ORDER BY updated_at DESC`;
        const result = await this.db.query(query, params);
        const metadataList = result.rows.map(this.mapRowToMetadata);
        // Update cache
        if (key && metadataList.length > 0 && metadataList[0]) {
            await cache.set(`${agentId}:${key}`, metadataList[0]);
        }
        return metadataList;
    }
    async updateMetadata(agentId, key, value) {
        const query = `
      UPDATE agent_context_metadata 
      SET context_value = $1, updated_at = NOW()
      WHERE agent_id = $2 AND context_key = $3
      RETURNING *
    `;
        const result = await this.db.query(query, [JSON.stringify(value), agentId, key]);
        if (result.rows.length === 0) {
            throw new Error(`Metadata not found for agent ${agentId} and key ${key}`);
        }
        const updatedMetadata = this.mapRowToMetadata(result.rows[0]);
        // Update cache
        const cache = await this.getCache();
        await cache.set(`${agentId}:${key}`, updatedMetadata);
        return updatedMetadata;
    }
    async deleteMetadata(agentId, key) {
        const query = 'DELETE FROM agent_context_metadata WHERE agent_id = $1 AND context_key = $2';
        await this.db.query(query, [agentId, key]);
        // Update cache
        const cache = await this.getCache();
        await cache.set(`${agentId}:${key}`, undefined);
    }
    async queryMetadata(query) {
        let sql = `
      SELECT * FROM agent_context_metadata 
      WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;
        if (query.agentId) {
            sql += ` AND agent_id = $${paramIndex++}`;
            params.push(query.agentId);
        }
        if (query.contextType) {
            sql += ` AND context_type = $${paramIndex++}`;
            params.push(query.contextType);
        }
        if (query.visibility) {
            sql += ` AND visibility = $${paramIndex++}`;
            params.push(query.visibility);
        }
        if (query.keyPattern) {
            sql += ` AND context_key ILIKE $${paramIndex++}`;
            params.push(`%${query.keyPattern}%`);
        }
        // Filter out expired metadata
        sql += ` AND (expires_at IS NULL OR expires_at > NOW())`;
        sql += ` ORDER BY updated_at DESC`;
        if (query.limit) {
            sql += ` LIMIT $${paramIndex++}`;
            params.push(query.limit);
        }
        if (query.offset) {
            sql += ` OFFSET $${paramIndex++}`;
            params.push(query.offset);
        }
        const result = await this.db.query(sql, params);
        return result.rows.map(this.mapRowToMetadata);
    }
    async cleanupExpired() {
        const query = `
      DELETE FROM agent_context_metadata 
      WHERE expires_at IS NOT NULL AND expires_at <= NOW()
    `;
        await this.db.query(query);
        // Note: In a real implementation, you'd also want to clean up cache entries
        // for expired metadata
    }
    mapRowToMetadata(row) {
        return {
            id: row.id,
            agentId: row.agent_id,
            contextKey: row.context_key,
            contextValue: row.context_value ? JSON.parse(row.context_value) : {},
            contextType: row.context_type,
            visibility: row.visibility,
            expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
        };
    }
}
//# sourceMappingURL=metadata-store.js.map
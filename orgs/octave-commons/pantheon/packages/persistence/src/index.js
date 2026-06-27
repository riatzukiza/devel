/**
 * Pantheon Persistence Adapter
 * Wraps @promethean-os/persistence to provide ContextPort implementation
 */
import { makeContextPort } from '@promethean-os/pantheon-core';
/**
 * Internal cache manager for DualStoreManager instances with TTL and size limits.
 *
 * @class ManagerCache
 *
 * @example
 * ```typescript
 * const cache = new ManagerCache({ ttl: 60000, maxSize: 10 });
 * const managers = await cache.get('sources-key', async () => {
 *   return await fetchManagers();
 * });
 * ```
 */
class ManagerCache {
    cache = new Map();
    config;
    metrics = {
        hits: 0,
        misses: 0,
        sets: 0,
        evictions: 0,
        currentSize: 0,
    };
    /**
     * Creates a new ManagerCache instance.
     *
     * @param config - Cache configuration options
     */
    constructor(config = { ttl: 60000, maxSize: 10 }) {
        this.config = config;
    }
    /**
     * Retrieves managers from cache or fetches them using the provided function.
     *
     * @param key - Cache key for the managers
     * @param fetcher - Async function to fetch managers when cache miss occurs
     * @returns Promise resolving to DualStoreManager array
     */
    async get(key, fetcher) {
        const cached = this.cache.get(key);
        const now = Date.now();
        if (cached && now - cached.timestamp < this.config.ttl) {
            this.metrics.hits++;
            return cached.managers;
        }
        this.metrics.misses++;
        const managers = await fetcher();
        // Check if we need to evict entries
        if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
            this.evictOldest();
        }
        this.cache.set(key, { managers, timestamp: now });
        this.metrics.sets++;
        this.metrics.currentSize = this.cache.size;
        // Cleanup expired entries
        this.cleanup();
        return managers;
    }
    /**
     * Gets current cache metrics.
     *
     * @returns Copy of current cache metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Clears all cached entries and resets metrics.
     */
    clear() {
        this.cache.clear();
        this.metrics.currentSize = 0;
    }
    /**
     * Evicts the oldest entry from cache.
     * @private
     */
    evictOldest() {
        let oldestKey = null;
        let oldestTime = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (value.timestamp < oldestTime) {
                oldestTime = value.timestamp;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.metrics.evictions++;
        }
    }
    /**
     * Removes expired entries from cache.
     * @private
     */
    cleanup() {
        const now = Date.now();
        const keysToDelete = [];
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.config.ttl) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach((key) => {
            this.cache.delete(key);
            this.metrics.evictions++;
        });
        this.metrics.currentSize = this.cache.size;
    }
}
export const makePantheonPersistenceAdapter = (deps, cacheConfig) => {
    // Input validation for dependencies
    if (!deps) {
        throw new Error('Dependencies object is required for makePantheonPersistenceAdapter');
    }
    if (typeof deps.getStoreManagers !== 'function') {
        throw new Error('getStoreManagers function is required in dependencies');
    }
    // Initialize cache if config is provided
    let cache;
    if (cacheConfig) {
        cache = new ManagerCache(cacheConfig);
    }
    const contextDeps = {
        getCollectionsFor: async (sources) => {
            // Input validation for sources
            if (!Array.isArray(sources)) {
                throw new Error('Sources must be an array');
            }
            if (sources.length === 0) {
                console.warn('Empty sources array provided to getCollectionsFor');
                return [];
            }
            // Validate that all sources have valid IDs
            const invalidSources = sources.filter((source) => !source.id || typeof source.id !== 'string');
            if (invalidSources.length > 0) {
                console.warn('Found sources with invalid IDs:', invalidSources.map((s) => ({ id: s.id, label: s.label })));
            }
            try {
                // Create cache key based on source IDs
                const cacheKey = cache
                    ? `managers_${sources
                        .map((s) => s.id)
                        .sort()
                        .join(',')}`
                    : '';
                // Get managers, using cache if available
                const managers = cache
                    ? await cache.get(cacheKey, deps.getStoreManagers)
                    : await deps.getStoreManagers();
                if (!managers) {
                    console.warn('getStoreManagers returned null or undefined');
                    return [];
                }
                if (!Array.isArray(managers)) {
                    console.error('getStoreManagers did not return an array, got:', typeof managers);
                    throw new Error('getStoreManagers must return an array of DualStoreManager objects');
                }
                if (managers.length === 0) {
                    console.warn('No store managers available');
                    return [];
                }
                // Map context sources to actual store managers
                const validManagers = managers.filter((manager) => sources.some((source) => source.id && source.id === manager.name));
                if (validManagers.length === 0) {
                    const sourceIds = sources.filter((s) => s.id).map((s) => s.id);
                    const managerNames = managers.map((m) => m.name);
                    console.warn('No matching managers found for sources. Source IDs:', sourceIds, 'Available managers:', managerNames);
                }
                return validManagers;
            }
            catch (error) {
                console.error('Failed to get store managers:', error);
                throw new Error(`Store manager retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
        resolveRole: deps.resolveRole ||
            ((meta) => {
                // Default role resolution logic
                if (meta?.role)
                    return meta.role;
                if (meta?.type === 'user')
                    return 'user';
                if (meta?.type === 'assistant')
                    return 'assistant';
                return 'system';
            }),
        resolveName: deps.resolveName ||
            ((meta) => {
                // Default name resolution logic
                return meta?.displayName || meta?.name || meta?.id || 'Unknown';
            }),
        formatTime: deps.formatTime ||
            ((ms) => {
                // Default time formatting
                return new Date(ms).toISOString();
            }),
    };
    const contextPort = makeContextPort(contextDeps);
    // Add cache management methods if cache is enabled
    if (cache) {
        return Object.assign(contextPort, {
            getCacheMetrics: () => cache.getMetrics(),
            clearCache: () => cache.clear(),
        });
    }
    return contextPort;
};
//# sourceMappingURL=index.js.map
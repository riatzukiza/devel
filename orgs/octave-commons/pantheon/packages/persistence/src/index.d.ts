/**
 * Pantheon Persistence Adapter
 * Wraps @promethean-os/persistence to provide ContextPort implementation
 */
import type { ContextPort } from '@promethean-os/pantheon-core';
import type { DualStoreManager } from '@promethean-os/persistence';
/**
 * Metadata structure for context items used in role and name resolution.
 *
 * @interface ContextMetadata
 *
 * @example
 * ```typescript
 * const metadata: ContextMetadata = {
 *   role: 'user',
 *   type: 'user',
 *   displayName: 'John Doe',
 *   id: 'user-123',
 *   sessionId: 'session-456'
 * };
 * ```
 */
export interface ContextMetadata {
    /** Optional role specification for the context item */
    role?: 'system' | 'user' | 'assistant';
    /** Optional type specification (legacy support) */
    type?: 'user' | 'assistant';
    /** Optional display name for the context item */
    displayName?: string;
    /** Optional name field for the context item */
    name?: string;
    /** Optional unique identifier */
    id?: string;
    /** Additional metadata properties */
    [key: string]: unknown;
}
/**
 * Configuration options for the manager cache.
 *
 * @interface CacheConfig
 *
 * @example
 * ```typescript
 * const config: CacheConfig = {
 *   ttl: 300000, // 5 minutes
 *   maxSize: 20   // Maximum 20 cached entries
 * };
 * ```
 */
export interface CacheConfig {
    /** Time to live for cache entries in milliseconds */
    ttl: number;
    /** Maximum number of cached entries before eviction */
    maxSize: number;
}
/**
 * Metrics and statistics for cache performance monitoring.
 *
 * @interface CacheMetrics
 *
 * @example
 * ```typescript
 * const metrics: CacheMetrics = {
 *   hits: 150,
 *   misses: 25,
 *   sets: 30,
 *   evictions: 5,
 *   currentSize: 15
 * };
 * ```
 */
export interface CacheMetrics {
    /** Number of successful cache hits */
    hits: number;
    /** Number of cache misses */
    misses: number;
    /** Number of items added to cache */
    sets: number;
    /** Number of items evicted from cache */
    evictions: number;
    /** Current number of items in cache */
    currentSize: number;
}
/**
 * Dependencies required for creating a Pantheon persistence adapter.
 *
 * @interface PersistenceAdapterDeps
 *
 * @example
 * ```typescript
 * const deps: PersistenceAdapterDeps = {
 *   getStoreManagers: async () => [mongoManager, chromaManager],
 *   resolveRole: (meta) => meta.role || 'system',
 *   resolveName: (meta) => meta.displayName || 'Unknown',
 *   formatTime: (ms) => new Date(ms).toLocaleString()
 * };
 * ```
 */
export type PersistenceAdapterDeps = {
    /**
     * Function that returns available DualStoreManager instances.
     * This function is called whenever context compilation is requested.
     *
     * @returns Promise resolving to an array of DualStoreManager instances
     *
     * @example
     * ```typescript
     * getStoreManagers: async () => {
     *   return [mongoManager, chromaManager];
     * }
     * ```
     */
    getStoreManagers: () => Promise<DualStoreManager[]>;
    /**
     * Optional function to resolve message roles from metadata.
     * If not provided, a default resolution strategy will be used.
     *
     * @param meta - Optional metadata object containing role information
     * @returns The resolved role as 'system', 'user', or 'assistant'
     *
     * @example
     * ```typescript
     * resolveRole: (meta) => {
     *   if (meta?.sender === 'human') return 'user';
     *   if (meta?.sender === 'ai') return 'assistant';
     *   return 'system';
     * }
     * ```
     */
    resolveRole?: (meta?: ContextMetadata) => 'system' | 'user' | 'assistant';
    /**
     * Optional function to resolve display names from metadata.
     * If not provided, a default resolution strategy will be used.
     *
     * @param meta - Optional metadata object containing name information
     * @returns The resolved display name as a string
     *
     * @example
     * ```typescript
     * resolveName: (meta) => {
     *   return meta?.username || meta?.author || 'Anonymous';
     * }
     * ```
     */
    resolveName?: (meta?: ContextMetadata) => string;
    /**
     * Optional function to format timestamps for display.
     * If not provided, ISO string format will be used.
     *
     * @param ms - Timestamp in milliseconds since epoch
     * @returns Formatted time string
     *
     * @example
     * ```typescript
     * formatTime: (ms) => {
     *   return new Date(ms).toLocaleString('en-US', {
     *     hour: '2-digit',
     *     minute: '2-digit',
     *     month: 'short',
     *     day: 'numeric'
     *   });
     * }
     * ```
     */
    formatTime?: (ms: number) => string;
};
/**
 * Creates a Pantheon persistence adapter that bridges the Pantheon context system
 * with the persistence layer using DualStoreManager instances.
 *
 * This adapter provides a ContextPort implementation that compiles context from
 * persistence stores by mapping context sources to their corresponding store managers.
 *
 * @param deps - Dependencies required for the adapter
 * @param deps.getStoreManagers - Function that returns available DualStoreManager instances
 * @param deps.resolveRole - Optional function to resolve message roles from metadata
 * @param deps.resolveName - Optional function to resolve display names from metadata
 * @param deps.formatTime - Optional function to format timestamps
 * @param cacheConfig - Optional cache configuration for performance optimization
 * @returns A ContextPort implementation that compiles context from persistence stores
 *
 * @example
 * ```typescript
 * const adapter = makePantheonPersistenceAdapter({
 *   getStoreManagers: async () => [manager1, manager2],
 *   resolveRole: (meta) => meta.role || 'system'
 * });
 * ```
 *
 * @example
 * ```typescript
 * // With all optional dependencies and caching
 * const adapter = makePantheonPersistenceAdapter({
 *   getStoreManagers: async () => {
 *     const mongoManager = new DualStoreManager('mongodb', mongoClient);
 *     const chromaManager = new DualStoreManager('chroma', chromaClient);
 *     return [mongoManager, chromaManager];
 *   },
 *   resolveRole: (meta) => {
 *     if (meta?.sender === 'human') return 'user';
 *     if (meta?.sender === 'ai') return 'assistant';
 *     return 'system';
 *   },
 *   resolveName: (meta) => meta?.username || 'Anonymous',
 *   formatTime: (ms) => new Date(ms).toLocaleString()
 * }, { ttl: 300000, maxSize: 20 });
 * ```
 *
 * @throws {Error} When getStoreManagers is not provided or not a function
 * @throws {Error} When dependencies object is null or undefined
 *
 * @since 0.1.0
 */
/**
 * Metrics and statistics for cache performance monitoring.
 *
 * @interface CacheMetrics
 *
 * @example
 * ```typescript
 * const metrics: CacheMetrics = {
 *   hits: 150,
 *   misses: 25,
 *   sets: 30,
 *   evictions: 5,
 *   currentSize: 15
 * };
 * ```
 */
export interface CacheMetrics {
    /** Number of successful cache hits */
    hits: number;
    /** Number of cache misses */
    misses: number;
    /** Number of items added to cache */
    sets: number;
    /** Number of items evicted from cache */
    evictions: number;
    /** Current number of items in cache */
    currentSize: number;
}
export declare const makePantheonPersistenceAdapter: (deps: PersistenceAdapterDeps, cacheConfig?: CacheConfig) => ContextPort & {
    getCacheMetrics?: () => CacheMetrics;
    clearCache?: () => void;
};
//# sourceMappingURL=index.d.ts.map
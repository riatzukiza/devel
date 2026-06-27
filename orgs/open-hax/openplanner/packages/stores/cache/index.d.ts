export type Awaitable<T> = T | Promise<T>;

export interface CacheStats {
  type: string;
  size?: number;
  maxEntries?: number;
  defaultTtlMs?: number;
  prefix?: string;
  layers?: CacheStats[];
}

export interface CacheHandle {
  __openplannerCache?: true;
}

export interface CacheEntry<T = unknown> {
  "cache/key": string;
  "cache/value": T;
  "cache/created-at-ms": number;
  "cache/touched-at-ms": number;
  "cache/expires-at-ms"?: number | null;
  "cache/metadata"?: Record<string, unknown>;
}

export interface ProjectionEnvelope<T = unknown> {
  "projection/name": string;
  "projection/version": number;
  "projection/source-store": string;
  "projection/source-collection"?: string;
  "projection/source-key": string;
  "projection/source-updated-at"?: string;
  "projection/watermark"?: string;
  "projection/value": T;
  "projection/metadata"?: Record<string, unknown>;
}

export interface ExplainResult {
  valid: boolean;
  errors: Array<{ path: string[]; error: string; value?: unknown }>;
}

export function createMemoryLruCache(options?: { maxEntries?: number; defaultTtlMs?: number }): CacheHandle;
export function createRedisCache(options: { client: unknown; prefix?: string; defaultTtlMs?: number }): CacheHandle;
export function createLmdbCache(options: { db: unknown; prefix?: string; defaultTtlMs?: number }): CacheHandle;
export function createLayeredCache(caches: CacheHandle[]): CacheHandle;

export function cacheGet<T = unknown>(cache: CacheHandle, key: string): Awaitable<T | null>;
export function cachePut<T = unknown>(cache: CacheHandle, key: string, value: T, ttlMs?: number): Awaitable<unknown>;
export function cacheEvict(cache: CacheHandle, key: string): Awaitable<unknown>;
export function cacheTouch(cache: CacheHandle, key: string, ttlMs?: number): Awaitable<unknown>;
export function cacheCleanup(cache: CacheHandle): Awaitable<number>;
export function cacheStats(cache: CacheHandle): CacheStats;

export function cacheEntry<T = unknown>(options: {
  key: string;
  value: T;
  ttlMs?: number;
  nowMs?: number;
  metadata?: Record<string, unknown>;
}): CacheEntry<T>;
export function explainCacheEntry(entry: Record<string, unknown>): ExplainResult;
export function projectionEnvelope<T = unknown>(options: {
  name: string;
  version?: number;
  sourceStore: string;
  sourceCollection?: string;
  sourceKey: string;
  sourceUpdatedAt?: string;
  watermark?: string;
  value: T;
  metadata?: Record<string, unknown>;
}): ProjectionEnvelope<T>;
export function explainProjectionEnvelope(envelope: Record<string, unknown>): ExplainResult;

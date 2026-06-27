import type { Awaitable, CacheHandle, CacheStats } from "@open-hax/openplanner-store-cache";

export type { Awaitable, CacheHandle, CacheStats } from "@open-hax/openplanner-store-cache";

export interface DocumentSourceRef {
  sourcePath?: string;
  url?: string;
  hostname?: string;
  lake?: string;
  contentHash?: string;
  cacheKey: string;
}

export interface HydrationResult {
  row: Record<string, unknown>;
  hydrated: boolean;
  sourceRef?: DocumentSourceRef;
}

export function documentNeedsHydration(row: Record<string, unknown>): boolean;
export function documentSourceRef(row: Record<string, unknown>): DocumentSourceRef | null;
export function documentCacheKey(row: Record<string, unknown>): string | null;
export function hydrateDocumentRow(row: Record<string, unknown>, sourceText?: string | null): HydrationResult;
export function rowToDocument(row: Record<string, unknown>): Record<string, unknown>;

export function createMemoryLruCache(options?: { maxEntries?: number; defaultTtlMs?: number }): CacheHandle;
export function createRedisCache(options: { client: unknown; prefix?: string; defaultTtlMs?: number }): CacheHandle;
export function createLmdbCache(options: { db: unknown; prefix?: string; defaultTtlMs?: number }): CacheHandle;
export function createLayeredCache(caches: CacheHandle[]): CacheHandle;
export function cacheGet<T = string>(cache: CacheHandle, key: string): Awaitable<T | null>;
export function cachePut<T = string>(cache: CacheHandle, key: string, value: T, ttlMs?: number): Awaitable<unknown>;
export function cacheEvict(cache: CacheHandle, key: string): Awaitable<unknown>;
export function cacheTouch(cache: CacheHandle, key: string, ttlMs?: number): Awaitable<unknown>;
export function cacheCleanup(cache: CacheHandle): Awaitable<number>;
export function cacheStats(cache: CacheHandle): CacheStats;

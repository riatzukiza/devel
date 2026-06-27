import { readFile } from "node:fs/promises";
import path from "node:path";
import { open } from "lmdb";
import { createClient } from "redis";
import {
  cacheGet,
  cachePut,
  createLayeredCache,
  createLmdbCache,
  createMemoryLruCache,
  createRedisCache,
  documentCacheKey,
  documentNeedsHydration,
  hydrateDocumentRow,
} from "@open-hax/openplanner-document-hydration";
import type { CacheHandle } from "@open-hax/openplanner-document-hydration";

let hydrationCachePromise: Promise<CacheHandle> | null = null;

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== "string" || value.trim().length === 0) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function nonBlankString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

async function createHydrationCache(): Promise<CacheHandle> {
  const ttlMs = Number(process.env.OPENPLANNER_HYDRATION_CACHE_TTL_MS ?? 5 * 60 * 60 * 1000);
  const layers: CacheHandle[] = [createMemoryLruCache({ maxEntries: 1024, defaultTtlMs: ttlMs })];

  const redisUrl = process.env.OPENPLANNER_HYDRATION_REDIS_URL;
  if (redisUrl) {
    const client = createClient({ url: redisUrl });
    await client.connect();
    layers.push(createRedisCache({ client, prefix: "hydration:", defaultTtlMs: ttlMs }));
  }

  const lmdbPath = process.env.OPENPLANNER_HYDRATION_LMDB_PATH;
  if (lmdbPath) {
    const db = open({ path: lmdbPath });
    layers.push(createLmdbCache({ db, prefix: "hydration:", defaultTtlMs: ttlMs }));
  }

  return layers.length === 1 ? layers[0]! : createLayeredCache(layers);
}

export async function getHydrationCache(): Promise<CacheHandle> {
  hydrationCachePromise ??= createHydrationCache();
  return hydrationCachePromise;
}

export function sourceRoot(): string {
  return process.env.OPENPLANNER_SOURCE_ROOT ?? "/home/err/devel";
}

export function sourcePathFromRow(row: Record<string, unknown>): string | undefined {
  const extra = parseJsonObject(row.extra);
  const metadata = parseJsonObject(extra.metadata);
  const migration2 = parseJsonObject(extra.migration_2);
  return nonBlankString(extra.source_path)
    ?? nonBlankString(extra.path)
    ?? nonBlankString(metadata.path)
    ?? nonBlankString(metadata.file_id)
    ?? nonBlankString(migration2.source_path);
}

export function safeSourceFilePath(row: Record<string, unknown>): string | undefined {
  const rawPath = sourcePathFromRow(row);
  if (!rawPath) return undefined;

  const root = path.resolve(sourceRoot());
  const candidate = path.resolve(root, rawPath.startsWith("/") ? rawPath.slice(1) : rawPath);
  return candidate.startsWith(`${root}${path.sep}`) || candidate === root ? candidate : undefined;
}

export async function loadHydrationSourceText(row: Record<string, unknown>): Promise<string | null> {
  const cacheKey = documentCacheKey(row);
  if (!cacheKey) return null;

  const hydrationCache = await getHydrationCache();
  const cached = await cacheGet(hydrationCache, cacheKey);
  if (typeof cached === "string") return cached;

  const filePath = safeSourceFilePath(row);
  if (!filePath) return null;

  try {
    const text = await readFile(filePath, "utf8");
    await cachePut(hydrationCache, cacheKey, text);
    return text;
  } catch {
    return null;
  }
}

export async function hydrateRowFromSourceCache(row: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (!documentNeedsHydration(row)) return row;
  const sourceText = await loadHydrationSourceText(row);
  return hydrateDocumentRow(row, sourceText).row as Record<string, unknown>;
}

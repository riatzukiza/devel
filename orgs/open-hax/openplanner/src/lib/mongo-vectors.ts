import crypto from "node:crypto";
import type { ClientSession, Collection, Filter } from "mongodb";
import type { IEmbeddingFunction } from "./embeddings.js";
import { formatEmbeddingQueryText } from "./embedding-text.js";
import { batchPreparedChunks, isContextOverflowError, prepareIndexDocument } from "./indexing.js";
import type { MongoConnection, MongoVectorDocument, MongoVectorPartitionDocument } from "./mongodb.js";
import { OPENPLANNER_SCHEMA_TARGETS, vectorChunkMigrationState } from "./schema-versions.js";
import { loadHydrationSourceText } from "./source-hydration.js";

export type MongoVectorTier = "hot" | "compact";

type RawQueryResult = {
  ids: string[][];
  documents: string[][];
  metadatas: Array<Array<Record<string, unknown> | null>>;
  distances: Array<Array<number | null>>;
  include: ["documents", "metadatas", "distances"];
};

export type MongoVectorEntry = {
  id: string;
  parentId: string;
  text: string;
  embedding: number[];
  metadata: Record<string, unknown>;
};

type SourceRef = {
  source_path?: string;
  url?: string;
  hostname?: string;
  lake?: string;
  content_hash?: string;
};

const VECTOR_SEARCH_INDEX_NAME = "vs_embedding";
const FILTERABLE_PATHS = ["source", "kind", "project", "session", "visibility", "quality_label", "parent_id", "embedding_model"] as const;
const FILTERABLE_PATH_SET = new Set<string>(FILTERABLE_PATHS);
const VEXX_BASE_URL = String(process.env.VEXX_BASE_URL ?? "").trim();
const VEXX_API_KEY = String(process.env.VEXX_API_KEY ?? "").trim();
const VEXX_DEVICE = String(process.env.VEXX_DEVICE ?? "AUTO").trim() || "AUTO";
const VEXX_REQUIRE_ACCEL = /^(1|true|yes|on)$/i.test(String(process.env.VEXX_REQUIRE_ACCEL ?? ""));
const VEXX_ENFORCE = /^(1|true|yes|on)$/i.test(String(process.env.VEXX_ENFORCE ?? ""));
const VEXX_TIMEOUT_MS = (() => {
  const parsed = Number(process.env.VEXX_TIMEOUT_MS ?? "1500");
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1500;
})();
const VEXX_MIN_CANDIDATES = (() => {
  const parsed = Number(process.env.VEXX_MIN_CANDIDATES ?? "256");
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 256;
})();

function emptyResult(): RawQueryResult {
  return { ids: [[]], documents: [[]], metadatas: [[]], distances: [[]], include: ["documents", "metadatas", "distances"] };
}

function getFlatCollection(mongo: MongoConnection, tier: MongoVectorTier): Collection<MongoVectorDocument> {
  return tier === "compact" ? mongo.compactVectors : mongo.hotVectors;
}

function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  const parsed = new Date(String(value ?? new Date().toISOString()));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function toStringOrNull(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const next = String(value);
  return next.length > 0 ? next : null;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((entry) => String(entry ?? "").trim()).filter(Boolean))];
}

function parsePositiveIntEnv(name: string): number {
  const parsed = Number.parseInt(process.env[name] ?? "0", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function ttlExpiryFromNow(ttlSeconds: number): Date | undefined {
  return ttlSeconds > 0 ? new Date(Date.now() + ttlSeconds * 1000) : undefined;
}

function nonBlankString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function objectValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function sourceRefFromExtra(extra: Record<string, unknown> | undefined): SourceRef | null {
  const metadata = objectValue(extra?.metadata);
  const sourcePath = nonBlankString(extra?.source_path)
    ?? nonBlankString(extra?.path)
    ?? nonBlankString(metadata.path)
    ?? nonBlankString(metadata.file_id);
  const url = nonBlankString(extra?.url) ?? nonBlankString(metadata.url);
  const hostname = nonBlankString(extra?.hostname) ?? nonBlankString(metadata.hostname);
  const lake = nonBlankString(extra?.lake) ?? nonBlankString(metadata.lake);
  const contentHash = nonBlankString(extra?.content_hash)
    ?? nonBlankString(metadata.content_hash)
    ?? nonBlankString(objectValue(extra?.migration_2).text_hash_sha256);

  if (!sourcePath && !url && !hostname) return null;
  return {
    ...(sourcePath ? { source_path: sourcePath } : {}),
    ...(url ? { url } : {}),
    ...(hostname ? { hostname } : {}),
    ...(lake ? { lake } : {}),
    ...(contentHash ? { content_hash: contentHash } : {}),
  };
}

export async function hydrateVectorDocumentText(doc: MongoVectorDocument): Promise<string> {
  if (doc.text || doc.source_text_redacted !== true) return doc.text ?? "";
  const ref = objectValue(doc.source_ref);
  const sourceText = await loadHydrationSourceText({
    id: doc.parent_id ?? doc._id,
    text: "",
    project: nonBlankString(ref.lake) ?? doc.project,
    extra: {
      source_path: nonBlankString(ref.source_path) ?? nonBlankString(ref.sourcePath),
      url: nonBlankString(ref.url),
      hostname: nonBlankString(ref.hostname),
      lake: nonBlankString(ref.lake) ?? doc.project,
      content_hash: nonBlankString(ref.content_hash) ?? nonBlankString(ref.contentHash),
    },
  });
  if (!sourceText) return "";
  const start = typeof doc.char_start === "number" && doc.char_start >= 0 ? doc.char_start : null;
  const end = typeof doc.char_end === "number" && doc.char_end >= 0 ? doc.char_end : null;
  if (start !== null && end !== null && end >= start) {
    return sourceText.slice(start, end);
  }
  return sourceText;
}

function sha256Text(text: string): string {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function sourceRedactionMetadata(params: {
  extra?: Record<string, unknown>;
  rawText: string;
  chunkText: string;
  charStart?: number | null;
  charEnd?: number | null;
}): Record<string, unknown> {
  const sourceRef = sourceRefFromExtra(params.extra);
  if (!sourceRef) return {};
  return {
    source_text_redacted: true,
    source_ref: sourceRef,
    text_hash_sha256: sourceRef.content_hash ?? sha256Text(params.rawText),
    chunk_text_hash_sha256: sha256Text(params.chunkText),
    char_start: params.charStart ?? null,
    char_end: params.charEnd ?? null,
  };
}

function normalizeScalarFilterValue(value: unknown): unknown {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value;
  return undefined;
}

function buildMongoFilter(where: Record<string, unknown> | undefined): Filter<MongoVectorDocument> {
  const filter: Filter<MongoVectorDocument> = {};
  if (!where) return filter;

  for (const [key, rawValue] of Object.entries(where)) {
    if (rawValue === undefined || key === "search_tier" || key.startsWith("$") || key.includes(".")) continue;
    if (!FILTERABLE_PATH_SET.has(key)) continue;

    if (typeof rawValue === "object" && rawValue !== null && !Array.isArray(rawValue)) {
      const record = rawValue as Record<string, unknown>;
      if (Array.isArray(record.$in)) {
        (filter as Record<string, unknown>)[key] = { $in: record.$in };
        continue;
      }
      if (Object.prototype.hasOwnProperty.call(record, "$eq")) {
        const normalized = normalizeScalarFilterValue(record.$eq);
        if (normalized !== undefined) {
          (filter as Record<string, unknown>)[key] = normalized;
        }
        continue;
      }
      if (Object.prototype.hasOwnProperty.call(record, "$ne")) {
        const normalized = normalizeScalarFilterValue(record.$ne);
        if (normalized !== undefined) {
          (filter as Record<string, unknown>)[key] = { $ne: normalized };
        }
        continue;
      }
      continue;
    }

    const normalized = normalizeScalarFilterValue(rawValue);
    if (normalized !== undefined) {
      (filter as Record<string, unknown>)[key] = normalized;
    }
  }

  return filter;
}

function dot(left: readonly number[], right: readonly number[]): number {
  if (left.length !== right.length) {
    throw new RangeError(`embedding length mismatch: left=${left.length} right=${right.length}`);
  }
  let total = 0;
  for (let index = 0; index < left.length; index += 1) {
    total += left[index]! * right[index]!;
  }
  return total;
}

function magnitude(input: readonly number[]): number {
  return Math.sqrt(dot(input, input));
}

function cosineSimilarity(left: readonly number[], right: readonly number[]): number {
  if (left.length === 0 || left.length !== right.length) return Number.NEGATIVE_INFINITY;
  const leftMagnitude = magnitude(left);
  const rightMagnitude = magnitude(right);
  if (leftMagnitude === 0 || rightMagnitude === 0) return Number.NEGATIVE_INFINITY;
  return dot(left, right) / (leftMagnitude * rightMagnitude);
}

function vexxRequiredError(context: string): Error {
  return new Error(`vexx_required:${context}`);
}

async function queryPartitionWithVexxTopK(params: {
  candidates: MongoVectorDocument[];
  queryEmbedding: number[];
  k: number;
}): Promise<Array<{ doc: MongoVectorDocument; score: number }> | null> {
  if (!VEXX_BASE_URL) return null;
  const validCandidates = params.candidates.filter(
    (doc) => Array.isArray(doc.embedding) && doc.embedding.length === params.queryEmbedding.length,
  );
  if (validCandidates.length < Math.max(params.k, VEXX_MIN_CANDIDATES)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VEXX_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${VEXX_BASE_URL.replace(/\/$/, "")}/v1/cosine/topk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(VEXX_API_KEY ? { Authorization: `Bearer ${VEXX_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        query: params.queryEmbedding,
        candidates: validCandidates.map((doc) => ({ id: doc._id, embedding: doc.embedding })),
        k: Math.max(1, params.k),
        device: VEXX_DEVICE,
        requireAccel: VEXX_REQUIRE_ACCEL,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) return null;

  const payload = await response.json() as { matches?: Array<{ id?: string; score?: number }> };
  if (!Array.isArray(payload.matches)) return null;

  const docsById = new Map(validCandidates.map((doc) => [doc._id, doc]));
  return payload.matches
    .map((match) => {
      const id = typeof match.id === "string" ? match.id : "";
      const score = typeof match.score === "number" ? match.score : Number.NEGATIVE_INFINITY;
      const doc = docsById.get(id);
      return doc ? { doc, score } : null;
    })
    .filter((entry): entry is { doc: MongoVectorDocument; score: number } => entry !== null && Number.isFinite(entry.score));
}

function toMetadata(doc: MongoVectorDocument): Record<string, unknown> {
  return {
    ts: doc.ts.toISOString(),
    source: doc.source,
    kind: doc.kind,
    project: doc.project ?? "",
    session: doc.session ?? "",
    author: doc.author ?? "",
    role: doc.role ?? "",
    model: doc.model ?? "",
    visibility: doc.visibility ?? "",
    quality_label: doc.quality_label ?? "",
    labels: doc.labels ?? [],
    title: doc.title ?? "",
    embedding_model: doc.embedding_model ?? "",
    embedding_dimensions: doc.embedding_dimensions ?? null,
    search_tier: doc.search_tier,
    parent_id: doc.parent_id,
    chunk_id: doc.chunk_id ?? doc._id,
    chunk_index: doc.chunk_index ?? 0,
    chunk_count: doc.chunk_count ?? 1,
    normalized_format: doc.normalized_format ?? null,
    normalized_estimated_tokens: doc.normalized_estimated_tokens ?? null,
    raw_estimated_tokens: doc.raw_estimated_tokens ?? null,
    seed_id: doc.seed_id ?? null,
    member_count: doc.member_count ?? null,
    char_count: doc.char_count ?? null,
    source_text_redacted: doc.source_text_redacted ?? false,
    source_ref: doc.source_ref ?? null,
    text_hash_sha256: doc.text_hash_sha256 ?? null,
    chunk_text_hash_sha256: doc.chunk_text_hash_sha256 ?? null,
    char_start: doc.char_start ?? null,
    char_end: doc.char_end ?? null,
    schema_version: doc.schema_version ?? null,
    migration_state: doc.migration_state ?? null,
  };
}

async function ensureVectorTtlIndex(collection: Collection<MongoVectorDocument>, tier: MongoVectorTier): Promise<void> {
  const ttlSeconds = tier === "hot"
    ? parsePositiveIntEnv("MONGODB_EVENTS_TTL_SECONDS")
    : parsePositiveIntEnv("MONGODB_COMPACTED_TTL_SECONDS");
  if (ttlSeconds <= 0) return;

  const name = tier === "hot" ? "hot_vectors_ttl" : "compact_vectors_ttl";
  const existing = (await collection.indexes()).find((index) => index.name === name);
  if (
    existing
    && (
      existing.expireAfterSeconds !== 0
      || JSON.stringify(existing.partialFilterExpression ?? {}) !== JSON.stringify({})
    )
  ) {
    await collection.dropIndex(name);
  }

  await collection.createIndex(
    { expiresAt: 1 },
    {
      expireAfterSeconds: 0,
      name,
      background: true,
    },
  );
}

function sanitizeModelName(model: string): string {
  return model.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "model";
}

function hashModelName(model: string): string {
  return crypto.createHash("sha1").update(model).digest("hex").slice(0, 10);
}

function makePartitionCollectionName(baseCollectionName: string, model: string, dimensions: number): string {
  return `${baseCollectionName}__${sanitizeModelName(model)}__d${dimensions}__${hashModelName(model)}`;
}

function makePartitionKey(model: string, dimensions: number): string {
  return `${model}::${dimensions}`;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForQueryableSearchIndex(
  collection: Collection<MongoVectorDocument>,
  indexName: string,
  timeoutMs = 60_000,
  pollMs = 2_000,
): Promise<void> {
  const startedAt = Date.now();
  let lastState = "missing";

  while (Date.now() - startedAt < timeoutMs) {
    const [index] = await collection.listSearchIndexes(indexName).toArray() as Array<Record<string, unknown>>;
    if (index) {
      const status = String(index.status ?? "UNKNOWN").toUpperCase();
      const queryable = index.queryable === true;
      lastState = `${status} queryable=${String(queryable)}`;
      if (status === "READY" && queryable) {
        return;
      }
      if (status === "FAILED" || status === "DOES_NOT_EXIST") {
        throw new Error(`vector search index ${indexName} failed: ${lastState}`);
      }
    }

    await sleep(pollMs);
  }

  throw new Error(`timed out waiting for vector search index ${indexName} to become queryable (${lastState})`);
}

async function ensurePartitionSupportIndexes(collection: Collection<MongoVectorDocument>, tier: MongoVectorTier): Promise<void> {
  await collection.createIndex({ parent_id: 1, chunk_index: 1 });
  await collection.createIndex({ ts: -1 });
  await collection.createIndex({ source: 1, ts: -1 });
  await collection.createIndex({ kind: 1, ts: -1 });
  await collection.createIndex({ project: 1, ts: -1 });
  await collection.createIndex({ session: 1, ts: -1 });
  await collection.createIndex({ visibility: 1, ts: -1 });
  await collection.createIndex({ quality_label: 1, ts: -1 });
  await collection.createIndex({ labels: 1, ts: -1 });
  await collection.createIndex({ embedding_model: 1, embedding_dimensions: 1, ts: -1 });
  await collection.createIndex({ schema_version: 1, ts: -1 });
  await ensureVectorTtlIndex(collection, tier);
}

async function ensurePartitionVectorSearchIndex(
  mongo: MongoConnection,
  partition: MongoVectorPartitionDocument,
): Promise<void> {
  const collection = mongo.db.collection<MongoVectorDocument>(partition.collectionName);
  try {
    const existing = await collection.listSearchIndexes(partition.searchIndexName).toArray();
    if (existing.length === 0) {
      await collection.createSearchIndex({
        name: partition.searchIndexName,
        type: "vectorSearch",
        definition: {
          fields: [
            {
              type: "vector",
              path: "embedding",
              numDimensions: partition.dimensions,
              similarity: "cosine",
            },
            ...FILTERABLE_PATHS.map((path) => ({ type: "filter", path })),
          ],
        },
      });
    }

    await waitForQueryableSearchIndex(collection, partition.searchIndexName);

    await mongo.vectorPartitions.updateOne(
      { _id: partition._id },
      {
        $set: {
          searchIndexStatus: "ready",
          lastError: null,
          updatedAt: new Date(),
        },
      },
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    await mongo.vectorPartitions.updateOne(
      { _id: partition._id },
      {
        $set: {
          searchIndexStatus: "error",
          lastError: detail,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
  }
}

async function ensureVectorPartition(
  mongo: MongoConnection,
  tier: MongoVectorTier,
  model: string,
  dimensions: number,
): Promise<{ partition: MongoVectorPartitionDocument; collection: Collection<MongoVectorDocument> }> {
  const baseCollection = getFlatCollection(mongo, tier);
  const collectionName = makePartitionCollectionName(baseCollection.collectionName, model, dimensions);
  const partitionId = `${tier}:${model}:${dimensions}`;
  const now = new Date();

  await mongo.vectorPartitions.updateOne(
    { _id: partitionId },
    {
      $set: {
        tier,
        model,
        dimensions,
        collectionName,
        searchIndexName: VECTOR_SEARCH_INDEX_NAME,
        updatedAt: now,
      },
      $setOnInsert: {
        searchIndexStatus: "pending",
        lastError: null,
        createdAt: now,
      },
    },
    { upsert: true },
  );

  const partition = await mongo.vectorPartitions.findOne({ _id: partitionId });
  if (!partition) {
    throw new Error(`failed to materialize vector partition ${partitionId}`);
  }

  const collection = mongo.db.collection<MongoVectorDocument>(collectionName);
  await ensurePartitionSupportIndexes(collection, tier);
  await ensurePartitionVectorSearchIndex(mongo, partition);
  return { partition: { ...partition, collectionName }, collection };
}

function isTransactionUnsupported(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Transaction numbers are only allowed|transactions are not supported|replica set member|mongos/i.test(message);
}

async function withMongoTransaction<T>(
  mongo: MongoConnection,
  work: (session: ClientSession | undefined) => Promise<T>,
): Promise<T> {
  const session = mongo.client.startSession();
  try {
    return await session.withTransaction(async () => work(session));
  } catch (error) {
    if (isTransactionUnsupported(error)) {
      return await work(undefined);
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

async function bulkWriteVectorDocuments(
  collection: Collection<MongoVectorDocument>,
  documents: ReadonlyArray<MongoVectorDocument>,
  now: Date,
  session?: ClientSession,
): Promise<void> {
  if (documents.length === 0) return;
  await collection.bulkWrite(
    documents.map((doc) => {
      const { createdAt, ...docWithoutCreatedAt } = doc;
      return {
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: { ...docWithoutCreatedAt, updatedAt: now },
            $setOnInsert: { createdAt },
          },
          upsert: true,
        },
      };
    }),
    { ordered: false, ...(session ? { session } : {}) },
  );
}

async function deletePartitionDocuments(
  mongo: MongoConnection,
  partitionCollectionNames: ReadonlyArray<string>,
  filter: Filter<MongoVectorDocument>,
  session?: ClientSession,
): Promise<void> {
  if (session) {
    for (const collectionName of partitionCollectionNames) {
      await mongo.db.collection<MongoVectorDocument>(collectionName).deleteMany(filter, { session });
    }
    return;
  }

  await Promise.all(
    partitionCollectionNames.map((collectionName) => mongo.db.collection<MongoVectorDocument>(collectionName).deleteMany(filter)),
  );
}

export async function listMongoVectorPartitions(
  mongo: MongoConnection,
  tier: MongoVectorTier,
): Promise<MongoVectorPartitionDocument[]> {
  return mongo.vectorPartitions.find({ tier }).sort({ updatedAt: -1 }).toArray();
}

function toMongoVectorDocument(entry: MongoVectorEntry, tier: MongoVectorTier, now: Date): MongoVectorDocument {
  const ts = asDate(entry.metadata.ts);
  const sourceTextRedacted = entry.metadata.source_text_redacted === true;
  const labels = toStringArray(entry.metadata.labels);
  const ttlSeconds = tier === "hot"
    ? parsePositiveIntEnv("MONGODB_EVENTS_TTL_SECONDS")
    : parsePositiveIntEnv("MONGODB_COMPACTED_TTL_SECONDS");
  return {
    _id: entry.id,
    parent_id: entry.parentId,
    text: sourceTextRedacted ? "" : entry.text,
    embedding: entry.embedding,
    ts,
    source: toStringOrNull(entry.metadata.source) ?? "",
    kind: toStringOrNull(entry.metadata.kind) ?? "",
    project: toStringOrNull(entry.metadata.project),
    session: toStringOrNull(entry.metadata.session),
    author: toStringOrNull(entry.metadata.author),
    role: toStringOrNull(entry.metadata.role),
    model: toStringOrNull(entry.metadata.model),
    visibility: toStringOrNull(entry.metadata.visibility),
    quality_label: toStringOrNull(entry.metadata.quality_label),
    labels,
    title: toStringOrNull(entry.metadata.title),
    embedding_model: toStringOrNull(entry.metadata.embedding_model),
    embedding_dimensions: entry.embedding.length,
    search_tier: tier,
    chunk_id: toStringOrNull(entry.metadata.chunk_id) ?? entry.id,
    chunk_index: toNumberOrNull(entry.metadata.chunk_index),
    chunk_count: toNumberOrNull(entry.metadata.chunk_count),
    normalized_format: toStringOrNull(entry.metadata.normalized_format),
    normalized_estimated_tokens: toNumberOrNull(entry.metadata.normalized_estimated_tokens),
    raw_estimated_tokens: toNumberOrNull(entry.metadata.raw_estimated_tokens),
    seed_id: toStringOrNull(entry.metadata.seed_id),
    member_count: toNumberOrNull(entry.metadata.member_count),
    char_count: toNumberOrNull(entry.metadata.char_count),
    source_text_redacted: sourceTextRedacted,
    source_ref: sourceTextRedacted ? objectValue(entry.metadata.source_ref) : null,
    text_hash_sha256: toStringOrNull(entry.metadata.text_hash_sha256),
    chunk_text_hash_sha256: toStringOrNull(entry.metadata.chunk_text_hash_sha256),
    char_start: toNumberOrNull(entry.metadata.char_start),
    char_end: toNumberOrNull(entry.metadata.char_end),
    schema_version: OPENPLANNER_SCHEMA_TARGETS.vectorChunk,
    migration_state: vectorChunkMigrationState(now),
    expiresAt: labels.length > 0 ? null : ttlExpiryFromNow(ttlSeconds) ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function upsertMongoVectorDocuments(
  mongo: MongoConnection,
  tier: MongoVectorTier,
  entries: ReadonlyArray<MongoVectorEntry>,
): Promise<void> {
  if (entries.length === 0) return;

  const now = new Date();
  const flatCollection = getFlatCollection(mongo, tier);
  const documents = entries.map((entry) => toMongoVectorDocument(entry, tier, now));

  const groups = new Map<string, { model: string; dimensions: number; documents: MongoVectorDocument[] }>();
  for (const doc of documents) {
    const model = doc.embedding_model ?? "unknown-model";
    const dimensions = doc.embedding.length;
    const key = makePartitionKey(model, dimensions);
    const existing = groups.get(key) ?? { model, dimensions, documents: [] };
    existing.documents.push(doc);
    groups.set(key, existing);
  }

  const partitionCollections = new Map<string, Collection<MongoVectorDocument>>();
  for (const [key, group] of groups.entries()) {
    const { collection } = await ensureVectorPartition(mongo, tier, group.model, group.dimensions);
    partitionCollections.set(key, collection);
  }

  await withMongoTransaction(mongo, async (session) => {
    const existingDocs = await flatCollection.find(
      { _id: { $in: documents.map((doc) => doc._id) } },
      session ? { session } : undefined,
    ).project<{ _id: string; embedding_model?: string | null; embedding_dimensions?: number | null }>({
      _id: 1,
      embedding_model: 1,
      embedding_dimensions: 1,
    }).toArray();

    const stalePartitionIds = new Map<string, { model: string; dimensions: number; ids: string[] }>();
    const nextPartitionById = new Map(documents.map((doc) => [doc._id, makePartitionKey(doc.embedding_model ?? "unknown-model", doc.embedding.length)]));
    for (const existing of existingDocs) {
      const previousModel = existing.embedding_model ?? "unknown-model";
      const previousDimensions = Number(existing.embedding_dimensions ?? 0);
      if (!Number.isFinite(previousDimensions) || previousDimensions <= 0) continue;
      const previousKey = makePartitionKey(previousModel, previousDimensions);
      if (previousKey === nextPartitionById.get(existing._id)) continue;
      const stale = stalePartitionIds.get(previousKey) ?? { model: previousModel, dimensions: previousDimensions, ids: [] };
      stale.ids.push(existing._id);
      stalePartitionIds.set(previousKey, stale);
    }

    for (const stale of stalePartitionIds.values()) {
      await mongo.db.collection<MongoVectorDocument>(makePartitionCollectionName(flatCollection.collectionName, stale.model, stale.dimensions)).deleteMany(
        { _id: { $in: stale.ids } },
        session ? { session } : undefined,
      );
    }

    await bulkWriteVectorDocuments(flatCollection, documents, now, session);
    for (const [key, group] of groups.entries()) {
      const collection = partitionCollections.get(key);
      if (!collection) continue;
      await bulkWriteVectorDocuments(collection, group.documents, now, session);
    }
  });
}

async function deleteMongoVectorEntriesByParent(
  mongo: MongoConnection,
  tier: MongoVectorTier,
  parentId: string,
  session?: ClientSession,
): Promise<void> {
  await getFlatCollection(mongo, tier).deleteMany({ parent_id: parentId }, session ? { session } : undefined);
  const partitions = await listMongoVectorPartitions(mongo, tier);
  await deletePartitionDocuments(
    mongo,
    partitions.map((partition) => partition.collectionName),
    { parent_id: parentId },
    session,
  );
}

export async function deleteMongoVectorEntriesByFilter(
  mongo: MongoConnection,
  tier: MongoVectorTier,
  where: Record<string, unknown>,
): Promise<void> {
  const filter = buildMongoFilter(where);
  if (Object.keys(filter).length === 0) {
    throw new Error("deleteMongoVectorEntriesByFilter requires at least one supported filter field");
  }
  const partitions = await listMongoVectorPartitions(mongo, tier);
  await withMongoTransaction(mongo, async (session) => {
    await getFlatCollection(mongo, tier).deleteMany(filter, session ? { session } : undefined);
    await deletePartitionDocuments(
      mongo,
      partitions.map((partition) => partition.collectionName),
      filter,
      session,
    );
  });
}

async function updatePartitionVectorLabels(
  mongo: MongoConnection,
  tier: MongoVectorTier,
  parentId: string,
  update: Record<string, unknown> | Record<string, unknown>[],
): Promise<void> {
  const partitions = await listMongoVectorPartitions(mongo, tier);
  await Promise.all(partitions.map((partition) => (
    mongo.db.collection<MongoVectorDocument>(partition.collectionName).updateMany({ parent_id: parentId }, update)
  )));
}

export async function addMongoVectorParentLabel(
  mongo: MongoConnection,
  parentId: string,
  label: string,
): Promise<void> {
  const normalized = label.trim();
  if (!normalized) return;
  const update = [
    {
      $set: {
        labels: {
          $setUnion: [
            { $cond: [{ $isArray: "$labels" }, "$labels", []] },
            [normalized],
          ],
        },
        expiresAt: "$$REMOVE",
        updatedAt: new Date(),
      },
    },
  ];
  await Promise.all([
    mongo.hotVectors.updateMany({ parent_id: parentId }, update),
    mongo.compactVectors.updateMany({ parent_id: parentId }, update),
    updatePartitionVectorLabels(mongo, "hot", parentId, update),
    updatePartitionVectorLabels(mongo, "compact", parentId, update),
  ]);
}

export async function removeMongoVectorParentLabel(
  mongo: MongoConnection,
  parentId: string,
  label: string,
): Promise<void> {
  const normalized = label.trim();
  if (!normalized) return;
  const updateForTier = (tier: MongoVectorTier) => {
    const ttlSeconds = tier === "hot"
      ? parsePositiveIntEnv("MONGODB_EVENTS_TTL_SECONDS")
      : parsePositiveIntEnv("MONGODB_COMPACTED_TTL_SECONDS");
    const expiresAt = ttlExpiryFromNow(ttlSeconds) ?? null;
    return [
      {
        $set: {
          labels: {
            $filter: {
              input: { $cond: [{ $isArray: "$labels" }, "$labels", []] },
              as: "existingLabel",
              cond: { $ne: ["$$existingLabel", normalized] },
            },
          },
          updatedAt: new Date(),
        },
      },
      {
        $set: {
          expiresAt: {
            $cond: [
              { $gt: [{ $size: "$labels" }, 0] },
              "$$REMOVE",
              expiresAt,
            ],
          },
        },
      },
    ];
  };
  const hotUpdate = updateForTier("hot");
  const compactUpdate = updateForTier("compact");
  await Promise.all([
    mongo.hotVectors.updateMany({ parent_id: parentId }, hotUpdate),
    mongo.compactVectors.updateMany({ parent_id: parentId }, compactUpdate),
    updatePartitionVectorLabels(mongo, "hot", parentId, hotUpdate),
    updatePartitionVectorLabels(mongo, "compact", parentId, compactUpdate),
  ]);
}

export async function replaceMongoVectorEntries(
  mongo: MongoConnection,
  tier: MongoVectorTier,
  parentId: string,
  entries: ReadonlyArray<MongoVectorEntry>,
): Promise<void> {
  const now = new Date();
  const documents = entries.map((entry) => toMongoVectorDocument(entry, tier, now));
  const groups = new Map<string, { model: string; dimensions: number; documents: MongoVectorDocument[] }>();
  for (const doc of documents) {
    const model = doc.embedding_model ?? "unknown-model";
    const dimensions = doc.embedding.length;
    const key = makePartitionKey(model, dimensions);
    const existing = groups.get(key) ?? { model, dimensions, documents: [] };
    existing.documents.push(doc);
    groups.set(key, existing);
  }

  const partitionCollections = new Map<string, Collection<MongoVectorDocument>>();
  for (const [key, group] of groups.entries()) {
    const { collection } = await ensureVectorPartition(mongo, tier, group.model, group.dimensions);
    partitionCollections.set(key, collection);
  }

  await withMongoTransaction(mongo, async (session) => {
    await deleteMongoVectorEntriesByParent(mongo, tier, parentId, session);
    await bulkWriteVectorDocuments(getFlatCollection(mongo, tier), documents, now, session);
    for (const [key, group] of groups.entries()) {
      const collection = partitionCollections.get(key);
      if (!collection) continue;
      await bulkWriteVectorDocuments(collection, group.documents, now, session);
    }
  });
}

export async function indexTextInMongoVectors(params: {
  mongo: MongoConnection;
  tier: MongoVectorTier;
  parentId: string;
  text: string;
  extra?: Record<string, unknown>;
  metadata: Record<string, unknown>;
  embeddingFunction: IEmbeddingFunction;
}): Promise<void> {
  const tryIndex = async (forceChunking: boolean): Promise<void> => {
    const prepared = prepareIndexDocument({
      parentId: params.parentId,
      text: params.text,
      extra: params.extra,
      forceChunking,
    });

    const entries: MongoVectorEntry[] = [];

    for (const batch of batchPreparedChunks(prepared.chunks)) {
      const texts = batch.map((chunk) => chunk.text);
      const embeddings = await params.embeddingFunction.generate(texts);
      if (!Array.isArray(embeddings) || embeddings.length !== batch.length) {
        throw new Error(`embedding batch size mismatch: expected ${batch.length}, got ${Array.isArray(embeddings) ? embeddings.length : 0}`);
      }
      const dimensions = Array.isArray(embeddings[0]) ? embeddings[0].length : 0;
      if (dimensions <= 0) {
        throw new Error(`embedding function returned an empty vector batch for ${params.parentId}`);
      }
      batch.forEach((chunk, index) => {
        const embedding = embeddings[index];
        if (!Array.isArray(embedding) || embedding.length !== dimensions || embedding.some((value) => typeof value !== "number" || !Number.isFinite(value))) {
          throw new Error(`invalid embedding vector for ${chunk.id} at batch index ${index}`);
        }
        entries.push({
          id: chunk.id,
          parentId: params.parentId,
          text: chunk.text,
          embedding,
          metadata: {
            ...params.metadata,
            ...sourceRedactionMetadata({
              extra: params.extra,
              rawText: prepared.rawText,
              chunkText: chunk.text,
              charStart: chunk.charStart,
              charEnd: chunk.charEnd,
            }),
            chunk_id: chunk.id,
            chunk_index: chunk.chunkIndex,
            chunk_count: chunk.chunkCount,
            normalized_format: prepared.normalizedFormat,
            normalized_estimated_tokens: prepared.normalizedEstimatedTokens,
            raw_estimated_tokens: prepared.rawEstimatedTokens,
          },
        });
      });
    }

    await replaceMongoVectorEntries(params.mongo, params.tier, params.parentId, entries);
  };

  try {
    await tryIndex(false);
  } catch (error) {
    if (!isContextOverflowError(error)) throw error;
    await tryIndex(true);
  }
}

async function queryPartitionWithNativeVectorSearch(params: {
  collection: Collection<MongoVectorDocument>;
  partition: MongoVectorPartitionDocument;
  queryEmbedding: number[];
  k: number;
  where?: Record<string, unknown>;
}): Promise<Array<{ doc: MongoVectorDocument; score: number }>> {
  const filter = buildMongoFilter(params.where);
  const pipeline: Record<string, unknown>[] = [
    {
      $vectorSearch: {
        index: params.partition.searchIndexName,
        path: "embedding",
        queryVector: params.queryEmbedding,
        numCandidates: Math.max(params.k * 20, 100),
        limit: Math.max(params.k * 20, 100),
        ...(Object.keys(filter).length > 0 ? { filter } : {}),
      },
    },
    {
      $project: {
        _id: 1,
        parent_id: 1,
        text: 1,
        embedding: 1,
        ts: 1,
        source: 1,
        kind: 1,
        project: 1,
        session: 1,
        author: 1,
        role: 1,
        model: 1,
        visibility: 1,
        quality_label: 1,
        title: 1,
        embedding_model: 1,
        embedding_dimensions: 1,
        search_tier: 1,
        chunk_id: 1,
        chunk_index: 1,
        chunk_count: 1,
        normalized_format: 1,
        normalized_estimated_tokens: 1,
        raw_estimated_tokens: 1,
        seed_id: 1,
        member_count: 1,
        char_count: 1,
        source_text_redacted: 1,
        source_ref: 1,
        text_hash_sha256: 1,
        chunk_text_hash_sha256: 1,
        char_start: 1,
        char_end: 1,
        createdAt: 1,
        updatedAt: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ];

  const rows = await params.collection.aggregate(pipeline).toArray() as Array<MongoVectorDocument & { score?: number }>;
  const rescored = await queryPartitionWithVexxTopK({
    candidates: rows,
    queryEmbedding: params.queryEmbedding,
    k: params.k,
  }).catch((error) => {
    if (VEXX_ENFORCE) throw error;
    return null;
  });
  if (rescored) return rescored;
  if (VEXX_ENFORCE) {
    throw vexxRequiredError(`native_vector_search:${params.partition.collectionName}`);
  }
  return rows.map((doc) => ({ doc, score: typeof doc.score === "number" ? doc.score : Number.NEGATIVE_INFINITY }));
}

async function queryPartitionWithCosineScan(params: {
  collection: Collection<MongoVectorDocument>;
  queryEmbedding: number[];
  k: number;
  where?: Record<string, unknown>;
}): Promise<Array<{ doc: MongoVectorDocument; score: number }>> {
  const filter = buildMongoFilter(params.where);
  const candidates = await params.collection.find(filter).sort({ ts: -1 }).limit(Math.max(params.k * 50, 1000)).toArray();
  const vexxRows = await queryPartitionWithVexxTopK({
    candidates,
    queryEmbedding: params.queryEmbedding,
    k: params.k,
  }).catch((error) => {
    if (VEXX_ENFORCE) throw error;
    return null;
  });
  if (vexxRows) return vexxRows;
  if (VEXX_ENFORCE) {
    throw vexxRequiredError(`cosine_scan:${params.collection.collectionName}`);
  }
  return candidates
    .map((doc) => ({ doc, score: cosineSimilarity(params.queryEmbedding, doc.embedding ?? []) }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((left, right) => right.score - left.score || left.doc._id.localeCompare(right.doc._id))
    .slice(0, Math.max(1, params.k));
}

export async function queryMongoVectorsByText(params: {
  mongo: MongoConnection;
  tier: MongoVectorTier;
  q: string;
  k: number;
  where?: Record<string, unknown>;
  getEmbeddingFunctionForModel: (model: string) => IEmbeddingFunction;
}): Promise<RawQueryResult> {
  const queryText = formatEmbeddingQueryText(params.q);
  const partitions = await listMongoVectorPartitions(params.mongo, params.tier);
  if (partitions.length === 0) {
    return emptyResult();
  }

  const rows: Array<{ doc: MongoVectorDocument; score: number }> = [];
  const queryEmbeddingsByPartitionKey = new Map<string, number[]>();

  for (const partition of partitions) {
    const collection = params.mongo.db.collection<MongoVectorDocument>(partition.collectionName);
    const cacheKey = `${partition.model}:${partition.dimensions}`;
    let queryEmbedding = queryEmbeddingsByPartitionKey.get(cacheKey);
    if (!queryEmbedding) {
      const embeddingFunction = params.getEmbeddingFunctionForModel(partition.model);
      const [generatedEmbedding] = await embeddingFunction.generate([queryText]);
      queryEmbedding = Array.isArray(generatedEmbedding) && generatedEmbedding.length === partition.dimensions
        ? generatedEmbedding
        : undefined;
      if (queryEmbedding) queryEmbeddingsByPartitionKey.set(cacheKey, queryEmbedding);
    }
    if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) continue;

    let partitionRows: Array<{ doc: MongoVectorDocument; score: number }>;
    if (partition.searchIndexStatus === "ready") {
      try {
        partitionRows = await queryPartitionWithNativeVectorSearch({
          collection,
          partition,
          queryEmbedding,
          k: params.k,
          where: params.where,
        });
      } catch {
        partitionRows = await queryPartitionWithCosineScan({
          collection,
          queryEmbedding,
          k: params.k,
          where: params.where,
        });
      }
    } else {
      partitionRows = await queryPartitionWithCosineScan({
        collection,
        queryEmbedding,
        k: params.k,
        where: params.where,
      });
    }

    rows.push(...partitionRows);
  }

  const sorted = rows
    .sort((left, right) => right.score - left.score || left.doc._id.localeCompare(right.doc._id))
    .slice(0, Math.max(1, params.k));
  const documents = await Promise.all(sorted.map((entry) => hydrateVectorDocumentText(entry.doc)));

  return {
    ids: [sorted.map((entry) => entry.doc._id)],
    documents: [documents],
    metadatas: [sorted.map((entry) => toMetadata(entry.doc))],
    distances: [sorted.map((entry) => Number.isFinite(entry.score) ? 1 - entry.score : null)],
    include: ["documents", "metadatas", "distances"],
  };
}

export function buildMongoVectorDeleteFilter(where: Record<string, unknown>): Filter<MongoVectorDocument> {
  return buildMongoFilter(where);
}

// ============================================================================
// GPU-Saturating Batch Indexing
// ============================================================================

/**
 * Configuration for parallel batch indexing
 */
export type BatchIndexConfig = {
  /** Number of documents to process in parallel (default: 16) */
  concurrency?: number;
  /** Number of chunks to embed in a single batch (default: 256) */
  embeddingBatchSize?: number;
  /** Number of documents to write to MongoDB in a single batch (default: 100) */
  mongoBatchSize?: number;
  /** Callback for progress reporting */
  onProgress?: (phase: string, completed: number, total: number) => void;
};

/**
 * Optimized batch indexer for GPU saturation during backfill.
 * 
 * Key optimizations:
 * 1. Pipelines embedding generation with MongoDB writes
 * 2. Uses larger batch sizes for GPU efficiency
 * 3. Processes multiple documents concurrently
 * 4. Fire-and-forget caching to avoid blocking
 */
export async function batchIndexTextsInMongoVectors(params: {
  mongo: MongoConnection;
  tier: MongoVectorTier;
  items: Array<{
    id: string;
    text: string;
    extra?: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }>;
  embeddingFunction: IEmbeddingFunction;
  config?: BatchIndexConfig;
}): Promise<{ indexed: number; failed: Array<{ id: string; error: string }> }> {
  const { items, embeddingFunction, config = {} } = params;
  const concurrency = config.concurrency ?? 16;
  const embeddingBatchSize = config.embeddingBatchSize ?? 256;
  const mongoBatchSize = config.mongoBatchSize ?? 100;
  
  const indexed: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];
  
  // Prepare all documents first
  const preparedItems: Array<{
    id: string;
    prepared: ReturnType<typeof prepareIndexDocument>;
    extra?: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }> = [];
  
  for (const item of items) {
    try {
      const prepared = prepareIndexDocument({
        parentId: item.id,
        text: item.text,
        extra: item.extra,
      });
      preparedItems.push({ id: item.id, prepared, extra: item.extra, metadata: item.metadata });
    } catch (error) {
      failed.push({ id: item.id, error: error instanceof Error ? error.message : String(error) });
    }
  }
  
  // Collect all chunks for batch embedding
  const allChunks: Array<{ chunkId: string; parentId: string; text: string; metadata: Record<string, unknown> }> = [];
  for (const item of preparedItems) {
    for (const chunk of item.prepared.chunks) {
      allChunks.push({
        chunkId: chunk.id,
        parentId: item.id,
        text: chunk.text,
        metadata: {
          ...item.metadata,
          ...sourceRedactionMetadata({
            extra: item.extra,
            rawText: item.prepared.rawText,
            chunkText: chunk.text,
            charStart: chunk.charStart,
            charEnd: chunk.charEnd,
          }),
          chunk_id: chunk.id,
          chunk_index: chunk.chunkIndex,
          chunk_count: chunk.chunkCount,
          normalized_format: item.prepared.normalizedFormat,
          normalized_estimated_tokens: item.prepared.normalizedEstimatedTokens,
          raw_estimated_tokens: item.prepared.rawEstimatedTokens,
        },
      });
    }
  }
  
  config.onProgress?.("embedding", 0, allChunks.length);
  
  // Generate embeddings in large batches for GPU saturation
  const embeddings = new Map<string, number[]>();
  const embeddingErrors = new Map<string, string>();
  
  for (let offset = 0; offset < allChunks.length; offset += embeddingBatchSize) {
    const batch = allChunks.slice(offset, offset + embeddingBatchSize);
    const texts = batch.map((c) => c.text);
    
    try {
      const vectors = await embeddingFunction.generate(texts);
      if (!Array.isArray(vectors) || vectors.length !== batch.length) {
        throw new Error(`Embedding batch size mismatch: expected ${batch.length}, got ${Array.isArray(vectors) ? vectors.length : 0}`);
      }
      batch.forEach((chunk, index) => {
        const vec = vectors[index];
        if (Array.isArray(vec) && vec.length > 0 && vec.every((v) => typeof v === "number" && Number.isFinite(v))) {
          embeddings.set(chunk.chunkId, vec);
        } else {
          embeddingErrors.set(chunk.chunkId, "Invalid embedding vector");
        }
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      batch.forEach((chunk) => embeddingErrors.set(chunk.chunkId, errorMsg));
    }
    
    config.onProgress?.("embedding", Math.min(offset + embeddingBatchSize, allChunks.length), allChunks.length);
  }
  
  // Group by parent for MongoDB upsert
  const entriesByParent = new Map<string, MongoVectorEntry[]>();
  for (const chunk of allChunks) {
    const embedding = embeddings.get(chunk.chunkId);
    if (!embedding) continue;
    
    const existing = entriesByParent.get(chunk.parentId) ?? [];
    existing.push({
      id: chunk.chunkId,
      parentId: chunk.parentId,
      text: chunk.text,
      embedding,
      metadata: chunk.metadata,
    });
    entriesByParent.set(chunk.parentId, existing);
  }
  
  config.onProgress?.("indexing", 0, entriesByParent.size);
  
  // Write to MongoDB with controlled concurrency
  const parentIds = Array.from(entriesByParent.keys());
  let completedCount = 0;
  
  const processParent = async (parentId: string): Promise<void> => {
    const entries = entriesByParent.get(parentId);
    if (!entries || entries.length === 0) return;
    
    try {
      await replaceMongoVectorEntries(params.mongo, params.tier, parentId, entries);
      indexed.push(parentId);
    } catch (error) {
      failed.push({
        id: parentId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    
    completedCount++;
    if (completedCount % mongoBatchSize === 0) {
      config.onProgress?.("indexing", completedCount, parentIds.length);
    }
  };
  
  // Process with concurrency control
  const queue = [...parentIds];
  const workers: Promise<void>[] = [];
  
  for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
    workers.push((async () => {
      while (queue.length > 0) {
        const parentId = queue.shift();
        if (!parentId) break;
        await processParent(parentId);
      }
    })());
  }
  
  await Promise.all(workers);
  
  config.onProgress?.("complete", indexed.length, items.length);
  
  return { indexed: indexed.length, failed };
}

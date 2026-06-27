import { createHash, randomUUID } from "node:crypto";

import type {
  Memory,
  MemoryCluster,
  MemoryContent,
  MemoryEmbedding,
  MemoryHashes,
  MemoryLifecycle,
  MemoryRetrieval,
  MemorySource,
  MemoryUsage,
} from "../types/index.js";

export const MEMORY_RECORD_SCHEMA_VERSION = 1;

export interface BoundaryMemoryRecord extends Memory {}

export interface NormalizeBoundaryMemoryRecordOptions {
  cephalonId?: string;
  sessionId?: string;
  schemaVersion?: number;
}

type UnknownRecord = Record<string, unknown>;

const DEFAULT_RETRIEVAL: MemoryRetrieval = {
  pinned: false,
  lockedByAdmin: false,
  lockedBySystem: false,
  weightKind: 1.0,
  weightSource: 1.0,
};

const DEFAULT_USAGE: MemoryUsage = {
  includedCountTotal: 0,
  includedCountDecay: 0,
  lastIncludedAt: 0,
};

const DEFAULT_EMBEDDING: MemoryEmbedding = {
  status: "none",
};

const DEFAULT_LIFECYCLE: MemoryLifecycle = {
  deleted: false,
};

const KNOWN_ROLES = new Set(["user", "assistant", "system", "developer", "tool"]);
const KNOWN_KINDS = new Map<string, Memory["kind"]>([
  ["message", "message"],
  ["event", "message"],
  ["tool_call", "tool_call"],
  ["tool-call", "tool_call"],
  ["tool_result", "tool_result"],
  ["tool-result", "tool_result"],
  ["think", "think"],
  ["image", "image"],
  ["summary", "summary"],
  ["admin", "admin"],
  ["aggregate", "aggregate"],
  ["system", "system"],
  ["developer", "developer"],
]);

const KNOWN_SOURCE_TYPES = new Set(["discord", "irc", "cli", "timer", "system", "admin", "sensor"]);

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valueFor(record: UnknownRecord | undefined, keys: string[]): unknown {
  if (!record) return undefined;
  for (const key of keys) {
    if (key in record) {
      return record[key];
    }
  }
  return undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.length > 0) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
    const parsedDate = Date.parse(value);
    if (Number.isFinite(parsedDate)) {
      return parsedDate;
    }
  }
  return undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  return value.filter((entry): entry is string => typeof entry === "string");
}

function normalizeToken(value: unknown): string | undefined {
  const raw = asString(value);
  if (!raw) return undefined;
  const trimmed = raw.replace(/^:/u, "").trim().toLowerCase();
  return trimmed.includes("/") ? trimmed.split("/").pop() : trimmed;
}

function normalizeRole(value: unknown): Memory["role"] {
  const token = normalizeToken(value);
  if (token && KNOWN_ROLES.has(token)) {
    return token as Memory["role"];
  }
  return "user";
}

function normalizeKind(value: unknown): Memory["kind"] {
  const token = normalizeToken(value)?.replace(/-/gu, "_");
  if (token && KNOWN_KINDS.has(token)) {
    return KNOWN_KINDS.get(token)!;
  }
  return "message";
}

function normalizeSourceType(value: unknown): MemorySource["type"] {
  const token = normalizeToken(value);
  if (token && KNOWN_SOURCE_TYPES.has(token)) {
    return token as MemorySource["type"];
  }
  return "system";
}

function contentHash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function normalizeContent(record: UnknownRecord): MemoryContent {
  const contentValue = valueFor(record, ["content", "memory/content"]);
  const contentRecord = isRecord(contentValue) ? contentValue : undefined;
  const text =
    asString(valueFor(contentRecord, ["text"]))
    ?? asString(valueFor(record, ["text", "memory/text", "content"]))
    ?? "";

  return {
    text,
    normalizedText:
      asString(valueFor(contentRecord, ["normalizedText", "normalized-text"]))
      ?? asString(valueFor(record, ["normalizedText", "normalized_text", "memory/normalized-text"])),
    snippets:
      asStringArray(valueFor(contentRecord, ["snippets"]))
      ?? asStringArray(valueFor(record, ["snippets", "memory/snippets"])),
  };
}

function normalizeSource(record: UnknownRecord): MemorySource {
  const sourceValue = valueFor(record, ["source", "memory/source"]);
  const sourceRecord = isRecord(sourceValue) ? sourceValue : undefined;
  const metaValue = valueFor(record, ["meta", "memory/meta"]);
  const meta = isRecord(metaValue) ? metaValue : undefined;

  return {
    type: normalizeSourceType(
      valueFor(sourceRecord, ["type"])
      ?? valueFor(meta, ["source", "type"]),
    ),
    guildId:
      asString(valueFor(sourceRecord, ["guildId", "guild-id"]))
      ?? asString(valueFor(meta, ["discord/guild-id", "guild-id"])),
    channelId:
      asString(valueFor(sourceRecord, ["channelId", "channel-id"]))
      ?? asString(valueFor(meta, ["discord/channel-id", "channel-id"])),
    authorId:
      asString(valueFor(sourceRecord, ["authorId", "author-id"]))
      ?? asString(valueFor(meta, ["discord/author-id", "author-id"])),
    authorIsBot:
      asBoolean(valueFor(sourceRecord, ["authorIsBot", "author-is-bot"]))
      ?? asBoolean(valueFor(meta, ["discord/author-bot", "author-bot"])),
  };
}

function normalizeCluster(record: UnknownRecord): MemoryCluster | undefined {
  const clusterValue = valueFor(record, ["cluster", "memory/cluster"]);
  const clusterRecord = isRecord(clusterValue) ? clusterValue : undefined;
  const normalized: MemoryCluster = {
    clusterId: asString(valueFor(clusterRecord, ["clusterId", "cluster-id"])),
    threadId: asString(valueFor(clusterRecord, ["threadId", "thread-id"])),
    spamFamilyId: asString(valueFor(clusterRecord, ["spamFamilyId", "spam-family-id"])),
    parentMemoryId: asString(valueFor(clusterRecord, ["parentMemoryId", "parent-memory-id"])),
    sourceMessageId:
      asString(valueFor(clusterRecord, ["sourceMessageId", "source-message-id"]))
      ?? asString(valueFor(record, ["memory/source-message-id"])),
  };
  return Object.values(normalized).some((value) => value !== undefined)
    ? normalized
    : undefined;
}

function normalizeRetrieval(record: UnknownRecord): MemoryRetrieval {
  const retrievalValue = valueFor(record, ["retrieval", "memory/retrieval"]);
  const retrievalRecord = isRecord(retrievalValue) ? retrievalValue : undefined;
  const lifecycleValue = valueFor(record, ["lifecycle", "memory/lifecycle"]);
  const lifecycleRecord = isRecord(lifecycleValue) ? lifecycleValue : undefined;

  return {
    pinned:
      asBoolean(valueFor(retrievalRecord, ["pinned"]))
      ?? asBoolean(valueFor(lifecycleRecord, ["pinned"]))
      ?? DEFAULT_RETRIEVAL.pinned,
    lockedByAdmin:
      asBoolean(valueFor(retrievalRecord, ["lockedByAdmin", "locked-by-admin"]))
      ?? DEFAULT_RETRIEVAL.lockedByAdmin,
    lockedBySystem:
      asBoolean(valueFor(retrievalRecord, ["lockedBySystem", "locked-by-system"]))
      ?? DEFAULT_RETRIEVAL.lockedBySystem,
    weightKind:
      asNumber(valueFor(retrievalRecord, ["weightKind", "weight-kind"]))
      ?? DEFAULT_RETRIEVAL.weightKind,
    weightSource:
      asNumber(valueFor(retrievalRecord, ["weightSource", "weight-source"]))
      ?? DEFAULT_RETRIEVAL.weightSource,
  };
}

function normalizeUsage(record: UnknownRecord): MemoryUsage {
  const usageValue = valueFor(record, ["usage", "memory/usage"]);
  const usageRecord = isRecord(usageValue) ? usageValue : undefined;

  return {
    includedCountTotal:
      asNumber(valueFor(usageRecord, ["includedCountTotal", "included-count-total", "included-total"]))
      ?? DEFAULT_USAGE.includedCountTotal,
    includedCountDecay:
      asNumber(valueFor(usageRecord, ["includedCountDecay", "included-count-decay", "included-decay"]))
      ?? DEFAULT_USAGE.includedCountDecay,
    lastIncludedAt:
      asNumber(valueFor(usageRecord, ["lastIncludedAt", "last-included-at"]))
      ?? DEFAULT_USAGE.lastIncludedAt,
  };
}

function normalizeEmbedding(record: UnknownRecord): MemoryEmbedding {
  const embeddingValue = valueFor(record, ["embedding", "memory/embedding"]);
  const embeddingRecord = isRecord(embeddingValue) ? embeddingValue : undefined;

  return {
    status:
      (normalizeToken(valueFor(embeddingRecord, ["status"])) as MemoryEmbedding["status"] | undefined)
      ?? DEFAULT_EMBEDDING.status,
    model: asString(valueFor(embeddingRecord, ["model"])),
    vectorId: asString(valueFor(embeddingRecord, ["vectorId", "vector-id"])),
    dims: asNumber(valueFor(embeddingRecord, ["dims"])),
    embeddedAt: asNumber(valueFor(embeddingRecord, ["embeddedAt", "embedded-at"])),
    vector: Array.isArray(valueFor(embeddingRecord, ["vector"]))
      ? (valueFor(embeddingRecord, ["vector"]) as Array<unknown>).filter(
          (entry): entry is number => typeof entry === "number" && Number.isFinite(entry),
        )
      : undefined,
  };
}

function normalizeLifecycle(record: UnknownRecord): MemoryLifecycle {
  const lifecycleValue = valueFor(record, ["lifecycle", "memory/lifecycle"]);
  const lifecycleRecord = isRecord(lifecycleValue) ? lifecycleValue : undefined;

  return {
    deleted:
      asBoolean(valueFor(lifecycleRecord, ["deleted"]))
      ?? DEFAULT_LIFECYCLE.deleted,
    deletedAt: asNumber(valueFor(lifecycleRecord, ["deletedAt", "deleted-at"])),
    replacedBySummaryId:
      asString(valueFor(lifecycleRecord, ["replacedBySummaryId", "replaced-by-summary-id", "replacedBy", "replaced-by"])),
  };
}

function normalizeHashes(record: UnknownRecord, text: string): MemoryHashes {
  const hashesValue = valueFor(record, ["hashes", "memory/hashes"]);
  const hashesRecord = isRecord(hashesValue) ? hashesValue : undefined;

  return {
    contentHash:
      asString(valueFor(hashesRecord, ["contentHash", "content-hash"]))
      ?? contentHash(text),
    normalizedHash:
      asString(valueFor(hashesRecord, ["normalizedHash", "normalized-hash"]))
      ?? asString(valueFor(record, ["memory/dedupe-key", "dedupeKey", "dedupe-key"])),
  };
}

export function isBoundaryMemoryRecord(value: unknown): value is BoundaryMemoryRecord {
  return (
    isRecord(value)
    && typeof value.id === "string"
    && typeof value.timestamp === "number"
    && isRecord(value.content)
    && isRecord(value.source)
  );
}

export function normalizeBoundaryMemoryRecord(
  value: BoundaryMemoryRecord | Memory | Record<string, unknown>,
  options: NormalizeBoundaryMemoryRecordOptions = {},
): BoundaryMemoryRecord {
  const record = isRecord(value) ? value : {};
  const content = normalizeContent(record);
  const lifecycle = normalizeLifecycle(record);

  return {
    id:
      asString(valueFor(record, ["id", "memory/id", "memoryId"]))
      ?? randomUUID(),
    timestamp:
      asNumber(valueFor(record, ["timestamp", "memory/timestamp", "memory/ts", "ts"]))
      ?? Date.now(),
    cephalonId:
      asString(valueFor(record, ["cephalonId", "memory/cephalon-id", "cephalon-id"]))
      ?? options.cephalonId
      ?? "unknown",
    sessionId:
      asString(valueFor(record, ["sessionId", "memory/session-id", "session-id"]))
      ?? asString(valueFor(isRecord(valueFor(record, ["meta", "memory/meta"])) ? (valueFor(record, ["meta", "memory/meta"]) as UnknownRecord) : undefined, ["session/id", "sessionId", "session-id"]))
      ?? options.sessionId
      ?? "unknown",
    eventId:
      asString(valueFor(record, ["eventId", "memory/event-id", "event-id"]))
      ?? asString(valueFor(isRecord(valueFor(record, ["meta", "memory/meta"])) ? (valueFor(record, ["meta", "memory/meta"]) as UnknownRecord) : undefined, ["event/id", "eventId", "event-id"]))
      ?? null,
    role: normalizeRole(valueFor(record, ["role", "memory/role"])),
    kind: normalizeKind(valueFor(record, ["kind", "memory/kind"])),
    content,
    source: normalizeSource(record),
    cluster: normalizeCluster(record),
    retrieval: normalizeRetrieval(record),
    usage: normalizeUsage(record),
    embedding: normalizeEmbedding(record),
    lifecycle,
    hashes: normalizeHashes(record, content.text),
    schemaVersion:
      asNumber(valueFor(record, ["schemaVersion", "memory/schema-version", "schema-version"]))
      ?? options.schemaVersion
      ?? MEMORY_RECORD_SCHEMA_VERSION,
  };
}

export function toBoundaryMemoryRecord(
  memory: Memory,
  options: NormalizeBoundaryMemoryRecordOptions = {},
): BoundaryMemoryRecord {
  return normalizeBoundaryMemoryRecord(memory, options);
}

export function fromBoundaryMemoryRecord(
  value: BoundaryMemoryRecord | Record<string, unknown>,
  options: NormalizeBoundaryMemoryRecordOptions = {},
): Memory {
  return normalizeBoundaryMemoryRecord(value, options);
}

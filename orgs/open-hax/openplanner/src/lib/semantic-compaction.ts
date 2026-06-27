import crypto from "node:crypto";
import type { OpenPlannerConfig } from "./config.js";
import { createEmbeddingRuntime, type EmbeddingRuntime } from "./embedding-runtime.js";
import { upsertCompactedMemory, type MongoConnection } from "./mongodb.js";
import { indexTextInMongoVectors, queryMongoVectorsByText } from "./mongo-vectors.js";
import { extractTieredVectorHits } from "./vector-search.js";

export type CompactableEvent = {
  id: string;
  ts: string;
  source: string;
  kind: string;
  project?: string | null;
  session?: string | null;
  message?: string | null;
  role?: string | null;
  author?: string | null;
  model?: string | null;
  text: string;
};

export type SemanticPack = {
  id: string;
  ts: string;
  source: string;
  kind: string;
  project?: string | null;
  session?: string | null;
  seedId: string;
  memberIds: string[];
  memberCount: number;
  charCount: number;
  embeddingModel: string;
  text: string;
  extra: Record<string, unknown>;
};

export type SemanticCompactionOptions = {
  maxNeighbors: number;
  maxChars: number;
  distanceThreshold: number;
  minClusterSize: number;
  maxPacksPerRun: number;
  minEventCount: number;
};

export type SemanticCompactionSummary = {
  ok: true;
  scannedEvents: number;
  skippedEvents: number;
  existingCompactedMembers: number;
  packsCreated: number;
  compactedMembers: number;
  hotCollection: string;
  compactCollection: string;
  compactEmbedModel: string;
  packIds: string[];
};

function toIso(value: unknown): string {
  if (typeof value === "string" && value.trim().length > 0) return value;
  return new Date().toISOString();
}

function line(value: string | null | undefined): string {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : "-";
}

export function normalizeSemanticText(text: string): string {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function renderPackMember(member: CompactableEvent, index: number): string {
  return [
    `## Message ${index + 1}`,
    `id: ${member.id}`,
    `ts: ${toIso(member.ts)}`,
    `source: ${line(member.source)}`,
    `kind: ${line(member.kind)}`,
    `project: ${line(member.project)}`,
    `session: ${line(member.session)}`,
    `role: ${line(member.role)}`,
    "",
    member.text.trim(),
    "",
  ].join("\n");
}

function buildPackId(memberIds: readonly string[]): string {
  const hash = crypto.createHash("sha256");
  hash.update(memberIds.join("\n"));
  return `pack-${hash.digest("hex").slice(0, 24)}`;
}

export function buildSemanticPack(
  seed: CompactableEvent,
  neighbors: ReadonlyArray<CompactableEvent>,
  opts: Pick<SemanticCompactionOptions, "maxChars" | "minClusterSize">,
  compactEmbedModel: string,
): SemanticPack | null {
  const selected: CompactableEvent[] = [];
  const seenNormalized = new Set<string>();

  const allCandidates = [seed, ...neighbors];
  let charCount = 0;

  for (const candidate of allCandidates) {
    const normalized = normalizeSemanticText(candidate.text);
    if (normalized.length === 0) continue;
    if (seenNormalized.has(normalized)) continue;

    const rendered = renderPackMember(candidate, selected.length);
    if (selected.length > 0 && charCount + rendered.length > opts.maxChars) break;

    selected.push(candidate);
    seenNormalized.add(normalized);
    charCount += rendered.length;
  }

  if (selected.length < opts.minClusterSize) return null;

  const packText = [
    "# Semantic memory pack",
    `seed_id: ${seed.id}`,
    `member_count: ${selected.length}`,
    `project: ${line(seed.project)}`,
    `session: ${line(seed.session)}`,
    `embedding_model: ${compactEmbedModel}`,
    "",
    ...selected.map((member, index) => renderPackMember(member, index)),
  ].join("\n");

  const memberIds = selected.map((member) => member.id);
  const packId = buildPackId(memberIds);
  const ts = selected[0]?.ts ?? seed.ts;

  return {
    id: packId,
    ts: toIso(ts),
    source: "openplanner.compaction",
    kind: "memory.compacted.semantic",
    project: seed.project,
    session: seed.session,
    seedId: seed.id,
    memberIds,
    memberCount: memberIds.length,
    charCount: packText.length,
    embeddingModel: compactEmbedModel,
    text: packText,
    extra: {
      seed_id: seed.id,
      project: seed.project,
      session: seed.session,
      member_ids: memberIds,
      member_count: memberIds.length,
      char_count: packText.length,
      strategy: "semantic-neighbor-pack-v1",
    },
  };
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function parsePositiveNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveCompactionOptions(cfg: OpenPlannerConfig, input: Record<string, unknown>): SemanticCompactionOptions {
  return {
    maxNeighbors: parsePositiveInt(input.maxNeighbors, cfg.semanticCompaction.maxNeighbors),
    maxChars: parsePositiveInt(input.maxChars, cfg.semanticCompaction.maxChars),
    distanceThreshold: parsePositiveNumber(input.distanceThreshold, cfg.semanticCompaction.distanceThreshold),
    minClusterSize: parsePositiveInt(input.minClusterSize, cfg.semanticCompaction.minClusterSize),
    maxPacksPerRun: parsePositiveInt(input.maxPacksPerRun, cfg.semanticCompaction.maxPacksPerRun),
    minEventCount: parsePositiveInt(input.minEventCount, cfg.semanticCompaction.minEventCount),
  };
}

async function loadCompactableEventsFromMongo(mongo: MongoConnection): Promise<CompactableEvent[]> {
  const rows = await mongo.events.find({ text: { $type: "string", $ne: "" } }).sort({ ts: 1 }).toArray();
  return rows.map((row) => ({
    id: row.id,
    ts: row.ts.toISOString(),
    source: row.source,
    kind: row.kind,
    project: row.project,
    session: row.session,
    message: row.message,
    role: row.role,
    author: row.author,
    model: row.model,
    text: row.text ?? "",
  }));
}

async function loadExistingCompactedMemberIdsFromMongo(mongo: MongoConnection): Promise<Set<string>> {
  const rows = await mongo.compacted.find({}, { projection: { members: 1 } }).toArray();
  const ids = new Set<string>();
  for (const row of rows) {
    const members = Array.isArray(row.members) ? row.members : [];
    for (const member of members) {
      if (typeof member === "string" && member.length > 0) ids.add(member);
    }
  }
  return ids;
}

async function upsertSemanticPackMongo(
  mongo: MongoConnection,
  runtime: EmbeddingRuntime,
  pack: SemanticPack,
): Promise<void> {
  await upsertCompactedMemory(mongo.compacted, {
    id: pack.id,
    ts: new Date(pack.ts),
    source: pack.source,
    kind: pack.kind,
    project: pack.project ?? null,
    session: pack.session ?? null,
    seed_id: pack.seedId,
    member_count: pack.memberCount,
    char_count: pack.charCount,
    embedding_model: pack.embeddingModel,
    text: pack.text,
    members: pack.memberIds,
    extra: pack.extra,
  });

  await indexTextInMongoVectors({
    mongo,
    tier: "compact",
    parentId: pack.id,
    text: pack.text,
    extra: pack.extra,
    metadata: {
      ts: pack.ts,
      source: pack.source,
      kind: pack.kind,
      project: pack.project ?? "",
      session: pack.session ?? "",
      embedding_model: pack.embeddingModel,
      search_tier: "compact",
      seed_id: pack.seedId,
      member_count: pack.memberCount,
      char_count: pack.charCount,
      visibility: "internal",
      title: pack.id,
    },
    embeddingFunction: runtime.compact.getBackgroundEmbeddingFunction(),
  });
}

/**
 * Run semantic compaction with parallel seed processing for GPU saturation.
 */
export async function runSemanticCompactionMongo(
  mongo: MongoConnection,
  cfg: OpenPlannerConfig,
  input: Record<string, unknown> = {},
  embeddingRuntime: EmbeddingRuntime = createEmbeddingRuntime(cfg),
): Promise<SemanticCompactionSummary> {
  if (!cfg.semanticCompaction.enabled) {
    throw new Error("semantic compaction disabled by config");
  }

  const options = resolveCompactionOptions(cfg, input);
  const events = await loadCompactableEventsFromMongo(mongo);
  const byId = new Map(events.map((event) => [event.id, event]));
  const usedIds = await loadExistingCompactedMemberIdsFromMongo(mongo);

  if (events.length < options.minEventCount && input.force !== true) {
    return {
      ok: true,
      scannedEvents: events.length,
      skippedEvents: events.length,
      existingCompactedMembers: usedIds.size,
      packsCreated: 0,
      compactedMembers: 0,
      hotCollection: mongo.hotVectors.collectionName,
      compactCollection: mongo.compactVectors.collectionName,
      compactEmbedModel: cfg.compactEmbedModel,
      packIds: [],
    };
  }

  const packIds: string[] = [];
  let packsCreated = 0;
  let compactedMembers = 0;
  let skippedEvents = 0;

  // Filter out already-used seeds upfront
  const availableSeeds = events.filter((event) => !usedIds.has(event.id));
  
  // Process seeds with controlled parallelism for GPU saturation
  // We batch vector searches to saturate the embedding GPU
  const concurrency = 8; // Process 8 seeds in parallel
  const batchSize = options.maxPacksPerRun;
  const seedsToProcess = availableSeeds.slice(0, batchSize);
  
  // Pre-compute embeddings for all seeds in large batches (GPU saturation)
  const seedTexts = seedsToProcess.map((seed) => seed.text);
  const embeddingPool = embeddingRuntime.hot.getParallelPool({});
  const allSeedEmbeddings = await embeddingPool.generate(seedTexts);
  const seedEmbeddings = new Map<string, number[]>();
  seedsToProcess.forEach((seed, index) => {
    const embedding = allSeedEmbeddings[index];
    if (Array.isArray(embedding) && embedding.length > 0) {
      seedEmbeddings.set(seed.id, embedding);
    }
  });

  // Process seeds in parallel batches
  for (let batchStart = 0; batchStart < seedsToProcess.length && packsCreated < options.maxPacksPerRun; batchStart += concurrency) {
    const batchSeeds = seedsToProcess.slice(batchStart, batchStart + concurrency);
    
    // Run vector searches in parallel
    const searchPromises = batchSeeds.map(async (seed) => {
      if (packsCreated >= options.maxPacksPerRun) return null;
      if (usedIds.has(seed.id)) return null;

      const where = typeof seed.project === "string" && seed.project.length > 0
        ? { project: seed.project }
        : undefined;

      const query = await queryMongoVectorsByText({
        mongo,
        tier: "hot",
        q: seed.text,
        k: Math.max(options.maxNeighbors, options.minClusterSize),
        where,
        getEmbeddingFunctionForModel: (model: string) => embeddingRuntime.hot.getEmbeddingFunctionForModel(model),
      });

      const neighbors = extractTieredVectorHits(query, "hot")
        .map((hit) => {
          const parentId = typeof hit.metadata.parent_id === "string" && hit.metadata.parent_id.length > 0
            ? hit.metadata.parent_id
            : hit.id;
          return { hit, parentId };
        })
        .filter(({ parentId }) => parentId !== seed.id)
        .filter(({ parentId }) => !usedIds.has(parentId))
        .filter(({ hit }) => typeof hit.distance === "number" && (hit.distance as number) <= options.distanceThreshold)
        .map(({ parentId }) => byId.get(parentId))
        .filter((event): event is CompactableEvent => Boolean(event));

      const pack = buildSemanticPack(seed, neighbors, options, cfg.compactEmbedModel);
      if (!pack) return null;

      return pack;
    });

    const packs = await Promise.all(searchPromises);
    
    // Upsert packs (can be done in parallel too)
    const upsertPromises: Promise<void>[] = [];
    for (const pack of packs) {
      if (!pack || packsCreated >= options.maxPacksPerRun) continue;
      if (pack.memberIds.some((id) => usedIds.has(id))) continue; // Race condition guard
      
      upsertPromises.push(upsertSemanticPackMongo(mongo, embeddingRuntime, pack));
      
      for (const memberId of pack.memberIds) usedIds.add(memberId);
      packsCreated++;
      compactedMembers += pack.memberIds.length;
      packIds.push(pack.id);
    }
    
    await Promise.all(upsertPromises);
    
    // Update skipped count
    skippedEvents = batchSeeds.filter((seed) => !packs.some((pack) => pack?.memberIds.includes(seed.id))).length;
  }

  return {
    ok: true,
    scannedEvents: events.length,
    skippedEvents,
    existingCompactedMembers: usedIds.size - compactedMembers,
    packsCreated,
    compactedMembers,
    hotCollection: mongo.hotVectors.collectionName,
    compactCollection: mongo.compactVectors.collectionName,
    compactEmbedModel: cfg.compactEmbedModel,
    packIds,
  };
}

/**
 * OpenPlanner Migration System
 *
 * Manages schema migrations for MongoDB backend.
 */

import fs from "node:fs/promises";
import path from "node:path";
import type { MongoConnection, MongoVectorDocument } from "./mongodb.js";
import { upsertMongoVectorDocuments } from "./mongo-vectors.js";

export interface MigrationContext {
  mongo: MongoConnection;
  dataDir: string;
  migrationsPath: string;
}

export interface Migration {
  id: string;
  name: string;
  description: string;
  up: (ctx: MigrationContext) => Promise<void>;
  down?: (ctx: MigrationContext) => Promise<void>;
}

/**
 * Built-in migrations.
 */
export const migrations: Migration[] = [
  {
    id: "001_mongodb_initial",
    name: "mongodb_initial",
    description: "Initial MongoDB schema with events and compacted_memories collections",
    up: async () => {
      // Already handled by openMongoDB
    },
  },
  {
    id: "002_perception_events",
    name: "perception_events",
    description: "Add perception_events collection for Sintel signal intake",
    up: async (ctx) => {
      const perceptionEvents = ctx.mongo.db.collection("perception_events");
      await perceptionEvents.createIndex({ createdAt: -1 });
      await perceptionEvents.createIndex({ category: 1, createdAt: -1 });
      await perceptionEvents.createIndex({ "signal.type": 1, createdAt: -1 });
      await perceptionEvents.createIndex({ "signal.author.did": 1, createdAt: -1 });
    },
  },
  {
    id: "003_tenant_policies",
    name: "tenant_policies",
    description: "Add tenant_policies collection for multi-tenant control plane",
    up: async (ctx) => {
      const tenantPolicies = ctx.mongo.db.collection("tenant_policies");
      await tenantPolicies.createIndex({ tenant_id: 1 }, { unique: true });
      await tenantPolicies.createIndex({ created_at: -1 });
    },
  },
  {
    id: "004_model_profiles",
    name: "model_profiles",
    description: "Add model_profiles collection for per-tenant model configuration",
    up: async (ctx) => {
      const modelProfiles = ctx.mongo.db.collection("model_profiles");
      await modelProfiles.createIndex({ profile_id: 1 }, { unique: true });
      await modelProfiles.createIndex({ tenant_id: 1 });
      await modelProfiles.createIndex({ is_default: 1 });
    },
  },
  {
    id: "005_tenants_enhanced",
    name: "tenants_enhanced",
    description: "Add status, isolation_mode, and reference fields to tenants",
    up: async (ctx) => {
      const tenants = ctx.mongo.db.collection("tenants");
      
      // Add indexes
      await tenants.createIndex({ slug: 1 }, { unique: true, sparse: true });
      await tenants.createIndex({ status: 1 });
      
      // Backfill default values for existing tenants
      await tenants.updateMany(
        { status: { $exists: false } },
        { $set: { status: "active", isolation_mode: "shared", updated_at: new Date() } }
      );
    },
  },
  {
    id: "006_events_tenant_id",
    name: "events_tenant_id",
    description: "Add tenant_id to events collection, backfill from project field",
    up: async (ctx) => {
      const events = ctx.mongo.db.collection("events");
      
      // Add index
      await events.createIndex({ tenant_id: 1 });
      await events.createIndex({ tenant_id: 1, kind: 1 });
      
      // Skip backfill if events collection is large (>100k docs) to avoid timeouts
      const count = await events.countDocuments({});
      if (count > 100_000) {
        console.log("[migration] Skipping tenant_id backfill for large events collection:", count);
        return;
      }
      
      // Backfill tenant_id from project (project acts as tenant surrogate)
      // Only for documents (kind: docs, code, config, data)
      const documentKinds = ["docs", "code", "config", "data"];
      await events.updateMany(
        { kind: { $in: documentKinds }, tenant_id: { $exists: false }, project: { $ne: null } },
        { $set: { tenant_id: "$project" } }
      );
      
      // For other events, set tenant_id to 'default'
      await events.updateMany(
        { tenant_id: { $exists: false } },
        { $set: { tenant_id: "default" } }
      );
    },
  },
  {
    id: "007_audit_log",
    name: "audit_log",
    description: "Add audit_log collection for tenant-scoped action logging",
    up: async (ctx) => {
      const auditLog = ctx.mongo.db.collection("audit_log");
      await auditLog.createIndex({ tenant_id: 1, ts: -1 });
      await auditLog.createIndex({ user_id: 1, ts: -1 });
      await auditLog.createIndex({ action: 1, ts: -1 });
    },
  },
  {
    id: "008_default_tenant",
    name: "default_tenant",
    description: "Create default tenant 'knoxx-session' to silence tenant resolution warnings",
    up: async (ctx) => {
      const tenants = ctx.mongo.db.collection("tenants");
      const tenantPolicies = ctx.mongo.db.collection("tenant_policies");

      // Ensure indexes exist
      await tenants.createIndex({ tenant_id: 1 }, { unique: true });
      await tenantPolicies.createIndex({ tenant_id: 1 }, { unique: true });

      // Upsert default tenant
      await tenants.updateOne(
        { tenant_id: "knoxx-session" },
        {
          $set: {
            tenant_id: "knoxx-session",
            slug: "knoxx-session",
            name: "Knoxx Session",
            status: "active",
            isolation_mode: "shared",
            domains: [],
            updated_at: new Date(),
          },
          $setOnInsert: {
            created_at: new Date(),
          },
        },
        { upsert: true }
      );

      // Upsert default policy
      await tenantPolicies.updateOne(
        { tenant_id: "knoxx-session" },
        {
          $set: {
            tenant_id: "knoxx-session",
            retention_days: 90,
            review_threshold: 0.5,
            pii_rules: { detect: true, redact: false, reject: false },
            translation_config: { default_target_langs: ["en"] },
            rate_limits: { requests_per_minute: 1000, tokens_per_day: 1000000 },
            updated_at: new Date(),
          },
          $setOnInsert: {
            created_at: new Date(),
          },
        },
        { upsert: true }
      );

      console.log("[migration] Default tenant 'knoxx-session' ensured");
    },
  },
];

export async function loadAppliedMigrations(dataDir: string): Promise<Set<string>> {
  const migrationsPath = path.join(dataDir, "migrations.json");
  try {
    const content = await fs.readFile(migrationsPath, "utf-8");
    const applied = JSON.parse(content);
    return new Set(applied);
  } catch {
    return new Set();
  }
}

export async function saveAppliedMigrations(dataDir: string, applied: Set<string>): Promise<void> {
  const migrationsPath = path.join(dataDir, "migrations.json");
  await fs.mkdir(path.dirname(migrationsPath), { recursive: true });
  await fs.writeFile(migrationsPath, JSON.stringify([...applied], null, 2));
}

export async function runMigrations(ctx: MigrationContext): Promise<string[]> {
  const applied = await loadAppliedMigrations(ctx.dataDir);
  const results: string[] = [];

  for (const migration of migrations) {
    if (applied.has(migration.id)) continue;

    console.log(`[migration] Running: ${migration.id} - ${migration.name}`);
    await migration.up(ctx);
    applied.add(migration.id);
    results.push(migration.id);
  }

  await saveAppliedMigrations(ctx.dataDir, applied);
  return results;
}

function toMongoVectorDocument(
  id: string,
  document: string | null | undefined,
  embedding: unknown,
  metadata: Record<string, unknown> | null | undefined,
  tier: "hot" | "compact",
): MongoVectorDocument {
  const safeMetadata = metadata ?? {};
  const ts = new Date(String(safeMetadata.ts ?? new Date().toISOString()));
  return {
    _id: id,
    parent_id: typeof safeMetadata.parent_id === "string" && safeMetadata.parent_id.length > 0 ? safeMetadata.parent_id : id,
    text: document ?? "",
    embedding: Array.isArray(embedding) ? embedding.filter((value): value is number => typeof value === "number") : [],
    ts: Number.isNaN(ts.getTime()) ? new Date() : ts,
    source: typeof safeMetadata.source === "string" ? safeMetadata.source : "",
    kind: typeof safeMetadata.kind === "string" ? safeMetadata.kind : "",
    project: typeof safeMetadata.project === "string" && safeMetadata.project.length > 0 ? safeMetadata.project : null,
    session: typeof safeMetadata.session === "string" && safeMetadata.session.length > 0 ? safeMetadata.session : null,
    author: typeof safeMetadata.author === "string" && safeMetadata.author.length > 0 ? safeMetadata.author : null,
    role: typeof safeMetadata.role === "string" && safeMetadata.role.length > 0 ? safeMetadata.role : null,
    model: typeof safeMetadata.model === "string" && safeMetadata.model.length > 0 ? safeMetadata.model : null,
    visibility: typeof safeMetadata.visibility === "string" && safeMetadata.visibility.length > 0 ? safeMetadata.visibility : null,
    title: typeof safeMetadata.title === "string" && safeMetadata.title.length > 0 ? safeMetadata.title : null,
    embedding_model: typeof safeMetadata.embedding_model === "string" && safeMetadata.embedding_model.length > 0 ? safeMetadata.embedding_model : null,
    embedding_dimensions: Array.isArray(embedding) ? embedding.filter((value): value is number => typeof value === "number").length : null,
    search_tier: tier,
    chunk_id: typeof safeMetadata.chunk_id === "string" && safeMetadata.chunk_id.length > 0 ? safeMetadata.chunk_id : id,
    chunk_index: typeof safeMetadata.chunk_index === "number" ? safeMetadata.chunk_index : null,
    chunk_count: typeof safeMetadata.chunk_count === "number" ? safeMetadata.chunk_count : null,
    normalized_format: typeof safeMetadata.normalized_format === "string" ? safeMetadata.normalized_format : null,
    normalized_estimated_tokens: typeof safeMetadata.normalized_estimated_tokens === "number" ? safeMetadata.normalized_estimated_tokens : null,
    raw_estimated_tokens: typeof safeMetadata.raw_estimated_tokens === "number" ? safeMetadata.raw_estimated_tokens : null,
    seed_id: typeof safeMetadata.seed_id === "string" && safeMetadata.seed_id.length > 0 ? safeMetadata.seed_id : null,
    member_count: typeof safeMetadata.member_count === "number" ? safeMetadata.member_count : null,
    char_count: typeof safeMetadata.char_count === "number" ? safeMetadata.char_count : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Export MongoDB collections to JSONL files for backup.
 */
export async function exportMongoDBToJsonl(
  mongo: MongoConnection,
  outputDir: string,
  options: {
    batchSize?: number;
    onProgress?: (phase: string, count: number) => void;
  } = {},
): Promise<{ eventsFile: string; memoriesFile: string }> {
  const batchSize = options.batchSize ?? 1000;
  await fs.mkdir(outputDir, { recursive: true });

  const eventsFile = path.join(outputDir, "events.jsonl");
  const memoriesFile = path.join(outputDir, "compacted_memories.jsonl");

  console.log("[export] Exporting events to JSONL...");
  const eventsStream = await fs.open(eventsFile, "w");
  let count = 0;

  const eventsCursor = mongo.events.find({}).sort({ ts: 1 });
  for await (const row of eventsCursor) {
    const doc = {
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
      tags: row.tags,
      text: row.text,
      attachments: row.attachments,
      extra: row.extra,
    };
    await eventsStream.write(JSON.stringify(doc) + "\n");
    count++;
    if (count % batchSize === 0) {
      options.onProgress?.("events", count);
    }
  }

  await eventsStream.close();
  console.log(`[export] Events: ${count} records → ${eventsFile}`);

  console.log("[export] Exporting compacted_memories to JSONL...");
  const memoriesStream = await fs.open(memoriesFile, "w");
  count = 0;

  const memoriesCursor = mongo.compacted.find({}).sort({ ts: 1 });
  for await (const row of memoriesCursor) {
    const doc = {
      id: row.id,
      ts: row.ts.toISOString(),
      source: row.source,
      kind: row.kind,
      project: row.project,
      session: row.session,
      seed_id: row.seed_id,
      member_count: row.member_count,
      char_count: row.char_count,
      embedding_model: row.embedding_model,
      text: row.text,
      members: row.members,
      extra: row.extra,
    };
    await memoriesStream.write(JSON.stringify(doc) + "\n");
    count++;
    if (count % batchSize === 0) {
      options.onProgress?.("memories", count);
    }
  }

  await memoriesStream.close();
  console.log(`[export] Memories: ${count} records → ${memoriesFile}`);

  return { eventsFile, memoriesFile };
}

/**
 * Import JSONL files to MongoDB collections.
 */
export async function importJsonlToMongoDB(
  mongo: MongoConnection,
  inputDir: string,
  options: {
    batchSize?: number;
    onProgress?: (phase: string, count: number) => void;
  } = {},
): Promise<{ eventsCount: number; memoriesCount: number }> {
  const batchSize = options.batchSize ?? 1000;
  const eventsFile = path.join(inputDir, "events.jsonl");
  const memoriesFile = path.join(inputDir, "compacted_memories.jsonl");

  let eventsCount = 0;
  let memoriesCount = 0;

  // Import events
  try {
    const eventsContent = await fs.readFile(eventsFile, "utf-8");
    const eventDocs: any[] = [];
    for (const line of eventsContent.split(/\n+/)) {
      if (!line.trim()) continue;
      try {
        const doc = JSON.parse(line);
        eventDocs.push({
          _id: doc.id,
          id: doc.id,
          ts: new Date(doc.ts),
          source: doc.source ?? "",
          kind: doc.kind ?? "",
          project: doc.project ?? null,
          session: doc.session ?? null,
          message: doc.message ?? null,
          role: doc.role ?? null,
          author: doc.author ?? null,
          model: doc.model ?? null,
          tags: doc.tags ?? null,
          text: doc.text ?? null,
          attachments: doc.attachments ?? null,
          extra: doc.extra ?? null,
          createdAt: new Date(doc.ts),
          updatedAt: new Date(),
        });
      } catch {}
    }

    for (let i = 0; i < eventDocs.length; i += batchSize) {
      const batch = eventDocs.slice(i, i + batchSize);
      await mongo.events.bulkWrite(
        batch.map((doc) => ({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: doc },
            upsert: true,
          },
        })),
        { ordered: false },
      );
      eventsCount += batch.length;
      options.onProgress?.("events", eventsCount);
    }
  } catch (error) {
    console.warn(`[import] No events file found or failed to read: ${eventsFile}`);
  }

  // Import memories
  try {
    const memoriesContent = await fs.readFile(memoriesFile, "utf-8");
    const memoryDocs: any[] = [];
    for (const line of memoriesContent.split(/\n+/)) {
      if (!line.trim()) continue;
      try {
        const doc = JSON.parse(line);
        memoryDocs.push({
          _id: doc.id,
          id: doc.id,
          ts: new Date(doc.ts),
          source: doc.source ?? "",
          kind: doc.kind ?? "",
          project: doc.project ?? null,
          session: doc.session ?? null,
          seed_id: doc.seed_id ?? null,
          member_count: doc.member_count ?? 0,
          char_count: doc.char_count ?? 0,
          embedding_model: doc.embedding_model ?? null,
          text: doc.text ?? "",
          members: doc.members ?? null,
          extra: doc.extra ?? null,
          createdAt: new Date(doc.ts),
          updatedAt: new Date(),
        });
      } catch {}
    }

    for (let i = 0; i < memoryDocs.length; i += batchSize) {
      const batch = memoryDocs.slice(i, i + batchSize);
      await mongo.compacted.bulkWrite(
        batch.map((doc) => ({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: doc },
            upsert: true,
          },
        })),
        { ordered: false },
      );
      memoriesCount += batch.length;
      options.onProgress?.("memories", memoriesCount);
    }
  } catch (error) {
    console.warn(`[import] No memories file found or failed to read: ${memoriesFile}`);
  }

  return { eventsCount, memoriesCount };
}

import type { FastifyPluginAsync } from "fastify";
import {
  rowToDocument as cljsRowToDocument,
} from "@open-hax/openplanner-document-hydration";
import { enqueueMigrationJob, upsertEvent } from "../../lib/mongodb.js";
import { batchPreparedChunks, isContextOverflowError, prepareIndexDocument } from "../../lib/indexing.js";
import { deleteMongoVectorEntriesByFilter, indexTextInMongoVectors } from "../../lib/mongo-vectors.js";
import { hydrateRowFromSourceCache } from "../../lib/source-hydration.js";
import { planLazyMigrationAfterValidationError, shouldEnqueueLazyMigration } from "../../lib/lazy-migrations.js";
import { OPENPLANNER_SCHEMA_TARGETS } from "../../lib/schema-versions.js";
import type {
  DocumentPatchRequest,
  DocumentRecord,
  DocumentUpsertRequest,
  EventEnvelopeV1,
} from "../../lib/types.js";

export const DOCUMENT_KINDS = new Set(["docs", "code", "config", "data"]);

function csvTokens(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseJson(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function normalizeVisibility(value: unknown): DocumentRecord["visibility"] {
  return value === "review" || value === "public" || value === "archived" ? value : "internal";
}

export function buildDocumentFilter(query: Record<string, string | undefined>): Record<string, unknown> {
  const filter: Record<string, unknown> = { kind: { $in: [...DOCUMENT_KINDS] } };

  const projects = csvTokens(query.projects ?? query.project);
  if (projects.length === 1) {
    filter.project = projects[0];
  } else if (projects.length > 1) {
    filter.project = { $in: projects };
  }

  const rawKinds = csvTokens(query.kinds ?? query.kind);
  const includeAllKinds = rawKinds.includes("all");
  const kinds = rawKinds.filter((kind) => DOCUMENT_KINDS.has(kind));
  if (!includeAllKinds && kinds.length === 1) {
    filter.kind = kinds[0];
  } else if (!includeAllKinds && kinds.length > 1) {
    filter.kind = { $in: kinds };
  }

  const visibilities = csvTokens(query.visibility).filter((value) =>
    ["internal", "review", "public", "archived"].includes(value),
  );
  if (visibilities.length === 1) {
    filter["extra.visibility"] = visibilities[0];
  } else if (visibilities.length > 1) {
    filter["extra.visibility"] = { $in: visibilities };
  }

  const sources = csvTokens(query.source);
  if (sources.length === 1) {
    filter.source = sources[0];
  } else if (sources.length > 1) {
    filter.source = { $in: sources };
  }

  const domains = csvTokens(query.domain);
  if (domains.length === 1) {
    filter["extra.domain"] = domains[0];
  } else if (domains.length > 1) {
    filter["extra.domain"] = { $in: domains };
  }

  const createdBy = query.createdBy ?? query.created_by;
  if (createdBy) filter["extra.created_by"] = createdBy;

  const sourcePathPrefix = (query.sourcePathPrefix ?? query.source_path_prefix ?? query.path_prefix ?? "").trim();
  if (sourcePathPrefix) {
    filter["extra.source_path"] = { $regex: `^${escapeRegex(sourcePathPrefix)}` };
  }

  const metadataSourceId = query.metadataSourceId ?? query.metadata_source_id;
  if (metadataSourceId) filter["extra.metadata.source_id"] = metadataSourceId;

  const metadataLake = query.metadataLake ?? query.metadata_lake;
  if (metadataLake) filter["extra.metadata.lake"] = metadataLake;

  const metadataDatabaseId = query.metadataDatabaseId ?? query.metadata_database_id;
  if (metadataDatabaseId) filter["extra.metadata.database-id"] = metadataDatabaseId;

  return filter;
}

export async function countFieldValues(
  collection: any,
  filter: Record<string, unknown>,
  fieldPath: string,
  fallback = "unknown",
): Promise<Record<string, number>> {
  const rows = await collection.aggregate([
    { $match: filter },
    { $group: { _id: `$${fieldPath}`, count: { $sum: 1 } } },
  ]).toArray();

  return (rows as Array<Record<string, unknown>>).reduce((acc: Record<string, number>, row) => {
    const raw = row._id;
    const key = typeof raw === "string" && raw.trim() ? raw : fallback;
    acc[key] = Number(row.count ?? 0);
    return acc;
  }, {});
}

export async function hydrateDocumentRowsForApi(rows: Array<Record<string, unknown>>): Promise<Array<Record<string, unknown>>> {
  return Promise.all(rows.map((row) => hydrateRowFromSourceCache(row)));
}

export function rowToDocument(row: Record<string, unknown>): DocumentRecord {
  return cljsRowToDocument(row) as unknown as DocumentRecord;
}

export function documentToEvent(doc: DocumentRecord, original?: DocumentRecord): EventEnvelopeV1 {
  const ts = doc.ts ?? original?.ts ?? new Date().toISOString();
  const publishedAt = doc.visibility === "public"
    ? (doc.publishedAt ?? original?.publishedAt ?? new Date().toISOString())
    : null;

  return {
    schema: "openplanner.event.v1",
    id: doc.id,
    ts,
    source: doc.source ?? original?.source ?? "manual",
    kind: doc.kind,
    source_ref: {
      project: doc.project,
      message: doc.title,
    },
    text: doc.content,
    meta: {
      author: doc.createdBy ?? original?.createdBy ?? "unknown",
      model: doc.aiModel ?? original?.aiModel ?? undefined,
      tags: [doc.project, doc.kind, doc.visibility, doc.domain].filter(Boolean),
    },
    extra: {
      title: doc.title,
      visibility: doc.visibility,
      source_path: doc.sourcePath ?? null,
      domain: doc.domain ?? "general",
      language: doc.language ?? "en",
      created_by: doc.createdBy ?? original?.createdBy ?? "unknown",
      published_by: doc.publishedBy ?? original?.publishedBy ?? null,
      published_at: publishedAt,
      ai_drafted: doc.aiDrafted ?? false,
      ai_model: doc.aiModel ?? null,
      ai_prompt_hash: doc.aiPromptHash ?? null,
      metadata: doc.metadata ?? {},
      updated_at: new Date().toISOString(),
    },
  };
}

export async function persistAndMaybeIndex(app: any, ev: EventEnvelopeV1): Promise<{ indexed: boolean; warning?: string }> {
  await persistEvent(app, ev);
  try {
    const indexed = await indexDocument(app, ev);
    return { indexed };
  } catch (error) {
    app.log.error(error, "Failed to index document into MongoDB vectors");
    const warning = error instanceof Error ? error.message : String(error);
    return { indexed: false, warning };
  }
}

export async function persistEvent(app: any, ev: EventEnvelopeV1): Promise<void> {
  const sr = ev.source_ref ?? {};
  const meta = ev.meta ?? {};
  const role = meta.role ? String(meta.role) : null;
  const author = meta.author ? String(meta.author) : null;
  const model = meta.model ? String(meta.model) : null;
  const tags = meta.tags ?? null;

  await upsertEvent(app.mongo.events, {
    id: ev.id,
    ts: new Date(ev.ts),
    source: ev.source,
    kind: ev.kind,
    project: sr.project ? String(sr.project) : null,
    session: sr.session ? String(sr.session) : null,
    message: sr.message ? String(sr.message) : null,
    role,
    author,
    model,
    tags,
    text: ev.text ? String(ev.text) : "",
    attachments: ev.attachments ?? null,
    extra: ev.extra ?? null,
    schema_version: ev.schema_version,
    migration_state: ev.migration_state as any,
  });
}

async function deleteDocumentVectors(app: any, ev: EventEnvelopeV1): Promise<void> {
  await deleteMongoVectorEntriesByFilter(app.mongo, "hot", { parent_id: ev.id });
}

async function indexDocument(app: any, ev: EventEnvelopeV1): Promise<boolean> {
  const content = String(ev.text ?? "");
  if (!content.trim()) {
    await deleteDocumentVectors(app, ev);
    return false;
  }
  const sr = ev.source_ref ?? {};
  const meta = ev.meta ?? {};
  const extra = (ev.extra as Record<string, unknown> | undefined) ?? {};
  const labels = Array.isArray((extra.openplanner_labels as any)?.labels)
    ? [...new Set((extra.openplanner_labels as any).labels.map((label: unknown) => String(label ?? "").trim()).filter(Boolean))]
    : [];
  const embeddingScope = {
    source: ev.source,
    kind: ev.kind,
    project: sr.project ? String(sr.project) : undefined,
  };
  const metadata = {
    ts: ev.ts,
    source: ev.source,
    kind: ev.kind,
    project: sr.project,
    session: sr.session,
    author: meta.author ? String(meta.author) : "",
    role: meta.role ? String(meta.role) : "",
    model: meta.model ? String(meta.model) : "",
    search_tier: "hot",
    visibility: extra.visibility ?? "internal",
    labels,
    title: extra.title ?? sr.message ?? ev.id,
  } as Record<string, unknown>;

  const embeddingRuntime = (app as any).embeddingRuntime;
  const embeddingFunction = embeddingRuntime.hot.getBackgroundEmbeddingFunction(embeddingScope);
  const embeddingModel = embeddingRuntime.hot.getModel(embeddingScope);
  await indexTextInMongoVectors({
    mongo: app.mongo,
    tier: "hot",
    parentId: ev.id,
    text: content,
    extra,
    metadata: { ...metadata, embedding_model: embeddingModel ?? "" },
    embeddingFunction,
  });
  return true;
}

export async function getDocumentById(app: any, id: string): Promise<DocumentRecord | null> {
  const row = await app.mongo.events.findOne({ _id: id, kind: { $in: [...DOCUMENT_KINDS] } });
  if (!row) return null;
  const hydrated = await hydrateRowFromSourceCache(row as Record<string, unknown>);
  return rowToDocument(hydrated);
}

function isSourceBackedRow(row: Record<string, unknown>): boolean {
  const extra = parseJson(row.extra);
  const metadata = parseJson(extra.metadata);
  return [
    extra.source_path,
    extra.path,
    extra.url,
    extra.hostname,
    metadata.path,
    metadata.file_id,
    metadata.url,
  ].some((value) => typeof value === "string" && value.trim().length > 0);
}

function documentRowValidationError(row: Record<string, unknown>): Record<string, unknown> | null {
  const schemaVersion = typeof row.schema_version === "number" ? row.schema_version : 1;
  if (schemaVersion < OPENPLANNER_SCHEMA_TARGETS.event) {
    return {
      code: "schema_version_behind",
      currentVersion: schemaVersion,
      targetVersion: OPENPLANNER_SCHEMA_TARGETS.event,
    };
  }
  if (isSourceBackedRow(row) && typeof row.text === "string" && row.text.trim().length > 0) {
    return {
      code: "reference_first_text_violation",
      message: "source-backed document rows should not retain durable text",
    };
  }
  return null;
}

async function planDocumentMigrationOnValidationError(app: any, row: Record<string, unknown>) {
  const error = documentRowValidationError(row);
  if (!error) return null;
  const planResponse = await planLazyMigrationAfterValidationError({
    entity: "openplanner/event",
    targetVersion: OPENPLANNER_SCHEMA_TARGETS.event,
    object: row,
    error,
  });
  if (!planResponse?.plan) return null;
  if (shouldEnqueueLazyMigration(planResponse.plan)) {
    await enqueueMigrationJob(app.mongo.migrationJobs, {
      entity: "openplanner/event",
      object_id: String(row.id ?? row._id),
      trigger: "schema-validation-error",
      plan: planResponse.plan as unknown as Record<string, unknown>,
      error,
      priority: 10,
    });
  }
  return planResponse.plan;
}

export const documentRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: DocumentUpsertRequest }>("/documents", async (req, reply) => {
    const doc = req.body?.document;
    if (!doc?.id || !doc?.title || !doc?.content || !doc?.project || !doc?.kind) {
      return reply.status(400).send({ error: "document.id/title/content/project/kind are required" });
    }
    if (!DOCUMENT_KINDS.has(doc.kind)) {
      return reply.status(400).send({ error: `invalid document kind: ${doc.kind}` });
    }

    const existing = await getDocumentById(app, doc.id);
    const existingPublications = Array.isArray(existing?.metadata?.garden_publications)
      ? (existing?.metadata?.garden_publications as Array<Record<string, unknown>>)
      : [];
    const preservePublicationState = existingPublications.length > 0
      || (existing?.visibility === "public" && Boolean(existing?.publishedAt));
    const mergedMetadata = {
      ...(existing?.metadata ?? {}),
      ...(doc.metadata ?? {}),
      ...(preservePublicationState && existingPublications.length > 0
        ? { garden_publications: existingPublications }
        : {}),
    };

    const normalized: DocumentRecord = {
      ...(existing ?? {}),
      ...doc,
      visibility: preservePublicationState ? (existing?.visibility ?? "public") : (doc.visibility ?? existing?.visibility ?? "internal"),
      source: doc.source ?? existing?.source ?? "manual",
      domain: doc.domain ?? existing?.domain ?? "general",
      language: doc.language ?? existing?.language ?? "en",
      createdBy: doc.createdBy ?? existing?.createdBy ?? "unknown",
      publishedBy: preservePublicationState ? (existing?.publishedBy ?? undefined) : (doc.publishedBy ?? existing?.publishedBy ?? undefined),
      publishedAt: preservePublicationState ? (existing?.publishedAt ?? null) : (doc.publishedAt ?? existing?.publishedAt ?? null),
      metadata: mergedMetadata,
      aiDrafted: doc.aiDrafted ?? existing?.aiDrafted ?? false,
      aiModel: doc.aiModel ?? existing?.aiModel ?? null,
      aiPromptHash: doc.aiPromptHash ?? existing?.aiPromptHash ?? null,
      ts: doc.ts ?? new Date().toISOString(),
    };
    const ev = documentToEvent(normalized, existing ?? undefined);
    const result = await persistAndMaybeIndex(app, ev);
    if (result.warning) {
      return reply.status(503).send({
        ok: false,
        error: "embedding_index_failed",
        persisted: true,
        indexed: false,
        document: normalized,
        detail: result.warning,
      });
    }
    return { ok: true, document: normalized, ...result };
  });

  app.get("/documents", async (req) => {
    const query = (req.query ?? {}) as Record<string, string | undefined>;
    const limit = query.limit === undefined ? null : Math.max(1, Number(query.limit));
    const offset = Math.max(0, Number(query.offset ?? 0));
    const filter = buildDocumentFilter(query);
    const total = await app.mongo.events.countDocuments(filter);

    let cursor = app.mongo.events.find(filter).sort({ ts: -1 }).skip(offset);
    if (limit !== null) cursor = cursor.limit(limit);

    const rows = await cursor.toArray();
    const hydratedRows = await hydrateDocumentRowsForApi(rows as Array<Record<string, unknown>>);
    return {
      ok: true,
      count: hydratedRows.length,
      total,
      offset,
      limit,
      rows: hydratedRows.map((row) => rowToDocument(row)),
      storageBackend: "mongodb",
    };
  });

  app.get("/documents/stats", async (req) => {
    const query = (req.query ?? {}) as Record<string, string | undefined>;
    const filter = buildDocumentFilter(query);

    const [total, byProject, byKind, byVisibility, bySource, byDomain] = await Promise.all([
      app.mongo.events.countDocuments(filter),
      countFieldValues(app.mongo.events, filter, "project", "devel"),
      countFieldValues(app.mongo.events, filter, "kind", "docs"),
      countFieldValues(app.mongo.events, filter, "extra.visibility", "internal"),
      countFieldValues(app.mongo.events, filter, "source", "unknown"),
      countFieldValues(app.mongo.events, filter, "extra.domain", "general"),
    ]);

    return {
      ok: true,
      total,
      by_project: byProject,
      by_kind: byKind,
      by_visibility: byVisibility,
      by_source: bySource,
      by_domain: byDomain,
      storageBackend: "mongodb",
    };
  });

  app.get("/documents/:id", async (req, reply) => {
    const id = String((req.params as { id: string }).id);
    const row = await app.mongo.events.findOne({ _id: id, kind: { $in: [...DOCUMENT_KINDS] } });
    if (!row) return reply.status(404).send({ error: "document not found" });
    const migrationPlan = await planDocumentMigrationOnValidationError(app, row as Record<string, unknown>);
    const hydrated = await hydrateRowFromSourceCache(row as Record<string, unknown>);
    return {
      ok: true,
      document: rowToDocument(hydrated),
      ...(migrationPlan ? { lazyMigration: { planned: true, enqueued: shouldEnqueueLazyMigration(migrationPlan), plan: migrationPlan } } : {}),
    };
  });

  app.patch<{ Body: DocumentPatchRequest }>("/documents/:id", async (req, reply) => {
    const id = String((req.params as { id: string }).id);
    const existing = await getDocumentById(app, id);
    if (!existing) return reply.status(404).send({ error: "document not found" });
    const patch = req.body ?? {};
    const next: DocumentRecord = {
      ...existing,
      ...patch,
      sourcePath: patch.sourcePath ?? existing.sourcePath ?? undefined,
      domain: patch.domain ?? existing.domain ?? undefined,
      language: patch.language ?? existing.language ?? undefined,
      publishedBy: patch.publishedBy ?? existing.publishedBy ?? undefined,
      metadata: patch.metadata ?? existing.metadata ?? {},
      publishedAt: patch.publishedAt ?? existing.publishedAt ?? null,
      ts: new Date().toISOString(),
    };
    const ev = documentToEvent(next, existing);
    const result = await persistAndMaybeIndex(app, ev);
    if (result.warning) {
      return reply.status(503).send({
        ok: false,
        error: "embedding_index_failed",
        persisted: true,
        indexed: false,
        document: next,
        detail: result.warning,
      });
    }
    return { ok: true, document: next, ...result };
  });

  app.post("/documents/:id/publish", async (req, reply) => {
    const id = String((req.params as { id: string }).id);
    const existing = await getDocumentById(app, id);
    if (!existing) return reply.status(404).send({ error: "document not found" });
    const next: DocumentRecord = {
      ...existing,
      visibility: "public",
      publishedAt: new Date().toISOString(),
      ts: new Date().toISOString(),
    };
    const ev = documentToEvent(next, existing);
    const result = await persistAndMaybeIndex(app, ev);
    if (result.warning) {
      return reply.status(503).send({
        ok: false,
        error: "embedding_index_failed",
        persisted: true,
        indexed: false,
        document: next,
        detail: result.warning,
      });
    }
    return { ok: true, document: next, ...result };
  });

  app.post("/documents/:id/archive", async (req, reply) => {
    const id = String((req.params as { id: string }).id);
    const existing = await getDocumentById(app, id);
    if (!existing) return reply.status(404).send({ error: "document not found" });
    const next: DocumentRecord = {
      ...existing,
      visibility: "archived",
      ts: new Date().toISOString(),
    };
    const ev = documentToEvent(next, existing);
    const result = await persistAndMaybeIndex(app, ev);
    if (result.warning) {
      return reply.status(503).send({
        ok: false,
        error: "embedding_index_failed",
        persisted: true,
        indexed: false,
        document: next,
        detail: result.warning,
      });
    }
    return { ok: true, document: next, ...result };
  });
};

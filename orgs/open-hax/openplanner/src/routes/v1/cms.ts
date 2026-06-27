import type { FastifyPluginAsync } from "fastify";
import type { DocumentPatchRequest, DocumentRecord } from "../../lib/types.js";
import { buildDocumentFilter, countFieldValues, documentToEvent, getDocumentById, hydrateDocumentRowsForApi, persistAndMaybeIndex, persistEvent, rowToDocument } from "./documents.js";
import { recalculateGardenStats } from "./gardens.js";

type CmsDocument = {
  doc_id: string;
  tenant_id: string;
  title: string;
  content: string;
  visibility: "internal" | "review" | "public" | "archived";
  source: string;
  source_path: string | null;
  domain: string;
  language: string;
  created_by: string;
  published_by: string | null;
  published_at: string | null;
  last_reviewed_at: string | null;
  ai_drafted: boolean;
  ai_model: string | null;
  ai_prompt_hash: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type CreateCmsDocumentPayload = {
  title?: string;
  content?: string;
  domain?: string;
  language?: string;
  source_path?: string | null;
  visibility?: "internal" | "review" | "public" | "archived";
  metadata?: Record<string, unknown>;
  garden_id?: string;
  defer_index?: boolean;
};

type DraftCmsPayload = {
  tenant_id?: string;
  topic?: string;
  tone?: string;
  audience?: string;
  source_collections?: string[];
  max_context_chunks?: number;
  metadata?: Record<string, unknown>;
};

function tenantProject(tenantId: string | undefined): string {
  const value = String(tenantId ?? "devel").trim();
  return value || "devel";
}

/** Extract a single count from a `[{ value: n }]`-shaped $facet branch. */
function facetCount(branch: unknown): number {
  const rows = Array.isArray(branch) ? branch : [];
  const first = rows[0] as { value?: unknown } | undefined;
  return Number(first?.value ?? 0);
}

/**
 * Convert a `[{ _id, count }]`-shaped $facet group branch into a
 * `{ value: count }` map, substituting `fallback` for empty/non-string keys.
 * Mirrors the semantics of documents.countFieldValues.
 */
function facetGroups(branch: unknown, fallback: string): Record<string, number> {
  const rows = Array.isArray(branch) ? (branch as Array<Record<string, unknown>>) : [];
  return rows.reduce((acc: Record<string, number>, row) => {
    const raw = row._id;
    const key = typeof raw === "string" && raw.trim() ? raw : fallback;
    acc[key] = Number(row.count ?? 0);
    return acc;
  }, {});
}

function toCmsDocument(document: DocumentRecord, tenantId?: string): CmsDocument {
  const project = tenantProject(tenantId ?? document.project);
  const ts = document.ts ?? new Date().toISOString();
  return {
    doc_id: document.id,
    tenant_id: project,
    title: document.title,
    content: document.content,
    visibility: document.visibility,
    source: document.source ?? "manual",
    source_path: document.sourcePath ?? null,
    domain: document.domain ?? "general",
    language: document.language ?? "en",
    created_by: document.createdBy ?? "unknown",
    published_by: document.publishedBy ?? null,
    published_at: document.publishedAt ?? null,
    last_reviewed_at: null,
    ai_drafted: Boolean(document.aiDrafted),
    ai_model: document.aiModel ?? null,
    ai_prompt_hash: document.aiPromptHash ?? null,
    metadata: document.metadata ?? {},
    created_at: ts,
    updated_at: ts,
  };
}

function draftMarkdown(topic: string, tone: string, audience: string): string {
  return [
    `# ${topic || "Untitled draft"}`,
    "",
    `> Draft tone: ${tone || "professional"}`,
    `> Audience: ${audience || "general"}`,
    "",
    "## Summary",
    "",
    "Add the core message here.",
    "",
    "## Details",
    "",
    "- Key point 1",
    "- Key point 2",
    "- Key point 3",
    "",
    "## Notes",
    "",
    "Add source-backed notes, translation guidance, and publish metadata.",
    "",
  ].join("\n");
}

export const cmsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/cms/documents", async (req) => {
    const query = (req.query ?? {}) as Record<string, string | undefined>;
    const tenantId = tenantProject(query.tenant_id);
    const gardenId = query.garden_id;
    const limit = query.limit === undefined ? null : Math.max(1, Number(query.limit));
    const offset = Math.max(0, Number(query.offset ?? 0));

    const filter = buildDocumentFilter({
      ...query,
      project: tenantId,
      kind: query.kind ?? "docs",
    });
    if (gardenId) filter["extra.metadata.garden_id"] = gardenId;

    const total = await app.mongo.events.countDocuments(filter);
    const byVisibility = await countFieldValues(app.mongo.events, filter, "extra.visibility", "internal");

    let cursor = app.mongo.events.find(filter).sort({ ts: -1 }).skip(offset);
    if (limit !== null) cursor = cursor.limit(limit);

    const rows = await cursor.toArray();
    const hydratedRows = await hydrateDocumentRowsForApi(rows as Array<Record<string, unknown>>);
    const documents = hydratedRows.map((row) => toCmsDocument(rowToDocument(row), tenantId));

    return {
      documents,
      total,
      by_visibility: byVisibility,
    };
  });

  app.get("/cms/documents/:id", async (req, reply) => {
    const id = String((req.params as { id: string }).id);
    const document = await getDocumentById(app, id);
    if (!document || document.kind !== "docs") {
      return reply.status(404).send({ detail: "Document not found" });
    }
    return toCmsDocument(document);
  });

  app.post<{ Body: CreateCmsDocumentPayload }>("/cms/documents", async (req, reply) => {
    const query = (req.query ?? {}) as Record<string, string | undefined>;
    const tenantId = tenantProject(query.tenant_id);
    const payload = req.body ?? {};
    const title = String(payload.title ?? "").trim();
    const content = String(payload.content ?? "").trim();
    const requestedGardenId = String(payload.garden_id ?? payload.metadata?.garden_id ?? "").trim();

    if (!title || !content) {
      return reply.status(400).send({ detail: "title and content are required" });
    }

    if (requestedGardenId) {
      const garden = await app.mongo.gardens.findOne({ garden_id: requestedGardenId, status: { $ne: "archived" } });
      if (!garden) {
        return reply.status(404).send({ detail: "Garden not found or archived" });
      }
    }

    const metadata = {
      ...(payload.metadata ?? {}),
      ...(requestedGardenId ? { garden_id: requestedGardenId } : {}),
    };

    const document: DocumentRecord = {
      id: crypto.randomUUID(),
      title,
      content,
      project: tenantId,
      kind: "docs",
      visibility: payload.visibility ?? (requestedGardenId ? "review" : "internal"),
      source: "manual",
      sourcePath: payload.source_path ?? undefined,
      domain: payload.domain ?? "general",
      language: payload.language ?? "en",
      createdBy: "openplanner-cms",
      metadata,
      ts: new Date().toISOString(),
    };

    if (payload.defer_index === true) {
      await persistEvent(app, documentToEvent(document));
      return {
        ...toCmsDocument(document, tenantId),
        indexed: false,
        indexing_deferred: true,
      };
    }

    const result = await persistAndMaybeIndex(app, documentToEvent(document));
    if (result.warning) {
      return reply.status(503).send({ detail: result.warning, persisted: true, indexed: false });
    }
    return toCmsDocument(document, tenantId);
  });

  app.patch<{ Body: CreateCmsDocumentPayload }>("/cms/documents/:id", async (req, reply) => {
    const id = String((req.params as { id: string }).id);
    const existing = await getDocumentById(app, id);
    if (!existing || existing.kind !== "docs") {
      return reply.status(404).send({ detail: "Document not found" });
    }

    const payload = req.body ?? {};
    const next: DocumentRecord = {
      ...existing,
      title: payload.title ?? existing.title,
      content: payload.content ?? existing.content,
      visibility: payload.visibility ?? existing.visibility,
      sourcePath: payload.source_path ?? existing.sourcePath ?? undefined,
      domain: payload.domain ?? existing.domain ?? "general",
      language: payload.language ?? existing.language ?? "en",
      metadata: payload.metadata ?? existing.metadata ?? {},
      ts: new Date().toISOString(),
    };

    const result = await persistAndMaybeIndex(app, documentToEvent(next, existing));
    if (result.warning) {
      return reply.status(503).send({ detail: result.warning, persisted: true, indexed: false });
    }
    return toCmsDocument(next);
  });

  app.delete("/cms/documents/:id", async (req, reply) => {
    const id = String((req.params as { id: string }).id);
    const existing = await getDocumentById(app, id);
    if (!existing || existing.kind !== "docs") {
      return reply.status(404).send({ detail: "Document not found" });
    }

    const archived: DocumentRecord = {
      ...existing,
      visibility: "archived",
      ts: new Date().toISOString(),
    };

    const result = await persistAndMaybeIndex(app, documentToEvent(archived, existing));
    if (result.warning) {
      return reply.status(503).send({ detail: result.warning, persisted: true, indexed: false });
    }

    return { status: "archived", doc_id: id, indexed: result.indexed };
  });

  app.post<{ Body: DraftCmsPayload }>("/cms/draft", async (req) => {
    const payload = req.body ?? {};
    const tenantId = tenantProject(payload.tenant_id);
    const topic = String(payload.topic ?? "Untitled draft").trim() || "Untitled draft";
    const tone = String(payload.tone ?? "professional");
    const audience = String(payload.audience ?? "general");
    const metadata = {
      ...(payload.metadata ?? {}),
      draft_request: {
        tone,
        audience,
        source_collections: payload.source_collections ?? [tenantId],
        max_context_chunks: payload.max_context_chunks ?? 5,
      },
    };

    const document: DocumentRecord = {
      id: crypto.randomUUID(),
      title: `Draft: ${topic}`,
      content: draftMarkdown(topic, tone, audience),
      project: tenantId,
      kind: "docs",
      visibility: "internal",
      source: "ai-drafted",
      domain: "general",
      language: "en",
      createdBy: "openplanner-cms",
      aiDrafted: true,
      aiModel: null,
      metadata,
      ts: new Date().toISOString(),
    };

    await persistAndMaybeIndex(app, documentToEvent(document));
    return toCmsDocument(document, tenantId);
  });

  app.post("/cms/publish/:id/:garden_id", async (req, reply) => {
    const id = String((req.params as { id: string }).id);
    const gardenId = String((req.params as { garden_id: string }).garden_id);
    const query = (req.query ?? {}) as Record<string, string | undefined>;
    const body = (req.body ?? {}) as { published_by?: string };
    const headers = req.headers as Record<string, string | string[] | undefined>;
    const headerPublishedBy = headers["x-published-by"];
    const publishedBy =
      body.published_by?.trim() ||
      (typeof headerPublishedBy === "string" ? headerPublishedBy.trim() : "") ||
      "openplanner-cms";

    const existing = await getDocumentById(app, id);
    if (!existing || existing.kind !== "docs") {
      return reply.status(404).send({ detail: "Document not found" });
    }

    // Validate garden exists and is active
    const garden = await app.mongo.gardens.findOne({ garden_id: gardenId, status: "active" });
    if (!garden) {
      return reply.status(404).send({ detail: "Garden not found or inactive" });
    }

    const skipTranslation = query.skip_translation === "true";
    const targetLanguagesOverride = query.target_languages?.split(",").map((l) => l.trim()).filter(Boolean);

    // Build garden_publications entry
    const now = new Date();
    const existingPublications = (existing.metadata?.garden_publications as Array<Record<string, unknown>>) ?? [];
    const existingPubIndex = existingPublications.findIndex((p) => p.garden_id === gardenId);

    const newPublication = {
      garden_id: gardenId,
      published_at: now.toISOString(),
      published_by: publishedBy,
      translation_status: "pending" as const,
      translated_languages: [] as string[],
    };

    const gardenPublications = [...existingPublications];
    // Track where this publication lives so later updates target the right slot
    // rather than blindly assuming it is the last element.
    const publicationIndex = existingPubIndex >= 0 ? existingPubIndex : gardenPublications.length;
    if (existingPubIndex >= 0) {
      gardenPublications[existingPubIndex] = newPublication;
    } else {
      gardenPublications.push(newPublication);
    }

    const published: DocumentRecord = {
      ...existing,
      visibility: "public",
      publishedAt: now.toISOString(),
      metadata: {
        ...existing.metadata,
        garden_publications: gardenPublications,
      },
      ts: now.toISOString(),
    };

    const deferIndex = query.defer_index === "true";
    const result = deferIndex
      ? { indexed: false }
      : await persistAndMaybeIndex(app, documentToEvent(published, existing));
    if (!deferIndex && "warning" in result && result.warning) {
      return reply.status(503).send({ detail: result.warning, persisted: true, indexed: false });
    }
    if (deferIndex) {
      await persistEvent(app, documentToEvent(published, existing));
    }

    // Queue translation jobs if target languages are configured
    const translationJobs: Array<{ job_id: string; target_lang: string; status: string }> = [];
    const targetLanguages = targetLanguagesOverride ?? garden.target_languages ?? [];

    if (!skipTranslation && targetLanguages.length > 0) {
      const jobsCollection = app.mongo.db.collection("translation_jobs");

      for (const targetLang of targetLanguages) {
        const job = {
          document_id: id,
          garden_id: gardenId,
          project: existing.project,
          source_lang: existing.language ?? "en",
          target_language: targetLang,
          status: "queued",
          created_at: now,
        };

        const jobResult = await jobsCollection.insertOne(job);
        translationJobs.push({
          job_id: jobResult.insertedId.toString(),
          target_lang: targetLang,
          status: "queued",
        });
      }

      // Update publication with translation status
      if (translationJobs.length > 0) {
        const updatedPublication = {
          ...newPublication,
          translation_status: "in_progress" as const,
        };
        gardenPublications[publicationIndex] = updatedPublication;

        await app.mongo.events.updateOne(
          { _id: id },
          {
            $set: {
              "extra.metadata.garden_publications": gardenPublications,
            },
          }
        );
      }
    }

    // Refresh garden stats so the new publication is reflected immediately.
    await recalculateGardenStats(app.mongo, gardenId);

    return {
      status: "published",
      doc_id: id,
      garden_id: gardenId,
      visibility: "public",
      indexed: result.indexed,
      indexing_deferred: deferIndex,
      translation_jobs: translationJobs,
    };
  });

  // Deprecated legacy endpoint. Publishing now requires an explicit garden,
  // so this single-id form is no longer supported. Clients must call
  // POST /cms/publish/:id/:garden_id instead.
  app.post("/cms/publish/:id", async (_req, reply) => {
    return reply.status(400).send({
      detail: "legacy-endpoint-deprecated",
      message: "Use POST /cms/publish/:id/:garden_id to publish to a specific garden",
    });
  });

  app.post("/cms/archive/:id", async (req, reply) => {
    const id = String((req.params as { id: string }).id);
    const existing = await getDocumentById(app, id);
    if (!existing || existing.kind !== "docs") {
      return reply.status(404).send({ detail: "Document not found" });
    }

    const archived: DocumentRecord = {
      ...existing,
      visibility: "archived",
      ts: new Date().toISOString(),
    };

    const result = await persistAndMaybeIndex(app, documentToEvent(archived, existing));
    if (result.warning) {
      return reply.status(503).send({ detail: result.warning, persisted: true, indexed: false });
    }

    return { status: "archived", doc_id: id, indexed: result.indexed };
  });

  app.delete("/cms/publish/:id/:garden_id", async (req, reply) => {
    const id = String((req.params as { id: string }).id);
    const gardenId = String((req.params as { garden_id: string }).garden_id);

    const existing = await getDocumentById(app, id);
    if (!existing || existing.kind !== "docs") {
      return reply.status(404).send({ detail: "Document not found" });
    }

    const gardenPublications = (existing.metadata?.garden_publications as Array<Record<string, unknown>>) ?? [];
    const pubIndex = gardenPublications.findIndex((p) => p.garden_id === gardenId);

    if (pubIndex < 0) {
      return reply.status(404).send({ detail: "Document not published to this garden" });
    }

    // Remove the garden publication
    gardenPublications.splice(pubIndex, 1);

    const unpublished: DocumentRecord = {
      ...existing,
      visibility: gardenPublications.length > 0 ? existing.visibility : "internal",
      metadata: {
        ...existing.metadata,
        garden_publications: gardenPublications,
      },
      ts: new Date().toISOString(),
    };

    const result = await persistAndMaybeIndex(app, documentToEvent(unpublished, existing));
    if (result.warning) {
      return reply.status(503).send({ detail: result.warning, persisted: true, indexed: false });
    }

    return { status: "unpublished", doc_id: id, garden_id: gardenId, indexed: result.indexed };
  });

  app.get("/cms/public", async (req) => {
    const query = (req.query ?? {}) as Record<string, string | undefined>;
    const tenantId = tenantProject(query.tenant_id);
    const limit = query.limit === undefined ? null : Math.max(1, Number(query.limit));
    const offset = Math.max(0, Number(query.offset ?? 0));

    const filter = {
      kind: "docs",
      project: tenantId,
      "extra.visibility": "public",
    };

    const total = await app.mongo.events.countDocuments(filter);

    let cursor = app.mongo.events.find(filter).sort({ ts: -1 }).skip(offset);
    if (limit !== null) cursor = cursor.limit(limit);

    const rows = await cursor.toArray();
    const hydratedRows = await hydrateDocumentRowsForApi(rows as Array<Record<string, unknown>>);
    const documents = hydratedRows.map((row) => toCmsDocument(rowToDocument(row), tenantId));

    return {
      documents,
      total,
      by_visibility: { public: total },
    };
  });

  app.get("/cms/stats", async (req) => {
    const query = (req.query ?? {}) as Record<string, string | undefined>;
    const tenantId = tenantProject(query.tenant_id);

    const filter = buildDocumentFilter({
      ...query,
      project: tenantId,
      kind: query.kind ?? "docs",
    });
    const projectFilter = buildDocumentFilter({ project: tenantId });

    // Collapse what used to be six separate collection round-trips into two
    // single-pass $facet aggregations (one per match filter). Each facet branch
    // computes a total and per-field grouping in the same scan.
    const groupFacet = (fieldPath: string) => [
      { $group: { _id: `$${fieldPath}`, count: { $sum: 1 } } },
    ];

    const [docScoped] = (await app.mongo.events
      .aggregate([
        { $match: filter },
        {
          $facet: {
            total: [{ $count: "value" }],
            byVisibility: groupFacet("extra.visibility"),
            byDomain: groupFacet("extra.domain"),
          },
        },
      ])
      .toArray()) as Array<Record<string, unknown>>;

    const [projectScoped] = (await app.mongo.events
      .aggregate([
        { $match: projectFilter },
        {
          $facet: {
            total: [{ $count: "value" }],
            byKind: groupFacet("kind"),
            bySource: groupFacet("source"),
          },
        },
      ])
      .toArray()) as Array<Record<string, unknown>>;

    return {
      total: facetCount(docScoped?.total),
      project_total: facetCount(projectScoped?.total),
      by_visibility: facetGroups(docScoped?.byVisibility, "internal"),
      by_domain: facetGroups(docScoped?.byDomain, "general"),
      by_kind: facetGroups(projectScoped?.byKind, "docs"),
      by_source: facetGroups(projectScoped?.bySource, "unknown"),
    };
  });
};

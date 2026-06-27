import { readFile } from "node:fs/promises";
import type { FastifyPluginAsync, FastifyInstance } from "fastify";
import type { WithId, Collection } from "mongodb";
import type { GardenDocument, EventDocument } from "../../lib/mongodb.js";
import { renderTranslatedDocument, type TranslationLabelLike, type TranslationSegmentLike } from "../../lib/translation-rendering.js";
import { renderGardenIndex, renderGardenPage } from "../../lib/garden-renderer.js";

interface PublicDocumentResponse {
  doc_id: string;
  title: string;
  content: string;
  language: string;
  source_path: string | null;
  domain: string | null;
  published_at: string | null;
  available_languages: string[];
  translations: { language: string; status: string }[];
  translation_status?: "pending" | "in_review" | "approved" | "rejected";
}

interface DocExtra {
  title?: string;
  content?: string;
  domain?: string;
  language?: string;
  visibility?: string;
  source_path?: string;
  updated_at?: string;
  metadata?: {
    garden_publications?: Array<Record<string, unknown>>;
  };
}

function getAvailableLanguages(
  gardenLangs: string[],
  docLang: string,
  gardenPubs: Array<Record<string, unknown>>
): string[] {
  // Start with just the document's source language
  // Note: We don't trust translated_languages from metadata anymore - 
  // actual availability is determined by checking translation_segments collection
  return [docLang];
}

/**
 * Find a document by ID or path within a garden
 */
async function findDocumentByIdOrPath(
  eventsCollection: Collection<EventDocument>,
  garden_id: string,
  doc_id_or_path: string
): Promise<WithId<EventDocument> | null> {
  // First try exact doc_id match (UUID)
  let doc = await eventsCollection.findOne({
    _id: doc_id_or_path,
    kind: "docs",
    "extra.visibility": "public",
    "extra.metadata.garden_publications.garden_id": garden_id,
  });

  // If not found, try path-based lookup against source_path
  if (!doc) {
    // Normalize the path: handle variations like "getting-started", "/getting-started", "getting-started.md"
    const normalizedPath = doc_id_or_path.replace(/^\//, "").replace(/\.md$/, "");
    
    // Try to find document with matching source_path
    // Match patterns like: /docs/getting-started.md, getting-started.md, /getting-started, etc.
    doc = await eventsCollection.findOne({
      kind: "docs",
      "extra.visibility": "public",
      "extra.metadata.garden_publications.garden_id": garden_id,
      $or: [
        // Exact match on normalized path
        { "extra.source_path": `/${normalizedPath}.md` },
        { "extra.source_path": `${normalizedPath}.md` },
        { "extra.source_path": `/${normalizedPath}` },
        { "extra.source_path": normalizedPath },
        // Match filename at end of path
        { "extra.source_path": { $regex: `/${normalizedPath}\\.md$` } },
        { "extra.source_path": { $regex: `/${normalizedPath}$` } },
        // Match slug in metadata
        { "extra.metadata.slug": normalizedPath },
      ],
    });
  }

  return doc;
}

async function latestLabelsBySegmentId(
  app: FastifyInstance,
  segmentIds: string[],
): Promise<Map<string, TranslationLabelLike[]>> {
  if (segmentIds.length === 0) return new Map();
  const labels = await app.mongo.db.collection("translation_labels")
    .find({
      segment_id: { $in: segmentIds },
      corrected_text: { $exists: true, $nin: [null, ""] },
    })
    .sort({ created_at: -1 })
    .toArray();

  const bySegment = new Map<string, TranslationLabelLike[]>();
  for (const label of labels) {
    const segmentId = String(label.segment_id ?? "");
    if (!segmentId) continue;
    const bucket = bySegment.get(segmentId) ?? [];
    bucket.push({
      segment_id: segmentId,
      corrected_text: typeof label.corrected_text === "string" ? label.corrected_text : null,
      created_at: label.created_at instanceof Date
        ? label.created_at.toISOString()
        : (label.created_at as string | number | null | undefined) ?? null,
    });
    bySegment.set(segmentId, bucket);
  }
  return bySegment;
}

type TranslationStatus = "pending" | "in_review" | "approved" | "rejected";

type ResolvedPublicDocumentContent = {
  content: string;
  servedLanguage: string;
  availableLanguages: string[];
  translations: { language: string; status: string }[];
  translationStatus?: TranslationStatus;
};

function translationStatusFromSegments(segments: unknown[]): TranslationStatus {
  const statuses = segments.map((segment) => (segment as { status?: unknown }).status as string);
  if (statuses.includes("rejected")) return "rejected";
  if (statuses.includes("pending")) return "pending";
  if (statuses.includes("in_review")) return "in_review";
  return "approved";
}

async function resolvePublicDocumentContent(
  app: FastifyInstance,
  doc: WithId<EventDocument>,
  gardenId: string,
  targetLanguages: string[] | undefined,
  requestedLanguage: string,
  extra: DocExtra,
): Promise<ResolvedPublicDocumentContent> {
  const docLanguage = extra.language ?? "en";
  const translationLangs = (await app.mongo.db.collection("translation_segments")
    .distinct("target_lang", { document_id: doc._id, garden_id: gardenId }))
    .filter((lang): lang is string => typeof lang === "string");
  const availableLanguages = [docLanguage, ...translationLangs];

  let content = doc.text ?? extra.content ?? "";
  let servedLanguage = docLanguage;
  let translationStatus: TranslationStatus | undefined;

  // Serve translations regardless of approval status so operators can preview.
  if (requestedLanguage !== docLanguage && translationLangs.includes(requestedLanguage)) {
    const segments = await app.mongo.db.collection("translation_segments")
      .find({
        document_id: doc._id,
        garden_id: gardenId,
        target_lang: requestedLanguage,
      })
      .sort({ segment_index: 1 })
      .toArray();

    const fallbackSegments = segments.length === 0
      ? await app.mongo.db.collection("translation_segments")
        .find({
          document_id: doc._id,
          target_lang: requestedLanguage,
        })
        .sort({ segment_index: 1 })
        .toArray()
      : [];

    const allSegments = segments.length > 0 ? segments : fallbackSegments;

    if (allSegments.length > 0 && allSegments[0].translated_text) {
      const labelsBySegmentId = await latestLabelsBySegmentId(
        app,
        allSegments.map((segment) => String(segment._id)),
      );
      content = renderTranslatedDocument(
        allSegments as TranslationSegmentLike[],
        labelsBySegmentId,
      );
      servedLanguage = requestedLanguage;
      translationStatus = translationStatusFromSegments(allSegments);
    }
  }

  return {
    content,
    servedLanguage,
    availableLanguages,
    translations: (targetLanguages ?? []).map((language) => ({
      language,
      status: translationLangs.includes(language) ? "available" : "pending",
    })),
    translationStatus,
  };
}

export const publicRoutes: FastifyPluginAsync = async (app) => {
  const gardens = app.mongo.gardens;
  const events = app.mongo.events;

  app.get("/public/assets/:asset", async (req, reply) => {
    const asset = String((req.params as { asset: string }).asset);
    if (!/^[a-zA-Z0-9._-]+\.(?:js|css)$/.test(asset)) {
      return reply.status(404).send({ error: "asset not found" });
    }
    const assetUrl = new URL(`../../../node_modules/@open-hax/garden-publication-components/dist/browser/${asset}`, import.meta.url);
    const content = await readFile(assetUrl);
    reply.header("cache-control", "no-store");
    reply.type(asset.endsWith(".css") ? "text/css; charset=utf-8" : "application/javascript; charset=utf-8");
    return content;
  });

  /**
   * GET /v1/public/gardens/:garden_id
   * Public endpoint for garden landing page (no auth required)
   */
  app.get("/public/gardens/:garden_id", async (req, reply) => {
    const garden_id = String((req.params as { garden_id: string }).garden_id);

    const garden = await gardens.findOne({ garden_id, status: "active" });
    if (!garden) {
      return reply.status(404).send({ error: "garden not found or inactive" });
    }

    // Get document count
    const documentsCount = await events.countDocuments({
      kind: "docs",
      "extra.visibility": "public",
      "extra.metadata.garden_publications.garden_id": garden_id,
    });

    return {
      garden: {
        garden_id: garden.garden_id,
        title: garden.title,
        description: garden.description,
        default_language: garden.default_language ?? "en",
      },
      languages: [garden.default_language ?? "en", ...(garden.target_languages ?? [])],
      stats: {
        documents_count: documentsCount,
      },
    };
  });

  /**
   * GET /v1/public/gardens/:garden_id/documents
   * Public documents in a garden (only visibility: public)
   */
  app.get("/public/gardens/:garden_id/documents", async (req, reply) => {
    const garden_id = String((req.params as { garden_id: string }).garden_id);
    const query = (req.query ?? {}) as Record<string, string | undefined>;

    const garden = await gardens.findOne({ garden_id, status: "active" });
    if (!garden) {
      return reply.status(404).send({ error: "garden not found or inactive" });
    }

    const language = query.language ?? garden.default_language ?? "en";
    const pathPrefix = query.path;
    const search = query.search;
    const limit = Math.min(parseInt(query.limit ?? "50", 10), 200);
    const offset = parseInt(query.offset ?? "0", 10);

    // Build filter - only public documents
    const filter: Record<string, unknown> = {
      kind: "docs",
      "extra.visibility": "public",
      "extra.metadata.garden_publications.garden_id": garden_id,
    };

    if (pathPrefix) {
      filter["extra.source_path"] = { $regex: `^${pathPrefix}` };
    }

    // Text search if provided
    if (search && search.trim()) {
      filter["$text"] = { $search: search.trim() };
    }

    const total = await events.countDocuments(filter);
    const docs = await events
      .find(filter)
      .sort({ ts: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const documents = docs.map((doc) => {
      const extra = (doc.extra ?? {}) as DocExtra;
      const metadata = extra.metadata ?? {};
      const gardenPubs = (metadata.garden_publications as Array<Record<string, unknown>>) ?? [];
      const thisPub = gardenPubs.find((p) => p.garden_id === garden_id) ?? {};
      const availableLanguages = getAvailableLanguages(
        garden.target_languages ?? [],
        extra.language ?? "en",
        gardenPubs
      );

      return {
        doc_id: doc._id,
        title: extra.title,
        language: extra.language,
        source_path: extra.source_path,
        domain: extra.domain,
        published_at: (thisPub.published_at as string) ?? null,
        available_languages: availableLanguages,
        translation_status: (thisPub.translation_status as string) ?? null,
      };
    });

    return {
      garden: {
        garden_id: garden.garden_id,
        title: garden.title,
        default_language: garden.default_language ?? "en",
      },
      requested_language: language,
      total,
      offset,
      limit,
      documents,
    };
  });

  /**
   * GET /v1/public/gardens/:garden_id/documents/:doc_id
   * Single document in a garden with language negotiation
   */
  app.get("/public/gardens/:garden_id/documents/:doc_id", async (req, reply) => {
    const garden_id = String((req.params as { garden_id: string }).garden_id);
    const doc_id_or_path = String((req.params as { doc_id: string }).doc_id);
    const query = (req.query ?? {}) as Record<string, string | undefined>;

    const garden = await gardens.findOne({ garden_id, status: "active" });
    if (!garden) {
      return reply.status(404).send({ error: "garden not found or inactive" });
    }

    const requestedLanguage = query.language ?? garden.default_language ?? "en";

    // Find the document by ID or path
    const doc = await findDocumentByIdOrPath(events, garden_id, doc_id_or_path);

    if (!doc) {
      return reply.status(404).send({ error: "document not found in this garden" });
    }

    const extra = (doc.extra ?? {}) as DocExtra;
    const metadata = extra.metadata ?? {};
    const gardenPubs = (metadata.garden_publications as Array<Record<string, unknown>>) ?? [];
    const thisPub = gardenPubs.find((p) => p.garden_id === garden_id) ?? {};
    const {
      content,
      servedLanguage,
      availableLanguages,
      translations,
      translationStatus,
    } = await resolvePublicDocumentContent(
      app,
      doc,
      garden_id,
      garden.target_languages,
      requestedLanguage,
      extra,
    );

    const response: PublicDocumentResponse = {
      doc_id: String(doc._id),
      title: extra.title ?? "Untitled",
      content,
      language: servedLanguage,
      source_path: extra.source_path ?? null,
      domain: extra.domain ?? null,
      published_at: (thisPub.published_at as string) ?? null,
      available_languages: availableLanguages,
      translations,
      translation_status: translationStatus,
    };

    return response;
  });

  /**
   * GET /v1/public/gardens/:garden_id/search
   * Full-text search within a garden
   */
  app.get("/public/gardens/:garden_id/search", async (req, reply) => {
    const garden_id = String((req.params as { garden_id: string }).garden_id);
    const query = (req.query ?? {}) as Record<string, string | undefined>;

    const garden = await gardens.findOne({ garden_id, status: "active" });
    if (!garden) {
      return reply.status(404).send({ error: "garden not found or inactive" });
    }

    const q = query.q ?? query.search;
    if (!q || !q.trim()) {
      return reply.status(400).send({ error: "search query required (q or search param)" });
    }

    const limit = Math.min(parseInt(query.limit ?? "20", 10), 50);
    const offset = parseInt(query.offset ?? "0", 10);

    const filter: Record<string, unknown> = {
      kind: "docs",
      "extra.visibility": "public",
      "extra.metadata.garden_publications.garden_id": garden_id,
      $text: { $search: q.trim() },
    };

    const total = await events.countDocuments(filter);
    const docs = await events
      .find(filter, {
        projection: {
          _id: 1,
          "extra.title": 1,
          "extra.source_path": 1,
          "extra.domain": 1,
          "extra.language": 1,
          "extra.metadata.garden_publications": 1,
          score: { $meta: "textScore" },
        },
      })
      .sort({ score: { $meta: "textScore" } })
      .skip(offset)
      .limit(limit)
      .toArray();

    const results = docs.map((doc) => {
      const extra = (doc.extra ?? {}) as DocExtra;
      const metadata = extra.metadata ?? {};
      const gardenPubs = (metadata.garden_publications as Array<Record<string, unknown>>) ?? [];
      const thisPub = gardenPubs.find((p) => p.garden_id === garden_id) ?? {};

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const score = (doc as any).score as number | undefined;

      return {
        doc_id: doc._id,
        title: extra.title,
        source_path: extra.source_path,
        domain: extra.domain,
        language: extra.language,
        published_at: (thisPub.published_at as string) ?? null,
        score,
      };
    });

    return {
      garden: {
        garden_id: garden.garden_id,
        title: garden.title,
      },
      query: q,
      total,
      offset,
      limit,
      results,
    };
  });

  /**
   * GET /v1/public/gardens/:garden_id/html
   * Render garden index page as themed HTML
   */
  app.get("/public/gardens/:garden_id/html", async (req, reply) => {
    const garden_id = String((req.params as { garden_id: string }).garden_id);

    const garden = await gardens.findOne({ garden_id, status: "active" });
    if (!garden) {
      return reply.status(404).send({ error: "garden not found or inactive" });
    }

    // Get documents in this garden
    const docs = await events
      .find({
        kind: "docs",
        "extra.visibility": "public",
        "extra.metadata.garden_publications.garden_id": garden_id,
      })
      .sort({ ts: -1 })
      .limit(100)
      .toArray();

    const documents = docs.map((doc) => {
      const extra = (doc.extra ?? {}) as DocExtra;
      return {
        doc_id: doc._id,
        title: extra.title ?? "Untitled",
        source_path: extra.source_path,
        language: extra.language,
      };
    });

    const html = await renderGardenIndex(garden, documents, {
      fullDocument: true,
      includeNav: true,
      baseUrl: `/api/openplanner/v1/public/gardens/${garden_id}/html`,
    });

    reply.type("text/html; charset=utf-8");
    return html;
  });

  /**
   * GET /v1/public/gardens/:garden_id/html/:doc_id
   * Render single document as themed HTML
   * Supports both UUID doc_id and path-based lookups (e.g., /getting-started)
   * Supports ?language= query param to request translated content
   */
  app.get("/public/gardens/:garden_id/html/:doc_id", async (req, reply) => {
    const garden_id = String((req.params as { garden_id: string }).garden_id);
    const doc_id_or_path = String((req.params as { doc_id: string }).doc_id);
    const query = (req.query ?? {}) as Record<string, string | undefined>;

    const garden = await gardens.findOne({ garden_id, status: "active" });
    if (!garden) {
      return reply.status(404).send({ error: "garden not found or inactive" });
    }

    // Find the document by ID or path
    const doc = await findDocumentByIdOrPath(events, garden_id, doc_id_or_path);

    if (!doc) {
      return reply.status(404).send({ error: "document not found in this garden" });
    }

    const extra = (doc.extra ?? {}) as DocExtra;
    const docLanguage = extra.language ?? "en";
    const requestedLanguage = query.language ?? docLanguage;
    const {
      content,
      servedLanguage,
      availableLanguages,
      translations,
      translationStatus,
    } = await resolvePublicDocumentContent(
      app,
      doc,
      garden_id,
      garden.target_languages,
      requestedLanguage,
      extra,
    );

    const html = await renderGardenPage(
      garden,
      {
        title: extra.title ?? "Untitled",
        content,
        source_path: extra.source_path,
        language: servedLanguage,
        metadata: extra.metadata as Record<string, unknown> | undefined,
        translationStatus,
        availableLanguages,
      },
      {
        fullDocument: true,
        includeNav: true,
        // Include document ID so language selector navigates to the same document
        baseUrl: `/api/openplanner/v1/public/gardens/${garden_id}/html/${doc._id}`,
        requestedLanguage,
        targetLanguages: garden.target_languages,
        translations,
      }
    );

    reply.type("text/html; charset=utf-8");
    return html;
  });
};

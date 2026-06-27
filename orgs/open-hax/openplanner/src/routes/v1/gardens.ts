import type { FastifyPluginAsync } from "fastify";
import type { GardenDocument, MongoConnection } from "../../lib/mongodb.js";

type GardenStatus = "draft" | "active" | "archived";

interface GardenNav {
  items: {
    label: string;
    path: string;
    children?: { label: string; path: string }[];
  }[];
}

interface CreateGardenPayload {
  garden_id: string;
  title: string;
  description?: string;
  theme?: string;
  default_language?: string;
  target_languages?: string[];
  source_filter?: {
    project?: string;
    kind?: string;
    domain?: string;
    path_prefix?: string;
  } | null;
  nav?: GardenNav;
  owner_id?: string;
}

interface UpdateGardenPayload {
  title?: string;
  description?: string | null;
  theme?: string;
  default_language?: string;
  target_languages?: string[];
  source_filter?: {
    project?: string;
    kind?: string;
    domain?: string;
    path_prefix?: string;
  } | null;
  nav?: GardenNav | null;
  status?: GardenStatus;
}

interface GardenResponse {
  garden_id: string;
  title: string;
  description: string | null;
  theme: string;
  default_language: string;
  target_languages: string[];
  source_filter: {
    project?: string;
    kind?: string;
    domain?: string;
    path_prefix?: string;
  } | null;
  nav: GardenNav | null;
  owner_id: string;
  created_by: string;
  status: GardenStatus;
  stats: {
    documents_count: number;
    translations_count: number;
    last_published_at: string | null;
  } | null;
  created_at: string;
  updated_at: string;
}

function toResponse(doc: GardenDocument): GardenResponse {
  return {
    garden_id: doc.garden_id,
    title: doc.title,
    description: doc.description ?? null,
    theme: doc.theme ?? "default",
    default_language: doc.default_language ?? "en",
    target_languages: doc.target_languages ?? [],
    source_filter: doc.source_filter ?? null,
    nav: doc.nav ?? null,
    owner_id: doc.owner_id ?? "system",
    created_by: doc.created_by ?? "system",
    status: doc.status ?? "active",
    stats: doc.stats
      ? {
          documents_count: doc.stats.documents_count,
          translations_count: doc.stats.translations_count,
          last_published_at: doc.stats.last_published_at?.toISOString() ?? null,
        }
      : null,
    created_at: doc.createdAt.toISOString(),
    updated_at: doc.updatedAt.toISOString(),
  };
}

interface GardenStats {
  documents_count: number;
  translations_count: number;
  last_published_at?: Date;
}

/**
 * Recompute and persist a garden's stats (document count, translation segment
 * count, last-published timestamp). Returns the freshly computed stats, or null
 * if the garden does not exist. Shared by the stats route and the CMS publish
 * workflow so published documents are reflected immediately.
 */
export async function recalculateGardenStats(
  mongo: MongoConnection,
  garden_id: string
): Promise<GardenStats | null> {
  const garden = await mongo.gardens.findOne({ garden_id });
  if (!garden) return null;

  const documentsCount = await mongo.events.countDocuments({
    kind: "docs",
    "extra.metadata.garden_publications.garden_id": garden_id,
  });

  const translationsCount = await mongo.db
    .collection("translation_segments")
    .countDocuments({ garden_id });

  const lastPublished = await mongo.events.findOne(
    {
      kind: "docs",
      "extra.metadata.garden_publications.garden_id": garden_id,
    },
    { sort: { ts: -1 } }
  );

  // events store `ts` as an ISO string; normalize to Date so the stored stats
  // match the GardenDocument schema and toResponse() can call toISOString().
  const lastPublishedTs = lastPublished?.ts;
  const lastPublishedAt =
    typeof lastPublishedTs === "string" || typeof lastPublishedTs === "number"
      ? new Date(lastPublishedTs)
      : lastPublishedTs instanceof Date
        ? lastPublishedTs
        : undefined;

  const stats: GardenStats = {
    documents_count: documentsCount,
    translations_count: translationsCount,
    ...(lastPublishedAt ? { last_published_at: lastPublishedAt } : {}),
  };

  await mongo.gardens.updateOne(
    { garden_id },
    {
      $set: {
        stats,
        updatedAt: new Date(),
      },
    }
  );

  return stats;
}

export const gardenRoutes: FastifyPluginAsync = async (app) => {
  const gardens = app.mongo.gardens;

  /**
   * GET /v1/gardens
   * List all gardens (optionally filter by status)
   */
  app.get("/gardens", async (req) => {
    const query = (req.query ?? {}) as Record<string, string | undefined>;
    const status = query.status as GardenStatus | undefined;
    const owner_id = query.owner_id;

    const filter: Record<string, unknown> = {};
    if (status) {
      // Explicit status filter is honored verbatim (e.g. ?status=archived).
      filter.status = status;
    } else {
      // Default listing hides archived gardens (soft-deleted).
      filter.status = { $ne: "archived" };
    }
    if (owner_id) filter.owner_id = owner_id;

    const docs = await gardens.find(filter).sort({ createdAt: -1 }).toArray();

    return {
      ok: true,
      count: docs.length,
      gardens: docs.map(toResponse),
    };
  });

  /**
   * POST /v1/gardens
   * Create a new garden
   */
  app.post<{ Body: CreateGardenPayload }>("/gardens", async (req, reply) => {
    const payload = req.body ?? {};
    const garden_id = String(payload.garden_id ?? "").trim();

    if (!garden_id || !/^[a-z0-9-]+$/.test(garden_id)) {
      return reply
        .status(400)
        .send({ error: "garden_id must be lowercase alphanumeric with hyphens" });
    }

    if (!payload.title?.trim()) {
      return reply.status(400).send({ error: "title is required" });
    }

    // Check for existing garden
    const existing = await gardens.findOne({ garden_id });
    if (existing) {
      return reply.status(409).send({ error: "garden_id already exists" });
    }

    const now = new Date();
    const doc: GardenDocument = {
      _id: garden_id,
      garden_id,
      title: payload.title.trim(),
      description: payload.description?.trim() ?? null,
      theme: payload.theme ?? "default",
      default_language: payload.default_language ?? "en",
      target_languages: payload.target_languages ?? [],
      source_filter: payload.source_filter ?? null,
      nav: payload.nav ?? null,
      owner_id: payload.owner_id ?? "anonymous",
      created_by: payload.owner_id ?? "anonymous",
      status: "draft",
      stats: null,
      createdAt: now,
      updatedAt: now,
    };

    await gardens.insertOne(doc);
    return toResponse(doc);
  });

  /**
   * GET /v1/gardens/:id
   * Get a single garden by ID
   */
  app.get("/gardens/:id", async (req, reply) => {
    const garden_id = String((req.params as { id: string }).id);
    const doc = await gardens.findOne({ garden_id });

    if (!doc || doc.status === "archived") {
      // Archived gardens are soft-deleted and not retrievable via GET.
      return reply.status(404).send({ error: "garden not found" });
    }

    return { ok: true, garden: toResponse(doc) };
  });

  /**
   * PATCH /v1/gardens/:id
   * Update garden settings
   */
  app.patch<{ Body: UpdateGardenPayload }>("/gardens/:id", async (req, reply) => {
    const garden_id = String((req.params as { id: string }).id);
    const payload = req.body ?? {};

    const existing = await gardens.findOne({ garden_id });
    if (!existing) {
      return reply.status(404).send({ error: "garden not found" });
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (payload.title !== undefined) updates.title = payload.title.trim();
    if (payload.description !== undefined) updates.description = payload.description?.trim() ?? null;
    if (payload.theme !== undefined) updates.theme = payload.theme;
    if (payload.default_language !== undefined) updates.default_language = payload.default_language;
    if (payload.target_languages !== undefined) updates.target_languages = payload.target_languages;
    if (payload.source_filter !== undefined) updates.source_filter = payload.source_filter;
    if (payload.nav !== undefined) updates.nav = payload.nav;
    if (payload.status !== undefined) updates.status = payload.status;

    await gardens.updateOne({ garden_id }, { $set: updates });

    const updated = await gardens.findOne({ garden_id });
    return toResponse(updated!);
  });

  /**
   * DELETE /v1/gardens/:id
   * Archive a garden (soft delete)
   */
  app.delete("/gardens/:id", async (req, reply) => {
    const garden_id = String((req.params as { id: string }).id);

    const existing = await gardens.findOne({ garden_id });
    if (!existing) {
      return reply.status(404).send({ error: "garden not found" });
    }

    if (existing.status === "archived") {
      return reply.status(400).send({ error: "garden already archived" });
    }

    await gardens.updateOne(
      { garden_id },
      {
        $set: {
          status: "archived",
          updatedAt: new Date(),
        },
      }
    );

    return { ok: true, status: "archived", garden_id };
  });

  /**
   * POST /v1/gardens/:id/activate
   * Activate a draft garden
   */
  app.post("/gardens/:id/activate", async (req, reply) => {
    const garden_id = String((req.params as { id: string }).id);

    const existing = await gardens.findOne({ garden_id });
    if (!existing) {
      return reply.status(404).send({ error: "garden not found" });
    }

    if (existing.status === "active") {
      return reply.status(400).send({ error: "garden already active" });
    }

    await gardens.updateOne(
      { garden_id },
      {
        $set: {
          status: "active",
          updatedAt: new Date(),
        },
      }
    );

    const updated = await gardens.findOne({ garden_id });
    return toResponse(updated!);
  });

  /**
   * POST /v1/gardens/:id/stats
   * Recalculate garden stats (documents count, translations count)
   */
  app.post("/gardens/:id/stats", async (req, reply) => {
    const garden_id = String((req.params as { id: string }).id);

    const stats = await recalculateGardenStats(app.mongo, garden_id);
    if (!stats) {
      return reply.status(404).send({ error: "garden not found" });
    }

    return { ok: true, garden_id, stats };
  });

  /**
   * GET /v1/gardens/:id/documents
   * List documents published to a garden
   */
  app.get("/gardens/:id/documents", async (req, reply) => {
    const garden_id = String((req.params as { id: string }).id);
    const query = (req.query ?? {}) as Record<string, string | undefined>;

    const garden = await gardens.findOne({ garden_id });
    if (!garden) {
      return reply.status(404).send({ error: "garden not found" });
    }

    const language = query.language;
    const visibility = query.visibility;
    const domain = query.domain;
    const limit = Math.min(parseInt(query.limit ?? "50", 10), 200);
    const offset = parseInt(query.offset ?? "0", 10);

    // Build filter for documents published to this garden
    const filter: Record<string, unknown> = {
      kind: "docs",
      "extra.metadata.garden_publications.garden_id": garden_id,
    };

    if (visibility) {
      filter["extra.visibility"] = visibility;
    }

    if (domain) {
      filter["extra.domain"] = domain;
    }

    // If language specified, prefer translated versions
    const pipeline: object[] = [
      { $match: filter },
      { $sort: { ts: -1 } },
      { $skip: offset },
      { $limit: limit },
    ];

    const docs = await app.mongo.events.aggregate(pipeline).toArray();
    const total = await app.mongo.events.countDocuments(filter);

    const documents = docs.map((doc) => {
      const extra = doc.extra ?? {};
      const metadata = extra.metadata ?? {};
      const gardenPubs = (metadata.garden_publications as Array<Record<string, unknown>>) ?? [];
      const thisPub = gardenPubs.find((p) => p.garden_id === garden_id) ?? {};

      return {
        doc_id: doc._id,
        title: extra.title,
        domain: extra.domain,
        language: extra.language,
        visibility: extra.visibility,
        source_path: extra.source_path,
        published_at: (thisPub.published_at as string) ?? null,
        translation_status: (thisPub.translation_status as string) ?? null,
        translated_languages: (thisPub.translated_languages as string[]) ?? [],
        created_at: doc.ts,
        updated_at: extra.updated_at ?? doc.ts,
      };
    });

    return {
      ok: true,
      garden: {
        garden_id: garden.garden_id,
        title: garden.title,
        default_language: garden.default_language,
        target_languages: garden.target_languages,
      },
      total,
      offset,
      limit,
      documents,
    };
  });
};

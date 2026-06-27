import type { FastifyPluginAsync } from "fastify";
import { getDocumentById, persistAndMaybeIndex, documentToEvent } from "./documents.js";
import type { DocumentRecord, DocumentKind, DocumentVisibility } from "../../lib/types.js";

function parseJson(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    return {};
  } catch {
    return {};
  }
}

type ReviewItem = {
  doc_id: string;
  tenant_id: string;
  title: string;
  content_preview: string;
  visibility: string;
  source: string;
  ai_drafted: boolean;
  confidence: number;
  created_at: string;
  updated_at: string;
  source_count: number;
  agent_name: string | null;
};

type ReviewStats = {
  pending: number;
  approved_today: number;
  rejected_today: number;
  flagged: number;
};

function truncateContent(content: string, maxLength = 200): string {
  if (!content) return "";
  const cleaned = content.replace(/\n+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength - 3) + "...";
}

function inferReviewConfidence(doc: DocumentRecord): number {
  // Infer confidence from AI metadata
  const metadata = doc.metadata ?? {};
  if (typeof metadata.confidence === "number") return metadata.confidence;
  if (typeof metadata.score === "number") return metadata.score;
  
  // Default confidence based on source
  if (doc.aiDrafted) return 0.65; // AI drafts need review
  if (doc.source === "manual") return 0.85; // Manual docs are usually good
  return 0.75; // Default for ingested content
}

function toReviewItem(doc: DocumentRecord): ReviewItem {
  const metadata = doc.metadata ?? {};
  return {
    doc_id: doc.id,
    tenant_id: doc.project ?? "devel",
    title: doc.title ?? "Untitled",
    content_preview: truncateContent(doc.content ?? ""),
    visibility: doc.visibility ?? "internal",
    source: doc.source ?? "manual",
    ai_drafted: Boolean(doc.aiDrafted),
    confidence: inferReviewConfidence(doc),
    created_at: doc.ts ?? new Date().toISOString(),
    updated_at: doc.ts ?? new Date().toISOString(),
    source_count: typeof metadata.source_count === "number" ? metadata.source_count : 1,
    agent_name: typeof metadata.agent_name === "string" ? metadata.agent_name : null,
  };
}

export const reviewRoutes: FastifyPluginAsync = async (app) => {
  // GET / — List documents pending review
  app.get("/", async (req) => {
    const query = req.query as {
      tenant_id?: string;
      status?: string;
      limit?: number;
      offset?: number;
    };

    const tenantId = query.tenant_id ?? (req as any).tenantId ?? "devel";
    const limit = Math.min(query.limit ?? 50, 200);
    const offset = query.offset ?? 0;

    // Build filter for review items
    const filter: Record<string, unknown> = {
      kind: "docs",
      project: tenantId,
    };

    // By default, show items in "review" visibility
    // Can also filter by "flagged" status
    if (query.status === "flagged") {
      filter["extra.metadata.flagged"] = true;
    } else if (query.status === "all") {
      // Show both review and flagged
      filter["$or"] = [
        { "extra.visibility": "review" },
        { "extra.metadata.flagged": true },
      ];
    } else {
      filter["extra.visibility"] = "review";
    }

    const cursor = app.mongo.events
      .find(filter)
      .sort({ ts: -1 })
      .skip(offset)
      .limit(limit);

    const docs = await cursor.toArray();
    const total = await app.mongo.events.countDocuments(filter);

    const items = docs.map((row) => {
      const doc = row as unknown as Record<string, unknown>;
      const extra = parseJson(doc.extra as string | Record<string, unknown>);
      const metadata = (extra.metadata && typeof extra.metadata === "object") ? (extra.metadata as Record<string, unknown>) : {};
      const ts = doc.ts instanceof Date ? doc.ts.toISOString() : String(doc.ts ?? new Date().toISOString());

      const record: DocumentRecord = {
        id: String(doc._id ?? doc.id ?? ""),
        kind: (doc.kind as DocumentKind) ?? "docs",
        title: String(extra.title ?? doc.title ?? doc.message ?? ""),
        content: String(doc.text ?? doc.content ?? ""),
        project: String(doc.project ?? "devel"),
        visibility: (extra.visibility as DocumentVisibility) ?? "internal",
        source: String(extra.source ?? "manual"),
        aiDrafted: Boolean(extra.ai_drafted),
        metadata,
        ts,
      };
      return toReviewItem(record);
    });

    // Sort by confidence (lowest first)
    items.sort((a, b) => a.confidence - b.confidence);

    return {
      items,
      total,
      limit,
      offset,
    };
  });

  // GET /stats — Review queue statistics
  app.get("/stats", async (req) => {
    const tenantId = (req as any).tenantId ?? "devel";
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, flagged, approvedToday, rejectedToday] = await Promise.all([
      app.mongo.events.countDocuments({
        kind: "docs",
        project: tenantId,
        "extra.visibility": "review",
      }),
      app.mongo.events.countDocuments({
        kind: "docs",
        project: tenantId,
        "extra.metadata.flagged": true,
      }),
      app.mongo.events.countDocuments({
        kind: "docs",
        project: tenantId,
        "extra.visibility": "public",
        "extra.published_at": { $gte: today.toISOString() },
      }),
      app.mongo.events.countDocuments({
        kind: "docs",
        project: tenantId,
        "extra.metadata.rejected_at": { $gte: today.toISOString() },
      }),
    ]);

    return {
      pending,
      flagged,
      approved_today: approvedToday,
      rejected_today: rejectedToday,
    } as ReviewStats;
  });

  // GET /:id — Get review item details
  app.get("/:id", async (req, reply) => {
    const id = String((req.params as { id: string }).id);
    const doc = await getDocumentById(app, id);

    if (!doc || doc.kind !== "docs") {
      return reply.status(404).send({ detail: "Document not found" });
    }

    // Return full document for review
    return {
      doc_id: doc.id,
      tenant_id: doc.project,
      title: doc.title,
      content: doc.content,
      visibility: doc.visibility,
      source: doc.source,
      ai_drafted: doc.aiDrafted,
      ai_model: doc.aiModel,
      metadata: doc.metadata,
      created_at: doc.ts,
      updated_at: doc.ts,
    };
  });

  // POST /:id/approve — Approve document (set visibility=public)
  app.post("/:id/approve", async (req, reply) => {
    const id = String((req.params as { id: string }).id);
    const body = req.body as { garden_id?: string; notes?: string } | undefined;
    
    const existing = await getDocumentById(app, id);
    if (!existing || existing.kind !== "docs") {
      return reply.status(404).send({ detail: "Document not found" });
    }

    const now = new Date();
    const approved: DocumentRecord = {
      ...existing,
      visibility: "public",
      publishedAt: now.toISOString(),
      publishedBy: (req as any).user?.sub ?? "reviewer",
      metadata: {
        ...existing.metadata,
        reviewed_at: now.toISOString(),
        review_notes: body?.notes,
        flagged: false, // Clear any previous flag
      },
      ts: now.toISOString(),
    };

    const result = await persistAndMaybeIndex(app, documentToEvent(approved, existing));
    
    return {
      status: "approved",
      doc_id: id,
      visibility: "public",
      indexed: result.indexed,
    };
  });

  // POST /:id/reject — Reject document (set visibility=internal)
  app.post("/:id/reject", async (req, reply) => {
    const id = String((req.params as { id: string }).id);
    const body = req.body as { reason?: string } | undefined;
    
    const existing = await getDocumentById(app, id);
    if (!existing || existing.kind !== "docs") {
      return reply.status(404).send({ detail: "Document not found" });
    }

    const now = new Date();
    const rejected: DocumentRecord = {
      ...existing,
      visibility: "internal",
      metadata: {
        ...existing.metadata,
        rejected_at: now.toISOString(),
        rejection_reason: body?.reason,
        flagged: false,
      },
      ts: now.toISOString(),
    };

    await persistAndMaybeIndex(app, documentToEvent(rejected, existing));
    
    return {
      status: "rejected",
      doc_id: id,
      visibility: "internal",
    };
  });

  // POST /:id/flag — Flag document for further review
  app.post("/:id/flag", async (req, reply) => {
    const id = String((req.params as { id: string }).id);
    const body = req.body as { reason?: string } | undefined;
    
    const existing = await getDocumentById(app, id);
    if (!existing || existing.kind !== "docs") {
      return reply.status(404).send({ detail: "Document not found" });
    }

    const now = new Date();
    const flagged: DocumentRecord = {
      ...existing,
      metadata: {
        ...existing.metadata,
        flagged: true,
        flagged_at: now.toISOString(),
        flag_reason: body?.reason,
      },
      ts: now.toISOString(),
    };

    await persistAndMaybeIndex(app, documentToEvent(flagged, existing));
    
    return {
      status: "flagged",
      doc_id: id,
      visibility: existing.visibility,
    };
  });

  // POST /batch — Batch approve/reject/flag
  app.post("/batch", async (req, reply) => {
    const body = req.body as {
      action: "approve" | "reject" | "flag";
      doc_ids: string[];
      reason?: string;
    };

    if (!body.action || !body.doc_ids?.length) {
      return reply.status(400).send({ detail: "action and doc_ids required" });
    }

    const results: Array<{ doc_id: string; status: string; error?: string }> = [];

    for (const id of body.doc_ids) {
      try {
        const existing = await getDocumentById(app, id);
        if (!existing || existing.kind !== "docs") {
          results.push({ doc_id: id, status: "error", error: "Not found" });
          continue;
        }

        const now = new Date();
        let updated: DocumentRecord;

        if (body.action === "approve") {
          updated = {
            ...existing,
            visibility: "public",
            publishedAt: now.toISOString(),
            publishedBy: (req as any).user?.sub ?? "reviewer",
            metadata: { ...existing.metadata, reviewed_at: now.toISOString() },
            ts: now.toISOString(),
          };
        } else if (body.action === "reject") {
          updated = {
            ...existing,
            visibility: "internal",
            metadata: {
              ...existing.metadata,
              rejected_at: now.toISOString(),
              rejection_reason: body.reason,
            },
            ts: now.toISOString(),
          };
        } else {
          updated = {
            ...existing,
            metadata: {
              ...existing.metadata,
              flagged: true,
              flagged_at: now.toISOString(),
              flag_reason: body.reason,
            },
            ts: now.toISOString(),
          };
        }

        await persistAndMaybeIndex(app, documentToEvent(updated, existing));
        results.push({ doc_id: id, status: body.action + "d" });
      } catch (err) {
        results.push({ doc_id: id, status: "error", error: String(err) });
      }
    }

    return {
      action: body.action,
      processed: results.length,
      results,
    };
  });
};

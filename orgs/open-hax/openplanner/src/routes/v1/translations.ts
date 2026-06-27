import type { FastifyPluginAsync, FastifyInstance } from "fastify";
import {
  documentListShape,
  documentReviewLabelPlan,
  documentTranslationShape,
  jobStatusUpdatePlan,
  manifestShape,
  nextSegmentStatus,
  normalizeTranslationSegment,
  sftRow,
  translationGraphMemoryPlan,
  translationJobPlan,
} from "@open-hax/openplanner-translation-core";
import { ObjectId } from "mongodb";

/**
 * Translation Segment Schema
 * Stored in MongoDB translation_segments collection
 */
interface TranslationSegment {
  _id?: ObjectId;
  id?: string;
  source_text: string;
  translated_text: string;
  source_lang: string;
  target_lang: string;
  document_id: string;
  garden_id?: string;
  segment_index: number;
  status: "pending" | "in_review" | "approved" | "rejected";
  mt_model?: string;
  confidence?: number;
  domain?: string;
  content_type?: string;
  url_context?: string;
  org_id?: string;
  project?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Translation Label Schema
 * Stored in MongoDB translation_labels collection
 */
interface TranslationLabel {
  _id?: ObjectId;
  segment_id: string;
  labeler_id: string;
  labeler_email: string;
  label_version: number;
  adequacy: "excellent" | "good" | "adequate" | "poor" | "unusable";
  fluency: "excellent" | "good" | "adequate" | "poor" | "unusable";
  terminology: "correct" | "minor_errors" | "major_errors";
  risk: "safe" | "sensitive" | "policy_violation";
  overall: "approve" | "needs_edit" | "reject";
  corrected_text?: string;
  editor_notes?: string;
  created_at: Date;
}

/**
 * Graph memory integration for zero-shot learning
 * Upserts approved translations to graph memory for MT context enrichment
 */
async function upsertTranslationToGraphMemory(
  app: FastifyInstance,
  segment: TranslationSegment,
  correctedText?: string
): Promise<{ success: boolean; error?: string }> {
  const plan = translationGraphMemoryPlan({
    ...segment,
    segment_id: segment._id?.toString(),
    corrected_text: correctedText,
  }) as any;
  if (plan["ok?"] === false) {
    return { success: false, error: String(plan.error ?? "Missing source or target text") };
  }

  try {
    const now = new Date();
    await app.mongo.db.collection("graph_nodes").updateOne(
      { id: plan.node.id },
      {
        $set: { ...plan.node, updated_at: now },
        $setOnInsert: { created_at: now },
      },
      { upsert: true }
    );

    await app.mongo.db.collection("graph_edges").updateOne(
      { id: plan.edge.id },
      {
        $set: { ...plan.edge, updated_at: now },
        $setOnInsert: { created_at: now },
      },
      { upsert: true }
    );

    return { success: true };
  } catch (err) {
    console.error("Failed to upsert translation to graph memory:", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Query graph memory for similar translation examples (zero-shot context)
 */
async function queryTranslationExamples(
  app: FastifyInstance,
  sourceText: string,
  sourceLang: string,
  targetLang: string,
  limit: number = 5
): Promise<Array<{ source_text: string; target_text: string; similarity?: number }>> {
  try {
    // Query by language pair and text similarity
    // For now, use regex-based partial match; later can use vector similarity
    const nodes = await app.mongo.db
      .collection("graph_nodes")
      .find({
        kind: "translation_example",
        "data.source_lang": sourceLang,
        "data.target_lang": targetLang,
        $or: [
          { "data.source_text": { $regex: sourceText.slice(0, 30), $options: "i" } },
          { "data.domain": { $exists: true } },
        ],
      })
      .limit(limit)
      .toArray();

    return nodes.map((n) => {
      const data = n.data as Record<string, unknown> | undefined;
      return {
        source_text: String(data?.source_text ?? ""),
        target_text: String(data?.target_text ?? ""),
        similarity: data?.domain ? 0.5 : 0.3,
      };
    });
  } catch (err) {
    console.error("Failed to query translation examples:", err);
    return [];
  }
}

export const translationRoutes: FastifyPluginAsync = async (app) => {
  // Get MongoDB collections
  const segmentsCollection = app.mongo.db.collection("translation_segments");
  const labelsCollection = app.mongo.db.collection("translation_labels");
  const configCollection = app.mongo.db.collection<{
    _id: string;
    model?: string;
    updated_at?: Date;
    created_at?: Date;
  }>("translation_config");

  // Create indexes
  // Create indexes for segments collection
  await segmentsCollection.createIndex(
    { document_id: 1, segment_index: 1, target_lang: 1 },
    { unique: true, name: "segment_unique_idx" }
  );
  await segmentsCollection.createIndex({ status: 1 });
  await segmentsCollection.createIndex({ target_lang: 1 });
  await segmentsCollection.createIndex({ garden_id: 1 });
  await segmentsCollection.createIndex({ org_id: 1 });
  await segmentsCollection.createIndex({ project: 1 });
  await labelsCollection.createIndex({ segment_id: 1, created_at: -1 });

  /**
   * Translation pipeline configuration
   * GET /v1/translations/config
   * PATCH /v1/translations/config
   */
  app.get("/translations/config", async () => {
    const doc = await configCollection.findOne({ _id: "default" });
    const model = typeof doc?.model === "string" && doc.model.trim().length > 0
      ? doc.model
      : "glm-5";

    return {
      ok: true,
      config: {
        model,
        updated_at: doc?.updated_at instanceof Date
          ? doc.updated_at.toISOString()
          : null,
      },
    };
  });

  app.patch<{ Body: { model?: string } }>("/translations/config", async (req, reply) => {
    const rawModel = typeof req.body?.model === "string" ? req.body.model.trim() : "";
    if (!rawModel) {
      return reply.status(400).send({ error: "model is required" });
    }

    const now = new Date();
    await configCollection.updateOne(
      { _id: "default" },
      {
        $set: {
          model: rawModel,
          updated_at: now,
        },
        $setOnInsert: {
          created_at: now,
        },
      },
      { upsert: true },
    );

    return {
      ok: true,
      config: {
        model: rawModel,
        updated_at: now.toISOString(),
      },
    };
  });

  /**
   * List translation segments with filtering
   * GET /v1/translations/segments
   */
  app.get("/translations/segments", async (req, reply) => {
    const query = req.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = {};

    // Build filter
    if (query.project) filter.project = query.project;
    if (query.org_id) filter.org_id = query.org_id;
    if (query.status) filter.status = query.status;
    if (query.source_lang) filter.source_lang = query.source_lang;
    if (query.target_lang) filter.target_lang = query.target_lang;
    if (query.domain) filter.domain = query.domain;
    if (query.document_id) filter.document_id = query.document_id;

    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 50)));
    const offset = Math.max(0, Number(query.offset ?? 0));

    const segments = await segmentsCollection
      .find(filter)
      .sort({ created_at: 1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const total = await segmentsCollection.countDocuments(filter);

    // Fetch label counts for each segment
    const segmentIds = segments.map((s) => s._id.toString());
    const labelCounts = await labelsCollection
      .aggregate<{ _id: string; count: number }>([
        { $match: { segment_id: { $in: segmentIds } } },
        { $group: { _id: "$segment_id", count: { $sum: 1 } } },
      ])
      .toArray();

    const labelCountMap = new Map(labelCounts.map((l) => [l._id, l.count]));

    // Return formatted response with label counts
    return {
      segments: segments.map((s) => ({
        id: s._id.toString(),
        source_text: s.source_text,
        translated_text: s.translated_text,
        source_lang: s.source_lang,
        target_lang: s.target_lang,
        document_id: s.document_id,
        segment_index: s.segment_index,
        status: s.status,
        confidence: s.confidence ?? null,
        mt_model: s.mt_model ?? null,
        domain: s.domain ?? null,
        garden_id: s.garden_id ?? null,
        tenant_id: s.org_id ?? null,
        org_id: s.org_id ?? null,
        labels: [], // Labels not included in list; fetch segment detail for full labels
        label_count: labelCountMap.get(s._id.toString()) ?? 0,
        ts: s.created_at?.toISOString?.() ?? null,
      })),
      total,
      has_more: offset + segments.length < total,
    };
  });

  /**
   * Get single segment with labels
   * GET /v1/translations/segments/:id
   */
  app.get("/translations/segments/:id", async (req, reply) => {
    const id = (req.params as { id: string }).id;

    let segment;
    try {
      segment = await segmentsCollection.findOne({ _id: new ObjectId(id) });
    } catch (err) {
      return reply.status(400).send({ error: "Invalid segment ID" });
    }

    if (!segment) {
      return reply.status(404).send({ error: "Segment not found" });
    }

    // Fetch labels for this segment
    const labels = await labelsCollection
      .find({ segment_id: id })
      .sort({ created_at: -1 })
      .toArray();

    // Return segment with normalized label timestamps (ts instead of created_at)
    return {
      id: segment._id.toString(),
      source_text: segment.source_text,
      translated_text: segment.translated_text,
      source_lang: segment.source_lang,
      target_lang: segment.target_lang,
      document_id: segment.document_id,
      segment_index: segment.segment_index,
      status: segment.status,
      confidence: segment.confidence ?? null,
      mt_model: segment.mt_model ?? null,
      domain: segment.domain ?? null,
      garden_id: segment.garden_id ?? null,
      tenant_id: segment.org_id ?? null,
      org_id: segment.org_id ?? null,
      labels: labels.map((l) => ({
        id: l._id.toString(),
        segment_id: l.segment_id,
        labeler_id: l.labeler_id,
        labeler_email: l.labeler_email,
        adequacy: l.adequacy,
        fluency: l.fluency,
        terminology: l.terminology,
        risk: l.risk,
        overall: l.overall,
        corrected_text: l.corrected_text ?? null,
        editor_notes: l.editor_notes ?? null,
        ts: l.created_at?.toISOString?.() ?? null,
      })),
      ts: segment.created_at?.toISOString?.() ?? null,
    };
  });

  /**
   * Submit label for segment
   * POST /v1/translations/segments/:id/labels
   */
  app.post("/translations/segments/:id/labels", async (req, reply) => {
    const segmentId = (req.params as { id: string }).id;
    const body = req.body as Record<string, unknown>;

    // Verify segment exists
    let segment;
    try {
      segment = await segmentsCollection.findOne({ _id: new ObjectId(segmentId) });
    } catch (err) {
      return reply.status(400).send({ error: "Invalid segment ID" });
    }

    if (!segment) {
      return reply.status(404).send({ error: "Segment not found" });
    }

    // Get existing label count for versioning
    const existingLabels = await labelsCollection.countDocuments({ segment_id: segmentId });

    // Create label document
    const label: TranslationLabel = {
      segment_id: segmentId,
      labeler_id: String(body.labeler_id || "unknown"),
      labeler_email: String(body.labeler_email || "unknown"),
      label_version: existingLabels + 1,
      adequacy: body.adequacy as TranslationLabel["adequacy"],
      fluency: body.fluency as TranslationLabel["fluency"],
      terminology: body.terminology as TranslationLabel["terminology"],
      risk: body.risk as TranslationLabel["risk"],
      overall: body.overall as TranslationLabel["overall"],
      corrected_text: body.corrected_text ? String(body.corrected_text) : undefined,
      editor_notes: body.editor_notes ? String(body.editor_notes) : undefined,
      created_at: new Date(),
    };

    // Validate required fields
    if (!label.adequacy || !label.fluency || !label.terminology || !label.risk || !label.overall) {
      return reply.status(400).send({ error: "Missing required label fields" });
    }

    await labelsCollection.insertOne(label);

    const newStatus = nextSegmentStatus({
      currentStatus: segment.status,
      overall: label.overall,
      corrected_text: label.corrected_text,
    }) as TranslationSegment["status"];

    await segmentsCollection.updateOne(
      { _id: new ObjectId(segmentId) },
      {
        $set: {
          ...(label.corrected_text ? { translated_text: label.corrected_text } : {}),
          status: newStatus,
          updated_at: new Date(),
        },
      }
    );

    // Upsert approved translation to graph memory for zero-shot learning
    let graphMemoryResult: { success: boolean; error?: string } | undefined;
    if (newStatus === "approved") {
      graphMemoryResult = await upsertTranslationToGraphMemory(
        app,
        segment as TranslationSegment,
        label.corrected_text
      );
    }

    return {
      ok: true,
      label: {
        ...label,
        id: label._id?.toString(),
        _id: undefined,
      },
      new_status: newStatus,
      graph_memory: graphMemoryResult,
    };
  });

  /**
   * Batch import translation segments (for MT pipeline)
   * POST /v1/translations/segments/batch
   */
  app.post("/translations/segments/batch", async (req, reply) => {
    const body = req.body as Record<string, unknown>;
    const segments = (body.segments as Record<string, unknown>[]) || [];
    const orgId = String(body.org_id || "");
    const project = String(body.project || "");

    if (segments.length === 0) {
      return reply.status(400).send({ error: "No segments provided" });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];

      try {
        const normalized = normalizeTranslationSegment({
          ...seg,
          segment_index: seg.segment_index ?? i,
          org_id: orgId,
          project,
        }) as any;
        if (Array.isArray(normalized.errors) && normalized.errors.length > 0) {
          errors.push({ index: i, error: "Missing required fields", details: normalized.errors });
          continue;
        }
        const doc: TranslationSegment = {
          source_text: normalized.source_text,
          translated_text: normalized.translated_text,
          source_lang: normalized.source_lang,
          target_lang: normalized.target_lang,
          document_id: normalized.document_id,
          segment_index: normalized.segment_index,
          status: normalized.status,
          mt_model: normalized.mt_model ?? undefined,
          confidence: normalized.confidence ?? undefined,
          domain: normalized.domain ?? undefined,
          content_type: normalized.content_type ?? undefined,
          url_context: normalized.url_context ?? undefined,
          org_id: normalized.org_id ?? undefined,
          project: normalized.project ?? undefined,
          created_at: new Date(),
          updated_at: new Date(),
        };

        const result = await segmentsCollection.insertOne(doc);
        results.push({
          index: i,
          id: result.insertedId.toString(),
          status: doc.status,
        });
      } catch (err) {
        errors.push({
          index: i,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return {
      ok: true,
      imported: results.length,
      errors: errors.length,
      results,
      errors_detail: errors.length > 0 ? errors : undefined,
    };
  });

  /**
   * Create single translation segment
   * POST /v1/translations/segments
   */
  app.post("/translations/segments", async (req, reply) => {
    const body = req.body as Record<string, unknown>;

    const normalized = normalizeTranslationSegment(body) as any;
    if (Array.isArray(normalized.errors) && normalized.errors.length > 0) {
      return reply.status(400).send({
        error: "Missing required fields: source_text, translated_text, target_lang, document_id",
        details: normalized.errors,
      });
    }
    const doc: TranslationSegment = {
      source_text: normalized.source_text,
      translated_text: normalized.translated_text,
      source_lang: normalized.source_lang,
      target_lang: normalized.target_lang,
      document_id: normalized.document_id,
      segment_index: normalized.segment_index,
      status: normalized.status,
      garden_id: normalized.garden_id ?? undefined,
      mt_model: normalized.mt_model ?? undefined,
      confidence: normalized.confidence ?? undefined,
      domain: normalized.domain ?? undefined,
      content_type: normalized.content_type ?? undefined,
      org_id: normalized.org_id ?? undefined,
      project: normalized.project ?? undefined,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Upsert: update if exists (same document_id + segment_index + target_lang), insert if not
    const filter = {
      document_id: doc.document_id,
      segment_index: doc.segment_index,
      target_lang: doc.target_lang,
    };
    const result = await segmentsCollection.updateOne(
      filter,
      { $set: doc },
      { upsert: true }
    );

    const id = result.upsertedId?.toString() ?? result.upsertedCount > 0 ? "new" : "updated";

    return {
      ok: true,
      id,
      status: doc.status,
      upserted: result.upsertedCount > 0,
      modified: result.modifiedCount > 0,
    };
  });

  /**
   * Export SFT training data (JSONL)
   * GET /v1/translations/export/sft
   */
  app.get("/translations/export/sft", async (req, reply) => {
    const query = req.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = { status: "approved" };

    if (query.project) filter.project = query.project;
    if (query.target_lang) filter.target_lang = query.target_lang;
    if (query.org_id) filter.org_id = query.org_id;

    const includeCorrected = query.include_corrected !== "false";

    const segments = await segmentsCollection.find(filter).toArray();
    const lines: string[] = [];

    for (const seg of segments) {
      // Get corrected text if available
      let targetText = seg.translated_text;

      if (includeCorrected) {
        const labels = await labelsCollection
          .find({
            segment_id: seg._id.toString(),
            corrected_text: { $exists: true, $ne: null },
          })
          .sort({ created_at: -1 })
          .limit(1)
          .toArray();

        if (labels.length > 0 && labels[0].corrected_text) {
          targetText = labels[0].corrected_text;
        }
      }

      lines.push(JSON.stringify(sftRow({
        source_lang: "English",
        target_lang: seg.target_lang,
        source_text: seg.source_text,
        translated_text: seg.translated_text,
        corrected_text: targetText,
      })));
    }

    reply.header("Content-Type", "application/x-ndjson");
    reply.header("Content-Disposition", `attachment; filename="translations_sft_${Date.now()}.jsonl"`);
    return lines.join("\n");
  });

  /**
   * Export manifest with statistics
   * GET /v1/translations/export/manifest
   */
  app.get("/translations/export/manifest", async (req, reply) => {
    const query = req.query as Record<string, string | undefined>;
    const projectFilter: Record<string, unknown> = {};

    if (query.project) projectFilter.project = query.project;
    if (query.org_id) projectFilter.org_id = query.org_id;

    // Aggregate by target language
    const languages = await segmentsCollection
      .aggregate([
        { $match: projectFilter },
        {
          $group: {
            _id: "$target_lang",
            total: { $sum: 1 },
            approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
            in_review: { $sum: { $cond: [{ $eq: ["$status", "in_review"] }, 1, 0] } },
          },
        },
      ])
      .toArray();

    // Get corrections count from labels collection
    // First get all segment IDs for this project/org
    const segmentIds = await segmentsCollection
      .find(projectFilter, { projection: { _id: 1, target_lang: 1 } })
      .toArray();

    const segmentIdStrings = segmentIds.map((s) => s._id.toString());
    const segmentLangMap = new Map(segmentIds.map((s) => [s._id.toString(), s.target_lang]));

    // Count segments with corrections per language
    const correctionsByLang = await labelsCollection
      .aggregate<{ _id: string; count: number }>([
        {
          $match: {
            segment_id: { $in: segmentIdStrings },
            corrected_text: { $exists: true, $nin: [null, ""] },
          },
        },
        {
          $group: {
            _id: "$segment_id",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    // Map corrections to languages
    const correctionsByLanguage: Record<string, number> = {};
    for (const c of correctionsByLang) {
      const lang = segmentLangMap.get(c._id);
      if (lang) {
        correctionsByLanguage[lang] = (correctionsByLanguage[lang] ?? 0) + 1;
      }
    }

    // Get labeler statistics
    const labelers = await labelsCollection
      .aggregate([
        { $match: { segment_id: { $in: segmentIdStrings } } },
        {
          $group: {
            _id: "$labeler_email",
            segments_labeled: { $sum: 1 },
          },
        },
      ])
      .toArray();

    return {
      ...manifestShape({
        project: query.project || "all",
        languages,
        correctionsByLanguage,
        labelers,
      }),
      generated_at: new Date().toISOString(),
    };
  });

  /**
   * Trigger translation for a document
   * POST /v1/documents/:id/translate
   */
  app.post("/documents/:id/translate", async (req, reply) => {
    const documentId = (req.params as { id: string }).id;
    const body = req.body as Record<string, unknown>;

    // Get document from events collection
    const document = await app.mongo.events.findOne({ _id: documentId });

    if (!document) {
      return reply.status(404).send({ error: "Document not found" });
    }

    const plan = translationJobPlan({
      document_id: documentId,
      document_text: String(document.text || ""),
      target_languages: body.target_languages,
      garden_id: body.garden_id,
      project: document.project,
      source_lang: "en",
    }) as any;

    if (plan["ok?"] === false) {
      return reply.status(400).send({ error: String(plan.error ?? "Document has no content to translate") });
    }

    const jobsCollection = app.mongo.db.collection("translation_jobs");
    const jobIds: string[] = [];
    const now = new Date();

    for (const job of plan.jobs ?? []) {
      const result = await jobsCollection.insertOne({ ...job, created_at: now });
      jobIds.push(result.insertedId.toString());
    }

    return {
      ok: true,
      job_id: jobIds[0],
      job_ids: jobIds,
      document_id: documentId,
      target_languages: plan.targetLanguages ?? plan.target_languages,
      status: "queued",
      message: plan.message,
    };
  });

  /**
   * Get next queued translation job
   * GET /v1/translations/jobs/next
   * Used by translation agent to fetch work
   */
  app.get("/translations/jobs/next", async (req, reply) => {
    const jobsCollection = app.mongo.db.collection("translation_jobs");
    const result = await jobsCollection.findOneAndUpdate(
      { status: "queued" },
      {
        $set: {
          status: "processing",
          started_at: new Date(),
          updated_at: new Date(),
        },
        $inc: { attempts: 1 },
      },
      {
        sort: { created_at: 1 },
        returnDocument: "after",
      }
    );
    const job = result;

    if (!job) {
      return { job: null };
    }

    return {
      job: {
        ...job,
        id: job._id.toString(),
        _id: undefined,
      },
    };
  });

  /**
   * Update translation job status
   * POST /v1/translations/jobs/:id/status
   * Used by translation agent to mark jobs processing/complete/failed
   */
  app.post("/translations/jobs/:id/status", async (req, reply) => {
    const jobId = (req.params as { id: string }).id;
    const body = req.body as { status: string; error?: string };

    const plan = jobStatusUpdatePlan(body) as any;
    if (plan["ok?"] === false) {
      return reply.status(400).send({ error: String(plan.error ?? "Invalid status. Must be: processing, complete, or failed") });
    }

    const jobsCollection = app.mongo.db.collection("translation_jobs");
    const update: Record<string, unknown> = {
      status: plan.status,
    };

    if (plan["started?"]) {
      update.started_at = new Date();
    } else if (plan["completed?"]) {
      update.completed_at = new Date();
      if (plan.error) update.error = plan.error;
    }

    const result = await jobsCollection.updateOne(
      { _id: new ObjectId(jobId) },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return reply.status(404).send({ error: "Job not found" });
    }

    return { success: true, job_id: jobId, status: plan.status };
  });

  /**
   * Get translation jobs status
   * GET /v1/translations/jobs
   */
  app.get("/translations/jobs", async (req, reply) => {
    const query = req.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = {};

    if (query.document_id) filter.document_id = query.document_id;
    if (query.status) filter.status = query.status;

    const jobsCollection = app.mongo.db.collection("translation_jobs");
    const jobs = await jobsCollection.find(filter).sort({ created_at: -1 }).limit(50).toArray();

    return {
      jobs: jobs.map((j) => ({
        ...j,
        id: j._id.toString(),
        _id: undefined,
      })),
    };
  });

  /**
   * Get translation examples from graph memory (zero-shot context)
   * GET /v1/translations/examples
   * Used by MT pipeline to get few-shot examples for better translations
   */
  app.get("/translations/examples", async (req, reply) => {
    const query = req.query as Record<string, string | undefined>;
    const sourceText = query.source_text || "";
    const sourceLang = query.source_lang || "en";
    const targetLang = query.target_lang || "";
    const limit = Math.min(10, Math.max(1, Number(query.limit ?? 5)));

    if (!targetLang) {
      return reply.status(400).send({ error: "target_lang is required" });
    }

    const examples = await queryTranslationExamples(
      app,
      sourceText,
      sourceLang,
      targetLang,
      limit
    );

    return {
      source_lang: sourceLang,
      target_lang: targetLang,
      examples,
      count: examples.length,
    };
  });

  /**
   * Get graph memory stats for translations
   * GET /v1/translations/graph-stats
   */
  app.get("/translations/graph-stats", async (req, reply) => {
    const query = req.query as Record<string, string | undefined>;

    const filter: Record<string, unknown> = { kind: "translation_example" };
    if (query.source_lang) filter["data.source_lang"] = query.source_lang;
    if (query.target_lang) filter["data.target_lang"] = query.target_lang;

    const totalNodes = await app.mongo.db.collection("graph_nodes").countDocuments(filter);

    // Group by language pair
    const byLanguagePair = await app.mongo.db
      .collection("graph_nodes")
      .aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              source_lang: "$data.source_lang",
              target_lang: "$data.target_lang",
            },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    return {
      total_translation_nodes: totalNodes,
      by_language_pair: Object.fromEntries(
        byLanguagePair.map((p) => [`${p._id.source_lang}→${p._id.target_lang}`, p.count])
      ),
    };
  });

  // ======================================================================
  // Document-level translation review routes
  // ======================================================================

  /**
   * List translated documents with aggregated segment stats
   * GET /v1/translations/documents
   *
   * Returns unique document+target_lang combinations with segment counts by status.
   */
  app.get("/translations/documents", async (req, reply) => {
    const query = req.query as Record<string, string | undefined>;

    const matchStage: Record<string, unknown> = {};
    if (query.project) matchStage.project = query.project;
    if (query.target_lang) matchStage.target_lang = query.target_lang;
    if (query.source_lang) matchStage.source_lang = query.source_lang;
    if (query.garden_id) matchStage.garden_id = query.garden_id;

    const docs = await segmentsCollection
      .aggregate<{
        _id: { document_id: string; target_lang: string };
        source_lang: string;
        garden_id: string | null;
        project: string | null;
        total_segments: number;
        approved: number;
        pending: number;
        rejected: number;
        in_review: number;
      }>([
        { $match: matchStage },
        {
          $group: {
            _id: { document_id: "$document_id", target_lang: "$target_lang" },
            source_lang: { $first: "$source_lang" },
            garden_id: { $first: "$garden_id" },
            project: { $first: "$project" },
            total_segments: { $sum: 1 },
            approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
            in_review: { $sum: { $cond: [{ $eq: ["$status", "in_review"] }, 1, 0] } },
          },
        },
        { $sort: { "_id.document_id": 1, "_id.target_lang": 1 } },
      ])
      .toArray();

    // Fetch document titles from the events collection
    const documentIds = docs.map((d) => d._id.document_id);
    const eventRows = await app.mongo.events
      .find({ _id: { $in: documentIds } }, { projection: { _id: 1, "extra.title": 1, "extra.visibility": 1 } })
      .toArray();

    const titles = Object.fromEntries(eventRows.map((row) => {
      const extra = (row as Record<string, unknown>).extra as Record<string, unknown> | undefined;
      return [row._id as string, {
        title: String(extra?.title ?? "Untitled"),
        visibility: String(extra?.visibility ?? "internal"),
      }];
    }));

    return documentListShape({ documents: docs, titles });
  });

  /**
   * Get document translation with all segments
   * GET /v1/translations/documents/:documentId/:targetLang
   *
   * Returns source document content + all segments for the language pair.
   */
  app.get("/translations/documents/:documentId/:targetLang", async (req, reply) => {
    const documentId = (req.params as { documentId: string }).documentId;
    const targetLang = (req.params as { targetLang: string }).targetLang;

    // Fetch source document
    const eventRow = await app.mongo.events.findOne({ _id: documentId });
    if (!eventRow) {
      return reply.status(404).send({ error: "Document not found" });
    }
    const extra = (eventRow as Record<string, unknown>).extra as Record<string, unknown> | undefined;
    const document = {
      id: documentId,
      title: String(extra?.title ?? "Untitled"),
      content: String(extra?.content ?? extra?.text ?? ""),
      source_lang: String(extra?.language ?? "en"),
      visibility: String(extra?.visibility ?? "internal"),
      source_path: extra?.sourcePath ?? extra?.source_path ?? null,
    };

    // Fetch segments for this document+target_lang, deduplicating by segment_index
    // If multiple translations exist for same segment_index, take the most recent
    const segments = await segmentsCollection
      .aggregate([
        { $match: { document_id: documentId, target_lang: targetLang } },
        { $sort: { segment_index: 1, created_at: -1 } },
        {
          $group: {
            _id: "$segment_index",
            doc: { $first: "$$ROOT" },
          },
        },
        { $replaceRoot: { newRoot: "$doc" } },
        { $sort: { segment_index: 1 } },
      ])
      .toArray();

    // Fetch labels for each segment
    const segmentIds = segments.map((s) => s._id.toString());
    const allLabels = await labelsCollection
      .find({ segment_id: { $in: segmentIds } })
      .sort({ created_at: -1 })
      .toArray();

    return documentTranslationShape({ document, segments, labels: allLabels });
  });

  /**
   * Document-level review action
   * POST /v1/translations/documents/:documentId/:targetLang/review
   *
   * Applies a review verdict to all segments, with optional per-segment overrides.
   */
  app.post("/translations/documents/:documentId/:targetLang/review", async (req, reply) => {
    const documentId = (req.params as { documentId: string }).documentId;
    const targetLang = (req.params as { targetLang: string }).targetLang;
    const body = req.body as {
      overall: "approve" | "needs_edit" | "reject";
      editor_notes?: string;
      labeler_email?: string;
      labeler_id?: string;
      segment_overrides?: Record<string, {
        overall: "approve" | "needs_edit" | "reject";
        corrected_text?: string;
        editor_notes?: string;
      }>;
    };

    if (!body.overall || !["approve", "needs_edit", "reject"].includes(body.overall)) {
      return reply.status(400).send({ error: "overall must be approve, needs_edit, or reject" });
    }

    const overrides = body.segment_overrides ?? {};
    const segments = await segmentsCollection
      .find({ document_id: documentId, target_lang: targetLang })
      .sort({ segment_index: 1 })
      .toArray();

    if (segments.length === 0) {
      return reply.status(404).send({ error: "No segments found for this document+language pair" });
    }

    const labelerEmail = body.labeler_email ?? "unknown";
    const labelerId = body.labeler_id ?? "unknown";
    let appliedCount = 0;

    for (const segment of segments) {
      const segId = segment._id.toString();
      const segIndex = String(segment.segment_index);
      const override = overrides[segIndex] ?? overrides[segId];
      const effectiveOverall = override?.overall ?? body.overall;
      const labelPlan = documentReviewLabelPlan({
        segment_id: segId,
        labeler_id: labelerId,
        labeler_email: labelerEmail,
        overall: effectiveOverall,
        corrected_text: override?.corrected_text,
        editor_notes: override?.editor_notes ?? body.editor_notes,
      }) as any;
      const newStatus = labelPlan.next_status as TranslationSegment["status"];

      // Create label record
      const label: TranslationLabel = {
        segment_id: labelPlan.segment_id,
        labeler_id: labelPlan.labeler_id,
        labeler_email: labelPlan.labeler_email,
        label_version: (await labelsCollection.countDocuments({ segment_id: segId })) + 1,
        adequacy: labelPlan.adequacy,
        fluency: labelPlan.fluency,
        terminology: labelPlan.terminology,
        risk: labelPlan.risk,
        overall: labelPlan.overall,
        corrected_text: labelPlan.corrected_text,
        editor_notes: labelPlan.editor_notes,
        created_at: new Date(),
      };

      await labelsCollection.insertOne(label);

      // Update segment status
      await segmentsCollection.updateOne(
        { _id: segment._id },
        {
          $set: {
            ...(override?.corrected_text ? { translated_text: override.corrected_text } : {}),
            status: newStatus,
            updated_at: new Date(),
          },
        }
      );

      // Upsert to graph memory on approval
      if (newStatus === "approved") {
        await upsertTranslationToGraphMemory(
          app,
          segment as TranslationSegment,
          override?.corrected_text
        );
      }

      appliedCount++;
    }

    return {
      ok: true,
      document_id: documentId,
      target_lang: targetLang,
      segments_reviewed: appliedCount,
      overall: body.overall,
      overrides_applied: Object.keys(overrides).length,
    };
  });

  // ======================================================================
  // Translation batch routes
  // ======================================================================

  const batchesCollection = app.mongo.db.collection("translation_batches");
  await batchesCollection.createIndex({ garden_id: 1, target_lang: 1, status: 1 });
  await batchesCollection.createIndex({ status: 1, created_at: 1 });

  /**
   * Create a translation batch
   * POST /v1/translations/batches
   */
  app.post("/translations/batches", async (req, reply) => {
    const body = req.body as {
      garden_id: string;
      target_lang: string;
      source_lang?: string;
      project?: string;
      document_ids: string[];
    };

    if (!body.garden_id || !body.target_lang || !body.document_ids?.length) {
      return reply.status(400).send({ error: "garden_id, target_lang, and document_ids are required" });
    }

    const batch = {
      batch_id: crypto.randomUUID(),
      garden_id: body.garden_id,
      target_lang: body.target_lang,
      source_lang: body.source_lang ?? "en",
      project: body.project ?? "devel",
      status: "queued",
      document_ids: body.document_ids,
      completed_documents: [] as string[],
      failed_documents: [] as { document_id: string; error: string }[],
      created_at: new Date(),
    };

    const result = await batchesCollection.insertOne(batch);

    return {
      ok: true,
      batch_id: batch.batch_id,
      id: result.insertedId.toString(),
      status: batch.status,
      document_ids: batch.document_ids,
    };
  });

  /**
   * Get next queued translation batch
   * GET /v1/translations/batches/next
   */
  app.get("/translations/batches/next", async (req, reply) => {
    const batch = await batchesCollection.findOne(
      { status: "queued" },
      { sort: { created_at: 1 } }
    );

    if (!batch) {
      return { batch: null };
    }

    return {
      batch: {
        ...batch,
        id: batch._id.toString(),
        _id: undefined,
      },
    };
  });

  /**
   * List translation batches
   * GET /v1/translations/batches
   */
  app.get("/translations/batches", async (req, reply) => {
    const query = req.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = {};
    if (query.garden_id) filter.garden_id = query.garden_id;
    if (query.target_lang) filter.target_lang = query.target_lang;
    if (query.status) filter.status = query.status;

    const batches = await batchesCollection.find(filter).sort({ created_at: -1 }).limit(50).toArray();

    return {
      batches: batches.map((b) => ({
        ...b,
        id: b._id.toString(),
        _id: undefined,
      })),
    };
  });

  /**
   * Get single translation batch
   * GET /v1/translations/batches/:id
   */
  app.get("/translations/batches/:id", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    let batch;
    try {
      batch = await batchesCollection.findOne({ _id: new ObjectId(id) });
    } catch {
      batch = await batchesCollection.findOne({ batch_id: id });
    }

    if (!batch) {
      return reply.status(404).send({ error: "Batch not found" });
    }

    return {
      ...batch,
      id: batch._id.toString(),
      _id: undefined,
    };
  });

  /**
   * Update translation batch status
   * POST /v1/translations/batches/:id/status
   */
  app.post("/translations/batches/:id/status", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = req.body as {
      status: "processing" | "complete" | "partial" | "failed";
      completed_document?: string;
      failed_document?: { document_id: string; error: string };
      agent_session_id?: string;
      agent_conversation_id?: string;
      agent_run_id?: string;
      error?: string;
    };

    if (!["processing", "complete", "partial", "failed"].includes(body.status)) {
      return reply.status(400).send({ error: "Invalid status" });
    }

    const update: Record<string, unknown> = { status: body.status };

    if (body.status === "processing") {
      update.started_at = new Date();
      if (body.agent_session_id) update.agent_session_id = body.agent_session_id;
      if (body.agent_conversation_id) update.agent_conversation_id = body.agent_conversation_id;
      if (body.agent_run_id) update.agent_run_id = body.agent_run_id;
    } else if (body.status === "complete" || body.status === "partial" || body.status === "failed") {
      update.completed_at = new Date();
      if (body.error) update.error = body.error;
    }

    // Track completed/failed documents
    const pushOps: Record<string, unknown> = {};
    if (body.completed_document) {
      pushOps.completed_documents = body.completed_document;
    }
    if (body.failed_document) {
      pushOps.failed_documents = body.failed_document;
    }

    const updateDoc: Record<string, unknown> = { $set: update };
    if (Object.keys(pushOps).length > 0) {
      updateDoc.$push = pushOps;
    }

    let filter: Record<string, unknown>;
    try {
      filter = { _id: new ObjectId(id) };
    } catch {
      filter = { batch_id: id };
    }

    const result = await batchesCollection.updateOne(filter, updateDoc);

    if (result.matchedCount === 0) {
      return reply.status(404).send({ error: "Batch not found" });
    }

    return { ok: true, batch_id: id, status: body.status };
  });
};

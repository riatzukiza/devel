/**
 * Labels API — Native OpenPlanner implementation replacing Python km_labels.
 *
 * Stores label records in MongoDB collection `km_labels`.
 * API shape matches the legacy Python /api/km-labels/ contract.
 */

import type { FastifyInstance } from "fastify";
import { ObjectId } from "mongodb";

// ── Types ────────────────────────────────────────────────────────────

interface ContextChunk {
  id: string;
  text: string;
  source: string;
  source_url?: string;
  source_title?: string;
  position?: number;
  score?: number;
}

interface LabelDimensions {
  correctness: string;
  groundedness: string;
  completeness?: string;
  tone?: string;
  risk: string;
  pii_leakage: string;
  translation_quality?: string;
  overall: string;
}

interface KmLabel {
  example_id: string;
  tenant_id: string;
  domain_id?: string;
  question: string;
  question_lang: string;
  answer: string;
  answer_lang?: string;
  answer_translated?: string;
  answer_target_lang?: string;
  context: ContextChunk[];
  labels: LabelDimensions;
  gold_answer?: string;
  editor_notes?: string;
  model?: string;
  labeler_id?: string;
  labeled_at?: string;
  created_at: string;
  updated_at: string;
}

interface CreateKmLabelPayload {
  tenant_id: string;
  domain_id?: string;
  question: string;
  question_lang?: string;
  answer: string;
  answer_lang?: string;
  answer_translated?: string;
  answer_target_lang?: string;
  context?: ContextChunk[];
  labels: LabelDimensions;
  gold_answer?: string;
  editor_notes?: string;
  model?: string;
}

interface UpdateKmLabelPayload {
  labels?: LabelDimensions;
  gold_answer?: string;
  editor_notes?: string;
  labeler_id?: string;
}

function labelsCollection(app: FastifyInstance) {
  return app.mongo.db.collection("km_labels");
}

function tenantsCollection(app: FastifyInstance) {
  return app.mongo.db.collection("tenants");
}

function normalizeReactionEmoji(value: unknown): string {
  return String(value ?? "").trim();
}

function qualityFromReactionEmoji(emoji: string): "good" | "bad" | null {
  if (["✅", "☑️", "✔️", "✔"].includes(emoji)) return "good";
  if (["❌", "✖️", "✖", "❎"].includes(emoji)) return "bad";
  return null;
}

function labelId(value: unknown): string {
  return String(value ?? "").trim();
}

async function updateVectorQualityLabel(app: FastifyInstance, recordId: string, quality: "good" | "bad" | null): Promise<number> {
  if (!quality) return 0;
  const update = { $set: { quality_label: quality, updatedAt: new Date() } };
  let modified = 0;
  const collections = [app.mongo.hotVectors, app.mongo.compactVectors];

  const partitions = await app.mongo.vectorPartitions.find({}).project({ collectionName: 1 }).toArray();
  for (const partition of partitions) {
    if (typeof partition.collectionName === "string" && partition.collectionName.trim()) {
      collections.push(app.mongo.db.collection(partition.collectionName) as any);
    }
  }

  for (const collection of collections) {
    const result = await collection.updateMany({ parent_id: recordId } as any, update as any);
    modified += result.modifiedCount ?? 0;
  }
  return modified;
}

// ── Routes ───────────────────────────────────────────────────────────

export async function labelsRoutes(app: FastifyInstance) {
  // Weak claims/quality labels for existing OpenPlanner records.
  // Explicit meanings:
  //   ✅ -> good output
  //   ❌ -> bad output
  app.post<{ Params: { record_id: string } }>("/records/:record_id/reaction", async (req, reply) => {
    const recordId = labelId(req.params.record_id);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const emoji = normalizeReactionEmoji(body.emoji ?? body.reaction);
    if (!recordId) return reply.code(400).send({ error: "record_id is required" });
    if (!emoji) return reply.code(400).send({ error: "emoji is required" });

    const quality = qualityFromReactionEmoji(emoji);
    const now = new Date().toISOString();
    const reactionLabel = `emoji:${emoji}`;
    const labelEntry = {
      label: reactionLabel,
      quality,
      emoji,
      source: String(body.source ?? "chat-reaction"),
      labeler_id: String(body.labeler_id ?? body.user_id ?? "unknown"),
      at: now,
    };

    const setFields: Record<string, unknown> = {
      "extra.openplanner_labels.updated_at": now,
      "extra.openplanner_labels.claim_system": "weak-reaction-v1",
    };
    if (quality) {
      setFields["extra.openplanner_labels.quality"] = quality;
      setFields["extra.openplanner_labels.explicit_meaning"] = quality === "good" ? "good output" : "bad output";
    }

    const result = await app.mongo.events.updateOne(
      { _id: recordId },
      {
        $set: setFields,
        $addToSet: {
          "extra.openplanner_labels.reaction_emojis": emoji,
          "extra.openplanner_labels.labels": reactionLabel,
        },
        $push: { "extra.openplanner_labels.history": labelEntry },
      },
    );
    const vectorModified = await updateVectorQualityLabel(app, recordId, quality);

    // Also create/update graph-native label node and has_label edge
    try {
      const tenantId = String(body.tenant_id ?? "default").trim();
      const labelSlug = emoji ? Array.from(emoji).map(c => c.codePointAt(0)?.toString(16)).join("-") : "empty";
      const labelId = `label:${tenantId}:${labelSlug}`;
      const labelDoc = {
        _id: labelId,
        label_id: labelId,
        label: reactionLabel,
        emoji: emoji || null,
        description: `Reaction emoji: ${emoji}`,
        color: quality === "good" ? "#22c55e" : quality === "bad" ? "#ef4444" : null,
        tenant_id: tenantId,
        project: null,
        embedding_model: null,
        embedding_dimensions: 0,
        embedding: null,
        created_by: String(body.labeler_id ?? body.user_id ?? "unknown"),
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };

      const { createdAt: _ca2, ...labelDocWithoutCreatedAt2 } = labelDoc;
      await app.mongo.graphLabelNodes.updateOne(
        { label_id: labelId },
        { $set: labelDocWithoutCreatedAt2, $setOnInsert: { createdAt: new Date(now) } },
        { upsert: true }
      );

      const edgeId = `has_label:${recordId}:${labelId}`;
      await app.mongo.graphEdges.updateOne(
        { _id: edgeId },
        {
          $set: {
            _id: edgeId,
            source_node_id: recordId,
            target_node_id: labelId,
            edge_kind: "has_label",
            layer: null,
            project: null,
            source: "reaction",
            data: {
              applied_at: now,
              confidence: 1.0,
              emoji,
              quality,
            },
            updated_at: new Date(now),
            createdAt: new Date(now),
            updatedAt: new Date(now),
          }
        },
        { upsert: true }
      );
    } catch (err) {
      // Don't fail the reaction if graph-native label creation fails
      req.log.warn({ err, recordId, emoji }, "failed to create graph-native label for reaction");
    }

    return {
      ok: true,
      record_id: recordId,
      emoji,
      quality,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      vector_modified: vectorModified,
      label: labelEntry,
    };
  });

  // Migrate existing extra.openplanner_labels to graph-native label nodes
  app.post("/migrate-to-graph-labels", async (req) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const tenantId = String(body.tenant_id ?? "default").trim();
    const limit = Math.max(1, Math.min(10000, Number(body.limit ?? 1000)));
    const dryRun = body.dry_run === true;

    // Find events with legacy labels
    const filter: Record<string, unknown> = {
      "extra.openplanner_labels.labels": { $exists: true, $ne: [] }
    };

    const events = await app.mongo.events
      .find(filter)
      .project({ _id: 1, extra: 1, project: 1 })
      .limit(limit)
      .toArray();

    const migratedLabels = new Set<string>();
    const migratedEdges = 0;
    let edgesCreated = 0;
    const now = new Date();

    for (const event of events) {
      const recordId = String(event._id);
      const emojis: string[] = event.extra?.openplanner_labels?.reaction_emojis ?? [];

      for (const emoji of emojis) {
        const labelSlug = emoji ? Array.from(emoji).map(c => c.codePointAt(0)?.toString(16)).join("-") : "empty";
        const labelId = `label:${tenantId}:${labelSlug}`;
        const reactionLabel = `emoji:${emoji}`;

        if (!migratedLabels.has(labelId)) {
          migratedLabels.add(labelId);

          const quality = qualityFromReactionEmoji(emoji);

          const labelDoc = {
            _id: labelId,
            label_id: labelId,
            label: reactionLabel,
            emoji: emoji || null,
            description: `Reaction emoji: ${emoji}`,
            color: quality === "good" ? "#22c55e" : quality === "bad" ? "#ef4444" : null,
            tenant_id: tenantId,
            project: event.project ?? null,
            embedding_model: null,
            embedding_dimensions: 0,
            embedding: null,
            created_by: "migration",
            createdAt: now,
            updatedAt: now,
          };

          if (!dryRun) {
            const { createdAt: _ca, ...labelDocWithoutCreatedAt } = labelDoc;
            await app.mongo.graphLabelNodes.updateOne(
              { label_id: labelId },
              { $set: labelDocWithoutCreatedAt, $setOnInsert: { createdAt: now } },
              { upsert: true }
            );
          }
        }

        const edgeId = `has_label:${recordId}:${labelId}`;
        if (!dryRun) {
          await app.mongo.graphEdges.updateOne(
            { _id: edgeId },
            {
              $set: {
                _id: edgeId,
                source_node_id: recordId,
                target_node_id: labelId,
                edge_kind: "has_label",
                layer: null,
                project: event.project ?? null,
                source: "migration",
                data: {
                  applied_at: now.toISOString(),
                  confidence: 1.0,
                  migrated_from: "extra.openplanner_labels",
                },
                updated_at: now,
                createdAt: now,
                updatedAt: now,
              }
            },
            { upsert: true }
          );
        }
        edgesCreated++;
      }
    }

    return {
      ok: true,
      dry_run: dryRun,
      events_scanned: events.length,
      labels_created: migratedLabels.size,
      edges_created: edgesCreated,
    };
  });

  app.post("/records/lookup", async (req) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const ids = Array.isArray(body.ids) ? body.ids.map(labelId).filter(Boolean).slice(0, 500) : [];
    if (ids.length === 0) return { ok: true, labels: {} };

    const rows = await app.mongo.events
      .find({ _id: { $in: ids } })
      .project({ id: 1, extra: 1 })
      .toArray();
    const labels = Object.fromEntries(rows.map((row: any) => {
      const openplannerLabels = row?.extra?.openplanner_labels ?? {};
      return [String(row.id ?? row._id), openplannerLabels];
    }));
    return { ok: true, labels };
  });

  // List labels for a tenant
  app.get<{ Params: { tenant_id: string } }>("/:tenant_id", async (req, reply) => {
    const { tenant_id } = req.params;
    const { domain_id, overall, language, limit = "100", offset = "0" } = req.query as any;

    const filter: any = { tenant_id };
    if (domain_id) filter.domain_id = domain_id;
    if (overall) filter["labels.overall"] = overall;
    if (language) filter.question_lang = language;

    const col = labelsCollection(app);
    const total = await col.countDocuments(filter);
    const rows = await col
      .find(filter)
      .sort({ created_at: -1 })
      .skip(Number(offset))
      .limit(Math.min(Number(limit), 1000))
      .toArray();

    const labels: KmLabel[] = rows.map((r) => ({
      example_id: r.example_id,
      tenant_id: r.tenant_id,
      domain_id: r.domain_id,
      question: r.question,
      question_lang: r.question_lang ?? "en",
      answer: r.answer ?? "",
      answer_lang: r.answer_lang,
      answer_translated: r.answer_translated,
      answer_target_lang: r.answer_target_lang,
      context: r.context ?? [],
      labels: r.labels,
      gold_answer: r.gold_answer,
      editor_notes: r.editor_notes,
      model: r.model,
      labeler_id: r.labeler_id,
      labeled_at: r.labeled_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    return { labels, total, offset: Number(offset), limit: Number(limit) };
  });

  // Create a label
  app.post("/", async (req, reply) => {
    const payload = req.body as CreateKmLabelPayload;
    const now = new Date().toISOString();
    const example_id = new ObjectId().toString();

    // Verify tenant exists
    const tenant = await tenantsCollection(app).findOne({ tenant_id: payload.tenant_id });
    if (!tenant) {
      return reply.code(400).send({ detail: "Tenant not found" });
    }

    const doc = {
      example_id,
      tenant_id: payload.tenant_id,
      domain_id: payload.domain_id,
      question: payload.question,
      question_lang: payload.question_lang ?? "en",
      answer: payload.answer,
      answer_lang: payload.answer_lang,
      answer_translated: payload.answer_translated,
      answer_target_lang: payload.answer_target_lang,
      context: payload.context ?? [],
      labels: payload.labels,
      gold_answer: payload.gold_answer,
      editor_notes: payload.editor_notes,
      model: payload.model,
      created_at: now,
      updated_at: now,
    };

    await labelsCollection(app).insertOne(doc);

    return reply.code(201).send({
      example_id,
      tenant_id: payload.tenant_id,
      domain_id: payload.domain_id,
      question: payload.question,
      question_lang: payload.question_lang ?? "en",
      answer: payload.answer,
      answer_lang: payload.answer_lang,
      answer_translated: payload.answer_translated,
      answer_target_lang: payload.answer_target_lang,
      context: payload.context ?? [],
      labels: payload.labels,
      gold_answer: payload.gold_answer,
      editor_notes: payload.editor_notes,
      model: payload.model,
      created_at: now,
      updated_at: now,
    });
  });

  // Get a specific label
  app.get<{ Params: { tenant_id: string; example_id: string } }>(
    "/:tenant_id/:example_id",
    async (req, reply) => {
      const { tenant_id, example_id } = req.params;
      const row = await labelsCollection(app).findOne({ tenant_id, example_id });
      if (!row) return reply.code(404).send({ detail: "Label not found" });

      return {
        example_id: row.example_id,
        tenant_id: row.tenant_id,
        domain_id: row.domain_id,
        question: row.question,
        question_lang: row.question_lang ?? "en",
        answer: row.answer ?? "",
        answer_lang: row.answer_lang,
        answer_translated: row.answer_translated,
        answer_target_lang: row.answer_target_lang,
        context: row.context ?? [],
        labels: row.labels,
        gold_answer: row.gold_answer,
        editor_notes: row.editor_notes,
        model: row.model,
        labeler_id: row.labeler_id,
        labeled_at: row.labeled_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    },
  );

  // Update a label (partial)
  app.patch<{ Params: { tenant_id: string; example_id: string } }>(
    "/:tenant_id/:example_id",
    async (req, reply) => {
      const { tenant_id, example_id } = req.params;
      const payload = req.body as UpdateKmLabelPayload;
      const now = new Date().toISOString();

      const updates: any = { updated_at: now };
      if (payload.labels !== undefined) updates.labels = payload.labels;
      if (payload.gold_answer !== undefined) updates.gold_answer = payload.gold_answer;
      if (payload.editor_notes !== undefined) updates.editor_notes = payload.editor_notes;
      if (payload.labeler_id !== undefined) {
        updates.labeler_id = payload.labeler_id;
        updates.labeled_at = now;
      }

      const result = await labelsCollection(app).findOneAndUpdate(
        { tenant_id, example_id },
        { $set: updates },
        { returnDocument: "after" },
      );

      if (!result) return reply.code(404).send({ detail: "Label not found" });

      return {
        example_id: result.example_id,
        tenant_id: result.tenant_id,
        domain_id: result.domain_id,
        question: result.question,
        question_lang: result.question_lang ?? "en",
        answer: result.answer ?? "",
        answer_lang: result.answer_lang,
        answer_translated: result.answer_translated,
        answer_target_lang: result.answer_target_lang,
        context: result.context ?? [],
        labels: result.labels,
        gold_answer: result.gold_answer,
        editor_notes: result.editor_notes,
        model: result.model,
        labeler_id: result.labeler_id,
        labeled_at: result.labeled_at,
        created_at: result.created_at,
        updated_at: result.updated_at,
      };
    },
  );

  // Delete a label
  app.delete<{ Params: { tenant_id: string; example_id: string } }>(
    "/:tenant_id/:example_id",
    async (req, reply) => {
      const { tenant_id, example_id } = req.params;
      const result = await labelsCollection(app).deleteOne({ tenant_id, example_id });
      if (result.deletedCount === 0) return reply.code(404).send({ detail: "Label not found" });
      return reply.code(204).send();
    },
  );
}

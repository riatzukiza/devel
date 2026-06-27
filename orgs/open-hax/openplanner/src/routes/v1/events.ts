import type { FastifyPluginAsync } from "fastify";
import { upsertEvent, upsertGraphEdges, upsertGraphNodeEmbeddings } from "../../lib/mongodb.js";
import { prepareIndexDocument } from "../../lib/indexing.js";
import { indexTextInMongoVectors } from "../../lib/mongo-vectors.js";
import { counterInc } from "../../lib/metrics.js";
import type { EventIngestRequest, EventEnvelopeV1 } from "../../lib/types.js";
import { splitSentences, deduplicateByHash, computeTextHash } from "../../lib/sentence-split.js";
import { formatEmbeddingPassageText } from "../../lib/embedding-text.js";
import { eventMigrationState, OPENPLANNER_SCHEMA_TARGETS } from "../../lib/schema-versions.js";

function norm(v: any): string | null {
  if (v === undefined || v === null) return null;
  return String(v);
}

function validateEvent(ev: EventEnvelopeV1) {
  if (!ev || ev.schema !== "openplanner.event.v1") throw new Error("event.schema must be openplanner.event.v1");
  if (!ev.id) throw new Error("event.id required");
  if (!ev.ts) throw new Error("event.ts required (ISO)");
  if (!ev.source) throw new Error("event.source required");
  if (!ev.kind) throw new Error("event.kind required");
}

function hasIndexableEventText(ev: EventEnvelopeV1): boolean {
  return typeof ev.text === "string" && ev.text.trim().length > 0;
}

function labelSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 96) || "label";
}

function graphLabelId(tenantId: string, label: string): string {
  return `label:${tenantId}:${labelSlug(label)}`;
}

function eventLabels(extra: Record<string, unknown>): string[] {
  const labels = (extra.openplanner_labels as any)?.labels;
  if (!Array.isArray(labels)) return [];
  return [...new Set(labels.map((label) => String(label ?? "").trim()).filter(Boolean))];
}

export function shouldIndexEventHotVectors(ev: EventEnvelopeV1): boolean {
  if (!hasIndexableEventText(ev)) return false;

  // graph.node receives dedicated node-embedding materialization below, and
  // graph.edge text is mostly structural glue (e.g. mentions_web URLs). Running
  // both through the generic hot vector path just burns response time and can
  // hold /v1/events open long enough for upstream header timeouts.
  if (ev.kind === "graph.node" || ev.kind === "graph.edge") return false;

  return true;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const eventRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: EventIngestRequest }>("/events", async (req, reply) => {
    const body = req.body;
    if (!body || !Array.isArray(body.events)) return reply.status(400).send({ error: "expected { events: [...] }" });

    const ids: string[] = [];
    const acceptedEvents: EventEnvelopeV1[] = [];
    const eventVectorTasks: Array<Promise<void>> = [];
    const projectedGraphEdges: Array<{
      source_node_id: string;
      target_node_id: string;
      edge_kind: string;
      layer?: string | null;
      project?: string | null;
      source?: string | null;
      data?: Record<string, unknown> | null;
      updated_at?: Date;
    }> = [];
    const graphNodeEmbeddingInputs = new Map<string, {
      node_id: string;
      source_event_id: string;
      project?: string | null;
      text: string;
      chunk_count: number;
    }>();

    const derivedGraphNodeOps: any[] = [];
    const graphLabelNodeOps: any[] = [];
    const derivedEventIds = new Set<string>();
    const queuedGraphLabelIds = new Set<string>();
    const now = new Date();

    const queueDerivedGraphNodeEvent = (params: {
      id: string;
      ts: Date;
      project?: string | null;
      nodeId: string;
      nodeKind: string;
      label: string;
      preview: string;
      extra?: Record<string, unknown>;
    }): void => {
      if (derivedEventIds.has(params.id)) return;
      derivedEventIds.add(params.id);

      derivedGraphNodeOps.push({
        updateOne: {
          filter: { _id: params.id },
          update: {
            $set: {
              id: params.id,
              ts: params.ts,
              source: "openplanner-derive",
              kind: "graph.node",
              project: params.project ?? null,
              session: null,
              message: params.label,
              role: null,
              author: null,
              model: null,
              tags: null,
              text: "",
              attachments: null,
              extra: {
                node_id: params.nodeId,
                node_kind: params.nodeKind,
                label: params.label,
                preview: params.preview,
                content_hash: computeTextHash(params.preview),
                lake: params.project ?? undefined,
                ...(params.extra ?? {}),
              },
              schema_version: OPENPLANNER_SCHEMA_TARGETS.event,
              migration_state: eventMigrationState(now),
              updatedAt: now,
            },
            $setOnInsert: {
              createdAt: now,
            },
          },
          upsert: true,
        },
      });
    };

    const queueNodeEmbedding = (params: {
      nodeId: string;
      sourceEventId: string;
      project?: string | null;
      text: string;
      chunkCount?: number;
    }): void => {
      const normalized = formatEmbeddingPassageText(params.text);
      if (!normalized) return;
      graphNodeEmbeddingInputs.set(params.nodeId, {
        node_id: params.nodeId,
        source_event_id: params.sourceEventId,
        project: params.project ?? null,
        text: normalized,
        chunk_count: params.chunkCount ?? 1,
      });
    };

    for (const ev of body.events) {
      validateEvent(ev);
      acceptedEvents.push(ev);

      const sr = ev.source_ref ?? {};
      const meta = ev.meta ?? {};
      const extra = (ev.extra as Record<string, unknown> | undefined) ?? {};
      const role = norm((meta as any).role);
      const author = norm((meta as any).author);
      const model = norm((meta as any).model);
      const tags = (meta as any).tags;
      const project = norm((sr as any).project);

      // MongoDB storage
      await upsertEvent(app.mongo.events, {
        id: ev.id,
        ts: new Date(ev.ts),
        source: ev.source,
        kind: ev.kind,
        project,
        session: norm((sr as any).session),
        message: norm((sr as any).message),
        role,
        author,
        model,
        tags: tags ?? null,
        text: norm(ev.text ?? ""),
        attachments: ev.attachments ?? null,
        extra: ev.extra ?? null,
        schema_version: ev.schema_version,
        migration_state: ev.migration_state as any,
      });

      ids.push(ev.id);

      const labels = eventLabels(extra);
      for (const label of labels) {
        const tenantId = String((extra.openplanner_labels as any)?.tenant_id ?? (extra as any).tenant_id ?? "default").trim() || "default";
        const labelId = graphLabelId(tenantId, label);
        if (!queuedGraphLabelIds.has(labelId)) {
          queuedGraphLabelIds.add(labelId);
          graphLabelNodeOps.push({
            updateOne: {
              filter: { label_id: labelId },
              update: {
                $set: {
                  _id: labelId,
                  label_id: labelId,
                  label,
                  emoji: null,
                  description: `Auto-derived event label: ${label}`,
                  color: null,
                  tenant_id: tenantId,
                  project,
                  embedding_model: null,
                  embedding_dimensions: 0,
                  embedding: null,
                  created_by: "event-ingest",
                  updatedAt: now,
                },
                $setOnInsert: { createdAt: now },
              },
              upsert: true,
            },
          });
        }

        projectedGraphEdges.push({
          source_node_id: ev.id,
          target_node_id: labelId,
          edge_kind: "has_label",
          layer: null,
          project,
          source: ev.source,
          data: {
            applied_at: new Date(ev.ts).toISOString(),
            confidence: 1,
            label,
            claim_system: (extra.openplanner_labels as any)?.claim_system ?? null,
            source_event_id: ev.id,
          },
          updated_at: new Date(ev.ts),
        });
      }

      if (ev.kind === "graph.edge") {
        const sourceNodeId = norm(extra.source_node_id)?.trim() ?? "";
        const targetNodeId = norm(extra.target_node_id)?.trim() ?? "";
        const edgeKind = (norm(extra.edge_type) ?? norm(extra.edge_kind) ?? "").trim();
        if (sourceNodeId && targetNodeId && edgeKind && sourceNodeId !== targetNodeId) {
          projectedGraphEdges.push({
            source_node_id: sourceNodeId,
            target_node_id: targetNodeId,
            edge_kind: edgeKind,
            layer: norm(extra.layer),
            project,
            source: ev.source,
            data: extra,
            updated_at: new Date(ev.ts),
          });
        }
      }

      if (ev.kind === "graph.node") {
        const nodeId = norm(extra.node_id)?.trim() ?? norm((sr as any).message)?.trim() ?? "";
        const preview = norm(extra.preview)?.trim() ?? "";
        const directText = norm(ev.text)?.trim() ?? "";
        const body = directText || preview;
        if (nodeId && body) {
          const label = String(extra.label ?? extra.path ?? (sr as any).message ?? nodeId).trim() || nodeId;
          const prepared = prepareIndexDocument({
            parentId: nodeId,
            text: body,
            extra,
            forceChunking: false,
            targetChunkTokens: 32_000,
            targetChunkChars: 180_000,
            overlapChars: 1_000,
          });

          if (prepared.chunkCount <= 1) {
            queueNodeEmbedding({
              nodeId,
              sourceEventId: ev.id,
              project,
              text: prepared.normalizedText,
              chunkCount: 1,
            });
          } else {
            for (const chunk of prepared.chunks) {
              const chunkLabel = `${label} [chunk ${chunk.chunkIndex + 1}/${chunk.chunkCount}]`;
              const chunkPreview = chunk.text.slice(0, 800);
              const chunkEventId = `graph.node:doc_chunk:${chunk.id}`;

              queueDerivedGraphNodeEvent({
                id: chunkEventId,
                ts: new Date(ev.ts),
                project,
                nodeId: chunk.id,
                nodeKind: "doc_chunk",
                label: chunkLabel,
                preview: chunkPreview,
                extra: {
                  parent_node_id: nodeId,
                  chunk_index: chunk.chunkIndex,
                  chunk_count: chunk.chunkCount,
                },
              });

              projectedGraphEdges.push({
                source_node_id: nodeId,
                target_node_id: chunk.id,
                edge_kind: "contains_chunk",
                layer: "derived",
                project,
                source: "openplanner-derive",
                data: {
                  parent_node_id: nodeId,
                  chunk_index: chunk.chunkIndex,
                  chunk_count: chunk.chunkCount,
                },
                updated_at: new Date(ev.ts),
              });

              queueNodeEmbedding({
                nodeId: chunk.id,
                sourceEventId: ev.id,
                project,
                text: chunk.text,
                chunkCount: chunk.chunkCount,
              });
            }
          }

          const sentenceHashesInDoc = new Set<string>();
          const sentenceNodeIdsQueued = new Set<string>();

          const sentenceSources = prepared.chunkCount <= 1
            ? [{ text: prepared.normalizedText }]
            : prepared.chunks.map((chunk) => ({ text: chunk.text }));

          for (const sourceChunk of sentenceSources) {
            const sentences = splitSentences(sourceChunk.text);
            const uniqueSentences = deduplicateByHash(sentences);

            for (const [hash, sent] of uniqueSentences) {
              if (sent.tokens <= 3) continue;
              if (sentenceHashesInDoc.has(hash)) continue;
              sentenceHashesInDoc.add(hash);

              const sentenceNodeId = `${project ?? "devel"}:sentence:${hash}`;
              const sentenceEventId = `graph.node:sentence:${sentenceNodeId}`;

              if (!sentenceNodeIdsQueued.has(sentenceNodeId)) {
                sentenceNodeIdsQueued.add(sentenceNodeId);
                queueDerivedGraphNodeEvent({
                  id: sentenceEventId,
                  ts: new Date(ev.ts),
                  project,
                  nodeId: sentenceNodeId,
                  nodeKind: "sentence",
                  label: sent.sentence.length > 120 ? sent.sentence.slice(0, 117) + "..." : sent.sentence,
                  preview: sent.sentence,
                  extra: {
                    derived_from_node_id: nodeId,
                  },
                });
              }

              projectedGraphEdges.push({
                source_node_id: nodeId,
                target_node_id: sentenceNodeId,
                edge_kind: "contains_sentence",
                layer: "derived",
                project,
                source: "openplanner-derive",
                data: {
                  sentence_hash: hash,
                },
                updated_at: new Date(ev.ts),
              });

              queueNodeEmbedding({
                nodeId: sentenceNodeId,
                sourceEventId: ev.id,
                project,
                text: sent.sentence,
                chunkCount: 1,
              });
            }
          }
        }
      }

      // Auto-materialize arbitrary event kinds as graph nodes so the graph
      // export and graph-weaver can see them without requiring every producer
      // to emit `kind: "graph.node"`. We preserve the original kind in
      // `extra.node_kind` and use the event id as the node id.
      if (ev.kind !== "graph.node" && ev.kind !== "graph.edge" && hasIndexableEventText(ev)) {
        const nodeId = ev.id;
        const preview = norm(ev.text)?.trim() ?? "";
        const derivedEventId = `graph.node:derive:${ev.id}`;
        const label = String(
          extra.label ?? (sr as any).message ?? (preview.length > 80 ? `${preview.slice(0, 77)}...` : preview) ?? nodeId,
        ).trim() || nodeId;

        queueDerivedGraphNodeEvent({
          id: derivedEventId,
          ts: new Date(ev.ts),
          project,
          nodeId,
          nodeKind: ev.kind,
          label,
          preview,
          extra: {
            lake: project ?? undefined,
            entity_key: ev.id,
            source_event_id: ev.id,
            source_kind: ev.kind,
            ...extra,
          },
        });

        queueNodeEmbedding({
          nodeId,
          sourceEventId: ev.id,
          project,
          text: preview,
          chunkCount: 1,
        });
      }

      if (shouldIndexEventHotVectors(ev)) {
        eventVectorTasks.push((async () => {
          try {
            const embeddingScope = {
              source: ev.source,
              kind: ev.kind,
              project: project ?? undefined,
            };

            const embeddingRuntime = (app as any).embeddingRuntime;
            const embeddingFunction = embeddingRuntime.hot.getBackgroundEmbeddingFunction(embeddingScope);
            const embeddingModel = embeddingRuntime.hot.getModel(embeddingScope);
            await withTimeout(indexTextInMongoVectors({
              mongo: app.mongo,
              tier: "hot",
              parentId: ev.id,
              text: ev.text!,
              extra,
              metadata: {
                ts: ev.ts,
                source: ev.source,
                kind: ev.kind,
                project: (sr as any).project,
                session: (sr as any).session,
                author: author ?? "",
                role: role ?? "",
                model: model ?? "",
                embedding_model: embeddingModel ?? "",
                search_tier: "hot",
                visibility: extra.visibility ?? "internal",
                quality_label: ((extra.openplanner_labels as any)?.quality ?? ""),
                labels,
                title: extra.title ?? (sr as any).message ?? ev.id,
              },
              embeddingFunction,
            }), 30_000, `event vector index ${ev.id}`);
          } catch (err) {
            app.log.warn({ err, eventId: ev.id }, "Failed to index event into MongoDB vectors; preserving base event without embeddings");
          }
        })());
      }
    }

    if (derivedGraphNodeOps.length > 0) {
      const batchSize = 1000;
      for (let i = 0; i < derivedGraphNodeOps.length; i += batchSize) {
        await app.mongo.events.bulkWrite(derivedGraphNodeOps.slice(i, i + batchSize), { ordered: false });
      }
    }

    if (graphLabelNodeOps.length > 0) {
      const batchSize = 1000;
      for (let i = 0; i < graphLabelNodeOps.length; i += batchSize) {
        await app.mongo.graphLabelNodes.bulkWrite(graphLabelNodeOps.slice(i, i + batchSize), { ordered: false });
      }
    }

    if (projectedGraphEdges.length > 0) {
      await upsertGraphEdges(app.mongo.graphEdges, projectedGraphEdges);
    }

    if (graphNodeEmbeddingInputs.size > 0) {
      void (async () => {
        try {
          const embeddingRuntime = (app as any).embeddingRuntime;
          type GraphNodeEmbeddingInput = {
            node_id: string;
            source_event_id: string;
            project?: string | null;
            text: string;
            chunk_count: number;
          };
          const groupedByModel = new Map<string, GraphNodeEmbeddingInput[]>();

          for (const input of graphNodeEmbeddingInputs.values()) {
            const model = embeddingRuntime.hot.getModel({
              source: "graph-event",
              kind: "graph.node",
              project: input.project ?? undefined,
            });
            const rows = groupedByModel.get(model) ?? [];
            rows.push(input);
            groupedByModel.set(model, rows);
          }

          for (const [model, rows] of groupedByModel) {
            const embeddingFunction = embeddingRuntime.hot.getBackgroundEmbeddingFunctionForModel(model);
            const nodeIds = rows.map((row) => row.node_id);
            const existing = await app.mongo.graphNodeEmbeddings
              .find({ node_id: { $in: nodeIds }, embedding_model: model })
              .project({ node_id: 1, text: 1 })
              .toArray();
            const existingTextById = new Map(existing.map((row: any) => [String(row.node_id), String(row.text ?? "")] as const));

            const toEmbed = rows.filter((row) => {
              const previous = existingTextById.get(row.node_id);
              return !previous || previous !== row.text;
            });

            if (toEmbed.length === 0) continue;

            const embeddings = await withTimeout(
              embeddingFunction.generate(toEmbed.map((row) => row.text)) as Promise<number[][]>,
              30_000,
              `graph node embedding batch ${model}`,
            );

            const storedRows = toEmbed.flatMap((row, idx) => {
              const embedding = embeddings[idx];
              if (!Array.isArray(embedding) || embedding.length === 0) return [];
              return [{
                node_id: row.node_id,
                source_event_id: row.source_event_id,
                project: row.project ?? null,
                embedding_model: model,
                embedding_dimensions: embedding.length,
                embedding,
                chunk_count: row.chunk_count ?? 1,
                text: row.text,
                updated_at: new Date(),
              }];
            });

            if (storedRows.length > 0) {
              await upsertGraphNodeEmbeddings(app.mongo.graphNodeEmbeddings, storedRows);
            }
          }
        } catch (err) {
          app.log.warn({ err, count: graphNodeEmbeddingInputs.size }, "Failed to materialize graph node embeddings during event ingest");
        }
      })();
    }

    if (eventVectorTasks.length > 0) {
      void Promise.allSettled(eventVectorTasks).then((results) => {
        const rejected = results.filter((result) => result.status === "rejected").length;
        if (rejected > 0) {
          app.log.warn({ rejected, queued: eventVectorTasks.length }, "Detached event vector indexing completed with rejected tasks");
        }
      });
    }
    
    // Track metrics
    counterInc("openplanner_events_ingested_total", { backend: "mongodb" }, ids.length);
    for (const ev of body.events) {
      counterInc("openplanner_events_by_source", { source: ev.source, backend: "mongodb" });
      counterInc("openplanner_events_by_kind", { kind: ev.kind, backend: "mongodb" });
    }

    const kafkaPublish = app.kafkaEvents.publishRawEvents(acceptedEvents, { requestId: req.id });
    if (process.env.OPENPLANNER_KAFKA_PUBLISH_MODE === "await") {
      await kafkaPublish;
    } else {
      void kafkaPublish.catch((err) => {
        app.log.warn({ err, count: acceptedEvents.length }, "Detached kafka raw event publish rejected");
      });
    }
    
    return {
      ok: true,
      count: ids.length,
      ids,
      projectedGraphEdges: projectedGraphEdges.length,
      ftsEnabled: true,
      storageBackend: "mongodb",
      indexed: true,
      indexing: eventVectorTasks.length > 0 || graphNodeEmbeddingInputs.size > 0 ? "queued" : "skipped",
      queuedEventVectors: eventVectorTasks.length,
      queuedGraphNodeEmbeddings: graphNodeEmbeddingInputs.size,
    };
  });
};

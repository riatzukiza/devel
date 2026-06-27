import type { FastifyPluginAsync } from "fastify";
import { JobQueue, type Job } from "../../lib/jobs.js";
import { paths } from "../../lib/paths.js";
import { upsertGraphEdges, upsertGraphNodeEmbeddings } from "../../lib/mongodb.js";

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

export const jobRoutes: FastifyPluginAsync = async (app) => {
  if (!(app as any).jobs) {
    const cfg = (app as any).openplannerConfig;
    const p = paths(cfg.dataDir);
    const jq = new JobQueue(p.jobsPath);
    await jq.init();
    (app as any).jobs = jq;
  }

  const jobs = (): JobQueue => (app as any).jobs as JobQueue;

  const runBackfillEmbeddingsJob = (job: Job): void => {
    const body = (job.input as any) ?? {};

    void (async () => {
      try {
        await jobs().update(job.id, { status: "running" });
        const { indexTextInMongoVectors } = await import("../../lib/mongo-vectors.js");
        const embeddingRuntime = (app as any).embeddingRuntime;

        const concurrency = Math.max(1, Math.min(32, Number(body.concurrency ?? 4)));
        const mongoBatchSize = Math.max(10, Math.min(2000, Number(body.mongoBatchSize ?? 200)));
        const limit = Number.isFinite(Number(body.limit)) ? Math.max(1, Number(body.limit)) : null;

        const filter = { text: { $type: "string", $ne: "" } } as const;
        const total = await app.mongo.events.countDocuments(filter);

        await jobs().update(job.id, {
          output: { phase: "streaming", completed: 0, total, indexed: 0, skipped: 0, failed: 0 },
        });

        const cursor = app.mongo.events
          .find(filter, {
            projection: {
              _id: 1,
              id: 1,
              ts: 1,
              source: 1,
              kind: 1,
              project: 1,
              session: 1,
              author: 1,
              role: 1,
              model: 1,
              message: 1,
              text: 1,
              extra: 1,
            },
            batchSize: mongoBatchSize,
          })
          .sort({ _id: 1 });

        let scanned = 0;
        let indexed = 0;
        let skipped = 0;
        let failed = 0;

        const processBatch = async (batch: any[]): Promise<void> => {
          if (batch.length === 0) return;

          const ids = batch
            .map((row) => String(row.id ?? "").trim())
            .filter((id) => id.length > 0);
          if (ids.length === 0) {
            scanned += batch.length;
            return;
          }

          // Skip items that already have hot vector chunks.
          const existingParents = await app.mongo.hotVectors
            .find({ parent_id: { $in: ids } }, { projection: { parent_id: 1 } })
            .toArray();
          const existingSet = new Set(existingParents.map((row: any) => String(row.parent_id)));
          const toIndex = batch.filter((row) => {
            const id = String(row.id ?? "").trim();
            return id.length > 0 && !existingSet.has(id);
          });

          const alreadyIndexed = batch.length - toIndex.length;
          skipped += alreadyIndexed;
          scanned += alreadyIndexed;

          const pending = new Set<Promise<void>>();
          const enqueue = async (fn: () => Promise<void>): Promise<void> => {
            while (pending.size >= concurrency) {
              await Promise.race(pending);
            }
            const p = fn();
            pending.add(p);
            void p.finally(() => pending.delete(p));
          };

          for (const row of toIndex) {
            await enqueue(async () => {
              const id = String(row.id ?? "").trim();
              const text = String(row.text ?? "");
              const extra = row.extra as Record<string, unknown> | undefined;

              const embeddingScope = {
                source: row.source,
                kind: row.kind,
                project: row.project ?? undefined,
              };

              try {
                const embeddingFunction = embeddingRuntime.hot.getBackgroundEmbeddingFunction(embeddingScope);
                const embeddingModel = embeddingRuntime.hot.getModel(embeddingScope);
                await indexTextInMongoVectors({
                  mongo: app.mongo,
                  tier: "hot",
                  parentId: id,
                  text,
                  extra,
                  metadata: {
                    ts: (row.ts instanceof Date ? row.ts : new Date(row.ts)).toISOString(),
                    source: row.source,
                    kind: row.kind,
                    project: row.project ?? "",
                    session: row.session ?? "",
                    author: row.author ?? "",
                    role: row.role ?? "",
                    model: row.model ?? "",
                    embedding_model: embeddingModel ?? "",
                    search_tier: "hot",
                    visibility: (extra as any)?.visibility ?? "internal",
                    title: (extra as any)?.title ?? row.message ?? id,
                  },
                  embeddingFunction,
                });
                indexed += 1;
              } catch (_err) {
                failed += 1;
              } finally {
                scanned += 1;
              }
            });
          }

          await Promise.all(pending);
        };

        let buffer: any[] = [];
        for await (const row of cursor) {
          buffer.push(row);
          if (buffer.length >= mongoBatchSize) {
            await processBatch(buffer);
            buffer = [];

            if (scanned % 200 === 0 || scanned === total) {
              await jobs().update(job.id, {
                output: { phase: "streaming", completed: scanned, total, indexed, skipped, failed },
              });
            }

            if (limit !== null && scanned >= limit) break;
          }
        }

        if (buffer.length > 0 && (limit === null || scanned < limit)) {
          await processBatch(buffer);
        }

        await jobs().update(job.id, {
          status: "done",
          output: { completed: scanned, total, indexed, skipped, failed },
        });
      } catch (err: any) {
        await jobs().update(job.id, { status: "error", error: err?.message ?? String(err) });
      }
    })();
  };

  const runBackfillGraphNodeEmbeddingsJob = (job: Job): void => {
    void (async () => {
      try {
        await jobs().update(job.id, { status: "running" });
        const embeddingRuntime = (app as any).embeddingRuntime;
        const embedFn = embeddingRuntime?.hot?.getEmbeddingFunctionForModel?.("qwen3-embedding:0.6b");

        if (!embedFn) {
          throw new Error("embedding runtime not available");
        }

        const model = "qwen3-embedding:0.6b";
        const dims = 1024;
        const concurrency = 8;
        const batchSize = 1;
        const mongoBatch = 200;
        const maxChunkChars = 12000;

        const total = await app.mongo.events.countDocuments({
          kind: "graph.node",
          $or: [
            { text: { $type: "string", $ne: "" } },
            { "extra.preview": { $type: "string", $ne: "" } },
          ],
        });

        await jobs().update(job.id, {
          output: { phase: "streaming", completed: 0, total, chunked: 0 },
        });

        const normalizeExistingNodeId = (nodeId: string): string => nodeId.replace(/#chunk:\d+$/, "");
        const existingNodeIds = new Set<string>(
          (await app.mongo.graphNodeEmbeddings.distinct("node_id")).map((nodeId) => normalizeExistingNodeId(String(nodeId))),
        );

        const cursor = app.mongo.events
          .find(
            {
              kind: "graph.node",
              $or: [
                { text: { $type: "string", $ne: "" } },
                { "extra.preview": { $type: "string", $ne: "" } },
              ],
            },
            {
              projection: { _id: 1, message: 1, text: 1, project: 1, source: 1, extra: 1 },
              batchSize: mongoBatch,
            },
          )
          .sort({ _id: 1 });

        let completed = 0;
        let stored = 0;
        let failed = 0;
        let chunkedTotal = 0;
        let buffer: Array<{
          node_id: string;
          source_event_id: string;
          project: string | null;
          chunk_index: number;
          chunk_count: number;
          text: string;
          embedding: number[];
        }> = [];
        let pending: Promise<void>[] = [];

        const flush = async (): Promise<void> => {
          if (buffer.length === 0) return;
          const rows = buffer.splice(0, buffer.length);
          await upsertGraphNodeEmbeddings(app.mongo.graphNodeEmbeddings, rows.map((row) => ({
            node_id: row.node_id,
            source_event_id: row.source_event_id,
            project: row.project,
            embedding_model: model,
            embedding_dimensions: dims,
            embedding: row.embedding,
            chunk_index: row.chunk_index,
            chunk_count: row.chunk_count,
            text: row.text,
            updated_at: new Date(),
          })));
          stored += rows.length;
        };

        const chunkText = (text: string, maxChars: number): string[] => {
          if (text.length <= maxChars) return [text];
          const chunks: string[] = [];
          const overlap = Math.min(500, Math.floor(maxChars * 0.05));
          let start = 0;
          while (start < text.length) {
            let end = start + maxChars;
            if (end < text.length) {
              const lastBreak = text.lastIndexOf("\n", end);
              if (lastBreak > start + maxChars * 0.5) end = lastBreak;
            }
            chunks.push(text.slice(start, end).trim());
            start = end - overlap;
            if (start >= text.length) break;
          }
          return chunks.filter((chunk) => chunk.length > 0);
        };

        for await (const event of cursor) {
          const nodeId = (event.extra as any)?.node_id ?? event.message ?? event._id;
          if (!nodeId) {
            completed++;
            continue;
          }

          const text = String(event.text || (event.extra as any)?.preview || "");
          if (!text.trim()) {
            completed++;
            continue;
          }

          if (existingNodeIds.has(String(nodeId))) {
            completed++;
            continue;
          }

          const chunks = chunkText(text, maxChunkChars);
          if (chunks.length > 1) chunkedTotal++;

          const chunkPromises = chunks.map((chunkText_, chunkIndex) => {
            const chunkNodeId = chunks.length === 1
              ? String(nodeId)
              : `${nodeId}#chunk:${String(chunkIndex).padStart(4, "0")}`;

            const embedTimeoutMs = 30_000;
            const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
              new Promise<T>((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error("embed timeout")), ms);
                promise
                  .then((value) => {
                    clearTimeout(timer);
                    resolve(value);
                  })
                  .catch((error) => {
                    clearTimeout(timer);
                    reject(error);
                  });
              });

            return withTimeout(embedFn.generate([chunkText_]), embedTimeoutMs)
              .then(async (result: unknown) => {
                const [embedding] = result as [number[]];
                if (!Array.isArray(embedding) || embedding.length === 0) {
                  failed++;
                  return;
                }
                buffer.push({
                  node_id: chunkNodeId,
                  source_event_id: String(event._id),
                  project: event.project ?? null,
                  chunk_index: chunkIndex,
                  chunk_count: chunks.length,
                  text: chunkText_,
                  embedding,
                });
                if (buffer.length >= batchSize) await flush();
              })
              .catch(() => {
                failed++;
              });
          });

          const worker = Promise.all(chunkPromises).then(() => {});
          pending.push(worker);
          if (pending.length >= concurrency) {
            await Promise.all(pending.splice(0, pending.length));
          }

          completed++;
          if (completed % 100 === 0 || completed === total) {
            console.log(`[backfill] completed=${completed} stored=${stored} failed=${failed} chunked=${chunkedTotal} buffer=${buffer.length} total=${total}`);
            await jobs().update(job.id, {
              output: { phase: "embedding", completed, total, stored, failed, chunked: chunkedTotal },
            });
          }
        }

        if (pending.length > 0) await Promise.all(pending);
        await flush();

        await jobs().update(job.id, {
          status: "done",
          output: { completed, total, stored, failed, chunked: chunkedTotal },
        });
      } catch (err: any) {
        await jobs().update(job.id, {
          status: "error",
          error: err?.message ?? String(err),
        });
      }
    })();
  };

  const runBackfillGraphEdgesJob = (job: Job): void => {
    void (async () => {
      try {
        await jobs().update(job.id, { status: "running" });

        const total = await app.mongo.events.countDocuments({ kind: "graph.edge" });
        const mongoBatch = 1000;
        const writeBatch = 1000;

        await jobs().update(job.id, {
          output: { phase: "streaming", completed: 0, total, stored: 0, failed: 0 },
        });

        const cursor = app.mongo.events
          .find(
            { kind: "graph.edge" },
            {
              projection: { _id: 1, ts: 1, project: 1, source: 1, extra: 1 },
              batchSize: mongoBatch,
            },
          )
          .sort({ _id: 1 });

        let completed = 0;
        let stored = 0;
        let failed = 0;
        let buffer: Array<{
          source_node_id: string;
          target_node_id: string;
          edge_kind: string;
          layer?: string | null;
          project?: string | null;
          source?: string | null;
          data?: Record<string, unknown> | null;
          updated_at?: Date;
        }> = [];

        const flush = async (): Promise<void> => {
          if (buffer.length === 0) return;
          const rows = buffer.splice(0, buffer.length);
          await upsertGraphEdges(app.mongo.graphEdges, rows);
          stored += rows.length;
        };

        for await (const event of cursor) {
          const extra = (event.extra ?? {}) as Record<string, unknown>;
          const sourceNodeId = typeof extra.source_node_id === "string" ? extra.source_node_id.trim() : "";
          const targetNodeId = typeof extra.target_node_id === "string" ? extra.target_node_id.trim() : "";
          const edgeKindRaw = typeof extra.edge_type === "string"
            ? extra.edge_type
            : (typeof extra.edge_kind === "string" ? extra.edge_kind : "");
          const edgeKind = edgeKindRaw.trim();

          if (!sourceNodeId || !targetNodeId || !edgeKind || sourceNodeId === targetNodeId) {
            failed += 1;
            completed += 1;
            if (completed % 1000 === 0 || completed === total) {
              await jobs().update(job.id, {
                output: { phase: "streaming", completed, total, stored, failed },
              });
            }
            continue;
          }

          buffer.push({
            source_node_id: sourceNodeId,
            target_node_id: targetNodeId,
            edge_kind: edgeKind,
            layer: typeof extra.layer === "string" ? extra.layer : null,
            project: event.project ?? null,
            source: event.source ?? null,
            data: extra,
            updated_at: event.ts instanceof Date ? event.ts : new Date(),
          });

          if (buffer.length >= writeBatch) {
            await flush();
          }

          completed += 1;
          if (completed % 1000 === 0 || completed === total) {
            console.log(`[graph-edges-backfill] completed=${completed} stored=${stored} failed=${failed} total=${total}`);
            await jobs().update(job.id, {
              output: { phase: "streaming", completed, total, stored, failed },
            });
          }
        }

        await flush();

        await jobs().update(job.id, {
          status: "done",
          output: { completed, total, stored, failed },
        });
      } catch (err: any) {
        await jobs().update(job.id, {
          status: "error",
          error: err?.message ?? String(err),
        });
      }
    })();
  };

  const runBackfillGraphLabelsJob = (job: Job): void => {
    const body = (job.input as any) ?? {};

    void (async () => {
      try {
        await jobs().update(job.id, { status: "running" });

        const mongoBatch = Math.max(100, Math.min(5000, Number(body.mongoBatch ?? 1000)));
        const writeBatch = Math.max(100, Math.min(5000, Number(body.writeBatch ?? 1000)));
        const limit = Number.isFinite(Number(body.limit)) ? Math.max(1, Number(body.limit)) : null;
        const filter = { "extra.openplanner_labels.labels": { $exists: true, $ne: [] } };
        const total = await app.mongo.events.countDocuments(filter);

        await jobs().update(job.id, {
          output: { phase: "streaming", completed: 0, total, labels: 0, edges: 0, failed: 0 },
        });

        const cursor = app.mongo.events
          .find(filter, {
            projection: { _id: 1, id: 1, ts: 1, project: 1, source: 1, extra: 1 },
            batchSize: mongoBatch,
          })
          .sort({ _id: 1 });

        let completed = 0;
        let labels = 0;
        let edges = 0;
        let failed = 0;
        const queuedLabelIds = new Set<string>();
        let labelOps: any[] = [];
        let edgeRows: Array<{
          source_node_id: string;
          target_node_id: string;
          edge_kind: string;
          layer?: string | null;
          project?: string | null;
          source?: string | null;
          data?: Record<string, unknown> | null;
          updated_at?: Date;
        }> = [];

        const flush = async (): Promise<void> => {
          if (labelOps.length > 0) {
            const rows = labelOps.splice(0, labelOps.length);
            await app.mongo.graphLabelNodes.bulkWrite(rows, { ordered: false });
            labels += rows.length;
          }
          if (edgeRows.length > 0) {
            const rows = edgeRows.splice(0, edgeRows.length);
            await upsertGraphEdges(app.mongo.graphEdges, rows);
            edges += rows.length;
          }
        };

        for await (const event of cursor) {
          try {
            const extra = (event.extra ?? {}) as Record<string, unknown>;
            const eventId = String(event.id ?? event._id ?? "").trim();
            const eventDate = event.ts instanceof Date ? event.ts : new Date(event.ts ?? Date.now());
            const tenantId = String((extra.openplanner_labels as any)?.tenant_id ?? (extra as any).tenant_id ?? "default").trim() || "default";

            if (!eventId) throw new Error("event id missing");

            for (const label of eventLabels(extra)) {
              const labelId = graphLabelId(tenantId, label);
              if (!queuedLabelIds.has(labelId)) {
                queuedLabelIds.add(labelId);
                labelOps.push({
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
                        project: event.project ?? null,
                        embedding_model: null,
                        embedding_dimensions: 0,
                        embedding: null,
                        created_by: "backfill.graph-labels",
                        updatedAt: new Date(),
                      },
                      $setOnInsert: { createdAt: new Date() },
                    },
                    upsert: true,
                  },
                });
              }

              edgeRows.push({
                source_node_id: eventId,
                target_node_id: labelId,
                edge_kind: "has_label",
                layer: null,
                project: event.project ?? null,
                source: event.source ?? null,
                data: {
                  applied_at: eventDate.toISOString(),
                  confidence: 1,
                  label,
                  claim_system: (extra.openplanner_labels as any)?.claim_system ?? null,
                  source_event_id: eventId,
                },
                updated_at: eventDate,
              });
            }

            if (labelOps.length + edgeRows.length >= writeBatch) await flush();
          } catch (_err) {
            failed += 1;
          }

          completed += 1;
          if (completed % 1000 === 0 || completed === total || (limit !== null && completed >= limit)) {
            console.log(`[graph-labels-backfill] completed=${completed} labels=${labels} edges=${edges} failed=${failed} total=${total}`);
            await jobs().update(job.id, {
              output: { phase: "streaming", completed, total, labels, edges, failed },
            });
          }
          if (limit !== null && completed >= limit) break;
        }

        await flush();

        await jobs().update(job.id, {
          status: "done",
          output: { completed, total, labels, edges, failed },
        });
      } catch (err: any) {
        await jobs().update(job.id, {
          status: "error",
          error: err?.message ?? String(err),
        });
      }
    })();
  };

  const isRecoverableJobKind = (kind: string): boolean =>
    kind === "backfill.embeddings"
      || kind === "backfill.graph-node-embeddings"
      || kind === "backfill.graph-edges"
      || kind === "backfill.graph-labels";

  const startRecoverableJob = (job: Job): boolean => {
    if (job.kind === "backfill.embeddings") {
      runBackfillEmbeddingsJob(job);
      return true;
    }
    if (job.kind === "backfill.graph-node-embeddings") {
      runBackfillGraphNodeEmbeddingsJob(job);
      return true;
    }
    if (job.kind === "backfill.graph-edges") {
      runBackfillGraphEdgesJob(job);
      return true;
    }
    if (job.kind === "backfill.graph-labels") {
      runBackfillGraphLabelsJob(job);
      return true;
    }
    return false;
  };

  const recoverJobsAfterRestart = async (): Promise<void> => {
    const activeJobs = jobs().list().filter((job) => job.status === "queued" || job.status === "running");
    if (activeJobs.length === 0) return;

    const latestRecoverableByKind = new Map<string, Job>();
    for (const job of activeJobs) {
      if (!isRecoverableJobKind(job.kind)) continue;
      latestRecoverableByKind.set(job.kind, job);
    }

    for (const job of activeJobs) {
      const latestRecoverable = latestRecoverableByKind.get(job.kind);
      if (latestRecoverable?.id === job.id) {
        const updated = await jobs().update(job.id, {
          status: "queued",
          output: {
            ...(job.output ?? {}),
            recovery: "resuming after process restart",
            resumed_at: new Date().toISOString(),
          },
          error: undefined,
        });
        if (updated) {
          console.log(`[jobs] resuming ${updated.kind} ${updated.id} after restart`);
          startRecoverableJob(updated);
        }
        continue;
      }

      const reason = latestRecoverable
        ? "Job interrupted by process restart; newer job for the same kind was resumed."
        : "Job interrupted by process restart; auto-resume is not implemented for this job kind.";
      await jobs().update(job.id, {
        status: "canceled",
        error: reason,
      });
    }
  };

  await recoverJobsAfterRestart();

  app.get("/jobs", async () => ({ ok: true, jobs: (app as any).jobs.list() }));

  app.get("/jobs/:id", async (req, reply) => {
    const { id } = req.params as any;
    const job = (app as any).jobs.get(id);
    if (!job) return reply.status(404).send({ error: "job not found" });
    return { ok: true, job };
  });

  // Import ChatGPT conversations
  app.post("/jobs/import/chatgpt", async (req) => {
    const body = (req.body as any) ?? {};
    const job = await (app as any).jobs.create("import.chatgpt", body);

    // Run async worker
    (async () => {
      try {
        await (app as any).jobs.update(job.id, { status: "running" });
        const { importChatGPTZipToSink } = await import("../../lib/importers/chatgpt.js");
        
        const filePath = body.filePath;
        if (!filePath) throw new Error("filePath required in job input");

        const result = await importChatGPTZipToSink(filePath, async (events) => {
          const response = await app.inject({
            method: "POST",
            url: "/v1/events",
            headers: {
              authorization: `Bearer ${(app as any).openplannerConfig.apiKey}`,
              "content-type": "application/json",
            },
            payload: JSON.stringify({ events }),
          });
          if (response.statusCode >= 400) {
            throw new Error(`failed to ingest imported events into mongodb backend: ${response.body}`);
          }
        }, async (count) => {
          await (app as any).jobs.update(job.id, { output: { processed: count } });
        });

        await (app as any).jobs.update(job.id, { status: "done", output: result });
      } catch (err: any) {
        console.error("Job failed:", err);
        await (app as any).jobs.update(job.id, { status: "error", error: err.message });
      }
    })();

    return { ok: true, job, note: "Job started in background" };
  });

  app.post("/jobs/import/opencode", async (req) => {
    const body = (req.body as any) ?? {};
    const job = await (app as any).jobs.create("import.opencode", body);
    return { ok: true, job, note: "Queued. Worker not implemented in skeleton." };
  });

  app.post("/jobs/compile/pack", async (req) => {
    const body = (req.body as any) ?? {};
    const job = await (app as any).jobs.create("compile.pack", body);
    return { ok: true, job, note: "Queued. Worker not implemented in skeleton." };
  });

  // Semantic compaction job
  app.post("/jobs/compact/semantic", async (req) => {
    const body = (req.body as any) ?? {};
    const job = await (app as any).jobs.create("compact.semantic", body);

    (async () => {
      try {
        await (app as any).jobs.update(job.id, { status: "running" });
        const { runSemanticCompactionMongo } = await import("../../lib/semantic-compaction.js");
        const cfg = (app as any).openplannerConfig;
        const output = await runSemanticCompactionMongo(app.mongo, cfg, body, (app as any).embeddingRuntime);
        await (app as any).jobs.update(job.id, { status: "done", output });
      } catch (err: any) {
        await (app as any).jobs.update(job.id, { status: "error", error: err?.message ?? String(err) });
      }
    })();

    return { ok: true, job, note: "Semantic compaction job started in background" };
  });

  // Full backfill job - rebuilds all embeddings
  app.post("/jobs/backfill/embeddings", async (req) => {
    const body = (req.body as any) ?? {};
    const job = await jobs().create("backfill.embeddings", body);
    runBackfillEmbeddingsJob(job);

    return { ok: true, job, note: "Embedding backfill job started in background" };
  });

  // Graph node embeddings backfill — populates graph_node_embeddings for all graph.node events
  app.post("/jobs/backfill/graph-node-embeddings", async (req) => {
    const body = (req.body as any) ?? {};
    const job = await jobs().create("backfill.graph-node-embeddings", body);
    runBackfillGraphNodeEmbeddingsJob(job);

    return { ok: true, job, note: "Graph node embeddings backfill started in background" };
  });

  // Structural graph edge backfill — populates graph_edges from historical graph.edge events
  app.post("/jobs/backfill/graph-edges", async (req) => {
    const body = (req.body as any) ?? {};
    const job = await jobs().create("backfill.graph-edges", body);
    runBackfillGraphEdgesJob(job);

    return { ok: true, job, note: "Graph edge backfill started in background" };
  });

  // Graph label backfill — materializes extra.openplanner_labels.labels into graph label nodes and has_label edges
  app.post("/jobs/backfill/graph-labels", async (req) => {
    const body = (req.body as any) ?? {};
    const job = await jobs().create("backfill.graph-labels", body);
    runBackfillGraphLabelsJob(job);

    return { ok: true, job, note: "Graph label backfill started in background" };
  });
};

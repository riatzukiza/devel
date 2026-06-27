import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { Db, MongoClient } from "mongodb";
import type { SemanticGraphBuilderConfig } from "./config.js";

// ── Types ───────────────────────────────────────────────────────

export interface ExportManifest {
  run_id: string;
  node_count: number;
  dimensions: number;
  embedding_model: string;
  created_at: string;
}

export interface ExportResult {
  runId: string;
  outputDir: string;
  manifest: ExportManifest;
}

interface EmbeddingRow {
  node_id: string;
  embedding: number[];
  embedding_dimensions: number;
  embedding_model: string | null;
}

// ── L2 normalization ────────────────────────────────────────────

/**
 * L2-normalize a vector in-place and return it.
 * If the magnitude is zero (or numerically near-zero), leaves the vector
 * as all-zeros (degenerate node that will never be a top-k neighbor).
 */
export function l2Normalize(vec: Float32Array): Float32Array {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) {
    sumSq += vec[i] * vec[i];
  }
  const mag = Math.sqrt(sumSq);
  if (mag > 1e-12) {
    for (let i = 0; i < vec.length; i++) {
      vec[i] /= mag;
    }
  }
  return vec;
}

// ── MongoDB query ──────────────────────────────────────────────

const COLLECTION_NAME = "graph_node_embeddings";

/**
 * Stream all embeddings matching the configured model & dimensions.
 * Projects only node_id + embedding to keep throughput high.
 */
async function* fetchEmbeddings(
  db: Db,
  config: SemanticGraphBuilderConfig,
): AsyncGenerator<EmbeddingRow, void, void> {
  const collection = db.collection(COLLECTION_NAME);

  const filter: Record<string, unknown> = {
    embedding_dimensions: config.embeddingDimensions,
  };

  // If the user specified a model, filter on it; otherwise include all
  if (config.embeddingModel) {
    filter.embedding_model = config.embeddingModel;
  }

  const projection = { node_id: 1, embedding: 1, embedding_dimensions: 1, embedding_model: 1, _id: 0 };

  const cursor = collection.find(filter, { projection }).batchSize(2000);

  for await (const doc of cursor) {
    yield doc as unknown as EmbeddingRow;
  }
}

// ── Binary writers ─────────────────────────────────────────────

/**
 * Write the contiguous float32 embedding slab.
 * Layout: row-major [n, dims], little-endian f32.
 */
async function writeEmbeddingSlab(
  filePath: string,
  rows: Float32Array[],
): Promise<void> {
  const n = rows.length;
  if (n === 0) {
    await writeFile(filePath, Buffer.alloc(0));
    return;
  }

  const dims = rows[0].length;
  const buf = Buffer.alloc(n * dims * 4);
  let offset = 0;
  for (const row of rows) {
    for (let d = 0; d < dims; d++) {
      buf.writeFloatLE(row[d], offset);
      offset += 4;
    }
  }
  await writeFile(filePath, buf);
}

/**
 * Write the node-id mapping as a binary file.
 * Layout: for each node, a uint32 big-endian length prefix followed by
 * the UTF-8 bytes of the node_id string.
 *
 * This keeps the format self-describing and avoids a fixed-width assumption
 * on node_id length.
 */
async function writeIdsBin(
  filePath: string,
  ids: string[],
): Promise<void> {
  const parts: Buffer[] = [];
  for (const id of ids) {
    const idBuf = Buffer.from(id, "utf-8");
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(idBuf.length, 0);
    parts.push(lenBuf, idBuf);
  }
  await writeFile(filePath, Buffer.concat(parts));
}

// ── Main export step ───────────────────────────────────────────

/**
 * S2: Export normalized embedding slabs.
 *
 * Reads all graph_node_embeddings matching the configured model/dims,
 * L2-normalizes each vector, and writes:
 *   - embeddings.f32  (contiguous float32 slab, [n, dims], row-major)
 *   - ids.bin         (node_id mapping, length-prefixed UTF-8 strings)
 *   - manifest.json   (run metadata)
 *
 * Returns the run metadata.
 */
export async function exportEmbeddings(
  client: MongoClient,
  config: SemanticGraphBuilderConfig,
): Promise<ExportResult> {
  const db = client.db(config.mongoDbName);

  const runId = randomUUID();
  const outputDir = join(config.lakeDir, "jobs", "semantic-graph", runId);

  // eslint-disable-next-line no-console
  console.log(`[export] run_id=${runId} output=${outputDir}`);

  await mkdir(outputDir, { recursive: true });

  // ── Stream + normalize ──────────────────────────────────────

  const ids: string[] = [];
  const rows: Float32Array[] = [];
  let embeddingModel = config.embeddingModel;

  for await (const doc of fetchEmbeddings(db, config)) {
    const vec = new Float32Array(doc.embedding);
    l2Normalize(vec);

    ids.push(doc.node_id);
    rows.push(vec);

    // Capture the actual model from data if not explicitly set
    if (!embeddingModel && doc.embedding_model) {
      embeddingModel = doc.embedding_model;
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[export] fetched ${ids.length} embeddings with ${config.embeddingDimensions} dims`);

  if (ids.length === 0) {
    // Write empty manifest to record the (failed) run
    const manifest: ExportManifest = {
      run_id: runId,
      node_count: 0,
      dimensions: config.embeddingDimensions,
      embedding_model: embeddingModel,
      created_at: new Date().toISOString(),
    };
    await writeFile(join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2));
    // eslint-disable-next-line no-console
    console.warn("[export] WARNING: no embeddings found for the given model/dims");
    return { runId, outputDir, manifest };
  }

  // ── Write binary artifacts ─────────────────────────────────

  await writeEmbeddingSlab(join(outputDir, "embeddings.f32"), rows);
  await writeIdsBin(join(outputDir, "ids.bin"), ids);

  const manifest: ExportManifest = {
    run_id: runId,
    node_count: ids.length,
    dimensions: config.embeddingDimensions,
    embedding_model: embeddingModel,
    created_at: new Date().toISOString(),
  };

  await writeFile(join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  // eslint-disable-next-line no-console
  console.log(`[export] wrote ${ids.length} nodes to ${outputDir}`);

  return { runId, outputDir, manifest };
}
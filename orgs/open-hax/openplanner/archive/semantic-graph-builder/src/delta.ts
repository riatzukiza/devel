import { existsSync } from "node:fs";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { Db, MongoClient } from "mongodb";
import type { SemanticGraphBuilderConfig } from "./config.js";
import { l2Normalize } from "./export.js";

export interface DeltaManifest {
  delta_id: string;
  parent_run_id: string;
  parent_graph_version: string;
  parent_node_count: number;
  new_node_count: number;
  existing_node_count: number;
  new_nodes: string[];
  is_incremental: boolean;
  should_rebuild: boolean;
  embedding_model: string;
  dimensions: number;
  created_at: string;
}

export interface DeltaResult {
  deltaId: string;
  parentRunId: string;
  parentGraphVersion: string;
  parentNodeCount: number;
  newNodeCount: number;
  existingNodeCount: number;
  newNodes: string[];
  outputDir: string;
  manifest: DeltaManifest;
  isIncremental: boolean;
  shouldRebuild: boolean;
}

interface EmbeddingRow {
  node_id: string;
  embedding: number[];
  embedding_dimensions: number;
  embedding_model: string | null;
  updated_at?: Date;
}

interface ExportManifest {
  run_id: string;
  node_count: number;
  dimensions: number;
  embedding_model: string;
  created_at: string;
}

const COLLECTION_NAME = "graph_node_embeddings";
const REBUILD_THRESHOLD = 0.05;

export async function getLatestCanonicalRun(db: Db): Promise<{
  runId: string;
  graphVersion: string;
  nodeCount: number;
  finishedAt: Date;
  embeddingModel: string;
  embeddingDimensions: number;
} | null> {
  const collection = db.collection<{ run_id: string; graph_version: string; node_count: number; finished_at: Date; embedding_model: string; embedding_dimensions: number }>("semantic_graph_runs");
  const row = await collection.findOne({ status: { $in: ["complete", "clustered"] } }, { sort: { finished_at: -1 } });
  if (!row) return null;
  return {
    runId: row.run_id,
    graphVersion: row.graph_version ?? row.run_id,
    nodeCount: row.node_count,
    finishedAt: row.finished_at,
    embeddingModel: row.embedding_model ?? "",
    embeddingDimensions: row.embedding_dimensions ?? 0,
  };
}

export async function getParentRunDir(config: SemanticGraphBuilderConfig, parentRunId: string): Promise<string | null> {
  const parentDir = join(config.lakeDir, "jobs", "semantic-graph", parentRunId);
  if (existsSync(parentDir)) return parentDir;
  return null;
}

async function readIds(runDir: string): Promise<string[]> {
  const filePath = join(runDir, "ids.bin");
  if (!existsSync(filePath)) throw new Error(`ids.bin not found in ${runDir}`);

  const buffer = await readFile(filePath);
  const ids: string[] = [];
  let offset = 0;
  while (offset < buffer.length) {
    if (offset + 4 > buffer.length) throw new Error(`ids.bin truncated at offset ${offset}`);
    const byteLength = buffer.readUInt32BE(offset);
    offset += 4;
    if (offset + byteLength > buffer.length) throw new Error(`ids.bin entry overruns at offset ${offset}`);
    ids.push(buffer.toString("utf-8", offset, offset + byteLength));
    offset += byteLength;
  }
  return ids;
}

export async function exportDelta(
  client: MongoClient,
  config: SemanticGraphBuilderConfig,
): Promise<DeltaResult | null> {
  const db = client.db(config.mongoDbName);

  const latestRun = await getLatestCanonicalRun(db);
  if (!latestRun) {
    // eslint-disable-next-line no-console
    console.warn("[delta] No canonical run found — skipping delta export");
    return null;
  }

  // eslint-disable-next-line no-console
  console.log(`[delta] parent run=${latestRun.runId} nodes=${latestRun.nodeCount} finished=${latestRun.finishedAt.toISOString()}`);

  const parentDir = await getParentRunDir(config, latestRun.runId);
  if (!parentDir) {
    // eslint-disable-next-line no-console
    console.warn(`[delta] parent run dir not found: ${latestRun.runId} — falling back to full export`);
    return null;
  }

  const parentManifestPath = join(parentDir, "manifest.json");
  const parentManifest = JSON.parse(await readFile(parentManifestPath, "utf-8")) as ExportManifest;

  // Stream embeddings updated after the parent's finished_at
  const collection = db.collection(COLLECTION_NAME);
  const filter: Record<string, unknown> = {
    embedding_dimensions: config.embeddingDimensions,
  };
  if (config.embeddingModel) {
    filter.embedding_model = config.embeddingModel;
  }

  // Only include embeddings newer than the last run
  filter.updated_at = { $gt: latestRun.finishedAt };

  const cursor = collection.find(filter, {
    projection: { node_id: 1, embedding: 1, embedding_dimensions: 1, embedding_model: 1, updated_at: 1, _id: 0 },
    sort: { updated_at: 1 },
  });

  const newIds: string[] = [];
  const newRows: Float32Array[] = [];
  let embeddingModel = config.embeddingModel;

  for await (const doc of cursor) {
    const row = doc as unknown as EmbeddingRow;
    const vec = new Float32Array(row.embedding);
    l2Normalize(vec);
    newIds.push(row.node_id);
    newRows.push(vec);
    if (!embeddingModel && row.embedding_model) {
      embeddingModel = row.embedding_model;
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[delta] found ${newIds.length} new embeddings`);

  if (newIds.length === 0) {
    // eslint-disable-next-line no-console
    console.log("[delta] no new embeddings since last run");
    return null;
  }

  const deltaId = randomUUID();
  const deltaDir = join(config.lakeDir, "jobs", "semantic-graph", deltaId);

  await mkdir(deltaDir, { recursive: true });

  // Read existing IDs from parent
  const existingIds = await readIds(parentDir);
  const existingNodeSet = new Set(existingIds);
  const trulyNewIds: string[] = [];
  const trulyNewRows: Float32Array[] = [];

  for (let i = 0; i < newIds.length; i++) {
    if (!existingNodeSet.has(newIds[i])) {
      trulyNewIds.push(newIds[i]);
      trulyNewRows.push(newRows[i]);
    }
  }

  const newNodeCount = trulyNewIds.length;
  const existingNodeCount = existingIds.length;
  const newFraction = existingNodeCount > 0 ? newNodeCount / existingNodeCount : 1;
  const shouldRebuild = newFraction > REBUILD_THRESHOLD;

  // eslint-disable-next-line no-console
  console.log(
    `[delta] trulyNew=${newNodeCount} existing=${existingNodeCount} fraction=${(newFraction * 100).toFixed(2)}% shouldRebuild=${shouldRebuild}`,
  );

  if (shouldRebuild) {
    // eslint-disable-next-line no-console
    console.log("[delta] >5% new nodes — full rebuild recommended. Remove update-delta flag and use 'run'.");
  }

  // Write delta slab with (existing + new) nodes
  const dims = config.embeddingDimensions;
  const existingRows: Float32Array[] = [];

  for (const id of existingIds) {
    const row = await fetchEmbeddingByNodeId(collection, id, dims);
    if (row) existingRows.push(row);
    else existingRows.push(new Float32Array(dims));
  }

  const combinedIds = [...existingIds, ...trulyNewIds];
  const combinedRows = [...existingRows, ...trulyNewRows];

  await writeEmbeddingSlab(join(deltaDir, "embeddings.f32"), combinedRows);
  await writeIdsBin(join(deltaDir, "ids.bin"), combinedIds);

  const manifest: DeltaManifest = {
    delta_id: deltaId,
    parent_run_id: latestRun.runId,
    parent_graph_version: latestRun.graphVersion,
    parent_node_count: existingNodeCount,
    new_node_count: newNodeCount,
    existing_node_count: existingNodeCount,
    new_nodes: trulyNewIds,
    is_incremental: !shouldRebuild,
    should_rebuild: shouldRebuild,
    embedding_model: embeddingModel || config.embeddingModel,
    dimensions: dims,
    created_at: new Date().toISOString(),
  };

  await writeFile(join(deltaDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  // eslint-disable-next-line no-console
  console.log(`[delta] wrote ${combinedIds.length} nodes to ${deltaDir}`);

  return {
    deltaId,
    parentRunId: latestRun.runId,
    parentGraphVersion: latestRun.graphVersion,
    parentNodeCount: existingNodeCount,
    newNodeCount,
    existingNodeCount,
    newNodes: trulyNewIds,
    outputDir: deltaDir,
    manifest,
    isIncremental: !shouldRebuild,
    shouldRebuild,
  };
}

async function fetchEmbeddingByNodeId(
  collection: import("mongodb").Collection,
  nodeId: string,
  dims: number,
): Promise<Float32Array | null> {
  const doc = await collection.findOne(
    { node_id: nodeId, embedding_dimensions: dims },
    { projection: { embedding: 1, _id: 0 } },
  );
  if (!doc || !Array.isArray((doc as any).embedding)) return null;
  const vec = new Float32Array((doc as any).embedding as number[]);
  l2Normalize(vec);
  return vec;
}

async function writeEmbeddingSlab(filePath: string, rows: Float32Array[]): Promise<void> {
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

async function writeIdsBin(filePath: string, ids: string[]): Promise<void> {
  const parts: Buffer[] = [];
  for (const id of ids) {
    const idBuf = Buffer.from(id, "utf-8");
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(idBuf.length, 0);
    parts.push(lenBuf, idBuf);
  }
  await writeFile(filePath, Buffer.concat(parts));
}

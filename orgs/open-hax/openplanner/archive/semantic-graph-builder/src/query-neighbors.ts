import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import type { SemanticGraphBuilderConfig } from "./config.js";

export interface NeighborEdge {
  src: number;
  dst: number;
  weight: number;
}

export interface QueryNeighborsResult {
  runId: string;
  outputDir: string;
  nodeCount: number;
  edgeCount: number;
  kOut: number;
  candidateFactor: number;
}

const PROGRESS_INTERVAL = 50_000;

function dotProduct(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

interface SlabData {
  manifest: { run_id: string; node_count: number; dimensions: number };
  slab: Float32Array;
}

async function loadSlab(runDir: string): Promise<SlabData> {
  const manifestPath = join(runDir, "manifest.json");
  if (!existsSync(manifestPath)) throw new Error(`manifest.json not found in ${runDir}`);
  const manifest = JSON.parse(await readFile(manifestPath, "utf-8")) as {
    run_id: string;
    node_count: number;
    dimensions: number;
  };

  const slabPath = join(runDir, "embeddings.f32");
  if (!existsSync(slabPath)) throw new Error(`embeddings.f32 not found in ${runDir}`);
  const buf = await readFile(slabPath);
  const slab = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);

  return { manifest, slab };
}

async function loadSlabManifest(runDir: string): Promise<{
  run_id: string;
  node_count: number;
  dimensions: number;
  new_nodes?: string[];
  is_incremental?: boolean;
}> {
  const manifestPath = join(runDir, "manifest.json");
  if (!existsSync(manifestPath)) throw new Error(`manifest.json not found in ${runDir}`);
  return JSON.parse(await readFile(manifestPath, "utf-8"));
}

async function loadIds(runDir: string): Promise<string[]> {
  const idsPath = join(runDir, "ids.bin");
  if (!existsSync(idsPath)) throw new Error(`ids.bin not found in ${runDir}`);
  const buf = await readFile(idsPath);
  const ids: string[] = [];
  let offset = 0;
  while (offset < buf.length) {
    if (offset + 4 > buf.length) throw new Error(`ids.bin truncated at offset ${offset}`);
    const byteLength = buf.readUInt32BE(offset);
    offset += 4;
    if (offset + byteLength > buf.length) throw new Error(`ids.bin entry overruns at offset ${offset}`);
    ids.push(buf.toString("utf-8", offset, offset + byteLength));
    offset += byteLength;
  }
  return ids;
}

export async function queryNeighbors(
  config: SemanticGraphBuilderConfig,
  runDir: string,
): Promise<QueryNeighborsResult> {
  return runQueryNeighbors(config, runDir, null);
}

export async function queryDeltaNeighbors(
  config: SemanticGraphBuilderConfig,
  runDir: string,
): Promise<{ nodeCount: number; edgeCount: number }> {
  const result = await runQueryNeighbors(config, runDir, null);
  return { nodeCount: result.nodeCount, edgeCount: result.edgeCount };
}

async function runQueryNeighbors(
  config: SemanticGraphBuilderConfig,
  runDir: string,
  _newNodeIds: Set<string> | null,
): Promise<QueryNeighborsResult> {
  const hnswlib = await import("hnswlib-node");
  const HierarchicalNSW = (hnswlib.default?.HierarchicalNSW ?? hnswlib.HierarchicalNSW) as any;

  const manifest = await loadSlabManifest(runDir);
  const { slab } = await loadSlab(runDir);
  const n = manifest.node_count;
  const dims = manifest.dimensions;
  const kOut = config.kOut;
  const candidateK = kOut * config.candidateFactor;

  // eslint-disable-next-line no-console
  console.log(`[query-neighbors] n=${n} dims=${dims} k=${kOut} candidateK=${candidateK}`);

  const indexPath = join(runDir, "hnsw.index");
  if (!existsSync(indexPath)) throw new Error(`hnsw.index not found in ${runDir}`);

  const index = new HierarchicalNSW("ip", dims);
  index.readIndexSync(indexPath);
  index.setEf(Math.max(candidateK * 2, 256));

  const allEdges: NeighborEdge[] = [];

  for (let i = 0; i < n; i++) {
    const offset = i * dims;
    const queryVec = Array.from(slab.subarray(offset, offset + dims));

    const result = index.searchKnn(queryVec, candidateK + 1);

    const candidates: { label: number; annDist: number }[] = [];
    for (let j = 0; j < result.neighbors.length; j++) {
      const label = result.neighbors[j];
      if (label === i) continue;
      candidates.push({ label, annDist: result.distances[j] });
    }

    const scored: { label: number; cosine: number }[] = [];
    const queryF32 = slab.subarray(offset, offset + dims);
    for (const c of candidates) {
      const candOffset = c.label * dims;
      const candVec = slab.subarray(candOffset, candOffset + dims);
      const cosine = dotProduct(queryF32, candVec);
      scored.push({ label: c.label, cosine });
    }

    scored.sort((a, b) => b.cosine - a.cosine);

    const topK = scored.slice(0, kOut);
    for (const s of topK) {
      allEdges.push({ src: i, dst: s.label, weight: s.cosine });
    }

    if (i > 0 && i % PROGRESS_INTERVAL === 0) {
      // eslint-disable-next-line no-console
      console.log(`[query-neighbors] processed ${i}/${n} nodes, ${allEdges.length} edges`);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[query-neighbors] processed ${n}/${n} nodes, ${allEdges.length} edges total`);

  const edgesBuf = Buffer.alloc(allEdges.length * 12);
  for (let i = 0; i < allEdges.length; i++) {
    const e = allEdges[i];
    edgesBuf.writeUInt32LE(e.src, i * 12);
    edgesBuf.writeUInt32LE(e.dst, i * 12 + 4);
    edgesBuf.writeFloatLE(e.weight, i * 12 + 8);
  }

  const edgesPath = join(runDir, "edges.bin");
  await writeFile(edgesPath, edgesBuf);

  const meta = {
    run_id: manifest.run_id,
    node_count: n,
    edge_count: allEdges.length,
    k_out: kOut,
    candidate_factor: config.candidateFactor,
    dimensions: dims,
    created_at: new Date().toISOString(),
  };
  await writeFile(join(runDir, "edges-manifest.json"), JSON.stringify(meta, null, 2));

  // eslint-disable-next-line no-console
  console.log(`[query-neighbors] wrote ${allEdges.length} edges to ${edgesPath}`);

  return {
    runId: manifest.run_id,
    outputDir: runDir,
    nodeCount: n,
    edgeCount: allEdges.length,
    kOut,
    candidateFactor: config.candidateFactor,
  };
}

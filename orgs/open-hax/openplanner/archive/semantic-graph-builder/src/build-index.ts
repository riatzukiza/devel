import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import type { SemanticGraphBuilderConfig } from "./config.js";

export interface BuildIndexResult {
  runId: string;
  outputDir: string;
  nodeCount: number;
  dimensions: number;
  indexM: number;
  indexEfConstruction: number;
}

interface SlabManifest {
  run_id: string;
  node_count: number;
  dimensions: number;
  embedding_model: string;
  created_at: string;
}

async function readSlabManifest(runDir: string): Promise<SlabManifest> {
  const manifestPath = join(runDir, "manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`manifest.json not found in ${runDir}`);
  }
  const raw = await readFile(manifestPath, "utf-8");
  return JSON.parse(raw) as SlabManifest;
}

async function readEmbeddingSlab(runDir: string, nodeCount: number, dimensions: number): Promise<Float32Array> {
  const slabPath = join(runDir, "embeddings.f32");
  if (!existsSync(slabPath)) {
    throw new Error(`embeddings.f32 not found in ${runDir}`);
  }
  const buf = await readFile(slabPath);
  const expectedBytes = nodeCount * dimensions * 4;
  if (buf.byteLength !== expectedBytes) {
    throw new Error(
      `embeddings.f32 size mismatch: expected ${expectedBytes} bytes (${nodeCount}x${dimensions}x4), got ${buf.byteLength}`,
    );
  }
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

export async function buildIndex(
  config: SemanticGraphBuilderConfig,
  runDir: string,
): Promise<BuildIndexResult> {
  const hnswlib = await import("hnswlib-node");
  const HierarchicalNSW = (hnswlib.default?.HierarchicalNSW ?? hnswlib.HierarchicalNSW) as any;

  const manifest = await readSlabManifest(runDir);

  if (manifest.node_count === 0) {
    throw new Error("Cannot build index on empty slab (node_count=0)");
  }

  // eslint-disable-next-line no-console
  console.log(`[build-index] slab: n=${manifest.node_count} dims=${manifest.dimensions} model=${manifest.embedding_model}`);

  const slab = await readEmbeddingSlab(runDir, manifest.node_count, manifest.dimensions);

  const maxElements = manifest.node_count;
  const indexM = 32;
  const efConstruction = 200;

  const index = new HierarchicalNSW("ip", manifest.dimensions);
  index.initIndex(maxElements, indexM, efConstruction, 42, false);

  const n = manifest.node_count;
  const dims = manifest.dimensions;

  for (let i = 0; i < n; i++) {
    const offset = i * dims;
    const point = Array.from(slab.subarray(offset, offset + dims));
    index.addPoint(point, i);

    if (i > 0 && i % 50_000 === 0) {
      // eslint-disable-next-line no-console
      console.log(`[build-index] indexed ${i}/${n}`);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[build-index] indexed ${n}/${n} nodes`);

  const indexPath = join(runDir, "hnsw.index");
  index.writeIndexSync(indexPath);

  // eslint-disable-next-line no-console
  console.log(`[build-index] saved index to ${indexPath}`);

  return {
    runId: manifest.run_id,
    outputDir: runDir,
    nodeCount: n,
    dimensions: dims,
    indexM,
    indexEfConstruction: efConstruction,
  };
}

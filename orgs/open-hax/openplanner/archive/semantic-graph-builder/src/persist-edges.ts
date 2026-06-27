import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { MongoClient } from "mongodb";
import type { SemanticGraphBuilderConfig } from "./config.js";

type ExportManifest = {
  run_id: string;
  node_count: number;
  dimensions: number;
  embedding_model: string;
  created_at: string;
};

type EdgesManifest = {
  run_id: string;
  node_count: number;
  edge_count: number;
  k_out: number;
  candidate_factor: number;
  dimensions: number;
  created_at: string;
};

type DirectedEdge = {
  src: number;
  dst: number;
  weight: number;
};

type UndirectedEdge = {
  a: number;
  b: number;
  weight: number;
};

export interface PersistEdgesResult {
  runId: string;
  graphVersion: string;
  nodeCount: number;
  directedEdgeCount: number;
  persistedEdgeCount: number;
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  if (!existsSync(filePath)) {
    throw new Error(`${filePath} not found`);
  }
  return JSON.parse(await readFile(filePath, "utf-8")) as T;
}

async function readIds(runDir: string): Promise<string[]> {
  const filePath = join(runDir, "ids.bin");
  if (!existsSync(filePath)) {
    throw new Error(`ids.bin not found in ${runDir}`);
  }

  const buffer = await readFile(filePath);
  const ids: string[] = [];
  let offset = 0;
  while (offset < buffer.length) {
    if (offset + 4 > buffer.length) {
      throw new Error(`ids.bin truncated at offset ${offset}`);
    }
    const byteLength = buffer.readUInt32BE(offset);
    offset += 4;
    if (offset + byteLength > buffer.length) {
      throw new Error(`ids.bin entry overruns buffer at offset ${offset}`);
    }
    ids.push(buffer.toString("utf-8", offset, offset + byteLength));
    offset += byteLength;
  }
  return ids;
}

async function readDirectedEdges(runDir: string): Promise<DirectedEdge[]> {
  const filePath = join(runDir, "edges.bin");
  if (!existsSync(filePath)) {
    throw new Error(`edges.bin not found in ${runDir}`);
  }

  const buffer = await readFile(filePath);
  if (buffer.length % 12 !== 0) {
    throw new Error(`edges.bin size ${buffer.length} is not divisible by 12`);
  }

  const edges: DirectedEdge[] = [];
  for (let offset = 0; offset < buffer.length; offset += 12) {
    const src = buffer.readUInt32LE(offset);
    const dst = buffer.readUInt32LE(offset + 4);
    const weight = buffer.readFloatLE(offset + 8);
    if (src === dst || !Number.isFinite(weight)) {
      continue;
    }
    edges.push({ src, dst, weight });
  }
  return edges;
}

function symmetrizeAndCap(edges: DirectedEdge[], nodeCount: number, maxDegree: number): UndirectedEdge[] {
  const union = new Map<string, UndirectedEdge>();

  for (const edge of edges) {
    const a = Math.min(edge.src, edge.dst);
    const b = Math.max(edge.src, edge.dst);
    if (a < 0 || b >= nodeCount) {
      continue;
    }

    const key = `${a}:${b}`;
    const existing = union.get(key);
    if (!existing || edge.weight > existing.weight) {
      union.set(key, { a, b, weight: edge.weight });
    }
  }

  const ranked = [...union.values()].sort((left, right) => right.weight - left.weight);
  const degrees = new Uint32Array(nodeCount);
  const kept: UndirectedEdge[] = [];

  for (const edge of ranked) {
    if (degrees[edge.a] >= maxDegree || degrees[edge.b] >= maxDegree) {
      continue;
    }
    kept.push(edge);
    degrees[edge.a] += 1;
    degrees[edge.b] += 1;
  }

  return kept;
}

export async function persistEdges(
  client: MongoClient,
  config: SemanticGraphBuilderConfig,
  runDir: string,
): Promise<PersistEdgesResult> {
  const startedAt = new Date();
  const manifest = await readJsonFile<ExportManifest>(join(runDir, "manifest.json"));
  const edgesManifest = await readJsonFile<EdgesManifest>(join(runDir, "edges-manifest.json"));
  const ids = await readIds(runDir);
  const directedEdges = await readDirectedEdges(runDir);

  if (ids.length !== manifest.node_count) {
    throw new Error(`ids.bin count ${ids.length} does not match manifest node_count ${manifest.node_count}`);
  }

  const maxDegree = Math.max(1, config.kOut * 2);
  const undirectedEdges = symmetrizeAndCap(directedEdges, ids.length, maxDegree);
  const graphVersion = manifest.run_id;
  const now = new Date();

  // eslint-disable-next-line no-console
  console.log(
    `[persist-edges] directed=${directedEdges.length} undirected=${undirectedEdges.length} maxDegree=${maxDegree} graphVersion=${graphVersion}`,
  );

  const db = client.db(config.mongoDbName);
  const graphSemanticEdges = db.collection<{ _id: string }>("graph_semantic_edges");
  const semanticGraphRuns = db.collection<{ run_id: string }>("semantic_graph_runs");

  const batchSize = 1_000;
  for (let offset = 0; offset < undirectedEdges.length; offset += batchSize) {
    const batch = undirectedEdges.slice(offset, offset + batchSize);
    await graphSemanticEdges.bulkWrite(
      batch.map((edge) => {
        const sourceNodeId = ids[edge.a];
        const targetNodeId = ids[edge.b];
        const edgeId = `${sourceNodeId}||${targetNodeId}`;
        return {
          updateOne: {
            filter: { _id: edgeId },
            update: {
              $set: {
                source_node_id: sourceNodeId,
                target_node_id: targetNodeId,
                similarity: edge.weight,
                edge_type: "semantic_knn",
                project: null,
                embedding_model: manifest.embedding_model,
                graph_version: graphVersion,
                clustering_version: null,
                source: "semantic-graph-builder",
                updated_at: now,
                updatedAt: now,
              },
              $setOnInsert: {
                createdAt: now,
              },
            },
            upsert: true,
          },
        };
      }),
      { ordered: false },
    );
  }

  await semanticGraphRuns.updateOne(
    { run_id: manifest.run_id },
    {
      $set: {
        embedding_model: manifest.embedding_model,
        embedding_dimensions: manifest.dimensions,
        node_count: manifest.node_count,
        final_k: edgesManifest.k_out,
        candidate_factor: edgesManifest.candidate_factor,
        candidate_engine: "hnswlib-node",
        rerank_provider: "local-dot-product",
        graph_version: graphVersion,
        clustering_version: null,
        status: "complete",
        started_at: startedAt,
        finished_at: now,
        metrics: {
          directed_edge_count: directedEdges.length,
          persisted_edge_count: undirectedEdges.length,
          bounded_max_degree: maxDegree,
        },
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  return {
    runId: manifest.run_id,
    graphVersion,
    nodeCount: manifest.node_count,
    directedEdgeCount: directedEdges.length,
    persistedEdgeCount: undirectedEdges.length,
  };
}

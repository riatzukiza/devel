import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { MongoClient } from "mongodb";
import createGraph from "ngraph.graph";
import { detectClusters } from "ngraph.leiden";
import type { SemanticGraphBuilderConfig } from "./config.js";

type ExportManifest = {
  run_id: string;
  node_count: number;
  dimensions: number;
  embedding_model: string;
  created_at: string;
};

type PersistedEdgeRow = {
  source_node_id: string;
  target_node_id: string;
  similarity: number;
};

export interface ClusterResult {
  runId: string;
  graphVersion: string;
  clusteringVersion: string;
  nodeCount: number;
  clusterCount: number;
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

export async function clusterGraph(
  client: MongoClient,
  config: SemanticGraphBuilderConfig,
  runDir: string,
): Promise<ClusterResult> {
  const manifest = await readJsonFile<ExportManifest>(join(runDir, "manifest.json"));
  const ids = await readIds(runDir);
  const graphVersion = manifest.run_id;
  const clusteringVersion = `leiden:${graphVersion}`;
  const now = new Date();

  const graph = createGraph<undefined, { weight: number }>();
  for (const nodeId of ids) {
    graph.addNode(nodeId);
  }

  const db = client.db(config.mongoDbName);
  const graphSemanticEdges = db.collection<PersistedEdgeRow>("graph_semantic_edges");
  const graphClusterMemberships = db.collection<{ _id: string }>("graph_cluster_memberships");
  const semanticGraphRuns = db.collection<{ run_id: string }>("semantic_graph_runs");

  let edgeCount = 0;
  const cursor = graphSemanticEdges.find(
    { graph_version: graphVersion, source: "semantic-graph-builder" },
    { projection: { _id: 0, source_node_id: 1, target_node_id: 1, similarity: 1 } },
  );

  for await (const row of cursor) {
    graph.addLink(row.source_node_id, row.target_node_id, { weight: row.similarity });
    edgeCount += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`[cluster] graphVersion=${graphVersion} nodes=${ids.length} edges=${edgeCount}`);

  const clusters = detectClusters(graph, {
    quality: "modularity",
    randomSeed: 42,
    refine: true,
  });

  const communities = clusters.getCommunities();
  const clusterSizes = new Map<number, number>();
  for (const [clusterId, members] of communities.entries()) {
    clusterSizes.set(clusterId, members.length);
  }

  const membershipLines: string[] = [];
  const batchSize = 1_000;
  for (let offset = 0; offset < ids.length; offset += batchSize) {
    const batch = ids.slice(offset, offset + batchSize);
    await graphClusterMemberships.bulkWrite(
      batch.map((nodeId) => {
        const clusterId = clusters.getClass(nodeId);
        const clusterSize = clusterSizes.get(clusterId) ?? 1;
        membershipLines.push(
          JSON.stringify({
            node_id: nodeId,
            graph_version: graphVersion,
            clustering_version: clusteringVersion,
            cluster_id: String(clusterId),
            cluster_size: clusterSize,
            embedding_model: manifest.embedding_model,
            updated_at: now.toISOString(),
          }),
        );

        return {
          updateOne: {
            filter: { _id: `${clusteringVersion}::${nodeId}` },
            update: {
              $set: {
                node_id: nodeId,
                graph_version: graphVersion,
                clustering_version: clusteringVersion,
                cluster_id: String(clusterId),
                cluster_size: clusterSize,
                embedding_model: manifest.embedding_model,
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

  await writeFile(join(runDir, "clusters.jsonl"), `${membershipLines.join("\n")}\n`);

  await semanticGraphRuns.updateOne(
    { run_id: manifest.run_id },
    {
      $set: {
        clustering_version: clusteringVersion,
        status: "clustered",
        finished_at: now,
        "metrics.cluster_count": communities.size,
        "metrics.cluster_quality": clusters.quality(),
      },
    },
    { upsert: true },
  );

  return {
    runId: manifest.run_id,
    graphVersion,
    clusteringVersion,
    nodeCount: ids.length,
    clusterCount: communities.size,
  };
}

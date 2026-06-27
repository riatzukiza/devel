import { parseConfig } from "./config.js";
import { connectMongo } from "./mongo.js";
import { exportEmbeddings } from "./export.js";
import { buildIndex } from "./build-index.js";
import { queryNeighbors } from "./query-neighbors.js";
import { persistEdges } from "./persist-edges.js";
import { clusterGraph } from "./cluster.js";
import { exportDelta, getLatestCanonicalRun } from "./delta.js";

const COMMANDS = ["export", "build-index", "query-neighbors", "persist-edges", "cluster", "run", "update-delta"] as const;
type Command = (typeof COMMANDS)[number];

function printUsage(): void {
  // eslint-disable-next-line no-console
  console.log(`semantic-graph-builder <command> [options]

  Commands:
  export           Export normalized embedding slabs from OpenPlanner
  build-index      Build local HNSW index over the slab
  query-neighbors  ANN neighbor query + exact rerank
  persist-edges    Symmetrize + persist sparse semantic graph
  cluster          Run Leiden clustering + persist memberships
  run              Full pipeline: export -> build-index -> query-neighbors -> persist-edges -> cluster
  update-delta     Incremental update: detect new embeddings since last run, append to slab, rerun

Environment:
  MONGODB_URI           MongoDB connection string (required)
  MONGODB_DB_NAME       MongoDB database name (required)
  OPENPLANNER_LAKE_DIR  Job output directory (default: openplanner-lake)
  EMBEDDING_MODEL       Embedding model name (default: qwen3-embedding:0.6b)
  EMBEDDING_DIMENSIONS  Embedding dimensions (default: 1024)
  K_OUT                 Final k neighbors per node (default: 64)
  CANDIDATE_FACTOR      ANN candidate oversample factor (default: 8)`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printUsage();
    process.exit(0);
  }

  const command = args[0];
  if (!COMMANDS.includes(command as Command)) {
    // eslint-disable-next-line no-console
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
  }

  const config = parseConfig(process.env);

  // eslint-disable-next-line no-console
  console.log(`[semantic-graph-builder] command=${command} db=${config.mongoDbName} model=${config.embeddingModel} dims=${config.embeddingDimensions} k=${config.kOut} candidateFactor=${config.candidateFactor}`);

  const client = await connectMongo(config);
  try {
    switch (command as Command) {
      case "export": {
        const result = await exportEmbeddings(client, config);
        // eslint-disable-next-line no-console
        console.log(`[semantic-graph-builder] export complete: run_id=${result.runId} nodes=${result.manifest.node_count}`);
        break;
      }
      case "build-index": {
        const jobDir = args[1];
        if (!jobDir) {
          // eslint-disable-next-line no-console
          console.error("[semantic-graph-builder] build-index requires a job directory argument");
          process.exit(1);
        }
        const result = await buildIndex(config, jobDir);
        // eslint-disable-next-line no-console
        console.log(`[semantic-graph-builder] build-index complete: run_id=${result.runId} nodes=${result.nodeCount}`);
        break;
      }
      case "query-neighbors": {
        const jobDir = args[1];
        if (!jobDir) {
          // eslint-disable-next-line no-console
          console.error("[semantic-graph-builder] query-neighbors requires a job directory argument");
          process.exit(1);
        }
        const result = await queryNeighbors(config, jobDir);
        // eslint-disable-next-line no-console
        console.log(
          `[semantic-graph-builder] query-neighbors complete: run_id=${result.runId} edges=${result.edgeCount}`,
        );
        break;
      }
      case "persist-edges": {
        const jobDir = args[1];
        if (!jobDir) {
          // eslint-disable-next-line no-console
          console.error("[semantic-graph-builder] persist-edges requires a job directory argument");
          process.exit(1);
        }
        const result = await persistEdges(client, config, jobDir);
        // eslint-disable-next-line no-console
        console.log(
          `[semantic-graph-builder] persist-edges complete: run_id=${result.runId} graph_version=${result.graphVersion} edges=${result.persistedEdgeCount}`,
        );
        break;
      }
      case "cluster": {
        const jobDir = args[1];
        if (!jobDir) {
          // eslint-disable-next-line no-console
          console.error("[semantic-graph-builder] cluster requires a job directory argument");
          process.exit(1);
        }
        const result = await clusterGraph(client, config, jobDir);
        // eslint-disable-next-line no-console
        console.log(
          `[semantic-graph-builder] cluster complete: run_id=${result.runId} clustering_version=${result.clusteringVersion} clusters=${result.clusterCount}`,
        );
        break;
      }
      case "run": {
        const exported = await exportEmbeddings(client, config);
        const indexed = await buildIndex(config, exported.outputDir);
        const neighbors = await queryNeighbors(config, exported.outputDir);
        const persisted = await persistEdges(client, config, exported.outputDir);
        const clustered = await clusterGraph(client, config, exported.outputDir);
        // eslint-disable-next-line no-console
        console.log(
          `[semantic-graph-builder] run complete: run_id=${exported.runId} nodes=${indexed.nodeCount} directed_edges=${neighbors.edgeCount} persisted_edges=${persisted.persistedEdgeCount} clusters=${clustered.clusterCount}`,
        );
        break;
      }
      case "update-delta": {
        const db = client.db(config.mongoDbName);
        const latestRun = await getLatestCanonicalRun(db);
        if (!latestRun) {
          // eslint-disable-next-line no-console
          console.error("[update-delta] No canonical run found. Use 'run' for a full build first.");
          process.exit(1);
        }
        const deltaResult = await exportDelta(client, config);
        if (!deltaResult) {
          // eslint-disable-next-line no-console
          console.log("[update-delta] No new embeddings found since the last canonical run.");
          break;
        }
        if (deltaResult.shouldRebuild) {
          // eslint-disable-next-line no-console
          console.log(`[update-delta] New nodes=${deltaResult.newNodeCount} (${((deltaResult.newNodeCount / Math.max(1, deltaResult.existingNodeCount)) * 100).toFixed(1)}% of ${deltaResult.existingNodeCount}) exceeds 5% threshold — full rebuild recommended. Run 'semantic-graph-builder run' instead.`);
          break;
        }
        const indexed = await buildIndex(config, deltaResult.outputDir);
        const neighbors = await queryNeighbors(config, deltaResult.outputDir);
        const persisted = await persistEdges(client, config, deltaResult.outputDir);
        await clusterGraph(client, config, deltaResult.outputDir);
        // eslint-disable-next-line no-console
        console.log(
          `[update-delta] complete: parent_run=${deltaResult.parentRunId} delta_run=${deltaResult.deltaId} new_nodes=${deltaResult.newNodeCount} incremental_edges=${neighbors.edgeCount} persisted=${persisted.persistedEdgeCount}`,
        );
        break;
      }
    }
  } finally {
    await client.close();
  }
}

void main();

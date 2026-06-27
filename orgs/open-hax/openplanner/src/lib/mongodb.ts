/**
 * MongoDB Storage Backend for OpenPlanner
 *
 * Provides the same interface as DuckDB but with MongoDB as the storage layer.
 * Enables horizontal scaling, better JSON handling, and real-time subscriptions.
 *
 * TTL Indexes:
 *   - Events can auto-expire after a configurable retention period
 *   - Set MONGODB_EVENTS_TTL_SECONDS=2592000 (30 days) to enable
 *   - Set to 0 or omit to disable TTL
 */

import { MongoClient, Db, Collection, IndexDirection } from "mongodb";
import { eventMigrationState, OPENPLANNER_SCHEMA_TARGETS, type MigrationState } from "./schema-versions.js";

// Default TTL: 30 days in seconds (disabled if 0)
const DEFAULT_EVENTS_TTL_SECONDS = 0;
// Compact memories: 90 days default (they're summarized, so keep longer)
const DEFAULT_COMPACTED_TTL_SECONDS = 0;
const DEFAULT_GRAPH_NODE_EMBEDDING_DIMENSIONS = 1024;

function parsePositiveIntEnv(name: string): number {
  const parsed = Number.parseInt(process.env[name] ?? "0", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function ttlExpiryFromNow(ttlSeconds: number): Date | undefined {
  return ttlSeconds > 0 ? new Date(Date.now() + ttlSeconds * 1000) : undefined;
}

function labelsFromExtra(extra: unknown): string[] {
  if (!extra || typeof extra !== "object" || Array.isArray(extra)) return [];
  const openplannerLabels = (extra as Record<string, unknown>).openplanner_labels;
  if (!openplannerLabels || typeof openplannerLabels !== "object" || Array.isArray(openplannerLabels)) return [];
  const labels = (openplannerLabels as Record<string, unknown>).labels;
  if (!Array.isArray(labels)) return [];
  return [...new Set(labels.map((label) => String(label ?? "").trim()).filter(Boolean))];
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}

async function ensureTtlIndex(
  collection: Collection<any>,
  keys: Record<string, IndexDirection>,
  options: {
    readonly name: string;
    readonly expireAfterSeconds: number;
    readonly partialFilterExpression?: Record<string, unknown>;
  },
): Promise<void> {
  const existing = (await collection.indexes()).find((index) => index.name === options.name);
  const existingPartial = existing?.partialFilterExpression ?? undefined;
  const requestedPartial = options.partialFilterExpression ?? undefined;

  if (
    existing
    && (
      existing.expireAfterSeconds !== options.expireAfterSeconds
      || stableJson(existingPartial) !== stableJson(requestedPartial)
    )
  ) {
    await collection.dropIndex(options.name);
  }

  await collection.createIndex(keys, {
    expireAfterSeconds: options.expireAfterSeconds,
    name: options.name,
    background: true,
    ...(options.partialFilterExpression ? { partialFilterExpression: options.partialFilterExpression } : {}),
  });
}

async function waitForQueryableSearchIndex(
  collection: Collection<any>,
  indexName: string,
  timeoutMs = 60_000,
  pollMs = 1_000,
): Promise<void> {
  const startedAt = Date.now();

  while ((Date.now() - startedAt) < timeoutMs) {
    const rows = await collection.listSearchIndexes(indexName).toArray() as Array<{ status?: string; queryable?: boolean }>;
    const current = rows[0];
    const status = current?.status;
    if (status === "READY" && current?.queryable === true) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  throw new Error(`timed out waiting for graph search index ${indexName}`);
}

async function ensureGraphNodeEmbeddingVectorSearchIndex(
  collection: Collection<any>,
): Promise<void> {
  const indexName = "embedding_vector";
  const dimensions = Number(process.env.EMBED_PROVIDER_DIMENSIONS ?? DEFAULT_GRAPH_NODE_EMBEDDING_DIMENSIONS);
  const existing = await collection.listSearchIndexes(indexName).toArray();

  if (existing.length === 0) {
    await collection.createSearchIndex({
      name: indexName,
      type: "vectorSearch",
      definition: {
        fields: [
          {
            type: "vector",
            path: "embedding",
            numDimensions: dimensions,
            similarity: "cosine",
          },
          { type: "filter", path: "project" },
          { type: "filter", path: "node_id" },
          { type: "filter", path: "embedding_model" },
          { type: "filter", path: "embedding_dimensions" },
        ],
      },
    });
  }

  await waitForQueryableSearchIndex(collection, indexName);
}

export interface MongoConfig {
  uri: string;
  dbName: string;
  eventsCollection: string;
  compactedCollection: string;
  vectorHotCollection: string;
  vectorCompactCollection: string;
  graphLayoutCollection: string;
  graphNodeEmbeddingCollection: string;
  /** TTL for events in seconds (0 = no TTL) */
  eventsTtlSeconds?: number;
  /** TTL for compacted memories in seconds (0 = no TTL) */
  compactedTtlSeconds?: number;
}

export interface MongoVectorDocument {
  _id: string;
  parent_id: string;
  text: string;
  embedding: number[];
  ts: Date;
  source: string;
  kind: string;
  project: string | null;
  session: string | null;
  author: string | null;
  role: string | null;
  model: string | null;
  visibility: string | null;
  quality_label?: string | null;
  labels?: string[];
  title: string | null;
  embedding_model: string | null;
  embedding_dimensions: number | null;
  search_tier: "hot" | "compact";
  chunk_id: string | null;
  chunk_index: number | null;
  chunk_count: number | null;
  normalized_format: string | null;
  normalized_estimated_tokens: number | null;
  raw_estimated_tokens: number | null;
  seed_id: string | null;
  member_count: number | null;
  char_count: number | null;
  source_text_redacted?: boolean;
  source_ref?: Record<string, unknown> | null;
  text_hash_sha256?: string | null;
  chunk_text_hash_sha256?: string | null;
  char_start?: number | null;
  char_end?: number | null;
  schema_version?: number;
  migration_state?: MigrationState | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoVectorPartitionDocument {
  _id: string;
  tier: "hot" | "compact";
  model: string;
  dimensions: number;
  collectionName: string;
  searchIndexName: string;
  searchIndexStatus: "pending" | "ready" | "error";
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventDocument {
  _id: string;
  id: string;
  ts: Date;
  source: string;
  kind: string;
  project: string | null;
  session: string | null;
  message: string | null;
  role: string | null;
  author: string | null;
  model: string | null;
  tags: unknown | null;
  text: string | null;
  attachments: unknown[] | null;
  extra: unknown | null;
  schema_version?: number;
  migration_state?: MigrationState | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompactedMemoryDocument {
  _id: string;
  id: string;
  ts: Date;
  source: string;
  kind: string;
  project: string | null;
  session: string | null;
  seed_id: string | null;
  member_count: number;
  char_count: number;
  embedding_model: string | null;
  text: string;
  members: unknown[] | null;
  extra: unknown | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GraphLayoutOverrideDocument {
  _id: string;
  node_id: string;
  project: string | null;
  x: number;
  y: number;
  layout_source: string | null;
  layout_version: string | null;
  updated_at: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GraphNodeEmbeddingDocument {
  _id: string;
  node_id: string;
  source_event_id: string;
  project: string | null;
  embedding_model: string | null;
  embedding_dimensions: number;
  embedding: number[];
  chunk_index: number;
  chunk_count: number;
  text?: string;
  updated_at: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GraphSemanticEdgeDocument {
  _id: string;
  source_node_id: string;
  target_node_id: string;
  similarity: number;
  edge_type: string;
  project: string | null;
  embedding_model: string | null;
  graph_version: string | null;
  clustering_version: string | null;
  source: string | null;
  conductance?: number | null;
  resistance?: number | null;
  status?: "active" | "weak" | "broken" | null;
  reinforcement_count?: number | null;
  last_reinforced_at?: Date | null;
  decay_half_life_ms?: number | null;
  updated_at: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GraphSemanticForceSampleDocument {
  _id: string;
  source_node_id: string;
  target_node_id: string;
  similarity: number;
  charge: number;
  force_kind: string;
  field_profile: string;
  project: string | null;
  embedding_model: string | null;
  embedding_dimensions: number | null;
  source: string | null;
  updated_at: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GraphSemanticFieldCellDocument {
  _id: string;
  cell_id: string;
  field_profile: string;
  project: string | null;
  embedding_model: string | null;
  embedding_dimensions: number | null;
  level: number;
  ix: number;
  iy: number;
  bounds: {
    min_x: number;
    min_y: number;
    max_x: number;
    max_y: number;
  };
  center_x: number;
  center_y: number;
  half_extent: number;
  mass: number;
  node_count: number;
  node_ids: string[];
  child_cell_ids: string[];
  centroid_embedding: number[];
  charge: number;
  source: string | null;
  updated_at: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GraphEdgeDocument {
  _id: string;
  source_node_id: string;
  target_node_id: string;
  edge_kind: string; // structural edge kind (e.g., "visited_to_unvisited", "code_dep", etc.)
  layer: string | null;
  project: string | null;
  source: string | null; // where this edge came from (e.g., "graph-weaver")
  data: Record<string, unknown> | null;
  updated_at: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type GraphEdgeClaimStatus =
  | "proposed"
  | "supported"
  | "active"
  | "refuted"
  | "rejected"
  | "superseded"
  | "expired"
  | "withdrawn";

export type GraphEdgeClaimDirection = "directed" | "undirected";

export interface GraphEdgeClaimDocument {
  _id: string;
  claim_id: string;
  source_node_id: string;
  target_node_id: string;
  relation_kind: string;
  direction: GraphEdgeClaimDirection;
  scope: Record<string, unknown> | null;
  status: GraphEdgeClaimStatus;
  confidence: number;
  support_event_ids: string[];
  refute_event_ids: string[];
  supersedes_claim_ids: string[];
  valid_from: Date;
  valid_until: Date | null;
  decay_policy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GraphDaimoiTrailDocument {
  _id: string;
  query_hash: string;
  query_text: string;
  daimoi_id: string;
  origin_node_id: string;
  current_node_id: string;
  node_ids: string[];
  edge_keys: string[];
  trail: string[];
  activation: number;
  traversal_cost: number;
  field_adjustments: Array<{ node_id: string; delta: number }>;
  decay_half_life_seconds: number;
  emitted_at: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type GraphViewNodeStatus = "active" | "expanded" | "archived";

export interface GraphViewNodeSourceMetadata {
  node_id: string;
  source_kind: string;
  project: string | null;
  source: string | null;
  title: string | null;
  source_ref: Record<string, unknown> | null;
  access_instruction: string;
}

export interface GraphViewNodeDocument {
  _id: string;
  view_node_id: string;
  view_kind: "compact";
  status: GraphViewNodeStatus;
  project: string | null;
  graph_version: string | null;
  parent_view_node_id: string | null;
  child_node_ids: string[];
  child_view_node_ids: string[];
  descendant_node_count: number;
  embedding_model: string | null;
  embedding_dimensions: number;
  embedding: number[];
  saturation: number;
  average_child_saturation: number;
  expansion_threshold: number;
  compaction_scalar: number;
  resource_pressure: number;
  source_metadata: GraphViewNodeSourceMetadata[];
  created_by: string | null;
  updated_at: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GraphLabelNodeDocument {
  _id: string;
  label_id: string;
  label: string;
  emoji: string | null;
  description: string;
  color: string | null;
  tenant_id: string;
  project: string | null;
  embedding_model: string | null;
  embedding_dimensions: number;
  embedding: number[] | null;
  created_by: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GraphClusterMembershipDocument {
  _id: string; // `${clustering_version}::${node_id}`
  node_id: string;
  graph_version: string | null;
  clustering_version: string | null;
  cluster_id: string | null;
  cluster_size: number | null;
  embedding_model: string | null;
  updated_at: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SemanticGraphRunDocument {
  _id: string;
  run_id: string;
  embedding_model: string | null;
  embedding_dimensions: number | null;
  node_count: number | null;
  final_k: number | null;
  candidate_factor: number | null;
  candidate_engine: string | null;
  rerank_provider: string | null;
  graph_version: string | null;
  clustering_version: string | null;
  status: string | null;
  started_at: Date | null;
  finished_at: Date | null;
  metrics: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MigrationJobDocument {
  _id: string;
  entity: string;
  object_id: string;
  trigger: string;
  status: "queued" | "running" | "applied" | "failed" | "skipped";
  plan: Record<string, unknown> | null;
  error: Record<string, unknown> | string | null;
  attempts: number;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GardenDocument {
  _id: string;
  garden_id: string;
  title: string;
  description: string | null;
  theme?: string;
  default_language?: string;
  target_languages?: string[];
  source_filter?: {
    project?: string;
    kind?: string;
    domain?: string;
    path_prefix?: string;
  } | null;
  nav?: {
    items: {
      label: string;
      path: string;
      children?: { label: string; path: string }[];
    }[];
  } | null;
  owner_id?: string;
  created_by?: string;
  status?: "draft" | "active" | "archived";
  stats?: {
    documents_count: number;
    translations_count: number;
    last_published_at?: Date;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MongoConnection {
  client: MongoClient;
  db: Db;
  events: Collection<EventDocument>;
  compacted: Collection<CompactedMemoryDocument>;
  hotVectors: Collection<MongoVectorDocument>;
  compactVectors: Collection<MongoVectorDocument>;
  vectorPartitions: Collection<MongoVectorPartitionDocument>;
  graphLayoutOverrides: Collection<GraphLayoutOverrideDocument>;
  graphNodeEmbeddings: Collection<GraphNodeEmbeddingDocument>;
  graphSemanticEdges: Collection<GraphSemanticEdgeDocument>;
  graphSemanticForceSamples: Collection<GraphSemanticForceSampleDocument>;
  graphSemanticFieldCells: Collection<GraphSemanticFieldCellDocument>;
  graphEdges: Collection<GraphEdgeDocument>;
  graphEdgeClaims: Collection<GraphEdgeClaimDocument>;
  graphDaimoiTrails: Collection<GraphDaimoiTrailDocument>;
  graphViewNodes: Collection<GraphViewNodeDocument>;
  graphClusterMemberships: Collection<GraphClusterMembershipDocument>;
  graphLabelNodes: Collection<GraphLabelNodeDocument>;
  semanticGraphRuns: Collection<SemanticGraphRunDocument>;
  migrationJobs: Collection<MigrationJobDocument>;
  gardens: Collection<GardenDocument>;
  ftsEnabled: boolean; // MongoDB has text search, always true
}

/**
 * Connect to MongoDB and create indexes.
 */
export async function openMongoDB(config: MongoConfig): Promise<MongoConnection> {
  const client = new MongoClient(config.uri, {
    connectTimeoutMS: 10000,
    socketTimeoutMS: 30000,
    maxPoolSize: 50,
  });

  await client.connect();
  const db = client.db(config.dbName);

  const events = db.collection<EventDocument>(config.eventsCollection);
  const compacted = db.collection<CompactedMemoryDocument>(config.compactedCollection);
  const hotVectors = db.collection<MongoVectorDocument>(config.vectorHotCollection);
  const compactVectors = db.collection<MongoVectorDocument>(config.vectorCompactCollection);
  const vectorPartitions = db.collection<MongoVectorPartitionDocument>("vector_partitions");
  const graphLayoutOverrides = db.collection<GraphLayoutOverrideDocument>(config.graphLayoutCollection);
  const graphNodeEmbeddings = db.collection<GraphNodeEmbeddingDocument>(config.graphNodeEmbeddingCollection);
  const graphSemanticEdges = db.collection<GraphSemanticEdgeDocument>("graph_semantic_edges");
  const graphSemanticForceSamples = db.collection<GraphSemanticForceSampleDocument>("graph_semantic_force_samples");
  const graphSemanticFieldCells = db.collection<GraphSemanticFieldCellDocument>("graph_semantic_field_cells");
  const graphEdges = db.collection<GraphEdgeDocument>("graph_edges");
  const graphEdgeClaims = db.collection<GraphEdgeClaimDocument>("graph_edge_claims");
  const graphDaimoiTrails = db.collection<GraphDaimoiTrailDocument>("graph_daimoi_trails");
  const graphViewNodes = db.collection<GraphViewNodeDocument>("graph_view_nodes");
  const graphClusterMemberships = db.collection<GraphClusterMembershipDocument>("graph_cluster_memberships");
  const graphLabelNodes = db.collection<GraphLabelNodeDocument>("graph_label_nodes");
  const semanticGraphRuns = db.collection<SemanticGraphRunDocument>("semantic_graph_runs");
  const migrationJobs = db.collection<MigrationJobDocument>("migration_jobs");
  const gardens = db.collection<GardenDocument>("gardens");

  // Create indexes for events
  await events.createIndex({ ts: -1 });
  await events.createIndex({ source: 1, ts: -1 });
  await events.createIndex({ kind: 1, ts: -1 });
  await events.createIndex({ project: 1, ts: -1 });
  await events.createIndex({ session: 1, ts: -1 });
  await events.createIndex({ "extra.openplanner_labels.quality": 1, ts: -1 });
  await events.createIndex({ schema_version: 1, ts: -1 });
  await events.createIndex({ "text": "text" }); // Full-text search index

  // Create indexes for compacted_memories
  await compacted.createIndex({ ts: -1 });
  await compacted.createIndex({ source: 1, ts: -1 });
  await compacted.createIndex({ kind: 1, ts: -1 });
  await compacted.createIndex({ project: 1, ts: -1 });
  await compacted.createIndex({ "text": "text" }); // Full-text search index

  await hotVectors.createIndex({ parent_id: 1, chunk_index: 1 });
  await hotVectors.createIndex({ ts: -1 });
  await hotVectors.createIndex({ source: 1, ts: -1 });
  await hotVectors.createIndex({ kind: 1, ts: -1 });
  await hotVectors.createIndex({ project: 1, ts: -1 });
  await hotVectors.createIndex({ session: 1, ts: -1 });
  await hotVectors.createIndex({ visibility: 1, ts: -1 });
  await hotVectors.createIndex({ quality_label: 1, ts: -1 });
  await hotVectors.createIndex({ labels: 1, ts: -1 });
  await hotVectors.createIndex({ embedding_model: 1, embedding_dimensions: 1, ts: -1 });
  await hotVectors.createIndex({ schema_version: 1, ts: -1 });

  await compactVectors.createIndex({ parent_id: 1 });
  await compactVectors.createIndex({ ts: -1 });
  await compactVectors.createIndex({ source: 1, ts: -1 });
  await compactVectors.createIndex({ kind: 1, ts: -1 });
  await compactVectors.createIndex({ project: 1, ts: -1 });
  await compactVectors.createIndex({ session: 1, ts: -1 });
  await compactVectors.createIndex({ visibility: 1, ts: -1 });
  await compactVectors.createIndex({ quality_label: 1, ts: -1 });
  await compactVectors.createIndex({ labels: 1, ts: -1 });
  await compactVectors.createIndex({ embedding_model: 1, embedding_dimensions: 1, ts: -1 });
  await compactVectors.createIndex({ schema_version: 1, ts: -1 });

  await vectorPartitions.createIndex({ collectionName: 1 }, { unique: true });
  await vectorPartitions.createIndex({ tier: 1, model: 1, dimensions: 1 }, { unique: true });

  await graphLayoutOverrides.createIndex({ node_id: 1 }, { unique: true });
  await graphLayoutOverrides.createIndex({ project: 1, updated_at: -1 as IndexDirection });
  await graphLayoutOverrides.createIndex({ updated_at: -1 as IndexDirection });
  await graphLayoutOverrides.createIndex({ layout_source: 1, updated_at: -1 as IndexDirection });

  await graphNodeEmbeddings.createIndex({ node_id: 1, embedding_model: 1, embedding_dimensions: 1 }, { unique: true });
  await graphNodeEmbeddings.createIndex({ source_event_id: 1, embedding_model: 1, embedding_dimensions: 1 });
  await graphNodeEmbeddings.createIndex({ project: 1, updated_at: -1 as IndexDirection });
  await graphNodeEmbeddings.createIndex({ updated_at: -1 as IndexDirection });
  try {
    await ensureGraphNodeEmbeddingVectorSearchIndex(graphNodeEmbeddings);
  } catch (error) {
    console.warn("[mongodb] graph_node_embeddings vector index unavailable:", error instanceof Error ? error.message : String(error));
  }

  // Semantic edges for graph clustering
  await graphSemanticEdges.createIndex({ source_node_id: 1, target_node_id: 1 }, { unique: true });
  await graphSemanticEdges.createIndex({ source_node_id: 1, updated_at: -1 as IndexDirection });
  await graphSemanticEdges.createIndex({ target_node_id: 1, updated_at: -1 as IndexDirection });
  await graphSemanticEdges.createIndex({ similarity: -1 as IndexDirection });
  await graphSemanticEdges.createIndex({ graph_version: 1, updated_at: -1 as IndexDirection });
  await graphSemanticEdges.createIndex({ clustering_version: 1, updated_at: -1 as IndexDirection });
  await graphSemanticEdges.createIndex({ status: 1, conductance: 1, updated_at: -1 as IndexDirection });
  await graphSemanticEdges.createIndex({ last_reinforced_at: 1, status: 1 });

  // Semantic force samples are layout/runtime force-cache data, not relation truth.
  await graphSemanticForceSamples.createIndex({ source_node_id: 1, target_node_id: 1, field_profile: 1, embedding_model: 1 }, { unique: true });
  await graphSemanticForceSamples.createIndex({ source_node_id: 1, updated_at: -1 as IndexDirection });
  await graphSemanticForceSamples.createIndex({ target_node_id: 1, updated_at: -1 as IndexDirection });
  await graphSemanticForceSamples.createIndex({ field_profile: 1, updated_at: -1 as IndexDirection });
  await graphSemanticForceSamples.createIndex({ project: 1, updated_at: -1 as IndexDirection });

  await graphSemanticFieldCells.createIndex({ cell_id: 1 }, { unique: true });
  await graphSemanticFieldCells.createIndex({ field_profile: 1, level: 1, updated_at: -1 as IndexDirection });
  await graphSemanticFieldCells.createIndex({ project: 1, field_profile: 1, updated_at: -1 as IndexDirection });
  await graphSemanticFieldCells.createIndex({ node_ids: 1, field_profile: 1 });

  // ALL graph edges (structural + semantic) from graph-weaver
  await graphEdges.createIndex({ source_node_id: 1, target_node_id: 1, edge_kind: 1 }, { unique: true });
  await graphEdges.createIndex({ source_node_id: 1, updated_at: -1 as IndexDirection });
  await graphEdges.createIndex({ target_node_id: 1, updated_at: -1 as IndexDirection });
  await graphEdges.createIndex({ target_node_id: 1, edge_kind: 1 });
  await graphEdges.createIndex({ edge_kind: 1, updated_at: -1 as IndexDirection });
  await graphEdges.createIndex({ project: 1, updated_at: -1 as IndexDirection });

  // Evidence-backed edge claims. These are graph truth candidates; semantic
  // force samples must not be promoted here without explicit evidence.
  await graphEdgeClaims.createIndex({ claim_id: 1 }, { unique: true });
  await graphEdgeClaims.createIndex({ source_node_id: 1, status: 1, updatedAt: -1 as IndexDirection });
  await graphEdgeClaims.createIndex({ target_node_id: 1, status: 1, updatedAt: -1 as IndexDirection });
  await graphEdgeClaims.createIndex({ relation_kind: 1, status: 1, updatedAt: -1 as IndexDirection });
  await graphEdgeClaims.createIndex({ "scope.project": 1, status: 1, updatedAt: -1 as IndexDirection });
  await graphEdgeClaims.createIndex({ valid_until: 1, status: 1 });

  // Query-born daimoi trails. These decay into a trail field and influence later queries.
  await graphDaimoiTrails.createIndex({ query_hash: 1, emitted_at: -1 as IndexDirection });
  await graphDaimoiTrails.createIndex({ node_ids: 1, emitted_at: -1 as IndexDirection });
  await graphDaimoiTrails.createIndex({ current_node_id: 1, emitted_at: -1 as IndexDirection });
  await graphDaimoiTrails.createIndex({ emitted_at: -1 as IndexDirection });

  // Compacted ViewGraph nodes for simulation. TruthGraph nodes remain in their
  // original collections; these rows are lossy runtime projections with
  // averaged embeddings and source metadata for expansion/audit.
  await graphViewNodes.createIndex({ view_node_id: 1 }, { unique: true });
  await graphViewNodes.createIndex({ status: 1, saturation: -1 as IndexDirection, updated_at: -1 as IndexDirection });
  await graphViewNodes.createIndex({ child_node_ids: 1, status: 1 });
  await graphViewNodes.createIndex({ child_view_node_ids: 1, status: 1 });
  await graphViewNodes.createIndex({ parent_view_node_id: 1, status: 1 });
  await graphViewNodes.createIndex({ project: 1, status: 1, updated_at: -1 as IndexDirection });

  // Cluster memberships
  await graphClusterMemberships.createIndex({ node_id: 1 });
  await graphClusterMemberships.createIndex({ graph_version: 1, cluster_id: 1 });
  await graphClusterMemberships.createIndex({ clustering_version: 1, cluster_id: 1 });

  // Label nodes — structural graph nodes for categorical labels
  await graphLabelNodes.createIndex({ label_id: 1 }, { unique: true });
  await graphLabelNodes.createIndex({ tenant_id: 1, project: 1, updatedAt: -1 as IndexDirection });
  await graphLabelNodes.createIndex({ label: "text" });

  // Semantic graph runs
  await semanticGraphRuns.createIndex({ run_id: 1 }, { unique: true });
  await semanticGraphRuns.createIndex({ graph_version: 1 }, { unique: true });
  await semanticGraphRuns.createIndex({ status: 1, finished_at: -1 as IndexDirection });

  // Lazy migration jobs for validation-triggered and graph-crawl-triggered work
  await migrationJobs.createIndex({ status: 1, priority: -1 as IndexDirection, updatedAt: 1 });
  await migrationJobs.createIndex({ entity: 1, object_id: 1, trigger: 1 }, { unique: true });

  // Gardens collection for published websites
  await gardens.createIndex({ garden_id: 1 }, { unique: true });
  await gardens.createIndex({ owner_id: 1, createdAt: -1 as IndexDirection });
  await gardens.createIndex({ status: 1, createdAt: -1 as IndexDirection });

  // Tenant collections — queried on every request, must be indexed
  const tenants = db.collection("tenants");
  const tenantPolicies = db.collection("tenant_policies");
  await tenants.createIndex({ tenant_id: 1 }, { unique: true });
  await tenants.createIndex({ domains: 1 });
  await tenantPolicies.createIndex({ tenant_id: 1 }, { unique: true });

  // Ensure default tenant exists (fire-and-forget, non-blocking)
  void (async () => {
    try {
      await tenants.updateOne(
        { tenant_id: "knoxx-session" },
        {
          $set: {
            tenant_id: "knoxx-session",
            slug: "knoxx-session",
            name: "Knoxx Session",
            status: "active",
            isolation_mode: "shared",
            domains: [],
            updated_at: new Date(),
          },
          $setOnInsert: { created_at: new Date() },
        },
        { upsert: true }
      );
      await tenantPolicies.updateOne(
        { tenant_id: "knoxx-session" },
        {
          $set: {
            tenant_id: "knoxx-session",
            retention_days: 90,
            review_threshold: 0.5,
            pii_rules: { detect: true, redact: false, reject: false },
            translation_config: { default_target_langs: ["en"] },
            rate_limits: { requests_per_minute: 1000, tokens_per_day: 1000000 },
            updated_at: new Date(),
          },
          $setOnInsert: { created_at: new Date() },
        },
        { upsert: true }
      );
    } catch {
      // Silently ignore — tenant resolution is non-strict
    }
  })();

  // TTL index for events (auto-expire old signals)
  const eventsTtl = config.eventsTtlSeconds ?? DEFAULT_EVENTS_TTL_SECONDS;
  if (eventsTtl > 0) {
    // Only non-labeled documents receive expiresAt; labeled documents keep expiresAt unset.
    await ensureTtlIndex(
      events,
      { expiresAt: 1 },
      { 
        expireAfterSeconds: 0,
        name: "events_ttl",
      }
    );
    console.log(`[mongodb] Created TTL index on non-labeled events (expireAfterSeconds: ${eventsTtl})`);
  }

  // TTL index for compacted_memories (longer retention, optional)
  const compactedTtl = config.compactedTtlSeconds ?? DEFAULT_COMPACTED_TTL_SECONDS;
  if (compactedTtl > 0) {
    await ensureTtlIndex(
      compacted,
      { expiresAt: 1 },
      { 
        expireAfterSeconds: 0,
        name: "compacted_ttl",
      }
    );
    console.log(`[mongodb] Created TTL index on non-labeled compacted_memories (expireAfterSeconds: ${compactedTtl})`);
  }

  if (eventsTtl > 0) {
    await ensureTtlIndex(
      hotVectors,
      { expiresAt: 1 },
      {
        expireAfterSeconds: 0,
        name: "hot_vectors_ttl",
      },
    );
    console.log(`[mongodb] Created TTL index on non-labeled hot vectors (expireAfterSeconds: ${eventsTtl})`);
  }

  if (compactedTtl > 0) {
    await ensureTtlIndex(
      compactVectors,
      { expiresAt: 1 },
      {
        expireAfterSeconds: 0,
        name: "compact_vectors_ttl",
      },
    );
    console.log(`[mongodb] Created TTL index on non-labeled compact vectors (expireAfterSeconds: ${compactedTtl})`);
  }

  return {
    client,
    db,
    events,
    compacted,
    hotVectors,
    compactVectors,
    vectorPartitions,
    graphLayoutOverrides,
    graphNodeEmbeddings,
    graphSemanticEdges,
    graphSemanticForceSamples,
    graphSemanticFieldCells,
    graphEdges,
    graphEdgeClaims,
    graphDaimoiTrails,
    graphViewNodes,
    graphClusterMemberships,
    graphLabelNodes,
    semanticGraphRuns,
    migrationJobs,
    gardens,
    ftsEnabled: true, // MongoDB always has text search
  };
}

export async function enqueueMigrationJob(
  collection: Collection<MigrationJobDocument>,
  job: {
    entity: string;
    object_id: string;
    trigger: string;
    plan?: Record<string, unknown> | null;
    error?: Record<string, unknown> | string | null;
    priority?: number;
  },
): Promise<void> {
  const now = new Date();
  const id = `${job.entity}:${job.object_id}:${job.trigger}`;
  await collection.updateOne(
    { _id: id },
    {
      $set: {
        entity: job.entity,
        object_id: job.object_id,
        trigger: job.trigger,
        plan: job.plan ?? null,
        error: job.error ?? null,
        priority: job.priority ?? 0,
        updatedAt: now,
      },
      $setOnInsert: {
        status: "queued",
        attempts: 0,
        createdAt: now,
      },
    },
    { upsert: true },
  );
}

/**
 * Close MongoDB connection.
 */
export async function closeMongoDB(conn: MongoConnection): Promise<void> {
  await conn.client.close();
}

/**
 * Insert or update an event.
 */
export async function upsertEvent(
  collection: Collection<EventDocument>,
  event: Omit<EventDocument, "_id" | "createdAt" | "updatedAt">
): Promise<void> {
  const now = new Date();
  const schemaVersion = event.schema_version ?? OPENPLANNER_SCHEMA_TARGETS.event;
  const state = event.migration_state ?? eventMigrationState(now);
  const ttlSeconds = parsePositiveIntEnv("MONGODB_EVENTS_TTL_SECONDS");
  const labels = labelsFromExtra(event.extra);
  const expiresAt = labels.length > 0 ? undefined : ttlExpiryFromNow(ttlSeconds);
  await collection.updateOne(
    { _id: event.id },
    {
      $set: {
        ...event,
        schema_version: schemaVersion,
        migration_state: state,
        ...(expiresAt ? { expiresAt } : {}),
        updatedAt: now,
      },
      ...(labels.length > 0 || ttlSeconds <= 0 ? { $unset: { expiresAt: "" } } : {}),
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );
}

/**
 * Insert or update a compacted memory.
 */
export async function upsertCompactedMemory(
  collection: Collection<CompactedMemoryDocument>,
  memory: Omit<CompactedMemoryDocument, "_id" | "createdAt" | "updatedAt">
): Promise<void> {
  const now = new Date();
  const ttlSeconds = parsePositiveIntEnv("MONGODB_COMPACTED_TTL_SECONDS");
  const labels = labelsFromExtra(memory.extra);
  const expiresAt = labels.length > 0 ? undefined : ttlExpiryFromNow(ttlSeconds);
  await collection.updateOne(
    { _id: memory.id },
    {
      $set: {
        ...memory,
        ...(expiresAt ? { expiresAt } : {}),
        updatedAt: now,
      },
      ...(labels.length > 0 || ttlSeconds <= 0 ? { $unset: { expiresAt: "" } } : {}),
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );
}

export async function upsertGraphLayoutOverrides(
  collection: Collection<GraphLayoutOverrideDocument>,
  rows: Array<{
    node_id: string;
    project?: string | null;
    x: number;
    y: number;
    layout_source?: string | null;
    layout_version?: string | null;
    updated_at?: Date;
  }>,
): Promise<number> {
  if (rows.length === 0) return 0;
  const now = new Date();

  await collection.bulkWrite(
    rows.map((row) => ({
      updateOne: {
        filter: { _id: row.node_id },
        update: {
          $set: {
            node_id: row.node_id,
            project: row.project ?? null,
            x: row.x,
            y: row.y,
            layout_source: row.layout_source ?? null,
            layout_version: row.layout_version ?? null,
            updated_at: row.updated_at ?? now,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        upsert: true,
      },
    })),
    { ordered: false },
  );

  return rows.length;
}

export async function upsertGraphNodeEmbeddings(
  collection: Collection<GraphNodeEmbeddingDocument>,
  rows: Array<{
    node_id: string;
    source_event_id: string;
    project?: string | null;
    embedding_model?: string | null;
    embedding_dimensions: number;
    embedding: number[];
    chunk_index?: number;
    chunk_count: number;
    text?: string;
    updated_at?: Date;
  }>,
): Promise<number> {
  if (rows.length === 0) return 0;
  const now = new Date();

  await collection.bulkWrite(
    rows.map((row) => ({
      updateOne: {
        filter: {
          _id: `${row.node_id}::${row.embedding_model ?? ""}::${row.embedding_dimensions}::${row.chunk_index ?? 0}`,
        },
        update: {
          $set: {
            node_id: row.node_id,
            source_event_id: row.source_event_id,
            project: row.project ?? null,
            embedding_model: row.embedding_model ?? null,
            embedding_dimensions: row.embedding_dimensions,
            embedding: row.embedding,
            chunk_index: row.chunk_index ?? 0,
            chunk_count: row.chunk_count,
            ...(row.text != null ? { text: row.text } : {}),
            updated_at: row.updated_at ?? now,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        upsert: true,
      },
    })),
    { ordered: false },
  );

  return rows.length;
}

export async function upsertGraphSemanticEdges(
  collection: Collection<GraphSemanticEdgeDocument>,
  rows: Array<{
    source_node_id: string;
    target_node_id: string;
    similarity: number;
    edge_type?: string;
    project?: string | null;
    embedding_model?: string | null;
    graph_version?: string | null;
    clustering_version?: string | null;
    source?: string | null;
    updated_at?: Date;
  }>,
): Promise<number> {
  if (rows.length === 0) return 0;
  const now = new Date();

  await collection.bulkWrite(
    rows.map((row) => {
      // Ensure consistent ordering: source < target
      const [sourceNodeId, targetNodeId] = row.source_node_id < row.target_node_id
        ? [row.source_node_id, row.target_node_id]
        : [row.target_node_id, row.source_node_id];
      const edgeId = `${sourceNodeId}||${targetNodeId}`;

      return {
        updateOne: {
          filter: { _id: edgeId },
          update: {
            $set: {
              source_node_id: sourceNodeId,
              target_node_id: targetNodeId,
              similarity: row.similarity,
              edge_type: row.edge_type ?? "semantic_similarity",
              project: row.project ?? null,
              embedding_model: row.embedding_model ?? null,
              graph_version: row.graph_version ?? null,
              clustering_version: row.clustering_version ?? null,
              source: row.source ?? null,
              updated_at: row.updated_at ?? now,
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

  return rows.length;
}

export async function upsertGraphSemanticForceSamples(
  collection: Collection<GraphSemanticForceSampleDocument>,
  rows: Array<{
    source_node_id: string;
    target_node_id: string;
    similarity: number;
    charge?: number;
    force_kind?: string;
    field_profile?: string;
    project?: string | null;
    embedding_model?: string | null;
    embedding_dimensions?: number | null;
    source?: string | null;
    updated_at?: Date;
  }>,
): Promise<number> {
  if (rows.length === 0) return 0;
  const now = new Date();

  await collection.bulkWrite(
    rows.map((row) => {
      const [sourceNodeId, targetNodeId] = row.source_node_id < row.target_node_id
        ? [row.source_node_id, row.target_node_id]
        : [row.target_node_id, row.source_node_id];
      const fieldProfile = row.field_profile ?? "layout.v1";
      const embeddingModel = row.embedding_model ?? null;
      const edgeId = `${sourceNodeId}||${targetNodeId}||${fieldProfile}||${embeddingModel ?? ""}`;

      return {
        updateOne: {
          filter: { _id: edgeId },
          update: {
            $set: {
              source_node_id: sourceNodeId,
              target_node_id: targetNodeId,
              similarity: row.similarity,
              charge: row.charge ?? row.similarity,
              force_kind: row.force_kind ?? "semantic_charge",
              field_profile: fieldProfile,
              project: row.project ?? null,
              embedding_model: embeddingModel,
              embedding_dimensions: row.embedding_dimensions ?? null,
              source: row.source ?? null,
              updated_at: row.updated_at ?? now,
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

  return rows.length;
}

export async function upsertGraphEdges(
  collection: Collection<GraphEdgeDocument>,
  rows: Array<{
    source_node_id: string;
    target_node_id: string;
    edge_kind: string;
    layer?: string | null;
    project?: string | null;
    source?: string | null;
    data?: Record<string, unknown> | null;
    updated_at?: Date;
  }>,
): Promise<number> {
  if (rows.length === 0) return 0;
  const now = new Date();

  await collection.bulkWrite(
    rows.map((row) => {
      // Edge ID includes kind to allow multiple edge types between same nodes
      const edgeId = `${row.source_node_id}||${row.target_node_id}||${row.edge_kind}`;

      return {
        updateOne: {
          filter: { _id: edgeId },
          update: {
            $set: {
              source_node_id: row.source_node_id,
              target_node_id: row.target_node_id,
              edge_kind: row.edge_kind,
              layer: row.layer ?? null,
              project: row.project ?? null,
              source: row.source ?? null,
              data: row.data ?? null,
              updated_at: row.updated_at ?? now,
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

  return rows.length;
}

/**
 * Full-text search on events.
 */
export async function ftsSearch(
  collection: Collection<EventDocument>,
  query: string,
  options: {
    limit?: number;
    source?: string;
    kind?: string;
    project?: string;
    session?: string;
    visibility?: string;
    quality?: "good" | "not_bad" | "any";
    excludeIds?: string[];
  } = {}
): Promise<unknown[]> {
  const limit = options.limit ?? 20;
  const filter: Record<string, unknown> = {
    $text: { $search: query },
  };

  if (options.source) filter.source = options.source;
  if (options.kind) filter.kind = options.kind;
  if (options.project) filter.project = options.project;
  if (options.session) filter.session = options.session;
  if (options.visibility) filter["extra.visibility"] = options.visibility;
  if (options.quality === "good") filter["extra.openplanner_labels.quality"] = "good";
  if (options.quality === "not_bad") filter["extra.openplanner_labels.quality"] = { $ne: "bad" };
  if (options.excludeIds?.length) filter.id = { $nin: options.excludeIds };

  const results = await collection
    .find(filter, {
      projection: {
        id: 1,
        ts: 1,
        source: 1,
        kind: 1,
        project: 1,
        session: 1,
        message: 1,
        role: 1,
        model: 1,
        extra: 1,
        text: { $substr: ["$text", 0, 240] },
      },
    })
    .sort({ ts: -1 })
    .limit(limit)
    .toArray();

  return results.map((r) => ({
    ...r,
    snippet: r.text,
    quality_label: (r.extra as any)?.openplanner_labels?.quality ?? null,
    tier: "hot",
  }));
}

/**
 * ILIKE-style search (case-insensitive substring match).
 */
export async function ilikeSearch(
  collection: Collection<EventDocument>,
  query: string,
  options: {
    limit?: number;
    source?: string;
    kind?: string;
    project?: string;
    session?: string;
    visibility?: string;
    quality?: "good" | "not_bad" | "any";
    excludeIds?: string[];
  } = {}
): Promise<unknown[]> {
  const limit = options.limit ?? 20;
  const filter: Record<string, unknown> = {
    text: { $regex: query, $options: "i" },
  };

  if (options.source) filter.source = options.source;
  if (options.kind) filter.kind = options.kind;
  if (options.project) filter.project = options.project;
  if (options.session) filter.session = options.session;
  if (options.visibility) filter["extra.visibility"] = options.visibility;
  if (options.quality === "good") filter["extra.openplanner_labels.quality"] = "good";
  if (options.quality === "not_bad") filter["extra.openplanner_labels.quality"] = { $ne: "bad" };
  if (options.excludeIds?.length) filter.id = { $nin: options.excludeIds };

  const results = await collection
    .find(filter, {
      projection: {
        id: 1,
        ts: 1,
        source: 1,
        kind: 1,
        project: 1,
        session: 1,
        message: 1,
        role: 1,
        model: 1,
        extra: 1,
        text: { $substr: ["$text", 0, 240] },
      },
    })
    .sort({ ts: -1 })
    .limit(limit)
    .toArray();

  return results.map((r) => ({
    ...r,
    snippet: r.text,
    quality_label: (r.extra as any)?.openplanner_labels?.quality ?? null,
    tier: "hot",
  }));
}

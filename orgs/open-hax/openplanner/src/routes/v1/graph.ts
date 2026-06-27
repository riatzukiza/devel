import type { FastifyPluginAsync } from "fastify";
import {
  buildEdgeClaimId as buildEdgeClaimIdFromCore,
  evaluateEdgeClaim,
  explainEdgeClaim,
  normalizeEdgeClaimDirection as normalizeEdgeClaimDirectionFromCore,
  normalizeEdgeClaimScope as normalizeEdgeClaimScopeFromCore,
  normalizeEdgeClaimStatus as normalizeEdgeClaimStatusFromCore,
  normalizeEdgeClaimInput,
  planEdgeClaimTransition,
  projectMongoEdgeClaims,
} from "@open-hax/openplanner-graph-claim-core";
import {
  cacheGet,
  cachePut,
  createMemoryLruCache,
  projectionEnvelope,
  type CacheHandle,
  type ProjectionEnvelope,
} from "@open-hax/openplanner-store-cache";
import { createHash } from "node:crypto";
import os from "node:os";
import { upsertGraphLayoutOverrides, upsertGraphNodeEmbeddings, upsertGraphSemanticEdges, upsertGraphSemanticForceSamples, upsertGraphEdges } from "../../lib/mongodb.js";
import type { GraphEdgeClaimDirection, GraphEdgeClaimDocument, GraphEdgeClaimStatus, GraphSemanticFieldCellDocument, GraphViewNodeDocument, GraphViewNodeSourceMetadata } from "../../lib/mongodb.js";
import { addMongoVectorParentLabel, queryMongoVectorsByText, removeMongoVectorParentLabel } from "../../lib/mongo-vectors.js";
import { extractTieredVectorHits } from "../../lib/vector-search.js";
import { formatEmbeddingQueryText, formatEmbeddingPassageText } from "../../lib/embedding-text.js";
import { prepareIndexDocument } from "../../lib/indexing.js";
import { counterInc } from "../../lib/metrics.js";

// Simplified graph routes for MongoDB-only backend
// Full graph functionality requires additional implementation

type ExportNode = {
  id: string;
  kind: string;
  label: string;
  lake?: string;
  nodeType?: string;
  data?: Record<string, unknown>;
  x?: number;
  y?: number;
};

type ExportEdge = {
  id: string;
  source: string;
  target: string;
  kind: string;
  lake?: string;
  edgeType?: string;
  sourceLake?: string;
  targetLake?: string;
  data?: Record<string, unknown>;
};

type ExportPayload = {
  ok: boolean;
  nodes: ExportNode[];
  edges: ExportEdge[];
};

type ViewNode = {
  id: string;
  kind: string;
  label: string;
  x: number;
  y: number;
  dataJson: string | null;
};

type ViewEdge = {
  source: string;
  target: string;
  kind: string;
  dataJson: string | null;
};

function envInt(name: string, fallback: number, min: number, max: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function graphProjectionCacheKey(kind: string, params: Record<string, unknown>): string {
  return `openplanner:graph-projection:${kind}:v1:${hashHex(JSON.stringify(params), 40)}`;
}

async function readCachedProjection<T>(params: {
  cache: CacheHandle;
  key: string;
  projectionName: string;
  metricKind: string;
  log?: { warn: (bindings: Record<string, unknown>, message: string) => void };
}): Promise<T | null> {
  try {
    const cached = await cacheGet<ProjectionEnvelope<T>>(params.cache, params.key);
    if (!cached || cached["projection/name"] !== params.projectionName) {
      counterInc("openplanner_projection_cache_misses_total", { projection: params.metricKind });
      return null;
    }
    counterInc("openplanner_projection_cache_hits_total", { projection: params.metricKind });
    return cached["projection/value"] ?? null;
  } catch (err) {
    counterInc("openplanner_projection_cache_errors_total", { projection: params.metricKind, operation: "get" });
    params.log?.warn({ err, cacheKey: params.key, projectionName: params.projectionName }, "graph projection cache get failed");
    return null;
  }
}

async function writeCachedProjection<T>(params: {
  cache: CacheHandle;
  key: string;
  ttlMs: number;
  projectionName: string;
  sourceCollection: string;
  sourceKey: string;
  value: T;
  metadata?: Record<string, unknown>;
  metricKind: string;
  log?: { warn: (bindings: Record<string, unknown>, message: string) => void };
}): Promise<void> {
  try {
    const envelope = projectionEnvelope<T>({
      name: params.projectionName,
      version: 1,
      sourceStore: "mongodb",
      sourceCollection: params.sourceCollection,
      sourceKey: params.sourceKey,
      value: params.value,
      metadata: params.metadata,
    });
    await cachePut(params.cache, params.key, envelope, params.ttlMs);
    counterInc("openplanner_projection_cache_writes_total", { projection: params.metricKind });
  } catch (err) {
    counterInc("openplanner_projection_cache_errors_total", { projection: params.metricKind, operation: "put" });
    params.log?.warn({ err, cacheKey: params.key, projectionName: params.projectionName }, "graph projection cache put failed");
  }
}

async function resolveWithTimeoutFallback<T>(params: {
  promise: Promise<T>;
  timeoutMs: number;
  fallback: () => T;
}): Promise<T> {
  let timer: NodeJS.Timeout | null = null;
  return await Promise.race([
    params.promise.finally(() => {
      if (timer) clearTimeout(timer);
    }),
    new Promise<T>((resolve) => {
      timer = setTimeout(() => resolve(params.fallback()), params.timeoutMs);
    }),
  ]);
}

function inferViewNodeFromId(nodeId: string, position: { x: number; y: number }): ViewNode {
  const [lake = "misc", kind = "node", ...restParts] = String(nodeId).split(":");
  const rest = restParts.join(":");

  const label = (() => {
    if (kind === "file") {
      const parts = rest.split("/").filter(Boolean);
      return parts[parts.length - 1] ?? nodeId;
    }
    if (kind === "url") {
      try {
        const url = new URL(rest);
        return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}`;
      } catch {
        return rest || nodeId;
      }
    }
    return rest || nodeId;
  })();

  const data: Record<string, unknown> = { lake };
  if (kind === "file") data.path = rest;
  if (kind === "url") data.url = rest;
  if (kind === "dep") data.dep = rest;

  return {
    id: nodeId,
    kind,
    label,
    x: position.x,
    y: position.y,
    dataJson: JSON.stringify(data),
  };
}

function hashPositionForNodeId(nodeId: string): { x: number; y: number } {
  let hash = 2166136261;
  for (let i = 0; i < nodeId.length; i += 1) {
    hash ^= nodeId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const a = (hash >>> 0) / 0xffffffff;
  const b = ((Math.imul(hash ^ 0x9e3779b9, 2246822519) >>> 0) / 0xffffffff);
  const angle = a * Math.PI * 2;
  const radius = 300 + (b * 4200);
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

function hashShardSlot(nodeId: string, shardCount: number): number {
  if (shardCount <= 1) return 0;
  let hash = 2166136261;
  for (let i = 0; i < nodeId.length; i += 1) {
    hash ^= nodeId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return positiveMod(hash >>> 0, shardCount);
}

function positiveMod(value: number, mod: number): number {
  if (mod <= 0) return 0;
  return ((value % mod) + mod) % mod;
}

function selectWindowOffset(params: {
  totalRows: number;
  windowSize: number;
  shardIndex: number;
  shardCount: number;
  rotationCursor: number;
}): number {
  const { totalRows, windowSize, shardIndex, shardCount, rotationCursor } = params;
  if (totalRows <= windowSize) return 0;

  const availableStarts = Math.max(1, totalRows - windowSize + 1);
  const shardStride = Math.max(1, windowSize);
  const shardSlot = (rotationCursor * shardCount) + shardIndex;
  const slotStart = positiveMod(shardSlot * shardStride, availableStarts);
  return Math.min(totalRows - windowSize, slotStart);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesNodeType(nodeId: string, nodeTypes: string[] | null): boolean {
  if (!nodeTypes || nodeTypes.length === 0) return true;
  return nodeTypes.some((nodeType) => nodeId.includes(`:${nodeType}:`) || nodeId.endsWith(`:${nodeType}`));
}

type GraphMemorySeedScore = {
  nodeId: string;
  score: number;
  project: string;
};

type GraphNodeEmbeddingCandidate = {
  node_id?: string;
  _id?: string;
  project?: string;
  score?: number;
  embedding?: number[];
};

type SemanticFieldParticle = {
  nodeId: string;
  project: string | null;
  embeddingModel: string | null;
  embeddingDimensions: number;
  embedding: number[];
  x: number;
  y: number;
};

type SemanticFieldCell = Omit<GraphSemanticFieldCellDocument, "_id" | "createdAt" | "updatedAt"> & {
  children: SemanticFieldCell[];
};

type SemanticFieldInteraction = {
  source: string;
  target: string;
  similarity: number;
  charge: number;
  sourceLevel: number;
  targetLevel: number;
};

const EDGE_CLAIM_ACTIVE_PROJECTABLE_STATUSES = ["supported", "active"] as const;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item ?? "").trim()).filter(Boolean))];
}

function clampConfidence(value: unknown, fallback = 0.5): number {
  const numeric = Number(value ?? fallback);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(1, numeric));
}

export function normalizeEdgeClaimStatus(value: unknown, fallback: GraphEdgeClaimStatus = "proposed"): GraphEdgeClaimStatus {
  return normalizeEdgeClaimStatusFromCore(value, fallback) as GraphEdgeClaimStatus;
}

export function normalizeEdgeClaimDirection(value: unknown): GraphEdgeClaimDirection {
  return normalizeEdgeClaimDirectionFromCore(value) as GraphEdgeClaimDirection;
}

export function buildEdgeClaimId(params: {
  sourceNodeId: string;
  targetNodeId: string;
  relationKind: string;
  direction: GraphEdgeClaimDirection;
  scope: Record<string, unknown> | null;
}): string {
  return buildEdgeClaimIdFromCore(params);
}

function normalizeEdgeClaimScope(value: unknown): Record<string, unknown> | null {
  return normalizeEdgeClaimScopeFromCore(value) as Record<string, unknown> | null;
}

function parseOptionalDate(value: unknown): Date | null {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function edgeClaimToApi(row: GraphEdgeClaimDocument): Record<string, unknown> {
  return {
    claim_id: row.claim_id,
    source_node_id: row.source_node_id,
    target_node_id: row.target_node_id,
    relation_kind: row.relation_kind,
    direction: row.direction,
    scope: row.scope ?? {},
    status: row.status,
    confidence: row.confidence,
    support_event_ids: row.support_event_ids ?? [],
    refute_event_ids: row.refute_event_ids ?? [],
    supersedes_claim_ids: row.supersedes_claim_ids ?? [],
    valid_from: row.valid_from,
    valid_until: row.valid_until,
    decay_policy: row.decay_policy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function semanticChargeFromSimilarity(similarity: unknown, alpha = 2.4): number {
  const sim = Number(similarity ?? 0);
  const safeSim = Number.isFinite(sim) ? Math.max(-1, Math.min(1, sim)) : 0;
  const safeAlpha = Number.isFinite(alpha) ? Math.max(0.01, alpha) : 2.4;
  return Math.tanh(safeSim * safeAlpha);
}

function clamp01(value: unknown, fallback = 0): number {
  const numeric = Number(value ?? fallback);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(1, numeric));
}

function normalizeVector(vector: number[]): number[] {
  let norm = 0;
  for (const value of vector) norm += value * value;
  const scale = Math.sqrt(norm);
  if (!Number.isFinite(scale) || scale <= 0) return vector;
  return vector.map((value) => value / scale);
}

function averageEmbeddingVectors(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const dimensions = vectors[0]?.length ?? 0;
  if (dimensions <= 0) return [];
  const sum = Array.from({ length: dimensions }, () => 0);
  let count = 0;
  for (const vector of vectors) {
    if (!Array.isArray(vector) || vector.length !== dimensions) continue;
    for (let index = 0; index < dimensions; index += 1) {
      const value = Number(vector[index] ?? 0);
      sum[index] += Number.isFinite(value) ? value : 0;
    }
    count += 1;
  }
  if (count === 0) return [];
  return normalizeVector(sum.map((value) => value / count));
}

function inferSourceKindFromNodeId(nodeId: string): string {
  const [, kind = "node"] = String(nodeId).split(":");
  return kind || "node";
}

function accessInstructionForSourceKind(sourceKind: string): string {
  switch (sourceKind) {
    case "file":
      return "Fetch the represented file/source path via graph node preview or repository file tools before quoting content.";
    case "url":
      return "Fetch the represented URL with the browser/web fetch path before relying on page content.";
    case "message":
    case "event":
      return "Retrieve the represented event/message by node id from OpenPlanner before using its text.";
    case "compact":
      return "Expand this compacted view node through graph view-node metadata, then inspect its represented sources.";
    default:
      return "Use the node id and source metadata to retrieve the underlying TruthGraph source before citing content.";
  }
}

function buildViewNodeId(params: { nodeIds: string[]; parentViewNodeId?: string | null; graphVersion?: string | null }): string {
  const digest = createHash("sha256")
    .update(JSON.stringify({
      nodeIds: [...params.nodeIds].sort(),
      parentViewNodeId: params.parentViewNodeId ?? null,
      graphVersion: params.graphVersion ?? null,
    }))
    .digest("hex")
    .slice(0, 24);
  return `view:compact:${digest}`;
}

function graphViewNodeToApi(row: GraphViewNodeDocument): Record<string, unknown> {
  return {
    view_node_id: row.view_node_id,
    view_kind: row.view_kind,
    status: row.status,
    project: row.project,
    graph_version: row.graph_version,
    parent_view_node_id: row.parent_view_node_id,
    child_node_ids: row.child_node_ids,
    child_view_node_ids: row.child_view_node_ids,
    descendant_node_count: row.descendant_node_count,
    embedding_model: row.embedding_model,
    embedding_dimensions: row.embedding_dimensions,
    saturation: row.saturation,
    average_child_saturation: row.average_child_saturation,
    expansion_threshold: row.expansion_threshold,
    compaction_scalar: row.compaction_scalar,
    resource_pressure: row.resource_pressure,
    source_metadata: row.source_metadata,
    updated_at: row.updated_at,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function semanticFieldCellToApi(row: GraphSemanticFieldCellDocument | SemanticFieldCell): Record<string, unknown> {
  return {
    cell_id: row.cell_id,
    fieldProfile: row.field_profile,
    project: row.project,
    embeddingModel: row.embedding_model,
    embeddingDimensions: row.embedding_dimensions,
    level: row.level,
    ix: row.ix,
    iy: row.iy,
    bounds: row.bounds,
    center: { x: row.center_x, y: row.center_y },
    halfExtent: row.half_extent,
    mass: row.mass,
    nodeCount: row.node_count,
    nodeIds: row.node_ids,
    childCellIds: row.child_cell_ids,
    charge: row.charge,
    source: row.source,
    updatedAt: row.updated_at,
    compatibilityKind: "semantic_field_cell",
  };
}

function semanticFieldBounds(particles: SemanticFieldParticle[]): { minX: number; minY: number; maxX: number; maxY: number } {
  if (particles.length === 0) return { minX: -1, minY: -1, maxX: 1, maxY: 1 };
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const particle of particles) {
    minX = Math.min(minX, particle.x);
    minY = Math.min(minY, particle.y);
    maxX = Math.max(maxX, particle.x);
    maxY = Math.max(maxY, particle.y);
  }
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const side = Math.max(width, height);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return { minX: cx - side / 2, minY: cy - side / 2, maxX: cx + side / 2, maxY: cy + side / 2 };
}

function buildSemanticFieldCells(params: {
  particles: SemanticFieldParticle[];
  fieldProfile: string;
  project: string | null;
  maxDepth: number;
  maxLeafSize: number;
  now: Date;
  source: string;
}): SemanticFieldCell[] {
  const bounds = semanticFieldBounds(params.particles);
  const allCells: SemanticFieldCell[] = [];
  const root = buildSemanticFieldCellRecursive({
    ...params,
    particles: params.particles,
    bounds,
    level: 0,
    ix: 0,
    iy: 0,
    allCells,
  });
  return root ? allCells : [];
}

function buildSemanticFieldCellRecursive(params: {
  particles: SemanticFieldParticle[];
  fieldProfile: string;
  project: string | null;
  maxDepth: number;
  maxLeafSize: number;
  now: Date;
  source: string;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  level: number;
  ix: number;
  iy: number;
  allCells: SemanticFieldCell[];
}): SemanticFieldCell | null {
  if (params.particles.length === 0) return null;
  const midX = (params.bounds.minX + params.bounds.maxX) / 2;
  const midY = (params.bounds.minY + params.bounds.maxY) / 2;
  const canSplit = params.level < params.maxDepth && params.particles.length > params.maxLeafSize;
  const children: SemanticFieldCell[] = [];
  if (canSplit) {
    const quadrants: SemanticFieldParticle[][] = [[], [], [], []];
    for (const particle of params.particles) {
      const east = particle.x >= midX;
      const north = particle.y >= midY;
      const index = !east && north ? 0 : east && north ? 1 : !east && !north ? 2 : 3;
      quadrants[index]!.push(particle);
    }
    const childBounds = [
      { minX: params.bounds.minX, minY: midY, maxX: midX, maxY: params.bounds.maxY },
      { minX: midX, minY: midY, maxX: params.bounds.maxX, maxY: params.bounds.maxY },
      { minX: params.bounds.minX, minY: params.bounds.minY, maxX: midX, maxY: midY },
      { minX: midX, minY: params.bounds.minY, maxX: params.bounds.maxX, maxY: midY },
    ];
    for (let index = 0; index < quadrants.length; index += 1) {
      const child = buildSemanticFieldCellRecursive({
        ...params,
        particles: quadrants[index]!,
        bounds: childBounds[index]!,
        level: params.level + 1,
        ix: params.ix * 2 + (index === 1 || index === 3 ? 1 : 0),
        iy: params.iy * 2 + (index === 0 || index === 1 ? 1 : 0),
      });
      if (child) children.push(child);
    }
  }

  const embedding = averageEmbeddingVectors(params.particles.map((particle) => particle.embedding));
  const nodeIds = params.particles.map((particle) => particle.nodeId).sort();
  const cellId = `field:semantic:${hashHex(JSON.stringify({
    fieldProfile: params.fieldProfile,
    level: params.level,
    ix: params.ix,
    iy: params.iy,
    nodeIds,
  }), 24)}`;
  const cell: SemanticFieldCell = {
    cell_id: cellId,
    field_profile: params.fieldProfile,
    project: params.project,
    embedding_model: params.particles[0]?.embeddingModel ?? null,
    embedding_dimensions: params.particles[0]?.embeddingDimensions ?? null,
    level: params.level,
    ix: params.ix,
    iy: params.iy,
    bounds: {
      min_x: params.bounds.minX,
      min_y: params.bounds.minY,
      max_x: params.bounds.maxX,
      max_y: params.bounds.maxY,
    },
    center_x: params.particles.reduce((sum, particle) => sum + particle.x, 0) / Math.max(1, params.particles.length),
    center_y: params.particles.reduce((sum, particle) => sum + particle.y, 0) / Math.max(1, params.particles.length),
    half_extent: Math.max(params.bounds.maxX - params.bounds.minX, params.bounds.maxY - params.bounds.minY) / 2,
    mass: params.particles.length,
    node_count: params.particles.length,
    node_ids: nodeIds,
    child_cell_ids: children.map((child) => child.cell_id),
    centroid_embedding: embedding,
    charge: semanticChargeFromSimilarity(0),
    source: params.source,
    updated_at: params.now,
    children,
  };
  params.allCells.push(cell);
  return cell;
}

function collectSemanticFieldPairs(cells: SemanticFieldCell[], theta: number, maxPairs: number): Array<[SemanticFieldCell, SemanticFieldCell]> {
  const root = cells.find((cell) => cell.level === 0);
  if (!root) return [];
  const pairs: Array<[SemanticFieldCell, SemanticFieldCell]> = [];
  const pushPair = (left: SemanticFieldCell, right: SemanticFieldCell): void => {
    if (pairs.length >= maxPairs || left.cell_id === right.cell_id) return;
    const dx = left.center_x - right.center_x;
    const dy = left.center_y - right.center_y;
    const dist = Math.max(1e-6, Math.sqrt(dx * dx + dy * dy));
    const size = Math.max(left.half_extent, right.half_extent) * 2;
    const farEnough = size / dist < theta;
    if (farEnough || (left.children.length === 0 && right.children.length === 0)) {
      pairs.push([left, right]);
      return;
    }
    const splitLeft = left.children.length > 0 && (left.half_extent >= right.half_extent || right.children.length === 0);
    const expanded = splitLeft ? left.children.map((child) => [child, right] as const) : right.children.map((child) => [left, child] as const);
    for (const [a, b] of expanded) {
      if (pairs.length >= maxPairs) return;
      pushPair(a, b);
    }
  };
  const walk = (cell: SemanticFieldCell): void => {
    for (const child of cell.children) walk(child);
    for (let i = 0; i < cell.children.length; i += 1) {
      for (let j = i + 1; j < cell.children.length; j += 1) {
        if (pairs.length >= maxPairs) return;
        pushPair(cell.children[i]!, cell.children[j]!);
      }
    }
  };
  walk(root);
  return pairs;
}

function localCosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || left.length !== right.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index]! * right[index]!;
    normA += left[index]! * left[index]!;
    normB += right[index]! * right[index]!;
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? Math.max(-1, Math.min(1, dot / denominator)) : 0;
}

async function compareSemanticFieldPairs(params: {
  pairs: Array<[SemanticFieldCell, SemanticFieldCell]>;
  vexxBaseUrl: string;
  vexxApiKey?: string;
  device: string;
  requireAccel: boolean;
  timeoutMs: number;
  chargeAlpha: number;
}): Promise<{ interactions: SemanticFieldInteraction[]; provider: string; vexxCalls: number; vexxFailures: number }> {
  const interactions: SemanticFieldInteraction[] = [];
  let vexxCalls = 0;
  let vexxFailures = 0;
  let provider = "local-cosine";
  const byLeft = new Map<string, { left: SemanticFieldCell; right: SemanticFieldCell[] }>();
  for (const [left, right] of params.pairs) {
    const row = byLeft.get(left.cell_id) ?? { left, right: [] };
    row.right.push(right);
    byLeft.set(left.cell_id, row);
  }

  for (const row of byLeft.values()) {
    const validRight = row.right.filter((right) => right.centroid_embedding.length === row.left.centroid_embedding.length);
    if (validRight.length === 0) continue;
    const baseUrl = params.vexxBaseUrl.trim().replace(/\/$/, "");
    let scores: number[] | null = null;
    if (baseUrl) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), Math.max(1000, params.timeoutMs));
      try {
        const response = await fetch(`${baseUrl}/v1/cosine/matrix`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(params.vexxApiKey ? { authorization: `Bearer ${params.vexxApiKey}` } : {}),
          },
          body: JSON.stringify({
            left: [row.left.centroid_embedding],
            right: validRight.map((right) => right.centroid_embedding),
            device: params.device,
            requireAccel: params.requireAccel,
          }),
          signal: controller.signal,
        });
        if (response.ok) {
          const payload = await response.json() as { matrix?: number[]; provider?: string; device?: string };
          if (Array.isArray(payload.matrix) && payload.matrix.length === validRight.length) {
            scores = payload.matrix.map((score) => Number(score));
            provider = `vexx:${payload.provider ?? payload.device ?? params.device}`;
            vexxCalls += 1;
          }
        }
      } catch {
        vexxFailures += 1;
      } finally {
        clearTimeout(timeout);
      }
    }
    const finalScores = scores ?? validRight.map((right) => localCosineSimilarity(row.left.centroid_embedding, right.centroid_embedding));
    for (let index = 0; index < validRight.length; index += 1) {
      const similarity = Math.max(-1, Math.min(1, Number(finalScores[index] ?? 0)));
      interactions.push({
        source: row.left.cell_id,
        target: validRight[index]!.cell_id,
        similarity,
        charge: semanticChargeFromSimilarity(similarity, params.chargeAlpha),
        sourceLevel: row.left.level,
        targetLevel: validRight[index]!.level,
      });
    }
  }
  return { interactions, provider, vexxCalls, vexxFailures };
}

function hostResourcePressureScalar(): { scalar: number; components: Record<string, number> } {
  const totalMem = Math.max(1, os.totalmem());
  const freeMem = Math.max(0, os.freemem());
  const memoryPressure = clamp01(1 - (freeMem / totalMem), 0);
  const cpuCount = Math.max(1, os.cpus().length);
  const loadPressure = clamp01((os.loadavg()[0] ?? 0) / cpuCount, 0);
  const heap = process.memoryUsage();
  const heapPressure = clamp01(heap.heapTotal > 0 ? heap.heapUsed / heap.heapTotal : 0, 0);
  const scalar = clamp01((memoryPressure * 0.45) + (loadPressure * 0.35) + (heapPressure * 0.2), 0);
  return {
    scalar,
    components: {
      memoryPressure,
      loadPressure,
      heapPressure,
    },
  };
}

function semanticForceSampleToApi(row: any): Record<string, unknown> {
  return {
    source: row.source_node_id,
    target: row.target_node_id,
    similarity: row.similarity,
    charge: row.charge,
    forceKind: row.force_kind,
    fieldProfile: row.field_profile,
    project: row.project,
    embeddingModel: row.embedding_model,
    embeddingDimensions: row.embedding_dimensions,
    sourceSystem: row.source,
    updatedAt: row.updated_at,
    compatibilityKind: "semantic_force_sample",
  };
}

function semanticCircuitConductance(similarity: unknown, reinforcement = 1): number {
  const sim = Math.max(0, Math.min(1, Number(similarity ?? 0)));
  const gain = Math.max(0, Number(reinforcement ?? 1));
  return Math.max(0, sim * gain);
}

function decayedConductance(params: {
  conductance: number;
  lastReinforcedAt: Date;
  now: Date;
  halfLifeMs: number;
}): number {
  const ageMs = Math.max(0, params.now.getTime() - params.lastReinforcedAt.getTime());
  const halfLifeMs = Math.max(1, params.halfLifeMs);
  return Math.max(0, Number(params.conductance ?? 0)) * Math.pow(0.5, ageMs / halfLifeMs);
}

function hashHex(value: string, length = 24): string {
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}

function stableUnitInterval(value: string): number {
  const hex = hashHex(value, 12);
  return Number.parseInt(hex, 16) / 0xffffffffffff;
}

function fadeNoise(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(left: number, right: number, t: number): number {
  return left + ((right - left) * t);
}

export function simplexTrailNoise(seed: string, timeSeconds: number, scaleSeconds = 90): number {
  const scaled = Math.max(0, timeSeconds / Math.max(1, scaleSeconds));
  const cell = Math.floor(scaled);
  const local = scaled - cell;
  const grad0 = stableUnitInterval(`${seed}:${cell}`) < 0.5 ? -1 : 1;
  const grad1 = stableUnitInterval(`${seed}:${cell + 1}`) < 0.5 ? -1 : 1;
  const n0 = grad0 * local;
  const n1 = grad1 * (local - 1);
  return Math.max(-1, Math.min(1, lerp(n0, n1, fadeNoise(local)) * 2));
}

export function decayedTrailInfluence(params: {
  activation: number;
  emittedAt: Date;
  now: Date;
  halfLifeSeconds: number;
}): number {
  const ageSeconds = Math.max(0, (params.now.getTime() - params.emittedAt.getTime()) / 1000);
  const halfLife = Math.max(1, params.halfLifeSeconds);
  return clampConfidence(params.activation, 0) * Math.pow(0.5, ageSeconds / halfLife);
}

function undirectedEdgeKey(sourceId: string, targetId: string): string {
  return sourceId < targetId ? `${sourceId}||${targetId}` : `${targetId}||${sourceId}`;
}

function sortGraphMemorySeedScores(rows: GraphMemorySeedScore[]): GraphMemorySeedScore[] {
  return rows.sort((a, b) => b.score - a.score);
}

function filterGraphMemorySeedScores(params: {
  rows: GraphNodeEmbeddingCandidate[];
  lakeRegexes: RegExp[];
  nodeTypes: string[] | null;
  minVectorSimilarity: number;
}): GraphMemorySeedScore[] {
  const { rows, lakeRegexes, nodeTypes, minVectorSimilarity } = params;
  return sortGraphMemorySeedScores(
    rows
      .map((doc) => ({
        nodeId: String(doc.node_id ?? doc._id ?? ""),
        score: typeof doc.score === "number" ? doc.score : Number.NEGATIVE_INFINITY,
        project: String(doc.project ?? ""),
      }))
      .filter((doc) => doc.nodeId.length > 0)
      .filter((doc) => doc.score >= minVectorSimilarity)
      .filter((doc) => lakeRegexes.length === 0 || lakeRegexes.some((pattern: RegExp) => pattern.test(doc.nodeId)))
      .filter((doc) => matchesNodeType(doc.nodeId, nodeTypes)),
  );
}

async function fallbackGraphMemorySeedSearch(params: {
  graphNodeEmbeddings: any;
  queryEmbedding: number[];
  lakeRegexes: RegExp[];
  nodeTypes: string[] | null;
  minVectorSimilarity: number;
  maxCandidates: number;
  k: number;
}): Promise<GraphMemorySeedScore[]> {
  const { graphNodeEmbeddings, queryEmbedding, lakeRegexes, nodeTypes, minVectorSimilarity, maxCandidates, k } = params;

  const embedFilter: Record<string, unknown> = { embedding: { $exists: true } };
  if (lakeRegexes.length > 0) {
    embedFilter.node_id = { $in: lakeRegexes };
  }

  const totalCandidates = await graphNodeEmbeddings.countDocuments(embedFilter);
  const fetchLimit = Math.min(50000, Math.max(k, maxCandidates), totalCandidates);
  const scored: GraphMemorySeedScore[] = [];

  const vexxBaseUrl = process.env.VEXX_BASE_URL || "http://host.docker.internal:8791";
  const vexxTimeoutMs = 30000;
  const fetchBatchSize = 500;

  const cursor = graphNodeEmbeddings.find(
    embedFilter,
    { projection: { node_id: 1, embedding: 1, project: 1 } },
  ).limit(fetchLimit).batchSize(fetchBatchSize);

  let done = false;
  while (!done) {
    const batchDocs: GraphNodeEmbeddingCandidate[] = [];
    for (let i = 0; i < fetchBatchSize; i += 1) {
      const doc = await cursor.next();
      if (doc === null) {
        done = true;
        break;
      }
      batchDocs.push(doc as GraphNodeEmbeddingCandidate);
    }

    const validDocs = batchDocs.filter((doc) => {
      const embedding = doc.embedding as number[] | undefined;
      return Array.isArray(embedding) && embedding.length === queryEmbedding.length;
    });
    if (validDocs.length === 0) continue;

    const batchEmbeddings = validDocs.map((doc) => doc.embedding as number[]);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), vexxTimeoutMs);
      const res = await fetch(`${vexxBaseUrl}/v1/cosine/matrix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          left: [queryEmbedding],
          right: batchEmbeddings,
          device: "AUTO",
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const payload = await res.json() as { matrix?: number[] };
        const matrix = payload.matrix;
        if (Array.isArray(matrix) && matrix.length === validDocs.length) {
          for (let i = 0; i < validDocs.length; i += 1) {
            const similarity = matrix[i]!;
            const doc = validDocs[i]!;
            const nodeId = String(doc.node_id ?? doc._id ?? "");
            if (similarity < minVectorSimilarity || !matchesNodeType(nodeId, nodeTypes)) continue;
            scored.push({ nodeId, score: similarity, project: String(doc.project ?? "") });
          }
          continue;
        }
      }
    } catch {
      // Fall through to local cosine.
    }

    for (const doc of validDocs) {
      const embedding = doc.embedding as number[];
      let dot = 0;
      let normA = 0;
      let normB = 0;
      for (let index = 0; index < queryEmbedding.length; index += 1) {
        dot += queryEmbedding[index]! * embedding[index]!;
        normA += queryEmbedding[index]! * queryEmbedding[index]!;
        normB += embedding[index]! * embedding[index]!;
      }
      const denominator = Math.sqrt(normA) * Math.sqrt(normB);
      if (denominator === 0) continue;
      const similarity = dot / denominator;
      const nodeId = String(doc.node_id ?? doc._id ?? "");
      if (similarity < minVectorSimilarity || !matchesNodeType(nodeId, nodeTypes)) continue;
      scored.push({ nodeId, score: similarity, project: String(doc.project ?? "") });
    }
  }

  return sortGraphMemorySeedScores(scored);
}

export async function resolveGraphMemorySeedNodes(params: {
  nativeVectorSearch: () => Promise<GraphNodeEmbeddingCandidate[]>;
  fallbackVectorSearch: () => Promise<GraphMemorySeedScore[]>;
  lakeRegexes: RegExp[];
  nodeTypes: string[] | null;
  minVectorSimilarity: number;
  k: number;
  logger?: { warn?: (...args: any[]) => void; info?: (...args: any[]) => void };
}): Promise<{ seedNodeIds: string[]; seedScoresMap: Map<string, number>; vectorHitCount: number }> {
  const { nativeVectorSearch, fallbackVectorSearch, lakeRegexes, nodeTypes, minVectorSimilarity, k, logger } = params;

  let scored: GraphMemorySeedScore[] = [];
  let useFallback = false;

  try {
    scored = filterGraphMemorySeedScores({
      rows: await nativeVectorSearch(),
      lakeRegexes,
      nodeTypes,
      minVectorSimilarity,
    });

    if (scored.length === 0) {
      useFallback = true;
      logger?.info?.({ lakes: lakeRegexes.length, nodeTypes }, "memory: native graph vector search returned no seeds, using fallback");
    }
  } catch (error) {
    useFallback = true;
    logger?.warn?.({ err: error }, "memory: native vector search unavailable, using fallback");
  }

  if (useFallback) {
    scored = await fallbackVectorSearch();
  }

  const topK = scored.slice(0, k);
  return {
    seedNodeIds: topK.map((entry) => entry.nodeId),
    seedScoresMap: new Map(topK.map((entry) => [entry.nodeId, entry.score] as const)),
    vectorHitCount: scored.length,
  };
}

export const graphRoutes: FastifyPluginAsync = async (app) => {
  const graphProjectionCache = createMemoryLruCache({
    maxEntries: envInt("OPENPLANNER_GRAPH_PROJECTION_CACHE_MAX_ENTRIES", 128, 8, 5000),
    defaultTtlMs: envInt("OPENPLANNER_GRAPH_PROJECTION_CACHE_TTL_MS", 60_000, 1_000, 60 * 60 * 1000),
  });
  const graphProjectionInflight = new Map<string, Promise<unknown>>();
  const graphExportCacheTtlMs = envInt("OPENPLANNER_GRAPH_EXPORT_CACHE_TTL_MS", 120_000, 5_000, 60 * 60 * 1000);
  const graphViewCacheTtlMs = envInt("OPENPLANNER_GRAPH_VIEW_CACHE_TTL_MS", 60_000, 5_000, 60 * 60 * 1000);
  const graphViewBuildTimeoutMs = envInt("OPENPLANNER_GRAPH_VIEW_BUILD_TIMEOUT_MS", 8_000, 500, 60_000);

  // Graph export for multi-lake graph weaving
  app.get("/graph/export", async (req: any, reply) => {
    const projectsParam = typeof req.query?.projects === "string" ? req.query.projects.trim() : "";
    const includeLayout = req.query?.includeLayout === "true" || req.query?.includeLayout === true;
    const includeSemantic = req.query?.includeSemantic === "true" || req.query?.includeSemantic === true;
    const semanticMinSimilarity = Math.max(0, Math.min(1, Number(req.query?.semanticMinSimilarity ?? 0.7)));
    const maxNodes = Math.max(100, Math.min(60_000, Number(req.query?.maxNodes ?? 12_000)));
    const maxEdges = Math.max(100, Math.min(240_000, Number(req.query?.maxEdges ?? 40_000)));
    const maxSemanticEdges = Math.max(0, Math.min(240_000, Number(req.query?.maxSemanticEdges ?? maxEdges)));
    const cacheKey = graphProjectionCacheKey("export", {
      projectsParam,
      includeLayout,
      includeSemantic,
      semanticMinSimilarity,
      maxNodes,
      maxEdges,
      maxSemanticEdges,
    });
    const cachedExport = await readCachedProjection<ExportPayload>({
      cache: graphProjectionCache,
      key: cacheKey,
      projectionName: "openplanner.graph/export",
      metricKind: "graph_export",
      log: req.log,
    });
    if (cachedExport) return cachedExport;

    const pendingExport = graphProjectionInflight.get(cacheKey) as Promise<ExportPayload> | undefined;
    if (pendingExport) {
      counterInc("openplanner_projection_cache_inflight_hits_total", { projection: "graph_export" });
      return await pendingExport;
    }

    const exportBuild: Promise<ExportPayload> = (async () => {

    const projects = projectsParam ? projectsParam.split(",").map((p: string) => p.trim()).filter(Boolean) : [];
    const projectFilter = projects.length > 0 ? { project: { $in: [...projects, null] } } : {};
    const nodeProjectFilter = projects.length > 0 ? { project: { $in: projects } } : {};

    const nodeProjection = {
      "extra.node_id": 1, "extra.node_kind": 1, "extra.label": 1,
      "extra.path": 1, "extra.url": 1, "extra.lake": 1, "extra.node_type": 1,
      "extra.content_hash": 1, "extra.preview": 1, "extra.entity_key": 1,
      project: 1, message: 1,
    };

    const nodeDocs = await app.mongo.events
      .find({ kind: "graph.node", ...nodeProjectFilter }, { projection: nodeProjection })
      .limit(maxNodes)
      .toArray() as any[];

    const nodeIds = new Set<string>();
    for (const doc of nodeDocs) {
      const extra = doc.extra ?? {};
      const nodeId = extra.node_id ?? doc.message ?? doc._id;
      if (typeof nodeId === "string" && nodeId) nodeIds.add(nodeId);
    }
    const nodeIdList = [...nodeIds];

    const nodeBoundaryFilter = nodeIdList.length > 0
      ? {
          $or: [
            { source_node_id: { $in: nodeIdList } },
            { target_node_id: { $in: nodeIdList } },
          ],
        }
      : {};
    const scopedEdgeFilter = nodeIdList.length > 0
      ? (projects.length > 0 ? { $and: [projectFilter, nodeBoundaryFilter] } : nodeBoundaryFilter)
      : projectFilter;
    const semanticFilter = nodeIdList.length > 0
      ? { $and: [{ similarity: { $gte: semanticMinSimilarity } }, nodeBoundaryFilter] }
      : { similarity: { $gte: semanticMinSimilarity } };

    const [edgeDocs, layoutRows, semanticEdgeDocs] = await Promise.all([
      app.mongo.graphEdges.find(scopedEdgeFilter).limit(maxEdges).toArray(),
      includeLayout && nodeIdList.length > 0
        ? app.mongo.graphLayoutOverrides.find({ node_id: { $in: nodeIdList } }).limit(maxNodes).toArray()
        : Promise.resolve([]),
      includeSemantic && maxSemanticEdges > 0
        ? app.mongo.graphSemanticEdges.find(semanticFilter).limit(maxSemanticEdges).toArray()
        : Promise.resolve([]),
    ]) as [any[], any[], any[]];

    const layoutById = new Map<string, { x: number; y: number }>();
    for (const row of layoutRows) {
      if (typeof row.node_id === "string" && typeof row.x === "number" && typeof row.y === "number") {
        layoutById.set(row.node_id, { x: row.x, y: row.y });
      }
    }

    const nodes: ExportNode[] = nodeDocs.map((doc: any) => {
      const extra = doc.extra ?? {};
      const nodeId = extra.node_id ?? doc.message ?? doc._id;
      nodeIds.add(nodeId);
      const layout = layoutById.get(nodeId);

      const rawLabel = extra.label ?? extra.path ?? doc.message ?? "";
      const preview = typeof extra.preview === "string" ? extra.preview : "";
      let label = rawLabel;
      if (!label && preview) {
        label = preview.length > 80 ? preview.slice(0, 77) + "..." : preview;
      }
      if (!label) {
        const parts = nodeId.split(":");
        label = parts.length > 2 ? parts.slice(2).join(":").slice(0, 60) : nodeId.slice(0, 60);
      }

      return {
        id: nodeId,
        kind: extra.node_kind ?? "unknown",
        label,
        lake: extra.lake ?? doc.project,
        nodeType: extra.node_type,
        data: {
          path: extra.path,
          url: extra.url,
          content_hash: extra.content_hash,
          preview: extra.preview,
          entity_key: extra.entity_key,
        },
        ...(layout ? { x: layout.x, y: layout.y } : {}),
      };
    });

    const edges: ExportEdge[] = edgeDocs.map((doc: any) => {
      const src = doc.source_node_id ?? "";
      const tgt = doc.target_node_id ?? "";
      const data = doc.data ?? {};
      const edgeKind = doc.edge_kind ?? data.edge_type ?? "unknown";
      return {
        id: doc._id,
        source: src,
        target: tgt,
        kind: edgeKind,
        lake: data.lake ?? doc.project,
        edgeType: data.edge_type ?? edgeKind,
        sourceLake: data.source_lake,
        targetLake: data.target_lake,
        data: {
          source: data.source,
          target: data.target,
          source_host: data.source_host,
          target_host: data.target_host,
          discovery_channel: data.discovery_channel,
          anchor_text: data.anchor_text,
        },
      };
    }).filter((e: ExportEdge) => e.source && e.target);

    if (includeSemantic && semanticEdgeDocs.length > 0) {
      for (const doc of semanticEdgeDocs) {
        const src = doc.source_node_id ?? "";
        const tgt = doc.target_node_id ?? "";
        if (!src || !tgt) continue;
        if (!nodeIds.has(src) || !nodeIds.has(tgt)) continue;
        const edgeKind = doc.edge_type === "semantic_knn" ? "semantic_knn" : "semantic_similarity";
        edges.push({
          id: `${src}||${tgt}:${edgeKind}`,
          source: src,
          target: tgt,
          kind: edgeKind,
          lake: "semantic",
          edgeType: edgeKind,
          data: {
            similarity: doc.similarity,
            conductance: doc.conductance,
            resistance: doc.resistance,
            status: doc.status,
            reinforcement_count: doc.reinforcement_count,
            last_reinforced_at: doc.last_reinforced_at,
            decay_half_life_ms: doc.decay_half_life_ms,
            embedding_model: doc.embedding_model,
            source: doc.source,
          },
        });
      }
    }

    const response = { ok: true, nodes, edges } satisfies ExportPayload;
    await writeCachedProjection({
      cache: graphProjectionCache,
      key: cacheKey,
      ttlMs: graphExportCacheTtlMs,
      projectionName: "openplanner.graph/export",
      sourceCollection: "events,graph_edges,graph_semantic_edges,graph_layout_overrides",
      sourceKey: cacheKey,
      value: response,
      metadata: {
        projects,
        includeLayout,
        includeSemantic,
        semanticMinSimilarity,
        maxNodes,
        maxEdges,
        maxSemanticEdges,
      },
      metricKind: "graph_export",
      log: req.log,
    });
    return response;
    })();

    graphProjectionInflight.set(cacheKey, exportBuild);
    try {
      return await exportBuild;
    } finally {
      if (graphProjectionInflight.get(cacheKey) === exportBuild) {
        graphProjectionInflight.delete(cacheKey);
      }
    }
  });

  // Graph layout upsert endpoint
  app.post("/graph/layout/upsert", async (req: any, reply) => {
    const source = req.body?.source ?? "graph-weaver";
    const layoutVersion = req.body?.layoutVersion ?? "v1";
    const inputs = Array.isArray(req.body?.inputs) ? req.body.inputs : [];
    
    if (inputs.length === 0) {
      return { ok: true, stored: 0 };
    }

    const rows = inputs.map((input: any) => ({
      node_id: String(input.id),
      x: Number(input.x ?? 0),
      y: Number(input.y ?? 0),
      layout_source: source,
      layout_version: layoutVersion,
      updated_at: new Date(),
    }));

    const stored = await upsertGraphLayoutOverrides(app.mongo.graphLayoutOverrides, rows);
    return { ok: true, stored };
  });

  // Graph layout endpoints
  app.post("/graph/layout", async (req: any, reply) => {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (rows.length === 0) {
      return reply.status(400).send({ error: "rows array required" });
    }

    const count = await upsertGraphLayoutOverrides(app.mongo.graphLayoutOverrides, rows.map((row: any) => ({
      node_id: String(row.node_id ?? row.id),
      project: row.project,
      x: Number(row.x ?? 0),
      y: Number(row.y ?? 0),
      layout_source: row.layout_source,
      layout_version: row.layout_version,
      updated_at: row.updated_at ? new Date(row.updated_at) : undefined,
    })));

    return { ok: true, upserted: count };
  });

  app.get("/graph/layout", async (req: any) => {
    const project = typeof req.query?.project === "string" ? req.query.project.trim() : undefined;
    const filter: Record<string, unknown> = {};
    if (project) filter.project = project;
    
    const rows = await app.mongo.graphLayoutOverrides.find(filter).sort({ updated_at: -1 }).limit(10000).toArray();
    return { ok: true, count: rows.length, rows };
  });

  // Graph node embeddings
  app.post("/graph/embeddings", async (req: any, reply) => {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (rows.length === 0) {
      return reply.status(400).send({ error: "rows array required" });
    }

    const count = await upsertGraphNodeEmbeddings(app.mongo.graphNodeEmbeddings, rows.map((row: any) => ({
      node_id: String(row.node_id ?? row.id),
      source_event_id: String(row.source_event_id ?? row.node_id),
      project: row.project,
      embedding_model: row.embedding_model,
      embedding_dimensions: Number(row.embedding_dimensions ?? (Array.isArray(row.embedding) ? row.embedding.length : 0)),
      embedding: Array.isArray(row.embedding) ? row.embedding : [],
      chunk_count: Number(row.chunk_count ?? 1),
      updated_at: row.updated_at ? new Date(row.updated_at) : undefined,
    })));

    return { ok: true, upserted: count };
  });

  app.get("/graph/embeddings", async (req: any) => {
    const project = typeof req.query?.project === "string" ? req.query.project.trim() : undefined;
    const filter: Record<string, unknown> = {};
    if (project) filter.project = project;
    
    const rows = await app.mongo.graphNodeEmbeddings.find(filter).sort({ updated_at: -1 }).limit(10000).toArray();
    return { ok: true, count: rows.length, rows };
  });

  // Graph stats
  app.get("/graph/stats", async () => {
    const nodeCount = await app.mongo.events.countDocuments({ kind: "graph.node" });
    const edgeCount = await app.mongo.events.countDocuments({ kind: "graph.edge" });
    return {
      ok: true,
      nodeCount,
      edgeCount,
      storageBackend: "mongodb",
    };
  });

  app.post("/graph/view", async (req: any, reply) => {
    const maxNodes = Math.max(50, Math.min(20000, Number(req.body?.maxNodes ?? 6000)));
    const maxEdges = Math.max(50, Math.min(100000, Number(req.body?.maxEdges ?? 12000)));
    const poolMultiplier = Math.max(2, Math.min(8, Number(req.body?.poolMultiplier ?? 3)));
    const poolLimit = Math.max(maxNodes, Math.min(50000, Math.floor(req.body?.poolLimit ?? (maxNodes * poolMultiplier))));
    const componentCount = Math.max(1, Math.min(16, Number(req.body?.componentCount ?? 6)));
    const shardCount = Math.max(1, Math.min(64, Number(req.body?.shardCount ?? 1)));
    const shardIndex = positiveMod(Number(req.body?.shardIndex ?? 0), shardCount);
    const rotationCursor = Math.max(0, Math.floor(Number(req.body?.rotationCursor ?? 0)));
    const requestedSeedNodeIds = Array.isArray(req.body?.seedNodeIds)
      ? req.body.seedNodeIds.map(String).filter(Boolean)
      : [];
    const project = typeof req.body?.project === "string" ? req.body.project.trim() : "";
    const minTargetNodes = Math.min(maxNodes, Math.max(1000, Math.floor(maxNodes * 0.75)));
    const maxAdaptivePoolLimit = Math.max(poolLimit, Math.min(50000, poolLimit * 4));
    const cacheParams = {
      maxNodes,
      maxEdges,
      poolLimit,
      componentCount,
      shardIndex,
      shardCount,
      rotationCursor,
      project,
      seeds: requestedSeedNodeIds.slice(0, 8),
    };
    const cacheKey = graphProjectionCacheKey("view", cacheParams);
    const cachedView = await readCachedProjection<any>({
      cache: graphProjectionCache,
      key: cacheKey,
      projectionName: "openplanner.graph/view",
      metricKind: "graph_view",
      log: req.log,
    });
    if (cachedView) return cachedView;

    const pendingView = graphProjectionInflight.get(cacheKey) as Promise<any> | undefined;
    if (pendingView) {
      counterInc("openplanner_projection_cache_inflight_hits_total", { projection: "graph_view" });
      return await pendingView;
    }

    const viewBuild: Promise<any> = (async () => {

    const projectFilter = project ? { project } : {};
    const [totalLayoutRows, totalNodes, totalEdges, totalSemanticEdges] = await Promise.all([
      app.mongo.graphLayoutOverrides.countDocuments(projectFilter),
      app.mongo.events.countDocuments({ kind: "graph.node", ...(project ? { project } : {}) }),
      app.mongo.graphEdges.countDocuments(project ? { project } : {}),
      app.mongo.graphSemanticEdges.countDocuments({ similarity: { $gte: 0.5 }, ...(project ? { project } : {}) }),
    ]);
    const totalAllEdges = totalEdges + totalSemanticEdges;
    const buildViewForPoolLimit = async (activePoolLimit: number, activeRotationCursor: number) => {
      const recentPoolLimit = Math.max(1, Math.floor(activePoolLimit / 2));
      const stalePoolLimit = Math.max(1, activePoolLimit - recentPoolLimit);
      const effectiveComponentCount = Math.min(24, componentCount * Math.max(1, Math.floor(activePoolLimit / Math.max(1, poolLimit))));

      const recentOffset = selectWindowOffset({
        totalRows: totalLayoutRows,
        windowSize: recentPoolLimit,
        shardIndex,
        shardCount,
        rotationCursor: activeRotationCursor,
      });
      const staleOffset = selectWindowOffset({
        totalRows: totalLayoutRows,
        windowSize: stalePoolLimit,
        shardIndex,
        shardCount,
        rotationCursor: activeRotationCursor + 17,
      });
      const [recentLayoutRows, staleLayoutRows] = await Promise.all([
        app.mongo.graphLayoutOverrides.find(projectFilter).sort({ updated_at: -1 as any }).skip(recentOffset).limit(recentPoolLimit).toArray(),
        app.mongo.graphLayoutOverrides.find(projectFilter).sort({ updated_at: 1 as any }).skip(staleOffset).limit(stalePoolLimit).toArray(),
      ]);

      let layoutRows = [...staleLayoutRows, ...recentLayoutRows];
      if (shardCount > 1) {
        const shardFiltered = layoutRows.filter((row: any) => {
          const nodeId = String(row?.node_id ?? "");
          return nodeId && hashShardSlot(nodeId, shardCount) === shardIndex;
        });
        if (shardFiltered.length > 0) {
          layoutRows = shardFiltered;
        }
      }
      if (layoutRows.length === 0) {
        const fallbackNodeProjection = { "extra.node_id": 1 };
        const fallbackOffset = selectWindowOffset({
          totalRows: totalNodes,
          windowSize: Math.min(maxNodes, Math.max(1, activePoolLimit)),
          shardIndex,
          shardCount,
          rotationCursor: activeRotationCursor,
        });
        const fallbackNodeDocs = await app.mongo.events
          .find({ kind: "graph.node", ...(project ? { project } : {}) }, { projection: fallbackNodeProjection })
          .sort({ ts: -1 as any, _id: -1 as any })
          .skip(fallbackOffset)
          .limit(Math.min(maxNodes, Math.max(1, activePoolLimit)))
          .toArray();
        const fallbackNodeIds = [...new Set([
          ...requestedSeedNodeIds,
          ...fallbackNodeDocs.map((doc: any) => String(doc.extra?.node_id ?? "")).filter(Boolean),
        ])]
          .filter((nodeId) => shardCount <= 1 || hashShardSlot(nodeId, shardCount) === shardIndex || requestedSeedNodeIds.includes(nodeId))
          .slice(0, maxNodes);
        const nodes = fallbackNodeIds.map((nodeId) => inferViewNodeFromId(nodeId, hashPositionForNodeId(nodeId)));
        return {
          ok: true,
          nodes,
          edges: [],
          meta: {
            totalNodes,
            totalEdges: totalAllEdges,
            sampledNodes: nodes.length < totalNodes,
            sampledEdges: totalAllEdges > 0,
            shardIndex,
            shardCount,
            rotationCursor,
            rotationCursorUsed: activeRotationCursor,
            poolLimitUsed: activePoolLimit,
          },
        };
      }

      let candidateNodeIds = [...new Set([
        ...requestedSeedNodeIds,
        ...layoutRows.map((row) => String(row.node_id)).filter(Boolean),
      ])];

      if (candidateNodeIds.length < activePoolLimit) {
        const missingCount = activePoolLimit - candidateNodeIds.length;
        const fallbackNodeProjection = { "extra.node_id": 1 };
        const fallbackOffset = selectWindowOffset({
          totalRows: totalNodes,
          windowSize: Math.min(totalNodes, Math.max(1, missingCount)),
          shardIndex,
          shardCount,
          rotationCursor: activeRotationCursor + 31,
        });
        const fallbackNodeDocs = await app.mongo.events
          .find({ kind: "graph.node", ...(project ? { project } : {}) }, { projection: fallbackNodeProjection })
          .sort({ ts: -1 as any, _id: -1 as any })
          .skip(fallbackOffset)
          .limit(Math.min(totalNodes, Math.max(1, missingCount * Math.max(1, shardCount))))
          .toArray();
        candidateNodeIds = [...new Set([
          ...candidateNodeIds,
          ...fallbackNodeDocs.map((doc: any) => String(doc.extra?.node_id ?? "")).filter(Boolean),
        ])].filter((nodeId) => shardCount <= 1 || hashShardSlot(nodeId, shardCount) === shardIndex || requestedSeedNodeIds.includes(nodeId));
      }
      const layoutById = new Map<string, { x: number; y: number }>();
      for (const row of layoutRows) {
        if (typeof row.node_id === "string" && typeof row.x === "number" && typeof row.y === "number") {
          layoutById.set(row.node_id, { x: row.x, y: row.y });
        }
      }

      const staleCandidateIds = [...new Set(staleLayoutRows.map((row) => String(row.node_id)).filter(Boolean))];
      const recentCandidateIds = [...new Set(recentLayoutRows.map((row) => String(row.node_id)).filter(Boolean))];

      const edgeFilter: Record<string, unknown> = {
        source_node_id: { $in: candidateNodeIds },
        target_node_id: { $in: candidateNodeIds },
        ...(project ? { project } : {}),
      };
      const semanticEdgeFilter: Record<string, unknown> = {
        source_node_id: { $in: candidateNodeIds },
        target_node_id: { $in: candidateNodeIds },
        similarity: { $gte: 0.5 },
        ...(project ? { project } : {}),
      };

      const [structuralEdges, semanticEdges] = await Promise.all([
        app.mongo.graphEdges
          .find(edgeFilter, {
            projection: { source_node_id: 1, target_node_id: 1, edge_kind: 1, data: 1, updated_at: 1 },
          })
          .limit(Math.max(maxEdges * 4, 25000))
          .toArray(),
        app.mongo.graphSemanticEdges
          .find(semanticEdgeFilter, {
            projection: { source_node_id: 1, target_node_id: 1, edge_type: 1, similarity: 1, data: 1 },
          })
          .limit(Math.max(maxEdges * 4, 25000))
          .toArray(),
      ]);

      // Normalize edge records with kind/layer
      const candidateEdges: any[] = [
        ...structuralEdges.map((e: any) => ({
          source_node_id: e.source_node_id,
          target_node_id: e.target_node_id,
          edge_kind: e.edge_kind ?? "structural",
          layer: "structural",
          data: e.data,
          updated_at: e.updated_at,
        })),
        ...semanticEdges.map((e: any) => ({
          source_node_id: e.source_node_id,
          target_node_id: e.target_node_id,
          edge_kind: e.edge_type ?? "semantic_knn",
          layer: "semantic",
          similarity: e.similarity,
          data: e.data,
        })),
      ];

      if (candidateEdges.length === 0) {
        const nodes = candidateNodeIds.slice(0, maxNodes).map((nodeId) => inferViewNodeFromId(nodeId, layoutById.get(nodeId) ?? { x: 0, y: 0 }));
        return {
          ok: true,
          nodes,
          edges: [],
          meta: {
            totalNodes,
            totalEdges: totalAllEdges,
            sampledNodes: nodes.length < totalNodes,
            sampledEdges: totalAllEdges > 0,
            shardIndex,
            shardCount,
            rotationCursor,
            rotationCursorUsed: activeRotationCursor,
            poolLimitUsed: activePoolLimit,
          },
        };
      }

      const adjacency = new Map<string, Array<{ neighbor: string; edgeIndex: number }>>();
      const degree = new Map<string, number>();
      for (let i = 0; i < candidateEdges.length; i += 1) {
        const edge = candidateEdges[i]!;
        const sourceId = String(edge.source_node_id);
        const targetId = String(edge.target_node_id);
        if (!sourceId || !targetId || sourceId === targetId) continue;

        const sourceNeighbors = adjacency.get(sourceId) ?? [];
        sourceNeighbors.push({ neighbor: targetId, edgeIndex: i });
        adjacency.set(sourceId, sourceNeighbors);

        const targetNeighbors = adjacency.get(targetId) ?? [];
        targetNeighbors.push({ neighbor: sourceId, edgeIndex: i });
        adjacency.set(targetId, targetNeighbors);

        degree.set(sourceId, (degree.get(sourceId) ?? 0) + 1);
        degree.set(targetId, (degree.get(targetId) ?? 0) + 1);
      }

      const connectedSeeds = requestedSeedNodeIds.filter((nodeId: string) => adjacency.has(nodeId));
      const rankCandidates = (nodeIds: string[]): string[] => nodeIds
        .filter((nodeId) => adjacency.has(nodeId))
        .sort((left, right) => (degree.get(right) ?? 0) - (degree.get(left) ?? 0));

      const staleRankedSeeds = rankCandidates(staleCandidateIds);
      const recentRankedSeeds = rankCandidates(recentCandidateIds);
      const fallbackRankedSeeds = rankCandidates(candidateNodeIds);

      const seedNodeIds: string[] = [];
      const seedExclusion = new Set<string>();
      const tryAddSeed = (nodeId: string | undefined): boolean => {
        if (!nodeId || seedExclusion.has(nodeId) || !adjacency.has(nodeId)) return false;
        seedNodeIds.push(nodeId);
        seedExclusion.add(nodeId);
        for (const neighbor of adjacency.get(nodeId) ?? []) {
          seedExclusion.add(neighbor.neighbor);
        }
        return true;
      };

      for (const nodeId of connectedSeeds) {
        if (seedNodeIds.length >= effectiveComponentCount) break;
        tryAddSeed(nodeId);
      }

      let staleIndex = 0;
      let recentIndex = 0;
      while (seedNodeIds.length < effectiveComponentCount) {
        const addedStale = tryAddSeed(staleRankedSeeds[staleIndex]);
        if (staleIndex < staleRankedSeeds.length) staleIndex += 1;
        if (seedNodeIds.length >= effectiveComponentCount) break;
        const addedRecent = tryAddSeed(recentRankedSeeds[recentIndex]);
        if (recentIndex < recentRankedSeeds.length) recentIndex += 1;
        if (!addedStale && !addedRecent && staleIndex >= staleRankedSeeds.length && recentIndex >= recentRankedSeeds.length) {
          break;
        }
      }

      for (const nodeId of fallbackRankedSeeds) {
        if (seedNodeIds.length >= effectiveComponentCount) break;
        tryAddSeed(nodeId);
      }

      if (seedNodeIds.length === 0 && candidateNodeIds.length > 0) {
        seedNodeIds.push(candidateNodeIds[0]!);
      }

      const selectedNodeIds = new Set<string>();
      const selectedEdgeIndexes = new Set<number>();
      const queue: string[] = [...seedNodeIds];

      while (queue.length > 0 && selectedNodeIds.size < maxNodes) {
        const current = queue.shift()!;
        if (selectedNodeIds.has(current)) continue;
        selectedNodeIds.add(current);

        const neighbors = [...(adjacency.get(current) ?? [])]
          .sort((left, right) => (degree.get(right.neighbor) ?? 0) - (degree.get(left.neighbor) ?? 0));

        for (const neighbor of neighbors) {
          if (selectedNodeIds.size < maxNodes) {
            selectedEdgeIndexes.add(neighbor.edgeIndex);
            if (!selectedNodeIds.has(neighbor.neighbor)) queue.push(neighbor.neighbor);
          }
        }
      }

      if (selectedNodeIds.size < maxNodes) {
        // IMPORTANT: Avoid filling the view with degree-0 nodes.
        // Nodes with no adjacency in the sampled edge set will only feel repulsion/boundary
        // and tend to form stable-looking rings that are "not part of the graph".
        const rankedFillNodeIds = [...new Set([
          ...requestedSeedNodeIds,
          ...fallbackRankedSeeds,
          ...recentCandidateIds,
          ...staleCandidateIds,
          ...candidateNodeIds,
        ])];

        for (const nodeId of rankedFillNodeIds) {
          if (selectedNodeIds.size >= maxNodes) break;
          if (!nodeId || selectedNodeIds.has(nodeId)) continue;
          if (!adjacency.has(nodeId) && !requestedSeedNodeIds.includes(nodeId)) continue;
          selectedNodeIds.add(nodeId);
        }

        if (selectedNodeIds.size < maxNodes) {
          const connectedRanked = [...adjacency.keys()]
            .sort((left, right) => (degree.get(right) ?? 0) - (degree.get(left) ?? 0));

          for (const nodeId of connectedRanked) {
            if (selectedNodeIds.size >= maxNodes) break;
            if (selectedNodeIds.has(nodeId)) continue;
            selectedNodeIds.add(nodeId);
          }
        }
      }

      const treeEdges = [...selectedEdgeIndexes]
        .map((edgeIndex) => candidateEdges[edgeIndex])
        .filter((edge): edge is NonNullable<typeof edge> => !!edge)
        .filter((edge) => selectedNodeIds.has(String(edge.source_node_id)) && selectedNodeIds.has(String(edge.target_node_id)));

      const seenEdgeKeys = new Set(treeEdges.map((edge) => `${edge.edge_kind}::${edge.source_node_id}::${edge.target_node_id}`));
      const extraEdges = candidateEdges
        .filter((edge) => selectedNodeIds.has(String(edge.source_node_id)) && selectedNodeIds.has(String(edge.target_node_id)))
        .filter((edge) => !seenEdgeKeys.has(`${edge.edge_kind}::${edge.source_node_id}::${edge.target_node_id}`))
        .sort((left, right) => {
          const leftScore = (degree.get(String(left.source_node_id)) ?? 0) + (degree.get(String(left.target_node_id)) ?? 0);
          const rightScore = (degree.get(String(right.source_node_id)) ?? 0) + (degree.get(String(right.target_node_id)) ?? 0);
          return rightScore - leftScore;
        });

      const selectedEdges = [...treeEdges, ...extraEdges].slice(0, maxEdges);
      const selectedNodes = [...selectedNodeIds]
        .map((nodeId) => inferViewNodeFromId(nodeId, layoutById.get(nodeId) ?? hashPositionForNodeId(nodeId)));
      const edges: ViewEdge[] = selectedEdges.map((edge) => ({
        source: String(edge.source_node_id),
        target: String(edge.target_node_id),
        kind: String(edge.edge_kind),
        dataJson: edge.data ? JSON.stringify(edge.data) : null,
      }));

      return {
        ok: true,
        nodes: selectedNodes,
        edges,
        meta: {
          totalNodes,
          totalEdges: totalAllEdges,
          sampledNodes: selectedNodes.length < totalNodes,
          sampledEdges: edges.length < totalAllEdges,
          shardIndex,
          shardCount,
          rotationCursor,
          rotationCursorUsed: activeRotationCursor,
          poolLimitUsed: activePoolLimit,
        },
      };
    };

    const buildAdaptiveViewForCursor = async (activeRotationCursor: number) => {
      let activePoolLimit = poolLimit;
      let response = await buildViewForPoolLimit(activePoolLimit, activeRotationCursor);
      while (response.nodes.length < minTargetNodes && activePoolLimit < maxAdaptivePoolLimit) {
        activePoolLimit = Math.min(maxAdaptivePoolLimit, activePoolLimit * 2);
        response = await buildViewForPoolLimit(activePoolLimit, activeRotationCursor);
      }
      return response;
    };

    let response = await buildAdaptiveViewForCursor(rotationCursor);
    let bestResponse = response;
    for (let cursorOffset = 1; cursorOffset <= 3 && bestResponse.nodes.length < minTargetNodes; cursorOffset += 1) {
      const candidateResponse = await buildAdaptiveViewForCursor(rotationCursor + cursorOffset);
      if (candidateResponse.nodes.length > bestResponse.nodes.length) {
        bestResponse = candidateResponse;
      }
    }

    response = bestResponse;

    await writeCachedProjection({
      cache: graphProjectionCache,
      key: cacheKey,
      ttlMs: graphViewCacheTtlMs,
      projectionName: "openplanner.graph/view",
      sourceCollection: "events,graph_edges,graph_semantic_edges,graph_layout_overrides",
      sourceKey: cacheKey,
      value: response,
      metadata: cacheParams,
      metricKind: "graph_view",
      log: req.log,
    });
    return response;
    })();

    graphProjectionInflight.set(cacheKey, viewBuild);
    void viewBuild.catch((err) => {
      req.log.warn({ err, cacheKey }, "graph view projection build failed after route fallback");
    }).finally(() => {
      if (graphProjectionInflight.get(cacheKey) === viewBuild) {
        graphProjectionInflight.delete(cacheKey);
      }
    });

    try {
      return await resolveWithTimeoutFallback({
        promise: viewBuild,
        timeoutMs: graphViewBuildTimeoutMs,
        fallback: () => {
          counterInc("openplanner_projection_cache_timeouts_total", { projection: "graph_view" });
          const fallbackNodes = requestedSeedNodeIds
            .slice(0, maxNodes)
            .map((nodeId: string) => inferViewNodeFromId(nodeId, hashPositionForNodeId(nodeId)));
          return {
            ok: true,
            nodes: fallbackNodes,
            edges: [],
            meta: {
              totalNodes: fallbackNodes.length,
              totalEdges: 0,
              sampledNodes: true,
              sampledEdges: true,
              shardIndex,
              shardCount,
              rotationCursor,
              degraded: true,
              reason: "graph_view_build_timeout",
              timeoutMs: graphViewBuildTimeoutMs,
            },
          };
        },
      });
    } catch (err) {
      counterInc("openplanner_projection_cache_errors_total", { projection: "graph_view", operation: "build" });
      req.log.warn({ err, cacheKey }, "graph view projection build failed; returning degraded fallback");
      const fallbackNodes = requestedSeedNodeIds
        .slice(0, maxNodes)
        .map((nodeId: string) => inferViewNodeFromId(nodeId, hashPositionForNodeId(nodeId)));
      return {
        ok: true,
        nodes: fallbackNodes,
        edges: [],
        meta: {
          totalNodes: fallbackNodes.length,
          totalEdges: 0,
          sampledNodes: true,
          sampledEdges: true,
          shardIndex,
          shardCount,
          rotationCursor,
          degraded: true,
          reason: "graph_view_build_error",
        },
      };
    }
  });

  // Similar nodes by vector search
  app.post("/graph/similar", async (req: any, reply) => {
    const q = req.body?.q;
    const k = req.body?.k ?? 20;
    const where = typeof req.body?.where === "object" && req.body?.where !== null && !Array.isArray(req.body.where)
      ? req.body.where
      : undefined;

    if (!q || typeof q !== "string") {
      return reply.status(400).send({ error: "q is required" });
    }

    const embeddingRuntime = (app as any).embeddingRuntime;
    const result = await queryMongoVectorsByText({
      mongo: app.mongo,
      tier: "hot",
      q,
      k: Math.max(1, Math.min(200, Number(k))),
      where,
      getEmbeddingFunctionForModel: (model: string) => embeddingRuntime.hot.getEmbeddingFunctionForModel(model),
    });

    const hits = extractTieredVectorHits(result, "hot");
    return { ok: true, hits, storageBackend: "mongodb" };
  });

  // Query node embeddings by IDs
  app.post("/graph/node-embeddings/query", async (req: any, reply) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const eventIds = Array.isArray(req.body?.eventIds) ? req.body.eventIds : [];
    const model = req.body?.model;

    if (ids.length === 0 && eventIds.length === 0) {
      return { vectors: [] };
    }

    const filter: Record<string, unknown>[] = [];
    if (ids.length > 0) filter.push({ node_id: { $in: ids.map(String) } });
    if (eventIds.length > 0) filter.push({ source_event_id: { $in: eventIds.map(String) } });

    const query = filter.length > 1 ? { $or: filter } : filter[0] || {};
    if (model) Object.assign(query, { embedding_model: String(model) });

    const rows = await app.mongo.graphNodeEmbeddings.find(query).limit(1000).toArray();

    const vectors = rows.map((row: any) => ({
      id: row.node_id,
      sourceEventId: row.source_event_id,
      embeddingModel: row.embedding_model,
      embeddingDimensions: row.embedding_dimensions,
      embedding: row.embedding,
      chunkCount: row.chunk_count,
    }));

    return { vectors };
  });

  // Materialize node embeddings (generate + store)
  app.post("/graph/node-embeddings/materialize", async (req: any, reply) => {
    const inputs = Array.isArray(req.body?.inputs) ? req.body.inputs : [];
    const model = req.body?.model ?? "qwen3-embedding:0.6b";

    if (inputs.length === 0) {
      return { vectors: [] };
    }

    // Log the upstream configuration for visibility
    req.log.info({ inputs: inputs.length, model, inputs_sample: inputs.slice(0, 2) }, "materialize node embeddings batch start");

    const embeddingRuntime = (app as any).embeddingRuntime;
    const embeddingFn = embeddingRuntime?.hot?.getBackgroundEmbeddingFunctionForModel?.(model);

    if (!embeddingFn) {
      req.log.error({ model }, "embedding function not found for model");
      return reply.status(503).send({ error: "embedding runtime not available" });
    }

    req.log.debug({ model, fn: typeof embeddingFn }, "embedding function resolved");

    const results: Array<{
      id: string;
      sourceEventId: string;
      embeddingModel: string;
      embeddingDimensions: number;
      embedding: number[];
      chunkCount: number;
    }> = [];

    // Batch embed for efficiency.
    // IMPORTANT: do not truncate. If the input is too large for the embedding
    // runtime (e.g. char limit), we split into chunk nodes by ID suffix.
    const validInputs: Array<{ id: string; sourceEventId: string; body: string; chunkCount: number }> = inputs
      .slice(0, 100)
      .filter((input: any) => input.id && input.body)
      .flatMap((input: any) => {
        const id = String(input.id);
        const sourceEventId = String(input.sourceEventId || input.source_event_id || input.id);
        const prepared = prepareIndexDocument({
          parentId: id,
          text: String(input.body),
          forceChunking: false,
          targetChunkTokens: 28_000,
          targetChunkChars: 80_000,
          overlapChars: 500,
        });

        if (prepared.chunkCount <= 1) {
          return [{
            id,
            sourceEventId,
            body: formatEmbeddingPassageText(prepared.normalizedText),
            chunkCount: 1,
          }];
        }

        return prepared.chunks.map((chunk) => ({
          id: chunk.id,
          sourceEventId,
          body: formatEmbeddingPassageText(chunk.text),
          chunkCount: prepared.chunkCount,
        }));
      });

    if (validInputs.length === 0) {
      return { vectors: [] };
    }

    try {
      const texts = validInputs.map((i: { body: string }) => i.body);
      req.log.info({ batch_size: texts.length, model }, "calling embedding function");
      const embeddings = await embeddingFn.generate(texts);
      req.log.info({ got_embeddings: embeddings?.length }, "embedding batch complete");

      for (let i: number = 0; i < validInputs.length; i++) {
        const embedding = embeddings[i];
        if (!Array.isArray(embedding) || embedding.length === 0) continue;

        results.push({
          id: validInputs[i].id,
          sourceEventId: validInputs[i].sourceEventId,
          embeddingModel: model,
          embeddingDimensions: embedding.length,
          embedding,
          chunkCount: validInputs[i].chunkCount ?? 1,
        });
      }
    } catch (err) {
      console.error("batch embedding failed:", err);
    }

    // Store embeddings
    if (results.length > 0) {
      await upsertGraphNodeEmbeddings(
        app.mongo.graphNodeEmbeddings,
        results.map((r) => ({
          node_id: r.id,
          source_event_id: r.sourceEventId,
          embedding_model: r.embeddingModel,
          embedding_dimensions: r.embeddingDimensions,
          embedding: r.embedding,
          chunk_count: r.chunkCount,
          text: validInputs.find((i) => i.id === r.id)?.body,
          updated_at: new Date(),
        }))
      );
    }

    return { vectors: results };
  });

  // Monitoring stats for admin dashboards
  app.get("/graph/monitoring", async (req: any, reply) => {
    const [nodeCount, edgeCount, embeddingCount, layoutCount, semanticEdgeCount, graphEdgeCount] = await Promise.all([
      app.mongo.events.countDocuments({ kind: "graph.node" }),
      app.mongo.events.countDocuments({ kind: "graph.edge" }),
      app.mongo.graphNodeEmbeddings.countDocuments({}),
      app.mongo.graphLayoutOverrides.countDocuments({}),
      app.mongo.graphSemanticEdges.countDocuments({}),
      app.mongo.graphEdges.countDocuments({}),
    ]);

    // Get project breakdown
    const projectNodes = await app.mongo.events.aggregate([
      { $match: { kind: "graph.node" } },
      { $group: { _id: "$project", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();

    // Get recent embedding activity
    const recentEmbeddings = await app.mongo.graphNodeEmbeddings.find({})
      .sort({ updated_at: -1 })
      .limit(5)
      .project({ node_id: 1, embedding_model: 1, embedding_dimensions: 1, updated_at: 1 })
      .toArray();

    return {
      ok: true,
      stats: {
        nodes: nodeCount,
        edges: edgeCount,
        embeddings: embeddingCount,
        layouts: layoutCount,
        semanticEdges: semanticEdgeCount,
        graphEdges: graphEdgeCount,
      },
      projectBreakdown: projectNodes.map((p: any) => ({
        project: p._id || "unknown",
        count: p.count,
      })),
      recentEmbeddings: recentEmbeddings.map((e: any) => ({
        nodeId: e.node_id,
        model: e.embedding_model,
        dimensions: e.embedding_dimensions,
        updatedAt: e.updated_at,
      })),
      storageBackend: "mongodb",
    };
  });

  // Embedding coverage — how many objects have embeddings vs total
  app.get("/graph/embedding-coverage", async () => {
    const [
      totalEvents,
      totalGraphNodes,
      totalEmbeddings,
      embeddingsByModel,
      nodeKinds,
      eventKinds,
    ] = await Promise.all([
      app.mongo.events.countDocuments({}),
      app.mongo.events.countDocuments({ kind: "graph.node" }),
      app.mongo.graphNodeEmbeddings.countDocuments({}),
      app.mongo.graphNodeEmbeddings.aggregate([
        { $group: { _id: "$embedding_model", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray(),
      app.mongo.events.aggregate([
        { $match: { kind: "graph.node" } },
        { $group: { _id: "$extra.node_kind", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray(),
      app.mongo.events.aggregate([
        { $group: { _id: "$kind", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray(),
    ]);

    return {
      ok: true,
      coverage: {
        totalEvents,
        totalGraphNodes,
        totalEmbeddings,
        embeddingRate: totalGraphNodes > 0 ? Number((totalEmbeddings / totalGraphNodes).toFixed(4)) : 0,
      },
      byModel: embeddingsByModel.map((m: any) => ({
        model: m._id || "unknown",
        count: m.count,
      })),
      byNodeKind: nodeKinds.map((k: any) => ({
        kind: k._id || "unknown",
        count: k.count,
      })),
      byEventKind: eventKinds.map((k: any) => ({
        kind: k._id || "unknown",
        count: k.count,
      })),
      storageBackend: "mongodb",
    };
  });

  // ============================================================
  // Semantic Edge Persistence (layout-as-search-index)
  // ============================================================

  // Upsert semantic edges for graph clustering
  app.post("/graph/semantic-edges/upsert", async (req: any, reply) => {
    const source = req.body?.source ?? "eros-eris-field";
    const clusteringVersion = req.body?.clusteringVersion ?? "v1";
    const embeddingModel = req.body?.embeddingModel;
    const project = req.body?.project;
    const edges = Array.isArray(req.body?.edges) ? req.body.edges : [];

    if (edges.length === 0) {
      return { ok: true, stored: 0 };
    }

    const rows = edges.map((edge: any) => ({
      source_node_id: String(edge.source ?? edge.a ?? edge.source_node_id),
      target_node_id: String(edge.target ?? edge.b ?? edge.target_node_id),
      similarity: Number(edge.similarity ?? edge.sim ?? 0),
      edge_type: String(edge.edge_type ?? edge.kind ?? "semantic_similarity"),
      project: project ?? null,
      embedding_model: embeddingModel ?? null,
      clustering_version: clusteringVersion,
      source,
      updated_at: new Date(),
    })).filter((r: any) => r.source_node_id && r.target_node_id && r.source_node_id !== r.target_node_id);

    const stored = await upsertGraphSemanticEdges(app.mongo.graphSemanticEdges, rows);
    return { ok: true, stored };
  });

  // Query semantic edges by node IDs
  app.post("/graph/semantic-edges/query", async (req: any, reply) => {
    const nodeIds = Array.isArray(req.body?.nodeIds) ? req.body.nodeIds : [];
    const minSimilarity = Number(req.body?.minSimilarity ?? -1);
    const maxSimilarity = Number(req.body?.maxSimilarity ?? 1);
    const limit = Math.max(1, Math.min(10000, Number(req.body?.limit ?? 1000)));

    if (nodeIds.length === 0) {
      return { edges: [] };
    }

    const filter: Record<string, unknown> = {
      $or: [
        { source_node_id: { $in: nodeIds.map(String) } },
        { target_node_id: { $in: nodeIds.map(String) } },
      ],
      similarity: { $gte: minSimilarity, $lte: maxSimilarity },
    };

    const rows = await app.mongo.graphSemanticEdges.find(filter).limit(limit).toArray();

    const edges = rows.map((row: any) => ({
      source: row.source_node_id,
      target: row.target_node_id,
      similarity: row.similarity,
      edgeType: row.edge_type,
      embeddingModel: row.embedding_model,
      clusteringVersion: row.clustering_version,
      updatedAt: row.updated_at,
    }));

    return { edges };
  });

  app.post("/graph/semantic-edges/decay", async (req: any) => {
    const dryRun = req.body?.dryRun === true;
    const now = req.body?.now ? new Date(String(req.body.now)) : new Date();
    const halfLifeMs = Math.max(1_000, Number(req.body?.halfLifeMs ?? req.body?.decayHalfLifeMs ?? 60 * 60 * 1000));
    const breakBelow = Math.max(0, Number(req.body?.breakBelow ?? 0.05));
    const pruneBelow = Math.max(0, Number(req.body?.pruneBelow ?? 0.005));
    const limit = Math.max(1, Math.min(100000, Number(req.body?.limit ?? 10000)));
    const project = typeof req.body?.project === "string" ? req.body.project.trim() : "";
    const nodeIds = uniqueStrings(req.body?.nodeIds ?? req.body?.node_ids);
    if (Number.isNaN(now.getTime())) return { ok: false, error: "now must be an ISO timestamp" };

    const filter: Record<string, unknown> = project ? { project } : {};
    if (nodeIds.length > 0) {
      filter.$or = [
        { source_node_id: { $in: nodeIds } },
        { target_node_id: { $in: nodeIds } },
      ];
    }
    const rows = await app.mongo.graphSemanticEdges.find(filter).limit(limit).toArray();
    let checked = 0;
    let weakened = 0;
    let broken = 0;
    let pruned = 0;
    const updates: any[] = [];
    const deletes: any[] = [];

    for (const row of rows) {
      const similarity = Number(row.similarity ?? 0);
      if (!Number.isFinite(similarity)) continue;
      checked += 1;
      const baseConductance = Number.isFinite(Number(row.conductance))
        ? Number(row.conductance)
        : semanticCircuitConductance(similarity);
      const lastReinforcedAt = row.last_reinforced_at instanceof Date
        ? row.last_reinforced_at
        : (row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at ?? row.updatedAt ?? row.createdAt ?? now));
      const effectiveHalfLifeMs = Math.max(1_000, Number(row.decay_half_life_ms ?? halfLifeMs));
      const conductance = decayedConductance({ conductance: baseConductance, lastReinforcedAt, now, halfLifeMs: effectiveHalfLifeMs });
      if (conductance <= pruneBelow) {
        pruned += 1;
        deletes.push({ deleteOne: { filter: { _id: row._id } } });
        continue;
      }
      weakened += 1;
      const status = conductance <= breakBelow ? "broken" : "active";
      if (status === "broken") broken += 1;
      updates.push({
        updateOne: {
          filter: { _id: row._id },
          update: {
            $set: {
              conductance,
              resistance: conductance > 0 ? 1 / conductance : 1_000_000_000,
              status,
              decay_half_life_ms: effectiveHalfLifeMs,
              updated_at: now,
              updatedAt: now,
            },
          },
        },
      });
    }

    if (!dryRun) {
      const ops = [...updates, ...deletes];
      if (ops.length > 0) await app.mongo.graphSemanticEdges.bulkWrite(ops, { ordered: false });
    }

    return {
      ok: true,
      dryRun,
      checked,
      weakened,
      broken,
      pruned,
      updated: dryRun ? 0 : updates.length,
      deleted: dryRun ? 0 : deletes.length,
      halfLifeMs,
      breakBelow,
      pruneBelow,
    };
  });

  const semanticEdgeDecayIntervalMs = Math.max(30_000, Number(process.env.GRAPH_SEMANTIC_EDGE_DECAY_INTERVAL_MS ?? 5 * 60 * 1000));
  const semanticEdgeDecayTimer = setInterval(() => {
    const apiKey = String(process.env.OPENPLANNER_API_KEY ?? "").trim();
    void app.inject({
      method: "POST",
      url: "/v1/graph/semantic-edges/decay",
      headers: {
        ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
        "content-type": "application/json",
      },
      payload: {
        limit: Number(process.env.GRAPH_SEMANTIC_EDGE_DECAY_LIMIT ?? 10000),
        halfLifeMs: Number(process.env.GRAPH_SEMANTIC_EDGE_DECAY_HALF_LIFE_MS ?? 60 * 60 * 1000),
        breakBelow: Number(process.env.GRAPH_SEMANTIC_EDGE_DECAY_BREAK_BELOW ?? 0.05),
        pruneBelow: Number(process.env.GRAPH_SEMANTIC_EDGE_DECAY_PRUNE_BELOW ?? 0.005),
      },
    }).then((response) => {
      if (response.statusCode >= 400) {
        app.log.warn({ statusCode: response.statusCode, body: response.body }, "scheduled semantic edge decay failed");
        return;
      }
      const payload = JSON.parse(response.body || "{}");
      if (payload.checked > 0 && (payload.pruned > 0 || payload.broken > 0)) {
        app.log.info(payload, "scheduled semantic edge decay applied");
      }
    }).catch((error) => {
      app.log.warn({ error }, "scheduled semantic edge decay failed");
    });
  }, semanticEdgeDecayIntervalMs);
  app.addHook("onClose", async () => {
    clearInterval(semanticEdgeDecayTimer);
  });

  // ============================================================
  // Semantic Force Samples (force cache, not graph truth)
  // ============================================================

  app.post("/graph/semantic-force/upsert", async (req: any) => {
    const source = req.body?.source ?? "eros-eris-field";
    const embeddingModel = req.body?.embeddingModel ?? req.body?.embedding_model;
    const embeddingDimensions = req.body?.embeddingDimensions ?? req.body?.embedding_dimensions;
    const project = req.body?.project;
    const fieldProfile = String(req.body?.fieldProfile ?? req.body?.field_profile ?? "layout.v1");
    const forceKind = String(req.body?.forceKind ?? req.body?.force_kind ?? "semantic_charge");
    const chargeAlpha = Number(req.body?.chargeAlpha ?? req.body?.charge_alpha ?? 2.4);
    const samples = Array.isArray(req.body?.samples) ? req.body.samples : (Array.isArray(req.body?.edges) ? req.body.edges : []);

    if (samples.length === 0) {
      return { ok: true, stored: 0, compatibilityKind: "semantic_force_sample" };
    }

    const rows = samples.map((sample: any) => {
      const similarity = Number(sample.similarity ?? sample.sim ?? 0);
      return {
        source_node_id: String(sample.source ?? sample.a ?? sample.source_node_id),
        target_node_id: String(sample.target ?? sample.b ?? sample.target_node_id),
        similarity,
        charge: Number.isFinite(Number(sample.charge)) ? Number(sample.charge) : semanticChargeFromSimilarity(similarity, chargeAlpha),
        force_kind: String(sample.force_kind ?? sample.forceKind ?? forceKind),
        field_profile: String(sample.field_profile ?? sample.fieldProfile ?? fieldProfile),
        project: project ?? null,
        embedding_model: embeddingModel ?? null,
        embedding_dimensions: Number.isFinite(Number(embeddingDimensions)) ? Number(embeddingDimensions) : null,
        source,
        updated_at: new Date(),
      };
    }).filter((row: any) => row.source_node_id && row.target_node_id && row.source_node_id !== row.target_node_id);

    const stored = await upsertGraphSemanticForceSamples(app.mongo.graphSemanticForceSamples, rows);
    return { ok: true, stored, compatibilityKind: "semantic_force_sample" };
  });

  app.post("/graph/semantic-force/query", async (req: any) => {
    const nodeIds = uniqueStrings(req.body?.nodeIds ?? req.body?.node_ids);
    const fieldProfile = String(req.body?.fieldProfile ?? req.body?.field_profile ?? "").trim();
    const minCharge = Number(req.body?.minCharge ?? req.body?.min_charge ?? -1);
    const maxCharge = Number(req.body?.maxCharge ?? req.body?.max_charge ?? 1);
    const includeLegacyFallback = req.body?.includeLegacyFallback === true || req.body?.include_legacy_fallback === true;
    const limit = Math.max(1, Math.min(100000, Number(req.body?.limit ?? 50000)));

    const filter: Record<string, unknown> = {
      charge: { $gte: minCharge, $lte: maxCharge },
    };
    if (nodeIds.length > 0) {
      filter.$or = [
        { source_node_id: { $in: nodeIds } },
        { target_node_id: { $in: nodeIds } },
      ];
    }
    if (fieldProfile) filter.field_profile = fieldProfile;

    const rows = await app.mongo.graphSemanticForceSamples.find(filter).limit(limit).toArray();
    if (rows.length > 0 || !includeLegacyFallback) {
      return { ok: true, count: rows.length, samples: rows.map(semanticForceSampleToApi), source: "semantic_force_samples" };
    }

    const legacyFilter: Record<string, unknown> = nodeIds.length > 0
      ? {
          $or: [
            { source_node_id: { $in: nodeIds } },
            { target_node_id: { $in: nodeIds } },
          ],
        }
      : {};
    const legacyRows = await app.mongo.graphSemanticEdges.find(legacyFilter).limit(limit).toArray();
    const samples = legacyRows.map((row: any) => ({
      source: row.source_node_id,
      target: row.target_node_id,
      similarity: row.similarity,
      charge: semanticChargeFromSimilarity(row.similarity),
      forceKind: "semantic_charge",
      fieldProfile: "legacy.semantic_edges",
      project: row.project,
      embeddingModel: row.embedding_model,
      sourceSystem: row.source,
      updatedAt: row.updated_at,
      compatibilityKind: "semantic_force_legacy",
    }));
    return { ok: true, count: samples.length, samples, source: "legacy_semantic_edges" };
  });

  app.get("/graph/semantic-force", async (req: any) => {
    const limit = Math.max(1, Math.min(100000, Number(req.query?.limit ?? 50000)));
    const fieldProfile = typeof req.query?.fieldProfile === "string" ? req.query.fieldProfile.trim() : "";
    const includeLegacyFallback = req.query?.includeLegacyFallback === "true" || req.query?.include_legacy_fallback === "true";
    const filter: Record<string, unknown> = {};
    if (fieldProfile) filter.field_profile = fieldProfile;

    const rows = await app.mongo.graphSemanticForceSamples.find(filter).limit(limit).toArray();
    if (rows.length > 0 || !includeLegacyFallback) {
      return { ok: true, count: rows.length, samples: rows.map(semanticForceSampleToApi), source: "semantic_force_samples" };
    }

    const legacyRows = await app.mongo.graphSemanticEdges.find({}).limit(limit).toArray();
    const samples = legacyRows.map((row: any) => ({
      source: row.source_node_id,
      target: row.target_node_id,
      similarity: row.similarity,
      charge: semanticChargeFromSimilarity(row.similarity),
      forceKind: "semantic_charge",
      fieldProfile: "legacy.semantic_edges",
      project: row.project,
      embeddingModel: row.embedding_model,
      sourceSystem: row.source,
      updatedAt: row.updated_at,
      compatibilityKind: "semantic_force_legacy",
    }));
    return { ok: true, count: samples.length, samples, source: "legacy_semantic_edges" };
  });

  // ============================================================
  // Semantic Field Cells (Barnes-Hut / quadtree force projection)
  // ============================================================

  app.get("/graph/semantic-field/cells", async (req: any) => {
    const fieldProfile = typeof req.query?.fieldProfile === "string" ? req.query.fieldProfile.trim() : "semantic_field.barnes_hut.v1";
    const project = typeof req.query?.project === "string" ? req.query.project.trim() : "";
    const level = req.query?.level === undefined ? null : Number(req.query.level);
    const limit = Math.max(1, Math.min(10000, Number(req.query?.limit ?? 1000)));
    const filter: Record<string, unknown> = { field_profile: fieldProfile };
    if (project) filter.project = project;
    if (level !== null && Number.isFinite(level)) filter.level = level;
    const rows = await app.mongo.graphSemanticFieldCells
      .find(filter)
      .sort({ level: 1, node_count: -1 })
      .limit(limit)
      .toArray();
    return { ok: true, count: rows.length, cells: rows.map(semanticFieldCellToApi) };
  });

  app.post("/graph/semantic-field/run", async (req: any) => {
    const dryRun = req.body?.dryRun === true;
    const fieldProfile = String(req.body?.fieldProfile ?? req.body?.field_profile ?? "semantic_field.barnes_hut.v1");
    const project = typeof req.body?.project === "string" && req.body.project.trim() ? req.body.project.trim() : null;
    const embeddingModel = typeof req.body?.embeddingModel === "string" ? req.body.embeddingModel.trim() : "";
    const embeddingDimensions = Number(req.body?.embeddingDimensions ?? req.body?.embedding_dimensions ?? 0);
    const nodeIds = uniqueStrings(req.body?.nodeIds ?? req.body?.node_ids);
    const maxNodes = Math.max(2, Math.min(5000, Number(req.body?.maxNodes ?? req.body?.max_nodes ?? 500)));
    const maxDepth = Math.max(1, Math.min(10, Number(req.body?.maxDepth ?? req.body?.max_depth ?? 6)));
    const maxLeafSize = Math.max(1, Math.min(256, Number(req.body?.maxLeafSize ?? req.body?.max_leaf_size ?? 24)));
    const theta = Math.max(0.1, Math.min(2.0, Number(req.body?.theta ?? 0.85)));
    const maxInteractions = Math.max(1, Math.min(50000, Number(req.body?.maxInteractions ?? req.body?.max_interactions ?? 5000)));
    const minAbsCharge = Math.max(0, Math.min(1, Number(req.body?.minAbsCharge ?? req.body?.min_abs_charge ?? 0.08)));
    const chargeAlpha = Math.max(0.01, Number(req.body?.chargeAlpha ?? req.body?.charge_alpha ?? 2.4));
    const now = new Date();

    const embeddingFilter: Record<string, unknown> = { embedding: { $exists: true } };
    if (project) embeddingFilter.project = project;
    if (embeddingModel) embeddingFilter.embedding_model = embeddingModel;
    if (Number.isFinite(embeddingDimensions) && embeddingDimensions > 0) embeddingFilter.embedding_dimensions = embeddingDimensions;
    if (nodeIds.length > 0) embeddingFilter.node_id = { $in: nodeIds };

    const embeddingRows = await app.mongo.graphNodeEmbeddings
      .find(embeddingFilter, { projection: { node_id: 1, project: 1, embedding_model: 1, embedding_dimensions: 1, embedding: 1, updated_at: 1 } })
      .sort({ updated_at: -1 })
      .limit(maxNodes)
      .toArray();
    const usableRows = embeddingRows.filter((row) => Array.isArray(row.embedding) && row.embedding.length > 0);
    const ids = usableRows.map((row) => String(row.node_id));
    const layoutRows = ids.length > 0
      ? await app.mongo.graphLayoutOverrides.find({ node_id: { $in: ids } }, { projection: { node_id: 1, x: 1, y: 1 } }).toArray()
      : [];
    const layoutByNode = new Map(layoutRows.map((row) => [String(row.node_id), { x: Number(row.x), y: Number(row.y) }]));
    const particles: SemanticFieldParticle[] = usableRows.map((row) => {
      const nodeId = String(row.node_id);
      const layout = layoutByNode.get(nodeId);
      const fallback = hashPositionForNodeId(nodeId);
      return {
        nodeId,
        project: row.project ?? null,
        embeddingModel: row.embedding_model ?? null,
        embeddingDimensions: Number(row.embedding_dimensions ?? row.embedding.length),
        embedding: row.embedding,
        x: Number.isFinite(layout?.x) ? Number(layout?.x) : fallback.x,
        y: Number.isFinite(layout?.y) ? Number(layout?.y) : fallback.y,
      };
    });

    const cells = buildSemanticFieldCells({
      particles,
      fieldProfile,
      project,
      maxDepth,
      maxLeafSize,
      now,
      source: "openplanner.semantic-field",
    });
    const pairs = collectSemanticFieldPairs(cells, theta, maxInteractions);
    const comparison = await compareSemanticFieldPairs({
      pairs,
      vexxBaseUrl: String(req.body?.vexxBaseUrl ?? req.body?.vexx_base_url ?? process.env.VEXX_BASE_URL ?? "http://host.docker.internal:8791"),
      vexxApiKey: String(req.body?.vexxApiKey ?? req.body?.vexx_api_key ?? process.env.VEXX_API_KEY ?? "") || undefined,
      device: String(req.body?.vexxDevice ?? req.body?.vexx_device ?? process.env.VEXX_DEVICE ?? "AUTO"),
      requireAccel: req.body?.vexxRequireAccel === true || /^(1|true|yes|on)$/i.test(String(process.env.VEXX_REQUIRE_ACCEL ?? "false")),
      timeoutMs: Math.max(1000, Number(req.body?.vexxTimeoutMs ?? req.body?.vexx_timeout_ms ?? process.env.VEXX_TIMEOUT_MS ?? 30000)),
      chargeAlpha,
    });
    const interactions = comparison.interactions.filter((interaction) => Math.abs(interaction.charge) >= minAbsCharge);

    if (!dryRun && cells.length > 0) {
      await app.mongo.graphSemanticFieldCells.bulkWrite(cells.map((cell) => {
        const { children: _children, ...document } = cell;
        return {
          replaceOne: {
            filter: { cell_id: cell.cell_id },
            replacement: {
              ...document,
              _id: cell.cell_id,
              createdAt: now,
              updatedAt: now,
            },
            upsert: true,
          },
        };
      }), { ordered: false });
    }

    const forceRows = interactions.map((interaction) => ({
      source_node_id: interaction.source,
      target_node_id: interaction.target,
      similarity: interaction.similarity,
      charge: interaction.charge,
      force_kind: "semantic_field_multipole",
      field_profile: fieldProfile,
      project,
      embedding_model: cells.find((cell) => cell.cell_id === interaction.source)?.embedding_model ?? null,
      embedding_dimensions: cells.find((cell) => cell.cell_id === interaction.source)?.embedding_dimensions ?? null,
      source: "openplanner.semantic-field",
      updated_at: now,
    }));
    const storedInteractions = dryRun || forceRows.length === 0
      ? 0
      : await upsertGraphSemanticForceSamples(app.mongo.graphSemanticForceSamples, forceRows);

    return {
      ok: true,
      dryRun,
      fieldProfile,
      source: "semantic_field_cells",
      projection: "barnes_hut_quadtree",
      theta,
      maxDepth,
      maxLeafSize,
      nodeCount: particles.length,
      cellCount: cells.length,
      candidateInteractionCount: pairs.length,
      interactionCount: interactions.length,
      storedCells: dryRun ? 0 : cells.length,
      storedInteractions,
      comparisonProvider: comparison.provider,
      vexxCalls: comparison.vexxCalls,
      vexxFailures: comparison.vexxFailures,
      cells: cells.slice(0, Math.min(25, cells.length)).map(semanticFieldCellToApi),
      interactions: interactions.slice(0, Math.min(25, interactions.length)),
    };
  });

  // ============================================================
  // Compacted ViewGraph Nodes (simulation projection, not truth)
  // ============================================================

  app.get("/graph/view/compact", async (req: any) => {
    const nodeId = typeof req.query?.node_id === "string" ? req.query.node_id.trim() : "";
    const viewNodeId = typeof req.query?.view_node_id === "string" ? req.query.view_node_id.trim() : "";
    const status = typeof req.query?.status === "string" ? req.query.status.trim() : "active";
    const limit = Math.max(1, Math.min(1000, Number(req.query?.limit ?? 200)));

    const filter: Record<string, unknown> = {};
    if (viewNodeId) filter.view_node_id = viewNodeId;
    if (nodeId) filter.child_node_ids = nodeId;
    if (status && status !== "any") filter.status = status;

    const rows = await app.mongo.graphViewNodes
      .find(filter)
      .sort({ updated_at: -1 })
      .limit(limit)
      .toArray();

    return {
      ok: true,
      count: rows.length,
      view_nodes: rows.map(graphViewNodeToApi),
    };
  });

  app.post("/graph/view/compact", async (req: any, reply) => {
    const nodeIds = uniqueStrings(req.body?.nodeIds ?? req.body?.childNodeIds);
    const childViewNodeIds = uniqueStrings(req.body?.childViewNodeIds);
    const graphVersion = typeof req.body?.graphVersion === "string" ? req.body.graphVersion.trim() || null : null;
    const parentViewNodeId = typeof req.body?.parentViewNodeId === "string" ? req.body.parentViewNodeId.trim() || null : null;
    const project = typeof req.body?.project === "string" ? req.body.project.trim() || null : null;
    const expansionThreshold = clamp01(req.body?.expansionThreshold, 0.82);
    const saturation = clamp01(req.body?.saturation, 0);
    const averageChildSaturation = clamp01(req.body?.averageChildSaturation, saturation);
    const compactionScalar = clamp01(req.body?.compactionScalar, 0.5);
    const resourcePressure = clamp01(req.body?.resourcePressure, compactionScalar);
    const source = typeof req.body?.source === "string" ? req.body.source.trim() || "graph-view-compaction" : "graph-view-compaction";

    if (nodeIds.length === 0 && childViewNodeIds.length === 0) {
      return reply.status(400).send({ error: "nodeIds or childViewNodeIds are required" });
    }

    const childViewRows = childViewNodeIds.length > 0
      ? await app.mongo.graphViewNodes.find({ view_node_id: { $in: childViewNodeIds }, status: { $ne: "archived" } }).toArray() as GraphViewNodeDocument[]
      : [];
    const representedNodeIds = [...new Set([
      ...nodeIds,
      ...childViewRows.flatMap((row) => Array.isArray(row.child_node_ids) ? row.child_node_ids : []),
    ])];
    if (representedNodeIds.length === 0) {
      return reply.status(400).send({ error: "no represented truth nodes resolved" });
    }

    const embeddingRows = await app.mongo.graphNodeEmbeddings
      .find({ node_id: { $in: representedNodeIds }, embedding: { $exists: true } }, {
        projection: { node_id: 1, embedding: 1, embedding_model: 1, embedding_dimensions: 1, project: 1 },
      })
      .toArray() as Array<{ node_id: string; embedding?: number[]; embedding_model?: string | null; embedding_dimensions?: number | null; project?: string | null }>;

    const embeddingCandidates = [
      ...embeddingRows
        .filter((row) => Array.isArray(row.embedding) && row.embedding.length > 0)
        .map((row) => ({ model: row.embedding_model ?? null, dimensions: Number(row.embedding_dimensions ?? row.embedding!.length), embedding: row.embedding! })),
      ...childViewRows
        .filter((row) => Array.isArray(row.embedding) && row.embedding.length > 0)
        .map((row) => ({ model: row.embedding_model ?? null, dimensions: Number(row.embedding_dimensions ?? row.embedding.length), embedding: row.embedding })),
    ];
    if (embeddingCandidates.length === 0) {
      return reply.status(400).send({ error: "no embeddings found for represented nodes" });
    }

    const groups = new Map<string, typeof embeddingCandidates>();
    for (const candidate of embeddingCandidates) {
      const key = `${candidate.model ?? ""}::${candidate.dimensions}`;
      const rows = groups.get(key) ?? [];
      rows.push(candidate);
      groups.set(key, rows);
    }
    const selected = [...groups.values()].sort((a, b) => b.length - a.length)[0]!;
    const embedding = averageEmbeddingVectors(selected.map((row) => row.embedding));
    if (embedding.length === 0) {
      return reply.status(400).send({ error: "failed to average embeddings for compacted view node" });
    }
    const embeddingModel = selected[0]?.model ?? null;
    const embeddingDimensions = selected[0]?.dimensions ?? embedding.length;

    const eventRows = await app.mongo.events.find({
      $or: [
        { id: { $in: representedNodeIds } },
        { "extra.node_id": { $in: representedNodeIds } },
      ],
    }, {
      projection: { id: 1, kind: 1, source: 1, project: 1, message: 1, extra: 1 },
    }).limit(Math.min(5000, representedNodeIds.length * 2)).toArray() as any[];
    const eventByNodeId = new Map<string, any>();
    for (const row of eventRows) {
      const nodeId = typeof row?.extra?.node_id === "string" ? row.extra.node_id : row.id;
      if (typeof nodeId === "string" && nodeId) eventByNodeId.set(nodeId, row);
    }

    const sourceMetadata: GraphViewNodeSourceMetadata[] = representedNodeIds.map((nodeId) => {
      const event = eventByNodeId.get(nodeId);
      const sourceKind = inferSourceKindFromNodeId(nodeId);
      const extra = isPlainRecord(event?.extra) ? event.extra : {};
      const rawSourceRef = isPlainRecord(extra.source_ref) ? extra.source_ref : extra;
      const { preview: _preview, text: _text, body: _body, content: _content, ...sourceRef } = rawSourceRef;
      return {
        node_id: nodeId,
        source_kind: sourceKind,
        project: typeof event?.project === "string" ? event.project : project,
        source: typeof event?.source === "string" ? event.source : null,
        title: typeof extra.title === "string" ? extra.title : (typeof event?.message === "string" ? event.message.slice(0, 120) : null),
        source_ref: sourceRef,
        access_instruction: accessInstructionForSourceKind(sourceKind),
      };
    });

    const viewNodeId = typeof req.body?.viewNodeId === "string" && req.body.viewNodeId.trim()
      ? req.body.viewNodeId.trim()
      : buildViewNodeId({ nodeIds: representedNodeIds, parentViewNodeId, graphVersion });
    const now = new Date();
    const doc: GraphViewNodeDocument = {
      _id: viewNodeId,
      view_node_id: viewNodeId,
      view_kind: "compact",
      status: saturation >= expansionThreshold ? "expanded" : "active",
      project,
      graph_version: graphVersion,
      parent_view_node_id: parentViewNodeId,
      child_node_ids: representedNodeIds,
      child_view_node_ids: childViewNodeIds,
      descendant_node_count: representedNodeIds.length,
      embedding_model: embeddingModel,
      embedding_dimensions: embeddingDimensions,
      embedding,
      saturation,
      average_child_saturation: averageChildSaturation,
      expansion_threshold: expansionThreshold,
      compaction_scalar: compactionScalar,
      resource_pressure: resourcePressure,
      source_metadata: sourceMetadata,
      created_by: source,
      updated_at: now,
      createdAt: now,
      updatedAt: now,
    };

    const { _id: _docId, createdAt: _createdAt, ...docSet } = doc;
    await app.mongo.graphViewNodes.updateOne(
      { view_node_id: viewNodeId },
      {
        $set: docSet,
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    await upsertGraphNodeEmbeddings(app.mongo.graphNodeEmbeddings, [{
      node_id: viewNodeId,
      source_event_id: viewNodeId,
      project,
      embedding_model: embeddingModel,
      embedding_dimensions: embeddingDimensions,
      embedding,
      chunk_index: 0,
      chunk_count: 1,
      text: `Compacted ViewGraph node representing ${representedNodeIds.length} TruthGraph nodes. Use source_metadata to expand represented sources; do not treat this as one source document.`,
      updated_at: now,
    }]);

    return {
      ok: true,
      view_node: graphViewNodeToApi(doc),
      represented: representedNodeIds.length,
      embeddingStored: true,
    };
  });

  app.post("/graph/view/compact/:view_node_id/state", async (req: any, reply) => {
    const viewNodeId = String(req.params?.view_node_id ?? "").trim();
    if (!viewNodeId) return reply.status(400).send({ error: "view_node_id is required" });
    const now = new Date();
    const patch: Record<string, unknown> = { updated_at: now, updatedAt: now };
    if (req.body?.saturation !== undefined) patch.saturation = clamp01(req.body.saturation, 0);
    if (req.body?.averageChildSaturation !== undefined) patch.average_child_saturation = clamp01(req.body.averageChildSaturation, 0);
    if (req.body?.expansionThreshold !== undefined) patch.expansion_threshold = clamp01(req.body.expansionThreshold, 0.82);
    if (req.body?.status !== undefined) {
      const status = String(req.body.status ?? "").trim();
      if (!["active", "expanded", "archived"].includes(status)) return reply.status(400).send({ error: "invalid status" });
      patch.status = status;
    }
    const result = await app.mongo.graphViewNodes.updateOne({ view_node_id: viewNodeId }, { $set: patch });
    return { ok: result.matchedCount > 0, matched: result.matchedCount, modified: result.modifiedCount };
  });

  app.post("/graph/view/compact/run", async (req: any) => {
    const project = typeof req.body?.project === "string" ? req.body.project.trim() : "";
    const dryRun = req.body?.dryRun === true;
    const groupSize = Math.max(2, Math.min(256, Math.floor(Number(req.body?.groupSize ?? 12))));
    const minGroupSize = Math.max(2, Math.min(groupSize, Math.floor(Number(req.body?.minGroupSize ?? 3))));
    const maxGroups = Math.max(1, Math.min(256, Math.floor(Number(req.body?.maxGroups ?? 8))));
    const maxCandidates = Math.max(groupSize, Math.min(50000, Math.floor(Number(req.body?.maxCandidates ?? 5000))));
    const lookbackSeconds = Math.max(60, Math.min(7 * 24 * 60 * 60, Math.floor(Number(req.body?.lookbackSeconds ?? 6 * 60 * 60))));
    const minCompactionScalar = clamp01(req.body?.minCompactionScalar, 0.2);
    const maxAverageSaturation = clamp01(req.body?.maxAverageSaturation, 0.25);
    const expansionThreshold = clamp01(req.body?.expansionThreshold, 0.82);

    const hostPressure = hostResourcePressureScalar();
    const resourcePressure = req.body?.resourcePressure === undefined
      ? hostPressure.scalar
      : clamp01(req.body.resourcePressure, hostPressure.scalar);
    const queuePressure = clamp01(req.body?.queuePressure, 0);
    const renderPressure = clamp01(req.body?.renderPressure, 0);
    const graphSizePressure = clamp01(req.body?.graphSizePressure, 0);
    const compactionScalar = clamp01(
      (resourcePressure * 0.55) + (queuePressure * 0.15) + (renderPressure * 0.15) + (graphSizePressure * 0.15),
      resourcePressure,
    );

    if (compactionScalar < minCompactionScalar) {
      return {
        ok: true,
        dryRun,
        compacted: 0,
        skipped: "below_min_compaction_scalar",
        compactionScalar,
        resourcePressure,
        hostPressure,
      };
    }

    const activeViewRows = await app.mongo.graphViewNodes.find({ status: { $ne: "archived" } }, {
      projection: { child_node_ids: 1 },
    }).toArray() as Array<{ child_node_ids?: string[] }>;
    const alreadyCompacted = new Set(activeViewRows.flatMap((row) => Array.isArray(row.child_node_ids) ? row.child_node_ids : []));

    const candidateFilter: Record<string, unknown> = {
      node_id: { $not: /^view:compact:/ },
      embedding: { $exists: true },
    };
    if (project) candidateFilter.project = project;

    const candidateRows = await app.mongo.graphNodeEmbeddings.find(candidateFilter, {
      projection: { node_id: 1, project: 1, embedding_model: 1, embedding_dimensions: 1, updated_at: 1 },
    }).sort({ updated_at: 1 }).limit(maxCandidates).toArray() as Array<{
      node_id: string;
      project?: string | null;
      embedding_model?: string | null;
      embedding_dimensions?: number | null;
      updated_at?: Date;
    }>;

    const candidateIds = candidateRows
      .map((row) => String(row.node_id ?? ""))
      .filter((nodeId) => nodeId && !alreadyCompacted.has(nodeId));

    const trailSince = new Date(Date.now() - (lookbackSeconds * 1000));
    const trailRows = candidateIds.length > 0
      ? await app.mongo.graphDaimoiTrails.find({ node_ids: { $in: candidateIds }, emitted_at: { $gte: trailSince } })
        .limit(10000)
        .toArray()
      : [];
    const saturationByNode = new Map<string, number>();
    const now = new Date();
    for (const trail of trailRows) {
      const influence = decayedTrailInfluence({
        activation: Number(trail.activation ?? 0),
        emittedAt: trail.emitted_at instanceof Date ? trail.emitted_at : new Date(trail.emitted_at),
        now,
        halfLifeSeconds: Number(trail.decay_half_life_seconds ?? lookbackSeconds),
      });
      for (const nodeId of Array.isArray(trail.node_ids) ? trail.node_ids : []) {
        saturationByNode.set(nodeId, clamp01((saturationByNode.get(nodeId) ?? 0) + influence, 0));
      }
    }

    const candidates = candidateRows
      .filter((row) => candidateIds.includes(String(row.node_id ?? "")))
      .map((row) => ({
        ...row,
        saturation: saturationByNode.get(String(row.node_id)) ?? 0,
        bucket: `${row.project ?? ""}::${row.embedding_model ?? ""}::${row.embedding_dimensions ?? 0}`,
      }))
      .filter((row) => row.saturation <= maxAverageSaturation)
      .sort((a, b) => a.saturation - b.saturation || String(a.node_id).localeCompare(String(b.node_id)));

    const buckets = new Map<string, typeof candidates>();
    for (const candidate of candidates) {
      const rows = buckets.get(candidate.bucket) ?? [];
      rows.push(candidate);
      buckets.set(candidate.bucket, rows);
    }

    const groups: Array<{ nodeIds: string[]; averageSaturation: number; bucket: string }> = [];
    for (const [bucket, rows] of [...buckets.entries()].sort((a, b) => b[1].length - a[1].length)) {
      for (let offset = 0; offset < rows.length && groups.length < maxGroups; offset += groupSize) {
        const slice = rows.slice(offset, offset + groupSize);
        if (slice.length < minGroupSize) continue;
        const averageSaturation = slice.reduce((sum, row) => sum + row.saturation, 0) / slice.length;
        groups.push({ nodeIds: slice.map((row) => row.node_id), averageSaturation, bucket });
      }
      if (groups.length >= maxGroups) break;
    }

    if (dryRun) {
      return {
        ok: true,
        dryRun: true,
        compacted: 0,
        candidateCount: candidates.length,
        groups,
        compactionScalar,
        resourcePressure,
        hostPressure,
      };
    }

    const compacted: unknown[] = [];
    const failures: unknown[] = [];
    for (const group of groups) {
      const response = await app.inject({
        method: "POST",
        url: "/v1/graph/view/compact",
        headers: {
          ...(typeof req.headers?.authorization === "string" ? { authorization: req.headers.authorization } : {}),
          "content-type": "application/json",
        },
        payload: {
          nodeIds: group.nodeIds,
          project: project || null,
          saturation: group.averageSaturation,
          averageChildSaturation: group.averageSaturation,
          expansionThreshold,
          compactionScalar,
          resourcePressure,
          source: "compact-view-scheduler",
        },
      });
      const payload = (() => {
        try { return JSON.parse(response.body); } catch { return { raw: response.body }; }
      })();
      if (response.statusCode >= 200 && response.statusCode < 300) compacted.push(payload);
      else failures.push({ statusCode: response.statusCode, payload, group });
    }

    return {
      ok: failures.length === 0,
      dryRun: false,
      compacted: compacted.length,
      failures,
      candidateCount: candidates.length,
      groupCount: groups.length,
      compactionScalar,
      resourcePressure,
      hostPressure,
      viewNodes: compacted.map((row: any) => row?.view_node).filter(Boolean),
    };
  });

  // ============================================================
  // Evidence-backed Edge Claims (relation truth candidates)
  // ============================================================

  app.post("/graph/edge-claims", async (req: any, reply) => {
    const body = isPlainRecord(req.body) ? req.body : {};
    const inferredScope = normalizeEdgeClaimScope({
      tenant_id: body.tenant_id,
      org_id: body.org_id,
      project: body.project,
      lake: body.lake,
      graph_version: body.graph_version,
    });
    const normalizedClaim = normalizeEdgeClaimInput({
      ...body,
      scope: normalizeEdgeClaimScope(body.scope) ?? inferredScope ?? undefined,
    });
    const claimExplanation = explainEdgeClaim(normalizedClaim) as { "valid?"?: boolean; errors?: unknown[] };
    if (claimExplanation["valid?"] === false) {
      return reply.status(400).send({ error: "invalid_edge_claim", details: claimExplanation.errors ?? [] });
    }
    const claimDecision = evaluateEdgeClaim(normalizedClaim);
    const sourceNodeId = String(normalizedClaim.source_node_id ?? "");
    const targetNodeId = String(normalizedClaim.target_node_id ?? "");
    const relationKind = normalizedClaim.relation_kind;
    const direction = normalizedClaim.direction;
    const scope = normalizedClaim.scope;
    const claimId = String(normalizedClaim.claim_id ?? "");
    const status = normalizedClaim.status;
    const confidence = normalizedClaim.confidence;
    const now = new Date();
    const validFrom = parseOptionalDate(body.valid_from) ?? now;
    const validUntil = parseOptionalDate(body.valid_until);

    await app.mongo.graphEdgeClaims.updateOne(
      { _id: claimId },
      {
        $set: {
          claim_id: claimId,
          source_node_id: sourceNodeId,
          target_node_id: targetNodeId,
          relation_kind: relationKind,
          direction,
          scope,
          status,
          confidence,
          support_event_ids: uniqueStrings(body.support_event_ids ?? body.supportEventIds),
          refute_event_ids: uniqueStrings(body.refute_event_ids ?? body.refuteEventIds),
          supersedes_claim_ids: uniqueStrings(body.supersedes_claim_ids ?? body.supersedesClaimIds),
          valid_from: validFrom,
          valid_until: validUntil,
          decay_policy: body.decay_policy == null ? null : String(body.decay_policy),
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    const row = await app.mongo.graphEdgeClaims.findOne({ _id: claimId });
    return { ok: true, claim: row ? edgeClaimToApi(row) : { claim_id: claimId }, decision: claimDecision };
  });

  app.get("/graph/edge-claims", async (req: any) => {
    const nodeId = typeof req.query?.node_id === "string" ? req.query.node_id.trim() : "";
    const project = typeof req.query?.project === "string" ? req.query.project.trim() : "";
    const relationKind = typeof req.query?.relation_kind === "string" ? req.query.relation_kind.trim() : "";
    const statusParam = typeof req.query?.status === "string" ? req.query.status.trim() : "";
    const statuses = statusParam
      ? statusParam.split(",").map((value: string) => normalizeEdgeClaimStatus(value)).filter(Boolean)
      : [];
    const limit = Math.max(1, Math.min(10000, Number(req.query?.limit ?? 1000)));

    const filter: Record<string, unknown> = {};
    if (nodeId) {
      filter.$or = [{ source_node_id: nodeId }, { target_node_id: nodeId }];
    }
    if (project) filter["scope.project"] = project;
    if (relationKind) filter.relation_kind = relationKind;
    if (statuses.length > 0) filter.status = { $in: statuses };

    const rows = await app.mongo.graphEdgeClaims.find(filter).sort({ updatedAt: -1 }).limit(limit).toArray();
    return { ok: true, claims: rows.map(edgeClaimToApi) };
  });

  app.post("/graph/edge-claims/:claim_id/support", async (req: any, reply) => {
    const claimId = String(req.params?.claim_id ?? "").trim();
    const body = isPlainRecord(req.body) ? req.body : {};
    const plan = planEdgeClaimTransition("support", body);
    const now = new Date();

    const result = await app.mongo.graphEdgeClaims.updateOne(
      { _id: claimId },
      {
        $set: {
          status: plan.status,
          confidence: plan.confidence ?? 0.75,
          updatedAt: now,
        },
        $addToSet: { support_event_ids: { $each: plan.eventIds } },
      },
    );
    if (result.matchedCount === 0) return reply.status(404).send({ error: "edge_claim_not_found" });
    const row = await app.mongo.graphEdgeClaims.findOne({ _id: claimId });
    return { ok: true, claim: row ? edgeClaimToApi(row) : null, transition: plan };
  });

  app.post("/graph/edge-claims/:claim_id/refute", async (req: any, reply) => {
    const claimId = String(req.params?.claim_id ?? "").trim();
    const body = isPlainRecord(req.body) ? req.body : {};
    const plan = planEdgeClaimTransition("refute", body);
    const now = new Date();

    const result = await app.mongo.graphEdgeClaims.updateOne(
      { _id: claimId },
      {
        $set: {
          status: plan.status,
          confidence: plan.confidence ?? 0,
          updatedAt: now,
        },
        $addToSet: { refute_event_ids: { $each: plan.eventIds } },
      },
    );
    if (result.matchedCount === 0) return reply.status(404).send({ error: "edge_claim_not_found" });
    const row = await app.mongo.graphEdgeClaims.findOne({ _id: claimId });
    return { ok: true, claim: row ? edgeClaimToApi(row) : null, transition: plan };
  });

  app.post("/graph/edge-claims/:claim_id/withdraw", async (req: any, reply) => {
    const claimId = String(req.params?.claim_id ?? "").trim();
    const plan = planEdgeClaimTransition("withdraw", isPlainRecord(req.body) ? req.body : {});
    const now = new Date();
    const result = await app.mongo.graphEdgeClaims.updateOne(
      { _id: claimId },
      { $set: { status: plan.status, updatedAt: now } },
    );
    if (result.matchedCount === 0) return reply.status(404).send({ error: "edge_claim_not_found" });
    const row = await app.mongo.graphEdgeClaims.findOne({ _id: claimId });
    return { ok: true, claim: row ? edgeClaimToApi(row) : null, transition: plan };
  });

  app.post("/graph/edge-claims/project", async (req: any) => {
    const body = isPlainRecord(req.body) ? req.body : {};
    const nodeIds = uniqueStrings(body.node_ids ?? body.nodeIds);
    const statuses = uniqueStrings(body.statuses).length > 0
      ? uniqueStrings(body.statuses).map((value) => normalizeEdgeClaimStatus(value))
      : [...EDGE_CLAIM_ACTIVE_PROJECTABLE_STATUSES];
    const relationKinds = uniqueStrings(body.relation_kinds ?? body.relationKinds);
    const project = String(body.project ?? "").trim();
    const includeExpired = body.include_expired === true || body.includeExpired === true;
    const limit = Math.max(1, Math.min(50000, Number(body.limit ?? 10000)));
    const now = new Date();

    const filter: Record<string, unknown> = { status: { $in: statuses } };
    if (nodeIds.length > 0) {
      filter.$or = [
        { source_node_id: { $in: nodeIds } },
        { target_node_id: { $in: nodeIds } },
      ];
    }
    if (relationKinds.length > 0) filter.relation_kind = { $in: relationKinds };
    if (project) filter["scope.project"] = project;
    if (!includeExpired) {
      filter.$and = [
        {
          $or: [
            { valid_until: null },
            { valid_until: { $exists: false } },
            { valid_until: { $gt: now } },
          ],
        },
      ];
    }

    const rows = await app.mongo.graphEdgeClaims.find(filter).sort({ confidence: -1, updatedAt: -1 }).limit(limit).toArray();
    const projection = projectMongoEdgeClaims(rows, {
      statuses,
      includeExpired,
      now,
    });

    return { ok: true, edges: projection.edges, claims: rows.map(edgeClaimToApi), stats: projection.stats };
  });

  // ============================================================
  // Label Nodes — structural nodes for categorical labels
  // ============================================================

  const DEFAULT_LABEL_ACTOR_ID = "foamy125_gmail_com";

  function buildLabelId(tenantId: string, slug: string): string {
    return `label:${tenantId}:${slug}`;
  }

  function normalizeActorId(value: unknown): string {
    return String(value ?? DEFAULT_LABEL_ACTOR_ID).trim() || DEFAULT_LABEL_ACTOR_ID;
  }

  function normalizeLabelSlug(value: unknown): string {
    return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
  }

  app.post("/graph/labels", async (req: any, reply) => {
    const body = isPlainRecord(req.body) ? req.body : {};
    const tenantId = String(body.tenant_id ?? "default").trim();
    const slug = normalizeLabelSlug(body.slug ?? body.label);
    const label = String(body.label ?? "").trim();
    const description = String(body.description ?? "").trim();
    const emoji = String(body.emoji ?? "").trim() || null;
    const color = String(body.color ?? "").trim() || null;
    const project = String(body.project ?? "").trim() || null;
    const actorId = normalizeActorId(body.actor_id ?? body.actorId ?? body.created_by_actor_id ?? body.createdByActorId);

    if (!slug) return reply.status(400).send({ error: "slug_or_label_required" });
    if (!label) return reply.status(400).send({ error: "label_required" });

    const labelId = buildLabelId(tenantId, slug);
    const now = new Date();

    const doc = {
      _id: labelId,
      label_id: labelId,
      label,
      emoji,
      description,
      color,
      tenant_id: tenantId,
      project,
      embedding_model: null,
      embedding_dimensions: 0,
      embedding: null,
      created_by: String(body.created_by ?? actorId),
      created_by_actor_id: actorId,
      createdAt: now,
      updatedAt: now,
    };

    await app.mongo.graphLabelNodes.updateOne(
      { label_id: labelId },
      { $set: doc },
      { upsert: true },
    );

    // Queue embedding for the label description
    if (description) {
      const embeddingText = `${label}. ${description}`;
      const normalized = formatEmbeddingPassageText(embeddingText);
      if (normalized) {
        await upsertGraphNodeEmbeddings(app.mongo.graphNodeEmbeddings, [{
          node_id: labelId,
          source_event_id: labelId,
          project,
          embedding_model: null,
          embedding_dimensions: 0,
          embedding: [],
          chunk_index: 0,
          chunk_count: 1,
          text: normalized,
          updated_at: now,
        }]);
      }
    }

    return { ok: true, label: doc };
  });

  app.get("/graph/labels", async (req: any) => {
    const tenantId = String(req.query?.tenant_id ?? "default").trim();
    const project = typeof req.query?.project === "string" ? req.query.project.trim() : null;
    const search = typeof req.query?.search === "string" ? req.query.search.trim() : "";
    const limit = Math.max(1, Math.min(1000, Number(req.query?.limit ?? 100)));

    const filter: Record<string, unknown> = { tenant_id: tenantId };
    if (project) filter.project = project;
    if (search) {
      filter.$or = [
        { label: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const rows = await app.mongo.graphLabelNodes
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();

    const labelIds = rows.map((row: any) => row.label_id).filter(Boolean);
    const counts = labelIds.length > 0
      ? await app.mongo.graphEdges.aggregate([
          { $match: { target_node_id: { $in: labelIds }, edge_kind: "has_label" } },
          { $group: {
              _id: "$target_node_id",
              node_count: { $sum: 1 },
              sources: { $addToSet: "$source" },
              actor_ids: { $addToSet: "$data.actor_id" },
            } },
        ]).toArray()
      : [];
    const countByLabelId = new Map(counts.map((row: any) => [row._id, row]));
    const labels = rows.map((row: any) => {
      const stats = countByLabelId.get(row.label_id) ?? {};
      const actorIds = Array.isArray(stats.actor_ids) ? stats.actor_ids.filter(Boolean) : [];
      const sources = Array.isArray(stats.sources) ? stats.sources.filter(Boolean) : [];
      return {
        ...row,
        node_count: Number(stats.node_count ?? 0),
        label_count: Number(stats.node_count ?? 0),
        source_stats: {
          sources,
          actor_ids: actorIds,
        },
      };
    });

    return { ok: true, labels, count: labels.length };
  });

  app.get("/graph/labels/:label_id", async (req: any, reply) => {
    const labelId = String(req.params?.label_id ?? "").trim();
    if (!labelId) return reply.status(400).send({ error: "label_id_required" });

    const row = await app.mongo.graphLabelNodes.findOne({ label_id: labelId });
    if (!row) return reply.status(404).send({ error: "label_not_found" });

    return { ok: true, label: row };
  });

  app.patch("/graph/labels/:label_id", async (req: any, reply) => {
    const labelId = String(req.params?.label_id ?? "").trim();
    const body = isPlainRecord(req.body) ? req.body : {};
    if (!labelId) return reply.status(400).send({ error: "label_id_required" });

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.label !== undefined) updates.label = String(body.label).trim();
    if (body.description !== undefined) updates.description = String(body.description).trim();
    if (body.emoji !== undefined) updates.emoji = String(body.emoji).trim() || null;
    if (body.color !== undefined) updates.color = String(body.color).trim() || null;

    const result = await app.mongo.graphLabelNodes.findOneAndUpdate(
      { label_id: labelId },
      { $set: updates },
      { returnDocument: "after" },
    );

    if (!result) return reply.status(404).send({ error: "label_not_found" });

    // Re-queue embedding if description changed
    if (body.description !== undefined && result.description) {
      const embeddingText = `${result.label}. ${result.description}`;
      const normalized = formatEmbeddingPassageText(embeddingText);
      if (normalized) {
        await upsertGraphNodeEmbeddings(app.mongo.graphNodeEmbeddings, [{
          node_id: labelId,
          source_event_id: labelId,
          project: result.project,
          embedding_model: null,
          embedding_dimensions: 0,
          embedding: [],
          chunk_index: 0,
          chunk_count: 1,
          text: normalized,
          updated_at: new Date(),
        }]);
      }
    }

    return { ok: true, label: result };
  });

  app.delete("/graph/labels/:label_id", async (req: any, reply) => {
    const labelId = String(req.params?.label_id ?? "").trim();
    if (!labelId) return reply.status(400).send({ error: "label_id_required" });

    // Remove all has_label edges first
    await app.mongo.graphEdges.deleteMany({ target_node_id: labelId, edge_kind: "has_label" });

    // Remove the label node
    const result = await app.mongo.graphLabelNodes.deleteOne({ label_id: labelId });
    if (result.deletedCount === 0) return reply.status(404).send({ error: "label_not_found" });

    return { ok: true, deleted: true };
  });

  app.post("/graph/labels/:label_id/apply", async (req: any, reply) => {
    const labelId = String(req.params?.label_id ?? "").trim();
    const body = isPlainRecord(req.body) ? req.body : {};
    const nodeId = String(body.node_id ?? "").trim();
    const source = String(body.source ?? "api").trim();
    const actorId = normalizeActorId(body.actor_id ?? body.actorId ?? body.source_actor_id ?? body.sourceActorId ?? body.applied_by_actor_id ?? body.appliedByActorId);

    if (!labelId) return reply.status(400).send({ error: "label_id_required" });
    if (!nodeId) return reply.status(400).send({ error: "node_id_required" });

    const label = await app.mongo.graphLabelNodes.findOne({ label_id: labelId });
    if (!label) return reply.status(404).send({ error: "label_not_found" });

    const now = new Date();
    const edge = {
      _id: `has_label:${nodeId}:${labelId}`,
      source_node_id: nodeId,
      target_node_id: labelId,
      edge_kind: "has_label",
      layer: null,
      project: label.project,
      source,
      data: {
        applied_at: now.toISOString(),
        confidence: body.confidence ?? null,
        actor_id: actorId,
        applied_by_actor_id: actorId,
      },
      updated_at: now,
      createdAt: now,
      updatedAt: now,
    };

    await app.mongo.graphEdges.updateOne(
      { _id: edge._id },
      { $set: edge },
      { upsert: true },
    );

    const labelText = String(label.label ?? labelId).trim() || labelId;
    const markLabelPipeline = [
      { $set: { extra: { $cond: [{ $eq: [{ $type: "$extra" }, "object"] }, "$extra", {}] } } },
      { $set: { "extra.openplanner_labels": { $cond: [{ $eq: [{ $type: "$extra.openplanner_labels" }, "object"] }, "$extra.openplanner_labels", {}] } } },
      { $set: {
        "extra.openplanner_labels.labels": {
          $setUnion: [
            { $cond: [{ $isArray: "$extra.openplanner_labels.labels" }, "$extra.openplanner_labels.labels", []] },
            [labelText],
          ],
        },
        "extra.openplanner_labels.updated_at": now,
        "extra.openplanner_labels.claim_system": "graph-label-v1",
        expiresAt: "$$REMOVE",
        updatedAt: now,
      } },
    ];

    await Promise.all([
      app.mongo.events.updateOne({ _id: nodeId }, markLabelPipeline as any),
      app.mongo.compacted.updateOne({ _id: nodeId }, markLabelPipeline as any),
      addMongoVectorParentLabel(app.mongo, nodeId, labelText),
    ]);

    return { ok: true, edge };
  });

  app.post("/graph/labels/:label_id/remove", async (req: any, reply) => {
    const labelId = String(req.params?.label_id ?? "").trim();
    const body = isPlainRecord(req.body) ? req.body : {};
    const nodeId = String(body.node_id ?? "").trim();

    if (!labelId) return reply.status(400).send({ error: "label_id_required" });
    if (!nodeId) return reply.status(400).send({ error: "node_id_required" });

    const label = await app.mongo.graphLabelNodes.findOne({ label_id: labelId });
    const labelText = String(label?.label ?? labelId).trim() || labelId;
    const now = new Date();
    const edgeId = `has_label:${nodeId}:${labelId}`;
    const result = await app.mongo.graphEdges.deleteOne({ _id: edgeId });

    const unmarkLabelPipeline = (ttlSeconds: number) => {
      const expiresAt = ttlSeconds > 0 ? new Date(Date.now() + ttlSeconds * 1000) : null;
      return [
      { $set: { extra: { $cond: [{ $eq: [{ $type: "$extra" }, "object"] }, "$extra", {}] } } },
      { $set: { "extra.openplanner_labels": { $cond: [{ $eq: [{ $type: "$extra.openplanner_labels" }, "object"] }, "$extra.openplanner_labels", {}] } } },
      { $set: {
        "extra.openplanner_labels.labels": {
          $filter: {
            input: { $cond: [{ $isArray: "$extra.openplanner_labels.labels" }, "$extra.openplanner_labels.labels", []] },
            as: "existingLabel",
            cond: { $ne: ["$$existingLabel", labelText] },
          },
        },
        "extra.openplanner_labels.updated_at": now,
        updatedAt: now,
      } },
      { $set: {
        expiresAt: {
          $cond: [
            { $gt: [{ $size: "$extra.openplanner_labels.labels" }, 0] },
            "$$REMOVE",
            expiresAt,
          ],
        },
      } },
    ];
    };
    const eventsTtlSeconds = Number.parseInt(process.env.MONGODB_EVENTS_TTL_SECONDS ?? "0", 10);
    const compactedTtlSeconds = Number.parseInt(process.env.MONGODB_COMPACTED_TTL_SECONDS ?? "0", 10);

    await Promise.all([
      app.mongo.events.updateOne({ _id: nodeId }, unmarkLabelPipeline(Number.isFinite(eventsTtlSeconds) ? eventsTtlSeconds : 0) as any),
      app.mongo.compacted.updateOne({ _id: nodeId }, unmarkLabelPipeline(Number.isFinite(compactedTtlSeconds) ? compactedTtlSeconds : 0) as any),
      removeMongoVectorParentLabel(app.mongo, nodeId, labelText),
    ]);

    return { ok: true, removed: result.deletedCount > 0 };
  });

  app.get("/graph/labels/:label_id/nodes", async (req: any, reply) => {
    const labelId = String(req.params?.label_id ?? "").trim();
    const limit = Math.max(1, Math.min(10000, Number(req.query?.limit ?? 1000)));

    if (!labelId) return reply.status(400).send({ error: "label_id_required" });

    const edges = await app.mongo.graphEdges
      .find({ target_node_id: labelId, edge_kind: "has_label" })
      .limit(limit)
      .toArray();

    const nodeIds = edges.map((e: any) => e.source_node_id);

    // Fetch events for these nodes by their _id (source_node_id on has_label edges)
    const events = await app.mongo.events
      .find({ _id: { $in: nodeIds } })
      .limit(limit)
      .toArray();

    const eventByNodeId = new Map(events.map((e: any) => [e._id, e]));

    const nodes = edges.map((edge: any) => {
      const nodeId = String(edge.source_node_id);
      return {
        node_id: nodeId,
        event: eventByNodeId.get(nodeId) ?? null,
        label_edge: {
          source: edge.source ?? null,
          actor_id: edge.data?.actor_id ?? edge.data?.applied_by_actor_id ?? DEFAULT_LABEL_ACTOR_ID,
          applied_at: edge.data?.applied_at ?? null,
        },
      };
    });

    return { ok: true, nodes, count: nodes.length };
  });

  // ============================================================
  // ALL Graph Edges (structural + semantic) from graph-weaver
  // ============================================================

  // Upsert ALL edges from graph-weaver
  app.post("/graph/edges/upsert", async (req: any, reply) => {
    const source = req.body?.source ?? "graph-weaver";
    const project = req.body?.project;
    const edges = Array.isArray(req.body?.edges) ? req.body.edges : [];

    if (edges.length === 0) {
      return { ok: true, stored: 0 };
    }

    const rows = edges.map((edge: any) => ({
      source_node_id: String(edge.source ?? edge.source_node_id),
      target_node_id: String(edge.target ?? edge.target_node_id),
      edge_kind: String(edge.kind ?? edge.edge_kind ?? "unknown"),
      layer: edge.layer ?? null,
      project: project ?? null,
      source,
      data: edge.data ?? null,
      updated_at: new Date(),
    })).filter((r: any) => r.source_node_id && r.target_node_id && r.source_node_id !== r.target_node_id);

    const stored = await upsertGraphEdges(app.mongo.graphEdges, rows);
    return { ok: true, stored };
  });

  // Query ALL edges by node IDs
  app.post("/graph/edges/query", async (req: any, reply) => {
    const nodeIds = Array.isArray(req.body?.nodeIds) ? req.body.nodeIds : [];
    const edgeKinds = Array.isArray(req.body?.edgeKinds) ? req.body.edgeKinds : null;
    const limit = Math.max(1, Math.min(50000, Number(req.body?.limit ?? 10000)));
    const includeEventFallback = req.body?.includeEventFallback === true;
    const includeBoundaryEdges = req.body?.includeBoundaryEdges === true;

    if (nodeIds.length === 0) {
      return { edges: [] };
    }

    const stringNodeIds = nodeIds.map(String);
    const filter: Record<string, unknown> = includeBoundaryEdges
      ? {
          $or: [
            { source_node_id: { $in: stringNodeIds } },
            { target_node_id: { $in: stringNodeIds } },
          ],
        }
      : {
          source_node_id: { $in: stringNodeIds },
          target_node_id: { $in: stringNodeIds },
        };
    if (edgeKinds) {
      filter.edge_kind = { $in: edgeKinds };
    }

    const rows = await app.mongo.graphEdges.find(filter).limit(limit).toArray();

    const edgesByKey = new Map<string, {
      source: string;
      target: string;
      edgeKind: string;
      layer: string | null;
      data: unknown;
      updatedAt: Date | null;
    }>();

    for (const row of rows) {
      const edge = {
        source: row.source_node_id,
        target: row.target_node_id,
        edgeKind: row.edge_kind,
        layer: row.layer,
        data: row.data,
        updatedAt: row.updated_at,
      };
      const key = `${edge.edgeKind}::${edge.source}::${edge.target}`;
      edgesByKey.set(key, edge);
    }

    if (includeEventFallback) {
      const eventFilter: Record<string, unknown> = {
        kind: "graph.edge",
        ...(includeBoundaryEdges
          ? {
              $or: [
                { "extra.source_node_id": { $in: stringNodeIds } },
                { "extra.target_node_id": { $in: stringNodeIds } },
              ],
            }
          : {
              "extra.source_node_id": { $in: stringNodeIds },
              "extra.target_node_id": { $in: stringNodeIds },
            }),
      };
      if (edgeKinds) {
        eventFilter["extra.edge_type"] = { $in: edgeKinds };
      }

      const eventRows = await app.mongo.events.find(eventFilter).limit(limit).toArray();

      for (const row of eventRows) {
        const extra = (row.extra ?? {}) as Record<string, unknown>;
        const source = typeof extra.source_node_id === "string" ? extra.source_node_id : "";
        const target = typeof extra.target_node_id === "string" ? extra.target_node_id : "";
        const edgeKind = typeof extra.edge_type === "string" ? extra.edge_type : "unknown";
        if (!source || !target) continue;
        const key = `${edgeKind}::${source}::${target}`;
        if (edgesByKey.has(key)) continue;
        edgesByKey.set(key, {
          source,
          target,
          edgeKind,
          layer: typeof extra.layer === "string" ? extra.layer : null,
          data: extra,
          updatedAt: row.ts instanceof Date ? row.ts : null,
        });
      }
    }

    const edges = [...edgesByKey.values()].slice(0, limit);

    return { edges };
  });

  // Get all edges for graph traversal (paginated)
  app.get("/graph/semantic-edges", async (req: any, reply) => {
    const project = typeof req.query?.project === "string" ? req.query.project.trim() : undefined;
    const graphVersion = typeof req.query?.graph_version === "string" ? req.query.graph_version.trim() : undefined;
    const minSimilarity = Number(req.query?.minSimilarity ?? -1);
    const limit = Math.max(1, Math.min(50000, Number(req.query?.limit ?? 10000)));

    const filter: Record<string, unknown> = {
      similarity: { $gte: minSimilarity },
    };
    if (project) filter.project = project;

    if (graphVersion) {
      filter.graph_version = graphVersion;
    } else {
      const canonicalRun = await app.mongo.semanticGraphRuns.findOne(
        { status: "complete" },
        { sort: { finished_at: -1 as any } },
      );
      if (canonicalRun?.graph_version) {
        filter.graph_version = canonicalRun.graph_version;
      }
    }

    const rows = await app.mongo.graphSemanticEdges.find(filter).limit(limit).toArray();

    const edges = rows.map((row: any) => ({
      source: row.source_node_id,
      target: row.target_node_id,
      similarity: row.similarity,
      edgeType: row.edge_type,
      graphVersion: row.graph_version,
    }));

    return { ok: true, count: edges.length, edges };
  });

  // ============================================================
  // Mongot-native semantic edge builder (replaces HNSW pipeline)
  // Uses $vectorSearch on event_chunks (already indexed) to build
  // kNN edges without a separate HNSW build step.
  // ============================================================

  app.post("/jobs/build-semantic-edges", async (req: any) => {
    const body = (req.body as any) ?? {};
    const k = Math.max(2, Math.min(64, Number(body.k ?? 8)));
    const minSimilarity = Math.max(0, Math.min(1, Number(body.minSimilarity ?? 0.5)));
    const maxDegree = Math.max(2, Number(body.maxDegree ?? k * 2));
    const concurrency = Math.max(1, Math.min(16, Number(body.concurrency ?? 8)));

    // 1. Read all event_chunks with embeddings
    const chunks = await app.mongo.hotVectors.find(
      { embedding: { $exists: true, $type: "array", $ne: [] } },
      { projection: { _id: 1, chunk_id: 1, title: 1, kind: 1, project: 1, embedding: 1, embedding_model: 1, embedding_dimensions: 1 } },
    ).toArray();

    if (chunks.length === 0) {
      return { ok: true, note: "No chunks with embeddings found", nodes: 0, edges: 0 };
    }

    // 2. Create graph.node events for each chunk so the export has visible nodes
    const nodePrefix = "devel:chunk:";
    const eventBatch: Array<any> = [];
    const embeddingRows: Array<any> = [];
    const chunkIdToNodeId = new Map<string, string>();

    for (const chunk of chunks) {
      const nodeId = `${nodePrefix}${chunk._id}`;
      const eventId = `graph.node:chunk:${chunk._id}`;
      chunkIdToNodeId.set(String(chunk._id), nodeId);

      const title = chunk.title || "";
      const label = title.split("/").pop() || title || String(chunk._id);

      eventBatch.push({
        updateOne: {
          filter: { _id: eventId },
          update: {
            $set: {
              kind: "graph.node",
              project: chunk.project || "devel",
              source: "chunk-graph-builder",
              "extra.node_id": nodeId,
              "extra.node_kind": "chunk",
              "extra.label": label,
              "extra.path": title,
              "extra.node_type": chunk.kind || "code",
              "extra.lake": chunk.project || "devel",
              ts: new Date(),
            },
            $setOnInsert: { createdAt: new Date(), text: "" },
          },
          upsert: true,
        },
      });

      embeddingRows.push({
        node_id: nodeId,
        source_event_id: eventId,
        project: chunk.project || "devel",
        embedding_model: chunk.embedding_model || "qwen3-embedding:0.6b",
        embedding_dimensions: chunk.embedding_dimensions || 1024,
        embedding: chunk.embedding,
        chunk_index: chunk.chunk_index ?? 0,
        chunk_count: chunk.chunk_count ?? 1,
      });
    }

    // Batch upsert graph.node events
    const eventBatchSize = 2000;
    for (let i = 0; i < eventBatch.length; i += eventBatchSize) {
      await app.mongo.events.bulkWrite(eventBatch.slice(i, i + eventBatchSize), { ordered: false });
    }

    // Upsert graph_node_embeddings (for the embedding backfill / future HNSW use)
    await upsertGraphNodeEmbeddings(app.mongo.graphNodeEmbeddings, embeddingRows);

    // 3. Build semantic edges using mongot $vectorSearch on event_chunks
    const directedEdges: Array<{ source: string; target: string; similarity: number }> = [];

    const processChunk = async (chunk: any): Promise<void> => {
      const emb = chunk.embedding as number[];
      if (!emb || emb.length < 2) return;

      try {
        const results = await app.mongo.hotVectors.aggregate<any>([
          {
            $vectorSearch: {
              index: "chunk_vector",
              path: "embedding",
              queryVector: emb,
              numCandidates: Math.max(k * 5, 50),
              limit: k + 1,
            },
          },
          { $project: { _id: 1, score: { $meta: "vectorSearchScore" } } },
        ]).toArray();

        for (const result of results) {
          if (String(result._id) === String(chunk._id)) continue;
          if ((result.score as number) < minSimilarity) continue;

          const sourceNodeId = chunkIdToNodeId.get(String(chunk._id));
          const targetNodeId = chunkIdToNodeId.get(String(result._id));
          if (!sourceNodeId || !targetNodeId || sourceNodeId === targetNodeId) continue;

          directedEdges.push({ source: sourceNodeId, target: targetNodeId, similarity: result.score as number });
        }
      } catch {
        // Skip chunks that fail vector search (dimension mismatch, etc.)
      }
    };

    for (let i = 0; i < chunks.length; i += concurrency) {
      const batch = chunks.slice(i, Math.min(i + concurrency, chunks.length));
      await Promise.all(batch.map(processChunk));
    }

    // 4. Symmetrize: keep the higher similarity for each undirected pair
    const edgeMap = new Map<string, { source: string; target: string; similarity: number }>();
    for (const edge of directedEdges) {
      const a = edge.source < edge.target ? edge.source : edge.target;
      const b = edge.source < edge.target ? edge.target : edge.source;
      const key = `${a}||${b}`;
      const existing = edgeMap.get(key);
      if (!existing || edge.similarity > existing.similarity) {
        edgeMap.set(key, { source: a, target: b, similarity: edge.similarity });
      }
    }

    // 5. Cap at maxDegree per node (greedy: keep highest-similarity edges first)
    const ranked = [...edgeMap.values()].sort((a, b) => b.similarity - a.similarity);
    const degrees = new Map<string, number>();
    const cappedEdges: Array<{ source_node_id: string; target_node_id: string; similarity: number }> = [];

    for (const edge of ranked) {
      const degA = degrees.get(edge.source) ?? 0;
      const degB = degrees.get(edge.target) ?? 0;
      if (degA >= maxDegree || degB >= maxDegree) continue;
      cappedEdges.push({ source_node_id: edge.source, target_node_id: edge.target, similarity: edge.similarity });
      degrees.set(edge.source, degA + 1);
      degrees.set(edge.target, degB + 1);
    }

    // 6. Persist to graph_semantic_edges
    const graphVersion = `mongot-knn-${Date.now()}`;
    const persistBatchSize = 1000;
    for (let i = 0; i < cappedEdges.length; i += persistBatchSize) {
      const batch = cappedEdges.slice(i, i + persistBatchSize);
      await upsertGraphSemanticEdges(
        app.mongo.graphSemanticEdges,
        batch.map((e) => ({
          source_node_id: e.source_node_id,
          target_node_id: e.target_node_id,
          similarity: e.similarity,
          edge_type: "semantic_knn",
          embedding_model: "qwen3-embedding:0.6b",
          graph_version: graphVersion,
        })),
      );
    }

    return {
      ok: true,
      graphVersion,
      nodes: chunks.length,
      directedEdges: directedEdges.length,
      undirectedEdges: edgeMap.size,
      cappedEdges: cappedEdges.length,
      k,
      minSimilarity,
      maxDegree,
    };
  });

  // ============================================================
  // Incremental semantic edge builder for ingestion
  // Only builds edges for newly added/updated documents
  // ============================================================

  app.post("/jobs/build-semantic-edges/incremental", async (req: any) => {
    const body = (req.body as any) ?? {};
    const parentIds = Array.isArray(body.parentIds) ? body.parentIds : [];
    const chunkIds = Array.isArray(body.chunkIds) ? body.chunkIds : [];
    const k = Math.max(2, Math.min(64, Number(body.k ?? 8)));
    const minSimilarity = Math.max(0, Math.min(1, Number(body.minSimilarity ?? 0.5)));
    const maxDegree = Math.max(2, Number(body.maxDegree ?? k * 2));

    if (parentIds.length === 0 && chunkIds.length === 0) {
      return { ok: true, note: "No parent IDs or chunk IDs provided", edges: 0 };
    }

    // 1. Find chunks for the given parent IDs or direct chunk IDs
    const chunkQuery: any = { embedding: { $exists: true, $type: "array", $ne: [] } };

    if (chunkIds.length > 0) {
      chunkQuery._id = { $in: chunkIds };
    } else if (parentIds.length > 0) {
      // Find chunks by parent_id (document ID) - note: snake_case field
      chunkQuery.parent_id = { $in: parentIds };
    }

    const chunks = await app.mongo.hotVectors
      .find(chunkQuery, { projection: { _id: 1, parentId: 1, title: 1, kind: 1, project: 1, embedding: 1, embedding_model: 1 } })
      .toArray();

    if (chunks.length === 0) {
      return { ok: true, note: "No chunks with embeddings found", edges: 0 };
    }

    const nodePrefix = "devel:chunk:";
    const chunkIdToNodeId = new Map<string, string>();
    for (const chunk of chunks) {
      chunkIdToNodeId.set(String(chunk._id), `${nodePrefix}${chunk._id}`);
    }

    // 2. Build edges for each new chunk against ALL existing chunks
    const directedEdges: Array<{ source: string; target: string; similarity: number }> = [];

    for (const chunk of chunks) {
      const emb = chunk.embedding as number[];
      if (!emb || emb.length < 2) continue;

      try {
        const results = await app.mongo.hotVectors.aggregate<any>([
          {
            $vectorSearch: {
              index: "chunk_vector",
              path: "embedding",
              queryVector: emb,
              numCandidates: Math.max(k * 5, 50),
              limit: k + 1,
            },
          },
          { $project: { _id: 1, score: { $meta: "vectorSearchScore" } } },
        ]).toArray();

        for (const result of results) {
          if (String(result._id) === String(chunk._id)) continue;
          if ((result.score as number) < minSimilarity) continue;

          const sourceNodeId = chunkIdToNodeId.get(String(chunk._id));
          const targetNodeId = `${nodePrefix}${result._id}`;
          if (!sourceNodeId || sourceNodeId === targetNodeId) continue;

          directedEdges.push({ source: sourceNodeId, target: targetNodeId, similarity: result.score as number });
        }
      } catch {
        // Skip chunks that fail vector search
      }
    }

    if (directedEdges.length === 0) {
      return { ok: true, note: "No edges above similarity threshold", edges: 0 };
    }

    // 3. Symmetrize edges
    const edgeMap = new Map<string, { source: string; target: string; similarity: number }>();
    for (const edge of directedEdges) {
      const a = edge.source < edge.target ? edge.source : edge.target;
      const b = edge.source < edge.target ? edge.target : edge.source;
      const key = `${a}||${b}`;
      const existing = edgeMap.get(key);
      if (!existing || edge.similarity > existing.similarity) {
        edgeMap.set(key, { source: a, target: b, similarity: edge.similarity });
      }
    }

    // 4. Check existing degrees and cap
    const nodeIds = new Set<string>();
    for (const edge of edgeMap.values()) {
      nodeIds.add(edge.source);
      nodeIds.add(edge.target);
    }

    // Count existing edges per node (only for nodes we're updating)
    const existingDegrees = new Map<string, number>();
    const nodeIdArray = Array.from(nodeIds);
    for (let i = 0; i < nodeIdArray.length; i += 100) {
      const batch = nodeIdArray.slice(i, i + 100);
      const existingEdges = await app.mongo.graphSemanticEdges
        .find({
          $or: [{ source_node_id: { $in: batch } }, { target_node_id: { $in: batch } }],
        })
        .toArray();
      for (const e of existingEdges) {
        existingDegrees.set(e.source_node_id, (existingDegrees.get(e.source_node_id) ?? 0) + 1);
        existingDegrees.set(e.target_node_id, (existingDegrees.get(e.target_node_id) ?? 0) + 1);
      }
    }

    // 5. Cap edges respecting existing degrees
    const ranked = [...edgeMap.values()].sort((a, b) => b.similarity - a.similarity);
    const cappedEdges: Array<{ source_node_id: string; target_node_id: string; similarity: number }> = [];

    for (const edge of ranked) {
      const degA = (existingDegrees.get(edge.source) ?? 0);
      const degB = (existingDegrees.get(edge.target) ?? 0);
      if (degA >= maxDegree || degB >= maxDegree) continue;
      cappedEdges.push({ source_node_id: edge.source, target_node_id: edge.target, similarity: edge.similarity });
      existingDegrees.set(edge.source, degA + 1);
      existingDegrees.set(edge.target, degB + 1);
    }

    // 6. Persist
    const graphVersion = `mongot-knn-incremental-${Date.now()}`;
    if (cappedEdges.length > 0) {
      await upsertGraphSemanticEdges(
        app.mongo.graphSemanticEdges,
        cappedEdges.map((e) => ({
          source_node_id: e.source_node_id,
          target_node_id: e.target_node_id,
          similarity: e.similarity,
          edge_type: "semantic_knn",
          embedding_model: "qwen3-embedding:0.6b",
          graph_version: graphVersion,
        })),
      );
    }

    return {
      ok: true,
      graphVersion,
      chunks: chunks.length,
      candidateEdges: directedEdges.length,
      edges: cappedEdges.length,
    };
  });

  // Strip document content from event_chunks — keep embeddings, metadata, identifiers only.
  // Content lives on disk; the DB stores graph topology + similarity index.
  app.post("/jobs/strip-chunk-content", async (req: any) => {
    const dryRun = req.body?.dryRun === true;
    if (dryRun) {
      const count = await app.mongo.hotVectors.countDocuments({ text: { $exists: true, $ne: "" } });
      const avgSize = await app.mongo.hotVectors.aggregate([
        { $match: { text: { $exists: true, $ne: "" } } },
        { $project: { textSize: { $strLenCP: "$text" } } },
        { $group: { _id: null, avg: { $avg: "$textSize" } } },
      ]).toArray();
      return { ok: true, dryRun: true, chunksWithContent: count, avgTextLength: avgSize[0]?.avg ?? 0 };
    }

    const result = await app.mongo.hotVectors.updateMany(
      { text: { $exists: true } },
      { $unset: { text: "" } },
    );
    return { ok: true, stripped: result.modifiedCount };
  });

  // ============================================================
  // Graph-version-aware semantic graph runs
  // ============================================================

  app.get("/graph/runs", async (req: any) => {
    const status = typeof req.query?.status === "string" ? req.query.status.trim() : undefined;
    const limit = Math.max(1, Math.min(1000, Number(req.query?.limit ?? 50)));

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const rows = await app.mongo.semanticGraphRuns
      .find(filter, { sort: { finished_at: -1 as any }, limit })
      .toArray();

    return {
      ok: true,
      count: rows.length,
      runs: rows.map((r) => ({
        runId: r.run_id,
        graphVersion: r.graph_version,
        clusteringVersion: r.clustering_version,
        embeddingModel: r.embedding_model,
        embeddingDimensions: r.embedding_dimensions,
        nodeCount: r.node_count,
        finalK: r.final_k,
        candidateFactor: r.candidate_factor,
        candidateEngine: r.candidate_engine,
        rerankProvider: r.rerank_provider,
        status: r.status,
        startedAt: r.started_at,
        finishedAt: r.finished_at,
        metrics: r.metrics,
      })),
    };
  });

  app.get("/graph/runs/latest", async (req: any, reply: any) => {
    const status = typeof req.query?.status === "string" ? req.query.status.trim() : "complete";
    const row = await app.mongo.semanticGraphRuns.findOne(
      { status: { $in: [status, "clustered"] } },
      { sort: { finished_at: -1 as any } },
    );

    if (!row) {
      return reply.status(404).send({ ok: false, error: "no canonical run found" });
    }

    return {
      ok: true,
      runId: row.run_id,
      graphVersion: row.graph_version,
      clusteringVersion: row.clustering_version,
      embeddingModel: row.embedding_model,
      embeddingDimensions: row.embedding_dimensions,
      nodeCount: row.node_count,
      finalK: row.final_k,
      candidateFactor: row.candidate_factor,
      status: row.status,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      metrics: row.metrics,
    };
  });

  // ============================================================
  // Cluster membership endpoints (S8)
  // ============================================================

  app.get("/graph/clusters", async (req: any) => {
    const graphVersion = typeof req.query?.graph_version === "string"
      ? req.query.graph_version.trim()
      : undefined;
    const clusteringVersion = typeof req.query?.clustering_version === "string"
      ? req.query.clustering_version.trim()
      : undefined;
    const limit = Math.max(1, Math.min(10000, Number(req.query?.limit ?? 1000)));

    const filter: Record<string, unknown> = {};
    if (graphVersion) filter.graph_version = graphVersion;
    if (clusteringVersion) filter.clustering_version = clusteringVersion;

    const rows = await app.mongo.graphClusterMemberships
      .find(filter, { limit: limit * 2 })
      .toArray();

    const clusterMap = new Map<string, { clusterId: string; size: number; members: Set<string> }>();
    for (const row of rows) {
      if (!row.cluster_id) continue;
      if (!clusterMap.has(row.cluster_id)) {
        clusterMap.set(row.cluster_id, {
          clusterId: row.cluster_id,
          size: 0,
          members: new Set(),
        });
      }
      clusterMap.get(row.cluster_id)!.size++;
    }

    const clusters = Array.from(clusterMap.values())
      .sort((a, b) => b.size - a.size)
      .slice(0, limit)
      .map((c) => ({ clusterId: c.clusterId, size: c.size }));

    return { ok: true, count: clusters.length, clusters };
  });

  app.get("/graph/clusters/:cluster_id/members", async (req: any) => {
    const { cluster_id: clusterId } = req.params as { cluster_id: string };
    const graphVersion = typeof req.query?.graph_version === "string"
      ? req.query.graph_version.trim()
      : undefined;
    const clusteringVersion = typeof req.query?.clustering_version === "string"
      ? req.query.clustering_version.trim()
      : undefined;
    const limit = Math.max(1, Math.min(50000, Number(req.query?.limit ?? 1000)));

    const filter: Record<string, unknown> = { cluster_id: clusterId };
    if (graphVersion) filter.graph_version = graphVersion;
    if (clusteringVersion) filter.clustering_version = clusteringVersion;

    const rows = await app.mongo.graphClusterMemberships
      .find(filter, { limit })
      .toArray();

    const nodes = rows
      .map((r) => r.node_id)
      .filter((id): id is string => !!id);

    return { ok: true, count: nodes.length, clusterId, nodes };
  });

  app.get("/graph/nodes/:node_id/cluster", async (req: any) => {
    const { node_id: nodeId } = req.params as { node_id: string };

    const row = await app.mongo.graphClusterMemberships.findOne(
      { node_id: nodeId },
      { sort: { updated_at: -1 as any } },
    );

    if (!row) {
      return { ok: true, nodeId, cluster: null };
    }

    return {
      ok: true,
      nodeId,
      cluster: row.cluster_id,
      clusteringVersion: row.clustering_version,
      graphVersion: row.graph_version,
      clusterSize: row.cluster_size,
    };
  });

  // ============================================================
  // Graph Traversal Search (layout-aware)
  // ============================================================

  // Graph neighborhood expansion via traversal
  // Uses PHYSICAL edge lengths from layout positions as cost metric
  // This encodes ALL forces: structural links + semantic attraction/repulsion
  app.post("/graph/traverse", async (req: any, reply) => {
    const seedNodeIds = Array.isArray(req.body?.seedNodeIds) ? req.body.seedNodeIds : [];
    const maxDistance = Number(req.body?.maxDistance ?? 5000); // Maximum physical distance to traverse
    const maxNodes = Number(req.body?.maxNodes ?? 100); // Maximum nodes to return
    const edgeKinds = Array.isArray(req.body?.edgeKinds) ? req.body.edgeKinds : null; // Filter by edge kinds (null = all)
    const includeSeeds = req.body?.includeSeeds !== false;

    if (seedNodeIds.length === 0) {
      return { nodes: [], edges: [], stats: { seeds: 0, visited: 0, edges: 0 } };
    }

    // Step 1: Get ALL edges connected to seed nodes
    const edgeFilter: Record<string, unknown> = {
      $or: [
        { source_node_id: { $in: seedNodeIds.map(String) } },
        { target_node_id: { $in: seedNodeIds.map(String) } },
      ],
    };
    if (edgeKinds) {
      edgeFilter.edge_kind = { $in: edgeKinds };
    }

    const directEdges = await app.mongo.graphEdges.find(edgeFilter).limit(10000).toArray();

    if (directEdges.length === 0) {
      // Fall back to semantic edges if no structural edges found
      const semanticEdges = await app.mongo.graphSemanticEdges.find({
        $or: [
          { source_node_id: { $in: seedNodeIds.map(String) } },
          { target_node_id: { $in: seedNodeIds.map(String) } },
        ],
      }).limit(10000).toArray();

      if (semanticEdges.length === 0) {
        return { nodes: [], edges: [], stats: { seeds: 0, visited: 0, edges: 0 } };
      }

      // Fall back to similarity-based cost
      const adjacency = new Map<string, Array<{ neighbor: string; similarity: number; cost: number; edgeKind: string }>>();
      for (const edge of semanticEdges) {
        const sourceId = edge.source_node_id;
        const targetId = edge.target_node_id;
        const sim = edge.similarity;
        const cost = (1 - sim) * 1000; // Scale to match physical distances

        const sourceNeighbors = adjacency.get(sourceId) ?? [];
        sourceNeighbors.push({ neighbor: targetId, similarity: sim, cost, edgeKind: "semantic_similarity" });
        adjacency.set(sourceId, sourceNeighbors);

        const targetNeighbors = adjacency.get(targetId) ?? [];
        targetNeighbors.push({ neighbor: sourceId, similarity: sim, cost, edgeKind: "semantic_similarity" });
        adjacency.set(targetId, targetNeighbors);
      }

      // Dijkstra-like traversal
      const distances = new Map<string, number>();
      const predecessors = new Map<string, { from: string; edge: { similarity: number; edgeKind: string } }>();
      const visited = new Set<string>();
      const pq: Array<{ nodeId: string; cost: number }> = [];

      for (const seedId of seedNodeIds.map(String)) {
        distances.set(seedId, 0);
        pq.push({ nodeId: seedId, cost: 0 });
      }

      while (pq.length > 0 && visited.size < maxNodes) {
        pq.sort((a, b) => a.cost - b.cost);
        const current = pq.shift()!;

        if (visited.has(current.nodeId)) continue;
        if (current.cost > maxDistance) continue;

        visited.add(current.nodeId);

        const neighbors = adjacency.get(current.nodeId) ?? [];
        for (const { neighbor, similarity, cost, edgeKind } of neighbors) {
          if (visited.has(neighbor)) continue;
          const newDist = current.cost + cost;
          if (newDist > maxDistance) continue;

          const existingDist = distances.get(neighbor);
          if (existingDist === undefined || newDist < existingDist) {
            distances.set(neighbor, newDist);
            predecessors.set(neighbor, { from: current.nodeId, edge: { similarity, edgeKind } });
            pq.push({ nodeId: neighbor, cost: newDist });
          }
        }
      }

      const traversedEdges: Array<{ source: string; target: string; similarity: number; edgeKind: string }> = [];
      for (const [nodeId, pred] of predecessors) {
        traversedEdges.push({
          source: pred.from,
          target: nodeId,
          similarity: pred.edge.similarity,
          edgeKind: pred.edge.edgeKind,
        });
      }

      const resultNodes = [...visited]
        .filter(id => includeSeeds || !seedNodeIds.map(String).includes(id))
        .map(id => ({
          id,
          distance: distances.get(id) ?? 0,
          isSeed: seedNodeIds.map(String).includes(id),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxNodes);

      return {
        nodes: resultNodes,
        edges: traversedEdges,
        stats: { seeds: seedNodeIds.length, visited: visited.size, edges: traversedEdges.length, mode: "semantic_fallback" },
      };
    }

    // Step 2: Get layout positions for all nodes involved
    const allNodeIds = new Set<string>();
    for (const edge of directEdges) {
      allNodeIds.add(edge.source_node_id);
      allNodeIds.add(edge.target_node_id);
    }
    seedNodeIds.forEach((id: string) => {
      allNodeIds.add(String(id));
    });

    const layouts = await app.mongo.graphLayoutOverrides.find({
      node_id: { $in: [...allNodeIds] },
    }).toArray();

    const layoutMap = new Map<string, { x: number; y: number }>();
    for (const layout of layouts) {
      layoutMap.set(layout.node_id, { x: layout.x, y: layout.y });
    }

    // Step 3: Build adjacency list with physical distances
    const adjacency = new Map<string, Array<{ neighbor: string; distance: number; edgeKind: string }>>();
    const edgeData = new Map<string, { source: string; target: string; distance: number; edgeKind: string }>();

    for (const edge of directEdges) {
      const sourceId = edge.source_node_id;
      const targetId = edge.target_node_id;
      const sourcePos = layoutMap.get(sourceId);
      const targetPos = layoutMap.get(targetId);

      // Skip edges where we don't have positions for both nodes
      if (!sourcePos || !targetPos) continue;

      // Euclidean distance
      const dx = sourcePos.x - targetPos.x;
      const dy = sourcePos.y - targetPos.y;
      const physicalDistance = Math.sqrt(dx * dx + dy * dy);

      const edgeKind = edge.edge_kind;
      const edgeKey = `${sourceId}||${targetId}||${edgeKind}`;
      edgeData.set(edgeKey, { source: sourceId, target: targetId, distance: physicalDistance, edgeKind });

      // Add both directions for undirected traversal
      const sourceNeighbors = adjacency.get(sourceId) ?? [];
      sourceNeighbors.push({ neighbor: targetId, distance: physicalDistance, edgeKind });
      adjacency.set(sourceId, sourceNeighbors);

      const targetNeighbors = adjacency.get(targetId) ?? [];
      targetNeighbors.push({ neighbor: sourceId, distance: physicalDistance, edgeKind });
      adjacency.set(targetId, targetNeighbors);
    }

    // Step 4: Dijkstra-like traversal using physical distances
    const distances = new Map<string, number>();
    const predecessors = new Map<string, { from: string; edge: { distance: number; edgeKind: string } }>();
    const visited = new Set<string>();
    const pq: Array<{ nodeId: string; dist: number }> = [];

    // Initialize seeds with distance 0
    for (const seedId of seedNodeIds.map(String)) {
      distances.set(seedId, 0);
      pq.push({ nodeId: seedId, dist: 0 });
    }

    // Process queue
    while (pq.length > 0 && visited.size < maxNodes) {
      pq.sort((a, b) => a.dist - b.dist);
      const current = pq.shift()!;

      if (visited.has(current.nodeId)) continue;
      if (current.dist > maxDistance) continue;

      visited.add(current.nodeId);

      const neighbors = adjacency.get(current.nodeId) ?? [];
      for (const { neighbor, distance, edgeKind } of neighbors) {
        if (visited.has(neighbor)) continue;

        const newDist = current.dist + distance;
        if (newDist > maxDistance) continue;

        const existingDist = distances.get(neighbor);
        if (existingDist === undefined || newDist < existingDist) {
          distances.set(neighbor, newDist);
          predecessors.set(neighbor, { from: current.nodeId, edge: { distance, edgeKind } });
          pq.push({ nodeId: neighbor, dist: newDist });
        }
      }
    }

    // Collect traversed edges
    const traversedEdges: Array<{ source: string; target: string; distance: number; edgeKind: string }> = [];
    for (const [nodeId, pred] of predecessors) {
      traversedEdges.push({
        source: pred.from,
        target: nodeId,
        distance: pred.edge.distance,
        edgeKind: pred.edge.edgeKind,
      });
    }

    // Build result nodes
    const resultNodes = [...visited]
      .filter(id => includeSeeds || !seedNodeIds.map(String).includes(id))
      .map(id => ({
        id,
        distance: distances.get(id) ?? 0,
        isSeed: seedNodeIds.map(String).includes(id),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxNodes);

    return {
      nodes: resultNodes,
      edges: traversedEdges,
      stats: {
        seeds: seedNodeIds.length,
        visited: visited.size,
        edges: traversedEdges.length,
        edgesQueried: directEdges.length,
        nodesWithLayout: layoutMap.size,
        mode: "physical_distance",
      },
    };
  });

  // Combined vector search + graph traversal
  // 1. Vector search finds seed nodes
  // 2. Graph traversal expands neighborhood using edge costs
  app.post("/graph/semantic-search", async (req: any, reply) => {
    const q = req.body?.q;
    const k = Number(req.body?.k ?? 10); // Initial vector search seeds
    const maxCost = Number(req.body?.maxCost ?? 1.5); // Max traversal cost
    const maxNodes = Number(req.body?.maxNodes ?? 50); // Max nodes in result
    const minSimilarity = Number(req.body?.minSimilarity ?? 0.5); // Min edge similarity
    const minVectorSimilarity = Number(req.body?.minVectorSimilarity ?? 0.3); // Min vector search score

    if (!q || typeof q !== "string") {
      return reply.status(400).send({ error: "q is required" });
    }

    const embeddingRuntime = (app as any).embeddingRuntime;

    // Step 1: Vector search to find seed nodes
    const vectorResult = await queryMongoVectorsByText({
      mongo: app.mongo,
      tier: "hot",
      q,
      k: Math.max(1, Math.min(100, k)),
      getEmbeddingFunctionForModel: (model: string) => embeddingRuntime.hot.getEmbeddingFunctionForModel(model),
    });

    const vectorHits = extractTieredVectorHits(vectorResult, "hot");

    // Filter by minimum vector similarity (convert distance to similarity: sim = 1 - dist)
    const seedHits = vectorHits.filter((hit: any) => {
      const dist = hit.distance ?? 0;
      const sim = 1 - dist;
      return sim >= minVectorSimilarity;
    });
    const seedNodeIds = seedHits.map((hit: any) => hit.id);

    if (seedNodeIds.length === 0) {
      return {
        seeds: [],
        nodes: [],
        edges: [],
        stats: { vectorHits: vectorHits.length, seeds: 0, visited: 0, edges: 0 },
      };
    }

    // Step 2: Graph traversal from seeds
    const edgeFilter: Record<string, unknown> = {
      similarity: { $gte: minSimilarity },
    };

    const directEdges = await app.mongo.graphSemanticEdges.find({
      ...edgeFilter,
      $or: [
        { source_node_id: { $in: seedNodeIds } },
        { target_node_id: { $in: seedNodeIds } },
      ],
    }).toArray();

    // Build adjacency list
    const adjacency = new Map<string, Array<{ neighbor: string; similarity: number; cost: number }>>();
    for (const edge of directEdges) {
      const sourceId = edge.source_node_id;
      const targetId = edge.target_node_id;
      const sim = edge.similarity;
      const cost = 1 - sim;

      const sourceNeighbors = adjacency.get(sourceId) ?? [];
      sourceNeighbors.push({ neighbor: targetId, similarity: sim, cost });
      adjacency.set(sourceId, sourceNeighbors);

      const targetNeighbors = adjacency.get(targetId) ?? [];
      targetNeighbors.push({ neighbor: sourceId, similarity: sim, cost });
      adjacency.set(targetId, targetNeighbors);
    }

    // Dijkstra traversal
    const distances = new Map<string, number>();
    const predecessors = new Map<string, { from: string; edge: { similarity: number } }>();
    const visited = new Set<string>();
    const pq: Array<{ nodeId: string; cost: number }> = [];

    // Seed nodes get negative cost bonus (prefer starting points)
    const seedScores = new Map<string, number>();
    for (const hit of seedHits) {
      const dist = hit.distance ?? 0;
      const sim = 1 - dist; // Convert distance to similarity
      seedScores.set(hit.id, sim);
      distances.set(hit.id, 0);
      pq.push({ nodeId: hit.id, cost: 0 });
    }

    while (pq.length > 0 && visited.size < maxNodes) {
      pq.sort((a, b) => a.cost - b.cost);
      const current = pq.shift()!;

      if (visited.has(current.nodeId)) continue;
      if (current.cost > maxCost) continue;

      visited.add(current.nodeId);

      const neighbors = adjacency.get(current.nodeId) ?? [];
      for (const { neighbor, similarity, cost } of neighbors) {
        if (visited.has(neighbor)) continue;

        const newDist = current.cost + cost;
        if (newDist > maxCost) continue;

        const existingDist = distances.get(neighbor);
        if (existingDist === undefined || newDist < existingDist) {
          distances.set(neighbor, newDist);
          predecessors.set(neighbor, { from: current.nodeId, edge: { similarity } });
          pq.push({ nodeId: neighbor, cost: newDist });
        }
      }
    }

    // Collect traversed edges
    const traversedEdges: Array<{ source: string; target: string; similarity: number }> = [];
    for (const [nodeId, pred] of predecessors) {
      traversedEdges.push({
        source: pred.from,
        target: nodeId,
        similarity: pred.edge.similarity,
      });
    }

    // Build result nodes with combined score (vector + traversal cost)
    const resultNodes = [...visited]
      .map(id => {
        const traversalCost = distances.get(id) ?? 0;
        const vectorScore = seedScores.get(id) ?? 0;
        // Combined score: seeds keep vector score, expanded nodes get inverse cost
        const score = vectorScore > 0 ? vectorScore : 1 / (1 + traversalCost);
        return {
          id,
          score,
          traversalCost,
          isSeed: seedScores.has(id),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, maxNodes);

    return {
      seeds: seedHits.map((h: any) => {
        const dist = h.distance ?? 0;
        return { id: h.id, score: 1 - dist };
      }),
      nodes: resultNodes,
      edges: traversedEdges,
      stats: {
        vectorHits: vectorHits.length,
        seeds: seedNodeIds.length,
        visited: visited.size,
        edges: traversedEdges.length,
      },
    };
  });

  app.post("/graph/memory", async (req: any, reply) => {
    const q = req.body?.q;
    const lakes = Array.isArray(req.body?.lakes) ? req.body.lakes : null;
    const nodeTypes = Array.isArray(req.body?.nodeTypes) ? req.body.nodeTypes : null;
    const k = Number(req.body?.k ?? 15);
    const maxCost = Number(req.body?.maxCost ?? 2.0);
    const maxNodes = Number(req.body?.maxNodes ?? 60);
    const minSimilarity = Number(req.body?.minSimilarity ?? 0.55);
    const minVectorSimilarity = Number(req.body?.minVectorSimilarity ?? 0.35);
    const maxCandidates = Number(req.body?.maxCandidates ?? 10000);
    const includeText = req.body?.includeText !== false;
    const useCompactView = req.body?.useCompactView !== false;
    const persistDaimoiTrails = req.body?.persistDaimoiTrails !== false;
    const trailHalfLifeSeconds = Math.max(30, Number(req.body?.trailHalfLifeSeconds ?? 900));
    const trailLookbackSeconds = Math.max(trailHalfLifeSeconds, Number(req.body?.trailLookbackSeconds ?? 7200));
    const trailFieldGain = Math.max(0, Math.min(1, Number(req.body?.trailFieldGain ?? 0.35)));
    const simplexNoiseGain = Math.max(0, Math.min(0.5, Number(req.body?.simplexNoiseGain ?? 0.08)));
    const simplexNoiseScaleSeconds = Math.max(5, Number(req.body?.simplexNoiseScaleSeconds ?? 90));

    if (!q || typeof q !== "string") {
      return reply.status(400).send({ error: "q is required" });
    }

    const embeddingRuntime = (app as any).embeddingRuntime;
    const embedModel = process.env.EMBED_PROVIDER_MODEL ?? "qwen3-embedding:0.6b";
    const embeddingProvider = embeddingRuntime?.hot?.getEmbeddingFunctionForModel?.(embedModel);

    if (!embeddingProvider) {
      return reply.status(503).send({ error: "embedding function unavailable" });
    }

    const lakeRegexes = lakes?.map((lake: string) => new RegExp(`^${escapeRegex(lake)}:`)) ?? [];

    let seedNodeIds: string[] = [];
    let seedScoresMap = new Map<string, number>();
    let vectorHitCount = 0;

    try {
      const [queryEmbedding] = await embeddingProvider.generate([formatEmbeddingQueryText(q)]);
      if (queryEmbedding && Array.isArray(queryEmbedding) && queryEmbedding.length > 0) {
        const vectorSearchLimit = Math.min(maxCandidates, Math.max(k * 4, 50));
        const vectorSearchNumCandidates = Math.max(
          vectorSearchLimit,
          Math.min(maxCandidates, Math.max(vectorSearchLimit * 10, 200)),
        );

        const resolvedSeeds = await resolveGraphMemorySeedNodes({
          k,
          lakeRegexes,
          nodeTypes,
          minVectorSimilarity,
          logger: req.log,
          nativeVectorSearch: async () => app.mongo.graphNodeEmbeddings.aggregate([
            {
              $vectorSearch: {
                index: "embedding_vector",
                path: "embedding",
                queryVector: queryEmbedding,
                numCandidates: vectorSearchNumCandidates,
                limit: vectorSearchLimit,
              },
            },
            {
              $project: {
                _id: 0,
                node_id: 1,
                project: 1,
                score: { $meta: "vectorSearchScore" },
              },
            },
          ]).toArray() as Promise<Array<{ node_id?: string; project?: string; score?: number }>>,
          fallbackVectorSearch: () => fallbackGraphMemorySeedSearch({
            graphNodeEmbeddings: app.mongo.graphNodeEmbeddings,
            queryEmbedding,
            lakeRegexes,
            nodeTypes,
            minVectorSimilarity,
            maxCandidates,
            k,
          }),
        });

        seedNodeIds = resolvedSeeds.seedNodeIds;
        seedScoresMap = resolvedSeeds.seedScoresMap;
        vectorHitCount = resolvedSeeds.vectorHitCount;
      }
    } catch (err) {
      return reply.status(500).send({ error: "embedding generation failed", details: String(err) });
    }

    if (seedNodeIds.length === 0) {
      return {
        query: q,
        clusters: [],
        nodes: [],
        edges: [],
        stats: { vectorHits: vectorHitCount, seeds: 0, visited: 0, edges: 0 },
      };
    }

    const truthSeedNodeIds = [...seedNodeIds];
    const compactMemberToViewNode = new Map<string, string>();
    const compactViewNodeById = new Map<string, GraphViewNodeDocument>();
    const expandedCompactViewSeedIds = new Set<string>();

    if (useCompactView) {
      const candidateViewRows = await app.mongo.graphViewNodes.find({
        status: { $ne: "archived" },
        $or: [
          { child_node_ids: { $in: truthSeedNodeIds } },
          { view_node_id: { $in: truthSeedNodeIds } },
        ],
      }).limit(1000).toArray() as GraphViewNodeDocument[];

      for (const row of candidateViewRows) {
        compactViewNodeById.set(row.view_node_id, row);
        const isSaturated = Number(row.saturation ?? 0) >= Number(row.expansion_threshold ?? 0.82) || row.status === "expanded";
        if (isSaturated) {
          expandedCompactViewSeedIds.add(row.view_node_id);
          continue;
        }
        const seededAsViewNode = truthSeedNodeIds.includes(row.view_node_id);
        for (const memberId of row.child_node_ids ?? []) {
          if (seededAsViewNode || truthSeedNodeIds.includes(memberId)) compactMemberToViewNode.set(memberId, row.view_node_id);
        }
      }

      if (compactMemberToViewNode.size > 0) {
        const nextScores = new Map<string, number>();
        for (const seedId of seedNodeIds) {
          const viewNodeId = compactMemberToViewNode.get(seedId);
          const targetId = viewNodeId ?? seedId;
          nextScores.set(targetId, Math.max(nextScores.get(targetId) ?? 0, seedScoresMap.get(seedId) ?? 0));
        }
        seedNodeIds = [...nextScores.keys()];
        seedScoresMap = nextScores;
      }
    }

    const compactedSeedMemberIds = [...compactMemberToViewNode.keys()];
    const edgeLookupNodeIds = [...new Set([...seedNodeIds, ...compactedSeedMemberIds])];
    const seedBoundaryFilter = {
      $or: [
        { source_node_id: { $in: edgeLookupNodeIds } },
        { target_node_id: { $in: edgeLookupNodeIds } },
      ],
    };

    const trailSince = new Date(Date.now() - (trailLookbackSeconds * 1000));
    const [forceSamples, activeClaimRows, priorTrailRows] = await Promise.all([
      app.mongo.graphSemanticForceSamples.find({
        $and: [
          seedBoundaryFilter,
          { charge: { $gte: semanticChargeFromSimilarity(minSimilarity) } },
        ],
      }).toArray(),
      app.mongo.graphEdgeClaims.find({
        $and: [
          seedBoundaryFilter,
          { status: { $in: [...EDGE_CLAIM_ACTIVE_PROJECTABLE_STATUSES] } },
        ],
      }).toArray(),
      app.mongo.graphDaimoiTrails.find({
        node_ids: { $in: edgeLookupNodeIds },
        emitted_at: { $gte: trailSince },
      }).limit(5000).toArray(),
    ]);

    const trailNodeInfluence = new Map<string, number>();
    const trailEdgeInfluence = new Map<string, number>();
    const nowForTrailField = new Date();
    for (const trail of priorTrailRows) {
      const influence = decayedTrailInfluence({
        activation: Number(trail.activation ?? 0),
        emittedAt: trail.emitted_at instanceof Date ? trail.emitted_at : new Date(trail.emitted_at),
        now: nowForTrailField,
        halfLifeSeconds: Number(trail.decay_half_life_seconds ?? trailHalfLifeSeconds),
      });
      if (influence <= 0) continue;
      const adjustments = Array.isArray(trail.field_adjustments) && trail.field_adjustments.length > 0
        ? trail.field_adjustments
        : (Array.isArray(trail.node_ids) ? trail.node_ids.map((node_id: string) => ({ node_id, delta: 1 / Math.max(1, trail.node_ids.length) })) : []);
      for (const adjustment of adjustments) {
        const nodeId = String(adjustment.node_id ?? "").trim();
        if (!nodeId) continue;
        const delta = Number(adjustment.delta ?? 0) * influence;
        trailNodeInfluence.set(nodeId, (trailNodeInfluence.get(nodeId) ?? 0) + delta);
      }
      for (const edgeKey of Array.isArray(trail.edge_keys) ? trail.edge_keys : []) {
        const key = String(edgeKey ?? "").trim();
        if (!key) continue;
        trailEdgeInfluence.set(key, (trailEdgeInfluence.get(key) ?? 0) + influence);
      }
    }

    const legacySemanticEdges = forceSamples.length === 0
      ? await app.mongo.graphSemanticEdges.find({
          $and: [
            seedBoundaryFilter,
            { similarity: { $gte: minSimilarity } },
          ],
        }).toArray()
      : [];

    type DaimoiEdge = {
      neighbor: string;
      cost: number;
      edgeKind: string;
      similarity?: number;
      charge?: number;
      confidence?: number;
      claimId?: string;
      compatibilityKind?: string;
      trailInfluence?: number;
      noise?: number;
    };

    const adjacency = new Map<string, DaimoiEdge[]>();
    const addDaimoiEdge = (sourceId: string, targetId: string, edge: Omit<DaimoiEdge, "neighbor">) => {
      if (lakeRegexes.length > 0) {
        const sourceAllowed = lakeRegexes.some((pattern: RegExp) => pattern.test(sourceId));
        const targetAllowed = lakeRegexes.some((pattern: RegExp) => pattern.test(targetId));
        if (!sourceAllowed || !targetAllowed) return;
      }

      const edgeKey = undirectedEdgeKey(sourceId, targetId);
      const trailInfluence = Math.max(
        trailEdgeInfluence.get(edgeKey) ?? 0,
        trailNodeInfluence.get(targetId) ?? 0,
        trailNodeInfluence.get(sourceId) ?? 0,
      );
      const noise = simplexTrailNoise(`${q}:${edgeKey}`, Date.now() / 1000, simplexNoiseScaleSeconds);
      const trailDiscount = Math.min(0.65, trailInfluence * trailFieldGain);
      const noiseMultiplier = Math.max(0.35, 1 + (noise * simplexNoiseGain));
      const adjustedEdge = {
        ...edge,
        cost: Math.max(0.001, edge.cost * (1 - trailDiscount) * noiseMultiplier),
        trailInfluence,
        noise,
      };

      const sn = adjacency.get(sourceId) ?? [];
      sn.push({ neighbor: targetId, ...adjustedEdge });
      adjacency.set(sourceId, sn);

      const tn = adjacency.get(targetId) ?? [];
      tn.push({ neighbor: sourceId, ...adjustedEdge });
      adjacency.set(targetId, tn);
    };

    for (const sample of forceSamples) {
      const sourceId = compactMemberToViewNode.get(sample.source_node_id) ?? sample.source_node_id;
      const targetId = compactMemberToViewNode.get(sample.target_node_id) ?? sample.target_node_id;
      if (sourceId === targetId) continue;
      const charge = Number(sample.charge ?? semanticChargeFromSimilarity(sample.similarity));
      if (charge <= 0) continue;
      addDaimoiEdge(sourceId, targetId, {
        cost: Math.max(0.001, 1 - Math.min(1, charge)),
        edgeKind: "semantic_force",
        similarity: sample.similarity,
        charge,
        compatibilityKind: "semantic_force_sample",
      });
    }

    for (const edge of legacySemanticEdges) {
      const sourceId = compactMemberToViewNode.get(edge.source_node_id) ?? edge.source_node_id;
      const targetId = compactMemberToViewNode.get(edge.target_node_id) ?? edge.target_node_id;
      if (sourceId === targetId) continue;
      const sim = edge.similarity;
      addDaimoiEdge(sourceId, targetId, {
        cost: 1 - sim,
        edgeKind: "semantic_force_legacy",
        similarity: sim,
        charge: semanticChargeFromSimilarity(sim),
        compatibilityKind: "semantic_force_legacy",
      });
    }

    for (const claim of activeClaimRows) {
      const sourceId = compactMemberToViewNode.get(claim.source_node_id) ?? claim.source_node_id;
      const targetId = compactMemberToViewNode.get(claim.target_node_id) ?? claim.target_node_id;
      if (sourceId === targetId) continue;
      const confidence = clampConfidence(claim.confidence, 0.5);
      addDaimoiEdge(sourceId, targetId, {
        cost: Math.max(0.001, 1 - confidence),
        edgeKind: `claim:${claim.relation_kind}`,
        confidence,
        claimId: claim.claim_id,
        compatibilityKind: "edge_claim",
      });
    }

    const distances = new Map<string, number>();
    const predecessors = new Map<string, { from: string; edge: DaimoiEdge }>();
    const visited = new Set<string>();
    const pq: Array<{ nodeId: string; cost: number }> = [];
    const daimoiByNode = new Map<string, {
      id: string;
      query: string;
      originNodeId: string;
      currentNodeId: string;
      trail: string[];
      activation: number;
      traversalCost: number;
      status: "seed" | "moved";
    }>();

    for (const [index, nodeId] of seedNodeIds.entries()) {
      const sim = seedScoresMap.get(nodeId) ?? 0.5;
      const id = `daimoi:${createHash("sha256").update(`${q}\n${nodeId}\n${index}`).digest("hex").slice(0, 24)}`;
      distances.set(nodeId, 0);
      pq.push({ nodeId, cost: 0 });
      daimoiByNode.set(nodeId, {
        id,
        query: q,
        originNodeId: nodeId,
        currentNodeId: nodeId,
        trail: [nodeId],
        activation: sim,
        traversalCost: 0,
        status: "seed",
      });
    }

    while (pq.length > 0 && visited.size < maxNodes) {
      pq.sort((a, b) => a.cost - b.cost);
      const current = pq.shift()!;
      if (visited.has(current.nodeId)) continue;
      if (current.cost > maxCost) continue;
      visited.add(current.nodeId);

      const neighbors = adjacency.get(current.nodeId) ?? [];
      for (const edge of neighbors) {
        const { neighbor, cost } = edge;
        if (visited.has(neighbor)) continue;
        const newDist = current.cost + cost;
        if (newDist > maxCost) continue;
        const existingDist = distances.get(neighbor);
        if (existingDist === undefined || newDist < existingDist) {
          distances.set(neighbor, newDist);
          predecessors.set(neighbor, { from: current.nodeId, edge });
          const parentDaimoi = daimoiByNode.get(current.nodeId);
          const parentActivation = parentDaimoi?.activation ?? 0.5;
          const edgeGain = edge.charge ?? edge.similarity ?? edge.confidence ?? 0.5;
          daimoiByNode.set(neighbor, {
            id: parentDaimoi?.id ?? `daimoi:${createHash("sha256").update(`${q}\n${neighbor}`).digest("hex").slice(0, 24)}`,
            query: q,
            originNodeId: parentDaimoi?.originNodeId ?? current.nodeId,
            currentNodeId: neighbor,
            trail: [...(parentDaimoi?.trail ?? [current.nodeId]), neighbor],
            activation: Math.max(0, Math.min(1, parentActivation * Math.max(0.05, edgeGain) * (1 / (1 + newDist)))),
            traversalCost: newDist,
            status: "moved",
          });
          pq.push({ nodeId: neighbor, cost: newDist });
        }
      }
    }

    const traversedEdges: Array<Record<string, unknown>> = [];
    for (const [nodeId, pred] of predecessors) {
      traversedEdges.push({
        source: pred.from,
        target: nodeId,
        edgeKind: pred.edge.edgeKind,
        similarity: pred.edge.similarity,
        charge: pred.edge.charge,
        confidence: pred.edge.confidence,
        claimId: pred.edge.claimId,
        compatibilityKind: pred.edge.compatibilityKind,
        trailInfluence: pred.edge.trailInfluence,
        noise: pred.edge.noise,
      });
    }

    const lakeCluster = (id: string): string => {
      if (id.startsWith("view:compact:")) return "view";
      for (const lake of ["devel", "web", "bluesky", "knoxx-session"]) {
        if (id.startsWith(lake + ":")) return lake;
      }
      return "other";
    };

    const nodeTypeOf = (id: string): string => {
      if (id.startsWith("view:compact:")) return "compact_view";
      const parts = id.split(":");
      return parts.length >= 2 ? parts[1] : "unknown";
    };

    const clusterMap = new Map<string, Array<typeof resultNodes extends (infer T)[] ? T : never>>();
    const resultNodes = [...visited].map(id => {
      const traversalCost = distances.get(id) ?? 0;
      const vectorScore = seedScoresMap.get(id) ?? 0;
      const daimoi = daimoiByNode.get(id);
      const score = vectorScore > 0 ? vectorScore : (daimoi?.activation ?? 1 / (1 + traversalCost));
      const compactView = compactViewNodeById.get(id);
      return {
        id,
        score,
        traversalCost,
        isSeed: seedScoresMap.has(id),
        daimoiId: daimoi?.id ?? null,
        daimoiActivation: daimoi?.activation ?? 0,
        lake: lakeCluster(id),
        nodeType: nodeTypeOf(id),
        compactedView: Boolean(compactView),
        representedNodeCount: compactView?.descendant_node_count ?? null,
        saturation: compactView?.saturation ?? null,
        sourceMetadata: compactView?.source_metadata ?? null,
      };
    }).sort((a, b) => b.score - a.score).slice(0, maxNodes);

    const emittedDaimoi = resultNodes
      .map((node) => daimoiByNode.get(node.id))
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .map((row) => ({
        id: row.id,
        query: row.query,
        originNodeId: row.originNodeId,
        currentNodeId: row.currentNodeId,
        trail: row.trail,
        activation: row.activation,
        traversalCost: row.traversalCost,
        status: row.status,
      }));

    const semanticReinforcements = traversedEdges
      .filter((edge) => edge.edgeKind === "semantic_force_legacy" || edge.edgeKind === "semantic_force")
      .map((edge) => {
        const source = String(edge.source ?? "");
        const target = String(edge.target ?? "");
        const similarity = Number(edge.similarity ?? 0);
        const conductance = semanticCircuitConductance(similarity, Number(edge.charge ?? similarity));
        return { source, target, conductance, similarity };
      })
      .filter((edge) => edge.source && edge.target && edge.source !== edge.target && edge.conductance > 0);
    if (semanticReinforcements.length > 0) {
      const reinforcedAt = new Date();
      try {
        await app.mongo.graphSemanticEdges.bulkWrite(semanticReinforcements.map((edge) => ({
          updateOne: {
            filter: {
              $or: [
                { source_node_id: edge.source, target_node_id: edge.target },
                { source_node_id: edge.target, target_node_id: edge.source },
              ],
            },
            update: {
              $set: {
                status: "active",
                last_reinforced_at: reinforcedAt,
                decay_half_life_ms: 60 * 60 * 1000,
                updated_at: reinforcedAt,
                updatedAt: reinforcedAt,
              },
              $max: { conductance: edge.conductance },
              $inc: { reinforcement_count: 1 },
            },
          },
        })), { ordered: false });
      } catch (error) {
        req.log.warn({ error }, "failed to reinforce traversed semantic edges");
      }
    }

    let persistedTrailCount = 0;
    if (persistDaimoiTrails && emittedDaimoi.length > 0 && app.mongo.graphDaimoiTrails) {
      const emittedAt = new Date();
      const queryHash = hashHex(q, 64);
      const operations = emittedDaimoi.map((row) => {
        const edgeKeys = row.trail.slice(1).map((nodeId, index) => undirectedEdgeKey(row.trail[index]!, nodeId));
        const fieldAdjustments = row.trail.map((nodeId, index) => ({
          node_id: nodeId,
          delta: row.activation / Math.max(1, index + 1),
        }));
        const trailHash = hashHex(`${row.id}:${row.currentNodeId}:${row.trail.join("->")}:${emittedAt.toISOString()}`, 24);
        const doc = {
          _id: `daimoi-trail:${trailHash}`,
          query_hash: queryHash,
          query_text: q,
          daimoi_id: row.id,
          origin_node_id: row.originNodeId,
          current_node_id: row.currentNodeId,
          node_ids: [...new Set(row.trail)],
          edge_keys: edgeKeys,
          trail: row.trail,
          activation: row.activation,
          traversal_cost: row.traversalCost,
          field_adjustments: fieldAdjustments,
          decay_half_life_seconds: trailHalfLifeSeconds,
          emitted_at: emittedAt,
          createdAt: emittedAt,
          updatedAt: emittedAt,
        };
        return {
          updateOne: {
            filter: { _id: doc._id },
            update: { $setOnInsert: doc },
            upsert: true,
          },
        };
      });
      try {
        if (operations.length > 0) {
          const result = await app.mongo.graphDaimoiTrails.bulkWrite(operations, { ordered: false });
          persistedTrailCount = result.upsertedCount ?? 0;
        }
      } catch (error) {
        req.log.warn({ error }, "failed to persist daimoi trail observations");
      }
    }

    for (const node of resultNodes) {
      const clusterKey = node.lake;
      if (!clusterMap.has(clusterKey)) clusterMap.set(clusterKey, []);
      clusterMap.get(clusterKey)!.push(node);
    }

    let textMap: Map<string, string> | null = null;
    if (includeText && resultNodes.length > 0) {
      textMap = new Map();
      const sample = resultNodes.slice(0, 20);
      const nodeDocs = await app.mongo.events.find(
        { id: { $in: sample.map((n: any) => n.id) } },
        { projection: { id: 1, text: 1, "extra.preview": 1 } }
      ).toArray();
      for (const doc of nodeDocs) {
        const txt = doc.text || (doc.extra as any)?.preview || "";
        if (txt) textMap.set(doc.id, typeof txt === "string" ? txt.slice(0, 300) : String(txt).slice(0, 300));
      }
    }

    const clusters = [...clusterMap.entries()].map(([lake, nodes]) => ({
      lake,
      count: nodes.length,
      topNodes: nodes.slice(0, 5).map((n: any) => ({
        id: n.id,
        score: n.score,
        nodeType: n.nodeType,
        text: textMap?.get(n.id) ?? null,
      })),
    })).sort((a, b) => b.count - a.count);

    return {
      query: q,
      clusters,
      nodes: resultNodes.map((n: any) => ({
        ...n,
        text: textMap?.get(n.id) ?? null,
      })),
      edges: traversedEdges,
      daimoi: emittedDaimoi,
      stats: {
        vectorHits: vectorHitCount,
        truthSeeds: truthSeedNodeIds.length,
        seeds: seedNodeIds.length,
        compactViewSeeds: compactViewNodeById.size,
        compactedSeedMembers: compactMemberToViewNode.size,
        expandedCompactViewSeeds: expandedCompactViewSeedIds.size,
        daimoi: emittedDaimoi.length,
        visited: visited.size,
        edges: traversedEdges.length,
        forceSamples: forceSamples.length,
        semanticReinforcements: semanticReinforcements.length,
        edgeClaims: activeClaimRows.length,
        legacySemanticEdges: legacySemanticEdges.length,
        trailSamples: priorTrailRows.length,
        trailInfluenceNodes: trailNodeInfluence.size,
        persistedDaimoiTrails: persistedTrailCount,
        clusters: clusters.length,
        mode: "query_daimoi_fill",
      },
    };
  });

  // Seed initial layout positions for all graph.node events that lack layout overrides.
  // Generates random positions in a circle, bulk-writes to graph_layout_overrides so
  // /graph/view and eros-eris-field simulation can start operating.
  app.post("/jobs/seed-layout", async (req: any, reply) => {
    const project = typeof req.body?.project === "string" ? req.body.project.trim() : "";
    const targetRadius = Math.max(100, Math.min(50000, Number(req.body?.targetRadius ?? 3000)));
    const batchSize = Math.max(100, Math.min(5000, Number(req.body?.batchSize ?? 2000)));
    const source = req.body?.source ?? "seed-layout";
    const layoutVersion = req.body?.layoutVersion ?? "v1";
    const dryRun = req.body?.dryRun === true;

    const projectFilter = project ? { project } : {};
    const nodeProjection = { "extra.node_id": 1, project: 1 };

    // Get all node_ids from graph.node events
    const eventCursor = app.mongo.events.find({ kind: "graph.node", ...projectFilter }, { projection: nodeProjection });
    const eventNodeIds = new Set<string>();
    for await (const doc of eventCursor) {
      const nodeId = (doc as any).extra?.node_id;
      if (typeof nodeId === "string" && nodeId) {
        eventNodeIds.add(nodeId);
      }
    }

    if (eventNodeIds.size === 0) {
      return { ok: true, seeded: 0, total: 0, note: "No graph.node events found" };
    }

    // Get node_ids that already have layout overrides
    const existingLayouts = await app.mongo.graphLayoutOverrides
      .find({ _id: { $in: [...eventNodeIds] } }, { projection: { _id: 1 } })
      .toArray() as any[];
    const existingIds = new Set(existingLayouts.map((r: any) => String(r._id)));

    // Find nodes needing layout
    const missingIds = [...eventNodeIds].filter((id) => !existingIds.has(id));

    if (missingIds.length === 0) {
      return { ok: true, seeded: 0, total: eventNodeIds.size, note: "All nodes already have layout overrides" };
    }

    if (dryRun) {
      return { ok: true, seeded: 0, total: eventNodeIds.size, missing: missingIds.length, dryRun: true };
    }

    // Generate initial random positions in a disk
    // Use golden-angle spiral for better initial distribution than pure random
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees
    const seeded: Array<{ node_id: string; x: number; y: number }> = [];

    for (let i = 0; i < missingIds.length; i += 1) {
      // Golden-angle spiral: uniform area distribution
      const theta = i * goldenAngle;
      const r = targetRadius * Math.sqrt((i + 0.5) / missingIds.length);
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      seeded.push({ node_id: missingIds[i]!, x, y });
    }

    // Bulk write in batches
    let totalStored = 0;
    const now = new Date();
    for (let i = 0; i < seeded.length; i += batchSize) {
      const batch = seeded.slice(i, i + batchSize);
      await app.mongo.graphLayoutOverrides.bulkWrite(
        batch.map((row) => ({
          updateOne: {
            filter: { _id: row.node_id },
            update: {
              $set: {
                node_id: row.node_id,
                x: row.x,
                y: row.y,
                layout_source: source,
                layout_version: layoutVersion,
                updated_at: now,
              },
              $setOnInsert: {
                created_at: now,
              },
            },
            upsert: true,
          },
        })),
        { ordered: false },
      );
      totalStored += batch.length;
    }

    return {
      ok: true,
      seeded: totalStored,
      total: eventNodeIds.size,
      targetRadius,
      note: `Seeded ${totalStored} nodes with golden-angle spiral layout`,
    };
  });
};

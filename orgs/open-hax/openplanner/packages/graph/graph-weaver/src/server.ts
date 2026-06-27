import http from "node:http";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { WebSocketServer } from "ws";

import { GraphWeaverAco } from "@workspace/graph-weaver-aco";
import type { WeaverEvent } from "@workspace/graph-weaver-aco";

import type { GraphEdge, GraphNode, GraphSnapshot } from "./graph.js";
import { applyConfigPatch, defaultConfigFromEnv, type ConfigPatch, type RuntimeConfig } from "./config.js";
import { createGraphQLHandler } from "./graphql.js";
import type { SemanticFieldCell, SemanticFieldSample } from "./graphql.js";
import { repoRootFromGit } from "./git.js";
import { layoutGraph } from "./layout.js";
import { rebuildLakeGraph } from "./lakes.js";
import { MongoGraphStore } from "./mongo-graph-store.js";
import { rebuildOpenPlannerGraph, upsertOpenPlannerGraphLayout } from "./openplanner-graph.js";
import { readJsonIfExists, writeJson } from "./persist.js";
import type { NodePreview } from "./preview.js";
import { fetchUrlPreview, readFilePreview } from "./preview.js";
import { rebuildLocalGraph } from "./scan.js";
import { GraphStore, mergeStoresMany } from "./store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function json(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function getBearer(headers: http.IncomingHttpHeaders): string | null {
  const raw = headers.authorization;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const match = /^Bearer\s+(.+)$/i.exec(value);
  return match?.[1]?.trim() || null;
}

async function readBody(req: http.IncomingMessage, maxBytes = 10_000_000): Promise<string> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    chunks.push(buffer);
    total += buffer.length;
    if (total > maxBytes) {
      throw new Error("request too large");
    }
  }
  return Buffer.concat(chunks).toString("utf8");
}

function notFound(res: http.ServerResponse): void {
  res.statusCode = 404;
  res.end("not found");
}

function contentType(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".map")) return "application/json; charset=utf-8";
  return "application/octet-stream";
}

async function serveFile(res: http.ServerResponse, filePath: string): Promise<void> {
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { "content-type": contentType(filePath) });
    res.end(data);
  } catch {
    notFound(res);
  }
}

function sampleByStride<T>(rows: T[], max: number): T[] {
  if (rows.length <= max) return rows;
  const stride = Math.max(1, Math.ceil(rows.length / max));
  const out: T[] = [];
  for (let i = 0; i < rows.length && out.length < max; i += stride) {
    out.push(rows[i]!);
  }
  return out;
}

function downsampleSnapshot(
  snapshot: {
    nodes: Array<{ id: string; kind?: string; layer?: string }>;
    edges: Array<{ id: string; source: string; target: string; kind?: string; layer?: string }>;
  },
  opts: { maxNodes: number; maxEdges: number },
) {
  const totalNodes = snapshot.nodes.length;
  const totalEdges = snapshot.edges.length;
  const priorityNodeIds = new Set(
    snapshot.nodes
      .filter((node) => node.kind === "presence" || node.layer === "presence")
      .map((node) => node.id),
  );
  const priorityEdges = snapshot.edges.filter(
    (edge) => edge.layer === "presence" || priorityNodeIds.has(edge.source) || priorityNodeIds.has(edge.target),
  );
  const priorityEdgeIds = new Set(priorityEdges.map((edge) => edge.id));

  const prioritizeEdges = (rows: Array<{ id: string; source: string; target: string; kind?: string; layer?: string }>) => {
    const byId = new Map<string, { id: string; source: string; target: string; kind?: string; layer?: string }>();
    for (const edge of priorityEdges) {
      if (byId.size >= opts.maxEdges) break;
      byId.set(edge.id, edge);
    }
    for (const edge of rows) {
      if (byId.size >= opts.maxEdges) break;
      byId.set(edge.id, edge);
    }
    return [...byId.values()];
  };

  if (totalNodes <= opts.maxNodes && totalEdges <= opts.maxEdges) {
    return {
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      sampledNodes: false,
      sampledEdges: false,
      totalNodes,
      totalEdges,
    };
  }

  let edges = snapshot.edges;
  let sampledEdges = false;
  if (edges.length > opts.maxEdges) {
    sampledEdges = true;
    const regularBudget = Math.max(0, opts.maxEdges - Math.min(priorityEdges.length, opts.maxEdges));
    const regularEdges = sampleByStride(
      [...edges].filter((edge) => !priorityEdgeIds.has(edge.id)).sort((a, b) => a.id.localeCompare(b.id)),
      regularBudget,
    );
    edges = prioritizeEdges(regularEdges);
  }

  if (edges.length === 0) {
    return {
      nodes: sampleByStride(snapshot.nodes, opts.maxNodes),
      edges,
      sampledNodes: snapshot.nodes.length > opts.maxNodes,
      sampledEdges,
      totalNodes,
      totalEdges,
    };
  }

  const computeKeep = (rows: Array<{ source: string; target: string }>) => {
    const keep = new Set<string>();
    for (const e of rows) {
      keep.add(e.source);
      keep.add(e.target);
    }
    return keep;
  };

  let keep = computeKeep(edges);
  while (keep.size > opts.maxNodes && edges.length > 200) {
    sampledEdges = true;
    const ratio = opts.maxNodes / Math.max(1, keep.size);
    const nextEdgeBudget = Math.max(200, Math.floor(edges.length * ratio));
    const priorityBudget = Math.min(priorityEdges.length, nextEdgeBudget);
    const regularBudget = Math.max(0, nextEdgeBudget - priorityBudget);
    edges = prioritizeEdges(sampleByStride(edges.filter((edge) => !priorityEdgeIds.has(edge.id)), regularBudget));
    keep = computeKeep(edges);
  }

  let nodes = snapshot.nodes.filter((n) => keep.has(n.id));
  if (priorityNodeIds.size > 0) {
    const byId = new Map<string, { id: string; kind?: string; layer?: string }>();
    for (const node of snapshot.nodes) {
      if (!priorityNodeIds.has(node.id)) continue;
      if (byId.size >= opts.maxNodes) break;
      byId.set(node.id, node);
    }
    for (const node of nodes) {
      if (byId.size >= opts.maxNodes) break;
      byId.set(node.id, node);
    }
    nodes = [...byId.values()];
  }
  let sampledNodes = nodes.length < totalNodes;

  if (nodes.length === 0 && snapshot.nodes.length > 0) {
    nodes = sampleByStride(snapshot.nodes, opts.maxNodes);
    sampledNodes = snapshot.nodes.length > opts.maxNodes;
  }

  // IMPORTANT: Do NOT fill up to maxNodes with nodes that have no retained edges.
  // Those degree-0 nodes will render as visually-stable "rings" (repulsion + boundary)
  // and look like they're not part of the graph proper.
  // It's better to render fewer nodes than to include disconnected filler.

  const nodeSet = new Set(nodes.map((n) => n.id));
  edges = edges.filter((e) => nodeSet.has(e.source) && nodeSet.has(e.target));

  return { nodes, edges, sampledNodes, sampledEdges, totalNodes, totalEdges };
}

function stableStateDir(repoRoot: string): string {
  const raw = String(process.env.STATE_DIR || "").trim();
  if (!raw) {
    return path.join(repoRoot, ".opencode", "runtime");
  }
  return path.isAbsolute(raw) ? raw : path.join(repoRoot, raw);
}

function deepEqualJson(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function posFromData(data: unknown): { x: number; y: number } | null {
  if (!data || typeof data !== "object") return null;
  const pos = (data as { pos?: unknown }).pos;
  if (!pos || typeof pos !== "object") return null;
  const x = (pos as { x?: unknown }).x;
  const y = (pos as { y?: unknown }).y;
  if (typeof x === "number" && Number.isFinite(x) && typeof y === "number" && Number.isFinite(y)) {
    // Guardrail: bad layout writers can explode coordinates and ruin fit-to-graph.
    // We soft-clamp to a max radius so the view remains usable.
    const maxR = 7000;
    const r = Math.sqrt(x * x + y * y);
    if (r > maxR && r > 0) {
      const s = maxR / r;
      return { x: x * s, y: y * s };
    }
    return { x, y };
  }
  return null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function numberOr(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function dataObject(data: unknown): Record<string, unknown> {
  return data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : {};
}

function semanticEdgeId(source: string, target: string): string {
  const ordered = source < target ? `${source}\n${target}` : `${target}\n${source}`;
  const hash = createHash("sha256").update(ordered).digest("hex").slice(0, 24);
  return `semantic:${hash}`;
}

function semanticConductance(similarity: number, reinforcement = 1): number {
  return Math.max(0, clamp(similarity, -1, 1)) * Math.max(0, reinforcement);
}

function semanticEdgeDecayedData(edge: GraphEdge, now: Date): Record<string, unknown> {
  const data = dataObject(edge.data);
  const last = new Date(String(data.last_reinforced_at ?? data.created_at ?? now.toISOString()));
  const halfLifeMs = Math.max(1, numberOr(data.decay_half_life_ms, 60 * 60 * 1000));
  const ageMs = Math.max(0, now.getTime() - last.getTime());
  const current = Math.max(0, numberOr(data.conductance, Math.max(0, numberOr(data.similarity, 0))));
  return {
    ...data,
    conductance: current * Math.pow(0.5, ageMs / halfLifeMs),
    decayed_at: now.toISOString(),
  };
}

function buildHostResourcePresenceSnapshot(): GraphSnapshot {
  const now = new Date().toISOString();
  const hostId = `presence:resource:host:${os.hostname()}`;
  const nodes: GraphNode[] = [
    {
      id: hostId,
      kind: "presence",
      label: `host:${os.hostname()}`,
      external: false,
      loadedByDefault: true,
      layer: "presence",
      data: {
        presence_class: "resource",
        resource_kind: "host",
        saturation: 0,
        emission_threshold: 1,
        refractory_ms: 1000,
        archived: false,
        observed_at: now,
      },
    },
    {
      id: "presence:resource:ram",
      kind: "presence",
      label: "RAM",
      external: false,
      loadedByDefault: true,
      layer: "presence",
      data: {
        presence_class: "resource",
        resource_kind: "ram",
        saturation: 1 - (os.freemem() / Math.max(1, os.totalmem())),
        emission_threshold: 0.85,
        refractory_ms: 2500,
        total_bytes: os.totalmem(),
        free_bytes: os.freemem(),
        archived: false,
        observed_at: now,
      },
    },
  ];

  const cpuInfos = os.cpus();
  for (const [index, cpu] of cpuInfos.entries()) {
    nodes.push({
      id: `presence:resource:cpu:${index}`,
      kind: "presence",
      label: `CPU ${index}`,
      external: false,
      loadedByDefault: true,
      layer: "presence",
      data: {
        presence_class: "resource",
        resource_kind: "cpu_core",
        cpu_index: index,
        cpu_model: cpu.model,
        saturation: 0,
        emission_threshold: 1,
        refractory_ms: 1000,
        archived: false,
        observed_at: now,
      },
    });
  }

  const acceleratorKinds = String(process.env.GRAPH_WEAVER_RESOURCE_PRESENCES || "npu,gpu:0,gpu:1")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  for (const kind of acceleratorKinds) {
    const normalized = kind.replace(/[^a-zA-Z0-9:_-]+/g, "_").toLowerCase();
    nodes.push({
      id: `presence:resource:${normalized}`,
      kind: "presence",
      label: kind.toUpperCase(),
      external: false,
      loadedByDefault: true,
      layer: "presence",
      data: {
        presence_class: "resource",
        resource_kind: normalized.split(":")[0] || normalized,
        saturation: 0,
        emission_threshold: 1,
        refractory_ms: 1500,
        archived: false,
        observed_at: now,
      },
    });
  }

  const edges: GraphEdge[] = nodes
    .filter((node) => node.id !== hostId)
    .map((node) => ({
      id: `${hostId}=>${node.id}:presence_contains`,
      source: hostId,
      target: node.id,
      kind: "presence_contains",
      layer: "presence",
      data: { observed_at: now },
    }));

  return { nodes, edges };
}

function safeResolveUnderRoot(rootDir: string, relPath: string): string | null {
  const root = path.resolve(rootDir);
  const abs = path.resolve(rootDir, relPath);
  if (abs === root) return abs;
  if (!abs.startsWith(root + path.sep)) return null;
  return abs;
}

async function main(): Promise<void> {
  const host = process.env.HOST || "0.0.0.0";
  const port = Number(process.env.PORT || "8796");
  const repoRoot = process.env.REPO_ROOT || (await repoRootFromGit(process.cwd())) || process.cwd();
  const localSourceMode = String(process.env.GRAPH_WEAVER_LOCAL_SOURCE || "repo").trim().toLowerCase();
  const openPlannerBaseUrl = String(process.env.OPENPLANNER_BASE_URL || "").trim();
  const openPlannerApiKey = String(process.env.OPENPLANNER_API_KEY || "").trim();
  const openPlannerProjects = String(process.env.GRAPH_WEAVER_OPENPLANNER_PROJECTS || "devel,web,bluesky,knoxx-session")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const includeSemanticEdges = !/^(0|false|no)$/i.test(String(process.env.GRAPH_WEAVER_INCLUDE_SEMANTIC_EDGES || "true"));
  const semanticMinSimilarity = Math.max(0, Math.min(1, Number(process.env.GRAPH_WEAVER_SEMANTIC_MIN_SIMILARITY ?? 0.75)));
  const requestedPersistenceMode = String(process.env.GRAPH_WEAVER_PERSISTENCE_MODE || "").trim().toLowerCase();
  const webCrawlEnabled = !/^(0|false|no)$/i.test(String(process.env.GRAPH_WEAVER_WEB_CRAWL_ENABLED || "true"));
  const includeWebLayerWhenIdle = !/^(0|false|no)$/i.test(
    String(process.env.GRAPH_WEAVER_INCLUDE_WEB_LAYER_WHEN_IDLE || (["openplanner-lakes", "openplanner-graph"].includes(localSourceMode) ? "false" : "true")),
  );
  const includeWebLayer = webCrawlEnabled || includeWebLayerWhenIdle;
  const semanticDecayIntervalMs = Math.max(5_000, Number(process.env.GRAPH_WEAVER_SEMANTIC_DECAY_INTERVAL_MS ?? 60_000));
  const semanticDecayBreakBelow = Math.max(0, Number(process.env.GRAPH_WEAVER_SEMANTIC_DECAY_BREAK_BELOW ?? 0.05));
  const semanticDecayPruneBelow = Math.max(0, Number(process.env.GRAPH_WEAVER_SEMANTIC_DECAY_PRUNE_BELOW ?? 0.005));
  const graphPersistenceMode = (() => {
    if (requestedPersistenceMode === "mongo" || requestedPersistenceMode === "openplanner") return requestedPersistenceMode;
    if (localSourceMode === "openplanner-graph") return "openplanner";
    return "mongo";
  })();

  const vendorWebglDist =
    process.env.WEBGL_GRAPH_VIEW_DIST || path.join(repoRoot, "packages/webgl-graph-view/dist");
  const publicDir = path.join(__dirname, "..", "public");

  const stateDir = stableStateDir(repoRoot);
  const configPath = path.join(stateDir, "devel-graph-weaver.config.json");
  const legacyUserGraphPath = path.join(stateDir, "devel-graph-weaver.user-graph.json");

  const mongoGraph = graphPersistenceMode === "mongo"
    ? new MongoGraphStore({
        uri: String(process.env.MONGODB_URI || "mongodb://mongodb:27017").trim(),
        dbName: String(process.env.MONGODB_DB || "devel_graph_weaver").trim(),
        nodeCollectionName: String(process.env.MONGODB_NODE_COLLECTION || "graph_weaver_nodes").trim(),
        edgeCollectionName: String(process.env.MONGODB_EDGE_COLLECTION || "graph_weaver_edges").trim(),
        appName: "devel-graph-weaver",
      })
    : null;
  if (mongoGraph) {
    await mongoGraph.connect();
  }

  const daimoiAuditMongo = mongoGraph ?? new MongoGraphStore({
    uri: String(process.env.MONGODB_URI || "mongodb://mongodb:27017").trim(),
    dbName: String(process.env.MONGODB_DB || "devel_graph_weaver").trim(),
    nodeCollectionName: String(process.env.MONGODB_NODE_COLLECTION || "graph_weaver_nodes").trim(),
    edgeCollectionName: String(process.env.MONGODB_EDGE_COLLECTION || "graph_weaver_edges").trim(),
    appName: "devel-graph-weaver-daimoi-audit",
  });
  if (!mongoGraph) {
    await daimoiAuditMongo.connect();
  }

  // --- config
  let config: RuntimeConfig = defaultConfigFromEnv(process.env);
  const storedConfig = await readJsonIfExists<ConfigPatch>(configPath);
  if (storedConfig) {
    config = applyConfigPatch(config, storedConfig);
  }

  const boundedOpenPlannerExportLimit = (envKey: string, currentLimit: number, floor: number): number => {
    const rawCeiling = Number(process.env[envKey] ?? currentLimit);
    const ceiling = Number.isFinite(rawCeiling) ? rawCeiling : currentLimit;
    return Math.max(floor, Math.floor(Math.min(currentLimit, ceiling)));
  };

  let configSaveTimer: ReturnType<typeof setTimeout> | null = null;
  const scheduleSaveConfig = () => {
    if (configSaveTimer) return;
    configSaveTimer = setTimeout(() => {
      configSaveTimer = null;
      void writeJson(configPath, config).catch(() => {});
    }, 250);
  };

  // --- graph stores
  let localStore = new GraphStore();
  const webStore = new GraphStore();
  const userStore = new GraphStore();

  const loadSnapshotIntoStore = (store: GraphStore, snapshot: GraphSnapshot) => {
    for (const node of snapshot.nodes) store.upsertNode(node);
    for (const edge of snapshot.edges) store.upsertEdge(edge);
  };

  if (mongoGraph) {
    // persisted graph load (MongoDB datalake)
    loadSnapshotIntoStore(webStore, await mongoGraph.loadStore("web"));

    const storedUser = await mongoGraph.loadStore("user");
    if (storedUser.nodes.length > 0 || storedUser.edges.length > 0) {
      loadSnapshotIntoStore(userStore, storedUser);
    } else {
      // one-time legacy migration from the old JSON snapshot, if it exists and parses.
      const legacyUser = await readJsonIfExists<GraphSnapshot>(legacyUserGraphPath);
      if (legacyUser?.nodes && legacyUser?.edges) {
        loadSnapshotIntoStore(userStore, legacyUser);
        await mongoGraph.bulkUpsertNodes("user", legacyUser.nodes);
        await mongoGraph.bulkUpsertEdges("user", legacyUser.edges);

        try {
          await fs.rename(legacyUserGraphPath, `${legacyUserGraphPath}.migrated`);
        } catch {
          // ignore: non-fatal if rename fails or file doesn't exist.
        }
      }
    }
  }

  const resourcePresenceSnapshot = buildHostResourcePresenceSnapshot();
  loadSnapshotIntoStore(userStore, resourcePresenceSnapshot);
  if (mongoGraph) {
    await mongoGraph.bulkUpsertNodes("user", resourcePresenceSnapshot.nodes);
    await mongoGraph.bulkUpsertEdges("user", resourcePresenceSnapshot.edges);
  }

  // --- revision + WS broadcast + combined cache
  let revision = 0;
  let combinedCache: { revision: number; store: GraphStore } | null = null;
  const graphViewCache = new Map<string, {
    nodes: Array<{
      id: string;
      kind: string;
      label: string;
      x: number;
      y: number;
      external: boolean;
      loadedByDefault: boolean;
      layer?: GraphNode["layer"];
      data?: GraphNode["data"];
    }>;
    edges: Array<{
      source: string;
      target: string;
      kind: string;
      layer?: GraphEdge["layer"];
      data?: GraphEdge["data"];
    }>;
    meta: {
      totalNodes: number;
      totalEdges: number;
      sampledNodes: boolean;
      sampledEdges: boolean;
    };
  }>();
  let localSync: {
    ok: boolean;
    mode: string;
    lastSuccessfulAt: string | null;
    lastAttemptAt: string | null;
    error: string | null;
    prunedOverlayNodes: number;
  } = {
    ok: true,
    mode: localSourceMode,
    lastSuccessfulAt: null,
    lastAttemptAt: null,
    error: null,
    prunedOverlayNodes: 0,
  };

  const broadcast = new Set<() => void>();
  const pendingUserNodeFlush = new Map<string, GraphNode>();
  let userNodeFlushTimer: ReturnType<typeof setTimeout> | null = null;
  const markDirty = () => {
    revision += 1;
    combinedCache = null;
    graphViewCache.clear();
    for (const cb of broadcast) cb();
  };

  const flushUserNodeWrites = async () => {
    const batch = [...pendingUserNodeFlush.values()];
    pendingUserNodeFlush.clear();
    if (batch.length === 0) return;
    if (mongoGraph) {
      await mongoGraph.bulkUpsertNodes("user", batch);
      return;
    }

    const inputs = batch
      .map((node) => {
        const pos = posFromData(node.data);
        if (!pos) return null;
        return { id: node.id, x: pos.x, y: pos.y };
      })
      .filter((row): row is { id: string; x: number; y: number } => !!row);

    if (inputs.length > 0) {
      await upsertOpenPlannerGraphLayout({
        openPlannerBaseUrl,
        openPlannerApiKey,
        source: "graph-weaver",
        layoutVersion: "v1",
        inputs,
      });
    }
  };

  const scheduleUserNodeFlush = (nodes: GraphNode[]) => {
    for (const node of nodes) {
      pendingUserNodeFlush.set(node.id, node);
    }
    if (userNodeFlushTimer) return;
    userNodeFlushTimer = setTimeout(() => {
      userNodeFlushTimer = null;
      void flushUserNodeWrites().catch((error) => {
        console.error("[devel-graph-weaver] failed to persist queued user node positions", error);
      });
    }, 1000);
  };

  const getCombinedStore = (): GraphStore => {
    if (combinedCache && combinedCache.revision === revision) return combinedCache.store;
    const combined = mergeStoresMany(includeWebLayer ? [localStore, webStore, userStore] : [localStore, userStore]);
    combinedCache = { revision, store: combined };
    return combined;
  };

  // --- local rebuild (scan)
  let lastSeeds: string[] = [];

  async function pruneStaleOverlayNodes(): Promise<number> {
    const staleIds: string[] = [];
    for (const node of userStore.nodes()) {
      const hasBase = localStore.hasNode(node.id) || (includeWebLayer && webStore.hasNode(node.id));
      if (hasBase) continue;

      const dataKeys = Object.keys(node.data ?? {});
      const isLayoutOnlyOverlay = dataKeys.length > 0 && dataKeys.every((key) => key === "pos");
      if (!isLayoutOnlyOverlay) continue;

      staleIds.push(node.id);
    }

    if (staleIds.length === 0) return 0;

    for (const id of staleIds) {
      userStore.removeNode(id);
    }
    if (mongoGraph) {
      await mongoGraph.bulkRemoveNodes("user", staleIds);
    }
    return staleIds.length;
  }

  async function rebuildLocal(): Promise<void> {
    const attemptedAt = new Date().toISOString();
    const fresh = new GraphStore();

    try {
      const result =
        localSourceMode === "repo"
          ? await rebuildLocalGraph({
              repoRoot,
              store: fresh,
              maxFileBytes: config.scan.maxFileBytes,
            })
          : localSourceMode === "openplanner-graph"
            ? await rebuildOpenPlannerGraph({
                openPlannerBaseUrl,
                openPlannerApiKey,
                store: fresh,
                projects: openPlannerProjects,
                includeSemantic: includeSemanticEdges,
                semanticMinSimilarity,
                maxNodes: boundedOpenPlannerExportLimit("GRAPH_WEAVER_OPENPLANNER_EXPORT_MAX_NODES", config.render.maxRenderNodes, 200),
                maxEdges: boundedOpenPlannerExportLimit("GRAPH_WEAVER_OPENPLANNER_EXPORT_MAX_EDGES", config.render.maxRenderEdges, 200),
                maxSemanticEdges: boundedOpenPlannerExportLimit("GRAPH_WEAVER_OPENPLANNER_EXPORT_MAX_SEMANTIC_EDGES", config.render.maxRenderEdges, 0),
              })
          : localSourceMode === "openplanner-lakes"
            ? await rebuildLakeGraph({
                openPlannerBaseUrl,
                openPlannerApiKey,
                store: fresh,
              })
            : localSourceMode === "none"
              ? { seeds: [] }
              : (() => {
                  throw new Error(`Unsupported GRAPH_WEAVER_LOCAL_SOURCE: ${localSourceMode}`);
                })();

      lastSeeds = result.seeds;
      localStore = fresh;
      const prunedOverlayNodes = await pruneStaleOverlayNodes();
      localSync = {
        ok: true,
        mode: localSourceMode,
        lastSuccessfulAt: attemptedAt,
        lastAttemptAt: attemptedAt,
        error: null,
        prunedOverlayNodes,
      };
      if (prunedOverlayNodes > 0) {
        console.log(`[devel-graph-weaver] pruned ${prunedOverlayNodes} stale overlay node(s)`);
      }
      markDirty();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      localSync = {
        ...localSync,
        ok: false,
        mode: localSourceMode,
        lastAttemptAt: attemptedAt,
        error: message,
      };
      console.error(`[devel-graph-weaver] local rebuild failed (mode=${localSourceMode})`, error);
      throw error;
    }
  }

  // --- weaver
  let weaver: GraphWeaverAco | null = null;

  const onWeaverEvent = (ev: WeaverEvent) => {
    if (ev.type === "page") {
      const fromId = `url:${ev.url}`;
      const pageNode: GraphNode = {
        id: fromId,
        kind: "url",
        label: ev.url,
        external: true,
        loadedByDefault: false,
        layer: "web",
        url: ev.url,
        data: {
          url: ev.url,
          status: ev.status,
          contentType: ev.contentType,
          fetchedAt: ev.fetchedAt,
        },
      };
      webStore.upsertNode(pageNode);

      const touchedNodes: GraphNode[] = [pageNode];
      const touchedEdges: GraphEdge[] = [];

      for (const out of ev.outgoing) {
        const toId = `url:${out}`;
        const outNode: GraphNode = {
          id: toId,
          kind: "url",
          label: out,
          external: true,
          loadedByDefault: false,
          layer: "web",
          url: out,
          data: { url: out },
        };
        const outEdge: GraphEdge = {
          id: `${fromId}=>${toId}:web`,
          source: fromId,
          target: toId,
          kind: "web",
          layer: "web",
        };

        webStore.upsertNode(outNode);
        webStore.upsertEdge(outEdge);
        touchedNodes.push(outNode);
        touchedEdges.push(outEdge);
      }

      if (mongoGraph) {
        void (async () => {
          await mongoGraph.bulkUpsertNodes("web", touchedNodes);
          await mongoGraph.bulkUpsertEdges("web", touchedEdges);
        })().catch((err) => {
          // eslint-disable-next-line no-console
          console.error("[devel-graph-weaver] failed to persist web page event", err);
        });
      }

      markDirty();
      return;
    }

    if (ev.type === "error") {
      const nodeId = `url:${ev.url}`;
      const errorNode: GraphNode = {
        id: nodeId,
        kind: "url",
        label: ev.url,
        external: true,
        loadedByDefault: false,
        layer: "web",
        url: ev.url,
        data: { url: ev.url, error: ev.message, fetchedAt: ev.fetchedAt },
      };
      webStore.upsertNode(errorNode);
      if (mongoGraph) {
        void mongoGraph.upsertNode("web", errorNode).catch((err) => {
          // eslint-disable-next-line no-console
          console.error("[devel-graph-weaver] failed to persist web error event", err);
        });
      }
      markDirty();
    }
  };

  const createWeaver = () =>
    new GraphWeaverAco({
      ants: config.weaver.ants,
      dispatchIntervalMs: config.weaver.dispatchIntervalMs,
      maxConcurrency: config.weaver.maxConcurrency,
      perHostMinIntervalMs: config.weaver.perHostMinIntervalMs,
      revisitAfterMs: config.weaver.revisitAfterMs,
      alpha: config.weaver.alpha,
      beta: config.weaver.beta,
      evaporation: config.weaver.evaporation,
      deposit: config.weaver.deposit,
      requestTimeoutMs: config.weaver.requestTimeoutMs,
    });

  const startWeaver = () => {
    if (!webCrawlEnabled) {
      if (weaver) {
        weaver.stop();
        weaver = null;
      }
      return;
    }
    if (weaver) {
      weaver.stop();
      weaver = null;
    }
    weaver = createWeaver();
    weaver.onEvent(onWeaverEvent);
    weaver.seed(lastSeeds);
    weaver.start();
  };

  // boot
  // IMPORTANT: don't block the server from starting if the initial local rebuild fails.
  // In openplanner-backed modes, transient API/auth issues would otherwise make the UI
  // "load forever" because the HTTP server never begins listening.
  try {
    await rebuildLocal();
  } catch (error) {
    console.error("[devel-graph-weaver] boot rebuild failed; starting with empty graph", error);
  }
  startWeaver();

  // scan timer
  let rescanTimer: ReturnType<typeof setInterval> | null = null;
  const resetRescanTimer = () => {
    if (rescanTimer) {
      clearInterval(rescanTimer);
    }
    rescanTimer = setInterval(() => {
      void rebuildLocal()
        .then(() => {
          if (webCrawlEnabled) {
            weaver?.seed(lastSeeds);
          }
        })
        .catch((error) => {
          console.error("[devel-graph-weaver] scheduled rescan failed", error);
        });
    }, config.scan.rescanIntervalMs);
  };
  resetRescanTimer();

  // --- graph view
  const focusedGraphViewCache = new Map<string, ReturnType<typeof buildGraphView>>();

  const buildGraphViewFromSnapshot = (
    snapshot: { nodes: GraphNode[]; edges: GraphEdge[] },
    opts: { maxNodes: number; maxEdges: number },
  ) => {
    const sampled = downsampleSnapshot(snapshot, opts);
    const sampledNodes = sampled.nodes as unknown as GraphNode[];
    const sampledEdges = sampled.edges as unknown as GraphEdge[];

    const needsDerivedLayout = sampledNodes.some((node) => !posFromData(node.data));
    const positions = needsDerivedLayout
      ? layoutGraph({
          nodes: sampledNodes,
          edges: sampledEdges,
        })
      : null;

    return {
      nodes: sampledNodes.map((n) => {
        const override = posFromData(n.data);
        const p = override ?? positions?.get(n.id) ?? { x: 0, y: 0 };
        return {
          id: n.id,
          kind: n.kind,
          label: n.label,
          x: p.x,
          y: p.y,
          external: n.external,
          loadedByDefault: n.loadedByDefault,
          layer: n.layer,
          data: n.data,
        };
      }),
      edges: sampledEdges.map((e) => ({
        source: e.source,
        target: e.target,
        kind: e.kind,
        layer: e.layer,
        data: e.data,
      })),
      meta: {
        totalNodes: sampled.totalNodes,
        totalEdges: sampled.totalEdges,
        sampledNodes: sampled.sampledNodes,
        sampledEdges: sampled.sampledEdges,
      },
    };
  };

  const buildGraphView = (opts?: { maxNodes?: number; maxEdges?: number }) => {
    const maxNodes = Math.max(200, Math.floor(opts?.maxNodes ?? config.render.maxRenderNodes));
    const maxEdges = Math.max(200, Math.floor(opts?.maxEdges ?? config.render.maxRenderEdges));
    const cacheKey = `${revision}:${maxNodes}:${maxEdges}`;
    const cached = graphViewCache.get(cacheKey);
    if (cached) return cached;

    const combined = getCombinedStore().snapshot();

    const view = buildGraphViewFromSnapshot(combined as { nodes: GraphNode[]; edges: GraphEdge[] }, { maxNodes, maxEdges });

    graphViewCache.set(cacheKey, view);
    return view;
  };

  const buildFocusedGraphView = (opts: { rootId: string; distance: number; maxNodes?: number; maxEdges?: number }) => {
    const rootId = String(opts.rootId || "").trim();
    const distance = Math.max(0, Math.min(12, Math.floor(Number(opts.distance ?? 1))));
    const maxNodes = Math.max(20, Math.floor(opts.maxNodes ?? config.render.maxRenderNodes));
    const maxEdges = Math.max(20, Math.floor(opts.maxEdges ?? config.render.maxRenderEdges));

    const cacheKey = `${revision}:${rootId}:${distance}:${maxNodes}:${maxEdges}`;
    const cached = focusedGraphViewCache.get(cacheKey);
    if (cached) return cached;

    const combined = getCombinedStore().snapshot() as unknown as { nodes: GraphNode[]; edges: GraphEdge[] };
    const nodesById = new Map(combined.nodes.map((node) => [node.id, node] as const));

    if (!rootId || !nodesById.has(rootId)) {
      const empty = buildGraphViewFromSnapshot({ nodes: [], edges: [] } as unknown as { nodes: GraphNode[]; edges: GraphEdge[] }, {
        maxNodes,
        maxEdges,
      });
      focusedGraphViewCache.set(cacheKey, empty);
      return empty;
    }

    const adjacency = new Map<string, Set<string>>();
    const ensureAdj = (id: string) => {
      const existing = adjacency.get(id);
      if (existing) return existing;
      const created = new Set<string>();
      adjacency.set(id, created);
      return created;
    };

    for (const edge of combined.edges) {
      ensureAdj(edge.source).add(edge.target);
      ensureAdj(edge.target).add(edge.source);
    }

    const visited = new Set<string>([rootId]);
    let frontier = new Set<string>([rootId]);

    for (let step = 0; step < distance; step += 1) {
      const next = new Set<string>();
      for (const id of frontier) {
        for (const neighbor of adjacency.get(id) ?? []) {
          if (visited.has(neighbor)) continue;
          visited.add(neighbor);
          next.add(neighbor);
          if (visited.size >= maxNodes) break;
        }
        if (visited.size >= maxNodes) break;
      }
      if (next.size === 0) break;
      frontier = next;
      if (visited.size >= maxNodes) break;
    }

    const sliceNodes = combined.nodes.filter((node) => visited.has(node.id));
    const sliceEdges = combined.edges.filter((edge) => visited.has(edge.source) && visited.has(edge.target));
    const view = buildGraphViewFromSnapshot({ nodes: sliceNodes, edges: sliceEdges }, { maxNodes, maxEdges });

    focusedGraphViewCache.set(cacheKey, view);
    return view;
  };

  const getStatus = () => {
    const combined = getCombinedStore();
    const { nodes, edges } = combined.size();
    return {
      nodes,
      edges,
      seeds: lastSeeds.length,
      weaver: weaver?.stats() ?? { frontier: 0, inFlight: 0 },
      localSourceMode,
      includeWebLayer,
      localSync,
      webCrawlEnabled,
      render: config.render,
      scan: config.scan,
    };
  };

  const getNode = (id: string) => {
    const node = getCombinedStore().getNode(id);
    return node ?? null;
  };

  const getEdge = (id: string) => {
    const edge = getCombinedStore().getEdge(id);
    return edge ?? null;
  };

  const listEdges = (filter: { source?: string; target?: string; kind?: string; limit: number }) => {
    return getCombinedStore().listEdges(filter);
  };

  const neighbors = (filter: { id: string; direction: "in" | "out" | "both"; kind?: string; limit: number }) => {
    return getCombinedStore().neighbors(filter);
  };

  const searchNodes = (query: string, limit: number) => {
    return getCombinedStore().searchNodes(query, limit);
  };

  const listPresenceNodes = (filter: { class?: string; includeArchived: boolean; limit: number }) => {
    const out: GraphNode[] = [];
    const klass = String(filter.class ?? "").trim().toLowerCase();
    for (const node of getCombinedStore().nodes()) {
      const data = dataObject(node.data);
      if (node.kind !== "presence" && node.layer !== "presence" && typeof data.presence_class !== "string") continue;
      const presenceClass = String(data.presence_class ?? data.class ?? "transient").toLowerCase();
      if (klass && presenceClass !== klass) continue;
      if (!filter.includeArchived && data.archived === true) continue;
      out.push(node);
      if (out.length >= filter.limit) break;
    }
    return out;
  };

  const listSemanticEdges = (filter: { status?: string; minSimilarity?: number; limit: number }) => {
    const out: GraphEdge[] = [];
    const status = String(filter.status ?? "").trim().toLowerCase();
    const minSimilarity = typeof filter.minSimilarity === "number" ? filter.minSimilarity : -1;
    for (const edge of getCombinedStore().edges()) {
      const data = dataObject(edge.data);
      const isSemantic = edge.layer === "semantic" || edge.kind === "semantic_similarity" || edge.kind === "semantic_knn";
      if (!isSemantic) continue;
      const similarity = Number(data.similarity);
      if (!Number.isFinite(similarity)) continue;
      if (similarity < minSimilarity) continue;
      const edgeStatus = String(data.status ?? "active").toLowerCase();
      if (status && edgeStatus !== status) continue;
      out.push(edge);
      if (out.length >= filter.limit) break;
    }
    return out;
  };

  const nodePreview = async (id: string, maxBytes: number): Promise<NodePreview | null> => {
    const node = getCombinedStore().getNode(id);
    if (!node) return null;

    try {
      // files
      if (node.kind === "file" || id.startsWith("file:")) {
        const relPath = node.path ?? id.slice("file:".length);
        const absPath = safeResolveUnderRoot(repoRoot, relPath);
        if (!absPath) {
          return {
            id,
            kind: node.kind,
            format: "error",
            contentType: "text/plain; charset=utf-8",
            language: null,
            body: null,
            truncated: false,
            bytes: 0,
            error: "invalid file path",
          };
        }
        const p = await readFilePreview({ absPath, relPath, maxBytes });
        return { id, kind: node.kind, ...p };
      }

      // urls
      if (node.kind === "url" || id.startsWith("url:")) {
        const url = node.url ?? id.slice("url:".length);
        const p = await fetchUrlPreview({ url, maxBytes, timeoutMs: config.weaver.requestTimeoutMs });
        return { id, kind: node.kind, ...p };
      }

      const preview = typeof node.data?.preview === "string" ? node.data.preview : null;
      if (preview) {
        return {
          id,
          kind: node.kind,
          format: "code",
          contentType: "text/plain; charset=utf-8",
          language: null,
          body: preview,
          truncated: false,
          bytes: Buffer.byteLength(preview),
        };
      }

      // deps / other nodes: metadata-only (markdownable)
      const body = JSON.stringify(node, null, 2);
      return {
        id,
        kind: node.kind,
        format: "code",
        contentType: "application/json; charset=utf-8",
        language: "json",
        body,
        truncated: false,
        bytes: Buffer.byteLength(body),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        id,
        kind: node.kind,
        format: "error",
        contentType: "text/plain; charset=utf-8",
        language: null,
        body: message,
        truncated: false,
        bytes: Buffer.byteLength(message),
        error: message,
      };
    }
  };

  // --- mutations (user layer)
  const ensureNodeExistsForEdge = (id: string): GraphNode | null => {
    if (getCombinedStore().hasNode(id)) return null;
    userStore.upsertNode({
      id,
      kind: "placeholder",
      label: id,
      external: true,
      loadedByDefault: false,
      layer: "user",
      data: { note: "created as edge endpoint" },
    });
    return userStore.getNode(id) ?? null;
  };

  const upsertUserNode = async (input: {
    id: string;
    kind?: string;
    label?: string;
    external?: boolean;
    loadedByDefault?: boolean;
    data?: Record<string, unknown>;
  }) => {
    const prev = userStore.getNode(input.id);

    // If this node already exists in the derived layers (local/web), and the caller is
    // *only* patching data, we treat it as an overlay patch rather than an override.
    const base = localStore.getNode(input.id) ?? webStore.getNode(input.id) ?? null;
    const isOverlayPatch =
      !!base &&
      input.kind === undefined &&
      input.label === undefined &&
      input.external === undefined &&
      input.loadedByDefault === undefined;

    const node: GraphNode = {
      id: input.id,
      kind: input.kind ?? prev?.kind ?? base?.kind ?? "user",
      label: input.label ?? prev?.label ?? base?.label ?? input.id,
      external: input.external ?? prev?.external ?? base?.external ?? false,
      loadedByDefault: input.loadedByDefault ?? prev?.loadedByDefault ?? base?.loadedByDefault ?? true,
      layer: isOverlayPatch ? base?.layer : "user",
      data: input.data ?? undefined,
    };
    userStore.upsertNode(node);
    const stored = userStore.getNode(node.id)!;
    if (mongoGraph) {
      await mongoGraph.upsertNode("user", stored);
    } else {
      const pos = posFromData(stored.data);
      if (pos) {
        await upsertOpenPlannerGraphLayout({
          openPlannerBaseUrl,
          openPlannerApiKey,
          source: "graph-weaver",
          layoutVersion: "v1",
          inputs: [{ id: stored.id, x: pos.x, y: pos.y }],
        });
      }
    }
    markDirty();
    return stored;
  };

  const layoutUpsertPositions = async (inputs: Array<{ id: string; x: number; y: number }>): Promise<number> => {
    let updated = 0;
    const touched: GraphNode[] = [];

    for (const row of inputs) {
      const id = String(row?.id || "").trim();
      if (!id) continue;

      const x = Number((row as any).x);
      const y = Number((row as any).y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

      const base = localStore.getNode(id) ?? webStore.getNode(id) ?? null;
      const prev = userStore.getNode(id);

      const kind = base?.kind ?? prev?.kind ?? "user";
      const label = base?.label ?? prev?.label ?? id;
      const external = base?.external ?? prev?.external ?? (id.startsWith("url:") || id.startsWith("dep:"));
      const loadedByDefault = base?.loadedByDefault ?? prev?.loadedByDefault ?? true;
      const layer = base?.layer ?? prev?.layer ?? "user";

      userStore.upsertNode({
        id,
        kind,
        label,
        external,
        loadedByDefault,
        layer,
        data: { pos: { x, y } },
      });
      const stored = userStore.getNode(id);
      if (stored) touched.push(stored);
      updated += 1;
    }

    if (updated > 0) {
      scheduleUserNodeFlush(touched);
      markDirty();
    }
    return updated;
  };

  const upsertUserEdge = async (input: {
    id: string;
    source: string;
    target: string;
    kind?: string;
    data?: Record<string, unknown>;
  }) => {
    const createdA = ensureNodeExistsForEdge(input.source);
    const createdB = ensureNodeExistsForEdge(input.target);

    const prev = userStore.getEdge(input.id);
    const edge: GraphEdge = {
      id: input.id,
      source: input.source,
      target: input.target,
      kind: input.kind ?? prev?.kind ?? "user",
      layer: "user",
      data: input.data ?? undefined,
    };
    userStore.upsertEdge(edge);
    const writes: Promise<void>[] = [];
    const touchedNodes = [createdA, createdB].filter((node): node is GraphNode => !!node);
    if (mongoGraph) {
      if (touchedNodes.length > 0) writes.push(mongoGraph.bulkUpsertNodes("user", touchedNodes));
      writes.push(mongoGraph.upsertEdge("user", userStore.getEdge(edge.id)!));
    }
    await Promise.all(writes);
    markDirty();
    return userStore.getEdge(edge.id)!;
  };

  const upsertPresenceNode = async (input: {
    id: string;
    class: string;
    label?: string;
    resourceKind?: string;
    saturation?: number;
    emissionThreshold?: number;
    refractoryMs?: number;
    lastEmissionAt?: string | null;
    archived?: boolean;
    data?: Record<string, unknown>;
  }) => {
    const id = String(input.id || "").trim();
    if (!id) throw new Error("presence id is required");
    const presenceClass = String(input.class || "transient").trim().toLowerCase();
    if (!presenceClass) throw new Error("presence class is required");

    const prev = userStore.getNode(id);
    const prevData = dataObject(prev?.data);
    const data = {
      ...prevData,
      ...(input.data ?? {}),
      presence_class: presenceClass,
      resource_kind: input.resourceKind ?? prevData.resource_kind ?? null,
      saturation: clamp(numberOr(input.saturation, numberOr(prevData.saturation, 0)), 0, 1_000_000),
      emission_threshold: Math.max(0, numberOr(input.emissionThreshold, numberOr(prevData.emission_threshold, 1))),
      refractory_ms: Math.max(0, Math.floor(numberOr(input.refractoryMs, numberOr(prevData.refractory_ms, 1000)))),
      last_emission_at: input.lastEmissionAt ?? prevData.last_emission_at ?? null,
      archived: input.archived ?? prevData.archived === true,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>;

    const node: GraphNode = {
      id,
      kind: "presence",
      label: input.label ?? prev?.label ?? id,
      external: false,
      loadedByDefault: true,
      layer: "presence",
      data,
    };
    userStore.upsertNode(node);
    const stored = userStore.getNode(id)!;
    if (mongoGraph) {
      await mongoGraph.upsertNode("user", stored);
    }
    markDirty();
    return stored;
  };

  const reinforceSemanticEdge = async (input: {
    source: string;
    target: string;
    similarity: number;
    daimoiId?: string;
    reinforcement?: number;
    decayHalfLifeMs?: number;
    now?: string;
    data?: Record<string, unknown>;
  }) => {
    const source = String(input.source || "").trim();
    const target = String(input.target || "").trim();
    if (!source || !target) throw new Error("semantic edge source and target are required");
    if (source === target) throw new Error("semantic edge endpoints must differ");
    const similarity = Number(input.similarity);
    if (!Number.isFinite(similarity) || similarity < -1 || similarity > 1) {
      throw new Error("semantic edge similarity must be a cosine score in [-1, 1]");
    }

    const createdA = ensureNodeExistsForEdge(source);
    const createdB = ensureNodeExistsForEdge(target);
    const id = semanticEdgeId(source, target);
    const now = input.now ? new Date(input.now) : new Date();
    if (Number.isNaN(now.getTime())) throw new Error("semantic edge now must be an ISO timestamp");

    const prev = userStore.getEdge(id) ?? getCombinedStore().getEdge(id);
    const prevData = dataObject(prev?.data);
    const reinforcement = Math.max(0, numberOr(input.reinforcement, 1));
    const priorConductance = Math.max(0, numberOr(prevData.conductance, Math.max(0, numberOr(prevData.similarity, 0))));
    const conductance = priorConductance + semanticConductance(similarity, reinforcement);
    const data = {
      ...prevData,
      ...(input.data ?? {}),
      semantic_edge_model: "transient_circuit_v1",
      similarity,
      conductance,
      resistance: conductance > 0 ? 1 / conductance : 1_000_000_000,
      status: "active",
      transient: true,
      daimoi_ids: [...new Set([...(Array.isArray(prevData.daimoi_ids) ? prevData.daimoi_ids.map(String) : []), ...(input.daimoiId ? [input.daimoiId] : [])])],
      reinforcement_count: Math.max(0, Math.floor(numberOr(prevData.reinforcement_count, 0))) + 1,
      last_reinforced_at: now.toISOString(),
      decay_half_life_ms: Math.max(1, Math.floor(numberOr(input.decayHalfLifeMs, numberOr(prevData.decay_half_life_ms, 60 * 60 * 1000)))),
      updated_at: now.toISOString(),
      created_at: prevData.created_at ?? now.toISOString(),
    } as Record<string, unknown>;

    const edge: GraphEdge = {
      id,
      source,
      target,
      kind: "semantic_similarity",
      layer: "semantic",
      data,
    };
    userStore.upsertEdge(edge);
    const writes: Promise<void>[] = [];
    const touchedNodes = [createdA, createdB].filter((node): node is GraphNode => !!node);
    if (mongoGraph) {
      if (touchedNodes.length > 0) writes.push(mongoGraph.bulkUpsertNodes("user", touchedNodes));
      writes.push(mongoGraph.upsertEdge("user", userStore.getEdge(edge.id)!));
    }
    await Promise.all(writes);
    markDirty();
    return userStore.getEdge(edge.id)!;
  };

  const decaySemanticEdges = async (input: { now?: string; breakBelow?: number; pruneBelow?: number }) => {
    const now = input.now ? new Date(input.now) : new Date();
    if (Number.isNaN(now.getTime())) throw new Error("semantic edge decay timestamp must be ISO");
    const breakBelow = Math.max(0, numberOr(input.breakBelow, 0.05));
    const pruneBelow = Math.max(0, numberOr(input.pruneBelow, 0.005));
    let checked = 0;
    let weakened = 0;
    let broken = 0;
    let pruned = 0;
    const changedEdges: GraphEdge[] = [];

    for (const edge of [...userStore.edges()]) {
      if (edge.kind !== "semantic_similarity" && edge.layer !== "semantic") continue;
      const data = semanticEdgeDecayedData(edge, now);
      if (!Number.isFinite(Number(data.similarity))) continue;
      checked += 1;
      const conductance = Math.max(0, numberOr(data.conductance, 0));
      if (conductance <= pruneBelow) {
        if (userStore.removeEdge(edge.id)) {
          pruned += 1;
          if (mongoGraph) await mongoGraph.removeEdge("user", edge.id);
        }
        continue;
      }
      weakened += 1;
      if (conductance <= breakBelow) {
        data.status = "broken";
        broken += 1;
      }
      const next: GraphEdge = {
        ...edge,
        data: {
          ...data,
          resistance: conductance > 0 ? 1 / conductance : 1_000_000_000,
        },
      };
      userStore.upsertEdge(next);
      changedEdges.push(userStore.getEdge(next.id)!);
    }

    if (mongoGraph && changedEdges.length > 0) {
      await mongoGraph.bulkUpsertEdges("user", changedEdges);
    }
    if (weakened > 0 || pruned > 0) markDirty();
    return { checked, weakened, broken, pruned };
  };

  const removeUserNode = async (id: string): Promise<boolean> => {
    const ok = userStore.removeNode(id);
    if (ok && mongoGraph) {
      await mongoGraph.removeNode("user", id);
      markDirty();
    } else if (ok) {
      markDirty();
    }
    return ok;
  };

  const removeUserEdge = async (id: string): Promise<boolean> => {
    const ok = userStore.removeEdge(id);
    if (ok && mongoGraph) {
      await mongoGraph.removeEdge("user", id);
      markDirty();
    } else if (ok) {
      markDirty();
    }
    return ok;
  };

  const seedUrls = (urls: string[]) => {
    weaver?.seed(urls);
    markDirty();
  };

  const rescanNow = async () => {
    await rebuildLocal();
    weaver?.seed(lastSeeds);
    markDirty();
  };

  const listDaimoiSnapshots = async (filter: {
    limit: number;
    minActivation?: number;
    query?: string;
    lookbackSeconds?: number;
  }) => {
    return await daimoiAuditMongo.listDaimoiTrailSnapshots(filter);
  };

  const listSemanticFieldOverlay = async (filter: {
    fieldProfile?: string;
    project?: string;
    cellLimit: number;
    sampleLimit: number;
  }): Promise<{ cells: SemanticFieldCell[]; samples: SemanticFieldSample[] }> => {
    return await daimoiAuditMongo.listSemanticFieldOverlay(filter);
  };

  const updateConfig = async (patch: ConfigPatch) => {
    const prev = config;
    config = applyConfigPatch(config, patch);
    scheduleSaveConfig();

    const weaverChanged = !deepEqualJson(prev.weaver, config.weaver);
    if (weaverChanged) {
      startWeaver();
    }

    const scanChanged = !deepEqualJson(prev.scan, config.scan);
    if (scanChanged) {
      resetRescanTimer();
    }

    markDirty();
    return config;
  };

  const adminToken = String(process.env.GRAPH_WEAVER_ADMIN_TOKEN || "").trim() || null;

  const graphqlHandler = createGraphQLHandler({
    adminToken,
    getConfig: () => config,
    updateConfig,
    getStatus,
    getGraphView: (opts) => buildGraphView(opts),
    getFocusedGraphView: (opts) => buildFocusedGraphView(opts),
    getNode: (id) => getNode(id),
    getEdge: (id) => getEdge(id),
    listEdges,
    neighbors,
    searchNodes,
    listPresenceNodes,
    listSemanticEdges,
    listDaimoiSnapshots,
    listSemanticFieldOverlay,
    nodePreview,
    rescanNow,
    seedUrls,
    upsertUserNode,
    upsertUserEdge,
    upsertPresenceNode,
    reinforceSemanticEdge,
    decaySemanticEdges,
    removeUserNode,
    removeUserEdge,
    layoutUpsertPositions,
  });

  const semanticDecayTimer = setInterval(() => {
    void decaySemanticEdges({
      breakBelow: semanticDecayBreakBelow,
      pruneBelow: semanticDecayPruneBelow,
    }).then((result) => {
      if (result.checked > 0 && (result.weakened > 0 || result.pruned > 0)) {
        console.log(`[devel-graph-weaver] semantic decay checked=${result.checked} weakened=${result.weakened} broken=${result.broken} pruned=${result.pruned}`);
      }
    }).catch((error) => {
      console.error("[devel-graph-weaver] semantic decay failed", error);
    });
  }, semanticDecayIntervalMs);

  // --- HTTP server
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = url.pathname;

    if (pathname === "/graphql") {
      await graphqlHandler(req, res);
      return;
    }

    if (pathname === "/api/status") {
      json(res, 200, getStatus());
      return;
    }

    if (pathname === "/api/graph") {
      json(res, 200, buildGraphView());
      return;
    }

    if (pathname === "/api/layout/upsert") {
      res.setHeader("access-control-allow-origin", "*");
      res.setHeader("access-control-allow-methods", "POST,OPTIONS");
      res.setHeader("access-control-allow-headers", "content-type,authorization");
      if (req.method === "OPTIONS") {
        res.statusCode = 204;
        res.end();
        return;
      }
      if (req.method !== "POST") {
        json(res, 405, { error: "method not allowed" });
        return;
      }
      if (adminToken && getBearer(req.headers) !== adminToken) {
        json(res, 401, { error: "unauthorized" });
        return;
      }

      try {
        const body = await readBody(req);
        const parsed = JSON.parse(body) as { inputs?: Array<{ id?: string; x?: number; y?: number }> };
        const inputs = Array.isArray(parsed.inputs) ? parsed.inputs : [];
        const updated = await layoutUpsertPositions(inputs.map((row) => ({
          id: String(row?.id ?? ""),
          x: Number(row?.x ?? 0),
          y: Number(row?.y ?? 0),
        })));
        json(res, 200, { ok: true, updated });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        json(res, 400, { error: message });
      }
      return;
    }

    if (pathname.startsWith("/vendor/webgl-graph-view/")) {
      const rest = pathname.slice("/vendor/webgl-graph-view/".length);
      const filePath = path.join(vendorWebglDist, rest);
      await serveFile(res, filePath);
      return;
    }

    // static public
    if (pathname === "/") {
      await serveFile(res, path.join(publicDir, "index.html"));
      return;
    }
    if (pathname === "/graphiql") {
      await serveFile(res, path.join(publicDir, "graphiql.html"));
      return;
    }
    if (pathname === "/app.js" || pathname === "/style.css") {
      await serveFile(res, path.join(publicDir, pathname.slice(1)));
      return;
    }

    notFound(res);
  });

  // --- WebSocket "changed" notifications
  const wss = new WebSocketServer({ noServer: true });
  server.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (url.pathname !== "/ws") {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (ws) => {
    const push = () => {
      try {
        ws.send("changed");
      } catch {
        // ignore
      }
    };
    broadcast.add(push);
    ws.on("close", () => broadcast.delete(push));
    ws.on("error", () => broadcast.delete(push));
  });

  const shutdown = (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`[devel-graph-weaver] shutting down on ${signal}`);
    if (userNodeFlushTimer) clearTimeout(userNodeFlushTimer);
    if (pendingUserNodeFlush.size > 0) {
      void flushUserNodeWrites().catch(() => {});
    }
    if (mongoGraph) {
      void mongoGraph.close().catch(() => {});
    } else {
      void daimoiAuditMongo.close().catch(() => {});
    }
    if (rescanTimer) clearInterval(rescanTimer);
    if (semanticDecayTimer) clearInterval(semanticDecayTimer);
    try {
      wss.close();
    } catch {
      // ignore
    }
    server.close();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  server.listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(`[devel-graph-weaver] http://${host}:${port} repo=${repoRoot}`);
    // eslint-disable-next-line no-console
    console.log(`[devel-graph-weaver] graphql http://${host}:${port}/graphql · graphiql http://${host}:${port}/graphiql`);
    // eslint-disable-next-line no-console
    console.log(`[devel-graph-weaver] stateDir ${stateDir}`);
    // eslint-disable-next-line no-console
    if (mongoGraph) {
      console.log(`[devel-graph-weaver] mongo ${String(process.env.MONGODB_URI || "mongodb://mongodb:27017").trim()} db=${String(process.env.MONGODB_DB || "devel_graph_weaver").trim()}`);
    } else {
      console.log(`[devel-graph-weaver] persistence ${graphPersistenceMode} -> ${openPlannerBaseUrl || "(missing OPENPLANNER_BASE_URL)"}`);
    }
    // eslint-disable-next-line no-console
    console.log(`[devel-graph-weaver] local source ${localSourceMode} · web layer ${includeWebLayer ? "included" : "excluded"}`);
    // eslint-disable-next-line no-console
    console.log(`[devel-graph-weaver] web crawl ${webCrawlEnabled ? "enabled" : "disabled"}`);
  });
}

void main();

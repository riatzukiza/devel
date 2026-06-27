import type { GraphStoreBackpressureState, MyrmexDiscoveredLink, MyrmexPageEvent } from "./types.js";
import { createHash } from "node:crypto";

export interface GraphStoreConfig {
  openPlannerBaseUrl?: string;
  openPlannerApiKey?: string;
  proxxBaseUrl?: string;
  authToken?: string;
  project?: string;
  source?: string;
  openPlannerMaxEventsPerWrite?: number;
  openPlannerHealthTimeoutMs?: number;
  openPlannerWriteTimeoutMs?: number;
  openPlannerHealthPollMs?: number;
  openPlannerBackoffBaseMs?: number;
  openPlannerBackoffMaxMs?: number;
}

type HealthResult = {
  ok: boolean;
  reason?: string;
};

const TRANSIENT_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

export class GraphStore {
  private readonly config: GraphStoreConfig;
  private backpressureUntilMs = 0;
  private failureStreak = 0;
  private lastReason = "";
  private lastSuccessAt = 0;

  constructor(config: GraphStoreConfig) {
    const hasOpenPlannerBackend = Boolean((config.openPlannerBaseUrl ?? "").trim() && (config.openPlannerApiKey ?? "").trim());
    const hasProxxBackend = Boolean((config.proxxBaseUrl ?? "").trim() && (config.authToken ?? "").trim());
    if (!hasOpenPlannerBackend && !hasProxxBackend) {
      throw new Error("GraphStore requires OPENPLANNER_BASE_URL + OPENPLANNER_API_KEY or PROXX_BASE_URL + PROXX_AUTH_TOKEN");
    }
    this.config = config;
  }

  status(): GraphStoreBackpressureState {
    const now = Date.now();
    const waitMs = Math.max(0, this.backpressureUntilMs - now);
    return {
      active: waitMs > 0 || this.failureStreak > 0,
      untilMs: this.backpressureUntilMs,
      waitMs,
      streak: this.failureStreak,
      reason: this.lastReason || undefined,
      lastSuccessAt: this.lastSuccessAt || undefined,
    };
  }

  async storePage(event: MyrmexPageEvent, discoveredLinks: MyrmexDiscoveredLink[]): Promise<void> {
    const ts = new Date(event.fetchedAt).toISOString();
    const sourceUrl = normalizeUrl(event.url);
    const sourceNodeId = webNodeId(sourceUrl);
    const events: Array<Record<string, unknown>> = [];
    const seenEventIds = new Set<string>();

    const push = (row: Record<string, unknown>) => {
      const id = String(row.id || "");
      if (!id || seenEventIds.has(id)) return;
      seenEventIds.add(id);
      events.push(row);
    };

    push(this.buildVisitedNodeEvent(event, sourceUrl, sourceNodeId, ts));

    for (const link of discoveredLinks) {
      const targetUrl = normalizeUrl(link.url);
      if (!targetUrl) continue;
      const targetNodeId = webNodeId(targetUrl);
      if (targetNodeId === sourceNodeId) continue;
      if (link.edgeType === "visited_to_unvisited") {
        push(this.buildDiscoveredNodeEvent(targetUrl, sourceUrl, ts));
      }
      push(this.buildEdgeEvent(sourceUrl, targetUrl, sourceNodeId, targetNodeId, link, ts));
    }

    for (const batch of chunkEvents(events, this.maxEventsPerWrite())) {
      await this.post(this.eventsPath(), { events: batch });
    }
  }

  async storeNode(event: MyrmexPageEvent): Promise<void> {
    const ts = new Date(event.fetchedAt).toISOString();
    const url = normalizeUrl(event.url);
    const nodeId = webNodeId(url);
    const body = { events: [this.buildVisitedNodeEvent(event, url, nodeId, ts)] };
    await this.post(this.eventsPath(), body);
  }

  async storeDiscoveredNode(url: string, discoveredFrom: string): Promise<void> {
    const normalizedUrl = normalizeUrl(url);
    const ts = new Date().toISOString();
    const body = { events: [this.buildDiscoveredNodeEvent(normalizedUrl, discoveredFrom, ts)] };
    await this.post(this.eventsPath(), body);
  }

  async storeEdge(source: string, target: string, edgeType: string): Promise<void> {
    const sourceUrl = normalizeUrl(source);
    const targetUrl = normalizeUrl(target);
    const sourceNodeId = webNodeId(sourceUrl);
    const targetNodeId = webNodeId(targetUrl);
    const ts = new Date().toISOString();
    const body = { events: [this.buildEdgeEvent(sourceUrl, targetUrl, sourceNodeId, targetNodeId, { url: targetUrl, edgeType }, ts)] };
    await this.post(this.eventsPath(), body);
  }

  private buildVisitedNodeEvent(event: MyrmexPageEvent, url: string, nodeId: string, ts: string): Record<string, unknown> {
    return {
      schema: "openplanner.event.v1" as const,
      id: graphNodeEventId(nodeId),
      ts,
      source: this.sourceName(),
      kind: "graph.node",
      source_ref: {
        project: this.projectName(),
        session: safeHost(url),
        message: nodeId,
      },
      text: event.content,
      meta: {
        author: "myrmex",
        tags: ["graph", this.projectName(), "visited"],
      },
      extra: {
        lake: this.projectName(),
        node_id: nodeId,
        node_type: "visited",
        node_kind: "url",
        label: event.title || url,
        entity_key: nodeId,
        url,
        title: event.title,
        preview: summarizePreview(event.content),
        visit_status: "visited",
        contentHash: event.contentHash,
        metadata: event.metadata,
        discoveredAt: ts,
        lastVisitedAt: ts,
        visitCount: 1,
        pheromone: 0.5,
        outgoingCount: event.outgoing.length,
      },
    };
  }

  private buildDiscoveredNodeEvent(url: string, discoveredFrom: string, ts: string): Record<string, unknown> {
    const nodeId = webNodeId(url);
    return {
      schema: "openplanner.event.v1" as const,
      id: graphNodeEventId(nodeId),
      ts,
      source: this.sourceName(),
      kind: "graph.node",
      source_ref: {
        project: this.projectName(),
        session: safeHost(url),
        message: nodeId,
      },
      meta: {
        author: "myrmex",
        tags: ["graph", this.projectName(), "unvisited"],
      },
      extra: {
        lake: this.projectName(),
        node_id: nodeId,
        node_type: "unvisited",
        node_kind: "url",
        label: url,
        entity_key: nodeId,
        url,
        visit_status: "unvisited",
        discoveredAt: ts,
        discoveredFrom,
      },
    };
  }

  private buildEdgeEvent(
    sourceUrl: string,
    targetUrl: string,
    sourceNodeId: string,
    targetNodeId: string,
    link: MyrmexDiscoveredLink,
    ts: string,
  ): Record<string, unknown> {
    const edgeType = link.edgeType;
    const edgeId = graphEdgeEventId(sourceNodeId, targetNodeId);
    return {
      schema: "openplanner.event.v1" as const,
      id: edgeId,
      ts,
      source: this.sourceName(),
      kind: "graph.edge",
      source_ref: {
        project: this.projectName(),
        session: safeHost(sourceUrl),
        message: edgeId,
      },
      text: [link.anchorText, link.anchorContext, `${sourceUrl} -> ${targetUrl}`].filter(Boolean).join(" · "),
      meta: {
        author: "myrmex",
        tags: ["graph", this.projectName(), edgeType],
      },
      extra: {
        lake: this.projectName(),
        edge_id: edgeId,
        edge_type: edgeType,
        source_node_id: sourceNodeId,
        target_node_id: targetNodeId,
        source_lake: this.projectName(),
        target_lake: this.projectName(),
        source: sourceUrl,
        target: targetUrl,
        source_host: safeHost(sourceUrl),
        target_host: safeHost(targetUrl),
        discovery_channel: link.discoveryChannel ?? "page",
        anchor_text: link.anchorText ?? null,
        anchor_context: link.anchorContext ?? null,
        link_rel: link.rel ?? null,
        dom_path: link.domPath ?? null,
        block_signature: link.blockSignature ?? null,
        block_role: link.blockRole ?? null,
        discoveredAt: ts,
      },
    };
  }

  private async post(path: string, body: unknown): Promise<void> {
    const baseUrl = this.baseUrl();
    const authToken = this.authToken();
    if (!baseUrl) {
      throw new Error("GraphStore requires OPENPLANNER_BASE_URL or PROXX_BASE_URL");
    }

    let attempt = 0;
    while (true) {
      attempt += 1;
      await this.waitForWritable();

      try {
        const response = await this.fetchWithTimeout(baseUrl + path, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(body),
        }, this.postTimeoutMs());

        if (response.ok) {
          this.noteSuccess();
          return;
        }

        const text = clipText(await response.text().catch(() => ""));
        if (this.isTransientResponse(response.status, text)) {
          this.noteFailure(`write ${response.status}: ${text || "transient upstream failure"}`, attempt);
          await this.waitForWritable();
          continue;
        }

        throw new Error(`graph store write failed ${response.status}: ${text}`);
      } catch (error) {
        if (!isTransientError(error)) {
          throw error instanceof Error ? error : new Error(String(error));
        }
        this.noteFailure(`write transport error: ${toErrorMessage(error)}`, attempt);
        await this.waitForWritable();
      }
    }
  }

  private async waitForWritable(): Promise<void> {
    if (!this.hasOpenPlannerHealth()) {
      const waitMs = this.backpressureUntilMs - Date.now();
      if (waitMs > 0) {
        await sleep(waitMs);
      }
      return;
    }

    while (this.failureStreak > 0) {
      const waitMs = this.backpressureUntilMs - Date.now();
      if (waitMs > 0) {
        await sleep(Math.min(waitMs, this.healthPollMs()));
        continue;
      }

      const health = await this.checkOpenPlannerHealth();
      if (health.ok) {
        console.warn("[myrmex] OpenPlanner recovered; resuming graph writes");
        this.noteSuccess();
        return;
      }

      this.noteFailure(`health check failed: ${health.reason ?? "unknown reason"}`);
    }
  }

  private async checkOpenPlannerHealth(): Promise<HealthResult> {
    const baseUrl = (this.config.openPlannerBaseUrl ?? "").replace(/\/+$/, "");
    if (!baseUrl) return { ok: true };

    try {
      const response = await this.fetchWithTimeout(`${baseUrl}/v1/health`, {
        method: "GET",
        headers: {
          authorization: `Bearer ${this.authToken()}`,
        },
      }, this.healthTimeoutMs());

      if (response.ok) {
        return { ok: true };
      }

      const text = clipText(await response.text().catch(() => ""));
      return { ok: false, reason: `health ${response.status}: ${text}` };
    } catch (error) {
      return { ok: false, reason: `health transport error: ${toErrorMessage(error)}` };
    }
  }

  private noteSuccess(): void {
    this.backpressureUntilMs = 0;
    this.failureStreak = 0;
    this.lastReason = "";
    this.lastSuccessAt = Date.now();
  }

  private noteFailure(reason: string, attempt?: number): void {
    this.failureStreak += 1;
    this.lastReason = reason;
    const backoffMs = Math.min(this.backoffMaxMs(), this.backoffBaseMs() * 2 ** Math.max(0, this.failureStreak - 1));
    this.backpressureUntilMs = Date.now() + backoffMs;
    const attemptLabel = attempt ? ` attempt=${attempt}` : "";
    console.warn(`[myrmex] OpenPlanner backpressure engaged:${attemptLabel} wait=${backoffMs}ms streak=${this.failureStreak} reason=${reason}`);
  }

  private async fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  private isTransientResponse(status: number, bodyText: string): boolean {
    if (TRANSIENT_STATUSES.has(status)) return true;
    const text = bodyText.toLowerCase();
    return (
      text.includes("embedding_upstream_unavailable") ||
      text.includes("embedding_index_failed") ||
      text.includes("headers timeout") ||
      text.includes("timed out") ||
      text.includes("fetch failed")
    );
  }

  private hasOpenPlannerHealth(): boolean {
    return Boolean((this.config.openPlannerBaseUrl ?? "").trim());
  }

  private healthTimeoutMs(): number {
    return Math.max(1000, this.config.openPlannerHealthTimeoutMs ?? 5000);
  }

  private healthPollMs(): number {
    return Math.max(250, this.config.openPlannerHealthPollMs ?? 2000);
  }

  private backoffBaseMs(): number {
    return Math.max(250, this.config.openPlannerBackoffBaseMs ?? 2000);
  }

  private backoffMaxMs(): number {
    return Math.max(this.backoffBaseMs(), this.config.openPlannerBackoffMaxMs ?? 60000);
  }

  private postTimeoutMs(): number {
    return Math.max(5000, this.config.openPlannerWriteTimeoutMs ?? 60000);
  }

  private maxEventsPerWrite(): number {
    return Math.max(1, this.config.openPlannerMaxEventsPerWrite ?? 128);
  }

  private baseUrl(): string {
    const openPlannerBaseUrl = (this.config.openPlannerBaseUrl ?? "").replace(/\/+$/, "");
    if (openPlannerBaseUrl && (this.config.openPlannerApiKey ?? "").trim()) return openPlannerBaseUrl;
    const proxxBaseUrl = (this.config.proxxBaseUrl ?? "").replace(/\/+$/, "");
    if (proxxBaseUrl && (this.config.authToken ?? "").trim()) return proxxBaseUrl;
    throw new Error("GraphStore requires a configured backend URL");
  }

  private authToken(): string {
    const openPlannerApiKey = (this.config.openPlannerApiKey ?? "").trim();
    if (openPlannerApiKey) return openPlannerApiKey;
    const authToken = (this.config.authToken ?? "").trim();
    if (authToken) return authToken;
    throw new Error("GraphStore requires a configured backend auth token");
  }

  private eventsPath(): string {
    return this.hasOpenPlannerHealth() ? "/v1/events" : "/api/v1/lake/events";
  }

  private projectName(): string {
    return this.config.project ?? "web";
  }

  private sourceName(): string {
    return this.config.source ?? "myrmex";
  }
}

function stableHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function safeHost(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return "graph";
  }
}

function normalizeUrl(value: string): string {
  const raw = String(value ?? "").trim();
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    url.hash = "";
    if (!url.pathname) url.pathname = "/";
    return url.toString();
  } catch {
    return raw;
  }
}

function webNodeId(url: string): string {
  return `web:url:${url}`;
}

function graphNodeEventId(nodeId: string): string {
  return `graph.node:${stableHash(nodeId)}`;
}

function graphEdgeEventId(sourceNodeId: string, targetNodeId: string): string {
  return `graph.edge:${stableHash(`${sourceNodeId}\n${targetNodeId}`)}`;
}

function summarizePreview(value: string, maxChars = 400): string {
  const compact = String(value ?? "").replace(/\s+/g, " ").trim();
  if (compact.length <= maxChars) return compact;
  return compact.slice(0, maxChars);
}

function clipText(value: string, maxChars = 600): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}…`;
}

function isTransientError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();
  return (
    name.includes("abort") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("socket")
  );
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunkEvents<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

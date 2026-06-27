import type { MyrmexConfig, MyrmexDiscoveredLink, MyrmexEvent, MyrmexHeartbeatSnapshot, MyrmexPageEvent, MyrmexStats } from "./types.js";
import type { FetchBackend } from "./fetch-backend.js";
import { ShuvCrawlClient } from "./shuvcrawl-client.js";
import { ShuvCrawlFetchBackend } from "./shuvcrawl-backend.js";
import { GraphStore } from "./graph-store.js";
import { CheckpointManager } from "./checkpoint.js";

type WeaverInstance = {
  seed: (urls: string[]) => void;
  start: () => void;
  stop: () => void;
  stats: () => { frontier: number; inFlight: number; pacingMultiplier?: number; dispatchIntervalMs?: number };
  onEvent: (cb: (ev: WeaverEvent) => void) => () => void;
  setPacingMultiplier?: (multiplier: number) => void;
  getPacingMultiplier?: () => number;
};

type WeaverEvent = {
  type: string;
  url: string;
  status?: number;
  contentType?: string;
  fetchedAt: number;
  outgoing?: string[];
  outgoingLinks?: Array<{
    url: string;
    source?: "page" | "sitemap" | "feed";
    text?: string | null;
    rel?: string | null;
    context?: string | null;
    domPath?: string | null;
    blockSignature?: string | null;
    blockRole?: string | null;
  }>;
  content?: string;
  title?: string;
  metadata?: Record<string, unknown>;
  message?: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

class MyrmexHeartbeat {
  private readonly recentPages: number[] = [];
  private readonly recentErrors: number[] = [];
  private activityScore = 0;
  private frontierPressure = 0;
  private queuePressure = 0;
  private errorPressure = 0;
  private churnScore = 0;
  private pacingMultiplier = 1;
  private state: MyrmexHeartbeatSnapshot["state"] = "resting";

  notePage(timestamp: number): void {
    this.recentPages.push(timestamp);
  }

  noteError(timestamp: number): void {
    this.recentErrors.push(timestamp);
  }

  update(input: {
    now: number;
    baseDispatchIntervalMs: number;
    frontierSize: number;
    maxFrontier: number;
    inFlight: number;
    maxConcurrency: number;
    pendingGraphWrites: number;
    maxPendingWrites: number;
    backpressureActive: boolean;
  }): MyrmexHeartbeatSnapshot {
    const pageWindowMs = 2 * 60_000;
    const errorWindowMs = 5 * 60_000;
    while (this.recentPages.length > 0 && input.now - this.recentPages[0]! > pageWindowMs) this.recentPages.shift();
    while (this.recentErrors.length > 0 && input.now - this.recentErrors[0]! > errorWindowMs) this.recentErrors.shift();

    const pageRate = clamp(this.recentPages.length / 24, 0, 1);
    const inflightPressure = clamp(input.inFlight / Math.max(1, input.maxConcurrency), 0, 1);
    const frontierPressure = clamp(input.frontierSize / Math.max(1, input.maxFrontier), 0, 1);
    const queuePressure = clamp(input.pendingGraphWrites / Math.max(1, input.maxPendingWrites), 0, 1);
    const errorPressure = clamp(this.recentErrors.length / 8, 0, 1);
    const backpressure = input.backpressureActive ? 1 : 0;

    const targetActivity = clamp((pageRate * 0.6) + (inflightPressure * 0.4), 0, 1);
    const targetChurn = clamp((targetActivity * 0.45) + (frontierPressure * 0.35) + (queuePressure * 0.2), 0, 1);

    this.activityScore = (this.activityScore * 0.7) + (targetActivity * 0.3);
    this.frontierPressure = (this.frontierPressure * 0.8) + (frontierPressure * 0.2);
    this.queuePressure = (this.queuePressure * 0.65) + (queuePressure * 0.35);
    this.errorPressure = (this.errorPressure * 0.7) + (((errorPressure * 0.65) + (backpressure * 0.35)) * 0.3);
    this.churnScore = (this.churnScore * 0.72) + (targetChurn * 0.28);

    const strain = clamp(Math.max(this.queuePressure, this.errorPressure, backpressure), 0, 1);
    const drive = clamp((this.churnScore * (1 - strain * 0.75)) + (this.activityScore * 0.25), 0.05, 1);
    this.pacingMultiplier = clamp(2.8 - (drive * 2.4) + (strain * 2.2), 0.35, 4);

    if (strain >= 0.75) this.state = "strained";
    else if (drive >= 0.72) this.state = "surge";
    else if (drive >= 0.32) this.state = "working";
    else this.state = "resting";

    const suggestedDispatchIntervalMs = Math.max(250, Math.round(input.baseDispatchIntervalMs * this.pacingMultiplier));
    return {
      state: this.state,
      churnScore: round2(this.churnScore),
      activityScore: round2(this.activityScore),
      frontierPressure: round2(this.frontierPressure),
      queuePressure: round2(this.queuePressure),
      errorPressure: round2(this.errorPressure),
      pacingMultiplier: round2(this.pacingMultiplier),
      suggestedDispatchIntervalMs,
      statusLine: `state=${this.state} churn=${round2(this.churnScore)} activity=${round2(this.activityScore)} frontier=${round2(this.frontierPressure)} queue=${round2(this.queuePressure)} errors=${round2(this.errorPressure)} pace=x${round2(this.pacingMultiplier)} dispatch=${suggestedDispatchIntervalMs}ms`,
    };
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export class Myrmex {
  private readonly config: Required<MyrmexConfig>;
  private readonly shuvCrawl: ShuvCrawlClient;
  private weaver: WeaverInstance | null = null;
  private readonly graphStore: GraphStore;
  private readonly checkpoint: CheckpointManager;
  private readonly listeners = new Set<(ev: MyrmexEvent) => void>();
  private readonly pendingSeeds = new Set<string>();
  private readonly visitedUrls = new Set<string>();
  private readonly heartbeat = new MyrmexHeartbeat();
  private running = false;
  private paused = false;
  private pauseReason: string | null = null;
  private managedPauseKey: string | null = null;
  private pageCount = 0;
  private errorCount = 0;
  private lastCheckpointAt = 0;
  private graphWriteChain: Promise<void> = Promise.resolve();
  private pendingGraphWrites = 0;
  private flowControlTimer: NodeJS.Timeout | null = null;

  constructor(config: MyrmexConfig) {
    this.config = {
      ants: config.ants ?? 4,
      dispatchIntervalMs: config.dispatchIntervalMs ?? 15_000,
      maxDispatchBurst: config.maxDispatchBurst ?? Math.max(1, config.maxConcurrency ?? 2),
      maxFrontier: config.maxFrontier ?? 20_000,
      maxConcurrency: config.maxConcurrency ?? 2,
      perHostMinIntervalMs: config.perHostMinIntervalMs ?? 4_000,
      requestTimeoutMs: config.requestTimeoutMs ?? 15_000,
      revisitAfterMs: config.revisitAfterMs ?? 1000 * 60 * 60 * 8,
      alpha: config.alpha ?? 1.2,
      beta: config.beta ?? 3.0,
      evaporation: config.evaporation ?? 0.03,
      deposit: config.deposit ?? 0.35,
      hostBalanceExponent: config.hostBalanceExponent ?? 0.7,
      startupJitterMs: config.startupJitterMs ?? 750,
      shuvCrawlBaseUrl: config.shuvCrawlBaseUrl,
      shuvCrawlToken: config.shuvCrawlToken ?? "",
      proxxBaseUrl: config.proxxBaseUrl ?? "",
      proxxAuthToken: config.proxxAuthToken ?? "",
      openPlannerBaseUrl: config.openPlannerBaseUrl ?? "",
      openPlannerApiKey: config.openPlannerApiKey ?? "",
      project: config.project ?? "web",
      source: config.source ?? "myrmex",
      includePatterns: config.includePatterns ?? [],
      excludePatterns: config.excludePatterns ?? [],
      maxContentLength: config.maxContentLength ?? 500_000,
      allowedContentTypes: config.allowedContentTypes ?? ["text/html"],
      checkpointIntervalMs: config.checkpointIntervalMs ?? 60_000,
      graphStoreUrl: config.graphStoreUrl ?? "",
      openPlannerMaxPendingWrites: config.openPlannerMaxPendingWrites ?? 8,
      openPlannerResumePendingWrites: config.openPlannerResumePendingWrites ?? 2,
      openPlannerMaxEventsPerWrite: config.openPlannerMaxEventsPerWrite ?? 128,
      openPlannerHealthTimeoutMs: config.openPlannerHealthTimeoutMs ?? 5_000,
      openPlannerWriteTimeoutMs: config.openPlannerWriteTimeoutMs ?? 60_000,
      openPlannerHealthPollMs: config.openPlannerHealthPollMs ?? 2_000,
      openPlannerBackoffBaseMs: config.openPlannerBackoffBaseMs ?? 2_000,
      openPlannerBackoffMaxMs: config.openPlannerBackoffMaxMs ?? 60_000,
    };

    this.shuvCrawl = new ShuvCrawlClient({
      baseUrl: this.config.shuvCrawlBaseUrl,
      token: this.config.shuvCrawlToken || undefined,
    });

    this.graphStore = new GraphStore({
      openPlannerBaseUrl: this.config.openPlannerBaseUrl,
      openPlannerApiKey: this.config.openPlannerApiKey,
      proxxBaseUrl: this.config.proxxBaseUrl,
      authToken: this.config.proxxAuthToken,
      project: this.config.project,
      source: this.config.source,
      openPlannerMaxEventsPerWrite: this.config.openPlannerMaxEventsPerWrite,
      openPlannerHealthTimeoutMs: this.config.openPlannerHealthTimeoutMs,
      openPlannerWriteTimeoutMs: this.config.openPlannerWriteTimeoutMs,
      openPlannerHealthPollMs: this.config.openPlannerHealthPollMs,
      openPlannerBackoffBaseMs: this.config.openPlannerBackoffBaseMs,
      openPlannerBackoffMaxMs: this.config.openPlannerBackoffMaxMs,
    });

    this.checkpoint = new CheckpointManager({
      intervalMs: this.config.checkpointIntervalMs,
    });
  }

  seed(urls: string[]): void {
    for (const url of urls) {
      if (url) {
        this.pendingSeeds.add(url);
      }
    }
    if (this.weaver) {
      this.weaver.seed(urls);
    }
  }

  async start(): Promise<void> {
    if (this.running) return;
    if (!this.weaver) {
      this.weaver = await this.createWeaver();
    }
    this.running = true;
    this.ensureFlowControlLoop();
    this.updateFlowControl();
    if (!this.paused) {
      this.weaver.start();
    }
  }

  stop(): void {
    this.running = false;
    this.paused = false;
    this.pauseReason = null;
    this.managedPauseKey = null;
    if (this.flowControlTimer) {
      clearInterval(this.flowControlTimer);
      this.flowControlTimer = null;
    }
    if (this.weaver) {
      this.weaver.stop();
    }
  }

  pause(reason = "manual pause"): void {
    this.paused = true;
    this.pauseReason = reason;
    this.managedPauseKey = null;
    if (this.weaver) {
      this.weaver.stop();
    }
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.pauseReason = null;
    this.managedPauseKey = null;
    this.running = true;
    this.ensureFlowControlLoop();
    this.updateFlowControl();
    if (this.weaver) {
      if (!this.paused) {
        this.weaver.start();
      }
    }
  }

  stats(): MyrmexStats {
    const weaverStats = this.weaver?.stats() ?? { frontier: 0, inFlight: 0 };
    return {
      running: this.running,
      paused: this.paused,
      pauseReason: this.pauseReason ?? undefined,
      frontierSize: weaverStats.frontier,
      inFlight: weaverStats.inFlight,
      pageCount: this.pageCount,
      errorCount: this.errorCount,
      lastCheckpointAt: this.lastCheckpointAt,
      pendingGraphWrites: this.pendingGraphWrites,
      graphBackpressure: this.graphStore.status(),
      heartbeat: this.heartbeat.update({
        now: Date.now(),
        baseDispatchIntervalMs: this.config.dispatchIntervalMs,
        frontierSize: weaverStats.frontier,
        maxFrontier: this.config.maxFrontier,
        inFlight: weaverStats.inFlight,
        maxConcurrency: this.config.maxConcurrency,
        pendingGraphWrites: this.pendingGraphWrites + weaverStats.inFlight,
        maxPendingWrites: this.config.openPlannerMaxPendingWrites,
        backpressureActive: this.graphStore.status().active,
      }),
    };
  }

  async restoreCheckpoint(): Promise<void> {
    // Phase 3: load checkpoint from OpenPlanner or local file
  }

  onEvent(cb: (ev: MyrmexEvent) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private async createWeaver(): Promise<WeaverInstance> {
    const backend = new ShuvCrawlFetchBackend(this.shuvCrawl, {
      includePatterns: this.config.includePatterns,
      excludePatterns: this.config.excludePatterns,
    });
    const mod = await import("@workspace/graph-weaver-aco");
    const Ctor = mod.GraphWeaverAco as unknown as new (opts: {
      ants: number;
      dispatchIntervalMs: number;
      maxDispatchBurst: number;
      maxFrontier: number;
      maxConcurrency: number;
      perHostMinIntervalMs: number;
      requestTimeoutMs: number;
      revisitAfterMs: number;
      alpha: number;
      beta: number;
      evaporation: number;
      deposit: number;
      hostBalanceExponent: number;
      startupJitterMs: number;
      fetchBackend: FetchBackend;
    }) => WeaverInstance;

    const weaver = new Ctor({
      ants: this.config.ants,
      dispatchIntervalMs: this.config.dispatchIntervalMs,
      maxDispatchBurst: this.config.maxDispatchBurst,
      maxFrontier: this.config.maxFrontier,
      maxConcurrency: this.config.maxConcurrency,
      perHostMinIntervalMs: this.config.perHostMinIntervalMs,
      requestTimeoutMs: this.config.requestTimeoutMs,
      revisitAfterMs: this.config.revisitAfterMs,
      alpha: this.config.alpha,
      beta: this.config.beta,
      evaporation: this.config.evaporation,
      deposit: this.config.deposit,
      hostBalanceExponent: this.config.hostBalanceExponent,
      startupJitterMs: this.config.startupJitterMs,
      fetchBackend: backend,
    });

    this.wireEvents(weaver);
    const seeds = [...this.pendingSeeds];
    if (seeds.length > 0) {
      weaver.seed(seeds);
    }
    return weaver;
  }

  private wireEvents(weaver: WeaverInstance): void {
    weaver.onEvent((ev: WeaverEvent) => {
      if (ev.type === "page") {
        this.pageCount += 1;
        this.heartbeat.notePage(ev.fetchedAt);
        this.visitedUrls.add(ev.url);
        const discoveredLinks = this.normalizeDiscoveredLinks(ev);
        const myrmexEvent: MyrmexPageEvent = {
          type: "page",
          url: ev.url,
          title: ev.title ?? "",
          content: ev.content ?? "",
          contentHash: hashString(ev.content ?? ev.url),
          metadata: {
            ...(ev.metadata ?? {}),
            status: ev.status !== undefined && ev.status >= 200 && ev.status < 400 ? "success" : "partial",
          },
          outgoing: [...new Set(discoveredLinks.map((link) => link.url))],
          outgoingLinks: discoveredLinks,
          graphNodeId: `node:${ev.url}`,
          fetchedAt: ev.fetchedAt,
        };

        this.enqueueGraphWrite(myrmexEvent, discoveredLinks);
        this.emit(myrmexEvent);
        this.maybeCheckpoint();
      } else if (ev.type === "error") {
        this.errorCount += 1;
        this.heartbeat.noteError(ev.fetchedAt);
        const myrmexEvent: MyrmexEvent = {
          type: "error",
          url: ev.url,
          message: ev.message ?? "unknown error",
          fetchedAt: ev.fetchedAt,
        };
        this.emit(myrmexEvent);
      }
    });
  }

  private enqueueGraphWrite(event: MyrmexPageEvent, discoveredLinks: MyrmexDiscoveredLink[]): void {
    this.pendingGraphWrites += 1;
    this.updateFlowControl();

    const runWrite = async () => {
      try {
        await this.graphStore.storePage(event, discoveredLinks);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.errorCount += 1;
        console.error(`[myrmex] graph store write failed for ${event.url}: ${message}`);
        this.emit({
          type: "error",
          url: event.url,
          message: `graph store write failed: ${message}`,
          fetchedAt: event.fetchedAt,
        });
      } finally {
        this.pendingGraphWrites = Math.max(0, this.pendingGraphWrites - 1);
        this.updateFlowControl();
      }
    };

    this.graphWriteChain = this.graphWriteChain.catch(() => undefined).then(runWrite);
  }

  private emit(ev: MyrmexEvent): void {
    for (const cb of this.listeners) {
      try {
        cb(ev);
      } catch {
        // ignore listener errors
      }
    }
  }

  private maybeCheckpoint(): void {
    const now = Date.now();
    if (now - this.lastCheckpointAt >= this.config.checkpointIntervalMs) {
      this.lastCheckpointAt = now;
      const checkpointEvent: MyrmexEvent = {
        type: "checkpoint",
        frontierSize: this.weaver?.stats().frontier ?? 0,
        nodeCount: this.pageCount,
        edgeCount: 0,
        savedAt: now,
      };
      this.checkpoint.save(checkpointEvent).catch(() => {});
      this.emit(checkpointEvent);
    }
  }

  private ensureFlowControlLoop(): void {
    if (this.flowControlTimer) return;
    this.flowControlTimer = setInterval(() => this.updateFlowControl(), 1_000);
  }

  private updateFlowControl(): void {
    if (!this.running) return;

    const graphBackpressure = this.graphStore.status();
    const weaverStats = this.weaver?.stats() ?? { frontier: 0, inFlight: 0 };
    const effectivePendingWrites = this.pendingGraphWrites + weaverStats.inFlight;
    const queueSaturated = effectivePendingWrites >= this.config.openPlannerMaxPendingWrites;
    const heartbeat = this.heartbeat.update({
      now: Date.now(),
      baseDispatchIntervalMs: this.config.dispatchIntervalMs,
      frontierSize: weaverStats.frontier,
      maxFrontier: this.config.maxFrontier,
      inFlight: weaverStats.inFlight,
      maxConcurrency: this.config.maxConcurrency,
      pendingGraphWrites: effectivePendingWrites,
      maxPendingWrites: this.config.openPlannerMaxPendingWrites,
      backpressureActive: graphBackpressure.active,
    });

    if (this.weaver?.setPacingMultiplier) {
      this.weaver.setPacingMultiplier(heartbeat.pacingMultiplier);
    }

    if (graphBackpressure.active) {
      this.enterManagedPause(
        "openplanner-backpressure",
        `OpenPlanner backpressure active: wait=${graphBackpressure.waitMs}ms streak=${graphBackpressure.streak}${graphBackpressure.reason ? ` reason=${graphBackpressure.reason}` : ""}`,
      );
      return;
    }

    if (queueSaturated) {
      this.enterManagedPause(
        "graph-write-queue",
        `Graph write queue saturated: pending=${this.pendingGraphWrites} inFlight=${weaverStats.inFlight} effective=${effectivePendingWrites} limit=${this.config.openPlannerMaxPendingWrites}`,
      );
      return;
    }

    if (this.paused && this.managedPauseKey && effectivePendingWrites <= this.config.openPlannerResumePendingWrites) {
      this.leaveManagedPause(
        `OpenPlanner recovered and graph queue drained: pending=${this.pendingGraphWrites} inFlight=${weaverStats.inFlight} effective=${effectivePendingWrites} resume<=${this.config.openPlannerResumePendingWrites}`,
      );
      return;
    }

    if (!this.paused && (Date.now() % 15000) < 1000) {
      console.log(`[myrmex] heartbeat ${heartbeat.statusLine}`);
    }
  }

  private enterManagedPause(key: string, detail: string): void {
    if (this.paused && this.managedPauseKey === null) {
      return;
    }

    if (this.paused && this.managedPauseKey === key) {
      return;
    }

    this.paused = true;
    this.pauseReason = detail;
    this.managedPauseKey = key;
    console.warn(`[myrmex] pausing crawl: ${detail}`);
    if (this.weaver) {
      this.weaver.stop();
    }
  }

  private leaveManagedPause(detail: string): void {
    if (!this.managedPauseKey) return;
    this.paused = false;
    this.pauseReason = null;
    this.managedPauseKey = null;
    console.warn(`[myrmex] resuming crawl: ${detail}`);
    if (this.weaver) {
      this.weaver.start();
    }
  }

  private isKnownVisited(url: string): boolean {
    return this.visitedUrls.has(url);
  }

  private normalizeDiscoveredLinks(ev: WeaverEvent): MyrmexDiscoveredLink[] {
    const receipts: MyrmexDiscoveredLink[] = [];
    const fallbackUrls = new Set<string>();

    const push = (raw: {
      url: string;
      source?: "page" | "sitemap" | "feed";
      text?: string | null;
      rel?: string | null;
      context?: string | null;
      domPath?: string | null;
      blockSignature?: string | null;
      blockRole?: string | null;
    }) => {
      const url = String(raw.url ?? "").trim();
      if (!url) return;
      const edgeType = this.isKnownVisited(url) ? "visited_to_visited" : "visited_to_unvisited";
      receipts.push({
        url,
        edgeType,
        discoveryChannel: raw.source,
        anchorText: raw.text ?? null,
        anchorContext: raw.context ?? null,
        rel: raw.rel ?? null,
        domPath: raw.domPath ?? null,
        blockSignature: raw.blockSignature ?? null,
        blockRole: raw.blockRole ?? null,
      });
    };

    for (const row of ev.outgoingLinks ?? []) push(row);
    for (const url of ev.outgoing ?? []) {
      const normalizedUrl = String(url ?? "").trim();
      if (!normalizedUrl || fallbackUrls.has(normalizedUrl) || receipts.some((receipt) => receipt.url === normalizedUrl)) {
        continue;
      }
      fallbackUrls.add(normalizedUrl);
      push({ url: normalizedUrl });
    }

    return receipts;
  }
}

function hashString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return `sha256:${Math.abs(h).toString(16)}`;
}

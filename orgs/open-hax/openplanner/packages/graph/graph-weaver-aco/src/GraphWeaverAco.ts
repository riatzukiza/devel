import type { GraphWeaverAcoOptions, WeaverEvent, WeaverUrl } from "./types.js";
import type { FetchBackend, FetchResult } from "./fetch-backend.js";
import { SimpleFetchBackend } from "./fetch-backend.js";
import { chooseNextUrl } from "./aco.js";
import { Frontier } from "./frontier.js";
import { RobotsCache } from "./robots.js";
import { clamp, sleep } from "./utils.js";
import { extractHttpLinksFromHtml, hostOf, normalizeUrl } from "./url.js";

type Ant = {
  id: number;
  at: WeaverUrl | null;
};

type HostState = {
  lastRequestAt: number;
  inFlight: number;
};

export class GraphWeaverAco {
  private readonly opts: Omit<Required<GraphWeaverAcoOptions>, "fetchBackend">;
  private readonly backend: FetchBackend;
  private readonly frontier: Frontier;
  private readonly robots: RobotsCache;
  private readonly ants: Ant[];
  private readonly hostState = new Map<string, HostState>();

  private readonly listeners = new Set<(ev: WeaverEvent) => void>();

  private started = false;
  private dispatchPaused = true;
  private loopPromise: Promise<void> | null = null;
  private inFlight = 0;
  private lastDispatchAt = 0;
  private pacingMultiplier = 1;

  constructor(options: GraphWeaverAcoOptions = {}) {
    const { fetchBackend, ...rest } = options;
    this.opts = {
      userAgent: rest.userAgent ?? "devel-graph-weaver/0.1",
      ants: rest.ants ?? 4,
      dispatchIntervalMs: rest.dispatchIntervalMs ?? 15000,
      maxDispatchBurst: rest.maxDispatchBurst ?? Math.max(1, rest.maxConcurrency ?? 2),
      maxConcurrency: rest.maxConcurrency ?? 2,
      perHostMinIntervalMs: rest.perHostMinIntervalMs ?? 4000,
      requestTimeoutMs: rest.requestTimeoutMs ?? 15000,
      revisitAfterMs: rest.revisitAfterMs ?? 1000 * 60 * 60 * 8,
      alpha: rest.alpha ?? 1.2,
      beta: rest.beta ?? 3.0,
      evaporation: rest.evaporation ?? 0.03,
      deposit: rest.deposit ?? 0.35,
      maxFrontier: rest.maxFrontier ?? 20000,
      hostBalanceExponent: rest.hostBalanceExponent ?? 0.7,
      startupJitterMs: rest.startupJitterMs ?? 3000,
    };
    this.backend = fetchBackend ?? new SimpleFetchBackend({ userAgent: this.opts.userAgent });
    this.frontier = new Frontier(this.opts.maxFrontier);
    this.robots = new RobotsCache({ userAgent: this.opts.userAgent });
    this.ants = Array.from({ length: Math.max(1, this.opts.ants) }, (_, i) => ({ id: i, at: null }));
  }

  onEvent(cb: (ev: WeaverEvent) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  seed(urls: string[]): void {
    for (const raw of urls) {
      const normalized = normalizeUrl(raw);
      if (!normalized) continue;
      this.frontier.ensure(normalized);
      // Give seeds a small pheromone bump so ants start somewhere sensible.
      const st = this.frontier.get(normalized);
      if (st) st.pheromone = Math.min(3, st.pheromone + 0.5);
    }
  }

  start(): void {
    this.dispatchPaused = false;
    if (this.started) return;
    this.started = true;
    this.loopPromise = this.loop().finally(() => {
      this.started = false;
      this.loopPromise = null;
    });
  }

  stop(): void {
    this.dispatchPaused = true;
  }

  setPacingMultiplier(multiplier: number): void {
    const next = Number.isFinite(multiplier) ? multiplier : 1;
    this.pacingMultiplier = clamp(next, 0.2, 8);
  }

  getPacingMultiplier(): number {
    return this.pacingMultiplier;
  }

  stats(): { frontier: number; inFlight: number; pacingMultiplier: number; dispatchIntervalMs: number } {
    return {
      frontier: this.frontier.size(),
      inFlight: this.inFlight,
      pacingMultiplier: this.pacingMultiplier,
      dispatchIntervalMs: Math.max(100, Math.round(this.opts.dispatchIntervalMs * this.pacingMultiplier)),
    };
  }

  private emit(ev: WeaverEvent): void {
    for (const cb of this.listeners) {
      try {
        cb(ev);
      } catch {
        // ignore listener errors
      }
    }
  }

  private hostOk(host: string, now: number): boolean {
    const st = this.hostState.get(host);
    if (!st) return true;
    if (st.inFlight > 0) return false;
    return now - st.lastRequestAt >= this.opts.perHostMinIntervalMs;
  }

  private noteHostStart(host: string): void {
    const st = this.hostState.get(host) ?? { lastRequestAt: 0, inFlight: 0 };
    st.inFlight += 1;
    this.hostState.set(host, st);
  }

  private noteHostEnd(host: string): void {
    const st = this.hostState.get(host) ?? { lastRequestAt: 0, inFlight: 0 };
    st.inFlight = Math.max(0, st.inFlight - 1);
    st.lastRequestAt = Date.now();
    this.hostState.set(host, st);
  }

  private async loop(): Promise<void> {
    const jitter = Math.floor(Math.random() * this.opts.startupJitterMs);
    await sleep(jitter);
    let evaporateAt = Date.now() + 60_000;

    while (true) {
      const now = Date.now();
      if (now >= evaporateAt) {
        this.frontier.evaporate(this.opts.evaporation);
        evaporateAt = now + 60_000;
      }

      const canDispatch =
        !this.dispatchPaused &&
        this.inFlight < this.opts.maxConcurrency &&
        now - this.lastDispatchAt >= Math.max(100, Math.round(this.opts.dispatchIntervalMs * this.pacingMultiplier));

      if (canDispatch) {
        let launched = 0;
        const availableSlots = Math.max(0, this.opts.maxConcurrency - this.inFlight);
        const burst = Math.max(1, Math.min(this.opts.maxDispatchBurst, availableSlots));
        for (let i = 0; i < burst; i += 1) {
          const ok = await this.dispatchOne(now);
          if (!ok) break;
          launched += 1;
        }
        if (launched > 0) {
          this.lastDispatchAt = now;
        }
      }

      await sleep(250);
    }
  }

  private async dispatchOne(now: number): Promise<boolean> {
    const urls = this.frontier.urls();
    if (urls.length === 0) return false;

    // Pick an ant with a current position; if none, start from a random frontier url.
    const ant = this.ants[Math.floor(Math.random() * this.ants.length)]!;
    const at = ant.at;

    let candidates: WeaverUrl[] = [];
    if (at) {
      const st = this.frontier.get(at);
      if (st) candidates = [...st.outgoing.values()];
    }
    if (candidates.length === 0) {
      // global frontier candidates
      candidates = urls;
    }

    // Filter by per-host pacing and basic revisit gating.
    const filtered: WeaverUrl[] = [];
    for (const url of candidates) {
      const st = this.frontier.get(url) ?? this.frontier.ensure(url);
      const host = st.host;
      if (!host || !this.hostOk(host, now)) continue;
      if (st.lastVisitedAt && now - st.lastVisitedAt < 1500) continue;
      filtered.push(url);
    }
    if (filtered.length === 0) return false;

    const next = chooseNextUrl({
      frontier: this.frontier,
      candidates: filtered,
      rng: Math.random,
      aco: {
        now,
        alpha: this.opts.alpha,
        beta: this.opts.beta,
        revisitAfterMs: this.opts.revisitAfterMs,
        hostBalanceExponent: this.opts.hostBalanceExponent,
      },
    });
    if (!next) return false;

    if (!(await this.robots.allowed(next))) {
      // Treat robots-blocked as visited-ish (reduces repeated attempts).
      const st = this.frontier.ensure(next);
      st.visits += 1;
      st.pheromone = Math.max(0.01, st.pheromone * 0.7);
      return false;
    }

    ant.at = next;
    void this.fetchOne(at, next).catch(() => {});
    return true;
  }

  private async fetchOne(from: WeaverUrl | null, url: WeaverUrl): Promise<void> {
    this.inFlight += 1;
    const host = hostOf(url);
    if (host) this.noteHostStart(host);

    const startedAt = Date.now();
    try {
      const result = await this.backend.fetch(url, {
        timeout: this.opts.requestTimeoutMs,
        userAgent: this.opts.userAgent,
      });

      if (result.error) {
        const st = this.frontier.ensure(url);
        st.visits += 1;
        st.pheromone = Math.max(0.01, st.pheromone * 0.6);
        this.emit({ type: "error", url, fetchedAt: startedAt, message: result.error });
        return;
      }

      const outgoingLinks = result.outgoingLinks ?? (result.outgoing ?? []).map((link) => ({ url: link }));
      const outgoing = outgoingLinks.map((link) => link.url);
      this.frontier.noteVisit(url);
      this.frontier.noteOutgoing(url, outgoing);

      if (from) {
        const fromSt = this.frontier.ensure(from);
        fromSt.pheromone = Math.min(6, fromSt.pheromone + this.opts.deposit * 0.1);
      }
      const st = this.frontier.ensure(url);
      const novelty = 1 / (1 + st.visits);
      st.pheromone = Math.min(8, st.pheromone + this.opts.deposit * novelty);

      this.emit({
        type: "page",
        url,
        status: result.status,
        contentType: result.contentType,
        fetchedAt: startedAt,
        outgoing,
        outgoingLinks,
        content: result.content,
        title: result.title,
        metadata: result.metadata,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const st = this.frontier.ensure(url);
      st.visits += 1;
      st.pheromone = Math.max(0.01, st.pheromone * 0.6);
      this.emit({ type: "error", url, fetchedAt: startedAt, message });
    } finally {
      if (host) this.noteHostEnd(host);
      this.inFlight = Math.max(0, this.inFlight - 1);
    }
  }
}

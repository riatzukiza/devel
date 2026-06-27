import type { WeaverUrl } from "./types.js";
import { clamp } from "./utils.js";
import { hostOf } from "./url.js";

export type UrlState = {
  url: WeaverUrl;
  host: string;
  discoveredAt: number;
  lastVisitedAt: number;
  visits: number;
  pheromone: number;
  outgoing: Set<WeaverUrl>;
};

export class Frontier {
  private readonly byUrl = new Map<WeaverUrl, UrlState>();
  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = Math.max(100, maxSize);
  }

  get(url: WeaverUrl): UrlState | undefined {
    return this.byUrl.get(url);
  }

  ensure(url: WeaverUrl): UrlState {
    const existing = this.byUrl.get(url);
    if (existing) return existing;
    const now = Date.now();
    const state: UrlState = {
      url,
      host: hostOf(url),
      discoveredAt: now,
      lastVisitedAt: 0,
      visits: 0,
      pheromone: 1,
      outgoing: new Set(),
    };
    this.byUrl.set(url, state);
    this.trimIfNeeded();
    return state;
  }

  noteOutgoing(from: WeaverUrl, outgoing: WeaverUrl[]): void {
    const st = this.ensure(from);
    for (const target of outgoing) {
      st.outgoing.add(target);
      this.ensure(target);
    }
  }

  noteVisit(url: WeaverUrl): void {
    const st = this.ensure(url);
    st.visits += 1;
    st.lastVisitedAt = Date.now();
  }

  evaporate(evaporation: number): void {
    const rho = clamp(evaporation, 0, 0.99);
    for (const st of this.byUrl.values()) {
      st.pheromone = Math.max(0.01, st.pheromone * (1 - rho));
    }
  }

  urls(): WeaverUrl[] {
    return [...this.byUrl.keys()];
  }

  size(): number {
    return this.byUrl.size;
  }

  private trimIfNeeded(): void {
    if (this.byUrl.size <= this.maxSize) return;

    // Drop the least-relevant: many visits + very old + low pheromone.
    const rows = [...this.byUrl.values()];
    rows.sort((a, b) => {
      const score = (s: UrlState) => s.pheromone - s.visits * 0.2 - (Date.now() - s.discoveredAt) / 1e9;
      return score(a) - score(b);
    });

    const dropCount = Math.max(1, Math.floor(this.byUrl.size * 0.05));
    for (let i = 0; i < dropCount; i += 1) {
      const st = rows[i];
      if (st) this.byUrl.delete(st.url);
    }
  }
}

import type { MyrmexPageEvent } from "./types.js";

export interface EventRouterConfig {
  proxxBaseUrl: string;
  authToken: string;
  includePatterns: string[];
  excludePatterns: string[];
  maxContentLength: number;
}

export class EventRouter {
  private readonly config: EventRouterConfig;

  constructor(config: EventRouterConfig) {
    this.config = config;
  }

  async route(event: MyrmexPageEvent): Promise<void> {
    if (!this.shouldInclude(event.url)) return;
    if (this.shouldExclude(event.url)) return;

    const truncated = event.content.length > this.config.maxContentLength
      ? event.content.slice(0, this.config.maxContentLength)
      : event.content;

    const body = {
      kind: "graph.node",
      timestamp: new Date(event.fetchedAt).toISOString(),
      data: {
        url: event.url,
        title: event.title,
        content: truncated,
        contentHash: event.contentHash,
        metadata: event.metadata,
        discoveredAt: new Date(event.fetchedAt).toISOString(),
        lastVisitedAt: new Date(event.fetchedAt).toISOString(),
        visitCount: 1,
        pheromone: 0.5,
      },
    };

    await this.post("/api/v1/lake/events", body);
  }

  private shouldInclude(url: string): boolean {
    if (this.config.includePatterns.length === 0) return true;
    return this.config.includePatterns.some((p) => url.includes(p));
  }

  private shouldExclude(url: string): boolean {
    return this.config.excludePatterns.some((p) => url.includes(p));
  }

  private async post(path: string, body: unknown): Promise<void> {
    const baseUrl = this.config.proxxBaseUrl.replace(/\/+$/, "");
    await fetch(baseUrl + path, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.config.authToken}`,
      },
      body: JSON.stringify(body),
    });
  }
}

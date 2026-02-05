import type { Memory } from "../types/index.js";

export interface OpenPlannerConfig {
  baseUrl: string;
  apiKey?: string;
}

export type SourceRef = Partial<{
  session: string;
  memory: string;
  event: string;
}>;

export interface EventEnvelopeV1 {
  schema: "openplanner.event.v1";
  id: string;
  ts: string;
  source: string;
  kind: string;
  source_ref?: SourceRef;
  text?: string;
  meta?: Record<string, unknown>;
  extra?: Record<string, unknown>;
}

export interface OpenPlannerSearchResult {
  id: string;
  text?: string;
  score: number;
  source?: string;
  kind?: string;
  ts?: string;
  source_ref?: SourceRef;
  meta?: Record<string, unknown>;
}

export interface OpenPlannerSearchOptions {
  limit?: number;
  session?: string;
}

type EventIngestResponse = {
  indexed?: number;
};

type SearchResponse = {
  results: OpenPlannerSearchResult[];
};

export function createDefaultOpenPlannerConfig(): OpenPlannerConfig {
  return {
    baseUrl: process.env.OPENPLANNER_URL ?? "http://127.0.0.1:7777",
    apiKey: process.env.OPENPLANNER_API_KEY,
  };
}

const buildHeaders = (apiKey?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  return headers;
};

const buildEvent = (memory: Memory): EventEnvelopeV1 => ({
  schema: "openplanner.event.v1",
  id: `memory-${memory.id}`,
  ts: new Date(memory.timestamp).toISOString(),
  source: "cephalon-ts",
  kind: "memory.created",
  source_ref: {
    session: memory.sessionId,
    memory: memory.id,
    event: memory.eventId ?? undefined,
  },
  text: memory.content.text,
  meta: {
    cephalon_id: memory.cephalonId,
    memory_kind: memory.kind,
    schema_version: memory.schemaVersion,
    role: memory.role,
  },
  extra: {
    session_id: memory.sessionId,
    event_id: memory.eventId,
    content_text: memory.content.text,
    normalized_text: memory.content.normalizedText,
    source_type: memory.source.type,
    source_guild_id: memory.source.guildId,
    source_channel_id: memory.source.channelId,
    source_author_id: memory.source.authorId,
    source_author_is_bot: memory.source.authorIsBot,
    role: memory.role,
    embedding_status: memory.embedding.status,
    retrieval_pinned: memory.retrieval.pinned,
    timestamp: memory.timestamp,
  },
});

export class OpenPlannerClient {
  private readonly config: OpenPlannerConfig;

  constructor(config: Partial<OpenPlannerConfig> = {}) {
    this.config = {
      ...createDefaultOpenPlannerConfig(),
      ...config,
    };
  }

  private buildUrl(path: string): string {
    const base = this.config.baseUrl.replace(/\/$/, "");
    return `${base}${path}`;
  }

  private async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(this.buildUrl(path), {
      method: "POST",
      headers: buildHeaders(this.config.apiKey),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenPlanner request failed: ${response.status} ${errorBody}`);
    }

    return response.json() as Promise<T>;
  }

  async search(query: string, options: OpenPlannerSearchOptions = {}): Promise<OpenPlannerSearchResult[]> {
    const response = await this.post<SearchResponse>("/v1/search/fts", {
      q: query,
      limit: options.limit ?? 5,
      session: options.session,
    });
    return response.results;
  }

  async searchFts(query: string, options: OpenPlannerSearchOptions = {}): Promise<OpenPlannerSearchResult[]> {
    return this.search(query, options);
  }

  async emitMemoryCreated(memory: Memory): Promise<void> {
    const event = buildEvent(memory);
    await this.post<EventIngestResponse>("/v1/events", {
      events: [event],
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(this.buildUrl("/health"), {
        method: "GET",
        headers: buildHeaders(this.config.apiKey),
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

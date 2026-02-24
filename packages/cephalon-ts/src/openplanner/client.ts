import {
  createOpenPlannerClient,
  defaultOpenPlannerConfig,
  type OpenPlannerClient as CanonicalOpenPlannerClient,
  type OpenPlannerEvent,
} from "@promethean-os/openplanner-cljs-client";
import type { Memory } from "../types/index.js";

export interface OpenPlannerConfig {
  baseUrl: string;
  apiKey?: string;
  fetch?: typeof fetch;
}

export type SourceRef = Partial<{
  project: string;
  session: string;
  message: string;
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

type SearchRow = Partial<{
  id: string;
  ts: string;
  source: string;
  kind: string;
  project: string;
  session: string;
  message: string;
  snippet: string;
  text: string;
  score: number;
}>;

type SearchResponse = Partial<{
  rows: SearchRow[];
  results: OpenPlannerSearchResult[];
}>;

export function createDefaultOpenPlannerConfig(): OpenPlannerConfig {
  const config = defaultOpenPlannerConfig();
  return {
    baseUrl: config.endpoint,
    apiKey: config.apiKey ?? undefined,
    fetch: config.fetch,
  };
}

const buildEvent = (memory: Memory): OpenPlannerEvent => ({
  schema: "openplanner.event.v1",
  id: `memory-${memory.id}`,
  ts: new Date(memory.timestamp).toISOString(),
  source: "cephalon-ts",
  kind: "memory.created",
  source_ref: {
    session: memory.sessionId,
    message: memory.id,
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
    memory_id: memory.id,
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

const toSearchResult = (row: SearchRow): OpenPlannerSearchResult => ({
  id: row.id ?? "",
  text: row.text ?? row.snippet,
  score: typeof row.score === "number" ? row.score : 0,
  source: row.source,
  kind: row.kind,
  ts: row.ts,
  source_ref: {
    project: row.project,
    session: row.session,
    message: row.message,
  },
});

export class OpenPlannerClient {
  private readonly config: OpenPlannerConfig;
  private readonly client: CanonicalOpenPlannerClient;

  constructor(config: Partial<OpenPlannerConfig> = {}) {
    this.config = {
      ...createDefaultOpenPlannerConfig(),
      ...config,
    };
    this.client = createOpenPlannerClient({
      endpoint: this.config.baseUrl,
      apiKey: this.config.apiKey,
      fetch: this.config.fetch,
    });
  }

  async search(
    query: string,
    options: OpenPlannerSearchOptions = {},
  ): Promise<OpenPlannerSearchResult[]> {
    const response = (await this.client.searchFts({
      q: query,
      limit: options.limit ?? 5,
      session: options.session,
    })) as SearchResponse;

    if (Array.isArray(response.results)) {
      return response.results;
    }

    if (Array.isArray(response.rows)) {
      return response.rows.map(toSearchResult);
    }

    return [];
  }

  async searchFts(
    query: string,
    options: OpenPlannerSearchOptions = {},
  ): Promise<OpenPlannerSearchResult[]> {
    return this.search(query, options);
  }

  async emitMemoryCreated(memory: Memory): Promise<void> {
    const event = buildEvent(memory);
    await this.client.indexEvents([event]);
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.health();
      return true;
    } catch {
      return false;
    }
  }
}

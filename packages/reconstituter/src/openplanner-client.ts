/**
 * openplanner-client.ts
 *
 * HTTP client for OpenPlanner API (events + FTS search).
 *
 * Endpoints:
 *   POST /v1/events    - Index event batches
 *   POST /v1/search/fts - Full-text search
 *
 * Environment:
 *   OPENPLANNER_API_BASE_URL / OPENPLANNER_URL - OpenPlanner server URL
 *   (default: http://127.0.0.1:8788/api/openplanner)
 *   OPENPLANNER_API_KEY - Bearer token for authentication
 */

import crypto from "node:crypto";
import {
  createOpenPlannerClient,
  defaultOpenPlannerConfig,
} from "@promethean-os/openplanner-cljs-client";

// ============================================================================
// Types (mirroring OpenPlanner schema)
// ============================================================================

export type BlobRef = {
  blob: string;
  mime: string;
  name?: string;
  size?: number;
};

export type SourceRef = Partial<{
  project: string;
  session: string;
  message: string;
  turn: string;
}>;

export type EventEnvelopeV1 = {
  schema: "openplanner.event.v1";
  id: string;
  ts: string;
  source: string;
  kind: string;
  source_ref?: SourceRef;
  text?: string;
  attachments?: BlobRef[];
  meta?: Record<string, unknown>;
  extra?: Record<string, unknown>;
};

export type EventIngestRequest = { events: EventEnvelopeV1[] };

export type FtsSearchRequest = {
  q: string;
  limit?: number;
  source?: string;
  kind?: string;
  project?: string;
  session?: string;
};

export type FtsSearchResult = {
  id: string;
  score: number;
  text?: string;
  source?: string;
  kind?: string;
  ts?: string;
  meta?: Record<string, unknown>;
  source_ref?: SourceRef;
};

export type FtsSearchResponse = { results: FtsSearchResult[] };

// ============================================================================
// Environment Configuration
// ============================================================================

export interface OpenPlannerEnv {
  OPENPLANNER_URL: string;
  OPENPLANNER_API_KEY?: string;
}

export function openPlannerEnv(): OpenPlannerEnv {
  const config = defaultOpenPlannerConfig();
  return {
    OPENPLANNER_URL: config.endpoint,
    OPENPLANNER_API_KEY: config.apiKey ?? undefined,
  };
}

// ============================================================================
// HTTP Client
// ============================================================================

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function openPlannerClient() {
  const env = openPlannerEnv();
  return createOpenPlannerClient({
    endpoint: env.OPENPLANNER_URL,
    apiKey: env.OPENPLANNER_API_KEY,
  });
}

// ============================================================================
// Event Indexing
// ============================================================================

/**
 * Index a batch of events into OpenPlanner.
 *
 * @param events - Array of EventEnvelopeV1 to index
 * @throws Error on non-2xx response from OpenPlanner
 */
export async function indexEvents(events: EventEnvelopeV1[]): Promise<void> {
  const client = openPlannerClient();
  await client.indexEvents(events);
}

/**
 * Convert a message to an OpenPlanner event.
 * Preserves the flattened text content from the original Chroma embedding flow.
 */
export function messageToEvent(params: {
  sessionId: string;
  messageId: string;
  messageIndex: number;
  text: string;
  createdAt: number;
  role: string;
  sessionTitle?: string;
  paths?: string[];
}): EventEnvelopeV1 {
  const { sessionId, messageId, messageIndex, text, createdAt, role, sessionTitle, paths } = params;

  const id = sha256(`${sessionId}:${messageId}:${messageIndex}`);
  const ts = new Date(createdAt).toISOString();

  const meta: Record<string, unknown> = {
    message_id: messageId,
    message_index: messageIndex,
    role,
    session_title: sessionTitle,
  };

  if (paths && paths.length > 0) {
    meta.paths = paths.join("|");
  }

  return {
    schema: "openplanner.event.v1",
    id,
    ts,
    source: "opencode-sessions",
    kind: "message",
    source_ref: {
      session: sessionId,
      message: messageId,
    },
    text,
    meta,
  };
}

// ============================================================================
// FTS Search
// ============================================================================

/**
 * Search events using full-text search.
 *
 * @param query - Search query string
 * @param options - Search options (limit, session filter, etc.)
 * @returns Search results with scores and metadata
 * @throws Error on non-2xx response from OpenPlanner
 */
export async function searchFts(
  query: string,
  options: {
    limit?: number;
    session?: string;
  } = {}
): Promise<FtsSearchResult[]> {
  const client = openPlannerClient();
  const body: FtsSearchRequest = {
    q: query,
    limit: options.limit ?? 10,
    session: options.session,
  };
  const response = await client.searchFts(body);
  if (typeof response !== "object" || response === null) {
    return [];
  }

  if ("results" in response) {
    const results = (response as { results?: unknown }).results;
    if (Array.isArray(results)) {
      return results as FtsSearchResult[];
    }
  }

  if ("rows" in response) {
    const rows = (response as { rows?: unknown }).rows;
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows.map((row) => {
      const rowObj = typeof row === "object" && row !== null ? (row as Record<string, unknown>) : {};
      return {
      id: String(rowObj.id ?? ""),
      score: typeof rowObj.score === "number" ? rowObj.score : 0,
      text: typeof rowObj.snippet === "string" ? rowObj.snippet : undefined,
      source: typeof rowObj.source === "string" ? rowObj.source : undefined,
      kind: typeof rowObj.kind === "string" ? rowObj.kind : undefined,
      ts: typeof rowObj.ts === "string" ? rowObj.ts : undefined,
      source_ref: {
        project: typeof rowObj.project === "string" ? rowObj.project : undefined,
        session: typeof rowObj.session === "string" ? rowObj.session : undefined,
        message: typeof rowObj.message === "string" ? rowObj.message : undefined,
      },
      meta: {
        role: rowObj.role,
        model: rowObj.model,
      },
    };
    });
  }

  return [];
}

/**
 * Format search results for display (similar to original Chroma output format).
 */
export function formatSearchResults(results: FtsSearchResult[]): string {
  if (!results.length) {
    return "No matches found.";
  }

  const lines: string[] = [];
  lines.push(`Found ${results.length} results:\n`);

  // Group by session
  const bySession = new Map<string, FtsSearchResult[]>();
  for (const r of results) {
    const session = r.source_ref?.session ?? r.source ?? "unknown";
    const arr = bySession.get(session) ?? [];
    arr.push(r);
    bySession.set(session, arr);
  }

  for (const [sessionId, hits] of bySession.entries()) {
    lines.push(`=== session_id: ${sessionId} (hits: ${hits.length}) ===`);
    for (const r of hits) {
      lines.push(`\n--- Result ---`);
      lines.push(`ID: ${r.id}`);
      lines.push(`Score: ${r.score.toFixed(4)}`);
      if (r.source_ref?.message) {
        lines.push(`Message: ${r.source_ref.message}`);
      }
      lines.push(`Session: ${sessionId}`);
      if (r.ts) {
        lines.push(`Created: ${r.ts}`);
      }
      if (r.meta) {
        const meta = r.meta as Record<string, unknown>;
        if (meta.role) lines.push(`Role: ${String(meta.role)}`);
        if (meta.session_title) lines.push(`Session Title: ${String(meta.session_title)}`);
        if (meta.paths) lines.push(`Paths: ${String((meta.paths as string)).replace(/\|/g, ", ")}`);
      }
      if (r.text) {
        lines.push(`\n${r.text}\n`);
      }
    }
  }

  return lines.join("\n");
}

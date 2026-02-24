/**
 * opencode-sessions.ts
 *
 * Unified CLI for managing OpenCode sessions with OpenPlanner events.
 *
 * Commands:
 *   index         Index OpenCode sessions into OpenPlanner
 *   search        Search indexed sessions using OpenPlanner FTS
 *   help          Show this help message
 *
 * Usage:
 *   pnpm -C packages/reconstituter opencode-sessions index
 *   pnpm -C packages/reconstituter opencode-sessions search "your query here" --k 10 --session <session_id>
 *
 * Environment:
 *   OPENCODE_BASE_URL                 - OpenCode server URL (default: http://localhost:4096)
 *   OPENCODE_THROTTLE_MS              - Minimum delay between OpenCode API calls (default: 200)
 *   LEVEL_DIR                         - LevelDB directory (default: .reconstitute/level)
 *   BATCH_SIZE                        - Batch size for indexing (default: 32)
 *   OPENCODE_CHUNK_INDEXING           - "1" (default) to index chunk events; "0" for legacy per-message
 *   OPENCODE_INDEX_LARGEST_OF_LAST_N  - If set, index only the single largest session among the last N sessions
 *   OPENCODE_CHUNK_TARGET_TOKENS      - Approx token target for chunks (default: 32000)
 *   OPENCODE_CHUNK_OVERLAP_MESSAGES   - Message overlap between chunks (default: 4)
 */

import "dotenv/config";

import {
  createOpencodeClient,
  extractPathsLoose as extractPathsLooseViaClient,
  flattenForEmbedding as flattenForEmbeddingViaClient,
  opencodeMessageToOllamaParts as opencodeMessageToOllamaPartsViaClient,
} from "@promethean-os/opencode-cljs-client";
import { Level } from "level";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import {
  chunkToEvent,
  formatSearchResults,
  indexEvents,
  messageToEvent,
  openPlannerEnv,
  searchFts,
} from "./openplanner-client.js";

// ============================================================================
// Types
// ============================================================================

export type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

export type OllamaMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | {
      role: "assistant";
      content?: string;
      tool_calls?: Array<{
        type: "function";
        function: { index: number; name: string; arguments: Record<string, unknown> };
      }>;
    }
  | { role: "tool"; tool_name: string; content: string };

export interface Env {
  OPENCODE_BASE_URL: string;
  OPENPLANNER_URL: string;
  OPENCODE_THROTTLE_MS: number;
  LEVEL_DIR: string;
  BATCH_SIZE: number;
  OPENCODE_CHUNK_INDEXING: boolean;
  OPENCODE_INDEX_LARGEST_OF_LAST_N?: number;
  OPENCODE_CHUNK_TARGET_TOKENS: number;
  OPENCODE_CHUNK_OVERLAP_MESSAGES: number;
}

export interface SearchArgs {
  query: string;
  k: number;
  session?: string;
}

export interface CliArgs {
  command: string;
  searchArgs?: SearchArgs;
}

// ============================================================================
// Environment
// ============================================================================

export function env(): Env {
  const opEnv = openPlannerEnv();
  return {
    OPENCODE_BASE_URL: process.env.OPENCODE_BASE_URL ?? "http://localhost:4096",
    OPENPLANNER_URL: opEnv.OPENPLANNER_URL,
    OPENCODE_THROTTLE_MS: Number(process.env.OPENCODE_THROTTLE_MS ?? "200"),
    LEVEL_DIR: process.env.LEVEL_DIR ?? ".reconstitute/level",
    BATCH_SIZE: Number(process.env.BATCH_SIZE ?? "32"),
    OPENCODE_CHUNK_INDEXING: (process.env.OPENCODE_CHUNK_INDEXING ?? "1") !== "0",
    OPENCODE_INDEX_LARGEST_OF_LAST_N: process.env.OPENCODE_INDEX_LARGEST_OF_LAST_N
      ? Number(process.env.OPENCODE_INDEX_LARGEST_OF_LAST_N)
      : undefined,
    OPENCODE_CHUNK_TARGET_TOKENS: Number(process.env.OPENCODE_CHUNK_TARGET_TOKENS ?? "32000"),
    OPENCODE_CHUNK_OVERLAP_MESSAGES: Number(process.env.OPENCODE_CHUNK_OVERLAP_MESSAGES ?? "4"),
  };
}

// ============================================================================
// Utility
// ============================================================================

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

function clampInt(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, Math.floor(v)));
}

// Conservative approximation: tokens ~= chars / 3.5.
function approxTokens(text: string): number {
  return Math.ceil((text?.length ?? 0) / 3.5);
}

function joinDocs(docs: Array<{ doc: string }>): string {
  return docs.map((d) => d.doc).join("\n\n");
}

export function flattenForEmbedding(ollamaMsgs: OllamaMessage[]): string {
  return flattenForEmbeddingViaClient(ollamaMsgs) as string;
}

export function extractPathsLoose(text: string): string[] {
  const result = extractPathsLooseViaClient(text);
  if (Array.isArray(result)) return result.map((x) => String(x));
  return [];
}

export function opencodeMessageToOllamaParts(entry: any): OllamaMessage[] {
  const result = opencodeMessageToOllamaPartsViaClient(entry);
  if (Array.isArray(result)) return result as OllamaMessage[];
  return [];
}

function unwrap<T>(resp: any): T {
  if (resp && typeof resp === "object" && "data" in resp) {
    return unwrap(resp.data);
  }
  return resp as T;
}

function unwrapArray<T>(resp: any, objectKeys: string[] = []): T[] {
  const value = unwrap<any>(resp);
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    for (const key of objectKeys) {
      const candidate = (value as Record<string, unknown>)[key];
      if (Array.isArray(candidate)) return candidate as T[];
    }
  }
  return [];
}

// ============================================================================
// Index
// ============================================================================

export async function indexSessions(): Promise<void> {
  const E = env();

  console.log("Starting OpenCode session indexing...");
  console.log(`OpenPlanner URL: ${E.OPENPLANNER_URL}`);
  console.log(`OpenCode URL: ${E.OPENCODE_BASE_URL}`);
  console.log(`Batch size: ${E.BATCH_SIZE}`);
  console.log(`Chunk indexing: ${E.OPENCODE_CHUNK_INDEXING ? "on" : "off"}`);
  if (E.OPENCODE_INDEX_LARGEST_OF_LAST_N) {
    console.log(`Index largest of last N: ${E.OPENCODE_INDEX_LARGEST_OF_LAST_N}`);
  }
  console.log("");

  const client = createOpencodeClient({ baseUrl: E.OPENCODE_BASE_URL });
  const db = new Level<string, any>(E.LEVEL_DIR, { valueEncoding: "json" });

  let lastOpencodeCall = 0;
  const throttleOpencode = async (): Promise<void> => {
    const delay = E.OPENCODE_THROTTLE_MS;
    if (delay <= 0) {
      lastOpencodeCall = Date.now();
      return;
    }
    const now = Date.now();
    const waitMs = lastOpencodeCall + delay - now;
    if (waitMs > 0) await sleep(waitMs);
    lastOpencodeCall = Date.now();
  };

  await throttleOpencode();
  const sessionsResp = await client.listSessions();
  const allSessions = unwrapArray<any>(sessionsResp, ["sessions", "rows"]);
  console.log(`Found ${allSessions?.length} sessions`);

  const lastN = E.OPENCODE_INDEX_LARGEST_OF_LAST_N;
  const sessions = typeof lastN === "number" && Number.isFinite(lastN)
    ? allSessions.slice(0, clampInt(lastN, 1, 500))
    : allSessions;

  // Optionally pick the single largest session among the last N (by total flattened text length).
  let sessionsToIndex = sessions;
  if (typeof lastN === "number" && Number.isFinite(lastN) && lastN > 0) {
    let best: any | null = null;
    let bestSize = -1;

    for (const s of sessions) {
      const sessionId = s.id;
      if (!sessionId) continue;
      await throttleOpencode();
      const messages = unwrapArray<any>(await client.listMessages(sessionId), ["messages", "rows"]);
      let totalLen = 0;
      for (let i = 0; i < messages.length; i++) {
        const entry = messages[i];
        const ollamaMsgs = opencodeMessageToOllamaParts(entry);
        const doc = flattenForEmbedding(ollamaMsgs);
        totalLen += doc.length;
      }
      if (totalLen > bestSize) {
        bestSize = totalLen;
        best = s;
      }
    }

    sessionsToIndex = best ? [best] : [];
    if (best) {
      console.log(`Indexing only largest session from last ${clampInt(lastN, 1, 500)}: ${best.id} (approx chars: ${bestSize})`);
    }
  }

  let totalRecords = 0;

  for (const s of sessionsToIndex) {
    const sessionId = s.id;
    if (!sessionId) continue;

    const sessionTitle = s.title ?? "";
    await throttleOpencode();
    const messages = unwrapArray<any>(await client.listMessages(sessionId), ["messages", "rows"]);

    await db.put(`sess:${sessionId}:meta`, { id: sessionId, title: sessionTitle });

    const idsInOrder: string[] = [];
    const eventsToIndex: any[] = [];

    const docs: Array<{
      messageIndex: number;
      messageId: string;
      createdAt: number;
      doc: string;
      docHash: string;
      paths: string[];
      role: string;
    }> = [];

    for (let i = 0; i < messages.length; i++) {
      const entry = messages[i];
      const msgId = entry?.info?.id ?? `${sessionId}:msg:${i}`;
      const createdAt = entry?.info?.createdAt ? new Date(entry.info.createdAt).getTime() : Date.now();

      const ollamaMsgs = opencodeMessageToOllamaParts(entry);
      const doc = flattenForEmbedding(ollamaMsgs);
      const docHash = sha256(JSON.stringify(entry));

      const rowId = `${sessionId}:${i}`;
      idsInOrder.push(rowId);

      const prevHash = await db.get(`msg:${rowId}:hash`).catch(() => null);
      const paths = extractPathsLoose(doc);

      docs.push({
        messageIndex: i,
        messageId: msgId,
        createdAt,
        doc,
        docHash,
        paths,
        role: entry?.info?.role ?? entry?.info?.type ?? "assistant",
      });

      if (!E.OPENCODE_CHUNK_INDEXING && prevHash !== docHash) {
        eventsToIndex.push(
          messageToEvent({
            sessionId,
            messageId: msgId,
            messageIndex: i,
            text: doc,
            createdAt,
            role: entry?.info?.role ?? entry?.info?.type ?? "assistant",
            sessionTitle,
            paths,
          })
        );
      }

      if (prevHash !== docHash) {
        await db.put(`msg:${rowId}:hash`, docHash);
        await db.put(`msg:${rowId}:ollama`, ollamaMsgs);
      }
    }

    if (E.OPENCODE_CHUNK_INDEXING) {
      const targetTokens = clampInt(E.OPENCODE_CHUNK_TARGET_TOKENS, 512, 200_000);
      const overlapMsgs = clampInt(E.OPENCODE_CHUNK_OVERLAP_MESSAGES, 0, 50);

      let chunkIndex = 0;
      let buf: Array<{ messageIndex: number; messageId: string; createdAt: number; doc: string; paths: string[]; role: string }> = [];
      let bufTokens = 0;

      const flush = () => {
        if (buf.length === 0) return;
        const text = joinDocs(buf);
        const allPaths = Array.from(new Set(buf.flatMap((d) => d.paths ?? [])));
        const first = buf[0];
        const last = buf[buf.length - 1];

        eventsToIndex.push(
          chunkToEvent({
            sessionId,
            sessionTitle,
            chunkIndex,
            messageIdStart: first.messageId,
            messageIdEnd: last.messageId,
            messageIndexStart: first.messageIndex,
            messageIndexEnd: last.messageIndex,
            createdAt: last.createdAt,
            text,
            approxTokens: bufTokens,
            paths: allPaths,
          })
        );
        chunkIndex += 1;

        if (overlapMsgs > 0) {
          buf = buf.slice(Math.max(0, buf.length - overlapMsgs));
          bufTokens = approxTokens(joinDocs(buf));
        } else {
          buf = [];
          bufTokens = 0;
        }
      };

      for (const d of docs) {
        const nextTokens = approxTokens(d.doc);
        if (buf.length > 0 && bufTokens + nextTokens > targetTokens) {
          flush();
        }
        buf.push({
          messageIndex: d.messageIndex,
          messageId: d.messageId,
          createdAt: d.createdAt,
          doc: d.doc,
          paths: d.paths,
          role: d.role,
        });
        bufTokens += nextTokens;
      }
      flush();
    }

    await db.put(`sess:${sessionId}:order`, idsInOrder);

    for (let start = 0; start < eventsToIndex.length; start += E.BATCH_SIZE) {
      const batch = eventsToIndex.slice(start, start + E.BATCH_SIZE);
      await indexEvents(batch);
      totalRecords += batch.length;
      console.log(`Indexed ${batch.length} events to OpenPlanner (total: ${totalRecords})`);
    }
  }

  await db.close();
  console.log(`\nDone. Total records indexed: ${totalRecords}`);
}

// ============================================================================
// Search
// ============================================================================

export async function searchSessions(args: SearchArgs): Promise<void> {
  console.log("Searching OpenCode sessions via OpenPlanner...");
  console.log(`Query: "${args.query}"`);
  if (args.session) console.log(`Session: ${args.session}`);

  const resp = await searchFts({
    q: args.query,
    limit: args.k,
    source: "opencode-sessions",
    session: args.session,
  });

  // eslint-disable-next-line no-console
  console.log(formatSearchResults(resp.results));
}

// ============================================================================
// CLI parsing
// ============================================================================

export function parseCliArgs(argv: string[]): CliArgs {
  const [command, ...rest] = argv;

  if (!command || command === "help" || command === "--help" || command === "-h") {
    return { command: "help" };
  }

  if (command === "index") {
    return { command };
  }

  if (command === "search") {
    const query = rest[0] ?? "";
    let k = 10;
    let session: string | undefined;
    for (let i = 1; i < rest.length; i++) {
      const tok = rest[i];
      if (tok === "--k" && rest[i + 1]) {
        k = Number(rest[i + 1]);
        i += 1;
      } else if (tok === "--session" && rest[i + 1]) {
        session = rest[i + 1];
        i += 1;
      }
    }
    return { command, searchArgs: { query, k, session } };
  }

  return { command: "help" };
}

function helpText(): string {
  return `OpenCode Sessions CLI\n\nCommands:\n  index\n  search <query> [--k N] [--session <session>]\n  help\n`;
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const args = parseCliArgs(argv);

  if (args.command === "help") {
    // eslint-disable-next-line no-console
    console.log(helpText());
    return;
  }

  if (args.command === "index") {
    await indexSessions();
    return;
  }

  if (args.command === "search" && args.searchArgs) {
    await searchSessions(args.searchArgs);
    return;
  }

  // eslint-disable-next-line no-console
  console.log(helpText());
}

// If invoked as a script
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}

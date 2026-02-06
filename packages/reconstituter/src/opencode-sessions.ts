/**
 * opencode-sessions.ts
 *
 * Unified CLI for managing OpenCode sessions with OpenPlanner events.
 *
 * Commands:
 *   index         Index all OpenCode sessions into OpenPlanner
 *   search        Search indexed sessions using OpenPlanner FTS
 *   help          Show this help message
 *
 * Usage:
 *   pnpm -C packages/reconstituter opencode-sessions index
 *   pnpm -C packages/reconstituter opencode-sessions search "your query here" --k 10 --session <session_id>
 *   pnpm -C packages/reconstituter opencode-sessions help
 *
 * Environment:
 *   OPENCODE_BASE_URL     - OpenCode server URL (default: http://localhost:4096)
 *   OPENPLANNER_URL       - OpenPlanner server URL (default: http://localhost:7777)
 *   OPENPLANNER_API_KEY   - OpenPlanner API key (optional)
 *   OPENCODE_THROTTLE_MS  - Minimum delay between OpenCode API calls (default: 200)
 *   LEVEL_DIR             - LevelDB directory (default: .reconstitute/level)
 *   BATCH_SIZE            - Batch size for indexing (default: 32)
 */
import "dotenv/config";

import { createOpencodeClient } from "@opencode-ai/sdk";
import { Level } from "level";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import {
  formatSearchResults,
  indexEvents,
  messageToEvent,
  openPlannerEnv,
  searchFts,
} from "./openplanner-client.js";

// ============================================================================
// Types and Interfaces
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
  OPENPLANNER_API_KEY?: string;
  OPENCODE_THROTTLE_MS: number;
  LEVEL_DIR: string;
  BATCH_SIZE: number;
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
// Environment Configuration
// ============================================================================

export function env(): Env {
  const opEnv = openPlannerEnv();

  return {
    OPENCODE_BASE_URL: process.env.OPENCODE_BASE_URL ?? "http://localhost:4096",
    OPENPLANNER_URL: opEnv.OPENPLANNER_URL,
    OPENPLANNER_API_KEY: opEnv.OPENPLANNER_API_KEY,
    OPENCODE_THROTTLE_MS: Number(process.env.OPENCODE_THROTTLE_MS ?? "200"),
    LEVEL_DIR: process.env.LEVEL_DIR ?? ".reconstitute/level",
    BATCH_SIZE: Number(process.env.BATCH_SIZE ?? "32"),
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export function flattenForEmbedding(ollamaMsgs: OllamaMessage[]): string {
  const lines: string[] = [];
  for (const m of ollamaMsgs) {
    if (m.role === "tool") {
      lines.push(`[tool:${m.tool_name}] ${m.content}`);
    } else if (m.role === "assistant" && "tool_calls" in m && m.tool_calls?.length) {
      for (const tc of m.tool_calls) {
        lines.push(`[tool_call:${tc.function.name}] ${JSON.stringify(tc.function.arguments)}`);
      }
    } else {
      lines.push(`[${m.role}] ${("content" in m && m.content) ? m.content : ""}`);
    }
  }
  return lines.join("\n");
}

export function extractPathsLoose(text: string): string[] {
  const paths = new Set<string>();
  const re = /(^|[\s"'`(])((?:\.{0,2}\/)?(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+)(?=$|[\s"'`),.:;])/g;
  for (const m of text.matchAll(re)) paths.add(m[2]);
  return [...paths];
}

export function opencodeMessageToOllamaParts(entry: any): OllamaMessage[] {
  const info = entry?.info ?? {};
  const parts: any[] = entry?.parts ?? [];

  const roleRaw = info.role ?? info.type ?? "assistant";
  const role: "user" | "assistant" | "system" =
    roleRaw === "user" ? "user" : roleRaw === "system" ? "system" : "assistant";

  const textChunks: string[] = [];
  const toolCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
  const toolResults: Array<{ name: string; output: string }> = [];

  for (const p of parts) {
    if (p?.type === "text" && typeof p.text === "string") {
      textChunks.push(p.text);
      continue;
    }

    const toolName = p?.tool_name ?? p?.name ?? p?.tool?.name ?? p?.function?.name;
    const toolArgs = p?.arguments ?? p?.args ?? p?.input ?? p?.tool?.input ?? p?.function?.arguments;
    const toolOut = p?.output ?? p?.result ?? p?.content ?? p?.tool?.output;

    if (toolName && toolArgs && typeof toolArgs === "object" && !Array.isArray(toolArgs)) {
      toolCalls.push({ name: String(toolName), args: toolArgs as Record<string, unknown> });
      if (typeof toolOut === "string") toolResults.push({ name: String(toolName), output: toolOut });
      else if (toolOut != null) toolResults.push({ name: String(toolName), output: JSON.stringify(toolOut) });
      continue;
    }

    textChunks.push(`[opencode_part:${p?.type ?? "unknown"}] ${JSON.stringify(p)}`);
  }

  const msgs: OllamaMessage[] = [];
  const content = textChunks.join("\n").trim();

  if (toolCalls.length) {
    msgs.push({
      role: "assistant",
      content: content || undefined,
      tool_calls: toolCalls.map((tc, i) => ({
        type: "function",
        function: { index: i, name: tc.name, arguments: tc.args },
      })),
    });
    for (const tr of toolResults) msgs.push({ role: "tool", tool_name: tr.name, content: tr.output });
  } else {
    msgs.push({ role, content: content });
  }

  return msgs;
}

function unwrap<T>(resp: any): T {
  if (resp && typeof resp === "object" && "data" in resp) {
    return unwrap(resp.data);
  }
  return resp as T;
}

// ============================================================================
// Index Command
// ============================================================================

export async function indexSessions(): Promise<void> {
  const E = env();

  console.log("Starting OpenCode session indexing...");
  console.log(`OpenPlanner URL: ${E.OPENPLANNER_URL}`);
  console.log(`OpenCode URL: ${E.OPENCODE_BASE_URL}`);
  console.log(`Batch size: ${E.BATCH_SIZE}`);
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
  const sessionsResp = await client.session.list();
  const sessions = unwrap<any[]>(sessionsResp);
  console.log(`sessionsResp: ${JSON.stringify(sessionsResp)}`);
  console.log(`sessions: ${JSON.stringify(sessions)}`);
  console.log(`Found ${sessions?.length} sessions`);

  let totalRecords = 0;

  for (const s of sessions) {
    const sessionId = s.id;
    if (!sessionId) continue;

    const sessionTitle = s.title ?? "";
    await throttleOpencode();
    const messages = unwrap<any[]>(await client.session.messages({ path: { id: sessionId } }));

    await db.put(`sess:${sessionId}:meta`, { id: sessionId, title: sessionTitle });
    const idsInOrder: string[] = [];
    const eventsToIndex: any[] = [];

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
      if (prevHash === docHash) continue;

      const paths = extractPathsLoose(doc);
      
      const event = messageToEvent({
        sessionId,
        messageId: msgId,
        messageIndex: i,
        text: doc,
        createdAt,
        role: entry?.info?.role ?? entry?.info?.type ?? "assistant",
        sessionTitle,
        paths,
      });

      eventsToIndex.push(event);
      await db.put(`msg:${rowId}:hash`, docHash);
      await db.put(`msg:${rowId}:ollama`, ollamaMsgs);
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
// Search Command
// ============================================================================

export async function searchSessions(args: SearchArgs): Promise<void> {
  const E = env();

  console.log("Searching OpenCode sessions via OpenPlanner...");
  console.log(`Query: "${args.query}"`);
  console.log(`Top-K: ${args.k}`);
  if (args.session) console.log(`Session filter: ${args.session}`);
  console.log("");

  const results = await searchFts(args.query, {
    limit: args.k,
    session: args.session,
  });

  console.log(formatSearchResults(results));
}

// ============================================================================
// CLI Argument Parsing
// ============================================================================

export function parseCliArgs(argv: string[]): CliArgs {
  const command = argv[0]?.toLowerCase();

  if (command === "help" || command === "--help" || command === "-h" || !command) {
    return { command: "help" };
  }

  if (command === "index") {
    return { command: "index" };
  }

  if (command === "search") {
    const args: SearchArgs = { query: "", k: 10, session: undefined };
    const positional: string[] = [];

    for (let i = 1; i < argv.length; i++) {
      const a = argv[i];
      if (a === "--k") {
        args.k = Number(argv[++i] ?? "10");
      } else if (a === "--session" || a === "-s") {
        args.session = argv[++i] ?? undefined;
      } else {
        positional.push(a);
      }
    }

    args.query = positional.join(" ").trim();
    if (!args.query) {
      throw new Error(
        "Missing query string for search command.\nExample: pnpm -C packages/reconstituter opencode-sessions search \"my query\""
      );
    }

    return { command: "search", searchArgs: args };
  }

  throw new Error(`Unknown command: ${command}\nUse 'index', 'search', or 'help'`);
}

// ============================================================================
// Main Entry Point
// ============================================================================

function showHelp(): void {
  console.log(`
OpenCode Sessions CLI

A unified tool for indexing and searching OpenCode sessions using OpenPlanner events.

USAGE
  pnpm -C packages/reconstituter opencode-sessions <command> [options]

COMMANDS
  index                 Index all OpenCode sessions into OpenPlanner
  search <query>        Search indexed sessions using OpenPlanner FTS
  help                  Show this help message

SEARCH OPTIONS
  --k <number>          Number of results to return (default: 10)
  --session, -s <id>    Filter results to specific session ID

EXAMPLES
  # Index all sessions
  pnpm -C packages/reconstituter opencode-sessions index

  # Search for relevant sessions
  pnpm -C packages/reconstituter opencode-sessions search "how does authentication work"

  # Get more results
  pnpm -C packages/reconstituter opencode-sessions search "error handling patterns" --k 20

  # Filter by specific session
  pnpm -C packages/reconstituter opencode-sessions search "api design" --session ses_abc123

ENVIRONMENT VARIABLES
  OPENCODE_BASE_URL     OpenCode server URL (default: http://localhost:4096)
  OPENPLANNER_URL       OpenPlanner server URL (default: http://localhost:7777)
  OPENPLANNER_API_KEY   OpenPlanner API key (optional)
  OPENCODE_THROTTLE_MS  Minimum delay between OpenCode API calls (default: 200)
  LEVEL_DIR             LevelDB directory (default: .reconstitute/level)
  BATCH_SIZE            Batch size for indexing (default: 32)
`);
}

async function main(): Promise<void> {
  try {
    const args = parseCliArgs(process.argv.slice(2));

    switch (args.command) {
      case "help":
        showHelp();
        break;

      case "index":
        await indexSessions();
        break;

      case "search":
        if (!args.searchArgs) {
          throw new Error("Search arguments missing");
        }
        await searchSessions(args.searchArgs);
        break;

      default:
        throw new Error(`Unknown command: ${args.command}`);
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

const entryHref = pathToFileURL(process.argv[1] ?? "").href;
if (entryHref === import.meta.url) {
  main();
}

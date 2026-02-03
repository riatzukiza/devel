/**
 * opencode-sessions.ts
 *
 * Unified CLI for managing OpenCode sessions with ChromaDB embeddings.
 *
 * Commands:
 *   index         Index all OpenCode sessions into ChromaDB
 *   search        Search indexed sessions using semantic similarity
 *   help          Show this help message
 *
 * Usage:
 *   pnpm -C packages/reconstituter opencode-sessions index
 *   pnpm -C packages/reconstituter opencode-sessions search "your query here" --k 10 --session <session_id>
 *   pnpm -C packages/reconstituter opencode-sessions help
 *
 * Environment:
 *   OPENCODE_BASE_URL     - OpenCode server URL (default: http://localhost:4096)
 *   CHROMA_URL           - Chroma server URL (default: http://localhost:8000)
 *   CHROMA_COLLECTION    - Chroma collection name (default: opencode_messages_v1)
 *   CHROMA_TENANT        - Chroma tenant (optional)
 *   CHROMA_DATABASE      - Chroma database (optional)
 *   CHROMA_TOKEN         - Chroma auth token (optional)
 *   LEVEL_DIR            - LevelDB directory (default: .reconstitute/level)
 *   OLLAMA_URL           - Ollama server URL (default: http://localhost:11434)
 *   OLLAMA_EMBED_MODEL   - Embedding model (default: qwen3-embedding:8b)
 *   OLLAMA_NUM_CTX       - Context length (default: 32768)
 *   BATCH_SIZE           - Batch size for embedding (default: 32)
 *   EMBED_TTL_MS         - Embed cache TTL in ms (default: 30 days)
 */
import "dotenv/config";

import { ChromaClient } from "chromadb";
import { createOpencodeClient } from "@opencode-ai/sdk";
import { Level } from "level";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";

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
  CHROMA_URL: string;
  CHROMA_TENANT?: string;
  CHROMA_DATABASE?: string;
  CHROMA_TOKEN?: string;
  CHROMA_COLLECTION: string;
  LEVEL_DIR: string;
  OLLAMA_URL: string;
  OLLAMA_EMBED_MODEL: string;
  OLLAMA_NUM_CTX: number;
  BATCH_SIZE: number;
  EMBED_TTL_MS: number;
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
  return {
    OPENCODE_BASE_URL: process.env.OPENCODE_BASE_URL ?? "http://localhost:4096",
    CHROMA_URL: process.env.CHROMA_URL ?? "http://localhost:8000",
    CHROMA_TENANT: process.env.CHROMA_TENANT,
    CHROMA_DATABASE: process.env.CHROMA_DATABASE,
    CHROMA_TOKEN: process.env.CHROMA_TOKEN,
    CHROMA_COLLECTION: process.env.CHROMA_COLLECTION ?? "opencode_messages_v1",
    LEVEL_DIR: process.env.LEVEL_DIR ?? ".reconstitute/level",
    OLLAMA_URL: process.env.OLLAMA_URL ?? "http://localhost:11434",
    OLLAMA_EMBED_MODEL: process.env.OLLAMA_EMBED_MODEL ?? "qwen3-embedding:8b",
    OLLAMA_NUM_CTX: Number(process.env.OLLAMA_NUM_CTX ?? "32768"),
    BATCH_SIZE: Number(process.env.BATCH_SIZE ?? "32"),
    EMBED_TTL_MS: Number(process.env.EMBED_TTL_MS ?? `${1000 * 60 * 60 * 24 * 30}`),
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

async function ttlGet<T>(db: Level<string, any>, key: string): Promise<T | null> {
  try {
    const v = await db.get(key);
    if (!v) return null;
    if (typeof v.expiresAt === "number" && Date.now() > v.expiresAt) return null;
    return v.value as T;
  } catch {
    return null;
  }
}

async function ttlSet<T>(db: Level<string, any>, key: string, value: T, ttlMs: number) {
  await db.put(key, { value, expiresAt: Date.now() + ttlMs });
}

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
  return (resp && typeof resp === "object" && "data" in resp) ? (resp.data as T) : (resp as T);
}

// ============================================================================
// Embedding Functions
// ============================================================================

async function ollamaEmbedMany(E: Env, db: Level<string, any>, inputs: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (const input of inputs) {
    const text = input ?? "";
    const ck = `cache:embed:${E.OLLAMA_EMBED_MODEL}:${sha256(text)}`;
    const cached = await ttlGet<number[]>(db, ck);
    if (cached) {
      embeddings.push(cached);
      continue;
    }

    const resp = await fetch(`${E.OLLAMA_URL}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: E.OLLAMA_EMBED_MODEL,
        input: text,
        truncate: true,
        options: { num_ctx: E.OLLAMA_NUM_CTX },
      }),
    });

    if (!resp.ok) throw new Error(`Ollama embed failed: ${resp.status} ${await resp.text()}`);
    const json = (await resp.json()) as { embeddings?: number[][] };
    const emb = json.embeddings?.[0] as number[];
    if (!emb || !Array.isArray(emb)) throw new Error(`Invalid embed response: ${JSON.stringify(json).slice(0, 200)}`);

    await ttlSet(db, ck, emb, E.EMBED_TTL_MS);
    embeddings.push(emb);
  }

  return embeddings;
}

async function ollamaEmbedOne(E: Env, input: string): Promise<number[]> {
  const resp = await fetch(`${E.OLLAMA_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: E.OLLAMA_EMBED_MODEL,
      input,
      truncate: true,
      options: { num_ctx: E.OLLAMA_NUM_CTX },
    }),
  });

  if (!resp.ok) throw new Error(`Ollama embed failed: ${resp.status} ${await resp.text()}`);
  const json = (await resp.json()) as { embeddings?: number[][] };
  const emb = json.embeddings?.[0] as number[];
  if (!emb || !Array.isArray(emb)) throw new Error(`Invalid embed response: ${JSON.stringify(json).slice(0, 200)}`);

  return emb;
}

// ============================================================================
// Index Command
// ============================================================================

export async function indexSessions(): Promise<void> {
  const E = env();

  console.log("Starting OpenCode session indexing...");
  console.log(`Chroma URL: ${E.CHROMA_URL}`);
  console.log(`Collection: ${E.CHROMA_COLLECTION}`);
  console.log(`Ollama URL: ${E.OLLAMA_URL}`);
  console.log(`Embedding model: ${E.OLLAMA_EMBED_MODEL}`);
  console.log(`Batch size: ${E.BATCH_SIZE}`);
  console.log("");

  const client = createOpencodeClient({ baseUrl: E.OPENCODE_BASE_URL });
  const chroma = new ChromaClient({
    path: E.CHROMA_URL,
    ...(E.CHROMA_TENANT ? { tenant: E.CHROMA_TENANT } : {}),
    ...(E.CHROMA_DATABASE ? { database: E.CHROMA_DATABASE } : {}),
    ...(E.CHROMA_TOKEN
      ? {
          auth: {
            provider: "token",
            credentials: E.CHROMA_TOKEN,
            tokenHeaderType: "AUTHORIZATION",
          },
        }
      : {}),
  });

  const collection = await chroma.getOrCreateCollection({
    name: E.CHROMA_COLLECTION,
    metadata: { description: "OpenCode sessions indexed for reconstitute", source: "opencode" },
  });

  const db = new Level<string, any>(E.LEVEL_DIR, { valueEncoding: "json" });

  const sessions = unwrap<any[]>(await client.session.list());
  console.log(`Found ${sessions.length} sessions`);

  let totalRecords = 0;

  for (const s of sessions) {
    const sessionId = s.id;
    if (!sessionId) continue;

    const sessionTitle = s.title ?? "";
    const messages = unwrap<any[]>(await client.session.messages({ path: { id: sessionId } }));

    await db.put(`sess:${sessionId}:meta`, { id: sessionId, title: sessionTitle });
    const idsInOrder: string[] = [];

    const docsToEmbed: string[] = [];
    const metas: any[] = [];
    const ids: string[] = [];
    const ollamaBlobs: Record<string, OllamaMessage[]> = {};

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

      ollamaBlobs[rowId] = ollamaMsgs;

      const paths = extractPathsLoose(doc);

      ids.push(rowId);
      docsToEmbed.push(doc);
      metas.push({
        session_id: sessionId,
        session_title: sessionTitle,
        message_id: msgId,
        message_index: i,
        role: entry?.info?.role ?? entry?.info?.type ?? "assistant",
        created_at: createdAt,
        paths: paths.join("|"),
      });

      await db.put(`msg:${rowId}:hash`, docHash);
    }

    await db.put(`sess:${sessionId}:order`, idsInOrder);

    for (let start = 0; start < docsToEmbed.length; start += E.BATCH_SIZE) {
      const batchDocs = docsToEmbed.slice(start, start + E.BATCH_SIZE);
      const batchIds = ids.slice(start, start + E.BATCH_SIZE);
      const batchMetas = metas.slice(start, start + E.BATCH_SIZE);

      const embeddings = await ollamaEmbedMany(E, db, batchDocs);

      await collection.upsert({
        ids: batchIds,
        embeddings,
        documents: batchDocs,
        metadatas: batchMetas,
      });

      for (const id of batchIds) {
        if (ollamaBlobs[id]) await db.put(`msg:${id}:ollama`, ollamaBlobs[id]);
      }

      totalRecords += batchIds.length;
      console.log(`Upserted ${batchIds.length} rows to ${E.CHROMA_COLLECTION} (total: ${totalRecords})`);
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

  console.log("Searching OpenCode sessions...");
  console.log(`Query: "${args.query}"`);
  console.log(`Top-K: ${args.k}`);
  if (args.session) console.log(`Session filter: ${args.session}`);
  console.log(`Collection: ${E.CHROMA_COLLECTION}`);
  console.log("");

  const chroma = new ChromaClient({
    path: E.CHROMA_URL,
    ...(E.CHROMA_TENANT ? { tenant: E.CHROMA_TENANT } : {}),
    ...(E.CHROMA_DATABASE ? { database: E.CHROMA_DATABASE } : {}),
    ...(E.CHROMA_TOKEN
      ? {
          auth: {
            provider: "token",
            credentials: E.CHROMA_TOKEN,
            tokenHeaderType: "AUTHORIZATION",
          },
        }
      : {}),
  });

  const collection = await chroma.getOrCreateCollection({ name: E.CHROMA_COLLECTION });

  const qEmb = await ollamaEmbedOne(E, args.query);
  const where = args.session ? { session_id: args.session } : undefined;

  const res = await collection.query({
    queryEmbeddings: [qEmb],
    nResults: args.k,
    where,
    include: ["documents", "metadatas", "distances"] as any[],
  });

  const ids = (res?.ids?.[0] ?? []);
  const docs = (res?.documents?.[0] ?? []);
  const metas = (res?.metadatas?.[0] ?? []);
  const dists = (res?.distances?.[0] ?? []);

  if (!ids.length) {
    console.log("No matches found.");
    return;
  }

  console.log(`Found ${ids.length} results:\n`);

  const grouped = new Map<string, Array<{ id: string; dist: number; doc: string; meta: any }>>();
  for (let i = 0; i < ids.length; i++) {
    const meta = metas[i] ?? {};
    const sid = String(meta.session_id ?? "unknown");
    const arr = grouped.get(sid) ?? [];
    arr.push({ id: ids[i], dist: dists[i] ?? 0, doc: docs[i] ?? "", meta });
    grouped.set(sid, arr);
  }

  for (const [sid, items] of grouped.entries()) {
    console.log(`=== session_id: ${sid} (hits: ${items.length}) ===`);
    for (const it of items) {
      const mi = it.meta?.message_index ?? "?";
      const role = it.meta?.role ?? "?";
      const createdAt = it.meta?.created_at ?? "";
      const title = it.meta?.session_title ?? "";
      const paths = it.meta?.paths ?? "";

      console.log(`\n--- Result ---`);
      console.log(`ID: ${it.id}`);
      console.log(`Distance: ${it.dist.toFixed(4)}`);
      console.log(`Message Index: ${mi}`);
      console.log(`Role: ${role}`);
      console.log(`Session Title: ${title}`);
      console.log(`Created: ${new Date(createdAt).toISOString()}`);
      if (paths) console.log(`Paths: ${paths.replace(/\|/g, ", ")}`);
      console.log(`\n${it.doc}\n`);
    }
  }
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

A unified tool for indexing and searching OpenCode sessions using ChromaDB embeddings.

USAGE
  pnpm -C packages/reconstituter opencode-sessions <command> [options]

COMMANDS
  index                 Index all OpenCode sessions into ChromaDB
  search <query>        Search indexed sessions using semantic similarity
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
  CHROMA_URL            ChromaDB server URL (default: http://localhost:8000)
  CHROMA_COLLECTION     Chroma collection name (default: opencode_messages_v1)
  CHROMA_TENANT         Chroma tenant (optional)
  CHROMA_DATABASE       Chroma database (optional)
  CHROMA_TOKEN          Chroma auth token (optional)
  LEVEL_DIR             LevelDB directory (default: .reconstitute/level)
  OLLAMA_URL            Ollama server URL (default: http://localhost:11434)
  OLLAMA_EMBED_MODEL    Embedding model (default: qwen3-embedding:8b)
  OLLAMA_NUM_CTX        Context length (default: 32768)
  BATCH_SIZE            Batch size for embedding (default: 32)
  EMBED_TTL_MS          Embed cache TTL in ms (default: 30 days)
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

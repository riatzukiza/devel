/**
 * index_opencode_sessions.ts
 *
 * Indexes OpenCode sessions into Chroma + LevelDB for reconstitute workflow.
 *
 * Usage:
 *   pnpm tsx index_opencode_sessions.ts
 *
 * Environment:
 *   OPENCODE_BASE_URL     - OpenCode server URL (default: http://localhost:4096)
 *   CHROMA_URL           - Chroma server URL (default: http://localhost:8000)
 *   CHROMA_COLLECTION    - Chroma collection base name (default: opencode_messages_v1)
 *   LEVEL_DIR            - LevelDB directory (default: .reconstitute/level)
 *   OLLAMA_URL           - Ollama server URL (default: http://localhost:11434)
 *   OLLAMA_EMBED_MODEL   - Embedding model (default: qwen3-embedding:8b)
 *   OLLAMA_NUM_CTX       - Context length (default: 32768)
 *   BATCH_SIZE           - Batch size for embedding (default: 32)
 *   EMBED_TTL_MS         - Embed cache TTL in ms (default: 30 days)
 */
import "dotenv/config";

import { ChromaClient, IncludeEnum } from "chromadb";
import { createOpencodeClient } from "@opencode-ai/sdk";
import { Level } from "level";
import crypto from "node:crypto";

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

type OllamaMessage =
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

interface Env {
  OPENCODE_BASE_URL: string;
  CHROMA_URL: string;
  CHROMA_TENANT?: string;
  CHROMA_DATABASE?: string;
  CHROMA_TOKEN?: string;
  CHROMA_COLLECTION_BASE: string;
  CHROMA_COLLECTION: string;
  LEVEL_DIR: string;
  OLLAMA_URL: string;
  OLLAMA_EMBED_MODEL: string;
  OLLAMA_NUM_CTX: number;
  BATCH_SIZE: number;
  EMBED_TTL_MS: number;
}

function env(): Env {
  const baseCollection = process.env.CHROMA_COLLECTION ?? "opencode_messages_v1";
  const embedModel = process.env.OLLAMA_EMBED_MODEL ?? "qwen3-embedding:8b";

  return {
    OPENCODE_BASE_URL: process.env.OPENCODE_BASE_URL ?? "http://localhost:4096",
    CHROMA_URL: process.env.CHROMA_URL ?? "http://localhost:8000",
    CHROMA_TENANT: process.env.CHROMA_TENANT,
    CHROMA_DATABASE: process.env.CHROMA_DATABASE,
    CHROMA_TOKEN: process.env.CHROMA_TOKEN,
    CHROMA_COLLECTION_BASE: baseCollection,
    CHROMA_COLLECTION: saltCollectionName(baseCollection, embedModel),
    LEVEL_DIR: process.env.LEVEL_DIR ?? ".reconstitute/level",
    OLLAMA_URL: process.env.OLLAMA_URL ?? "http://localhost:11434",
    OLLAMA_EMBED_MODEL: embedModel,
    OLLAMA_NUM_CTX: Number(process.env.OLLAMA_NUM_CTX ?? "32768"),
    BATCH_SIZE: Number(process.env.BATCH_SIZE ?? "32"),
    EMBED_TTL_MS: Number(process.env.EMBED_TTL_MS ?? `${1000 * 60 * 60 * 24 * 30}`),
  };
}

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function sanitizeModelSuffix(model: string): string {
  const normalized = model.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const trimmed = normalized.replace(/^_+|_+$/g, "");
  return trimmed || "model";
}

function saltCollectionName(base: string, model: string): string {
  const suffix = sanitizeModelSuffix(model);
  const token = `__${suffix}`;
  return base.endsWith(token) ? base : `${base}${token}`;
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

    // Fetch fresh embedding
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

function flattenForEmbedding(ollamaMsgs: OllamaMessage[]): string {
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

function extractPathsLoose(text: string): string[] {
  const paths = new Set<string>();
  const re = /(^|[\s"'`(])((?:\.{0,2}\/)?(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+)(?=$|[\s"'`),.:;])/g;
  for (const m of text.matchAll(re)) paths.add(m[2]);
  return [...paths];
}

function opencodeMessageToOllamaParts(entry: any): OllamaMessage[] {
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

async function main() {
  const E = env();

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
    embeddingFunction: null,
    metadata: { description: "OpenCode sessions indexed for reconstitute", source: "opencode" },
  });

  const db = new Level<string, any>(E.LEVEL_DIR, { valueEncoding: "json" });

  const sessions = unwrap<any[]>(await client.session.list());
  console.log(`Found ${sessions.length} sessions`);
  console.log(`Collection: ${E.CHROMA_COLLECTION}`);
  console.log(`Collection base: ${E.CHROMA_COLLECTION_BASE}`);

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
  console.log(`Done. Total records indexed: ${totalRecords}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

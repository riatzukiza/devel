"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * search_opencode_sessions.ts
 *
 * Usage:
 *   pnpm tsx search_opencode_sessions.ts "why is my visibility state unknown?"
 *
 * Options:
 *   --k 20
 *   --session <session_id>     (optional metadata filter)
 */
require("dotenv/config");
const chromadb_1 = require("chromadb");
function sanitizeModelSuffix(model) {
    const normalized = model.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const trimmed = normalized.replace(/^_+|_+$/g, "");
    return trimmed || "model";
}
function saltCollectionName(base, model) {
    const suffix = sanitizeModelSuffix(model);
    const token = `__${suffix}`;
    return base.endsWith(token) ? base : `${base}${token}`;
}
function mustEnv(name) {
    const v = process.env[name];
    if (!v)
        throw new Error(`Missing env var: ${name}`);
    return v;
}
function envInt(name, fallback) {
    const v = process.env[name];
    if (!v)
        return fallback;
    const n = Number(v);
    if (!Number.isFinite(n))
        return fallback;
    return n;
}
async function ollamaEmbedOne(input) {
    const ollamaUrl = mustEnv("OLLAMA_URL");
    const model = mustEnv("OLLAMA_EMBED_MODEL");
    const numCtx = envInt("OLLAMA_NUM_CTX", 32768);
    const resp = await fetch(`${ollamaUrl.replace(/\/$/, "")}/api/embed`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            model,
            input,
            options: { num_ctx: numCtx },
            truncate: true,
        }),
    });
    if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        throw new Error(`Ollama embed failed: ${resp.status} ${resp.statusText}\n${body}`);
    }
    const json = (await resp.json());
    const embeddings = json?.embeddings;
    if (!Array.isArray(embeddings) || !Array.isArray(embeddings[0])) {
        throw new Error(`Unexpected Ollama embed response: ${JSON.stringify(json).slice(0, 500)}`);
    }
    return embeddings[0];
}
function parseArgs(argv) {
    const args = { query: "", k: 10, session: "" };
    const positional = [];
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === "--k")
            args.k = Number(argv[++i] ?? "10");
        else if (a === "--session")
            args.session = argv[++i] ?? "";
        else
            positional.push(a);
    }
    args.query = positional.join(" ").trim();
    if (!args.query)
        throw new Error(`Missing query string.\nExample: pnpm tsx search_opencode_sessions.ts "my query"`);
    if (!Number.isFinite(args.k) || args.k <= 0)
        args.k = 10;
    return args;
}
async function main() {
    const { query, k, session } = parseArgs(process.argv.slice(2));
    const chromaUrl = mustEnv("CHROMA_URL");
    const chromaToken = process.env.CHROMA_TOKEN || undefined;
    const tenant = process.env.CHROMA_TENANT || "default_tenant";
    const database = process.env.CHROMA_DATABASE || "default_database";
    const collectionBase = process.env.CHROMA_COLLECTION || "opencode_sessions";
    const embedModel = mustEnv("OLLAMA_EMBED_MODEL");
    const collectionName = saltCollectionName(collectionBase, embedModel);
    const chroma = new chromadb_1.ChromaClient({
        path: chromaUrl,
        tenant,
        database,
        ...(chromaToken
            ? {
                auth: {
                    provider: "token",
                    credentials: chromaToken,
                    tokenHeaderType: "AUTHORIZATION",
                },
            }
            : {}),
    });
    const collection = await chroma.getOrCreateCollection({
        name: collectionName,
        embeddingFunction: null,
    });
    const qEmb = await ollamaEmbedOne(query);
    const where = session ? { session_id: session } : undefined;
    const anyCol = collection;
    const res = await anyCol.query({
        queryEmbeddings: [qEmb],
        nResults: k,
        where,
        include: ["documents", "metadatas", "distances", "ids"],
    });
    const ids = (res?.ids?.[0] ?? []);
    const docs = (res?.documents?.[0] ?? []);
    const metas = (res?.metadatas?.[0] ?? []);
    const dists = (res?.distances?.[0] ?? []);
    if (!ids.length) {
        console.log("No matches.");
        return;
    }
    const grouped = new Map();
    for (let i = 0; i < ids.length; i++) {
        const meta = metas[i] ?? {};
        const sid = String(meta.session_id ?? "unknown");
        const arr = grouped.get(sid) ?? [];
        arr.push({ id: ids[i], dist: dists[i], doc: docs[i], meta });
        grouped.set(sid, arr);
    }
    for (const [sid, items] of grouped.entries()) {
        console.log(`\n=== session_id: ${sid} (hits: ${items.length}) ===`);
        for (const it of items) {
            const mi = it.meta?.message_index ?? "?";
            const role = it.meta?.role ?? "?";
            const createdAt = it.meta?.created_at ?? "";
            const model = it.meta?.model ?? "";
            console.log(`\n- id=${it.id}\n  dist=${it.dist}\n  message_index=${mi}\n  role=${role}\n  created_at=${createdAt}\n  model=${model}\n`);
            console.log(it.doc);
        }
    }
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});

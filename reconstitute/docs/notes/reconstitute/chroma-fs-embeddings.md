Below is a **single-file Node.js CLI** that:

* walks a directory
* chunks text-ish files
* generates embeddings via **Ollama** (`/api/embed`)
* stores them in **Chroma** (running as a server)
* supports `index` + `search`

It uses the Chroma JS client (`ChromaClient`) and Chroma’s JS/TS-style params like `queryTexts`, `queryEmbeddings`, `nResults`. ([Chroma Docs][1])

---

## 0) Run Chroma + Ollama

### Chroma server (Docker)

```bash
docker run -p 8000:8000 -v ./chroma-data:/data chromadb/chroma
```

([Chroma Docs][2])

### Ollama

Make sure Ollama is running (default `http://localhost:11434`), and pull an embedding model you want (example name shown):

```bash
ollama pull qwen3-embedding
```

---

## 1) Install JS deps

```bash
npm i chromadb
```

---

## 2) Save this as `chroma-fs.mjs`

```js
#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import process from "node:process";
import { ChromaClient } from "chromadb";

/**
 * chroma-fs.mjs
 *
 * Index:
 *   node chroma-fs.mjs index ./myrepo --collection myrepo --model qwen3-embedding
 *
 * Search:
 *   node chroma-fs.mjs search "where do we init websocket client" --collection myrepo --k 8
 *
 * Options:
 *   --chroma  http://localhost:8000
 *   --ollama  http://localhost:11434
 *   --model   qwen3-embedding
 *   --collection name
 *   --chunk   2200
 *   --overlap 250
 *   --ext     .md,.txt,.js,.ts,.json,.clj,.cljs,.py,.go,.rs,.java,.yml,.yaml,.toml
 *   --ignore  node_modules,.git,dist,build,target,.next,.cache,chroma-data
 *   --clean   (for index) delete all docs for this root+collection before indexing
 */

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const k = a.slice(2);
      const v = argv[i + 1];
      if (!v || v.startsWith("--")) out[k] = true;
      else out[k] = v, i++;
    } else {
      out._.push(a);
    }
  }
  return out;
}

function sha1(s) {
  return crypto.createHash("sha1").update(s).digest("hex");
}

function isProbablyBinary(buf) {
  // Heuristic: null byte => binary
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0) return true;
  }
  return false;
}

function chunkText(text, chunkSize, overlap) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(text.length, i + chunkSize);
    const chunk = text.slice(i, end);
    chunks.push({ chunk, start: i, end });
    if (end === text.length) break;
    i = Math.max(0, end - overlap);
  }
  return chunks;
}

async function* walkDir(rootAbs, ignoreSet) {
  const stack = [rootAbs];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const abs = path.join(dir, ent.name);
      const relFromRoot = path.relative(rootAbs, abs);
      const top = relFromRoot.split(path.sep)[0];
      if (ignoreSet.has(ent.name) || ignoreSet.has(top)) continue;

      if (ent.isDirectory()) stack.push(abs);
      else if (ent.isFile()) yield abs;
    }
  }
}

async function ollamaEmbed({ ollamaBaseUrl, model, inputs }) {
  // Ollama embed endpoint:
  // POST { model, input: string | string[] } -> { embeddings: number[][], ... }
  const url = new URL("/api/embed", ollamaBaseUrl).toString();
  const resp = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model, input: inputs }),
  });
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`Ollama /api/embed failed: ${resp.status} ${resp.statusText}\n${t}`);
  }
  const json = await resp.json();
  if (!json?.embeddings?.length) throw new Error("Ollama response missing embeddings");
  return json.embeddings;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];

  const chromaUrl = args.chroma ?? "http://localhost:8000";
  const ollamaUrl = args.ollama ?? "http://localhost:11434";
  const model = args.model ?? "qwen3-embedding";
  const collectionName = args.collection ?? "fs";

  const chunkSize = Number(args.chunk ?? 2200);
  const overlap = Number(args.overlap ?? 250);
  const k = Number(args.k ?? 8);

  const extList = (args.ext ??
    ".md,.txt,.js,.ts,.jsx,.tsx,.json,.clj,.cljs,.edn,.py,.go,.rs,.java,.yml,.yaml,.toml,.sql,.html,.css"
  )
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const ignoreSet = new Set(
    (args.ignore ?? "node_modules,.git,dist,build,target,.next,.cache,chroma-data")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );

  if (!cmd || (cmd !== "index" && cmd !== "search")) {
    console.error("Usage:\n  index <dir>\n  search <query>\n\nRun with --help by reading the header comment in the script.");
    process.exit(2);
  }

  // Chroma JS client (client-server mode)
  const client = new ChromaClient({ path: chromaUrl });

  // Use cosine distance for embeddings
  const collection = await client.getOrCreateCollection({
    name: collectionName,
    metadata: { "hnsw:space": "cosine" },
  });

  if (cmd === "index") {
    const dir = args._[1] ?? ".";
    const rootAbs = path.resolve(dir);

    if (args.clean) {
      console.log(`[clean] deleting where root=${rootAbs}`);
      await collection.delete({ where: { root: rootAbs } });
    }

    console.log(`[index] root=${rootAbs}`);
    console.log(`[index] collection=${collectionName} chroma=${chromaUrl} ollama=${ollamaUrl} model=${model}`);
    console.log(`[index] chunk=${chunkSize} overlap=${overlap} ext=${extList.length} ignore=${ignoreSet.size}`);

    let files = 0;
    let chunksTotal = 0;
    let skipped = 0;

    for await (const fileAbs of walkDir(rootAbs, ignoreSet)) {
      const ext = path.extname(fileAbs).toLowerCase();
      if (!extList.includes(ext)) continue;

      let buf;
      try {
        buf = await fs.readFile(fileAbs);
      } catch {
        skipped++;
        continue;
      }
      if (isProbablyBinary(buf)) {
        skipped++;
        continue;
      }

      const text = buf.toString("utf8");
      const stat = await fs.stat(fileAbs).catch(() => null);
      if (!stat) {
        skipped++;
        continue;
      }

      const rel = path.relative(rootAbs, fileAbs);
      const parts = chunkText(text, chunkSize, overlap);
      if (!parts.length) continue;

      // Delete previous chunks for this file path, then re-add.
      // This keeps the collection "fresh" even when files change.
      await collection.delete({ where: { root: rootAbs, path: rel } });

      // Embed in small batches to keep requests reasonable
      const batchSize = 16;
      const ids = [];
      const documents = [];
      const metadatas = [];
      const embeddings = [];

      for (let i = 0; i < parts.length; i += batchSize) {
        const batch = parts.slice(i, i + batchSize);
        const batchDocs = batch.map((p) => p.chunk);

        const batchEmb = await ollamaEmbed({
          ollamaBaseUrl: ollamaUrl,
          model,
          inputs: batchDocs,
        });

        for (let j = 0; j < batch.length; j++) {
          const chunkIndex = i + j;
          const id = `${sha1(rootAbs)}:${sha1(rel)}:${chunkIndex}`;
          ids.push(id);
          documents.push(batchDocs[j]);
          embeddings.push(batchEmb[j]);
          metadatas.push({
            root: rootAbs,
            path: rel,
            chunk: chunkIndex,
            ext,
            bytes: stat.size,
            mtimeMs: stat.mtimeMs,
            start: batch[j].start,
            end: batch[j].end,
          });
        }
      }

      await collection.add({ ids, documents, metadatas, embeddings });

      files++;
      chunksTotal += parts.length;

      if (files % 25 === 0) {
        console.log(`[index] files=${files} chunks=${chunksTotal} skipped=${skipped}`);
      }
    }

    console.log(`[done] files=${files} chunks=${chunksTotal} skipped=${skipped}`);
    console.log(`[done] Tip: use --clean if you want to wipe and fully rebuild for this root.`);
    return;
  }

  if (cmd === "search") {
    const query = args._[1];
    if (!query) {
      console.error("search requires a query string");
      process.exit(2);
    }

    const [qEmb] = await ollamaEmbed({
      ollamaBaseUrl: ollamaUrl,
      model,
      inputs: [query],
    });

    // If you add embeddings directly, query with queryEmbeddings (not queryTexts). This must match dimensions. 
    const res = await collection.query({
      queryEmbeddings: [qEmb],
      nResults: k,
      include: ["documents", "metadatas", "distances"],
    });

    const docs = res?.documents?.[0] ?? [];
    const metas = res?.metadatas?.[0] ?? [];
    const dists = res?.distances?.[0] ?? [];
    const ids = res?.ids?.[0] ?? [];

    console.log(`\n[search] "${query}"`);
    console.log(`[search] top=${docs.length}\n`);

    for (let i = 0; i < docs.length; i++) {
      const m = metas[i] ?? {};
      const dist = dists[i];
      const id = ids[i];
      const snippet = String(docs[i] ?? "")
        .replace(/\s+/g, " ")
        .slice(0, 220);

      console.log(
        `#${i + 1} dist=${typeof dist === "number" ? dist.toFixed(4) : String(dist)}  ${m.path ?? "?"}  (chunk ${m.chunk ?? "?"})`
      );
      console.log(`    id: ${id}`);
      console.log(`    ${snippet}${snippet.length >= 220 ? "…" : ""}\n`);
    }
  }
}

main().catch((e) => {
  console.error(e?.stack ?? String(e));
  process.exit(1);
});
```

---

## 3) Use it

### Index a repo

```bash
node chroma-fs.mjs index ./myrepo --collection myrepo --model qwen3-embedding
```

### Search

```bash
node chroma-fs.mjs search "where is the websocket reconnect logic" --collection myrepo --k 10 --model qwen3-embedding
```

### If you want a full rebuild

```bash
node chroma-fs.mjs index ./myrepo --collection myrepo --clean
```

---

## Notes (so it behaves sanely)

* It **deletes and re-adds** all chunks for a file on every index pass (simple + correct, not the fastest).
* It stores metadata `{ root, path, chunk, start, end, ... }` so you can route hits back to files.
* It uses `queryEmbeddings` because we add embeddings directly; Chroma requires that in this mode. ([Chroma Docs][3])
* If you’d rather have Chroma embed for you (and query via `queryTexts`), you can—but then you’ll want to configure an embedding function on the collection, and let Chroma handle it. ([Chroma Docs][1])

If you want, I can also give you a **pure-local Python version** (no server, uses `PersistentClient(path=...)`) — same CLI shape, just fewer moving pieces.

[1]: https://docs.trychroma.com/docs/overview/getting-started?lang=typescript&utm_source=chatgpt.com "Getting Started - Chroma Docs"
[2]: https://docs.trychroma.com/production/containers/docker?utm_source=chatgpt.com "Docker - Chroma Docs"
[3]: https://docs.trychroma.com/docs/querying-collections/query-and-get?utm_source=chatgpt.com "Query and Get Data from Chroma Collections"

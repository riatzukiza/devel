Yeah — this is a **real** problem class, and “reconstitution” is exactly the right framing: treat agent sessions as the **ground-truth audit log**, then regenerate *artifacts* (docs, code, patches) from that log with increasingly powerful passes.

The key is to split it into **deterministic plumbing** (safe, boring, reliable) and **optional LLM enrichment** (powerful, risky, sandboxed).

Below is an MVP program you can drop into your existing `reconstitute/` TypeScript repo (the one you tar’d) that does exactly what you asked:

* **MVP output:** a dump file containing **every message-like blob** found in OpenCode local storage whose text contains `cephalon-clj`
* **Ideal-ish output:** creates `.reconstituted/cephalon-clj/` with:

  * `dump.ndjson` (machine-friendly)
  * `dump.md` (human/Obsidian-friendly)
  * `files/**.md` (one markdown per extracted file path, populated with evidence excerpts)

It does **not** require Chroma, OpenCode API, or `opencode export`. It works by scanning local OpenCode storage on disk, parsing JSON/JSONL loosely, and extracting message-shaped objects.

---

# Why your earlier approach failed (and what this avoids)

When `opencode export` or `opencode session list` is flaky, you’re at the mercy of:

* a running OpenCode server / API layer,
* a CLI that might mix logs into stdout,
* schema drift.

This program goes straight to the **data at rest** and treats it as an append-only corpus.

---

# Drop-in program: `reconstitute/src/recover-local.ts`

Create this file:

````ts
#!/usr/bin/env node
/* eslint-disable no-console */

import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

type ExtractedMsg = {
  id: string; // stable hash
  sessionId: string;
  role: string;
  timestamp: string | null;
  directory: string | null;
  sourceFile: string;
  content: string;
  scope: "in-workspace" | "maybe" | "unknown";
  pathHints: string[];
};

type Args = {
  needle: string;
  workspace: string;
  outDir: string;

  opencodeDataDir: string | null;
  strictWorkspace: boolean;

  maxFiles: number;
  maxMatches: number;
  maxFileBytes: number;
};

function parseArgs(argv: string[]): Args {
  // positional fallback: <needle> <workspace> <outDir>
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i++;
      }
    } else {
      positional.push(a);
    }
  }

  const needle = String(flags.needle ?? positional[0] ?? "cephalon-clj");
  const workspace = expandHome(String(flags.workspace ?? positional[1] ?? path.join(os.homedir(), "devel")));
  const outDir = expandHome(String(flags.out ?? positional[2] ?? path.join(".reconstituted", needle)));

  return {
    needle,
    workspace: normalizePath(workspace),
    outDir: normalizePath(outDir),

    opencodeDataDir: flags["opencode-data"] ? expandHome(String(flags["opencode-data"])) : null,
    strictWorkspace: Boolean(flags["strict-workspace"] ?? false),

    maxFiles: Number(flags["max-files"] ?? 250_000),
    maxMatches: Number(flags["max-matches"] ?? 200_000),
    maxFileBytes: Number(flags["max-file-bytes"] ?? 50 * 1024 * 1024), // 50MB
  };
}

function expandHome(p: string): string {
  if (!p) return p;
  if (p === "~") return os.homedir();
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return p;
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/\/$/, "");
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

function looksLikeStoragePath(p: string): boolean {
  const x = normalizePath(p);
  // heuristic: focus on open code-ish trees
  return (
    x.includes("/opencode/") ||
    x.includes("/.opencode/") ||
    x.includes("/storage/") ||
    x.includes("/sessions/") ||
    x.includes("/session/") ||
    x.includes("/message/") ||
    x.includes("/messages/") ||
    x.includes("/part/") ||
    x.includes("/parts/")
  );
}

async function* walkFiles(root: string, maxFiles: number): AsyncGenerator<string> {
  // iterative DFS to avoid recursion limits
  const stack: string[] = [root];
  let seen = 0;

  while (stack.length > 0) {
    const cur = stack.pop()!;
    let st: any;
    try {
      st = await fs.stat(cur);
    } catch {
      continue;
    }

    if (st.isDirectory()) {
      let entries: any[] = [];
      try {
        entries = await fs.readdir(cur, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const ent of entries) {
        const full = path.join(cur, ent.name);
        stack.push(full);
      }
    } else if (st.isFile()) {
      seen++;
      if (seen > maxFiles) return;
      yield cur;
    }
  }
}

async function fileContainsNeedle(filePath: string, needle: string, maxBytes: number): Promise<boolean> {
  // fast streaming scan, avoids loading huge files
  let st: any;
  try {
    st = await fs.stat(filePath);
  } catch {
    return false;
  }
  if (!st.isFile()) return false;
  if (st.size <= 0) return false;
  if (st.size > maxBytes) return false;

  const needleBuf = Buffer.from(needle, "utf8");
  const fd = await fs.open(filePath, "r");
  try {
    const chunkSize = 64 * 1024;
    const buf = Buffer.allocUnsafe(chunkSize);
    let overlap = Buffer.alloc(0);
    let pos = 0;

    while (pos < st.size) {
      const { bytesRead } = await fd.read(buf, 0, chunkSize, pos);
      if (bytesRead <= 0) break;
      const chunk = buf.subarray(0, bytesRead);
      const hay = overlap.length ? Buffer.concat([overlap, chunk]) : chunk;

      if (hay.indexOf(needleBuf) !== -1) return true;

      // keep overlap for boundary matches
      const keep = Math.min(needleBuf.length - 1, hay.length);
      overlap = hay.subarray(hay.length - keep);

      pos += bytesRead;
    }
    return false;
  } finally {
    await fd.close();
  }
}

function extractSessionIdFromPath(p: string): string | null {
  const x = normalizePath(p);
  // common patterns: ses_XXXX in filename, or folder structure containing it
  const m1 = x.match(/(ses_[a-zA-Z0-9_-]+)/);
  if (m1) return m1[1];

  const base = path.basename(x).replace(/\.jsonl?$/i, "");
  if (base.startsWith("ses_")) return base;

  return null;
}

function pickString(obj: any, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

function deepCollectMessageLike(value: any, out: any[], depth = 0) {
  if (depth > 12) return;
  if (!value) return;

  if (Array.isArray(value)) {
    for (const v of value) deepCollectMessageLike(v, out, depth + 1);
    return;
  }

  if (typeof value === "object") {
    // direct message-like object?
    const content = pickString(value, ["content", "text", "message"]);
    const role = pickString(value, ["role", "type", "speaker"]);
    if (content && role) out.push(value);

    // common container fields
    const msgs = (value as any).messages;
    if (Array.isArray(msgs)) {
      for (const m of msgs) deepCollectMessageLike(m, out, depth + 1);
    }

    // otherwise traverse keys
    for (const k of Object.keys(value)) {
      deepCollectMessageLike((value as any)[k], out, depth + 1);
    }
  }
}

function extractPathsFromText(text: string): string[] {
  const out = new Set<string>();
  const t = text ?? "";

  // “← Edit path” style
  for (const m of t.matchAll(/←\s*Edit\s+([^\n\r]+)/g)) {
    out.add(cleanPathHint(m[1]));
  }

  // JSON-ish filePath fields
  for (const m of t.matchAll(/["']filePath["']\s*:\s*["']([^"']+)["']/g)) {
    out.add(cleanPathHint(m[1]));
  }

  // generic path-ish tokens with file extensions
  for (const m of t.matchAll(/(^|[\s([{"'`])([A-Za-z0-9_./-]+\.(?:ts|tsx|js|jsx|clj|cljs|cljc|edn|md|json|yml|yaml|toml|sh|bash|zsh|go|rs|py|java|kt|c|cc|cpp|h|hpp))(?=$|[\s)\]},"'`])/gm)) {
    out.add(cleanPathHint(m[2]));
  }

  return [...out].filter(Boolean);
}

function cleanPathHint(p: string): string {
  let x = (p ?? "").trim();
  x = x.replace(/^["'`]+|["'`]+$/g, "");
  x = x.replace(/\\+/g, "/");
  x = x.replace(/\/+/g, "/");
  x = x.replace(/^\.\//, "");
  return x;
}

function scopeForMessage(msg: { directory: string | null; content: string }, workspace: string): ExtractedMsg["scope"] {
  const ws = normalizePath(workspace);
  const dir = msg.directory ? normalizePath(expandHome(msg.directory)) : null;
  const content = msg.content ?? "";

  if (dir && (dir === ws || dir.startsWith(ws + "/"))) return "in-workspace";
  if (content.includes(ws) || content.includes("~/" + ws.replace(normalizePath(os.homedir()) + "/", ""))) return "maybe";
  if (content.includes("/devel/") || content.includes("~/devel")) return "maybe";
  return "unknown";
}

function normalizeMessage(raw: any, sourceFile: string, needle: string, workspace: string): ExtractedMsg | null {
  const content = pickString(raw, ["content", "text", "message"]) ?? "";
  if (!content.includes(needle)) return null;

  const role = pickString(raw, ["role", "type", "speaker"]) ?? "unknown";
  const timestamp =
    pickString(raw, ["timestamp", "created_at", "time", "date"]) ??
    (typeof raw?.createdAt === "string" ? raw.createdAt : null) ??
    null;

  const directory =
    pickString(raw, ["directory", "dir", "cwd", "projectDir", "path"]) ??
    pickString(raw?.properties, ["directory", "dir", "cwd"]) ??
    null;

  const sessionId =
    pickString(raw, ["session_id", "sessionId", "session"]) ??
    extractSessionIdFromPath(sourceFile) ??
    "unknown";

  const scope = scopeForMessage({ directory, content }, workspace);

  const pathHints = extractPathsFromText(content);

  const id = sha256([sessionId, role, timestamp ?? "", content].join("|")).slice(0, 24);

  return {
    id,
    sessionId,
    role,
    timestamp,
    directory: directory ? normalizePath(expandHome(directory)) : null,
    sourceFile: normalizePath(sourceFile),
    content,
    scope,
    pathHints,
  };
}

async function parseJsonOrJsonl(filePath: string): Promise<Json[] | Json | null> {
  let text: string;
  try {
    text = await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }

  const trimmed = text.trim();
  if (!trimmed) return null;

  // JSON
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed) as Json;
    } catch {
      // fall through to JSONL attempt
    }
  }

  // JSONL / NDJSON
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const objs: Json[] = [];
  let parsedAny = false;
  for (const line of lines) {
    if (!line.startsWith("{")) continue;
    try {
      objs.push(JSON.parse(line) as Json);
      parsedAny = true;
    } catch {
      // ignore
    }
  }
  return parsedAny ? objs : null;
}

function excerptAroundNeedle(text: string, needle: string, radius = 600): string {
  const i = text.indexOf(needle);
  if (i < 0) return text.slice(0, radius * 2);
  const start = Math.max(0, i - radius);
  const end = Math.min(text.length, i + needle.length + radius);
  return text.slice(start, end);
}

function toNdjsonLine(msg: ExtractedMsg): string {
  return JSON.stringify(msg);
}

function toDumpMarkdown(msg: ExtractedMsg): string {
  const head = [
    `- id: \`${msg.id}\``,
    `  - session: \`${msg.sessionId}\``,
    `  - role: \`${msg.role}\``,
    `  - time: \`${msg.timestamp ?? "unknown"}\``,
    `  - scope: \`${msg.scope}\``,
    `  - source: \`${msg.sourceFile}\``,
    msg.directory ? `  - dir: \`${msg.directory}\`` : null,
    msg.pathHints.length ? `  - paths: ${msg.pathHints.map((p) => `\`${p}\``).join(", ")}` : null,
    `  - content:`,
    "```text",
    msg.content.length > 6000 ? msg.content.slice(0, 6000) + "\n…(truncated)…" : msg.content,
    "```",
    "",
  ].filter(Boolean);

  return head.join("\n");
}

function safeRelForOut(p: string, workspace: string): string {
  const ws = normalizePath(workspace);
  const x = cleanPathHint(p);
  if (!x) return "";

  const n = normalizePath(expandHome(x));

  // If absolute path under workspace, make it relative
  if (n.startsWith(ws + "/")) return n.slice(ws.length + 1);

  // If it contains "cephalon-clj", keep the tail from there
  const idx = n.indexOf("cephalon-clj/");
  if (idx >= 0) return n.slice(idx);

  // Otherwise, return as-is but sanitize leading slashes
  return n.replace(/^\/+/, "");
}

async function main() {
  const A = parseArgs(process.argv.slice(2));

  const needle = A.needle;
  const workspace = A.workspace;
  const outDir = A.outDir;

  // Tag lines for Obsidian
  const tagsLine = `#reconstitute #opencode #${needle.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

  const candidateRoots: string[] = [];

  if (A.opencodeDataDir) candidateRoots.push(A.opencodeDataDir);

  const defaultRoots = [
    process.env.XDG_DATA_HOME ? path.join(process.env.XDG_DATA_HOME, "opencode") : null,
    path.join(os.homedir(), ".local", "share", "opencode"),
    path.join(os.homedir(), "Library", "Application Support", "opencode"),
    path.join(os.homedir(), "AppData", "Roaming", "opencode"),
  ].filter(Boolean) as string[];

  for (const r of defaultRoots) candidateRoots.push(r);

  // Also consider scanning inside workspace for local caches
  candidateRoots.push(path.join(workspace, ".opencode"));
  candidateRoots.push(path.join(workspace, ".reconstitute"));

  const roots = [];
  for (const r of candidateRoots) if (await exists(r)) roots.push(r);

  if (roots.length === 0) {
    console.error("No OpenCode data roots found. Pass --opencode-data <dir> if needed.");
    process.exit(1);
  }

  await ensureDir(outDir);
  await ensureDir(path.join(outDir, "files"));

  const ndjsonPath = path.join(outDir, "dump.ndjson");
  const mdPath = path.join(outDir, "dump.md");
  const indexPath = path.join(outDir, "files", "_index.md");

  // start fresh
  await fs.writeFile(ndjsonPath, "", "utf8");
  await fs.writeFile(mdPath, `${tagsLine}\n\n# Dump for ${needle}\n\n`, "utf8");
  await fs.writeFile(indexPath, `${tagsLine}\n\n# Reconstituted files\n\n`, "utf8");

  console.log(`needle:     ${needle}`);
  console.log(`workspace:  ${workspace}`);
  console.log(`outDir:     ${outDir}`);
  console.log(`roots:      ${roots.map((r) => normalizePath(r)).join(", ")}`);
  console.log(`strict ws:  ${A.strictWorkspace ? "true" : "false"}`);
  console.log("");

  const seenMsgIds = new Set<string>();
  const byPath = new Map<string, ExtractedMsg[]>();

  let filesScanned = 0;
  let matches = 0;

  for (const root of roots) {
    for await (const fp of walkFiles(root, A.maxFiles)) {
      filesScanned++;
      const nfp = normalizePath(fp);

      // only parse JSON-ish, and try to stick to plausible storage trees
      const lower = nfp.toLowerCase();
      if (!lower.endsWith(".json") && !lower.endsWith(".jsonl") && !lower.endsWith(".ndjson")) continue;
      if (!looksLikeStoragePath(nfp)) continue;

      let st: any;
      try {
        st = await fs.stat(fp);
      } catch {
        continue;
      }
      if (st.size > A.maxFileBytes) continue;

      const hasNeedle = await fileContainsNeedle(fp, needle, A.maxFileBytes);
      if (!hasNeedle) continue;

      const parsed = await parseJsonOrJsonl(fp);

      // If parsing fails, still emit an evidence chunk so you don’t lose it.
      if (!parsed) {
        const rawText = await fs.readFile(fp, "utf8").catch(() => "");
        if (rawText.includes(needle)) {
          const content = excerptAroundNeedle(rawText, needle, 800);
          const msg: ExtractedMsg = {
            id: sha256([fp, needle, content].join("|")).slice(0, 24),
            sessionId: extractSessionIdFromPath(fp) ?? "unknown",
            role: "raw",
            timestamp: null,
            directory: null,
            sourceFile: nfp,
            content,
            scope: scopeForMessage({ directory: null, content }, workspace),
            pathHints: extractPathsFromText(content),
          };

          if (A.strictWorkspace && msg.scope !== "in-workspace") continue;

          if (!seenMsgIds.has(msg.id)) {
            seenMsgIds.add(msg.id);
            await fs.appendFile(ndjsonPath, toNdjsonLine(msg) + "\n", "utf8");
            await fs.appendFile(mdPath, toDumpMarkdown(msg), "utf8");
            matches++;
          }
        }
        continue;
      }

      const bucket: any[] = [];
      deepCollectMessageLike(parsed, bucket);

      let emittedAny = false;
      for (const raw of bucket) {
        const msg = normalizeMessage(raw, fp, needle, workspace);
        if (!msg) continue;

        if (A.strictWorkspace && msg.scope !== "in-workspace") continue;

        if (seenMsgIds.has(msg.id)) continue;
        seenMsgIds.add(msg.id);

        await fs.appendFile(ndjsonPath, toNdjsonLine(msg) + "\n", "utf8");
        await fs.appendFile(mdPath, toDumpMarkdown(msg), "utf8");

        // group by path hints
        for (const p of msg.pathHints) {
          const rel = safeRelForOut(p, workspace);
          if (!rel) continue;
          if (!rel.includes("cephalon-clj")) continue; // tighten to your target
          const arr = byPath.get(rel) ?? [];
          arr.push(msg);
          byPath.set(rel, arr);
        }

        matches++;
        emittedAny = true;

        if (matches >= A.maxMatches) break;
      }

      if (matches >= A.maxMatches) break;

      // lightweight progress
      if (emittedAny && matches % 100 === 0) {
        console.log(`matched: ${matches} (scanned files: ${filesScanned})`);
      }
    }

    if (matches >= A.maxMatches) break;
  }

  console.log("");
  console.log(`scanned files: ${filesScanned}`);
  console.log(`matched msgs:  ${matches}`);
  console.log(`path groups:   ${byPath.size}`);

  // Write per-path markdown docs
  const paths = [...byPath.keys()].sort();
  for (const rel of paths) {
    const msgs = (byPath.get(rel) ?? []).slice().sort((a, b) => {
      const ta = a.timestamp ?? "";
      const tb = b.timestamp ?? "";
      return ta.localeCompare(tb);
    });

    const docRel = rel.replace(/^\/*/, "");
    const outFile = path.join(outDir, "files", docRel + ".md");
    await ensureDir(path.dirname(outFile));

    const header = [
      tagsLine,
      "",
      `# ${docRel}`,
      "",
      `- target: \`${docRel}\``,
      `- evidence-messages: ${msgs.length}`,
      "",
      "## Evidence",
      "",
    ].join("\n");

    const body = msgs
      .map((m) => {
        const meta = [
          `- session: \`${m.sessionId}\``,
          `  - role: \`${m.role}\``,
          `  - time: \`${m.timestamp ?? "unknown"}\``,
          `  - scope: \`${m.scope}\``,
          `  - source: \`${m.sourceFile}\``,
          "",
          "```text",
          m.content.length > 8000 ? m.content.slice(0, 8000) + "\n…(truncated)…" : m.content,
          "```",
          "",
        ].join("\n");
        return meta;
      })
      .join("\n");

    const footer = [
      "## Reconstruction notes",
      "",
      "- What should this file do?",
      "- What are the key exports / public API?",
      "- What are edge cases / invariants?",
      "- What tools / modules did it depend on?",
      "",
      "## Next step",
      "",
      "Point a coding agent at this doc and ask it to recreate the source file it describes.",
      "",
    ].join("\n");

    await fs.writeFile(outFile, header + body + footer, "utf8");

    // add to index
    const link = `- [[${normalizePath(path.join("files", docRel))}.md]]`;
    await fs.appendFile(indexPath, link + "\n", "utf8");
  }

  const summaryPath = path.join(outDir, "README.md");
  const summary = [
    tagsLine,
    "",
    `# Reconstitution output for ${needle}`,
    "",
    `- workspace: \`${workspace}\``,
    `- outDir: \`${outDir}\``,
    `- matched messages: ${matches}`,
    `- extracted file docs: ${paths.length}`,
    "",
    "## Files",
    "",
    `- dump: \`dump.ndjson\``,
    `- dump (readable): \`dump.md\``,
    `- per-file docs: \`files/_index.md\``,
    "",
  ].join("\n");
  await fs.writeFile(summaryPath, summary, "utf8");

  console.log("");
  console.log(`wrote: ${summaryPath}`);
  console.log(`wrote: ${mdPath}`);
  console.log(`wrote: ${ndjsonPath}`);
  console.log(`wrote: ${indexPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
````

---

# Run it

From your existing `reconstitute/` folder:

```bash
npx tsx src/recover-local.ts --needle cephalon-clj --workspace ~/devel --out .reconstituted/cephalon-clj
```

If you want it to **only** accept messages that look clearly tied to `~/devel`, enable strict mode:

```bash
npx tsx src/recover-local.ts --needle cephalon-clj --workspace ~/devel --out .reconstituted/cephalon-clj --strict-workspace
```

If OpenCode data isn’t in the default places, point it manually:

```bash
npx tsx src/recover-local.ts --needle cephalon-clj --workspace ~/devel --out .reconstituted/cephalon-clj --opencode-data ~/.local/share/opencode
```

---

# What this gives you immediately

* A corpus you can feed into anything (`dump.ndjson`)
* A readable Obsidian note (`dump.md`)
* A `.reconstituted/cephalon-clj/files/` tree where each file-doc is essentially:

  * **“here are all the receipts we saw about this file”**
  * plus a reconstruction checklist

That’s enough to do your workflow:

> “For each document in `.reconstituted/cephalon-clj/files`, recreate the code it documents.”

---

# What I’d do next (cleanly, without reintroducing chaos)

## 1) Add “semantic expansion” without tools

Before giving an LLM write access, do this deterministic pipeline:

* Build a mini-index:

  * tokenize all messages in sessions that mention `cephalon-clj`
  * include a context window (±N messages) around matches
  * rank by BM25-ish scoring (or even cosine on embeddings later)

That gets you “semantically related” *enough* without letting anything write.

## 2) Then optionally add LLM in a sandboxed writer mode

If/when you want qwen3-vl to generate nicer docs, give it only:

* `search_dump(query) -> snippets`
* `write_doc(path, markdown)` **(only under `.reconstituted/cephalon-clj/`)**
* `append_doc(path, markdown)` **(same restriction)**

Hard guardrails:

* **deny deletes**
* **deny overwrite unless explicitly allowed**
* enforce a “citations block” where every generated section references message IDs from `dump.ndjson`

This makes the LLM act like a **compiler** from evidence → docs, not a creative writer.

---

# Long-term: this should be an OpenCode feature

I agree with your instinct: the “agent ate my work” problem is common, and the right fix is:

* always-on **artifact journaling** (file snapshots/diffs + session references)
* a first-class `opencode reconstitute` that can emit:

  * dump
  * per-file docs
  * optionally patches

Your MVP here is the correct wedge.

---

If you want, paste **one** example JSON file from your actual OpenCode storage (a session or message file), and I’ll tighten the extractor so it:

* finds the real `directory` / project root reliably
* groups messages by session properly
* adds context windows (so file docs include the “before/after” messages that matter)

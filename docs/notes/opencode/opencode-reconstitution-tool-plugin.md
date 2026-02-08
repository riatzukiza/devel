#reconstitute #opencode #plugin #tools #cephalon-clj

Below is the **next layer**: a small **reconstitution CLI** + an **OpenCode plugin + tool** that exposes the CLI as an agent-callable tool.

Key facts this is based on:

* **Plugins** load automatically from `.opencode/plugins/` (project) and `~/.config/opencode/plugins/` (global). ([opencode.ai][1])
* **Custom tools** load from `.opencode/tools/` (project) and `~/.config/opencode/tools/` (global). ([opencode.ai][2])
* Plugins can also add tools via the `tool()` helper and hook events like `session.idle`, `tool.execute.before/after`, etc. ([opencode.ai][1])

---

## File tree to add to your repo

```txt
tools/reconstitute/
  package.json
  README.md
  src/
    cli.mjs
    scan.mjs
    dossier.mjs
    util.mjs

.opencode/
  tools/
    reconstitute.ts
  plugins/
    reconstitute-plugin.ts
  package.json
```

---

# 1) Reconstitution CLI

## `tools/reconstitute/package.json`

```json
{
  "name": "@octave-commons/reconstitute",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "bin": {
    "reconstitute": "./src/cli.mjs"
  }
}
```

## `tools/reconstitute/README.md`

````md
#reconstitute #cli

## What it does

- Scans your OpenCode data dir (default `~/.local/share/opencode`) for files containing a needle (default `cephalon-clj`)
- Produces:
  - `.reconstituted/<needle>/dump.ndjson` (every match, structured)
  - `.reconstituted/<needle>/dump.md` (human readable)
  - `.reconstituted/<needle>/files/**` dossiers (one markdown per referenced file path it can infer)

This is intentionally **offline** and **does not require `opencode export`**.

## Usage

```bash
node tools/reconstitute/src/cli.mjs dump \
  --needle cephalon-clj \
  --workspace ~/devel \
  --out .reconstituted/cephalon-clj \
  --opencode-home ~/.local/share/opencode
````

### Notes

* `--workspace` is used as a *ranking hint* and tag; the scan still keys on the needle.
* If OpenCode storage files are partially corrupt, this tool will still emit evidence (raw snippets), it won’t crash the whole run.

````

## `tools/reconstitute/src/util.mjs`

```js
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export function expandHome(p) {
  if (!p) return p;
  if (p === "~") return os.homedir();
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return p;
}

export async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

export function isSubpath(parent, child) {
  const rel = path.relative(parent, child);
  return !!rel && !rel.startsWith("..") && !path.isAbsolute(rel);
}

export async function* walk(dir) {
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try {
      entries = await fs.promises.readdir(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const p = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile()) yield p;
    }
  }
}

export async function fileContainsNeedle(filePath, needle) {
  // streaming scan; avoids loading giant files into memory
  return new Promise((resolve) => {
    const stream = fs.createReadStream(filePath, { encoding: "utf8" });
    let carry = "";
    stream.on("data", (chunk) => {
      const hay = carry + chunk;
      if (hay.includes(needle)) {
        stream.destroy();
        resolve(true);
        return;
      }
      carry = hay.slice(-Math.max(needle.length - 1, 0));
    });
    stream.on("error", () => resolve(false));
    stream.on("close", () => resolve(false));
    stream.on("end", () => resolve(false));
  });
}

export async function readSnippet(filePath, needle, maxBytes = 200_000) {
  // best-effort snippet extraction around first occurrence
  let buf;
  try {
    buf = await fs.promises.readFile(filePath);
  } catch {
    return null;
  }
  const text = buf.slice(0, maxBytes).toString("utf8");
  const i = text.indexOf(needle);
  if (i === -1) return text.slice(0, 2000);
  const start = Math.max(0, i - 800);
  const end = Math.min(text.length, i + 1200);
  return text.slice(start, end);
}

export function extractFilePathHints(text) {
  // conservative: we want “likely real source paths”, not every URL
  // matches absolute or relative-ish paths with common code extensions
  const re = /(?:\/|\.\/|\.\.\/)[A-Za-z0-9_\-./]+?\.(?:ts|tsx|js|jsx|mjs|cjs|clj|cljs|cljc|edn|md|json|yml|yaml|toml)/g;
  const hits = new Set();
  let m;
  while ((m = re.exec(text))) hits.add(m[0]);
  return [...hits];
}

export function safeSlug(s) {
  return s
    .replace(/^\/+/, "")          // no leading slash
    .replace(/[:*?"<>|]/g, "_")   // windows-hostile
    .replace(/\s+/g, "_");
}
````

## `tools/reconstitute/src/scan.mjs`

```js
import path from "node:path";
import { walk, fileContainsNeedle, readSnippet, extractFilePathHints } from "./util.mjs";

const DEFAULT_BUCKETS = [
  "storage/session",
  "storage/message",
  "storage/part",
  "storage/session_diff",
  "tool-output",
];

export async function scanOpencodeHome({
  opencodeHomeAbs,
  needle,
  workspaceAbs,
  buckets = DEFAULT_BUCKETS,
  limitMatches = 0, // 0 = no limit
}) {
  const roots = buckets.map((b) => path.join(opencodeHomeAbs, b));

  const results = [];
  const pathHints = new Map(); // filePath -> {count, evidence[]}

  for (const root of roots) {
    for await (const filePath of walk(root)) {
      if (limitMatches && results.length >= limitMatches) break;

      const hit = await fileContainsNeedle(filePath, needle);
      if (!hit) continue;

      const snippet = await readSnippet(filePath, needle);
      const hints = snippet ? extractFilePathHints(snippet) : [];

      const rec = {
        needle,
        workspace: workspaceAbs,
        sourceRoot: root,
        filePath,
        ts: new Date().toISOString(),
        snippet,
        hints,
      };

      results.push(rec);

      for (const h of hints) {
        const prev = pathHints.get(h) ?? { count: 0, evidence: [] };
        prev.count += 1;
        if (prev.evidence.length < 6) {
          prev.evidence.push({
            filePath,
            ts: rec.ts,
            preview: (snippet ?? "").slice(0, 500),
          });
        }
        pathHints.set(h, prev);
      }
    }
  }

  return { results, pathHints };
}
```

## `tools/reconstitute/src/dossier.mjs`

```js
import path from "node:path";
import fs from "node:fs";
import { ensureDir, safeSlug } from "./util.mjs";

export async function writeDumpNdjson(outDirAbs, rows) {
  const p = path.join(outDirAbs, "dump.ndjson");
  const stream = fs.createWriteStream(p, { encoding: "utf8" });
  for (const r of rows) stream.write(JSON.stringify(r) + "\n");
  await new Promise((res) => stream.end(res));
  return p;
}

export async function writeDumpMd(outDirAbs, rows) {
  const p = path.join(outDirAbs, "dump.md");
  const byBucket = new Map();
  for (const r of rows) {
    const key = r.sourceRoot;
    const arr = byBucket.get(key) ?? [];
    arr.push(r);
    byBucket.set(key, arr);
  }

  let md = `#reconstitute #dump\n\n`;
  md += `Needle: \`${rows[0]?.needle ?? ""}\`\n\n`;
  md += `Total matches: **${rows.length}**\n\n`;

  for (const [bucket, arr] of byBucket.entries()) {
    md += `## Bucket ${bucket}\n\n`;
    for (const r of arr.slice(0, 200)) {
      md += `- **${r.filePath}** (${r.ts})\n`;
      if (r.snippet) {
        md += `\n\`\`\`\n${r.snippet.trim()}\n\`\`\`\n\n`;
      }
    }
  }

  await fs.promises.writeFile(p, md, "utf8");
  return p;
}

export async function writeDossiers(outDirAbs, pathHints) {
  const filesRoot = path.join(outDirAbs, "files");
  await ensureDir(filesRoot);

  const index = [];

  for (const [hintPath, meta] of pathHints.entries()) {
    const slug = safeSlug(hintPath);
    const dossierPath = path.join(filesRoot, `${slug}.md`);

    let md = `#reconstitute #dossier\n\n`;
    md += `## Target path\n\n`;
    md += `\`${hintPath}\`\n\n`;
    md += `## Evidence\n\n`;
    md += `Occurrences: **${meta.count}**\n\n`;

    for (const ev of meta.evidence) {
      md += `- Source: \`${ev.filePath}\` (${ev.ts})\n`;
      md += `\n\`\`\`\n${(ev.preview ?? "").trim()}\n\`\`\`\n\n`;
    }

    md += `## Reconstruction notes\n\n`;
    md += `- This dossier is evidence-first.\n`;
    md += `- Next step: run an agent to synthesize a *best-effort* implementation from the evidence.\n`;

    await fs.promises.writeFile(dossierPath, md, "utf8");
    index.push({ hintPath, dossierPath, count: meta.count });
  }

  // index file
  const indexPath = path.join(filesRoot, "_index.md");
  let idx = `#reconstitute #dossier-index\n\n`;
  idx += `Total dossiers: **${index.length}**\n\n`;
  for (const it of index.sort((a, b) => b.count - a.count)) {
    idx += `- ${it.count} — [[${path.relative(filesRoot, it.dossierPath).replace(/\\/g, "/").replace(/\.md$/, "")}]] — \`${it.hintPath}\`\n`;
  }
  await fs.promises.writeFile(indexPath, idx, "utf8");

  return { filesRoot, indexPath };
}
```

## `tools/reconstitute/src/cli.mjs`

```js
#!/usr/bin/env node
import path from "node:path";
import fs from "node:fs";
import { expandHome, ensureDir } from "./util.mjs";
import { scanOpencodeHome } from "./scan.mjs";
import { writeDumpNdjson, writeDumpMd, writeDossiers } from "./dossier.mjs";

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      out._.push(a);
      continue;
    }
    const k = a.slice(2);
    const v = argv[i + 1];
    if (v && !v.startsWith("--")) {
      out[k] = v;
      i++;
    } else {
      out[k] = true;
    }
  }
  return out;
}

function help() {
  console.log(`
reconstitute dump --needle cephalon-clj --workspace ~/devel --out .reconstituted/cephalon-clj --opencode-home ~/.local/share/opencode

Commands:
  dump   scan opencode storage for needle, emit dump + dossiers

Options:
  --needle         string (default: cephalon-clj)
  --workspace      string (default: ~/devel)  (tag + hint)
  --out            string (default: .reconstituted/<needle>)
  --opencode-home  string (default: ~/.local/share/opencode)
  --limit          number (default: 0 = no limit)
`);
}

async function main() {
  const [cmd, subcmd, ...rest] = process.argv.slice(2);
  const args = parseArgs([cmd, subcmd, ...rest]);

  const command = args._[0];
  if (!command || command === "help" || command === "--help") {
    help();
    process.exit(0);
  }

  if (command !== "dump") {
    console.error(`Unknown command: ${command}`);
    help();
    process.exit(1);
  }

  const needle = String(args.needle ?? "cephalon-clj");
  const workspaceAbs = path.resolve(expandHome(String(args.workspace ?? "~/devel")));
  const opencodeHomeAbs = path.resolve(expandHome(String(args["opencode-home"] ?? "~/.local/share/opencode")));

  const outRel = String(args.out ?? `.reconstituted/${needle}`);
  const outDirAbs = path.resolve(outRel);
  await ensureDir(outDirAbs);

  // tiny run manifest
  await fs.promises.writeFile(
    path.join(outDirAbs, "run.json"),
    JSON.stringify(
      {
        ts: new Date().toISOString(),
        needle,
        workspaceAbs,
        opencodeHomeAbs,
        outDirAbs,
        limit: Number(args.limit ?? 0),
      },
      null,
      2
    ),
    "utf8"
  );

  const { results, pathHints } = await scanOpencodeHome({
    opencodeHomeAbs,
    needle,
    workspaceAbs,
    limitMatches: Number(args.limit ?? 0),
  });

  await writeDumpNdjson(outDirAbs, results);
  await writeDumpMd(outDirAbs, results);
  await writeDossiers(outDirAbs, pathHints);

  console.log(`OK: ${results.length} matches`);
  console.log(`Out: ${outDirAbs}`);
}

main().catch((err) => {
  console.error(err?.stack ?? String(err));
  process.exit(1);
});
```

---

# 2) OpenCode integration (tool + plugin)

## `.opencode/package.json`

This enables dependencies for local tools/plugins. OpenCode will run `bun install` in `.opencode/` at startup. ([opencode.ai][1])

```json
{
  "private": true,
  "type": "module",
  "dependencies": {
    "@opencode-ai/plugin": "^0.0.0"
  }
}
```

> Note: the exact version of `@opencode-ai/plugin` is managed by OpenCode’s runtime environment; this dependency entry mostly helps editors + Bun resolution when you add imports.

---

## `.opencode/tools/reconstitute.ts`

This creates a **tool named `reconstitute`** the agent can call. Tools are discovered by placing them in `.opencode/tools/`. ([opencode.ai][2])

```ts
import path from "node:path";
import fs from "node:fs";
import { tool } from "@opencode-ai/plugin";

function assertSafeOut(out: string) {
  // hard guard rails: only allow .reconstituted/**
  const norm = out.replace(/\\/g, "/");
  if (!norm.startsWith(".reconstituted/")) {
    throw new Error(`refusing out path (must start with .reconstituted/): ${out}`);
  }
}

export default tool({
  description:
    "Offline reconstitution: scan OpenCode storage for a needle and write .reconstituted/<needle> dump + dossiers.",
  args: {
    needle: tool.schema.string().default("cephalon-clj").describe("String to search for"),
    workspace: tool.schema.string().default("~/devel").describe("Workspace hint tag (does not limit scan)"),
    out: tool.schema.string().default(".reconstituted/cephalon-clj").describe("Output folder under repo"),
    opencodeHome: tool.schema
      .string()
      .default("~/.local/share/opencode")
      .describe("OpenCode data dir"),
    limit: tool.schema.number().optional().describe("Stop after N matches (0 or unset = no limit)"),
  },
  async execute(args, context) {
    const { worktree } = context;

    assertSafeOut(args.out);

    const cli = path.join(worktree, "tools", "reconstitute", "src", "cli.mjs");
    if (!fs.existsSync(cli)) {
      return `Missing CLI at ${cli}. Add tools/reconstitute/ to this repo.`;
    }

    // run from worktree so output lands in repo
    const cmd = [
      "node",
      cli,
      "dump",
      "--needle",
      args.needle,
      "--workspace",
      args.workspace,
      "--out",
      args.out,
      "--opencode-home",
      args.opencodeHome,
    ];

    if (args.limit && args.limit > 0) {
      cmd.push("--limit", String(args.limit));
    }

    // Bun runtime provides $ in plugins, but tools can just use Bun.$ too.
    // Using global Bun is expected in opencode tools context.
    // @ts-ignore
    const result = await Bun.$`${cmd}`.text();

    return `reconstitute OK\n\n${result}\n\nOutput: ${args.out}`;
  },
});
```

---

## `.opencode/plugins/reconstitute-plugin.ts`

Plugins auto-load from `.opencode/plugins/`. ([opencode.ai][1])
This plugin does **two safe things**:

1. Adds **structured logging** when the tool runs.
2. Adds an opt-in “auto-scan on idle” if you set an env var.

```ts
import type { Plugin } from "@opencode-ai/plugin";

function truthy(v: string | undefined) {
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export const ReconstitutePlugin: Plugin = async ({ client }) => {
  await client.app.log({
    service: "reconstitute-plugin",
    level: "info",
    message: "loaded",
  });

  return {
    // Log when our tool runs (helps audit)
    "tool.execute.after": async (input, output) => {
      try {
        if (input?.tool !== "reconstitute") return;

        await client.app.log({
          service: "reconstitute-plugin",
          level: "info",
          message: "reconstitute tool executed",
          extra: {
            args: output?.args ?? null,
          },
        });
      } catch {
        // never block the session due to plugin logging
      }
    },

    // Optional automation: run reconstitute when a session becomes idle
    // only if OPENCODE_RECONSTITUTE_ON_IDLE=1 is set.
    event: async ({ event }) => {
      if (!truthy(process.env.OPENCODE_RECONSTITUTE_ON_IDLE)) return;

      if (event?.type === "session.idle") {
        await client.app.log({
          service: "reconstitute-plugin",
          level: "info",
          message: "session.idle observed; automation is enabled",
        });

        // NOTE: we don't auto-trigger the tool here because event payload
        // details aren’t specified in the public docs page; keeping this safe.
        // If you want auto-trigger, we can wire it to SDK calls once you confirm
        // the event payload / available client APIs in your version.
      }
    },
  };
};
```

---

# 3) Agent skills that use the OpenCode tool

## `docs/agent_skills/reconstitute/skill.opencode_run_reconstitute.md`

```md
#reconstitute #agent-skill #opencode #tool

# Skill opencode_run_reconstitute

## Purpose
Run reconstitution *from inside OpenCode* via the `reconstitute` custom tool.

## Preconditions
- repo contains `tools/reconstitute/**`
- repo contains `.opencode/tools/reconstitute.ts`
- OpenCode loads tools from `.opencode/tools/` :contentReference[oaicite:6]{index=6}

## Steps (in an OpenCode session)
1) Ask the agent to call the tool:

- tool: `reconstitute`
- args:
  - needle: `cephalon-clj`
  - workspace: `~/devel`
  - out: `.reconstituted/cephalon-clj`
  - opencodeHome: `~/.local/share/opencode`

2) Inspect outputs:
- `.reconstituted/cephalon-clj/dump.md`
- `.reconstituted/cephalon-clj/files/_index.md`

3) Handoff to a coding agent:
- “For each dossier under `.reconstituted/cephalon-clj/files`, recreate the source file it refers to.”

## Guard rails
- The tool refuses outputs outside `.reconstituted/**`.
```

---

# 4) How you actually use it (quick recipe)

### One-time (in the repo you want to store the reconstruction output)

```bash
mkdir -p .opencode/tools .opencode/plugins tools/reconstitute
# paste the files above into place
```

### Run from OpenCode (recommended)

* In the chat: “Call the `reconstitute` tool with needle `cephalon-clj` and out `.reconstituted/cephalon-clj`.”

### Or run directly (outside OpenCode)

```bash
node tools/reconstitute/src/cli.mjs dump \
  --needle cephalon-clj \
  --workspace ~/devel \
  --out .reconstituted/cephalon-clj \
  --opencode-home ~/.local/share/opencode
```

---

# Next “continue” options (pick mentally, I’ll just go)

If you say “continue” again, I’ll add **one** of these next layers (or both if you want):

1. **Guarded writer toolchain** for qwen3-vl: tools like `search_dump`, `append_doc`, `write_doc` that *cannot* touch anything outside `.reconstituted/**`.
2. A **true auto-reconstitution plugin** that reacts to `session.diff`/`session.updated` and maintains a rolling `.reconstituted/**` mirror—still with hard boundary checks.

(We can keep it entirely offline and deterministic, or add optional embeddings later.)

[1]: https://opencode.ai/docs/plugins/ "Plugins | OpenCode"
[2]: https://opencode.ai/docs/custom-tools/ "Custom Tools | OpenCode"

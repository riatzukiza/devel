import fs from "node:fs/promises";
import path from "node:path";
import type { GraphNode } from "./graph.js";
import { extractClojureRequires, extractJsTsImports, extractPythonImports } from "./imports.js";
import { listRepoFiles } from "./git.js";
import { extractMarkdownLinks } from "./markdown.js";
import { GraphStore } from "./store.js";

const MARKDOWN_EXT = new Set([".md", ".mdx"]);
const JS_TS_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const PY_EXT = new Set([".py"]);
const CLJ_EXT = new Set([".clj", ".cljs", ".cljc"]);

function fileNodeId(relPath: string): string {
  return `file:${relPath.replace(/\\/g, "/")}`;
}

function urlNodeId(url: string): string {
  return `url:${url}`;
}

function depNodeId(spec: string): string {
  return `dep:${spec}`;
}

function isHttp(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function normalizeRel(relPath: string): string {
  return relPath.replace(/\\/g, "/");
}

function resolveInternalLink(params: {
  fromFile: string;
  target: string;
  fileSet: Set<string>;
  mdBasenameToPaths: Map<string, string[]>;
}): string | null {
  const { fromFile, target, fileSet, mdBasenameToPaths } = params;
  const cleaned = target.split("#")[0]!.split("?")[0]!.trim();
  if (!cleaned || cleaned.startsWith("#")) return null;
  if (isHttp(cleaned)) return null;

  const fromDir = path.posix.dirname(normalizeRel(fromFile));

  // absolute-ish within repo
  const relCandidate = cleaned.startsWith("/") ? cleaned.slice(1) : path.posix.normalize(path.posix.join(fromDir, cleaned));

  // direct match
  if (fileSet.has(relCandidate)) return relCandidate;

  // try markdown extension
  if (!path.posix.extname(relCandidate)) {
    const md = `${relCandidate}.md`;
    if (fileSet.has(md)) return md;
  }

  // wiki-style: search by basename
  const base = path.posix.basename(relCandidate);
  const key = base.toLowerCase().endsWith(".md") ? base.toLowerCase() : `${base.toLowerCase()}.md`;
  const hits = mdBasenameToPaths.get(key);
  if (hits && hits.length === 1) return hits[0]!;

  return null;
}

function resolveJsTsImport(fromFile: string, spec: string, fileSet: Set<string>): string | null {
  if (!spec.startsWith(".") && !spec.startsWith("/")) return null;
  const fromDir = path.posix.dirname(normalizeRel(fromFile));
  const base = spec.startsWith("/") ? spec.slice(1) : path.posix.normalize(path.posix.join(fromDir, spec));

  const candidates: string[] = [];
  if (path.posix.extname(base)) {
    candidates.push(base);
  } else {
    for (const ext of [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]) {
      candidates.push(`${base}${ext}`);
    }
    for (const ext of [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]) {
      candidates.push(path.posix.join(base, `index${ext}`));
    }
  }

  for (const c of candidates) {
    if (fileSet.has(c)) return c;
  }
  return null;
}

async function readUtf8IfSmall(absPath: string, maxBytes: number): Promise<string | null> {
  try {
    const st = await fs.stat(absPath);
    if (!st.isFile()) return null;
    if (st.size > maxBytes) return null;
    return await fs.readFile(absPath, "utf8");
  } catch {
    return null;
  }
}

export async function rebuildLocalGraph(params: {
  repoRoot: string;
  store: GraphStore;
  maxFileBytes?: number;
}): Promise<{ seeds: string[] }> {
  const maxBytes = params.maxFileBytes ?? 512_000;
  const repoRoot = params.repoRoot;
  const store = params.store;

  const files = await listRepoFiles(repoRoot);
  const fileSet = new Set(files.map(normalizeRel));

  const mdBasenameToPaths = new Map<string, string[]>();
  for (const rel of files) {
    if (!MARKDOWN_EXT.has(path.extname(rel))) continue;
    const base = path.posix.basename(normalizeRel(rel)).toLowerCase();
    const rows = mdBasenameToPaths.get(base) ?? [];
    rows.push(normalizeRel(rel));
    mdBasenameToPaths.set(base, rows);
  }

  // nodes: all files
  for (const rel of files) {
    const id = fileNodeId(rel);
    const n: GraphNode = {
      id,
      kind: "file",
      label: rel.split("/").slice(-1)[0] || rel,
      external: false,
      loadedByDefault: true,
      layer: "local",
      path: normalizeRel(rel),
      data: { path: normalizeRel(rel) },
    };
    store.upsertNode(n);
  }

  const seeds = new Set<string>();

  // edges: markdown
  for (const rel of files) {
    if (!MARKDOWN_EXT.has(path.extname(rel))) continue;
    const abs = path.join(repoRoot, rel);
    const src = await readUtf8IfSmall(abs, maxBytes);
    if (!src) continue;

    const fromId = fileNodeId(rel);
    for (const link of extractMarkdownLinks(src)) {
      const targetRaw = link.target.trim();
      if (!targetRaw) continue;

      if (isHttp(targetRaw)) {
        const url = targetRaw.replace(/\s/g, "");
        seeds.add(url);
        const toId = urlNodeId(url);
        store.upsertNode({
          id: toId,
          kind: "url",
          label: url,
          external: true,
          loadedByDefault: false,
          layer: "local",
          url,
          data: { url, discovered_from: normalizeRel(rel) },
        });
        store.upsertEdge({
          id: `${fromId}=>${toId}:link`,
          source: fromId,
          target: toId,
          kind: "link",
          layer: "local",
          data: { syntax: link.kind },
        });
        continue;
      }

      const resolved = resolveInternalLink({
        fromFile: normalizeRel(rel),
        target: targetRaw,
        fileSet,
        mdBasenameToPaths,
      });
      if (!resolved) continue;
      const toId = fileNodeId(resolved);
      store.upsertEdge({
        id: `${fromId}=>${toId}:ref`,
        source: fromId,
        target: toId,
        kind: "ref",
        layer: "local",
        data: { syntax: link.kind },
      });
    }
  }

  // edges: js/ts imports
  for (const rel of files) {
    if (!JS_TS_EXT.has(path.extname(rel))) continue;
    const abs = path.join(repoRoot, rel);
    const src = await readUtf8IfSmall(abs, maxBytes);
    if (!src) continue;

    const fromId = fileNodeId(rel);
    for (const spec of extractJsTsImports(src)) {
      const internal = resolveJsTsImport(normalizeRel(rel), spec, fileSet);
      if (internal) {
        const toId = fileNodeId(internal);
        store.upsertEdge({
          id: `${fromId}=>${toId}:import`,
          source: fromId,
          target: toId,
          kind: "import",
          layer: "local",
          data: { spec },
        });
      } else {
        const toId = depNodeId(spec);
        store.upsertNode({
          id: toId,
          kind: "dep",
          label: spec,
          external: true,
          loadedByDefault: false,
          layer: "local",
          dep: spec,
          data: { spec },
        });
        store.upsertEdge({
          id: `${fromId}=>${toId}:dep`,
          source: fromId,
          target: toId,
          kind: "dep",
          layer: "local",
          data: { spec },
        });
      }
    }
  }

  // edges: python imports
  for (const rel of files) {
    if (!PY_EXT.has(path.extname(rel))) continue;
    const abs = path.join(repoRoot, rel);
    const src = await readUtf8IfSmall(abs, maxBytes);
    if (!src) continue;

    const fromId = fileNodeId(rel);
    for (const mod of extractPythonImports(src)) {
      const spec = `py:${mod}`;
      const toId = depNodeId(spec);
      store.upsertNode({
        id: toId,
        kind: "dep",
        label: spec,
        external: true,
        loadedByDefault: false,
        layer: "local",
        dep: spec,
        data: { spec, language: "python" },
      });
      store.upsertEdge({
        id: `${fromId}=>${toId}:dep`,
        source: fromId,
        target: toId,
        kind: "dep",
        layer: "local",
        data: { spec },
      });
    }
  }

  // edges: clojure requires
  for (const rel of files) {
    if (!CLJ_EXT.has(path.extname(rel))) continue;
    const abs = path.join(repoRoot, rel);
    const src = await readUtf8IfSmall(abs, maxBytes);
    if (!src) continue;

    const fromId = fileNodeId(rel);
    for (const ns of extractClojureRequires(src)) {
      const spec = `clj:${ns}`;
      const toId = depNodeId(spec);
      store.upsertNode({
        id: toId,
        kind: "dep",
        label: spec,
        external: true,
        loadedByDefault: false,
        layer: "local",
        dep: spec,
        data: { spec, language: "clojure" },
      });
      store.upsertEdge({
        id: `${fromId}=>${toId}:dep`,
        source: fromId,
        target: toId,
        kind: "dep",
        layer: "local",
        data: { spec },
      });
    }
  }

  return { seeds: [...seeds.values()] };
}

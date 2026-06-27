import fs from "node:fs/promises";
import path from "node:path";

export type PreviewFormat = "markdown" | "code" | "text" | "html" | "binary" | "none" | "error";

export type NodePreview = {
  id: string;
  kind: string;

  format: PreviewFormat;
  contentType: string;
  language: string | null;

  /** Preview body. For binary/none, this may be null. */
  body: string | null;

  /** True when the source had more bytes than returned in body. */
  truncated: boolean;

  /** Bytes returned in body (after truncation). */
  bytes: number;

  /** Optional: HTTP status for url fetches. */
  status?: number;

  /** Optional: error message for format=error. */
  error?: string;
};

const MARKDOWN_EXT = new Set([".md", ".mdx", ".markdown"]);
const HTML_EXT = new Set([".html", ".htm"]);

const BINARY_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".zip",
  ".gz",
  ".tgz",
  ".bz2",
  ".7z",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".mp3",
  ".mp4",
  ".mov",
  ".avi",
  ".mkv",
]);

export function guessLanguageFromPath(relPath: string): string | null {
  const ext = path.extname(relPath).toLowerCase();
  switch (ext) {
    case ".ts":
    case ".tsx":
      return "typescript";
    case ".js":
    case ".jsx":
    case ".mjs":
    case ".cjs":
      return "javascript";
    case ".json":
      return "json";
    case ".yaml":
    case ".yml":
      return "yaml";
    case ".toml":
      return "toml";
    case ".py":
      return "python";
    case ".rs":
      return "rust";
    case ".go":
      return "go";
    case ".java":
      return "java";
    case ".clj":
    case ".cljs":
    case ".cljc":
    case ".edn":
      return "clojure";
    case ".sh":
    case ".bash":
      return "bash";
    case ".sql":
      return "sql";
    case ".css":
      return "css";
    case ".html":
    case ".htm":
      return "xml";
    case ".md":
    case ".mdx":
    case ".markdown":
      return "markdown";
    default:
      return null;
  }
}

function isProbablyBinary(buf: Buffer): boolean {
  // quick heuristic: if NUL appears, treat as binary
  const limit = Math.min(buf.length, 8000);
  for (let i = 0; i < limit; i += 1) {
    if (buf[i] === 0) return true;
  }
  return false;
}

function guessFileFormat(relPath: string): PreviewFormat {
  const ext = path.extname(relPath).toLowerCase();
  if (MARKDOWN_EXT.has(ext)) return "markdown";
  // For local HTML files we show source as code; for remote URLs we return format=html.
  if (HTML_EXT.has(ext)) return "code";
  if (BINARY_EXT.has(ext)) return "binary";
  return "code";
}

function guessFileContentType(relPath: string, format: PreviewFormat): string {
  const ext = path.extname(relPath).toLowerCase();
  if (format === "markdown") return "text/markdown; charset=utf-8";
  if (format === "html") return "text/html; charset=utf-8";

  // a few nicer hints
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".yaml" || ext === ".yml") return "text/yaml; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js" || ext === ".mjs" || ext === ".cjs") return "text/javascript; charset=utf-8";
  if (ext === ".ts" || ext === ".tsx") return "text/typescript; charset=utf-8";

  if (format === "binary") return "application/octet-stream";
  return "text/plain; charset=utf-8";
}

export async function readFilePreview(params: {
  absPath: string;
  relPath: string;
  maxBytes: number;
}): Promise<Pick<NodePreview, "format" | "contentType" | "language" | "body" | "truncated" | "bytes">> {
  const { absPath, relPath, maxBytes } = params;

  const st = await fs.stat(absPath);
  if (!st.isFile()) {
    return {
      format: "none",
      contentType: "text/plain; charset=utf-8",
      language: null,
      body: null,
      truncated: false,
      bytes: 0,
    };
  }

  const format = guessFileFormat(relPath);
  const language = guessLanguageFromPath(relPath);
  const contentType = guessFileContentType(relPath, format);

  if (format === "binary") {
    return {
      format,
      contentType,
      language,
      body: null,
      truncated: st.size > maxBytes,
      bytes: 0,
    };
  }

  const want = Math.max(0, Math.min(st.size, maxBytes));
  const handle = await fs.open(absPath, "r");
  try {
    const buf = Buffer.alloc(want);
    const { bytesRead } = await handle.read(buf, 0, want, 0);
    const head = buf.subarray(0, bytesRead);

    if (isProbablyBinary(head)) {
      return {
        format: "binary",
        contentType: "application/octet-stream",
        language,
        body: null,
        truncated: st.size > maxBytes,
        bytes: 0,
      };
    }

    return {
      format,
      contentType,
      language,
      body: head.toString("utf8"),
      truncated: st.size > maxBytes,
      bytes: bytesRead,
    };
  } finally {
    await handle.close();
  }
}

export async function fetchUrlPreview(params: {
  url: string;
  maxBytes: number;
  timeoutMs: number;
}): Promise<Pick<NodePreview, "format" | "contentType" | "language" | "body" | "truncated" | "bytes" | "status">> {
  const { url, maxBytes, timeoutMs } = params;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), Math.max(1, timeoutMs));
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "user-agent": "devel-graph-weaver/0.1 (preview)",
        accept: "text/html, text/plain, */*",
      },
    });

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const lower = contentType.toLowerCase();

    if (!res.body) {
      return {
        format: "none",
        contentType,
        language: null,
        body: null,
        truncated: false,
        bytes: 0,
        status: res.status,
      };
    }

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    let truncated = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || value.length === 0) continue;

      if (total + value.length > maxBytes) {
        const head = value.subarray(0, Math.max(0, maxBytes - total));
        if (head.length) chunks.push(head);
        total = maxBytes;
        truncated = true;
        try {
          await reader.cancel();
        } catch {
          // ignore
        }
        break;
      }

      chunks.push(value);
      total += value.length;
      if (total >= maxBytes) {
        truncated = true;
        try {
          await reader.cancel();
        } catch {
          // ignore
        }
        break;
      }
    }

    const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));

    const isText = lower.startsWith("text/") || lower.includes("json") || lower.includes("xml");
    if (!isText) {
      return {
        format: "binary",
        contentType,
        language: null,
        body: null,
        truncated,
        bytes: 0,
        status: res.status,
      };
    }

    const format: PreviewFormat = lower.includes("html") ? "html" : "text";
    return {
      format,
      contentType,
      language: null,
      body: buf.toString("utf8"),
      truncated,
      bytes: buf.length,
      status: res.status,
    };
  } finally {
    clearTimeout(timer);
  }
}

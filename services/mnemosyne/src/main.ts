import path from "node:path";
import { createHmac, timingSafeEqual } from "node:crypto";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import express from "express";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from "node:fs";
import { createMcpHttpRouter, createMcpServer } from "@workspace/mcp-runtime";

// Types
interface FsEntry {
  name: string;
  path: string;
  kind: "file" | "dir";
}

// Local file system backend
class LocalFsBackend {
  public readonly name = "local" as const;

  constructor(private readonly rootAbs: string) {}

  private resolvePath(userPath: string): string {
    const cleaned = userPath.replace(/^\/+/, "");
    const resolved = path.resolve(this.rootAbs, cleaned);
    if (!resolved.startsWith(this.rootAbs)) {
      throw new Error("Path escapes root");
    }
    return resolved;
  }

  async list(dirPath: string): Promise<FsEntry[]> {
    const absPath = this.resolvePath(dirPath);
    const entries = await fs.readdir(absPath, { withFileTypes: true });
    const relPrefix = dirPath ? `${dirPath}/` : "";
    return entries.map((e) => ({
      name: e.name,
      path: `${relPrefix}${e.name}`,
      kind: e.isDirectory() ? ("dir" as const) : ("file" as const),
    }));
  }

  async readFile(filePath: string): Promise<{ path: string; content: string }> {
    const absPath = this.resolvePath(filePath);
    const content = await fs.readFile(absPath, "utf8");
    return { path: filePath, content };
  }

  async writeFile(filePath: string, content: string): Promise<{ path: string }> {
    const absPath = this.resolvePath(filePath);
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    await fs.writeFile(absPath, content, "utf8");
    return { path: filePath };
  }

  async deletePath(targetPath: string): Promise<{ path: string }> {
    const absPath = this.resolvePath(targetPath);
    const st = await fs.lstat(absPath);
    if (st.isDirectory()) {
      await fs.rm(absPath, { recursive: true, force: true });
    } else {
      await fs.unlink(absPath);
    }
    return { path: targetPath };
  }
}

// Virtual file system
class VirtualFs {
  constructor(private readonly backend: LocalFsBackend) {}

  async list(dirPath: string): Promise<FsEntry[]> {
    return this.backend.list(dirPath);
  }

  async readFile(filePath: string): Promise<{ path: string; content: string }> {
    return this.backend.readFile(filePath);
  }

  async writeFile(filePath: string, content: string): Promise<{ path: string }> {
    return this.backend.writeFile(filePath, content);
  }

  async deletePath(targetPath: string): Promise<{ path: string }> {
    return this.backend.deletePath(targetPath);
  }

  async tree(dirPath: string, maxDepth = 3): Promise<any[]> {
    const buildTree = async (currentPath: string, depth: number): Promise<any[]> => {
      if (depth > maxDepth) return [];
      const entries = await this.backend.list(currentPath);
      const result: any[] = [];
      for (const entry of entries) {
        const treeEntry: any = { ...entry };
        if (entry.kind === "dir" && depth < maxDepth) {
          treeEntry.children = await buildTree(entry.path, depth + 1);
        }
        result.push(treeEntry);
      }
      return result;
    };
    return buildTree(dirPath, 1);
  }

  async search(query: string, options: { path?: string; maxResults?: number } = {}): Promise<any[]> {
    const { path: searchPath = "", maxResults = 50 } = options;
    const results: any[] = [];
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const searchDir = async (dirPath: string): Promise<void> => {
      if (results.length >= maxResults) return;
      const entries = await this.backend.list(dirPath);
      for (const entry of entries) {
        if (results.length >= maxResults) return;
        if (entry.kind === "dir") {
          await searchDir(entry.path);
        } else {
          try {
            const { content } = await this.backend.readFile(entry.path);
            const lines = content.split("\n");
            lines.forEach((line, idx) => {
              if (regex.test(line)) {
                results.push({
                  path: entry.path,
                  line: idx + 1,
                  snippet: line.trim().slice(0, 200),
                });
              }
            });
          } catch {
            // Skip unreadable files
          }
        }
      }
    };

    await searchDir(searchPath);
    return results.slice(0, maxResults);
  }
}

// Environment config
const LOCAL_ROOT = process.env.LOCAL_ROOT || "/home/err/devel/";
const PORT = parseInt(process.env.PORT || "4011", 10);
const ALLOW_UNAUTH_LOCAL = process.env.ALLOW_UNAUTH_LOCAL === "true";
const MCP_GATEWAY_SHARED_SECRET = (process.env.MCP_INTERNAL_SHARED_SECRET || "").trim();

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }
  return undefined;
}

function normalizeHost(value: string | undefined): string {
  if (!value) return "";
  const first = value.split(",")[0]?.trim() ?? "";
  const noBrackets = first.replace(/^\[/, "").replace(/\]$/, "");
  const hostPart = noBrackets.split(":")[0] ?? "";
  return hostPart.toLowerCase();
}

function normalizeForwardedIp(value: string | undefined): string {
  if (!value) return "";
  return (value.split(",")[0] ?? "").trim().toLowerCase();
}

function isLoopbackAddress(value: string): boolean {
  const addr = value.toLowerCase();
  return (
    addr === "::1" ||
    addr === "127.0.0.1" ||
    addr === "::ffff:127.0.0.1" ||
    addr.startsWith("127.")
  );
}

function isLocalHost(value: string): boolean {
  return value === "localhost" || value === "127.0.0.1" || value === "::1";
}

function isValidGatewaySignature(req: express.Request): boolean {
  if (MCP_GATEWAY_SHARED_SECRET.length === 0) {
    return false;
  }

  const ts = firstHeaderValue(req.headers["x-mcp-gateway-ts"] as string | string[] | undefined);
  const sig = firstHeaderValue(req.headers["x-mcp-gateway-sig"] as string | string[] | undefined);
  if (!ts || !sig) {
    return false;
  }

  const tsNum = Number.parseInt(ts, 10);
  if (!Number.isFinite(tsNum)) {
    return false;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - tsNum) > 60) {
    return false;
  }

  const pathWithQuery = req.originalUrl || req.url;
  const expected = createHmac("sha256", MCP_GATEWAY_SHARED_SECRET)
    .update(req.method.toUpperCase())
    .update("\n")
    .update(pathWithQuery)
    .update("\n")
    .update(ts)
    .digest("hex");

  const provided = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (provided.length !== expectedBuf.length) {
    return false;
  }
  return timingSafeEqual(provided, expectedBuf);
}

// Create filesystem backend
const backend = new LocalFsBackend(path.resolve(LOCAL_ROOT));
const vfs = new VirtualFs(backend);

const server = createMcpServer({
  name: "mcp-files",
  version: "0.1.0",
  register: (serverInstance: McpServer) => {
// Register tools
serverInstance.registerTool(
  "fs_list",
  {
    description: "List directory entries",
    inputSchema: { path: z.string().optional().default("") },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
  },
  async ({ path }): Promise<CallToolResult> => {
    const entries = await vfs.list(path);
    return { content: [{ type: "text", text: JSON.stringify(entries, null, 2) }] };
  }
);

serverInstance.registerTool(
  "fs_read",
  {
    description: "Read file content",
    inputSchema: { path: z.string() },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
  },
  async ({ path }): Promise<CallToolResult> => {
    const out = await vfs.readFile(path);
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

serverInstance.registerTool(
  "fs_write",
  {
    description: "Write file content",
    inputSchema: { path: z.string(), content: z.string() },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false }
  },
  async ({ path, content }): Promise<CallToolResult> => {
    const out = await vfs.writeFile(path, content);
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

serverInstance.registerTool(
  "fs_delete",
  {
    description: "Delete a file or directory",
    inputSchema: { path: z.string() },
    annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false }
  },
  async ({ path }): Promise<CallToolResult> => {
    const out = await vfs.deletePath(path);
    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

serverInstance.registerTool(
  "fs_tree",
  {
    description: "Get recursive directory tree",
    inputSchema: { 
      path: z.string().optional().default(""),
      maxDepth: z.number().min(1).max(10).optional().default(3)
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
  },
  async ({ path, maxDepth }): Promise<CallToolResult> => {
    const tree = await vfs.tree(path, maxDepth);
    return { content: [{ type: "text", text: JSON.stringify(tree, null, 2) }] };
  }
);

serverInstance.registerTool(
  "fs_search",
  {
    description: "Search file contents",
    inputSchema: { 
      query: z.string(),
      path: z.string().optional().default(""),
      maxResults: z.number().min(1).max(100).optional().default(50)
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
  },
  async ({ query, path, maxResults }): Promise<CallToolResult> => {
    const results = await vfs.search(query, { path, maxResults });
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }
);

// Legacy files_* compatibility aliases
serverInstance.registerTool(
  "files_list_directory",
  {
    description: "Legacy alias for fs_list",
    inputSchema: {
      rel: z.string().optional().default("."),
      includeHidden: z.boolean().optional(),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  async ({ rel }): Promise<CallToolResult> => {
    const entries = await vfs.list(rel === "." ? "" : rel);
    return { content: [{ type: "text", text: JSON.stringify(entries, null, 2) }] };
  },
);

serverInstance.registerTool(
  "files_view_file",
  {
    description: "Legacy alias for fs_read",
    inputSchema: {
      relOrFuzzy: z.string(),
      line: z.number().int().min(1).optional(),
      context: z.number().int().min(0).optional(),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  async ({ relOrFuzzy, line, context }): Promise<CallToolResult> => {
    const out = await vfs.readFile(relOrFuzzy);
    if (!line) {
      return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
    }

    const radius = context ?? 40;
    const lines = out.content.split("\n");
    const start = Math.max(1, line - radius);
    const end = Math.min(lines.length, line + radius);
    const excerpt = lines.slice(start - 1, end).map((value, idx) => ({
      line: start + idx,
      text: value,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify({ ok: true, path: out.path, excerpt }, null, 2) }],
    };
  },
);

serverInstance.registerTool(
  "files_write_content",
  {
    description: "Legacy alias for fs_write",
    inputSchema: {
      filePath: z.string(),
      content: z.string(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  },
  async ({ filePath, content }): Promise<CallToolResult> => {
    const out = await vfs.writeFile(filePath, content);
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, ...out }, null, 2) }] };
  },
);

serverInstance.registerTool(
  "files_write_lines",
  {
    description: "Legacy line-edit write mode alias",
    inputSchema: {
      filePath: z.string(),
      lines: z.array(z.string()).min(1),
      startLine: z.number().int().min(1),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  },
  async ({ filePath, lines, startLine }): Promise<CallToolResult> => {
    const current = await vfs.readFile(filePath).catch(() => ({ path: filePath, content: "" }));
    const existing = current.content.split("\n");
    const index = Math.max(0, startLine - 1);
    const nextLines = [
      ...existing.slice(0, index),
      ...lines,
      ...existing.slice(index),
    ];
    const content = nextLines.join("\n");
    const out = await vfs.writeFile(filePath, content);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ ok: true, ...out, startLine, inserted: lines.length }, null, 2),
      }],
    };
  },
);

serverInstance.registerTool(
  "files_tree_directory",
  {
    description: "Legacy alias for fs_tree",
    inputSchema: {
      rel: z.string().optional().default("."),
      depth: z.number().int().min(1).max(10).optional().default(3),
      includeHidden: z.boolean().optional(),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  async ({ rel, depth }): Promise<CallToolResult> => {
    const tree = await vfs.tree(rel === "." ? "" : rel, depth);
    return { content: [{ type: "text", text: JSON.stringify(tree, null, 2) }] };
  },
);

serverInstance.registerTool(
  "files_search",
  {
    description: "Legacy alias for fs_search",
    inputSchema: {
      query: z.string(),
      rel: z.string().optional().default("."),
      maxResults: z.number().int().min(1).max(1000).optional().default(200),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  async ({ query, rel, maxResults }): Promise<CallToolResult> => {
    const results = await vfs.search(query, { path: rel === "." ? "" : rel, maxResults });
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ ok: true, count: results.length, results }, null, 2),
      }],
    };
  },
);
  }
});

const maybeBearer: express.RequestHandler = (req, res, next) => {
  const remoteAddr = req.socket?.remoteAddress ?? "";
  const rawForwardedHost = firstHeaderValue(req.headers["x-forwarded-host"] as string | string[] | undefined);
  const rawHost = firstHeaderValue(req.headers.host as string | string[] | undefined);
  const effectiveHost = normalizeHost(rawForwardedHost ?? rawHost);
  const rawForwardedFor = firstHeaderValue(req.headers["x-forwarded-for"] as string | string[] | undefined);
  const forwardedClientIp = normalizeForwardedIp(rawForwardedFor);

  const isLocalRequest = isLocalHost(effectiveHost) &&
    (forwardedClientIp.length === 0 || isLoopbackAddress(forwardedClientIp)) &&
    isLoopbackAddress(remoteAddr);
  if (isLocalRequest) {
    return next();
  }

  const isLoopbackOnly =
    isLoopbackAddress(remoteAddr) &&
    (forwardedClientIp.length === 0 || isLoopbackAddress(forwardedClientIp)) &&
    (effectiveHost.length === 0 || isLocalHost(effectiveHost));
  if (ALLOW_UNAUTH_LOCAL && isLoopbackOnly) {
    return next();
  }

  if (isValidGatewaySignature(req)) {
    return next();
  }

  res.status(401).json({
    ok: false,
    error: "unauthorized",
    message: "missing valid gateway assertion; route through api-gateway or use loopback-only local access",
  });
};

export function createApp(): express.Express {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "mnemosyne" });
  });

  const mcpRouter = createMcpHttpRouter({
    createServer: () => server,
  });

  app.post("/mcp", maybeBearer, async (req: express.Request, res: express.Response) => {
    await mcpRouter.handlePost(req, res);
  });

  app.get("/mcp", maybeBearer, async (req: express.Request, res: express.Response) => {
    await mcpRouter.handleSession(req, res);
  });

  app.delete("/mcp", maybeBearer, async (req: express.Request, res: express.Response) => {
    await mcpRouter.handleSession(req, res);
  });

  return app;
}

export function startServer(port = PORT): void {
  const app = createApp();
  app.listen(port, "0.0.0.0", () => {
    console.log(`[mnemosyne] Server running on port ${port}`);
    console.log(`[mnemosyne] LOCAL_ROOT: ${LOCAL_ROOT}`);
  });
}

const entryArg = process.argv[1];
if (entryArg && import.meta.url === pathToFileURL(entryArg).href) {
  startServer();
}

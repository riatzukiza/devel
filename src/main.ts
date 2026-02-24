import path from "node:path";
import { z } from "zod";
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from "node:fs";

// Types
interface FsEntry {
  name: string;
  path: string;
  kind: "file" | "dir";
}

interface TreeEntry extends FsEntry {
  children?: TreeEntry[];
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

  async tree(dirPath: string, maxDepth = 3): Promise<TreeEntry[]> {
    const buildTree = async (currentPath: string, depth: number): Promise<TreeEntry[]> => {
      if (depth > maxDepth) return [];
      const entries = await this.backend.list(currentPath);
      const result: TreeEntry[] = [];
      for (const entry of entries) {
        const treeEntry: TreeEntry = { ...entry };
        if (entry.kind === "dir" && depth < maxDepth) {
          treeEntry.children = await buildTree(entry.path, depth + 1);
        }
        result.push(treeEntry);
      }
      return result;
    };
    return buildTree(dirPath, 1);
  }

  async search(query: string, options: { path?: string; maxResults?: number } = {}): Promise<unknown[]> {
    const { path: searchPath = "", maxResults = 50 } = options;
    const results: unknown[] = [];
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

// Create filesystem backend
const backend = new LocalFsBackend(path.resolve(LOCAL_ROOT));
const vfs = new VirtualFs(backend);

// Create MCP server
const server = new McpServer({
  name: "mcp-files",
  version: "0.1.0",
});

// Register tools
server.registerTool(
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

server.registerTool(
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

server.registerTool(
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

server.registerTool(
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

server.registerTool(
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

server.registerTool(
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

// Express HTTP transport (auth-free)
const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "mcp-files" });
});

const transports = new Map<string, StreamableHTTPServerTransport>();

app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport = sessionId ? transports.get(sessionId) : undefined;

  if (!transport) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });
    await server.connect(transport);
    if (transport.sessionId) {
      transports.set(transport.sessionId, transport);
    }
  }

  await transport.handleRequest(req, res, req.body);
});

app.get("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport = sessionId ? transports.get(sessionId) : undefined;

  if (!transport) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });
    await server.connect(transport);
    if (transport.sessionId) {
      transports.set(transport.sessionId, transport);
    }
  }

  await transport.handleRequest(req, res, req.body);
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[mcp-files] Server running on port ${PORT}`);
  console.log(`[mcp-files] LOCAL_ROOT: ${LOCAL_ROOT}`);
});

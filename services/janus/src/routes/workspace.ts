import { promises as fs } from "node:fs";
import path from "node:path";

import type { FastifyPluginAsync, FastifyReply } from "fastify";

type WorkspaceRouteOptions = {
  workspaceRoot: string;
};

type ListQuery = {
  path?: string;
  limit?: string;
  includeHidden?: string;
};

type ReadFileQuery = {
  path?: string;
};

type WriteFileBody = {
  path?: string;
  content?: string;
};

const MAX_LIST_LIMIT = 500;
const DEFAULT_LIST_LIMIT = 200;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const SKIPPED_DIRS = new Set([".git", "node_modules", ".shadow-cljs", "target", "dist", "build"]);

function errMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sanitizeRelativePath(value: string | undefined): string {
  const trimmed = value?.trim() ?? ".";
  if (trimmed.length === 0) {
    return ".";
  }
  return trimmed.replaceAll("\\", "/");
}

function resolveInsideRoot(rootPath: string, relativePath: string): string {
  const targetPath = path.resolve(rootPath, relativePath);
  if (targetPath !== rootPath && !targetPath.startsWith(`${rootPath}${path.sep}`)) {
    throw new Error("path escapes workspace root");
  }
  return targetPath;
}

function toRelativePath(rootPath: string, targetPath: string): string {
  const relativePath = path.relative(rootPath, targetPath).replaceAll(path.sep, "/");
  return relativePath.length > 0 ? relativePath : ".";
}

function parseListLimit(value: string | undefined): number {
  if (!value) {
    return DEFAULT_LIST_LIMIT;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_LIST_LIMIT;
  }
  return Math.min(MAX_LIST_LIMIT, Math.max(1, parsed));
}

async function getAbsolutePath(rootPath: string, relativePath: string): Promise<string> {
  return resolveInsideRoot(rootPath, relativePath);
}

async function getVisibleEntries(
  absolutePath: string, 
  includeHidden: boolean
): Promise<Array<import("node:fs").Dirent>> {
  const directoryEntries = await fs.readdir(absolutePath, { withFileTypes: true });
  return directoryEntries
    .filter((entry) => {
      if (!includeHidden && entry.name.startsWith(".")) {
        return false;
      }
      if (entry.isDirectory() && SKIPPED_DIRS.has(entry.name)) {
        return false;
      }
      return true;
    })
    .sort((left, right) => {
      const leftType = left.isDirectory() ? 0 : 1;
      const rightType = right.isDirectory() ? 0 : 1;
      if (leftType !== rightType) {
        return leftType - rightType;
      }
      return left.name.localeCompare(right.name);
    });
}

async function listDirectory(
  rootPath: string, 
  absolutePath: string, 
  includeHidden: boolean, 
  listLimit: number
): Promise<{ 
  ok: boolean; 
  root: string; 
  path: string; 
  entries: Array<{ 
    name: string; 
    path: string; 
    type: string; 
    mtimeMs: number; 
    size?: number; 
  }>; 
  truncated: boolean; 
}> {
  const visibleEntries = await getVisibleEntries(absolutePath, includeHidden);
  const limitedEntries = visibleEntries.slice(0, listLimit);
  
  const entries = await Promise.all(
    limitedEntries.map(async (entry) => {
      const childPath = path.join(absolutePath, entry.name);
      const childStat = await fs.stat(childPath);
      return {
        name: entry.name,
        path: toRelativePath(rootPath, childPath),
        type: entry.isDirectory() ? "directory" : "file",
        mtimeMs: childStat.mtimeMs,
        size: entry.isFile() ? childStat.size : undefined
      };
    })
  );

  return {
    ok: true,
    root: rootPath,
    path: toRelativePath(rootPath, absolutePath),
    entries,
    truncated: visibleEntries.length > listLimit
  };
}

async function readFile(
  rootPath: string, 
  relativePath: string, 
  reply: FastifyReply
): Promise<void> {
  if (relativePath === ".") {
    return reply.code(400).send({ ok: false, error: "file path is required" });
  }

  const absolutePath = await getAbsolutePath(rootPath, relativePath).catch((error) => {
    reply.code(400).send({ ok: false, error: errMessage(error) });
    return "";
  });
  if (!absolutePath) return;

  try {
    const fileStat = await fs.stat(absolutePath);
    if (!fileStat.isFile()) {
      return reply.code(400).send({ ok: false, error: "path is not a file" });
    }

    if (fileStat.size > MAX_FILE_BYTES) {
      return reply.code(413).send({
        ok: false,
        error: `file exceeds ${MAX_FILE_BYTES} byte limit`
      });
    }

    const content = await fs.readFile(absolutePath, "utf8");
    return reply.send({
      ok: true,
      root: rootPath,
      path: toRelativePath(rootPath, absolutePath),
      size: fileStat.size,
      mtimeMs: fileStat.mtimeMs,
      content
    });
  } catch (error) {
    return reply.code(404).send({ ok: false, error: errMessage(error) });
  }
}

export const workspaceRoutes: FastifyPluginAsync<WorkspaceRouteOptions> = async (app, opts) => {
  const rootPath = path.resolve(opts.workspaceRoot);

  app.get("/workspace/meta", async () => ({
    ok: true,
    root: rootPath
  }));

  app.get<{ Querystring: ListQuery }>("/workspace/list", async (req, reply) => {
    const relativePath = sanitizeRelativePath(req.query.path);
    const listLimit = parseListLimit(req.query.limit);

    const absolutePath = await getAbsolutePath(rootPath, relativePath).catch((error) => {
      reply.code(400).send({ ok: false, error: errMessage(error) });
      return "";
    });
    if (!absolutePath) return;

    const directoryStat = await fs.stat(absolutePath).catch((error) => {
      reply.code(404).send({ ok: false, error: errMessage(error) });
      return null;
    });
    if (!directoryStat) return;

    if (!directoryStat.isDirectory()) {
      return reply.code(400).send({ ok: false, error: "path is not a directory" });
    }

    try {
      const result = await listDirectory(rootPath, absolutePath, req.query.includeHidden === "true", listLimit);
      return reply.send(result);
    } catch (error) {
      return reply.code(500).send({ ok: false, error: errMessage(error) });
    }
  });

  app.get<{ Querystring: ReadFileQuery }>("/workspace/file", async (req, reply) => {
    const relativePath = sanitizeRelativePath(req.query.path);
    return readFile(rootPath, relativePath, reply);
  });

  const writeFileHandler = async (req: { body: WriteFileBody }, reply: { code: (status: number) => { send: (value: unknown) => void }; send: (value: unknown) => void }): Promise<void> => {
    const rawPath = typeof req.body.path === "string" ? req.body.path : "";
    const relativePath = sanitizeRelativePath(rawPath);
    const content = req.body.content;

    if (relativePath === ".") {
      reply.code(400).send({ ok: false, error: "file path is required" });
      return;
    }

    if (typeof content !== "string") {
      reply.code(400).send({ ok: false, error: "content must be a string" });
      return;
    }

    const absolutePath = await getAbsolutePath(rootPath, relativePath).catch((error) => {
      reply.code(400).send({ ok: false, error: errMessage(error) });
      return "";
    });
    if (!absolutePath) return;

    try {
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, content, "utf8");
      const fileStat = await fs.stat(absolutePath);
      reply.send({
        ok: true,
        root: rootPath,
        path: toRelativePath(rootPath, absolutePath),
        size: fileStat.size,
        mtimeMs: fileStat.mtimeMs
      });
    } catch (error) {
      reply.code(500).send({ ok: false, error: errMessage(error) });
    }
  };

  app.put<{ Body: WriteFileBody }>("/workspace/file", writeFileHandler);
  app.post<{ Body: WriteFileBody }>("/workspace/file", writeFileHandler);
};

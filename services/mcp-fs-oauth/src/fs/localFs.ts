import { promises as fs } from "node:fs";
import path from "node:path";

import { resolveWithinRoot } from "../util/pathJail.js";

import type { FsBackend, FsEntry, FsStat } from "./types.js";

export class LocalFsBackend implements FsBackend {
  public readonly name = "local" as const;

  constructor(private readonly rootAbs: string) {}

  async available(): Promise<boolean> {
    try {
      const st = await fs.stat(this.rootAbs);
      return st.isDirectory();
    } catch {
      return false;
    }
  }

  private toAbs(userPath: string) {
    return resolveWithinRoot(this.rootAbs, userPath);
  }

  async list(dirPath: string): Promise<FsEntry[]> {
    const { absPath, relPath } = this.toAbs(dirPath);
    const st = await fs.stat(absPath);
    if (!st.isDirectory()) throw new Error("Not a directory");

    const entries = await fs.readdir(absPath, { withFileTypes: true });
    return entries.map((e) => {
      const p = relPath ? `${relPath}/${e.name}` : e.name;
      return {
        name: e.name,
        path: p,
        kind: e.isDirectory() ? "dir" : "file",
      };
    });
  }

  async readFile(filePath: string): Promise<{ path: string; content: string; etag?: string }> {
    const { absPath, relPath } = this.toAbs(filePath);
    const buf = await fs.readFile(absPath);
    // For simplicity, treat as UTF-8 text.
    return { path: relPath, content: buf.toString("utf8") };
  }

  async writeFile(filePath: string, content: string): Promise<{ path: string; etag?: string }> {
    const { absPath, relPath } = this.toAbs(filePath);
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    await fs.writeFile(absPath, content, "utf8");
    return { path: relPath };
  }

  async deletePath(targetPath: string): Promise<{ path: string }> {
    const { absPath, relPath } = this.toAbs(targetPath);
    const st = await fs.stat(absPath);
    if (st.isDirectory()) {
      await fs.rm(absPath, { recursive: true, force: true });
    } else {
      await fs.unlink(absPath);
    }
    return { path: relPath };
  }

  async stat(targetPath: string): Promise<FsStat> {
    const { absPath, relPath } = this.toAbs(targetPath);
    const st = await fs.stat(absPath);
    return {
      path: relPath,
      kind: st.isDirectory() ? "dir" : "file",
      size: st.isFile() ? st.size : undefined,
    };
  }
}

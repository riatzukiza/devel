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

  private async verifyPathWithinRoot(absPath: string): Promise<void> {
    // Resolve the root once
    const realRoot = await fs.realpath(this.rootAbs);
    const normalizedRealRoot = path.normalize(realRoot);
    
    // For non-existent paths, validate each parent directory exists within root
    let currentPath = absPath;
    while (true) {
      try {
        // Try to resolve the real path (following symlinks)
        const realPath = await fs.realpath(currentPath);
        const normalizedRealPath = path.normalize(realPath);
        
        // Ensure the resolved path is still within the root
        if (!normalizedRealPath.startsWith(normalizedRealRoot + path.sep) && 
            normalizedRealPath !== normalizedRealRoot) {
          throw new Error(`Path escapes root: resolved to ${realPath} which is outside ${this.rootAbs}`);
        }
        return; // Path verified successfully
      } catch (error) {
        const errnoError = error as NodeJS.ErrnoException;
        if (errnoError.code === "ENOENT") {
          // Path doesn't exist, check parent directory
          const parentDir = path.dirname(currentPath);
          
          // If we've reached the root or the parent is the same as current (shouldn't happen)
          if (parentDir === currentPath || parentDir === normalizedRealRoot) {
            // The root exists and we've verified it, so this path is valid
            return;
          }
          
          // Check if parent directory exists
          try {
            const realParent = await fs.realpath(parentDir);
            const normalizedRealParent = path.normalize(realParent);
            
            if (!normalizedRealParent.startsWith(normalizedRealRoot + path.sep) && 
                normalizedRealParent !== normalizedRealRoot) {
              throw new Error(`Parent path escapes root: ${parentDir} resolves to ${realParent} which is outside ${this.rootAbs}`);
            }
            // Parent is valid, so the original path would be valid
            return;
          } catch (parentError) {
            const parentErrnoError = parentError as NodeJS.ErrnoException;
            if (parentErrnoError.code === "ENOENT") {
              // Parent also doesn't exist, continue up the tree
              currentPath = parentDir;
              continue;
            }
            throw parentError;
          }
        }
        throw error; // Other errors (permission, etc.)
      }
    }
  }

  async list(dirPath: string): Promise<FsEntry[]> {
    const { absPath, relPath } = this.toAbs(dirPath);
    await this.verifyPathWithinRoot(absPath);
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
    await this.verifyPathWithinRoot(absPath);
    const buf = await fs.readFile(absPath);
    // For simplicity, treat as UTF-8 text.
    return { path: relPath, content: buf.toString("utf8") };
  }

  async writeFile(filePath: string, content: string): Promise<{ path: string; etag?: string }> {
    const { absPath, relPath } = this.toAbs(filePath);
    await this.verifyPathWithinRoot(absPath);
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    await fs.writeFile(absPath, content, "utf8");
    return { path: relPath };
  }

  async deletePath(targetPath: string): Promise<{ path: string }> {
    const { absPath, relPath } = this.toAbs(targetPath);
    await this.verifyPathWithinRoot(absPath);
    const st = await fs.lstat(absPath);
    if (st.isDirectory()) {
      await fs.rm(absPath, { recursive: true, force: true });
    } else {
      await fs.unlink(absPath);
    }
    return { path: relPath };
  }

  async stat(targetPath: string): Promise<FsStat> {
    const { absPath, relPath } = this.toAbs(targetPath);
    await this.verifyPathWithinRoot(absPath);
    const st = await fs.stat(absPath);
    return {
      path: relPath,
      kind: st.isDirectory() ? "dir" : "file",
      size: st.isFile() ? st.size : undefined,
    };
  }
}

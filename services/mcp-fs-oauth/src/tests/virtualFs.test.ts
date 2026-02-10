import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "bun:test";

import { LocalFsBackend } from "../fs/localFs.js";
import { VirtualFs } from "../fs/virtualFs.js";

const setupVirtualFs = async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-virtualfs-test-"));
  const backend = new LocalFsBackend(tempDir);
  const vfs = new VirtualFs("local", backend, null, tempDir);
  return { tempDir, vfs };
};

const runGit = async (cwd: string, args: string[]): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("git", args, { cwd });
    let stderr = "";

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`git ${args.join(" ")} failed (${code ?? -1}): ${stderr.trim()}`));
    });
  });
};

describe("VirtualFs: treePage", () => {
  it("returns paginated tree slices with cursor", async () => {
    const { tempDir, vfs } = await setupVirtualFs();
    try {
      await fs.mkdir(path.join(tempDir, "src"), { recursive: true });
      await fs.writeFile(path.join(tempDir, "README.md"), "hello", "utf8");
      await fs.writeFile(path.join(tempDir, "package.json"), "{}", "utf8");
      await fs.writeFile(path.join(tempDir, "src", "a.ts"), "export const a = 1", "utf8");
      await fs.writeFile(path.join(tempDir, "src", "b.ts"), "export const b = 2", "utf8");
      await fs.writeFile(path.join(tempDir, "src", "c.ts"), "export const c = 3", "utf8");

      const page1 = await vfs.treePage("", 4, { pageSize: 2, includeHidden: true }, "local");
      expect(page1.returnedEntries).toBe(2);
      expect(page1.hasMore).toBe(true);
      expect(page1.nextCursor).toBeTruthy();

      const page2 = await vfs.treePage(
        "",
        4,
        { pageSize: 2, cursor: page1.nextCursor, includeHidden: true },
        "local",
      );

      const page1Paths = new Set(page1.entries.map((entry) => entry.path));
      expect(page2.entries.some((entry) => page1Paths.has(entry.path))).toBe(false);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("rejects malformed pagination cursors", async () => {
    const { tempDir, vfs } = await setupVirtualFs();
    try {
      await expect(vfs.treePage("", 2, { cursor: "@@bad@@" }, "local")).rejects.toThrow(
        "Invalid cursor",
      );
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe("VirtualFs: grep and glob", () => {
  it("respects .gitignore when using grep", async () => {
    const { tempDir, vfs } = await setupVirtualFs();
    try {
      await fs.writeFile(path.join(tempDir, ".gitignore"), "ignored.txt\n", "utf8");
      await fs.writeFile(path.join(tempDir, "ignored.txt"), "token", "utf8");
      await fs.writeFile(path.join(tempDir, "visible.txt"), "token", "utf8");

      const result = await vfs.grep("token", { include: "**/*.txt", maxResults: 10 }, "local");
      const paths = result.matches.map((match) => match.path);

      expect(paths).toContain("visible.txt");
      expect(paths).not.toContain("ignored.txt");
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("filters grep results by include glob", async () => {
    const { tempDir, vfs } = await setupVirtualFs();
    try {
      await fs.mkdir(path.join(tempDir, "src"), { recursive: true });
      await fs.mkdir(path.join(tempDir, "docs"), { recursive: true });
      await fs.writeFile(path.join(tempDir, "src", "main.ts"), "const token = 'abc'", "utf8");
      await fs.writeFile(path.join(tempDir, "docs", "notes.md"), "token appears in docs", "utf8");

      const result = await vfs.grep(
        "token",
        { include: "**/*.ts", maxResults: 10, includeHidden: true },
        "local",
      );

      expect(result.matches.length).toBe(1);
      expect(result.matches[0]?.path).toBe("src/main.ts");
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("returns glob matches by pattern", async () => {
    const { tempDir, vfs } = await setupVirtualFs();
    try {
      await fs.mkdir(path.join(tempDir, "src"), { recursive: true });
      await fs.writeFile(path.join(tempDir, "src", "main.ts"), "", "utf8");
      await fs.writeFile(path.join(tempDir, "README.md"), "", "utf8");

      const result = await vfs.glob("**/*.ts", { includeDirectories: false }, "local");
      expect(result.matches.some((match) => match.path === "src/main.ts")).toBe(true);
      expect(result.matches.some((match) => match.path.endsWith(".md"))).toBe(false);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("matches glob patterns when path is absolute inside local root", async () => {
    const { tempDir, vfs } = await setupVirtualFs();
    try {
      await fs.mkdir(path.join(tempDir, "src", "nested"), { recursive: true });
      await fs.writeFile(path.join(tempDir, "src", "main.ts"), "", "utf8");
      await fs.writeFile(path.join(tempDir, "src", "nested", "util.ts"), "", "utf8");

      const absoluteSearchPath = path.join(tempDir, "src");
      const result = await vfs.glob("*", {
        path: absoluteSearchPath,
        includeDirectories: false,
      }, "local");

      const paths = result.matches.map((match) => match.path);
      expect(paths).toContain("src/main.ts");
      expect(paths).not.toContain("src/nested/util.ts");
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("excludes gitignored paths from glob and tree", async () => {
    const { tempDir, vfs } = await setupVirtualFs();
    try {
      await runGit(tempDir, ["init", "-q"]);
      await fs.writeFile(path.join(tempDir, ".gitignore"), "dist/\n", "utf8");
      await fs.mkdir(path.join(tempDir, "dist"), { recursive: true });
      await fs.writeFile(path.join(tempDir, "dist", "bundle.js"), "console.log('ignored')", "utf8");
      await fs.writeFile(path.join(tempDir, "src.ts"), "export const visible = true", "utf8");

      const globResult = await vfs.glob("**/*", { includeDirectories: true, includeHidden: true }, "local");
      const globPaths = globResult.matches.map((match) => match.path);
      expect(globPaths).toContain("src.ts");
      expect(globPaths).not.toContain("dist");
      expect(globPaths).not.toContain("dist/bundle.js");

      const treePage = await vfs.treePage("", 3, { pageSize: 100, includeHidden: true }, "local");
      const treePaths = treePage.entries.map((entry) => entry.path);
      expect(treePaths).toContain("src.ts");
      expect(treePaths).not.toContain("dist");
      expect(treePaths).not.toContain("dist/bundle.js");
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});

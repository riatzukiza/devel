import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, it, expect } from "bun:test";

import { LocalFsBackend } from "../fs/localFs.js";

const getSetup = async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-fs-test-"));
  const backend = new LocalFsBackend(tempDir);
  return { tempDir, backend };
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

describe("LocalFsBackend: list", () => {
  it("should list files in root directory", async () => {
    const { tempDir, backend } = await getSetup();
    try {
      await fs.writeFile(path.join(tempDir, "file1.txt"), "content1");
      await fs.writeFile(path.join(tempDir, "file2.txt"), "content2");
      await fs.mkdir(path.join(tempDir, "subdir"));
      await fs.writeFile(path.join(tempDir, "subdir", "file3.txt"), "content3");

      const entries = await backend.list("");
      expect(entries).toHaveLength(3);

      const names = entries.map(e => e.name).sort();
      expect(names).toEqual(["file1.txt", "file2.txt", "subdir"]);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("should list nested directory contents", async () => {
    const { tempDir, backend } = await getSetup();
    try {
      await fs.mkdir(path.join(tempDir, "subdir"), { recursive: true });
      await fs.writeFile(path.join(tempDir, "subdir", "file.txt"), "content");
      const entries = await backend.list("subdir");
      expect(entries).toHaveLength(1);
      expect(entries[0].name).toBe("file.txt");
      expect(entries[0].kind).toBe("file");
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("should exclude gitignored entries", async () => {
    const { tempDir, backend } = await getSetup();
    try {
      await runGit(tempDir, ["init", "-q"]);
      await fs.writeFile(path.join(tempDir, ".gitignore"), "dist/\nnode_modules/\n", "utf8");
      await fs.mkdir(path.join(tempDir, "dist"), { recursive: true });
      await fs.mkdir(path.join(tempDir, "node_modules"), { recursive: true });
      await fs.writeFile(path.join(tempDir, "src.ts"), "export const x = 1", "utf8");

      const entries = await backend.list("");
      const names = entries.map((entry) => entry.name).sort();

      expect(names).toContain("src.ts");
      expect(names).not.toContain("dist");
      expect(names).not.toContain("node_modules");
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe("LocalFsBackend: readFile", () => {
  it("should read file contents", async () => {
    const { tempDir, backend } = await getSetup();
    try {
      await fs.writeFile(path.join(tempDir, "file.txt"), "content");
      const result = await backend.readFile("file.txt");
      expect(result.path).toBe("file.txt");
      expect(result.content).toBe("content");
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("should throw for non-existent file", async () => {
    const { tempDir, backend } = await getSetup();
    try {
      await expect(backend.readFile("nonexistent.txt")).rejects.toThrow();
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe("LocalFsBackend: writeFile", () => {
  it("should create new file", async () => {
    const { tempDir, backend } = await getSetup();
    try {
      const result = await backend.writeFile("newfile.txt", "new content");
      expect(result.path).toBe("newfile.txt");

      const content = await fs.readFile(path.join(tempDir, "newfile.txt"), "utf8");
      expect(content).toBe("new content");
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("should create nested directories", async () => {
    const { tempDir, backend } = await getSetup();
    try {
      await backend.writeFile("nested/deep/file.txt", "deep content");
      const content = await fs.readFile(path.join(tempDir, "nested/deep/file.txt"), "utf8");
      expect(content).toBe("deep content");
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe("LocalFsBackend: deletePath", () => {
  it("should delete file", async () => {
    const { tempDir, backend } = await getSetup();
    try {
      await fs.writeFile(path.join(tempDir, "file.txt"), "content");
      await backend.deletePath("file.txt");
      const exists = await fs.access(path.join(tempDir, "file.txt")).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("should delete directory recursively", async () => {
    const { tempDir, backend } = await getSetup();
    try {
      await fs.mkdir(path.join(tempDir, "nested"), { recursive: true });
      await backend.deletePath("nested");
      const exists = await fs.access(path.join(tempDir, "nested")).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe("LocalFsBackend: path jail", () => {
  it("should reject paths outside root", async () => {
    const { tempDir, backend } = await getSetup();
    try {
      await expect(backend.readFile("../etc/passwd")).rejects.toThrow("escapes root");
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});

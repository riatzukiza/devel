import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "bun:test";

import { applyPatchText } from "../tools/applyPatch.js";

const runGit = async (cwd: string, args: readonly string[]): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("git", [...args], { cwd });
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

const setupRepo = async (): Promise<string> => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-apply-patch-test-"));
  await runGit(tempDir, ["init", "-q"]);
  return tempDir;
};

describe("applyPatchText", () => {
  it("applies a valid apply_patch payload", async () => {
    const tempDir = await setupRepo();
    try {
      await fs.writeFile(path.join(tempDir, "hello.txt"), "old\n", "utf8");
      const patchText = [
        "*** Begin Patch",
        "*** Update File: hello.txt",
        "@@",
        "-old",
        "+new",
        "*** End Patch",
      ].join("\n");

      const result = await applyPatchText(patchText, { cwd: tempDir });
      const content = await fs.readFile(path.join(tempDir, "hello.txt"), "utf8");

      expect(result.output).toContain("M hello.txt");
      expect(content).toBe("new\n");
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("creates a new file", async () => {
    const tempDir = await setupRepo();
    try {
      const patchText = [
        "*** Begin Patch",
        "*** Add File: hello.txt",
        "+new",
        "*** End Patch",
      ].join("\n");

      const result = await applyPatchText(patchText, { cwd: tempDir });
      const content = await fs.readFile(path.join(tempDir, "hello.txt"), "utf8");

      expect(result.output).toContain("A hello.txt");
      expect(content).toBe("new\n");
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("rejects non-apply_patch input", async () => {
    const tempDir = await setupRepo();
    try {
      await expect(applyPatchText("not a patch", { cwd: tempDir })).rejects.toThrow(
        "apply_patch verification failed: Invalid patch format: missing Begin/End markers",
      );
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});

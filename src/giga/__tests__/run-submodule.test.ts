import { describe, expect, it } from "bun:test";
import { spawn } from "bun";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "../../..");

async function runHelper(subPath: string): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = spawn({
    cmd: [
      "bun",
      "run",
      "src/giga/run-submodule.ts",
      subPath,
      "typecheck",
    ],
    cwd: repoRoot,
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return { exitCode, stdout, stderr };
}

describe("run-submodule cli", () => {
  it("exits successfully when the target script succeeds", async () => {
    const result = await runHelper("src/giga/__fixtures__/typecheck-success");
    expect(result.exitCode).toBe(0);
  });

  it("fails when the target script exits with a non-zero status", async () => {
    const result = await runHelper("src/giga/__fixtures__/typecheck-failure");
    expect(result.exitCode).toBe(1);
  });
});

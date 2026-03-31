import { describe, expect, it } from "bun:test";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "bun";

const repoRoot = process.cwd();

const runCli = async (args: readonly string[]): Promise<{ readonly stdout: string; readonly stderr: string; readonly exitCode: number }> => {
  const proc = spawn({
    cmd: ["pnpm", "exec", "tsx", "src/parameter-golf-ant-lab/cli.ts", ...args],
    cwd: repoRoot,
    stdout: "pipe",
    stderr: "pipe"
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited
  ]);

  return { stdout, stderr, exitCode };
};

describe("parameter-golf ant lab cli", () => {
  it("initializes, proposes, records, and reports status", async () => {
    const labDir = await fs.mkdtemp(path.join(os.tmpdir(), "pg-ant-lab-"));

    const init = await runCli(["init", "--lab-dir", labDir, "--profile", "all"]);
    expect(init.exitCode).toBe(0);
    expect(init.stderr).toBe("");
    expect(init.stdout).toContain("board");
    expect(init.stdout).toContain("presence");

    const step = await runCli(["step", "--lab-dir", labDir, "--profile", "board", "--count", "3"]);
    expect(step.exitCode).toBe(0);
    expect(step.stderr).toBe("");
    const stepJson = JSON.parse(step.stdout) as { readonly jsonPath: string; readonly step: number };
    expect(stepJson.step).toBe(1);

    const statePath = path.join(labDir, "board", "state.json");
    const state = JSON.parse(await fs.readFile(statePath, "utf8")) as {
      readonly candidates: readonly Array<{ readonly id: string }>;
    };
    expect(state.candidates.length).toBe(3);

    const record = await runCli([
      "record",
      "--lab-dir",
      labDir,
      "--profile",
      "board",
      "--candidate-id",
      state.candidates[0]?.id ?? "",
      "--metrics-json",
      '{"val_bpb":1.21,"bytes_total":15800000,"wallclock_seconds":570}'
    ]);
    expect(record.exitCode).toBe(0);
    expect(record.stderr).toBe("");
    expect(record.stdout).toContain("bestCandidateId");

    const status = await runCli(["status", "--lab-dir", labDir, "--profile", "board"]);
    expect(status.exitCode).toBe(0);
    expect(status.stderr).toBe("");
    const statusJson = JSON.parse(status.stdout) as { readonly evaluatedCount: number; readonly bestCandidateId: string | null };
    expect(statusJson.evaluatedCount).toBe(1);
    expect(statusJson.bestCandidateId).toBe(state.candidates[0]?.id ?? null);
  }, 15000);
});

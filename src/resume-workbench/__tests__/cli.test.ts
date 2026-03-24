import { describe, expect, it } from "bun:test";
import { promises as fs } from "node:fs";
import path from "node:path";
import { spawn } from "bun";

const repoRoot = process.cwd();

describe("resume-workbench cli", () => {
  it("writes report files for a resume/job pair", async () => {
    const outputDir = path.join(repoRoot, "resume/analysis/tmp/test-workbench");
    await fs.mkdir(outputDir, { recursive: true });
    const proc = spawn({
      cmd: [
        "pnpm",
        "exec",
        "tsx",
        "src/resume-workbench/cli.ts",
        "--resume",
        "resume/aaron-beavers-jorie-ai-v2-ats.pdf",
        "--job",
        "resume/analysis/tmp/jd-jorie-ai.txt",
        "--output-dir",
        outputDir,
        "--slug",
        "test-report"
      ],
      cwd: repoRoot,
      stdout: "pipe",
      stderr: "pipe"
    });

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    expect(stdout).toContain("test-report.json");
    const jsonPath = path.join(outputDir, "test-report.json");
    const markdownPath = path.join(outputDir, "test-report.md");
    const json = JSON.parse(await fs.readFile(jsonPath, "utf8")) as { readonly pairs: readonly unknown[] };
    expect(json.pairs.length).toBe(1);
    expect(await fs.readFile(markdownPath, "utf8")).toContain("Hybrid score");
  });
});

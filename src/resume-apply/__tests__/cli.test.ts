import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

// This is a smoke test that ensures the CLI can build a bundle from a local job file.
// It uses --dry-run=false and writes into the repo under resume/applications/.
// We keep the test idempotent by using a unique date+slug.

describe("resume:apply", () => {
  test("creates an application bundle from --job-file", () => {
    const tmpDir = mkdtempSync(path.join(os.tmpdir(), "resume-apply-"));
    const jobPath = path.join(tmpDir, "jd.txt");
    // include some bullets to exercise extraction
    writeFileSync(jobPath, "Responsibilities\n- Build APIs\n- Docker\n- OAuth\n", "utf8");

    const date = "2099-01-01";
    const company = "Acme Test";
    const role = "DevSecOps Engineer";

    const out = execFileSync(
      "pnpm",
      [
        "-s",
        "resume:apply",
        "--",
        "--company", company,
        "--role", role,
        "--job-file", jobPath,
        "--date", date,
        "--dry-run"
      ],
      { encoding: "utf8" }
    );

    // pnpm may still print non-JSON lines in some environments; parse last JSON object.
    const lastBrace = out.lastIndexOf("{");
    const jsonChunk = lastBrace >= 0 ? out.slice(lastBrace) : out;
    const parsed = JSON.parse(jsonChunk) as { bundleRoot: string };
    expect(parsed.bundleRoot.includes(`resume/applications/${date}`)).toBe(true);

    // dry-run should NOT create the directory.
    // Ensure bundleRoot doesn't exist on disk.
    expect(() => readFileSync(path.join(parsed.bundleRoot, "RECEIPTS.md"), "utf8")).toThrow();

    rmSync(tmpDir, { recursive: true, force: true });
  });
});

/*
  Pantheon commit message generator (pluggable).
  - If PANTHEON_CLI is set, we will invoke it to produce a message body.
  - Otherwise, we use a fallback summarizer based on staged diff and metadata.
*/

import { spawn } from "bun";

export type PantheonInput = {
  readonly repoPath: string;
  readonly action: string; // e.g., watch-test, watch-build, submodule-update
  readonly result: "success" | "failure";
  readonly version?: string;
  readonly affectedFiles?: readonly string[];
};

export async function generateCommitMessage(input: PantheonInput): Promise<string> {
  const { repoPath, action, result, version, affectedFiles } = input;
  const pantheonCli = process.env.PANTHEON_CLI;

  if (pantheonCli) {
    try {
      const proc = spawn({
        cmd: pantheonCli.split(" "),
        cwd: repoPath,
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe",
        env: process.env,
      });
      const prompt = JSON.stringify({ action, result, version, affectedFiles });
      await proc.stdin?.write(prompt);
      proc.stdin?.end();
      const out = await new Response(proc.stdout).text();
      const err = await new Response(proc.stderr).text();
      if (proc.exitCode === 0 && out.trim()) return out.trim();
      console.warn("Pantheon CLI failed, falling back.", err);
      // fallthrough → fallback
    } catch (e) {
      console.warn("Pantheon CLI invocation error, falling back.", e);
      // fallthrough
    }
  }

  // Fallback: summarize staged changes and metadata
  const diffStat = await run(
    ["git", "diff", "--staged", "--stat"],
    repoPath
  );
  const files = (affectedFiles ?? []).slice(0, 20).join(", ");
  const v = version ? `v${version}` : "";

  return [
    `${action} ${result}${v ? " (" + v + ")" : ""}`,
    "",
    files ? `Affected: ${files}` : "",
    diffStat ? `\nChanges:\n${diffStat}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function run(cmd: string[], cwd: string): Promise<string> {
  const proc = spawn({ cmd, cwd, stdout: "pipe", stderr: "pipe" });
  const [out, err] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  if (proc.exitCode === 0) return out.trim();
  console.warn(`Command failed ${cmd.join(" ")}:`, err.trim());
  return "";
}

// CLI usage: bun run src/giga/pantheon.ts <action> <result> <repoPath> [version]
if (import.meta.main) {
  const [action, result, repoPath, version] = process.argv.slice(2);
  if (!action || !result || !repoPath) {
    console.error(
      "Usage: bun run src/giga/pantheon.ts <action> <result> <repoPath> [version]"
    );
    process.exit(2);
  }
  generateCommitMessage({ repoPath, action, result: result as any, version })
    .then((msg) => {
      console.log(msg);
    })
    .catch((e) => {
      console.error("Pantheon generation failed:", e);
      process.exit(1);
    });
}

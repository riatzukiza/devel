import { describe, expect, it } from "bun:test";
import { spawn } from "bun";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "../../..");

const FAKE_GITLINK_SHA = "0123456789abcdef0123456789abcdef01234567";

async function runHelper(
  subPath: string,
  target: string = "typecheck",
  cwd: string = repoRoot,
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = spawn({
    cmd: [
      "bun",
      "run",
      resolve(repoRoot, "src/giga/run-submodule.ts"),
      subPath,
      target,
    ],
    cwd,
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

async function git(cwd: string, ...args: readonly string[]): Promise<void> {
  const proc = spawn({ cmd: ["git", ...args], cwd, stdout: "pipe", stderr: "pipe" });
  const [, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (exitCode !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${stderr}`);
  }
}

/** A repo containing `name` as a gitlink that was never initialized. */
async function initRepoWithUninitializedGitlink(dir: string, name: string): Promise<void> {
  await git(dir, "init", "-q", ".");
  await git(dir, "config", "user.email", "test@example.com");
  await git(dir, "config", "user.name", "Test");
  await mkdir(join(dir, name), { recursive: true });
  await writeFile(
    join(dir, ".gitmodules"),
    `[submodule "${name}"]\n\tpath = ${name}\n\turl = git@example.com:o/${name}.git\n`,
  );
  await git(dir, "update-index", "--add", "--cacheinfo", `160000,${FAKE_GITLINK_SHA},${name}`);
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

  it("refuses to run against an uninitialized gitlink", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "giga-uninit-"));
    try {
      await initRepoWithUninitializedGitlink(workspace, "sub");

      const result = await runHelper("sub", "test", workspace);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("not initialized");
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });

  it("refuses to run against an uninitialized NESTED gitlink", async () => {
    // The nested case the workspace-root .gitmodules cannot see: `deep` is
    // declared only inside the intermediate submodule `mid`, which is its own
    // repository.
    const workspace = await mkdtemp(join(tmpdir(), "giga-nested-"));
    try {
      await git(workspace, "init", "-q", ".");
      await git(workspace, "config", "user.email", "test@example.com");
      await git(workspace, "config", "user.name", "Test");

      const mid = join(workspace, "mid");
      await mkdir(mid, { recursive: true });
      await initRepoWithUninitializedGitlink(mid, "deep");

      const result = await runHelper(join("mid", "deep"), "test", workspace);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("not initialized");
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });

  it("typechecks a submodule that ships a tsconfig but no package.json", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "giga-tsonly-"));
    try {
      const sub = join(workspace, "sub");
      await mkdir(sub, { recursive: true });
      await writeFile(join(sub, "tsconfig.json"), '{"compilerOptions":{"noEmit":true}}');

      const result = await runHelper("sub", "typecheck", workspace);

      // The compiler itself may be unavailable here; what matters is that
      // discovery ran instead of skipping straight to a green result.
      const output = `${result.stdout}${result.stderr}`;
      expect(output).toContain("running TypeScript on tsconfig.json");
      expect(output).not.toContain("no supported typecheck strategy detected");
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });

  it("fails when a package manifest exists but cannot be parsed", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "giga-badpkg-"));
    try {
      const sub = join(workspace, "sub");
      await mkdir(sub, { recursive: true });
      // Truncated manifest, e.g. an interrupted write or conflict markers.
      await writeFile(join(sub, "package.json"), '{ "name": "sub", "scripts": {');

      const result = await runHelper("sub", "test", workspace);

      expect(result.exitCode).not.toBe(0);
      expect(`${result.stdout}${result.stderr}`).toContain("Failed to parse");
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });
});

describe("generate-nx-projects cli", () => {
  it("fails when submodule discovery errors instead of reporting an empty workspace", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "giga-nogit-"));
    try {
      // Not a git repository, so `git submodule status --recursive` exits
      // nonzero. Previously this was swallowed into an empty list and reported
      // as "No submodules found. Nothing to generate." with exit 0.
      const proc = spawn({
        cmd: ["bun", "run", resolve(repoRoot, "src/giga/generate-nx-projects.ts")],
        cwd: workspace,
        stdout: "pipe",
        stderr: "pipe",
      });
      const [stdout, stderr, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ]);

      expect(exitCode).not.toBe(0);
      expect(`${stdout}${stderr}`).not.toContain("Nothing to generate");
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });

  it("preserves whitespace in submodule paths", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "giga-wsp-"));
    try {
      // Splitting the status line on whitespace truncated `sub dir` to `sub`,
      // producing targets that pointed at a directory that does not exist.
      await initRepoWithUninitializedGitlink(workspace, "sub dir");

      const proc = spawn({
        cmd: ["bun", "run", resolve(repoRoot, "src/giga/generate-nx-projects.ts")],
        cwd: workspace,
        stdout: "pipe",
        stderr: "pipe",
      });
      await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ]);

      const generated = JSON.parse(
        await readFile(join(workspace, "projects", "sub-dir", "project.json"), "utf8"),
      );
      // The command must name the full path, not the truncated `sub`.
      expect(generated.targets.test.options.command).toContain('"sub dir"');
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });

  it("warns, but still generates, when a parent submodule is uninitialized", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "giga-partial-"));
    try {
      // `git submodule status --recursive` exits 0 here but reports the parent
      // as `-<sha> parent` and cannot enumerate anything nested under it.
      await initRepoWithUninitializedGitlink(workspace, "parent");

      const proc = spawn({
        cmd: ["bun", "run", resolve(repoRoot, "src/giga/generate-nx-projects.ts")],
        cwd: workspace,
        stdout: "pipe",
        stderr: "pipe",
      });
      const [stdout, stderr, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ]);

      // Not a failure: a normal checkout leaves every submodule uninitialized,
      // so refusing here would make the command unusable. It must not be silent.
      expect(exitCode).toBe(0);
      expect(`${stdout}${stderr}`).toContain("are not initialized");
      expect(`${stdout}${stderr}`).toContain("incomplete");
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });
});

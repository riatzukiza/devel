import { mkdir, mkdtemp, rm, writeFile } from "fs/promises";
import path from "path";
import { tmpdir } from "os";
import { afterEach, describe, expect, it, vi } from "vitest";

type ListFilesFn = typeof import("../src/fs.js").listFiles;
type FsModule = { listFiles: ListFilesFn };

const createdRoots: string[] = [];

async function createRepoRoot() {
  const root = await mkdtemp(path.join(tmpdir(), "agentd-fs-"));
  createdRoots.push(root);
  return root;
}

async function loadFs(repoPath: string): Promise<FsModule> {
  process.env.REPO_PATH = repoPath;
  vi.resetModules();
  const mod = await import("../src/fs.js");
  return mod;
}

afterEach(async () => {
  for (const root of createdRoots.splice(0)) {
    await rm(root, { recursive: true, force: true });
  }
  delete process.env.REPO_PATH;
  vi.resetModules();
});

describe("listFiles", () => {
  it("rejects traversal outside the repository", async () => {
    const repo = await createRepoRoot();
    const { listFiles } = await loadFs(repo);

    await expect(listFiles("../outside")).rejects.toThrow(/Invalid path/);
  });

  it("sorts entries and marks submodules from .gitmodules and gitdir", async () => {
    const repo = await createRepoRoot();
    const depsDir = path.join(repo, "deps");
    await mkdir(path.join(depsDir, "lib"), { recursive: true });
    await writeFile(path.join(repo, ".gitmodules"), "[submodule \"lib\"]\n\tpath = deps/lib\n");

    const pluginsDir = path.join(repo, "plugins");
    await mkdir(pluginsDir, { recursive: true });
    await writeFile(path.join(pluginsDir, ".git"), "gitdir: ../.git/modules/plugin\n");

    await writeFile(path.join(repo, "a.txt"), "hello");

    const { listFiles } = await loadFs(repo);
    const rootListing = await listFiles(".");

    expect(rootListing.entries.map(e => e.name)).toEqual(["deps", "plugins", ".gitmodules", "a.txt"]);
    const pluginsEntry = rootListing.entries.find(e => e.name === "plugins");
    expect(pluginsEntry?.isSubmodule).toBe(true);

    const depsListing = await listFiles("deps");
    const libEntry = depsListing.entries.find(e => e.name === "lib");
    expect(libEntry?.isSubmodule).toBe(true);
    expect(libEntry?.path).toBe("deps/lib");
  });
});

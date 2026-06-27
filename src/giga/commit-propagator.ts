/*
  Commit and tag propagation utilities to bubble submodule updates up to parent repos.
  - Commits locally; pushing is gated by GIGA_PUSH=1.
  - Tag format: giga/v<version>/<action>/<result>/<id>
*/

import { spawn } from "bun";
import { generateCommitMessage } from "./pantheon";

export type ActionResult = "success" | "failure";

export async function propagateFromSubmodule(
  subRepoPath: string,
  action: string,
  result: ActionResult,
  affectedFiles: readonly string[]
): Promise<void> {
  const hasChanges = await repoHasStagedOrUnstagedChanges(subRepoPath);
  if (!hasChanges) {
    // Nothing to commit, but still raise parent pointer if necessary (e.g., version bumps already committed)
    await bubbleToParents(subRepoPath, action, result, "No local changes.");
    return;
  }

  // Stage all and commit in the submodule
  await run(["git", "add", "-A"], subRepoPath);
  const version = await detectVersion(subRepoPath);
  const msg = await generateCommitMessage({
    repoPath: subRepoPath,
    action,
    result,
    version,
    affectedFiles,
  });

  await run(["git", "commit", "-m", msg], subRepoPath);
  const tagName = await tagCurrentCommit(subRepoPath, action, result, version);

  await bubbleToParents(
    subRepoPath,
    action,
    result,
    `child-tag=${tagName}`
  );
}

async function bubbleToParents(
  childRepoPath: string,
  action: string,
  result: ActionResult,
  extraContext: string
): Promise<void> {
  // Discover parent working tree
  const parent = (await run(
    ["git", "rev-parse", "--show-superproject-working-tree"],
    childRepoPath
  )).trim();

  if (!parent) return; // no parent

  // Stage the submodule pointer in parent
  // Note: compute relative path from parent to child
  const relPath = await run(["bash", "-lc", `python3 - <<'PY'\nimport os,sys\nprint(os.path.relpath('${childRepoPath}'.strip(), '${parent}'.strip()))\nPY`], process.cwd());
  await run(["git", "add", relPath], parent);

  // Compose message for parent
  const version = await detectVersion(parent);
  const msg = await generateCommitMessage({
    repoPath: parent,
    action: `${action}:submodule-pointer-update`,
    result,
    version,
    affectedFiles: [relPath],
  });
  const fullMsg = `${msg}\n\nCaused-by: ${extraContext}`;

  // Commit and tag in parent
  await run(["git", "commit", "-m", fullMsg], parent);
  await runParentTasks(parent, relPath);
  const tagName = await tagCurrentCommit(parent, action, result, version);

  // Recurse up
  await bubbleToParents(parent, action, result, `child-tag=${tagName}`);
}

async function runParentTasks(parent: string, relPath: string): Promise<void> {
  // If parent has Nx, run affected targets; else fall back to package.json scripts
  const hasNx = await run(["bash", "-lc", "test -f nx.json && echo yes || echo no"], parent);
  if (hasNx.trim() === "yes") {
    await run(["bash", "-lc", `pnpm -C "${parent}" nx affected --target=test --files ${relPath}`], parent);
    await run(["bash", "-lc", `pnpm -C "${parent}" nx affected --target=build --files ${relPath}`], parent);
    return;
  }
  // fallback to scripts
  try {
    const pj = await Bun.file(`${parent}/package.json`).json();
    if (pj?.scripts?.test) {
      await run(["bash", "-lc", `pnpm -C "${parent}" test`], parent);
    }
    if (pj?.scripts?.build) {
      await run(["bash", "-lc", `pnpm -C "${parent}" build`], parent);
    }
  } catch {/* ignore */}
}

async function tagCurrentCommit(
  repoPath: string,
  action: string,
  result: ActionResult,
  version?: string
): Promise<string> {
  const id = await nextId(repoPath);
  const v = version ? `v${version}` : "v0.0.0";
  const name = `giga/${v}/${action}/${result}/${id}`;
  // Lightweight tag (annotated would carry message; we keep it short)
  await run(["git", "tag", name], repoPath);
  if (process.env.GIGA_PUSH === "1") {
    await run(["git", "push", "--tags"], repoPath);
  }
  return name;
}

async function repoHasStagedOrUnstagedChanges(repoPath: string): Promise<boolean> {
  const out = await run(["git", "status", "--porcelain"], repoPath);
  return out.trim().length > 0;
}

async function detectVersion(repoPath: string): Promise<string | undefined> {
  // Prefer package.json
  try {
    const pj = await Bun.file(`${repoPath}/package.json`).json();
    if (pj && typeof pj.version === "string") return pj.version as string;
  } catch {
    // ignore
  }
  // Try git describe
  const tag = await run([
    "bash",
    "-lc",
    "git describe --tags --abbrev=0 2>/dev/null || echo "
  ], repoPath);
  if (tag) return tag.replace(/^v/, "");
  return undefined;
}

async function nextId(repoPath: string): Promise<string> {
  // Try scanning tags; fallback to a local counter file
  const list = await run(["git", "tag", "--list", "giga/*"], repoPath);
  const ids = list
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.split("/").pop()!)
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isFinite(n));
  const next = (ids.length ? Math.max(...ids) + 1 : 1).toString().padStart(6, "0");

  // Persist in .git/giga-id to avoid recomputing across branches
  try {
    const p = `${repoPath}/.git/giga-id`;
    const prev = parseInt(await Bun.file(p).text(), 10);
    const candidate = isFinite(prev) && prev + 1 > parseInt(next, 10) ? prev + 1 : parseInt(next, 10);
    await Bun.write(p, String(candidate));
    return String(candidate).padStart(6, "0");
  } catch {
    // write fresh
    await Bun.write(`${repoPath}/.git/giga-id`, next);
    return next;
  }
}

async function run(cmd: string[], cwd: string): Promise<string> {
  const proc = spawn({ cmd, cwd, stdout: "pipe", stderr: "pipe" });
  const [out, err] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  if (proc.exitCode === 0) return out.trim();
  // Surface errors to help debugging but continue for non-critical paths
  console.warn(`Command failed ${cmd.join(" ")}:`, err.trim());
  return "";
}

// CLI entry: propagate from path with action/result and files (rest args)
if (import.meta.main) {
  const [subRepoPath, action, result, ...files] = process.argv.slice(2);
  if (!subRepoPath || !action || !result) {
    console.error(
      "Usage: bun run src/giga/commit-propagator.ts <subRepoPath> <action> <success|failure> [files...]"
    );
    process.exit(2);
  }
  propagateFromSubmodule(subRepoPath, action, result as ActionResult, files)
    .then(() => process.exit(0))
    .catch((e) => {
      console.error("Propagation failed:", e);
      process.exit(1);
    });
}

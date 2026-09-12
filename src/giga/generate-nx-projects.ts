/*
  Generate Nx project stubs for each git submodule under orgs/** without
  modifying submodule contents. Projects are created under ./projects/<name>/project.json
  and proxy to the submodule's native test/build via run-submodule.ts.

  Usage:
    bun run src/giga/generate-nx-projects.ts [--force]

  Flags:
    --force  Overwrite existing projects/project.json files instead of skipping them
 */


import { execSync } from "child_process";
import { mkdir, stat, writeFile } from "fs/promises";

const ROOT = process.cwd();
const forceOverwrite = process.argv.slice(2).includes("--force");

async function main(): Promise<void> {
  const subs = await readSubmodules();
  if (subs.length === 0) {
    console.log("No submodules found. Nothing to generate.");
    return;
  }
  await mkdir(`${ROOT}/projects`, { recursive: true });

  let writes = 0;

  // Root utility project for watcher
  if (await ensureProject(
    `${ROOT}/projects/giga`,
    {
      name: "giga",
      projectType: "application",
      tags: ["giga"],
      targets: {
        watch: {
          executor: "nx:run-commands",
          options: {
            command: `bun run src/giga/giga-watch.ts`
          }
        }
      }
    },
    forceOverwrite
  )) {
    writes += 1;
  }

  for (const p of subs) {
    const name = safeName(p);
    if (await ensureProject(
      `${ROOT}/projects/${name}`,
      {
        name,
        projectType: "application",
        tags: ["submodule"],
        targets: {
          test: {
            executor: "nx:run-commands",
            options: {
              command: `bun run src/giga/run-submodule.ts "${p}" test`
            }
          },
          build: {
            executor: "nx:run-commands",
            options: {
              command: `bun run src/giga/run-submodule.ts "${p}" build`
            }
          },
          lint: {
            executor: "nx:run-commands",
            options: {
              command: `bun run src/giga/run-submodule.ts "${p}" lint`
            }
          },
          typecheck: {
            executor: "nx:run-commands",
            options: {
              command: `bun run src/giga/run-submodule.ts "${p}" typecheck`
            }
          }
        }
      },
      forceOverwrite
    )) {
      writes += 1;
    }
  }

  const note = forceOverwrite ? " (force overwrite enabled)" : "";
  console.log(`Wrote ${writes} Nx project file(s) under ./projects/${note}`);
}

async function ensureProject(dir: string, config: any, overwrite: boolean): Promise<boolean> {
  await mkdir(dir, { recursive: true });
  const filePath = `${dir}/project.json`;
  const exists = await fileExists(filePath);
  if (exists && !overwrite) {
    return false;
  }
  const json = JSON.stringify(config, null, 2) + "\n";
  await writeFile(filePath, json, { encoding: "utf8" });
  return true;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function readSubmodules(): Promise<string[]> {
  let output: string;
  try {
    output = execSync("git submodule status --recursive", { cwd: ROOT, encoding: "utf8" });
  } catch (error) {
    // An empty list here is indistinguishable from a healthy workspace with no
    // submodules, so `giga-nx-generate` would print "No submodules found",
    // exit 0, and leave the project graph absent or stale.
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`git submodule status --recursive failed in ${ROOT}: ${detail}`);
  }

  // `git submodule status` emits: <status-char><40-hex sha> <path>[ (<describe>)]
  // Splitting on whitespace truncates any path containing a space, so parse the
  // fixed-width prefix instead.
  const STATUS_LINE = /^([ +\-U])([0-9a-f]{40}) (.*)$/;
  const entries = output
    .split("\n")
    .map((line) => line.replace(/\r$/, ""))
    .filter((line) => line.length > 0)
    .map((line) => STATUS_LINE.exec(line))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => {
      // git appends " (<describe>)" only when it can describe the commit.
      const described = /^(.*) \([^()]*\)$/.exec(m[3]);
      return { status: m[1], path: described ? described[1] : m[3] };
    })
    .filter((entry) => entry.path.length > 0);

  // The command exits 0 even when it cannot descend. An uninitialized gitlink
  // is reported with a `-` status and its own nested gitlinks are never
  // enumerated, so the graph silently omits every project underneath them.
  // Warn rather than fail on purpose: a normal checkout leaves every submodule
  // uninitialized, so refusing to generate would make the command unusable
  // without a full recursive init.
  const uninitialized = entries
    .filter((entry) => entry.status === "-")
    .map((entry) => entry.path);
  if (uninitialized.length > 0) {
    console.warn(
      `[giga-nx-generate] WARNING: ${uninitialized.length} of ${entries.length} ` +
        `submodule(s) are not initialized, so nested gitlinks under them were ` +
        `not enumerated and the graph below is incomplete. Run ` +
        `\`git submodule update --init --recursive\` for full coverage. ` +
        `First few: ${uninitialized.slice(0, 3).join(", ")}` +
        (uninitialized.length > 3 ? ", ..." : "")
    );
  }

  const paths = entries.map((entry) => entry.path);
  return Array.from(new Set(paths));
}

function safeName(p: string): string {
  return p.replace(/[^A-Za-z0-9]+/g, "-").replace(/(^-|-$)/g, "").toLowerCase();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

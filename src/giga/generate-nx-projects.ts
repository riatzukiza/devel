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
  try {
    const output = execSync("git submodule status --recursive", { cwd: ROOT, encoding: "utf8" });
    const paths = output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^[+-]?/, "").split(/\s+/)[1])
      .filter((p): p is string => Boolean(p));
    return Array.from(new Set(paths));
  } catch {
    return [];
  }
}

function safeName(p: string): string {
  return p.replace(/[^A-Za-z0-9]+/g, "-").replace(/(^-|-$)/g, "").toLowerCase();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/*
  Generate Nx project stubs for each git submodule under orgs/** without
  modifying submodule contents. Projects are created under ./projects/<name>/project.json
  and proxy to the submodule's native test/build via run-submodule.ts.

  Usage:
    bun run src/giga/generate-nx-projects.ts
*/

import { mkdir, writeFile } from "fs/promises";

const ROOT = process.cwd();

async function main(): Promise<void> {
  const subs = await readSubmodules();
  if (subs.length === 0) {
    console.log("No submodules found. Nothing to generate.");
    return;
  }
  await mkdir(`${ROOT}/projects`, { recursive: true });

  // Root utility project for watcher
  await ensureProject(
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
    }
  );

  for (const p of subs) {
    const name = safeName(p);
    await ensureProject(
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
          }
        }
      }
    );
  }
  console.log(`Generated ${subs.length + 1} Nx project(s) under ./projects/`);
}

async function ensureProject(dir: string, config: any): Promise<void> {
  await mkdir(dir, { recursive: true });
  const json = JSON.stringify(config, null, 2) + "\n";
  await writeFile(`${dir}/project.json`, json, { encoding: "utf8" });
}

async function readSubmodules(): Promise<string[]> {
  try {
    const text = await Bun.file(`${ROOT}/.gitmodules`).text();
    const paths = [...text.matchAll(/\n\s*path\s*=\s*(.+)\n/g)].map((m) => m[1].trim());
    // Filter to orgs/** to avoid weird cases
    return paths.filter((p) => p.startsWith("orgs/"));
  } catch {
    return [];
  }
}

function safeName(p: string): string {
  return p.replace(/[^A-Za-z0-9]+/g, "-").replace(/(^-|-$)/g, "").toLowerCase();
}

if (import.meta.main) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

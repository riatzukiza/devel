/*
  Standalone script to create a minimal project graph for giga without relying on Nx's conflict detection.
  This reads .gitmodules and emits a node list and edge list that can be consumed by `nx affected` via a minimal plugin or a custom project graph provider.
*/

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { writeFile } from "fs/promises";

const ROOT = process.cwd();
const OUT = `${ROOT}/tmp/giga-graph.json`;

interface Node {
  name: string;
  type: "app" | "lib";
  data: {
    root: string;
    targets?: Record<string, { executor: string; options: { command: string } }>;
  };
}

interface Edge {
  source: string;
  target: string;
  type: "static" | "implicit";
}

function readSubmodules(): string[] {
  const gitmodulesPath = join(ROOT, ".gitmodules");
  if (!existsSync(gitmodulesPath)) return [];
  const text = readFileSync(gitmodulesPath, "utf8");
  return [...text.matchAll(/^\s*path\s*=\s*(.+)$/gm)].map(m => m[1]!.trim());
}

function pathToNxName(p: string): string {
  return p.replace(/[^A-Za-z0-9]+/g, "-").replace(/(^-|-$)/g, "").toLowerCase();
}

function main(): void {
  const subPaths = readSubmodules().filter(p => p.startsWith("orgs/"));
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // giga root node
  nodes.push({
    name: "giga",
    type: "app",
    data: {
      root: ".",
      targets: {
        watch: {
          executor: "nx:run-commands",
          options: { command: "bun run src/giga/giga-watch.ts" }
        }
      }
    }
  });

  for (const subPath of subPaths) {
    const name = pathToNxName(subPath);
    nodes.push({
      name,
      type: "app",
      data: {
        root: subPath,
        targets: {
          test: {
            executor: "nx:run-commands",
            options: { command: `bun run src/giga/run-submodule.ts "${subPath}" test` }
          },
          build: {
            executor: "nx:run-commands",
            options: { command: `bun run src/giga/run-submodule.ts "${subPath}" build` }
          },
          lint: {
            executor: "nx:run-commands",
            options: { command: `bun run src/giga/run-submodule.ts "${subPath}" lint` }
          },
          typecheck: {
            executor: "nx:run-commands",
            options: { command: `bun run src/giga/run-submodule.ts "${subPath}" typecheck` }
          }
        }
      }
    });
    // Implicit edge from root to every submodule
    edges.push({ source: "giga", target: name, type: "implicit" });
  }

  const graph = { nodes, edges };
  console.log(`Writing giga project graph to ${OUT}`);
  writeFile(OUT, JSON.stringify(graph, null, 2));
}

main();

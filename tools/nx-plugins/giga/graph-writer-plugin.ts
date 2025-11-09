import { Plugin, ProjectConfiguration } from "@nx/devkit";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { writeFile } from "fs/promises";

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

interface Graph {
  nodes: Node[];
  edges: Edge[];
}

export function createGraphWriterPlugin(): Plugin {
  return {
    name: "giga-graph-writer",
    createNodes: [
      {
        files: ["**/.gitmodules"],
        createNodes: async (_, ctx) => {
          const rootPath = ctx.workspaceRoot;
          const depsPath = join(rootPath, "tools/nx-plugins/giga/deps.json");
          const graph = readGraph(rootPath, depsPath);
          // Write graph to a known temp location so the plugin can read it
          const outPath = join(rootPath, "tmp/giga-graph.json");
          await writeFile(outPath, JSON.stringify(graph, null, 2));
          // Return empty config to avoid Nx project conflicts
          return {};
        },
      },
    ],
  };
}

function readGraph(rootPath: string, depsPath?: string): Graph {
  const gitmodulesPath = join(rootPath, ".gitmodules");
  if (!existsSync(gitmodulesPath)) return { nodes: [], edges: [] };
  const text = readFileSync(gitmodulesPath, "utf8");
  const subPaths = [...text.matchAll(/^\s*path\s*=\s*(.+)$/gm)].map(m => m[1]!.trim())
    .filter(p => p.startsWith("orgs/"));
  const nodes: Node[] = [];
  const edges: Edge[] = [];

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
          }
        }
      }
    });
    edges.push({ source: "giga", target: name, type: "implicit" });
  }

  // Optional custom deps map
  if (depsPath && existsSync(depsPath)) {
    try {
      const deps = JSON.parse(readFileSync(depsPath, "utf8")) as Record<string, string[]>;
      for (const [srcPathRaw, targets] of Object.entries(deps)) {
        const src = pathToNxName(srcPathRaw);
        for (const tgtPathRaw of targets) {
          const tgt = pathToNxName(tgtPathRaw);
          edges.push({ source: src, target: tgt, type: "implicit" });
        }
      }
    } catch {/* ignore */}
  }

  return { nodes, edges };
}

function pathToNxName(p: string): string {
  return p.replace(/[^A-Za-z0-9]+/g, "-").replace(/(^-|-$)/g, "").toLowerCase();
}
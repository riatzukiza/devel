import { Plugin, ProjectConfiguration } from "@nx/devkit";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

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

export function createGraphReaderPlugin(): Plugin {
  return {
    name: "giga-graph-reader",
    createNodes: [
      {
        files: ["tmp/giga-graph.json"],
        createNodes: async (_, ctx) => {
          const rootPath = ctx.workspaceRoot;
          const graphPath = join(rootPath, "tmp/giga-graph.json");
          if (!existsSync(graphPath)) {
            return {};
          }

          const graph: Graph = JSON.parse(readFileSync(graphPath, "utf8"));
          const config: Record<string, { projectConfiguration: ProjectConfiguration; dependencies?: readonly string[] }> = {};

          for (const node of graph.nodes) {
            config[node.name] = {
              projectConfiguration: {
                name: node.name,
                root: node.data.root,
                projectType: node.type === "lib" ? "library" : "application",
                sourceRoot: `${node.data.root}/src`,
                targets: node.data.targets,
              },
            };
          }

          for (const edge of graph.edges) {
            if (config[edge.target]) {
            const cur = config[edge.target].dependencies || [];
            config[edge.target].dependencies = cur.concat({
              project: edge.source,
              type: edge.type as "implicit" | "static",
            });
          }
          }

          return config;
        },
      },
    ],
  };
}
import { Plugin, ProjectConfiguration } from "@nx/devkit";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

interface GigaPluginOptions {
  /** Optional path to deps map for custom submodule dependencies */
  depsMapPath?: string;
}

const PLUGIN_NAME = "giga";

export function createPlugin(options: GigaPluginOptions = {}): Plugin {
  return {
    name: PLUGIN_NAME,
    createNodes: [
      {
        files: ["**/.gitmodules"],
        createNodes: async (input, ctx) => {
              const rootPath = ctx.workspaceRoot;
              const gitmodulesPath = join(rootPath, ".gitmodules");
              const config: Record<string, { projectConfiguration: ProjectConfiguration; dependencies?: readonly string[] }> = {};

          try {
            const gitmodulesContent = readFileSync(gitmodulesPath, "utf8");
            const submodulePaths = parseGitmodules(gitmodulesContent);

            for (const subPath of submodulePaths) {
              if (!subPath.startsWith("orgs/")) continue; // we only expose orgs/** submodules

              const projectName = pathToNxName(subPath);
              const targets = {
                test: {
                  executor: "nx:run-commands",
                  options: {
                    command: `bun run src/giga/run-submodule.ts "${subPath}" test`,
                  },
                },
                build: {
                  executor: "nx:run-commands",
                  options: {
                    command: `bun run src/giga/run-submodule.ts "${subPath}" build`,
                  },
                },
              };

              const projectConfig: ProjectConfiguration = {
                name: projectName,
                projectType: "application",
                root: subPath,
                sourceRoot: `${subPath}/src`,
                targets,
              };

              const deps = resolveCustomDeps(subPath, options.depsMapPath ? `${rootPath}/${options.depsMapPath}` : undefined);
              config[projectName] = { projectConfiguration: projectConfig, dependencies: deps };
            }
          } catch (e) {
            console.warn("[giga-plugin] Could not parse .gitmodules:", e instanceof Error ? e.message : e);
          }

          // Add the 'giga' synthetic root project (watcher)
          config["giga"] = {
            projectConfiguration: {
              name: "giga",
              projectType: "application",
              root: ".",
              sourceRoot: ".",
              targets: {
                watch: {
                  executor: "nx:run-commands",
                  options: {
                    command: "bun run src/giga/giga-watch.ts",
                  },
                },
              },
            },
            // Implicit dependency on all submodule projects
            dependencies: Object.keys(config)
              .filter((k) => k !== "giga")
              .map((k) => ({ project: k, type: "implicit" as const })),
          };

          return config;
        },
      },
    ],
  };
}

function parseGitmodules(content: string): string[] {
  const lines = content.split("\n");
  const paths: string[] = [];
  for (const line of lines) {
    const m = line.match(/^\s*path\s*=\s*(.+)$/);
    if (m && m[1]) {
      paths.push(m[1].trim());
    }
  }
  return paths;
}

function pathToNxName(path: string): string {
  // normalize to a safe Nx project name (orgs-foo-bar-baz)
  return path.replace(/[^A-Za-z0-9]+/g, "-").replace(/(^-|-$)/g, "").toLowerCase();
}

/**
 * Resolve custom dependencies from a simple JSON map:
 * {
 *   "orgs/riatzukiza/promethean": ["orgs/bhauman/clojure-mcp", "orgs/moofone/codex-ts-sdk"]
 * }
 */
function resolveCustomDeps(
  thisRepoPath: string,
  mapPath?: string
): readonly { project: string; type: "explicit" | "static" | "implicit" }[] {
  if (!mapPath || !existsSync(mapPath)) return [];

  try {
    const map = JSON.parse(readFileSync(mapPath, "utf8")) as Record<string, string[]>;
    const deps = map[thisRepoPath] || [];
    return deps.map((depPath) => ({
      project: pathToNxName(depPath),
      type: "explicit" as const,
    }));
  } catch {
    return [];
  }
}
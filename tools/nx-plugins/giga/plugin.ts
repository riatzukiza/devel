import type { CreateNodesV2, ProjectConfiguration } from "@nx/devkit";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

interface GigaPluginOptions {
  /** Optional path to deps map for custom submodule dependencies */
  depsMapPath?: string;
}

const PLUGIN_NAME = "giga";

export const name = PLUGIN_NAME;

export const createNodesV2: CreateNodesV2<GigaPluginOptions> = [
  "**/.gitmodules",
  async (configFiles, options, ctx) => {
    const rootPath = ctx.workspaceRoot;
    const gitmodulesPath = join(rootPath, ".gitmodules");
    const projects: Record<string, ProjectConfiguration> = {};
    const projectNames: string[] = [];
    const pluginOptions = (options ?? {}) as GigaPluginOptions;
    const depsMapPath = pluginOptions.depsMapPath ? `${rootPath}/${pluginOptions.depsMapPath}` : undefined;

    try {
      const gitmodulesContent = readFileSync(gitmodulesPath, "utf8");
      const submodulePaths = parseGitmodules(gitmodulesContent);

      for (const subPath of submodulePaths) {
        if (!subPath.startsWith("orgs/")) continue; // only expose orgs/** submodules

        const projectName = pathToNxName(subPath);
        projectNames.push(projectName);

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
          lint: {
            executor: "nx:run-commands",
            options: {
              command: `bun run src/giga/run-submodule.ts "${subPath}" lint`,
            },
          },
          typecheck: {
            executor: "nx:run-commands",
            options: {
              command: `bun run src/giga/run-submodule.ts "${subPath}" typecheck`,
            },
          },
        };

        const deps = resolveCustomDeps(subPath, depsMapPath);
        const projectConfig: ProjectConfiguration = {
          name: projectName,
          projectType: "application",
          root: subPath,
          sourceRoot: `${subPath}/src`,
          targets,
          implicitDependencies: deps.length ? deps : undefined,
        };

        projects[subPath] = projectConfig;
      }
    } catch (e) {
      console.warn("[giga-plugin] Could not parse .gitmodules:", e instanceof Error ? e.message : e);
    }

    projects["."] = {
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
      implicitDependencies: projectNames,
    };

    const result = { projects };
    return configFiles.map((file) => [file, result] as const);
  },
];

export const createNodes = createNodesV2;

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
function resolveCustomDeps(thisRepoPath: string, mapPath?: string): string[] {
  if (!mapPath || !existsSync(mapPath)) return [];

  try {
    const map = JSON.parse(readFileSync(mapPath, "utf8")) as Record<string, string[]>;
    const deps = map[thisRepoPath] || [];
    return deps.map((depPath) => pathToNxName(depPath));
  } catch {
    return [];
  }
}

var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __moduleCache = /* @__PURE__ */ new WeakMap;
var __toCommonJS = (from) => {
  var entry = __moduleCache.get(from), desc;
  if (entry)
    return entry;
  entry = __defProp({}, "__esModule", { value: true });
  if (from && typeof from === "object" || typeof from === "function")
    __getOwnPropNames(from).map((key) => !__hasOwnProp.call(entry, key) && __defProp(entry, key, {
      get: () => from[key],
      enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
    }));
  __moduleCache.set(from, entry);
  return entry;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};

// tools/nx-plugins/giga/plugin.ts
var exports_plugin = {};
__export(exports_plugin, {
  name: () => name,
  createNodesV2: () => createNodesV2,
  createNodes: () => createNodes
});
module.exports = __toCommonJS(exports_plugin);
var import_fs = require("fs");
var import_path = require("path");
var PLUGIN_NAME = "giga";
var name = PLUGIN_NAME;
var createNodesV2 = [
  "**/.gitmodules",
  async (configFiles, options, ctx) => {
    const rootPath = ctx.workspaceRoot;
    const gitmodulesPath = import_path.join(rootPath, ".gitmodules");
    const projects = {};
    const projectNames = [];
    const pluginOptions = options ?? {};
    const depsMapPath = pluginOptions.depsMapPath ? `${rootPath}/${pluginOptions.depsMapPath}` : undefined;
    try {
      const gitmodulesContent = import_fs.readFileSync(gitmodulesPath, "utf8");
      const submodulePaths = parseGitmodules(gitmodulesContent);
      for (const subPath of submodulePaths) {
        if (!subPath.startsWith("orgs/"))
          continue;
        const projectName = pathToNxName(subPath);
        projectNames.push(projectName);
        const targets = {
          test: {
            executor: "nx:run-commands",
            options: {
              command: `bun run src/giga/run-submodule.ts "${subPath}" test`
            }
          },
          build: {
            executor: "nx:run-commands",
            options: {
              command: `bun run src/giga/run-submodule.ts "${subPath}" build`
            }
          },
          lint: {
            executor: "nx:run-commands",
            options: {
              command: `bun run src/giga/run-submodule.ts "${subPath}" lint`
            }
          },
          typecheck: {
            executor: "nx:run-commands",
            options: {
              command: `bun run src/giga/run-submodule.ts "${subPath}" typecheck`
            }
          }
        };
        const deps = resolveCustomDeps(subPath, depsMapPath);
        const projectConfig = {
          name: projectName,
          projectType: "application",
          root: subPath,
          sourceRoot: `${subPath}/src`,
          targets,
          implicitDependencies: deps.length ? deps : undefined
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
            command: "bun run src/giga/giga-watch.ts"
          }
        },
        "test-tools": {
          executor: "nx:run-commands",
          options: {
            command: "bun test ./.opencode/tools/tests/fix_clojure_delimiters.test.js"
          }
        }
      },
      implicitDependencies: projectNames
    };
    const result = { projects };
    return configFiles.map((file) => [file, result]);
  }
];
var createNodes = createNodesV2;
function parseGitmodules(content) {
  const lines = content.split(`
`);
  const paths = [];
  for (const line of lines) {
    const m = line.match(/^\s*path\s*=\s*(.+)$/);
    if (m && m[1]) {
      paths.push(m[1].trim());
    }
  }
  return paths;
}
function pathToNxName(path) {
  return path.replace(/[^A-Za-z0-9]+/g, "-").replace(/(^-|-$)/g, "").toLowerCase();
}
function resolveCustomDeps(thisRepoPath, mapPath) {
  if (!mapPath || !import_fs.existsSync(mapPath))
    return [];
  try {
    const map = JSON.parse(import_fs.readFileSync(mapPath, "utf8"));
    const deps = map[thisRepoPath] || [];
    return deps.map((depPath) => pathToNxName(depPath));
  } catch {
    return [];
  }
}

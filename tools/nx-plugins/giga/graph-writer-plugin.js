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

// tools/nx-plugins/giga/graph-writer-plugin.ts
var exports_graph_writer_plugin = {};
__export(exports_graph_writer_plugin, {
  createGraphWriterPlugin: () => createGraphWriterPlugin
});
module.exports = __toCommonJS(exports_graph_writer_plugin);
var import_fs = require("fs");
var import_path = require("path");
var import_promises = require("fs/promises");
function createGraphWriterPlugin() {
  return {
    name: "giga-graph-writer",
    createNodes: [
      {
        files: ["**/.gitmodules"],
        createNodes: async (_, ctx) => {
          const rootPath = ctx.workspaceRoot;
          const depsPath = import_path.join(rootPath, "tools/nx-plugins/giga/deps.json");
          const graph = readGraph(rootPath, depsPath);
          const outPath = import_path.join(rootPath, "tmp/giga-graph.json");
          await import_promises.writeFile(outPath, JSON.stringify(graph, null, 2));
          return {};
        }
      }
    ]
  };
}
function readGraph(rootPath, depsPath) {
  const gitmodulesPath = import_path.join(rootPath, ".gitmodules");
  if (!import_fs.existsSync(gitmodulesPath))
    return { nodes: [], edges: [] };
  const text = import_fs.readFileSync(gitmodulesPath, "utf8");
  const subPaths = [...text.matchAll(/^\s*path\s*=\s*(.+)$/gm)].map((m) => m[1].trim()).filter((p) => p.startsWith("orgs/"));
  const nodes = [];
  const edges = [];
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
  if (depsPath && import_fs.existsSync(depsPath)) {
    try {
      const deps = JSON.parse(import_fs.readFileSync(depsPath, "utf8"));
      for (const [srcPathRaw, targets] of Object.entries(deps)) {
        const src = pathToNxName(srcPathRaw);
        for (const tgtPathRaw of targets) {
          const tgt = pathToNxName(tgtPathRaw);
          edges.push({ source: src, target: tgt, type: "implicit" });
        }
      }
    } catch {}
  }
  return { nodes, edges };
}
function pathToNxName(p) {
  return p.replace(/[^A-Za-z0-9]+/g, "-").replace(/(^-|-$)/g, "").toLowerCase();
}

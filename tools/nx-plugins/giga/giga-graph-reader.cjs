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

// tools/nx-plugins/giga/graph-reader-plugin.ts
var exports_graph_reader_plugin = {};
__export(exports_graph_reader_plugin, {
  createGraphReaderPlugin: () => createGraphReaderPlugin
});
module.exports = __toCommonJS(exports_graph_reader_plugin);
var import_fs = require("fs");
var import_path = require("path");
function createGraphReaderPlugin() {
  return {
    name: "giga-graph-reader",
    createNodes: [
      {
        files: ["tmp/giga-graph.json"],
        createNodes: async (_, ctx) => {
          const rootPath = ctx.workspaceRoot;
          const graphPath = import_path.join(rootPath, "tmp/giga-graph.json");
          if (!import_fs.existsSync(graphPath)) {
            return {};
          }
          const graph = JSON.parse(import_fs.readFileSync(graphPath, "utf8"));
          const config = {};
          for (const node of graph.nodes) {
            config[node.name] = {
              projectConfiguration: {
                name: node.name,
                root: node.data.root,
                projectType: node.type === "lib" ? "library" : "application",
                sourceRoot: `${node.data.root}/src`,
                targets: node.data.targets
              }
            };
          }
          for (const edge of graph.edges) {
            if (config[edge.target]) {
              const cur = config[edge.target].dependencies || [];
              config[edge.target].dependencies = cur.concat({
                project: edge.source,
                type: edge.type
              });
            }
          }
          return config;
        }
      }
    ]
  };
}

import { build } from "bun";
import path from "path";

const entries = [
  { name: "giga-graph-writer", entry: "tools/nx-plugins/giga/graph-writer-plugin.ts" },
  { name: "giga-graph-reader", entry: "tools/nx-plugins/giga/graph-reader-plugin.ts" },
];

const pluginRoot = path.resolve(import.meta.dirname, "..", "..", "..");

for (const { name, entry } of entries) {
  const entryPath = path.resolve(pluginRoot, entry);
  const outPath = path.resolve(pluginRoot, "tools/nx-plugins/giga", `${name}.js`);

  await build({
    entrypoints: [entryPath],
    target: "node",
    outdir: path.dirname(outPath),
    format: "cjs",
    minify: false,
    sourcemap: false,
    external: ["@nx/devkit", "fs/promises"],
  });

  console.log(`Bundled ${name} plugin to ${outPath}`);
}
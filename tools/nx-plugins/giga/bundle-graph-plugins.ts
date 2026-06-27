import { build } from "bun";
import path from "path";
import { rename } from "fs/promises";

const entries = [
  { name: "giga-graph-writer", entry: "tools/nx-plugins/giga/graph-writer-plugin.ts" },
  { name: "giga-graph-reader", entry: "tools/nx-plugins/giga/graph-reader-plugin.ts" },
];

const pluginRoot = path.resolve(import.meta.dirname, "..", "..", "..");

for (const { name, entry } of entries) {
  const entryPath = path.resolve(pluginRoot, entry);
  const outDir = path.resolve(pluginRoot, "tools/nx-plugins/giga");
  const outPath = path.resolve(outDir, `${name}.cjs`);

  await build({
    entrypoints: [entryPath],
    target: "node",
    outdir: outDir,
    format: "cjs",
    minify: false,
    sourcemap: false,
    external: ["@nx/devkit", "fs/promises"],
  });

  const builtPath = path.resolve(outDir, `${path.basename(entry, ".ts")}.js`);
  await rename(builtPath, outPath);

  console.log(`Bundled ${name} plugin to ${outPath}`);
}

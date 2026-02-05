import { build } from "bun";
import path from "path";
import { rename } from "fs/promises";

const pluginEntry = path.resolve(import.meta.dirname, "plugin.ts");
const outPath = path.resolve(import.meta.dirname, "plugin.cjs");
const outDir = path.dirname(outPath);

await build({
  entrypoints: [pluginEntry],
  target: "node",
  outdir: outDir,
  format: "cjs",
  minify: false,
  sourcemap: false,
  external: ["@nx/devkit"],
});

await rename(path.join(outDir, "plugin.js"), outPath);

console.log(`Bundled Giga Nx plugin to ${outPath}`);

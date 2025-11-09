import { build } from "bun";
import path from "path";

const pluginEntry = path.resolve(import.meta.dirname, "plugin.ts");
const outPath = path.resolve(import.meta.dirname, "plugin.js");

await build({
  entrypoints: [pluginEntry],
  target: "node",
  outdir: path.dirname(outPath),
  format: "cjs",
  minify: false,
  sourcemap: false,
  external: ["@nx/devkit"],
});

console.log(`Bundled Giga Nx plugin to ${outPath}`);

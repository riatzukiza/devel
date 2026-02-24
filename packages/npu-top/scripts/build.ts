#!/usr/bin/env bun

import { chmod, mkdir, rm } from "node:fs/promises";

import solidPlugin from "@opentui/solid/bun-plugin";

const outdir = "./dist";
const outfile = `${outdir}/index.js`;

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

const result = await Bun.build({
  entrypoints: ["./src/index.tsx", "./src/npu.ts"],
  outdir,
  target: "bun",
  format: "esm",
  sourcemap: "external",
  packages: "external",
  plugins: [solidPlugin],
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

const built = await Bun.file(outfile).text();
if (!built.startsWith("#!/usr/bin/env bun")) {
  await Bun.write(outfile, `#!/usr/bin/env bun\n${built}`);
}

await chmod(outfile, 0o755);
console.log(`Built ${outfile}`);

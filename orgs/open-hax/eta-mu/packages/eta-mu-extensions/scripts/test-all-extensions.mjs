#!/usr/bin/env node
/**
 * Test all 14 eta-mu extensions load correctly as OpenCode plugins.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EXTENSIONS = [
  "apply-patch",
  "bootstrap",
  "chronos",
  "contract-runtime",
  "contract-runtime-v2",
  "custom-providers",
  "graph-memory",
  "image-render",
  "opencode-global-instructions",
  "opmf-contract-gate",
  "receipt-river",
  "session-mycology",
  "task-timing",
  "websearch-open-hax",
];

const mockInput = {
  client: {},
  project: {},
  directory: "/home/err/devel",
  worktree: "/home/err/devel",
  experimental_workspace: { register() {} },
  serverUrl: new URL("http://localhost:0"),
  $: {},
};

async function testExtension(name) {
  const pluginPath = path.join(__dirname, "../dist/opencode", `${name}.mjs`);
  process.stdout.write(`  ${name.padEnd(30)} `);

  try {
    const module = await import(pluginPath);
    const plugin = module.default;

    if (typeof plugin !== "function") {
      console.log(`FAIL: not a function`);
      return false;
    }

    const hooks = await plugin(mockInput, {});

    const parts = [];
    if (hooks.tool) parts.push(`${Object.keys(hooks.tool).length} tools`);
    for (const key of Object.keys(hooks).sort()) {
      if (key !== "tool") parts.push(key);
    }

    console.log(`OK  ${parts.join(", ") || "(no hooks)"}`);
    return true;
  } catch (err) {
    console.log(`FAIL: ${err.message.slice(0, 60)}`);
    return false;
  }
}

async function main() {
  console.log("eta-mu All Extensions Test");
  console.log("==========================\n");

  let passed = 0;
  let failed = 0;

  for (const ext of EXTENSIONS) {
    const ok = await testExtension(ext);
    if (ok) passed++; else failed++;
  }

  console.log(`\n==========================`);
  console.log(`Results: ${passed}/${EXTENSIONS.length} passed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();

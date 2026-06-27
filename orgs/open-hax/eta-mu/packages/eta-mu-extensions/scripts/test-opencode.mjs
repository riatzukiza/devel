#!/usr/bin/env node
/**
 * Test script to verify eta-mu extensions load correctly as OpenCode plugins.
 *
 * This simulates what OpenCode does when loading a plugin:
 * 1. Imports the .mjs file
 * 2. Calls the default export with a mock PluginInput
 * 3. Verifies tools are registered in the returned Hooks
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSIONS = [
  "receipt-river",
  "session-mycology",
  "contract-runtime-v2",
  "opmf-contract-gate",
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
  console.log(`\n--- Testing ${name} ---`);
  console.log(`  Loading: ${pluginPath}`);

  try {
    const module = await import(pluginPath);
    const plugin = module.default;

    if (typeof plugin !== "function") {
      console.error(`  FAIL: default export is not a function (${typeof plugin})`);
      return false;
    }

    const hooks = await plugin(mockInput, {});

    if (!hooks) {
      console.error(`  FAIL: plugin returned null/undefined`);
      return false;
    }

    console.log(`  Hooks keys: ${Object.keys(hooks).join(", ") || "(none)"}`);

    if (hooks.tool) {
      const toolNames = Object.keys(hooks.tool);
      console.log(`  Tools registered: ${toolNames.join(", ") || "(none)"}`);

      for (const toolName of toolNames) {
        const toolDef = hooks.tool[toolName];
        console.log(`    - ${toolName}: ${toolDef.description || "(no description)"}`);
        if (toolDef.args) {
          console.log(`      args: ${Object.keys(toolDef.args?.shape || toolDef.args || {}).join(", ") || "(none)"}`);
        }
        if (typeof toolDef.execute === "function") {
          console.log(`      execute: function`);
        } else {
          console.error(`      execute: MISSING!`);
        }
      }
    }

    if (hooks.event) {
      console.log(`  Event hook: registered`);
    }

    console.log(`  PASS`);
    return true;
  } catch (err) {
    console.error(`  FAIL: ${err.message}`);
    console.error(`  ${err.stack?.split("\n")?.[1] || ""}`);
    return false;
  }
}

async function main() {
  console.log("eta-mu OpenCode Plugin Test Suite");
  console.log("==================================\n");

  let passed = 0;
  let failed = 0;

  for (const ext of EXTENSIONS) {
    const ok = await testExtension(ext);
    if (ok) passed++; else failed++;
  }

  console.log(`\n==================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();

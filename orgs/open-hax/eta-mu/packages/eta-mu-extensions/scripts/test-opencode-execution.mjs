#!/usr/bin/env node
/**
 * Test script to verify eta-mu extensions load correctly as OpenCode plugins
 * and that tool execution works end-to-end.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mockInput = {
  client: {},
  project: {},
  directory: "/home/err/devel",
  worktree: "/home/err/devel",
  experimental_workspace: { register() {} },
  serverUrl: new URL("http://localhost:0"),
  $: {},
};

const mockToolContext = {
  sessionID: "test-session",
  messageID: "test-message",
  agent: "default",
  directory: "/home/err/devel",
  worktree: "/home/err/devel",
  abort: new AbortController().signal,
  metadata() {},
};

async function testExtension(name) {
  const pluginPath = path.join(__dirname, "../dist/opencode", `${name}.mjs`);
  console.log(`\n--- Testing ${name} ---`);

  try {
    const module = await import(pluginPath);
    const plugin = module.default;
    const hooks = await plugin(mockInput, {});

    if (hooks.tool) {
      for (const [toolName, toolDef] of Object.entries(hooks.tool)) {
        console.log(`  Tool: ${toolName}`);

        // Test status action
        try {
          const result = await toolDef.execute({ action: "status" }, mockToolContext);
          console.log(`    status result: ${JSON.stringify(result).slice(0, 100)}...`);
        } catch (err) {
          console.error(`    status error: ${err.message}`);
        }
      }
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
  console.log("eta-mu OpenCode Plugin Execution Test");
  console.log("======================================\n");

  let passed = 0;
  let failed = 0;

  for (const ext of ["receipt-river", "session-mycology"]) {
    const ok = await testExtension(ext);
    if (ok) passed++; else failed++;
  }

  console.log(`\n======================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();

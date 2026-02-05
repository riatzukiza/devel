/**
 * Test runner script that compiles TypeScript and runs tests from dist
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const reconstituterDir = "/home/err/devel/packages/reconstituter";

// Check if dist exists
if (!existsSync(`${reconstituterDir}/dist`)) {
  console.log("Building reconstituter...");
  execSync("pnpm run build", {
    cwd: reconstituterDir,
    stdio: "inherit",
  });
}

// Run tests from dist
console.log("Running tests from dist...");

const distTestFiles = readdirSync(`${reconstituterDir}/dist`)
  .filter((f) => f.endsWith(".test.js"))
  .map((f) => join("dist", f));

if (distTestFiles.length === 0) {
  console.error("No test files found in dist");
  process.exit(1);
}

execSync(`npx ava ${distTestFiles.join(" ")}`, {
  cwd: reconstituterDir,
  stdio: "inherit",
});

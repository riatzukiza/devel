#!/usr/bin/env node
/**
 * Axxium JS Boundary Scanner
 * Checks that CLJS code doesn't leak raw JS interop outside extern adapters.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const SOURCE_DIR = "src/cljs";

const FORBIDDEN_PATTERNS = [
  /\baget\b/,
  /\baset\b/,
  /\bjs->clj\b/,
  /\bclj->js\b/,
];

const EXCLUDED_FILES = [
  "extern",
];

function walkDir(dir, callback) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walkDir(path, callback);
    } else if (extname(path) === ".cljs") {
      callback(path);
    }
  }
}

function scanFile(path) {
  const content = readFileSync(path, "utf-8");
  const issues = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(line) && !line.includes(";")) {
        issues.push({ line: i + 1, pattern: pattern.source, text: line.trim() });
      }
    }
  }

  return issues;
}

function main() {
  const args = process.argv.slice(2);
  const checkMode = args.includes("--check");

  let totalIssues = 0;

  walkDir(SOURCE_DIR, (path) => {
    if (EXCLUDED_FILES.some(ex => path.includes(ex))) return;

    const issues = scanFile(path);
    if (issues.length > 0) {
      console.log(`\n${path}:`);
      for (const issue of issues) {
        console.log(`  Line ${issue.line}: ${issue.pattern}`);
        console.log(`    ${issue.text}`);
      }
      totalIssues += issues.length;
    }
  });

  if (totalIssues > 0) {
    console.log(`\n${totalIssues} boundary violation(s) found`);
    if (checkMode) {
      process.exit(1);
    }
  } else {
    console.log("No boundary violations found");
  }
}

main();

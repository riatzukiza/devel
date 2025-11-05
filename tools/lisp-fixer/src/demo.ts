#!/usr/bin/env tsx
// Demo script for Lisp Fixer LLM system
import { autoCloseParens } from "./sexp.js";
import { dropRandomCloseParen } from "./mutators/paren.js";
import fg from "fast-glob";
import * as path from "node:path";

async function demo() {
  console.log("🔍 Lisp Fixer LLM Demo");
  console.log("====================");
  
  // Test 1: S-expression validation
  console.log("\n1. Testing S-expression grammar validation:");
  const brokenCode = "(defn hello [world (println \"Hello\" world))";
  console.log("Broken:", brokenCode);
  const fixed = autoCloseParens(brokenCode);
  console.log("Fixed:", fixed);
  
  // Test 2: Mutation
  console.log("\n2. Testing mutation system:");
  const goodCode = "(defn add [a b] (+ a b))";
  console.log("Original:", goodCode);
  const mutated = dropRandomCloseParen(goodCode);
  console.log("Mutated:", mutated);
  
  // Test 3: Simple repo scanning
  console.log("\n3. Testing simple repo scanner:");
  try {
    const files = await fg(["**/*.{clj,cljs,cljc,lisp,lsp,el,scm,rkt}"], { cwd: ".", dot: true });
    const repos = new Map<string, string[]>();
    
    for (const file of files) {
      const ext = path.extname(file);
      let dialect = "lisp";
      if (ext === ".el") dialect = "el";
      else if ([".clj", ".cljs", ".cljc"].includes(ext)) dialect = "clj";
      else if ([".scm", ".rkt"].includes(ext)) dialect = "scm";
      
      const repo = file.split("/")[0];
      if (!repos.has(repo)) repos.set(repo, []);
      repos.get(repo)!.push(dialect);
    }
    
    console.log(`Found ${repos.size} Lisp repositories in current workspace`);
    Array.from(repos.entries()).slice(0, 3).forEach(([repo, dialects]) => {
      const unique = [...new Set(dialects)];
      console.log(`  - ${repo} (${unique.join(", ")})`);
    });
  } catch (error) {
    console.log("Repo scan failed:", error instanceof Error ? error.message : String(error));
  }
  
  console.log("\n✅ Demo complete! System is ready for training.");
  console.log("\nAvailable commands from root:");
  console.log("  pnpm lisp-fixer:scan     # Scan for Lisp repos");
  console.log("  pnpm lisp-fixer:mutate   # Generate training data");
  console.log("  pnpm lisp-fixer:dataset  # Inspect datasets");
  console.log("  pnpm lisp-fixer:infer    # Run inference");
  console.log("  pnpm lisp-fixer:demo     # Run this demo");
}

demo().catch(console.error);
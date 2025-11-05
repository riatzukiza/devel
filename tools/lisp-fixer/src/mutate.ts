// GPL-3.0-only
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import * as path from "node:path";
import mri from "minimist";
import fg from "fast-glob";
import { autoCloseParens } from "./sexp.js";
import { dropRandomCloseParen, duplicateRandomCloseParen, flipQuote, strayReader } from "./mutators/paren.js";
import { clj_drop_ns_require, cl_incorrect_package, elisp_wrong_provide } from "./mutators/ns_pkg.js";
import { macro_to_fn, quote_level_off } from "./mutators/macro.js";

type BuildRec = { root: string; dialects: string[] };
type Pair = {
  repo: string; dialect: string; path: string; prompt_type: "diff" | "fim";
  broken?: string; fixed?: string; prefix?: string; suffix?: string; middle?: string;
  labels: { build: "success" | "fail"; test?: "success" | "fail" | "n/a" };
};

const MUTS = [
  dropRandomCloseParen,
  duplicateRandomCloseParen,
  flipQuote,
  strayReader,
  clj_drop_ns_require,
  cl_incorrect_package,
  elisp_wrong_provide,
  macro_to_fn,
  quote_level_off
];

function build(cwd: string, prompt: string): { ok: boolean } {
  const code = spawnSync("opencode", ["run", prompt], { cwd, stdio: "ignore" }).status ?? 1;
  return { ok: code === 0 };
}

async function main() {
  const args = mri(process.argv.slice(2), { string: ["in","out","val","dialects"], default: { out: "data/train.jsonl", val: "data/val.jsonl", dialects: "clj,lisp,el,scm" } });
  
  // Validate inputs
  if (!args.in || typeof args.in !== "string") {
    console.error("Error: --in is required and must be a string");
    process.exit(1);
  }
  if (!args.out || typeof args.out !== "string") {
    console.error("Error: --out is required and must be a string");
    process.exit(1);
  }
  if (!args.val || typeof args.val !== "string") {
    console.error("Error: --val is required and must be a string");
    process.exit(1);
  }
  if (!args.dialects || typeof args.dialects !== "string") {
    console.error("Error: --dialects is required and must be a string");
    process.exit(1);
  }
  
  // Security: Define allowed base directory
  const allowedBase = path.resolve(args.in);
  const allowedPrompts = ["build", "test", "lint", "compile"];
  
  const allow = new Set<string>(args.dialects.split(","));
  const train: string[] = [];
  const val: string[] = [];
  const tempFiles: string[] = [];

  // Use streaming for large datasets
  const { createReadStream } = require("node:fs");
  const { createInterface } = require("node:readline");
  
  try {
    const fileStream = createReadStream(args.in);
    const rl = createInterface({ input: fileStream, crlfDelay: Infinity });
    
    for await (const line of rl) {
      if (!line.trim()) continue;
      
      try {
        const rec = JSON.parse(line) as BuildRec & { repo?: string; prompt?: string };
        
        // Validate record structure
        if (!rec.root || !rec.dialects || !Array.isArray(rec.dialects)) {
          console.warn("Skipping invalid record:", line);
          continue;
        }
        
        if (!rec.dialects.some(d => allow.has(d))) continue;
        
        const files = await fg(["**/*.{clj,cljs,cljc,lisp,lsp,el,scm,rkt}"], { cwd: rec.root, dot: true });

        for (const rel of files) {
          const abs = path.join(rec.root, rel);
          
          // Validate file path against allowed base
          if (!path.resolve(abs).startsWith(allowedBase)) {
            console.warn("Skipping file outside allowed directory:", abs);
            continue;
          }
          
          const code = readFileSync(abs, "utf8");
          
          // Apply mutation with retry logic
          let broken: string;
          let attempts = 0;
          const maxAttempts = 3;
          
          while (attempts < maxAttempts) {
            try {
              const mutator = MUTS[Math.floor(Math.random() * MUTS.length)]!;
              broken = mutator(code);
              break;
            } catch (error) {
              attempts++;
              if (attempts === maxAttempts) {
                console.warn("All mutation attempts failed for", rel, ":", error);
                continue;
              }
            }
          }
          
          const fixedBroken = autoCloseParens(broken);
          
          // Write broken snapshot to secure temp
          const { mkdtempSync } = require("node:fs");
          const { join } = require("node:path");
          const { tmpdir } = require("node:os");
          
          const tempDir = mkdtempSync(join(tmpdir(), 'lisp-fixer-'));
          const tmp = join(tempDir, path.basename(rel) + ".broken");
          tempFiles.push(tmp);
          writeFileSync(tmp, fixedBroken, "utf8");

          // Validate prompt
          const prompt = rec.prompt || "build";
          if (!allowedPrompts.includes(prompt)) {
            console.warn("Skipping invalid prompt:", prompt);
            continue;
          }
          
          // Test build
          const res = build(rec.root, prompt);
          const p: Pair = {
            repo: path.basename(rec.root),
            dialect: extToDialect(path.extname(rel)),
            path: rel,
            prompt_type: Math.random() < 0.5 ? "diff" : "fim",
            labels: { build: res.ok ? "success" : "fail", test: "n/a" }
          };

          if (p.prompt_type === "diff") {
            p.broken = fixedBroken;
            p.fixed = code;
          } else {
            // simple FIM slice
            const pivot = Math.max(0, Math.min(fixedBroken.length - 1, Math.floor(fixedBroken.length / 2)));
            p.prefix = fixedBroken.slice(0, pivot);
            p.middle = code.slice(pivot, Math.min(code.length, pivot + 200));
            p.suffix = fixedBroken.slice(pivot);
          }

          (Math.random() < 0.95 ? train : val).push(JSON.stringify(p));
        }
      } catch (error) {
        console.warn("Failed to process line:", line, "Error:", error);
      }
    }

    writeFileSync(args.out, train.join("\n") + "\n");
    writeFileSync(args.val, val.join("\n") + "\n");
    
  } finally {
    // Cleanup temp files
    for (const tmp of tempFiles) {
      try {
        require("node:fs").unlinkSync(tmp);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

function extToDialect(ext: string): string {
  if (ext === ".el") return "el";
  if (ext === ".clj" || ext === ".cljs" || ext === ".cljc") return "clj";
  if (ext === ".scm" || ext === ".rkt") return "scm";
  return "lisp";
}

main().catch(e => { console.error(e); process.exit(1); });
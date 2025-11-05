// GPL-3.0-only
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import mri from "minimist";
import { autoCloseParens, balanceParens } from "./sexp.js";

type GenArgs = { prompt: string; mode: "diff"|"whole"; };

function generate(_: GenArgs): string {
  // stub: replace with your RPC to inference server
  // for now, echo input to simulate identity "fix"
  return _.prompt;
}

function build(cwd: string, prompt: string): boolean {
  const code = spawnSync("opencode", ["run", prompt], { cwd, stdio: "ignore" }).status ?? 1;
  return code === 0;
}

function applyWhole(abs: string, text: string) { writeFileSync(abs, text, "utf8"); }

function main() {
  const args = mri(process.argv.slice(2), { string: ["file","repo","prompt","mode"], default: { prompt: "build", mode: "whole" } });
  
  // Validate inputs
  if (!args.file || typeof args.file !== "string") {
    console.error("Error: --file is required and must be a string");
    process.exit(1);
  }
  if (!args.mode || !["diff", "whole"].includes(args.mode)) {
    console.error("Error: --mode must be 'diff' or 'whole'");
    process.exit(1);
  }
  if (!args.prompt || typeof args.prompt !== "string") {
    console.error("Error: --prompt is required and must be a string");
    process.exit(1);
  }
  
  // Validate file path
  const filePath = require("node:path").resolve(args.file);
  if (!filePath.startsWith(process.cwd())) {
    console.error("Error: File must be within working directory");
    process.exit(1);
  }
  
  let broken: string;
  try {
    broken = readFileSync(args.file, "utf8");
  } catch (error) {
    console.error("Error reading file:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

 let best = broken;
  const maxAttempts = 3;
 
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const guarded = autoCloseParens(generate({ prompt: broken, mode: args.mode as "diff" | "whole" }));
      const bal = balanceParens(guarded);
      
      if (!bal.ok) {
        console.warn(`Attempt ${attempt + 1}: Invalid S-expression - ${bal.error}`);
        continue;
      }

      applyWhole(args.file, guarded);
      
      const repoPath = args.repo ? require("node:path").resolve(args.repo) : process.cwd();
      if (build(repoPath, args.prompt)) {
        console.log("green ✅");
        return;
      } else {
        best = guarded;
        console.warn(`Attempt ${attempt + 1}: Build failed`);
      }
    } catch (error) {
      console.warn(`Attempt ${attempt + 1}: Error -`, error instanceof Error ? error.message : String(error));
    }
  }
  
  // Restore best attempt
  try {
    writeFileSync(args.file, best, "utf8");
  } catch (error) {
    console.error("Error restoring best attempt:", error instanceof Error ? error.message : String(error));
  }
  
  console.log("still red ❌ (left best attempt)");
}

main();
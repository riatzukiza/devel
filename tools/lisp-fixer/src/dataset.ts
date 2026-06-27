// GPL-3.0-only
import { readFileSync } from "node:fs";
import mri from "minimist";

interface DatasetArgs {
  peek?: string;
  n?: number;
}

function main() {
  const args = mri(process.argv.slice(2), { string: ["peek"], default: { n: 3 } }) as DatasetArgs;
  
  // Validate inputs
  if (!args.peek || typeof args.peek !== "string") {
    console.error("Error: --peek is required and must be a string");
    process.exit(1);
  }
  
  const count = Number(args.n);
  if (isNaN(count) || count < 1) {
    console.error("Error: --n must be a positive number");
    process.exit(1);
  }
  
  try {
    const content = readFileSync(args.peek, "utf8");
    const lines = content.trim().split("\n").slice(0, count);
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const parsed = JSON.parse(line);
        console.log(JSON.stringify(parsed, null, 2));
      } catch {
        console.error("Invalid JSON line:", line);
      }
    }
  } catch (err) {
    console.error("Error reading file:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
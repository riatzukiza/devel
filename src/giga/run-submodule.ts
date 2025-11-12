/*
  Run a submodule's target (test/build/typecheck/lint) in a robust way:
  - If package.json has a matching script, run it via pnpm -C "<subPath>" <target>
  - Else if nx.json exists, run nx run-many --target=<target> --all inside the submodule
  - Else, no-op success (prints "no <target> script found")
 
   Usage:
     bun run src/giga/run-submodule.ts <subPath> <target>
 */
 
 import { spawn } from "bun";
 
 const ALLOWED_TARGETS = new Set(["test", "build", "typecheck", "lint"]);
 
 async function main(): Promise<void> {
   const [subPath, target] = process.argv.slice(2);
   if (!subPath || !target || !ALLOWED_TARGETS.has(target)) {
     console.error("Usage: bun run src/giga/run-submodule.ts <subPath> <target>");
     process.exit(2);
   }


  const hasPj = await exists(`${subPath}/package.json`);
  if (hasPj) {
    try {
      const pj = await Bun.file(`${subPath}/package.json`).json();
      if (pj?.scripts?.[target]) {
        const ok = await run(["bash", "-lc", `pnpm -C "${subPath}" ${target}`], process.cwd());
        process.exit(ok ? 0 : 1);
      }
    } catch {/* ignore and continue */}
  }

  const hasNx = await exists(`${subPath}/nx.json`);
  if (hasNx) {
    // Run all for that target in the submodule when no package script exists
    const ok = await run(["bash", "-lc", `pnpm -C "${subPath}" nx run-many --target=${target} --all`], process.cwd());
    process.exit(ok ? 0 : 1);
  }

  console.log(`No ${target} script or nx.json in ${subPath}; skipping.`);
  process.exit(0);
}

async function exists(p: string): Promise<boolean> {
  try {
    await Bun.file(p).text();
    return true;
  } catch {
    return false;
  }
}

async function run(cmd: string[], cwd: string): Promise<boolean> {
  console.log(`> ${cmd.join(" ")}`);
  const proc = spawn({ cmd, cwd, stdout: "pipe", stderr: "pipe" });
  const [out, err] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  if (out.trim()) console.log(out.trim());
  if (proc.exitCode === 0) return true;
  console.warn(err.trim());
  return false;
}

if (import.meta.main) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

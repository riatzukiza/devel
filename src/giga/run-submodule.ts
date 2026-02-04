/**
 * Run a submodule's target (test/build/typecheck/lint) in a robust way:
 * - Detect the owning toolchain (bun, pnpm, yarn, npm) and run the matching script when it exists
 * - Special-case typecheck to fall back to Nx, TypeScript, or Cargo when no script exists
 * - Fall back to Nx run-many when a monorepo exposes nx.json but no script
 *
 * Usage:
 *   bun run src/giga/run-submodule.ts <subPath> <target>
 */

import { spawn } from "bun";
import { join, resolve } from "path";
import { stat } from "fs/promises";

const ALLOWED_TARGETS = new Set(["test", "build", "typecheck", "lint"]);

const NX_CONFIG = "nx.json";
const TS_CONFIG_CANDIDATES = [
  "tsconfig.typecheck.json",
  "tsconfig.build.json",
  "tsconfig.json",
];

const LOCKFILE_HINTS: ReadonlyArray<readonly [NodePackageManager, readonly string[]]> = [
  ["bun", ["bun.lockb", "bun.lock"]],
  ["pnpm", ["pnpm-lock.yaml"]],
  ["yarn", ["yarn.lock"]],
  ["npm", ["package-lock.json", "npm-shrinkwrap.json"]],
];

type NodePackageManager = "pnpm" | "npm" | "yarn" | "bun";
type PackageJson = {
  readonly packageManager?: string;
  readonly scripts?: Record<string, string>;
};

async function main(): Promise<void> {
  const [subPath, target] = process.argv.slice(2);
  if (!subPath || !target || !ALLOWED_TARGETS.has(target)) {
    console.error("Usage: bun run src/giga/run-submodule.ts <subPath> <target>");
    process.exit(2);
  }

  const absSubPath = resolve(process.cwd(), subPath);
  if (!(await pathExists(absSubPath))) {
    console.error(`Submodule path ${subPath} does not exist`);
    process.exit(1);
  }

  const ok = target === "typecheck"
    ? await runTypecheck(subPath, absSubPath)
    : await runGenericTarget(subPath, absSubPath, target);

  process.exit(ok ? 0 : 1);
}

async function runGenericTarget(label: string, dir: string, target: string): Promise<boolean> {
  const pkg = await readPackageJson(dir);
  const manager = pkg ? await detectPackageManager(dir, pkg) : null;

  if (pkg?.scripts?.[target]) {
    return runPackageScript(manager!, dir, target);
  }

  if (await hasNxConfig(dir)) {
    console.log(`[${target}] ${label}: running Nx run-many fallback`);
    return runNxTarget(label, dir, target, manager);
  }

  console.log(`No ${target} script or nx.json in ${label}; skipping.`);
  return true;
}

async function runTypecheck(label: string, dir: string): Promise<boolean> {
  const pkg = await readPackageJson(dir);
  const manager = pkg ? await detectPackageManager(dir, pkg) : null;

  if (pkg?.scripts?.typecheck) {
    return runPackageScript(manager!, dir, "typecheck");
  }

  if (await hasNxConfig(dir)) {
    console.log(`[typecheck] ${label}: running Nx run-many fallback`);
    return runNxTarget(label, dir, "typecheck", manager);
  }

  if (pkg) {
    const tsconfig = await findTsconfig(dir);
    if (tsconfig) {
      console.log(`[typecheck] ${label}: no script found, running TypeScript on ${tsconfig}`);
      return runTypeScriptCheck(label, dir, tsconfig, manager);
    }
  }

  if (await pathExists(join(dir, "Cargo.toml"))) {
    console.log(`[typecheck] ${label}: detected Cargo project, running cargo check`);
    return run(["cargo", "check"], dir, { label: `[typecheck] ${label}` });
  }

  console.warn(`[typecheck] Skipping ${label}: no supported typecheck strategy detected`);
  return true;
}

async function readPackageJson(dir: string): Promise<PackageJson | null> {
  const file = join(dir, "package.json");
  if (!(await pathExists(file))) {
    return null;
  }

  try {
    return (await Bun.file(file).json()) as PackageJson;
  } catch {
    return null;
  }
}

async function detectPackageManager(dir: string, pkg?: PackageJson | null): Promise<NodePackageManager> {
  const field = parsePackageManagerField(pkg?.packageManager);
  if (field) return field;

  for (const [manager, files] of LOCKFILE_HINTS) {
    for (const rel of files) {
      if (await pathExists(join(dir, rel))) {
        return manager;
      }
    }
  }

  return "pnpm";
}

function parsePackageManagerField(value?: string): NodePackageManager | null {
  if (!value) return null;
  const name = value.split("@")[0]?.trim().toLowerCase();
  if (name === "bun" || name === "pnpm" || name === "yarn" || name === "npm") {
    return name;
  }
  return null;
}

async function hasNxConfig(dir: string): Promise<boolean> {
  return pathExists(join(dir, NX_CONFIG));
}

async function runPackageScript(manager: NodePackageManager, dir: string, script: string): Promise<boolean> {
  const cmd = (() => {
    switch (manager) {
      case "npm":
        return ["npm", "run", script];
      case "yarn":
        return ["yarn", script];
      case "bun":
        return ["bun", "run", script];
      case "pnpm":
      default:
        return ["pnpm", script];
    }
  })();
  return run(cmd, dir);
}

async function runNxTarget(label: string, dir: string, target: string, manager: NodePackageManager | null): Promise<boolean> {
  const args = ["run-many", `--target=${target}`, "--all"];
  return run(buildBinaryCommand(manager, "nx", args), dir, { label: `nx:${target} ${label}` });
}

async function runTypeScriptCheck(label: string, dir: string, tsconfig: string, manager: NodePackageManager | null): Promise<boolean> {
  const args = ["-p", tsconfig, "--noEmit"];
  return run(buildBinaryCommand(manager, "tsc", args), dir, { label: `tsc ${label}` });
}

function buildBinaryCommand(manager: NodePackageManager | null, bin: string, args: string[]): string[] {
  switch (manager) {
    case "pnpm":
      return ["pnpm", "exec", bin, ...args];
    case "yarn":
      return ["yarn", bin, ...args];
    case "bun":
      return ["bunx", bin, ...args];
    case "npm":
      return ["npx", "--yes", bin, ...args];
    default:
      return ["npx", "--yes", bin, ...args];
  }
}

async function findTsconfig(dir: string): Promise<string | null> {
  for (const candidate of TS_CONFIG_CANDIDATES) {
    if (await pathExists(join(dir, candidate))) {
      return candidate;
    }
  }
  return null;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

type RunOptions = {
  readonly label?: string;
};

async function run(cmd: string[], cwd: string = process.cwd(), options?: RunOptions): Promise<boolean> {
  const prefix = options?.label ? `[${options.label}] ` : "";
  console.log(`${prefix}> ${cmd.join(" ")}`);
  const proc = spawn({ cmd, cwd, stdout: "pipe", stderr: "pipe" });
  const [out, err, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  const trimmedOut = out.trim();
  if (trimmedOut) {
    logWithPrefix(trimmedOut, prefix, console.log);
  }
  if (exitCode === 0) {
    return true;
  }
  const errorText = err.trim();
  if (errorText) {
    logWithPrefix(errorText, prefix, console.warn);
  }
  return false;
}

function logWithPrefix(text: string, prefix: string, logger: (line: string) => void): void {
  for (const line of text.split("\n")) {
    logger(`${prefix}${line}`);
  }
}

if (import.meta.main) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

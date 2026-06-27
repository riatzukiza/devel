/*
  Giga watcher: watches the entire repo for changes under submodules (orgs/**)
  and runs affected tests/builds, then commits and propagates submodule pointer updates.
*/

import { spawn } from "bun";
import { propagateFromSubmodule } from "./commit-propagator";

const ROOT = process.cwd();

type Change = { readonly abs: string; readonly mod: string };

async function main(): Promise<void> {
  const subs = await readSubmodules();
  if (subs.length === 0) {
    console.error("No submodules detected (.gitmodules). Exiting.");
    return;
  }
  console.log(`Giga watch started. Submodules: ${subs.join(", ")}`);

  const queue = new Map<string, Set<string>>(); // submodulePath -> set of abs files
  let timer: ReturnType<typeof setTimeout> | undefined;

  if (!('watch' in Bun)) {
    console.error("Bun.watch is not available on this platform or version. Falling back to manual mode.");
    return;
  }

  (Bun as any).watch(ROOT, {
    ignore: [
      /(^|\/)\./, // dotfiles, .git
      /node_modules\//,
      /dist\//,
      /build\//,
      /\.next\//,
    ],
    persistent: true,
    // filter quickly: only under orgs/
    filter: (p) => p.includes("/orgs/"),
    // on all events, collect and debounce
    async onChange(event) {
      try {
        const abs = event.path;
        const mod = submoduleForPath(abs, subs);
        if (!mod) return;
        if (!queue.has(mod)) queue.set(mod, new Set());
        queue.get(mod)!.add(abs);
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => flush(queue), 400);
      } catch (e) {
        console.warn("Watch error:", e);
      }
    },
  });
}

async function flush(queue: Map<string, Set<string>>): Promise<void> {
  for (const [mod, files] of queue.entries()) {
    queue.delete(mod);
    const rels = [...files].map((f) => toRelative(mod, f));
    console.log(`Change in ${mod}: ${rels.join(", ")}`);

    const ok = await runForSubmodule(mod, rels);
    const result = ok ? "success" : "failure";
    await propagateFromSubmodule(mod, "watch", result, rels);
  }
}

async function runForSubmodule(mod: string, relFiles: readonly string[]): Promise<boolean> {
  const isNx = await fileExists(`${mod}/nx.json`);
  let ok = true;
  if (isNx) {
    // Prefer affected tests then build
    const filesArg = relFiles.map((f) => `${f}`).join(" ");
    ok = (await run(["bash", "-lc", `pnpm -C "${mod}" nx affected --target=test --files ${filesArg}`], ROOT)) && ok;
    ok = (await run(["bash", "-lc", `pnpm -C "${mod}" nx affected --target=build --files ${filesArg}`], ROOT)) && ok;
    return ok;
  }

  // Non-Nx: look for package.json scripts
  const pj = await readPkg(mod);
  if (pj) {
    if (pj.scripts?.test) {
      ok = (await run(["bash", "-lc", `pnpm -C "${mod}" test`], ROOT)) && ok;
    }
    if (pj.scripts?.build) {
      ok = (await run(["bash", "-lc", `pnpm -C "${mod}" build`], ROOT)) && ok;
    }
  }
  return ok;
}

function submoduleForPath(abs: string, subs: readonly string[]): string | undefined {
  // Choose the deepest submodule path that prefixes abs
  const matches = subs.filter((p) => abs.startsWith(p + "/") || abs === p);
  if (matches.length === 0) return undefined;
  return matches.sort((a, b) => b.length - a.length)[0];
}

async function readSubmodules(): Promise<string[]> {
  try {
    const text = await Bun.file(`${ROOT}/.gitmodules`).text();
    const paths = [...text.matchAll(/\n\s*path\s*=\s*(.+)\n/g)].map((m) => m[1].trim());
    // Make absolute
    return paths.map((p) => `${ROOT}/${p}`);
  } catch {
    return [];
  }
}

function toRelative(base: string, abs: string): string {
  const b = base.endsWith("/") ? base : base + "/";
  return abs.startsWith(b) ? abs.slice(b.length) : abs;
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await Bun.file(p).text();
    return true;
  } catch {
    return false;
  }
}

async function readPkg(dir: string): Promise<any | undefined> {
  try {
    const pj = await Bun.file(`${dir}/package.json`).json();
    return pj;
  } catch {
    return undefined;
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

// GPL-3.0-only
import fg from "fast-glob";
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import pc from "picocolors";
import * as path from "node:path";
import mri from "minimist";

function run(
  cmd: string,
  args: string[],
  cwd: string,
  timeout = 30000,
): Promise<number> {
  return new Promise((res, rej) => {
    // Validate inputs
    if (!cmd || typeof cmd !== "string") {
      rej(new Error("Invalid command"));
      return;
    }
    if (!Array.isArray(args) || args.some((arg) => typeof arg !== "string")) {
      rej(new Error("Invalid arguments"));
      return;
    }

    const p = spawn(cmd, args, { cwd, stdio: "inherit", shell: false });

    let settled = false;

    const settleReject = (err: unknown) => {
      if (settled) return;
      settled = true;
      rej(err instanceof Error ? err : new Error(String(err)));
    };
    const settleResolve = (code?: number | null) => {
      if (settled) return;
      settled = true;
      res(code ?? 1);
    };

    const timer = setTimeout(() => {
      try { p.kill("SIGKILL"); } catch {}
      settleReject(new Error(`Command timed out after ${timeout}ms`));
    }, timeout);

    p.on("exit", (code) => {
      clearTimeout(timer);
      settleResolve(code);
    });

    p.on("error", (err) => {
      clearTimeout(timer);
      settleReject(err);
    });
  });
}

function guessDialects(files: string[]): string[] {
  const exts = new Set(files.map((f) => path.extname(f)));
  const ds: string[] = [];
  if (exts.has(".clj") || exts.has(".cljs") || exts.has(".cljc"))
    ds.push("clj");
  if (exts.has(".lisp") || exts.has(".lsp")) ds.push("lisp");
  if (exts.has(".el")) ds.push("el");
  if (exts.has(".scm") || exts.has(".rkt")) ds.push("scm");
  return ds;
}

async function main() {
  const args = mri(process.argv.slice(2), {
    string: ["root", "prompt", "out"],
    default: { prompt: "build", out: "data/buildset.jsonl" },
  });

  // Validate inputs
  if (!args.root || typeof args.root !== "string") {
    console.error("Error: --root is required and must be a string");
    process.exit(1);
  }
  if (!args.out || typeof args.out !== "string") {
    console.error("Error: --out is required and must be a string");
    process.exit(1);
  }
  if (!args.prompt || typeof args.prompt !== "string") {
    console.error("Error: --prompt is required and must be a string");
    process.exit(1);
  }

  // Validate prompt against allowlist
  const allowedPrompts = ["build", "test", "lint", "compile"];
  if (!allowedPrompts.includes(args.prompt)) {
    console.error(
      `Error: Prompt "${args.prompt}" not in allowlist: ${allowedPrompts.join(", ")}`,
    );
    process.exit(1);
  }

  const roots = await fg([`${args.root}/**/.git`], {
    onlyDirectories: true,
    deep: 3,
  });
  const out = createWriteStream(args.out, { flags: "w" });

  for (const gitdir of roots) {
    const repoRoot = path.dirname(gitdir);
    const files = await fg(["**/*.{clj,cljs,cljc,lisp,lsp,el,scm,rkt}"], {
      cwd: repoRoot,
      dot: true,
    });
    if (files.length === 0) continue;

    const dialects = guessDialects(files);
    process.stdout.write(pc.dim(`probing ${repoRoot}… `));
    try {
      const code = await run("opencode", ["run", args.prompt], repoRoot);
      const status = code === 0 ? "green" : "red";
      console.log(status === "green" ? pc.green("ok") : pc.red("fail"));
      if (status === "green") {
        out.write(
          JSON.stringify({
            repo: path.basename(repoRoot),
            root: repoRoot,
            prompt: args.prompt,
            status,
            dialects,
          }) + "\n",
        );
      }
    } catch (error) {
      console.log(
        pc.red(
          `error: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    }
  }
  out.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import path from "node:path";
import fs from "node:fs/promises";
import { tool } from "@opencode-ai/plugin";

const allowedExtensions = new Set([".clj", ".cljs", ".cljc"]);

const resolveFilePath = (filePath, worktree) => {
  const worktreeAbs = path.resolve(worktree);
  const targetAbs = path.resolve(worktreeAbs, filePath);

  if (!targetAbs.startsWith(`${worktreeAbs}${path.sep}`)) {
    throw new Error(`Refusing to lint outside worktree: ${filePath}`);
  }

  return targetAbs;
};

const formatError = (error) => {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  return String(error);
};

const runKondo = async (filePath) => {
  if (!globalThis.Bun?.which) {
    return { ok: false, error: "Bun runtime not available for clj-kondo execution" };
  }

  let kondoPath = globalThis.Bun.which("clj-kondo");
  
  if (!kondoPath) {
     const localPath = path.resolve(process.cwd(), "node_modules", ".bin", "clj-kondo");
     if (await fs.stat(localPath).then(() => true).catch(() => false)) {
       kondoPath = localPath;
     }
  }

  if (!kondoPath) {
    return { ok: false, error: "clj-kondo not found in PATH or node_modules/.bin" };
  }

  const proc = globalThis.Bun.spawn([kondoPath, "--lint", filePath], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    return {
      ok: false,
      error: stderr.trim() || stdout.trim() || "clj-kondo reported lint errors",
    };
  }

  return { ok: true, output: stdout.trim() };
};

export default tool({
  description: "Validate Clojure/ClojureScript syntax using clj-kondo",
  args: {
    file_path: tool.schema.string().describe("Path to a .clj/.cljs/.cljc file"),
  },
  async execute(args, context) {
    const filePath = String(args.file_path ?? "").trim();
    if (!filePath) {
      return { success: false, error: "file_path is required" };
    }

    const worktree = context?.worktree ?? process.cwd();
    const targetAbs = resolveFilePath(filePath, worktree);

    if (!allowedExtensions.has(path.extname(targetAbs))) {
      return { success: false, error: "Target file must be .clj, .cljs, or .cljc" };
    }

    try {
      await fs.access(targetAbs);
    } catch (error) {
      return { success: false, error: formatError(error) };
    }

    const result = await runKondo(targetAbs);
    if (!result.ok) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      file_path: filePath,
      output: result.output,
    };
  },
});

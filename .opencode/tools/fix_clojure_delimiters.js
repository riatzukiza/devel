import path from "node:path";
import fs from "node:fs/promises";
import { tool } from "@opencode-ai/plugin";

import parinfer from "parinfer";

const allowedExtensions = new Set([".clj", ".cljs", ".cljc"]);
const allowedModes = new Set(["parinfer-indent", "parinfer-paren", "cljstyle"]);

const resolveFilePath = (filePath, worktree) => {
  const worktreeAbs = path.resolve(worktree);
  const targetAbs = path.resolve(worktreeAbs, filePath);

  if (!targetAbs.startsWith(`${worktreeAbs}${path.sep}`)) {
    throw new Error(`Refusing to edit outside worktree: ${filePath}`);
  }

  return targetAbs;
};

const formatError = (error) => {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error.message) return error.message;
  return String(error);
};

const applyParinfer = (text, mode) => {
  try {
    let result;
    if (mode === "parinfer-indent") {
      result = parinfer.indentMode(text);
    } else if (mode === "parinfer-paren") {
      result = parinfer.parenMode(text);
    } else {
      return { ok: false, error: `Invalid parinfer mode: ${mode}` };
    }

    if (!result.success) {
      return {
        ok: false,
        error: result.error ? `Line ${result.error.lineNo}: ${result.error.message}` : "Unknown Parinfer error",
      };
    }

    return {
      ok: true,
      text: result.text,
    };
  } catch (error) {
    return {
      ok: false,
      error: `Parinfer execution failed: ${formatError(error)}`,
    };
  }
};

const applyCljstyle = async (text) => {
  if (!globalThis.Bun?.which) {
    return {
      ok: false,
      error: "Bun runtime not available for cljstyle execution",
    };
  }

  const cljstylePath = globalThis.Bun.which("cljstyle");
  if (!cljstylePath) {
    return {
      ok: false,
      error: "cljstyle not found in PATH. Install via brew or release binary.",
    };
  }

  const proc = globalThis.Bun.spawn([cljstylePath, "pipe"], {
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });

  await proc.stdin.write(text);
  await proc.stdin.end();

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    return {
      ok: false,
      error: stderr.trim() || `cljstyle failed with exit code ${exitCode}`,
    };
  }

  return {
    ok: true,
    text: stdout,
  };
};

export default tool({
  description: "Automatically fix malformed Clojure delimiters using Parinfer or cljstyle",
  args: {
    file_path: tool.schema.string().describe("Path to a .clj/.cljs/.cljc file"),
    mode: tool.schema
      .string()
      .default("parinfer-indent")
      .describe("parinfer-indent | parinfer-paren | cljstyle"),
  },
  async execute(args, context) {
    const filePath = String(args.file_path ?? "").trim();
    if (!filePath) {
      return { success: false, error: "file_path is required" };
    }

    const mode = String(args.mode ?? "parinfer-indent");
    if (!allowedModes.has(mode)) {
      return { success: false, error: `Unsupported mode: ${mode}` };
    }

    const worktree = context?.worktree ?? process.cwd();
    const targetAbs = resolveFilePath(filePath, worktree);

    if (!allowedExtensions.has(path.extname(targetAbs))) {
      return { success: false, error: "Target file must be .clj, .cljs, or .cljc" };
    }

    let originalText;
    try {
      originalText = await fs.readFile(targetAbs, "utf8");
    } catch (error) {
      return { success: false, error: formatError(error) };
    }

    const result = mode === "cljstyle"
      ? await applyCljstyle(originalText)
      : applyParinfer(originalText, mode);

    if (!result.ok) {
      return { success: false, error: result.error };
    }

    const nextText = result.text ?? originalText;
    const changed = nextText !== originalText;

    if (changed) {
      await fs.writeFile(targetAbs, nextText, "utf8");
    }

    return {
      success: true,
      file_path: filePath,
      mode,
      changed,
      changedLines: result.changedLines ?? [],
    };
  },
});

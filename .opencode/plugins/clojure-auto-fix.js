const truthy = (value) => value === "1" || value === "true" || value === "yes" || value === "on";

const formatLog = (message, extra = {}) => ({
  service: "clojure-auto-fix",
  level: "info",
  message,
  extra,
});

const lintWithKondo = async (filePath) => {
  if (!globalThis.Bun?.which) {
    return { ok: false, error: "Bun runtime not available" };
  }

  const kondoPath = globalThis.Bun.which("clj-kondo");
  if (!kondoPath) {
    return { ok: false, error: "clj-kondo not found in PATH" };
  }

  const proc = globalThis.Bun.spawn([kondoPath, "--lint", filePath], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    return { ok: false, error: stderr.trim() || stdout.trim() };
  }

  return { ok: true, output: stdout.trim() };
};

export const ClojureAutoFixPlugin = async ({ client }) => {
  await client.app.log(formatLog("loaded"));

  return {
    "tool.execute.after": async (input, output) => {
      try {
        if (!truthy(process.env.OPENCODE_CLOJURE_VALIDATE_ON_FIX)) return;
        if (input?.tool !== "fix_clojure_delimiters") return;

        const filePath = input?.args?.file_path
          ?? output?.file_path
          ?? output?.args?.file_path;

        if (!filePath) return;

        const result = await lintWithKondo(filePath);
        if (!result.ok) {
          await client.app.log(formatLog("clj-kondo failed", { filePath, error: result.error }));
          return;
        }

        await client.app.log(formatLog("clj-kondo ok", { filePath, output: result.output }));
      } catch (error) {
        await client.app.log(formatLog("clj-kondo exception", { error: String(error) }));
      }
    },
  };
};

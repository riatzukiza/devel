import path from "node:path";

/**
 * Convert a user path to a safe normalized relative path (POSIX-like),
 * and then resolve it inside `root`. Throws if it escapes.
 */
export function resolveWithinRoot(rootAbs: string, userPath: string): { absPath: string; relPath: string } {
  if (!path.isAbsolute(rootAbs)) {
    throw new Error(`LOCAL_ROOT must be an absolute path; got: ${rootAbs}`);
  }

  // Normalize input: treat backslashes as slashes, strip leading slashes.
  const cleaned = (userPath ?? "").replace(/\\/g, "/").replace(/^\/+/, "");
  const rel = path.posix.normalize(cleaned);

  // Prevent traversal
  if (rel === ".." || rel.startsWith("../") || rel.includes("/../")) {
    throw new Error("Path escapes root");
  }

  // Convert POSIX rel to platform path, then resolve under root.
  const relPlatform = rel.split("/").join(path.sep);
  const abs = path.resolve(rootAbs, relPlatform);

  const rootNorm = path.resolve(rootAbs) + path.sep;
  const absNorm = abs + (abs.endsWith(path.sep) ? "" : path.sep);
  if (!abs.startsWith(path.resolve(rootAbs))) {
    throw new Error("Path escapes root");
  }
  // Additional guard: ensure root prefix match with separator
  if (!absNorm.startsWith(rootNorm) && abs !== path.resolve(rootAbs)) {
    throw new Error("Path escapes root");
  }

  return { absPath: abs, relPath: rel === "." ? "" : rel };
}

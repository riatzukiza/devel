import path from "node:path";

/**
 * Convert a user path to a safe normalized relative path (POSIX-like),
 * and then resolve it inside `root`. Throws if it escapes.
 */
export function resolveWithinRoot(rootAbs: string, userPath: string): { absPath: string; relPath: string } {
  if (!path.isAbsolute(rootAbs)) {
    throw new Error(`LOCAL_ROOT must be an absolute path; got: ${rootAbs}`);
  }

  const rootNorm = path.resolve(rootAbs);

  let cleaned = (userPath ?? "");
  
  // Normalize backslashes to forward slashes
  cleaned = cleaned.replace(/\\/g, "/");
  
  // Handle "/" and "//" as root - don't treat as absolute paths to escape
  if (cleaned === "/" || cleaned === "//" || cleaned === "") {
    cleaned = ".";
  }
  
  // If absolute path is given and it's within LOCAL_ROOT, convert to relative
  if (path.isAbsolute(cleaned)) {
    const userPathResolved = path.resolve(cleaned);
    if (userPathResolved.startsWith(rootNorm)) {
      cleaned = userPathResolved.slice(rootNorm.length).replace(/^\/+/, "");
      // Handle case where path resolves to exactly root
      if (cleaned === "") cleaned = ".";
    } else {
      throw new Error(`Path ${userPath} is outside of LOCAL_ROOT ${rootAbs}`);
    }
  }
  
  // Strip leading slashes for relative path processing
  cleaned = cleaned.replace(/^\/+/, "");
  
  // Normalize and validate
  const normalized = path.posix.normalize(cleaned);
  
  // Strip trailing slashes from normalized path (but keep at least one path component)
  const normalizedNoTrailingSlash = normalized.replace(/\/+$/, "") || ".";
  
  // Prevent traversal attacks - check each path segment for ".."
  // Also check for %2f (encoded /) followed by .. which would be an escape attempt
  const normalizedForCheck = normalizedNoTrailingSlash.replace(/%2f/g, "/");
  const segments = normalizedForCheck.split("/");
  for (const segment of segments) {
    if (segment === "..") {
      throw new Error("Path escapes root");
    }
  }
  
  // Handle null bytes
  if (cleaned.includes("\0")) {
    throw new Error("Path contains null bytes");
  }

  // Convert to platform path and resolve
  const relPlatform = normalized.split("/").join(path.sep);
  const abs = path.resolve(rootNorm, relPlatform);
  
  // Final security check - ensure result is within root
  const absNormalized = path.normalize(abs);
  if (!absNormalized.startsWith(rootNorm) && absNormalized !== rootNorm) {
    throw new Error("Path escapes root");
  }

  return { absPath: abs, relPath: normalizedNoTrailingSlash === "." ? "" : normalizedNoTrailingSlash };
}

import { describe, it, expect } from "bun:test";

import { resolveWithinRoot } from "../util/pathJail.js";

describe("pathJail", () => {
  describe("resolveWithinRoot", () => {
    it("should resolve simple paths", () => {
      const result = resolveWithinRoot("/app/root", "file.txt");
      expect(result.absPath).toBe("/app/root/file.txt");
      expect(result.relPath).toBe("file.txt");
    });

    it("should resolve nested paths", () => {
      const result = resolveWithinRoot("/app/root", "subdir/nested/file.txt");
      expect(result.absPath).toBe("/app/root/subdir/nested/file.txt");
      expect(result.relPath).toBe("subdir/nested/file.txt");
    });

    it("should reject path traversal attempts", () => {
      expect(() => {
        resolveWithinRoot("/app/root", "../etc/passwd");
      }).toThrow("Path escapes root");
    });

    it("should reject traversal in middle of path", () => {
      expect(() => {
        resolveWithinRoot("/app/root", "subdir/../../etc/passwd");
      }).toThrow("Path escapes root");
    });

    it("should reject absolute paths outside root", () => {
      // Absolute paths outside the root are rejected for security
      expect(() => {
        resolveWithinRoot("/app/root", "/etc/passwd");
      }).toThrow("Path /etc/passwd is outside of LOCAL_ROOT /app/root");
    });

    it("should handle empty path as root", () => {
      const result = resolveWithinRoot("/app/root", "");
      expect(result.absPath).toBe("/app/root");
      expect(result.relPath).toBe("");
    });

    it("should normalize backslashes to forward slashes", () => {
      const result = resolveWithinRoot("/app/root", "subdir\\nested\\file.txt");
      expect(result.relPath).toBe("subdir/nested/file.txt");
    });

    it("should throw for non-absolute root", () => {
      expect(() => {
        resolveWithinRoot("relative/path", "file.txt");
      }).toThrow("must be an absolute path");
    });
  });
});

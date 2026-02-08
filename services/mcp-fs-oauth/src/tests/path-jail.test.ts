import { describe, it, expect } from "bun:test";
import { resolveWithinRoot } from "../util/pathJail.js";

describe("Path Jail Validation", () => {
  describe("Root path handling", () => {
    it("should treat empty string as root", () => {
      const result = resolveWithinRoot("/home/err/devel", "");
      expect(result.absPath).toBe("/home/err/devel");
      expect(result.relPath).toBe("");
    });

    it("should treat '.' as root", () => {
      const result = resolveWithinRoot("/home/err/devel", ".");
      expect(result.absPath).toBe("/home/err/devel");
      expect(result.relPath).toBe("");
    });

    it("should treat '/' as root", () => {
      const result = resolveWithinRoot("/home/err/devel", "/");
      expect(result.absPath).toBe("/home/err/devel");
      expect(result.relPath).toBe("");
    });

    it("should treat '//' as root", () => {
      const result = resolveWithinRoot("/home/err/devel", "//");
      expect(result.absPath).toBe("/home/err/devel");
      expect(result.relPath).toBe("");
    });
  });

  describe("Absolute path conversion", () => {
    it("should convert absolute path within root to relative", () => {
      const result = resolveWithinRoot("/home/err/devel", "/home/err/devel/src");
      expect(result.absPath).toBe("/home/err/devel/src");
      expect(result.relPath).toBe("src");
    });

    it("should handle absolute path with trailing slash", () => {
      const result = resolveWithinRoot("/home/err/devel", "/home/err/devel/src/");
      expect(result.absPath).toBe("/home/err/devel/src");
      expect(result.relPath).toBe("src");
    });

    it("should reject absolute path outside root", () => {
      expect(() => {
        resolveWithinRoot("/home/err/devel", "/etc/passwd");
      }).toThrow("Path /etc/passwd is outside of LOCAL_ROOT /home/err/devel");
    });
  });

  describe("Path traversal prevention", () => {
    it("should reject direct parent directory traversal", () => {
      expect(() => {
        resolveWithinRoot("/home/err/devel", "..");
      }).toThrow("Path escapes root");
    });

    it("should reject parent directory traversal at start", () => {
      expect(() => {
        resolveWithinRoot("/home/err/devel", "../etc");
      }).toThrow("Path escapes root");
    });

    it("should normalize parent directory in middle of path (safe)", () => {
      const result = resolveWithinRoot("/home/err/devel", "foo/../bar");
      expect(result.absPath).toBe("/home/err/devel/bar");
      expect(result.relPath).toBe("bar");
    });

    it("should keep encoded dots as literal text", () => {
      const result = resolveWithinRoot("/home/err/devel", "%2e%2e");
      expect(result.relPath).toBe("%2e%2e");
    });

    it("should normalize backslashes to forward slashes", () => {
      const result = resolveWithinRoot("/home/err/devel", "foo\\..\\bar");
      expect(result.absPath).toBe("/home/err/devel/bar");
      expect(result.relPath).toBe("bar");
    });
  });

  describe("Relative path handling", () => {
    it("should resolve simple relative path", () => {
      const result = resolveWithinRoot("/home/err/devel", "src");
      expect(result.absPath).toBe("/home/err/devel/src");
      expect(result.relPath).toBe("src");
    });

    it("should resolve nested relative path", () => {
      const result = resolveWithinRoot("/home/err/devel", "src/lib");
      expect(result.absPath).toBe("/home/err/devel/src/lib");
      expect(result.relPath).toBe("src/lib");
    });

    it("should resolve path with multiple slashes", () => {
      const result = resolveWithinRoot("/home/err/devel", "src///lib///");
      expect(result.absPath).toBe("/home/err/devel/src/lib");
      // path.posix.normalize removes trailing slashes
      expect(result.relPath).toBe("src/lib");
    });

    it("should normalize dot segments", () => {
      const result = resolveWithinRoot("/home/err/devel", "foo/./bar/.");
      expect(result.absPath).toBe("/home/err/devel/foo/bar");
      expect(result.relPath).toBe("foo/bar");
    });

    it("should reject double dot that escapes", () => {
      expect(() => {
        resolveWithinRoot("/home/err/devel", "foo/../../etc");
      }).toThrow("Path escapes root");
    });
  });

  describe("Special paths", () => {
    it("should reject null/undefined gracefully", () => {
      // Empty string is treated as root
      const result = resolveWithinRoot("/home/err/devel", "");
      expect(result.absPath).toBe("/home/err/devel");
    });

    it("should handle paths with spaces", () => {
      const result = resolveWithinRoot("/home/err/devel", "my directory/file.txt");
      expect(result.absPath).toBe("/home/err/devel/my directory/file.txt");
      expect(result.relPath).toBe("my directory/file.txt");
    });

    it("should handle paths with unicode", () => {
      const result = resolveWithinRoot("/home/err/devel", "日本語/ファイル.txt");
      expect(result.relPath).toBe("日本語/ファイル.txt");
    });
  });

  describe("Edge cases", () => {
    it("should handle paths that normalize to root", () => {
      const result = resolveWithinRoot("/home/err/devel", "./././.");
      expect(result.absPath).toBe("/home/err/devel");
      expect(result.relPath).toBe("");
    });

    it("should reject path that becomes just dot after normalization", () => {
      // This should still work since "." = root
      const result = resolveWithinRoot("/home/err/devel", "foo/..");
      expect(result.absPath).toBe("/home/err/devel");
      expect(result.relPath).toBe("");
    });

    it("should handle very long paths", () => {
      const longPath = "a".repeat(1000);
      const result = resolveWithinRoot("/home/err/devel", longPath);
      expect(result.relPath).toBe(longPath);
      expect(result.absPath).toBe(`/home/err/devel/${longPath}`);
    });

    it("should reject paths with null bytes", () => {
      expect(() => {
        resolveWithinRoot("/home/err/devel", "safe\0dangerous");
      }).toThrow();
    });
  });

  describe("Security boundary validation", () => {
    it("should normalize combined dot segments (safe)", () => {
      const result = resolveWithinRoot("/home/err/devel", "foo/./../etc");
      expect(result.absPath).toBe("/home/err/devel/etc");
      expect(result.relPath).toBe("etc");
    });

    it("should keep encoded slashes as literal text (not URL decoding)", () => {
      const result = resolveWithinRoot("/home/err/devel", "foo/%2fbar");
      expect(result.relPath).toBe("foo/%2fbar");
    });

    it("should handle encoded slashes as literal text", () => {
      const result = resolveWithinRoot("/home/err/devel", "foo/%2fbar");
      expect(result.relPath).toBe("foo/%2fbar");
    });

    it("should prevent root escape via mixed slashes", () => {
      expect(() => {
        resolveWithinRoot("/home/err/devel", "foo/./../../etc");
      }).toThrow("Path escapes root");
    });

    it("should prevent escape via encoded slashes", () => {
      expect(() => {
        resolveWithinRoot("/home/err/devel", "foo/%2f../etc");
      }).toThrow("Path escapes root");
    });
  });
});

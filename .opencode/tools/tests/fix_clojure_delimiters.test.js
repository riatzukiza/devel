import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import path from "node:path";
import fs from "node:fs/promises";
import fix from "../fix_clojure_delimiters.js";

const TEST_DIR = path.resolve(".opencode/tools/tests/temp");

describe("fix_clojure_delimiters", () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  it("should respect indentation using parinfer-indent", async () => {
    const filePath = path.resolve(TEST_DIR, "test.clj");
    const badContent = `(defn foo []\n(println "hello"))`;

    await fs.writeFile(filePath, badContent, "utf8");

    const result = await fix.execute({
      file_path: filePath,
      mode: "parinfer-indent"
    });

    expect(result.success).toBe(true);
    expect(result.changed).toBe(true);
    const newContent = await fs.readFile(filePath, "utf8");
    expect(newContent).toBe(`(defn foo [])\n(println "hello")`);
  });

  it("should fix parentheses using parinfer-indent (infer parens from indent)", async () => {
    const filePath = path.resolve(TEST_DIR, "test.clj");
    const badContentIndent = `(defn foo []\n  (println "hello"`;
    
    await fs.writeFile(filePath, badContentIndent, "utf8");
    
    const resultIndent = await fix.execute({
        file_path: filePath,
        mode: "parinfer-indent"
    });
    expect(resultIndent.success).toBe(true);
    expect(resultIndent.changed).toBe(true);
    const newContentIndent = await fs.readFile(filePath, "utf8");
    expect(newContentIndent).toBe(`(defn foo []\n  (println "hello"))`);
  });

  it("should fix indentation using parinfer-paren (infer indent from parens)", async () => {
    const filePath = path.resolve(TEST_DIR, "test.clj");
    const badContentParen = `(defn foo []\n(println "hello"))`;
    await fs.writeFile(filePath, badContentParen, "utf8");
    
    const resultParen = await fix.execute({
        file_path: filePath,
        mode: "parinfer-paren"
    });
    
    expect(resultParen.success).toBe(true);
    expect(resultParen.changed).toBe(true);
    const newContentParen = await fs.readFile(filePath, "utf8");
    expect(newContentParen).toMatch(/\(defn foo \[\]\n\s+\(println "hello"\)\)/);
  });
});

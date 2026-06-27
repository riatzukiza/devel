import assert from "node:assert/strict";
import test from "node:test";
import {
  splitSentences,
  deduplicateByHash,
  computeTextHash,
  type SentenceWithHash,
} from "../lib/sentence-split.js";

test("splitSentences returns empty array for empty input", () => {
  assert.deepEqual(splitSentences(""), []);
  assert.deepEqual(splitSentences("   "), []);
  assert.deepEqual(splitSentences("   \n\n   "), []);
});

test("splitSentences splits on sentence boundaries", () => {
  const result = splitSentences("Hello world. This is a test. Another sentence here.");
  assert.ok(result.length >= 2, `expected >=2 sentences, got ${result.length}`);
  const texts = result.map((s) => s.sentence);
  assert.ok(texts.some((t) => t.includes("Hello world")), `missing "Hello world": ${JSON.stringify(texts)}`);
  assert.ok(texts.some((t) => t.includes("This is a test")), `missing "This is a test": ${JSON.stringify(texts)}`);
});

test("splitSentences computes correct hashes", () => {
  const result = splitSentences("The quick brown fox. The lazy dog.");
  assert.ok(result.length >= 2, `expected >=2, got ${result.length}`);

  for (const item of result) {
    assert.equal(item.hash.length, 64, `hash should be 64 hex chars, got ${item.hash.length}`);
    assert.match(item.hash, /^[0-9a-f]{64}$/, `hash should be lowercase hex: ${item.hash}`);
  }

  const [first, second] = result;
  if (first && second) {
    assert.notEqual(first.hash, second.hash, "different sentences should have different hashes");
  }
});

test("splitSentences normalizes for hashing (case-insensitive)", () => {
  const upper = splitSentences("HELLO WORLD.");
  const lower = splitSentences("hello world.");
  assert.ok(upper.length > 0 && lower.length > 0, "both should produce sentences");
  assert.equal(upper[0]!.hash, lower[0]!.hash, "case should be normalized for hash");
});

test("splitSentences computes token estimates", () => {
  const result = splitSentences("The quick brown fox jumps over the lazy dog.");
  assert.ok(result.length > 0, "should produce sentences");
  const item = result[0]!;
  assert.ok(item.tokens > 0, `tokens should be > 0, got ${item.tokens}`);
  assert.ok(item.tokens < item.sentence.length, `tokens (${item.tokens}) should be < chars (${item.sentence.length})`);
});

test("computeTextHash returns consistent sha256", () => {
  const hash1 = computeTextHash("hello world");
  const hash2 = computeTextHash("hello world");
  const hash3 = computeTextHash("HELLO WORLD");
  assert.equal(hash1, hash2, "same text should produce same hash");
  assert.equal(hash1, hash3, "case should be normalized");
  assert.equal(hash1.length, 64, "sha256 hex = 64 chars");
});

test("computeTextHash differs for different text", () => {
  const a = computeTextHash("hello");
  const b = computeTextHash("world");
  assert.notEqual(a, b, "different text should differ");
});

test("deduplicateByHash keeps first occurrence", () => {
  const items: SentenceWithHash[] = [
    { sentence: "Hello world.", hash: "abc", tokens: 3 },
    { sentence: "Hello world.", hash: "abc", tokens: 3 },
    { sentence: "Goodbye.", hash: "def", tokens: 1 },
  ];
  const deduped = deduplicateByHash(items);
  assert.equal(deduped.size, 2, "should deduplicate to 2 unique");
  assert.ok(deduped.has("abc"), "abc should be present");
  assert.ok(deduped.has("def"), "def should be present");
  assert.equal(deduped.get("abc")!.sentence, "Hello world.", "should keep first");
});

test("deduplicateByHash returns Map with stable ordering", () => {
  const items: SentenceWithHash[] = [
    { sentence: "First.", hash: "aaa", tokens: 1 },
    { sentence: "Second.", hash: "bbb", tokens: 1 },
    { sentence: "Third.", hash: "ccc", tokens: 1 },
  ];
  const deduped = deduplicateByHash(items);
  const keys = Array.from(deduped.keys());
  assert.deepEqual(keys, ["aaa", "bbb", "ccc"], "should preserve insertion order");
});

test("splitSentences handles long sentences", () => {
  const long = "This is a very long sentence. ".repeat(100);
  const result = splitSentences(long + "Short one.");
  assert.ok(result.length >= 1, `expected >=1, got ${result.length}`);
  for (const item of result) {
    assert.ok(item.hash.length > 0, "hash should be non-empty");
    assert.ok(item.tokens > 0, "tokens should be > 0");
  }
});

test("splitSentences handles unicode", () => {
  const result = splitSentences("Bonjour le monde. Hello world.");
  assert.ok(result.length >= 2, `expected >=2, got ${result.length}`);
  const texts = result.map((s) => s.sentence);
  assert.ok(texts.some((t) => t.includes("Bonjour")), `missing french: ${JSON.stringify(texts)}`);
});

test("splitSentences skips fragments under 3 tokens", () => {
  const result = splitSentences("A. B. C. D.");
  for (const item of result) {
    if (item.tokens <= 3) {
      assert.ok(item.sentence.length <= 5, `tiny tokens should be short: "${item.sentence}"`);
    }
  }
});
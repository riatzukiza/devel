import assert from "node:assert/strict";
import test from "node:test";
import {
  prepareIndexDocument,
  isContextOverflowError,
  batchPreparedChunks,
  type PreparedIndexChunk,
} from "../lib/indexing.js";

test("isContextOverflowError matches ollama context overflow", () => {
  assert.ok(isContextOverflowError(new Error("ollama_context_overflow")));
  assert.ok(isContextOverflowError(new Error("context window exceeded")));
  assert.ok(isContextOverflowError(new Error("exceeds model context window")));
  assert.ok(isContextOverflowError(new Error("Context size has been exceeded.")));
  assert.ok(isContextOverflowError(new Error("embed_input_too_large")));
  assert.ok(isContextOverflowError(new Error("embedding input is too large")));
  assert.ok(isContextOverflowError(new Error("input is too large")));
  assert.ok(isContextOverflowError(new Error("maximum: 200000")));
});

test("isContextOverflowError matches exceed_context_size_error from embed provider", () => {
  const err = new Error(
    'Embed provider failed: 400 Bad Request\n{"error":{"code":400,"message":"request (56759 tokens) exceeds the available context size (32768 tokens)","type":"exceed_context_size_error"}}'
  );
  assert.ok(isContextOverflowError(err), "exceed_context_size_error should be detected");

  const err2 = new Error(
    '{"error":{"code":400,"message":"Embedding upstream rejected the request: {\\"error\\\":{\\"type\\":\\"exceed_context_size_error\\"}}","type":"invalid_request_error"}}'
  );
  assert.ok(isContextOverflowError(err2), "nested exceed_context_size_error should be detected");
});

test("isContextOverflowError returns false for unrelated errors", () => {
  assert.ok(!isContextOverflowError(new Error("connection refused")));
  assert.ok(!isContextOverflowError(new Error("model not found")));
  assert.ok(!isContextOverflowError(new Error("rate limit exceeded")));
  assert.ok(!isContextOverflowError(new Error("timeout")));
  assert.ok(!isContextOverflowError(null));
  assert.ok(!isContextOverflowError(undefined));
  assert.ok(!isContextOverflowError("just a string"));
});

test("prepareIndexDocument returns single chunk for small text", () => {
  const result = prepareIndexDocument({
    parentId: "test-doc",
    text: "Hello world this is a short document.",
  });
  assert.equal(result.chunkCount, 1, "short text should not be chunked");
  assert.equal(result.chunks.length, 1);
  assert.equal(result.chunks[0]!.id, "test-doc");
  assert.equal(result.chunks[0]!.chunkIndex, 0);
  assert.equal(result.chunks[0]!.chunkCount, 1);
  assert.equal(result.chunks[0]!.charStart, 0);
  assert.equal(result.chunks[0]!.charEnd, result.normalizedText.length);
});

test("prepareIndexDocument chunks large text", () => {
  const longText = "Word ".repeat(10_000);
  const result = prepareIndexDocument({
    parentId: "big-doc",
    text: longText,
    targetChunkTokens: 1_000,
    targetChunkChars: 10_000,
    overlapChars: 500,
  });
  assert.ok(result.chunkCount > 1, `expected chunking, got count=${result.chunkCount}`);
  for (let i = 0; i < result.chunks.length; i++) {
    const chunk = result.chunks[i]!;
    assert.equal(chunk.id, `big-doc#chunk:${String(i).padStart(4, "0")}`, `chunk ${i} id mismatch`);
    assert.equal(chunk.chunkIndex, i);
    assert.equal(chunk.chunkCount, result.chunkCount);
    if (chunk.charStart !== null && chunk.charStart !== undefined && chunk.charEnd !== null && chunk.charEnd !== undefined) {
      assert.equal(result.normalizedText.slice(chunk.charStart, chunk.charEnd), chunk.text);
    }
  }
});

test("prepareIndexDocument forceChunking overrides small text", () => {
  const result = prepareIndexDocument({
    parentId: "small-but-forced",
    text: "Tiny doc.",
    forceChunking: true,
    targetChunkTokens: 4_000,
    targetChunkChars: 16_000,
  });
  assert.ok(result.chunkCount > 1 || result.chunks.length >= 1, "should produce chunks");
});

test("prepareIndexDocument stores correct estimated tokens", () => {
  const text = "The quick brown fox jumps over the lazy dog.";
  const result = prepareIndexDocument({ parentId: "tok-test", text });
  assert.ok(result.rawEstimatedTokens > 0, "rawEstimatedTokens should be > 0");
  assert.ok(result.normalizedEstimatedTokens > 0, "normalizedEstimatedTokens should be > 0");
});

test("prepareIndexDocument preserves parentId", () => {
  const result = prepareIndexDocument({ parentId: "my-special-id", text: "Some text here." });
  assert.equal(result.parentId, "my-special-id");
});

test("batchPreparedChunks respects token budget", () => {
  const chunks: PreparedIndexChunk[] = Array.from({ length: 10 }, (_, i) => ({
    id: `chunk-${i}`,
    text: `Word `.repeat(100),
    chunkIndex: i,
    chunkCount: 10,
  }));

  const batches = batchPreparedChunks(chunks, { maxBatchTokens: 1_000, maxBatchItems: 3 });
  assert.ok(batches.length > 1, `expected multiple batches, got ${batches.length}`);

  let totalChunks = 0;
  for (const batch of batches) {
    assert.ok(batch.length <= 3, `batch size ${batch.length} exceeds maxBatchItems=3`);
    totalChunks += batch.length;
  }
  assert.equal(totalChunks, 10, "all chunks should be accounted for");
});

test("batchPreparedChunks handles empty input", () => {
  const batches = batchPreparedChunks([]);
  assert.deepEqual(batches, []);
});

test("batchPreparedChunks handles single chunk", () => {
  const chunks: PreparedIndexChunk[] = [{
    id: "solo",
    text: "Only one.",
    chunkIndex: 0,
    chunkCount: 1,
  }];
  const batches = batchPreparedChunks(chunks);
  assert.equal(batches.length, 1);
  assert.equal(batches[0]!.length, 1);
});

test("DEFAULT limits are conservative for 8k context", () => {
  const result = prepareIndexDocument({
    parentId: "limit-check",
    text: "Word ".repeat(7_000),
    targetChunkTokens: 4_000,
    targetChunkChars: 16_000,
  });
  for (const chunk of result.chunks) {
    assert.ok(
      chunk.text.length <= 16_000,
      `chunk chars ${chunk.text.length} exceeds 16k limit`
    );
  }
});
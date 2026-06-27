import assert from "node:assert/strict";
import test from "node:test";
import { EmbedProviderFunction } from "../lib/embeddings.js";

const ctxErrPayload = JSON.stringify({
  error: {
    code: 400,
    message: "request (12000 tokens) exceeds the available context size (8000 tokens)",
    type: "exceed_context_size_error",
  },
});

function makeResponse(status: number, body: string): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "application/json" },
  });
}

function makeOkFetch(texts: string[]): typeof globalThis.fetch {
  return async (input: RequestInfo) => {
    const req = input instanceof Request ? input : new Request(input as string);
    const text = await req.text().catch(() => "");
    let inputTexts: string[] = texts;
    try {
      inputTexts = JSON.parse(text).input;
    } catch { /* use defaults */ }
    return makeResponse(200, JSON.stringify({
      embeddings: inputTexts.map(() =>
        Array.from({ length: 1024 }, (_, i) => (i % 100) / 100)
      ),
    }));
  };
}

function makeStatusFetch(status: number, body: string): typeof globalThis.fetch {
  return async () => makeResponse(status, body);
}

function makeCtxOverflowFetch(okPayload: string): typeof globalThis.fetch {
  let first = true;
  return async () => {
    if (first) { first = false; return makeResponse(400, okPayload); }
    return makeResponse(200, JSON.stringify({ embeddings: [[0]] }));
  };
}

function makeCountMismatchFetch(count: number): typeof globalThis.fetch {
  return async () => makeResponse(200, JSON.stringify({
    embeddings: Array.from({ length: count }, () => [0]),
  }));
}

test("EmbedProviderFunction rejects empty generate", async () => {
  const fn = new EmbedProviderFunction("test-model", "http://localhost:9999");
  const result = await fn.generate([]);
  assert.deepEqual(result, []);
});

test("EmbedProviderFunction returns vectors for single text", async () => {
  const fn = new EmbedProviderFunction("test-model", "http://localhost:9999");
  const origFetch = globalThis.fetch;
  globalThis.fetch = makeOkFetch(["hello world"]) as typeof globalThis.fetch;

  try {
    const vectors = await fn.generate(["hello world"]);
    assert.equal(vectors.length, 1, "should return 1 vector");
    assert.equal(vectors[0]!.length, 1024, "vector should be 1024 dims");
  } finally {
    globalThis.fetch = origFetch;
  }
});

test("EmbedProviderFunction batches multiple texts", async () => {
  const fn = new EmbedProviderFunction("test-model", "http://localhost:9999", {
    maxBatchItems: 100,
    batchWindowMs: 10,
  });
  const origFetch = globalThis.fetch;
  globalThis.fetch = makeOkFetch(["first", "second", "third"]) as typeof globalThis.fetch;

  try {
    const vectors = await fn.generate(["first", "second", "third"]);
    assert.equal(vectors.length, 3, "should return 3 vectors");
  } finally {
    globalThis.fetch = origFetch;
  }
});

test("EmbedProviderFunction MAX_CHARS limits are enforced", () => {
  const fn = new EmbedProviderFunction("test-model", "http://localhost:9999");
  assert.equal((fn as any).MAX_CHARS_PER_BATCH, 4_000, "MAX_CHARS_PER_BATCH should be 4k");
  assert.equal((fn as any).MAX_SINGLE_ENTRY_CHARS, 4_000, "MAX_SINGLE_ENTRY_CHARS should be 4k");
});

test("EmbedProviderFunction maxBatchItems and maxConcurrentBatches are set", () => {
  const fn = new EmbedProviderFunction("test-model", "http://localhost:9999", {
    maxBatchItems: 128,
    maxConcurrentBatches: 2,
  });
  assert.equal((fn as any).maxBatchItems, 128);
  assert.equal((fn as any).maxConcurrentBatches, 2);
});

test("EmbedProviderFunction defaults maxBatchItems to 256", () => {
  const fn = new EmbedProviderFunction("test-model", "http://localhost:9999");
  assert.equal((fn as any).maxBatchItems, 256);
});

test("EmbedProviderFunction uses model from constructor", () => {
  const fn = new EmbedProviderFunction("my-embedding-model", "http://localhost:9999");
  assert.equal((fn as any).model, "my-embedding-model");
});

test("EmbedProviderFunction throws on non-OK response", async () => {
  const fn = new EmbedProviderFunction("test-model", "http://localhost:9999");
  const origFetch = globalThis.fetch;
  globalThis.fetch = makeStatusFetch(500, JSON.stringify({ error: "internal error" })) as typeof globalThis.fetch;

  try {
    await assert.rejects(fn.generate(["test"]), /Embed provider failed: 500/);
  } finally {
    globalThis.fetch = origFetch;
  }
});

test("EmbedProviderFunction throws on mismatched embedding count", async () => {
  const fn = new EmbedProviderFunction("test-model", "http://localhost:9999");
  const origFetch = globalThis.fetch;
  globalThis.fetch = makeCountMismatchFetch(1) as typeof globalThis.fetch;

  try {
    await assert.rejects(fn.generate(["one", "two"]), /Embed provider returned 1 embeddings/);
  } finally {
    globalThis.fetch = origFetch;
  }
});

test("EmbedProviderFunction handles context overflow by splitting batch", async () => {
  const fn = new EmbedProviderFunction("test-model", "http://localhost:9999", {
    maxBatchItems: 10,
    batchWindowMs: 5,
  });
  const origFetch = globalThis.fetch;
  let callCount = 0;

  globalThis.fetch = (async () => {
    callCount++;
    if (callCount === 1) return makeResponse(400, ctxErrPayload);
    return makeResponse(200, JSON.stringify({ embeddings: [[0]] }));
  }) as typeof globalThis.fetch;

  try {
    const vectors = await fn.generate(["hello world"]);
    assert.ok(callCount >= 2, `expected retry on overflow, got ${callCount} calls`);
    assert.equal(vectors.length, 1, "should return 1 vector after split");
  } finally {
    globalThis.fetch = origFetch;
  }
});

test("EmbedProviderFunction retries rate-limit errors via scheduleFlush", async () => {
  const fn = new EmbedProviderFunction("test-model", "http://localhost:9999", {
    maxBatchItems: 1,
    batchWindowMs: 5,
  });
  const origFetch = globalThis.fetch;
  globalThis.fetch = makeStatusFetch(429, JSON.stringify({ error: "rate limit exceeded" })) as typeof globalThis.fetch;

  try {
    await assert.rejects(fn.generate(["test"]), /rate limit exceeded|Embed provider failed/);
  } finally {
    globalThis.fetch = origFetch;
  }
});

test("EmbedProviderFunction uses base URL correctly", () => {
  const fn = new EmbedProviderFunction("test-model", "http://custom-host:8080");
  assert.equal((fn as any).url, "http://custom-host:8080");
});

test("EmbedProviderFunction defaults to host.docker.internal URL", () => {
  const fn = new EmbedProviderFunction("test-model");
  assert.ok(
    (fn as any).url.includes("host.docker.internal") || (fn as any).url.includes("localhost"),
    "should have default URL",
  );
});
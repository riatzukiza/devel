/**
 * OpenPlanner Client Tests
 *
 * Tests for OpenPlanner client integration:
 * - FTS search functionality
 * - Event envelope mapping for memory.created events
 */

import ava from "ava";
import type { SourceType } from "../../types/index.js";

const test = ava.serial;

// Global mock state
let mockFetchImplementation: ((input: URL | string, options?: RequestInit) => Promise<Response>) | null = null;
let lastFetchCall: { url: string; options: Record<string, unknown> } | null = null;

// Custom fetch that tracks calls and uses mock implementation
const mockFetch = async (input: URL | string, options?: RequestInit): Promise<Response> => {
  const url = typeof input === "string" ? input : input.toString();
  lastFetchCall = { url, options: options as Record<string, unknown> };

  if (mockFetchImplementation) {
    return mockFetchImplementation(input, options);
  }

  return new Response(JSON.stringify({ results: [] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

// Override global fetch
const originalFetch = globalThis.fetch;
globalThis.fetch = mockFetch as typeof globalThis.fetch;

// Import after mocking
const { OpenPlannerClient, createDefaultOpenPlannerConfig } = await import(
  "../../openplanner/client.js"
);

test.beforeEach(() => {
  lastFetchCall = null;
  mockFetchImplementation = null;
});

test.after(() => {
  globalThis.fetch = originalFetch;
});

test("createDefaultOpenPlannerConfig returns correct defaults", (t) => {
  const config = createDefaultOpenPlannerConfig();
  t.is(config.baseUrl, "http://127.0.0.1:7777");
  t.is(config.apiKey, undefined);
});

test("createDefaultOpenPlannerConfig reads environment variables", (t) => {
  const originalUrl = process.env.OPENPLANNER_URL;
  const originalKey = process.env.OPENPLANNER_API_KEY;

  try {
    process.env.OPENPLANNER_URL = "http://test:7777";
    process.env.OPENPLANNER_API_KEY = "test-key";

    const config = createDefaultOpenPlannerConfig();
    t.is(config.baseUrl, "http://test:7777");
    t.is(config.apiKey, "test-key");
  } finally {
    process.env.OPENPLANNER_URL = originalUrl;
    process.env.OPENPLANNER_API_KEY = originalKey;
  }
});

test("OpenPlannerClient.search calls correct endpoint", async (t) => {
  const client = new OpenPlannerClient({ baseUrl: "http://test:7777" });
  mockFetchImplementation = async () => {
    return new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  await client.search("test query", { limit: 5 });

  t.truthy(lastFetchCall);
  t.true(lastFetchCall!.url.includes("/v1/search/fts"));
  const body = JSON.parse(lastFetchCall?.options.body as string);
  t.is(body.q, "test query");
});

test("OpenPlannerClient.search returns empty results when no matches", async (t) => {
  const client = new OpenPlannerClient({ baseUrl: "http://test:7777" });
  mockFetchImplementation = async () => {
    return new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const results = await client.search("nonexistent");

  t.is(results.length, 0);
});

test("OpenPlannerClient.search maps response correctly", async (t) => {
  const client = new OpenPlannerClient({ baseUrl: "http://test:7777" });
  mockFetchImplementation = async () => {
    return new Response(
      JSON.stringify({
        results: [
          {
            id: "mem-123",
            text: "Test memory content",
            score: 0.95,
            source_ref: {
              session: "conv-1",
            },
            meta: {
              cephalonId: "duck",
              timestamp: 1234567890,
              kind: "message",
              source: "discord",
            },
          },
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  };

  const results = await client.search("test", { limit: 10 });

  t.is(results.length, 1);
  t.is(results[0].id, "mem-123");
  t.is(results[0].text, "Test memory content");
  t.is(results[0].score, 0.95);
  t.is(results[0].meta?.cephalonId, "duck");
  t.is(results[0].source_ref?.session, "conv-1");
});

test("OpenPlannerClient.search uses session filter when provided", async (t) => {
  const client = new OpenPlannerClient({ baseUrl: "http://test:7777" });
  mockFetchImplementation = async () => {
    return new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  await client.search("test", { session: "conv-1" });

  const body = JSON.parse(lastFetchCall?.options.body as string);
  t.is(body.session, "conv-1");
});

test("OpenPlannerClient.search uses limit option", async (t) => {
  const client = new OpenPlannerClient({ baseUrl: "http://test:7777" });
  mockFetchImplementation = async () => {
    return new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  await client.search("test", { limit: 20 });

  const body = JSON.parse(lastFetchCall?.options.body as string);
  t.is(body.limit, 20);
});

test("OpenPlannerClient.search includes auth header when apiKey provided", async (t) => {
  const client = new OpenPlannerClient({
    baseUrl: "http://test:7777",
    apiKey: "secret-token",
  });
  mockFetchImplementation = async () => {
    return new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  await client.search("test");

  const headers = lastFetchCall?.options.headers as Record<string, string>;
  t.is(headers?.Authorization, "Bearer secret-token");
});

test("OpenPlannerClient.search throws on HTTP error", async (t) => {
  const client = new OpenPlannerClient({ baseUrl: "http://test:7777" });
  mockFetchImplementation = async () => {
    return new Response("Error", { status: 500 });
  };

  const error = await t.throwsAsync(() => client.search("test"));
  t.regex(error?.message ?? "", /OpenPlanner request failed: 500/);
});

test("OpenPlannerClient.emitMemoryCreated calls correct endpoint", async (t) => {
  const client = new OpenPlannerClient({ baseUrl: "http://test:7777" });
  mockFetchImplementation = async () => {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const memory = {
    id: "mem-123" as const,
    timestamp: Date.now(),
    cephalonId: "duck",
    sessionId: "conv-1",
    eventId: "evt-456" as const,
    role: "user" as const,
    kind: "message" as const,
    content: { text: "Hello world" },
    source: { type: "discord" as SourceType, guildId: "g-1", channelId: "c-1", authorId: "u-1" },
    retrieval: { pinned: false, lockedByAdmin: false, lockedBySystem: false, weightKind: 1, weightSource: 1 },
    usage: { includedCountTotal: 0, includedCountDecay: 0, lastIncludedAt: Date.now() },
    embedding: { status: "ready" as const, vectorId: "vec-1", model: "test-model", dims: 384, embeddedAt: Date.now(), vector: [0.1, 0.2, 0.3] },
    lifecycle: { deleted: false },
    hashes: { contentHash: "abc123" },
    schemaVersion: 1,
  };

  await client.emitMemoryCreated(memory);

  t.truthy(lastFetchCall);
  const body = JSON.parse(lastFetchCall?.options.body as string);
  t.true(Array.isArray(body.events));
  t.is(body.events.length, 1);
  const event = body.events[0];

  // Verify event envelope structure
  t.is(event.schema, "openplanner.event.v1");
  t.is(event.kind, "memory.created");
  t.is(event.source, "cephalon-ts");
  t.is(event.source_ref.session, "conv-1");
  t.is(event.source_ref.memory, "mem-123");
  t.is(event.source_ref.event, "evt-456");
  t.is(event.meta.cephalon_id, "duck");
  t.is(event.meta.memory_kind, "message");
  t.is(event.meta.schema_version, 1);
});

test("OpenPlannerClient.emitMemoryCreated throws on HTTP error", async (t) => {
  const client = new OpenPlannerClient({ baseUrl: "http://test:7777" });
  mockFetchImplementation = async () => {
    return new Response("Error", { status: 500 });
  };

  const memory = {
    id: "mem-123" as const,
    timestamp: Date.now(),
    cephalonId: "duck",
    sessionId: "conv-1",
    eventId: null,
    role: "user" as const,
    kind: "message" as const,
    content: { text: "Hello world" },
    source: { type: "discord" as SourceType },
    retrieval: { pinned: false, lockedByAdmin: false, lockedBySystem: false, weightKind: 1, weightSource: 1 },
    usage: { includedCountTotal: 0, includedCountDecay: 0, lastIncludedAt: Date.now() },
    embedding: { status: "none" as const },
    lifecycle: { deleted: false },
    hashes: { contentHash: "abc123" },
    schemaVersion: 1,
  };

  const error = await t.throwsAsync(() => client.emitMemoryCreated(memory));
  t.regex(error?.message ?? "", /OpenPlanner request failed: 500/);
});

test("OpenPlannerClient.emitMemoryCreated throws on network error", async (t) => {
  const client = new OpenPlannerClient({ baseUrl: "http://test:7777" });
  mockFetchImplementation = async () => {
    throw new Error("Network error");
  };

  const memory = {
    id: "mem-123" as const,
    timestamp: Date.now(),
    cephalonId: "duck",
    sessionId: "conv-1",
    eventId: null,
    role: "user" as const,
    kind: "message" as const,
    content: { text: "Hello world" },
    source: { type: "discord" as SourceType },
    retrieval: { pinned: false, lockedByAdmin: false, lockedBySystem: false, weightKind: 1, weightSource: 1 },
    usage: { includedCountTotal: 0, includedCountDecay: 0, lastIncludedAt: Date.now() },
    embedding: { status: "none" as const },
    lifecycle: { deleted: false },
    hashes: { contentHash: "abc123" },
    schemaVersion: 1,
  };

  const error = await t.throwsAsync(() => client.emitMemoryCreated(memory));
  t.regex(error?.message ?? "", /Network error/);
});

test("OpenPlannerClient.isAvailable returns true on success", async (t) => {
  const client = new OpenPlannerClient({ baseUrl: "http://test:7777" });
  mockFetchImplementation = async () => {
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const available = await client.isAvailable();
  t.true(available);
});

test("OpenPlannerClient.isAvailable returns false on error", async (t) => {
  const client = new OpenPlannerClient({ baseUrl: "http://test:7777" });
  mockFetchImplementation = async () => {
    throw new Error("Connection refused");
  };

  const available = await client.isAvailable();
  t.false(available);
});

test("OpenPlannerClient emits correct extra fields in event envelope", async (t) => {
  const client = new OpenPlannerClient({ baseUrl: "http://test:7777" });
  mockFetchImplementation = async () => {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const memory = {
    id: "mem-123" as const,
    timestamp: 1234567890,
    cephalonId: "duck",
    sessionId: "conv-1",
    eventId: "evt-456" as const,
    role: "user" as const,
    kind: "message" as const,
    content: { text: "Test message", normalizedText: "normalized test" },
    source: { type: "discord" as SourceType, guildId: "g-1", channelId: "c-1", authorId: "u-1", authorIsBot: false },
    retrieval: { pinned: true, lockedByAdmin: false, lockedBySystem: false, weightKind: 1.5, weightSource: 1.2 },
    usage: { includedCountTotal: 10, includedCountDecay: 5.5, lastIncludedAt: 1234567880 },
    embedding: { status: "ready" as const, vectorId: "vec-1", model: "test-model", dims: 384, embeddedAt: 1234567895, vector: [0.1, 0.2, 0.3] },
    lifecycle: { deleted: false },
    hashes: { contentHash: "abc123", normalizedHash: "def456" },
    schemaVersion: 1,
  };

  await client.emitMemoryCreated(memory);

  const body = JSON.parse(lastFetchCall?.options.body as string);
  const event = body.events[0];

  t.is(event.extra.content_text, "Test message");
  t.is(event.extra.normalized_text, "normalized test");
  t.is(event.extra.source_type, "discord");
  t.is(event.extra.source_guild_id, "g-1");
  t.is(event.extra.source_channel_id, "c-1");
  t.is(event.extra.source_author_id, "u-1");
  t.is(event.extra.source_author_is_bot, false);
  t.is(event.extra.role, "user");
  t.is(event.extra.embedding_status, "ready");
  t.is(event.extra.retrieval_pinned, true);
  t.is(event.extra.timestamp, 1234567890);
});

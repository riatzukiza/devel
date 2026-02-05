import test from "ava";
import {
  indexEvents,
  messageToEvent,
  openPlannerEnv,
  searchFts,
  formatSearchResults,
} from "./openplanner-client.js";
import type { EventEnvelopeV1, FtsSearchResult } from "./openplanner-client.js";

// ============================================================================
// Mock fetch helper
// ============================================================================

let mockFetch: typeof fetch | null = null;

async function mockedFetch(input: URL | RequestInfo, init?: RequestInit): Promise<Response> {
  if (!mockFetch) {
    throw new Error("No mock fetch set for this test");
  }
  return mockFetch(input, init);
}

// ============================================================================
// openPlannerEnv tests
// ============================================================================

test("openPlannerEnv returns defaults when env vars not set", (t) => {
  delete process.env.OPENPLANNER_URL;
  delete process.env.OPENPLANNER_API_KEY;

  const env = openPlannerEnv();
  t.is(env.OPENPLANNER_URL, "http://localhost:7777");
  t.is(env.OPENPLANNER_API_KEY, undefined);
});

test("openPlannerEnv reads env vars when set", (t) => {
  process.env.OPENPLANNER_URL = "http://custom:9999";
  process.env.OPENPLANNER_API_KEY = "test-key-123";

  const env = openPlannerEnv();
  t.is(env.OPENPLANNER_URL, "http://custom:9999");
  t.is(env.OPENPLANNER_API_KEY, "test-key-123");

  delete process.env.OPENPLANNER_URL;
  delete process.env.OPENPLANNER_API_KEY;
});

// ============================================================================
// messageToEvent tests
// ============================================================================

test("messageToEvent creates valid EventEnvelopeV1", (t) => {
  const event = messageToEvent({
    sessionId: "ses_abc123",
    messageId: "msg_456",
    messageIndex: 3,
    text: "[user] hello world",
    createdAt: 1704067200000,
    role: "user",
    sessionTitle: "Test Session",
    paths: ["src/index.ts", "lib/utils.ts"],
  });

  t.is(event.schema, "openplanner.event.v1");
  t.is(event.source, "opencode-sessions");
  t.is(event.kind, "message");
  t.is(event.source_ref?.session, "ses_abc123");
  t.is(event.source_ref?.message, "msg_456");
  t.is(event.text, "[user] hello world");
  t.is(event.meta?.message_id, "msg_456");
  t.is(event.meta?.message_index, 3);
  t.is(event.meta?.role, "user");
  t.is(event.meta?.session_title, "Test Session");
  t.is((event.meta?.paths as string), "src/index.ts|lib/utils.ts");
  t.truthy(event.id);
  t.truthy(event.ts);
});

test("messageToEvent handles optional fields", (t) => {
  const event = messageToEvent({
    sessionId: "ses_x",
    messageId: "msg_y",
    messageIndex: 0,
    text: "simple message",
    createdAt: 1234567890000,
    role: "assistant",
  });

  t.is(event.schema, "openplanner.event.v1");
  t.is(event.text, "simple message");
  t.is(event.meta?.session_title, undefined);
  t.is(event.meta?.paths, undefined);
});

// ============================================================================
// indexEvents tests
// ============================================================================

test("indexEvents posts events successfully (200)", async (t) => {
  const events: EventEnvelopeV1[] = [
    {
      schema: "openplanner.event.v1",
      id: "test-id-1",
      ts: new Date().toISOString(),
      source: "test",
      kind: "message",
      text: "test content",
    },
  ];

  let capturedUrl = "";
  let capturedBody: any = null;
  let capturedHeaders: Record<string, string> = {};

  mockFetch = async (url: URL | RequestInfo, init?: RequestInit): Promise<Response> => {
    capturedUrl = url.toString();
    if (init?.body) {
      capturedBody = JSON.parse(init.body as string);
    }
    if (init?.headers) {
      const headers = init.headers as Record<string, string>;
      capturedHeaders = { ...headers };
    }
    return new Response("{}", { status: 200 }); // Return empty JSON object
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = mockedFetch;

  await indexEvents(events);

  t.is(capturedUrl, "http://localhost:7777/v1/events");
  t.deepEqual(capturedBody, { events });
  t.is(capturedHeaders["Content-Type"], "application/json");
  t.is(capturedHeaders["Authorization"], undefined as unknown as string); // No API key set

  // Cleanup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = undefined;
  mockFetch = null;
});

test("indexEvents includes Bearer token when API key set", async (t) => {
  process.env.OPENPLANNER_API_KEY = "secret-token";

  let capturedHeaders: Record<string, string> = {};

  mockFetch = async (_url: URL | RequestInfo, init?: RequestInit): Promise<Response> => {
    if (init?.headers) {
      const headers = init.headers as Record<string, string>;
      capturedHeaders = { ...headers };
    }
    return new Response("{}", { status: 200 }); // Return empty JSON object
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = mockedFetch;

  await indexEvents([{
    schema: "openplanner.event.v1",
    id: "id1",
    ts: new Date().toISOString(),
    source: "test",
    kind: "message",
  }]);

  t.is(capturedHeaders["Authorization"], "Bearer secret-token");

  // Cleanup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = undefined;
  mockFetch = null;
  delete process.env.OPENPLANNER_API_KEY;
});

test("indexEvents throws on 401", async (t) => {
  mockFetch = async (): Promise<Response> => {
    return new Response("Unauthorized", { status: 401 });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = mockedFetch;

  await t.throwsAsync(
    () => indexEvents([{
      schema: "openplanner.event.v1",
      id: "id1",
      ts: new Date().toISOString(),
      source: "test",
      kind: "message",
    }]),
    { message: /401/ }
  );

  // Cleanup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = undefined;
  mockFetch = null;
});

test("indexEvents throws on 500", async (t) => {
  mockFetch = async (): Promise<Response> => {
    return new Response("Internal Server Error", { status: 500 });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = mockedFetch;

  await t.throwsAsync(
    () => indexEvents([{
      schema: "openplanner.event.v1",
      id: "id1",
      ts: new Date().toISOString(),
      source: "test",
      kind: "message",
    }]),
    { message: /500/ }
  );

  // Cleanup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = undefined;
  mockFetch = null;
});

// ============================================================================
// searchFts tests
// ============================================================================

test("searchFts returns results successfully", async (t) => {
  const mockResults: FtsSearchResult[] = [
    {
      id: "result-1",
      score: 0.95,
      text: "matched text",
      source: "test-source",
      kind: "message",
      ts: "2024-01-01T00:00:00Z",
      source_ref: { session: "ses_1", message: "msg_1" },
    },
  ];

  mockFetch = async (url: URL | RequestInfo): Promise<Response> => {
    const parsedUrl = new URL(url.toString());
    t.is(parsedUrl.pathname, "/v1/search/fts");

    return new Response(JSON.stringify({ results: mockResults }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = mockedFetch;

  const results = await searchFts("test query");

  t.is(results.length, 1);
  t.is(results[0].id, "result-1");
  t.is(results[0].score, 0.95);
  t.is(results[0].source_ref?.session, "ses_1");

  // Cleanup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = undefined;
  mockFetch = null;
});

test("searchFts passes options correctly", async (t) => {
  let capturedBody: any = null;

  mockFetch = async (_url: URL | RequestInfo, init?: RequestInit): Promise<Response> => {
    if (init?.body) {
      capturedBody = JSON.parse(init.body as string);
    }
    return new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = mockedFetch;

  await searchFts("query", { limit: 5, session: "ses_filter" });

  t.is(capturedBody.q, "query");
  t.is(capturedBody.limit, 5);
  t.is(capturedBody.session, "ses_filter");

  // Cleanup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = undefined;
  mockFetch = null;
});

test("searchFts throws on 401", async (t) => {
  mockFetch = async (): Promise<Response> => {
    return new Response("Unauthorized", { status: 401 });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = mockedFetch;

  await t.throwsAsync(
    () => searchFts("test"),
    { message: /401/ }
  );

  // Cleanup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = undefined;
  mockFetch = null;
});

test("searchFts throws on 500", async (t) => {
  mockFetch = async (): Promise<Response> => {
    return new Response("Internal Server Error", { status: 500 });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = mockedFetch;

  await t.throwsAsync(
    () => searchFts("test"),
    { message: /500/ }
  );

  // Cleanup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = undefined;
  mockFetch = null;
});

// ============================================================================
// formatSearchResults tests
// ============================================================================

test("formatSearchResults returns no matches for empty results", (t) => {
  const output = formatSearchResults([]);
  t.is(output, "No matches found.");
});

test("formatSearchResults formats single result", (t) => {
  const results: FtsSearchResult[] = [
    {
      id: "res-1",
      score: 0.85,
      text: "test content",
      source: "test-source",
      source_ref: { session: "ses_123", message: "msg_456" },
    },
  ];

  const output = formatSearchResults(results);

  t.true(output.includes("Found 1 results:"));
  t.true(output.includes("session_id: ses_123"));
  t.true(output.includes("ID: res-1"));
  t.true(output.includes("Score: 0.8500"));
  t.true(output.includes("Message: msg_456"));
});

test("formatSearchResults groups by session", (t) => {
  const results: FtsSearchResult[] = [
    { id: "res-1", score: 0.9, source_ref: { session: "ses_a" } },
    { id: "res-2", score: 0.8, source_ref: { session: "ses_a" } },
    { id: "res-3", score: 0.7, source_ref: { session: "ses_b" } },
  ];

  const output = formatSearchResults(results);

  t.true(output.includes("session_id: ses_a (hits: 2)"));
  t.true(output.includes("session_id: ses_b (hits: 1)"));
});

test("formatSearchResults includes metadata", (t) => {
  const results: FtsSearchResult[] = [
    {
      id: "res-1",
      score: 0.9,
      text: "content",
      meta: {
        role: "assistant",
        session_title: "My Session",
        paths: "src/a.ts|src/b.ts",
      },
      source_ref: { session: "ses_x" },
    },
  ];

  const output = formatSearchResults(results);

  t.true(output.includes("Role: assistant"));
  t.true(output.includes("Session Title: My Session"));
  t.true(output.includes("Paths: src/a.ts, src/b.ts"));
});

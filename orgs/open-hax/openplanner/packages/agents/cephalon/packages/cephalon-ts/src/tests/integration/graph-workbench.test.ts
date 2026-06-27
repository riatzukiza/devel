import ava from "ava";

const test = ava.serial;

let mockFetchImplementation: ((input: URL | string, options?: RequestInit) => Promise<Response>) | null = null;
let lastFetchCall: { url: string; options: Record<string, unknown> } | null = null;

const mockFetch = async (input: URL | string, options?: RequestInit): Promise<Response> => {
  lastFetchCall = {
    url: typeof input === "string" ? input : input.toString(),
    options: options as Record<string, unknown>,
  };

  if (mockFetchImplementation) {
    return mockFetchImplementation(input, options);
  }

  return new Response(JSON.stringify({ data: {} }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

const originalFetch = globalThis.fetch;
globalThis.fetch = mockFetch as typeof globalThis.fetch;

const { GraphWeaverWorkbenchClient } = await import("../../graph-workbench/client.js");

test.beforeEach(() => {
  mockFetchImplementation = null;
  lastFetchCall = null;
});

test.after(() => {
  globalThis.fetch = originalFetch;
});

test("GraphWeaverWorkbenchClient.searchNodes posts GraphQL query and normalizes nodes", async (t) => {
  const client = new GraphWeaverWorkbenchClient({ baseUrl: "http://test:8796" });
  mockFetchImplementation = async () => new Response(JSON.stringify({
    data: {
      searchNodes: [
        {
          id: "web:url:https://example.com",
          kind: "url",
          label: "example.com",
          external: true,
          loadedByDefault: true,
          layer: "local",
          dataJson: JSON.stringify({ lake: "web", node_type: "visited" }),
        },
      ],
    },
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  const result = await client.searchNodes("example", 5);

  t.is(lastFetchCall?.url, "http://test:8796/graphql");
  t.is(result[0]?.id, "web:url:https://example.com");
  t.is(result[0]?.data?.lake, "web");
  const body = JSON.parse(String(lastFetchCall?.options.body));
  t.true(String(body.query).includes("searchNodes"));
  t.is(body.variables.query, "example");
  t.is(body.variables.limit, 5);
});

test("GraphWeaverWorkbenchClient.nodePreview returns preview payload", async (t) => {
  const client = new GraphWeaverWorkbenchClient({
    baseUrl: "http://test:8796",
    adminToken: "fixture-admin-token",
  });
  mockFetchImplementation = async () => new Response(JSON.stringify({
    data: {
      nodePreview: {
        id: "web:url:https://example.com",
        kind: "url",
        format: "markdown",
        contentType: "text/markdown",
        language: null,
        body: "# Example\n\nPreview body",
        truncated: false,
        bytes: 24,
        status: 200,
        error: null,
      },
    },
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  const preview = await client.nodePreview("web:url:https://example.com", 512);

  t.is(preview?.format, "markdown");
  t.regex(preview?.body ?? "", /Preview body/);
  const headers = lastFetchCall?.options.headers as Record<string, string>;
  t.is(headers.Authorization, "Bearer fixture-admin-token");
});
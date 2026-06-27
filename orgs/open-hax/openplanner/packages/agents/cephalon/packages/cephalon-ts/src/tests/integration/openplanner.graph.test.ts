import ava from "ava";

const test = ava.serial;

let mockFetchImplementation: ((input: URL | string, options?: RequestInit) => Promise<Response>) | null = null;
let lastFetchCall: { url: string; options: Record<string, unknown> } | null = null;
let fetchCalls: Array<{ url: string; options: Record<string, unknown> }> = [];

const mockFetch = async (input: URL | string, options?: RequestInit): Promise<Response> => {
  const url = typeof input === "string" ? input : input.toString();
  const tracked = { url, options: options as Record<string, unknown> };
  lastFetchCall = tracked;
  fetchCalls.push(tracked);

  if (mockFetchImplementation) {
    return mockFetchImplementation(input, options);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

const originalFetch = globalThis.fetch;
globalThis.fetch = mockFetch as typeof globalThis.fetch;

const { OpenPlannerGraphQueryClient } = await import("../../openplanner/graph-client.js");

test.beforeEach(() => {
  lastFetchCall = null;
  fetchCalls = [];
  mockFetchImplementation = null;
});

test.after(() => {
  globalThis.fetch = originalFetch;
});

test("OpenPlannerGraphQueryClient.status returns normalized graph status", async (t) => {
  const client = new OpenPlannerGraphQueryClient({ baseUrl: "http://test:7777" });
  mockFetchImplementation = async () => new Response(JSON.stringify({
    nodeCount: 12,
    edgeCount: 34,
    storageBackend: "mongodb",
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  const result = await client.status();

  t.deepEqual(result, {
    ok: true,
    source: "openplanner",
    storageBackend: "mongodb",
    nodeCount: 12,
    edgeCount: 34,
  });
  t.true(fetchCalls.some((call) => call.url.includes("/v1/graph/stats")));
});

test("OpenPlannerGraphQueryClient.search calls graph/query and normalizes nodes and edges", async (t) => {
  const client = new OpenPlannerGraphQueryClient({
    baseUrl: "http://test:7777",
    apiKey: "fixture-openplanner-auth-token",
  });
  mockFetchImplementation = async () => new Response(JSON.stringify({
    ok: true,
    storageBackend: "mongodb",
    query: "federation",
    projects: ["web"],
    nodeTypes: ["visited"],
    edgeTypes: ["visited_to_unvisited"],
    nodes: [
      {
        id: "web:url:https://example.com/a",
        kind: "url",
        label: "example.com/a",
        lake: "web",
        nodeType: "visited",
        data: { url: "https://example.com/a" },
      },
    ],
    edges: [
      {
        id: "edge-1",
        source: "web:url:https://example.com/a",
        target: "web:url:https://example.com/b",
        kind: "graph.edge",
        lake: "web",
        edgeType: "visited_to_unvisited",
        sourceLake: "web",
        targetLake: "web",
        data: { source: "https://example.com/a", target: "https://example.com/b" },
      },
    ],
    counts: { nodes: 1, edges: 1 },
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  const result = await client.search("federation", {
    projects: ["web"],
    nodeTypes: ["visited"],
    edgeTypes: ["visited_to_unvisited"],
    limit: 5,
    edgeLimit: 7,
  });

  t.is(result.nodes[0]?.id, "web:url:https://example.com/a");
  t.is(result.edges[0]?.edgeType, "visited_to_unvisited");
  t.is(result.projects[0], "web");
  t.is(result.counts.edges, 1);
  t.regex(lastFetchCall?.url ?? "", /projects=web/);
  t.regex(lastFetchCall?.url ?? "", /nodeTypes=visited/);
  t.regex(lastFetchCall?.url ?? "", /edgeTypes=visited_to_unvisited/);
  const headers = lastFetchCall?.options.headers as Record<string, string>;
  t.is(headers?.Authorization, "Bearer fixture-openplanner-auth-token");
});

test("OpenPlannerGraphQueryClient.node uses graph/nodes for URL lookup", async (t) => {
  const client = new OpenPlannerGraphQueryClient({ baseUrl: "http://test:7777" });
  mockFetchImplementation = async () => new Response(JSON.stringify({
    node: {
      id: "evt-123",
      project: "web",
      extra: {
        node_id: "web:url:https://example.com/article",
        node_kind: "url",
        node_type: "visited",
        lake: "web",
        label: "Example Article",
        url: "https://example.com/article",
      },
    },
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  const result = await client.node("https://example.com/article");

  t.is(result.node?.id, "web:url:https://example.com/article");
  t.is(result.node?.label, "Example Article");
  t.is(result.node?.nodeType, "visited");
  t.regex(lastFetchCall?.url ?? "", /\/v1\/graph\/nodes\?url=/);
});

test("OpenPlannerGraphQueryClient.neighbors falls back to raw graph/edges and synthesizes nodes", async (t) => {
  const client = new OpenPlannerGraphQueryClient({ baseUrl: "http://test:7777" });
  mockFetchImplementation = async (input) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/v1/graph/query")) {
      return new Response(JSON.stringify({
        ok: true,
        query: "https://example.com/article",
        nodes: [],
        edges: [],
        counts: { nodes: 0, edges: 0 },
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.includes("/v1/graph/nodes")) {
      return new Response(JSON.stringify({
        node: {
          id: "evt-node",
          project: "web",
          extra: {
            node_id: "web:url:https://example.com/article",
            node_kind: "url",
            node_type: "visited",
            lake: "web",
            label: "Example Article",
            url: "https://example.com/article",
          },
        },
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({
      edges: [
        {
          id: "evt-edge",
          project: "web",
          extra: {
            edge_id: "edge-1",
            edge_type: "visited_to_unvisited",
            source_node_id: "web:url:https://example.com/article",
            target_node_id: "web:url:https://example.com/related",
            source_lake: "web",
            target_lake: "web",
            source: "https://example.com/article",
            target: "https://example.com/related",
          },
        },
      ],
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const result = await client.neighbors("https://example.com/article", { limit: 10 });

  t.is(result.anchor?.id, "web:url:https://example.com/article");
  t.is(result.edges.length, 1);
  t.true(result.nodes.some((node) => node.id === "web:url:https://example.com/related"));
});

test("OpenPlannerGraphQueryClient.exportSlice calls graph/export and normalizes slice", async (t) => {
  const client = new OpenPlannerGraphQueryClient({ baseUrl: "http://test:7777" });
  mockFetchImplementation = async () => new Response(JSON.stringify({
    ok: true,
    storageBackend: "mongodb",
    projects: ["devel", "web"],
    nodes: [
      {
        id: "devel:file:/tmp/demo.md",
        kind: "file",
        label: "demo.md",
        lake: "devel",
        nodeType: "node",
        data: { path: "/tmp/demo.md" },
      },
    ],
    edges: [],
    counts: { nodes: 1, edges: 0 },
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  const result = await client.exportSlice({ projects: ["devel", "web"] });

  t.is(result.projects.length, 2);
  t.is(result.nodes[0]?.label, "demo.md");
  t.regex(lastFetchCall?.url ?? "", /\/v1\/graph\/export\?projects=devel%2Cweb/);
});
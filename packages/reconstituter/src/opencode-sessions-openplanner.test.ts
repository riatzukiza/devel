import test from "ava";
import { indexSessions, searchSessions } from "./opencode-sessions.js";

// Mock fetch
let mockFetch: any = null;
const originalFetch = global.fetch;

test.before(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.fetch = async (input: any, init: any) => {
    if (mockFetch) return mockFetch(input, init);
    return originalFetch(input, init);
  };
});

test.after.always(() => {
  global.fetch = originalFetch;
});

test.serial("indexSessions posts events to OpenPlanner", async (t) => {
  const capturedRequests: any[] = [];
  
  mockFetch = async (url: any, init: any) => {
    const urlStr = typeof url === "string" ? url : (url.url || url.toString());
    console.log(`Mock fetch called for: ${urlStr}`);
    capturedRequests.push({ url: urlStr, init });
    
    if (urlStr.includes("/session/list") || urlStr.endsWith("/session")) {
      return new Response(JSON.stringify({ data: [{ id: "ses_1", title: "Test Session" }] }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    if (urlStr.includes("/message")) {
      return new Response(JSON.stringify({ data: [
        { info: { id: "msg_1", createdAt: Date.now() }, parts: [{ type: "text", text: "hello" }] }
      ] }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    if (urlStr.includes("/v1/events")) {
      return new Response(JSON.stringify({}), { status: 200 });
    }
    return new Response("Not Found", { status: 404 });
  };

  // Set env vars to avoid Chroma/Ollama errors during refactor
  process.env.OPENPLANNER_URL = "http://localhost:7777";
  process.env.LEVEL_DIR = `./.reconstitute/test-${Date.now()}`;

  await indexSessions();

  const eventRequest = capturedRequests.find(r => r.url.includes("/v1/events"));
  t.truthy(eventRequest, "Should have called OpenPlanner /v1/events");
  const body = JSON.parse(eventRequest.init.body);
  t.is(body.events.length, 1);
  t.is(body.events[0].source_ref.session, "ses_1");
  t.is(body.events[0].text, "[assistant] hello");
});

test.serial("indexSessions throws on OpenPlanner 401", async (t) => {
  mockFetch = async (url: any) => {
    const urlStr = typeof url === "string" ? url : (url.url || url.toString());
    if (urlStr.includes("/session/list") || urlStr.endsWith("/session")) {
      return new Response(JSON.stringify({ data: [{ id: "ses_1" }] }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    if (urlStr.includes("/message")) {
      return new Response(JSON.stringify({ data: [{ info: { id: "m1" }, parts: [{ type: "text", text: "x" }] }] }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    if (urlStr.includes("/v1/events")) {
      return new Response("Unauthorized", { status: 401 });
    }
    return new Response("Not Found", { status: 404 });
  };

  process.env.LEVEL_DIR = `./.reconstitute/test-401-${Date.now()}`;
  await t.throwsAsync(() => indexSessions(), { message: /401/ });
});

test.serial("searchSessions uses OpenPlanner FTS", async (t) => {
  const capturedRequests: any[] = [];
  
  mockFetch = async (url: any, init: any) => {
    const urlStr = typeof url === "string" ? url : (url.url || url.toString());
    capturedRequests.push({ url: urlStr, init });
    
    if (urlStr.includes("/v1/search/fts")) {
      return new Response(JSON.stringify({ 
        results: [
          { id: "res_1", score: 0.9, text: "matched", source_ref: { session: "ses_1" } }
        ] 
      }), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response("Not Found", { status: 404 });
  };

  await searchSessions({ query: "test query", k: 5 });

  const searchRequest = capturedRequests.find(r => r.url.includes("/v1/search/fts"));
  t.truthy(searchRequest, "Should have called OpenPlanner /v1/search/fts");
  const body = JSON.parse(searchRequest.init.body);
  t.is(body.q, "test query");
  t.is(body.limit, 5);
});

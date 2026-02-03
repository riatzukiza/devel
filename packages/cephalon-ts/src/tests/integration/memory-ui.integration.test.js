import test from "ava";

const BASE_URL = process.env.MEMORY_UI_BASE_URL || "http://127.0.0.1:3000";
const REQUEST_TIMEOUT_MS = 5000;

const fetchJson = async (path, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        ...(options.headers || {}),
      },
    });

    const text = await response.text();
    const body = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const error = body && body.error ? body.error : text || response.statusText;
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return body;
  } finally {
    clearTimeout(timeout);
  }
};

test("Memory UI: store count endpoint responds", async (t) => {
  const body = await fetchJson("/api/memories/store/count");
  t.truthy(body);
  t.is(typeof body.count, "number");
  t.true(body.count >= 0);
});

test("Memory UI: store info endpoint responds", async (t) => {
  const body = await fetchJson("/api/memories/store/info");
  t.truthy(body);
  t.is(typeof body.totalCount, "number");
  t.is(typeof body.deletedCount, "number");
  t.is(typeof body.activeCount, "number");
  t.is(body.activeCount, body.totalCount - body.deletedCount);
});

test("Memory UI: query endpoint returns list", async (t) => {
  const body = await fetchJson("/api/memories/query", {
    method: "POST",
    body: JSON.stringify({ limit: 5 }),
  });

  t.truthy(body);
  t.true(Array.isArray(body.memories));
  t.is(typeof body.total, "number");
  t.is(typeof body.offset, "number");
  t.is(typeof body.limit, "number");
  t.true(body.memories.length <= body.limit);
  t.true(body.total >= body.memories.length);
});

test("Memory UI: context endpoint returns summary", async (t) => {
  const body = await fetchJson("/api/memories/context");

  t.truthy(body);
  t.true(Array.isArray(body.recent));
  t.true(Array.isArray(body.pinned));
  t.is(typeof body.sessionCount, "number");
  t.is(typeof body.totalCount, "number");
});

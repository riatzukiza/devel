import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";

import { createApp } from "../main.js";

function parseSseData(text: string): any {
  const match = text.match(/data: (.+)/);
  if (!match || !match[1]) {
    throw new Error("missing SSE data payload");
  }
  return JSON.parse(match[1]);
}

test("mcp-files health endpoint responds", async () => {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to determine test server port");
  }

  try {
    const res = await fetch(`http://127.0.0.1:${address.port}/health`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true, service: "mcp-files" });
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("mcp-files MCP endpoint exposes legacy files_* aliases", async () => {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to determine test server port");
  }

  const baseUrl = `http://127.0.0.1:${address.port}/mcp`;

  try {
    const initRes = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "initialize",
        id: 1,
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      }),
    });

    assert.equal(initRes.status, 200);
    const sessionId = initRes.headers.get("mcp-session-id");
    assert.ok(sessionId);

    const listRes = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "mcp-session-id": sessionId as string,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/list",
        id: 2,
        params: {},
      }),
    });

    assert.equal(listRes.status, 200);
    const data = parseSseData(await listRes.text());
    const toolNames = (data.result.tools as Array<{ name: string }>).map((tool) => tool.name);
    assert.ok(toolNames.includes("fs_list"));
    assert.ok(toolNames.includes("files_list_directory"));
    assert.ok(toolNames.includes("files_view_file"));
    assert.ok(toolNames.includes("files_write_content"));
    assert.ok(toolNames.includes("files_write_lines"));
    assert.ok(toolNames.includes("files_tree_directory"));
    assert.ok(toolNames.includes("files_search"));
  } finally {
    server.close();
    await once(server, "close");
  }
});

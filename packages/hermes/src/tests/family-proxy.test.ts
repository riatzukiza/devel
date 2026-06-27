import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";

import express from "express";

import { createFamilyProxyApp } from "../index.js";

test("family proxy health endpoint responds", async () => {
  const app = createFamilyProxyApp({
    serviceName: "mcp-test",
    legacyMcpUrl: "http://127.0.0.1:65534",
    allowedTools: ["allowed_tool"],
    allowUnauthLocal: true,
    sharedSecret: "",
  });

  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to determine test server port");
  }

  try {
    const res = await fetch(`http://127.0.0.1:${address.port}/health`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true, service: "mcp-test" });
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("family proxy filters tools/list output and blocks disallowed tools/call", async () => {
  let callCount = 0;
  const legacy = express();
  legacy.use(express.json());
  legacy.post("/mcp", (req: any, res: any) => {
    const method = (req.body as { method?: string })?.method;
    if (method === "tools/list") {
      res.json({
        jsonrpc: "2.0",
        id: (req.body as { id?: unknown })?.id ?? null,
        result: {
          tools: [
            { name: "allowed_tool", description: "ok" },
            { name: "blocked_tool", description: "no" },
          ],
        },
      });
      return;
    }

    callCount += 1;
    res.json({ jsonrpc: "2.0", id: (req.body as { id?: unknown })?.id ?? null, result: { ok: true } });
  });

  const legacyServer = legacy.listen(0, "127.0.0.1");
  await once(legacyServer, "listening");
  const legacyAddress = legacyServer.address();
  if (!legacyAddress || typeof legacyAddress === "string") {
    throw new Error("failed to determine legacy server port");
  }

  const app = createFamilyProxyApp({
    serviceName: "mcp-test",
    legacyMcpUrl: `http://127.0.0.1:${legacyAddress.port}`,
    allowedTools: ["allowed_tool"],
    allowUnauthLocal: true,
    sharedSecret: "",
  });
  const proxyServer = app.listen(0, "127.0.0.1");
  await once(proxyServer, "listening");
  const proxyAddress = proxyServer.address();
  if (!proxyAddress || typeof proxyAddress === "string") {
    throw new Error("failed to determine proxy server port");
  }

  try {
    const listRes = await fetch(`http://127.0.0.1:${proxyAddress.port}/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
    });
    assert.equal(listRes.status, 200);
    const listPayload = await listRes.json() as { result?: { tools?: Array<{ name: string }> } };
    const toolNames = (listPayload.result?.tools ?? []).map((tool) => tool.name);
    assert.deepEqual(toolNames, ["allowed_tool"]);

    const deniedRes = await fetch(`http://127.0.0.1:${proxyAddress.port}/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: "blocked_tool", arguments: {} },
      }),
    });
    assert.equal(deniedRes.status, 200);
    const deniedPayload = await deniedRes.json() as { error?: { code?: number } };
    assert.equal(deniedPayload.error?.code, -32601);
    assert.equal(callCount, 0);
  } finally {
    proxyServer.close();
    await once(proxyServer, "close");
    legacyServer.close();
    await once(legacyServer, "close");
  }
});

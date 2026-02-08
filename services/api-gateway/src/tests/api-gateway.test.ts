import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import Fastify from "fastify";

import { createApp } from "../app.js";

void test("health endpoint responds", async () => {
  const app = await createApp({
    host: "127.0.0.1",
    port: 0,
    openplannerUrl: "http://127.0.0.1:7777",
    openplannerApiKey: null,
    opencodeUrl: "http://127.0.0.1:4096",
    opencodeApiKey: null,
    workspaceRoot: "/tmp",
    mcpUrl: "http://127.0.0.1:3001",
    oauthEnabled: false,
    oauthIssuer: "http://localhost:3001",
    oauthAudience: "api-gateway",
    allowedHosts: ["localhost", "127.0.0.1"]
  });

  try {
    const res = await app.inject({ method: "GET", url: "/health" });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.json(), { ok: true, service: "api-gateway" });
  } finally {
    await app.close();
  }
});

void test("forwards openplanner request through facade route", async () => {
  const upstream = Fastify();
  upstream.get("/v1/sessions", async () => ({ ok: true, rows: [{ session: "duck" }] }));
  await upstream.listen({ host: "127.0.0.1", port: 0 });

  const address = upstream.server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to determine upstream port");
  }

  const app = await createApp({
    host: "127.0.0.1",
    port: 0,
    openplannerUrl: `http://127.0.0.1:${address.port}`,
    openplannerApiKey: null,
    opencodeUrl: "http://127.0.0.1:4096",
    opencodeApiKey: null,
    workspaceRoot: "/tmp",
    mcpUrl: "http://127.0.0.1:3001",
    oauthEnabled: false,
    oauthIssuer: "http://localhost:3001",
    oauthAudience: "api-gateway",
    allowedHosts: ["localhost", "127.0.0.1"]
  });

  try {
    const res = await app.inject({ method: "GET", url: "/api/openplanner/v1/sessions" });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.ok, true);
    assert.equal(body.rows[0]?.session, "duck");
  } finally {
    await app.close();
    await upstream.close();
  }
});

void test("forwards opencode request through facade route", async () => {
  const upstream = Fastify();
  upstream.get("/config", async () => ({ ok: true, models: ["gpt-5"] }));
  await upstream.listen({ host: "127.0.0.1", port: 0 });

  const address = upstream.server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to determine upstream port");
  }

  const app = await createApp({
    host: "127.0.0.1",
    port: 0,
    openplannerUrl: "http://127.0.0.1:7777",
    openplannerApiKey: null,
    opencodeUrl: `http://127.0.0.1:${address.port}`,
    opencodeApiKey: null,
    workspaceRoot: "/tmp",
    mcpUrl: "http://127.0.0.1:3001",
    oauthEnabled: false,
    oauthIssuer: "http://localhost:3001",
    oauthAudience: "api-gateway",
    allowedHosts: ["localhost", "127.0.0.1"]
  });

  try {
    const res = await app.inject({ method: "GET", url: "/api/opencode/config" });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.ok, true);
    assert.deepEqual(body.models, ["gpt-5"]);
  } finally {
    await app.close();
    await upstream.close();
  }
});

void test("forwards opencode message stream responses", async () => {
  const upstream = Fastify();
  upstream.post("/session/:id/message", async (_req, reply) => {
    await reply.header("content-type", "text/event-stream; charset=utf-8")
      .header("cache-control", "no-cache")
      .send("data: {\"type\":\"message\",\"text\":\"hello\"}\n\n");
  });
  await upstream.listen({ host: "127.0.0.1", port: 0 });

  const address = upstream.server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to determine upstream port");
  }

  const app = await createApp({
    host: "127.0.0.1",
    port: 0,
    openplannerUrl: "http://127.0.0.1:7777",
    openplannerApiKey: null,
    opencodeUrl: `http://127.0.0.1:${address.port}`,
    opencodeApiKey: null,
    workspaceRoot: "/tmp",
    mcpUrl: "http://127.0.0.1:3001",
    oauthEnabled: false,
    oauthIssuer: "http://localhost:3001",
    oauthAudience: "api-gateway",
    allowedHosts: ["localhost", "127.0.0.1"]
  });

  try {
    const res = await app.inject({
      method: "POST",
      url: "/api/opencode/session/ses_123/message",
      payload: { parts: [{ type: "text", text: "ping" }] }
    });
    assert.equal(res.statusCode, 200);
    assert.match(res.body, /"text":"hello"/);
  } finally {
    await app.close();
    await upstream.close();
  }
});

void test("returns cors headers and handles preflight", async () => {
  const app = await createApp({
    host: "127.0.0.1",
    port: 0,
    openplannerUrl: "http://127.0.0.1:7777",
    openplannerApiKey: null,
    opencodeUrl: "http://127.0.0.1:4096",
    opencodeApiKey: null,
    workspaceRoot: "/tmp",
    mcpUrl: "http://127.0.0.1:3001",
    oauthEnabled: false,
    oauthIssuer: "http://localhost:3001",
    oauthAudience: "api-gateway",
    allowedHosts: ["localhost", "127.0.0.1"]
  });

  try {
    const res = await app.inject({
      method: "OPTIONS",
      url: "/api/openplanner/v1/sessions",
      headers: {
        origin: "http://127.0.0.1:8080"
      }
    });

    assert.equal(res.statusCode, 204);
    assert.equal(res.headers["access-control-allow-origin"], "http://127.0.0.1:8080");
    assert.equal(
      res.headers["access-control-allow-methods"],
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
  } finally {
    await app.close();
  }
});

void test("lists workspace entries and supports read/write", async () => {
  const workspaceRoot = mkdtempSync(path.join(tmpdir(), "api-gateway-workspace-"));
  mkdirSync(path.join(workspaceRoot, "docs"), { recursive: true });
  writeFileSync(path.join(workspaceRoot, "README.md"), "# Initial\n", "utf8");

  const app = await createApp({
    host: "127.0.0.1",
    port: 0,
    openplannerUrl: "http://127.0.0.1:7777",
    openplannerApiKey: null,
    opencodeUrl: "http://127.0.0.1:4096",
    opencodeApiKey: null,
    workspaceRoot,
    mcpUrl: "http://127.0.0.1:3001",
    oauthEnabled: false,
    oauthIssuer: "http://localhost:3001",
    oauthAudience: "api-gateway",
    allowedHosts: ["localhost", "127.0.0.1"]
  });

  try {
    const listResponse = await app.inject({ method: "GET", url: "/api/workspace/list?path=." });
    assert.equal(listResponse.statusCode, 200);
    const listBody = listResponse.json();
    assert.equal(listBody.ok, true);
    assert.ok(listBody.entries.some((entry: { path: string; type: string }) => entry.path === "README.md" && entry.type === "file"));

    const readResponse = await app.inject({
      method: "GET",
      url: "/api/workspace/file?path=README.md"
    });
    assert.equal(readResponse.statusCode, 200);
    const readBody = readResponse.json();
    assert.equal(readBody.ok, true);
    assert.equal(readBody.content, "# Initial\n");

    const writeResponse = await app.inject({
      method: "PUT",
      url: "/api/workspace/file",
      payload: {
        path: "README.md",
        content: "# Updated through gateway\n"
      }
    });
    assert.equal(writeResponse.statusCode, 200);

    const verifyResponse = await app.inject({
      method: "GET",
      url: "/api/workspace/file?path=README.md"
    });
    const verifyBody = verifyResponse.json();
    assert.equal(verifyBody.content, "# Updated through gateway\n");
  } finally {
    await app.close();
    rmSync(workspaceRoot, { recursive: true, force: true });
  }
});

void test("rejects workspace path traversal", async () => {
  const workspaceRoot = mkdtempSync(path.join(tmpdir(), "api-gateway-workspace-"));
  const app = await createApp({
    host: "127.0.0.1",
    port: 0,
    openplannerUrl: "http://127.0.0.1:7777",
    openplannerApiKey: null,
    opencodeUrl: "http://127.0.0.1:4096",
    opencodeApiKey: null,
    workspaceRoot,
    mcpUrl: "http://127.0.0.1:3001",
    oauthEnabled: false,
    oauthIssuer: "http://localhost:3001",
    oauthAudience: "api-gateway",
    allowedHosts: ["localhost", "127.0.0.1"]
  });

  try {
    const response = await app.inject({
      method: "GET",
      url: "/api/workspace/file?path=../outside.txt"
    });
    assert.equal(response.statusCode, 400);
  } finally {
    await app.close();
    rmSync(workspaceRoot, { recursive: true, force: true });
  }
});

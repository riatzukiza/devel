import assert from "node:assert/strict";
import test from "node:test";

import Fastify from "fastify";

import { createApp } from "../app.js";

void test("opaque oauth denies protected routes without bearer token", async () => {
  const app = await createApp({
    host: "127.0.0.1",
    port: 0,
    openplannerUrl: "http://127.0.0.1:7777",
    openplannerApiKey: null,
    opencodeUrl: "http://127.0.0.1:4096",
    opencodeApiKey: null,
    workspaceRoot: "/tmp",
    mcpUrl: "http://127.0.0.1:3001",
    oauthEnabled: true,
    oauthIssuer: "http://localhost:3001",
    oauthAudience: "api-gateway",
    oauthTokenStrategy: "opaque",
    oauthOpaqueVerifier: "introspection",
    oauthOpaqueIntrospectionUrl: "http://127.0.0.1:3001/internal/oauth/introspect",
    oauthRequiredScopes: ["mcp"],
    allowedHosts: [".tailbe888a.ts.net"],
  });

  try {
    const res = await app.inject({
      method: "GET",
      url: "/api/openplanner/v1/sessions",
      headers: {
        host: "chat.tailbe888a.ts.net",
      },
    });

    assert.equal(res.statusCode, 401);
    const authenticateHeader = res.headers["www-authenticate"];
    const authenticateText = typeof authenticateHeader === "string" ? authenticateHeader : authenticateHeader?.[0] ?? "";
    assert.match(authenticateText, /Bearer/);
  } finally {
    await app.close();
  }
});

void test("opaque oauth allows protected routes with valid token", async () => {
  const openplanner = Fastify();
  openplanner.get("/v1/sessions", async () => ({ ok: true, rows: [{ session: "opaque" }] }));
  await openplanner.listen({ host: "127.0.0.1", port: 0 });

  const openplannerAddress = openplanner.server.address();
  if (!openplannerAddress || typeof openplannerAddress === "string") {
    throw new Error("failed to determine openplanner port");
  }

  let introspectionCount = 0;
  const introspection = Fastify();
  introspection.post("/internal/oauth/introspect", async (req, reply) => {
    introspectionCount += 1;
    const sharedSecretHeader = req.headers["x-mcp-internal-shared-secret"];
    const sharedSecret = typeof sharedSecretHeader === "string" ? sharedSecretHeader : sharedSecretHeader?.[0];
    assert.equal(sharedSecret, "shared-secret");
    const body = req.body as { token?: string; requiredScopes?: string[] };
    if (body.token !== "valid-token") {
      return reply.code(401).send({ active: false, message: "invalid" });
    }
    return {
      active: true,
      clientId: "chatgpt",
      scopes: body.requiredScopes ?? ["mcp"],
      expiresAt: Math.floor(Date.now() / 1000) + 300,
    };
  });
  await introspection.listen({ host: "127.0.0.1", port: 0 });

  const introspectionAddress = introspection.server.address();
  if (!introspectionAddress || typeof introspectionAddress === "string") {
    throw new Error("failed to determine introspection port");
  }

  const app = await createApp({
    host: "127.0.0.1",
    port: 0,
    openplannerUrl: `http://127.0.0.1:${openplannerAddress.port}`,
    openplannerApiKey: null,
    opencodeUrl: "http://127.0.0.1:4096",
    opencodeApiKey: null,
    workspaceRoot: "/tmp",
    mcpUrl: "http://127.0.0.1:3001",
    oauthEnabled: true,
    oauthIssuer: "http://localhost:3001",
    oauthAudience: "api-gateway",
    oauthTokenStrategy: "opaque",
    oauthOpaqueVerifier: "introspection",
    oauthOpaqueIntrospectionUrl: `http://127.0.0.1:${introspectionAddress.port}/internal/oauth/introspect`,
    oauthOpaqueSharedSecret: "shared-secret",
    oauthRequiredScopes: ["mcp"],
    allowedHosts: [".tailbe888a.ts.net"],
  });

  try {
    const res = await app.inject({
      method: "GET",
      url: "/api/openplanner/v1/sessions",
      headers: {
        host: "chat.tailbe888a.ts.net",
        authorization: "Bearer valid-token",
      },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().rows[0]?.session, "opaque");
    assert.equal(introspectionCount, 1);
  } finally {
    await app.close();
    await introspection.close();
    await openplanner.close();
  }
});

void test("opaque oauth verifies via redis token store without introspection", async () => {
  const openplanner = Fastify();
  openplanner.get("/v1/sessions", async () => ({ ok: true, rows: [{ session: "redis" }] }));
  await openplanner.listen({ host: "127.0.0.1", port: 0 });

  const openplannerAddress = openplanner.server.address();
  if (!openplannerAddress || typeof openplannerAddress === "string") {
    throw new Error("failed to determine openplanner port");
  }

  const redisState = new Map<string, string>();
  const now = Math.floor(Date.now() / 1000);
  redisState.set(
    "oauth-stable:access_tokens:valid-redis-token",
    JSON.stringify({
      token: "valid-redis-token",
      clientId: "chatgpt",
      scopes: ["mcp"],
      subject: "chatgpt-user",
      expiresAt: now + 300,
    }),
  );

  const app = await createApp({
    host: "127.0.0.1",
    port: 0,
    openplannerUrl: `http://127.0.0.1:${openplannerAddress.port}`,
    openplannerApiKey: null,
    opencodeUrl: "http://127.0.0.1:4096",
    opencodeApiKey: null,
    workspaceRoot: "/tmp",
    mcpUrl: "http://127.0.0.1:3001",
    oauthEnabled: true,
    oauthIssuer: "http://localhost:3001",
    oauthAudience: "api-gateway",
    oauthTokenStrategy: "opaque",
    oauthOpaqueVerifier: "redis",
    oauthRedisPrefix: "oauth-stable",
    oauthRequiredScopes: ["mcp"],
    oauthOpaqueRedisGet: async (key: string) => redisState.get(key) ?? null,
    oauthOpaqueRedisDel: async (key: string) => {
      const existed = redisState.delete(key);
      return existed ? 1 : 0;
    },
    allowedHosts: [".tailbe888a.ts.net"],
  });

  try {
    const res = await app.inject({
      method: "GET",
      url: "/api/openplanner/v1/sessions",
      headers: {
        host: "chat.tailbe888a.ts.net",
        authorization: "Bearer valid-redis-token",
      },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().rows[0]?.session, "redis");
  } finally {
    await app.close();
    await openplanner.close();
  }
});

void test("opaque redis verifier rejects expired token and deletes stale key", async () => {
  const openplanner = Fastify();
  openplanner.get("/v1/sessions", async () => ({ ok: true, rows: [{ session: "redis" }] }));
  await openplanner.listen({ host: "127.0.0.1", port: 0 });

  const openplannerAddress = openplanner.server.address();
  if (!openplannerAddress || typeof openplannerAddress === "string") {
    throw new Error("failed to determine openplanner port");
  }

  const redisState = new Map<string, string>();
  const now = Math.floor(Date.now() / 1000);
  const expiredKey = "oauth-stable:access_tokens:expired-redis-token";
  redisState.set(
    expiredKey,
    JSON.stringify({
      token: "expired-redis-token",
      clientId: "chatgpt",
      scopes: ["mcp"],
      subject: "chatgpt-user",
      expiresAt: now - 60,
    }),
  );

  const deletedKeys: string[] = [];
  const app = await createApp({
    host: "127.0.0.1",
    port: 0,
    openplannerUrl: `http://127.0.0.1:${openplannerAddress.port}`,
    openplannerApiKey: null,
    opencodeUrl: "http://127.0.0.1:4096",
    opencodeApiKey: null,
    workspaceRoot: "/tmp",
    mcpUrl: "http://127.0.0.1:3001",
    oauthEnabled: true,
    oauthIssuer: "http://localhost:3001",
    oauthAudience: "api-gateway",
    oauthTokenStrategy: "opaque",
    oauthOpaqueVerifier: "redis",
    oauthRedisPrefix: "oauth-stable",
    oauthRequiredScopes: ["mcp"],
    oauthOpaqueRedisGet: async (key: string) => redisState.get(key) ?? null,
    oauthOpaqueRedisDel: async (key: string) => {
      deletedKeys.push(key);
      const existed = redisState.delete(key);
      return existed ? 1 : 0;
    },
    allowedHosts: [".tailbe888a.ts.net"],
  });

  try {
    const res = await app.inject({
      method: "GET",
      url: "/api/openplanner/v1/sessions",
      headers: {
        host: "chat.tailbe888a.ts.net",
        authorization: "Bearer expired-redis-token",
      },
    });

    assert.equal(res.statusCode, 401);
    assert.deepEqual(deletedKeys, [expiredKey]);
    assert.equal(redisState.has(expiredKey), false);
  } finally {
    await app.close();
    await openplanner.close();
  }
});

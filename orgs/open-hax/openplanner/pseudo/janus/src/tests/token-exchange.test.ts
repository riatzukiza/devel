import assert from "node:assert/strict";
import Fastify from "fastify";
import type { FastifyPluginCallback } from "fastify";
import test from "node:test";
import formbody from "@fastify/formbody";

import { proxyToMcp } from "../lib/mcp-proxy.js";

void test("token exchange logging for successful response", async () => {
  const upstream = Fastify();
  await upstream.register(formbody as unknown as FastifyPluginCallback);
  
  // Mock token endpoint that returns success
  upstream.post("/token", async (req, reply) => {
    await reply.header("content-type", "application/json")
      .send({
        access_token: "test_access_token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "test_refresh_token"
      });
  });
  
  await upstream.listen({ host: "127.0.0.1", port: 0 });
  
  const address = upstream.server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to determine upstream port");
  }
  
  const port = address.port;
  
  const app = Fastify();
  await app.register(formbody as unknown as FastifyPluginCallback);
  
  // Register the proxy handler for /token endpoint
  app.post("/token", async (req, reply) => {
    await proxyToMcp(req, reply, {
      baseUrl: `http://127.0.0.1:${port}`
    });
  });
  
  try {
    // Test successful token exchange - use URL-encoded string as payload
    const res = await app.inject({
      method: "POST",
      url: `/token`,
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      payload: "grant_type=authorization_code&code=test_code&redirect_uri=https://example.com/callback"
    });
    
    // The request should be proxied successfully
    assert.equal(res.statusCode, 200);
    
    const body = res.json();
    assert.equal(body.access_token, "test_access_token");
    assert.equal(body.token_type, "bearer");
  } finally {
    await app.close();
    await upstream.close();
  }
});

void test("token exchange logging for error response", async () => {
  const upstream = Fastify();
  await upstream.register(formbody as unknown as FastifyPluginCallback);
  
  // Mock token endpoint that returns error
  upstream.post("/token", async (req, reply) => {
    await reply.code(400)
      .header("content-type", "application/json")
      .send({
        error: "invalid_grant",
        error_description: "The authorization code is invalid"
      });
  });
  
  await upstream.listen({ host: "127.0.0.1", port: 0 });
  
  const address = upstream.server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to determine upstream port");
  }
  
  const port = address.port;
  
  const app = Fastify();
  await app.register(formbody as unknown as FastifyPluginCallback);
  
  // Register the proxy handler for /token endpoint
  app.post("/token", async (req, reply) => {
    await proxyToMcp(req, reply, {
      baseUrl: `http://127.0.0.1:${port}`
    });
  });
  
  try {
    // Test failed token exchange with URL-encoded string
    const res = await app.inject({
      method: "POST", 
      url: `/token`,
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      payload: "grant_type=authorization_code&code=invalid_code"
    });
    
    // The request should return error from upstream
    assert.equal(res.statusCode, 400);
    
    const body = res.json();
    assert.equal(body.error, "invalid_grant");
  } finally {
    await app.close();
    await upstream.close();
  }
});

void test("preserves content-type for form-urlencoded requests", async () => {
  const upstream = Fastify();
  await upstream.register(formbody as unknown as FastifyPluginCallback);
  
  let receivedContentType: string | undefined;
  
  upstream.post("/token", async (req, reply) => {
    receivedContentType = req.headers["content-type"];
    await reply.header("content-type", "application/json")
      .send({ access_token: "test" });
  });
  
  await upstream.listen({ host: "127.0.0.1", port: 0 });
  
  const address = upstream.server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to determine upstream port");
  }
  
  const port = address.port;
  
  const app = Fastify();
  await app.register(formbody as unknown as FastifyPluginCallback);
  
  // Register the proxy handler for /token endpoint
  app.post("/token", async (req, reply) => {
    await proxyToMcp(req, reply, {
      baseUrl: `http://127.0.0.1:${port}`
    });
  });
  
  try {
    // Test with URL-encoded string payload
    await app.inject({
      method: "POST",
      url: `/token`,
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      payload: "grant_type=authorization_code"
    });
    
    // Verify content-type was preserved
    assert.equal(receivedContentType, "application/x-www-form-urlencoded");
  } finally {
    await app.close();
    await upstream.close();
  }
});

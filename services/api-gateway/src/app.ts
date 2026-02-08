import formbody from "@fastify/formbody";
import Fastify, { type FastifyInstance, type FastifyPluginCallback } from "fastify";

import type { GatewayConfig } from "./lib/config.js";
import { addOAuthProtection } from "./lib/oauth-protection.js";
import { mcpRoutes } from "./routes/mcp.js";
import { mcpDevRoutes } from "./routes/mcp-dev.js";
import { mcpRootRoutes } from "./routes/mcp-root.js";
import { opencodeRoutes } from "./routes/opencode.js";
import { openplannerRoutes } from "./routes/openplanner.js";
import { workspaceRoutes } from "./routes/workspace.js";

export async function createApp(cfg: GatewayConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
    bodyLimit: 50 * 1024 * 1024
  });

  await app.register(formbody as unknown as FastifyPluginCallback);

  app.addHook("onRequest", async (req, reply) => {
    // Simplified CORS: use wildcard since we use Bearer tokens (header-based auth)
    // Browser credentials (cookies) are not used, so we don't need Access-Control-Allow-Credentials
    const requestOrigin = req.headers.origin;
    reply.header("Access-Control-Allow-Origin", requestOrigin ?? "*");
    reply.header("Vary", "Origin");
    reply.header(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type, Accept, X-Requested-With, X-MCP-Session-ID"
    );
    reply.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  });

  app.options("/api/openplanner/*", async (_req, reply) => {
    reply.code(204).send();
  });

  app.options("/api/opencode/*", async (_req, reply) => {
    reply.code(204).send();
  });

  app.options("/*", async (_req, reply) => {
    reply.code(204).send();
  });

  app.get("/", async () => ({ ok: true, name: "api-gateway", version: "0.1.0" }));
  app.get("/health", async () => ({ ok: true, service: "api-gateway" }));

  await addOAuthProtection(app, cfg);

  // Register root-level MCP routes (including OAuth endpoints)
  await app.register(mcpRootRoutes, {
    mcpUrl: cfg.mcpUrl
  });

  if (cfg.mcpDevUrl) {
    await app.register(mcpDevRoutes, {
      mcpDevUrl: cfg.mcpDevUrl
    });
  }

  app.get("/health/openplanner", async (_req, reply) => {
    try {
      const healthRes = await fetch(`${cfg.openplannerUrl}/v1/health`, {
        headers: cfg.openplannerApiKey
          ? { authorization: `Bearer ${cfg.openplannerApiKey}` }
          : undefined
      });
      const text = await healthRes.text();
      const payload = text.length > 0 ? JSON.parse(text) : { ok: false };
      reply.code(healthRes.status).send({ ok: healthRes.ok, upstream: payload });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      reply.code(502).send({ ok: false, error: message });
    }
  });

  await app.register(openplannerRoutes, {
    prefix: "/api",
    openplannerUrl: cfg.openplannerUrl,
    openplannerApiKey: cfg.openplannerApiKey
  });

  await app.register(opencodeRoutes, {
    prefix: "/api",
    opencodeUrl: cfg.opencodeUrl,
    opencodeApiKey: cfg.opencodeApiKey
  });

  await app.register(workspaceRoutes, {
    prefix: "/api",
    workspaceRoot: cfg.workspaceRoot
  });

  await app.register(mcpRoutes, {
    prefix: "/api",
    mcpUrl: cfg.mcpUrl
  });

  return app;
}

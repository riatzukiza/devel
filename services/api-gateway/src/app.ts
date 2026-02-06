import Fastify, { type FastifyInstance } from "fastify";
import type { GatewayConfig } from "./lib/config.js";
import { openplannerRoutes } from "./routes/openplanner.js";
import { workspaceRoutes } from "./routes/workspace.js";

export async function buildApp(cfg: GatewayConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
    bodyLimit: 50 * 1024 * 1024
  });

  app.addHook("onRequest", async (req, reply) => {
    const requestOrigin = req.headers.origin;
    reply.header("Access-Control-Allow-Origin", requestOrigin ?? "*");
    reply.header("Vary", "Origin");
    reply.header("Access-Control-Allow-Credentials", "true");
    reply.header(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type, Accept, X-Requested-With"
    );
    reply.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  });

  app.options("/api/openplanner/*", async (_req, reply) => {
    reply.code(204).send();
  });

  app.options("/*", async (_req, reply) => {
    reply.code(204).send();
  });

  app.get("/", async () => ({ ok: true, name: "api-gateway", version: "0.1.0" }));
  app.get("/health", async () => ({ ok: true, service: "api-gateway" }));

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

  await app.register(workspaceRoutes, {
    prefix: "/api",
    workspaceRoot: cfg.workspaceRoot
  });

  return app;
}

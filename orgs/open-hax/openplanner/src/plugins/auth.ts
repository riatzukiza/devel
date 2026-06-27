import fp from "fastify-plugin";
import type { OpenPlannerConfig } from "../lib/config.js";

export const authPlugin = fp<OpenPlannerConfig>(async (app, cfg) => {
  app.addHook("onRequest", async (req, reply) => {
    const origin = req.headers.origin;
    reply.header("Access-Control-Allow-Origin", typeof origin === "string" ? origin : "*");
    reply.header("Vary", "Origin");
    reply.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Authorization,Content-Type,X-Requested-With");
    reply.header("Access-Control-Max-Age", "86400");

    // Browser preflight requests carry no Authorization header; answer them before auth.
    if (req.method === "OPTIONS") return reply.status(204).send();

    // Public endpoints (no auth required)
    const publicPaths = ["/v1/health", "/v1/metrics", "/"];
    if (publicPaths.includes(req.url)) return;

    // Public garden routes (no auth required)
    if (req.url.startsWith("/v1/public/")) return;

    const h = req.headers["authorization"];
    const token =
      typeof h === "string" && h.toLowerCase().startsWith("bearer ") ? h.slice(7) : null;

    if (!token || token !== cfg.apiKey) {
      return reply.unauthorized("Missing/invalid Authorization: Bearer <API_KEY>");
    }
  });
});

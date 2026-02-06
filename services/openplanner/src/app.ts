import Fastify, { type FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import sensible from "@fastify/sensible";
import type { OpenPlannerConfig } from "./lib/config.js";
import { authPlugin } from "./plugins/auth.js";
import { duckdbPlugin } from "./plugins/duckdb.js";
import { chromaPlugin } from "./plugins/chroma.js";
import { v1Routes } from "./routes/v1/index.js";

export async function buildApp(cfg: OpenPlannerConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
    bodyLimit: 50 * 1024 * 1024
  });

  (app as any).openplannerConfig = cfg;

  await app.register(sensible);
  await app.register(multipart, {
    limits: { fileSize: 200 * 1024 * 1024 }
  });

  await app.register(authPlugin, cfg);
  await app.register(duckdbPlugin, cfg);
  await app.register(chromaPlugin, cfg);

  await app.register(v1Routes, { prefix: "/v1" });

  app.get("/", async () => ({ ok: true, name: "openplanner", version: "0.1.0" }));
  return app;
}

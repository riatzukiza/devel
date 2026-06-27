import Fastify, { type FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import sensible from "@fastify/sensible";
import type { OpenPlannerConfig } from "./lib/config.js";
import { createEmbeddingRuntime } from "./lib/embedding-runtime.js";
import { authPlugin } from "./plugins/auth.js";
import { tenantPlugin } from "./plugins/tenant.js";
import { kafkaEventsPlugin } from "./plugins/kafka-events.js";
import { mongodbPlugin } from "./plugins/mongodb.js";
import { v1Routes } from "./routes/v1/index.js";

export async function buildApp(cfg: OpenPlannerConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
    bodyLimit: 50 * 1024 * 1024,
    pluginTimeout: 120_000,
  });

  (app as any).openplannerConfig = cfg;
  (app as any).embeddingRuntime = createEmbeddingRuntime(cfg);

  await app.register(sensible as any);
  await app.register(multipart as any, {
    limits: { fileSize: 200 * 1024 * 1024 }
  });

  await app.register(authPlugin as any, cfg);

  // MongoDB is the only storage backend
  await app.register(mongodbPlugin as any, cfg);

  // Tenant resolution (non-strict for backward compatibility during migration)
  await app.register(tenantPlugin, { strict: false });

  // Kafka/Redpanda event mirror is optional and fail-open by default.
  await app.register(kafkaEventsPlugin);

  await app.register(v1Routes, { prefix: "/v1" });

  app.get("/", async () => ({ ok: true, name: "openplanner", version: "0.3.0", storageBackend: "mongodb" }));
  return app;
}

import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import type { OpenPlannerConfig } from "../lib/config.js";
import { openChroma, type Chroma } from "../lib/chroma.js";

declare module "fastify" {
  interface FastifyInstance {
    chroma: Chroma;
  }
}

export const chromaPlugin = fp<OpenPlannerConfig>(async (app, cfg) => {
  const chroma = await openChroma(cfg.chromaUrl, cfg.chromaCollection);
  app.decorate("chroma", chroma);
  app.log.info({ chromaUrl: cfg.chromaUrl, collection: chroma.collectionName }, "chroma ready");
});

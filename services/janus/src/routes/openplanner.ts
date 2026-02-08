import type { FastifyPluginAsync } from "fastify";

import { proxyToOpenPlanner } from "../lib/openplanner-proxy.js";

type OpenPlannerRouteOptions = {
  openplannerUrl: string;
  openplannerApiKey: string | null;
};

export const openplannerRoutes: FastifyPluginAsync<OpenPlannerRouteOptions> = async (app, opts) => {
  app.route<{ Params: { "*": string } }>({
    method: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"],
    url: "/openplanner/*",
    handler: async (req, reply) => {
    await proxyToOpenPlanner(req, reply, {
      baseUrl: opts.openplannerUrl,
      apiKey: opts.openplannerApiKey
    });
    }
  });
};

import type { FastifyPluginAsync } from "fastify";

import { proxyToOpencode } from "../lib/opencode-proxy.js";

type OpencodeRouteOptions = {
  opencodeUrl: string;
  opencodeApiKey: string | null;
};

export const opencodeRoutes: FastifyPluginAsync<OpencodeRouteOptions> = async (app, opts) => {
  app.route<{ Params: { "*": string } }>({
    method: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"],
    url: "/opencode/*",
    handler: async (req, reply) => {
      await proxyToOpencode(req, reply, {
        baseUrl: opts.opencodeUrl,
        apiKey: opts.opencodeApiKey
      });
    }
  });
};

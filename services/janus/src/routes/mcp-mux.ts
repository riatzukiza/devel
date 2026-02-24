import type { FastifyPluginAsync } from "fastify";

import { proxyToMcp } from "../lib/mcp-proxy.js";

type McpMuxRouteOptions = {
  mcpServiceUrls: Record<string, string>;
  mcpInternalSharedSecret?: string | null;
};

export const mcpMuxRoutes: FastifyPluginAsync<McpMuxRouteOptions> = async (app, opts) => {
  app.route<{ Params: { service: string; "*": string } }>({
    method: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"],
    url: "/mcp/:service/*",
    handler: async (req, reply) => {
      const { service } = req.params;
      const baseUrl = opts.mcpServiceUrls[service];

      if (!baseUrl) {
        reply.code(404).send({
          ok: false,
          error: "unknown_mcp_service",
          service,
        });
        return;
      }

      await proxyToMcp(
        req,
        reply,
        {
          baseUrl,
          internalSharedSecret: opts.mcpInternalSharedSecret,
        },
        `/api/mcp/${service}`,
      );
    },
  });
};

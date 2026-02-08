import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

import { proxyToMcp } from "../lib/mcp-proxy.js";

type McpDevRouteOptions = {
  mcpDevUrl: string;
};

export const mcpDevRoutes: FastifyPluginAsync<McpDevRouteOptions> = async (app, opts) => {
  const proxyHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    await proxyToMcp(req, reply, {
      baseUrl: `${opts.mcpDevUrl}/mcp`
    }, "/mcp/dev");
  };

  app.all("/mcp/dev", proxyHandler);
  app.all("/mcp/dev/", proxyHandler);
  app.all("/mcp/dev/*", proxyHandler);
};

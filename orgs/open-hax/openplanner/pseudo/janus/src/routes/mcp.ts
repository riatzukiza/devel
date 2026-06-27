import type { FastifyPluginAsync } from "fastify";

import { proxyToMcp } from "../lib/mcp-proxy.js";

type McpRouteOptions = {
  mcpUrl: string;
};

export const mcpRoutes: FastifyPluginAsync<McpRouteOptions> = async (app, opts) => {
  app.route<{ Params: { "*": string } }>({
    method: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"],
    url: "/mcp/*",
    handler: async (req, reply) => {
      await proxyToMcp(req, reply, {
        baseUrl: opts.mcpUrl
      }, "/api");
    }
  });

  app.route<{ Params: { "*": string } }>({
    method: ["GET"],
    url: "/.well-known/oauth-protected-resource/mcp",
    handler: async (req, reply) => {
      await proxyToMcp(req, reply, {
        baseUrl: opts.mcpUrl
      }, "/api");
    }
  });

  app.route<{ Params: { "*": string } }>({
    method: ["GET"],
    url: "/.well-known/oauth-authorization-server",
    handler: async (req, reply) => {
      await proxyToMcp(req, reply, {
        baseUrl: opts.mcpUrl
      }, "/api");
    }
  });
};

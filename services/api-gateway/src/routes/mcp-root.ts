import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";

import { proxyToMcp } from "../lib/mcp-proxy.js";

type McpRootRouteOptions = {
  mcpUrl: string;
};

export const mcpRootRoutes: FastifyPluginAsync<McpRootRouteOptions> = async (app, opts) => {
  const proxyHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    await proxyToMcp(req, reply, {
      baseUrl: opts.mcpUrl
    });
  };

  app.all("/mcp", proxyHandler);
  app.all("/mcp/*", proxyHandler);

  app.all("/authorize", proxyHandler);
  app.all("/token", proxyHandler);
  app.all("/register", proxyHandler);
  app.all("/revoke", proxyHandler);
  app.all("/.well-known/oauth-authorization-server", proxyHandler);
  app.all("/.well-known/oauth-protected-resource/mcp", proxyHandler);
  app.all("/.well-known/openid-configuration", proxyHandler);
  app.all("/.well-known/jwks.json", proxyHandler);

  app.all("/login", proxyHandler);
  app.all("/login/*", proxyHandler);
  app.all("/consent", proxyHandler);
  app.all("/oauth/callback/github", proxyHandler);
  app.all("/oauth/callback/google", proxyHandler);
  app.all("/auth/*", proxyHandler);
};

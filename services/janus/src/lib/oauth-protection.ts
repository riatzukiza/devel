import type { FastifyInstance } from "fastify";
import { Redis } from "ioredis";
import {
  addFastifyOAuthGuard,
  createJwtTokenVerifier,
  createOpaqueTokenVerifier,
  createRedisOpaqueTokenVerifier,
  type OAuthTokenVerifier,
} from "@workspace/mcp-oauth";

import type { GatewayConfig } from "./config.js";

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/health"
    || pathname === "/"
    || pathname.startsWith("/.well-known/")
    || pathname.startsWith("/api/.well-known/")
    || pathname === "/authorize"
    || pathname === "/api/authorize"
    || pathname === "/token"
    || pathname === "/api/token"
    || pathname === "/register"
    || pathname === "/api/register"
    || pathname === "/revoke"
    || pathname === "/api/revoke"
    || pathname === "/login"
    || pathname === "/api/login"
    || pathname === "/consent"
    || pathname === "/api/consent"
    || pathname.startsWith("/login/")
    || pathname.startsWith("/api/login/")
    || pathname.startsWith("/oauth/callback/")
    || pathname.startsWith("/api/oauth/callback/")
    || pathname.startsWith("/auth/")
    || pathname.startsWith("/api/auth/")
  );
}

function isRootMcpPath(pathname: string): boolean {
  return pathname === "/mcp" || pathname.startsWith("/mcp/");
}

function resolveOpaqueVerifier(app: FastifyInstance, cfg: GatewayConfig): OAuthTokenVerifier {
  const requiredScopes = cfg.oauthRequiredScopes ?? ["mcp"];
  const opaqueVerifierMode = cfg.oauthOpaqueVerifier ?? "redis";

  if (opaqueVerifierMode === "introspection") {
    return createOpaqueTokenVerifier({
      introspectionUrl: cfg.oauthOpaqueIntrospectionUrl ?? `${cfg.mcpUrl}/internal/oauth/introspect`,
      sharedSecret: cfg.oauthOpaqueSharedSecret ?? undefined,
      requiredScopes,
    });
  }

  const keyPrefix = cfg.oauthRedisPrefix ?? "oauth";
  if (cfg.oauthOpaqueRedisGet) {
    const getTokenByKey = cfg.oauthOpaqueRedisGet;
    const deleteTokenByKey = cfg.oauthOpaqueRedisDel;
    return createRedisOpaqueTokenVerifier({
      keyPrefix,
      getTokenByKey: (key) => getTokenByKey(key),
      deleteTokenByKey: deleteTokenByKey ? (key) => deleteTokenByKey(key) : undefined,
    });
  }

  const redis = cfg.oauthRedisUrl
    ? new Redis(cfg.oauthRedisUrl)
    : new Redis({
        host: cfg.oauthRedisHost ?? "127.0.0.1",
        port: cfg.oauthRedisPort ?? 6379,
      });

  redis.on("error", (error: unknown) => {
    app.log.error({ err: error }, "OAuth Redis verification error");
  });

  app.addHook("onClose", async () => {
    await redis.quit();
  });

  return createRedisOpaqueTokenVerifier({
    keyPrefix,
    getTokenByKey: (key) => redis.get(key),
    deleteTokenByKey: (key) => redis.del(key),
  });
}

function resolveVerifier(app: FastifyInstance, cfg: GatewayConfig): OAuthTokenVerifier {
  if (cfg.oauthTokenStrategy === "jwt") {
    return createJwtTokenVerifier({
      issuer: cfg.oauthIssuer,
      audience: cfg.oauthAudience,
    });
  }

  return resolveOpaqueVerifier(app, cfg);
}

export async function addOAuthProtection(app: FastifyInstance, cfg: GatewayConfig): Promise<void> {
  if (!cfg.oauthEnabled) {
    app.log.info("OAuth protection disabled");
    return;
  }

  const verifier = resolveVerifier(app, cfg);

  addFastifyOAuthGuard(app, {
    verifier,
    realm: "api-gateway",
    requiredScopes: cfg.oauthRequiredScopes ?? ["mcp"],
    allowLocalhostBypass: true,
    allowedHosts: cfg.allowedHosts,
    isPublicPath,
    // Root MCP endpoints carry OAuth access tokens issued by the MCP OAuth server.
    // Those tokens are opaque to Janus and should be verified by the upstream MCP server.
    shouldBypassTokenVerification: isRootMcpPath,
  });
}

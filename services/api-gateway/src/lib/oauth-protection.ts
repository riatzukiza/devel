import * as jose from "jose";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

import type { GatewayConfig } from "./config.js";

const jwksCache = new Map<string, jose.JWTVerifyGetKey>();

function getJwks(issuer: string): jose.JWTVerifyGetKey {
  const cached = jwksCache.get(issuer);
  if (cached) return cached;

  const jwks = jose.createRemoteJWKSet(new URL("/.well-known/jwks.json", issuer));
  jwksCache.set(issuer, jwks);
  return jwks;
}

function isLocalhost(hostname: string): boolean {
  const hostnameWithoutPort = hostname.split(":")[0] ?? "";
  return hostnameWithoutPort === "localhost" || hostnameWithoutPort === "127.0.0.1";
}

function isAllowedHost(hostname: string, allowedHosts: string[]): boolean {
  const hostnameWithoutPort = hostname.split(":")[0] ?? "";
  return allowedHosts.some(allowed => {
    if (allowed.startsWith(".")) {
      return hostnameWithoutPort.endsWith(allowed) || hostname.endsWith(allowed);
    }
    return hostnameWithoutPort === allowed || hostname === allowed || 
           hostname === `localhost:${allowed}` || hostname === `127.0.0.1:${allowed}`;
  });
}

async function verifyToken(token: string, issuer: string, audience: string): Promise<jose.JWTPayload> {
  const jwks = getJwks(issuer);
  const { payload } = await jose.jwtVerify(token, jwks, {
    issuer,
    audience
  });
  return payload;
}

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/health" || 
    pathname === "/" || 
    pathname.startsWith("/.well-known/") ||
    pathname === "/authorize" ||
    pathname === "/token" ||
    pathname === "/register" ||
    pathname === "/revoke" ||
    pathname === "/login" ||
    pathname === "/consent" ||
    pathname.startsWith("/login/") ||
    pathname.startsWith("/oauth/callback/") ||
    pathname.startsWith("/auth/")
  );
}

async function checkOAuth(
  req: FastifyRequest, 
  reply: FastifyReply, 
  cfg: GatewayConfig
): Promise<void> {
  const hostname = req.headers.host ?? "";
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.log.warn({ hostname }, "Missing or invalid Authorization header");
    return reply.code(401).header("WWW-Authenticate", 'Bearer realm="api-gateway"').send({
      error: "Unauthorized",
      message: "OAuth token required for non-local access"
    });
  }

  const token = authHeader.slice(7);
  try {
    await verifyToken(token, cfg.oauthIssuer, cfg.oauthAudience);
    req.log.debug("OAuth token verified successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid token";
    req.log.warn({ error: message }, "OAuth token verification failed");
    return reply.code(401).header("WWW-Authenticate", 'Bearer realm="api-gateway", error="invalid_token"').send({
      error: "Unauthorized",
      message: "Invalid or expired OAuth token"
    });
  }
}

export async function addOAuthProtection(app: FastifyInstance, cfg: GatewayConfig): Promise<void> {
  if (!cfg.oauthEnabled) {
    app.log.info("OAuth protection disabled");
    return;
  }

  app.addHook("onRequest", async (req: FastifyRequest, reply: FastifyReply) => {
    const hostname = req.headers.host ?? "";
    const pathname = req.url.split("?")[0] ?? "";

    if (isPublicPath(pathname)) {
      return;
    }

    if (isLocalhost(hostname)) {
      req.log.debug({ hostname }, "Allowing request from localhost (unprotected)");
      return;
    }

    if (!isAllowedHost(hostname, cfg.allowedHosts)) {
      req.log.warn({ hostname }, "Host not allowed (blocked)");
      return reply.code(403).send({
        error: "Forbidden",
        message: "Access from this host is blocked"
      });
    }

    return;
  });
}

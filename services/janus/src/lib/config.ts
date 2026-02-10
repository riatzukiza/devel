import path from "node:path";

export type GatewayConfig = {
  host: string;
  port: number;
  openplannerUrl: string;
  openplannerApiKey: string | null;
  opencodeUrl: string;
  opencodeApiKey: string | null;
  workspaceRoot: string;
  mcpUrl: string;
  mcpServiceUrls?: Record<string, string>;
  mcpDevUrl?: string | null;
  mcpInternalSharedSecret?: string | null;
  oauthEnabled: boolean;
  oauthIssuer: string;
  oauthAudience: string;
  oauthTokenStrategy?: "jwt" | "opaque";
  oauthOpaqueVerifier?: "redis" | "introspection";
  oauthOpaqueIntrospectionUrl?: string;
  oauthOpaqueSharedSecret?: string | null;
  oauthRequiredScopes?: string[];
  oauthRedisUrl?: string;
  oauthRedisHost?: string;
  oauthRedisPort?: number;
  oauthRedisPrefix?: string;
  oauthOpaqueRedisGet?: (key: string) => Promise<string | null>;
  oauthOpaqueRedisDel?: (key: string) => Promise<number>;
  allowedHosts: string[];
};

function mustGet(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.length > 0 ? value : fallback;
}

export function loadConfig(): GatewayConfig {
  const host = mustGet("API_GATEWAY_HOST", "127.0.0.1");
  const port = Number(mustGet("API_GATEWAY_PORT", "8788"));
  const openplannerUrl = mustGet("OPENPLANNER_URL", "http://127.0.0.1:7777");
  const openplannerApiKey = process.env.OPENPLANNER_API_KEY ?? null;
  const opencodeUrl = mustGet("OPENCODE_URL", "http://127.0.0.1:4096");
  const opencodeApiKey = process.env.OPENCODE_API_KEY ?? null;
  const workspaceRoot = mustGet("WORKSPACE_ROOT", path.resolve(process.cwd(), "..", ".."));
  const mcpUrl = mustGet("MCP_FS_OAUTH_URL", "http://127.0.0.1:3001");
  const mcpServiceUrlsRaw = process.env.MCP_SERVICE_URLS;
  const mcpServiceUrlsParsed = (() => {
    if (!mcpServiceUrlsRaw || mcpServiceUrlsRaw.trim().length === 0) {
      return {} as Record<string, string>;
    }

    try {
      const value = JSON.parse(mcpServiceUrlsRaw) as unknown;
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {} as Record<string, string>;
      }

      const entries = Object.entries(value as Record<string, unknown>)
        .filter(([service, url]) => service.trim().length > 0 && typeof url === "string" && url.trim().length > 0)
        .map(([service, url]) => [service, (url as string).trim()] as const);
      return Object.fromEntries(entries);
    } catch {
      return {} as Record<string, string>;
    }
  })();
  const mcpServiceUrls = {
    ...(mcpServiceUrlsParsed["fs-oauth"] ? {} : { "fs-oauth": mcpUrl }),
    ...mcpServiceUrlsParsed,
  };
  const mcpDevUrl = process.env.MCP_FS_OAUTH_DEV_URL ?? null;
  const mcpInternalSharedSecret = process.env.MCP_INTERNAL_SHARED_SECRET ?? null;
  const oauthEnabled = mustGet("OAUTH_ENABLED", "false").toLowerCase() === "true";
  const oauthIssuer = mustGet("OAUTH_ISSUER", "http://localhost:3001");
  const oauthAudience = mustGet("OAUTH_AUDIENCE", "api-gateway");
  const oauthTokenStrategyRaw = mustGet("OAUTH_TOKEN_STRATEGY", "opaque").toLowerCase();
  const oauthTokenStrategy = oauthTokenStrategyRaw === "jwt" ? "jwt" : "opaque";
  const oauthOpaqueVerifierRaw = mustGet("OAUTH_OPAQUE_VERIFIER", "redis").toLowerCase();
  const oauthOpaqueVerifier = oauthOpaqueVerifierRaw === "introspection" ? "introspection" : "redis";
  const oauthOpaqueIntrospectionUrl = mustGet("OAUTH_OPAQUE_INTROSPECTION_URL", `${mcpUrl}/internal/oauth/introspect`);
  const oauthOpaqueSharedSecret = process.env.OAUTH_OPAQUE_SHARED_SECRET ?? mcpInternalSharedSecret;
  const oauthRequiredScopes = (process.env.OAUTH_REQUIRED_SCOPES ?? "mcp")
    .split(",")
    .map((scope) => scope.trim())
    .filter((scope) => scope.length > 0);
  const oauthRedisUrl = process.env.OAUTH_REDIS_URL ?? process.env.REDIS_URL;
  const oauthRedisHost = mustGet("OAUTH_REDIS_HOST", "127.0.0.1");
  const oauthRedisPort = Number.parseInt(mustGet("OAUTH_REDIS_PORT", "6379"), 10);
  const oauthRedisPrefix = mustGet("OAUTH_REDIS_PREFIX", "oauth");
  const allowedHostsEnv = process.env.ALLOWED_HOSTS ?? "";
  const allowedHosts = allowedHostsEnv
    ? allowedHostsEnv.split(",").map(h => h.trim())
    : ["localhost", "127.0.0.1", ".tailbe888a.ts.net"];

  return {
    host,
    port,
    openplannerUrl,
    openplannerApiKey,
    opencodeUrl,
    opencodeApiKey,
    workspaceRoot,
    mcpUrl,
    mcpServiceUrls,
    mcpDevUrl,
    mcpInternalSharedSecret,
    oauthEnabled,
    oauthIssuer,
    oauthAudience,
    oauthTokenStrategy,
    oauthOpaqueVerifier,
    oauthOpaqueIntrospectionUrl,
    oauthOpaqueSharedSecret,
    oauthRequiredScopes,
    oauthRedisUrl,
    oauthRedisHost,
    oauthRedisPort,
    oauthRedisPrefix,
    allowedHosts
  };
}

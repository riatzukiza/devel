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
    allowedHosts
  };
}

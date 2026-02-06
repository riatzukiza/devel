import path from "node:path";

export type GatewayConfig = {
  host: string;
  port: number;
  openplannerUrl: string;
  openplannerApiKey: string | null;
  workspaceRoot: string;
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
  const workspaceRoot = mustGet("WORKSPACE_ROOT", path.resolve(process.cwd(), "..", ".."));

  return {
    host,
    port,
    openplannerUrl,
    openplannerApiKey,
    workspaceRoot
  };
}

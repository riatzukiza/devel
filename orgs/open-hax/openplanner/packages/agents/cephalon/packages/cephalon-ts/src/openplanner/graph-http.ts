import type { OpenPlannerConfig } from "./client.js";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function getFetchImpl(config: OpenPlannerConfig): typeof fetch {
  const fetchImpl = config.fetch ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("Fetch implementation is not available");
  return fetchImpl;
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, string | undefined>): string {
  const url = `${trimTrailingSlash(baseUrl)}${path}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (!value) continue;
    params.set(key, value);
  }

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

export async function requestJson<T>(config: OpenPlannerConfig, path: string, query?: Record<string, string | undefined>): Promise<T> {
  const fetchImpl = getFetchImpl(config);
  const headers: Record<string, string> = {};
  if (config.apiKey?.trim()) headers.Authorization = `Bearer ${config.apiKey.trim()}`;

  const response = await fetchImpl(buildUrl(config.baseUrl, path, query), {
    method: "GET",
    headers,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`OpenPlanner graph request failed (${response.status}): ${text}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`OpenPlanner graph request returned invalid JSON: ${message}`);
  }
}
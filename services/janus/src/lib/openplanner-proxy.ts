import type { FastifyReply, FastifyRequest } from "fastify";

type ProxyConfig = {
  baseUrl: string;
  apiKey: string | null;
};

function normalizeBase(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function getForwardedAuthorization(req: FastifyRequest, apiKey: string | null): string | undefined {
  if (apiKey && apiKey.length > 0) return `Bearer ${apiKey}`;
  const header = req.headers.authorization;
  if (typeof header === "string" && header.length > 0) return header;
  return undefined;
}

function buildBody(req: FastifyRequest): string | undefined {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  if (req.body === undefined || req.body === null) return undefined;
  if (typeof req.body === "string") return req.body;
  return JSON.stringify(req.body);
}

export async function proxyToOpenPlanner(
  req: FastifyRequest<{ Params: { "*": string } }>,
  reply: FastifyReply,
  cfg: ProxyConfig
): Promise<void> {
  const path = req.params["*"] ?? "";
  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const targetUrl = `${normalizeBase(cfg.baseUrl)}/${path}${query}`;

  const headers: Record<string, string> = {
    "content-type": "application/json"
  };

  const auth = getForwardedAuthorization(req, cfg.apiKey);
  if (auth) headers.authorization = auth;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: buildBody(req)
    });

    reply.code(response.status);
    const contentType = response.headers.get("content-type") ?? "application/json";
    reply.header("content-type", contentType);

    const payloadText = await response.text();
    if (!payloadText) {
      reply.send("");
      return;
    }

    if (contentType.includes("application/json")) {
      reply.send(JSON.parse(payloadText));
      return;
    }

    reply.send(payloadText);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    reply.code(502).send({ ok: false, error: `openplanner upstream error: ${message}` });
  }
}

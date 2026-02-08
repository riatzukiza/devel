import type { FastifyReply, FastifyRequest } from "fastify";

type ProxyConfig = {
  baseUrl: string;
  apiKey: string | null;
};

function normalizeBase(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function getForwardedAuthorization(req: FastifyRequest, apiKey: string | null): string | undefined {
  const header = req.headers.authorization;
  if (typeof header === "string" && header.length > 0) return header;
  if (apiKey && apiKey.length > 0) return `Bearer ${apiKey}`;
  return undefined;
}

function buildBody(req: FastifyRequest): string | undefined {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  if (req.body === undefined || req.body === null) return undefined;
  if (typeof req.body === "string") return req.body;
  return JSON.stringify(req.body);
}

function buildHeaders(req: FastifyRequest, apiKey: string | null, hasBody: boolean): Record<string, string> {
  const headers: Record<string, string> = {};
  const requestContentType = req.headers["content-type"];
  const requestAccept = req.headers.accept;

  if (typeof requestAccept === "string" && requestAccept.length > 0) {
    headers.accept = requestAccept;
  }

  if (hasBody) {
    headers["content-type"] =
      typeof requestContentType === "string" && requestContentType.length > 0
        ? requestContentType
        : "application/json";
  }

  const auth = getForwardedAuthorization(req, apiKey);
  if (auth) headers.authorization = auth;

  return headers;
}

export async function proxyToOpencode(
  req: FastifyRequest<{ Params: { "*": string } }>,
  reply: FastifyReply,
  cfg: ProxyConfig
): Promise<void> {
  const path = req.params["*"] ?? "";
  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const targetUrl = `${normalizeBase(cfg.baseUrl)}/${path}${query}`;
  const body = buildBody(req);
  const headers = buildHeaders(req, cfg.apiKey, body !== undefined);

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body
    });

    reply.code(response.status);
    const contentType = response.headers.get("content-type") ?? "application/json";
    reply.header("content-type", contentType);
    const cacheControl = response.headers.get("cache-control");
    if (cacheControl) {
      reply.header("cache-control", cacheControl);
    }

    if (contentType.includes("text/event-stream") && response.body) {
      reply.hijack();
      const raw = reply.raw;
      const reader = response.body.getReader();
      const pipeStream = async (): Promise<void> => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value && value.length > 0) {
            raw.write(Buffer.from(value));
          }
        }
        raw.end();
      };

      void pipeStream().catch((streamError: unknown) => {
        req.log.error({ error: streamError }, "failed to stream opencode response");
        if (!raw.writableEnded) {
          raw.end();
        }
      });
      return;
    }

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
    reply.code(502).send({ ok: false, error: `opencode upstream error: ${message}` });
  }
}

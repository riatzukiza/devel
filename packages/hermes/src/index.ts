import { createHmac, timingSafeEqual } from "node:crypto";

import express, {
  type Express as ExpressApp,
  type NextFunction as ExpressNext,
  type Request as ExpressRequest,
  type RequestHandler as ExpressRequestHandler,
  type Response as ExpressResponse,
} from "express";

export type FamilyProxyOptions = {
  serviceName: string;
  legacyMcpUrl: string;
  allowedTools: readonly string[];
  allowUnauthLocal: boolean;
  sharedSecret: string;
};

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }
  return undefined;
}

function normalizeHost(value: string | undefined): string {
  if (!value) return "";
  const first = value.split(",")[0]?.trim() ?? "";
  const noBrackets = first.replace(/^\[/, "").replace(/\]$/, "");
  const hostPart = noBrackets.split(":")[0] ?? "";
  return hostPart.toLowerCase();
}

function normalizeForwardedIp(value: string | undefined): string {
  if (!value) return "";
  return (value.split(",")[0] ?? "").trim().toLowerCase();
}

function isLoopbackAddress(value: string): boolean {
  const addr = value.toLowerCase();
  return (
    addr === "::1" ||
    addr === "127.0.0.1" ||
    addr === "::ffff:127.0.0.1" ||
    addr.startsWith("127.")
  );
}

function isLocalHost(value: string): boolean {
  return value === "localhost" || value === "127.0.0.1" || value === "::1";
}

function isValidGatewaySignature(req: ExpressRequest, secret: string): boolean {
  if (secret.length === 0) {
    return false;
  }

  const ts = firstHeaderValue(req.headers["x-mcp-gateway-ts"] as string | string[] | undefined);
  const sig = firstHeaderValue(req.headers["x-mcp-gateway-sig"] as string | string[] | undefined);
  if (!ts || !sig) {
    return false;
  }

  const tsNum = Number.parseInt(ts, 10);
  if (!Number.isFinite(tsNum)) {
    return false;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - tsNum) > 60) {
    return false;
  }

  const pathWithQuery = req.originalUrl || req.url;
  const expected = createHmac("sha256", secret)
    .update(req.method.toUpperCase())
    .update("\n")
    .update(pathWithQuery)
    .update("\n")
    .update(ts)
    .digest("hex");

  const provided = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (provided.length !== expectedBuf.length) {
    return false;
  }
  return timingSafeEqual(provided, expectedBuf);
}

function buildProxyHeaders(req: ExpressRequest, bodyPresent: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    accept: firstHeaderValue(req.headers.accept as string | string[] | undefined) ?? "application/json, text/event-stream",
  };

  const auth = firstHeaderValue(req.headers.authorization as string | string[] | undefined);
  const sessionId = firstHeaderValue(req.headers["mcp-session-id"] as string | string[] | undefined);
  const requestId = firstHeaderValue(req.headers["x-request-id"] as string | string[] | undefined);
  const protocolVersion = firstHeaderValue(req.headers["mcp-protocol-version"] as string | string[] | undefined);
  if (auth) headers.authorization = auth;
  if (sessionId) headers["mcp-session-id"] = sessionId;
  if (requestId) headers["x-request-id"] = requestId;
  if (protocolVersion) headers["mcp-protocol-version"] = protocolVersion;
  if (bodyPresent) {
    headers["content-type"] = firstHeaderValue(req.headers["content-type"] as string | string[] | undefined) ?? "application/json";
  }
  return headers;
}

function filterToolsPayload(payload: unknown, allowedSet: ReadonlySet<string>): unknown {
  if (!payload || typeof payload !== "object") {
    return payload;
  }
  const record = payload as Record<string, unknown>;
  const result = record.result;
  if (!result || typeof result !== "object") {
    return payload;
  }
  const resultRecord = result as Record<string, unknown>;
  const tools = resultRecord.tools;
  if (!Array.isArray(tools)) {
    return payload;
  }

  const filteredTools = tools.filter((tool) => {
    if (!tool || typeof tool !== "object") {
      return false;
    }
    const name = (tool as Record<string, unknown>).name;
    return typeof name === "string" && allowedSet.has(name);
  });

  return {
    ...record,
    result: {
      ...resultRecord,
      tools: filteredTools,
    },
  };
}

function filterToolsEventStream(bodyText: string, allowedSet: ReadonlySet<string>): string {
  return bodyText
    .split("\n")
    .map((line) => {
      if (!line.startsWith("data: ")) {
        return line;
      }
      const jsonText = line.slice(6);
      try {
        const parsed = JSON.parse(jsonText) as unknown;
        const filtered = filterToolsPayload(parsed, allowedSet);
        return `data: ${JSON.stringify(filtered)}`;
      } catch {
        return line;
      }
    })
    .join("\n");
}

function relayHeaders(reply: ExpressResponse, upstream: globalThis.Response): void {
  const contentType = upstream.headers.get("content-type");
  const cacheControl = upstream.headers.get("cache-control");
  const mcpSessionId = upstream.headers.get("mcp-session-id");
  const expose = upstream.headers.get("access-control-expose-headers");

  if (contentType) reply.setHeader("content-type", contentType);
  if (cacheControl) reply.setHeader("cache-control", cacheControl);
  if (mcpSessionId) reply.setHeader("mcp-session-id", mcpSessionId);
  if (expose) reply.setHeader("access-control-expose-headers", expose);
}

async function forwardToLegacy(
  req: ExpressRequest,
  reply: ExpressResponse,
  legacyMcpUrl: string,
  allowedSet: ReadonlySet<string>,
): Promise<void> {
  const body = req.method === "POST" ? req.body : undefined;
  const headers = buildProxyHeaders(req, body !== undefined);
  const upstream = await fetch(`${legacyMcpUrl}/mcp${req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`, {
    method: req.method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  relayHeaders(reply, upstream);

  if (req.method === "POST" && body && typeof body === "object") {
    const rpc = body as Record<string, unknown>;
    if (rpc.method === "tools/list") {
      const raw = await upstream.text();
      const contentType = upstream.headers.get("content-type") ?? "";
      reply.status(upstream.status);
      if (contentType.includes("text/event-stream")) {
        reply.send(filterToolsEventStream(raw, allowedSet));
        return;
      }
      try {
        const parsed = JSON.parse(raw) as unknown;
        reply.json(filterToolsPayload(parsed, allowedSet));
      } catch {
        reply.send(raw);
      }
      return;
    }
  }

  const text = await upstream.text();
  reply.status(upstream.status).send(text);
}

function unauthorizedToolResult(id: unknown, toolName: string): Record<string, unknown> {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    error: {
      code: -32601,
      message: `Tool not available in this service: ${toolName}`,
    },
  };
}

export function createFamilyProxyApp(options: FamilyProxyOptions): ExpressApp {
  const app = express();
  const allowedSet = new Set(options.allowedTools);

  app.use(express.json({ limit: "10mb" }));

  const maybeBearer: ExpressRequestHandler = (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
    const remoteAddr = req.socket?.remoteAddress ?? "";
    const rawForwardedHost = firstHeaderValue(req.headers["x-forwarded-host"] as string | string[] | undefined);
    const rawHost = firstHeaderValue(req.headers.host as string | string[] | undefined);
    const effectiveHost = normalizeHost(rawForwardedHost ?? rawHost);
    const rawForwardedFor = firstHeaderValue(req.headers["x-forwarded-for"] as string | string[] | undefined);
    const forwardedClientIp = normalizeForwardedIp(rawForwardedFor);

    const isLocalRequest = isLocalHost(effectiveHost) &&
      (forwardedClientIp.length === 0 || isLoopbackAddress(forwardedClientIp)) &&
      isLoopbackAddress(remoteAddr);
    if (isLocalRequest) {
      return next();
    }

    const isLoopbackOnly =
      isLoopbackAddress(remoteAddr) &&
      (forwardedClientIp.length === 0 || isLoopbackAddress(forwardedClientIp)) &&
      (effectiveHost.length === 0 || isLocalHost(effectiveHost));
    if (options.allowUnauthLocal && isLoopbackOnly) {
      return next();
    }

    if (isValidGatewaySignature(req, options.sharedSecret)) {
      return next();
    }

    res.status(401).json({
      ok: false,
      error: "unauthorized",
      message: "missing valid gateway assertion; route through api-gateway or use loopback-only local access",
    });
  };

  app.get("/health", (_req: ExpressRequest, res: ExpressResponse) => {
    res.json({ ok: true, service: options.serviceName });
  });

  app.post("/mcp", maybeBearer, async (req: ExpressRequest, res: ExpressResponse) => {
    const body = req.body as Record<string, unknown> | undefined;
    if (body?.method === "tools/call") {
      const params = body.params as Record<string, unknown> | undefined;
      const name = typeof params?.name === "string" ? params.name : "";
      if (!allowedSet.has(name)) {
        res.status(200).json(unauthorizedToolResult(body.id, name));
        return;
      }
    }

    await forwardToLegacy(req, res, options.legacyMcpUrl, allowedSet);
  });

  app.get("/mcp", maybeBearer, async (req: ExpressRequest, res: ExpressResponse) => {
    await forwardToLegacy(req, res, options.legacyMcpUrl, allowedSet);
  });

  app.delete("/mcp", maybeBearer, async (req: ExpressRequest, res: ExpressResponse) => {
    await forwardToLegacy(req, res, options.legacyMcpUrl, allowedSet);
  });

  return app;
}

export function startFamilyProxyServer(options: FamilyProxyOptions, port: number): void {
  const app = createFamilyProxyApp(options);
  app.listen(port, "0.0.0.0", () => {
    console.log(`[${options.serviceName}] Server running on port ${port}`);
    console.log(`[${options.serviceName}] LEGACY_MCP_URL: ${options.legacyMcpUrl}`);
  });
}

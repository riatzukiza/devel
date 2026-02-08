import type { FastifyReply, FastifyRequest } from "fastify";

type ProxyConfig = {
  baseUrl: string;
};

function normalizeBase(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function getForwardedAuthorization(req: FastifyRequest): string | undefined {
  const header = req.headers.authorization;
  if (typeof header === "string" && header.length > 0) return header;
  return undefined;
}

function buildHeaders(req: FastifyRequest, hasBody: boolean): Record<string, string> {
  const requestAccept = req.headers.accept;
  const requestContentType = req.headers["content-type"];

  const baseHeaders: Record<string, string> = {};
  if (typeof requestAccept === "string" && requestAccept.length > 0) {
    baseHeaders.accept = requestAccept;
  }

  if (hasBody) {
    // OAuth token endpoints require form-urlencoded content-type
    const contentType = typeof requestContentType === "string" && requestContentType.length > 0
      ? requestContentType
      : (typeof req.body === "object" && req.body !== null ? "application/json" : "application/json");
    
    baseHeaders["content-type"] = contentType;
  }

  const auth = getForwardedAuthorization(req);
  const mcpSessionId = req.headers["mcp-session-id"];

  const forwardHost = typeof req.headers.host === "string" ? req.headers.host : undefined;
  
  const finalHeaders: Record<string, string> = {
    ...baseHeaders,
    ...(auth ? { authorization: auth } : {}),
    ...(typeof mcpSessionId === "string" && mcpSessionId.length > 0 ? { "mcp-session-id": mcpSessionId } : {}),
    // Forward original host for proper auth routing
    ...(forwardHost ? { host: forwardHost } : {}),
  };

  return finalHeaders;
}

function buildBody(req: FastifyRequest): string | undefined {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  if (req.body === undefined || req.body === null) return undefined;
  
  const contentType = req.headers["content-type"];
  const isFormUrlencoded = typeof contentType === "string" &&
    contentType.includes("application/x-www-form-urlencoded");

  if (typeof req.body === "string") {
    // If this is a form-urlencoded request, prefer forwarding the original
    // form body as-is. Some upstreams may accidentally send JSON as a string
    // while still labeling the request as form-urlencoded; in that case,
    // attempt a best-effort conversion back to form encoding.
    if (!isFormUrlencoded) return req.body;

    // Already form encoded
    if (req.body.includes("=") || req.body.includes("&")) return req.body;

    try {
      const parsed = JSON.parse(req.body) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
          if (typeof value === "string") {
            params.append(key, value);
          }
        }
        const asForm = params.toString();
        if (asForm.length > 0) return asForm;
      }
    } catch {
      // ignore
    }
    return req.body;
  }

  if (isFormUrlencoded && typeof req.body === "object") {
    // Convert parsed object back to form-urlencoded format
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === "string") {
        params.append(key, value);
      } else if (Array.isArray(value)) {
        for (const v of value) {
          if (typeof v === "string") {
            params.append(key, v);
          }
        }
      }
    }
    return params.toString();
  }

  return JSON.stringify(req.body);
}

export async function proxyToMcp(
  req: FastifyRequest,
  reply: FastifyReply,
  cfg: ProxyConfig,
  stripPrefix?: string
): Promise<void> {
  const urlObj = new URL(req.url, "http://localhost");
  const rawPath = urlObj.pathname;
  
  const pathWithPrefix = stripPrefix && rawPath.startsWith(stripPrefix) 
    ? rawPath.slice(stripPrefix.length) 
    : rawPath;
  
  const path = pathWithPrefix.startsWith("/") 
    ? pathWithPrefix.slice(1) 
    : pathWithPrefix;

  const query = urlObj.search;
  const targetUrl = `${normalizeBase(cfg.baseUrl)}/${path}${query}`;
  const body = buildBody(req);
  const headers = buildHeaders(req, body !== undefined);

  // Create redacted headers for logging (never log Authorization header)
  const redactedHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (key.toLowerCase() === "authorization") {
      redactedHeaders[key] = "[REDACTED]";
    } else if (typeof value === "string") {
      redactedHeaders[key] = value;
    }
  }

  // Token exchange detection for enhanced logging
  const isTokenEndpoint = path.includes("token");
  if (isTokenEndpoint) {
    req.log.info({ 
      targetUrl, 
      method: req.method, 
      contentType: req.headers["content-type"], 
      bodyLength: body?.length,
      headers: redactedHeaders 
    }, "token exchange request");
  } else {
    req.log.info({ 
      targetUrl, 
      method: req.method, 
      contentType: req.headers["content-type"], 
      body,
      headers: redactedHeaders 
    }, "proxying to MCP");
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type") ?? "application/json";
    const cacheControl = response.headers.get("cache-control");
    const location = response.headers.get("location");
    const mcpSessionId = response.headers.get("mcp-session-id");

    const replyWithHeaders = reply.code(response.status)
      .header("content-type", contentType)
      .header("Access-Control-Allow-Origin", "*")
      .header("Access-Control-Expose-Headers", "mcp-session-id, x-mcp-session-id");
    
    const replyWithCache = cacheControl 
      ? replyWithHeaders.header("cache-control", cacheControl) 
      : replyWithHeaders;
    
    const replyWithLocation = location 
      ? replyWithCache.header("location", location) 
      : replyWithCache;

    const finalReply = mcpSessionId 
      ? replyWithLocation.header("mcp-session-id", mcpSessionId) 
      : replyWithLocation;

    if (contentType.includes("text/event-stream") && response.body) {
      finalReply.hijack();
      const raw = finalReply.raw;
      
      // Write headers manually for hijacked response
      raw.writeHead(response.status, {
        "content-type": contentType,
        "cache-control": cacheControl ?? "no-cache",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "mcp-session-id",
        ...(mcpSessionId ? { "mcp-session-id": mcpSessionId } : {}),
      });
      
      const reader = response.body.getReader();
      
      const pipeStream = async (): Promise<void> => {
        const streamRecursive = async (): Promise<void> => {
          const { done, value } = await reader.read();
          if (done) {
            raw.end();
            return;
          }
          if (value && value.length > 0) {
            raw.write(Buffer.from(value));
          }
          return streamRecursive();
        };
        return streamRecursive();
      };

      void pipeStream().catch((streamError: unknown) => {
        req.log.error({ error: streamError }, "failed to stream MCP response");
        if (!raw.writableEnded) {
          raw.end();
        }
      });
      return;
    }

    const payloadText = await response.text();
    
    // Enhanced logging for token exchange responses
    if (isTokenEndpoint) {
      const statusCategory = response.status >= 400 ? "error" : "success";
      req.log.info({ 
        statusCode: response.status,
        statusCategory,
        contentType,
        payloadLength: payloadText.length,
        isError: response.status >= 400
      }, `token exchange ${statusCategory}`);
      
      // Log error details (redacted) for failed token exchanges
      if (response.status >= 400) {
        const redactedPayload = payloadText
          .replace(/code_verifier=[^&"]+/g, "code_verifier=[REDACTED]")
          .replace(/client_secret=[^&"]+/g, "client_secret=[REDACTED]")
          .replace(/code_challenge=[^&"]+/g, "code_challenge=[REDACTED]")
          .replace(/refresh_token=[^&"]+/g, "refresh_token=[REDACTED]")
          .replace(/access_token=[^&"]+/g, "access_token=[REDACTED]");
        
        req.log.warn({ 
          statusCode: response.status,
          responseBody: redactedPayload.substring(0, 500)
        }, "token exchange failed");
      }
    }

    if (!payloadText) {
      return finalReply.send("");
    }

    if (contentType.includes("application/json")) {
      return finalReply.send(JSON.parse(payloadText));
    }

    return finalReply.send(payloadText);
   } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    
    // Check if this was a timeout error
    const isTimeout = message.includes("aborted") || message.includes("timeout") || message.includes("AbortError");
    
    // Enhanced error logging for token exchange failures
    if (isTokenEndpoint) {
      req.log.error({ 
        error: message,
        targetUrl,
        method: req.method,
        isTimeout,
        timeoutMs: 30000
      }, isTimeout ? "token exchange timeout" : "token exchange proxy error");
    }
    
    // Return 504 Gateway Timeout for timeout errors, 502 for others
    return reply.code(isTimeout ? 504 : 502).send({ 
      ok: false, 
      error: isTimeout ? `mcp-fs-oauth upstream timeout: ${message}` : `mcp-fs-oauth upstream error: ${message}` 
    });
  }
}

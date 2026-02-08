import "dotenv/config";
import { randomUUID } from "node:crypto";
import path from "node:path";

import express from "express";
import cors from "cors";
import proxy from "express-http-proxy";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Redis } from "ioredis";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { mcpAuthRouter, getOAuthProtectedResourceMetadataUrl } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";

import { SimpleOAuthProvider } from "./auth/simpleOAuthProvider.js";
import { installLoginUi } from "./auth/loginUi.js";
import { LocalFsBackend } from "./fs/localFs.js";
import { GitHubRepoBackend } from "./fs/githubFs.js";
import { VirtualFs } from "./fs/virtualFs.js";
import type { FsBackendName } from "./fs/types.js";

type LoginProvider = "password" | "github" | "google";

const ENV = z.object({
  PORT: z.coerce.number().default(3000),
  PUBLIC_BASE_URL: z.string().url(),
  ISSUER_URL: z.string().url().optional(),

  AUTH_LOGIN_PROVIDER: z.enum(["password", "github", "google"]).default("password"),
  OWNER_PASSWORD: z.string().optional(),

  GITHUB_LOGIN_CLIENT_ID: z.string().optional().default(process.env.OAUTH_GITHUB_CLIENT_ID || ""),
  GITHUB_LOGIN_CLIENT_SECRET: z.string().optional().default(process.env.OAUTH_GITHUB_CLIENT_SECRET || ""),
  OAUTH_GITHUB_REDIRECT_URI: z.string().url().optional(),
  GITHUB_ALLOWED_USERS: z.string().optional(),

  GOOGLE_LOGIN_CLIENT_ID: z.string().optional(),
  GOOGLE_LOGIN_CLIENT_SECRET: z.string().optional(),
  GOOGLE_ALLOWED_EMAILS: z.string().optional(),

  AUTO_APPROVE: z.string().optional(),
  TRUSTED_CLIENT_IDS: z.string().optional(),

  STORAGE_MODE: z.enum(["auto", "local", "github"]).default("auto"),
  LOCAL_ROOT: z.string().default("/home/err/devel/"),

  GITHUB_REPO_OWNER: z.string().optional(),
  GITHUB_REPO_NAME: z.string().optional(),
  GITHUB_REPO_BRANCH: z.string().default("main"),
  GITHUB_REPO_PREFIX: z.string().optional(),
  GITHUB_REPO_TOKEN: z.string().optional(),
  
  // OAuth persistence configuration
  OAUTH_PERSISTENCE_PATH: z.string().optional().default("./data/oauth.json"),
}).parse(process.env);

const publicBaseUrl = new URL(ENV.PUBLIC_BASE_URL);
const issuerUrl = new URL(ENV.ISSUER_URL ?? ENV.PUBLIC_BASE_URL);
const resourceServerUrl = new URL("/mcp", publicBaseUrl);

const oauth = new SimpleOAuthProvider(publicBaseUrl, toBool(ENV.AUTO_APPROVE), [
  {
    client_id: "mcp_client_1761003752457_1krtcyb4oxe",
    client_secret: "",
    client_name: "ChatGPT",
    redirect_uris: ["https://chatgpt.com/connector_platform_oauth_redirect"],
    token_endpoint_auth_method: "client_secret_basic",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"]
  }
], 60 * 60, 30 * 24 * 60 * 60, ENV.OAUTH_PERSISTENCE_PATH);

const mode = ENV.STORAGE_MODE as FsBackendName;
const local = new LocalFsBackend(path.resolve(ENV.LOCAL_ROOT));
const github = (ENV.GITHUB_REPO_OWNER && ENV.GITHUB_REPO_NAME && ENV.GITHUB_REPO_TOKEN)
  ? new GitHubRepoBackend(
      ENV.GITHUB_REPO_OWNER,
      ENV.GITHUB_REPO_NAME,
      ENV.GITHUB_REPO_BRANCH,
      ENV.GITHUB_REPO_TOKEN,
      ENV.GITHUB_REPO_PREFIX
    )
  : null;

const vfs = new VirtualFs(mode, local, github);

const app = express();

// Apply body parsers only to non-OAuth routes
// OAuth routes need raw body for SDK to parse form-urlencoded data
const jsonParser = express.json({ limit: "25mb" });
const urlencodedParser = express.urlencoded({ extended: true });

app.use(cors({
  origin: "*",
  exposedHeaders: ["mcp-session-id"],
}));

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`, {
    host: req.headers.host,
    sessionId: req.headers["mcp-session-id"],
    contentType: req.headers["content-type"],
  });
  next();
});

app.get("/auth/oauth/login", (req, res) => {
  const query = new URLSearchParams(req.query as Record<string, string>).toString();
  res.redirect(307, `/authorize${query ? "?" + query : ""}`);
});

app.get("/auth/oauth/callback", (req, res) => {
  const query = new URLSearchParams(req.query as Record<string, string>).toString();
  res.redirect(307, `/oauth/callback/github${query ? "?" + query : ""}`);
});

// Direct token exchange handler - bypasses proxy issues
app.post("/auth/oauth/callback", express.raw({ type: "application/x-www-form-urlencoded" }), async (req, res) => {
  try {
    // Parse form-urlencoded body from raw buffer
    const bodyBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body));
    const bodyStr = bodyBuffer.toString("utf8").trim();
    
    let body: Record<string, string> = {};
    
    // 1) Try x-www-form-urlencoded first
    const params = new URLSearchParams(bodyStr);
    for (const [key, value] of params.entries()) {
      body[key] = value;
    }
    
    // 2) If that produced nothing and body looks like JSON, parse JSON and convert
    if (Object.keys(body).length === 0 && bodyStr.startsWith("{")) {
      try {
        const obj = JSON.parse(bodyStr);
        for (const [k, v] of Object.entries(obj)) {
          if (typeof v === "string") {
            body[k] = v;
          }
        }
        console.log("[token-exchange] body was JSON string; converted to form fields");
      } catch (e) {
        console.log("[token-exchange] failed JSON fallback parse:", e);
      }
    }
    
    console.log("[token-exchange] parsed body:", {
      grant_type: body.grant_type,
      has_client_id: !!body.client_id,
      has_code: !!body.code,
      has_code_verifier: !!body.code_verifier,
      has_redirect_uri: !!body.redirect_uri,
    });
    
    // Extract client_id from Basic auth header and add to body
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Basic ")) {
      try {
        const base64Credentials = authHeader.slice(6);
        const credentials = Buffer.from(base64Credentials, "base64").toString("utf8");
        const [clientId] = credentials.split(":");
        if (clientId && !body.client_id) {
          body.client_id = clientId;
          console.log("[token-exchange] extracted client_id from Basic auth:", clientId.substring(0, 20) + "...");
        }
      } catch (e) {
        console.error("[token-exchange] failed to parse Basic auth:", e);
      }
    }
    
    // Forward to local token endpoint with original headers
    const tokenResponse = await fetch("http://127.0.0.1:3001/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: new URLSearchParams(body).toString(),
    });
    
    const responseBody = await tokenResponse.text();
    const upstreamContentType = tokenResponse.headers.get("content-type") ?? "application/json";
    const upstreamCacheControl = tokenResponse.headers.get("cache-control");
    
    // Log and forward response
    if (tokenResponse.status >= 400) {
      console.log("[token-exchange] ERROR", tokenResponse.status, responseBody.substring(0, 200));
    }
    
    res.status(tokenResponse.status);
    res.setHeader("content-type", upstreamContentType);
    if (upstreamCacheControl) res.setHeader("cache-control", upstreamCacheControl);
    res.send(responseBody);
  } catch (e) {
    console.error("[token-exchange] proxy error:", e);
    res.status(502).json({
      error: "bad_gateway",
      message: "Failed to process token exchange"
    });
  }
});

// Mount OAuth router BEFORE body parsers - it handles its own body parsing
app.use(mcpAuthRouter({
  provider: oauth,
  issuerUrl,
  baseUrl: publicBaseUrl,
  resourceServerUrl,
  scopesSupported: ["mcp"],
  resourceName: "mcp-fs-oauth",
}));

installLoginUi(app, oauth, {
  publicBaseUrl,
  loginProvider: ENV.AUTH_LOGIN_PROVIDER as LoginProvider,
  ownerPassword: ENV.OWNER_PASSWORD,
  githubClientId: ENV.GITHUB_LOGIN_CLIENT_ID,
  githubClientSecret: ENV.GITHUB_LOGIN_CLIENT_SECRET,
  githubRedirectUri: ENV.OAUTH_GITHUB_REDIRECT_URI,
  githubAllowedUsers: splitList(ENV.GITHUB_ALLOWED_USERS),
  googleClientId: ENV.GOOGLE_LOGIN_CLIENT_ID,
  googleClientSecret: ENV.GOOGLE_LOGIN_CLIENT_SECRET,
  googleAllowedEmails: splitList(ENV.GOOGLE_ALLOWED_EMAILS),
});

app.get("/health", (_req, res) => res.json({ ok: true }));

const transports = new Map<string, StreamableHTTPServerTransport>();

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
});

redis.on("connect", () => {
  console.log("[redis] Connected to Redis");
});

redis.on("error", (err) => {
  console.error("[redis] Redis connection error:", err.message);
});

function createServer(): McpServer {
  const server = new McpServer({
    name: "mcp-fs-oauth",
    version: "0.1.0",
  });

  server.registerTool(
    "fs_list",
    {
      description: "List directory entries",
      inputSchema: {
        path: z.string().optional().default(""),
        backend: z.enum(["auto", "local", "github"]).optional(),
      }
    },
    async ({ path, backend }) => {
      const entries = await vfs.list(path, backend);
      return {
        content: [{ type: "text", text: JSON.stringify(entries, null, 2) }],
      };
    }
  );

  server.registerTool(
    "fs_read",
    {
      description: "Read file content",
      inputSchema: {
        path: z.string(),
        backend: z.enum(["auto", "local", "github"]).optional(),
      }
    },
    async ({ path, backend }) => {
      const out = await vfs.readFile(path, backend);
      return {
        content: [{ type: "text", text: JSON.stringify(out, null, 2) }],
      };
    }
  );

  server.registerTool(
    "fs_write",
    {
      description: "Write file content",
      inputSchema: {
        path: z.string(),
        content: z.string(),
        message: z.string().optional(),
        backend: z.enum(["auto", "local", "github"]).optional(),
      }
    },
    async ({ path, content, message, backend }) => {
      const out = await vfs.writeFile(path, content, message, backend);
      return {
        content: [{ type: "text", text: JSON.stringify(out, null, 2) }],
      };
    }
  );

  server.registerTool(
    "fs_delete",
    {
      description: "Delete a file or directory",
      inputSchema: {
        path: z.string(),
        message: z.string().optional(),
        backend: z.enum(["auto", "local", "github"]).optional(),
      }
    },
    async ({ path, message, backend }) => {
      const out = await vfs.deletePath(path, message, backend);
      return {
        content: [{ type: "text", text: JSON.stringify(out, null, 2) }],
      };
    }
  );

  server.resource("workspace-root", "fs://root", async (uri) => {
    return {
      contents: [{
        uri: uri.href,
        text: "Workspace root resource. Use fs_list tool to browse files.",
        mimeType: "text/plain"
      }]
    };
  });

  return server;
}

const resourceMetadataUrl = getOAuthProtectedResourceMetadataUrl(resourceServerUrl);

const bearer = requireBearerAuth({
  verifier: oauth,
  requiredScopes: ["mcp"],
  resourceMetadataUrl,
});

const maybeBearer: express.RequestHandler = (req, res, next) => {
  // Check if unauthenticated local access is enabled via environment
  const allowUnauthLocal = process.env.ALLOW_UNAUTH_LOCAL === "true";
  
  if (!allowUnauthLocal) {
    return bearer(req, res, next);
  }
  
  // Verify actual connection is from loopback, don't trust Host header
  const remoteAddr = req.socket?.remoteAddress ?? "";
  const isLoopback = remoteAddr === "::1" || 
                     remoteAddr === "127.0.0.1" ||
                     remoteAddr === "::ffff:127.0.0.1" ||
                     remoteAddr.startsWith("127.");
  
  if (isLoopback) {
    return next();
  }
  
  // For non-loopback connections, require authentication
  return bearer(req, res, next);
};

// Apply body parsers to MCP routes that need JSON parsing
app.post("/mcp", jsonParser, maybeBearer, async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  const transport = sessionId ? transports.get(sessionId) : undefined;

  if (!transport) {
    if (!isInitializeRequest(req.body)) {
      return res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Bad Request: Server not initialized" },
        id: null,
      });
    }

    const newTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: randomUUID,
      onsessioninitialized: async (sid) => {
        transports.set(sid, newTransport);
        await redis.setex(`mcp:session:${sid}`, 3600, JSON.stringify({
          createdAt: Date.now(),
          processId: process.pid,
        }));
      },
    });

    newTransport.onclose = () => {
      if (newTransport.sessionId) {
        transports.delete(newTransport.sessionId);
        redis.del(`mcp:session:${newTransport.sessionId}`).catch(console.error);
      }
    };

    const server = createServer();
    
    // Log that server was created (tools and resources are registered in createServer)
    console.log("[mcp] Server created with VirtualFs backend");
    
    await server.connect(newTransport);
    await newTransport.handleRequest(req, res, req.body);
    return;
  }

  await transport.handleRequest(req, res, req.body);
});

async function handleSession(req: express.Request, res: express.Response): Promise<void> {
  const sessionId = (req.headers["mcp-session-id"] || req.query.sessionId) as string | undefined;
  if (!sessionId) {
    res.status(400).send("Missing mcp-session-id");
    return;
  }
  
  // Check local transport first
  const localTransport = transports.get(sessionId);
  if (localTransport) {
    await localTransport.handleRequest(req, res);
    return;
  }
  
  // Check Redis for session existence (session from another process)
  const sessionData = await redis.get(`mcp:session:${sessionId}`);
  if (sessionData) {
    res.status(400).send(`Session ${sessionId} exists on another process. Use sticky sessions.`);
    return;
  }
  
  res.status(400).send(`Invalid mcp-session-id: ${sessionId}`);
}

app.get("/mcp", maybeBearer, async (req, res) => {
  await handleSession(req, res);
});

app.delete("/mcp", maybeBearer, async (req, res) => {
  await handleSession(req, res);
});

// Apply body parsers to other routes that need them
app.use(jsonParser);
app.use(urlencodedParser);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled Error:", err);
  const status = Number(err.status || err.statusCode || 500);
  res.status(status).json({
    error: err.code || "internal_error",
    message: err.message
  });
});

app.listen(ENV.PORT, () => {
  console.log(`mcp-fs-oauth listening on ${ENV.PORT}`);
  console.log(`public base: ${publicBaseUrl.toString()}`);
  console.log(`mcp endpoint: ${resourceServerUrl.toString()}`);
  console.log(`resource metadata: ${resourceMetadataUrl}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nReceived SIGINT, shutting down gracefully...");
  oauth.stop();
  await redis.quit();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nReceived SIGTERM, shutting down gracefully...");
  oauth.stop();
  await redis.quit();
  process.exit(0);
});

function toBool(v?: string): boolean {
  if (!v) return false;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

function splitList(v?: string): string[] | undefined {
  if (!v) return undefined;
  const out = v.split(",").map(s => s.trim()).filter(Boolean);
  return out.length ? out : undefined;
}

import "dotenv/config";
import path from "node:path";

import express from "express";
import cors from "cors";
import proxy from "express-http-proxy";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Redis } from "ioredis";
import { mcpAuthRouter, getOAuthProtectedResourceMetadataUrl } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import {
  createMcpHttpRouter,
  type McpHttpRequest,
  type McpHttpResponse,
} from "@workspace/mcp-runtime";

import { SimpleOAuthProvider } from "./auth/simpleOAuthProvider.js";
import { installLoginUi } from "./auth/loginUi.js";
import { LocalFsBackend } from "./fs/localFs.js";
import { GitHubRepoBackend } from "./fs/githubFs.js";
import { VirtualFs, type TreePageResult } from "./fs/virtualFs.js";
import type { FsBackendName } from "./fs/types.js";
import { listExecCommands, runExecCommand } from "./tools/exec.js";

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

const vfs = new VirtualFs(mode, local, github, path.resolve(ENV.LOCAL_ROOT));

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

function formatTreePageText(page: TreePageResult): string {
  const root = page.path.length > 0 ? page.path : ".";
  const lines: string[] = [page.offset > 0 ? `${root} @${page.offset}` : root];

  if (page.entries.length === 0) {
    lines.push("(empty)");
  } else {
    for (const entry of page.entries) {
      const indent = "  ".repeat(Math.max(0, entry.depth - 1));
      lines.push(`${indent}${entry.name}${entry.kind === "dir" ? "/" : ""}`);
    }
  }

  if (page.hasMore && page.nextCursor) {
    lines.push(`next ${page.nextCursor}`);
  }

  return lines.join("\n");
}

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
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
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
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
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
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: false,
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
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: false,
      }
    },
    async ({ path, message, backend }) => {
      const out = await vfs.deletePath(path, message, backend);
      return {
        content: [{ type: "text", text: JSON.stringify(out, null, 2) }],
      };
    }
  );

  server.registerTool(
    "fs_tree",
    {
      description: "Compact text tree output. Large trees include a next cursor on the last line.",
      inputSchema: {
        path: z.string().optional().default(""),
        maxDepth: z.number().min(1).max(10).optional().default(3),
        cursor: z.string().optional().describe("Opaque cursor from a previous fs_tree page"),
        pageSize: z.number().int().min(1).max(2000).optional().default(250),
        includeHidden: z.boolean().optional().default(false),
        backend: z.enum(["auto", "local", "github"]).optional(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      }
    },
    async ({ path, maxDepth, cursor, pageSize, includeHidden, backend }) => {
      const page = await vfs.treePage(
        path,
        maxDepth,
        {
          cursor,
          pageSize,
          includeHidden,
        },
        backend,
      );

      return {
        content: [{ type: "text", text: formatTreePageText(page) }],
      };
    }
  );

  server.registerTool(
    "fs_glob",
    {
      description: "Find file paths by glob pattern (fast way to narrow scope before fs_read/fs_tree).",
      inputSchema: {
        pattern: z.string().default("**/*").describe("Glob pattern such as **/*.ts or docs/**/*.md"),
        path: z.string().optional().default(""),
        maxResults: z.number().int().min(1).max(1000).optional().default(200),
        includeHidden: z.boolean().optional().default(false),
        includeDirectories: z.boolean().optional().default(true),
        backend: z.enum(["auto", "local", "github"]).optional(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      }
    },
    async ({ pattern, path, maxResults, includeHidden, includeDirectories, backend }) => {
      const result = await vfs.glob(
        pattern,
        {
          path,
          maxResults,
          includeHidden,
          includeDirectories,
        },
        backend,
      );

      const response = {
        ok: true,
        ...result,
        guidance: result.truncated
          ? [
              "Result set hit maxResults; refine pattern or path.",
              "Use fs_grep for content matching after narrowing with fs_glob.",
            ]
          : ["Glob completed without truncation."],
      };

      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }
  );

  server.registerTool(
    "fs_search",
    {
      description: "Search literal text across files. For regex workflows, use fs_grep.",
      inputSchema: {
        query: z.string(),
        path: z.string().optional().default(""),
        glob: z.string().optional().default("*"),
        maxResults: z.number().min(1).max(100).optional().default(50),
        includeHidden: z.boolean().optional().default(false),
        backend: z.enum(["auto", "local", "github"]).optional(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      }
    },
    async ({ query, path, glob, maxResults, includeHidden, backend }) => {
      const results = await vfs.search(query, { path, glob, maxResults, includeHidden }, backend);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  server.registerTool(
    "fs_grep",
    {
      description: "Regex search across files (grep-style). On local backend this uses ripgrep, respecting .gitignore/.ignore by default.",
      inputSchema: {
        pattern: z.string().describe("Regular expression pattern"),
        path: z.string().optional().default(""),
        include: z.string().optional().default("**/*"),
        exclude: z.string().optional().describe("Glob pattern to exclude"),
        maxResults: z.number().int().min(1).max(1000).optional().default(200),
        caseSensitive: z.boolean().optional().default(false),
        includeHidden: z.boolean().optional().default(false),
        backend: z.enum(["auto", "local", "github"]).optional(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      }
    },
    async ({ pattern, path, include, exclude, maxResults, caseSensitive, includeHidden, backend }) => {
      const result = await vfs.grep(
        pattern,
        {
          path,
          include,
          exclude,
          maxResults,
          caseSensitive,
          includeHidden,
        },
        backend,
      );

      const response = {
        ok: true,
        ...result,
        guidance: result.truncated
          ? [
              "Result set hit maxResults; refine pattern/include/path for the next query.",
              "Use fs_glob first to target a smaller file set before fs_grep.",
            ]
          : ["Grep completed without truncation."],
      };

      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }
  );

  server.registerTool(
    "exec_list",
    {
      description: "List all allowlisted shell commands that can be executed",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      }
    },
    async () => {
      const commands = await listExecCommands();
      return {
        content: [{ type: "text", text: JSON.stringify(commands, null, 2) }],
      };
    }
  );

  server.registerTool(
    "exec_run",
    {
      description: "Execute an allowlisted shell command. Invocation must match glob-style allowPatterns (OpenCode-like permissions).",
      inputSchema: {
        commandId: z.string().describe("The ID of the allowlisted command to run"),
        args: z.array(z.string()).optional().describe("Additional arguments (if allowed by command)"),
        timeoutMs: z.number().int().positive().optional().describe("Timeout in milliseconds"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: false,
      }
    },
    async ({ commandId, args, timeoutMs }) => {
      const result = await runExecCommand(commandId, args, timeoutMs);
      return {
        content: [
          { type: "text", text: `Exit code: ${result.exitCode}\n\nStdout:\n${result.stdout}\n\nStderr:\n${result.stderr}` },
        ],
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

const maybeBearer: express.RequestHandler = (req, res, next) => {
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

  // Optional test-mode bypass for loopback-only traffic.
  // Never bypass auth for externally forwarded hosts.
  const allowUnauthLocal = process.env.ALLOW_UNAUTH_LOCAL === "true";
  const isLoopbackOnly =
    isLoopbackAddress(remoteAddr) &&
    (forwardedClientIp.length === 0 || isLoopbackAddress(forwardedClientIp)) &&
    (effectiveHost.length === 0 || isLocalHost(effectiveHost));

  if (allowUnauthLocal && isLoopbackOnly) {
    return next();
  }

  return bearer(req, res, next);
};

const mcpRouter = createMcpHttpRouter({
  createServer,
  onSessionInitialized: async (sessionId: string) => {
    await redis.setex(`mcp:session:${sessionId}`, 3600, JSON.stringify({
      createdAt: Date.now(),
      processId: process.pid,
    }));
  },
  onSessionClosed: async (sessionId: string) => {
    await redis.del(`mcp:session:${sessionId}`);
  },
  onUnknownSession: async (sessionId: string, _req: McpHttpRequest, res: McpHttpResponse) => {
    const sessionData = await redis.get(`mcp:session:${sessionId}`);
    if (!sessionData) {
      return false;
    }

    type SessionRecord = {
      processId?: number;
      createdAt?: number;
    };

    let parsed: SessionRecord | null = null;
    try {
      parsed = JSON.parse(sessionData) as SessionRecord;
    } catch {
      parsed = null;
    }

    const ownerPid = parsed?.processId;
    const hasOwnerPid = typeof ownerPid === "number" && Number.isInteger(ownerPid) && ownerPid > 0;

    // Same process should never miss an in-memory transport for a live session.
    // Treat this as stale metadata and clear it so clients can re-initialize cleanly.
    if (hasOwnerPid && ownerPid === process.pid) {
      await redis.del(`mcp:session:${sessionId}`);
      return false;
    }

    // If another process no longer exists, session metadata is stale.
    if (hasOwnerPid) {
      let alive = true;
      try {
        process.kill(ownerPid, 0);
      } catch {
        alive = false;
      }

      if (!alive) {
        await redis.del(`mcp:session:${sessionId}`);
        return false;
      }
    }

    res.status(409).send(`Session ${sessionId} is owned by another active process. Re-initialize MCP session.`);
    return true;
  },
});

// Apply body parsers to MCP routes that need JSON parsing
app.post("/mcp", jsonParser, maybeBearer, async (req, res) => {
  await mcpRouter.handlePost(req, res);
});

app.get("/mcp", maybeBearer, async (req, res) => {
  await mcpRouter.handleSession(req, res);
});

app.delete("/mcp", maybeBearer, async (req, res) => {
  await mcpRouter.handleSession(req, res);
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

const listener = app.listen(ENV.PORT, () => {
  const address = listener.address();
  const boundPort = typeof address === "object" && address ? address.port : ENV.PORT;
  console.log(`mcp-fs-oauth listening on ${boundPort}`);
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

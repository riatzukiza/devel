import "dotenv/config";
import path from "node:path";
import { createHash } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import { watch, type Dirent, type FSWatcher } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";

import express from "express";
import cors from "cors";
import proxy from "express-http-proxy";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Redis } from "ioredis";
import { createOpencodeClient } from "@promethean-os/opencode-cljs-client";
import { createOpenPlannerClient } from "@promethean-os/openplanner-cljs-client";
import { mcpAuthRouter, getOAuthProtectedResourceMetadataUrl } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import {
  createMcpHttpRouter,
  type McpHttpRequest,
  type McpHttpResponse,
} from "@workspace/aether";

import { SimpleOAuthProvider } from "./auth/simpleOAuthProvider.js";
import { RedisProjectionPersistence } from "./auth/redisProjectionPersistence.js";
import { installLoginUi } from "./auth/loginUi.js";
import { LocalFsBackend } from "./fs/localFs.js";
import { GitHubRepoBackend } from "./fs/githubFs.js";
import {
  VirtualFs,
  type GrepResult,
  type GlobResult,
  type TreePageResult,
} from "./fs/virtualFs.js";
import type { FsBackendName, FsEntry } from "./fs/types.js";
import { listExecCommands, runExecCommand } from "./tools/exec.js";
import { applyPatchText } from "./tools/applyPatch.js";
import { decideUnknownSession, type SessionMirrorRecord } from "./sessionOwnership.js";
import { SessionAliasStore, type IdAliasKind } from "./sessionAliasStore.js";
import { formatPrimaryAgentList, primaryAgentNames } from "./agentCatalog.js";

type LoginProvider = "password" | "github" | "google";
type RestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiCallResult = {
  status: number;
  ok: boolean;
  bodyText: string;
  contentType: string;
  json?: unknown;
};

type SkillScope = "workspace" | "global";

type SkillRoot = {
  scope: SkillScope;
  root: string;
};

type SkillRecord = {
  id: string;
  scope: SkillScope;
  absolutePath: string;
  relativePath: string;
  name: string;
  description: string;
  content: string;
  updatedAt: string;
  eventId: string;
};

type RequestContext = {
  mcpSessionId?: string;
};

// Propagate MCP session id (from HTTP header) into tool handlers.
// Tool handlers do not receive an express.Request, so we use AsyncLocalStorage.
const requestContext = new AsyncLocalStorage<RequestContext>();

function currentMcpSessionId(): string {
  return requestContext.getStore()?.mcpSessionId ?? "";
}

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
  GITHUB_REPO_TOKEN: z.string().optional().default(
    process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "",
  ),

  OPENCODE_API_BASE_URL: z.string().url().default("http://127.0.0.1:8788/api/opencode"),
  OPENCODE_API_KEY: z.string().optional(),
  OPENPLANNER_API_BASE_URL: z.string().url().default("http://127.0.0.1:8788/api/openplanner"),
  OPENPLANNER_API_KEY: z.string().optional(),
  WORKSPACE_API_BASE_URL: z.string().url().default("http://127.0.0.1:8788/api/workspace"),
  WORKSPACE_API_KEY: z.string().optional(),
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  MCP_INTERNAL_SHARED_SECRET: z.string().optional(),

  // OAuth persistence configuration
  OAUTH_PERSISTENCE_PATH: z.string().optional().default("./data/oauth.db"),
  OAUTH_REDIS_PREFIX: z.string().optional().default("oauth"),
  OAUTH_DUCKDB_OWNER: z.string().optional().default("false"),
  OAUTH_DUCKDB_LOCK_TTL_SECONDS: z.coerce.number().int().min(5).max(300).default(30),
  OAUTH_ACCESS_TTL_SECONDS: z.coerce.number().int().min(300).max(7 * 24 * 60 * 60).default(24 * 60 * 60),
  OAUTH_REFRESH_TTL_SECONDS: z.coerce.number().int().min(3600).max(180 * 24 * 60 * 60).default(30 * 24 * 60 * 60),
  MCP_SESSION_TTL_SECONDS: z.coerce.number().int().min(60).max(7 * 24 * 60 * 60).default(24 * 60 * 60),
}).parse(process.env);

const publicBaseUrl = new URL(ENV.PUBLIC_BASE_URL);
const issuerUrl = new URL(ENV.ISSUER_URL ?? ENV.PUBLIC_BASE_URL);
const resourceServerUrl = new URL("/mcp", publicBaseUrl);

const redis = ENV.REDIS_URL
  ? new Redis(ENV.REDIS_URL)
  : new Redis({
      host: ENV.REDIS_HOST || "127.0.0.1",
      port: ENV.REDIS_PORT ?? 6379,
    });

redis.on("connect", () => {
  console.log("[redis] Connected to Redis");
});

redis.on("error", (err) => {
  console.error("[redis] Redis connection error:", err.message);
});

const oauthRedisPrefix = (ENV.OAUTH_REDIS_PREFIX ?? "oauth").trim();
const normalizedOauthRedisPrefix = oauthRedisPrefix.length > 0 ? oauthRedisPrefix : "oauth";
const persistence = new RedisProjectionPersistence({
  redis,
  keyPrefix: normalizedOauthRedisPrefix,
  duckDbPath: path.resolve(ENV.OAUTH_PERSISTENCE_PATH),
  enableDuckDbProjection: toBool(ENV.OAUTH_DUCKDB_OWNER),
  lockKey: `${normalizedOauthRedisPrefix}:duckdb:projection:lock`,
  lockTtlSeconds: ENV.OAUTH_DUCKDB_LOCK_TTL_SECONDS,
  projectionChannel: `${normalizedOauthRedisPrefix}:duckdb:projection:events`,
});
await persistence.init();

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
], ENV.OAUTH_ACCESS_TTL_SECONDS, ENV.OAUTH_REFRESH_TTL_SECONDS, persistence);

const mode = ENV.STORAGE_MODE as FsBackendName;
const local = new LocalFsBackend(path.resolve(ENV.LOCAL_ROOT));
const githubToken = (ENV.GITHUB_REPO_TOKEN ?? "").trim();
const github = (ENV.GITHUB_REPO_OWNER && ENV.GITHUB_REPO_NAME && githubToken)
  ? new GitHubRepoBackend(
      ENV.GITHUB_REPO_OWNER,
      ENV.GITHUB_REPO_NAME,
      ENV.GITHUB_REPO_BRANCH,
      githubToken,
      ENV.GITHUB_REPO_PREFIX
    )
  : null;

const vfs = new VirtualFs(mode, local, github, path.resolve(ENV.LOCAL_ROOT));

const SKILL_EVENT_SOURCE = "opencode-skills";
const SKILL_ROOTS: SkillRoot[] = [
  { scope: "workspace", root: path.resolve(ENV.LOCAL_ROOT, ".opencode/skills") },
  { scope: "global", root: path.resolve(process.env.HOME ?? "/home/err", ".config/opencode/skills") },
];

const skillRegistry = new Map<string, SkillRecord>();
const skillEventMap = new Map<string, SkillRecord>();
const activeSkills = new Set<string>();
const skillWatchers: FSWatcher[] = [];
let skillRefreshTimer: ReturnType<typeof setTimeout> | undefined;

const app = express();
// Requests reach this service via loopback proxy from api-gateway.
// Trust only loopback forwarded headers to avoid express-rate-limit rejecting
// legitimate x-forwarded-for traffic from the gateway.
app.set("trust proxy", "loopback");

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
    const tokenEndpoint = `http://127.0.0.1:${ENV.PORT}/token`;
    const tokenResponse = await fetch(tokenEndpoint, {
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

const introspectionSchema = z.object({
  token: z.string().min(1),
  requiredScopes: z.array(z.string().min(1)).optional(),
});

app.post("/internal/oauth/introspect", jsonParser, async (req, res) => {
  const requiredSecret = (ENV.MCP_INTERNAL_SHARED_SECRET ?? "").trim();
  const providedSecret = firstHeaderValue(req.headers["x-mcp-internal-shared-secret"]);
  const remoteAddr = req.socket?.remoteAddress ?? "";
  const forwardedFor = normalizeForwardedIp(firstHeaderValue(req.headers["x-forwarded-for"]));
  const isLoopbackOnly = isLoopbackAddress(remoteAddr)
    && (forwardedFor.length === 0 || isLoopbackAddress(forwardedFor));

  if (requiredSecret.length > 0 && providedSecret !== requiredSecret) {
    res.status(403).json({
      active: false,
      message: "Invalid internal shared secret",
    });
    return;
  }

  if (requiredSecret.length === 0 && !isLoopbackOnly) {
    res.status(403).json({
      active: false,
      message: "Introspection is restricted to loopback without a shared secret",
    });
    return;
  }

  const parsed = introspectionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      active: false,
      message: "Invalid introspection payload",
    });
    return;
  }

  const { token, requiredScopes = [] } = parsed.data;

  try {
    const authInfo = await oauth.verifyAccessToken(token);
    const hasAllScopes = requiredScopes.every((scope) => authInfo.scopes.includes(scope));
    if (!hasAllScopes) {
      res.status(403).json({
        active: false,
        message: "OAuth token missing required scope",
      });
      return;
    }

    res.json({
      active: true,
      token: authInfo.token,
      clientId: authInfo.clientId,
      scopes: authInfo.scopes,
      expiresAt: authInfo.expiresAt,
      resource: authInfo.resource?.toString(),
      extra: authInfo.extra,
    });
  } catch {
    res.status(401).json({
      active: false,
      message: "Invalid or expired OAuth token",
    });
  }
});

const sessionMirror = new Map<string, { value: string; expiresAtMs: number }>();

function parseSessionHeader(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string" && value[0].length > 0) {
    return value[0];
  }
  return undefined;
}

function resolveMcpSessionIdFromReq(req: Pick<McpHttpRequest, "headers" | "query">): string | undefined {
  const fromHeader = parseSessionHeader(req.headers["mcp-session-id"] as string | string[] | undefined);
  if (fromHeader) {
    return fromHeader;
  }

  const querySessionId = req.query.sessionId;
  if (typeof querySessionId === "string" && querySessionId.length > 0) {
    return querySessionId;
  }
  if (Array.isArray(querySessionId) && typeof querySessionId[0] === "string" && querySessionId[0].length > 0) {
    return querySessionId[0];
  }

  return undefined;
}

function mirrorSetSession(sessionId: string, value: string): void {
  sessionMirror.set(sessionId, {
    value,
    expiresAtMs: Date.now() + (ENV.MCP_SESSION_TTL_SECONDS * 1000),
  });
}

function mirrorGetSession(sessionId: string): string | null {
  const record = sessionMirror.get(sessionId);
  if (!record) {
    return null;
  }
  if (record.expiresAtMs <= Date.now()) {
    sessionMirror.delete(sessionId);
    return null;
  }
  return record.value;
}

function mirrorTouchSession(sessionId: string): void {
  const record = sessionMirror.get(sessionId);
  if (!record) {
    return;
  }
  record.expiresAtMs = Date.now() + (ENV.MCP_SESSION_TTL_SECONDS * 1000);
  sessionMirror.set(sessionId, record);
}

function mirrorDeleteSession(sessionId: string): void {
  sessionMirror.delete(sessionId);
}

async function storeSessionRecord(sessionId: string, record: SessionMirrorRecord): Promise<void> {
  const serialized = JSON.stringify(record);
  mirrorSetSession(sessionId, serialized);
  try {
    await redis.setex(`mcp:session:${sessionId}`, ENV.MCP_SESSION_TTL_SECONDS, serialized);
  } catch (error) {
    console.warn("[session] failed to persist in redis", error);
  }
}

async function loadSessionRecord(sessionId: string): Promise<string | null> {
  try {
    const stored = await redis.get(`mcp:session:${sessionId}`);
    if (stored) {
      mirrorSetSession(sessionId, stored);
      return stored;
    }
  } catch (error) {
    console.warn("[session] failed to read from redis", error);
  }
  return mirrorGetSession(sessionId);
}

async function deleteSessionRecord(sessionId: string): Promise<void> {
  mirrorDeleteSession(sessionId);
  try {
    await redis.del(`mcp:session:${sessionId}`);
  } catch (error) {
    console.warn("[session] failed to delete from redis", error);
  }
}

async function touchSessionRecord(sessionId: string): Promise<void> {
  mirrorTouchSession(sessionId);
  try {
    await redis.expire(`mcp:session:${sessionId}`, ENV.MCP_SESSION_TTL_SECONDS);
  } catch (error) {
    console.warn("[session] failed to extend ttl", error);
  }
}

async function touchOrAdoptSessionRecord(sessionId: string): Promise<void> {
  const rawRecord = await loadSessionRecord(sessionId);
  const decision = decideUnknownSession(rawRecord, process.pid);

  if (decision.action === "allow" && decision.touchOnly) {
    await touchSessionRecord(sessionId);
    return;
  }

  if (decision.action === "allow" && !decision.touchOnly) {
    await storeSessionRecord(sessionId, decision.nextRecord);
  }
}

const FS_TREE_HARD_MAX_DEPTH = 4;
const FS_TREE_HARD_MAX_PAGE_SIZE = 120;
const FS_TREE_ROOT_DEPTH_LIMIT = 2;

function buildFsTreeBlockedMessage(reason: string): string {
  return [
    `[blocked] fs_tree request is too broad: ${reason}`,
    "Use precise discovery flow:",
    "1) fs_glob pattern=\"src/**/*.ts\" path=\"\" maxResults=80",
    "2) fs_grep pattern=\"TODO|FIXME\" include=\"src/**/*.ts\" maxResults=40",
    "3) fs_tree path=\"src/specific-dir\" maxDepth=2 pageSize=40",
  ].join("\n");
}

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

function formatListText(pathValue: string, entries: FsEntry[]): string {
  if (entries.length === 0) {
    return "(empty)";
  }

  const root = pathValue.trim().length > 0 ? pathValue.trim() : ".";
  const lines = [root, ...entries.map((entry) => `${entry.name}${entry.kind === "dir" ? "/" : ""}`)];
  return lines.join("\n");
}

function formatGlobResultText(result: GlobResult): string {
  if (result.matches.length === 0) {
    return "(no matches)";
  }

  const lines = result.matches.map((match) => `${match.path}${match.kind === "dir" ? "/" : ""}`);
  if (result.truncated) {
    lines.push(`#truncated ${result.maxResults}; narrow pattern/path`);
  }
  return lines.join("\n");
}

function formatGrepResultText(result: GrepResult): string {
  if (result.matches.length === 0) {
    return "(no matches)";
  }

  const lines = result.matches.map((match) => `${match.path}:${match.line}: ${match.snippet}`);
  if (result.truncated) {
    lines.push(`#truncated ${result.maxResults}; narrow pattern/include/path`);
  }
  return lines.join("\n");
}

function formatWriteResultText(args: { path: string; bytes: number; backend: FsBackendName; etag?: string }): string {
  const lines = [`wrote ${args.path} (${args.bytes} bytes)`, `backend ${args.backend}`];
  if (args.etag) {
    lines.push(`etag ${args.etag}`);
  }
  return lines.join("\n");
}

const APPLY_PATCH_DESCRIPTION = `Use the \`apply_patch\` tool to edit files. Your patch language is a stripped‑down, file‑oriented diff format designed to be easy to parse and safe to apply. You can think of it as a high‑level envelope:

*** Begin Patch
[ one or more file sections ]
*** End Patch

Within that envelope, you get a sequence of file operations.
You MUST include a header to specify the action you are taking.
Each operation starts with one of three headers:

*** Add File: <path> - create a new file. Every following line is a + line (the initial contents).
*** Delete File: <path> - remove an existing file. Nothing follows.
*** Update File: <path> - patch an existing file in place (optionally with a rename).

Example patch:

\`\`\`
*** Begin Patch
*** Add File: hello.txt
+Hello world
*** Update File: src/app.py
*** Move to: src/main.py
@@ def greet():
-print("Hi")
+print("Hello, world!")
*** Delete File: obsolete.txt
*** End Patch
\`\`\`

It is important to remember:

- You must include a header with your intended action (Add/Delete/Update)
- You must prefix new lines with \`+\` even when creating a new file`;

const API_TEXT_LIMIT = 12000;
const HIGH_ENTROPY_REDACTION = "[redacted:high-entropy]";
const TOKEN_LIKE_PATTERN = /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{20,}|AIza[0-9A-Za-z_-]{20,}|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,})\b/g;
const HIGH_ENTROPY_CANDIDATE_PATTERN = /\b[A-Za-z0-9+/_=-]{28,}\b/g;
const ALL_CAPS_ENV_NAME_PATTERN = /^[A-Z][A-Z0-9_]{2,}$/;
const SECRET_LIKE_ENV_KEYWORD_PATTERN = /KEY|TOKEN|SECRET|PASSWORD|PASS|AUTH|BEARER|SESSION|COOKIE|CREDENTIAL|PRIVATE|SIGNING|OAUTH|CLIENT/;
const ALL_CAPS_ASSIGNMENT_PATTERN = /\b([A-Z][A-Z0-9_]{2,})\s*=\s*([^\s]+)/g;
const LONG_HEX_PATTERN = /\b(?:0x)?[A-Fa-f0-9]{32,}\b/g;
const BASE64URL_BLOB_PATTERN = /\b[A-Za-z0-9_-]{40,}\b/g;
const HIDDEN_PATH_PATTERN = /(^|\/)\./;
const PATCH_FILE_DIRECTIVE_PATTERN = /^\*\*\*\s+(?:Add|Update|Delete)\s+File:\s+(.+)$/;
const PATCH_MOVE_DIRECTIVE_PATTERN = /^\*\*\*\s+Move\s+to:\s+(.+)$/;

function trimSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}\n...truncated (${text.length - maxChars} chars omitted)`;
}

function calculateShannonEntropy(value: string): number {
  if (value.length === 0) {
    return 0;
  }

  const frequencies = new Map<string, number>();
  for (const char of value) {
    frequencies.set(char, (frequencies.get(char) ?? 0) + 1);
  }

  let entropy = 0;
  for (const count of frequencies.values()) {
    const probability = count / value.length;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}

function shouldRedactHighEntropyToken(token: string): boolean {
  if (token.length < 28) {
    return false;
  }

  const classes = [/[a-z]/.test(token), /[A-Z]/.test(token), /\d/.test(token), /[+/_=-]/.test(token)]
    .filter(Boolean)
    .length;
  if (classes < 3) {
    return false;
  }

  const entropy = calculateShannonEntropy(token);
  return entropy >= 4;
}

function redactHighEntropyText(text: string): string {
  const byPattern = text.replace(TOKEN_LIKE_PATTERN, HIGH_ENTROPY_REDACTION);
  return byPattern.replace(HIGH_ENTROPY_CANDIDATE_PATTERN, (candidate) => {
    if (!shouldRedactHighEntropyToken(candidate)) {
      return candidate;
    }
    return HIGH_ENTROPY_REDACTION;
  });
}

function isSecretLikeEnvName(name: string): boolean {
  return ALL_CAPS_ENV_NAME_PATTERN.test(name) && SECRET_LIKE_ENV_KEYWORD_PATTERN.test(name);
}

function truncateIdHint(value: string): string {
  const prefixLength = 8;
  const suffixLength = 6;
  if (value.length <= prefixLength + suffixLength + 8) {
    return value;
  }
  return `${value.slice(0, prefixLength)}...[len:${value.length}]...${value.slice(-suffixLength)}`;
}

function shouldTruncateBase64UrlLike(value: string): boolean {
  if (value.startsWith("ses_") || value.startsWith("msg_")) {
    return false;
  }
  if (ALL_CAPS_ENV_NAME_PATTERN.test(value)) {
    return false;
  }
  if (/^(?:0x)?[A-Fa-f0-9]{32,}$/.test(value)) {
    return false;
  }

  const classes = [/[a-z]/.test(value), /[A-Z]/.test(value), /\d/.test(value), /[_-]/.test(value)]
    .filter(Boolean)
    .length;
  return classes >= 3;
}

function truncateBenignIdentifiers(text: string): string {
  const byHex = text.replace(LONG_HEX_PATTERN, (value) => truncateIdHint(value));
  return byHex.replace(BASE64URL_BLOB_PATTERN, (value) => {
    if (!shouldTruncateBase64UrlLike(value)) {
      return value;
    }
    return truncateIdHint(value);
  });
}

function redactSecretsOnly(text: string): string {
  return text
    // Redact Authorization-style bearer tokens. Avoid matching code or identifiers like `BearerAuth`.
    // Require a reasonably token-like value (length >= 16) that starts with an alphanumeric.
    .replace(/\bBearer\s+[A-Za-z0-9][A-Za-z0-9._~+/=-]{15,}\b/gi, "Bearer [redacted]")
    .replace(/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{20,}|AIza[0-9A-Za-z_-]{20,}|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16})\b/g, "[redacted_secret]")
    .replace(/\b[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/g, "[redacted_jwt]")
    .replace(ALL_CAPS_ASSIGNMENT_PATTERN, (full, name) => {
      if (!isSecretLikeEnvName(String(name))) {
        return String(full);
      }
      return "[redacted_env]=[redacted]";
    })
    .replace(/\b[A-Z][A-Z0-9_]{2,}\b/g, (name) => {
      if (!isSecretLikeEnvName(name)) {
        return name;
      }
      return "[redacted_env]";
    });
}

function isHiddenPath(pathText: string): boolean {
  return HIDDEN_PATH_PATTERN.test(pathText);
}

function extractPatchTargetPaths(patchText: string): string[] {
  const paths = new Set<string>();
  for (const line of patchText.split("\n")) {
    const fileMatch = line.match(PATCH_FILE_DIRECTIVE_PATTERN);
    if (fileMatch) {
      const pathText = fileMatch[1]?.trim();
      if (pathText) {
        paths.add(pathText);
      }
      continue;
    }

    const moveMatch = line.match(PATCH_MOVE_DIRECTIVE_PATTERN);
    if (moveMatch) {
      const pathText = moveMatch[1]?.trim();
      if (pathText) {
        paths.add(pathText);
      }
    }
  }
  return [...paths];
}

function sliceTextByLines(content: string, startLine: number, lineCount: number): string {
  const safeStart = Math.max(1, startLine);
  const safeCount = Math.max(1, lineCount);
  const lines = content.split("\n");
  const begin = Math.min(lines.length, safeStart - 1);
  const end = Math.min(lines.length, begin + safeCount);
  return lines.slice(begin, end).join("\n");
}

function sliceTextByChars(content: string, offset: number, length: number): string {
  const safeOffset = Math.max(0, offset);
  const safeLength = Math.max(1, length);
  if (safeOffset >= content.length) {
    return "";
  }
  return content.slice(safeOffset, safeOffset + safeLength);
}

function normalizeApiPath(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "/";
  }
  if (trimmed.includes("://")) {
    throw new Error("api path must be relative (no scheme/host)");
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function buildApiPath(apiPath: string, query?: Record<string, string | number | boolean | undefined>): string {
  const normalized = normalizeApiPath(apiPath);
  if (!query) {
    return normalized;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }
    params.set(key, String(value));
  }

  const queryText = params.toString();
  if (queryText.length === 0) {
    return normalized;
  }
  return `${normalized}?${queryText}`;
}

function parseJsonBody(text: string, contentType: string): unknown {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  if (contentType.includes("application/json") || trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function unwrapData(value: unknown): unknown {
  const rec = asRecord(value);
  if (rec && Object.prototype.hasOwnProperty.call(rec, "data")) {
    return rec.data;
  }
  return value;
}

function extractSessionId(value: unknown): string | undefined {
  const rec = asRecord(unwrapData(value));
  if (!rec) {
    return undefined;
  }

  const direct = rec.id;
  if (typeof direct === "string" && direct.length > 0) {
    return direct;
  }

  const sessionID = rec.sessionID;
  if (typeof sessionID === "string" && sessionID.length > 0) {
    return sessionID;
  }

  const sessionId = rec.sessionId;
  if (typeof sessionId === "string" && sessionId.length > 0) {
    return sessionId;
  }

  return undefined;
}

function isPlaceholderToken(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    value.includes("<") ||
    value.includes(">") ||
    lower === "api_key" ||
    lower === "<api_key>" ||
    lower === "change-me" ||
    lower.includes("example") ||
    lower.startsWith("${")
  );
}

function resolveBearerToken(explicitApiKey?: string): string | undefined {
  const token = explicitApiKey?.trim();
  if (!token || token.length === 0 || isPlaceholderToken(token)) {
    return undefined;
  }
  return token;
}

function isGatewayOpenPlannerEndpoint(endpoint: string): boolean {
  try {
    const parsed = new URL(endpoint);
    return parsed.pathname.startsWith("/api/openplanner");
  } catch {
    return endpoint.includes("/api/openplanner");
  }
}

function getOpencodeClient() {
  return createOpencodeClient({
    baseUrl: ENV.OPENCODE_API_BASE_URL,
    apiKey: resolveBearerToken(ENV.OPENCODE_API_KEY),
  });
}

function getOpenPlannerClient() {
  return createOpenPlannerClient({
    endpoint: ENV.OPENPLANNER_API_BASE_URL,
    apiKey: resolveBearerToken(ENV.OPENPLANNER_API_KEY),
  });
}

function sanitizeSensitiveText(text: string): string {
  return truncateBenignIdentifiers(
    redactSecretsOnly(text)
    .replace(/\b(?:authorization|x-api-key|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
    .replace(/\b(?:OPENPLANNER|OPENCODE|WORKSPACE|GITHUB|OWNER|CLIENT)_[A-Z0-9_]*\b/g, (name) => {
      if (!isSecretLikeEnvName(name)) {
        return name;
      }
      return "[redacted_var]";
    }),
  );
}

function formatClientError(tag: string, error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const cleaned = sanitizeSensitiveText(raw).replace(/\s+/g, " ").trim();

  if (/\b401\b|unauthorized|unauthorised/i.test(cleaned)) {
    if (/\bOPENPLANNER\b/i.test(cleaned)) {
      return `${tag}: unauthorized (check OPENPLANNER_API_KEY is set and valid)`;
    }
    if (/\bOPENCODE\b/i.test(cleaned)) {
      return `${tag}: unauthorized (check OPENCODE_API_KEY is set and valid)`;
    }
    return `${tag}: unauthorized upstream`;
  }

  if (/\bENOTFOUND|EHOSTUNREACH|ECONNREFUSED/i.test(cleaned)) {
    return `${tag}: cannot reach service (check OPENPLANNER_API_BASE_URL)`;
  }

  return `${tag}: ${cleaned.slice(0, 280)}`;
}

async function safeClientCall<T>(tag: string, op: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false; text: string }> {
  try {
    return { ok: true, value: await op() };
  } catch (error) {
    return { ok: false, text: formatClientError(tag, error) };
  }
}

function pickSessionRef(session?: string, sessionId?: string): string | undefined {
  const direct = (session ?? "").trim();
  if (direct.length > 0) {
    return direct;
  }
  const legacy = (sessionId ?? "").trim();
  if (legacy.length > 0) {
    return legacy;
  }
  return undefined;
}

async function resolveSessionRef(tag: string, sessionRef: string): Promise<{ ok: true; sessionId: string } | { ok: false; text: string }> {
  const ref = sessionRef.trim();
  if (ref.length === 0) {
    return { ok: false, text: `${tag}: missing session` };
  }

  // Prefer aliases (S####) to avoid exposing high-entropy ids.
  const resolvedFromAlias = resolveAlias("session", ref);
  if (resolvedFromAlias) {
    return { ok: true, sessionId: resolvedFromAlias };
  }

  if (ref.startsWith("ses_")) {
    return { ok: true, sessionId: ref };
  }

  const sessions = await safeClientCall(`${tag} session-lookup`, () => getOpencodeClient().listSessions());
  if (!sessions.ok) {
    return { ok: false, text: sessions.text };
  }

  const items = toRecordArray(sessions.value, ["sessions", "rows"]);
  const lowered = ref.toLowerCase();
  const match = items.find((item) => {
    const id = extractSessionId(item);
    if (typeof id === "string" && id.toLowerCase() === lowered) {
      return true;
    }
    const title = typeof item.title === "string" ? item.title.toLowerCase() : "";
    const slug = typeof item.slug === "string" ? item.slug.toLowerCase() : "";
    return title === lowered || slug === lowered;
  });

  const resolvedId = match ? extractSessionId(match) : undefined;
  if (!resolvedId) {
    return { ok: false, text: `${tag}: session not found (${truncateText(ref, 80)})` };
  }

  return { ok: true, sessionId: resolvedId };
}

async function callApi(baseUrl: string, method: RestMethod, apiPath: string, body?: unknown, apiKey?: string): Promise<ApiCallResult> {
  const target = `${trimSlash(baseUrl)}${normalizeApiPath(apiPath)}`;
  console.log(`[callApi] ${method} ${sanitizeSensitiveText(target)}`);
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const token = resolveBearerToken(apiKey);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let requestBody: string | undefined;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(target, {
    method,
    headers,
    body: requestBody,
  });

  const bodyText = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const json = parseJsonBody(bodyText, contentType);

  return {
    status: response.status,
    ok: response.ok,
    bodyText,
    contentType,
    json,
  };
}

function formatApiResult(tag: string, result: ApiCallResult, maxChars = API_TEXT_LIMIT): string {
  const lines = [`${tag}: ${result.status} ${result.ok ? "ok" : "error"}`];

  const payloadText = (() => {
    if (result.json !== undefined) {
      try {
        return sanitizeSensitiveText(JSON.stringify(result.json, null, 2));
      } catch {
        return sanitizeSensitiveText(result.bodyText);
      }
    }
    return sanitizeSensitiveText(result.bodyText);
  })();

  if (payloadText.trim().length === 0) {
    lines.push("(empty)");
  } else {
    lines.push(truncateText(payloadText, maxChars));
  }

  return lines.join("\n");
}

function formatAgentList(value: unknown, maxResults: number, includeDescriptions: boolean): string {
  return formatPrimaryAgentList(value, maxResults, includeDescriptions);
}

async function listPrimaryAgentNames(): Promise<{ ok: true; names: string[] } | { ok: false; errorText: string }> {
  const result = await callApi(ENV.OPENCODE_API_BASE_URL, "GET", "/agent", undefined, ENV.OPENCODE_API_KEY);
  if (!result.ok) {
    return { ok: false, errorText: formatApiResult("delegate_task list-agents", result) };
  }
  return { ok: true, names: primaryAgentNames(result.json ?? result.bodyText) };
}

function formatSessionList(value: unknown, maxResults: number): string {
  const unwrapped = unwrapData(value);
  const candidates = Array.isArray(unwrapped)
    ? unwrapped
    : (asRecord(unwrapped)?.sessions && Array.isArray(asRecord(unwrapped)?.sessions)
      ? (asRecord(unwrapped)?.sessions as unknown[])
      : []);

  const lines: string[] = [];
  const limited = candidates.slice(0, maxResults);
  for (const item of limited) {
    const rec = asRecord(item);
    if (!rec) continue;
    const id = extractSessionId(rec) ?? "(no-id)";
    const idOut = id.startsWith("ses_") ? aliasFor("session", id) : id;
    const title = typeof rec.title === "string"
      ? rec.title
      : (typeof rec.slug === "string" ? rec.slug : "(untitled)");
    const slug = typeof rec.slug === "string" ? rec.slug.trim() : "";
    const ref = slug.length > 0 ? ` | ref=${slug}` : "";
    lines.push(`${idOut} | ${title}${ref}`);
  }

  if (lines.length === 0) {
    return "(no sessions)";
  }

  if (candidates.length > lines.length) {
    lines.push(`#truncated ${maxResults}; use higher maxResults for more sessions`);
  }

  return lines.join("\n");
}

// ID aliasing to avoid exposing high-entropy ids to ChatGPT while preserving referential integrity.
const sessionAliasStore = new SessionAliasStore({
  ttlMsProvider: () => ENV.MCP_SESSION_TTL_SECONDS * 1000,
});

function aliasFor(kind: IdAliasKind, realId: string): string {
  const mcpSessionId = currentMcpSessionId();
  return sessionAliasStore.aliasFor(kind, realId, mcpSessionId || undefined);
}

function resolveAlias(kind: IdAliasKind, maybeAlias: string): string | null {
  const mcpSessionId = currentMcpSessionId();
  return sessionAliasStore.resolveAlias(kind, maybeAlias, mcpSessionId || undefined);
}

function formatDelegateTaskResult(args: {
  sessionId: string;
  agentType: string;
  title: string;
  promptStatus: number;
  promptOk: boolean;
}): string {
  const outSession = args.sessionId.startsWith("ses_") ? aliasFor("session", args.sessionId) : args.sessionId;
  return [
    `session ${outSession}`,
    `agent ${args.agentType}`,
    `title ${args.title}`,
    `prompt ${args.promptStatus} ${args.promptOk ? "ok" : "error"}`,
  ].join("\n");
}

function toRecordArray(value: unknown, keys: string[] = []): Record<string, unknown>[] {
  const unwrapped = unwrapData(value);
  if (Array.isArray(unwrapped)) {
    return unwrapped.map((item) => asRecord(item)).filter((item): item is Record<string, unknown> => item !== null);
  }
  const rec = asRecord(unwrapped);
  if (!rec) {
    return [];
  }
  for (const key of keys) {
    const candidate = rec[key];
    if (Array.isArray(candidate)) {
      return candidate.map((item) => asRecord(item)).filter((item): item is Record<string, unknown> => item !== null);
    }
  }
  return [];
}

function formatSessionState(state: unknown): string {
  const rec = asRecord(state);
  if (!rec) {
    return "state unknown";
  }
  const type = typeof rec.type === "string" ? rec.type : "unknown";
  if (type !== "retry") {
    return `state ${type}`;
  }
  const attempt = typeof rec.attempt === "number" ? rec.attempt : "?";
  const message = typeof rec.message === "string" ? rec.message : "retry";
  return `state retry\nattempt ${attempt}\nmessage ${message}`;
}

function joinMessageText(parts: unknown): string {
  if (!Array.isArray(parts)) {
    return "";
  }
  const textParts = parts
    .map((part) => asRecord(part))
    .filter((part): part is Record<string, unknown> => part !== null)
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => String(part.text).trim())
    .filter((part) => part.length > 0);
  return textParts.join("\n");
}

function formatSessionMessages(messages: Record<string, unknown>[], limit: number): string {
  const subset = messages.slice(Math.max(0, messages.length - limit));
  if (subset.length === 0) {
    return "(no messages)";
  }
  const entries = subset
    .map((message) => {
      const info = asRecord(message.info);
      const role = typeof info?.role === "string" ? info.role : "unknown";
      const text = sanitizeSensitiveText(joinMessageText(message.parts));
      return { role, text };
    })
    .filter((entry) => entry.text.length > 0);

  if (entries.length === 0) {
    return "(no messages)";
  }

  const grouped: Array<{ role: string; chunks: string[] }> = [];
  for (const entry of entries) {
    const last = grouped.at(-1);
    if (last && last.role === entry.role) {
      last.chunks.push(entry.text);
    } else {
      grouped.push({ role: entry.role, chunks: [entry.text] });
    }
  }

  return grouped
    .map((group) => `### ${group.role}\n${group.chunks.join("\n\n")}`)
    .join("\n\n");
}

function formatFinalMessage(message: Record<string, unknown>, maxChars: number): string {
  const info = asRecord(message.info);
  const id = typeof info?.id === "string" ? info.id : "(no-id)";
  const idOut = id.startsWith("msg_") ? aliasFor("message", id) : id;
  const finish = typeof info?.finish === "string" ? info.finish : "done";
  const body = sanitizeSensitiveText(joinMessageText(message.parts));
  if (body.length === 0) {
    return `message ${idOut}\nfinish ${finish}\n(empty)`;
  }
  return `message ${idOut}\nfinish ${finish}\n${truncateText(body, maxChars)}`;
}

type LspSeverity = "error" | "warning" | "info" | "hint";

function normalizeLspSeverity(value: unknown): LspSeverity {
  if (value === 1 || value === "1" || value === "error") {
    return "error";
  }
  if (value === 2 || value === "2" || value === "warning") {
    return "warning";
  }
  if (value === 3 || value === "3" || value === "information" || value === "info") {
    return "info";
  }
  return "hint";
}

function getLspDiagnosticMap(value: unknown): Record<string, unknown[]> {
  const unwrapped = unwrapData(value);
  const direct = asRecord(unwrapped);
  if (!direct) {
    return {};
  }

  const nested = asRecord(direct.diagnostics);
  const source = nested ?? direct;
  const out: Record<string, unknown[]> = {};
  for (const [filePath, diagnostics] of Object.entries(source)) {
    if (Array.isArray(diagnostics)) {
      out[filePath] = diagnostics;
    }
  }
  return out;
}

function formatLspDiagnosticsText(args: {
  value: unknown;
  maxResults: number;
  severity: "all" | LspSeverity;
  pathContains: string;
}): string {
  const rows: Array<{ path: string; line: number; character: number; severity: LspSeverity; message: string }> = [];
  const totals: Record<LspSeverity, number> = {
    error: 0,
    warning: 0,
    info: 0,
    hint: 0,
  };

  const filterPath = args.pathContains.trim().toLowerCase();
  const diagnosticsByPath = getLspDiagnosticMap(args.value);
  for (const [filePath, diagnostics] of Object.entries(diagnosticsByPath)) {
    if (filterPath.length > 0 && !filePath.toLowerCase().includes(filterPath)) {
      continue;
    }
    for (const item of diagnostics) {
      const rec = asRecord(item);
      if (!rec) {
        continue;
      }
      const severity = normalizeLspSeverity(rec.severity);
      totals[severity] += 1;
      if (args.severity !== "all" && severity !== args.severity) {
        continue;
      }
      const range = asRecord(rec.range);
      const start = asRecord(range?.start);
      const line = typeof start?.line === "number" ? start.line + 1 : 1;
      const character = typeof start?.character === "number" ? start.character + 1 : 1;
      const message = typeof rec.message === "string"
        ? rec.message.replace(/\s+/g, " ").trim()
        : "(no message)";
      rows.push({ path: filePath, line, character, severity, message });
    }
  }

  if (rows.length === 0) {
    if (Object.values(totals).every((count) => count === 0)) {
      return "(no diagnostics)";
    }
    return `(no ${args.severity} diagnostics)`;
  }

  const summary = `files ${new Set(rows.map((row) => row.path)).size} | errors ${totals.error} warnings ${totals.warning} info ${totals.info} hints ${totals.hint}`;
  const shown = rows.slice(0, args.maxResults);
  const lines = shown.map((row) => `${row.path}:${row.line}:${row.character} [${row.severity}] ${row.message}`);
  if (rows.length > shown.length) {
    lines.push(`#truncated ${shown.length}/${rows.length}`);
  }
  return [summary, ...lines].join("\n");
}

function formatLspStatusText(value: unknown): string {
  const rows = Array.isArray(unwrapData(value)) ? (unwrapData(value) as unknown[]) : [];
  if (rows.length === 0) {
    return "(no lsp servers)";
  }
  return rows.map((item) => {
    const rec = asRecord(item);
    if (!rec) {
      return "(invalid lsp status row)";
    }
    const name = typeof rec.name === "string" ? rec.name : "unknown";
    const root = typeof rec.root === "string" ? rec.root : ".";
    const status = typeof rec.status === "string" ? rec.status : "unknown";
    return `${name} ${status} root=${root}`;
  }).join("\n");
}

function flattenArrayRow(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    return [];
  }
  if (value.length === 1 && Array.isArray(value[0])) {
    return value[0];
  }
  return value;
}

function formatSemanticHitRef(rawId: unknown, meta: Record<string, unknown> | null, ordinal: number): string {
  const candidates = [
    typeof rawId === "string" ? rawId : undefined,
    typeof meta?.messageId === "string" ? meta.messageId : undefined,
    typeof meta?.message === "string" ? meta.message : undefined,
    typeof meta?.id === "string" ? meta.id : undefined,
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.startsWith("msg_")) {
      return aliasFor("message", candidate);
    }
  }

  return `hit-${ordinal}`;
}

function formatOpenplannerVector(value: unknown, maxResults: number): string {
  const unwrapped = unwrapData(value);
  const rec = asRecord(unwrapped);
  const result = asRecord(rec?.result);
  if (!result) {
    return "(no matches)";
  }
  const ids = flattenArrayRow(result.ids);
  const docs = flattenArrayRow(result.documents);
  const metas = flattenArrayRow(result.metadatas);
  const distances = flattenArrayRow(result.distances);
  const lines: string[] = [];
  const size = Math.min(maxResults, ids.length || docs.length || metas.length || distances.length);
  for (let i = 0; i < size; i++) {
    const rawId = ids[i];
    const rawDistance = distances[i];
    const distance = typeof rawDistance === "number" ? rawDistance : undefined;
    const meta = asRecord(metas[i]);
    const ref = formatSemanticHitRef(rawId, meta, i + 1);
    const rawDoc = docs[i];
    const doc = typeof rawDoc === "string" ? sanitizeSensitiveText(rawDoc.replace(/\s+/g, " ").trim()) : "";
    const score = distance === undefined ? "" : ` d=${Number(distance).toFixed(4)}`;
    const snippet = doc.length > 0 ? doc.slice(0, 220) : "(no text)";
    lines.push(`${ref}${score}: ${snippet}`);
  }
  if (lines.length === 0) {
    return "(no matches)";
  }
  return lines.join("\n");
}

function formatOpenplannerRows(value: unknown, maxResults: number): string {
  const rows = toRecordArray(value, ["rows"]);
  if (rows.length === 0) {
    return "(no matches)";
  }
  const limited = rows.slice(0, maxResults);
  return limited.map((row) => {
    const id = typeof row.id === "string" ? row.id : "(no-id)";
    const idOut = id.startsWith("msg_") ? aliasFor("message", id) : id;
    const snippet = typeof row.snippet === "string"
      ? row.snippet.replace(/\s+/g, " ").trim()
      : (typeof row.text === "string" ? row.text.replace(/\s+/g, " ").trim() : "");
    const cleaned = snippet.length > 0 ? sanitizeSensitiveText(snippet) : "";
    return cleaned.length > 0 ? `${idOut}: ${cleaned.slice(0, 240)}` : idOut;
  }).join("\n");
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function parseSkillName(content: string, fallback: string): string {
  const heading = content.match(/^#\s*(?:Skill\s*:\s*)?(.+)$/m);
  if (heading && heading[1]) {
    return normalizeText(heading[1]);
  }
  return fallback;
}

function parseSkillDescription(content: string): string {
  const goal = content.match(/^##\s*Goal\s*\n+([^\n]+)/m);
  if (goal && goal[1]) {
    return normalizeText(goal[1]);
  }
  const paragraph = content
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith("#"));
  return paragraph ? normalizeText(paragraph) : "";
}

function relativeSkillPath(root: string, filePath: string): string {
  const rel = path.relative(root, filePath).replace(/\\/g, "/");
  return rel.length > 0 ? rel : path.basename(filePath);
}

function makeSkillKey(scope: SkillScope, relPath: string): string {
  return `${scope}:${relPath}`;
}

function makeSkillEventId(scope: SkillScope, relPath: string, content: string): string {
  return createHash("sha256")
    .update(scope)
    .update("\n")
    .update(relPath)
    .update("\n")
    .update(content)
    .digest("hex");
}

async function collectSkillFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    let entries: Dirent[] = [];
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolute);
        continue;
      }
      if (entry.isFile() && entry.name === "SKILL.md") {
        out.push(absolute);
      }
    }
  }

  return out;
}

async function buildSkillRecord(scope: SkillScope, root: string, filePath: string): Promise<SkillRecord> {
  const [content, fileStat] = await Promise.all([
    readFile(filePath, "utf8"),
    stat(filePath),
  ]);
  const relPath = relativeSkillPath(root, filePath);
  const fallbackName = relPath.split("/").slice(-2, -1)[0] ?? path.basename(path.dirname(filePath));
  const name = parseSkillName(content, fallbackName);
  const description = parseSkillDescription(content);
  const eventId = makeSkillEventId(scope, relPath, content);

  return {
    id: makeSkillKey(scope, relPath),
    scope,
    absolutePath: filePath,
    relativePath: relPath,
    name,
    description,
    content,
    updatedAt: new Date(fileStat.mtimeMs).toISOString(),
    eventId,
  };
}

function formatSkillList(records: SkillRecord[], maxResults: number): string {
  if (records.length === 0) {
    return "(no skills)";
  }
  const sorted = [...records].sort((a, b) => a.name.localeCompare(b.name));
  const shown = sorted.slice(0, maxResults);
  const lines = shown.map((skill) => {
    const active = activeSkills.has(skill.name) ? " *" : "";
    const desc = skill.description.length > 0 ? ` - ${skill.description.slice(0, 120)}` : "";
    return `${skill.name}${active} [${skill.scope}]${desc}`;
  });
  if (sorted.length > shown.length) {
    lines.push(`#truncated ${maxResults}`);
  }
  return lines.join("\n");
}

function formatSkillFind(records: SkillRecord[], maxResults: number): string {
  if (records.length === 0) {
    return "(no matches)";
  }
  const shown = records.slice(0, maxResults);
  const lines = shown.map((skill) => {
    const desc = skill.description.length > 0 ? skill.description.slice(0, 160) : "(no description)";
    return `${skill.name} [${skill.scope}]\n${desc}\npath ${skill.relativePath}`;
  });
  if (records.length > shown.length) {
    lines.push(`#truncated ${maxResults}`);
  }
  return lines.join("\n\n");
}

function findSkills(query: string): SkillRecord[] {
  const normalized = normalizeText(query).toLowerCase();
  if (normalized.length === 0) {
    return [];
  }
  const words = normalized.split(" ").filter((word) => word.length > 0);
  return [...skillRegistry.values()]
    .filter((skill) => {
      const haystack = `${skill.name} ${skill.description} ${skill.relativePath}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function formatSkillRead(record: SkillRecord, maxChars: number): string {
  const truncated = truncateText(record.content, maxChars);
  return [
    `skill ${record.name}`,
    `scope ${record.scope}`,
    `path ${record.relativePath}`,
    `updated ${record.updatedAt}`,
    "",
    truncated,
  ].join("\n");
}

function formatSkillShow(record: SkillRecord, maxChars: number): string {
  const content = truncateText(record.content, maxChars);
  return [
    `skill ${record.name}`,
    `scope ${record.scope}`,
    `path ${record.relativePath}`,
    `description ${record.description}`,
    `updated ${record.updatedAt}`,
    "",
    "## Skill Content",
    "",
    content,
  ].join("\n");
}

function formatActiveSkillList(): string {
  const lines: string[] = [];
  for (const skillName of activeSkills) {
    const skill = [...skillRegistry.values()].find((s) => s.name === skillName);
    if (skill) {
      lines.push(`${skill.name} [${skill.scope}] path ${skill.relativePath}`);
    } else {
      lines.push(`${skillName} [unknown] (not loaded)`);
    }
  }
  if (lines.length === 0) {
    return "(no active skills)";
  }
  return lines.join("\n");
}

function buildActiveSkillPreamble(maxChars: number): string {
  const lines: string[] = [];
  let totalChars = 0;
  for (const skillName of activeSkills) {
    const skill = [...skillRegistry.values()].find((s) => s.name === skillName);
    if (!skill) continue;
    const preamble = `\n\n=== ACTIVE SKILL: ${skill.name} ===\n${skill.content}`;
    if (totalChars + preamble.length > maxChars) {
      lines.push(`[SKILL ${skill.name} truncated due to limit]`);
      break;
    }
    lines.push(preamble);
    totalChars += preamble.length;
  }
  if (lines.length === 0) {
    return "";
  }
  return lines.join("") + "\n";
}

function formatAutoSkillSelect(value: unknown, maxResults: number): string {
  const unwrapped = unwrapData(value);
  const rec = asRecord(unwrapped);
  const result = asRecord(rec?.result);
  if (!result) {
    return "(no matches)";
  }
  const ids = flattenArrayRow(result.ids);
  const metas = flattenArrayRow(result.metadatas);
  const distances = flattenArrayRow(result.distances);
  const lines: string[] = [];
  const size = Math.min(maxResults, ids.length || metas.length || distances.length);

  for (let i = 0; i < size; i++) {
    const rawId = ids[i];
    const id = typeof rawId === "string" ? rawId : "";
    const meta = asRecord(metas[i]);
    const name = typeof meta?.session === "string"
      ? meta.session
      : (skillEventMap.get(id)?.name ?? "(unknown)");
    const scope = typeof meta?.project === "string"
      ? meta.project
      : (skillEventMap.get(id)?.scope ?? "unknown");
    const rawDistance = distances[i];
    const distance = typeof rawDistance === "number" ? rawDistance : undefined;
    const score = distance === undefined ? "" : ` d=${Number(distance).toFixed(4)}`;
    lines.push(`${name} [${scope}]${score}`);
  }

  if (lines.length === 0) {
    return "(no matches)";
  }
  return lines.join("\n");
}

async function loadSkillsFromDisk(): Promise<SkillRecord[]> {
  const records: SkillRecord[] = [];
  for (const root of SKILL_ROOTS) {
    const files = await collectSkillFiles(root.root);
    for (const filePath of files) {
      try {
        records.push(await buildSkillRecord(root.scope, root.root, filePath));
      } catch (error) {
        console.error("[skills] failed to read", filePath, error);
      }
    }
  }
  return records;
}

function updateSkillRegistry(records: SkillRecord[]): void {
  skillRegistry.clear();
  skillEventMap.clear();
  for (const record of records) {
    skillRegistry.set(record.id, record);
    skillEventMap.set(record.eventId, record);
  }
}

function toSkillEvent(record: SkillRecord): {
  schema: "openplanner.event.v1";
  id: string;
  ts: string;
  source: string;
  kind: string;
  source_ref: { project: string; session: string; message: string };
  text: string;
  meta: { role: string; author: string };
  extra: { path: string; scope: SkillScope };
} {
  return {
    schema: "openplanner.event.v1",
    id: record.eventId,
    ts: record.updatedAt,
    source: SKILL_EVENT_SOURCE,
    kind: "skill",
    source_ref: {
      project: record.scope,
      session: record.name,
      message: record.relativePath,
    },
    text: `skill ${record.name}\n${record.description}\n${record.content}`,
    meta: {
      role: "system",
      author: "skill-indexer",
    },
    extra: {
      path: record.relativePath,
      scope: record.scope,
    },
  };
}

async function hasSemanticSkillIndex(): Promise<boolean> {
  try {
    const result = asRecord(await getOpenPlannerClient().searchFts({
      q: "Skill",
      source: SKILL_EVENT_SOURCE,
      limit: 1,
    }));
    return typeof result?.count === "number" && result.count > 0;
  } catch {
    return false;
  }
}

async function indexSkillRecords(records: SkillRecord[]): Promise<void> {
  if (records.length === 0) {
    return;
  }
  const events = records.map((record) => toSkillEvent(record));
  await getOpenPlannerClient().indexEvents(events);
}

async function refreshSkillIndex(options: { forceIndex: boolean }): Promise<void> {
  const records = await loadSkillsFromDisk();
  updateSkillRegistry(records);

  const shouldIndex = options.forceIndex || !(await hasSemanticSkillIndex());
  if (shouldIndex && records.length > 0) {
    await indexSkillRecords(records);
  }
}

async function runSkillRefresh(options: { forceIndex: boolean }): Promise<void> {
  try {
    await refreshSkillIndex(options);
  } catch (error) {
    console.error("[skills] refresh failed", error);
  }
}

function scheduleSkillRefresh(): void {
  if (skillRefreshTimer) {
    clearTimeout(skillRefreshTimer);
  }
  skillRefreshTimer = setTimeout(() => {
    void runSkillRefresh({ forceIndex: true });
  }, 300);
}

function startSkillWatchers(): void {
  for (const watcher of skillWatchers) {
    watcher.close();
  }
  skillWatchers.length = 0;

  for (const root of SKILL_ROOTS) {
    try {
      const watcher = watch(root.root, { persistent: false }, (_eventType, filename) => {
        const name = typeof filename === "string" ? filename : "";
        if (!name || !name.endsWith("SKILL.md")) {
          return;
        }
        scheduleSkillRefresh();
      });
      skillWatchers.push(watcher);
    } catch {
      // ignore missing roots
    }
  }
}

async function bootstrapSkills(): Promise<void> {
  await runSkillRefresh({ forceIndex: false });
  startSkillWatchers();
}

const PATH_RE = /(^|[\s"'`(])((?:\.{0,2}\/)?(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+)(?=$|[\s"'`),.:;])/g;

function extractPathsLoose(text: string): string[] {
  const set = new Set<string>();
  PATH_RE.lastIndex = 0;
  let match = PATH_RE.exec(text);
  while (match !== null) {
    const pathText = match[2];
    if (pathText.length > 0) {
      set.add(pathText);
    }
    match = PATH_RE.exec(text);
  }
  return [...set];
}

function escapeRegex(input: string): string {
  return input.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function globToRegex(pattern: string): RegExp {
  const escaped = escapeRegex(pattern);
  const withDouble = escaped.replace(/\*\*/g, "::double-star::");
  const withSingle = withDouble.replace(/\*/g, "[^/]*").replace(/::double-star::/g, ".*");
  const finalPattern = withSingle.replace(/\?/g, "[^/]");
  return new RegExp(`^${finalPattern}$`);
}

function createServer(): McpServer {
  const server = new McpServer({
    name: "mcp-fs-oauth",
    version: "0.1.0",
  });

  server.registerTool(
    "fs_list",
    {
      description: "List directory entries as compact plain text.",
      inputSchema: {
        path: z.string().optional().default(""),
        includeHidden: z.boolean().optional().default(false).describe("Set true to include hidden dotfiles and dot-directories"),
        backend: z.enum(["auto", "local", "github"]).optional(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      }
    },
    async ({ path, includeHidden, backend }) => {
      const entries = await vfs.list(path, { includeHidden }, backend);
      return {
        content: [{ type: "text", text: formatListText(path, entries) }],
      };
    }
  );

  server.registerTool(
    "fs_read",
    {
      description: "Read full file as raw text (not JSON).",
      inputSchema: {
        path: z.string(),
        includeHidden: z.boolean().optional().default(false).describe("Set true to allow reading hidden dotfiles and dot-directories"),
        entropyRedact: z.boolean().optional().default(false).describe("Set true to enable high-entropy token redaction (can over-redact non-secrets)"),
        maxChars: z.number().int().min(200).max(50000).optional().default(API_TEXT_LIMIT),
        backend: z.enum(["auto", "local", "github"]).optional(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      }
    },
    async ({ path, includeHidden, entropyRedact, maxChars, backend }) => {
      if (!includeHidden && isHiddenPath(path)) {
        return { content: [{ type: "text", text: "fs_read: hidden paths are excluded by default; set includeHidden=true to allow" }] };
      }
      const out = await vfs.readFile(path, backend);
      const sanitized = sanitizeSensitiveText(out.content);
      const redacted = entropyRedact ? redactHighEntropyText(sanitized) : sanitized;
      return {
        content: [{ type: "text", text: truncateText(redacted, maxChars) }],
      };
    }
  );

  server.registerTool(
    "fs_read_lines",
    {
      description: "Read a line range from a file as raw text.",
      inputSchema: {
        path: z.string(),
        includeHidden: z.boolean().optional().default(false),
        entropyRedact: z.boolean().optional().default(false).describe("Set true to enable high-entropy token redaction (can over-redact non-secrets)"),
        startLine: z.number().int().min(1).optional().default(1),
        lineCount: z.number().int().min(1).max(2000).optional().default(200),
        backend: z.enum(["auto", "local", "github"]).optional(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      }
    },
    async ({ path, includeHidden, entropyRedact, startLine, lineCount, backend }) => {
      if (!includeHidden && isHiddenPath(path)) {
        return { content: [{ type: "text", text: "fs_read_lines: hidden paths are excluded by default; set includeHidden=true to allow" }] };
      }
      const out = await vfs.readFile(path, backend);
      const sanitized = sanitizeSensitiveText(out.content);
      const redacted = entropyRedact ? redactHighEntropyText(sanitized) : sanitized;
      return {
        content: [{ type: "text", text: sliceTextByLines(redacted, startLine, lineCount) }],
      };
    }
  );

  server.registerTool(
    "fs_read_chars",
    {
      description: "Read a character range from a file as raw text.",
      inputSchema: {
        path: z.string(),
        includeHidden: z.boolean().optional().default(false),
        entropyRedact: z.boolean().optional().default(false).describe("Set true to enable high-entropy token redaction (can over-redact non-secrets)"),
        offset: z.number().int().min(0).optional().default(0),
        length: z.number().int().min(1).max(50000).optional().default(4000),
        backend: z.enum(["auto", "local", "github"]).optional(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      }
    },
    async ({ path, includeHidden, entropyRedact, offset, length, backend }) => {
      if (!includeHidden && isHiddenPath(path)) {
        return { content: [{ type: "text", text: "fs_read_chars: hidden paths are excluded by default; set includeHidden=true to allow" }] };
      }
      const out = await vfs.readFile(path, backend);
      const sanitized = sanitizeSensitiveText(out.content);
      const redacted = entropyRedact ? redactHighEntropyText(sanitized) : sanitized;
      return {
        content: [{ type: "text", text: sliceTextByChars(redacted, offset, length) }],
      };
    }
  );

  server.registerTool(
    "fs_write",
    {
      description: "Write or overwrite a file with UTF-8 text content. Existing files are replaced.",
      inputSchema: {
        path: z.string().describe("File path relative to workspace root (for example: src/app.ts or docs/README.md)"),
        content: z.string().describe("Full UTF-8 text content to write"),
        includeHidden: z.boolean().optional().default(false).describe("Set true to allow mutating hidden dotfiles and dot-directories"),
        intent: z.string().optional().describe("Optional action summary for confirmation dialogs; also used as the commit message on the GitHub backend"),
        backend: z.enum(["auto", "local", "github"]).optional().describe("Storage backend: auto (default), local filesystem, or GitHub repository"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: false,
      }
    },
    async ({ path, content, includeHidden, intent, backend }) => {
      if (!includeHidden && isHiddenPath(path)) {
        return { content: [{ type: "text", text: "fs_write: hidden paths are blocked for mutation by default; set includeHidden=true to allow" }] };
      }
      const out = await vfs.writeFile(path, content, intent, backend);
      const backendName = backend ?? "auto";
      return {
        content: [{
          type: "text",
          text: formatWriteResultText({
            path: out.path,
            bytes: Buffer.byteLength(content, "utf8"),
            backend: backendName,
            etag: out.etag,
          }),
        }],
      };
    }
  );

  server.registerTool(
    "fs_delete",
    {
      description: "Permanently delete a path. Local backend supports recursive directory deletion; GitHub backend deletes files only.",
      inputSchema: {
        path: z.string().describe("Path to the file or directory to delete, relative to workspace root"),
        includeHidden: z.boolean().optional().default(false).describe("Set true to allow mutating hidden dotfiles and dot-directories"),
        intent: z.string().optional().describe("Optional deletion rationale for confirmation dialogs; also used as the commit message on the GitHub backend"),
        backend: z.enum(["auto", "local", "github"]).optional().describe("Storage backend: auto (default), local filesystem, or GitHub repository"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: false,
      }
    },
    async ({ path, includeHidden, intent, backend }) => {
      if (!includeHidden && isHiddenPath(path)) {
        return { content: [{ type: "text", text: "fs_delete: hidden paths are blocked for mutation by default; set includeHidden=true to allow" }] };
      }
      const out = await vfs.deletePath(path, intent, backend);
      return {
        content: [{ type: "text", text: sanitizeSensitiveText(JSON.stringify(out, null, 2)) }],
      };
    }
  );

  server.registerTool(
    "apply_patch",
    {
      description: APPLY_PATCH_DESCRIPTION,
      inputSchema: {
        patchText: z.string().describe("The full patch text that describes all changes to be made"),
        includeHidden: z.boolean().optional().default(false).describe("Set true to allow mutating hidden dotfiles and dot-directories via patch directives"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: false,
      },
    },
    async ({ patchText, includeHidden }) => {
      if (!includeHidden) {
        const hiddenPatchPaths = extractPatchTargetPaths(patchText).filter((pathText) => isHiddenPath(pathText));
        if (hiddenPatchPaths.length > 0) {
          return {
            content: [{
              type: "text",
              text: `apply_patch: hidden paths are blocked for mutation by default; set includeHidden=true to allow (${hiddenPatchPaths.join(", ")})`,
            }],
          };
        }
      }
      const result = await applyPatchText(patchText, { cwd: path.resolve(ENV.LOCAL_ROOT) });

      return {
        content: [{ type: "text", text: result.output }],
      };
    },
  );

  server.registerTool(
    "fs_tree",
    {
      description: "Use sparingly for small, targeted directories. Broad tree scans are blocked; use fs_glob/fs_grep first.",
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
      const normalizedPath = (path ?? "").trim();
      const isRootPath = normalizedPath === "" || normalizedPath === "." || normalizedPath === "/";

      if (maxDepth > FS_TREE_HARD_MAX_DEPTH) {
        return {
          content: [{
            type: "text",
            text: buildFsTreeBlockedMessage(`maxDepth ${maxDepth} exceeds safe limit ${FS_TREE_HARD_MAX_DEPTH}`),
          }],
        };
      }

      if (pageSize > FS_TREE_HARD_MAX_PAGE_SIZE) {
        return {
          content: [{
            type: "text",
            text: buildFsTreeBlockedMessage(`pageSize ${pageSize} exceeds safe limit ${FS_TREE_HARD_MAX_PAGE_SIZE}`),
          }],
        };
      }

      if (!cursor && isRootPath && maxDepth > FS_TREE_ROOT_DEPTH_LIMIT) {
        return {
          content: [{
            type: "text",
            text: buildFsTreeBlockedMessage(
              `root scan with maxDepth ${maxDepth} is too large; root limit is ${FS_TREE_ROOT_DEPTH_LIMIT}`,
            ),
          }],
        };
      }

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
    "fs_precision_guide",
    {
      description: "Guidance tool for high-signal file exploration. Read this first before using fs_tree.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      }
    },
    async () => {
      return {
        content: [{
          type: "text",
          text: [
            "Precision workflow:",
            "1) Use fs_glob to narrow candidate paths (target 20-80 matches).",
            "2) Use fs_grep on that subset (target <=40 matches).",
            "3) Use fs_read for exact files.",
            `4) Use fs_tree only for small directories (maxDepth<=${FS_TREE_HARD_MAX_DEPTH}, pageSize<=${FS_TREE_HARD_MAX_PAGE_SIZE}).`,
            "5) If fs_tree returns `next <cursor>`, continue with that cursor instead of increasing depth.",
            "6) For conversation history use session_* tools instead of searching by session-like ids in files.",
          ].join("\n"),
        }],
      };
    }
  );

  server.registerTool(
    "fs_glob",
    {
      description: "Primary path discovery tool. Use this before fs_grep/fs_read/fs_tree. For conversation data use session_* tools.",
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

      return {
        content: [{ type: "text", text: formatGlobResultText(result) }],
      };
    }
  );

  server.registerTool(
    "fs_search",
    {
      description: "Literal text search fallback. Prefer fs_grep for regex and precise include patterns.",
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
        content: [{ type: "text", text: sanitizeSensitiveText(JSON.stringify(results, null, 2)) }],
      };
    }
  );

  server.registerTool(
    "fs_grep",
    {
      description: "Primary content search tool. Returns compact grep lines (path:line: snippet).",
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

      return {
        content: [{ type: "text", text: sanitizeSensitiveText(formatGrepResultText(result)) }],
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
        content: [{ type: "text", text: sanitizeSensitiveText(JSON.stringify(commands, null, 2)) }],
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
          { type: "text", text: sanitizeSensitiveText(`Exit code: ${result.exitCode}\n\nStdout:\n${result.stdout}\n\nStderr:\n${result.stderr}`) },
        ],
      };
    }
  );

  server.registerTool(
    "list_agents",
    {
      description: "List available OpenCode agents in compact text format.",
      inputSchema: {
        maxResults: z.number().int().min(1).max(200).optional().default(50),
        includeDescriptions: z.boolean().optional().default(false),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ maxResults, includeDescriptions }) => {
      let result: ApiCallResult;
      try {
        result = await callApi(ENV.OPENCODE_API_BASE_URL, "GET", "/agent", undefined, ENV.OPENCODE_API_KEY);
      } catch (error) {
        return {
          content: [{ type: "text", text: formatClientError("list_agents", error) }],
        };
      }
      if (!result.ok) {
        return {
          content: [{ type: "text", text: formatApiResult("list_agents", result) }],
        };
      }

      return {
        content: [{ type: "text", text: formatAgentList(result.json ?? result.bodyText, maxResults, includeDescriptions) }],
      };
    },
  );

  server.registerTool(
    "list_skills",
    {
      description: "List indexed skills in compact text format.",
      inputSchema: {
        maxResults: z.number().int().min(1).max(500).optional().default(120),
        preview: z.number().int().min(0).max(500).optional().default(0).describe("Include preview of first N characters of each skill (0 to disable)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ maxResults, preview }) => {
      const records = [...skillRegistry.values()];
      if (records.length === 0) {
        return {
          content: [{ type: "text", text: "(no skills)" }],
        };
      }

      const sorted = [...records].sort((a, b) => a.name.localeCompare(b.name));
      const shown = sorted.slice(0, maxResults);
      const lines = shown.map((skill) => {
        const active = activeSkills.has(skill.name) ? " *" : "";
        const loadable = skill.content.length > 0 ? "✓" : "✗";
        const desc = skill.description.length > 0 ? ` - ${skill.description.slice(0, 80)}` : "";
        let line = `${skill.name}${active} [${skill.scope}]${desc}`;
        if (preview > 0) {
          const contentPreview = skill.content.slice(0, preview).replace(/\s+/g, " ").trim();
          line += `\n  preview: ${contentPreview}${skill.content.length > preview ? "..." : ""}`;
        }
        line += `\n  loadable ${loadable}`;
        return line;
      });

      if (sorted.length > shown.length) {
        lines.push(`#truncated ${maxResults}`);
      }

      return {
        content: [{ type: "text", text: lines.join("\n") }],
      };
    },
  );

  server.registerTool(
    "find_skill",
    {
      description: "Keyword match skills by name, description, or path.",
      inputSchema: {
        query: z.string().min(1),
        maxResults: z.number().int().min(1).max(100).optional().default(20),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ query, maxResults }) => {
      const matches = findSkills(query);
      return {
        content: [{ type: "text", text: formatSkillFind(matches, maxResults) }],
      };
    },
  );

  server.registerTool(
    "activate_skill",
    {
      description: "Mark a skill as active for this MCP process.",
      inputSchema: {
        name: z.string().min(1),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ name }) => {
      const target = normalizeText(name).toLowerCase();
      const skill = [...skillRegistry.values()].find((item) => item.name.toLowerCase() === target);
      if (!skill) {
        return {
          content: [{ type: "text", text: `skill ${name}\nstatus not-found` }],
        };
      }
      activeSkills.add(skill.name);
      return {
        content: [{ type: "text", text: `skill ${skill.name}\nstatus active` }],
      };
    },
  );

  server.registerTool(
    "skill_read",
    {
      description: "Read the full content of a skill from its SKILL.md file.",
      inputSchema: {
        name: z.string().min(1).describe("Skill name to read"),
        maxChars: z.number().int().min(100).max(100000).optional().default(API_TEXT_LIMIT).describe("Maximum characters to return"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async ({ name, maxChars }) => {
      const target = normalizeText(name).toLowerCase();
      const skill = [...skillRegistry.values()].find((item) => item.name.toLowerCase() === target);
      if (!skill) {
        return {
          content: [{ type: "text", text: `skill ${name}\nstatus not-found` }],
        };
      }
      return {
        content: [{ type: "text", text: formatSkillRead(skill, maxChars) }],
      };
    },
  );

  server.registerTool(
    "skill_show",
    {
      description: "Show skill details including metadata and full content.",
      inputSchema: {
        name: z.string().min(1).describe("Skill name to show"),
        maxChars: z.number().int().min(100).max(100000).optional().default(API_TEXT_LIMIT).describe("Maximum characters to return"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async ({ name, maxChars }) => {
      const target = normalizeText(name).toLowerCase();
      const skill = [...skillRegistry.values()].find((item) => item.name.toLowerCase() === target);
      if (!skill) {
        return {
          content: [{ type: "text", text: `skill ${name}\nstatus not-found` }],
        };
      }
      return {
        content: [{ type: "text", text: formatSkillShow(skill, maxChars) }],
      };
    },
  );

  server.registerTool(
    "skill_active_list",
    {
      description: "List currently active skills with their names and paths.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async () => {
      return {
        content: [{ type: "text", text: formatActiveSkillList() }],
      };
    },
  );

  server.registerTool(
    "openplanner_health",
    {
      description: "Check OpenPlanner API connectivity and authentication status.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async () => {
      const endpoint = ENV.OPENPLANNER_API_BASE_URL;
      const hasApiKey = !isPlaceholderToken(ENV.OPENPLANNER_API_KEY ?? "");
      const viaGateway = isGatewayOpenPlannerEndpoint(endpoint);
      const client = getOpenPlannerClient();

      const lines: string[] = [
        `endpoint ${endpoint}`,
        `api-key ${hasApiKey ? "configured" : "missing/placeholder"}`,
        `mode ${viaGateway ? "gateway" : "direct"}`,
      ];

      try {
        const result = await safeClientCall("openplanner_health", () => client.searchFts({ q: "health", limit: 1 }));
        if (result.ok) {
          lines.push("status HEALTHY");
        } else {
          lines.push(`status ${result.text}`);
          if (/unauthorized/i.test(result.text)) {
            if (viaGateway) {
              lines.push("hint Set OPENPLANNER_API_KEY in Janus env");
              lines.push("hint Janus key must match OpenPlanner OPENPLANNER_API_KEY");
            } else {
              lines.push("hint Set OPENPLANNER_API_KEY in this service env");
            }
          }
        }
      } catch (error) {
        lines.push(`status ERROR: ${error instanceof Error ? error.message : String(error)}`);
      }

      return {
        content: [{ type: "text", text: lines.join("\n") }],
      };
    },
  );

  server.registerTool(
    "auto_skill_select",
    {
      description: "Semantic skill search over indexed skills via OpenPlanner vector search.",
      inputSchema: {
        query: z.string().min(1),
        limit: z.number().int().min(1).max(50).optional().default(5),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ query, limit }) => {
      const result = await safeClientCall("auto_skill_select", () => getOpenPlannerClient().searchVector({
        q: query,
        k: limit,
        where: { source: SKILL_EVENT_SOURCE },
      }));
      if (!result.ok) {
        return {
          content: [{ type: "text", text: result.text }],
        };
      }
      return {
        content: [{ type: "text", text: formatAutoSkillSelect(result.value, limit) }],
      };
    },
  );

  server.registerTool(
    "semantic_search",
    {
      description: "Semantic search in OpenPlanner across all indexed content. Optional metadata filters can narrow results.",
      inputSchema: {
        query: z.string().min(1),
        limit: z.number().int().min(1).max(200).optional().default(20),
        // Optional OpenPlanner event metadata filters
        source: z.string().optional(),
        kind: z.string().optional(),
        project: z.string().optional(),
        // Session reference (id or exact title). If provided, results are limited to that session.
        session: z.string().optional().describe("Session reference (id or exact title)"),
        sessionId: z.string().optional().describe("Legacy alias for session"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ query, limit, source, kind, project, session, sessionId }) => {
      const where: Record<string, unknown> = {};
      if (source && source.trim().length > 0) where.source = source.trim();
      if (kind && kind.trim().length > 0) where.kind = kind.trim();
      if (project && project.trim().length > 0) where.project = project.trim();

      const sessionRef = pickSessionRef(session, sessionId);
      if (sessionRef) {
        const resolved = await resolveSessionRef("semantic_search", sessionRef);
        if (!resolved.ok) {
          return {
            content: [{ type: "text", text: resolved.text }],
          };
        }
        where.session = resolved.sessionId;
      }

      const result = await safeClientCall("semantic_search", () => getOpenPlannerClient().searchVector({
        q: query,
        k: limit,
        ...(Object.keys(where).length > 0 ? { where } : {}),
      }));
      if (!result.ok) {
        return {
          content: [{ type: "text", text: result.text }],
        };
      }

      return {
        content: [{ type: "text", text: formatOpenplannerVector(result.value, limit) }],
      };
    },
  );

  server.registerTool(
    "list_sessions",
    {
      description: "List OpenCode sessions in compact text format.",
      inputSchema: {
        maxResults: z.number().int().min(1).max(200).optional().default(50),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ maxResults }) => {
      const result = await safeClientCall("list_sessions", () => getOpencodeClient().listSessions());
      if (!result.ok) {
        return {
          content: [{ type: "text", text: result.text }],
        };
      }
      return {
        content: [{ type: "text", text: formatSessionList(result.value, maxResults) }],
      };
    },
  );

  server.registerTool(
    "lsp_diagnostics",
    {
      description: "Get OpenCode LSP diagnostics in compact text. Falls back to LSP status if diagnostics endpoint is unavailable.",
      inputSchema: {
        maxResults: z.number().int().min(1).max(1000).optional().default(200),
        severity: z.enum(["all", "error", "warning", "info", "hint"]).optional().default("all"),
        pathContains: z.string().optional().default(""),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ maxResults, severity, pathContains }) => {
      let diagnostics: ApiCallResult;
      try {
        diagnostics = await callApi(
          ENV.OPENCODE_API_BASE_URL,
          "GET",
          buildApiPath("/lsp/diagnostics"),
          undefined,
          ENV.OPENCODE_API_KEY,
        );
      } catch (error) {
        return {
          content: [{ type: "text", text: formatClientError("lsp_diagnostics", error) }],
        };
      }

      if (diagnostics.ok && diagnostics.json !== undefined) {
        return {
          content: [{
            type: "text",
            text: formatLspDiagnosticsText({
              value: diagnostics.json,
              maxResults,
              severity,
              pathContains,
            }),
          }],
        };
      }

      const diagnosticsMissing = diagnostics.status === 404 || /\b404\b|not found/i.test(diagnostics.bodyText);
      if (!diagnosticsMissing) {
        return {
          content: [{ type: "text", text: formatApiResult("lsp_diagnostics", diagnostics) }],
        };
      }

      let status: ApiCallResult;
      try {
        status = await callApi(
          ENV.OPENCODE_API_BASE_URL,
          "GET",
          buildApiPath("/lsp/status"),
          undefined,
          ENV.OPENCODE_API_KEY,
        );
      } catch (error) {
        return {
          content: [{ type: "text", text: `${formatApiResult("lsp_diagnostics", diagnostics)}\n${formatClientError("lsp_diagnostics", error)}` }],
        };
      }

      if (!status.ok || status.json === undefined) {
        return {
          content: [{ type: "text", text: `${formatApiResult("lsp_diagnostics", diagnostics)}\n${formatApiResult("lsp_status", status)}` }],
        };
      }

      return {
        content: [{
          type: "text",
          text: [
            "diagnostics endpoint unavailable on current OpenCode API",
            "available lsp servers:",
            formatLspStatusText(status.json),
          ].join("\n"),
        }],
      };
    },
  );

  server.registerTool(
    "session_messages",
    {
      description: "Get recent messages for a session (id or title) as compact text.",
      inputSchema: {
        session: z.string().optional().describe("Session reference (id or exact title)"),
        sessionId: z.string().optional().describe("Legacy alias for session"),
        limit: z.number().int().min(1).max(200).optional().default(40),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ session, sessionId, limit }) => {
      const ref = pickSessionRef(session, sessionId);
      if (!ref) {
        return {
          content: [{ type: "text", text: "session_messages: missing session" }],
        };
      }
      const resolved = await resolveSessionRef("session_messages", ref);
      if (!resolved.ok) {
        return {
          content: [{ type: "text", text: resolved.text }],
        };
      }
      const result = await safeClientCall("session_messages", () => getOpencodeClient().listMessages(resolved.sessionId));
      if (!result.ok) {
        return {
          content: [{ type: "text", text: result.text }],
        };
      }
      const messages = toRecordArray(result.value, ["messages", "rows"]);
      // Ensure alias is minted for sessions referenced by this tool.
      if (resolved.sessionId.startsWith("ses_")) {
        aliasFor("session", resolved.sessionId);
      }
      return {
        content: [{ type: "text", text: formatSessionMessages(messages, limit) }],
      };
    },
  );

  server.registerTool(
    "session_send",
    {
      description: "Send a text message to a session (id or title).",
      inputSchema: {
        session: z.string().optional().describe("Session reference (id or exact title)"),
        sessionId: z.string().optional().describe("Legacy alias for session"),
        prompt: z.string().min(1),
        async: z.boolean().optional().default(true),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ session, sessionId, prompt, async }) => {
      const ref = pickSessionRef(session, sessionId);
      if (!ref) {
        return {
          content: [{ type: "text", text: "session_send: missing session" }],
        };
      }
      const resolved = await resolveSessionRef("session_send", ref);
      if (!resolved.ok) {
        return {
          content: [{ type: "text", text: resolved.text }],
        };
      }
      const resolvedSessionId = resolved.sessionId;
      const outSession = resolvedSessionId.startsWith("ses_") ? aliasFor("session", resolvedSessionId) : resolvedSessionId;
      if (async) {
        const queued = await safeClientCall("session_send", () => getOpencodeClient().promptAsync(resolvedSessionId, {
          parts: [{ type: "text", text: prompt }],
        }));
        if (!queued.ok) {
          return {
            content: [{ type: "text", text: queued.text }],
          };
        }
        return {
          content: [{ type: "text", text: `session ${outSession}\nqueued` }],
        };
      }
      const result = await safeClientCall("session_send", () => getOpencodeClient().sendMessage(resolvedSessionId, {
        parts: [{ type: "text", text: prompt }],
      }));
      if (!result.ok) {
        return {
          content: [{ type: "text", text: result.text }],
        };
      }
      const message = asRecord(unwrapData(result.value));
      const info = asRecord(message?.info);
      const messageId = typeof info?.id === "string" ? info.id : "(unknown)";
      const outMessage = messageId.startsWith("msg_") ? aliasFor("message", messageId) : messageId;
      return {
        content: [{ type: "text", text: `session ${outSession}\nmessage ${outMessage}\naccepted` }],
      };
    },
  );

  server.registerTool(
    "session_state",
    {
      description: "Check whether a session (id or title) is busy, idle, or retrying.",
      inputSchema: {
        session: z.string().optional().describe("Session reference (id or exact title)"),
        sessionId: z.string().optional().describe("Legacy alias for session"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ session, sessionId }) => {
      const ref = pickSessionRef(session, sessionId);
      if (!ref) {
        return {
          content: [{ type: "text", text: "session_state: missing session" }],
        };
      }
      const resolved = await resolveSessionRef("session_state", ref);
      if (!resolved.ok) {
        return {
          content: [{ type: "text", text: resolved.text }],
        };
      }
      const resolvedSessionId = resolved.sessionId;
      const outSession = resolvedSessionId.startsWith("ses_") ? aliasFor("session", resolvedSessionId) : resolvedSessionId;
      const statuses = await safeClientCall("session_state", () => getOpencodeClient().listSessionStatus());
      if (!statuses.ok) {
        return {
          content: [{ type: "text", text: statuses.text }],
        };
      }
      const result = asRecord(unwrapData(statuses.value));
      const state = result?.[resolvedSessionId];
      if (state === undefined) {
        return {
          content: [{ type: "text", text: `session ${outSession}\nstate unknown` }],
        };
      }
      return {
        content: [{ type: "text", text: `session ${outSession}\n${formatSessionState(state)}` }],
      };
    },
  );

  server.registerTool(
    "session_final_output",
    {
      description: "Get final assistant output when a session (id or title) is idle.",
      inputSchema: {
        session: z.string().optional().describe("Session reference (id or exact title)"),
        sessionId: z.string().optional().describe("Legacy alias for session"),
        maxChars: z.number().int().min(200).max(50000).optional().default(API_TEXT_LIMIT),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ session, sessionId, maxChars }) => {
      const ref = pickSessionRef(session, sessionId);
      if (!ref) {
        return {
          content: [{ type: "text", text: "session_final_output: missing session" }],
        };
      }
      const resolved = await resolveSessionRef("session_final_output", ref);
      if (!resolved.ok) {
        return {
          content: [{ type: "text", text: resolved.text }],
        };
      }
      const resolvedSessionId = resolved.sessionId;
      const outSession = resolvedSessionId.startsWith("ses_") ? aliasFor("session", resolvedSessionId) : resolvedSessionId;
      const statuses = await safeClientCall("session_final_output", () => getOpencodeClient().listSessionStatus());
      if (!statuses.ok) {
        return {
          content: [{ type: "text", text: statuses.text }],
        };
      }
      const stateMap = asRecord(unwrapData(statuses.value));
      const state = stateMap?.[resolvedSessionId];
      if (!asRecord(state) || asRecord(state)?.type !== "idle") {
        return {
          content: [{ type: "text", text: `session ${outSession}\n${formatSessionState(state)}` }],
        };
      }

      const messagesResult = await safeClientCall("session_final_output", () => getOpencodeClient().listMessages(resolvedSessionId));
      if (!messagesResult.ok) {
        return {
          content: [{ type: "text", text: messagesResult.text }],
        };
      }
      const messages = toRecordArray(messagesResult.value, ["messages", "rows"]);
      const finalMessage = [...messages].reverse().find((message) => {
        const info = asRecord(message.info);
        return info?.role === "assistant";
      });

      if (!finalMessage) {
        return {
          content: [{ type: "text", text: `session ${outSession}\n(no assistant output)` }],
        };
      }

      return {
        content: [{ type: "text", text: `session ${outSession}\n${formatFinalMessage(finalMessage, maxChars)}` }],
      };
    },
  );

  server.registerTool(
    "session_semantic_search",
    {
      description: "Semantic search in OpenPlanner for one session (id or title).",
      inputSchema: {
        session: z.string().optional().describe("Session reference (id or exact title)"),
        sessionId: z.string().optional().describe("Legacy alias for session"),
        query: z.string().min(1),
        limit: z.number().int().min(1).max(200).optional().default(20),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ session, sessionId, query, limit }) => {
      const ref = pickSessionRef(session, sessionId);
      if (!ref) {
        return {
          content: [{ type: "text", text: "session_semantic_search: missing session" }],
        };
      }
      const resolved = await resolveSessionRef("session_semantic_search", ref);
      if (!resolved.ok) {
        return {
          content: [{ type: "text", text: resolved.text }],
        };
      }
      const result = await safeClientCall("session_semantic_search", () => getOpenPlannerClient().searchVector({
        q: query,
        k: limit,
        where: { session: resolved.sessionId },
      }));
      if (!result.ok) {
        return {
          content: [{ type: "text", text: result.text }],
        };
      }
      const outSession = resolved.sessionId.startsWith("ses_") ? aliasFor("session", resolved.sessionId) : resolved.sessionId;
      return {
        content: [{ type: "text", text: `session ${outSession}\n${formatOpenplannerVector(result.value, limit)}` }],
      };
    },
  );

  server.registerTool(
    "session_grep",
    {
      description: "Search session text in OpenPlanner using full-text search (id or title).",
      inputSchema: {
        session: z.string().optional().describe("Session reference (id or exact title)"),
        sessionId: z.string().optional().describe("Legacy alias for session"),
        pattern: z.string().min(1),
        maxResults: z.number().int().min(1).max(200).optional().default(40),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ session, sessionId, pattern, maxResults }) => {
      const ref = pickSessionRef(session, sessionId);
      if (!ref) {
        return {
          content: [{ type: "text", text: "session_grep: missing session" }],
        };
      }
      const resolved = await resolveSessionRef("session_grep", ref);
      if (!resolved.ok) {
        return {
          content: [{ type: "text", text: resolved.text }],
        };
      }
      const result = await safeClientCall("session_grep", () => getOpenPlannerClient().searchFts({
        q: pattern,
        limit: maxResults,
        session: resolved.sessionId,
      }));
      if (!result.ok) {
        return {
          content: [{ type: "text", text: result.text }],
        };
      }
      return {
        content: [{ type: "text", text: formatOpenplannerRows(result.value, maxResults) }],
      };
    },
  );

  server.registerTool(
    "session_glob",
    {
      description: "Glob-match file paths mentioned in a session's OpenPlanner events (id or title).",
      inputSchema: {
        session: z.string().optional().describe("Session reference (id or exact title)"),
        sessionId: z.string().optional().describe("Legacy alias for session"),
        pattern: z.string().min(1),
        maxResults: z.number().int().min(1).max(500).optional().default(100),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ session, sessionId, pattern, maxResults }) => {
      const ref = pickSessionRef(session, sessionId);
      if (!ref) {
        return {
          content: [{ type: "text", text: "session_glob: missing session" }],
        };
      }
      const resolved = await resolveSessionRef("session_glob", ref);
      if (!resolved.ok) {
        return {
          content: [{ type: "text", text: resolved.text }],
        };
      }
      const sessionResult = await safeClientCall("session_glob", () => getOpenPlannerClient().getSession(resolved.sessionId));
      if (!sessionResult.ok) {
        return {
          content: [{ type: "text", text: sessionResult.text }],
        };
      }
      const sessionData = asRecord(unwrapData(sessionResult.value));
      const rows = Array.isArray(sessionData?.rows) ? sessionData.rows : [];
      const matcher = globToRegex(pattern);
      const matches = new Set<string>();

      for (const row of rows) {
        const record = asRecord(row);
        const text = typeof record?.text === "string" ? record.text : "";
        if (text.length === 0) {
          continue;
        }
        for (const pathText of extractPathsLoose(text)) {
          if (matcher.test(pathText)) {
            matches.add(pathText);
          }
          if (matches.size >= maxResults) {
            break;
          }
        }
        if (matches.size >= maxResults) {
          break;
        }
      }

      if (matches.size === 0) {
        return {
          content: [{ type: "text", text: "(no matches)" }],
        };
      }

      return {
        content: [{ type: "text", text: [...matches].join("\n") }],
      };
    },
  );

  server.registerTool(
    "workspace_meta",
    {
      description: "Get workspace metadata.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async () => {
      const result = await callApi(ENV.WORKSPACE_API_BASE_URL, "GET", "/meta", undefined, ENV.WORKSPACE_API_KEY);
      return {
        content: [{ type: "text", text: formatApiResult("workspace_meta", result) }],
      };
    },
  );

  server.registerTool(
    "workspace_list",
    {
      description: "List workspace entries for a path.",
      inputSchema: {
        path: z.string().optional().default(".").describe("Path to list (defaults to current directory)"),
        limit: z.number().int().min(1).max(500).optional().describe("Maximum number of entries to return"),
        includeHidden: z.boolean().optional().default(false).describe("Set true to include hidden files and directories"),
        maxChars: z.number().int().min(200).max(50000).optional().default(API_TEXT_LIMIT).describe("Maximum characters in response"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ path, limit, includeHidden, maxChars }) => {
      const apiPath = buildApiPath("/list", {
        path,
        limit,
        includeHidden,
      });
      const result = await callApi(ENV.WORKSPACE_API_BASE_URL, "GET", apiPath, undefined, ENV.WORKSPACE_API_KEY);
      return {
        content: [{ type: "text", text: formatApiResult("workspace_list", result, maxChars) }],
      };
    },
  );

  server.registerTool(
    "workspace_file_read",
    {
      description: "Read a file from workspace storage.",
      inputSchema: {
        path: z.string().min(1).describe("Path of the file to read"),
        maxChars: z.number().int().min(200).max(50000).optional().default(API_TEXT_LIMIT).describe("Maximum characters in response"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ path, maxChars }) => {
      const apiPath = buildApiPath("/file", { path });
      const result = await callApi(ENV.WORKSPACE_API_BASE_URL, "GET", apiPath, undefined, ENV.WORKSPACE_API_KEY);
      return {
        content: [{ type: "text", text: formatApiResult("workspace_file_read", result, maxChars) }],
      };
    },
  );

  server.registerTool(
    "workspace_file_write",
    {
      description: "Write or overwrite a file in workspace storage.",
      inputSchema: {
        path: z.string().min(1).describe("Workspace file path to write (for example: src/hack.ts or docs/notes.md)"),
        content: z.string().describe("Full UTF-8 text content to write"),
        maxChars: z.number().int().min(200).max(50000).optional().default(API_TEXT_LIMIT).describe("Response truncation limit in characters (200-50000, default: API_TEXT_LIMIT)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: true,
      },
    },
    async ({ path, content, maxChars }) => {
      const result = await callApi(
        ENV.WORKSPACE_API_BASE_URL,
        "POST",
        "/file",
        { path, content },
        ENV.WORKSPACE_API_KEY,
      );
      return {
        content: [{ type: "text", text: formatApiResult("workspace_file_write", result, maxChars) }],
      };
    },
  );

  server.registerTool(
    "workspace_file_replace",
    {
      description: "Replace a file in workspace storage.",
      inputSchema: {
        path: z.string().min(1).describe("Workspace file path to write (for example: src/hack.ts or docs/notes.md)"),
        content: z.string().describe("Full UTF-8 text content to write"),
        maxChars: z.number().int().min(200).max(50000).optional().default(API_TEXT_LIMIT).describe("Response truncation limit in characters (200-50000, default: API_TEXT_LIMIT)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: true,
      },
    },
    async ({ path, content, maxChars }) => {
      const result = await callApi(
        ENV.WORKSPACE_API_BASE_URL,
        "PUT",
        "/file",
        { path, content },
        ENV.WORKSPACE_API_KEY,
      );
      return {
        content: [{ type: "text", text: formatApiResult("workspace_file_replace", result, maxChars) }],
      };
    },
  );

  server.registerTool(
    "delegate_task",
    {
      description: "Create an OpenCode session for an agent, then submit a prompt.",
      inputSchema: {
        agentType: z.string().min(1),
        prompt: z.string().min(1),
        title: z.string().optional(),
        includeActiveSkills: z.boolean().optional().default(false).describe("Prepend active skill content to the prompt"),
        maxSkillChars: z.number().int().min(500).max(50000).optional().default(10000).describe("Maximum characters from active skills to include (when includeActiveSkills is true)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: true,
      },
    },
    async ({ agentType, prompt, title, includeActiveSkills, maxSkillChars }) => {
      const normalizedAgentType = agentType.trim();
      const primaryAgents = await listPrimaryAgentNames();
      if (!primaryAgents.ok) {
        return {
          content: [{
            type: "text",
            text: `${primaryAgents.errorText}\ndelegate_task: cannot validate agent mode; refusing delegation.`,
          }],
        };
      }

      if (!primaryAgents.names.includes(normalizedAgentType.toLowerCase())) {
        return {
          content: [{
            type: "text",
            text: `delegate_task: agent \"${normalizedAgentType}\" is not a primary agent. Use list_agents to choose a primary agent.`,
          }],
        };
      }

      const finalTitle = title?.trim().length ? title.trim() : `Agent session: ${normalizedAgentType}`;
      const createResult = await callApi(
        ENV.OPENCODE_API_BASE_URL,
        "POST",
        "/session",
        {
          title: finalTitle,
          agent: normalizedAgentType,
        },
        ENV.OPENCODE_API_KEY,
      );

      if (!createResult.ok) {
        return {
          content: [{ type: "text", text: formatApiResult("delegate_task create-session", createResult) }],
        };
      }

      const sessionId = extractSessionId(createResult.json);
      if (!sessionId) {
        return {
          content: [{ type: "text", text: formatApiResult("delegate_task create-session", createResult) }],
        };
      }

      let finalPrompt = prompt;
      if (includeActiveSkills && activeSkills.size > 0) {
        const skillPreamble = buildActiveSkillPreamble(maxSkillChars);
        if (skillPreamble.length > 0) {
          finalPrompt = `Active skills are loaded and will inform your behavior.${skillPreamble}\n\n${prompt}`;
        }
      }

      const promptResult = await callApi(
        ENV.OPENCODE_API_BASE_URL,
        "POST",
        `/session/${sessionId}/prompt_async`,
        {
          parts: [{ type: "text", text: finalPrompt }],
          agent: normalizedAgentType,
        },
        ENV.OPENCODE_API_KEY,
      );

      if (!promptResult.ok) {
        return {
          content: [{ type: "text", text: formatApiResult("delegate_task prompt", promptResult) }],
        };
      }

      return {
        content: [{
          type: "text",
          text: formatDelegateTaskResult({
            sessionId,
            agentType: normalizedAgentType,
            title: finalTitle,
            promptStatus: promptResult.status,
            promptOk: promptResult.ok,
          }),
        }],
      };
    },
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

  server.resource("skill-guide", "skills://guide", async (uri) => {
    return {
      contents: [{
        uri: uri.href,
        mimeType: "text/plain",
        text: [
          "Skills are reusable instruction bundles loaded from SKILL.md files.",
          "Roots: .opencode/skills (workspace), ~/.config/opencode/skills (global).",
          "",
          "Skill Tools:",
          "- list_skills: Browse all skills (preview=N for content preview)",
          "- find_skill: Keyword name, description, match by or path",
          "- skill_read: Get full SKILL.md content + metadata",
          "- skill_show: Get skill details with parsed description + content",
          "- skill_active_list: List currently active skills",
          "- activate_skill: Mark a skill as active for delegation",
          "- auto_skill_select: Semantic ranking via OpenPlanner vector search",
          "",
          "Delegation:",
          "- delegate_task with includeActiveSkills=true prepends loaded skills to prompts",
          "- Skills are automatically loaded from .opencode/skills and ~/.config/opencode/skills",
          "",
          "For session tools, pass a session title/id directly instead of searching local files for session references.",
          "Skill indexing refreshes at bootstrap and whenever SKILL.md files change.",
        ].join("\n"),
      }],
    };
  });

  return server;
}

await bootstrapSkills();

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
    await storeSessionRecord(sessionId, {
      createdAt: Date.now(),
      processId: process.pid,
    });
  },
  onSessionClosed: async (sessionId: string) => {
    await deleteSessionRecord(sessionId);
  },
  onUnknownSession: async (sessionId: string, _req: McpHttpRequest, res: McpHttpResponse) => {
    const sessionData = await loadSessionRecord(sessionId);
    const decision = decideUnknownSession(sessionData, process.pid);

    if (decision.action === "missing") {
      return false;
    }

    if (decision.action === "allow" && decision.touchOnly) {
      await touchSessionRecord(sessionId);
      return false;
    }

    if (decision.action === "allow" && !decision.touchOnly) {
      await storeSessionRecord(sessionId, decision.nextRecord);
      return false;
    }

    res.status(409).send(`Session ${sessionId} is owned by another active process. Re-initialize MCP session.`);
    return true;
  },
});

// Apply body parsers to MCP routes that need JSON parsing
app.post("/mcp", jsonParser, maybeBearer, async (req, res) => {
  const sessionId = resolveMcpSessionIdFromReq(req as McpHttpRequest);
  if (sessionId) {
    await touchOrAdoptSessionRecord(sessionId);
  }
  await requestContext.run({ mcpSessionId: sessionId }, async () => {
    await mcpRouter.handlePost(req, res);
  });
});

app.get("/mcp", maybeBearer, async (req, res) => {
  const sessionId = resolveMcpSessionIdFromReq(req as McpHttpRequest);
  if (sessionId) {
    await touchOrAdoptSessionRecord(sessionId);
  }
  await requestContext.run({ mcpSessionId: sessionId }, async () => {
    await mcpRouter.handleSession(req, res);
  });
});

app.delete("/mcp", maybeBearer, async (req, res) => {
  const sessionId = resolveMcpSessionIdFromReq(req as McpHttpRequest);
  if (sessionId) {
    await touchOrAdoptSessionRecord(sessionId);
  }
  await requestContext.run({ mcpSessionId: sessionId }, async () => {
    await mcpRouter.handleSession(req, res);
  });
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
  await oauth.stop();
  await redis.quit();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nReceived SIGTERM, shutting down gracefully...");
  await oauth.stop();
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

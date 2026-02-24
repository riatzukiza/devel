Cool — if your OAuth provider is GitHub, the main change is **token verification**:

* GitHub doesn’t provide an RFC7662 `/introspect` endpoint, but it *does* provide a **“Check a token”** endpoint you can call with **Basic auth (client_id:client_secret)**:
  `POST https://api.github.com/applications/{client_id}/token` with JSON `{ "access_token": "..." }`. ([GitHub Docs][1])

Below is a **full, drop-in replacement** for the server that uses that endpoint to validate bearer tokens and pull scopes/user/expiry from the response. ([GitHub Docs][1])

---

## `.env.example` (GitHub)

```bash
PORT=8787
PUBLIC_BASE_URL=http://localhost:8787
MCP_PATH=/mcp

FS_ROOT=./data
FS_ALLOW_WRITE=false
FS_MAX_READ_BYTES=1048576

# GitHub OAuth App credentials (the same app ChatGPT will authorize against)
GITHUB_CLIENT_ID=Iv1_xxxxxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# GitHub API version header (recommended by GitHub docs)
GITHUB_API_VERSION=2022-11-28

# Optional: enforce required GitHub OAuth scopes for MCP access
# (these MUST be GitHub scopes, e.g. read:user, user:email, repo, etc.)
REQUIRED_SCOPES=read:user
```

> You’ll need to register a GitHub OAuth app and set its callback URL appropriately (GitHub calls out the callback URL as the critical security control). ([GitHub Docs][2])

---

## `src/index.ts` (GitHub token verification)

```ts
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs/promises";
import { URL } from "node:url";

import { z } from "zod";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import type { OAuthTokenVerifier } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

import {
  getOAuthProtectedResourceMetadataUrl,
  mcpAuthMetadataRouter
} from "@modelcontextprotocol/sdk/server/auth/router.js";

import type { OAuthMetadata } from "@modelcontextprotocol/sdk/shared/auth.js";

function must<T>(v: T | undefined | null, msg: string): T {
  if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
    throw new Error(msg);
  }
  return v;
}

function envBool(name: string, fallback = false): boolean {
  const v = process.env[name];
  if (v === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

function envInt(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Jail any user-supplied path to FS_ROOT to prevent traversal.
 */
function makePathJail(rootAbs: string) {
  const rootWithSep = rootAbs.endsWith(path.sep) ? rootAbs : rootAbs + path.sep;

  return function safeResolve(userPath: string): string {
    const cleaned = userPath?.trim() ? userPath.trim() : ".";
    const resolved = path.resolve(rootAbs, cleaned);
    if (resolved === rootAbs) return resolved;
    if (!resolved.startsWith(rootWithSep)) {
      throw new Error(`Path escapes FS_ROOT: ${userPath}`);
    }
    return resolved;
  };
}

async function readFileCapped(filePath: string, maxBytes: number): Promise<string> {
  const st = await fs.stat(filePath);
  if (!st.isFile()) throw new Error("Not a file");
  if (st.size > maxBytes) throw new Error(`File too large to read (${st.size} bytes > ${maxBytes})`);
  return await fs.readFile(filePath, "utf8");
}

/**
 * GitHub "Check a token" verifier:
 * POST https://api.github.com/applications/{client_id}/token
 * Basic auth: client_id:client_secret
 * Body: {"access_token": "<token>"}
 *
 * Valid tokens return 200 with scopes, user, expires_at, etc.
 * Invalid tokens return 404. :contentReference[oaicite:5]{index=5}
 */
function makeGitHubTokenVerifier(opts: {
  githubClientId: string;
  githubClientSecret: string;
  githubApiVersion: string;
  requiredScopes: string[];
}): OAuthTokenVerifier {
  const { githubClientId, githubClientSecret, githubApiVersion, requiredScopes } = opts;

  const basic = Buffer.from(`${githubClientId}:${githubClientSecret}`, "utf8").toString("base64");
  const checkUrl = `https://api.github.com/applications/${encodeURIComponent(githubClientId)}/token`;

  return {
    async verifyAccessToken(token: string): Promise<AuthInfo> {
      const r = await fetch(checkUrl, {
        method: "POST",
        headers: {
          "accept": "application/vnd.github+json",
          "x-github-api-version": githubApiVersion,
          "authorization": `Basic ${basic}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({ access_token: token })
      });

      if (r.status === 404) throw new Error("Invalid token");
      if (!r.ok) throw new Error(`GitHub token check failed (${r.status})`);

      const data: any = await r.json();

      // Response includes: scopes[], expires_at, user{login,id,...}, app{client_id,...} :contentReference[oaicite:6]{index=6}
      const scopes: string[] = Array.isArray(data.scopes) ? data.scopes : [];
      if (requiredScopes.length > 0) {
        const missing = requiredScopes.filter((s) => !scopes.includes(s));
        if (missing.length) throw new Error(`Missing required scopes: ${missing.join(", ")}`);
      }

      const expiresAt =
        typeof data.expires_at === "string" && data.expires_at
          ? Math.floor(new Date(data.expires_at).getTime() / 1000)
          : undefined;

      const clientId = (data?.app?.client_id ?? githubClientId) as string;

      return {
        token,
        clientId,
        scopes,
        expiresAt,
        extra: {
          github_user_login: data?.user?.login ?? null,
          github_user_id: data?.user?.id ?? null,
          github_token_last_eight: data?.token_last_eight ?? null
        }
      };
    }
  };
}

async function main() {
  const PORT = envInt("PORT", 8787);
  const PUBLIC_BASE_URL = must(process.env.PUBLIC_BASE_URL, "PUBLIC_BASE_URL is required");
  const MCP_PATH = process.env.MCP_PATH ?? "/mcp";

  const FS_ROOT = path.resolve(process.env.FS_ROOT ?? "./data");
  const FS_ALLOW_WRITE = envBool("FS_ALLOW_WRITE", false);
  const FS_MAX_READ_BYTES = envInt("FS_MAX_READ_BYTES", 1024 * 1024);

  await fs.mkdir(FS_ROOT, { recursive: true });
  const safeResolve = makePathJail(FS_ROOT);

  const mcpServerUrl = new URL(`${PUBLIC_BASE_URL}${MCP_PATH}`);
  const resourceMetadataUrl = getOAuthProtectedResourceMetadataUrl(mcpServerUrl);

  const githubClientId = must(process.env.GITHUB_CLIENT_ID, "GITHUB_CLIENT_ID is required");
  const githubClientSecret = must(process.env.GITHUB_CLIENT_SECRET, "GITHUB_CLIENT_SECRET is required");
  const githubApiVersion = process.env.GITHUB_API_VERSION ?? "2022-11-28";
  const requiredScopes =
    (process.env.REQUIRED_SCOPES ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  // GitHub doesn't publish standard OAuth AS metadata at /.well-known,
  // so we provide the key endpoints explicitly to clients via this server's metadata route.
  // Authorization: https://github.com/login/oauth/authorize
  // Token:         https://github.com/login/oauth/access_token :contentReference[oaicite:7]{index=7}
  const oauthMetadata: OAuthMetadata = {
    issuer: "https://github.com",
    authorization_endpoint: "https://github.com/login/oauth/authorize",
    token_endpoint: "https://github.com/login/oauth/access_token",
    device_authorization_endpoint: "https://github.com/login/device/code"
  };

  const tokenVerifier = makeGitHubTokenVerifier({
    githubClientId,
    githubClientSecret,
    githubApiVersion,
    requiredScopes
  });

  const mcp = new McpServer({
    name: "mcp-fs-http-github-oauth",
    version: "0.1.0"
  });

  // ---- Tools ----

  mcp.tool(
    "fs.list",
    "List directory entries under FS_ROOT (jailed).",
    {
      dir: z.string().default("."),
      recursive: z.boolean().default(false),
      maxEntries: z.number().int().min(1).max(5000).default(500),
      maxDepth: z.number().int().min(0).max(25).default(5)
    },
    async ({ dir, recursive, maxEntries, maxDepth }, extra) => {
      const base = safeResolve(dir);

      const out: Array<{ path: string; type: "file" | "dir" | "other"; size?: number }> = [];
      let count = 0;

      async function walk(currentAbs: string, relFromRoot: string, depth: number) {
        if (count >= maxEntries) return;
        if (depth > maxDepth) return;

        const entries = await fs.readdir(currentAbs, { withFileTypes: true });
        for (const ent of entries) {
          if (count >= maxEntries) break;

          const childAbs = path.join(currentAbs, ent.name);
          const childRel = path.join(relFromRoot, ent.name);

          if (ent.isDirectory()) {
            out.push({ path: childRel, type: "dir" });
            count++;
            if (recursive) await walk(childAbs, childRel, depth + 1);
          } else if (ent.isFile()) {
            const st = await fs.stat(childAbs);
            out.push({ path: childRel, type: "file", size: st.size });
            count++;
          } else {
            out.push({ path: childRel, type: "other" });
            count++;
          }
        }
      }

      await walk(base, path.relative(FS_ROOT, base) || ".", 0);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                root: FS_ROOT,
                githubUser: extra?.authInfo?.extra?.github_user_login ?? null,
                entries: out
              },
              null,
              2
            )
          }
        ]
      };
    }
  );

  mcp.tool(
    "fs.read",
    "Read a UTF-8 file under FS_ROOT (jailed).",
    { file: z.string(), maxBytes: z.number().int().min(1).max(10 * 1024 * 1024).optional() },
    async ({ file, maxBytes }) => {
      const abs = safeResolve(file);
      const text = await readFileCapped(abs, maxBytes ?? FS_MAX_READ_BYTES);
      return { content: [{ type: "text", text }] };
    }
  );

  mcp.tool(
    "fs.write",
    "Write a UTF-8 file under FS_ROOT (jailed). Requires FS_ALLOW_WRITE=true.",
    { file: z.string(), text: z.string(), mkdirp: z.boolean().default(true), overwrite: z.boolean().default(true) },
    async ({ file, text, mkdirp, overwrite }) => {
      if (!FS_ALLOW_WRITE) throw new Error("Writes disabled (FS_ALLOW_WRITE=false)");
      const abs = safeResolve(file);

      if (mkdirp) await fs.mkdir(path.dirname(abs), { recursive: true });

      if (!overwrite) {
        try {
          await fs.stat(abs);
          throw new Error("Refusing to overwrite existing file (overwrite=false)");
        } catch {
          // ok if missing
        }
      }

      await fs.writeFile(abs, text, "utf8");
      return { content: [{ type: "text", text: `Wrote ${file}` }] };
    }
  );

  // ---- HTTP app ----

  const app = express();
  app.use(cors());
  app.use(
    express.json({
      limit: "2mb",
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );

  // Serves OAuth Protected Resource Metadata + includes OAuth endpoints clients should use.
  app.use(
    mcpAuthMetadataRouter({
      oauthMetadata,
      resourceServerUrl: mcpServerUrl,
      resourceName: "Filesystem MCP (GitHub OAuth)",
      scopesSupported: requiredScopes.length ? requiredScopes : ["read:user"]
    })
  );

  // Bearer auth for MCP endpoint; on 401 it can advertise the resource metadata URL.
  app.use(
    MCP_PATH,
    requireBearerAuth({
      verifier: tokenVerifier,
      resourceMetadataUrl
    })
  );

  app.all(MCP_PATH, async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    });

    await mcp.connect(transport);
    await transport.handleRequest(req as any, res as any, req.body);
  });

  app.get("/", (_req, res) => {
    res.type("text/plain").send(
      [
        "mcp-fs-http-github-oauth",
        `MCP endpoint: ${mcpServerUrl.toString()}`,
        `FS_ROOT: ${FS_ROOT}`,
        `Writes enabled: ${FS_ALLOW_WRITE}`,
        `PRM: ${resourceMetadataUrl}`
      ].join("\n")
    );
  });

  app.listen(PORT, () => {
    console.log(`[mcp] listening on ${PUBLIC_BASE_URL}`);
    console.log(`[mcp] endpoint: ${mcpServerUrl.toString()}`);
    console.log(`[mcp] FS_ROOT: ${FS_ROOT}`);
    console.log(`[mcp] PRM: ${resourceMetadataUrl}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

---

## Getting a token (quick sanity test)

If you’re doing this from a CLI / headless environment, GitHub’s **device flow** is:

1. `POST https://github.com/login/device/code`
2. user enters code at `https://github.com/login/device`
3. poll `POST https://github.com/login/oauth/access_token` until you get an access token ([GitHub Docs][3])

Once you have a token, you can test the MCP endpoint:

```bash
curl -i \
  -H "Authorization: Bearer YOUR_GITHUB_OAUTH_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8787/mcp \
  --data '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

---

## One important gotcha with GitHub as “the OAuth server”

This design only works cleanly if the bearer token was minted for **your GitHub OAuth App** (the same `GITHUB_CLIENT_ID` you use server-side), because token validation is done via “Check a token” for that specific app. ([GitHub Docs][1])

---

If what you meant was “our *filesystem* lives in GitHub” (repo-backed instead of local disk), say the word and I’ll swap the storage layer to GitHub’s Contents API while keeping the exact same MCP + OAuth shape.

[1]: https://docs.github.com/en/rest/apps/oauth-applications "REST API endpoints for OAuth authorizations - GitHub Docs"
[2]: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authenticating-to-the-rest-api-with-an-oauth-app "Authenticating to the REST API with an OAuth app - GitHub Docs"
[3]: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps "Authorizing OAuth apps - GitHub Docs"

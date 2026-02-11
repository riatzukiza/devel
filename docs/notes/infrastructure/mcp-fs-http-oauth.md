Below is a **minimal remote MCP filesystem server** (TypeScript + Express) that speaks **Streamable HTTP** and is wired for **OAuth-protected resource discovery** (so a client like ChatGPT can learn where to authenticate from a `401` + `WWW-Authenticate` header). It uses the official TS MCP SDK’s Streamable HTTP transport and auth helpers. ([jsDelivr][1])

> Notes
>
> * This is **Resource Server (RS) only**: it **validates access tokens** (via OAuth token introspection) and **advertises OAuth metadata** to clients. That’s the clean RS/AS split the MCP auth flow is designed around. ([jsDelivr][2])
> * The MCP endpoint is `/mcp` and uses **StreamableHTTPServerTransport**. ([jsDelivr][1])
> * `requireBearerAuth` injects `req.auth` (token info) and can include the **Protected Resource Metadata URL** in `WWW-Authenticate` for `401`s. ([jsDelivr][3])

---

## Repo layout

* `package.json`
* `tsconfig.json`
* `.env.example`
* `src/index.ts`

---

## `package.json`

```json
{
  "name": "mcp-fs-http-oauth",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --env-file=.env --watch dist/index.js",
    "build": "tsc -p tsconfig.json",
    "start": "node --env-file=.env dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.20.2",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "typescript": "^5.6.3"
  },
  "engines": {
    "node": ">=18"
  }
}
```

---

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

---

## `.env.example`

```bash
# Where this server listens
PORT=8787
PUBLIC_BASE_URL=http://localhost:8787
MCP_PATH=/mcp

# Filesystem sandbox root (ALL paths are jailed to this dir)
FS_ROOT=./data
FS_ALLOW_WRITE=false
FS_MAX_READ_BYTES=1048576

# OAuth: metadata for the Authorization Server (AS) your client should use
# If your IdP supports RFC 8414 OAuth AS metadata, point these to your AS.
# (You can also paste a full JSON into OAUTH_METADATA_JSON instead.)
OAUTH_ISSUER_URL=https://YOUR-AUTH-SERVER.example.com

# Optional: if your AS doesn't have RFC8414 well-known endpoints, provide explicit JSON.
# OAUTH_METADATA_JSON={"issuer":"...","authorization_endpoint":"...","token_endpoint":"...","jwks_uri":"..."}

# OAuth: token introspection (server verifies Bearer tokens here)
OAUTH_INTROSPECTION_URL=https://YOUR-AUTH-SERVER.example.com/oauth2/introspect
OAUTH_RS_CLIENT_ID=your-resource-server-client-id
OAUTH_RS_CLIENT_SECRET=your-resource-server-client-secret

# Optional: enforce expected audience/resource
# OAUTH_EXPECTED_AUD=http://localhost:8787/mcp
```

---

## `src/index.ts`

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
    // Allow "" or "." to mean root
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
 * Load OAuth AS metadata.
 * - Prefer explicit JSON in OAUTH_METADATA_JSON
 * - Else fetch RFC8414 from {issuer}/.well-known/oauth-authorization-server
 * - Else fall back to OIDC discovery {issuer}/.well-known/openid-configuration
 */
async function loadOAuthMetadata(): Promise<OAuthMetadata> {
  const raw = process.env.OAUTH_METADATA_JSON;
  if (raw) return JSON.parse(raw) as OAuthMetadata;

  const issuer = must(process.env.OAUTH_ISSUER_URL, "OAUTH_ISSUER_URL or OAUTH_METADATA_JSON is required");
  const issuerUrl = new URL(issuer);

  const candidates = [
    new URL("/.well-known/oauth-authorization-server", issuerUrl),
    new URL("/.well-known/openid-configuration", issuerUrl)
  ];

  let lastErr: unknown = null;
  for (const u of candidates) {
    try {
      const r = await fetch(u.toString(), { headers: { "accept": "application/json" } });
      if (!r.ok) throw new Error(`${u.toString()} -> ${r.status}`);
      return (await r.json()) as OAuthMetadata;
    } catch (e) {
      lastErr = e;
    }
  }

  throw new Error(`Failed to load OAuth metadata from issuer ${issuerUrl.toString()}: ${String(lastErr)}`);
}

/**
 * OAuth token introspection verifier.
 * Returns MCP AuthInfo shape (token, clientId, scopes, expiresAt, resource?, extra?).
 */
function makeIntrospectionVerifier(opts: {
  introspectionUrl: string;
  clientId: string;
  clientSecret: string;
  expectedAud?: string;
  resourceServerUrl?: URL;
}): OAuthTokenVerifier {
  const { introspectionUrl, clientId, clientSecret, expectedAud, resourceServerUrl } = opts;

  return {
    async verifyAccessToken(token: string): Promise<AuthInfo> {
      const body = new URLSearchParams({ token });

      // RFC 7662 introspection typically uses client authentication.
      const basic = Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");
      const r = await fetch(introspectionUrl, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "authorization": `Basic ${basic}`,
          "accept": "application/json"
        },
        body
      });

      if (!r.ok) throw new Error(`Introspection failed (${r.status})`);
      const data: any = await r.json();

      if (!data.active) throw new Error("Inactive token");

      const scopes =
        typeof data.scope === "string"
          ? data.scope.split(" ").map((s: string) => s.trim()).filter(Boolean)
          : [];

      const expiresAt = data.exp ? Number(data.exp) : undefined;
      const tokenClientId = (data.client_id ?? data.azp ?? "unknown") as string;

      // Optional audience/resource enforcement (recommended for production).
      if (expectedAud) {
        const aud = data.aud;
        const audOk =
          aud === expectedAud ||
          (Array.isArray(aud) && aud.includes(expectedAud));
        if (!audOk) throw new Error("Token audience not allowed");
      }

      // If your AS uses RFC8707 "resource" indicator, you can attach it here.
      // MCP AuthInfo.resource, if set, MUST match this server's resource identifier.
      // (We keep it optional because IdPs vary in how they return resource/aud.)
      const resource =
        resourceServerUrl ? new URL(resourceServerUrl.toString()) : undefined;

      return {
        token,
        clientId: tokenClientId,
        scopes,
        expiresAt,
        resource,
        extra: {
          sub: data.sub,
          username: data.username,
          aud: data.aud,
          iss: data.iss
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

  const oauthMetadata = await loadOAuthMetadata();

  const introspectionUrl = must(process.env.OAUTH_INTROSPECTION_URL, "OAUTH_INTROSPECTION_URL is required");
  const rsClientId = must(process.env.OAUTH_RS_CLIENT_ID, "OAUTH_RS_CLIENT_ID is required");
  const rsClientSecret = must(process.env.OAUTH_RS_CLIENT_SECRET, "OAUTH_RS_CLIENT_SECRET is required");
  const expectedAud = process.env.OAUTH_EXPECTED_AUD;

  const tokenVerifier = makeIntrospectionVerifier({
    introspectionUrl,
    clientId: rsClientId,
    clientSecret: rsClientSecret,
    expectedAud,
    resourceServerUrl: mcpServerUrl
  });

  // MCP server + tools
  const mcp = new McpServer({
    name: "mcp-fs-http-oauth",
    version: "0.1.0"
  });

  // Tool: fs.list
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
                requestedBy: extra?.authInfo?.extra?.sub ?? null,
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

  // Tool: fs.read
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

  // Tool: fs.write
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

  // Tool: fs.delete
  mcp.tool(
    "fs.delete",
    "Delete a file or directory under FS_ROOT (jailed). Requires FS_ALLOW_WRITE=true.",
    { target: z.string(), recursive: z.boolean().default(false) },
    async ({ target, recursive }) => {
      if (!FS_ALLOW_WRITE) throw new Error("Deletes disabled (FS_ALLOW_WRITE=false)");
      const abs = safeResolve(target);

      const st = await fs.stat(abs);
      if (st.isDirectory()) {
        if (!recursive) {
          await fs.rmdir(abs);
        } else {
          await fs.rm(abs, { recursive: true, force: true });
        }
      } else {
        await fs.rm(abs, { force: true });
      }

      return { content: [{ type: "text", text: `Deleted ${target}` }] };
    }
  );

  // Tool: fs.stat
  mcp.tool(
    "fs.stat",
    "Stat a path under FS_ROOT (jailed).",
    { target: z.string() },
    async ({ target }) => {
      const abs = safeResolve(target);
      const st = await fs.stat(abs);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                target,
                isFile: st.isFile(),
                isDir: st.isDirectory(),
                size: st.size,
                mtimeMs: st.mtimeMs
              },
              null,
              2
            )
          }
        ]
      };
    }
  );

  // HTTP app
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

  // Advertise Protected Resource Metadata (PRM) and the AS metadata this RS relies on.
  // This is what lets a client discover how to auth after receiving a 401.
  app.use(
    mcpAuthMetadataRouter({
      oauthMetadata,
      resourceServerUrl: mcpServerUrl,
      resourceName: "Filesystem MCP",
      scopesSupported: ["fs.read", "fs.write"]
    })
  );

  const resourceMetadataUrl = getOAuthProtectedResourceMetadataUrl(mcpServerUrl);

  // Require OAuth bearer token for the MCP endpoint (adds req.auth on success).
  app.use(
    MCP_PATH,
    requireBearerAuth({
      verifier: tokenVerifier,
      // Optionally require scopes for all MCP access:
      // requiredScopes: ["fs.read"],
      resourceMetadataUrl
    })
  );

  // Handle MCP Streamable HTTP (stateless + JSON responses for simplicity)
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
        "mcp-fs-http-oauth",
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

## What makes this “ChatGPT compatible” (auth + transport)

* **Streamable HTTP transport** via `StreamableHTTPServerTransport`, with `handleRequest()` handling HTTP requests. ([jsDelivr][1])
* On missing/invalid auth, `requireBearerAuth` can respond `401` with a `WWW-Authenticate` header containing a **resource metadata URL** (OAuth Protected Resource Metadata), enabling clients to discover the right OAuth config. ([jsDelivr][3])
* The server also serves that metadata via `mcpAuthMetadataRouter(...)`. ([jsDelivr][2])

(Also: the MCP auth spec strongly recommends OAuth 2.1 patterns, exact redirect validation, and state checking. ([Model Context Protocol][4]))

---

## Run it

```bash
npm i
cp .env.example .env
npm run build
npm start
```

Then visit:

* `GET /` (sanity)
* `POST /mcp` (MCP endpoint; will `401` without Bearer token)
* `/.well-known/oauth-protected-resource/mcp` (the resource metadata endpoint implied by the helper) ([jsDelivr][2])

---

## Tool surface

* `fs.list { dir, recursive, maxEntries, maxDepth }`
* `fs.read { file, maxBytes? }`
* `fs.write { file, text, mkdirp, overwrite }` *(requires `FS_ALLOW_WRITE=true`)*
* `fs.delete { target, recursive }` *(requires `FS_ALLOW_WRITE=true`)*
* `fs.stat { target }`

All user paths are **jailed to `FS_ROOT`**.

---

## Practical hardening checklist

* Put it behind HTTPS (reverse proxy) and set `PUBLIC_BASE_URL` to the public `https://...`.
* Enforce `OAUTH_EXPECTED_AUD` (or a stricter resource/audience rule) in `verifyAccessToken`.
* Keep `FS_ALLOW_WRITE=false` unless you truly want write access.
* Consider per-scope gating (`requiredScopes`) or per-tool gating using `req.auth.scopes` (available via `extra.authInfo` in MCP handlers). ([jsDelivr][3])

---

If you tell me which OAuth provider you’re using (Keycloak/Auth0/Entra/Cloudflare/etc.), I’ll adapt the verifier + metadata fields so it “just works” with that provider’s introspection/claims conventions—without changing the MCP/tool layer. Also, if you want this to act as both **RS + AS** (dynamic client registration + token endpoints hosted by this same server), that’s doable too (it uses the SDK’s `mcpAuthRouter`), but it’s a slightly bigger file. ([jsDelivr][2])

[1]: https://cdn.jsdelivr.net/npm/%40modelcontextprotocol/sdk%401.12.0/dist/cjs/server/streamableHttp.d.ts "cdn.jsdelivr.net"
[2]: https://cdn.jsdelivr.net/npm/%40modelcontextprotocol/sdk%401.20.2/dist/esm/server/auth/router.d.ts "cdn.jsdelivr.net"
[3]: https://cdn.jsdelivr.net/npm/%40modelcontextprotocol/sdk%401.20.2/dist/esm/server/auth/middleware/bearerAuth.d.ts "cdn.jsdelivr.net"
[4]: https://modelcontextprotocol.io/specification/draft/basic/authorization?utm_source=chatgpt.com "Authorization"

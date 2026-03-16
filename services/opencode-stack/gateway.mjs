import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { URL } from "node:url";

const env = process.env;
const dataDir = env.OPENCODE_GATEWAY_DATA_DIR || "/srv/opencode-stack-data";
const secretsDir = join(dataDir, "secrets");
const allowlistPath = join(dataDir, "allowlist.json");
const sessionSecretPath = join(secretsDir, "session-secret.txt");
const adminPasswordPath = join(secretsDir, "admin-password.txt");
const publicPort = toPort(env.OPENCODE_GATEWAY_PUBLIC_PORT, 4180);
const adminPort = toPort(env.OPENCODE_GATEWAY_ADMIN_PORT, 4181);
const publicHost = env.OPENCODE_GATEWAY_PUBLIC_HOST || "0.0.0.0";
const adminHost = env.OPENCODE_GATEWAY_ADMIN_HOST || "0.0.0.0";
const publicSessionTtlSeconds = toInt(env.OPENCODE_GATEWAY_SESSION_TTL_SECONDS, 24 * 60 * 60);
const adminSessionTtlSeconds = toInt(env.OPENCODE_GATEWAY_ADMIN_SESSION_TTL_SECONDS, 12 * 60 * 60);
const upstreamUrl = new URL(env.OPENCODE_UPSTREAM_URL || "http://127.0.0.1:4096");
const janusUrl = new URL(env.OPENCODE_GATEWAY_JANUS_URL || "http://mcp-stack:8788");
const etaMuUpstreamUrl = new URL(env.ETA_MU_UPSTREAM_URL || "http://host.docker.internal:8787");
const opencodeUsername = env.OPENCODE_SERVER_USERNAME || "opencode";
const opencodePassword = env.OPENCODE_SERVER_PASSWORD || "";
const githubClientId = env.GITHUB_LOGIN_CLIENT_ID || env.OAUTH_GITHUB_CLIENT_ID || "";
const githubClientSecret = env.GITHUB_LOGIN_CLIENT_SECRET || env.OAUTH_GITHUB_CLIENT_SECRET || "";
const explicitRedirectUri = env.OAUTH_GITHUB_REDIRECT_URI || env.GITHUB_LOGIN_REDIRECT_URI || "";
const configuredPublicBaseUrl = env.PUBLIC_BASE_URL || env.OPENCODE_GATEWAY_PUBLIC_BASE_URL || "";
const bootstrapUsers = splitList(env.GITHUB_ALLOWED_USERS || env.OPENCODE_GITHUB_ALLOWED_USERS || "");
const sessionSecret = env.OPENCODE_GATEWAY_SESSION_SECRET || ensureSecret(sessionSecretPath, 32);
const adminPassword = env.OPENCODE_GATEWAY_ADMIN_PASSWORD || ensureSecret(adminPasswordPath, 24);
const pendingStates = new Map();
const sessionCookieName = "opencode_session";
const adminCookieName = "opencode_admin_session";
const opencodeBasePath = "/opencode";
const etaMuBasePath = normalizeBasePath(env.ETA_MU_BASE_PATH || "/eta-mu", "/eta-mu");
const opencodeHealthPath = `${opencodeBasePath}/health`;
const opencodeLoginPath = `${opencodeBasePath}/login`;
const opencodeLoginGithubPath = `${opencodeBasePath}/login/github`;
const opencodeAuthCallbackPath = `${opencodeBasePath}/auth/oauth/callback`;
const opencodeGithubCallbackPath = `${opencodeBasePath}/oauth/callback/github`;
const opencodeLogoutPath = `${opencodeBasePath}/logout`;
const opencodeAdminBasePath = `${opencodeBasePath}/admin`;
const sharedGithubCallbackPath = "/auth/oauth/callback";
const sharedGithubProviderCallbackPath = "/oauth/callback/github";

if (!opencodePassword) {
  throw new Error("OPENCODE_SERVER_PASSWORD is required for the gateway");
}

mkdirSync(secretsDir, { recursive: true });

let allowlist = loadAllowlist();

setInterval(cleanPendingStates, 60 * 1000).unref();

const publicServer = Bun.serve({
  hostname: publicHost,
  port: publicPort,
  fetch: handlePublicRequest,
  websocket: {
    async open(websocket) {
      const session = websocket.data.session;
      if (!session || !isAllowedLogin(session.login)) {
        websocket.close(1008, "Unauthorized");
        return;
      }

      const target = await establishUpstreamWebSocket(
        websocket.data.requestUrl,
        websocket.data.requestHeaders,
        session,
      ).catch(() => null);

      if (!target) {
        websocket.close(1011, "Upstream connection failed");
        return;
      }

      websocket.data.target = target;
      target.onmessage = async (event) => {
        if (typeof event.data === "string") {
          websocket.send(event.data);
          return;
        }
        if (event.data instanceof ArrayBuffer || ArrayBuffer.isView(event.data)) {
          websocket.send(event.data);
          return;
        }
        if (event.data instanceof Blob) {
          websocket.send(await event.data.arrayBuffer());
        }
      };
      target.onclose = () => {
        websocket.close();
      };
      target.onerror = () => {
        websocket.close(1011, "Upstream connection failed");
      };
    },
    message(websocket, message) {
      const target = websocket.data.target;
      if (!target || target.readyState !== WebSocket.OPEN) {
        websocket.close(1011, "Upstream connection unavailable");
        return;
      }
      target.send(message);
    },
    close(websocket) {
      const target = websocket.data.target;
      if (target && target.readyState === WebSocket.OPEN) {
        target.close();
      }
    },
  },
});

const adminServer = Bun.serve({
  hostname: adminHost,
  port: adminPort,
  fetch: handleAdminRequest,
});

console.log(`[opencode-gateway] public gateway listening on ${publicServer.url}`);
console.log(`[opencode-gateway] admin gateway listening on http://127.0.0.1:${adminPort}`);
console.log(`[opencode-gateway] allowlist file: ${allowlistPath}`);
console.log(`[opencode-gateway] admin password file: ${adminPasswordPath}`);

async function handlePublicRequest(requestObject, server) {
  const url = new URL(requestObject.url);
  const path = url.pathname;

  if (path.startsWith(opencodeAdminBasePath)) {
    return handleAdminRequest(requestObject);
  }

  if ((path === sharedGithubCallbackPath || path === sharedGithubProviderCallbackPath) && requestObject.method === "GET") {
    const state = url.searchParams.get("state") || "";
    if (state && pendingStates.has(state)) {
      const callbackUrl = new URL(opencodeGithubCallbackPath, url);
      url.searchParams.forEach((value, key) => {
        callbackUrl.searchParams.set(key, value);
      });
      return Response.redirect(callbackUrl.toString(), 307);
    }
    return proxyToJanus(requestObject);
  }

  if (path === "/health") {
    return jsonResponse({
      ok: true,
      githubOAuthConfigured: githubClientId.length > 0 && githubClientSecret.length > 0,
      allowlistCount: allowlist.users.length,
      redirectUriConfigured: resolveConfiguredRedirectUri(requestObject).length > 0,
    });
  }

  if (shouldProxyToJanus(path)) {
    return proxyToJanus(requestObject);
  }

  if (path === "/") {
    return redirect(opencodeBasePath);
  }

  if (path === opencodeHealthPath) {
    return jsonResponse({
      ok: true,
      githubOAuthConfigured: githubClientId.length > 0 && githubClientSecret.length > 0,
      allowlistCount: allowlist.users.length,
      redirectUriConfigured: resolveConfiguredRedirectUri(requestObject).length > 0,
    });
  }

  if (path === opencodeLoginPath && requestObject.method === "GET") {
    const session = readSessionCookie(requestObject, sessionCookieName, "public");
    if (session && isAllowedLogin(session.login)) {
      return redirect(url.searchParams.get("next") || opencodeBasePath);
    }
    return htmlResponse(renderPublicLoginPage({
      next: url.searchParams.get("next") || opencodeBasePath,
      error: url.searchParams.get("error") || "",
      githubEnabled: githubClientId.length > 0 && githubClientSecret.length > 0,
      redirectConfigured: resolveConfiguredRedirectUri(requestObject).length > 0,
    }));
  }

  if (path === opencodeLoginGithubPath && requestObject.method === "GET") {
    if (!githubClientId || !githubClientSecret) {
      return redirect(`${opencodeLoginPath}?error=github-not-configured`);
    }
    const redirectUri = resolveConfiguredRedirectUri(requestObject);
    if (!redirectUri) {
      return redirect(`${opencodeLoginPath}?error=redirect-not-configured`);
    }
    const state = randomValue(24);
    pendingStates.set(state, {
      next: sanitizeNext(url.searchParams.get("next") || opencodeBasePath),
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    const githubUrl = new URL("https://github.com/login/oauth/authorize");
    githubUrl.searchParams.set("client_id", githubClientId);
    githubUrl.searchParams.set("redirect_uri", redirectUri);
    githubUrl.searchParams.set("state", state);
    githubUrl.searchParams.set("scope", "read:user user:email");
    return Response.redirect(githubUrl.toString(), 302);
  }

  if (path === opencodeAuthCallbackPath && requestObject.method === "GET") {
    const callbackUrl = new URL(opencodeGithubCallbackPath, url);
    url.searchParams.forEach((value, key) => {
      callbackUrl.searchParams.set(key, value);
    });
    return Response.redirect(callbackUrl.toString(), 307);
  }

  if (path === opencodeGithubCallbackPath && requestObject.method === "GET") {
    const code = url.searchParams.get("code") || "";
    const state = url.searchParams.get("state") || "";
    const pending = pendingStates.get(state);
    pendingStates.delete(state);

    if (!code || !pending || pending.expiresAt < Date.now()) {
      return redirect(`${opencodeLoginPath}?error=oauth-state-invalid`);
    }

    if (!githubClientId || !githubClientSecret) {
      return redirect(`${opencodeLoginPath}?error=github-not-configured`);
    }

    const redirectUri = resolveConfiguredRedirectUri(requestObject);
    if (!redirectUri) {
      return redirect(`${opencodeLoginPath}?error=redirect-not-configured`);
    }

    const accessToken = await exchangeGithubCode({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
      code,
      redirectUri,
    }).catch(() => "");

    if (!accessToken) {
      return redirect(`${opencodeLoginPath}?error=github-token-failed`);
    }

    const githubUser = await fetchGithubUser(accessToken).catch(() => null);
    if (!githubUser?.login) {
      return redirect(`${opencodeLoginPath}?error=github-user-failed`);
    }

    const normalizedLogin = normalizeLogin(githubUser.login);
    if (!isAllowedLogin(normalizedLogin)) {
      return htmlResponse(renderDeniedPage(githubUser.login), 403);
    }

    const cookie = createSignedCookie({
      name: sessionCookieName,
      payload: {
        kind: "public",
        login: normalizedLogin,
        id: githubUser.id,
        exp: nowSeconds() + publicSessionTtlSeconds,
      },
      secure: shouldUseSecureCookies(requestObject),
      maxAge: publicSessionTtlSeconds,
    });

    return redirect(pending.next, 303, [cookie]);
  }

  if (path === opencodeLogoutPath) {
    return redirect(opencodeLoginPath, 303, [expireCookie(sessionCookieName)]);
  }

  const session = readSessionCookie(requestObject, sessionCookieName, "public");
  if (!session || !isAllowedLogin(session.login)) {
    if (shouldReturnHtml(requestObject)) {
      return redirect(`${opencodeLoginPath}?next=${encodeURIComponent(url.pathname + url.search)}`);
    }
    return jsonResponse({ error: "unauthorized", message: "GitHub login required" }, 401);
  }

  if (path === etaMuBasePath && requestObject.method === "GET") {
    const target = `${etaMuBasePath}/${url.search}`;
    return redirect(target, 307);
  }

  if (isWebSocketRequest(requestObject)) {
    const upgraded = server.upgrade(requestObject, {
      data: {
        session,
        requestUrl: requestObject.url,
        requestHeaders: Array.from(requestObject.headers.entries()),
      },
    });
    if (!upgraded) {
      return new Response("WebSocket upgrade failed", { status: 500 });
    }
    return;
  }

  return proxyHttpRequest(requestObject, session);
}

async function handleAdminRequest(requestObject) {
  if (!isLocalAdminHost(requestObject)) {
    return htmlResponse(renderAdminBlockedPage(), 403);
  }

  const url = new URL(requestObject.url);
  if (!url.pathname.startsWith(opencodeAdminBasePath)) {
    return htmlResponse(renderAdminBlockedPage(), 404);
  }
  const session = readSessionCookie(requestObject, adminCookieName, "admin");
  const relativePath = url.pathname.slice(opencodeAdminBasePath.length) || "/";

  if (relativePath === "/health") {
    return jsonResponse({ ok: true, localOnly: true, allowlistCount: allowlist.users.length });
  }

  if (relativePath === "/login" && requestObject.method === "GET") {
    if (session) {
      return redirect(opencodeAdminBasePath);
    }
    return htmlResponse(renderAdminLoginPage(url.searchParams.get("error") || ""));
  }

  if (relativePath === "/login" && requestObject.method === "POST") {
    const form = await readForm(requestObject);
    const password = String(form.get("password") || "");
    if (!safeEquals(password, adminPassword)) {
      return redirect(`${opencodeAdminBasePath}/login?error=bad-password`);
    }
    const cookie = createSignedCookie({
      name: adminCookieName,
      payload: {
        kind: "admin",
        login: "local-admin",
        exp: nowSeconds() + adminSessionTtlSeconds,
      },
      secure: false,
      maxAge: adminSessionTtlSeconds,
    });
    return redirect(opencodeAdminBasePath, 303, [cookie]);
  }

  if (relativePath === "/logout") {
    return redirect(`${opencodeAdminBasePath}/login`, 303, [expireCookie(adminCookieName)]);
  }

  if (!session) {
    return redirect(`${opencodeAdminBasePath}/login`);
  }

  if (relativePath === "/allowlist/add" && requestObject.method === "POST") {
    const form = await readForm(requestObject);
    const login = normalizeLogin(String(form.get("login") || ""));
    if (login) {
      allowlist = {
        users: Array.from(new Set([...allowlist.users, login])).sort(),
        updatedAt: new Date().toISOString(),
      };
      persistAllowlist();
    }
    return redirect(`${opencodeAdminBasePath}?message=allowlist-updated`);
  }

  if (relativePath === "/allowlist/remove" && requestObject.method === "POST") {
    const form = await readForm(requestObject);
    const login = normalizeLogin(String(form.get("login") || ""));
    allowlist = {
      users: allowlist.users.filter((entry) => entry !== login),
      updatedAt: new Date().toISOString(),
    };
    persistAllowlist();
    return redirect(`${opencodeAdminBasePath}?message=allowlist-updated`);
  }

  return htmlResponse(renderAdminHomePage({
    message: url.searchParams.get("message") || "",
    allowlistUsers: allowlist.users,
    adminPasswordPath,
    allowlistPath,
  }));
}

async function proxyHttpRequest(requestObject, session) {
  const upstream = new URL(requestObject.url);
  const target = resolveProtectedUpstream(upstream.pathname);
  rewriteMountedPath(upstream, target.basePath);
  upstream.protocol = target.upstream.protocol;
  upstream.hostname = target.upstream.hostname;
  upstream.port = target.upstream.port;

  const headers = buildUpstreamHeaders(requestObject.headers, session, target.kind);
  const response = await fetch(upstream, {
    method: requestObject.method,
    headers,
    body: requestObject.method === "GET" || requestObject.method === "HEAD" ? undefined : requestObject.body,
    duplex: requestObject.method === "GET" || requestObject.method === "HEAD" ? undefined : "half",
    redirect: "manual",
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("www-authenticate");
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

async function establishUpstreamWebSocket(requestUrl, requestHeaders, session) {
  const upstream = new URL(requestUrl);
  const target = resolveProtectedUpstream(upstream.pathname);
  rewriteMountedPath(upstream, target.basePath);
  upstream.protocol = target.upstream.protocol === "https:" ? "wss:" : "ws:";
  upstream.hostname = target.upstream.hostname;
  upstream.port = target.upstream.port;

  const sourceHeaders = new Headers(requestHeaders);
  const headers = buildUpstreamHeaders(sourceHeaders, session, target.kind);
  const protocols = (sourceHeaders.get("sec-websocket-protocol") || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const websocket = new WebSocket(upstream, {
    headers,
    protocols,
  });

  await new Promise((resolve, reject) => {
    websocket.onopen = resolve;
    websocket.onerror = reject;
  });

  return websocket;
}

function buildUpstreamHeaders(sourceHeaders, session, targetKind = "opencode") {
  const headers = new Headers();
  for (const [key, value] of sourceHeaders.entries()) {
    if (
      key === "authorization"
      || key === "cookie"
      || key === "content-length"
      || key === "host"
      || key === "connection"
      || key === "upgrade"
      || key.startsWith("sec-websocket-")
    ) {
      continue;
    }
    headers.set(key, value);
  }
  if (targetKind === "opencode") {
    headers.set("authorization", basicAuth(opencodeUsername, opencodePassword));
  }
  headers.set("x-authenticated-github-user", session.login);
  return headers;
}

function pathMatchesBase(pathname, basePath) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function normalizeBasePath(value, fallback) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return fallback;
  }
  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return normalized.length > 1 ? normalized.replace(/\/+$/, "") : normalized;
}

function resolveProtectedUpstream(pathname) {
  if (pathMatchesBase(pathname, etaMuBasePath)) {
    return {
      kind: "eta-mu",
      basePath: etaMuBasePath,
      upstream: etaMuUpstreamUrl,
    };
  }
  return {
    kind: "opencode",
    basePath: opencodeBasePath,
    upstream: upstreamUrl,
  };
}

function loadAllowlist() {
  mkdirSync(dirname(allowlistPath), { recursive: true });
  if (!existsSync(allowlistPath)) {
    const seeded = {
      users: Array.from(new Set(bootstrapUsers.map(normalizeLogin).filter(Boolean))).sort(),
      updatedAt: new Date().toISOString(),
    };
    writeJsonAtomic(allowlistPath, seeded);
    return seeded;
  }
  try {
    const parsed = JSON.parse(readFileSync(allowlistPath, "utf8"));
    if (!parsed || !Array.isArray(parsed.users)) {
      throw new Error("Invalid allowlist");
    }
    return {
      users: Array.from(new Set(parsed.users.map(normalizeLogin).filter(Boolean))).sort(),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    const fallback = {
      users: Array.from(new Set(bootstrapUsers.map(normalizeLogin).filter(Boolean))).sort(),
      updatedAt: new Date().toISOString(),
    };
    writeJsonAtomic(allowlistPath, fallback);
    return fallback;
  }
}

function persistAllowlist() {
  writeJsonAtomic(allowlistPath, allowlist);
}

function resolveConfiguredRedirectUri(requestObject) {
  if (explicitRedirectUri) {
    return explicitRedirectUri;
  }
  if (configuredPublicBaseUrl) {
    return new URL(opencodeAuthCallbackPath, configuredPublicBaseUrl).toString();
  }
  const forwardedHost = requestObject.headers.get("x-forwarded-host") || requestObject.headers.get("host") || "";
  const forwardedProto = requestObject.headers.get("x-forwarded-proto") || "";
  if (!forwardedHost || !forwardedProto) {
    return "";
  }
  return `${forwardedProto}://${forwardedHost}${opencodeAuthCallbackPath}`;
}

function shouldProxyToJanus(path) {
  return (
    path === "/health"
    || path === "/"
    || path.startsWith("/api/")
    || path === "/api"
    || path === "/mcp"
    || path.startsWith("/mcp/")
    || path === "/authorize"
    || path === "/token"
    || path === "/register"
    || path === "/revoke"
    || path.startsWith("/.well-known/")
    || path === "/login"
    || path.startsWith("/login/")
    || path === "/consent"
    || path.startsWith("/oauth/callback/")
    || path.startsWith("/auth/")
  );
}

async function proxyToJanus(requestObject) {
  try {
    const upstream = new URL(requestObject.url);
    upstream.protocol = janusUrl.protocol;
    upstream.hostname = janusUrl.hostname;
    upstream.port = janusUrl.port;

    const headers = new Headers(requestObject.headers);
    headers.set("x-forwarded-host", requestObject.headers.get("host") || "");
    headers.set("x-forwarded-proto", requestObject.headers.get("x-forwarded-proto") || "https");
    headers.delete("content-length");
    headers.delete("host");

    const response = await fetch(upstream, {
      method: requestObject.method,
      headers,
      body: requestObject.method === "GET" || requestObject.method === "HEAD" ? undefined : requestObject.body,
      duplex: requestObject.method === "GET" || requestObject.method === "HEAD" ? undefined : "half",
      redirect: "manual",
    });

    const responseHeaders = new Headers(response.headers);
    for (const headerName of [
      "connection",
      "keep-alive",
      "proxy-authenticate",
      "proxy-authorization",
      "te",
      "trailer",
      "transfer-encoding",
      "upgrade",
      "content-length",
    ]) {
      responseHeaders.delete(headerName);
    }

    const responseBody = requestObject.method === "HEAD" ? null : await response.arrayBuffer();

    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[opencode-gateway] janus proxy failed", {
      url: requestObject.url,
      error: error instanceof Error ? error.stack || error.message : String(error),
    });
    return jsonResponse({ ok: false, error: "janus proxy failed" }, 502);
  }
}

function rewriteMountedPath(url, basePath) {
  if (!url.pathname.startsWith(basePath)) {
    return;
  }
  const nextPath = url.pathname.slice(basePath.length);
  url.pathname = nextPath.length > 0 ? nextPath : "/";
}

async function exchangeGithubCode({ clientId, clientSecret, code, redirectUri }) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error("GitHub token exchange failed");
  }

  const payload = await response.json();
  return typeof payload.access_token === "string" ? payload.access_token : "";
}

async function fetchGithubUser(token) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) {
    throw new Error("GitHub user lookup failed");
  }
  const payload = await response.json();
  return {
    login: typeof payload.login === "string" ? payload.login : "",
    id: typeof payload.id === "number" ? payload.id : 0,
  };
}

function readSessionCookie(requestObject, cookieName, kind) {
  const cookies = parseCookies(requestObject.headers.get("cookie") || "");
  const value = cookies.get(cookieName);
  if (!value) {
    return null;
  }
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) {
    return null;
  }
  const expected = sign(encoded);
  if (!safeEquals(signature, expected)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!payload || payload.kind !== kind || typeof payload.exp !== "number" || payload.exp < nowSeconds()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function createSignedCookie({ name, payload, secure, maxAge }) {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = sign(encoded);
  const parts = [
    `${name}=${encoded}.${signature}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

function expireCookie(name) {
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function sign(value) {
  return createHmac("sha256", sessionSecret).update(value).digest("base64url");
}

function parseCookies(raw) {
  const cookies = new Map();
  for (const item of raw.split(";")) {
    const index = item.indexOf("=");
    if (index <= 0) {
      continue;
    }
    cookies.set(item.slice(0, index).trim(), item.slice(index + 1).trim());
  }
  return cookies;
}

function safeEquals(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function isAllowedLogin(login) {
  return allowlist.users.includes(normalizeLogin(login));
}

function normalizeLogin(value) {
  return value.trim().toLowerCase();
}

function parseStatusMessage(error) {
  switch (error) {
    case "github-not-configured":
      return "GitHub OAuth is not configured yet.";
    case "redirect-not-configured":
      return "The GitHub callback URL is not configured yet.";
    case "github-token-failed":
      return "GitHub token exchange failed.";
    case "github-user-failed":
      return "GitHub user lookup failed.";
    case "oauth-state-invalid":
      return "The OAuth state expired or was invalid.";
    case "bad-password":
      return "Wrong password.";
    default:
      return "";
  }
}

function shouldUseSecureCookies(requestObject) {
  const forwardedProto = requestObject.headers.get("x-forwarded-proto") || "";
  if (forwardedProto === "https") {
    return true;
  }
  if (explicitRedirectUri.startsWith("https://") || configuredPublicBaseUrl.startsWith("https://")) {
    return true;
  }
  return false;
}

function shouldReturnHtml(requestObject) {
  const accept = requestObject.headers.get("accept") || "";
  return requestObject.method === "GET" && accept.includes("text/html");
}

function isWebSocketRequest(requestObject) {
  return (requestObject.headers.get("upgrade") || "").toLowerCase() === "websocket";
}

function isLocalAdminHost(requestObject) {
  const host = (requestObject.headers.get("host") || "").trim().toLowerCase();
  const bareHost = host.startsWith("[")
    ? host.slice(1, host.indexOf("]"))
    : host.split(":")[0];
  return bareHost === "localhost" || bareHost === "127.0.0.1" || bareHost === "::1";
}

async function readForm(requestObject) {
  const text = await requestObject.text();
  return new URLSearchParams(text);
}

function writeJsonAtomic(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const tempPath = `${path}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  renameSync(tempPath, path);
}

function ensureSecret(path, size) {
  mkdirSync(dirname(path), { recursive: true });
  if (existsSync(path)) {
    const current = readFileSync(path, "utf8").trim();
    if (current) {
      return current;
    }
  }
  const secret = randomBytes(size).toString("base64url");
  writeFileSync(path, `${secret}\n`, { mode: 0o600 });
  return secret;
}

function splitList(value) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function sanitizeNext(value) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toPort(value, fallback) {
  const port = toInt(value, fallback);
  if (port < 1 || port > 65535) {
    return fallback;
  }
  return port;
}

function randomValue(bytes) {
  return randomBytes(bytes).toString("base64url");
}

function basicAuth(username, password) {
  return `Basic ${Buffer.from(`${username}:${password}`, "utf8").toString("base64")}`;
}

function cleanPendingStates() {
  const now = Date.now();
  for (const [state, record] of pendingStates.entries()) {
    if (record.expiresAt < now) {
      pendingStates.delete(state);
    }
  }
}

function redirect(location, status = 303, cookies = []) {
  const headers = new Headers({ Location: location });
  for (const cookie of cookies) {
    headers.append("Set-Cookie", cookie);
  }
  return new Response(null, { status, headers });
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

function renderPublicLoginPage({ next, error, githubEnabled, redirectConfigured }) {
  return pageTemplate({
    title: "OpenCode Login",
    eyebrow: "OpenCode Gateway",
    headline: "Tailnet access with a GitHub allowlist.",
    body: `
      ${error ? `<div class="note note-warn">${escapeHtml(parseStatusMessage(error))}</div>` : ""}
      <p class="lede">This gateway only admits GitHub accounts on the managed allowlist. Local admin access lives on a separate localhost-only port.</p>
      <div class="card-row">
        <div class="card">
          <div class="label">GitHub OAuth</div>
          <div class="value">${githubEnabled ? "configured" : "missing credentials"}</div>
        </div>
        <div class="card">
          <div class="label">Callback URL</div>
          <div class="value">${redirectConfigured ? "configured" : "missing"}</div>
        </div>
      </div>
      <a class="button" href="${opencodeLoginGithubPath}?next=${encodeURIComponent(next)}">Continue with GitHub</a>
    `,
  });
}

function renderDeniedPage(login) {
  return pageTemplate({
    title: "Access Denied",
    eyebrow: "GitHub allowlist",
    headline: `${escapeHtml(login)} is not on the allowlist.`,
    body: `<p class="lede">Ask the local admin to add this GitHub account in the localhost admin UI.</p><a class="button secondary" href="${opencodeLoginPath}">Back to login</a>`,
  });
}

function renderAdminLoginPage(error) {
  return pageTemplate({
    title: "OpenCode Admin",
    eyebrow: "Localhost Admin",
    headline: "Manage the GitHub allowlist from this machine only.",
    body: `
      ${error ? `<div class="note note-warn">${escapeHtml(parseStatusMessage(error))}</div>` : ""}
      <form class="panel" method="post" action="${opencodeAdminBasePath}/login">
        <label class="label" for="password">Admin password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" />
        <button class="button" type="submit">Unlock admin UI</button>
      </form>
    `,
  });
}

function renderAdminHomePage({ message, allowlistUsers, adminPasswordPath, allowlistPath }) {
  const rows = allowlistUsers.length > 0
    ? allowlistUsers.map((login) => `
        <li class="user-row">
          <span>${escapeHtml(login)}</span>
          <form method="post" action="${opencodeAdminBasePath}/allowlist/remove">
            <input type="hidden" name="login" value="${escapeHtml(login)}" />
            <button class="button danger" type="submit">Remove</button>
          </form>
        </li>
      `).join("")
    : `<li class="empty-state">No GitHub accounts are allowed yet.</li>`;

  return pageTemplate({
    title: "OpenCode Admin",
    eyebrow: "Localhost Admin",
    headline: "GitHub allowlist control plane.",
    body: `
      ${message ? `<div class="note">${escapeHtml(message === "allowlist-updated" ? "Allowlist updated." : message)}</div>` : ""}
      <div class="card-row">
        <div class="card">
          <div class="label">Allowlist file</div>
          <div class="value path">${escapeHtml(allowlistPath)}</div>
        </div>
        <div class="card">
          <div class="label">Admin password file</div>
          <div class="value path">${escapeHtml(adminPasswordPath)}</div>
        </div>
      </div>
      <form class="panel" method="post" action="${opencodeAdminBasePath}/allowlist/add">
        <label class="label" for="login">GitHub login</label>
        <input id="login" name="login" type="text" autocomplete="off" placeholder="octocat" />
        <button class="button" type="submit">Add account</button>
      </form>
      <section class="panel">
        <div class="label">Allowed GitHub accounts</div>
        <ul class="user-list">${rows}</ul>
      </section>
      <form method="post" action="${opencodeAdminBasePath}/logout">
        <button class="button secondary" type="submit">Log out</button>
      </form>
    `,
  });
}

function renderAdminBlockedPage() {
  return pageTemplate({
    title: "Admin Blocked",
    eyebrow: "Localhost Only",
    headline: "This admin surface only accepts localhost hostnames.",
    body: `<p class="lede">Use <code>http://127.0.0.1:${adminPort}</code> or <code>http://localhost:${adminPort}</code> from the local machine.</p>`,
  });
}

function pageTemplate({ title, eyebrow, headline, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f3ede3;
      --ink: #1f1b16;
      --muted: #65584a;
      --panel: rgba(255, 250, 242, 0.9);
      --line: rgba(72, 56, 38, 0.16);
      --accent: #9b4d28;
      --accent-ink: #fff9f2;
      --warn: #a63b22;
      --shadow: 0 24px 60px rgba(55, 33, 13, 0.12);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Georgia, "Times New Roman", serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, rgba(155, 77, 40, 0.18), transparent 28%),
        radial-gradient(circle at bottom right, rgba(93, 121, 95, 0.18), transparent 24%),
        linear-gradient(135deg, #f8f2e8, var(--bg));
      padding: 24px;
    }
    main {
      max-width: 860px;
      margin: 0 auto;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 28px;
      box-shadow: var(--shadow);
      padding: 28px;
      backdrop-filter: blur(10px);
    }
    .eyebrow {
      font: 600 12px/1.2 ui-monospace, "SFMono-Regular", Menlo, monospace;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 12px;
    }
    h1 {
      margin: 0 0 14px;
      font-size: clamp(30px, 5vw, 52px);
      line-height: 0.98;
      max-width: 12ch;
    }
    .lede {
      margin: 0 0 24px;
      color: var(--muted);
      font-size: 18px;
      line-height: 1.55;
      max-width: 42rem;
    }
    .panel, .card {
      border: 1px solid var(--line);
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.62);
    }
    .panel {
      padding: 18px;
      margin-bottom: 18px;
    }
    .card-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
      margin-bottom: 18px;
    }
    .card {
      padding: 16px;
    }
    .label {
      display: block;
      font: 600 12px/1.2 ui-monospace, "SFMono-Regular", Menlo, monospace;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: var(--muted);
      margin-bottom: 10px;
    }
    .value {
      font-size: 18px;
      line-height: 1.4;
    }
    .path {
      word-break: break-all;
      font-size: 14px;
      color: var(--muted);
    }
    input {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 13px 14px;
      background: #fffdf8;
      color: var(--ink);
      margin-bottom: 14px;
      font: inherit;
    }
    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-decoration: none;
      border: 0;
      border-radius: 999px;
      padding: 12px 18px;
      background: var(--accent);
      color: var(--accent-ink);
      font: 600 14px/1 ui-monospace, "SFMono-Regular", Menlo, monospace;
      letter-spacing: 0.06em;
      cursor: pointer;
    }
    .button.secondary {
      background: rgba(59, 43, 27, 0.08);
      color: var(--ink);
      border: 1px solid var(--line);
    }
    .button.danger {
      background: var(--warn);
    }
    .note {
      border: 1px solid rgba(89, 83, 50, 0.14);
      background: rgba(253, 248, 223, 0.76);
      border-radius: 16px;
      padding: 12px 14px;
      margin-bottom: 18px;
      color: #5a4a1e;
    }
    .note-warn {
      background: rgba(255, 235, 231, 0.82);
      color: #7d2f20;
      border-color: rgba(166, 59, 34, 0.18);
    }
    .user-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 10px;
    }
    .user-row, .empty-state {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 12px 14px;
      background: rgba(255, 255, 255, 0.56);
      font: 500 15px/1.4 ui-monospace, "SFMono-Regular", Menlo, monospace;
    }
    .empty-state {
      justify-content: center;
      color: var(--muted);
    }
    code {
      font: 500 0.94em/1.4 ui-monospace, "SFMono-Regular", Menlo, monospace;
    }
    @media (max-width: 720px) {
      body { padding: 14px; }
      main { padding: 20px; border-radius: 22px; }
      h1 { max-width: none; }
      .user-row { align-items: stretch; flex-direction: column; }
    }
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">${escapeHtml(eyebrow)}</div>
    <h1>${escapeHtml(headline)}</h1>
    ${body}
  </main>
</body>
</html>`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

import type { Express, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

import { SimpleOAuthProvider } from "./simpleOAuthProvider.js";

type LoginProvider = "password" | "github" | "google";

export type LoginUiConfig = {
  publicBaseUrl: URL;
  loginProvider: LoginProvider;

  ownerPassword?: string;

  githubClientId?: string;
  githubClientSecret?: string;
  githubRedirectUri?: string;
  githubAllowedUsers?: string[];

  googleClientId?: string;
  googleClientSecret?: string;
  googleAllowedEmails?: string[];
};

export function installLoginUi(app: Express, oauth: SimpleOAuthProvider, cfg: LoginUiConfig): void {
  app.get("/login", async (req: Request, res: Response) => {
    const rid = String(req.query.rid || "");
    const pending = oauth.getPending(rid);
    if (!pending) return res.status(400).send("Unknown rid");

    if (pending.subject) {
      return res.redirect(`/consent?rid=${encodeURIComponent(rid)}`);
    }

    if (cfg.loginProvider === "password") {
      return res.status(200).type("html").send(passwordLoginPage(rid));
    }

    if (cfg.loginProvider === "github") {
      return res.status(200).type("html").send(buttonPage("Login with GitHub", `/login/github?rid=${encodeURIComponent(rid)}`));
    }

    if (cfg.loginProvider === "google") {
      return res.status(200).type("html").send(buttonPage("Login with Google", `/login/google?rid=${encodeURIComponent(rid)}`));
    }

    return res.status(500).send("Invalid login provider");
  });

  app.post("/login/password", async (req: Request, res: Response) => {
    const rid = String(req.body?.rid || "");
    const password = String(req.body?.password || "");

    if (!rid) return res.status(400).send("Missing rid");

    const pending = oauth.getPending(rid);
    if (!pending) return res.status(400).send("Unknown rid");

    if (!cfg.ownerPassword) return res.status(500).send("OWNER_PASSWORD not configured");
    if (password !== cfg.ownerPassword) return res.status(401).type("html").send(passwordLoginPage(rid, "Wrong password"));

    oauth.setSubject(rid, "local:owner", { provider: "password" });

    if (oauth.shouldAutoApprove()) {
      return res.redirect(oauth.approve(rid));
    }
    return res.redirect(`/consent?rid=${encodeURIComponent(rid)}`);
  });

  installGithubRoutes(app, oauth, cfg);
  installGoogleRoutes(app, oauth, cfg);
  installConsentRoutes(app, oauth);
}

function installGithubRoutes(app: Express, oauth: SimpleOAuthProvider, cfg: LoginUiConfig): void {
  app.get("/login/github", async (req: Request, res: Response) => {
    const rid = String(req.query.rid || "");
    if (!rid) return res.status(400).send("Missing rid");

    if (!cfg.githubClientId || !cfg.githubClientSecret) {
      return res.status(500).send("GitHub login not configured");
    }

    const cb = cfg.githubRedirectUri || new URL("/oauth/callback/github", cfg.publicBaseUrl).toString();
    const authorize = new URL("https://github.com/login/oauth/authorize");
    authorize.searchParams.set("client_id", cfg.githubClientId);
    authorize.searchParams.set("redirect_uri", cb);
    authorize.searchParams.set("state", rid);
    authorize.searchParams.set("scope", "read:user user:email");
    res.redirect(authorize.toString());
  });

  const githubCallbackHandler = async (req: Request, res: Response): Promise<void> => {
    const code = String(req.query.code || "");
    const rid = String(req.query.state || "");
    console.log("[GitHub Callback] Processing:", { code: code.substring(0, 10) + "...", rid });
    
    if (!code || !rid) {
      console.error("[GitHub Callback] Missing code or state");
      res.status(400).send("Missing code/state");
      return;
    }

    if (!cfg.githubClientId || !cfg.githubClientSecret) {
      console.error("[GitHub Callback] GitHub login not configured");
      res.status(500).send("GitHub login not configured");
      return;
    }

    console.log("[GitHub Callback] Exchanging GitHub code for access token...");
    const accessToken = await exchangeGithubCode(cfg.githubClientId, cfg.githubClientSecret, code).catch((err: Error) => {
      console.error("[GitHub Callback] GitHub token exchange failed:", err.message);
      res.status(502).send(err.message);
      return null;
    });
    if (!accessToken) return;

    console.log("[GitHub Callback] Fetching GitHub user info...");
    const user = await ghJson<{ login: string; id: number }>("https://api.github.com/user", accessToken).catch((err: Error) => {
      console.error("[GitHub Callback] GitHub user lookup failed:", err.message);
      return null;
    });
    if (!user || !user.login) {
      console.error("[GitHub Callback] GitHub user lookup failed - no user data");
      res.status(502).send("GitHub user lookup failed");
      return;
    }

    console.log("[GitHub Callback] GitHub user:", user.login);

    if (cfg.githubAllowedUsers && cfg.githubAllowedUsers.length > 0 && !cfg.githubAllowedUsers.includes(user.login)) {
      console.error("[GitHub Callback] User not allowed:", user.login);
      res.status(403).send("GitHub user not allowed");
      return;
    }

    console.log("[GitHub Callback] Setting subject for rid:", rid);
    oauth.setSubject(rid, `github:${user.id}`, { provider: "github", login: user.login });

    if (oauth.shouldAutoApprove()) {
      const redirectUrl = oauth.approve(rid);
      console.log("[GitHub Callback] Approving and redirecting to:", redirectUrl.substring(0, 80) + "...");
      res.redirect(redirectUrl);
      return;
    }
    console.log("[GitHub Callback] Redirecting to consent page");
    res.redirect(`/consent?rid=${encodeURIComponent(rid)}`);
  };

  app.get("/oauth/callback/github", githubCallbackHandler);
  
  if (cfg.githubRedirectUri) {
    try {
      const u = new URL(cfg.githubRedirectUri);
      if (u.pathname !== "/oauth/callback/github") {
        app.get(u.pathname, githubCallbackHandler);
      }
    } catch (e) {}
  }
}

function installGoogleRoutes(app: Express, oauth: SimpleOAuthProvider, cfg: LoginUiConfig): void {
  app.get("/login/google", async (req: Request, res: Response) => {
    const rid = String(req.query.rid || "");
    if (!rid) return res.status(400).send("Missing rid");

    if (!cfg.googleClientId || !cfg.googleClientSecret) {
      return res.status(500).send("Google login not configured");
    }

    const cb = new URL("/oauth/callback/google", cfg.publicBaseUrl).toString();

    const authorize = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authorize.searchParams.set("client_id", cfg.googleClientId);
    authorize.searchParams.set("redirect_uri", cb);
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("scope", "openid email profile");
    authorize.searchParams.set("state", rid);
    authorize.searchParams.set("prompt", "select_account");
    res.redirect(authorize.toString());
  });

  const googleJWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

  app.get("/oauth/callback/google", async (req: Request, res: Response) => {
    const code = String(req.query.code || "");
    const rid = String(req.query.state || "");
    if (!code || !rid) return res.status(400).send("Missing code/state");

    if (!cfg.googleClientId || !cfg.googleClientSecret) {
      return res.status(500).send("Google login not configured");
    }

    const cb = new URL("/oauth/callback/google", cfg.publicBaseUrl).toString();

    const idToken = await exchangeGoogleCode(cfg.googleClientId, cfg.googleClientSecret, code, cb).catch((err: Error) => {
      res.status(502).send(err.message);
      return null;
    });
    if (!idToken) return;

    try {
      const { payload } = await jwtVerify(idToken, googleJWKS, {
        audience: cfg.googleClientId,
      });

      const user = extractGoogleUser(payload);
      if (!user.sub) return res.status(403).send("Missing sub");

      if (cfg.googleAllowedEmails && cfg.googleAllowedEmails.length > 0 && !cfg.googleAllowedEmails.includes(user.email)) {
        return res.status(403).send("Google account not allowed");
      }

      oauth.setSubject(rid, `google:${user.sub}`, { provider: "google", email: user.email, name: user.name });

      if (oauth.shouldAutoApprove()) {
        return res.redirect(oauth.approve(rid));
      }
      return res.redirect(`/consent?rid=${encodeURIComponent(rid)}`);
    } catch (e) {
      return res.status(403).send("Token verification failed");
    }
  });
}

function extractGoogleUser(payload: Record<string, unknown>): { sub: string; email: string; name: string } {
  return {
    sub: String(payload.sub || ""),
    email: String(payload.email || ""),
    name: String(payload.name || ""),
  };
}

async function exchangeGoogleCode(clientId: string, clientSecret: string, code: string, redirectUri: string): Promise<string> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const t = await tokenRes.text().catch(() => "");
    throw new Error(`Google token exchange failed: ${t || tokenRes.statusText}`);
  }

  const tokenJson = (await tokenRes.json()) as { id_token?: string };
  if (!tokenJson.id_token) {
    throw new Error("No id_token from Google");
  }
  return tokenJson.id_token;
}

function installConsentRoutes(app: Express, oauth: SimpleOAuthProvider): void {
  app.get("/consent", async (req: Request, res: Response) => {
    const rid = String(req.query.rid || "");
    const pending = oauth.getPending(rid);
    if (!pending) return res.status(400).send("Unknown rid");
    if (!pending.subject) return res.redirect(`/login?rid=${encodeURIComponent(rid)}`);

    return res.status(200).type("html").send(consentPage(rid, pending.clientId, pending.scopes));
  });

  app.post("/consent", async (req: Request, res: Response) => {
    const rid = String(req.body?.rid || "");
    const action = String(req.body?.action || "");

    if (!rid) return res.status(400).send("Missing rid");

    if (action === "approve") {
      const redirectUrl = oauth.approve(rid);
      return res.redirect(redirectUrl);
    }
    const redirectUrl = oauth.deny(rid, "access_denied", "User denied request");
    return res.redirect(redirectUrl);
  });
}

function passwordLoginPage(rid: string, err?: string) {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"/><title>Login</title></head>
<body style="font-family: sans-serif; max-width: 640px; margin: 40px auto;">
  <h2>Login</h2>
  ${err ? `<p style="color:#b00">${escapeHtml(err)}</p>` : ""}
  <form method="POST" action="/login/password">
    <input type="hidden" name="rid" value="${escapeHtml(rid)}"/>
    <label>Password</label><br/>
    <input type="password" name="password" style="width: 100%; padding: 8px; margin-top: 6px;"/>
    <button type="submit" style="margin-top: 12px; padding: 10px 14px;">Continue</button>
  </form>
</body>
</html>`;
}

function consentPage(rid: string, clientId: string, scopes: string[]) {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"/><title>Consent</title></head>
<body style="font-family: sans-serif; max-width: 720px; margin: 40px auto;">
  <h2>Authorize client</h2>
  <p><b>Client</b>: ${escapeHtml(clientId)}</p>
  <p><b>Scopes</b>: ${escapeHtml(scopes.join(" ") || "(none)")}</p>
  <form method="POST" action="/consent">
    <input type="hidden" name="rid" value="${escapeHtml(rid)}"/>
    <button name="action" value="approve" style="padding: 10px 14px;">Approve</button>
    <button name="action" value="deny" style="padding: 10px 14px; margin-left: 8px;">Deny</button>
  </form>
</body>
</html>`;
}

function buttonPage(label: string, href: string) {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"/><title>Login</title></head>
<body style="font-family: sans-serif; max-width: 640px; margin: 40px auto;">
  <h2>Login</h2>
  <p><a href="${escapeHtml(href)}" style="display:inline-block; padding:10px 14px; border:1px solid #333; text-decoration:none;">${escapeHtml(label)}</a></p>
</body>
</html>`;
}

async function exchangeGithubCode(clientId: string, clientSecret: string, code: string): Promise<string> {
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!tokenRes.ok) {
    const t = await tokenRes.text().catch(() => "");
    throw new Error(`GitHub token exchange failed: ${t || tokenRes.statusText}`);
  }

  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    throw new Error("No access_token from GitHub");
  }
  return tokenJson.access_token;
}

async function ghJson<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status}: ${t || res.statusText}`);
  }
  return (await res.json()) as T;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c] as string));
}

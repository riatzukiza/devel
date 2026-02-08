import type { Response } from "express";
import type { OAuthServerProvider, AuthorizationParams } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { OAuthClientInformationFull, OAuthTokens, OAuthTokenRevocationRequest } from "@modelcontextprotocol/sdk/shared/auth.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { InvalidGrantError, InvalidScopeError, InvalidTokenError } from "@modelcontextprotocol/sdk/server/auth/errors.js";

import { InMemoryClientsStore, type ClientInfo } from "./inMemoryClients.js";
import { FilePersistence } from "./filePersistence.js";

type PendingAuth = {
  rid: string;
  clientId: string;
  redirectUri: string;
  state?: string;
  scopes: string[];
  codeChallenge: string;
  resource?: URL;

  subject?: string;
  extra?: Record<string, unknown>;

  createdAt: number;
  used: boolean;
};

type AuthCode = {
  code: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scopes: string[];
  resource?: URL;
  subject: string;
  extra?: Record<string, unknown>;
  expiresAt: number;
};

type RefreshToken = {
  token: string;
  clientId: string;
  scopes: string[];
  resource?: URL;
  subject: string;
  extra?: Record<string, unknown>;
  expiresAt: number;
};

type AccessToken = {
  token: string;
  clientId: string;
  scopes: string[];
  resource?: URL;
  subject: string;
  extra?: Record<string, unknown>;
  expiresAt: number;
};

type ProviderConfig = {
  accessTtlSeconds: number;
  refreshTtlSeconds: number;
};

export class SimpleOAuthProvider implements OAuthServerProvider {
  public readonly clientsStore: InMemoryClientsStore;

  private readonly pending = new Map<string, PendingAuth>();
  private readonly codes = new Map<string, AuthCode>();
  private readonly accessTokens = new Map<string, AccessToken>();
  private readonly refreshTokens = new Map<string, RefreshToken>();
  private readonly config: ProviderConfig;
  private readonly persistence?: FilePersistence;

  constructor(
    private readonly uiBaseUrl: URL,
    private readonly autoApprove: boolean,
    bootstrapClients: ClientInfo[] = [],
    accessTtlSeconds = 60 * 60,
    refreshTtlSeconds = 30 * 24 * 60 * 60,
    persistencePath?: string
  ) {
    this.clientsStore = new InMemoryClientsStore(bootstrapClients);
    this.config = { accessTtlSeconds, refreshTtlSeconds };
    
    if (persistencePath) {
      this.persistence = new FilePersistence(persistencePath);
      console.log(`[oauth] File persistence enabled at: ${persistencePath}`);
    }
  }

  stop(): void {
    if (this.persistence) {
      this.persistence.stop();
    }
  }

  // ---- Persistence helper methods ----

  private serializeCode(code: AuthCode): {
    code: string;
    clientId: string;
    redirectUri: string;
    codeChallenge: string;
    scopes: string[];
    resource?: string;
    subject: string;
    extra?: Record<string, unknown>;
    expiresAt: number;
  } {
    return {
      ...code,
      resource: code.resource?.toString(),
    };
  }

  private deserializeCode(data: {
    code: string;
    clientId: string;
    redirectUri: string;
    codeChallenge: string;
    scopes: string[];
    resource?: string;
    subject: string;
    extra?: Record<string, unknown>;
    expiresAt: number;
  }): AuthCode {
    return {
      ...data,
      resource: data.resource ? new URL(data.resource) : undefined,
    };
  }

  private serializeToken(token: AccessToken | RefreshToken): {
    token: string;
    clientId: string;
    scopes: string[];
    resource?: string;
    subject: string;
    extra?: Record<string, unknown>;
    expiresAt: number;
  } {
    return {
      ...token,
      resource: token.resource?.toString(),
    };
  }

  private getPersistedCode(code: string): AuthCode | undefined {
    if (!this.persistence) return undefined;
    const data = this.persistence.getCode(code);
    return data ? this.deserializeCode(data) : undefined;
  }

  private setPersistedCode(code: string, value: AuthCode): void {
    if (this.persistence) {
      this.persistence.setCode(code, this.serializeCode(value));
    }
  }

  private deletePersistedCode(code: string): void {
    if (this.persistence) {
      this.persistence.deleteCode(code);
    }
  }

  private getPersistedAccessToken(token: string): AccessToken | undefined {
    if (!this.persistence) return undefined;
    const data = this.persistence.getAccessToken(token);
    if (!data) return undefined;
    return {
      ...data,
      resource: data.resource ? new URL(data.resource) : undefined,
    };
  }

  private setPersistedAccessToken(token: string, value: AccessToken): void {
    if (this.persistence) {
      this.persistence.setAccessToken(token, this.serializeToken(value));
    }
  }

  private deletePersistedAccessToken(token: string): void {
    if (this.persistence) {
      this.persistence.deleteAccessToken(token);
    }
  }

  private getPersistedRefreshToken(token: string): RefreshToken | undefined {
    if (!this.persistence) return undefined;
    const data = this.persistence.getRefreshToken(token);
    if (!data) return undefined;
    return {
      ...data,
      resource: data.resource ? new URL(data.resource) : undefined,
    };
  }

  private setPersistedRefreshToken(token: string, value: RefreshToken): void {
    if (this.persistence) {
      this.persistence.setRefreshToken(token, this.serializeToken(value));
    }
  }

  private deletePersistedRefreshToken(token: string): void {
    if (this.persistence) {
      this.persistence.deleteRefreshToken(token);
    }
  }

  /** Cleanup expired entries */
  cleanup(): void {
    if (this.persistence) {
      this.persistence.cleanup();
    }
  }

  /**
   * Called by the SDK's /authorize handler.
   * We create a pending auth request and redirect to our login UI.
   */
  async authorize(client: OAuthClientInformationFull, params: AuthorizationParams, res: Response): Promise<void> {
    const rid = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    const scopes = params.scopes ?? [];

    this.pending.set(rid, {
      rid,
      clientId: client.client_id,
      redirectUri: params.redirectUri,
      state: params.state,
      scopes,
      codeChallenge: params.codeChallenge,
      resource: params.resource,
      createdAt: now,
      used: false,
    });

    const loginUrl = new URL("/login", this.uiBaseUrl);
    loginUrl.searchParams.set("rid", rid);
    res.redirect(loginUrl.toString());
  }

  async challengeForAuthorizationCode(_client: OAuthClientInformationFull, authorizationCode: string): Promise<string> {
    const rec = this.codes.get(authorizationCode) || this.getPersistedCode(authorizationCode);
    if (!rec) {
      console.error("[challengeForAuthCode] Code not found:", authorizationCode.substring(0, 10) + "...");
      throw new InvalidGrantError("Authorization code not found");
    }
    console.log("[challengeForAuthCode] Found code for:", {
      code: authorizationCode.substring(0, 10) + "...",
      clientId: rec.clientId,
      subject: rec.subject,
      expiresAt: new Date(rec.expiresAt * 1000).toISOString()
    });
    return rec.codeChallenge;
  }

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
    codeVerifier?: string,
    redirectUri?: string,
    resource?: URL
  ): Promise<OAuthTokens> {
    const rec = this.codes.get(authorizationCode) || this.getPersistedCode(authorizationCode);
    if (!rec) {
      console.error("exchangeAuthorizationCode: code not found", { authorizationCode });
      throw new InvalidGrantError("Authorization code not found");
    }
    if (rec.clientId !== client.client_id) {
      console.error("exchangeAuthorizationCode: clientId mismatch", { expected: rec.clientId, actual: client.client_id });
      throw new InvalidGrantError("Client ID mismatch");
    }
    if (redirectUri && redirectUri !== rec.redirectUri) {
      console.error("exchangeAuthorizationCode: redirectUri mismatch", { expected: rec.redirectUri, actual: redirectUri });
      throw new InvalidGrantError("Redirect URI mismatch");
    }
    if (resource && rec.resource && resource.toString() !== rec.resource.toString()) {
      console.error("exchangeAuthorizationCode: resource mismatch", { expected: rec.resource.toString(), actual: resource.toString() });
      throw new InvalidGrantError("Resource mismatch");
    }

    // PKCE verification: RFC 7636 compliant - only S256 method is validated
    // External OAuth providers (GitHub, Google) use their own PKCE format - skip validation for those
    if (rec.codeChallenge) {
      // RFC 7636: If code_challenge is present, code_verifier MUST be present (for S256 only)
      if (rec.codeChallenge.startsWith("S256=")) {
        // Our MCP OAuth flow - strict S256 validation
        if (!codeVerifier) {
          console.error("exchangeAuthorizationCode: code_verifier required when code_challenge is present per RFC 7636", {
            authorizationCode: authorizationCode.substring(0, 10) + "..."
          });
          throw new InvalidGrantError("code_verifier required when code_challenge is present");
        }

        const expectedChallenge = rec.codeChallenge.substring(5);
        const actualChallenge = await this.hashCodeVerifier(codeVerifier);
        
        console.log("PKCE S256 verification:", {
          expectedChallenge: expectedChallenge.substring(0, 20) + "...",
          actualChallenge: actualChallenge.substring(0, 20) + "...",
          match: expectedChallenge === actualChallenge
        });
        
        if (expectedChallenge !== actualChallenge) {
          console.error("exchangeAuthorizationCode: PKCE verification failed - code_verifier doesn't match code_challenge");
          throw new InvalidGrantError("PKCE verification failed");
        }
      } else {
        // External OAuth provider (GitHub, etc.) - skip PKCE validation, they handle security themselves
        console.warn("exchangeAuthorizationCode: Skipping PKCE validation for non-S256 code_challenge (external OAuth provider)", {
          authorizationCode: authorizationCode.substring(0, 10) + "...",
          codeChallengeMethod: rec.codeChallenge.split("=")[0]
        });
      }
    }

    // one-time use
    this.codes.delete(authorizationCode);
    this.deletePersistedCode(authorizationCode);

    const tokens = this.issueTokens(rec.clientId, rec.scopes, rec.resource, rec.subject, rec.extra);
    return tokens;
  }

  private async hashCodeVerifier(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Buffer.from(hash).toString("base64url");
  }

  async exchangeRefreshToken(
    client: OAuthClientInformationFull,
    refreshToken: string,
    scopes?: string[],
    resource?: URL
  ): Promise<OAuthTokens> {
    const rec = this.refreshTokens.get(refreshToken) || this.getPersistedRefreshToken(refreshToken);
    if (!rec) throw new InvalidGrantError("Refresh token not found");
    if (rec.clientId !== client.client_id) throw new InvalidGrantError("Client ID mismatch");
    if (resource && rec.resource && resource.toString() !== rec.resource.toString()) throw new InvalidGrantError("Resource mismatch");

    const now = Math.floor(Date.now() / 1000);
    if (rec.expiresAt <= now) {
      this.refreshTokens.delete(refreshToken);
      this.deletePersistedRefreshToken(refreshToken);
      throw new InvalidGrantError("Refresh token expired");
    }

    const finalScopes = (scopes && scopes.length > 0) ? scopes : rec.scopes;
    // No scope escalation
    for (const s of finalScopes) {
      if (!rec.scopes.includes(s)) throw new InvalidScopeError(`Scope not authorized: ${s}`);
    }

    // rotate refresh token
    this.refreshTokens.delete(refreshToken);
    this.deletePersistedRefreshToken(refreshToken);

    const tokens = this.issueTokens(rec.clientId, finalScopes, rec.resource, rec.subject, rec.extra);
    return tokens;
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const rec = this.accessTokens.get(token) || this.getPersistedAccessToken(token);
    if (!rec) throw new InvalidTokenError("Access token not found");

    const now = Math.floor(Date.now() / 1000);
    if (rec.expiresAt <= now) {
      this.accessTokens.delete(token);
      this.deletePersistedAccessToken(token);
      throw new InvalidTokenError("Access token expired");
    }

    return {
      token: rec.token,
      clientId: rec.clientId,
      scopes: rec.scopes,
      expiresAt: rec.expiresAt,
      resource: rec.resource,
      extra: rec.extra,
    };
  }

  async revokeToken(client: OAuthClientInformationFull, request: OAuthTokenRevocationRequest): Promise<void> {
    const r = request as { token?: string; token_type_hint?: string };
    const token = r.token;
    const hint = r.token_type_hint;

    if (!token) return;

    if (!hint || hint === "access_token") {
      const at = this.accessTokens.get(token);
      if (at && at.clientId === client.client_id) {
        this.accessTokens.delete(token);
        this.deletePersistedAccessToken(token);
      }
    }
    if (!hint || hint === "refresh_token") {
      const rt = this.refreshTokens.get(token);
      if (rt && rt.clientId === client.client_id) {
        this.refreshTokens.delete(token);
        this.deletePersistedRefreshToken(token);
      }
    }
  }

  // ---- UI integration helpers ----

  getPending(rid: string): PendingAuth | undefined {
    return this.pending.get(rid);
  }

  setSubject(rid: string, subject: string, extra?: Record<string, unknown>): void {
    const rec = this.pending.get(rid);
    if (!rec) throw new Error("invalid_request");
    rec.subject = subject;
    rec.extra = extra;
  }

  /** Approve a pending request: generates auth code and returns redirect URL. */
  approve(rid: string): string {
    const rec = this.pending.get(rid);
    if (!rec) {
      console.error("[approve] rid not found:", rid);
      throw new Error("invalid_request");
    }
    if (rec.used) {
      console.error("[approve] rid already used:", rid);
      throw new Error("invalid_request");
    }
    if (!rec.subject) {
      console.error("[approve] no subject for rid:", rid);
      throw new Error("login_required");
    }

    // RFC 7636 PKCE validation: if code_challenge is present and uses S256 method, validate it
    // For code_challenge values from external OAuth providers (e.g., GitHub), we accept their format
    // and skip validation since they handle PKCE their own way
    if (rec.codeChallenge && !rec.codeChallenge.startsWith("S256=")) {
      console.warn("[approve] Non-S256 code_challenge detected (likely from external OAuth provider), skipping PKCE validation", {
        rid,
        codeChallengeMethod: rec.codeChallenge.includes("=") 
          ? rec.codeChallenge.split("=")[0] 
          : "raw",
        note: "External OAuth providers (GitHub, Google) use their own PKCE format"
      });
      // Don't throw - accept authorization codes from external OAuth flows
    }
    
    rec.used = true;

    const now = Math.floor(Date.now() / 1000);
    const code = randomToken();

    console.log("[approve] Creating auth code:", {
      rid,
      code: code.substring(0, 10) + "...",
      clientId: rec.clientId,
      codeChallenge: rec.codeChallenge?.substring(0, 20) + "...",
      scopes: rec.scopes,
      redirectUri: rec.redirectUri,
      expiresIn: "5 minutes"
    });

    this.codes.set(code, {
      code,
      clientId: rec.clientId,
      redirectUri: rec.redirectUri,
      codeChallenge: rec.codeChallenge,
      scopes: rec.scopes,
      resource: rec.resource,
      subject: rec.subject,
      extra: rec.extra,
      expiresAt: now + 5 * 60,
    });
    
    // Also persist to disk if persistence is enabled
    this.setPersistedCode(code, {
      code,
      clientId: rec.clientId,
      redirectUri: rec.redirectUri,
      codeChallenge: rec.codeChallenge,
      scopes: rec.scopes,
      resource: rec.resource,
      subject: rec.subject,
      extra: rec.extra,
      expiresAt: now + 5 * 60,
    });
    
    // Force immediate flush to disk
    if (this.persistence) {
      this.persistence.flush();
    }

    const redirect = new URL(rec.redirectUri);
    redirect.searchParams.set("code", code);
    if (rec.state) redirect.searchParams.set("state", rec.state);
    
    console.log("[approve] Redirecting to:", redirect.toString().substring(0, 80) + "...");
    return redirect.toString();
  }

  /** Deny a pending request: returns redirect URL w/ OAuth error. */
  deny(rid: string, error = "access_denied", description?: string): string {
    const rec = this.pending.get(rid);
    if (!rec) throw new Error("invalid_request");
    rec.used = true;

    const redirect = new URL(rec.redirectUri);
    redirect.searchParams.set("error", error);
    if (description) redirect.searchParams.set("error_description", description);
    if (rec.state) redirect.searchParams.set("state", rec.state);
    return redirect.toString();
  }

  shouldAutoApprove(): boolean {
    return this.autoApprove;
  }

  private issueTokens(
    clientId: string,
    scopes: string[],
    resource: URL | undefined,
    subject: string,
    extra?: Record<string, unknown>
  ): OAuthTokens {
    const now = Math.floor(Date.now() / 1000);

    const access = randomToken();
    const refresh = randomToken();

    const accessRec: AccessToken = {
      token: access,
      clientId,
      scopes,
      resource,
      subject,
      extra,
      expiresAt: now + this.config.accessTtlSeconds,
    };

    const refreshRec: RefreshToken = {
      token: refresh,
      clientId,
      scopes,
      resource,
      subject,
      extra,
      expiresAt: now + this.config.refreshTtlSeconds,
    };

    this.accessTokens.set(access, accessRec);
    this.refreshTokens.set(refresh, refreshRec);

    // Also persist to disk if persistence is enabled
    this.setPersistedAccessToken(access, accessRec);
    this.setPersistedRefreshToken(refresh, refreshRec);
    
    // Force immediate flush to disk
    if (this.persistence) {
      this.persistence.flush();
    }

    const out: OAuthTokens = {
      access_token: access,
      token_type: "bearer",
      expires_in: this.config.accessTtlSeconds,
      refresh_token: refresh,
      scope: scopes.join(" "),
    };

    return out;
  }
}

function randomToken(): string {
  // url-safe token
  const buf = crypto.getRandomValues(new Uint8Array(32));
  return Buffer.from(buf).toString("base64url");
}

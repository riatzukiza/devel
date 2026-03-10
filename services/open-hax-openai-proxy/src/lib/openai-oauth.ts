const OPENAI_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const OPENAI_ISSUER = "https://auth.openai.com";

interface PkceCodes {
  readonly verifier: string;
  readonly challenge: string;
}

interface BrowserPendingState {
  readonly createdAt: number;
  readonly redirectUri: string;
  readonly pkce: PkceCodes;
}

interface TokenResponse {
  readonly id_token?: string;
  readonly access_token: string;
  readonly refresh_token?: string;
  readonly expires_in?: number;
}

interface DeviceAuthorizationResponse {
  readonly device_auth_id: string;
  readonly user_code: string;
  readonly interval: string;
}

interface DeviceTokenPollSuccess {
  readonly authorization_code: string;
  readonly code_verifier: string;
}

export interface BrowserAuthStartResponse {
  readonly authorizeUrl: string;
  readonly state: string;
  readonly redirectUri: string;
}

export interface DeviceAuthStartResponse {
  readonly verificationUrl: string;
  readonly userCode: string;
  readonly deviceAuthId: string;
  readonly intervalMs: number;
}

export interface OAuthTokens {
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly expiresAt?: number;
  readonly accountId: string;
}

export type DevicePollResult =
  | { readonly state: "pending" }
  | { readonly state: "authorized"; readonly tokens: OAuthTokens }
  | { readonly state: "failed"; readonly reason: string };

interface JwtClaims {
  readonly chatgpt_account_id?: string;
  readonly organizations?: ReadonlyArray<{ readonly id: string }>;
  readonly "https://api.openai.com/auth"?: {
    readonly chatgpt_account_id?: string;
  };
}

function generateRandomString(length: number): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes)
    .map((value) => alphabet[value % alphabet.length])
    .join("");
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = Buffer.from(new Uint8Array(buffer));
  return bytes.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function generatePkce(): Promise<PkceCodes> {
  const verifier = generateRandomString(43);
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return {
    verifier,
    challenge: base64UrlEncode(hash),
  };
}

function generateState(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)).buffer);
}

function parseJwtClaims(token: string): JwtClaims | undefined {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return undefined;
  }

  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as JwtClaims;
  } catch {
    return undefined;
  }
}

function accountIdFromClaims(claims: JwtClaims): string | undefined {
  return (
    claims.chatgpt_account_id ??
    claims["https://api.openai.com/auth"]?.chatgpt_account_id ??
    claims.organizations?.[0]?.id
  );
}

function extractAccountId(tokens: TokenResponse): string {
  if (tokens.id_token) {
    const claims = parseJwtClaims(tokens.id_token);
    if (claims) {
      const accountId = accountIdFromClaims(claims);
      if (accountId) {
        return accountId;
      }
    }
  }

  const accessClaims = parseJwtClaims(tokens.access_token);
  if (accessClaims) {
    const accountId = accountIdFromClaims(accessClaims);
    if (accountId) {
      return accountId;
    }
  }

  return `openai-${Date.now()}`;
}

function buildAuthorizationUrl(redirectUri: string, pkce: PkceCodes, state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: OPENAI_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "openid profile email offline_access",
    code_challenge: pkce.challenge,
    code_challenge_method: "S256",
    id_token_add_organizations: "true",
    codex_cli_simplified_flow: "true",
    originator: "open-hax-openai-proxy",
    state,
  });

  return `${OPENAI_ISSUER}/oauth/authorize?${params.toString()}`;
}

async function exchangeAuthorizationCode(
  code: string,
  redirectUri: string,
  codeVerifier: string,
): Promise<TokenResponse> {
  const response = await fetch(`${OPENAI_ISSUER}/oauth/token`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: OPENAI_CLIENT_ID,
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`OpenAI token exchange failed with status ${response.status}`);
  }

  return (await response.json()) as TokenResponse;
}

function toOAuthTokens(tokens: TokenResponse): OAuthTokens {
  return {
    accountId: extractAccountId(tokens),
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: typeof tokens.expires_in === "number" ? Date.now() + tokens.expires_in * 1000 : undefined,
  };
}

export class OpenAiOAuthManager {
  private readonly browserPending = new Map<string, BrowserPendingState>();

  public async startBrowserFlow(redirectBaseUrl: string): Promise<BrowserAuthStartResponse> {
    const pkce = await generatePkce();
    const state = generateState();
    const redirectUri = new URL("/api/ui/credentials/openai/oauth/browser/callback", redirectBaseUrl).toString();

    this.browserPending.set(state, {
      createdAt: Date.now(),
      redirectUri,
      pkce,
    });

    this.pruneBrowserState();

    return {
      state,
      redirectUri,
      authorizeUrl: buildAuthorizationUrl(redirectUri, pkce, state),
    };
  }

  public async completeBrowserFlow(state: string, code: string): Promise<OAuthTokens> {
    const pending = this.browserPending.get(state);
    if (!pending) {
      throw new Error("Unknown or expired OAuth state");
    }

    this.browserPending.delete(state);
    const tokens = await exchangeAuthorizationCode(code, pending.redirectUri, pending.pkce.verifier);
    return toOAuthTokens(tokens);
  }

  public async startDeviceFlow(): Promise<DeviceAuthStartResponse> {
    const response = await fetch(`${OPENAI_ISSUER}/api/accounts/deviceauth/usercode`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        client_id: OPENAI_CLIENT_ID,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI device authorization failed with status ${response.status}`);
    }

    const payload = (await response.json()) as DeviceAuthorizationResponse;
    const intervalSeconds = Number.parseInt(payload.interval, 10);
    const intervalMs = Number.isFinite(intervalSeconds) && intervalSeconds > 0 ? intervalSeconds * 1000 : 5000;

    return {
      verificationUrl: `${OPENAI_ISSUER}/codex/device`,
      userCode: payload.user_code,
      deviceAuthId: payload.device_auth_id,
      intervalMs,
    };
  }

  public async pollDeviceFlow(deviceAuthId: string, userCode: string): Promise<DevicePollResult> {
    const response = await fetch(`${OPENAI_ISSUER}/api/accounts/deviceauth/token`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        device_auth_id: deviceAuthId,
        user_code: userCode,
      }),
    });

    if (response.ok) {
      const payload = (await response.json()) as DeviceTokenPollSuccess;
      const tokens = await exchangeAuthorizationCode(
        payload.authorization_code,
        `${OPENAI_ISSUER}/deviceauth/callback`,
        payload.code_verifier,
      );

      return {
        state: "authorized",
        tokens: toOAuthTokens(tokens),
      };
    }

    if (response.status === 403 || response.status === 404) {
      return { state: "pending" };
    }

    return {
      state: "failed",
      reason: `OpenAI device authorization poll failed with status ${response.status}`,
    };
  }

  private pruneBrowserState(): void {
    const cutoff = Date.now() - 5 * 60 * 1000;
    for (const [state, pending] of this.browserPending.entries()) {
      if (pending.createdAt < cutoff) {
        this.browserPending.delete(state);
      }
    }
  }
}

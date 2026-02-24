import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from "bun:test";
import { SimpleOAuthProvider } from "../auth/simpleOAuthProvider.js";
import { DuckDBPersistence } from "../auth/duckDbPersistence.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("OAuth Handshake", () => {
  const publicBaseUrl = new URL("https://test.com");
  const oauth = new SimpleOAuthProvider(publicBaseUrl, true, [
    {
      client_id: "test_client",
      client_secret: "test_secret",
      client_name: "Test Client",
      redirect_uris: ["https://test.com/callback"],
      token_endpoint_auth_method: "client_secret_post",
      grant_types: ["authorization_code"],
      response_types: ["code"]
    }
  ]);

  it("should pre-register bootstrap clients", async () => {
    const client = await oauth.clientsStore.getClient("test_client");
    expect(client).toBeDefined();
    expect(client?.client_name).toBe("Test Client");
  });

  it("should generate a code and exchange it for tokens", async () => {
    const rid = "test_rid";
    const pending = {
      rid,
      clientId: "test_client",
      redirectUri: "https://test.com/callback",
      state: "test_state",
      scopes: ["mcp"],
      codeChallenge: "test_challenge",
      createdAt: Math.floor(Date.now() / 1000),
      used: false,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (oauth as any).pending.set(rid, pending);

    oauth.setSubject(rid, "user:123");

    const redirectUrl = await oauth.approve(rid);
    const url = new URL(redirectUrl);
    const code = url.searchParams.get("code");
    expect(code).toBeDefined();
    expect(url.searchParams.get("state")).toBe("test_state");

    const client = await oauth.clientsStore.getClient("test_client");
    const tokens = await oauth.exchangeAuthorizationCode(client!, code!);
    
    expect(tokens.access_token).toBeDefined();
    expect(tokens.token_type).toBe("bearer");
    
    const authInfo = await oauth.verifyAccessToken(tokens.access_token);
    expect(authInfo.clientId).toBe("test_client");
    expect(authInfo.scopes).toContain("mcp");
  });
});

describe("OAuth Persistence", () => {
  const testDir = join(import.meta.dirname, "test-persistence-" + randomUUID());
  const persistencePath = join(testDir, "oauth.db");
  
  beforeAll(() => {
    // Create test directory
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });
  
  afterEach(() => {
    // Cleanup persistence files
    if (existsSync(persistencePath)) {
      rmSync(persistencePath);
    }
  });
  
  afterAll(() => {
    // Cleanup test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });
  
  it("should persist and restore authorization codes", async () => {
    const publicBaseUrl = new URL("https://test.com");
    const persistence = new DuckDBPersistence(persistencePath);
    await persistence.init();

    const oauth = new SimpleOAuthProvider(publicBaseUrl, true, [
      {
        client_id: "test_client",
        client_secret: "test_secret",
        client_name: "Test Client",
        redirect_uris: ["https://test.com/callback"],
        token_endpoint_auth_method: "client_secret_post",
        grant_types: ["authorization_code"],
        response_types: ["code"]
      }
    ], 60 * 60, 30 * 24 * 60 * 60, persistence);
    
    // Create a pending auth request
    const rid = "persist_rid_" + randomUUID();
    const pending = {
      rid,
      clientId: "test_client",
      redirectUri: "https://test.com/callback",
      state: "test_state",
      scopes: ["mcp"],
      codeChallenge: "test_challenge",
      createdAt: Math.floor(Date.now() / 1000),
      used: false,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (oauth as any).pending.set(rid, pending);
    
    // Set subject and approve
    oauth.setSubject(rid, "user:456");
    const redirectUrl = await oauth.approve(rid);
    const url = new URL(redirectUrl);
    const code = url.searchParams.get("code");
    expect(code).toBeDefined();
    
    // Create a new provider instance to simulate restart
    await persistence.stop(); // Close old connection
    const persistence2 = new DuckDBPersistence(persistencePath);
    await persistence2.init();

    const oauth2 = new SimpleOAuthProvider(publicBaseUrl, true, [
      {
        client_id: "test_client",
        client_secret: "test_secret",
        client_name: "Test Client",
        redirect_uris: ["https://test.com/callback"],
        token_endpoint_auth_method: "client_secret_post",
        grant_types: ["authorization_code"],
        response_types: ["code"]
      }
    ], 60 * 60, 30 * 24 * 60 * 60, persistence2);
    
    // Verify the persisted code can be exchanged
    const client = await oauth2.clientsStore.getClient("test_client");
    const tokens = await oauth2.exchangeAuthorizationCode(client!, code!);
    
    expect(tokens.access_token).toBeDefined();
    expect(tokens.refresh_token).toBeDefined();
    
    // Verify the token is valid and has the expected scopes
    const authInfo = await oauth2.verifyAccessToken(tokens.access_token);
    expect(authInfo.clientId).toBe("test_client");
    expect(authInfo.scopes).toContain("mcp");
  });
  
  it("should persist and restore refresh tokens", async () => {
    const publicBaseUrl = new URL("https://test.com");
    const persistence = new DuckDBPersistence(persistencePath);
    await persistence.init();

    const oauth = new SimpleOAuthProvider(publicBaseUrl, true, [
      {
        client_id: "test_client",
        client_secret: "test_secret",
        client_name: "Test Client",
        redirect_uris: ["https://test.com/callback"],
        token_endpoint_auth_method: "client_secret_post",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"]
      }
    ], 60 * 60, 30 * 24 * 60 * 60, persistence);
    
    // Create a pending auth request
    const rid = "refresh_rid_" + randomUUID();
    const pending = {
      rid,
      clientId: "test_client",
      redirectUri: "https://test.com/callback",
      state: "test_state",
      scopes: ["mcp"],
      codeChallenge: "test_challenge",
      createdAt: Math.floor(Date.now() / 1000),
      used: false,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (oauth as any).pending.set(rid, pending);
    
    // Set subject and approve
    oauth.setSubject(rid, "user:789");
    const redirectUrl = await oauth.approve(rid);
    const url = new URL(redirectUrl);
    const code = url.searchParams.get("code");
    expect(code).toBeDefined();
    
    // Exchange for tokens
    const client = await oauth.clientsStore.getClient("test_client");
    const tokens = await oauth.exchangeAuthorizationCode(client!, code!);
    expect(tokens.refresh_token).toBeDefined();
    const refreshToken = tokens.refresh_token!; // Assert it's defined
    
    // Create a new provider instance to simulate restart
    await persistence.stop(); // Close old connection
    const persistence2 = new DuckDBPersistence(persistencePath);
    await persistence2.init();

    const oauth2 = new SimpleOAuthProvider(publicBaseUrl, true, [
      {
        client_id: "test_client",
        client_secret: "test_secret",
        client_name: "Test Client",
        redirect_uris: ["https://test.com/callback"],
        token_endpoint_auth_method: "client_secret_post",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"]
      }
    ], 60 * 60, 30 * 24 * 60 * 60, persistence2);
    
    // Refresh the token
    const refreshedTokens = await oauth2.exchangeRefreshToken(client!, refreshToken);
    
    expect(refreshedTokens.access_token).toBeDefined();
    expect(refreshedTokens.refresh_token).toBeDefined();
    expect(refreshedTokens.refresh_token).not.toBe(tokens.refresh_token); // Token rotation
    
    // Verify the new token is valid and has the expected scopes
    const authInfo = await oauth2.verifyAccessToken(refreshedTokens.access_token);
    expect(authInfo.clientId).toBe("test_client");
    expect(authInfo.scopes).toContain("mcp");
  });

  it("reuses refresh exchange result within short window", async () => {
    const publicBaseUrl = new URL("https://test.com");
    const persistence = new DuckDBPersistence(persistencePath);
    await persistence.init();

    const oauth = new SimpleOAuthProvider(publicBaseUrl, true, [
      {
        client_id: "test_client",
        client_secret: "test_secret",
        client_name: "Test Client",
        redirect_uris: ["https://test.com/callback"],
        token_endpoint_auth_method: "client_secret_post",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
      },
    ], 60 * 60, 30 * 24 * 60 * 60, persistence);

    const rid = "reuse_rid_" + randomUUID();
    const pending = {
      rid,
      clientId: "test_client",
      redirectUri: "https://test.com/callback",
      state: "test_state",
      scopes: ["mcp"],
      codeChallenge: "test_challenge",
      createdAt: Math.floor(Date.now() / 1000),
      used: false,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (oauth as any).pending.set(rid, pending);

    oauth.setSubject(rid, "user:reuse");
    const redirectUrl = await oauth.approve(rid);
    const code = new URL(redirectUrl).searchParams.get("code");
    expect(code).toBeDefined();

    const client = await oauth.clientsStore.getClient("test_client");
    const initialTokens = await oauth.exchangeAuthorizationCode(client!, code!);
    expect(initialTokens.refresh_token).toBeDefined();

    const firstRefresh = await oauth.exchangeRefreshToken(client!, initialTokens.refresh_token!);
    const secondRefresh = await oauth.exchangeRefreshToken(client!, initialTokens.refresh_token!);

    expect(secondRefresh.access_token).toBe(firstRefresh.access_token);
    expect(secondRefresh.refresh_token).toBe(firstRefresh.refresh_token);
    expect(secondRefresh.scope).toBe(firstRefresh.scope);

    await persistence.stop();

    const persistence2 = new DuckDBPersistence(persistencePath);
    await persistence2.init();
    const oauth2 = new SimpleOAuthProvider(publicBaseUrl, true, [
      {
        client_id: "test_client",
        client_secret: "test_secret",
        client_name: "Test Client",
        redirect_uris: ["https://test.com/callback"],
        token_endpoint_auth_method: "client_secret_post",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
      },
    ], 60 * 60, 30 * 24 * 60 * 60, persistence2);

    const client2 = await oauth2.clientsStore.getClient("test_client");
    const replayed = await oauth2.exchangeRefreshToken(client2!, initialTokens.refresh_token!);

    expect(replayed.access_token).toBe(firstRefresh.access_token);
    expect(replayed.refresh_token).toBe(firstRefresh.refresh_token);

    await persistence2.stop();
  });

  it("should verify PKCE S256 code_challenge and code_verifier", async () => {
    const publicBaseUrl = new URL("https://test.com");
    const oauth = new SimpleOAuthProvider(publicBaseUrl, true, [
      {
        client_id: "pkce_client",
        client_secret: "pkce_secret",
        client_name: "PKCE Test Client",
        redirect_uris: ["https://test.com/callback"],
        token_endpoint_auth_method: "client_secret_post",
        grant_types: ["authorization_code"],
        response_types: ["code"]
      }
    ]);
    
    // Create a code_verifier and compute its S256 code_challenge
    const codeVerifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await crypto.subtle.digest("SHA-256", data);
    const codeChallenge = "S256=" + Buffer.from(hash).toString("base64url");
    
    console.log("Test PKCE:", { codeVerifier, codeChallenge });
    
    // Create a pending auth request with the S256 code_challenge
    const rid = "pkce_test_rid_" + randomUUID();
    const pending = {
      rid,
      clientId: "pkce_client",
      redirectUri: "https://test.com/callback",
      state: "pkce_state",
      scopes: ["mcp"],
      codeChallenge, // Store the S256 code_challenge
      createdAt: Math.floor(Date.now() / 1000),
      used: false,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (oauth as any).pending.set(rid, pending);
    
    // Set subject and approve
    oauth.setSubject(rid, "user:pkce");
    const redirectUrl = await oauth.approve(rid);
    const url = new URL(redirectUrl);
    const code = url.searchParams.get("code");
    expect(code).toBeDefined();
    
    // Get the client
    const client = await oauth.clientsStore.getClient("pkce_client");
    
    // Verify the token exchange succeeds with correct code_verifier
    const tokens = await oauth.exchangeAuthorizationCode(client!, code!, codeVerifier);
    expect(tokens.access_token).toBeDefined();
    expect(tokens.refresh_token).toBeDefined();
    
    // Verify the token is valid
    const authInfo = await oauth.verifyAccessToken(tokens.access_token);
    expect(authInfo.clientId).toBe("pkce_client");
    expect(authInfo.scopes).toContain("mcp");
  });
});

describe("OAuth Token Exchange Payload Capture", () => {
  // This test documents the exact payload format expected during token exchange
  // This is critical for debugging the timeout issue with ChatGPT
  
  it("should document the exact token exchange payload format", async () => {
    const publicBaseUrl = new URL("https://test.com");
    const oauth = new SimpleOAuthProvider(publicBaseUrl, true, [
      {
        client_id: "test_client",
        client_secret: "test_secret",
        client_name: "Test Client",
        redirect_uris: ["https://test.com/callback"],
        token_endpoint_auth_method: "client_secret_post",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"]
      }
    ]);
    
    // Create a pending auth request with PKCE
    const rid = "payload_test_rid_" + randomUUID();
    const codeChallenge = "test_challenge_" + randomUUID().substring(0, 8);
    const pending = {
      rid,
      clientId: "test_client",
      redirectUri: "https://test.com/callback",
      state: "test_state",
      scopes: ["mcp"],
      codeChallenge,
      createdAt: Math.floor(Date.now() / 1000),
      used: false,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (oauth as any).pending.set(rid, pending);
    
    // Set subject and approve
    oauth.setSubject(rid, "user:payload_test");
    const redirectUrl = await oauth.approve(rid);
    const url = new URL(redirectUrl);
    const code = url.searchParams.get("code");
    expect(code).toBeDefined();
    
    // Document the authorization code exchange payload
    // This is what ChatGPT would send to /token endpoint
    const authCodeExchangePayload = {
      grant_type: "authorization_code",
      code: code,
      redirect_uri: "https://test.com/callback",
      client_id: "test_client",
      // code_verifier would be sent by ChatGPT during PKCE flow
      // code_challenge was: codeChallenge
    };
    
    console.log("=== Authorization Code Exchange Payload ===");
    console.log(JSON.stringify(authCodeExchangePayload, null, 2));
    
    // Exchange for tokens
    const client = await oauth.clientsStore.getClient("test_client");
    const tokens = await oauth.exchangeAuthorizationCode(client!, code!);
    
    expect(tokens.access_token).toBeDefined();
    expect(tokens.refresh_token).toBeDefined();
    
    // Document the token response
    const tokenResponse = {
      access_token: tokens.access_token,
      token_type: tokens.token_type,
      expires_in: tokens.expires_in,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
    };
    
    console.log("=== Token Response ===");
    console.log(JSON.stringify(tokenResponse, null, 2));
    
    // Document the refresh token exchange payload
    // This is what ChatGPT would send to refresh the access token
    const refreshTokenExchangePayload = {
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
      client_id: "test_client",
    };
    
    console.log("=== Refresh Token Exchange Payload ===");
    console.log(JSON.stringify(refreshTokenExchangePayload, null, 2));
    
    // Verify refresh token exchange works
    const refreshedTokens = await oauth.exchangeRefreshToken(client!, tokens.refresh_token!);
    
    const refreshTokenResponse = {
      access_token: refreshedTokens.access_token,
      token_type: refreshedTokens.token_type,
      expires_in: refreshedTokens.expires_in,
      refresh_token: refreshedTokens.refresh_token,
      scope: refreshedTokens.scope,
    };
    
    console.log("=== Refresh Token Response ===");
    console.log(JSON.stringify(refreshTokenResponse, null, 2));
    
    expect(refreshedTokens.access_token).toBeDefined();
    expect(refreshedTokens.refresh_token).toBeDefined();
    expect(refreshedTokens.refresh_token).not.toBe(tokens.refresh_token); // Token rotation
    
    console.log("=== PKCE Verification ===");
    console.log("Code challenge stored:", codeChallenge);
    console.log("Note: In PKCE flow, ChatGPT would send code_verifier and we'd verify it matches the stored code_challenge");
    
    // Verify the original access token is still valid (access tokens don't expire on refresh)
    // but the refresh token was rotated
    let originalAccessTokenValid = true;
    try {
      await oauth.verifyAccessToken(tokens.access_token);
    } catch (e) {
      originalAccessTokenValid = false;
    }
    expect(originalAccessTokenValid).toBe(true); // Access tokens remain valid until expiry
    
    // The old refresh token should be invalid now (consumed)
    let oldRefreshTokenValid = true;
    try {
      await oauth.exchangeRefreshToken(client!, tokens.refresh_token!);
    } catch (e) {
      oldRefreshTokenValid = false;
    }
    expect(oldRefreshTokenValid).toBe(false); // Old refresh token was consumed
  });
});


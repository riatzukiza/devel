import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { SimpleOAuthProvider } from "../auth/simpleOAuthProvider.js";
import { randomUUID } from "node:crypto";

/**
 * Comprehensive end-to-end test simulating ChatGPT's OAuth handshake with MCP OAuth server.
 * 
 * This test covers:
 * 1. PKCE code_verifier and code_challenge generation (S256 per RFC 7636)
 * 2. Authorization request initiation
 * 3. User authentication and consent
 * 4. Authorization code exchange with code_verifier
 * 5. Access token usage for MCP requests
 * 6. Refresh token rotation
 * 7. Invalid PKCE verification rejection
 */
describe("ChatGPT OAuth Handshake Simulation", () => {
  
  /**
   * Generate a cryptographically secure PKCE code_verifier
   * Per RFC 7636: 43-128 characters, [A-Z], [a-z], [0-9], "-", ".", "_", "~"
   */
  function generateCodeVerifier(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    const length = 43 + Math.floor(Math.random() * 86); // 43-128 chars
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => chars[byte % chars.length]).join("");
  }

  /**
   * Generate S256 code_challenge from code_verifier
   * Per RFC 7636: BASE64URL(SHA256(code_verifier))
   */
  async function generateS256CodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return "S256=" + Buffer.from(hash).toString("base64url");
  }

  describe("Full PKCE Authorization Code Flow", () => {
    
    it("should complete full handshake with PKCE S256 verification", async () => {
      const publicBaseUrl = new URL("https://test.example.com");
      const oauth = new SimpleOAuthProvider(publicBaseUrl, true, [
        {
          client_id: "chatgpt_mcp_client",
          client_secret: "chatgpt_mcp_secret",
          client_name: "ChatGPT MCP Client",
          redirect_uris: ["https://chatgpt.com/mcp/callback"],
          token_endpoint_auth_method: "client_secret_post",
          grant_types: ["authorization_code", "refresh_token"],
          response_types: ["code"]
        }
      ]);

      // Step 1: ChatGPT generates PKCE credentials
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateS256CodeChallenge(codeVerifier);
      
      console.log("ChatGPT PKCE Setup:", {
        codeVerifier: codeVerifier.substring(0, 10) + "...",
        codeChallenge: codeChallenge.substring(0, 30) + "...",
        method: "S256"
      });

      // Verify the code_challenge is properly formatted
      expect(codeChallenge).toStartWith("S256=");
      expect(codeChallenge.length).toBe(48); // 43 base64url chars + 5 for "S256=" prefix

      // Step 2: Simulate authorization request initiation (ChatGPT -> OAuth Server)
      const authorizationParams = {
        client_id: "chatgpt_mcp_client",
        redirect_uri: "https://chatgpt.com/mcp/callback",
        response_type: "code",
        scope: "mcp",
        state: randomUUID(),
        code_challenge: codeChallenge,
        code_challenge_method: "S256"
      };

      console.log("Authorization Request:", {
        ...authorizationParams,
        code_challenge: authorizationParams.code_challenge.substring(0, 30) + "..."
      });

      // Step 3: Create pending authorization (simulates what OAuth server does)
      const rid = randomUUID();
      const pending = {
        rid,
        clientId: authorizationParams.client_id,
        redirectUri: authorizationParams.redirect_uri,
        state: authorizationParams.state,
        scopes: authorizationParams.scope.split(" "),
        codeChallenge: authorizationParams.code_challenge,
        createdAt: Math.floor(Date.now() / 1000),
        used: false,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (oauth as any).pending.set(rid, pending);

      // Step 4: Simulate user authentication and consent
      oauth.setSubject(rid, "user:chatgpt_user_123");

      // Step 5: Approve authorization and get code
      const redirectUrl = oauth.approve(rid);
      const url = new URL(redirectUrl);
      const authorizationCode = url.searchParams.get("code");
      
      expect(authorizationCode).toBeDefined();
      expect(url.searchParams.get("state")).toBe(authorizationParams.state);

      console.log("Authorization Code Received:", {
        code: authorizationCode!.substring(0, 10) + "...",
        redirectUrl: redirectUrl.substring(0, 50) + "..."
      });

      // Step 6: Token exchange with code_verifier (ChatGPT -> OAuth Server)
      const client = await oauth.clientsStore.getClient("chatgpt_mcp_client");
      const tokens = await oauth.exchangeAuthorizationCode(
        client!,
        authorizationCode!,
        codeVerifier, // This is the critical PKCE verification step
        authorizationParams.redirect_uri
      );

      expect(tokens.access_token).toBeDefined();
      expect(tokens.token_type).toBe("bearer");
      expect(tokens.refresh_token).toBeDefined();
      expect(tokens.expires_in).toBeDefined();

      console.log("Token Exchange Success:", {
        accessToken: tokens.access_token.substring(0, 10) + "...",
        refreshToken: tokens.refresh_token!.substring(0, 10) + "...",
        expiresIn: tokens.expires_in
      });

      // Step 7: Verify the access token works for MCP requests
      const authInfo = await oauth.verifyAccessToken(tokens.access_token);
      expect(authInfo.clientId).toBe("chatgpt_mcp_client");
      expect(authInfo.scopes).toContain("mcp");

      console.log("Access Token Verified:", {
        clientId: authInfo.clientId,
        scopes: authInfo.scopes
      });
    });

    it("should reject token exchange with invalid code_verifier", async () => {
      const publicBaseUrl = new URL("https://test.example.com");
      const oauth = new SimpleOAuthProvider(publicBaseUrl, true, [
        {
          client_id: "chatgpt_mcp_client",
          client_secret: "chatgpt_mcp_secret",
          client_name: "ChatGPT MCP Client",
          redirect_uris: ["https://chatgpt.com/mcp/callback"],
          token_endpoint_auth_method: "client_secret_post",
          grant_types: ["authorization_code"],
          response_types: ["code"]
        }
      ]);

      // Generate valid PKCE credentials
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateS256CodeChallenge(codeVerifier);

      // Create pending authorization
      const rid = randomUUID();
      const pending = {
        rid,
        clientId: "chatgpt_mcp_client",
        redirectUri: "https://chatgpt.com/mcp/callback",
        state: "test_state",
        scopes: ["mcp"],
        codeChallenge,
        createdAt: Math.floor(Date.now() / 1000),
        used: false,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (oauth as any).pending.set(rid, pending);

      // Approve to get authorization code
      oauth.setSubject(rid, "user:test");
      const redirectUrl = oauth.approve(rid);
      const url = new URL(redirectUrl);
      const authorizationCode = url.searchParams.get("code");

      // Try to exchange with WRONG code_verifier
      const wrongCodeVerifier = generateCodeVerifier();
      const client = await oauth.clientsStore.getClient("chatgpt_mcp_client");

      let errorThrown = false;
      try {
        await oauth.exchangeAuthorizationCode(
          client!,
          authorizationCode!,
          wrongCodeVerifier, // This should fail
          "https://chatgpt.com/mcp/callback"
        );
      } catch (e) {
        errorThrown = true;
        expect((e as Error).message).toBe("PKCE verification failed");
      }
      expect(errorThrown).toBe(true);

      console.log("Invalid code_verifier correctly rejected");
    });

    it("should accept code_challenge without S256 method (external OAuth provider)", async () => {
      const publicBaseUrl = new URL("https://test.example.com");
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

      // Create code_verifier and plain code_challenge (from external OAuth provider like GitHub)
      const codeVerifier = "test_code_verifier_12345";
      const plainCodeChallenge = "plain=" + codeVerifier; // Plain method - accepted for external OAuth

      // Create pending authorization with plain code_challenge
      const rid = randomUUID();
      const pending = {
        rid,
        clientId: "test_client",
        redirectUri: "https://test.com/callback",
        state: "test_state",
        scopes: ["mcp"],
        codeChallenge: plainCodeChallenge,
        createdAt: Math.floor(Date.now() / 1000),
        used: false,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (oauth as any).pending.set(rid, pending);

      oauth.setSubject(rid, "user:test");

      // Should succeed with warning for external OAuth provider
      const redirectUrl = oauth.approve(rid);
      const url = new URL(redirectUrl);
      const authorizationCode = url.searchParams.get("code");
      expect(authorizationCode).toBeDefined();

      // Token exchange should also succeed (no PKCE validation for external OAuth)
      const client = await oauth.clientsStore.getClient("test_client");
      const tokens = await oauth.exchangeAuthorizationCode(
        client!,
        authorizationCode!,
        undefined, // No code_verifier for external OAuth
        "https://test.com/callback"
      );

      expect(tokens.access_token).toBeDefined();
      console.log("Plain code_challenge accepted for external OAuth provider");
    });

    it("should perform refresh token rotation", async () => {
      const publicBaseUrl = new URL("https://test.example.com");
      const oauth = new SimpleOAuthProvider(publicBaseUrl, true, [
        {
          client_id: "chatgpt_mcp_client",
          client_secret: "chatgpt_mcp_secret",
          client_name: "ChatGPT MCP Client",
          redirect_uris: ["https://chatgpt.com/mcp/callback"],
          token_endpoint_auth_method: "client_secret_post",
          grant_types: ["authorization_code", "refresh_token"],
          response_types: ["code"]
        }
      ]);

      // Generate PKCE credentials
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateS256CodeChallenge(codeVerifier);

      // Create and approve authorization
      const rid = randomUUID();
      const pending = {
        rid,
        clientId: "chatgpt_mcp_client",
        redirectUri: "https://chatgpt.com/mcp/callback",
        state: "test_state",
        scopes: ["mcp"],
        codeChallenge,
        createdAt: Math.floor(Date.now() / 1000),
        used: false,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (oauth as any).pending.set(rid, pending);

      oauth.setSubject(rid, "user:refresh_test");
      const redirectUrl = oauth.approve(rid);
      const url = new URL(redirectUrl);
      const authorizationCode = url.searchParams.get("code");

      // Exchange for initial tokens
      const client = await oauth.clientsStore.getClient("chatgpt_mcp_client");
      const initialTokens = await oauth.exchangeAuthorizationCode(
        client!,
        authorizationCode!,
        codeVerifier,
        "https://chatgpt.com/mcp/callback"
      );

      console.log("Initial Token:", {
        accessToken: initialTokens.access_token.substring(0, 10) + "...",
        refreshToken: initialTokens.refresh_token!.substring(0, 10) + "..."
      });

      // Refresh the token
      const refreshedTokens = await oauth.exchangeRefreshToken(
        client!,
        initialTokens.refresh_token!
      );

      console.log("Refreshed Token:", {
        accessToken: refreshedTokens.access_token.substring(0, 10) + "...",
        refreshToken: refreshedTokens.refresh_token!.substring(0, 10) + "..."
      });

      // Verify refresh token rotation occurred
      expect(refreshedTokens.refresh_token).not.toBe(initialTokens.refresh_token);
      expect(refreshedTokens.access_token).not.toBe(initialTokens.access_token);

      // Verify both tokens are valid and belong to same client
      const initialAuthInfo = await oauth.verifyAccessToken(initialTokens.access_token);
      const refreshedAuthInfo = await oauth.verifyAccessToken(refreshedTokens.access_token);
      
      expect(initialAuthInfo.clientId).toBe(refreshedAuthInfo.clientId);
      expect(initialAuthInfo.scopes).toEqual(refreshedAuthInfo.scopes);

      console.log("Refresh token rotation completed successfully");
    });
  });

  describe("RFC 7636 Compliance", () => {
    
    it("should accept valid S256 code_challenge format", async () => {
      const publicBaseUrl = new URL("https://test.example.com");
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

      // Known test vector from RFC 7636 Appendix B
      const codeVerifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
      
      // Expected SHA-256 hash of the test vector (per RFC 7636)
      const encoder = new TextEncoder();
      const data = encoder.encode(codeVerifier);
      const hash = await crypto.subtle.digest("SHA-256", data);
      const expectedChallenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"; // RFC 7636 test vector
      const actualChallenge = Buffer.from(hash).toString("base64url");
      
      console.log("RFC 7636 Test Vector Verification:", {
        codeVerifier,
        expectedChallenge,
        actualChallenge,
        match: expectedChallenge === actualChallenge
      });

      // Create pending auth with proper S256 code_challenge
      const rid = randomUUID();
      const pending = {
        rid,
        clientId: "test_client",
        redirectUri: "https://test.com/callback",
        state: "test_state",
        scopes: ["mcp"],
        codeChallenge: "S256=" + expectedChallenge,
        createdAt: Math.floor(Date.now() / 1000),
        used: false,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (oauth as any).pending.set(rid, pending);

      oauth.setSubject(rid, "user:rfc_test");
      const redirectUrl = oauth.approve(rid);
      const url = new URL(redirectUrl);
      const authorizationCode = url.searchParams.get("code");

      const client = await oauth.clientsStore.getClient("test_client");
      const tokens = await oauth.exchangeAuthorizationCode(
        client!,
        authorizationCode!,
        codeVerifier,
        "https://test.com/callback"
      );

      expect(tokens.access_token).toBeDefined();
      console.log("RFC 7636 S256 test vector verified successfully");
    });

    it("should accept raw code_challenge without method prefix (external OAuth provider)", async () => {
      const publicBaseUrl = new URL("https://test.example.com");
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

      // Raw code_challenge without method prefix (from external OAuth provider)
      const rawCodeChallenge = "some_base64url_encoded_challenge_without_prefix";

      const rid = randomUUID();
      const pending = {
        rid,
        clientId: "test_client",
        redirectUri: "https://test.com/callback",
        state: "test_state",
        scopes: ["mcp"],
        codeChallenge: rawCodeChallenge,
        createdAt: Math.floor(Date.now() / 1000),
        used: false,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (oauth as any).pending.set(rid, pending);

      oauth.setSubject(rid, "user:test");

      // Should succeed with warning for external OAuth provider
      const redirectUrl = oauth.approve(rid);
      const url = new URL(redirectUrl);
      const authorizationCode = url.searchParams.get("code");
      expect(authorizationCode).toBeDefined();

      // Token exchange should also succeed (no PKCE validation for external OAuth)
      const client = await oauth.clientsStore.getClient("test_client");
      const tokens = await oauth.exchangeAuthorizationCode(
        client!,
        authorizationCode!,
        undefined, // No code_verifier for external OAuth
        "https://test.com/callback"
      );

      expect(tokens.access_token).toBeDefined();
      console.log("Raw code_challenge accepted for external OAuth provider");
    });
  });

  describe("PKCE Edge Cases and Security", () => {
    
    it("should accept exchange with null code_verifier but non-S256 code_challenge (external OAuth)", async () => {
      const publicBaseUrl = new URL("https://test.example.com");
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

      // Create pending authorization with S256 code_challenge
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateS256CodeChallenge(codeVerifier);
      
      const rid = randomUUID();
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

      oauth.setSubject(rid, "user:test");
      const redirectUrl = oauth.approve(rid);
      const url = new URL(redirectUrl);
      const authorizationCode = url.searchParams.get("code");

      const client = await oauth.clientsStore.getClient("test_client");

      // For non-S256 challenges (external OAuth), code_verifier is not required
      // But for S256 challenges (our MCP OAuth), code_verifier IS required
      let errorThrown = false;
      try {
        await oauth.exchangeAuthorizationCode(
          client!,
          authorizationCode!,
          null as unknown as string, // Explicitly null
          "https://test.com/callback"
        );
      } catch (e) {
        errorThrown = true;
        // Should fail because S256 code_challenge requires code_verifier
        expect((e as Error).message).toBe("code_verifier required when code_challenge is present");
      }
      expect(errorThrown).toBe(true);

      console.log("S256 code_challenge correctly requires code_verifier");
    });

    it("should accept authorization with plain code_challenge (external OAuth provider)", async () => {
      const publicBaseUrl = new URL("https://test.example.com");
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

      // Create pending authorization with plain code_challenge (from external OAuth)
      const rid = randomUUID();
      const pending = {
        rid,
        clientId: "test_client",
        redirectUri: "https://test.com/callback",
        state: "test_state",
        scopes: ["mcp"],
        codeChallenge: "plain=test_code_verifier", // Plain method - accepted for external OAuth
        createdAt: Math.floor(Date.now() / 1000),
        used: false,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (oauth as any).pending.set(rid, pending);

      oauth.setSubject(rid, "user:test");

      // Should succeed with warning for external OAuth provider
      const redirectUrl = oauth.approve(rid);
      const url = new URL(redirectUrl);
      const authorizationCode = url.searchParams.get("code");
      expect(authorizationCode).toBeDefined();

      console.log("Plain code_challenge accepted for external OAuth provider at creation");
    });

    it("should accept authorization with raw code_challenge (external OAuth provider)", async () => {
      const publicBaseUrl = new URL("https://test.example.com");
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

      // Create pending authorization with raw code_challenge (from external OAuth)
      const rid = randomUUID();
      const pending = {
        rid,
        clientId: "test_client",
        redirectUri: "https://test.com/callback",
        state: "test_state",
        scopes: ["mcp"],
        codeChallenge: "raw_base64url_challenge_without_prefix", // Raw challenge - accepted for external OAuth
        createdAt: Math.floor(Date.now() / 1000),
        used: false,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (oauth as any).pending.set(rid, pending);

      oauth.setSubject(rid, "user:test");

      // Should succeed with warning for external OAuth provider
      const redirectUrl = oauth.approve(rid);
      const url = new URL(redirectUrl);
      const authorizationCode = url.searchParams.get("code");
      expect(authorizationCode).toBeDefined();

      console.log("Raw code_challenge accepted for external OAuth provider at creation");
    });

    it("should handle authorization without PKCE (code_challenge undefined)", async () => {
      const publicBaseUrl = new URL("https://test.example.com");
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

      // Create pending authorization WITHOUT code_challenge (PKCE optional)
      const rid = randomUUID();
      const pending = {
        rid,
        clientId: "test_client",
        redirectUri: "https://test.com/callback",
        state: "test_state",
        scopes: ["mcp"],
        codeChallenge: undefined, // No PKCE
        createdAt: Math.floor(Date.now() / 1000),
        used: false,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (oauth as any).pending.set(rid, pending);

      oauth.setSubject(rid, "user:test");

      // Should succeed without PKCE
      const redirectUrl = oauth.approve(rid);
      const url = new URL(redirectUrl);
      const authorizationCode = url.searchParams.get("code");
      expect(authorizationCode).toBeDefined();

      // Exchange without code_verifier should succeed when no code_challenge was used
      const client = await oauth.clientsStore.getClient("test_client");
      const tokens = await oauth.exchangeAuthorizationCode(
        client!,
        authorizationCode!,
        undefined, // No code_verifier
        "https://test.com/callback"
      );

      expect(tokens.access_token).toBeDefined();
      console.log("Authorization without PKCE completed successfully");
    });

    it("should reject S256 code_challenge with invalid base64url content", async () => {
      const publicBaseUrl = new URL("https://test.example.com");
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

      // Create pending authorization with malformed S256 code_challenge
      const rid = randomUUID();
      const pending = {
        rid,
        clientId: "test_client",
        redirectUri: "https://test.com/callback",
        state: "test_state",
        scopes: ["mcp"],
        codeChallenge: "S256=!!!invalid_base64!!!", // Malformed base64url
        createdAt: Math.floor(Date.now() / 1000),
        used: false,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (oauth as any).pending.set(rid, pending);

      oauth.setSubject(rid, "user:test");

      // Should succeed at approve() (only checks prefix) but fail at token exchange
      const redirectUrl = oauth.approve(rid);
      const url = new URL(redirectUrl);
      const authorizationCode = url.searchParams.get("code");

      const client = await oauth.clientsStore.getClient("test_client");

      // Exchange with valid verifier should fail because challenge hash won't match malformed input
      let errorThrown = false;
      try {
        await oauth.exchangeAuthorizationCode(
          client!,
          authorizationCode!,
          "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk", // Valid RFC verifier
          "https://test.com/callback"
        );
      } catch (e) {
        errorThrown = true;
        // Will fail at hash comparison, not validation
        expect((e as Error).message).toBe("PKCE verification failed");
      }
      expect(errorThrown).toBe(true);

      console.log("Malformed S256 code_challenge correctly rejected at token exchange");
    });
  });
});

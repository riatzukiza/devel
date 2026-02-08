import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Redis } from "ioredis";

const MCP_URL = process.env.MCP_TEST_URL || "http://127.0.0.1:3001/mcp";
const GATEWAY_URL = process.env.GATEWAY_TEST_URL || "https://err-stealth-16-ai-studio-a1vgg.tailbe888a.ts.net/mcp";
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

describe("MCP Server Discovery", () => {
  describe("Initialize Request", () => {
    it("should advertise tools capability", async () => {
      const response = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "initialize",
          id: 1,
          params: {
            protocolVersion: "2025-11-25",
            capabilities: {},
            clientInfo: { name: "test", version: "1.0.0" },
          },
        }),
      });

      expect(response.status).toBe(200);
      const text = await response.text();
      const dataMatch = text.match(/data: (.+)/);
      expect(dataMatch).toBeTruthy();
      
      const data = JSON.parse(dataMatch![1]);
      expect(data.result.capabilities.tools).toBeDefined();
      expect(data.result.capabilities.tools.listChanged).toBe(true);
    });

    it("should advertise resources capability", async () => {
      const response = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "initialize",
          id: 1,
          params: {
            protocolVersion: "2025-11-25",
            capabilities: {},
            clientInfo: { name: "test", version: "1.0.0" },
          },
        }),
      });

      expect(response.status).toBe(200);
      const text = await response.text();
      const dataMatch = text.match(/data: (.+)/);
      expect(dataMatch).toBeTruthy();
      
      const data = JSON.parse(dataMatch![1]);
      expect(data.result.capabilities.resources).toBeDefined();
      expect(data.result.capabilities.resources.listChanged).toBe(true);
    });

    it("should return a session ID", async () => {
      const response = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "initialize",
          id: 1,
          params: {
            protocolVersion: "2025-11-25",
            capabilities: {},
            clientInfo: { name: "test", version: "1.0.0" },
          },
        }),
      });

      expect(response.status).toBe(200);
      const sessionId = response.headers.get("mcp-session-id");
      expect(sessionId).toBeTruthy();
      expect(sessionId!.length).toBeGreaterThan(0);
    });
  });

  describe("Tools Discovery", () => {
    let sessionId: string;

    beforeAll(async () => {
      const initResponse = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "initialize",
          id: 1,
          params: {
            protocolVersion: "2025-11-25",
            capabilities: {},
            clientInfo: { name: "test", version: "1.0.0" },
          },
        }),
      });

      sessionId = initResponse.headers.get("mcp-session-id")!;
    });

    it("should list all 4 filesystem tools", async () => {
      const response = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/list",
          id: 2,
          params: {},
        }),
      });

      expect(response.status).toBe(200);
      const text = await response.text();
      const dataMatch = text.match(/data: (.+)/);
      expect(dataMatch).toBeTruthy();
      
      const data = JSON.parse(dataMatch![1]);
      expect(data.result.tools).toHaveLength(4);
      
      const toolNames = data.result.tools.map((t: any) => t.name);
      expect(toolNames).toContain("fs_list");
      expect(toolNames).toContain("fs_read");
      expect(toolNames).toContain("fs_write");
      expect(toolNames).toContain("fs_delete");
    });

    it("should have correct schema for fs_list tool", async () => {
      const response = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/list",
          id: 2,
          params: {},
        }),
      });

      const text = await response.text();
      const dataMatch = text.match(/data: (.+)/);
      const data = JSON.parse(dataMatch![1]);
      
      const fsList = data.result.tools.find((t: any) => t.name === "fs_list");
      expect(fsList).toBeDefined();
      expect(fsList.inputSchema.properties.path).toBeDefined();
      expect(fsList.inputSchema.properties.backend?.enum).toContain("auto");
      expect(fsList.inputSchema.properties.backend?.enum).toContain("local");
      expect(fsList.inputSchema.properties.backend?.enum).toContain("github");
    });
  });

  describe("Resources Discovery", () => {
    let sessionId: string;

    beforeAll(async () => {
      const initResponse = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "initialize",
          id: 1,
          params: {
            protocolVersion: "2025-11-25",
            capabilities: {},
            clientInfo: { name: "test", version: "1.0.0" },
          },
        }),
      });

      sessionId = initResponse.headers.get("mcp-session-id")!;
    });

    it("should list workspace-root resource", async () => {
      const response = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "resources/list",
          id: 3,
          params: {},
        }),
      });

      expect(response.status).toBe(200);
      const text = await response.text();
      const dataMatch = text.match(/data: (.+)/);
      expect(dataMatch).toBeTruthy();
      
      const data = JSON.parse(dataMatch![1]);
      expect(data.result.resources).toBeDefined();
      expect(data.result.resources.length).toBeGreaterThan(0);
      
      const rootResource = data.result.resources.find((r: any) => r.uri === "fs://root");
      expect(rootResource).toBeDefined();
      expect(rootResource.name).toBe("workspace-root");
    });

    it("should read workspace-root resource", async () => {
      const response = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "resources/read",
          id: 4,
          params: { uri: "fs://root" },
        }),
      });

      expect(response.status).toBe(200);
      const text = await response.text();
      const dataMatch = text.match(/data: (.+)/);
      expect(dataMatch).toBeTruthy();
      
      const data = JSON.parse(dataMatch![1]);
      expect(data.result.contents).toBeDefined();
      expect(data.result.contents.length).toBeGreaterThan(0);
      expect(data.result.contents[0].uri).toBe("fs://root");
      expect(data.result.contents[0].mimeType).toBe("text/plain");
    });
  });
});

describe("Redis Session Sharing", () => {
  let redis: Redis;

  beforeAll(() => {
    redis = new Redis(REDIS_URL);
  });

  afterAll(async () => {
    await redis.quit();
  });

  it("should store session in Redis after initialization", async () => {
    const initResponse = await fetch(MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "initialize",
        id: 1,
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      }),
    });

    const sessionId = initResponse.headers.get("mcp-session-id")!;
    
    // Check Redis for session
    const sessionData = await redis.get(`mcp:session:${sessionId}`);
    expect(sessionData).toBeTruthy();
    
    const parsed = JSON.parse(sessionData!);
    expect(parsed.createdAt).toBeDefined();
    expect(parsed.processId).toBeDefined();
  });

  it("should have session TTL of 3600 seconds", async () => {
    const initResponse = await fetch(MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "initialize",
        id: 1,
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      }),
    });

    const sessionId = initResponse.headers.get("mcp-session-id")!;
    const ttl = await redis.ttl(`mcp:session:${sessionId}`);
    
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(3600);
  });
});

describe("API Gateway CORS", () => {
  it("should return CORS headers for initialize", async () => {
    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "Authorization": "Bearer test-token",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "initialize",
        id: 1,
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Expose-Headers")).toContain("mcp-session-id");
  });

  it("should return mcp-session-id header through gateway", async () => {
    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "Authorization": "Bearer test-token",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "initialize",
        id: 1,
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      }),
    });

    expect(response.status).toBe(200);
    const sessionId = response.headers.get("mcp-session-id") || 
                     response.headers.get("Mcp-Session-Id") ||
                     response.headers.get("mcp-session-id");
    expect(sessionId).toBeTruthy();
    expect(sessionId!.length).toBeGreaterThan(0);
  });

  it("should handle OPTIONS preflight", async () => {
    const response = await fetch(GATEWAY_URL, {
      method: "OPTIONS",
      headers: {
        "Origin": "https://chatgpt.com",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, Authorization",
      },
    });

    expect(response.status).toBeOneOf([200, 204]);
  });
});

describe("End-to-End Gateway Flow", () => {
  it("should complete full discovery flow through gateway", async () => {
    // Step 1: Initialize
    const initResponse = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "Authorization": "Bearer test-token",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "initialize",
        id: 1,
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      }),
    });

    expect(initResponse.status).toBe(200);
    const sessionId = initResponse.headers.get("mcp-session-id")!;
    expect(sessionId).toBeTruthy();

    // Step 2: List tools
    const toolsResponse = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "Authorization": "Bearer test-token",
        "mcp-session-id": sessionId,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/list",
        id: 2,
        params: {},
      }),
    });

    expect(toolsResponse.status).toBe(200);
    const toolsText = await toolsResponse.text();
    const toolsData = JSON.parse(toolsText.match(/data: (.+)/)![1]);
    expect(toolsData.result.tools).toHaveLength(4);

    // Step 3: List resources
    const resourcesResponse = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "Authorization": "Bearer test-token",
        "mcp-session-id": sessionId,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "resources/list",
        id: 3,
        params: {},
      }),
    });

    expect(resourcesResponse.status).toBe(200);
    const resourcesText = await resourcesResponse.text();
    const resourcesData = JSON.parse(resourcesText.match(/data: (.+)/)![1]);
    expect(resourcesData.result.resources.length).toBeGreaterThan(0);
  });
});

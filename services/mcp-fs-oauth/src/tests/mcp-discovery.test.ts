import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Redis } from "ioredis";

const MCP_URL = process.env.MCP_TEST_URL || "http://127.0.0.1:3001/mcp";
const GATEWAY_URL = process.env.GATEWAY_TEST_URL || "http://127.0.0.1:8788/mcp";
const GATEWAY_BEARER = process.env.GATEWAY_TEST_BEARER || "test-token";
const RUN_GATEWAY_TESTS = process.env.RUN_GATEWAY_TESTS === "true";
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const gatewayDescribe = RUN_GATEWAY_TESTS ? describe : describe.skip;

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

    it("should list filesystem, exec, and API delegation tools", async () => {
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
      expect(data.result.tools).toHaveLength(39);
      
      const toolNames = data.result.tools.map((t: any) => t.name);
      expect(toolNames).toContain("fs_list");
      expect(toolNames).toContain("fs_read");
      expect(toolNames).toContain("fs_write");
      expect(toolNames).toContain("fs_delete");
      expect(toolNames).toContain("fs_read_lines");
      expect(toolNames).toContain("fs_read_chars");
      expect(toolNames).toContain("fs_glob");
      expect(toolNames).toContain("fs_grep");
      expect(toolNames).toContain("fs_precision_guide");
      expect(toolNames).toContain("list_agents");
      expect(toolNames).toContain("list_skills");
      expect(toolNames).toContain("find_skill");
      expect(toolNames).toContain("activate_skill");
      expect(toolNames).toContain("skill_read");
      expect(toolNames).toContain("skill_show");
      expect(toolNames).toContain("skill_active_list");
      expect(toolNames).toContain("openplanner_health");
      expect(toolNames).toContain("auto_skill_select");
      expect(toolNames).toContain("semantic_search");
      expect(toolNames).toContain("list_sessions");
      expect(toolNames).toContain("lsp_diagnostics");
      expect(toolNames).toContain("delegate_task");
      expect(toolNames).toContain("workspace_file_replace");
      expect(toolNames).toContain("session_messages");
      expect(toolNames).toContain("session_send");
      expect(toolNames).toContain("session_state");
      expect(toolNames).toContain("session_final_output");
      expect(toolNames).toContain("session_semantic_search");
      expect(toolNames).toContain("session_grep");
      expect(toolNames).toContain("session_glob");
      expect(toolNames).toContain("workspace_meta");
      expect(toolNames).toContain("workspace_list");
      expect(toolNames).toContain("workspace_file_read");
      expect(toolNames).toContain("workspace_file_write");
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
      expect(fsList.inputSchema.properties.includeHidden).toBeDefined();
      expect(fsList.inputSchema.properties.backend?.enum).toContain("auto");
      expect(fsList.inputSchema.properties.backend?.enum).toContain("local");
      expect(fsList.inputSchema.properties.backend?.enum).toContain("github");
    });

    it("should have required inputs for delegate_task tool", async () => {
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
          id: 201,
          params: {},
        }),
      });

      const text = await response.text();
      const dataMatch = text.match(/data: (.+)/);
      const data = JSON.parse(dataMatch![1]);

      const delegateTask = data.result.tools.find((t: any) => t.name === "delegate_task");
      expect(delegateTask).toBeDefined();
      expect(delegateTask.inputSchema.properties.agentType).toBeDefined();
      expect(delegateTask.inputSchema.properties.prompt).toBeDefined();
      expect(delegateTask.inputSchema.required).toContain("agentType");
      expect(delegateTask.inputSchema.required).toContain("prompt");
    });

    it("should return compact text output for fs_list", async () => {
      const fixtureFile = "testdata/list-compact.txt";

      const writeResponse = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          id: 60,
          params: {
            name: "fs_write",
            arguments: {
              path: fixtureFile,
              content: "fixture\n",
            },
          },
        }),
      });

      expect(writeResponse.status).toBe(200);
      const writeText = await writeResponse.text();
      const writeDataMatch = writeText.match(/data: (.+)/);
      expect(writeDataMatch).toBeTruthy();

      const writeData = JSON.parse(writeDataMatch![1]);
      const writeMessage = writeData.result.content[0]?.text as string;
      expect(writeMessage).toContain(`wrote ${fixtureFile}`);
      expect(writeMessage).toContain("backend auto");
      expect(writeMessage.trim().startsWith("{")).toBe(false);

      const response = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          id: 61,
          params: {
            name: "fs_list",
            arguments: {
              path: "testdata",
            },
          },
        }),
      });

      expect(response.status).toBe(200);
      const text = await response.text();
      const dataMatch = text.match(/data: (.+)/);
      expect(dataMatch).toBeTruthy();

      const data = JSON.parse(dataMatch![1]);
      const message = data.result.content[0]?.text as string;
      expect(message).toContain("testdata");
      expect(message).toContain("list-compact.txt");
      expect(message.trim().startsWith("{")).toBe(false);
      expect(message.trim().startsWith("[")).toBe(false);
    });

    it("should return raw text output for fs_read", async () => {
      const fixturePath = "testdata/raw-read.txt";
      const fixtureContent = "alpha\nbeta\ngamma\n";

      const writeResponse = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          id: 62,
          params: {
            name: "fs_write",
            arguments: {
              path: fixturePath,
              content: fixtureContent,
            },
          },
        }),
      });

      expect(writeResponse.status).toBe(200);

      const response = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          id: 63,
          params: {
            name: "fs_read",
            arguments: {
              path: fixturePath,
            },
          },
        }),
      });

      expect(response.status).toBe(200);
      const text = await response.text();
      const dataMatch = text.match(/data: (.+)/);
      expect(dataMatch).toBeTruthy();

      const data = JSON.parse(dataMatch![1]);
      const message = data.result.content[0]?.text as string;
      expect(message).toBe(fixtureContent);
      expect(message.trim().startsWith("{")).toBe(false);
    });

    it("should redact high-entropy strings in read tools", async () => {
      const fixturePath = "testdata/redaction-read.txt";
      const secretLike = "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcd";
      const fixtureContent = `ok\n${secretLike}\nend\n`;

      const writeResponse = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          id: 631,
          params: {
            name: "fs_write",
            arguments: {
              path: fixturePath,
              content: fixtureContent,
            },
          },
        }),
      });

      expect(writeResponse.status).toBe(200);

      const readResponse = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          id: 632,
          params: {
            name: "fs_read",
            arguments: {
              path: fixturePath,
            },
          },
        }),
      });

      expect(readResponse.status).toBe(200);
      const readText = await readResponse.text();
      const readDataMatch = readText.match(/data: (.+)/);
      expect(readDataMatch).toBeTruthy();
      const readData = JSON.parse(readDataMatch![1]);
      const readMessage = readData.result.content[0]?.text as string;
      expect(readMessage).not.toContain(secretLike);
      // High-entropy redaction is now opt-in (entropyRedact=true). By default we use pattern-based secret redaction.
      expect(readMessage).toContain("[redacted_secret]");

      const linesResponse = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          id: 633,
          params: {
            name: "fs_read_lines",
            arguments: {
              path: fixturePath,
              startLine: 2,
              lineCount: 1,
            },
          },
        }),
      });

      expect(linesResponse.status).toBe(200);
      const linesText = await linesResponse.text();
      const linesDataMatch = linesText.match(/data: (.+)/);
      expect(linesDataMatch).toBeTruthy();
      const linesData = JSON.parse(linesDataMatch![1]);
      expect(linesData.result.content[0]?.text).toBe("[redacted_secret]");
    });

    it("should support partial reads by lines and chars", async () => {
      const fixturePath = "testdata/partial-read.txt";
      const fixtureContent = "line1\nline2\nline3\nline4\n";

      const writeResponse = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          id: 64,
          params: {
            name: "fs_write",
            arguments: {
              path: fixturePath,
              content: fixtureContent,
            },
          },
        }),
      });

      expect(writeResponse.status).toBe(200);

      const lineResponse = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          id: 65,
          params: {
            name: "fs_read_lines",
            arguments: {
              path: fixturePath,
              startLine: 2,
              lineCount: 2,
            },
          },
        }),
      });

      expect(lineResponse.status).toBe(200);
      const lineText = await lineResponse.text();
      const lineDataMatch = lineText.match(/data: (.+)/);
      expect(lineDataMatch).toBeTruthy();
      const lineData = JSON.parse(lineDataMatch![1]);
      expect(lineData.result.content[0]?.text).toBe("line2\nline3");

      const charResponse = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          id: 66,
          params: {
            name: "fs_read_chars",
            arguments: {
              path: fixturePath,
              offset: 6,
              length: 5,
            },
          },
        }),
      });

      expect(charResponse.status).toBe(200);
      const charText = await charResponse.text();
      const charDataMatch = charText.match(/data: (.+)/);
      expect(charDataMatch).toBeTruthy();
      const charData = JSON.parse(charDataMatch![1]);
      expect(charData.result.content[0]?.text).toBe("line2");
    });

    it("should hide dotfiles unless includeHidden is true", async () => {
      const hiddenPath = "testdata/.hidden-file.txt";

      const writeResponse = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          id: 671,
          params: {
            name: "fs_write",
            arguments: {
              path: hiddenPath,
              content: "hidden\n",
            },
          },
        }),
      });

      expect(writeResponse.status).toBe(200);

      const defaultListResponse = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          id: 672,
          params: {
            name: "fs_list",
            arguments: {
              path: "testdata",
            },
          },
        }),
      });

      expect(defaultListResponse.status).toBe(200);
      const defaultListText = await defaultListResponse.text();
      const defaultListDataMatch = defaultListText.match(/data: (.+)/);
      expect(defaultListDataMatch).toBeTruthy();
      const defaultListData = JSON.parse(defaultListDataMatch![1]);
      const defaultListMessage = defaultListData.result.content[0]?.text as string;
      expect(defaultListMessage).not.toContain(".hidden-file.txt");

      const includeHiddenResponse = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          id: 673,
          params: {
            name: "fs_list",
            arguments: {
              path: "testdata",
              includeHidden: true,
            },
          },
        }),
      });

      expect(includeHiddenResponse.status).toBe(200);
      const includeHiddenText = await includeHiddenResponse.text();
      const includeHiddenDataMatch = includeHiddenText.match(/data: (.+)/);
      expect(includeHiddenDataMatch).toBeTruthy();
      const includeHiddenData = JSON.parse(includeHiddenDataMatch![1]);
      const includeHiddenMessage = includeHiddenData.result.content[0]?.text as string;
      expect(includeHiddenMessage).toContain(".hidden-file.txt");
    });

    it("should block broad fs_tree scans with guidance", async () => {
      const response = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          id: 6,
          params: {
            name: "fs_tree",
            arguments: {
              path: "",
              maxDepth: 6,
              pageSize: 250,
            },
          },
        }),
      });

      expect(response.status).toBe(200);
      const text = await response.text();
      const dataMatch = text.match(/data: (.+)/);
      expect(dataMatch).toBeTruthy();

      const data = JSON.parse(dataMatch![1]);
      const message = data.result.content[0]?.text as string;
      expect(message).toContain("[blocked] fs_tree request is too broad");
      expect(message).toContain("Use precise discovery flow");
      expect(message).toContain("fs_glob");
      expect(message).toContain("fs_grep");
    });

    it("should return precision guidance tool output", async () => {
      const response = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          id: 7,
          params: {
            name: "fs_precision_guide",
            arguments: {},
          },
        }),
      });

      expect(response.status).toBe(200);
      const text = await response.text();
      const dataMatch = text.match(/data: (.+)/);
      expect(dataMatch).toBeTruthy();

      const data = JSON.parse(dataMatch![1]);
      const message = data.result.content[0]?.text as string;
      expect(message).toContain("Precision workflow");
      expect(message).toContain("fs_glob");
      expect(message).toContain("fs_grep");
      expect(message).toContain("fs_tree");
    });

    it("should return compact text output for fs_glob", async () => {
      const fixturePath = "testdata/compact-output.ts";
      const writeResponse = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          id: 8,
          params: {
            name: "fs_write",
            arguments: {
              path: fixturePath,
              content: "export const compactOutputFixture = true;\n",
            },
          },
        }),
      });

      expect(writeResponse.status).toBe(200);

      const response = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          id: 81,
          params: {
            name: "fs_glob",
            arguments: {
              path: "testdata",
              pattern: "**/*.ts",
              includeDirectories: false,
              maxResults: 20,
            },
          },
        }),
      });

      expect(response.status).toBe(200);
      const text = await response.text();
      const dataMatch = text.match(/data: (.+)/);
      expect(dataMatch).toBeTruthy();

      const data = JSON.parse(dataMatch![1]);
      const message = data.result.content[0]?.text as string;
      expect(message.length).toBeGreaterThan(0);
      expect(message).toContain(fixturePath);
      expect(message.trim().startsWith("{")).toBe(false);
      expect(message.trim().startsWith("[")).toBe(false);
    });

    it("should return compact text output for fs_grep", async () => {
      const fixturePath = "testdata/compact-grep.ts";
      const fixtureNeedle = "UNIQUE_GREP_TOKEN_23918";

      const writeResponse = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          id: 9,
          params: {
            name: "fs_write",
            arguments: {
              path: fixturePath,
              content: `export const grepNeedle = \"${fixtureNeedle}\";\n`,
            },
          },
        }),
      });

      expect(writeResponse.status).toBe(200);

      const response = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          id: 91,
          params: {
            name: "fs_grep",
            arguments: {
              path: "testdata",
              include: "**/*.ts",
              pattern: fixtureNeedle,
              maxResults: 10,
            },
          },
        }),
      });

      expect(response.status).toBe(200);
      const text = await response.text();
      const dataMatch = text.match(/data: (.+)/);
      expect(dataMatch).toBeTruthy();

      const data = JSON.parse(dataMatch![1]);
      const message = data.result.content[0]?.text as string;
      expect(message.length).toBeGreaterThan(0);
      expect(message).toContain(`${fixturePath}:1`);
      expect(message).toContain(":");
      expect(message.trim().startsWith("{")).toBe(false);
      expect(message.trim().startsWith("[")).toBe(false);
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

      const skillGuide = data.result.resources.find((r: any) => r.uri === "skills://guide");
      expect(skillGuide).toBeDefined();
      expect(skillGuide.name).toBe("skill-guide");
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

    it("should read skill-guide resource", async () => {
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
          id: 5,
          params: { uri: "skills://guide" },
        }),
      });

      expect(response.status).toBe(200);
      const text = await response.text();
      const dataMatch = text.match(/data: (.+)/);
      expect(dataMatch).toBeTruthy();

      const data = JSON.parse(dataMatch![1]);
      expect(data.result.contents[0].uri).toBe("skills://guide");
      expect(data.result.contents[0].text).toContain("Skills are reusable instruction bundles");
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

  it("should have session TTL of 86400 seconds", async () => {
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
    expect(ttl).toBeLessThanOrEqual(86400);
  });

  it("should adopt dead-owner metadata on POST session traffic", async () => {
    const sessionId = `dead-owner-${Date.now()}`;
    const staleOwnerPid = 999999999;
    const createdAt = Date.now() - 15_000;

    await redis.setex(
      `mcp:session:${sessionId}`,
      86400,
      JSON.stringify({ createdAt, processId: staleOwnerPid }),
    );

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
        id: 5001,
        params: {},
      }),
    });

    // The transport is still uninitialized, but metadata should be adopted.
    expect(response.status).toBe(400);

    const afterRaw = await redis.get(`mcp:session:${sessionId}`);
    expect(afterRaw).toBeTruthy();
    const after = JSON.parse(afterRaw ?? "{}");
    expect(after.createdAt).toBe(createdAt);
    expect(typeof after.processId).toBe("number");
    expect(after.processId).not.toBe(staleOwnerPid);
  });

});

gatewayDescribe("API Gateway CORS", () => {
  it("should return CORS headers for initialize", async () => {
    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "Authorization": `Bearer ${GATEWAY_BEARER}`,
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
        "Authorization": `Bearer ${GATEWAY_BEARER}`,
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

gatewayDescribe("End-to-End Gateway Flow", () => {
  it("should complete full discovery flow through gateway", async () => {
    // Step 1: Initialize
    const initResponse = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "Authorization": `Bearer ${GATEWAY_BEARER}`,
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
        "Authorization": `Bearer ${GATEWAY_BEARER}`,
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
    expect(toolsData.result.tools).toHaveLength(38);

    // Step 3: List resources
    const resourcesResponse = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "Authorization": `Bearer ${GATEWAY_BEARER}`,
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

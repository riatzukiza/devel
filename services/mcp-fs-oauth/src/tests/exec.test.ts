import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "bun:test";

import {
  clearExecConfigCache,
  listExecCommands,
  runExecCommand,
  type ExecConfig,
} from "../tools/exec.js";

async function withExecConfig(config: ExecConfig, fn: () => Promise<void>): Promise<void> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-exec-config-"));
  const configPath = path.join(tempDir, "exec-config.json");
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");

  const previousConfig = process.env.MCP_EXEC_CONFIG;
  process.env.MCP_EXEC_CONFIG = configPath;
  clearExecConfigCache();

  try {
    await fn();
  } finally {
    if (previousConfig === undefined) {
      delete process.env.MCP_EXEC_CONFIG;
    } else {
      process.env.MCP_EXEC_CONFIG = previousConfig;
    }
    clearExecConfigCache();
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

describe("exec allowlist glob permissions", () => {
  it("allows invocation that matches command allowPatterns", async () => {
    await withExecConfig(
      {
        commands: [
          {
            id: "echo-safe",
            description: "echo safe values",
            command: "echo",
            allowExtraArgs: true,
            allowPatterns: ["echo safe-*"],
          },
        ],
      },
      async () => {
        const out = await runExecCommand("echo-safe", ["safe-value"]);
        expect(out.exitCode).toBe(0);
        expect(out.stdout).toContain("safe-value");
      },
    );
  });

  it("blocks invocation that does not match allowPatterns", async () => {
    await withExecConfig(
      {
        commands: [
          {
            id: "echo-safe",
            description: "echo safe values",
            command: "echo",
            allowExtraArgs: true,
            allowPatterns: ["echo safe-*"],
          },
        ],
      },
      async () => {
        await expect(runExecCommand("echo-safe", ["unsafe-value"]))
          .rejects
          .toThrow("does not match allowPatterns");
      },
    );
  });

  it("supports config-level allowPatterns like opencode permissions", async () => {
    await withExecConfig(
      {
        allowPatterns: ["echo global-*"],
        commands: [
          {
            id: "echo-global",
            description: "echo global values",
            command: "echo",
            allowExtraArgs: true,
          },
        ],
      },
      async () => {
        const out = await runExecCommand("echo-global", ["global-ok"]);
        expect(out.exitCode).toBe(0);
        expect(out.stdout).toContain("global-ok");

        await expect(runExecCommand("echo-global", ["not-allowed"]))
          .rejects
          .toThrow("does not match allowPatterns");
      },
    );
  });

  it("blocks invocation via denyPatterns even if allowPatterns match", async () => {
    await withExecConfig(
      {
        commands: [
          {
            id: "echo-deny",
            description: "echo with deny pattern",
            command: "echo",
            allowExtraArgs: true,
            allowPatterns: ["echo *"],
            denyPatterns: ["*forbidden*"],
          },
        ],
      },
      async () => {
        await expect(runExecCommand("echo-deny", ["forbidden-value"]))
          .rejects
          .toThrow("blocked by denyPatterns");
      },
    );
  });

  it("requires allowPatterns when extra args are enabled", async () => {
    await withExecConfig(
      {
        commands: [
          {
            id: "echo-open",
            description: "echo with unrestricted args",
            command: "echo",
            allowExtraArgs: true,
          },
        ],
      },
      async () => {
        await expect(runExecCommand("echo-open", ["any-arg"]))
          .rejects
          .toThrow("allows extra args but has no allowPatterns");
      },
    );
  });

  it("applies default deny patterns even when allowPatterns match", async () => {
    await withExecConfig(
      {
        commands: [
          {
            id: "echo-open",
            description: "echo values",
            command: "echo",
            allowExtraArgs: true,
            allowPatterns: ["echo *"],
          },
        ],
      },
      async () => {
        await expect(runExecCommand("echo-open", ["rm", "-rf", "/tmp/demo"]))
          .rejects
          .toThrow("blocked by denyPatterns");
      },
    );
  });

  it("auto-discovers exec-permissions.json without MCP_EXEC_CONFIG", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-exec-autodiscover-"));
    const nestedDir = path.join(tempDir, "nested", "deeper");
    await fs.mkdir(nestedDir, { recursive: true });

    const configPath = path.join(tempDir, "exec-permissions.json");
    const config: ExecConfig = {
      commands: [
        {
          id: "echo-discovered",
          description: "autodiscovered command",
          command: "echo",
          args: ["hello"],
          allowPatterns: ["echo hello"],
        },
      ],
    };
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");

    const previousConfig = process.env.MCP_EXEC_CONFIG;
    const previousInline = process.env.MCP_EXEC_COMMANDS_JSON;
    const previousCwd = process.cwd();
    delete process.env.MCP_EXEC_CONFIG;
    delete process.env.MCP_EXEC_COMMANDS_JSON;
    process.chdir(nestedDir);
    clearExecConfigCache();

    try {
      const commands = await listExecCommands();
      expect(commands.map((command) => command.id)).toContain("echo-discovered");
    } finally {
      process.chdir(previousCwd);
      if (previousConfig === undefined) {
        delete process.env.MCP_EXEC_CONFIG;
      } else {
        process.env.MCP_EXEC_CONFIG = previousConfig;
      }
      if (previousInline === undefined) {
        delete process.env.MCP_EXEC_COMMANDS_JSON;
      } else {
        process.env.MCP_EXEC_COMMANDS_JSON = previousInline;
      }
      clearExecConfigCache();
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});

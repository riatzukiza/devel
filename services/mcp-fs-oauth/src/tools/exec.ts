import { spawn } from "node:child_process";
import path from "node:path";
import { readFile, stat } from "node:fs/promises";
import { z } from "zod";

export type ExecCommand = {
  id: string;
  description: string;
  command: string;
  args?: string[];
  cwd?: string;
  timeoutMs?: number;
  allowExtraArgs?: boolean;
  allowPatterns?: string[];
  denyPatterns?: string[];
};

export type ExecConfig = {
  defaultCwd?: string;
  defaultTimeoutMs?: number;
  allowPatterns?: string[];
  denyPatterns?: string[];
  commands: ExecCommand[];
};

const DEFAULT_TIMEOUT_MS = 60_000;
const GLOB_SPECIALS = /[\\^$+?.()|[\]{}]/g;
const AUTO_CONFIG_FILES = [
  ".opencode/exec-permissions.json",
  "exec-permissions.json",
  "promethean.mcp.exec.json",
  "services/mcp-fs-oauth/exec-permissions.json",
] as const;
const DEFAULT_DENY_PATTERNS = [
  "*rm -rf*",
  "*rm -fr*",
  "*mkfs*",
  "*dd if=* of=/dev/*",
  "*curl *|*sh*",
  "*curl *|*bash*",
  "*wget *|*sh*",
  "*wget *|*bash*",
] as const;

function globToRegExp(pattern: string): RegExp {
  const normalized = pattern.trim();
  if (normalized.length === 0) {
    throw new Error("Empty allowlist pattern is not allowed");
  }
  if (normalized.length > 512) {
    throw new Error("Allowlist pattern is too long");
  }
  const escaped = normalized.replace(GLOB_SPECIALS, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

function compilePatterns(patterns?: readonly string[]): RegExp[] {
  if (!patterns || patterns.length === 0) {
    return [];
  }
  return patterns.map(globToRegExp);
}

function matchesAnyPattern(value: string, patterns: readonly RegExp[]): boolean {
  if (patterns.length === 0) {
    return true;
  }
  return patterns.some((pattern) => pattern.test(value));
}

function toInvocation(command: string, args: readonly string[]): string {
  return [command, ...args].map((part) => part.trim()).filter(Boolean).join(" ");
}

async function loadExecConfig(): Promise<ExecConfig> {
  const configPath = process.env.MCP_EXEC_CONFIG;

  if (configPath) {
    try {
      const content = await readFile(path.resolve(process.cwd(), configPath), "utf8");
      return JSON.parse(content) as ExecConfig;
    } catch {
      console.warn("[exec] Could not load exec config from", configPath);
    }
  }

  const inlineConfig = process.env.MCP_EXEC_COMMANDS_JSON;
  if (inlineConfig && inlineConfig.trim().length > 0) {
    return JSON.parse(inlineConfig) as ExecConfig;
  }

  const discoveredPath = await findExecConfigPath(process.cwd());
  if (discoveredPath) {
    try {
      const content = await readFile(discoveredPath, "utf8");
      return JSON.parse(content) as ExecConfig;
    } catch {
      console.warn("[exec] Could not load exec config from", discoveredPath);
    }
  }

  return { commands: [] };
}

async function findExecConfigPath(startDir: string): Promise<string | undefined> {
  let current = path.resolve(startDir);

  for (let depth = 0; depth < 100; depth += 1) {
    for (const relativeCandidate of AUTO_CONFIG_FILES) {
      const candidate = path.join(current, relativeCandidate);
      try {
        const fileStats = await stat(candidate);
        if (fileStats.isFile()) {
          return candidate;
        }
      } catch {
        // keep searching
      }
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }

  return undefined;
}

let configCache: ExecConfig | null = null;

export function clearExecConfigCache(): void {
  configCache = null;
}

async function getConfig(): Promise<ExecConfig> {
  if (!configCache) {
    configCache = await loadExecConfig();
  }
  return configCache;
}

export async function listExecCommands(): Promise<ExecCommand[]> {
  const config = await getConfig();
  return config.commands;
}

export async function runExecCommand(
  commandId: string,
  extraArgs?: string[],
  timeoutMs?: number
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const config = await getConfig();
  
  const command = config.commands.find((c) => c.id === commandId);
  if (!command) {
    throw new Error(`Command '${commandId}' is not in the allowlist. Use exec_list to see available commands.`);
  }
  
  // Build args
  let args: string[] = command.args ?? [];
  if (extraArgs && extraArgs.length > 0) {
    if (!command.allowExtraArgs) {
      throw new Error(`Command '${commandId}' does not permit extra arguments`);
    }
    args = [...args, ...extraArgs];
  }
  
  // Resolve working directory
  const cwd = command.cwd ?? config.defaultCwd ?? process.cwd();

  const invocation = toInvocation(command.command, args);
  const allowRegexes = compilePatterns(command.allowPatterns ?? config.allowPatterns);
  const denyRegexes = compilePatterns([
    ...DEFAULT_DENY_PATTERNS,
    ...(config.denyPatterns ?? []),
    ...(command.denyPatterns ?? []),
  ]);

  if (denyRegexes.length > 0 && matchesAnyPattern(invocation, denyRegexes)) {
    throw new Error(`Command '${commandId}' is blocked by denyPatterns: ${invocation}`);
  }

  if (allowRegexes.length > 0 && !matchesAnyPattern(invocation, allowRegexes)) {
    throw new Error(
      `Command '${commandId}' invocation does not match allowPatterns: ${invocation}`,
    );
  }

  if (extraArgs && extraArgs.length > 0 && command.allowExtraArgs && allowRegexes.length === 0) {
    throw new Error(
      `Command '${commandId}' allows extra args but has no allowPatterns. Add glob patterns (for example: "git *").`,
    );
  }
  
  // Compute timeout
  const effectiveTimeout = timeoutMs ?? command.timeoutMs ?? config.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
  
  return new Promise((resolve, reject) => {
    const child = spawn(command.command, args, {
      cwd,
      env: process.env,
      timeout: effectiveTimeout,
    });
    
    let stdout = "";
    let stderr = "";
    
    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });
    
    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });
    
    child.on("error", (error) => {
      reject(error);
    });
    
    child.on("close", (exitCode) => {
      resolve({
        stdout: stdout.slice(0, 100_000), // Limit output size
        stderr: stderr.slice(0, 100_000),
        exitCode: exitCode ?? 0,
      });
    });
  });
}

// Export schemas for MCP tool registration
export const execListInputSchema = z.object({});

export const execRunInputSchema = z.object({
  commandId: z.string(),
  args: z.array(z.string()).optional(),
  timeoutMs: z.number().int().positive().optional(),
});

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface CommandOptions {
  readonly cwd?: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly reject?: boolean;
  readonly input?: string;
}

export interface CommandResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
}

export const runCommand = async (
  command: string,
  args: readonly string[],
  options: CommandOptions = {},
): Promise<CommandResult> => {
  try {
    const result = await execFileAsync(command, args, {
      cwd: options.cwd,
      env: options.env,
      input: options.input,
      maxBuffer: 64 * 1024 * 1024,
      encoding: "utf8",
    });
    return {
      stdout: result.stdout.trimEnd(),
      stderr: result.stderr.trimEnd(),
      exitCode: 0,
    };
  } catch (error) {
    const failure = error as NodeJS.ErrnoException & {
      readonly code?: number;
      readonly stdout?: string;
      readonly stderr?: string;
    };
    const result: CommandResult = {
      stdout: (failure.stdout ?? "").trimEnd(),
      stderr: (failure.stderr ?? failure.message ?? "").trimEnd(),
      exitCode: typeof failure.code === "number" ? failure.code : 1,
    };
    if (options.reject !== false) {
      const rendered = [command, ...args].join(" ");
      throw new Error(`${rendered} failed (${result.exitCode}): ${result.stderr || result.stdout || "unknown error"}`);
    }
    return result;
  }
};

export const runJsonCommand = async <T>(
  command: string,
  args: readonly string[],
  options: CommandOptions = {},
): Promise<T> => {
  const result = await runCommand(command, args, options);
  return JSON.parse(result.stdout) as T;
};

export const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

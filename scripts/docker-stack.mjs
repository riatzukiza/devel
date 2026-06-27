import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = resolve(ROOT, "config/docker-stacks.json");
const HOST_PM2_ECOSYSTEM_PATH = resolve(ROOT, "ecosystem.config.cjs");

const COMPOSE_COMMANDS = {
  build: ["build"],
  config: ["config"],
  down: ["down"],
  exec: ["exec"],
  logs: ["logs", "--tail=200"],
  ps: ["ps"],
  pull: ["pull"],
  restart: ["restart"],
  run: ["run", "--rm"],
  start: ["start"],
  stop: ["stop"],
  up: ["up", "-d"]
};

const GUARDED_COMPOSE_COMMANDS = new Set(["up", "start", "restart"]);
const NON_CONFLICTING_PM2_STATUSES = new Set(["missing", "stopped", "errored"]);

function fail(message, exitCode = 1) {
  console.error(message);
  process.exit(exitCode);
}

function stripDoubleDash(args) {
  return args.filter((arg) => arg !== "--");
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? ROOT,
    env: process.env,
    stdio: options.stdio ?? "pipe",
    encoding: options.encoding ?? "utf8"
  });

  if (result.error) {
    fail(`Failed to run ${command}: ${result.error.message}`);
  }

  return result;
}

function formatCommand(command, args) {
  return [command, ...args]
    .map((arg) => (arg.includes(" ") ? JSON.stringify(arg) : arg))
    .join(" ");
}

function stripAnsi(value) {
  let output = "";
  let index = 0;

  while (index < value.length) {
    const current = value.charCodeAt(index);
    if (current === 27 && value[index + 1] === "[") {
      index += 2;
      while (index < value.length) {
        const code = value.charCodeAt(index);
        index += 1;
        if (code >= 64 && code <= 126) {
          break;
        }
      }
      continue;
    }

    output += value[index] ?? "";
    index += 1;
  }

  return output;
}

function readRegistry() {
  if (!existsSync(REGISTRY_PATH)) {
    fail(`Docker stack registry not found: ${relative(ROOT, REGISTRY_PATH)}`);
  }

  const raw = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.stacks)) {
    fail(`Invalid docker stack registry: ${relative(ROOT, REGISTRY_PATH)}`);
  }

  return raw.stacks.map((stack) => {
    if (!stack || typeof stack !== "object") {
      fail("Invalid stack entry in docker stack registry");
    }

    const name = typeof stack.name === "string" ? stack.name.trim() : "";
    const cwd = typeof stack.cwd === "string" ? stack.cwd.trim() : "";
    const files = Array.isArray(stack.files)
      ? stack.files.filter((file) => typeof file === "string" && file.trim().length > 0)
      : [];
    const aliases = Array.isArray(stack.aliases)
      ? stack.aliases.filter((alias) => typeof alias === "string" && alias.trim().length > 0)
      : [];
    const hostPm2Apps = Array.isArray(stack.hostPm2Apps)
      ? stack.hostPm2Apps.filter((app) => typeof app === "string" && app.trim().length > 0)
      : [];

    if (!name || !cwd || files.length === 0) {
      fail(`Invalid stack entry for ${JSON.stringify(stack)}`);
    }

    return {
      name,
      aliases,
      cwd,
      cwdAbs: resolve(ROOT, cwd),
      files,
      filesAbs: files.map((file) => resolve(ROOT, cwd, file)),
      projectName:
        typeof stack.projectName === "string" && stack.projectName.trim().length > 0
          ? stack.projectName.trim()
          : undefined,
      hostPm2Apps,
      description:
        typeof stack.description === "string" && stack.description.trim().length > 0
          ? stack.description.trim()
          : ""
    };
  });
}

function buildStackIndex(stacks) {
  const index = new Map();

  for (const stack of stacks) {
    const keys = [stack.name, ...stack.aliases];
    for (const key of keys) {
      if (index.has(key)) {
        fail(`Duplicate docker stack alias detected: ${key}`);
      }
      index.set(key, stack);
    }
  }

  return index;
}

function usage() {
  return [
    "Usage:",
    "  pnpm docker:stack:list",
    "  pnpm docker:stack list [--json]",
    "  pnpm docker:stack show <stack> [--json]",
    "  pnpm docker:stack status <stack>",
    "  pnpm docker:stack host:status <stack>",
    "  pnpm docker:stack host:start <stack>",
    "  pnpm docker:stack host:stop <stack>",
    "  pnpm docker:stack use-container <stack> [-- <docker compose up args...>]",
    "  pnpm docker:stack use-host <stack> [-- <docker compose down args...>]",
    "  pnpm docker:stack <up|down|ps|logs|config|build|pull|restart|start|stop|exec|run> <stack> [-- <docker compose args...>]",
    "",
    "Examples:",
    "  pnpm docker:stack use-container open-hax-openai-proxy -- --build",
    "  pnpm docker:stack use-host open-hax-openai-proxy",
    "  pnpm docker:stack status open-hax-openai-proxy",
    "  pnpm docker:stack ps part64",
    "  pnpm docker:stack config open-hax-openai-proxy -- -q"
  ].join("\n");
}

function printTable(stacks) {
  const rows = stacks.map((stack) => ({
    name: stack.name,
    cwd: stack.cwd,
    files: stack.files.join(", "),
    hostPm2: stack.hostPm2Apps.length > 0 ? stack.hostPm2Apps.join(", ") : "-",
    description: stack.description
  }));

  const widths = {
    name: Math.max("STACK".length, ...rows.map((row) => row.name.length)),
    cwd: Math.max("PATH".length, ...rows.map((row) => row.cwd.length)),
    files: Math.max("FILES".length, ...rows.map((row) => row.files.length)),
    hostPm2: Math.max("HOST_PM2".length, ...rows.map((row) => row.hostPm2.length))
  };

  const header = [
    "STACK".padEnd(widths.name),
    "PATH".padEnd(widths.cwd),
    "FILES".padEnd(widths.files),
    "HOST_PM2".padEnd(widths.hostPm2),
    "DESCRIPTION"
  ].join("  ");

  console.log(header);
  for (const row of rows) {
    console.log(
      [
        row.name.padEnd(widths.name),
        row.cwd.padEnd(widths.cwd),
        row.files.padEnd(widths.files),
        row.hostPm2.padEnd(widths.hostPm2),
        row.description
      ].join("  ")
    );
  }
}

function printStack(stack, jsonMode) {
  if (jsonMode) {
    console.log(
      JSON.stringify(
        {
          name: stack.name,
          aliases: stack.aliases,
          cwd: stack.cwd,
          files: stack.files,
          projectName: stack.projectName,
          hostPm2Apps: stack.hostPm2Apps,
          description: stack.description
        },
        null,
        2
      )
    );
    return;
  }

  console.log(`Stack: ${stack.name}`);
  console.log(`Path: ${stack.cwd}`);
  console.log(`Files: ${stack.files.join(", ")}`);
  console.log(`Project: ${stack.projectName ?? "<compose default>"}`);
  console.log(`Aliases: ${stack.aliases.length > 0 ? stack.aliases.join(", ") : "<none>"}`);
  console.log(`Host PM2 apps: ${stack.hostPm2Apps.length > 0 ? stack.hostPm2Apps.join(", ") : "<none>"}`);
  console.log(`Description: ${stack.description || "<none>"}`);
}

function resolveStack(stackName, stackIndex) {
  const stack = stackIndex.get(stackName);
  if (!stack) {
    const available = Array.from(new Set(Array.from(stackIndex.values()).map((entry) => entry.name))).sort();
    fail(`Unknown docker stack: ${stackName}\nAvailable stacks: ${available.join(", ")}`);
  }

  if (!existsSync(stack.cwdAbs)) {
    fail(`Stack working directory does not exist: ${stack.cwd}`);
  }

  for (const [index, file] of stack.filesAbs.entries()) {
    if (!existsSync(file)) {
      fail(`Compose file does not exist: ${resolve(stack.cwd, stack.files[index])}`);
    }
  }

  return stack;
}

function readPm2ProcessList() {
  const result = runCommand("pm2", ["jlist"]);
  if ((result.status ?? 1) !== 0) {
    fail((result.stderr ?? "").trim() || "pm2 jlist failed", result.status ?? 1);
  }

  try {
    const cleaned = stripAnsi(result.stdout ?? "");
    const startIndex = cleaned.indexOf("[");
    const endIndex = cleaned.lastIndexOf("]");
    if (startIndex < 0 || endIndex < startIndex) {
      fail("Failed to locate JSON payload in pm2 jlist output");
    }
    const parsed = JSON.parse(cleaned.slice(startIndex, endIndex + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    fail(`Failed to parse pm2 jlist output: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function getPm2StatusEntries(appNames) {
  if (appNames.length === 0) {
    return [];
  }

  const list = readPm2ProcessList();
  const byName = new Map(
    list
      .filter((entry) => entry && typeof entry === "object" && typeof entry.name === "string")
      .map((entry) => [entry.name, entry])
  );

  return appNames.map((name) => {
    const entry = byName.get(name);
    const status = typeof entry?.pm2_env?.status === "string" ? entry.pm2_env.status : "missing";
    return {
      name,
      status,
      pid: typeof entry?.pid === "number" ? entry.pid : null,
      pm2Id: typeof entry?.pm_id === "number" ? entry.pm_id : null
    };
  });
}

function isPm2AppActive(entry) {
  return !NON_CONFLICTING_PM2_STATUSES.has(entry.status);
}

function printPm2Status(entries) {
  if (entries.length === 0) {
    console.log("Host PM2: <none>");
    return;
  }

  console.log("Host PM2:");
  for (const entry of entries) {
    const details = [entry.status];
    if (typeof entry.pm2Id === "number") {
      details.push(`pm2:${entry.pm2Id}`);
    }
    if (typeof entry.pid === "number" && entry.pid > 0) {
      details.push(`pid:${entry.pid}`);
    }
    console.log(`  - ${entry.name}: ${details.join(", ")}`);
  }
}

function runPm2Command(args) {
  console.error(`[docker-stack] pm2 -> ${formatCommand("pm2", args)}`);
  const result = runCommand("pm2", args, { stdio: "inherit", encoding: undefined });
  return result.status ?? 1;
}

function stopHostPm2Apps(stack) {
  const entries = getPm2StatusEntries(stack.hostPm2Apps);
  const active = entries.filter(isPm2AppActive).map((entry) => entry.name);
  if (active.length === 0) {
    console.error(`[docker-stack] no active host PM2 apps to stop for ${stack.name}`);
    return 0;
  }

  return runPm2Command(["stop", ...active]);
}

function startHostPm2Apps(stack) {
  if (stack.hostPm2Apps.length === 0) {
    console.error(`[docker-stack] no host PM2 apps registered for ${stack.name}`);
    return 0;
  }

  const entries = getPm2StatusEntries(stack.hostPm2Apps);
  const resumable = entries
    .filter((entry) => entry.status === "stopped" || entry.status === "errored")
    .map((entry) => entry.name);
  const missing = entries.filter((entry) => entry.status === "missing").map((entry) => entry.name);
  let exitCode = 0;

  if (resumable.length > 0) {
    exitCode = runPm2Command(["start", ...resumable]);
    if (exitCode !== 0) {
      return exitCode;
    }
  }

  if (missing.length > 0) {
    if (!existsSync(HOST_PM2_ECOSYSTEM_PATH)) {
      fail(`PM2 ecosystem config not found: ${relative(ROOT, HOST_PM2_ECOSYSTEM_PATH)}`);
    }
    exitCode = runPm2Command(["start", HOST_PM2_ECOSYSTEM_PATH, "--only", missing.join(",")]);
    if (exitCode !== 0) {
      return exitCode;
    }
  }

  if (resumable.length === 0 && missing.length === 0) {
    console.error(`[docker-stack] host PM2 apps already active for ${stack.name}`);
  }

  return 0;
}

function buildComposeArgs(stack, command, composeArgs) {
  const baseArgs = COMPOSE_COMMANDS[command];
  if (!baseArgs) {
    fail(`Unsupported docker stack command: ${command}`);
  }

  const dockerArgs = ["compose"];
  if (stack.projectName) {
    dockerArgs.push("--project-name", stack.projectName);
  }

  for (const file of stack.filesAbs) {
    dockerArgs.push("-f", file);
  }

  dockerArgs.push(...baseArgs, ...stripDoubleDash(composeArgs));
  return dockerArgs;
}

function runComposeCommand(stack, command, composeArgs) {
  const dockerArgs = buildComposeArgs(stack, command, composeArgs);
  console.error(`[docker-stack] ${stack.name} (${stack.cwd}) -> docker ${formatCommand("", dockerArgs).trim()}`);
  const result = runCommand("docker", dockerArgs, {
    cwd: stack.cwdAbs,
    stdio: "inherit",
    encoding: undefined
  });
  return result.status ?? 1;
}

function ensureNoPm2Conflict(stack, command) {
  if (!GUARDED_COMPOSE_COMMANDS.has(command) || stack.hostPm2Apps.length === 0) {
    return;
  }

  const active = getPm2StatusEntries(stack.hostPm2Apps).filter(isPm2AppActive);
  if (active.length === 0) {
    return;
  }

  fail(
    [
      `Refusing to run docker:${command} for ${stack.name} while related host PM2 apps are active:`,
      ...active.map((entry) => `- ${entry.name}: ${entry.status}`),
      "",
      `Use \`pnpm docker:stack use-container ${stack.name}\` to stop the host PM2 side and start the container stack.`,
      `Use \`pnpm docker:stack status ${stack.name}\` to inspect both sides.`
    ].join("\n")
  );
}

function runStatus(stack) {
  console.log(`Stack: ${stack.name}`);
  console.log(`Path: ${stack.cwd}`);
  printPm2Status(getPm2StatusEntries(stack.hostPm2Apps));
  console.log("Docker Compose:");
  return runComposeCommand(stack, "ps", []);
}

function useContainer(stack, composeArgs) {
  const activeBefore = getPm2StatusEntries(stack.hostPm2Apps).filter(isPm2AppActive);
  if (activeBefore.length > 0) {
    console.error(`[docker-stack] stopping host PM2 apps for ${stack.name}: ${activeBefore.map((entry) => entry.name).join(", ")}`);
    const stopStatus = runPm2Command(["stop", ...activeBefore.map((entry) => entry.name)]);
    if (stopStatus !== 0) {
      return stopStatus;
    }
  }

  const upStatus = runComposeCommand(stack, "up", composeArgs);
  if (upStatus !== 0 && activeBefore.length > 0) {
    console.error(`[docker-stack] docker up failed; restoring host PM2 apps for ${stack.name}`);
    runPm2Command(["start", ...activeBefore.map((entry) => entry.name)]);
  }

  return upStatus;
}

function useHost(stack, composeArgs) {
  const downStatus = runComposeCommand(stack, "down", composeArgs);
  if (downStatus !== 0) {
    return downStatus;
  }

  return startHostPm2Apps(stack);
}

const stacks = readRegistry();
const stackIndex = buildStackIndex(stacks);
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "help" || args[0] === "--help" || args[0] === "-h") {
  console.log(usage());
  process.exit(0);
}

const [command, ...rest] = args;

if (command === "list") {
  const jsonMode = stripDoubleDash(rest).includes("--json");
  const uniqueStacks = Array.from(new Map(stacks.map((stack) => [stack.name, stack])).values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  if (jsonMode) {
    console.log(
      JSON.stringify(
        uniqueStacks.map((stack) => ({
          name: stack.name,
          aliases: stack.aliases,
          cwd: stack.cwd,
          files: stack.files,
          projectName: stack.projectName,
          hostPm2Apps: stack.hostPm2Apps,
          description: stack.description
        })),
        null,
        2
      )
    );
  } else {
    printTable(uniqueStacks);
  }
  process.exit(0);
}

if (command === "show") {
  const [stackName, ...showArgs] = rest;
  if (!stackName) {
    fail(`Missing stack name.\n\n${usage()}`);
  }
  const stack = resolveStack(stackName, stackIndex);
  printStack(stack, stripDoubleDash(showArgs).includes("--json"));
  process.exit(0);
}

if (command === "status") {
  const [stackName] = rest;
  if (!stackName) {
    fail(`Missing stack name.\n\n${usage()}`);
  }
  process.exit(runStatus(resolveStack(stackName, stackIndex)));
}

if (command === "host:status") {
  const [stackName] = rest;
  if (!stackName) {
    fail(`Missing stack name.\n\n${usage()}`);
  }
  printPm2Status(getPm2StatusEntries(resolveStack(stackName, stackIndex).hostPm2Apps));
  process.exit(0);
}

if (command === "host:start") {
  const [stackName] = rest;
  if (!stackName) {
    fail(`Missing stack name.\n\n${usage()}`);
  }
  process.exit(startHostPm2Apps(resolveStack(stackName, stackIndex)));
}

if (command === "host:stop") {
  const [stackName] = rest;
  if (!stackName) {
    fail(`Missing stack name.\n\n${usage()}`);
  }
  process.exit(stopHostPm2Apps(resolveStack(stackName, stackIndex)));
}

if (command === "use-container") {
  const [stackName, ...composeArgs] = rest;
  if (!stackName) {
    fail(`Missing stack name.\n\n${usage()}`);
  }
  process.exit(useContainer(resolveStack(stackName, stackIndex), composeArgs));
}

if (command === "use-host") {
  const [stackName, ...composeArgs] = rest;
  if (!stackName) {
    fail(`Missing stack name.\n\n${usage()}`);
  }
  process.exit(useHost(resolveStack(stackName, stackIndex), composeArgs));
}

if (!(command in COMPOSE_COMMANDS)) {
  fail(`Unknown command: ${command}\n\n${usage()}`);
}

const [stackName, ...composeArgs] = rest;
if (!stackName) {
  fail(`Missing stack name for command ${command}.\n\n${usage()}`);
}

const stack = resolveStack(stackName, stackIndex);
ensureNoPm2Conflict(stack, command);
process.exit(runComposeCommand(stack, command, composeArgs));

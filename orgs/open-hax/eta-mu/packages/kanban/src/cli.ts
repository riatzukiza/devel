#!/usr/bin/env node

import path from "node:path";

import { buildBoardSnapshot, writeBoardSnapshot } from "./board.js";
import { loadConfig, loadEnvironment, resolveConfigPathValue, resolveConfiguredProjects } from "./config.js";
import { startKanbanServer } from "./server.js";
import { GitHubClient, inferGitHubRepo, syncTasksToGitHub } from "./github-sync.js";
import { syncTasksToTrello } from "./sync.js";
import { loadTasks } from "./tasks.js";
import { TrelloClient } from "./trello-client.js";

type FlagValue = boolean | string;

interface ParsedCli {
  command?: string;
  subcommand?: string;
  flags: Record<string, FlagValue>;
}

const showHelp = (): void => {
  console.log(`OpenHax Kanban

USAGE
  openhax-kanban board snapshot [--tasks-dir <path>] [--out <path>] [--config <path>]
  openhax-kanban sync trello [--tasks-dir <path>] [--board-url <url>] [--board-id <id>] [--dry-run] [--archive-missing] [--config <path>]
  openhax-kanban sync github [--tasks-dir <path>] [--repo <owner/repo>] [--dry-run] [--write-delay-ms <ms>] [--max-writes <n>] [--no-close-done] [--no-close-rejected] [--no-manage-labels] [--config <path>]
  openhax-kanban serve [--tasks-dir <path>] [--host <host>] [--port <port>] [--config <path>]

MULTI-PROJECT CONFIG
  Add a projects array to openhax.kanban.json and run serve with --config:

  {
    "defaultProject": "knoxx",
    "projects": [
      { "id": "knoxx", "title": "Knoxx", "tasksDir": "../../orgs/open-hax/openplanner/packages/agents/knoxx/kanban" }
    ]
  }

FLAGS
  --config <path>         Path to openhax.kanban.json
  --tasks-dir <path>      Markdown task directory (defaults to docs/agile/tasks or config)
  --out <path>            Output path for board snapshot JSON
  --board-url <url>       Trello board URL
  --board-id <id>         Trello board short id or id
  --dry-run               Print sync plan without mutating Trello
  --archive-missing       Archive Trello cards with known UUIDs that are missing locally
  --repo <owner/repo>      GitHub repository target for sync github
  --no-close-done         Keep done tasks open during GitHub sync
  --no-close-rejected     Keep rejected tasks open during GitHub sync
  --no-manage-labels      Do not create missing GitHub labels
  --write-delay-ms <ms>   Delay between GitHub writes to avoid secondary rate limits
  --max-writes <n>        Stop after applying this many GitHub write operations
  --host <host>           Host to bind the local web UI (default: 127.0.0.1)
  --port <port>           Port to bind the local web UI (default: 8787)
  --help                  Show this help
`);
};

const parseArgs = (argv: string[]): ParsedCli => {
  const [command, maybeSubcommand, ...tail] = argv;

  const hasSubcommand = typeof maybeSubcommand === "string" && maybeSubcommand.length > 0 && !maybeSubcommand.startsWith("--");
  const subcommand = hasSubcommand ? maybeSubcommand : undefined;
  const rest = hasSubcommand ? tail : [maybeSubcommand, ...tail].filter((value): value is string => typeof value === "string");

  const flags: Record<string, FlagValue> = {};

  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];
    if (!argument?.startsWith("--")) {
      continue;
    }

    const key = argument.slice(2);
    const next = rest[index + 1];
    if (!next || next.startsWith("--")) {
      flags[key] = true;
      continue;
    }

    flags[key] = next;
    index += 1;
  }

  return { command, subcommand, flags };
};

const readStringFlag = (flags: Record<string, FlagValue>, name: string): string | undefined => {
  const value = flags[name];
  return typeof value === "string" ? value : undefined;
};

const readNumberFlag = (flags: Record<string, FlagValue>, name: string): number | undefined => {
  const value = readStringFlag(flags, name);
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const resolveTasksDir = (flagValue: string | undefined, configDir: string, configValue?: string): string => {
  const resolvedFromFlag = flagValue ? path.resolve(process.cwd(), flagValue) : undefined;
  const resolvedFromConfig = resolveConfigPathValue(configValue, configDir);

  return resolvedFromFlag ?? resolvedFromConfig ?? path.resolve(process.cwd(), "docs/agile/tasks");
};

const printSyncPlan = (result: Awaited<ReturnType<typeof syncTasksToTrello>>, dryRun: boolean): void => {
  console.log(`${dryRun ? "Dry-run" : "Live"} sync for ${result.board.name}`);
  console.log(`Board: ${result.board.url}`);
  console.log(`Operations: ${result.plan.operations.length}`);
  console.log(`- Create lists: ${result.plan.summary.createLists}`);
  console.log(`- Create labels: ${result.plan.summary.createLabels}`);
  console.log(`- Create cards: ${result.plan.summary.createCards}`);
  console.log(`- Update cards: ${result.plan.summary.updateCards}`);
  console.log(`- Archive cards: ${result.plan.summary.archiveCards}`);

  result.plan.operations.forEach((operation) => {
    switch (operation.type) {
      case "createList":
        console.log(`  + list ${operation.listName}`);
        break;
      case "createLabel":
        console.log(`  + label ${operation.labelName}`);
        break;
      case "createCard":
        console.log(`  + card ${operation.task.title} -> ${operation.listName}`);
        break;
      case "updateCard":
        console.log(`  ~ card ${operation.task.title} -> ${operation.listName}`);
        break;
      case "archiveCard":
        console.log(`  - archive ${operation.cardName}`);
        break;
    }
  });
};

const printGitHubSyncPlan = (result: Awaited<ReturnType<typeof syncTasksToGitHub>>, dryRun: boolean): void => {
  console.log(`${dryRun ? "Dry-run" : "Live"} GitHub issue sync for ${result.repo}`);
  console.log(`Operations: ${result.plan.operations.length}`);
  console.log(`- Create labels: ${result.plan.summary.createLabels}`);
  console.log(`- Create issues: ${result.plan.summary.createIssues}`);
  console.log(`- Update issues: ${result.plan.summary.updateIssues}`);
  console.log(`- Skip done/rejected tasks without existing issues: ${result.plan.summary.skippedClosedTasks}`);
  if (!dryRun) {
    console.log(`- Applied operations: ${result.appliedOperations.length}`);
  }

  result.plan.operations.forEach((operation) => {
    switch (operation.type) {
      case "createLabel":
        console.log(`  + label ${operation.label.name}`);
        break;
      case "createIssue":
        console.log(`  + issue ${operation.task.title}`);
        break;
      case "updateIssue":
        console.log(`  ~ issue #${operation.issueNumber} ${operation.task.title} -> ${operation.state}`);
        break;
    }
  });
};

const main = async (): Promise<void> => {
  loadEnvironment();

  const parsedCli = parseArgs(process.argv.slice(2));
  if (!parsedCli.command || parsedCli.flags.help) {
    showHelp();
    return;
  }

  const loadedConfig = await loadConfig(readStringFlag(parsedCli.flags, "config"));
  const tasksDir = resolveTasksDir(
    readStringFlag(parsedCli.flags, "tasks-dir"),
    loadedConfig.configDir,
    loadedConfig.config.tasksDir
  );

  if (parsedCli.command === "board" && parsedCli.subcommand === "snapshot") {
    const tasks = await loadTasks(tasksDir);
    const snapshot = buildBoardSnapshot(tasks);
    const outputPath =
      readStringFlag(parsedCli.flags, "out") ??
      resolveConfigPathValue(loadedConfig.config.boardFile, loadedConfig.configDir);

    if (outputPath) {
      await writeBoardSnapshot(snapshot, path.resolve(process.cwd(), outputPath));
      console.log(`Wrote board snapshot to ${path.resolve(process.cwd(), outputPath)}`);
      return;
    }

    console.log(JSON.stringify(snapshot, null, 2));
    return;
  }

  if (parsedCli.command === "sync" && parsedCli.subcommand === "trello") {
    const tasks = await loadTasks(tasksDir);
    const apiKey = process.env.TRELLO_API_KEY;
    const apiToken = process.env.TRELLO_API_TOKEN;
    if (!apiKey || !apiToken) {
      throw new Error("Missing TRELLO_API_KEY or TRELLO_API_TOKEN.");
    }

    const boardIdOrUrl =
      readStringFlag(parsedCli.flags, "board-url") ??
      readStringFlag(parsedCli.flags, "board-id") ??
      loadedConfig.config.trello?.boardUrl ??
      loadedConfig.config.trello?.boardId;

    if (!boardIdOrUrl) {
      throw new Error("Missing Trello board target. Pass --board-url, --board-id, or set trello.boardUrl in config.");
    }

    const client = new TrelloClient({ apiKey, apiToken });
    const dryRun = parsedCli.flags["dry-run"] === true;
    const archiveMissing =
      parsedCli.flags["archive-missing"] === true || loadedConfig.config.trello?.archiveMissing === true;

    const result = await syncTasksToTrello(client, tasks, {
      boardIdOrUrl,
      dryRun,
      archiveMissing,
      listMapping: loadedConfig.config.trello?.listMapping
    });

    printSyncPlan(result, dryRun);
    return;
  }

  if (parsedCli.command === "sync" && parsedCli.subcommand === "github") {
    const tasks = await loadTasks(tasksDir);
    const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
    if (!token) {
      throw new Error("Missing GITHUB_TOKEN or GH_TOKEN.");
    }

    const repo =
      readStringFlag(parsedCli.flags, "repo") ??
      loadedConfig.config.github?.repo ??
      inferGitHubRepo(tasksDir);

    if (!repo) {
      throw new Error("Missing GitHub repo target. Pass --repo, set github.repo in config, or run inside a GitHub-backed repository.");
    }

    const dryRun = parsedCli.flags["dry-run"] === true;
    const client = new GitHubClient({ token });
    const result = await syncTasksToGitHub(client, tasks, {
      repo,
      dryRun,
      cwd: process.cwd(),
      closeDone: parsedCli.flags["no-close-done"] === true ? false : loadedConfig.config.github?.closeDone,
      closeRejected: parsedCli.flags["no-close-rejected"] === true ? false : loadedConfig.config.github?.closeRejected,
      manageLabels: parsedCli.flags["no-manage-labels"] === true ? false : loadedConfig.config.github?.manageLabels,
      writeDelayMs: readNumberFlag(parsedCli.flags, "write-delay-ms"),
      maxWrites: readNumberFlag(parsedCli.flags, "max-writes")
    });

    printGitHubSyncPlan(result, dryRun);
    return;
  }

  if (parsedCli.command === "serve") {
    const host = readStringFlag(parsedCli.flags, "host") ?? "127.0.0.1";
    const port = readNumberFlag(parsedCli.flags, "port") ?? 8787;
    const projectState = resolveConfiguredProjects(loadedConfig, readStringFlag(parsedCli.flags, "tasks-dir"));

    await startKanbanServer({
      projects: projectState.projects,
      defaultProjectId: projectState.defaultProjectId,
      host,
      port
    });
    return;
  }

  showHelp();
  throw new Error("Unknown command.");
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

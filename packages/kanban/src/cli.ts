#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildBoardSnapshot, writeBoardSnapshot } from "./board.js";
import { loadConfig, loadEnvironment, resolveConfigPathValue } from "./config.js";
import { renderKanbanFsm } from "./fsm.js";
import { applyRefinedLabels } from "./github-apply.js";
import { makeGitHubIssueClient } from "./github.js";
import { refineGitHubSweep, renderGitHubRefinementReport } from "./github-triage.js";
import { startKanbanServer } from "./server.js";
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
  openhax-kanban github refine --snapshot <path> [--out <path>] [--report <path>] [--exclude-repo <owner/name[,owner/name...]>]
  openhax-kanban github apply --refinement <path> --repo <owner/name> [--state <state[,state...]>] [--kind <issue|pr[,issue|pr...]>] [--numbers <n[,n...]>] [--dry-run]
  openhax-kanban fsm show
  openhax-kanban serve [--tasks-dir <path>] [--host <host>] [--port <port>] [--config <path>]

FLAGS
  --config <path>         Path to openhax.kanban.json
  --tasks-dir <path>      Markdown task directory (defaults to docs/agile/tasks or config)
  --out <path>            Output path for board snapshot JSON
  --snapshot <path>       GitHub sweep JSON snapshot to refine
  --refinement <path>     Refined GitHub JSON snapshot to apply
  --repo <owner/name>     Canonical repo slug to target for github apply
  --state <list>          Comma-separated canonical FSM states to filter during github apply
  --kind <list>           Comma-separated kinds (issue,pr) to filter during github apply
  --numbers <list>        Comma-separated issue/PR numbers to filter during github apply
  --report <path>         Markdown report output for github refine
  --exclude-repo <list>   Comma-separated owner/repo values to exclude from github refine
  --board-url <url>       Trello board URL
  --board-id <id>         Trello board short id or id
  --dry-run               Print sync plan without mutating Trello
  --archive-missing       Archive Trello cards with known UUIDs that are missing locally
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

const readStringListFlag = (flags: Record<string, FlagValue>, name: string): string[] => {
  const value = readStringFlag(flags, name);
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const readNumberListFlag = (flags: Record<string, FlagValue>, name: string): number[] =>
  readStringListFlag(flags, name)
    .map((entry) => Number(entry))
    .filter((value) => Number.isFinite(value));

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

const main = async (): Promise<void> => {
  loadEnvironment();

  const parsedCli = parseArgs(process.argv.slice(2));
  if (!parsedCli.command || parsedCli.flags.help) {
    showHelp();
    return;
  }

  if (parsedCli.command === "fsm" && parsedCli.subcommand === "show") {
    process.stdout.write(renderKanbanFsm());
    return;
  }

  if (parsedCli.command === "github" && parsedCli.subcommand === "refine") {
    const snapshotPath = readStringFlag(parsedCli.flags, "snapshot");
    if (!snapshotPath) {
      throw new Error("Missing --snapshot for github refine.");
    }

    const raw = await readFile(path.resolve(process.cwd(), snapshotPath), "utf8");
    const refined = refineGitHubSweep(JSON.parse(raw), {
      excludeRepos: readStringListFlag(parsedCli.flags, "exclude-repo")
    });

    const outputPath = readStringFlag(parsedCli.flags, "out");
    const reportPath = readStringFlag(parsedCli.flags, "report");
    const refinedJson = JSON.stringify(refined, null, 2) + "\n";
    const refinedReport = renderGitHubRefinementReport(refined);

    if (outputPath) {
      const resolvedOutputPath = path.resolve(process.cwd(), outputPath);
      await mkdir(path.dirname(resolvedOutputPath), { recursive: true });
      await writeFile(resolvedOutputPath, refinedJson, "utf8");
      console.log(`Wrote refinement snapshot to ${resolvedOutputPath}`);
    } else {
      process.stdout.write(refinedJson);
    }

    if (reportPath) {
      const resolvedReportPath = path.resolve(process.cwd(), reportPath);
      await mkdir(path.dirname(resolvedReportPath), { recursive: true });
      await writeFile(resolvedReportPath, refinedReport, "utf8");
      console.log(`Wrote refinement report to ${resolvedReportPath}`);
    }

    return;
  }

  if (parsedCli.command === "github" && parsedCli.subcommand === "apply") {
    const refinementPath = readStringFlag(parsedCli.flags, "refinement");
    const repo = readStringFlag(parsedCli.flags, "repo");
    if (!refinementPath || !repo) {
      throw new Error("Missing --refinement or --repo for github apply.");
    }

    const raw = await readFile(path.resolve(process.cwd(), refinementPath), "utf8");
    const refinement = JSON.parse(raw);
    const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
    const dryRun = parsedCli.flags["dry-run"] === true;

    if (!dryRun && !token) {
      throw new Error("github apply requires GITHUB_TOKEN or GH_TOKEN unless --dry-run is set.");
    }

    const result = await applyRefinedLabels(makeGitHubIssueClient, refinement, {
      token,
      repo,
      states: readStringListFlag(parsedCli.flags, "state"),
      kinds: readStringListFlag(parsedCli.flags, "kind") as Array<"issue" | "pr">,
      numbers: readNumberListFlag(parsedCli.flags, "numbers"),
      dryRun
    });

    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const loadedConfig = await loadConfig(readStringFlag(parsedCli.flags, "config"));
  const tasksDir = resolveTasksDir(
    readStringFlag(parsedCli.flags, "tasks-dir"),
    loadedConfig.configDir,
    loadedConfig.config.tasksDir
  );
  const tasks = await loadTasks(tasksDir);

  if (parsedCli.command === "board" && parsedCli.subcommand === "snapshot") {
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

  if (parsedCli.command === "serve") {
    const host = readStringFlag(parsedCli.flags, "host") ?? "127.0.0.1";
    const port = readNumberFlag(parsedCli.flags, "port") ?? 8787;

    await startKanbanServer({
      tasksDir,
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

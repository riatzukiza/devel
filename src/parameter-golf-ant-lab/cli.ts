import process from "node:process";
import { generateSuggestionBatch, createInitialState, recordEvaluation, summarizeState } from "./aco";
import { readConfig, readState, resolveLabPaths, writeConfig, writeRootReadme, writeState, writeSuggestionBatch } from "./io";
import { getProfile, listProfiles } from "./profiles";

interface ParsedArgs {
  readonly command: string;
  readonly labDir: string;
  readonly profile: string;
  readonly count: number;
  readonly candidateId: string | null;
  readonly metricsJson: string | null;
  readonly metricsFile: string | null;
}

const parseArgs = (argv: readonly string[]): ParsedArgs => {
  const command = argv[0] ?? "";
  let labDir = "labs/parameter-golf-ant-lab";
  let profile = "board";
  let count = 0;
  let candidateId: string | null = null;
  let metricsJson: string | null = null;
  let metricsFile: string | null = null;

  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--lab-dir") {
      labDir = argv[index + 1] ?? labDir;
      index += 1;
      continue;
    }
    if (token === "--profile") {
      profile = argv[index + 1] ?? profile;
      index += 1;
      continue;
    }
    if (token === "--count") {
      count = Number(argv[index + 1] ?? count);
      index += 1;
      continue;
    }
    if (token === "--candidate-id") {
      candidateId = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (token === "--metrics-json") {
      metricsJson = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (token === "--metrics-file") {
      metricsFile = argv[index + 1] ?? null;
      index += 1;
    }
  }

  return { command, labDir, profile, count, candidateId, metricsJson, metricsFile };
};

const usage = (): never => {
  throw new Error([
    "Usage:",
    "  tsx src/parameter-golf-ant-lab/cli.ts init [--lab-dir dir] [--profile board|presence|all]",
    "  tsx src/parameter-golf-ant-lab/cli.ts step [--lab-dir dir] --profile board|presence [--count N]",
    "  tsx src/parameter-golf-ant-lab/cli.ts record [--lab-dir dir] --profile board|presence --candidate-id <id> (--metrics-json '{...}' | --metrics-file path)",
    "  tsx src/parameter-golf-ant-lab/cli.ts status [--lab-dir dir] --profile board|presence",
    "  tsx src/parameter-golf-ant-lab/cli.ts profiles"
  ].join("\n"));
};

const initProfile = async (labDir: string, profileId: string): Promise<Readonly<Record<string, string>>> => {
  const profile = getProfile(profileId);
  const paths = resolveLabPaths(labDir, profile.profileId);
  await writeConfig(paths, profile);
  await writeState(paths, createInitialState(profile));
  return { profileId: profile.profileId, configPath: paths.configPath, statePath: paths.statePath };
};

const readMetrics = async (metricsJson: string | null, metricsFile: string | null): Promise<Readonly<Record<string, number>>> => {
  if (metricsJson) {
    return JSON.parse(metricsJson) as Readonly<Record<string, number>>;
  }
  if (metricsFile) {
    const raw = await import("node:fs/promises").then(({ readFile }) => readFile(metricsFile, "utf8"));
    return JSON.parse(raw) as Readonly<Record<string, number>>;
  }
  throw new Error("record requires --metrics-json or --metrics-file");
};

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv.slice(2));
  if (args.command.length === 0) {
    usage();
  }

  if (args.command === "profiles") {
    process.stdout.write(`${JSON.stringify({ profiles: listProfiles().map((profile) => profile.profileId) }, null, 2)}\n`);
    return;
  }

  if (args.command === "init") {
    await writeRootReadme(args.labDir);
    const profileIds = args.profile === "all" ? listProfiles().map((profile) => profile.profileId) : [args.profile];
    const initialized = await Promise.all(profileIds.map((profileId) => initProfile(args.labDir, profileId)));
    process.stdout.write(`${JSON.stringify({ labDir: args.labDir, initialized }, null, 2)}\n`);
    return;
  }

  if (args.profile === "all") {
    throw new Error(`Command ${args.command} requires a concrete profile, not --profile all`);
  }

  const paths = resolveLabPaths(args.labDir, args.profile);
  const profile = await readConfig(paths);
  const state = await readState(paths);

  if (args.command === "step") {
    const count = args.count > 0 ? args.count : profile.antsPerStep;
    const generatedAt = new Date().toISOString();
    const { batch, nextState } = generateSuggestionBatch(profile, state, count, generatedAt);
    const written = await writeSuggestionBatch(paths, batch);
    await writeState(paths, nextState);
    process.stdout.write(`${JSON.stringify({ profileId: profile.profileId, step: batch.step, count, ...written }, null, 2)}\n`);
    return;
  }

  if (args.command === "record") {
    if (!args.candidateId) {
      throw new Error("record requires --candidate-id");
    }
    const metrics = await readMetrics(args.metricsJson, args.metricsFile);
    const nextState = recordEvaluation(profile, state, args.candidateId, metrics, new Date().toISOString());
    await writeState(paths, nextState);
    process.stdout.write(`${JSON.stringify(summarizeState(nextState), null, 2)}\n`);
    return;
  }

  if (args.command === "status") {
    process.stdout.write(`${JSON.stringify(summarizeState(state), null, 2)}\n`);
    return;
  }

  usage();
};

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});

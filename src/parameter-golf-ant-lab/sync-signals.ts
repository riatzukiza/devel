import { promises as fs } from "node:fs";
import path from "node:path";
import { readConfig, resolveLabPaths, writeConfig } from "./io";
import type { LabProfile, StrategySeed } from "./types";

interface ParsedArgs {
  readonly labDir: string;
  readonly profile: string;
  readonly maxSubmissions: number;
}

interface DashboardSubmission {
  readonly status?: string;
  readonly source?: string;
  readonly category?: string;
  readonly submission?: {
    readonly name?: string;
    readonly blurb?: string;
  };
  readonly pr?: {
    readonly title?: string;
  };
  readonly metrics?: {
    readonly valBpb?: number;
  };
}

interface DashboardPayload {
  readonly submissions: readonly DashboardSubmission[];
}

interface LocalProxySummary {
  readonly runs: ReadonlyArray<{
    readonly strategy: string;
    readonly val_bpb: number;
  }>;
}

const motifPatterns: Readonly<Record<string, readonly RegExp[]>> = {
  quantization: [/\bint6\b/i, /\bqat\b/i, /\bbitnet\b/i, /quant/i, /fp16 embed/i],
  sliding_window: [/sliding window/i, /sliding eval/i, /doc-isolated sliding/i],
  optimizer: [/muon/i, /normuon/i, /swa/i, /warmdown/i, /wd ?[0-9]/i],
  mlp_heavy: [/mlp ?3x/i, /mlp 1344/i, /swiglu/i],
  recurrence: [/recurrence/i, /sharing/i, /shared/i, /looped/i],
  long_context: [/seq2048/i, /seq4096/i, /contextfuse/i, /4096 vocab/i],
  smaller_batch: [/smaller batch/i, /throughput/i, /systematic search/i],
  kv_structure: [/\bkv\b/i, /gqa/i],
  ttt: [/test-time training/i, /\bttt\b/i],
  vocab: [/vocab/i, /bigramhash/i]
};

const strategyMotifWeights: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  "baseline-anchor": {},
  "wide-balance": { optimizer: 0.08, long_context: 0.06 },
  "deep-narrow": { recurrence: 0.22, long_context: 0.08 },
  "kv-thin": { kv_structure: 0.26, smaller_batch: 0.08 },
  "kv-fat": { kv_structure: 0.15 },
  "mlp-heavy": { mlp_heavy: 0.30, quantization: 0.05 },
  "long-context-budget": { long_context: 0.24, sliding_window: 0.20 },
  "throughput-push": { smaller_batch: 0.20, optimizer: 0.18, sliding_window: 0.08 },
  "byte-cautious": { quantization: 0.22 },
  "capacity-stress": { recurrence: 0.10, mlp_heavy: 0.10, long_context: 0.08 }
};

const parseArgs = (argv: readonly string[]): ParsedArgs => {
  let labDir = "labs/parameter-golf-ant-lab";
  let profile = "board";
  let maxSubmissions = 40;
  for (let index = 0; index < argv.length; index += 1) {
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
    if (token === "--max-submissions") {
      maxSubmissions = Number(argv[index + 1] ?? maxSubmissions);
      index += 1;
    }
  }
  return { labDir, profile, maxSubmissions };
};

const detectMotifs = (text: string): readonly string[] => Object.entries(motifPatterns)
  .filter(([, patterns]) => patterns.some((pattern) => pattern.test(text)))
  .map(([name]) => name);

const fetchDashboardPayload = async (): Promise<DashboardPayload> => {
  const versionResponse = await fetch("https://parameter-golf.github.io/data/version.json", { cache: "no-store" });
  const versionPayload = await versionResponse.json() as { readonly version?: string };
  const version = typeof versionPayload.version === "string" ? versionPayload.version : "";
  const submissionsUrl = `https://parameter-golf.github.io/data/submissions.json${version ? `?v=${encodeURIComponent(version)}` : ""}`;
  const payload = await fetch(submissionsUrl, { cache: "no-store" }).then((response) => response.json()) as DashboardPayload;
  return payload;
};

const computeMotifScores = (submissions: readonly DashboardSubmission[], maxSubmissions: number): Readonly<Record<string, number>> => {
  const filtered = submissions
    .filter((submission) => submission.category === "main-track" && submission.source === "pull_request" && typeof submission.metrics?.valBpb === "number")
    .sort((left, right) => (left.metrics?.valBpb ?? Number.POSITIVE_INFINITY) - (right.metrics?.valBpb ?? Number.POSITIVE_INFINITY))
    .slice(0, maxSubmissions);

  const raw: Record<string, number> = {};
  filtered.forEach((submission, index) => {
    const text = [submission.pr?.title ?? "", submission.submission?.name ?? "", submission.submission?.blurb ?? ""].join(" ");
    const motifs = detectMotifs(text);
    const weight = 1 / (index + 1);
    for (const motif of motifs) {
      raw[motif] = (raw[motif] ?? 0) + weight;
    }
  });

  const max = Math.max(...Object.values(raw), 1);
  return Object.fromEntries(Object.entries(raw).map(([name, value]) => [name, value / max]));
};

const readLocalBoosts = async (profileDir: string): Promise<ReadonlyMap<string, number>> => {
  const localBoosts = new Map<string, number>();
  const localSummaryPath = path.join(profileDir, "local-proxy-summary-2026-03-20.json");
  try {
    const payload = JSON.parse(await fs.readFile(localSummaryPath, "utf8")) as LocalProxySummary;
    const ranked = [...payload.runs].sort((left, right) => left.val_bpb - right.val_bpb);
    ranked.forEach((run, index) => {
      const boost = Math.max(0, 0.16 - index * 0.04);
      if (boost > 0) {
        localBoosts.set(run.strategy, boost);
      }
    });
  } catch {
    return localBoosts;
  }
  return localBoosts;
};

const applyStrategyBoosts = async (profileDir: string, profile: LabProfile, motifScores: Readonly<Record<string, number>>): Promise<LabProfile> => {
  const localBoosts = await readLocalBoosts(profileDir);
  const seedStrategies = profile.seedStrategies.map((strategy) => {
    const mapping = strategyMotifWeights[strategy.id] ?? {};
    const rawBoost = Object.entries(mapping).reduce((sum, [motif, weight]) => sum + weight * (motifScores[motif] ?? 0), 0);
    const localBoost = localBoosts.get(strategy.label) ?? 0;
    const boundedBoost = Math.min(0.25, rawBoost + localBoost);
    return {
      ...strategy,
      signalBoost: boundedBoost
    } satisfies StrategySeed;
  });
  return {
    ...profile,
    seedStrategies
  };
};

const writeSignalsReport = async (
  profileDir: string,
  motifScores: Readonly<Record<string, number>>,
  profile: LabProfile,
  maxSubmissions: number
): Promise<{ readonly jsonPath: string; readonly markdownPath: string }> => {
  const signalsDir = path.join(profileDir, "signals");
  await fs.mkdir(signalsDir, { recursive: true });
  const jsonPath = path.join(signalsDir, "latest.json");
  const markdownPath = path.join(signalsDir, "latest.md");
  const strategies = profile.seedStrategies
    .map((strategy) => ({
      id: strategy.id,
      label: strategy.label,
      priorBelief: strategy.priorBelief,
      signalBoost: strategy.signalBoost ?? 0,
      effectivePrior: Math.min(1, strategy.priorBelief + (strategy.signalBoost ?? 0)),
      riskLevel: strategy.riskLevel,
      tags: strategy.tags
    }))
    .sort((left, right) => right.effectivePrior - left.effectivePrior);

  const localBoosts = await readLocalBoosts(profileDir);
  await fs.writeFile(jsonPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), maxSubmissions, motifScores, localBoosts: Object.fromEntries(localBoosts.entries()), strategies }, null, 2)}\n`, "utf8");
  const lines = [
    `# ${profile.profileId} leaderboard signals`,
    "",
    `- generatedAt: ${new Date().toISOString()}`,
    `- source: unofficial dashboard + PR-backed submissions`,
    `- maxSubmissions: ${maxSubmissions}`,
    "",
    "## Top motifs",
    ""
  ];
  for (const [motif, score] of Object.entries(motifScores).sort((left, right) => right[1] - left[1])) {
    lines.push(`- ${motif}: ${score.toFixed(4)}`);
  }
  if (localBoosts.size > 0) {
    lines.push("", "## Local proxy boosts", "");
    for (const [label, boost] of [...localBoosts.entries()].sort((left, right) => right[1] - left[1])) {
      lines.push(`- ${label}: ${boost.toFixed(4)}`);
    }
  }
  lines.push("", "## Strategy boosts", "", "| Strategy | prior | signalBoost | effectivePrior | risk |", "|---|---:|---:|---:|---|" );
  for (const strategy of strategies) {
    lines.push(`| ${strategy.label} | ${strategy.priorBelief.toFixed(3)} | ${strategy.signalBoost.toFixed(3)} | ${strategy.effectivePrior.toFixed(3)} | ${strategy.riskLevel} |`);
  }
  lines.push("", "## Missing axes worth adding later", "", "- quantization recipe / int6-vs-int8", "- sliding-window eval mode", "- recurrence / cross-layer sharing", "- vocab size / tokenizer family", "- embedding precision");
  await fs.writeFile(markdownPath, `${lines.join("\n")}\n`, "utf8");
  return { jsonPath, markdownPath };
};

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv.slice(2));
  const paths = resolveLabPaths(args.labDir, args.profile);
  const profile = await readConfig(paths);
  const payload = await fetchDashboardPayload();
  const motifScores = computeMotifScores(payload.submissions, args.maxSubmissions);
  const boostedProfile = await applyStrategyBoosts(paths.profileDir, profile, motifScores);
  await writeConfig(paths, boostedProfile);
  const report = await writeSignalsReport(paths.profileDir, motifScores, boostedProfile, args.maxSubmissions);
  process.stdout.write(`${JSON.stringify({ profileId: boostedProfile.profileId, motifScores, report }, null, 2)}\n`);
};

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});

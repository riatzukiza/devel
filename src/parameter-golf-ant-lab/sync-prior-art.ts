import { promises as fs } from "node:fs";
import path from "node:path";
import { readConfig, resolveLabPaths, writeConfig, writeState } from "./io";
import { createInitialState } from "./aco";
import type { LabProfile, StrategySeed } from "./types";

interface ParsedArgs {
  readonly labDir: string;
  readonly profile: string;
  readonly maxGardenDocs: number;
  readonly maxLeaderboardSubmissions: number;
}

interface DashboardSubmission {
  readonly category?: string;
  readonly source?: string;
  readonly submission?: { readonly name?: string; readonly blurb?: string };
  readonly pr?: { readonly title?: string };
  readonly metrics?: { readonly valBpb?: number };
}

interface DashboardPayload {
  readonly submissions: readonly DashboardSubmission[];
}

interface GardenDoc {
  readonly path: string;
  readonly title: string;
  readonly tags: readonly string[];
  readonly excerpt: string;
}

interface ValueEvidence {
  readonly score: number;
  readonly hits: readonly string[];
}

const parseArgs = (argv: readonly string[]): ParsedArgs => {
  let labDir = "labs/parameter-golf-ant-lab";
  let profile = "frontier";
  let maxGardenDocs = 80;
  let maxLeaderboardSubmissions = 50;
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
    if (token === "--max-garden-docs") {
      maxGardenDocs = Number(argv[index + 1] ?? maxGardenDocs);
      index += 1;
      continue;
    }
    if (token === "--max-leaderboard-submissions") {
      maxLeaderboardSubmissions = Number(argv[index + 1] ?? maxLeaderboardSubmissions);
      index += 1;
    }
  }
  return { labDir, profile, maxGardenDocs, maxLeaderboardSubmissions };
};

const dimensionValuePatterns: Readonly<Record<string, Readonly<Record<string, readonly RegExp[]>>>> = {
  shared_depth: {
    none: [/baseline/i],
    "depth-recurrence": [/recurr/i, /shared depth/i, /recursive/i],
    "cross-layer-tying": [/layer tying/i, /cross-layer/i, /sharing/i],
    "phase-conditioned-sharing": [/phase/i, /role hints/i, /micro-specialization/i, /interface/i],
    "role-state-recurrence": [/role-state/i, /persistent role state/i, /role memory/i]
  },
  quantization_recipe: {
    "int8-row": [/int8/i, /row/i],
    "int6-qat": [/int6/i, /qat/i, /ste/i],
    "mixed-int6-fp16": [/fp16 embed/i, /mixed precision/i, /outlier/i],
    "bitnet-ternary": [/bitnet/i, /ternary/i, /b1\.58/i],
    "global-codebook": [/codebook/i, /codec bank/i, /cluster/i, /additive quant/i]
  },
  eval_strategy: {
    "standard-roundtrip": [/roundtrip/i],
    "sliding-window": [/sliding window/i, /sliding eval/i],
    "doc-isolated-sliding": [/doc-isolated/i],
    "iterative-refinement": [/refinement/i, /decompression/i, /iterative/i],
    ttt: [/test-time training/i, /\bttt\b/i]
  },
  vocab_strategy: {
    sp1024: [/sp-?1024/i, /1024 vocab/i],
    sp2048: [/2048/i],
    sp4096: [/4096/i],
    byte260: [/byte260/i, /byte tokenizer/i],
    bigramhash: [/bigramhash/i, /bigram hash/i]
  },
  optimizer_recipe: {
    muon: [/muon/i],
    normuon: [/normuon/i, /nor?muon/i],
    "muon-swa": [/swa/i],
    "muon-warmdown": [/warmdown/i],
    "adaptive-schedule": [/adaptive/i, /schedule/i, /search/i]
  },
  specialization: {
    none: [/baseline/i],
    "norm-only": [/rmsnorm/i, /extra rmsnorm/i, /normalization/i],
    "micro-gates": [/gate/i, /micro-specialization/i, /phase-conditioned/i],
    "lens-heads": [/lens/i, /head/i, /specialization/i],
    "persistent-role-state": [/role-state/i, /persistent role state/i, /role memory/i]
  },
  artifact_interface: {
    "plain-zlib": [/zlib/i],
    "outlier-protected": [/outlier/i, /protected precision/i, /fp16 embed/i],
    "codec-bank": [/codebook/i, /codec/i, /dictionary/i],
    "regenerated-head": [/regenerated head/i, /output head/i, /lm head/i],
    "artifact-native": [/artifact-native/i, /artifact dropout/i, /compilerized/i]
  }
};

const strategyValueWeights: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  "int6-sliding-mlp3x": {
    "quantization_recipe:int6-qat": 0.10,
    "eval_strategy:sliding-window": 0.10,
    "optimizer_recipe:normuon": 0.08,
    "artifact_interface:outlier-protected": 0.05
  },
  "shared-depth-rms-interface": {
    "shared_depth:phase-conditioned-sharing": 0.10,
    "specialization:micro-gates": 0.08,
    "specialization:norm-only": 0.08,
    "artifact_interface:outlier-protected": 0.05
  },
  "global-codebook-backbone": {
    "shared_depth:depth-recurrence": 0.09,
    "quantization_recipe:global-codebook": 0.10,
    "artifact_interface:codec-bank": 0.08
  },
  "tokenizer-head-swap": {
    "vocab_strategy:sp4096": 0.10,
    "artifact_interface:regenerated-head": 0.08,
    "eval_strategy:sliding-window": 0.05
  },
  "role-state-recurrence": {
    "shared_depth:role-state-recurrence": 0.10,
    "specialization:persistent-role-state": 0.10,
    "eval_strategy:iterative-refinement": 0.05,
    "artifact_interface:artifact-native": 0.05
  },
  "artifact-native-ttt": {
    "eval_strategy:ttt": 0.10,
    "artifact_interface:artifact-native": 0.08,
    "shared_depth:cross-layer-tying": 0.04
  }
};

const gardenPathHintWeights: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  "challenge-history/likely-strategy-families.md": {
    "shared_depth:depth-recurrence": 0.08,
    "quantization_recipe:int6-qat": 0.06,
    "vocab_strategy:sp4096": 0.04,
    "eval_strategy:iterative-refinement": 0.04
  },
  "frontiers/compression-interfaces-for-shared-depth.md": {
    "shared_depth:phase-conditioned-sharing": 0.10,
    "specialization:micro-gates": 0.08,
    "specialization:norm-only": 0.08
  },
  "ideas/global-codebook-recursive-backbone.md": {
    "quantization_recipe:global-codebook": 0.12,
    "artifact_interface:codec-bank": 0.10,
    "shared_depth:depth-recurrence": 0.06
  },
  "lanes/tokenizer-and-vocabulary.md": {
    "vocab_strategy:sp4096": 0.08,
    "artifact_interface:regenerated-head": 0.06
  },
  "moonshots/role-state-recurrence.md": {
    "shared_depth:role-state-recurrence": 0.12,
    "specialization:persistent-role-state": 0.12,
    "eval_strategy:iterative-refinement": 0.04
  }
};

const parseFrontmatter = (text: string): { readonly title: string; readonly tags: readonly string[]; readonly excerpt: string } => {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const body = match ? match[2] : text;
  const titleMatch = text.match(/^title:\s*(.+)$/m);
  const title = titleMatch ? titleMatch[1].replace(/^"|"$/g, "") : "Untitled";
  const tagMatches = [...text.matchAll(/^\s*-\s*(.+)$/gm)].map((entry) => entry[1].trim().replace(/^"|"$/g, ""));
  const excerpt = body.replace(/\[\[[^\]]+\]\]/g, " ").replace(/`/g, " ").slice(0, 600);
  return { title, tags: tagMatches, excerpt };
};

const fetchGardenDocs = async (maxDocs: number): Promise<readonly GardenDoc[]> => {
  const tree = await fetch("https://api.github.com/repos/agustif/parameter-golf-research-garden/git/trees/main?recursive=1").then((response) => response.json()) as { readonly tree?: ReadonlyArray<{ readonly path: string; readonly type: string }> };
  const selected = (tree.tree ?? [])
    .filter((entry) => entry.type === "blob" && entry.path.startsWith("content/") && entry.path.endsWith(".md"))
    .filter((entry) => /(challenge-history|frontiers|hypotheses|ideas|lanes|moonshots|notes)\//.test(entry.path))
    .slice(0, maxDocs);

  const docs: GardenDoc[] = [];
  for (const entry of selected) {
    const rawUrl = `https://raw.githubusercontent.com/agustif/parameter-golf-research-garden/main/${entry.path}`;
    const text = await fetch(rawUrl).then((response) => response.text());
    const parsed = parseFrontmatter(text);
    docs.push({
      path: entry.path.replace(/^content\//, ""),
      title: parsed.title,
      tags: parsed.tags,
      excerpt: parsed.excerpt
    });
  }
  return docs;
};

const fetchLeaderboardSubmissions = async (maxSubmissions: number): Promise<readonly DashboardSubmission[]> => {
  const versionPayload = await fetch("https://parameter-golf.github.io/data/version.json", { cache: "no-store" }).then((response) => response.json()) as { readonly version?: string };
  const version = typeof versionPayload.version === "string" ? versionPayload.version : "";
  const payload = await fetch(`https://parameter-golf.github.io/data/submissions.json${version ? `?v=${encodeURIComponent(version)}` : ""}`, { cache: "no-store" }).then((response) => response.json()) as DashboardPayload;
  return payload.submissions
    .filter((submission) => submission.category === "main-track" && submission.source === "pull_request")
    .sort((left, right) => (left.metrics?.valBpb ?? Number.POSITIVE_INFINITY) - (right.metrics?.valBpb ?? Number.POSITIVE_INFINITY))
    .slice(0, maxSubmissions);
};

const fetchAutoresearchHeadings = async (): Promise<readonly string[]> => {
  const html = await fetch("https://blog.skypilot.co/scaling-autoresearch/").then((response) => response.text());
  return [...html.matchAll(/<h[23].*?>(.*?)<\/h[23]>/gms)]
    .map((entry) => entry[1].replace(/<.*?>/g, "").trim())
    .filter((entry) => entry.length > 0);
};

const computeValueEvidence = async (maxGardenDocs: number, maxLeaderboardSubmissions: number): Promise<Readonly<Record<string, Readonly<Record<string, ValueEvidence>>>> > => {
  const [gardenDocs, leaderboardSubmissions, autoresearchHeadings] = await Promise.all([
    fetchGardenDocs(maxGardenDocs),
    fetchLeaderboardSubmissions(maxLeaderboardSubmissions),
    fetchAutoresearchHeadings()
  ]);

  const evidence: Record<string, Record<string, { score: number; hits: string[] }>> = {};
  for (const [dimensionName, values] of Object.entries(dimensionValuePatterns)) {
    evidence[dimensionName] = {};
    for (const [valueName] of Object.entries(values)) {
      evidence[dimensionName][valueName] = { score: 0, hits: [] };
    }
  }

  for (const doc of gardenDocs) {
    const combined = [doc.title, ...doc.tags, doc.excerpt].join(" ");
    for (const [dimensionName, values] of Object.entries(dimensionValuePatterns)) {
      for (const [valueName, patterns] of Object.entries(values)) {
        if (patterns.some((pattern) => pattern.test(combined))) {
          evidence[dimensionName][valueName].score += 0.04;
          if (evidence[dimensionName][valueName].hits.length < 5) {
            evidence[dimensionName][valueName].hits.push(`garden:${doc.path}`);
          }
        }
      }
    }
    const pathWeights = gardenPathHintWeights[doc.path];
    if (pathWeights) {
      for (const [compoundKey, weight] of Object.entries(pathWeights)) {
        const [dimensionName, valueName] = compoundKey.split(":");
        evidence[dimensionName][valueName].score += weight;
        if (evidence[dimensionName][valueName].hits.length < 5) {
          evidence[dimensionName][valueName].hits.push(`hint:${doc.path}`);
        }
      }
    }
  }

  leaderboardSubmissions.forEach((submission, index) => {
    const weight = 1 / (index + 1);
    const combined = [submission.pr?.title ?? "", submission.submission?.name ?? "", submission.submission?.blurb ?? ""].join(" ");
    for (const [dimensionName, values] of Object.entries(dimensionValuePatterns)) {
      for (const [valueName, patterns] of Object.entries(values)) {
        if (patterns.some((pattern) => pattern.test(combined))) {
          evidence[dimensionName][valueName].score += 0.08 * weight;
          if (evidence[dimensionName][valueName].hits.length < 5) {
            evidence[dimensionName][valueName].hits.push(`leaderboard:${submission.pr?.title ?? submission.submission?.name ?? 'entry'}`);
          }
        }
      }
    }
  });

  autoresearchHeadings.forEach((heading, index) => {
    const weight = 0.02 * (1 / (index + 1));
    if (/parallel|gpu cluster|hyperparameter|architecture|optimizer|diminishing returns/i.test(heading)) {
      evidence.optimizer_recipe["adaptive-schedule"].score += weight;
      evidence.eval_strategy["iterative-refinement"].score += weight;
      if (evidence.optimizer_recipe["adaptive-schedule"].hits.length < 5) {
        evidence.optimizer_recipe["adaptive-schedule"].hits.push(`autoresearch:${heading}`);
      }
    }
  });

  return evidence;
};

const boostFrontierProfile = (profile: LabProfile, evidence: Readonly<Record<string, Readonly<Record<string, ValueEvidence>>>>): LabProfile => {
  const seedStrategies = profile.seedStrategies.map((strategy) => {
    const mapping = strategyValueWeights[strategy.id] ?? {};
    const rawBoost = Object.entries(mapping).reduce((sum, [compoundKey, weight]) => {
      const [dimensionName, valueName] = compoundKey.split(":");
      return sum + weight * (evidence[dimensionName]?.[valueName]?.score ?? 0);
    }, 0);
    return {
      ...strategy,
      signalBoost: Math.min(0.30, rawBoost)
    } satisfies StrategySeed;
  });
  return { ...profile, seedStrategies };
};

const writeReports = async (profileDir: string, evidence: Readonly<Record<string, Readonly<Record<string, ValueEvidence>>>>, profile: LabProfile): Promise<{ readonly jsonPath: string; readonly markdownPath: string }> => {
  const outDir = path.join(profileDir, "prior-art");
  await fs.mkdir(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "latest.json");
  const markdownPath = path.join(outDir, "latest.md");
  await fs.writeFile(jsonPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), evidence, strategies: profile.seedStrategies }, null, 2)}\n`, "utf8");
  const lines = [
    `# ${profile.profileId} prior-art synthesis`,
    "",
    `- generatedAt: ${new Date().toISOString()}`,
    `- sources: unofficial leaderboard, research garden, autoresearch writeup`,
    "",
    "## Cluster/value evidence",
    ""
  ];
  for (const [dimensionName, values] of Object.entries(evidence)) {
    lines.push(`### ${dimensionName}`, "", "| Value | score | evidence |", "|---|---:|---|");
    for (const [valueName, info] of Object.entries(values).sort((left, right) => right[1].score - left[1].score)) {
      lines.push(`| ${valueName} | ${info.score.toFixed(3)} | ${info.hits.slice(0, 3).join('<br>')} |`);
    }
    lines.push("");
  }
  lines.push("## Frontier strategies", "", "| Strategy | effectivePrior | risk | hypothesis |", "|---|---:|---|---|");
  for (const strategy of [...profile.seedStrategies].sort((left, right) => (right.priorBelief + (right.signalBoost ?? 0)) - (left.priorBelief + (left.signalBoost ?? 0)))) {
    lines.push(`| ${strategy.label} | ${Math.min(1, strategy.priorBelief + (strategy.signalBoost ?? 0)).toFixed(3)} | ${strategy.riskLevel} | ${strategy.hypothesis} |`);
  }
  lines.push("", "## Search procedure notes", "", "- The research garden is being used as a semantic prior over architecture families, not as a source of claimed results.", "- The unofficial leaderboard is being used as public frontier signal, especially around quantization, sliding-window eval, optimizer tuning, and tokenizer/head tradeoffs.", "- Fork Tales influence here is procedural: treat prior art as a graph of motifs, strategies, and evidence, then bias search through cluster-level synthesis rather than isolated knobs.");
  await fs.writeFile(markdownPath, `${lines.join("\n")}\n`, "utf8");
  return { jsonPath, markdownPath };
};

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv.slice(2));
  const paths = resolveLabPaths(args.labDir, args.profile);
  const profile = await readConfig(paths);
  const evidence = await computeValueEvidence(args.maxGardenDocs, args.maxLeaderboardSubmissions);
  const boostedProfile = boostFrontierProfile(profile, evidence);
  await writeConfig(paths, boostedProfile);
  try {
    await writeState(paths, createInitialState(boostedProfile));
  } catch {
    // ignore state reset failures; profile config/report are the main outputs here
  }
  const report = await writeReports(paths.profileDir, evidence, boostedProfile);
  process.stdout.write(`${JSON.stringify({ profileId: boostedProfile.profileId, report }, null, 2)}\n`);
};

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});

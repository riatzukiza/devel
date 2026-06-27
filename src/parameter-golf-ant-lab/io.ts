import { promises as fs } from "node:fs";
import path from "node:path";
import type { LabPaths, LabProfile, LabState, SuggestionBatch } from "./types";

export const resolveLabPaths = (rootDir: string, profileId: string): LabPaths => {
  const profileDir = path.join(rootDir, profileId);
  return {
    rootDir,
    profileDir,
    configPath: path.join(profileDir, "config.json"),
    statePath: path.join(profileDir, "state.json"),
    suggestionsDir: path.join(profileDir, "suggestions")
  };
};

export const ensureDir = async (dir: string): Promise<void> => {
  await fs.mkdir(dir, { recursive: true });
};

export const writeJson = async (filePath: string, value: unknown): Promise<void> => {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

export const readJson = async <T>(filePath: string): Promise<T> => {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
};

export const writeConfig = async (paths: LabPaths, profile: LabProfile): Promise<void> => {
  await writeJson(paths.configPath, profile);
};

export const readConfig = async (paths: LabPaths): Promise<LabProfile> => readJson<LabProfile>(paths.configPath);

export const writeState = async (paths: LabPaths, state: LabState): Promise<void> => {
  await writeJson(paths.statePath, state);
};

export const readState = async (paths: LabPaths): Promise<LabState> => readJson<LabState>(paths.statePath);

const formatChoices = (choices: Readonly<Record<string, string>>): string =>
  Object.entries(choices)
    .map(([name, value]) => `- ${name}: ${value}`)
    .join("\n");

export const writeSuggestionBatch = async (paths: LabPaths, batch: SuggestionBatch): Promise<{ readonly jsonPath: string; readonly markdownPath: string }> => {
  await ensureDir(paths.suggestionsDir);
  const baseName = `step-${String(batch.step).padStart(4, "0")}`;
  const jsonPath = path.join(paths.suggestionsDir, `${baseName}.json`);
  const markdownPath = path.join(paths.suggestionsDir, `${baseName}.md`);
  await writeJson(jsonPath, batch);
  const markdown = [
    `# ${batch.profileId} ant suggestions — step ${batch.step}`,
    "",
    `- generatedAt: ${batch.generatedAt}`,
    `- objective: ${batch.objective}`,
    `- candidateCount: ${batch.candidates.length}`,
    "",
    ...batch.candidates.flatMap((candidate, index) => [
      `## Candidate ${index + 1} — ${candidate.id}`,
      "",
      `- strategy: ${candidate.strategyLabel ?? "free-ant"}`,
      `- priorScore: ${candidate.priorScore.toFixed(4)}`,
      `- novelty: ${candidate.novelty.toFixed(4)}`,
      `- pheromoneScore: ${candidate.pheromoneScore.toFixed(4)}`,
      `- heuristicScore: ${candidate.heuristicScore.toFixed(4)}`,
      `- compositeScore: ${candidate.compositeScore.toFixed(4)}`,
      `- status: ${candidate.status}`,
      `- risk: ${candidate.riskLevel}`,
      `- tags: ${candidate.tags.join(", ")}`,
      "",
      "### Hypothesis",
      candidate.hypothesis,
      "",
      "### Choices",
      formatChoices(candidate.choices),
      "",
      "### Shell env",
      "```bash",
      candidate.shellEnv || "# no direct env mapping for this profile yet",
      candidate.command,
      "```",
      ""
    ])
  ].join("\n");
  await fs.writeFile(markdownPath, `${markdown}\n`, "utf8");
  return { jsonPath, markdownPath };
};

export const writeRootReadme = async (rootDir: string): Promise<void> => {
  await ensureDir(rootDir);
  const readmePath = path.join(rootDir, "README.md");
  const content = [
    "# Parameter Golf Ant Lab",
    "",
    "This directory stores ACO-style search state for two built-in profiles:",
    "- `board` — competition-facing Parameter Golf search",
    "- `presence` — research-facing tiny safe Presence search",
    "",
    "Suggested commands:",
    "```bash",
    "pnpm pg:ants init --lab-dir labs/parameter-golf-ant-lab --profile all",
    "pnpm pg:ants step --lab-dir labs/parameter-golf-ant-lab --profile board",
    "pnpm pg:ants status --lab-dir labs/parameter-golf-ant-lab --profile board",
    "pnpm pg:ants record --lab-dir labs/parameter-golf-ant-lab --profile board --candidate-id <id> --metrics-json '{\"val_bpb\":1.21,\"bytes_total\":15800000,\"wallclock_seconds\":590}'",
    "```",
    "",
    "The ants do not run training themselves yet; they propose, remember, and reinforce promising experiment paths."
  ].join("\n");
  await fs.writeFile(readmePath, `${content}\n`, "utf8");
};

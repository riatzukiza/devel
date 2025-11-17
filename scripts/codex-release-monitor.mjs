#!/usr/bin/env node
import { Octokit } from "@octokit/rest";
import { execSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";

const WATCHERS = [
  {
    id: "sst-opencode",
    friendlyName: "SST OpenCode",
    repo: { owner: "sst", name: "opencode" },
    tagPattern: /^v(?<version>.+)$/,
    focus:
      "Watch for CLI flag/env var changes, prompt/diff streaming updates, and SDK contract shifts consumed by open-hax/codex.",
    searchHints: [
      "packages/opencode",
      "packages/sdk/js",
      "packages/opencode/src/cli",
      "packages/opencode/scripts",
      "packages/slack"
    ]
  },
  {
    id: "openai-codex",
    friendlyName: "OpenAI Codex",
    repo: { owner: "openai", name: "codex" },
    tagPattern: /^rust-v(?<version>.+)$/,
    focus: "Monitor OAuth/agent bridge behavior, HTTP payload/CLI options, and plugin hook changes that codex OAuth proxy relies on.",
    searchHints: [
      "cli",
      "crates",
      "oauth",
      "plugins",
      "docs"
    ]
  }
];

const STATE_PATH = join(process.cwd(), ".github", "release-watch", "state.json");
const ISSUE_LABEL = "codex-release-watch";
const MAX_BUFFER = 1024 * 1024 * 50;
const DEFAULT_MODEL = process.env.RELEASE_WATCH_MODEL ?? "openai/gpt-5-codex-high";

async function main() {
  const githubToken = process.env.RELEASE_WATCH_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error("GITHUB_TOKEN (or RELEASE_WATCH_GITHUB_TOKEN) is required for release monitor");
  }

  const octokit = new Octokit({ auth: githubToken });
  const targetRepo = resolveTargetRepo();
  const state = ensureStateShape(readState());
  const updatedState = JSON.parse(JSON.stringify(state));
  let hasChanges = false;
  const failures = [];

  for (const watcher of WATCHERS) {
    try {
      const result = await processWatcher({ watcher, stateEntry: state[watcher.id], octokit, targetRepo });
      if (result?.stateEntry) {
        updatedState[watcher.id] = result.stateEntry;
        hasChanges = true;
      }
    } catch (error) {
      failures.push({ watcher: watcher.id, error });
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`[${failure.watcher}] ${failure.error?.stack ?? failure.error}`);
    }
    process.exitCode = 1;
    return;
  }

  if (hasChanges) {
    persistState(updatedState);
    console.log("Release state updated");
  } else {
    console.log("No release state changes detected");
  }
}

async function processWatcher({ watcher, stateEntry, octokit, targetRepo }) {
  console.log(`\n[${watcher.id}] Checking releases for ${watcher.repo.owner}/${watcher.repo.name}`);
  const releases = await fetchReleases(octokit, watcher);
  if (releases.length === 0) {
    console.log(`[${watcher.id}] No published releases found`);
    return null;
  }

  const latest = releases[0];
  const latestTag = latest.tag_name;
  const baseTag = stateEntry?.lastReviewedTag ?? releases[1]?.tag_name ?? null;

  if (!baseTag) {
    console.warn(`[${watcher.id}] Unable to determine base tag (need prior reviewed release). Update state.json manually to seed the first comparison.`);
    return null;
  }

  if (baseTag === latestTag) {
    console.log(`[${watcher.id}] Already reviewed ${latestTag}; skipping.`);
    return null;
  }

  console.log(`[${watcher.id}] Diffing ${baseTag} -> ${latestTag}`);
  const repoDir = cloneRepo(watcher);
  checkoutTag(repoDir, latestTag);
  const diffPaths = buildDiffArtifacts({ repoDir, baseTag, latestTag, release: latest, watcher });
  const agentResult = runReleaseAgent({ repoDir, watcher, baseTag, latestTag, diffPaths });

  console.log(`[${watcher.id}] Agent impact: ${agentResult.impact}`);
  await maybeCreateIssues({
    watcher,
    targetRepo,
    release: latest,
    baseTag,
    agentResult,
    octokit
  });

  const nextState = {
    lastReviewedTag: latestTag,
    lastReviewedVersion: deriveVersion(watcher.tagPattern, latestTag),
    lastCheckedAt: new Date().toISOString()
  };

  return { stateEntry: nextState };
}

async function fetchReleases(octokit, watcher) {
  const response = await octokit.repos.listReleases({
    owner: watcher.repo.owner,
    repo: watcher.repo.name,
    per_page: 5
  });
  return response.data.filter((release) => !release.draft && !release.prerelease);
}

function cloneRepo(watcher) {
  const workDir = mkdtempSync(join(tmpdir(), `${watcher.id}-release-`));
  const repoUrl = `https://github.com/${watcher.repo.owner}/${watcher.repo.name}.git`;
  execSync(`git clone --filter=blob:none ${repoUrl} ${workDir}`, { stdio: "inherit" });
  execSync("git fetch --tags", { cwd: workDir, stdio: "inherit" });
  return workDir;
}

function checkoutTag(repoDir, tag) {
  execSync(`git checkout ${tag}`, { cwd: repoDir, stdio: "inherit" });
}

function buildDiffArtifacts({ repoDir, baseTag, latestTag, release, watcher }) {
  const diff = execSync(`git diff ${baseTag} ${latestTag}`, { cwd: repoDir, maxBuffer: MAX_BUFFER });
  const diffStat = execSync(`git diff ${baseTag} ${latestTag} --stat`, { cwd: repoDir, maxBuffer: MAX_BUFFER }).toString();
  const logRange = execSync(`git log ${baseTag}..${latestTag} --oneline`, { cwd: repoDir, maxBuffer: MAX_BUFFER }).toString();

  const diffPath = join(repoDir, "release-diff.patch");
  writeFileSync(diffPath, diff);

  const contextPath = join(repoDir, "release-context.md");
  const releaseNotes = release.body ? truncate(release.body, 1500) : "(no release notes)";
  const hintLines = watcher.searchHints?.length
    ? watcher.searchHints.map((hint) => `- ${hint}`)
    : ["(no predefined hints)"];

  const context = [
    `# Release Impact Brief – ${watcher.friendlyName} ${release.tag_name}`,
    `- **Repository**: ${watcher.repo.owner}/${watcher.repo.name}`,
    `- **Release URL**: ${release.html_url}`,
    `- **Published**: ${release.published_at ?? "unknown"}`,
    `- **Comparing**: ${baseTag} → ${latestTag}`,
    `- **Focus**: ${watcher.focus ?? "Identify breaking or risky changes for the open-hax/codex plugin."}`,
    "",
    "## Diff Summary",
    diffStat.trim() || "(no diff stat)",
    "",
    "## Commit Log",
    logRange.trim() || "(no commits)",
    "",
    "## Release Notes",
    releaseNotes,
    "",
    "## Search Hints",
    ...hintLines,
    "",
    "## Instructions",
    "Use the diff + worktree to decide whether the open-hax/codex plugin must change. Return JSON per the agent contract.",
    "Always cite relative file paths when referencing evidence."
  ].join("\n");

  writeFileSync(contextPath, context);
  return { contextPath, diffPath };
}

function runReleaseAgent({ repoDir, watcher, baseTag, latestTag, diffPaths }) {
  const args = [
    "run",
    "--agent",
    "release-impact",
    "--model",
    DEFAULT_MODEL,
    "--file",
    diffPaths.contextPath,
    "--file",
    diffPaths.diffPath,
    `Analyze ${watcher.repo.owner}/${watcher.repo.name} release ${latestTag} vs ${baseTag} for open-hax/codex compatibility risks.`
  ];

  const result = spawnSync("opencode", args, {
    cwd: repoDir,
    env: process.env,
    encoding: "utf8",
    maxBuffer: MAX_BUFFER
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`OpenCode exited with ${result.status}: ${result.stderr}`);
  }

  return parseAgentJson(result.stdout);
}

async function maybeCreateIssues({ watcher, targetRepo, release, baseTag, agentResult, octokit }) {
  const issues = normalizeIssues(agentResult);
  if (issues.length === 0) {
    return;
  }

  const workflowUrl = buildWorkflowUrl();
  const evidenceSection = buildEvidenceSection(agentResult.evidence ?? []);

  for (const issue of issues) {
    const titlePrefix = watcher.issueTitlePrefix ?? `[${watcher.repo.owner}/${watcher.repo.name}]`;
    const title = `${titlePrefix} ${issue.title}`;
    const metadata = [
      "## Release Metadata",
      `- **Upstream**: ${watcher.repo.owner}/${watcher.repo.name}`,
      `- **Tag**: ${release.tag_name}`,
      `- **Compared Against**: ${baseTag}`,
      `- **Release URL**: ${release.html_url}`,
      workflowUrl ? `- **Workflow Run**: ${workflowUrl}` : null
    ]
      .filter(Boolean)
      .join("\n");

    const bodyParts = [issue.body.trim(), metadata, evidenceSection].filter(Boolean);

    await octokit.issues.create({
      owner: targetRepo.owner,
      repo: targetRepo.name,
      title,
      body: bodyParts.join("\n\n"),
      labels: [ISSUE_LABEL, `upstream:${watcher.id}`, `impact:${agentResult.impact}`]
    });
  }
}

function normalizeIssues(agentResult) {
  const provided = Array.isArray(agentResult.issues) ? agentResult.issues : [];
  const sanitized = provided.filter((item) => typeof item?.title === "string" && typeof item?.body === "string");
  if (sanitized.length > 0) {
    return sanitized;
  }
  if (agentResult.impact && agentResult.impact !== "none") {
    const summaryText = typeof agentResult.summary === "string" && agentResult.summary.trim().length > 0
      ? agentResult.summary.trim()
      : "Potential impact";
    return [
      {
        title: summaryText,
        body: `${summaryText}\n\nOpenCode agent flagged concerns but returned no structured issue body.`
      }
    ];
  }
  return [];
}

function buildEvidenceSection(evidence) {
  if (!Array.isArray(evidence) || evidence.length === 0) {
    return "";
  }
  const lines = evidence
    .filter((item) => item?.path && item?.description)
    .map((item) => `- \\`${item.path}\\` – ${item.description}`);
  if (!lines.length) {
    return "";
  }
  return ["## Evidence", ...lines].join("\n");
}

function parseAgentJson(stdout) {
  const trimmed = stdout.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Unable to locate JSON in OpenCode output:\n${stdout}`);
  }
  const jsonSlice = trimmed.slice(start, end + 1);
  return JSON.parse(jsonSlice);
}

function deriveVersion(pattern, tag) {
  if (!pattern) {
    return tag;
  }
  const match = pattern.exec(tag);
  return match?.groups?.version ?? tag;
}

function readState() {
  if (!existsSync(STATE_PATH)) {
    return {};
  }
  const raw = readFileSync(STATE_PATH, "utf8");
  return JSON.parse(raw);
}

function ensureStateShape(state) {
  const draft = { ...state };
  for (const watcher of WATCHERS) {
    if (!draft[watcher.id]) {
      draft[watcher.id] = {
        lastReviewedTag: null,
        lastReviewedVersion: null,
        lastCheckedAt: null
      };
    }
  }
  return draft;
}

function persistState(state) {
  const dir = dirname(STATE_PATH);
  mkdirSync(dir, { recursive: true });
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
}

function resolveTargetRepo() {
  const envRepo = process.env.GITHUB_REPOSITORY;
  if (envRepo) {
    const [owner, repo] = envRepo.split("/");
    if (owner && repo) {
      return { owner, name: repo };
    }
  }
  const originUrl = execSync("git config --get remote.origin.url").toString().trim();
  const parsed = parseGitUrl(originUrl);
  if (!parsed) {
    throw new Error("Unable to infer repository (set GITHUB_REPOSITORY)");
  }
  return parsed;
}

function parseGitUrl(url) {
  if (!url) return null;
  if (url.startsWith("git@")) {
    const [, pathPart] = url.split(":" );
    if (!pathPart) return null;
    const cleaned = pathPart.replace(/\.git$/, "");
    const [owner, repo] = cleaned.split("/");
    return owner && repo ? { owner, name: repo } : null;
  }
  if (url.startsWith("http")) {
    const cleaned = url.replace(/\.git$/, "");
    const segments = cleaned.split("/").slice(-2);
    const [owner, repo] = segments;
    return owner && repo ? { owner, name: repo } : null;
  }
  return null;
}

function buildWorkflowUrl() {
  const runId = process.env.GITHUB_RUN_ID;
  const server = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  const repo = process.env.GITHUB_REPOSITORY;
  if (!runId || !repo) {
    return null;
  }
  return `${server}/${repo}/actions/runs/${runId}`;
}

function truncate(text, limit) {
  if (!text) return "";
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit)}\n\n… (truncated)`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

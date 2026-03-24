import path from "node:path";

import { bootstrapClone } from "./bootstrap";
import { ensureFork, createPullRequest, commentOnPullRequest, formatRepoName, parseGithubSlug } from "./github";
import { buildForkPlan, type InventoryConfig, applyRemotePlan, writeInventoryReport } from "./inventory";
import {
  commitAll,
  createOrUpdateBranchRef,
  createTag,
  currentBranch,
  hasSnapshotCandidateChanges,
  headSha,
  isAncestor,
  listDirtySubmodules,
  listSnapshotCandidatePaths,
  shortSha,
  stageSnapshotChanges,
  statusPorcelain,
  pushRef,
} from "./git";
import { runPiReview } from "./pi";
import { sleep } from "./process";
import { readState, writeState } from "./state";
import type { AutoForkTaxState, RepoSlug, SnapshotResult, SubmoduleForkPlan } from "./types";

interface ParsedArgs {
  readonly command: string;
  readonly root: string;
  readonly apply: boolean;
  readonly review: boolean;
  readonly postComment: boolean;
  readonly allowDirtySubmodules: boolean;
  readonly baseBranch: string | null;
  readonly repo: string | null;
  readonly prNumber: number | null;
  readonly branchPrefix: string;
  readonly defaultForkOwner: string;
  readonly piModel: string;
  readonly cloneDir: string;
}

const DEFAULT_OWNED_ORGS = ["riatzukiza", "octave-commons", "open-hax"] as const;

const parseArgs = (argv: readonly string[]): ParsedArgs => {
  const command = argv[0] ?? "inventory";
  let root = process.cwd();
  let apply = false;
  let review = false;
  let postComment = false;
  let allowDirtySubmodules = false;
  let baseBranch: string | null = null;
  let repo: string | null = null;
  let prNumber: number | null = null;
  let branchPrefix = process.env.AUTO_FORK_TAX_BRANCH_PREFIX ?? "pi/auto-fork-tax";
  let defaultForkOwner = process.env.AUTO_FORK_TAX_DEFAULT_FORK_OWNER ?? "riatzukiza";
  let piModel = process.env.AUTO_FORK_TAX_PI_MODEL ?? "open-hax-completions/gpt-5.4";
  let cloneDir = process.env.AUTO_FORK_TAX_CLONE_DIR ?? "~/.local/share/pi-auto-fork-tax/devel";

  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index];
    switch (token) {
      case "--root":
        root = argv[index + 1] ?? root;
        index += 1;
        break;
      case "--apply":
        apply = true;
        break;
      case "--review":
        review = true;
        break;
      case "--post-comment":
        postComment = true;
        break;
      case "--allow-dirty-submodules":
        allowDirtySubmodules = true;
        break;
      case "--base-branch":
        baseBranch = argv[index + 1] ?? baseBranch;
        index += 1;
        break;
      case "--repo":
        repo = argv[index + 1] ?? repo;
        index += 1;
        break;
      case "--pr":
        prNumber = Number(argv[index + 1] ?? "0");
        index += 1;
        break;
      case "--branch-prefix":
        branchPrefix = argv[index + 1] ?? branchPrefix;
        index += 1;
        break;
      case "--default-fork-owner":
        defaultForkOwner = argv[index + 1] ?? defaultForkOwner;
        index += 1;
        break;
      case "--pi-model":
        piModel = argv[index + 1] ?? piModel;
        index += 1;
        break;
      case "--clone-dir":
        cloneDir = argv[index + 1] ?? cloneDir;
        index += 1;
        break;
      default:
        break;
    }
  }

  return {
    command,
    root: path.resolve(root),
    apply,
    review,
    postComment,
    allowDirtySubmodules,
    baseBranch,
    repo,
    prNumber,
    branchPrefix,
    defaultForkOwner,
    piModel,
    cloneDir,
  };
};

const usage = (): never => {
  throw new Error([
    "Usage:",
    "  tsx src/auto-fork-tax/cli.ts inventory [--root dir]",
    "  tsx src/auto-fork-tax/cli.ts ensure-forks [--root dir] [--apply] [--default-fork-owner owner]",
    "  tsx src/auto-fork-tax/cli.ts snapshot-pr [--root dir] [--apply] [--review] [--post-comment] [--allow-dirty-submodules] [--base-branch branch] [--repo owner/repo] [--branch-prefix prefix] [--pi-model model]",
    "  tsx src/auto-fork-tax/cli.ts review-pr --repo owner/repo --pr 123 [--post-comment] [--pi-model model]",
    "  tsx src/auto-fork-tax/cli.ts cycle [--root dir] [--apply] [--review] [--post-comment] [--allow-dirty-submodules]",
    "  tsx src/auto-fork-tax/cli.ts cron-entry [--root dir]",
    "  tsx src/auto-fork-tax/cli.ts bootstrap-clone [--root dir] [--clone-dir dir]",
  ].join("\n"));
};

const inventoryConfigFor = (args: ParsedArgs): InventoryConfig => ({
  root: args.root,
  ownedOrganizations: DEFAULT_OWNED_ORGS,
  defaultForkOwner: args.defaultForkOwner,
  sourceOwnerOverrides: {
    openai: "riatzukiza",
    anomalyco: "riatzukiza",
    badlogic: "riatzukiza",
    agustif: "riatzukiza",
    shuv1337: "riatzukiza",
  },
});

const renderPlanSummary = (plans: readonly SubmoduleForkPlan[]) => ({
  total: plans.length,
  localOnly: plans.filter((plan) => plan.localOnly).length,
  needsFork: plans.filter((plan) => plan.needsFork).length,
  needsOriginRewrite: plans.filter((plan) => plan.needsOriginRewrite).length,
  needsUpstream: plans.filter((plan) => plan.needsUpstream).length,
});

const resolveRepoSlug = async (root: string, explicitRepo: string | null): Promise<RepoSlug> => {
  if (explicitRepo) {
    const parsed = parseGithubSlug(`https://github.com/${explicitRepo}.git`);
    if (!parsed) {
      throw new Error(`Unable to parse --repo ${explicitRepo}`);
    }
    return parsed;
  }
  const { remoteByName } = await import("./git");
  const origin = await remoteByName(root, "origin");
  if (!origin?.slug) {
    throw new Error(`Unable to resolve root origin GitHub repo for ${root}`);
  }
  return origin.slug;
};

const timestampForBranch = (): string => {
  const now = new Date();
  const pad = (value: number): string => value.toString().padStart(2, "0");
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
};

const forkTaxTagFor = (head: string): string => {
  const iso = new Date().toISOString();
  const day = iso.slice(0, 10);
  const time = iso.slice(11, 19).replaceAll(":", "");
  return `Π/${day}/${time}-${head}`;
};

const ensureQuiescent = async (root: string): Promise<void> => {
  const before = await statusPorcelain(root);
  await sleep(1500);
  const after = await statusPorcelain(root);
  if (before !== after) {
    throw new Error("workspace is still changing; refusing auto fork-tax until the tree is quiescent");
  }
};

const buildPullRequestBody = (params: {
  readonly baseBranch: string;
  readonly sourceBranch: string;
  readonly tag: string;
  readonly head: string;
  readonly stagedPaths: readonly string[];
  readonly dirtySubmodules: readonly string[];
}): string => {
  return [
    `## Auto Fork Tax Snapshot`,
    ``,
    `- base branch: ${params.baseBranch}`,
    `- snapshot branch: ${params.sourceBranch}`,
    `- tag: ${params.tag}`,
    `- head: ${params.head}`,
    `- staged paths: ${params.stagedPaths.length}`,
    `- dirty submodules observed but excluded from staging: ${params.dirtySubmodules.length}`,
    ``,
    `### Safety protocol`,
    `- cron-driven, not file-watch driven`,
    `- explicit artifact guards run before commit/push`,
    `- PR chain targets the most recent compatible snapshot branch when possible`,
    `- no auto-merge`,
    `- pi review can comment, but does not merge`,
    `- root snapshots stage only non-submodule paths; recursive submodule Π remains a separate future phase`,
    ...(params.stagedPaths.length > 0
      ? ["", "### Staged paths", ...params.stagedPaths.slice(0, 50).map((value) => `- ${value}`)]
      : []),
    ...(params.dirtySubmodules.length > 0
      ? ["", "### Excluded dirty submodules", ...params.dirtySubmodules.slice(0, 50).map((value) => `- ${value}`)]
      : []),
  ].join("\n");
};

const runReview = async (
  root: string,
  repo: RepoSlug,
  pullRequestNumber: number,
  piModel: string,
  postComment: boolean,
): Promise<string | undefined> => {
  const review = await runPiReview({
    repo,
    pullRequestNumber,
    model: piModel,
    cwd: root,
  });
  if (!postComment) {
    return review;
  }
  await commentOnPullRequest(repo, pullRequestNumber, review);
  return undefined;
};

const runSnapshotPr = async (args: ParsedArgs): Promise<SnapshotResult | { skipped: true; reason: string }> => {
  const dirtySubmodules = await listDirtySubmodules(args.root);
  if (!(await hasSnapshotCandidateChanges(args.root))) {
    const reason = dirtySubmodules.length > 0
      ? "no non-submodule changes to snapshot; only submodule dirt is present"
      : "working tree is clean";
    return { skipped: true, reason };
  }

  const stagedPaths = await listSnapshotCandidatePaths(args.root);

  await ensureQuiescent(args.root);

  const state = await readState(args.root);
  const current = await currentBranch(args.root);
  const pre = await shortSha(args.root);
  const baseBranch = args.baseBranch
    ?? (state.lastSnapshotBranch && state.lastSnapshotHead && await isAncestor(args.root, state.lastSnapshotHead, "HEAD")
      ? state.lastSnapshotBranch
      : current);

  const timestamp = timestampForBranch();
  const snapshotBranch = `${args.branchPrefix}/${timestamp}`;
  if (!args.apply) {
    return { skipped: true, reason: `dry-run: would snapshot ${current} into ${snapshotBranch} targeting ${baseBranch}` };
  }

  const commitMessage = `Π: snapshot ${new Date().toISOString()} [${current}] (${pre})`;

  await stageSnapshotChanges(args.root);
  await commitAll(args.root, commitMessage);
  const head = await shortSha(args.root);
  const tag = forkTaxTagFor(head);
  await createOrUpdateBranchRef(args.root, snapshotBranch);
  await createTag(args.root, tag);
  await pushRef(args.root, "origin", `${snapshotBranch}:${snapshotBranch}`);
  await pushRef(args.root, "origin", tag);

  const repo = await resolveRepoSlug(args.root, args.repo);
  const pullRequest = await createPullRequest({
    repo,
    baseBranch,
    headBranch: snapshotBranch,
    title: `Π: snapshot ${timestamp}`,
    body: buildPullRequestBody({
      baseBranch,
      sourceBranch: snapshotBranch,
      tag,
      head,
      stagedPaths,
      dirtySubmodules,
    }),
  });

  let reviewCommentUrl: string | undefined;
  if (args.review) {
    const reviewResult = await runReview(args.root, repo, pullRequest.number, args.piModel, args.postComment);
    if (reviewResult && !args.postComment) {
      reviewCommentUrl = reviewResult;
    }
  }

  const nextState: AutoForkTaxState = {
    version: 1,
    lastRunAt: new Date().toISOString(),
    lastSnapshotBranch: snapshotBranch,
    lastSnapshotTag: tag,
    lastSnapshotHead: await headSha(args.root),
    lastPullRequestNumber: pullRequest.number,
    lastPullRequestUrl: pullRequest.url,
  };
  await writeState(args.root, nextState);

  return {
    branch: snapshotBranch,
    tag,
    head,
    baseBranch,
    pullRequestUrl: pullRequest.url,
    pullRequestNumber: pullRequest.number,
    reviewCommentUrl,
  };
};

const runEnsureForks = async (args: ParsedArgs): Promise<readonly SubmoduleForkPlan[]> => {
  const plans = await buildForkPlan(inventoryConfigFor(args));
  if (!args.apply) {
    return plans;
  }
  for (const plan of plans) {
    if (!plan.target || plan.localOnly) {
      continue;
    }
    if (plan.needsFork) {
      await ensureFork(plan.target.source, plan.target.desiredOrigin.owner);
    }
    if (plan.needsOriginRewrite || plan.needsUpstream) {
      await applyRemotePlan(args.root, plan);
    }
  }
  return buildForkPlan(inventoryConfigFor(args));
};

const runCycle = async (args: ParsedArgs): Promise<unknown> => {
  const plans = await runEnsureForks(args);
  const snapshot = await runSnapshotPr(args);
  return {
    inventory: renderPlanSummary(plans),
    snapshot,
  };
};

const runCronEntry = (args: ParsedArgs): { readonly cron: string } => ({
  cron: `0 */6 * * * cd ${args.root} && pnpm tsx src/auto-fork-tax/cli.ts cycle --root ${args.root} --apply --review --post-comment >> ${path.join(args.root, ".ημ", "auto-fork-tax", "cron.log")} 2>&1`,
});

const runBootstrapClone = async (args: ParsedArgs): Promise<unknown> => {
  const branch = await currentBranch(args.root);
  const result = await bootstrapClone({
    sourceRoot: args.root,
    cloneDir: args.cloneDir,
    branch,
    installHooks: true,
  });
  return {
    ...result,
    runnerRoot: args.root,
    suggestedCron: `0 */6 * * * cd ${args.root} && pnpm tsx src/auto-fork-tax/cli.ts cycle --root ${result.cloneDir} --apply --review --post-comment >> ${path.join(result.cloneDir, ".ημ", "auto-fork-tax", "cron.log")} 2>&1`,
  };
};

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv.slice(2));

  switch (args.command) {
    case "inventory": {
      const plans = await buildForkPlan(inventoryConfigFor(args));
      const reportPath = await writeInventoryReport(args.root, plans);
      process.stdout.write(`${JSON.stringify({ summary: renderPlanSummary(plans), reportPath, plans }, null, 2)}\n`);
      return;
    }
    case "ensure-forks": {
      const plans = await runEnsureForks(args);
      const reportPath = await writeInventoryReport(args.root, plans);
      process.stdout.write(`${JSON.stringify({ summary: renderPlanSummary(plans), reportPath, plans }, null, 2)}\n`);
      return;
    }
    case "review-pr": {
      if (!args.repo || args.prNumber == null || !Number.isFinite(args.prNumber)) {
        usage();
      }
      const repo = await resolveRepoSlug(args.root, args.repo);
      const review = await runReview(args.root, repo, args.prNumber, args.piModel, args.postComment);
      process.stdout.write(`${JSON.stringify({ repo: formatRepoName(repo), pullRequestNumber: args.prNumber, review }, null, 2)}\n`);
      return;
    }
    case "snapshot-pr": {
      const result = await runSnapshotPr(args);
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      return;
    }
    case "cycle": {
      const result = await runCycle(args);
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      return;
    }
    case "cron-entry": {
      process.stdout.write(`${JSON.stringify(runCronEntry(args), null, 2)}\n`);
      return;
    }
    case "bootstrap-clone": {
      process.stdout.write(`${JSON.stringify(await runBootstrapClone(args), null, 2)}\n`);
      return;
    }
    default:
      usage();
  }
};

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});

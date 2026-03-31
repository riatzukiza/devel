import path from 'node:path';

import { createGitHubClient, checkState } from './github-client.js';
import { appendJsonlRecord, readJsonlFile } from './jsonl.js';
import { getVault, listVaults } from './vault-registry.js';

const byUpdatedDesc = (left, right) => Date.parse(right.updated_at || 0) - Date.parse(left.updated_at || 0);

const REVIEW_THREADS_QUERY = `
  query ReviewThreads($owner: String!, $repo: String!, $number: Int!, $after: String) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        reviewThreads(first: 100, after: $after) {
          nodes {
            isResolved
            isOutdated
            comments(first: 20) {
              nodes {
                author {
                  login
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  }
`;

const splitRepo = (repo) => {
  const [owner, name] = String(repo).split('/');
  return { owner, name };
};

const buildReviewSignals = async ({ github, repo, prNumber, trackedActors, reviews, issueComments }) => {
  const normalizedActors = new Set((trackedActors ?? []).map((actor) => String(actor).toLowerCase()));
  const base = {
    tracked_actors: [...normalizedActors],
    coderabbit_reviews: reviews.filter((review) => normalizedActors.has(String(review.user?.login ?? '').toLowerCase())).length,
    coderabbit_issue_comments: issueComments.filter((comment) => normalizedActors.has(String(comment.user?.login ?? '').toLowerCase())).length,
    tracked_unresolved_threads: null,
    tracked_total_threads: null,
    exact: false,
    note: github.hasAuth
      ? 'exact tracked thread counts unavailable'
      : 'exact tracked thread counts require ETA_MU_GITHUB_TOKEN or GITHUB_TOKEN',
  };

  if (!github.hasAuth || !prNumber) {
    return base;
  }

  const { owner, name } = splitRepo(repo);
  let after = null;
  let unresolved = 0;
  let total = 0;

  try {
    while (true) {
      const data = await github.graphql(REVIEW_THREADS_QUERY, {
        owner,
        repo: name,
        number: Number(prNumber),
        after,
      });

      const payload = data?.repository?.pullRequest?.reviewThreads;
      const nodes = payload?.nodes ?? [];

      for (const thread of nodes) {
        const hasTrackedActor = (thread.comments?.nodes ?? []).some((comment) =>
          normalizedActors.has(String(comment.author?.login ?? '').toLowerCase())
        );
        if (!hasTrackedActor) {
          continue;
        }

        total += 1;
        if (!thread.isResolved) {
          unresolved += 1;
        }
      }

      if (!payload?.pageInfo?.hasNextPage) {
        break;
      }
      after = payload.pageInfo.endCursor;
    }
  } catch (error) {
    return {
      ...base,
      note: error instanceof Error ? error.message : String(error),
    };
  }

  return {
    ...base,
    tracked_unresolved_threads: unresolved,
    tracked_total_threads: total,
    exact: true,
    note: 'tracked review-thread counts sourced from authenticated GitHub GraphQL',
  };
};

const buildEligibleMainPromotionAction = ({ vault, mainPromotionPr, stagingDeployState, stagingE2eState }) => {
  if (vault.flowKind !== 'staging-main') {
    return {
      allowed: false,
      reason: 'vault does not use a staging-first promotion flow',
    };
  }

  if (mainPromotionPr) {
    return {
      allowed: false,
      reason: 'main promotion PR already exists',
    };
  }

  if (stagingDeployState !== 'success') {
    return {
      allowed: false,
      reason: 'staging deploy has not succeeded yet',
    };
  }

  if (stagingE2eState !== 'success') {
    return {
      allowed: false,
      reason: 'staging live e2e has not succeeded yet',
    };
  }

  return {
    allowed: true,
    reason: 'staging branch has passed deploy + live e2e and no main promotion PR is open',
  };
};

const buildProxxState = async (vault, github) => {
  const observedAt = new Date().toISOString();
  const { repo } = vault;
  const { staging, main } = vault.branches;

  const [stagingBranch, mainPrs, stagingPrs, workflowRuns] = await Promise.all([
    github.json(`/repos/${repo}/branches/${staging}`),
    github.json(`/repos/${repo}/pulls?state=open&base=${main}`),
    github.json(`/repos/${repo}/pulls?state=open&base=${staging}`),
    github.json(`/repos/${repo}/actions/runs?per_page=20`),
  ]);

  const mainPromotionPr = [...mainPrs].sort(byUpdatedDesc).find((pr) => pr.head?.ref === staging) ?? [...mainPrs].sort(byUpdatedDesc)[0] ?? null;
  const stagingHeadSha = stagingBranch.commit?.sha ?? null;

  const [stagingChecksRaw, mainPromotionChecksRaw, reviews, issueComments] = await Promise.all([
    stagingHeadSha
      ? github.json(`/repos/${repo}/commits/${stagingHeadSha}/check-runs?per_page=100`)
      : Promise.resolve({ check_runs: [] }),
    mainPromotionPr?.head?.sha
      ? github.json(`/repos/${repo}/commits/${mainPromotionPr.head.sha}/check-runs?per_page=100`)
      : Promise.resolve({ check_runs: [] }),
    mainPromotionPr
      ? github.json(`/repos/${repo}/pulls/${mainPromotionPr.number}/reviews?per_page=100`)
      : Promise.resolve([]),
    mainPromotionPr
      ? github.json(`/repos/${repo}/issues/${mainPromotionPr.number}/comments?per_page=100`)
      : Promise.resolve([]),
  ]);

  const stagingChecks = github.latestCheckRunsByName(stagingChecksRaw.check_runs ?? []);
  const mainPromotionChecks = github.latestCheckRunsByName(mainPromotionChecksRaw.check_runs ?? []);

  const stagingDeployState = checkState(stagingChecks[vault.workflows.deployStaging]);
  const stagingE2eState = checkState(stagingChecks[vault.workflows.stagingE2e]);
  const stagingPreflightState = checkState(stagingChecks['staging-preflight']);

  const mainCheckNames = [
    vault.workflows.reviewGate,
    vault.workflows.etaMu,
    'staging-promotion-gate',
    'main-build',
    'main-typecheck',
    'main-unit-tests',
    'main-web-build',
    'main-lint',
  ];

  const failingMainChecks = mainCheckNames.filter((name) => {
    const state = checkState(mainPromotionChecks[name]);
    return state !== 'success' && state !== 'missing';
  });

  const blockingReasons = [];
  if (stagingDeployState === 'failure') {
    blockingReasons.push('staging deploy is failing on the staging branch head');
  }
  if (stagingDeployState === 'success' && stagingE2eState !== 'success') {
    blockingReasons.push('staging live e2e has not yet passed on the staging branch head');
  }
  if (failingMainChecks.includes(vault.workflows.reviewGate)) {
    blockingReasons.push('CodeRabbit review debt is still blocking main promotion');
  }
  if (failingMainChecks.includes(vault.workflows.etaMu)) {
    blockingReasons.push('eta-mu workflow is failing on the promotion PR');
  }
  if (failingMainChecks.includes('staging-promotion-gate')) {
    blockingReasons.push('main promotion gate cannot prove successful staging deploy + live e2e for the candidate SHA');
  }

  let stage = 'issue-triage';
  let status = 'pending';
  let summary = 'No active promotion detected yet.';
  let nextAction = 'wait for the first issue or branch promotion seed';

  if (mainPromotionPr) {
    stage = 'main-review';
    status = blockingReasons.length > 0 || failingMainChecks.length > 0 ? 'blocked' : 'pending';
    summary = `Main promotion PR #${mainPromotionPr.number} (${mainPromotionPr.title}) is open from ${mainPromotionPr.head.ref} → ${mainPromotionPr.base.ref}.`;
    nextAction = blockingReasons[0] ?? 'reconcile review debt and merge when the gate is clean';
  } else if (stagingDeployState === 'success' && stagingE2eState === 'success') {
    stage = 'pr-main-open';
    status = 'pending';
    summary = 'Staging has passed deploy + live e2e and is ready for a promotion PR into main.';
    nextAction = 'open the PR from staging to main';
  } else if (stagingDeployState === 'failure') {
    stage = 'deploying-staging';
    status = 'blocked';
    summary = 'The staging branch is blocked at deploy-staging.';
    nextAction = 'repair deploy-staging on the staging branch head, then re-run live e2e';
  } else if (stagingDeployState === 'success') {
    stage = 'staging-e2e';
    status = stagingE2eState === 'success' ? 'passed' : 'pending';
    summary = 'Staging deploy is healthy; waiting for live e2e to complete cleanly.';
    nextAction = 'wait for staging-live-e2e to resolve or inspect why it did not start';
  } else if (stagingPrs.length > 0) {
    stage = 'staging-review';
    status = 'pending';
    summary = `There ${stagingPrs.length === 1 ? 'is' : 'are'} ${stagingPrs.length} open PR${stagingPrs.length === 1 ? '' : 's'} targeting staging.`;
    nextAction = 'reconcile staging review debt and merge toward staging';
  }

  const reviewSignals = await buildReviewSignals({
    github,
    repo,
    prNumber: mainPromotionPr?.number,
    trackedActors: vault.trackedReviewActors,
    reviews,
    issueComments,
  });

  if (reviewSignals.exact && Number(reviewSignals.tracked_unresolved_threads) > 0) {
    const exactReason = `${reviewSignals.tracked_unresolved_threads} tracked review thread${reviewSignals.tracked_unresolved_threads === 1 ? '' : 's'} remain unresolved`;
    if (!blockingReasons.includes(exactReason)) {
      blockingReasons.unshift(exactReason);
    }
  }

  const eligibleActions = {
    open_main_promotion_pr: buildEligibleMainPromotionAction({
      vault,
      mainPromotionPr,
      stagingDeployState,
      stagingE2eState,
    }),
  };

  const recentRuns = (workflowRuns.workflow_runs ?? [])
    .filter((run) => Object.values(vault.workflows).includes(run.name) || ['main-pr-gate', 'staging-preflight', 'staging-promotion-gate'].includes(run.name))
    .slice(0, 8)
    .map((run) => ({
      name: run.name,
      branch: run.head_branch,
      event: run.event,
      status: run.status,
      conclusion: run.conclusion,
      url: run.html_url,
    }));

  return {
    vault: {
      id: vault.id,
      display_name: vault.displayName,
      repo,
      flow_kind: vault.flowKind,
      staging_branch: staging,
      main_branch: main,
    },
    observed_at: observedAt,
    stage,
    status,
    summary,
    next_action: nextAction,
    eligible_actions: eligibleActions,
    staging: {
      head_sha: stagingHeadSha,
      checks: {
        'staging-preflight': stagingPreflightState,
        [vault.workflows.deployStaging]: stagingDeployState,
        [vault.workflows.stagingE2e]: stagingE2eState,
      },
    },
    main_promotion: mainPromotionPr
      ? {
          number: mainPromotionPr.number,
          title: mainPromotionPr.title,
          url: mainPromotionPr.html_url,
          head_ref: mainPromotionPr.head.ref,
          head_sha: mainPromotionPr.head.sha,
          base_ref: mainPromotionPr.base.ref,
          updated_at: mainPromotionPr.updated_at,
          failing_checks: failingMainChecks,
          checks: Object.fromEntries(mainCheckNames.map((name) => [name, checkState(mainPromotionChecks[name])])),
          review_signals: reviewSignals,
        }
      : null,
    open_staging_prs: stagingPrs.map((pr) => ({
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      head_ref: pr.head?.ref,
      updated_at: pr.updated_at,
    })),
    blocking_reasons: blockingReasons,
    recent_runs: recentRuns,
  };
};

const buildVoxxState = async (vault, github) => {
  const observedAt = new Date().toISOString();
  const { repo } = vault;
  const { main } = vault.branches;

  const [mainBranch, mainPrs, workflowRuns] = await Promise.all([
    github.json(`/repos/${repo}/branches/${main}`),
    github.json(`/repos/${repo}/pulls?state=open&base=${main}`),
    github.json(`/repos/${repo}/actions/runs?per_page=20`),
  ]);

  const candidatePr = [...mainPrs].sort(byUpdatedDesc)[0] ?? null;
  const [candidateChecksRaw] = await Promise.all([
    candidatePr?.head?.sha
      ? github.json(`/repos/${repo}/commits/${candidatePr.head.sha}/check-runs?per_page=100`)
      : Promise.resolve({ check_runs: [] }),
  ]);

  const candidateChecks = github.latestCheckRunsByName(candidateChecksRaw.check_runs ?? []);
  const fallbackPrRun = (workflowRuns.workflow_runs ?? []).find(
    (run) => run.name === vault.workflows.mainPipeline
      && run.head_branch === candidatePr?.head?.ref
      && run.event === 'pull_request'
  );
  const mainPipelineState = candidateChecks[vault.workflows.mainPipeline]
    ? checkState(candidateChecks[vault.workflows.mainPipeline])
    : checkState(fallbackPrRun);
  const latestMainPush = (workflowRuns.workflow_runs ?? []).find(
    (run) => run.name === vault.workflows.mainPipeline && run.head_branch === main && run.event === 'push'
  );

  const reviews = candidatePr
    ? await github.json(`/repos/${repo}/pulls/${candidatePr.number}/reviews?per_page=100`)
    : [];
  const issueComments = candidatePr
    ? await github.json(`/repos/${repo}/issues/${candidatePr.number}/comments?per_page=100`)
    : [];

  const reviewSignals = await buildReviewSignals({
    github,
    repo,
    prNumber: candidatePr?.number,
    trackedActors: vault.trackedReviewActors,
    reviews,
    issueComments,
  });

  const blockingReasons = [
    'vault still uses a main-only promotion flow and has not yet been normalized to PR → staging → e2e → main',
  ];
  if (reviewSignals.exact && Number(reviewSignals.tracked_unresolved_threads) > 0) {
    blockingReasons.push(`${reviewSignals.tracked_unresolved_threads} tracked review thread${reviewSignals.tracked_unresolved_threads === 1 ? '' : 's'} remain unresolved`);
  }
  if (candidatePr && mainPipelineState !== 'success') {
    blockingReasons.push('voxx-main checks are not green on the current main PR candidate');
  }
  if (latestMainPush?.conclusion === 'failure') {
    blockingReasons.push('the latest push-to-main production pipeline is failing');
  }

  let stage = 'topology-gap';
  let status = 'blocked';
  let summary = 'Voxx is operational, but it does not yet have the canonical staging-first promotion topology.';
  let nextAction = 'add staging branch, staging deploy, and staging e2e before allowing promotion to remain main-only';

  if (candidatePr) {
    stage = 'main-only-review';
    summary = `Main-only PR #${candidatePr.number} (${candidatePr.title}) is open directly against main.`;
    nextAction = mainPipelineState === 'success'
      ? 'normalize Voxx into a staging-first vault before merging direct-to-main work becomes the habit'
      : 'repair voxx-main on the candidate PR, then normalize the vault to staging-first promotion';
  }

  return {
    vault: {
      id: vault.id,
      display_name: vault.displayName,
      repo,
      flow_kind: vault.flowKind,
      main_branch: main,
    },
    observed_at: observedAt,
    stage,
    status,
    summary,
    next_action: nextAction,
    eligible_actions: {
      open_main_promotion_pr: {
        allowed: false,
        reason: 'vault is not yet staging-first; normalize topology before automated promotion actuation',
      },
    },
    topology_note: 'Voxx is the second vault: visible to the control plane, but still structurally main-only.',
    main_branch: {
      head_sha: mainBranch.commit?.sha ?? null,
      latest_push_pipeline: latestMainPush
        ? {
            name: latestMainPush.name,
            status: latestMainPush.status,
            conclusion: latestMainPush.conclusion,
            url: latestMainPush.html_url,
          }
        : null,
    },
    current_pr: candidatePr
      ? {
          number: candidatePr.number,
          title: candidatePr.title,
          url: candidatePr.html_url,
          head_ref: candidatePr.head?.ref,
          head_sha: candidatePr.head?.sha,
          base_ref: candidatePr.base?.ref,
          updated_at: candidatePr.updated_at,
          checks: {
            [vault.workflows.mainPipeline]: mainPipelineState,
          },
          review_signals: reviewSignals,
        }
      : null,
    open_main_prs: [...mainPrs].sort(byUpdatedDesc).map((pr) => ({
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      head_ref: pr.head?.ref,
      updated_at: pr.updated_at,
    })),
    blocking_reasons: blockingReasons,
    recent_runs: (workflowRuns.workflow_runs ?? [])
      .filter((run) => run.name === vault.workflows.mainPipeline || run.name === 'eta-mu-review-gate' || run.name === '.github/workflows/eta-mu.yml')
      .slice(0, 8)
      .map((run) => ({
        name: run.name,
        branch: run.head_branch,
        event: run.event,
        status: run.status,
        conclusion: run.conclusion,
        url: run.html_url,
      })),
  };
};

const resolveVaultState = async (vault, github) => {
  if (vault.id === 'proxx') {
    return buildProxxState(vault, github);
  }
  if (vault.id === 'voxx') {
    return buildVoxxState(vault, github);
  }

  return {
    vault: {
      id: vault.id,
      display_name: vault.displayName,
      repo: vault.repo,
      flow_kind: vault.flowKind,
    },
    observed_at: new Date().toISOString(),
    stage: 'unknown',
    status: 'blocked',
    summary: 'No resolver exists for this vault yet.',
    next_action: 'author a vault resolver',
    eligible_actions: {},
    blocking_reasons: ['missing vault resolver'],
    recent_runs: [],
  };
};

const buildPromotionPrTitle = (vault) => vault.promotionPrTitle ?? `Promote ${vault.branches.staging} to ${vault.branches.main}`;

const buildPromotionPrBody = (vault, state) => {
  const stagingChecks = state.staging?.checks ?? {};
  return [
    'Automated promotion PR opened by eta-mu control plane.',
    '',
    `Vault: ${vault.displayName}`,
    `Repo: ${vault.repo}`,
    `Source branch: ${vault.branches.staging}`,
    `Target branch: ${vault.branches.main}`,
    `Observed at: ${state.observed_at}`,
    '',
    'Gate snapshot:',
    `- ${vault.workflows.deployStaging}: ${stagingChecks[vault.workflows.deployStaging] ?? 'unknown'}`,
    `- ${vault.workflows.stagingE2e}: ${stagingChecks[vault.workflows.stagingE2e] ?? 'unknown'}`,
    '',
    'This PR was opened because the staging branch satisfied the current promotion gates.',
  ].join('\n');
};

export const createControlPlaneService = ({
  githubToken,
  receiptsPath,
  automationEnabled = true,
  automationIntervalMs = 300_000,
  automationVaults = ['proxx'],
  logger = console,
}) => {
  const github = createGitHubClient({ token: githubToken, ttlMs: 60_000 });
  const resolvedReceiptsPath = receiptsPath ? path.resolve(receiptsPath) : null;
  let automationTimer = null;
  let automationInFlight = false;

  const recordReceipt = async (receipt) => {
    if (!resolvedReceiptsPath) {
      return;
    }
    await appendJsonlRecord(resolvedReceiptsPath, {
      record: 'ημ.control-plane-receipt.v1',
      time: new Date().toISOString(),
      ...receipt,
    });
  };

  const getVaultState = async (vaultId) => {
    const vault = getVault(vaultId);
    if (!vault) {
      return null;
    }
    return resolveVaultState(vault, github);
  };

  const listVaultStates = async () => Promise.all(listVaults().map((vault) => resolveVaultState(vault, github)));

  const listReceipts = async (limit = 50) => {
    if (!resolvedReceiptsPath) {
      return [];
    }
    const rows = await readJsonlFile(resolvedReceiptsPath);
    return rows.slice(-Math.max(1, Math.min(500, Number(limit ?? 50)))).reverse();
  };

  const ensureMainPromotionPr = async (vaultId, trigger = 'manual') => {
    const vault = getVault(vaultId);
    if (!vault) {
      return { ok: false, reason: 'unknown vault' };
    }

    if (vault.flowKind !== 'staging-main') {
      return { ok: false, reason: 'vault is not staging-first' };
    }

    if (!github.hasAuth) {
      return { ok: false, reason: 'GitHub token is required for actuation' };
    }

    const state = await resolveVaultState(vault, github);
    const action = state.eligible_actions?.open_main_promotion_pr;
    if (!action?.allowed) {
      return {
        ok: false,
        reason: action?.reason ?? 'promotion PR is not eligible to open',
        state,
      };
    }

    try {
      const pr = await github.mutateJson('POST', `/repos/${vault.repo}/pulls`, {
        title: buildPromotionPrTitle(vault),
        head: vault.branches.staging,
        base: vault.branches.main,
        body: buildPromotionPrBody(vault, state),
      });

      await recordReceipt({
        vault_id: vault.id,
        repo: vault.repo,
        action: 'open_main_promotion_pr',
        trigger,
        stage_before: state.stage,
        head_ref: vault.branches.staging,
        base_ref: vault.branches.main,
        head_sha: state.staging?.head_sha ?? null,
        pr_number: pr?.number ?? null,
        pr_url: pr?.html_url ?? null,
      });

      logger.info?.({ vault: vault.id, pr: pr?.number, trigger }, 'opened main promotion PR');

      return {
        ok: true,
        action: 'open_main_promotion_pr',
        trigger,
        pr: pr
          ? {
              number: pr.number,
              title: pr.title,
              url: pr.html_url,
            }
          : null,
      };
    } catch (error) {
      if (error?.statusCode === 422) {
        github.clear();
        const refreshed = await resolveVaultState(vault, github);
        return {
          ok: true,
          action: 'noop_existing_promotion_pr',
          trigger,
          reason: 'GitHub reports an existing or duplicate promotion PR',
          state: refreshed,
        };
      }
      logger.error?.({ vault: vault.id, trigger, error: error instanceof Error ? error.message : String(error) }, 'failed to open main promotion PR');
      return {
        ok: false,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  };

  const tickAutomation = async () => {
    if (!automationEnabled || !github.hasAuth) {
      return [];
    }

    const results = [];
    for (const vaultId of automationVaults) {
      const result = await ensureMainPromotionPr(vaultId, 'scheduler');
      if (result.ok) {
        results.push({ vaultId, ...result });
      }
    }
    return results;
  };

  const startAutomationLoop = () => {
    if (!automationEnabled) {
      logger.info?.({ automationEnabled }, 'eta-mu automation loop disabled');
      return () => {};
    }

    const run = async () => {
      if (automationInFlight) {
        return;
      }
      automationInFlight = true;
      try {
        await tickAutomation();
      } catch (error) {
        logger.error?.({ error: error instanceof Error ? error.message : String(error) }, 'eta-mu automation tick failed');
      } finally {
        automationInFlight = false;
      }
    };

    void run();
    automationTimer = setInterval(() => {
      void run();
    }, automationIntervalMs);
    automationTimer.unref?.();

    logger.info?.({ automationIntervalMs, automationVaults }, 'eta-mu automation loop started');

    return () => {
      if (automationTimer) {
        clearInterval(automationTimer);
        automationTimer = null;
      }
    };
  };

  return {
    getVaultState,
    listVaultStates,
    listReceipts,
    ensureMainPromotionPr,
    startAutomationLoop,
  };
};

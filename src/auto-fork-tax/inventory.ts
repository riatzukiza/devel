import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { discoverGitmodules } from "../nss/gitmodules";

import { formatHttpsSlug, parseGithubSlug } from "./github";
import { listRemotes, removeRemote, repoPath, setRemoteUrl } from "./git";
import type { ForkTarget, RepoSlug, SubmoduleForkPlan } from "./types";

export interface InventoryConfig {
  readonly root: string;
  readonly ownedOrganizations: readonly string[];
  readonly defaultForkOwner: string;
  readonly sourceOwnerOverrides: Readonly<Record<string, string>>;
}

const sourceRemoteFor = (origin: ReturnType<typeof listRemotes> extends Promise<infer T> ? T[number] : never | null, upstream: ReturnType<typeof listRemotes> extends Promise<infer T> ? T[number] : never | null, ownedOrganizations: readonly string[]) => {
  if (upstream?.slug) {
    return { slug: upstream.slug, remoteUrl: upstream.fetchUrl };
  }
  if (!origin?.slug) {
    return null;
  }
  return { slug: origin.slug, remoteUrl: origin.fetchUrl };
};

const desiredForkOwnerFor = (
  repoPathValue: string,
  source: RepoSlug,
  config: InventoryConfig,
): string => {
  const override = config.sourceOwnerOverrides[source.owner];
  if (override) {
    return override;
  }
  if (config.ownedOrganizations.includes(source.owner)) {
    return source.owner;
  }
  const pathParts = repoPathValue.split("/");
  const orgSegment = pathParts[1] ?? "";
  if (config.ownedOrganizations.includes(orgSegment)) {
    return orgSegment;
  }
  return config.defaultForkOwner;
};

export const buildForkPlan = async (config: InventoryConfig): Promise<readonly SubmoduleForkPlan[]> => {
  const entries = await discoverGitmodules({ root: config.root });
  const plans: SubmoduleForkPlan[] = [];

  for (const entry of entries) {
    const cwd = entry.absolutePath;
    let remotes: readonly RemoteInfo[] = [];
    try {
      remotes = await listRemotes(cwd);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      plans.push({
        path: entry.path,
        remotes: [],
        origin: null,
        upstream: null,
        target: null,
        needsFork: false,
        needsOriginRewrite: false,
        needsUpstream: false,
        localOnly: true,
        reasons: [`submodule repo unavailable: ${message}`],
      });
      continue;
    }
    const origin = remotes.find((remote) => remote.name === "origin") ?? null;
    const upstream = remotes.find((remote) => remote.name === "upstream") ?? null;
    const localOnly = origin?.slug == null && upstream?.slug == null;
    const reasons: string[] = [];

    if (localOnly) {
      reasons.push("local-only or non-GitHub remote");
      plans.push({
        path: entry.path,
        remotes,
        origin,
        upstream,
        target: null,
        needsFork: false,
        needsOriginRewrite: false,
        needsUpstream: false,
        localOnly: true,
        reasons,
      });
      continue;
    }

    const sourceRemote = sourceRemoteFor(origin, upstream, config.ownedOrganizations);
    if (!sourceRemote) {
      reasons.push("no parseable GitHub source remote");
      plans.push({
        path: entry.path,
        remotes,
        origin,
        upstream,
        target: null,
        needsFork: false,
        needsOriginRewrite: false,
        needsUpstream: false,
        localOnly: false,
        reasons,
      });
      continue;
    }

    const desiredOwner = desiredForkOwnerFor(entry.path, sourceRemote.slug, config);
    const desiredOrigin: RepoSlug = { owner: desiredOwner, name: sourceRemote.slug.name };
    const target: ForkTarget = {
      source: sourceRemote.slug,
      desiredOrigin,
      sourceRemoteUrl: sourceRemote.remoteUrl,
    };

    const needsFork = desiredOrigin.owner !== sourceRemote.slug.owner && origin?.slug?.owner !== desiredOrigin.owner;
    const needsOriginRewrite = origin?.slug?.owner !== desiredOrigin.owner || origin?.slug?.name !== desiredOrigin.name;
    const needsUpstream = desiredOrigin.owner !== sourceRemote.slug.owner && (upstream?.slug?.owner !== sourceRemote.slug.owner || upstream?.slug?.name !== sourceRemote.slug.name);

    if (needsFork) {
      reasons.push(`origin should move to owned fork ${desiredOrigin.owner}/${desiredOrigin.name}`);
    }
    if (needsUpstream) {
      reasons.push(`upstream should point at ${sourceRemote.slug.owner}/${sourceRemote.slug.name}`);
    }
    if (!needsFork && !needsUpstream && !needsOriginRewrite) {
      reasons.push("origin/upstream already match desired fork policy");
    }

    plans.push({
      path: entry.path,
      remotes,
      origin,
      upstream,
      target,
      needsFork,
      needsOriginRewrite,
      needsUpstream,
      localOnly: false,
      reasons,
    });
  }

  return plans.sort((left, right) => left.path.localeCompare(right.path));
};

export const applyRemotePlan = async (root: string, plan: SubmoduleForkPlan): Promise<void> => {
  if (!plan.target) {
    return;
  }
  const cwd = repoPath(root, plan.path);
  const desiredOriginUrl = formatHttpsSlug(plan.target.desiredOrigin);
  await setRemoteUrl(cwd, "origin", desiredOriginUrl);
  if (plan.needsUpstream) {
    await setRemoteUrl(cwd, "upstream", formatHttpsSlug(plan.target.source));
  }

  const preserve = new Set(["origin", "upstream", "legacy-services-local"]);
  for (const remote of plan.remotes) {
    if (preserve.has(remote.name)) {
      continue;
    }
    const duplicatesOrigin = remote.slug?.owner === plan.target.desiredOrigin.owner
      && remote.slug?.name === plan.target.desiredOrigin.name;
    const duplicatesUpstream = remote.slug?.owner === plan.target.source.owner
      && remote.slug?.name === plan.target.source.name;
    if (duplicatesOrigin || duplicatesUpstream) {
      await removeRemote(cwd, remote.name);
    }
  }
};

export const writeInventoryReport = async (
  root: string,
  plans: readonly SubmoduleForkPlan[],
): Promise<string> => {
  const reportPath = path.join(root, ".ημ", "auto-fork-tax", "inventory.json");
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), plans }, null, 2)}\n`, "utf8");
  return reportPath;
};

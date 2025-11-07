import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  LATEST_MANIFEST_VERSION,
  type AuthStrategy,
  type ManifestProfile,
  type NestedSubmoduleManifest,
  type RepoCategory,
  type RepoManifestEntry
} from './schema';
import { discoverGitmodules, type GitmoduleEntry } from './gitmodules';

export interface GenerateManifestOptions {
  readonly root: string;
  readonly generatorVersion?: string;
}

export interface WriteManifestOptions {
  readonly outputPath: string;
  readonly force?: boolean;
}

const inferCategory = (entry: GitmoduleEntry): RepoCategory => {
  const normalizedPath = entry.path.toLowerCase();
  if (entry.url.startsWith('./')) {
    if (normalizedPath.includes('test') || normalizedPath.includes('qa')) {
      return 'test';
    }
    return 'local';
  }
  if (normalizedPath.includes('test') || normalizedPath.includes('fixture')) {
    return 'test';
  }
  if (normalizedPath.includes('sandbox') || normalizedPath.includes('experiments')) {
    return 'sandbox';
  }
  if (normalizedPath.includes('docs') || normalizedPath.includes('tools')) {
    return 'support';
  }
  return 'core';
};

const inferAuthStrategy = (entry: GitmoduleEntry): AuthStrategy => {
  if (entry.url.startsWith('./')) {
    return {
      type: 'local',
      relativePath: entry.url
    };
  }

  if (entry.url.startsWith('http://') || entry.url.startsWith('https://')) {
    return {
      type: 'https',
      tokenEnv: 'NSS_GIT_HTTP_TOKEN'
    };
  }

  if (entry.url.startsWith('org-') && entry.url.includes('@github.com:')) {
    return {
      type: 'github-app',
      appIdEnv: 'NSS_GITHUB_APP_ID',
      installationIdEnv: 'NSS_GITHUB_INSTALLATION_ID'
    };
  }

  return {
    type: 'ssh',
    identityFile: '~/.ssh/id_rsa',
    useAgent: true
  };
};

const unique = <T>(values: ReadonlyArray<T>): ReadonlyArray<T> => {
  const seen = new Set<T>();
  const result: T[] = [];
  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }
  return result;
};

const createProfiles = (repositories: ReadonlyArray<RepoManifestEntry>): ReadonlyArray<ManifestProfile> => {
  const allRepoNames = repositories.map((repo) => repo.name);
  const workstation = repositories
    .filter((repo) => repo.category !== 'test' && repo.category !== 'sandbox')
    .map((repo) => repo.name);
  const ci = repositories
    .filter((repo) => repo.category === 'core' || repo.category === 'support')
    .map((repo) => repo.name);

  return [
    {
      name: 'all',
      description: 'Every repository managed by the manifest.',
      include: unique(allRepoNames)
    },
    {
      name: 'workstation',
      description: 'Default workstation profile excluding test/sandbox repositories.',
      include: unique(workstation),
      exclude: unique(
        repositories
          .filter((repo) => repo.category === 'test' || repo.category === 'sandbox')
          .map((repo) => repo.name)
      )
    },
    {
      name: 'ci',
      description: 'Continuous integration focused profile.',
      include: unique(ci)
    }
  ];
};

const createRepositoryEntry = (
  root: string,
  entry: GitmoduleEntry
): RepoManifestEntry => {
  const category = inferCategory(entry);
  const auth = inferAuthStrategy(entry);
  const dependsOn = entry.parent === '.' ? undefined : [entry.parent];
  const branch = category === 'test' || category === 'sandbox' ? undefined : 'main';

  return {
    name: entry.name,
    path: entry.path,
    url: entry.url,
    depth: entry.depth,
    category,
    auth,
    branch,
    dependsOn,
    metadata: {
      absolutePath: entry.absolutePath,
      parent: entry.parent,
      workspaceRoot: root
    }
  };
};

export const generateManifestFromWorkspace = async (
  options: GenerateManifestOptions
): Promise<NestedSubmoduleManifest> => {
  const root = path.resolve(options.root);
  const gitmoduleEntries = await discoverGitmodules({ root });
  const repositories = gitmoduleEntries.map((entry) => createRepositoryEntry(root, entry));

  const manifest: NestedSubmoduleManifest = {
    version: LATEST_MANIFEST_VERSION,
    generatedAt: new Date().toISOString(),
    root,
    generator: {
      name: 'nss manifest init',
      version: options.generatorVersion ?? '0.1.0'
    },
    repositories,
    profiles: createProfiles(repositories)
  };

  return manifest;
};

const ensureDirectory = async (targetPath: string): Promise<void> => {
  const directory = path.dirname(targetPath);
  await fs.mkdir(directory, { recursive: true });
};

export const writeManifestToFile = async (
  manifest: NestedSubmoduleManifest,
  options: WriteManifestOptions
): Promise<void> => {
  const absoluteOutput = path.resolve(options.outputPath);
  try {
    if (!options.force) {
      await fs.access(absoluteOutput);
      throw new Error(`Manifest already exists at ${absoluteOutput}. Use --force to overwrite.`);
    }
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code !== 'ENOENT' && !options.force) {
      throw error;
    }
  }

  await ensureDirectory(absoluteOutput);
  const formatted = `${JSON.stringify(manifest, null, 2)}\n`;
  await fs.writeFile(absoluteOutput, formatted, 'utf8');
};

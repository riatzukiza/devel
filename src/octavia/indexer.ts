import crypto from 'node:crypto';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { openOctaviaCache } from './lmdb';

import {
  BUILTIN_BINARIES,
  EXTRA_PACKAGE_ENTRYPOINTS,
  EXTRA_SCRIPT_FILES,
  INDEX_FILENAME,
  LMDB_DIRECTORY_NAME,
  OCTAVIA_STATE_DIRECTORY,
  IGNORED_DIRECTORIES,
} from './constants';
import {
  collectScriptFilesRecursively,
  ensureDirectory,
  extractCommanderSubcommands,
  PackageJson,
  pathSegments,
  readFileSafe,
  readFirstLine,
  readJsonFile,
} from './fs-utils';
import { resolveWorkspaceRoot } from './root';
import { AliasSet, DiscoveredCommand, ExecutionRecipe, IndexRecord, RuntimeKind } from './types';

const stripExtension = (fileName: string): string => fileName.replace(/\.[^.]+$/, '');

const SUPPORTED_EXTENSIONS: Record<string, ExecutionRecipe['kind'] | undefined> = {
  '.ts': 'file',
  '.tsx': 'file',
  '.js': 'file',
  '.mjs': 'file',
  '.cjs': 'file',
  '.sh': 'file',
  '.bash': 'file',
  '.py': 'file',
  '.runjs': 'file',
};

const EXTENSION_RUNTIME: Record<string, RuntimeKind> = {
  '.ts': 'bun',
  '.tsx': 'bun',
  '.js': 'node',
  '.mjs': 'node',
  '.cjs': 'node',
  '.runjs': 'node',
  '.sh': 'bash',
  '.bash': 'bash',
  '.py': 'python3',
};

const DEFAULT_RUNTIME: RuntimeKind = 'sh';

const createId = (value: string): string =>
  createHash('sha1').update(value).digest('hex');

const createAlias = (tokens: readonly string[]): AliasSet => ({
  tokens: tokens.map((token) => token.toLowerCase()),
  label: tokens.join('/'),
});

const determineRuntime = (filePath: string, shebang?: string): RuntimeKind | undefined => {
  if (shebang) {
    return 'shebang';
  }
  const ext = path.extname(filePath).toLowerCase();
  return EXTENSION_RUNTIME[ext] ?? DEFAULT_RUNTIME;
};

const shouldTrackFile = (filePath: string, hasShebang: boolean): boolean => {
  if (hasShebang) {
    return true;
  }
  const ext = path.extname(filePath).toLowerCase();
  if (SUPPORTED_EXTENSIONS[ext]) {
    return true;
  }
  return false;
};

const createFileCommand = async (
  root: string,
  filePath: string,
): Promise<DiscoveredCommand | undefined> => {
  const content = await readFileSafe(filePath);
  const shebangLine = content?.startsWith('#!') ? readFirstLine(content ?? '') : undefined;

  if (!shouldTrackFile(filePath, Boolean(shebangLine))) {
    return undefined;
  }

  const runtime = determineRuntime(filePath, shebangLine);
  if (!runtime) {
    return undefined;
  }

  const relativeSegments = pathSegments(root, filePath);
  const baseName = path.basename(filePath);
  const aliasSets: AliasSet[] = [
    createAlias(relativeSegments),
  ];

  const stem = stripExtension(baseName);
  aliasSets.push(createAlias([...relativeSegments.slice(0, -1), stem]));

  const commanderSubcommands = content ? extractCommanderSubcommands(content) : [];

  return {
    id: createId(`file:${relativeSegments.join('/')}`),
    kind: 'file',
    name: stem,
    relativePath: relativeSegments.join('/'),
    aliasSets,
    commanderSubcommands,
    execution: {
      kind: 'file',
      absolutePath: path.join(root, ...relativeSegments),
      workingDirectory: path.dirname(path.join(root, ...relativeSegments)),
      runtime,
      shebang: shebangLine,
    },
  };
};

const packageNameTokens = (pkgName: string | undefined): string[] => {
  if (!pkgName) return [];
  return pkgName.replace(/^@/, '').split(/[\/]/g).filter(Boolean);
};

const createPackageScriptCommand = (
  root: string,
  packageDir: string,
  pkg: PackageJson,
  scriptName: string,
  scriptCommand: string,
): DiscoveredCommand => {
  const relSegments = pathSegments(root, packageDir);
  const aliasSets: AliasSet[] = [
    createAlias([...relSegments, 'package.json', scriptName]),
  ];

  const pkgTokens = packageNameTokens(pkg.name);
  if (pkgTokens.length > 0) {
    aliasSets.push(createAlias([...pkgTokens, scriptName]));
  }
  aliasSets.push(createAlias([stripExtension(relSegments[relSegments.length - 1] ?? scriptName), scriptName]));

  return {
    id: createId(`pkg:${relSegments.join('/')}:${scriptName}`),
    kind: 'package-script',
    name: scriptName,
    relativePath: relSegments.join('/'),
    description: scriptCommand,
    aliasSets,
    execution: {
      kind: 'package-script',
      packageDirectory: packageDir,
      scriptName,
    },
  };
};

const createBuiltinCommands = (root: string): DiscoveredCommand[] =>
  BUILTIN_BINARIES.map((entry) => ({
    id: createId(`builtin:${entry.name}`),
    kind: 'binary',
    name: entry.name,
    description: entry.description,
    aliasSets: [createAlias([entry.name])],
    execution: {
      kind: 'binary',
      command: entry.name,
    },
  }));

const discoverScriptsAndPackages = async (root: string): Promise<DiscoveredCommand[]> => {
  const commands: DiscoveredCommand[] = [];
  const queue: string[] = [root];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch (error) {
      continue;
    }

    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) {
          continue;
        }
        if (entry.name === 'scripts' || entry.name === 'bin') {
          const files = await collectScriptFilesRecursively(entryPath);
          for (const filePath of files) {
            const command = await createFileCommand(root, filePath);
            if (command) {
              commands.push(command);
            }
          }
          continue;
        }
        queue.push(entryPath);
        continue;
      }

      if (entry.isFile() && entry.name === 'package.json') {
        const pkg = await readJsonFile<PackageJson>(entryPath);
        if (!pkg?.scripts) {
          continue;
        }
        const packageDir = path.dirname(entryPath);
        for (const [scriptName, scriptCommand] of Object.entries(pkg.scripts)) {
          const command = createPackageScriptCommand(root, packageDir, pkg, scriptName, scriptCommand);
          commands.push(command);
        }
      }
    }
  }

  for (const extra of EXTRA_PACKAGE_ENTRYPOINTS) {
    const absolute = path.join(root, extra);
    try {
      await fs.access(absolute);
      const command = await createFileCommand(root, absolute);
      if (command) {
        commands.push(command);
      }
    } catch (error) {
      // ignore missing
    }
  }

  for (const extraScript of EXTRA_SCRIPT_FILES) {
    const absolute = path.join(root, extraScript);
    try {
      await fs.access(absolute);
      const command = await createFileCommand(root, absolute);
      if (command) {
        commands.push(command);
      }
    } catch (error) {
      // ignore missing
    }
  }

  return commands;
};

const discoverDaemonDistConfigs = async (root: string): Promise<DiscoveredCommand[]> => {
  const commands: DiscoveredCommand[] = [];
  const daemonRoot = path.join(root, 'system', 'daemons');
  try {
    await fs.access(daemonRoot);
  } catch (error) {
    return commands;
  }

  const stack: string[] = [daemonRoot];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch (error) {
      continue;
    }

    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
        continue;
      }
      if (entry.isFile() && entry.name === 'ecosystem.config.mjs' && entryPath.includes(`${path.sep}dist${path.sep}`)) {
        const command = await createFileCommand(root, entryPath);
        if (command) {
          commands.push(command);
        }
      }
    }
  }

  return commands;
};

const attachUniqueAliases = (commands: DiscoveredCommand[]): void => {
  const counts = new Map<string, number>();
  const aliasRecords: Array<{ command: DiscoveredCommand; alias: AliasSet }> = [];

  for (const command of commands) {
    const key = command.name.toLowerCase();
    aliasRecords.push({ command, alias: createAlias([command.name]) });
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  for (const { command, alias } of aliasRecords) {
    const key = command.name.toLowerCase();
    if ((counts.get(key) ?? 0) === 1) {
      const already = command.aliasSets.some((existing) => existing.label === alias.label);
      if (!already) {
        (command.aliasSets as AliasSet[]).push(alias);
      }
    }
  }
};

const persistIndexFile = async (root: string, commands: readonly DiscoveredCommand[]): Promise<string> => {
  const indexPath = path.join(root, INDEX_FILENAME);
  const payload = commands
    .map<IndexRecord>((command) => ({
      id: command.id,
      kind: command.kind,
      name: command.name,
      relativePath: command.relativePath,
      execution: command.execution,
      aliasSets: command.aliasSets,
      commanderSubcommands: command.commanderSubcommands,
    }))
    .map((record) => JSON.stringify(record))
    .join('\n');

  await fs.writeFile(indexPath, `${payload}\n`, 'utf8');
  return indexPath;
};

const persistLmdbCache = async (root: string, commands: readonly DiscoveredCommand[]): Promise<void> => {
  const lmdbPath = path.join(root, OCTAVIA_STATE_DIRECTORY, LMDB_DIRECTORY_NAME);
  await ensureDirectory(lmdbPath);
  const cache = openOctaviaCache({ path: lmdbPath, namespace: 'octavia' });
  const commandCache = cache.withNamespace('commands');
  const aliasCache = cache.withNamespace('aliases');

  await commandCache.batch(
    commands.map((command) => ({ type: 'put', key: command.id, value: command })),
  );

  const aliasOps = commands.flatMap((command) =>
    command.aliasSets.map((aliasSet) => ({
      type: 'put' as const,
      key: aliasSet.tokens.join('/'),
      value: command.id,
    })),
  );

  await aliasCache.batch(aliasOps);
  await cache.close();
};

const loadIndexFile = async (indexPath: string): Promise<DiscoveredCommand[]> => {
  const content = await fs.readFile(indexPath, 'utf8');
  return content
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line): line is string => line.length > 0)
    .map((line) => JSON.parse(line) as IndexRecord);
};

export interface EnsureIndexOptions {
  readonly root?: string;
  readonly force?: boolean;
}

export const discoverAndPersist = async (
  options: EnsureIndexOptions = {},
): Promise<DiscoveredCommand[]> => {
  const root = resolveWorkspaceRoot(options.root);
  await ensureDirectory(path.join(root, OCTAVIA_STATE_DIRECTORY));
  const commands = [
    ...createBuiltinCommands(root),
    ...(await discoverScriptsAndPackages(root)),
    ...(await discoverDaemonDistConfigs(root)),
  ];
  attachUniqueAliases(commands);
  await persistIndexFile(root, commands);
  await persistLmdbCache(root, commands);
  return commands;
};

export const ensureIndex = async (options: EnsureIndexOptions = {}): Promise<DiscoveredCommand[]> => {
  const root = resolveWorkspaceRoot(options.root);
  const indexPath = path.join(root, INDEX_FILENAME);
  if (!options.force) {
    try {
      await fs.access(indexPath);
      const commands = await loadIndexFile(indexPath);
      return commands as DiscoveredCommand[];
    } catch (error) {
      // rebuild below
    }
  }

  return discoverAndPersist({ root });
};

export const listCommands = async (options: EnsureIndexOptions = {}): Promise<DiscoveredCommand[]> =>
  ensureIndex(options);

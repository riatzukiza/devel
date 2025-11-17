import { promises as fs } from 'node:fs';
import path from 'node:path';

import { IGNORED_DIRECTORIES, SCRIPT_DIRECTORY_NAMES } from './constants';

export interface PackageJson {
  readonly scripts?: Record<string, string>;
  readonly bin?: Record<string, string> | string;
  readonly name?: string;
}

export const readJsonFile = async <T = unknown>(filePath: string): Promise<T | undefined> => {
  try {
    const buffer = await fs.readFile(filePath, 'utf8');
    return JSON.parse(buffer) as T;
  } catch (error) {
    return undefined;
  }
};

export const readFileSafe = async (filePath: string): Promise<string | undefined> => {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    return undefined;
  }
};

export const pathSegments = (root: string, target: string): string[] => {
  const relative = path.relative(root, target);
  return relative.split(path.sep).filter(Boolean);
};

export const isIgnoredDirectory = (name: string): boolean => IGNORED_DIRECTORIES.has(name);

export const isScriptDirectory = (name: string): boolean => SCRIPT_DIRECTORY_NAMES.has(name);

export const collectImmediateFiles = async (dirPath: string): Promise<ReadonlyArray<string>> => {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.isFile()) {
      files.push(path.join(dirPath, entry.name));
    }
  }
  return files;
};

export const collectScriptFilesRecursively = async (dirPath: string): Promise<ReadonlyArray<string>> => {
  const results: string[] = [];
  const stack: string[] = [dirPath];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch (error) {
      continue;
    }

    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isFile()) {
        results.push(entryPath);
        continue;
      }
      if (entry.isDirectory()) {
        if (isIgnoredDirectory(entry.name)) continue;
        stack.push(entryPath);
      }
    }
  }

  return results;
};

export const ensureDirectory = async (dirPath: string): Promise<void> => {
  await fs.mkdir(dirPath, { recursive: true });
};

export const readFirstLine = (content: string): string | undefined => {
  const endIndex = content.indexOf('\n');
  if (endIndex === -1) return content.trim();
  return content.slice(0, endIndex).trim();
};

export const hasCommanderImport = (content: string): boolean =>
  /from\s+['"]commander['"]/.test(content) || /require\(['"]commander['"]\)/.test(content);

export const extractCommanderSubcommands = (content: string): readonly string[] => {
  if (!hasCommanderImport(content)) {
    return [];
  }
  const matches = new Set<string>();
  const commandPattern = /\.command\(\s*['"]([^'"\s]+)['"][^)]*\)/g;
  let match: RegExpExecArray | null;
  while ((match = commandPattern.exec(content)) !== null) {
    matches.add(match[1]);
  }
  return Array.from(matches);
};

export const walkWorkspace = async (
  root: string,
  onDirectory: (directory: string) => Promise<void>,
  onFile: (file: string) => Promise<void>,
): Promise<void> => {
  const stack: string[] = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch (error) {
      continue;
    }

    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (isIgnoredDirectory(entry.name)) {
          continue;
        }
        await onDirectory(entryPath);
        stack.push(entryPath);
        continue;
      }
      if (entry.isFile()) {
        await onFile(entryPath);
      }
    }
  }
};

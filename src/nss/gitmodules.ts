import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface GitmoduleRecord {
  readonly name: string;
  readonly path: string;
  readonly url: string;
}

export interface GitmoduleEntry extends GitmoduleRecord {
  readonly absolutePath: string;
  readonly parent: string;
  readonly depth: number;
}

const sectionPattern = /^\s*\[submodule\s+"(?<name>[^"]+)"\]\s*$/;
const kvPattern = /^\s*(?<key>[A-Za-z0-9._-]+)\s*=\s*(?<value>.+)\s*$/;

export const parseGitmodules = (content: string): readonly GitmoduleRecord[] => {
  const lines = content.split(/\r?\n/);
  const records: GitmoduleRecord[] = [];
  let current: Partial<GitmoduleRecord> | undefined;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) {
      continue;
    }

    const sectionMatch = sectionPattern.exec(line);
    if (sectionMatch?.groups?.name) {
      if (current?.name && current.path && current.url) {
        records.push({
          name: current.name,
          path: current.path,
          url: current.url
        });
      }
      current = { name: sectionMatch.groups.name };
      continue;
    }

    const match = kvPattern.exec(line);
    if (!match?.groups) {
      continue;
    }

    const { key, value } = match.groups;
    if (!current) {
      current = {};
    }

    if (key === 'path') {
      current.path = value;
    } else if (key === 'url') {
      current.url = value;
    }
  }

  if (current?.name && current.path && current.url) {
    records.push({
      name: current.name,
      path: current.path,
      url: current.url
    });
  }

  return records;
};

const readGitmodulesFile = async (directory: string): Promise<readonly GitmoduleRecord[]> => {
  const filePath = path.join(directory, '.gitmodules');
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return parseGitmodules(content);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

export interface DiscoverOptions {
  readonly root: string;
}

export const discoverGitmodules = async ({ root }: DiscoverOptions): Promise<readonly GitmoduleEntry[]> => {
  const absoluteRoot = path.resolve(root);
  const queue: Array<{ readonly directory: string; readonly depth: number; readonly parent?: string } > = [
    { directory: absoluteRoot, depth: 0 }
  ];
  const visited = new Set<string>();
  const entries: GitmoduleEntry[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    const normalizedDir = path.resolve(current.directory);
    if (visited.has(normalizedDir)) {
      continue;
    }
    visited.add(normalizedDir);

    const records = await readGitmodulesFile(normalizedDir);
    for (const record of records) {
      const absolutePath = path.resolve(normalizedDir, record.path);
      const entry: GitmoduleEntry = {
        name: record.name,
        path: path.relative(absoluteRoot, absolutePath) || '.',
        url: record.url,
        absolutePath,
        parent: current.parent ?? path.relative(absoluteRoot, normalizedDir) || '.',
        depth: current.depth + 1
      };
      entries.push(entry);
      queue.push({ directory: absolutePath, depth: current.depth + 1, parent: entry.path });
    }
  }

  return entries;
};

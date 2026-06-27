import { execSync } from 'node:child_process';
import path from 'node:path';

export const resolveWorkspaceRoot = (start: string = process.cwd()): string => {
  if (process.env.OCTAVIA_ROOT) {
    return path.resolve(process.env.OCTAVIA_ROOT);
  }

  try {
    const output = execSync('git rev-parse --show-toplevel', {
      cwd: start,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const resolved = output.trim();
    if (resolved) {
      return resolved;
    }
  } catch (error) {
    // ignore, fallback to start directory
  }

  return path.resolve(start);
};

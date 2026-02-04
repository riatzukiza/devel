export const INDEX_FILENAME = 'index.jsonl';
export const OCTAVIA_STATE_DIRECTORY = '.octavia';
export const LMDB_DIRECTORY_NAME = 'lmdb';

export const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.hg',
  '.svn',
  '.pnpm-store',
  '.yarn',
  '.turbo',
  '.nx',
  '.cache',
  '.octavia',
  'node_modules',
  'dist',
  'build',
  'tmp',
  'logs',
]);

export const SCRIPT_DIRECTORY_NAMES = new Set(['scripts', 'bin']);

export const BUILTIN_BINARIES = [
  { name: 'pm2', description: 'Process manager for Node daemons' },
  { name: 'pnpm', description: 'Workspace package manager' },
  { name: 'bun', description: 'Bun runtime' },
  { name: 'opencode', description: 'OpenCode CLI entrypoint' },
  { name: 'uv', description: 'uv Python package manager' },
  { name: 'git', description: 'git source control' },
];

export const EXTRA_PACKAGE_ENTRYPOINTS = [
  'orgs/riatzukiza/promethean/packages/autocommit/src/cli.ts',
  'orgs/riatzukiza/promethean/packages/opencode-client/src/cli.ts',
  'orgs/riatzukiza/promethean/packages/pipelines/piper/src/index.ts',
];

export const EXTRA_SCRIPT_FILES = [
  'ecosystem.config.enhanced.mjs',
];

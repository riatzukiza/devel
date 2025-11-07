import path from 'node:path';
import process from 'node:process';

import { generateManifestFromWorkspace, writeManifestToFile } from './manifest-init';

interface ParsedArguments {
  readonly positionals: ReadonlyArray<string>;
  readonly flags: Record<string, string | boolean>;
}

const parseArguments = (argv: ReadonlyArray<string>): ParsedArguments => {
  const flags: Record<string, string | boolean> = {};
  const positionals: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token.startsWith('--')) {
      const [rawKey, rawValue] = token.slice(2).split('=');
      const key = rawKey.trim();
      if (!key) {
        continue;
      }
      if (rawValue !== undefined) {
        flags[key] = rawValue;
        continue;
      }
      const next = argv[index + 1];
      if (next && !next.startsWith('-')) {
        flags[key] = next;
        index += 1;
      } else {
        flags[key] = true;
      }
      continue;
    }

    if (token.startsWith('-')) {
      const key = token.slice(1);
      if (key === 'f') {
        flags.force = true;
        continue;
      }
      positionals.push(token);
      continue;
    }

    positionals.push(token);
  }

  return { flags, positionals };
};

const printHelp = (): void => {
  // eslint-disable-next-line no-console
  console.log(`Nested Submodule Suite (nss)

Usage:
  nss manifest init [--root <path>] [--output <path>] [--force]

Options:
  --root <path>     Workspace root to scan (default: current directory)
  --output <path>   Output manifest file path (default: <root>/nss.manifest.json)
  --force           Overwrite existing manifest file
`);
};

const runManifestInit = async (
  flags: Record<string, string | boolean>,
  positionals: ReadonlyArray<string>
): Promise<void> => {
  if (positionals.length > 2) {
    throw new Error('Too many positional arguments for manifest init');
  }

  const rootFlag = flags.root;
  const outputFlag = flags.output;
  const force = Boolean(flags.force);
  const root = typeof rootFlag === 'string' ? path.resolve(rootFlag) : process.cwd();
  const outputPath = typeof outputFlag === 'string' ? path.resolve(outputFlag) : path.join(root, 'nss.manifest.json');

  const manifest = await generateManifestFromWorkspace({ root });
  await writeManifestToFile(manifest, { outputPath, force });

  // eslint-disable-next-line no-console
  console.log(`Manifest written to ${outputPath}`);
};

const main = async (): Promise<void> => {
  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    printHelp();
    return;
  }

  const { flags, positionals } = parseArguments(argv);
  const [command, subcommand] = positionals;

  if (command === 'manifest' && subcommand === 'init') {
    await runManifestInit(flags, positionals.slice(2));
    return;
  }

  if (command === 'help' || flags.help) {
    printHelp();
    return;
  }

  throw new Error(`Unknown command: ${command ?? '(none)'}`);
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  // eslint-disable-next-line no-console
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});

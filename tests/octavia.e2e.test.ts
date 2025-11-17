import { access, chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

import { discoverAndPersist, ensureIndex } from '../src/octavia/indexer';
import { resolveSelector } from '../src/octavia/selector';
import { executeResolution } from '../src/octavia/runner';
import type { DiscoveredCommand } from '../src/octavia/types';

interface Workspace {
  readonly root: string;
  readonly outputs: {
    readonly shell: string;
    readonly pkg: string;
    readonly mixed: string;
    readonly daemon: string;
  };
  readonly selectors: {
    readonly shellFull: readonly string[];
    readonly shellUnique: readonly string[];
    readonly packageScript: readonly string[];
    readonly mixedBinary: readonly string[];
    readonly aggregate: readonly string[];
    readonly daemon: readonly string[];
  };
  cleanup: () => Promise<void>;
}

const writeExecutable = async (filePath: string, contents: string): Promise<void> => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, 'utf8');
  await chmod(filePath, 0o755);
};

const createMockWorkspace = async (): Promise<Workspace> => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'octavia-e2e-'));
  const artifactsDir = path.join(root, 'artifacts');
  await mkdir(artifactsDir, { recursive: true });

  const shellScript = path.join(root, 'scripts/tools/hello.sh');
  await writeExecutable(
    shellScript,
    '#!/usr/bin/env bash\nset -euo pipefail\nout="$1"\nmsg="$2"\nprintf "shell:%s\\n" "$msg" >> "$out"\n',
  );

  const extensionlessScript = path.join(root, 'orgs/acme/tooling/bin/mixed-runner');
  await writeExecutable(
    extensionlessScript,
    "#!/usr/bin/env node\nconst { appendFileSync } = require('node:fs');\nconst [out, msg] = process.argv.slice(2);\nappendFileSync(out, `mixed:${msg}\\n`);\n",
  );

  const packageDir = path.join(root, 'packages/app');
  await mkdir(path.join(packageDir, 'scripts'), { recursive: true });
  await writeFile(
    path.join(packageDir, 'package.json'),
    JSON.stringify(
      {
        name: 'mock-app',
        version: '1.0.0',
        scripts: {
          emit: 'node ./scripts/pkg-writer.js',
        },
      },
      null,
      2,
    ),
  );
  await writeExecutable(
    path.join(packageDir, 'scripts/pkg-writer.js'),
    "#!/usr/bin/env node\nconst { appendFileSync } = require('node:fs');\nconst args = process.argv.slice(2).filter((entry) => entry !== '--');\nconst [out, msg] = args;\nappendFileSync(out, `pkg:${msg}\\n`);\n",
  );

  const daemonConfig = path.join(root, 'system/daemons/devops/nx-daemon/dist/ecosystem.config.mjs');
  await writeExecutable(
    daemonConfig,
    "#!/usr/bin/env node\nimport { appendFileSync } from 'node:fs';\nconst [out, msg] = process.argv.slice(2);\nappendFileSync(out, `daemon:${msg}\\n`);\n",
  );

  const aggregateConfig = path.join(root, 'ecosystem.config.enhanced.mjs');
  await writeExecutable(
    aggregateConfig,
    "#!/usr/bin/env node\nimport { appendFileSync } from 'node:fs';\nconst [out, msg] = process.argv.slice(2);\nconst value = msg ?? 'default';\nappendFileSync(out, `aggregate:${value}\\n`);\n",
  );

  return {
    root,
    outputs: {
      shell: path.join(artifactsDir, 'shell.txt'),
      pkg: path.join(artifactsDir, 'pkg.txt'),
      mixed: path.join(artifactsDir, 'mixed.txt'),
      daemon: path.join(artifactsDir, 'daemon.txt'),
    },
    selectors: {
      shellFull: ['scripts', 'tools', 'hello.sh'],
      shellUnique: ['hello'],
      packageScript: ['packages', 'app', 'package.json', 'emit'],
      mixedBinary: ['orgs', 'acme', 'tooling', 'bin', 'mixed-runner'],
      aggregate: ['ecosystem.config.enhanced'],
      daemon: ['system', 'daemons', 'devops', 'nx-daemon', 'dist', 'ecosystem.config.mjs'],
    },
    cleanup: async () => {
      await rm(root, { recursive: true, force: true });
    },
  };
};

const expectResolution = (
  tokens: readonly string[],
  commands: readonly DiscoveredCommand[],
) => {
  const resolution = resolveSelector(tokens, commands);
  expect(resolution.ok).toBe(true);
  return resolution;
};

describe('octavia e2e', () => {
  let workspace: Workspace | undefined;

  afterEach(async () => {
    if (workspace) {
      await workspace.cleanup();
      workspace = undefined;
    }
  });

  test('indexes mixed-language hierarchy', async () => {
    workspace = await createMockWorkspace();
    await discoverAndPersist({ root: workspace.root, force: true });
    await access(path.join(workspace.root, 'index.jsonl'));
    await access(path.join(workspace.root, '.octavia', 'lmdb', 'data.mdb'));
    const commands = await ensureIndex({ root: workspace.root });

    const shell = expectResolution(workspace.selectors.shellFull, commands);
    expect(shell.command.relativePath?.endsWith('scripts/tools/hello.sh')).toBe(true);

    const uniqueShell = expectResolution(workspace.selectors.shellUnique, commands);
    expect(uniqueShell.ok).toBe(true);

    const pkgScript = expectResolution(workspace.selectors.packageScript, commands);
    expect(pkgScript.command.kind).toBe('package-script');

    const mixed = expectResolution(workspace.selectors.mixedBinary, commands);
    expect(mixed.command.relativePath).toContain('mixed-runner');

    const aggregate = expectResolution(workspace.selectors.aggregate, commands);
    expect(aggregate.command.relativePath).toBe('ecosystem.config.enhanced.mjs');

    const daemon = expectResolution(workspace.selectors.daemon, commands);
    expect(daemon.command.relativePath).toBe('system/daemons/devops/nx-daemon/dist/ecosystem.config.mjs');
  });

  test('executes scripts via octavia runner', async () => {
    workspace = await createMockWorkspace();
    await discoverAndPersist({ root: workspace.root, force: true });
    const commands = await ensureIndex({ root: workspace.root });

    const runAndRead = async (selector: readonly string[], outPath: string, message: string) => {
      const resolution = expectResolution(selector, commands);
      const detail = {
        command: resolution.command,
        reason: resolution.alias.label,
      } as const;
      await executeResolution(detail, [outPath, message]);
      return readFile(outPath, 'utf8');
    };

    const shellContent = await runAndRead(workspace.selectors.shellFull, workspace.outputs.shell, 'bash');
    expect(shellContent).toContain('shell:bash');

    const mixedContent = await runAndRead(workspace.selectors.mixedBinary, workspace.outputs.mixed, 'node-shebang');
    expect(mixedContent).toContain('mixed:node-shebang');

    const daemonContent = await runAndRead(workspace.selectors.daemon, workspace.outputs.daemon, 'daemon-run');
    expect(daemonContent).toContain('daemon:daemon-run');

    const pkgResolution = expectResolution(workspace.selectors.packageScript, commands);
    const pkgDetail = { command: pkgResolution.command, reason: pkgResolution.alias.label } as const;
    await executeResolution(pkgDetail, [workspace.outputs.pkg, 'pkg-run']);
    const pkgContent = await readFile(workspace.outputs.pkg, 'utf8');
    expect(pkgContent).toContain('pkg:pkg-run');
  });
});

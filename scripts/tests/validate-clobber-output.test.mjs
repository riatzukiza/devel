import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const validatorPath = fileURLToPath(
  new URL('../validate-clobber-output.mjs', import.meta.url),
);

const writeConfig = async (root, config) => {
  const clobberDir = join(root, '.clobber');
  await mkdir(clobberDir, { recursive: true });
  const filePath = join(clobberDir, 'index.cjs');
  await writeFile(filePath, `module.exports = ${JSON.stringify(config, null, 2)};`);
  return filePath;
};

const runValidator = (cwd) =>
  spawnSync(process.execPath, [validatorPath], {
    cwd,
    encoding: 'utf8',
  });

test('passes with a valid file-backed script', async () => {
  const root = await mkdtemp(join(tmpdir(), 'clobber-valid-'));
  try {
    const serviceDir = join(root, 'service');
    const distDir = join(serviceDir, 'dist');
    await mkdir(distDir, { recursive: true });
    await writeFile(join(distDir, 'app.js'), 'console.log("ok")');
    await writeConfig(root, {
      apps: [
        {
          name: 'valid-app',
          script: './dist/app.js',
          cwd: './service',
        },
      ],
    });

    const result = runValidator(root);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /validation passed/i);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('fails when script path is missing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'clobber-missing-'));
  try {
    await mkdir(join(root, 'service'), { recursive: true });
    await writeConfig(root, {
      apps: [
        {
          name: 'missing-script',
          script: './dist/missing.js',
          cwd: './service',
        },
      ],
    });

    const result = runValidator(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Missing script path/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('skips validation when cwd is absent', async () => {
  const root = await mkdtemp(join(tmpdir(), 'clobber-skip-'));
  try {
    await writeConfig(root, {
      apps: [
        {
          name: 'missing-cwd',
          script: './dist/app.js',
          cwd: './missing-service',
        },
      ],
    });

    const result = runValidator(root);
    assert.equal(result.status, 0);
    assert.match(result.stderr, /cwd not found/i);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('fails on duplicate app names', async () => {
  const root = await mkdtemp(join(tmpdir(), 'clobber-duplicate-'));
  try {
    await writeConfig(root, {
      apps: [
        {
          name: 'duplicate-app',
          script: 'node',
          args: ['-e', 'console.log("a")'],
        },
        {
          name: 'duplicate-app',
          script: 'node',
          args: ['-e', 'console.log("b")'],
        },
      ],
    });

    const result = runValidator(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Duplicate app name/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('checks node script when first arg is path-like', async () => {
  const root = await mkdtemp(join(tmpdir(), 'clobber-node-'));
  try {
    const serviceDir = join(root, 'service');
    await mkdir(join(serviceDir, 'dist'), { recursive: true });
    await writeFile(join(serviceDir, 'dist', 'app.js'), 'console.log("ok")');
    await writeConfig(root, {
      apps: [
        {
          name: 'node-app',
          script: 'node',
          args: ['./dist/app.js'],
          cwd: './service',
        },
      ],
    });

    const result = runValidator(root);
    assert.equal(result.status, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('ignores non-path-like command scripts', async () => {
  const root = await mkdtemp(join(tmpdir(), 'clobber-command-'));
  try {
    await writeConfig(root, {
      apps: [
        {
          name: 'command-app',
          script: 'pnpm',
          args: ['run', 'dev'],
        },
      ],
    });

    const result = runValidator(root);
    assert.equal(result.status, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('fails when config is missing apps array', async () => {
  const root = await mkdtemp(join(tmpdir(), 'clobber-empty-'));
  try {
    await writeConfig(root, { ok: true });
    const result = runValidator(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must export \{apps:/i);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('fails when config is not an object', async () => {
  const root = await mkdtemp(join(tmpdir(), 'clobber-nonobject-'));
  try {
    await writeConfig(root, 'not-an-object');
    const result = runValidator(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must export an object/i);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..');
const pm2CljBin = path.join(repoRoot, 'pm2-clj-project', 'bin', 'pm2-clj');

const runPm2CljRender = (filePath: string) => {
  const result = spawnSync(pm2CljBin, ['render', filePath], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(
      `pm2-clj render failed for ${filePath}: ${result.stderr || result.stdout}`,
    );
  }

  return JSON.parse(result.stdout) as { apps: Array<Record<string, unknown>> };
};

describe('pm2-clj parity', () => {
  it('renders OpenHax ecosystem parity', () => {
    const dslPath = path.join(
      repoRoot,
      'orgs',
      'open-hax',
      'openhax',
      'ecosystem.pm2.edn',
    );
    const renderedConfig = runPm2CljRender(dslPath);

    const expectedApps = [
      {
        name: 'agentd',
        cwd: 'services/agentd',
        script: 'dist/index.js',
        interpreter: 'node',
        exec_mode: 'fork',
        instances: 1,
        env_file: 'services/agentd/.env',
        env: {
          NODE_ENV: 'production',
          WEB_PORT: '8787',
        },
        max_restarts: 5,
        restart_delay: 2000,
        autorestart: true,
        watch: false,
      },
      {
        name: 'opencode-reactant',
        cwd: 'packages/opencode-reactant',
        script: 'pnpm',
        args: 'dev',
        interpreter: 'none',
        exec_mode: 'fork',
        instances: 1,
        env: {
          NODE_ENV: 'development',
          REPO_SLUG: 'sst/opencode',
        },
        max_restarts: 5,
        restart_delay: 2000,
        autorestart: true,
        watch: false,
      },
    ];

    expect(renderedConfig.apps).toEqual(expectedApps);
  });

  it('renders Frontend ecosystem parity', () => {
    const dslPath = path.join(
      repoRoot,
      'orgs',
      'riatzukiza',
      'promethean',
      'packages',
      'frontend',
      'ecosystem.pm2.edn',
    );
    const renderedConfig = runPm2CljRender(dslPath);

    const expectedApps = [
      {
        name: 'frontend-main',
        script: 'shadow-cljs',
        args: 'watch main',
        cwd: '/home/err/devel/promethean/packages/frontend',
        interpreter: 'node',
        interpreter_args: '--max-old-space-size=4096',
        watch: false,
        max_memory_restart: '1G',
        env: {
          NODE_ENV: 'development',
          PORT: 3000,
        },
        env_production: {
          NODE_ENV: 'production',
          PORT: 3000,
        },
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        error_file: './logs/main-error.log',
        out_file: './logs/main-out.log',
        log_file: './logs/main-combined.log',
        time: true,
      },
      {
        name: 'frontend-pantheon',
        script: 'vite',
        args: '--port 3001 --host 0.0.0.0',
        cwd: '/home/err/devel/promethean/packages/frontend',
        interpreter: 'node',
        interpreter_args: '--max-old-space-size=4096',
        watch: false,
        max_memory_restart: '1G',
        env: {
          NODE_ENV: 'development',
          PORT: 3001,
        },
        env_production: {
          NODE_ENV: 'production',
          PORT: 3001,
        },
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        error_file: './logs/pantheon-error.log',
        out_file: './logs/pantheon-out.log',
        log_file: './logs/pantheon-combined.log',
        time: true,
      },
    ];

    expect(renderedConfig.apps).toEqual(expectedApps);
  });

  it('renders Sentinel ecosystem parity', () => {
    const dslPath = path.join(
      repoRoot,
      'orgs',
      'riatzukiza',
      'promethean',
      'services',
      'sentinel',
      'ecosystem.pm2.edn',
    );
    const renderedConfig = runPm2CljRender(dslPath);

    const expectedApps = [
      {
        name: 'sentinel',
        script: './dist/sentinel.cjs',
        cwd: '/home/err/devel/orgs/riatzukiza/promethean/services/sentinel',
        interpreter: 'node',
        node_args: '--enable-source-maps',
        env: {
          NODE_ENV: 'production',
          SENTINEL_CONFIG:
            '/home/err/devel/orgs/riatzukiza/promethean/services/sentinel/sentinel.edn',
          SENTINEL_WATCHER_ROOT:
            '/home/err/devel/orgs/riatzukiza/promethean/services/sentinel',
        },
        max_restarts: 5,
        min_uptime: '10s',
        restart_delay: 2000,
        autorestart: true,
        time: true,
      },
    ];

    expect(renderedConfig.apps).toEqual(expectedApps);
  });
});

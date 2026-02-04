import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { setTimeout } from 'node:timers/promises';
import ioPkg from '@pm2/io';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, '..', '.cache');
const STATE_FILE = join(CACHE_DIR, 'serena-updater.json');
const RELEASE_URL = process.env.SERENA_RELEASE_URL ?? 'https://api.github.com/repos/oraios/serena/releases/latest';
const POLL_INTERVAL_MS = Number(process.env.SERENA_CHECK_INTERVAL_MS) || 15 * 60 * 1000;
const RESTART_COMMAND =
  process.env.SERENA_RESTART_COMMAND ?? 'pnpm --dir orgs/riatzukiza/promethean exec pm2 restart serena';

const log = (level, message, ...args) => {
  const prefix = `[serena-updater] [${level.toUpperCase()}]`;
  console.log(prefix, message, ...args);
};

const pm2Module = ioPkg?.default ?? ioPkg;
const pm2Action = typeof pm2Module?.action === 'function' ? pm2Module.action.bind(pm2Module) : null;

const registerPm2Action = (name, handler) => {
  if (!pm2Action) {
    return;
  }

  pm2Action(name, async (reply) => {
    try {
      const payload = await handler();
      reply({ success: true, ...(payload ?? {}) });
    } catch (error) {
      reply({ success: false, error: error?.message ?? String(error) });
    }
  });
};

let sharedState = {};

async function ensureCacheDir() {
  await mkdir(CACHE_DIR, { recursive: true });
}

async function readState() {
  try {
    const payload = await readFile(STATE_FILE, 'utf8');
    return JSON.parse(payload);
  } catch (error) {
    return {};
  }
}

async function writeState(state) {
  await ensureCacheDir();
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

async function fetchLatestVersion() {
  const response = await fetch(RELEASE_URL, {
    headers: { 'User-Agent': 'Promethean-Serena-Updater' },
  });

  if (!response.ok) {
    throw new Error(`Unexpected status ${response.status} when querying ${RELEASE_URL}`);
  }

  const data = await response.json();
  return data?.tag_name || data?.name || `${data?.id}`;
}

function restartSerena() {
  try {
    log('info', 'Restarting serena via:', RESTART_COMMAND);
    execSync(RESTART_COMMAND, { stdio: 'inherit' });
  } catch (error) {
    log('warn', 'Failed to restart serena', error.message);
  }
}

async function checkForUpdate(state) {
  try {
    const latestVersion = await fetchLatestVersion();
    const currentVersion = state.version;

    if (!latestVersion) {
      log('warn', 'Could not determine latest serena version');
      return state;
    }

    if (!currentVersion) {
      log('info', `Tracking serena version ${latestVersion}`);
      const updatedState = {
        version: latestVersion,
        lastUpdated: new Date().toISOString(),
      };
      await writeState(updatedState);
      return updatedState;
    }

    if (currentVersion === latestVersion) {
      log('debug', `Serena is already at ${latestVersion}`);
      return state;
    }

    log('info', `Detected serena version ${latestVersion} (previously ${currentVersion})`);
    restartSerena();

    const updatedState = {
      version: latestVersion,
      lastUpdated: new Date().toISOString(),
    };

    await writeState(updatedState);
    return updatedState;
  } catch (error) {
    log('error', 'Update check failed', error?.message ?? error);
    return state;
  }
}

registerPm2Action('check-now', async () => {
  sharedState = await checkForUpdate(sharedState);
  return {
    version: sharedState.version ?? null,
    lastUpdated: sharedState.lastUpdated ?? null,
  };
});

registerPm2Action('restart-serena', () => {
  restartSerena();
  return { version: sharedState.version ?? null };
});

async function main() {
  let state = await readState();
  sharedState = state;

  if (process.env.SERENA_UPDATE_RUN_ONCE === 'true') {
    sharedState = await checkForUpdate(sharedState);
    return;
  }

  while (true) {
    state = await checkForUpdate(state);
    sharedState = state;
    await setTimeout(POLL_INTERVAL_MS);
  }
}

main().catch((error) => {
  log('error', 'Serena updater crashed', error?.message ?? error);
  process.exit(1);
});

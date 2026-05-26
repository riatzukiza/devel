/**
 * OpenPlanner-owned PM2 ecosystem for Knoxx host services.
 *
 * This file intentionally lives in services/openplanner, not inside the Knoxx
 * source checkout. Runtime ownership stays in the service/devops layer while
 * Knoxx source can remain a submodule, move elsewhere, or be overridden with
 * KNOXX_SOURCE_ROOT.
 *
 * Runs all Knoxx services on the host for source-mapped debugging:
 *   1. knoxx-shadow          — shadow-cljs watch with source maps (compiles backend CLJS → dist-dev/)
 *   2. knoxx-backend         — node dist-dev/server.js (watch-produced dev output) with source-map stack traces
 *   3. knoxx-frontend        — Vite build/watch + shadow-cljs dev HTTP server on port 5173
 *   4. knoxx-ingestion       — clojure -M:run (kms-ingestion on port 3003)
 *
 * Source selection:
 *   - KNOXX_SOURCE_ROOT=/path/to/knoxx
 *   - OPENPLANNER_SOURCE_ROOT=/path/to/openplanner (expects packages/agents/knoxx)
 *   - fallback discovery from the current checkout layout, if present
 *
 * Workspace selection:
 *   - KNOXX_WORKSPACE_ROOT, WORKSPACE_ROOT, or WORKSPACE_PATH
 *   - fallback to this service checkout's git top-level
 *
 * Dependencies (must be running separately):
 *   - Redis       on localhost:6379  (compose: knoxx-redis)
 *   - Postgres    on localhost:5432  (compose: knoxx-postgres, user=kms db=knoxx)
 *   - Proxx       on localhost:8789
 *   - OpenPlanner on localhost:7777
 *
 * Usage:
 *   cd services/openplanner
 *   pm2 start ecosystem.host.config.cjs
 *   pm2 logs knoxx            # all knoxx-* logs
 *   pm2 stop knoxx            # stop all
 *   pm2 delete knoxx          # remove all
 */

// Load service and host env for runtime wiring and real API keys.
// IMPORTANT: never dump process.env or loaded env maps in logs (they can contain secrets).
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const serviceRoot = __dirname;

function loadSimpleEnv(envPath) {
  try {
    const raw = fs.readFileSync(envPath, 'utf8');
    return raw.split(/\r?\n/).reduce((acc, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return acc;
      const idx = trimmed.indexOf('=');
      if (idx < 0) return acc;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1);
      if (!key) return acc;
      acc[key] = value;
      return acc;
    }, {});
  } catch (_err) {
    return {};
  }
}

function tryGitTopLevel(cwd) {
  try {
    return execSync('git rev-parse --show-toplevel', { cwd, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString('utf8')
      .trim();
  } catch (_err) {
    return null;
  }
}

function isLocalPortBound(port) {
  try {
    execSync(`ss -ltn 'sport = :${port}' | grep -F '127.0.0.1:${port}'`, {
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    return true;
  } catch (_err) {
    return false;
  }
}

function firstNonBlank(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function configuredPath(value, baseDir = serviceRoot) {
  if (!value) return '';
  if (value === '~') return os.homedir();
  if (value.startsWith('~/')) return path.join(os.homedir(), value.slice(2));
  if (path.isAbsolute(value)) return value;
  return path.resolve(baseDir, value);
}

function existingDirectory(...candidates) {
  for (const candidate of candidates.flat().filter(Boolean)) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
  }
  return '';
}

function requireDirectory(label, value) {
  const resolved = configuredPath(value);
  if (resolved && fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
    return resolved;
  }
  throw new Error(`${label} does not exist or is not a directory: ${value}`);
}

const defaultHostEnvPath = path.join(os.homedir(), '.knoxx', '.env');
const serviceEnvPath = firstNonBlank(
  process.env.KNOXX_SERVICE_ENV_PATH,
  process.env.OPENPLANNER_SERVICE_ENV_PATH,
  path.join(serviceRoot, '.env'),
);
const userEnvPath = firstNonBlank(process.env.KNOXX_HOST_ENV_PATH, defaultHostEnvPath);
const serviceEnv = loadSimpleEnv(configuredPath(serviceEnvPath));
const userEnv = loadSimpleEnv(configuredPath(userEnvPath));
const hostEnv = new Proxy({ ...serviceEnv, ...userEnv }, {
  get(target, prop) {
    if (typeof prop === 'string' && process.env[prop] !== undefined) {
      return process.env[prop];
    }
    return target[prop];
  },
});

function envValue(key, fallback = '') {
  return firstNonBlank(process.env[key], hostEnv[key], fallback);
}

const serviceGitRoot = tryGitTopLevel(serviceRoot);
const openplannerSourceRoot = envValue('OPENPLANNER_SOURCE_ROOT');
const knoxxSourceRoot = envValue('KNOXX_SOURCE_ROOT');
const knoxxRoot = knoxxSourceRoot
  ? requireDirectory('KNOXX_SOURCE_ROOT', knoxxSourceRoot)
  : openplannerSourceRoot
    ? requireDirectory('OPENPLANNER_SOURCE_ROOT packages/agents/knoxx', path.join(configuredPath(openplannerSourceRoot), 'packages', 'agents', 'knoxx'))
    : existingDirectory(
      path.join(serviceRoot, 'packages', 'agents', 'knoxx'),
      path.resolve(serviceRoot, '..', '..', 'orgs', 'open-hax', 'openplanner', 'packages', 'agents', 'knoxx'),
      serviceGitRoot && path.join(serviceGitRoot, 'orgs', 'open-hax', 'openplanner', 'packages', 'agents', 'knoxx'),
      serviceGitRoot && path.join(serviceGitRoot, 'packages', 'agents', 'knoxx'),
    );

if (!knoxxRoot) {
  throw new Error('Unable to locate Knoxx source; set KNOXX_SOURCE_ROOT or OPENPLANNER_SOURCE_ROOT.');
}

const workspaceRoot = requireDirectory(
  'workspace root',
  envValue('KNOXX_WORKSPACE_ROOT', envValue('WORKSPACE_ROOT', envValue('WORKSPACE_PATH', serviceGitRoot || serviceRoot))),
);
const workspaceProjectName = envValue(
  'WORKSPACE_PROJECT_NAME',
  envValue('KNOXX_WORKSPACE_PROJECT', path.basename(workspaceRoot) || 'workspace'),
);
const backendDir = path.join(knoxxRoot, 'backend');
const frontendDir = path.join(knoxxRoot, 'frontend');
const ingestionDir = path.join(knoxxRoot, 'ingestion');
const sttNpuDir = path.join(knoxxRoot, 'voice', 'stt-npu');
const contractsDir = configuredPath(envValue('CONTRACTS_DIR', path.join(knoxxRoot, 'contracts')), knoxxRoot);
const baseKnoxxEnv = {
  NODE_ENV: 'development',
  KNOXX_SOURCE_ROOT: knoxxRoot,
  KNOXX_PM2_ECOSYSTEM_ROOT: serviceRoot,
  OPENPLANNER_SERVICE_ROOT: serviceRoot,
  KNOXX_WORKSPACE_ROOT: workspaceRoot,
  WORKSPACE_ROOT: workspaceRoot,
  WORKSPACE_PATH: workspaceRoot,
  WORKSPACE_PROJECT_NAME: workspaceProjectName,
  KNOXX_OPENPLANNER_PROJECT: workspaceProjectName,
};
const knoxxPostgresUser = envValue('KNOXX_POSTGRES_USER', 'kms');
const knoxxPostgresPassword = envValue('KNOXX_POSTGRES_PASSWORD', 'kms');
const knoxxPostgresHost = envValue('KNOXX_POSTGRES_HOST', '127.0.0.1');
const knoxxPostgresPort = envValue('KNOXX_POSTGRES_PORT', '5432');
const knoxxPostgresDatabase = envValue('KNOXX_POSTGRES_DATABASE', 'knoxx');
const defaultKnoxxDatabaseUrl = [
  'postgresql://',
  encodeURIComponent(knoxxPostgresUser),
  ':',
  encodeURIComponent(knoxxPostgresPassword),
  '@',
  knoxxPostgresHost,
  ':',
  knoxxPostgresPort,
  '/',
  knoxxPostgresDatabase,
].join('');
const musicLibraryRoot = process.env.KNOXX_MUSIC_LIBRARY_ROOT
  || hostEnv.KNOXX_MUSIC_LIBRARY_ROOT
  || path.join(os.homedir(), 'Music');
const sttNpuPort = process.env.KNOXX_STT_PORT || hostEnv.KNOXX_STT_PORT || '8010';
const chromiumPath = process.env.KNOXX_CHROMIUM_PATH || hostEnv.KNOXX_CHROMIUM_PATH || '/snap/bin/chromium';
// Voice STT for the local Knoxx stack is pinned to the repo-local sidecar by default.
// Only a process-level override should redirect it somewhere else.
const sttNpuExplicitBaseUrl = process.env.KNOXX_STT_BASE_URL || '';
const sttNpuBaseUrl = sttNpuExplicitBaseUrl || `http://127.0.0.1:${sttNpuPort}`;
const sttNpuModelDir = process.env.KNOXX_STT_MODEL_DIR
  || hostEnv.KNOXX_STT_MODEL_DIR
  || path.join(os.homedir(), '.knoxx', 'models', 'stt-npu');
const sttNpuPython = process.env.KNOXX_STT_PYTHON
  || hostEnv.KNOXX_STT_PYTHON
  || (fs.existsSync(path.join(sttNpuDir, '.venv', 'bin', 'python'))
    ? path.join(sttNpuDir, '.venv', 'bin', 'python')
    : 'python3');
// auto  = only launch local STT when no explicit base URL is configured
//         and the target port is currently free.
// force = always include the local PM2 sidecar.
// off   = never include the local PM2 sidecar.
const sttNpuPm2Mode = process.env.KNOXX_STT_PM2_MODE || hostEnv.KNOXX_STT_PM2_MODE || 'auto';
const sttNpuShouldRunLocal =
  fs.existsSync(path.join(sttNpuDir, 'server.py'))
  && sttNpuPm2Mode !== 'off'
  && (
    sttNpuPm2Mode === 'force'
    || (!sttNpuExplicitBaseUrl && !isLocalPortBound(sttNpuPort))
  );
const shoedelussyDir = process.env.SHOEDELUSSY_DIR || hostEnv.SHOEDELUSSY_DIR || path.join(os.homedir(), '.knoxx', 'external', 'shoedelussy');
const shoedelussyServerDir = path.join(shoedelussyDir, 'server');
const shoedelussyUiDir = path.join(shoedelussyDir, 'ui');
const shoedelussyMcpPort = process.env.SHOEDELUSSY_MCP_PORT || hostEnv.SHOEDELUSSY_MCP_PORT || '8790';
const shoedelussyUiPort = process.env.SHOEDELUSSY_UI_PORT || hostEnv.SHOEDELUSSY_UI_PORT || '5175';
const shoedelussyExplicitBaseUrl = process.env.SHOEDELUSSY_MCP_BASE_URL || hostEnv.SHOEDELUSSY_MCP_BASE_URL || '';
const shoedelussyMcpBaseUrl = shoedelussyExplicitBaseUrl || `http://127.0.0.1:${shoedelussyMcpPort}/mcp`;
const shoedelussyUiBaseUrl = process.env.SHOEDELUSSY_UI_URL || hostEnv.SHOEDELUSSY_UI_URL || `http://127.0.0.1:${shoedelussyUiPort}`;
// auto  = only launch a local Wrangler when no explicit base URL is configured
//         and the target port is currently free.
// force = always include the local PM2 sidecar.
// off   = never include the local PM2 sidecar.
const shoedelussyPm2Mode = process.env.SHOEDELUSSY_PM2_MODE || hostEnv.SHOEDELUSSY_PM2_MODE || 'auto';
const shoedelussyShouldRunLocal =
  fs.existsSync(shoedelussyServerDir)
  && shoedelussyPm2Mode !== 'off'
  && (
    shoedelussyPm2Mode === 'force'
    || (!shoedelussyExplicitBaseUrl && !isLocalPortBound(shoedelussyMcpPort))
  );
const shoedelussyUiShouldRunLocal =
  fs.existsSync(shoedelussyUiDir)
  && shoedelussyPm2Mode !== 'off'
  && (
    shoedelussyPm2Mode === 'force'
    || !isLocalPortBound(shoedelussyUiPort)
  );
const shoedelussyDmxDir = path.join(shoedelussyDir, 'bridges', 'dmx-mcp');
const shoedelussyDmxPort = process.env.SHOEDELUSSY_DMX_PORT || hostEnv.SHOEDELUSSY_DMX_PORT || '3334';
const shoedelussyDmxShouldRunLocal =
  fs.existsSync(shoedelussyDmxDir)
  && shoedelussyPm2Mode !== 'off'
  && (
    shoedelussyPm2Mode === 'force'
    || !isLocalPortBound(shoedelussyDmxPort)
  );

const apps = [
    // ── 1. shadow-cljs watch ──────────────────────────────────────────
    {
      name: 'knoxx-shadow',
      cwd: backendDir,
      script: 'pnpm',
      // Force source maps in the watch build so dist/*.map stays available
      // even if the underlying shadow config drifts.
      args: 'exec shadow-cljs --source-maps watch server-dev',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        ...baseKnoxxEnv,
      },
    },

    // ── 2. Backend (Node + compiled CLJS) ────────────────────────────
    {
      name: 'knoxx-backend',
      cwd: backendDir,
      // Foreground launcher waits for shadow-cljs dev server + dist-dev/server.js
      // before importing the all-CLJS runtime entrypoint. This encodes the full
      // hot-reload cycle in PM2 instead of relying on an agent's ad hoc startup order.
      script: 'scripts/start-server-dev.cljs',
        interpreter: 'nbb',
      kill_timeout: 45000,
      // Policy/contract bootstrap can legitimately take >60s when Postgres or
      // Mongo is under graph-load pressure. Keep wait_ready, but do not let PM2
      // SIGINT the launcher every minute and amplify the startup storm.
      listen_timeout: 240000,
      wait_ready: true,
      shutdown_with_message: true,
      min_uptime: '120s',
      // Do not let PM2 watch compiled output or source. shadow-cljs owns hot reload;
      // PM2 only owns the long-running launcher process.
      watch: false,
      // watch: ['dist'],
      // watch_delay: 800,
      // ignore_watch: ['.shadow-cljs', 'node_modules', 'tmp', '.git'],
      autorestart: true,
      max_restarts: 5,
      restart_delay: 30000,
      exp_backoff_restart_delay: 5000,
      env: {
        ...baseKnoxxEnv,
        NODE_ENV: 'development',
        HOST: '0.0.0.0',
        PORT: '8000',
        WORKSPACE_ROOT: workspaceRoot,
        WORKSPACE_PROJECT_NAME: workspaceProjectName,
        KNOXX_OPENPLANNER_PROJECT: workspaceProjectName,
        CONTRACTS_DIR: contractsDir,
        KNOXX_MUSIC_LIBRARY_ROOT: musicLibraryRoot,
        KNOXX_EXTRA_WORKSPACE_ROOTS: musicLibraryRoot,
        KNOXX_CHROMIUM_PATH: chromiumPath,
        KNOXX_OPENUTAU_RENDER_SCRIPT: envValue('KNOXX_OPENUTAU_RENDER_SCRIPT', path.join(workspaceRoot, 'services', 'utau-renderer', 'render-ustx.sh')),
        DISCORD_BOT_TOKEN: hostEnv.DISCORD_BOT_TOKEN,
        KNOXX_SESSION_PROJECT_NAME: envValue('KNOXX_SESSION_PROJECT_NAME', 'knoxx-session'),
        KNOXX_COLLECTION_NAME: envValue('KNOXX_COLLECTION_NAME', `${workspaceProjectName}_docs`),
        AUDD_API_TOKEN: hostEnv.AUDD_API_TOKEN || '',
        ACOUSTID_API_KEY: hostEnv.ACOUSTID_API_KEY || '',
        // Public base URL used for OAuth redirect_uri + cookie scope
        KNOXX_PUBLIC_BASE_URL: hostEnv.KNOXX_PUBLIC_BASE_URL || 'http://localhost',
        // GitHub OAuth
        KNOXX_GITHUB_OAUTH_CLIENT_ID: hostEnv.KNOXX_GITHUB_OAUTH_CLIENT_ID || '',
        KNOXX_GITHUB_OAUTH_CLIENT_SECRET: hostEnv.KNOXX_GITHUB_OAUTH_CLIENT_SECRET || '',
        // Canonical Proxx (on host via compose port-forward)
        PROXX_BASE_URL: hostEnv.PROXX_BASE_URL || 'http://127.0.0.1:8789',
        PROXX_DEFAULT_MODEL: 'gemma4:31b',
        PROXX_AUTH_TOKEN: hostEnv.PROXX_AUTH_TOKEN || hostEnv.PROXY_AUTH_TOKEN || 'change-me-open-hax-proxy-token',
        // Eta-mu native providers use this to emit body-level prompt_cache_key
        // (and long-retention fields when supported) for session-affinity caching.
        PI_CACHE_RETENTION: 'long',
        KNOXX_PROVIDER_BASE_URLS: hostEnv.KNOXX_PROVIDER_BASE_URLS || 'llamacpp=http://127.0.0.1:8082',
        KNOXX_PROVIDER_AUTH_TOKENS: hostEnv.KNOXX_PROVIDER_AUTH_TOKENS || 'llamacpp=LLAMACPP_API_KEY',
        LLAMACPP_API_KEY: hostEnv.LLAMACPP_API_KEY || 'no-key',
        // OpenPlanner (on host via compose port-forward)
        OPENPLANNER_BASE_URL: 'http://127.0.0.1:7777',
        OPENPLANNER_API_KEY: hostEnv.OPENPLANNER_API_KEY || 'change-me',
        KNOXX_API_KEY: hostEnv.KNOXX_API_KEY || process.env.KNOXX_API_KEY || 'change-me',
        KNOXX_API_KEY_USER_EMAIL: hostEnv.KNOXX_API_KEY_USER_EMAIL || process.env.KNOXX_API_KEY_USER_EMAIL || 'pi@open-hax.local',
        MCP_ENABLED: hostEnv.MCP_ENABLED || process.env.MCP_ENABLED || 'true',
        SHOEDELUSSY_MCP_BASE_URL: shoedelussyMcpBaseUrl,
        SHOEDELUSSY_MCP_TOOL_NAME: hostEnv.SHOEDELUSSY_MCP_TOOL_NAME || 'shoedelussy',
        SHOEDELUSSY_MCP_SHARED_SECRET: hostEnv.SHOEDELUSSY_MCP_SHARED_SECRET || '',
        // Redis + Postgres (compose services forwarded to host)
        REDIS_URL: 'redis://127.0.0.1:6379',
        // Automatic recovered-session resume is opt-in. Keeping this false prevents
        // ad hoc PM2 restarts or shadow-cljs hot reloads from creating duplicate
        // zombie agent jobs. Stale sessions may still be cleaned up by recovery.
        KNOXX_AGENT_AUTO_RESUME_SESSIONS: hostEnv.KNOXX_AGENT_AUTO_RESUME_SESSIONS || 'false',
        // Event-agent cron jobs can be heavy (model calls, Discord scans, media work).
        // On restart, delay and spread due cron jobs instead of boot-kicking all of
        // them while PM2/shadow/PG/Mongo are still settling.
        KNOXX_EVENT_AGENTS_MAX_CONCURRENT_JOBS: hostEnv.KNOXX_EVENT_AGENTS_MAX_CONCURRENT_JOBS || process.env.KNOXX_EVENT_AGENTS_MAX_CONCURRENT_JOBS || '1',
        KNOXX_EVENTS_CRON_TICKER_MS: hostEnv.KNOXX_EVENTS_CRON_TICKER_MS || process.env.KNOXX_EVENTS_CRON_TICKER_MS || '60000',
        KNOXX_EVENTS_CRON_STARTUP_MIN_DELAY_MS: hostEnv.KNOXX_EVENTS_CRON_STARTUP_MIN_DELAY_MS || process.env.KNOXX_EVENTS_CRON_STARTUP_MIN_DELAY_MS || '180000',
        KNOXX_EVENTS_CRON_STARTUP_SPREAD_MS: hostEnv.KNOXX_EVENTS_CRON_STARTUP_SPREAD_MS || process.env.KNOXX_EVENTS_CRON_STARTUP_SPREAD_MS || '900000',
        KNOXX_POLICY_DB_POOL_MAX: hostEnv.KNOXX_POLICY_DB_POOL_MAX || process.env.KNOXX_POLICY_DB_POOL_MAX || '6',
        KNOXX_POLICY_DB_CONNECT_TIMEOUT_MS: hostEnv.KNOXX_POLICY_DB_CONNECT_TIMEOUT_MS || process.env.KNOXX_POLICY_DB_CONNECT_TIMEOUT_MS || '15000',
        KNOXX_POLICY_DB_IDLE_TIMEOUT_MS: hostEnv.KNOXX_POLICY_DB_IDLE_TIMEOUT_MS || process.env.KNOXX_POLICY_DB_IDLE_TIMEOUT_MS || '30000',
        KNOXX_POLICY_DB_LOG_CONNECTS: hostEnv.KNOXX_POLICY_DB_LOG_CONNECTS || process.env.KNOXX_POLICY_DB_LOG_CONNECTS || 'false',
        KNOXX_SHUTDOWN_GRACE_MS: '25000',
        KNOXX_SHUTDOWN_POLL_MS: '250',
        KNOXX_POLICY_DATABASE_URL: envValue('KNOXX_POLICY_DATABASE_URL', defaultKnoxxDatabaseUrl),
        DATABASE_URL: envValue('DATABASE_URL', defaultKnoxxDatabaseUrl),
        // STT (NPU service on host)
        KNOXX_STT_BASE_URL: sttNpuBaseUrl,

        // Bluesky (ATProto)
        BLUESKY_IDENTIFIER: hostEnv.BLUESKY_IDENTIFIER || process.env.BLUESKY_IDENTIFIER || '',
        BLUESKY_APP_PASSWORD: hostEnv.BLUESKY_APP_PASSWORD || process.env.BLUESKY_APP_PASSWORD || '',
        BLUESKY_SERVICE_URL: hostEnv.BLUESKY_SERVICE_URL || process.env.BLUESKY_SERVICE_URL || '',
        BLUESKY_PUBLIC_API_URL: hostEnv.BLUESKY_PUBLIC_API_URL || process.env.BLUESKY_PUBLIC_API_URL || '',

        // TTS (ElevenLabs)
        // Accept historical/local key names from ~/.knoxx/.env.cephalon-host
        KNOXX_ELEVENLABS_API_KEY:
          hostEnv.KNOXX_ELEVENLABS_API_KEY
          || hostEnv.KNOXX_ELEVENLABS_KEY
          || hostEnv.ELEVENLABS_API_KEY
          || hostEnv.ELEVEN_LABS_API_KEY
          || hostEnv.XI_API_KEY
          || '',
        KNOXX_ELEVENLABS_VOICE_ID: hostEnv.KNOXX_ELEVENLABS_VOICE_ID || hostEnv.ELEVENLABS_VOICE_ID || '',
        KNOXX_ELEVENLABS_MODEL_ID: hostEnv.KNOXX_ELEVENLABS_MODEL_ID || hostEnv.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2',

        // Ingestion service on host
        KMS_INGESTION_URL: 'http://127.0.0.1:3003',
      },
    },

    // ── 3. STT (Whisper/OpenVINO sidecar) ────────────────────────────
    ...(sttNpuShouldRunLocal
      ? [{
        name: 'knoxx-stt-npu',
        cwd: sttNpuDir,
        script: sttNpuPython,
        interpreter: 'none',
        args: 'server.py',
        watch: false,
        autorestart: true,
        max_restarts: 10,
        restart_delay: 5000,
        kill_timeout: 15000,
        env: {
          ...baseKnoxxEnv,
          PORT: sttNpuPort,
          MODEL_DIR: sttNpuModelDir,
          WHISPER_DEVICE: process.env.WHISPER_DEVICE || hostEnv.WHISPER_DEVICE || 'NPU',
          WHISPER_MODEL_ID:
            process.env.WHISPER_MODEL_ID
            || hostEnv.WHISPER_MODEL_ID
            || 'OpenVINO/whisper-medium.en-int8-ov',
          STT_TIMED_MODEL_ID:
            process.env.STT_TIMED_MODEL_ID
            || hostEnv.STT_TIMED_MODEL_ID
            || 'OpenVINO/whisper-medium-int8-ov',
          STT_TIMED_MODEL_DIR:
            process.env.STT_TIMED_MODEL_DIR
            || hostEnv.STT_TIMED_MODEL_DIR
            || `${sttNpuModelDir}-timed`,
          STT_TIMED_DEVICE:
            process.env.STT_TIMED_DEVICE
            || hostEnv.STT_TIMED_DEVICE
            || 'CPU',
          WHISPER_NPU_COMPILER_TYPE:
            process.env.WHISPER_NPU_COMPILER_TYPE
            || hostEnv.WHISPER_NPU_COMPILER_TYPE
            || 'DRIVER',
          STT_WORD_TIMESTAMPS:
            process.env.STT_WORD_TIMESTAMPS
            || hostEnv.STT_WORD_TIMESTAMPS
            || 'true',
          PYTHONUNBUFFERED: '1',
        },
      }]
      : []),

    // ── 4. Frontend (Vite build/watch + shadow-cljs dev server) ──────
    // `pnpm dev` (frontend/package.json) runs:
    //   - vite build --watch          (writes ./dist)
    //   - vite build --watch (bridge) (writes ./dist/bridge)
    //   - shadow-cljs watch app       (serves HTTP on :5173 and writes ./dist/cljs)
    {
      name: 'knoxx-frontend',
      cwd: frontendDir,
      script: 'pnpm',
      args: 'dev',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        ...baseKnoxxEnv,
        NODE_ENV: 'development',
        // Used by Vite builds (and retained for `pnpm preview`).
        VITE_KNOXX_BACKEND_URL: 'http://127.0.0.1:8000',
        VITE_WORKSPACE_PROJECT: workspaceProjectName,
      },
    },

    // ── 5. Ingestion (Clojure JVM) ──────────────────────────────────
    {
      name: 'knoxx-ingestion',
      cwd: ingestionDir,
      script: 'clojure',
      interpreter: '/bin/bash',
      args: '-M:run',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        ...baseKnoxxEnv,
        PORT: '3003',
        DATABASE_URL: envValue('DATABASE_URL', defaultKnoxxDatabaseUrl),
        REDIS_URL: 'redis://127.0.0.1:6379',
        KNOXX_BACKEND_URL: 'http://127.0.0.1:8000',
        WORKSPACE_PATH: workspaceRoot,
        WORKSPACE_PROJECT_NAME: workspaceProjectName,
        KNOXX_OPENPLANNER_PROJECT: workspaceProjectName,
        OPENPLANNER_BASE_URL: 'http://127.0.0.1:7777',
        OPENPLANNER_API_KEY: hostEnv.OPENPLANNER_API_KEY || 'change-me',
        KNOXX_API_KEY: hostEnv.KNOXX_API_KEY || process.env.KNOXX_API_KEY || 'change-me',
        PROXX_BASE_URL: hostEnv.PROXX_BASE_URL || 'http://127.0.0.1:8789',
        PROXX_AUTH_TOKEN: hostEnv.PROXX_AUTH_TOKEN || hostEnv.PROXY_AUTH_TOKEN || 'change-me-open-hax-proxy-token',
        // Temporary kill-switch: disable background indexing for the audio driver.
        AUDIO_INDEXING_ENABLED: 'false',
      },
    },
];

// Run Wrangler directly so PM2 manages the real parent process instead of a pnpm wrapper.
if (shoedelussyShouldRunLocal) {
  apps.splice(2, 0, {
    name: 'shoedelussy-mcp',
    cwd: shoedelussyServerDir,
    script: path.join(shoedelussyServerDir, 'node_modules', '.bin', 'wrangler'),
    interpreter: 'none',
    args: `dev --port ${shoedelussyMcpPort} --ip 127.0.0.1`,
    watch: false,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    kill_timeout: 15000,
    env: {
      ...baseKnoxxEnv,
      NODE_ENV: 'development',
      MCP_SECRET: hostEnv.SHOEDELUSSY_MCP_SHARED_SECRET || '',
      APP_URL: hostEnv.SHOEDELUSSY_APP_URL || shoedelussyUiBaseUrl,
      OPENROUTER_API_KEY: hostEnv.SHOEDELUSSY_OPENROUTER_API_KEY || hostEnv.OPENROUTER_API_KEY || '',
      OPENROUTER_MODEL: hostEnv.SHOEDELUSSY_OPENROUTER_MODEL || hostEnv.OPENROUTER_MODEL || 'google/gemini-2.5-flash',
    },
  });
}

if (shoedelussyUiShouldRunLocal) {
  apps.splice(3, 0, {
    name: 'shoedelussy-ui',
    cwd: shoedelussyUiDir,
    script: 'pnpm',
    args: `exec vite --host 127.0.0.1 --port ${shoedelussyUiPort} --strictPort`,
    watch: false,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    env: {
      ...baseKnoxxEnv,
      NODE_ENV: 'development',
      VITE_API_URL: '/shoe/api',
    },
  });
}

if (shoedelussyDmxShouldRunLocal) {
  apps.splice(4, 0, {
    name: 'shoedelussy-dmx',
    cwd: shoedelussyDmxDir,
    script: 'pnpm',
    args: 'start',
    watch: false,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    env: {
      ...baseKnoxxEnv,
      NODE_ENV: 'development',
      DMX_MCP_PORT: shoedelussyDmxPort,
      DMX_BACKEND: process.env.DMX_BACKEND || hostEnv.DMX_BACKEND || 'simulator',
    },
  });
}

module.exports = {
  apps,
};

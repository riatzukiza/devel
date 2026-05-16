const path = require("node:path");

const serviceRoot = __dirname;
const repoRoot = path.resolve(serviceRoot, "../../orgs/open-hax/proxx");
const host = "127.0.0.1";
const proxyPort = process.env.PROXX_HOST_PROXY_PORT ?? "18789";
const webPort = process.env.PROXX_HOST_WEB_PORT ?? "15174";

const commonEnv = {
  NODE_ENV: "development",
  PROXY_HOST: host,
  PROXY_PORT: proxyPort,
  PORT: proxyPort,
  OPENAI_OAUTH_CALLBACK_PORT: process.env.PROXX_HOST_OAUTH_CALLBACK_PORT ?? "18755",
  PROXY_KEYS_FILE: path.join(serviceRoot, "seeds/keys.json"),
  PROXY_MODELS_FILE: path.join(serviceRoot, "models.json"),
  PROXY_REQUEST_LOGS_FILE: path.join(serviceRoot, "data/request-logs.jsonl"),
  DATABASE_URL: process.env.PROXX_DEV_DATABASE_URL ?? "postgresql://openai_proxy:openai_proxy@127.0.0.1:15439/openai_proxy", // pragma: allowlist secret
  PROXX_CLJS_RUNTIME_REQUIRED: "true",
  PROXX_CLJS_POLICY_SHADOW: "true",
  PROXX_CLJS_POLICY_AUTHORITATIVE: "true",
  PROXX_CLJS_POLICY_MANIFEST: path.join(serviceRoot, "policies/runtime/00-manifest.edn"),
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
  UPSTREAM_PROVIDER_BASE_URLS: process.env.UPSTREAM_PROVIDER_BASE_URLS
    ?? "ollama-cloud=https://ollama.com,ollama-lan=http://192.168.12.68:11434,openai=https://chatgpt.com/backend-api,vivgrid=https://api.vivgrid.com,requesty=https://router.requesty.ai/v1,llamacpp=http://127.0.0.1:8082,llamacpp-embed=http://127.0.0.1:8081",
  EMBED_MODEL_PROVIDER_ALIASES: process.env.EMBED_MODEL_PROVIDER_ALIASES
    ?? "qwen3-embedding:0.6b=llamacpp-embed,qwen3-embedding-0.6b=llamacpp-embed",
  CHROMA_URL: process.env.CHROMA_URL ?? "http://127.0.0.1:8000",
  HOST_DASHBOARD_RUNTIME_ROOT: serviceRoot,
};

module.exports = {
  apps: [
    {
      name: "proxx-host",
      script: "bash",
      args: ["-lc", "exec /home/err/devel/services/proxx/scripts/run-host-proxx.sh pnpm dev"],
      cwd: repoRoot,
      env: commonEnv,
      autorestart: false,
      watch: false,
      time: true,
      kill_timeout: 3000,
    },
    {
      name: "proxx-host-web",
      script: "bash",
      args: ["-lc", `exec /home/err/devel/services/proxx/scripts/run-host-proxx.sh pnpm web:dev --host ${host} --port ${webPort}`],
      cwd: repoRoot,
      env: {
        ...commonEnv,
        VITE_PROXY_BASE_URL: `http://${host}:${proxyPort}`,
      },
      autorestart: false,
      watch: false,
      time: true,
      kill_timeout: 3000,
    },
  ],
};

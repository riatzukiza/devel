import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const loadConfig = () => ({
  port: Number(process.env.WEB_PORT ?? process.env.PORT ?? 8790),
  host: process.env.HOST ?? '0.0.0.0',
  vaultRoot: process.env.ETA_MU_VAULT_ROOT
    ? path.resolve(process.env.ETA_MU_VAULT_ROOT)
    : process.cwd(),
  mountsPath: process.env.ETA_MU_MOUNTS_PATH ?? '.opencode/runtime/eta_mu_mounts.v1.json',
  indexPath: process.env.ETA_MU_DOCS_INDEX_PATH ?? '.opencode/runtime/eta_mu_docs_index.v1.jsonl',
  backlinksPath: process.env.ETA_MU_DOCS_BACKLINKS_PATH ?? '.opencode/runtime/eta_mu_docs_backlinks.v1.jsonl',
  githubToken: process.env.ETA_MU_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN ?? '',
  automationEnabled: !['0', 'false', 'no'].includes(String(process.env.ETA_MU_AUTOMATION_ENABLED ?? 'true').toLowerCase()),
  automationIntervalMs: Number(process.env.ETA_MU_AUTOMATION_INTERVAL_MS ?? 300_000),
  automationVaults: String(process.env.ETA_MU_AUTOMATION_VAULTS ?? 'proxx')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  controlPlaneReceiptsPath: process.env.ETA_MU_CONTROL_PLANE_RECEIPTS_PATH ?? '.Π/eta_mu_control_plane_receipts.v1.jsonl',
  uiDir: path.resolve(__dirname, '..', 'ui'),
});

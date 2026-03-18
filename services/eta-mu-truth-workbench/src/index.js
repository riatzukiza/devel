import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

// NOTE: In incubation mode we import the local packages by relative path to avoid
// requiring a workspace install/link step. Once promoted, switch these imports
// to package names (e.g. @workspace/eta-mu-docs).
import { indexEtaMuDocs, readJsonl } from '../../../packages/eta-mu-docs/index.js';
import {
  appendTruthOp,
  buildTruthView,
  loadTruthOps,
} from '../../../packages/eta-mu-truth/index.js';

const PORT = Number(process.env.WEB_PORT ?? process.env.PORT ?? 8790);

const VAULT_ROOT = process.env.ETA_MU_VAULT_ROOT
  ? path.resolve(process.env.ETA_MU_VAULT_ROOT)
  : process.cwd();

const MOUNTS_PATH = process.env.ETA_MU_MOUNTS_PATH ?? '.opencode/runtime/eta_mu_mounts.v1.json';
const INDEX_PATH = process.env.ETA_MU_DOCS_INDEX_PATH ?? '.opencode/runtime/eta_mu_docs_index.v1.jsonl';
const BACKLINKS_PATH =
  process.env.ETA_MU_DOCS_BACKLINKS_PATH ?? '.opencode/runtime/eta_mu_docs_backlinks.v1.jsonl';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const uiDir = path.resolve(__dirname, '..', 'ui');

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const send = (res, status, obj) => {
  const payload = JSON.stringify(obj);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
  });
  res.end(payload);
};

const sendText = (res, status, mime, text) => {
  res.writeHead(status, {
    'content-type': mime,
    'access-control-allow-origin': '*',
  });
  res.end(text);
};

const ensureIndex = async () => {
  const indexAbs = path.resolve(VAULT_ROOT, INDEX_PATH);
  if (!fs.existsSync(indexAbs)) {
    await indexEtaMuDocs({
      repoRoot: VAULT_ROOT,
      mountsPath: MOUNTS_PATH,
      indexPath: INDEX_PATH,
      backlinksPath: BACKLINKS_PATH,
    });
  }
  return indexAbs;
};

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`);
  const method = (req.method ?? 'GET').toUpperCase();
  const pathname = u.pathname;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type',
    });
    return res.end();
  }

  // UI
  if (method === 'GET' && pathname === '/') {
    return sendText(
      res,
      200,
      'text/html; charset=utf-8',
      fs.readFileSync(path.join(uiDir, 'index.html'), 'utf8'),
    );
  }
  if (method === 'GET' && pathname === '/app.js') {
    return sendText(
      res,
      200,
      'text/javascript; charset=utf-8',
      fs.readFileSync(path.join(uiDir, 'app.js'), 'utf8'),
    );
  }

  // API
  if (method === 'GET' && pathname === '/api/info') {
    return send(res, 200, {
      vault_root: VAULT_ROOT,
      mounts_path: MOUNTS_PATH,
      index_path: INDEX_PATH,
      backlinks_path: BACKLINKS_PATH,
    });
  }

  if (method === 'POST' && pathname === '/api/rebuild') {
    await indexEtaMuDocs({
      repoRoot: VAULT_ROOT,
      mountsPath: MOUNTS_PATH,
      indexPath: INDEX_PATH,
      backlinksPath: BACKLINKS_PATH,
    });
    return send(res, 200, { ok: true });
  }

  if (method === 'GET' && pathname === '/api/search') {
    const q = (u.searchParams.get('q') ?? '').trim().toLowerCase();
    const limit = Math.max(1, Math.min(200, Number(u.searchParams.get('limit') ?? 20)));
    if (!q) return send(res, 200, { hits: [] });
    const indexAbs = await ensureIndex();
    const rows = readJsonl(indexAbs);
    const hits = rows
      .filter((r) => r && typeof r === 'object')
      .map((r) => {
        const title = String(r.title ?? '');
        const rel = String(r.source_rel_path ?? '');
        const tags = Array.isArray(r.tags) ? r.tags.join(' ') : '';
        const hay = `${title} ${rel} ${tags}`.toLowerCase();
        const score = hay.includes(q) ? 1 : 0;
        return { ...r, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || String(a.source_rel_path).localeCompare(String(b.source_rel_path)))
      .slice(0, limit)
      .map((r) => ({
        entity_id: r.entity_id,
        source_rel_path: r.source_rel_path,
        title: r.title,
        tags: r.tags,
      }));
    return send(res, 200, { hits });
  }

  if (method === 'POST' && pathname === '/api/truth/resolve-wikilink') {
    const body = (await readBody(req)) ?? {};
    const target_key = String(body.target_key ?? '').trim();
    const dst_entity_id = String(body.dst_entity_id ?? '').trim();
    if (!target_key || !dst_entity_id) {
      return send(res, 400, { error: 'missing target_key or dst_entity_id' });
    }
    appendTruthOp({
      vaultRoot: VAULT_ROOT,
      op: { op: 'wikilink.resolve', target_key, dst_entity_id },
    });
    return send(res, 200, { ok: true });
  }

  if (method === 'GET' && pathname === '/api/truth/view') {
    const indexAbs = await ensureIndex();
    const docsIndexRows = readJsonl(indexAbs);
    const truthOps = loadTruthOps({ vaultRoot: VAULT_ROOT, limit: 200_000 });
    const view = buildTruthView({ docsIndexRows, truthOps, limitUnresolved: 200 });
    return send(res, 200, view);
  }

  return send(res, 404, { error: 'not_found' });
});

server.listen(PORT, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`ημ-truth-workbench on :${PORT} vault=${VAULT_ROOT}`);
});

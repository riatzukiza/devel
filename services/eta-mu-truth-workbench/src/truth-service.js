import path from 'node:path';

import { indexEtaMuDocs } from '../../../packages/eta-mu-docs/index.js';
import { buildTruthView, truthOpsPath } from '../../../packages/eta-mu-truth/index.js';

import { appendJsonlRecord, exists, readJsonlFile } from './jsonl.js';

export const createTruthService = (config) => {
  const resolvePath = (relativePath) => path.resolve(config.vaultRoot, relativePath);

  const ensureIndex = async () => {
    const indexAbs = resolvePath(config.indexPath);
    if (!(await exists(indexAbs))) {
      await indexEtaMuDocs({
        repoRoot: config.vaultRoot,
        mountsPath: config.mountsPath,
        indexPath: config.indexPath,
        backlinksPath: config.backlinksPath,
      });
    }
    return indexAbs;
  };

  const getTruthOps = async () => readJsonlFile(truthOpsPath(config.vaultRoot));

  const getTruthView = async () => {
    const indexAbs = await ensureIndex();
    const docsIndexRows = await readJsonlFile(indexAbs);
    const ops = await getTruthOps();
    return buildTruthView({ docsIndexRows, truthOps: ops, limitUnresolved: 200 });
  };

  const getInfo = async () => ({
    vault_root: config.vaultRoot,
    mounts_path: config.mountsPath,
    index_path: config.indexPath,
    backlinks_path: config.backlinksPath,
  });

  const getSiteOverview = async () => {
    const mounted = await exists(resolvePath(config.mountsPath));
    const base = {
      mounted,
      vault_root: config.vaultRoot,
      mounts_path: config.mountsPath,
      resolved_count: 0,
      resolved_edges_count: 0,
      unresolved_count: 0,
      unresolved_examples_count: 0,
      note: mounted ? 'substrate quiet' : 'no mounts configured yet',
    };

    if (!mounted) {
      return base;
    }

    try {
      const view = await getTruthView();
      return {
        ...base,
        resolved_count: Object.keys(view.resolutions ?? {}).length,
        resolved_edges_count: (view.resolvedEdges ?? []).length,
        unresolved_count: (view.unresolved ?? []).length,
        unresolved_examples_count: (view.unresolved ?? []).reduce((sum, item) => sum + (item.count ?? 0), 0),
        note: 'signal available',
      };
    } catch (error) {
      return {
        ...base,
        note: error instanceof Error ? error.message : String(error),
      };
    }
  };

  const rebuild = async () => {
    await indexEtaMuDocs({
      repoRoot: config.vaultRoot,
      mountsPath: config.mountsPath,
      indexPath: config.indexPath,
      backlinksPath: config.backlinksPath,
    });
    return { ok: true };
  };

  const search = async (query, limit) => {
    const normalized = String(query ?? '').trim().toLowerCase();
    const boundedLimit = Math.max(1, Math.min(200, Number(limit ?? 20)));
    if (!normalized) {
      return { hits: [] };
    }

    const indexAbs = await ensureIndex();
    const rows = await readJsonlFile(indexAbs);
    const hits = rows
      .filter((row) => row && typeof row === 'object')
      .map((row) => {
        const title = String(row.title ?? '');
        const rel = String(row.source_rel_path ?? '');
        const tags = Array.isArray(row.tags) ? row.tags.join(' ') : '';
        const hay = `${title} ${rel} ${tags}`.toLowerCase();
        return {
          ...row,
          score: hay.includes(normalized) ? 1 : 0,
        };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || String(a.source_rel_path).localeCompare(String(b.source_rel_path)))
      .slice(0, boundedLimit)
      .map((row) => ({
        entity_id: row.entity_id,
        source_rel_path: row.source_rel_path,
        title: row.title,
        tags: row.tags,
      }));

    return { hits };
  };

  const resolveWikilink = async ({ targetKey, dstEntityId }) => {
    const normalizedTargetKey = String(targetKey ?? '').trim();
    const normalizedDstEntityId = String(dstEntityId ?? '').trim();
    if (!normalizedTargetKey || !normalizedDstEntityId) {
      const error = new Error('missing target_key or dst_entity_id');
      error.statusCode = 400;
      throw error;
    }

    await appendJsonlRecord(truthOpsPath(config.vaultRoot), {
      record: 'ημ.truth-op.v1',
      time: new Date().toISOString(),
      op: 'wikilink.resolve',
      target_key: normalizedTargetKey,
      dst_entity_id: normalizedDstEntityId,
    });

    return { ok: true };
  };

  return {
    getInfo,
    getSiteOverview,
    getTruthView,
    rebuild,
    search,
    resolveWikilink,
  };
};

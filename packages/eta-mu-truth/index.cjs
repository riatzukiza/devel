// GPL-3.0-only

const fs = require('node:fs');
const path = require('node:path');

function normalizeString(value) {
  return String(value ?? '').trim();
}

function isObjectRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function truthOpsPath(vaultRoot) {
  const root = normalizeString(vaultRoot) || process.cwd();
  return path.resolve(root, '.Π', 'ημ_truth_ops.v1.jsonl');
}

function appendTruthOp({ vaultRoot, op }) {
  if (!isObjectRecord(op)) {
    throw new Error('appendTruthOp: op must be an object');
  }
  const out = truthOpsPath(vaultRoot);
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const record = {
    record: 'ημ.truth-op.v1',
    time: new Date().toISOString(),
    ...op,
  };
  fs.appendFileSync(out, JSON.stringify(record) + '\n', 'utf8');
}

function loadTruthOps({ vaultRoot, limit = 50_000 }) {
  const filePath = truthOpsPath(vaultRoot);
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf8');
    const rows = [];
    for (const line of raw.split(/\r?\n/)) {
      const s = line.trim();
      if (!s) continue;
      try {
        const row = JSON.parse(s);
        if (isObjectRecord(row)) rows.push(row);
      } catch {
        // ignore
      }
      if (rows.length >= Math.max(1, Number(limit))) break;
    }
    return rows;
  } catch {
    return [];
  }
}

function buildTruthView({ docsIndexRows, truthOps, limitUnresolved = 200 }) {
  const rows = Array.isArray(docsIndexRows) ? docsIndexRows : [];
  const ops = Array.isArray(truthOps) ? truthOps : [];

  // Latest-wins resolution map: target_key -> dst_entity_id
  const resolutions = {};
  for (const op of ops) {
    if (!isObjectRecord(op)) continue;
    if (op.op !== 'wikilink.resolve') continue;
    const targetKey = normalizeString(op.target_key);
    const dst = normalizeString(op.dst_entity_id);
    if (!targetKey || !dst) continue;
    resolutions[targetKey] = dst;
  }

  const knownEntityIds = new Set(
    rows
      .map((r) => (isObjectRecord(r) ? normalizeString(r.entity_id) : ''))
      .filter(Boolean),
  );

  const resolvedEdges = [];
  const unresolvedCounts = new Map();

  for (const row of rows) {
    if (!isObjectRecord(row)) continue;
    const src = normalizeString(row.entity_id);
    if (!src) continue;
    const srcRel = normalizeString(row.source_rel_path);
    const links = Array.isArray(row.links) ? row.links : [];
    for (const link of links) {
      if (!isObjectRecord(link) || link.kind !== 'wikilink') continue;
      const targetKey = normalizeString(link.target_key);
      if (!targetKey) continue;
      const line = Number(link.line ?? 0) || 0;

      const dst = normalizeString(resolutions[targetKey]);
      if (dst && knownEntityIds.has(dst)) {
        resolvedEdges.push({
          kind: 'wikilink',
          src_entity_id: src,
          dst_entity_id: dst,
          target_key: targetKey,
          line,
        });
      } else {
        const bucket = unresolvedCounts.get(targetKey) ?? {
          target_key: targetKey,
          count: 0,
          examples: [],
        };
        bucket.count += 1;
        if (bucket.examples.length < 5) {
          bucket.examples.push({
            src_entity_id: src,
            src_rel_path: srcRel,
            line,
          });
        }
        unresolvedCounts.set(targetKey, bucket);
      }
    }
  }

  const unresolved = [...unresolvedCounts.values()]
    .sort((a, b) => b.count - a.count || a.target_key.localeCompare(b.target_key))
    .slice(0, Math.max(1, Number(limitUnresolved)));

  return { resolutions, resolvedEdges, unresolved };
}

module.exports = {
  truthOpsPath,
  appendTruthOp,
  loadTruthOps,
  buildTruthView,
};

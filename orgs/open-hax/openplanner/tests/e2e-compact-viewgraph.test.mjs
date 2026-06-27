import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const defaultEnvPath = resolve(repoRoot, '../../../services/openplanner/.env');

function readEnvValue(path, key) {
  try {
    const text = readFileSync(path, 'utf8');
    const line = text.split(/\r?\n/).find((row) => row.trim().startsWith(`${key}=`));
    if (!line) return '';
    return line.slice(line.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '');
  } catch {
    return '';
  }
}

const baseUrl = (process.env.OPENPLANNER_E2E_URL || process.env.OPENPLANNER_URL || 'http://127.0.0.1:7777').replace(/\/+$/, '');
const apiKey = process.env.OPENPLANNER_API_KEY || readEnvValue(process.env.OPENPLANNER_E2E_ENV || defaultEnvPath, 'OPENPLANNER_API_KEY');

function requireApiKey() {
  assert.ok(apiKey, 'OPENPLANNER_API_KEY is required, or run from a workspace with services/openplanner/.env');
}

async function api(method, path, body) {
  requireApiKey();
  const response = await fetch(`${baseUrl}/v1${path}`, {
    method,
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }
  assert.ok(response.ok, `${method} ${path} failed ${response.status}: ${JSON.stringify(payload).slice(0, 1200)}`);
  return payload;
}

const post = (path, body) => api('POST', path, body);
const get = (path) => api('GET', path);

async function archiveViewNode(viewNodeId) {
  if (!viewNodeId) return;
  try {
    await post(`/graph/view/compact/${encodeURIComponent(viewNodeId)}/state`, { status: 'archived', saturation: 0 });
  } catch {
    // Best effort cleanup: assertions should report the original failure.
  }
}

function assertNoInlineSourceText(sourceMetadata) {
  assert.ok(Array.isArray(sourceMetadata), 'compact result must include source metadata array');
  assert.ok(sourceMetadata.length > 0, 'compact source metadata must not be empty');
  for (const meta of sourceMetadata) {
    assert.equal(typeof meta.node_id, 'string');
    assert.equal(typeof meta.source_kind, 'string');
    assert.equal(typeof meta.access_instruction, 'string');
    assert.ok(meta.access_instruction.length > 10, 'source-kind access instruction should be actionable');
    for (const forbidden of ['preview', 'text', 'body', 'content']) {
      assert.equal(
        Object.prototype.hasOwnProperty.call(meta.source_ref || {}, forbidden),
        false,
        `compact source_ref must not inline ${forbidden}`,
      );
    }
  }
}

test('CompactViewGraph rewrites non-saturated truth seeds and expands saturated cells', async () => {
  const query = 'semantic gravity presences daimoi trail field';
  const memoryBody = {
    q: query,
    k: 10,
    maxNodes: 10,
    minVectorSimilarity: 0,
    maxCandidates: 2000,
    useCompactView: false,
    persistDaimoiTrails: false,
    lakes: ['devel'],
  };

  let viewNodeId = '';
  try {
    const raw = await post('/graph/memory', memoryBody);
    assert.equal(raw.stats?.mode, 'query_daimoi_fill');
    const nodeIds = (raw.nodes || [])
      .filter((node) => !String(node.id || '').startsWith('view:compact:'))
      .slice(0, 2)
      .map((node) => node.id);
    assert.ok(nodeIds.length >= 2, 'graph memory should return at least two truth nodes for compact seed test');

    const compact = await post('/graph/view/compact', {
      nodeIds,
      project: 'devel',
      saturation: 0.2,
      expansionThreshold: 0.82,
      compactionScalar: 0.66,
      resourcePressure: 0.7,
      source: 'e2e-compact-viewgraph-test',
    });
    viewNodeId = compact.view_node?.view_node_id;
    assert.ok(viewNodeId?.startsWith('view:compact:'), 'compact endpoint should create a compact view node id');
    assert.equal(compact.represented, nodeIds.length);
    assert.equal(compact.embeddingStored, true);
    assertNoInlineSourceText(compact.view_node.source_metadata);

    const listed = await get(`/graph/view/compact?view_node_id=${encodeURIComponent(viewNodeId)}&status=any`);
    assert.equal(listed.count, 1);
    assert.equal(listed.view_nodes[0].descendant_node_count, nodeIds.length);

    const compacted = await post('/graph/memory', { ...memoryBody, useCompactView: true });
    const compactResult = (compacted.nodes || []).find((node) => node.id === viewNodeId);
    assert.ok(compactResult, 'graph memory should return the compact view node when represented truth seeds are non-saturated');
    assert.equal(compactResult.compactedView, true);
    assert.equal(compactResult.representedNodeCount, nodeIds.length);
    assertNoInlineSourceText(compactResult.sourceMetadata);
    assert.ok(compacted.stats.compactedSeedMembers >= nodeIds.length, 'truth seeds should be rewritten to compact traversal seed');
    assert.ok(compacted.stats.compactViewSeeds >= 1, 'compact view seed count should be reported');

    const state = await post(`/graph/view/compact/${encodeURIComponent(viewNodeId)}/state`, {
      status: 'expanded',
      saturation: 0.95,
    });
    assert.equal(state.ok, true);

    const expanded = await post('/graph/memory', { ...memoryBody, useCompactView: true });
    assert.ok(expanded.stats.expandedCompactViewSeeds >= 1, 'expanded/saturated compact seed should be counted');
    assert.equal(expanded.stats.compactedSeedMembers, 0, 'expanded compact node should fall through to truth seeds');
  } finally {
    await archiveViewNode(viewNodeId);
  }
});

test('CompactViewGraph compaction tick supports dry-run and bounded writes', async () => {
  let viewNodeId = '';
  try {
    const tickBody = {
      project: 'devel',
      resourcePressure: 1,
      minCompactionScalar: 0,
      maxCandidates: 120,
      groupSize: 3,
      minGroupSize: 3,
      maxGroups: 1,
      maxAverageSaturation: 1,
    };

    const dry = await post('/graph/view/compact/run', { ...tickBody, dryRun: true });
    assert.equal(dry.ok, true);
    assert.equal(dry.dryRun, true);
    assert.ok(dry.compactionScalar >= 0, 'dry-run should report pressure-derived compactionScalar');
    assert.ok((dry.groups || []).length >= 1, 'dry-run should expose candidate groups');

    const run = await post('/graph/view/compact/run', { ...tickBody, dryRun: false });
    assert.equal(run.ok, true);
    assert.equal(run.dryRun, false);
    assert.equal(run.compacted, 1);
    assert.equal(run.groupCount, 1);
    viewNodeId = run.viewNodes?.[0]?.view_node_id;
    assert.ok(viewNodeId?.startsWith('view:compact:'), 'compaction tick should create a compact view node');
    assert.equal(run.viewNodes[0].descendant_node_count, 3);
    assertNoInlineSourceText(run.viewNodes[0].source_metadata);
  } finally {
    await archiveViewNode(viewNodeId);
  }
});

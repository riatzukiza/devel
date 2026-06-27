import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const defaultEnvPath = resolve(repoRoot, '../../../services/openplanner/.env');
const openPlannerBaseUrl = (process.env.OPENPLANNER_E2E_URL || process.env.OPENPLANNER_URL || 'http://127.0.0.1:7777').replace(/\/+$/, '');
const graphWeaverUrl = (process.env.GRAPH_WEAVER_E2E_URL || 'http://127.0.0.1:8796').replace(/\/+$/, '');

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

const apiKey = process.env.OPENPLANNER_API_KEY || readEnvValue(process.env.OPENPLANNER_E2E_ENV || defaultEnvPath, 'OPENPLANNER_API_KEY');

async function openplanner(method, path, body) {
  assert.ok(apiKey, 'OPENPLANNER_API_KEY is required, or run from a workspace with services/openplanner/.env');
  const response = await fetch(`${openPlannerBaseUrl}/v1${path}`, {
    method,
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json();
  assert.ok(response.ok, `${method} ${path} failed ${response.status}: ${JSON.stringify(payload).slice(0, 1000)}`);
  return payload;
}

async function gql(query, variables) {
  const response = await fetch(`${graphWeaverUrl}/graphql`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  assert.ok(!payload.errors, JSON.stringify(payload.errors));
  return payload.data;
}

test('OpenPlanner semantic edges decay and prune without daimoi reinforcement', async () => {
  const suffix = Date.now();
  const a = `e2e:semantic-decay:${suffix}:a`;
  const b = `e2e:semantic-decay:${suffix}:b`;

  await openplanner('POST', '/graph/semantic-edges/upsert', {
    source: 'e2e-semantic-decay',
    edges: [{ source: a, target: b, similarity: 0.91, kind: 'semantic_similarity' }],
  });
  const before = await openplanner('POST', '/graph/semantic-edges/query', { nodeIds: [a], minSimilarity: 0, limit: 5 });
  assert.equal(before.edges.length, 1);

  const decay = await openplanner('POST', '/graph/semantic-edges/decay', {
    nodeIds: [a],
    now: new Date(Date.now() + 120_000).toISOString(),
    halfLifeMs: 1000,
    breakBelow: 0.1,
    pruneBelow: 0.01,
    limit: 100,
  });
  assert.ok(decay.pruned >= 1, 'stale semantic edge should be pruned');

  const after = await openplanner('POST', '/graph/semantic-edges/query', { nodeIds: [a], minSimilarity: 0, limit: 5 });
  assert.equal(after.edges.length, 0);
});

test('graph memory reinforces traversed semantic force edges', async () => {
  const memory = await openplanner('POST', '/graph/memory', {
    q: 'semantic gravity presences daimoi trail field',
    k: 10,
    maxNodes: 10,
    minVectorSimilarity: 0,
    maxCandidates: 2000,
    useCompactView: true,
    persistDaimoiTrails: false,
    lakes: ['devel'],
  });
  assert.equal(memory.stats.mode, 'query_daimoi_fill');
  assert.ok(memory.stats.semanticReinforcements >= 1, 'daimoi traversal should reinforce semantic circuits it uses');
});

test('Graph Weaver transient semantic circuits decay and prune', async () => {
  const suffix = Date.now();
  const a = `presence:transient:semantic-decay:${suffix}:a`;
  const b = `presence:transient:semantic-decay:${suffix}:b`;
  let edgeId = '';
  try {
    const created = await gql(
      `mutation($a: ID!, $b: ID!) {
        a: presenceUpsert(input: { id: $a, class: "transient", label: "semantic decay a" }) { id }
        b: presenceUpsert(input: { id: $b, class: "transient", label: "semantic decay b" }) { id }
        edge: semanticEdgeReinforce(input: { source: $a, target: $b, similarity: 0.8, decayHalfLifeMs: 1000 }) { id conductance status }
      }`,
      { a, b },
    );
    edgeId = created.edge.id;
    assert.equal(created.edge.status, 'active');
    assert.equal(created.edge.conductance, 0.8);

    const decayed = await gql(
      `mutation($now: String!) {
        semanticEdgesDecay(input: { now: $now, breakBelow: 0.1, pruneBelow: 0.01 }) { checked weakened broken pruned }
      }`,
      { now: new Date(Date.now() + 120_000).toISOString() },
    );
    assert.ok(decayed.semanticEdgesDecay.pruned >= 1, 'transient semantic circuit should be pruned after decay');

    const edge = await gql(`query($id: ID!) { edge(id: $id) { id } }`, { id: edgeId });
    assert.equal(edge.edge, null);
  } finally {
    await gql(
      `mutation($a: ID!, $b: ID!, $e: ID!) {
        graphRemoveEdge(id: $e)
        graphRemoveNodeA: graphRemoveNode(id: $a)
        graphRemoveNodeB: graphRemoveNode(id: $b)
      }`,
      { a, b, e: edgeId || 'missing' },
    ).catch(() => {});
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const defaultEnvPath = resolve(repoRoot, '../../../services/openplanner/.env');
const openPlannerBaseUrl = (process.env.OPENPLANNER_E2E_URL || process.env.OPENPLANNER_URL || 'http://127.0.0.1:7777').replace(/\/+$/, '');
const vexxBaseUrl = (process.env.VEXX_E2E_URL || 'http://127.0.0.1:8791').replace(/\/+$/, '');

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

test('host PM2 Vexx sidecar is available for comparison work', async () => {
  const response = await fetch(`${vexxBaseUrl}/v1/health`);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.service, 'vexx');
});

test('semantic field tick builds Barnes-Hut cells and compares cell centroids through Vexx', async () => {
  const fieldProfile = `e2e.semantic-field.${Date.now()}`;
  const result = await openplanner('POST', '/graph/semantic-field/run', {
    fieldProfile,
    maxNodes: 64,
    maxDepth: 4,
    maxLeafSize: 8,
    maxInteractions: 256,
    minAbsCharge: 0,
    theta: 0.85,
  });

  assert.equal(result.ok, true);
  assert.equal(result.projection, 'barnes_hut_quadtree');
  assert.ok(result.nodeCount >= 2, 'semantic field needs at least two embedded nodes');
  assert.ok(result.cellCount >= 1, 'semantic field should persist at least a root cell');
  assert.ok(result.candidateInteractionCount >= 1, 'Barnes-Hut should produce bounded cell interactions');
  assert.ok(result.interactionCount >= 1, 'cell centroid comparisons should become force samples');
  assert.ok(String(result.comparisonProvider).startsWith('vexx:'), `expected Vexx provider, got ${result.comparisonProvider}`);
  assert.ok(result.vexxCalls >= 1, 'OpenPlanner should call host-side Vexx for cell comparisons');

  const cells = await openplanner('GET', `/graph/semantic-field/cells?fieldProfile=${encodeURIComponent(fieldProfile)}&limit=10`);
  assert.equal(cells.ok, true);
  assert.ok(cells.count >= 1);
  assert.equal(cells.cells[0].compatibilityKind, 'semantic_field_cell');
});

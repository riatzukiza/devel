import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const defaultEnvPath = resolve(repoRoot, '../../../services/openplanner/.env');
const openPlannerBaseUrl = (process.env.OPENPLANNER_E2E_URL || process.env.OPENPLANNER_URL || 'http://127.0.0.1:7777').replace(/\/+$/, '');
const graphWeaverBaseUrl = (process.env.GRAPH_WEAVER_E2E_URL || 'http://127.0.0.1:8796').replace(/\/+$/, '');

function readEnvValue(path, key) {
  try {
    const text = readFileSync(path, 'utf8');
    const line = text.split(/\r?\n/).find((row) => row.trim().startsWith(`${key}=`));
    if (!line) return '';
    return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
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

async function graphWeaverGraphQL(query, variables = {}) {
  const response = await fetch(`${graphWeaverBaseUrl}/graphql`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  assert.ok(response.ok, `Graph Weaver GraphQL HTTP ${response.status}: ${JSON.stringify(payload).slice(0, 1000)}`);
  assert.equal(payload.errors, undefined, `Graph Weaver GraphQL errors: ${JSON.stringify(payload.errors)}`);
  return payload.data;
}

test('graph-weaver exposes semantic field cells and multipole samples as an audit overlay', async () => {
  const fieldProfile = `e2e.graph-weaver-field.${Date.now()}`;
  const run = await openplanner('POST', '/graph/semantic-field/run', {
    fieldProfile,
    maxNodes: 64,
    maxDepth: 4,
    maxLeafSize: 8,
    maxInteractions: 256,
    minAbsCharge: 0,
    theta: 0.85,
  });

  assert.equal(run.ok, true);
  assert.ok(run.cellCount >= 1, 'OpenPlanner should persist semantic field cells for the overlay');
  assert.ok(run.interactionCount >= 1, 'OpenPlanner should persist semantic_field_multipole samples for the overlay');

  const data = await graphWeaverGraphQL(
    `query FieldOverlay($fieldProfile: String!) {
      semanticFieldOverlay(fieldProfile: $fieldProfile, cellLimit: 1000, sampleLimit: 5000) {
        cells { id fieldProfile level centerX centerY halfExtent nodeCount childCellIds dataJson }
        samples { source target similarity charge forceKind fieldProfile dataJson }
      }
    }`,
    { fieldProfile },
  );

  const overlay = data.semanticFieldOverlay;
  assert.ok(overlay.cells.length >= 1, 'Graph Weaver should return semantic field cells');
  assert.ok(overlay.samples.length >= 1, 'Graph Weaver should return semantic field multipole samples');
  assert.ok(overlay.cells.every((cell) => cell.fieldProfile === fieldProfile));
  assert.ok(overlay.samples.every((sample) => sample.forceKind === 'semantic_field_multipole'));
  assert.ok(overlay.samples.every((sample) => sample.fieldProfile === fieldProfile));
  assert.ok(overlay.samples.every((sample) => sample.similarity >= -1 && sample.similarity <= 1));
  assert.ok(overlay.cells.every((cell) => JSON.parse(cell.dataJson).cell_id === cell.id));
});

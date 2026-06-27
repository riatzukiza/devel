import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { graphRoutes } from '../src/routes/v1/graph.ts';

class InMemoryEdgeClaimCollection {
  constructor() {
    this.rows = new Map();
  }

  async updateOne(filter, update, options = {}) {
    const id = String(filter?._id ?? '');
    const existing = this.rows.get(id);
    if (!existing && !options.upsert) return { matchedCount: 0, upsertedCount: 0 };

    const row = existing ? { ...existing } : { _id: id, ...(update.$setOnInsert ?? {}) };
    if (update.$set) Object.assign(row, update.$set);
    if (update.$addToSet) {
      for (const [field, value] of Object.entries(update.$addToSet)) {
        const existingValues = Array.isArray(row[field]) ? row[field] : [];
        const nextValues = value && Array.isArray(value.$each) ? value.$each : [value];
        row[field] = [...new Set([...existingValues, ...nextValues])];
      }
    }
    this.rows.set(id, row);
    return { matchedCount: existing ? 1 : 0, upsertedCount: existing ? 0 : 1 };
  }

  async findOne(filter) {
    const id = String(filter?._id ?? '');
    const row = this.rows.get(id);
    return row ? { ...row } : null;
  }

  find(filter = {}) {
    let rows = [...this.rows.values()].map((row) => ({ ...row }));
    rows = rows.filter((row) => matchesFilter(row, filter));
    return {
      sort(sortSpec = {}) {
        const entries = Object.entries(sortSpec);
        rows.sort((left, right) => {
          for (const [field, direction] of entries) {
            const a = left[field];
            const b = right[field];
            if (a === b) continue;
            const cmp = a > b ? 1 : -1;
            return direction < 0 ? -cmp : cmp;
          }
          return 0;
        });
        return this;
      },
      limit(n) {
        rows = rows.slice(0, n);
        return this;
      },
      async toArray() {
        return rows;
      },
    };
  }
}

function matchesFilter(row, filter) {
  for (const [field, expected] of Object.entries(filter)) {
    if (field === '$or') {
      if (!expected.some((branch) => matchesFilter(row, branch))) return false;
      continue;
    }
    if (field === '$and') {
      if (!expected.every((branch) => matchesFilter(row, branch))) return false;
      continue;
    }
    if (field === 'scope.project') {
      if (row.scope?.project !== expected) return false;
      continue;
    }
    if (field === 'valid_until') {
      if (expected === null) {
        if (row.valid_until !== null) return false;
        continue;
      }
      if (expected.$exists === false) {
        if ('valid_until' in row) return false;
        continue;
      }
      if (expected.$gt) {
        const rowTime = row.valid_until instanceof Date ? row.valid_until.getTime() : new Date(row.valid_until).getTime();
        const expectedTime = expected.$gt instanceof Date ? expected.$gt.getTime() : new Date(expected.$gt).getTime();
        if (!(rowTime > expectedTime)) return false;
        continue;
      }
    }
    if (expected && typeof expected === 'object' && '$in' in expected) {
      if (!expected.$in.includes(row[field])) return false;
      continue;
    }
    if (row[field] !== expected) return false;
  }
  return true;
}

async function buildTestApp() {
  const app = Fastify({ logger: false });
  app.decorate('mongo', { graphEdgeClaims: new InMemoryEdgeClaimCollection() });
  await app.register(graphRoutes, { prefix: '/v1' });
  await app.ready();
  return app;
}

async function injectJson(app, method, url, payload) {
  const response = await app.inject({ method, url, payload });
  const body = response.json();
  return { response, body };
}

test('edge claim routes normalize creates and project through graph-claim-core', async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());

  const create = await injectJson(app, 'POST', '/v1/graph/edge-claims', {
    source_node_id: 'node:b',
    target_node_id: 'node:a',
    relation_kind: 'supports',
    direction: 'undirected',
    status: 'supported',
    confidence: '0.8',
    scope: { project: 'devel' },
  });

  assert.equal(create.response.statusCode, 200, JSON.stringify(create.body));
  assert.equal(create.body.claim.source_node_id, 'node:a');
  assert.equal(create.body.claim.target_node_id, 'node:b');
  assert.equal(create.body.claim.status, 'supported');
  assert.equal(create.body.decision.kind, 'accept');
  assert.match(create.body.claim.claim_id, /^edge_claim:[a-f0-9]{24}$/);

  const project = await injectJson(app, 'POST', '/v1/graph/edge-claims/project', {
    project: 'devel',
    now: '2026-01-01T00:00:00.000Z',
  });

  assert.equal(project.response.statusCode, 200, JSON.stringify(project.body));
  assert.equal(project.body.stats.edges, 1);
  assert.deepEqual(project.body.edges[0], {
    source: 'node:a',
    target: 'node:b',
    kind: 'supports',
    claim_id: create.body.claim.claim_id,
    confidence: 0.8,
    direction: 'undirected',
    scope: { project: 'devel' },
    status: 'supported',
  });
});

test('edge claim lifecycle routes use CLJS transition semantics', async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());

  const create = await injectJson(app, 'POST', '/v1/graph/edge-claims', {
    source_node_id: 'node:lifecycle:a',
    target_node_id: 'node:lifecycle:b',
    relation_kind: 'depends_on',
    status: 'proposed',
  });
  assert.equal(create.response.statusCode, 200, JSON.stringify(create.body));
  const claimId = create.body.claim.claim_id;

  const support = await injectJson(app, 'POST', `/v1/graph/edge-claims/${encodeURIComponent(claimId)}/support`, {
    status: 'active',
    confidence: '0.91',
    event_ids: ['event:1', 'event:1', 'event:2'],
  });
  assert.equal(support.response.statusCode, 200, JSON.stringify(support.body));
  assert.equal(support.body.transition.status, 'active');
  assert.equal(support.body.transition.confidence, 0.91);
  assert.deepEqual(support.body.transition.eventIds, ['event:1', 'event:2']);
  assert.deepEqual(support.body.claim.support_event_ids, ['event:1', 'event:2']);

  const refute = await injectJson(app, 'POST', `/v1/graph/edge-claims/${encodeURIComponent(claimId)}/refute`, {
    eventIds: ['event:3'],
  });
  assert.equal(refute.response.statusCode, 200, JSON.stringify(refute.body));
  assert.equal(refute.body.transition.status, 'refuted');
  assert.equal(refute.body.transition.eventField, 'refute_event_ids');
  assert.deepEqual(refute.body.claim.refute_event_ids, ['event:3']);

  const withdraw = await injectJson(app, 'POST', `/v1/graph/edge-claims/${encodeURIComponent(claimId)}/withdraw`, {});
  assert.equal(withdraw.response.statusCode, 200, JSON.stringify(withdraw.body));
  assert.equal(withdraw.body.transition.status, 'withdrawn');
  assert.equal(withdraw.body.claim.status, 'withdrawn');
});

test('edge claim create route returns structured validation errors', async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());

  const invalid = await injectJson(app, 'POST', '/v1/graph/edge-claims', {
    source_node_id: 'node:self',
    target_node_id: 'node:self',
    relation_kind: 'supports',
    confidence: 2,
  });

  assert.equal(invalid.response.statusCode, 400);
  assert.equal(invalid.body.error, 'invalid_edge_claim');
  assert.ok(invalid.body.details.some((detail) => detail.error === 'self-edge-not-allowed'));
});

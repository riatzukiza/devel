// GPL-3.0-only

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { appendTruthOp, loadTruthOps, buildTruthView, truthOpsPath } = require('../index.cjs');

test('append/load truth ops + build view resolves edges', () => {
  const td = fs.mkdtempSync(path.join(os.tmpdir(), 'eta-mu-truth-'));

  const docsIndexRows = [
    {
      entity_id: 'doc:a',
      source_rel_path: 'docs/a.md',
      links: [{ kind: 'wikilink', target_key: 'b', target: 'B', alias: '', line: 3 }],
    },
    {
      entity_id: 'doc:b',
      source_rel_path: 'docs/b.md',
      links: [],
    },
  ];

  let view = buildTruthView({ docsIndexRows, truthOps: [] });
  assert.equal(view.resolvedEdges.length, 0);
  assert.ok(view.unresolved.find((u) => u.target_key === 'b'));

  appendTruthOp({
    vaultRoot: td,
    op: { op: 'wikilink.resolve', target_key: 'b', dst_entity_id: 'doc:b' },
  });

  const ops = loadTruthOps({ vaultRoot: td });
  assert.equal(ops.length, 1);
  assert.equal(truthOpsPath(td), path.resolve(td, '.Π', 'ημ_truth_ops.v1.jsonl'));

  view = buildTruthView({ docsIndexRows, truthOps: ops });
  assert.equal(view.resolvedEdges.length, 1);
  assert.equal(view.resolvedEdges[0].dst_entity_id, 'doc:b');
  assert.equal(view.unresolved.find((u) => u.target_key === 'b'), undefined);
});

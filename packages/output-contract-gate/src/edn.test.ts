import test from 'node:test';
import assert from 'node:assert/strict';

import { compileAgentOutputContract } from './edn.js';
import { ETA_MU_FIVE_SECTION_CONTRACT_EDN } from './fixtures.js';

test('compileAgentOutputContract normalizes the eta-mu five-section contract', () => {
  const contract = compileAgentOutputContract(ETA_MU_FIVE_SECTION_CONTRACT_EDN);

  assert.equal(contract.name, 'eta-mu-five-section-response');
  assert.equal(contract.version, 'ημ.output/response-shape@0.1.0');
  assert.equal(contract.targetFormat, 'markdown');
  assert.equal(contract.targetAst, 'mdast');
  assert.equal(contract.repairMaxRetries, 2);
  assert.equal(contract.sections.length, 5);
  assert.deepEqual(
    contract.sections.map((section) => section.heading),
    ['Signal', 'Evidence', 'Frames', 'Countermoves', 'Next'],
  );
  assert.equal(contract.rulesById['rule/next-exactly-one-action']?.exactly, 1);
  assert.equal(contract.review.threshold, 0.8);
});

import test from 'node:test';
import assert from 'node:assert/strict';

import { compileAgentOutputContract } from './edn.js';
import {
  ETA_MU_FIVE_SECTION_CONTRACT_EDN,
  INVALID_FIVE_SECTION_RESPONSE,
  VALID_FIVE_SECTION_RESPONSE,
} from './fixtures.js';
import { validateMarkdownResponse } from './validate.js';

test('validateMarkdownResponse accepts a structurally valid five-section response', () => {
  const contract = compileAgentOutputContract(ETA_MU_FIVE_SECTION_CONTRACT_EDN);
  const result = validateMarkdownResponse(contract, VALID_FIVE_SECTION_RESPONSE);

  assert.equal(result.ok, true);
  assert.equal(result.failures.length, 0);
});

test('validateMarkdownResponse reports deterministic failures for malformed structure', () => {
  const contract = compileAgentOutputContract(ETA_MU_FIVE_SECTION_CONTRACT_EDN);
  const result = validateMarkdownResponse(contract, INVALID_FIVE_SECTION_RESPONSE);

  assert.equal(result.ok, false);
  assert.ok(result.failures.some((failure) => failure.ruleId === 'rule/section-order'));
  assert.ok(result.failures.some((failure) => failure.ruleId === 'rule/frames-cardinality'));
  assert.ok(result.failures.some((failure) => failure.ruleId === 'rule/next-exactly-one-action'));
});
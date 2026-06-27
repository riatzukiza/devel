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

test('validateMarkdownResponse does not interpret bold subheadings as section headers', () => {
  // Regression test: bold text like **Core Architecture:** inside sections
  // was being incorrectly interpreted as section headers, causing false
  // "section order mismatch" failures.
  const contract = compileAgentOutputContract(ETA_MU_FIVE_SECTION_CONTRACT_EDN);
  const response = `## Signal

Test signal.

## Evidence

**Core Architecture:**

1. Item one

**Key Helpers:**

- Helper one

## Frames

Frame 1: First interpretation.

Frame 2: Second interpretation.

## Countermoves

Countermove 1: First risk.

## Next

Do the next thing.
`;
  const result = validateMarkdownResponse(contract, response);

  // Should pass because **Core Architecture:** and **Key Helpers:** are
  // NOT converted to section headers - they're just bold text inside Evidence.
  assert.equal(result.ok, true, `Expected validation to pass but got failures: ${JSON.stringify(result.failures, null, 2)}`);
  assert.equal(result.sections.length, 5);
  assert.equal(result.sections[0].heading, 'Signal');
  assert.equal(result.sections[1].heading, 'Evidence');
  assert.equal(result.sections[2].heading, 'Frames');
  assert.equal(result.sections[3].heading, 'Countermoves');
  assert.equal(result.sections[4].heading, 'Next');
});
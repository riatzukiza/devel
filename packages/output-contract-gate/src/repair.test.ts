import test from 'node:test';
import assert from 'node:assert/strict';

import { compileAgentOutputContract } from './edn.js';
import {
  ETA_MU_FIVE_SECTION_CONTRACT_EDN,
  INVALID_FIVE_SECTION_RESPONSE,
} from './fixtures.js';
import { compileRepairPrompt } from './repair.js';
import { validateMarkdownResponse } from './validate.js';

test('compileRepairPrompt names exact structural deltas', () => {
  const contract = compileAgentOutputContract(ETA_MU_FIVE_SECTION_CONTRACT_EDN);
  const result = validateMarkdownResponse(contract, INVALID_FIVE_SECTION_RESPONSE);
  const prompt = compileRepairPrompt(contract, result);

  assert.match(prompt, /failed the structure contract/i);
  assert.match(prompt, /Reorder the existing sections to exactly: Signal, Evidence, Frames, Countermoves, Next/i);
  assert.match(prompt, /Rewrite `Frames` so it contains 2–3 plausible interpretations/i);
  assert.match(prompt, /Rewrite `Next` so it contains exactly one concrete next action/i);
});
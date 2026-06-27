import type { NormalizedContract, ValidationFailure, ValidationResult } from './types.js';

const interpolate = (template: string, failure: ValidationFailure): string => {
  const bindings = {
    ...(failure.expected ?? {}),
    ...(failure.actual ?? {}),
    heading: failure.heading,
  } as Record<string, unknown>;

  return template.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_match, key: string) => {
    const value = bindings[key];
    return value === undefined ? '' : String(value);
  });
};

const instructionForFailure = (contract: NormalizedContract, failure: ValidationFailure): string => {
  const template = contract.repairTemplatesByRuleId[failure.ruleId]?.[0];
  if (!template) return failure.message;
  return interpolate(template.text, failure);
};

export const compileRepairPrompt = (
  contract: NormalizedContract,
  result: ValidationResult,
): string => {
  if (result.ok) {
    return `Response already satisfies ${contract.name}.`;
  }

  const instructions = result.failures.map((failure, index) => `${index + 1}. ${instructionForFailure(contract, failure)}`);
  return [
    `Your last response failed the structure contract \`${contract.name}\`.`,
    'Repair only the following violations and preserve all passing content:',
    ...instructions,
    'Return Markdown only.',
  ].join('\n');
};
import jsedn from 'jsedn';

import type {
  ArbitrationForm,
  ContractRule,
  ContractSection,
  NormalizedContract,
  RepairTemplate,
  ReviewCriterion,
  ReviewPolicy,
} from './types.js';

type EdnValue = string | number | boolean | null | readonly EdnValue[];
type EdnList = readonly EdnValue[];

export class ContractCompileError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'ContractCompileError';
  }
}

const isList = (value: EdnValue | undefined): value is EdnList => Array.isArray(value);

const expectList = (value: EdnValue | undefined, message: string): EdnList => {
  if (!isList(value)) throw new ContractCompileError(message);
  return value;
};

const keywordToId = (value: EdnValue | undefined, label: string): string => {
  if (typeof value !== 'string') throw new ContractCompileError(`${label} must be a string/keyword`);
  return value.startsWith(':') ? value.slice(1) : value;
};

const stringValue = (value: EdnValue | undefined, label: string): string => {
  if (typeof value !== 'string') throw new ContractCompileError(`${label} must be a string`);
  return value;
};

const booleanValue = (value: EdnValue | undefined, label: string, fallback = false): boolean => {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') throw new ContractCompileError(`${label} must be a boolean`);
  return value;
};

const numberValue = (value: EdnValue | undefined, label: string, fallback?: number): number => {
  if (value === undefined) {
    if (fallback === undefined) throw new ContractCompileError(`${label} must be a number`);
    return fallback;
  }
  if (typeof value !== 'number' || Number.isNaN(value)) throw new ContractCompileError(`${label} must be a number`);
  return value;
};

const listChildren = (form: EdnList): readonly EdnList[] => form.slice(1).filter(Array.isArray) as readonly EdnList[];

const findChild = (form: EdnList, head: string): EdnList | undefined =>
  listChildren(form).find((entry) => entry[0] === head);

const requireChild = (form: EdnList, head: string): EdnList => {
  const child = findChild(form, head);
  if (!child) throw new ContractCompileError(`Missing required form (${head} ...)`);
  return child;
};

const parseStringVector = (value: EdnValue | undefined, label: string): readonly string[] => {
  if (value === undefined) return [];
  const vector = expectList(value, `${label} must be a vector/list`);
  return vector.map((entry) => keywordToId(entry, label));
};

const parseSection = (form: EdnList): ContractSection => {
  const id = keywordToId(requireChild(form, 'id')[1], 'section id');
  const heading = stringValue(requireChild(form, 'heading')[1], `heading for ${id}`);
  const required = booleanValue(findChild(form, 'required')?.[1], `required for ${id}`, false);
  const order = numberValue(findChild(form, 'order')?.[1], `order for ${id}`);
  const cardinalityRaw = keywordToId(findChild(form, 'cardinality')?.[1], `cardinality for ${id}`);
  const cardinality = cardinalityRaw === 'many' ? 'many' : 'one';
  const allowedNodeTypes = parseStringVector(findChild(form, 'allowed-node-types')?.[1], `allowed-node-types for ${id}`);
  const localRuleIds = parseStringVector(findChild(form, 'local-rules')?.[1], `local-rules for ${id}`);

  return { id, heading, required, order, cardinality, allowedNodeTypes, localRuleIds };
};

const parseRule = (form: EdnList): ContractRule => ({
  id: keywordToId(requireChild(form, 'id')[1], 'rule id'),
  kind: keywordToId(findChild(form, 'kind')?.[1], `kind for rule ${String(form[1] ?? '')}`),
  check: keywordToId(findChild(form, 'check')?.[1], `check for rule ${String(form[1] ?? '')}`),
  ...(findChild(form, 'section')?.[1] !== undefined ? { sectionId: keywordToId(findChild(form, 'section')?.[1], 'rule section') } : {}),
  ...(findChild(form, 'min')?.[1] !== undefined ? { min: numberValue(findChild(form, 'min')?.[1], 'rule min') } : {}),
  ...(findChild(form, 'max')?.[1] !== undefined ? { max: numberValue(findChild(form, 'max')?.[1], 'rule max') } : {}),
  ...(findChild(form, 'exactly')?.[1] !== undefined ? { exactly: numberValue(findChild(form, 'exactly')?.[1], 'rule exactly') } : {}),
});

const parseRepairTemplate = (form: EdnList): RepairTemplate => ({
  id: keywordToId(requireChild(form, 'id')[1], 'repair template id'),
  whenRuleId: keywordToId(requireChild(form, 'when')[1], 'repair template rule id'),
  text: stringValue(requireChild(form, 'text')[1], 'repair template text'),
});

const parseCriterion = (form: EdnList): ReviewCriterion => ({
  id: keywordToId(requireChild(form, 'id')[1], 'criterion id'),
  weight: numberValue(requireChild(form, 'weight')[1], 'criterion weight'),
});

const toRecord = <T extends { readonly id: string }>(items: readonly T[]): Readonly<Record<string, T>> =>
  Object.fromEntries(items.map((item) => [item.id, item]));

const groupTemplates = (templates: readonly RepairTemplate[]): Readonly<Record<string, readonly RepairTemplate[]>> => {
  const grouped = new Map<string, RepairTemplate[]>();
  for (const template of templates) {
    const bucket = grouped.get(template.whenRuleId) ?? [];
    bucket.push(template);
    grouped.set(template.whenRuleId, bucket);
  }
  return Object.fromEntries(grouped.entries());
};

export const parseEdnForm = (source: string): EdnValue => jsedn.toJS(jsedn.parse(source)) as EdnValue;

export const compileAgentOutputContract = (source: string): NormalizedContract => {
  const form = expectList(parseEdnForm(source), 'Contract root must be a list');
  if (form[0] !== 'agent-output-contract') {
    throw new ContractCompileError('Root form must be (agent-output-contract ...)');
  }

  const name = stringValue(requireChild(form, 'name')[1], 'contract name');
  const version = stringValue(requireChild(form, 'v')[1], 'contract version');
  const target = requireChild(form, 'target');
  const structure = requireChild(form, 'structure');
  const rulesForm = requireChild(form, 'rules');
  const repairForm = requireChild(form, 'repair');
  const reviewForm = requireChild(form, 'review');
  const arbitrationForm = requireChild(form, 'arbitration');

  const sections = listChildren(structure)
    .filter((entry) => entry[0] === 'section')
    .map(parseSection)
    .sort((left, right) => left.order - right.order);

  const sectionsById = toRecord(sections);
  const sectionsByHeading = Object.fromEntries(sections.map((section) => [section.heading, section]));
  const rules = listChildren(rulesForm).filter((entry) => entry[0] === 'rule').map(parseRule);
  const rulesById = toRecord(rules);
  const repairTemplates = listChildren(repairForm).filter((entry) => entry[0] === 'template').map(parseRepairTemplate);
  const repairTemplatesByRuleId = groupTemplates(repairTemplates);
  const review: ReviewPolicy = {
    enabled: booleanValue(findChild(reviewForm, 'enabled')?.[1], 'review enabled', true),
    reviewerFamily: findChild(reviewForm, 'reviewer-family')?.[1]
      ? keywordToId(findChild(reviewForm, 'reviewer-family')?.[1], 'reviewer family')
      : undefined,
    threshold: numberValue(findChild(reviewForm, 'threshold')?.[1], 'review threshold', 0.8),
    criteria: listChildren(requireChild(reviewForm, 'criteria')).filter((entry) => entry[0] === 'criterion').map(parseCriterion),
  };

  return {
    name,
    version,
    targetFormat: keywordToId(requireChild(target, 'format')[1], 'target format'),
    targetAst: keywordToId(requireChild(target, 'ast')[1], 'target ast'),
    targetRoot: keywordToId(requireChild(target, 'root')[1], 'target root'),
    repairMaxRetries: numberValue(findChild(repairForm, 'max-retries')?.[1], 'repair max-retries', 0),
    sections,
    sectionsById,
    sectionsByHeading,
    rules,
    rulesById,
    repairTemplates,
    repairTemplatesByRuleId,
    review,
    arbitration: listChildren(arbitrationForm) as readonly ArbitrationForm[],
  };
};

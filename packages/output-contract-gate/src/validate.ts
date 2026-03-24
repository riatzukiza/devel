import type {
  ContractRule,
  ContractSection,
  FailureReport,
  ExtractedSection,
  NormalizedContract,
  ValidationFailure,
  ValidationResult,
} from './types.js';
import { countSemanticItems, extractMarkdownSections } from './markdown.js';

const buildFailure = (
  contract: NormalizedContract,
  failure: Omit<ValidationFailure, 'message'> & { readonly message?: string },
): ValidationFailure => ({
  ...failure,
  message: failure.message ?? `Violation of ${failure.ruleId}`,
});

const getSectionByHeading = (sections: readonly ExtractedSection[], heading: string): readonly ExtractedSection[] =>
  sections.filter((section) => section.heading === heading);

const validateRequiredSections = (
  contract: NormalizedContract,
  sections: readonly ExtractedSection[],
): ValidationFailure[] =>
  contract.sections.flatMap((section) => {
    const matches = getSectionByHeading(sections, section.heading);
    if (section.required && matches.length === 0) {
      return [
        buildFailure(contract, {
          ruleId: 'rule/required-section',
          sectionId: section.id,
          heading: section.heading,
          expected: { heading: section.heading, order: section.order },
          actual: { present: false },
          message: `Missing required section \`${section.heading}\``,
        }),
      ];
    }
    if (matches.length > 1) {
      return [
        buildFailure(contract, {
          ruleId: 'rule/unique-section',
          sectionId: section.id,
          heading: section.heading,
          expected: { maxOccurrences: 1 },
          actual: { occurrences: matches.length },
          message: `Section \`${section.heading}\` appears ${matches.length} times`,
        }),
      ];
    }
    return [];
  });

const validateSectionOrder = (
  contract: NormalizedContract,
  sections: readonly ExtractedSection[],
): ValidationFailure[] => {
  const expected = contract.sections.map((section) => section.heading);
  const actual = sections.map((section) => section.heading);
  if (expected.length === actual.length && expected.every((heading, index) => heading === actual[index])) {
    return [];
  }
  return [
    buildFailure(contract, {
      ruleId: 'rule/section-order',
      expected: { headings: expected },
      actual: { headings: actual },
      message: `Section order mismatch. Expected ${expected.join(', ')}, received ${actual.join(', ')}`,
    }),
  ];
};

const validateAllowedNodeTypes = (
  contract: NormalizedContract,
  sections: readonly ExtractedSection[],
): ValidationFailure[] => {
  const failures: ValidationFailure[] = [];

  for (const section of sections) {
    const expectedSection = contract.sectionsByHeading[section.heading];
    if (!expectedSection) continue;
    for (const node of section.nodes) {
      if (!expectedSection.allowedNodeTypes.includes(node.type)) {
        failures.push(
          buildFailure(contract, {
            ruleId: 'rule/allowed-node-types',
            sectionId: expectedSection.id,
            heading: section.heading,
            expected: { allowedNodeTypes: expectedSection.allowedNodeTypes },
            actual: { nodeType: node.type },
            message: `Section \`${section.heading}\` contains disallowed node type \`${node.type}\``,
          }),
        );
      }
    }
  }

  return failures;
};

const validateCountRule = (
  contract: NormalizedContract,
  sections: readonly ExtractedSection[],
  rule: ContractRule,
): ValidationFailure[] => {
  if (!rule.sectionId) return [];
  const sectionConfig = contract.sectionsById[rule.sectionId];
  if (!sectionConfig) return [];
  const section = getSectionByHeading(sections, sectionConfig.heading)[0];
  if (!section) return [];
  const itemCount = countSemanticItems(section);

  if (typeof rule.exactly === 'number' && itemCount !== rule.exactly) {
    return [
      buildFailure(contract, {
        ruleId: rule.id,
        sectionId: sectionConfig.id,
        heading: sectionConfig.heading,
        expected: { exactly: rule.exactly },
        actual: { count: itemCount },
        message: `Section \`${sectionConfig.heading}\` must contain exactly ${rule.exactly} semantic item(s)`,
      }),
    ];
  }

  if (typeof rule.min === 'number' && itemCount < rule.min) {
    return [
      buildFailure(contract, {
        ruleId: rule.id,
        sectionId: sectionConfig.id,
        heading: sectionConfig.heading,
        expected: { min: rule.min, max: rule.max },
        actual: { count: itemCount },
        message: `Section \`${sectionConfig.heading}\` must contain at least ${rule.min} semantic item(s)`,
      }),
    ];
  }

  if (typeof rule.max === 'number' && itemCount > rule.max) {
    return [
      buildFailure(contract, {
        ruleId: rule.id,
        sectionId: sectionConfig.id,
        heading: sectionConfig.heading,
        expected: { min: rule.min, max: rule.max },
        actual: { count: itemCount },
        message: `Section \`${sectionConfig.heading}\` must contain at most ${rule.max} semantic item(s)`,
      }),
    ];
  }

  return [];
};

export const validateMarkdownResponse = (
  contract: NormalizedContract,
  markdown: string,
): ValidationResult => {
  const extracted = extractMarkdownSections(markdown);
  const failures = [
    ...validateRequiredSections(contract, extracted.sections),
    ...validateSectionOrder(contract, extracted.sections),
    ...validateAllowedNodeTypes(contract, extracted.sections),
    ...contract.rules.flatMap((rule) => validateCountRule(contract, extracted.sections, rule)),
  ];

  return {
    ok: failures.length === 0,
    sections: extracted.sections,
    failures,
  };
};

export const toFailureReport = (
  contract: NormalizedContract,
  result: ValidationResult,
): FailureReport => ({
  contract: contract.name,
  version: contract.version,
  stage: 'structure',
  ok: result.ok,
  failures: result.failures,
});
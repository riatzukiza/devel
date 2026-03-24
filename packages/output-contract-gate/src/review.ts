import type { FailureReport, NormalizedContract, ReviewCriterion, ReviewCriterionScore, ReviewReport } from './types.js';
import { extractMarkdownSections, nodeText } from './markdown.js';

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const wordCount = (text: string): number => {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
};

const sectionText = (markdown: string, heading: string): string => {
  const document = extractMarkdownSections(markdown);
  const section = document.sections.find((entry) => entry.heading === heading);
  if (!section) return '';
  return section.nodes.map((node) => nodeText(node)).join(' ').trim();
};

const fallbackCriterion = (criterion: ReviewCriterion): ReviewCriterionScore => ({
  id: criterion.id,
  weight: criterion.weight,
  score: 0.7,
  note: 'Stub reviewer defaulted this criterion because no specialized heuristic exists yet.',
});

const fidelityCriterion = (criterion: ReviewCriterion, structureReport: FailureReport): ReviewCriterionScore => ({
  id: criterion.id,
  weight: criterion.weight,
  score: structureReport.ok ? 1 : 0,
  note: structureReport.ok
    ? 'Structure gate already passed; the stub treats structural fidelity as complete.'
    : 'Structure gate failed, so contract fidelity cannot pass review.',
});

const shortcuttingCriterion = (criterion: ReviewCriterion, markdown: string): ReviewCriterionScore => {
  const evidenceWords = wordCount(sectionText(markdown, 'Evidence'));
  const framesWords = wordCount(sectionText(markdown, 'Frames'));
  const countermovesWords = wordCount(sectionText(markdown, 'Countermoves'));
  const density = (Math.min(evidenceWords / 20, 1) + Math.min(framesWords / 20, 1) + Math.min(countermovesWords / 20, 1)) / 3;
  const score = clamp01(0.45 + density * 0.5);
  return {
    id: criterion.id,
    weight: criterion.weight,
    score,
    note: `Stub inferred shortcutting resistance from Evidence/Frames/Countermoves density (${evidenceWords}/${framesWords}/${countermovesWords} words).`,
  };
};

const contextAlignmentCriterion = (criterion: ReviewCriterion): ReviewCriterionScore => ({
  id: criterion.id,
  weight: criterion.weight,
  score: 0.65,
  note: 'Stub reviewer cannot inspect session history deeply yet, so context alignment is conservatively partial.',
});

const actionabilityCriterion = (criterion: ReviewCriterion, markdown: string): ReviewCriterionScore => {
  const nextWords = wordCount(sectionText(markdown, 'Next'));
  const score = nextWords >= 4 ? 0.9 : nextWords > 0 ? 0.7 : 0.2;
  return {
    id: criterion.id,
    weight: criterion.weight,
    score,
    note: `Stub actionability score derived from Next-section specificity (${nextWords} words).`,
  };
};

const scoreCriterion = (
  criterion: ReviewCriterion,
  contract: NormalizedContract,
  markdown: string,
  structureReport: FailureReport,
): ReviewCriterionScore => {
  switch (criterion.id) {
    case 'criterion/contract-fidelity':
      return fidelityCriterion(criterion, structureReport);
    case 'criterion/shortcutting-risk':
      return shortcuttingCriterion(criterion, markdown);
    case 'criterion/context-alignment':
      return contextAlignmentCriterion(criterion);
    case 'criterion/actionability':
      return actionabilityCriterion(criterion, markdown);
    default:
      return fallbackCriterion(criterion);
  }
};

export const buildStubReviewReport = (
  contract: NormalizedContract,
  markdown: string,
  structureReport: FailureReport,
): ReviewReport => {
  const criteria = contract.review.criteria.map((criterion) => scoreCriterion(criterion, contract, markdown, structureReport));
  const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0) || 1;
  const overallScore = clamp01(criteria.reduce((sum, criterion) => sum + criterion.score * criterion.weight, 0) / totalWeight);

  const deltas: string[] = [];
  const shortcutting = criteria.find((criterion) => criterion.id === 'criterion/shortcutting-risk');
  const context = criteria.find((criterion) => criterion.id === 'criterion/context-alignment');
  const actionability = criteria.find((criterion) => criterion.id === 'criterion/actionability');

  if (shortcutting && shortcutting.score < 0.8) {
    deltas.push('Evidence, Frames, or Countermoves look terse; deepen the body under the existing headings before relying on semantic review.');
  }
  if (context && context.score < 0.75) {
    deltas.push('Stub review cannot strongly assess session-context alignment yet; rerun with a GPT-family reviewer when integrated.');
  }
  if (actionability && actionability.score < 0.8) {
    deltas.push('Next is structurally valid but may need a more concrete or specific action phrase.');
  }

  return {
    stage: 'review',
    reviewer: 'stub',
    ok: overallScore >= contract.review.threshold,
    threshold: contract.review.threshold,
    overallScore,
    criteria,
    deltas,
    limitations: [
      'This is a deterministic review stub, not a GPT-family semantic reviewer.',
      'Session-history sensitivity is currently approximated rather than inferred from real context.',
    ],
    generatedAt: new Date().toISOString(),
  };
};
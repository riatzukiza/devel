import type { FailureReport, GptReviewConfig, GptReviewMessage, NormalizedContract, ReviewCriterion, ReviewCriterionScore, ReviewReport } from './types.js';
import { extractMarkdownSections, nodeText } from './markdown.js';

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

// ============================================================================
// Stub Reviewer (deterministic heuristics)
// ============================================================================

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

// ============================================================================
// GPT Reviewer (semantic analysis)
// ============================================================================

const REVIEW_CRITERIA_DESCRIPTIONS: Record<string, string> = {
  'criterion/contract-fidelity': 'Does the response satisfy all structural and semantic requirements of the contract? Are all required sections present with appropriate content?',
  'criterion/shortcutting-risk': 'Did the model take shortcuts, omit important details, or produce generic filler instead of substantive content? Look for thin Evidence, vague Frames, or weak Countermoves.',
  'criterion/context-alignment': 'Is the response aligned with the session context? Does it address the actual user intent or drift into irrelevant territory?',
  'criterion/actionability': 'Is the Next section actionable? Does it provide a single concrete step rather than vague directions?',
};

const buildReviewSystemPrompt = (contract: NormalizedContract): string => {
  const headings = contract.sections.map((s) => s.heading).join(', ');
  const criteriaDescriptions = contract.review.criteria
    .map((c) => `- ${c.id} (weight ${c.weight}): ${REVIEW_CRITERIA_DESCRIPTIONS[c.id] ?? 'No description available'}`)
    .join('\n');

  return `You are a contract compliance reviewer. Score the candidate response against the contract criteria.

Contract name: ${contract.name}
Contract version: ${contract.version}
Required sections: ${headings}

Criteria:
${criteriaDescriptions}

Score each criterion from 0.0 to 1.0.
Compute overallScore as the weighted average of criterion scores.
Threshold for passing: ${contract.review.threshold}

Return ONLY a JSON object with this exact shape (no markdown code blocks):
{
  "criteria": [
    {"id": "criterion/contract-fidelity", "score": 0.0-1.0, "note": "brief explanation"},
    {"id": "criterion/shortcutting-risk", "score": 0.0-1.0, "note": "brief explanation"},
    {"id": "criterion/context-alignment", "score": 0.0-1.0, "note": "brief explanation"},
    {"id": "criterion/actionability", "score": 0.0-1.0, "note": "brief explanation"}
  ],
  "deltas": ["actionable improvement suggestion 1", "actionable improvement suggestion 2"]
}`;
};

const buildReviewUserPrompt = (
  contract: NormalizedContract,
  candidateMarkdown: string,
  sessionHistory?: readonly { readonly role: 'user' | 'assistant'; readonly content: string }[],
): string => {
  const parts: string[] = [`Candidate response:\n\n${candidateMarkdown}`];

  if (sessionHistory && sessionHistory.length > 0) {
    const turnsText = sessionHistory
      .slice(-10) // Last 10 turns max
      .map((turn) => `${turn.role}: ${turn.content}`)
      .join('\n\n');
    parts.push(`\nSession context (last ${Math.min(sessionHistory.length, 10)} turns):\n\n${turnsText}`);
  }

  parts.push('\nReturn JSON with criteria scores and deltas.');

  return parts.join('\n');
};

export const buildReviewMessages = (
  contract: NormalizedContract,
  candidateMarkdown: string,
  sessionHistory?: readonly { readonly role: 'user' | 'assistant'; readonly content: string }[],
): readonly GptReviewMessage[] => {
  return [
    { role: 'system', content: buildReviewSystemPrompt(contract) },
    { role: 'user', content: buildReviewUserPrompt(contract, candidateMarkdown, sessionHistory) },
  ];
};

type GptReviewOutput = {
  criteria: Array<{ id: string; score: number; note: string }>;
  deltas: string[];
};

const isGptReviewOutput = (value: unknown): value is GptReviewOutput => {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  if (!Array.isArray(obj.criteria)) return false;
  if (!Array.isArray(obj.deltas)) return false;
  for (const c of obj.criteria) {
    if (!c || typeof c !== 'object') return false;
    const crit = c as Record<string, unknown>;
    if (typeof crit.id !== 'string') return false;
    if (typeof crit.score !== 'number') return false;
    if (typeof crit.note !== 'string') return false;
  }
  for (const d of obj.deltas) {
    if (typeof d !== 'string') return false;
  }
  return true;
};

const parseGptReviewOutput = (text: string): GptReviewOutput => {
  // Try to extract JSON from potential markdown code blocks
  let jsonText = text.trim();
  const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1]?.trim() ?? jsonText;
  }

  try {
    const parsed = JSON.parse(jsonText);
    if (!isGptReviewOutput(parsed)) {
      throw new Error('Parsed output does not match expected schema');
    }
    return parsed;
  } catch (error) {
    throw new Error(`Failed to parse GPT review output: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const callGptReviewer = async (
  messages: readonly GptReviewMessage[],
  config: GptReviewConfig,
): Promise<{ output: GptReviewOutput; modelId: string }> => {
  const baseUrl = config.baseUrl?.replace(/\/+$/, '') ?? process.env.OPENAI_BASE_URL ?? 'http://127.0.0.1:8789/v1';
  const model = config.model ?? process.env.OUTPUT_CONTRACT_GATE_MODEL ?? process.env.MODEL ?? 'gpt-5.4';
  const apiKey = config.apiKey ?? process.env.OUTPUT_CONTRACT_GATE_API_KEY ?? process.env.OPENAI_API_KEY ?? process.env.OPEN_HAX_OPENAI_PROXY_AUTH_TOKEN ?? process.env.PROXY_AUTH_TOKEN;
  const temperature = config.temperature ?? 0.3;

  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (apiKey) {
    headers.set('Authorization', `Bearer ${apiKey}`);
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GPT reviewer error ${response.status}: ${body}`);
  }

  const payload = await response.json();
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new Error('GPT reviewer returned no choices');
  }

  const first = choices[0] as { message?: { content?: unknown } };
  const content = first.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('GPT reviewer returned empty content');
  }

  const output = parseGptReviewOutput(content);
  return { output, modelId: model };
};

const mapGptOutputToCriteria = (
  contract: NormalizedContract,
  gptCriteria: Array<{ id: string; score: number; note: string }>,
): readonly ReviewCriterionScore[] => {
  const gptMap = new Map(gptCriteria.map((c) => [c.id, c]));

  return contract.review.criteria.map((criterion) => {
    const gptResult = gptMap.get(criterion.id);
    if (gptResult) {
      return {
        id: criterion.id,
        weight: criterion.weight,
        score: clamp01(gptResult.score),
        note: gptResult.note,
      };
    }
    // Fallback if GPT didn't return this criterion
    return {
      id: criterion.id,
      weight: criterion.weight,
      score: 0.5,
      note: 'GPT reviewer did not return this criterion; using fallback score.',
    };
  });
};

export const buildGptReviewReport = async (
  contract: NormalizedContract,
  candidateMarkdown: string,
  structureReport: FailureReport,
  config: GptReviewConfig = {},
): Promise<ReviewReport> => {
  const fallbackToStub = config.fallbackToStub ?? true;
  const maxSessionTurns = config.maxSessionTurns ?? 10;

  // Trim session history if needed
  const trimmedHistory = config.sessionHistory?.slice(-maxSessionTurns);

  // Build messages
  const messages = buildReviewMessages(contract, candidateMarkdown, trimmedHistory);

  try {
    const { output, modelId } = await callGptReviewer(messages, config);
    const criteria = mapGptOutputToCriteria(contract, output.criteria);
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0) || 1;
    const overallScore = clamp01(criteria.reduce((sum, c) => sum + c.score * c.weight, 0) / totalWeight);

    return {
      stage: 'review',
      reviewer: 'gpt',
      ok: overallScore >= contract.review.threshold,
      threshold: contract.review.threshold,
      overallScore,
      criteria,
      deltas: output.deltas,
      limitations: [],
      generatedAt: new Date().toISOString(),
      modelId,
      sessionTurns: trimmedHistory?.length ?? 0,
    };
  } catch (error) {
    if (!fallbackToStub) {
      throw error;
    }

    // Fall back to stub reviewer
    const stubReport = buildStubReviewReport(contract, candidateMarkdown, structureReport);
    return {
      ...stubReport,
      limitations: [
        ...stubReport.limitations,
        `GPT reviewer unavailable (${error instanceof Error ? error.message : String(error)}). Fell back to stub reviewer.`,
      ],
    };
  }
};
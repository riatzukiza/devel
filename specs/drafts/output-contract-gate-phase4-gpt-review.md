---
title: "Phase 4: GPT Review Integration"
status: draft
created_at: "2026-03-24"
parent: "contract-enforced-agent-output-pipeline-2026-03-23.md"
tags: [contracts, review, gpt, phase-4]
license: GPL-3.0-only
---

# Phase 4: GPT Review Integration

## Summary

Wire GPT-5.4 into the review gate to replace the deterministic stub reviewer with semantic scoring.

**Architecture context:** This is part of a two-model system:
- **z.ai GLM 5**: Fast implementation, generates candidate responses, handles repair loops
- **GPT-5.4**: Interpretation, review, guidance, enforcement (semantic review pass)

The stub reviewer in `review.ts` is intentionally limited:
- cannot inspect session history
- cannot assess context alignment
- uses word-count heuristics instead of semantic understanding

This spec describes the integration to replace `buildStubReviewReport()` with `buildGptReviewReport()` while preserving the stub as a graceful fallback.

## Scope

### In scope
- GPT-family reviewer with OpenAI-compatible transport
- Session history injection for context alignment scoring
- CLI command `review-gpt` for testing
- Extension hook for automatic post-structure review
- Bounded retries and fallback to stub

### Out of scope
- Broad truth verification
- Multi-model ensemble review
- Custom reviewer prompt templates per contract

## Architecture

### Review flow

```
Structure Gate passes
  -> buildGptReviewReport(contract, markdown, structureReport, sessionHistory?)
  -> GPT-family model scores contract fidelity, shortcutting, context, actionability
  -> Return ReviewReport or fall back to stub on failure
```

### Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `buildGptReviewReport()` | `review.ts` | Build messages, call GPT, parse structured scores |
| `buildReviewPrompt()` | `review.ts` | Construct system + user messages for reviewer |
| CLI `review-gpt` | `cli.ts` | Command-line interface for testing |
| Extension hook | `output-contract-gate.ts` | Invoke GPT review after structure passes |

## Interface

### Review function signature

```typescript
type GptReviewConfig = {
  readonly model?: string;           // default: gpt-5.4
  readonly baseUrl?: string;          // default: OPENAI_BASE_URL or http://127.0.0.1:8789/v1
  readonly apiKey?: string;           // default: OPENAI_API_KEY env
  readonly sessionHistory?: readonly { role: 'user' | 'assistant'; content: string }[];
  readonly maxSessionTurns?: number;  // default: 10
  readonly fallbackToStub?: boolean;  // default: true (on transient failures only)
};

export const buildGptReviewReport = async (
  contract: NormalizedContract,
  markdown: string,
  structureReport: FailureReport,
  config?: GptReviewConfig,
): Promise<ReviewReport>;
```

Note: `fallbackToStub` defaults to `true` only for transient failures (rate limits, timeouts). Parse failures or auth errors should propagate.

### Return shape (same as stub)

```typescript
type ReviewReport = {
  stage: 'review';
  reviewer: 'gpt' | 'stub';
  ok: boolean;
  threshold: number;
  overallScore: number;
  criteria: ReviewCriterionScore[];
  deltas: string[];
  limitations?: string[];
  generatedAt: string;
  modelId?: string;  // for GPT reviewer
};
```

## Prompt construction

### System message

```
You are a contract compliance reviewer.
Score the candidate response against the contract criteria.
Return ONLY a JSON object with no other text.

Contract name: {{contract-name}}
Contract version: {{contract-version}}
Required sections: {{headings}}

Criteria:
{{#each criteria}}
- {{id}} (weight {{weight}}): {{description}}
{{/each}}

Score each criterion from 0.0 to 1.0.
Compute overallScore as weighted average.
```

### User message

```
Candidate response:

{{markdown}}

{{#if sessionHistory}}
Session context (last {{turns}} turns):

{{#each sessionHistory}}
{{role}}: {{content}}
{{/each}}
{{/if}}

Return JSON with this exact shape:
{
  "criteria": [
    {"id": "criterion/contract-fidelity", "score": 0.0-1.0, "note": "..."},
    {"id": "criterion/shortcutting-risk", "score": 0.0-1.0, "note": "..."},
    {"id": "criterion/context-alignment", "score": 0.0-1.0, "note": "..."},
    {"id": "criterion/actionability", "score": 0.0-1.0, "note": "..."}
  ],
  "deltas": ["actionable improvement suggestion 1", "actionable improvement suggestion 2"]
}
```

## Score parsing

The reviewer must return valid JSON. On parse failure:
1. Log the failure
2. If `fallbackToStub: true`, return stub report with limitation noting parse failure
3. If `fallbackToStub: false`, throw ReviewParseError

## Fallback behavior

When GPT call fails (rate limit, timeout, auth error, parse failure):
1. Return stub report
2. Add limitation: `"GPT reviewer unavailable: {error}. Falling back to stub."`
3. Set `reviewer: 'stub'` in Report

This ensures the pipeline never crashes on reviewer unavailability.

## CLI command

### review-gpt

```bash
node dist/cli.js review-gpt \
  --bundle artifacts/output-contract-gate/<run-id> \
  --model gpt-5.4 \
  --base-url http://127.0.0.1:8789/v1 \
  --api-key $OPENAI_API_KEY \
  --max-session-turns 10
```

Flags:
- `--bundle <path>`: Required. Path to artifact bundle with valid structure.
- `--model <id>`: Optional. Default: `gpt-5.4`.
- `--base-url <url>`: Optional. Default: `OPENAI_BASE_URL` or `http://127.0.0.1:8789/v1`.
- `--api-key <token>`: Optional. Default: `OPENAI_API_KEY` env.
- `--max-session-turns <n>`: Optional. Default: 10.
- `--no-fallback`: Disable stub fallback on GPT failure.

Exit codes:
- `0`: Review passed (overallScore >= threshold)
- `1`: Review failed (overallScore < threshold)
- `2`: Bundle invalid or GPT call failed without fallback

## Extension integration

In `output-contract-gate.ts`, after structure validation passes:

```typescript
// In validateLatestAssistant()
if (result.ok && state.config.enableGptReview) {
  const sessionHistory = extractMessages(ctx).slice(-state.config.maxSessionTurns);
  const review = await buildGptReviewReport(
    cached.contract,
    assistantText,
    result.report,
    {
      model: state.config.gptReviewModel,
      baseUrl: state.config.gptReviewBaseUrl,
      apiKey: state.config.gptReviewApiKey,
      sessionHistory,
      maxSessionTurns: state.config.maxSessionTurns,
      fallbackToStub: true,
    },
  );
  result.review = review;
}
```

### Configuration

Add to `GateConfig`:

```typescript
type GateConfig = {
  enabled: boolean;
  autoRepair: boolean;
  contractPath: string;
  // Phase 4 additions
  enableGptReview?: boolean;      // default: false
  gptReviewModel?: string;         // default: 'gpt-5.4'
  gptReviewBaseUrl?: string;      // default: OPENAI_BASE_URL
  gptReviewApiKey?: string;        // default: OPENAI_API_KEY
  maxSessionTurns?: number;       // default: 10
};
```

**Architecture note:** This is part of a two-model architecture:
- z.ai GLM 5 handles fast implementation work (candidate generation)
- GPT-5.4 handles interpretation, review, and enforcement (semantic review pass)

## Test fixtures

### Known good response

A response that:
- Satisfies all structural rules
- Has rich Evidence with tool citations
- Has 2-3 clear Frames interpretations
- Has actionable Countermoves
- Has one concrete Next action
- Aligns with session context

Expected: all criteria >= 0.8, overallScore >= 0.80

### Known weak response

A response that:
- Satisfies structural rules
- Has minimal Evidence (no citations)
- Has generic Frames (no context-specific interpretations)
- Has vague Countermoves
- Has non-actionable Next

Expected: contract-fidelity >= 0.9 (structure is correct), but shortcutting-risk and context-alignment < 0.6

### Context-misaligned response

A response that:
- Satisfies structural rules
- Ignores explicit constraints from session history
- Discusses topics not requested

Expected: context-alignment < 0.5 even with perfect structure

## Acceptance criteria

1. `buildGptReviewReport()` can call OpenAI-compatible endpoints and return structured ReviewReport
2. Session history is injected into the review prompt when provided
3. Stub fallback works on GPT call failure
4. CLI `review-gpt` command produces `review-report.json` with `reviewer: 'gpt'`
5. Known good fixture scores >= 0.80 overall
6. Known weak fixture scores context-alignment < 0.7
7. Review deltas are contract-scoped and actionable (not generic style commentary)

## Risks

### Risk: GPT reviewer returns non-JSON

Mitigation: Parse with `JSON.parse()`, catch SyntaxError, fall back to stub with limitation noting parse failure.

### Risk: Review prompt exceeds context window

Mitigation: Truncate session history to `maxSessionTurns`. Keep candidate markdown whole (already bounded by structure rules).

### Risk: Reviewer drift into style commentary

Mitigation: System prompt constrains to contract criteria only. Deltas must be "actionable improvement suggestion", not aesthetic notes.

## Definition of done

- [ ] `buildGptReviewReport()` implemented in `review.ts`
- [ ] `buildReviewPrompt()` generates valid system + user messages
- [ ] CLI `review-gpt` command available
- [ ] Extension config supports GPT review options
- [ ] Stub fallback tested with simulated GPT failure
- [ ] Known good/weak/context-misaligned fixtures pass acceptance criteria
export type ContractSection = {
  readonly id: string;
  readonly heading: string;
  readonly required: boolean;
  readonly order: number;
  readonly cardinality: 'one' | 'many';
  readonly allowedNodeTypes: readonly string[];
  readonly localRuleIds: readonly string[];
};

export type ContractRule = {
  readonly id: string;
  readonly kind: string;
  readonly check: string;
  readonly sectionId?: string;
  readonly min?: number;
  readonly max?: number;
  readonly exactly?: number;
};

export type RepairTemplate = {
  readonly id: string;
  readonly whenRuleId: string;
  readonly text: string;
};

export type ReviewCriterion = {
  readonly id: string;
  readonly weight: number;
};

export type ReviewCriterionScore = {
  readonly id: string;
  readonly weight: number;
  readonly score: number;
  readonly note: string;
};

export type ReviewPolicy = {
  readonly enabled: boolean;
  readonly reviewerFamily?: string;
  readonly threshold: number;
  readonly criteria: readonly ReviewCriterion[];
};

export type ArbitrationForm = readonly unknown[];

export type NormalizedContract = {
  readonly name: string;
  readonly version: string;
  readonly targetFormat: string;
  readonly targetAst: string;
  readonly targetRoot: string;
  readonly repairMaxRetries: number;
  readonly sections: readonly ContractSection[];
  readonly sectionsById: Readonly<Record<string, ContractSection>>;
  readonly sectionsByHeading: Readonly<Record<string, ContractSection>>;
  readonly rules: readonly ContractRule[];
  readonly rulesById: Readonly<Record<string, ContractRule>>;
  readonly repairTemplates: readonly RepairTemplate[];
  readonly repairTemplatesByRuleId: Readonly<Record<string, readonly RepairTemplate[]>>;
  readonly review: ReviewPolicy;
  readonly arbitration: readonly ArbitrationForm[];
};

export type MarkdownNode = {
  readonly type: string;
  readonly depth?: number;
  readonly value?: string;
  readonly ordered?: boolean;
  readonly children?: readonly MarkdownNode[];
};

export type MarkdownRoot = {
  readonly type: 'root';
  readonly children: readonly MarkdownNode[];
};

export type ExtractedSection = {
  readonly heading: string;
  readonly nodes: readonly MarkdownNode[];
};

export type ExtractedDocument = {
  readonly ast: MarkdownRoot;
  readonly prefaceNodes: readonly MarkdownNode[];
  readonly sections: readonly ExtractedSection[];
};

export type ValidationFailure = {
  readonly ruleId: string;
  readonly message: string;
  readonly sectionId?: string;
  readonly heading?: string;
  readonly expected?: Readonly<Record<string, unknown>>;
  readonly actual?: Readonly<Record<string, unknown>>;
};

export type ValidationResult = {
  readonly ok: boolean;
  readonly sections: readonly ExtractedSection[];
  readonly failures: readonly ValidationFailure[];
};

export type FailureReport = {
  readonly contract: string;
  readonly version: string;
  readonly stage: 'structure';
  readonly ok: boolean;
  readonly failures: readonly ValidationFailure[];
};

export type ArtifactBundle = {
  readonly root: string;
  readonly runId: string;
  readonly dir: string;
  readonly files: Readonly<Record<string, string>>;
};

export type ReviewReport = {
  readonly stage: 'review';
  readonly reviewer: 'stub' | 'gpt';
  readonly ok: boolean;
  readonly threshold: number;
  readonly overallScore: number;
  readonly criteria: readonly ReviewCriterionScore[];
  readonly deltas: readonly string[];
  readonly limitations: readonly string[];
  readonly generatedAt: string;
  readonly modelId?: string;
  readonly sessionTurns?: number;
};

export type GptReviewConfig = {
  readonly model?: string;
  readonly baseUrl?: string;
  readonly apiKey?: string;
  readonly sessionHistory?: readonly { readonly role: 'user' | 'assistant'; readonly content: string }[];
  readonly maxSessionTurns?: number;
  readonly temperature?: number;
  readonly fallbackToStub?: boolean;
};

export type GptReviewMessage = {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
};

export type GenerationMode = 'fixture-valid' | 'fixture-invalid' | 'openai-chat';

export type GenerationReport = {
  readonly stage: 'generate';
  readonly generator: GenerationMode;
  readonly ok: boolean;
  readonly attempt: number;
  readonly repairPromptApplied: boolean;
  readonly model?: string;
  readonly baseUrl?: string;
  readonly temperature?: number;
  readonly promptSummary: {
    readonly requiredHeadings: readonly string[];
    readonly taskWordCount: number;
  };
  readonly limitations: readonly string[];
  readonly generatedAt: string;
};

export type RepairAttemptRecord = {
  readonly attempt: number;
  readonly candidateMarkdown: string;
  readonly report: FailureReport;
  readonly repairPrompt: string;
};

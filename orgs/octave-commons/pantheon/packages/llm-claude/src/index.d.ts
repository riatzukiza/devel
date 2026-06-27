/**
 * Pantheon LLM Adapter for Anthropic Claude
 * Implements LlmPort for Claude API integration
 */
import type { LlmPort } from '@promethean-os/pantheon-core';
export type ClaudeAdapterConfig = {
    apiKey: string;
    baseURL?: string;
    defaultModel?: string;
    defaultTemperature?: number;
    defaultMaxTokens?: number;
    defaultTopP?: number;
};
export declare const makeClaudeAdapter: (config: ClaudeAdapterConfig) => LlmPort;
//# sourceMappingURL=index.d.ts.map
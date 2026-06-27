/**
 * Pantheon LLM Adapter for OpenAI
 * Implements LlmPort for OpenAI API integration
 */
import type { LlmPort } from '@promethean-os/pantheon-core';
export type RetryConfig = {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    retryableErrors: string[];
};
export type OpenAIAdapterConfig = {
    apiKey: string;
    baseURL?: string;
    organization?: string;
    defaultModel?: string;
    defaultTemperature?: number;
    defaultMaxTokens?: number;
    defaultTopP?: number;
    defaultFrequencyPenalty?: number;
    defaultPresencePenalty?: number;
    timeout?: number;
    retryConfig?: Partial<RetryConfig>;
};
export declare const makeOpenAIAdapter: (config: OpenAIAdapterConfig) => LlmPort;
//# sourceMappingURL=index.d.ts.map
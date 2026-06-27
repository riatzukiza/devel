/**
 * Simple OpenAI LLM Adapter for Pantheon FP
 * Implements LlmPort for OpenAI API integration
 */
import type { LlmPort } from '../core/ports.js';
export type OpenAIAdapterConfig = {
    apiKey: string;
    baseURL?: string;
    defaultModel?: string;
    defaultTemperature?: number;
};
export declare const makeOpenAIAdapter: (config: OpenAIAdapterConfig) => LlmPort;
//# sourceMappingURL=openai.d.ts.map
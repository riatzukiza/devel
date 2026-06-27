/**
 * Pantheon LLM Adapter for Anthropic Claude
 * Implements LlmPort for Claude API integration
 */
import Anthropic from '@anthropic-ai/sdk';
export const makeClaudeAdapter = (config) => {
    const client = new Anthropic({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
    });
    return {
        complete: async (messages, opts) => {
            const model = opts?.model || config.defaultModel || 'claude-3-haiku-20240307';
            const temperature = opts?.temperature ?? config.defaultTemperature ?? 0.7;
            const maxTokens = opts?.maxTokens ?? config.defaultMaxTokens ?? 1024;
            const topP = opts?.topP ?? config.defaultTopP;
            try {
                // Convert messages to Claude format
                const systemMessage = messages.find((msg) => msg.role === 'system');
                const conversationMessages = messages.filter((msg) => msg.role !== 'system');
                const responseParams = {
                    model,
                    temperature,
                    max_tokens: maxTokens,
                    system: systemMessage?.content,
                    messages: conversationMessages.map((msg) => ({
                        role: msg.role,
                        content: msg.content,
                    })),
                };
                // Add optional top_p parameter only if defined
                if (topP !== undefined)
                    responseParams.top_p = topP;
                const response = await client.messages.create(responseParams);
                const content = response.content[0];
                if (!content || content.type !== 'text') {
                    throw new Error('Unexpected response type from Claude');
                }
                return {
                    role: 'assistant',
                    content: content.text,
                };
            }
            catch (error) {
                throw new Error(`Claude API error: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
    };
};
//# sourceMappingURL=index.js.map
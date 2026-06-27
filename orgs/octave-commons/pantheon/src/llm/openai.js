/**
 * Simple OpenAI LLM Adapter for Pantheon FP
 * Implements LlmPort for OpenAI API integration
 */
export const makeOpenAIAdapter = (config) => {
    return {
        complete: async (messages, opts) => {
            const model = opts?.model || config.defaultModel || 'gpt-3.5-turbo';
            const temperature = opts?.temperature ?? config.defaultTemperature ?? 0.7;
            try {
                // Simple fetch implementation to avoid external dependencies
                const response = await fetch(config.baseURL || 'https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${config.apiKey}`,
                    },
                    body: JSON.stringify({
                        model,
                        temperature,
                        messages: messages.map((msg) => ({
                            role: msg.role,
                            content: msg.content,
                        })),
                    }),
                });
                if (!response.ok) {
                    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                const choice = data.choices[0];
                if (!choice?.message?.content) {
                    throw new Error('No response from OpenAI');
                }
                return {
                    role: 'assistant',
                    content: choice.message.content,
                };
            }
            catch (error) {
                throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
    };
};
//# sourceMappingURL=openai.js.map
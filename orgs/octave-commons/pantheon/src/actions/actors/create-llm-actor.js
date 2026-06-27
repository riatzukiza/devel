/**
 * Create LLM Actor Action
 * Creates an actor script with LLM-based reasoning capabilities
 */
const createLLMBehavior = (config) => {
    const { model = 'gpt-5-nano', temperature = 0.7, maxTokens = 1000, systemPrompt } = config;
    return {
        name: 'llm-response',
        mode: 'active',
        description: 'Generate responses using LLM based on context and goals',
        plan: async ({ goal, context }) => {
            const messages = prepareLLMMessages(goal, context, systemPrompt);
            const actions = createLLMAction(messages, { model, temperature, maxTokens });
            return { actions };
        },
    };
};
const prepareLLMMessages = (goal, context, systemPrompt) => {
    const baseMessages = systemPrompt
        ? [{ role: 'system', content: systemPrompt }]
        : [];
    const userMessage = !context.some((msg) => msg.content.includes(goal))
        ? [{ role: 'user', content: goal }]
        : [];
    return [...baseMessages, ...context, ...userMessage];
};
const createLLMAction = (messages, config) => [
    {
        type: 'tool',
        name: 'llm_complete',
        args: {
            messages,
            model: config.model,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
        },
    },
];
const createLLMTalent = (config) => {
    const behavior = createLLMBehavior(config);
    return {
        name: 'llm-reasoning',
        behaviors: [behavior],
        description: 'LLM-based reasoning and response generation',
    };
};
export const createLLMActor = (input, _scope) => {
    const { name, config, contextSources = [] } = input;
    const { model = 'gpt-5-nano', temperature = 0.7, maxTokens = 1000, systemPrompt } = config;
    const talent = createLLMTalent(config);
    return {
        name,
        contextSources,
        talents: [talent],
        description: `LLM Actor using model ${model}`,
        config: { model, temperature, maxTokens, systemPrompt },
    };
};
//# sourceMappingURL=create-llm-actor.js.map
import { Usage, } from '@openai/agents';
export const isMessageItem = (item) => typeof item.role === 'string';
export const flattenEntries = (entries) => entries
    .map((entry) => {
    if (!entry || typeof entry !== 'object') {
        return typeof entry === 'string' ? entry : '';
    }
    if ('text' in entry &&
        typeof entry.text === 'string') {
        return entry.text;
    }
    if ('refusal' in entry &&
        typeof entry.refusal === 'string') {
        return entry.refusal;
    }
    return JSON.stringify(entry);
})
    .filter((segment) => segment.length > 0)
    .join('\n');
export const toMessageContent = (item) => {
    const { content } = item;
    if (typeof content === 'string') {
        return content;
    }
    if (Array.isArray(content)) {
        return flattenEntries(content);
    }
    return '';
};
export const convertInputToMessages = (request) => {
    const messages = [];
    if (request.systemInstructions) {
        messages.push({ role: 'system', content: request.systemInstructions });
    }
    if (typeof request.input === 'string') {
        messages.push({ role: 'user', content: request.input });
        return messages;
    }
    for (const item of request.input) {
        if (!isMessageItem(item)) {
            throw new Error(`Ollama provider only supports message conversation items. Unsupported item: ${JSON.stringify(item)}`);
        }
        messages.push({ role: item.role, content: toMessageContent(item) });
    }
    return messages;
};
export const normalizeJsonSchema = (schema) => {
    if (!schema) {
        return undefined;
    }
    const plain = JSON.parse(JSON.stringify(schema));
    const required = plain.required;
    if (Array.isArray(required)) {
        plain.required = required.map((value) => value.toString());
    }
    return plain;
};
export const convertTools = (tools) => tools && tools.length > 0
    ? tools
        .filter((tool) => tool.type === 'function')
        .map((tool) => ({
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters: normalizeJsonSchema(tool.parameters),
        },
    }))
    : undefined;
export const convertSettings = (settings) => {
    if (!settings) {
        return undefined;
    }
    const { temperature, topP, frequencyPenalty, presencePenalty, maxTokens } = settings;
    const options = {};
    if (typeof temperature === 'number')
        options.temperature = temperature;
    if (typeof topP === 'number')
        options.top_p = topP;
    if (typeof frequencyPenalty === 'number')
        options.repeat_penalty = frequencyPenalty;
    if (typeof presencePenalty === 'number')
        options.presence_penalty = presencePenalty;
    if (typeof maxTokens === 'number')
        options.num_predict = maxTokens;
    return Object.keys(options).length > 0 ? options : undefined;
};
export const toUsage = (response) => {
    const inputTokens = response?.prompt_eval_count ?? 0;
    const outputTokens = response?.eval_count ?? 0;
    return new Usage({
        requests: 1,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
    });
};
export const toUsageComponents = (response) => {
    const usage = toUsage(response);
    const payload = {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
    };
    if (usage.requests) {
        payload.requests = usage.requests;
    }
    if (usage.inputTokensDetails[0]) {
        payload.inputTokensDetails = usage.inputTokensDetails[0];
    }
    if (usage.outputTokensDetails[0]) {
        payload.outputTokensDetails = usage.outputTokensDetails[0];
    }
    return { usage, payload };
};
//# sourceMappingURL=ollamaHelpers.js.map
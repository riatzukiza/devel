/* eslint-disable import/order */
import { randomUUID } from 'node:crypto';
import { assistant, } from '@openai/agents';
import { Ollama as OllamaClient } from 'ollama';
import { convertInputToMessages, convertTools, convertSettings, toUsageComponents, } from './ollamaHelpers.js';
// Core model implementation
class OllamaModel {
    client;
    modelName;
    defaults;
    constructor(client, modelName, defaults) {
        this.client = client;
        this.modelName = modelName;
        this.defaults = defaults;
    }
    // Build the chat request with defaults, tools, and settings
    buildRequest(request, stream) {
        const base = {
            model: this.modelName,
            messages: convertInputToMessages(request),
            stream,
        };
        if (this.defaults) {
            const mutableBase = base;
            for (const [key, value] of Object.entries(this.defaults)) {
                if (value === undefined || key === 'model' || key === 'messages' || key === 'stream')
                    continue;
                mutableBase[key] = value;
            }
        }
        const tools = convertTools(request.tools);
        if (tools)
            base.tools = tools;
        const options = convertSettings(request.modelSettings);
        if (options)
            base.options = { ...(base.options ?? {}), ...options };
        return base;
    }
    // Convert ChatResponse to ModelResponse
    toResponse(response) {
        const { usage } = toUsageComponents(response);
        const content = response.message?.content ?? '';
        return {
            usage,
            output: [assistant(content)],
            responseId: `ollama-${randomUUID()}`,
            providerData: { raw: response },
        };
    }
    // Synchronous response
    async getResponse(request) {
        const chatRequest = this.buildRequest(request, false);
        try {
            const response = await this.client.chat(chatRequest);
            return this.toResponse(response);
        }
        catch (err) {
            throw new Error(`OllamaModel getResponse failed: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    // Streaming response
    async *getStreamedResponse(request) {
        const chatRequest = this.buildRequest(request, true);
        try {
            const stream = await this.client.chat(chatRequest);
            yield { type: 'response_started' };
            let aggregated = '';
            let lastChunk;
            for await (const chunk of stream) {
                lastChunk = chunk;
                const delta = chunk.message?.content ?? '';
                if (delta) {
                    aggregated += delta;
                    yield { type: 'output_text_delta', delta };
                }
            }
            const finalChunk = lastChunk ??
                {
                    model: this.modelName,
                    created_at: new Date(),
                    message: { role: 'assistant', content: aggregated },
                    done: true,
                    done_reason: 'stop',
                    total_duration: 0,
                    load_duration: 0,
                    prompt_eval_count: 0,
                    prompt_eval_duration: 0,
                    eval_count: 0,
                    eval_duration: 0,
                };
            const { payload } = toUsageComponents(lastChunk ?? finalChunk);
            const responseId = `ollama-${randomUUID()}`;
            yield {
                type: 'response_done',
                response: {
                    id: responseId,
                    usage: payload,
                    output: [assistant(aggregated)],
                    providerData: { raw: finalChunk },
                },
            };
        }
        catch (err) {
            throw new Error(`OllamaModel getStreamedResponse failed: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
}
// Provider that returns instances of OllamaModel
export class OllamaModelProvider {
    client;
    defaultModel;
    requestDefaults;
    constructor(options = {}) {
        this.defaultModel = options.defaultModel ?? 'llama3.1';
        this.requestDefaults = options.requestOptions;
        this.client =
            options.client ?? new OllamaClient(options.host ? { host: options.host } : undefined);
    }
    async getModel(modelName) {
        const target = modelName ?? this.defaultModel;
        return new OllamaModel(this.client, target, this.requestDefaults);
    }
}
// Helper to create provider
export function createOllamaModelProvider(options = {}) {
    return new OllamaModelProvider(options);
}
//# sourceMappingURL=ollama.js.map
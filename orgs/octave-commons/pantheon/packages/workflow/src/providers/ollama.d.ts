import { type Model, type ModelProvider } from '@openai/agents';
import { type ChatRequest, type ChatResponse } from 'ollama';
export type OllamaClientLike = {
    chat(request: ChatRequest & {
        stream: true;
    }): Promise<AsyncIterable<ChatResponse>>;
    chat(request: ChatRequest & {
        stream?: false;
    }): Promise<ChatResponse>;
};
export type OllamaModelProviderOptions = {
    host?: string;
    defaultModel?: string;
    client?: OllamaClientLike;
    requestOptions?: Partial<Omit<ChatRequest, 'model' | 'messages' | 'stream'>>;
};
export declare class OllamaModelProvider implements ModelProvider {
    private client;
    private defaultModel;
    private requestDefaults?;
    constructor(options?: OllamaModelProviderOptions);
    getModel(modelName?: string): Promise<Model>;
}
export declare function createOllamaModelProvider(options?: OllamaModelProviderOptions): OllamaModelProvider;
//# sourceMappingURL=ollama.d.ts.map
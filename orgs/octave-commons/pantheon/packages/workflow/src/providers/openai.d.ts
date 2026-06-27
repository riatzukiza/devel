import { OpenAIProvider } from "@openai/agents";
type OpenAIProviderOptions = ConstructorParameters<typeof OpenAIProvider>[0];
export declare function createOpenAIModelProvider(options?: OpenAIProviderOptions): OpenAIProvider;
export declare function registerOpenAIDefaultModelProvider(options?: OpenAIProviderOptions): OpenAIProvider;
export {};
//# sourceMappingURL=openai.d.ts.map
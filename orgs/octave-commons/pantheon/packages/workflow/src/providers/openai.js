import { OpenAIProvider, setDefaultModelProvider } from "@openai/agents";
export function createOpenAIModelProvider(options) {
    return new OpenAIProvider(options);
}
export function registerOpenAIDefaultModelProvider(options) {
    const provider = new OpenAIProvider(options);
    setDefaultModelProvider(provider);
    return provider;
}
//# sourceMappingURL=openai.js.map
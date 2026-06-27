import { Usage, type AgentInputItem, type AssistantMessageItem, type ModelRequest, type SystemMessageItem, type UserMessageItem } from '@openai/agents';
import { Message, type ChatRequest, type ChatResponse, type Tool as OllamaTool } from 'ollama';
export declare const isMessageItem: (item: AgentInputItem) => item is AssistantMessageItem | SystemMessageItem | UserMessageItem;
export declare const flattenEntries: (entries: ReadonlyArray<unknown>) => string;
export declare const toMessageContent: (item: AssistantMessageItem | SystemMessageItem | UserMessageItem) => string;
export declare const convertInputToMessages: (request: ModelRequest) => Message[];
export declare const normalizeJsonSchema: (schema: unknown) => Record<string, unknown> | undefined;
export declare const convertTools: (tools: ModelRequest["tools"]) => OllamaTool[] | undefined;
export declare const convertSettings: (settings: ModelRequest["modelSettings"]) => ChatRequest["options"] | undefined;
export declare const toUsage: (response: ChatResponse | undefined) => Usage;
export declare const toUsageComponents: (response: ChatResponse | undefined) => {
    usage: Usage;
    payload: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        requests?: number;
        inputTokensDetails?: Record<string, number>;
        outputTokensDetails?: Record<string, number>;
    };
};
//# sourceMappingURL=ollamaHelpers.d.ts.map
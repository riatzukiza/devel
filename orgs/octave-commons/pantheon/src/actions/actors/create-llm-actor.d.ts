/**
 * Create LLM Actor Action
 * Creates an actor script with LLM-based reasoning capabilities
 */
import type { ActorScript, ContextSource } from '@promethean-os/pantheon-core';
export type LLMActorConfig = {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
};
export type CreateLLMActorInput = {
    name: string;
    config: LLMActorConfig;
    contextSources?: ContextSource[];
};
export type CreateLLMActorScope = {};
export declare const createLLMActor: (input: CreateLLMActorInput, _scope: CreateLLMActorScope) => ActorScript;
//# sourceMappingURL=create-llm-actor.d.ts.map
/**
 * Pantheon Actors Module
 * Exports all actor implementations and factory functions
 */
import type { ActorScript, ContextSource } from '@promethean-os/pantheon-core';
export type LLMActorConfig = {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
};
export declare const createLLMActor: (name: string, config: LLMActorConfig, contextSources?: ContextSource[]) => ActorScript;
export type ToolActorConfig = {
    tools: Array<{
        name: string;
        description: string;
        handler: (args: any) => Promise<any>;
    }>;
    maxToolCalls?: number;
};
export declare const createToolActor: (name: string, config: ToolActorConfig, contextSources?: ContextSource[]) => ActorScript;
export type CompositeActorConfig = {
    subActors: ActorScript[];
    coordinationMode?: 'sequential' | 'parallel' | 'conditional';
};
export declare const createCompositeActor: (name: string, config: CompositeActorConfig, contextSources?: ContextSource[]) => ActorScript;
export declare const createActorFromTemplate: (template: "llm" | "tool" | "composite", name: string, config: any, contextSources?: ContextSource[]) => ActorScript;
export declare const validateActorScript: (script: ActorScript) => boolean;
//# sourceMappingURL=index.d.ts.map
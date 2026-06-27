/**
 * Create Tool Actor Action
 * Creates an actor script with tool execution capabilities
 */
import type { ActorScript, ContextSource } from '@promethean-os/pantheon-core';
export type ToolConfig = {
    name: string;
    description: string;
    handler: (args: Record<string, unknown>) => Promise<unknown>;
};
export type ToolActorConfig = {
    tools: ToolConfig[];
    maxToolCalls?: number;
};
export type CreateToolActorInput = {
    name: string;
    config: ToolActorConfig;
    contextSources?: ContextSource[];
};
export type CreateToolActorScope = {};
export declare const createToolActor: (input: CreateToolActorInput, _scope: CreateToolActorScope) => ActorScript;
//# sourceMappingURL=create-tool-actor.d.ts.map
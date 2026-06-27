/**
 * Actor Factory
 * Factory functions for creating actors with dependencies injected
 */
import type { ActorConfig } from '../core/types.js';
import type { ActorScript } from '@promethean-os/pantheon-core';
export interface LLMActorDependencies {
    llmProvider: unknown;
    logger?: unknown;
}
export interface ToolActorDependencies {
    toolRegistry: unknown;
    logger?: unknown;
}
export interface CompositeActorDependencies {
    actorRegistry: unknown;
    logger?: unknown;
}
export declare const createLLMActorWithDependencies: (config: ActorConfig, dependencies: LLMActorDependencies) => ActorScript;
export declare const createToolActorWithDependencies: (config: ActorConfig, dependencies: ToolActorDependencies) => ActorScript;
export declare const createCompositeActorWithDependencies: (config: ActorConfig, dependencies: CompositeActorDependencies) => ActorScript;
//# sourceMappingURL=actor-factory.d.ts.map
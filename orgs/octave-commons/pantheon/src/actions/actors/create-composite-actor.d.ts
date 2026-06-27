/**
 * Create Composite Actor Action
 * Creates an actor script that coordinates multiple sub-actors
 */
import type { ActorScript, ContextSource } from '@promethean-os/pantheon-core';
export type CompositeActorConfig = {
    subActors: ActorScript[];
    coordinationMode?: 'sequential' | 'parallel' | 'conditional';
};
export type CreateCompositeActorInput = {
    name: string;
    config: CompositeActorConfig;
    contextSources?: ContextSource[];
};
export type CreateCompositeActorScope = {};
export declare const createCompositeActor: (input: CreateCompositeActorInput, _scope: CreateCompositeActorScope) => ActorScript;
//# sourceMappingURL=create-composite-actor.d.ts.map
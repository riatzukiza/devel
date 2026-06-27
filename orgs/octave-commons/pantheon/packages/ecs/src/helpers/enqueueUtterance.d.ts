import type { Entity, World } from '@promethean-os/ds/ecs.js';
import type { AgentComponents, AudioResourceFactory, BargeIn } from '../types.js';
export type EnqueueUtteranceOptions = {
    readonly id?: string;
    readonly priority?: number;
    readonly group?: string;
    readonly bargeIn?: BargeIn;
    readonly factory: AudioResourceFactory;
};
export declare const enqueueUtterance: (world: World, agent: Entity, components: AgentComponents, rawOptions: EnqueueUtteranceOptions) => void;
//# sourceMappingURL=enqueueUtterance.d.ts.map
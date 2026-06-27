import type { Entity } from '@promethean-os/ds/ecs.js';
import { World } from '@promethean-os/ds/ecs.js';
import type { AgentComponents, AudioPlayer } from './types.js';
type AgentSystem = (dtMs: number) => void | Promise<void>;
type AgentWorldHandle = {
    readonly w: World;
    readonly agent: Entity;
    readonly C: AgentComponents;
    readonly tick: (dtMs?: number) => Promise<void>;
    readonly addSystem: (system: AgentSystem) => void;
    readonly start: (delay: number) => Promise<void>;
    readonly stop: () => Promise<void>;
};
export declare const createAgentWorld: (audioPlayer: AudioPlayer) => AgentWorldHandle;
export {};
//# sourceMappingURL=world.d.ts.map
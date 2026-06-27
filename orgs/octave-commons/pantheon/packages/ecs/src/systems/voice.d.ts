import type { Entity, World } from '@promethean-os/ds/ecs.js';
import type { AgentComponents, VoiceConnection } from '../types.js';
type JoinVoiceRequest = {
    readonly guildId: string;
    readonly voiceChannelId: string;
} & Record<string, unknown>;
type VoiceDeps = {
    readonly joinVoiceChannel: (options: JoinVoiceRequest) => VoiceConnection | undefined;
    readonly createAudioResource: (stream: unknown) => unknown;
    readonly tts: (text: string) => Promise<{
        stream: unknown;
        cleanup?: () => void;
    }>;
};
type BusMessage = {
    readonly topic: string;
} & Record<string, unknown>;
type Bus = {
    readonly subscribe: <T>(topic: string, handler: (message: T) => void | Promise<void>) => void;
    readonly publish: (message: BusMessage) => void;
};
type VoiceSystemContext = {
    readonly world: World;
    readonly agent: Entity;
    readonly components: AgentComponents;
    readonly bus: Bus;
    readonly deps: VoiceDeps;
};
export declare const VoiceSystem: ({ world, agent, components, bus, deps }: VoiceSystemContext) => void;
export {};
//# sourceMappingURL=voice.d.ts.map
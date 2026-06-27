import type { AgentWorld } from '../types.js';
type AdapterDeps = {
    readonly tts: {
        synth: (text: string) => Promise<unknown>;
    };
};
type AdapterHooks = {
    readonly onRawLevel: (level: number) => void;
    readonly onFinalTranscript: (text: string) => void;
    readonly speak: (text: string) => void;
};
export declare function wireAdapters(world: AgentWorld, deps: AdapterDeps): AdapterHooks;
export {};
//# sourceMappingURL=example-hooks.d.ts.map
import { enqueueUtterance } from '../helpers/enqueueUtterance.js';
export function wireAdapters(world, deps) {
    const { w, agent, C } = world;
    return {
        onRawLevel(level) {
            const rv0 = w.get(agent, C.RawVAD) ?? { level: 0, ts: 0 };
            w.set(agent, C.RawVAD, { ...rv0, level, ts: Date.now() });
        },
        onFinalTranscript(text) {
            const tf0 = w.get(agent, C.TranscriptFinal) ?? { text: '', ts: 0 };
            w.set(agent, C.TranscriptFinal, { ...tf0, text, ts: Date.now() });
        },
        speak(text) {
            enqueueUtterance(w, agent, C, {
                group: 'agent-speech',
                priority: 1,
                bargeIn: 'pause',
                factory: async () => deps.tts.synth(text),
            });
        },
    };
}
//# sourceMappingURL=example-hooks.js.map
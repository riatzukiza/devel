const createStubPlayer = () => ({
    play: () => { },
    stop: () => { },
    pause: () => { },
    unpause: () => { },
    isPlaying: () => false,
});
const defineBargeState = (world) => world.defineComponent({
    name: 'BargeState',
    defaults: () => ({ speakingSince: null, paused: false }),
});
const defineTurn = (world) => world.defineComponent({
    name: 'Turn',
    defaults: () => ({ id: 0 }),
});
const defineRawVad = (world) => world.defineComponent({
    name: 'RawVAD',
    defaults: () => ({ level: 0, ts: 0 }),
});
const defineVad = (world) => world.defineComponent({
    name: 'VAD',
    defaults: () => ({
        active: false,
        lastTrueAt: 0,
        lastFalseAt: 0,
        attackMs: 120,
        releaseMs: 250,
        hangMs: 800,
        threshold: 0.5,
        _prevActive: false,
    }),
});
const definePlaybackQueue = (world) => world.defineComponent({
    name: 'PlaybackQ',
    defaults: () => ({ items: [] }),
});
const defineAudioRef = (world) => world.defineComponent({
    name: 'AudioRef',
    defaults: () => ({ player: createStubPlayer() }),
});
const defineUtterance = (world) => world.defineComponent({
    name: 'Utterance',
    defaults: () => ({
        id: '',
        turnId: 0,
        priority: 1,
        bargeIn: 'pause',
        status: 'queued',
        token: 0,
    }),
});
const defineAudioRes = (world) => world.defineComponent({
    name: 'AudioRes',
    defaults: () => ({ factory: async () => undefined }),
});
const defineTranscriptFinal = (world) => world.defineComponent({
    name: 'TranscriptFinal',
    defaults: () => ({ text: '', ts: 0 }),
});
const defineVisionFrame = (world) => world.defineComponent({
    name: 'VisionFrame',
    defaults: () => ({ id: '', ts: 0, ref: { type: 'url', url: '' } }),
});
const defineVisionRing = (world) => world.defineComponent({
    name: 'VisionRing',
    defaults: () => ({ frames: [], capacity: 12 }),
});
const definePolicy = (world) => world.defineComponent({
    name: 'Policy',
    defaults: () => ({ defaultBargeIn: 'pause' }),
});
const defineVoiceState = (world) => world.defineComponent({
    name: 'VoiceState',
    defaults: () => ({ connection: null }),
});
export const defineAgentComponents = (world) => ({
    Turn: defineTurn(world),
    RawVAD: defineRawVad(world),
    VAD: defineVad(world),
    PlaybackQ: definePlaybackQueue(world),
    AudioRef: defineAudioRef(world),
    Utterance: defineUtterance(world),
    AudioRes: defineAudioRes(world),
    TranscriptFinal: defineTranscriptFinal(world),
    VisionFrame: defineVisionFrame(world),
    BargeState: defineBargeState(world),
    VisionRing: defineVisionRing(world),
    Policy: definePolicy(world),
    VoiceState: defineVoiceState(world),
});
//# sourceMappingURL=components.js.map
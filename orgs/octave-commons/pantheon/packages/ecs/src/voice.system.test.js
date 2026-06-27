import test from 'ava';
import { createAgentWorld } from './world.js';
import { VoiceSystem } from './systems/voice.js';
const makePlayer = () => ({
    play: () => { },
    stop: () => { },
    pause: () => { },
    unpause: () => { },
    isPlaying: () => false,
});
const makeBus = () => {
    const handlers = new Map();
    return {
        publish(msg) {
            const hs = handlers.get(msg.topic) ?? [];
            hs.forEach((handler) => handler(msg));
        },
        subscribe(topic, handler) {
            const hs = handlers.get(topic) ?? [];
            handlers.set(topic, [...hs, handler]);
        },
    };
};
test('voice system joins and leaves', (t) => {
    const player = makePlayer();
    const { w, agent, C } = createAgentWorld(player);
    const bus = makeBus();
    VoiceSystem({
        world: w,
        agent,
        components: C,
        bus,
        deps: {
            joinVoiceChannel: () => ({
                subscribe: () => { },
                destroy: () => { },
            }),
            createAudioResource: (s) => s,
            tts: async (text) => ({ stream: text, cleanup: () => { } }),
        },
    });
    bus.publish({ topic: 'VOICE/JOIN_REQUESTED', guildId: 'g', voiceChannelId: 'c' });
    const vs = w.get(agent, C.VoiceState);
    t.truthy(vs?.connection);
    bus.publish({ topic: 'VOICE/LEAVE_REQUESTED', guildId: 'g' });
    const vs2 = w.get(agent, C.VoiceState);
    t.is(vs2?.connection, null);
});
test('voice system queues tts requests', (t) => {
    const player = makePlayer();
    const { w, agent, C } = createAgentWorld(player);
    const bus = makeBus();
    VoiceSystem({
        world: w,
        agent,
        components: C,
        bus,
        deps: {
            joinVoiceChannel: () => ({}),
            createAudioResource: (s) => s,
            tts: async (text) => ({ stream: text, cleanup: () => { } }),
        },
    });
    // set connection so tts can proceed
    w.set(agent, C.VoiceState, { connection: {} });
    bus.publish({ topic: 'VOICE/TTS_REQUESTED', message: 'hello', guildId: 'g' });
    const pq = w.get(agent, C.PlaybackQ);
    t.is(pq.items.length, 1);
});
//# sourceMappingURL=voice.system.test.js.map
import { enqueueUtterance } from '../helpers/enqueueUtterance.js';
const isJoinRequest = (value) => typeof value === 'object' &&
    value != null &&
    typeof value.guildId === 'string' &&
    typeof value.voiceChannelId === 'string';
const isLeaveRequest = (value) => typeof value === 'object' && value != null && typeof value.guildId === 'string';
const isTtsRequest = (value) => typeof value === 'object' && value != null && typeof value.message === 'string';
const createAudioFactory = (deps, message) => async () => {
    const { stream } = await deps.tts(message);
    return deps.createAudioResource(stream);
};
export const VoiceSystem = ({ world, agent, components, bus, deps }) => {
    const { VoiceState, AudioRef } = components;
    bus.subscribe('VOICE/JOIN_REQUESTED', async (event) => {
        if (!isJoinRequest(event))
            return;
        const state = world.get(agent, VoiceState);
        if (state?.connection)
            return;
        const connection = deps.joinVoiceChannel(event) ?? null;
        const player = world.get(agent, AudioRef)?.player;
        if (connection?.subscribe && player) {
            try {
                connection.subscribe(player);
            }
            catch (error) {
                console.warn('[voice] failed to subscribe connection', error);
            }
        }
        world.set(agent, VoiceState, { connection });
        bus.publish({ topic: 'VOICE/JOINED', guildId: event.guildId, voiceChannelId: event.voiceChannelId });
    });
    bus.subscribe('VOICE/LEAVE_REQUESTED', async (event) => {
        if (!isLeaveRequest(event))
            return;
        const state = world.get(agent, VoiceState);
        try {
            state?.connection?.destroy?.();
        }
        catch (error) {
            console.warn('[voice] failed to destroy connection', error);
        }
        world.set(agent, VoiceState, { connection: null });
        bus.publish({ topic: 'VOICE/LEFT', guildId: event.guildId });
    });
    bus.subscribe('VOICE/TTS_REQUESTED', async (event) => {
        if (!isTtsRequest(event))
            return;
        const state = world.get(agent, VoiceState);
        if (!state?.connection)
            return;
        enqueueUtterance(world, agent, components, {
            id: `${Date.now()}`,
            group: 'agent-speech',
            factory: createAudioFactory(deps, event.message),
        });
    });
};
//# sourceMappingURL=voice.js.map
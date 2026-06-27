const defaultQueue = () => ({ items: [] });
const defaultBargeState = () => ({ speakingSince: null, paused: false });
const filterActiveUtterances = (world, components, items) => items.filter((entity) => {
    const utterance = world.get(entity, components.Utterance);
    return !!utterance && (utterance.status === 'queued' || utterance.status === 'playing');
});
const includePendingUtterances = ({ world, components, query, items, minTurnId, }) => {
    const known = new Set(items);
    const appended = [...items];
    for (const [entity] of world.iter(query)) {
        if (known.has(entity))
            continue;
        const utterance = world.get(entity, components.Utterance);
        if (!utterance)
            continue;
        if (utterance.status === 'queued' && utterance.turnId >= minTurnId)
            appended.push(entity);
    }
    return appended;
};
const comparePriority = (world, components) => (a, b) => {
    const ua = world.get(a, components.Utterance);
    const ub = world.get(b, components.Utterance);
    return (ub?.priority ?? 0) - (ua?.priority ?? 0);
};
const pickQueuedUtterance = (world, components, ordered) => ordered.find((entity) => world.get(entity, components.Utterance)?.status === 'queued');
const dequeueEntity = (items, entity) => items.filter((value) => value !== entity);
const markPlaying = (world, components, entity) => {
    const utterance = world.get(entity, components.Utterance);
    if (!utterance)
        return undefined;
    const updated = { ...utterance, status: 'playing' };
    world.set(entity, components.Utterance, updated);
    return updated;
};
const resetBargeState = (world, components, agent) => {
    const barge = world.get(agent, components.BargeState) ?? defaultBargeState();
    world.set(agent, components.BargeState, { ...barge, paused: false, speakingSince: null });
};
const playUtterance = ({ world, components, player, entity, token }) => {
    const audioRes = world.get(entity, components.AudioRes);
    if (!audioRes)
        return;
    void audioRes
        .factory()
        .then((resource) => {
        if (resource === undefined)
            return;
        const latest = world.get(entity, components.Utterance);
        if (!latest || latest.token !== token || latest.status === 'cancelled')
            return;
        try {
            void player.play(resource);
        }
        catch (error) {
            console.warn('[arbiter] failed to play resource', error);
        }
    })
        .catch((error) => {
        console.warn('[arbiter] failed to resolve audio resource', error);
    });
};
export const SpeechArbiterSystem = (world, components) => {
    const agentQuery = world.makeQuery({
        all: [components.Turn, components.PlaybackQ, components.AudioRef, components.Policy],
    });
    const utteranceQuery = world.makeQuery({ all: [components.Utterance] });
    return async (_dt) => {
        for (const [agent] of world.iter(agentQuery)) {
            const turnId = world.get(agent, components.Turn)?.id ?? 0;
            const queue = world.get(agent, components.PlaybackQ) ?? defaultQueue();
            const filtered = filterActiveUtterances(world, components, queue.items);
            const augmented = includePendingUtterances({
                world,
                components,
                query: utteranceQuery,
                items: filtered,
                minTurnId: turnId,
            });
            const player = world.get(agent, components.AudioRef)?.player;
            if (!player)
                continue;
            const queueChanged = augmented.length !== queue.items.length ||
                augmented.some((value, index) => value !== queue.items[index]);
            const ordered = [...augmented].sort(comparePriority(world, components));
            const nextEntity = pickQueuedUtterance(world, components, ordered);
            if (!nextEntity) {
                if (queueChanged)
                    world.set(agent, components.PlaybackQ, { items: augmented });
                continue;
            }
            const reduced = dequeueEntity(augmented, nextEntity);
            const nowPlaying = markPlaying(world, components, nextEntity);
            if (nowPlaying) {
                resetBargeState(world, components, agent);
                playUtterance({ world, components, player, entity: nextEntity, token: nowPlaying.token });
            }
            world.set(agent, components.PlaybackQ, { items: reduced });
        }
    };
};
//# sourceMappingURL=speechArbiter.js.map
const EMPTY_QUEUE = { items: [] };
const createUtterance = (turnId, options) => ({
    id: options.id ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}.${Math.random()}`,
    turnId,
    priority: options.priority,
    group: options.group,
    bargeIn: options.bargeIn,
    status: 'queued',
    token: Math.floor(Math.random() * 1_000_000_000),
});
export const enqueueUtterance = (world, agent, components, rawOptions) => {
    const { Turn, PlaybackQ, Utterance, AudioRes, Policy } = components;
    const policy = world.get(agent, Policy);
    const defaultBargeIn = policy?.defaultBargeIn ?? 'pause';
    const options = {
        id: rawOptions.id,
        priority: rawOptions.priority ?? 1,
        group: rawOptions.group,
        bargeIn: rawOptions.bargeIn ?? defaultBargeIn,
        factory: rawOptions.factory,
    };
    if (typeof options.factory !== 'function') {
        console.warn('[enqueueUtterance] missing factory; dropping', { rawOptions });
        return;
    }
    const currentTurn = world.get(agent, Turn)?.id ?? 0;
    const queue = world.get(agent, PlaybackQ) ?? EMPTY_QUEUE;
    if (options.group) {
        queue.items.forEach((utteranceEntity) => {
            const utterance = world.get(utteranceEntity, Utterance);
            if (utterance &&
                utterance.group === options.group &&
                utterance.status === 'queued' &&
                utterance.priority <= options.priority) {
                const cancelled = { ...utterance, status: 'cancelled' };
                world.set(utteranceEntity, Utterance, cancelled);
            }
        });
    }
    const utteranceEntity = world.createEntity();
    const utterance = createUtterance(currentTurn, options);
    world.addComponent(utteranceEntity, Utterance, utterance);
    world.addComponent(utteranceEntity, AudioRes, { factory: options.factory });
    const latestQueue = world.get(agent, PlaybackQ) ?? EMPTY_QUEUE;
    const nextItems = [...latestQueue.items, utteranceEntity];
    world.set(agent, PlaybackQ, { items: nextItems });
};
//# sourceMappingURL=enqueueUtterance.js.map
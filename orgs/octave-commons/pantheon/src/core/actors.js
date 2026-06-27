export function makeActorAdapter() {
    // In-memory storage for now - will integrate with agent-state later
    const actors = new Map();
    return {
        async tick(actorId) {
            const actor = actors.get(actorId);
            if (!actor) {
                throw new Error(`Actor ${actorId} not found`);
            }
            // Simple tick implementation - update last tick time
            actor.lastTick = Date.now();
            actors.set(actorId, actor);
            console.log(`Actor ${actorId} ticked at ${actor.lastTick}`);
        },
        async create(config) {
            const id = `actor_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            const actor = {
                id,
                config,
                state: null,
                lastTick: Date.now(),
            };
            actors.set(id, actor);
            console.log(`Created actor ${id} with config:`, config);
            return id;
        },
        async get(id) {
            return actors.get(id) || null;
        },
    };
}
//# sourceMappingURL=actors.js.map
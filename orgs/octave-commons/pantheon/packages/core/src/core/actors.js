/**
 * Actor Model — Core actor behaviors and talent management
 */
export const makeActorFactory = () => {
    const createActor = (script, goals) => ({
        id: `actor-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        script,
        goals,
        state: 'idle',
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    const createBehavior = (name, mode, plan) => ({
        name,
        mode,
        plan,
    });
    const createTalent = (name, behaviors) => ({
        name,
        behaviors,
    });
    return {
        createActor,
        createBehavior,
        createTalent,
    };
};
//# sourceMappingURL=actors.js.map
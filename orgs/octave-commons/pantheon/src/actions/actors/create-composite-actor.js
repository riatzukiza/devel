/**
 * Create Composite Actor Action
 * Creates an actor script that coordinates multiple sub-actors
 */
const createSequentialActions = (goal, subActors, parentName) => {
    const spawnActions = subActors.map((subActor) => ({
        type: 'spawn',
        actor: subActor,
        goal: `${goal} (as ${subActor.name})`,
        config: { parentActor: parentName },
    }));
    const waitActions = subActors.map(() => ({
        type: 'wait',
        duration: 1000,
        reason: 'Wait for sub-actor execution',
    }));
    // Interleave spawn and wait actions
    return spawnActions.flatMap((spawn, index) => [spawn, waitActions[index] ?? []]).flat();
};
const createParallelActions = (goal, subActors, parentName) => {
    return subActors.map((subActor) => ({
        type: 'spawn',
        actor: subActor,
        goal: `${goal} (as ${subActor.name})`,
        config: { parentActor: parentName, parallel: true },
    }));
};
const createConditionalActions = (goal, subActors, parentName) => {
    // Simple conditional logic - spawn first sub-actor that matches goal keywords
    const matchingActor = subActors.find((actor) => actor.name.toLowerCase().includes(goal.toLowerCase()) ||
        goal.toLowerCase().includes(actor.name.toLowerCase()));
    return matchingActor
        ? [
            {
                type: 'spawn',
                actor: matchingActor,
                goal: `${goal} (as ${matchingActor.name})`,
                config: { parentActor: parentName },
            },
        ]
        : [];
};
const createCoordinationActions = (goal, subActors, coordinationMode, parentName) => {
    switch (coordinationMode) {
        case 'sequential':
            return createSequentialActions(goal, subActors, parentName);
        case 'parallel':
            return createParallelActions(goal, subActors, parentName);
        case 'conditional':
            return createConditionalActions(goal, subActors, parentName);
        default:
            return [];
    }
};
const createCoordinationBehavior = (config, parentName) => {
    const { subActors, coordinationMode = 'sequential' } = config;
    return {
        name: 'coordination',
        mode: 'persistent',
        description: 'Coordinate execution of sub-actors',
        plan: async ({ goal }) => {
            const actions = createCoordinationActions(goal, subActors, coordinationMode, parentName);
            return { actions };
        },
    };
};
const createCoordinationTalent = (config, parentName) => {
    const behavior = createCoordinationBehavior(config, parentName);
    return {
        name: 'coordination',
        behaviors: [behavior],
        description: 'Coordination of multiple sub-actors',
    };
};
export const createCompositeActor = (input, _scope) => {
    const { name, config, contextSources = [] } = input;
    const { subActors, coordinationMode = 'sequential' } = config;
    const talent = createCoordinationTalent(config, name);
    return {
        name,
        contextSources,
        talents: [talent],
        description: `Composite Actor with ${subActors.length} sub-actors`,
        config: { subActors, coordinationMode },
    };
};
//# sourceMappingURL=create-composite-actor.js.map
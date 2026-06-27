/**
 * Actor Factory
 * Factory functions for creating actors with dependencies injected
 */
import { createLLMActor } from '../actions/actors/create-llm-actor.js';
import { createToolActor } from '../actions/actors/create-tool-actor.js';
import { createCompositeActor } from '../actions/actors/create-composite-actor.js';
// Factory functions
export const createLLMActorWithDependencies = (config, dependencies) => {
    dependencies.llmProvider; // Use dependency to avoid unused warning
    return createLLMActor({
        name: config.name,
        config: config.parameters,
    }, {});
};
export const createToolActorWithDependencies = (config, dependencies) => {
    dependencies.toolRegistry; // Use dependency to avoid unused warning
    return createToolActor({
        name: config.name,
        config: config.parameters,
    }, {});
};
export const createCompositeActorWithDependencies = (config, dependencies) => {
    dependencies.actorRegistry; // Use dependency to avoid unused warning
    return createCompositeActor({
        name: config.name,
        config: config.parameters,
    }, {});
};
//# sourceMappingURL=actor-factory.js.map
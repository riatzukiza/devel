/**
 * Pantheon Actors Module
 * Exports all actor implementations and factory functions
 */
export const createLLMActor = (name, config, contextSources = []) => {
    const { model = 'gpt-5-nano', temperature = 0.7, maxTokens = 1000, systemPrompt } = config;
    const llmBehavior = {
        name: 'llm-response',
        mode: 'active',
        description: 'Generate responses using LLM based on context and goals',
        plan: async ({ goal, context }) => {
            // Prepare messages for LLM
            const messages = [];
            if (systemPrompt) {
                messages.push({ role: 'system', content: systemPrompt });
            }
            // Add context messages
            messages.push(...context);
            // Add goal as user message if not already in context
            if (!context.some((msg) => msg.content.includes(goal))) {
                messages.push({ role: 'user', content: goal });
            }
            // Create action to invoke LLM
            const actions = [
                {
                    type: 'tool',
                    name: 'llm_complete',
                    args: {
                        messages,
                        model,
                        temperature,
                        maxTokens,
                    },
                },
            ];
            return { actions };
        },
    };
    const llmTalent = {
        name: 'llm-reasoning',
        behaviors: [llmBehavior],
        description: 'LLM-based reasoning and response generation',
    };
    return {
        name,
        contextSources,
        talents: [llmTalent],
        description: `LLM Actor using model ${model}`,
        config: { model, temperature, maxTokens, systemPrompt },
    };
};
export const createToolActor = (name, config, contextSources = []) => {
    const { tools, maxToolCalls = 5 } = config;
    const toolBehavior = {
        name: 'tool-execution',
        mode: 'active',
        description: 'Execute tools based on context and goals',
        plan: async ({ goal, context }) => {
            const actions = [];
            let toolCalls = 0;
            // Simple tool selection logic - in a real implementation,
            // this would use LLM to determine which tools to use
            for (const tool of tools) {
                if (toolCalls >= maxToolCalls)
                    break;
                // Check if tool is relevant to goal (simple keyword matching)
                if (goal.toLowerCase().includes(tool.name.toLowerCase()) ||
                    context.some((msg) => msg.content.toLowerCase().includes(tool.name.toLowerCase()))) {
                    actions.push({
                        type: 'tool',
                        name: tool.name,
                        args: { goal, context: context.map((msg) => msg.content) },
                    });
                    toolCalls++;
                }
            }
            return { actions };
        },
    };
    const toolTalent = {
        name: 'tool-execution',
        behaviors: [toolBehavior],
        description: 'Tool execution capabilities',
    };
    return {
        name,
        contextSources,
        talents: [toolTalent],
        description: `Tool Actor with ${tools.length} tools available`,
        config: { toolCount: tools.length, maxToolCalls },
    };
};
export const createCompositeActor = (name, config, contextSources = []) => {
    const { subActors, coordinationMode = 'sequential' } = config;
    const coordinationBehavior = {
        name: 'coordination',
        mode: 'persistent',
        description: 'Coordinate execution of sub-actors',
        plan: async ({ goal }) => {
            const actions = [];
            switch (coordinationMode) {
                case 'sequential':
                    // Execute sub-actors one after another
                    for (const subActor of subActors) {
                        actions.push({
                            type: 'spawn',
                            actor: subActor,
                            goal: `${goal} (as ${subActor.name})`,
                            config: { parentActor: name },
                        });
                        // Wait between spawns to allow for completion
                        actions.push({
                            type: 'wait',
                            duration: 1000,
                            reason: 'Wait for sub-actor execution',
                        });
                    }
                    break;
                case 'parallel':
                    // Spawn all sub-actors simultaneously
                    for (const subActor of subActors) {
                        actions.push({
                            type: 'spawn',
                            actor: subActor,
                            goal: `${goal} (as ${subActor.name})`,
                            config: { parentActor: name, parallel: true },
                        });
                    }
                    break;
                case 'conditional':
                    // Simple conditional logic based on goal content
                    const relevantActor = subActors.find((actor) => goal.toLowerCase().includes(actor.name.toLowerCase()));
                    if (relevantActor) {
                        actions.push({
                            type: 'spawn',
                            actor: relevantActor,
                            goal: `${goal} (as ${relevantActor.name})`,
                            config: { parentActor: name },
                        });
                    }
                    else if (subActors.length > 0) {
                        // Default to first actor if no match
                        const firstActor = subActors[0];
                        if (firstActor) {
                            actions.push({
                                type: 'spawn',
                                actor: firstActor,
                                goal: `${goal} (as ${firstActor.name})`,
                                config: { parentActor: name },
                            });
                        }
                    }
                    break;
            }
            return { actions };
        },
    };
    const coordinationTalent = {
        name: 'coordination',
        behaviors: [coordinationBehavior],
        description: `Actor coordination in ${coordinationMode} mode`,
    };
    return {
        name,
        contextSources,
        talents: [coordinationTalent],
        description: `Composite Actor coordinating ${subActors.length} sub-actors`,
        config: { subActorCount: subActors.length, coordinationMode },
    };
};
// === Utility Functions ===
export const createActorFromTemplate = (template, name, config, contextSources = []) => {
    switch (template) {
        case 'llm':
            return createLLMActor(name, config, contextSources);
        case 'tool':
            return createToolActor(name, config, contextSources);
        case 'composite':
            return createCompositeActor(name, config, contextSources);
        default:
            throw new Error(`Unknown actor template: ${template}`);
    }
};
export const validateActorScript = (script) => {
    return !!(script.name &&
        script.talents &&
        script.talents.length > 0 &&
        script.talents.every((talent) => talent.name && talent.behaviors && talent.behaviors.length > 0));
};
//# sourceMappingURL=index.js.map
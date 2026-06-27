/**
 * Create Tool Actor Action
 * Creates an actor script with tool execution capabilities
 */
const isToolRelevantToGoal = (goal, context, tool) => {
    const goalLower = goal.toLowerCase();
    const toolNameLower = tool.name.toLowerCase();
    const goalMatches = goalLower.includes(toolNameLower);
    const contextMatches = context.some((msg) => msg.content.toLowerCase().includes(toolNameLower));
    return goalMatches || contextMatches;
};
const createToolActions = (goal, context, tools, maxToolCalls) => {
    return tools
        .filter((tool) => isToolRelevantToGoal(goal, context, tool))
        .slice(0, maxToolCalls)
        .map((tool) => ({
        type: 'tool',
        name: tool.name,
        args: {
            goal,
            context: context.map((msg) => msg.content),
        },
    }));
};
const createToolBehavior = (config) => {
    const { tools, maxToolCalls = 5 } = config;
    return {
        name: 'tool-execution',
        mode: 'active',
        description: 'Execute tools based on context and goals',
        plan: async ({ goal, context }) => {
            const actions = createToolActions(goal, context, tools, maxToolCalls);
            return { actions };
        },
    };
};
const createToolTalent = (config) => {
    const behavior = createToolBehavior(config);
    return {
        name: 'tool-execution',
        behaviors: [behavior],
        description: 'Tool execution capabilities',
    };
};
export const createToolActor = (input, _scope) => {
    const { name, config, contextSources = [] } = input;
    const { tools, maxToolCalls = 5 } = config;
    const talent = createToolTalent(config);
    return {
        name,
        contextSources,
        talents: [talent],
        description: `Tool Actor with ${tools.length} tools`,
        config: { tools, maxToolCalls },
    };
};
//# sourceMappingURL=create-tool-actor.js.map
/**
 * MCP (Model Context Protocol) Tool Adapter for Pantheon
 *
 * This adapter provides MCP tool interfaces that can be used by LLMs
 * to interact with the Pantheon Agent Management Framework.
 */
export function makeMCPToolAdapter() {
    const tools = new Map();
    return {
        async execute(toolName, args) {
            const tool = tools.get(toolName);
            if (!tool) {
                throw new Error(`Tool ${toolName} not found`);
            }
            try {
                const result = await tool.handler(args);
                return {
                    success: true,
                    result,
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                };
            }
        },
        async list() {
            return Array.from(tools.keys());
        },
        register(tool) {
            // Convert ToolSpec to MCPTool format
            const defaultHandler = async (args) => ({
                result: 'Tool executed',
                args,
            });
            const handler = typeof tool.handler === 'function' ? tool.handler : defaultHandler;
            const mcpTool = {
                name: tool.name,
                description: tool.description,
                inputSchema: {
                    type: 'object',
                    properties: tool.parameters || {},
                    required: tool.required || [],
                },
                handler,
            };
            tools.set(tool.name, mcpTool);
        },
        async getSchema(toolName) {
            const tool = tools.get(toolName);
            if (!tool) {
                throw new Error(`Tool ${toolName} not found`);
            }
            return tool.inputSchema;
        },
        async invoke(name, args) {
            const tool = tools.get(name);
            if (!tool) {
                throw new Error(`Tool '${name}' not found`);
            }
            try {
                return await tool.handler(args);
            }
            catch (error) {
                throw new Error(`Tool '${name}' execution failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
    };
}
// Predefined MCP tools for Pantheon operations
export const createActorTool = {
    name: 'create_actor',
    description: 'Create a new actor in the Pantheon system',
    inputSchema: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                description: 'Name of the actor',
            },
            type: {
                type: 'string',
                description: 'Type of actor (e.g., "llm", "tool", "workflow")',
            },
            config: {
                type: 'object',
                description: 'Configuration object for the actor',
            },
        },
        required: ['name', 'type'],
    },
    handler: async (args) => {
        // This would integrate with the ActorPort to create an actor
        const { name, type, config } = args;
        return {
            actorId: `actor_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            name,
            type,
            config,
            status: 'created',
        };
    },
};
export const tickActorTool = {
    name: 'tick_actor',
    description: 'Execute a tick on an actor',
    inputSchema: {
        type: 'object',
        properties: {
            actorId: {
                type: 'string',
                description: 'ID of the actor to tick',
            },
        },
        required: ['actorId'],
    },
    handler: async (args) => {
        const { actorId } = args;
        // This would integrate with the ActorPort to tick an actor
        return {
            actorId,
            ticked: true,
            timestamp: Date.now(),
        };
    },
};
export const compileContextTool = {
    name: 'compile_context',
    description: 'Compile context from various sources',
    inputSchema: {
        type: 'object',
        properties: {
            sources: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of context sources',
            },
            text: {
                type: 'string',
                description: 'Text to compile into context',
            },
        },
        required: ['sources'],
    },
    handler: async (args) => {
        const { sources, text = '' } = args;
        // This would integrate with the ContextPort to compile context
        return {
            contextId: `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            sources,
            text,
            compiled: true,
            timestamp: Date.now(),
        };
    },
};
// Factory function to create MCP adapter with default tools
export function makeMCPAdapterWithDefaults() {
    const adapter = makeMCPToolAdapter();
    // Register predefined tools as ToolSpec
    adapter.register({
        name: createActorTool.name,
        description: createActorTool.description,
        parameters: createActorTool.inputSchema.properties,
        runtime: 'local',
    });
    adapter.register({
        name: tickActorTool.name,
        description: tickActorTool.description,
        parameters: tickActorTool.inputSchema.properties,
        runtime: 'local',
    });
    adapter.register({
        name: compileContextTool.name,
        description: compileContextTool.description,
        parameters: compileContextTool.inputSchema.properties,
        runtime: 'local',
    });
    return adapter;
}
//# sourceMappingURL=index.js.map
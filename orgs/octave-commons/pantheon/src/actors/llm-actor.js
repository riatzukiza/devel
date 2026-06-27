/**
 * LLM-powered Actor Implementation
 * An actor that uses LLM to process messages and make decisions
 */
export function makeLLMActorAdapter() {
    const actors = new Map();
    const actorAdapter = {
        async tick(actorId) {
            const actor = actors.get(actorId);
            if (!actor) {
                throw new Error(`Actor ${actorId} not found`);
            }
            const { config, messages } = actor;
            // Build conversation history
            const conversation = [];
            // Add system prompt if provided
            if (config.systemPrompt) {
                conversation.push({
                    role: 'system',
                    content: config.systemPrompt,
                });
            }
            // Add recent messages (limit by maxMessages)
            const recentMessages = messages.slice(-(config.maxMessages || 10));
            conversation.push(...recentMessages);
            // If we have messages, get LLM response
            if (recentMessages.length > 0) {
                try {
                    const response = await config.llm.complete(conversation);
                    // Add response to message history
                    messages.push(response);
                    // Trim message history if it gets too long
                    if (messages.length > (config.maxMessages || 20)) {
                        messages.splice(0, messages.length - (config.maxMessages || 20));
                    }
                    console.log(`LLM Actor ${actorId} responded:`, response.content);
                }
                catch (error) {
                    console.error(`LLM Actor ${actorId} error:`, error);
                }
            }
            // Update last tick time
            actor.lastTick = Date.now();
            actors.set(actorId, actor);
        },
        async create(config) {
            const id = `llm-actor_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            const actor = {
                id,
                config,
                state: null,
                lastTick: Date.now(),
                messages: [],
            };
            actors.set(id, actor);
            console.log(`Created LLM actor ${id} with model: ${config.parameters.model || 'default'}`);
            return id;
        },
        async get(id) {
            const actor = actors.get(id);
            if (!actor)
                return null;
            // Return base Actor interface (hide internal message history)
            return {
                id: actor.id,
                config: actor.config,
                state: actor.state,
                lastTick: actor.lastTick,
            };
        },
    };
    // Additional methods for LLM actor management
    const adapter = {
        async addMessage(actorId, message) {
            const actor = actors.get(actorId);
            if (!actor) {
                throw new Error(`Actor ${actorId} not found`);
            }
            actor.messages.push(message);
            actors.set(actorId, actor);
        },
        async getMessages(actorId) {
            const actor = actors.get(actorId);
            if (!actor) {
                throw new Error(`Actor ${actorId} not found`);
            }
            return [...actor.messages];
        },
    };
    return Object.assign(actorAdapter, adapter);
}
//# sourceMappingURL=llm-actor.js.map
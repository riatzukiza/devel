/**
 * Concrete adapter implementations for Pantheon ports
 * Provides default implementations that can be used in development and testing
 */
export const makeContextAdapter = (deps) => {
    return {
        compile: async (opts) => {
            const { texts = [], sources, recentLimit, queryLimit, limit } = opts;
            // Get messages from sources
            const sourceMessages = await deps.getMessagesForSources(sources, {
                recentLimit,
                queryLimit,
                limit,
            });
            // Convert text inputs to messages
            const textMessages = texts.map((text) => ({
                role: 'user',
                content: text,
            }));
            // Combine and limit messages
            const allMessages = [...sourceMessages, ...textMessages];
            const finalLimit = limit || queryLimit || recentLimit || 100;
            return allMessages.slice(-finalLimit);
        },
    };
};
export const makeToolAdapter = (deps) => {
    const tools = new Map();
    return {
        register: (tool) => {
            tools.set(tool.name, tool);
            deps.registerTool?.(tool);
        },
        invoke: async (name, args) => {
            const tool = tools.get(name);
            if (!tool) {
                throw new Error(`Tool '${name}' not found`);
            }
            try {
                return await deps.invokeTool(name, args);
            }
            catch (error) {
                throw new Error(`Tool '${name}' execution failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
    };
};
export const makeLlmAdapter = (deps) => {
    return {
        complete: async (messages, opts) => {
            if (!messages || messages.length === 0) {
                throw new Error('No messages provided for completion');
            }
            try {
                return await deps.completeLLM(messages, opts);
            }
            catch (error) {
                throw new Error(`LLM completion failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
    };
};
export const makeMessageBusAdapter = (deps) => {
    const subscribers = new Set();
    return {
        send: async (msg) => {
            try {
                await deps.sendMessage(msg);
                // Notify all subscribers
                subscribers.forEach((handler) => {
                    try {
                        handler(msg);
                    }
                    catch (error) {
                        console.error('Message bus subscriber error:', error);
                    }
                });
            }
            catch (error) {
                throw new Error(`Failed to send message: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
        subscribe: (handler) => {
            subscribers.add(handler);
            // Also subscribe to external message source if available
            const externalUnsubscribe = deps.subscribeToMessages?.(handler);
            return () => {
                subscribers.delete(handler);
                externalUnsubscribe?.();
            };
        },
    };
};
export const makeSchedulerAdapter = (deps) => {
    return {
        every: (ms, f) => {
            return deps.scheduleInterval(ms, async () => {
                try {
                    await f();
                }
                catch (error) {
                    console.error('Scheduled task error:', error);
                }
            });
        },
        once: (ms, f) => {
            deps.scheduleTimeout(ms, async () => {
                try {
                    await f();
                }
                catch (error) {
                    console.error('Scheduled timeout error:', error);
                }
            });
        },
    };
};
export const makeActorStateAdapter = (deps) => {
    return {
        spawn: async (script, goal) => {
            const actorData = {
                script,
                goals: [goal],
                state: 'idle',
                metadata: {},
            };
            try {
                return await deps.createActor(actorData);
            }
            catch (error) {
                throw new Error(`Failed to spawn actor: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
        get: async (id) => {
            try {
                return await deps.getActor(id);
            }
            catch (error) {
                throw new Error(`Failed to get actor ${id}: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
        update: async (id, updates) => {
            try {
                return await deps.updateActor(id, updates);
            }
            catch (error) {
                throw new Error(`Failed to update actor ${id}: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
        list: async () => {
            try {
                return await deps.listActors();
            }
            catch (error) {
                throw new Error(`Failed to list actors: ${error instanceof Error ? error.message : String(error)}`);
            }
        },
    };
};
// === In-Memory Implementations for Testing ===
export const makeInMemoryContextAdapter = () => {
    const messages = new Map();
    return {
        compile: async (opts) => {
            const { texts = [], sources } = opts;
            // Get messages from sources (mock implementation)
            const sourceMessages = [];
            for (const source of sources) {
                const sourceMsgs = messages.get(source.id) || [];
                sourceMessages.push(...sourceMsgs);
            }
            // Convert text inputs to messages
            const textMessages = texts.map((text) => ({
                role: 'user',
                content: text,
            }));
            return [...sourceMessages, ...textMessages];
        },
    };
};
export const makeInMemoryToolAdapter = () => {
    const tools = new Map();
    return {
        register: (tool) => {
            tools.set(tool.name, tool);
        },
        invoke: async (name, args) => {
            const tool = tools.get(name);
            if (!tool) {
                throw new Error(`Tool '${name}' not found`);
            }
            // Mock tool execution
            return {
                tool: name,
                args,
                executed: true,
                timestamp: Date.now(),
            };
        },
    };
};
export const makeInMemoryLlmAdapter = () => {
    return {
        complete: async (messages) => {
            // Mock LLM response
            const lastMessage = messages[messages.length - 1];
            return {
                role: 'assistant',
                content: `Mock response to: ${lastMessage?.content || 'no input'}`,
            };
        },
    };
};
export const makeInMemoryMessageBusAdapter = () => {
    const subscribers = new Set();
    return {
        send: async (msg) => {
            subscribers.forEach((handler) => handler(msg));
        },
        subscribe: (handler) => {
            subscribers.add(handler);
            return () => subscribers.delete(handler);
        },
    };
};
export const makeInMemorySchedulerAdapter = () => {
    const intervals = new Set();
    const timeouts = new Set();
    return {
        every: (ms, f) => {
            const interval = setInterval(async () => {
                try {
                    await f();
                }
                catch (error) {
                    console.error('In-memory scheduler error:', error);
                }
            }, ms);
            intervals.add(interval);
            return () => {
                clearInterval(interval);
                intervals.delete(interval);
            };
        },
        once: (ms, f) => {
            const timeout = setTimeout(async () => {
                try {
                    await f();
                }
                catch (error) {
                    console.error('In-memory scheduler timeout error:', error);
                }
                timeouts.delete(timeout);
            }, ms);
            timeouts.add(timeout);
        },
        // Cleanup method to clear all scheduled tasks
        cleanup: () => {
            intervals.forEach((interval) => clearInterval(interval));
            timeouts.forEach((timeout) => clearTimeout(timeout));
            intervals.clear();
            timeouts.clear();
        },
    };
};
export const makeInMemoryActorStateAdapter = () => {
    const actors = new Map();
    let idCounter = 1;
    return {
        spawn: async (script, goal) => {
            const id = `actor_${idCounter++}`;
            const now = new Date();
            const actor = {
                id,
                script,
                goals: [goal],
                state: 'idle',
                createdAt: now,
                updatedAt: now,
                metadata: {},
            };
            actors.set(id, actor);
            return actor;
        },
        get: async (id) => {
            return actors.get(id) || null;
        },
        update: async (id, updates) => {
            const actor = actors.get(id);
            if (!actor) {
                throw new Error(`Actor ${id} not found`);
            }
            const updatedActor = {
                ...actor,
                ...updates,
                updatedAt: new Date(),
            };
            actors.set(id, updatedActor);
            return updatedActor;
        },
        list: async () => {
            return Array.from(actors.values());
        },
    };
};
//# sourceMappingURL=adapters.js.map
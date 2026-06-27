export function makeContextAdapter() {
    // Create a simple in-memory store for now since we need collections
    const contexts = new Map();
    return {
        async compile(sources, text) {
            const id = `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            const compiled = { sources, text, processed: true };
            const context = {
                id,
                sources,
                text,
                compiled,
                timestamp: Date.now(),
            };
            contexts.set(id, context);
            return context;
        },
        async get(id) {
            return contexts.get(id) || null;
        },
        async save(context) {
            contexts.set(context.id, context);
        },
    };
}
//# sourceMappingURL=context.js.map
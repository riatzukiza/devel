export function makeOrchestrator(deps) {
    const { toolPort, contextPort, actorPort } = deps;
    return {
        async processCommand(command, args) {
            return await toolPort.execute(command, args);
        },
        async compileContext(sources, text) {
            return await contextPort.compile(sources, text);
        },
        async tickActor(actorId) {
            return await actorPort.tick(actorId);
        },
        async createActor(config) {
            return await actorPort.create(config);
        },
        async getActor(actorId) {
            return await actorPort.get(actorId);
        },
    };
}
//# sourceMappingURL=orchestrator.js.map
import type { ToolPort, ContextPort, ActorPort } from './ports.js';
import type { Actor, Context } from './types.js';
export interface OrchestratorDeps {
    toolPort: ToolPort;
    contextPort: ContextPort;
    actorPort: ActorPort;
}
export declare function makeOrchestrator(deps: OrchestratorDeps): {
    processCommand(command: string, args?: Record<string, unknown>): Promise<unknown>;
    compileContext(sources: string[], text: string): Promise<Context>;
    tickActor(actorId: string): Promise<void>;
    createActor(config: any): Promise<string>;
    getActor(actorId: string): Promise<Actor | null>;
};
//# sourceMappingURL=orchestrator.d.ts.map
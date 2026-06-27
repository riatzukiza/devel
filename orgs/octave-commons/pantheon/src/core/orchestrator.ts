/**
 * Minimal orchestrator wiring for the legacy core surface.
 */
import type { ToolPort, ContextPort, ActorPort } from './ports.js';
import type { Actor } from './types.js';

export interface OrchestratorDeps {
  toolPort: ToolPort;
  contextPort: ContextPort;
  actorPort: ActorPort;
}

export function makeOrchestrator(deps: OrchestratorDeps) {
  const { toolPort, contextPort, actorPort } = deps;

  return {
    async processCommand(command: string, args?: Record<string, unknown>): Promise<unknown> {
      return await toolPort.invoke(command, args ?? {});
    },

    async compileContext(sources: string[], text: string) {
      return await contextPort.compile({
        sources: sources.map((id) => ({ id, label: id })),
        texts: [text],
      });
    },

    async tickActor(actorId: string): Promise<void> {
      return await actorPort.tick(actorId);
    },

    async createActor(config: any): Promise<string> {
      return await actorPort.create(config);
    },

    async getActor(actorId: string): Promise<Actor | null> {
      return await actorPort.get(actorId);
    },
  };
}

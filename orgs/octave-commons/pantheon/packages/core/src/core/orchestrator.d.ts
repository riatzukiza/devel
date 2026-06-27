/**
 * Orchestrator — Core coordination engine for actors, behaviors, and actions
 */
import type { Actor, Action } from './types.js';
import type { ContextPort as IContextPort, ToolPort as IToolPort, LlmPort as ILlmPort, MessageBus as IMessageBus, Scheduler as IScheduler, ActorStatePort as IActorStatePort } from './ports.js';
export type OrchestratorDeps = {
    now: () => number;
    log: (msg: string, meta?: unknown) => void;
    context: IContextPort;
    tools: IToolPort;
    llm: ILlmPort;
    bus: IMessageBus;
    schedule: IScheduler;
    state: IActorStatePort;
};
export declare const makeOrchestrator: (deps: OrchestratorDeps) => {
    tickActor: (actor: Actor, input?: {
        userMessage?: string;
    }) => Promise<void>;
    startActorLoop: (actor: Actor, intervalMs?: number) => (() => void);
    executeAction: (action: Action, actor: Actor) => Promise<void>;
    cleanupActor: (actorId: string) => Promise<void>;
    pauseActor: (actorId: string) => Promise<void>;
    resumeActor: (actorId: string) => Promise<void>;
};
//# sourceMappingURL=orchestrator.d.ts.map
/**
 * Concrete adapter implementations for Pantheon ports
 * Provides default implementations that can be used in development and testing
 */
import type { ContextSource, ToolSpec, Actor, Message } from './types.js';
import type { ContextPort, ToolPort, LlmPort, MessageBus, Scheduler, ActorStatePort } from './ports.js';
export type ContextAdapterDeps = {
    getMessagesForSources: (sources: readonly ContextSource[], opts?: {
        recentLimit?: number;
        queryLimit?: number;
        limit?: number;
    }) => Promise<Message[]>;
    resolveRole?: (meta?: any) => 'system' | 'user' | 'assistant';
    resolveName?: (meta?: any) => string;
    formatTime?: (ms: number) => string;
};
export declare const makeContextAdapter: (deps: ContextAdapterDeps) => ContextPort;
export type ToolAdapterDeps = {
    invokeTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
    listTools?: () => Promise<string[]>;
    registerTool?: (tool: ToolSpec) => void;
    getToolSchema?: (name: string) => Promise<Record<string, unknown>>;
};
export declare const makeToolAdapter: (deps: ToolAdapterDeps) => ToolPort;
export type LlmAdapterDeps = {
    completeLLM: (messages: Message[], opts?: {
        model?: string;
        temperature?: number;
    }) => Promise<Message>;
};
export declare const makeLlmAdapter: (deps: LlmAdapterDeps) => LlmPort;
export type MessageBusAdapterDeps = {
    sendMessage: (msg: {
        from: string;
        to: string;
        content: string;
    }) => Promise<void>;
    subscribeToMessages?: (handler: (msg: {
        from: string;
        to: string;
        content: string;
    }) => void) => () => void;
};
export declare const makeMessageBusAdapter: (deps: MessageBusAdapterDeps) => MessageBus;
export type SchedulerAdapterDeps = {
    scheduleInterval: (ms: number, f: () => Promise<void>) => () => void;
    scheduleTimeout: (ms: number, f: () => Promise<void>) => void;
};
export declare const makeSchedulerAdapter: (deps: SchedulerAdapterDeps) => Scheduler;
export type ActorStateAdapterDeps = {
    createActor: (actor: Omit<Actor, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Actor>;
    getActor: (id: string) => Promise<Actor | null>;
    updateActor: (id: string, updates: Partial<Actor>) => Promise<Actor>;
    listActors: () => Promise<Actor[]>;
    generateId: () => string;
};
export declare const makeActorStateAdapter: (deps: ActorStateAdapterDeps) => ActorStatePort;
export declare const makeInMemoryContextAdapter: () => ContextPort;
export declare const makeInMemoryToolAdapter: () => ToolPort;
export declare const makeInMemoryLlmAdapter: () => LlmPort;
export declare const makeInMemoryMessageBusAdapter: () => MessageBus;
export declare const makeInMemorySchedulerAdapter: () => Scheduler;
export declare const makeInMemoryActorStateAdapter: () => ActorStatePort;
//# sourceMappingURL=adapters.d.ts.map
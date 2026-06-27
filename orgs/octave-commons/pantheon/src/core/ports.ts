import type { Actor, ActorConfig, ActorState, Message, ContextSource } from './types.js';

export interface ContextPort {
  compile: (opts: {
    texts?: readonly string[];
    sources: readonly ContextSource[];
    recentLimit?: number;
    queryLimit?: number;
    limit?: number;
  }) => Promise<Message[]>;
}

export interface ToolPort {
  register?: (tool: unknown) => void;
  invoke: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

export interface LlmPort {
  complete: (
    messages: Message[],
    opts?: { model?: string; temperature?: number },
  ) => Promise<Message>;
}

export interface ActorPort {
  tick: (actorId: string) => Promise<void>;
  create: (config: ActorConfig) => Promise<string>;
  get: (id: string) => Promise<Actor | null>;
}

export type { Actor, ActorConfig, ActorState, Message, ContextSource };
